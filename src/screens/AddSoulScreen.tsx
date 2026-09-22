import React, { useState, useMemo, useEffect } from 'react';
import QRCode from 'qrcode';
import { dataService } from '../services/dataService';
import { DecisionType, Gender, AgeBracket, UserRole, SoulRecord, SoulWinnerProfile } from '../types';
import { useTheme } from '../context/ThemeContext';
import { validateAndNormalizeNigerianPhone, formatNigerianPhone } from '../utils/phoneUtils';
import {
  UserPlus,
  Layers,
  Sparkles,
  CheckCircle2,
  Phone,
  MapPin,
  Building2,
  Clock,
  User,
  AlertTriangle,
  ShieldAlert,
  ArrowRight,
  X,
  FileCheck2,
  WifiOff,
  Database,
  CloudOff,
  Church,
  Home,
  Navigation,
} from 'lucide-react';
import { AreaCouncilCode, areaCouncilOf, LOCALITIES } from '../data/fctLocations';

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

const FOLLOW_UP_CHURCHES = [
  'Dunamis International Gospel Centre (Glory Dome)',
  'Living Faith Church (Winners Chapel Durumi / Jahi)',
  'The Redeemed Christian Church of God (RCCG Central Parish)',
  'House on the Rock (The Refuge Abuja)',
  'Family Worship Centre (FWC Wuye)',
  'ECWA Wuse II',
  'Commonwealth of Zion Assembly (COZA Guzape)',
  'Catholic Archdiocese of Abuja (Our Lady Queen of Nigeria)',
  'Mountain of Fire and Miracles Ministries (MFM Utako)',
  'Assemblies of God Central Hub',
];

