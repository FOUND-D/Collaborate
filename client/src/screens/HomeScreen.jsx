import React from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { FaProjectDiagram, FaUsers, FaMagic, FaArrowRight } from 'react-icons/fa';

const HomeScreen = () => {
  const userLogin = useSelector((state) => state.userLogin);
  const { userInfo } = userLogin;

  return (
    <div className="home-dashboard-page">
      <div className="project-hero-header text-center">
        <h1 className="project-detail-title">Welcome back, {userInfo ? userInfo.name : 'Guest'}!</h1>
        <p className="project-detail-goal">
          Ready to make progress? Here’s your dashboard.
        </p>
      </div>

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
