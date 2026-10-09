import { useState, useEffect, useCallback, useId } from 'react';
import confetti from 'canvas-confetti';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, testFirestoreConnection } from './firebase';
import {
  ActiveTab,
  AppUser,
  DailyLog,
  ReminderSettings,
  ThemeMode,
  UserProfile,
  WaterRecord,
} from './types';
import {
  DEFAULT_PROFILE,
  DEFAULT_REMINDER_SETTINGS,
  addWaterRecordToToday,
  getOrCreateTodayLog,
  loadAllDailyLogs,
  loadReminderSettings,
  loadTheme,
  loadUserProfile,
  saveAllDailyLogs,
  saveReminderSettings,
  saveTheme,
  saveUserProfile,
  undoLastWaterRecord,
  resetTodayWaterLog,
} from './utils/storage';
import { formatTime, getTodayDateString } from './utils/date';
import { playWaterDropletSound } from './utils/sound';
import {
  formatMl,
  validateWaterAddition,
} from './utils/waterMath';
import {
  getContextualNotification,
  NotificationMessage,
  WELCOME_BACK_MESSAGES,
} from './utils/notifications';
import {
  fetchAppUser,
  logoutUser,
  syncDailyLogToFirestore,
  fetchDailyLogsFromFirestore,
  syncReminderSettingsToFirestore,
  fetchReminderSettingsFromFirestore,
  updateUserProfileFirestore,
} from './services/firebaseService';
import {
  registerServiceWorker,
  requestPushPermission,
  showBackgroundNotification,
} from './utils/webPush';

import { Header } from './components/Header';
import { Navbar } from './components/Navbar';
import { TodayTab } from './components/TodayTab';
import { HistoryTab } from './components/HistoryTab';
import { StatsTab } from './components/StatsTab';
import { SettingsTab } from './components/SettingsTab';
import { AdminTab } from './components/AdminTab';
import { CustomWaterModal } from './components/CustomWaterModal';
import { ReminderModal } from './components/ReminderModal';
import { UserProfileModal } from './components/UserProfileModal';
import { AuthModal } from './components/AuthModal';
import { Toast, ToastMessage } from './components/Toast';

