import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { FaTrash, FaPlus } from 'react-icons/fa'; // Removed unused icons for cleaner code

import Message from '../components/Message';
import Loader from '../components/Loader';
import { listProjects, deleteProject } from '../actions/projectActions';
import { getUserDetails } from '../actions/userActions';
import { PROJECT_DELETE_SUCCESS } from '../constants/projectConstants';
import ProjectCreateModal from '../components/ProjectCreateModal';

// Helper to calculate progress
const calculateProgress = (tasks) => {
  if (!tasks || tasks.length === 0) return 0;
  const completedTasks = tasks.filter(task => task.status === 'Completed').length;
  return Math.round((completedTasks / tasks.length) * 100);
};

// --- Updated ProjectListItem Component ---
const ProjectListItem = ({ project, userInfo, onDelete }) => {
  const navigate = useNavigate(); // Hook for navigation
  const isOwner = userInfo && project.owner && project.owner._id === userInfo._id;
  const progress = calculateProgress(project.tasks);

  // Handler for the View button click
  const handleViewClick = () => {
    if (project._id) {
      navigate(`/project/${project._id}`);
    } else {
      console.error('Error: Project ID is missing');
    }
  };

  return (
    <div className="project-list-item">
      <div className="project-info">
        {/* Name is still a Link for accessibility/SEO, but you can change this too if needed */}
        <Link to={`/project/${project._id}`} className="project-name-link">
          {project.name}
        </Link>
        <div className="project-metadata-capsules">
          {/* ... metadata capsules ... */}
        </div>
      </div>
      
      <div className="project-progress">
        {/* ... progress bar ... */}
        <div style={{ width: '100%', backgroundColor: '#e0e0e0', borderRadius: '5px' }}>
             <div 
               style={{ 
                 width: `${progress}%`, 
                 backgroundColor: '#4caf50', 
                 height: '10px', 
                 borderRadius: '5px' 
               }} 
             />
        </div>
        <span>{progress}%</span>
      </div>

      <div className="project-footer">
        <div className="project-team-avatars">
          {/* ... team avatars ... */}
        </div>
        <div className="project-actions">
          
          {/* THIS IS THE FIX: Changed from Link to Button */}
          <button 
            className="btn-view-project" 
            onClick={handleViewClick}
            type="button"
          >
            View
          </button>

          {isOwner && (
            <button className="btn-delete-project" onClick={() => onDelete(project._id)}>
              <FaTrash />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------

const OngoingProjectsScreen = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [isModalOpen, setIsModalOpen] = useState(false);

  const userLogin = useSelector((state) => state.userLogin);
  const { userInfo } = userLogin;

  const projectList = useSelector(state => state.projectList);
  const { loading, error, projects } = projectList;

  const projectDelete = useSelector(state => state.projectDelete);
  const { loading: loadingDelete, error: errorDelete, success: successDelete } = projectDelete;

  const projectCreate = useSelector(state => state.projectCreate);
  const { success: successCreate } = projectCreate;

  useEffect(() => {
    if (!userInfo || !userInfo.token || userInfo.token.trim() === '') {
      navigate('/login');
    } else {
      dispatch(getUserDetails('profile'));
      if (successDelete) {
        dispatch({ type: PROJECT_DELETE_SUCCESS });
        dispatch(listProjects());
      } else {
        dispatch(listProjects());
      }
    }
  }, [dispatch, navigate, userInfo, successDelete, successCreate]);

  const deleteHandler = (id) => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      dispatch(deleteProject(id));
    }
  };

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  return (
    <div className="ongoing-projects-page">
      <div className="project-hero-header">
        <div className="project-hero-title-and-action">
            <h1 className="project-detail-title">Ongoing Projects</h1>
            <button className="btn-gradient" onClick={openModal}>
                <FaPlus /> Create Project
            </button>
        </div>
        <p className="project-detail-goal">
            A centralized view of all your active projects. Track progress, manage teams, and stay on top of deadlines.
        </p>
      </div>

      {loadingDelete && <Loader />}
      {errorDelete && <Message variant='danger'>{errorDelete}</Message>}
      
      {loading ? (
        <Loader />
      ) : error ? (
        <Message variant='danger'>{error}</Message>
      ) : (
        <div className="modern-project-list">
          {projects.length === 0 ? (
            <div className="empty-state-container">
                <Message variant='info'>No ongoing projects found. Start by creating one!</Message>
                <button className="btn btn-primary" onClick={openModal}>
                    <FaPlus /> Create Your First Project
                </button>
            </div>
          ) : (
            projects.map((project) => (
              <ProjectListItem
                key={project._id}
                project={project}
                userInfo={userInfo}
                onDelete={deleteHandler}
              />
            ))
          )}
        </div>
      )}
      <ProjectCreateModal isOpen={isModalOpen} onClose={closeModal} />
    </div>
  );
};

export default OngoingProjectsScreen;