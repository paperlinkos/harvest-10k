import React, { useState, useMemo } from 'react';
import { dataService } from '../services/dataService';
import { Batch, SoulRecord, UserRole, SubmissionAnomaly } from '../types';
import { Modal } from '../components/Modal';
import { useTheme } from '../context/ThemeContext';
import {
  CheckSquare,
  CheckCircle2,
  XCircle,
  Flame,
  Shield,
  CheckCheck,
  AlertTriangle,
  Clock,
  TrendingUp,
  Filter,
  ShieldAlert,
  Info,
} from 'lucide-react';

interface ApprovalQueueScreenProps {
  userRole: UserRole;
  onSuccessToast: (title: string, message: string) => void;
  theme?: 'dark' | 'light';
}

export const ApprovalQueueScreen: React.FC<ApprovalQueueScreenProps> = ({
  userRole,
  onSuccessToast,
}) => {
  const { palette } = useTheme();
  const [tab, setTab] = useState<'batches' | 'records'>('batches');
  const [filterMode, setFilterMode] = useState<'all' | 'flagged' | 'clean'>('all');
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<{ id: string; type: 'batch' | 'record'; title: string } | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const pendingBatches = dataService.getPendingBatches();
  const pendingRecords = dataService.getPendingSoulRecords();
  const centres = dataService.getCentres();

  const isAuthorized = userRole === 'coordinator' || userRole === 'admin';

  // Compute anomaly maps for fast lookup
  const batchAnomaliesMap = useMemo(() => {
    const map = new Map<string, SubmissionAnomaly[]>();
    pendingBatches.forEach(b => {
      map.set(b.id, dataService.getBatchAnomalies(b));
    });
    return map;
  }, [pendingBatches]);

  const recordAnomaliesMap = useMemo(() => {
    const map = new Map<string, SubmissionAnomaly[]>();
    pendingRecords.forEach(r => {
      map.set(r.id, dataService.getRecordAnomalies(r));
    });
    return map;
  }, [pendingRecords]);

  // Filtered lists
  const filteredBatches = useMemo(() => {
    return pendingBatches.filter(b => {
      const anomalies = batchAnomaliesMap.get(b.id) || [];
      const hasAnomalies = anomalies.length > 0;
      if (filterMode === 'flagged') return hasAnomalies;
      if (filterMode === 'clean') return !hasAnomalies;
      return true;
    });
  }, [pendingBatches, batchAnomaliesMap, filterMode]);

  const filteredRecords = useMemo(() => {
    return pendingRecords.filter(r => {
      const anomalies = recordAnomaliesMap.get(r.id) || [];
      const hasAnomalies = anomalies.length > 0 || !!r.duplicateOverrideReason;
      if (filterMode === 'flagged') return hasAnomalies;
      if (filterMode === 'clean') return !hasAnomalies;
      return true;
    });
  }, [pendingRecords, recordAnomaliesMap, filterMode]);

  const totalFlaggedCount = useMemo(() => {
    let count = 0;
    pendingBatches.forEach(b => {
      if ((batchAnomaliesMap.get(b.id) || []).length > 0) count++;
    });
    pendingRecords.forEach(r => {
      if ((recordAnomaliesMap.get(r.id) || []).length > 0 || r.duplicateOverrideReason) count++;
    });
    return count;
  }, [pendingBatches, pendingRecords, batchAnomaliesMap, recordAnomaliesMap]);

  if (!isAuthorized) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-center space-y-3 shadow-xs">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto"
          style={{ backgroundColor: `${palette.hex}15`, color: palette.hex }}
        >
          <Shield className="w-5 h-5" />
        </div>
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Coordinator Access Required</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          The Verification Queue is restricted to Collation Coordinators and National Admins.
          Switch your role in the top header to inspect entries.
        </p>
      </div>
    );
  }

  const handleApproveBatch = (b: Batch) => {
    dataService.approveBatch(b.id, 'Coordinator Desk', userRole);
    onSuccessToast('Batch Verified', `Verified batch report of ${b.count} souls.`);
  };

  const handleApproveRecord = (r: SoulRecord) => {
    dataService.approveSoulRecord(r.id, 'Coordinator Desk', userRole);
    onSuccessToast('Record Verified', `Verified convert ${r.firstName} ${r.lastName}.`);
  };

  const handleOpenReject = (id: string, type: 'batch' | 'record', title: string) => {
    setRejectTarget({ id, type, title });
    setRejectReason('Duplicate entry or unconfirmed telephone number');
    setRejectModalOpen(true);
  };

  const handleConfirmReject = () => {
    if (!rejectTarget) return;
    if (rejectTarget.type === 'batch') {
      dataService.rejectBatch(rejectTarget.id, rejectReason, 'Coordinator Desk', userRole);
    } else {
      dataService.rejectSoulRecord(rejectTarget.id, rejectReason, 'Coordinator Desk', userRole);
    }
    onSuccessToast('Entry Rejected', 'The submission was rejected and retained in audit logs.');
    setRejectModalOpen(false);
  };

  const handleApproveAll = () => {
    dataService.approveAllPending('Coordinator Desk', userRole);
    onSuccessToast('All Pending Approved', 'All pending batches and soul records verified.');
  };

  const totalPending = pendingBatches.length + pendingRecords.length;

  return (
    <div className="space-y-6 pb-12">
      {/* Header Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 rounded-2xl shadow-xs transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <CheckSquare className="w-5 h-5" style={{ color: palette.hex }} /> Collation Verification &amp; Anomaly Queue
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Audit and verify field submissions with automatic anomaly flags (volume spikes &amp; off-hours screening).
          </p>
        </div>

        <div className="flex items-center gap-3">
          {totalPending > 0 && (
            <button
              id="approve-all-btn"
              onClick={handleApproveAll}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-transform active:scale-98 cursor-pointer self-start sm:self-auto"
            >
              <CheckCheck className="w-4 h-4" />
              <span>Approve All ({totalPending})</span>
            </button>
          )}
        </div>
      </div>

      {/* Control Bar: Sub-Tabs & Anomaly Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Tabs */}
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-fit">
          <button
            id="tab-batches-btn"
            onClick={() => setTab('batches')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              tab === 'batches'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Crusade Batches ({pendingBatches.length})
          </button>

          <button
            id="tab-records-btn"
            onClick={() => setTab('records')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              tab === 'records'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Individual Converts ({pendingRecords.length})
          </button>
        </div>

        {/* Anomaly quick-filters */}
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl text-xs">
          <span className="text-[11px] font-semibold text-slate-400 px-2 flex items-center gap-1">
            <Filter className="w-3 h-3" /> Filter:
          </span>

          <button
            id="filter-all-btn"
            onClick={() => setFilterMode('all')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
              filterMode === 'all'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs font-bold'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            All Pending
          </button>

          <button
            id="filter-flagged-btn"
            onClick={() => setFilterMode('flagged')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
              filterMode === 'flagged'
                ? 'bg-amber-500 text-white shadow-xs font-bold'
                : 'text-amber-600 dark:text-amber-400 hover:bg-amber-500/10'
            }`}
          >
            <AlertTriangle className="w-3 h-3" />
            <span>Flagged Anomalies ({totalFlaggedCount})</span>
          </button>

          <button
            id="filter-clean-btn"
            onClick={() => setFilterMode('clean')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
              filterMode === 'clean'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs font-bold'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Clean Only
          </button>
        </div>
      </div>

      {/* TAB 1: CRUSADE BATCHES */}
      {tab === 'batches' && (
        <div className="space-y-3">
          {filteredBatches.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-12 text-center text-slate-400 space-y-2">
              <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500" />
              <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                {filterMode === 'flagged' ? 'No Flagged Batch Anomalies' : 'All Batches Verified'}
              </div>
              <p className="text-xs">
                {filterMode === 'flagged'
                  ? 'All pending batches meet standard campaign parameters without anomalies.'
                  : 'No crusade batch submissions currently pending audit.'}
              </p>
            </div>
          ) : (
            filteredBatches.map(b => {
              const centre = centres.find(c => c.id === b.centreId);
              const anomalies = batchAnomaliesMap.get(b.id) || [];
              const hasAnomaly = anomalies.length > 0;

              return (
                <div
                  key={b.id}
                  className={`bg-white dark:bg-slate-900 border rounded-2xl p-4 sm:p-5 shadow-xs transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                    hasAnomaly
                      ? 'border-amber-400/80 dark:border-amber-500/50 ring-1 ring-amber-400/20'
                      : 'border-slate-200/80 dark:border-slate-800'
                  }`}
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-sm text-slate-900 dark:text-slate-100">
                        {centre?.name || 'Hub'}
                      </span>

                      <span
                        className="inline-flex items-center gap-1 font-mono-tabular px-2 py-0.5 rounded-md font-bold text-xs border"
                        style={{
                          backgroundColor: `${palette.hex}15`,
                          borderColor: `${palette.hex}30`,
                          color: palette.hex,
                        }}
                      >
                        <Flame className="w-3 h-3" style={{ color: palette.hex, fill: palette.hex }} />
                        +{b.count} Souls
                      </span>

                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
                        Pending Verification
                      </span>
                    </div>

                    <div className="text-xs text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span>Leader: <strong>{b.submittedByName}</strong></span>
                      <span>·</span>
                      <span>{b.sessionLabel}</span>
                      <span>·</span>
                      <span className="font-mono-tabular">
                        Submitted: {new Date(b.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({new Date(b.submittedAt).toLocaleDateString()})
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 font-mono-tabular pt-0.5">
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{b.newConverts} New Converts</span>
                      <span>·</span>
                      <span className="text-blue-600 dark:text-blue-400 font-semibold">{b.rededications} Rededications</span>
                      <span>·</span>
                      <span className="text-purple-600 dark:text-purple-400 font-semibold">{b.returnees} Returnees</span>
                    </div>

                    {b.note && (
                      <div className="text-xs text-slate-600 dark:text-slate-300 italic pt-0.5">
                        "{b.note}"
                      </div>
                    )}

                    {/* ANOMALY FLAGS LIST */}
                    {hasAnomaly && (
                      <div className="space-y-1.5 pt-1">
                        {anomalies.map((anom, idx) => (
                          <div
                            key={idx}
                            className={`p-2.5 rounded-xl text-xs flex items-start gap-2 ${
                              anom.level === 'critical'
                                ? 'bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/80 text-rose-900 dark:text-rose-200'
                                : 'bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 text-amber-900 dark:text-amber-200'
                            }`}
                          >
                            {anom.type === 'HIGH_VOLUME_SPIKE' ? (
                              <TrendingUp className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                            ) : (
                              <Clock className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                            )}
                            <div>
                              <strong className="font-bold block">{anom.title}</strong>
                              <span className="text-[11px] opacity-80">{anom.description}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                    <button
                      id={`approve-batch-${b.id}`}
                      onClick={() => handleApproveBatch(b)}
                      className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-transform active:scale-98 cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Approve</span>
                    </button>

                    <button
                      id={`reject-batch-${b.id}`}
                      onClick={() => handleOpenReject(b.id, 'batch', `Batch of ${b.count} souls (${centre?.name})`)}
                      className="px-3.5 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Reject</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* TAB 2: INDIVIDUAL CONVERTS */}
      {tab === 'records' && (
        <div className="space-y-3">
          {filteredRecords.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-12 text-center text-slate-400 space-y-2">
              <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500" />
              <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                {filterMode === 'flagged' ? 'No Flagged Record Anomalies' : 'All Individual Records Verified'}
              </div>
              <p className="text-xs">
                {filterMode === 'flagged'
                  ? 'No individual convert records have anomaly or duplicate override flags.'
                  : 'No convert records awaiting verification.'}
              </p>
            </div>
          ) : (
            filteredRecords.map(r => {
              const centre = centres.find(c => c.id === r.centreId);
              const anomalies = recordAnomaliesMap.get(r.id) || [];
              const hasAnomaly = anomalies.length > 0 || !!r.duplicateOverrideReason;

              return (
                <div
                  key={r.id}
                  className={`bg-white dark:bg-slate-900 border rounded-2xl p-4 sm:p-5 shadow-xs transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                    hasAnomaly
                      ? 'border-amber-400/80 dark:border-amber-500/50 ring-1 ring-amber-400/20'
                      : 'border-slate-200/80 dark:border-slate-800'
                  }`}
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-sm text-slate-900 dark:text-slate-100">
                        {r.firstName} {r.lastName}
                      </span>
                      <span
                        className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border"
                        style={{
                          backgroundColor: `${palette.hex}15`,
                          borderColor: `${palette.hex}30`,
                          color: palette.hex,
                        }}
                      >
                        {r.decisionType.replace('_', ' ')}
                      </span>
                      {r.duplicateOverrideReason && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30 flex items-center gap-1">
                          <ShieldAlert className="w-3 h-3" /> Duplicate Overridden
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-2">
                      <span>Phone: <strong className="font-mono-tabular">{r.phone || 'N/A'}</strong></span>
                      <span>·</span>
                      <span>Centre: <strong>{centre?.name}</strong></span>
                      <span>·</span>
                      <span>Evangelist: {r.wonByName}</span>
                      <span>·</span>
                      <span className="font-mono-tabular">
                        Logged: {new Date(r.wonAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    {r.notes && (
                      <div className="text-xs text-slate-600 dark:text-slate-300 italic pt-0.5">
                        "{r.notes}"
                      </div>
                    )}

                    {/* OVERRIDE REASON NOTICE */}
                    {r.duplicateOverrideReason && (
                      <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-2">
                        <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold block">User Reason for Duplicate Override:</span>
                          <span className="text-[11px] text-amber-800 dark:text-amber-300">{r.duplicateOverrideReason}</span>
                        </div>
                      </div>
                    )}

                    {/* ANOMALIES LIST */}
                    {anomalies.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        {anomalies.map((anom, idx) => (
                          <div
                            key={idx}
                            className={`p-2.5 rounded-xl text-xs flex items-start gap-2 ${
                              anom.level === 'critical'
                                ? 'bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/80 text-rose-900 dark:text-rose-200'
                                : 'bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 text-amber-900 dark:text-amber-200'
                            }`}
                          >
                            {anom.type === 'POTENTIAL_DUPLICATE' ? (
                              <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                            ) : (
                              <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                            )}
                            <div>
                              <strong className="font-bold block">{anom.title}</strong>
                              <span className="text-[11px] opacity-80">{anom.description}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                    <button
                      id={`approve-record-${r.id}`}
                      onClick={() => handleApproveRecord(r)}
                      className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Approve</span>
                    </button>

                    <button
                      id={`reject-record-${r.id}`}
                      onClick={() => handleOpenReject(r.id, 'record', `${r.firstName} ${r.lastName}`)}
                      className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950 text-slate-500 hover:text-rose-600 text-xs cursor-pointer"
                      title="Reject Submission"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* REJECT MODAL */}
      <Modal
        isOpen={rejectModalOpen}
        onClose={() => setRejectModalOpen(false)}
        title="Reject Submission"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600 dark:text-slate-300">
            Specify the rationale for rejecting <strong>{rejectTarget?.title}</strong> (will be archived in audit log):
          </p>

          <textarea
            id="reject-reason-input"
            rows={3}
            value={rejectReason}
            onChange={e => setRejectReason(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl p-3 text-xs focus:outline-none"
          />

          <div className="flex justify-end gap-2">
            <button
              id="cancel-reject-btn"
              onClick={() => setRejectModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              id="confirm-reject-btn"
              onClick={handleConfirmReject}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-xs cursor-pointer"
            >
              Confirm Rejection
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

