import React, { useState } from 'react';
import { OfflineQueueItem } from '../types';
import { useTheme } from '../context/ThemeContext';
import {
  CloudOff,
  RefreshCw,
  Trash2,
  CheckCircle2,
  X,
  Wifi,
  WifiOff,
  User,
  Users,
  Clock,
  MapPin,
  AlertCircle,
  Database,
  Phone,
  ArrowRight,
} from 'lucide-react';

interface OfflineQueueModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: OfflineQueueItem[];
  isOnline: boolean;
  onSyncSingle: (id: string) => Promise<{ success: boolean; error?: string }>;
  onSyncAll: () => Promise<{ total: number; succeeded: number; failed: number }>;
  onDeleteItem: (id: string) => Promise<void>;
  onClearAll: () => Promise<void>;
  onSuccessToast: (title: string, message: string) => void;
}

export const OfflineQueueModal: React.FC<OfflineQueueModalProps> = ({
  isOpen,
  onClose,
  items,
  isOnline,
  onSyncSingle,
  onSyncAll,
  onDeleteItem,
  onClearAll,
  onSuccessToast,
}) => {
  const { palette } = useTheme();
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [isSyncingAll, setIsSyncingAll] = useState<boolean>(false);
  const [confirmClear, setConfirmClear] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSyncItem = async (id: string, summary: string) => {
    setSyncingId(id);
    try {
      const res = await onSyncSingle(id);
      if (res.success) {
        onSuccessToast('Record Synchronized', `Successfully pushed "${summary}" to central collation.`);
      } else {
        onSuccessToast('Sync Incomplete', res.error || 'Could not synchronize. Please verify network connection.');
      }
    } finally {
      setSyncingId(null);
    }
  };

  const handleSyncAllItems = async () => {
    if (items.length === 0) return;
    setIsSyncingAll(true);
    try {
      const res = await onSyncAll();
      if (res.succeeded > 0) {
        onSuccessToast(
          'Synchronization Complete',
          `Successfully pushed ${res.succeeded} queued record(s) to national collation database.`
        );
      } else if (res.failed > 0) {
        onSuccessToast(
          'Sync Notice',
          `${res.failed} item(s) could not be synchronized. Verify network access and try again.`
        );
      }
    } finally {
      setIsSyncingAll(false);
    }
  };

  const handleDeleteItem = async (id: string, summary: string) => {
    await onDeleteItem(id);
    onSuccessToast('Item Discarded', `Removed "${summary}" from local IndexedDB queue.`);
  };

  const handleClearAll = async () => {
    await onClearAll();
    setConfirmClear(false);
    onSuccessToast('Queue Cleared', 'All local offline items have been removed from IndexedDB.');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="glass-modal rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between gap-4 bg-slate-50/50 dark:bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-xs"
              style={{ backgroundColor: `${palette.hex}18`, color: palette.hex }}
            >
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 font-display">
                  IndexedDB Offline Storage Queue
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono-tabular">
                  {items.length} item{items.length === 1 ? '' : 's'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Submissions captured during field outages stored locally and awaiting central transmission.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close offline queue modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Connectivity Status Banner */}
        <div
          className={`px-5 py-2.5 text-xs font-semibold flex items-center justify-between border-b ${
            isOnline
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-100 dark:border-emerald-900/50'
              : 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-100 dark:border-amber-900/50'
          }`}
        >
          <div className="flex items-center gap-2">
            {isOnline ? (
              <>
                <Wifi className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Internet Connected — Central Collation Hub reachable.</span>
              </>
            ) : (
              <>
                <WifiOff className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 animate-pulse" />
                <span>Offline Field Mode Active — Submissions are safely preserved in browser IndexedDB.</span>
              </>
            )}
          </div>
          <span className="text-[11px] font-mono font-normal opacity-85">
            {isOnline ? 'Auto-sync active' : 'Awaiting network'}
          </span>
        </div>

        {/* Queue Items List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
          {items.length === 0 ? (
            <div className="py-12 text-center text-slate-400 dark:text-slate-500 space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  Offline Queue is Clean
                </p>
                <p className="text-xs max-w-sm mx-auto">
                  All convert records and outreach batches are fully synchronized with the national database.
                </p>
              </div>
            </div>
          ) : (
            items.map(item => {
              const isSyncing = syncingId === item.id || isSyncingAll;
              const isIndividual = item.type === 'individual';
              const p = item.individualPayload;
              const b = item.bulkPayload;

              return (
                <div
                  key={item.id}
                  className="bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 transition-all hover:border-slate-300 dark:hover:border-slate-700 space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        {isIndividual ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase font-mono-tabular bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                            <User className="w-3 h-3" /> Individual Convert
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase font-mono-tabular bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                            <Users className="w-3 h-3" /> Bulk Outreach ({b?.count} Souls)
                          </span>
                        )}

                        <span className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                          {isIndividual
                            ? `${p?.firstName} ${p?.lastName}`
                            : b?.sessionLabel || 'Outreach Outing'}
                        </span>

                        {item.status === 'failed' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                            <AlertCircle className="w-2.5 h-2.5" /> Sync Retry #{item.retryCount}
                          </span>
                        )}
                      </div>

                      {/* Details row */}
                      <div className="text-xs text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="font-medium text-slate-700 dark:text-slate-300">{item.centreName}</span>
                        </span>
                        <span>·</span>
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{item.wonByName}</span>
                        </span>
                        <span>·</span>
                        <span className="flex items-center gap-1 font-mono-tabular">
                          <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                        </span>
                      </div>

                      {/* Payload specifics */}
                      {isIndividual && p && (
                        <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-slate-600 dark:text-slate-300">
                          {p.phone && (
                            <span className="flex items-center gap-1 font-mono bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-800">
                              <Phone className="w-2.5 h-2.5 text-slate-400" /> {p.phone}
                            </span>
                          )}
                          <span className="capitalize px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            {p.decisionType.replace('_', ' ')}
                          </span>
                          <span className="capitalize px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            {p.ageBracket} · {p.gender}
                          </span>
                          {p.community && <span>({p.community})</span>}
                        </div>
                      )}

                      {!isIndividual && b && (
                        <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-slate-600 dark:text-slate-300">
                          <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                            {b.newConverts} New Converts
                          </span>
                          <span>·</span>
                          <span className="text-blue-600 dark:text-blue-400">
                            {b.rededications} Rededications
                          </span>
                          <span>·</span>
                          <span className="text-amber-600 dark:text-amber-400">
                            {b.returnees} Returnees
                          </span>
                        </div>
                      )}

                      {item.lastError && (
                        <div className="text-[11px] text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 p-1.5 rounded-lg border border-rose-200 dark:border-rose-900/60">
                          Error: {item.lastError}
                        </div>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-start">
                      <button
                        id={`sync-queue-item-${item.id}`}
                        onClick={() => handleSyncItem(item.id, item.summary)}
                        disabled={isSyncing}
                        className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-xs transition-transform active:scale-95 cursor-pointer ${
                          palette.btnPrimary
                        } ${isSyncing ? 'opacity-50 cursor-not-allowed' : ''}`}
                        title="Transmit this item immediately to central database"
                      >
                        <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
                        <span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
                      </button>

                      <button
                        id={`delete-queue-item-${item.id}`}
                        onClick={() => handleDeleteItem(item.id, item.summary)}
                        disabled={isSyncing}
                        className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer"
                        title="Discard record from IndexedDB"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer actions */}
        <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {confirmClear ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-rose-600 dark:text-rose-400 font-bold">Discard all?</span>
                <button
                  onClick={handleClearAll}
                  className="px-2.5 py-1.5 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 cursor-pointer"
                >
                  Yes, Clear All
                </button>
                <button
                  onClick={() => setConfirmClear(false)}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            ) : (
              items.length > 0 && (
                <button
                  onClick={() => setConfirmClear(true)}
                  className="text-xs text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 flex items-center gap-1 cursor-pointer py-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear All</span>
                </button>
              )
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs cursor-pointer"
            >
              Close
            </button>

            {items.length > 0 && (
              <button
                id="sync-all-offline-queue-btn"
                onClick={handleSyncAllItems}
                disabled={isSyncingAll}
                className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-sm transition-transform active:scale-95 cursor-pointer ${
                  palette.btnPrimary
                } ${isSyncingAll ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncingAll ? 'animate-spin' : ''}`} />
                <span>{isSyncingAll ? 'Syncing Queue...' : `Sync All (${items.length}) to Collation`}</span>
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
