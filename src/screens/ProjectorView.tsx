import React, { useState, useEffect, useRef, useMemo } from 'react';
import { dataService } from '../services/dataService';
import { CountUpNumber } from '../components/CountUpNumber';
import { LiveTicker } from '../components/LiveTicker';
import { FctMap } from '../components/FctMap';
import { useTheme } from '../context/ThemeContext';
import { SessionTimerWidget } from '../components/SessionTimerWidget';
import {
  Flame,
  Maximize,
  Minimize,
  X,
  Award,
  TrendingUp,
  RotateCw,
  Sparkles,
  MapPin,
  Clock,
  Radio,
  Gauge,
  Hourglass,
  Users,
  PieChart as PieIcon,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  Edit3,
  CheckCircle2,
  Calendar,
  Layers,
  Activity,
  Heart,
  Globe2,
  ShieldCheck,
  Megaphone,
} from 'lucide-react';

interface ProjectorViewProps {
  onExit: () => void;
}

type PanelKey = 'total' | 'standings' | 'regions' | 'demographics';

const PANELS: { key: PanelKey; label: string; number: number }[] = [
  { key: 'total', label: 'Big Total & Momentum', number: 1 },
  { key: 'standings', label: 'Centre Standings', number: 2 },
  { key: 'regions', label: 'Area Councils', number: 3 },
  { key: 'demographics', label: 'Demographic Split', number: 4 },
];

const CYCLE_DURATION = 18; // 18 seconds per panel

