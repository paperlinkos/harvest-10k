import React, { useState, useEffect } from 'react';
import { dataService } from '../services/dataService';
import { Campaign, Centre, SoulRecord } from '../types';
import { useTheme } from '../context/ThemeContext';
import {
  Maximize2,
  Minimize2,
  Flame,
  Sparkles,
  Users,
  Building2,
  Clock,
  MapPin,
  X,
  Radio,
} from 'lucide-react';
import { CountUpNumber } from '../components/CountUpNumber';

interface ProjectorViewProps {
  onExit: () => void;
}

export const ProjectorView: React.FC<ProjectorViewProps> = ({ onExit }) => {
  const { palette } = useTheme();
  const [stats, setStats] = useState(dataService.getStats());
  const [campaign, setCampaign] = useState<Campaign>(dataService.getCampaign());
  const [recentRecords, setRecentRecords] = useState<SoulRecord[]>(
    dataService.getSoulRecords().slice(0, 8)
  );
  const [centres, setCentres] = useState<Centre[]>(dataService.getCentres());
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const unsub = dataService.subscribe(() => {
      setStats(dataService.getStats());
      setCampaign(dataService.getCampaign());
      setRecentRecords(dataService.getSoulRecords().slice(0, 8));
      setCentres(dataService.getCentres());
    });
    return unsub;
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const progressPct = Math.min(100, Math.round((stats.totalSouls / campaign.target) * 100));

  return (
    <div className="fixed inset-0 z-50 bg-[#090D16] text-white flex flex-col justify-between p-6 sm:p-10 select-none overflow-hidden font-sans">
      {/* Top Bar */}
      <header className="flex items-center justify-between border-b border-slate-800/80 pb-5">
        <div className="flex items-center gap-4">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg"
            style={{ backgroundColor: palette.hex }}
          >
            <Flame className="w-7 h-7 text-white animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-extrabold tracking-widest text-amber-400 flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 animate-pulse text-red-500" />
                Live Crusade Collation
              </span>
              <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-mono">
                Abuja FCT
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight">{campaign.name}</h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={toggleFullscreen}
            className="p-3 rounded-2xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </button>
          <button
            onClick={onExit}
            className="p-3 rounded-2xl bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/40 text-rose-300 transition-colors cursor-pointer flex items-center gap-2 text-xs font-bold"
            title="Exit Projector Mode"
          >
            <X className="w-5 h-5" />
            <span className="hidden sm:inline">Exit Hall Mode</span>
          </button>
        </div>
      </header>

      {/* Main Center Display: Big Number Hero */}
      <main className="flex-1 flex flex-col justify-center items-center my-6 space-y-8">
        <div className="text-center space-y-3">
          <span className="text-xs sm:text-sm uppercase font-bold tracking-widest text-slate-400">
            Total Souls Won & Harvested
          </span>
          <div
            className="text-7xl sm:text-9xl md:text-[11rem] font-black tracking-tighter leading-none"
            style={{ color: palette.hex }}
          >
            <CountUpNumber value={stats.totalSouls} duration={1200} />
          </div>
          <div className="flex items-center justify-center gap-6 text-sm sm:text-lg text-slate-300 font-medium">
            <span className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              Verified Total: <strong className="text-white font-mono">{stats.totalSouls.toLocaleString()}</strong>
            </span>
            <span className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              Remaining to Target: <strong className="text-white font-mono">{stats.remaining.toLocaleString()}</strong>
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full max-w-4xl space-y-2">
          <div className="flex justify-between text-xs sm:text-sm font-semibold text-slate-400">
            <span>Campaign Goal Progress</span>
            <span className="text-white font-mono font-bold">
              {progressPct}% of {campaign.target.toLocaleString()} Souls
            </span>
          </div>
          <div className="w-full h-5 sm:h-7 bg-slate-900 rounded-full overflow-hidden p-1 border border-slate-800">
            <div
              className={`h-full rounded-full transition-all duration-1000 bg-gradient-to-r ${palette.progressBarGradient}`}
              style={{ width: `${Math.max(5, progressPct)}%` }}
            />
          </div>
        </div>

        {/* Live Recent Harvest Stream Pill */}
        <div className="w-full max-w-5xl bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Latest Soul Registrations Just In:</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {recentRecords.slice(0, 4).map(r => (
              <div
                key={r.id}
                className="bg-slate-800/70 border border-slate-700/60 rounded-xl p-2.5 text-xs truncate"
              >
                <div className="font-bold text-white truncate">
                  {r.firstName} {r.lastName}
                </div>
                <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5 truncate">
                  <MapPin className="w-2.5 h-2.5 text-slate-500 shrink-0" />
                  <span className="truncate">{r.residentialDistrict || r.community || 'Abuja'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer Verse */}
      <footer className="border-t border-slate-800/80 pt-4 text-center">
        <p className="text-xs sm:text-sm text-slate-400 italic">"{campaign.verse}"</p>
      </footer>
    </div>
  );
};
