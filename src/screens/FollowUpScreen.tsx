import React, { useState } from 'react';
import { dataService } from '../services/dataService';
import { SoulRecord, FollowUpStatus, UserRole } from '../types';
import { Modal } from '../components/Modal';
import { useTheme } from '../context/ThemeContext';
import {
  Users,
  Phone,
  Clock,
  Home,
  Church,
  AlertCircle,
  Search,
  MessageCircle,
  MapPin,
  ShieldAlert,
} from 'lucide-react';
import { getWhatsAppLink } from '../utils/whatsappUtils';

interface FollowUpScreenProps {
  onSuccessToast?: (title: string, message: string) => void;
  theme?: 'dark' | 'light';
  userRole?: UserRole;
  onNavigate?: (screen: any) => void;
}

const STAGES: { id: FollowUpStatus; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'not_started', label: 'Not Contacted', icon: Clock },
  { id: 'contacted', label: 'Contacted (Call/SMS)', icon: Phone },
  { id: 'visited', label: 'Home Visited', icon: Home },
  { id: 'integrated', label: 'Integrated in Church', icon: Church },
  { id: 'unreachable', label: 'Unreachable', icon: AlertCircle },
];

export const FollowUpScreen: React.FC<FollowUpScreenProps> = ({
  onSuccessToast,
  userRole = 'coordinator',
  onNavigate,
}) => {
  const { palette } = useTheme();
  const [selectedCentre, setSelectedCentre] = useState<string>('all');
  const [search, setSearch] = useState<string>('');
  const [editingRecord, setEditingRecord] = useState<SoulRecord | null>(null);
  const [newStatus, setNewStatus] = useState<FollowUpStatus>('not_started');
  const [followUpNotes, setFollowUpNotes] = useState<string>('');
  const [followUpChurch, setFollowUpChurch] = useState<string>('');

  // Access Control Guard
  if (userRole === 'field_worker' || userRole === 'public') {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4 text-center">
        <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 font-display">
            Restricted Leadership Board
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
            The Zonal Follow-Up & Pastoral Retention Board is managed by Centre Coordinators and Care Team Leads.
            {userRole === 'field_worker'
              ? " As a Field Evangelist, you can track and reach the souls you personally won under 'My Won Souls'."
              : " For public overview and rankings, please visit the Live Dashboard or Leaderboards."}
          </p>
          <div className="pt-2">
            <button
              onClick={() => onNavigate && onNavigate(userRole === 'field_worker' ? 'records' : 'dashboard')}
              className={`px-5 py-2.5 rounded-xl font-bold text-xs shadow-xs cursor-pointer ${palette.btnPrimary}`}
            >
              {userRole === 'field_worker' ? 'Go to My Won Souls' : 'Return to Dashboard'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const centres = dataService.getCentres();
  const funnelStats = dataService.getFollowUpStats();

  const allRecords = dataService.getSoulRecords({
    centreId: selectedCentre !== 'all' ? selectedCentre : undefined,
    search: search.trim() || undefined,
  });

  const handleOpenEdit = (record: SoulRecord) => {
    setEditingRecord(record);
    setNewStatus(record.followUpStatus);
    setFollowUpNotes(record.notes || '');
    setFollowUpChurch(record.followUpChurch || 'Central Assembly Hub');
  };

  const handleSaveEdit = () => {
    if (!editingRecord) return;
    dataService.updateFollowUp(editingRecord.id, {
      status: newStatus,
      notes: followUpNotes,
      followUpChurch,
    });

    if (onSuccessToast) {
      onSuccessToast(
        'Follow-Up Updated',
        `Updated discipleship status for ${editingRecord.firstName} ${editingRecord.lastName}.`
      );
    }
    setEditingRecord(null);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 rounded-2xl shadow-xs transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Users className="w-5 h-5" style={{ color: palette.hex }} /> Discipleship & Retention Pipeline
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Track pastoral care, initial contact, home visits, and church integration for new converts.
          </p>
        </div>

        {/* Filter controls */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search converts..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl pl-8 pr-3 py-1.5 text-xs focus:outline-none"
            />
          </div>

          <select
            value={selectedCentre}
            onChange={e => setSelectedCentre(e.target.value)}
            className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl px-3 py-1.5 text-xs focus:outline-none cursor-pointer"
          >
            <option value="all">All Centres</option>
            {centres.map(c => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Funnel Metric Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {STAGES.map(s => {
          const count = funnelStats[s.id] || 0;
          const percent = funnelStats.total > 0 ? Math.round((count / funnelStats.total) * 100) : 0;
          const Icon = s.icon;

          return (
            <div
              key={s.id}
              className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-3.5 rounded-2xl shadow-xs space-y-1"
            >
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[11px] font-semibold">{s.label}</span>
                <Icon className="w-3.5 h-3.5" />
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-xl font-bold font-mono-tabular text-slate-900 dark:text-slate-100">
                  {count}
                </span>
                <span className="text-[10px] font-mono-tabular text-slate-400">{percent}%</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Kanban / Pipeline Columns */}
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin">
        {STAGES.map(stage => {
          const stageRecords = allRecords.filter(r => r.followUpStatus === stage.id);
          const Icon = stage.icon;

          return (
            <div
              key={stage.id}
              className="flex-1 min-w-[280px] max-w-[340px] bg-slate-50/80 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-3.5 flex flex-col space-y-3 shrink-0"
            >
              {/* Column header */}
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-1.5 min-w-0">
                  <Icon className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                    {stage.label}
                  </span>
                </div>
                <span className="text-[10px] font-mono-tabular font-bold px-2 py-0.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-400 shrink-0 ml-1.5">
                  {stageRecords.length}
                </span>
              </div>

              {/* Soul Cards in stage */}
              <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[560px] pr-0.5">
                {stageRecords.length === 0 ? (
                  <div className="p-6 text-center text-[11px] text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                    Empty Stage
                  </div>
                ) : (
                  stageRecords.map(r => {
                    const centre = centres.find(c => c.id === r.centreId);

                    return (
                      <div
                        key={r.id}
                        onClick={() => handleOpenEdit(r)}
                        className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-3.5 rounded-xl shadow-xs hover:border-slate-400 dark:hover:border-slate-600 transition-all cursor-pointer space-y-2 group"
                      >
                        <div className="flex items-start justify-between gap-2 min-w-0">
                          <div className="font-bold text-xs text-slate-900 dark:text-slate-100 group-hover:opacity-80 transition-opacity truncate min-w-0 flex-1">
                            {r.firstName} {r.lastName}
                          </div>
                          <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 whitespace-nowrap shrink-0">
                            {r.decisionType === 'new_convert' ? 'New Convert' : r.decisionType === 'rededication' ? 'Rededication' : 'Returnee'}
                          </span>
                        </div>

                        <div className="space-y-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                          {r.phone && (
                            <div className="flex items-center justify-between gap-2 min-w-0">
                              <div className="flex items-center gap-1.5 text-[11px] font-mono-tabular text-slate-700 dark:text-slate-300 min-w-0 truncate">
                                <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                                <span className="truncate">{r.phone}</span>
                              </div>
                              {getWhatsAppLink({
                                phone: r.phone,
                                firstName: r.firstName,
                                lastName: r.lastName,
                                decisionType: r.decisionType,
                                centreName: centre?.name,
                                soulWinnerName: r.wonByName,
                              }) && (
                                <a
                                  href={getWhatsAppLink({
                                    phone: r.phone,
                                    firstName: r.firstName,
                                    lastName: r.lastName,
                                    decisionType: r.decisionType,
                                    centreName: centre?.name,
                                    soulWinnerName: r.wonByName,
                                  })!}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold border border-emerald-500/20 transition-colors shrink-0 whitespace-nowrap"
                                  title="Send gospel welcome message on WhatsApp"
                                >
                                  <MessageCircle className="w-3 h-3 shrink-0" />
                                  <span>WhatsApp</span>
                                </a>
                              )}
                            </div>
                          )}
                          <div className="truncate text-slate-600 dark:text-slate-300 font-medium text-[11px] min-w-0">
                            {centre?.name}
                          </div>
                          {r.outreachSpot && (
                            <div className="flex items-center gap-1.5 text-[10px] text-amber-600 dark:text-amber-400 font-medium min-w-0">
                              <MapPin className="w-2.5 h-2.5 shrink-0" />
                              <span className="truncate" title={`Won: ${r.outreachSpot}`}>Won: {r.outreachSpot}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1.5 text-[10px] text-indigo-600 dark:text-indigo-400 font-medium min-w-0">
                            <Home className="w-2.5 h-2.5 shrink-0" />
                            <span className="truncate" title={`Lives: ${r.residentialDistrict || r.residentialAddress || r.community || 'Abuja'}`}>
                              Lives: {r.residentialDistrict || r.residentialAddress || r.community || 'Abuja'}
                            </span>
                          </div>
                        </div>

                        {r.notes && (
                          <div className="text-[10px] text-slate-400 italic line-clamp-1 border-t border-slate-100 dark:border-slate-800 pt-1.5">
                            "{r.notes}"
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* EDIT FOLLOW-UP STATUS MODAL */}
      <Modal
        isOpen={!!editingRecord}
        onClose={() => setEditingRecord(null)}
        title="Update Discipleship Status"
      >
        {editingRecord && (
          <div className="space-y-4 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3">
              <div>
                <div className="font-bold text-sm text-slate-900 dark:text-slate-100">
                  {editingRecord.firstName} {editingRecord.lastName}
                </div>
                <div className="text-slate-500 mt-0.5">
                  Phone: {editingRecord.phone || 'N/A'} · Won by {editingRecord.wonByName}
                </div>
                <div className="mt-1 flex flex-col gap-0.5 text-[11px]">
                  {editingRecord.outreachSpot && (
                    <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1 font-semibold">
                      <MapPin className="w-3 h-3 shrink-0" />
                      Won at: {editingRecord.outreachSpot}
                    </span>
                  )}
                  <span className="text-indigo-600 dark:text-indigo-400 flex items-center gap-1 font-semibold">
                    <Home className="w-3 h-3 shrink-0" />
                    Living Address: {editingRecord.residentialAddress || editingRecord.residentialDistrict || 'No address logged'}
                  </span>
                  {editingRecord.residentialDistrict && (
                    <span className="text-slate-400 text-[10px] pl-4">
                      District: {editingRecord.residentialDistrict} ({editingRecord.residentialAreaCouncil || 'FCT'})
                    </span>
                  )}
                </div>
              </div>

              {editingRecord.phone && getWhatsAppLink({
                phone: editingRecord.phone,
                firstName: editingRecord.firstName,
                lastName: editingRecord.lastName,
                decisionType: editingRecord.decisionType,
                centreName: editingRecord.followUpChurch,
                soulWinnerName: editingRecord.wonByName,
              }) && (
                <a
                  href={getWhatsAppLink({
                    phone: editingRecord.phone,
                    firstName: editingRecord.firstName,
                    lastName: editingRecord.lastName,
                    decisionType: editingRecord.decisionType,
                    centreName: editingRecord.followUpChurch,
                    soulWinnerName: editingRecord.wonByName,
                  })!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs transition-colors shrink-0"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>Message on WhatsApp</span>
                </a>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="block font-semibold text-slate-700 dark:text-slate-300">
                Current Pipeline Stage
              </label>
              <select
                value={newStatus}
                onChange={e => setNewStatus(e.target.value as FollowUpStatus)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl px-3 py-2 text-xs focus:outline-none cursor-pointer"
              >
                {STAGES.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block font-semibold text-slate-700 dark:text-slate-300">
                Assigned Assembly / Cell
              </label>
              <input
                type="text"
                value={followUpChurch}
                onChange={e => setFollowUpChurch(e.target.value)}
                placeholder="e.g. Calvary Assembly Cell Group"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl px-3 py-2 text-xs focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block font-semibold text-slate-700 dark:text-slate-300">
                Pastoral Notes & Follow-Up Log
              </label>
              <textarea
                rows={3}
                value={followUpNotes}
                onChange={e => setFollowUpNotes(e.target.value)}
                placeholder="Log contact call details, prayer requests, or visitation schedule..."
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl p-3 text-xs focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setEditingRecord(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className={`px-4 py-2 rounded-xl text-xs font-bold shadow-xs cursor-pointer ${palette.btnPrimary}`}
              >
                Save Changes
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
