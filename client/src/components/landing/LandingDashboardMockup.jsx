import React, { useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import {
  FaSearch,
  FaBell,
  FaBriefcase,
  FaClipboardList,
  FaUserFriends,
  FaChartLine,
  FaHome,
  FaFolder,
  FaTasks,
  FaUsers,
  FaCalendarAlt,
  FaComments,
  FaFile,
  FaChartBar,
} from 'react-icons/fa';

const CHART_POINTS = '0,80 40,72 80,68 120,52 160,48 200,40 240,32 280,28 320,20';
const CHART_AREA_PATH = `M0,80 L40,72 L80,68 L120,52 L160,48 L200,40 L240,32 L280,28 L320,20 L320,100 L0,100 Z`;

const sidebarNavItems = [
  { icon: FaHome, label: 'Home' },
  { icon: FaFolder, label: 'Projects' },
  { icon: FaTasks, label: 'Tasks' },
  { icon: FaUsers, label: 'Teams' },
  { icon: FaCalendarAlt, label: 'Calendar' },
  { icon: FaComments, label: 'Messages' },
  { icon: FaFile, label: 'Files' },
  { icon: FaChartBar, label: 'Analytics' },
];

const kpiCards = [
  { label: 'Active Projects', numericValue: 24, prefix: '', suffix: '', trend: '+12%', icon: FaBriefcase, color: 'green' },
  { label: 'Pending Tasks', numericValue: 18, prefix: '', suffix: '', trend: '8%', icon: FaClipboardList, color: 'blue' },
  { label: 'Team Members', numericValue: 6, prefix: '', suffix: '', trend: '2%', icon: FaUserFriends, color: 'purple' },
  { label: 'Team Velocity', numericValue: 12, prefix: '+', suffix: '%', trend: '12%', icon: FaChartLine, color: 'orange' },
];

const recentActivity = [
  { title: 'Design system updated', user: 'Arin', time: '2m ago', color: '#1f4536' },
  { title: 'Marketing plan v2', user: 'Ryan', time: '1h ago', color: '#3b82f6' },
  { title: 'Sprint tasks assigned', user: 'Jonah', time: '3h ago', color: '#8b5cf6' },
  { title: 'API docs refreshed', user: 'Maya', time: 'Yesterday', color: '#f59e0b' },
];

const upcomingEvents = [
  { title: 'Sprint Planning', date: 'Mon, 14 May', time: '10:00 AM', color: '#3b82f6' },
  { title: 'Design Review', date: 'Wed, 15 May', time: '2:30 PM', color: '#1f4536' },
  { title: 'Team Sync', date: 'Fri, 17 May', time: '11:00 AM', color: '#8b5cf6' },
];

const listStagger = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.15 },
  },
};

const listItem = {
  hidden: { opacity: 0, x: -10 },
  show: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.35, ease: [0.2, 0.8, 0.2, 1] },
  },
};

const CountUpValue = ({ value, prefix = '', suffix = '' }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView) return undefined;

    const start = performance.now();
    const duration = 900;
    let frameId = null;

    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - (1 - progress) ** 3;
      setDisplay(Math.round(value * eased));
      if (progress < 1) {
        frameId = requestAnimationFrame(tick);
      } else {
        setDisplay(value);
      }
    };

    frameId = requestAnimationFrame(tick);
    return () => {
      if (frameId) cancelAnimationFrame(frameId);
    };
  }, [inView, value]);

  return (
    <span ref={ref} className="lp-mock-kpi-value">
      {prefix}{display}{suffix}
    </span>
  );
};

