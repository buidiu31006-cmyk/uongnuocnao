import React from 'react';
import { Droplet, Calendar, BarChart2, Settings } from 'lucide-react';
import { ActiveTab } from '../types';

interface NavbarProps {
  activeTab: ActiveTab;
  onChangeTab: (tab: ActiveTab) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, onChangeTab }) => {
  const tabs = [
    { id: 'today' as ActiveTab, label: 'Hôm nay', icon: Droplet },
    { id: 'history' as ActiveTab, label: 'Lịch sử', icon: Calendar },
    { id: 'stats' as ActiveTab, label: 'Thống kê', icon: BarChart2 },
    { id: 'settings' as ActiveTab, label: 'Cài đặt', icon: Settings },
  ];

  return (
    <>
      {/* Desktop Navigation Header Bar (visible on md+) */}
      <nav className="hidden md:flex items-center justify-center py-2 px-4 max-w-md mx-auto my-3">
        <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800/90 rounded-2xl w-full border border-slate-200/80 dark:border-slate-600 shadow-xs">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onChangeTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-sm font-bold transition-all duration-200 ${
                  isActive
                    ? 'bg-white dark:bg-slate-700 text-sky-600 dark:text-cyan-300 shadow-sm border border-transparent dark:border-slate-600'
                    : 'text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-sky-500 dark:text-cyan-300' : ''}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Mobile Bottom Navigation Bar (fixed bottom for small screens) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-700 safe-bottom shadow-lg">
        <div className="flex items-center justify-around py-2 px-2 max-w-lg mx-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onChangeTab(tab.id)}
                className={`flex-1 flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-colors ${
                  isActive
                    ? 'text-sky-600 dark:text-cyan-300 font-extrabold'
                    : 'text-slate-600 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white font-semibold'
                }`}
              >
                <div
                  className={`p-1 rounded-xl transition-all duration-200 ${
                    isActive ? 'bg-sky-50 dark:bg-slate-800 text-sky-600 dark:text-cyan-300' : ''
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-[11px] mt-0.5 tracking-tight">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
};
