import React, { useState } from 'react';
import { dataService } from '../services/dataService';
import { Centre, UserRole } from '../types';
import { Modal } from '../components/Modal';
import { useTheme } from '../context/ThemeContext';
import { COLOR_PALETTES, ColorPaletteKey } from '../lib/theme';
import { SessionTimerWidget } from '../components/SessionTimerWidget';
import { isAudioMuted, setAudioMuted } from '../utils/audioUtils';
import {
  Settings,
  Building2,
  Plus,
  Edit2,
  Power,
  Shield,
  Save,
  Target,
  BookOpen,
  Sparkles,
  Play,
  Clock,
  Pause,
  Square,
  RotateCcw,
  Calendar,
  Unlock,
  AlertTriangle,
  Volume2,
  VolumeX,
  History,
  FileText,
  Sliders,
  Download,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  FileCheck2,
  Phone,
  Palette,
  Users,
} from 'lucide-react';
import { SoulWinnersScreen } from './SoulWinnersScreen';

interface AdminScreenProps {
  userRole: UserRole;
  onSuccessToast: (title: string, message: string) => void;
  theme?: 'dark' | 'light';
}

export const AdminScreen: React.FC<AdminScreenProps> = ({
  userRole,
  onSuccessToast,
  theme,
}) => {
  const { palette, colorTheme, setColorTheme, glassBlur, setGlassBlur } = useTheme();
  const centres = dataService.getCentres();
  const areaCouncils = dataService.getAreaCouncils();
  const initialCampaign = dataService.getCampaign();
  const milestones = dataService.getMilestones();
  const [testMilestoneChoice, setTestMilestoneChoice] = useState<number>(1000);
  const archivedCount = dataService.getArchivedRecordsCount();

  const handleArchiveFinished = () => {
    const count = dataService.archiveFinishedRecords();
    onSuccessToast('Records Archived', `Successfully archived ${count} finished campaign records to hidden state for database performance optimization.`);
  };

  const handleRestoreArchived = () => {
    const count = dataService.restoreArchivedRecords();
    onSuccessToast('Records Restored', `Successfully restored ${count} records from archive.`);
  };

  // Admin View Tabs
  const [adminTab, setAdminTab] = useState<'campaign' | 'centres' | 'soulwinners' | 'synchistory' | 'auditlog' | 'themetemplates'>('campaign');

  interface ThemeTemplate {
    id: string;
    name: string;
    description: string;
    paletteKey: ColorPaletteKey;
    fontStyle: 'jakarta' | 'inter' | 'playfair' | 'mono';
    borderRadius: 'rounded' | 'smooth' | 'sharp';
    isCustom?: boolean;
  }

  const [themeTemplates, setThemeTemplates] = useState<ThemeTemplate[]>(() => {
    const saved = localStorage.getItem('harvest_custom_theme_templates');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [
      { id: 't1', name: 'Vibrant Evangelism', description: 'Energetic Abuja Gold palette with rounded cards and modern display font.', paletteKey: 'amber', fontStyle: 'jakarta', borderRadius: 'rounded' },
      { id: 't2', name: 'Modern Corporate', description: 'Clean Royal Blue palette with smooth corners and professional typography.', paletteKey: 'blue', fontStyle: 'inter', borderRadius: 'smooth' },
      { id: 't3', name: 'High Contrast', description: 'Maximum legibility yellow & dark palette with sharp rectangular edges for accessibility.', paletteKey: 'amber', fontStyle: 'mono', borderRadius: 'sharp' },
      { id: 't4', name: 'Royal Sanctuary', description: 'Majestic Kingdom Violet palette with serif headings and polished layout.', paletteKey: 'purple', fontStyle: 'playfair', borderRadius: 'rounded' },
      { id: 't5', name: 'Fresh Harvest', description: 'Living Emerald green palette symbolizing growth and new souls won.', paletteKey: 'emerald', fontStyle: 'inter', borderRadius: 'smooth' },
    ];
  });

  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateDesc, setNewTemplateDesc] = useState('');
  const [newTemplatePalette, setNewTemplatePalette] = useState<ColorPaletteKey>('amber');
  const [newTemplateFont, setNewTemplateFont] = useState<'jakarta' | 'inter' | 'playfair' | 'mono'>('jakarta');
  const [newTemplateRadius, setNewTemplateRadius] = useState<'rounded' | 'smooth' | 'sharp'>('rounded');

  const handleApplyTemplate = (template: ThemeTemplate) => {
    setColorTheme(template.paletteKey);
    localStorage.setItem('harvest_ui_radius', template.borderRadius);
    localStorage.setItem('harvest_ui_font', template.fontStyle);
    onSuccessToast('Theme Template Applied', `Applied "${template.name}" successfully across the entire application.`);
  };

  const handleSaveCustomTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTemplateName.trim()) return;
    const newTpl: ThemeTemplate = {
      id: `custom-${Date.now()}`,
      name: newTemplateName.trim(),
      description: newTemplateDesc.trim() || 'Custom ministry campaign theme template.',
      paletteKey: newTemplatePalette,
      fontStyle: newTemplateFont,
      borderRadius: newTemplateRadius,
      isCustom: true,
    };
    const updated = [newTpl, ...themeTemplates];
    setThemeTemplates(updated);
    localStorage.setItem('harvest_custom_theme_templates', JSON.stringify(updated));
    setNewTemplateName('');
    setNewTemplateDesc('');
    onSuccessToast('Template Saved', `New theme template "${newTpl.name}" created and saved successfully.`);
  };

  // Audio & Simulation State
  const [muted, setMuted] = useState(isAudioMuted());
  const simStatus = dataService.getSimulationStatus();
  const [simSpeed, setSimSpeed] = useState<'slow' | 'normal' | 'fast' | 'off'>(
    simStatus.isSimulating ? simStatus.speed : 'off'
  );

  // Audit Log Filters
  const [auditSearch, setAuditSearch] = useState('');
  const [auditCategory, setAuditCategory] = useState('all');

  // Campaign settings form state
  const [campaignName, setCampaignName] = useState(initialCampaign.name);
  const [target, setTarget] = useState(initialCampaign.target);
  const [startDate, setStartDate] = useState(initialCampaign.startDate);
  const [endDate, setEndDate] = useState(initialCampaign.endDate);
  const [verse, setVerse] = useState(initialCampaign.verse);
  const [announcement, setAnnouncement] = useState(initialCampaign.announcement || '');
  const [verificationRequired, setVerificationRequired] = useState(initialCampaign.verificationRequired);
  const [hideIndividualLeaderboard, setHideIndividualLeaderboard] = useState(initialCampaign.hideIndividualLeaderboard || false);
  const [customLogoUrl, setCustomLogoUrl] = useState(initialCampaign.customLogoUrl || '');
  const [smsEnabled, setSmsEnabled] = useState(initialCampaign.smsConfig?.enabled ?? false);

  // Timer configuration state
  const timerState = dataService.getSessionTimer();
  const [timerMode, setTimerMode] = useState<'countdown' | 'countup'>(timerState.mode);
  const [timerHours, setTimerHours] = useState(Math.floor(timerState.durationMs / 3600000) || 2);
  const [timerMins, setTimerMins] = useState(Math.floor((timerState.durationMs % 3600000) / 60000) || 0);
  const [timerLabelInput, setTimerLabelInput] = useState(timerState.label);
  const [timerEndBehaviour, setTimerEndBehaviour] = useState(timerState.endBehaviour);
  const [scheduleDatetime, setScheduleDatetime] = useState('');
  const [stopConfirmOpen, setStopConfirmOpen] = useState(false);

  // Centre Modal state
  const [centreModalOpen, setCentreModalOpen] = useState(false);
  const [editingCentre, setEditingCentre] = useState<Centre | null>(null);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [areaCouncilId, setAreaCouncilId] = useState(areaCouncils[0]?.id || 'AMAC');
  const [venue, setVenue] = useState('');
  const [coordinatorName, setCoordinatorName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [centreTarget, setCentreTarget] = useState(500);

  const isAuthorized = userRole === 'admin';

  if (!isAuthorized) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-center space-y-3 shadow-xs">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto"
          style={{ backgroundColor: `${palette.hex}15`, color: palette.hex }}
        >
          <Shield className="w-5 h-5" />
        </div>
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Campaign Administrator Access Only</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Campaign parameters, scripture verse, verification switches, and collation centre provisioning can only be modified by the Campaign Admin.
          Switch your role in the top header to proceed.
        </p>
      </div>
    );
  }

  const handleToggleAudio = (checked: boolean) => {
    setAudioMuted(checked);
    setMuted(checked);
    onSuccessToast('Audio Feedback Updated', checked ? 'Application sounds muted.' : 'Application sound feedback enabled.');
  };

  const handleChangeSimSpeed = (speed: 'slow' | 'normal' | 'fast' | 'off') => {
    setSimSpeed(speed);
    dataService.setSimulationSpeed(speed as any);
    onSuccessToast('Simulation Interval Updated', speed === 'off' ? 'Live data simulation paused.' : `Simulation interval set to ${speed}.`);
  };

  const auditLogs = dataService.getAuditLogs();
  const syncHistory = dataService.getSyncHistory();

  const filteredAuditLogs = auditLogs.filter(l => {
    if (auditCategory !== 'all') {
      if (auditCategory === 'creates' && !l.action.startsWith('CREATE_')) return false;
      if (auditCategory === 'edits' && !l.action.startsWith('EDIT_') && !l.action.startsWith('UPDATE_')) return false;
      if (auditCategory === 'approves' && !l.action.startsWith('APPROVE_')) return false;
      if (auditCategory === 'rejects' && !l.action.startsWith('REJECT_')) return false;
    }
    if (auditSearch.trim()) {
      const q = auditSearch.toLowerCase();
      return l.actorName.toLowerCase().includes(q) || l.details.toLowerCase().includes(q) || l.targetTitle.toLowerCase().includes(q);
    }
    return true;
  });

  const handleExportAuditCSV = () => {
    const headers = ['ID', 'Timestamp', 'Actor Name', 'Actor Role', 'Action', 'Target Type', 'Target Title', 'Centre', 'Details'];
    const rows = filteredAuditLogs.map(l => [
      l.id,
      l.timestamp,
      `"${l.actorName.replace(/"/g, '""')}"`,
      l.actorRole,
      l.action,
      l.targetType,
      `"${l.targetTitle.replace(/"/g, '""')}"`,
      `"${(l.centreName || '').replace(/"/g, '""')}"`,
      `"${l.details.replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Harvest10K_FCT_Audit_Log_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    onSuccessToast('Audit Log Exported', 'Downloaded activity log as CSV for campaign reporting.');
  };

  const handleSaveCampaign = (e: React.FormEvent) => {
    e.preventDefault();
    dataService.updateCampaign({
      name: campaignName.trim(),
      target: Number(target),
      startDate,
      endDate,
      verse: verse.trim(),
      announcement: announcement.trim(),
      verificationRequired,
      hideIndividualLeaderboard,
      customLogoUrl: customLogoUrl.trim() || undefined,
      smsConfig: {
        enabled: smsEnabled,
        thresholds: [25, 50, 75],
      },
    });
    onSuccessToast('Campaign Settings Saved', 'Abuja FCT collation parameters, custom logo, automated SMS config, and leaderboard privacy updated.');
  };

  const handleStartTimer = () => {
    const totalMs = (Number(timerHours) * 3600 + Number(timerMins) * 60) * 1000 || 7200000;
    dataService.startSessionTimer({
      mode: timerMode,
      durationMs: totalMs,
      label: timerLabelInput.trim() || 'Crusade Session',
      endBehaviour: timerEndBehaviour,
    });
    onSuccessToast('Session Timer Started', `Live session "${timerLabelInput}" is now running.`);
  };

  const handleScheduleTimer = () => {
    if (!scheduleDatetime) return;
    const totalMs = (Number(timerHours) * 3600 + Number(timerMins) * 60) * 1000 || 7200000;
    dataService.scheduleSessionTimer(new Date(scheduleDatetime).toISOString(), {
      mode: timerMode,
      durationMs: totalMs,
      label: timerLabelInput.trim() || 'Scheduled Crusade Session',
      endBehaviour: timerEndBehaviour,
    });
    onSuccessToast('Session Scheduled', `Session timer scheduled for ${scheduleDatetime} (WAT).`);
  };

  const openAddCentre = () => {
    setEditingCentre(null);
    setCode(`AMAC-0${centres.length + 1}`);
    setName('');
    setAreaCouncilId(areaCouncils[0]?.id || 'AMAC');
    setVenue('');
    setCoordinatorName('');
    setContactPhone('+234 803 ');
    setCentreTarget(500);
    setCentreModalOpen(true);
  };

  const openEditCentre = (c: Centre) => {
    setEditingCentre(c);
    setCode(c.code);
    setName(c.name);
    setAreaCouncilId(c.areaCouncilId || c.regionId || 'AMAC');
    setVenue(c.venue);
    setCoordinatorName(c.coordinatorName);
    setContactPhone(c.contactPhone);
    setCentreTarget(c.target);
    setCentreModalOpen(true);
  };

  const handleSaveCentre = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !venue.trim() || !coordinatorName.trim()) return;

    if (editingCentre) {
      dataService.updateCentre({
        ...editingCentre,
        code: code.trim(),
        name: name.trim(),
        areaCouncilId,
        regionId: areaCouncilId,
        venue: venue.trim(),
        coordinatorName: coordinatorName.trim(),
        contactPhone: contactPhone.trim(),
        target: Number(centreTarget),
      });
      onSuccessToast('Centre Updated', `Collation centre "${name}" updated successfully.`);
    } else {
      dataService.addCentre({
        code: code.trim(),
        name: name.trim(),
        areaCouncilId,
        regionId: areaCouncilId,
        venue: venue.trim(),
        coordinatorName: coordinatorName.trim(),
        contactPhone: contactPhone.trim(),
        target: Number(centreTarget),
        active: true,
      });
      onSuccessToast('Centre Added', `New collation centre "${name}" provisioned.`);
    }

    setCentreModalOpen(false);
  };

  const handleToggleActive = (id: string) => {
    dataService.toggleCentreActive(id);
    onSuccessToast('Status Changed', 'Collation centre status toggled.');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Title */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 rounded-2xl shadow-xs transition-colors">
        <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Settings className="w-5 h-5" style={{ color: palette.hex }} /> Collation System Administration
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Configure Abuja FCT campaign target, verification requirements, scripture verse, and manage collation hubs across the 6 Area Councils.
        </p>
      </div>

      {/* Admin View Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {[
          { key: 'campaign', label: 'Campaign & Sim Settings', icon: Settings },
          { key: 'centres', label: 'Collation Centres', icon: Building2 },
          { key: 'soulwinners', label: 'Soul Winners Roster', icon: Users },
          { key: 'themetemplates', label: 'Theme Templates', icon: Palette },
          { key: 'synchistory', label: 'Sync History', icon: History },
          { key: 'auditlog', label: 'Audit Log', icon: FileText },
        ].map(tab => {
          const IconComponent = tab.icon;
          const isActive = adminTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setAdminTab(tab.key as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer whitespace-nowrap shadow-xs ${
                isActive
                  ? 'text-white'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
              style={{ backgroundColor: isActive ? palette.hex : undefined }}
            >
              <IconComponent className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {adminTab === 'campaign' && (
        <>
          {/* AUDIO & SIMULATION CONFIG SECTION */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 sm:p-7 shadow-xs space-y-5 transition-colors">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: palette.hex }}>
                <Sliders className="w-4 h-4" style={{ color: palette.hex }} /> Audio & Simulation Controls
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Audio Feedback Mute Toggle */}
              <div className="bg-slate-50 dark:bg-slate-950/60 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-500">
                    {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block">
                      Audio Feedback
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                      Play 'ding' on soul addition and celebration sound on milestone.
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggleAudio(!muted)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                    muted
                      ? 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                      : 'text-white'
                  }`}
                  style={{ backgroundColor: muted ? undefined : palette.hex }}
                >
                  {muted ? 'Muted' : 'Active'}
                </button>
              </div>

              {/* Live Data Simulation Speed Selector */}
              <div className="bg-slate-50 dark:bg-slate-950/60 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
                    <Play className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block">
                      Live Data Simulation Interval
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                      Control background simulation frequency for training or stress testing.
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-1.5 pt-1">
                  {(['off', 'slow', 'normal', 'fast'] as const).map(speed => (
                    <button
                      key={speed}
                      type="button"
                      onClick={() => handleChangeSimSpeed(speed)}
                      className={`py-1.5 rounded-lg text-[10px] font-bold uppercase transition-colors cursor-pointer ${
                        simSpeed === speed
                          ? 'text-white shadow-xs'
                          : 'bg-slate-200/60 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                      style={{ backgroundColor: simSpeed === speed ? palette.hex : undefined }}
                    >
                      {speed}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* CAMPAIGN PARAMETERS FORM */}
          <form
            onSubmit={handleSaveCampaign}
            className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 sm:p-7 shadow-xs space-y-5 transition-colors"
          >
        <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: palette.hex }}>
            <Target className="w-4 h-4" style={{ color: palette.hex }} /> Campaign Settings
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Campaign Name</label>
            <input
              type="text"
              value={campaignName}
              onChange={e => setCampaignName(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl px-3 py-2 text-xs focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">FCT Target (Souls)</label>
            <input
              type="number"
              value={target}
              onChange={e => setTarget(Number(e.target.value))}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl px-3 py-2 text-xs font-mono-tabular font-bold focus:outline-none"
              style={{ color: palette.hex }}
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl px-3 py-2 text-xs focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Target Conclusion Date</label>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl px-3 py-2 text-xs focus:outline-none"
            />
          </div>

          <div className="sm:col-span-2 space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5" style={{ color: palette.hex }} />
              Scripture Verse (Broadcast on Projector View)
            </label>
            <textarea
              rows={2}
              value={verse}
              onChange={e => setVerse(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl p-3 text-xs focus:outline-none"
            />
          </div>

          <div className="sm:col-span-2 space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Live Projector Announcement Banner (Scrolling Under Total)
              </label>
              <span className="text-[10px] text-slate-500 font-mono-tabular">Live Syncs to Projector</span>
            </div>
            <textarea
              rows={2}
              value={announcement}
              onChange={e => setAnnouncement(e.target.value)}
              placeholder="e.g. 📢 LIVE EVENT: Evening Crusade Collation Active across all 14 Abuja centres..."
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl p-3 text-xs focus:outline-none"
            />
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[10px] text-slate-400 font-semibold">Quick Presets:</span>
              <button
                type="button"
                onClick={() => setAnnouncement('📢 CRUSADE IN SESSION: High-velocity harvest underway across Abuja FCT · Submit field tally slips without delay!')}
                className="px-2 py-0.5 rounded text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              >
                Crusade in Session
              </button>
              <button
                type="button"
                onClick={() => setAnnouncement('⏳ FINAL COUNTDOWN: 2 Hours Remaining to hit the 10,000 FCT Soul Target · Intercessory Hubs Praying!')}
                className="px-2 py-0.5 rounded text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              >
                Final Countdown
              </button>
              <button
                type="button"
                onClick={() => setAnnouncement('🎉 THANKSGIVING SERVICE: Glory to God! 10,000 Souls Won to Jesus Christ across all 14 Abuja Collation Hubs!')}
                className="px-2 py-0.5 rounded text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              >
                Victory Thanksgiving
              </button>
            </div>
          </div>

          {/* Verification Required Toggle */}
          <div className="sm:col-span-2 bg-slate-50 dark:bg-slate-950/60 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block">
                Verification Required for Public Counting
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                When enabled, incoming submissions remain in Verification Queue and only increment the public running total once approved by a coordinator.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setVerificationRequired(!verificationRequired)}
              className="w-11 h-6 rounded-full transition-colors relative cursor-pointer"
              style={{
                backgroundColor: verificationRequired ? palette.hex : '#94a3b8',
              }}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform ${
                  verificationRequired ? 'left-5.5' : 'left-0.5'
                }`}
              />
            </button>
          </div>

          {/* Hide Individual Soul Winners Leaderboard Toggle */}
          <div className="sm:col-span-2 bg-slate-50 dark:bg-slate-950/60 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block">
                Hide Individual Soul Winners Tab
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                Hides the personal Soul Winners ranking tab from the public Leaderboard screen to foster collective team ministry rather than personal comparison.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setHideIndividualLeaderboard(!hideIndividualLeaderboard)}
              className="w-11 h-6 rounded-full transition-colors relative cursor-pointer"
              style={{
                backgroundColor: hideIndividualLeaderboard ? palette.hex : '#94a3b8',
              }}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform ${
                  hideIndividualLeaderboard ? 'left-5.5' : 'left-0.5'
                }`}
              />
            </button>
          </div>

          {/* Custom Ministry Logo URL */}
          <div className="sm:col-span-2 space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <FileCheck2 className="w-3.5 h-3.5" style={{ color: palette.hex }} />
              Custom Ministry Logo Image URL (Rendered in PDF Reports Header)
            </label>
            <input
              type="url"
              value={customLogoUrl}
              onChange={e => setCustomLogoUrl(e.target.value)}
              placeholder="https://example.com/ministry-logo.png"
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl px-3 py-2 text-xs focus:outline-none"
            />
          </div>

          {/* Automated SMS Notifications Toggle */}
          <div className="sm:col-span-2 bg-slate-50 dark:bg-slate-950/60 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block">
                Automated SMS Notifications for Centre Coordinators
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                Automatically trigger SMS dispatches to centre coordinators when their centres hit 25%, 50%, and 75% of their targets.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setSmsEnabled(!smsEnabled)}
              className="w-11 h-6 rounded-full transition-colors relative cursor-pointer"
              style={{
                backgroundColor: smsEnabled ? palette.hex : '#94a3b8',
              }}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform ${
                  smsEnabled ? 'left-5.5' : 'left-0.5'
                }`}
              />
            </button>
          </div>
        </div>

        <div className="flex justify-end pt-1">
          <button
            type="submit"
            className={`px-5 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-xs transition-transform active:scale-98 cursor-pointer ${palette.btnPrimary}`}
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Campaign Configuration</span>
          </button>
        </div>
      </form>

      {/* THEME CUSTOMIZER CARD */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 sm:p-7 shadow-xs space-y-5 transition-colors">
        <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: palette.hex }}>
            <Sparkles className="w-4 h-4" style={{ color: palette.hex }} /> Campaign Brand Theme Customizer
          </span>
          <span className="text-[10px] text-slate-500 font-mono-tabular">Live Color Palette</span>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Select an official color palette for the application branding. This instantly adjusts accent gradients, buttons, map glows, and badges for current and future campaigns.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {(Object.keys(COLOR_PALETTES) as ColorPaletteKey[]).map(key => {
            const p = COLOR_PALETTES[key];
            const isSelected = colorTheme === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => {
                  setColorTheme(key);
                  onSuccessToast('Theme Updated', `Switched app branding to ${p.name}.`);
                }}
                className={`p-3.5 rounded-xl border text-left flex flex-col justify-between gap-3 cursor-pointer transition-all ${
                  isSelected
                    ? 'border-2 shadow-sm'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50 dark:bg-slate-950/40'
                }`}
                style={{
                  borderColor: isSelected ? p.hex : undefined,
                  backgroundColor: isSelected ? `${p.hex}15` : undefined,
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="w-6 h-6 rounded-full shadow-xs flex items-center justify-center text-white text-[10px] font-bold" style={{ backgroundColor: p.hex }}>
                    ✓
                  </div>
                  <span className="text-[10px] font-mono uppercase text-slate-400">{p.badgeLabel}</span>
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block">{p.name}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* RECORD ARCHIVE MANAGEMENT CARD */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 sm:p-7 shadow-xs space-y-5 transition-colors">
        <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: palette.hex }}>
            <Shield className="w-4 h-4" style={{ color: palette.hex }} /> Database Performance & Archive Management
          </span>
          <span className="text-[10px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-3 py-1 rounded-full">
            {archivedCount} records currently archived
          </span>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Archive soul records from completed or finished campaigns to a hidden archive state. This keeps live database query performance optimal while preserving permanent records for historical audits.
        </p>
        <div className="flex flex-wrap gap-3 pt-1">
          <button
            type="button"
            onClick={handleArchiveFinished}
            className="px-4 py-2.5 rounded-xl font-bold text-xs bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:opacity-90 transition-opacity flex items-center gap-2 cursor-pointer shadow-xs"
          >
            <span>Archive Finished Campaign Records</span>
          </button>
          {archivedCount > 0 && (
            <button
              type="button"
              onClick={handleRestoreArchived}
              className="px-4 py-2.5 rounded-xl font-bold text-xs bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restore Archived Records</span>
            </button>
          )}
        </div>
      </div>

      {/* CAMPAIGN SESSION TIMER ADMINISTRATION CARD */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 sm:p-7 shadow-xs space-y-6 transition-colors">
        <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: palette.hex }}>
            <Clock className="w-4 h-4" style={{ color: palette.hex }} /> Campaign Session Timer Control
          </span>
          <span className="text-[10px] text-slate-500 font-mono-tabular">Shared Drift-Free Sync</span>
        </div>

        {/* Current Timer Status Banner */}
        <SessionTimerWidget onSuccessToast={onSuccessToast} showControls={true} />

        {/* Timer Control Panel & Settings */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Session Label</label>
            <input
              type="text"
              value={timerLabelInput}
              onChange={e => setTimerLabelInput(e.target.value)}
              placeholder="e.g. Evening Crusade — Session 2"
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl px-3 py-2 text-xs focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Timer Mode</label>
            <select
              value={timerMode}
              onChange={e => setTimerMode(e.target.value as 'countdown' | 'countup')}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl px-3 py-2 text-xs focus:outline-none cursor-pointer"
            >
              <option value="countdown">Countdown Mode (Fixed Duration)</option>
              <option value="countup">Count-up Mode (Elapsed Rally Time)</option>
            </select>
          </div>

          {timerMode === 'countdown' && (
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Countdown Duration</label>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min={0}
                    max={24}
                    value={timerHours}
                    onChange={e => setTimerHours(Math.max(0, Number(e.target.value)))}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl px-3 py-2 text-xs font-mono-tabular font-bold focus:outline-none"
                  />
                  <span className="text-xs text-slate-500">hours</span>
                </div>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min={0}
                    max={59}
                    value={timerMins}
                    onChange={e => setTimerMins(Math.max(0, Math.min(59, Number(e.target.value))))}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl px-3 py-2 text-xs font-mono-tabular font-bold focus:outline-none"
                  />
                  <span className="text-xs text-slate-500">mins</span>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[10px] text-slate-400 font-semibold">Presets:</span>
                <button
                  type="button"
                  onClick={() => { setTimerHours(0); setTimerMins(30); }}
                  className="px-2 py-0.5 rounded text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  30m
                </button>
                <button
                  type="button"
                  onClick={() => { setTimerHours(1); setTimerMins(0); }}
                  className="px-2 py-0.5 rounded text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  1h
                </button>
                <button
                  type="button"
                  onClick={() => { setTimerHours(2); setTimerMins(0); }}
                  className="px-2 py-0.5 rounded text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  2h (Crusade)
                </button>
                <button
                  type="button"
                  onClick={() => { setTimerHours(3); setTimerMins(0); }}
                  className="px-2 py-0.5 rounded text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  3h
                </button>
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">End Behaviour</label>
            <select
              value={timerEndBehaviour}
              onChange={e => setTimerEndBehaviour(e.target.value as any)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl px-3 py-2 text-xs focus:outline-none cursor-pointer"
            >
              <option value="show_zero">Show 00:00:00 (Keep Submissions Open)</option>
              <option value="lock_submissions">Lock Submissions (Disable Add Soul Form)</option>
              <option value="celebrate_total">Celebrate Total & Trigger Victory Banner</option>
            </select>
          </div>

          <div className="md:col-span-2 space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" style={{ color: palette.hex }} />
              Schedule Automatic Start (Optional WAT Date & Time)
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="datetime-local"
                value={scheduleDatetime}
                onChange={e => setScheduleDatetime(e.target.value)}
                className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl px-3 py-2 text-xs focus:outline-none"
              />
              <button
                type="button"
                onClick={handleScheduleTimer}
                disabled={!scheduleDatetime}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Schedule Start
              </button>
              {timerState.status === 'scheduled' && (
                <button
                  type="button"
                  onClick={() => { dataService.cancelSessionTimerSchedule(); onSuccessToast('Schedule Cancelled', 'Automatic session schedule cancelled.'); }}
                  className="px-4 py-2 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Cancel Schedule
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Main Control Action Buttons */}
        <div className="flex flex-wrap items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
          {timerState.status === 'idle' || timerState.status === 'finished' ? (
            <button
              type="button"
              onClick={handleStartTimer}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold shadow-sm flex items-center gap-2 cursor-pointer ${palette.btnPrimary}`}
            >
              <Play className="w-4 h-4 fill-current" /> Start Session Now
            </button>
          ) : timerState.status === 'running' ? (
            <>
              <button
                type="button"
                onClick={() => { dataService.pauseSessionTimer(); onSuccessToast('Session Paused', 'Timer paused.'); }}
                className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-2 cursor-pointer"
              >
                <Pause className="w-4 h-4" /> Pause Session
              </button>
              <button
                type="button"
                onClick={() => setStopConfirmOpen(true)}
                className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-2 cursor-pointer"
              >
                <Square className="w-4 h-4 fill-current" /> Stop / Conclude Session
              </button>
            </>
          ) : timerState.status === 'paused' ? (
            <>
              <button
                type="button"
                onClick={() => { dataService.resumeSessionTimer(); onSuccessToast('Session Resumed', 'Timer resumed.'); }}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold shadow-sm flex items-center gap-2 cursor-pointer ${palette.btnPrimary}`}
              >
                <Play className="w-4 h-4 fill-current" /> Resume Session
              </button>
              <button
                type="button"
                onClick={() => setStopConfirmOpen(true)}
                className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-2 cursor-pointer"
              >
                <Square className="w-4 h-4 fill-current" /> Stop / Conclude Session
              </button>
            </>
          ) : null}

          {timerState.status !== 'idle' && (
            <button
              type="button"
              onClick={() => { dataService.resetSessionTimer(); onSuccessToast('Session Reset', 'Timer reset to idle.'); }}
              className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset Timer
            </button>
          )}
        </div>
      </div>

      {/* STOP CONFIRMATION MODAL */}
      <Modal isOpen={stopConfirmOpen} onClose={() => setStopConfirmOpen(false)} title="Conclude / Stop Active Campaign Session?">
        <div className="space-y-4 text-xs">
          <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-xl flex items-start gap-3 text-rose-900 dark:text-rose-200">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold">Are you sure you want to stop this live campaign session?</p>
              <p className="text-rose-800/80 dark:text-rose-300/80">
                Stopping the session will mark the timer as concluded and enforce the session end behaviour ({timerEndBehaviour}). This will immediately broadcast across all connected projector and dashboard clients.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setStopConfirmOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                dataService.stopSessionTimer();
                setStopConfirmOpen(false);
                onSuccessToast('Session Concluded', 'Campaign session timer stopped and marked as finished.');
              }}
              className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs cursor-pointer"
            >
              Confirm Stop Session
            </button>
          </div>
        </div>
      </Modal>

      {/* MILESTONE CELEBRATIONS & REHEARSAL */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 sm:p-7 shadow-xs space-y-4 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" /> Milestone Celebrations & Rehearsal
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Full-screen 8-second celebration with confetti bursts, massive typography, and scripture quote automatically triggers when crossing thresholds.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                dataService.triggerMilestoneCelebration(testMilestoneChoice);
                onSuccessToast('Milestone Rehearsal Triggered', `Previewing celebratory overlay for ${testMilestoneChoice.toLocaleString()} souls.`);
              }}
              className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-xs transition-transform active:scale-98 cursor-pointer ${palette.btnPrimary}`}
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Test Milestone ({testMilestoneChoice.toLocaleString()})</span>
            </button>
          </div>
        </div>

        <div className="space-y-2.5">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
            Select Milestone to Test / Rehearse
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
            {milestones.map(m => {
              const isSelected = testMilestoneChoice === m;
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => {
                    setTestMilestoneChoice(m);
                    dataService.triggerMilestoneCelebration(m);
                    onSuccessToast('Milestone Rehearsal Triggered', `Previewing celebratory overlay for ${m.toLocaleString()} souls.`);
                  }}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer space-y-1 ${
                    isSelected
                      ? 'bg-amber-500/10 border-amber-500/40 text-amber-600 dark:text-amber-400 ring-2 ring-amber-500/20'
                      : 'bg-slate-50 dark:bg-slate-950 border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-400 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      {m === 10000 ? 'Final Goal' : 'Milestone'}
                    </span>
                    <Sparkles className="w-3 h-3 text-amber-500" />
                  </div>
                  <div className="text-base font-black font-mono-tabular">
                    {m.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">
                    Click to Test
                  </div>
                </button>
              );
            })}
          </div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 italic">
            * Note: Milestones already passed on initial startup will not trigger retroactively. Rehearsal buttons allow previewing any milestone at any time.
          </p>
        </div>
      </div>
        </>
      )}

      {adminTab === 'centres' && (
      <>
      {/* COLLATION CENTRES DIRECTORY */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 sm:p-7 shadow-xs space-y-4 transition-colors">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-cyan-500" /> Collation Centres Directory ({centres.length})
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Manage the 14 Abuja centres across all 6 Area Councils, modify coordinator contacts, or toggle active status.
            </p>
          </div>

          <button
            onClick={openAddCentre}
            className={`px-3.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1 shadow-xs transition-transform active:scale-98 cursor-pointer ${palette.btnPrimary}`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Centre</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {centres.map(c => {
            const council = areaCouncils.find(r => r.id === (c.areaCouncilId || c.regionId));
            return (
              <div
                key={c.id}
                className={`p-3.5 rounded-xl border transition-colors flex items-start justify-between gap-3 ${
                  c.active
                    ? 'bg-slate-50/50 dark:bg-slate-950 border-slate-200/80 dark:border-slate-800'
                    : 'bg-slate-50/20 dark:bg-slate-950/40 border-slate-200/40 dark:border-slate-900 opacity-60'
                }`}
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-xs text-slate-900 dark:text-slate-100">
                      {c.name}
                    </span>
                    <span className="text-[10px] font-mono-tabular px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {c.code}
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-500 dark:text-slate-400">{council?.name || c.areaCouncilId || c.regionId} · {c.venue}</div>
                  <div className="text-[11px] text-slate-600 dark:text-slate-300">
                    Coordinator: <strong>{c.coordinatorName}</strong> ({c.contactPhone})
                  </div>
                  <div className="text-[11px] font-mono-tabular font-semibold" style={{ color: palette.hex }}>
                    Target: {c.target} souls
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => openEditCentre(c)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    title="Edit Centre Details"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleToggleActive(c.id)}
                    className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                      c.active
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400'
                        : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'
                    }`}
                    title={c.active ? 'Deactivate Centre' : 'Activate Centre'}
                  >
                    <Power className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* CENTRE ADD/EDIT MODAL */}
      <Modal
        isOpen={centreModalOpen}
        onClose={() => setCentreModalOpen(false)}
        title={editingCentre ? `Edit Centre: ${editingCentre.name}` : 'Provision New Collation Centre'}
      >
        <form onSubmit={handleSaveCentre} className="space-y-3.5 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block font-semibold text-slate-700 dark:text-slate-300">Code</label>
              <input
                type="text"
                value={code}
                onChange={e => setCode(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl px-3 py-2 text-xs font-mono-tabular font-bold focus:outline-none"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="block font-semibold text-slate-700 dark:text-slate-300">Target Souls</label>
              <input
                type="number"
                value={centreTarget}
                onChange={e => setCentreTarget(Number(e.target.value))}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl px-3 py-2 text-xs font-mono-tabular focus:outline-none"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block font-semibold text-slate-700 dark:text-slate-300">Centre Name</label>
            <input
              type="text"
              placeholder="e.g. Garki Centre, Wuse II Centre"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl px-3 py-2 text-xs focus:outline-none"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="block font-semibold text-slate-700 dark:text-slate-300">Area Council</label>
            <select
              value={areaCouncilId}
              onChange={e => setAreaCouncilId(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none cursor-pointer"
            >
              {areaCouncils.map(r => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="block font-semibold text-slate-700 dark:text-slate-300">Venue / Location</label>
            <input
              type="text"
              placeholder="e.g. Area 1 Recreation Park / Garki District"
              value={venue}
              onChange={e => setVenue(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl px-3 py-2 text-xs focus:outline-none"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block font-semibold text-slate-700 dark:text-slate-300">Coordinator Name</label>
              <input
                type="text"
                placeholder="e.g. Pastor David Danjuma"
                value={coordinatorName}
                onChange={e => setCoordinatorName(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl px-3 py-2 text-xs focus:outline-none"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="block font-semibold text-slate-700 dark:text-slate-300">Contact Phone</label>
              <input
                type="text"
                value={contactPhone}
                onChange={e => setContactPhone(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl px-3 py-2 text-xs focus:outline-none"
                required
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setCentreModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`px-5 py-2 rounded-xl text-xs font-bold shadow-xs cursor-pointer ${palette.btnPrimary}`}
            >
              {editingCentre ? 'Update Centre' : 'Save Centre'}
            </button>
          </div>
        </form>
      </Modal>
      </>
      )}

      {adminTab === 'soulwinners' && (
        <SoulWinnersScreen
          embeddedInAdmin
          userRole={userRole}
          theme={theme}
          onSuccessToast={onSuccessToast}
        />
      )}

      {adminTab === 'synchistory' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 sm:p-7 shadow-xs space-y-4 transition-colors">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <History className="w-4 h-4" style={{ color: palette.hex }} /> Sync Operations History
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Logs all past manual offline flushes and automatic background synchronization operations.
                </p>
              </div>
              <span className="text-xs font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-3 py-1 rounded-full">
                {syncHistory.length} sync operations logged
              </span>
            </div>

            <div className="space-y-2.5">
              {syncHistory.length === 0 ? (
                <div className="text-center py-12 text-xs text-slate-400">No synchronization records logged yet.</div>
              ) : (
                syncHistory.map(item => (
                  <div
                    key={item.id}
                    className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center mt-0.5 ${
                        item.success ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                      }`}>
                        {item.success ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase">
                            {item.type} Sync
                          </span>
                          <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                            item.success ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                          }`}>
                            {item.success ? 'Successful' : 'Failed'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">{item.message}</p>
                        <span className="text-[10px] text-slate-400 font-mono mt-1 block">
                          {new Date(item.timestamp).toLocaleString()} · {item.recordCount} records synchronized
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Automated SMS Dispatch Logs */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 sm:p-7 shadow-xs space-y-4 transition-colors">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Phone className="w-4 h-4" style={{ color: palette.hex }} /> Automated SMS Notifications Log
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Tracks automated milestone SMS alerts dispatched to centre coordinators at 25%, 50%, and 75% target thresholds.
                </p>
              </div>
              <span className="text-xs font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-3 py-1 rounded-full">
                {dataService.getSmsLogs().length} SMS alerts dispatched
              </span>
            </div>

            <div className="space-y-2.5">
              {dataService.getSmsLogs().length === 0 ? (
                <div className="text-center py-12 text-xs text-slate-400">
                  No automated SMS milestone alerts triggered yet. As centres cross 25%, 50%, and 75% targets, dispatches will appear here.
                </div>
              ) : (
                dataService.getSmsLogs().map(sms => (
                  <div
                    key={sms.id}
                    className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                          {sms.centreName}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
                          {sms.milestonePercentage}% Milestone Target
                        </span>
                        <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded-full">
                          Sent to {sms.coordinatorPhone}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 font-mono bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-800">
                        "{sms.message}"
                      </p>
                      <span className="text-[10px] text-slate-400 font-mono mt-1 block">
                        {new Date(sms.timestamp).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {adminTab === 'auditlog' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 sm:p-7 shadow-xs space-y-5 transition-colors">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <FileText className="w-4 h-4" style={{ color: palette.hex }} /> Campaign Audit Log
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Tracks user actions including who added, approved, or rejected records and batches.
              </p>
            </div>
            <button
              onClick={handleExportAuditCSV}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white shadow-xs transition-colors cursor-pointer"
              style={{ backgroundColor: palette.hex }}
            >
              <Download className="w-3.5 h-3.5" /> Export Audit CSV
            </button>
          </div>

          {/* Search & Category Filter */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2 relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search audit actions, actors, or targets..."
                value={auditSearch}
                onChange={e => setAuditSearch(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl pl-9 pr-3 py-2 text-xs focus:outline-none"
              />
            </div>
            <div>
              <select
                value={auditCategory}
                onChange={e => setAuditCategory(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none cursor-pointer"
              >
                <option value="all">All Action Categories</option>
                <option value="creates">Creations (Adds)</option>
                <option value="edits">Edits & Updates</option>
                <option value="approves">Approvals</option>
                <option value="rejects">Rejections</option>
              </select>
            </div>
          </div>

          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
            {filteredAuditLogs.length === 0 ? (
              <div className="text-center py-12 text-xs text-slate-400">No matching audit log entries found.</div>
            ) : (
              filteredAuditLogs.map(l => (
                <div
                  key={l.id}
                  className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full font-bold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {l.action}
                      </span>
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        {l.targetTitle}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300">{l.details}</p>
                    <div className="flex items-center gap-3 text-[10px] text-slate-400 font-mono">
                      <span>👤 {l.actorName} ({l.actorRole})</span>
                      {l.centreName && <span>🏛️ {l.centreName}</span>}
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono whitespace-nowrap">
                    {new Date(l.timestamp).toLocaleString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {adminTab === 'themetemplates' && (
        <div className="space-y-6">
          {/* Glassmorphism Blur Intensity Setting */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 sm:p-7 shadow-xs space-y-4 transition-colors">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Sliders className="w-4 h-4" style={{ color: palette.hex }} /> Glassmorphism Blur Intensity
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Adjust the backdrop blur intensity of cards, navigation bars, and modals across the application to suit your personal preference or device capability.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              {[
                { key: 'low', label: 'Subtle Blur (8px)', desc: 'Higher clarity, minimal GPU overhead' },
                { key: 'normal', label: 'Balanced (18px)', desc: 'Standard frosted glass aesthetic' },
                { key: 'high', label: 'Deep Frosted (36px)', desc: 'Rich background diffusion' },
              ].map(item => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => {
                    setGlassBlur(item.key as any);
                    onSuccessToast('Glass Blur Updated', `Glassmorphism blur intensity set to "${item.label}".`);
                  }}
                  className={`p-4 rounded-xl border text-left flex flex-col justify-between gap-2 transition-all cursor-pointer ${
                    glassBlur === item.key
                      ? 'border-2 shadow-sm'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                  style={glassBlur === item.key ? { borderColor: palette.hex, backgroundColor: `${palette.hex}10` } : undefined}
                >
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block">{item.label}</span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block leading-relaxed">{item.desc}</span>
                  </div>
                  <span className="text-[10px] font-mono font-semibold" style={{ color: glassBlur === item.key ? palette.hex : undefined }}>
                    {glassBlur === item.key ? '✓ Active Blur' : 'Select'}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 sm:p-7 shadow-xs space-y-4 transition-colors">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Palette className="w-4 h-4" style={{ color: palette.hex }} /> Campaign Theme Templates & Customizer
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Save and apply predefined and custom theme templates ('Modern Corporate', 'Vibrant Evangelism', 'High Contrast', etc.) bundling font styles, color palettes, and component border radii for the entire app.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {themeTemplates.map(tpl => {
                const p = COLOR_PALETTES[tpl.paletteKey] || COLOR_PALETTES['amber'];
                return (
                  <div
                    key={tpl.id}
                    className="p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 flex flex-col justify-between gap-4 shadow-xs"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-4 h-4 rounded-full shadow-xs"
                            style={{ backgroundColor: p.hex }}
                          />
                          <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">{tpl.name}</h4>
                        </div>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {tpl.paletteKey.toUpperCase()} • {tpl.borderRadius} • {tpl.fontStyle}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400">{tpl.description}</p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-slate-800">
                      <span className="text-[10px] text-slate-400 font-mono">
                        {tpl.isCustom ? '✨ Custom Template' : '🏛️ Official Preset'}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleApplyTemplate(tpl)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold shadow-xs cursor-pointer transition-transform active:scale-98 ${palette.btnPrimary}`}
                      >
                        Apply Template
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Create Custom Template Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 sm:p-7 shadow-xs space-y-4 transition-colors">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Sparkles className="w-4 h-4" style={{ color: palette.hex }} /> Create New Custom Theme Template
            </h4>
            <form onSubmit={handleSaveCustomTemplate} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block font-semibold text-slate-700 dark:text-slate-300">Template Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Abuja Mega Crusade 2026"
                    value={newTemplateName}
                    onChange={e => setNewTemplateName(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl px-3 py-2 text-xs focus:outline-none"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="block font-semibold text-slate-700 dark:text-slate-300">Description</label>
                  <input
                    type="text"
                    placeholder="Short description of the theme template"
                    value={newTemplateDesc}
                    onChange={e => setNewTemplateDesc(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl px-3 py-2 text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="block font-semibold text-slate-700 dark:text-slate-300">Color Palette</label>
                  <select
                    value={newTemplatePalette}
                    onChange={e => setNewTemplatePalette(e.target.value as any)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none cursor-pointer"
                  >
                    <option value="amber">Harvest Amber (Abuja Gold)</option>
                    <option value="blue">Royal Sapphire</option>
                    <option value="emerald">Living Emerald</option>
                    <option value="purple">Kingdom Violet</option>
                    <option value="rose">Crimson Flame</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block font-semibold text-slate-700 dark:text-slate-300">Font Style</label>
                  <select
                    value={newTemplateFont}
                    onChange={e => setNewTemplateFont(e.target.value as any)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none cursor-pointer"
                  >
                    <option value="jakarta">Plus Jakarta Sans (Modern)</option>
                    <option value="inter">Inter (Corporate)</option>
                    <option value="playfair">Playfair Display (Serif)</option>
                    <option value="mono">JetBrains Mono (High Legibility)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block font-semibold text-slate-700 dark:text-slate-300">Corner Radius</label>
                  <select
                    value={newTemplateRadius}
                    onChange={e => setNewTemplateRadius(e.target.value as any)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none cursor-pointer"
                  >
                    <option value="rounded">Rounded (16px Pill/Card)</option>
                    <option value="smooth">Smooth (8px Subtle)</option>
                    <option value="sharp">Sharp (0px Rectangular)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className={`px-5 py-2.5 rounded-xl text-xs font-bold shadow-xs cursor-pointer ${palette.btnPrimary}`}
                >
                  Save & Apply Custom Template
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
