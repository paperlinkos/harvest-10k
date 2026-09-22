import { SoulRecord, Centre, Campaign, Region, DecisionType, Gender, AgeBracket, FollowUpStatus } from '../types';

export interface CampaignReportData {
  campaign: Campaign;
  centres: Centre[];
  regions: Region[];
  filterSummary: {
    dateRangeLabel: string;
    startDate?: string;
    endDate?: string;
    centreName: string;
    centreId?: string;
    totalRecordsCount: number;
    totalBatchCount: number;
    totalSouls: number;
  };
  metrics: {
    totalSouls: number;
    target: number;
    attainmentPercent: number;
    individualRecords: number;
    batchSouls: number;
    newConverts: number;
    newConvertsPercent: number;
    rededications: number;
    rededicationsPercent: number;
    returnees: number;
    returneesPercent: number;
    maleCount: number;
    malePercent: number;
    femaleCount: number;
    femalePercent: number;
    ageChild: number;
    ageChildPercent: number;
    ageYouth: number;
    ageYouthPercent: number;
    ageAdult: number;
    ageAdultPercent: number;
    ageSenior: number;
    ageSeniorPercent: number;
    followUpNotStarted: number;
    followUpContacted: number;
    followUpVisited: number;
    followUpIntegrated: number;
    followUpUnreachable: number;
    verifiedCount: number;
    pendingCount: number;
  };
  centreBreakdown: {
    centreId: string;
    centreName: string;
    code: string;
    regionName: string;
    coordinatorName: string;
    target: number;
    individualRecords: number;
    batchSouls: number;
    totalSouls: number;
    attainmentPercent: number;
    status: 'Exceeded' | 'On Track' | 'Pacing' | 'Starting';
  }[];
  recentRecordsSample?: SoulRecord[];
  themeColorHex?: string;
}

/**
 * Escapes a cell value for standard CSV compatibility (RFC 4180)
 */
function escapeCSV(value: any): string {
  if (value === null || value === undefined) return '""';
  const str = String(value).replace(/"/g, '""');
  return `"${str}"`;
}

/**
 * Initiates a browser download for a Blob
 */
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Export Comprehensive Collation Report (CSV)
 * Exports full soul-winning collation dataset with executive summary for offline record-keeping.
 */
export function exportCollationReportCSV(
  reportData: CampaignReportData,
  records: SoulRecord[],
  filename = `harvest10k_collation_report_${new Date().toISOString().split('T')[0]}.csv`
) {
  const { campaign, filterSummary, metrics, centreBreakdown } = reportData;
  const lines: string[] = [];

  // Section 1: Campaign Metadata & Executive Summary
  lines.push(`"=== HARVEST 10K CAMPAIGN COLLATION REPORT (OFFLINE AUDIT) ==="`);
  lines.push(`"Campaign Name",${escapeCSV(campaign.name)}`);
  lines.push(`"Campaign Target",${escapeCSV(campaign.target)}`);
  lines.push(`"Report Scope",${escapeCSV(filterSummary.dateRangeLabel)}`);
  lines.push(`"Collation Centre Scope",${escapeCSV(filterSummary.centreName)}`);
  lines.push(`"Generated Date",${escapeCSV(new Date().toLocaleString('en-GB'))}`);
  lines.push(`"Total Souls Recorded",${escapeCSV(metrics.totalSouls)}`);
  lines.push(`"Attainment Percentage",${escapeCSV(`${metrics.attainmentPercent}%`)}`);
  lines.push(`"New Converts",${escapeCSV(metrics.newConverts)}`);
  lines.push(`"Rededications",${escapeCSV(metrics.rededications)}`);
  lines.push(`"Returnees",${escapeCSV(metrics.returnees)}`);
  lines.push(`"Verified Records",${escapeCSV(metrics.verifiedCount)}`);
  lines.push(`"Pending Verification",${escapeCSV(metrics.pendingCount)}`);
  lines.push('');

  // Section 2: Centre Breakdown
  lines.push(`"=== COLLATION CENTRES SUMMARY ==="`);
  lines.push([
    'Centre Code',
    'Centre Name',
    'Area Council',
    'Coordinator',
    'Target',
    'Individual Records',
    'Total Souls Won',
    'Attainment %',
    'Pace Status',
  ].map(escapeCSV).join(','));

  centreBreakdown.forEach(cb => {
    lines.push([
      escapeCSV(cb.code),
      escapeCSV(cb.centreName),
      escapeCSV(cb.regionName),
      escapeCSV(cb.coordinatorName),
      escapeCSV(cb.target),
      escapeCSV(cb.individualRecords),
      escapeCSV(cb.totalSouls),
      escapeCSV(`${cb.attainmentPercent}%`),
      escapeCSV(cb.status),
    ].join(','));
  });
  lines.push('');

  // Section 3: Detailed Soul Records
  lines.push(`"=== SOUL-WINNING COLLATION RECORDS LEDGER (${records.length} Records) ==="`);
  const headers = [
    'Record ID',
    'First Name',
    'Last Name',
    'Phone Number',
    'Gender',
    'Age Bracket',
    'Outreach Spot (Where Won)',
    'Living Street Address (Where Lives)',
    'Residential District',
    'Residential Area Council',
    'Locality',
    'Ward',
    'Community / Town',
    'Decision Type',
    'Won By (Soul Winner)',
    'Won Date & Time',
    'Centre Code',
    'Centre Name',
    'Area Council',
    'Assigned Church for Follow-Up',
    'Follow-Up Status',
    'Verification Status',
    'Notes / Remarks',
  ];
  lines.push(headers.map(escapeCSV).join(','));

  const centreMap = new Map(reportData.centres.map(c => [c.id, c]));
  const regionMap = new Map(reportData.regions.map(r => [r.id, r]));

  records.forEach(r => {
    const centre = centreMap.get(r.centreId);
    const region = centre ? regionMap.get(centre.regionId) : undefined;
    const formattedDate = new Date(r.wonAt).toLocaleString('en-GB', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });

    const formatDecision = (dt: DecisionType) => {
      if (dt === 'new_convert') return 'New Convert';
      if (dt === 'rededication') return 'Rededication';
      if (dt === 'returnee') return 'Returnee';
      return dt;
    };

    const formatFollowUp = (fs: FollowUpStatus) => {
      if (fs === 'not_started') return 'Not Started';
      if (fs === 'contacted') return 'Contacted';
      if (fs === 'visited') return 'Visited';
      if (fs === 'integrated') return 'Integrated';
      if (fs === 'unreachable') return 'Unreachable';
      return fs;
    };

    lines.push([
      escapeCSV(r.id),
      escapeCSV(r.firstName),
      escapeCSV(r.lastName),
      escapeCSV(r.phone || 'N/A'),
      escapeCSV(r.gender ? r.gender.toUpperCase() : 'N/A'),
      escapeCSV(r.ageBracket ? r.ageBracket.toUpperCase() : 'N/A'),
      escapeCSV(r.outreachSpot || r.areaCouncil || 'General Field'),
      escapeCSV(r.residentialAddress || 'No address logged'),
      escapeCSV(r.residentialDistrict || 'Not specified'),
      escapeCSV(r.residentialAreaCouncil || 'FCT'),
      escapeCSV(r.locality || r.community || 'N/A'),
      escapeCSV(r.ward || 'N/A'),
      escapeCSV(r.community || 'N/A'),
      escapeCSV(formatDecision(r.decisionType)),
      escapeCSV(r.wonByName || 'N/A'),
      escapeCSV(formattedDate),
      escapeCSV(centre?.code || 'N/A'),
      escapeCSV(centre?.name || 'N/A'),
      escapeCSV(region?.name || 'N/A'),
      escapeCSV(r.followUpChurch || 'N/A'),
      escapeCSV(formatFollowUp(r.followUpStatus)),
      escapeCSV(r.status ? r.status.toUpperCase() : 'VERIFIED'),
      escapeCSV(r.notes || ''),
    ].join(','));
  });

  const csvContent = '\uFEFF' + lines.join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, filename);
}

