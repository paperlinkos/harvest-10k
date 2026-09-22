import React, { useState, useEffect } from 'react';
import { SoulWinnerProfile } from '../types';
import { dataService, CHRIST_EMBASSY_PCFS, CHRIST_EMBASSY_CELLS } from '../services/dataService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSaved: (profile: SoulWinnerProfile) => void;
}

const ROLE_OPTIONS = [
  'Member',
  'Cell Leader',
  'Assistant Cell Leader',
  'BSCT',
  'PCF Leader',
  'Deacon/Deaconess',
  'Evangelist',
  'Minister',
  'Pastor',
];

export const SoulWinnerRegistrationModal: React.FC<Props> = ({ isOpen, onClose, onSaved }) => {
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
    if (Object.keys(e).length > 0) { setErrors(e); return; }

    const profile: SoulWinnerProfile = {
      id: existing.id || `winner-${Date.now()}`,
      fullName: fullName.trim(),
      phone: phone.trim(),
      email: email.trim() || undefined,
      cellName: resolvedCell,
      pcfName: resolvedPcf,
      churchCentreId,
      churchName: selectedCentre?.name,
      roleTitle,
      registeredAt: existing.registeredAt || new Date().toISOString(),
    };

    dataService.saveSoulWinnerProfile(profile);
    setSaved(true);
    setTimeout(() => {
      onSaved(profile);
      onClose();
    }, 800);
  };

  return (
    <div className="sw-reg-overlay" onClick={(e) => { if ((e.target as HTMLElement).classList.contains('sw-reg-overlay')) onClose(); }}>
      <div className="sw-reg-modal">
        <div className="sw-reg-header">
          <div className="sw-reg-header-icon">👤</div>
          <div>
            <h2 className="sw-reg-title">Soul Winner Profile</h2>
            <p className="sw-reg-subtitle">Your details auto-fill every convert card — no re-typing in the field</p>
          </div>
          <button className="sw-reg-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div className="sw-reg-body">
          {/* Personal Info */}
          <section className="sw-reg-section">
            <h3 className="sw-reg-section-title">📋 Personal Details</h3>
            <div className="sw-reg-grid-2">
              <div className="sw-reg-field">
                <label className="sw-reg-label">Full Name *</label>
                <input
                  className={`sw-reg-input ${errors.fullName ? 'sw-reg-input-error' : ''}`}
                  value={fullName}
                  onChange={e => { setFullName(e.target.value); setErrors(prev => ({ ...prev, fullName: '' })); }}
                  placeholder="e.g. Evangelist Chiamaka Okafor"
                  autoFocus
                />
                {errors.fullName && <p className="sw-reg-error">{errors.fullName}</p>}
              </div>
              <div className="sw-reg-field">
                <label className="sw-reg-label">Phone Number *</label>
                <input
                  className={`sw-reg-input ${errors.phone ? 'sw-reg-input-error' : ''}`}
                  value={phone}
                  onChange={e => { setPhone(e.target.value); setErrors(prev => ({ ...prev, phone: '' })); }}
                  placeholder="+234 803 000 0000"
                  type="tel"
                />
                {errors.phone && <p className="sw-reg-error">{errors.phone}</p>}
              </div>
              <div className="sw-reg-field">
                <label className="sw-reg-label">Email (optional)</label>
                <input
                  className="sw-reg-input"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="your.email@christembassy.org"
                  type="email"
                />
              </div>
              <div className="sw-reg-field">
                <label className="sw-reg-label">Role / Title</label>
                <select className="sw-reg-input" value={roleTitle} onChange={e => setRoleTitle(e.target.value)}>
                  {ROLE_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            </div>
          </section>

          {/* Cell */}
          <section className="sw-reg-section">
            <h3 className="sw-reg-section-title">🔵 Your Cell</h3>
            {errors.cell && <p className="sw-reg-error sw-reg-error-block">{errors.cell}</p>}
            <div className="sw-reg-pills">
              {CHRIST_EMBASSY_CELLS.map(c => (
                <button
                  key={c}
                  className={`sw-reg-pill ${cellName === c && !customCell ? 'sw-reg-pill-active' : ''}`}
                  onClick={() => { setCellName(c); setCustomCell(''); setErrors(prev => ({ ...prev, cell: '' })); }}
                  type="button"
                >
                  {c}
                </button>
              ))}
            </div>
            <div className="sw-reg-field" style={{ marginTop: '0.75rem' }}>
              <label className="sw-reg-label">Or type custom Cell name</label>
              <input
                className="sw-reg-input"
                value={customCell}
                onChange={e => { setCustomCell(e.target.value); if (e.target.value) setCellName(''); setErrors(prev => ({ ...prev, cell: '' })); }}
                placeholder="Enter your Cell name..."
              />
            </div>
            {(resolvedCell) && (
              <div className="sw-reg-selected-badge">
                ✅ Cell: <strong>{resolvedCell}</strong>
              </div>
            )}
          </section>

          {/* PCF */}
          <section className="sw-reg-section">
            <h3 className="sw-reg-section-title">🟣 Your PCF / Church Group</h3>
            {errors.pcf && <p className="sw-reg-error sw-reg-error-block">{errors.pcf}</p>}
            <div className="sw-reg-pills">
              {CHRIST_EMBASSY_PCFS.map(p => (
                <button
                  key={p}
                  className={`sw-reg-pill ${pcfName === p && !customPcf ? 'sw-reg-pill-active sw-reg-pill-pcf' : 'sw-reg-pill-pcf-outline'}`}
                  onClick={() => { setPcfName(p); setCustomPcf(''); setErrors(prev => ({ ...prev, pcf: '' })); }}
                  type="button"
                >
                  {p}
                </button>
              ))}
            </div>
            <div className="sw-reg-field" style={{ marginTop: '0.75rem' }}>
              <label className="sw-reg-label">Or type custom PCF name</label>
              <input
                className="sw-reg-input"
                value={customPcf}
                onChange={e => { setCustomPcf(e.target.value); if (e.target.value) setPcfName(''); setErrors(prev => ({ ...prev, pcf: '' })); }}
                placeholder="Enter your PCF / Church Group name..."
              />
            </div>
            {(resolvedPcf) && (
              <div className="sw-reg-selected-badge sw-reg-selected-badge-pcf">
                ✅ PCF: <strong>{resolvedPcf}</strong>
              </div>
            )}
          </section>

          {/* Church / Collation Centre */}
          <section className="sw-reg-section">
            <h3 className="sw-reg-section-title">🏛️ Church / Collation Centre *</h3>
            {errors.centre && <p className="sw-reg-error sw-reg-error-block">{errors.centre}</p>}
            <select
              className={`sw-reg-input ${errors.centre ? 'sw-reg-input-error' : ''}`}
              value={churchCentreId}
              onChange={e => { setChurchCentreId(e.target.value); setErrors(prev => ({ ...prev, centre: '' })); }}
            >
              <option value="">— Select your Church / Collation Centre —</option>
              {centres.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </section>
        </div>

        <div className="sw-reg-footer">
          <button className="sw-reg-btn-cancel" onClick={onClose}>Cancel</button>
          <button className="sw-reg-btn-save" onClick={handleSave} disabled={saved}>
            {saved ? '✅ Profile Saved!' : '💾 Save My Profile'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SoulWinnerRegistrationModal;
