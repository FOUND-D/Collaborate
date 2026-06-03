import React from 'react';
import { FaTimes } from 'react-icons/fa';
import './GoalModal.css';

const splitGoal = (goal) => {
  if (!goal) return { challenge: '', solution: '' };

  const lowerGoal = goal.toLowerCase();
  const solutionIndex = lowerGoal.indexOf('solution:');
  const challengeIndex = lowerGoal.indexOf('challenge:');

  if (solutionIndex !== -1) {
    let challenge = goal.substring(0, solutionIndex).trim();
    if (challengeIndex !== -1) {
      challenge = challenge.substring(challengeIndex + 10).trim();
    }
    const solution = goal.substring(solutionIndex + 9).trim();
    return { challenge, solution };
  }

  const middle = Math.floor(goal.length / 2);
  const sentenceBoundaries = [...goal.matchAll(/[.!?]\s+/g)].map(m => m.index);

  if (sentenceBoundaries.length > 0) {
    const closest = sentenceBoundaries.reduce((prev, curr) =>
      Math.abs(curr - middle) < Math.abs(prev - middle) ? curr : prev
    );
    const challenge = goal.substring(0, closest + 1).trim();
    const solution = goal.substring(closest + 1).trim();
    return { challenge, solution };
  }

  const spaces = [...goal.matchAll(/\s+/g)].map(m => m.index);
  if (spaces.length > 0) {
    const closest = spaces.reduce((prev, curr) =>
      Math.abs(curr - middle) < Math.abs(prev - middle) ? curr : prev
    );
    const challenge = goal.substring(0, closest).trim();
    const solution = goal.substring(closest).trim();
    return { challenge, solution };
  }

  return {
    challenge: goal.substring(0, middle),
    solution: goal.substring(middle)
  };
};

const GoalModal = ({ isOpen, onClose, goal }) => {
  if (!isOpen) return null;

  const { challenge, solution } = splitGoal(goal);

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
                {challenge}
              </p>
            </div>
            <div className="project-description-column">
              <h3>The Solution</h3>
              <p className="project-description-text">
                {solution}
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
