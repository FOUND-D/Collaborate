import React from 'react';
import { motion } from 'framer-motion';
import { FaBrain, FaSearch, FaUserAlt, FaComments } from 'react-icons/fa';
import './SkillSharingPlaceholderScreen.css';

const benefits = [
  {
    icon: <FaSearch />,
    title: 'Browse Skills Directly',
    description: 'Students and team members can view directories grouped by skills to find peers with specific knowledge stacks.',
  },
  {
    icon: <FaUserAlt />,
    title: 'Profile Insights',
    description: 'Open any user\'s profile directly to inspect their complete skill levels, endorsements, and past collaborations.',
  },
  {
    icon: <FaComments />,
    title: 'Instant Messaging & Chat',
    description: 'Communicate and kick off project discussions instantly inside the application by messaging direct contacts.',
  },
  {
    icon: <FaBrain />,
    title: 'Smart Peer Matching',
    description: 'Connect automatically with mentors who teach what you want to learn, and learners looking for your skills.',
  },
];

const SkillSharingPlaceholderScreen = () => {
  return (
    <div className="skill-sharing-placeholder-page">
      <motion.div 
        className="skill-sharing-placeholder-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <div className="skill-sharing-header">
          <div className="skill-sharing-badge">
            <span className="skill-sharing-badge-dot" />
            Coming Soon · Currently in Works
          </div>
          <h1 className="skill-sharing-title">Skill-Sharing & Matchmaking</h1>
          <p className="skill-sharing-subtitle">
            Find the right collaborators, share your technical stack, and match with learners or mentors across your organization.
          </p>
        </div>

        <div className="skill-sharing-benefits-grid">
          {benefits.map((b, idx) => (
            <motion.div 
              key={idx}
              className="benefit-card"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: idx * 0.1 }}
            >
              <div className="benefit-icon-wrapper">
                {b.icon}
              </div>
              <h3>{b.title}</h3>
              <p>{b.description}</p>
            </motion.div>
          ))}
        </div>

        <div className="skill-sharing-footer">
          Backend API and database services are <span>fully developed and integrated</span>. Frontend interface is coming soon.
        </div>
      </motion.div>
    </div>
  );
};

export default SkillSharingPlaceholderScreen;
