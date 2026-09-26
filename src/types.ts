import { AreaCouncilCode } from './data/fctLocations';

export type CollationMode = 'demo' | 'live';

export type UserRole =
  | 'public'        // Observer (Not logged in user - view only, no field records)
  | 'soul_winner'   // Soul Winner (Normal user who inputs data)
  | 'pastor'        // Pastor (Church pastor tracking their church goals)
  | 'group_pastor'  // Group Pastor (Oversees multiple church centres)
  | 'zonal_pastor'  // Zonal Pastor (God's eye view of the entire zone)
  | 'admin'         // Admin (Controls data, push notifications, reconciliation, audit)
  | 'coordinator';  // Coordinator desk (Operations desk alias)

export type Gender = 'male' | 'female' | 'other';

export type AgeBracket = 'child' | 'youth' | 'adult' | 'senior';

export type DecisionType = 'new_convert' | 'rededication' | 'returnee';

export type FollowUpStatus = 'not_started' | 'contacted' | 'visited' | 'integrated' | 'unreachable';

export type RecordStatus = 'pending' | 'verified' | 'rejected';

export interface Campaign {
  id: string;
  name: string;
  target: number;
  startDate: string;
  endDate: string;
  verse: string;
  verificationRequired: boolean;
  hideIndividualLeaderboard?: boolean;
  announcement?: string;
  customLogoUrl?: string;
  smsConfig?: {
    enabled: boolean;
    thresholds: number[]; // e.g. [25, 50, 75]
  };
}

export interface AreaCouncil {
  id: string;
  name: string;
  code: string;
  target: number;
}

// Backward compatibility alias
export type Region = AreaCouncil;

export interface Centre {
  id: string;
  code: string;
  name: string;
  groupName?: string; // Group or Sub-Group category e.g. "Wuye Sub-Group 1", "Karmo Group"
  areaCouncilId: string;
  regionId?: string; // Compatibility alias to areaCouncilId
  areaCouncilCode?: AreaCouncilCode;
  ward?: string;
  locality?: string;
  venue: string;
  coordinatorName: string;
  contactPhone: string;
  target: number;
  active: boolean;
}

export type CaptureMethod = 'tap' | 'quick_number' | 'full_form' | 'self_registered';
export type ReconcileStatus = 'pending' | 'contactable' | 'complete' | 'abandoned';

export interface SoulWinnerProfile {
  id: string;
  fullName: string;
  phone: string;
  email?: string;
  cellName: string; // e.g. "Grace Cell", "Royalty Cell"
  pcfName: string; // Pastoral Care Fellowship / Church Group e.g. "Haven PCF", "Kings PCF"
  churchCentreId: string; // Collation centre / Church ID
  churchName?: string;
  assignedGroup?: string; // Group jurisdiction for Group Pastors e.g. "Kubwa Group", "Wuye Group", "Zonal Church Group"
  roleTitle?: string; // e.g. "Member", "Cell Leader", "Assistant Cell Leader", "BSCT", "PCF Leader"
  registeredAt: string;
}

export interface SoulWinnerSummary {
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
  totalSoulsWon: number;
  recordSoulsCount: number;
  batchSoulsCount: number;
  newConvertsCount: number;
  rededicationsCount: number;
  returneesCount: number;
  verifiedCount: number;
  pendingCount: number;
  firstSoulAt?: string;
  lastSoulAt?: string;
  primaryOutreachSpots: string[];
  primaryResidentialDistricts: string[];
  souls: SoulRecord[];
}

