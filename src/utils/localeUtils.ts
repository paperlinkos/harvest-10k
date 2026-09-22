/**
 * Locale & Time Utilities for Abuja, Federal Capital Territory, Nigeria
 * Timezone: West Africa Time (WAT / UTC+1, Africa/Lagos)
 * Format: en-NG (DD/MM/YYYY)
 */

export const WAT_TIMEZONE = 'Africa/Lagos';

/**
 * Format date as DD/MM/YYYY in WAT (en-NG)
 */
export function formatDateWAT(dateInput?: string | number | Date | null): string {
  if (!dateInput) return '';
  const date = typeof dateInput === 'string' || typeof dateInput === 'number' ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: WAT_TIMEZONE,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

/**
 * Format time in 24h format (HH:mm or HH:mm:ss) in WAT
 */
export function formatTimeWAT(dateInput?: string | number | Date | null, includeSeconds = false): string {
  if (!dateInput) return '';
  const date = typeof dateInput === 'string' || typeof dateInput === 'number' ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: WAT_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    second: includeSeconds ? '2-digit' : undefined,
    hour12: false,
  }).format(date);
}

/**
 * Format full datetime string with WAT suffix, e.g. "23/08/2026, 14:32 WAT"
 */
export function formatDateTimeWAT(dateInput?: string | number | Date | null): string {
  if (!dateInput) return '';
  const date = typeof dateInput === 'string' || typeof dateInput === 'number' ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return '';
  const dateStr = formatDateWAT(date);
  const timeStr = formatTimeWAT(date);
  return `${dateStr}, ${timeStr} WAT`;
}

/**
 * Format medium date string e.g. "23 Aug 2026"
 */
export function formatDateMediumWAT(dateInput?: string | number | Date | null): string {
  if (!dateInput) return '';
  const date = typeof dateInput === 'string' || typeof dateInput === 'number' ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: WAT_TIMEZONE,
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}
