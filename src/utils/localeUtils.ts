// West Africa Time (WAT, UTC+1 - Nigeria Time) Formatting Utilities

export function toDateObj(date: Date | string | number): Date {
  if (date instanceof Date) return date;
  return new Date(date);
}

export function formatDateWAT(date: Date | string | number): string {
  try {
    const d = toDateObj(date);
    return new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Africa/Lagos',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(d);
  } catch {
    return String(date);
  }
}

export function formatTimeWAT(date: Date | string | number): string {
  try {
    const d = toDateObj(date);
    return new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Africa/Lagos',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).format(d);
  } catch {
    return String(date);
  }
}

export function formatDateTimeWAT(date: Date | string | number): string {
  try {
    const d = toDateObj(date);
    return `${formatDateWAT(d)} at ${formatTimeWAT(d)}`;
  } catch {
    return String(date);
  }
}