export interface SoulRecord {
  id: string;
  centreId: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  gender: Gender;
  ageBracket: AgeBracket;
  community: string; // Free-text or selected locality name
  locality?: string;
  ward?: string;
  isCrossCouncil?: boolean;
  decisionType: DecisionType;
  wonByName: string;
  wonAt: string; // ISO string
  followUpChurch: string;
  followUpStatus: FollowUpStatus;
  consentGiven: boolean;
  notes: string;
  status: RecordStatus;
  // Where soul was won
  outreachSpot?: string;
  areaCouncil?: string;
  // Where soul actually lives (Residential Address & District)
  residentialAddress?: string; // Street name, house/flat # or landmark
  residentialDistrict?: string; // Neighborhood/town (e.g. Lugbe, Lokogoma, Kubwa)
  residentialAreaCouncil?: AreaCouncilCode | 'OTHER';
  // Soul Winner Details (Hierarchy: Winner -> Cell -> PCF/Group -> Church)
  winnerPhone?: string;
  winnerCell?: string; // Cell unit e.g. "Grace Cell"
  winnerPcf?: string; // Pastoral Care Fellowship / Church Group e.g. "Haven PCF"
  winnerChurch?: string;
  groupName?: string;
  areaCouncilCode?: AreaCouncilCode;
  rejectionReason?: string;
  verifiedAt?: string;
  verifiedBy?: string;
  verificationMethod?: 'sms' | 'whatsapp' | 'manual' | 'call' | 'qr';
  lastMessageSentAt?: string;
  lastMessageType?: 'whatsapp' | 'sms';
  lastMessageText?: string;
  detailsPending: boolean;
  duplicateOverrideReason?: string;
  phoneNeedsReview?: boolean;
  isDeleted?: boolean;
  deletedAt?: string;
  deletedBy?: string;
  deleteReason?: string;
  qrCode?: string;
  isArchived?: boolean;
  archivedAt?: string;
  captureMethod?: CaptureMethod;
  reconcileStatus?: ReconcileStatus;
  tappedAt?: string;
  tappedByUserId?: string;
  reconciledAt?: string;
  reconciledByUserId?: string;
  tapLat?: number;
  tapLng?: number;
  abandonReason?: string;
  // Automated Bulk SMS Gateway Verification Tracking
  smsGatewayStatus?: 'delivered' | 'undelivered' | 'failed' | 'dnd_blocked' | 'pending';
  smsDeliveryReceiptId?: string;
  smsDeliveredAt?: string;
  smsCarrier?: string;
  smsFailureReason?: string;
  smsDispatchedAt?: string;
  smsRetryCount?: number;
}

export type SmsDeliveryStatus = 'delivered' | 'undelivered' | 'failed' | 'dnd_blocked' | 'pending';

export interface SmsGatewayTelemetry {
  providerName: string;
  senderId: string;
  connected: boolean;
  totalDispatched: number;
  totalDelivered: number;
  totalFailed: number;
  totalDndBlocked: number;
  deliveryRate: number;
  carrierBreakdown: {
    carrier: string;
    sent: number;
    delivered: number;
    rate: number;
  }[];
}

export interface ResidentialAreaStats {
  areaCouncilId: string;
  areaCouncilName: string;
  code: string;
  count: number;
  percentageOfTotal: number;
}

export interface ResidentialDistrictCluster {
  district: string;
  areaCouncilCode: string;
  count: number;
  percentage: number;
  sampleAddress?: string;
  recommendedBusRoute?: string;
}

export interface OutreachVsResidentialPoint {
  areaCouncilId: string;
  areaCouncilName: string;
  code: string;
  outreachCount: number; // souls won here
  residentialCount: number; // converts living here
  netInflow: number; // residentialCount - outreachCount
}

export interface Batch {
  id: string;
  centreId: string;
  submittedByName: string;
  winnerPhone?: string;
  winnerCell?: string;
  winnerPcf?: string;
  groupName?: string;
  areaCouncilCode?: AreaCouncilCode;
  sessionLabel: string;
  count: number;
  newConverts: number;
  rededications: number;
  returnees: number;
  status: RecordStatus;
  rejectionReason?: string;
  verifiedAt?: string;
  verifiedBy?: string;
  submittedAt: string; // ISO string
  note?: string;
  isDeleted?: boolean;
  deletedAt?: string;
  deletedBy?: string;
  deleteReason?: string;
}

export type AnomalyType = 'HIGH_VOLUME_SPIKE' | 'OFF_HOURS' | 'POTENTIAL_DUPLICATE';

export interface SubmissionAnomaly {
  type: AnomalyType;
  level: 'warning' | 'critical';
  title: string;
  description: string;
  metric?: string;
}

