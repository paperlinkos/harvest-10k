import { DecisionType } from '../types';

/**
 * Normalizes a Nigerian phone number to international WhatsApp format (e.g., 2348031234567).
 */
export function formatPhoneForWhatsApp(rawPhone: string): string | null {
  if (!rawPhone) return null;
  // Remove all non-digit characters
  let digits = rawPhone.replace(/\D/g, '');

  // If starts with 0 (e.g. 08031234567), replace leading 0 with 234
  if (digits.startsWith('0') && digits.length === 11) {
    digits = '234' + digits.substring(1);
  } else if (digits.startsWith('234') && digits.length >= 13) {
    // Already in 234 format
  } else if (digits.length === 10) {
    // Missing leading zero, e.g. 8031234567
    digits = '234' + digits;
  }

  return digits.length >= 12 ? digits : null;
}

/**
 * Generates a pre-composed faith-filled WhatsApp gospel welcome message.
 */
export function generateWhatsAppGospelMessage(params: {
  firstName: string;
  lastName?: string;
  decisionType?: DecisionType;
  centreName?: string;
  soulWinnerName?: string;
}): string {
  const name = params.firstName ? params.firstName.trim() : 'Beloved';
  const church = params.centreName ? `Christ Embassy ${params.centreName}` : 'Christ Embassy Abuja';

  if (params.decisionType === 'rededication') {
    return (
      `Dear ${name},\n\n` +
      `Grace and peace to you! We are rejoicing with you on your rededication to our Lord Jesus Christ today. ` +
      `The Lord has restored your steps and His presence is mighty with you! (Psalm 23:3)\n\n` +
      `Our pastoral team at ${church} is standing with you in prayer. ` +
      `Please let us know how we can support your walk with God. You are greatly loved!`
    );
  }

  if (params.decisionType === 'returnee') {
    return (
      `Dear ${name},\n\n` +
      `Welcome home! We thank God for your return to fellowship today. ` +
      `"There is joy in the presence of the angels of God over one soul that returns." (Luke 15:10)\n\n` +
      `We would love to welcome you back at ${church} this Sunday! Let us know if you need church address or service times. God bless you!`
    );
  }

  // Default: New Convert
  return (
    `Dear ${name},\n\n` +
    `Congratulations on making the greatest decision of your life today by receiving Jesus Christ as your Lord and Savior! 🎉\n\n` +
    `"Therefore if any man be in Christ, he is a new creature: old things are passed away; behold, all things are become new." — 2 Corinthians 5:17\n\n` +
    `You are now a child of God, filled with His life, righteousness, and peace. ` +
    `Our pastoral team at ${church} would love to help you grow in God's Word and gift you free study materials (including Rhapsody of Realities).\n\n` +
    `Reply to this message anytime so we can connect. God bless you abundantly!`
  );
}

/**
 * Generates the full clickable https://wa.me/... URL.
 */
export function getWhatsAppLink(params: {
  phone: string;
  firstName: string;
  lastName?: string;
  decisionType?: DecisionType;
  centreName?: string;
  soulWinnerName?: string;
}): string | null {
  const cleanPhone = formatPhoneForWhatsApp(params.phone);
  if (!cleanPhone) return null;

  const text = generateWhatsAppGospelMessage(params);
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
}
