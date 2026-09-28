export type Gender = 'male' | 'female' | 'other';
export type ActivityLevel = 'low' | 'moderate' | 'high';

export interface UserProfile {
  gender: Gender;
  weight: number; // in kg
  activityLevel: ActivityLevel;
  isConfigured: boolean;
}

export interface WaterRecord {
  id: string;
  amount: number; // ml
  timestamp: number; // ms
  timeStr: string; // HH:mm
}

export interface DailyLog {
  date: string; // YYYY-MM-DD
  totalAmount: number; // ml
  records: WaterRecord[];
  target: number; // ml
}

export interface ReminderSettings {
  enabled: boolean;
  intervalMinutes: number; // 30, 60, 90, 120
  nextReminderTimestamp: number;
}

export type ThemeMode = 'light' | 'dark';

export type ActiveTab = 'today' | 'history' | 'stats' | 'settings';

export interface WaterValidationResult {
  allowed: boolean;
  reason?: 'EXCEEDS_SINGLE_LIMIT' | 'EXCEEDS_DAILY_LIMIT';
  message?: string;
}
