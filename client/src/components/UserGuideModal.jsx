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
  FaExchangeAlt,
  FaVideo,
  FaFolderOpen,
  FaMedal,
  FaStar,
  FaShieldAlt,
} from 'react-icons/fa';
import { useSelector } from 'react-redux';

const UserGuideModal = ({ isOpen, onClose }) => {
  const userInfo = useSelector((state) => state.userLogin?.userInfo);

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

            <div className="guide-card guide-step-card">
              <div className="guide-card-icon color-green">
                <FaExchangeAlt />
              </div>
              <div className="guide-step-number">8</div>
              <h4>Browse the Exchange Board</h4>
              <p>Post skill-sharing listings or browse offers from others. Book sessions and use credits to learn new skills.</p>
            </div>

            <div className="guide-card guide-step-card">
              <div className="guide-card-icon color-orange">
                <FaVideo />
              </div>
              <div className="guide-step-number">9</div>
              <h4>Track your Sessions</h4>
              <p>View all your booked sessions as a teacher or learner. Check status and join when it's time.</p>
            </div>

            <div className="guide-card guide-step-card">
              <div className="guide-card-icon color-blue">
                <FaFolderOpen />
              </div>
              <div className="guide-step-number">10</div>
              <h4>Access shared Resources</h4>
              <p>Upload, browse, and download documents and materials shared within your workspace.</p>
            </div>

            <div className="guide-card guide-step-card">
              <div className="guide-card-icon color-orange">
                <FaMedal />
              </div>
              <div className="guide-step-number">11</div>
              <h4>Check the Leaderboard</h4>
              <p>See how you rank against other developers. Connect both GitHub and LeetCode to appear on the board.</p>
            </div>

            <div className="guide-card guide-step-card">
              <div className="guide-card-icon color-purple">
                <FaStar />
              </div>
              <div className="guide-step-number">12</div>
              <h4>View your Ratings</h4>
              <p>See all peer ratings you've received and given, along with your average score.</p>
            </div>

            {userInfo?.role === 'admin' && (
              <div className="guide-card guide-step-card">
                <div className="guide-card-icon color-blue">
                  <FaShieldAlt />
                </div>
                <div className="guide-step-number">13</div>
                <h4>Admin Dashboard & Complaints</h4>
                <p>Manage users, view platform stats, and review complaints. Only visible to admins.</p>
              </div>
            )}
          </div>

          <div className="guide-tips">
            <h4>Quick toggle guide</h4>
            <ul>
              <li>{(typeof FaCheckCircle !== 'undefined') ? <FaCheckCircle /> : <svg width="14" height="14" viewBox="0 0 24 24" style={{ width: '0.9rem', height: '0.9rem', verticalAlign: 'text-bottom' }} xmlns="http://www.w3.org/2000/svg"><path fill="currentColor" d="M12 2a10 10 0 1 0 .001 20.001A10 10 0 0 0 12 2zm-1 14.5l-5-5 1.41-1.41L11 13.67l6.59-6.59L19 8.5l-8 8z"/></svg>} Click <strong>Chat</strong> in the sidebar to open the docked chat panel.</li>
                            <li>{(typeof FaCheckCircle !== 'undefined') ? <FaCheckCircle /> : <svg width="14" height="14" viewBox="0 0 24 24" style={{ width: '0.9rem', height: '0.9rem', verticalAlign: 'text-bottom' }} xmlns="http://www.w3.org/2000/svg"><path fill="currentColor" d="M12 2a10 10 0 1 0 .001 20.001A10 10 0 0 0 12 2zm-1 14.5l-5-5 1.41-1.41L11 13.67l6.59-6.59L19 8.5l-8 8z"/></svg>} Use the <strong>Expand</strong> icon in chat to open the full-screen chat view.</li>
                            <li>{(typeof FaCheckCircle !== 'undefined') ? <FaCheckCircle /> : <svg width="14" height="14" viewBox="0 0 24 24" style={{ width: '0.9rem', height: '0.9rem', verticalAlign: 'text-bottom' }} xmlns="http://www.w3.org/2000/svg"><path fill="currentColor" d="M12 2a10 10 0 1 0 .001 20.001A10 10 0 0 0 12 2zm-1 14.5l-5-5 1.41-1.41L11 13.67l6.59-6.59L19 8.5l-8 8z"/></svg>} On mobile, use the sidebar menu button to show or hide the workspace navigation.</li>
                            <li>{(typeof FaCheckCircle !== 'undefined') ? <FaCheckCircle /> : <svg width="14" height="14" viewBox="0 0 24 24" style={{ width: '0.9rem', height: '0.9rem', verticalAlign: 'text-bottom' }} xmlns="http://www.w3.org/2000/svg"><path fill="currentColor" d="M12 2a10 10 0 1 0 .001 20.001A10 10 0 0 0 12 2zm-1 14.5l-5-5 1.41-1.41L11 13.67l6.59-6.59L19 8.5l-8 8z"/></svg>} Open a team to start a meeting, then use the meeting controls for camera, mic, and screen share.</li>
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
