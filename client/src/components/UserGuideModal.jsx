import React, { useState, useMemo } from 'react';
import './UserGuideModal.css';
import {
  FaTimes,
  FaBook,
  FaCompass,
  FaUsers,
  FaComments,
  FaExchangeAlt,
  FaFolderOpen,
  FaBell,
  FaUserCog,
  FaChalkboardTeacher,
  FaTools,
  FaQuestionCircle,
  FaSearch
} from 'react-icons/fa';

const helpSections = [
  {
    title: 'Getting started',
    icon: FaBook,
    body: "Welcome to Collaborate! This guide will help you understand the basics of the platform. Here, you'll find everything you need to connect with your team and manage your work."
  },
  {
    title: 'Finding your way around',
    icon: FaCompass,
    body: "Use the sidebar on the left to navigate between different areas like your dashboard, projects, and teams. The dashboard gives you a high-level overview of your recent activity and tasks."
  },
  {
    title: 'Working with teams and projects',
    icon: FaUsers,
    body: "Create teams to group people working together, then build projects within those teams. You can assign tasks, track progress, and run video meetings directly from a team's page."
  },
  {
    title: 'Chat',
    icon: FaComments,
    body: "Communicate with your team in real time. You can use the docked chat panel for quick messages or expand it for a full-screen view during longer conversations."
  },
  {
    title: 'The skill exchange',
    icon: FaExchangeAlt,
    body: "The skill exchange lets you teach and learn from others.\n\n• Setting up your skills: Add what you know and want to learn to your profile.\n• Browsing the exchange board: Look for available offers or post your own requests.\n• Booking a session: Spend credits to schedule time with a peer.\n• During and after a session: Meet over video and exchange feedback.\n• Credits: Earn credits by teaching, spend them to learn.\n• Ratings and badges: Give ratings after sessions and earn badges for participation.\n• Leaderboard: See how your contributions compare against others."
  },
  {
    title: 'Resources',
    icon: FaFolderOpen,
    body: "The resources section acts as a shared library. Here you can upload, organize, and download documents, notes, and other materials shared by your workspace."
  },
  {
    title: 'Notifications',
    icon: FaBell,
    body: "Stay updated on what's happening. You'll receive alerts for new messages, task assignments, upcoming sessions, and important team updates."
  },
  {
    title: 'Your profile and settings',
    icon: FaUserCog,
    body: "Your profile showcases your skills, connected accounts, and your achievements. Use settings to manage your preferences, timezone, and notifications."
  },
  {
    title: 'Faculty extras',
    icon: FaChalkboardTeacher,
    body: "Faculty members get a verified badge and additional permissions to endorse skills. These endorsements help build trust and highlight expertise on the platform."
  },
  {
    title: 'A note on features still on the way',
    icon: FaTools,
    body: "We're constantly improving Collaborate! Features like the automated skill directory and public portfolio pages are currently in preview mode and will be fully operational in a future update."
  },
  {
    title: 'Questions',
    icon: FaQuestionCircle,
    body: "If you have administrative questions, please reach out to your organisation admin. For technical issues or bugs, use the feedback option found in your Settings."
  }
];

const colorClasses = ['color-blue', 'color-green', 'color-purple', 'color-orange'];

const UserGuideModal = ({ isOpen, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);

  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return helpSections;
    const query = searchQuery.toLowerCase();
    return helpSections.filter(section =>
      section.title.toLowerCase().includes(query) ||
      section.body.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  // When search changes, reset active index to the first available match
  React.useEffect(() => {
    setActiveIndex(0);
  }, [searchQuery]);

  if (!isOpen) return null;

  const activeSection = filteredSections[activeIndex];

  return (
    <div className="user-guide-overlay" onClick={onClose}>
      <div className="user-guide-container" onClick={(e) => e.stopPropagation()}>
        <div className="user-guide-header">
          <div className="guide-title">
            <FaBook className="guide-icon-main" />
            <h2>Help Center</h2>
          </div>
          <button className="guide-close-btn" onClick={onClose} type="button">
            <FaTimes />
          </button>
        </div>

        <div className="user-guide-content">
          <div className="guide-search-wrapper">
            <FaSearch className="guide-search-icon" />
            <input
              type="text"
              className="guide-search-input"
              placeholder="Search help topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="guide-two-pane">
            <div className="guide-sidebar">
              {filteredSections.length > 0 ? (
                filteredSections.map((section, idx) => {
                  const Icon = section.icon;
                  const colorClass = colorClasses[helpSections.indexOf(section) % colorClasses.length];
                  const isActive = idx === activeIndex;
                  return (
                    <button
                      key={section.title}
                      className={`guide-nav-item ${isActive ? 'active' : ''}`}
                      onClick={() => setActiveIndex(idx)}
                    >
                      <div className={`guide-nav-icon ${colorClass}`}>
                        <Icon />
                      </div>
                      <span className="guide-nav-title">{section.title}</span>
                    </button>
                  );
                })
              ) : (
                <div className="guide-no-results">No topics found.</div>
              )}
            </div>

            <div className="guide-detail-pane">
              {activeSection && (
                <div className="guide-detail-content">
                  <div className={`guide-detail-icon-wrap ${colorClasses[helpSections.indexOf(activeSection) % colorClasses.length]}`}>
                    <activeSection.icon />
                  </div>
                  <h3>{activeSection.title}</h3>
                  <div className="guide-detail-body">
                    {activeSection.body.split('\n').map((paragraph, i) => (
                      <p key={i}>{paragraph}</p>
                    ))}
                  </div>
                </div>
              )}
            </div>
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
