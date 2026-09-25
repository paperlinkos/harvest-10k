// Verification & Pastoral Messaging Engine for Harvest 10K
import { SoulRecord, DecisionType } from '../types';
import { validateAndNormalizeNigerianPhone } from './phoneUtils';

export interface MessageTemplate {
  id: string;
  label: string;
  category: 'welcome' | 'discipleship' | 'fellowship' | 'service' | 'verify';
  iconName: string;
  template: string;
  description: string;
}

export const VERIFICATION_TEMPLATES: MessageTemplate[] = [
  {
    id: 'salvation_welcome',
    label: 'Salvation Welcome',
    category: 'welcome',
    iconName: 'Sparkles',
    template:
      'Praise God {firstName}! Heaven is rejoicing with us over your decision for Christ today during the Abuja Harvest! We warmly welcome you into God\'s family at {church}. Your life will never be the same! God bless you richly. — {winnerName} ({cellName})',
    description: 'Warm celebratory welcome for new converts and rededications.',
  },
  {
    id: 'foundation_school',
    label: 'Foundation School & Materials',
    category: 'discipleship',
    iconName: 'BookOpen',
    template:
      'Hello {firstName}! Congratulations on your salvation. We have reserved your complimentary New Convert Pack & Foundation School study guide at {church}. Reply to this message or visit us to begin your journey of growth in God\'s Word! — {winnerName}',
    description: 'Invites convert to Foundation School and discipleship classes.',
  },
  {
    id: 'cell_connect',
    label: 'Home Cell Fellowship Connect',
    category: 'fellowship',
    iconName: 'Home',
    template:
      'Hi {firstName}, this is {winnerName} from {cellName} ({church}). It was such a blessing meeting you at {outreachSpot}. You are specially invited to our weekly home fellowship meeting near {residentialDistrict}. We look forward to seeing you!',
    description: 'Connects the new convert to their local Abuja neighborhood cell.',
  },
  {
    id: 'sunday_invite',
    label: 'Sunday Service & Bus Transit',
    category: 'service',
    iconName: 'Church',
    template:
      'Praise the Lord {firstName}! We invite you to our special Sunday Celebration Service at {church}. Free transit is organized along the {residentialDistrict} axis. Come experience powerful worship, the Word, and miracles! — {winnerName}',
    description: 'Sunday service VIP invitation with local transportation mention.',
  },
  {
    id: 'quick_verify',
    label: 'Phone Verification Ping',
    category: 'verify',
    iconName: 'ShieldCheck',
    template:
      'Peace be with you {firstName}! This is a pastoral confirmation of your harvest registration with {church}. Please reply YES to verify your mobile number and receive your weekly spiritual devotionals. God bless you!',
    description: 'Direct verification text to ensure convert\'s phone number is reachable.',
  },
];

export interface FormattedMessageParams {
  firstName?: string;
  lastName?: string;
  fullName?: string;
  decisionType?: DecisionType | string;
  church?: string;
  winnerName?: string;
  cellName?: string;
  pcfName?: string;
  outreachSpot?: string;
  residentialDistrict?: string;
  phone?: string;
}

/**
 * Replaces placeholders in template string with live convert details
 */
export function buildPopulatedMessage(templateStr: string, data: FormattedMessageParams): string {
  const fName = (data.firstName || 'Beloved').trim();
  const lName = (data.lastName || '').trim();
  const full = data.fullName || (lName ? `${fName} ${lName}` : fName);
  const church = data.church || 'Christ Embassy Abuja';
  const winner = data.winnerName || 'Evangelist';
  const cell = data.cellName || 'Grace Cell';
  const pcf = data.pcfName || 'Haven PCF';
  const spot = data.outreachSpot || 'Abuja Outreach Field';
  const district = data.residentialDistrict || 'Abuja Central';

  let msg = templateStr
    .replace(/\{firstName\}/g, fName)
    .replace(/\{lastName\}/g, lName)
    .replace(/\{fullName\}/g, full)
    .replace(/\{church\}/g, church)
    .replace(/\{winnerName\}/g, winner)
    .replace(/\{cellName\}/g, cell)
    .replace(/\{pcfName\}/g, pcf)
    .replace(/\{outreachSpot\}/g, spot)
    .replace(/\{residentialDistrict\}/g, district);

  return msg.trim();
}

/**
 * Cleans phone number to international format for WhatsApp (e.g. 2348031234567)
 */
export function cleanPhoneForWhatsApp(phone: string): string {
  if (!phone) return '';
  const validation = validateAndNormalizeNigerianPhone(phone);
  if (validation.isValid && validation.normalized) {
    return validation.normalized.replace(/[^\d]/g, '');
  }

  let digits = phone.replace(/[^\d]/g, '');
  if (digits.startsWith('0')) {
    digits = '234' + digits.slice(1);
  } else if (!digits.startsWith('234') && digits.length === 10) {
    digits = '234' + digits;
  }
  return digits;
}

/**
 * Builds direct WhatsApp URL (launches WhatsApp Web or WhatsApp Desktop/Mobile app)
 */
export function generateWhatsAppUrl(phone: string, message: string): string {
  const cleanPhone = cleanPhoneForWhatsApp(phone);
  const encodedText = encodeURIComponent(message);
  return `https://wa.me/${cleanPhone}?text=${encodedText}`;
}

/**
 * Builds direct SMS Deep Link with iOS/Android compatibility
 */
export function generateSmsDeepLink(phone: string, message: string): string {
  const cleanPhone = cleanPhoneForWhatsApp(phone);
  const encodedText = encodeURIComponent(message);
  const isIOS = typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent);
  const separator = isIOS ? '&' : '?';
  return `sms:+${cleanPhone}${separator}body=${encodedText}`;
}

/**
 * Computes SMS metrics (character length, estimated SMS segment count, GSM charset)
 */
export function calculateSmsMetrics(message: string): {
  charCount: number;
  segments: number;
  charsPerSegment: number;
  remainingInSegment: number;
} {
  const len = message.length;
  // Standard GSM 7-bit is 160 for 1 segment, 153 per segment for multi-part
  if (len <= 160) {
    return {
      charCount: len,
      segments: len === 0 ? 0 : 1,
      charsPerSegment: 160,
      remainingInSegment: 160 - len,
    };
  }

  const segments = Math.ceil(len / 153);
  const currentSegmentCapacity = segments * 153;
  return {
    charCount: len,
    segments,
    charsPerSegment: 153,
    remainingInSegment: currentSegmentCapacity - len,
  };
}
