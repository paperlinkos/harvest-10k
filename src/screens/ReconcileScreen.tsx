import React, { useState, useEffect } from 'react';
import { dataService } from '../services/dataService';
import { SoulRecord } from '../types';
import { useTheme } from '../context/ThemeContext';
import {
  FileEdit,
  CheckCircle2,
  Clock,
  User,
  Phone,
  MapPin,
  ArrowLeft,
  Sparkles,
  Mail,
  AlertTriangle,
} from 'lucide-react';
import { validateAndNormalizeNigerianPhone } from '../utils/phoneUtils';

interface ReconcileScreenProps {
  theme?: 'dark' | 'light';
  onSuccessToast: (title: string, message: string) => void;
  onNavigateToTally: () => void;
}

export const ReconcileScreen: React.FC<ReconcileScreenProps> = ({
  onSuccessToast,
  onNavigateToTally,
}) => {
  const { palette } = useTheme();
  const profile = dataService.getSoulWinnerProfile();
  const [unreconciled, setUnreconciled] = useState<SoulRecord[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<SoulRecord | null>(null);

  // Simplified Form Fields
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('+234 803 ');
  const [email, setEmail] = useState('');
  const [areaMet, setAreaMet] = useState('');
  const [phoneError, setPhoneError] = useState<string | null>(null);

  const refreshList = () => {
    const list = dataService
      .getSoulRecords()
      .filter(r => r.captureMethod === 'tap' && r.reconcileStatus === 'pending');
    setUnreconciled(list);
    if (!selectedRecord && list.length > 0) {
      setSelectedRecord(list[0]);
    }
  };

  useEffect(() => {
    refreshList();
    const unsub = dataService.subscribe(refreshList);
    return unsub;
  }, []);

  useEffect(() => {
    if (selectedRecord) {
      setFullName(selectedRecord.firstName ? `${selectedRecord.firstName} ${selectedRecord.lastName || ''}`.trim() : '');
      setPhone(selectedRecord.phone && selectedRecord.phone !== '+234 800 000 0000' ? selectedRecord.phone : '+234 803 ');
      setEmail(selectedRecord.email || '');
      setAreaMet(selectedRecord.outreachSpot || selectedRecord.community || '');
      setPhoneError(null);
    }
  }, [selectedRecord]);

  const handleSubmitReconcile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecord || !fullName.trim()) return;

    const phoneValidation = validateAndNormalizeNigerianPhone(phone);
    if (!phoneValidation.isValid) {
      setPhoneError(phoneValidation.error || 'Please enter a valid Nigerian mobile phone number.');
      return;
    }

    const nameParts = fullName.trim().split(/\s+/);
    const firstName = nameParts[0] || 'Convert';
    const lastName = nameParts.slice(1).join(' ') || '';

    const result = dataService.reconcileSoulRecord(
      selectedRecord.id,
      {
        firstName,
        lastName,
        phone: phoneValidation.normalized,
        email: email.trim() || undefined,
        community: areaMet.trim() || 'Abuja Central',
        outreachSpot: areaMet.trim() || undefined,
        winnerPcf: profile.pcfName, // Inherited from Soul Winner!
      },
      profile.fullName || 'Evangelist',
      'soul_winner'
    );

    if (result.success) {
      onSuccessToast('Soul Reconciled', `${fullName.trim()} registered with PCF: ${profile.pcfName || 'Assigned'}.`);
      setSelectedRecord(null);
      refreshList();
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      {/* Top Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <button
            onClick={onNavigateToTally}
            className="text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 font-semibold mb-2 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Field Tally Counter</span>
          </button>
          <div className="flex items-center gap-2">
            <FileEdit className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h1 className="text-xl font-black text-slate-900 dark:text-white">
              Reconcile Tap Souls
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Attach convert names, phone numbers, and location details to your rapid street counts.
          </p>
        </div>

        <div className="bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-900/40 px-4 py-2.5 rounded-xl text-right">
          <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400 font-mono">
            {unreconciled.length}
          </span>
          <span className="text-[10px] uppercase font-bold text-slate-400 block">
            Untallied / Pending
          </span>
        </div>
      </div>

      {unreconciled.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-12 text-center space-y-3">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
          <h3 className="font-bold text-base text-slate-900 dark:text-white">
            All Taps Fully Reconciled!
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Every quick tap from your street evangelism session now has convert details recorded.
          </p>
          <button
            onClick={onNavigateToTally}
            className="px-4 py-2 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-bold text-xs cursor-pointer inline-flex items-center gap-1.5"
          >
            Go to Tally Counter
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* List of pending tap cards */}
          <div className="lg:col-span-5 space-y-3">
            <h4 className="text-xs font-bold uppercase text-slate-400">
              Pending Records ({unreconciled.length})
            </h4>
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {unreconciled.map((r, idx) => (
                <div
                  key={r.id}
                  onClick={() => setSelectedRecord(r)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                    selectedRecord?.id === r.id
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-transparent shadow-md'
                      : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:border-slate-400'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold">Tap #{unreconciled.length - idx}</span>
                    <span className="text-[10px] opacity-70 font-mono">
                      {new Date(r.wonAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="text-[11px] opacity-80 mt-1 flex items-center gap-2">
                    <span className="capitalize">{r.decisionType.replace('_', ' ')}</span>
                    <span>•</span>
                    <span>PCF: {r.winnerPcf || profile.pcfName || 'Haven PCF'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Form to reconcile selected record */}
          {selectedRecord && (
            <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>Reconcile Selected Tap</span>
                </h3>
                <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                  PCF: {profile.pcfName || 'Haven PCF'} (Auto)
                </span>
              </div>

              <form onSubmit={handleSubmitReconcile} className="space-y-3.5">
                {/* Full Name */}
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
                      value={fullName}
                      onChange={e => setFullName(e.target.value)}
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
                      value={phone}
                      onChange={e => {
                        setPhone(e.target.value);
                        if (phoneError) setPhoneError(null);
                      }}
                      className={`w-full bg-slate-50 dark:bg-slate-950 border text-slate-900 dark:text-white rounded-xl pl-9 pr-3 py-2 text-xs font-mono focus:outline-none ${
                        phoneError ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'
                      }`}
                    />
                  </div>
                  {phoneError && (
                    <p className="text-[11px] text-rose-500">{phoneError}</p>
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
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl pl-9 pr-3 py-2 text-xs focus:outline-none"
                    />
                  </div>
                </div>

                {/* Area Met */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Where You Met Them (Area / Location) *
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Berger Roundabout, Wuse 2, Banex"
                      value={areaMet}
                      onChange={e => setAreaMet(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl pl-9 pr-3 py-2 text-xs focus:outline-none"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl font-black text-white text-xs shadow-xs hover:opacity-90 transition-opacity cursor-pointer flex items-center justify-center gap-1.5"
                    style={{ backgroundColor: palette.hex }}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Save Reconciled Record</span>
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
