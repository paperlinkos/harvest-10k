import React, { useState } from 'react';
import { dataService } from '../services/dataService';
import { useTheme } from '../context/ThemeContext';
import { SoulRecord, Gender, AgeBracket, DecisionType } from '../types';
import { LOCALITIES } from '../data/fctLocations';
import { CheckCircle2, Clock, Trash2, ArrowRight, ChevronDown, ChevronUp, AlertCircle, User, Phone, MapPin, X, ShieldAlert, Sparkles, AlertTriangle } from 'lucide-react';
import { formatNigerianPhone } from '../utils/phoneUtils';

interface ReconcileScreenProps {
  theme: string;
  onSuccessToast: (title: string, message: string) => void;
  onNavigateToTally: () => void;
}

export const ReconcileScreen: React.FC<ReconcileScreenProps> = ({ theme, onSuccessToast, onNavigateToTally }) => {
  const { palette } = useTheme();
  const records = dataService.getSoulRecords();
  const userId = 'field-worker-current';
  const userName = 'Evangelist David';

  // Three-state grouping for user records
  const userRecords = records.filter(r => (r.tappedByUserId === userId || r.wonByName === userName) && !r.isDeleted);
  const pendingRecords = userRecords.filter(r => r.reconcileStatus === 'pending' || (!r.phone && r.reconcileStatus !== 'abandoned' && r.reconcileStatus !== 'complete'));
  const contactableRecords = userRecords.filter(r => r.reconcileStatus === 'contactable' || (r.phone && r.reconcileStatus !== 'abandoned' && r.reconcileStatus !== 'complete' && !r.firstName));

  const allIncomplete = [...contactableRecords, ...pendingRecords];

  const totalTappedUser = userRecords.length;
  const totalCompleteUser = userRecords.filter(r => r.reconcileStatus === 'complete').length;
  const progressPercent = totalTappedUser > 0 ? Math.round((totalCompleteUser / totalTappedUser) * 1000) / 10 : 100;

  // Active record being reconciled
  const [activeRecordId, setActiveRecordId] = useState<string | null>(allIncomplete[0]?.id || null);

  // Form fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [locality, setLocality] = useState(LOCALITIES[0]?.name || '');
  const [showMoreDetails, setShowMoreDetails] = useState(false);
  const [gender, setGender] = useState<Gender>('female');
  const [ageBracket, setAgeBracket] = useState<AgeBracket>('youth');
  const [decisionType, setDecisionType] = useState<DecisionType>('new_convert');
  const [notes, setNotes] = useState('');

  // Abandon modal state
  const [abandoningId, setAbandoningId] = useState<string | null>(null);
  const [abandonReason, setAbandonReason] = useState('');

  const activeRecord = allIncomplete.find(r => r.id === activeRecordId) || records.find(r => r.id === activeRecordId);

  const handleSelectRecord = (rec: SoulRecord) => {
    setActiveRecordId(rec.id);
    setFirstName(rec.firstName || '');
    setLastName(rec.lastName || '');
    setPhone(rec.phone || '');
    setLocality(rec.locality || rec.community || LOCALITIES[0]?.name || '');
    setGender(rec.gender || 'female');
    setAgeBracket(rec.ageBracket || 'youth');
    setDecisionType(rec.decisionType || 'new_convert');
    setNotes(rec.notes || '');
    setShowMoreDetails(false);
  };

  const handleSaveAndNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeRecordId) return;

    if (!firstName.trim() || !phone.trim() || !locality.trim()) {
      onSuccessToast('Missing Required Fields', 'Please provide First Name, Phone Number, and Locality.');
      return;
    }

    dataService.reconcileSoulRecord(
      activeRecordId,
      {
        firstName: firstName.trim(),
        lastName: lastName.trim() || 'Convert',
        phone: phone.trim(),
        gender,
        ageBracket,
        community: locality,
        locality,
        decisionType,
        notes: notes.trim(),
      },
      userName
    );

    onSuccessToast('Soul Reconciled', `Successfully accounted for ${firstName}!`);

    const remaining = allIncomplete.filter(r => r.id !== activeRecordId);
    if (remaining.length > 0) {
      handleSelectRecord(remaining[0]);
    } else {
      setActiveRecordId(null);
    }
  };

  const handleConfirmAbandon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!abandoningId || !abandonReason.trim()) return;

    dataService.abandonSoulRecord(abandoningId, abandonReason.trim(), userName);
    setAbandoningId(null);
    setAbandonReason('');
    onSuccessToast('Record Abandoned', 'The tap record has been marked abandoned and retained in audit log.');
  };

  const getTimeAgo = (isoString?: string) => {
    if (!isoString) return 'Just now';
    const diffMs = Date.now() - new Date(isoString).getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  };

  const hasOldPendings = allIncomplete.some(r => {
    const t = new Date(r.tappedAt || r.wonAt).getTime();
    return Date.now() - t > 24 * 3600 * 1000;
  });

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6 pb-24">
      {/* Header & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5" style={{ color: palette.hex }} /> Reconcile Tap Records
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Grouped by "Has phone, needs name" and "Needs phone".
          </p>
        </div>

        <button
          type="button"
          onClick={onNavigateToTally}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-xs cursor-pointer ${palette.btnPrimary}`}
        >
          <span>+ Back to Tap Tally</span>
        </button>
      </div>

      {/* Progress Bar Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-xs space-y-3">
        <div className="flex items-center justify-between text-xs font-semibold">
          <span className="text-slate-700 dark:text-slate-300">
            Accounted For: <strong className="text-slate-900 dark:text-slate-100">{totalCompleteUser}</strong> of <strong className="text-slate-900 dark:text-slate-100">{totalTappedUser}</strong> total tallies
          </span>
          <span className="font-mono text-emerald-600 dark:text-emerald-400">{progressPercent}% Reconciled</span>
        </div>
        <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%`, backgroundColor: palette.hex }}
          />
        </div>
      </div>

      {hasOldPendings && (
        <div className="bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 p-4 rounded-2xl flex items-center gap-3 text-xs text-amber-800 dark:text-amber-200">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
          <span>You have pending tap tallies older than 24 hours awaiting reconciliation.</span>
        </div>
      )}

      {allIncomplete.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center space-y-4 shadow-xs">
          <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">All Records Fully Reconciled!</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Fantastic work! Every soul won has been fully accounted for.
            </p>
          </div>
          <button
            onClick={onNavigateToTally}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs shadow-xs cursor-pointer ${palette.btnPrimary}`}
          >
            Return to Tap Tally
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Grouped Pending / Contactable List */}
          <div className="lg:col-span-1 space-y-4 max-h-[650px] overflow-y-auto pr-1">
            {/* SECTION 1: Has phone, needs name */}
            {contactableRecords.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                    Has Phone, Needs Name ({contactableRecords.length})
                  </h3>
                </div>
                <div className="space-y-2">
                  {contactableRecords.map(rec => {
                    const isActive = activeRecordId === rec.id;
                    const timeAgo = getTimeAgo(rec.tappedAt || rec.wonAt);
                    return (
                      <div
                        key={rec.id}
                        onClick={() => handleSelectRecord(rec)}
                        className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between shadow-xs ${
                          isActive
                            ? 'bg-slate-900 text-white border-slate-900 dark:bg-slate-100 dark:text-slate-900 dark:border-slate-100'
                            : 'bg-white dark:bg-slate-900 border-emerald-200 dark:border-emerald-900/50 hover:border-emerald-300'
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold">
                              {formatNigerianPhone(rec.phone)}
                            </span>
                            <span className="text-[10px] text-slate-400">{timeAgo}</span>
                          </div>
                          <p className={`text-xs ${isActive ? 'text-slate-300 dark:text-slate-600' : 'text-slate-500'}`}>
                            Ready for follow-up name entry
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setAbandoningId(rec.id); }}
                          className={`p-2 rounded-xl transition-colors ${isActive ? 'hover:bg-white/10 text-rose-300' : 'hover:bg-rose-50 text-rose-500'}`}
                          title="Abandon"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* SECTION 2: Needs phone */}
            {pendingRecords.length > 0 && (
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                    Needs Phone ({pendingRecords.length})
                  </h3>
                </div>
                <div className="space-y-2">
                  {pendingRecords.map(rec => {
                    const isActive = activeRecordId === rec.id;
                    const timeAgo = getTimeAgo(rec.tappedAt || rec.wonAt);
                    return (
                      <div
                        key={rec.id}
                        onClick={() => handleSelectRecord(rec)}
                        className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between shadow-xs ${
                          isActive
                            ? 'bg-slate-900 text-white border-slate-900 dark:bg-slate-100 dark:text-slate-900 dark:border-slate-100'
                            : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-slate-300'
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
                              Bare Tap
                            </span>
                            <span className="text-[10px] text-slate-400">{timeAgo}</span>
                          </div>
                          <p className={`text-xs ${isActive ? 'text-slate-300 dark:text-slate-600' : 'text-slate-500'}`}>
                            No phone attached yet
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setAbandoningId(rec.id); }}
                          className={`p-2 rounded-xl transition-colors ${isActive ? 'hover:bg-white/10 text-rose-300' : 'hover:bg-rose-50 text-rose-500'}`}
                          title="Abandon"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Active Reconcile Form */}
          <div className="lg:col-span-2">
            {activeRecord ? (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xs space-y-5">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <User className="w-4 h-4" style={{ color: palette.hex }} />
                      {activeRecord.phone ? 'Add Convert Name & Locality' : 'Reconcile Tap Record'}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Tapped at {new Date(activeRecord.tappedAt || activeRecord.wonAt).toLocaleString()}
                    </p>
                  </div>
                  <span className={`text-[10px] font-mono px-2.5 py-1 rounded-full border ${
                    activeRecord.phone ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}>
                    {activeRecord.phone ? 'Has Phone' : 'Needs Phone'}
                  </span>
                </div>

                <form onSubmit={handleSaveAndNext} className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="block font-semibold text-slate-700 dark:text-slate-300">First Name *</label>
                      <input
                        type="text"
                        placeholder="e.g. Samuel"
                        value={firstName}
                        onChange={e => setFirstName(e.target.value)}
                        autoFocus={!!activeRecord.phone}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block font-semibold text-slate-700 dark:text-slate-300">Last Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Adebayo"
                        value={lastName}
                        onChange={e => setLastName(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="block font-semibold text-slate-700 dark:text-slate-300">Phone Number *</label>
                      <input
                        type="tel"
                        placeholder="08030000000"
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                        autoFocus={!activeRecord.phone}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl px-3.5 py-2.5 text-xs font-mono focus:outline-none"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block font-semibold text-slate-700 dark:text-slate-300">Locality / Community *</label>
                      <select
                        value={locality}
                        onChange={e => setLocality(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-xl px-3 py-2.5 text-xs focus:outline-none cursor-pointer"
                        required
                      >
                        {LOCALITIES.map(l => (
                          <option key={l.name} value={l.name}>
                            {l.name} ({l.areaCouncil})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Collapsible More Details */}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => setShowMoreDetails(!showMoreDetails)}
                      className="text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1.5 cursor-pointer hover:underline"
                    >
                      <span>{showMoreDetails ? 'Hide optional details' : '+ Add more details (Gender, Age, Decision, Notes)'}</span>
                      {showMoreDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>

                    {showMoreDetails && (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t border-slate-100 dark:border-slate-800 mt-2">
                        <div className="space-y-1">
                          <label className="block font-semibold text-slate-700 dark:text-slate-300">Gender</label>
                          <select
                            value={gender}
                            onChange={e => setGender(e.target.value as Gender)}
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs"
                          >
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="other">Other</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="block font-semibold text-slate-700 dark:text-slate-300">Age Bracket</label>
                          <select
                            value={ageBracket}
                            onChange={e => setAgeBracket(e.target.value as AgeBracket)}
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs"
                          >
                            <option value="child">Child (Under 12)</option>
                            <option value="youth">Youth (13-25)</option>
                            <option value="adult">Adult (26-59)</option>
                            <option value="senior">Senior (60+)</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="block font-semibold text-slate-700 dark:text-slate-300">Decision Type</label>
                          <select
                            value={decisionType}
                            onChange={e => setDecisionType(e.target.value as DecisionType)}
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs"
                          >
                            <option value="new_convert">New Convert</option>
                            <option value="rededication">Rededication</option>
                            <option value="returnee">Returnee</option>
                          </select>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
                    <button
                      type="submit"
                      className={`px-6 py-3 rounded-xl font-bold text-xs flex items-center gap-2 shadow-xs cursor-pointer ${palette.btnPrimary}`}
                    >
                      <span>Save & Next Record</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </form>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Abandon Modal */}
      {abandoningId && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 text-rose-600">
              <Trash2 className="w-4 h-4" /> Mark Tap Record as Abandoned
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Please specify why this tap record is being abandoned.
            </p>

            <form onSubmit={handleConfirmAbandon} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="block font-semibold text-slate-700 dark:text-slate-300">Reason for Abandoning *</label>
                <input
                  type="text"
                  placeholder="e.g. Accidental double tap / Duplicate entry"
                  value={abandonReason}
                  onChange={e => setAbandonReason(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAbandoningId(null)}
                  className="px-4 py-2 rounded-xl font-semibold text-slate-600 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl font-bold text-xs bg-rose-600 hover:bg-rose-700 text-white shadow-xs cursor-pointer"
                >
                  Confirm Abandon
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
