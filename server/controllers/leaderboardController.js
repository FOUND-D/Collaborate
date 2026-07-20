const asyncHandler = require('../middleware/asyncHandler');
const { getTopUsersByDevScore } = require('../lib/repo');

function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return null;
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  return Math.round(d * 10) / 10;
}

const getLeaderboard = asyncHandler(async (req, res) => {
  const { department, nearby } = req.query;
  const limit = Math.min(parseInt(req.query.limit, 10) || 50, 100);

  let rawUsers = await getTopUsersByDevScore({ limit: 100, department: department || null });

  const currentUser = req.user;
  const currentLat = currentUser?.latitude;
  const currentLng = currentUser?.longitude;
  const currentLocation = currentUser?.location ? currentUser.location.toLowerCase().trim() : '';

  let users = rawUsers.map((u) => {
    let distanceKm = null;
    let isNearby = false;

    if (currentLat != null && currentLng != null && u.latitude != null && u.longitude != null) {
      distanceKm = getDistanceFromLatLonInKm(currentLat, currentLng, u.latitude, u.longitude);
      if (distanceKm !== null && distanceKm <= 100) {
        isNearby = true;
      }
    } else if (currentLocation && u.location && u.location.toLowerCase().trim() === currentLocation) {
      isNearby = true;
    }

    return {
      ...u,
      distanceKm,
      isNearby,
    };
  });

  if (nearby === 'true') {
    users = users.filter((u) => u.isNearby || (u.distanceKm !== null && u.distanceKm <= 100));
    users.sort((a, b) => {
      if (a.distanceKm !== null && b.distanceKm !== null) return a.distanceKm - b.distanceKm;
      if (a.distanceKm !== null) return -1;
      if (b.distanceKm !== null) return 1;
      return b.devScore - a.devScore;
    });
  }

  res.json({ type: 'devscore', users: users.slice(0, limit) });
});

module.exports = { getLeaderboard };