export type AuditActionType =
  | 'CREATE_RECORD'
  | 'EDIT_RECORD'
  | 'APPROVE_RECORD'
  | 'REJECT_RECORD'
  | 'DELETE_RECORD'
  | 'RESTORE_RECORD'
  | 'CREATE_BATCH'
  | 'APPROVE_BATCH'
  | 'REJECT_BATCH'
  | 'UPDATE_CAMPAIGN'
  | 'UPDATE_CENTRE';

export interface AuditLogEntry {
  id: string;
  timestamp: string; // ISO string
  actorName: string;
  actorRole: UserRole;
  action: AuditActionType;
  targetType: 'record' | 'batch' | 'campaign' | 'centre';
  targetId: string;
  targetTitle: string;
  centreName?: string;
  details: string;
  changes?: Record<string, { from: any; to: any }>;
  isAnomalyFlagged?: boolean;
  metadata?: Record<string, any>;
}

export interface TickerSubmission {
  id: string;
  centreName: string;
  count: number;
  decisionBreakdown?: {
    newConverts: number;
    rededications: number;
    returnees: number;
  };
  winnerName?: string;
  timestamp: string;
  status?: 'verified' | 'pending';
  isAnnouncement?: boolean;
  isNoUploadsPlaceholder?: boolean;
}

export interface CentreStanding {
  centre: Centre;
  areaCouncilName: string;
  regionName: string; // Compatibility alias
  soulsWon: number;
  percentageOfTarget: number;
  percentageOfTotal: number;
  rank: number;
  lastReportedAt?: string;
  recentCount?: number;
  isRecentFlash?: boolean;
}

export interface HourlyTrendPoint {
  hourLabel: string; // e.g. "14:00 WAT"
  timestamp: number;
  count: number;
  cumulative: number;
}

export interface DailyCumulativePoint {
  dateLabel: string; // e.g. "Day 1 (20/08)"
  count: number;
  cumulative: number;
}

export interface DecisionBreakdown {
  newConverts: number;
  rededications: number;
  returnees: number;
  total: number;
}

export interface DemographicSplit {
  totalAnalyzed: number;
  gender: {
    male: number;
    female: number;
    malePercent: number;
    femalePercent: number;
  };
  age: {
    child: number;
    youth: number;
    adult: number;
    senior: number;
    childPercent: number;
    youthPercent: number;
    adultPercent: number;
    seniorPercent: number;
  };
  decision: {
    newConverts: number;
    rededications: number;
    returnees: number;
    newConvertsPercent: number;
    rededicationsPercent: number;
    returneesPercent: number;
  };
}

export interface AreaCouncilStats {
  areaCouncilId: string;
  areaCouncilName: string;
  code: string;
  soulsWon: number;
  target: number;
  percentageOfTotal: number;
  centresCount: number;
  // Compatibility aliases
  regionId: string;
  regionName: string;
}

export type RegionalStats = AreaCouncilStats;

export interface FollowUpFunnelStats {
  not_started: number;
  contacted: number;
  visited: number;
  integrated: number;
  unreachable: number;
  total: number;
}

export interface DashboardStats {
  totalSouls: number;
  target: number;
  percentage: number;
  remaining: number;
  centresReporting: number;
  totalCentres: number;
  soulsLastHour: number;
  projectedTotal: number;
  hourlyVelocity: number;
  pendingApprovalsCount: number;
  sessionSoulsWon?: number;
  sessionElapsedMs?: number;
  sessionHourlyVelocity?: number;
  sessionProjectedTotal?: number;
  isSessionActive?: boolean;
}

export type TimerMode = 'countdown' | 'countup';
export type TimerStatus = 'idle' | 'scheduled' | 'running' | 'paused' | 'finished';
export type EndBehaviour = 'show_zero' | 'lock_submissions' | 'celebrate_total';

export interface CampaignSessionTimer {
  mode: TimerMode;
  status: TimerStatus;
  durationMs: number;
  scheduledStartAt: string | null;
  startedAt: string | null;
  endsAt: string | null;
  pausedAt: string | null;
  totalPausedMs: number;
  label: string;
  endBehaviour: EndBehaviour;
  baselineSouls: number;
  unlockedManually?: boolean;
}

export type LeaderboardPeriod = 'today' | 'session' | 'campaign';

