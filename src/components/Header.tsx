import React from 'react';
import { Sun, Moon, Droplets } from 'lucide-react';
import { ThemeMode } from '../types';

interface HeaderProps {
  theme: ThemeMode;
  onToggleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({ theme, onToggleTheme }) => {
  return (
    <header className="w-full border-b border-sky-100 dark:border-slate-700 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md sticky top-0 z-30 transition-colors duration-300">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
        {/* Brand identity */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-500 to-cyan-400 flex items-center justify-center text-white shadow-md shadow-sky-200 dark:shadow-none">
            <Droplets className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-1.5">
              <span>Nhắc Uống Nước</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-200 font-medium">
              Hôm nay bạn đã uống đủ nước chưa?
            </p>
          </div>
        </div>

        {/* Action button: ONLY the 🌙/☀️ theme switcher */}
        <div className="flex items-center">
          <button
            onClick={onToggleTheme}
            aria-label={theme === 'dark' ? 'Chuyển sang chế độ Sáng' : 'Chuyển sang chế độ Tối'}
            className="p-2.5 rounded-2xl text-slate-800 dark:text-white hover:text-sky-600 dark:hover:text-amber-300 hover:bg-sky-50 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-600 shadow-xs transition-all active:scale-95 bg-white dark:bg-slate-800"
            title={theme === 'dark' ? 'Chuyển sang chế độ Sáng (☀️)' : 'Chuyển sang chế độ Tối (🌙)'}
          >
            {theme === 'dark' ? (
              <Sun className="w-5 h-5 text-amber-300" />
            ) : (
              <Moon className="w-5 h-5 text-slate-800" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
