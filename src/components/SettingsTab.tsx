import React, { useState } from 'react';
import {
  User,
  Scale,
  Bell,
  Info,
  ShieldCheck,
  RotateCcw,
  CheckCircle2,
} from 'lucide-react';
import { ReminderSettings, UserProfile } from '../types';
import { calculateDailyLimit, calculateWaterRange, calculateProgressTarget, formatMl } from '../utils/waterMath';

interface SettingsTabProps {
  userProfile: UserProfile;
  reminderSettings: ReminderSettings;
  onUpdateProfile: (profile: UserProfile) => void;
  onUpdateReminder: (settings: ReminderSettings) => void;
  onRequestNotificationPermission: () => Promise<boolean>;
  onResetTodayWater: () => void;
  onOpenEditProfileModal: () => void;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({
  userProfile,
  reminderSettings,
  onUpdateReminder,
  onRequestNotificationPermission,
  onResetTodayWater,
  onOpenEditProfileModal,
}) => {
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [notificationStatus, setNotificationStatus] = useState<NotificationPermission>(
    typeof window !== 'undefined' && 'Notification' in window
      ? Notification.permission
      : 'denied'
  );

  const range = calculateWaterRange(userProfile.weight);
  const progressTarget = calculateProgressTarget(userProfile.weight);
  const dailyLimit = calculateDailyLimit(progressTarget);

  const genderLabels: Record<string, string> = {
    male: 'Nam',
    female: 'Nữ',
    other: 'Không muốn trả lời',
  };

  const activityLabels: Record<string, string> = {
    low: 'Ít vận động',
    moderate: 'Hoạt động vừa',
    high: 'Hoạt động nhiều',
  };

  const handleRequestPermission = async () => {
    const granted = await onRequestNotificationPermission();
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotificationStatus(Notification.permission);
    }
    if (granted) {
      onUpdateReminder({
        ...reminderSettings,
        enabled: true,
      });
    }
  };