export interface LeaderboardEntry {
  id: string;
  rank: number;
  previousRank?: number;
  rankChange: number;
  name: string;
  subtitle?: string;
  code?: string;
  soulsWon: number;
  target?: number;
  percentageOfTarget?: number;
  newConvertsCount?: number;
  rededicationsCount?: number;
  returneesCount?: number;
  isNewEntry?: boolean;
  winnerCell?: string;
  winnerPcf?: string;
}

export interface PcfLeaderboardEntry {
  id: string;
  pcfName: string;
  rank: number;
  previousRank?: number;
  rankChange: number;
  soulsWon: number;
  newConvertsCount: number;
  rededicationsCount: number;
  returneesCount: number;
  activeWinnersCount: number;
  topCellName?: string;
  percentageOfTotal: number;
  isNewEntry?: boolean;
}

export interface CellLeaderboardEntry {
  id: string;
  cellName: string;
  pcfName?: string;
  rank: number;
  previousRank?: number;
  rankChange: number;
  soulsWon: number;
  newConvertsCount: number;
  rededicationsCount: number;
  returneesCount: number;
  activeWinnersCount: number;
  percentageOfTotal: number;
  isNewEntry?: boolean;
}

export type OfflineSubmissionType = 'individual' | 'bulk';

export interface OfflineQueueItem {
  id: string;
  type: OfflineSubmissionType;
  createdAt: string; // ISO string
  centreId: string;
  centreName: string;
  wonByName: string;
  userRole: UserRole;
  summary: string;
  status: 'pending' | 'syncing' | 'failed';
  lastError?: string;
  retryCount: number;
  individualPayload?: {
    firstName: string;
    lastName: string;
    phone: string;
    gender: Gender;
    ageBracket: AgeBracket;
    community: string;
    decisionType: DecisionType;
    outreachSpot?: string;
    residentialAddress?: string;
    residentialDistrict?: string;
    residentialAreaCouncil?: AreaCouncilCode | 'OTHER';
    winnerPhone?: string;
    winnerCell?: string;
    winnerPcf?: string;
    followUpChurch?: string;
    followUpStatus?: FollowUpStatus;
    consentGiven?: boolean;
    notes?: string;
    duplicateOverrideReason?: string;
  };
  bulkPayload?: {
    sessionLabel: string;
    count: number;
    newConverts: number;
    rededications: number;
    returnees: number;
    winnerPhone?: string;
    winnerCell?: string;
    winnerPcf?: string;
    note?: string;
  };
  record?: Omit<SoulRecord, 'id' | 'wonAt' | 'status'>;
  batch?: Omit<Batch, 'id' | 'submittedAt' | 'status'>;
}

export interface CachedAppState {
  cachedAt: string;
  campaign: Campaign;
  stats: DashboardStats;
  centres: Centre[];
  areaCouncils: AreaCouncil[];
  regions: AreaCouncil[]; // Compatibility
  recentRecords: SoulRecord[];
  decisionBreakdown: DecisionBreakdown;
  areaCouncilStats: AreaCouncilStats[];
  regionalStats: AreaCouncilStats[]; // Compatibility
  hourlyTrend: HourlyTrendPoint[];
  dailyCumulative: DailyCumulativePoint[];
  standings: CentreStanding[];
}

export interface SmsLogEntry {
  id: string;
  timestamp: string;
  centreId: string;
  centreName: string;
  coordinatorPhone: string;
  milestonePercentage: number;
  message: string;
  status: 'sent' | 'failed';
}

export type MediaType = 'picture' | 'audio_testimony' | 'video_testimony';

export interface TestimonyMediaItem {
  id: string;
  title: string;
  contributorName: string;
  centreId: string;
  centreName: string;
  areaCouncilCode?: string;
  mediaType: MediaType;
  url: string; // Object URL, Base64 data URL, or embedded asset
  thumbnailUrl?: string;
  durationSeconds?: number; // for audio or video (max 60s for video)
  fileSize?: number;
  mimeType?: string;
  caption?: string;
  soulRecordId?: string;
  createdAt: string; // ISO string
  isFeatured: boolean; // featured on YouTube Live Stream and Projector
  likesCount: number;
  approved: boolean;
  blobKey?: string; // key in IndexedDB
}

