import React, { useState, useEffect } from 'react';
import { SoulWinnerProfile } from '../types';
import { dataService, CHRIST_EMBASSY_PCFS, CHRIST_EMBASSY_CELLS } from '../services/dataService';
import { User, X, Check, Building2, Phone, Mail, Sparkles, CheckCircle2, Bookmark, LogOut } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSaved: (profile: SoulWinnerProfile) => void;
  onLogout?: () => void;
}

const ROLE_OPTIONS = [
  'Member',
  'Cell Leader',
  'Assistant Cell Leader',
  'BSCT',
  'PCF Leader',
  'Deacon / Deaconess',
  'Evangelist',
  'Minister',
  'Pastor',
  'Group Pastor',
  'Zonal Pastor',
];

export const SoulWinnerRegistrationModal: React.FC<Props> = ({ isOpen, onClose, onSaved, onLogout }) => {
  const { palette } = useTheme();
  const existing = dataService.getSoulWinnerProfile();
  const centres = dataService.getCentres();

  const [fullName, setFullName] = useState(existing.fullName || '');
  const [phone, setPhone] = useState(existing.phone || '');
  const [email, setEmail] = useState(existing.email || '');
  const [cellName, setCellName] = useState(existing.cellName || '');
  const [pcfName, setPcfName] = useState(existing.pcfName || '');
  const [churchCentreId, setChurchCentreId] = useState(existing.churchCentreId || (centres[0]?.id || ''));
  const [roleTitle, setRoleTitle] = useState(existing.roleTitle || 'Member');
  const [customCell, setCustomCell] = useState('');
  const [customPcf, setCustomPcf] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const p = dataService.getSoulWinnerProfile();
      setFullName(p.fullName || '');
      setPhone(p.phone || '');
      setEmail(p.email || '');
      setCellName(p.cellName || '');
      setPcfName(p.pcfName || '');
      setChurchCentreId(p.churchCentreId || (centres[0]?.id || ''));
      setRoleTitle(p.roleTitle || 'Member');
      setCustomCell('');
      setCustomPcf('');
      setErrors({});
      setSaved(false);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const validate = () => {
    const e: Record<string, string> = {};
    if (!fullName.trim()) e.fullName = 'Full name is required';
    if (!phone.trim()) e.phone = 'Phone number is required';
    if (!cellName.trim() && !customCell.trim()) e.cell = 'Select or enter your Cell name';
    if (!pcfName.trim() && !customPcf.trim()) e.pcf = 'Select or enter your PCF / Church Group';
    if (!churchCentreId) e.centre = 'Select your Church / Collation Centre';
    return e;
  };

  const resolvedCell = customCell.trim() || cellName;
  const resolvedPcf = customPcf.trim() || pcfName;
  const selectedCentre = centres.find(c => c.id === churchCentreId);

  const handleSave = () => {
    const e = validate();
    if (Object.keys(e).length > 0) {
      setErrors(e);
      return;
    }

    const profile: SoulWinnerProfile = {
      id: existing.id || `winner-${Date.now()}`,
      fullName: fullName.trim(),
      phone: phone.trim(),
      email: email.trim() || undefined,
      cellName: resolvedCell,
      pcfName: resolvedPcf,
      churchCentreId,
      churchName: selectedCentre?.name || 'Durumi Central Hub',
      roleTitle,
      registeredAt: existing.registeredAt || new Date().toISOString(),
    };

    dataService.saveSoulWinnerProfile(profile);
    dataService.registerSoulWinner(profile);
    setSaved(true);
    setTimeout(() => {
      onSaved(profile);
      onClose();
    }, 600);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200"
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-xl bg-white dark:bg-[#151922] rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200 text-slate-900 dark:text-slate-100"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="px-6 py-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-xs shrink-0"
              style={{ backgroundColor: `${palette.hex}18`, color: palette.hex }}
            >
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display font-black text-base sm:text-lg text-slate-900 dark:text-white">
                Soul Winner Profile
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Your credentials auto-fill every field convert card
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 space-y-5 overflow-y-auto custom-scrollbar flex-1">
          {/* Section 1: Personal Details */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-slate-400">
                Personal Details
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    className={`w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/60 border text-slate-900 dark:text-slate-100 focus:outline-none transition-all ${
                      errors.fullName
                        ? 'border-rose-500 ring-1 ring-rose-500'
                        : 'border-slate-200 dark:border-slate-700 focus:border-blue-500'
                    }`}
                    value={fullName}
                    onChange={e => {
                      setFullName(e.target.value);
                      setErrors(prev => ({ ...prev, fullName: '' }));
                    }}
                    placeholder="e.g. Brother Barnabas Danjuma"
                    autoFocus
                  />
                </div>
                {errors.fullName && (
                  <p className="text-[10px] text-rose-500 mt-1">{errors.fullName}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Phone Number <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    className={`w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/60 border text-slate-900 dark:text-slate-100 focus:outline-none transition-all ${
                      errors.phone
                        ? 'border-rose-500 ring-1 ring-rose-500'
                        : 'border-slate-200 dark:border-slate-700 focus:border-blue-500'
                    }`}
                    value={phone}
                    onChange={e => {
                      setPhone(e.target.value);
                      setErrors(prev => ({ ...prev, phone: '' }));
                    }}
                    placeholder="+234 803 000 0000"
                    type="tel"
                  />
                </div>
                {errors.phone && (
                  <p className="text-[10px] text-rose-500 mt-1">{errors.phone}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Email Address (Optional)
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500 transition-all"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="your.email@ceabuja.org"
                    type="email"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Church Designation / Role Title
                </label>
                <select
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500 transition-all cursor-pointer"
                  value={roleTitle}
                  onChange={e => setRoleTitle(e.target.value)}
                >
                  {ROLE_OPTIONS.map(r => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Cell Selection */}
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black uppercase tracking-wider text-slate-400">
                Your Cell <span className="text-rose-500">*</span>
              </label>
              {resolvedCell && (
                <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-800">
                  Selected: {resolvedCell}
                </span>
              )}
            </div>
            {errors.cell && <p className="text-[10px] text-rose-500">{errors.cell}</p>}

            <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-1 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-200/60 dark:border-slate-800">
              {CHRIST_EMBASSY_CELLS.map(c => {
                const isSelected = cellName === c && !customCell;
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => {
                      setCellName(c);
                      setCustomCell('');
                      setErrors(prev => ({ ...prev, cell: '' }));
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs font-bold'
                        : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-400'
                    }`}
                  >
                    {c}
                  </button>
                );
              })}
            </div>

            <div className="pt-1">
              <input
                className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500 transition-all placeholder:text-slate-400"
                value={customCell}
                onChange={e => {
                  setCustomCell(e.target.value);
                  if (e.target.value) setCellName('');
                  setErrors(prev => ({ ...prev, cell: '' }));
                }}
                placeholder="Or type custom Cell name..."
              />
            </div>
          </div>

          {/* Section 3: PCF / Church Group */}
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black uppercase tracking-wider text-slate-400">
                Your PCF / Church Group <span className="text-rose-500">*</span>
              </label>
              {resolvedPcf && (
                <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-2 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800">
                  Selected: {resolvedPcf}
                </span>
              )}
            </div>
            {errors.pcf && <p className="text-[10px] text-rose-500">{errors.pcf}</p>}

            <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-1 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-200/60 dark:border-slate-800">
              {CHRIST_EMBASSY_PCFS.map(p => {
                const isSelected = pcfName === p && !customPcf;
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => {
                      setPcfName(p);
                      setCustomPcf('');
                      setErrors(prev => ({ ...prev, pcf: '' }));
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-xs font-bold'
                        : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-400'
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
            </div>

            <div className="pt-1">
              <input
                className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500 transition-all placeholder:text-slate-400"
                value={customPcf}
                onChange={e => {
                  setCustomPcf(e.target.value);
                  if (e.target.value) setPcfName('');
                  setErrors(prev => ({ ...prev, pcf: '' }));
                }}
                placeholder="Or type custom PCF / Church Group name..."
              />
            </div>
          </div>

          {/* Section 4: Church / Collation Centre */}
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
            <label className="block text-xs font-black uppercase tracking-wider text-slate-400">
              Church / Collation Centre <span className="text-rose-500">*</span>
            </label>
            {errors.centre && <p className="text-[10px] text-rose-500">{errors.centre}</p>}
            <div className="relative">
              <Building2 className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <select
                className={`w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/60 border text-slate-900 dark:text-slate-100 focus:outline-none transition-all cursor-pointer ${
                  errors.centre
                    ? 'border-rose-500 ring-1 ring-rose-500'
                    : 'border-slate-200 dark:border-slate-700 focus:border-blue-500'
                }`}
                value={churchCentreId}
                onChange={e => {
                  setChurchCentreId(e.target.value);
                  setErrors(prev => ({ ...prev, centre: '' }));
                }}
              >
                <option value="">— Select your Church / Collation Centre —</option>
                {centres.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.locality || c.ward})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between gap-3 shrink-0">
          <div>
            {onLogout && (
              <button
                type="button"
                onClick={() => {
                  onLogout();
                  onClose();
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/50 border border-rose-200/60 dark:border-rose-900/50 transition-colors cursor-pointer"
                title="Log out of this profile and return to Observer mode"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Log Out</span>
              </button>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saved}
              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 shadow-sm transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
            >
              {saved ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
                  <span>Profile Saved!</span>
                </>
              ) : (
                <>
                  <Bookmark className="w-4 h-4" />
                  <span>Save Profile</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SoulWinnerRegistrationModal;
