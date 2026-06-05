import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaMoon, FaSun } from 'react-icons/fa';
import { useTheme } from '../context/ThemeContext';
import './LandingPage.css';

const navItems = [
  { label: 'Product', href: '#product' },
  { label: 'Solutions', href: '#solutions' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'Customers', href: '#customers' },
];

const avatars = ['AL', 'MK', 'JT', 'RS', 'PN'];

const statConfig = [
  { label: 'Active Projects', value: 24, prefix: '', suffix: '' },
  { label: 'Pending Tasks', value: 18, prefix: '', suffix: '' },
  { label: 'Team Velocity', value: 12, prefix: '+', suffix: '%' },
];

const AIPlanningIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
  </svg>
);

const TeamMgmtIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const TaskExecIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 11 12 14 22 4" />
    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
  </svg>
);

const RealtimeChatIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

const MeetingsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m22 8-6 4 6 4V8Z" />
    <rect width="14" height="12" x="2" y="6" rx="2" ry="2" />
  </svg>
);

const OrgComplianceIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

const featureCards = [
  {
    title: 'AI Project Planning',
    description: 'Turn a rough brief into a structured roadmap with tasks, milestones, and delivery momentum in minutes.',
    icon: AIPlanningIcon,
  },
  {
    title: 'Team Management',
    description: 'Create organisations, manage teams, assign roles, and keep collaboration structured as the workspace grows.',
    icon: TeamMgmtIcon,
  },
  {
    title: 'Task Execution',
    description: 'Move from planning to shipping with task ownership, progress visibility, and live execution context in one view.',
    icon: TaskExecIcon,
  },
  {
    title: 'Realtime Chat',
    description: 'Discuss work where it happens instead of scattering decisions across disconnected communication tools.',
    icon: RealtimeChatIcon,
  },
  {
    title: 'Meetings & Presence',
    description: 'Run browser-based team meetings with live room presence so standups and reviews stay inside the product.',
    icon: MeetingsIcon,
  },
  {
    title: 'Org Compliance',
    description: 'Add member onboarding, role controls, and compliance rules for teams that need more than a lightweight task app.',
    icon: OrgComplianceIcon,
  },
];

const capabilityRows = [
  {
    eyebrow: 'Plan',
    title: 'From idea to execution without switching tools',
    body: 'Collaborate combines AI-assisted planning, project creation, tasks, messaging, and meetings into one operating layer for delivery.',
    bullets: ['AI-generated project roadmaps', 'Project and team-linked task structure', 'Unified workspace for planning and execution'],
  },
  {
    eyebrow: 'Operate',
    title: 'Built for teams, organisations, and role-aware workflows',
    body: 'The product scales from a single team to an organisation with member management, permissions, team assignment, and project ownership.',
    bullets: ['Organisation and team hierarchy', 'Role-aware member controls', 'Projects scoped cleanly to teams and orgs'],
  },
  {
    eyebrow: 'Ship',
    title: 'Keep momentum visible across the whole workspace',
    body: 'Track active work, pending tasks, and delivery velocity while keeping communication and accountability tied to the project itself.',
    bullets: ['Live status visibility', 'Progress and velocity cues', 'Collaboration tied directly to workstreams'],
  },
];

const workflowSteps = [
  {
    number: '01',
    title: 'Workspace Setup',
    description: 'Start with an organisation, spin up teams, and manage members with role permissions.',
  },
  {
    number: '02',
    title: 'AI Generated Roadmap',
    description: 'Describe your goals in natural language and let AI compile a structured project roadmap.',
  },
  {
    number: '03',
    title: 'Live Execution',
    description: 'Manage tasks, chat in-context, meet live, and track delivery velocity in one loop.',
  },
];

const CountUpStat = ({ label, value, prefix = '', suffix = '' }) => {
  const ref = useRef(null);
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;

    let frameId = null;
    let started = false;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting || started) return;
          started = true;
          const start = performance.now();
          const duration = 1200;

          const tick = (now) => {
            const progress = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setDisplayValue(Math.round(value * eased));

            if (progress < 1) {
              frameId = window.requestAnimationFrame(tick);
            } else {
              setDisplayValue(value);
            }
          };

          frameId = window.requestAnimationFrame(tick);
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.45 }
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
      if (frameId) window.cancelAnimationFrame(frameId);
    };
  }, [value]);

  return (
    <article className="lp-stat-card" ref={ref}>
      <div className="lp-stat-label">{label}</div>
      <div className="lp-stat-value">
        {prefix}
        {displayValue}
        {suffix}
      </div>
    </article>
  );
};

const WorkspaceIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="9" rx="1" />
    <rect x="14" y="3" width="7" height="5" rx="1" />
    <rect x="14" y="12" width="7" height="9" rx="1" />
    <rect x="3" y="16" width="7" height="5" rx="1" />
  </svg>
);

const RoadmapIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
    <path d="M5 3v4M3 5h4M19 17v4M17 19h4" opacity="0.6" />
  </svg>
);

const DeliveryIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7Z" />
  </svg>
);

const renderDashboardMockup = (activeStep) => {
  switch (activeStep) {
    case 0: // Workspace Setup
      return (
        <div className="lp-interactive-mockup mockup-workspace animate-fade-in">
          <div className="lp-mockup-header-row">
            <span className="lp-mockup-tag">Workspace Settings</span>
            <span className="lp-mockup-badge">Owner: Ryan (Lead)</span>
          </div>
          <div className="lp-mockup-workspace-content">
            <div className="lp-mockup-team-section">
              <h4>Active Members</h4>
              <div className="lp-mockup-avatar-list">
                <div className="lp-mockup-avatar-item">
                  <span className="lp-mockup-avatar-circle gold">RS</span>
                  <div className="lp-mockup-avatar-info">
                    <strong>Ryan Smith</strong>
                    <span>Product Lead</span>
                  </div>
                </div>
                <div className="lp-mockup-avatar-item">
                  <span className="lp-mockup-avatar-circle">PN</span>
                  <div className="lp-mockup-avatar-info">
                    <strong>Patel Nitin</strong>
                    <span>Lead Designer</span>
                  </div>
                </div>
                <div className="lp-mockup-avatar-item">
                  <span className="lp-mockup-avatar-circle">AL</span>
                  <div className="lp-mockup-avatar-info">
                    <strong>Alex Lee</strong>
                    <span>Frontend Dev</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="lp-mockup-channels-section">
              <h4>Team Channels</h4>
              <ul className="lp-mockup-channel-list">
                <li className="active"># announcements</li>
                <li># engineering</li>
                <li># design-sync</li>
                <li># general</li>
              </ul>
            </div>
          </div>
        </div>
      );
    case 1: // AI Generated Roadmap
      return (
        <div className="lp-interactive-mockup mockup-roadmap animate-fade-in">
          <div className="lp-mockup-ai-bar">
            <span className="lp-mockup-sparkle">✨</span>
            <div className="lp-mockup-prompt-text">
              <span>Goal:</span> "Create a WebRTC meeting app with live room presence in 3 weeks"
            </div>
          </div>
          <div className="lp-mockup-roadmap-content">
            <div className="lp-roadmap-timeline-header">
              <span>Roadmap Timeline</span>
              <span className="lp-roadmap-time">June 2026</span>
            </div>
            <div className="lp-roadmap-item done">
              <div className="lp-roadmap-item-meta">
                <span className="lp-roadmap-dot done" />
                <strong>Phase 1: Signaling Setup</strong>
              </div>
              <div className="lp-roadmap-bar"><span style={{ width: '100%' }} /></div>
            </div>
            <div className="lp-roadmap-item active">
              <div className="lp-roadmap-item-meta">
                <span className="lp-roadmap-dot active" />
                <strong>Phase 2: WebRTC Signaling & Rooms</strong>
              </div>
              <div className="lp-roadmap-bar"><span style={{ width: '75%' }} /></div>
            </div>
            <div className="lp-roadmap-item pending">
              <div className="lp-roadmap-item-meta">
                <span className="lp-roadmap-dot pending" />
                <strong>Phase 3: Screen Share & Chat</strong>
              </div>
              <div className="lp-roadmap-bar"><span style={{ width: '20%' }} /></div>
            </div>
          </div>
        </div>
      );
    case 2: // Live Delivery
    default:
      return (
        <div className="lp-interactive-mockup mockup-delivery animate-fade-in">
          <div className="lp-mockup-split-layout">
            <div className="lp-mockup-tasks">
              <h4>Priority Queue</h4>
              <div className="lp-mockup-task-item">
                <span className="lp-mockup-task-check done" />
                <div className="lp-mockup-task-details">
                  <strong>Finalize onboarding flow</strong>
                  <span>Due Today • Product</span>
                </div>
                <span className="lp-mockup-task-pill in-review">In review</span>
              </div>
              <div className="lp-mockup-task-item">
                <span className="lp-mockup-task-check" />
                <div className="lp-mockup-task-details">
                  <strong>Verify WebRTC ICE candidates</strong>
                  <span>Due Tomorrow • Dev</span>
                </div>
                <span className="lp-mockup-task-pill ready">Ready</span>
              </div>
            </div>
            
            <div className="lp-mockup-chat-bubble">
              <div className="lp-chat-header">
                <span className="lp-chat-title"># engineering</span>
              </div>
              <div className="lp-chat-messages">
                <div className="lp-chat-msg">
                  <span className="lp-msg-avatar">AL</span>
                  <div className="lp-msg-content">
                    <strong>Alex Lee</strong>
                    <p>ICE candidate gathering works on iOS/Safari now!</p>
                  </div>
                </div>
                <div className="lp-chat-msg ai">
                  <span className="lp-msg-avatar ai">✨</span>
                  <div className="lp-msg-content">
                    <strong>AI Copilot</strong>
                    <p>Task "Verify WebRTC ICE candidates" updated to Ready.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
  }
};

const renderPlanGraphic = () => (
  <div className="lp-capability-graphic plan-graphic animate-fade-in">
    <div className="lp-graphic-window-header">
      <span className="lp-window-dot" />
      <span className="lp-window-dot" />
      <span className="lp-window-dot" />
      <span className="lp-window-title-small">AI Planner Panel</span>
    </div>
    <div className="lp-graphic-window-body">
      <div className="lp-graphic-ai-prompt">
        <span className="sparkle">✨</span>
        <p>Goal: Build authentication and user profiles in 1 week</p>
      </div>
      <div className="lp-graphic-roadmap-bars">
        <div className="roadmap-bar-item">
          <span className="bar-label">Signaling Setup</span>
          <div className="bar-track done"><span style={{ width: '100%' }} /></div>
        </div>
        <div className="roadmap-bar-item">
          <span className="bar-label">User Schema Design</span>
          <div className="bar-track active"><span style={{ width: '60%' }} /></div>
        </div>
        <div className="roadmap-bar-item">
          <span className="bar-label">JWT Token Routing</span>
          <div className="bar-track pending"><span style={{ width: '0%' }} /></div>
        </div>
      </div>
    </div>
  </div>
);

const renderOperateGraphic = () => (
  <div className="lp-capability-graphic operate-graphic animate-fade-in">
    <div className="lp-graphic-window-header">
      <span className="lp-window-dot" />
      <span className="lp-window-dot" />
      <span className="lp-window-dot" />
      <span className="lp-window-title-small">Join Requests</span>
    </div>
    <div className="lp-graphic-window-body">
      <div className="lp-graphic-request-card">
        <div className="request-user-info">
          <span className="user-avatar">AL</span>
          <div className="user-meta">
            <strong>Alex Lee</strong>
            <span>Role: Frontend Developer</span>
          </div>
        </div>
        <div className="request-actions">
          <button type="button" className="approve-btn">Approve</button>
          <button type="button" className="reject-btn">Reject</button>
        </div>
      </div>
      <div className="lp-graphic-team-members">
        <div className="member-avatar-row">
          <span className="avatar-chip">RS</span>
          <span className="avatar-chip">PN</span>
          <span className="avatar-chip text">+3</span>
        </div>
        <span className="member-total">5 Active Members</span>
      </div>
    </div>
  </div>
);

const renderShipGraphic = () => (
  <div className="lp-capability-graphic ship-graphic animate-fade-in">
    <div className="lp-graphic-window-header">
      <span className="lp-window-dot" />
      <span className="lp-window-dot" />
      <span className="lp-window-dot" />
      <span className="lp-window-title-small">Live Sync Room #engineering</span>
    </div>
    <div className="lp-graphic-window-body">
      <div className="lp-meeting-grid">
        <div className="video-card active-speaker">
          <span className="video-avatar">RS</span>
          <span className="video-name">Ryan (Speaking)</span>
          <span className="voice-indicator"><span></span><span></span><span></span></span>
        </div>
        <div className="video-card">
          <span className="video-avatar">PN</span>
          <span className="video-name">Patel</span>
        </div>
      </div>
      <div className="lp-meeting-controls">
        <span className="control-icon mic-on">🎤</span>
        <span className="control-icon cam-on">📹</span>
        <span className="control-icon share-active">🖥️</span>
        <span className="control-icon end-call">❌</span>
      </div>
    </div>
  </div>
);

const LandingPage = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const stats = useMemo(() => statConfig, []);
  const { theme, toggleTheme } = useTheme();

  const [activeStep, setActiveStep] = useState(0);
  const [mouseCoords, setMouseCoords] = useState({ x: -200, y: -200 });
  const [cursorVisible, setCursorVisible] = useState(false);
  const [workflowVisible, setWorkflowVisible] = useState(false);
  const workflowRef = useRef(null);

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMouseCoords({ x: e.clientX, y: e.clientY });
      if (!cursorVisible) setCursorVisible(true);
    };
    const handleMouseLeave = () => {
      setCursorVisible(false);
    };
    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [cursorVisible]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setWorkflowVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.15 }
    );
    const currentRef = workflowRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }
    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, []);

  const scrollToMockup = () => {
    document.getElementById('hero-dashboard')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  return (
    <div className="landing-page premium-landing">
      <header className="lp-navbar lp-fade-up" style={{ '--delay': '0ms' }}>
        <div className="lp-container">
          <div className="lp-navbar-inner">
            <Link to="/" className="lp-brand" onClick={() => setMenuOpen(false)}>
              <span className="lp-brand-mark" />
              <span className="lp-brand-text">Collaborate</span>
            </Link>

            <nav className="lp-nav-desktop" aria-label="Primary">
              {navItems.map((item) => (
                <a key={item.label} href={item.href} className="lp-nav-link">
                  {item.label}
                </a>
              ))}
            </nav>

            <div className="lp-nav-actions">
              <button
                type="button"
                className="lp-theme-toggle"
                onClick={toggleTheme}
                aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
              >
                {theme === 'dark' ? <FaSun size={14} /> : <FaMoon size={14} />}
                <span>{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
              </button>
              <Link to="/login" className="lp-login-btn">Log In</Link>
              <Link to="/register" className="lp-signup-btn">Get Started</Link>
            </div>

            <button
              type="button"
              className={`lp-menu-toggle ${menuOpen ? 'open' : ''}`}
              aria-label="Toggle navigation"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((open) => !open)}
            >
              <span />
            </button>
          </div>

          <div className={`lp-mobile-panel ${menuOpen ? 'open' : ''}`}>
            {navItems.map((item) => (
              <a key={item.label} href={item.href} className="lp-nav-link" onClick={() => setMenuOpen(false)}>
                {item.label}
              </a>
            ))}
            <div className="lp-mobile-actions">
              <button
                type="button"
                className="lp-theme-toggle"
                onClick={toggleTheme}
                aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
              >
                {theme === 'dark' ? <FaSun size={14} /> : <FaMoon size={14} />}
                <span>{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
              </button>
              <Link to="/login" className="lp-login-btn" onClick={() => setMenuOpen(false)}>Log In</Link>
              <Link to="/register" className="lp-signup-btn" onClick={() => setMenuOpen(false)}>Get Started</Link>
            </div>
          </div>
        </div>
      </header>

      <main className="lp-main">
      <section className="lp-hero" id="product">
        <div className="lp-hero-backdrop" />
        <div className="lp-radial-glow glow-hero" />
        <div className="lp-container lp-hero-layout-grid">
          
          <section className="lp-hero-copy-left">
            <div className="lp-section-kicker-wrap">
              <span className="lp-gold-accent-line" />
              <div className="lp-eyebrow lp-fade-up" style={{ '--delay': '100ms' }}>
                Built for Modern Teams
              </div>
            </div>

            <h1 className="lp-hero-title lp-fade-up" style={{ '--delay': '250ms' }}>
              The workspace your team <span className="lp-title-shimmer">actually</span> needs
            </h1>

            <p className="lp-hero-subtitle lp-fade-up" style={{ '--delay': '400ms' }}>
              Collaborate brings projects, tasks, communication, and team momentum into one focused operating system so modern teams move faster without adding more tools.
            </p>

            <div className="lp-hero-ctas-left lp-fade-up" style={{ '--delay': '550ms' }}>
              <Link to="/register" className="lp-cta-primary-btn big">
                Start for free
              </Link>
              <button type="button" className="lp-cta-secondary-btn big" onClick={scrollToMockup}>
                <span className="lp-play-icon" />
                <span>Watch demo</span>
              </button>
            </div>

            <div className="lp-social-proof-left lp-fade-up" style={{ '--delay': '650ms' }} id="customers">
              <div className="lp-avatar-stack" aria-hidden="true">
                {avatars.map((avatar) => (
                  <span key={avatar} className="lp-avatar-circle">{avatar}</span>
                ))}
              </div>
              <div className="lp-proof-text">
                <span className="lp-live-dot" />
                <span>Trusted by 2,000+ teams worldwide</span>
              </div>
            </div>
          </section>

          <section className="lp-hero-visual-right lp-fade-up" style={{ '--delay': '800ms' }} id="hero-dashboard">
            <div className="lp-dashboard-window">
              <div className="lp-window-topbar">
                <div className="lp-window-controls">
                  <span />
                  <span />
                  <span />
                </div>
                <div className="lp-window-title">Collaborate Workspace</div>
              </div>

              <div className="lp-window-body">
                <div className="lp-stats-grid">
                  {stats.map((stat) => (
                    <CountUpStat
                      key={stat.label}
                      label={stat.label}
                      value={stat.value}
                      prefix={stat.prefix}
                      suffix={stat.suffix}
                    />
                  ))}
                </div>

                <div className="lp-mockup-grid">
                  <section className="lp-panel" id="solutions">
                    <div className="lp-panel-header">
                      <span>Execution Timeline</span>
                      <span className="lp-panel-chip">This week</span>
                    </div>

                    <div className="lp-timeline-list">
                      <div className="lp-timeline-row">
                        <span>Product Spec</span>
                        <div className="lp-progress-track"><span style={{ width: '92%' }} /></div>
                      </div>
                      <div className="lp-timeline-row">
                        <span>Design QA</span>
                        <div className="lp-progress-track"><span style={{ width: '74%' }} /></div>
                      </div>
                      <div className="lp-timeline-row">
                        <span>Frontend</span>
                        <div className="lp-progress-track"><span style={{ width: '81%' }} /></div>
                      </div>
                      <div className="lp-timeline-row">
                        <span>Launch Prep</span>
                        <div className="lp-progress-track"><span style={{ width: '58%' }} /></div>
                      </div>
                    </div>
                  </section>

                  <section className="lp-panel" id="pricing">
                    <div className="lp-panel-header">
                      <span>Priority Queue</span>
                      <span className="lp-panel-chip">Live</span>
                    </div>

                    <div className="lp-task-list">
                      <div className="lp-task-item">
                        <span className="lp-task-check" />
                        <div className="lp-task-copy">
                          <strong>Finalize onboarding flow</strong>
                          <span>Product - Due today</span>
                        </div>
                        <span className="lp-task-pill">In review</span>
                      </div>
                      <div className="lp-task-item">
                        <span className="lp-task-check" />
                        <div className="lp-task-copy">
                          <strong>Assign sprint owners</strong>
                          <span>Ops - 4 contributors</span>
                        </div>
                        <span className="lp-task-pill">Ready</span>
                      </div>
                      <div className="lp-task-item">
                        <span className="lp-task-check" />
                        <div className="lp-task-copy">
                          <strong>Ship launch checklist</strong>
                          <span>Marketing - This week</span>
                        </div>
                        <span className="lp-task-pill">Blocked</span>
                      </div>
                    </div>
                  </section>
                </div>
              </div>
            </div>
            <div className="lp-preview-window-glow" />
          </section>

        </div>
      </section>

      <section className="lp-section lp-logo-strip-redesign">
        <div className="lp-container lp-logo-strip-card">
          <div className="lp-section-kicker-wrap centered">
            <span className="lp-gold-accent-line" />
            <span className="lp-strip-label">Powering modern delivery teams</span>
          </div>
          <div className="lp-logo-row">
            <span>Acme</span>
            <span>Vertex</span>
            <span>NovaCo</span>
            <span>Fable</span>
            <span>Orbis</span>
            <span>Lightspeed</span>
          </div>
        </div>
      </section>

      <section className="lp-section lp-capabilities-section" id="capabilities">
        <div className="lp-radial-glow glow-capabilities" />
        <div className="lp-container">
          <div className="lp-section-intro">
            <div className="lp-section-kicker-wrap centered">
              <span className="lp-gold-accent-line" />
              <div className="lp-section-kicker">Everything in one place</div>
            </div>
            <h2 className="lp-section-title">A full workspace built for what the platform offers</h2>
            <p className="lp-section-copy">
              Collaborate is not just a hero with a dashboard. It is a full team workspace that spans planning, project delivery, communication, meetings, and organisation operations.
            </p>
          </div>

          <div className="lp-feature-grid">
            {featureCards.map((feature) => {
              const IconComponent = feature.icon;
              return (
                <article key={feature.title} className="lp-feature-card-redesign">
                  <div className="lp-feature-card-glow" />
                  <div className="lp-feature-card-icon">
                    <IconComponent />
                  </div>
                  <h3>{feature.title}</h3>
                  <p>{feature.description}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="lp-section lp-capability-stack-redesign">
        <div className="lp-container lp-capability-stack">
          {capabilityRows.map((row, index) => {
            const isEven = index % 2 === 0;
            const Graphic = index === 0 ? renderPlanGraphic() : index === 1 ? renderOperateGraphic() : renderShipGraphic();
            return (
              <article key={row.title} className={`lp-capability-row-redesign ${isEven ? 'row-normal' : 'row-reverse'}`}>
                <div className="lp-capability-copy">
                  <div className="lp-section-kicker-wrap">
                    <span className="lp-gold-accent-line" />
                    <div className="lp-section-kicker">{row.eyebrow}</div>
                  </div>
                  <h3>{row.title}</h3>
                  <p>{row.body}</p>
                  <div className="lp-capability-list">
                    {row.bullets.map((bullet) => (
                      <div key={bullet} className="lp-capability-pill">
                        <span className="lp-pill-dot" />
                        <span>{bullet}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="lp-capability-visual">
                  {Graphic}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {cursorVisible && (
        <div 
          className="lp-cursor-glow" 
          style={{ 
            left: `${mouseCoords.x}px`, 
            top: `${mouseCoords.y}px` 
          }} 
        />
      )}

      <section 
        className="lp-section lp-how-it-works-redesign" 
        id="how-it-works"
        ref={workflowRef}
      >
        <div className="lp-radial-glow glow-how-it-works" />
        <div className="lp-container">
          <div className="lp-split-works-layout">
            <div className="lp-works-left">
              <div className="lp-section-kicker-wrap">
                <span className="lp-gold-accent-line" />
                <div className="lp-section-kicker">How it works</div>
              </div>
              <h2 className="lp-section-title lp-works-headline">
                A cleaner flow from <span className="lp-highlight-gold">setup to shipping</span>
              </h2>
              <p className="lp-section-copy lp-works-copy">
                Collaborate integrates your teams, plans, and conversations into a single, cohesive operating layer. Say goodbye to tool sprawl and fragmented context.
              </p>

              <div className={`lp-workflow-timeline-wrapper ${workflowVisible ? 'lp-revealed' : ''}`}>
                <div className="lp-workflow-timeline-cards">
                  {workflowSteps.map((step, index) => {
                    const IconComponent = index === 0 ? WorkspaceIcon : index === 1 ? RoadmapIcon : DeliveryIcon;
                    return (
                      <div key={step.number} className="lp-timeline-card-container">
                        <article 
                          className={`lp-workflow-card-redesign ${activeStep === index ? 'active' : ''}`}
                          onMouseEnter={() => setActiveStep(index)}
                          onClick={() => setActiveStep(index)}
                        >
                          <div className="lp-workflow-card-glow" />
                          <div className="lp-workflow-card-bg-number">{step.number}</div>
                          <div className="lp-workflow-card-icon">
                            <IconComponent />
                          </div>
                          <h3>{step.title}</h3>
                          <p>{step.description}</p>
                        </article>
                        
                        {index < 2 && (
                          <div className="lp-timeline-connection">
                            <svg className="lp-connection-line-svg" viewBox="0 0 100 10" preserveAspectRatio="none">
                              <path 
                                d="M 0 5 H 100" 
                                fill="none" 
                                stroke="url(#goldGradient)" 
                                strokeWidth="2" 
                                strokeDasharray="6,4" 
                                className="lp-animated-dash"
                              />
                              <defs>
                                <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                  <stop offset="0%" stopColor="var(--accent-primary)" stopOpacity="0.3" />
                                  <stop offset="50%" stopColor="var(--accent-primary)" stopOpacity="1" />
                                  <stop offset="100%" stopColor="var(--accent-primary)" stopOpacity="0.3" />
                                </linearGradient>
                              </defs>
                            </svg>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="lp-works-right">
              <div className="lp-dashboard-product-preview-container">
                <div className="lp-preview-window">
                  <div className="lp-preview-window-topbar">
                    <div className="lp-preview-window-controls">
                      <span />
                      <span />
                      <span />
                    </div>
                    <div className="lp-preview-window-title">
                      {activeStep === 0 ? 'Workspace Setup' : activeStep === 1 ? 'AI Planning' : 'Live Execution'}
                    </div>
                  </div>
                  <div className="lp-preview-window-body">
                    {renderDashboardMockup(activeStep)}
                  </div>
                </div>
                <div className="lp-preview-window-glow" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="lp-section lp-cta-section-redesign">
        <div className="lp-radial-glow glow-cta" />
        <div className="lp-container">
          
          <div className="lp-trust-indicators">
            <span className="lp-trust-label">Trusted by teams building faster</span>
            
            <div className="lp-trust-logos-row">
              <span className="lp-trust-logo">Acme</span>
              <span className="lp-trust-logo">Vertex</span>
              <span className="lp-trust-logo">NovaCo</span>
              <span className="lp-trust-logo">Fable</span>
              <span className="lp-trust-logo">Orbis</span>
            </div>

            <div className="lp-trust-stats-grid">
              <div className="lp-trust-stat">
                <span className="lp-trust-stat-number">50k+</span>
                <span className="lp-trust-stat-label">Active Users</span>
              </div>
              <div className="lp-trust-stat-divider" />
              <div className="lp-trust-stat">
                <span className="lp-trust-stat-number">12k+</span>
                <span className="lp-trust-stat-label">Projects Completed</span>
              </div>
              <div className="lp-trust-stat-divider" />
              <div className="lp-trust-stat">
                <span className="lp-trust-stat-number">99.9%</span>
                <span className="lp-trust-stat-label">Platform Uptime</span>
              </div>
            </div>
          </div>

          <div className="lp-cta-premium-card">
            <div className="lp-cta-card-bg-glow" />
            <div className="lp-cta-card-content">
              <div className="lp-section-kicker-wrap centered">
                <span className="lp-gold-accent-line" />
                <div className="lp-section-kicker">Start shipping today</div>
              </div>
              <h2 className="lp-cta-card-title">
                Bring planning, execution, chat and meetings into one workspace
              </h2>
              <p className="lp-cta-card-desc">
                Unify your workflow and accelerate your delivery loops. Experience Collaborate free today. No credit card required.
              </p>
              <div className="lp-cta-card-buttons">
                <Link to="/register" className="lp-cta-primary-btn">Start Free</Link>
                <Link to="/login" className="lp-cta-secondary-btn">Book Demo</Link>
              </div>
            </div>
          </div>

        </div>
      </section>
      </main>
    </div>
  );
};

export default LandingPage;
