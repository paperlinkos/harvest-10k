import React, { useState, useEffect, useRef } from 'react';
import { dataService } from '../services/dataService';
import { useTheme } from '../context/ThemeContext';
import { DecisionType, SoulRecord, SoulWinnerProfile } from '../types';
import { Zap, Plus, Undo2, MapPin, CheckCircle2, AlertTriangle, Users, Sparkles, X, ShieldAlert, Phone, Keyboard, ArrowRight, RefreshCw, Check } from 'lucide-react';
import { validateAndNormalizeNigerianPhone, formatNigerianPhone } from '../utils/phoneUtils';

interface TallyScreenProps {
  theme: string;
  onSuccessToast: (title: string, message: string) => void;
  onNavigateToReconcile: () => void;
}

export const TallyScreen: React.FC<TallyScreenProps> = ({ theme, onSuccessToast, onNavigateToReconcile }) => {
  const { palette } = useTheme();
  const [selectedTag, setSelectedTag] = useState<DecisionType>('new_convert');
  const [lastTappedRecordId, setLastTappedRecordId] = useState<string | null>(null);
  const [undoTimer, setUndoTimer] = useState<number | null>(null);
  const [undoTimeLeft, setUndoTimeLeft] = useState<number>(10);
  const [doubleTapWarning, setDoubleTapWarning] = useState<boolean>(false);
  const lastTapTimeRef = useRef<number>(0);

  // Group modal
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [groupCount, setGroupCount] = useState<string>('5');
  const [groupLabel, setGroupLabel] = useState<string>('');

  // Location tracking state
  const [useLocation, setUseLocation] = useState<boolean>(false);
  const [currentCoords, setCurrentCoords] = useState<{ lat?: number; lng?: number }>({});
  const [burstAlert, setBurstAlert] = useState<boolean>(false);

  // Tap-Then-Phone Bottom Sheet State
  const [activePhoneRecordId, setActivePhoneRecordId] = useState<string | null>(null);
  const [phoneInput, setPhoneInput] = useState<string>('');
  const [skipCount, setSkipCount] = useState<number>(() => {
    const saved = sessionStorage.getItem('harvest_skip_count');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [autoOpenPhoneSheet, setAutoOpenPhoneSheet] = useState<boolean>(() => {
    const saved = sessionStorage.getItem('harvest_skip_count');
    return saved ? parseInt(saved, 10) < 3 : true;
  });
  const phoneInputRef = useRef<HTMLInputElement>(null);
  const [savedTick, setSavedTick] = useState<boolean>(false);

  // Rapid Phone Mode State
  const [rapidMode, setRapidMode] = useState<boolean>(false);
  const [rapidPhoneInput, setRapidPhoneInput] = useState<string>('');
  const [rapidCount, setRapidCount] = useState<number>(0);
  const rapidInputRef = useRef<HTMLInputElement>(null);

  // Duplicate Conflict Modal State
  const [duplicateConflict, setDuplicateConflict] = useState<{
    recordId: string;
    phone: string;
    matchedRecord: SoulRecord;
    isRapid?: boolean;
  } | null>(null);

  const stats = dataService.getStats();
  const records = dataService.getSoulRecords();
  const centres = dataService.getCentres();
  const [selectedCentreId, setSelectedCentreId] = useState<string>(centres[0]?.id || '');

  const soulWinnerProfile = dataService.getSoulWinnerProfile();
  const userId = soulWinnerProfile.id || 'field-worker-current';
  const userName = soulWinnerProfile.fullName || 'Evangelist';

  const userRecords = records.filter(r => r.tappedByUserId === userId || r.wonByName === userName);
  const pendingCount = userRecords.filter(r => r.reconcileStatus === 'pending' || r.status === 'pending').length;
  const contactableCount = userRecords.filter(r => r.reconcileStatus === 'contactable' || r.reconcileStatus === 'complete' || (r.phone && r.phone.trim() !== '')).length;
  const todayCount = userRecords.length;
  const sessionCount = userRecords.filter(r => {
    const t = new Date(r.tappedAt || r.wonAt).getTime();
    const now = Date.now();
    return now - t < 4 * 3600 * 1000;
  }).length;

  // Toggle GPS
  const toggleLocationPermission = () => {
    if (!useLocation) {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          pos => {
            setCurrentCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
            setUseLocation(true);
            onSuccessToast('Location Enabled', 'GPS coordinates attached to tap tallies.');
          },
          () => {
            onSuccessToast('Location Denied', 'Could not retrieve GPS position.');
            setUseLocation(false);
          }
        );
      } else {
        setUseLocation(false);
      }
    } else {
      setUseLocation(false);
      setCurrentCoords({});
    }
  };

  // Save current phone input if sheet is open before opening a new one
  const flushOpenPhoneSheet = () => {
    if (activePhoneRecordId && phoneInput.trim().length > 0) {
      const res = dataService.attachPhoneToRecord(activePhoneRecordId, phoneInput, userName);
      if (res.isDuplicate && res.matchedRecord) {
        setDuplicateConflict({
          recordId: activePhoneRecordId,
          phone: phoneInput,
          matchedRecord: res.matchedRecord,
        });
        return;
      }
    }
    setActivePhoneRecordId(null);
    setPhoneInput('');
  };

  // Handle Big Tap
  const handleTap = () => {
    const now = Date.now();
    if (now - lastTapTimeRef.current < 400) {
      setDoubleTapWarning(true);
      setTimeout(() => setDoubleTapWarning(false), 3000);
      return;
    }
    lastTapTimeRef.current = now;

    if (navigator.vibrate) {
      navigator.vibrate(40);
    }

    // If phone bottom sheet is open, save what was typed so far to the previous record before creating new tap
    if (activePhoneRecordId) {
      flushOpenPhoneSheet();
    }

    const res = dataService.recordSoulTap({
      userId,
      userName,
      centreId: selectedCentreId || centres[0]?.id,
      decisionType: selectedTag,
      lat: useLocation ? currentCoords.lat : undefined,
      lng: useLocation ? currentCoords.lng : undefined,
      winnerCell: soulWinnerProfile.cellName || undefined,
      winnerPcf: soulWinnerProfile.pcfName || undefined,
      winnerPhone: soulWinnerProfile.phone || undefined,
    });

    if (res.burstWarning) {
      setBurstAlert(true);
    }

    setLastTappedRecordId(res.id);
    setUndoTimeLeft(10);
    if (undoTimer) clearInterval(undoTimer);

    const timer = window.setInterval(() => {
      setUndoTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setLastTappedRecordId(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    setUndoTimer(timer as unknown as number);

    // Open phone bottom sheet if autoOpenPhoneSheet is enabled
    if (autoOpenPhoneSheet) {
      setActivePhoneRecordId(res.id);
      setPhoneInput('');
      setSavedTick(false);
      setTimeout(() => {
        phoneInputRef.current?.focus();
      }, 50);
    }
  };

  // Handle Phone Input Change in Bottom Sheet (Auto-save on 11th digit)
  const handlePhoneInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 11);
    setPhoneInput(val);

    if (val.length === 11 && activePhoneRecordId) {
      const res = dataService.attachPhoneToRecord(activePhoneRecordId, val, userName);
      if (res.isDuplicate && res.matchedRecord) {
        setDuplicateConflict({
          recordId: activePhoneRecordId,
          phone: val,
          matchedRecord: res.matchedRecord,
        });
      } else {
        setSavedTick(true);
        onSuccessToast('Phone Attached', `Contact ${formatNigerianPhone(val)} saved successfully!`);
        setTimeout(() => {
          setActivePhoneRecordId(null);
          setPhoneInput('');
          setSavedTick(false);
        }, 700);
      }
    }
  };

  // Skip Phone Sheet
  const handleSkipPhone = () => {
    flushOpenPhoneSheet();
    const newSkips = skipCount + 1;
    setSkipCount(newSkips);
    sessionStorage.setItem('harvest_skip_count', newSkips.toString());
    if (newSkips >= 3) {
      setAutoOpenPhoneSheet(false);
      onSuccessToast('Rapid Mode Enabled', 'Auto-prompt paused after 3 skips. Use "+ Phone" button when needed.');
    }
  };

  // Re-enable auto prompt manually
  const enableAutoPrompt = () => {
    setAutoOpenPhoneSheet(true);
    setSkipCount(0);
    sessionStorage.setItem('harvest_skip_count', '0');
    onSuccessToast('Auto-Prompt Enabled', 'Phone prompt will appear after each tap.');
  };

  // Rapid Phone Mode Input Change (Auto-save on 11th digit and clear for next)
  const handleRapidPhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 11);
    setRapidPhoneInput(val);

    if (val.length === 11) {
      // Create record with phone attached
      const res = dataService.recordSoulTap({
        userId,
        userName,
        centreId: selectedCentreId || centres[0]?.id,
        decisionType: selectedTag,
        lat: useLocation ? currentCoords.lat : undefined,
        lng: useLocation ? currentCoords.lng : undefined,
      });

      const attachRes = dataService.attachPhoneToRecord(res.id, val, userName);
      if (attachRes.isDuplicate && attachRes.matchedRecord) {
        setDuplicateConflict({
          recordId: res.id,
          phone: val,
          matchedRecord: attachRes.matchedRecord,
          isRapid: true,
        });
      } else {
        setRapidCount(prev => prev + 1);
        setRapidPhoneInput('');
        if (navigator.vibrate) navigator.vibrate(30);
        onSuccessToast('Registered', `Phone ${formatNigerianPhone(val)} recorded!`);
        setTimeout(() => rapidInputRef.current?.focus(), 50);
      }
    }
  };

  const handleUndo = () => {
    if (!lastTappedRecordId) return;
    dataService.undoSoulRecord(lastTappedRecordId, userName);
    setLastTappedRecordId(null);
    if (undoTimer) clearInterval(undoTimer);
    onSuccessToast('Tap Undone', 'The record was removed.');
  };

  const handleGroupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const countNum = parseInt(groupCount, 10);
    if (isNaN(countNum) || countNum <= 0) return;

    dataService.recordSoulQuickNumber({
      count: countNum,
      label: groupLabel || 'Group Altar Call',
      userId,
      userName,
      centreId: selectedCentreId || centres[0]?.id,
      decisionType: selectedTag,
    });

    setIsGroupModalOpen(false);
    setGroupLabel('');
    onSuccessToast('Group Tally Recorded', `Added ${countNum} pending records.`);
  };

  // Resolve duplicate conflict
  const resolveDuplicate = (action: 'merge' | 'keep' | 'retype') => {
    if (!duplicateConflict) return;
    const { recordId, phone, isRapid } = duplicateConflict;

    if (action === 'merge') {
      // Merge: keep current record, attach phone with override
      dataService.attachPhoneToRecord(recordId, phone, userName, true);
      onSuccessToast('Merged', 'Phone number linked and merged.');
    } else if (action === 'keep') {
      // Keep both: attach phone with force override
      dataService.attachPhoneToRecord(recordId, phone, userName, true);
      onSuccessToast('Retained Both', 'Duplicate phone retained as separate record.');
    } else {
      // Re-type: clear input
      if (isRapid) {
        setRapidPhoneInput('');
      } else {
        setPhoneInput('');
      }
    }

    setDuplicateConflict(null);
    if (isRapid) {
      setTimeout(() => rapidInputRef.current?.focus(), 50);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 flex flex-col items-center justify-center min-h-[82vh] space-y-6 pb-24">
      {/* Centre & Location Bar */}
      <div className="w-full flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-2xl shadow-xs">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider shrink-0">Centre:</span>
          <select
            value={selectedCentreId}
            onChange={e => setSelectedCentreId(e.target.value)}
            className="w-full sm:w-auto bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold rounded-lg px-2.5 py-1.5 text-slate-900 dark:text-slate-100 focus:outline-none cursor-pointer truncate"
          >
            {centres.map(c => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.areaCouncilCode})
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center justify-end gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setRapidMode(!rapidMode)}
            className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
              rapidMode
                ? 'bg-amber-500 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            <Keyboard className="w-3.5 h-3.5" />
            <span>{rapidMode ? 'Keypad ON' : 'Keypad Mode'}</span>
          </button>

          <button
            type="button"
            onClick={toggleLocationPermission}
            className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
              useLocation
                ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>{useLocation ? 'GPS' : 'GPS off'}</span>
          </button>
        </div>
      </div>

      {/* Quick-Tag Chips */}
      <div className="w-full flex items-center justify-center gap-2 overflow-x-auto py-1">
        {[
          { id: 'new_convert', label: 'New Convert' },
          { id: 'rededication', label: 'Rededication' },
          { id: 'returnee', label: 'Returnee' },
        ].map(tag => {
          const isSelected = selectedTag === tag.id;
          return (
            <button
              key={tag.id}
              type="button"
              onClick={() => setSelectedTag(tag.id as DecisionType)}
              className={`px-4 py-2 rounded-full text-xs font-bold tracking-tight transition-all cursor-pointer whitespace-nowrap shadow-xs ${
                isSelected
                  ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 scale-105'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
              }`}
            >
              {tag.label}
            </button>
          );
        })}
      </div>

      {/* Double Tap Warning */}
      {doubleTapWarning && (
        <div className="w-full bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 animate-bounce">
          <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
          <span>Double tap detected within 400ms. Tap carefully!</span>
        </div>
      )}

      {/* Burst Alert */}
      {burstAlert && (
        <div className="w-full bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 px-4 py-2.5 rounded-xl text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
            <span>10+ taps in 30 seconds — please confirm real souls won!</span>
          </div>
          <button onClick={() => setBurstAlert(false)} className="text-xs font-bold underline cursor-pointer">Dismiss</button>
        </div>
      )}

      {/* RAPID PHONE MODE PANEL (if active) */}
      {rapidMode ? (
        <div className="w-full bg-white dark:bg-slate-900 border-2 border-amber-500/40 rounded-3xl p-6 shadow-xl space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-amber-500 animate-pulse" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Rapid Phone Mode (Continuous Registration)</h3>
            </div>
            <span className="text-xs font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 px-3 py-1 rounded-full">
              {rapidCount} Registered
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Keep entering 11-digit phone numbers. Each completed number instantly creates a soul record and clears for the next.
          </p>
          <div className="relative">
            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              ref={rapidInputRef}
              type="tel"
              inputMode="tel"
              placeholder="0803 123 4567 (Type 11 digits)"
              value={rapidPhoneInput}
              onChange={handleRapidPhoneChange}
              autoFocus
              className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-300 dark:border-slate-700 rounded-2xl pl-12 pr-4 py-4 text-lg font-mono font-bold tracking-widest text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
            />
          </div>
          <div className="flex justify-between items-center text-xs text-slate-400 pt-1">
            <span>Digits: {rapidPhoneInput.length}/11</span>
            <button
              onClick={() => setRapidMode(false)}
              className="text-slate-600 dark:text-slate-300 underline font-semibold cursor-pointer"
            >
              Switch back to Tap Tally
            </button>
          </div>
        </div>
      ) : (
        /* THE BIG TALLY BUTTON */
        <div className="py-4 flex flex-col items-center justify-center w-full">
          <button
            type="button"
            onClick={handleTap}
            style={{
              backgroundColor: palette.hex,
              boxShadow: `0 20px 40px -10px ${palette.hex}66`,
            }}
            className="w-60 h-60 sm:w-68 sm:h-68 rounded-full flex flex-col items-center justify-center text-white font-black tracking-wider transition-transform active:scale-95 hover:scale-102 cursor-pointer select-none group border-8 border-white/20 dark:border-slate-900/40"
          >
            <div className="flex items-center gap-1 text-white/90 text-sm font-semibold uppercase tracking-widest mb-1">
              <Zap className="w-4 h-4 fill-white animate-pulse" /> Tap To Win
            </div>
            <span className="text-6xl sm:text-7xl font-display font-black group-hover:scale-110 transition-transform">
              +1
            </span>
            <span className="text-xs font-bold uppercase tracking-widest text-white/90 mt-2 bg-black/20 px-3 py-1 rounded-full">
              SOUL WON
            </span>
          </button>
        </div>
      )}

      {/* LIVE COUNTS DIRECTLY UNDERNEATH */}
      <div className="grid grid-cols-3 gap-3 w-full text-center">
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-3.5 rounded-2xl shadow-xs">
          <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Today</span>
          <span className="text-2xl font-display font-black text-slate-900 dark:text-slate-100 tabular-nums">
            {todayCount}
          </span>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-3.5 rounded-2xl shadow-xs">
          <span className="block text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Contactable</span>
          <span className="text-2xl font-display font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
            {contactableCount}
          </span>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-3.5 rounded-2xl shadow-xs">
          <span className="block text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">Needs Phone</span>
          <span className="text-2xl font-display font-black text-amber-600 dark:text-amber-400 tabular-nums">
            {pendingCount}
          </span>
        </div>
      </div>

      {/* ACTIONS: Add Several & Reconcile & Manual Phone Prompt Toggle */}
      <div className="w-full flex items-center gap-3 pt-1">
        <button
          type="button"
          onClick={() => setIsGroupModalOpen(true)}
          className="flex-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 py-3.5 px-4 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
        >
          <Users className="w-4 h-4" /> + Group Tally
        </button>

        <button
          type="button"
          onClick={onNavigateToReconcile}
          className={`flex-1 py-3.5 px-4 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-xs cursor-pointer ${palette.btnPrimary}`}
        >
          <CheckCircle2 className="w-4 h-4" /> Reconcile ({pendingCount})
        </button>
      </div>

      {!autoOpenPhoneSheet && (
        <div className="w-full bg-slate-100 dark:bg-slate-800/80 p-3 rounded-2xl flex items-center justify-between text-xs">
          <span className="text-slate-600 dark:text-slate-400">Phone prompt auto-popup is paused (rapid mode).</span>
          <button
            onClick={enableAutoPrompt}
            className="font-bold underline text-slate-900 dark:text-slate-100 cursor-pointer"
          >
            Enable Prompt
          </button>
        </div>
      )}

      {/* 10-Second Undo Snackbar */}
      {lastTappedRecordId && !activePhoneRecordId && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-4 animate-slide-up border border-slate-800">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-xs font-semibold">+1 Soul Recorded ({undoTimeLeft}s)</span>
          </div>
          <button
            type="button"
            onClick={handleUndo}
            className="bg-rose-600 hover:bg-rose-700 text-white px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
          >
            <Undo2 className="w-3.5 h-3.5" /> Undo Tap
          </button>
        </div>
      )}

      {/* BOTTOM SHEET FOR TAP-THEN-PHONE FLOW */}
      {activePhoneRecordId && (
        <div className="fixed inset-x-0 bottom-0 z-50 bg-slate-900/60 backdrop-blur-xs flex justify-end flex-col animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border-t-2 border-slate-200 dark:border-slate-800 rounded-t-3xl p-6 shadow-2xl space-y-4 max-w-xl mx-auto w-full">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
                  {savedTick ? <Check className="w-4 h-4" /> : <Phone className="w-4 h-4" />}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">Attach Phone Number</h4>
                  <p className="text-[11px] text-slate-500">Optional — tap record saved instantly</p>
                </div>
              </div>
              <button
                onClick={handleSkipPhone}
                className="text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl cursor-pointer"
              >
                Skip ✕
              </button>
            </div>

            <div className="space-y-2">
              <div className="relative">
                <input
                  ref={phoneInputRef}
                  type="tel"
                  inputMode="tel"
                  placeholder="0803 123 4567 (11 digits)"
                  value={phoneInput}
                  onChange={handlePhoneInputChange}
                  autoFocus
                  className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-300 dark:border-slate-700 rounded-2xl px-4 py-3.5 text-lg font-mono font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
                />
                {savedTick && (
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-600 flex items-center gap-1 font-bold text-xs bg-emerald-50 px-2.5 py-1 rounded-lg">
                    <Check className="w-4 h-4" /> Saved
                  </div>
                )}
              </div>
              {phoneInput.length > 0 && phoneInput.length < 11 && (
                <p className="text-[11px] text-amber-600 font-semibold">
                  Entering digits ({phoneInput.length}/11)... auto-saves on 11th digit.
                </p>
              )}
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-slate-400">Tapping "+1 SOUL" again auto-saves current input</span>
              <button
                type="button"
                onClick={handleSkipPhone}
                className={`px-5 py-2.5 rounded-xl font-bold text-xs shadow-xs cursor-pointer ${palette.btnPrimary}`}
              >
                Done / Skip
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DUPLICATE CONFLICT MODAL */}
      {duplicateConflict && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Duplicate Phone Detected</h3>
                <p className="text-xs text-slate-500 font-mono">{formatNigerianPhone(duplicateConflict.phone)}</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300">
              This phone number is already registered in the campaign (Matched: <span className="font-semibold">{duplicateConflict.matchedRecord.firstName || 'Unnamed Record'}</span> won by {duplicateConflict.matchedRecord.wonByName}). Shared family phones are common. How would you like to proceed?
            </p>

            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={() => resolveDuplicate('merge')}
                className="w-full text-left bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-slate-100 cursor-pointer"
              >
                🔄 It's the same person — Merge
              </button>
              <button
                type="button"
                onClick={() => resolveDuplicate('keep')}
                className="w-full text-left bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-slate-100 cursor-pointer"
              >
                👥 Different person, same phone — Keep both
              </button>
              <button
                type="button"
                onClick={() => resolveDuplicate('retype')}
                className="w-full text-left bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 p-3 rounded-xl border border-rose-200 dark:border-rose-800 text-xs font-bold text-rose-700 dark:text-rose-300 cursor-pointer"
              >
                ✏️ Let me re-type the number
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Group Tally Modal */}
      {isGroupModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Users className="w-4 h-4" style={{ color: palette.hex }} /> Add Group / Altar Call Tally
              </h3>
              <button
                onClick={() => setIsGroupModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:bg-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleGroupSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="block font-semibold text-slate-700 dark:text-slate-300">Number of Souls Won</label>
                <input
                  type="number"
                  min="1"
                  max="500"
                  value={groupCount}
                  onChange={e => setGroupCount(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl px-3.5 py-2.5 text-sm font-bold focus:outline-none"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block font-semibold text-slate-700 dark:text-slate-300">Outreach / Location Label</label>
                <input
                  type="text"
                  placeholder="e.g. Wuse Market Altar Call"
                  value={groupLabel}
                  onChange={e => setGroupLabel(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsGroupModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl font-semibold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2.5 rounded-xl font-bold text-xs shadow-xs cursor-pointer ${palette.btnPrimary}`}
                >
                  Add {groupCount} Pending Records
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