export const AddSoulScreen: React.FC<AddSoulScreenProps> = ({
  userRole,
  onSuccessToast,
}) => {
  const { palette } = useTheme();
  const centres = dataService.getCentres().filter(c => c.active);
  const campaign = dataService.getCampaign();
  const recentRecords = dataService.getSoulRecords().slice(0, 5);

  const [mode, setMode] = useState<'individual' | 'bulk'>('individual');
  const [centreId, setCentreId] = useState<string>(() => {
    const profile = dataService.getSoulWinnerProfile();
    const matchedCentre = centres.find(c => c.id === profile.churchCentreId);
    return matchedCentre?.id || centres[0]?.id || '';
  });
  const [wonByName, setWonByName] = useState<string>(() => dataService.getSoulWinnerProfile().fullName || 'Evangelist Barnabas Danjuma');
  const [winnerCell, setWinnerCell] = useState<string>(() => dataService.getSoulWinnerProfile().cellName || '');
  const [winnerPcf, setWinnerPcf] = useState<string>(() => dataService.getSoulWinnerProfile().pcfName || '');
  const [winnerPhone, setWinnerPhone] = useState<string>(() => dataService.getSoulWinnerProfile().phone || '');
  const [soulWinnerProfile, setSoulWinnerProfile] = useState<SoulWinnerProfile>(() => dataService.getSoulWinnerProfile());

  // Individual Form fields
  const [firstName, setFirstName] = useState<string>('');
  const [lastName, setLastName] = useState<string>('');
  const [phone, setPhone] = useState<string>('+234 803 ');
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [gender, setGender] = useState<Gender>('male');
  const [ageBracket, setAgeBracket] = useState<AgeBracket>('youth');
  const [decisionType, setDecisionType] = useState<DecisionType>('new_convert');
  const [community, setCommunity] = useState<string>('Abuja Central');
  const [followUpChurch, setFollowUpChurch] = useState<string>(FOLLOW_UP_CHURCHES[0]);
  const [notes, setNotes] = useState<string>('');

  // WHERE WON VS WHERE CONVERT LIVES
  const [outreachSpot, setOutreachSpot] = useState<string>('');
  const [residentialAreaCouncil, setResidentialAreaCouncil] = useState<AreaCouncilCode | 'OTHER'>('AMAC');
  const [residentialDistrict, setResidentialDistrict] = useState<string>('Lugbe (Airport Road)');
  const [residentialAddress, setResidentialAddress] = useState<string>('');

  // Duplicate Warning & Modal state
  const [showDuplicateModal, setShowDuplicateModal] = useState<boolean>(false);
  const [duplicateReasonPreset, setDuplicateReasonPreset] = useState<string>(DUPLICATE_REASONS[0]);
  const [customDuplicateReason, setCustomDuplicateReason] = useState<string>('');

  // Online / Offline state
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);

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

  // Re-sync soul winner profile on focus (in case user changed profile in modal while on this screen)
  useEffect(() => {
    const syncProfile = () => {
      const p = dataService.getSoulWinnerProfile();
      setSoulWinnerProfile(p);
      setWonByName(p.fullName || wonByName);
      setWinnerCell(p.cellName || '');
      setWinnerPcf(p.pcfName || '');
      setWinnerPhone(p.phone || '');
    };
    const unsub = dataService.subscribe(syncProfile);
    return () => unsub();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Bulk Form fields
  const [sessionLabel, setSessionLabel] = useState<string>('Afternoon Street Outreach');
  const [newConverts, setNewConverts] = useState<number>(7);
  const [rededications, setRededications] = useState<number>(2);
  const [returnees, setReturnees] = useState<number>(1);
  const [sessionNote, setSessionNote] = useState<string>('Abuja street ministry outreach');

  // Live duplicate detection
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

  const executeSaveIndividualRecord = async (overrideReason?: string) => {
    const targetCentre = centres.find(c => c.id === centreId);
    const centreName = targetCentre ? targetCentre.name : 'Collation Centre';

    const phoneValidation = validateAndNormalizeNigerianPhone(phone);
    const finalPhone = phoneValidation.isValid ? phoneValidation.normalized : phone.trim();

    if (!isOnline) {
      // Offline mode: save directly to browser's IndexedDB
      await dataService.queueOfflineSubmission({
        type: 'individual',
        centreId,
        centreName,
        wonByName: wonByName.trim() || 'Evangelist',
        userRole,
        summary: `${firstName.trim()} ${lastName.trim() || ''} (${formatNigerianPhone(finalPhone)})`,
        individualPayload: {
          firstName: firstName.trim(),
          lastName: lastName.trim() || 'Convert',
          phone: finalPhone,
          gender,
          ageBracket,
          community: community.trim() || 'Abuja Central District',
          decisionType,
          followUpChurch: followUpChurch || FOLLOW_UP_CHURCHES[0],
          followUpStatus: 'not_started',
          consentGiven: true,
          notes: notes.trim(),
          duplicateOverrideReason: overrideReason,
          outreachSpot: outreachSpot.trim() || undefined,
          residentialAreaCouncil,
          residentialDistrict: residentialDistrict.trim() || undefined,
          residentialAddress: residentialAddress.trim() || undefined,
          winnerPhone: winnerPhone.trim() || undefined,
          winnerCell: winnerCell.trim() || undefined,
          winnerPcf: winnerPcf.trim() || undefined,
        },
      });

      onSuccessToast(
        'Queued in IndexedDB (Offline)',
        `${firstName.trim()} saved locally. Will automatically transmit to central Abuja collation upon internet restoration.`
      );
    } else {
      // Online mode: direct commit
      dataService.addSoulRecord(
        {
          centreId,
          firstName: firstName.trim(),
          lastName: lastName.trim() || 'Convert',
          phone: finalPhone,
          gender,
          ageBracket,
          community: community.trim() || 'Abuja Central District',
          decisionType,
          wonByName: wonByName.trim() || 'Evangelist',
          winnerPhone: winnerPhone.trim() || undefined,
          winnerCell: winnerCell.trim() || undefined,
          winnerPcf: winnerPcf.trim() || undefined,
          followUpChurch: followUpChurch || FOLLOW_UP_CHURCHES[0],
          followUpStatus: 'not_started',
          consentGiven: true,
          notes: notes.trim(),
          duplicateOverrideReason: overrideReason,
          outreachSpot: outreachSpot.trim() || undefined,
          residentialAreaCouncil,
          residentialDistrict: residentialDistrict.trim() || undefined,
          residentialAddress: residentialAddress.trim() || undefined,
        },
        wonByName.trim(),
        userRole
      );

      onSuccessToast(
        'Soul Recorded!',
        `${firstName.trim()} successfully recorded under ${centreName}${
          overrideReason ? ' (Duplicate Override noted in Audit Log)' : ''
        }.`
      );
    }

    // Reset fields
    setFirstName('');
    setLastName('');
    setPhone('+234 803 ');
    setNotes('');
    setOutreachSpot('');
    setResidentialAddress('');
    setShowDuplicateModal(false);
    setCustomDuplicateReason('');
    setPhoneError(null);
  };

  const timerState = dataService.getSessionTimer();
  const isSessionLocked = timerState.status === 'finished' && timerState.endBehaviour === 'lock_submissions' && !timerState.unlockedManually;

  const handleIndividualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSessionLocked) return;
    if (!firstName.trim()) return;

    // Validate Nigerian phone format
    const phoneValidation = validateAndNormalizeNigerianPhone(phone);
    if (!phoneValidation.isValid) {
      setPhoneError(
        phoneValidation.error ||
          'Please enter a valid Nigerian mobile phone number (e.g. 0803 123 4567, 0806 234 5678, or +234 813 456 7890).'
      );
      return;
    }

    // Check duplicate phone before saving
    if (duplicateInfo.isDuplicate && duplicateInfo.matchingRecord) {
      setShowDuplicateModal(true);
      return;
    }

    executeSaveIndividualRecord();
  };

  const handleConfirmDuplicateOverride = () => {
    const finalReason =
      duplicateReasonPreset === 'Special administrative exception' && customDuplicateReason.trim()
        ? customDuplicateReason.trim()
        : duplicateReasonPreset;

    executeSaveIndividualRecord(finalReason);
  };

  const handleBulkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const sum = Number(newConverts) + Number(rededications) + Number(returnees);
    const countToSubmit = sum > 0 ? sum : 10;
    const targetCentre = centres.find(c => c.id === centreId);
    const centreName = targetCentre ? targetCentre.name : 'Collation Centre';

    if (!isOnline) {
      // Offline mode: save directly to browser's IndexedDB
      await dataService.queueOfflineSubmission({
        type: 'bulk',
        centreId,
        centreName,
        wonByName: wonByName.trim() || 'Field Team',
        userRole,
        summary: `${sessionLabel.trim() || 'Outreach Outing'} (${countToSubmit} Souls)`,
        bulkPayload: {
          sessionLabel: sessionLabel.trim() || 'Evangelism Outing',
          count: countToSubmit,
          newConverts: Number(newConverts),
          rededications: Number(rededications),
          returnees: Number(returnees),
          note: sessionNote.trim(),
          winnerPhone: winnerPhone.trim() || undefined,
          winnerCell: winnerCell.trim() || undefined,
          winnerPcf: winnerPcf.trim() || undefined,
        },
      });

      onSuccessToast(
        'Batch Queued in IndexedDB (Offline)',
        `Batch report of ${countToSubmit} souls preserved in browser storage for auto-sync.`
      );
    } else {
      dataService.addBatch(
        {
          centreId,
          submittedByName: wonByName.trim() || 'Field Team',
          winnerPhone: winnerPhone.trim() || undefined,
          winnerCell: winnerCell.trim() || undefined,
          winnerPcf: winnerPcf.trim() || undefined,
          sessionLabel: sessionLabel.trim() || 'Evangelism Outing',
          count: countToSubmit,
          newConverts: Number(newConverts),
          rededications: Number(rededications),
          returnees: Number(returnees),
          note: sessionNote.trim(),
        },
        wonByName.trim(),
        userRole
      );

      onSuccessToast(
        'Batch Submitted!',
        `Batch report of ${countToSubmit} souls transmitted to central Abuja collation.`
      );
    }

    // Reset bulk form
    setNewConverts(5);
    setRededications(2);
    setReturnees(1);
    setSessionNote('');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Mode Switcher Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 rounded-2xl shadow-xs transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Sparkles className="w-5 h-5" style={{ color: palette.hex }} /> Record Harvest Decision
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Submit newly converted souls across the 6 FCT Area Councils with live Nigerian phone validation.
            </p>
          </div>

          {/* Toggle pill buttons */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              id="mode-individual-btn"
              onClick={() => setMode('individual')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                mode === 'individual'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" style={{ color: palette.hex }} />
              <span>Individual Soul</span>
            </button>

            <button
              id="mode-bulk-btn"
              onClick={() => setMode('bulk')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                mode === 'bulk'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-emerald-500" />
              <span>Batch Session (Crusade)</span>
            </button>
          </div>
        </div>
      </div>

      {/* FORM CONTAINER */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xs transition-colors space-y-6">
        {/* Session Closed Lock Banner */}
        {isSessionLocked && (
          <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 p-4 rounded-xl flex items-start gap-3 text-rose-900 dark:text-rose-200">
            <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5 text-xs">
              <p className="font-bold">Session Closed — Submissions Locked</p>
              <p className="text-rose-800/80 dark:text-rose-300/80">
                The campaign session timer has concluded and the administrator has locked new submissions. Approval queue remains active for coordinators.
              </p>
            </div>
          </div>
        )}

        {/* In-form Offline Notice */}
        {!isOnline && (
          <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 p-4 rounded-xl flex items-start gap-3 text-amber-900 dark:text-amber-200">
            <WifiOff className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5 animate-pulse" />
            <div className="space-y-0.5 text-xs">
              <p className="font-bold">Offline Field Harvest Mode Active</p>
              <p className="text-amber-800/80 dark:text-amber-300/80">
                Your device is currently disconnected. All submissions will be preserved in browser IndexedDB storage and automatically transmitted to the central collation database when internet connection is restored.
              </p>
            </div>
          </div>
        )}

        {mode === 'individual' ? (
          <form onSubmit={handleIndividualSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Collation Centre */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Collation Hub / Centre *
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <select
                    id="centre-select"
                    value={centreId}
                    onChange={e => setCentreId(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl pl-9 pr-3 py-2.5 text-xs focus:outline-none cursor-pointer"
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

              {/* Soul Winner Name */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Soul Winner / Evangelist *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    id="winner-name-input"
                    type="text"
                    placeholder="e.g. Evangelist Barnabas Danjuma"
                    value={wonByName}
                    onChange={e => setWonByName(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl pl-9 pr-3 py-2 text-xs focus:outline-none"
                    required
                  />
                </div>
                {/* Profile badges showing Cell and PCF */}
                <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                  {winnerCell && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                      🔵 {winnerCell}
                    </span>
                  )}
                  {winnerPcf && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                      🟣 {winnerPcf}
                    </span>
                  )}
                  {(soulWinnerProfile?.roleTitle) && (
                    <span className="inline-flex items-center text-[10px] text-slate-500 dark:text-slate-400">
                      · {soulWinnerProfile.roleTitle}
                    </span>
                  )}
                </div>
              </div>

              {/* First Name */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  First Name *
                </label>
                <input
                  id="first-name-input"
                  type="text"
                  placeholder="e.g. Emeka, Amina, Olumide"
                  value={firstName}
                  onChange={e => setFirstName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl px-3 py-2 text-xs focus:outline-none"
                  required
                />
              </div>

              {/* Last Name */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Last Name
                </label>
                <input
                  id="last-name-input"
                  type="text"
                  placeholder="e.g. Bello, Okafor, Danjuma"
                  value={lastName}
                  onChange={e => setLastName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl px-3 py-2 text-xs focus:outline-none"
                />
              </div>

              {/* Contact Phone (Nigerian Format) */}
              <div className="space-y-1.5 sm:col-span-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Nigerian Mobile Number (For Pastoral Care & Follow-Up) *
                  </label>
                  {duplicateInfo.isDuplicate && (
                    <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> Duplicate Detected
                    </span>
                  )}
                </div>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    id="phone-input"
                    type="text"
                    placeholder="e.g. 0803 123 4567 or +234 806 234 5678"
                    value={phone}
                    onChange={e => handlePhoneChange(e.target.value)}
                    className={`w-full bg-slate-50 dark:bg-slate-950 border text-slate-900 dark:text-slate-100 rounded-xl pl-9 pr-3 py-2 text-xs font-mono-tabular focus:outline-none transition-colors ${
                      phoneError
                        ? 'border-rose-500 bg-rose-50/40 dark:bg-rose-950/20 ring-1 ring-rose-500/50'
                        : duplicateInfo.isDuplicate
                        ? 'border-amber-400 dark:border-amber-600/80 bg-amber-50/40 dark:bg-amber-950/20 ring-1 ring-amber-400/50'
                        : 'border-slate-200 dark:border-slate-800'
                    }`}
                  />
                </div>

                {/* Inline Validation Error Message */}
                {phoneError && (
                  <p className="text-xs text-rose-500 dark:text-rose-400 font-medium flex items-center gap-1.5 pt-0.5">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>{phoneError}</span>
                  </p>
                )}

                {/* Inline Duplicate Warning Box */}
                {duplicateInfo.isDuplicate && duplicateInfo.matchingRecord && (
                  <div className="mt-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-2.5">
                    <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <div className="font-bold text-amber-800 dark:text-amber-300">
                        Phone number already registered in campaign!
                      </div>
                      <p className="text-[11px] text-amber-700 dark:text-amber-300/90 leading-relaxed">
                        Already exists under <strong className="font-semibold underline">{duplicateInfo.centreName}</strong> for convert{' '}
                        <strong>{duplicateInfo.matchingRecord.firstName} {duplicateInfo.matchingRecord.lastName}</strong> (evangelist: {duplicateInfo.matchingRecord.wonByName}).
                      </p>
                      <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                        You can still proceed with submission by providing an exception reason on save.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Decision Type */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Decision Nature *
                </label>
                <select
                  id="decision-select"
                  value={decisionType}
                  onChange={e => setDecisionType(e.target.value as DecisionType)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl px-3 py-2.5 text-xs focus:outline-none cursor-pointer"
                >
                  <option value="new_convert">New Convert (First Time Confession)</option>
                  <option value="rededication">Rededication / Renewal</option>
                  <option value="returnee">Returnee / Backslider Restoration</option>
                </select>
              </div>

              {/* Gender & Age Group */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Gender
                  </label>
                  <select
                    id="gender-select"
                    value={gender}
                    onChange={e => setGender(e.target.value as Gender)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl px-3 py-2.5 text-xs focus:outline-none cursor-pointer"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Age Group
                  </label>
                  <select
                    id="age-select"
                    value={ageBracket}
                    onChange={e => setAgeBracket(e.target.value as AgeBracket)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl px-3 py-2.5 text-xs focus:outline-none cursor-pointer"
                  >
                    <option value="child">Child (&lt;18)</option>
                    <option value="youth">Youth (18–35)</option>
                    <option value="adult">Adult (36–59)</option>
                    <option value="senior">Senior (60+)</option>
                  </select>
                </div>
              </div>

              {/* Assigned Follow-Up Church */}
              <div className="space-y-1.5 sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Assigned Discipleship / Follow-Up Church
                </label>
                <div className="relative">
                  <Church className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <select
                    id="church-select"
                    value={followUpChurch}
                    onChange={e => setFollowUpChurch(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl pl-9 pr-3 py-2.5 text-xs focus:outline-none cursor-pointer"
                  >
                    {FOLLOW_UP_CHURCHES.map((ch, idx) => (
                      <option key={idx} value={ch}>
                        {ch}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Outreach Spot / Street Landmark */}
              <div className="sm:col-span-2 space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Navigation className="w-3.5 h-3.5 text-amber-500" />
                    <span>Outreach Spot (Where Soul Was Won)</span>
                  </label>
                  <span className="text-[10px] text-slate-400">Bus stop, plaza, market or street</span>
                </div>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    id="outreach-spot-input"
                    type="text"
                    placeholder="e.g. Banex Plaza Pedestrian Walkway, Berger Roundabout, Kubwa Market"
                    value={outreachSpot}
                    onChange={e => {
                      setOutreachSpot(e.target.value);
                      setCommunity(e.target.value);
                    }}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl pl-9 pr-3 py-2 text-xs focus:outline-none"
                  />
                </div>
              </div>

              {/* CONVERT RESIDENTIAL ADDRESS & LIVING LOCATION */}
              <div className="sm:col-span-2 rounded-2xl border border-indigo-200/70 dark:border-indigo-900/50 bg-indigo-50/40 dark:bg-indigo-950/20 p-4 space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-indigo-600/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                      <Home className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        Where Convert Lives (Home Address & Neighborhood)
                      </h4>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">
                        Used for pastoral follow-up, home visitation & church bus route planning
                      </p>
                    </div>
                  </div>
                </div>

                {/* Quick Pick Popular Residential Satellite Hubs */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Quick Pick Living Neighborhood:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { name: 'Lugbe (Airport Road)', council: 'AMAC' },
                      { name: 'Kubwa', council: 'BWARI' },
                      { name: 'Karu Site / Nyanya', council: 'AMAC' },
                      { name: 'Lokogoma', council: 'AMAC' },
                      { name: 'Gwarinpa Estate', council: 'AMAC' },
                      { name: 'Dutse-Alhaji', council: 'BWARI' },
                      { name: 'Gwagwalada Town', council: 'GWAGWALADA' },
                      { name: 'Kuje Town', council: 'KUJE' },
                      { name: 'Jabi / Utako', council: 'AMAC' },
                      { name: 'Bwari Central', council: 'BWARI' },
                    ].map(item => (
                      <button
                        key={item.name}
                        type="button"
                        onClick={() => {
                          setResidentialDistrict(item.name);
                          setResidentialAreaCouncil(item.council as AreaCouncilCode);
                        }}
                        className={`px-2 py-1 rounded-lg text-[10px] font-semibold transition-all cursor-pointer ${
                          residentialDistrict === item.name
                            ? 'bg-indigo-600 text-white shadow-xs font-bold'
                            : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-indigo-400'
                        }`}
                      >
                        {item.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {/* Residential Area Council */}
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                      Residential Area Council
                    </label>
                    <select
                      value={residentialAreaCouncil}
                      onChange={e => setResidentialAreaCouncil(e.target.value as any)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl px-3 py-2 text-xs focus:outline-none cursor-pointer"
                    >
                      <option value="AMAC">Abuja Municipal (AMAC)</option>
                      <option value="BWARI">Bwari Area Council</option>
                      <option value="GWAGWALADA">Gwagwalada Area Council</option>
                      <option value="KUJE">Kuje Area Council</option>
                      <option value="KWALI">Kwali Area Council</option>
                      <option value="ABAJI">Abaji Area Council</option>
                      <option value="OTHER">Neighboring (Mararaba / Suleja / Nasarawa)</option>
                    </select>
                  </div>

                  {/* Residential District / Neighborhood */}
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                      Neighborhood / District
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Lugbe, Kubwa, Apo, Nyanya, Gwarinpa"
                      value={residentialDistrict}
                      onChange={e => setResidentialDistrict(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl px-3 py-2 text-xs focus:outline-none"
                    />
                  </div>

                  {/* Street Address / Landmark */}
                  <div className="sm:col-span-2 space-y-1.5">
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                      Street Address & Nearest Landmark (For Home Visitation & Bus Stop)
                    </label>
                    <input
                      id="residential-address-input"
                      type="text"
                      placeholder="e.g. Flat 4, Block 8, Federal Housing Estate, Airport Road or Behind Total Station"
                      value={residentialAddress}
                      onChange={e => setResidentialAddress(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl px-3 py-2 text-xs focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Remarks */}
              <div className="sm:col-span-2 space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Prayer Request / Remarks
                </label>
                <textarea
                  id="notes-input"
                  rows={2}
                  placeholder="e.g. Desires baptism, available for follow-up Bible study on weekends"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl p-3 text-xs focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                id="submit-soul-btn"
                type="submit"
                className={`px-6 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shadow-xs transition-transform active:scale-98 cursor-pointer ${
                  duplicateInfo.isDuplicate
                    ? 'bg-amber-600 hover:bg-amber-700 text-white'
                    : !isOnline
                    ? 'bg-amber-600 hover:bg-amber-700 text-white'
                    : palette.btnPrimary
                }`}
              >
                {duplicateInfo.isDuplicate ? (
                  <>
                    <AlertTriangle className="w-4 h-4" />
                    <span>Review Duplicate & Save</span>
                  </>
                ) : !isOnline ? (
                  <>
                    <Database className="w-4 h-4" />
                    <span>Save Soul to Offline Queue (IndexedDB)</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Submit & Update Collation Total</span>
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          /* BULK BATCH SUBMISSION FORM */
          <form onSubmit={handleBulkSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Centre */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Collation Hub / Centre *
                </label>
                <select
                  id="bulk-centre-select"
                  value={centreId}
                  onChange={e => setCentreId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl px-3 py-2.5 text-xs focus:outline-none cursor-pointer"
                  required
                >
                  {centres.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Lead Evangelist */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Outreach Leader / Team *
                </label>
                <input
                  id="bulk-winner-input"
                  type="text"
                  placeholder="e.g. Evangelist Barnabas Danjuma"
                  value={wonByName}
                  onChange={e => setWonByName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl px-3 py-2 text-xs focus:outline-none"
                  required
                />
              </div>

              {/* Session Label */}
              <div className="sm:col-span-2 space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Session Outreach Label
                </label>
                <input
                  id="bulk-session-input"
                  type="text"
                  placeholder="e.g. Afternoon Market Ministry, Open-Air Crusade"
                  value={sessionLabel}
                  onChange={e => setSessionLabel(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl px-3 py-2 text-xs focus:outline-none"
                />
              </div>

              {/* Batch Breakdown Fields */}
              <div className="sm:col-span-2 bg-slate-50 dark:bg-slate-950/60 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-3">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider block">
                  Decision Breakdown Totals
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="block text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                      New Converts
                    </label>
                    <input
                      id="bulk-new-converts-input"
                      type="number"
                      min="0"
                      value={newConverts}
                      onChange={e => setNewConverts(Number(e.target.value))}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl px-3 py-2 text-xs font-mono-tabular font-bold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-semibold text-blue-600 dark:text-blue-400">
                      Rededications
                    </label>
                    <input
                      id="bulk-rededications-input"
                      type="number"
                      min="0"
                      value={rededications}
                      onChange={e => setRededications(Number(e.target.value))}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl px-3 py-2 text-xs font-mono-tabular font-bold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-semibold text-purple-600 dark:text-purple-400">
                      Returnees
                    </label>
                    <input
                      id="bulk-returnees-input"
                      type="number"
                      min="0"
                      value={returnees}
                      onChange={e => setReturnees(Number(e.target.value))}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl px-3 py-2 text-xs font-mono-tabular font-bold"
                    />
                  </div>
                </div>

                <div className="text-right text-xs font-mono-tabular text-slate-600 dark:text-slate-300 font-semibold pt-1">
                  Total in Batch:{' '}
                  <strong className="text-sm font-black" style={{ color: palette.hex }}>
                    {Number(newConverts) + Number(rededications) + Number(returnees)} Souls
                  </strong>
                </div>
              </div>

              {/* Outreach Session Remarks */}
              <div className="sm:col-span-2 space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Outreach Session Notes
                </label>
                <textarea
                  id="bulk-note-input"
                  rows={2}
                  placeholder="e.g. Crowd gathered around shopping complex entrance."
                  value={sessionNote}
                  onChange={e => setSessionNote(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl p-3 text-xs focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                id="submit-bulk-btn"
                type="submit"
                className={`px-6 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shadow-xs transition-transform active:scale-98 cursor-pointer ${
                  !isOnline ? 'bg-amber-600 hover:bg-amber-700 text-white' : palette.btnPrimary
                }`}
              >
                {!isOnline ? (
                  <>
                    <Database className="w-4 h-4" />
                    <span>Save Batch to Offline Queue (IndexedDB)</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Submit Batch Report</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* DUPLICATE OVERRIDE CONFIRMATION MODAL */}
      {showDuplicateModal && duplicateInfo.matchingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    Duplicate Phone Registration Warning
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Matching phone already exists in the central campaign registry.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowDuplicateModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200/80 dark:border-slate-800 space-y-2 text-xs">
              <div className="flex items-center justify-between font-mono-tabular">
                <span className="text-slate-500 dark:text-slate-400">Registered Phone:</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">
                  {formatNigerianPhone(duplicateInfo.matchingRecord.phone)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">Existing Convert:</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  {duplicateInfo.matchingRecord.firstName} {duplicateInfo.matchingRecord.lastName}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">Recorded Hub:</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  {duplicateInfo.centreName}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Select Justification for Overriding Duplicate Detection *
              </label>
              <div className="space-y-2">
                {DUPLICATE_REASONS.map((reason, idx) => (
                  <label
                    key={idx}
                    className={`flex items-center gap-3 p-3 rounded-xl border text-xs cursor-pointer transition-colors ${
                      duplicateReasonPreset === reason
                        ? 'bg-amber-500/10 border-amber-500/40 text-slate-900 dark:text-slate-100 font-semibold'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="dup-reason"
                      checked={duplicateReasonPreset === reason}
                      onChange={() => setDuplicateReasonPreset(reason)}
                      className="accent-amber-500 cursor-pointer"
                    />
                    <span>{reason}</span>
                  </label>
                ))}
              </div>

              {duplicateReasonPreset === 'Special administrative exception' && (
                <div className="pt-2">
                  <input
                    type="text"
                    placeholder="Enter specific audit exception explanation..."
                    value={customDuplicateReason}
                    onChange={e => setCustomDuplicateReason(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl px-3 py-2 text-xs focus:outline-none"
                    required
                  />
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowDuplicateModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Cancel & Edit Phone
              </button>

              <button
                type="button"
                onClick={handleConfirmDuplicateOverride}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Confirm & Commit to Collation</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FIELD WORKER ACHIEVEMENTS & BADGES FOOTER */}
      {(() => {
        const allSouls = dataService.getSoulRecords({ includeDeleted: false });
        const totalSubmitted = allSouls.length;
        const hasMidnight = allSouls.some(r => {
          const hr = new Date(r.wonAt).getHours();
          return hr >= 23 || hr < 4;
        });
        const areaCounts = allSouls.reduce((acc, r) => {
          if (r.community) acc[r.community] = (acc[r.community] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        const hasCouncil = Object.values(areaCounts).some(c => c >= 5);

        const badges = [
          {
            id: 'first10',
            title: 'First 10 Souls',
            desc: 'Submitted 10+ records',
            icon: '🌟',
            unlocked: totalSubmitted >= 10,
            prog: `${Math.min(totalSubmitted, 10)}/10`,
          },
          {
            id: 'midnight',
            title: 'Midnight Evangelist',
            desc: 'Late-night win (11 PM - 4 AM)',
            icon: '🌙',
            unlocked: hasMidnight,
            prog: hasMidnight ? 'Unlocked' : 'Pending',
          },
          {
            id: 'council',
            title: 'Area Council Pioneer',
            desc: '5+ in an Abuja community',
            icon: '🗺️',
            unlocked: hasCouncil,
            prog: hasCouncil ? 'Unlocked' : 'Pending',
          },
          {
            id: 'century',
            title: 'Century Harvester',
            desc: '100+ total souls won',
            icon: '👑',
            unlocked: totalSubmitted >= 100,
            prog: `${Math.min(totalSubmitted, 100)}/100`,
          },
        ];

        return (
          <div className="mt-10 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" style={{ color: palette.hex }} />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">
                  Field Worker Achievement Badges
                </h4>
              </div>
              <span className="text-[10px] font-mono bg-amber-500/10 text-amber-700 dark:text-amber-300 px-2.5 py-1 rounded-full font-bold">
                {badges.filter(b => b.unlocked).length} / {badges.length} Unlocked
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {badges.map(b => (
                <div
                  key={b.id}
                  className={`p-3.5 rounded-xl border flex items-start gap-3 transition-all ${
                    b.unlocked
                      ? 'bg-amber-500/5 border-amber-500/30 text-slate-900 dark:text-slate-100'
                      : 'bg-slate-50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 opacity-60'
                  }`}
                >
                  <div className="text-2xl">{b.icon}</div>
                  <div className="space-y-0.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold">{b.title}</span>
                      <span className="text-[10px] font-mono font-bold text-slate-500">{b.prog}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">{b.desc}</p>
                    <span
                      className={`inline-block text-[9px] font-mono px-2 py-0.5 rounded-full mt-1 ${
                        b.unlocked
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                      }`}
                    >
                      {b.unlocked ? 'Unlocked ✓' : 'Locked'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })()}
    </div>
  );
};
