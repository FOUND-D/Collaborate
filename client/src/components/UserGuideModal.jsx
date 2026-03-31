import React from 'react';
import './UserGuideModal.css';
import {
  FaTimes,
  FaBook,
  FaCheckCircle,
  FaTachometerAlt,
  FaFolder,
  FaTasks,
  FaComments,
  FaUsers,
  FaCog,
  FaBars,
} from 'react-icons/fa';

const UserGuideModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="user-guide-overlay" onClick={onClose}>
      <div className="user-guide-container" onClick={(e) => e.stopPropagation()}>
        <div className="user-guide-header">
          <div className="guide-title">
            <FaBook className="guide-icon-main" />
            <h2>User Guide</h2>
          </div>
          <button className="guide-close-btn" onClick={onClose} type="button">
            <FaTimes />
          </button>
        </div>

        <div className="user-guide-content">
          <div className="guide-section welcome-section">
            <h3>How to move around Collaborate</h3>
            <p>
              Use the sidebar as your map. The steps below show you how to switch between pages and use the main features
              without changing where anything sits on the screen.
            </p>
          </div>

          <div className="guide-grid">
            <div className="guide-card guide-step-card">
              <div className="guide-card-icon color-blue">
                <FaBars />
              </div>
              <div className="guide-step-number">1</div>
              <h4>Open or collapse the sidebar</h4>
              <p>Use the top-left toggle to expand the workspace menu or collapse it when you need more room.</p>
            </div>

            <div className="guide-card guide-step-card">
              <div className="guide-card-icon color-blue">
                <FaTachometerAlt />
              </div>
              <div className="guide-step-number">2</div>
              <h4>Start from the dashboard</h4>
              <p>Dashboard shows your workspace summary, recent activity, and the quickest way back into daily work.</p>
            </div>

            <div className="guide-card guide-step-card">
              <div className="guide-card-icon color-green">
                <FaFolder />
              </div>
              <div className="guide-step-number">3</div>
              <h4>Open Projects to plan work</h4>
              <p>Create projects, track progress, and open a project to manage its tasks and goal details.</p>
            </div>

            <div className="guide-card guide-step-card">
              <div className="guide-card-icon color-green">
                <FaTasks />
              </div>
              <div className="guide-step-number">4</div>
              <h4>Use Tasks to manage action items</h4>
              <p>Add tasks, edit them, filter by status, and mark them complete as work moves forward.</p>
            </div>

            <div className="guide-card guide-step-card">
              <div className="guide-card-icon color-purple">
                <FaUsers />
              </div>
              <div className="guide-step-number">5</div>
              <h4>Go to Teams for collaboration</h4>
              <p>Invite teammates, check team details, and start or join meetings from the team page.</p>
            </div>

            <div className="guide-card guide-step-card">
              <div className="guide-card-icon color-orange">
                <FaComments />
              </div>
              <div className="guide-step-number">6</div>
              <h4>Switch into Chat</h4>
              <p>Use the chat sidebar to pick a team or member, then expand the chat if you want a full-screen view.</p>
            </div>

            <div className="guide-card guide-step-card">
              <div className="guide-card-icon color-purple">
                <FaCog />
              </div>
              <div className="guide-step-number">7</div>
              <h4>Finish in Profile, Settings, and Organisations</h4>
              <p>Update your profile, manage preferences, and move between organisations from the account section.</p>
            </div>
          </div>

          <div className="guide-tips">
            <h4>Quick toggle guide</h4>
            <ul>
              <li><FaCheckCircle /> Click <strong>Chat</strong> in the sidebar to open the docked chat panel.</li>
              <li><FaCheckCircle /> Use the <strong>Expand</strong> icon in chat to open the full-screen chat view.</li>
              <li><FaCheckCircle /> On mobile, use the sidebar menu button to show or hide the workspace navigation.</li>
              <li><FaCheckCircle /> Open a team to start a meeting, then use the meeting controls for camera, mic, and screen share.</li>
            </ul>
          </div>
        </div>

        <div className="user-guide-footer">
          <button className="btn-got-it" onClick={onClose} type="button">Got it!</button>
        </div>
      </div>
    </div>
  );
};

export default UserGuideModal;