export const ProjectorView: React.FC<ProjectorViewProps> = ({ onExit }) => {
  const { palette } = useTheme();

  // State
  const [panelIndex, setPanelIndex] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [cycleTimeLeft, setCycleTimeLeft] = useState<number>(CYCLE_DURATION);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showControls, setShowControls] = useState<boolean>(true);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [statusToast, setStatusToast] = useState<{ message: string; key: number } | null>(null);
  const [isScreenSaverActive, setIsScreenSaverActive] = useState<boolean>(false);

  // Announcement Modal State (Admin edit)
  const [isEditAnnouncementOpen, setIsEditAnnouncementOpen] = useState<boolean>(false);
  const [announcementText, setAnnouncementText] = useState<string>('');

  // Proportional content scaling state & refs to avoid vertical overflow across resolutions (720p, 1080p, 4K)
  const [contentScale, setContentScale] = useState<number>(1.0);
  const contentWrapperRef = useRef<HTMLDivElement>(null);
  const contentInnerRef = useRef<HTMLDivElement>(null);

  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Screen-saver idle timer (2 minutes = 120,000ms)
  useEffect(() => {
    const resetIdleTimer = () => {
      if (isScreenSaverActive) {
        setIsScreenSaverActive(false);
      }
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      idleTimerRef.current = setTimeout(() => {
        setIsScreenSaverActive(true);
      }, 120000);
    };

    window.addEventListener('mousemove', resetIdleTimer);
    window.addEventListener('keydown', resetIdleTimer);
    window.addEventListener('touchstart', resetIdleTimer);
    window.addEventListener('click', resetIdleTimer);

    idleTimerRef.current = setTimeout(() => {
      setIsScreenSaverActive(true);
    }, 120000);

    return () => {
      window.removeEventListener('mousemove', resetIdleTimer);
      window.removeEventListener('keydown', resetIdleTimer);
      window.removeEventListener('touchstart', resetIdleTimer);
      window.removeEventListener('click', resetIdleTimer);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [isScreenSaverActive]);

  // Live Data from dataService
  const stats = dataService.getStats();
  const standings = dataService.getCentreStandings();
  const regionalBreakdown = dataService.getRegionalBreakdown();
  const demographicSplit = dataService.getDemographicSplit();
  const tickerItems = dataService.getTickerItems();
  const campaign = dataService.getCampaign();
  const flashedCentreId = dataService.getLastFlashedCentreId();

  const currentPanel = PANELS[panelIndex].key;

  // Real-time clock update (every second)
  useEffect(() => {
    const clockTimer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(clockTimer);
  }, []);

  // Proportional content scaling ResizeObserver: monitors content height and viewport bounds
  // Adjusts CSS variable --content-scale from 1.0 down to 0.7 proportionally to prevent vertical overflow
  useEffect(() => {
    const wrapper = contentWrapperRef.current;
    const inner = contentInnerRef.current;
    if (!wrapper || !inner) return;

    const adjustScale = () => {
      const availableHeight = wrapper.clientHeight;
      if (availableHeight <= 0) return;

      // Temporarily set scale to 1.0 to measure natural unscaled height
      wrapper.style.setProperty('--content-scale', '1');
      const naturalHeight = inner.scrollHeight;

      if (naturalHeight > availableHeight && naturalHeight > 0) {
        // Compute the needed scale factor, clamped strictly between 0.7 and 1.0
        const computedScale = Math.max(0.7, Math.min(1.0, Math.floor(((availableHeight - 8) / naturalHeight) * 100) / 100));
        setContentScale(computedScale);
        wrapper.style.setProperty('--content-scale', computedScale.toString());
      } else {
        setContentScale(1.0);
        wrapper.style.setProperty('--content-scale', '1.0');
      }
    };

    const resizeObserver = new ResizeObserver(() => {
      adjustScale();
    });

    resizeObserver.observe(wrapper);
    resizeObserver.observe(inner);

    const timer = setTimeout(adjustScale, 50);
    window.addEventListener('resize', adjustScale);

    return () => {
      clearTimeout(timer);
      resizeObserver.disconnect();
      window.removeEventListener('resize', adjustScale);
    };
  }, [panelIndex, currentPanel]);

  // Development-only overflow detection script (720p & 1080p validation)
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production' || window.location.hostname === 'localhost' || window.location.hostname.includes('ais-dev')) {
      const checkOverflow = () => {
        const root = document.getElementById('projector-root');
        if (root) {
          const hasOverflow = root.scrollHeight > root.clientHeight;
          if (hasOverflow) {
            console.warn('[ProjectorView Overflow Debug] Vertical overflow detected in projector root:', {
              scrollHeight: root.scrollHeight,
              clientHeight: root.clientHeight,
              diff: root.scrollHeight - root.clientHeight,
              viewport: { width: window.innerWidth, height: window.innerHeight }
            });
            Array.from(root.querySelectorAll('*')).forEach(el => {
              const htmlEl = el as HTMLElement;
              if (htmlEl.scrollHeight > htmlEl.clientHeight + 2 && htmlEl.clientHeight > 0) {
                console.debug('[ProjectorView Overflow Element]', {
                  tag: htmlEl.tagName,
                  id: htmlEl.id,
                  className: htmlEl.className,
                  scrollHeight: htmlEl.scrollHeight,
                  clientHeight: htmlEl.clientHeight
                });
              }
            });
          }
        }
      };
      const t = setTimeout(checkOverflow, 1200);
      window.addEventListener('resize', checkOverflow);
      return () => {
        clearTimeout(t);
        window.removeEventListener('resize', checkOverflow);
      };
    }
  }, [panelIndex]);

  // Show quick status feedback toast (e.g. for pause, panel jump, fullscreen)
  const showFeedback = (message: string) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setStatusToast({ message, key: Date.now() });
    toastTimeoutRef.current = setTimeout(() => {
      setStatusToast(null);
    }, 2400);
  };

  // Auto-cycle timer
  useEffect(() => {
    if (isPaused || isEditAnnouncementOpen) return;

    const timer = setInterval(() => {
      setCycleTimeLeft(prev => {
        if (prev <= 1) {
          setPanelIndex(curr => (curr + 1) % PANELS.length);
          return CYCLE_DURATION;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isPaused, isEditAnnouncementOpen]);

  // Mouse idle detection for auto-hiding floating controls & cursor
  useEffect(() => {
    const handleMouseMove = () => {
      setShowControls(true);
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3500);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, []);

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
      showFeedback('⛶ Fullscreen Mode Enabled');
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
        setIsFullscreen(false);
        showFeedback('⛶ Windowed Mode Restored');
      }
    }
  };

  // Sync fullscreen state if user presses browser default F11 or Esc
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Navigation helpers
  const nextPanel = () => {
    setPanelIndex(curr => (curr + 1) % PANELS.length);
    setCycleTimeLeft(CYCLE_DURATION);
    const nextIdx = (panelIndex + 1) % PANELS.length;
    showFeedback(`Viewing [${PANELS[nextIdx].number}/4] ${PANELS[nextIdx].label}`);
  };

  const prevPanel = () => {
    setPanelIndex(curr => (curr - 1 + PANELS.length) % PANELS.length);
    setCycleTimeLeft(CYCLE_DURATION);
    const prevIdx = (panelIndex - 1 + PANELS.length) % PANELS.length;
    showFeedback(`Viewing [${PANELS[prevIdx].number}/4] ${PANELS[prevIdx].label}`);
  };

  const goToPanel = (idx: number) => {
    setPanelIndex(idx);
    setCycleTimeLeft(CYCLE_DURATION);
    showFeedback(`Viewing [${PANELS[idx].number}/4] ${PANELS[idx].label}`);
  };

  const togglePause = () => {
    setIsPaused(prev => {
      const next = !prev;
      showFeedback(next ? '⏸ Auto-Cycling Paused' : '▶ Auto-Cycling Resumed');
      return next;
    });
  };

  // Keyboard shortcut listener (F, Space, Arrows, 1-4, E, Esc)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // If modal is open, only Esc closes it
      if (isEditAnnouncementOpen) {
        if (e.key === 'Escape') {
          setIsEditAnnouncementOpen(false);
        }
        return;
      }

      if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        toggleFullscreen();
      } else if (e.key === ' ') {
        e.preventDefault();
        togglePause();
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === 'l' || e.key === 'L') {
        e.preventDefault();
        nextPanel();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp' || e.key === 'h' || e.key === 'H') {
        e.preventDefault();
        prevPanel();
      } else if (e.key === '1') {
        e.preventDefault();
        goToPanel(0);
      } else if (e.key === '2') {
        e.preventDefault();
        goToPanel(1);
      } else if (e.key === '3') {
        e.preventDefault();
        goToPanel(2);
      } else if (e.key === '4') {
        e.preventDefault();
        goToPanel(3);
      } else if (e.key === 'e' || e.key === 'E') {
        e.preventDefault();
        setAnnouncementText(campaign.announcement || '');
        setIsEditAnnouncementOpen(true);
      } else if (e.key === 'Escape') {
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => {});
        } else {
          onExit();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isEditAnnouncementOpen, isPaused, panelIndex, campaign.announcement]);

  // Campaign Progress Calculations
  const progressPercent = Math.min(100, Math.round((stats.totalSouls / stats.target) * 1000) / 10);

  // Time remaining calculation
  const remainingHoursData = useMemo(() => {
    try {
      const endTimestamp = new Date(`${campaign.endDate}T23:59:59`).getTime();
      const nowTimestamp = currentTime.getTime();
      const diffMs = Math.max(0, endTimestamp - nowTimestamp);

      const totalHours = Math.floor(diffMs / (1000 * 60 * 60));
      const days = Math.floor(totalHours / 24);
      const remainingHours = totalHours % 24;
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

      // Required hourly velocity to hit target
      const requiredHourlyVelocity = totalHours > 0 ? Math.ceil(stats.remaining / totalHours) : stats.remaining;

      return {
        totalHours,
        days,
        remainingHours,
        minutes,
        seconds,
        isConcluded: diffMs <= 0,
        requiredHourlyVelocity,
      };
    } catch {
      return {
        totalHours: 48,
        days: 2,
        remainingHours: 0,
        minutes: 0,
        seconds: 0,
        isConcluded: false,
        requiredHourlyVelocity: 100,
      };
    }
  }, [campaign.endDate, currentTime, stats.remaining]);

  // Velocity Calculation & Gauge percentage
  const velocityScore = Math.min(
    100,
    Math.round((stats.soulsLastHour / Math.max(1, remainingHoursData.requiredHourlyVelocity * 1.5)) * 100)
  );

  // Save Announcement handler
  const handleSaveAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    dataService.updateAnnouncement(announcementText);
    setIsEditAnnouncementOpen(false);
    showFeedback('📢 Live Announcement Banner Updated');
  };

  // Format Time for Clock
  const formattedClockTime = currentTime.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const formattedClockDate = currentTime.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const activeAnnouncement =
    campaign.announcement ||
    '📢 LIVE EVENT: Evening Crusade Collation Active across all 12 centres · Intercessory prayers ongoing at Central Hub · Submit field tally slips without delay!';

  return (
    <div
      id="projector-root"
      className={`fixed inset-0 z-50 h-screen h-[100dvh] max-h-[100dvh] w-screen bg-slate-950 text-slate-100 flex flex-col justify-between overflow-hidden select-none transition-all duration-1000 ${
        isScreenSaverActive ? 'brightness-50 opacity-60' : ''
      } ${showControls ? 'cursor-default' : 'cursor-none'}`}
      style={{ height: '100dvh', maxHeight: '100dvh', overflow: 'hidden' }}
    >
      {isScreenSaverActive && (
        <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex flex-col items-center justify-center text-center p-8 transition-opacity duration-1000 animate-in fade-in">
          <div className="w-20 h-20 rounded-3xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-6 animate-pulse">
            <Flame className="w-10 h-10" />
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Harvest 10K Campaign • Screen-Saver Active
          </h2>
          <p className="text-sm text-slate-400 mt-3 max-w-md">
            Display dimmed by 50% for overnight burn-in prevention. Move your mouse, press any key, or tap to resume active projector monitoring.
          </p>
          <div className="mt-8 text-xs font-mono text-amber-400 uppercase tracking-widest bg-amber-500/10 border border-amber-500/20 px-6 py-2.5 rounded-full">
            Total Souls Harvested: {stats.totalSouls.toLocaleString()} / {stats.target.toLocaleString()}
          </div>
        </div>
      )}
      {/* Dynamic Ambient Background Glows */}
      <div
        className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full blur-[160px] pointer-events-none -z-0 opacity-20 transition-all duration-1000"
        style={{ backgroundColor: palette.hex }}
      />
      <div className="absolute bottom-12 left-12 w-[550px] h-[550px] bg-emerald-500/10 rounded-full blur-[140px] pointer-events-none -z-0" />
      <div className="absolute top-10 right-10 w-[450px] h-[450px] bg-blue-500/10 rounded-full blur-[130px] pointer-events-none -z-0" />

      {/* FLOATING ACTION PILL (Auto-hides on mouse idle) */}
      <div
        className={`absolute top-3 right-6 z-50 flex items-center gap-2.5 transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Auto-cycle status & control pill */}
        <div className="flex items-center gap-2 bg-slate-900/90 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-slate-800 text-xs font-mono-tabular text-slate-300 shadow-2xl">
          <button
            onClick={togglePause}
            className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer"
            title="Space to Pause/Resume"
          >
            {isPaused ? (
              <>
                <Pause className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-amber-400 font-bold uppercase text-[10px]">Paused</span>
              </>
            ) : (
              <>
                <RotateCw className="w-3.5 h-3.5 animate-spin" style={{ color: palette.hex }} />
                <span>Next in {cycleTimeLeft}s</span>
              </>
            )}
          </button>

          {/* Panel Selector Chips */}
          <div className="flex gap-1 ml-1.5 border-l border-slate-800 pl-2">
            {PANELS.map((p, idx) => (
              <button
                key={p.key}
                onClick={() => goToPanel(idx)}
                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-colors cursor-pointer ${
                  panelIndex === idx
                    ? 'text-white'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
                }`}
                style={panelIndex === idx ? { backgroundColor: palette.hex } : {}}
              >
                {p.number}. {p.key === 'total' ? 'Total' : p.key === 'standings' ? 'Centres' : p.key === 'regions' ? 'Regions' : 'Demographics'}
              </button>
            ))}
          </div>
        </div>

        {/* Edit Announcement Quick Button */}
        <button
          onClick={() => {
            setAnnouncementText(campaign.announcement || '');
            setIsEditAnnouncementOpen(true);
          }}
          className="p-2 rounded-full bg-slate-900/90 hover:bg-slate-800 text-amber-400 border border-slate-800 shadow-xl transition-transform active:scale-95 cursor-pointer"
          title="Edit Live Announcement Banner [E]"
        >
          <Edit3 className="w-4 h-4" />
        </button>

        {/* Fullscreen button */}
        <button
          onClick={toggleFullscreen}
          className="p-2 rounded-full bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-800 shadow-xl transition-transform active:scale-95 cursor-pointer"
          title="Toggle Fullscreen [F]"
        >
          {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
        </button>

        {/* Exit Button */}
        <button
          onClick={onExit}
          className="px-3.5 py-1.5 rounded-full bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-xl transition-transform active:scale-95 cursor-pointer"
          title="Exit Projector View [Esc]"
        >
          <X className="w-3.5 h-3.5" />
          <span>Exit</span>
        </button>
      </div>

      {/* QUICK STATUS TOAST FEEDBACK (Autonomous, zero-mouse feedback) */}
      {statusToast && (
        <div
          key={statusToast.key}
          className="absolute top-20 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 text-white px-5 py-2 rounded-full border border-slate-700 shadow-2xl backdrop-blur-md text-xs font-bold flex items-center gap-2 animate-in fade-in slide-in-from-top-4 duration-200"
        >
          <Sparkles className="w-3.5 h-3.5" style={{ color: palette.hex }} />
          <span>{statusToast.message}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. TOP HEADER STRIP: Campaign Name + Logo Placeholder + Live Clock + LIVE */}
      {/* ========================================================================= */}
      <div className="pt-5 pb-3 px-6 md:px-12 flex items-center justify-between z-20 border-b border-slate-800/80 bg-slate-950/60 backdrop-blur-xs shrink-0 flex-shrink-0">
        {/* Left: Church Emblem Logo Placeholder & Campaign Identity */}
        <div className="flex items-center gap-4">
          {/* Logo Crest Placeholder */}
          <div className="relative group">
            <div
              className="w-13 h-13 rounded-2xl flex items-center justify-center shadow-xl border border-white/10 relative overflow-hidden"
              style={{ backgroundColor: palette.hex }}
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-black/40 via-transparent to-white/20" />
              <Flame className="w-7 h-7 text-white fill-white relative z-10" />
            </div>
            <div className="absolute -bottom-1 -right-1 bg-amber-400 text-slate-950 text-[9px] font-black px-1 rounded-full uppercase tracking-tighter">
              10K
            </div>
          </div>

          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-display font-black text-2xl md:text-3xl tracking-tight text-white drop-shadow-md">
                {campaign.name.toUpperCase()}
              </h1>
              <span
                className="hidden lg:inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-bold font-mono-tabular uppercase tracking-widest border shadow-inner"
                style={{
                  backgroundColor: `${palette.hex}25`,
                  borderColor: `${palette.hex}50`,
                  color: palette.secondaryHex,
                }}
              >
                National Collation Command
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono-tabular mt-0.5 flex items-center gap-2">
              <span>Target: {stats.target.toLocaleString()} Souls</span>
              <span>•</span>
              <span className="text-emerald-400 font-semibold">{stats.totalCentres} Active Collation Hubs</span>
              <span>•</span>
              <span className="text-slate-300">Phase: Live Crusade Tally</span>
            </p>
          </div>
        </div>

        {/* Right: Live Pulsing Indicator & Real-Time Live Clock */}
        <div className="flex items-center gap-4 md:gap-6">
          {/* "LIVE" Indicator with pulsing dot */}
          <div className="flex items-center gap-2.5 px-4 py-2 rounded-full bg-rose-950/80 border border-rose-500/50 shadow-lg shadow-rose-950/40">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500 shadow-sm" />
            </span>
            <span className="text-xs font-black uppercase tracking-wider text-rose-200 font-display">
              LIVE COLLATION
            </span>
          </div>

          {/* Real-time Live Clock */}
          <div className="flex items-center gap-3 px-4 py-2 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg">
            <Clock className="w-4 h-4 text-cyan-400 shrink-0" />
            <div className="text-right font-mono-tabular leading-tight">
              <div className="text-base md:text-lg font-black text-slate-100 tracking-wider">
                {formattedClockTime}
              </div>
              <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                {formattedClockDate}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MAIN DYNAMIC CONTENT PANELS (4 Panels) */}
      {/* ========================================================================= */}
      <div
        ref={contentWrapperRef}
        id="projector-content-wrapper"
        className="flex-1 min-h-0 flex flex-col justify-center items-center px-6 md:px-14 py-2 z-10 overflow-hidden max-h-[calc(100vh-100px)] max-h-[calc(100dvh-100px)] w-full"
        style={{
          ['--content-scale' as any]: `${contentScale}`,
        }}
      >
        <div
          ref={contentInnerRef}
          id="projector-content-inner"
          className="w-full flex-1 flex flex-col items-center justify-center transition-transform duration-200 ease-out origin-center shrink-0 flex-shrink-0"
          style={{
            transform: `scale(var(--content-scale, ${contentScale}))`,
            transformOrigin: 'center center',
          }}
        >
        {/* PANEL 1: BIG TOTAL, VELOCITY GAUGE, COUNTDOWN & ANNOUNCEMENT TICKER */}
        {currentPanel === 'total' && (
          <div className="max-w-6xl mx-auto w-full flex-1 flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-500 space-y-4 shrink-0 flex-shrink-0">
            
            {/* Header Eyebrow */}
            <div className="text-slate-400 font-display text-sm md:text-lg font-bold uppercase tracking-[0.25em] flex items-center gap-2">
              <Sparkles className="w-4 h-4" style={{ color: palette.hex }} />
              <span>Total Souls Won to Christ</span>
              <Sparkles className="w-4 h-4" style={{ color: palette.hex }} />
            </div>

            {/* Giant Hero Number */}
            <div className="py-1 md:py-2 flex flex-col items-center">
              <div
                className="font-display font-black text-7xl sm:text-9xl md:text-[10.5rem] lg:text-[12.5rem] tracking-tight leading-none drop-shadow-2xl"
                style={{ color: palette.secondaryHex }}
              >
                <CountUpNumber value={stats.totalSouls} duration={1000} />
              </div>
              {(() => {
                const recon = dataService.getReconciliationStats();
                return (
                  <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-sm md:text-lg font-mono text-slate-300 bg-slate-900/90 border border-slate-700 px-6 py-3 rounded-full shadow-2xl">
                    <span className="font-bold text-emerald-400 font-mono-tabular flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                      {recon.totalContactable.toLocaleString()} contactable ({recon.contactableRate}%)
                    </span>
                    <span className="text-slate-600">•</span>
                    <span className="text-slate-300 font-mono-tabular">
                      {recon.totalComplete.toLocaleString()} fully documented ({recon.reconciliationRate}%)
                    </span>
                  </div>
                );
              })()}
            </div>

            {/* Target Progress Bar */}
            <div className="w-full max-w-4xl space-y-2">
              <div className="flex items-center justify-between text-sm md:text-lg font-bold font-mono-tabular">
                <span className="flex items-center gap-2" style={{ color: palette.secondaryHex }}>
                  <TrendingUp className="w-4 h-4" style={{ color: palette.hex }} />
                  {progressPercent}% of {stats.target.toLocaleString()} Target
                </span>
                <span className="text-emerald-400">
                  <CountUpNumber value={stats.remaining} duration={800} /> Souls to Victory
                </span>
              </div>

              <div className="h-6 md:h-8 w-full bg-slate-900 rounded-full p-1 border-2 border-slate-700/80 shadow-2xl overflow-hidden relative">
                <div
                  className={`h-full bg-gradient-to-r ${palette.progressBarGradient} rounded-full transition-all duration-1000 ease-out shadow-lg`}
                  style={{ width: `${Math.min(100, Math.max(3, progressPercent))}%` }}
                />
              </div>
            </div>

            {/* Campaign Session Timer Widget */}
            <div className="w-full max-w-4xl">
              <SessionTimerWidget />
            </div>

            {/* ADMIN-EDITABLE ANNOUNCEMENT BANNER SCROLLING UNDER TOTAL */}
            <div className="w-full max-w-4xl bg-amber-950/40 border border-amber-500/40 rounded-xl px-3 py-2 flex items-center gap-3 overflow-hidden shadow-lg backdrop-blur-xs">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500 text-slate-950 font-black text-[11px] uppercase tracking-wider shrink-0 font-display shadow-xs">
                <Megaphone className="w-3.5 h-3.5 fill-current" />
                <span>Notice</span>
              </div>
              <div className="flex-1 overflow-hidden relative">
                <div className="animate-ticker whitespace-nowrap text-xs md:text-sm font-semibold text-amber-200 tracking-wide">
                  <span>{activeAnnouncement}</span>
                  <span className="mx-8 text-amber-500">•</span>
                  <span>{activeAnnouncement}</span>
                </div>
              </div>
            </div>

            {/* SOULS PER HOUR GAUGE & COUNTDOWN OF HOURS REMAINING */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl w-full mt-2">
              {/* Card 1: Souls Per Hour Gauge */}
              <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-between text-left shadow-lg">
                <div className="space-y-0.5">
                  <div className="text-[11px] text-slate-400 font-semibold uppercase flex items-center gap-1.5">
                    <Gauge className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Souls Per Hour</span>
                  </div>
                  <div className="text-2xl font-black font-mono-tabular text-cyan-400">
                    +{stats.soulsLastHour} <span className="text-xs font-normal text-slate-400">/ hr</span>
                  </div>
                  <div className="text-[10px] font-mono-tabular text-emerald-400 font-medium">
                    {stats.soulsLastHour >= remainingHoursData.requiredHourlyVelocity ? '⚡ Surging Pace' : 'Pacing Active'}
                  </div>
                </div>

                {/* Mini Radial Gauge Visualizer */}
                <div className="relative w-12 h-12 flex items-center justify-center">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-slate-800"
                      strokeWidth="3.5"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      stroke="#22d3ee"
                      strokeWidth="3.5"
                      strokeDasharray={`${velocityScore}, 100`}
                      strokeLinecap="round"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <Activity className="w-4 h-4 text-cyan-400 absolute" />
                </div>
              </div>

              {/* Card 2: Hours Remaining Countdown */}
              <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-between text-left shadow-lg">
                <div className="space-y-0.5">
                  <div className="text-[11px] text-slate-400 font-semibold uppercase flex items-center gap-1.5">
                    <Hourglass className="w-3.5 h-3.5 text-amber-400" />
                    <span>Time Remaining</span>
                  </div>
                  <div className="text-2xl font-black font-mono-tabular text-amber-400">
                    {remainingHoursData.totalHours}h {remainingHoursData.minutes}m
                  </div>
                  <div className="text-[10px] font-mono-tabular text-slate-400">
                    {remainingHoursData.days} Days Window
                  </div>
                </div>

                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-amber-400" />
                </div>
              </div>

              {/* Card 3: Active Centres */}
              <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 text-left shadow-lg flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="text-[11px] text-slate-400 font-semibold uppercase">Active Centres</div>
                  <div className="text-2xl font-black font-mono-tabular text-emerald-400">
                    {stats.centresReporting} / {stats.totalCentres}
                  </div>
                  <div className="text-[10px] text-slate-400">100% Reporting</div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-emerald-400" />
                </div>
              </div>

              {/* Card 4: Projected Total */}
              <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 text-left shadow-lg flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="text-[11px] text-slate-400 font-semibold uppercase">Projected Harvest</div>
                  <div
                    className="text-2xl font-black font-mono-tabular"
                    style={{ color: palette.secondaryHex }}
                  >
                    {stats.projectedTotal.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-emerald-400 font-medium">Trajectory: +112%</div>
                </div>
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: `${palette.hex}20`, borderColor: `${palette.hex}40`, borderWidth: '1px' }}
                >
                  <Sparkles className="w-5 h-5" style={{ color: palette.hex }} />
                </div>
              </div>
            </div>

            {/* Scripture Verse */}
            <p className="text-xs md:text-sm text-slate-400 italic max-w-3xl pt-1">
              "{campaign.verse}"
            </p>
          </div>
        )}

        {/* PANEL 2: CENTRE STANDINGS (LEADERBOARDS) */}
        {currentPanel === 'standings' && (
          <div className="max-w-6xl mx-auto w-full flex-1 flex flex-col animate-in fade-in zoom-in-95 duration-500 space-y-4 shrink-0 flex-shrink-0">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 shrink-0 flex-shrink-0">
              <div>
                <h2
                  className="font-display font-black text-2xl md:text-3xl flex items-center gap-2"
                  style={{ color: palette.secondaryHex }}
                >
                  <Award className="w-7 h-7" style={{ color: palette.hex }} />
                  FCT Collation Centre Standings & Leaderboard
                </h2>
                <p className="text-xs md:text-sm text-slate-400 font-mono-tabular">
                  Real-time collation rankings across all 14 evangelism operational hubs in Abuja
                </p>
              </div>

              <div className="text-right shrink-0 flex-shrink-0">
                <span className="text-xs text-slate-400 uppercase font-semibold">Total Harvest</span>
                <div
                  className="text-2xl md:text-3xl font-black font-mono-tabular"
                  style={{ color: palette.secondaryHex }}
                >
                  <CountUpNumber value={stats.totalSouls} duration={600} />
                </div>
              </div>
            </div>

            {/* Grid of Top 8 Centres */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 flex-1 min-h-0">
              {standings.slice(0, 8).map(item => {
                const isTop1 = item.rank === 1;
                const isTop2 = item.rank === 2;
                const isTop3 = item.rank === 3;
                const isFlashed = flashedCentreId === item.centre.id;
                const councilDisplay = item.areaCouncilName || item.regionName || 'AMAC';

                return (
                  <div
                    key={item.centre.id}
                    className={`p-4 rounded-2xl border transition-all duration-500 flex items-center justify-between ${
                      isFlashed
                        ? 'bg-amber-500/30 border-amber-400 ring-2 ring-amber-400 scale-[1.02]'
                        : isTop1
                        ? 'bg-slate-900/95 border-amber-500/40 shadow-xl'
                        : isTop2
                        ? 'bg-slate-900/85 border-slate-700'
                        : isTop3
                        ? 'bg-slate-900/80 border-slate-800'
                        : 'bg-slate-900/60 border-slate-800/80'
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <div
                        className="w-10 h-10 rounded-xl font-display font-black text-base flex items-center justify-center shadow-md text-white shrink-0"
                        style={{
                          backgroundColor: isTop1
                            ? palette.hex
                            : isTop2
                            ? '#64748b'
                            : isTop3
                            ? `${palette.hex}80`
                            : '#334155',
                        }}
                      >
                        {item.rank}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-display font-bold text-base md:text-lg text-slate-100">
                            {item.centre.name}
                          </span>
                          <span className="text-[10px] font-mono-tabular px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                            {councilDisplay}
                          </span>
                        </div>
                        <div className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span className="truncate max-w-[240px]">{item.centre.venue}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div
                        className="font-mono-tabular font-black text-2xl"
                        style={{ color: palette.secondaryHex }}
                      >
                        <CountUpNumber value={item.soulsWon} duration={600} />
                      </div>
                      <div className="text-xs text-emerald-400 font-mono-tabular font-bold">
                        {item.percentageOfTarget}% target ({item.percentageOfTotal}%)
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* PANEL 3: FCT AREA COUNCILS CHOROPLETH MAP & BREAKDOWN */}
        {currentPanel === 'regions' && (
          <div className="max-w-7xl mx-auto w-full flex-1 flex flex-col animate-in fade-in zoom-in-95 duration-500 space-y-4 shrink-0 flex-shrink-0">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 shrink-0 flex-shrink-0">
              <div>
                <h2
                  className="font-display font-black text-2xl md:text-3xl flex items-center gap-2"
                  style={{ color: palette.secondaryHex }}
                >
                  <Globe2 className="w-7 h-7" style={{ color: palette.hex }} />
                  Abuja FCT Area Council Choropleth Map
                </h2>
                <p className="text-xs md:text-sm text-slate-400 font-mono-tabular">
                  Live geographic harvest density and collation telemetry across all 6 Area Councils
                </p>
              </div>

              <div className="text-right shrink-0 flex-shrink-0">
                <span className="text-xs text-slate-400 uppercase font-semibold">Abuja FCT Total</span>
                <div
                  className="text-2xl md:text-3xl font-black font-mono-tabular"
                  style={{ color: palette.secondaryHex }}
                >
                  <CountUpNumber value={stats.totalSouls} duration={600} />
                </div>
              </div>
            </div>

            {/* Split Grid: Left Full-Bleed Map, Right 6 Area Council Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center flex-1 min-h-0">
              {/* Full-bleed FCT Map */}
              <div className="lg:col-span-5 h-[420px] sm:h-[460px] flex items-center justify-center p-3 bg-slate-900/80 rounded-3xl border border-slate-800 shadow-2xl relative overflow-hidden shrink-0 flex-shrink-0">
                <FctMap isProjector={true} className="w-full h-full" />
              </div>

              {/* 6 Area Council Cards in 2x3 Grid */}
              <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-3.5 flex-1 min-h-0">
                {dataService.getAreaCouncilBreakdown().map((r, idx) => {
                  const percentOfTarget = Math.round((r.soulsWon / Math.max(1, r.target)) * 1000) / 10;
                  const colors = [
                    { border: 'border-cyan-500/40', bar: 'bg-cyan-500', text: 'text-cyan-400' },
                    { border: 'border-amber-500/40', bar: 'bg-amber-500', text: 'text-amber-400' },
                    { border: 'border-emerald-500/40', bar: 'bg-emerald-500', text: 'text-emerald-400' },
                    { border: 'border-purple-500/40', bar: 'bg-purple-500', text: 'text-purple-400' },
                    { border: 'border-rose-500/40', bar: 'bg-rose-500', text: 'text-rose-400' },
                    { border: 'border-indigo-500/40', bar: 'bg-indigo-500', text: 'text-indigo-400' },
                  ];
                  const col = colors[idx % colors.length];

                  return (
                    <div
                      key={r.areaCouncilId || idx}
                      className={`p-4 rounded-2xl bg-slate-900/90 border ${col.border} shadow-xl space-y-3 flex flex-col justify-between`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-mono-tabular uppercase px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-bold border border-slate-700">
                            {r.areaCouncilName}
                          </span>
                          <span className={`text-xs font-black font-mono-tabular ${col.text}`}>
                            {r.percentageOfTotal}% of FCT
                          </span>
                        </div>

                        <div className="pt-1">
                          <div className="text-2xl sm:text-3xl font-black font-mono-tabular text-slate-100">
                            <CountUpNumber value={r.soulsWon} duration={800} />
                          </div>
                          <div className="text-[10.5px] text-slate-400 font-mono-tabular mt-0.5">
                            Target: {r.target.toLocaleString()} Souls · {r.centresCount} Collation Hubs
                          </div>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[11px] font-bold font-mono-tabular">
                          <span className="text-slate-300">{percentOfTarget}% Target</span>
                          <span className={col.text}>{Math.max(0, r.target - r.soulsWon)} Left</span>
                        </div>

                        <div className="h-2.5 w-full bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700">
                          <div
                            className={`h-full ${col.bar} rounded-full transition-all duration-1000`}
                            style={{ width: `${Math.min(100, Math.max(4, percentOfTarget))}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* PANEL 4: DEMOGRAPHIC SPLIT (GENDER, AGE, DECISION TYPES) */}
        {currentPanel === 'demographics' && (
          <div className="max-w-6xl mx-auto w-full flex-1 flex flex-col animate-in fade-in zoom-in-95 duration-500 space-y-6 shrink-0 flex-shrink-0">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 shrink-0 flex-shrink-0">
              <div>
                <h2
                  className="font-display font-black text-2xl md:text-3xl flex items-center gap-2"
                  style={{ color: palette.secondaryHex }}
                >
                  <Users className="w-7 h-7" style={{ color: palette.hex }} />
                  Demographic & Decision Split Analysis
                </h2>
                <p className="text-xs md:text-sm text-slate-400 font-mono-tabular">
                  Statistical breakdown of converts by Gender, Age Bracket, and Decision Type
                </p>
              </div>

              <div className="text-right shrink-0 flex-shrink-0">
                <span className="text-xs text-slate-400 uppercase font-semibold">Total Analyzed</span>
                <div
                  className="text-2xl md:text-3xl font-black font-mono-tabular"
                  style={{ color: palette.secondaryHex }}
                >
                  <CountUpNumber value={demographicSplit.totalAnalyzed} duration={600} />
                </div>
              </div>
            </div>

            {/* 3 Demographic Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Card 1: Decision Types */}
              <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <h3 className="font-display font-bold text-base text-slate-100">Decision Classification</h3>
                </div>

                <div className="space-y-3.5">
                  <div>
                    <div className="flex justify-between text-xs font-bold mb-1">
                      <span className="text-emerald-400">New Converts</span>
                      <span className="font-mono-tabular">{demographicSplit.decision.newConverts.toLocaleString()} ({demographicSplit.decision.newConvertsPercent}%)</span>
                    </div>
                    <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${demographicSplit.decision.newConvertsPercent}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-bold mb-1">
                      <span className="text-blue-400">Rededications</span>
                      <span className="font-mono-tabular">{demographicSplit.decision.rededications.toLocaleString()} ({demographicSplit.decision.rededicationsPercent}%)</span>
                    </div>
                    <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: `${demographicSplit.decision.rededicationsPercent}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-bold mb-1">
                      <span className="text-amber-400">Returnees</span>
                      <span className="font-mono-tabular">{demographicSplit.decision.returnees.toLocaleString()} ({demographicSplit.decision.returneesPercent}%)</span>
                    </div>
                    <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-500 rounded-full" style={{ width: `${demographicSplit.decision.returneesPercent}%` }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 2: Age Bracket Split */}
              <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                  <Layers className="w-4 h-4 text-cyan-400" />
                  <h3 className="font-display font-bold text-base text-slate-100">Age Brackets</h3>
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs font-bold mb-1">
                      <span className="text-cyan-400">Youth (18–35)</span>
                      <span className="font-mono-tabular">{demographicSplit.age.youth.toLocaleString()} ({demographicSplit.age.youthPercent}%)</span>
                    </div>
                    <div className="h-2.5 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-cyan-400 rounded-full" style={{ width: `${demographicSplit.age.youthPercent}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-bold mb-1">
                      <span className="text-purple-400">Adults (36–59)</span>
                      <span className="font-mono-tabular">{demographicSplit.age.adult.toLocaleString()} ({demographicSplit.age.adultPercent}%)</span>
                    </div>
                    <div className="h-2.5 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-purple-400 rounded-full" style={{ width: `${demographicSplit.age.adultPercent}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-bold mb-1">
                      <span className="text-pink-400">Children (&lt;18)</span>
                      <span className="font-mono-tabular">{demographicSplit.age.child.toLocaleString()} ({demographicSplit.age.childPercent}%)</span>
                    </div>
                    <div className="h-2.5 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-pink-400 rounded-full" style={{ width: `${demographicSplit.age.childPercent}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-bold mb-1">
                      <span className="text-slate-400">Seniors (60+)</span>
                      <span className="font-mono-tabular">{demographicSplit.age.senior.toLocaleString()} ({demographicSplit.age.seniorPercent}%)</span>
                    </div>
                    <div className="h-2.5 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-slate-400 rounded-full" style={{ width: `${demographicSplit.age.seniorPercent}%` }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 3: Gender Distribution */}
              <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                  <Heart className="w-4 h-4 text-rose-400" />
                  <h3 className="font-display font-bold text-base text-slate-100">Gender Distribution</h3>
                </div>

                <div className="space-y-4 pt-2">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700">
                      <div className="text-xs text-slate-400 uppercase font-semibold">Female</div>
                      <div className="text-3xl font-black font-mono-tabular text-rose-400 mt-1">
                        {demographicSplit.gender.femalePercent}%
                      </div>
                      <div className="text-xs text-slate-400 font-mono-tabular mt-0.5">
                        {demographicSplit.gender.female.toLocaleString()} Souls
                      </div>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700">
                      <div className="text-xs text-slate-400 uppercase font-semibold">Male</div>
                      <div className="text-3xl font-black font-mono-tabular text-blue-400 mt-1">
                        {demographicSplit.gender.malePercent}%
                      </div>
                      <div className="text-xs text-slate-400 font-mono-tabular mt-0.5">
                        {demographicSplit.gender.male.toLocaleString()} Souls
                      </div>
                    </div>
                  </div>

                  <div className="h-4 w-full bg-slate-800 rounded-full overflow-hidden flex border border-slate-700">
                    <div className="h-full bg-rose-500" style={{ width: `${demographicSplit.gender.femalePercent}%` }} />
                    <div className="h-full bg-blue-500" style={{ width: `${demographicSplit.gender.malePercent}%` }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* BOTTOM TICKER CRAWLER & ZERO-MOUSE KEYBOARD SHORTCUT HELPER STRIP */}
      {/* ========================================================================= */}
      <div className="w-full shrink-0 flex-shrink-0 z-20">
        {/* Live Collation Wire Ticker */}
        <LiveTicker items={tickerItems} theme="dark" />

        {/* Keyboard Helper Strip (Guarantees zero mouse requirement during live event) */}
        <div className="bg-slate-950 px-6 py-2 border-t border-slate-800/90 flex flex-wrap items-center justify-between text-[11px] font-mono-tabular text-slate-400">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-700 font-bold text-[10px]">F</kbd>
              <span>Fullscreen</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-700 font-bold text-[10px]">Space</kbd>
              <span>{isPaused ? 'Resume' : 'Pause'}</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-700 font-bold text-[10px]">← / →</kbd>
              <span>Switch Panels</span>
            </span>
            <span className="hidden sm:flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-700 font-bold text-[10px]">1-4</kbd>
              <span>Jump Panel</span>
            </span>
            <span className="hidden md:flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-amber-300 border border-slate-700 font-bold text-[10px]">E</kbd>
              <span>Edit Announcement</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-700 font-bold text-[10px]">Esc</kbd>
              <span>Exit</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-300 font-semibold">Automated Presentation Mode Active</span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ADMIN EDIT ANNOUNCEMENT MODAL */}
      {/* ========================================================================= */}
      {isEditAnnouncementOpen && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 text-slate-100 rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-amber-400" />
                <h3 className="font-display font-bold text-lg text-white">
                  Live Projector Announcement Banner
                </h3>
              </div>
              <button
                onClick={() => setIsEditAnnouncementOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAnnouncement} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Announcement Message (Scrolls Under Total in Real-Time)
                </label>
                <textarea
                  rows={3}
                  value={announcementText}
                  onChange={e => setAnnouncementText(e.target.value)}
                  placeholder="Enter high-priority announcement to display across projector screens..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-2xl p-3.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Quick Presets */}
              <div className="space-y-1.5">
                <span className="text-[11px] text-slate-400 font-semibold">Quick Broadcast Presets:</span>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setAnnouncementText(
                        '📢 CRUSADE IN SESSION: Evening soul collation underway · Field evangelism teams submit tallies promptly!'
                      )
                    }
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 border border-slate-700 transition-colors cursor-pointer"
                  >
                    Crusade in Session
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setAnnouncementText(
                        '⏳ FINAL CALL: 2 Hours Remaining to hit the 10,000 National Soul Target · Intercessory Hubs Praying!'
                      )
                    }
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 border border-slate-700 transition-colors cursor-pointer"
                  >
                    Final Countdown
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setAnnouncementText(
                        '🎉 VICTORY THANKSGIVING: Glory to God! 10,000 Souls Won to Jesus Christ across all 12 Collation Hubs!'
                      )
                    }
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 border border-slate-700 transition-colors cursor-pointer"
                  >
                    Victory Thanksgiving
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditAnnouncementOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl font-bold text-xs bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center gap-1.5 shadow-lg cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Update Live Announcement</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
