import React, { useState, useEffect } from 'react';
import { dataService } from '../services/dataService';
import { UserRole, Campaign, Centre, CollationMode } from '../types';
import { useTheme } from '../context/ThemeContext';
import {
  Settings,
  Target,
  Building2,
  Bell,
  ShieldCheck,
  Save,
  Plus,
  Trash2,
  Clock,
  Sparkles,
  Database,
  Radio,
  RefreshCw,
} from 'lucide-react';

interface AdminScreenProps {
  userRole: UserRole;
  theme?: 'dark' | 'light';
  onSuccessToast: (title: string, message: string) => void;
}

export const AdminScreen: React.FC<AdminScreenProps> = ({
  userRole,
  onSuccessToast,
}) => {
  const { palette } = useTheme();
  const [campaign, setCampaign] = useState<Campaign>(dataService.getCampaign());
  const [name, setName] = useState(campaign.name);
  const [target, setTarget] = useState(campaign.target);
  const [verse, setVerse] = useState(campaign.verse);
  const [announcement, setAnnouncement] = useState(campaign.announcement || '');
  const [verificationRequired, setVerificationRequired] = useState(
    campaign.verificationRequired
  );

  const [centres, setCentres] = useState<Centre[]>(dataService.getCentres());
  const [collationMode, setCollationMode] = useState<CollationMode>(dataService.getCollationMode());
  const [liveCount, setLiveCount] = useState<number>(dataService.getLiveRecordsCount());
  const [demoCount, setDemoCount] = useState<number>(dataService.getDemoRecordsCount());
  const [showAddCentre, setShowAddCentre] = useState(false);
  const [newCentreName, setNewCentreName] = useState('');
  const [newCentreCode, setNewCentreCode] = useState('');
  const [newCentreCoordinator, setNewCentreCoordinator] = useState('');
  const [newCentrePhone, setNewCentrePhone] = useState('+234 ');
  const [newCentreTarget, setNewCentreTarget] = useState(500);

  useEffect(() => {
    const unsub = dataService.subscribe(() => {
      const c = dataService.getCampaign();
      setCampaign(c);
      setCentres(dataService.getCentres());
      setCollationMode(dataService.getCollationMode());
      setLiveCount(dataService.getLiveRecordsCount());
      setDemoCount(dataService.getDemoRecordsCount());
    });
    return unsub;
  }, []);

  const handleSwitchMode = (mode: CollationMode) => {
    dataService.setCollationMode(mode);
    setCollationMode(mode);
    onSuccessToast(
      mode === 'live' ? 'Live Campaign Active' : 'Demo Sandbox Active',
      mode === 'live'
        ? 'Switched to official live collation mode. Data will save to Cloud Firestore.'
        : 'Switched to training demo sandbox.'
    );
  };

  const handleResetDemo = () => {
    if (window.confirm('Reset Demo Sandbox to 21,798 sample records across 96 churches?')) {
      dataService.resetDemoData();
      onSuccessToast('Demo Data Reset', 'Simulated records restored to default.');
    }
  };

  const handleClearLive = () => {
    if (window.confirm('Reset Live Crusade session to 0 souls? This is intended for official campaign launch day.')) {
      dataService.clearLiveData();
      onSuccessToast('Clean Live Session Ready', 'Live souls reset to 0.');
    }
  };

  const handleSaveCampaign = (e: React.FormEvent) => {
    e.preventDefault();
    const ok = dataService.updateCampaign({
      name,
      target: Number(target),
      verse,
      announcement,
      verificationRequired,
    });
    if (ok) {
      onSuccessToast('Campaign Settings Saved', 'Harvest parameters updated successfully.');
    }
  };

  const handleAddCentre = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCentreName.trim()) return;

    dataService.addCentre({
      name: newCentreName.trim(),
      code: newCentreCode.trim() || 'HUB-NEW',
      coordinatorName: newCentreCoordinator.trim() || 'Coordinator',
      contactPhone: newCentrePhone.trim(),
      target: Number(newCentreTarget) || 500,
      areaCouncilId: 'municipal',
      venue: 'Abuja Hub',
      active: true,
    });

    onSuccessToast('Collation Hub Added', `${newCentreName} registered for collation.`);
    setNewCentreName('');
    setNewCentreCode('');
    setNewCentreCoordinator('');
    setNewCentrePhone('+234 ');
    setShowAddCentre(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
        <div className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <h1 className="text-xl font-black text-slate-900 dark:text-white">
            Campaign Administration & System Settings
          </h1>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Configure central collation campaign targets, Scripture theme, ticker announcements, and regional centres.
        </p>
      </div>

      {/* Collation Environment & Database Modes */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <span className={`p-2 rounded-xl ${collationMode === 'live' ? 'bg-emerald-500/15 text-emerald-600' : 'bg-amber-500/15 text-amber-600'}`}>
              <Database className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white">
                Collation Environment & Database Modes
              </h2>
              <span className="text-xs text-slate-400">
                Active Mode: <strong className={collationMode === 'live' ? 'text-emerald-600 font-bold' : 'text-amber-600 font-bold'}>
                  {collationMode === 'live' ? '🟢 Official Live Collation (Cloud Connected)' : '🧪 Demo / Training Sandbox (Simulated Data)'}
                </strong>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleSwitchMode('demo')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                collationMode === 'demo'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 inline mr-1" />
              Demo Sandbox ({demoCount.toLocaleString()})
            </button>
            <button
              type="button"
              onClick={() => handleSwitchMode('live')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                collationMode === 'live'
                  ? 'bg-emerald-600 text-white font-black shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              <Radio className="w-3.5 h-3.5 inline mr-1" />
              Live Collation ({liveCount.toLocaleString()})
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-900 dark:text-slate-100">
              <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                <Sparkles className="w-4 h-4" /> Demo Sandbox Environment
              </span>
              <span className="font-mono text-slate-500">{demoCount.toLocaleString()} records</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Safe testing sandbox with simulated souls across 96 churches. Great for rehearsal, orientation, and testing Group Pastor views.
            </p>
            <button
              type="button"
              onClick={handleResetDemo}
              className="py-1.5 px-3 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 hover:bg-amber-200 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Reset Demo Sandbox to Default
            </button>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-900 dark:text-slate-100">
              <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                <Radio className="w-4 h-4" /> Official Live Collation Database
              </span>
              <span className="font-mono text-slate-500">{liveCount.toLocaleString()} souls</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Connected to Cloud Firestore (Database: <code className="font-mono text-[10px]">ai-studio-harvest10k</code>). Live entries update all church projector screens and leaderboards in real time.
            </p>
            <button
              type="button"
              onClick={handleClearLive}
              className="py-1.5 px-3 rounded-lg border border-rose-300 dark:border-rose-800 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" /> Start Clean Live Campaign (0 Souls)
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Campaign Parameters Form */}
        <div className="lg:col-span-6 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <Target className="w-4 h-4 text-amber-500" />
            <span>Campaign Parameters</span>
          </h3>

          <form onSubmit={handleSaveCampaign} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Campaign Title
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-3 py-2 text-xs focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Total Souls Target Goal
              </label>
              <input
                type="number"
                value={target}
                onChange={e => setTarget(Number(e.target.value))}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-3 py-2 text-xs font-mono focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Theme Scripture Verse
              </label>
              <input
                type="text"
                value={verse}
                onChange={e => setVerse(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-3 py-2 text-xs focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Broadcast Announcement Ticker
              </label>
              <textarea
                rows={2}
                value={announcement}
                onChange={e => setAnnouncement(e.target.value)}
                placeholder="Broadcast banner shown to field teams..."
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-3 py-2 text-xs focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="verification-req"
                checked={verificationRequired}
                onChange={e => setVerificationRequired(e.target.checked)}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
              <label
                htmlFor="verification-req"
                className="text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer"
              >
                Require Coordinator Verification for Field Submissions
              </label>
            </div>

            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-bold text-xs flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Save Changes</span>
            </button>
          </form>
        </div>

        {/* Collation Centres Management */}
        <div className="lg:col-span-6 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Building2 className="w-4 h-4 text-indigo-500" />
              <span>Collation Hubs ({centres.length})</span>
            </h3>
            <button
              onClick={() => setShowAddCentre(!showAddCentre)}
              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{showAddCentre ? 'Cancel' : 'Add Hub'}</span>
            </button>
          </div>

          {showAddCentre && (
            <form onSubmit={handleAddCentre} className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  required
                  placeholder="Centre Name"
                  value={newCentreName}
                  onChange={e => setNewCentreName(e.target.value)}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg px-2.5 py-1.5 text-xs focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="Code (e.g. AMAC-04)"
                  value={newCentreCode}
                  onChange={e => setNewCentreCode(e.target.value)}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg px-2.5 py-1.5 text-xs focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Coordinator Name"
                  value={newCentreCoordinator}
                  onChange={e => setNewCentreCoordinator(e.target.value)}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg px-2.5 py-1.5 text-xs focus:outline-none"
                />
                <input
                  type="number"
                  placeholder="Target Souls"
                  value={newCentreTarget}
                  onChange={e => setNewCentreTarget(Number(e.target.value))}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg px-2.5 py-1.5 text-xs focus:outline-none"
                />
              </div>
              <button
                type="submit"
                className="w-full py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs cursor-pointer"
              >
                Register Hub
              </button>
            </form>
          )}

          <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
            {centres.map(c => (
              <div
                key={c.id}
                className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-bold text-slate-900 dark:text-white">
                    {c.name} ({c.code})
                  </div>
                  <span className="text-[10px] text-slate-400">
                    Coordinator: {c.coordinatorName} • Target: {c.target}
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                  Active
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
