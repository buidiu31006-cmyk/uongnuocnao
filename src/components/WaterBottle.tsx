import React from 'react';
import { formatMl } from '../utils/waterMath';

interface WaterBottleProps {
  currentMl: number;
  targetMl: number;
  percentage: number; // e.g. 62, 100, 120 (capped at 120)
}

export const WaterBottle: React.FC<WaterBottleProps> = ({
  currentMl,
  targetMl,
  percentage,
}) => {
  // Height percentage of water in the bottle
  // Range from 5% (empty base) to 92% (full near cap)
  const fillHeight = Math.min(92, Math.max(5, (percentage / 120) * 87 + 5));

  const isCompleted = percentage >= 100;
  const isNearLimit = percentage >= 110 && percentage < 120;
  const isMaxLimit = percentage >= 120;

  return (
    <div className="flex flex-col items-center justify-center py-4 select-none">
      {/* Outer bottle container */}
      <div className="relative w-44 h-72 sm:w-52 sm:h-80 flex flex-col items-center">
        {/* Bottle Cap */}
        <div className="w-16 h-4 bg-sky-200 dark:bg-slate-700 rounded-t-md border-2 border-b-0 border-sky-400/50 dark:border-cyan-400/60 z-20 flex items-center justify-center">
          <div className="w-8 h-1 bg-sky-300 dark:bg-slate-500 rounded-full" />
        </div>
        
        {/* Bottle Neck */}
        <div className="w-12 h-3 bg-sky-100/70 dark:bg-slate-800 border-x-2 border-sky-300/50 dark:border-cyan-400/60 z-20" />

        {/* Bottle Body Frame */}
        <div className="relative w-full flex-1 rounded-[36px] border-[3px] border-sky-300/80 dark:border-cyan-400/70 bg-gradient-to-b from-sky-50/60 via-white/40 to-sky-100/40 dark:from-slate-800/90 dark:via-slate-800/80 dark:to-slate-900/95 shadow-lg shadow-sky-100 dark:shadow-none overflow-hidden backdrop-blur-xs flex flex-col justify-end">
          
          {/* Glass Highlight on left edge */}
          <div className="absolute left-2.5 top-6 bottom-8 w-2 rounded-full bg-white/50 dark:bg-white/30 pointer-events-none z-10" />

          {/* Water Measurement Ticks */}
          <div className="absolute right-3 top-8 bottom-8 flex flex-col justify-between items-end pointer-events-none z-10 opacity-100">
            <span className="text-[11px] font-black text-slate-700 dark:text-white">120%</span>
            <div className="w-3.5 h-0.5 bg-slate-500 dark:bg-slate-300" />
            <span className="text-[11px] font-black text-slate-700 dark:text-white">100%</span>
            <div className="w-3.5 h-0.5 bg-slate-500 dark:bg-slate-300" />
            <span className="text-[11px] font-black text-slate-700 dark:text-white">50%</span>
            <div className="w-3.5 h-0.5 bg-slate-500 dark:bg-slate-300" />
            <div className="w-2.5 h-0.5 bg-slate-500 dark:bg-slate-300" />
          </div>

          {/* Liquid Container */}
          <div
            className="w-full relative transition-all duration-700 ease-out"
            style={{ height: `${fillHeight}%` }}
          >
            {/* Animated Wave SVG at the liquid surface */}
            <div className="absolute -top-3 left-0 w-[200%] h-5 pointer-events-none overflow-hidden animate-wave opacity-95">
              <svg
                viewBox="0 0 1200 120"
                preserveAspectRatio="none"
                className="w-full h-full text-cyan-400 dark:text-cyan-400 fill-current"
              >
                <path d="M0,0 C150,90 350,-40 500,45 C650,130 900,10 1200,40 L1200,120 L0,120 Z" />
              </svg>
            </div>

            {/* Liquid Body Gradient */}
            <div
              className={`w-full h-full ${
                isMaxLimit
                  ? 'bg-gradient-to-t from-cyan-600 via-sky-500 to-cyan-400 dark:from-cyan-600 dark:via-sky-500 dark:to-cyan-400'
                  : isNearLimit
                  ? 'bg-gradient-to-t from-sky-500 via-cyan-400 to-sky-300 dark:from-sky-600 dark:via-cyan-500 dark:to-sky-400'
                  : isCompleted
                  ? 'bg-gradient-to-t from-sky-600 via-cyan-500 to-sky-400 dark:from-sky-600 dark:via-cyan-500 dark:to-sky-400'
                  : 'bg-gradient-to-t from-sky-500 via-cyan-400 to-sky-300 dark:from-sky-700 dark:via-cyan-600 dark:to-sky-400'
              } transition-colors duration-500 relative`}
            >
              {/* Subtle rising air bubbles */}
              <div className="absolute bottom-4 left-6 w-2 h-2 rounded-full bg-white/60 animate-ping opacity-70" />
              <div className="absolute bottom-12 right-10 w-1.5 h-1.5 rounded-full bg-white/70 animate-pulse" />
              <div className="absolute bottom-20 left-12 w-2.5 h-2.5 rounded-full bg-white/50 animate-pulse" />
            </div>
          </div>

          {/* Central Percentage Badge inside bottle */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-20">
            <div className="px-4 py-2 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-xl border border-white/80 dark:border-slate-600 flex flex-col items-center">
              <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                {percentage}%
              </span>
              <span className="text-[11px] font-black text-sky-600 dark:text-cyan-300 -mt-0.5">
                {isMaxLimit ? 'Tối đa 120%' : isCompleted ? 'Đã đạt mục tiêu' : 'Mục tiêu ngày'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Numerical display below bottle */}
      <div className="mt-4 text-center">
        <div className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
          <span>{formatMl(currentMl)}</span>
          <span className="text-lg sm:text-xl font-bold text-slate-400 dark:text-slate-300 mx-1.5">/</span>
          <span className="text-xl sm:text-2xl font-black text-slate-700 dark:text-slate-100">
            {formatMl(targetMl)} ml
          </span>
        </div>
        <p className="text-sm font-bold text-slate-700 dark:text-slate-100 mt-1">
          Đã hoàn thành <strong className="text-sky-600 dark:text-cyan-300 font-black">{percentage}%</strong>
        </p>
      </div>
    </div>
  );
};
