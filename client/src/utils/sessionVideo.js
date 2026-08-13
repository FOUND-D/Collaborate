export const getSessionVideoPath = (session) => {
  if (!session || session.status !== 'confirmed') {
    return null;
  }

  const teamId = session.teamId || session.team_id || session.team?._id;
  if (teamId) {
    return `/team/${teamId}/session`;
  }

  const bookingId = session._id || session.id;
  return bookingId ? `/sessions/${bookingId}/meeting` : null;
};
