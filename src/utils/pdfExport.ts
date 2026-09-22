import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { SoulRecord, Centre, Campaign } from '../types';

interface PDFReportOptions {
  records: SoulRecord[];
  centres: Centre[];
  campaign: Campaign;
  filters: {
    search?: string;
    centreFilter?: string;
    decisionFilter?: string;
    statusFilter?: string;
  };
  themeColorHex?: string;
}

export function generateSoulRegistryPDF({
  records,
  centres,
  campaign,
  filters,
  themeColorHex = '#0ea5e9',
}: PDFReportOptions) {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'pt',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 36; // 0.5 inch

  // Compute metrics
  const total = records.length;
  const newConverts = records.filter(r => r.decisionType === 'new_convert').length;
  const rededications = records.filter(r => r.decisionType === 'rededication').length;
  const returnees = records.filter(r => r.decisionType === 'returnee').length;
  const verified = records.filter(r => r.status === 'verified').length;
  const pending = records.filter(r => r.status === 'pending').length;

  const activeCentreName =
    filters.centreFilter && filters.centreFilter !== 'all'
      ? centres.find(c => c.id === filters.centreFilter)?.name || filters.centreFilter
      : 'All 14 Abuja Centres';

  // 1. Header Background Banner
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 78, 'F');

  // Decorative theme accent strip
  // Convert hex to rgb
  const hex = themeColorHex.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16) || 14;
  const g = parseInt(hex.substring(2, 4), 16) || 165;
  const b = parseInt(hex.substring(4, 6), 16) || 233;
  doc.setFillColor(r, g, b);
  doc.rect(0, 78, pageWidth, 4, 'F');

  // Header Titles
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);

  let textLeft = margin;
  if (campaign.customLogoUrl) {
    try {
      doc.addImage(campaign.customLogoUrl, 'PNG', margin, 18, 40, 40);
      textLeft = margin + 48;
    } catch {
      // Fallback if image load fails
    }
  }

  doc.text(campaign.name.toUpperCase(), textLeft, 32);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(203, 213, 225); // slate-300
  doc.text('OFFICIAL SOUL-WINNING REGISTRY & COLLATION SUMMARY REPORT', textLeft, 48);

  if (campaign.verse) {
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(248, 250, 252);
    const splitVerse = doc.splitTextToSize(`"${campaign.verse}"`, pageWidth - textLeft - 200);
    doc.text(splitVerse, textLeft, 64);
  }

  // Right Header Metadata
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(203, 213, 225);
  doc.text(`Generated: ${dateStr} at ${timeStr}`, pageWidth - margin, 32, { align: 'right' });
  doc.text(`Collation Scope: ${activeCentreName}`, pageWidth - margin, 48, { align: 'right' });
  doc.text(`Records in Report: ${total.toLocaleString()}`, pageWidth - margin, 64, { align: 'right' });

  // 2. Executive Summary Metrics Cards
  let yPos = 96;

  // Box 1: Total Records
  const cardWidth = (pageWidth - (margin * 2) - (12 * 4)) / 5;
  const cardHeight = 44;

  const summaryCards = [
    { label: 'FILTERED RECORDS', val: total.toLocaleString(), sub: 'Total In Report' },
    { label: 'NEW CONVERTS', val: `${newConverts.toLocaleString()}`, sub: total > 0 ? `${Math.round((newConverts / total) * 100)}% of total` : '0%' },
    { label: 'REDEDICATIONS', val: `${rededications.toLocaleString()}`, sub: total > 0 ? `${Math.round((rededications / total) * 100)}% of total` : '0%' },
    { label: 'RETURNEES', val: `${returnees.toLocaleString()}`, sub: total > 0 ? `${Math.round((returnees / total) * 100)}% of total` : '0%' },
    { label: 'VERIFIED SOULS', val: `${verified.toLocaleString()}`, sub: `${pending} pending approval` },
  ];

  summaryCards.forEach((c, i) => {
    const cardX = margin + i * (cardWidth + 12);
    doc.setFillColor(248, 250, 252); // slate-50
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.roundedRect(cardX, yPos, cardWidth, cardHeight, 4, 4, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text(c.label, cardX + 8, yPos + 13);

    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42); // slate-900
    doc.text(c.val, cardX + 8, yPos + 28);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text(c.sub, cardX + 8, yPos + 38);
  });

  // 3. Filter Parameters Sub-Bar
  yPos += cardHeight + 10;
  const activeFilters = [];
  if (filters.search) activeFilters.push(`Search: "${filters.search}"`);
  if (filters.centreFilter && filters.centreFilter !== 'all') activeFilters.push(`Centre: ${activeCentreName}`);
  if (filters.decisionFilter && filters.decisionFilter !== 'all') activeFilters.push(`Decision: ${filters.decisionFilter.replace('_', ' ')}`);
  if (filters.statusFilter && filters.statusFilter !== 'all') activeFilters.push(`Status: ${filters.statusFilter}`);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(`Active Filter Parameters:`, margin, yPos + 8);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(
    activeFilters.length > 0 ? activeFilters.join('  |  ') : 'None (Full Abuja FCT Dataset)',
    margin + 105,
    yPos + 8
  );

  yPos += 14;

  // 4. Data Table
  const tableData = records.map((rec, index) => {
    const centre = centres.find(c => c.id === rec.centreId);
    const dateFormatted = rec.wonAt ? rec.wonAt.slice(0, 10) : '-';
    const decisionLabel = rec.decisionType.replace('_', ' ').toUpperCase();
    const demo = `${rec.gender.toUpperCase()} / ${rec.ageBracket}`;

    return [
      (index + 1).toString(),
      `${rec.firstName} ${rec.lastName}`,
      rec.phone || 'N/A',
      demo,
      decisionLabel,
      centre ? `${centre.name}\n(${rec.community})` : rec.community,
      rec.wonByName,
      rec.followUpStatus.replace('_', ' ').toUpperCase(),
      dateFormatted,
    ];
  });

  autoTable(doc, {
    startY: yPos,
    head: [[
      '#',
      'Convert Name',
      'Phone Number',
      'Demographics',
      'Decision Type',
      'Collation Hub / Community',
      'Soul Winner',
      'Follow-Up Stage',
      'Date Won',
    ]],
    body: tableData,
    margin: { left: margin, right: margin, bottom: 36 },
    theme: 'grid',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'left',
      cellPadding: 6,
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [30, 41, 59],
      cellPadding: 5,
      valign: 'middle',
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { cellWidth: 24, halign: 'center' },
      1: { cellWidth: 100, fontStyle: 'bold' },
      2: { cellWidth: 70 },
      3: { cellWidth: 65 },
      4: { cellWidth: 75, fontStyle: 'bold' },
      5: { cellWidth: 120 },
      6: { cellWidth: 95 },
      7: { cellWidth: 85 },
      8: { cellWidth: 55, halign: 'center' },
    },
    didDrawPage: (data) => {
      // Footer on every page
      const pageNum = doc.getNumberOfPages();
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(148, 163, 184); // slate-400

      // Left footer
      doc.text(
        `${campaign.name} — Collation Directorate & Discipleship Registry`,
        margin,
        pageHeight - 16
      );

      // Right footer
      doc.text(
        `Page ${data.pageNumber} of ${pageNum}`,
        pageWidth - margin,
        pageHeight - 16,
        { align: 'right' }
      );
    },
  });

  // Save the generated PDF
  const filename = `Harvest_10K_Soul_Registry_Report_${now.toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
}
