import React, { useMemo, useState } from 'react';
import html2canvas from 'html2canvas';
import { dataService } from '../services/dataService';
import { CountUpNumber } from '../components/CountUpNumber';
import { AbujaFctD3Map } from '../components/AbujaFctD3Map';
import { GeospatialHarvestMap } from '../components/GeospatialHarvestMap';
import { useTheme } from '../context/ThemeContext';
import { SessionTimerWidget } from '../components/SessionTimerWidget';
import { OnboardingFlowCards } from '../components/OnboardingFlowCards';
import { ScreenName } from '../components/Sidebar';
import {
  Flame,
  Award,
  Users,
  Clock,
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
  ArrowUp,
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
  onNavigateToAddSoul?: () => void;
  onNavigateToProjector?: () => void;
  onNavigate?: (screen: ScreenName) => void;
  onOpenTour?: () => void;
  onSuccessToast?: (title: string, message: string) => void;
}

export const LiveDashboard: React.FC<LiveDashboardProps> = ({
  theme = 'light',
  onNavigateToAddSoul,
  onNavigateToProjector,
  onNavigate,
  onOpenTour,
  onSuccessToast,
}) => {
  const { palette } = useTheme();
  const isDark = theme === 'dark';
  const [centreSearch, setCentreSearch] = useState('');
  const [selectedAreaCouncilFilter, setSelectedAreaCouncilFilter] = useState('all');
  const [isExportingSnapshot, setIsExportingSnapshot] = useState(false);
  const [activeChartTab, setActiveChartTab] = useState<'hourly' | 'cumulative'>('hourly');

  const stats = dataService.getStats();
  const standings = dataService.getCentreStandings();
  const hourlyTrend = dataService.getHourlyTrend();
  const dailyCumulative = dataService.getDailyCumulative();
  const decisionBreakdown = dataService.getDecisionBreakdown();
  const areaCouncilBreakdown = dataService.getAreaCouncilBreakdown();
  const campaign = dataService.getCampaign();
  const flashedCentreId = dataService.getLastFlashedCentreId();
  const recon = dataService.getReconciliationStats();

  const handleDownloadSnapshot = async () => {
    const el = document.getElementById('live-dashboard-container');
    if (!el) return;
    setIsExportingSnapshot(true);
    try {
      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        backgroundColor: isDark ? '#0b0d11' : '#f3f5f8',
      });
      const link = document.createElement('a');
      link.download = `Harvest10K_Abuja_Dashboard_${new Date().toISOString().slice(0, 10)}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      if (onSuccessToast) {
        onSuccessToast(
          'Snapshot Exported',
          'High-resolution PNG dashboard snapshot downloaded successfully for reporting and social sharing!'
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
      { name: 'New Converts', value: decisionBreakdown.newConverts, color: palette.hex }, // Dynamic theme accent
      { name: 'Rededications', value: decisionBreakdown.rededications, color: '#111317' }, // Jet Black
      { name: 'Returnees', value: decisionBreakdown.returnees, color: '#94a3b8' }, // Cool slate
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

  // Target progress percentage
  const progressPercent = Math.min(100, Math.round((stats.totalSouls / stats.target) * 1000) / 10);

  // Filtered standings
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

  // Floating pill tooltip for Recharts (Jobgio style)
  const JobgioTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 text-white dark:bg-white dark:text-slate-900 px-3.5 py-1.5 rounded-full text-xs font-bold shadow-2xl flex items-center gap-2 border border-white/10 dark:border-slate-800 animate-in fade-in zoom-in-95">
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
    <div id="live-dashboard-container" className="space-y-6 pb-16 max-w-7xl mx-auto">
      {/* Session Timer Widget */}
      <SessionTimerWidget />

      {/* Onboarding & Field Workflow Cards */}
      <OnboardingFlowCards
        onNavigate={onNavigate || (() => {})}
        onOpenTour={onOpenTour || (() => {})}
      />

      {/* 1. TOP SECTION: QUICK STATS VERTICAL PILL ROW (Jobgio Aesthetic) */}
      <section className="clay-card p-6 sm:p-7">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-lg font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              Quick Stats
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" /> Live
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Collation intelligence stream for Christ Embassy Abuja Zone 1
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleDownloadSnapshot}
              disabled={isExportingSnapshot}
              className="px-4 py-2 rounded-2xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 flex items-center gap-2 transition-all active:scale-95 cursor-pointer shadow-2xs"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>{isExportingSnapshot ? 'Generating...' : 'Export Snapshot'}</span>
            </button>
            {onNavigate && (
              <button
                type="button"
                onClick={() => onNavigate('records')}
                className="pill-active-black px-4 py-2 rounded-2xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-transform hover:scale-105 active:scale-95"
              >
                <span>Directory</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* 6 Vertical Rounded Pill Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 mt-5">
          {/* Card 1: Total Souls */}
          <div className="bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-4 flex flex-col items-center justify-between text-center transition-all duration-200 hover:-translate-y-1 hover:shadow-md group">
            <div className="w-10 h-10 rounded-full bg-slate-900 text-white dark:bg-white dark:text-slate-900 flex items-center justify-center shadow-xs mb-3 group-hover:scale-110 transition-transform">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black font-display text-slate-900 dark:text-white tracking-tight">
                <CountUpNumber value={stats.totalSouls} duration={800} />
              </div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-1">
                Total Souls
              </div>
            </div>
            <div className="mt-2 text-[10px] font-mono-tabular font-bold text-emerald-600 dark:text-emerald-400">
              {progressPercent}% Goal
            </div>
          </div>

          {/* Card 2: Target */}
          <div className="bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-4 flex flex-col items-center justify-between text-center transition-all duration-200 hover:-translate-y-1 hover:shadow-md group">
            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shadow-xs mb-3 group-hover:scale-110 transition-transform">
              <Award className="w-4 h-4" style={{ color: palette.hex }} />
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black font-display text-slate-900 dark:text-white tracking-tight">
                {stats.target.toLocaleString()}
              </div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-1">
                Campaign Goal
              </div>
            </div>
            <div className="mt-2 text-[10px] font-mono-tabular font-semibold text-slate-400">
              Target 10K
            </div>
          </div>

          {/* Card 3: Featured Active Centres (Jobgio Dark Pill Centerpiece) */}
          <div className="bg-slate-900 text-white dark:bg-white dark:text-slate-900 rounded-3xl p-4 flex flex-col items-center justify-between text-center shadow-xl transition-all duration-200 hover:-translate-y-1 hover:shadow-2xl relative group">
            <div className="w-10 h-10 rounded-full bg-white/20 text-white dark:bg-slate-900/10 dark:text-slate-900 flex items-center justify-center shadow-xs mb-3 group-hover:scale-110 transition-transform">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black font-display tracking-tight">
                {stats.centresReporting}
                <span className="text-sm font-normal opacity-60">/{stats.totalCentres}</span>
              </div>
              <div className="text-[10px] font-bold uppercase tracking-wider opacity-80 mt-1">
                Active Hubs
              </div>
            </div>
            <div className="mt-2 w-6 h-6 rounded-full bg-white/10 dark:bg-slate-900/10 flex items-center justify-center text-[10px]">
              <ArrowUpRight className="w-3 h-3" />
            </div>
          </div>

          {/* Card 4: Hourly Velocity */}
          <div className="bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-4 flex flex-col items-center justify-between text-center transition-all duration-200 hover:-translate-y-1 hover:shadow-md group">
            <div className="w-10 h-10 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center shadow-xs mb-3 group-hover:scale-110 transition-transform">
              <Flame className="w-4 h-4" />
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black font-display text-slate-900 dark:text-white tracking-tight">
                +{stats.soulsLastHour}
              </div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-1">
                Souls / Hour
              </div>
            </div>
            <div className="mt-2 text-[10px] font-mono-tabular font-semibold text-orange-600 dark:text-orange-400">
              ~{stats.hourlyVelocity} avg
            </div>
          </div>

          {/* Card 5: Contactable Rate */}
          <div className="bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-4 flex flex-col items-center justify-between text-center transition-all duration-200 hover:-translate-y-1 hover:shadow-md group">
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-xs mb-3 group-hover:scale-110 transition-transform">
              <Radio className="w-4 h-4" />
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black font-display text-slate-900 dark:text-white tracking-tight">
                {recon.contactableRate}%
              </div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-1">
                Contactable
              </div>
            </div>
            <div className="mt-2 text-[10px] font-mono-tabular font-semibold text-emerald-600 dark:text-emerald-400">
              {recon.totalContactable.toLocaleString()} Verified
            </div>
          </div>

          {/* Card 6: Fully Documented */}
          <div className="bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-4 flex flex-col items-center justify-between text-center transition-all duration-200 hover:-translate-y-1 hover:shadow-md group">
            <div className="w-10 h-10 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shadow-xs mb-3 group-hover:scale-110 transition-transform">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black font-display text-slate-900 dark:text-white tracking-tight">
                {recon.reconciliationRate}%
              </div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-1">
                Documented
              </div>
            </div>
            <div className="mt-2 text-[10px] font-mono-tabular font-semibold text-purple-600 dark:text-purple-400">
              {recon.totalComplete.toLocaleString()} Reconciled
            </div>
          </div>
        </div>
      </section>

      {/* 2. DUAL BENTO HERO CARDS & ACTION PILLS (Image 1 Bento Style) */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left Hero Card: Dark Obsidian Metallic Card with Topography Watermark */}
        <div className="lg:col-span-7 clay-card-hero-dark p-7 text-white relative overflow-hidden flex flex-col justify-between shadow-2xl min-h-[280px]">
          {/* Subtle topography SVG background */}
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M 0,40 Q 150,10 300,50 T 600,40 T 900,60"
                fill="none"
                stroke="white"
                strokeWidth="1.5"
              />
              <path
                d="M 0,90 Q 200,50 400,100 T 800,80"
                fill="none"
                stroke="white"
                strokeWidth="1.5"
              />
              <path
                d="M 0,160 Q 250,110 500,170 T 900,140"
                fill="none"
                stroke="white"
                strokeWidth="1.5"
              />
              <path
                d="M 0,220 Q 300,180 600,230 T 900,200"
                fill="none"
                stroke="white"
                strokeWidth="1.5"
              />
            </svg>
          </div>

          {/* Top Row: Chip + Campaign Badge */}
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-3">
              {/* Gold metallic SIM chip shape */}
              <div className="w-9 h-7 rounded-md bg-gradient-to-tr from-amber-400 to-amber-200 border border-amber-300/80 shadow-md flex items-center justify-center p-1">
                <div className="w-full h-full border border-amber-600/40 rounded-xs" />
              </div>
              <div>
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-300">
                  Harvest 10,000 Command
                </div>
                <div className="text-xs font-bold text-white tracking-wide">
                  Christ Embassy Abuja Zone 1
                </div>
              </div>
            </div>

            <span className="px-3.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-white/10 text-white border border-white/20 backdrop-blur-md">
              FCT Central
            </span>
          </div>

          {/* Middle: Big Counter Number */}
          <div className="my-5 relative z-10">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Total Souls Won to Christ
            </div>
            <div className="flex items-baseline gap-3 mt-1">
              <span className="text-4xl sm:text-5xl md:text-6xl font-black font-display tracking-tight text-white drop-shadow-sm">
                <CountUpNumber value={stats.totalSouls} duration={1000} />
              </span>
              <span className="text-slate-400 font-bold text-lg sm:text-xl font-display">
                / {stats.target.toLocaleString()}
              </span>
            </div>
            <div className="text-xs text-slate-400 font-mono-tabular mt-2">
              •••• 1810 &nbsp;&nbsp;&nbsp;&nbsp; 10/26 CAMPAIGN &nbsp;&nbsp;&nbsp;&nbsp;
              <span className="text-emerald-400 font-bold">
                {stats.remaining.toLocaleString()} souls remaining
              </span>
            </div>
          </div>

          {/* Bottom: Sleek Linear Progress Bar */}
          <div className="space-y-1.5 relative z-10 pt-2 border-t border-white/10">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-300 font-mono-tabular">
              <span className="flex items-center gap-1.5 font-bold" style={{ color: palette.hex }}>
                <TrendingUp className="w-3.5 h-3.5" />
                {progressPercent}% Goal Completed
              </span>
              <span className="text-slate-400">
                Velocity: ~{stats.hourlyVelocity}/hr
              </span>
            </div>
            <div className="h-2.5 w-full bg-white/10 rounded-full overflow-hidden p-0.5">
              <div
                className={`h-full bg-gradient-to-r ${palette.progressBarGradient} rounded-full transition-all duration-1000 ease-out shadow-xs`}
                style={{ width: `${Math.min(100, Math.max(2, progressPercent))}%` }}
              />
            </div>
          </div>
        </div>

        {/* Right Hero Card: Pure White Bento Companion Card with Action Pills */}
        <div className="lg:col-span-5 clay-card-hero-white p-7 flex flex-col justify-between shadow-xl min-h-[280px]">
          {/* Top Row: Collation Live Indicator */}
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                Collation Dispatch & Velocity
              </span>
              <span className="text-[11px] font-bold font-mono-tabular text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-200/60 dark:border-emerald-800">
                {stats.centresReporting} Centres Synced
              </span>
            </div>

            {/* Velocity Stats */}
            <div className="mt-4">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Harvest Collation Velocity
              </div>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-3xl sm:text-4xl font-black font-display text-slate-900 dark:text-white tracking-tight">
                  +{stats.soulsLastHour}/hr
                </span>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center">
                  <ArrowUp className="w-3 h-3" /> Peak Rate
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Projected total of{' '}
                <strong className="text-slate-900 dark:text-white font-bold">
                  {stats.projectedTotal.toLocaleString()}
                </strong>{' '}
                souls across all 6 Abuja Area Councils.
              </p>
            </div>
          </div>

          {/* Bottom: Horizontal Quick Action Pills (Image 1 Bento Aesthetic) */}
          <div className="pt-5 border-t border-slate-100 dark:border-slate-800">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2.5">
              Instant Collation Actions
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {/* Action 1: Quick Tally (Transfer Blue Pill from Image 1) */}
              {onNavigateToAddSoul && (
                <button
                  type="button"
                  onClick={onNavigateToAddSoul}
                  style={{ backgroundColor: palette.hex }}
                  className="text-white p-2.5 rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer transition-all hover:opacity-95 hover:scale-105 active:scale-95 group shadow-sm font-bold"
                >
                  <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center mb-1 group-hover:rotate-12 transition-transform">
                    <Zap className="w-3.5 h-3.5 text-white" />
                  </div>
                  <span className="text-[11px] font-bold">Quick Tally</span>
                </button>
              )}

              {/* Action 2: Add Soul Form */}
              {onNavigateToAddSoul && (
                <button
                  type="button"
                  onClick={onNavigateToAddSoul}
                  className="bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700 p-2.5 rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer transition-colors text-slate-800 dark:text-slate-200"
                >
                  <div className="w-7 h-7 rounded-full bg-slate-200/60 dark:bg-slate-700 flex items-center justify-center mb-1">
                    <UserPlus className="w-3.5 h-3.5 text-slate-700 dark:text-slate-200" />
                  </div>
                  <span className="text-[11px] font-semibold">Full Record</span>
                </button>
              )}

              {/* Action 3: Projector Screen */}
              {onNavigateToProjector && (
                <button
                  type="button"
                  onClick={onNavigateToProjector}
                  className="bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700 p-2.5 rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer transition-colors text-slate-800 dark:text-slate-200"
                >
                  <div className="w-7 h-7 rounded-full bg-slate-200/60 dark:bg-slate-700 flex items-center justify-center mb-1">
                    <Tv className="w-3.5 h-3.5 text-slate-700 dark:text-slate-200" />
                  </div>
                  <span className="text-[11px] font-semibold">Projector</span>
                </button>
              )}

              {/* Action 4: Testimonies */}
              {onNavigate && (
                <button
                  type="button"
                  onClick={() => onNavigate('testimonies')}
                  className="bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700 p-2.5 rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer transition-colors text-slate-800 dark:text-slate-200"
                >
                  <div className="w-7 h-7 rounded-full bg-slate-200/60 dark:bg-slate-700 flex items-center justify-center mb-1">
                    <Camera className="w-3.5 h-3.5 text-slate-700 dark:text-slate-200" />
                  </div>
                  <span className="text-[11px] font-semibold">Testimonies</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 3. CENTER ROW: STATISTICS BAR CHART & DONUT RING BREAKDOWN (Jobgio & Bento) */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left (8 Cols): Jobgio Style Statistics Bar Chart */}
        <div className="lg:col-span-8 clay-card p-6 sm:p-7 flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-slate-900 dark:text-white" />
                Statistics
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Hourly collation volume & cumulative progression
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* Legend matching Jobgio */}
              <div className="hidden sm:flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 font-semibold">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-900 dark:bg-white inline-block" />
                  Recorded
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-700 inline-block" />
                  Baseline
                </span>
              </div>

              {/* Tab switcher */}
              <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl text-xs">
                <button
                  type="button"
                  onClick={() => setActiveChartTab('hourly')}
                  className={`px-3 py-1 rounded-xl font-bold transition-all cursor-pointer ${
                    activeChartTab === 'hourly'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Hourly
                </button>
                <button
                  type="button"
                  onClick={() => setActiveChartTab('cumulative')}
                  className={`px-3 py-1 rounded-xl font-bold transition-all cursor-pointer ${
                    activeChartTab === 'cumulative'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Cumulative
                </button>
              </div>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              {activeChartTab === 'hourly' ? (
                <BarChart data={hourlyTrend} margin={{ top: 15, right: 10, left: -20, bottom: 0 }}>
                  <XAxis
                    dataKey="hourLabel"
                    stroke="#94a3b8"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip content={<JobgioTooltip />} />
                  <Bar
                    dataKey="count"
                    fill={isDark ? '#f8fafc' : '#121417'}
                    radius={[8, 8, 0, 0]}
                    maxBarSize={38}
                  />
                </BarChart>
              ) : (
                <AreaChart
                  data={dailyCumulative}
                  margin={{ top: 15, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="clayGrowthGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="5%"
                        stopColor={isDark ? '#f8fafc' : '#121417'}
                        stopOpacity={0.35}
                      />
                      <stop
                        offset="95%"
                        stopColor={isDark ? '#f8fafc' : '#121417'}
                        stopOpacity={0.0}
                      />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="dateLabel"
                    stroke="#94a3b8"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#94a3b8"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    domain={[0, stats.target]}
                  />
                  <Tooltip content={<JobgioTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="cumulative"
                    stroke={isDark ? '#f8fafc' : '#121417'}
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#clayGrowthGrad)"
                  />
                </AreaChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right (4 Cols): Image 1 Style "Statistic" Card with Donut & Circular App Feeds */}
        <div className="lg:col-span-4 clay-card p-6 sm:p-7 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <PieIcon className="w-4 h-4" style={{ color: palette.hex }} />
                Decisions
              </h3>
              <span className="text-xs font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full">
                This Campaign ▾
              </span>
            </div>

            {/* Donut Chart with Centered Metric */}
            <div className="h-48 w-full relative mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={donutData}
                    cx="50%"
                    cy="50%"
                    innerRadius={56}
                    outerRadius={76}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {donutData.map((entry, index) => (
                      <Cell key={`donut-cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isDark ? '#0f172a' : '#ffffff',
                      borderColor: isDark ? '#334155' : '#e2e8f0',
                      borderRadius: '16px',
                      color: isDark ? '#f8fafc' : '#0f172a',
                      boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                      fontSize: '12px',
                      fontWeight: 600,
                    }}
                    formatter={(val: any) => [`${Number(val).toLocaleString()} souls`, 'Recorded']}
                  />
                </PieChart>
              </ResponsiveContainer>

              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Total
                </span>
                <span className="text-xl font-black font-mono-tabular text-slate-900 dark:text-white">
                  {stats.totalSouls.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Circular App-Style Decision Feed (Matching Image 1's Spotify, Apple, Bitcoin list) */}
          <div className="space-y-2.5 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            {/* Item 1: New Converts */}
            <div className="flex items-center justify-between p-2 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-2xl flex items-center justify-center font-black text-xs shadow-2xs"
                  style={{ backgroundColor: `${palette.hex}18`, color: palette.hex }}
                >
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">
                    New Converts
                  </div>
                  <div className="text-[10px] text-slate-400">First time accepted Christ</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs font-black font-mono-tabular text-slate-900 dark:text-white">
                  {decisionBreakdown.newConverts.toLocaleString()}
                </div>
                <div className="text-[10px] font-bold" style={{ color: palette.hex }}>
                  {stats.totalSouls > 0
                    ? Math.round((decisionBreakdown.newConverts / stats.totalSouls) * 100)
                    : 0}
                  %
                </div>
              </div>
            </div>

            {/* Item 2: Rededications */}
            <div className="flex items-center justify-between p-2 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 flex items-center justify-center font-black text-xs shadow-2xs">
                  <Flame className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">
                    Rededications
                  </div>
                  <div className="text-[10px] text-slate-400">Recommitted spiritual walk</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs font-black font-mono-tabular text-slate-900 dark:text-white">
                  {decisionBreakdown.rededications.toLocaleString()}
                </div>
                <div className="text-[10px] font-bold text-slate-700 dark:text-slate-300">
                  {stats.totalSouls > 0
                    ? Math.round((decisionBreakdown.rededications / stats.totalSouls) * 100)
                    : 0}
                  %
                </div>
              </div>
            </div>

            {/* Item 3: Returnees */}
            <div className="flex items-center justify-between p-2 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center font-black text-xs shadow-2xs">
                  <Sparkles className="w-4 h-4 text-blue-500" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">Returnees</div>
                  <div className="text-[10px] text-slate-400">Returning members restored</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs font-black font-mono-tabular text-slate-900 dark:text-white">
                  {decisionBreakdown.returnees.toLocaleString()}
                </div>
                <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                  {stats.totalSouls > 0
                    ? Math.round((decisionBreakdown.returnees / stats.totalSouls) * 100)
                    : 0}
                  %
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. CENTRE STANDINGS LEADERBOARD TABLE (Jobgio "Manage Jobs" / Image 1 "Recent Sales") */}
      <section className="clay-card p-6 sm:p-7 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-slate-900 dark:text-white" />
              Centre Standings & Leaderboard
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Live collation tally across FCT centres with coordinator records & status pills
            </p>
          </div>

          {/* Search & Area Council Filter in Pill Style */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search centres..."
                value={centreSearch}
                onChange={e => setCentreSearch(e.target.value)}
                className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 text-slate-900 dark:text-white text-xs rounded-2xl pl-9 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white w-40 sm:w-48 shadow-2xs"
              />
            </div>

            <select
              value={selectedAreaCouncilFilter}
              onChange={e => setSelectedAreaCouncilFilter(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs rounded-2xl px-3 py-2 focus:outline-none cursor-pointer shadow-2xs"
            >
              <option value="all">All Area Councils</option>
              {areaCouncils.map(ac => (
                <option key={ac} value={ac}>
                  {ac}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* ACTIVE FILTER CHIP */}
        {selectedAreaCouncilFilter !== 'all' && (
          <div className="flex items-center gap-2 pt-1">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-bold shadow-md">
              <span className="opacity-70 font-normal">Filtered:</span>
              <span>{selectedAreaCouncilFilter}</span>
              <button
                onClick={() => setSelectedAreaCouncilFilter('all')}
                className="ml-1 p-0.5 rounded-full hover:bg-white/20 dark:hover:bg-slate-200 transition-colors cursor-pointer"
                title="Clear filter"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase text-[11px] font-bold tracking-wider">
                <th className="py-3.5 px-3 w-14 text-center">Rank</th>
                <th className="py-3.5 px-4">Centre & Coordinator</th>
                <th className="py-3.5 px-3">Area Council</th>
                <th className="py-3.5 px-3">Status</th>
                <th className="py-3.5 px-4 text-right">Souls Won</th>
                <th className="py-3.5 px-4 text-right">% Target</th>
                <th className="py-3.5 px-4 min-w-[130px]">Progress</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filteredStandings.map(item => {
                const isTop1 = item.rank === 1;
                const isTop2 = item.rank === 2;
                const isTop3 = item.rank === 3;
                const isFlashed = flashedCentreId === item.centre.id;
                const councilDisplay = item.areaCouncilName || item.regionName || 'AMAC';

                let rankBadge = (
                  <span className="font-mono-tabular text-slate-400 font-bold text-xs">
                    #{item.rank}
                  </span>
                );

                if (isTop1) {
                  rankBadge = (
                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-full font-black text-xs shadow-md bg-slate-900 text-white dark:bg-white dark:text-slate-900">
                      1
                    </span>
                  );
                } else if (isTop2) {
                  rankBadge = (
                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-slate-100 font-black text-xs">
                      2
                    </span>
                  );
                } else if (isTop3) {
                  rankBadge = (
                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-black text-xs">
                      3
                    </span>
                  );
                }

                return (
                  <tr
                    key={item.centre.id}
                    className={`transition-colors ${
                      isFlashed
                        ? 'bg-blue-50/50 dark:bg-blue-950/20'
                        : isTop1
                        ? 'bg-slate-50/70 dark:bg-slate-800/30 hover:bg-slate-100/70 dark:hover:bg-slate-800/50'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    {/* Rank */}
                    <td className="py-3.5 px-3 text-center">{rankBadge}</td>

                    {/* Centre Name, Venue & Coordinator */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center font-extrabold text-xs shrink-0">
                          {item.centre.name.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-slate-900 dark:text-white">
                              {item.centre.name}
                            </span>
                            <span className="text-[10px] font-mono-tabular px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-semibold">
                              {item.centre.code}
                            </span>
                            {isFlashed && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-blue-600 text-white animate-bounce">
                                <Flame className="w-2.5 h-2.5" /> Just Synced
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            <span>{item.centre.venue}</span>
                            <span className="text-slate-300 dark:text-slate-600">·</span>
                            <span>{item.centre.coordinatorName}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Area Council */}
                    <td className="py-3.5 px-3">
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {councilDisplay}
                      </span>
                    </td>

                    {/* Status Pill (Soft green / grey / peach pill matching Image 1) */}
                    <td className="py-3.5 px-3">
                      {item.percentageOfTarget >= 100 ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Achieved
                        </span>
                      ) : isTop1 || isTop2 || isTop3 ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                          Leading
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                          Active
                        </span>
                      )}
                    </td>

                    {/* Souls Won */}
                    <td className="py-3.5 px-4 text-right font-mono-tabular font-bold text-sm">
                      <span className="font-black text-base text-slate-900 dark:text-white">
                        <CountUpNumber value={item.soulsWon} duration={600} />
                      </span>
                    </td>

                    {/* % of Target */}
                    <td className="py-3.5 px-4 text-right font-mono-tabular">
                      <span
                        className={`font-bold ${
                          item.percentageOfTarget >= 100
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-slate-800 dark:text-slate-200'
                        }`}
                      >
                        {item.percentageOfTarget}%
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        of {item.centre.target}
                      </span>
                    </td>

                    {/* Progress Bar */}
                    <td className="py-3.5 px-4">
                      <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden p-0.5">
                        <div
                          className="h-full rounded-full transition-all duration-700 bg-slate-900 dark:bg-white"
                          style={{
                            width: `${Math.min(100, item.percentageOfTarget)}%`,
                          }}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* 5. GEOSPATIAL INTELLIGENCE & AREA COUNCILS */}
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

      {/* Area Council Distribution Bar */}
      <section className="clay-card p-6 sm:p-7 flex flex-col justify-between">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Compass className="w-4 h-4" style={{ color: palette.hex }} /> Area Council Distribution
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Souls won vs Area Council aggregate targets across FCT
            </p>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              layout="vertical"
              data={areaCouncilData}
              margin={{ top: 5, right: 25, left: 15, bottom: 5 }}
            >
              <XAxis type="number" stroke="#94a3b8" fontSize={11} tickLine={false} />
              <YAxis
                dataKey="name"
                type="category"
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                width={90}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: isDark ? '#0f172a' : '#ffffff',
                  borderColor: isDark ? '#334155' : '#e2e8f0',
                  borderRadius: '16px',
                  color: isDark ? '#f8fafc' : '#0f172a',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.08)',
                  fontSize: '12px',
                }}
                formatter={(value: any, name: any) => [
                  `${Number(value).toLocaleString()} souls`,
                  name === 'souls' ? 'Won to Christ' : 'Council Target',
                ]}
              />
              <Bar
                dataKey="souls"
                fill={isDark ? '#f8fafc' : '#121417'}
                radius={[0, 8, 8, 0]}
                name="Souls Won"
              />
              <Bar
                dataKey="target"
                fill={isDark ? '#334155' : '#e2e8f0'}
                radius={[0, 8, 8, 0]}
                name="Target"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-400 pt-3 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-900 dark:bg-white inline-block" />
              Souls Won
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-200 dark:bg-slate-700 inline-block" />
              Council Target
            </span>
          </div>
          <span className="font-mono-tabular font-bold text-slate-800 dark:text-slate-200">
            Leading: Abuja Municipal (AMAC) & Bwari
          </span>
        </div>
      </section>

      {/* ABUJA FCT AREA COUNCIL D3 MAP COMPONENT */}
      <AbujaFctD3Map
        onSelectCouncil={councilName => setSelectedAreaCouncilFilter(councilName)}
      />

      {/* Floating 'Quick Add' Action Button */}
      {onNavigateToAddSoul && (
        <div className="fixed bottom-12 sm:bottom-8 right-4 sm:right-6 z-40">
          <button
            id="quick-add-soul-fab"
            onClick={onNavigateToAddSoul}
            aria-label="Quick Add Soul Submission"
            className="pill-active-black group flex items-center gap-2 px-4 sm:px-5 py-3 sm:py-3.5 rounded-full text-white font-bold text-xs sm:text-sm shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer"
          >
            <UserPlus className="w-4 h-4 sm:w-5 sm:h-5 transition-transform group-hover:scale-110" />
            <span className="font-bold tracking-wide">Quick Add</span>
          </button>
        </div>
      )}
    </div>
  );
};
