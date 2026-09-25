import React, { useState, useEffect } from 'react';
import { dataService } from '../services/dataService';
import { Campaign, SoulRecord } from '../types';
import { useTheme } from '../context/ThemeContext';
import { CountUpNumber } from '../components/CountUpNumber';
import {
  Radio,
  Flame,
  X,
  Share2,
  Sparkles,
  MapPin,
  CheckCircle2,
  Tv,
} from 'lucide-react';

interface LiveStreamViewerProps {
  onExit: () => void;
  onSuccessToast?: (title: string, message: string) => void;
}

export const LiveStreamViewer: React.FC<LiveStreamViewerProps> = ({
  onExit,
  onSuccessToast,
}) => {
  const { palette } = useTheme();
  const [stats, setStats] = useState(dataService.getStats());
  const [campaign, setCampaign] = useState<Campaign>(dataService.getCampaign());
  const [recentRecords, setRecentRecords] = useState<SoulRecord[]>(
    dataService.getSoulRecords().slice(0, 6)
  );

  useEffect(() => {
    const unsub = dataService.subscribe(() => {
      setStats(dataService.getStats());
      setCampaign(dataService.getCampaign());
      setRecentRecords(dataService.getSoulRecords().slice(0, 6));
    });
    return unsub;
  }, []);

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      if (onSuccessToast) {
        onSuccessToast('Live Link Copied', 'Broadcast link copied to clipboard for OBS or stream sharing.');
      }
    }
  };

  const progressPct = Math.min(100, Math.round((stats.totalSouls / campaign.target) * 100));

  return (
    <div className="fixed inset-0 z-50 bg-[#06080F] text-white flex flex-col justify-between p-6 sm:p-12 overflow-hidden aspect-video select-none">
      {/* Top Overlay Bar */}
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-600 text-white font-extrabold text-xs tracking-wider uppercase animate-pulse">
            <Radio className="w-4 h-4" />
            <span>LIVE BROADCAST</span>
          </div>
          <span className="text-xs font-semibold text-slate-400">
            Abuja FCT Soul Harvest Desk
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleShare}
            className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Share Stream</span>
          </button>
          <button
            onClick={onExit}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Broadcast Lower-Third / Hero */}
      <main className="flex flex-col items-center justify-center my-auto space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-lg sm:text-2xl font-black uppercase tracking-wider text-slate-300">
            {campaign.name}
          </h2>
          <div
            className="text-8xl sm:text-[10rem] font-black tracking-tight leading-none"
            style={{ color: palette.hex }}
          >
            <CountUpNumber value={stats.totalSouls} duration={1000} />
          </div>
          <p className="text-sm font-semibold tracking-widest uppercase text-slate-400">
            Souls Born Again Into The Kingdom Of God
          </p>
        </div>

        {/* Progress Tracker */}
        <div className="w-full max-w-2xl bg-slate-900/90 border border-slate-800 p-4 rounded-2xl space-y-2 shadow-2xl">
          <div className="flex justify-between text-xs font-bold text-slate-300">
            <span>Goal: {campaign.target.toLocaleString()} Souls</span>
            <span className="text-amber-400">{progressPct}% Reached</span>
          </div>
          <div className="w-full h-4 bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 bg-gradient-to-r ${palette.progressBarGradient}`}
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      </main>

      {/* Lower Third Ticker */}
      <footer className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs font-extrabold text-amber-400 shrink-0 uppercase tracking-wide">
          <Sparkles className="w-4 h-4" />
          <span>Recent Souls:</span>
        </div>
        <div className="flex items-center gap-4 overflow-hidden text-xs text-slate-300 min-w-0">
          {recentRecords.map(r => (
            <div key={r.id} className="flex items-center gap-1.5 shrink-0 bg-slate-800/60 px-3 py-1 rounded-lg">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-bold text-white">{r.firstName} {r.lastName}</span>
              <span className="text-slate-400">({r.residentialDistrict || 'Abuja'})</span>
            </div>
          ))}
        </div>
      </footer>
    </div>
  );
};
