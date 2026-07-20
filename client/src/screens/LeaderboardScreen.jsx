import React, { useState, useEffect } from 'react';
import { FaTrophy, FaMedal, FaGithub, FaCode, FaChartLine, FaInfoCircle, FaMapMarkerAlt, FaLocationArrow } from 'react-icons/fa';
import { OverlayTrigger, Popover } from 'react-bootstrap';
import { useSelector } from 'react-redux';
import api from '../utils/api';
import Loader from '../components/Loader';
import Message from '../components/Message';
import { Link } from 'react-router-dom';
import { BACKEND_URL } from '../config/runtime';

const LeaderboardScreen = () => {
  const { userInfo } = useSelector((state) => state.userLogin);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [department, setDepartment] = useState('');
  const [nearbyOnly, setNearbyOnly] = useState(false);
  const [requestingLoc, setRequestingLoc] = useState(false);
  const [locationSaved, setLocationSaved] = useState(Boolean(userInfo?.latitude && userInfo?.longitude));

  const fetchLeaderboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (department) params.append('department', department);
      if (nearbyOnly) params.append('nearby', 'true');

      const query = params.toString() ? `?${params.toString()}` : '';
      const { data } = await api.get(`/api/leaderboard${query}`);
      setLeaderboard(data.users || data);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, [department, nearbyOnly]);

  const handleEnableLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setRequestingLoc(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          // Attempt to get human readable city/location if possible or default to Lat/Lng
          let locationName = `Lat: ${latitude.toFixed(2)}, Lng: ${longitude.toFixed(2)}`;
          try {
            const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
            const geoData = await geoRes.json();
            if (geoData?.address) {
              const city = geoData.address.city || geoData.address.town || geoData.address.village || geoData.address.state;
              if (city) locationName = city;
            }
          } catch (e) {
            console.log('Reverse geocode lookup skipped:', e.message);
          }

          await api.put('/api/users/profile', {
            latitude,
            longitude,
            location: locationName,
          });

          setLocationSaved(true);
          setNearbyOnly(true);
          fetchLeaderboard();
        } catch (err) {
          console.error('Failed to save user location:', err);
          alert('Failed to save location to profile.');
        } finally {
          setRequestingLoc(false);
        }
      },
      (err) => {
        console.error('Geolocation permission error:', err);
        alert('Location permission denied or unavailable.');
        setRequestingLoc(false);
      }
    );
  };

  const scoreExplanationPopover = (
    <Popover id="popover-dev-score" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
      <Popover.Header as="h3" style={{ background: 'var(--bg-overlay)', color: 'var(--text-primary)', borderBottom: '1px solid var(--border-subtle)', margin: 0 }}>Dev Score Calculation</Popover.Header>
      <Popover.Body style={{ color: 'var(--text-secondary)' }}>
        <strong>Dev Score</strong> is out of 100, calculated as the <strong>combined average</strong> of both platforms:<br/><br/>
        <strong>GitHub:</strong> Based on Stars, Followers, Public Repos, and Forks using a logarithmic scale to reward early milestones.<br/>
        <strong>LeetCode:</strong> Based on the percentage of Easy (1x weight), Medium (3x weight), and Hard (6x weight) problems solved.<br/><br/>
        <em>The leaderboard only shows users who have <strong>both</strong> GitHub and LeetCode accounts connected. Dev Score = (GitHub Score + LeetCode Score) / 2.</em><br/><br/>
        <em>Users with only one platform connected still get a score on their profile but won't appear here.</em>
      </Popover.Body>
    </Popover>
  );

  return (
    <div className="phase2-page">
      <div className="phase2-shell">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', margin: 0 }}>
            <FaTrophy style={{ marginRight: '8px', color: 'var(--accent-primary)' }} /> Developer Leaderboard
            <OverlayTrigger trigger={['hover', 'focus']} placement="right" overlay={scoreExplanationPopover}>
              <span style={{ cursor: 'pointer', marginLeft: '12px', fontSize: '1.2rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center' }}>
                <FaInfoCircle />
              </span>
            </OverlayTrigger>
          </h2>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            {/* Location Permission / Filter Controls */}
            {!locationSaved ? (
              <button
                type="button"
                className="phase2-button phase2-button-secondary"
                onClick={handleEnableLocation}
                disabled={requestingLoc}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}
              >
                <FaLocationArrow style={{ color: '#10b981' }} />
                {requestingLoc ? 'Detecting Location...' : 'Enable Location Access'}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setNearbyOnly(!nearbyOnly)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 14px',
                  borderRadius: '8px',
                  border: nearbyOnly ? '1px solid #10b981' : '1px solid var(--border-subtle)',
                  background: nearbyOnly ? 'rgba(16, 185, 129, 0.15)' : 'var(--bg-overlay)',
                  color: nearbyOnly ? '#10b981' : 'var(--text-primary)',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '0.85rem'
                }}
              >
                <FaMapMarkerAlt /> {nearbyOnly ? 'Showing Nearby People' : 'Filter Nearby People'}
              </button>
            )}

            {/* Department Filter */}
            <select 
              value={department} 
              onChange={(e) => setDepartment(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: '8px', background: 'var(--bg-overlay)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}
            >
              <option value="">All Departments</option>
              <option value="Computer Science">Computer Science</option>
              <option value="Information Technology">Information Technology</option>
            </select>
          </div>
        </div>

        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          Only users with both GitHub & LeetCode connected are ranked. Scores update daily at 6:00 AM.
        </p>

        {loading ? <Loader /> : error ? <Message variant="danger">{error}</Message> : (
          leaderboard.length === 0 ? (
             <div className="phase2-empty">
               {nearbyOnly ? 'No developers found close to your location yet. Expand filter or invite peers!' : 'No users found. Connect both GitHub & LeetCode on your profile to appear on the leaderboard.'}
             </div>
          ) : (
            <div className="leaderboard-list" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {leaderboard.map((user, index) => {
                let rankIcon = null;
                if (index === 0) rankIcon = <FaTrophy style={{ color: '#FFD700', fontSize: '1.5rem' }} />;
                else if (index === 1) rankIcon = <FaMedal style={{ color: '#C0C0C0', fontSize: '1.5rem' }} />;
                else if (index === 2) rankIcon = <FaMedal style={{ color: '#CD7F32', fontSize: '1.5rem' }} />;
                else rankIcon = <span style={{ fontWeight: 'bold', fontSize: '1.2rem', color: 'var(--text-secondary)', width: '24px', textAlign: 'center' }}>#{index + 1}</span>;

                return (
                  <div key={user._id} className="phase2-glass phase2-panel" style={{ display: 'flex', alignItems: 'center', padding: '16px', borderRadius: '12px', gap: '16px', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px' }}>
                      {rankIcon}
                    </div>
                    
                    <Link to={`/profile/${user._id}`} style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', gap: '12px', flex: 1, minWidth: '220px' }}>
                      <div className="avatar-wrapper" style={{ width: '48px', height: '48px', borderRadius: '50%', overflow: 'hidden', background: 'var(--bg-card)' }}>
                        {user.profileImage ? (
                          <img src={user.profileImage.startsWith('data:image') || user.profileImage.startsWith('http') ? user.profileImage : `${BACKEND_URL}${user.profileImage}`} alt={user.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontWeight: '600', color: 'var(--text-primary)', fontSize: '1.1rem' }}>{user.name}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{user.department || 'General'}</span>
                          {(user.distanceKm != null || user.location || user.isNearby) && (
                            <span style={{ fontSize: '0.78rem', color: '#10b981', display: 'inline-flex', alignItems: 'center', gap: '3px', background: 'rgba(16, 185, 129, 0.1)', padding: '2px 8px', borderRadius: '12px' }}>
                              <FaMapMarkerAlt /> {user.distanceKm != null ? `${user.distanceKm} km away` : user.location || 'Nearby'}
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>

                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}><FaGithub /> {user.githubScore || 0}</span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}><FaCode /> {user.leetcodeScore || 0}</span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', background: 'var(--bg-overlay)', padding: '8px 12px', borderRadius: '8px' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Dev Score</span>
                        <span style={{ fontWeight: 'bold', color: 'var(--accent-primary)', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <FaChartLine /> {user.devScore || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default LeaderboardScreen;
