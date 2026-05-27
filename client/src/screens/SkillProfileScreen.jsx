import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { FaCheckCircle, FaGraduationCap, FaPlus, FaSearch, FaStar } from 'react-icons/fa';
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

  const [drafts, setDrafts] = useState({
    can_teach: { query: '', level: 'advanced', selectedSkillId: '', showSuggestions: false },
    wants_to_learn: { query: '', level: 'beginner', selectedSkillId: '', showSuggestions: false },
  });

  useEffect(() => {
    if (userInfo?._id) {
      dispatch(listSkills());
      dispatch(listUserSkills(userInfo._id));
    }
  }, [dispatch, userInfo?._id]);

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
    const trimmedName = draft.query.trim();
    if (!trimmedName && !draft.selectedSkillId) return;

    const created = await dispatch(createUserSkill({
      skillId: draft.selectedSkillId || undefined,
      name: draft.selectedSkillId ? undefined : trimmedName,
      type,
      level: draft.level,
    }));

    if (created) {
      setDrafts((prev) => ({
        ...prev,
        [type]: {
          ...prev[type],
          query: '',
          selectedSkillId: '',
          showSuggestions: false,
        },
      }));
    }
  };

  const suggestionList = (type) => {
    const query = drafts[type].query.trim().toLowerCase();
    if (!query) return taxonomy.slice(0, 6);
    return taxonomy.filter((skill) => skill.name.toLowerCase().includes(query)).slice(0, 6);
  };

  const handleSelectSuggestion = (type, skill) => {
    updateDraft(type, { 
      query: skill.name, 
      selectedSkillId: skill.id,
      showSuggestions: false 
    });
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
            <span>Profile signal</span>
            <strong>{groupedSkills.can_teach.length + groupedSkills.wants_to_learn.length}</strong>
            <small>tracked skills</small>
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
                <div className="phase2-skill-input-wrap">
                  <input
                    value={drafts[type].query}
                    onChange={(e) => updateDraft(type, { 
                      query: e.target.value, 
                      selectedSkillId: '',
                      showSuggestions: true 
                    })}
                    onFocus={() => updateDraft(type, { showSuggestions: true })}
                    placeholder="Add skill or search taxonomy"
                  />
                  {drafts[type].showSuggestions && (
                    <div className="phase2-suggestion-list">
                      {suggestionList(type).map((skill) => (
                        <button
                          key={skill.id}
                          type="button"
                          className="phase2-suggestion-item"
                          onClick={() => handleSelectSuggestion(type, skill)}
                        >
                          <span>{skill.name}</span>
                          <small>{skill.category || 'General'}</small>
                        </button>
                      ))}
                    </div>
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

                <button type="button" className="phase2-button phase2-button-primary" onClick={() => addSkill(type)}>
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
                            <span className="phase2-endorsement-pill"><FaCheckCircle /> Faculty endorsed</span>
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
