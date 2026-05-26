import React from 'react';
import { FaTrophy } from 'react-icons/fa';
import './EmptyState.css';

const LeaderboardScreen = () => {
  return (
    <div className="empty-state-page">
      <div className="empty-state-container">
        <div className="empty-state-icon-wrapper">
          <FaTrophy size={48} />
        </div>
        <h2 className="empty-state-heading">Leaderboard Coming Soon</h2>
        <p className="empty-state-subtext">
          Track your progress and compete with others once you join a team.
        </p>
      </div>
    </div>
  );
};

export default LeaderboardScreen;
