import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { FaTrash, FaPlus, FaCalendarAlt, FaUser } from 'react-icons/fa'; 

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

// --- Updated ProjectListItem Component (Fixes Delete Button Visibility) ---
const ProjectListItem = ({ project, userInfo, onDelete }) => {
  const navigate = useNavigate();

  // --- FIX START: Robust Ownership Check ---
  // This handles cases where project.owner is populated (an object) OR just an ID string
  const ownerId = project.owner?._id || project.owner;
  const userId = userInfo?._id;
  
  // We use toString() to ensure we are comparing "String" vs "String"
  // This fixes issues where one might be a MongoDB ObjectId
  const isOwner = userId && ownerId && ownerId.toString() === userId.toString();
  // --- FIX END ---

  const progress = calculateProgress(project.tasks);

  const handleViewClick = () => {
    if (project._id) {
      navigate(`/project/${project._id}`);
    }
  };

  const handleDeleteClick = (e) => {
    e.stopPropagation(); // Prevents clicking the card background
    // Double confirmation
    if (window.confirm(`Are you sure you want to delete project "${project.name}"?`)) {
        onDelete(project._id);
    }
  };

  return (
    <div className="project-list-item">
      <div className="project-info">
        <Link to={`/project/${project._id}`} className="project-name-link">
          {project.name}
        </Link>
        <div className="project-metadata-capsules">
          {project.dueDate && (
            <span className="metadata-capsule">
              <FaCalendarAlt /> Due: {new Date(project.dueDate).toLocaleDateString()}
            </span>
          )}
          {project.owner && (
            <span className="metadata-capsule">
              <FaUser /> {project.owner.name}
            </span>
          )}
           <span className="metadata-capsule">
             {project.status || 'Active'}
           </span>
        </div>
      </div>
      
      <div className="project-progress">
        <div className="progress-bar-container">
           <div 
             className="progress-bar-fill"
             style={{ width: `${progress}%` }} 
           />
        </div>
        <div style={{ fontSize: '0.8rem', marginTop: '5px', textAlign: 'right', color: '#86868B' }}>
            {progress}% Complete
        </div>
      </div>

      <div className="project-footer">
        <div className="project-team-avatars">
           {project.team && project.team.members && project.team.members.slice(0, 3).map(member => (
             <div key={member._id} className="member-avatar" title={member.name}>
                {member.name ? member.name.charAt(0).toUpperCase() : '?'}
             </div>
           ))}
           {project.team && project.team.members && project.team.members.length > 3 && (
              <div className="member-avatar-more">
                +{project.team.members.length - 3}
              </div>
           )}
        </div>
        
        <div className="project-actions">
          <button 
            className="btn-view-project" 
            onClick={handleViewClick}
            type="button"
          >
            View
          </button>

          {/* Conditional Rendering: Only show if user owns the project */}
          {isOwner ? (
            <button 
                className="btn-delete-project" 
                onClick={handleDeleteClick}
                title="Delete Project"
            >
              <FaTrash />
            </button>
          ) : (
            /* Optional: Debugging helper - remove this else block later */
            /* If you don't see the bin, it means isOwner is false. */
            null 
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
      if (!userInfo.name) {
          dispatch(getUserDetails('profile'));
      }
      
      // Reload projects if a delete or create action was successful
      if (successDelete) {
        dispatch({ type: PROJECT_DELETE_SUCCESS }); // Reset success state
      }
      
      dispatch(listProjects());
    }
  }, [dispatch, navigate, userInfo, successDelete, successCreate]);

  // The Handler passed down to the child component
  const deleteHandler = (id) => {
    if (window.confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
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