export default function App() {
  const [profile, setProfile] = useState<UserProfile>(loadUserProfile);
  const [theme, setTheme] = useState<ThemeMode>(loadTheme);
  const [activeTab, setActiveTab] = useState<ActiveTab>('today');
  const [reminderSettings, setReminderSettings] = useState<ReminderSettings>(loadReminderSettings);

  // Authenticated AppUser state
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Today log and history
  const [todayLog, setTodayLog] = useState<DailyLog>(() => {
    const { todayLog } = getOrCreateTodayLog(profile.weight);
    return todayLog;
  });
  const [allLogs, setAllLogs] = useState<Record<string, DailyLog>>(loadAllDailyLogs);

  // Modals & Popups
  const [isCustomWaterOpen, setIsCustomWaterOpen] = useState(false);
  const [isReminderOpen, setIsReminderOpen] = useState(false);
  const [currentReminderNotif, setCurrentReminderNotif] = useState<NotificationMessage | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(!profile.isConfigured);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);

  // Toast notifications
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const idPrefix = useId();

  // Helper to push toasts
  const showToast = useCallback((type: 'success' | 'warning' | 'info', message: string) => {
    const id = `${idPrefix}-${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3800);
  }, [idPrefix]);

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Sync theme changes to HTML document element
  useEffect(() => {
    saveTheme(theme);
  }, [theme]);

  // Initialize Service Worker, Firestore connection, and Firebase Auth listener
  useEffect(() => {
    registerServiceWorker();
    testFirestoreConnection();

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const user = await fetchAppUser(firebaseUser.uid);
          setCurrentUser(user);

          // Sync user personal profile
          if (user.weight) {
            const syncedProfile: UserProfile = {
              weight: user.weight,
              gender: user.gender,
              activityLevel: user.activityLevel,
              isConfigured: user.isConfigured,
            };
            setProfile(syncedProfile);
            saveUserProfile(syncedProfile);
          }

          // Fetch cloud logs
          const cloudLogs = await fetchDailyLogsFromFirestore(firebaseUser.uid);
          if (cloudLogs && Object.keys(cloudLogs).length > 0) {
            setAllLogs(cloudLogs);
            saveAllDailyLogs(cloudLogs);
            const today = getTodayDateString();
            if (cloudLogs[today]) {
              setTodayLog(cloudLogs[today]);
            }
          }

          // Fetch cloud reminder settings
          const cloudReminders = await fetchReminderSettingsFromFirestore(firebaseUser.uid);
          if (cloudReminders) {
            setReminderSettings(cloudReminders);
            saveReminderSettings(cloudReminders);
          }
        } catch (err) {
          console.warn('Sync on auth change error:', err);
        }
      } else {
        setCurrentUser(null);
      }
    });

    return () => unsubscribe();
  }, []);

  // Periodic day-rollover check (every 30 seconds)
  useEffect(() => {
    const checkDayRollover = () => {
      const today = getTodayDateString();
      if (todayLog.date !== today) {
        const { todayLog: newTodayLog, allLogs: updatedLogs } = getOrCreateTodayLog(profile.weight);
        setTodayLog(newTodayLog);
        setAllLogs(updatedLogs);
        if (currentUser) {
          syncDailyLogToFirestore(currentUser.uid, newTodayLog).catch(() => {});
        }
        showToast('info', '🌅 Đã tự động chuyển sang ngày mới.');
      }
    };

    checkDayRollover();
    const interval = setInterval(checkDayRollover, 30000);
    return () => clearInterval(interval);
  }, [todayLog.date, profile.weight, showToast, currentUser]);

  // Request browser notification permission helper
  const requestNotificationPermission = async (): Promise<boolean> => {
    const perm = await requestPushPermission();
    if (perm === 'granted') {
      showToast('success', 'Đã bật Web Push & thông báo nhắc nhở nền!');
      return true;
    } else {
      showToast('warning', 'Quyền thông báo chưa được cấp.');
      return false;
    }
  };

  // Schedule background check for reminders (runs every 10 seconds)
  useEffect(() => {
    if (!reminderSettings.enabled) return;

    const checkReminder = () => {
      const now = Date.now();
      if (now >= reminderSettings.nextReminderTimestamp) {
        const notif = getContextualNotification(todayLog.totalAmount, todayLog.target) || {
          title: '💧 Alooo, uống nước đi bà!',
          body: 'Cơ thể đang réo tên bạn đó 😭 Đi làm một ngụm ngay đi!',
        };
        setCurrentReminderNotif(notif);
        setIsReminderOpen(true);

        // Web Push / Service Worker Background Notification
        showBackgroundNotification(notif.title, notif.body);

        // Schedule next reminder timestamp
        const nextTime = now + reminderSettings.intervalMinutes * 60 * 1000;
        const updatedSettings: ReminderSettings = {
          ...reminderSettings,
          nextReminderTimestamp: nextTime,
        };
        setReminderSettings(updatedSettings);
        saveReminderSettings(updatedSettings);

        if (currentUser) {
          syncReminderSettingsToFirestore(currentUser.uid, updatedSettings).catch(() => {});
        }
      }
    };

    const intervalId = setInterval(checkReminder, 10000);
    return () => clearInterval(intervalId);
  }, [reminderSettings, todayLog.totalAmount, todayLog.target, currentUser]);

  // Welcome back notification on tab focus
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const lastActivityStr = localStorage.getItem('water_app_last_active');
        const now = Date.now();
        if (lastActivityStr) {
          const lastActive = parseInt(lastActivityStr, 10);
          const minutesDiff = (now - lastActive) / (1000 * 60);

          if (minutesDiff >= 90) {
            const randomWelcome =
              WELCOME_BACK_MESSAGES[Math.floor(Math.random() * WELCOME_BACK_MESSAGES.length)];
            showToast('info', randomWelcome.body);
          }
        }
        localStorage.setItem('water_app_last_active', String(now));
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [showToast]);

  // Add water intake record
  const handleAddWater = (amount: number) => {
    const targetMl = todayLog.target || 1950;
    const currentMl = todayLog.totalAmount || 0;

    const validation = validateWaterAddition(currentMl, targetMl, amount);
    if (!validation.allowed) {
      showToast('warning', validation.message || 'Không thể thêm lượng nước này.');
      return;
    }

    const now = new Date();
    const newRecord: WaterRecord = {
      id: `${now.getTime()}-${Math.random().toString(36).substr(2, 6)}`,
      amount,
      timestamp: now.getTime(),
      timeStr: formatTime(now.getTime()),
    };

    const { todayLog: updatedToday, allLogs: updatedAll } = addWaterRecordToToday(
      newRecord,
      profile.weight
    );

    setTodayLog({ ...updatedToday });
    setAllLogs({ ...updatedAll });

    // Sync to Firestore if authenticated
    if (currentUser) {
      syncDailyLogToFirestore(currentUser.uid, updatedToday).catch((err) => {
        console.warn('Sync error:', err);
      });
    }

    // Sound effect
    playWaterDropletSound();

    // Reset countdown timer
    if (reminderSettings.enabled) {
      const nextTime = Date.now() + reminderSettings.intervalMinutes * 60 * 1000;
      const updatedReminder = {
        ...reminderSettings,
        nextReminderTimestamp: nextTime,
      };
      setReminderSettings(updatedReminder);
      saveReminderSettings(updatedReminder);
      if (currentUser) {
        syncReminderSettingsToFirestore(currentUser.uid, updatedReminder).catch(() => {});
      }
    }

    showToast('success', `Đã ghi nhận +${formatMl(amount)} ml nước 💧`);

    // Milestone celebration: Check if user just reached or passed 100% goal
    const prevPercent = Math.round((currentMl / targetMl) * 100);
    const newPercent = Math.round(((currentMl + amount) / targetMl) * 100);

    if (prevPercent < 100 && newPercent >= 100) {
      try {
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#38bdf8', '#0284c7', '#06b6d4', '#67e8f9'],
        });
      } catch {
        // Confetti fallback
      }
    }
  };

  // Undo last water record
  const handleUndoLast = () => {
    const { todayLog: updatedToday, allLogs: updatedAll, removedRecord } = undoLastWaterRecord(
      profile.weight
    );

    if (removedRecord) {
      setTodayLog({ ...updatedToday });
      setAllLogs({ ...updatedAll });

      if (currentUser) {
        syncDailyLogToFirestore(currentUser.uid, updatedToday).catch(() => {});
      }

      showToast('info', `Đã hoàn tác lần ghi nhận ${formatMl(removedRecord.amount)} ml`);
    } else {
      showToast('warning', 'Không còn lần ghi nhận nào để hoàn tác.');
    }
  };

  // Custom water confirmation
  const handleConfirmCustomWater = (amount: number) => {
    setIsCustomWaterOpen(false);
    handleAddWater(amount);
  };

  // Reminder popup "UỐNG NGAY"
  const handleDrinkNowFromReminder = () => {
    setIsReminderOpen(false);
    setActiveTab('today');
    setTimeout(() => {
      const section = document.getElementById('water-intake-section');
      if (section) {
        section.scrollIntoView({ behavior: 'smooth', block: 'center' });
        section.classList.add('ring-2', 'ring-sky-400');
        setTimeout(() => {
          section.classList.remove('ring-2', 'ring-sky-400');
        }, 1800);
      }
    }, 120);
    showToast('info', 'Hãy chọn lượng nước bạn vừa uống phía dưới ✨');
  };

  // Reminder popup "ĐỂ SAU"
  const handleLaterFromReminder = () => {
    setIsReminderOpen(false);
    const nextTime = Date.now() + reminderSettings.intervalMinutes * 60 * 1000;
    const updated = {
      ...reminderSettings,
      nextReminderTimestamp: nextTime,
    };
    setReminderSettings(updated);
    saveReminderSettings(updated);
    if (currentUser) {
      syncReminderSettingsToFirestore(currentUser.uid, updated).catch(() => {});
    }
    showToast('info', `Đã dời nhắc nhở sau ${reminderSettings.intervalMinutes} phút ⏰`);
  };

  // Save updated profile
  const handleSaveProfile = (newProfile: UserProfile) => {
    saveUserProfile(newProfile);
    setProfile(newProfile);
    setIsProfileModalOpen(false);
    setIsEditProfileOpen(false);

    // Update today's target with new weight
    const { todayLog: updatedToday, allLogs: updatedAll } = getOrCreateTodayLog(newProfile.weight);
    setTodayLog({ ...updatedToday });
    setAllLogs({ ...updatedAll });

    if (currentUser) {
      updateUserProfileFirestore(currentUser.uid, {
        weight: newProfile.weight,
        gender: newProfile.gender,
        activityLevel: newProfile.activityLevel,
        isConfigured: true,
      }).catch(() => {});
      syncDailyLogToFirestore(currentUser.uid, updatedToday).catch(() => {});
    }

    showToast('success', 'Đã lưu thông tin cá nhân!');
  };

  // Update reminder settings
  const handleUpdateReminder = (newSettings: ReminderSettings) => {
    setReminderSettings(newSettings);
    saveReminderSettings(newSettings);
    if (currentUser) {
      syncReminderSettingsToFirestore(currentUser.uid, newSettings).catch(() => {});
    }
  };

  // Reset only today's water data (totalAmount -> 0 ml, records -> [])
  const handleResetTodayWater = () => {
    const { todayLog: resetToday, allLogs: updatedAll } = resetTodayWaterLog(profile.weight);
    setTodayLog({ ...resetToday });
    setAllLogs({ ...updatedAll });

    if (currentUser) {
      syncDailyLogToFirestore(currentUser.uid, resetToday).catch(() => {});
    }

    showToast('info', '↻ Đã đặt lại dữ liệu hôm nay.');
  };

  // Auth Success Callback
  const handleAuthSuccess = (user: AppUser) => {
    setCurrentUser(user);
    showToast('success', `Xin chào ${user.displayName || user.email}!`);
  };

  // Logout Handler
  const handleLogout = async () => {
    try {
      await logoutUser();
      setCurrentUser(null);
      if (activeTab === 'admin') {
        setActiveTab('today');
      }
      showToast('info', 'Đã đăng xuất tài khoản.');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/70 dark:bg-slate-950 text-slate-900 dark:text-white flex flex-col font-sans transition-colors duration-300">
      {/* Toast notifications */}
      <Toast toasts={toasts} onDismiss={dismissToast} />

      {/* Header with App Title, Auth Status and Single Light/Dark Switcher */}
      <Header
        theme={theme}
        onToggleTheme={() => setTheme((t) => (t === 'light' ? 'dark' : 'light'))}
        currentUser={currentUser}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onLogout={handleLogout}
      />

      {/* Navigation Bar (with Admin Tab if authorized) */}
      <Navbar
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        isAdmin={currentUser?.role === 'admin'}
      />

      {/* Main Content View Container */}
      <main className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 pt-2 pb-24 md:pb-12">
        {activeTab === 'today' && (
          <TodayTab
            userProfile={profile}
            todayLog={todayLog}
            reminderSettings={reminderSettings}
            onAddWater={handleAddWater}
            onUndoLast={handleUndoLast}
            onOpenCustomModal={() => setIsCustomWaterOpen(true)}
            onToggleReminder={(enabled) =>
              handleUpdateReminder({
                ...reminderSettings,
                enabled,
                nextReminderTimestamp: Date.now() + reminderSettings.intervalMinutes * 60 * 1000,
              })
            }
            onChangeReminderInterval={(mins) =>
              handleUpdateReminder({
                ...reminderSettings,
                intervalMinutes: mins,
                nextReminderTimestamp: Date.now() + mins * 60 * 1000,
              })
            }
          />
        )}

        {activeTab === 'history' && (
          <HistoryTab allLogs={allLogs} todayLog={todayLog} />
        )}

        {activeTab === 'stats' && (
          <StatsTab allLogs={allLogs} todayLog={todayLog} />
        )}

        {activeTab === 'settings' && (
          <SettingsTab
            userProfile={profile}
            reminderSettings={reminderSettings}
            onUpdateProfile={handleSaveProfile}
            onUpdateReminder={handleUpdateReminder}
            onRequestNotificationPermission={requestNotificationPermission}
            onResetTodayWater={handleResetTodayWater}
            onOpenEditProfileModal={() => setIsEditProfileOpen(true)}
            currentUser={currentUser}
            onOpenAuth={() => setIsAuthModalOpen(true)}
            onLogout={handleLogout}
          />
        )}

        {activeTab === 'admin' && (
          <AdminTab
            currentUser={currentUser}
            onRefreshUserRole={async () => {
              if (currentUser) {
                const refreshed = await fetchAppUser(currentUser.uid);
                setCurrentUser(refreshed);
              }
            }}
          />
        )}
      </main>

      {/* Custom Water Input Modal */}
      <CustomWaterModal
        isOpen={isCustomWaterOpen}
        onClose={() => setIsCustomWaterOpen(false)}
        onConfirm={handleConfirmCustomWater}
        currentTotal={todayLog.totalAmount}
        target={todayLog.target}
      />

      {/* Reminder Popup Modal */}
      <ReminderModal
        isOpen={isReminderOpen}
        notification={currentReminderNotif}
        onDrinkNow={handleDrinkNowFromReminder}
        onLater={handleLaterFromReminder}
      />

      {/* First Launch Onboarding Profile Modal (only if not configured and not logged in) */}
      <UserProfileModal
        isOpen={isProfileModalOpen && !currentUser}
        initialProfile={profile}
        onSave={handleSaveProfile}
        isFirstLaunch={true}
      />

      {/* Edit Profile Modal */}
      <UserProfileModal
        isOpen={isEditProfileOpen}
        initialProfile={profile}
        onSave={handleSaveProfile}
        onClose={() => setIsEditProfileOpen(false)}
        isFirstLaunch={false}
      />

      {/* Auth Modal (Login / Register / Forgot Password) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
        defaultWeight={profile.weight}
        defaultGender={profile.gender}
        defaultActivity={profile.activityLevel}
      />
    </div>
  );
}
