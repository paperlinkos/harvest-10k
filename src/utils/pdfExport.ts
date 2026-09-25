import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { SoulRecord, Centre, Campaign } from '../types';

export interface GenerateSoulRegistryPDFParams {
  records: SoulRecord[];
  centres: Centre[];
  campaign?: Campaign;
  filters?: {
    search?: string;
    centreFilter?: string;
    decisionFilter?: string;
    statusFilter?: string;
  };
  themeColorHex?: string;
}

export function generateSoulRegistryPDF(params: GenerateSoulRegistryPDFParams): void {
  const { records, centres, campaign, filters, themeColorHex = '#0f172a' } = params;

  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'pt',
    format: 'a4',
  });

  const centreMap = new Map<string, string>();
  centres.forEach(c => centreMap.set(c.id, c.name));

  // Header Banner
  doc.setFillColor(15, 23, 42); // Slate 900
  doc.rect(0, 0, 842, 60, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(campaign?.name || 'ABUJA FCT 10,000 SOULS HARVEST VICTORY CAMPAIGN', 40, 32);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(203, 213, 225); // Slate 300
  doc.text(
    `Official Soul Registry Record | Total Records: ${records.length} | Generated: ${new Date().toLocaleString('en-GB')}`,
    40,
    48
  );

  // Filter Sub-header
  doc.setTextColor(51, 65, 85);
  doc.setFontSize(8.5);
  const filterSummary = [
    filters?.centreFilter && filters.centreFilter !== 'all' ? `Centre: ${filters.centreFilter}` : null,
    filters?.decisionFilter && filters.decisionFilter !== 'all' ? `Decision: ${filters.decisionFilter}` : null,
    filters?.statusFilter && filters.statusFilter !== 'all' ? `Status: ${filters.statusFilter}` : null,
    filters?.search ? `Search: "${filters.search}"` : null,
  ]
    .filter(Boolean)
    .join('  |  ');

  if (filterSummary) {
    doc.text(`Active Filters: ${filterSummary}`, 40, 78);
  }

  // Table Data
  const tableRows = records.map((r, idx) => [
    idx + 1,
    `${r.firstName} ${r.lastName}`,
    r.phone || '—',
    r.decisionType === 'new_convert'
      ? 'New Convert'
      : r.decisionType === 'rededication'
      ? 'Rededication'
      : 'Returnee',
    r.residentialDistrict || r.residentialAddress || r.community || 'Abuja',
    centreMap.get(r.centreId) || r.winnerChurch || 'CE Assembly',
    r.wonByName || 'Soul Winner',
    new Date(r.wonAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
    r.followUpStatus?.replace('_', ' ') || 'not started',
  ]);

  autoTable(doc, {
    startY: filterSummary ? 90 : 75,
    head: [
      [
        '#',
        'Convert Name',
        'Phone Number',
        'Decision',
        'Residence / Area',
        'Church / Assembly',
        'Soul Winner',
        'Date Won',
        'Follow-Up',
      ],
    ],
    body: tableRows,
    styles: {
      fontSize: 8,
      cellPadding: 4,
      textColor: [30, 41, 59],
      lineColor: [226, 232, 240],
      lineWidth: 0.5,
    },
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    margin: { left: 40, right: 40 },
  });

  const timestamp = new Date().toISOString().slice(0, 10);
  doc.save(`Abuja_10K_Soul_Registry_${timestamp}.pdf`);
}
