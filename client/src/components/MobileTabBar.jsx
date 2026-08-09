import React from 'react';
import { NavLink } from 'react-router-dom';
import { FaHome, FaFolder, FaUsers, FaBrain, FaEllipsisH } from 'react-icons/fa';
import './MobileTabBar.css';

const tabs = [
  { to: '/dashboard', label: 'Home', icon: FaHome, end: true },
  { to: '/projects', label: 'Projects', icon: FaFolder },
  { to: '/teams', label: 'Teams', icon: FaUsers },
  { to: '/skill-sharing', label: 'Skills', icon: FaBrain },
];

const MobileTabBar = ({ onMorePress }) => (
  <nav className="mobile-tab-bar" aria-label="Main navigation">
    {tabs.map(({ to, label, icon: Icon, end }) => (
      <NavLink
        key={to}
        to={to}
        end={end}
        className={({ isActive }) => `mobile-tab-item${isActive ? ' active' : ''}`}
      >
        <Icon className="mobile-tab-icon" aria-hidden />
        <span className="mobile-tab-label">{label}</span>
      </NavLink>
    ))}
    <button type="button" className="mobile-tab-item mobile-tab-more" onClick={onMorePress} aria-label="More options">
      <FaEllipsisH className="mobile-tab-icon" aria-hidden />
      <span className="mobile-tab-label">More</span>
    </button>
  </nav>
);

export default MobileTabBar;
