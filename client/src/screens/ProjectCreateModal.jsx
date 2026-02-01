import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createProject, createProjectWithAI } from '../actions/projectActions';
import { listTeams } from '../actions/teamActions';
import { FaTimes, FaMagic, FaPlus, FaRocket } from 'react-icons/fa';
import './ProjectCreateModal.css';

const ProjectCreateModal = ({ isOpen, onClose }) => {
  const [name, setName] = useState('');
  const [goal, setGoal] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [selectedTeam, setSelectedTeam] = useState('');
  const [isAiMode, setIsAiMode] = useState(true); // Default to AI mode
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
      dispatch(createProject({ name, goal, dueDate, teamId: selectedTeam }));
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button className="modal-close-btn" onClick={onClose}>
          <FaTimes />
        </button>
        
        <div className="text-center">
          <h2 className="modal-title">{isAiMode ? 'Create Project with AI' : 'Create New Project'}</h2>
          <p className="modal-description">
            {isAiMode 
              ? 'Let our AI assistant generate a full project plan for you.' 
              : 'Create a project manually by defining the basic details.'}
          </p>
        </div>

        <div className="segmented-control">
          <button
            className={!isAiMode ? 'active' : ''}
            onClick={() => setIsAiMode(false)}
          >
            <FaPlus style={{ marginRight: '8px' }} /> Manual
          </button>
          <button
            className={isAiMode ? 'active' : ''}
            onClick={() => setIsAiMode(true)}
          >
            <FaRocket style={{ marginRight: '8px' }} /> AI-Powered
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group floating-label" style={{ marginBottom: '1rem' }}>
            <input
              type="text"
              id="projectName"
              className="form-input"
              placeholder="e.g., 'Develop new mobile app'"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <label htmlFor="projectName">Project Name*</label>
          </div>
          
          <div className="form-group floating-label" style={{ marginBottom: '1rem' }}>
            <textarea
              id="projectGoal"
              className="form-input"
              placeholder="e.g., 'Create a high-quality app to reach a new user segment...'"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              rows={isAiMode ? 4 : 2}
              required={isAiMode} // Goal is required for AI mode
            ></textarea>
            <label htmlFor="projectGoal">
              {isAiMode ? 'What is the main goal of your project?*' : 'Project Description'}
            </label>
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
            
          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              {isAiMode ? 'Generate Project' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProjectCreateModal;
