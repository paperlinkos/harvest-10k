import React, { useState, useMemo, useEffect } from 'react';
import { dataService } from '../services/dataService';
import { useTheme } from '../context/ThemeContext';
import {
  SoulRecord,
  Centre,
  Region,
  Campaign,
  UserRole,
  DecisionType,
  FollowUpStatus,
} from '../types';
import {
  exportAllRecordsCSV,
  exportFollowUpListCSV,
  exportConvertAddressesCSV,
  exportUnreconciledCSV,
  exportCollationReportCSV,
  downloadCampaignSummaryHTML,
  openPrintableSummaryReport,
  generateCampaignSummaryHTML,
  CampaignReportData,
} from '../utils/exportUtils';
import { getWhatsAppLink } from '../utils/whatsappUtils';
import {
  FileSpreadsheet,
  Download,
  Printer,
  Calendar,
  Building2,
  Filter,
  RefreshCw,
  Users,
  Heart,
  Flame,
  CheckCircle2,
  Clock,
  ChevronRight,
  Eye,
  X,
  FileText,
  Search,
  ArrowUpDown,
  Sparkles,
  Layers,
  MapPin,
  ExternalLink,
  SlidersHorizontal,
  CheckSquare,
  Home,
  Bus,
  Navigation,
  MessageCircle,
} from 'lucide-react';
import { GeospatialHarvestMap } from '../components/GeospatialHarvestMap';

interface ReportsScreenProps {
  userRole: UserRole;
  onNavigate?: (screen: any) => void;
}

type DatePreset = 'all' | 'today' | 'yesterday' | 'last3days' | 'last7days' | 'custom';

