import React, { useState, useMemo } from 'react';
import { dataService } from '../services/dataService';
import { SoulRecord, DecisionType, UserRole } from '../types';
import { Modal } from '../components/Modal';
import { useTheme } from '../context/ThemeContext';
import { generateSoulRegistryPDF } from '../utils/pdfExport';
import {
  Database,
  Search,
  Download,
  FileText,
  ChevronLeft,
  ChevronRight,
  Eye,
  Loader2,
  Trash2,
  AlertTriangle,
  Info,
  Upload,
  MapPin,
  X,
  MessageCircle,
  Home,
  Bus,
} from 'lucide-react';
import { getWhatsAppLink } from '../utils/whatsappUtils';

interface RecordsScreenProps {
  userRole?: UserRole;
  onSuccessToast?: (title: string, message: string) => void;
  theme?: 'dark' | 'light';
}

function fuzzyMatch(query: string, text: string): boolean {
  if (!query) return true;
  const q = query.toLowerCase().trim();
  const t = text.toLowerCase();
  if (t.includes(q)) return true;
  const qTokens = q.split(/\s+/);
  return qTokens.every(token => {
    let tIdx = 0;
    for (let i = 0; i < token.length; i++) {
      const char = token[i];
      tIdx = t.indexOf(char, tIdx);
      if (tIdx === -1) return false;
      tIdx++;
    }
    return true;
  });
}