/**
 * 1. Export All Records (CSV)
 */
export function exportAllRecordsCSV(
  records: SoulRecord[],
  centres: Centre[],
  regions: Region[],
  filename = `harvest10k_soul_records_${new Date().toISOString().split('T')[0]}.csv`
) {
  const centreMap = new Map(centres.map(c => [c.id, c]));
  const regionMap = new Map(regions.map(r => [r.id, r]));

  const headers = [
    'Record ID',
    'First Name',
    'Last Name',
    'Phone Number',
    'Gender',
    'Age Bracket',
    'Outreach Spot (Where Won)',
    'Living Street Address (Where Lives)',
    'Residential District',
    'Residential Area Council',
    'Locality',
    'Ward',
    'Cross-Council',
    'Community / Town',
    'Decision Type',
    'Won By (Soul Winner)',
    'Won Date & Time',
    'Centre Code',
    'Centre Name',
    'Area Council',
    'Assigned Church for Follow-Up',
    'Follow-Up Status',
    'Consent Given',
    'Verification Status',
    'Notes / Remarks',
  ];

  const rows = records.map(r => {
    const centre = centreMap.get(r.centreId);
    const region = centre ? regionMap.get(centre.regionId) : undefined;
    const formattedDate = new Date(r.wonAt).toLocaleString('en-GB', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });

    const formatDecision = (dt: DecisionType) => {
      if (dt === 'new_convert') return 'New Convert';
      if (dt === 'rededication') return 'Rededication';
      if (dt === 'returnee') return 'Returnee';
      return dt;
    };

    const formatFollowUp = (fs: FollowUpStatus) => {
      if (fs === 'not_started') return 'Not Started';
      if (fs === 'contacted') return 'Contacted';
      if (fs === 'visited') return 'Visited';
      if (fs === 'integrated') return 'Integrated';
      if (fs === 'unreachable') return 'Unreachable';
      return fs;
    };

    return [
      escapeCSV(r.id),
      escapeCSV(r.firstName),
      escapeCSV(r.lastName),
      escapeCSV(r.phone || 'N/A'),
      escapeCSV(r.gender ? r.gender.toUpperCase() : 'N/A'),
      escapeCSV(r.ageBracket ? r.ageBracket.toUpperCase() : 'N/A'),
      escapeCSV(r.outreachSpot || r.areaCouncil || 'General Field'),
      escapeCSV(r.residentialAddress || 'No address logged'),
      escapeCSV(r.residentialDistrict || 'Not specified'),
      escapeCSV(r.residentialAreaCouncil || 'FCT'),
      escapeCSV(r.locality || r.community || 'N/A'),
      escapeCSV(r.ward || 'N/A'),
      escapeCSV(r.isCrossCouncil ? 'YES' : 'NO'),
      escapeCSV(r.community || 'N/A'),
      escapeCSV(formatDecision(r.decisionType)),
      escapeCSV(r.wonByName || 'N/A'),
      escapeCSV(formattedDate),
      escapeCSV(centre?.code || 'N/A'),
      escapeCSV(centre?.name || 'N/A'),
      escapeCSV(region?.name || 'N/A'),
      escapeCSV(r.followUpChurch || 'N/A'),
      escapeCSV(formatFollowUp(r.followUpStatus)),
      escapeCSV(r.consentGiven ? 'YES' : 'NO'),
      escapeCSV(r.status ? r.status.toUpperCase() : 'VERIFIED'),
      escapeCSV(r.notes || ''),
    ].join(',');
  });

  const csvContent = '\uFEFF' + [headers.map(escapeCSV).join(','), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, filename);
}

