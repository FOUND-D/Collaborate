export const getSessionScheduledAt = (session) => session?.scheduledAt ?? session?.scheduled_at ?? null;

export const parseSessionScheduledDate = (session) => {
  const value = getSessionScheduledAt(session);
  if (!value) return null;

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

/**
 * Convert `<input type="datetime-local">` or local date + time to UTC ISO for the API.
 * datetime-local values are always in the user's local timezone.
 */
export const localDateTimeToISO = (value) => {
  if (!value) return '';

  const trimmed = String(value).trim();
  const date = new Date(trimmed);

  if (Number.isNaN(date.getTime())) {
    return trimmed;
  }

  return date.toISOString();
};

export const formatSessionSchedule = (value, options = {}) => {
  if (!value) return 'Not scheduled';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  const { withTime = true } = options;

  if (withTime) {
    return date.toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  }

  return date.toLocaleDateString(undefined, { dateStyle: 'medium' });
};
