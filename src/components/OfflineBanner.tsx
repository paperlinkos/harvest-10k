import React from 'react';
import { WifiOff, CloudOff, RefreshCw, Layers, Database } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface OfflineBannerProps {
  isOnline: boolean;
  offlineCount: number;
  onOpenQueueModal: () => void;
  onCheckReconnect: () => void;
  isSyncing?: boolean;
}

export const OfflineBanner: React.FC<OfflineBannerProps> = ({
  isOnline,
  offlineCount,
  onOpenQueueModal,
  onCheckReconnect,
  isSyncing = false,
}) => {
  const { palette } = useTheme();

  // If online and no queued items, no banner needed
  if (isOnline) {
    return null;
  }

  return (
    <div
      id="offline-status-banner"
      className="bg-amber-500/15 dark:bg-amber-950/50 border-b border-amber-500/30 text-amber-900 dark:text-amber-200 px-4 sm:px-6 py-2.5 transition-colors"
    >
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5 sm:gap-4 text-xs font-semibold">
        <div className="flex items-center gap-2.5 text-center sm:text-left">
          <div className="w-6 h-6 rounded-full bg-amber-500/20 dark:bg-amber-500/30 flex items-center justify-center shrink-0 animate-pulse">
            <WifiOff className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
          </div>
          <div>
            <span className="font-bold">Offline Field Mode Active:</span>{' '}
            <span className="text-slate-700 dark:text-amber-300 font-normal">
              No central network connection. New converts and batches will be saved securely to your browser's IndexedDB and synced automatically when reconnected.
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
          {offlineCount > 0 && (
            <button
              id="banner-open-queue-btn"
              onClick={onOpenQueueModal}
              className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-transform active:scale-95"
            >
              <Database className="w-3 h-3" />
              <span>{offlineCount} Queued in IndexedDB</span>
            </button>
          )}

          <button
            id="banner-retry-sync-btn"
            onClick={onCheckReconnect}
            disabled={isSyncing}
            className="px-2.5 py-1 rounded-lg bg-white/80 hover:bg-white dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-[11px] font-bold flex items-center gap-1.5 border border-amber-300/60 dark:border-amber-700/60 shadow-xs cursor-pointer"
            title="Attempt to reconnect to central server"
          >
            <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Testing...' : 'Check Connection'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