/**
 * 2. Export Follow-Up List (CSV)
 * Specially tailored for pastoral care, cell leaders, and visitation teams.
 */
export function exportFollowUpListCSV(
  records: SoulRecord[],
  centres: Centre[],
  filename = `harvest10k_followup_list_${new Date().toISOString().split('T')[0]}.csv`
) {
  const centreMap = new Map(centres.map(c => [c.id, c]));

  const headers = [
    'Convert Name',
    'Phone Contact',
    'Gender',
    'Age Group',
    'Living Street Address (Home Visitation)',
    'Residential District / Neighborhood',
    'Residential Area Council',
    'Outreach Spot (Where Won)',
    'Locality',
    'Ward',
    'Cross-Council',
    'Decision Category',
    'Date Won',
    'Assigned Collation Centre',
    'Preferred Local Assembly / Church',
    'Follow-Up Stage',
    'Soul Winner Contact',
    'Pastoral & Prayer Notes',
  ];

  const rows = records.map(r => {
    const centre = centreMap.get(r.centreId);
    const formattedDate = new Date(r.wonAt).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

    const formatDecision = (dt: DecisionType) => {
      if (dt === 'new_convert') return 'New Convert';
      if (dt === 'rededication') return 'Rededication';
      if (dt === 'returnee') return 'Returnee';
      return dt;
    };

    const formatFollowUp = (fs: FollowUpStatus) => {
      if (fs === 'not_started') return '1. Not Started (Action Needed)';
      if (fs === 'contacted') return '2. Phone Contacted';
      if (fs === 'visited') return '3. Home / Cell Visited';
      if (fs === 'integrated') return '4. Integrated in Church';
      if (fs === 'unreachable') return '5. Unreachable / Call Later';
      return fs;
    };

    return [
      escapeCSV(`${r.firstName} ${r.lastName}`.trim()),
      escapeCSV(r.phone || 'NO PHONE PROVIDED'),
      escapeCSV(r.gender ? (r.gender === 'male' ? 'Male' : 'Female') : 'Unknown'),
      escapeCSV(r.ageBracket ? r.ageBracket.charAt(0).toUpperCase() + r.ageBracket.slice(1) : 'Unknown'),
      escapeCSV(r.residentialAddress || 'No home address logged'),
      escapeCSV(r.residentialDistrict || 'Not specified'),
      escapeCSV(r.residentialAreaCouncil || 'FCT'),
      escapeCSV(r.outreachSpot || r.areaCouncil || 'General Field'),
      escapeCSV(r.locality || r.community || 'Not specified'),
      escapeCSV(r.ward || 'N/A'),
      escapeCSV(r.isCrossCouncil ? 'YES' : 'NO'),
      escapeCSV(formatDecision(r.decisionType)),
      escapeCSV(formattedDate),
      escapeCSV(centre?.name || 'Central Hub'),
      escapeCSV(r.followUpChurch || 'Central Assembly Hub'),
      escapeCSV(formatFollowUp(r.followUpStatus)),
      escapeCSV(r.wonByName || 'Field Evangelist'),
      escapeCSV(r.notes || ''),
    ].join(',');
  });

  const csvContent = '\uFEFF' + [headers.map(escapeCSV).join(','), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, filename);
}

/**
 * 2b. Export Convert Living Addresses & Bus Routing List (CSV)
 * Dedicated export for transport logistics, bus routing, and cell fellowships.
 */
