import React, { useMemo, useState, useEffect } from 'react';
import html2canvas from 'html2canvas';
import { dataService } from '../services/dataService';
import { CountUpNumber } from '../components/CountUpNumber';
import { AbujaFctD3Map } from '../components/AbujaFctD3Map';
import { GeospatialHarvestMap } from '../components/GeospatialHarvestMap';
import { useTheme } from '../context/ThemeContext';
import { SessionTimerWidget } from '../components/SessionTimerWidget';
import { OnboardingFlowCards } from '../components/OnboardingFlowCards';
import { ScreenName } from '../components/Sidebar';
import { PWAInstallButton } from '../components/PWAInstallButton';
import { CampaignCountdownWidget } from '../components/CampaignCountdownWidget';
import { UserRole, CollationMode } from '../types';
import { useSessionTimer } from '../hooks/useSessionTimer';
import { playDingSound, playCelebrationSound } from '../utils/audioUtils';
import {
  Flame,
  Award,
  Users,
  Clock,
  Calendar,
  TrendingUp,
  Building2,
  Radio,
  ArrowUpRight,
  Sparkles,
  MapPin,
  Compass,
  PieChart as PieIcon,
  BarChart3,
  Search,
  X,
  Download,
  UserPlus,
  Zap,
  CheckCircle2,
  Tv,
  Camera,
  Layers,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  ArrowUp,
  Database,
  Lock,
  LogOut,
  ShieldCheck,
  Star,
  RefreshCw,
  Maximize2,
  User,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';

interface LiveDashboardProps {
  theme?: 'dark' | 'light';
  userRole?: UserRole;
  onNavigateToAddSoul?: () => void;
  onNavigateToProjector?: () => void;
  onNavigate?: (screen: ScreenName) => void;
  onOpenTour?: () => void;
  onOpenAuthModal?: () => void;
  onOpenSidebar?: () => void;
  onLogout?: () => void;
  onSuccessToast?: (title: string, message: string) => void;
}

type CounterMode = 'total' | 'today' | 'target' | 'percent';
type DrawerTab = 'analytics' | 'map' | 'centres' | 'tools';

export const LiveDashboard: React.FC<LiveDashboardProps> = ({
  theme = 'light',
  userRole = 'public',
  onNavigateToAddSoul,
  onNavigateToProjector,
  onNavigate,
  onOpenTour,
  onOpenAuthModal,
  onOpenSidebar,
  onLogout,
  onSuccessToast,
}) => {
  const { palette } = useTheme();
  const isDark = theme === 'dark';

  // Zen layout mode states
  const [counterMode, setCounterMode] = useState<CounterMode>('total');
  const [viewMode, setViewMode] = useState<'zen' | 'expanded'>('zen');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerTab, setDrawerTab] = useState<DrawerTab>('analytics');
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  const [isTapping, setIsTapping] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [tapFlash, setTapFlash] = useState<string | null>(null);

  // Operational filter states
  const [centreSearch, setCentreSearch] = useState('');
  const [selectedAreaCouncilFilter, setSelectedAreaCouncilFilter] = useState('all');
  const [isExportingSnapshot, setIsExportingSnapshot] = useState(false);
  const [activeChartTab, setActiveChartTab] = useState<'hourly' | 'cumulative'>('hourly');

  // Collation statistics & telemetry
  const activeProfile = dataService.getSoulWinnerProfile();
  const stats = dataService.getStats(activeProfile, userRole);
  const standings = dataService.getCentreStandings(activeProfile, userRole);
  const hourlyTrend = dataService.getHourlyTrend();
  const dailyCumulative = dataService.getDailyCumulative();
  const decisionBreakdown = dataService.getDecisionBreakdown();
  const areaCouncilBreakdown = dataService.getAreaCouncilBreakdown();
  const campaign = dataService.getCampaign();
  const recon = dataService.getReconciliationStats();

  const isAuthorizedOpsRole = userRole === 'coordinator' || userRole === 'admin';

  // 24-Hour Campaign Session Timer & Collation Environment State
  const { timer: sessionTimer, remainingMs } = useSessionTimer();
  const [collationMode, setCollationMode] = useState<CollationMode>(() => dataService.getCollationMode());

  useEffect(() => {
    const handleUpdate = () => {
      setCollationMode(dataService.getCollationMode());
    };
    const unsub = dataService.subscribe(handleUpdate);
    return unsub;
  }, []);

  const totalSeconds = Math.floor(remainingMs / 1000);
  const countdownHours = Math.floor(totalSeconds / 3600);
  const countdownMinutes = Math.floor((totalSeconds % 3600) / 60);
  const countdownSeconds = totalSeconds % 60;
  const formattedCountdown = `${countdownHours.toString().padStart(2, '0')}:${countdownMinutes.toString().padStart(2, '0')}:${countdownSeconds.toString().padStart(2, '0')}`;

  // Target progress percentage (accurate against campaign target)
  const progressPercent = Math.round((stats.totalSouls / Math.max(1, stats.target)) * 1000) / 10;

  // Today's Souls calculation (clean 0 when totalSouls is 0)
  const todaySoulsCount = useMemo(() => {
    if (stats.totalSouls === 0) return 0;
    const todayStr = new Date().toISOString().split('T')[0];
    const records = dataService.getSoulRecords();
    const verifiedToday = records.filter(
      r => r.status === 'verified' && Boolean(r.wonAt && r.wonAt.startsWith(todayStr))
    ).length;
    return verifiedToday > 0 ? verifiedToday : Math.min(stats.totalSouls, Math.max(stats.soulsLastHour * 3, 0));
  }, [stats.totalSouls, stats.soulsLastHour]);

  // Normalized chart data for Hourly / Cumulative chart
  const normalizedChartData = useMemo(() => {
    if (activeChartTab === 'hourly') {
      return hourlyTrend.map(p => ({
        label: p.hourLabel,
        souls: p.count,
        cumulative: p.cumulative,
      }));
    }
    return dailyCumulative.map(p => ({
      label: p.dateLabel,
      souls: p.count,
      cumulative: p.cumulative,
    }));
  }, [activeChartTab, hourlyTrend, dailyCumulative]);

  // Milestone stars calculation: proportional to active campaign target
  const milestoneStarCount = useMemo(() => {
    const ratio = stats.totalSouls / Math.max(1, stats.target);
    if (ratio >= 1.0) return 5;
    if (ratio >= 0.8) return 4;
    if (ratio >= 0.6) return 3;
    if (ratio >= 0.4) return 2;
    if (ratio >= 0.2) return 1;
    return 0;
  }, [stats.totalSouls, stats.target]);

  // Handle Quick Tap / Record Soul -> Opens Simple Soul Recording Form
  const handleQuickTap = () => {
    if (userRole === 'public') {
      if (onOpenAuthModal) onOpenAuthModal();
      return;
    }
    if (onNavigate) {
      onNavigate('add-soul');
    }
  };

  // Handle Sync Telemetry
  const handleSyncTelemetry = () => {
    setIsSyncing(true);
    if (isSoundEnabled) {
      playDingSound();
    }
    setTimeout(() => {
      setIsSyncing(false);
      if (onSuccessToast) {
        onSuccessToast('Wire Synchronized', `Live collation telemetry is up-to-date with all ${standings.length} churches.`);
      }
    }, 600);
  };

  // Toggle browser fullscreen
  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  // Export high-resolution PNG snapshot
  const handleDownloadSnapshot = async () => {
    const el = document.getElementById('live-dashboard-container');
    if (!el) return;
    setIsExportingSnapshot(true);
    try {
      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        backgroundColor: isDark ? '#05070a' : '#f8fafc',
      });
      const link = document.createElement('a');
      link.download = `Harvest10K_Abuja_Dashboard_${new Date().toISOString().slice(0, 10)}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      if (onSuccessToast) {
        onSuccessToast(
          'Snapshot Exported',
          'High-resolution PNG dashboard snapshot downloaded successfully!'
        );
      }
    } catch (err) {
      console.error('Failed to export dashboard snapshot:', err);
    } finally {
      setIsExportingSnapshot(false);
    }
  };

  // Donut chart data
  const donutData = useMemo(() => {
    return [
      { name: 'New Converts', value: decisionBreakdown.newConverts, color: palette.hex },
      { name: 'Rededications', value: decisionBreakdown.rededications, color: '#3b82f6' },
      { name: 'Returnees', value: decisionBreakdown.returnees, color: '#94a3b8' },
    ];
  }, [decisionBreakdown, palette.hex]);

  // Area Council chart data
  const areaCouncilData = useMemo(() => {
    return areaCouncilBreakdown.map(r => ({
      name: r.areaCouncilName.replace(' (AMAC)', '').replace(' Area Council', ''),
      souls: r.soulsWon,
      target: r.target,
      percent: r.percentageOfTotal,
    }));
  }, [areaCouncilBreakdown]);

  // Filtered standings for the 14-centre directory table
  const filteredStandings = useMemo(() => {
    return standings.filter(item => {
      const matchSearch =
        item.centre.name.toLowerCase().includes(centreSearch.toLowerCase()) ||
        item.centre.code.toLowerCase().includes(centreSearch.toLowerCase()) ||
        item.centre.venue.toLowerCase().includes(centreSearch.toLowerCase());

      if (selectedAreaCouncilFilter === 'all') return matchSearch;

      const councilName = (item.areaCouncilName || item.regionName || '').toLowerCase();
      const filter = selectedAreaCouncilFilter.toLowerCase();
      const matchCouncil =
        councilName.includes(filter) ||
        filter.includes(councilName) ||
        (filter === 'amac' && councilName.includes('municipal')) ||
        (filter === 'bwari' && councilName.includes('bwari')) ||
        (filter === 'gwagwalada' && councilName.includes('gwagwalada')) ||
        (filter === 'kuje' && councilName.includes('kuje')) ||
        (filter === 'kwali' && councilName.includes('kwali')) ||
        (filter === 'abaji' && councilName.includes('abaji'));

      return matchSearch && matchCouncil;
    });
  }, [standings, centreSearch, selectedAreaCouncilFilter]);

  const selectedCouncilIdForMap = useMemo(() => {
    if (selectedAreaCouncilFilter === 'all') return null;
    const f = selectedAreaCouncilFilter.toLowerCase();
    if (f.includes('amac') || f.includes('municipal')) return 'amac';
    if (f.includes('bwari')) return 'bwari';
    if (f.includes('gwagwalada')) return 'gwagwalada';
    if (f.includes('kuje')) return 'kuje';
    if (f.includes('kwali')) return 'kwali';
    if (f.includes('abaji')) return 'abaji';
    return f;
  }, [selectedAreaCouncilFilter]);

  const areaCouncils = useMemo(() => {
    return Array.from(new Set(standings.map(s => s.areaCouncilName || s.regionName)));
  }, [standings]);

  // Floating pill tooltip for Recharts
  const ChartTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 text-white dark:bg-white dark:text-slate-900 px-3.5 py-1.5 rounded-full text-xs font-bold shadow-2xl flex items-center gap-2 border border-white/10 dark:border-slate-800">
          <span className="text-slate-400 dark:text-slate-500 font-medium">{label}:</span>
          <span className="text-blue-400 dark:text-blue-600 font-extrabold font-mono-tabular">
            +{Number(payload[0].value).toLocaleString()} souls
          </span>
        </div>
      );
    }
    return null;
  };

  return (
    <div
      id="live-dashboard-container"
      className={`w-full h-full select-none relative transition-colors duration-200 flex flex-col justify-between ${
        viewMode === 'expanded' ? 'min-h-[calc(100vh-100px)] overflow-y-auto' : 'overflow-hidden'
      }`}
    >
      {/* ========================================================================= */}
      {/* 1. TOP ROW: BRANDING (LEFT) & SCRIPTURE THEME (RIGHT)                      */}
      {/* ========================================================================= */}
      <header className="flex items-center justify-between gap-4 pt-2 sm:pt-3 px-1 sm:px-2 shrink-0">
        {/* Left: Minimalist Branding (flocus-style) */}
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl sm:text-3xl font-black font-display tracking-tight text-slate-900 dark:text-white lowercase">
              harvest <span style={{ color: palette.hex }}>10k</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
              Live
            </span>
          </div>
          <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            by Christ Embassy Abuja
          </p>
        </div>

        {/* Right: Scripture Theme Quote & Install Button */}
        <div className="flex items-center gap-2 sm:gap-3">
          <PWAInstallButton variant="compact" />
          <div className="text-right max-w-xs sm:max-w-md hidden md:block">
            <p className="text-xs font-medium italic text-slate-700 dark:text-slate-300 font-serif leading-snug">
              "{campaign.verse || 'He that winneth souls is wise, and the harvest is plentiful.'}"
            </p>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mt-0.5">
              — Campaign Theme
            </span>
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. THE HERO STAGE: DEAD-CENTER COUNTER (ARRANGED LIKE REFERENCE IMAGE)     */}
      {/* ========================================================================= */}
      <main className="flex-1 flex flex-col items-center justify-center py-2 sm:py-4 my-auto min-h-0 w-full">
        <div className="w-full max-w-6xl flex flex-col items-center text-center space-y-2.5 sm:space-y-3.5">
          {/* Active Category Heading */}
          <div className="space-y-0.5">
            <h2 className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-200 tracking-wide">
              Abuja Central Collation • Soul Harvest
            </h2>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
              Christ Embassy Abuja Zone 1 • Federal Capital Territory
            </p>
          </div>

          {/* Mode Switcher Pills (Sleek Segmented Capsule Proportion) */}
          <div className="inline-flex items-center p-1 rounded-full bg-slate-100/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 shadow-2xs gap-1 max-w-full overflow-x-auto">
            <button
              type="button"
              onClick={() => setCounterMode('total')}
              className={`px-3.5 sm:px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                counterMode === 'total'
                  ? 'bg-white text-slate-950 dark:bg-slate-800 dark:text-white shadow-xs font-black'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
              }`}
            >
              Total Verified
            </button>
            <button
              type="button"
              onClick={() => setCounterMode('today')}
              className={`px-3.5 sm:px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                counterMode === 'today'
                  ? 'bg-white text-slate-950 dark:bg-slate-800 dark:text-white shadow-xs font-black'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
              }`}
            >
              Today's Harvest
            </button>
            <button
              type="button"
              onClick={() => setCounterMode('target')}
              className={`px-3.5 sm:px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                counterMode === 'target'
                  ? 'bg-white text-slate-950 dark:bg-slate-800 dark:text-white shadow-xs font-black'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
              }`}
            >
              Target ({stats.target.toLocaleString()})
            </button>
            <button
              type="button"
              onClick={() => setCounterMode('percent')}
              className={`px-3.5 sm:px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                counterMode === 'percent'
                  ? 'bg-white text-slate-950 dark:bg-slate-800 dark:text-white shadow-xs font-black'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
              }`}
            >
              Progress %
            </button>
          </div>

          {/* Progressing Fire Bar (Harvest Flame Progression towards target) */}
          <div className="w-full max-w-sm sm:max-w-md my-1 px-2">
            <div className="flex items-center justify-between text-xs font-bold mb-1">
              <span className="flex items-center gap-1.5 text-orange-600 dark:text-orange-400 font-display">
                <Flame className="w-3.5 h-3.5 fill-orange-500 text-orange-500 fire-glow" />
                <span className="tracking-wide uppercase text-[10px] font-black">Harvest Fire</span>
                <span className="font-mono-tabular px-1.5 py-0.5 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 text-[10px] border border-orange-500/20 font-black">
                  {progressPercent}%
                </span>
              </span>
              <span className="text-[10px] font-mono-tabular text-slate-500 dark:text-slate-400">
                <strong className="text-slate-900 dark:text-slate-100">{stats.totalSouls.toLocaleString()}</strong> / {stats.target.toLocaleString()} souls
              </span>
            </div>

            {/* Glowing Fire Track */}
            <div className="relative h-3.5 sm:h-4 w-full rounded-full bg-slate-200/90 dark:bg-slate-800/90 border border-slate-300 dark:border-slate-700/80 p-0.5 shadow-inner">
              {/* Progressing Fire Fill */}
              <div
                className="h-full rounded-full fire-bar-gradient relative transition-all duration-700 ease-out shadow-[0_0_14px_rgba(249,115,22,0.7)] flex items-center justify-end"
                style={{ width: `${Math.min(100, Math.max(3, progressPercent))}%` }}
              >
                {/* Leading animated ember flame tip */}
                <div className="absolute -right-2 top-1/2 -translate-y-1/2 flex items-center justify-center z-10">
                  <span className="animate-ping absolute inline-flex h-3.5 w-3.5 rounded-full bg-amber-400 opacity-75" />
                  <div className="relative w-4 h-4 rounded-full bg-gradient-to-tr from-amber-400 via-orange-500 to-rose-600 flex items-center justify-center shadow-lg border border-white/80 dark:border-slate-900">
                    <Flame className="w-2.5 h-2.5 text-white fill-white animate-pulse" />
                  </div>
                </div>
              </div>

              {/* Milestone Markers along the track */}
              <div className="absolute inset-0 pointer-events-none flex justify-between px-3 items-center">
                <div
                  className="w-0.5 h-1.5 bg-slate-400/40 dark:bg-slate-600/60 rounded-full"
                  title={`25% (${Math.round(stats.target * 0.25).toLocaleString()} Souls)`}
                />
                <div
                  className="w-0.5 h-2 bg-slate-400/50 dark:bg-slate-500/70 rounded-full"
                  title={`50% (${Math.round(stats.target * 0.5).toLocaleString()} Souls - Halfway)`}
                />
                <div
                  className="w-0.5 h-1.5 bg-slate-400/40 dark:bg-slate-600/60 rounded-full"
                  title={`75% (${Math.round(stats.target * 0.75).toLocaleString()} Souls)`}
                />
              </div>
            </div>

            {/* Milestone labels below fire bar */}
            <div className="flex items-center justify-between text-[8.5px] text-slate-400 dark:text-slate-500 font-mono font-semibold px-1 mt-0.5">
              <span>0</span>
              <span className={stats.totalSouls >= stats.target * 0.25 ? 'text-amber-500 font-bold' : ''}>
                {stats.target >= 4000 ? `${Math.round((stats.target * 0.25) / 1000)}K` : Math.round(stats.target * 0.25)}
              </span>
              <span className={stats.totalSouls >= stats.target * 0.5 ? 'text-orange-500 font-bold' : ''}>
                {stats.target >= 2000 ? `${Math.round((stats.target * 0.5) / 1000)}K` : Math.round(stats.target * 0.5)} (Halfway)
              </span>
              <span className={stats.totalSouls >= stats.target * 0.75 ? 'text-rose-500 font-bold' : ''}>
                {stats.target >= 4000 ? `${Math.round((stats.target * 0.75) / 1000)}K` : Math.round(stats.target * 0.75)}
              </span>
              <span className={stats.totalSouls >= stats.target ? 'text-emerald-500 font-bold' : ''}>
                {stats.target >= 1000 ? `${Math.round(stats.target / 1000)}K` : stats.target} Goal
              </span>
            </div>
          </div>

          {/* Massive Central Scoreboard Counter */}
          <div className="my-0 sm:my-1 select-none relative flex flex-col items-center justify-center">
            {counterMode === 'percent' ? (
              <div className="text-8xl sm:text-9xl md:text-[10.5rem] lg:text-[12.5rem] xl:text-[14.5rem] font-black font-display tracking-tighter leading-none text-slate-950 dark:text-white font-mono-tabular drop-shadow-md py-1">
                {progressPercent}%
              </div>
            ) : counterMode === 'today' ? (
              <div className="text-8xl sm:text-9xl md:text-[10.5rem] lg:text-[12.5rem] xl:text-[14.5rem] font-black font-display tracking-tighter leading-none text-slate-950 dark:text-white font-mono-tabular drop-shadow-md py-1">
                +<CountUpNumber value={todaySoulsCount} duration={900} />
              </div>
            ) : counterMode === 'target' ? (
              <div className="text-7xl sm:text-8xl md:text-[9.5rem] lg:text-[11.5rem] xl:text-[13rem] font-black font-display tracking-tighter leading-none text-slate-950 dark:text-white font-mono-tabular drop-shadow-md py-1">
                {stats.target.toLocaleString()}
              </div>
            ) : (
              <div className="text-8xl sm:text-9xl md:text-[10.5rem] lg:text-[12.5rem] xl:text-[14.5rem] font-black font-display tracking-tighter leading-none text-slate-950 dark:text-white font-mono-tabular drop-shadow-md py-1">
                <CountUpNumber value={stats.totalSouls} duration={1200} />
              </div>
            )}

            {/* Tap celebratory visual flash badge */}
            {tapFlash && (
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-4 py-1.5 rounded-full bg-emerald-500 text-white font-black text-sm shadow-xl animate-bounce">
                {tapFlash}
              </div>
            )}

            <p className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400 mt-1">
              {stats.remaining > 0
                ? `${stats.remaining.toLocaleString()} souls remaining to ${stats.target.toLocaleString()} victory target in the FCT`
                : `${stats.target.toLocaleString()} Milestone Achieved! Glory to God in the Highest!`}
            </p>
          </div>

          {/* Control Buttons Bar (Start / Reset / Fullscreen equivalent) */}
          <div className="flex items-center justify-center gap-3 pt-1">
            {/* Primary Action Button: "Record a Soul" for Guest, "+1 Soul Tap" for Authenticated Soul Winner */}
            {userRole === 'public' ? (
              <button
                type="button"
                onClick={() => onOpenAuthModal?.()}
                className="h-11 px-7 rounded-full text-sm font-black transition-all transform active:scale-95 cursor-pointer shadow-lg flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950"
                title="Record a Soul Won in the Field"
              >
                <Flame className="w-4 h-4 text-slate-950 fill-slate-950" />
                <span>Record a Soul</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleQuickTap}
                disabled={isTapping}
                className={`h-11 px-7 rounded-full text-sm font-black transition-all transform active:scale-95 cursor-pointer shadow-lg flex items-center gap-2 ${
                  isDark
                    ? 'bg-white text-slate-950 hover:bg-slate-100'
                    : 'bg-slate-900 text-white hover:bg-slate-800'
                }`}
              >
                <Flame className="w-4 h-4 text-emerald-500 fill-emerald-500" />
                <span>+1 Soul Tap</span>
              </button>
            )}

            {/* Quick Re-sync Button */}
            <button
              type="button"
              onClick={handleSyncTelemetry}
              title="Sync Collation Telemetry"
              className="w-11 h-11 flex items-center justify-center rounded-full border border-slate-300 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-all cursor-pointer shadow-2xs"
              aria-label="Sync Collation Telemetry"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin text-emerald-500' : ''}`} />
            </button>

            {/* Fullscreen Mode */}
            <button
              type="button"
              onClick={toggleFullScreen}
              title="Fullscreen View"
              className="w-11 h-11 flex items-center justify-center rounded-full border border-slate-300 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-all cursor-pointer shadow-2xs"
              aria-label="Toggle Fullscreen"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </main>

      {/* ========================================================================= */}
      {/* 3. BOTTOM FLOATING DOCKS (PERIPHERAL TOOLS TUCKED AWAY)                    */}
      {/* ========================================================================= */}
      <footer className="flex items-center justify-between gap-4 pt-1 pb-1.5 px-1 sm:px-2 shrink-0">
        {/* Bottom Left Dock: Translucent Glass Icons (Secondary tools tucked away) */}
        <div className="h-10 px-1.5 rounded-full bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 backdrop-blur-md shadow-xs flex items-center gap-1">
          <button
            type="button"
            onClick={() => {
              setDrawerTab('analytics');
              setIsDrawerOpen(true);
            }}
            title="Open Analytics & Operational Charts"
            className="w-7 h-7 rounded-full flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-950 dark:hover:text-white transition-all cursor-pointer"
            aria-label="Open Analytics"
          >
            <BarChart3 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => {
              setDrawerTab('map');
              setIsDrawerOpen(true);
            }}
            title="Open Geospatial Harvest Map"
            className="w-7 h-7 rounded-full flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-950 dark:hover:text-white transition-all cursor-pointer"
            aria-label="Open Geospatial Map"
          >
            <Compass className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => {
              setDrawerTab('centres');
              setIsDrawerOpen(true);
            }}
            title="Open 14 Collation Centres Directory"
            className="w-7 h-7 rounded-full flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-950 dark:hover:text-white transition-all cursor-pointer"
            aria-label="Open Centres Directory"
          >
            <Building2 className="w-4 h-4" />
          </button>
          {userRole !== 'public' ? (
            <button
              type="button"
              onClick={() => onNavigate?.('records')}
              title="Field Records Directory"
              className="w-7 h-7 rounded-full flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-950 dark:hover:text-white transition-all cursor-pointer"
              aria-label="Open Field Records"
            >
              <Database className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onOpenAuthModal?.()}
              title="Field Records (Protected - Login Required)"
              className="w-7 h-7 rounded-full flex items-center justify-center text-amber-500/80 hover:text-amber-600 hover:bg-amber-500/10 transition-all cursor-pointer"
              aria-label="Field Records Protected - Click to Sign In"
            >
              <Lock className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Bottom Right Dock: Quick Status Pills */}
        <div className="flex items-center gap-2">
          {/* Velocity Pill */}
          <div className="h-10 flex items-center gap-1.5 px-3.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-600 dark:text-orange-400 font-bold text-xs shadow-2xs">
            <Flame className="w-3.5 h-3.5 fill-orange-500 text-orange-500" />
            <span>+{todaySoulsCount} Today</span>
          </div>

          {/* Pending Verification Pill */}
          {stats.pendingApprovalsCount > 0 && (
            <button
              type="button"
              onClick={() => onNavigate?.('approval')}
              className="h-10 flex items-center gap-1.5 px-3.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 font-bold text-xs cursor-pointer hover:bg-amber-500/20 shadow-2xs"
              title="Open pending approvals queue"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{stats.pendingApprovalsCount} Pending</span>
            </button>
          )}
        </div>
      </footer>

      {/* ========================================================================= */}
      {/* 4. EXPANDABLE OPERATIONS SECTION (IF VIEW MODE IS EXPANDED)               */}
      {/* ========================================================================= */}
      {viewMode === 'expanded' && (
        <section className="mt-8 pt-8 border-t border-slate-200 dark:border-slate-800 space-y-6">
          {/* Quick Ops Control Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-emerald-500" />
                Operational Intelligence & Live Analytics
              </h3>
              <p className="text-xs text-slate-400">
                Detailed telemetry, velocity charts, and spatial distribution across Abuja
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleDownloadSnapshot}
                disabled={isExportingSnapshot}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{isExportingSnapshot ? 'Exporting...' : 'Snapshot PNG'}</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('zen')}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-slate-900 text-white dark:bg-white dark:text-slate-900 cursor-pointer shadow-2xs"
              >
                Close Ops View
              </button>
            </div>
          </div>

          {/* Hourly / Cumulative Growth Charts & Decision Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 clay-card p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                  <span className="font-bold text-sm text-slate-900 dark:text-white">
                    Harvest Velocity & Growth Curve
                  </span>
                </div>
                <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-0.5 text-xs font-bold">
                  <button
                    onClick={() => setActiveChartTab('hourly')}
                    className={`px-3 py-1 rounded-lg cursor-pointer transition-all ${
                      activeChartTab === 'hourly'
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Hourly Surge
                  </button>
                  <button
                    onClick={() => setActiveChartTab('cumulative')}
                    className={`px-3 py-1 rounded-lg cursor-pointer transition-all ${
                      activeChartTab === 'cumulative'
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Cumulative Goal
                  </button>
                </div>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={normalizedChartData}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={palette.hex} stopOpacity={0.4} />
                        <stop offset="95%" stopColor={palette.hex} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="label"
                      stroke="#94a3b8"
                      fontSize={11}
                      tickLine={false}
                    />
                    <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <Tooltip content={<ChartTooltip />} />
                    <Area
                      type="monotone"
                      dataKey={activeChartTab === 'hourly' ? 'souls' : 'cumulative'}
                      stroke={palette.hex}
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#chartGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Decision Type Breakdown Donut */}
            <div className="clay-card p-6 space-y-4 flex flex-col justify-between">
              <div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <PieIcon className="w-4 h-4 text-emerald-500" />
                  Decision Types
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Breakdown of new converts, rededications & returnees
                </p>
              </div>

              <div className="h-44 w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={donutData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={65}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {donutData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-xl font-black text-slate-900 dark:text-white font-mono">
                    {stats.totalSouls.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Total Souls</span>
                </div>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                {donutData.map(d => (
                  <div key={d.name} className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                      {d.name}
                    </span>
                    <span className="font-bold font-mono text-slate-900 dark:text-white">
                      {d.value.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Interactive Geospatial Harvest Map */}
          <GeospatialHarvestMap
            selectedCouncilId={selectedCouncilIdForMap}
            onSelectCouncil={councilId => {
              if (!councilId) {
                setSelectedAreaCouncilFilter('all');
              } else {
                const councilObj = dataService.getAreaCouncils().find(c => c.id === councilId);
                setSelectedAreaCouncilFilter(councilObj ? councilObj.name : councilId);
              }
            }}
          />

          {/* 14 Collation Centres Standings Table */}
          <div className="clay-card p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-emerald-500" />
                  14 Collation Centres Standings
                </h4>
                <p className="text-xs text-slate-400">
                  Live reports and verification rates from every regional hub
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search centre..."
                    value={centreSearch}
                    onChange={e => setCentreSearch(e.target.value)}
                    className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                    <th className="py-2.5 px-3">Centre & Venue</th>
                    <th className="py-2.5 px-3">Area Council</th>
                    <th className="py-2.5 px-3 text-right">Target</th>
                    <th className="py-2.5 px-3 text-right">Souls Won</th>
                    <th className="py-2.5 px-3 text-right">Progress</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {filteredStandings.map(item => {
                    const pct = item.percentageOfTarget ?? Math.min(100, Math.round((item.soulsWon / item.centre.target) * 100));
                    return (
                      <tr key={item.centre.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        <td className="py-3 px-3">
                          <span className="font-bold text-slate-900 dark:text-white block">
                            {item.centre.name}
                          </span>
                          <span className="text-[11px] text-slate-400">{item.centre.venue}</span>
                        </td>
                        <td className="py-3 px-3 text-slate-600 dark:text-slate-400">
                          {item.areaCouncilName || item.regionName}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-slate-500">
                          {item.centre.target.toLocaleString()}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          {item.soulsWon.toLocaleString()}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 font-mono">
                            {pct}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* 5. SLIDE-OVER OPERATIONS DRAWER (SECONDARY FEATURES TUCKED AWAY)           */}
      {/* ========================================================================= */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setIsDrawerOpen(false)}
          />

          {/* Drawer Content */}
          <div className="relative w-full max-w-2xl bg-white dark:bg-slate-950 border-l border-slate-200 dark:border-slate-800 shadow-2xl p-6 overflow-y-auto space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-500" />
                  Operational Suite
                </h3>
                <p className="text-xs text-slate-400">
                  Select a module to view telemetry, maps, or manage reports
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsDrawerOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
                aria-label="Close drawer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Tabs */}
            <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800 pb-3 overflow-x-auto">
              <button
                onClick={() => setDrawerTab('analytics')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                  drawerTab === 'analytics'
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Analytics
              </button>
              <button
                onClick={() => setDrawerTab('map')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                  drawerTab === 'map'
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Abuja Map
              </button>
              <button
                onClick={() => setDrawerTab('centres')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                  drawerTab === 'centres'
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                14 Centres
              </button>
              <button
                onClick={() => setDrawerTab('tools')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                  drawerTab === 'tools'
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Tools & Snapshot
              </button>
            </div>

            {/* Drawer Tab 1: Analytics */}
            {drawerTab === 'analytics' && (
              <div className="space-y-6">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400">
                    Hourly Harvest Surge
                  </h4>
                  <div className="h-56 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={hourlyTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <XAxis dataKey="hour" stroke="#94a3b8" fontSize={11} tickLine={false} />
                        <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                        <Tooltip content={<ChartTooltip />} />
                        <Area
                          type="monotone"
                          dataKey="souls"
                          stroke={palette.hex}
                          strokeWidth={2}
                          fill={palette.hex}
                          fillOpacity={0.15}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Donut Breakdown */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400">
                    Decision Type Distribution
                  </h4>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                      <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 block font-mono">
                        {decisionBreakdown.newConverts.toLocaleString()}
                      </span>
                      <span className="text-[10px] text-slate-400 font-bold uppercase">New Converts</span>
                    </div>
                    <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800">
                      <span className="text-xl font-black text-blue-600 dark:text-blue-400 block font-mono">
                        {decisionBreakdown.rededications.toLocaleString()}
                      </span>
                      <span className="text-[10px] text-slate-400 font-bold uppercase">Rededications</span>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      <span className="text-xl font-black text-slate-700 dark:text-slate-300 block font-mono">
                        {decisionBreakdown.returnees.toLocaleString()}
                      </span>
                      <span className="text-[10px] text-slate-400 font-bold uppercase">Returnees</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Drawer Tab 2: Map */}
            {drawerTab === 'map' && (
              <div className="space-y-4">
                <GeospatialHarvestMap
                  selectedCouncilId={selectedCouncilIdForMap}
                  onSelectCouncil={councilId => {
                    if (!councilId) {
                      setSelectedAreaCouncilFilter('all');
                    } else {
                      const councilObj = dataService.getAreaCouncils().find(c => c.id === councilId);
                      setSelectedAreaCouncilFilter(councilObj ? councilObj.name : councilId);
                    }
                  }}
                />
              </div>
            )}

            {/* Drawer Tab 3: Centres Directory */}
            {drawerTab === 'centres' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Search className="w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder={`Search ${standings.length} churches & centres...`}
                    value={centreSearch}
                    onChange={e => setCentreSearch(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs bg-slate-50 dark:bg-slate-900"
                  />
                </div>
                <div className="space-y-2">
                  {filteredStandings.map(item => (
                    <div
                      key={item.centre.id}
                      className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between"
                    >
                      <div>
                        <div className="font-bold text-xs text-slate-900 dark:text-white">
                          {item.centre.name}
                        </div>
                        <div className="text-[11px] text-slate-400">{item.centre.venue}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-black text-sm text-emerald-600 dark:text-emerald-400 font-mono">
                          +{item.soulsWon.toLocaleString()}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          Target: {item.centre.target.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Drawer Tab 4: Tools & Snapshot */}
            {drawerTab === 'tools' && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
                  <h4 className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-2">
                    <Download className="w-4 h-4 text-emerald-500" />
                    Export High-Res Snapshot
                  </h4>
                  <p className="text-xs text-slate-400">
                    Generate an instant PNG graphic for church screens, social broadcasting, or ministry reports.
                  </p>
                  <button
                    type="button"
                    onClick={handleDownloadSnapshot}
                    disabled={isExportingSnapshot}
                    className="w-full py-2.5 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-bold text-xs cursor-pointer shadow-md"
                  >
                    {isExportingSnapshot ? 'Generating PNG...' : 'Download Dashboard PNG Snapshot'}
                  </button>
                </div>

                {onOpenTour && (
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
                    <h4 className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      Collation Onboarding & Tour
                    </h4>
                    <p className="text-xs text-slate-400">
                      Learn the full collation workflows for soul winners, coordinators, and directors.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setIsDrawerOpen(false);
                        onOpenTour();
                      }}
                      className="w-full py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      Start Walkthrough Tour
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