const MockSidebar = () => {
  const [activeLabel, setActiveLabel] = useState('Home');

  return (
    <aside className="lp-mock-sidebar">
      <div className="lp-mock-sidebar-brand">
        <span className="lp-mock-logo">C</span>
        <span>Collaborate</span>
      </div>
      <nav className="lp-mock-nav">
        {sidebarNavItems.map((item) => {
          const isActive = activeLabel === item.label;
          return (
            <button
              key={item.label}
              type="button"
              className={`lp-mock-nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setActiveLabel(item.label)}
            >
              {isActive && (
                <motion.span
                  layoutId="lp-mock-nav-pill"
                  className="lp-mock-nav-pill"
                  transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                />
              )}
              <item.icon size={13} className="lp-mock-nav-icon" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
};

const ProjectChart = ({ inView }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    if (!inView) {
      setShowTooltip(false);
      return undefined;
    }
    const timer = window.setTimeout(() => setShowTooltip(true), 850);
    return () => window.clearTimeout(timer);
  }, [inView]);

  return (
    <div className="lp-mock-chart-area">
      <svg className="lp-mock-chart" viewBox="0 0 320 100" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <linearGradient id="lpChartGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(31,69,54,0.25)" />
            <stop offset="100%" stopColor="rgba(31,69,54,0)" />
          </linearGradient>
        </defs>
        <motion.path
          d={CHART_AREA_PATH}
          fill="url(#lpChartGrad)"
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.5, delay: 0.4, ease: 'easeOut' }}
        />
        <motion.polyline
          points={CHART_POINTS}
          fill="none"
          stroke="#1f4536"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0, opacity: 0.6 }}
          animate={inView ? { pathLength: 1, opacity: 1 } : { pathLength: 0, opacity: 0.6 }}
          transition={{ duration: 0.85, ease: 'easeOut', delay: 0.1 }}
        />
      </svg>

      <motion.span
        className="lp-mock-chart-live-dot"
        initial={{ scale: 0, opacity: 0 }}
        animate={inView ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
        transition={{ delay: 0.75, duration: 0.35, ease: 'easeOut' }}
        aria-hidden="true"
      />

      <motion.div
        className="lp-mock-chart-tooltip"
        initial={{ opacity: 0, scale: 0.88, y: 6 }}
        animate={showTooltip ? { opacity: 1, scale: 1, y: 0 } : { opacity: 0, scale: 0.88, y: 6 }}
        transition={{ duration: 0.35, ease: [0.2, 0.8, 0.2, 1] }}
      >
        <strong>72% Progress</strong>
        <span>Wed, 15 May</span>
      </motion.div>
    </div>
  );
};

const LandingDashboardMockup = ({ dashboardRef }) => {
  const chartSectionRef = useRef(null);
  const chartInView = useInView(chartSectionRef, { once: true, amount: 0.35 });

  return (
    <motion.div
      className="lp-dashboard-wrap"
      ref={dashboardRef}
      id="hero-dashboard"
      initial={{ opacity: 0, y: 36 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.7, ease: [0.2, 0.8, 0.2, 1], delay: 0.15 }}
    >
      <div className="lp-dashboard-window">
        <MockSidebar />

        <div className="lp-mock-main">
          <div className="lp-mock-header">
            <div className="lp-mock-greeting">
              <span>Good morning, Arin</span>
              <span className="lp-mock-wave">👋</span>
            </div>
            <div className="lp-mock-search">
              <FaSearch size={12} />
              <span>Search anything...</span>
              <kbd>⌘K</kbd>
            </div>
            <div className="lp-mock-header-actions">
              <button type="button" className="lp-mock-icon-btn" aria-label="Notifications">
                <FaBell size={13} />
              </button>
              <div className="lp-mock-avatar">A</div>
            </div>
          </div>

          <div className="lp-mock-kpi-row">
            {kpiCards.map((kpi, index) => (
              <motion.div
                key={kpi.label}
                className="lp-mock-kpi lp-interactive-card"
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: 0.4, delay: index * 0.08, ease: 'easeOut' }}
                whileHover={{ y: -2 }}
              >
                <div className={`lp-mock-kpi-icon ${kpi.color}`}>
                  <kpi.icon size={13} />
                </div>
                <div className="lp-mock-kpi-body">
                  <CountUpValue
                    value={kpi.numericValue}
                    prefix={kpi.prefix}
                    suffix={kpi.suffix}
                  />
                  <span className="lp-mock-kpi-label">{kpi.label}</span>
                </div>
                <motion.span
                  className={`lp-mock-kpi-trend ${kpi.color}`}
                  initial={{ scale: 1 }}
                  animate={{ scale: [1, 1.08, 1] }}
                  transition={{ duration: 0.5, delay: 0.6 + index * 0.1, ease: 'easeInOut' }}
                >
                  <FaChartLine size={9} /> {kpi.trend}
                </motion.span>
              </motion.div>
            ))}
          </div>

          <div className="lp-mock-content-row">
            <motion.div
              ref={chartSectionRef}
              className="lp-mock-panel lp-mock-chart-panel lp-interactive-card"
              whileHover={{ y: -2 }}
            >
              <div className="lp-mock-panel-head">
                <span>Project Overview</span>
                <span className="lp-mock-chip">This week</span>
              </div>
              <ProjectChart inView={chartInView} />
            </motion.div>

            <motion.div className="lp-mock-panel lp-interactive-card" whileHover={{ y: -2 }}>
              <div className="lp-mock-panel-head">
                <span>Recent Activity</span>
              </div>
              <motion.ul
                className="lp-mock-activity-list"
                variants={listStagger}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, amount: 0.3 }}
              >
                {recentActivity.map((item) => (
                  <motion.li key={item.title} className="lp-mock-activity-item" variants={listItem}>
                    <span
                      className="lp-mock-activity-dot lp-live-indicator"
                      style={{ '--dot-color': item.color }}
                    />
                    <div className="lp-mock-activity-copy">
                      <strong>{item.title}</strong>
                      <span>{item.user} · {item.time}</span>
                    </div>
                  </motion.li>
                ))}
              </motion.ul>
            </motion.div>

            <motion.div className="lp-mock-panel lp-interactive-card" whileHover={{ y: -2 }}>
              <div className="lp-mock-panel-head">
                <span>Upcoming</span>
              </div>
              <motion.ul
                className="lp-mock-upcoming-list"
                variants={listStagger}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, amount: 0.3 }}
              >
                {upcomingEvents.map((item) => (
                  <motion.li key={item.title} className="lp-mock-upcoming-item" variants={listItem}>
                    <span
                      className="lp-mock-upcoming-icon lp-live-indicator"
                      style={{ '--dot-color': item.color, background: item.color }}
                    />
                    <div className="lp-mock-upcoming-copy">
                      <strong>{item.title}</strong>
                      <span>{item.date} · {item.time}</span>
                    </div>
                  </motion.li>
                ))}
              </motion.ul>
            </motion.div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default LandingDashboardMockup;
