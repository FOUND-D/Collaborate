import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaBolt, FaTimes } from 'react-icons/fa';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { createListing } from '../actions/listingActions';
import { listUserSkills } from '../actions/skillActions';
import '../screens/SkillExchange.css';

const defaultState = {
  selectedSkill: null,
  query: '',
  showSuggestions: false,
  activeIndex: -1,
  listingType: 'offer',
  level: 'intermediate',
  creditRate: 10,
  format: 'one_on_one',
  maxGroupSize: '',
  description: '',
};

const ListingCreateModal = ({ isOpen, onClose }) => {
  const dispatch = useDispatch();
  const [form, setForm] = useState(defaultState);
  const userInfo = useSelector((state) => state.userLogin.userInfo);
  const { skills: userSkills = [] } = useSelector((state) => state.userSkillList);

  useEffect(() => {
    if (isOpen && userInfo?._id) {
      dispatch(listUserSkills(userInfo._id));
    }
  }, [dispatch, isOpen, userInfo?._id]);

  const teachableSkills = useMemo(
    () => userSkills.filter((us) => us.type === 'can_teach').map(us => us.skill),
    [userSkills]
  );

  const filteredSuggestions = useMemo(() => {
    const q = form.query.trim().toLowerCase();
    if (q.length < 1) return [];
    return teachableSkills
      .filter((s) => s.name.toLowerCase().includes(q))
      .sort((a, b) => a.name.localeCompare(b.name))
      .slice(0, 8);
  }, [teachableSkills, form.query]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.selectedSkill) return;

    const payload = {
      skillId: form.selectedSkill.id,
      listingType: form.listingType,
      level: form.level,
      creditRate: Number(form.creditRate || 0),
      format: form.format,
      maxGroupSize: form.format === 'group' ? Number(form.maxGroupSize || 2) : null,
      description: form.description,
    };

    const created = await dispatch(createListing(payload));
    if (created) {
      setForm(defaultState);
      onClose();
    }
  };

  const handleSelectSkill = (skill) => {
    setForm(prev => ({
      ...prev,
      selectedSkill: skill,
      query: '',
      showSuggestions: false,
      activeIndex: -1
    }));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setForm(prev => ({ ...prev, activeIndex: (prev.activeIndex + 1) % filteredSuggestions.length }));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setForm(prev => ({ ...prev, activeIndex: (prev.activeIndex - 1 + filteredSuggestions.length) % filteredSuggestions.length }));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (form.activeIndex >= 0 && filteredSuggestions[form.activeIndex]) {
        handleSelectSkill(filteredSuggestions[form.activeIndex]);
      }
    } else if (e.key === 'Escape') {
      setForm(prev => ({ ...prev, showSuggestions: false, activeIndex: -1 }));
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="phase2-modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="phase2-modal phase2-glass"
            initial={{ opacity: 0, y: 40, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.98 }}
          >
            <button type="button" className="phase2-modal-close" onClick={onClose}>
              <FaTimes />
            </button>
            <div className="phase2-modal-head">
              <span className="phase2-badge phase2-badge-ai"><FaBolt /> Exchange listing</span>
              <h2>Create a skill listing</h2>
              <p>Publish a high-signal offer or request with clear format, and outcome.</p>
            </div>

            <form className="phase2-form-grid" onSubmit={handleSubmit}>
              <div className="phase2-field phase2-field-full">
                <span>Skill</span>
                {teachableSkills.length === 0 ? (
                  <div className="phase2-empty" style={{ padding: '12px', textAlign: 'left', borderRadius: '14px', background: 'var(--phase2-secondary-bg)' }}>
                    Add skills to your <Link to="/profile" onClick={onClose} style={{ color: 'var(--color-primary)', fontWeight: 'bold' }}>Profile</Link> first.
                  </div>
                ) : (
                  <div className="phase2-autocomplete-wrapper">
                    <input
                      value={form.query}
                      onChange={(e) => setForm(prev => ({ ...prev, query: e.target.value, showSuggestions: true, activeIndex: -1 }))}
                      onFocus={() => setForm(prev => ({ ...prev, showSuggestions: true }))}
                      onKeyDown={handleKeyDown}
                      placeholder="Type to search your skills..."
                      required={!form.selectedSkill}
                    />
                    {form.showSuggestions && filteredSuggestions.length > 0 && (
                      <div className="phase2-autocomplete-dropdown">
                        {filteredSuggestions.map((skill, sIdx) => (
                          <button
                            key={skill.id}
                            type="button"
                            className={`phase2-autocomplete-item ${form.activeIndex === sIdx ? 'active' : ''}`}
                            onClick={() => handleSelectSkill(skill)}
                          >
                            <span>{skill.name}</span>
                            <small>{skill.category || 'General'}</small>
                          </button>
                        ))}
                      </div>
                    )}
                    {form.selectedSkill && (
                      <div className="phase2-selected-skill-chip">
                        {form.selectedSkill.name}
                        <button type="button" onClick={() => setForm(prev => ({ ...prev, selectedSkill: null }))}>
                          <FaTimes />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <label className="phase2-field">
                <span>Listing type</span>
                <select
                  value={form.listingType}
                  onChange={(e) => setForm((prev) => ({ ...prev, listingType: e.target.value }))}
                >
                  <option value="offer">Offer</option>
                  <option value="request">Request</option>
                </select>
              </label>


              <label className="phase2-field">
                <span>Level</span>
                <select
                  value={form.level}
                  onChange={(e) => setForm((prev) => ({ ...prev, level: e.target.value }))}
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </label>


              <label className="phase2-field">
                <span>Format</span>
                <select
                  value={form.format}
                  onChange={(e) => setForm((prev) => ({ ...prev, format: e.target.value }))}
                >
                  <option value="one_on_one">1-on-1</option>
                  <option value="group">Group</option>
                </select>
              </label>

              <label className="phase2-field">
                <span>Max group size</span>
                <input
                  type="number"
                  min="2"
                  disabled={form.format !== 'group'}
                  value={form.maxGroupSize}
                  onChange={(e) => setForm((prev) => ({ ...prev, maxGroupSize: e.target.value }))}
                />
              </label>

              <label className="phase2-field phase2-field-full">
                <span>Description</span>
                <textarea
                  rows="4"
                  placeholder={form.selectedSkill ? `What should people expect from your ${form.selectedSkill.name} exchange?` : 'Describe scope, expectations, and ideal partner.'}
                  value={form.description}
                  onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                />
              </label>

              <div className="phase2-modal-actions">
                <button type="button" className="phase2-button phase2-button-secondary" onClick={onClose}>
                  Cancel
                </button>
                <button type="submit" className="phase2-button phase2-button-primary">
                  Publish listing
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ListingCreateModal;
