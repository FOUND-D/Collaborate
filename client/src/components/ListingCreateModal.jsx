import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaBolt, FaTimes } from 'react-icons/fa';
import { useDispatch, useSelector } from 'react-redux';
import { createListing } from '../actions/listingActions';
import { listSkills } from '../actions/skillActions';
import '../screens/SkillExchange.css';

const defaultState = {
  skillId: '',
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
  const { skills = [] } = useSelector((state) => state.skillList);

  useEffect(() => {
    if (isOpen) {
      dispatch(listSkills());
    }
  }, [dispatch, isOpen]);

  const selectedSkill = useMemo(
    () => skills.find((skill) => skill.id === form.skillId),
    [skills, form.skillId]
  );

  const handleSubmit = async (event) => {
    event.preventDefault();
    const payload = {
      skillId: form.skillId,
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
              <p>Publish a high-signal offer or request with clear credits, format, and outcome.</p>
            </div>

            <form className="phase2-form-grid" onSubmit={handleSubmit}>
              <label className="phase2-field">
                <span>Skill</span>
                <select
                  value={form.skillId}
                  onChange={(e) => setForm((prev) => ({ ...prev, skillId: e.target.value }))}
                  required
                >
                  <option value="">Select a skill</option>
                  {skills.map((skill) => (
                    <option key={skill.id} value={skill.id}>
                      {skill.name}
                    </option>
                  ))}
                </select>
              </label>

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
                <span>Credits</span>
                <input
                  type="number"
                  min="0"
                  value={form.creditRate}
                  onChange={(e) => setForm((prev) => ({ ...prev, creditRate: e.target.value }))}
                />
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
                  placeholder={selectedSkill ? `What should people expect from your ${selectedSkill.name} exchange?` : 'Describe scope, expectations, and ideal partner.'}
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
