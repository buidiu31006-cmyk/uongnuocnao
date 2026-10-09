import React from 'react';
import { Droplet, Calendar, BarChart2, Settings, Shield } from 'lucide-react';
import { ActiveTab } from '../types';

interface NavbarProps {
  activeTab: ActiveTab;
  onChangeTab: (tab: ActiveTab) => void;
  isAdmin?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, onChangeTab, isAdmin = false }) => {
  const tabs = [
    { id: 'today' as ActiveTab, label: 'Hôm nay', icon: Droplet },
    { id: 'history' as ActiveTab, label: 'Lịch sử', icon: Calendar },
    { id: 'stats' as ActiveTab, label: 'Thống kê', icon: BarChart2 },
    { id: 'settings' as ActiveTab, label: 'Cài đặt', icon: Settings },
    { id: 'admin' as ActiveTab, label: 'Quản trị', icon: Shield },
  ];

  return (
    <>
      {/* Desktop Navigation Header Bar (visible on md+) */}
      <nav className="hidden md:flex items-center justify-center py-2 px-4 max-w-xl mx-auto my-3">
        <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800/90 rounded-2xl w-full border border-slate-200/80 dark:border-slate-600 shadow-xs">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const isSpecialAdmin = tab.id === 'admin';

            return (
              <button
                key={tab.id}
                onClick={() => onChangeTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 ${
                  isActive
                    ? 'bg-white dark:bg-slate-700 text-sky-600 dark:text-cyan-300 shadow-sm border border-transparent dark:border-slate-600'
                    : isSpecialAdmin && isAdmin
                    ? 'text-emerald-700 dark:text-emerald-400 hover:text-emerald-900 dark:hover:text-emerald-200'
                    : 'text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Icon
                  className={`w-4 h-4 ${
                    isActive
                      ? 'text-sky-500 dark:text-cyan-300'
                      : isSpecialAdmin && isAdmin
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : ''
                  }`}
                />
                <span>{tab.label}</span>
                {isSpecialAdmin && isAdmin && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Mobile Bottom Navigation Bar (fixed bottom for small screens) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-700 safe-bottom shadow-lg">
        <div className="flex items-center justify-around py-2 px-1 max-w-lg mx-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const isSpecialAdmin = tab.id === 'admin';

            return (
              <button
                key={tab.id}
                onClick={() => onChangeTab(tab.id)}
                className={`flex-1 flex flex-col items-center justify-center py-1.5 px-0.5 rounded-xl transition-colors ${
                  isActive
                    ? 'text-sky-600 dark:text-cyan-300 font-extrabold'
                    : isSpecialAdmin && isAdmin
                    ? 'text-emerald-700 dark:text-emerald-400 font-bold'
                    : 'text-slate-600 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white font-semibold'
                }`}
              >
                <div
                  className={`p-1 rounded-xl transition-all duration-200 relative ${
                    isActive ? 'bg-sky-50 dark:bg-slate-800 text-sky-600 dark:text-cyan-300' : ''
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {isSpecialAdmin && isAdmin && (
                    <span className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-emerald-500 border border-white dark:border-slate-900" />
                  )}
                </div>
                <span className="text-[10px] mt-0.5 tracking-tight truncate max-w-[55px]">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
};
