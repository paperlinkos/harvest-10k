import {
  Campaign,
  AreaCouncil,
  Centre,
  SoulRecord,
  Batch,
  DashboardStats,
  CentreStanding,
  HourlyTrendPoint,
  DailyCumulativePoint,
  DecisionBreakdown,
  DemographicSplit,
  AreaCouncilStats,
  FollowUpFunnelStats,
  LeaderboardEntry,
  LeaderboardPeriod,
  TickerSubmission,
  AuditLogEntry,
  SubmissionAnomaly,
  DecisionType,
  Gender,
  AgeBracket,
  FollowUpStatus,
  RecordStatus,
  UserRole,
  CachedAppState,
  OfflineQueueItem,
  CampaignSessionTimer,
  SmsLogEntry,
  TestimonyMediaItem,
  MediaType,
  ResidentialAreaStats,
  ResidentialDistrictCluster,
  OutreachVsResidentialPoint,
  SoulWinnerProfile,
  SoulWinnerSummary,
  PcfLeaderboardEntry,
  CellLeaderboardEntry,
} from '../types';
import { playDingSound, playCelebrationSound } from '../utils/audioUtils';
import {
  LOCALITIES,
  WARDS,
  AREA_COUNCILS,
  AreaCouncilCode,
  Locality,
  localitiesFor,
  wardsFor,
  areaCouncilOf,
} from '../data/fctLocations';
import { validateAndNormalizeNigerianPhone, formatNigerianPhone } from '../utils/phoneUtils';
import { formatDateWAT, formatTimeWAT, formatDateTimeWAT } from '../utils/localeUtils';
import {
  saveQueuedItemToDB,
  getQueuedItemsFromDB,
  removeQueuedItemFromDB,
  clearAllQueuedItemsFromDB,
} from '../utils/indexedDB';
import {
  saveMediaBlobToDB,
  getMediaBlobFromDB,
  saveMediaMetaToDB,
  getMediaMetaFromDB,
  deleteMediaFromDB,
} from '../utils/mediaDB';
import { firebaseSync } from './firebaseSync';

export interface SyncHistoryEntry {
  id: string;
  timestamp: string;
  type: 'manual' | 'auto';
  success: boolean;
  recordCount: number;
  message: string;
}

// ==========================================
// ABUJA FCT AREA COUNCILS (6 COUNCILS)
// ==========================================
export const INITIAL_AREA_COUNCILS: AreaCouncil[] = [
  { id: 'amac', name: 'Abuja Municipal (AMAC)', code: 'AMAC', target: 5000 },
  { id: 'bwari', name: 'Bwari', code: 'BWR', target: 1500 },
  { id: 'gwagwalada', name: 'Gwagwalada', code: 'GWG', target: 1200 },
  { id: 'kuje', name: 'Kuje', code: 'KUJ', target: 1000 },
  { id: 'kwali', name: 'Kwali', code: 'KWL', target: 800 },
  { id: 'abaji', name: 'Abaji', code: 'ABJ', target: 500 },
];

// Compatibility alias
export const INITIAL_REGIONS = INITIAL_AREA_COUNCILS;

// ==========================================
// 14 ABUJA COLLATION CENTRES
// ==========================================
export const INITIAL_CENTRES: Centre[] = [
  {
    id: 'cnt-amac-01',
    code: 'AMAC-01',
    name: 'Garki Centre',
    areaCouncilId: 'amac',
    regionId: 'amac',
    areaCouncilCode: 'AMAC',
    ward: 'Garki',
    locality: 'Garki I',
    venue: 'Garki Area 1 / Area 11 Collation Hub',
    coordinatorName: 'Pastor Emmanuel Adeyemi',
    contactPhone: '+234 803 451 9021',
    target: 1100,
    active: true,
  },
  {
    id: 'cnt-amac-02',
    code: 'AMAC-02',
    name: 'Wuse II Centre',
    areaCouncilId: 'amac',
    regionId: 'amac',
    areaCouncilCode: 'AMAC',
    ward: 'Wuse',
    locality: 'Wuse II',
    venue: 'Banex / Aminu Kano Crescent Hub',
    coordinatorName: 'Rev. Chinedu Okafor',
    contactPhone: '+234 806 332 1089',
    target: 1000,
    active: true,
  },
  {
    id: 'cnt-amac-03',
    code: 'AMAC-03',
    name: 'Maitama Centre',
    areaCouncilId: 'amac',
    regionId: 'amac',
    areaCouncilCode: 'AMAC',
    ward: 'City Centre',
    locality: 'Maitama',
    venue: 'Maitama Farmers Market Hub',
    coordinatorName: 'Pastor Blessing Danjuma',
    contactPhone: '+234 703 881 4055',
    target: 800,
    active: true,
  },
  {
    id: 'cnt-amac-04',
    code: 'AMAC-04',
    name: 'Asokoro Centre',
    areaCouncilId: 'amac',
    regionId: 'amac',
    areaCouncilCode: 'AMAC',
    ward: 'Garki',
    locality: 'Asokoro',
    venue: 'Asokoro Extension / Guzape Junction',
    coordinatorName: 'Evangelist Funmilayo Bello',
    contactPhone: '+234 813 904 2217',
    target: 700,
    active: true,
  },
  {
    id: 'cnt-amac-05',
    code: 'AMAC-05',
    name: 'Gwarinpa Centre',
    areaCouncilId: 'amac',
    regionId: 'amac',
    areaCouncilCode: 'AMAC',
    ward: 'Gwarinpa',
    locality: 'Gwarinpa',
    venue: '1st & 3rd Avenue Collation Point',
    coordinatorName: 'Deacon Ifeanyi Eze',
    contactPhone: '+234 901 773 8920',
    target: 800,
    active: true,
  },
  {
    id: 'cnt-amac-06',
    code: 'AMAC-06',
    name: 'Lugbe Centre',
    areaCouncilId: 'amac',
    regionId: 'amac',
    areaCouncilCode: 'AMAC',
    ward: 'Kabusa',
    locality: 'Lugbe',
    venue: 'Federal Housing / Airport Road Collation',
    coordinatorName: 'Pastor Joshua Idoko',
    contactPhone: '+234 912 605 3341',
    target: 600,
    active: true,
  },
  {
    id: 'cnt-bwr-01',
    code: 'BWR-01',
    name: 'Kubwa Centre',
    areaCouncilId: 'bwari',
    regionId: 'bwari',
    areaCouncilCode: 'BWARI',
    ward: 'Kubwa',
    locality: 'Kubwa',
    venue: 'Kubwa Phase 4 / NYSC Junction',
    coordinatorName: 'Rev. Samuel Bitrus',
    contactPhone: '+234 803 219 8840',
    target: 700,
    active: true,
  },
  {
    id: 'cnt-bwr-02',
    code: 'BWR-02',
    name: 'Dutse Alhaji Centre',
    areaCouncilId: 'bwari',
    regionId: 'bwari',
    areaCouncilCode: 'BWARI',
    ward: 'Dutsen Alhaji',
    locality: 'Dutse-Alhaji',
    venue: 'Dutse Alhaji Market Collation Hub',
    coordinatorName: 'Pastor Amina Musa',
    contactPhone: '+234 806 512 7639',
    target: 450,
    active: true,
  },
  {
    id: 'cnt-bwr-03',
    code: 'BWR-03',
    name: 'Bwari Central Centre',
    areaCouncilId: 'bwari',
    regionId: 'bwari',
    areaCouncilCode: 'BWARI',
    ward: 'Bwari Central',
    locality: 'Bwari Town',
    venue: 'Bwari Central Market Collation',
    coordinatorName: 'Evangelist Bako Shekwolo',
    contactPhone: '+234 703 145 9902',
    target: 350,
    active: true,
  },
  {
    id: 'cnt-gwg-01',
    code: 'GWG-01',
    name: 'Gwagwalada Central Centre',
    areaCouncilId: 'gwagwalada',
    regionId: 'gwagwalada',
    areaCouncilCode: 'GWAGWALADA',
    ward: 'Gwagwalada Central',
    locality: 'Gwagwalada Town',
    venue: 'Gwagwalada Park Collation Hub',
    coordinatorName: 'Pastor Oche Idoko',
    contactPhone: '+234 813 772 4491',
    target: 700,
    active: true,
  },
  {
    id: 'cnt-gwg-02',
    code: 'GWG-02',
    name: 'University/Dobi Centre',
    areaCouncilId: 'gwagwalada',
    regionId: 'gwagwalada',
    areaCouncilCode: 'GWAGWALADA',
    ward: 'Gwako',
    locality: 'University of Abuja',
    venue: 'UniAbuja Main Gate / Dobi Area',
    coordinatorName: 'Sister Ngozi Chukwuma',
    contactPhone: '+234 901 228 5543',
    target: 500,
    active: true,
  },
  {
    id: 'cnt-kuj-01',
    code: 'KUJ-01',
    name: 'Kuje Central Centre',
    areaCouncilId: 'kuje',
    regionId: 'kuje',
    areaCouncilCode: 'KUJE',
    ward: 'Kuje Central',
    locality: 'Kuje Town',
    venue: 'Kuje Forest Market Collation',
    coordinatorName: 'Rev. Ayuba Gwatana',
    contactPhone: '+234 912 884 1029',
    target: 1000,
    active: true,
  },
  {
    id: 'cnt-kwl-01',
    code: 'KWL-01',
    name: 'Kwali Central Centre',
    areaCouncilId: 'kwali',
    regionId: 'kwali',
    areaCouncilCode: 'KWALI',
    ward: 'Kwali Central',
    locality: 'Kwali Town',
    venue: 'Kwali Central Town Hall Collation',
    coordinatorName: 'Pastor Danjuma Sani',
    contactPhone: '+234 803 667 3120',
    target: 800,
    active: true,
  },
  {
    id: 'cnt-abj-01',
    code: 'ABJ-01',
    name: 'Abaji Central Centre',
    areaCouncilId: 'abaji',
    regionId: 'abaji',
    areaCouncilCode: 'ABAJI',
    ward: 'Abaji Central',
    locality: 'Abaji Town',
    venue: 'Abaji Roundabout Collation Post',
    coordinatorName: 'Evangelist Utibe Bassey',
    contactPhone: '+234 806 910 4452',
    target: 500,
    active: true,
  },
];

// ==========================================
// CAMPAIGN DEFINITION (ABUJA, FCT)
// ==========================================
export const INITIAL_CAMPAIGN: Campaign = {
  id: 'camp-harvest-10k-fct-2026',
  name: 'Harvest 10K - FCT Abuja Campaign',
  target: 10000,
  startDate: new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString(),
  endDate: new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString(),
  verse: 'The harvest truly is great, but the labourers are few: pray ye therefore the Lord of the harvest. — Luke 10:2',
  verificationRequired: true,
  hideIndividualLeaderboard: false,
  announcement: 'Abuja Collation Live: AMAC, Bwari, Gwagwalada, Kuje, Kwali, and Abaji reporting.',
};

// ==========================================
// DIVERSE NIGERIAN SEEDING ARRAYS
// ==========================================
const FIRST_NAMES_MALE = [
  'Emeka', 'Olumide', 'Ibrahim', 'Chukwuma', 'Babatunde', 'Danjuma', 'Ifeanyi', 'Bello',
  'Oche', 'Shekwolo', 'Adebayo', 'Musa', 'Obinna', 'Kayode', 'Bitrus', 'Okon',
  'Joshua', 'Samuel', 'David', 'Emmanuel', 'Peter', 'Daniel', 'Kalu', 'Audu',
  'Ayuba', 'Bassey', 'Chinonso', 'Tayo', 'Sani', 'Nnamdi',
];

const FIRST_NAMES_FEMALE = [
  'Amina', 'Chiamaka', 'Funmilayo', 'Maryam', 'Ngozi', 'Zainab', 'Folake', 'Ochanya',
  'Blessing', 'Fatima', 'Nkechi', 'Titilayo', 'Ene', 'Aisha', 'Hadiza', 'Damilola',
  'Amaka', 'Shazhimi', 'Grace', 'Faith', 'Esther', 'Mercy', 'Ruth', 'Itoro',
  'Ijeoma', 'Ladi', 'Utibe', 'Aniefiok', 'Kure', 'Oluwaseun',
];

const LAST_NAMES = [
  'Bello', 'Eze', 'Adeyemi', 'Okon', 'Audu', 'Nnamdi', 'Garba', 'Idoko',
  'Adeleke', 'Musa', 'Chukwu', 'Tanko', 'Oche', 'Bako', 'Abubakar', 'Balogun',
  'Okafor', 'Danladi', 'Danjuma', 'Sadiq', 'Yakubu', 'Ibrahim', 'Aliyu', 'Mohammed',
  'Oladipo', 'Nwosu', 'Ogbonna', 'Akpan', 'Bassey', 'Edet', 'Gana', 'Shekwo',
];

const COMMUNITIES_BY_CENTRE: Record<string, string[]> = {
  'cnt-amac-01': ['Garki Area 1', 'Garki Area 11', 'Area 3 Shopping Centre', 'Garki Village', 'Area 8 Market'],
  'cnt-amac-02': ['Wuse II Aminu Kano', 'Banex Plaza Area', 'Wuse Zone 4', 'Wuse Market Circle', 'Wuse Zone 6'],
  'cnt-amac-03': ['Maitama High Street', 'Maitama Farmers Market', 'IBB Way Junction', 'Maitama Roundabout'],
  'cnt-amac-04': ['Asokoro Extension', 'Guzape Junction', 'Yakubu Gowon Crescent', 'Asokoro AYA'],
  'cnt-amac-05': ['Gwarinpa 1st Avenue', 'Gwarinpa 3rd Avenue', 'Setraco Gate', 'Gwarinpa Estate Central'],
  'cnt-amac-06': ['Federal Housing Lugbe', 'Lugbe Airport Road', 'Lugbe Car Wash', 'Total Junction Lugbe'],
  'cnt-bwr-01': ['Kubwa Phase 4', 'Kubwa Village', 'NYSC Junction Kubwa', 'Federal Housing Kubwa'],
  'cnt-bwr-02': ['Dutse Alhaji Market', 'Dutse Bokuma', 'Dutse Pepple', 'Sultan Beach Dutse'],
  'cnt-bwr-03': ['Bwari Central Market', 'Law School Junction Bwari', 'Ushafa Pottery Village', 'Bwari Town'],
  'cnt-gwg-01': ['Gwagwalada Central Park', 'Specialist Hospital Gate', 'Gwagwalada Main Market', 'Kutunku'],
  'cnt-gwg-02': ['UniAbuja Permanent Site', 'UniAbuja Mini Campus', 'Dobi Junction', 'Paiko Kore Road'],
  'cnt-kuj-01': ['Kuje Forest Market', 'Kuje Secretariat Road', 'Chibiri Village', 'Kuje Central Junction'],
  'cnt-kwl-01': ['Kwali Town Hall', 'Kwali Central Market', 'Yangoji Junction', 'Kilometre 45 Lokoja Road'],
  'cnt-abj-01': ['Abaji Roundabout', 'Abaji Central Market', 'Abaji Motor Park', 'Nasarawa Border Road'],
};

const FOLLOW_UP_CHURCHES = [
  'Dunamis International Gospel Centre (Glory Dome)',
  'Living Faith Church (Winners Chapel Durumi / Jahi)',
  'The Redeemed Christian Church of God (RCCG Central Parish)',
  'House on the Rock (The Refuge Abuja)',
  'Family Worship Centre (FWC Wuye)',
  'ECWA Wuse II',
  'Commonwealth of Zion Assembly (COZA Guzape)',
  'Catholic Archdiocese of Abuja (Our Lady Queen of Nigeria)',
  'Mountain of Fire and Miracles Ministries (MFM Utako)',
  'Assemblies of God Central Hub',
];

export const CHRIST_EMBASSY_PCFS = [
  'Haven PCF',
  'Kings PCF',
  'Dunamis PCF',
  'Triumph PCF',
  'Glory PCF',
  'Shalom PCF',
  'Graceland PCF',
  'Achievers PCF',
];

export const CHRIST_EMBASSY_CELLS = [
  'Grace Cell',
  'Royalty Cell',
  'Charis Cell',
  'Doxa Cell',
  'Fruitful Cell',
  'Dominion Cell',
  'Victory Cell',
  'Agape Cell',
  'Light Cell',
  'Wisdom Cell',
  'Praise Cell',
  'Radiant Cell',
];

export interface SeedSoulWinner {
  name: string;
  phone: string;
  cell: string;
  pcf: string;
  church: string;
}

export const SOUL_WINNER_DIRECTORY: SeedSoulWinner[] = [
  { name: 'Evangelist Barnabas Danjuma', phone: '+2348031122334', cell: 'Grace Cell', pcf: 'Haven PCF', church: 'Durumi Central Hub' },
  { name: 'Sister Chiamaka Nnamdi', phone: '+2348065127639', cell: 'Royalty Cell', pcf: 'Kings PCF', church: 'Kubwa Centre' },
  { name: 'Brother Olumide Adeyemi', phone: '+2347039988776', cell: 'Charis Cell', pcf: 'Dunamis PCF', church: 'Lugbe Airport Road Centre' },
  { name: 'Deacon Ibrahim Garba', phone: '+2348134455667', cell: 'Doxa Cell', pcf: 'Triumph PCF', church: 'Gwarinpa Centre' },
  { name: 'Sister Blessing Okon', phone: '+2349012233445', cell: 'Fruitful Cell', pcf: 'Haven PCF', church: 'Wuse Centre' },
  { name: 'Minister Ifeanyi Chukwu', phone: '+2349123344556', cell: 'Victory Cell', pcf: 'Glory PCF', church: 'Garki Centre' },
  { name: 'Brother Bitrus Tanko', phone: '+2348024455667', cell: 'Agape Cell', pcf: 'Shalom PCF', church: 'Bwari Centre' },
  { name: 'Sister Funmilayo Adeleke', phone: '+2348055566778', cell: 'Light Cell', pcf: 'Kings PCF', church: 'Maitama Centre' },
  { name: 'Elder Joshua Idoko', phone: '+2348146677889', cell: 'Wisdom Cell', pcf: 'Dunamis PCF', church: 'Gwagwalada Centre' },
  { name: 'Sister Maryam Bako', phone: '+2347087788990', cell: 'Praise Cell', pcf: 'Haven PCF', church: 'Asokoro Centre' },
  { name: 'Brother Sunday Oche', phone: '+2348188899001', cell: 'Dominion Cell', pcf: 'Triumph PCF', church: 'Kuje Centre' },
  { name: 'Evangelist Amina Bello', phone: '+2348039900112', cell: 'Radiant Cell', pcf: 'Glory PCF', church: 'Kwali Centre' },
];

