/**
 * Normalize booking timestamps to UTC ISO before storing in timestamptz columns.
 * Clients should send ISO with timezone; this also handles legacy datetime-local strings.
 */
const toTimestamptzISO = (value) => {
  if (value == null || value === '') return value;

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? value : value.toISOString();
  }

  const str = String(value).trim();
  const parsed = new Date(str);

  if (Number.isNaN(parsed.getTime())) {
    return str;
  }

  return parsed.toISOString();
};

module.exports = { toTimestamptzISO };
