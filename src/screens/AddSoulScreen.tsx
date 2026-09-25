import React, { useState, useMemo, useEffect } from 'react';
import { dataService } from '../services/dataService';
import { DecisionType, UserRole, SoulRecord, SoulWinnerProfile } from '../types';
import { useTheme } from '../context/ThemeContext';
import { validateAndNormalizeNigerianPhone, formatNigerianPhone } from '../utils/phoneUtils';
import {
  UserPlus,
  Sparkles,
  Phone,
  MapPin,
  Building2,
  User,
  AlertTriangle,
  ShieldAlert,
  Mail,
  Users,
  WifiOff,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import { VerificationMessageModal } from '../components/VerificationMessageModal';

interface AddSoulScreenProps {
  userRole: UserRole;
  onSuccessToast: (title: string, message: string) => void;
  theme?: 'dark' | 'light';
}

const DUPLICATE_REASONS = [
  'Shared family or household mobile number',
  'Different convert using friend / evangelist phone',
  'Follow-up re-commitment in different Abuja Area Council',
  'SIM card reassigned / new phone owner in Abuja',
  'Special administrative exception',
];

export const AddSoulScreen: React.FC<AddSoulScreenProps> = ({
  userRole,
  onSuccessToast,
}) => {
  const { palette } = useTheme();
  const centres = dataService.getCentres().filter(c => c.active);

  const [centreId, setCentreId] = useState<string>(() => {
    const profile = dataService.getSoulWinnerProfile();
    const matchedCentre = centres.find(c => c.id === profile.churchCentreId);
    return matchedCentre?.id || centres[0]?.id || '';
  });

  const [soulWinnerProfile, setSoulWinnerProfile] = useState<SoulWinnerProfile>(() =>
    dataService.getSoulWinnerProfile()
  );
  const [wonByName, setWonByName] = useState<string>(() =>
    dataService.getSoulWinnerProfile().fullName || 'Evangelist Barnabas Danjuma'
  );
  const [winnerCell, setWinnerCell] = useState<string>(() =>
    dataService.getSoulWinnerProfile().cellName || 'Grace Cell'
  );
  const [winnerPcf, setWinnerPcf] = useState<string>(() =>
    dataService.getSoulWinnerProfile().pcfName || 'Haven PCF'
  );
  const [winnerPhone, setWinnerPhone] = useState<string>(() =>
    dataService.getSoulWinnerProfile().phone || ''
  );

  // Simplified Form Fields
  const [fullName, setFullName] = useState<string>('');
  const [phone, setPhone] = useState<string>('+234 803 ');
  const [email, setEmail] = useState<string>('');
  const [areaMet, setAreaMet] = useState<string>('');
  const [decisionType, setDecisionType] = useState<DecisionType>('new_convert');
  const [notes, setNotes] = useState<string>('');
  const [phoneError, setPhoneError] = useState<string | null>(null);

  // Duplicate state
  const [showDuplicateModal, setShowDuplicateModal] = useState<boolean>(false);
  const [duplicateReasonPreset, setDuplicateReasonPreset] = useState<string>(DUPLICATE_REASONS[0]);
  const [customDuplicateReason, setCustomDuplicateReason] = useState<string>('');

  // Online / Offline state
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  // Verification & Welcome Message Modal
  const [showVerificationModal, setShowVerificationModal] = useState<boolean>(false);
  const [newlySavedSoulRecord, setNewlySavedSoulRecord] = useState<SoulRecord | null>(null);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Sync profile when profile updates in context / local storage
  useEffect(() => {
    const syncProfile = () => {
      const p = dataService.getSoulWinnerProfile();
      setSoulWinnerProfile(p);
      setWonByName(p.fullName || wonByName);
      setWinnerCell(p.cellName || winnerCell);
      setWinnerPcf(p.pcfName || winnerPcf);
      setWinnerPhone(p.phone || winnerPhone);
    };
    const unsub = dataService.subscribe(syncProfile);
    return () => unsub();
  }, [wonByName, winnerCell, winnerPcf, winnerPhone]);

  // Live duplicate check
  const duplicateInfo = useMemo(() => {
    if (!phone || phone.trim().length < 8) return { isDuplicate: false };
    const check = dataService.findDuplicateByPhone(phone);
    if (!check.isDuplicate || !check.matchedRecord) return { isDuplicate: false };

    const c = dataService.getCentreById(check.matchedRecord.centreId);
    return {
      isDuplicate: true,
      centreName: c ? c.name : 'Abuja FCT Collation Hub',
      matchingRecord: check.matchedRecord,
    };
  }, [phone]);

  const handlePhoneChange = (val: string) => {
    setPhone(val);
    if (phoneError) setPhoneError(null);
  };

  const executeSaveRecord = async (overrideReason?: string) => {
    const targetCentre = centres.find(c => c.id === centreId);
    const centreName = targetCentre ? targetCentre.name : 'Collation Centre';

    const phoneValidation = validateAndNormalizeNigerianPhone(phone);
    const finalPhone = phoneValidation.isValid ? phoneValidation.normalized : phone.trim();

    // Parse Full Name into first name and optional last name
    const trimmedFullName = fullName.trim();
    const nameParts = trimmedFullName.split(/\s+/);
    const parsedFirstName = nameParts[0] || 'Convert';
    const parsedLastName = nameParts.slice(1).join(' ') || '';

    let savedSoulRecord: SoulRecord | null = null;

    if (!isOnline) {
      await dataService.queueOfflineSubmission({
        type: 'individual',
        centreId,
        centreName,
        wonByName: wonByName.trim() || 'Evangelist',
        userRole,
        summary: `${trimmedFullName} (${formatNigerianPhone(finalPhone)})`,
        individualPayload: {
          firstName: parsedFirstName,
          lastName: parsedLastName,
          phone: finalPhone,
          gender: 'male',
          ageBracket: 'youth',
          community: areaMet.trim() || 'Abuja Central District',
          decisionType,
          followUpChurch: 'Christ Embassy Abuja Zone 1',
          followUpStatus: 'not_started',
          consentGiven: true,
          notes: notes.trim(),
          duplicateOverrideReason: overrideReason,
          outreachSpot: areaMet.trim() || undefined,
          winnerPhone: winnerPhone.trim() || undefined,
          winnerCell: winnerCell.trim() || undefined,
          winnerPcf: winnerPcf.trim() || undefined, // Inherited from Soul Winner!
        },
      });

      savedSoulRecord = {
        id: `offline-${Date.now()}`,
        centreId,
        firstName: parsedFirstName,
        lastName: parsedLastName,
        phone: finalPhone,
        email: email.trim() || undefined,
        gender: 'male',
        ageBracket: 'youth',
        community: areaMet.trim() || 'Abuja Central District',
        decisionType,
        wonByName: wonByName.trim() || 'Evangelist',
        winnerPhone: winnerPhone.trim() || undefined,
        winnerCell: winnerCell.trim() || undefined,
        winnerPcf: winnerPcf.trim() || undefined, // Inherited from Soul Winner!
        followUpChurch: 'Christ Embassy Abuja Zone 1',
        followUpStatus: 'not_started',
        consentGiven: true,
        notes: notes.trim(),
        wonAt: new Date().toISOString(),
        status: 'pending',
        detailsPending: false,
        duplicateOverrideReason: overrideReason,
        outreachSpot: areaMet.trim() || undefined,
      };

      onSuccessToast(
        'Queued in Offline Storage',
        `${parsedFirstName} saved locally. Will auto-sync to central collation when online.`
      );
    } else {
      const res = dataService.addSoulRecord(
        {
          centreId,
          firstName: parsedFirstName,
          lastName: parsedLastName,
          phone: finalPhone,
          gender: 'male',
          ageBracket: 'youth',
          community: areaMet.trim() || 'Abuja Central District',
          decisionType,
          wonByName: wonByName.trim() || 'Evangelist',
          winnerPhone: winnerPhone.trim() || undefined,
          winnerCell: winnerCell.trim() || undefined,
          winnerPcf: winnerPcf.trim() || undefined, // Inherited from Soul Winner!
          followUpChurch: 'Christ Embassy Abuja Zone 1',
          followUpStatus: 'not_started',
          consentGiven: true,
          notes: notes.trim(),
          duplicateOverrideReason: overrideReason,
          outreachSpot: areaMet.trim() || undefined,
        },
        wonByName.trim(),
        userRole
      );

      if (res.success) {
        savedSoulRecord = dataService.getSoulRecordById(res.id) || null;
      }

      if (savedSoulRecord?.status === 'verified') {
        onSuccessToast(
          'Auto-Confirmed via Bulk SMS Gateway!',
          `${trimmedFullName} received carrier welcome SMS (${savedSoulRecord.smsCarrier || 'telecom network'}). Auto-confirmed in zone tally!`
        );
      } else {
        onSuccessToast(
          'Soul Recorded (Manual Audit Queue)',
          `SMS carrier unconfirmed: ${savedSoulRecord?.smsFailureReason || 'DND/Network Timeout'}. Placed in Manual Verification Queue.`
        );
      }
    }

    if (savedSoulRecord) {
      setNewlySavedSoulRecord(savedSoulRecord);
      // Open WhatsApp backup modal only if SMS delivery was unconfirmed
      if (savedSoulRecord.status !== 'verified') {
        setShowVerificationModal(true);
      }
    }

    // Reset Form
    setFullName('');
    setPhone('+234 803 ');
    setEmail('');
    setAreaMet('');
    setNotes('');
    setShowDuplicateModal(false);
    setCustomDuplicateReason('');
    setPhoneError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) return;

    const phoneValidation = validateAndNormalizeNigerianPhone(phone);
    if (!phoneValidation.isValid) {
      setPhoneError(
        phoneValidation.error ||
          'Please enter a valid Nigerian mobile phone number (e.g. 0803 123 4567 or +234 806 234 5678).'
      );
      return;
    }

    if (duplicateInfo.isDuplicate && duplicateInfo.matchingRecord) {
      setShowDuplicateModal(true);
      return;
    }

    executeSaveRecord();
  };

  const handleConfirmDuplicateOverride = () => {
    const finalReason =
      duplicateReasonPreset === 'Special administrative exception' && customDuplicateReason.trim()
        ? customDuplicateReason.trim()
        : duplicateReasonPreset;

    executeSaveRecord(finalReason);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 rounded-2xl shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <UserPlus className="w-5 h-5" style={{ color: palette.hex }} /> Record Won Soul
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Quick and simplified soul entry. Record convert details with live Nigerian phone validation.
            </p>
          </div>
        </div>
      </div>

      {/* Simplified Form */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xs space-y-5">
        {/* Offline Notice */}
        {!isOnline && (
          <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 p-3.5 rounded-xl flex items-center gap-3 text-amber-900 dark:text-amber-200 text-xs">
            <WifiOff className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 animate-pulse" />
            <p>
              <strong>Offline Mode:</strong> Form submissions will be saved locally on this device and synced when connected.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Soul Winner Details (Auto-Filled) */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/70 dark:border-slate-800 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-600 dark:text-slate-400 uppercase text-[10px] tracking-wider flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-indigo-500" /> Soul Winner Information
              </span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Auto-Linked
              </span>
            </div>
            <div className="text-slate-800 dark:text-slate-200 text-xs font-medium">
              <span>Soul Winner:</span> <strong>{wonByName}</strong>
            </div>
          </div>

          {/* Collation Hub / Centre */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Collation Hub / Centre *
            </label>
            <div className="relative">
              <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <select
                id="centre-select"
                value={centreId}
                onChange={e => setCentreId(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl pl-10 pr-3 py-2.5 text-xs font-medium focus:outline-none cursor-pointer"
                required
              >
                {centres.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Convert Full Name */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Convert's Name *
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                id="full-name-input"
                type="text"
                placeholder="e.g. Emmanuel Chukwuemeka"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl pl-10 pr-3 py-2.5 text-xs focus:outline-none"
                required
              />
            </div>
          </div>

          {/* Contact Phone Number */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Phone Number *
              </label>
              {duplicateInfo.isDuplicate && (
                <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> Duplicate Detected
                </span>
              )}
            </div>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                id="phone-input"
                type="text"
                placeholder="e.g. 0803 123 4567 or +234 806 234 5678"
                value={phone}
                onChange={e => handlePhoneChange(e.target.value)}
                className={`w-full bg-slate-50 dark:bg-slate-950 border text-slate-900 dark:text-slate-100 rounded-xl pl-10 pr-3 py-2.5 text-xs font-mono focus:outline-none transition-colors ${
                  phoneError
                    ? 'border-rose-500 bg-rose-50/40 dark:bg-rose-950/20'
                    : duplicateInfo.isDuplicate
                    ? 'border-amber-400 dark:border-amber-600/80 bg-amber-50/40 dark:bg-amber-950/20'
                    : 'border-slate-200 dark:border-slate-800'
                }`}
                required
              />
            </div>
            {phoneError && (
              <p className="text-xs text-rose-500 font-medium flex items-center gap-1 pt-0.5">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>{phoneError}</span>
              </p>
            )}
          </div>

          {/* Optional Email */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Email Address
              </label>
              <span className="text-[10px] text-slate-400">Optional</span>
            </div>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                id="email-input"
                type="email"
                placeholder="e.g. emmanuel@example.com (optional)"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl pl-10 pr-3 py-2.5 text-xs focus:outline-none"
              />
            </div>
          </div>

          {/* Area / Where You Met Them */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Where You Met Them (Area / Location) *
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                id="area-met-input"
                type="text"
                placeholder="e.g. Berger Roundabout, Wuse 2, Banex Plaza, Lugbe, Kubwa Market"
                value={areaMet}
                onChange={e => setAreaMet(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl pl-10 pr-3 py-2.5 text-xs focus:outline-none"
                required
              />
            </div>
          </div>

          {/* Decision Nature */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Decision Nature
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'new_convert', label: 'New Convert' },
                { id: 'rededication', label: 'Rededication' },
                { id: 'returnee', label: 'Returnee' },
              ].map(item => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setDecisionType(item.id as DecisionType)}
                  className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    decisionType === item.id
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Optional Remarks / Prayer Request */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Prayer Request / Remarks (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Desires Holy Ghost baptism, student in Abuja"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl p-3 text-xs focus:outline-none"
            />
          </div>

          {/* Submit Button */}
          <div className="pt-3">
            <button
              id="submit-soul-btn"
              type="submit"
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-black text-white text-sm shadow-md hover:opacity-95 transition-all cursor-pointer"
              style={{ backgroundColor: palette.hex }}
            >
              <Sparkles className="w-4 h-4" />
              <span>Submit & Record Soul</span>
            </button>
          </div>
        </form>
      </div>

      {/* Duplicate Override Modal */}
      {showDuplicateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-xl">
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
              <ShieldAlert className="w-6 h-6 shrink-0" />
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Duplicate Phone Detected
              </h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              This phone number ({phone}) already exists in the campaign registry. Select an exception reason to proceed:
            </p>
            <div className="space-y-2">
              {DUPLICATE_REASONS.map(reason => (
                <label
                  key={reason}
                  className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer"
                >
                  <input
                    type="radio"
                    name="dup-reason"
                    checked={duplicateReasonPreset === reason}
                    onChange={() => setDuplicateReasonPreset(reason)}
                    className="accent-amber-600"
                  />
                  <span>{reason}</span>
                </label>
              ))}
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDuplicateModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDuplicateOverride}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white cursor-pointer"
              >
                Proceed with Exception
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Verification Message Modal */}
      {showVerificationModal && newlySavedSoulRecord && (
        <VerificationMessageModal
          isOpen={showVerificationModal}
          onClose={() => {
            setShowVerificationModal(false);
            setNewlySavedSoulRecord(null);
          }}
          record={newlySavedSoulRecord}
          userRole={userRole}
          currentUserName={wonByName}
          onSuccessToast={onSuccessToast}
        />
      )}
    </div>
  );
};
