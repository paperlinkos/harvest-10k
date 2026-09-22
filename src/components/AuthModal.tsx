import React, { useState } from 'react';
import { UserRole, SoulWinnerProfile } from '../types';
import { useTheme } from '../context/ThemeContext';
import { dataService, CHRIST_EMBASSY_PCFS, CHRIST_EMBASSY_CELLS } from '../services/dataService';
import {
  Shield,
  KeyRound,
  User,
  CheckCircle2,
  Lock,
  X,
  Sparkles,
  ArrowRight,
  LogOut,
  UserPlus,
  LogIn,
  Building2,
  Phone,
  Mail,
  Users,
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserRole: UserRole;
  onRoleChange: (newRole: UserRole) => void;
  soulWinnerProfile?: SoulWinnerProfile;
  onOpenSoulWinnerReg?: () => void;
  onSoulWinnerProfileChange?: (profile: SoulWinnerProfile) => void;
  onSuccessToast: (title: string, message: string) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUserRole,
  onRoleChange,
  soulWinnerProfile,
  onOpenSoulWinnerReg,
  onSoulWinnerProfileChange,
  onSuccessToast,
}) => {
  const { palette } = useTheme();
  const centres = dataService.getCentres();

  // Mode: 'signin' or 'signup'
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');

  // Sign In state
  const [selectedRole, setSelectedRole] = useState<UserRole>(currentUserRole);
  const [passcode, setPasscode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Sign Up state for Soul Winners / Field Evangelists
  const [signUpFullName, setSignUpFullName] = useState('');
  const [signUpPhone, setSignUpPhone] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpCell, setSignUpCell] = useState(CHRIST_EMBASSY_CELLS[0] || 'Grace Cell');
  const [signUpPcf, setSignUpPcf] = useState(CHRIST_EMBASSY_PCFS[0] || 'Haven PCF');
  const [signUpCentreId, setSignUpCentreId] = useState(centres[0]?.id || 'cnt-durumi-01');
  const [signUpRoleTitle, setSignUpRoleTitle] = useState('Soul Winner / Evangelist');
  const [customCell, setCustomCell] = useState('');
  const [customPcf, setCustomPcf] = useState('');

  if (!isOpen) return null;

  const handleAuthenticate = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (selectedRole === 'admin') {
      // Default admin passkeys
      if (passcode !== '7770' && passcode !== '1234') {
        setErrorMsg('Invalid Administrator Passcode. Default is 7770.');
        return;
      }
    } else if (selectedRole === 'coordinator') {
      // Coordinator passkey
      if (passcode !== '1000' && passcode !== '1234' && passcode !== '7770') {
        setErrorMsg('Invalid Coordinator Access PIN. Default is 1000.');
        return;
      }
    }

    // Authenticated
    onRoleChange(selectedRole);
    const roleTitle =
      selectedRole === 'admin'
        ? 'Campaign Administrator'
        : selectedRole === 'coordinator'
        ? 'Collation Coordinator'
        : selectedRole === 'field_worker'
        ? 'Field Evangelist'
        : 'Public Observer';

    onSuccessToast('Authenticated Successfully', `Welcome to the ${roleTitle} session.`);
    onClose();
  };

  const handleSignUpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!signUpFullName.trim()) {
      setErrorMsg('Please enter your full name.');
      return;
    }
    if (!signUpPhone.trim()) {
      setErrorMsg('Please enter your active phone number.');
      return;
    }

    const resolvedCell = customCell.trim() || signUpCell;
    const resolvedPcf = customPcf.trim() || signUpPcf;
    const selectedCentre = centres.find(c => c.id === signUpCentreId);

    const newProfile: SoulWinnerProfile = {
      id: `winner-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      fullName: signUpFullName.trim(),
      phone: signUpPhone.trim(),
      email: signUpEmail.trim(),
      cellName: resolvedCell,
      pcfName: resolvedPcf,
      churchCentreId: signUpCentreId,
      churchName: selectedCentre ? selectedCentre.name : 'Durumi Central Hub',
      roleTitle: signUpRoleTitle,
      registeredAt: new Date().toISOString(),
    };

    // Register in dataService
    dataService.registerSoulWinner(newProfile);
    dataService.saveSoulWinnerProfile(newProfile);

    if (onSoulWinnerProfileChange) {
      onSoulWinnerProfileChange(newProfile);
    }

    // Set user to Field Worker role
    onRoleChange('field_worker');
    onSuccessToast('Registration Complete!', `Welcome, Evangelist ${newProfile.fullName}. Your soul winner profile is active.`);
    onClose();
  };

  const handleSwitchToObserver = () => {
    onRoleChange('public');
    onSuccessToast('Observer Mode Active', 'Switched to public view-only access.');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-white dark:bg-[#151922] rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 pt-5 pb-3 flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 shrink-0">
          <div className="flex items-center gap-2.5">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-xs"
              style={{ backgroundColor: `${palette.hex}18`, color: palette.hex }}
            >
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Harvest 10K Authentication
              </h3>
              <p className="text-xs text-slate-400">
                Christ Embassy Abuja Zone 1
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mode Switcher Tabs: Sign In vs Sign Up */}
        <div className="p-3 pb-0 bg-slate-50 dark:bg-slate-900/40 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="grid grid-cols-2 bg-slate-200/70 dark:bg-slate-800 p-1 rounded-2xl text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setAuthMode('signin');
                setErrorMsg('');
              }}
              className={`py-2 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                authMode === 'signin'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Role Sign-In</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode('signup');
                setErrorMsg('');
              }}
              className={`py-2 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                authMode === 'signup'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Sign Up (Soul Winner)</span>
            </button>
          </div>
        </div>

        {/* Scrollable Form Body */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
          {authMode === 'signin' ? (
            /* ── SIGN IN TAB ── */
            <form onSubmit={handleAuthenticate} className="space-y-5">
              {/* Role Selection Tabs */}
              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-slate-400 mb-2">
                  Select Login Role
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'coordinator', label: 'Coordinator', desc: 'Verify & Manage' },
                    { id: 'admin', label: 'Admin', desc: 'Collation Settings' },
                    { id: 'field_worker', label: 'Field Worker', desc: 'Evangelism & Tally' },
                    { id: 'public', label: 'Observer', desc: 'View Only Live' },
                  ].map(roleItem => {
                    const isSel = selectedRole === roleItem.id;
                    return (
                      <button
                        key={roleItem.id}
                        type="button"
                        onClick={() => {
                          setSelectedRole(roleItem.id as UserRole);
                          setErrorMsg('');
                        }}
                        className={`p-3 rounded-2xl text-left border transition-all cursor-pointer ${
                          isSel
                            ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white shadow-md'
                            : 'bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 border-slate-200/70 dark:border-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs">{roleItem.label}</span>
                          {isSel && (
                            <CheckCircle2
                              className="w-3.5 h-3.5 text-white dark:text-slate-900"
                            />
                          )}
                        </div>
                        <span
                          className={`text-[10px] block mt-0.5 ${
                            isSel ? 'text-slate-300 dark:text-slate-600' : 'text-slate-400'
                          }`}
                        >
                          {roleItem.desc}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Passcode input for Coordinator and Admin */}
              {(selectedRole === 'admin' || selectedRole === 'coordinator') && (
                <div className="space-y-2 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <KeyRound className="w-3.5 h-3.5 text-slate-400" />
                      {selectedRole === 'admin' ? 'Administrator Passcode' : 'Coordinator Access PIN'}
                    </label>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-slate-400">Default:</span>
                      <button
                        type="button"
                        onClick={() => setPasscode(selectedRole === 'admin' ? '7770' : '1000')}
                        className="px-2 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 font-mono font-bold text-[11px] hover:bg-amber-500/25 transition-colors cursor-pointer"
                        title="Tap to auto-fill default access PIN"
                      >
                        {selectedRole === 'admin' ? '7770 (Tap to fill)' : '1000 (Tap to fill)'}
                      </button>
                    </div>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder={selectedRole === 'admin' ? 'Enter 7770' : 'Enter 1000'}
                      value={passcode}
                      onChange={e => setPasscode(e.target.value)}
                      autoFocus
                      className="w-full px-4 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-base tracking-widest text-center font-mono font-bold focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white transition-all shadow-inner"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 text-center">
                    {selectedRole === 'coordinator'
                      ? 'Zone 1 Coordinator access code is 1000 (or tap the chip above).'
                      : 'Admin Master passcode is 7770 (or tap the chip above).'}
                  </p>
                </div>
              )}

              {/* Notice for Field Worker */}
              {selectedRole === 'field_worker' && (
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-2 text-xs text-slate-600 dark:text-slate-300">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 dark:text-white">Active Evangelist Profile</span>
                    <button
                      type="button"
                      onClick={() => setAuthMode('signup')}
                      className="text-blue-600 dark:text-blue-400 font-bold hover:underline cursor-pointer text-[11px]"
                    >
                      New Profile? Sign Up
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {soulWinnerProfile?.fullName
                      ? `${soulWinnerProfile.fullName} (${soulWinnerProfile.cellName} · ${soulWinnerProfile.pcfName})`
                      : 'Evangelist Barnabas Danjuma (Grace Cell · Haven PCF)'}
                  </p>
                </div>
              )}

              {/* Observer Role Explanation */}
              {selectedRole === 'public' && (
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 text-xs text-slate-500 dark:text-slate-400">
                  Observer mode provides read-only live viewing of the 10,000 souls collation stream, live leaderboards, and broadcast screens without edit permissions.
                </div>
              )}

              {/* Error display */}
              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-semibold">
                  {errorMsg}
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-2 flex items-center gap-3">
                <button
                  type="submit"
                  className="flex-1 py-3 px-4 rounded-2xl font-black text-xs text-white dark:text-slate-900 bg-slate-900 dark:bg-white hover:opacity-90 transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg"
                >
                  <span>Confirm & Enter Role</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>

                {currentUserRole !== 'public' && (
                  <button
                    type="button"
                    onClick={handleSwitchToObserver}
                    className="py-3 px-3 rounded-2xl font-bold text-xs text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 transition-colors cursor-pointer flex items-center gap-1.5"
                    title="Log out and switch to Public Observer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Observer</span>
                  </button>
                )}
              </div>
            </form>
          ) : (
            /* ── SIGN UP TAB ── */
            <form onSubmit={handleSignUpSubmit} className="space-y-4 animate-in fade-in duration-150">
              <div>
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1">
                  Join the 10,000 Souls Evangelism Team
                </span>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Sign up as a registered field soul winner to submit individual converts, track your personal harvest stats, and tap-to-tally in your Area Council.
                </p>
              </div>

              {/* Full Name */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  Full Name (First & Last) *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Brother Emmanuel Ade"
                  value={signUpFullName}
                  onChange={e => setSignUpFullName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white transition-all"
                  required
                />
              </div>

              {/* Phone Number */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  Phone Number (WhatsApp) *
                </label>
                <input
                  type="tel"
                  placeholder="e.g. +234 803 123 4567"
                  value={signUpPhone}
                  onChange={e => setSignUpPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white transition-all"
                  required
                />
              </div>

              {/* Email (Optional) */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  Email Address (Optional)
                </label>
                <input
                  type="email"
                  placeholder="e.g. emmanuel@christembassy.org"
                  value={signUpEmail}
                  onChange={e => setSignUpEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white transition-all"
                />
              </div>

              {/* Church Centre / Hub */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  Collation Centre / Church Hub *
                </label>
                <select
                  value={signUpCentreId}
                  onChange={e => setSignUpCentreId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white transition-all"
                >
                  {centres.map(c => (
                    <option key={c.id} value={c.id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                      {c.name} ({c.code} · {c.areaCouncilId.toUpperCase()})
                    </option>
                  ))}
                </select>
              </div>

              {/* PCF / Church Group */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    PCF / Group
                  </label>
                  <select
                    value={signUpPcf}
                    onChange={e => setSignUpPcf(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none"
                  >
                    {CHRIST_EMBASSY_PCFS.map(pcf => (
                      <option key={pcf} value={pcf} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                        {pcf}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Cell Name */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Cell Name
                  </label>
                  <select
                    value={signUpCell}
                    onChange={e => setSignUpCell(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none"
                  >
                    {CHRIST_EMBASSY_CELLS.map(cell => (
                      <option key={cell} value={cell} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                        {cell}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Error display */}
              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-semibold">
                  {errorMsg}
                </div>
              )}

              {/* Submit Sign Up Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 px-4 rounded-2xl font-black text-xs text-white dark:text-slate-900 bg-slate-900 dark:bg-white hover:opacity-90 transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Create Account & Start Outreach</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
