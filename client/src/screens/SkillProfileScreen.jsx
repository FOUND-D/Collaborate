import React, { useEffect, useMemo, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { FaCheckCircle, FaGraduationCap, FaPlus, FaSearch, FaStar, FaTimes } from 'react-icons/fa';
import { useDispatch, useSelector } from 'react-redux';
import { createUserSkill, deleteUserSkill, listSkills, listUserSkills } from '../actions/skillActions';
import './SkillExchange.css';

const columnConfig = {
  can_teach: {
    title: 'I can teach',
    subtitle: 'High-confidence skills you can mentor through live sessions.',
    icon: <FaGraduationCap />,
  },
  wants_to_learn: {
    title: 'I want to learn',
    subtitle: 'Skills you want to level up through targeted exchanges.',
    icon: <FaSearch />,
  },
};

const SkillProfileScreen = () => {
  const dispatch = useDispatch();
  const userInfo = useSelector((state) => state.userLogin.userInfo);
  const { skills: taxonomy = [] } = useSelector((state) => state.skillList);
  const { skills: userSkills = [], loading } = useSelector((state) => state.userSkillList);
  const { error: createError } = useSelector((state) => state.userSkillCreate);

  const [drafts, setDrafts] = useState({
    can_teach: { 
      query: '', 
      level: 'advanced', 
      selectedSkill: null, 
      showSuggestions: false, 
      activeIndex: -1,
      inlineError: false 
    },
    wants_to_learn: { 
      query: '', 
      level: 'beginner', 
      selectedSkill: null, 
      showSuggestions: false, 
      activeIndex: -1,
      inlineError: false 
    },
  });

  const lastProcessedError = useRef(null);

  useEffect(() => {
    if (userInfo?._id) {
      dispatch(listSkills());
      dispatch(listUserSkills(userInfo._id));
    }
  }, [dispatch, userInfo?._id]);

  useEffect(() => {
    if (createError && createError !== lastProcessedError.current) {
      lastProcessedError.current = createError;
      // Identify which draft to show error for. This is tricky since Redux error is global.
      // We'll show it for whichever draft has a selectedSkill but failed.
      Object.keys(drafts).forEach(type => {
        if (drafts[type].selectedSkill) {
          updateDraft(type, { inlineError: true });
          setTimeout(() => updateDraft(type, { inlineError: false }), 2000);
        }
      });
    }
  }, [createError]);

  const groupedSkills = useMemo(() => ({
    can_teach: userSkills.filter((item) => item.type === 'can_teach'),
    wants_to_learn: userSkills.filter((item) => item.type === 'wants_to_learn'),
  }), [userSkills]);

  const updateDraft = (type, patch) => {
    setDrafts((prev) => ({
      ...prev,
      [type]: {
        ...prev[type],
        ...patch,
      },
    }));
  };

  const addSkill = async (type) => {
    const draft = drafts[type];
    if (!draft.selectedSkill) return;

    const payload = draft.selectedSkill.id 
      ? { skillId: draft.selectedSkill.id, type, level: draft.level }
      : { name: draft.selectedSkill.name, type, level: draft.level };

    const created = await dispatch(createUserSkill(payload));

    if (created) {
      dispatch(listSkills());
      updateDraft(type, {
        query: '',
        selectedSkill: null,
        showSuggestions: false,
        activeIndex: -1
      });
    }
  };

  const filteredSuggestions = (type) => {
    const query = drafts[type].query.trim().toLowerCase();
    if (query.length < 1) return [];
    const matches = taxonomy
      .filter((skill) => skill.name.toLowerCase().includes(query))
      .sort((a, b) => a.name.localeCompare(b.name))
      .slice(0, 8);
    
    return matches;
  };

  const handleSelectSkill = (type, skill) => {
    updateDraft(type, { 
      query: '', 
      selectedSkill: skill,
      showSuggestions: false,
      activeIndex: -1 
    });
  };

  const handleKeyDown = (e, type) => {
    const suggestions = filteredSuggestions(type);
    const query = drafts[type].query.trim();
    const hasMatches = suggestions.length > 0;
    const canAddNew = query.length > 0 && !hasMatches;
    
    const maxIndex = hasMatches ? suggestions.length - 1 : (canAddNew ? 0 : -1);

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const nextIndex = maxIndex >= 0 ? (drafts[type].activeIndex + 1) % (maxIndex + 1) : -1;
      updateDraft(type, { activeIndex: nextIndex });
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const nextIndex = maxIndex >= 0 ? (drafts[type].activeIndex - 1 + (maxIndex + 1)) % (maxIndex + 1) : -1;
      updateDraft(type, { activeIndex: nextIndex });
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (hasMatches && drafts[type].activeIndex >= 0 && suggestions[drafts[type].activeIndex]) {
        handleSelectSkill(type, suggestions[drafts[type].activeIndex]);
      } else if (canAddNew && drafts[type].activeIndex === 0) {
        handleSelectSkill(type, { id: null, name: query });
      }
    } else if (e.key === 'Escape') {
      updateDraft(type, { showSuggestions: false, activeIndex: -1 });
    }
  };

  return (
    <div className="phase2-page">
      <div className="phase2-shell">
        <div className="phase2-hero">
          <div>
            <span className="phase2-badge phase2-badge-ai"><FaStar /> Skill graph</span>
            <h1>Build your exchange profile</h1>
            <p>Shape a clear teach/learn identity so matching, listings, and session invitations become precise.</p>
          </div>
          <div className="phase2-hero-stat phase2-glass">
            <div>
              <span>Profile signal</span>
              <strong>{groupedSkills.can_teach.length + groupedSkills.wants_to_learn.length}</strong>
              <small>tracked skills</small>
            </div>
            <div className="profile-signal-rating">
              {userInfo?.avg_rating ? (
                <>
                  <div className="sidebar-stars">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <FaStar key={i} className={i <= Math.round(userInfo.avg_rating) ? 'star-filled' : 'star-empty'} />
                    ))}
                  </div>
                  <span className="rating-value">{userInfo.avg_rating.toFixed(1)} ★</span>
                </>
              ) : (
                <span className="no-rating">No ratings yet</span>
              )}
            </div>
          </div>
        </div>

        <div className="phase2-split-grid">
          {Object.entries(columnConfig).map(([type, meta], index) => (
            <motion.section
              key={type}
              className="phase2-panel phase2-glass"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
            >
              <div className="phase2-panel-head">
                <div className="phase2-panel-title">
                  <div className="phase2-panel-icon">{meta.icon}</div>
                  <div>
                    <h2>{meta.title}</h2>
                    <p>{meta.subtitle}</p>
                  </div>
                </div>
              </div>

              <div className="phase2-skill-entry">
                <div className="phase2-autocomplete-wrapper">
                  <input
                    value={drafts[type].query}
                    onChange={(e) => updateDraft(type, { 
                      query: e.target.value, 
                      showSuggestions: true,
                      activeIndex: -1 
                    })}
                    onFocus={() => updateDraft(type, { showSuggestions: true })}
                    onKeyDown={(e) => handleKeyDown(e, type)}
                    placeholder="Type to search skills..."
                  />
                  {drafts[type].showSuggestions && (
                    <div className="phase2-autocomplete-dropdown">
                      {filteredSuggestions(type).map((skill, sIdx) => (
                        <button
                          key={skill.id}
                          type="button"
                          className={`phase2-autocomplete-item ${drafts[type].activeIndex === sIdx ? 'active' : ''}`}
                          onClick={() => handleSelectSkill(type, skill)}
                        >
                          <span>{skill.name}</span>
                          <small>{skill.category || 'General'}</small>
                        </button>
                      ))}
                      {drafts[type].query.trim().length > 0 && filteredSuggestions(type).length === 0 && (
                        <button
                          type="button"
                          className={`phase2-autocomplete-item ${drafts[type].activeIndex === 0 ? 'active' : ''}`}
                          style={{ borderStyle: 'dashed', color: '#2dd4bf', fontStyle: 'italic' }}
                          onClick={() => handleSelectSkill(type, { id: null, name: drafts[type].query.trim() })}
                        >
                          + Add "{drafts[type].query.trim()}" as new skill
                        </button>
                      )}
                    </div>
                  )}
                  {drafts[type].selectedSkill && (
                    <div className="phase2-selected-skill-chip">
                      {drafts[type].selectedSkill.name}
                      <button type="button" onClick={() => updateDraft(type, { selectedSkill: null })}>
                        <FaTimes />
                      </button>
                    </div>
                  )}
                  {drafts[type].inlineError && (
                    <div className="phase2-inline-error">Already in your profile</div>
                  )}
                </div>

                <select
                  value={drafts[type].level}
                  onChange={(e) => updateDraft(type, { level: e.target.value })}
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>

                <button 
                  type="button" 
                  className="phase2-button phase2-button-primary" 
                  onClick={() => addSkill(type)}
                  disabled={!drafts[type].selectedSkill}
                  style={{ opacity: drafts[type].selectedSkill ? 1 : 0.5 }}
                >
                  <FaPlus /> Add
                </button>
              </div>

              <div className="phase2-skill-list">
                {loading ? (
                  <div className="phase2-empty">Loading skill profile...</div>
                ) : groupedSkills[type].length === 0 ? (
                  <div className="phase2-empty">No skills added in this column yet.</div>
                ) : (
                  groupedSkills[type].map((item, skillIndex) => (
                    <motion.div
                      key={`${item.skillId}-${item.type}`}
                      className="phase2-skill-chip"
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: skillIndex * 0.04 }}
                    >
                      <div>
                        <strong>{item.skill?.name || 'Untitled skill'}</strong>
                        <div className="phase2-chip-meta">
                          <span>{item.level || 'unspecified'}</span>
                          {item.endorsedBy && (
                                                      <span className="phase2-endorsement-pill">{(typeof FaCheckCircle !== 'undefined') ? <FaCheckCircle /> : <svg width="14" height="14" viewBox="0 0 24 24" style={{ width: '0.9rem', height: '0.9rem', verticalAlign: 'text-bottom' }} xmlns="http://www.w3.org/2000/svg"><path fill="currentColor" d="M12 2a10 10 0 1 0 .001 20.001A10 10 0 0 0 12 2zm-1 14.5l-5-5 1.41-1.41L11 13.67l6.59-6.59L19 8.5l-8 8z"/></svg>} Faculty endorsed</span>
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        className="phase2-chip-remove"
                        onClick={() => dispatch(deleteUserSkill(item.skillId, item.type))}
                      >
                        Remove
                      </button>
                    </motion.div>
                  ))
                )}
              </div>
            </motion.section>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SkillProfileScreen;

;
