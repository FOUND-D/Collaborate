import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { createProjectWithAI } from '../actions/projectActions';
import { PROJECT_CREATE_WITH_AI_RESET } from '../constants/projectConstants';
import { listTeams } from '../actions/teamActions';
import Loader from '../components/Loader';
import Message from '../components/Message';
import FormContainer from '../components/FormContainer'; // Using the standard form container
import { FaRobot, FaChevronLeft } from 'react-icons/fa';

const ProjectCreateScreen = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [projectName, setProjectName] = useState(''); // New state for project name
  const [aiPrompt, setAiPrompt] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [selectedTeam, setSelectedTeam] = useState('');

  const teamList = useSelector((state) => state.teamList);
  const { teams = [] } = teamList;

  const projectCreateWithAI = useSelector((state) => state.projectCreateWithAI);
  const { loading, error, success, project } = projectCreateWithAI;

  const userInfo = useSelector((state) => state.userLogin.userInfo);

  useEffect(() => {
    if (!userInfo) {
      navigate('/login');
    } else {
      dispatch(listTeams());
    }
    if (success) {
      dispatch({ type: PROJECT_CREATE_WITH_AI_RESET });
      navigate(`/project/${project._id}`);
    }
  }, [dispatch, navigate, success, project, userInfo]);

  const submitHandler = (e) => {
    e.preventDefault();
    if (!projectName.trim() || !aiPrompt.trim()) {
      // Basic validation
      return;
    }
    dispatch(createProjectWithAI({ name: projectName, goal: aiPrompt, dueDate, teamId: selectedTeam }));
  };

  return (
    <>
      <Link to="/projects/ongoing" className="btn btn-secondary btn-small back-button" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
        <FaChevronLeft /> Go Back
      </Link>
      
      <FormContainer>
        <div className="text-center mb-4">
          <FaRobot className="ai-icon" style={{ fontSize: '3rem', color: 'var(--primary-brand-color)' }} />
          <h1 className="hero-title" style={{ fontSize: '2rem', fontWeight: '700', marginTop: '1rem' }}>Create a New Project with AI</h1>
          <p style={{ color: 'var(--text-medium-emphasis)'}}>Describe your goal, and let our AI build the plan.</p>
        </div>

        {error && <Message variant='danger'>{error}</Message>}

        <form onSubmit={submitHandler}>
          <div className="form-group floating-label">
            <input
              type="text"
              id="projectName"
              className="form-input"
              placeholder=" "
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              required
            />
            <label htmlFor="projectName">Project Name*</label>
          </div>

          <div className="form-group floating-label">
            <textarea
              id="aiPrompt"
              className="form-input"
              placeholder=" "
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              rows={5}
              required
            ></textarea>
            <label htmlFor="aiPrompt">Project Goal or Description*</label>
            <small style={{ color: 'var(--text-low-emphasis)', display: 'block', marginTop: '4px' }}>
              e.g., 'An e-commerce site for custom t-shirts.'
            </small>
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
          
          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '1rem' }}
            disabled={loading}
          >
            {loading ? 'Generating...' : 'Generate Project with AI'}
          </button>
        </form>

        {loading && (
          <div style={{ marginTop: '2rem' }}>
            <Loader />
            <p className="text-center" style={{ color: 'var(--text-medium-emphasis)', marginTop: '1rem' }}>AI is building your project roadmap...</p>
          </div>
        )}
      </FormContainer>
    </>
  );
};

export default ProjectCreateScreen;
