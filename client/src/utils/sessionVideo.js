import { parseSessionScheduledDate } from './dateTime';

const GRACE_BEFORE_MS = 15 * 60 * 1000;
const GRACE_AFTER_MS = 30 * 60 * 1000;

export const canJoinBookingVideo = (session) => {
  if (!session) return false;

  const status = session.status;
  if (status === 'cancelled' || status === 'completed') return false;
  if (status === 'confirmed') return true;

  const scheduled = parseSessionScheduledDate(session);
  if (status !== 'pending' || !scheduled) return false;

  const durationMin = Number(session.durationMin ?? session.duration_min ?? 60);
  const now = Date.now();
  const start = scheduled.getTime() - GRACE_BEFORE_MS;
  const end = scheduled.getTime() + durationMin * 60 * 1000 + GRACE_AFTER_MS;

  return now >= start && now <= end;
};

export const getSessionVideoPath = (session) => {
  if (!canJoinBookingVideo(session)) {
    return null;
  }

  const bookingId = session._id || session.id;
  return bookingId ? `/sessions/${bookingId}/meeting` : null;
};