const SOUL_WINNERS = SOUL_WINNER_DIRECTORY.map(w => w.name);

const NIGERIAN_PHONE_PREFIXES = ['803', '806', '703', '813', '901', '912', '802', '805', '814', '708', '818'];

function generateRandomNigerianPhone(): string {
  const prefix = NIGERIAN_PHONE_PREFIXES[Math.floor(Math.random() * NIGERIAN_PHONE_PREFIXES.length)];
  const remaining = Math.floor(1000000 + Math.random() * 9000000).toString();
  return `+234${prefix}${remaining}`;
}

export const SOUL_WINNER_PROFILE_STORAGE_KEY = 'harvest10k_soul_winner_profile';
export const REGISTERED_WINNERS_STORAGE_KEY = 'harvest10k_registered_soul_winners_v2';

export const DEFAULT_SOUL_WINNER_PROFILE: SoulWinnerProfile = {
  id: 'winner-profile-01',
  fullName: 'Evangelist Barnabas Danjuma',
  phone: '+2348031122334',
  email: 'barnabas.danjuma@christembassy.org',
  cellName: 'Grace Cell',
  pcfName: 'Haven PCF',
  churchCentreId: 'cnt-durumi-01',
  churchName: 'Durumi Central Hub',
  roleTitle: 'Evangelist / Cell Leader',
  registeredAt: '2026-09-14T08:00:00.000Z',
};

export class DataService {
  private campaign: Campaign = { ...INITIAL_CAMPAIGN };
  private areaCouncils: AreaCouncil[] = [...INITIAL_AREA_COUNCILS];
  private centres: Centre[] = [...INITIAL_CENTRES];
  private soulRecords: SoulRecord[] = [];
  private batches: Batch[] = [];
  private tickerItems: TickerSubmission[] = [];
  private auditLogs: AuditLogEntry[] = [];
  private subscribers: Set<() => void> = new Set();
  private simulationTimer: ReturnType<typeof setTimeout> | null = null;
  private isSimulating: boolean = false;
  private simulationSpeed: 'slow' | 'normal' | 'fast' = 'normal';
  private syncHistory: SyncHistoryEntry[] = [
    {
      id: 'sync-hist-1',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      type: 'auto',
      success: true,
      recordCount: 14,
      message: 'Automatic background synchronization completed successfully across 6 Area Councils.',
    },
    {
      id: 'sync-hist-2',
      timestamp: new Date(Date.now() - 18000000).toISOString(),
      type: 'manual',
      success: true,
      recordCount: 45,
      message: 'Manual offline batch flush completed successfully.',
    },
  ];
  private lastFlashedCentreId: string | null = null;
  private flashTimeout: ReturnType<typeof setTimeout> | null = null;
  private offlineQueueItems: OfflineQueueItem[] = [];
  private smsLogs: SmsLogEntry[] = [];
  private milestoneCelebrationSubscribers: Set<(milestone: number) => void> = new Set();
  private testimonies: TestimonyMediaItem[] = [];
  private soulWinnerProfile: SoulWinnerProfile = this.loadSoulWinnerProfile();

