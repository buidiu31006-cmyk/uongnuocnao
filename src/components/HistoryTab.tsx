import React, { useState } from 'react';
import { Calendar, ChevronDown, ChevronRight, Droplet, Clock } from 'lucide-react';
import { DailyLog } from '../types';
import { formatDateDisplay } from '../utils/date';
import { formatMl } from '../utils/waterMath';

interface HistoryTabProps {
  allLogs: Record<string, DailyLog>;
  todayLog: DailyLog;
}

export const HistoryTab: React.FC<HistoryTabProps> = ({ allLogs, todayLog }) => {
  // Combine all logs and sort descending by date
  const combinedLogs: Record<string, DailyLog> = {
    ...allLogs,
    [todayLog.date]: todayLog,
  };

  const sortedDates = Object.keys(combinedLogs).sort((a, b) => b.localeCompare(a));
  const [expandedDates, setExpandedDates] = useState<Record<string, boolean>>({
    [todayLog.date]: true, // Today open by default
  });

  const toggleExpand = (date: string) => {
    setExpandedDates((prev) => ({
      ...prev,
      [date]: !prev[date],
    }));
  };

  return (
    <div className="space-y-4 max-w-xl mx-auto pb-12">
      <div className="flex items-center justify-between px-1">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-sky-500" />
            <span>Lịch sử uống nước</span>
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
            Xem lại chi tiết các lần ghi nhận trong từng ngày
          </p>
        </div>
        <span className="text-xs text-slate-600 dark:text-slate-300 font-bold">
          {sortedDates.length} ngày lưu trữ
        </span>
      </div>

      {sortedDates.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 text-center border border-slate-200 dark:border-slate-800 shadow-xs">
          <Droplet className="w-10 h-10 text-slate-300 dark:text-slate-500 mx-auto mb-2" />
          <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
            Chưa có lịch sử
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-300 mt-1 font-medium">
            Dữ liệu ghi nhận uống nước sẽ xuất hiện tại đây theo từng ngày.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedDates.map((dateStr) => {
            const log = combinedLogs[dateStr];
            const isExpanded = Boolean(expandedDates[dateStr]);
            const target = log.target || 1950;
            const percentage = target > 0 ? Math.min(120, Math.round((log.totalAmount / target) * 100)) : 0;
            const isGoalMet = percentage >= 100;

            return (
              <div
                key={dateStr}
                className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden transition-all"
              >
                {/* Accordion Header */}
                <button
                  onClick={() => toggleExpand(dateStr)}
                  className="w-full p-4 sm:p-5 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center font-extrabold text-xs ${
                        isGoalMet
                          ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300'
                          : 'bg-sky-100 dark:bg-sky-950/80 text-sky-800 dark:text-sky-300'
                      }`}
                    >
                      {percentage}%
                    </div>
                    <div>
                      <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <span>{formatDateDisplay(dateStr)}</span>
                        {dateStr === todayLog.date && (
                          <span className="text-[10px] font-bold py-0.5 px-2 rounded-full bg-sky-100 dark:bg-sky-900/80 text-sky-800 dark:text-sky-200">
                            Hiện tại
                          </span>
                        )}
                      </h3>
                      <div className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 font-medium">
                        Đã ghi nhận: <strong className="text-slate-900 dark:text-white font-extrabold">{formatMl(log.totalAmount)} ml</strong> / {formatMl(target)} ml
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-600 dark:text-slate-300 font-semibold hidden sm:inline">
                      {log.records.length} lần
                    </span>
                    {isExpanded ? (
                      <ChevronDown className="w-5 h-5 text-slate-500 dark:text-slate-300" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-slate-500 dark:text-slate-300" />
                    )}
                  </div>
                </button>

                {/* Accordion Content (Detailed Intake Logs) */}
                {isExpanded && (
                  <div className="px-4 pb-4 sm:px-5 sm:pb-5 pt-1 border-t border-slate-200 dark:border-slate-800">
                    {log.records.length === 0 ? (
                      <p className="text-xs text-slate-500 dark:text-slate-300 py-3 text-center italic font-medium">
                        Không có lần ghi nhận nào trong ngày này.
                      </p>
                    ) : (
                      <div className="space-y-2 mt-2">
                        {log.records.map((rec, idx) => (
                          <div
                            key={rec.id || idx}
                            className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 text-xs text-slate-800 dark:text-slate-100 border border-slate-200/60 dark:border-slate-700/60"
                          >
                            <div className="flex items-center gap-2">
                              <Clock className="w-3.5 h-3.5 text-sky-500 dark:text-sky-400" />
                              <span className="font-extrabold text-slate-900 dark:text-white">{rec.timeStr}</span>
                            </div>
                            <span className="font-extrabold text-sky-600 dark:text-sky-300">
                              +{formatMl(rec.amount)} ml
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
