import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';
import {
  FaGithub,
  FaLinkedin,
  FaCode,
  FaGlobe,
  FaEdit,
  FaStar,
  FaRegStar,
  FaPlus,
  FaBook,
  FaChartLine,
  FaPencilAlt,
  FaTimes,
  FaExternalLinkAlt,
  FaAward,
} from 'react-icons/fa';
import {
  updateUserProfile,
} from '../actions/userActions';
import { listUserSkills } from '../actions/skillActions';
import { listProjects } from '../actions/projectActions';
import { listRatings } from '../actions/ratingActions';
import api from '../utils/api';
import Loader from '../components/Loader';
import Message from '../components/Message';
import { BACKEND_URL } from '../config/runtime';
import './ProfileScreen.css';

const ProfileScreen = () => {
  const { userId: paramUserId } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const userLogin = useSelector((state) => state.userLogin);
  const { userInfo } = userLogin;

  const userUpdateProfile = useSelector((state) => state.userUpdateProfile);
  const { success: updateSuccess, loading: updateLoading, error: updateError } = userUpdateProfile;

  const { skills: userSkills = [] } = useSelector((state) => state.userSkillList);
  const { projects = [] } = useSelector((state) => state.projectList);
  const { ratings = [] } = useSelector((state) => state.ratingList);

  const [profileUser, setProfileUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [badges, setBadges] = useState([]);

  // Tab State
  const [activeTab, setActiveTab] = useState('github');
  
  // External Data State
  const [githubData, setGithubData] = useState(null);
  const [githubRepos, setGithubRepos] = useState([]);
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
    linkedinUrl: '',
    leetcodeUsername: '',
    portfolioUrl: '',
  });

  const isOwnProfile = !paramUserId || paramUserId === userInfo?._id;
  const targetId = paramUserId || userInfo?._id;

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
      fetchData();
      // Reset external data when user changes
      setGithubData(null);
      setGithubRepos([]);
      setLeetcodeData(null);
      setActiveTab('github');
    }
  }, [targetId, dispatch]);

  const fetchGithub = async () => {
    let username = profileUser?.githubUsername;
    if (!username || githubData) return;

    if (username.includes('github.com/')) {
      username = username.split('github.com/')[1].split('/')[0];
    }

    setLoadingGithub(true);
    setGithubError(null);
    try {
      const [userRes, reposRes] = await Promise.all([
        axios.get(`https://api.github.com/users/${username}`),
        axios.get(`https://api.github.com/users/${username}/repos?sort=updated&per_page=100`)
      ]);
      setGithubData(userRes.data);
      setGithubRepos(reposRes.data);
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
      if (res.data.status === 'success') {
        setLeetcodeData(res.data);
      } else {
        setLeetcodeError(res.data.message || 'LeetCode user not found or API error.');
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

  useEffect(() => {
    if (activeTab === 'github' && profileUser?.githubUsername && !githubData && !loadingGithub) {
      fetchGithub();
    }
    if (activeTab === 'leetcode' && profileUser?.leetcodeUsername && !leetcodeData && !loadingLeetcode) {
      fetchLeetcode();
    }
  }, [activeTab, profileUser, githubData, leetcodeData, loadingGithub, loadingLeetcode]);

  const totalStars = useMemo(() => {
    return githubRepos.reduce((acc, repo) => acc + (repo.stargazers_count || 0), 0);
  }, [githubRepos]);

  const topRepos = useMemo(() => {
    return [...githubRepos]
      .sort((a, b) => b.stargazers_count - a.stargazers_count)
      .slice(0, 3);
  }, [githubRepos]);

  const canTeachSkills = userSkills.filter(s => s.type === 'can_teach');
  const wantsToLearnSkills = userSkills.filter(s => s.type === 'wants_to_learn');

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
      setProfileUser(prev => ({...prev, ...editForm, yearOfStudy: editForm.yearOfStudy ? Number(editForm.yearOfStudy) : null}));
    }
  }, [updateSuccess]);

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
                {profileUser.role}
              </span>

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
              </div>

              {isOwnProfile && (
                <div className="credits-balance">
                  <FaStar style={{ color: '#000' }} />
                  {profileUser.credits ?? 50} Credits
                </div>
              )}

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

              <div className="profile-badges-compact">
                {badges.slice(0, 4).map(badge => (
                  <div key={badge.id} className="badge-chip-small" title={badge.type}>
                    <FaAward />
                    <span>{badge.type.split('_')[0]}</span>
                  </div>
                ))}
                {badges.length > 4 && (
                  <div className="badge-chip-small">+{badges.length - 4} more</div>
                )}
              </div>

              {isOwnProfile ? (
                <button className="phase2-button phase2-button-secondary" style={{ width: '100%', marginTop: '8px' }} onClick={() => setIsEditModalOpen(true)}>
                  <FaEdit /> Edit Profile
                </button>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', marginTop: '16px' }}>
                  <Link to={`/exchange?user_id=${profileUser._id}`} className="phase2-button phase2-button-primary">
                    Book Session
                  </Link>
                  <Link to={`/chat/${profileUser._id}`} className="phase2-button phase2-button-secondary">
                    Send Message
                  </Link>
                </div>
              )}
            </div>
          </aside>

          {/* RIGHT COLUMN */}
          <main className="profile-right-column">
            
            {/* Skills */}
            <section className="profile-section phase2-glass phase2-panel">
              <div className="section-header">
                <h2 className="section-title"><FaChartLine /> Skills</h2>
                {isOwnProfile && <Link to="/skills" className="phase2-button phase2-button-secondary">Manage Skills</Link>}
              </div>
              <div className="skills-container">
                <div>
                  <div className="skill-group-label">Can Teach</div>
                  <div className="skill-chips">
                    {canTeachSkills.length > 0 ? canTeachSkills.slice(0, 6).map(s => (
                      <span key={s.skillId} className="phase2-pill offer">{s.skill?.name}</span>
                    )) : <p className="github-stat-lbl">No skills listed</p>}
                    {canTeachSkills.length > 6 && <span className="phase2-pill subtle">+{canTeachSkills.length - 6} more</span>}
                  </div>
                </div>
                <div>
                  <div className="skill-group-label">Wants to Learn</div>
                  <div className="skill-chips">
                    {wantsToLearnSkills.length > 0 ? wantsToLearnSkills.slice(0, 6).map(s => (
                      <span key={s.skillId} className="phase2-pill request">{s.skill?.name}</span>
                    )) : <p className="github-stat-lbl">No skills listed</p>}
                    {wantsToLearnSkills.length > 6 && <span className="phase2-pill subtle">+{wantsToLearnSkills.length - 6} more</span>}
                  </div>
                </div>
              </div>
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
                          <StatCard value={githubData?.public_repos} label="Public Repos" />
                          <StatCard value={githubData?.followers} label="Followers" />
                          <StatCard value={githubData?.following} label="Following" />
                          <StatCard value={githubData ? new Date(githubData.created_at).getFullYear() : '—'} label="Member Since" />
                        </div>
                        <div style={{ marginBottom: '16px', fontSize: '0.85rem', color: 'var(--text-tertiary)' }}>
                          Showing public activity only
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
                                  <span>⭐ {repo.stargazers_count}</span>
                                  <span>🍴 {repo.forks_count}</span>
                                </div>
                                <span className="phase2-pill subtle" style={{ fontSize: '0.65rem', padding: '2px 8px' }}>Public</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </section>
                )}

                {activeTab === 'leetcode' && (
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
                        <div className="lc-progress-container">
                          <div className="section-header" style={{ marginBottom: '8px' }}>
                            <span className="github-stat-lbl">Overall Progress</span>
                            <span className="github-stat-val">
                              {leetcodeData?.totalQuestions > 0 
                                ? ((leetcodeData.totalSolved / leetcodeData.totalQuestions) * 100).toFixed(1) 
                                : '0.0'}%
                            </span>
                          </div>
                          <div className="lc-progress-bar">
                            <div 
                              className="lc-progress-fill" 
                              style={{ 
                                width: `${leetcodeData?.totalQuestions > 0 
                                  ? (leetcodeData.totalSolved / leetcodeData.totalQuestions) * 100 
                                  : 0}%` 
                              }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    )}
                  </section>
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
    </div>
  );
};

// Sub-components for cleaner JSX
const SocialLink = ({ icon, label, value, href, isOwn, onAdd }) => {
  if (!value && !isOwn) return null;
  
  return (
    <a 
      href={value ? href : '#'} 
      target={value ? "_blank" : "_self"} 
      rel="noopener noreferrer" 
      className={`link-btn ${!value ? 'unset' : ''}`}
      onClick={(e) => {
        if (!value) {
          e.preventDefault();
          onAdd();
        }
      }}
    >
      <div className="link-btn-content">
        {icon} {label}
      </div>
      {!value && isOwn && <span className="add-label">+ Add</span>}
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
