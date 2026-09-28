import { useState, useEffect, useCallback, useId } from 'react';
import confetti from 'canvas-confetti';
import {
  ActiveTab,
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

import { Header } from './components/Header';
import { Navbar } from './components/Navbar';
import { TodayTab } from './components/TodayTab';
import { HistoryTab } from './components/HistoryTab';
import { StatsTab } from './components/StatsTab';
import { SettingsTab } from './components/SettingsTab';
import { CustomWaterModal } from './components/CustomWaterModal';
import { ReminderModal } from './components/ReminderModal';
import { UserProfileModal } from './components/UserProfileModal';
import { Toast, ToastMessage } from './components/Toast';

export default function App() {
  const [profile, setProfile] = useState<UserProfile>(loadUserProfile);
  const [theme, setTheme] = useState<ThemeMode>(loadTheme);
  const [activeTab, setActiveTab] = useState<ActiveTab>('today');
  const [reminderSettings, setReminderSettings] = useState<ReminderSettings>(loadReminderSettings);

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

  // Periodic day-rollover check (every 30 seconds)
  useEffect(() => {
    const checkDayRollover = () => {
      const today = getTodayDateString();
      if (todayLog.date !== today) {
        const { todayLog: newTodayLog, allLogs: updatedLogs } = getOrCreateTodayLog(profile.weight);
        setTodayLog(newTodayLog);
        setAllLogs(updatedLogs);
        showToast('info', '🌅 Đã tự động chuyển sang ngày mới.');
      }
    };

    const interval = setInterval(checkDayRollover, 30000);
    return () => clearInterval(interval);
  }, [todayLog.date, profile.weight, showToast]);

  // Welcome back notification when returning to app after being away (> 15 minutes)
  useEffect(() => {
    let lastBlurTime = Date.now();

    const handleVisibilityChange = () => {
      if (document.hidden) {
        lastBlurTime = Date.now();
      } else {
        const awayDurationMs = Date.now() - lastBlurTime;
        const percentage = todayLog.target > 0 ? (todayLog.totalAmount / todayLog.target) * 100 : 0;
        
        // If away for more than 15 minutes, not yet at 120%, and hasn't logged water in the last 15 minutes
        if (awayDurationMs >= 15 * 60 * 1000 && percentage < 120) {
          const lastRecord = todayLog.records[todayLog.records.length - 1];
          const timeSinceLastRecord = lastRecord ? Date.now() - lastRecord.timestamp : Infinity;
          
          if (timeSinceLastRecord >= 15 * 60 * 1000) {
            const welcomeMsg = WELCOME_BACK_MESSAGES[Math.floor(Math.random() * WELCOME_BACK_MESSAGES.length)];
            showToast('info', `${welcomeMsg.title} ${welcomeMsg.body}`);
          }
        }
        lastBlurTime = Date.now();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [todayLog.totalAmount, todayLog.target, todayLog.records, showToast]);

  // Reminder interval checker (trendy, situational, respects 120% limit)
  useEffect(() => {
    if (!reminderSettings.enabled) return;

    const checkReminder = () => {
      const now = Date.now();
      if (now >= reminderSettings.nextReminderTimestamp) {
        // Calculate situational trendy notification
        const notif = getContextualNotification(todayLog.totalAmount, todayLog.target);

        // If >= 120%, notif is null -> STOP sending notifications to drink more!
        if (!notif) {
          const nextTime = now + reminderSettings.intervalMinutes * 60 * 1000;
          const updated = {
            ...reminderSettings,
            nextReminderTimestamp: nextTime,
          };
          setReminderSettings(updated);
          saveReminderSettings(updated);
          return;
        }

        // Trigger trendy in-app popup modal (No sound effect on popup)
        setCurrentReminderNotif(notif);
        setIsReminderOpen(true);

        // Browser notification if permitted
        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
          try {
            new Notification(notif.title, {
              body: notif.body,
              icon: '/favicon.ico',
            });
          } catch {
            // Ignore notification error
          }
        }

        // Set next reminder time
        const nextTime = now + reminderSettings.intervalMinutes * 60 * 1000;
        const updated = {
          ...reminderSettings,
          nextReminderTimestamp: nextTime,
        };
        setReminderSettings(updated);
        saveReminderSettings(updated);
      }
    };

    const interval = setInterval(checkReminder, 5000); // Check every 5s
    return () => clearInterval(interval);
  }, [reminderSettings, todayLog.totalAmount, todayLog.target]);

  // Request browser notification permission
  const requestNotificationPermission = async (): Promise<boolean> => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      showToast('warning', 'Trình duyệt này không hỗ trợ Notification API.');
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      if (result === 'granted') {
        showToast('success', 'Đã cấp quyền thông báo trình duyệt!');
        return true;
      } else {
        showToast('warning', 'Quyền thông báo chưa được cấp.');
        return false;
      }
    } catch {
      return false;
    }
  };

  // Add water action
  const handleAddWater = (amount: number) => {
    const target = todayLog.target || 1950;
    const current = todayLog.totalAmount || 0;

    const validation = validateWaterAddition(current, target, amount);

    if (!validation.allowed) {
      showToast('warning', validation.message || 'Không thể thêm lượng nước này.');
      return;
    }

    const now = Date.now();
    const newRecord: WaterRecord = {
      id: `water-${now}-${Math.random().toString(36).substring(2, 6)}`,
      amount,
      timestamp: now,
      timeStr: formatTime(now),
    };

    const { todayLog: updatedToday, allLogs: updatedAll } = addWaterRecordToToday(
      newRecord,
      profile.weight
    );

    setTodayLog({ ...updatedToday });
    setAllLogs({ ...updatedAll });

    playWaterDropletSound();
    showToast('success', `Đã thêm ${formatMl(amount)} ml 💧`);

    // Celebrate milestone if reached 100% for the first time
    const previousPercentage = Math.round((current / target) * 100);
    const newPercentage = Math.round((updatedToday.totalAmount / target) * 100);

    if (previousPercentage < 100 && newPercentage >= 100) {
      try {
        confetti({
          particleCount: 50,
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

  // Reminder popup "UỐNG NGAY": Closes popup, scrolls to water buttons, does NOT auto-add
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

  // Reminder popup "ĐỂ SAU": Closes popup, resets timer to next interval without immediate re-popup
  const handleLaterFromReminder = () => {
    setIsReminderOpen(false);
    const nextTime = Date.now() + reminderSettings.intervalMinutes * 60 * 1000;
    const updated = {
      ...reminderSettings,
      nextReminderTimestamp: nextTime,
    };
    setReminderSettings(updated);
    saveReminderSettings(updated);
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

    showToast('success', 'Đã lưu thông tin cá nhân!');
  };

  // Update reminder settings
  const handleUpdateReminder = (newSettings: ReminderSettings) => {
    setReminderSettings(newSettings);
    saveReminderSettings(newSettings);
  };

  // Reset all data
  const handleResetAllData = () => {
    localStorage.clear();
    setProfile(DEFAULT_PROFILE);
    setReminderSettings(DEFAULT_REMINDER_SETTINGS);
    const { todayLog: resetToday, allLogs: resetAll } = getOrCreateTodayLog(DEFAULT_PROFILE.weight);
    setTodayLog(resetToday);
    setAllLogs(resetAll);
    saveAllDailyLogs(resetAll);
    setIsProfileModalOpen(true);
    setActiveTab('today');
    showToast('info', 'Toàn bộ dữ liệu đã được đặt lại.');
  };

  // Reset only today's water data (totalAmount -> 0 ml, records -> [])
  const handleResetTodayWater = () => {
    const { todayLog: resetToday, allLogs: updatedAll } = resetTodayWaterLog(profile.weight);
    setTodayLog({ ...resetToday });
    setAllLogs({ ...updatedAll });
    showToast('info', '↻ Đã đặt lại dữ liệu hôm nay.');
  };

  return (
    <div className="min-h-screen bg-slate-50/70 dark:bg-slate-950 text-slate-900 dark:text-white flex flex-col font-sans transition-colors duration-300">
      {/* Toast notifications */}
      <Toast toasts={toasts} onDismiss={dismissToast} />

      {/* Header with App Title and Single Light/Dark Switcher */}
      <Header
        theme={theme}
        onToggleTheme={() => setTheme((t) => (t === 'light' ? 'dark' : 'light'))}
      />

      {/* Desktop / Tablet Navigation Bar */}
      <Navbar activeTab={activeTab} onChangeTab={setActiveTab} />

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

      {/* First Launch Onboarding Profile Modal */}
      <UserProfileModal
        isOpen={isProfileModalOpen}
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
    </div>
  );
}
