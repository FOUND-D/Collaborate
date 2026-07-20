import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaBrain, 
  FaSearch, 
  FaUserAlt, 
  FaComments, 
  FaPlus, 
  FaFilter, 
  FaProjectDiagram, 
  FaUsers, 
  FaStar, 
  FaExternalLinkAlt, 
  FaTimes,
  FaCheck
} from 'react-icons/fa';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { BACKEND_URL } from '../config/runtime';
import './SkillSharingScreen.css';

const SkillSharingScreen = () => {
  const navigate = useNavigate();
  const { userInfo } = useSelector((state) => state.userLogin);

  // Core state
  const [activeTab, setActiveTab] = useState('venn'); // 'venn' | 'skills' | 'users' | 'match'
  const [loading, setLoading] = useState(true);
  const [skillsList, setSkillsList] = useState([]);
  const [groupedBySkill, setGroupedBySkill] = useState([]);
  const [groupedByUser, setGroupedByUser] = useState([]);
  const [matchesData, setMatchesData] = useState(null);

  // Venn diagram state
  const [selectedSkillIds, setSelectedSkillIds] = useState([]);
  const [typeFilter, setTypeFilter] = useState('all'); // 'all' | 'can_teach' | 'want_to_learn'
  const [vennData, setVennData] = useState(null);
  const [activeRegionKey, setActiveRegionKey] = useState('intersectionAB');
  const [vennLoading, setVennLoading] = useState(false);

  // Search & Filter state for directories
  const [searchQuery, setSearchQuery] = useState('');

  // Add Skill Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillType, setNewSkillType] = useState('can_teach');
  const [newSkillLevel, setNewSkillLevel] = useState('Intermediate');
  const [submittingSkill, setSubmittingSkill] = useState(false);

  const getAuthConfig = () => ({
    headers: {
      Authorization: `Bearer ${userInfo?.token}`,
    },
  });

  // Fetch initial base data
  useEffect(() => {
    if (!userInfo?.token) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const [skillsRes, groupSkillRes, groupUserRes, matchRes] = await Promise.all([
          axios.get(`${BACKEND_URL}/api/skills`, getAuthConfig()),
          axios.get(`${BACKEND_URL}/api/skills/group-by-skill`, getAuthConfig()),
          axios.get(`${BACKEND_URL}/api/skills/group-by-user`, getAuthConfig()),
          axios.get(`${BACKEND_URL}/api/skills/match`, getAuthConfig()),
        ]);

        const fetchedSkills = skillsRes.data || [];
        setSkillsList(fetchedSkills);
        setGroupedBySkill(groupSkillRes.data || []);
        setGroupedByUser(groupUserRes.data || []);
        setMatchesData(matchRes.data || null);

        // Pre-select top 2 or 3 skills for Venn Diagram
        if (fetchedSkills.length >= 2) {
          setSelectedSkillIds([fetchedSkills[0].id, fetchedSkills[1].id]);
        }
      } catch (err) {
        console.error('Error loading skill sharing data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userInfo?.token]);

  // Fetch Venn Diagram Data whenever selected skills or type filter changes
  useEffect(() => {
    if (!userInfo?.token) return;

    const fetchVenn = async () => {
      setVennLoading(true);
      try {
        const params = new URLSearchParams();
        if (selectedSkillIds.length > 0) {
          params.append('skillIds', selectedSkillIds.join(','));
        }
        if (typeFilter && typeFilter !== 'all') {
          params.append('type', typeFilter);
        }

        const res = await axios.get(`${BACKEND_URL}/api/skills/venn?${params.toString()}`, getAuthConfig());
        setVennData(res.data);

        // Set default active region
        if (res.data?.skillsCount === 3) {
          setActiveRegionKey('intersectionABC');
        } else {
          setActiveRegionKey('intersectionAB');
        }
      } catch (err) {
        console.error('Error fetching Venn data:', err);
      } finally {
        setVennLoading(false);
      }
    };

    fetchVenn();
  }, [selectedSkillIds, typeFilter, userInfo?.token]);

  // Toggle skill selection for Venn Diagram (max 3)
  const handleToggleSkillSelection = (skillId) => {
    if (selectedSkillIds.includes(skillId)) {
      if (selectedSkillIds.length <= 2) return; // Maintain at least 2 skills
      setSelectedSkillIds(selectedSkillIds.filter((id) => id !== skillId));
    } else {
      if (selectedSkillIds.length >= 3) {
        setSelectedSkillIds([selectedSkillIds[1], selectedSkillIds[2], skillId]);
      } else {
        setSelectedSkillIds([...selectedSkillIds, skillId]);
      }
    }
  };

  // Add new skill handler
  const handleAddSkillSubmit = async (e) => {
    e.preventDefault();
    if (!newSkillName.trim()) return;

    setSubmittingSkill(true);
    try {
      await axios.post(
        `${BACKEND_URL}/api/skills/user`,
        {
          name: newSkillName.trim(),
          type: newSkillType,
          level: newSkillLevel,
        },
        getAuthConfig()
      );

      // Refresh data
      const [skillsRes, groupSkillRes, groupUserRes, matchRes] = await Promise.all([
        axios.get(`${BACKEND_URL}/api/skills`, getAuthConfig()),
        axios.get(`${BACKEND_URL}/api/skills/group-by-skill`, getAuthConfig()),
        axios.get(`${BACKEND_URL}/api/skills/group-by-user`, getAuthConfig()),
        axios.get(`${BACKEND_URL}/api/skills/match`, getAuthConfig()),
      ]);

      setSkillsList(skillsRes.data || []);
      setGroupedBySkill(groupSkillRes.data || []);
      setGroupedByUser(groupUserRes.data || []);
      setMatchesData(matchRes.data || null);

      setIsModalOpen(false);
      setNewSkillName('');
    } catch (err) {
      console.error('Error adding skill:', err);
      alert(err.response?.data?.message || 'Failed to add skill.');
    } finally {
      setSubmittingSkill(false);
    }
  };

  // Filtered skills for directory view
  const filteredSkillsGrouped = groupedBySkill.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.category && item.category.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Filtered users for directory view
  const filteredUsersGrouped = groupedByUser.filter((u) =>
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.department && u.department.toLowerCase().includes(searchQuery.toLowerCase())) ||
    u.canTeach.some((s) => s.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
    u.wantToLearn.some((s) => s.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Active region data for Venn Diagram
  const currentRegionData = vennData?.sets ? vennData.sets[activeRegionKey] : null;

  return (
    <div className="skill-sharing-screen">
      {/* Top Header */}
      <div className="skill-sharing-header-section">
        <div className="skill-sharing-title-group">
          <h1>
            <FaBrain /> Skill Sharing & Matrix
          </h1>
          <p className="skill-sharing-subtitle">
            Analyze skill intersections via interactive Venn diagrams, discover mentors & learners in your organization, and exchange knowledge.
          </p>
        </div>
        <button
          type="button"
          className="add-skill-btn"
          onClick={() => setIsModalOpen(true)}
        >
          <FaPlus /> Add Skill to Profile
        </button>
      </div>

      {/* Tabs */}
      <div className="skill-tabs-nav">
        <button
          className={`skill-tab-btn ${activeTab === 'venn' ? 'active' : ''}`}
          onClick={() => setActiveTab('venn')}
        >
          <FaProjectDiagram /> Venn Diagram Matrix
        </button>
        <button
          className={`skill-tab-btn ${activeTab === 'skills' ? 'active' : ''}`}
          onClick={() => setActiveTab('skills')}
        >
          <FaFilter /> Skill Directory ({groupedBySkill.length})
        </button>
        <button
          className={`skill-tab-btn ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          <FaUsers /> Member Tech Stacks ({groupedByUser.length})
        </button>
        <button
          className={`skill-tab-btn ${activeTab === 'match' ? 'active' : ''}`}
          onClick={() => setActiveTab('match')}
        >
          <FaUserAlt /> Smart Peer Match
        </button>
      </div>

      {/* Loading state */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-secondary)' }}>
          <FaBrain className="fa-spin" style={{ fontSize: '2.5rem', color: 'var(--accent-color)', marginBottom: '16px' }} />
          <p>Loading Skill Sharing Workspace...</p>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          {/* TAB 1: VENN DIAGRAM MATRIX */}
          {activeTab === 'venn' && (
            <motion.div
              key="venn-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="venn-container-card"
            >
              {/* Controls Bar */}
              <div className="venn-controls-bar">
                <div className="skill-selector-group">
                  <span className="selector-label">Select Skills to Compare (2 or 3):</span>
                  <div className="skill-chips-wrap">
                    {skillsList.slice(0, 12).map((sk) => {
                      const selIndex = selectedSkillIds.indexOf(sk.id);
                      const isSelected = selIndex !== -1;
                      return (
                        <button
                          key={sk.id}
                          type="button"
                          className={`skill-chip ${isSelected ? `selected-${selIndex}` : ''}`}
                          onClick={() => handleToggleSkillSelection(sk.id)}
                        >
                          {isSelected && <FaCheck style={{ fontSize: '0.7rem' }} />}
                          {sk.name}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="venn-type-filter">
                  <button
                    className={`filter-btn ${typeFilter === 'all' ? 'active' : ''}`}
                    onClick={() => setTypeFilter('all')}
                  >
                    All Skills
                  </button>
                  <button
                    className={`filter-btn ${typeFilter === 'can_teach' ? 'active' : ''}`}
                    onClick={() => setTypeFilter('can_teach')}
                  >
                    Can Teach
                  </button>
                  <button
                    className={`filter-btn ${typeFilter === 'want_to_learn' ? 'active' : ''}`}
                    onClick={() => setTypeFilter('want_to_learn')}
                  >
                    Want to Learn
                  </button>
                </div>
              </div>

              {/* Venn Visual & Details Panel */}
              <div className="venn-visual-wrapper">
                {/* SVG Venn Diagram Graphic */}
                <div className="venn-diagram-display">
                  {vennLoading ? (
                    <div style={{ color: 'var(--text-secondary)' }}>Calculating intersections...</div>
                  ) : vennData?.skillsCount === 2 ? (
                    <svg className="venn-svg" viewBox="0 0 520 400">
                      <defs>
                        <linearGradient id="gradA" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#14b8a6" stopOpacity="0.5" />
                          <stop offset="100%" stopColor="#0d9488" stopOpacity="0.2" />
                        </linearGradient>
                        <linearGradient id="gradB" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.5" />
                          <stop offset="100%" stopColor="#6d28d9" stopOpacity="0.2" />
                        </linearGradient>
                      </defs>

                      {/* Circle A (Skill A Only) */}
                      <g className="venn-region-interactive" onClick={() => setActiveRegionKey('onlyA')}>
                        <circle
                          cx="200"
                          cy="200"
                          r="135"
                          fill="url(#gradA)"
                          stroke="#14b8a6"
                          className={`venn-circle-shape ${activeRegionKey === 'onlyA' ? 'active-region' : ''}`}
                        />
                        <text x="135" y="160" fill="#14b8a6" fontWeight="700" fontSize="16">
                          {vennData.targetSkills[0]?.name}
                        </text>
                        <text x="135" y="185" fill="var(--text-secondary)" fontSize="12">
                          (Only {vennData.sets.onlyA?.count} members)
                        </text>
                      </g>

                      {/* Circle B (Skill B Only) */}
                      <g className="venn-region-interactive" onClick={() => setActiveRegionKey('onlyB')}>
                        <circle
                          cx="320"
                          cy="200"
                          r="135"
                          fill="url(#gradB)"
                          stroke="#8b5cf6"
                          className={`venn-circle-shape ${activeRegionKey === 'onlyB' ? 'active-region' : ''}`}
                        />
                        <text x="385" y="160" fill="#8b5cf6" fontWeight="700" fontSize="16">
                          {vennData.targetSkills[1]?.name}
                        </text>
                        <text x="385" y="185" fill="var(--text-secondary)" fontSize="12">
                          (Only {vennData.sets.onlyB?.count} members)
                        </text>
                      </g>

                      {/* Intersection AB */}
                      <g className="venn-region-interactive" onClick={() => setActiveRegionKey('intersectionAB')}>
                        <rect
                          x="230"
                          y="160"
                          width="60"
                          height="80"
                          rx="12"
                          fill="rgba(255, 255, 255, 0.08)"
                          stroke={activeRegionKey === 'intersectionAB' ? '#5eead4' : 'transparent'}
                          strokeWidth="2"
                          className="venn-region-bg"
                        />
                        <text x="260" y="195" textAnchor="middle" fill="#fff" fontWeight="800" fontSize="18">
                          {vennData.sets.intersectionAB?.count || 0}
                        </text>
                        <text x="260" y="218" textAnchor="middle" fill="#5eead4" fontWeight="600" fontSize="11">
                          Overlap (Both)
                        </text>
                      </g>
                    </svg>
                  ) : vennData?.skillsCount === 3 ? (
                    <svg className="venn-svg" viewBox="0 0 520 420">
                      <defs>
                        <linearGradient id="gradA3" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#14b8a6" stopOpacity="0.45" />
                          <stop offset="100%" stopColor="#0d9488" stopOpacity="0.2" />
                        </linearGradient>
                        <linearGradient id="gradB3" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.45" />
                          <stop offset="100%" stopColor="#6d28d9" stopOpacity="0.2" />
                        </linearGradient>
                        <linearGradient id="gradC3" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.45" />
                          <stop offset="100%" stopColor="#d97706" stopOpacity="0.2" />
                        </linearGradient>
                      </defs>

                      {/* Circle A (Top) */}
                      <g className="venn-region-interactive" onClick={() => setActiveRegionKey('onlyA')}>
                        <circle
                          cx="260"
                          cy="150"
                          r="115"
                          fill="url(#gradA3)"
                          stroke="#14b8a6"
                          className={`venn-circle-shape ${activeRegionKey === 'onlyA' ? 'active-region' : ''}`}
                        />
                        <text x="260" y="80" textAnchor="middle" fill="#14b8a6" fontWeight="700" fontSize="14">
                          {vennData.targetSkills[0]?.name} ({vennData.sets.onlyA?.count})
                        </text>
                      </g>

                      {/* Circle B (Bottom Left) */}
                      <g className="venn-region-interactive" onClick={() => setActiveRegionKey('onlyB')}>
                        <circle
                          cx="195"
                          cy="265"
                          r="115"
                          fill="url(#gradB3)"
                          stroke="#8b5cf6"
                          className={`venn-circle-shape ${activeRegionKey === 'onlyB' ? 'active-region' : ''}`}
                        />
                        <text x="130" y="320" textAnchor="middle" fill="#8b5cf6" fontWeight="700" fontSize="14">
                          {vennData.targetSkills[1]?.name} ({vennData.sets.onlyB?.count})
                        </text>
                      </g>

                      {/* Circle C (Bottom Right) */}
                      <g className="venn-region-interactive" onClick={() => setActiveRegionKey('onlyC')}>
                        <circle
                          cx="325"
                          cy="265"
                          r="115"
                          fill="url(#gradC3)"
                          stroke="#f59e0b"
                          className={`venn-circle-shape ${activeRegionKey === 'onlyC' ? 'active-region' : ''}`}
                        />
                        <text x="390" y="320" textAnchor="middle" fill="#f59e0b" fontWeight="700" fontSize="14">
                          {vennData.targetSkills[2]?.name} ({vennData.sets.onlyC?.count})
                        </text>
                      </g>

                      {/* Center Intersection ABC */}
                      <g className="venn-region-interactive" onClick={() => setActiveRegionKey('intersectionABC')}>
                        <circle
                          cx="260"
                          cy="225"
                          r="32"
                          fill="rgba(255, 255, 255, 0.15)"
                          stroke={activeRegionKey === 'intersectionABC' ? '#fff' : 'transparent'}
                          strokeWidth="2"
                        />
                        <text x="260" y="222" textAnchor="middle" fill="#fff" fontWeight="800" fontSize="16">
                          {vennData.sets.intersectionABC?.count || 0}
                        </text>
                        <text x="260" y="236" textAnchor="middle" fill="#e2e8f0" fontWeight="600" fontSize="9">
                          All 3
                        </text>
                      </g>
                    </svg>
                  ) : (
                    <div style={{ color: 'var(--text-secondary)' }}>Select at least 2 skills to visualize Venn intersection matrix.</div>
                  )}
                </div>

                {/* Right Details Panel */}
                <div className="venn-details-panel">
                  <div className="panel-header">
                    <h3>
                      <FaUserAlt style={{ color: 'var(--accent-color)' }} />
                      {activeRegionKey === 'intersectionAB' && 'Intersection: Both Skills'}
                      {activeRegionKey === 'intersectionABC' && 'Intersection: All 3 Skills'}
                      {activeRegionKey === 'onlyA' && `Only ${vennData?.targetSkills[0]?.name}`}
                      {activeRegionKey === 'onlyB' && `Only ${vennData?.targetSkills[1]?.name}`}
                      {activeRegionKey === 'onlyC' && `Only ${vennData?.targetSkills[2]?.name}`}
                      {activeRegionKey === 'intersectionAC' && 'Intersection: Skill 1 & 3'}
                      {activeRegionKey === 'intersectionBC' && 'Intersection: Skill 2 & 3'}
                    </h3>
                    <p>
                      {currentRegionData?.users?.length || 0} member(s) matched in this set
                    </p>
                  </div>

                  <div className="intersecting-members-list">
                    {currentRegionData?.users?.length === 0 ? (
                      <div style={{ textTransform: 'none', textAlign: 'center', padding: '30px 10px', color: 'var(--text-secondary)' }}>
                        No members currently fit into this exact skill subset.
                      </div>
                    ) : (
                      currentRegionData?.users?.map((user) => (
                        <div key={user.userId || user.id} className="intersect-user-card">
                          <div className="user-meta-left">
                            <div className="user-avatar-circle">
                              {user.profileImage ? (
                                <img
                                  src={user.profileImage.startsWith('data:image') ? user.profileImage : `${BACKEND_URL}${user.profileImage}`}
                                  alt={user.name}
                                />
                              ) : (
                                user.name?.charAt(0)?.toUpperCase()
                              )}
                            </div>
                            <div className="user-info-text">
                              <h4>{user.name}</h4>
                              <span>
                                {user.role || 'Member'} · {user.department || 'General'}
                              </span>
                            </div>
                          </div>
                          <div className="user-actions-right">
                            <button
                              type="button"
                              className="icon-action-btn"
                              title="Send Message"
                              onClick={() => navigate(`/chat/${user.userId || user.id}`)}
                            >
                              <FaComments />
                            </button>
                            <button
                              type="button"
                              className="icon-action-btn"
                              title="View Profile"
                              onClick={() => navigate(`/profile/${user.userId || user.id}`)}
                            >
                              <FaExternalLinkAlt />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 2: SKILL DIRECTORY */}
          {activeTab === 'skills' && (
            <motion.div
              key="skills-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
            >
              <div className="search-filter-bar">
                <div className="search-input-wrapper">
                  <FaSearch />
                  <input
                    type="text"
                    className="search-input-field"
                    placeholder="Search skills or categories..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              <div className="directory-grid">
                {filteredSkillsGrouped.map((skillItem) => (
                  <div key={skillItem.id} className="skill-dir-card">
                    <div className="card-top-row">
                      <span className="skill-category-badge">{skillItem.category || 'General'}</span>
                      <span className="people-count-pill">{skillItem.people.length} member(s)</span>
                    </div>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '8px' }}>{skillItem.name}</h3>

                    <div className="people-avatar-stack">
                      {skillItem.people.slice(0, 5).map((p, i) => (
                        <div key={i} className="stacked-avatar" title={`${p.name} (${p.type === 'can_teach' ? 'Teaches' : 'Learns'})`}>
                          {p.profileImage ? (
                            <img src={p.profileImage.startsWith('data:image') ? p.profileImage : `${BACKEND_URL}${p.profileImage}`} alt={p.name} />
                          ) : (
                            p.name?.charAt(0)?.toUpperCase()
                          )}
                        </div>
                      ))}
                      {skillItem.people.length > 5 && (
                        <div className="stacked-avatar">+{skillItem.people.length - 5}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* TAB 3: USER TECH STACKS */}
          {activeTab === 'users' && (
            <motion.div
              key="users-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
            >
              <div className="search-filter-bar">
                <div className="search-input-wrapper">
                  <FaSearch />
                  <input
                    type="text"
                    className="search-input-field"
                    placeholder="Search members by name, department or skill..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              <div className="directory-grid">
                {filteredUsersGrouped.map((u) => (
                  <div key={u.userId} className="user-dir-card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
                      <div className="user-avatar-circle" style={{ width: '48px', height: '48px', fontSize: '1.1rem' }}>
                        {u.profileImage ? (
                          <img src={u.profileImage.startsWith('data:image') ? u.profileImage : `${BACKEND_URL}${u.profileImage}`} alt={u.name} />
                        ) : (
                          u.name?.charAt(0)?.toUpperCase()
                        )}
                      </div>
                      <div>
                        <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '700' }}>{u.name}</h3>
                        <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                          {u.role || 'Member'} · {u.department || 'General'}
                        </span>
                      </div>
                    </div>

                    {u.canTeach.length > 0 && (
                      <div style={{ marginBottom: '12px' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#10b981', display: 'block', marginBottom: '6px' }}>
                          CAN TEACH / HAS SKILL
                        </span>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                          {u.canTeach.map((st) => (
                            <span key={st.id} className="skill-chip selected-0" style={{ padding: '4px 10px', fontSize: '0.78rem' }}>
                              {st.name} ({st.level || 'Intermediate'})
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {u.wantToLearn.length > 0 && (
                      <div>
                        <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#8b5cf6', display: 'block', marginBottom: '6px' }}>
                          WANTS TO LEARN
                        </span>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                          {u.wantToLearn.map((st) => (
                            <span key={st.id} className="skill-chip selected-1" style={{ padding: '4px 10px', fontSize: '0.78rem' }}>
                              {st.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: '10px', marginTop: '18px' }}>
                      <button
                        type="button"
                        className="add-skill-btn"
                        style={{ flex: 1, padding: '8px', fontSize: '0.82rem', justifyContent: 'center' }}
                        onClick={() => navigate(`/chat/${u.userId}`)}
                      >
                        <FaComments /> Chat
                      </button>
                      <button
                        type="button"
                        className="add-skill-btn"
                        style={{ flex: 1, padding: '8px', fontSize: '0.82rem', justifyContent: 'center', background: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
                        onClick={() => navigate(`/profile/${u.userId}`)}
                      >
                        Profile
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* TAB 4: SMART MATCHMAKING */}
          {activeTab === 'match' && (
            <motion.div
              key="match-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
            >
              <h2 style={{ fontSize: '1.3rem', fontWeight: '700', marginBottom: '16px' }}>
                Mentors & Learners Matched For You ({userInfo?.name})
              </h2>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '24px' }}>
                {/* Mentors Card Column */}
                <div>
                  <h3 style={{ fontSize: '1.1rem', color: '#10b981', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FaStar /> Potential Mentors (They teach what you learn)
                  </h3>
                  {matchesData?.potentialMentors?.length === 0 ? (
                    <div className="venn-container-card" style={{ color: 'var(--text-secondary)' }}>
                      No direct mentor matches found yet. Add skills to "Want to Learn" in your profile!
                    </div>
                  ) : (
                    matchesData?.potentialMentors?.map((item, idx) => (
                      <div key={idx} className="match-card" style={{ marginBottom: '14px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div className="user-avatar-circle">
                              {item.mentor.profileImage ? (
                                <img src={item.mentor.profileImage.startsWith('data:image') ? item.mentor.profileImage : `${BACKEND_URL}${item.mentor.profileImage}`} alt={item.mentor.name} />
                              ) : (
                                item.mentor.name?.charAt(0)?.toUpperCase()
                              )}
                            </div>
                            <div>
                              <strong style={{ display: 'block', fontSize: '0.95rem' }}>{item.mentor.name}</strong>
                              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{item.mentor.department || 'General'}</span>
                            </div>
                          </div>
                          <span className="match-score-badge">Teaches {item.skill.name}</span>
                        </div>
                        <button
                          type="button"
                          className="add-skill-btn"
                          style={{ width: '100%', justifyContent: 'center', padding: '8px' }}
                          onClick={() => navigate(`/chat/${item.mentor.id}`)}
                        >
                          <FaComments /> Connect with Mentor
                        </button>
                      </div>
                    ))
                  )}
                </div>

                {/* Learners Card Column */}
                <div>
                  <h3 style={{ fontSize: '1.1rem', color: '#8b5cf6', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FaUserAlt /> Potential Learners (They want to learn your stack)
                  </h3>
                  {matchesData?.potentialLearners?.length === 0 ? (
                    <div className="venn-container-card" style={{ color: 'var(--text-secondary)' }}>
                      No learner matches found yet. Add skills you can teach to your profile!
                    </div>
                  ) : (
                    matchesData?.potentialLearners?.map((item, idx) => (
                      <div key={idx} className="match-card" style={{ marginBottom: '14px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div className="user-avatar-circle">
                              {item.learner.profileImage ? (
                                <img src={item.learner.profileImage.startsWith('data:image') ? item.learner.profileImage : `${BACKEND_URL}${item.learner.profileImage}`} alt={item.learner.name} />
                              ) : (
                                item.learner.name?.charAt(0)?.toUpperCase()
                              )}
                            </div>
                            <div>
                              <strong style={{ display: 'block', fontSize: '0.95rem' }}>{item.learner.name}</strong>
                              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{item.learner.department || 'General'}</span>
                            </div>
                          </div>
                          <span className="skill-chip selected-1">Wants {item.skill.name}</span>
                        </div>
                        <button
                          type="button"
                          className="add-skill-btn"
                          style={{ width: '100%', justifyContent: 'center', padding: '8px', background: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
                          onClick={() => navigate(`/chat/${item.learner.id}`)}
                        >
                          <FaComments /> Offer Help / Chat
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* ADD SKILL MODAL */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content-card">
            <div className="modal-header-row">
              <h3>Add Skill to Your Tech Profile</h3>
              <button className="close-modal-btn" onClick={() => setIsModalOpen(false)}>
                <FaTimes />
              </button>
            </div>
            <form onSubmit={handleAddSkillSubmit}>
              <div className="form-group-field">
                <label>Skill Name (e.g. Python, React, DevOps)</label>
                <input
                  type="text"
                  required
                  placeholder="Enter skill name..."
                  value={newSkillName}
                  onChange={(e) => setNewSkillName(e.target.value)}
                />
              </div>

              <div className="form-group-field">
                <label>Type</label>
                <select value={newSkillType} onChange={(e) => setNewSkillType(e.target.value)}>
                  <option value="can_teach">Can Teach / Expertise</option>
                  <option value="want_to_learn">Want to Learn / Looking for Mentor</option>
                </select>
              </div>

              <div className="form-group-field">
                <label>Proficiency Level</label>
                <select value={newSkillLevel} onChange={(e) => setNewSkillLevel(e.target.value)}>
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                <button
                  type="button"
                  className="add-skill-btn"
                  style={{ background: 'transparent', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="add-skill-btn" disabled={submittingSkill}>
                  {submittingSkill ? 'Saving...' : 'Add Skill'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SkillSharingScreen;
