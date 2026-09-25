import React from 'react';
import { WifiOff, Wifi, RefreshCw, Database, CheckCircle, ArrowUpCircle } from 'lucide-react';

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
  // If fully online with zero pending offline records, keep UI completely clean
  if (isOnline && offlineCount === 0) {
    return null;
  }

  // When online with pending records waiting for sync
  if (isOnline && offlineCount > 0) {
    return (
      <div
        id="offline-status-banner"
        className="bg-emerald-500/15 dark:bg-emerald-950/60 border-b border-emerald-500/30 text-emerald-900 dark:text-emerald-200 px-4 sm:px-6 py-2.5 transition-colors"
      >
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5 sm:gap-4 text-xs font-semibold">
          <div className="flex items-center gap-2.5 text-center sm:text-left">
            <div className="w-6 h-6 rounded-full bg-emerald-500/20 dark:bg-emerald-500/30 flex items-center justify-center shrink-0">
              <Wifi className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <span className="font-bold">Online Connection Active:</span>{' '}
              <span className="text-slate-700 dark:text-emerald-300 font-normal">
                {offlineCount} offline field {offlineCount === 1 ? 'record is' : 'records are'} queued on your phone and ready to sync to central collation.
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
            <button
              id="banner-open-queue-btn"
              onClick={onOpenQueueModal}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-transform active:scale-95"
            >
              <Database className="w-3 h-3" />
              <span>Review ({offlineCount})</span>
            </button>

            <button
              id="banner-sync-now-btn"
              onClick={onCheckReconnect}
              disabled={isSyncing}
              className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold flex items-center gap-1.5 shadow-md shadow-emerald-500/20 cursor-pointer transition-transform active:scale-95"
              title="Sync queued records to central collation server"
            >
              <ArrowUpCircle className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Transmitting...' : `Sync ${offlineCount} Record${offlineCount > 1 ? 's' : ''} Now`}</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // When offline (No network connection)
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
            <span className="font-bold">Offline Field Mode Active (Nigeria Low Network):</span>{' '}
            <span className="text-slate-700 dark:text-amber-300 font-normal">
              You stay logged in. All souls recorded are safely stored in your phone's browser storage and will auto-sync the moment your connection returns.
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
              <span>{offlineCount} Stored Locally</span>
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
            <span>{isSyncing ? 'Reconnecting...' : 'Check Network'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
