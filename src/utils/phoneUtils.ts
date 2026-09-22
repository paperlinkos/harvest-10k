/**
 * Nigerian Phone Number Validation and Normalization Utility
 * Supports:
 * - 0XXXXXXXXXX (11 digits e.g. 08031234567, 0806..., 0703..., 0813..., 0901..., 0912..., etc.)
 * - +234XXXXXXXXXX or 234XXXXXXXXXX (13 chars starting with +234 followed by 10 digits)
 * Normalizes all valid numbers to international E.164 standard: +234XXXXXXXXXX
 */

export interface PhoneValidationResult {
  isValid: boolean;
  normalized: string;
  formatted: string;
  error?: string;
}

export function validateAndNormalizeNigerianPhone(input: string): PhoneValidationResult {
  if (!input || !input.trim()) {
    return {
      isValid: false,
      normalized: '',
      formatted: '',
      error: 'Phone number is required',
    };
  }

  // Strip spaces, dashes, parentheses, dots
  const cleaned = input.trim().replace(/[\s\-\(\)\.]/g, '');

  // Case 1: Starts with +234
  if (cleaned.startsWith('+234')) {
    const digits = cleaned.slice(4);
    if (!/^\d{10}$/.test(digits)) {
      return {
        isValid: false,
        normalized: cleaned,
        formatted: input,
        error: 'Invalid Nigerian number (+234 must be followed by 10 digits, e.g. +234 803 123 4567)',
      };
    }
    const formatted = `+234 ${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
    return {
      isValid: true,
      normalized: `+234${digits}`,
      formatted,
    };
  }

  // Case 2: Starts with 234 without '+'
  if (cleaned.startsWith('234') && cleaned.length === 13 && /^\d+$/.test(cleaned)) {
    const digits = cleaned.slice(3);
    const formatted = `+234 ${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
    return {
      isValid: true,
      normalized: `+234${digits}`,
      formatted,
    };
  }

  // Case 3: Local format starting with 0 (11 digits: e.g. 08031234567, 09012345678)
  if (cleaned.startsWith('0') && cleaned.length === 11 && /^\d+$/.test(cleaned)) {
    const digits = cleaned.slice(1);
    const formatted = `+234 ${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
    return {
      isValid: true,
      normalized: `+234${digits}`,
      formatted,
    };
  }

  // Invalid format
  return {
    isValid: false,
    normalized: cleaned,
    formatted: input,
    error: 'Please enter a valid Nigerian phone number (e.g. 0803 123 4567 or +234 803 123 4567)',
  };
}

/**
 * Format any normalized +234 number into readable spaced format: +234 803 123 4567
 */
export function formatNigerianPhone(phone: string): string {
  if (!phone) return '';
  const cleaned = phone.replace(/[\s\-\(\)\.]/g, '');
  if (cleaned.startsWith('+234') && cleaned.length === 14) {
    const digits = cleaned.slice(4);
    return `+234 ${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
  }
  if (cleaned.startsWith('0') && cleaned.length === 11) {
    const digits = cleaned.slice(1);
    return `+234 ${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
  }
  return phone;
}
