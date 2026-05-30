import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaCalendarPlus, FaTimes } from 'react-icons/fa';
import { useDispatch, useSelector } from 'react-redux';
import { listSkills } from '../actions/skillActions';
import api from '../utils/api';
import '../screens/SkillExchange.css';

const defaultState = {
  selectedSkill: null,
  query: '',
  showSuggestions: false,
  activeIndex: -1,
  teamId: '',
  date: '',
  time: '',
  durationMin: 60,
  agenda: '',
};

const BookSessionModal = ({ isOpen, onClose, onBooked }) => {
  const dispatch = useDispatch();
  const [form, setForm] = useState(defaultState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const { skills = [] } = useSelector((state) => state.skillList || {});
  const { teams = [] } = useSelector((state) => state.teamList || {});
  const { userInfo } = useSelector((state) => state.userLogin || {});

  useEffect(() => {
    if (isOpen) {
      dispatch(listSkills());
      setForm({
        ...defaultState,
        date: new Date().toISOString().split('T')[0], // Default to today
      });
      setError('');
    }
  }, [dispatch, isOpen]);

  const filteredSuggestions = useMemo(() => {
    const q = form.query.trim().toLowerCase();
    if (q.length < 1) return [];
    return skills
      .filter((s) => s.name.toLowerCase().includes(q))
      .sort((a, b) => a.name.localeCompare(b.name))
      .slice(0, 8);
  }, [skills, form.query]);

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

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.selectedSkill || !form.teamId || !form.date || !form.time) {
      setError('Please fill in all required fields.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const scheduledAt = new Date(`${form.date}T${form.time}`).toISOString();
      const payload = {
        skill_id: form.selectedSkill.id,
        team_id: form.teamId,
        scheduled_at: scheduledAt,
        duration_min: Number(form.durationMin),
        agenda: form.agenda,
        status: 'pending',
      };

      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userInfo.token}`,
        },
      };

      await api.post('/api/booking-sessions', payload, config);
      if (onBooked) onBooked();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to book session.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];

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
              <span className="phase2-badge"><FaCalendarPlus /> Booking</span>
              <h2>Book a Session</h2>
              <p>Schedule a skill exchange session with one of your teams.</p>
            </div>

            {error && <div className="phase2-inline-error" style={{ marginBottom: '16px' }}>{error}</div>}

            <form className="phase2-form-grid" onSubmit={handleSubmit}>
              <div className="phase2-field phase2-field-full">
                <span>Subject / Skill <span style={{color:'var(--danger-color)'}}>*</span></span>
                <div className="phase2-autocomplete-wrapper">
                  <input
                    value={form.query}
                    onChange={(e) => setForm(prev => ({ ...prev, query: e.target.value, showSuggestions: true, activeIndex: -1 }))}
                    onFocus={() => setForm(prev => ({ ...prev, showSuggestions: true }))}
                    onKeyDown={handleKeyDown}
                    placeholder="Type to search skills..."
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
              </div>

              <label className="phase2-field phase2-field-full">
                <span>Team <span style={{color:'var(--danger-color)'}}>*</span></span>
                <select
                  value={form.teamId}
                  onChange={(e) => setForm((prev) => ({ ...prev, teamId: e.target.value }))}
                  required
                >
                  <option value="">Select a team</option>
                  {teams.map((team) => (
                    <option key={team._id} value={team._id}>
                      {team.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="phase2-field">
                <span>Date <span style={{color:'var(--danger-color)'}}>*</span></span>
                <input
                  type="date"
                  min={todayStr}
                  value={form.date}
                  onChange={(e) => setForm((prev) => ({ ...prev, date: e.target.value }))}
                  required
                />
              </label>

              <label className="phase2-field">
                <span>Time <span style={{color:'var(--danger-color)'}}>*</span></span>
                <input
                  type="time"
                  value={form.time}
                  onChange={(e) => setForm((prev) => ({ ...prev, time: e.target.value }))}
                  required
                />
              </label>

              <label className="phase2-field phase2-field-full">
                <span>Duration</span>
                <select
                  value={form.durationMin}
                  onChange={(e) => setForm((prev) => ({ ...prev, durationMin: Number(e.target.value) }))}
                >
                  <option value={30}>30 minutes</option>
                  <option value={45}>45 minutes</option>
                  <option value={60}>60 minutes</option>
                  <option value={90}>90 minutes</option>
                </select>
              </label>

              <label className="phase2-field phase2-field-full">
                <span>Notes / Agenda (Optional)</span>
                <textarea
                  id="session-agenda"
                  name="agenda"
                  rows="3"
                  placeholder="What do you want to cover?"
                  value={form.agenda}
                  onChange={(e) => setForm((prev) => ({ ...prev, agenda: e.target.value }))}
                />
              </label>

              <div className="phase2-modal-actions phase2-field-full">
                <button type="button" className="phase2-button phase2-button-secondary" onClick={onClose} disabled={isSubmitting}>
                  Cancel
                </button>
                <button type="submit" className="phase2-button phase2-button-primary" disabled={isSubmitting || !form.selectedSkill || !form.teamId || !form.date || !form.time}>
                  {isSubmitting ? 'Booking...' : 'Book Session'}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default BookSessionModal;