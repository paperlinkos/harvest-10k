import React, { useState, useEffect } from 'react';
import { Clock, Flame, CheckCircle2 } from 'lucide-react';

interface CampaignCountdownWidgetProps {
  variant?: 'header' | 'dashboard' | 'compact';
  className?: string;
}

export const CampaignCountdownWidget: React.FC<CampaignCountdownWidgetProps> = ({
  variant = 'header',
  className = '',
}) => {
  // Campaign schedule: October 1, 2026 00:00 WAT to October 2, 2026 00:00 WAT (24 Hours)
  const CAMPAIGN_START = new Date('2026-10-01T00:00:00+01:00').getTime();
  const CAMPAIGN_END = new Date('2026-10-02T00:00:00+01:00').getTime();

  const [now, setNow] = useState<number>(Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const isBeforeStart = now < CAMPAIGN_START;
  const isDuringCampaign = now >= CAMPAIGN_START && now < CAMPAIGN_END;
  const isCompleted = now >= CAMPAIGN_END;

  // Time calculations
  let targetDiff = 0;
  if (isBeforeStart) {
    targetDiff = Math.max(0, CAMPAIGN_START - now);
  } else if (isDuringCampaign) {
    targetDiff = Math.max(0, CAMPAIGN_END - now);
  }

  const days = Math.floor(targetDiff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((targetDiff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((targetDiff / (1000 * 60)) % 60);
  const seconds = Math.floor((targetDiff / 1000) % 60);

  const pad = (n: number) => n.toString().padStart(2, '0');

  if (variant === 'compact' || variant === 'header') {
    return (
      <div
        className={`flex items-center gap-2 px-3 py-1.5 rounded-full border bg-slate-900/90 dark:bg-slate-900/90 text-white border-slate-700/80 shadow-xs backdrop-blur-md ${className}`}
      >
        {isBeforeStart && (
          <>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-300 hidden sm:inline">
                Campaign Starts In:
              </span>
            </div>
            <div className="flex items-center gap-1 text-xs font-mono font-bold tracking-tight text-white">
              {days > 0 && <span className="text-amber-200">{days}d </span>}
              <span>{pad(hours)}h</span>
              <span className="text-slate-400">:</span>
              <span>{pad(minutes)}m</span>
              <span className="text-slate-400">:</span>
              <span className="text-amber-400">{pad(seconds)}s</span>
            </div>
          </>
        )}

        {isDuringCampaign && (
          <>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              <Flame className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-wider text-rose-300 hidden sm:inline">
                24-Hour Campaign Live:
              </span>
            </div>
            <div className="flex items-center gap-1 text-xs font-mono font-bold tracking-tight text-white">
              <span className="text-rose-400">{pad(hours)}h</span>
              <span className="text-slate-400">:</span>
              <span>{pad(minutes)}m</span>
              <span className="text-slate-400">:</span>
              <span className="text-rose-400">{pad(seconds)}s</span>
            </div>
          </>
        )}

        {isCompleted && (
          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-[11px]">Campaign Concluded</span>
          </div>
        )}
      </div>
    );
  }

  // Dashboard variant (Hero banner presentation)
  return (
    <div
      className={`p-4 sm:p-6 rounded-3xl bg-slate-900 text-white border border-slate-800 shadow-xl overflow-hidden relative ${className}`}
    >
      <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
        <Clock className="w-48 h-48 text-sky-400" />
      </div>

      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            {isBeforeStart && (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                Oct 1 Countdown
              </span>
            )}
            {isDuringCampaign && (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                🔥 24-Hour Campaign Active
              </span>
            )}
            {isCompleted && (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                Campaign Completed
              </span>
            )}
            <span className="text-xs text-slate-400">Oct 1, 12:00 AM WAT (Nigerian Time)</span>
          </div>

          <h2 className="text-lg sm:text-xl font-black tracking-tight text-white">
            {isBeforeStart && 'Abuja 10K Campaign Countdown'}
            {isDuringCampaign && '24-Hour Non-Stop Harvest Window'}
            {isCompleted && 'Harvest 10,000 Souls Campaign Complete'}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {isBeforeStart && 'Counting down to midnight launch on October 1st across Christ Embassy Abuja Zone 1.'}
            {isDuringCampaign && '24 hours of massive soul winning, real-time collation, and field mobilization!'}
            {isCompleted && 'Praise God for the glorious harvest recorded across Abuja FCT!'}
          </p>
        </div>

        {/* Digital Counter Box */}
        <div className="flex items-center gap-2 sm:gap-3 bg-slate-950/80 p-3 sm:p-4 rounded-2xl border border-slate-800 shadow-inner">
          {isBeforeStart && (
            <>
              <div className="flex flex-col items-center px-2 py-1 rounded-xl bg-slate-900 border border-slate-800 min-w-[50px]">
                <span className="text-xl sm:text-2xl font-black text-amber-400 font-mono">{pad(days)}</span>
                <span className="text-[9px] font-bold text-slate-400 uppercase">Days</span>
              </div>
              <span className="text-slate-600 font-bold text-lg">:</span>
              <div className="flex flex-col items-center px-2 py-1 rounded-xl bg-slate-900 border border-slate-800 min-w-[50px]">
                <span className="text-xl sm:text-2xl font-black text-white font-mono">{pad(hours)}</span>
                <span className="text-[9px] font-bold text-slate-400 uppercase">Hours</span>
              </div>
              <span className="text-slate-600 font-bold text-lg">:</span>
              <div className="flex flex-col items-center px-2 py-1 rounded-xl bg-slate-900 border border-slate-800 min-w-[50px]">
                <span className="text-xl sm:text-2xl font-black text-white font-mono">{pad(minutes)}</span>
                <span className="text-[9px] font-bold text-slate-400 uppercase">Mins</span>
              </div>
              <span className="text-slate-600 font-bold text-lg">:</span>
              <div className="flex flex-col items-center px-2 py-1 rounded-xl bg-slate-900 border border-slate-800 min-w-[50px]">
                <span className="text-xl sm:text-2xl font-black text-amber-400 font-mono">{pad(seconds)}</span>
                <span className="text-[9px] font-bold text-slate-400 uppercase">Secs</span>
              </div>
            </>
          )}

          {isDuringCampaign && (
            <>
              <div className="flex flex-col items-center px-3 py-1 rounded-xl bg-slate-900 border border-slate-800 min-w-[60px]">
                <span className="text-2xl sm:text-3xl font-black text-rose-500 font-mono">{pad(hours)}</span>
                <span className="text-[9px] font-bold text-slate-400 uppercase">Hours</span>
              </div>
              <span className="text-slate-600 font-bold text-xl">:</span>
              <div className="flex flex-col items-center px-3 py-1 rounded-xl bg-slate-900 border border-slate-800 min-w-[60px]">
                <span className="text-2xl sm:text-3xl font-black text-white font-mono">{pad(minutes)}</span>
                <span className="text-[9px] font-bold text-slate-400 uppercase">Mins</span>
              </div>
              <span className="text-slate-600 font-bold text-xl">:</span>
              <div className="flex flex-col items-center px-3 py-1 rounded-xl bg-slate-900 border border-slate-800 min-w-[60px]">
                <span className="text-2xl sm:text-3xl font-black text-rose-500 font-mono">{pad(seconds)}</span>
                <span className="text-[9px] font-bold text-slate-400 uppercase">Secs</span>
              </div>
            </>
          )}

          {isCompleted && (
            <div className="px-4 py-2 text-center text-emerald-400 font-bold text-sm">
              ✨ 24 Hours Harvest Completed!
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
