export type MessageTemplateType = 'welcome' | 'foundation_school' | 'cell_invite' | 'custom';

export interface WhatsAppLinkParams {
  phone?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  decisionType?: string | null;
  centreName?: string | null;
  soulWinnerName?: string | null;
  templateType?: MessageTemplateType;
  customMessage?: string | null;
  cellName?: string | null;
  pcfName?: string | null;
}

export function getWhatsAppLink(params: WhatsAppLinkParams): string | null {
  const {
    phone,
    firstName = 'Beloved',
    decisionType = 'new_convert',
    centreName = 'Christ Embassy Abuja Zone 1',
    soulWinnerName = 'your Soul Winner',
    templateType = 'welcome',
    customMessage,
    cellName = 'our Cell Fellowship',
  } = params;

  if (!phone || !phone.trim()) return null;

  // Clean phone to international number with no spaces, symbols, or plus
  let digits = phone.replace(/[^\d]/g, '');

  if (digits.startsWith('0')) {
    digits = '234' + digits.slice(1);
  } else if (!digits.startsWith('234')) {
    digits = '234' + digits;
  }

  // Must be at least 11 digits (e.g. 2348031234567)
  if (digits.length < 11) return null;

  let messageText = customMessage || '';

  if (!messageText) {
    if (templateType === 'foundation_school') {
      messageText = `Praise God ${firstName}! 🌟 Congratulations on your decision for Christ! You are warmly invited to enroll in our Believers' Foundation School at ${centreName}. This class will build you up in God's Word and equip you for a glorious life in Christ. Reply "YES" to confirm your registration! God bless you!`;
    } else if (templateType === 'cell_invite') {
      messageText = `Hello ${firstName}! 👋 God bless you! Following your glorious decision during the Harvest 10,000 Souls Campaign, we invite you to join ${cellName} for an uplifting time of prayer, fellowship, and God's Word this week. We would love to have you with us!`;
    } else {
      // Welcome template
      const decisionLabel =
        decisionType === 'new_convert'
          ? 'giving your heart to Jesus Christ as your Lord and Saviour'
          : decisionType === 'rededication'
          ? 'rededicating your walk with the Lord Jesus'
          : 'returning into fellowship with God';

      messageText = `Praise God ${firstName}! 🙌 We are rejoicing with all of heaven over your ${decisionLabel} during the Abuja 10,000 Souls Victory Campaign! We warmly welcome you to ${centreName}. Your Soul Winner (${soulWinnerName}) and our Pastoral Care team are here to support your Christian walk. God bless you richly!`;
    }
  }

  return `https://wa.me/${digits}?text=${encodeURIComponent(messageText)}`;
}

/**
 * Generate a formatted executive briefing text ready for 1-click copy to Pastoral & Leadership WhatsApp groups
 */
export function generateExecutiveWhatsAppBriefing(data: {
  totalSouls: number;
  target: number;
  attainmentPercent: number;
  newConverts: number;
  rededications: number;
  returnees: number;
  topCentres: { name: string; total: number }[];
  dateString?: string;
}): string {
  const {
    totalSouls,
    target,
    attainmentPercent,
    newConverts,
    rededications,
    returnees,
    topCentres,
    dateString = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
  } = data;

  const topCentresText = topCentres.length > 0
    ? topCentres.map((c, i) => `   ${i + 1}. *${c.name}*: ${c.total.toLocaleString()} souls`).join('\n')
    : '   1. All Centres Reporting';

  return `🔥 *ABUJA ZONE 1 — HARVEST 10K EXECUTIVE BRIEFING* 🔥
📅 *Date*: ${dateString}

📊 *CAMPAIGN PROGRESS SUMMARY*
• *Total Souls Harvested*: *${totalSouls.toLocaleString()}* / ${target.toLocaleString()} (${attainmentPercent}%)
• *New Converts*: ${newConverts.toLocaleString()}
• *Rededications*: ${rededications.toLocaleString()}
• *Returnees*: ${returnees.toLocaleString()}

🏆 *TOP PERFORMING CENTRES*
${topCentresText}

🙌 *Praise the Lord for multitudinous harvests across Abuja FCT!*
_Collation Command Centre — Christ Embassy Abuja Zone 1_`;
}
