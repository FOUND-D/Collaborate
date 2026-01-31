import React from 'react';
import { FaTimes } from 'react-icons/fa';
import './GoalModal.css';

const GoalModal = ({ isOpen, onClose, goal }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Project Goal</h2>
          <button className="modal-close-btn" onClick={onClose}>
            <FaTimes />
          </button>
        </div>
        <div className="modal-body">
          <div className="project-description-container">
            <div className="project-description-column">
              <h3>The Challenge</h3>
              <p className="project-description-text">
                {goal.substring(0, goal.length / 2)}
              </p>
            </div>
            <div className="project-description-column">
              <h3>The Solution</h3>
              <p className="project-description-text">
                {goal.substring(goal.length / 2)}
              </p>
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default GoalModal;
