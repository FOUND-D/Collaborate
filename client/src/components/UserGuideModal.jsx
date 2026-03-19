import React, { useState } from 'react';
import './UserGuideModal.css';
import { FaTimes, FaBook, FaCheckCircle, FaRocket, FaTasks, FaComments, FaUsers } from 'react-icons/fa';

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
                    <button className="guide-close-btn" onClick={onClose}>
                        <FaTimes />
                    </button>
                </div>

                <div className="user-guide-content">
                    <div className="guide-section welcome-section">
                        <h3>Welcome to Collaborate!</h3>
                        <p>Your all-in-one workspace for seamless team collaboration. Here's how to make the most of it:</p>
                    </div>

                    <div className="guide-grid">
                        <div className="guide-card">
                            <div className="guide-card-icon color-blue">
                                <FaRocket />
                            </div>
                            <h4>Projects</h4>
                            <p>Create and manage projects. Track progress with dynamic bars and organized metadata.</p>
                        </div>

                        <div className="guide-card">
                            <div className="guide-card-icon color-green">
                                <FaTasks />
                            </div>
                            <h4>Tasks</h4>
                            <p>Break down work into manageable tasks. Use the checklist to mark items as complete.</p>
                        </div>

                        <div className="guide-card">
                            <div className="guide-card-icon color-purple">
                                <FaUsers />
                            </div>
                            <h4>Teams</h4>
                            <p>Join or create teams. Collaborate with members and assign roles effortlessly.</p>
                        </div>

                        <div className="guide-card">
                            <div className="guide-card-icon color-orange">
                                <FaComments />
                            </div>
                            <h4>Chat</h4>
                            <p>Real-time messaging. Use the sidebar drawer for quick checks or expand for full focus.</p>
                        </div>
                    </div>

                    <div className="guide-tips">
                        <h4>💡 Pro Tips</h4>
                        <ul>
                            <li><FaCheckCircle /> Click the <strong>Chat</strong> button in the sidebar to open the handy drawer.</li>
                            <li><FaCheckCircle /> Use the <strong>Expand</strong> icon in the chat to go full screen.</li>
                            <li><FaCheckCircle /> Update your profile and tech stack in the <strong>Profile</strong> section.</li>
                        </ul>
                    </div>
                </div>

                <div className="user-guide-footer">
                    <button className="btn-got-it" onClick={onClose}>Got it!</button>
                </div>
            </div>
        </div>
    );
};

export default UserGuideModal;