export function exportConvertAddressesCSV(
  records: SoulRecord[],
  centres: Centre[],
  filename = `harvest10k_convert_addresses_${new Date().toISOString().split('T')[0]}.csv`
) {
  const centreMap = new Map(centres.map(c => [c.id, c]));

  const headers = [
    'Convert Name',
    'Phone Contact',
    'Residential Living Address & Landmark',
    'Residential District / Neighborhood',
    'Residential Area Council',
    'Outreach Spot (Where Won)',
    'Assigned Collation Centre',
    'Suggested Church Bus Line',
    'Follow-Up Church / Assembly',
    'Decision Type',
    'Soul Winner',
    'Date Won',
    'Follow-Up Status',
  ];

  const rows = records.map(r => {
    const centre = centreMap.get(r.centreId);
    const busLine = r.residentialDistrict
      ? `Express Bus: ${r.residentialDistrict} ⇄ Central Assembly`
      : 'Zone Central Shuttle';

    return [
      escapeCSV(`${r.firstName} ${r.lastName}`.trim()),
      escapeCSV(r.phone || 'N/A'),
      escapeCSV(r.residentialAddress || 'Not recorded'),
      escapeCSV(r.residentialDistrict || 'Not specified'),
      escapeCSV(r.residentialAreaCouncil || 'FCT'),
      escapeCSV(r.outreachSpot || r.areaCouncil || centre?.name || 'Abuja Field'),
      escapeCSV(centre?.name || 'Central Hub'),
      escapeCSV(busLine),
      escapeCSV(r.followUpChurch || 'Central Assembly'),
      escapeCSV(r.decisionType),
      escapeCSV(r.wonByName || 'Evangelist'),
      escapeCSV(new Date(r.wonAt).toLocaleDateString('en-GB')),
      escapeCSV(r.followUpStatus || 'not_started'),
    ].join(',');
  });

  const csvContent = '\uFEFF' + [headers.map(escapeCSV).join(','), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, filename);
}

/**
 * 3. Download Campaign Summary (Printable HTML Report)
 * Generates an executive-ready HTML document complete with print stylesheet (@media print)
 */
