import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createProject, createProjectWithAI } from '../actions/projectActions';
import { listTeams } from '../actions/teamActions';
import { FaTimes, FaMagic, FaPlus } from 'react-icons/fa';
import './ProjectCreateModal.css';

const ProjectCreateModal = ({ isOpen, onClose }) => {
  const [name, setName] = useState('');
  const [goal, setGoal] = useState('');
  const [dueDate, setDueDate] = useState(''); // New state for dueDate
  const [selectedTeam, setSelectedTeam] = useState(''); // New state for selectedTeam
  const [isAiMode, setIsAiMode] = useState(false);
  const dispatch = useDispatch();

  const teamList = useSelector((state) => state.teamList);
  const { teams = [] } = teamList;

  useEffect(() => {
    if (isOpen) {
      dispatch(listTeams());
    }
  }, [dispatch, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isAiMode) {
      dispatch(createProjectWithAI({ name, goal, dueDate, teamId: selectedTeam }));
    } else {
      dispatch(createProject({ name }));
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '550px' }}>
        <button className="btn-icon modal-close-btn" onClick={onClose} style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%', padding: '0.5rem' }}>
          <FaTimes />
        </button>
        
        <div className="text-center mb-4">
          <h2 style={{ fontWeight: '700', fontSize: '1.75rem', color: 'var(--text-high-emphasis)' }}>{isAiMode ? 'Create Project with AI' : 'Create New Project'}</h2>
        </div>

        <div className="modal-toggle" style={{ marginBottom: '2rem' }}>
          <button
            className={`toggle-btn ${!isAiMode ? 'active' : ''}`}
            onClick={() => setIsAiMode(false)}
          >
            <FaPlus /> Manual
          </button>
          <button
            className={`toggle-btn ${isAiMode ? 'active' : ''}`}
            onClick={() => setIsAiMode(true)}
          >
            <FaMagic /> AI-Powered
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group floating-label">
            <input
              type="text"
              id="projectName"
              className="form-input"
              placeholder=" "
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <label htmlFor="projectName">Project Name*</label>
          </div>
          {isAiMode && (
            <>
              <div className="form-group floating-label">
                <textarea
                  id="projectGoal"
                  className="form-input"
                  placeholder=" "
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  rows={4}
                  required
                ></textarea>
                <label htmlFor="projectGoal">Project Goal*</label>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group floating-label">
                  <input
                    type="date"
                    id="dueDate"
                    className="form-input"
                    placeholder=" "
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                  <label htmlFor="dueDate">Due Date</label>
                </div>
                <div className="form-group floating-label">
                  <select
                    id="selectedTeam"
                    value={selectedTeam}
                    onChange={(e) => setSelectedTeam(e.target.value)}
                    className="form-input"
                  >
                    <option value="">No Assigned Team</option>
                    {teams.map((team) => (
                      <option key={team._id} value={team._id}>
                        {team.name}
                      </option>
                    ))}
                  </select>
                  <label htmlFor="selectedTeam">Assign Team</label>
                </div>
              </div>
            </>
          )}
          <div className="form-actions" style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
              {isAiMode ? 'Generate Project' : 'Create Project'}
            </button>
            <button type="button" className="btn btn-secondary" onClick={onClose} style={{ flex: 1 }}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProjectCreateModal;