export const RecordsScreen: React.FC<RecordsScreenProps> = ({
  userRole = 'coordinator',
  onSuccessToast,
}) => {
  const { palette } = useTheme();
  const [search, setSearch] = useState('');
  const [areaCouncilFilter, setAreaCouncilFilter] = useState('all');
  const [centreFilter, setCentreFilter] = useState('all');
  const [decisionFilter, setDecisionFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const [selectedGenders, setSelectedGenders] = useState<string[]>([]);
  const [selectedAgeBrackets, setSelectedAgeBrackets] = useState<string[]>([]);
  const [selectedDecisionTypes, setSelectedDecisionTypes] = useState<string[]>([]);
  const [selectedFollowUpStatuses, setSelectedFollowUpStatuses] = useState<string[]>([]);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const [page, setPage] = useState(1);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const pageSize = 15;

  const [selectedRecord, setSelectedRecord] = useState<SoulRecord | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<SoulRecord | null>(null);
  const [deleteReason, setDeleteReason] = useState('Duplicate field submission or phone correction');

  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importCentreId, setImportCentreId] = useState('');
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [isProcessingImport, setIsProcessingImport] = useState(false);

  const centres = dataService.getCentres();
  const areaCouncils = dataService.getAreaCouncils();
  const campaign = dataService.getCampaign();
  const activeProfile = dataService.getSoulWinnerProfile();
  const [fieldWorkerScope, setFieldWorkerScope] = useState<'my_souls' | 'all'>(() => {
    return userRole === 'field_worker' ? 'my_souls' : 'all';
  });

  const maskPhone = (phoneNum?: string) => {
    if (!phoneNum) return 'N/A';
    if (userRole === 'public') {
      const clean = phoneNum.trim();
      if (clean.length > 7) {
        return clean.slice(0, clean.length - 6) + '••••' + clean.slice(-2);
      }
      return '••••••••';
    }
    return phoneNum;
  };

  const isAuthorizedToDelete = userRole === 'coordinator' || userRole === 'admin';

  const centreMap = useMemo(() => new Map(centres.map(c => [c.id, c])), [centres]);
  const areaCouncilMap = useMemo(() => new Map(areaCouncils.map(a => [a.id, a])), [areaCouncils]);

  const filteredCentres = useMemo(() => {
    if (areaCouncilFilter === 'all') return centres;
    return centres.filter(c => c.areaCouncilId === areaCouncilFilter || c.regionId === areaCouncilFilter);
  }, [centres, areaCouncilFilter]);

  // Initialize import centre default if empty
  React.useEffect(() => {
    if (centres.length > 0 && !importCentreId) {
      setImportCentreId(centres[0].id);
    }
  }, [centres, importCentreId]);

  const handleDownloadTemplate = () => {
    const csvContent = [
      'First Name,Last Name,Phone,Gender,Age Bracket,Community,Decision Type,Soul Winner,Notes',
      'John,Doe,08031234567,male,adult,Garki I,born_again,Pastor Emmanuel,First time visitor',
      'Mary,Smith,08098765432,female,youth,Wuse II,recommitment,Rev. Chinedu,Re-dedicated life',
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'soul_records_import_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    if (onSuccessToast) {
      onSuccessToast('Template Downloaded', 'soul_records_import_template.csv downloaded successfully.');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      const text = event.target?.result as string;
      if (!text) return;

      const lines = text.split(/\r\n|\n/).filter(l => l.trim().length > 0);
      if (lines.length < 2) {
        if (onSuccessToast) onSuccessToast('Import Error', 'CSV file is empty or missing header row.');
        return;
      }

      const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/['"]+/g, ''));
      
      const rows = [];
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        const rowVals: string[] = [];
        let inQuotes = false;
        let currentVal = '';
        for (let c = 0; c < line.length; c++) {
          const char = line[c];
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            rowVals.push(currentVal.trim().replace(/^"(.*)"$/, '$1'));
            currentVal = '';
          } else {
            currentVal += char;
          }
        }
        rowVals.push(currentVal.trim().replace(/^"(.*)"$/, '$1'));

        const getCol = (names: string[], defaultVal = '') => {
          for (const name of names) {
            const idx = headers.findIndex(h => h.includes(name));
            if (idx !== -1 && rowVals[idx] !== undefined) {
              return rowVals[idx];
            }
          }
          return defaultVal;
        };

        const firstName = getCol(['first', 'firstname'], rowVals[0] || '');
        const lastName = getCol(['last', 'lastname'], rowVals[1] || '');
        const phone = getCol(['phone', 'contact', 'tel'], rowVals[2] || '');
        const genderRaw = getCol(['gender', 'sex'], rowVals[3] || 'male').toLowerCase();
        const gender = genderRaw.startsWith('f') ? 'female' : 'male';
        const ageRaw = getCol(['age', 'bracket', 'group'], rowVals[4] || 'adult').toLowerCase();
        const ageBracket = ['teen', 'youth', 'adult', 'elder'].includes(ageRaw) ? ageRaw : 'adult';
        const community = getCol(['community', 'locality', 'location', 'landmark'], rowVals[5] || 'Abuja Central');
        const decisionRaw = getCol(['decision', 'type'], rowVals[6] || 'born_again').toLowerCase();
        const decisionType = (
          ['born_again', 'recommitment', 'healing_miracle', 'water_baptism', 'holy_ghost_baptism', 'decision_of_christ'].includes(decisionRaw)
            ? decisionRaw
            : 'born_again'
        ) as DecisionType;
        const wonByName = getCol(['winner', 'soul winner', 'coordinator'], rowVals[7] || 'Field Evangelist');
        const notes = getCol(['note', 'comment', 'remarks'], rowVals[8] || '');

        const isValid = firstName.length > 0 && lastName.length > 0;
        rows.push({
          firstName,
          lastName,
          phone,
          gender,
          ageBracket,
          community,
          decisionType,
          wonByName,
          notes,
          isValid,
        });
      }

      setParsedRows(rows);
    };
    reader.readAsText(file);
  };

  const handleExecuteImport = () => {
    const validRows = parsedRows.filter(r => r.isValid);
    if (validRows.length === 0) {
      if (onSuccessToast) onSuccessToast('Import Warning', 'No valid records found to import.');
      return;
    }

    setIsProcessingImport(true);
    try {
      let importedCount = 0;
      for (const row of validRows) {
        dataService.addSoulRecord(
          {
            centreId: importCentreId || centres[0]?.id || 'centre-1',
            firstName: row.firstName,
            lastName: row.lastName,
            phone: row.phone,
            gender: row.gender,
            ageBracket: row.ageBracket,
            community: row.community,
            locality: row.community,
            decisionType: row.decisionType,
            wonByName: row.wonByName,
            notes: row.notes,
            followUpStatus: 'not_started',
            followUpChurch: 'FCT Satellite Church',
            consentGiven: true,
          },
          'Collation Coordinator',
          (userRole || 'coordinator') as UserRole
        );
        importedCount++;
      }

      if (onSuccessToast) {
        onSuccessToast('Bulk Import Successful', `Successfully imported ${importedCount} soul records into the registry.`);
      }
      setImportModalOpen(false);
      setParsedRows([]);
    } catch (err) {
      console.error('Import error:', err);
    } finally {
      setIsProcessingImport(false);
    }
  };

  const allRawRecords = useMemo(() => dataService.getSoulRecords(), []);
  const mySoulsCount = useMemo(() => {
    if (!activeProfile?.fullName && !activeProfile?.phone) return 0;
    return allRawRecords.filter(r => {
      const matchName = Boolean(activeProfile.fullName && r.wonByName && r.wonByName.trim().toLowerCase() === activeProfile.fullName.trim().toLowerCase());
      const matchPhone = Boolean(activeProfile.phone && r.winnerPhone && r.winnerPhone === activeProfile.phone);
      return matchName || matchPhone;
    }).length;
  }, [allRawRecords, activeProfile]);

  const rawRecords = dataService.getSoulRecords({
    centreId: centreFilter !== 'all' ? centreFilter : undefined,
    decisionType: decisionFilter !== 'all' ? (decisionFilter as DecisionType) : undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined,
  });

  const records = rawRecords.filter(r => {
    if (userRole === 'field_worker' && fieldWorkerScope === 'my_souls') {
      const matchName = Boolean(activeProfile?.fullName && r.wonByName && r.wonByName.trim().toLowerCase() === activeProfile.fullName.trim().toLowerCase());
      const matchPhone = Boolean(activeProfile?.phone && r.winnerPhone && r.winnerPhone === activeProfile.phone);
      if (!matchName && !matchPhone) return false;
    }
    if (areaCouncilFilter !== 'all') {
      const c = centreMap.get(r.centreId);
      if (!c || (c.areaCouncilId !== areaCouncilFilter && c.regionId !== areaCouncilFilter)) {
        return false;
      }
    }
    if (search.trim()) {
      const c = centreMap.get(r.centreId);
      const council = c ? (areaCouncilMap.get(c.areaCouncilId) || areaCouncilMap.get(c.regionId || '')) : undefined;
      const fullText = `${r.firstName} ${r.lastName} ${r.phone || ''} ${r.outreachSpot || ''} ${r.residentialAddress || ''} ${r.residentialDistrict || ''} ${r.residentialAreaCouncil || ''} ${r.locality || ''} ${r.community || ''} ${r.ward || ''} ${r.wonByName || ''} ${r.winnerCell || ''} ${r.winnerPcf || ''} ${r.notes || ''} ${r.followUpChurch || ''} ${c?.name || ''} ${council?.name || ''}`;
      if (!fuzzyMatch(search, fullText)) return false;
    }
    if (selectedGenders.length > 0 && !selectedGenders.includes(r.gender)) return false;
    if (selectedAgeBrackets.length > 0 && !selectedAgeBrackets.includes(r.ageBracket)) return false;
    if (selectedDecisionTypes.length > 0 && !selectedDecisionTypes.includes(r.decisionType)) return false;
    if (selectedFollowUpStatuses.length > 0 && !selectedFollowUpStatuses.includes(r.followUpStatus)) return false;
    return true;
  });

  const totalPages = Math.ceil(records.length / pageSize) || 1;
  const paginatedRecords = records.slice((page - 1) * pageSize, page * pageSize);

  const handleDownloadPDF = () => {
    try {
      setIsGeneratingPDF(true);
      generateSoulRegistryPDF({
        records,
        centres,
        campaign,
        filters: {
          search: search.trim() || undefined,
          centreFilter,
          decisionFilter,
          statusFilter,
        },
        themeColorHex: palette.hex,
      });

      if (onSuccessToast) {
        onSuccessToast('PDF Summary Generated', `Downloaded printable summary report for ${records.length} records.`);
      }
    } catch (err) {
      console.error('Failed to generate PDF:', err);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handlePromptDelete = (r: SoulRecord) => {
    setRecordToDelete(r);
    setDeleteReason('Duplicate entry or unconfirmed telephone number');
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!recordToDelete) return;
    const success = dataService.softDeleteSoulRecord(
      recordToDelete.id,
      'Collation Desk',
      (userRole || 'coordinator') as UserRole,
      deleteReason
    );
    if (success) {
      if (onSuccessToast) {
        onSuccessToast(
          'Record Soft Deleted',
          `${recordToDelete.firstName} ${recordToDelete.lastName} archived and retained in audit log.`
        );
      }
      if (selectedRecord?.id === recordToDelete.id) {
        setSelectedRecord(null);
      }
    }
    setDeleteModalOpen(false);
    setRecordToDelete(null);
  };

  const handleExportCSV = () => {
    const headers = [
      'ID',
      'First Name',
      'Last Name',
      'Phone',
      'Gender',
      'Age Bracket',
      'Outreach Spot (Where Won)',
      'Living Address (Where Lives)',
      'Residential District',
      'Residential Area Council',
      'Community',
      'Decision Type',
      'Soul Winner',
      'Winner Cell',
      'Winner PCF',
      'Centre Code',
      'Date Won',
      'Status',
      'Follow-Up Status',
      'Follow-Up Church',
      'Notes',
    ];

    const rows = records.map(r => [
      r.id,
      `"${r.firstName}"`,
      `"${r.lastName}"`,
      `"${r.phone}"`,
      r.gender,
      r.ageBracket,
      `"${r.outreachSpot || ''}"`,
      `"${(r.residentialAddress || '').replace(/"/g, '""')}"`,
      `"${r.residentialDistrict || ''}"`,
      `"${r.residentialAreaCouncil || 'FCT'}"`,
      `"${r.community}"`,
      r.decisionType,
      `"${r.wonByName}"`,
      `"${r.winnerCell || ''}"`,
      `"${r.winnerPcf || ''}"`,
      r.centreId,
      r.wonAt,
      r.status,
      r.followUpStatus,
      `"${r.followUpChurch}"`,
      `"${(r.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `harvest_10k_records_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    if (onSuccessToast) {
      onSuccessToast('Export Complete', `Exported ${records.length} records to CSV.`);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header with Title and PDF / CSV export actions */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 rounded-2xl shadow-xs transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Database className="w-5 h-5" style={{ color: palette.hex }} />
            {userRole === 'field_worker' && fieldWorkerScope === 'my_souls'
              ? 'My Won Souls Registry'
              : 'Abuja FCT Soul Registry'}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {userRole === 'field_worker' && fieldWorkerScope === 'my_souls'
              ? 'Personal log of souls won and led to Christ by your outreach'
              : 'Verified registry of individuals won across all 14 Abuja centres'}{' '}
            ({records.length} records shown).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
          {/* Printable PDF Report Button */}
          <button
            id="download-pdf-report-btn"
            onClick={handleDownloadPDF}
            disabled={isGeneratingPDF || records.length === 0}
            className={`px-4 py-2 rounded-xl text-white font-bold text-xs flex items-center gap-2 shadow-xs transition-transform active:scale-98 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${palette.btnPrimary}`}
            title="Download printable PDF summary report with executive metrics and filtered records"
          >
            {isGeneratingPDF ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <FileText className="w-4 h-4" />
            )}
            <span>{isGeneratingPDF ? 'Generating PDF...' : 'Printable PDF Report'}</span>
          </button>

          {/* Export CSV Button */}
          <button
            id="export-csv-btn"
            onClick={handleExportCSV}
            disabled={records.length === 0}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5 shadow-xs transition-transform active:scale-98 cursor-pointer disabled:opacity-50"
            title="Export raw data to CSV file"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>

          {/* Import CSV Button - Coordinators and Admins Only */}
          {(userRole === 'coordinator' || userRole === 'admin') && (
            <button
              id="open-import-modal-btn"
              onClick={() => setImportModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-bold text-xs flex items-center gap-1.5 shadow-xs transition-transform active:scale-98 cursor-pointer"
              title="Bulk import soul records from CSV file with validation"
            >
              <Upload className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Import CSV</span>
            </button>
          )}
        </div>
      </div>

      {/* Field Worker Personal vs All Toggle */}
      {userRole === 'field_worker' && (
        <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center font-black text-base shrink-0">
              ★
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                Evangelist Roster Profile: <span className="text-amber-600 dark:text-amber-400">{activeProfile?.fullName || 'Active Field Worker'}</span>
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                You have personally won <strong className="text-slate-900 dark:text-slate-100 font-bold">{mySoulsCount}</strong> souls in this campaign.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold self-stretch sm:self-auto justify-center">
            <button
              onClick={() => {
                setFieldWorkerScope('my_souls');
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                fieldWorkerScope === 'my_souls'
                  ? 'bg-amber-500 text-white font-bold shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              ⭐ My Won Souls ({mySoulsCount})
            </button>
            <button
              onClick={() => {
                setFieldWorkerScope('all');
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                fieldWorkerScope === 'all'
                  ? 'bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900 font-bold shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              🌐 All Abuja Records ({allRawRecords.length})
            </button>
          </div>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 rounded-2xl shadow-xs transition-colors grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            id="records-search-bar"
            type="text"
            placeholder="Search name, phone, winner, locality..."
            value={search}
            onChange={e => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl pl-9 pr-8 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-slate-400 dark:focus:ring-slate-600"
          />
          {search && (
            <button
              onClick={() => {
                setSearch('');
                setPage(1);
              }}
              className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Area Council Dropdown */}
        <select
          id="records-area-council-filter"
          value={areaCouncilFilter}
          onChange={e => {
            setAreaCouncilFilter(e.target.value);
            setCentreFilter('all');
            setPage(1);
          }}
          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl px-3 py-1.5 text-xs focus:outline-none cursor-pointer font-medium"
        >
          <option value="all">All 6 Area Councils</option>
          {areaCouncils.map(ac => (
            <option key={ac.id} value={ac.id}>
              {ac.name} ({ac.code})
            </option>
          ))}
        </select>

        {/* Centre select */}
        <select
          id="records-centre-filter"
          value={centreFilter}
          onChange={e => {
            setCentreFilter(e.target.value);
            setPage(1);
          }}
          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl px-3 py-1.5 text-xs focus:outline-none cursor-pointer"
        >
          <option value="all">
            {areaCouncilFilter === 'all' ? 'All Collation Centres' : 'All Centres in Council'}
          </option>
          {filteredCentres.map(c => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        {/* Decision type */}
        <select
          id="records-decision-filter"
          value={decisionFilter}
          onChange={e => {
            setDecisionFilter(e.target.value);
            setPage(1);
          }}
          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl px-3 py-1.5 text-xs focus:outline-none cursor-pointer"
        >
          <option value="all">All Decision Types</option>
          <option value="new_convert">New Convert</option>
          <option value="rededication">Rededication</option>
          <option value="returnee">Returnee</option>
        </select>

        {/* Status */}
        <select
          id="records-status-filter"
          value={statusFilter}
          onChange={e => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl px-3 py-1.5 text-xs focus:outline-none cursor-pointer"
        >
          <option value="all">All Verification Status</option>
          <option value="verified">Verified Only</option>
          <option value="pending">Pending Only</option>
          <option value="rejected">Rejected Only</option>
        </select>
      </div>

      {/* Advanced Multi-Select Filter Panel Toggle & Drawer */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 rounded-2xl shadow-xs transition-colors space-y-3">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2 cursor-pointer hover:underline"
          >
            <span>Advanced Demographic & Segment Multi-Select Filters</span>
            {(selectedGenders.length > 0 || selectedAgeBrackets.length > 0 || selectedDecisionTypes.length > 0 || selectedFollowUpStatuses.length > 0) && (
              <span className="px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 font-black text-[10px]">
                {selectedGenders.length + selectedAgeBrackets.length + selectedDecisionTypes.length + selectedFollowUpStatuses.length} Active
              </span>
            )}
          </button>

          {(selectedGenders.length > 0 || selectedAgeBrackets.length > 0 || selectedDecisionTypes.length > 0 || selectedFollowUpStatuses.length > 0) && (
            <button
              onClick={() => {
                setSelectedGenders([]);
                setSelectedAgeBrackets([]);
                setSelectedDecisionTypes([]);
                setSelectedFollowUpStatuses([]);
                setPage(1);
              }}
              className="text-[11px] font-bold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
            >
              Clear All Filters
            </button>
          )}
        </div>

        {showAdvancedFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs animate-in fade-in duration-200">
            {/* Gender Multi-Select */}
            <div className="space-y-1.5">
              <span className="font-bold text-slate-700 dark:text-slate-300">Gender</span>
              <div className="flex flex-wrap gap-1.5">
                {['male', 'female'].map(g => {
                  const active = selectedGenders.includes(g);
                  return (
                    <button
                      key={g}
                      onClick={() => {
                        setSelectedGenders(active ? selectedGenders.filter(x => x !== g) : [...selectedGenders, g]);
                        setPage(1);
                      }}
                      className={`px-2.5 py-1 rounded-lg font-semibold capitalize text-[11px] border transition-colors cursor-pointer ${
                        active
                          ? 'bg-amber-500 text-slate-950 border-amber-600 font-bold'
                          : 'bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      {g}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Age Bracket Multi-Select */}
            <div className="space-y-1.5">
              <span className="font-bold text-slate-700 dark:text-slate-300">Age Bracket</span>
              <div className="flex flex-wrap gap-1.5">
                {['teen', 'youth', 'adult', 'elder'].map(ab => {
                  const active = selectedAgeBrackets.includes(ab);
                  return (
                    <button
                      key={ab}
                      onClick={() => {
                        setSelectedAgeBrackets(active ? selectedAgeBrackets.filter(x => x !== ab) : [...selectedAgeBrackets, ab]);
                        setPage(1);
                      }}
                      className={`px-2.5 py-1 rounded-lg font-semibold capitalize text-[11px] border transition-colors cursor-pointer ${
                        active
                          ? 'bg-amber-500 text-slate-950 border-amber-600 font-bold'
                          : 'bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      {ab}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Decision Type Multi-Select */}
            <div className="space-y-1.5">
              <span className="font-bold text-slate-700 dark:text-slate-300">Decision Category</span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { id: 'born_again', label: 'Born Again' },
                  { id: 'recommitment', label: 'Recommitment' },
                  { id: 'healing_miracle', label: 'Healing' },
                  { id: 'water_baptism', label: 'Baptism' },
                ].map(dt => {
                  const active = selectedDecisionTypes.includes(dt.id);
                  return (
                    <button
                      key={dt.id}
                      onClick={() => {
                        setSelectedDecisionTypes(active ? selectedDecisionTypes.filter(x => x !== dt.id) : [...selectedDecisionTypes, dt.id]);
                        setPage(1);
                      }}
                      className={`px-2.5 py-1 rounded-lg font-semibold text-[11px] border transition-colors cursor-pointer ${
                        active
                          ? 'bg-amber-500 text-slate-950 border-amber-600 font-bold'
                          : 'bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      {dt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Follow-up Status Multi-Select */}
            <div className="space-y-1.5">
              <span className="font-bold text-slate-700 dark:text-slate-300">Follow-Up Status</span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { id: 'not_started', label: 'Not Started' },
                  { id: 'contacted', label: 'Contacted' },
                  { id: 'assigned', label: 'Assigned' },
                  { id: 'discipled', label: 'Discipled' },
                  { id: 'graduated', label: 'Graduated' },
                ].map(fs => {
                  const active = selectedFollowUpStatuses.includes(fs.id);
                  return (
                    <button
                      key={fs.id}
                      onClick={() => {
                        setSelectedFollowUpStatuses(active ? selectedFollowUpStatuses.filter(x => x !== fs.id) : [...selectedFollowUpStatuses, fs.id]);
                        setPage(1);
                      }}
                      className={`px-2.5 py-1 rounded-lg font-semibold text-[11px] border transition-colors cursor-pointer ${
                        active
                          ? 'bg-amber-500 text-slate-950 border-amber-600 font-bold'
                          : 'bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      {fs.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Table Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden transition-colors">
        {/* Desktop & Tablet: Data Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200/80 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold">
              <tr>
                <th className="py-3 px-4">Convert Name</th>
                <th className="py-3 px-4">Contact</th>
                <th className="py-3 px-4">Decision</th>
                <th className="py-3 px-4">Centre / Location</th>
                <th className="py-3 px-4">Soul Winner</th>
                <th className="py-3 px-4">Follow-Up</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
              {paginatedRecords.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No soul records matching the current filters.
                  </td>
                </tr>
              ) : (
                paginatedRecords.map(r => {
                  const centre = centres.find(c => c.id === r.centreId);

                  return (
                    <tr
                      key={r.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* Name & demographics */}
                      <td className="py-3 px-4 font-medium">
                        <div className="font-bold text-slate-900 dark:text-slate-100">
                          {r.firstName} {r.lastName}
                        </div>
                        <div className="text-[10px] text-slate-400 capitalize">
                          {r.gender}, {r.ageBracket}
                        </div>
                      </td>

                      {/* Phone */}
                      <td className="py-3 px-4 font-mono-tabular">
                        <div className="flex items-center gap-2">
                          <span>{maskPhone(r.phone)}</span>
                          {userRole !== 'public' && r.phone && getWhatsAppLink({
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
                              className="p-1 rounded-md bg-emerald-500/10 hover:bg-emerald-500/25 text-emerald-600 dark:text-emerald-400 transition-colors"
                              title="Message soul on WhatsApp"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      </td>

                      {/* Decision Type */}
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                            r.decisionType === 'new_convert'
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : r.decisionType === 'rededication'
                              ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                              : 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300'
                          }`}
                        >
                          {r.decisionType.replace('_', ' ')}
                        </span>
                      </td>

                      {/* Centre & Location */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800 dark:text-slate-200">
                          {centre?.name}
                        </div>
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

                      {/* Winner */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800 dark:text-slate-200">{r.wonByName}</div>
                        {(r.winnerCell || r.winnerPcf) && (
                          <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                            {r.winnerCell && (
                              <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                                🔵 {r.winnerCell}
                              </span>
                            )}
                            {r.winnerPcf && (
                              <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
                                🟣 {r.winnerPcf}
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Follow-up badge */}
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 capitalize">
                          {r.followUpStatus.replace('_', ' ')}
                        </span>
                      </td>

                      {/* View Action */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            id={`view-record-${r.id}`}
                            onClick={() => setSelectedRecord(r)}
                            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                            title="View Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {isAuthorizedToDelete && (
                            <button
                              id={`delete-record-${r.id}`}
                              onClick={() => handlePromptDelete(r)}
                              className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                              title="Soft delete convert record"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile View: Vertical Card Feed */}
        <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800/80">
          {paginatedRecords.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              No soul records matching the current filters.
            </div>
          ) : (
            paginatedRecords.map(r => {
              const centre = centres.find(c => c.id === r.centreId);
              const waLink = r.phone
                ? getWhatsAppLink({
                    phone: r.phone,
                    firstName: r.firstName,
                    lastName: r.lastName,
                    decisionType: r.decisionType,
                    centreName: centre?.name,
                    soulWinnerName: r.wonByName,
                  })
                : null;

              return (
                <div key={r.id} className="p-4 space-y-2.5">
                  {/* Top: Name & Decision Pill */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-bold text-sm text-slate-900 dark:text-slate-100">
                        {r.firstName} {r.lastName}
                      </div>
                      <div className="text-[11px] text-slate-400 capitalize">
                        {r.gender}, {r.ageBracket} · {centre?.name}
                      </div>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold capitalize shrink-0 ${
                        r.decisionType === 'new_convert'
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                          : r.decisionType === 'rededication'
                          ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                          : 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300'
                      }`}
                    >
                      {r.decisionType.replace('_', ' ')}
                    </span>
                  </div>

                  {/* Location Badges */}
                  <div className="space-y-1 text-xs">
                    {r.outreachSpot && (
                      <div className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1.5">
                        <MapPin className="w-3 h-3 shrink-0" />
                        <span>Won: {r.outreachSpot}</span>
                      </div>
                    )}
                    <div className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold flex items-center gap-1.5">
                      <Home className="w-3 h-3 shrink-0" />
                      <span>Lives: {r.residentialDistrict || r.residentialAddress || r.community || 'Abuja'}</span>
                    </div>
                  </div>

                  {/* Soul Winner & Follow-up Row */}
                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800/60">
                    <div className="truncate max-w-[180px]">
                      By: <span className="font-semibold text-slate-700 dark:text-slate-300">{r.wonByName}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 capitalize">
                      {r.followUpStatus.replace('_', ' ')}
                    </span>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 pt-1">
                    {userRole !== 'public' && waLink && (
                      <a
                        href={waLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 py-1.5 px-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>WhatsApp</span>
                      </a>
                    )}
                    <button
                      onClick={() => setSelectedRecord(r)}
                      className="flex-1 py-1.5 px-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Inspect</span>
                    </button>
                    {isAuthorizedToDelete && (
                      <button
                        onClick={() => handlePromptDelete(r)}
                        className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                        title="Delete Record"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Pagination Bar */}
        <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-950/40 flex items-center justify-between text-xs text-slate-500">
          <div>
            Showing {(page - 1) * pageSize + 1} to{' '}
            {Math.min(page * pageSize, records.length)} of {records.length} records
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 disabled:opacity-40 cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="px-2 font-mono-tabular">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 disabled:opacity-40 cursor-pointer"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* RECORD DETAILS MODAL */}
      <Modal
        isOpen={!!selectedRecord}
        onClose={() => setSelectedRecord(null)}
        title="Soul Record Profile"
      >
        {selectedRecord && (
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 space-y-1">
              <div className="text-base font-bold text-slate-900 dark:text-slate-100">
                {selectedRecord.firstName} {selectedRecord.lastName}
              </div>
              <div className="text-slate-500 capitalize">
                {selectedRecord.gender} · {selectedRecord.ageBracket} · {selectedRecord.decisionType.replace('_', ' ')}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Contact Phone</span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="font-mono-tabular font-bold text-slate-900 dark:text-slate-100">
                    {maskPhone(selectedRecord.phone)}
                  </span>
                  {userRole !== 'public' && selectedRecord.phone && getWhatsAppLink({
                    phone: selectedRecord.phone,
                    firstName: selectedRecord.firstName,
                    lastName: selectedRecord.lastName,
                    decisionType: selectedRecord.decisionType,
                    centreName: centres.find(c => c.id === selectedRecord.centreId)?.name,
                    soulWinnerName: selectedRecord.wonByName,
                  }) && (
                    <a
                      href={getWhatsAppLink({
                        phone: selectedRecord.phone,
                        firstName: selectedRecord.firstName,
                        lastName: selectedRecord.lastName,
                        decisionType: selectedRecord.decisionType,
                        centreName: centres.find(c => c.id === selectedRecord.centreId)?.name,
                        soulWinnerName: selectedRecord.wonByName,
                      })!}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold border border-emerald-500/20 transition-colors cursor-pointer"
                    >
                      <MessageCircle className="w-3 h-3" />
                      <span>WhatsApp</span>
                    </a>
                  )}
                </div>
              </div>

              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Collation Centre</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  {centres.find(c => c.id === selectedRecord.centreId)?.name}
                </span>
              </div>

              {/* Outreach Spot (Where Won) */}
              <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <span className="text-amber-600 dark:text-amber-400 block text-[10px] uppercase font-bold flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> Outreach Spot (Where Won)
                </span>
                <span className="font-semibold text-slate-900 dark:text-slate-100 mt-0.5 block">
                  {selectedRecord.outreachSpot || selectedRecord.areaCouncil || selectedRecord.community || 'Field Outreach'}
                </span>
              </div>

              {/* Living Address (Where Lives) */}
              <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                <span className="text-indigo-600 dark:text-indigo-400 block text-[10px] uppercase font-bold flex items-center gap-1">
                  <Home className="w-3 h-3" /> Living Address (Where Lives)
                </span>
                <span className="font-semibold text-slate-900 dark:text-slate-100 mt-0.5 block">
                  {userRole === 'public'
                    ? `${selectedRecord.residentialDistrict || 'Abuja District'} (Masked for Privacy)`
                    : selectedRecord.residentialAddress || selectedRecord.residentialDistrict || 'No street recorded'}
                </span>
                {selectedRecord.residentialDistrict && (
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    District: {selectedRecord.residentialDistrict} ({selectedRecord.residentialAreaCouncil || 'FCT'})
                  </span>
                )}
              </div>

              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Community Landmark</span>
                <span className="text-slate-800 dark:text-slate-200">{selectedRecord.community}</span>
              </div>

              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Soul Winner</span>
                <span className="text-slate-800 dark:text-slate-200">{selectedRecord.wonByName}</span>
                {(selectedRecord.winnerCell || selectedRecord.winnerPcf) && (
                  <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                    {selectedRecord.winnerCell && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                        🔵 {selectedRecord.winnerCell}
                      </span>
                    )}
                    {selectedRecord.winnerPcf && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
                        🟣 {selectedRecord.winnerPcf}
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Date Decided</span>
                <span className="font-mono-tabular text-slate-800 dark:text-slate-200">
                  {new Date(selectedRecord.wonAt).toLocaleString()}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Suggested Bus Route</span>
                <div className="flex items-center gap-1 text-teal-600 dark:text-teal-400 font-semibold mt-0.5">
                  <Bus className="w-3 h-3" />
                  <span>
                    {selectedRecord.residentialDistrict
                      ? `${selectedRecord.residentialDistrict} ⇄ Central Assembly`
                      : 'Central Zone Shuttle'}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Follow-Up Stage</span>
                <span className="capitalize font-semibold" style={{ color: palette.hex }}>
                  {selectedRecord.followUpStatus.replace('_', ' ')}
                </span>
              </div>
            </div>

            {selectedRecord.duplicateOverrideReason && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 space-y-1">
                <span className="font-bold flex items-center gap-1.5 text-xs text-amber-800 dark:text-amber-300">
                  <Info className="w-3.5 h-3.5" /> Duplicate Phone Override Reason:
                </span>
                <p className="italic text-[11px]">{selectedRecord.duplicateOverrideReason}</p>
              </div>
            )}

            {selectedRecord.notes && (
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold mb-1">
                  Prayer & Pastoral Notes
                </span>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300 italic">
                  "{selectedRecord.notes}"
                </div>
              </div>
            )}

            {isAuthorizedToDelete && (
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <span className="text-[11px] text-slate-400">Archived items can be restored via Audit Log.</span>
                <button
                  id="modal-delete-record-btn"
                  onClick={() => {
                    handlePromptDelete(selectedRecord);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Soft Delete Record</span>
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* SOFT DELETE REASON MODAL */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Confirm Soft Deletion"
      >
        <div className="space-y-4">
          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong className="block font-bold">Soft Delete Notice:</strong>
              This record will be removed from public counts, but will be safely retained in the immutable Admin Audit Log and can be restored at any time.
            </div>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-300">
            Please enter a justification for deleting <strong>{recordToDelete?.firstName} {recordToDelete?.lastName}</strong>:
          </p>

          <textarea
            id="delete-reason-input"
            rows={3}
            value={deleteReason}
            onChange={e => setDeleteReason(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl p-3 text-xs focus:outline-none"
            placeholder="Reason for deletion..."
          />

          <div className="flex justify-end gap-2">
            <button
              id="cancel-delete-btn"
              onClick={() => setDeleteModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              id="confirm-soft-delete-btn"
              onClick={handleConfirmDelete}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-xs cursor-pointer"
            >
              Confirm Soft Delete
            </button>
          </div>
        </div>
      </Modal>

      {/* BULK CSV IMPORT MODAL */}
      <Modal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        title="Bulk Import Soul Records (CSV)"
      >
        <div className="space-y-4 text-xs">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 dark:text-slate-100">Step 1: Download CSV Template</span>
              <button
                onClick={handleDownloadTemplate}
                className="px-3 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-[11px] cursor-pointer flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Get Template</span>
              </button>
            </div>
            <p className="text-slate-500 text-[11px]">
              Use the official template with columns: <code className="font-mono text-slate-700 dark:text-slate-300">First Name, Last Name, Phone, Gender, Age Bracket, Community, Decision Type, Soul Winner, Notes</code>.
            </p>
          </div>

          <div className="space-y-2">
            <label className="block font-bold text-slate-700 dark:text-slate-300">
              Step 2: Select Target Collation Centre
            </label>
            <select
              value={importCentreId}
              onChange={e => setImportCentreId(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl px-3 py-2 text-xs focus:outline-none cursor-pointer"
            >
              {centres.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.areaCouncilCode || 'AMAC'})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="block font-bold text-slate-700 dark:text-slate-300">
              Step 3: Upload CSV File
            </label>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-slate-100 file:text-slate-700 dark:file:bg-slate-800 dark:file:text-slate-200 hover:file:bg-slate-200 cursor-pointer"
            />
          </div>

          {parsedRows.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between font-bold text-slate-800 dark:text-slate-200">
                <span>Preview ({parsedRows.length} rows parsed)</span>
                <span className="text-emerald-600 dark:text-emerald-400">
                  {parsedRows.filter(r => r.isValid).length} Valid Records
                </span>
              </div>
              <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
                <table className="w-full text-left border-collapse text-[11px]">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                      <th className="p-2">Name</th>
                      <th className="p-2">Phone</th>
                      <th className="p-2">Locality</th>
                      <th className="p-2">Decision</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-900">
                    {parsedRows.slice(0, 20).map((row, idx) => (
                      <tr key={idx} className={row.isValid ? '' : 'bg-rose-50/50 dark:bg-rose-950/20'}>
                        <td className="p-2 font-bold text-slate-900 dark:text-slate-100">
                          {row.firstName} {row.lastName}
                        </td>
                        <td className="p-2 font-mono text-slate-600 dark:text-slate-400">{row.phone || 'No phone'}</td>
                        <td className="p-2 text-slate-600 dark:text-slate-400">{row.community}</td>
                        <td className="p-2 capitalize text-slate-600 dark:text-slate-400">{row.decisionType.replace('_', ' ')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={() => {
                setImportModalOpen(false);
                setParsedRows([]);
              }}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleExecuteImport}
              disabled={isProcessingImport || parsedRows.filter(r => r.isValid).length === 0}
              className={`px-4 py-2 rounded-xl text-white text-xs font-bold shadow-xs cursor-pointer disabled:opacity-50 ${palette.btnPrimary}`}
            >
              {isProcessingImport ? 'Importing...' : `Import ${parsedRows.filter(r => r.isValid).length} Valid Records`}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
