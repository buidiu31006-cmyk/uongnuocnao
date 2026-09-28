import React, { useState, useEffect } from 'react';
import {
  RotateCcw,
  Plus,
  Clock,
  Bell,
  BellOff,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
} from 'lucide-react';
import { DailyLog, ReminderSettings, UserProfile } from '../types';
import { WaterBottle } from './WaterBottle';
import {
  calculateDailyLimit,
  calculateWaterRange,
  formatMl,
  validateWaterAddition,
} from '../utils/waterMath';
import { formatTime } from '../utils/date';

interface TodayTabProps {
  userProfile: UserProfile;
  todayLog: DailyLog;
  reminderSettings: ReminderSettings;
  onAddWater: (amount: number) => void;
  onUndoLast: () => void;
  onOpenCustomModal: () => void;
  onToggleReminder: (enabled: boolean) => void;
  onChangeReminderInterval: (minutes: number) => void;
}

export const TodayTab: React.FC<TodayTabProps> = ({
  userProfile,
  todayLog,
  reminderSettings,
  onAddWater,
  onUndoLast,
  onOpenCustomModal,
  onToggleReminder,
  onChangeReminderInterval,
}) => {
  const [countdownMinutes, setCountdownMinutes] = useState<number>(0);
  const [nextTimeString, setNextTimeString] = useState<string>('--:--');

  const targetMl = todayLog.target || 1950;
  const currentMl = todayLog.totalAmount || 0;
  const dailyLimitMl = calculateDailyLimit(targetMl);

  // Raw percentage
  const rawPercentage = targetMl > 0 ? Math.round((currentMl / targetMl) * 100) : 0;
  // Capped at 120% strictly as required
  const displayPercentage = Math.min(120, rawPercentage);

  const isAtOrAboveGoal = displayPercentage >= 100;
  const isNearLimit = displayPercentage >= 110 && displayPercentage < 120;
  const isLockedAtMax = displayPercentage >= 120;

  const range = calculateWaterRange(userProfile.weight);

  // Live countdown timer updater
  useEffect(() => {
    function updateCountdown() {
      if (!reminderSettings.enabled) {
        setCountdownMinutes(0);
        setNextTimeString('--:--');
        return;
      }

      const diffMs = reminderSettings.nextReminderTimestamp - Date.now();
      const minutesRemaining = Math.max(0, Math.ceil(diffMs / (60 * 1000)));
      setCountdownMinutes(minutesRemaining);
      setNextTimeString(formatTime(reminderSettings.nextReminderTimestamp));
    }

    updateCountdown();
    const interval = setInterval(updateCountdown, 10000); // Check every 10s
    return () => clearInterval(interval);
  }, [reminderSettings.enabled, reminderSettings.nextReminderTimestamp]);

  // Handle quick click buttons with validation
  const handleQuickAdd = (amount: number) => {
    const validation = validateWaterAddition(currentMl, targetMl, amount);
    if (!validation.allowed) {
      onAddWater(amount);
      return;
    }
    onAddWater(amount);
  };

  return (
    <div className="space-y-6 max-w-xl mx-auto pb-12">
      {/* 1. Progress & Water Bottle Display Area */}
      <section className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 shadow-xs border border-sky-100/70 dark:border-slate-700 transition-colors">
        <WaterBottle
          currentMl={currentMl}
          targetMl={targetMl}
          percentage={displayPercentage}
        />

        {/* Milestone State Messages */}
        <div className="mt-5 space-y-2">
          {/* Reached Max 120% Lock */}
          {isLockedAtMax && (
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/70 border border-amber-300 dark:border-amber-600 text-amber-950 dark:text-amber-100 space-y-1.5 text-center">
              <div className="flex items-center justify-center gap-1.5 font-bold text-sm text-amber-900 dark:text-amber-200">
                <ShieldAlert className="w-5 h-5 shrink-0 text-amber-600 dark:text-amber-300" />
                <span className="font-extrabold">⚠️ Bạn đã đạt giới hạn ghi nhận của ứng dụng hôm nay.</span>
              </div>
              <p className="text-xs text-amber-900/90 dark:text-amber-100 leading-relaxed font-semibold">
                Các nút ghi nhận nước đã được khóa để tránh nhập thêm quá mức. Bạn không cần cố uống thêm chỉ để tăng phần trăm.
              </p>
            </div>
          )}

          {/* Near Limit 110% - 119% */}
          {isNearLimit && (
            <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-600 text-amber-950 dark:text-amber-100 text-xs flex items-center justify-center gap-2 font-bold text-center">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-300" />
              <span>⚠️ Bạn đang gần giới hạn ghi nhận của ứng dụng hôm nay.</span>
            </div>
          )}

          {/* Reached Target 100% - 119% */}
          {isAtOrAboveGoal && !isLockedAtMax && (
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-600 text-emerald-950 dark:text-emerald-100 space-y-1.5 text-center">
              <div className="flex items-center justify-center gap-1.5 font-bold text-sm text-emerald-900 dark:text-emerald-200">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-300" />
                <span className="font-extrabold">🎉 Bạn đã đạt mục tiêu tham khảo hôm nay!</span>
              </div>
              <p className="text-xs text-emerald-900/90 dark:text-emerald-100 leading-relaxed font-semibold">
                Hãy uống theo nhu cầu thực tế của cơ thể, không cần cố uống thêm để tăng phần trăm.
              </p>
            </div>
          )}
        </div>

        {/* Reference targets summary */}
        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs text-slate-700 dark:text-slate-100 font-semibold">
          <div>
            Mục tiêu: <strong className="font-extrabold text-slate-900 dark:text-white">{formatMl(targetMl)} ml</strong>
          </div>
          <div>
            Giới hạn ghi nhận: <strong className="font-extrabold text-slate-900 dark:text-white">{formatMl(dailyLimitMl)} ml</strong>
          </div>
        </div>
      </section>

      {/* 2. Water Intake Buttons Area */}
      <section
        id="water-intake-section"
        className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 shadow-xs border border-sky-100/70 dark:border-slate-700 transition-colors scroll-mt-20"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">💧</span>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              Đã uống nước
            </h2>
          </div>

          {/* Undo Button */}
          {todayLog.records.length > 0 && (
            <button
              onClick={onUndoLast}
              className="flex items-center gap-1.5 py-1.5 px-3 rounded-xl border border-slate-300 dark:border-slate-600 text-xs font-bold text-slate-700 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-950 dark:hover:text-white transition-colors active:scale-95 bg-white dark:bg-slate-800"
              title="Xóa lần ghi nhận nước gần nhất"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Hoàn tác</span>
            </button>
          )}
        </div>

        {/* If locked at 120%, hide/lock water buttons area */}
        {isLockedAtMax ? (
          <div className="py-6 px-4 text-center rounded-2xl bg-slate-50 dark:bg-slate-800/90 border border-dashed border-slate-300 dark:border-slate-600">
            <p className="text-sm font-bold text-slate-900 dark:text-white">
              Khu vực ghi nhận đã được khóa
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-200 mt-1 font-semibold">
              Bạn đã hoàn thành đủ lượng nước tối đa cho hôm nay (120%). Hãy quay lại vào ngày mai!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Quick addition buttons */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[100, 200, 300, 500].map((amount) => {
                const canAdd = currentMl + amount <= dailyLimitMl;
                return (
                  <button
                    key={amount}
                    onClick={() => handleQuickAdd(amount)}
                    disabled={!canAdd}
                    className={`py-3.5 px-3 rounded-2xl font-extrabold text-sm transition-all duration-200 flex flex-col items-center justify-center gap-1 shadow-xs ${
                      canAdd
                        ? 'bg-sky-50 dark:bg-slate-800 hover:bg-sky-500 hover:text-white dark:hover:bg-sky-600 dark:hover:text-white text-sky-800 dark:text-cyan-300 border border-sky-200 dark:border-slate-600 active:scale-95'
                        : 'opacity-40 cursor-not-allowed bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <span className="text-base font-extrabold">+{amount} ml</span>
                    <span className="text-[11px] font-bold text-slate-600 dark:text-slate-200">
                      {amount === 100
                        ? 'Ngụm nhỏ'
                        : amount === 200
                        ? 'Ly nhỏ'
                        : amount === 300
                        ? 'Cốc vừa'
                        : 'Bình lớn'}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Custom amount button */}
            <button
              onClick={onOpenCustomModal}
              className="w-full py-3 px-4 rounded-2xl border-2 border-dashed border-sky-400 dark:border-cyan-400/80 hover:border-sky-500 dark:hover:border-cyan-300 text-sky-700 dark:text-cyan-300 hover:bg-sky-50/70 dark:hover:bg-slate-800 text-sm font-extrabold flex items-center justify-center gap-2 transition-all active:scale-[0.99] bg-sky-50/30 dark:bg-slate-800/40"
            >
              <Plus className="w-4 h-4 text-sky-600 dark:text-cyan-300" />
              <span>Nhập lượng khác</span>
            </button>
          </div>
        )}
      </section>

      {/* 3. Reminder Section */}
      <section className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 shadow-xs border border-sky-100/70 dark:border-slate-700 transition-colors">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-colors ${
                reminderSettings.enabled
                  ? 'bg-sky-100 dark:bg-slate-800 text-sky-600 dark:text-cyan-300 border border-transparent dark:border-slate-600'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-400'
              }`}
            >
              {reminderSettings.enabled ? (
                <Bell className="w-5 h-5 text-sky-600 dark:text-cyan-300" />
              ) : (
                <BellOff className="w-5 h-5" />
              )}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Nhắc uống nước
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-200 font-semibold">
                {reminderSettings.enabled
                  ? `Mỗi ${reminderSettings.intervalMinutes} phút`
                  : 'Đang tắt'}
              </p>
            </div>
          </div>

          {/* Toggle Switch */}
          <button
            onClick={() => onToggleReminder(!reminderSettings.enabled)}
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

        {reminderSettings.enabled && (
          <div className="mt-5 pt-4 border-t border-slate-200 dark:border-slate-700 space-y-4">
            {/* Interval buttons */}
            <div>
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-100 mb-2">
                Khoảng thời gian nhắc:
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[30, 60, 90, 120].map((mins) => (
                  <button
                    key={mins}
                    onClick={() => onChangeReminderInterval(mins)}
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

            {/* Next reminder countdown display */}
            <div className="p-3.5 rounded-2xl bg-sky-50/80 dark:bg-slate-800 border border-sky-200/80 dark:border-slate-600 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-slate-800 dark:text-slate-100 font-semibold">
                <Clock className="w-4 h-4 text-sky-500 dark:text-cyan-300" />
                <span>
                  Lần nhắc tiếp theo: <strong className="text-slate-900 dark:text-white font-extrabold">{nextTimeString}</strong>
                </span>
              </div>
              <span className="font-extrabold text-sky-700 dark:text-cyan-300 text-sm">
                Còn {countdownMinutes} phút
              </span>
            </div>
          </div>
        )}
      </section>

      {/* 4. Today's Intake History Log */}
      <section className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 shadow-xs border border-sky-100/70 dark:border-slate-700 transition-colors">
        <h3 className="text-base font-bold text-slate-900 dark:text-white mb-3 flex items-center justify-between">
          <span>Nhật ký hôm nay</span>
          <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
            {todayLog.records.length} lần uống
          </span>
        </h3>

        {todayLog.records.length === 0 ? (
          <div className="py-8 text-center text-slate-600 dark:text-slate-200 font-medium">
            <p className="text-sm font-bold">Chưa có lần uống nào được ghi nhận hôm nay.</p>
            <p className="text-xs mt-1 text-slate-500 dark:text-slate-300">Hãy uống một ngụm nước và bấm nút phía trên nhé!</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {[...todayLog.records].reverse().map((record, index) => (
              <div
                key={record.id}
                className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-500 dark:bg-cyan-400" />
                  <span className="font-extrabold text-slate-900 dark:text-white text-sm">
                    {record.timeStr}
                  </span>
                  {index === 0 && (
                    <span className="text-[10px] text-sky-800 dark:text-cyan-200 font-extrabold bg-sky-100 dark:bg-slate-700 px-2 py-0.5 rounded-md border border-transparent dark:border-slate-600">
                      Gần nhất
                    </span>
                  )}
                </div>
                <div className="font-extrabold text-sm text-sky-600 dark:text-cyan-300">
                  +{formatMl(record.amount)} ml
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Medical/Health Disclaimer */}
      <p className="text-[11px] text-center text-slate-600 dark:text-slate-200 italic px-4 leading-relaxed font-semibold">
        Lượng nước trên là mức tham khảo chung ({formatMl(range.min)}–{formatMl(range.max)} ml theo cân nặng {userProfile.weight}kg). Nhu cầu thực tế có thể thay đổi tùy cơ thể, thời tiết, mức độ vận động và tình trạng sức khỏe.
      </p>
    </div>
  );
};
