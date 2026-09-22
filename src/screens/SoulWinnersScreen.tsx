import React, { useState, useMemo } from 'react';
import {
  Users,
  UserCheck,
  UserPlus,
  Phone,
  MessageSquare,
  MapPin,
  Home,
  Calendar,
  Trophy,
  Search,
  Download,
  Eye,
  CheckCircle2,
  Clock,
  Sparkles,
  Building2,
  X,
  ChevronRight,
  Flame,
  Award,
  Filter,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { dataService } from '../services/dataService';
import { SoulWinnerSummary, SoulRecord, UserRole } from '../types';
import { SoulWinnerRegistrationModal } from '../components/SoulWinnerRegistrationModal';

interface Props {
  userRole?: UserRole;
  theme?: string;
  onSuccessToast?: (title: string, message: string) => void;
  embeddedInAdmin?: boolean;
  onNavigate?: (screen: any) => void;
}

export const SoulWinnersScreen: React.FC<Props> = ({
  userRole = 'coordinator',
  onSuccessToast,
  embeddedInAdmin = false,
  onNavigate,
}) => {
  const { palette } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPcf, setSelectedPcf] = useState<string>('all');
  const [selectedCell, setSelectedCell] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'souls_desc' | 'souls_asc' | 'name_asc' | 'new_converts'>('souls_desc');
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [inspectingWinner, setInspectingWinner] = useState<SoulWinnerSummary | null>(null);

  // Inspector search and decision filter
  const [convertSearchQuery, setConvertSearchQuery] = useState('');
  const [convertDecisionFilter, setConvertDecisionFilter] = useState<'all' | 'new_convert' | 'rededication' | 'returnee'>('all');

  const activeProfile = dataService.getSoulWinnerProfile();
  const winners = dataService.getRegisteredSoulWinners();

  const maskPhone = (phoneNum?: string) => {
    if (!phoneNum) return 'N/A';
    const clean = phoneNum.trim();
    if (clean.length > 7) {
      return clean.slice(0, clean.length - 6) + '••••' + clean.slice(-2);
    }
    return '••••••••';
  };

  // Public Role Access Guard
  if (userRole === 'public') {
    return (
      <div className="max-w-2xl mx-auto my-12 p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl text-center space-y-4 shadow-xs">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
          <Award className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-black text-slate-900 dark:text-slate-100">
          Soul Winners Roster Restricted
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
          The Soul Winners Roster and individual convert records are reserved for verified field workers and leadership. For public honors and rankings, please view the Campaign Leaderboards.
        </p>
        <div className="pt-2">
          <button
            onClick={() => onNavigate?.('leaderboards')}
            className={`px-5 py-2.5 rounded-xl text-white font-bold text-xs shadow-xs cursor-pointer transition-transform active:scale-95 ${palette.btnPrimary}`}
          >
            Go to Campaign Leaderboards
          </button>
        </div>
      </div>
    );
  }

  // Extract unique PCFs and Cells for filter dropdowns
  const pcfOptions = useMemo(() => {
    const set = new Set<string>();
    winners.forEach(w => {
      if (w.pcfName) set.add(w.pcfName);
    });
    return Array.from(set).sort();
  }, [winners]);

  const cellOptions = useMemo(() => {
    const set = new Set<string>();
    winners.forEach(w => {
      if (w.cellName) set.add(w.cellName);
    });
    return Array.from(set).sort();
  }, [winners]);

  // Filter and sort soul winners
  const filteredWinners = useMemo(() => {
    return winners.filter(w => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        w.fullName.toLowerCase().includes(q) ||
        w.phone.toLowerCase().includes(q) ||
        w.cellName.toLowerCase().includes(q) ||
        w.pcfName.toLowerCase().includes(q) ||
        (w.churchName && w.churchName.toLowerCase().includes(q)) ||
        (w.roleTitle && w.roleTitle.toLowerCase().includes(q));

      const matchesPcf = selectedPcf === 'all' || w.pcfName === selectedPcf;
      const matchesCell = selectedCell === 'all' || w.cellName === selectedCell;

      return matchesSearch && matchesPcf && matchesCell;
    }).sort((a, b) => {
      if (sortBy === 'souls_desc') return b.totalSoulsWon - a.totalSoulsWon;
      if (sortBy === 'souls_asc') return a.totalSoulsWon - b.totalSoulsWon;
      if (sortBy === 'name_asc') return a.fullName.localeCompare(b.fullName);
      if (sortBy === 'new_converts') return b.newConvertsCount - a.newConvertsCount;
      return 0;
    });
  }, [winners, searchQuery, selectedPcf, selectedCell, sortBy]);

  // Key Aggregations for KPI Cards
  const stats = useMemo(() => {
    const totalWinners = winners.length;
    const totalSouls = winners.reduce((sum, w) => sum + w.totalSoulsWon, 0);
    const totalNamedRecords = winners.reduce((sum, w) => sum + w.recordSoulsCount, 0);
    const avgPerWinner = totalWinners > 0 ? (totalSouls / totalWinners).toFixed(1) : '0';

    // Top winner
    const topWinner = winners.length > 0 ? winners[0] : null;

    return {
      totalWinners,
      totalSouls,
      totalNamedRecords,
      avgPerWinner,
      topWinner,
    };
  }, [winners]);

  // Converts for the inspected winner with sub-filters
  const inspectedConverts = useMemo(() => {
    if (!inspectingWinner) return [];
    return inspectingWinner.souls.filter(soul => {
      const q = convertSearchQuery.toLowerCase().trim();
      const fullName = `${soul.firstName} ${soul.lastName}`.toLowerCase();
      const matchesSearch =
        !q ||
        fullName.includes(q) ||
        soul.phone.includes(q) ||
        (soul.outreachSpot && soul.outreachSpot.toLowerCase().includes(q)) ||
        (soul.residentialAddress && soul.residentialAddress.toLowerCase().includes(q)) ||
        (soul.residentialDistrict && soul.residentialDistrict.toLowerCase().includes(q));

      const matchesDecision =
        convertDecisionFilter === 'all' ||
        (convertDecisionFilter === 'new_convert' && soul.decisionType === 'new_convert') ||
        (convertDecisionFilter === 'rededication' && soul.decisionType === 'rededication') ||
        (convertDecisionFilter === 'returnee' && soul.decisionType !== 'new_convert' && soul.decisionType !== 'rededication');

      return matchesSearch && matchesDecision;
    });
  }, [inspectingWinner, convertSearchQuery, convertDecisionFilter]);

  const canSeeConvertContacts = useMemo(() => {
    if (!inspectingWinner) return false;
    if (userRole === 'coordinator' || userRole === 'admin') return true;
    if (!activeProfile) return false;
    const matchName = Boolean(activeProfile.fullName && inspectingWinner.fullName.toLowerCase() === activeProfile.fullName.toLowerCase());
    const matchPhone = Boolean(activeProfile.phone && inspectingWinner.phone === activeProfile.phone);
    return matchName || matchPhone;
  }, [userRole, activeProfile, inspectingWinner]);

  // Export Roster to CSV
  const handleExportRosterCSV = () => {
    const headers = [
      'Soul Winner ID',
      'Full Name',
      'Phone',
      'Cell Name',
      'PCF Group',
      'Church Centre',
      'Role Title',
      'Total Souls Won',
      'Named Records Count',
      'Batch Count',
      'New Converts',
      'Rededications',
      'Returnees',
      'Verified Count',
      'Pending Count',
      'Top Outreach Spots',
      'Top Residential Districts',
    ];

    const rows = filteredWinners.map(w => [
      `"${w.id}"`,
      `"${w.fullName}"`,
      `"${w.phone}"`,
      `"${w.cellName}"`,
      `"${w.pcfName}"`,
      `"${w.churchName || ''}"`,
      `"${w.roleTitle || ''}"`,
      w.totalSoulsWon,
      w.recordSoulsCount,
      w.batchSoulsCount,
      w.newConvertsCount,
      w.rededicationsCount,
      w.returneesCount,
      w.verifiedCount,
      w.pendingCount,
      `"${w.primaryOutreachSpots.join(', ')}"`,
      `"${w.primaryResidentialDistricts.join(', ')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Soul_Winners_Roster_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    onSuccessToast?.('CSV Exported', `Downloaded roster containing ${filteredWinners.length} soul winner(s).`);
  };

  // Export Specific Winner's Converts to CSV
  const handleExportWinnerConvertsCSV = (winner: SoulWinnerSummary) => {
    const headers = [
      'Record ID',
      'Soul Winner',
      'Winner Cell',
      'Winner PCF',
      'Convert First Name',
      'Convert Last Name',
      'Phone Number',
      'Decision Type',
      'Date Won',
      'Outreach Spot',
      'Residential Address',
      'Residential District',
      'Follow-Up Status',
      'Verification Status',
    ];

    const rows = winner.souls.map(soul => [
      `"${soul.id}"`,
      `"${winner.fullName}"`,
      `"${winner.cellName}"`,
      `"${winner.pcfName}"`,
      `"${soul.firstName}"`,
      `"${soul.lastName}"`,
      `"${soul.phone}"`,
      `"${soul.decisionType}"`,
      `"${soul.wonAt}"`,
      `"${soul.outreachSpot || ''}"`,
      `"${soul.residentialAddress || ''}"`,
      `"${soul.residentialDistrict || ''}"`,
      `"${soul.followUpStatus}"`,
      `"${soul.status}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Souls_Won_By_${winner.fullName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    onSuccessToast?.('Converts Exported', `Downloaded ${winner.souls.length} soul record(s) won by ${winner.fullName}.`);
  };

  // WhatsApp Link Builder
  const getWhatsAppLink = (phone: string, text?: string) => {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const encodedMsg = text ? encodeURIComponent(text) : '';
    return `https://wa.me/${cleanPhone}${encodedMsg ? `?text=${encodedMsg}` : ''}`;
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card (if not embedded or formatted nicely) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 rounded-2xl shadow-xs transition-colors">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span
                className="p-2 rounded-xl text-white shadow-xs"
                style={{ backgroundColor: palette.hex }}
              >
                <Users className="w-5 h-5" />
              </span>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
                  Soul Winners Roster & Attribution Ledger
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                  Complete directory of registered field soul winners, total souls won, and individual convert attribution.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <button
              onClick={handleExportRosterCSV}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors shadow-xs cursor-pointer"
            >
              <Download className="w-4 h-4 text-slate-500" />
              <span>Export Roster (CSV)</span>
            </button>

            <button
              onClick={() => setIsRegisterModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white shadow-xs hover:opacity-95 transition-opacity cursor-pointer"
              style={{ backgroundColor: palette.hex }}
            >
              <UserPlus className="w-4 h-4" />
              <span>Register Soul Winner</span>
            </button>
          </div>
        </div>

        {/* 4 Summary Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mt-5">
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Registered Winners</span>
              <Users className="w-4 h-4" style={{ color: palette.hex }} />
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">
              {stats.totalWinners}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1">
              <UserCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Active in Field Directory</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Attributed Harvest</span>
              <Flame className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">
              {stats.totalSouls.toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>{stats.totalNamedRecords} named convert records</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Avg Harvest / Winner</span>
              <Sparkles className="w-4 h-4 text-indigo-500" />
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">
              {stats.avgPerWinner}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Souls per registered laborer
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Top Laborer</span>
              <Trophy className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-1 truncate">
              {stats.topWinner ? stats.topWinner.fullName : 'None'}
            </div>
            <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">
              {stats.topWinner ? `${stats.topWinner.totalSoulsWon} souls won` : '0 souls'}
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 rounded-2xl shadow-xs transition-colors">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search Input */}
          <div className="lg:col-span-2 relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search soul winner name, phone, cell, PCF..."
              className="w-full pl-9.5 pr-4 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/30 transition-all placeholder:text-slate-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* PCF Filter */}
          <div>
            <select
              value={selectedPcf}
              onChange={e => setSelectedPcf(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium focus:outline-hidden cursor-pointer"
            >
              <option value="all">All PCFs / Groups ({pcfOptions.length})</option>
              {pcfOptions.map(pcf => (
                <option key={pcf} value={pcf}>{pcf}</option>
              ))}
            </select>
          </div>

          {/* Cell Filter */}
          <div>
            <select
              value={selectedCell}
              onChange={e => setSelectedCell(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium focus:outline-hidden cursor-pointer"
            >
              <option value="all">All Cells ({cellOptions.length})</option>
              {cellOptions.map(cell => (
                <option key={cell} value={cell}>{cell}</option>
              ))}
            </select>
          </div>

          {/* Sort By */}
          <div>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium focus:outline-hidden cursor-pointer"
            >
              <option value="souls_desc">Sort: Highest Souls Won</option>
              <option value="souls_asc">Sort: Lowest Souls Won</option>
              <option value="new_converts">Sort: Most New Converts</option>
              <option value="name_asc">Sort: Winner Name (A-Z)</option>
            </select>
          </div>
        </div>

        {/* Results summary pill */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/70 text-xs text-slate-500 dark:text-slate-400">
          <span>
            Showing <strong className="text-slate-800 dark:text-slate-200">{filteredWinners.length}</strong> registered soul winner(s)
          </span>
          {(searchQuery || selectedPcf !== 'all' || selectedCell !== 'all') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedPcf('all');
                setSelectedCell('all');
              }}
              className="text-xs font-semibold cursor-pointer hover:underline"
              style={{ color: palette.hex }}
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Soul Winners Roster Table & Cards */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden transition-colors">
        {filteredWinners.length === 0 ? (
          <div className="text-center py-16 px-4">
            <Users className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">No Soul Winners Found</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              No soul winners matched your active search or filter criteria. Try clearing the search query or registering a new winner.
            </p>
            <button
              onClick={() => setIsRegisterModalOpen(true)}
              className="mt-4 px-4 py-2 rounded-xl text-xs font-bold text-white shadow-xs cursor-pointer inline-flex items-center gap-1.5"
              style={{ backgroundColor: palette.hex }}
            >
              <UserPlus className="w-4 h-4" />
              <span>Register Soul Winner</span>
            </button>
          </div>
        ) : (
          <>
            {/* MOBILE CARDS VIEW (Visible only on mobile screens < 768px) */}
            <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
              {filteredWinners.map((winner, idx) => {
                const isActiveSelf =
                  activeProfile &&
                  (activeProfile.fullName.toLowerCase() === winner.fullName.toLowerCase() ||
                    activeProfile.phone === winner.phone);

                const initials = winner.fullName
                  .split(' ')
                  .filter(Boolean)
                  .slice(0, 2)
                  .map(n => n[0])
                  .join('')
                  .toUpperCase();

                return (
                  <div key={winner.id} className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-11 h-11 rounded-xl flex items-center justify-center font-black text-white text-xs shrink-0 shadow-xs"
                          style={{
                            backgroundColor:
                              idx === 0
                                ? '#f59e0b'
                                : idx === 1
                                ? '#0ea5e9'
                                : idx === 2
                                ? '#10b981'
                                : palette.hex,
                          }}
                        >
                          {initials || 'SW'}
                        </div>
                        <div>
                          <div className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-1.5 flex-wrap">
                            <span>{winner.fullName}</span>
                            {isActiveSelf && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-md font-bold bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300">
                                You
                              </span>
                            )}
                            {idx === 0 && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-md font-bold bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 flex items-center gap-0.5">
                                <Award className="w-3 h-3" /> #1 Top
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1">
                            <span>{winner.roleTitle || 'Soul Winner'}</span>
                            <span>·</span>
                            <span>{winner.churchName || 'Durumi Central'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Total Souls Pill */}
                      <div className="shrink-0 text-center px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700">
                        <div className="text-base font-black text-slate-900 dark:text-slate-100 leading-tight">
                          {winner.totalSoulsWon}
                        </div>
                        <div className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                          Souls
                        </div>
                      </div>
                    </div>

                    {/* Meta badges: Cell, PCF, WhatsApp */}
                    <div className="flex flex-wrap items-center gap-1.5 text-xs">
                      <span className="px-2 py-0.5 rounded-md font-semibold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-[11px]">
                        {winner.cellName}
                      </span>
                      <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        {winner.pcfName}
                      </span>
                      {winner.phone && (
                        <a
                          href={getWhatsAppLink(winner.phone)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-semibold text-[11px] bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60 ml-auto"
                        >
                          <MessageSquare className="w-3 h-3" />
                          <span>{winner.phone}</span>
                        </a>
                      )}
                    </div>

                    {/* Breakdown & verified */}
                    <div className="flex items-center justify-between gap-2 pt-0.5 text-xs">
                      <div className="flex flex-wrap gap-1">
                        <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60">
                          {winner.newConvertsCount} New
                        </span>
                        <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/60">
                          {winner.rededicationsCount} Reded.
                        </span>
                        {winner.returneesCount > 0 && (
                          <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60">
                            {winner.returneesCount} Ret.
                          </span>
                        )}
                      </div>

                      <div className="text-[10px] text-slate-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                        <span>{winner.verifiedCount} verified</span>
                      </div>
                    </div>

                    {/* Top Convert Living Neighborhoods */}
                    {winner.primaryResidentialDistricts.length > 0 && (
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                        <Home className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>Converts in: <strong>{winner.primaryResidentialDistricts.join(', ')}</strong></span>
                      </div>
                    )}

                    {/* View Won Souls Full Width Button */}
                    <button
                      onClick={() => setInspectingWinner(winner)}
                      className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold text-white shadow-xs cursor-pointer active:scale-98 transition-transform"
                      style={{ backgroundColor: palette.hex }}
                    >
                      <Eye className="w-4 h-4" />
                      <span>View Won Souls ({winner.souls.length} Named Records)</span>
                    </button>
                  </div>
                );
              })}
            </div>

            {/* DESKTOP & TABLET TABLE VIEW (Visible on screens >= 768px) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200/80 dark:border-slate-800 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    <th className="py-3 px-4">Soul Winner</th>
                    <th className="py-3 px-4">Cell & PCF Group</th>
                    <th className="py-3 px-4">Church Centre</th>
                    <th className="py-3 px-4 text-center">Total Souls</th>
                    <th className="py-3 px-4">Harvest Breakdown</th>
                    <th className="py-3 px-4">Top Converts Living Districts</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                  {filteredWinners.map((winner, idx) => {
                    const isActiveSelf =
                      activeProfile &&
                      (activeProfile.fullName.toLowerCase() === winner.fullName.toLowerCase() ||
                        activeProfile.phone === winner.phone);

                    const initials = winner.fullName
                      .split(' ')
                      .filter(Boolean)
                      .slice(0, 2)
                      .map(n => n[0])
                      .join('')
                      .toUpperCase();

                    return (
                      <tr
                        key={winner.id}
                        className={`hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors ${
                          isActiveSelf ? 'bg-indigo-50/30 dark:bg-indigo-950/20' : ''
                        }`}
                      >
                        {/* Soul Winner Name & Phone */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-white text-xs shrink-0 shadow-xs"
                              style={{
                                backgroundColor:
                                  idx === 0
                                    ? '#f59e0b'
                                    : idx === 1
                                    ? '#0ea5e9'
                                    : idx === 2
                                    ? '#10b981'
                                    : palette.hex,
                              }}
                            >
                              {initials || 'SW'}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5 flex-wrap">
                                <span>{winner.fullName}</span>
                                {isActiveSelf && (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded-md font-bold bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300">
                                    You (Active Profile)
                                  </span>
                                )}
                                {idx === 0 && (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded-md font-bold bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 flex items-center gap-0.5">
                                    <Award className="w-3 h-3" /> #1 Top Laborer
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                                <span>{winner.roleTitle || 'Soul Winner'}</span>
                                <span>·</span>
                                <a
                                  href={getWhatsAppLink(winner.phone)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 hover:underline font-semibold"
                                  title="Chat on WhatsApp"
                                >
                                  <MessageSquare className="w-3 h-3" />
                                  <span>{winner.phone}</span>
                                </a>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Cell & PCF */}
                        <td className="py-3.5 px-4">
                          <div className="flex flex-col gap-1">
                            <span className="font-semibold text-slate-800 dark:text-slate-200">
                              {winner.cellName}
                            </span>
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 w-fit">
                              {winner.pcfName}
                            </span>
                          </div>
                        </td>

                        {/* Church Centre */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 text-xs">
                            <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate max-w-[160px]">{winner.churchName || 'Durumi Central Hub'}</span>
                          </div>
                        </td>

                        {/* Total Souls Won (Big Badge) */}
                        <td className="py-3.5 px-4 text-center">
                          <div className="inline-flex flex-col items-center justify-center px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 min-w-[70px]">
                            <span className="text-base font-black text-slate-900 dark:text-slate-100">
                              {winner.totalSoulsWon}
                            </span>
                            <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-tighter">
                              Souls Won
                            </span>
                          </div>
                        </td>

                        {/* Breakdown Pills */}
                        <td className="py-3.5 px-4">
                          <div className="flex flex-wrap gap-1.5">
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60">
                              {winner.newConvertsCount} New
                            </span>
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/60">
                              {winner.rededicationsCount} Reded.
                            </span>
                            {winner.returneesCount > 0 && (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60">
                                {winner.returneesCount} Ret.
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                            <span>{winner.verifiedCount} verified</span>
                            {winner.pendingCount > 0 && (
                              <>
                                <span>·</span>
                                <Clock className="w-3 h-3 text-amber-500" />
                                <span>{winner.pendingCount} pending</span>
                              </>
                            )}
                          </div>
                        </td>

                        {/* Living Districts */}
                        <td className="py-3.5 px-4">
                          {winner.primaryResidentialDistricts.length > 0 ? (
                            <div className="flex items-center gap-1 flex-wrap text-[11px] text-slate-600 dark:text-slate-400">
                              <Home className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>{winner.primaryResidentialDistricts.join(', ')}</span>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-[11px] italic">Not yet recorded</span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setInspectingWinner(winner)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white shadow-xs hover:opacity-90 transition-opacity cursor-pointer whitespace-nowrap"
                              style={{ backgroundColor: palette.hex }}
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>View Won Souls ({winner.souls.length})</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* WON SOULS INSPECTOR MODAL */}
      {inspectingWinner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-slate-200/80 dark:border-slate-800 flex items-start justify-between gap-4 bg-slate-50/60 dark:bg-slate-800/40">
              <div className="flex items-start gap-3">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center font-black text-white text-base shadow-xs shrink-0"
                  style={{ backgroundColor: palette.hex }}
                >
                  {inspectingWinner.fullName
                    .split(' ')
                    .filter(Boolean)
                    .slice(0, 2)
                    .map(n => n[0])
                    .join('')
                    .toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-slate-100">
                      Souls Won by {inspectingWinner.fullName}
                    </h2>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                      {inspectingWinner.souls.length} Named Convert Records
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-2 flex-wrap">
                    <span>{inspectingWinner.cellName}</span>
                    <span>·</span>
                    <span>{inspectingWinner.pcfName}</span>
                    <span>·</span>
                    <span>{inspectingWinner.churchName || 'Durumi Central Hub'}</span>
                    <span>·</span>
                    <a
                      href={getWhatsAppLink(inspectingWinner.phone)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline inline-flex items-center gap-1"
                    >
                      <MessageSquare className="w-3 h-3" /> {inspectingWinner.phone}
                    </a>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {canSeeConvertContacts && (
                  <button
                    onClick={() => handleExportWinnerConvertsCSV(inspectingWinner)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors cursor-pointer"
                    title="Export this winner's converts to CSV"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-500" />
                    <span className="hidden sm:inline">Export CSV</span>
                  </button>
                )}
                <button
                  onClick={() => {
                    setInspectingWinner(null);
                    setConvertSearchQuery('');
                    setConvertDecisionFilter('all');
                  }}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Sub-Filters inside Inspector */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={convertSearchQuery}
                  onChange={e => setConvertSearchQuery(e.target.value)}
                  placeholder="Search converts by name, phone, address..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {/* Decision Type Buttons */}
              <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
                {[
                  { key: 'all', label: `All (${inspectingWinner.souls.length})` },
                  { key: 'new_convert', label: `New Converts (${inspectingWinner.newConvertsCount})` },
                  { key: 'rededication', label: `Rededications (${inspectingWinner.rededicationsCount})` },
                  { key: 'returnee', label: `Returnees (${inspectingWinner.returneesCount})` },
                ].map(tab => {
                  const isActive = convertDecisionFilter === tab.key;
                  return (
                    <button
                      key={tab.key}
                      onClick={() => setConvertDecisionFilter(tab.key as any)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                        isActive
                          ? 'text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                      style={{ backgroundColor: isActive ? palette.hex : undefined }}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Converts List Table */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              {inspectedConverts.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    No individual souls found matching the filter.
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Try clearing your search or switching decision type filters.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {inspectedConverts.map((soul, idx) => (
                    <div
                      key={soul.id}
                      className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-800/80 hover:border-indigo-300 dark:hover:border-indigo-600 transition-all shadow-xs"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        {/* Convert Name and Info */}
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-bold text-xs shrink-0">
                            {idx + 1}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                                {soul.firstName} {soul.lastName}
                              </h4>
                              {/* Decision Badge */}
                              <span
                                className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase ${
                                  soul.decisionType === 'new_convert'
                                    ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                                    : soul.decisionType === 'rededication'
                                    ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                                    : 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300'
                                }`}
                              >
                                {soul.decisionType.replace('_', ' ')}
                              </span>
                              {/* Follow Up Status */}
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                {soul.followUpStatus.replace('_', ' ')}
                              </span>
                            </div>

                            {/* Outreach Spot and Residential Address */}
                            <div className="mt-1 space-y-0.5 text-xs text-slate-500 dark:text-slate-400">
                              {soul.outreachSpot && (
                                <div className="flex items-center gap-1.5">
                                  <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0" />
                                  <span>Won at: <strong className="text-slate-700 dark:text-slate-300">{soul.outreachSpot}</strong></span>
                                </div>
                              )}
                              {(soul.residentialAddress || soul.residentialDistrict) && (
                                <div className="flex items-center gap-1.5">
                                  <Home className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                                  <span>
                                    Lives at:{' '}
                                    <strong className="text-slate-700 dark:text-slate-300">
                                      {soul.residentialAddress ? `${soul.residentialAddress}, ` : ''}
                                      {soul.residentialDistrict || ''}
                                    </strong>
                                  </span>
                                </div>
                              )}
                              <div className="flex items-center gap-1 text-[11px] text-slate-400">
                                <Calendar className="w-3 h-3" />
                                <span>{new Date(soul.wonAt).toLocaleString()}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Convert Actions & WhatsApp Direct Connect */}
                        <div className="flex items-center gap-2 sm:self-center shrink-0">
                          {canSeeConvertContacts ? (
                            <>
                              <a
                                href={getWhatsAppLink(
                                  soul.phone,
                                  `Hello ${soul.firstName}, praise God! We are following up from Christ Embassy Abuja Harvest 10K. We are rejoicing with you on your salvation decision!`
                                )}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-white shadow-xs transition-colors"
                                title="Chat on WhatsApp"
                              >
                                <MessageSquare className="w-3.5 h-3.5" />
                                <span>WhatsApp ({soul.phone})</span>
                              </a>

                              <a
                                href={`tel:${soul.phone}`}
                                className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                title="Call Phone"
                              >
                                <Phone className="w-4 h-4" />
                              </a>
                            </>
                          ) : (
                            <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs font-mono font-medium">
                              {maskPhone(soul.phone)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex items-center justify-between text-xs text-slate-700 dark:text-slate-300">
              <span>
                Displaying <strong className="text-slate-900 dark:text-white">{inspectedConverts.length}</strong> of {inspectingWinner.souls.length} souls won by {inspectingWinner.fullName}
              </span>
              <button
                onClick={() => {
                  setInspectingWinner(null);
                  setConvertSearchQuery('');
                  setConvertDecisionFilter('all');
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Soul Winner Registration Modal */}
      <SoulWinnerRegistrationModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        onSaved={newProfile => {
          dataService.registerSoulWinner(newProfile);
          setIsRegisterModalOpen(false);
          onSuccessToast?.('Soul Winner Registered', `Successfully registered ${newProfile.fullName} in the field directory.`);
        }}
      />
    </div>
  );
};

export default SoulWinnersScreen;
