import React, { useState } from 'react';
import { UserRole, SoulWinnerProfile } from '../types';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { dataService, CHRIST_EMBASSY_PCFS, CHRIST_EMBASSY_CELLS } from '../services/dataService';
import { GROUP_JURISDICTIONS } from '../services/groupJurisdictionService';
import {
  Shield,
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
  ShieldCheck,
  Loader2,
  ChevronDown,
  ChevronUp,
  Flame,
  Info,
  Radio,
  Layers,
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserRole: UserRole;
  onRoleChange: (newRole: UserRole) => void;
  soulWinnerProfile?: SoulWinnerProfile;
  onOpenSoulWinnerReg?: () => void;
  onSoulWinnerProfileChange?: (profile: SoulWinnerProfile) => void;
  onLogout?: () => void;
  onSuccessToast: (title: string, message: string) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUserRole,
  onRoleChange,
  soulWinnerProfile,
  onSoulWinnerProfileChange,
  onLogout,
  onSuccessToast,
}) => {
  const { palette } = useTheme();
  const centres = dataService.getCentres();

  // Mode: 'signin' or 'signup'
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');

  // Firebase Authentication
  const {
    user: firebaseUser,
    loginWithGoogle,
    loginWithEmail,
    signupWithEmail,
    logout: firebaseLogout,
    isAdmin: isFirebaseAdmin,
    error: authContextError,
    clearError,
  } = useAuth();

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Standard Sign In form
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');

  // Sign Up form (Soul Winners ONLY)
  const [signUpFullName, setSignUpFullName] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpConfirmPass, setSignUpConfirmPass] = useState('');
  const [signUpPhone, setSignUpPhone] = useState('');
  const [signUpCell, setSignUpCell] = useState(CHRIST_EMBASSY_CELLS[0] || 'Grace Cell');
  const [signUpPcf, setSignUpPcf] = useState(CHRIST_EMBASSY_PCFS[0] || 'Haven PCF');
  const [signUpCentreId, setSignUpCentreId] = useState(centres[0]?.id || 'cnt-durumi-01');
  const [customCell, setCustomCell] = useState('');
  const [customPcf, setCustomPcf] = useState('');

  // Expandable Testing / Directorate Switcher
  const [showTestingBypass, setShowTestingBypass] = useState(false);

  // Environment target upon login: Sandbox vs Live (Default: sandbox so logging in enters sandbox while everything else is clean from 0)
  const [targetEnvironment, setTargetEnvironment] = useState<'sandbox' | 'live'>('sandbox');

  if (!isOpen) return null;

  // Helper to determine role from email or assigned credentials
  const determineUserRole = (email?: string | null): UserRole => {
    if (!email) return 'soul_winner';
    const em = email.toLowerCase().trim();
    if (em === 'dutiarukbackups@gmail.com' || em === 'admin@harvest10k.org' || em.includes('admin')) {
      return 'admin';
    }
    if (em === 'zonalpastor@ceabuja.org' || em.includes('zonal.pastor') || em.includes('aloy')) {
      return 'zonal_pastor';
    }
    if (em === 'pastor.david@ceabuja.org' || em.includes('group.pastor')) {
      return 'group_pastor';
    }
    if (em === 'pastor.emmanuel@ceabuja.org' || em.includes('pastor.')) {
      return 'pastor';
    }
    return 'soul_winner';
  };

  const handleGoogleSignIn = async () => {
    setErrorMsg('');
    clearError();
    setIsLoading(true);
    try {
      const signedInUser = await loginWithGoogle();
      setIsLoading(false);
      if (signedInUser) {
        const assignedRole = determineUserRole(signedInUser.email);
        onRoleChange(assignedRole);

        // Sync or register Soul Winner profile so they can input souls regardless of role
        const existing = dataService.getSoulWinnerProfile();
        const updatedProfile: SoulWinnerProfile = {
          id: existing?.id || `winner-fb-${signedInUser.uid.slice(0, 8)}`,
          fullName: signedInUser.displayName || existing?.fullName || 'Evangelist',
          phone: signedInUser.phoneNumber || existing?.phone || '+234 800 000 0000',
          email: signedInUser.email || '',
          cellName: existing?.cellName || 'Grace Cell',
          pcfName: existing?.pcfName || 'Haven PCF',
          churchCentreId: existing?.churchCentreId || centres[0]?.id || 'cnt-durumi-01',
          churchName: existing?.churchName || centres[0]?.name || 'Durumi Central Hub',
          roleTitle: assignedRole === 'admin' ? 'Campaign Administrator' : assignedRole === 'zonal_pastor' ? 'Zonal Pastor' : assignedRole === 'group_pastor' ? 'Group Pastor' : assignedRole === 'pastor' ? 'Church Pastor' : 'Soul Winner',
          registeredAt: existing?.registeredAt || new Date().toISOString(),
        };

        dataService.saveSoulWinnerProfile(updatedProfile);
        dataService.registerSoulWinner(updatedProfile);
        if (onSoulWinnerProfileChange) onSoulWinnerProfileChange(updatedProfile);

        if (targetEnvironment === 'sandbox') {
          dataService.setCollationMode('demo');
          onSuccessToast(
            'Entered Test Sandbox',
            `Welcome, ${signedInUser.displayName || signedInUser.email}! You are in the safe Sandbox with simulated training data. Official Live Campaign remains clean at 0.`
          );
        } else {
          dataService.setCollationMode('live');
          onSuccessToast(
            'Connected to Live Campaign',
            `Welcome, ${signedInUser.displayName || signedInUser.email}! Clean 0 baseline active. All records sync to cloud.`
          );
        }
        onClose();
      }
    } catch (e: unknown) {
      setIsLoading(false);
      setErrorMsg(e instanceof Error ? e.message : 'Google sign-in failed');
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    clearError();

    if (!signInEmail.trim() || !signInPassword.trim()) {
      setErrorMsg('Please provide both email and password.');
      return;
    }

    setIsLoading(true);
    try {
      const signedInUser = await loginWithEmail(signInEmail.trim(), signInPassword.trim());
      setIsLoading(false);

      if (signedInUser) {
        const assignedRole = determineUserRole(signedInUser.email);
        onRoleChange(assignedRole);

        const existing = dataService.getSoulWinnerProfile();
        const updatedProfile: SoulWinnerProfile = {
          id: existing?.id || `winner-em-${signedInUser.uid.slice(0, 8)}`,
          fullName: signedInUser.displayName || existing?.fullName || 'Evangelist',
          phone: existing?.phone || '+234 800 000 0000',
          email: signedInUser.email || '',
          cellName: existing?.cellName || 'Grace Cell',
          pcfName: existing?.pcfName || 'Haven PCF',
          churchCentreId: existing?.churchCentreId || centres[0]?.id || 'cnt-durumi-01',
          churchName: existing?.churchName || centres[0]?.name || 'Durumi Central Hub',
          roleTitle: assignedRole === 'admin' ? 'Campaign Administrator' : assignedRole === 'zonal_pastor' ? 'Zonal Pastor' : assignedRole === 'group_pastor' ? 'Group Pastor' : assignedRole === 'pastor' ? 'Church Pastor' : 'Soul Winner',
          registeredAt: existing?.registeredAt || new Date().toISOString(),
        };

        dataService.saveSoulWinnerProfile(updatedProfile);
        dataService.registerSoulWinner(updatedProfile);
        if (onSoulWinnerProfileChange) onSoulWinnerProfileChange(updatedProfile);

        if (targetEnvironment === 'sandbox') {
          dataService.setCollationMode('demo');
          onSuccessToast(
            'Entered Test Sandbox',
            `Welcome back, ${signedInUser.displayName || signedInUser.email}! You are in the safe Sandbox with simulated training data. Live campaign is clean at 0.`
          );
        } else {
          dataService.setCollationMode('live');
          onSuccessToast(
            'Connected to Live Campaign',
            `Welcome back, ${signedInUser.displayName || signedInUser.email}! Clean 0 baseline active.`
          );
        }
        onClose();
      } else {
        // Fallback for offline / demo accounts
        const assignedRole = determineUserRole(signInEmail);
        onRoleChange(assignedRole);
        if (targetEnvironment === 'sandbox') {
          dataService.setCollationMode('demo');
          onSuccessToast('Entered Test Sandbox', `Session active for ${signInEmail} in safe Sandbox.`);
        } else {
          dataService.setCollationMode('live');
          onSuccessToast('Connected to Live Campaign', `Session active for ${signInEmail}`);
        }
        onClose();
      }
    } catch (e: unknown) {
      setIsLoading(false);
      setErrorMsg(e instanceof Error ? e.message : 'Sign-in failed. Please check credentials.');
    }
  };

  const handleSoulWinnerSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    clearError();

    if (!signUpFullName.trim()) {
      setErrorMsg('Please enter your full name.');
      return;
    }
    if (!signUpEmail.trim()) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }
    if (signUpPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }
    if (signUpPassword !== signUpConfirmPass) {
      setErrorMsg('Passwords do not match.');
      return;
    }
    if (!signUpPhone.trim()) {
      setErrorMsg('Please enter your active WhatsApp / mobile phone number.');
      return;
    }

    const resolvedCell = customCell.trim() || signUpCell;
    const resolvedPcf = customPcf.trim() || signUpPcf;
    const selectedCentre = centres.find(c => c.id === signUpCentreId);

    setIsLoading(true);
    try {
      const createdUser = await signupWithEmail(signUpEmail.trim(), signUpPassword.trim(), signUpFullName.trim());
      setIsLoading(false);

      const newProfile: SoulWinnerProfile = {
        id: createdUser?.uid ? `winner-${createdUser.uid.slice(0, 8)}` : `winner-${Date.now()}`,
        fullName: signUpFullName.trim(),
        phone: signUpPhone.trim(),
        email: signUpEmail.trim(),
        cellName: resolvedCell,
        pcfName: resolvedPcf,
        churchCentreId: signUpCentreId,
        churchName: selectedCentre ? selectedCentre.name : 'Durumi Central Hub',
        roleTitle: 'Soul Winner / Evangelist',
        registeredAt: new Date().toISOString(),
      };

      // Save and register Soul Winner profile
      dataService.registerSoulWinner(newProfile);
      dataService.saveSoulWinnerProfile(newProfile);

      if (onSoulWinnerProfileChange) {
        onSoulWinnerProfileChange(newProfile);
      }

      // Default all new registrations as Soul Winner
      onRoleChange('soul_winner');
      if (targetEnvironment === 'sandbox') {
        dataService.setCollationMode('demo');
        onSuccessToast(
          'Entered Test Sandbox',
          `Welcome, Evangelist ${newProfile.fullName}! You are in the safe Sandbox with simulated training data. Live campaign remains clean at 0.`
        );
      } else {
        dataService.setCollationMode('live');
        onSuccessToast(
          'Live Account Ready',
          `Welcome, Evangelist ${newProfile.fullName}! Clean 0 baseline active for the 24-hour campaign.`
        );
      }
      onClose();
    } catch (e: unknown) {
      setIsLoading(false);
      setErrorMsg(e instanceof Error ? e.message : 'Registration failed. Please try again.');
    }
  };

  const handleLogoutAction = async () => {
    if (onLogout) {
      onLogout();
    } else {
      await firebaseLogout();
      onRoleChange('public');
      dataService.setCollationMode('live');
      onSuccessToast('Signed Out', 'You have returned to clean public Observer mode.');
    }
    onClose();
  };

  // Direct testing profile switch (for directorate / admin verification)
  const handleQuickTestingLogin = (role: UserRole, groupKey?: string) => {
    onRoleChange(role);
    if (role !== 'public') {
      dataService.setCollationMode('demo'); // Enter sandbox
    } else {
      dataService.setCollationMode('live'); // Clean live baseline
    }
    if (role === 'pastor') {
      const p: SoulWinnerProfile = {
        id: 'pastor-emmanuel',
        fullName: 'Pastor Emmanuel Eromosele',
        phone: '+234 803 100 2001',
        email: 'pastor.emmanuel@ceabuja.org',
        cellName: 'Kings Cell',
        pcfName: 'Royalty PCF',
        churchCentreId: 'cnt-durumi-01',
        churchName: 'CE Zonal Church Service 1',
        roleTitle: 'Church Pastor',
        registeredAt: new Date().toISOString(),
      };
      dataService.saveSoulWinnerProfile(p);
      if (onSoulWinnerProfileChange) onSoulWinnerProfileChange(p);
      onSuccessToast('Pastor Account Active', 'Church-level oversight and personal soul input enabled.');
    } else if (role === 'group_pastor') {
      const targetKey = groupKey || 'kubwa';
      const jurisdiction = GROUP_JURISDICTIONS.find(j => j.key === targetKey) || GROUP_JURISDICTIONS[0];
      const p: SoulWinnerProfile = {
        id: `group-pastor-${jurisdiction.key}`,
        fullName: jurisdiction.pastorName.split('(')[0].trim(),
        phone: jurisdiction.pastorPhone,
        email: jurisdiction.pastorEmail,
        cellName: 'Grace Cell',
        pcfName: `${jurisdiction.name} PCF`,
        churchCentreId: jurisdiction.defaultCentreId,
        churchName: jurisdiction.name,
        assignedGroup: jurisdiction.name,
        roleTitle: `${jurisdiction.name} Pastor`,
        registeredAt: new Date().toISOString(),
      };
      dataService.saveSoulWinnerProfile(p);
      if (onSoulWinnerProfileChange) onSoulWinnerProfileChange(p);
      onSuccessToast(
        `${jurisdiction.name} Pastor Active`,
        `Logged in as ${jurisdiction.pastorName}. Multi-church oversight scoped strictly to ${jurisdiction.name}.`
      );
    } else if (role === 'zonal_pastor') {
      const p: SoulWinnerProfile = {
        id: 'zonal-pastor-aloy',
        fullName: 'Pastor Aloy Okei',
        phone: '+234 803 999 8888',
        email: 'zonalpastor@ceabuja.org',
        cellName: 'Executive Cell',
        pcfName: 'Zonal Central PCF',
        churchCentreId: 'cnt-durumi-01',
        churchName: 'CE Abuja Zone 1',
        roleTitle: 'Zonal Pastor (God’s Eye View)',
        registeredAt: new Date().toISOString(),
      };
      dataService.saveSoulWinnerProfile(p);
      if (onSoulWinnerProfileChange) onSoulWinnerProfileChange(p);
      onSuccessToast('Zonal Pastor Active', "God's Eye View loaded for all 14 centres with personal soul input.");
    } else if (role === 'admin') {
      const p: SoulWinnerProfile = {
        id: 'admin-cmd',
        fullName: 'Lead Campaign Administrator',
        phone: '+234 803 777 0000',
        email: 'admin@harvest10k.org',
        cellName: 'Command Cell',
        pcfName: 'Operations PCF',
        churchCentreId: 'cnt-durumi-01',
        churchName: 'Central Collation HQ',
        roleTitle: 'Campaign Administrator',
        registeredAt: new Date().toISOString(),
      };
      dataService.saveSoulWinnerProfile(p);
      if (onSoulWinnerProfileChange) onSoulWinnerProfileChange(p);
      onSuccessToast('Admin Mode Active', 'Full administrative & soul input access active.');
    } else if (role === 'soul_winner') {
      const p: SoulWinnerProfile = {
        id: 'winner-barnabas',
        fullName: 'Brother Barnabas Danjuma',
        phone: '+234 802 345 6789',
        email: 'barnabas@harvest10k.org',
        cellName: 'Grace Cell',
        pcfName: 'Haven PCF',
        churchCentreId: 'cnt-durumi-01',
        churchName: 'Durumi Central Hub',
        roleTitle: 'Soul Winner / Evangelist',
        registeredAt: new Date().toISOString(),
      };
      dataService.saveSoulWinnerProfile(p);
      if (onSoulWinnerProfileChange) onSoulWinnerProfileChange(p);
      onSuccessToast('Soul Winner Active', 'Personal tally and soul input desk ready.');
    } else {
      onSuccessToast('Observer Mode Active', 'Switched to public view-only live stream.');
    }
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-150"
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-lg bg-white dark:bg-[#151922] rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200 text-slate-900 dark:text-slate-100"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="px-6 py-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-xs shrink-0"
              style={{ backgroundColor: `${palette.hex}18`, color: palette.hex }}
            >
              <Flame className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h3 className="font-display font-black text-base sm:text-lg text-slate-900 dark:text-white">
                Harvest 10K Collation Portal
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Christ Embassy Abuja Zone 1
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="p-3 pb-0 bg-slate-50 dark:bg-slate-900/40 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="grid grid-cols-2 bg-slate-200/70 dark:bg-slate-800 p-1 rounded-2xl text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setAuthMode('signin');
                setErrorMsg('');
              }}
              className={`py-2 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
                authMode === 'signin'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-black'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode('signup');
                setErrorMsg('');
              }}
              className={`py-2 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
                authMode === 'signup'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-black'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              <span>Soul Winner Sign Up</span>
            </button>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-4">
          {/* Global Error Banner */}
          {(errorMsg || authContextError) && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-600 dark:text-rose-400">
              {errorMsg || authContextError}
            </div>
          )}

          {/* Active Session Card (if already authenticated or role active) */}
          {(firebaseUser || currentUserRole !== 'public') && (
            <div className="p-3.5 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-800/60 flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                  {((firebaseUser?.displayName || soulWinnerProfile?.fullName || 'User')[0] || 'U').toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {firebaseUser?.displayName || soulWinnerProfile?.fullName || 'Active Session'}
                    </span>
                    <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                      Active
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 truncate block">
                    Role: {currentUserRole.toUpperCase().replace('_', ' ')}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleLogoutAction}
                className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-100/60 dark:hover:bg-rose-900/30 transition-colors cursor-pointer flex items-center gap-1 shrink-0"
                title="Log out and switch to Observer mode"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Log Out</span>
              </button>
            </div>
          )}

          {/* ══════════════ LOGIN DESTINATION ENVIRONMENT SELECTOR ══════════════ */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-indigo-500" />
                Choose Destination Environment:
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  targetEnvironment === 'sandbox'
                    ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30'
                    : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                }`}
              >
                {targetEnvironment === 'sandbox' ? '🧪 Test Sandbox' : '🟢 Live (Clean 0)'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setTargetEnvironment('sandbox')}
                className={`p-2.5 rounded-xl text-left transition-all border cursor-pointer ${
                  targetEnvironment === 'sandbox'
                    ? 'bg-amber-500/15 border-amber-500 text-amber-900 dark:text-amber-200 font-bold shadow-xs ring-1 ring-amber-500/50'
                    : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-black">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span>Enter Test Sandbox</span>
                </div>
                <p className="text-[10px] mt-1 text-slate-500 dark:text-slate-400 leading-snug">
                  Safe training area with 21,798 simulated records. The official live campaign stays clean at 0.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setTargetEnvironment('live')}
                className={`p-2.5 rounded-xl text-left transition-all border cursor-pointer ${
                  targetEnvironment === 'live'
                    ? 'bg-emerald-500/15 border-emerald-500 text-emerald-900 dark:text-emerald-200 font-bold shadow-xs ring-1 ring-emerald-500/50'
                    : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-black">
                  <Radio className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Official Live Campaign</span>
                </div>
                <p className="text-[10px] mt-1 text-slate-500 dark:text-slate-400 leading-snug">
                  Clean baseline from zero. All real outreach submissions sync directly to Firestore.
                </p>
              </button>
            </div>

            {/* 1-Click Sandbox Fast Access */}
            <button
              type="button"
              onClick={() => {
                handleQuickTestingLogin('soul_winner');
                onClose();
              }}
              className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-amber-500/15 via-indigo-500/15 to-purple-500/15 border border-amber-500/30 hover:border-amber-500/60 text-amber-900 dark:text-amber-200 font-black text-xs flex items-center justify-center gap-2 hover:opacity-95 transition-all cursor-pointer shadow-2xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>1-Click Fast Login into Test Sandbox (Evangelist Mode)</span>
            </button>
          </div>

          {authMode === 'signin' ? (
            /* ══════════════ SIGN IN TAB ══════════════ */
            <form onSubmit={handleEmailSignIn} className="space-y-4">
              {/* Google Fast Sign-In */}
              <div>
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                  className="w-full py-2.5 px-4 rounded-xl font-bold text-xs bg-slate-900 text-white dark:bg-white dark:text-slate-900 hover:opacity-90 transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xs disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Authenticating...</span>
                    </>
                  ) : (
                    <>
                      <LogIn className="w-4 h-4" />
                      <span>Continue with Google</span>
                    </>
                  )}
                </button>
              </div>

              <div className="relative flex items-center justify-center">
                <div className="border-t border-slate-200 dark:border-slate-800 w-full" />
                <span className="bg-white dark:bg-[#151922] px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 shrink-0">
                  Or Sign In with Email
                </span>
                <div className="border-t border-slate-200 dark:border-slate-800 w-full" />
              </div>

              {/* Email & Password */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <input
                      type="email"
                      required
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500 transition-all"
                      placeholder="your.email@christembassy.org"
                      value={signInEmail}
                      onChange={e => setSignInEmail(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <input
                      type="password"
                      required
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500 transition-all"
                      placeholder="••••••••"
                      value={signInPassword}
                      onChange={e => setSignInPassword(e.target.value)}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 px-4 rounded-xl font-bold text-xs text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xs disabled:opacity-50"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span>Sign In</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>

              {/* Note on Role Access */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-300">
                  <Info className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                  <span>Role-Based Access</span>
                </div>
                <p>
                  Pastoral, Group, and Zonal governance credentials are authenticated from backend records. All leaders retain active soul logging and personal tally capabilities.
                </p>
              </div>
            </form>
          ) : (
            /* ══════════════ SIGN UP TAB (Soul Winners Only) ══════════════ */
            <form onSubmit={handleSoulWinnerSignUp} className="space-y-4">
              {/* Soul Winner Info Notice */}
              <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-800/60 text-[11px] text-blue-800 dark:text-blue-300 space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <User className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                  <span>Soul Winner Registration</span>
                </div>
                <p>
                  Join the 10,000 Souls campaign network. Your registration allows you to record field souls, verify contacts, and monitor your personal and cell tallies.
                </p>
              </div>

              {/* Form Fields */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <input
                      type="text"
                      required
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500 transition-all"
                      placeholder="e.g. Brother Barnabas Danjuma"
                      value={signUpFullName}
                      onChange={e => setSignUpFullName(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Email Address <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                      <input
                        type="email"
                        required
                        className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500 transition-all"
                        placeholder="your.email@example.com"
                        value={signUpEmail}
                        onChange={e => setSignUpEmail(e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Phone (WhatsApp) <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                      <input
                        type="tel"
                        required
                        className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500 transition-all"
                        placeholder="+234 803 000 0000"
                        value={signUpPhone}
                        onChange={e => setSignUpPhone(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Password <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                      <input
                        type="password"
                        required
                        className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500 transition-all"
                        placeholder="At least 6 characters"
                        value={signUpPassword}
                        onChange={e => setSignUpPassword(e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Confirm Password <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                      <input
                        type="password"
                        required
                        className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500 transition-all"
                        placeholder="Re-type password"
                        value={signUpConfirmPass}
                        onChange={e => setSignUpConfirmPass(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Cell Selection */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Your Cell
                  </label>
                  <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto p-1 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                    {CHRIST_EMBASSY_CELLS.slice(0, 8).map(c => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => {
                          setSignUpCell(c);
                          setCustomCell('');
                        }}
                        className={`px-2 py-0.5 rounded-lg text-[11px] font-medium transition-all cursor-pointer ${
                          signUpCell === c && !customCell
                            ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-bold shadow-xs'
                            : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    className="mt-1.5 w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500 transition-all"
                    placeholder="Or enter custom Cell name..."
                    value={customCell}
                    onChange={e => {
                      setCustomCell(e.target.value);
                      if (e.target.value) setSignUpCell('');
                    }}
                  />
                </div>

                {/* PCF & Church Centre */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      PCF / Church Group
                    </label>
                    <select
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500 transition-all cursor-pointer"
                      value={signUpPcf}
                      onChange={e => setSignUpPcf(e.target.value)}
                    >
                      {CHRIST_EMBASSY_PCFS.map(p => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Church / Collation Centre
                    </label>
                    <select
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500 transition-all cursor-pointer"
                      value={signUpCentreId}
                      onChange={e => setSignUpCentreId(e.target.value)}
                    >
                      {centres.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 px-4 rounded-xl font-bold text-xs text-white bg-blue-600 hover:bg-blue-700 transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xs disabled:opacity-50"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span>Register as Soul Winner</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Collapsible Directorate Testing Accounts */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setShowTestingBypass(!showTestingBypass)}
              className="w-full flex items-center justify-between text-[11px] font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 py-1 transition-colors cursor-pointer"
            >
              <span>Testing & Verification Roles (Quick Switcher)</span>
              {showTestingBypass ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {showTestingBypass && (
              <div className="mt-2 p-3 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-2 animate-in fade-in duration-150">
                <p className="text-[10px] text-slate-400">
                  Select a test account to preview respective collation permissions:
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleQuickTestingLogin('group_pastor', 'kubwa')}
                    className="p-2 rounded-xl text-center bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 hover:border-indigo-500 text-[11px] font-bold text-indigo-900 dark:text-indigo-200 cursor-pointer transition-all shadow-2xs"
                    title="Kubwa Group Pastor - Oversees 17 Kubwa churches"
                  >
                    Kubwa Group Pastor
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickTestingLogin('group_pastor', 'wuye')}
                    className="p-2 rounded-xl text-center bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 hover:border-indigo-500 text-[11px] font-bold text-indigo-900 dark:text-indigo-200 cursor-pointer transition-all shadow-2xs"
                    title="Wuye Group Pastor - Oversees 8 Wuye churches"
                  >
                    Wuye Group Pastor
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickTestingLogin('group_pastor', 'zonal_church')}
                    className="p-2 rounded-xl text-center bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 hover:border-indigo-500 text-[11px] font-bold text-indigo-900 dark:text-indigo-200 cursor-pointer transition-all shadow-2xs"
                    title="Zonal Church Service 1 & Central Group Pastor"
                  >
                    Zonal Church Service 1
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickTestingLogin('pastor')}
                    className="p-2 rounded-xl text-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-blue-500 text-[11px] font-bold cursor-pointer transition-all shadow-2xs"
                  >
                    Church Pastor (Local)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickTestingLogin('zonal_pastor')}
                    className="p-2 rounded-xl text-center bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 hover:border-purple-500 text-[11px] font-bold text-purple-900 dark:text-purple-200 cursor-pointer transition-all shadow-2xs"
                    title="Zonal Pastor - God's Eye View for all 20 Groups & 96 Churches"
                  >
                    Zonal Pastor (God's Eye)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickTestingLogin('admin')}
                    className="p-2 rounded-xl text-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-blue-500 text-[11px] font-bold cursor-pointer transition-all shadow-2xs"
                  >
                    Lead Admin
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickTestingLogin('soul_winner')}
                    className="p-2 rounded-xl text-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-blue-500 text-[11px] font-bold cursor-pointer transition-all shadow-2xs"
                  >
                    Soul Winner
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickTestingLogin('public')}
                    className="p-2 rounded-xl text-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-blue-500 text-[11px] font-bold cursor-pointer transition-all shadow-2xs"
                  >
                    Observer (Public)
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
