import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { FaTrash, FaUsers, FaPlus, FaCalendarAlt, FaUser } from 'react-icons/fa';

import Message from '../components/Message';
import Loader from '../components/Loader';
import { listProjects, deleteProject } from '../actions/projectActions';
import { getUserDetails } from '../actions/userActions'; // Import getUserDetails
import { PROJECT_DELETE_SUCCESS } from '../constants/projectConstants';
import ProjectCreateModal from '../components/ProjectCreateModal';

// Helper to calculate progress
const calculateProgress = (tasks) => {
  if (!tasks || tasks.length === 0) return 0;
  const completedTasks = tasks.filter(task => task.status === 'Completed').length;
  return Math.round((completedTasks / tasks.length) * 100);
};

// --- New ProjectListItem Component ---
const ProjectListItem = ({ project, userInfo, onDelete }) => {
  const isOwner = userInfo && project.owner && project.owner._id === userInfo._id;
  const progress = calculateProgress(project.tasks);

  return (
    <div className="project-list-item">
      <div className="project-info">
        <Link to={`/project/${project._id}`} className="project-name-link">
          {project.name}
        </Link>
        <div className="project-metadata-capsules">
          {project.dueDate && (
            <div className="metadata-capsule">
              <FaCalendarAlt />
              <span>{new Date(project.dueDate).toLocaleDateString()}</span>
            </div>
          )}
          {project.owner && (
            <div className="metadata-capsule">
              <FaUser />
              <span>{project.owner.name}</span>
            </div>
          )}
          {project.team && (
            <div className="metadata-capsule">
              <FaUsers />
              <span>{project.team.name}</span>
            </div>
          )}
        </div>
      </div>
      
      <div className="project-progress">
        <div className="progress-bar-container">
          <div className="progress-bar-fill" style={{ width: `${progress}%` }}></div>
        </div>
      </div>

      <div className="project-footer">
        <div className="project-team-avatars">
          {project.team && project.team.members && project.team.members.slice(0, 3).map((member) => (
            <div key={member._id} className="member-avatar" title={member.name}>
              {member.name.charAt(0).toUpperCase()}
            </div>
          ))}
          {project.team && project.team.members && project.team.members.length > 3 && (
            <div className="member-avatar-more">
              +{project.team.members.length - 3}
            </div>
          )}
        </div>
        <div className="project-actions">
          <Link to={`/project/${project._id}`} className="btn-view-project">
            View
          </Link>
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
      dispatch(getUserDetails('profile')); // Fetch fresh user details
      if (successDelete) {
        dispatch({ type: PROJECT_DELETE_SUCCESS }); // Reset delete status
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