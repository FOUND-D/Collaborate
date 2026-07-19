import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';
import { GitHubCalendar } from 'react-github-calendar';
import * as ActivityCalendarNS from 'react-activity-calendar';
import {
  FaGithub,
  FaCode,
  FaChartLine,
  FaLinkedin,
  FaGlobe,
  FaEdit,
  FaStar,
  FaRegStar,
  FaPlus,
  FaBook,
  FaPencilAlt,
  FaTimes,
  FaExternalLinkAlt,
  FaCheckCircle,
  FaBrain,
  FaGraduationCap,
  FaCodeBranch,
} from 'react-icons/fa';
import {
  updateUserProfile,
  updateUserProfileImage,
  refreshDevScore,
} from '../actions/userActions';
import { listUserSkills, listSkills, createUserSkill, deleteUserSkill } from '../actions/skillActions';
import { listProjects } from '../actions/projectActions';
import { listRatings } from '../actions/ratingActions';
import api from '../utils/api';
import Loader from '../components/Loader';
import Message from '../components/Message';
import AchievementTags from '../components/AchievementTags';
import { BACKEND_URL } from '../config/runtime';
import DirectRatingModal from '../components/DirectRatingModal';
import './ProfileScreen.css';
import './SkillExchange.css';

const ProfileScreen = () => {
  const ActivityCalendar = ActivityCalendarNS.ActivityCalendar;
  const { userId: paramUserId } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [showDirectRatingModal, setShowDirectRatingModal] = useState(false);

  const userLogin = useSelector((state) => state.userLogin);
  const { userInfo } = userLogin;

  const userUpdateProfile = useSelector((state) => state.userUpdateProfile);
  const { success: updateSuccess, loading: updateLoading, error: updateError } = userUpdateProfile;

  const { skills: userSkills = [] } = useSelector((state) => state.userSkillList);
  const { skills: taxonomy = [] } = useSelector((state) => state.skillList);
  const { projects = [] } = useSelector((state) => state.projectList);
  const { ratings = [] } = useSelector((state) => state.ratingList);

  const [isEditingSkills, setIsEditingSkills] = useState(false);
  const [skillDraft, setSkillDraft] = useState({
    query: '',
    level: 'intermediate',
    selectedSkill: null,
    showSuggestions: false,
    activeIndex: -1,
    inlineError: false
  });

  const [profileUser, setProfileUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [badges, setBadges] = useState([]);

  // Tab State
  const [activeTab, setActiveTab] = useState('github');
  
  // External Data State
  const [githubData, setGithubData] = useState(null);
  const [githubRepos, setGithubRepos] = useState([]);
  const [pinnedRepos, setPinnedRepos] = useState([]);
  const [loadingGithub, setLoadingGithub] = useState(false);
  const [githubError, setGithubError] = useState(null);

  const [leetcodeData, setLeetcodeData] = useState(null);
  const [loadingLeetcode, setLoadingLeetcode] = useState(false);
  const [leetcodeError, setLeetcodeError] = useState(null);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);

  // Form states
  const [editForm, setEditForm] = useState({
    name: '',
    bio: '',
    department: '',
    yearOfStudy: '',
    githubUsername: '',
    githubShowPrivate: false,
    linkedinUrl: '',
    leetcodeUsername: '',
    portfolioUrl: '',
  });

  const isOwnProfile = !paramUserId || paramUserId === 'me' || paramUserId === userInfo?._id;
  const targetId = (!paramUserId || paramUserId === 'me') ? userInfo?._id : paramUserId;

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data: user } = await api.get(`/api/users/${targetId}`);
        setProfileUser(user);
        
        setEditForm({
          name: user.name || '',
          bio: user.bio || '',
          department: user.department || '',
          yearOfStudy: user.yearOfStudy ? String(user.yearOfStudy) : '',
          githubUsername: user.githubUsername || '',
          githubShowPrivate: user.githubShowPrivate || false,
          linkedinUrl: user.linkedinUrl || '',
          leetcodeUsername: user.leetcodeUsername || '',
          portfolioUrl: user.portfolioUrl || '',
        });

        const { data: badgeData } = await api.get(`/api/badges/user/${targetId}`);
        setBadges(badgeData.badges || []);

        dispatch(listUserSkills(targetId));
        dispatch(listProjects());
        dispatch(listRatings(targetId));
      } catch (err) {
        setError(err.response?.data?.message || err.message);
      } finally {
        setLoading(false);
      }
    };

    if (targetId) {
      setProfileUser(null); // Reset profile user while fetching new one
      setBadges([]);
      fetchData();
      // Reset external data when user changes
      setGithubData(null);
      setGithubRepos([]);
      setPinnedRepos([]);
      setLeetcodeData(null);
      setActiveTab('github');
    }
  }, [targetId, dispatch]);

  const toggleBadgeVisibility = async (badgeId) => {
    try {
      const { data } = await api.put(`/api/badges/${badgeId}/visibility`);
      setBadges(prev => prev.map(b => (b._id === badgeId || b.id === badgeId) ? { ...b, type: data.type } : b));
      // Re-fetch profile user to update the visible badges count under name immediately
      const { data: user } = await api.get(`/api/users/${targetId}`);
      setProfileUser(user);
    } catch (err) {
      console.error('Failed to toggle badge visibility', err);
    }
  };

  const fetchGithub = async () => {
    let username = profileUser?.githubUsername;
    if (!username || githubData) return;

    if (username.includes('github.com/')) {
      username = username.split('github.com/')[1].split('/')[0];
    }

    setLoadingGithub(true);
    setGithubError(null);
    try {
      const { data } = await api.get(`/api/users/github/${username}?showPrivate=${profileUser?.githubShowPrivate || false}`);
      setGithubData({ ...data.user, contributionCalendar: data.contributionCalendar });
      setGithubRepos(data.repos);
      setPinnedRepos(data.pinnedRepoNames || []);
    } catch (err) {
      console.error('GitHub API failed', err);
      setGithubError('Could not load GitHub data. Try again later.');
    } finally {
      setLoadingGithub(false);
    }
  };

  const fetchLeetcode = async () => {
    let username = profileUser?.leetcodeUsername;
    if (!username || leetcodeData) return;

    // Robust stripping if full URL was somehow saved
    if (username.includes('leetcode.com/')) {
      const parts = username.split('leetcode.com/')[1].split('/');
      username = parts[0] || parts[1]; // handle trailing slash
    }

    setLoadingLeetcode(true);
    setLeetcodeError(null);
    try {
      console.log(`Fetching LeetCode stats for: ${username}`);
      const res = await axios.get(`/leetcode-proxy/${username}`);
      // The new API (faisalshohag) returns the data directly or in a specific format
      if (res.data && res.data.totalSolved !== undefined) {
        setLeetcodeData(res.data);
      } else {
        setLeetcodeError('LeetCode user not found or data unavailable.');
      }
    } catch (err) {
      console.error('LeetCode API failed', err);
      setLeetcodeError('Could not load LeetCode stats. The API might be down or rate-limited.');
    } finally {
      setLoadingLeetcode(false);
    }
  };

  const handleTabSwitch = (tab) => {
    setActiveTab(tab);
  };

  const leetcodeCalendarData = useMemo(() => {
    if (!leetcodeData?.submissionCalendar) return [];
    try {
      const calendar = JSON.parse(leetcodeData.submissionCalendar);
      return Object.entries(calendar).map(([timestamp, count]) => {
        const date = new Date(parseInt(timestamp) * 1000).toISOString().split('T')[0];
        let level = 0;
        if (count > 0) level = 1;
        if (count > 2) level = 2;
        if (count > 5) level = 3;
        if (count > 10) level = 4;
        return { date, count, level };
      });
    } catch (e) {
      return [];
    }
  }, [leetcodeData]);

  useEffect(() => {
    // Only fetch if profileUser is loaded and matches the targetId
    if (profileUser?._id !== targetId) return;

    if (activeTab === 'github' && profileUser?.githubUsername && !githubData && !loadingGithub) {
      fetchGithub();
    }
    if (activeTab === 'leetcode' && profileUser?.leetcodeUsername && !leetcodeData && !loadingLeetcode) {
      fetchLeetcode();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, profileUser?._id, profileUser?.githubUsername, profileUser?.leetcodeUsername, targetId]);

  const totalStars = useMemo(() => {
    return githubRepos.reduce((acc, repo) => acc + (repo.stargazers_count || 0), 0);
  }, [githubRepos]);

  const topRepos = useMemo(() => {
    if (pinnedRepos && pinnedRepos.length > 0) {
      const pinned = githubRepos.filter(repo => pinnedRepos.includes(repo.name.toLowerCase()));
      if (pinned.length > 0) return pinned;
    }
    return [...githubRepos]
      .sort((a, b) => {
        if (b.stargazers_count !== a.stargazers_count) {
          return b.stargazers_count - a.stargazers_count;
        }
        return new Date(b.updated_at) - new Date(a.updated_at);
      })
      .slice(0, 6);
  }, [githubRepos, pinnedRepos]);

  const canTeachSkills = userSkills.filter(s => s.type === 'can_teach');

  const filteredSuggestions = useMemo(() => {
    const q = skillDraft.query.trim().toLowerCase();
    if (q.length < 1) return [];
    return taxonomy
      .filter((skill) => skill.name.toLowerCase().includes(q))
      .sort((a, b) => a.name.localeCompare(b.name))
      .slice(0, 8);
  }, [taxonomy, skillDraft.query]);

  const handleSelectSkill = (skill) => {
    setSkillDraft(prev => ({
      ...prev,
      query: '',
      selectedSkill: skill,
      showSuggestions: false,
      activeIndex: -1
    }));
  };

  const handleKeyDown = (e) => {
    const suggestions = filteredSuggestions;
    const q = skillDraft.query.trim();
    const hasMatches = suggestions.length > 0;
    const canAddNew = q.length > 0 && !hasMatches;
    const maxIndex = hasMatches ? suggestions.length - 1 : (canAddNew ? 0 : -1);

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSkillDraft(prev => ({
        ...prev,
        activeIndex: maxIndex >= 0 ? (prev.activeIndex + 1) % (maxIndex + 1) : -1
      }));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSkillDraft(prev => ({
        ...prev,
        activeIndex: maxIndex >= 0 ? (prev.activeIndex - 1 + (maxIndex + 1)) % (maxIndex + 1) : -1
      }));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (hasMatches && skillDraft.activeIndex >= 0 && suggestions[skillDraft.activeIndex]) {
        handleSelectSkill(suggestions[skillDraft.activeIndex]);
      } else if (canAddNew && skillDraft.activeIndex === 0) {
        handleSelectSkill({ id: null, name: q });
      }
    } else if (e.key === 'Escape') {
      setSkillDraft(prev => ({ ...prev, showSuggestions: false, activeIndex: -1 }));
    }
  };

  const handleAddSkill = async () => {
    if (!skillDraft.selectedSkill) return;

    // Check if user already has this skill
    const alreadyHas = userSkills.some(s => s.skillId === skillDraft.selectedSkill.id || (s.skill?.name?.toLowerCase() === skillDraft.selectedSkill.name?.toLowerCase() && s.type === 'can_teach'));
    if (alreadyHas) {
      setSkillDraft(prev => ({ ...prev, inlineError: true }));
      setTimeout(() => setSkillDraft(prev => ({ ...prev, inlineError: false })), 2000);
      return;
    }

    const payload = skillDraft.selectedSkill.id
      ? { skillId: skillDraft.selectedSkill.id, type: 'can_teach', level: skillDraft.level }
      : { name: skillDraft.selectedSkill.name, type: 'can_teach', level: skillDraft.level };

    const created = await dispatch(createUserSkill(payload));
    if (created) {
      dispatch(listSkills());
      setSkillDraft({
        query: '',
        level: 'intermediate',
        selectedSkill: null,
        showSuggestions: false,
        activeIndex: -1,
        inlineError: false
      });
    }
  };

  const showcasedProjects = useMemo(() => {
    if (!profileUser?.showcasedProjectIds) return [];
    return projects.filter(p => profileUser.showcasedProjectIds.includes(p._id || p.id));
  }, [projects, profileUser?.showcasedProjectIds]);

  const handleEditSubmit = (e) => {
    e.preventDefault();
    const payload = {
      ...editForm,
      yearOfStudy: editForm.yearOfStudy ? Number(editForm.yearOfStudy) : null,
    };
    dispatch(updateUserProfile(payload));
  };

  useEffect(() => {
    if (updateSuccess) {
      setIsEditModalOpen(false);
      const reFetch = async () => {
        try {
          const { data: user } = await api.get(`/api/users/${targetId}`);
          setProfileUser(user);
        } catch (err) {
          console.error(err);
        }
      };
      if (targetId) reFetch();
    }
  }, [updateSuccess, targetId]);

  const handleShowcaseUpdate = async (selectedIds) => {
    try {
      await api.patch('/api/users/profile', { showcasedProjectIds: selectedIds });
      setProfileUser(prev => ({ ...prev, showcasedProjectIds: selectedIds }));
      setIsProjectModalOpen(false);
    } catch (err) {
      console.error('Failed to update showcased projects', err);
    }
  };

  const getRoleBadgeClass = (role) => {
    switch (role?.toLowerCase()) {
      case 'undergrad': return 'role-undergrad';
      case 'postgrad': return 'role-postgrad';
      case 'faculty': return 'role-faculty';
      case 'admin': return 'role-admin';
      default: return '';
    }
  };

  const getYearLabel = (year, role) => {
    if (role === 'faculty') return 'Faculty';
    if (!year) return 'N/A';
    if (year > 4) return `PG-${year - 4}`;
    return `${year}`;
  };

  if (loading) return <div className="phase2-page"><Loader /></div>;
  if (error) return <div className="phase2-page"><Message variant="danger">{error}</Message></div>;
  if (!profileUser) return <div className="phase2-page"><Message variant="info">User not found</Message></div>;

  return (
    <div className="phase2-page">
      <div className="phase2-shell">
        <div className="profile-layout">
          
          {/* LEFT COLUMN */}
          <aside className="profile-left-column">
            <div className="identity-card phase2-glass phase2-panel">
              <div className="avatar-wrapper">
                {profileUser.profileImage ? (
                  <img src={profileUser.profileImage.startsWith('data:image') ? profileUser.profileImage : `${BACKEND_URL}${profileUser.profileImage}`} alt={profileUser.name} />
                ) : (
                  <div className="avatar-placeholder">{profileUser.name.charAt(0).toUpperCase()}</div>
                )}
              </div>
              <div className="profile-name">{profileUser.name}</div>
              <span className={`role-badge ${getRoleBadgeClass(profileUser.role)}`}>
                {profileUser.role === 'faculty' ? <><FaGraduationCap /> Faculty</> : profileUser.role}
              </span>
              <AchievementTags 
                badges={profileUser.badges} 
                size="md" 
                limit={2} 
                showViewMore={true} 
                allBadges={badges} 
                isOwn={isOwnProfile} 
                onToggleBadge={toggleBadgeVisibility} 
              />
              {profileUser.role === 'faculty' && (
                <div className="faculty-verified-chip">
                  <FaCheckCircle style={{ color: 'var(--accent-primary)' }} />
                  <span>Faculty Verified</span>
                </div>
              )}

              <div className="identity-info">
                {isOwnProfile && (
                  <div className="info-row">
                    <span className="info-label">Roll No</span>
                    <span className="info-value">{profileUser.studentId || 'Not set'}</span>
                  </div>
                )}
                <div className="info-row">
                  <span className="info-label">Department</span>
                  <span className="info-value">{profileUser.department || 'General'}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Year of Study</span>
                  <span className="info-value">{getYearLabel(profileUser.yearOfStudy, profileUser.role)}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Member since</span>
                  <span className="info-value">{new Date(profileUser.createdAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}</span>
                </div>
              </div>

              <div className="rating-display">
                {profileUser.avgRating ? (
                  <>
                    <div className="rating-avg">{profileUser.avgRating.toFixed(1)}</div>
                    <div className="rating-stars">
                      {[1, 2, 3, 4, 5].map(i => (
                        i <= Math.round(profileUser.avgRating) ? <FaStar key={i} /> : <FaRegStar key={i} />
                      ))}
                    </div>
                    <span className="rating-count">{ratings.length} ratings received</span>
                  </>
                ) : (
                  <span className="rating-count">Not yet rated</span>
                )}
                {!isOwnProfile && (
                  <button 
                    type="button" 
                    className="rate-user-btn" 
                    onClick={() => setShowDirectRatingModal(true)}
                    style={{ marginLeft: '12px', background: 'none', border: 'none', color: 'var(--accent-color)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.9rem' }}
                  >
                    <FaStar /> Rate User
                  </button>
                )}
              </div>

              <div className="dev-score-section" style={{ padding: '16px', background: 'var(--bg-overlay)', borderRadius: '12px', marginTop: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <span style={{ fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}><FaChartLine /> Total Dev Score</span>
                  <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--accent-primary)' }}>{profileUser.devScore ?? '--'}</span>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span><FaGithub style={{ marginRight: '6px' }}/>GitHub Sub-score:</span>
                    <span>{profileUser.githubScore ?? '--'}</span>
                  </div>
                  {(profileUser.leetcodeUsername || profileUser.leetcodeScore !== undefined) && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span><FaCode style={{ marginRight: '6px' }}/>LeetCode Sub-score:</span>
                      <span>{profileUser.leetcodeScore ?? '--'}</span>
                    </div>
                  )}
                  {profileUser.devScoreUpdatedAt && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                      Last updated: {new Date(profileUser.devScoreUpdatedAt).toLocaleString()}
                    </div>
                  )}
                </div>

                {isOwnProfile && (
                  <button 
                    className="phase2-button phase2-button-secondary" 
                    style={{ width: '100%', marginTop: '12px', padding: '6px' }}
                    onClick={async () => {
                      try {
                        await dispatch(refreshDevScore());
                        const { data: user } = await api.get(`/api/users/${targetId}`);
                        setProfileUser(user);
                      } catch (err) {
                        console.error('Failed to refresh dev score:', err);
                      }
                    }}
                    disabled={updateLoading}
                  >
                    {updateLoading ? 'Refreshing...' : 'Refresh Dev Score'}
                  </button>
                )}
              </div>

              {/* Links Section */}
              <div className="links-section">
                <span className="links-title">Links</span>
                
                <SocialLink 
                  icon={<FaGithub />} 
                  label="GitHub" 
                  value={profileUser.githubUsername} 
                  href={`https://github.com/${profileUser.githubUsername}`}
                  isOwn={isOwnProfile}
                  onAdd={() => setIsEditModalOpen(true)}
                />
                
                <SocialLink 
                  icon={<FaLinkedin />} 
                  label="LinkedIn" 
                  value={profileUser.linkedinUrl} 
                  href={profileUser.linkedinUrl}
                  isOwn={isOwnProfile}
                  onAdd={() => setIsEditModalOpen(true)}
                />

                <SocialLink 
                  icon={<FaCode />} 
                  label="LeetCode" 
                  value={profileUser.leetcodeUsername} 
                  href={`https://leetcode.com/${profileUser.leetcodeUsername}`}
                  isOwn={isOwnProfile}
                  onAdd={() => setIsEditModalOpen(true)}
                />

                <SocialLink 
                  icon={<FaGlobe />} 
                  label="Portfolio" 
                  value={profileUser.portfolioUrl} 
                  href={profileUser.portfolioUrl}
                  isOwn={isOwnProfile}
                  onAdd={() => setIsEditModalOpen(true)}
                />
              </div>

              <div style={{ marginTop: 'auto', paddingTop: '16px', width: '100%' }}>
                {isOwnProfile ? (
                  <button className="phase2-button phase2-button-secondary" style={{ width: '100%' }} onClick={() => setIsEditModalOpen(true)}>
                    <FaEdit /> Edit Profile
                  </button>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
                    <Link to={`/exchange?user_id=${profileUser._id}`} className="phase2-button phase2-button-primary">
                      Book Session
                    </Link>
                    <Link to={`/chat/${profileUser._id}`} className="phase2-button phase2-button-secondary">
                      Send Message
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </aside>

          {/* RIGHT COLUMN */}
          <main className="profile-right-column">
            
            {/* Skills */}
            <section className="profile-section phase2-glass phase2-panel">
              <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 className="section-title"><FaBrain style={{ marginRight: '8px', color: 'var(--color-primary)' }} /> Skills &amp; Expertise</h2>
                {isOwnProfile && (
                  isEditingSkills ? (
                    <button 
                      onClick={() => setIsEditingSkills(false)} 
                      className="phase2-button phase2-button-secondary"
                      style={{ padding: '6px 12px', borderRadius: '8px', fontSize: '0.85rem' }}
                    >
                      Done
                    </button>
                  ) : (
                    <button 
                      onClick={() => {
                        setIsEditingSkills(true);
                        dispatch(listSkills());
                      }} 
                      className="phase2-button phase2-button-secondary"
                      style={{ padding: '6px 12px', borderRadius: '8px', fontSize: '0.85rem' }}
                    >
                      <FaEdit style={{ marginRight: '6px' }} /> Manage Skills
                    </button>
                  )
                )}
              </div>

              {isEditingSkills ? (
                <div>
                  {/* Autocomplete & Add section */}
                  <div className="phase2-skill-entry" style={{ margin: '16px 0 24px 0', gridTemplateColumns: 'minmax(0, 1.5fr) 180px 100px' }}>
                    <div className="phase2-autocomplete-wrapper" style={{ position: 'relative' }}>
                      <input
                        value={skillDraft.query}
                        onChange={(e) => setSkillDraft(prev => ({
                          ...prev,
                          query: e.target.value,
                          showSuggestions: true,
                          activeIndex: -1
                        }))}
                        onFocus={() => setSkillDraft(prev => ({ ...prev, showSuggestions: true }))}
                        onKeyDown={handleKeyDown}
                        placeholder="Type to search skills..."
                        style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', background: 'var(--bg-overlay)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}
                      />
                      {skillDraft.showSuggestions && (
                        <div className="phase2-autocomplete-dropdown" style={{ width: '100%', position: 'absolute', top: '100%', left: 0, zIndex: 10 }}>
                          {filteredSuggestions.map((skill, sIdx) => (
                            <button
                              key={skill.id}
                              type="button"
                              className={`phase2-autocomplete-item ${skillDraft.activeIndex === sIdx ? 'active' : ''}`}
                              onClick={() => handleSelectSkill(skill)}
                            >
                              <span>{skill.name}</span>
                              <small>{skill.category || 'General'}</small>
                            </button>
                          ))}
                          {skillDraft.query.trim().length > 0 && filteredSuggestions.length === 0 && (
                            <button
                              type="button"
                              className={`phase2-autocomplete-item ${skillDraft.activeIndex === 0 ? 'active' : ''}`}
                              style={{ borderStyle: 'dashed', color: '#2dd4bf', fontStyle: 'italic' }}
                              onClick={() => handleSelectSkill({ id: null, name: skillDraft.query.trim() })}
                            >
                              + Add "{skillDraft.query.trim()}" as new skill
                            </button>
                          )}
                        </div>
                      )}
                      {skillDraft.selectedSkill && (
                        <div className="phase2-selected-skill-chip" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginTop: '8px', background: 'var(--color-primary)', color: '#fff', padding: '4px 10px', borderRadius: '12px', fontSize: '0.8rem' }}>
                          {skillDraft.selectedSkill.name}
                          <button type="button" onClick={() => setSkillDraft(prev => ({ ...prev, selectedSkill: null }))} style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                            <FaTimes />
                          </button>
                        </div>
                      )}
                      {skillDraft.inlineError && (
                        <div className="phase2-inline-error" style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '4px' }}>Already in your profile</div>
                      )}
                    </div>

                    <select
                      value={skillDraft.level}
                      onChange={(e) => setSkillDraft(prev => ({ ...prev, level: e.target.value }))}
                      style={{ padding: '10px', borderRadius: '10px', background: 'var(--bg-overlay)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}
                    >
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>

                    <button 
                      type="button" 
                      className="phase2-button phase2-button-primary" 
                      onClick={handleAddSkill}
                      disabled={!skillDraft.selectedSkill}
                      style={{ opacity: skillDraft.selectedSkill ? 1 : 0.5, padding: '10px 14px', borderRadius: '10px', height: '42px', fontSize: '0.85rem' }}
                    >
                      <FaPlus style={{ marginRight: '4px' }} /> Add
                    </button>
                  </div>

                  {/* Skills listed with removal actions */}
                  <div className="phase2-skill-list" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {canTeachSkills.length === 0 ? (
                      <div className="phase2-empty">No skills added yet.</div>
                    ) : (
                      canTeachSkills.map((item) => (
                        <div
                          key={item.skillId}
                          className="phase2-skill-chip"
                          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-overlay)', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '10px 14px' }}
                        >
                          <div>
                            <strong style={{ color: 'var(--text-primary)', fontSize: '0.9rem' }}>{item.skill?.name || 'Untitled skill'}</strong>
                            <div className="phase2-chip-meta" style={{ display: 'flex', gap: '8px', fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                              <span style={{ textTransform: 'capitalize' }}>{item.level || 'intermediate'}</span>
                              {item.endorsedBy && (
                                <span className="phase2-endorsement-pill" style={{ color: 'var(--accent-primary)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                  <FaCheckCircle /> Faculty endorsed
                                </span>
                              )}
                            </div>
                          </div>
                          <button
                            type="button"
                            className="phase2-chip-remove"
                            onClick={() => dispatch(deleteUserSkill(item.skillId, 'can_teach'))}
                            style={{ background: 'transparent', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', fontSize: '0.8rem', padding: '4px 8px' }}
                          >
                            Remove
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ) : (
                <div className="skills-container-single" style={{ marginTop: '16px' }}>
                  <div className="skill-chips" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {canTeachSkills.length > 0 ? canTeachSkills.map(s => (
                      <span 
                        key={s.skillId} 
                        className="skill-tech-pill" 
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '8px', background: 'var(--bg-overlay)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', fontSize: '0.8rem' }}
                      >
                        {s.skill?.name}
                        <span style={{ fontSize: '0.68rem', opacity: 0.6, textTransform: 'capitalize' }}>
                          ({s.level || 'intermediate'})
                        </span>
                        {s.endorsedBy && (
                          <FaCheckCircle style={{ color: 'var(--accent-primary)', fontSize: '0.75rem' }} title="Faculty Endorsed" />
                        )}
                      </span>
                    )) : <span className="skill-placeholder-pill" style={{ display: 'inline-flex', padding: '6px 12px', borderRadius: '8px', border: '1px dashed var(--border-subtle)', color: 'var(--text-tertiary)', fontSize: '0.8rem' }}>No skills listed</span>}
                  </div>
                </div>
              )}
            </section>

            {/* Tabbed Section */}
            <div className="profile-tabs-container">
              <div className="tab-bar-row">
                <div className="tab-pills">
                  <button className={`tab-pill ${activeTab === 'github' ? 'active' : ''}`} onClick={() => handleTabSwitch('github')}>GitHub</button>
                  <button className={`tab-pill ${activeTab === 'leetcode' ? 'active' : ''}`} onClick={() => handleTabSwitch('leetcode')}>LeetCode</button>
                  <button className={`tab-pill ${activeTab === 'projects' ? 'active' : ''}`} onClick={() => handleTabSwitch('projects')}>Platform Projects</button>
                </div>
                {activeTab === 'github' && profileUser.githubUsername && (
                  <a href={`https://github.com/${profileUser.githubUsername}`} target="_blank" rel="noopener noreferrer" className="view-external-btn">
                    View on GitHub <FaExternalLinkAlt size={12} />
                  </a>
                )}
                {activeTab === 'leetcode' && profileUser.leetcodeUsername && (
                  <a href={`https://leetcode.com/${profileUser.leetcodeUsername}`} target="_blank" rel="noopener noreferrer" className="view-external-btn">
                    View on LeetCode <FaExternalLinkAlt size={12} />
                  </a>
                )}
              </div>

              <div className="tab-content">
                {activeTab === 'projects' && (
                  <section className="profile-section phase2-glass phase2-panel">
                    <div className="section-header">
                      <h2 className="section-title"><FaBook /> Showcased Projects</h2>
                      {isOwnProfile && (
                        <button className="phase2-button phase2-button-secondary" onClick={() => setIsProjectModalOpen(true)}>
                          <FaPencilAlt /> Manage Showcase
                        </button>
                      )}
                    </div>
                    <div className="projects-grid">
                      {showcasedProjects.length > 0 ? showcasedProjects.map(project => (
                        <div key={project._id || project.id} className="project-card phase2-glass">
                          <div className="phase2-card-topline">
                            <span className="phase2-pill subtle">{project.status || 'Active'}</span>
                          </div>
                          <h4>{project.name}</h4>
                          <p className="project-desc">{project.goal || 'No description provided.'}</p>
                          <div className="phase2-card-footer">
                            <Link to={`/project/${project._id || project.id}`} className="phase2-link">View Project</Link>
                          </div>
                        </div>
                      )) : (
                        <div className="phase2-empty" style={{ gridColumn: '1 / -1' }}>
                          {isOwnProfile ? "Select projects to showcase from your portfolio" : "No showcased projects yet"}
                        </div>
                      )}
                    </div>
                  </section>
                )}

                {activeTab === 'github' && (
                  <>
                    <section className="profile-section phase2-glass phase2-panel">
                      {!profileUser.githubUsername ? (
                      <EmptyExternal 
                        icon={<FaGithub size={48} />} 
                        title={isOwnProfile ? "Connect your GitHub" : "GitHub not connected"} 
                        desc={isOwnProfile ? "Add your GitHub username in Edit Profile to show your activity here" : ""} 
                        isOwn={isOwnProfile}
                        onEdit={() => setIsEditModalOpen(true)}
                      />
                    ) : loadingGithub ? (
                      <Loader />
                    ) : githubError ? (
                      <Message variant="danger">{githubError}</Message>
                    ) : (
                      <>
                        <div className="github-stats-grid">
                          <StatCard value={githubRepos.length || githubData?.public_repos} label={profileUser?.githubShowPrivate ? "Total Repos" : "Public Repos"} />
                          <StatCard value={githubData?.followers} label="Followers" />
                          <StatCard value={githubData?.following} label="Following" />
                          <StatCard value={githubData ? new Date(githubData.created_at).getFullYear() : '—'} label="Member Since" />
                        </div>
                        <div style={{ marginBottom: '16px', fontSize: '0.85rem', color: 'var(--text-tertiary)' }}>
                          {profileUser?.githubShowPrivate ? 'Showing public and private activity' : 'Showing public activity only'}
                        </div>
                        <div className="github-repos-grid">
                          {topRepos.map(repo => (
                            <div key={repo.id} className="repo-card">
                              <a href={repo.html_url} target="_blank" rel="noopener noreferrer" className="repo-name">{repo.name}</a>
                              <p className="repo-desc">{repo.description || 'No description'}</p>
                              <div className="repo-meta">
                                {repo.language && (
                                  <span>
                                    <span className="lang-dot" style={{ background: 'var(--accent-primary)' }}></span> {repo.language}
                                  </span>
                                )}
                                <div style={{ display: 'flex', gap: '12px' }}>
                                  <span><FaStar /> {repo.stargazers_count}</span>
                                  <span><FaCodeBranch /> {repo.forks_count}</span>
                                </div>
                                <span className={`phase2-pill ${repo.private ? 'subtle' : 'offer'}`} style={{ fontSize: '0.65rem', padding: '2px 8px', background: repo.private ? 'rgba(239, 68, 68, 0.1)' : undefined, color: repo.private ? '#ef4444' : undefined }}>
                                  {repo.private ? 'Private' : 'Public'}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </section>
                  
                  {/* GitHub Calendar (Separate Section) */}
                  {profileUser.githubUsername && !loadingGithub && !githubError && githubData && (
                    <section className="profile-section phase2-glass phase2-panel" style={{ marginTop: '24px' }}>
                      <div className="section-header">
                        <h2 className="section-title"><FaGithub /> Contribution Graph</h2>
                      </div>
                      <div className="github-calendar-scroll">
                        {githubData.contributionCalendar && githubData.contributionCalendar.length > 0 ? (
                          <ActivityCalendarNS.ActivityCalendar
                            data={githubData.contributionCalendar}
                            colorScheme="light"
                            theme={{
                              light: ['#ede9e4', '#99f6e4', '#2dd4bf', '#14b8a6', '#0d9488']
                            }}
                            blockSize={12}
                            blockMargin={4}
                            fontSize={12}
                            labels={{
                              totalCount: '{{count}} contributions in the last year'
                            }}
                          />
                        ) : (
                          <GitHubCalendar 
                            username={profileUser.githubUsername} 
                            colorScheme="light"
                            theme={{
                              light: ['#ede9e4', '#99f6e4', '#2dd4bf', '#14b8a6', '#0d9488']
                            }}
                            blockSize={12}
                            blockMargin={4}
                            fontSize={12}
                          />
                        )}
                      </div>
                    </section>
                  )}
                </>
                )}

                {activeTab === 'leetcode' && (
                  <>
                    <section className="profile-section phase2-glass phase2-panel">
                      {!profileUser.leetcodeUsername ? (
                      <EmptyExternal 
                        icon={<FaCode size={48} />} 
                        title={isOwnProfile ? "Connect your LeetCode" : "LeetCode not connected"} 
                        desc={isOwnProfile ? "Add your LeetCode username in Edit Profile" : ""} 
                        isOwn={isOwnProfile}
                        onEdit={() => setIsEditModalOpen(true)}
                      />
                    ) : loadingLeetcode ? (
                      <Loader />
                    ) : leetcodeError ? (
                      <Message variant="danger">{leetcodeError}</Message>
                    ) : (
                      <div className="leetcode-content">
                        <div className="leetcode-hero">
                          <div className="lc-main-val">{leetcodeData?.totalSolved}</div>
                          <div className="lc-main-lbl">Problems Solved</div>
                          <div className="lc-rank-pill">Global Rank: #{leetcodeData?.ranking?.toLocaleString()}</div>
                        </div>
                        <div className="tab-stats-row">
                          <div className="tab-stat-card lc-easy">
                            <span className="tab-stat-value">{leetcodeData?.easySolved}</span>
                            <span className="tab-stat-label">Easy</span>
                          </div>
                          <div className="tab-stat-card lc-medium">
                            <span className="tab-stat-value">{leetcodeData?.mediumSolved}</span>
                            <span className="tab-stat-label">Medium</span>
                          </div>
                          <div className="tab-stat-card lc-hard">
                            <span className="tab-stat-value">{leetcodeData?.hardSolved}</span>
                            <span className="tab-stat-label">Hard</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </section>
                  
                  {/* LeetCode Progress (Separate Section) */}
                  {profileUser.leetcodeUsername && !loadingLeetcode && !leetcodeError && leetcodeData && (
                    <>
                      <section className="profile-section phase2-glass phase2-panel" style={{ marginTop: '24px' }}>
                        <div className="section-header">
                          <h2 className="section-title"><FaCode /> Recent Submissions</h2>
                        </div>
                        <div className="github-repos-grid">
                          {(leetcodeData.recentSubmissions || []).slice(0, 3).map((sub, idx) => (
                            <div key={idx} className="repo-card">
                              <div style={{ fontWeight: 600, color: 'var(--accent-primary)' }}>{sub.title}</div>
                              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                {sub.lang.toUpperCase()} • {sub.statusDisplay}
                              </div>
                              <div className="repo-meta">
                                <span>{new Date(sub.timestamp * 1000).toLocaleDateString()}</span>
                                <span className={`phase2-pill ${sub.statusDisplay === 'Accepted' ? 'offer' : 'subtle'}`} style={{ fontSize: '0.65rem', padding: '2px 8px' }}>
                                  {sub.statusDisplay}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </section>

                      <section className="profile-section phase2-glass phase2-panel" style={{ marginTop: '24px' }}>
                        <div className="section-header">
                          <h2 className="section-title"><FaCode /> LeetCode Activity</h2>
                        </div>
                        <div className="github-calendar-scroll">
                           {leetcodeCalendarData.length > 0 ? (
                             <ActivityCalendar 
                               data={leetcodeCalendarData} 
                               theme={{
                                 light: ['#ede9e4', '#99f6e4', '#2dd4bf', '#14b8a6', '#0d9488']
                               }}
                               labels={{
                                 totalCount: '{{count}} submissions in the last year',
                               }}
                               blockSize={15}
                               blockMargin={5}
                               fontSize={14}
                             />
                           ) : (
                             <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-tertiary)' }}>
                               No recent activity data found
                             </div>
                           )}
                        </div>
                      </section>
                    </>
                  )}
                </>
                )}
              </div>
            </div>

          </main>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {isEditModalOpen && (
        <div className="modal-overlay" onClick={() => setIsEditModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Profile</h2>
              <button className="close-modal" onClick={() => setIsEditModalOpen(false)}><FaTimes /></button>
            </div>
            <form onSubmit={handleEditSubmit}>
              <div className="modal-body">
                {updateError && <Message variant="danger">{updateError}</Message>}
                <div className="phase2-form-grid">
                  <label className="phase2-field phase2-field-full">
                    <span>Full Name</span>
                    <input type="text" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} required />
                  </label>
                  <label className="phase2-field phase2-field-full">
                    <span>Bio</span>
                    <textarea rows="3" value={editForm.bio} onChange={e => setEditForm({...editForm, bio: e.target.value})} placeholder="Tell us about yourself..." />
                  </label>
                  <label className="phase2-field">
                    <span>Department</span>
                    <input type="text" value={editForm.department} onChange={e => setEditForm({...editForm, department: e.target.value})} />
                  </label>
                  <label className="phase2-field">
                    <span>Year of Study</span>
                    <select value={editForm.yearOfStudy} onChange={e => setEditForm({...editForm, yearOfStudy: e.target.value})}>
                      <option value="">Select Year</option>
                      <option value="1">1</option>
                      <option value="2">2</option>
                      <option value="3">3</option>
                      <option value="4">4</option>
                      <option value="5">PG-1</option>
                      <option value="6">PG-2</option>
                      <option value="7">Faculty</option>
                    </select>
                  </label>
                  <label className="phase2-field">
                    <span>GitHub Username</span>
                    <input 
                      type="text" 
                      placeholder="e.g. bhavyawork121" 
                      value={editForm.githubUsername} 
                      onChange={e => {
                        let val = e.target.value;
                        if (val.includes('github.com/')) {
                          val = val.split('github.com/')[1].split('/')[0];
                        }
                        setEditForm({...editForm, githubUsername: val});
                      }} 
                    />
                  </label>
                  <label className="phase2-field" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '8px', gridColumn: '1 / -1' }}>
                    <input 
                      type="checkbox" 
                      checked={editForm.githubShowPrivate} 
                      onChange={e => setEditForm({...editForm, githubShowPrivate: e.target.checked})} 
                      style={{ width: 'auto', margin: 0 }}
                    />
                    <span style={{ margin: 0 }}>Show private GitHub activity (Requires backend configuration)</span>
                  </label>
                  <label className="phase2-field">
                    <span>LinkedIn URL</span>
                    <input type="text" placeholder="Full profile URL" value={editForm.linkedinUrl} onChange={e => setEditForm({...editForm, linkedinUrl: e.target.value})} />
                  </label>
                  <label className="phase2-field">
                    <span>LeetCode Username</span>
                    <input 
                      type="text" 
                      placeholder="e.g. Bhavya_Works" 
                      value={editForm.leetcodeUsername} 
                      onChange={e => {
                        let val = e.target.value;
                        if (val.includes('leetcode.com/')) {
                          val = val.split('leetcode.com/')[1].split('/')[0];
                        }
                        setEditForm({...editForm, leetcodeUsername: val});
                      }} 
                    />
                  </label>
                  <label className="phase2-field">
                    <span>Portfolio URL</span>
                    <input type="text" value={editForm.portfolioUrl} onChange={e => setEditForm({...editForm, portfolioUrl: e.target.value})} />
                  </label>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="phase2-button phase2-button-secondary" onClick={() => setIsEditModalOpen(false)}>Cancel</button>
                <button type="submit" className="phase2-button phase2-button-primary" disabled={updateLoading}>
                  {updateLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Project Showcase Modal */}
      {isProjectModalOpen && (
        <ProjectShowcaseModal 
          projects={projects} 
          initialSelected={profileUser.showcasedProjectIds || []} 
          onClose={() => setIsProjectModalOpen(false)} 
          onSave={handleShowcaseUpdate}
        />
      )}
      {/* Rating Modals */}
      {showDirectRatingModal && profileUser && (
        <DirectRatingModal 
          ratee={profileUser}
          isOpen={showDirectRatingModal}
          onClose={() => setShowDirectRatingModal(false)}
        />
      )}
    </div>
  );
};

// Sub-components for cleaner JSX
const SocialLink = ({ icon, label, value, href, isOwn, onAdd }) => {
  return (
    <a 
      href={value ? href : '#'} 
      target={value ? "_blank" : "_self"} 
      rel="noopener noreferrer" 
      className={`link-btn ${!value ? 'unset' : ''}`}
      onClick={(e) => {
        if (!value) {
          e.preventDefault();
          if (isOwn) onAdd();
        }
      }}
      style={!value && !isOwn ? { cursor: 'default', opacity: 0.7 } : {}}
    >
      <div className="link-btn-content">
        {icon} {label}
      </div>
      {!value && isOwn && <span className="add-label">+ Add</span>}
      {!value && !isOwn && <span className="add-label" style={{ color: 'var(--text-tertiary)', fontWeight: 400 }}>Not Connected</span>}
      {value && <FaExternalLinkAlt size={10} style={{ opacity: 0.5 }} />}
    </a>
  );
};

const StatCard = ({ value, label }) => (
  <div className="tab-stat-card phase2-glass">
    <span className="tab-stat-value">{value ?? '—'}</span>
    <span className="tab-stat-label">{label}</span>
  </div>
);

const EmptyExternal = ({ icon, title, desc, isOwn, onEdit }) => (
  <div className="phase2-empty" style={{ padding: '48px 0' }}>
    <div style={{ color: 'var(--text-tertiary)', marginBottom: '16px' }}>{icon}</div>
    <h3>{title}</h3>
    {desc && <p style={{ marginBottom: '24px' }}>{desc}</p>}
    {isOwn && (
      <button className="phase2-button phase2-button-secondary" onClick={onEdit}>
        <FaEdit /> Edit Profile
      </button>
    )}
  </div>
);

const ProjectShowcaseModal = ({ projects, initialSelected, onClose, onSave }) => {
  const [selected, setSelected] = useState(initialSelected);

  const toggleProject = (id) => {
    if (selected.includes(id)) {
      setSelected(selected.filter(i => i !== id));
    } else if (selected.length < 6) {
      setSelected([...selected, id]);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Manage Showcase</h2>
          <button className="close-modal" onClick={onClose}><FaTimes /></button>
        </div>
        <div className="modal-body">
          <p style={{ marginBottom: '16px', color: 'var(--text-secondary)' }}>Select up to 6 projects to feature on your profile.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {projects.length > 0 ? projects.map(p => (
              <div 
                key={p._id || p.id} 
                className="phase2-glass" 
                style={{ 
                  padding: '12px 16px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '12px', 
                  cursor: 'pointer',
                  border: selected.includes(p._id || p.id) ? '1px solid var(--accent-primary)' : '1px solid var(--border-subtle)'
                }}
                onClick={() => toggleProject(p._id || p.id)}
              >
                <input type="checkbox" checked={selected.includes(p._id || p.id)} readOnly />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600 }}>{p.name}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{p.status}</div>
                </div>
              </div>
            )) : <p>No projects found. Create one first!</p>}
          </div>
        </div>
        <div className="modal-footer">
          <button type="button" className="phase2-button phase2-button-secondary" onClick={onClose}>Cancel</button>
          <button type="button" className="phase2-button phase2-button-primary" onClick={() => onSave(selected)}>Save Showcase</button>
        </div>
      </div>
    </div>
  );
};

export default ProfileScreen;
