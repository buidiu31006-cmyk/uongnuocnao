import React from 'react';
import { Droplet, Clock } from 'lucide-react';
import { NotificationMessage } from '../utils/notifications';

interface ReminderModalProps {
  isOpen: boolean;
  notification: NotificationMessage | null;
  onDrinkNow: () => void;
  onLater: () => void;
}

export const ReminderModal: React.FC<ReminderModalProps> = ({
  isOpen,
  notification,
  onDrinkNow,
  onLater,
}) => {
  if (!isOpen) return null;

  const title = notification?.title || '💧 Alooo, uống nước đi bà!';
  const body = notification?.body || 'Cơ thể đang réo tên bạn đó 😭 Đi làm một ngụm ngay đi!';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-[32px] shadow-2xl border border-sky-200/80 dark:border-slate-800 p-6 sm:p-7 text-center relative overflow-hidden transition-colors"
        role="alertdialog"
        aria-modal="true"
      >
        {/* Soft decorative water ripple backdrop effect */}
        <div className="absolute -top-12 -right-12 w-40 h-40 bg-sky-200/40 dark:bg-sky-500/15 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-36 h-36 bg-cyan-200/30 dark:bg-cyan-500/15 rounded-full blur-2xl pointer-events-none" />

        {/* Large Water Droplet Icon with gentle pulsing ring */}
        <div className="relative w-20 h-20 mx-auto mb-4 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-sky-100 dark:bg-sky-950/80 animate-ping opacity-30" />
          <div className="relative w-18 h-18 rounded-full bg-gradient-to-tr from-sky-500 via-sky-400 to-cyan-400 text-white flex items-center justify-center shadow-lg shadow-sky-200 dark:shadow-none">
            <Droplet className="w-10 h-10 fill-current drop-shadow-xs" />
          </div>
        </div>

        {/* Trendy Headline */}
        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-snug">
          {title}
        </h2>

        {/* Punchy 1-sentence copy */}
        <p className="text-sm sm:text-base font-medium text-slate-700 dark:text-slate-200 mt-2 leading-relaxed">
          {body}
        </p>

        {/* Action Buttons: "Uống ngay" is primary & prominent; "Để sau" is secondary */}
        <div className="mt-7 flex flex-col gap-3">
          <button
            onClick={onDrinkNow}
            className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-600 hover:to-cyan-600 active:scale-[0.98] text-white text-base font-extrabold shadow-lg shadow-sky-300/50 dark:shadow-sky-900/40 transition-all flex items-center justify-center gap-2"
          >
            <span className="text-lg">💧</span>
            <span>UỐNG NGAY</span>
          </button>

          <button
            onClick={onLater}
            className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center justify-center gap-1.5"
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Để sau (nhắc lại theo lịch)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
