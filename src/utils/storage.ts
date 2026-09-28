import { DailyLog, ReminderSettings, ThemeMode, UserProfile, WaterRecord } from '../types';
import { getTodayDateString } from './date';
import { calculateProgressTarget } from './waterMath';

const STORAGE_KEYS = {
  PROFILE: 'water_app_user_profile',
  DAILY_LOGS: 'water_app_daily_logs',
  REMINDER_SETTINGS: 'water_app_reminder_settings',
  THEME: 'water_app_theme',
  LAST_ACTIVE_DATE: 'water_app_last_active_date',
};

export const DEFAULT_PROFILE: UserProfile = {
  gender: 'female',
  weight: 60,
  activityLevel: 'moderate',
  isConfigured: false,
};

export const DEFAULT_REMINDER_SETTINGS: ReminderSettings = {
  enabled: true,
  intervalMinutes: 60,
  nextReminderTimestamp: Date.now() + 60 * 60 * 1000,
};

// --- Profile ---
export function loadUserProfile(): UserProfile {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PROFILE);
    if (!raw) return DEFAULT_PROFILE;
    const parsed = JSON.parse(raw);
    return {
      gender: parsed.gender || 'female',
      weight: Number(parsed.weight) || 60,
      activityLevel: parsed.activityLevel || 'moderate',
      isConfigured: Boolean(parsed.isConfigured),
    };
  } catch {
    return DEFAULT_PROFILE;
  }
}

export function saveUserProfile(profile: UserProfile): void {
  try {
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
  } catch (e) {
    console.error('Error saving user profile to localStorage', e);
  }
}

// --- Daily Logs & History ---
export function loadAllDailyLogs(): Record<string, DailyLog> {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.DAILY_LOGS);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export function saveAllDailyLogs(logs: Record<string, DailyLog>): void {
  try {
    localStorage.setItem(STORAGE_KEYS.DAILY_LOGS, JSON.stringify(logs));
  } catch (e) {
    console.error('Error saving daily logs to localStorage', e);
  }
}

/**
 * Loads today's log, performing automatic day rollover if the date has changed.
 */
export function getOrCreateTodayLog(weight: number): {
  todayLog: DailyLog;
  allLogs: Record<string, DailyLog>;
  didRollOver: boolean;
} {
  const today = getTodayDateString();
  const allLogs = loadAllDailyLogs();
  const lastActiveDate = localStorage.getItem(STORAGE_KEYS.LAST_ACTIVE_DATE);
  const target = calculateProgressTarget(weight);

  let didRollOver = false;
  if (lastActiveDate && lastActiveDate !== today) {
    didRollOver = true;
  }

  // Update last active date
  localStorage.setItem(STORAGE_KEYS.LAST_ACTIVE_DATE, today);

  if (allLogs[today]) {
    // If target has changed (e.g. user updated weight), update today's target
    const currentLog = allLogs[today];
    if (currentLog.target !== target) {
      currentLog.target = target;
      allLogs[today] = currentLog;
      saveAllDailyLogs(allLogs);
    }
    return { todayLog: currentLog, allLogs, didRollOver };
  }

  // New day log initialization
  const newLog: DailyLog = {
    date: today,
    totalAmount: 0,
    records: [],
    target,
  };
  allLogs[today] = newLog;
  saveAllDailyLogs(allLogs);

  return { todayLog: newLog, allLogs, didRollOver };
}

/**
 * Append a water record to today's log
 */
export function addWaterRecordToToday(
  record: WaterRecord,
  weight: number
): { todayLog: DailyLog; allLogs: Record<string, DailyLog> } {
  const { todayLog, allLogs } = getOrCreateTodayLog(weight);
  todayLog.records.push(record);
  todayLog.totalAmount = todayLog.records.reduce((sum, r) => sum + r.amount, 0);
  allLogs[todayLog.date] = todayLog;
  saveAllDailyLogs(allLogs);
  return { todayLog, allLogs };
}

/**
 * Undo the most recent water record of today
 */
export function undoLastWaterRecord(
  weight: number
): { todayLog: DailyLog; allLogs: Record<string, DailyLog>; removedRecord?: WaterRecord } {
  const { todayLog, allLogs } = getOrCreateTodayLog(weight);
  if (todayLog.records.length === 0) {
    return { todayLog, allLogs };
  }

  const removedRecord = todayLog.records.pop();
  todayLog.totalAmount = Math.max(0, todayLog.records.reduce((sum, r) => sum + r.amount, 0));
  allLogs[todayLog.date] = todayLog;
  saveAllDailyLogs(allLogs);

  return { todayLog, allLogs, removedRecord };
}

/**
 * Reset only today's water data (totalAmount -> 0, records -> [])
 * Preserves past days' history, statistics, target, and user settings!
 */
export function resetTodayWaterLog(
  weight: number
): { todayLog: DailyLog; allLogs: Record<string, DailyLog> } {
  const today = getTodayDateString();
  const allLogs = loadAllDailyLogs();
  const target = calculateProgressTarget(weight);

  const resetLog: DailyLog = {
    date: today,
    totalAmount: 0,
    records: [],
    target,
  };

  allLogs[today] = resetLog;
  saveAllDailyLogs(allLogs);
  return { todayLog: resetLog, allLogs };
}

// --- Reminders ---
export function loadReminderSettings(): ReminderSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.REMINDER_SETTINGS);
    if (!raw) return DEFAULT_REMINDER_SETTINGS;
    const parsed = JSON.parse(raw);
    return {
      enabled: parsed.enabled !== undefined ? Boolean(parsed.enabled) : true,
      intervalMinutes: Number(parsed.intervalMinutes) || 60,
      nextReminderTimestamp: Number(parsed.nextReminderTimestamp) || Date.now() + 60 * 60 * 1000,
    };
  } catch {
    return DEFAULT_REMINDER_SETTINGS;
  }
}

export function saveReminderSettings(settings: ReminderSettings): void {
  try {
    localStorage.setItem(STORAGE_KEYS.REMINDER_SETTINGS, JSON.stringify(settings));
  } catch (e) {
    console.error('Error saving reminder settings', e);
  }
}

// --- Theme ---
export function loadTheme(): ThemeMode {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.THEME) as ThemeMode;
    if (saved === 'light' || saved === 'dark') {
      return saved;
    }
    // Check system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  } catch {
    return 'light';
  }
}

export function saveTheme(theme: ThemeMode): void {
  try {
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  } catch (e) {
    console.error('Error saving theme', e);
  }
}
