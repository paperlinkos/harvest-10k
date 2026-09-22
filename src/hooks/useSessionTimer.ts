import { useState, useEffect } from 'react';
import { dataService } from '../services/dataService';
import { CampaignSessionTimer } from '../types';

export function useSessionTimer() {
  const [timer, setTimer] = useState<CampaignSessionTimer>(dataService.getSessionTimer());
  const [now, setNow] = useState<number>(Date.now());

  useEffect(() => {
    const handleUpdate = () => {
      setTimer(dataService.getSessionTimer());
    };
    const unsubscribe = dataService.subscribe(handleUpdate);

    // Re-render every 250ms for smooth absolute difference calculation
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 250);

    const handleVisibilityOrFocus = () => {
      setNow(Date.now());
      setTimer(dataService.getSessionTimer());
    };

    window.addEventListener('visibilitychange', handleVisibilityOrFocus);
    window.addEventListener('focus', handleVisibilityOrFocus);

    return () => {
      unsubscribe();
      clearInterval(interval);
      window.removeEventListener('visibilitychange', handleVisibilityOrFocus);
      window.removeEventListener('focus', handleVisibilityOrFocus);
    };
  }, []);

  const isRunning = timer.status === 'running';
  const isPaused = timer.status === 'paused';
  const isScheduled = timer.status === 'scheduled';
  const isFinished = timer.status === 'finished';

  const endsMs = timer.endsAt ? new Date(timer.endsAt).getTime() : 0;
  const startedMs = timer.startedAt ? new Date(timer.startedAt).getTime() : 0;
  const scheduledMs = timer.scheduledStartAt ? new Date(timer.scheduledStartAt).getTime() : 0;

  let remainingMs = 0;
  if (timer.mode === 'countdown') {
    if (isRunning && endsMs) {
      remainingMs = Math.max(0, endsMs - now);
    } else if (isPaused && endsMs) {
      remainingMs = Math.max(0, endsMs - now);
    } else if (isScheduled && scheduledMs) {
      remainingMs = Math.max(0, scheduledMs - now);
    } else if (isFinished) {
      remainingMs = 0;
    } else {
      remainingMs = timer.durationMs;
    }
  } else {
    // countup
    if (isRunning && startedMs) {
      remainingMs = Math.max(0, now - startedMs - timer.totalPausedMs);
    } else if (isPaused && timer.pausedAt && startedMs) {
      const pausedDuration = new Date(timer.pausedAt).getTime() - startedMs - timer.totalPausedMs;
      remainingMs = Math.max(0, pausedDuration);
    } else {
      remainingMs = 0;
    }
  }

  let progress = 0;
  if (timer.mode === 'countdown' && timer.durationMs > 0) {
    const elapsed = timer.durationMs - remainingMs;
    progress = Math.min(1, Math.max(0, elapsed / timer.durationMs));
  } else if (timer.mode === 'countup' && timer.durationMs > 0) {
    progress = Math.min(1, Math.max(0, remainingMs / timer.durationMs));
  }

  return {
    timer,
    now,
    remainingMs,
    progress,
    isRunning,
    isPaused,
    isScheduled,
    isFinished,
  };
}