export function generateCampaignSummaryHTML(data: CampaignReportData): string {
  const { campaign, filterSummary, metrics, centreBreakdown, themeColorHex = '#0ea5e9' } = data;
  const now = new Date();
  const reportDate = now.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const reportTime = now.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${campaign.name} - Executive Collation Summary Report</title>
  <style>
    :root {
      --primary: ${themeColorHex};
      --primary-dark: #0f172a;
      --text-main: #0f172a;
      --text-muted: #64748b;
      --border-color: #cbd5e1;
      --bg-light: #f8fafc;
      --bg-card: #ffffff;
      --success: #10b981;
      --warning: #f59e0b;
      --info: #3b82f6;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: var(--text-main);
      background-color: #f1f5f9;
      line-height: 1.5;
      font-size: 13px;
      padding: 24px 0;
    }

    .report-container {
      max-width: 980px;
      margin: 0 auto;
      background: #ffffff;
      border: 1px solid var(--border-color);
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.08);
      border-radius: 8px;
      overflow: hidden;
    }

    /* Floating Action Bar */
    .action-bar {
      background: #0f172a;
      color: #ffffff;
      padding: 12px 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      position: sticky;
      top: 0;
      z-index: 100;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 16px;
      border-radius: 6px;
      font-weight: 600;
      font-size: 12px;
      cursor: pointer;
      border: none;
      transition: all 0.2s;
    }

    .btn-primary {
      background: var(--primary);
      color: #ffffff;
    }

    .btn-primary:hover {
      opacity: 0.9;
    }

    .btn-outline {
      background: rgba(255, 255, 255, 0.15);
      color: #ffffff;
      border: 1px solid rgba(255, 255, 255, 0.3);
    }

    .btn-outline:hover {
      background: rgba(255, 255, 255, 0.25);
    }

    /* Header Banner */
    .report-header {
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      color: #ffffff;
      padding: 32px 36px 28px;
      border-bottom: 4px solid var(--primary);
    }

    .header-top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 16px;
    }

    .header-title-block h1 {
      font-size: 26px;
      font-weight: 900;
      letter-spacing: -0.5px;
      text-transform: uppercase;
      color: #ffffff;
      margin-bottom: 4px;
    }

    .header-title-block p {
      font-size: 13px;
      color: #94a3b8;
      font-weight: 500;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }

    .badge-scope {
      background: rgba(255, 255, 255, 0.12);
      border: 1px solid rgba(255, 255, 255, 0.25);
      color: #38bdf8;
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      text-align: right;
    }

    .header-scripture {
      font-style: italic;
      color: #cbd5e1;
      font-size: 12px;
      border-left: 3px solid var(--primary);
      padding-left: 12px;
      margin-top: 12px;
    }

    .report-meta-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 6px;
      padding: 12px 16px;
      margin-top: 16px;
    }

    .meta-item .meta-label {
      font-size: 10px;
      color: #94a3b8;
      text-transform: uppercase;
      font-weight: 600;
    }

    .meta-item .meta-value {
      font-size: 12px;
      color: #ffffff;
      font-weight: 700;
      margin-top: 2px;
    }

    /* Report Body */
    .report-body {
      padding: 32px 36px;
    }

    .section-heading {
      font-size: 15px;
      font-weight: 800;
      color: #0f172a;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 8px;
      margin-bottom: 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .section-heading .badge {
      font-size: 11px;
      color: var(--primary);
      background: #f0f9ff;
      border: 1px solid #bae6fd;
      padding: 2px 8px;
      border-radius: 12px;
      text-transform: none;
      font-weight: 600;
    }

    /* Executive KPI Cards */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      margin-bottom: 28px;
    }

    .kpi-card {
      background: var(--bg-light);
      border: 1px solid var(--border-color);
      border-radius: 8px;
      padding: 14px 16px;
      text-align: left;
    }

    .kpi-card.highlight {
      background: #f0fdf4;
      border-color: #86efac;
    }

    .kpi-label {
      font-size: 11px;
      font-weight: 700;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .kpi-value {
      font-size: 24px;
      font-weight: 900;
      color: #0f172a;
      margin: 4px 0;
      font-variant-numeric: tabular-nums;
    }

    .kpi-sub {
      font-size: 11px;
      font-weight: 600;
      color: #10b981;
    }

    /* Progress Bar */
    .progress-section {
      background: var(--bg-light);
      border: 1px solid var(--border-color);
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 28px;
    }

    .progress-header {
      display: flex;
      justify-content: space-between;
      font-weight: 700;
      font-size: 12px;
      margin-bottom: 8px;
    }

    .progress-bar-outer {
      height: 14px;
      background: #e2e8f0;
      border-radius: 7px;
      overflow: hidden;
      border: 1px solid #cbd5e1;
    }

    .progress-bar-fill {
      height: 100%;
      background: var(--primary);
      border-radius: 7px;
    }

    /* Breakdown Grid (Demographics & Decisions) */
    .breakdown-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
      margin-bottom: 28px;
    }

    .breakdown-card {
      border: 1px solid var(--border-color);
      border-radius: 8px;
      padding: 14px;
      background: #ffffff;
    }

    .breakdown-title {
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      color: #334155;
      margin-bottom: 12px;
      padding-bottom: 6px;
      border-bottom: 1px solid #e2e8f0;
    }

    .breakdown-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
      font-size: 12px;
    }

    .item-label {
      color: var(--text-muted);
      font-weight: 500;
    }

    .item-val {
      font-weight: 700;
      color: #0f172a;
      font-variant-numeric: tabular-nums;
    }

    .mini-bar-bg {
      height: 6px;
      background: #e2e8f0;
      border-radius: 3px;
      margin-bottom: 10px;
      overflow: hidden;
    }

    .mini-bar-fill {
      height: 100%;
      border-radius: 3px;
    }

    /* Tables */
    .report-table-container {
      margin-bottom: 28px;
      overflow-x: auto;
    }

    table.report-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 11.5px;
      text-align: left;
    }

    table.report-table th {
      background: #f1f5f9;
      color: #334155;
      font-weight: 700;
      text-transform: uppercase;
      font-size: 10.5px;
      padding: 9px 10px;
      border: 1px solid var(--border-color);
      letter-spacing: 0.3px;
    }

    table.report-table td {
      padding: 8px 10px;
      border: 1px solid var(--border-color);
      color: #1e293b;
    }

    table.report-table tr:nth-child(even) {
      background: #f8fafc;
    }

    .text-right { text-align: right; }
    .text-center { text-align: center; }
    .font-bold { font-weight: 700; }

    .tag-status {
      display: inline-block;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 9.5px;
      font-weight: 700;
      text-transform: uppercase;
    }

    .tag-exceeded { background: #dcfce7; color: #166534; }
    .tag-ontrack { background: #e0f2fe; color: #075985; }
    .tag-pacing { background: #fef3c7; color: #92400e; }
    .tag-starting { background: #f1f5f9; color: #475569; }

    /* Sign-off Section */
    .signoff-section {
      margin-top: 36px;
      padding-top: 20px;
      border-top: 2px solid #e2e8f0;
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 24px;
    }

    .signoff-box {
      border: 1px dashed var(--border-color);
      padding: 16px;
      border-radius: 6px;
      background: var(--bg-light);
    }

    .signoff-label {
      font-size: 10.5px;
      font-weight: 700;
      color: var(--text-muted);
      text-transform: uppercase;
      margin-bottom: 24px;
    }

    .signoff-line {
      border-bottom: 1px solid #94a3b8;
      margin-bottom: 6px;
    }

    .signoff-name {
      font-size: 11px;
      font-weight: 600;
      color: #0f172a;
    }

    /* Footer */
    .report-footer {
      background: #f8fafc;
      border-top: 1px solid var(--border-color);
      padding: 16px 36px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 10.5px;
      color: var(--text-muted);
    }

    /* Print Stylesheet */
    @media print {
      body {
        background: #ffffff !important;
        padding: 0 !important;
        font-size: 11pt !important;
        color: #000000 !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }

      .no-print, .action-bar {
        display: none !important;
      }

      .report-container {
        max-width: 100% !important;
        margin: 0 !important;
        border: none !important;
        box-shadow: none !important;
        border-radius: 0 !important;
      }

      .report-header {
        background: #0f172a !important;
        color: #ffffff !important;
        padding: 20px 24px !important;
      }

      .report-body {
        padding: 20px 24px !important;
      }

      .kpi-card, .progress-section, .breakdown-card, .signoff-box {
        break-inside: avoid;
        page-break-inside: avoid;
      }

      table.report-table {
        page-break-inside: auto;
      }

      table.report-table tr {
        page-break-inside: avoid;
        page-break-after: auto;
      }

      table.report-table th {
        background: #f1f5f9 !important;
        color: #000000 !important;
      }
    }
  </style>
</head>
<body>

  <div class="report-container">
    <!-- Floating Action Bar (Hidden in Print) -->
    <div class="action-bar no-print">
      <div style="font-weight: 700; font-size: 13px; display: flex; align-items: center; gap: 8px;">
        <span>📄</span>
        <span>Campaign Summary Collation Report</span>
      </div>
      <div style="display: flex; gap: 8px;">
        <button class="btn btn-primary" onclick="window.print()">
          <span>🖨️ Print / Save as PDF</span>
        </button>
        <button class="btn btn-outline" onclick="window.close()">
          <span>✕ Close</span>
        </button>
      </div>
    </div>

    <!-- Official Header Banner -->
    <div class="report-header">
      <div class="header-top">
        <div class="header-title-block">
          <h1>${campaign.name}</h1>
          <p>Abuja FCT Soul Collation & Harvest Executive Summary</p>
        </div>
        <div class="badge-scope">
          Scope: ${filterSummary.centreName}
        </div>
      </div>

      <div class="header-scripture">
        "${campaign.verse}"
      </div>

      <div class="report-meta-grid">
        <div class="meta-item">
          <div class="meta-label">Report Generation Date</div>
          <div class="meta-value">${reportDate}</div>
        </div>
        <div class="meta-item">
          <div class="meta-label">Generation Time</div>
          <div class="meta-value">${reportTime}</div>
        </div>
        <div class="meta-item">
          <div class="meta-label">Collation Date Scope</div>
          <div class="meta-value">${filterSummary.dateRangeLabel}</div>
        </div>
        <div class="meta-item">
          <div class="meta-label">Secretariat Status</div>
          <div class="meta-value" style="color: #4ade80;">Active Collation Live</div>
        </div>
      </div>
    </div>

    <!-- Report Body -->
    <div class="report-body">
      
      <!-- Section 1: Executive KPI Metrics -->
      <div class="section-heading">
        <span>Executive Collation Summary</span>
        <span class="badge">Campaign Target: ${metrics.target.toLocaleString()} Souls</span>
      </div>

      <div class="kpi-grid">
        <div class="kpi-card highlight">
          <div class="kpi-label">Total Souls Harvested</div>
          <div class="kpi-value" style="color: #15803d;">${metrics.totalSouls.toLocaleString()}</div>
          <div class="kpi-sub">${metrics.attainmentPercent}% of Target Achieved</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-label">New Converts</div>
          <div class="kpi-value" style="color: #0369a1;">${metrics.newConverts.toLocaleString()}</div>
          <div class="kpi-sub" style="color: #0369a1;">${metrics.newConvertsPercent}% of total harvest</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-label">Rededications</div>
          <div class="kpi-value" style="color: #4338ca;">${metrics.rededications.toLocaleString()}</div>
          <div class="kpi-sub" style="color: #4338ca;">${metrics.rededicationsPercent}% of total harvest</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-label">Returnees & Restored</div>
          <div class="kpi-value" style="color: #b45309;">${metrics.returnees.toLocaleString()}</div>
          <div class="kpi-sub" style="color: #b45309;">${metrics.returneesPercent}% of total harvest</div>
        </div>
      </div>

      <!-- Campaign Target Progress Bar -->
      <div class="progress-section">
        <div class="progress-header">
          <span>Overall Campaign Target Attainment</span>
          <span style="color: #0f172a;">${metrics.totalSouls.toLocaleString()} / ${metrics.target.toLocaleString()} (${metrics.attainmentPercent}%)</span>
        </div>
        <div class="progress-bar-outer">
          <div class="progress-bar-fill" style="width: ${Math.min(100, metrics.attainmentPercent)}%;"></div>
        </div>
      </div>

      <!-- Section 2: Demographic & Decision Split Matrices -->
      <div class="section-heading">
        <span>Demographic & Decision Classification</span>
      </div>

      <div class="breakdown-grid">
        <!-- Decision Split -->
        <div class="breakdown-card">
          <div class="breakdown-title">Decision Type</div>
          
          <div class="breakdown-item">
            <span class="item-label">New Converts</span>
            <span class="item-val">${metrics.newConverts.toLocaleString()} (${metrics.newConvertsPercent}%)</span>
          </div>
          <div class="mini-bar-bg">
            <div class="mini-bar-fill" style="width: ${metrics.newConvertsPercent}%; background: #10b981;"></div>
          </div>

          <div class="breakdown-item">
            <span class="item-label">Rededications</span>
            <span class="item-val">${metrics.rededications.toLocaleString()} (${metrics.rededicationsPercent}%)</span>
          </div>
          <div class="mini-bar-bg">
            <div class="mini-bar-fill" style="width: ${metrics.rededicationsPercent}%; background: #3b82f6;"></div>
          </div>

          <div class="breakdown-item">
            <span class="item-label">Returnees</span>
            <span class="item-val">${metrics.returnees.toLocaleString()} (${metrics.returneesPercent}%)</span>
          </div>
          <div class="mini-bar-bg">
            <div class="mini-bar-fill" style="width: ${metrics.returneesPercent}%; background: #f59e0b;"></div>
          </div>
        </div>

        <!-- Gender Distribution -->
        <div class="breakdown-card">
          <div class="breakdown-title">Gender Distribution</div>

          <div class="breakdown-item">
            <span class="item-label">Female Converts</span>
            <span class="item-val">${metrics.femaleCount.toLocaleString()} (${metrics.femalePercent}%)</span>
          </div>
          <div class="mini-bar-bg">
            <div class="mini-bar-fill" style="width: ${metrics.femalePercent}%; background: #ec4899;"></div>
          </div>

          <div class="breakdown-item">
            <span class="item-label">Male Converts</span>
            <span class="item-val">${metrics.maleCount.toLocaleString()} (${metrics.malePercent}%)</span>
          </div>
          <div class="mini-bar-bg">
            <div class="mini-bar-fill" style="width: ${metrics.malePercent}%; background: #3b82f6;"></div>
          </div>

          <div style="font-size: 11px; color: var(--text-muted); margin-top: 14px;">
            *Calculated from verified individual field registry records.
          </div>
        </div>

        <!-- Age Groups -->
        <div class="breakdown-card">
          <div class="breakdown-title">Age Brackets</div>

          <div class="breakdown-item">
            <span class="item-label">Youth (18–35)</span>
            <span class="item-val">${metrics.ageYouth.toLocaleString()} (${metrics.ageYouthPercent}%)</span>
          </div>
          <div class="mini-bar-bg">
            <div class="mini-bar-fill" style="width: ${metrics.ageYouthPercent}%; background: #06b6d4;"></div>
          </div>

          <div class="breakdown-item">
            <span class="item-label">Adults (36–59)</span>
            <span class="item-val">${metrics.ageAdult.toLocaleString()} (${metrics.ageAdultPercent}%)</span>
          </div>
          <div class="mini-bar-bg">
            <div class="mini-bar-fill" style="width: ${metrics.ageAdultPercent}%; background: #8b5cf6;"></div>
          </div>

          <div class="breakdown-item">
            <span class="item-label">Children (&lt;18)</span>
            <span class="item-val">${metrics.ageChild.toLocaleString()} (${metrics.ageChildPercent}%)</span>
          </div>
          <div class="mini-bar-bg">
            <div class="mini-bar-fill" style="width: ${metrics.ageChildPercent}%; background: #f43f5e;"></div>
          </div>

          <div class="breakdown-item">
            <span class="item-label">Seniors (60+)</span>
            <span class="item-val">${metrics.ageSenior.toLocaleString()} (${metrics.ageSeniorPercent}%)</span>
          </div>
          <div class="mini-bar-bg">
            <div class="mini-bar-fill" style="width: ${metrics.ageSeniorPercent}%; background: #64748b;"></div>
          </div>
        </div>
      </div>

      <!-- Section 3: Follow-Up & Integration Funnel -->
      <div class="section-heading">
        <span>Follow-Up Pipeline & Church Integration</span>
      </div>

      <div class="kpi-grid" style="margin-bottom: 28px;">
        <div class="kpi-card">
          <div class="kpi-label">1. Not Started</div>
          <div class="kpi-value" style="color: #64748b;">${metrics.followUpNotStarted.toLocaleString()}</div>
          <div class="kpi-sub" style="color: #64748b;">Awaiting assignment</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">2. Phone Contacted</div>
          <div class="kpi-value" style="color: #0284c7;">${metrics.followUpContacted.toLocaleString()}</div>
          <div class="kpi-sub" style="color: #0284c7;">Phone discipleship active</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">3. Home Visited</div>
          <div class="kpi-value" style="color: #7c3aed;">${metrics.followUpVisited.toLocaleString()}</div>
          <div class="kpi-sub" style="color: #7c3aed;">Cell visited in person</div>
        </div>
        <div class="kpi-card" style="background: #f0fdf4; border-color: #86efac;">
          <div class="kpi-label">4. Church Integrated</div>
          <div class="kpi-value" style="color: #16a34a;">${metrics.followUpIntegrated.toLocaleString()}</div>
          <div class="kpi-sub" style="color: #16a34a;">Active in local church</div>
        </div>
      </div>

      <!-- Section 4: Centre Performance Collation Table -->
      <div class="section-heading">
        <span>Centre-by-Centre Collation Breakdown</span>
        <span class="badge">${centreBreakdown.length} Collation Centres</span>
      </div>

      <div class="report-table-container">
        <table class="report-table">
          <thead>
            <tr>
              <th class="text-center" style="width: 40px;">#</th>
              <th>Collation Centre</th>
              <th>Area Council</th>
              <th>Coordinator</th>
              <th class="text-right">Target</th>
              <th class="text-right">Individual Records</th>
              <th class="text-right">Bulk Batches</th>
              <th class="text-right font-bold">Total Souls</th>
              <th class="text-right">% Target</th>
              <th class="text-center">Status</th>
            </tr>
          </thead>
          <tbody>
            ${centreBreakdown
              .map((c, idx) => {
                const tagClass =
                  c.status === 'Exceeded'
                    ? 'tag-exceeded'
                    : c.status === 'On Track'
                    ? 'tag-ontrack'
                    : c.status === 'Pacing'
                    ? 'tag-pacing'
                    : 'tag-starting';

                return `<tr>
                  <td class="text-center font-bold">${idx + 1}</td>
                  <td class="font-bold">${c.centreName} <span style="font-size: 9.5px; color: #64748b;">(${c.code})</span></td>
                  <td>${c.regionName}</td>
                  <td>${c.coordinatorName}</td>
                  <td class="text-right font-mono">${c.target.toLocaleString()}</td>
                  <td class="text-right font-mono">${c.individualRecords.toLocaleString()}</td>
                  <td class="text-right font-mono">${c.batchSouls.toLocaleString()}</td>
                  <td class="text-right font-bold font-mono" style="color: #0f172a;">${c.totalSouls.toLocaleString()}</td>
                  <td class="text-right font-bold font-mono" style="color: ${c.attainmentPercent >= 100 ? '#16a34a' : '#0284c7'};">${c.attainmentPercent}%</td>
                  <td class="text-center"><span class="tag-status ${tagClass}">${c.status}</span></td>
                </tr>`;
              })
              .join('')}
          </tbody>
        </table>
      </div>

      <!-- Section 5: Official Secretariat Sign-Off -->
      <div class="signoff-section">
        <div class="signoff-box">
          <div class="signoff-label">Prepared By (Collation Officer)</div>
          <div class="signoff-line"></div>
          <div class="signoff-name">FCT Secretariat Collation Desk</div>
          <div style="font-size: 10px; color: #64748b;">Automated Verification Pass</div>
        </div>

        <div class="signoff-box">
          <div class="signoff-label">Approved By (Campaign Director)</div>
          <div class="signoff-line"></div>
          <div class="signoff-name">Pastor Emmanuel Okafor</div>
          <div style="font-size: 10px; color: #64748b;">Director of FCT Evangelism</div>
        </div>

        <div class="signoff-box">
          <div class="signoff-label">Official Collation Seal / Stamp</div>
          <div style="height: 38px; border: 1px dashed #cbd5e1; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 10px; color: #94a3b8; text-transform: uppercase; font-weight: 700;">
            [ HARVEST 10K FCT VERIFIED ]
          </div>
        </div>
      </div>

    </div>

    <!-- Official Footer -->
    <div class="report-footer">
      <div>
        <strong>HARVEST 10K SOUL-WINNING COLLATION SYSTEM</strong> • Official Audit & Statistical Summary
      </div>
      <div>
        Page 1 of 1 • Generated via Live Data Collation Engine
      </div>
    </div>

  </div>

</body>
</html>`;
}

/**
 * 3.1 Triggers download of the HTML summary report as a standalone file
 */
export function downloadCampaignSummaryHTML(
  data: CampaignReportData,
  filename = `harvest10k_campaign_summary_${new Date().toISOString().split('T')[0]}.html`
) {
  const html = generateCampaignSummaryHTML(data);
  const blob = new Blob([html], { type: 'text/html;charset=utf-8;' });
  downloadBlob(blob, filename);
}

/**
 * 3.2 Opens the HTML summary report in a new tab or printable popup window
 */
export function openPrintableSummaryReport(data: CampaignReportData) {
  const html = generateCampaignSummaryHTML(data);
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  }
}

/**
 * Export Unreconciled Tap Records (CSV) split by state (Pending vs Contactable)
 */
export function exportUnreconciledCSV(
  records: SoulRecord[],
  centres: Centre[],
  filename = `harvest10k_unreconciled_taps_${new Date().toISOString().split('T')[0]}.csv`
) {
  const centreMap = new Map(centres.map(c => [c.id, c]));
  const headers = ['Record ID', 'Centre Name', 'Area Council', 'Capture Method', 'Reconciliation State', 'Phone Number', 'Phone Needs Review', 'Tapped At', 'Tapped By', 'Notes'];
  const rows = records
    .filter(r => r.reconcileStatus === 'pending' || r.reconcileStatus === 'contactable' || (r.status === 'pending' && r.captureMethod === 'tap'))
    .sort((a, b) => (a.reconcileStatus === 'contactable' ? -1 : 1))
    .map(r => {
      const centre = centreMap.get(r.centreId);
      return [
        r.id,
        centre ? centre.name : r.centreId,
        centre ? centre.areaCouncilCode : '',
        r.captureMethod || 'tap',
        r.reconcileStatus || 'pending',
        r.phone || '',
        r.phoneNeedsReview ? 'Yes' : 'No',
        r.tappedAt || r.wonAt,
        r.wonByName || r.tappedByUserId || '',
        r.notes || '',
      ];
    });

  const csvContent = [headers.map(escapeCSV).join(','), ...rows.map(row => row.map(escapeCSV).join(','))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, filename);
}

