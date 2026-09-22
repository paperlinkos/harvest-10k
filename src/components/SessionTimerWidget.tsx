import React from 'react';
import { useSessionTimer } from '../hooks/useSessionTimer';
import { Clock, Play, Pause, Square, RotateCcw, Flame, AlertCircle, Plus, Unlock } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { dataService } from '../services/dataService';

interface SessionTimerWidgetProps {
  compact?: boolean;
  onSuccessToast?: (title: string, message: string) => void;
  showControls?: boolean;
}

export const SessionTimerWidget: React.FC<SessionTimerWidgetProps> = ({
  compact = false,
  onSuccessToast,
  showControls = false,
}) => {
  const { palette } = useTheme();
  const { timer, remainingMs, progress, isRunning, isPaused, isScheduled, isFinished } = useSessionTimer();

  if (timer.status === 'idle' && !showControls) {
    return null;
  }

  // Format remaining time as HH:MM:SS
  const totalSeconds = Math.floor(remainingMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const formattedTime = `${hours > 0 ? `${hours.toString().padStart(2, '0')}:` : ''}${minutes
    .toString()
    .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  const handleExtend = (mins: number) => {
    dataService.extendSessionTimer(mins);
    if (onSuccessToast) {
      onSuccessToast(`+${mins}:00 Added to Session`, `Extended active session endsAt by ${mins} minutes.`);
    }
  };

  const handleUnlock = () => {
    dataService.unlockSubmissions();
    if (onSuccessToast) {
      onSuccessToast('Submissions Unlocked Manually', 'Field workers and coordinators can now continue submitting harvest reports.');
    }
  };

  if (compact) {
    return (
      <div className="bg-slate-900 text-slate-100 px-4 py-2 rounded-xl flex items-center justify-between gap-3 shadow-sm border border-slate-800">
        <div className="flex items-center gap-2">
          <div
            className={`w-2.5 h-2.5 rounded-full ${
              isRunning ? 'bg-emerald-500 animate-pulse' : isPaused ? 'bg-amber-500' : 'bg-slate-500'
            }`}
          />
          <span className="text-xs font-bold truncate max-w-[140px]">{timer.label}</span>
        </div>

        <div className="flex items-center gap-3 font-mono-tabular text-sm font-bold" style={{ color: palette.hex }}>
          <Clock className="w-3.5 h-3.5 opacity-80" />
          <span>{formattedTime}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card text-slate-900 dark:text-slate-100 rounded-3xl p-5 shadow-lg relative overflow-hidden transition-all">
      {/* Background glow accent */}
      <div
        className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10 blur-3xl pointer-events-none"
        style={{ backgroundColor: palette.hex }}
      />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                isRunning
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : isScheduled
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  : isPaused
                  ? 'bg-slate-700/40 text-slate-300 border border-slate-600/50'
                  : isFinished
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              <div
                className={`w-2 h-2 rounded-full ${
                  isRunning ? 'bg-emerald-400 animate-pulse' : isScheduled ? 'bg-amber-400' : isPaused ? 'bg-slate-400' : 'bg-slate-500'
                }`}
              />
              <span>{timer.status}</span>
            </span>

            <span className="text-xs text-slate-400 font-medium">
              {timer.mode === 'countdown' ? 'Countdown Session' : 'Elapsed Time (Count-up)'}
            </span>
          </div>

          <h3 className="text-base sm:text-lg font-extrabold tracking-tight text-white">{timer.label}</h3>
        </div>

        {/* Big Digital Timer Clock with SVG Progress Ring */}
        <div className="flex items-center gap-4 bg-slate-950/80 border border-slate-800 px-5 py-3.5 rounded-2xl">
          <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
            <svg className="w-12 h-12 transform -rotate-90">
              <circle
                cx="24"
                cy="24"
                r="20"
                stroke="currentColor"
                strokeWidth="4"
                className="text-slate-800"
                fill="transparent"
              />
              <circle
                cx="24"
                cy="24"
                r="20"
                stroke={palette.hex}
                strokeWidth="4"
                strokeDasharray="125.6"
                strokeDashoffset={125.6 * (1 - Math.min(1, Math.max(0, progress)))}
                strokeLinecap="round"
                fill="transparent"
                className="transition-all duration-500"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center text-[10px] font-black font-mono-tabular text-slate-200">
              {Math.round(progress * 100)}%
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
              {isFinished ? 'Session Concluded' : timer.mode === 'countdown' ? 'Time Remaining' : 'Time Elapsed'}
            </div>
            <div className="text-2xl sm:text-3xl font-black font-mono-tabular tracking-tight text-white">
              {formattedTime}
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      {timer.mode === 'countdown' && timer.durationMs > 0 && (
        <div className="mt-4 space-y-1.5 relative z-10">
          <div className="flex justify-between text-[11px] text-slate-400 font-medium">
            <span>Session Progress</span>
            <span>{Math.round(progress * 100)}%</span>
          </div>
          <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
            <div
              className="h-full transition-all duration-500 rounded-full"
              style={{
                width: `${Math.min(100, Math.max(0, progress * 100))}%`,
                backgroundColor: palette.hex,
              }}
            />
          </div>
        </div>
      )}

      {/* Finished / Locked banner & quick extension buttons */}
      {isFinished && timer.endBehaviour === 'lock_submissions' && !timer.unlockedManually && (
        <div className="mt-4 p-3 bg-rose-950/40 border border-rose-900/60 rounded-xl flex items-center justify-between gap-3 text-xs text-rose-200">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>Session closed — submissions locked</span>
          </div>
          {showControls && (
            <button
              onClick={handleUnlock}
              className="px-3 py-1 bg-rose-900 hover:bg-rose-800 text-white font-bold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Unlock className="w-3.5 h-3.5" /> Unlock
            </button>
          )}
        </div>
      )}

      {/* Quick Admin/Projector Extension Buttons */}
      {showControls && isRunning && (
        <div className="mt-4 pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
          <div className="text-xs text-slate-400">Quick Time Extensions:</div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleExtend(5)}
              className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> 5 mins
            </button>
            <button
              onClick={() => handleExtend(15)}
              className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> 15 mins
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
