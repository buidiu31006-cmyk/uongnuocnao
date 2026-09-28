import React from 'react';
import { CheckCircle2, AlertTriangle, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'warning' | 'info';
  message: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2 pointer-events-none px-4 max-w-md w-full">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto flex items-center justify-between gap-3 px-4 py-3 rounded-2xl shadow-2xl border backdrop-blur-md transition-all duration-300 animate-in fade-in slide-in-from-top-4 w-full ${
            t.type === 'success'
              ? 'bg-slate-900 text-white border-cyan-400/80 shadow-cyan-950/40'
              : t.type === 'warning'
              ? 'bg-slate-900 text-white border-amber-400/80 shadow-amber-950/40'
              : 'bg-slate-900 text-white border-slate-600 shadow-slate-950/50'
          }`}
        >
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            {t.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-cyan-300 shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-amber-300 shrink-0" />
            )}
            <span className="text-xs sm:text-sm font-extrabold truncate leading-tight text-white">
              {t.message}
            </span>
          </div>
          <button
            onClick={() => onDismiss(t.id)}
            className="p-1 rounded-lg text-slate-200 hover:text-white hover:bg-white/20 shrink-0 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};