  return (
    <div className="space-y-6 max-w-xl mx-auto pb-12">
      {/* Title */}
      <div>
        <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
          <span>⚙️ Cài đặt ứng dụng</span>
        </h2>
        <p className="text-xs text-slate-600 dark:text-slate-200 mt-0.5 font-medium">
          Tùy chỉnh mục tiêu, thông báo nhắc nhở và hồ sơ cá nhân
        </p>
      </div>

      {/* 1. Personal Information */}
      <section className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-xs border border-sky-100/70 dark:border-slate-700 transition-colors">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-sky-50 dark:bg-slate-800 text-sky-600 dark:text-cyan-300 flex items-center justify-center border border-transparent dark:border-slate-600">
              <User className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Thông tin cá nhân
            </h3>
          </div>
          <button
            onClick={onOpenEditProfileModal}
            className="py-1.5 px-3 rounded-xl border border-sky-300 dark:border-cyan-400 text-xs font-bold text-sky-700 dark:text-cyan-300 hover:bg-sky-50 dark:hover:bg-slate-800 transition-colors bg-white dark:bg-slate-800"
          >
            Chỉnh sửa
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2.5 pt-1">
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-center">
            <span className="text-[11px] text-slate-600 dark:text-slate-200 font-bold block">Cân nặng</span>
            <span className="text-base font-black text-slate-900 dark:text-white mt-0.5 block">
              {userProfile.weight} kg
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-center">
            <span className="text-[11px] text-slate-600 dark:text-slate-200 font-bold block">Giới tính</span>
            <span className="text-sm font-extrabold text-slate-900 dark:text-white mt-0.5 block truncate">
              {genderLabels[userProfile.gender] || 'Nữ'}
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-center">
            <span className="text-[11px] text-slate-600 dark:text-slate-200 font-bold block">Vận động</span>
            <span className="text-xs font-extrabold text-slate-900 dark:text-white mt-0.5 block truncate">
              {activityLabels[userProfile.activityLevel] || 'Vừa'}
            </span>
          </div>
        </div>
      </section>

      {/* 2. Water Target & Calculation Formula */}
      <section className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-xs border border-sky-100/70 dark:border-slate-700 transition-colors">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-9 h-9 rounded-xl bg-sky-50 dark:bg-slate-800 text-sky-600 dark:text-cyan-300 flex items-center justify-center border border-transparent dark:border-slate-600">
            <Scale className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Mục tiêu nước tham khảo
          </h3>
        </div>

        <div className="space-y-3">
          <div className="p-4 rounded-2xl bg-sky-50/80 dark:bg-slate-800 border border-sky-200/80 dark:border-slate-600 text-xs text-slate-800 dark:text-slate-100 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-slate-700 dark:text-slate-200 font-bold">Công thức:</span>
              <strong className="font-black text-slate-900 dark:text-white">Cân nặng × 30–35 ml</strong>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-700 dark:text-slate-200 font-bold">Mức tham khảo:</span>
              <strong className="font-black text-sky-700 dark:text-cyan-300 text-sm">
                {formatMl(range.min)} – {formatMl(range.max)} ml/ngày
              </strong>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-sky-200/60 dark:border-slate-700">
              <span className="font-bold text-slate-800 dark:text-slate-100">Mục tiêu tiến độ (32,5 ml/kg):</span>
              <span className="text-base font-black text-sky-600 dark:text-cyan-300">
                {formatMl(progressTarget)} ml
              </span>
            </div>
          </div>

          <p className="text-[11px] text-slate-600 dark:text-slate-200 italic leading-relaxed font-semibold">
            Lượng nước trên là mức tham khảo chung. Nhu cầu thực tế có thể thay đổi tùy cơ thể, thời tiết, mức độ vận động và tình trạng sức khỏe.
          </p>
        </div>
      </section>

      {/* 3. App Technical Limits */}
      <section className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-xs border border-sky-100/70 dark:border-slate-700 transition-colors">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-300 flex items-center justify-center border border-transparent dark:border-amber-700/60">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Giới hạn kỹ thuật ứng dụng
          </h3>
        </div>

        <div className="space-y-2.5 text-xs text-slate-800 dark:text-slate-100">
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-600">
            <span className="text-slate-700 dark:text-slate-200 font-bold">Giới hạn mỗi lần ghi nhận:</span>
            <strong className="font-black text-slate-900 dark:text-white">500 ml</strong>
          </div>
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-600">
            <span className="text-slate-700 dark:text-slate-200 font-bold">Giới hạn tổng trong ngày:</span>
            <strong className="font-black text-slate-900 dark:text-white">
              120% mục tiêu ({formatMl(dailyLimit)} ml)
            </strong>
          </div>
          <p className="text-[11px] text-slate-600 dark:text-slate-200 pt-1 leading-relaxed font-semibold">
            Đây là giới hạn kỹ thuật của ứng dụng để tránh người dùng vô tình bấm nhầm số lượng quá lớn, không phải ngưỡng y tế bắt buộc áp dụng cho tất cả mọi người.
          </p>
        </div>
      </section>

      {/* 4. Reminder & Notification Settings */}
      <section className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-xs border border-sky-100/70 dark:border-slate-700 transition-colors">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-sky-50 dark:bg-slate-800 text-sky-600 dark:text-cyan-300 flex items-center justify-center border border-transparent dark:border-slate-600">
              <Bell className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Nhắc uống nước
            </h3>
          </div>

          {/* Toggle */}
          <button
            onClick={() =>
              onUpdateReminder({
                ...reminderSettings,
                enabled: !reminderSettings.enabled,
              })
            }
            className={`w-14 h-8 rounded-full p-1 transition-colors duration-300 focus:outline-none ${
              reminderSettings.enabled ? 'bg-sky-500' : 'bg-slate-300 dark:bg-slate-700'
            }`}
            aria-label="Bật hoặc tắt nhắc uống nước"
          >
            <div
              className={`w-6 h-6 rounded-full bg-white shadow-md transform transition-transform duration-300 ${
                reminderSettings.enabled ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Intervals */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-100 mb-2">
              Tần suất nhắc:
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[30, 60, 90, 120].map((mins) => (
                <button
                  key={mins}
                  onClick={() =>
                    onUpdateReminder({
                      ...reminderSettings,
                      intervalMinutes: mins,
                      nextReminderTimestamp: Date.now() + mins * 60 * 1000,
                    })
                  }
                  className={`py-2 px-1 text-xs font-bold rounded-xl transition-all ${
                    reminderSettings.intervalMinutes === mins
                      ? 'bg-sky-500 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-600'
                  }`}
                >
                  {mins} phút
                </button>
              ))}
            </div>
          </div>

          {/* Browser Notification Status */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-600 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-900 dark:text-white">
                Thông báo trình duyệt:
              </span>
              {notificationStatus === 'granted' ? (
                <span className="inline-flex items-center gap-1 text-xs font-extrabold text-emerald-600 dark:text-emerald-300">
                  <CheckCircle2 className="w-4 h-4" /> Đã bật
                </span>
              ) : (
                <button
                  onClick={handleRequestPermission}
                  className="py-1 px-3 rounded-lg bg-sky-500 hover:bg-sky-600 text-white text-xs font-extrabold transition-colors"
                >
                  Cho phép thông báo
                </button>
              )}
            </div>

            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700/80 flex items-start gap-2 text-[11px] text-amber-950 dark:text-amber-100 leading-relaxed font-semibold">
              <Info className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-300" />
              <span>
                Thông báo trình duyệt có thể không hoạt động khi trình duyệt đã đóng hoàn toàn vì ứng dụng không có máy chủ chạy nền.
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Reset Today's Water (Chức năng đặt lại dữ liệu nước trong ngày) */}
      <section className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-xs border border-amber-300 dark:border-amber-600/80 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
              Đặt lại dữ liệu nước trong ngày
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-200 mt-0.5 font-semibold">
              Xóa lượng nước đã ghi nhận hôm nay và đưa tiến độ về 0 ml
            </p>
          </div>

          <button
            onClick={() => setShowResetConfirm(true)}
            className="self-start sm:self-auto py-2.5 px-4 rounded-xl border border-amber-400 dark:border-amber-500 bg-amber-50 dark:bg-amber-950/70 text-xs font-black text-amber-900 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-900/60 transition-colors flex items-center gap-1.5 active:scale-95 shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>↻ Đặt lại hôm nay</span>
          </button>
        </div>

        {/* Confirmation Modal */}
        {showResetConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-300 dark:border-slate-700 shadow-2xl text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 flex items-center justify-center mx-auto border border-amber-300 dark:border-amber-700">
                <RotateCcw className="w-6 h-6" />
              </div>
              <h4 className="text-base font-black text-slate-900 dark:text-white leading-snug">
                Bạn có chắc muốn đặt lại dữ liệu nước hôm nay không?
              </h4>
              <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed font-semibold">
                Lượng nước đã uống hôm nay sẽ được đưa về 0 ml. Lịch sử các ngày trước, thống kê và mục tiêu của bạn vẫn được giữ nguyên.
              </p>
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowResetConfirm(false)}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-slate-300 dark:border-slate-600 text-xs font-extrabold text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors bg-white dark:bg-slate-800"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowResetConfirm(false);
                    onResetTodayWater();
                  }}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-white text-xs font-black shadow-md shadow-amber-500/20 transition-all"
                >
                  Đặt lại
                </button>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};
