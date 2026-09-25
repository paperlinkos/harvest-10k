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
  Lock,
  LogIn,
  Award,
  Building2,
  Layers,
  ChevronDown,
  ChevronUp,
  FolderTree,
  CheckCircle2,
  Maximize2,
  Minimize2,
  Filter,
  ShieldCheck,
} from 'lucide-react';
import { getWhatsAppLink } from '../utils/whatsappUtils';
import { VerificationMessageModal } from '../components/VerificationMessageModal';
import {
  GROUP_JURISDICTIONS,
  resolveGroupJurisdiction,
  getCentresForJurisdiction,
  GroupJurisdiction,
} from '../services/groupJurisdictionService';

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
  const [viewMode, setViewMode] = useState<'table' | 'categorized'>(() => {
    return userRole === 'group_pastor' ? 'categorized' : 'table';
  });
  const [categorizeBy, setCategorizeBy] = useState<'church' | 'group'>('church');
  const [groupFilter, setGroupFilter] = useState('all');
  const [areaCouncilFilter, setAreaCouncilFilter] = useState('all');
  const [centreFilter, setCentreFilter] = useState('all');
  const [decisionFilter, setDecisionFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedChurches, setExpandedChurches] = useState<Record<string, boolean>>({});

  const [selectedGenders, setSelectedGenders] = useState<string[]>([]);
  const [selectedAgeBrackets, setSelectedAgeBrackets] = useState<string[]>([]);
  const [selectedDecisionTypes, setSelectedDecisionTypes] = useState<string[]>([]);
  const [selectedFollowUpStatuses, setSelectedFollowUpStatuses] = useState<string[]>([]);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const [page, setPage] = useState(1);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const pageSize = 15;

  const [selectedRecord, setSelectedRecord] = useState<SoulRecord | null>(null);
  const [messageModalRecord, setMessageModalRecord] = useState<SoulRecord | null>(null);
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

  // Active Group Pastor Jurisdiction State
  const [selectedJurisdictionKey, setSelectedJurisdictionKey] = useState<string>(() => {
    return resolveGroupJurisdiction(activeProfile, centres).key;
  });

  // Sync jurisdiction if active profile changes
  React.useEffect(() => {
    if (activeProfile?.assignedGroup || activeProfile?.churchCentreId) {
      const j = resolveGroupJurisdiction(activeProfile, centres);
      setSelectedJurisdictionKey(j.key);
    }
  }, [activeProfile?.assignedGroup, activeProfile?.churchCentreId]);

  const activeJurisdiction = useMemo<GroupJurisdiction>(() => {
    return GROUP_JURISDICTIONS.find(j => j.key === selectedJurisdictionKey) || resolveGroupJurisdiction(activeProfile, centres);
  }, [selectedJurisdictionKey, activeProfile, centres]);

  // Churches that fall strictly under this Group Pastor's oversight
  const groupPastorCentres = useMemo(() => {
    return getCentresForJurisdiction(activeJurisdiction, centres);
  }, [activeJurisdiction, centres]);

  const groupPastorCentreIds = useMemo(() => {
    return new Set(groupPastorCentres.map(c => c.id));
  }, [groupPastorCentres]);

  // Allowed centres for this user role
  const allowedCentresForRole = useMemo(() => {
    if (userRole === 'group_pastor') {
      return groupPastorCentres;
    }
    if (userRole === 'pastor') {
      const pCentreId = activeProfile?.churchCentreId || centres[0]?.id;
      const found = centres.filter(c => c.id === pCentreId || c.name === activeProfile?.churchName);
      return found.length > 0 ? found : (centres[0] ? [centres[0]] : []);
    }
    return centres;
  }, [userRole, groupPastorCentres, centres, activeProfile]);

  const [fieldWorkerScope, setFieldWorkerScope] = useState<'my_souls' | 'all'>(() => {
    return userRole === 'soul_winner' ? 'my_souls' : 'all';
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

  const groupNames = useMemo(() => {
    const set = new Set<string>();
    allowedCentresForRole.forEach(c => {
      if (c.groupName) set.add(c.groupName);
    });
    return Array.from(set).sort();
  }, [allowedCentresForRole]);

  const filteredCentres = useMemo(() => {
    return allowedCentresForRole.filter(c => {
      if (areaCouncilFilter !== 'all' && c.areaCouncilId !== areaCouncilFilter && c.regionId !== areaCouncilFilter) {
        return false;
      }
      if (groupFilter !== 'all' && c.groupName !== groupFilter) {
        return false;
      }
      return true;
    });
  }, [allowedCentresForRole, areaCouncilFilter, groupFilter]);

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
    // 1. Group Pastor role isolation: strictly restrict to churches within this Group Pastor's jurisdiction
    if (userRole === 'group_pastor') {
      if (!groupPastorCentreIds.has(r.centreId)) {
        return false;
      }
    }

    // 2. Church Pastor role isolation: strictly restrict to their assigned church centre
    if (userRole === 'pastor') {
      const pCentreId = activeProfile?.churchCentreId || centres[0]?.id;
      if (r.centreId !== pCentreId) {
        return false;
      }
    }

    // 3. Soul winner scope
    if (userRole === 'soul_winner' && fieldWorkerScope === 'my_souls') {
      const matchName = Boolean(activeProfile?.fullName && r.wonByName && r.wonByName.trim().toLowerCase() === activeProfile.fullName.trim().toLowerCase());
      const matchPhone = Boolean(activeProfile?.phone && r.winnerPhone && r.winnerPhone === activeProfile.phone);
      if (!matchName && !matchPhone) return false;
    }
    if (groupFilter !== 'all') {
      const c = centreMap.get(r.centreId);
      if (!c || c.groupName !== groupFilter) {
        return false;
      }
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

  // Helper to reliably get church name, group name, and details for any record
  const getChurchInfo = (r: SoulRecord) => {
    const direct = centreMap.get(r.centreId);
    if (direct) {
      return {
        name: direct.name,
        groupName: direct.groupName || 'Abuja Zone 1',
        code: direct.code,
        venue: direct.venue,
        target: direct.target,
        centre: direct,
      };
    }
    if (r.winnerChurch) {
      const byName = centres.find(c => c.name.toLowerCase() === r.winnerChurch?.toLowerCase());
      if (byName) {
        return {
          name: byName.name,
          groupName: byName.groupName || 'Abuja Zone 1',
          code: byName.code,
          venue: byName.venue,
          target: byName.target,
          centre: byName,
        };
      }
      return {
        name: r.winnerChurch,
        groupName: 'Abuja Zone 1',
        code: undefined,
        venue: undefined,
        target: undefined,
        centre: undefined,
      };
    }
    if (r.followUpChurch) {
      return {
        name: r.followUpChurch,
        groupName: 'Abuja Zone 1',
        code: undefined,
        venue: undefined,
        target: undefined,
        centre: undefined,
      };
    }
    const fallback = centres[0];
    return {
      name: fallback?.name || 'Christ Embassy Assembly',
      groupName: fallback?.groupName || 'Abuja Zone 1',
      code: fallback?.code,
      venue: fallback?.venue,
      target: fallback?.target,
      centre: fallback,
    };
  };

  // Group records by Church Centre for the Categorized view
  const recordsByChurch = useMemo(() => {
    const map = new Map<string, { centre: any; records: SoulRecord[] }>();
    filteredCentres.forEach(c => {
      map.set(c.id, { centre: c, records: [] });
    });
    records.forEach(r => {
      let entry = map.get(r.centreId);
      if (!entry) {
        const info = getChurchInfo(r);
        const c = info.centre || {
          id: r.centreId,
          name: info.name,
          groupName: info.groupName,
          code: info.code,
        };
        entry = { centre: c, records: [] };
        map.set(r.centreId, entry);
      }
      entry.records.push(r);
    });
    return Array.from(map.values())
      .filter(item => item.records.length > 0 || (centreFilter === item.centre.id) || groupFilter !== 'all')
      .sort((a, b) => b.records.length - a.records.length);
  }, [records, filteredCentres, centreMap, centreFilter, groupFilter]);

  // Group records by Church Group for the Group Categorized view
  const recordsByGroup = useMemo(() => {
    const groupMap = new Map<string, {
      groupName: string;
      churches: { centre: any; records: SoulRecord[] }[];
      totalRecords: number;
      newConverts: number;
      rededications: number;
    }>();

    // Initialize with filtered centres
    filteredCentres.forEach(c => {
      const gName = c.groupName || 'Abuja Zone 1';
      if (!groupMap.has(gName)) {
        groupMap.set(gName, {
          groupName: gName,
          churches: [],
          totalRecords: 0,
          newConverts: 0,
          rededications: 0,
        });
      }
      const gEntry = groupMap.get(gName)!;
      if (!gEntry.churches.some(item => item.centre.id === c.id)) {
        gEntry.churches.push({ centre: c, records: [] });
      }
    });

    records.forEach(r => {
      const info = getChurchInfo(r);
      const gName = info.groupName;
      let gEntry = groupMap.get(gName);
      if (!gEntry) {
        gEntry = {
          groupName: gName,
          churches: [],
          totalRecords: 0,
          newConverts: 0,
          rededications: 0,
        };
        groupMap.set(gName, gEntry);
      }
      let churchItem = gEntry.churches.find(ci => ci.centre.id === r.centreId || ci.centre.name === info.name);
      if (!churchItem) {
        churchItem = { centre: info.centre || { id: r.centreId, name: info.name, groupName: gName }, records: [] };
        gEntry.churches.push(churchItem);
      }
      churchItem.records.push(r);
      gEntry.totalRecords++;
      if (r.decisionType === 'new_convert') gEntry.newConverts++;
      if (r.decisionType === 'rededication') gEntry.rededications++;
    });

    return Array.from(groupMap.values())
      .filter(g => g.totalRecords > 0 || groupFilter !== 'all')
      .sort((a, b) => b.totalRecords - a.totalRecords);
  }, [records, filteredCentres, groupFilter]);

  const handleExpandAll = () => {
    const next: Record<string, boolean> = {};
    recordsByChurch.forEach(item => {
      next[item.centre.id] = false; // false means not collapsed = expanded
    });
    recordsByGroup.forEach(g => {
      next[`grp-${g.groupName}`] = false;
      g.churches.forEach(c => {
        next[`${g.groupName}-${c.centre.id}`] = false;
      });
    });
    setExpandedChurches(next);
  };

  const handleCollapseAll = () => {
    const next: Record<string, boolean> = {};
    recordsByChurch.forEach(item => {
      next[item.centre.id] = true; // true means collapsed
    });
    recordsByGroup.forEach(g => {
      next[`grp-${g.groupName}`] = true;
      g.churches.forEach(c => {
        next[`${g.groupName}-${c.centre.id}`] = true;
      });
    });
    setExpandedChurches(next);
  };

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
      'Church Name',
      'Church Group',
      'Outreach Spot (Where Won)',
      'Living Address (Where Lives)',
      'Residential District',
      'Residential Area Council',
      'Community',
      'Decision Type',
      'Soul Winner',
      'Winner Cell',
      'Centre Code',
      'Date Won',
      'Status',
      'Follow-Up Status',
      'Follow-Up Church',
      'Notes',
    ];

    const rows = records.map(r => {
      const church = getChurchInfo(r);
      return [
        r.id,
        `"${r.firstName}"`,
        `"${r.lastName}"`,
        `"${r.phone}"`,
        r.gender,
        r.ageBracket,
        `"${church.name}"`,
        `"${church.groupName}"`,
        `"${r.outreachSpot || ''}"`,
        `"${(r.residentialAddress || '').replace(/"/g, '""')}"`,
        `"${r.residentialDistrict || ''}"`,
        `"${r.residentialAreaCouncil || 'FCT'}"`,
        `"${r.community}"`,
        r.decisionType,
        `"${r.wonByName}"`,
        `"${r.winnerCell || ''}"`,
        church.code || r.centreId,
        r.wonAt,
        r.status,
        r.followUpStatus,
        `"${r.followUpChurch}"`,
        `"${(r.notes || '').replace(/"/g, '""')}"`,
      ];
    });

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

  if (userRole === 'public') {
    return (
      <div className="max-w-lg mx-auto my-16 p-8 sm:p-12 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl text-center space-y-5">
        <div className="w-16 h-16 mx-auto rounded-full bg-amber-500/10 dark:bg-amber-400/10 flex items-center justify-center text-amber-600 dark:text-amber-400 border border-amber-500/20">
          <Lock className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white">Field Records Protected</h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-sm mx-auto">
            Telephone directories and outreach details of converted souls are private. Please log in as a Soul Winner, Pastor, or Administrator to access records.
          </p>
        </div>
        <div className="pt-2">
          <button
            type="button"
            onClick={() => {
              const loginBtn = document.getElementById('header-login-btn');
              if (loginBtn) {
                loginBtn.click();
              }
            }}
            className="w-full sm:w-auto px-6 py-2.5 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs shadow-md hover:opacity-90 active:scale-95 transition-all cursor-pointer inline-flex items-center justify-center gap-2"
          >
            <LogIn className="w-4 h-4" />
            <span>Sign In to Access Records</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Group Pastor Oversight Jurisdiction Card (Specific to Group Pastors) */}
      {userRole === 'group_pastor' && (
        <div className="bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-4 sm:p-5 shadow-sm border border-indigo-700/50 space-y-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-start sm:items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 flex items-center justify-center font-black text-sm shrink-0">
                <Building2 className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-black text-base text-white">
                    {activeJurisdiction.name} Soul Directory
                  </h3>
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    Strict Group Isolation
                  </span>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-white/10 text-white/90">
                    {activeJurisdiction.pastorName}
                  </span>
                </div>
                <p className="text-xs text-indigo-200/90 mt-1 max-w-2xl leading-relaxed">
                  {activeJurisdiction.description}. Showing exclusively souls won in {groupPastorCentres.length} churches under {activeJurisdiction.name}. 
                  Souls from other groups (Wuye, Zonal Church Service 1, Gwarinpa, etc.) are separated and strictly excluded.
                </p>
              </div>
            </div>

            {/* Jurisdiction Switcher (Allows Group Pastor switching or oversight inspection) */}
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-xs p-2 rounded-xl border border-white/10 shrink-0 self-start md:self-auto">
              <div className="text-right hidden sm:block">
                <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-200">Group Oversight</div>
                <div className="text-xs font-semibold text-white truncate max-w-[160px]">{activeJurisdiction.name}</div>
              </div>
              <select
                id="group-pastor-jurisdiction-select"
                value={selectedJurisdictionKey}
                onChange={(e) => {
                  const newKey = e.target.value;
                  setSelectedJurisdictionKey(newKey);
                  const found = GROUP_JURISDICTIONS.find(j => j.key === newKey);
                  if (found) {
                    const updatedProfile = {
                      ...(activeProfile || {}),
                      id: `group-pastor-${found.key}`,
                      fullName: found.pastorName.split('(')[0].trim(),
                      phone: found.pastorPhone,
                      email: found.pastorEmail,
                      assignedGroup: found.name,
                      churchCentreId: found.defaultCentreId,
                      churchName: found.name,
                      roleTitle: `${found.name} Pastor`,
                    };
                    dataService.saveSoulWinnerProfile(updatedProfile);
                    setCentreFilter('all');
                    setPage(1);
                    if (onSuccessToast) {
                      onSuccessToast(
                        'Jurisdiction Switched',
                        `Logged into ${found.name} oversight (${found.pastorName}). Only records from its ${getCentresForJurisdiction(found, centres).length} churches are visible.`
                      );
                    }
                  }
                }}
                className="text-xs font-bold px-3 py-1.5 rounded-lg bg-indigo-950 border border-indigo-400/40 text-white focus:outline-none focus:ring-2 focus:ring-indigo-400 cursor-pointer"
                title="Switch Group Pastor Oversight to view another group"
              >
                {GROUP_JURISDICTIONS.map(j => {
                  const count = getCentresForJurisdiction(j, centres).length;
                  return (
                    <option key={j.key} value={j.key} className="bg-slate-900 text-white">
                      {j.name} ({count} churches) — {j.pastorName.split('(')[0].trim()}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          {/* Quick Sub-Group Coverage Pills */}
          <div className="pt-2 border-t border-indigo-800/60 flex items-center gap-1.5 flex-wrap text-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-300">Sub-Groups Covered:</span>
            {activeJurisdiction.subGroups.map(sg => (
              <span key={sg} className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-indigo-800/60 text-indigo-100 border border-indigo-700/50">
                {sg}
              </span>
            ))}
            <span className="text-[11px] text-indigo-300 ml-1">
              ({groupPastorCentres.length} churches · {records.length} souls)
            </span>
          </div>
        </div>
      )}

      {/* Header with Title and PDF / CSV export actions */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 rounded-2xl shadow-xs transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h2 className="text-base sm:text-xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Database className="w-5 h-5" style={{ color: palette.hex }} />
              {userRole === 'soul_winner' && fieldWorkerScope === 'my_souls'
                ? 'My Won Souls Registry'
                : userRole === 'group_pastor'
                ? `${activeJurisdiction.name} Soul Directory`
                : userRole === 'pastor'
                ? 'Church Soul Records'
                : userRole === 'zonal_pastor'
                ? 'Zonal Master Registry'
                : 'Abuja FCT Soul Registry'}
            </h2>
            {userRole === 'group_pastor' && (
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 font-bold text-xs border border-indigo-500/20 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5" />
                {activeJurisdiction.name} Oversight
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {userRole === 'soul_winner' && fieldWorkerScope === 'my_souls'
              ? 'Personal log of souls won and led to Christ by your outreach'
              : userRole === 'group_pastor'
              ? `Directory of all souls won categorized across ${activeJurisdiction.name} churches with dedicated church columns.`
              : 'Verified registry of individuals won across Abuja churches'}{' '}
            ({records.length} records shown across {filteredCentres.length} churches).
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {viewMode === 'categorized' && (
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={handleExpandAll}
                className="px-2.5 py-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
                title="Expand all church categories"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span>Expand All</span>
              </button>
              <button
                type="button"
                onClick={handleCollapseAll}
                className="px-2.5 py-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
                title="Collapse all church categories"
              >
                <Minimize2 className="w-3.5 h-3.5" />
                <span>Collapse All</span>
              </button>
            </div>
          )}

          {/* Printable PDF Report Button */}
          <button
            id="download-pdf-report-btn"
            onClick={handleDownloadPDF}
            disabled={isGeneratingPDF || records.length === 0}
            className={`px-3.5 py-2 rounded-xl text-white font-bold text-xs flex items-center gap-2 shadow-xs transition-transform active:scale-98 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${palette.btnPrimary}`}
            title="Download printable PDF summary report with executive metrics and filtered records"
          >
            {isGeneratingPDF ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <FileText className="w-4 h-4" />
            )}
            <span>{isGeneratingPDF ? 'Generating...' : 'PDF Report'}</span>
          </button>

          {/* Export CSV Button */}
          <button
            id="export-csv-btn"
            onClick={handleExportCSV}
            disabled={records.length === 0}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5 shadow-xs transition-transform active:scale-98 cursor-pointer disabled:opacity-50"
            title="Export raw data to CSV file with Church and Group columns"
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

      {/* Group Pastor Key Statistics Strip */}
      {(userRole === 'group_pastor' || groupFilter !== 'all') && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-gradient-to-r from-indigo-50/70 via-blue-50/50 to-purple-50/70 dark:from-indigo-950/40 dark:via-blue-950/30 dark:to-purple-950/40 border border-indigo-100 dark:border-indigo-900/50 p-4 rounded-2xl">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-500 dark:text-indigo-400">
              {userRole === 'group_pastor' ? `${activeJurisdiction.name} Souls` : 'Total Group Souls'}
            </div>
            <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-0.5">
              {records.length}
            </div>
            <div className="text-[10px] text-slate-400">in pastoral oversight</div>
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-500 dark:text-indigo-400">
              {userRole === 'group_pastor' ? 'Churches Under Oversight' : 'Group Churches'}
            </div>
            <div className="text-xl sm:text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-0.5">
              {filteredCentres.length}
            </div>
            <div className="text-[10px] text-slate-400">
              {userRole === 'group_pastor' ? `in ${activeJurisdiction.name}` : 'assemblies mapped'}
            </div>
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">New Converts</div>
            <div className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
              {records.filter(r => r.decisionType === 'new_convert').length}
            </div>
            <div className="text-[10px] text-slate-400">
              {records.length > 0 ? Math.round((records.filter(r => r.decisionType === 'new_convert').length / records.length) * 100) : 0}% of group
            </div>
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">Rededications</div>
            <div className="text-xl sm:text-2xl font-black text-blue-600 dark:text-blue-400 mt-0.5">
              {records.filter(r => r.decisionType === 'rededication').length}
            </div>
            <div className="text-[10px] text-slate-400">re-committed lives</div>
          </div>
        </div>
      )}

      {/* Prominent View Mode Switcher & Quick Church Pill Filter Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 rounded-2xl shadow-xs space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <FolderTree className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>Directory Layout & Categorization:</span>
          </div>

          {/* Segmented View Switcher: Categorized by Church vs Categorized by Group vs Master Table */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold self-start sm:self-auto">
            <button
              onClick={() => {
                setViewMode('categorized');
                setCategorizeBy('church');
              }}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'categorized' && categorizeBy === 'church'
                  ? 'bg-indigo-600 text-white font-bold shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Categorize souls into Church Assembly groups"
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Categorized by Church</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                viewMode === 'categorized' && categorizeBy === 'church' ? 'bg-white/25 text-white' : 'bg-slate-200 dark:bg-slate-700'
              }`}>
                {recordsByChurch.length}
              </span>
            </button>

            <button
              onClick={() => {
                setViewMode('categorized');
                setCategorizeBy('group');
              }}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'categorized' && categorizeBy === 'group'
                  ? 'bg-indigo-600 text-white font-bold shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Categorize souls into Zonal Groups"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Categorized by Group</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                viewMode === 'categorized' && categorizeBy === 'group' ? 'bg-white/25 text-white' : 'bg-slate-200 dark:bg-slate-700'
              }`}>
                {recordsByGroup.length}
              </span>
            </button>

            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Show flat table of all soul records with dedicated Church column"
            >
              <Database className="w-3.5 h-3.5" />
              <span>Master Table View</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                viewMode === 'table' ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300' : 'bg-slate-200 dark:bg-slate-700'
              }`}>
                {records.length}
              </span>
            </button>
          </div>
        </div>

        {/* Quick Church Pills Horizontal Bar */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-2 overflow-x-auto pb-1.5 custom-scrollbar text-xs">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 shrink-0 flex items-center gap-1">
              <Building2 className="w-3 h-3 text-indigo-500" />
              Quick Church Filter:
            </span>

            <button
              type="button"
              onClick={() => {
                setCentreFilter('all');
                setPage(1);
              }}
              className={`px-2.5 py-1 rounded-lg font-bold whitespace-nowrap text-[11px] transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
                centreFilter === 'all'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <span>{userRole === 'group_pastor' ? `All ${activeJurisdiction.name} Churches` : 'All Churches'}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                centreFilter === 'all' ? 'bg-white/20 text-white' : 'bg-white dark:bg-slate-900 text-slate-500'
              }`}>
                {records.length}
              </span>
            </button>

            {filteredCentres.map(c => {
              const churchSoulCount = records.filter(r => r.centreId === c.id || r.winnerChurch?.toLowerCase() === c.name.toLowerCase()).length;
              const isSelected = centreFilter === c.id;

              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    setCentreFilter(isSelected ? 'all' : c.id);
                    setPage(1);
                  }}
                  className={`px-2.5 py-1 rounded-lg font-semibold whitespace-nowrap text-[11px] transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-indigo-600 text-white font-bold shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:border-indigo-400'
                  }`}
                >
                  <Building2 className="w-3 h-3 text-indigo-400 shrink-0" />
                  <span>{c.name}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isSelected ? 'bg-white/25 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                  }`}>
                    {churchSoulCount}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Soul Winner Personal vs All Toggle */}
      {userRole === 'soul_winner' && (
        <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center font-black text-base shrink-0">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                Evangelist Roster Profile: <span className="text-amber-600 dark:text-amber-400">{activeProfile?.fullName || 'Active Soul Winner'}</span>
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
              My Won Souls ({mySoulsCount})
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
              All Abuja Records ({allRawRecords.length})
            </button>
          </div>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 rounded-2xl shadow-xs transition-colors grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
        {/* Search Bar */}
        <div className="relative lg:col-span-2">
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

        {/* Church Group Dropdown */}
        <select
          id="records-group-filter"
          value={groupFilter}
          onChange={e => {
            setGroupFilter(e.target.value);
            setCentreFilter('all');
            setPage(1);
          }}
          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl px-3 py-1.5 text-xs focus:outline-none cursor-pointer font-medium"
        >
          <option value="all">All Church Groups</option>
          {groupNames.map(g => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>

        {/* Church Dropdown */}
        <select
          id="records-centre-filter"
          value={centreFilter}
          onChange={e => {
            setCentreFilter(e.target.value);
            setPage(1);
          }}
          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl px-3 py-1.5 text-xs focus:outline-none cursor-pointer font-medium"
        >
          <option value="all">
            {groupFilter === 'all' ? 'All Churches' : `All Churches in ${groupFilter}`}
          </option>
          {filteredCentres.map(c => (
            <option key={c.id} value={c.id}>
              {c.name} {c.groupName && groupFilter === 'all' ? `(${c.groupName})` : ''}
            </option>
          ))}
        </select>

        {/* Area Council Dropdown */}
        <select
          id="records-area-council-filter"
          value={areaCouncilFilter}
          onChange={e => {
            setAreaCouncilFilter(e.target.value);
            setCentreFilter('all');
            setPage(1);
          }}
          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl px-3 py-1.5 text-xs focus:outline-none cursor-pointer"
        >
          <option value="all">All Area Councils</option>
          {areaCouncils.map(ac => (
            <option key={ac.id} value={ac.id}>
              {ac.name} ({ac.code})
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
          <option value="all">All Decisions</option>
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

      {/* View Mode Switching: Categorized by Church vs Categorized by Group vs Master Flat Table */}
      {viewMode === 'categorized' ? (
        <div className="space-y-4">
          {categorizeBy === 'group' ? (
            /* Categorized by Church Group */
            recordsByGroup.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-12 text-center text-slate-400 text-xs">
                No soul records found for the selected group filters.
              </div>
            ) : (
              recordsByGroup.map(group => {
                const groupKey = `grp-${group.groupName}`;
                const isGroupCollapsed = expandedChurches[groupKey] === true;

                return (
                  <div
                    key={group.groupName}
                    className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden transition-all"
                  >
                    {/* Church Group Category Header */}
                    <div
                      onClick={() =>
                        setExpandedChurches(prev => ({
                          ...prev,
                          [groupKey]: !isGroupCollapsed,
                        }))
                      }
                      className="p-4 sm:p-5 bg-gradient-to-r from-indigo-50/90 via-slate-50/80 to-purple-50/90 dark:from-indigo-950/60 dark:via-slate-900 dark:to-purple-950/60 hover:opacity-95 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-indigo-100 dark:border-indigo-900/40"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-base shadow-xs shrink-0">
                          <Layers className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-black text-base sm:text-lg text-slate-900 dark:text-white">
                              {group.groupName}
                            </h3>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/80 text-indigo-700 dark:text-indigo-300">
                              {group.churches.length} Churches
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                            Zonal church group categorization · All assemblies under {group.groupName}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        <div className="flex items-center gap-1.5 text-xs font-bold">
                          <span className="px-3 py-1 rounded-xl bg-indigo-600 text-white font-mono shadow-xs">
                            {group.totalRecords} Souls
                          </span>
                          <span className="px-2 py-1 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px]">
                            {group.newConverts} New Converts
                          </span>
                          <span className="px-2 py-1 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-[10px]">
                            {group.rededications} Reded.
                          </span>
                        </div>
                        <button
                          type="button"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                        >
                          {isGroupCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Group Churches Body */}
                    {!isGroupCollapsed && (
                      <div className="p-4 sm:p-5 space-y-4 bg-slate-50/40 dark:bg-slate-950/20">
                        {group.churches.map(({ centre: c, records: churchRecords }) => {
                          const churchKey = `${group.groupName}-${c.id}`;
                          const isChurchCollapsed = expandedChurches[churchKey] === true;

                          return (
                            <div
                              key={c.id}
                              className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl overflow-hidden shadow-2xs"
                            >
                              <div
                                onClick={() =>
                                  setExpandedChurches(prev => ({
                                    ...prev,
                                    [churchKey]: !isChurchCollapsed,
                                  }))
                                }
                                className="p-3.5 bg-slate-50/80 dark:bg-slate-800/50 hover:bg-slate-100/70 dark:hover:bg-slate-800/80 cursor-pointer flex items-center justify-between gap-3 border-b border-slate-200/60 dark:border-slate-800"
                              >
                                <div className="flex items-center gap-2.5">
                                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                                    <Building2 className="w-4 h-4" />
                                  </div>
                                  <div>
                                    <div className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                                      <span>{c.name}</span>
                                      {c.code && (
                                        <span className="text-[9px] font-mono text-slate-400">
                                          ({c.code})
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-[10px] text-slate-400">
                                      Venue: {c.venue || 'Abuja Centre'}
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2">
                                  <span className="px-2.5 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 font-bold text-xs font-mono">
                                    {churchRecords.length} Souls
                                  </span>
                                  <button
                                    type="button"
                                    className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                                  >
                                    {isChurchCollapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
                                  </button>
                                </div>
                              </div>

                              {/* Souls Table under Church with Dedicated Church Column */}
                              {!isChurchCollapsed && (
                                <div className="overflow-x-auto">
                                  {churchRecords.length === 0 ? (
                                    <div className="p-5 text-center text-slate-400 text-xs">
                                      No soul records found for {c.name}.
                                    </div>
                                  ) : (
                                    <table className="w-full text-left text-xs">
                                      <thead className="bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200/80 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold">
                                        <tr>
                                          <th className="py-2.5 px-3.5 pl-5">Convert Name</th>
                                          <th className="py-2.5 px-3.5">Contact</th>
                                          <th className="py-2.5 px-3.5 font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/20">
                                            <div className="flex items-center gap-1.5">
                                              <Building2 className="w-3.5 h-3.5 text-indigo-500" />
                                              <span>Church / Assembly</span>
                                            </div>
                                          </th>
                                          <th className="py-2.5 px-3.5">Decision</th>
                                          <th className="py-2.5 px-3.5">Where Won / Lives</th>
                                          <th className="py-2.5 px-3.5">Soul Winner</th>
                                          <th className="py-2.5 px-3.5">Follow-Up</th>
                                          <th className="py-2.5 px-3.5 pr-5 text-right">Actions</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
                                        {churchRecords.map(r => {
                                          const info = getChurchInfo(r);
                                          return (
                                            <tr
                                              key={r.id}
                                              className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                                            >
                                              <td className="py-2.5 px-3.5 pl-5 font-medium">
                                                <div className="font-bold text-slate-900 dark:text-slate-100">
                                                  {r.firstName} {r.lastName}
                                                </div>
                                                <div className="text-[10px] text-slate-400 capitalize">
                                                  {r.gender}, {r.ageBracket}
                                                </div>
                                              </td>
                                              <td className="py-2.5 px-3.5 font-mono-tabular">
                                                <div className="flex items-center gap-2">
                                                  <span>{maskPhone(r.phone)}</span>
                                                  {r.phone && (
                                                    <button
                                                      type="button"
                                                      onClick={() => setMessageModalRecord(r)}
                                                      className="p-1 rounded-md bg-emerald-500/10 hover:bg-emerald-500/25 text-emerald-600 dark:text-emerald-400 transition-colors cursor-pointer"
                                                      title="Send WhatsApp or SMS"
                                                    >
                                                      <MessageCircle className="w-3.5 h-3.5" />
                                                    </button>
                                                  )}
                                                </div>
                                              </td>
                                              {/* Dedicated Church Column */}
                                              <td className="py-2.5 px-3.5 bg-indigo-50/20 dark:bg-indigo-950/10">
                                                <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                                                  <Building2 className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                                                  <span>{info.name}</span>
                                                </div>
                                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 mt-0.5 inline-block">
                                                  {info.groupName}
                                                </span>
                                              </td>
                                              <td className="py-2.5 px-3.5">
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
                                              <td className="py-2.5 px-3.5">
                                                <div className="flex flex-col gap-0.5">
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
                                              <td className="py-2.5 px-3.5">
                                                <div className="font-semibold text-slate-800 dark:text-slate-200">{r.wonByName}</div>
                                                {r.winnerCell && (
                                                  <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 mt-0.5 inline-block">
                                                    {r.winnerCell}
                                                  </span>
                                                )}
                                              </td>
                                              <td className="py-2.5 px-3.5">
                                                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 capitalize">
                                                  {r.followUpStatus.replace('_', ' ')}
                                                </span>
                                              </td>
                                              <td className="py-2.5 px-3.5 pr-5 text-right">
                                                <button
                                                  onClick={() => setSelectedRecord(r)}
                                                  className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                                                  title="View Details"
                                                >
                                                  <Eye className="w-3.5 h-3.5" />
                                                </button>
                                              </td>
                                            </tr>
                                          );
                                        })}
                                      </tbody>
                                    </table>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })
            )
          ) : (
            /* Categorized by Church */
            recordsByChurch.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-12 text-center text-slate-400 text-xs">
                No soul records found for the selected church filters.
              </div>
            ) : (
              recordsByChurch.map(({ centre: c, records: churchRecords }) => {
                const isCollapsed = expandedChurches[c.id] === true;
                const newConvertsCount = churchRecords.filter(r => r.decisionType === 'new_convert').length;
                const rededicationCount = churchRecords.filter(r => r.decisionType === 'rededication').length;
                const returneeCount = churchRecords.filter(r => r.decisionType === 'returnee').length;

                return (
                  <div
                    key={c.id}
                    className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden transition-all"
                  >
                    {/* Church Category Header */}
                    <div
                      onClick={() =>
                        setExpandedChurches(prev => ({
                          ...prev,
                          [c.id]: !isCollapsed,
                        }))
                      }
                      className="p-4 sm:p-5 bg-slate-50/70 dark:bg-slate-800/40 hover:bg-slate-100/70 dark:hover:bg-slate-800/70 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 dark:border-slate-800"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                          <Building2 className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-black text-sm sm:text-base text-slate-900 dark:text-white">
                              {c.name}
                            </h3>
                            {c.groupName && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                                {c.groupName}
                              </span>
                            )}
                            {c.code && (
                              <span className="text-[10px] font-mono text-slate-400">
                                {c.code}
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                            <span>Venue: {c.venue || 'Abuja Auditorium'}</span>
                            {c.target && <span>• Target: {c.target.toLocaleString()} souls</span>}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        <div className="flex items-center gap-1.5 text-xs font-bold">
                          <span className="px-2.5 py-1 rounded-xl bg-indigo-600 text-white font-mono">
                            {churchRecords.length} Souls
                          </span>
                          <span className="px-2 py-1 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px]">
                            {newConvertsCount} New
                          </span>
                          <span className="px-2 py-1 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-[10px]">
                            {rededicationCount} Reded.
                          </span>
                        </div>
                        <button
                          type="button"
                          className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                        >
                          {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Expanded Table of Souls for this Church with Dedicated Church Column */}
                    {!isCollapsed && (
                      <div className="overflow-x-auto">
                        {churchRecords.length === 0 ? (
                          <div className="p-6 text-center text-slate-400 text-xs">
                            No soul records recorded yet for {c.name}.
                          </div>
                        ) : (
                          <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200/80 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold">
                              <tr>
                                <th className="py-3 px-4 pl-6">Convert Name</th>
                                <th className="py-3 px-4">Contact</th>
                                <th className="py-3 px-4 font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50/50 dark:bg-indigo-950/20">
                                  <div className="flex items-center gap-1.5">
                                    <Building2 className="w-3.5 h-3.5 text-indigo-500" />
                                    <span>Church / Assembly</span>
                                  </div>
                                </th>
                                <th className="py-3 px-4">Decision</th>
                                <th className="py-3 px-4">Where Won / Lives</th>
                                <th className="py-3 px-4">Soul Winner</th>
                                <th className="py-3 px-4">Follow-Up</th>
                                <th className="py-3 px-4 pr-6 text-right">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
                              {churchRecords.map(r => {
                                const info = getChurchInfo(r);
                                return (
                                  <tr
                                    key={r.id}
                                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                                  >
                                    <td className="py-3 px-4 pl-6 font-medium">
                                      <div className="font-bold text-slate-900 dark:text-slate-100">
                                        {r.firstName} {r.lastName}
                                      </div>
                                      <div className="text-[10px] text-slate-400 capitalize">
                                        {r.gender}, {r.ageBracket}
                                      </div>
                                    </td>
                                    <td className="py-3 px-4 font-mono-tabular">
                                      <div className="flex items-center gap-2">
                                        <span>{maskPhone(r.phone)}</span>
                                        {r.phone && (
                                          <button
                                            type="button"
                                            onClick={() => setMessageModalRecord(r)}
                                            className="p-1 rounded-md bg-emerald-500/10 hover:bg-emerald-500/25 text-emerald-600 dark:text-emerald-400 transition-colors cursor-pointer"
                                            title="Send WhatsApp or SMS"
                                          >
                                            <MessageCircle className="w-3.5 h-3.5" />
                                          </button>
                                        )}
                                      </div>
                                    </td>
                                    {/* Dedicated Church Column */}
                                    <td className="py-3 px-4 bg-indigo-50/20 dark:bg-indigo-950/10">
                                      <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                                        <Building2 className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                                        <span>{info.name}</span>
                                      </div>
                                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 mt-0.5 inline-block">
                                        {info.groupName}
                                      </span>
                                    </td>
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
                                    <td className="py-3 px-4">
                                      <div className="flex flex-col gap-0.5">
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
                                    <td className="py-3 px-4">
                                      <div className="font-semibold text-slate-800 dark:text-slate-200">{r.wonByName}</div>
                                      {r.winnerCell && (
                                        <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 mt-0.5 inline-block">
                                          {r.winnerCell}
                                        </span>
                                      )}
                                    </td>
                                    <td className="py-3 px-4">
                                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 capitalize">
                                        {r.followUpStatus.replace('_', ' ')}
                                      </span>
                                    </td>
                                    <td className="py-3 px-4 pr-6 text-right">
                                      <div className="flex items-center justify-end gap-1.5">
                                        <button
                                          onClick={() => setSelectedRecord(r)}
                                          className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                                          title="View Details"
                                        >
                                          <Eye className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )
          )}
        </div>
      ) : (
        /* Flat Table Card */
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden transition-colors">
        {/* Desktop & Tablet: Data Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200/80 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold">
              <tr>
                <th className="py-3 px-4">Convert Name</th>
                <th className="py-3 px-4">Contact</th>
                <th className="py-3 px-4 font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50/60 dark:bg-indigo-950/30">
                  <div className="flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Church / Assembly</span>
                  </div>
                </th>
                <th className="py-3 px-4">Decision</th>
                <th className="py-3 px-4">Where Won / Lives</th>
                <th className="py-3 px-4">Soul Winner</th>
                <th className="py-3 px-4">Follow-Up</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
              {paginatedRecords.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No soul records matching the current filters.
                  </td>
                </tr>
              ) : (
                paginatedRecords.map(r => {
                  const churchInfo = getChurchInfo(r);

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
                          {r.phone && (
                            <button
                              type="button"
                              onClick={() => setMessageModalRecord(r)}
                              className="p-1 rounded-md bg-emerald-500/10 hover:bg-emerald-500/25 text-emerald-600 dark:text-emerald-400 transition-colors cursor-pointer flex items-center gap-1"
                              title="Send WhatsApp or SMS verification message"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Church (Dedicated Column) */}
                      <td className="py-3 px-4 bg-indigo-50/20 dark:bg-indigo-950/10">
                        <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                          <span>{churchInfo.name}</span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300">
                            {churchInfo.groupName}
                          </span>
                          {churchInfo.code && (
                            <span className="text-[9px] font-mono text-slate-400">
                              {churchInfo.code}
                            </span>
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

                      {/* Location: Where Won & Lives */}
                      <td className="py-3 px-4">
                        <div className="flex flex-col gap-0.5">
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
                        {r.winnerCell && (
                          <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                            <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                              {r.winnerCell}
                            </span>
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
              const churchInfo = getChurchInfo(r);
              const waLink = r.phone
                ? getWhatsAppLink({
                    phone: r.phone,
                    firstName: r.firstName,
                    lastName: r.lastName,
                    decisionType: r.decisionType,
                    centreName: churchInfo.name,
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
                        {r.gender}, {r.ageBracket} · {churchInfo.name}
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

                  {/* Church Badge - Prominent */}
                  <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-indigo-50/90 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900/40 text-xs font-bold text-indigo-900 dark:text-indigo-200">
                    <div className="flex items-center gap-1.5 truncate">
                      <Building2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                      <span className="truncate">Church: {churchInfo.name}</span>
                    </div>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shrink-0 shadow-2xs">
                      {churchInfo.groupName}
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
                    {r.phone && (
                      <button
                        type="button"
                        onClick={() => setMessageModalRecord(r)}
                        className="flex-1 py-1.5 px-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>Message / Verify</span>
                      </button>
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
      )}

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
                  {selectedRecord.phone && getWhatsAppLink({
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
                  {selectedRecord.residentialAddress || selectedRecord.residentialDistrict || 'No street recorded'}
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
                        {selectedRecord.winnerCell}
                      </span>
                    )}
                    {selectedRecord.winnerPcf && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
                        {selectedRecord.winnerPcf}
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

      {/* Instant Verification & Pastoral Messaging Modal */}
      <VerificationMessageModal
        isOpen={!!messageModalRecord}
        onClose={() => setMessageModalRecord(null)}
        record={messageModalRecord}
        userRole={userRole}
        onSuccessToast={onSuccessToast}
      />
    </div>
  );
};
