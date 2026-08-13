const BOOKING_JOIN_GRACE_BEFORE_MS = 15 * 60 * 1000;
const BOOKING_JOIN_GRACE_AFTER_MS = 30 * 60 * 1000;

const isWithinBookingJoinWindow = (bookingSession) => {
  const scheduledAt = bookingSession?.scheduled_at;
  if (!scheduledAt) return false;

  const scheduled = new Date(scheduledAt);
  if (Number.isNaN(scheduled.getTime())) return false;

  const durationMin = Number(bookingSession.duration_min) || 60;
  const now = Date.now();
  const start = scheduled.getTime() - BOOKING_JOIN_GRACE_BEFORE_MS;
  const end = scheduled.getTime() + durationMin * 60 * 1000 + BOOKING_JOIN_GRACE_AFTER_MS;

  return now >= start && now <= end;
};

const canOpenBookingVideo = (bookingSession) => {
  if (!bookingSession) return false;

  const status = bookingSession.status;
  if (status === 'cancelled' || status === 'completed') return false;
  if (status === 'confirmed') return true;
  if (status === 'pending' && isWithinBookingJoinWindow(bookingSession)) return true;

  return false;
};

const bookingVideoAccessMessage = (bookingSession) => {
  if (!bookingSession) return 'Session not found';

  const status = bookingSession.status;
  if (status === 'cancelled') return 'This booking was cancelled.';
  if (status === 'completed') return 'This session has already been completed.';

  if (status === 'pending' && !isWithinBookingJoinWindow(bookingSession)) {
    return 'Video room opens 15 minutes before the scheduled start time. Confirm the booking or wait until then.';
  }

  if (status === 'pending') {
    return 'Waiting for booking confirmation. You can still join during the scheduled session window.';
  }

  return 'Video room is not available for this booking yet.';
};

module.exports = {
  BOOKING_JOIN_GRACE_BEFORE_MS,
  BOOKING_JOIN_GRACE_AFTER_MS,
  isWithinBookingJoinWindow,
  canOpenBookingVideo,
  bookingVideoAccessMessage,
};
