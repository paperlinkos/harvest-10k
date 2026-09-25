// WhatsApp Pastoral Follow-Up Link Generator for Harvest 10K

export interface WhatsAppLinkParams {
  phone?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  decisionType?: string | null;
  centreName?: string | null;
  soulWinnerName?: string | null;
  customMessage?: string | null;
}

export function getWhatsAppLink(params: WhatsAppLinkParams): string | null {
  const {
    phone,
    firstName = 'Beloved',
    decisionType = 'decision for Christ',
    centreName = 'Christ Embassy Abuja',
    soulWinnerName,
    customMessage,
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

  const decisionLabel =
    decisionType === 'new_convert'
      ? 'giving your heart to Jesus Christ as your Lord and Saviour'
      : decisionType === 'rededication'
      ? 'rededicating your walk with the Lord Jesus'
      : 'returning into fellowship with God';

  const defaultMessage =
    customMessage ||
    `Praise God ${firstName || 'Beloved'}! We are rejoicing with all of heaven over your ${decisionLabel} today during the Abuja 10,000 Souls Victory Campaign! We warmly welcome you into God's family at ${centreName}. God bless you richly!`;

  return `https://wa.me/${digits}?text=${encodeURIComponent(defaultMessage)}`;
}
