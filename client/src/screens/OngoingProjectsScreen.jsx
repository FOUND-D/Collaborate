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

import ProjectListItem from '../components/ProjectListItem';

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