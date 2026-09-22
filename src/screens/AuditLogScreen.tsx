import React, { useState, useMemo } from 'react';
import { dataService } from '../services/dataService';
import { AuditLogEntry, UserRole, AuditActionType } from '../types';
import { useTheme } from '../context/ThemeContext';
import {
  History,
  Shield,
  Search,
  Trash2,
  RotateCcw,
  CheckCircle2,
  XCircle,
  PlusCircle,
  Edit3,
  AlertTriangle,
  Download,
  Calendar,
  User,
  ChevronDown,
  ChevronUp,
  FileText,
  MapPin,
} from 'lucide-react';

interface AuditLogScreenProps {
  userRole: UserRole;
  onSuccessToast: (title: string, message: string) => void;
  theme?: 'dark' | 'light';
}

export const AuditLogScreen: React.FC<AuditLogScreenProps> = ({
  userRole,
  onSuccessToast,
}) => {
  const { palette } = useTheme();
  const [actionCategory, setActionCategory] = useState<string>('all');
  const [targetTypeFilter, setTargetTypeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [anomalyOnly, setAnomalyOnly] = useState<boolean>(false);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const logs = dataService.getAuditLogs();
  const isAdmin = userRole === 'admin';

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      // Action Category filter
      if (actionCategory !== 'all') {
        if (actionCategory === 'creates' && !log.action.startsWith('CREATE_')) return false;
        if (actionCategory === 'edits' && !log.action.startsWith('EDIT_') && !log.action.startsWith('UPDATE_')) return false;
        if (actionCategory === 'approves' && !log.action.startsWith('APPROVE_')) return false;
        if (actionCategory === 'rejects' && !log.action.startsWith('REJECT_')) return false;
        if (actionCategory === 'deletes' && log.action !== 'DELETE_RECORD') return false;
        if (actionCategory === 'restores' && log.action !== 'RESTORE_RECORD') return false;
      }

      // Target Type filter
      if (targetTypeFilter !== 'all' && log.targetType !== targetTypeFilter) {
        return false;
      }

      // Anomaly flag filter
      if (anomalyOnly && !log.isAnomalyFlagged) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const actorMatch = log.actorName.toLowerCase().includes(q);
        const detailsMatch = log.details.toLowerCase().includes(q);
        const targetTitleMatch = log.targetTitle.toLowerCase().includes(q);
        const targetIdMatch = log.targetId.toLowerCase().includes(q);
        const centreMatch = (log.centreName || '').toLowerCase().includes(q);

        if (!actorMatch && !detailsMatch && !targetTitleMatch && !targetIdMatch && !centreMatch) {
          return false;
        }
      }
      return true;
    });
  }, [logs, actionCategory, targetTypeFilter, anomalyOnly, searchQuery]);

  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-center space-y-3 shadow-xs">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto"
          style={{ backgroundColor: `${palette.hex}15`, color: palette.hex }}
        >
          <Shield className="w-5 h-5" />
        </div>
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">National Administrator Access Required</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          The National Audit Log &amp; Mutation History is restricted to campaign administrative supervisors.
          Please switch your active role to Administrator in the top header.
        </p>
      </div>
    );
  }

  const handleRestoreRecord = (soulId: string) => {
    const success = dataService.restoreSoulRecord(soulId, 'Admin Audit Desk', userRole);
    if (success) {
      onSuccessToast('Record Restored', 'The soft-deleted soul record has been restored to active status.');
    }
  };

  const handleExportCSV = () => {
    const headers = ['ID', 'Timestamp', 'Actor Name', 'Actor Role', 'Action', 'Target Type', 'Target ID', 'Target Title', 'Centre', 'Details', 'Anomaly Flagged'];
    const rows = filteredLogs.map(l => [
      l.id,
      l.timestamp,
      `"${l.actorName.replace(/"/g, '""')}"`,
      l.actorRole,
      l.action,
      l.targetType,
      l.targetId,
      `"${l.targetTitle.replace(/"/g, '""')}"`,
      `"${(l.centreName || '').replace(/"/g, '""')}"`,
      `"${l.details.replace(/"/g, '""')}"`,
      l.isAnomalyFlagged ? 'YES' : 'NO',
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Harvest10K_Audit_Log_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    onSuccessToast('Audit Log Exported', 'Downloaded complete audit ledger as CSV.');
  };

  const getActionBadge = (action: AuditActionType) => {
    switch (action) {
      case 'CREATE_RECORD':
      case 'CREATE_BATCH':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase font-mono-tabular bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <PlusCircle className="w-3 h-3" /> Created
          </span>
        );
      case 'EDIT_RECORD':
      case 'UPDATE_CAMPAIGN':
      case 'UPDATE_CENTRE':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase font-mono-tabular bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
            <Edit3 className="w-3 h-3" /> Modified
          </span>
        );
      case 'APPROVE_RECORD':
      case 'APPROVE_BATCH':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase font-mono-tabular bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20">
            <CheckCircle2 className="w-3 h-3" /> Approved
          </span>
        );
      case 'REJECT_RECORD':
      case 'REJECT_BATCH':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase font-mono-tabular bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
            <XCircle className="w-3 h-3" /> Rejected
          </span>
        );
      case 'DELETE_RECORD':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase font-mono-tabular bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
            <Trash2 className="w-3 h-3" /> Soft Deleted
          </span>
        );
      case 'RESTORE_RECORD':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase font-mono-tabular bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
            <RotateCcw className="w-3 h-3" /> Restored
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase font-mono-tabular bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20">
            {action}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 rounded-2xl shadow-xs transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <History className="w-5 h-5" style={{ color: palette.hex }} /> Campaign Audit &amp; Data Mutation Ledger
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Immutable log of every record creation, edit, approval, rejection, and soft-delete across all collation hubs.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            id="export-audit-csv-btn"
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 rounded-2xl shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search bar */}
          <div className="relative sm:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              id="audit-search-input"
              type="text"
              placeholder="Search by actor, target, centre, or details..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl pl-9 pr-3 py-2 text-xs focus:outline-none"
            />
          </div>

          {/* Action Filter */}
          <div>
            <select
              id="audit-action-filter"
              value={actionCategory}
              onChange={e => setActionCategory(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl px-3 py-2 text-xs focus:outline-none cursor-pointer"
            >
              <option value="all">All Actions ({logs.length})</option>
              <option value="creates">Created Records &amp; Batches</option>
              <option value="edits">Edits &amp; Updates</option>
              <option value="approves">Approvals</option>
              <option value="rejects">Rejections</option>
              <option value="deletes">Soft Deletions</option>
              <option value="restores">Restorations</option>
            </select>
          </div>

          {/* Entity Type Filter */}
          <div>
            <select
              id="audit-entity-filter"
              value={targetTypeFilter}
              onChange={e => setTargetTypeFilter(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl px-3 py-2 text-xs focus:outline-none cursor-pointer"
            >
              <option value="all">All Target Entities</option>
              <option value="record">Convert Soul Records</option>
              <option value="batch">Crusade Batches</option>
              <option value="centre">Collation Centres</option>
              <option value="campaign">Campaign Settings</option>
            </select>
          </div>
        </div>

        {/* Anomaly Flag toggle */}
        <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800/80 text-xs">
          <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300">
            <input
              id="anomaly-filter-checkbox"
              type="checkbox"
              checked={anomalyOnly}
              onChange={e => setAnomalyOnly(e.target.checked)}
              className="rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
            />
            <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-700 dark:text-amber-300">
              <AlertTriangle className="w-3.5 h-3.5" /> Show Anomaly Flags &amp; Duplicate Overrides Only
            </span>
          </label>

          <span className="text-[11px] text-slate-400 font-mono-tabular">
            Showing <strong>{filteredLogs.length}</strong> of <strong>{logs.length}</strong> events
          </span>
        </div>
      </div>

      {/* Audit Log Entries Feed */}
      <div className="space-y-3">
        {filteredLogs.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-12 text-center text-slate-400 space-y-2">
            <History className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600" />
            <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              No Matching Audit Logs
            </div>
            <p className="text-xs">Try adjusting your search criteria or action filters.</p>
          </div>
        ) : (
          filteredLogs.map(log => {
            const isExpanded = expandedLogId === log.id;
            const hasDetailsPayload = (log.metadata && Object.keys(log.metadata).length > 0) || (log.changes && Object.keys(log.changes).length > 0);
            const isSoftDeleted = log.action === 'DELETE_RECORD';

            return (
              <div
                key={log.id}
                className={`bg-white dark:bg-slate-900 border rounded-2xl p-4 sm:p-5 shadow-xs transition-colors space-y-2.5 ${
                  log.isAnomalyFlagged
                    ? 'border-amber-400/80 dark:border-amber-500/40 bg-amber-50/20 dark:bg-amber-950/10'
                    : isSoftDeleted
                    ? 'border-red-200 dark:border-red-900/50 bg-red-50/10 dark:bg-red-950/10'
                    : 'border-slate-200/80 dark:border-slate-800'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {getActionBadge(log.action)}

                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        {log.targetTitle}
                      </span>

                      {log.isAnomalyFlagged && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 flex items-center gap-1">
                          <AlertTriangle className="w-2.5 h-2.5" /> Anomaly Flagged
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
                        <User className="w-3 h-3 text-slate-400" />
                        {log.actorName} <span className="font-mono text-[10px] uppercase opacity-75">({log.actorRole})</span>
                      </span>
                      <span>·</span>
                      <span className="flex items-center gap-1 font-mono-tabular">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        {new Date(log.timestamp).toLocaleDateString()} {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                      {log.centreName && (
                        <>
                          <span>·</span>
                          <span className="flex items-center gap-1 font-medium text-slate-600 dark:text-slate-300">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            {log.centreName}
                          </span>
                        </>
                      )}
                    </div>

                    <p className="text-xs text-slate-700 dark:text-slate-300 pt-0.5">
                      {log.details}
                    </p>
                  </div>

                  {/* Right Action Buttons */}
                  <div className="flex items-center gap-2 self-end sm:self-start shrink-0">
                    {/* Restore soft-deleted soul button */}
                    {log.action === 'DELETE_RECORD' && log.targetType === 'record' && (
                      <button
                        id={`restore-record-${log.targetId}`}
                        onClick={() => handleRestoreRecord(log.targetId)}
                        className="px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
                        title="Restore soft deleted convert record back to directory"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Restore</span>
                      </button>
                    )}

                    {hasDetailsPayload && (
                      <button
                        onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                        className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5 text-slate-400" />
                        <span>Changes &amp; Payload</span>
                        {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>
                    )}
                  </div>
                </div>

                {/* Collapsible Metadata / Changes Drawer */}
                {isExpanded && hasDetailsPayload && (
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 text-xs font-mono space-y-2 text-slate-600 dark:text-slate-400 bg-slate-50/60 dark:bg-slate-950/60 p-3 rounded-xl">
                    {log.changes && Object.keys(log.changes).length > 0 && (
                      <div>
                        <div className="font-bold text-[10px] uppercase text-slate-500 mb-1">Field State Transitions:</div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                          {Object.entries(log.changes).map(([field, change]) => {
                            const c = change as { from: unknown; to: unknown };
                            return (
                              <div key={field} className="p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                                <div className="font-semibold text-slate-800 dark:text-slate-200">{field}:</div>
                                <div className="text-red-500 line-through">from: {JSON.stringify(c.from)}</div>
                                <div className="text-emerald-600 dark:text-emerald-400">to: {JSON.stringify(c.to)}</div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {log.metadata && Object.keys(log.metadata).length > 0 && (
                      <div>
                        <div className="font-bold text-[10px] uppercase text-slate-500 mb-1">Metadata Context:</div>
                        <pre className="overflow-x-auto text-[11px] whitespace-pre-wrap">
                          {JSON.stringify(log.metadata, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
