import React from 'react';
import { FaBook } from 'react-icons/fa';
import './EmptyState.css';

const ResourcesScreen = () => {
  return (
    <div className="empty-state-page">
      <div className="empty-state-container">
        <div className="empty-state-icon-wrapper">
          <FaBook size={48} />
        </div>
        <h2 className="empty-state-heading">No Resources Available</h2>
        <p className="empty-state-subtext">
          Resources and documentation will be available here soon.
        </p>
      </div>
    </div>
  );
};

export default ResourcesScreen;
