import React, { useState, useEffect } from 'react';
import { dataService } from '../services/dataService';
import { DecisionType, SoulRecord } from '../types';
import { useTheme } from '../context/ThemeContext';
import {
  Flame,
  Plus,
  Sparkles,
  Building2,
  Users,
  CheckCircle2,
  Clock,
  User,
  Phone,
  MapPin,
  Mail,
  ArrowRight,
  FileCheck2,
  ListFilter,
} from 'lucide-react';
import { validateAndNormalizeNigerianPhone } from '../utils/phoneUtils';

interface TallyScreenProps {
  theme?: 'dark' | 'light';
  onSuccessToast: (title: string, message: string) => void;
  onNavigateToReconcile: () => void;
}

export const TallyScreen: React.FC<TallyScreenProps> = ({
  onSuccessToast,
  onNavigateToReconcile,
}) => {
  const { palette } = useTheme();
  const centres = dataService.getCentres().filter(c => c.active);
  const profile = dataService.getSoulWinnerProfile();

  const [selectedCentreId, setSelectedCentreId] = useState<string>(
    profile.churchCentreId || centres[0]?.id || 'cnt-amac-01'
  );
  const [decisionType, setDecisionType] = useState<DecisionType>('new_convert');
  const [sessionTally, setSessionTally] = useState<number>(0);
  const [viewTab, setViewTab] = useState<'pending' | 'reconciled'>('pending');

  // Quick Inline Reconcile Modal
  const [reconcilingRecord, setReconcilingRecord] = useState<SoulRecord | null>(null);
  const [recFullName, setRecFullName] = useState<string>('');
  const [recPhone, setRecPhone] = useState<string>('+234 803 ');
  const [recEmail, setRecEmail] = useState<string>('');
  const [recArea, setRecArea] = useState<string>('');
  const [recPhoneError, setRecPhoneError] = useState<string | null>(null);

  // Load records
  const [allTapRecords, setAllTapRecords] = useState<SoulRecord[]>([]);

  const refreshRecords = () => {
    const records = dataService.getSoulRecords().filter(r => r.captureMethod === 'tap');
    setAllTapRecords(records);
  };

  useEffect(() => {
    refreshRecords();
    const unsub = dataService.subscribe(refreshRecords);
    return () => unsub();
  }, []);

  const pendingRecords = allTapRecords.filter(r => r.reconcileStatus === 'pending');
  const reconciledRecords = allTapRecords.filter(r => r.reconcileStatus === 'complete');

  const handleTap = () => {
    const result = dataService.recordSoulTap(
      {
        centreId: selectedCentreId,
        userId: profile.id || 'soul-winner-local',
        userName: profile.fullName || 'Evangelist',
        winnerCell: profile.cellName,
        winnerPcf: profile.pcfName, // Inherited from Soul Winner!
        winnerPhone: profile.phone,
        decisionType,
      },
      'soul_winner'
    );

    if (result.success) {
      setSessionTally(prev => prev + 1);
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(40);
      }
      refreshRecords();
    }
  };

  const handleQuickAdd = (num: number) => {
    for (let i = 0; i < num; i++) {
      dataService.recordSoulTap(
        {
          centreId: selectedCentreId,
          userId: profile.id || 'soul-winner-local',
          userName: profile.fullName || 'Evangelist',
          winnerCell: profile.cellName,
          winnerPcf: profile.pcfName,
          winnerPhone: profile.phone,
          decisionType,
        },
        'soul_winner'
      );
    }
    setSessionTally(prev => prev + num);
    onSuccessToast('Batch Tallied', `Added ${num} souls to live counter.`);
    refreshRecords();
  };

  const openReconcileModal = (record: SoulRecord) => {
    setReconcilingRecord(record);
    setRecFullName(record.firstName ? `${record.firstName} ${record.lastName || ''}`.trim() : '');
    setRecPhone(record.phone && record.phone !== '+234 800 000 0000' ? record.phone : '+234 803 ');
    setRecEmail(record.email || '');
    setRecArea(record.outreachSpot || record.community || '');
    setRecPhoneError(null);
  };

  const handleSaveReconcile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reconcilingRecord || !recFullName.trim()) return;

    const phoneValidation = validateAndNormalizeNigerianPhone(recPhone);
    if (!phoneValidation.isValid) {
      setRecPhoneError(
        phoneValidation.error || 'Please enter a valid Nigerian mobile phone number.'
      );
      return;
    }

    const nameParts = recFullName.trim().split(/\s+/);
    const firstName = nameParts[0] || 'Convert';
    const lastName = nameParts.slice(1).join(' ') || '';

    const res = dataService.reconcileSoulRecord(
      reconcilingRecord.id,
      {
        firstName,
        lastName,
        phone: phoneValidation.normalized,
        email: recEmail.trim() || undefined,
        community: recArea.trim() || 'Abuja Central',
        outreachSpot: recArea.trim() || undefined,
        winnerPcf: profile.pcfName, // Inherited from Soul Winner!
      },
      profile.fullName || 'Evangelist',
      'soul_winner'
    );

    if (res.success) {
      onSuccessToast('Soul Reconciled', `${recFullName.trim()} successfully recorded with PCF: ${profile.pcfName || 'Assigned'}.`);
      setReconcilingRecord(null);
      refreshRecords();
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      {/* Top Counter Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xs text-center space-y-5">
        <div className="space-y-1">
          <span className="text-[10px] uppercase font-black tracking-widest text-slate-400">
            Street Evangelism & Crusade Counter
          </span>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">
            Tap to Tally Souls
          </h1>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Instant counting for field outreach. Taps are automatically linked to your PCF (
            <strong className="text-indigo-600 dark:text-indigo-400">{profile.pcfName || 'Haven PCF'}</strong>
            ).
          </p>
        </div>

        {/* Hub / Centre Picker */}
        <div className="inline-flex items-center gap-2 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 px-3.5 py-1.5 rounded-xl">
          <Building2 className="w-4 h-4 text-slate-400" />
          <span className="font-semibold text-slate-500">Hub:</span>
          <select
            value={selectedCentreId}
            onChange={e => setSelectedCentreId(e.target.value)}
            className="bg-transparent text-slate-900 dark:text-white font-bold cursor-pointer focus:outline-none"
          >
            {centres.map(c => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.code})
              </option>
            ))}
          </select>
        </div>

        {/* Decision Toggle */}
        <div className="flex justify-center gap-2">
          {(
            [
              { id: 'new_convert', label: 'New Convert' },
              { id: 'rededication', label: 'Rededication' },
              { id: 'returnee', label: 'Returnee' },
            ] as const
          ).map(d => (
            <button
              key={d.id}
              onClick={() => setDecisionType(d.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                decisionType === d.id
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>

        {/* Giant Interactive Tap Button */}
        <div className="py-4 flex flex-col items-center">
          <button
            onClick={handleTap}
            className="w-48 h-48 sm:w-56 sm:h-56 rounded-full flex flex-col items-center justify-center shadow-2xl active:scale-95 transition-transform duration-100 cursor-pointer select-none ring-8 ring-amber-400/20"
            style={{ backgroundColor: palette.hex }}
          >
            <Flame className="w-12 h-12 text-white animate-bounce" />
            <span className="text-4xl sm:text-5xl font-black text-white mt-1 font-mono">
              +{sessionTally}
            </span>
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-white/90 mt-1">
              TAP +1 SOUL
            </span>
          </button>
        </div>

        {/* Quick Batch Addition */}
        <div className="flex items-center justify-center gap-2 pt-1">
          <button
            onClick={() => handleQuickAdd(5)}
            className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-colors cursor-pointer"
          >
            +5 Souls
          </button>
          <button
            onClick={() => handleQuickAdd(10)}
            className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-colors cursor-pointer"
          >
            +10 Souls
          </button>
          <button
            onClick={() => handleQuickAdd(25)}
            className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-colors cursor-pointer"
          >
            +25 Souls
          </button>
        </div>
      </div>

      {/* Tallied vs Reconciled Summary & Records List */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
        {/* Tab Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ListFilter className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Tally Status Registry</span>
            </h3>
            <p className="text-[11px] text-slate-500">
              Clear breakdown of tallied street records and reconciled names.
            </p>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setViewTab('pending')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewTab === 'pending'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Untallied / Pending ({pendingRecords.length})</span>
            </button>
            <button
              onClick={() => setViewTab('reconciled')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewTab === 'reconciled'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Reconciled ({reconciledRecords.length})</span>
            </button>
          </div>
        </div>

        {/* Tab 1: Untallied / Pending Records */}
        {viewTab === 'pending' && (
          <div className="space-y-3">
            {pendingRecords.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  All Taps Are Reconciled!
                </p>
                <p className="text-[11px] text-slate-400">
                  No pending anonymous taps. Tap the big button above when on the field to start counting.
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                {pendingRecords.map((record, idx) => (
                  <div
                    key={record.id}
                    className="p-3.5 rounded-xl border border-amber-200/80 dark:border-amber-900/50 bg-amber-50/40 dark:bg-amber-950/20 flex items-center justify-between gap-3"
                  >
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900 dark:text-white">
                          Tap #{pendingRecords.length - idx}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-200 font-bold uppercase">
                          {record.decisionType.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        Tapped at {new Date(record.wonAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })} • PCF: {record.winnerPcf || profile.pcfName || 'Haven PCF'}
                      </p>
                    </div>

                    <button
                      onClick={() => openReconcileModal(record)}
                      className="px-3 py-1.5 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-bold text-xs flex items-center gap-1.5 shrink-0 shadow-xs cursor-pointer hover:opacity-90 transition-opacity"
                    >
                      <span>Reconcile Details</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Reconciled Records */}
        {viewTab === 'reconciled' && (
          <div className="space-y-3">
            {reconciledRecords.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <Clock className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  No Reconciled Tap Records Yet
                </p>
                <p className="text-[11px] text-slate-400">
                  Attach names and phone numbers to your field taps to populate this list.
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                {reconciledRecords.map((record) => (
                  <div
                    key={record.id}
                    className="p-3.5 rounded-xl border border-emerald-200/80 dark:border-emerald-900/50 bg-emerald-50/40 dark:bg-emerald-950/20 flex items-center justify-between gap-3"
                  >
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900 dark:text-white">
                          {record.firstName} {record.lastName}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 font-bold">
                          {record.phone}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        Met at: {record.outreachSpot || record.community || 'Abuja'} • PCF: {record.winnerPcf || profile.pcfName || 'Haven PCF'}
                      </p>
                    </div>

                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 shrink-0">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Reconciled
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Simplified Inline Reconcile Modal */}
      {reconcilingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl animate-scale-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Reconcile Tap Soul
                </h3>
              </div>
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                PCF: {profile.pcfName || 'Haven PCF'}
              </span>
            </div>

            <p className="text-xs text-slate-500">
              Provide convert details to complete this tapped soul record.
            </p>

            <form onSubmit={handleSaveReconcile} className="space-y-3.5">
              {/* Name */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Convert's Name *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Emmanuel Chukwuemeka"
                    value={recFullName}
                    onChange={e => setRecFullName(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl pl-9 pr-3 py-2 text-xs focus:outline-none"
                  />
                </div>
              </div>

              {/* Phone */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Phone Number *
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. 0803 123 4567 or +234 806 234 5678"
                    value={recPhone}
                    onChange={e => {
                      setRecPhone(e.target.value);
                      if (recPhoneError) setRecPhoneError(null);
                    }}
                    className={`w-full bg-slate-50 dark:bg-slate-950 border text-slate-900 dark:text-white rounded-xl pl-9 pr-3 py-2 text-xs font-mono focus:outline-none ${
                      recPhoneError ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'
                    }`}
                  />
                </div>
                {recPhoneError && (
                  <p className="text-[11px] text-rose-500">{recPhoneError}</p>
                )}
              </div>

              {/* Optional Email */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Email Address
                  </label>
                  <span className="text-[10px] text-slate-400">Optional</span>
                </div>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    placeholder="e.g. convert@example.com"
                    value={recEmail}
                    onChange={e => setRecEmail(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl pl-9 pr-3 py-2 text-xs focus:outline-none"
                  />
                </div>
              </div>

              {/* Area Met */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Where You Met Them (Area / Street) *
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Berger Roundabout, Wuse 2, Banex"
                    value={recArea}
                    onChange={e => setRecArea(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl pl-9 pr-3 py-2 text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReconcilingRecord(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-black bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer"
                >
                  Save & Reconcile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
