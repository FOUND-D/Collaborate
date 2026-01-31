import React from 'react';
import { FaCommentDots } from 'react-icons/fa';
import './LeftSidebar.css';

const LeftSidebar = ({ onToggleChat }) => {
  return (
    <div className="left-sidebar">
      <div className="sidebar-icons">
        <button className="sidebar-icon-btn" onClick={onToggleChat}>
          <FaCommentDots />
          <span>Chat</span>
        </button>
        {/* Add other sidebar icons here in the future */}
      </div>
    </div>
  );
};

export default LeftSidebar;
