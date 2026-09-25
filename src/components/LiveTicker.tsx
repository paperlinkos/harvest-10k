import React, { useState, useMemo } from 'react';
import { TickerSubmission } from '../types';
import { useTheme } from '../context/ThemeContext';
import {
  Radio,
  Flame,
  UserCheck,
  Megaphone,
  Pause,
  Play,
  Gauge,
  CheckCircle2,
  Clock,
  MapPin,
  X,
  Sparkles,
} from 'lucide-react';
import { formatTimeWAT } from '../utils/localeUtils';

interface LiveTickerProps {
  items: TickerSubmission[];
  announcement?: string;
  theme?: 'dark' | 'light';
}

type TickerSpeed = 'normal' | 'fast' | 'slow';

export const LiveTicker: React.FC<LiveTickerProps> = ({
  items,
  announcement,
  theme = 'light',
}) => {
  const { palette } = useTheme();
  const isDark = theme === 'dark';

  const [isPaused, setIsPaused] = useState(false);
  const [speed, setSpeed] = useState<TickerSpeed>('normal');
  const [selectedItem, setSelectedItem] = useState<TickerSubmission | null>(null);

  const formatDisplayTime = (iso: string) => {
    try {
      return formatTimeWAT(iso);
    } catch {
      try {
        const d = new Date(iso);
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' WAT';
      } catch {
        return '';
      }
    }
  };

  const DUMMY_REGEX = /Barnabas|Chiamaka|Olumide|Ibrahim|Blessing|Ifeanyi|Bitrus|Funmilayo|Joshua Idoko|Maryam Bako|Sunday Oche|Amina Bello|Aloy/i;

  const validItems = useMemo(() => {
    if (!items || items.length === 0) return [];
    return items.filter(item => !item.winnerName || !DUMMY_REGEX.test(item.winnerName));
  }, [items]);

  // Prepare normalized list of ticker items
  const baseContent = useMemo(() => {
    const list: TickerSubmission[] = [];

    // Prepend active campaign announcement if present
    if (announcement && announcement.trim()) {
      list.push({
        id: 'campaign-announcement-pill',
        centreName: 'CENTRAL DIRECTION',
        count: 0,
        winnerName: 'Campaign Directorate',
        timestamp: new Date().toISOString(),
        isAnnouncement: true,
        status: 'verified',
      });
    }

    if (validItems.length > 0) {
      list.push(...validItems.slice(0, 20));
    }

    return list;
  }, [validItems, announcement]);

  // Ensure there are at least 10 items in the base sequence so wide monitors are always filled,
  // then duplicate the base sequence exactly once for seamless -50% translateX CSS animation.
  const repeatedItems = useMemo(() => {
    if (baseContent.length === 0) return [];
    let sequence = [...baseContent];
    while (sequence.length < 10) {
      sequence = [...sequence, ...baseContent];
    }
    return [...sequence, ...sequence];
  }, [baseContent]);

  const speedClass = 'ticker-slow';

  // If there are no field uploads and no active announcement, render a static, non-running clean bar
  if (baseContent.length === 0) {
    return (
      <div
        className={`w-full border-t py-1.5 px-3 select-none flex items-center justify-between z-30 transition-colors ${
          isDark
            ? 'bg-slate-950 border-slate-800 text-slate-100'
            : 'bg-slate-50 border-slate-300 text-slate-900 shadow-sm'
        }`}
      >
        <div className="flex items-center gap-2">
          <Radio className="w-3.5 h-3.5 text-emerald-500 animate-pulse shrink-0" />
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider shrink-0">
            <span className="sm:hidden font-black text-emerald-400">CW:</span>
            <span className="hidden sm:inline font-bold">Collation Wire:</span>
          </span>
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
            No field uploads recorded yet — Be the first to record a soul!
          </span>
        </div>
        <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest hidden sm:inline shrink-0">
          Live 0 Baseline
        </span>
      </div>
    );
  }

  return (
    <>
      <div
        className={`w-full overflow-hidden border-t select-none flex items-center z-30 transition-colors ${
          isDark
            ? 'bg-slate-950 border-slate-800 text-slate-100'
            : 'bg-slate-50 border-slate-300 text-slate-900 shadow-sm'
        }`}
      >
        {/* Fixed Compact Broadcast Badge (No manual controls, fixed 0.75x speed) */}
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-900 dark:bg-slate-900 text-white shrink-0 font-display z-10 border-r border-slate-700 dark:border-slate-800 shadow-sm">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
          </span>
          <Radio className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span className="sm:hidden font-black text-xs tracking-wider text-emerald-400">CW</span>
          <span className="hidden sm:inline font-black text-xs tracking-wide text-white uppercase">Collation Wire</span>
        </div>

        {/* Crawling Ticker Track */}
        <div className="flex-1 overflow-hidden relative py-2">
          <div
            className={`animate-ticker flex items-center gap-8 whitespace-nowrap ${speedClass} ${
              isPaused ? 'ticker-paused' : ''
            }`}
            style={{
              animationPlayState: isPaused ? 'paused' : 'running',
              animationDuration: '65s',
            }}
          >
            {repeatedItems.map((item, idx) => {
              // Special Campaign Announcement Display
              if (item.isAnnouncement && announcement) {
                return (
                  <div
                    key={`${item.id}-${idx}`}
                    onClick={() => setSelectedItem(item)}
                    className="inline-flex items-center gap-2 text-xs tracking-tight bg-amber-100/90 dark:bg-amber-950/70 border border-amber-400 dark:border-amber-600 px-3 py-1 rounded-full cursor-pointer hover:border-amber-500 shadow-xs transition-all shrink-0"
                  >
                    <span className="flex items-center gap-1 font-black text-amber-800 dark:text-amber-300 uppercase text-[10px] tracking-wider">
                      <Megaphone className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 animate-pulse" />
                      <span>DIRECTIVE:</span>
                    </span>
                    <span className="font-bold text-slate-900 dark:text-slate-100">
                      {announcement}
                    </span>
                    <span className="text-slate-400 dark:text-slate-500 font-bold px-1">•</span>
                  </div>
                );
              }

              if (item.isNoUploadsPlaceholder) {
                return (
                  <div
                    key={`${item.id}-${idx}`}
                    className="inline-flex items-center gap-2 text-xs font-bold tracking-tight bg-amber-500/10 dark:bg-amber-950/40 border border-amber-500/30 text-amber-900 dark:text-amber-200 px-4 py-1.5 rounded-full shadow-xs shrink-0"
                  >
                    <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
                    <span>No field uploads recorded yet — Be the first to record a soul!</span>
                  </div>
                );
              }

              const hasBreakdown =
                item.decisionBreakdown &&
                (item.decisionBreakdown.newConverts > 0 || item.decisionBreakdown.rededications > 0);

              const isPending = item.status === 'pending';

              return (
                <div
                  key={`${item.id}-${idx}`}
                  onClick={() => setSelectedItem(item)}
                  className="inline-flex items-center gap-2.5 text-xs tracking-tight group cursor-pointer hover:opacity-85 transition-opacity shrink-0"
                >
                  {/* Centre Name */}
                  <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-slate-100">
                    <span className="font-black text-slate-950 dark:text-white">
                      {item.centreName}
                    </span>
                    <span className="text-slate-600 dark:text-slate-300 font-medium">reported</span>
                  </div>

                  {/* Soul Count Pill */}
                  <div
                    className={`inline-flex items-center gap-1 font-mono-tabular px-2.5 py-0.5 rounded-full font-black text-xs ${
                      isPending
                        ? 'bg-amber-100 dark:bg-amber-950 border border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200'
                        : 'bg-emerald-100 dark:bg-emerald-950 border border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200'
                    }`}
                  >
                    <Flame
                      className={`w-3.5 h-3.5 ${isPending ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}
                    />
                    <span>
                      +{item.count} {item.count === 1 ? 'Soul' : 'Souls'}
                    </span>
                  </div>

                  {/* Decision Breakdown */}
                  {hasBreakdown && item.decisionBreakdown && (
                    <div className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold">
                      <span className="text-emerald-700 dark:text-emerald-400 font-mono-tabular">
                        ({item.decisionBreakdown.newConverts} new)
                      </span>
                      {item.decisionBreakdown.rededications > 0 && (
                        <span className="text-blue-700 dark:text-blue-400 font-mono-tabular">
                          ({item.decisionBreakdown.rededications} reded.)
                        </span>
                      )}
                    </div>
                  )}

                  {/* Winner Name */}
                  {item.winnerName && (
                    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200/90 dark:border-indigo-700 text-xs shadow-2xs">
                      <UserCheck className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0 stroke-[2.5]" />
                      <span className="text-indigo-900 dark:text-indigo-300 font-extrabold text-[11px]">via</span>
                      <span className="font-black text-slate-950 dark:text-white tracking-tight truncate max-w-[200px]">
                        {item.winnerName}
                      </span>
                    </div>
                  )}

                  {/* Status indicator */}
                  {isPending && (
                    <span className="text-[10px] bg-amber-200/90 dark:bg-amber-900/80 text-amber-950 dark:text-amber-100 px-1.5 py-0.5 rounded font-bold uppercase tracking-wide">
                      field queue
                    </span>
                  )}

                  {/* Time in WAT */}
                  <span className="text-[11px] text-slate-700 dark:text-slate-300 font-mono-tabular font-semibold">
                    {formatDisplayTime(item.timestamp)}
                  </span>

                  <span className="text-slate-400 dark:text-slate-500 font-bold px-1">•</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Report Inspection Modal (when user clicks an update in the running text) */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-xl">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center gap-1 font-mono">
                    <Sparkles className="w-3 h-3 text-emerald-500" />
                    <span>Live Collation Wire</span>
                  </span>
                </div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white mt-1">
                  {selectedItem.centreName}
                </h3>
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {selectedItem.isAnnouncement ? (
              <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/80 rounded-xl p-3.5 space-y-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-700 dark:text-amber-400 flex items-center gap-1">
                  <Megaphone className="w-3.5 h-3.5 text-amber-500" />
                  <span>Central Campaign Announcement</span>
                </span>
                <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
                  {announcement}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-baseline justify-between bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">Souls Harvested</span>
                    <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                      +{selectedItem.count}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Status</span>
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200 capitalize">
                      {selectedItem.status || 'Verified'}
                    </div>
                  </div>
                </div>

                {selectedItem.winnerName && (
                  <div className="text-xs space-y-1 bg-indigo-50/70 dark:bg-indigo-950/50 p-2.5 rounded-xl border border-indigo-200/80 dark:border-indigo-800">
                    <span className="text-indigo-900 dark:text-indigo-300 font-bold text-[11px] block">
                      Soul Winner / Evangelist
                    </span>
                    <p className="font-black text-slate-950 dark:text-white text-sm">
                      {selectedItem.winnerName}
                    </p>
                  </div>
                )}

                {selectedItem.decisionBreakdown && (
                  <div className="text-xs space-y-1">
                    <span className="text-slate-400 font-semibold text-[11px]">Decision Breakdown</span>
                    <div className="grid grid-cols-3 gap-2 text-center text-[11px]">
                      <div className="bg-emerald-50 dark:bg-emerald-950/40 p-2 rounded-lg font-mono">
                        <span className="text-emerald-700 dark:text-emerald-300 font-bold block">
                          {selectedItem.decisionBreakdown.newConverts}
                        </span>
                        <span className="text-[10px] text-slate-400">New Converts</span>
                      </div>
                      <div className="bg-blue-50 dark:bg-blue-950/40 p-2 rounded-lg font-mono">
                        <span className="text-blue-700 dark:text-blue-300 font-bold block">
                          {selectedItem.decisionBreakdown.rededications}
                        </span>
                        <span className="text-[10px] text-slate-400">Rededications</span>
                      </div>
                      <div className="bg-amber-50 dark:bg-amber-950/40 p-2 rounded-lg font-mono">
                        <span className="text-amber-700 dark:text-amber-300 font-bold block">
                          {selectedItem.decisionBreakdown.returnees}
                        </span>
                        <span className="text-[10px] text-slate-400">Returnees</span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="text-[11px] text-slate-400 flex items-center gap-1.5 pt-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Reported at {formatDisplayTime(selectedItem.timestamp)}</span>
                </div>
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedItem(null)}
                className="px-4 py-1.5 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-bold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
