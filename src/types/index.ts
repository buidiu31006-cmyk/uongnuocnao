export type Gender = 'male' | 'female' | 'other';
export type ActivityLevel = 'low' | 'moderate' | 'high';

export type UserRole = 'member' | 'admin';

export interface AppUser {
  uid: string;
  email: string;
  displayName?: string;
  role: UserRole;
  weight: number;
  gender: Gender;
  activityLevel: ActivityLevel;
  isConfigured: boolean;
  createdAt: string;
  updatedAt?: string;
}

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
  webPushEnabled?: boolean;
  fcmToken?: string;
}

export interface NotificationTemplate {
  id: string;
  title: string;
  body: string;
  active: boolean;
  createdBy?: string;
  createdAt?: string;
}

export type ThemeMode = 'light' | 'dark';

export type ActiveTab = 'today' | 'history' | 'stats' | 'settings' | 'admin';

export interface WaterValidationResult {
  allowed: boolean;
  reason?: 'EXCEEDS_SINGLE_LIMIT' | 'EXCEEDS_DAILY_LIMIT';
  message?: string;
}
