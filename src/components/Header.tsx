import React, { useState } from 'react';
import { Sun, Moon, Droplets, User, LogIn, LogOut, ShieldCheck } from 'lucide-react';
import { ThemeMode, AppUser } from '../types';

interface HeaderProps {
  theme: ThemeMode;
  onToggleTheme: () => void;
  currentUser: AppUser | null;
  onOpenAuth: () => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  theme,
  onToggleTheme,
  currentUser,
  onOpenAuth,
  onLogout,
}) => {
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <header className="w-full border-b border-sky-100 dark:border-slate-700 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md sticky top-0 z-30 transition-colors duration-300">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
        {/* Brand identity */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-500 to-cyan-400 flex items-center justify-center text-white shadow-md shadow-sky-200 dark:shadow-none shrink-0">
            <Droplets className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-1.5">
              <span>Nhắc Uống Nước</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-200 font-medium truncate max-w-[180px] sm:max-w-none">
              Hôm nay bạn đã uống đủ nước chưa?
            </p>
          </div>
        </div>

        {/* Right Actions: User Account + Theme switcher */}
        <div className="flex items-center gap-2">
          {/* User Account Button */}
          {currentUser ? (
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="py-1.5 px-3 rounded-2xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-white hover:border-sky-400 dark:hover:border-cyan-400 flex items-center gap-1.5 shadow-xs transition-all"
              >
                <div className="w-5 h-5 rounded-full bg-sky-100 dark:bg-slate-700 text-sky-600 dark:text-cyan-300 flex items-center justify-center text-[10px]">
                  <User className="w-3 h-3" />
                </div>
                <span className="max-w-[70px] sm:max-w-[100px] truncate">
                  {currentUser.displayName || currentUser.email.split('@')[0]}
                </span>
                {currentUser.role === 'admin' && (
                  <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                    Admin
                  </span>
                )}
              </button>

              {/* Dropdown Menu */}
              {showUserMenu && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowUserMenu(false)}
                  />
                  <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-2 z-50 text-xs animate-in fade-in zoom-in-95">
                    <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 mb-1">
                      <div className="font-extrabold text-slate-900 dark:text-white truncate">
                        {currentUser.displayName || 'Thành viên'}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        {currentUser.email}
                      </div>
                      <div className="mt-1 flex items-center gap-1 text-[10px] font-bold text-sky-700 dark:text-cyan-300">
                        {currentUser.role === 'admin' ? (
                          <span className="flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400">
                            <ShieldCheck className="w-3 h-3" /> Quản trị viên (Admin)
                          </span>
                        ) : (
                          <span>Thành viên (Member)</span>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        onLogout();
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl font-bold transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Đăng xuất tài khoản</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="py-1.5 px-3 rounded-2xl border border-sky-300 dark:border-cyan-500/70 bg-sky-50/80 dark:bg-slate-800 text-xs font-extrabold text-sky-700 dark:text-cyan-300 hover:bg-sky-100 dark:hover:bg-slate-700 transition-all flex items-center gap-1.5 shadow-xs"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Đăng nhập</span>
            </button>
          )}

          {/* Theme switcher */}
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
