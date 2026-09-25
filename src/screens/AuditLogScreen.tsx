import React, { useState, useEffect } from 'react';
import { dataService } from '../services/dataService';
import { UserRole, AuditLogEntry } from '../types';
import { useTheme } from '../context/ThemeContext';
import {
  History,
  ShieldAlert,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  User,
  Building2,
  AlertTriangle,
} from 'lucide-react';

interface AuditLogScreenProps {
  userRole: UserRole;
  theme?: 'dark' | 'light';
  onSuccessToast: (title: string, message: string) => void;
}

export const AuditLogScreen: React.FC<AuditLogScreenProps> = ({
  userRole,
}) => {
  const { palette } = useTheme();
  const [logs, setLogs] = useState<AuditLogEntry[]>(dataService.getAuditLogs());
  const [search, setSearch] = useState('');
  const [anomalyOnly, setAnomalyOnly] = useState(false);

  useEffect(() => {
    const unsub = dataService.subscribe(() => {
      setLogs(dataService.getAuditLogs());
    });
    return unsub;
  }, []);

  const filteredLogs = logs.filter(log => {
    const matchesSearch =
      log.actorName.toLowerCase().includes(search.toLowerCase()) ||
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      log.details.toLowerCase().includes(search.toLowerCase()) ||
      log.targetTitle.toLowerCase().includes(search.toLowerCase());
    const matchesAnomaly = !anomalyOnly || log.isAnomalyFlagged;
    return matchesSearch && matchesAnomaly;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h1 className="text-xl font-black text-slate-900 dark:text-white">
              Immutable Collation Audit Trail
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Complete traceability log for every soul created, batch submitted, record verified, and exception overridden.
          </p>
        </div>

        <div className="text-right">
          <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">
            {logs.length}
          </span>
          <span className="text-xs text-slate-400 block">Logged Operations</span>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search audit trail by actor, action, or details..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl pl-9 pr-3 py-2 text-xs focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={anomalyOnly}
              onChange={e => setAnomalyOnly(e.target.checked)}
              className="rounded border-slate-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
            />
            <span className="flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
              <span>Anomalies Only</span>
            </span>
          </label>
        </div>
      </div>

      {/* Log Feed */}
      <div className="space-y-3">
        {filteredLogs.map(log => (
          <div
            key={log.id}
            className={`p-4 rounded-2xl border transition-all ${
              log.isAnomalyFlagged
                ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800/60'
                : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800'
            }`}
          >
            <div className="flex items-start justify-between gap-3 text-xs">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 dark:text-white">
                    {log.targetTitle}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    {log.action}
                  </span>
                  {log.isAnomalyFlagged && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> Flagged
                    </span>
                  )}
                </div>

                <p className="text-slate-600 dark:text-slate-400 text-xs">
                  {log.details}
                </p>

                <div className="flex items-center gap-4 text-[11px] text-slate-400 pt-1">
                  <span className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    <span>{log.actorName} ({log.actorRole})</span>
                  </span>
                  {log.centreName && (
                    <span className="flex items-center gap-1">
                      <Building2 className="w-3 h-3" />
                      <span>{log.centreName}</span>
                    </span>
                  )}
                </div>
              </div>

              <span className="text-[11px] text-slate-400 font-mono shrink-0">
                {new Date(log.timestamp).toLocaleString('en-GB', {
                  day: '2-digit',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
