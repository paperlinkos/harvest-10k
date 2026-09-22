import React, { useMemo } from 'react';
import { TickerSubmission } from '../types';
import { useTheme } from '../context/ThemeContext';
import { Radio, Flame, UserCheck } from 'lucide-react';

interface LiveTickerProps {
  items: TickerSubmission[];
  theme?: 'dark' | 'light';
}

export const LiveTicker: React.FC<LiveTickerProps> = ({ items, theme = 'light' }) => {
  const { palette } = useTheme();
  const isDark = theme === 'dark';

  const formatTime = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch {
      return '';
    }
  };

  const tickerContent = useMemo(() => {
    if (!items || items.length === 0) {
      return [
        {
          id: 'placeholder-1',
          centreName: 'National Collation Live',
          count: 0,
          winnerName: 'Awaiting field reports',
          timestamp: new Date().toISOString(),
        },
      ];
    }
    return items.slice(0, 15);
  }, [items]);

  return (
    <div
      className={`w-full overflow-hidden border-t select-none flex items-center z-30 transition-colors ${
        isDark
          ? 'bg-slate-900 border-slate-800 text-slate-200'
          : 'bg-white border-slate-200/90 text-slate-700 shadow-xs'
      }`}
    >
      {/* Fixed Live Badge */}
      <div className="flex items-center gap-2 px-3.5 py-2.5 bg-slate-900 dark:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider shrink-0 font-display z-10 border-r border-slate-800 shadow-sm">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-400"></span>
        </span>
        <Radio className="w-3.5 h-3.5 text-blue-400" />
        <span className="hidden sm:inline">Collation Wire</span>
      </div>

      {/* Crawling Ticker Track */}
      <div className="flex-1 overflow-hidden relative py-2">
        <div className="animate-ticker flex items-center gap-8 whitespace-nowrap">
          {[...tickerContent, ...tickerContent].map((item, idx) => {
            const hasBreakdown =
              item.decisionBreakdown &&
              (item.decisionBreakdown.newConverts > 0 || item.decisionBreakdown.rededications > 0);

            return (
              <div
                key={`${item.id}-${idx}`}
                className="inline-flex items-center gap-2 text-xs tracking-tight group"
              >
                <div className="flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-200">
                  <span className="font-bold text-slate-900 dark:text-white">
                    {item.centreName}
                  </span>
                  <span className="text-slate-400 font-normal">reported</span>
                </div>

                <div className="inline-flex items-center gap-1 font-mono-tabular px-2.5 py-0.5 rounded-full font-bold text-xs bg-blue-50 dark:bg-blue-950/60 border border-blue-200/80 dark:border-blue-800/80 text-blue-700 dark:text-blue-300">
                  <Flame className="w-3 h-3 text-blue-500" />
                  <span>
                    +{item.count} {item.count === 1 ? 'Soul' : 'Souls'}
                  </span>
                </div>

                {hasBreakdown && item.decisionBreakdown && (
                  <div className="hidden sm:inline-flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                    <span className="text-emerald-600 dark:text-emerald-400 font-mono-tabular">
                      ({item.decisionBreakdown.newConverts} new)
                    </span>
                    {item.decisionBreakdown.rededications > 0 && (
                      <span className="text-blue-600 dark:text-blue-400 font-mono-tabular">
                        ({item.decisionBreakdown.rededications} reded.)
                      </span>
                    )}
                  </div>
                )}

                {item.winnerName && (
                  <div className="hidden md:inline-flex items-center gap-1 text-[11px] text-slate-400">
                    <UserCheck className="w-3 h-3 text-slate-400" />
                    <span>via {item.winnerName}</span>
                  </div>
                )}

                <span className="text-[10px] text-slate-400 font-mono-tabular">
                  {formatTime(item.timestamp)}
                </span>

                <span className="text-slate-300 dark:text-slate-700 px-1">•</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
