import React, { useState } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { SINGLE_ADDITION_LIMIT, calculateDailyLimit, formatMl } from '../utils/waterMath';

interface CustomWaterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (amount: number) => void;
  currentTotal: number;
  target: number;
}

export const CustomWaterModal: React.FC<CustomWaterModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  currentTotal,
  target,
}) => {
  const [inputValue, setInputValue] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const dailyLimit = calculateDailyLimit(target);
  const remainingAllowance = Math.max(0, dailyLimit - currentTotal);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseInt(inputValue, 10);

    if (isNaN(amount) || amount <= 0) {
      setErrorMessage('Vui lòng nhập một số lượng nước hợp lệ (> 0 ml).');
      return;
    }

    // Check 1: Must not exceed 500 ml per log
    if (amount > SINGLE_ADDITION_LIMIT) {
      setErrorMessage('⚠️ Lượng nước mỗi lần ghi nhận không được vượt quá 500 ml. Hãy chia thành các lần nhỏ hơn.');
      return;
    }

    // Check 2: Must not exceed daily 120% limit
    if (currentTotal + amount > dailyLimit) {
      setErrorMessage('⚠️ Lượng nước này sẽ vượt giới hạn ghi nhận trong ngày.');
      return;
    }

    // Valid
    setErrorMessage(null);
    setInputValue('');
    onConfirm(amount);
  };

  const handleReset = () => {
    setInputValue('');
    setErrorMessage(null);
  };

  const handleClose = () => {
    setInputValue('');
    setErrorMessage(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 relative transition-colors"
        role="dialog"
        aria-modal="true"
      >
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-5 right-5 p-1.5 rounded-full text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Đóng popup"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mt-1">
          <div className="w-12 h-12 rounded-2xl bg-sky-100 dark:bg-sky-950/80 text-sky-600 dark:text-sky-300 flex items-center justify-center mx-auto mb-3 font-bold text-xl">
            💧
          </div>
          <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
            Bạn đã uống bao nhiêu ml?
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 font-medium">
            Tối đa 500 ml cho mỗi lần ghi nhận
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div className="relative">
            <input
              type="number"
              min="1"
              max="2000"
              step="10"
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                if (errorMessage) setErrorMessage(null);
              }}
              placeholder="Nhập số ml..."
              autoFocus
              className="w-full text-center text-2xl font-extrabold py-3.5 px-4 rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-500 dark:text-slate-400">
              ml
            </span>
          </div>

          {/* Quick preset chips within modal */}
          <div className="flex items-center justify-center gap-2 pt-1">
            {[150, 250, 350, 450].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => {
                  setInputValue(String(preset));
                  setErrorMessage(null);
                }}
                className="py-1 px-2.5 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-sky-50 hover:text-sky-600 dark:hover:bg-slate-700 border border-slate-200/60 dark:border-slate-700/60 transition-colors"
              >
                +{preset}ml
              </button>
            ))}
          </div>

          {/* Error Message Box */}
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-2.5 font-medium">
              <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="flex-1 leading-relaxed">{errorMessage}</div>
            </div>
          )}

          {/* Remaining allowance info */}
          <div className="text-xs text-center text-slate-600 dark:text-slate-300 font-medium">
            Còn có thể thêm hôm nay: <strong className="font-extrabold text-slate-900 dark:text-white">{formatMl(remainingAllowance)} ml</strong>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 pt-2">
            {errorMessage ? (
              <>
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-sm transition-colors"
                >
                  Nhập lại
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 rounded-xl bg-sky-500 hover:bg-sky-600 active:scale-95 text-white text-xs font-extrabold shadow-md shadow-sky-500/20 transition-all"
                >
                  Xác nhận
                </button>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
