import React, { useState, useEffect, useRef } from 'react';
import { dataService } from '../services/dataService';
import { TestimonyMediaItem, DashboardStats, AreaCouncilStats, TickerSubmission } from '../types';
import { CountUpNumber } from '../components/CountUpNumber';
import {
  Radio,
  Tv,
  Share2,
  Maximize,
  Minimize,
  X,
  Volume2,
  VolumeX,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Camera,
  Mic,
  Video,
  Flame,
  CheckCircle2,
  Clock,
  MapPin,
  TrendingUp,
  Layers,
} from 'lucide-react';
import { playCelebrationSound } from '../utils/audioUtils';

interface LiveStreamViewerProps {
  onExit: () => void;
  onSuccessToast?: (title: string, message: string) => void;
}

export const LiveStreamViewer: React.FC<LiveStreamViewerProps> = ({
  onExit,
  onSuccessToast,
}) => {
  const [stats, setStats] = useState<DashboardStats>(dataService.getStats());
  const [campaign, setCampaign] = useState(dataService.getCampaign());
  const [councilStats, setCouncilStats] = useState<AreaCouncilStats[]>(
    dataService.getAreaCouncilBreakdown()
  );
  const [tickerItems, setTickerItems] = useState<TickerSubmission[]>(
    dataService.getTickerItems()
  );
  const [featuredTestimonies, setFeaturedTestimonies] = useState<TestimonyMediaItem[]>(
    dataService.getFeaturedTestimonies()
  );

  // Broadcast & stream options
  const [obsOverlayMode, setObsOverlayMode] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentTime, setCurrentTime] = useState('');
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  // Auto-rotate testimony spotlight every 12 seconds
  useEffect(() => {
    if (featuredTestimonies.length <= 1) return;
    const interval = setInterval(() => {
      setActiveMediaIndex((prev) => (prev + 1) % featuredTestimonies.length);
      setIsPlayingAudio(false);
    }, 12000);
    return () => clearInterval(interval);
  }, [featuredTestimonies.length]);

  // Clock updates in WAT (West Africa Time)
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('en-GB', {
          timeZone: 'Africa/Lagos',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }) + ' WAT'
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Listen to dataService updates
  useEffect(() => {
    const updateData = () => {
      setStats(dataService.getStats());
      setCouncilStats(dataService.getAreaCouncilBreakdown());
      setTickerItems(dataService.getTickerItems());
      setFeaturedTestimonies(dataService.getFeaturedTestimonies());
      setCampaign(dataService.getCampaign());
    };
    const unsubscribe = dataService.subscribe(updateData);
    return () => unsubscribe();
  }, []);

  // Fullscreen keyboard shortcut 'F' or 'Escape'
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'f' || e.key === 'F') {
        toggleFullscreen();
      } else if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const copySharableStreamLink = () => {
    const streamUrl = `${window.location.origin}${window.location.pathname}?view=stream`;
    navigator.clipboard.writeText(streamUrl);
    if (onSuccessToast) {
      onSuccessToast(
        'Sharable Stream Link Copied!',
        'This direct link can be shared on YouTube, social media, or pasted as an OBS Studio Browser Source.'
      );
    } else {
      alert('Sharable stream link copied to clipboard!');
    }
  };

  const activeTestimony = featuredTestimonies[activeMediaIndex] || null;
  const progressPercent = Math.min(100, (stats.totalSouls / stats.target) * 100);

  // Play audio for active voice testimony
  const togglePlayActiveAudio = (url: string) => {
    if (isPlayingAudio) {
      audioPlayerRef.current?.pause();
      setIsPlayingAudio(false);
    } else {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
      }
      const audio = new Audio(url);
      audioPlayerRef.current = audio;
      audio.play().catch((err) => {
        console.warn('Audio playback error:', err);
        setIsPlayingAudio(false);
      });
      setIsPlayingAudio(true);
      audio.onended = () => setIsPlayingAudio(false);
    }
  };

  // OBS Lower-Third Mode layout (compact transparent overlay for video switchers)
  if (obsOverlayMode) {
    return (
      <div className="fixed inset-0 z-50 bg-transparent flex flex-col justify-end p-6 pointer-events-auto select-none">
        {/* Top Control Bar for Stream Producer */}
        <div className="absolute top-4 right-4 flex items-center gap-2 bg-slate-950/80 backdrop-blur-md p-2 rounded-xl border border-white/20 text-white">
          <button
            onClick={() => setObsOverlayMode(false)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 cursor-pointer"
          >
            Exit OBS Mode
          </button>
          <button
            onClick={onExit}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-600/30 hover:bg-red-600/50 text-red-200 text-xs font-medium cursor-pointer"
          >
            <X className="w-4 h-4" />
            <span>Close</span>
          </button>
        </div>

        {/* OBS Lower Third Banner */}
        <div className="bg-gradient-to-r from-slate-950/95 via-indigo-950/90 to-slate-950/95 border-t-2 border-indigo-500 rounded-2xl shadow-2xl p-4 sm:p-6 backdrop-blur-xl max-w-5xl mx-auto w-full text-white">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="px-3 py-1 rounded-full bg-red-600 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 animate-pulse">
                <Radio className="w-3.5 h-3.5" />
                LIVE COLLATION
              </div>
              <div>
                <h3 className="text-xl font-black tracking-tight text-white">
                  HARVEST 10,000 SOULS CAMPAIGN
                </h3>
                <p className="text-xs text-indigo-300">Abuja Federal Capital Territory, Nigeria</p>
              </div>
            </div>

            <div className="flex items-center gap-8">
              <div className="text-center">
                <span className="text-[11px] font-bold text-indigo-300 uppercase tracking-wider block">
                  Souls Won
                </span>
                <span className="text-3xl font-black text-white">
                  <CountUpNumber value={stats.totalSouls} duration={1000} />
                </span>
              </div>

              <div className="text-center border-l border-white/20 pl-6">
                <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block">
                  Target
                </span>
                <span className="text-3xl font-black text-amber-400">10,000</span>
              </div>

              <div className="text-center border-l border-white/20 pl-6">
                <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block">
                  Pace
                </span>
                <span className="text-2xl font-black text-emerald-400">
                  {progressPercent.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>

          {/* Mini progress bar */}
          <div className="mt-3 w-full bg-white/10 rounded-full h-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400 h-full transition-all duration-700"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>
    );
  }

  // Full Screen 16:9 Broadcast Mode (Ideal for YouTube Live, Smart TVs, and Projectors)
  return (
    <div className="fixed inset-0 z-50 bg-slate-950 text-white flex flex-col justify-between overflow-y-auto overflow-x-hidden min-h-screen select-none font-sans">
      {/* Dynamic Background Glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* TOP BROADCAST HEADER */}
      <header className="relative z-10 px-6 py-4 flex items-center justify-between border-b border-white/10 bg-slate-950/80 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-600 text-white text-xs font-bold uppercase tracking-wider shadow-lg shadow-red-600/30">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            ON AIR • LIVE STREAM
          </div>
          <div>
            <h1 className="text-lg font-black tracking-wider text-white">
              HARVEST 10K COMMAND CENTRE
            </h1>
            <p className="text-[11px] text-slate-400">
              Real-Time Evangelism Collation • Abuja Federal Capital Territory
            </p>
          </div>
        </div>

        {/* Live Clock & Action Tools */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs font-mono text-slate-300">
            <Clock className="w-3.5 h-3.5 text-indigo-400" />
            {currentTime}
          </div>

          <button
            onClick={copySharableStreamLink}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 border border-white/15 text-white transition-all cursor-pointer"
            title="Copy sharable link for YouTube, Facebook, or OBS"
          >
            <Share2 className="w-3.5 h-3.5 text-indigo-300" />
            <span className="hidden md:inline">Share Stream Link</span>
          </button>

          <button
            onClick={() => setObsOverlayMode(true)}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600/80 hover:bg-indigo-600 border border-indigo-400/30 text-white transition-all cursor-pointer"
            title="Switch to transparent lower-third overlay for OBS"
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="hidden md:inline">OBS Mode</span>
          </button>

          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
            title="Toggle Fullscreen (F)"
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>

          <button
            onClick={onExit}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-600/20 hover:bg-red-600/40 text-red-300 border border-red-500/30 transition-all cursor-pointer text-xs font-semibold"
            title="Exit Live Stream View"
          >
            <X className="w-4 h-4" />
            <span>Exit Stream</span>
          </button>
        </div>
      </header>

      {/* MAIN BROADCAST ARENA */}
      <main className="relative z-10 flex-1 p-6 md:p-8 flex flex-col justify-center max-w-7xl mx-auto w-full gap-6">
        {/* Top Tally Marquee / Hero Banner */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Left Hero Dial: Total Souls Counter (7 Cols) */}
          <div className="lg:col-span-7 rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-slate-900/90 via-indigo-950/60 to-slate-900/90 border border-white/15 shadow-2xl backdrop-blur-xl flex flex-col justify-between relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-widest text-indigo-400 flex items-center gap-2">
                <Flame className="w-4 h-4 text-amber-400 animate-bounce" />
                ABUJA EVANGELISM CRUSADE TOTAL
              </span>
              <span className="text-xs font-medium text-slate-400">
                Target: <span className="text-white font-bold">10,000 Souls</span>
              </span>
            </div>

            <div className="my-6 text-center lg:text-left">
              <div className="text-6xl sm:text-7xl md:text-8xl font-black tracking-tight text-white drop-shadow-md">
                <CountUpNumber value={stats.totalSouls} duration={1200} />
              </div>
              <div className="mt-2 text-sm sm:text-base font-medium text-slate-300 flex items-center justify-center lg:justify-start gap-3">
                <span className="text-emerald-400 font-bold">{progressPercent.toFixed(1)}% Completed</span>
                <span>•</span>
                <span className="text-slate-400">{stats.remaining} souls to target</span>
              </div>
            </div>

            {/* Glowing Target Progress Bar */}
            <div className="space-y-2">
              <div className="w-full bg-white/10 rounded-full h-3.5 overflow-hidden p-0.5 border border-white/10">
                <div
                  className="bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400 h-full rounded-full transition-all duration-1000 shadow-lg shadow-indigo-500/50"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-slate-400 font-medium">
                <span>0</span>
                <span>2,500</span>
                <span>5,000</span>
                <span>7,500</span>
                <span className="text-amber-400 font-bold">10,000 HARVEST</span>
              </div>
            </div>

            {/* Key Quick Metrics Bar */}
            <div className="mt-6 pt-4 border-t border-white/10 grid grid-cols-3 gap-4 text-center">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Souls Last Hour
                </span>
                <span className="text-xl font-bold text-indigo-300">+{stats.soulsLastHour}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Velocity</span>
                <span className="text-xl font-bold text-emerald-400">
                  {stats.hourlyVelocity} /hr
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Active Hubs
                </span>
                <span className="text-xl font-bold text-amber-400">
                  {stats.centresReporting}/{stats.totalCentres}
                </span>
              </div>
            </div>
          </div>

          {/* Right Spotlight: Live Field Testimony & Media Spotlight (5 Cols) */}
          <div className="lg:col-span-5 rounded-3xl p-6 bg-gradient-to-br from-slate-900/90 via-purple-950/40 to-slate-900/90 border border-white/15 shadow-2xl backdrop-blur-xl flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400 animate-spin" />
                <span className="text-xs font-bold uppercase tracking-wider text-purple-300">
                  Live Field Spotlight
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() =>
                    setActiveMediaIndex((prev) =>
                      prev === 0 ? featuredTestimonies.length - 1 : prev - 1
                    )
                  }
                  className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-[11px] text-slate-400 font-mono">
                  {featuredTestimonies.length > 0 ? activeMediaIndex + 1 : 0}/
                  {featuredTestimonies.length}
                </span>
                <button
                  onClick={() =>
                    setActiveMediaIndex((prev) => (prev + 1) % featuredTestimonies.length)
                  }
                  className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Spotlight Media Body */}
            {activeTestimony ? (
              <div className="space-y-3 flex-1 flex flex-col justify-center">
                <div className="relative aspect-video rounded-2xl overflow-hidden bg-black border border-white/10 shadow-lg">
                  {activeTestimony.mediaType === 'picture' && (
                    <img
                      src={activeTestimony.url}
                      alt={activeTestimony.title}
                      className="w-full h-full object-cover"
                    />
                  )}

                  {activeTestimony.mediaType === 'video_testimony' && (
                    <video
                      src={activeTestimony.url}
                      poster={activeTestimony.thumbnailUrl}
                      controls
                      autoPlay
                      muted
                      loop
                      playsInline
                      className="w-full h-full object-contain"
                    />
                  )}

                  {activeTestimony.mediaType === 'audio_testimony' && (
                    <div className="w-full h-full flex flex-col items-center justify-center p-6 bg-gradient-to-tr from-indigo-950 via-slate-900 to-indigo-900 text-center">
                      <div className="w-12 h-12 rounded-full bg-indigo-600/30 border border-indigo-400 flex items-center justify-center mb-2 animate-pulse">
                        <Mic className="w-6 h-6 text-indigo-300" />
                      </div>
                      <p className="text-xs font-semibold text-white">Voice Audio Testimony</p>
                      <button
                        onClick={() => togglePlayActiveAudio(activeTestimony.url)}
                        className="mt-3 px-4 py-1.5 rounded-full text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white inline-flex items-center gap-1.5 cursor-pointer shadow-md"
                      >
                        {isPlayingAudio ? (
                          <>
                            <VolumeX className="w-3.5 h-3.5" /> Stop Audio
                          </>
                        ) : (
                          <>
                            <Volume2 className="w-3.5 h-3.5" /> Listen ({activeTestimony.durationSeconds || 40}s)
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {/* Media Format Pill */}
                  <div className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-black/70 backdrop-blur-md text-white border border-white/20 flex items-center gap-1">
                    {activeTestimony.mediaType === 'picture' && <Camera className="w-3 h-3 text-sky-400" />}
                    {activeTestimony.mediaType === 'audio_testimony' && <Mic className="w-3 h-3 text-amber-400" />}
                    {activeTestimony.mediaType === 'video_testimony' && <Video className="w-3 h-3 text-rose-400" />}
                    <span>
                      {activeTestimony.mediaType === 'picture'
                        ? 'Photo'
                        : activeTestimony.mediaType === 'audio_testimony'
                        ? 'Voice Note'
                        : '1-Min Video'}
                    </span>
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-sm text-white line-clamp-1">
                    {activeTestimony.title}
                  </h4>
                  <p className="text-xs text-slate-300 line-clamp-2 mt-1">
                    "{activeTestimony.caption}"
                  </p>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2">
                    <span className="flex items-center gap-1 text-indigo-300">
                      <MapPin className="w-3 h-3" /> {activeTestimony.centreName} (
                      {activeTestimony.areaCouncilCode})
                    </span>
                    <span className="font-medium text-white">{activeTestimony.contributorName}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-10 text-slate-500 text-xs">
                No featured media active. Upload photos or voice notes in the Media Hub!
              </div>
            )}
          </div>
        </div>

        {/* 6 Area Council Mini Progress Grid */}
        <div className="rounded-3xl p-5 bg-slate-900/80 border border-white/10 backdrop-blur-md">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-indigo-400" />
            Area Council Performance Breakdown (Abuja FCT)
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {councilStats.map((council) => {
              const cPercent = Math.min(
                100,
                Math.round((council.soulsWon / (council.target || 1)) * 100)
              );
              return (
                <div
                  key={council.areaCouncilId}
                  className="p-3 rounded-2xl bg-white/5 border border-white/10 hover:border-indigo-500/50 transition-colors"
                >
                  <div className="flex justify-between items-center text-xs mb-1">
                    <span className="font-bold text-white">{council.code}</span>
                    <span className="text-[11px] text-emerald-400 font-semibold">{cPercent}%</span>
                  </div>
                  <div className="text-lg font-black text-indigo-300">
                    {council.soulsWon.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-slate-400">Target: {council.target.toLocaleString()}</div>
                  <div className="w-full bg-white/10 rounded-full h-1.5 mt-2 overflow-hidden">
                    <div
                      className="bg-indigo-500 h-full rounded-full"
                      style={{ width: `${cPercent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* BOTTOM TICKER CRAWL */}
      <footer className="relative z-10 border-t border-white/10 bg-slate-950/95 py-2.5 px-6 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <div className="px-2.5 py-1 rounded-md bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-black uppercase tracking-wider shrink-0 flex items-center gap-1.5">
            <Radio className="w-3 h-3 animate-ping" />
            LATEST SOULS
          </div>

          <div className="overflow-hidden whitespace-nowrap w-full relative">
            <div className="animate-ticker flex items-center gap-8 whitespace-nowrap text-xs font-medium text-slate-300">
              {[...tickerItems, ...tickerItems].map((t, idx) => (
                <span key={`${t.id || 'tick'}-${idx}`} className="inline-flex items-center gap-2">
                  <span className="text-amber-400 font-bold">★ {t.centreName}:</span>
                  <span className="text-white">+{t.count} soul(s)</span>
                  {t.winnerName && <span className="text-slate-400">({t.winnerName})</span>}
                  <span className="text-slate-600">•</span>
                </span>
              ))}
              <span className="text-indigo-300 italic px-4">
                "{campaign.verse || 'The harvest truly is plenteous, but the labourers are few. — Matthew 9:37'}"
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