export const ReportsScreen: React.FC<ReportsScreenProps> = ({ userRole, onNavigate }) => {
  const { palette } = useTheme();

  // Role Access Guard: Executive reports are restricted from public & field workers
  if (userRole === 'public' || userRole === 'field_worker') {
    return (
      <div className="max-w-2xl mx-auto my-12 p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl text-center space-y-4 shadow-xs">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
          <FileSpreadsheet className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-black text-slate-900 dark:text-slate-100">
          Executive Reports Restricted
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
          The Executive Reports, CSV data exports, and centre reconciliation ledger are reserved for Collation Coordinators and Zonal Administrators.
        </p>
        <div className="pt-2 flex items-center justify-center gap-3">
          <button
            onClick={() => onNavigate?.(userRole === 'field_worker' ? 'tally' : 'dashboard')}
            className={`px-5 py-2.5 rounded-xl text-white font-bold text-xs shadow-xs cursor-pointer transition-transform active:scale-95 ${palette.btnPrimary}`}
          >
            {userRole === 'field_worker' ? 'Go to Tap to Tally' : 'Go to Live Dashboard'}
          </button>
        </div>
      </div>
    );
  }

  // Master Data from dataService
  const [campaign, setCampaign] = useState<Campaign>(() => dataService.getCampaign());
  const [centres, setCentres] = useState<Centre[]>(() => dataService.getCentres());
  const [regions, setRegions] = useState<Region[]>(() => dataService.getRegions());
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Filter States
  const [datePreset, setDatePreset] = useState<DatePreset>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [selectedCentreId, setSelectedCentreId] = useState<string>('all');
  const [selectedDecision, setSelectedDecision] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [tableSearch, setTableSearch] = useState<string>('');

  // Preview & Modal States
  const [selectedRecordForDetail, setSelectedRecordForDetail] = useState<SoulRecord | null>(null);
  const [showPrintModal, setShowPrintModal] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'summary' | 'centres' | 'records' | 'reconciliation' | 'geographic'>('summary');
  const [sortField, setSortField] = useState<'soulsWon' | 'attainment' | 'name'>('soulsWon');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Geographic & Convert Living Addresses Tab State
  const [geoSearchQuery, setGeoSearchQuery] = useState<string>('');
  const [geoCouncilFilter, setGeoCouncilFilter] = useState<string>('all');

  // Subscribe to real-time changes
  useEffect(() => {
    const unsubscribe = dataService.subscribe(() => {
      setCampaign(dataService.getCampaign());
      setCentres(dataService.getCentres());
      setRegions(dataService.getRegions());
      setRefreshTrigger(prev => prev + 1);
    });
    return unsubscribe;
  }, []);

  // Handle Preset Changes
  const applyPreset = (preset: DatePreset) => {
    setDatePreset(preset);
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    if (preset === 'all') {
      setStartDate('');
      setEndDate('');
    } else if (preset === 'today') {
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (preset === 'yesterday') {
      const y = new Date(now.getTime() - 86400000);
      const yStr = y.toISOString().split('T')[0];
      setStartDate(yStr);
      setEndDate(yStr);
    } else if (preset === 'last3days') {
      const d3 = new Date(now.getTime() - 2 * 86400000);
      setStartDate(d3.toISOString().split('T')[0]);
      setEndDate(todayStr);
    } else if (preset === 'last7days') {
      const d7 = new Date(now.getTime() - 6 * 86400000);
      setStartDate(d7.toISOString().split('T')[0]);
      setEndDate(todayStr);
    }
  };

  const handleCustomDateChange = (start: string, end: string) => {
    setStartDate(start);
    setEndDate(end);
    setDatePreset('custom');
  };

  const handleResetFilters = () => {
    setDatePreset('all');
    setStartDate('');
    setEndDate('');
    setSelectedCentreId('all');
    setSelectedDecision('all');
    setSelectedStatus('all');
    setTableSearch('');
  };

  // Filtered Soul Records
  const filteredRecords = useMemo(() => {
    return dataService.getSoulRecords({
      centreId: selectedCentreId !== 'all' ? selectedCentreId : undefined,
      decisionType: selectedDecision !== 'all' ? (selectedDecision as DecisionType) : undefined,
      status: selectedStatus !== 'all' ? selectedStatus : undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      includeDeleted: false,
    });
  }, [selectedCentreId, selectedDecision, selectedStatus, startDate, endDate, refreshTrigger]);

  // Filtered Batches
  const filteredBatches = useMemo(() => {
    return dataService.getBatches({
      centreId: selectedCentreId !== 'all' ? selectedCentreId : undefined,
      status: selectedStatus !== 'all' ? selectedStatus : undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      includeDeleted: false,
    });
  }, [selectedCentreId, selectedStatus, startDate, endDate, refreshTrigger]);

  // Computed Metrics
  const reportData = useMemo<CampaignReportData>(() => {
    const totalIndividual = filteredRecords.length;
    const totalBatchSouls = filteredBatches.reduce((sum, b) => sum + b.count, 0);
    const totalSouls = totalIndividual + totalBatchSouls;

    // Target Calculation
    let target = campaign.target;
    if (selectedCentreId !== 'all') {
      const matchedCentre = centres.find(c => c.id === selectedCentreId);
      target = matchedCentre ? matchedCentre.target : campaign.target;
    }

    const attainmentPercent = target > 0 ? Math.round((totalSouls / target) * 1000) / 10 : 0;

    // Decision Breakdown
    let newConverts = filteredRecords.filter(r => r.decisionType === 'new_convert').length;
    let rededications = filteredRecords.filter(r => r.decisionType === 'rededication').length;
    let returnees = filteredRecords.filter(r => r.decisionType === 'returnee').length;

    filteredBatches.forEach(b => {
      newConverts += b.newConverts || 0;
      rededications += b.rededications || 0;
      returnees += b.returnees || 0;
    });

    const safeTotal = Math.max(1, totalSouls);
    const newConvertsPercent = Math.round((newConverts / safeTotal) * 1000) / 10;
    const rededicationsPercent = Math.round((rededications / safeTotal) * 1000) / 10;
    const returneesPercent = Math.round((returnees / safeTotal) * 1000) / 10;

    // Gender Demographics (Calculated from detailed individual records)
    const maleCount = filteredRecords.filter(r => r.gender === 'male').length;
    const femaleCount = filteredRecords.filter(r => r.gender === 'female').length;
    const safeGenderTotal = Math.max(1, maleCount + femaleCount);
    const malePercent = Math.round((maleCount / safeGenderTotal) * 1000) / 10;
    const femalePercent = Math.round((femaleCount / safeGenderTotal) * 1000) / 10;

    // Age Brackets
    const ageChild = filteredRecords.filter(r => r.ageBracket === 'child').length;
    const ageYouth = filteredRecords.filter(r => r.ageBracket === 'youth').length;
    const ageAdult = filteredRecords.filter(r => r.ageBracket === 'adult').length;
    const ageSenior = filteredRecords.filter(r => r.ageBracket === 'senior').length;
    const safeAgeTotal = Math.max(1, ageChild + ageYouth + ageAdult + ageSenior);

    const ageChildPercent = Math.round((ageChild / safeAgeTotal) * 1000) / 10;
    const ageYouthPercent = Math.round((ageYouth / safeAgeTotal) * 1000) / 10;
    const ageAdultPercent = Math.round((ageAdult / safeAgeTotal) * 1000) / 10;
    const ageSeniorPercent = Math.round((ageSenior / safeAgeTotal) * 1000) / 10;

    // Follow-up Pipeline
    const followUpNotStarted = filteredRecords.filter(r => r.followUpStatus === 'not_started' || !r.followUpStatus).length;
    const followUpContacted = filteredRecords.filter(r => r.followUpStatus === 'contacted').length;
    const followUpVisited = filteredRecords.filter(r => r.followUpStatus === 'visited').length;
    const followUpIntegrated = filteredRecords.filter(r => r.followUpStatus === 'integrated').length;
    const followUpUnreachable = filteredRecords.filter(r => r.followUpStatus === 'unreachable').length;

    // Status counts
    const verifiedCount =
      filteredRecords.filter(r => r.status === 'verified').length +
      filteredBatches.filter(b => b.status === 'verified').reduce((s, b) => s + b.count, 0);
    const pendingCount =
      filteredRecords.filter(r => r.status === 'pending').length +
      filteredBatches.filter(b => b.status === 'pending').reduce((s, b) => s + b.count, 0);

    // Centre Breakdown
    const regionMap = new Map(regions.map(r => [r.id, r.name]));
    const targetCentres = selectedCentreId !== 'all' ? centres.filter(c => c.id === selectedCentreId) : centres;

    const centreBreakdown = targetCentres.map(c => {
      const cRecords = filteredRecords.filter(r => r.centreId === c.id).length;
      const cBatchSouls = filteredBatches.filter(b => b.centreId === c.id).reduce((s, b) => s + b.count, 0);
      const cTotal = cRecords + cBatchSouls;
      const cAttainment = c.target > 0 ? Math.round((cTotal / c.target) * 1000) / 10 : 0;

      let status: 'Exceeded' | 'On Track' | 'Pacing' | 'Starting' = 'Starting';
      if (cAttainment >= 100) status = 'Exceeded';
      else if (cAttainment >= 60) status = 'On Track';
      else if (cAttainment >= 25) status = 'Pacing';

      return {
        centreId: c.id,
        centreName: c.name,
        code: c.code,
        regionName: regionMap.get(c.regionId) || 'National',
        coordinatorName: c.coordinatorName || 'Assigned Coordinator',
        target: c.target,
        individualRecords: cRecords,
        batchSouls: cBatchSouls,
        totalSouls: cTotal,
        attainmentPercent: cAttainment,
        status,
      };
    });

    // Sort centre breakdown
    centreBreakdown.sort((a, b) => b.totalSouls - a.totalSouls);

    // Scope Label
    let dateRangeLabel = 'Entire Campaign Duration';
    if (startDate && endDate) {
      if (startDate === endDate) {
        dateRangeLabel = `Date: ${new Date(startDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`;
      } else {
        dateRangeLabel = `${new Date(startDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} – ${new Date(endDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`;
      }
    } else if (startDate) {
      dateRangeLabel = `From ${startDate}`;
    } else if (endDate) {
      dateRangeLabel = `Up to ${endDate}`;
    }

    const activeCentreName =
      selectedCentreId !== 'all' ? centres.find(c => c.id === selectedCentreId)?.name || 'Selected Centre' : 'All 12 Collation Hubs';

    return {
      campaign,
      centres,
      regions,
      filterSummary: {
        dateRangeLabel,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        centreName: activeCentreName,
        centreId: selectedCentreId !== 'all' ? selectedCentreId : undefined,
        totalRecordsCount: filteredRecords.length,
        totalBatchCount: filteredBatches.length,
        totalSouls,
      },
      metrics: {
        totalSouls,
        target,
        attainmentPercent,
        individualRecords: totalIndividual,
        batchSouls: totalBatchSouls,
        newConverts,
        newConvertsPercent,
        rededications,
        rededicationsPercent,
        returnees,
        returneesPercent,
        maleCount,
        malePercent,
        femaleCount,
        femalePercent,
        ageChild,
        ageChildPercent,
        ageYouth,
        ageYouthPercent,
        ageAdult,
        ageAdultPercent,
        ageSenior,
        ageSeniorPercent,
        followUpNotStarted,
        followUpContacted,
        followUpVisited,
        followUpIntegrated,
        followUpUnreachable,
        verifiedCount,
        pendingCount,
      },
      centreBreakdown,
      themeColorHex: palette.hex,
    };
  }, [
    campaign,
    centres,
    regions,
    filteredRecords,
    filteredBatches,
    selectedCentreId,
    startDate,
    endDate,
    palette.hex,
  ]);

  // Search filtered records for preview
  const displayRecords = useMemo(() => {
    if (!tableSearch.trim()) return filteredRecords.slice(0, 100);
    const q = tableSearch.toLowerCase();
    return filteredRecords.filter(r => {
      const name = `${r.firstName} ${r.lastName}`.toLowerCase();
      const phone = (r.phone || '').toLowerCase();
      const winner = (r.wonByName || '').toLowerCase();
      const comm = (r.community || '').toLowerCase();
      return name.includes(q) || phone.includes(q) || winner.includes(q) || comm.includes(q);
    });
  }, [filteredRecords, tableSearch]);

  // Sorted Centres for Table
  const sortedCentres = useMemo(() => {
    const list = [...reportData.centreBreakdown];
    list.sort((a, b) => {
      let diff = 0;
      if (sortField === 'soulsWon') diff = b.totalSouls - a.totalSouls;
      else if (sortField === 'attainment') diff = b.attainmentPercent - a.attainmentPercent;
      else if (sortField === 'name') diff = a.centreName.localeCompare(b.centreName);
      return sortOrder === 'desc' ? diff : -diff;
    });
    return list;
  }, [reportData.centreBreakdown, sortField, sortOrder]);

  const activeFilterCount =
    (datePreset !== 'all' ? 1 : 0) +
    (selectedCentreId !== 'all' ? 1 : 0) +
    (selectedDecision !== 'all' ? 1 : 0) +
    (selectedStatus !== 'all' ? 1 : 0);

  // Export Handlers
  const handleDownloadReport = () => {
    exportCollationReportCSV(reportData, filteredRecords);
  };

  const handleExportAllCSV = () => {
    exportAllRecordsCSV(filteredRecords, centres, regions);
  };

  const handleExportFollowUpCSV = () => {
    exportFollowUpListCSV(filteredRecords, centres);
  };

  const handleExportAddressDirectoryCSV = () => {
    exportConvertAddressesCSV(filteredRecords, centres);
  };

  const handleDownloadHTMLReport = () => {
    downloadCampaignSummaryHTML(reportData);
  };

  const handleOpenPrintPreview = () => {
    setShowPrintModal(true);
  };

  // Filtered records for Geographic & Convert Living Addresses tab
  const geoFilteredRecords = useMemo(() => {
    return filteredRecords.filter(r => {
      if (geoCouncilFilter !== 'all') {
        const matchesCouncil =
          r.residentialAreaCouncil?.toLowerCase() === geoCouncilFilter.toLowerCase() ||
          r.areaCouncil?.toLowerCase() === geoCouncilFilter.toLowerCase();
        if (!matchesCouncil) return false;
      }
      if (geoSearchQuery.trim()) {
        const q = geoSearchQuery.toLowerCase();
        const full = `${r.firstName} ${r.lastName} ${r.phone || ''} ${r.residentialAddress || ''} ${r.residentialDistrict || ''} ${r.residentialAreaCouncil || ''} ${r.outreachSpot || ''} ${r.wonByName || ''}`.toLowerCase();
        if (!full.includes(q)) return false;
      }
      return true;
    });
  }, [filteredRecords, geoCouncilFilter, geoSearchQuery]);

  return (
    <div className="space-y-6 pb-12" id="reports-screen">
      {/* Top Header Card & Quick Export Actions */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-700 shadow-sm transition-all">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm"
                style={{ backgroundColor: palette.hex }}
              >
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  Collation & Executive Reports
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
                  Audited harvest statistics, customizable demographic filters, and multi-format exports
                </p>
              </div>
            </div>
          </div>

          {/* Primary Export Actions Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Primary Action: Download Report (Collation CSV for offline record-keeping) */}
            <button
              id="download-report-btn"
              onClick={handleDownloadReport}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white transition-all hover:opacity-90 active:scale-95 shadow-sm cursor-pointer ${palette.btnPrimary}`}
              style={{ backgroundColor: palette.hex }}
              title="Download comprehensive collation audit report (CSV) for offline record-keeping"
            >
              <Download className="w-4 h-4" />
              <span>Download Report</span>
              <span className="ml-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-white/20 text-white">
                CSV
              </span>
            </button>

            {/* Action 1: Export All Records CSV */}
            <button
              id="export-all-records-btn"
              onClick={handleExportAllCSV}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 border border-slate-300/80 dark:border-slate-600 transition-colors shadow-sm active:scale-95 cursor-pointer"
              title="Export raw record list matching current filters to CSV"
            >
              <Download className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>All Records (CSV)</span>
              <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600">
                {filteredRecords.length.toLocaleString()}
              </span>
            </button>

            {/* Action 2: Export Follow-Up List CSV */}
            <button
              id="export-followup-list-btn"
              onClick={handleExportFollowUpCSV}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 border border-slate-300/80 dark:border-slate-600 transition-colors shadow-sm active:scale-95 cursor-pointer"
              title="Export structured phone contact and visitation list for pastoral follow-up"
            >
              <Users className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              <span>Follow-Up (CSV)</span>
              <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600">
                {filteredRecords.filter(r => !!r.phone).length.toLocaleString()}
              </span>
            </button>

            {/* Action 2b: Export Convert Addresses & Bus Routes CSV */}
            <button
              id="export-addresses-btn"
              onClick={handleExportAddressDirectoryCSV}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 transition-colors shadow-sm active:scale-95 cursor-pointer"
              title="Export convert living addresses, residential districts, and suggested church bus lines to CSV"
            >
              <Home className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Addresses (CSV)</span>
            </button>

            {/* Action 3: Printable Campaign Summary Report (HTML) */}
            <div className="inline-flex rounded-xl shadow-sm">
              <button
                id="download-html-summary-btn"
                onClick={handleDownloadHTMLReport}
                className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-l-xl text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 border border-slate-300/80 dark:border-slate-600 transition-colors cursor-pointer active:scale-95"
                title="Download standalone styled printable HTML report"
              >
                <FileText className="w-4 h-4" />
                <span>Summary (HTML)</span>
              </button>
              <button
                id="preview-print-report-btn"
                onClick={handleOpenPrintPreview}
                className="inline-flex items-center px-3 py-2.5 rounded-r-xl text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 border-t border-b border-r border-slate-300/80 dark:border-slate-600 border-l border-l-slate-300/40 dark:border-l-slate-600 hover:bg-black/10 active:scale-95 cursor-pointer"
                title="Open in-app print preview & direct print dialog"
              >
                <Printer className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Control Bar */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-700 shadow-sm space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-100 dark:border-slate-700/80 pb-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-500" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
              Filter Parameters & Scope
            </span>
            {activeFilterCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-300">
                {activeFilterCount} active filter{activeFilterCount > 1 ? 's' : ''}
              </span>
            )}
          </div>

          {activeFilterCount > 0 && (
            <button
              onClick={handleResetFilters}
              className="text-xs font-semibold text-rose-600 hover:text-rose-700 dark:text-rose-400 flex items-center gap-1 hover:underline cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Reset All Filters
            </button>
          )}
        </div>

        {/* Date Presets and Pickers */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-end">
          {/* Quick Date Presets */}
          <div className="lg:col-span-6 space-y-1.5">
            <label className="text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider">
              Date Period Preset
            </label>
            <div className="flex flex-wrap gap-1.5">
              {(
                [
                  { key: 'all', label: 'All Campaign' },
                  { key: 'today', label: 'Today' },
                  { key: 'yesterday', label: 'Yesterday' },
                  { key: 'last3days', label: 'Last 3 Days' },
                  { key: 'last7days', label: 'Past 7 Days' },
                  { key: 'custom', label: 'Custom' },
                ] as const
              ).map(p => {
                const isActive = datePreset === p.key;
                return (
                  <button
                    key={p.key}
                    onClick={() => applyPreset(p.key)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-slate-900 text-white dark:bg-sky-500 dark:text-white shadow-sm'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-700/70 dark:hover:bg-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date Range Inputs */}
          <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Start Date
              </label>
              <input
                type="date"
                id="filter-start-date"
                value={startDate}
                onChange={e => handleCustomDateChange(e.target.value, endDate)}
                className="w-full text-xs font-medium px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                End Date
              </label>
              <input
                type="date"
                id="filter-end-date"
                value={endDate}
                onChange={e => handleCustomDateChange(startDate, e.target.value)}
                className="w-full text-xs font-medium px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Secondary Filters: Centre, Decision Type, Verification Status */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100 dark:border-slate-700/60">
          {/* Centre Filter */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider flex items-center gap-1">
              <Building2 className="w-3 h-3" />
              Collation Centre
            </label>
            <select
              id="filter-centre-select"
              value={selectedCentreId}
              onChange={e => setSelectedCentreId(e.target.value)}
              className="w-full text-xs font-semibold px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 outline-none"
            >
              <option value="all">All National Centres (12 Hubs)</option>
              {centres.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.code}) - Target: {c.target.toLocaleString()}
                </option>
              ))}
            </select>
          </div>

          {/* Decision Type Filter */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider flex items-center gap-1">
              <Heart className="w-3 h-3" />
              Decision Category
            </label>
            <select
              id="filter-decision-select"
              value={selectedDecision}
              onChange={e => setSelectedDecision(e.target.value)}
              className="w-full text-xs font-semibold px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 outline-none"
            >
              <option value="all">All Decision Types</option>
              <option value="new_convert">New Converts Only</option>
              <option value="rededication">Rededications Only</option>
              <option value="returnee">Returnees Only</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              Verification Status
            </label>
            <select
              id="filter-status-select"
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
              className="w-full text-xs font-semibold px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 outline-none"
            >
              <option value="all">All Statuses (Verified & Pending)</option>
              <option value="verified">Verified Records Only</option>
              <option value="pending">Pending Queue Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Scope Summary Strip */}
      <div className="flex items-center justify-between flex-wrap gap-3 px-4 py-2.5 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200/80 dark:border-sky-800 text-xs text-sky-900 dark:text-sky-200 font-medium">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-sky-600 dark:text-sky-400" />
          <span>
            Active Scope: <strong>{reportData.filterSummary.centreName}</strong> ·{' '}
            <strong>{reportData.filterSummary.dateRangeLabel}</strong>
          </span>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <span>
            Matching Souls: <strong>{reportData.metrics.totalSouls.toLocaleString()}</strong>
          </span>
          <span>
            Individual: <strong>{reportData.metrics.individualRecords.toLocaleString()}</strong>
          </span>
          <span>
            Crusade Batches: <strong>{reportData.metrics.batchSouls.toLocaleString()}</strong>
          </span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 pb-2">
        <button
          onClick={() => setActiveTab('summary')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
            activeTab === 'summary'
              ? 'bg-slate-900 text-white dark:bg-sky-500 dark:text-white shadow-sm'
              : 'bg-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Summary Statistics & Analytics</span>
        </button>
        <button
          onClick={() => setActiveTab('centres')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
            activeTab === 'centres'
              ? 'bg-slate-900 text-white dark:bg-sky-500 dark:text-white shadow-sm'
              : 'bg-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Centre Performance Table ({reportData.centreBreakdown.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('records')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
            activeTab === 'records'
              ? 'bg-slate-900 text-white dark:bg-sky-500 dark:text-white shadow-sm'
              : 'bg-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Filtered Records List ({filteredRecords.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('reconciliation')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
            activeTab === 'reconciliation'
              ? 'bg-slate-900 text-white dark:bg-sky-500 dark:text-white shadow-sm'
              : 'bg-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
          }`}
        >
          <CheckSquare className="w-4 h-4" />
          <span>Reconciliation & Tally Audit</span>
        </button>
        <button
          onClick={() => setActiveTab('geographic')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
            activeTab === 'geographic'
              ? 'bg-slate-900 text-white dark:bg-sky-500 dark:text-white shadow-sm'
              : 'bg-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
          }`}
        >
          <Home className="w-4 h-4" />
          <span>Geographic & Convert Addresses</span>
        </button>
      </div>

      {/* TAB 4: RECONCILIATION & TALLY AUDIT */}
      {activeTab === 'reconciliation' && (
        <div className="space-y-6">
          {(() => {
            const reconStats = dataService.getReconciliationStats();
            const workerStats = dataService.getWorkerReconciliationStats();
            return (
              <>
                {/* Top Action Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-sm">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <CheckSquare className="w-4 h-4 text-emerald-600" /> Tap Tally & Reconciliation Telemetry
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Monitoring how quickly field tap tallies are converted into fully verified soul records with contact details.
                    </p>
                  </div>
                  <button
                    onClick={() => exportUnreconciledCSV(filteredRecords, centres)}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 dark:bg-sky-600 dark:hover:bg-sky-500 text-white flex items-center gap-2 shadow-sm cursor-pointer transition-all"
                  >
                    <Download className="w-4 h-4" />
                    <span>Export Unreconciled CSV ({reconStats.totalPending})</span>
                  </button>
                </div>

                {/* KPI Overview Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-700 shadow-sm">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Total Tap Tallies</span>
                    <div className="text-3xl font-black font-mono-tabular text-slate-900 dark:text-slate-50 mt-2">
                      {reconStats.totalTapped.toLocaleString()}
                    </div>
                    <div className="text-xs text-slate-400 mt-1">All burst & single tap records created</div>
                  </div>
                  <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-700 shadow-sm">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Accounted For</span>
                    <div className="text-3xl font-black font-mono-tabular text-emerald-600 dark:text-emerald-400 mt-2">
                      {reconStats.totalReconciled.toLocaleString()}
                    </div>
                    <div className="text-xs text-slate-400 mt-1">{reconStats.reconciliationRate}% global reconciliation rate</div>
                  </div>
                  <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-700 shadow-sm">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">Pending Reconciliation</span>
                    <div className="text-3xl font-black font-mono-tabular text-amber-600 dark:text-amber-400 mt-2">
                      {reconStats.totalPending.toLocaleString()}
                    </div>
                    <div className="text-xs text-slate-400 mt-1">Awaiting worker contact details update</div>
                  </div>
                  <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-700 shadow-sm">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">Abandoned Tallies</span>
                    <div className="text-3xl font-black font-mono-tabular text-rose-600 dark:text-rose-400 mt-2">
                      {reconStats.totalAbandoned.toLocaleString()}
                    </div>
                    <div className="text-xs text-slate-400 mt-1">Retained in audit log with reasons</div>
                  </div>
                </div>

                {/* Worker Reconciliation Performance Table */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-slate-100">
                        Field Worker Reconciliation Performance ({workerStats.length})
                      </h4>
                      <p className="text-xs text-slate-400">Individual worker accountability and follow-up clearance rates</p>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-900/60 text-slate-400 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-700">
                          <th className="py-3 px-4">Field Worker</th>
                          <th className="py-3 px-4 text-right">Total Tapped</th>
                          <th className="py-3 px-4 text-right">Contactable</th>
                          <th className="py-3 px-4 text-right">Fully Documented</th>
                          <th className="py-3 px-4 text-right">Contactable Rate</th>
                          <th className="py-3 px-4 text-right">Reconciliation Rate</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                        {workerStats.map(w => (
                          <tr key={w.userName} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                            <td className="py-3 px-4 font-bold text-slate-900 dark:text-slate-100">{w.userName}</td>
                            <td className="py-3 px-4 text-right font-mono-tabular">{w.tappedCount}</td>
                            <td className="py-3 px-4 text-right font-mono-tabular text-emerald-600 font-bold">{w.contactableCount}</td>
                            <td className="py-3 px-4 text-right font-mono-tabular text-blue-600 font-bold">{w.reconciledCount}</td>
                            <td className="py-3 px-4 text-right font-mono-tabular font-black">
                              <span className="px-2.5 py-1 rounded-full text-[10px] bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                                {w.contactableRate}%
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right font-mono-tabular font-black">
                              <span className={`px-2.5 py-1 rounded-full text-[10px] ${w.rate >= 80 ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300' : w.rate >= 50 ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300' : 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'}`}>
                                {w.rate}%
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            );
          })()}
        </div>
      )}

      {/* TAB 1: SUMMARY STATISTICS */}
      {activeTab === 'summary' && (
        <div className="space-y-6">
          {/* Executive KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Harvest in Scope */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-700 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Total Harvest (In Scope)
                </span>
                <Flame className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-3xl font-black text-slate-900 dark:text-white mt-2 font-mono">
                {reportData.metrics.totalSouls.toLocaleString()}
              </div>
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mt-2 pt-2 border-t border-slate-100 dark:border-slate-700/60 font-medium">
                <span>Scope Target: {reportData.metrics.target.toLocaleString()}</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {reportData.metrics.attainmentPercent}% Attained
                </span>
              </div>
            </div>

            {/* New Converts */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-700 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  New Converts
                </span>
                <Sparkles className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-3xl font-black text-slate-900 dark:text-white mt-2 font-mono">
                {reportData.metrics.newConverts.toLocaleString()}
              </div>
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mt-2 pt-2 border-t border-slate-100 dark:border-slate-700/60 font-medium">
                <span>First-time decisions</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {reportData.metrics.newConvertsPercent}% of harvest
                </span>
              </div>
            </div>

            {/* Rededications */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-700 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400">
                  Rededications
                </span>
                <Heart className="w-4 h-4 text-sky-500" />
              </div>
              <div className="text-3xl font-black text-slate-900 dark:text-white mt-2 font-mono">
                {reportData.metrics.rededications.toLocaleString()}
              </div>
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mt-2 pt-2 border-t border-slate-100 dark:border-slate-700/60 font-medium">
                <span>Renewed commitments</span>
                <span className="font-bold text-sky-600 dark:text-sky-400">
                  {reportData.metrics.rededicationsPercent}% of harvest
                </span>
              </div>
            </div>

            {/* Returnees */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-700 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  Returnees
                </span>
                <RefreshCw className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-3xl font-black text-slate-900 dark:text-white mt-2 font-mono">
                {reportData.metrics.returnees.toLocaleString()}
              </div>
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mt-2 pt-2 border-t border-slate-100 dark:border-slate-700/60 font-medium">
                <span>Restored backsliders</span>
                <span className="font-bold text-amber-600 dark:text-amber-400">
                  {reportData.metrics.returneesPercent}% of harvest
                </span>
              </div>
            </div>
          </div>

          {/* Attainment Progress Visual Bar */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-700 shadow-sm space-y-2">
            <div className="flex justify-between items-center text-xs font-bold">
              <span className="text-slate-700 dark:text-slate-200 uppercase tracking-wider">
                Harvest Target Attainment Bar
              </span>
              <span className="text-slate-900 dark:text-white font-mono">
                {reportData.metrics.totalSouls.toLocaleString()} / {reportData.metrics.target.toLocaleString()} souls (
                {reportData.metrics.attainmentPercent}%)
              </span>
            </div>
            <div className="w-full h-3.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden border border-slate-200 dark:border-slate-600">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(100, reportData.metrics.attainmentPercent)}%`,
                  backgroundColor: palette.hex,
                }}
              />
            </div>
          </div>

          {/* Demographic & Pipeline Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Gender Demographics */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-700 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Gender Distribution
                </h3>
                <Users className="w-4 h-4 text-slate-400" />
              </div>

              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-pink-600 dark:text-pink-400">Female Converts</span>
                    <span className="font-mono text-slate-900 dark:text-white">
                      {reportData.metrics.femaleCount.toLocaleString()} ({reportData.metrics.femalePercent}%)
                    </span>
                  </div>
                  <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full bg-pink-500 rounded-full" style={{ width: `${reportData.metrics.femalePercent}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-sky-600 dark:text-sky-400">Male Converts</span>
                    <span className="font-mono text-slate-900 dark:text-white">
                      {reportData.metrics.maleCount.toLocaleString()} ({reportData.metrics.malePercent}%)
                    </span>
                  </div>
                  <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full bg-sky-500 rounded-full" style={{ width: `${reportData.metrics.malePercent}%` }} />
                  </div>
                </div>
              </div>

              <p className="text-[11px] text-slate-400 dark:text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-700/60">
                Aggregated from {reportData.metrics.individualRecords.toLocaleString()} verified individual registry records.
              </p>
            </div>

            {/* Age Brackets */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-700 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Age Demographics
                </h3>
                <Layers className="w-4 h-4 text-slate-400" />
              </div>

              <div className="space-y-2.5 text-xs font-semibold">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-slate-600 dark:text-slate-300">Youth (18–35 yrs)</span>
                    <span className="font-mono text-slate-900 dark:text-white">
                      {reportData.metrics.ageYouth.toLocaleString()} ({reportData.metrics.ageYouthPercent}%)
                    </span>
                  </div>
                  <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full bg-cyan-500 rounded-full" style={{ width: `${reportData.metrics.ageYouthPercent}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-slate-600 dark:text-slate-300">Adults (36–59 yrs)</span>
                    <span className="font-mono text-slate-900 dark:text-white">
                      {reportData.metrics.ageAdult.toLocaleString()} ({reportData.metrics.ageAdultPercent}%)
                    </span>
                  </div>
                  <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full bg-violet-500 rounded-full" style={{ width: `${reportData.metrics.ageAdultPercent}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-slate-600 dark:text-slate-300">Children (&lt;18 yrs)</span>
                    <span className="font-mono text-slate-900 dark:text-white">
                      {reportData.metrics.ageChild.toLocaleString()} ({reportData.metrics.ageChildPercent}%)
                    </span>
                  </div>
                  <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full bg-rose-500 rounded-full" style={{ width: `${reportData.metrics.ageChildPercent}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-slate-600 dark:text-slate-300">Seniors (60+ yrs)</span>
                    <span className="font-mono text-slate-900 dark:text-white">
                      {reportData.metrics.ageSenior.toLocaleString()} ({reportData.metrics.ageSeniorPercent}%)
                    </span>
                  </div>
                  <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full bg-slate-400 rounded-full" style={{ width: `${reportData.metrics.ageSeniorPercent}%` }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Follow-up Funnel Pipeline */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-700 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Follow-Up & Discipleship Funnel
                </h3>
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700">
                  <span className="text-[10px] uppercase font-bold text-slate-400">1. Not Started</span>
                  <div className="text-base font-black text-slate-700 dark:text-slate-300 font-mono mt-0.5">
                    {reportData.metrics.followUpNotStarted.toLocaleString()}
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200/80 dark:border-sky-800">
                  <span className="text-[10px] uppercase font-bold text-sky-700 dark:text-sky-400">2. Contacted</span>
                  <div className="text-base font-black text-sky-800 dark:text-sky-200 font-mono mt-0.5">
                    {reportData.metrics.followUpContacted.toLocaleString()}
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200/80 dark:border-purple-800">
                  <span className="text-[10px] uppercase font-bold text-purple-700 dark:text-purple-400">3. Visited</span>
                  <div className="text-base font-black text-purple-800 dark:text-purple-200 font-mono mt-0.5">
                    {reportData.metrics.followUpVisited.toLocaleString()}
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800">
                  <span className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-400">4. Integrated</span>
                  <div className="text-base font-black text-emerald-800 dark:text-emerald-200 font-mono mt-0.5">
                    {reportData.metrics.followUpIntegrated.toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800 text-xs flex justify-between items-center">
                <span className="font-semibold text-amber-800 dark:text-amber-300">Total Reachable via Phone</span>
                <span className="font-bold font-mono text-amber-900 dark:text-amber-200">
                  {filteredRecords.filter(r => !!r.phone).length.toLocaleString()} converts
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CENTRES PERFORMANCE TABLE */}
      {activeTab === 'centres' && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200/80 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Centre-by-Centre Collation & Target Attainment
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Comparative rankings based on active date and category filters
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium">Sort by:</span>
              <button
                onClick={() => {
                  if (sortField === 'soulsWon') setSortOrder(o => (o === 'desc' ? 'asc' : 'desc'));
                  else {
                    setSortField('soulsWon');
                    setSortOrder('desc');
                  }
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 ${
                  sortField === 'soulsWon' ? 'bg-sky-100 text-sky-800 dark:bg-sky-900/50 dark:text-sky-200' : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                }`}
              >
                Souls Won <ArrowUpDown className="w-3 h-3" />
              </button>
              <button
                onClick={() => {
                  if (sortField === 'attainment') setSortOrder(o => (o === 'desc' ? 'asc' : 'desc'));
                  else {
                    setSortField('attainment');
                    setSortOrder('desc');
                  }
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 ${
                  sortField === 'attainment' ? 'bg-sky-100 text-sky-800 dark:bg-sky-900/50 dark:text-sky-200' : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                }`}
              >
                % Attainment <ArrowUpDown className="w-3 h-3" />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900/80 text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-4 py-3 text-center w-12">#</th>
                  <th className="px-4 py-3">Collation Hub</th>
                  <th className="px-4 py-3">Region</th>
                  <th className="px-4 py-3">Coordinator</th>
                  <th className="px-4 py-3 text-right">Target</th>
                  <th className="px-4 py-3 text-right">Individual</th>
                  <th className="px-4 py-3 text-right">Batches</th>
                  <th className="px-4 py-3 text-right font-black text-slate-900 dark:text-white">Total Harvest</th>
                  <th className="px-4 py-3 text-right">% Target</th>
                  <th className="px-4 py-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 font-medium">
                {sortedCentres.map((c, idx) => {
                  return (
                    <tr key={c.centreId} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/40 transition-colors">
                      <td className="px-4 py-3 text-center font-bold text-slate-400">{idx + 1}</td>
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-900 dark:text-white">{c.centreName}</div>
                        <div className="text-[10px] text-slate-400">{c.code}</div>
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{c.regionName}</td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{c.coordinatorName}</td>
                      <td className="px-4 py-3 text-right font-mono text-slate-500 dark:text-slate-400">{c.target.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right font-mono text-slate-600 dark:text-slate-300">{c.individualRecords.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right font-mono text-slate-600 dark:text-slate-300">{c.batchSouls.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right font-mono font-black text-slate-900 dark:text-white text-sm">
                        {c.totalSouls.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold">
                        <span className={c.attainmentPercent >= 100 ? 'text-emerald-600 dark:text-emerald-400' : 'text-sky-600 dark:text-sky-400'}>
                          {c.attainmentPercent}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase ${
                            c.status === 'Exceeded'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : c.status === 'On Track'
                              ? 'bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300'
                              : c.status === 'Pacing'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                              : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {c.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: FILTERED RECORDS PREVIEW TABLE */}
      {activeTab === 'records' && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-sm overflow-hidden space-y-3">
          <div className="p-4 border-b border-slate-200/80 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Filtered Converts Registry
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Showing {displayRecords.length} of {filteredRecords.length} records matching current filter criteria
              </p>
            </div>

            {/* Quick in-table Search */}
            <div className="relative min-w-[240px]">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search convert name, phone, winner..."
                value={tableSearch}
                onChange={e => setTableSearch(e.target.value)}
                className="w-full text-xs pl-8 pr-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900/80 text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-4 py-3">Convert Name</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">Gender / Age</th>
                  <th className="px-4 py-3">Decision</th>
                  <th className="px-4 py-3">Hub & Community</th>
                  <th className="px-4 py-3">Soul Winner</th>
                  <th className="px-4 py-3">Date Won</th>
                  <th className="px-4 py-3">Follow-Up Stage</th>
                  <th className="px-4 py-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 font-medium">
                {displayRecords.map(r => {
                  const centre = centres.find(c => c.id === r.centreId);
                  return (
                    <tr key={r.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/40 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-900 dark:text-white">
                          {r.firstName} {r.lastName}
                        </div>
                        <div className="text-[10px] font-mono text-slate-400">{r.id}</div>
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-700 dark:text-slate-300">
                        <div className="flex items-center gap-1.5">
                          <span>{r.phone || <span className="text-slate-400 italic">No phone</span>}</span>
                          {r.phone && getWhatsAppLink({
                            phone: r.phone,
                            firstName: r.firstName,
                            lastName: r.lastName,
                            decisionType: r.decisionType,
                            centreName: centre?.name,
                            soulWinnerName: r.wonByName,
                          }) && (
                            <a
                              href={getWhatsAppLink({
                                phone: r.phone,
                                firstName: r.firstName,
                                lastName: r.lastName,
                                decisionType: r.decisionType,
                                centreName: centre?.name,
                                soulWinnerName: r.wonByName,
                              })!}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1 rounded-md bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 transition-colors"
                              title="Message soul on WhatsApp"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                        <span className="capitalize">{r.gender || 'Unknown'}</span> ·{' '}
                        <span className="capitalize">{r.ageBracket || 'N/A'}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                            r.decisionType === 'new_convert'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : r.decisionType === 'rededication'
                              ? 'bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                          }`}
                        >
                          {r.decisionType.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-slate-900 dark:text-white font-medium">{centre?.name || 'Central Hub'}</div>
                        <div className="flex flex-col gap-0.5 mt-0.5">
                          {r.outreachSpot && (
                            <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1">
                              <MapPin className="w-2.5 h-2.5 shrink-0" />
                              Won: {r.outreachSpot}
                            </span>
                          )}
                          <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold flex items-center gap-1">
                            <Home className="w-2.5 h-2.5 shrink-0" />
                            Lives: {r.residentialDistrict || r.residentialAddress || r.community || 'Abuja'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{r.wonByName}</td>
                      <td className="px-4 py-3 text-slate-500 font-mono text-[11px]">
                        {new Date(r.wonAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 capitalize">
                          {(r.followUpStatus || 'not_started').replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => setSelectedRecordForDetail(r)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-sky-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                          title="View complete record details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: GEOGRAPHIC & CONVERT LIVING ADDRESSES */}
      {activeTab === 'geographic' && (
        <div className="space-y-6">
          {/* Top Info Banner & Actions */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-700 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-xs uppercase tracking-wider">
                <Navigation className="w-4 h-4" />
                <span>Geospatial Intelligence & Convert Address Ledger</span>
              </div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white">
                Abuja FCT Harvest Maps & Convert Living Addresses
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-2xl">
                Compare where souls were won during field outreach against where converts actually live across Abuja FCT's 6 Area Councils.
                Use this spatial intelligence to route Sunday church buses, assign neighborhood cell fellowships, and coordinate follow-up visitation teams.
              </p>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <button
                onClick={handleExportAddressDirectoryCSV}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-sm flex items-center gap-2 transition-all cursor-pointer"
                title="Download convert addresses and recommended bus routes to CSV"
              >
                <Download className="w-4 h-4" />
                <span>Export Address Ledger (CSV)</span>
              </button>
            </div>
          </div>

          {/* Interactive Geospatial Harvest Map */}
          <GeospatialHarvestMap
            initialMode="outreach"
            className="shadow-sm"
          />

          {/* Convert Living Addresses Directory & Pastoral Inspection Table */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-200/80 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Home className="w-4 h-4 text-indigo-500" />
                  Convert Address Directory & Bus Route Allocations
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Searchable ledger of convert living addresses, residential districts, and bus lines ({geoFilteredRecords.length} records)
                </p>
              </div>

              {/* Filters for address directory */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search name, street, district..."
                    value={geoSearchQuery}
                    onChange={e => setGeoSearchQuery(e.target.value)}
                    className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 w-48 sm:w-60"
                  />
                  {geoSearchQuery && (
                    <button
                      onClick={() => setGeoSearchQuery('')}
                      className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <select
                  value={geoCouncilFilter}
                  onChange={e => setGeoCouncilFilter(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-xl px-3 py-1.5 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="all">All Area Councils</option>
                  <option value="AMAC">AMAC</option>
                  <option value="Bwari">Bwari</option>
                  <option value="Gwagwalada">Gwagwalada</option>
                  <option value="Kuje">Kuje</option>
                  <option value="Kwali">Kwali</option>
                  <option value="Abaji">Abaji</option>
                </select>
              </div>
            </div>

            {/* Address Directory Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-900/80 text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="px-4 py-3">Convert Details</th>
                    <th className="px-4 py-3">Phone / WhatsApp</th>
                    <th className="px-4 py-3">Outreach Spot (Where Won)</th>
                    <th className="px-4 py-3">Living Street Address (Where Lives)</th>
                    <th className="px-4 py-3">Neighborhood & Council</th>
                    <th className="px-4 py-3">Bus Route / Follow-Up Church</th>
                    <th className="px-4 py-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 font-medium">
                  {geoFilteredRecords.slice(0, 50).map(r => {
                    const busRoute = r.residentialDistrict
                      ? `${r.residentialDistrict} ⇄ Central Assembly`
                      : 'Central Shuttle';
                    const waLink = r.phone ? getWhatsAppLink({
                      phone: r.phone,
                      firstName: r.firstName,
                      lastName: r.lastName,
                      decisionType: r.decisionType,
                      centreName: r.followUpChurch || 'Christ Embassy',
                      soulWinnerName: r.wonByName,
                    }) : null;

                    return (
                      <tr key={r.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/40 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-bold text-slate-900 dark:text-white">
                            {r.firstName} {r.lastName}
                          </div>
                          <div className="text-[10px] text-slate-400 capitalize">
                            {r.gender || 'Unknown'} · {r.ageBracket || 'Adult'}
                          </div>
                        </td>
                        <td className="px-4 py-3 font-mono">
                          <div className="flex items-center gap-2">
                            <span className="text-slate-700 dark:text-slate-300 font-bold">
                              {r.phone || <span className="text-slate-400 font-normal italic">No phone</span>}
                            </span>
                            {waLink && (
                              <a
                                href={waLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1 rounded-md bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 transition-colors"
                                title="Open WhatsApp Gospel Message"
                              >
                                <MessageCircle className="w-3.5 h-3.5" />
                              </a>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-semibold">
                            <MapPin className="w-3.5 h-3.5 shrink-0" />
                            <span>{r.outreachSpot || r.areaCouncil || 'Field Outreach'}</span>
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            Won by {r.wonByName}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-start gap-1.5 text-slate-900 dark:text-white font-medium">
                            <Home className="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5" />
                            <span>{r.residentialAddress || <span className="text-slate-400 italic">No street recorded</span>}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60">
                            {r.residentialDistrict || 'Abuja General'}
                          </span>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            {r.residentialAreaCouncil || 'FCT'}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1 text-slate-700 dark:text-slate-300">
                            <Bus className="w-3.5 h-3.5 text-teal-500 shrink-0" />
                            <span className="font-semibold text-[11px]">{busRoute}</span>
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            Assigned: {r.followUpChurch || 'Central Assembly'}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => setSelectedRecordForDetail(r)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-sky-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                            title="View convert details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {geoFilteredRecords.length === 0 && (
                <div className="py-12 text-center text-slate-400 text-xs">
                  No convert records match the search or area council filter.
                </div>
              )}
            </div>

            {geoFilteredRecords.length > 50 && (
              <div className="p-3 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 text-center text-xs text-slate-500">
                Showing top 50 of {geoFilteredRecords.length} records. Export full CSV for complete list of all convert addresses.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Record Detail Modal */}
      {selectedRecordForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-700 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {selectedRecordForDetail.firstName} {selectedRecordForDetail.lastName}
                </h3>
                <span className="text-xs font-mono text-slate-400">ID: {selectedRecordForDetail.id}</span>
              </div>
              <button
                onClick={() => setSelectedRecordForDetail(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900">
                <span className="text-[10px] font-bold uppercase text-slate-400">Phone Contact</span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    {selectedRecordForDetail.phone || 'No phone recorded'}
                  </span>
                  {selectedRecordForDetail.phone && getWhatsAppLink({
                    phone: selectedRecordForDetail.phone,
                    firstName: selectedRecordForDetail.firstName,
                    lastName: selectedRecordForDetail.lastName,
                    decisionType: selectedRecordForDetail.decisionType,
                    centreName: selectedRecordForDetail.followUpChurch,
                    soulWinnerName: selectedRecordForDetail.wonByName,
                  }) && (
                    <a
                      href={getWhatsAppLink({
                        phone: selectedRecordForDetail.phone,
                        firstName: selectedRecordForDetail.firstName,
                        lastName: selectedRecordForDetail.lastName,
                        decisionType: selectedRecordForDetail.decisionType,
                        centreName: selectedRecordForDetail.followUpChurch,
                        soulWinnerName: selectedRecordForDetail.wonByName,
                      })!}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 rounded-md bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 transition-colors"
                      title="Message on WhatsApp"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900">
                <span className="text-[10px] font-bold uppercase text-slate-400">Decision Type</span>
                <div className="font-bold text-slate-900 dark:text-white mt-0.5 capitalize">
                  {selectedRecordForDetail.decisionType.replace('_', ' ')}
                </div>
              </div>

              {/* Outreach Spot (Where Won) */}
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <span className="text-[10px] font-bold uppercase text-amber-600 dark:text-amber-400 flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> Outreach Spot (Where Won)
                </span>
                <div className="font-bold text-slate-900 dark:text-white mt-0.5">
                  {selectedRecordForDetail.outreachSpot || selectedRecordForDetail.areaCouncil || 'Field Outreach'}
                </div>
              </div>

              {/* Convert Living Address (Where Lives) */}
              <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                <span className="text-[10px] font-bold uppercase text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                  <Home className="w-3 h-3" /> Living Address (Where Lives)
                </span>
                <div className="font-bold text-slate-900 dark:text-white mt-0.5">
                  {selectedRecordForDetail.residentialAddress || selectedRecordForDetail.residentialDistrict || 'No address logged'}
                </div>
                {selectedRecordForDetail.residentialDistrict && (
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {selectedRecordForDetail.residentialDistrict} ({selectedRecordForDetail.residentialAreaCouncil || 'FCT'})
                  </div>
                )}
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900">
                <span className="text-[10px] font-bold uppercase text-slate-400">Gender & Age</span>
                <div className="font-bold text-slate-900 dark:text-white mt-0.5 capitalize">
                  {selectedRecordForDetail.gender || 'Unknown'} · {selectedRecordForDetail.ageBracket || 'N/A'}
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900">
                <span className="text-[10px] font-bold uppercase text-slate-400">Suggested Bus Route / Assembly</span>
                <div className="font-bold text-slate-900 dark:text-white mt-0.5 flex items-center gap-1">
                  <Bus className="w-3 h-3 text-teal-500 shrink-0" />
                  <span>
                    {selectedRecordForDetail.residentialDistrict
                      ? `${selectedRecordForDetail.residentialDistrict} ⇄ Church`
                      : (selectedRecordForDetail.followUpChurch || 'Central Assembly')}
                  </span>
                </div>
              </div>
              <div className="col-span-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900">
                <span className="text-[10px] font-bold uppercase text-slate-400">Pastoral Notes & Remarks</span>
                <div className="text-slate-700 dark:text-slate-300 mt-1">
                  {selectedRecordForDetail.notes || 'No specific notes recorded.'}
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedRecordForDetail(null)}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-slate-900 text-white dark:bg-sky-500 hover:opacity-90 cursor-pointer"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* In-App Printable HTML Report Modal */}
      {showPrintModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-6 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-slate-900 text-white rounded-2xl max-w-5xl w-full h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-slate-700">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-800 border-b border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-sky-400" />
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-white">
                    Printable Campaign Summary Report Preview
                  </h3>
                  <p className="text-xs text-slate-400">
                    Live styled document ready for instant printing or PDF generation
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => openPrintableSummaryReport(reportData)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-sky-500 hover:bg-sky-400 text-white flex items-center gap-1.5 transition-all shadow-sm"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Open in New Window
                </button>
                <button
                  onClick={handleDownloadHTMLReport}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-slate-700 hover:bg-slate-600 text-white flex items-center gap-1.5 transition-all"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download HTML
                </button>
                <button
                  onClick={() => setShowPrintModal(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Embedded Iframe Preview */}
            <div className="flex-1 bg-slate-200 p-2 overflow-hidden">
              <iframe
                title="Campaign Summary Report Preview"
                srcDoc={generateCampaignSummaryHTML(reportData)}
                className="w-full h-full rounded-xl border border-slate-300 bg-white shadow-inner"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
