import React, { useEffect, useState } from 'react';
import './HomeScreen.css';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { FaProjectDiagram, FaUsers, FaMagic, FaArrowRight, FaClipboardList, FaCheckCircle, FaClock } from 'react-icons/fa';
import { listProjects } from '../actions/projectActions';
import { listTasks } from '../actions/taskActions';

const HomeScreen = () => {
  const dispatch = useDispatch();
  const userLogin = useSelector((state) => state.userLogin);
  const { userInfo } = userLogin;

  const projectList = useSelector((state) => state.projectList);
  const { projects } = projectList;

  const taskList = useSelector((state) => state.taskList);
  const { tasks } = taskList;

  // Animation state for numbers
  const [stats, setStats] = useState({ projectCount: 0, taskCount: 0, completionRate: 0 });

  useEffect(() => {
    if (userInfo) {
      dispatch(listProjects());
      dispatch(listTasks());
    }
  }, [dispatch, userInfo]);

  useEffect(() => {
    if (projects && tasks) {
      const totalProjects = projects.length;
      const totalTasks = tasks.length;
      const completedTasks = tasks.filter(t => t.status === 'Completed').length;
      const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      // Simple animation effect could be added here, but for now we set directly
      setStats({
        projectCount: totalProjects,
        taskCount: tasks.filter(t => t.status !== 'Completed').length, // Pending tasks
        completionRate
      });
    }
  }, [projects, tasks]);


  return (
    <div className="home-dashboard-page">
      <div className="dashboard-header">
        <div className="header-content">
          <h1 className="welcome-title">
            Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 18 ? 'Afternoon' : 'Evening'},
            <span className="user-name"> {userInfo ? userInfo.name.split(' ')[0] : 'Guest'}</span>
          </h1>
          <p className="welcome-subtitle">
            Here's what's happening in your workspace today.
          </p>
        </div>
        <div className="header-date">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </div>
      </div>

      {/* Stats Row */}
      <div className="stats-grid">
        <div className="stat-card blue-gradient">
          <div className="stat-icon-wrapper">
            <FaProjectDiagram />
          </div>
          <div className="stat-content">
            <span className="stat-value">{stats.projectCount}</span>
            <span className="stat-label">Active Projects</span>
          </div>
        </div>

        <div className="stat-card purple-gradient">
          <div className="stat-icon-wrapper">
            <FaClipboardList />
          </div>
          <div className="stat-content">
            <span className="stat-value">{stats.taskCount}</span>
            <span className="stat-label">Pending Tasks</span>
          </div>
        </div>

        <div className="stat-card green-gradient">
          <div className="stat-icon-wrapper">
            <FaCheckCircle />
          </div>
          <div className="stat-content">
            <span className="stat-value">{stats.completionRate}%</span>
            <span className="stat-label">Completion Rate</span>
          </div>
        </div>
      </div>

      <h2 className="section-heading">Quick Actions</h2>

      <div className="action-cards-grid">
        <Link to="/projects/ongoing" className="action-card">
          <FaProjectDiagram className="action-card-icon" />
          <h3 className="action-card-title">View Ongoing Projects</h3>
          <p className="action-card-description">
            Jump back into your projects and see what's new.
          </p>
          <span className="action-card-link">
            Go to Projects <FaArrowRight />
          </span>
        </Link>

        <Link to="/teams" className="action-card">
          <FaUsers className="action-card-icon" />
          <h3 className="action-card-title">Manage Your Teams</h3>
          <p className="action-card-description">
            Collaborate with your team members and manage roles.
          </p>
          <span className="action-card-link">
            Go to Teams <FaArrowRight />
          </span>
        </Link>

        {userInfo && (
          <Link to="/project/create" className="action-card ai-card">
            <FaMagic className="action-card-icon" />
            <h3 className="action-card-title">Create Project with AI</h3>
            <p className="action-card-description">
              Let our AI assistant build a project plan for you.
            </p>
            <span className="action-card-link">
              Start Now <FaArrowRight />
            </span>
          </Link>
        )}
      </div>
    </div>
  );
};

export default HomeScreen;
