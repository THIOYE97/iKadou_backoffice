import { format, formatDistanceToNow, parseISO, isValid } from 'date-fns';
import { fr } from 'date-fns/locale';

/**
 * Format an ISO date string to a readable date
 * e.g. "12 jan. 2025"
 */
export const readableDate = (isoString, fmt = 'd MMM yyyy') => {
  if (!isoString) return '—';
  try {
    const date = typeof isoString === 'string' ? parseISO(isoString) : isoString;
    if (!isValid(date)) return '—';
    return format(date, fmt, { locale: fr });
  } catch {
    return '—';
  }
};

/**
 * Format an ISO date string to a datetime
 * e.g. "12 jan. 2025 à 14:30"
 */
export const readableDateTime = (isoString) =>
  readableDate(isoString, "d MMM yyyy 'à' HH:mm");

/**
 * Returns relative time from now
 * e.g. "il y a 3 heures"
 */
export const readableTimestamp = (isoString) => {
  if (!isoString) return '—';
  try {
    const date = typeof isoString === 'string' ? parseISO(isoString) : isoString;
    if (!isValid(date)) return '—';
    return formatDistanceToNow(date, { addSuffix: true, locale: fr });
  } catch {
    return '—';
  }
};
