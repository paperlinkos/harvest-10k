// Nigerian Mobile Phone Validation & Formatting Utilities

export interface PhoneValidationResult {
  isValid: boolean;
  normalized: string;
  error?: string;
}

/**
 * Validates and normalizes Nigerian mobile phone numbers.
 * Supports inputs like:
 * - 0803 123 4567
 * - +234 803 123 4567
 * - 2348031234567
 * - 8031234567
 */
export function validateAndNormalizeNigerianPhone(input?: string | null): PhoneValidationResult {
  if (!input || !input.trim()) {
    return {
      isValid: false,
      normalized: '',
      error: 'Phone number is required for pastoral follow-up and verification.',
    };
  }

  // Remove all non-digit characters except leading plus
  const cleaned = input.trim().replace(/[^\d+]/g, '');
  let digitsOnly = cleaned.replace(/\+/g, '');

  // Strip international prefix if present
  if (digitsOnly.startsWith('234')) {
    digitsOnly = digitsOnly.slice(3);
  }

  // Strip leading 0 if present (e.g. 0803... -> 803...)
  if (digitsOnly.startsWith('0')) {
    digitsOnly = digitsOnly.slice(1);
  }

  // A valid Nigerian mobile number has 10 digits after prefix (starts with 7, 8, or 9)
  if (digitsOnly.length !== 10) {
    return {
      isValid: false,
      normalized: input.trim(),
      error: 'Nigerian phone number must be 11 digits (e.g. 0803 123 4567 or +234 803 123 4567).',
    };
  }

  const validFirstDigits = ['7', '8', '9'];
  if (!validFirstDigits.includes(digitsOnly[0])) {
    return {
      isValid: false,
      normalized: input.trim(),
      error: 'Nigerian mobile numbers typically begin with 070, 080, 081, 090, or 091.',
    };
  }

  // Normalized to standard international format: +234 803 123 4567
  const part1 = digitsOnly.slice(0, 3);
  const part2 = digitsOnly.slice(3, 6);
  const part3 = digitsOnly.slice(6);
  const normalized = `+234 ${part1} ${part2} ${part3}`;

  return {
    isValid: true,
    normalized,
  };
}

/**
 * Formats any phone number into readable format.
 */
export function formatNigerianPhone(phone?: string | null): string {
  if (!phone) return '';
  const validation = validateAndNormalizeNigerianPhone(phone);
  if (validation.isValid && validation.normalized) {
    return validation.normalized;
  }
  return phone.trim();
}
