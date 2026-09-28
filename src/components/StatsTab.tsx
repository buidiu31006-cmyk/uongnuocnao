import React from 'react';
import { BarChart2, TrendingUp, Award, Calendar, Droplets } from 'lucide-react';
import { DailyLog } from '../types';
import { formatShortDate, getPastDates, formatDateDisplay } from '../utils/date';
import { formatMl } from '../utils/waterMath';

interface StatsTabProps {
  allLogs: Record<string, DailyLog>;
  todayLog: DailyLog;
}

export const StatsTab: React.FC<StatsTabProps> = ({ allLogs, todayLog }) => {
  const combinedLogs: Record<string, DailyLog> = {
    ...allLogs,
    [todayLog.date]: todayLog,
  };

  const past7Days = getPastDates(7); // [6 days ago, ..., today]

  // Data for the 7-day chart
  const chartData = past7Days.map((dateStr) => {
    const log = combinedLogs[dateStr];
    const amount = log ? log.totalAmount : 0;
    const target = log?.target || todayLog.target || 1950;
    const percentage = target > 0 ? Math.min(120, Math.round((amount / target) * 100)) : 0;
    return {
      date: dateStr,
      shortLabel: formatShortDate(dateStr),
      isToday: dateStr === todayLog.date,
      amount,
      target,
      percentage,
    };
  });

  // Calculate 7-day average
  const total7Days = chartData.reduce((sum, d) => sum + d.amount, 0);
  const avg7Days = Math.round(total7Days / 7);

  // All logs with entries (> 0 ml)
  const recordedLogs = Object.values(combinedLogs).filter((l) => l.totalAmount > 0);
  const totalDaysWithRecord = recordedLogs.length;

  // Max and min recorded day
  let maxDay: DailyLog | null = null;
  let minDay: DailyLog | null = null;

  if (recordedLogs.length > 0) {
    maxDay = recordedLogs.reduce((prev, curr) =>
      curr.totalAmount > prev.totalAmount ? curr : prev
    );
    minDay = recordedLogs.reduce((prev, curr) =>
      curr.totalAmount < prev.totalAmount ? curr : prev
    );
  }

  // Max amount in past 7 days for chart scaling
  const maxInChart = Math.max(
    todayLog.target * 1.2,
    ...chartData.map((d) => d.amount),
    2000
  );

  return (
    <div className="space-y-6 max-w-xl mx-auto pb-12">
      {/* Title */}
      <div>
        <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
          <BarChart2 className="w-5 h-5 text-sky-500" />
          <span>Thống kê uống nước</span>
        </h2>
        <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
          Theo dõi thói quen bổ sung nước trong tuần qua
        </p>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {/* Total Today */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 border border-sky-100/70 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-700 dark:text-slate-200">
            <span className="text-xs font-bold">Hôm nay</span>
            <Droplets className="w-4 h-4 text-sky-500" />
          </div>
          <div className="mt-3">
            <span className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
              {formatMl(todayLog.totalAmount)}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-300 ml-1 font-semibold">ml</span>
          </div>
          <div className="text-[11px] text-sky-600 dark:text-sky-300 mt-1 font-bold">
            {todayLog.target > 0
              ? `${Math.min(120, Math.round((todayLog.totalAmount / todayLog.target) * 100))}% mục tiêu`
              : ''}
          </div>
        </div>

        {/* 7-Day Average */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 border border-sky-100/70 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-700 dark:text-slate-200">
            <span className="text-xs font-bold">TB 7 ngày</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-3">
            <span className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
              {formatMl(avg7Days)}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-300 ml-1 font-semibold">ml/ngày</span>
          </div>
          <div className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 font-medium">
            Tổng 7 ngày: <strong className="text-slate-800 dark:text-white">{formatMl(total7Days)} ml</strong>
          </div>
        </div>

        {/* Days with records */}
        <div className="col-span-2 sm:col-span-1 bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 border border-sky-100/70 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-700 dark:text-slate-200">
            <span className="text-xs font-bold">Số ngày ghi nhận</span>
            <Calendar className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-3">
            <span className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
              {totalDaysWithRecord}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-300 ml-1 font-semibold">ngày</span>
          </div>
          <div className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 font-medium">
            Tính từ ngày cài đặt
          </div>
        </div>
      </div>

      {/* 7-Day Bar Chart Section */}
      <section className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-sky-100/70 dark:border-slate-800 shadow-xs">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
              Biểu đồ 7 ngày gần nhất
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Mức nước ghi nhận so với mục tiêu tham khảo
            </p>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-slate-700 dark:text-slate-200 font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
            <span>Thực tế</span>
            <span className="w-2.5 h-0.5 bg-slate-400 dark:bg-slate-500 ml-1" />
            <span>Mục tiêu</span>
          </div>
        </div>

        {/* Bar container */}
        <div className="h-56 flex items-end justify-between gap-2 pt-6 pb-2 px-1">
          {chartData.map((d) => {
            const barHeightPercent = Math.min(
              100,
              Math.max(4, Math.round((d.amount / maxInChart) * 100))
            );
            const isGoalMet = d.percentage >= 100;

            return (
              <div key={d.date} className="flex-1 flex flex-col items-center h-full justify-end group">
                {/* Floating tooltip/amount above bar */}
                <div className="text-[10px] font-extrabold text-slate-800 dark:text-slate-100 mb-1 opacity-90 transition-opacity whitespace-nowrap">
                  {d.amount > 0 ? `${formatMl(d.amount)}` : '0'}
                </div>

                {/* The Bar */}
                <div className="w-full max-w-[36px] bg-slate-100 dark:bg-slate-800 rounded-t-xl h-full flex flex-col justify-end p-0.5 relative">
                  {/* Target line across this bar */}
                  <div
                    className="absolute left-0 right-0 border-b border-dashed border-slate-400 dark:border-slate-500 pointer-events-none z-10"
                    style={{
                      bottom: `${Math.min(100, (d.target / maxInChart) * 100)}%`,
                    }}
                    title={`Mục tiêu: ${formatMl(d.target)} ml`}
                  />

                  {/* Filled bar height */}
                  <div
                    style={{ height: `${barHeightPercent}%` }}
                    className={`w-full rounded-t-lg transition-all duration-500 ${
                      d.isToday
                        ? isGoalMet
                          ? 'bg-gradient-to-t from-emerald-500 to-teal-400'
                          : 'bg-gradient-to-t from-sky-500 to-cyan-400'
                        : isGoalMet
                        ? 'bg-emerald-500 dark:bg-emerald-400'
                        : 'bg-sky-500 dark:bg-sky-500'
                    }`}
                  />
                </div>

                {/* Day label */}
                <div className="mt-2 text-center">
                  <span
                    className={`text-[11px] font-bold block ${
                      d.isToday
                        ? 'text-sky-600 dark:text-sky-300 font-extrabold'
                        : 'text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    {d.isToday ? 'Hôm nay' : d.shortLabel}
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-300 font-semibold block -mt-0.5">
                    {d.percentage}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Record Highlights: Best and Lowest Day */}
      <section className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Max Day */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-sky-100/70 dark:border-slate-800 shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
              Ghi nhận nhiều nhất
            </span>
            {maxDay ? (
              <>
                <div className="text-lg font-extrabold text-slate-900 dark:text-white">
                  {formatMl(maxDay.totalAmount)} ml
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                  {formatDateDisplay(maxDay.date)}
                </div>
              </>
            ) : (
              <div className="text-sm font-medium text-slate-500 dark:text-slate-300">Chưa có dữ liệu</div>
            )}
          </div>
        </div>

        {/* Lowest Day */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-sky-100/70 dark:border-slate-800 shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0">
            <Droplets className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
              Ghi nhận ít nhất
            </span>
            {minDay ? (
              <>
                <div className="text-lg font-extrabold text-slate-900 dark:text-white">
                  {formatMl(minDay.totalAmount)} ml
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                  {formatDateDisplay(minDay.date)}
                </div>
              </>
            ) : (
              <div className="text-sm font-medium text-slate-500 dark:text-slate-300">Chưa có dữ liệu</div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};
