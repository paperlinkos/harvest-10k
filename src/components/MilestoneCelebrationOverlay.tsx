import React, { useEffect, useState, useRef } from 'react';
import confetti from 'canvas-confetti';
import { useTheme } from '../context/ThemeContext';
import { CountUpNumber } from './CountUpNumber';
import {
  Sparkles,
  BookOpen,
  X,
  Flame,
  Award,
  Clock,
} from 'lucide-react';

interface MilestoneCelebrationOverlayProps {
  milestone: number;
  verse: string;
  campaignName: string;
  onDismiss: () => void;
  durationSeconds?: number;
}

export const MilestoneCelebrationOverlay: React.FC<MilestoneCelebrationOverlayProps> = ({
  milestone,
  verse,
  campaignName,
  onDismiss,
  durationSeconds = 8,
}) => {
  const { palette } = useTheme();
  const [secondsLeft, setSecondsLeft] = useState(durationSeconds);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Confetti launch effect
  useEffect(() => {
    const launchConfetti = () => {
      // Multi-cannon burst
      // 1. Center explosion
      confetti({
        particleCount: 100,
        spread: 90,
        origin: { y: 0.55 },
        colors: [palette.hex, '#f59e0b', '#10b981', '#6366f1', '#ec4899', '#fbbf24', '#ffffff'],
        zIndex: 100001,
      });

      // 2. Left and Right cannons
      setTimeout(() => {
        confetti({
          particleCount: 70,
          angle: 60,
          spread: 65,
          origin: { x: 0.08, y: 0.7 },
          colors: [palette.hex, '#fbbf24', '#ffffff', '#38bdf8'],
          zIndex: 100001,
        });
        confetti({
          particleCount: 70,
          angle: 120,
          spread: 65,
          origin: { x: 0.92, y: 0.7 },
          colors: [palette.hex, '#fbbf24', '#ffffff', '#38bdf8'],
          zIndex: 100001,
        });
      }, 300);

      // 3. Second wave at 2.5s
      setTimeout(() => {
        confetti({
          particleCount: 90,
          spread: 120,
          origin: { y: 0.45 },
          colors: [palette.hex, '#f59e0b', '#10b981', '#6366f1', '#fbbf24', '#ffffff'],
          zIndex: 100001,
        });
      }, 2500);

      // 4. Third wave at 5s
      setTimeout(() => {
        confetti({
          particleCount: 110,
          spread: 100,
          origin: { y: 0.5 },
          colors: [palette.hex, '#fbbf24', '#ffffff', '#ec4899', '#38bdf8'],
          zIndex: 100001,
        });
      }, 5000);
    };

    launchConfetti();
  }, [palette]);

  // 8-Second Auto-dismiss timer & countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          onDismiss();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [onDismiss]);

  // Escape key listener to close early
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onDismiss();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onDismiss]);

  const formattedMilestone = milestone.toLocaleString();
  const isUltimateTarget = milestone >= 10000;

  return (
    <div
      id="milestone-celebration-modal"
      className="fixed inset-0 z-[99999] glass-modal text-slate-100 flex flex-col items-center justify-between p-6 sm:p-10 select-none overflow-hidden animate-fade-in"
    >
      {/* Background Animated Ambience */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] sm:w-[900px] h-[700px] sm:h-[900px] rounded-full blur-[160px] pointer-events-none -z-0 opacity-40 animate-pulse"
        style={{ backgroundColor: palette.hex }}
      />
      <div className="absolute top-10 left-10 w-96 h-96 bg-amber-500/20 rounded-full blur-[140px] pointer-events-none -z-0" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-emerald-500/20 rounded-full blur-[140px] pointer-events-none -z-0" />

      {/* Top Bar with Dismiss and Countdown */}
      <div className="w-full max-w-5xl flex items-center justify-between z-10">
        <div className="flex items-center gap-2.5 bg-slate-900/90 border border-slate-800 px-3.5 py-1.5 rounded-full shadow-lg">
          <Sparkles className="w-4 h-4 animate-spin text-amber-400" style={{ animationDuration: '4s' }} />
          <span className="text-xs font-bold tracking-wider uppercase text-slate-300">
            {campaignName} · Live Collation Milestone
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono-tabular bg-slate-900/90 border border-slate-800 px-3 py-1.5 rounded-full">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>Auto-dismissing in {secondsLeft}s</span>
          </div>

          <button
            onClick={onDismiss}
            className="p-2 rounded-full bg-slate-900/90 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Dismiss (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Center Content */}
      <div className="relative z-10 max-w-4xl text-center space-y-6 my-auto">
        {/* Milestone Banner Pill */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs sm:text-sm font-bold uppercase tracking-widest shadow-inner">
          <Flame className="w-4 h-4 text-amber-400" />
          <span>{isUltimateTarget ? '🌟 NATIONAL CAMPAIGN GOAL ACHIEVED 🌟' : '🔥 HARVEST MILESTONE SURPASSED 🔥'}</span>
          <Flame className="w-4 h-4 text-amber-400" />
        </div>

        {/* Massive Milestone Number */}
        <div className="space-y-1">
          <div
            className="text-7xl sm:text-9xl md:text-[130px] lg:text-[150px] font-black font-mono-tabular tracking-tight leading-none drop-shadow-2xl"
            style={{
              color: '#ffffff',
              textShadow: `0 0 40px ${palette.hex}80, 0 0 80px ${palette.hex}40`,
            }}
          >
            <CountUpNumber value={milestone} duration={1400} />
          </div>
          <div className="text-xl sm:text-3xl font-extrabold uppercase tracking-widest text-slate-200 drop-shadow-md">
            Souls Gathered For Christ!
          </div>
          <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto">
            Heaven rejoices over every single soul delivered, redeemed, and integrated into the Kingdom of God.
          </p>
        </div>

        {/* Scripture Quote Box */}
        {verse && (
          <div className="bg-slate-900/80 border border-slate-800/90 p-5 sm:p-6 rounded-2xl max-w-2xl mx-auto shadow-2xl backdrop-blur-md relative">
            <div className="flex items-center justify-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-widest mb-2">
              <BookOpen className="w-4 h-4 text-amber-400" />
              <span>Theme Scripture</span>
            </div>
            <blockquote className="text-sm sm:text-base italic text-slate-200 font-serif leading-relaxed">
              "{verse}"
            </blockquote>
          </div>
        )}
      </div>

      {/* Bottom Progress Bar & Rehearsal hint */}
      <div className="w-full max-w-md z-10 space-y-2 text-center">
        <div className="w-full bg-slate-900 border border-slate-800 rounded-full h-1.5 overflow-hidden">
          <div
            className="h-full transition-all duration-1000 ease-linear rounded-full"
            style={{
              width: `${(secondsLeft / durationSeconds) * 100}%`,
              backgroundColor: palette.hex,
            }}
          />
        </div>
        <div className="text-[11px] text-slate-500 flex items-center justify-center gap-1">
          <span>Press</span>
          <kbd className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] font-mono text-slate-300">
            Esc
          </kbd>
          <span>or click anywhere to dismiss</span>
        </div>
      </div>
    </div>
  );
};