  private loadSoulWinnerProfile(): SoulWinnerProfile {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const stored = localStorage.getItem(SOUL_WINNER_PROFILE_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed && parsed.fullName && parsed.cellName && parsed.pcfName) {
            return parsed;
          }
        }
      }
    } catch (e) {
      console.warn('[DataService] Error loading soul winner profile from localStorage:', e);
    }
    return { ...DEFAULT_SOUL_WINNER_PROFILE };
  }

  public getSoulWinnerProfile(): SoulWinnerProfile {
    return { ...this.soulWinnerProfile };
  }

  public hasRegisteredSoulWinner(): boolean {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return !!localStorage.getItem(SOUL_WINNER_PROFILE_STORAGE_KEY);
      }
    } catch {
      // ignore
    }
    return false;
  }

  private customSoulWinners: SoulWinnerProfile[] = this.loadCustomSoulWinners();

  private loadCustomSoulWinners(): SoulWinnerProfile[] {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const stored = localStorage.getItem(REGISTERED_WINNERS_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            return parsed;
          }
        }
      }
    } catch (e) {
      console.warn('[DataService] Error loading custom soul winners:', e);
    }
    return [];
  }

  private persistCustomSoulWinners(): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(REGISTERED_WINNERS_STORAGE_KEY, JSON.stringify(this.customSoulWinners));
      }
    } catch (e) {
      console.warn('[DataService] Error persisting custom soul winners:', e);
    }
  }

  public registerSoulWinner(profile: Partial<SoulWinnerProfile> & { fullName: string; phone: string; cellName: string; pcfName: string }): SoulWinnerProfile {
    const newProfile: SoulWinnerProfile = {
      id: profile.id || `winner-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      fullName: profile.fullName.trim(),
      phone: profile.phone.trim(),
      email: profile.email?.trim() || '',
      cellName: profile.cellName.trim(),
      pcfName: profile.pcfName.trim(),
      churchCentreId: profile.churchCentreId || 'cnt-durumi-01',
      churchName: profile.churchName?.trim() || 'Durumi Central Hub',
      roleTitle: profile.roleTitle?.trim() || 'Soul Winner / Cell Member',
      registeredAt: profile.registeredAt || new Date().toISOString(),
    };

    const idx = this.customSoulWinners.findIndex(w => 
      w.id === newProfile.id || 
      w.fullName.toLowerCase() === newProfile.fullName.toLowerCase() ||
      (w.phone && w.phone === newProfile.phone)
    );
    if (idx >= 0) {
      this.customSoulWinners[idx] = newProfile;
    } else {
      this.customSoulWinners.unshift(newProfile);
    }

    this.persistCustomSoulWinners();

    // Sync to Cloud Firestore
    firebaseSync.syncSoulWinner(newProfile).catch(err => {
      console.warn('[DataService] Soul Winner Firestore sync deferred:', err);
    });

    this.notifySubscribers();
    return newProfile;
  }

  public deleteCustomSoulWinner(idOrName: string): boolean {
    const initialLen = this.customSoulWinners.length;
    const target = idOrName.trim().toLowerCase();
    this.customSoulWinners = this.customSoulWinners.filter(w => 
      w.id !== idOrName && w.fullName.trim().toLowerCase() !== target
    );
    if (this.customSoulWinners.length !== initialLen) {
      this.persistCustomSoulWinners();
      this.notifySubscribers();
      return true;
    }
    return false;
  }

  public getSoulsWonByWinner(nameOrPhone: string): SoulRecord[] {
    if (!nameOrPhone) return [];
    const target = nameOrPhone.trim().toLowerCase();
    return this.soulRecords
      .filter(r => !r.isDeleted && (
        (r.wonByName && r.wonByName.trim().toLowerCase() === target) ||
        (r.winnerPhone && r.winnerPhone.trim() === nameOrPhone.trim())
      ))
      .sort((a, b) => new Date(b.wonAt).getTime() - new Date(a.wonAt).getTime());
  }

  public getRegisteredSoulWinners(): SoulWinnerSummary[] {
    const winnerMap = new Map<string, {
      id: string;
      fullName: string;
      phone: string;
      email?: string;
      cellName: string;
      pcfName: string;
      churchCentreId?: string;
      churchName?: string;
      roleTitle?: string;
      registeredAt?: string;
    }>();

    // 1. Seed Directory
    SOUL_WINNER_DIRECTORY.forEach((sw, idx) => {
      const key = sw.name.trim().toLowerCase();
      winnerMap.set(key, {
        id: `sw-seed-${idx + 1}`,
        fullName: sw.name,
        phone: sw.phone,
        cellName: sw.cell,
        pcfName: sw.pcf,
        churchName: sw.church,
        roleTitle: 'Soul Winner / Cell Member',
        registeredAt: '2026-09-14T08:00:00.000Z',
      });
    });

    // 2. Custom Registered Soul Winners
    this.customSoulWinners.forEach(cw => {
      const key = cw.fullName.trim().toLowerCase();
      winnerMap.set(key, {
        id: cw.id,
        fullName: cw.fullName,
        phone: cw.phone,
        email: cw.email,
        cellName: cw.cellName,
        pcfName: cw.pcfName,
        churchCentreId: cw.churchCentreId,
        churchName: cw.churchName,
        roleTitle: cw.roleTitle,
        registeredAt: cw.registeredAt,
      });
    });

    // 3. Current User Local Profile
    if (this.soulWinnerProfile && this.soulWinnerProfile.fullName) {
      const key = this.soulWinnerProfile.fullName.trim().toLowerCase();
      const existing = winnerMap.get(key);
      winnerMap.set(key, {
        id: this.soulWinnerProfile.id || existing?.id || 'winner-active-profile',
        fullName: this.soulWinnerProfile.fullName,
        phone: this.soulWinnerProfile.phone || existing?.phone || '+2348031122334',
        email: this.soulWinnerProfile.email || existing?.email,
        cellName: this.soulWinnerProfile.cellName || existing?.cellName || 'Grace Cell',
        pcfName: this.soulWinnerProfile.pcfName || existing?.pcfName || 'Haven PCF',
        churchCentreId: this.soulWinnerProfile.churchCentreId || existing?.churchCentreId,
        churchName: this.soulWinnerProfile.churchName || existing?.churchName || 'Durumi Central Hub',
        roleTitle: this.soulWinnerProfile.roleTitle || existing?.roleTitle || 'Active Field Evangelist',
        registeredAt: this.soulWinnerProfile.registeredAt || existing?.registeredAt || '2026-09-14T08:00:00.000Z',
      });
    }

    // 4. Discover any winner from SoulRecords not yet registered
    this.soulRecords.forEach(r => {
      if (!r.isDeleted && r.wonByName && r.wonByName.trim()) {
        const key = r.wonByName.trim().toLowerCase();
        if (!winnerMap.has(key)) {
          winnerMap.set(key, {
            id: `sw-record-${key.replace(/\s+/g, '-')}`,
            fullName: r.wonByName.trim(),
            phone: r.winnerPhone || '',
            cellName: r.winnerCell || 'Grace Cell',
            pcfName: r.winnerPcf || 'Haven PCF',
            churchName: r.winnerChurch || 'Durumi Central Hub',
            roleTitle: 'Field Soul Winner',
            registeredAt: r.wonAt,
          });
        }
      }
    });

    // 5. Discover any winner from Batches not yet registered
    this.batches.forEach(b => {
      if (!b.isDeleted && b.submittedByName && b.submittedByName.trim()) {
        const key = b.submittedByName.trim().toLowerCase();
        if (!winnerMap.has(key)) {
          winnerMap.set(key, {
            id: `sw-batch-${key.replace(/\s+/g, '-')}`,
            fullName: b.submittedByName.trim(),
            phone: b.winnerPhone || '',
            cellName: b.winnerCell || 'Grace Cell',
            pcfName: b.winnerPcf || 'Haven PCF',
            churchName: 'Abuja Field Ministry Hub',
            roleTitle: 'Field Coordinator / Team Leader',
            registeredAt: b.timestamp,
          });
        }
      }
    });

    // Now build summaries with exact souls attributed
    const summaries: SoulWinnerSummary[] = [];

    winnerMap.forEach((winner, key) => {
      const attributedRecords = this.soulRecords.filter(r => 
        !r.isDeleted && (
          (r.wonByName && r.wonByName.trim().toLowerCase() === key) ||
          (winner.phone && r.winnerPhone && r.winnerPhone.trim() === winner.phone.trim())
        )
      );

      const attributedBatches = this.batches.filter(b => 
        !b.isDeleted && b.submittedByName && b.submittedByName.trim().toLowerCase() === key
      );

      const recordSoulsCount = attributedRecords.length;
      let batchSoulsCount = 0;
      let batchNewConverts = 0;
      let batchRededications = 0;
      let batchReturnees = 0;
      let batchVerified = 0;
      let batchPending = 0;

      attributedBatches.forEach(b => {
        batchSoulsCount += b.count;
        batchNewConverts += b.newConverts || 0;
        batchRededications += b.rededications || 0;
        batchReturnees += b.returnees || 0;
        if (b.status === 'verified') batchVerified += b.count;
        else batchPending += b.count;
      });

      let recNewConverts = 0;
      let recRededications = 0;
      let recReturnees = 0;
      let recVerified = 0;
      let recPending = 0;

      const outreachSpotCounts: Record<string, number> = {};
      const residentialDistrictCounts: Record<string, number> = {};

      attributedRecords.forEach(r => {
        if (r.decisionType === 'new_convert') recNewConverts++;
        else if (r.decisionType === 'rededication') recRededications++;
        else recReturnees++;

        if (r.status === 'verified') recVerified++;
        else recPending++;

        if (r.outreachSpot) {
          outreachSpotCounts[r.outreachSpot] = (outreachSpotCounts[r.outreachSpot] || 0) + 1;
        }
        if (r.residentialDistrict) {
          residentialDistrictCounts[r.residentialDistrict] = (residentialDistrictCounts[r.residentialDistrict] || 0) + 1;
        }
      });

      const totalSoulsWon = recordSoulsCount + batchSoulsCount;
      const newConvertsCount = recNewConverts + batchNewConverts;
      const rededicationsCount = recRededications + batchRededications;
      const returneesCount = recReturnees + batchReturnees;
      const verifiedCount = recVerified + batchVerified;
      const pendingCount = recPending + batchPending;

      const sortedSouls = [...attributedRecords].sort(
        (a, b) => new Date(b.wonAt).getTime() - new Date(a.wonAt).getTime()
      );

      const firstSoulAt = sortedSouls.length > 0 ? sortedSouls[sortedSouls.length - 1].wonAt : undefined;
      const lastSoulAt = sortedSouls.length > 0 ? sortedSouls[0].wonAt : undefined;

      const primaryOutreachSpots = Object.entries(outreachSpotCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([name]) => name);

      const primaryResidentialDistricts = Object.entries(residentialDistrictCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([name]) => name);

      summaries.push({
        id: winner.id,
        fullName: winner.fullName,
        phone: winner.phone,
        email: winner.email,
        cellName: winner.cellName,
        pcfName: winner.pcfName,
        churchCentreId: winner.churchCentreId,
        churchName: winner.churchName,
        roleTitle: winner.roleTitle,
        registeredAt: winner.registeredAt,
        totalSoulsWon,
        recordSoulsCount,
        batchSoulsCount,
        newConvertsCount,
        rededicationsCount,
        returneesCount,
        verifiedCount,
        pendingCount,
        firstSoulAt,
        lastSoulAt,
        primaryOutreachSpots,
        primaryResidentialDistricts,
        souls: sortedSouls,
      });
    });

    return summaries.sort((a, b) => {
      if (b.totalSoulsWon !== a.totalSoulsWon) {
        return b.totalSoulsWon - a.totalSoulsWon;
      }
      return a.fullName.localeCompare(b.fullName);
    });
  }

  public saveSoulWinnerProfile(profile: SoulWinnerProfile): void {
    this.soulWinnerProfile = {
      ...profile,
      registeredAt: profile.registeredAt || new Date().toISOString(),
    };
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(SOUL_WINNER_PROFILE_STORAGE_KEY, JSON.stringify(this.soulWinnerProfile));
      }
    } catch (e) {
      console.warn('[DataService] Error saving soul winner profile to localStorage:', e);
    }
    this.notifySubscribers();
  }

  constructor() {
    this.seedInitialData();
    this.seedTestimonies();
    this.initOfflineQueue();
    this.initMediaDB();
    this.initFirebaseSync();
  }

  private initFirebaseSync() {
    try {
      // 1. Initial baseline sync if remote is fresh
      setTimeout(() => {
        firebaseSync.initialBulkSync(this.soulRecords, this.batches);
      }, 3000);

      // 2. Real-time Soul Records Listener
      firebaseSync.subscribeToSouls((remoteSouls) => {
        if (!remoteSouls || remoteSouls.length === 0) return;
        let hasNew = false;
        remoteSouls.forEach((remote) => {
          const idx = this.soulRecords.findIndex((r) => r.id === remote.id);
          if (idx >= 0) {
            this.soulRecords[idx] = { ...this.soulRecords[idx], ...remote };
          } else {
            this.soulRecords.unshift(remote);
            hasNew = true;
          }
        });
        if (hasNew) {
          this.notifySubscribers();
        }
      });

      // 3. Real-time Batches Listener
      firebaseSync.subscribeToBatches((remoteBatches) => {
        if (!remoteBatches || remoteBatches.length === 0) return;
        let hasNew = false;
        remoteBatches.forEach((rb) => {
          const idx = this.batches.findIndex((b) => b.id === rb.id);
          if (idx >= 0) {
            this.batches[idx] = { ...this.batches[idx], ...rb };
          } else {
            this.batches.unshift(rb);
            hasNew = true;
          }
        });
        if (hasNew) {
          this.notifySubscribers();
        }
      });

      // 4. Real-time Soul Winner Profiles Listener
      firebaseSync.subscribeToWinners((remoteWinners) => {
        if (!remoteWinners || remoteWinners.length === 0) return;
        let hasNew = false;
        remoteWinners.forEach((rw) => {
          const idx = this.customSoulWinners.findIndex((w) => w.id === rw.id);
          if (idx >= 0) {
            this.customSoulWinners[idx] = { ...this.customSoulWinners[idx], ...rw };
          } else {
            this.customSoulWinners.unshift(rw);
            hasNew = true;
          }
        });
        if (hasNew) {
          this.persistCustomSoulWinners();
          this.notifySubscribers();
        }
      });
    } catch (err) {
      console.warn('[DataService] Error connecting to Firebase real-time sync:', err);
    }
  }

  private async initMediaDB() {
    try {
      const persisted = await getMediaMetaFromDB();
      if (persisted && persisted.length > 0) {
        // Merge persisted items with existing seed items, avoiding duplicates
        const existingIds = new Set(this.testimonies.map(t => t.id));
        for (const item of persisted) {
          if (!existingIds.has(item.id)) {
            // Restore blob url if stored in blob DB
            const blob = await getMediaBlobFromDB(item.id);
            if (blob) {
              item.url = URL.createObjectURL(blob);
            }
            this.testimonies.unshift(item);
            existingIds.add(item.id);
          }
        }
        this.notifySubscribers();
      }
    } catch (err) {
      console.warn('[DataService] Error loading media from DB:', err);
    }
  }

  private async initOfflineQueue() {
    try {
      this.offlineQueueItems = await getQueuedItemsFromDB();
      this.notifySubscribers();
    } catch {
      // IndexedDB fallback initialized
    }
  }

  // --- Seed Initial Data ---
  private seedInitialData() {
    const now = Date.now();
    const twoDaysAgo = now - 2 * 24 * 3600 * 1000;

    let idCounter = 1;
    let batchCounter = 1;

    const knownExistingPhone = '+2348034519021';
    const knownExistingCentre = 'Garki Centre';

    // Seed realistic bulk batches across Abuja centres
    this.centres.forEach((centre, cIdx) => {
      const batchCountForCentre = Math.floor(Math.random() * 4) + 3;
      for (let b = 0; b < batchCountForCentre; b++) {
        const batchTime = new Date(twoDaysAgo + Math.random() * (now - twoDaysAgo));
        const total = Math.floor(Math.random() * 45) + 20;
        const newConverts = Math.round(total * (0.6 + Math.random() * 0.15));
        const rededications = Math.round((total - newConverts) * 0.7);
        const returnees = total - newConverts - rededications;

        const winnerObj = SOUL_WINNER_DIRECTORY[Math.floor(Math.random() * SOUL_WINNER_DIRECTORY.length)];
        this.batches.push({
          id: `batch-${batchCounter++}`,
          centreId: centre.id,
          submittedByName: winnerObj.name,
          winnerPhone: winnerObj.phone,
          winnerCell: winnerObj.cell,
          winnerPcf: winnerObj.pcf,
          sessionLabel: `Day ${Math.floor(Math.random() * 3) + 1} Street Outreach`,
          count: total,
          newConverts,
          rededications,
          returnees,
          status: 'verified',
          submittedAt: batchTime.toISOString(),
          note: `Evangelism drive across ${centre.name} coverage area.`,
        });
      }

      // Seed realistic individual convert records with Nigerian names
      const individualCount = Math.floor(Math.random() * 25) + 15;
      const councilCode = centre.areaCouncilCode || 'AMAC';
      const councilLocalities = localitiesFor(councilCode);
      const councilWards = wardsFor(councilCode);

      // Realistic pools for Convert Living Address and Outreach Spot
      const RESIDENTIAL_POOLS = [
        { district: 'Lugbe (Airport Road)', council: 'AMAC' as AreaCouncilCode, address: 'Flat 4, Block 8, Federal Housing Estate, Lugbe' },
        { district: 'Trademore / Airport Rd', council: 'AMAC' as AreaCouncilCode, address: 'Plot 12, Trademore Estate, Airport Road' },
        { district: 'Kubwa Phase 4', council: 'BWARI' as AreaCouncilCode, address: 'Plot 30, Phase 4, near PW Station, Kubwa' },
        { district: 'FHA Kubwa', council: 'BWARI' as AreaCouncilCode, address: 'FHA Kubwa, 2-2 Junction, Kubwa' },
        { district: 'Karu Site', council: 'AMAC' as AreaCouncilCode, address: 'Plot 22, Karu Site, near General Hospital' },
        { district: 'Nyanya', council: 'AMAC' as AreaCouncilCode, address: 'Block 4, Nyanya Checkpoint Quarters' },
        { district: 'Lokogoma', council: 'AMAC' as AreaCouncilCode, address: 'House 14, Sun City Estate, Lokogoma' },
        { district: 'Gwarinpa Estate', council: 'AMAC' as AreaCouncilCode, address: 'House 24, 3rd Avenue, Gwarinpa' },
        { district: 'Dutse-Alhaji', council: 'BWARI' as AreaCouncilCode, address: 'Behind Total Filling Station, Dutse Alhaji' },
        { district: 'Dawaki', council: 'BWARI' as AreaCouncilCode, address: 'Dawaki Modern Village, near Gwarinpa bridge' },
        { district: 'Gwagwalada Town', council: 'GWAGWALADA' as AreaCouncilCode, address: 'Plot 5, Kutunku Phase 1, Gwagwalada' },
        { district: 'UniAbuja Staff Qtrs', council: 'GWAGWALADA' as AreaCouncilCode, address: 'Staff Quarters, UniAbuja Road, Gwagwalada' },
        { district: 'Kuje Town', council: 'KUJE' as AreaCouncilCode, address: 'Plot 18, Kuchiyako Phase 2, Kuje' },
        { district: 'Pegi Kuje', council: 'KUJE' as AreaCouncilCode, address: 'Pegi Resettlement Zone, Kuje' },
        { district: 'Jabi / Utako', council: 'AMAC' as AreaCouncilCode, address: 'Plot 105, Obafemi Awolowo Way, Jabi' },
        { district: 'Garki Area 2', council: 'AMAC' as AreaCouncilCode, address: 'Block 15, Area 2, Garki' },
        { district: 'Wuse Zone 4', council: 'AMAC' as AreaCouncilCode, address: 'Suite 3, Wuse Zone 4' },
        { district: 'Bwari Central', council: 'BWARI' as AreaCouncilCode, address: 'Central Bwari, near Law School Gate' },
        { district: 'Kwali Central', council: 'KWALI' as AreaCouncilCode, address: 'Yangoji Junction, Kwali' },
        { district: 'Abaji Central', council: 'ABAJI' as AreaCouncilCode, address: 'Abaji Central, near River Gurara road' },
      ];

      const OUTREACH_SPOTS = [
        'Banex Plaza Pedestrian Walkway',
        'Berger Roundabout Motor Park',
        'Federal Secretariat Bus Terminal',
        'Kubwa Village Market Square',
        'Dutse Alhaji Bus Stop',
        'UniAbuja Main Campus Gate',
        'Garki Area 1 Shopping Plaza',
        'Jabi Lake Park Pedestrian Gate',
        'Maitama Farmers Market Junction',
        'Karu Site Market Walkway',
        'Nyanya Bridge Bus Stop',
        'Gwagwalada Central Park',
        'Kuje Town Hall Square',
        'Wuse 2 Aminu Kano Crescent',
      ];

      for (let i = 0; i < individualCount; i++) {
        const recordTime = new Date(twoDaysAgo + Math.random() * (now - twoDaysAgo));
        const isMale = Math.random() > 0.48;
        const firstName = isMale
          ? FIRST_NAMES_MALE[Math.floor(Math.random() * FIRST_NAMES_MALE.length)]
          : FIRST_NAMES_FEMALE[Math.floor(Math.random() * FIRST_NAMES_FEMALE.length)];
        const lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
        
        let localityObj = councilLocalities[Math.floor(Math.random() * councilLocalities.length)];
        let isCross = false;
        if (Math.random() < 0.10 && LOCALITIES.length > 0) {
          const randomLoc = LOCALITIES[Math.floor(Math.random() * LOCALITIES.length)];
          if (randomLoc.areaCouncil !== councilCode) {
            localityObj = randomLoc;
            isCross = true;
          }
        }
        const locality = localityObj ? localityObj.name : 'Abuja Central';
        const ward = councilWards[Math.floor(Math.random() * councilWards.length)];
        const phone = i === 0 && cIdx === 0 ? knownExistingPhone : generateRandomNigerianPhone();

        const resChoice = RESIDENTIAL_POOLS[Math.floor(Math.random() * RESIDENTIAL_POOLS.length)];
        const outreachSpot = OUTREACH_SPOTS[Math.floor(Math.random() * OUTREACH_SPOTS.length)];
        const winnerObj = SOUL_WINNER_DIRECTORY[Math.floor(Math.random() * SOUL_WINNER_DIRECTORY.length)];

        this.soulRecords.push({
          id: `soul-${idCounter++}`,
          centreId: centre.id,
          firstName,
          lastName,
          phone,
          gender: isMale ? 'male' : 'female',
          ageBracket: this.randomAgeBracket(),
          community: locality,
          locality,
          ward,
          isCrossCouncil: isCross,
          decisionType: this.randomDecision(),
          wonByName: winnerObj.name,
          winnerPhone: winnerObj.phone,
          winnerCell: winnerObj.cell,
          winnerPcf: winnerObj.pcf,
          winnerChurch: centre.name,
          wonAt: recordTime.toISOString(),
          followUpChurch: FOLLOW_UP_CHURCHES[Math.floor(Math.random() * FOLLOW_UP_CHURCHES.length)],
          followUpStatus: this.randomFollowUp(),
          consentGiven: true,
          notes: 'Received pastoral prayer and agreed to follow-up call.',
          status: 'verified',
          detailsPending: false,
          outreachSpot,
          residentialDistrict: resChoice.district,
          residentialAddress: resChoice.address,
          residentialAreaCouncil: resChoice.council,
        });
      }
    });

    // Seed realistic pending approval queue entries
    this.batches.push({
      id: `batch-pending-1`,
      centreId: 'cnt-amac-02',
      submittedByName: 'Evangelist Barnabas Danjuma',
      winnerPhone: '+2348031122334',
      winnerCell: 'Grace Cell',
      winnerPcf: 'Haven PCF',
      sessionLabel: 'Wuse Market Afternoon Blitz',
      count: 65,
      newConverts: 42,
      rededications: 16,
      returnees: 7,
      status: 'pending',
      submittedAt: new Date(now - 15 * 60000).toISOString(),
      note: 'Large crowd gathered around plaza pedestrian bridge.',
    });

    this.soulRecords.push({
      id: `soul-pending-1`,
      centreId: 'cnt-gwg-02',
      firstName: 'Ibrahim',
      lastName: 'Musa',
      phone: '+2348065127639',
      gender: 'male',
      ageBracket: 'youth',
      community: 'UniAbuja Main Gate',
      outreachSpot: 'UniAbuja Main Campus Gate',
      residentialDistrict: 'Gwagwalada Town',
      residentialAddress: 'Staff Quarters, Block C, UniAbuja Road',
      residentialAreaCouncil: 'GWAGWALADA',
      decisionType: 'new_convert',
      wonByName: 'Sister Chiamaka Nnamdi',
      winnerPhone: '+2348065127639',
      winnerCell: 'Royalty Cell',
      winnerPcf: 'Kings PCF',
      winnerChurch: 'Kubwa Centre',
      wonAt: new Date(now - 8 * 60000).toISOString(),
      followUpChurch: 'Dunamis International Gospel Centre (Glory Dome)',
      followUpStatus: 'not_started',
      consentGiven: true,
      notes: 'University student surrendered life to Christ during lunch blitz.',
      status: 'pending',
      detailsPending: false,
    });

    this.soulRecords.push({
      id: `soul-pending-2`,
      centreId: 'cnt-amac-01',
      firstName: 'Amina',
      lastName: 'Bello',
      phone: knownExistingPhone,
      gender: 'female',
      ageBracket: 'adult',
      community: 'Garki Area 1',
      outreachSpot: 'Garki Area 1 Shopping Plaza',
      residentialDistrict: 'Lugbe (Airport Road)',
      residentialAddress: 'Plot 14, Federal Housing Estate, Airport Road',
      residentialAreaCouncil: 'AMAC',
      decisionType: 'rededication',
      wonByName: 'Pastor Emmanuel Adeyemi',
      wonAt: new Date(now - 18 * 60000).toISOString(),
      followUpChurch: 'The Redeemed Christian Church of God (RCCG Central Parish)',
      followUpStatus: 'not_started',
      consentGiven: true,
      notes: 'Potential duplicate phone number detected across centres.',
      status: 'pending',
      detailsPending: false,
    });

    // Seed recent ticker items
    const recentBatches = [...this.batches]
      .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
      .slice(0, 10);

    this.tickerItems = recentBatches.map(b => {
      const c = this.centres.find(cnt => cnt.id === b.centreId);
      return {
        id: `tick-${b.id}`,
        centreName: c ? c.name : 'Abuja FCT Collation Hub',
        count: b.count,
        decisionBreakdown: {
          newConverts: b.newConverts,
          rededications: b.rededications,
          returnees: b.returnees,
        },
        winnerName: b.submittedByName,
        timestamp: b.submittedAt,
      };
    });

    // Seed initial Audit Logs with WAT timestamps
    this.seedAuditLogs(knownExistingPhone, knownExistingCentre);
  }

  private seedAuditLogs(knownPhone: string, knownCentre: string) {
    const now = Date.now();
    const minutesAgo = (m: number) => new Date(now - m * 60 * 1000).toISOString();
    const hoursAgo = (h: number) => new Date(now - h * 3600 * 1000).toISOString();

    this.auditLogs = [
      {
        id: 'audit-001',
        timestamp: minutesAgo(4),
        actorName: 'Rev. Emmanuel Adeyemi',
        actorRole: 'admin',
        action: 'UPDATE_CAMPAIGN',
        targetType: 'campaign',
        targetId: 'camp-harvest-10k-fct-2026',
        targetTitle: 'Harvest 10K - FCT Abuja Campaign',
        details: 'Configured campaign privacy policy: soul winners leaderboard visibility enabled across all 6 Area Councils.',
        changes: {
          hideIndividualLeaderboard: { from: false, to: false },
        },
      },
      {
        id: 'audit-002',
        timestamp: minutesAgo(12),
        actorName: 'Pastor Chinedu Okafor',
        actorRole: 'coordinator',
        action: 'APPROVE_BATCH',
        targetType: 'batch',
        targetId: 'batch-verified-104',
        targetTitle: 'Wuse Market Afternoon Blitz (65 souls)',
        centreName: 'Wuse II Centre',
        details: 'Verified and approved field collation batch of 65 converts from Banex / Aminu Kano axis.',
        changes: {
          status: { from: 'pending', to: 'verified' },
        },
      },
      {
        id: 'audit-003',
        timestamp: minutesAgo(28),
        actorName: 'Deacon Ifeanyi Eze',
        actorRole: 'coordinator',
        action: 'CREATE_RECORD',
        targetType: 'record',
        targetId: 'soul-782',
        targetTitle: 'Chiamaka Nnamdi (+234 803 451 9021)',
        centreName: 'Garki Centre',
        details: 'Recorded new convert with duplicate phone override: "Family member sharing primary household phone".',
        isAnomalyFlagged: true,
        metadata: {
          duplicateOverrideReason: 'Family member sharing primary household phone',
          duplicateMatchedWith: knownPhone,
        },
      },
      {
        id: 'audit-004',
        timestamp: hoursAgo(1.5),
        actorName: 'Admin FCT Secretariat',
        actorRole: 'admin',
        action: 'DELETE_RECORD',
        targetType: 'record',
        targetId: 'soul-del-test-1',
        targetTitle: 'Olumide Bello (+234 803 000 1122)',
        centreName: 'Garki Centre',
        details: 'Soft-deleted duplicate test record created during volunteer rehearsal. Record archived.',
        changes: {
          isDeleted: { from: false, to: true },
          deleteReason: { from: null, to: 'Duplicate test entry during volunteer orientation' },
        },
      },
      {
        id: 'audit-005',
        timestamp: hoursAgo(2.2),
        actorName: 'Pastor Joshua Idoko',
        actorRole: 'coordinator',
        action: 'EDIT_RECORD',
        targetType: 'record',
        targetId: 'soul-405',
        targetTitle: 'Blessing Okon (+234 806 765 4321)',
        centreName: 'Lugbe Centre',
        details: 'Updated follow-up stage from "not_started" to "contacted" and assigned Dunamis Glory Dome for pastoral care.',
        changes: {
          followUpStatus: { from: 'not_started', to: 'contacted' },
          followUpChurch: { from: '', to: 'Dunamis International Gospel Centre (Glory Dome)' },
        },
      },
      {
        id: 'audit-006',
        timestamp: hoursAgo(3.5),
        actorName: 'Rev. Samuel Bitrus',
        actorRole: 'coordinator',
        action: 'REJECT_BATCH',
        targetType: 'batch',
        targetId: 'batch-rej-09',
        targetTitle: 'Kubwa Phase 4 Duplicate (45 souls)',
        centreName: 'Kubwa Centre',
        details: 'Rejected submission: Duplicate batch transmitted twice due to field network reconnect.',
        changes: {
          status: { from: 'pending', to: 'rejected' },
          rejectionReason: { from: null, to: 'Duplicate batch submitted twice over unstable field connection.' },
        },
      },
    ];
  }

  // --- Helper Utilities ---
  private randomDecision(): DecisionType {
    const r = Math.random();
    if (r < 0.62) return 'new_convert';
    if (r < 0.88) return 'rededication';
    return 'returnee';
  }

  private randomAgeBracket(): AgeBracket {
    const r = Math.random();
    if (r < 0.12) return 'child';
    if (r < 0.58) return 'youth';
    if (r < 0.90) return 'adult';
    return 'senior';
  }

  private randomFollowUp(): FollowUpStatus {
    const r = Math.random();
    if (r < 0.35) return 'not_started';
    if (r < 0.65) return 'contacted';
    if (r < 0.85) return 'visited';
    if (r < 0.96) return 'integrated';
    return 'unreachable';
  }

  // --- Live Simulation Engine ---
  public startSimulation() {
    if (this.simulationTimer) clearTimeout(this.simulationTimer);
    this.isSimulating = true;

    const scheduleNext = () => {
      let delayMs = 6000;
      if (this.simulationSpeed === 'slow') delayMs = 9000 + Math.random() * 4000;
      else if (this.simulationSpeed === 'normal') delayMs = 4000 + Math.random() * 4500;
      else if (this.simulationSpeed === 'fast') delayMs = 1500 + Math.random() * 1500;

      this.simulationTimer = setTimeout(() => {
        if (this.isSimulating) {
          this.triggerSimulatedEvent();
          scheduleNext();
        }
      }, delayMs);
    };

    scheduleNext();
    this.notifySubscribers();
  }

  public stopSimulation() {
    if (this.simulationTimer) {
      clearTimeout(this.simulationTimer);
      this.simulationTimer = null;
    }
    this.isSimulating = false;
    this.notifySubscribers();
  }

  // Aliases for pause/resume
  public pauseSimulation() {
    this.stopSimulation();
  }

  public resumeSimulation() {
    this.startSimulation();
  }

  public setSimulationSpeed(speed: 'slow' | 'normal' | 'fast' | 'off') {
    if (speed === 'off') {
      this.stopSimulation();
      return;
    }
    this.simulationSpeed = speed;
    if (!this.isSimulating) {
      this.startSimulation();
    } else {
      this.startSimulation();
    }
  }

  public getSyncHistory(): SyncHistoryEntry[] {
    return [...this.syncHistory].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  public recordSyncHistory(entry: Omit<SyncHistoryEntry, 'id' | 'timestamp'>) {
    this.syncHistory.unshift({
      id: `sync-hist-${Date.now()}`,
      timestamp: new Date().toISOString(),
      ...entry,
    });
    this.notifySubscribers();
  }

  public getSimulationStatus() {
    return {
      isSimulating: this.isSimulating,
      speed: this.simulationSpeed,
    };
  }

  public triggerSimulatedSubmission(centreId?: string, count: number = 15) {
    const targetCentre = centreId
      ? this.centres.find(c => c.id === centreId) || this.centres[0]
      : this.centres[Math.floor(Math.random() * this.centres.length)];
    const winnerName = SOUL_WINNERS[Math.floor(Math.random() * SOUL_WINNERS.length)];

    const newConverts = Math.round(count * 0.65);
    const rededications = Math.round((count - newConverts) * 0.7);
    const returnees = count - newConverts - rededications;

    const newBatch: Batch = {
      id: `batch-${Date.now()}`,
      centreId: targetCentre.id,
      submittedByName: winnerName,
      sessionLabel: 'Live Field Collation Stream',
      count,
      newConverts,
      rededications,
      returnees,
      status: 'verified',
      submittedAt: new Date().toISOString(),
      note: `Real-time street ministry feed from ${targetCentre.name}.`,
    };

    this.batches.push(newBatch);
    this.addTickerItem(targetCentre.name, count, winnerName, { newConverts, rededications, returnees });
    this.flashCentre(targetCentre.id);
    this.notifySubscribers();
  }

  private triggerSimulatedEvent() {
    const isBulk = Math.random() > 0.45;
    const randomCentre = this.centres[Math.floor(Math.random() * this.centres.length)];
    const winnerName = SOUL_WINNERS[Math.floor(Math.random() * SOUL_WINNERS.length)];

    if (isBulk) {
      const count = Math.floor(Math.random() * 28) + 5;
      const newConverts = Math.round(count * (0.6 + Math.random() * 0.2));
      const rededications = Math.round((count - newConverts) * 0.7);
      const returnees = count - newConverts - rededications;

      const newBatch: Batch = {
        id: `batch-${Date.now()}`,
        centreId: randomCentre.id,
        submittedByName: winnerName,
        sessionLabel: 'Live Field Collation Stream',
        count,
        newConverts,
        rededications,
        returnees,
        status: 'verified',
        submittedAt: new Date().toISOString(),
        note: `Real-time street ministry feed from ${randomCentre.name}.`,
      };

      this.batches.push(newBatch);
      this.addTickerItem(randomCentre.name, count, winnerName, { newConverts, rededications, returnees });
    } else {
      const isMale = Math.random() > 0.48;
      const firstName = isMale
        ? FIRST_NAMES_MALE[Math.floor(Math.random() * FIRST_NAMES_MALE.length)]
        : FIRST_NAMES_FEMALE[Math.floor(Math.random() * FIRST_NAMES_FEMALE.length)];
      const lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
      const communities = COMMUNITIES_BY_CENTRE[randomCentre.id] || ['Abuja Municipal'];
      const community = communities[Math.floor(Math.random() * communities.length)];
      const decisionType = this.randomDecision();

      const newRecord: SoulRecord = {
        id: `soul-${Date.now()}`,
        centreId: randomCentre.id,
        firstName,
        lastName,
        phone: generateRandomNigerianPhone(),
        gender: isMale ? 'male' : 'female',
        ageBracket: this.randomAgeBracket(),
        community,
        decisionType,
        wonByName: winnerName,
        wonAt: new Date().toISOString(),
        followUpChurch: FOLLOW_UP_CHURCHES[Math.floor(Math.random() * FOLLOW_UP_CHURCHES.length)],
        followUpStatus: 'not_started',
        consentGiven: true,
        notes: 'Surrendered during live street outreach.',
        status: 'verified',
        detailsPending: false,
      };

      this.soulRecords.push(newRecord);
      this.addTickerItem(randomCentre.name, 1, `${firstName} ${lastName} (${winnerName})`);
    }

    this.flashCentre(randomCentre.id);
    this.notifySubscribers();
  }

  private addTickerItem(
    centreName: string,
    count: number,
    winnerName?: string,
    decisionBreakdown?: { newConverts: number; rededications: number; returnees: number }
  ) {
    const newItem: TickerSubmission = {
      id: `tick-${Date.now()}-${Math.random()}`,
      centreName,
      count,
      winnerName,
      decisionBreakdown,
      timestamp: new Date().toISOString(),
    };
    this.tickerItems = [newItem, ...this.tickerItems.slice(0, 19)];
  }

  private flashCentre(centreId: string) {
    this.lastFlashedCentreId = centreId;
    if (this.flashTimeout) clearTimeout(this.flashTimeout);
    this.flashTimeout = setTimeout(() => {
      this.lastFlashedCentreId = null;
      this.notifySubscribers();
    }, 4500);
  }

  public getLastFlashedCentreId(): string | null {
    return this.lastFlashedCentreId;
  }

  // --- Subscriptions ---
  public subscribe(callback: () => void): () => void {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  private notifySubscribers() {
    this.subscribers.forEach(cb => cb());
  }

  // --- Queries & Aggregations ---
  public getCampaign(): Campaign {
    return { ...this.campaign };
  }

  public updateCampaign(updates: Partial<Campaign>): boolean {
    this.campaign = { ...this.campaign, ...updates };
    this.auditLogs.unshift({
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actorName: 'Campaign Admin',
      actorRole: 'admin',
      action: 'UPDATE_CAMPAIGN',
      targetType: 'campaign',
      targetId: this.campaign.id,
      targetTitle: this.campaign.name,
      details: `Updated campaign settings: target ${this.campaign.target.toLocaleString()} souls, announcement: "${this.campaign.announcement || ''}".`,
    });
    this.notifySubscribers();
    return true;
  }

  public updateCampaignAnnouncement(announcement: string): boolean {
    return this.updateCampaign({ announcement });
  }

  public updateAnnouncement(announcement: string): boolean {
    return this.updateCampaignAnnouncement(announcement);
  }

  public getMilestones(): number[] {
    return [1000, 2500, 5000, 7500, 10000];
  }

  public getArchivedRecordsCount(): number {
    return this.soulRecords.filter(r => !r.isDeleted && r.isArchived).length;
  }

  public archiveFinishedRecords(): number {
    let count = 0;
    const now = new Date().toISOString();
    for (const r of this.soulRecords) {
      if (!r.isDeleted && !r.isArchived) {
        r.isArchived = true;
        r.archivedAt = now;
        count++;
      }
    }
    this.auditLogs.unshift({
      id: `audit-${Date.now()}`,
      timestamp: now,
      actorName: 'Campaign Admin',
      actorRole: 'coordinator',
      action: 'EDIT_RECORD',
      targetType: 'campaign',
      targetId: 'archive',
      targetTitle: 'Finished Campaign Records Archive',
      details: `Archived ${count} records to hidden state for database performance optimization.`,
    });
    this.notifySubscribers();
    return count;
  }

  public restoreArchivedRecords(): number {
    let count = 0;
    const now = new Date().toISOString();
    for (const r of this.soulRecords) {
      if (!r.isDeleted && r.isArchived) {
        r.isArchived = false;
        r.archivedAt = undefined;
        count++;
      }
    }
    this.auditLogs.unshift({
      id: `audit-${Date.now()}`,
      timestamp: now,
      actorName: 'Campaign Admin',
      actorRole: 'coordinator',
      action: 'EDIT_RECORD',
      targetType: 'campaign',
      targetId: 'archive',
      targetTitle: 'Finished Campaign Records Restoration',
      details: `Restored ${count} records from hidden archive state.`,
    });
    this.notifySubscribers();
    return count;
  }

  public getSmsLogs(): SmsLogEntry[] {
    return [...this.smsLogs];
  }

  public scanQrCode(qrCode: string): { success: boolean; message: string; record?: SoulRecord } {
    const cleanCode = qrCode.trim().toUpperCase();
    const record = this.soulRecords.find(r => !r.isDeleted && r.qrCode && r.qrCode.toUpperCase() === cleanCode);
    if (!record) {
      return { success: false, message: 'Invalid or unrecognized QR code. No matching soul record found.' };
    }
    if (record.followUpStatus === 'integrated') {
      return { success: true, message: `Convert ${record.firstName} ${record.lastName} was already marked as integrated.`, record };
    }
    record.followUpStatus = 'integrated';
    this.auditLogs.unshift({
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actorName: 'Church Service Follow-Up Usher',
      actorRole: 'coordinator',
      action: 'EDIT_RECORD',
      targetType: 'record',
      targetId: record.id,
      targetTitle: `${record.firstName} ${record.lastName} (QR Scan)`,
      details: `Scanned QR code at church service, updating follow-up status to 'integrated'.`,
    });
    this.notifySubscribers();
    return { success: true, message: `Successfully checked in ${record.firstName} ${record.lastName}! Follow-up status updated to 'integrated'.`, record };
  }

  public updateSoulFollowUpStatus(id: string, status: FollowUpStatus, actorName: string = 'Follow-Up Officer'): boolean {
    const rec = this.soulRecords.find(r => r.id === id);
    if (!rec) return false;
    const oldStatus = rec.followUpStatus;
    rec.followUpStatus = status;
    this.auditLogs.unshift({
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actorName,
      actorRole: 'coordinator',
      action: 'EDIT_RECORD',
      targetType: 'record',
      targetId: rec.id,
      targetTitle: `${rec.firstName} ${rec.lastName}`,
      details: `Updated follow-up status from ${oldStatus} to ${status}.`,
    });
    this.notifySubscribers();
    return true;
  }

  private checkAndTriggerSmsMilestones(centreId: string) {
    if (!this.campaign.smsConfig || !this.campaign.smsConfig.enabled) return;
    const centre = this.centres.find(c => c.id === centreId);
    if (!centre || !centre.contactPhone) return;

    const centreSouls = this.soulRecords.filter(r => !r.isDeleted && r.centreId === centreId && r.status === 'verified').length;
    const pct = Math.round((centreSouls / centre.target) * 100);

    const thresholds = this.campaign.smsConfig.thresholds || [25, 50, 75];
    for (const t of thresholds) {
      if (pct >= t) {
        const alreadyLogged = this.smsLogs.some(l => l.centreId === centreId && l.milestonePercentage === t);
        if (!alreadyLogged) {
          const msg = `ALERT: Centre ${centre.name} has hit ${t}% of its target (${centreSouls}/${centre.target} souls won). Keep marching!`;
          this.smsLogs.unshift({
            id: `sms-${Date.now()}-${Math.random()}`,
            timestamp: new Date().toISOString(),
            centreId: centre.id,
            centreName: centre.name,
            coordinatorPhone: centre.contactPhone,
            milestonePercentage: t,
            message: msg,
            status: 'sent',
          });
        }
      }
    }
  }

  public subscribeMilestoneCelebration(cb: (milestone: number) => void): () => void {
    this.milestoneCelebrationSubscribers.add(cb);
    return () => this.milestoneCelebrationSubscribers.delete(cb);
  }

  public triggerMilestoneCelebration(milestoneValue: number) {
    playCelebrationSound();
    this.addTickerItem('Campaign Directorate', milestoneValue, 'Milestone Reached! 🎉');
    this.milestoneCelebrationSubscribers.forEach(cb => cb(milestoneValue));
    this.notifySubscribers();
  }

  public getAreaCouncils(): AreaCouncil[] {
    return [...this.areaCouncils];
  }

  // Compatibility alias
  public getRegions(): AreaCouncil[] {
    return this.getAreaCouncils();
  }

  public getCentres(): Centre[] {
    return this.centres.map(c => ({
      ...c,
      regionId: c.areaCouncilId,
    }));
  }

  public getCentreById(id: string): Centre | undefined {
    const c = this.centres.find(cnt => cnt.id === id);
    if (!c) return undefined;
    return { ...c, regionId: c.areaCouncilId };
  }

  public addCentre(centre: Omit<Centre, 'id' | 'active'> & { active?: boolean }): Centre {
    const newCentre: Centre = {
      ...centre,
      id: `cnt-${Date.now()}`,
      active: centre.active ?? true,
      regionId: centre.areaCouncilId || centre.regionId || 'amac',
      areaCouncilId: centre.areaCouncilId || centre.regionId || 'amac',
    };
    this.centres.push(newCentre);
    this.auditLogs.unshift({
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actorName: 'Campaign Admin',
      actorRole: 'admin',
      action: 'UPDATE_CENTRE',
      targetType: 'centre',
      targetId: newCentre.id,
      targetTitle: newCentre.name,
      centreName: newCentre.name,
      details: `Created new collation centre ${newCentre.name} (${newCentre.code}).`,
    });
    this.notifySubscribers();
    return newCentre;
  }

  public updateCentre(centre: Centre): boolean {
    const idx = this.centres.findIndex(c => c.id === centre.id);
    if (idx === -1) return false;
    this.centres[idx] = {
      ...centre,
      areaCouncilId: centre.areaCouncilId || centre.regionId || 'amac',
      regionId: centre.areaCouncilId || centre.regionId || 'amac',
    };
    this.auditLogs.unshift({
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actorName: 'Campaign Admin',
      actorRole: 'admin',
      action: 'UPDATE_CENTRE',
      targetType: 'centre',
      targetId: centre.id,
      targetTitle: centre.name,
      centreName: centre.name,
      details: `Updated details and coordinator for collation centre ${centre.name}.`,
    });
    this.notifySubscribers();
    return true;
  }

  public toggleCentreStatus(centreId: string): boolean {
    const centre = this.centres.find(c => c.id === centreId);
    if (!centre) return false;
    centre.active = !centre.active;
    this.notifySubscribers();
    return true;
  }

  public toggleCentreActive(centreId: string): boolean {
    return this.toggleCentreStatus(centreId);
  }

  public findDuplicateByPhone(phone: string): { isDuplicate: boolean; matchedRecord?: SoulRecord } {
    const norm = validateAndNormalizeNigerianPhone(phone);
    const checkPhone = norm.isValid ? norm.normalized : phone.trim();
    const match = this.soulRecords.find(
      r => !r.isDeleted && r.phone && (r.phone === checkPhone || r.phone === phone.trim())
    );
    return {
      isDuplicate: !!match,
      matchedRecord: match,
    };
  }

  public getOfflineQueueCount(): number {
    return this.offlineQueueItems.length;
  }

  public getOfflineQueueItems(): OfflineQueueItem[] {
    return [...this.offlineQueueItems];
  }

  public async queueOfflineSubmission(item: Omit<OfflineQueueItem, 'id' | 'createdAt' | 'status' | 'retryCount'>): Promise<void> {
    const queueItem: OfflineQueueItem = {
      ...item,
      id: `queue-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString(),
      status: 'pending',
      retryCount: 0,
    };
    this.offlineQueueItems.push(queueItem);
    await saveQueuedItemToDB(queueItem);
    this.notifySubscribers();
  }

  public async syncSingleOfflineItem(id: string): Promise<boolean> {
    const item = this.offlineQueueItems.find(i => i.id === id);
    if (!item) return false;

    if (item.type === 'individual') {
      const p = item.individualPayload || (item.record as any);
      if (p) {
        this.addSoulRecord({
          centreId: item.centreId,
          firstName: p.firstName,
          lastName: p.lastName,
          phone: p.phone,
          gender: p.gender || 'male',
          ageBracket: p.ageBracket || 'youth',
          community: p.community || 'Abuja Municipal',
          decisionType: p.decisionType || 'new_convert',
          wonByName: item.wonByName || 'Field Evangelist',
          winnerPhone: p.winnerPhone,
          winnerCell: p.winnerCell,
          winnerPcf: p.winnerPcf,
          followUpChurch: p.followUpChurch || '',
          followUpStatus: p.followUpStatus || 'not_started',
          consentGiven: p.consentGiven ?? true,
          notes: p.notes || '',
          duplicateOverrideReason: p.duplicateOverrideReason,
          outreachSpot: p.outreachSpot,
          residentialAddress: p.residentialAddress,
          residentialDistrict: p.residentialDistrict,
          residentialAreaCouncil: p.residentialAreaCouncil,
        }, item.wonByName || 'Field Worker (Synced)', item.userRole || 'field_worker');
      }
    } else {
      const b = item.bulkPayload || (item.batch as any);
      if (b) {
        const count = b.count || 0;
        const nc = b.newConverts ?? Math.round(count * 0.7);
        const rd = b.rededications ?? Math.round(count * 0.2);
        const rt = b.returnees ?? Math.max(0, count - nc - rd);
        this.addBatch({
          centreId: item.centreId,
          submittedByName: item.wonByName || 'Field Coordinator',
          winnerPhone: b.winnerPhone,
          winnerCell: b.winnerCell,
          winnerPcf: b.winnerPcf,
          sessionLabel: b.sessionLabel || 'Field Batch Transmission',
          count,
          newConverts: nc,
          rededications: rd,
          returnees: rt,
          note: b.note,
        }, item.wonByName || 'Field Worker (Synced)', item.userRole || 'field_worker');
      }
    }

    this.offlineQueueItems = this.offlineQueueItems.filter(i => i.id !== id);
    await removeQueuedItemFromDB(id);
    this.notifySubscribers();
    return true;
  }

  public async syncAllOfflineItems(): Promise<{ succeeded: number; failed: number }> {
    let succeeded = 0;
    let failed = 0;
    const itemsToSync = [...this.offlineQueueItems];

    for (const item of itemsToSync) {
      try {
        if (item.type === 'individual') {
          const p = item.individualPayload || (item.record as any);
          if (p) {
            this.addSoulRecord({
              centreId: item.centreId,
              firstName: p.firstName,
              lastName: p.lastName,
              phone: p.phone,
              gender: p.gender || 'male',
              ageBracket: p.ageBracket || 'youth',
              community: p.community || 'Abuja Municipal',
              decisionType: p.decisionType || 'new_convert',
              wonByName: item.wonByName || 'Field Evangelist',
              winnerPhone: p.winnerPhone,
              winnerCell: p.winnerCell,
              winnerPcf: p.winnerPcf,
              followUpChurch: p.followUpChurch || '',
              followUpStatus: p.followUpStatus || 'not_started',
              consentGiven: p.consentGiven ?? true,
              notes: p.notes || '',
              duplicateOverrideReason: p.duplicateOverrideReason,
              outreachSpot: p.outreachSpot,
              residentialAddress: p.residentialAddress,
              residentialDistrict: p.residentialDistrict,
              residentialAreaCouncil: p.residentialAreaCouncil,
            }, item.wonByName || 'Field Worker (Synced)', item.userRole || 'field_worker');
          }
        } else {
          const b = item.bulkPayload || (item.batch as any);
          if (b) {
            const count = b.count || 0;
            const nc = b.newConverts ?? Math.round(count * 0.7);
            const rd = b.rededications ?? Math.round(count * 0.2);
            const rt = b.returnees ?? Math.max(0, count - nc - rd);
            this.addBatch({
              centreId: item.centreId,
              submittedByName: item.wonByName || 'Field Coordinator',
              winnerPhone: b.winnerPhone,
              winnerCell: b.winnerCell,
              winnerPcf: b.winnerPcf,
              sessionLabel: b.sessionLabel || 'Field Batch Transmission',
              count,
              newConverts: nc,
              rededications: rd,
              returnees: rt,
              note: b.note,
            }, item.wonByName || 'Field Worker (Synced)', item.userRole || 'field_worker');
          }
        }
        this.offlineQueueItems = this.offlineQueueItems.filter(i => i.id !== item.id);
        await removeQueuedItemFromDB(item.id);
        succeeded++;
      } catch {
        failed++;
      }
    }
    this.notifySubscribers();
    return { succeeded, failed };
  }

  public async deleteOfflineQueueItem(id: string): Promise<void> {
    this.offlineQueueItems = this.offlineQueueItems.filter(i => i.id !== id);
    await removeQueuedItemFromDB(id);
    this.notifySubscribers();
  }

  public async clearAllOfflineQueue(): Promise<void> {
    this.offlineQueueItems = [];
    await clearAllQueuedItemsFromDB();
    this.notifySubscribers();
  }

  public getSoulRecords(filter?: {
    centreId?: string;
    decisionType?: DecisionType;
    status?: string;
    search?: string;
    includeDeleted?: boolean;
    includeArchived?: boolean;
    startDate?: string;
    endDate?: string;
  }): SoulRecord[] {
    let list = this.soulRecords.filter(r => {
      if (!filter?.includeDeleted && r.isDeleted) return false;
      if (!filter?.includeArchived && r.isArchived) return false;
      return true;
    });

    if (filter?.centreId && filter.centreId !== 'all') {
      list = list.filter(r => r.centreId === filter.centreId);
    }
    if (filter?.decisionType && (filter.decisionType as any) !== 'all') {
      list = list.filter(r => r.decisionType === filter.decisionType);
    }
    if (filter?.status && filter.status !== 'all') {
      list = list.filter(r => r.status === filter.status);
    }
    if (filter?.search) {
      const q = filter.search.toLowerCase();
      list = list.filter(
        r =>
          r.firstName.toLowerCase().includes(q) ||
          r.lastName.toLowerCase().includes(q) ||
          r.phone.includes(q) ||
          r.community.toLowerCase().includes(q) ||
          r.wonByName.toLowerCase().includes(q)
      );
    }
    if (filter?.startDate) {
      const start = new Date(filter.startDate).getTime();
      list = list.filter(r => new Date(r.wonAt).getTime() >= start);
    }
    if (filter?.endDate) {
      const end = new Date(filter.endDate).getTime() + 24 * 3600 * 1000;
      list = list.filter(r => new Date(r.wonAt).getTime() <= end);
    }

    return [...list].sort((a, b) => new Date(b.wonAt).getTime() - new Date(a.wonAt).getTime());
  }

  public getBatches(filter?: {
    centreId?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    includeDeleted?: boolean;
  }): Batch[] {
    let list = this.batches.filter(b => (filter?.includeDeleted ? true : !b.isDeleted));
    if (filter?.centreId && filter.centreId !== 'all') {
      list = list.filter(b => b.centreId === filter.centreId);
    }
    if (filter?.status && filter.status !== 'all') {
      list = list.filter(b => b.status === filter.status);
    }
    if (filter?.startDate) {
      const start = new Date(filter.startDate).getTime();
      list = list.filter(b => new Date(b.submittedAt).getTime() >= start);
    }
    if (filter?.endDate) {
      const end = new Date(filter.endDate).getTime() + 24 * 3600 * 1000;
      list = list.filter(b => new Date(b.submittedAt).getTime() <= end);
    }
    return [...list].sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
  }

  public getPendingBatches(): Batch[] {
    return this.batches
      .filter(b => b.status === 'pending' && !b.isDeleted)
      .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
  }

  public getPendingSoulRecords(): SoulRecord[] {
    return this.soulRecords
      .filter(r => r.status === 'pending' && !r.isDeleted)
      .sort((a, b) => new Date(b.wonAt).getTime() - new Date(a.wonAt).getTime());
  }

  public getTickerItems(): TickerSubmission[] {
    return [...this.tickerItems];
  }

  public getAuditLogs(): AuditLogEntry[] {
    return [...this.auditLogs].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  // --- Core Aggregated Stats ---
  public getStats(): DashboardStats {
    let totalVerifiedSouls = 0;

    // Verified individual records
    this.soulRecords.forEach(r => {
      if (!r.isDeleted && r.status === 'verified') {
        totalVerifiedSouls += 1;
      }
    });

    // Verified batches
    this.batches.forEach(b => {
      if (!b.isDeleted && b.status === 'verified') {
        totalVerifiedSouls += b.count;
      }
    });

    const target = this.campaign.target || 10000;
    const percentage = Math.min(100, Math.round((totalVerifiedSouls / target) * 1000) / 10);
    const remaining = Math.max(0, target - totalVerifiedSouls);

    // Calculate souls in the last hour
    const oneHourAgo = Date.now() - 3600 * 1000;
    let soulsLastHour = 0;

    this.soulRecords.forEach(r => {
      if (!r.isDeleted && r.status === 'verified' && new Date(r.wonAt).getTime() >= oneHourAgo) {
        soulsLastHour += 1;
      }
    });
    this.batches.forEach(b => {
      if (!b.isDeleted && b.status === 'verified' && new Date(b.submittedAt).getTime() >= oneHourAgo) {
        soulsLastHour += b.count;
      }
    });

    const pendingApprovalsCount =
      this.batches.filter(b => b.status === 'pending' && !b.isDeleted).length +
      this.soulRecords.filter(r => r.status === 'pending' && !r.isDeleted).length;

    // Projected total based on current velocity
    const hourlyVelocity = Math.max(soulsLastHour, 85);
    const projectedTotal = Math.min(target * 1.5, Math.round(totalVerifiedSouls + hourlyVelocity * 18));

    return {
      totalSouls: totalVerifiedSouls,
      target,
      percentage,
      remaining,
      centresReporting: this.centres.length,
      totalCentres: this.centres.length,
      soulsLastHour,
      projectedTotal,
      hourlyVelocity,
      pendingApprovalsCount,
    };
  }

  public getCentreStandings(): CentreStanding[] {
    const stats = this.getStats();
    const totalSouls = Math.max(1, stats.totalSouls);

    const standings: CentreStanding[] = this.centres.map(centre => {
      const areaCouncil = this.areaCouncils.find(ac => ac.id === centre.areaCouncilId);
      const councilName = areaCouncil ? areaCouncil.name : 'Abuja Municipal (AMAC)';

      let soulsWon = 0;
      let lastReportedAt: string | undefined = undefined;

      this.soulRecords.forEach(r => {
        if (r.centreId === centre.id && !r.isDeleted && r.status === 'verified') {
          soulsWon += 1;
          if (!lastReportedAt || new Date(r.wonAt).getTime() > new Date(lastReportedAt).getTime()) {
            lastReportedAt = r.wonAt;
          }
        }
      });

      this.batches.forEach(b => {
        if (b.centreId === centre.id && !b.isDeleted && b.status === 'verified') {
          soulsWon += b.count;
          if (!lastReportedAt || new Date(b.submittedAt).getTime() > new Date(lastReportedAt).getTime()) {
            lastReportedAt = b.submittedAt;
          }
        }
      });

      const percentageOfTarget = Math.round((soulsWon / Math.max(1, centre.target)) * 1000) / 10;
      const percentageOfTotal = Math.round((soulsWon / totalSouls) * 1000) / 10;

      return {
        centre: { ...centre, regionId: centre.areaCouncilId },
        areaCouncilName: councilName,
        regionName: councilName, // Compatibility alias
        soulsWon,
        percentageOfTarget,
        percentageOfTotal,
        rank: 0,
        lastReportedAt,
        isRecentFlash: this.lastFlashedCentreId === centre.id,
      };
    });

    standings.sort((a, b) => b.soulsWon - a.soulsWon);
    standings.forEach((item, index) => {
      item.rank = index + 1;
    });

    return standings;
  }

  public getAreaCouncilBreakdown(): AreaCouncilStats[] {
    const stats = this.getStats();
    const totalSouls = Math.max(1, stats.totalSouls);

    return this.areaCouncils.map(council => {
      const centresInCouncil = this.centres.filter(c => c.areaCouncilId === council.id);
      const centreIds = new Set(centresInCouncil.map(c => c.id));

      let soulsWon = 0;
      this.soulRecords.forEach(r => {
        if (centreIds.has(r.centreId) && !r.isDeleted && r.status === 'verified') {
          soulsWon += 1;
        }
      });
      this.batches.forEach(b => {
        if (centreIds.has(b.centreId) && !b.isDeleted && b.status === 'verified') {
          soulsWon += b.count;
        }
      });

      const percentageOfTotal = Math.round((soulsWon / totalSouls) * 1000) / 10;

      return {
        areaCouncilId: council.id,
        areaCouncilName: council.name,
        code: council.code,
        soulsWon,
        target: council.target,
        percentageOfTotal,
        centresCount: centresInCouncil.length,
        // Compatibility aliases
        regionId: council.id,
        regionName: council.name,
      };
    });
  }

  // Compatibility alias
  public getRegionalBreakdown(): AreaCouncilStats[] {
    return this.getAreaCouncilBreakdown();
  }

  // =========================================================================
  // RESIDENTIAL & GEOGRAPHIC INTELLIGENCE (Where Converts Actually Live)
  // =========================================================================

  /**
   * Aggregates converts by their reported residential Area Council.
   */
  public getResidentialAreaBreakdown(): ResidentialAreaStats[] {
    const verified = this.soulRecords.filter(r => !r.isDeleted && r.status === 'verified');
    const totalRecords = Math.max(1, verified.length);

    const counts: Record<string, number> = {
      AMAC: 0,
      BWARI: 0,
      GWAGWALADA: 0,
      KUJE: 0,
      KWALI: 0,
      ABAJI: 0,
    };

    verified.forEach(r => {
      let code = r.residentialAreaCouncil;
      if (!code && r.residentialDistrict) {
        code = areaCouncilOf(r.residentialDistrict);
      }
      if (!code && r.community) {
        code = areaCouncilOf(r.community);
      }
      const finalCode = (code && code in counts) ? code : 'AMAC';
      counts[finalCode] = (counts[finalCode] || 0) + 1;
    });

    return this.areaCouncils.map(council => {
      const count = counts[council.code] || 0;
      const percentageOfTotal = Math.round((count / totalRecords) * 1000) / 10;
      return {
        areaCouncilId: council.id,
        areaCouncilName: council.name,
        code: council.code,
        count,
        percentageOfTotal,
      };
    });
  }

  /**
   * Returns top residential clusters (neighborhoods / towns) where converts live,
   * complete with sample street addresses and recommended church follow-up bus routes.
   */
  public getTopResidentialClusters(limit: number = 10): ResidentialDistrictCluster[] {
    const verified = this.soulRecords.filter(r => !r.isDeleted && r.status === 'verified');
    const totalRecords = Math.max(1, verified.length);

    const map = new Map<string, { count: number; council: string; sampleAddress?: string }>();

    verified.forEach(r => {
      const district = r.residentialDistrict || r.community || 'Central Area';
      const existing = map.get(district);
      const councilCode = r.residentialAreaCouncil || areaCouncilOf(district) || 'AMAC';
      if (existing) {
        existing.count += 1;
        if (!existing.sampleAddress && r.residentialAddress) {
          existing.sampleAddress = r.residentialAddress;
        }
      } else {
        map.set(district, {
          count: 1,
          council: councilCode,
          sampleAddress: r.residentialAddress,
        });
      }
    });

    const routeRecommendations: Record<string, string> = {
      'Lugbe (Airport Road)': 'Lugbe Express Follow-Up Shuttle (Airport Rd Corridor)',
      'Trademore / Airport Rd': 'Airport Road Southern Line',
      'Kubwa Phase 4': 'Kubwa-Bwari Northern Feeder Line',
      'FHA Kubwa': 'Kubwa Central Discipleship Bus',
      'Karu Site': 'Nyanya-Karu Eastern Transit Line',
      'Nyanya': 'Nyanya Checkpoint Hub Route',
      'Lokogoma': 'Apo-Lokogoma Residential Line',
      'Gwarinpa Estate': 'Gwarinpa Direct Fellowship Shuttle',
      'Dutse-Alhaji': 'Dutse-Bwari Feeder Line',
      'Dawaki': 'Dawaki-Katampe Express',
      'Gwagwalada Town': 'UniAbuja & Gwagwalada Transit',
      'Kuje Town': 'Kuje Regional Shuttle',
    };

    const sorted = Array.from(map.entries())
      .map(([district, data]) => ({
        district,
        areaCouncilCode: data.council,
        count: data.count,
        percentage: Math.round((data.count / totalRecords) * 1000) / 10,
        sampleAddress: data.sampleAddress || `Near ${district} Central`,
        recommendedBusRoute: routeRecommendations[district] || `${district} Cell Fellowship Route`,
      }))
      .sort((a, b) => b.count - a.count);

    return sorted.slice(0, limit);
  }

  /**
   * Compares where souls were won (Outreach) vs. where converts actually live (Residence).
   */
  public getOutreachVsResidentialComparison(): OutreachVsResidentialPoint[] {
    const outreach = this.getAreaCouncilBreakdown();
    const residential = this.getResidentialAreaBreakdown();

    return this.areaCouncils.map(council => {
      const out = outreach.find(o => o.code === council.code);
      const res = residential.find(r => r.code === council.code);
      const outCount = out ? out.soulsWon : 0;
      const resCount = res ? res.count : 0;

      return {
        areaCouncilId: council.id,
        areaCouncilName: council.name,
        code: council.code,
        outreachCount: outCount,
        residentialCount: resCount,
        netInflow: resCount - outCount,
      };
    });
  }

  /**
   * Returns all converts living in a specific neighborhood or district.
   */
  public getConvertsByDistrict(district: string): SoulRecord[] {
    return this.soulRecords.filter(
      r =>
        !r.isDeleted &&
        r.status === 'verified' &&
        (r.residentialDistrict?.toLowerCase() === district.toLowerCase() ||
          r.community?.toLowerCase() === district.toLowerCase())
    );
  }

  public getDecisionBreakdown(): DecisionBreakdown {
    let newConverts = 0;
    let rededications = 0;
    let returnees = 0;

    this.soulRecords.forEach(r => {
      if (!r.isDeleted && r.status === 'verified') {
        if (r.decisionType === 'new_convert') newConverts += 1;
        else if (r.decisionType === 'rededication') rededications += 1;
        else if (r.decisionType === 'returnee') returnees += 1;
      }
    });

    this.batches.forEach(b => {
      if (!b.isDeleted && b.status === 'verified') {
        newConverts += b.newConverts || 0;
        rededications += b.rededications || 0;
        returnees += b.returnees || 0;
      }
    });

    return {
      newConverts,
      rededications,
      returnees,
      total: newConverts + rededications + returnees,
    };
  }

  public getDemographicSplit(): DemographicSplit {
    let male = 0;
    let female = 0;
    let child = 0;
    let youth = 0;
    let adult = 0;
    let senior = 0;

    const verifiedRecords = this.soulRecords.filter(r => !r.isDeleted && r.status === 'verified');
    const totalAnalyzed = verifiedRecords.length || 1;

    verifiedRecords.forEach(r => {
      if (r.gender === 'male') male += 1;
      else female += 1;

      if (r.ageBracket === 'child') child += 1;
      else if (r.ageBracket === 'youth') youth += 1;
      else if (r.ageBracket === 'adult') adult += 1;
      else if (r.ageBracket === 'senior') senior += 1;
    });

    const decisions = this.getDecisionBreakdown();
    const totalDecisions = Math.max(1, decisions.total);

    return {
      totalAnalyzed: verifiedRecords.length,
      gender: {
        male,
        female,
        malePercent: Math.round((male / totalAnalyzed) * 100),
        femalePercent: Math.round((female / totalAnalyzed) * 100),
      },
      age: {
        child,
        youth,
        adult,
        senior,
        childPercent: Math.round((child / totalAnalyzed) * 100),
        youthPercent: Math.round((youth / totalAnalyzed) * 100),
        adultPercent: Math.round((adult / totalAnalyzed) * 100),
        seniorPercent: Math.round((senior / totalAnalyzed) * 100),
      },
      decision: {
        newConverts: decisions.newConverts,
        rededications: decisions.rededications,
        returnees: decisions.returnees,
        newConvertsPercent: Math.round((decisions.newConverts / totalDecisions) * 100),
        rededicationsPercent: Math.round((decisions.rededications / totalDecisions) * 100),
        returneesPercent: Math.round((decisions.returnees / totalDecisions) * 100),
      },
    };
  }

  public getFollowUpStats(): FollowUpFunnelStats {
    let not_started = 0;
    let contacted = 0;
    let visited = 0;
    let integrated = 0;
    let unreachable = 0;

    this.soulRecords.forEach(r => {
      if (!r.isDeleted) {
        if (r.followUpStatus === 'not_started') not_started++;
        else if (r.followUpStatus === 'contacted') contacted++;
        else if (r.followUpStatus === 'visited') visited++;
        else if (r.followUpStatus === 'integrated') integrated++;
        else if (r.followUpStatus === 'unreachable') unreachable++;
      }
    });

    return {
      not_started,
      contacted,
      visited,
      integrated,
      unreachable,
      total: not_started + contacted + visited + integrated + unreachable,
    };
  }

  public getHourlyTrend(): HourlyTrendPoint[] {
    const points: HourlyTrendPoint[] = [];
    const now = Date.now();
    let cumulative = 0;

    for (let i = 11; i >= 0; i--) {
      const hourStart = now - i * 3600 * 1000;
      const hourEnd = hourStart + 3600 * 1000;
      const hourDate = new Date(hourStart);
      const hourLabel = formatTimeWAT(hourDate);

      let count = 0;
      this.soulRecords.forEach(r => {
        const t = new Date(r.wonAt).getTime();
        if (!r.isDeleted && r.status === 'verified' && t >= hourStart && t < hourEnd) {
          count += 1;
        }
      });
      this.batches.forEach(b => {
        const t = new Date(b.submittedAt).getTime();
        if (!b.isDeleted && b.status === 'verified' && t >= hourStart && t < hourEnd) {
          count += b.count;
        }
      });

      cumulative += count;
      points.push({
        hourLabel,
        timestamp: hourStart,
        count,
        cumulative,
      });
    }

    return points;
  }

  public getDailyCumulative(): DailyCumulativePoint[] {
    const points: DailyCumulativePoint[] = [];
    const now = Date.now();
    let runningTotal = 0;

    for (let i = 4; i >= 0; i--) {
      const dayStart = now - i * 24 * 3600 * 1000;
      const dayEnd = dayStart + 24 * 3600 * 1000;
      const dayDate = new Date(dayStart);
      const dateLabel = `Day ${5 - i} (${formatDateWAT(dayDate).slice(0, 5)})`;

      let dayCount = 0;
      this.soulRecords.forEach(r => {
        const t = new Date(r.wonAt).getTime();
        if (!r.isDeleted && r.status === 'verified' && t <= dayEnd) {
          dayCount += 1;
        }
      });
      this.batches.forEach(b => {
        const t = new Date(b.submittedAt).getTime();
        if (!b.isDeleted && b.status === 'verified' && t <= dayEnd) {
          dayCount += b.count;
        }
      });

      runningTotal = dayCount;
      points.push({
        dateLabel,
        count: dayCount,
        cumulative: runningTotal,
      });
    }

    return points;
  }

  // --- Leaderboards ---
  public getCentresLeaderboard(period: LeaderboardPeriod = 'campaign'): LeaderboardEntry[] {
    const standings = this.getCentreStandings();
    return standings.map((item, index) => ({
      id: item.centre.id,
      rank: index + 1,
      rankChange: 0,
      name: item.centre.name,
      subtitle: `${item.areaCouncilName} · ${item.centre.code}`,
      code: item.centre.code,
      soulsWon: item.soulsWon,
      target: item.centre.target,
      percentageOfTarget: item.percentageOfTarget,
    }));
  }

  public getAreaCouncilsLeaderboard(period: LeaderboardPeriod = 'campaign'): LeaderboardEntry[] {
    const breakdown = this.getAreaCouncilBreakdown();
    const sorted = [...breakdown].sort((a, b) => b.soulsWon - a.soulsWon);
    return sorted.map((item, index) => ({
      id: item.areaCouncilId,
      rank: index + 1,
      rankChange: 0,
      name: item.areaCouncilName,
      subtitle: `${item.centresCount} Collation Hubs · Target: ${item.target.toLocaleString()}`,
      code: item.code,
      soulsWon: item.soulsWon,
      target: item.target,
      percentageOfTarget: Math.round((item.soulsWon / Math.max(1, item.target)) * 1000) / 10,
    }));
  }

  public getRegionsLeaderboard(period: LeaderboardPeriod = 'campaign'): LeaderboardEntry[] {
    return this.getAreaCouncilsLeaderboard(period);
  }

  public getSoulWinnersLeaderboard(period: LeaderboardPeriod = 'campaign'): LeaderboardEntry[] {
    const winnerMap = new Map<string, { soulsWon: number; newConverts: number; rededications: number; returnees: number; cell?: string; pcf?: string }>();

    this.soulRecords.forEach(r => {
      if (!r.isDeleted && r.status === 'verified') {
        const name = r.wonByName || 'Soul Winner';
        const cur = winnerMap.get(name) || { soulsWon: 0, newConverts: 0, rededications: 0, returnees: 0 };
        cur.soulsWon += 1;
        if (r.decisionType === 'new_convert') cur.newConverts += 1;
        else if (r.decisionType === 'rededication') cur.rededications += 1;
        else cur.returnees += 1;
        if (!cur.cell && r.winnerCell) cur.cell = r.winnerCell;
        if (!cur.pcf && r.winnerPcf) cur.pcf = r.winnerPcf;
        winnerMap.set(name, cur);
      }
    });

    this.batches.forEach(b => {
      if (!b.isDeleted && b.status === 'verified') {
        const name = b.submittedByName || 'Outreach Team';
        const cur = winnerMap.get(name) || { soulsWon: 0, newConverts: 0, rededications: 0, returnees: 0 };
        cur.soulsWon += b.count;
        cur.newConverts += b.newConverts || 0;
        cur.rededications += b.rededications || 0;
        cur.returnees += b.returnees || 0;
        if (!cur.cell && b.winnerCell) cur.cell = b.winnerCell;
        if (!cur.pcf && b.winnerPcf) cur.pcf = b.winnerPcf;
        winnerMap.set(name, cur);
      }
    });

    const list: LeaderboardEntry[] = Array.from(winnerMap.entries()).map(([name, data]) => ({
      id: `winner-${name.replace(/\s+/g, '-').toLowerCase()}`,
      rank: 0,
      rankChange: 0,
      name,
      subtitle: data.pcf ? `${data.cell || ''} · ${data.pcf}` : 'Abuja Field Ministry Collation',
      soulsWon: data.soulsWon,
      newConvertsCount: data.newConverts,
      rededicationsCount: data.rededications,
      returneesCount: data.returnees,
      winnerCell: data.cell,
      winnerPcf: data.pcf,
    }));

    list.sort((a, b) => b.soulsWon - a.soulsWon);
    list.forEach((item, index) => {
      item.rank = index + 1;
    });

    return list;
  }

  public getPcfsLeaderboard(_period: LeaderboardPeriod = 'campaign'): PcfLeaderboardEntry[] {
    const pcfMap = new Map<string, { soulsWon: number; newConverts: number; rededications: number; returnees: number; winners: Set<string>; topCell?: string; cellMap: Map<string, number> }>();

    const processPcf = (pcf: string, cell: string | undefined, winner: string, soulsWon: number, nc: number, rd: number, rt: number) => {
      const cur = pcfMap.get(pcf) || { soulsWon: 0, newConverts: 0, rededications: 0, returnees: 0, winners: new Set<string>(), cellMap: new Map<string, number>() };
      cur.soulsWon += soulsWon;
      cur.newConverts += nc;
      cur.rededications += rd;
      cur.returnees += rt;
      cur.winners.add(winner);
      if (cell) cur.cellMap.set(cell, (cur.cellMap.get(cell) || 0) + soulsWon);
      pcfMap.set(pcf, cur);
    };

    this.soulRecords.forEach(r => {
      if (!r.isDeleted && r.status === 'verified' && r.winnerPcf) {
        processPcf(r.winnerPcf, r.winnerCell, r.wonByName || 'Unknown', 1,
          r.decisionType === 'new_convert' ? 1 : 0,
          r.decisionType === 'rededication' ? 1 : 0,
          r.decisionType === 'returnee' ? 1 : 0);
      }
    });

    this.batches.forEach(b => {
      if (!b.isDeleted && b.status === 'verified' && b.winnerPcf) {
        processPcf(b.winnerPcf, b.winnerCell, b.submittedByName || 'Unknown', b.count,
          b.newConverts || 0, b.rededications || 0, b.returnees || 0);
      }
    });

    const totalSouls = Array.from(pcfMap.values()).reduce((s, v) => s + v.soulsWon, 0) || 1;

    const list: PcfLeaderboardEntry[] = Array.from(pcfMap.entries()).map(([pcfName, data]) => {
      let topCellName: string | undefined;
      let topCellCount = 0;
      data.cellMap.forEach((count, cell) => { if (count > topCellCount) { topCellCount = count; topCellName = cell; } });
      return {
        id: `pcf-${pcfName.replace(/\s+/g, '-').toLowerCase()}`,
        pcfName,
        rank: 0,
        rankChange: 0,
        soulsWon: data.soulsWon,
        newConvertsCount: data.newConverts,
        rededicationsCount: data.rededications,
        returneesCount: data.returnees,
        activeWinnersCount: data.winners.size,
        topCellName,
        percentageOfTotal: Math.round((data.soulsWon / totalSouls) * 1000) / 10,
      };
    });

    list.sort((a, b) => b.soulsWon - a.soulsWon);
    list.forEach((item, index) => { item.rank = index + 1; });
    return list;
  }

  public getCellsLeaderboard(_period: LeaderboardPeriod = 'campaign'): CellLeaderboardEntry[] {
    const cellMap = new Map<string, { soulsWon: number; newConverts: number; rededications: number; returnees: number; winners: Set<string>; pcf?: string }>();

    const processCell = (cell: string, pcf: string | undefined, winner: string, soulsWon: number, nc: number, rd: number, rt: number) => {
      const cur = cellMap.get(cell) || { soulsWon: 0, newConverts: 0, rededications: 0, returnees: 0, winners: new Set<string>() };
      cur.soulsWon += soulsWon;
      cur.newConverts += nc;
      cur.rededications += rd;
      cur.returnees += rt;
      cur.winners.add(winner);
      if (!cur.pcf && pcf) cur.pcf = pcf;
      cellMap.set(cell, cur);
    };

    this.soulRecords.forEach(r => {
      if (!r.isDeleted && r.status === 'verified' && r.winnerCell) {
        processCell(r.winnerCell, r.winnerPcf, r.wonByName || 'Unknown', 1,
          r.decisionType === 'new_convert' ? 1 : 0,
          r.decisionType === 'rededication' ? 1 : 0,
          r.decisionType === 'returnee' ? 1 : 0);
      }
    });

    this.batches.forEach(b => {
      if (!b.isDeleted && b.status === 'verified' && b.winnerCell) {
        processCell(b.winnerCell, b.winnerPcf, b.submittedByName || 'Unknown', b.count,
          b.newConverts || 0, b.rededications || 0, b.returnees || 0);
      }
    });

    const totalSouls = Array.from(cellMap.values()).reduce((s, v) => s + v.soulsWon, 0) || 1;

    const list: CellLeaderboardEntry[] = Array.from(cellMap.entries()).map(([cellName, data]) => ({
      id: `cell-${cellName.replace(/\s+/g, '-').toLowerCase()}`,
      cellName,
      pcfName: data.pcf,
      rank: 0,
      rankChange: 0,
      soulsWon: data.soulsWon,
      newConvertsCount: data.newConverts,
      rededicationsCount: data.rededications,
      returneesCount: data.returnees,
      activeWinnersCount: data.winners.size,
      percentageOfTotal: Math.round((data.soulsWon / totalSouls) * 1000) / 10,
    }));

    list.sort((a, b) => b.soulsWon - a.soulsWon);
    list.forEach((item, index) => { item.rank = index + 1; });
    return list;
  }

  public getLeaderboard(period: LeaderboardPeriod = 'campaign'): LeaderboardEntry[] {
    return this.getCentresLeaderboard(period);
  }

  // --- Mutation Methods & Audit Logging ---
  public getLocalities(): Locality[] {
    return LOCALITIES;
  }

  public getLocalitiesForCouncil(code: AreaCouncilCode): Locality[] {
    return localitiesFor(code);
  }

  public getWardsForCouncil(code: AreaCouncilCode): string[] {
    return wardsFor(code);
  }

  public getTopLocalities(limit = 15): { localityName: string; areaCouncil: string; count: number; rank: number }[] {
    const countsMap = new Map<string, { count: number; areaCouncil: string }>();

    this.soulRecords.forEach(r => {
      if (r.isDeleted) return;
      const loc = r.locality || r.community || 'Unspecified';
      const locObj = LOCALITIES.find(l => l.name.toLowerCase() === loc.toLowerCase());
      const areaCouncil = locObj ? AREA_COUNCILS[locObj.areaCouncil]?.name || locObj.areaCouncil : 'Abuja FCT';

      const existing = countsMap.get(loc) || { count: 0, areaCouncil };
      existing.count += 1;
      countsMap.set(loc, existing);
    });

    const sorted = Array.from(countsMap.entries())
      .map(([localityName, data]) => ({
        localityName,
        areaCouncil: data.areaCouncil,
        count: data.count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit)
      .map((item, idx) => ({
        ...item,
        rank: idx + 1,
      }));

    return sorted;
  }

  public addSoulRecord(
    record: Omit<SoulRecord, 'id' | 'wonAt' | 'status' | 'detailsPending'>,
    actorName: string = 'Field Evangelist',
    actorRole: UserRole = 'field_worker'
  ): { success: boolean; id: string; anomalyFlagged: boolean; anomalyMessage?: string } {
    const phoneNorm = validateAndNormalizeNigerianPhone(record.phone);
    const normalizedPhone = phoneNorm.isValid ? phoneNorm.normalized : record.phone;

    // Check duplicate phone anomaly
    const existing = this.soulRecords.find(
      r => !r.isDeleted && r.phone && r.phone === normalizedPhone
    );

    const isAnomaly = !!existing && !record.duplicateOverrideReason;
    const newId = `soul-${Date.now()}`;

    const centre = this.centres.find(c => c.id === record.centreId);
    const centreCouncil = centre?.areaCouncilCode;
    const localityName = record.locality || record.community || '';
    const localityObj = LOCALITIES.find(l => l.name.toLowerCase() === localityName.toLowerCase());
    const localityCouncil = localityObj?.areaCouncil;
    const isCrossCouncil = Boolean(centreCouncil && localityCouncil && centreCouncil !== localityCouncil);
    const ward = record.ward || (centreCouncil ? wardsFor(centreCouncil)[0] : undefined);

    const newRecord: SoulRecord = {
      ...record,
      id: newId,
      phone: normalizedPhone,
      locality: localityName || undefined,
      ward,
      isCrossCouncil,
      wonAt: new Date().toISOString(),
      status: this.campaign.verificationRequired ? 'pending' : 'verified',
      detailsPending: false,
      qrCode: record.qrCode || `H10K-QR-${newId.toUpperCase()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
    };

    this.soulRecords.push(newRecord);
    playDingSound();

    const centreName = centre ? centre.name : 'Abuja FCT Collation Hub';

    this.auditLogs.unshift({
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actorName,
      actorRole,
      action: 'CREATE_RECORD',
      targetType: 'record',
      targetId: newId,
      targetTitle: `${record.firstName} ${record.lastName} (${formatNigerianPhone(normalizedPhone)})`,
      centreName,
      details: `Submitted convert record for ${record.firstName} ${record.lastName} at ${centreName}.`,
      isAnomalyFlagged: isAnomaly,
      metadata: isAnomaly
        ? {
            reason: 'Potential duplicate phone number detected',
            existingRecordId: existing?.id,
          }
        : undefined,
    });

    if (newRecord.status === 'verified') {
      this.addTickerItem(centreName, 1, `${record.firstName} ${record.lastName} (${record.wonByName})`);
      this.flashCentre(record.centreId);
      this.checkAndTriggerSmsMilestones(record.centreId);
    }

    // Sync to Cloud Firestore in real-time
    firebaseSync.syncSoulRecord(newRecord).catch(err => {
      console.warn('[DataService] Background Firestore sync deferred:', err);
    });

    this.notifySubscribers();
    return {
      success: true,
      id: newId,
      anomalyFlagged: isAnomaly,
      anomalyMessage: isAnomaly ? 'Duplicate phone match identified across registered records.' : undefined,
    };
  }

  public recordSoulTap(params: {
    userId: string;
    userName: string;
    centreId: string;
    decisionType?: DecisionType;
    lat?: number;
    lng?: number;
    winnerCell?: string;
    winnerPcf?: string;
    winnerPhone?: string;
  }, actorRole: UserRole = 'field_worker'): { success: boolean; id: string; burstWarning: boolean } {
    const nowISO = new Date().toISOString();
    const newId = `soul-tap-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;

    const thirtySecsAgo = Date.now() - 30000;
    const recentUserTaps = this.soulRecords.filter(r => 
      r.tappedByUserId === params.userId && 
      r.captureMethod === 'tap' &&
      r.tappedAt && 
      new Date(r.tappedAt).getTime() > thirtySecsAgo
    );
    const burstWarning = recentUserTaps.length >= 10;

    const newRecord: SoulRecord = {
      id: newId,
      centreId: params.centreId,
      firstName: '',
      lastName: '',
      phone: '',
      gender: 'other',
      ageBracket: 'youth',
      community: '',
      decisionType: params.decisionType || 'new_convert',
      wonByName: params.userName,
      winnerCell: params.winnerCell,
      winnerPcf: params.winnerPcf,
      winnerPhone: params.winnerPhone,
      wonAt: nowISO,
      followUpChurch: '',
      followUpStatus: 'not_started',
      consentGiven: false,
      notes: '',
      status: 'pending',
      detailsPending: true,
      captureMethod: 'tap',
      reconcileStatus: 'pending',
      tappedAt: nowISO,
      tappedByUserId: params.userId,
      tapLat: params.lat,
      tapLng: params.lng,
    };

    this.soulRecords.push(newRecord);
    playDingSound();

    const centre = this.centres.find(c => c.id === params.centreId);
    const centreName = centre ? centre.name : 'Abuja FCT Collation Hub';

    this.auditLogs.unshift({
      id: `audit-${Date.now()}`,
      timestamp: nowISO,
      actorName: params.userName,
      actorRole,
      action: 'CREATE_RECORD',
      targetType: 'record',
      targetId: newId,
      targetTitle: `Tap Tally (+1 Soul) by ${params.userName}`,
      centreName,
      details: `Quick tap tally recorded by ${params.userName} at ${centreName}.`,
      isAnomalyFlagged: burstWarning,
      metadata: burstWarning ? { reason: 'Implausible burst: >10 taps in 30 seconds' } : undefined,
    });

    // Sync tap record to Cloud Firestore
    firebaseSync.syncSoulRecord(newRecord).catch(err => {
      console.warn('[DataService] Tap record Firestore sync deferred:', err);
    });

    this.notifySubscribers();
    return { success: true, id: newId, burstWarning };
  }

  public recordSoulQuickNumber(params: {
    count: number;
    label?: string;
    userId: string;
    userName: string;
    centreId: string;
    decisionType?: DecisionType;
  }, actorRole: UserRole = 'field_worker'): { success: boolean; ids: string[] } {
    const nowISO = new Date().toISOString();
    const ids: string[] = [];

    for (let i = 0; i < params.count; i++) {
      const newId = `soul-qn-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 4)}`;
      ids.push(newId);
      const newRecord: SoulRecord = {
        id: newId,
        centreId: params.centreId,
        firstName: '',
        lastName: '',
        phone: '',
        gender: 'other',
        ageBracket: 'youth',
        community: params.label || 'Group Outreach',
        decisionType: params.decisionType || 'new_convert',
        wonByName: params.userName,
        wonAt: nowISO,
        followUpChurch: '',
        followUpStatus: 'not_started',
        consentGiven: false,
        notes: params.label ? `Batch label: ${params.label}` : 'Quick number group tally',
        status: 'pending',
        detailsPending: true,
        captureMethod: 'quick_number',
        reconcileStatus: 'pending',
        tappedAt: nowISO,
        tappedByUserId: params.userId,
      };
      this.soulRecords.push(newRecord);
    }

    playDingSound();
    const centre = this.centres.find(c => c.id === params.centreId);
    const centreName = centre ? centre.name : 'Abuja FCT Collation Hub';

    this.auditLogs.unshift({
      id: `audit-${Date.now()}`,
      timestamp: nowISO,
      actorName: params.userName,
      actorRole,
      action: 'CREATE_RECORD',
      targetType: 'record',
      targetId: ids[0] || 'group',
      targetTitle: `Quick Number Group Tally (${params.count} souls - ${params.label || 'Altar Call'})`,
      centreName,
      details: `Quick number group entry of ${params.count} souls recorded by ${params.userName}.`,
    });

    this.notifySubscribers();
    return { success: true, ids };
  }

  public undoSoulRecord(recordId: string, actorName: string = 'Field Worker'): boolean {
    const idx = this.soulRecords.findIndex(r => r.id === recordId && r.reconcileStatus === 'pending');
    if (idx !== -1) {
      this.soulRecords.splice(idx, 1);
      this.auditLogs.unshift({
        id: `audit-${Date.now()}`,
        timestamp: new Date().toISOString(),
        actorName,
        actorRole: 'field_worker',
        action: 'DELETE_RECORD',
        targetType: 'record',
        targetId: recordId,
        targetTitle: `Undo Tap Tally`,
        details: `Tapped record was undone/removed immediately by ${actorName}.`,
      });
      this.notifySubscribers();
      return true;
    }
    return false;
  }

  public reconcileSoulRecord(
    recordId: string,
    details: {
      firstName: string;
      lastName: string;
      phone: string;
      gender: Gender;
      ageBracket: AgeBracket;
      community: string;
      locality?: string;
      decisionType?: DecisionType;
      notes?: string;
      followUpChurch?: string;
    },
    actorName: string,
    actorRole: UserRole = 'field_worker'
  ): { success: boolean; anomalyFlagged: boolean; message?: string } {
    const record = this.soulRecords.find(r => r.id === recordId);
    if (!record) return { success: false, anomalyFlagged: false, message: 'Record not found' };

    const phoneNorm = validateAndNormalizeNigerianPhone(details.phone);
    const normalizedPhone = phoneNorm.isValid ? phoneNorm.normalized : details.phone;

    record.firstName = details.firstName;
    record.lastName = details.lastName;
    record.phone = normalizedPhone;
    record.gender = details.gender;
    record.ageBracket = details.ageBracket;
    record.community = details.community;
    record.locality = details.locality || details.community;
    if (details.decisionType) record.decisionType = details.decisionType;
    if (details.notes) record.notes = details.notes;
    if (details.followUpChurch) record.followUpChurch = details.followUpChurch;

    record.reconcileStatus = 'complete';
    record.reconciledAt = new Date().toISOString();
    record.reconciledByUserId = actorName;
    record.status = this.campaign.verificationRequired ? 'pending' : 'verified';
    record.detailsPending = false;

    playDingSound();
    const centre = this.centres.find(c => c.id === record.centreId);
    const centreName = centre ? centre.name : 'Abuja FCT Collation Hub';

    this.auditLogs.unshift({
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actorName,
      actorRole,
      action: 'EDIT_RECORD',
      targetType: 'record',
      targetId: recordId,
      targetTitle: `${details.firstName} ${details.lastName} (${formatNigerianPhone(normalizedPhone)})`,
      centreName,
      details: `Reconciled pending tap record with complete contact details by ${actorName}.`,
    });

    if (record.status === 'verified') {
      this.addTickerItem(centreName, 1, `${details.firstName} ${details.lastName} (${actorName})`);
      this.flashCentre(record.centreId);
      this.checkAndTriggerSmsMilestones(record.centreId);
    }

    // Sync reconciled record to Cloud Firestore
    firebaseSync.syncSoulRecord(record).catch(err => {
      console.warn('[DataService] Reconciled record Firestore sync deferred:', err);
    });

    this.notifySubscribers();
    return { success: true, anomalyFlagged: false };
  }

  public abandonSoulRecord(recordId: string, reason: string, actorName: string, actorRole: UserRole = 'field_worker'): boolean {
    const record = this.soulRecords.find(r => r.id === recordId);
    if (!record) return false;

    record.reconcileStatus = 'abandoned';
    record.abandonReason = reason;
    record.status = 'rejected';
    record.reconciledAt = new Date().toISOString();
    record.reconciledByUserId = actorName;

    const centre = this.centres.find(c => c.id === record.centreId);
    const centreName = centre ? centre.name : 'Abuja FCT Collation Hub';

    this.auditLogs.unshift({
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actorName,
      actorRole,
      action: 'REJECT_BATCH',
      targetType: 'record',
      targetId: recordId,
      targetTitle: `Abandoned Tap Record`,
      centreName,
      details: `Tap record marked as abandoned by ${actorName}. Reason: "${reason}". Retained for audit trail.`,
    });

    this.notifySubscribers();
    return true;
  }

  public reassignSoulRecord(recordId: string, newUserId: string, newUserName: string, actorName: string): boolean {
    const record = this.soulRecords.find(r => r.id === recordId);
    if (!record) return false;

    record.tappedByUserId = newUserId;
    record.wonByName = newUserName;

    this.auditLogs.unshift({
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actorName,
      actorRole: 'coordinator',
      action: 'EDIT_RECORD',
      targetType: 'record',
      targetId: recordId,
      targetTitle: `Reassigned Record to ${newUserName}`,
      details: `Coordinator ${actorName} reassigned pending record to field worker ${newUserName}.`,
    });

    this.notifySubscribers();
    return true;
  }

  public nudgeWorker(workerName: string, actorName: string): boolean {
    this.auditLogs.unshift({
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actorName,
      actorRole: 'coordinator',
      action: 'UPDATE_CAMPAIGN',
      targetType: 'record',
      targetId: 'nudge',
      targetTitle: `Nudge sent to ${workerName}`,
      details: `Coordinator ${actorName} sent an in-app reminder nudge to ${workerName} for pending soul reconciliation.`,
    });
    this.notifySubscribers();
    return true;
  }

  public attachPhoneToRecord(
    recordId: string,
    phoneInput: string,
    actorName: string = 'Field Worker',
    forceOverrideDuplicate: boolean = false
  ): { success: boolean; isDuplicate?: boolean; matchedRecord?: SoulRecord; message?: string } {
    const record = this.soulRecords.find(r => r.id === recordId);
    if (!record) return { success: false, message: 'Record not found' };

    const phoneNorm = validateAndNormalizeNigerianPhone(phoneInput);
    const normalizedPhone = phoneNorm.isValid ? phoneNorm.normalized : phoneInput.trim();

    if (!forceOverrideDuplicate && normalizedPhone) {
      const existing = this.soulRecords.find(
        r => !r.isDeleted && r.id !== recordId && r.phone && r.phone === normalizedPhone
      );
      if (existing) {
        return { success: false, isDuplicate: true, matchedRecord: existing };
      }
    }

    record.phone = normalizedPhone;
    record.phoneNeedsReview = !phoneNorm.isValid;

    if (record.firstName && record.locality) {
      record.reconcileStatus = 'complete';
      record.detailsPending = false;
      record.status = this.campaign.verificationRequired ? 'pending' : 'verified';
    } else {
      record.reconcileStatus = 'contactable';
    }

    record.reconciledAt = new Date().toISOString();
    record.reconciledByUserId = actorName;

    this.auditLogs.unshift({
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actorName,
      actorRole: 'field_worker',
      action: 'EDIT_RECORD',
      targetType: 'record',
      targetId: recordId,
      targetTitle: `Attached Phone ${formatNigerianPhone(normalizedPhone)}`,
      details: `Field worker ${actorName} attached phone number to tap record.`,
    });

    this.notifySubscribers();
    return { success: true };
  }

  public getReconciliationStats(centreId?: string, areaCouncilId?: string) {
    let recs = this.soulRecords.filter(r => !r.isDeleted);
    if (centreId) recs = recs.filter(r => r.centreId === centreId);
    if (areaCouncilId) {
      const centreIdsInCouncil = this.centres.filter(c => c.areaCouncilId === areaCouncilId || c.areaCouncilCode.toLowerCase() === areaCouncilId.toLowerCase()).map(c => c.id);
      recs = recs.filter(r => centreIdsInCouncil.includes(r.centreId));
    }

    const totalTapped = recs.length;
    const totalAbandoned = recs.filter(r => r.reconcileStatus === 'abandoned').length;
    const totalComplete = recs.filter(r => r.reconcileStatus === 'complete' || (r.firstName && r.locality && r.phone)).length;
    const totalContactable = recs.filter(r => r.reconcileStatus === 'contactable' || r.reconcileStatus === 'complete' || (r.phone && r.phone.trim() !== '')).length;
    const totalPending = recs.filter(r => r.reconcileStatus === 'pending' || (!r.phone && !r.firstName && r.reconcileStatus !== 'abandoned')).length;

    const reconciliationRate = totalTapped > 0 ? Math.round((totalComplete / totalTapped) * 1000) / 10 : 100;
    const contactableRate = totalTapped > 0 ? Math.round((totalContactable / totalTapped) * 1000) / 10 : 100;

    return {
      totalTapped,
      totalComplete,
      totalContactable,
      totalPending,
      totalAbandoned,
      reconciliationRate,
      contactableRate,
      totalReconciled: totalComplete,
    };
  }

  public getWorkerReconciliationStats(centreId?: string) {
    let recs = this.soulRecords.filter(r => !r.isDeleted);
    if (centreId) recs = recs.filter(r => r.centreId === centreId);

    const workerMap = new Map<string, { userName: string; tappedCount: number; contactableCount: number; reconciledCount: number; pendingCount: number; abandonedCount: number; lastActivityAt: string }>();

    recs.forEach(r => {
      const workerName = r.wonByName || r.tappedByUserId || 'Field Evangelist';
      if (!workerMap.has(workerName)) {
        workerMap.set(workerName, {
          userName: workerName,
          tappedCount: 0,
          contactableCount: 0,
          reconciledCount: 0,
          pendingCount: 0,
          abandonedCount: 0,
          lastActivityAt: r.wonAt || r.tappedAt || new Date().toISOString(),
        });
      }
      const stats = workerMap.get(workerName)!;
      stats.tappedCount++;
      if (r.reconcileStatus === 'complete' || (r.firstName && r.locality && r.phone)) {
        stats.reconciledCount++;
        stats.contactableCount++;
      } else if (r.reconcileStatus === 'contactable' || (r.phone && r.phone.trim() !== '')) {
        stats.contactableCount++;
      } else if (r.reconcileStatus === 'abandoned') {
        stats.abandonedCount++;
      } else {
        stats.pendingCount++;
      }
      const timeR = new Date(r.wonAt || r.tappedAt || 0).getTime();
      const timeCurr = new Date(stats.lastActivityAt).getTime();
      if (timeR > timeCurr) {
        stats.lastActivityAt = r.wonAt || r.tappedAt || stats.lastActivityAt;
      }
    });

    return Array.from(workerMap.values()).map(w => ({
      ...w,
      rate: w.tappedCount > 0 ? Math.round((w.reconciledCount / w.tappedCount) * 1000) / 10 : 100,
      contactableRate: w.tappedCount > 0 ? Math.round((w.contactableCount / w.tappedCount) * 1000) / 10 : 100,
    })).sort((a, b) => b.tappedCount - a.tappedCount);
  }

  public addBatch(
    batch: Omit<Batch, 'id' | 'submittedAt' | 'status'>,
    actorName: string = 'Field Coordinator',
    actorRole: UserRole = 'coordinator'
  ): { success: boolean; id: string } {
    const newId = `batch-${Date.now()}`;
    const newBatch: Batch = {
      ...batch,
      id: newId,
      submittedAt: new Date().toISOString(),
      status: this.campaign.verificationRequired ? 'pending' : 'verified',
    };

    this.batches.push(newBatch);
    playDingSound();

    const centre = this.centres.find(c => c.id === batch.centreId);
    const centreName = centre ? centre.name : 'Abuja FCT Collation Hub';

    this.auditLogs.unshift({
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actorName,
      actorRole,
      action: 'CREATE_BATCH',
      targetType: 'batch',
      targetId: newId,
      targetTitle: `${batch.sessionLabel} (${batch.count} souls)`,
      centreName,
      details: `Submitted batch report of ${batch.count} souls won during outreach at ${centreName}.`,
    });

    if (newBatch.status === 'verified') {
      this.addTickerItem(centreName, batch.count, batch.submittedByName, {
        newConverts: batch.newConverts,
        rededications: batch.rededications,
        returnees: batch.returnees,
      });
      this.flashCentre(batch.centreId);
    }

    // Sync to Cloud Firestore
    firebaseSync.syncBatch(newBatch).catch(err => {
      console.warn('[DataService] Batch Firestore sync deferred:', err);
    });

    this.notifySubscribers();
    return { success: true, id: newId };
  }

  public approveBatch(batchId: string, actorName: string, actorRole: UserRole): boolean {
    const batch = this.batches.find(b => b.id === batchId);
    if (!batch) return false;

    batch.status = 'verified';

    const centre = this.centres.find(c => c.id === batch.centreId);
    const centreName = centre ? centre.name : 'Abuja FCT Collation Hub';

    this.auditLogs.unshift({
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actorName,
      actorRole,
      action: 'APPROVE_BATCH',
      targetType: 'batch',
      targetId: batch.id,
      targetTitle: `${batch.sessionLabel} (${batch.count} souls)`,
      centreName,
      details: `Verified and approved batch report of ${batch.count} souls for ${centreName}.`,
      changes: {
        status: { from: 'pending', to: 'verified' },
      },
    });

    this.addTickerItem(centreName, batch.count, batch.submittedByName, {
      newConverts: batch.newConverts,
      rededications: batch.rededications,
      returnees: batch.returnees,
    });
    this.flashCentre(batch.centreId);

    this.notifySubscribers();
    return true;
  }

  public rejectBatch(batchId: string, reason: string, actorName: string, actorRole: UserRole): boolean {
    const batch = this.batches.find(b => b.id === batchId);
    if (!batch) return false;

    batch.status = 'rejected';
    batch.rejectionReason = reason;

    const centre = this.centres.find(c => c.id === batch.centreId);
    const centreName = centre ? centre.name : 'Abuja FCT Collation Hub';

    this.auditLogs.unshift({
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actorName,
      actorRole,
      action: 'REJECT_BATCH',
      targetType: 'batch',
      targetId: batch.id,
      targetTitle: `${batch.sessionLabel} (${batch.count} souls)`,
      centreName,
      details: `Rejected batch report of ${batch.count} souls: "${reason}".`,
      changes: {
        status: { from: 'pending', to: 'rejected' },
        rejectionReason: { from: null, to: reason },
      },
    });

    this.notifySubscribers();
    return true;
  }

  public approveSoulRecord(recordId: string, actorName: string, actorRole: UserRole): boolean {
    const record = this.soulRecords.find(r => r.id === recordId);
    if (!record) return false;

    record.status = 'verified';

    const centre = this.centres.find(c => c.id === record.centreId);
    const centreName = centre ? centre.name : 'Abuja FCT Collation Hub';

    this.auditLogs.unshift({
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actorName,
      actorRole,
      action: 'APPROVE_RECORD',
      targetType: 'record',
      targetId: record.id,
      targetTitle: `${record.firstName} ${record.lastName}`,
      centreName,
      details: `Verified convert record for ${record.firstName} ${record.lastName}.`,
      changes: {
        status: { from: 'pending', to: 'verified' },
      },
    });

    this.addTickerItem(centreName, 1, `${record.firstName} ${record.lastName} (${record.wonByName})`);
    this.flashCentre(record.centreId);

    this.notifySubscribers();
    return true;
  }

  public rejectSoulRecord(recordId: string, reason: string, actorName: string, actorRole: UserRole): boolean {
    const record = this.soulRecords.find(r => r.id === recordId);
    if (!record) return false;

    record.status = 'rejected';
    record.rejectionReason = reason;

    const centre = this.centres.find(c => c.id === record.centreId);
    const centreName = centre ? centre.name : 'Abuja FCT Collation Hub';

    this.auditLogs.unshift({
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actorName,
      actorRole,
      action: 'REJECT_RECORD',
      targetType: 'record',
      targetId: record.id,
      targetTitle: `${record.firstName} ${record.lastName}`,
      centreName,
      details: `Rejected convert record for ${record.firstName} ${record.lastName}: "${reason}".`,
      changes: {
        status: { from: 'pending', to: 'rejected' },
        rejectionReason: { from: null, to: reason },
      },
    });

    this.notifySubscribers();
    return true;
  }

  public softDeleteSoulRecord(
    recordId: string,
    actorName: string,
    actorRole: UserRole,
    reason: string = 'Soft deleted by coordinator'
  ): boolean {
    const record = this.soulRecords.find(r => r.id === recordId);
    if (!record) return false;

    record.isDeleted = true;
    record.deletedAt = new Date().toISOString();
    record.deletedBy = actorName;
    record.deleteReason = reason;

    const centre = this.centres.find(c => c.id === record.centreId);
    const centreName = centre ? centre.name : 'Abuja FCT Collation Hub';

    this.auditLogs.unshift({
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actorName,
      actorRole,
      action: 'DELETE_RECORD',
      targetType: 'record',
      targetId: record.id,
      targetTitle: `${record.firstName} ${record.lastName} (${formatNigerianPhone(record.phone)})`,
      centreName,
      details: `Archived and soft-deleted convert record: "${reason}". Retained in audit trail.`,
      changes: {
        isDeleted: { from: false, to: true },
        deleteReason: { from: null, to: reason },
      },
    });

    this.notifySubscribers();
    return true;
  }

  public deleteSoulRecord(recordId: string, actorName: string, actorRole: UserRole, reason?: string): boolean {
    return this.softDeleteSoulRecord(recordId, actorName, actorRole, reason);
  }

  public restoreDeletedSoulRecord(recordId: string, actorName: string, actorRole: UserRole): boolean {
    const record = this.soulRecords.find(r => r.id === recordId);
    if (!record) return false;

    record.isDeleted = false;
    record.deletedAt = undefined;
    record.deletedBy = undefined;
    record.deleteReason = undefined;

    const centre = this.centres.find(c => c.id === record.centreId);
    const centreName = centre ? centre.name : 'Abuja FCT Collation Hub';

    this.auditLogs.unshift({
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actorName,
      actorRole,
      action: 'RESTORE_RECORD',
      targetType: 'record',
      targetId: record.id,
      targetTitle: `${record.firstName} ${record.lastName}`,
      centreName,
      details: `Restored previously archived convert record to active registry.`,
      changes: {
        isDeleted: { from: true, to: false },
      },
    });

    this.notifySubscribers();
    return true;
  }

  public restoreSoulRecord(recordId: string, actorName: string, actorRole: UserRole): boolean {
    return this.restoreDeletedSoulRecord(recordId, actorName, actorRole);
  }

  public approveAllPending(reviewerName: string = 'Coordinator Desk', reviewerRole: UserRole = 'coordinator'): boolean {
    let count = 0;
    this.batches.forEach(b => {
      if (b.status === 'pending' && !b.isDeleted) {
        b.status = 'verified';
        b.verifiedAt = new Date().toISOString();
        b.verifiedBy = reviewerName;
        count++;
      }
    });
    this.soulRecords.forEach(r => {
      if (r.status === 'pending' && !r.isDeleted) {
        r.status = 'verified';
        r.verifiedAt = new Date().toISOString();
        r.verifiedBy = reviewerName;
        count++;
      }
    });

    this.auditLogs.unshift({
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actorName: reviewerName,
      actorRole: reviewerRole,
      action: 'APPROVE_BATCH',
      targetType: 'batch',
      targetId: 'all-pending',
      targetTitle: 'Bulk Verification',
      details: `Approved and verified ${count} pending field submissions in queue.`,
    });

    this.notifySubscribers();
    return true;
  }

  public updateFollowUp(
    recordId: string,
    update: { status: FollowUpStatus; notes?: string; followUpChurch?: string }
  ): boolean {
    const record = this.soulRecords.find(r => r.id === recordId);
    if (!record) return false;

    const oldStatus = record.followUpStatus;
    record.followUpStatus = update.status;
    if (update.notes !== undefined) record.notes = update.notes;
    if (update.followUpChurch !== undefined) record.followUpChurch = update.followUpChurch;

    const centre = this.centres.find(c => c.id === record.centreId);
    const centreName = centre ? centre.name : 'Abuja FCT Collation Hub';

    this.auditLogs.unshift({
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actorName: 'Follow-Up Team',
      actorRole: 'coordinator',
      action: 'EDIT_RECORD',
      targetType: 'record',
      targetId: record.id,
      targetTitle: `${record.firstName} ${record.lastName}`,
      centreName,
      details: `Updated discipleship status to "${update.status}" and assigned ${record.followUpChurch || 'church assembly'}.`,
      changes: {
        followUpStatus: { from: oldStatus, to: update.status },
      },
    });

    this.notifySubscribers();
    return true;
  }

  public getBatchAnomalies(batch: Batch): SubmissionAnomaly[] {
    const anomalies: SubmissionAnomaly[] = [];

    // High volume spike
    if (batch.count >= 50) {
      anomalies.push({
        type: 'HIGH_VOLUME_SPIKE',
        level: batch.count >= 100 ? 'critical' : 'warning',
        title: 'High Collation Volume',
        description: `Batch contains ${batch.count} souls. Standard field batch averages 15–30 souls.`,
        metric: `+${batch.count} souls in single submission`,
      });
    }

    // Off hours anomaly (submitted between 11 PM and 5 AM WAT)
    const date = new Date(batch.submittedAt);
    const hour = date.getUTCHours() + 1; // WAT UTC+1
    const normalizedHour = (hour + 24) % 24;
    if (normalizedHour >= 23 || normalizedHour < 5) {
      anomalies.push({
        type: 'OFF_HOURS',
        level: 'warning',
        title: 'Off-Hours Transmission',
        description: `Batch transmitted at ${formatTimeWAT(date)} WAT outside typical evangelism operating hours.`,
        metric: `Submitted at ${formatTimeWAT(date)} WAT`,
      });
    }

    return anomalies;
  }

  public getRecordAnomalies(record: SoulRecord): SubmissionAnomaly[] {
    const anomalies: SubmissionAnomaly[] = [];

    if (record.duplicateOverrideReason) {
      anomalies.push({
        type: 'POTENTIAL_DUPLICATE',
        level: 'warning',
        title: 'Duplicate Phone Override',
        description: `Override Reason: "${record.duplicateOverrideReason}".`,
        metric: formatNigerianPhone(record.phone),
      });
    } else {
      const match = this.soulRecords.find(
        r => !r.isDeleted && r.id !== record.id && r.phone && r.phone === record.phone
      );
      if (match) {
        anomalies.push({
          type: 'POTENTIAL_DUPLICATE',
          level: 'critical',
          title: 'Duplicate Phone Number',
          description: `Matches existing convert ${match.firstName} ${match.lastName} (${match.id}).`,
          metric: formatNigerianPhone(record.phone),
        });
      }
    }

    return anomalies;
  }

  private sessionTimer: CampaignSessionTimer = {
    mode: 'countdown',
    status: 'idle',
    durationMs: 7200000, // 2h
    scheduledStartAt: null,
    startedAt: null,
    endsAt: null,
    pausedAt: null,
    totalPausedMs: 0,
    label: 'Evening Crusade — Session 1',
    endBehaviour: 'celebrate_total',
    baselineSouls: 0,
    unlockedManually: false,
  };

  public getSessionTimer(): CampaignSessionTimer {
    return { ...this.sessionTimer };
  }

  public startSessionTimer(config?: {
    mode?: 'countdown' | 'countup';
    durationMs?: number;
    label?: string;
    endBehaviour?: 'show_zero' | 'lock_submissions' | 'celebrate_total';
  }): void {
    if (config) {
      if (config.mode) this.sessionTimer.mode = config.mode;
      if (config.durationMs !== undefined) this.sessionTimer.durationMs = config.durationMs;
      if (config.label) this.sessionTimer.label = config.label;
      if (config.endBehaviour) this.sessionTimer.endBehaviour = config.endBehaviour;
    }

    const now = Date.now();
    this.sessionTimer.status = 'running';
    this.sessionTimer.startedAt = new Date(now).toISOString();
    this.sessionTimer.pausedAt = null;
    this.sessionTimer.totalPausedMs = 0;
    this.sessionTimer.baselineSouls = this.getStats().totalSouls;
    this.sessionTimer.unlockedManually = false;

    if (this.sessionTimer.mode === 'countdown') {
      this.sessionTimer.endsAt = new Date(now + this.sessionTimer.durationMs).toISOString();
    } else {
      this.sessionTimer.endsAt = null;
    }

    this.notifySubscribers();
  }

  public scheduleSessionTimer(scheduledIso: string, config?: {
    mode?: 'countdown' | 'countup';
    durationMs?: number;
    label?: string;
    endBehaviour?: 'show_zero' | 'lock_submissions' | 'celebrate_total';
  }): void {
    if (config) {
      if (config.mode) this.sessionTimer.mode = config.mode;
      if (config.durationMs !== undefined) this.sessionTimer.durationMs = config.durationMs;
      if (config.label) this.sessionTimer.label = config.label;
      if (config.endBehaviour) this.sessionTimer.endBehaviour = config.endBehaviour;
    }

    this.sessionTimer.status = 'scheduled';
    this.sessionTimer.scheduledStartAt = scheduledIso;
    this.notifySubscribers();
  }

  public cancelSessionTimerSchedule(): void {
    this.sessionTimer.status = 'idle';
    this.sessionTimer.scheduledStartAt = null;
    this.notifySubscribers();
  }

  public pauseSessionTimer(): void {
    if (this.sessionTimer.status !== 'running') return;
    this.sessionTimer.status = 'paused';
    this.sessionTimer.pausedAt = new Date().toISOString();
    this.notifySubscribers();
  }

  public resumeSessionTimer(): void {
    if (this.sessionTimer.status !== 'paused') return;
    const now = Date.now();
    if (this.sessionTimer.pausedAt) {
      const pausedDuration = now - new Date(this.sessionTimer.pausedAt).getTime();
      this.sessionTimer.totalPausedMs += pausedDuration;
      if (this.sessionTimer.endsAt) {
        this.sessionTimer.endsAt = new Date(new Date(this.sessionTimer.endsAt).getTime() + pausedDuration).toISOString();
      }
    }
    this.sessionTimer.status = 'running';
    this.sessionTimer.pausedAt = null;
    this.notifySubscribers();
  }

  public stopSessionTimer(): void {
    this.sessionTimer.status = 'finished';
    this.sessionTimer.pausedAt = null;
    this.notifySubscribers();
  }

  public resetSessionTimer(): void {
    this.sessionTimer.status = 'idle';
    this.sessionTimer.startedAt = null;
    this.sessionTimer.endsAt = null;
    this.sessionTimer.pausedAt = null;
    this.sessionTimer.totalPausedMs = 0;
    this.sessionTimer.unlockedManually = false;
    this.notifySubscribers();
  }

  public extendSessionTimer(minutes: number): void {
    const ms = minutes * 60 * 1000;
    this.sessionTimer.durationMs += ms;
    if (this.sessionTimer.endsAt) {
      this.sessionTimer.endsAt = new Date(new Date(this.sessionTimer.endsAt).getTime() + ms).toISOString();
    } else {
      this.sessionTimer.endsAt = new Date(Date.now() + ms).toISOString();
      this.sessionTimer.mode = 'countdown';
    }
    if (this.sessionTimer.status === 'finished') {
      this.sessionTimer.status = 'running';
    }
    this.notifySubscribers();
  }

  public unlockSubmissions(): void {
    this.sessionTimer.unlockedManually = true;
    this.notifySubscribers();
  }

  public getCachedAppState(): CachedAppState {
    const stats = this.getStats();
    const areaCouncilStats = this.getAreaCouncilBreakdown();
    const recentRecords = this.getSoulRecords().slice(0, 15);
    const decisionBreakdown = this.getDecisionBreakdown();
    const hourlyTrend = this.getHourlyTrend();
    const dailyCumulative = this.getDailyCumulative();
    const standings = this.getCentreStandings();

    return {
      cachedAt: new Date().toISOString(),
      campaign: this.getCampaign(),
      stats,
      centres: this.getCentres(),
      areaCouncils: this.getAreaCouncils(),
      regions: this.getAreaCouncils(), // Compatibility
      recentRecords,
      decisionBreakdown,
      areaCouncilStats,
      regionalStats: areaCouncilStats, // Compatibility
      hourlyTrend,
      dailyCumulative,
      standings,
    };
  }

  // ==========================================
  // MEDIA & TESTIMONIES MANAGEMENT
  // ==========================================
  private seedTestimonies() {
    const now = Date.now();
    this.testimonies = [
      {
        id: 'test-med-1',
        title: '32 Youth Surrender to Christ at Wuse II Street Rally',
        contributorName: 'Bro. Emmanuel Eze',
        centreId: 'cnt-amac-02',
        centreName: 'Wuse II Centre',
        areaCouncilCode: 'AMAC',
        mediaType: 'picture',
        url: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=1200&q=80',
        caption: 'Glorious outreach session along Ademola Adetokunbo Crescent! 32 youth surrendered their lives to Christ and received the Holy Spirit.',
        createdAt: new Date(now - 45 * 60 * 1000).toISOString(),
        isFeatured: true,
        likesCount: 68,
        approved: true,
      },
      {
        id: 'test-med-2',
        title: 'Audio Testimony: Instant Salvation & Peace at Area 1 Hub',
        contributorName: 'Sister Blessing Okafor',
        centreId: 'cnt-amac-01',
        centreName: 'Garki Centre',
        areaCouncilCode: 'AMAC',
        mediaType: 'audio_testimony',
        url: 'https://cdn.freesound.org/previews/320/320655_5260872-lq.mp3',
        durationSeconds: 42,
        caption: 'Listen as Sister Blessing shares how a young mother accepted Jesus with tears of joy at the Area 1 bus stop during the afternoon soul-winning surge.',
        createdAt: new Date(now - 75 * 60 * 1000).toISOString(),
        isFeatured: true,
        likesCount: 54,
        approved: true,
      },
      {
        id: 'test-med-3',
        title: 'Video Testimony: 1-Min Miracle Confession in Kubwa',
        contributorName: 'Pastor David Adeleke',
        centreId: 'cnt-bwr-01',
        centreName: 'Kubwa Centre',
        areaCouncilCode: 'BWARI',
        mediaType: 'video_testimony',
        url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
        thumbnailUrl: 'https://images.unsplash.com/photo-1438232992991-995b7058bbb3?auto=format&fit=crop&w=1200&q=80',
        durationSeconds: 58,
        caption: 'Bro. Tunde was on his way to work when our evangelism team reached him. In less than 5 minutes he gave his heart to Jesus! Watch his radiant confession.',
        createdAt: new Date(now - 110 * 60 * 1000).toISOString(),
        isFeatured: true,
        likesCount: 112,
        approved: true,
      },
      {
        id: 'test-med-4',
        title: 'Market Women Harvest in Gwagwalada Main Market',
        contributorName: 'Deacon Samuel Bello',
        centreId: 'cnt-gwg-01',
        centreName: 'Gwagwalada Centre',
        areaCouncilCode: 'GWAGWALADA',
        mediaType: 'picture',
        url: 'https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?auto=format&fit=crop&w=1200&q=80',
        caption: '18 shop owners in Gwagwalada market prayed the salvation prayer this morning. God’s Word is prevailing mightily across the FCT!',
        createdAt: new Date(now - 180 * 60 * 1000).toISOString(),
        isFeatured: true,
        likesCount: 79,
        approved: true,
      },
    ];
  }

  public getTestimonies(): TestimonyMediaItem[] {
    return [...this.testimonies].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  public getFeaturedTestimonies(): TestimonyMediaItem[] {
    return this.getTestimonies().filter((t) => t.isFeatured && t.approved);
  }

  public async addTestimony(
    payload: Omit<TestimonyMediaItem, 'id' | 'createdAt' | 'likesCount'>,
    mediaBlob?: Blob
  ): Promise<TestimonyMediaItem> {
    const id = `test-med-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const newItem: TestimonyMediaItem = {
      ...payload,
      id,
      createdAt: new Date().toISOString(),
      likesCount: 1,
    };

    if (mediaBlob) {
      newItem.blobKey = id;
      await saveMediaBlobToDB(id, mediaBlob);
    }

    this.testimonies.unshift(newItem);
    await saveMediaMetaToDB(newItem);
    this.notifySubscribers();

    // Also add to live ticker
    this.addTickerItem(newItem.centreName, 1, `${newItem.contributorName} (${newItem.title})`);

    return newItem;
  }

  public toggleFeatureTestimony(id: string): void {
    const item = this.testimonies.find((t) => t.id === id);
    if (item) {
      item.isFeatured = !item.isFeatured;
      saveMediaMetaToDB(item);
      this.notifySubscribers();
    }
  }

  public toggleApproveTestimony(id: string): void {
    const item = this.testimonies.find((t) => t.id === id);
    if (item) {
      item.approved = !item.approved;
      saveMediaMetaToDB(item);
      this.notifySubscribers();
    }
  }

  public likeTestimony(id: string): void {
    const item = this.testimonies.find((t) => t.id === id);
    if (item) {
      item.likesCount = (item.likesCount || 0) + 1;
      saveMediaMetaToDB(item);
      this.notifySubscribers();
    }
  }

  public async deleteTestimony(id: string): Promise<void> {
    this.testimonies = this.testimonies.filter((t) => t.id !== id);
    await deleteMediaFromDB(id);
    this.notifySubscribers();
  }
}

export const dataService = new DataService();
