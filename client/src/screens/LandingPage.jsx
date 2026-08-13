import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FaMoon,
  FaSun,
  FaChevronRight,
  FaChevronDown,
  FaHome,
  FaFolder,
  FaTasks,
  FaUsers,
  FaCalendarAlt,
  FaComments,
  FaFile,
  FaChartBar,
  FaSearch,
  FaBell,
  FaBriefcase,
  FaClipboardList,
  FaUserFriends,
  FaChartLine,
  FaBolt,
  FaUser,
  FaExchangeAlt,
  FaVideo,
  FaBrain,
  FaMedal,
  FaBook,
  FaBuilding,
  FaShieldAlt,
  FaMagic,
  FaStar,
  FaGithub,
} from 'react-icons/fa';
import './LandingPage.css';

const navItems = [
  { label: 'Product', href: '#product' },
  { label: 'Solutions', href: '#solutions' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'Customers', href: '#customers' },
  { label: 'Resources', href: '#resources' },
];

const avatars = ['AL', 'MK', 'JT', 'RS'];

const sidebarNav = [
  { icon: FaHome, label: 'Home', active: true },
  { icon: FaFolder, label: 'Projects' },
  { icon: FaTasks, label: 'Tasks' },
  { icon: FaUsers, label: 'Teams' },
  { icon: FaCalendarAlt, label: 'Calendar' },
  { icon: FaComments, label: 'Messages' },
  { icon: FaFile, label: 'Files' },
  { icon: FaChartBar, label: 'Analytics' },
];

const kpiCards = [
  { label: 'Active Projects', value: '24', trend: '+12%', icon: FaBriefcase, color: 'green' },
  { label: 'Pending Tasks', value: '18', trend: '8%', icon: FaClipboardList, color: 'blue' },
  { label: 'Team Members', value: '6', trend: '2%', icon: FaUserFriends, color: 'purple' },
  { label: 'Team Velocity', value: '+12%', trend: '12%', icon: FaChartLine, color: 'orange' },
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

const logoCloud = ['Acme', 'Vertex', 'NovaCo', 'Fable', 'Orbis', 'Lightspeed'];

const platformFeatures = [
  {
    icon: FaMagic,
    title: 'AI Project Planning',
    description: 'Turn a rough brief into a structured roadmap with tasks, milestones, and delivery momentum in minutes.',
  },
  {
    icon: FaFolder,
    title: 'Projects & Tasks',
    description: 'Create projects manually or with AI, assign tasks to teammates, and track completion rates in real time.',
  },
  {
    icon: FaUsers,
    title: 'Teams & Organisations',
    description: 'Spin up study groups, manage org members, custom roles, compliance rules, and audit logs.',
  },
  {
    icon: FaComments,
    title: 'Realtime Chat',
    description: 'Discuss work in context with direct and group conversations, docked chat, and live message notifications.',
  },
  {
    icon: FaVideo,
    title: 'Video Meetings',
    description: 'Run browser-based WebRTC sessions with agenda editing and AI-generated summaries after each call.',
  },
  {
    icon: FaShieldAlt,
    title: 'Org Compliance',
    description: 'Provision members, enforce compliance policies, custom profile fields, and permission-based admin controls.',
  },
];

const peerLearningFeatures = [
  {
    icon: FaExchangeAlt,
    title: 'Skill Exchange Board',
    description: 'Post offers and requests for peer teaching. Filter by skill, department, format, and book sessions with credits.',
  },
  {
    icon: FaCalendarAlt,
    title: 'Session Booking',
    description: 'Schedule 1-on-1 or group sessions with confirm, cancel, and complete flows plus post-session rating prompts.',
  },
  {
    icon: FaBrain,
    title: 'Skill Sharing Explorer',
    description: 'Map skills you teach and want to learn. Venn diagrams, matchmaking, and faculty skill endorsements.',
  },
  {
    icon: FaStar,
    title: 'Ratings & Feedback',
    description: 'Session-based star ratings with private feedback views, average scores on profiles, and complaint reporting.',
  },
];

const gamificationFeatures = [
  {
    icon: FaGithub,
    title: 'Dev Score',
    description: 'Composite developer score from GitHub and LeetCode activity — calendar, repos, and problem stats on profiles.',
  },
  {
    icon: FaMedal,
    title: 'Badges & Credits',
    description: 'Earn credits by teaching peers, unlock achievement badges, and spend credits on booked sessions.',
  },
  {
    icon: FaChartBar,
    title: 'Leaderboard',
    description: 'Ranked developer leaderboard with department filters, nearby peers, and score breakdowns.',
  },
  {
    icon: FaBook,
    title: 'Resources Library',
    description: 'Upload PDFs, docs, and videos. AI summarisation, team-scoped sharing, and faculty pinning.',
  },
];

const workflowSteps = [
  {
    number: '01',
    title: 'Create your workspace',
    description: 'Register, join or create an organisation, invite teammates, and set up roles from day one.',
  },
  {
    number: '02',
    title: 'Plan and match skills',
    description: 'Add skills you teach and want to learn, browse the exchange board, or generate an AI project roadmap.',
  },
  {
    number: '03',
    title: 'Execute together',
    description: 'Manage tasks, chat in context, run live video sessions, and keep the full delivery loop in one product.',
  },
];

const roleRows = [
  { role: 'Students', desc: 'Teams, projects, exchange listings, sessions, resources, and skill sharing.' },
  { role: 'Faculty', desc: 'Endorse skills, pin resources, create announcements, and faculty badges on listings.' },
  { role: 'Admins', desc: 'Platform oversight — users, skills, listings, sessions, complaints, and announcements.' },
  { role: 'Org Admins', desc: 'Members, custom roles, compliance, custom fields, and audit logs.' },
];

const STORAGE_KEY = 'collaborate-landing-theme';

const LandingPage = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [lpTheme, setLpTheme] = useState(() => {
    try {
      return window.localStorage.getItem(STORAGE_KEY) === 'dark' ? 'dark' : 'light';
    } catch {
      return 'light';
    }
  });
  const dashboardRef = useRef(null);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, lpTheme);
    } catch {
      /* ignore */
    }
  }, [lpTheme]);

  const toggleLpTheme = () => setLpTheme((t) => (t === 'dark' ? 'light' : 'dark'));

  const scrollToMockup = () => {
    dashboardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  return (
    <div className="landing-page premium-landing" data-lp-theme={lpTheme}>
      <header className="lp-navbar lp-fade-up" style={{ '--delay': '0ms' }}>
        <div className="lp-container">
          <div className="lp-navbar-inner">
            <Link to="/" className="lp-brand" onClick={() => setMenuOpen(false)}>
              <span className="lp-brand-mark">C</span>
              <span className="lp-brand-text">Collaborate</span>
            </Link>

            <nav className="lp-nav-desktop" aria-label="Primary">
              {navItems.map((item) => (
                <a key={item.label} href={item.href} className="lp-nav-link">
                  {item.label}
                  {item.label === 'Resources' && <FaChevronDown className="lp-nav-caret" />}
                </a>
              ))}
            </nav>

            <div className="lp-nav-actions">
              <button
                type="button"
                className="lp-theme-toggle"
                onClick={toggleLpTheme}
                aria-label={lpTheme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
              >
                {lpTheme === 'dark' ? <FaSun size={13} /> : <FaMoon size={13} />}
                <span>{lpTheme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
              </button>
              <Link to="/login" className="lp-login-btn">Log in</Link>
              <Link to="/register" className="lp-signup-btn">
                Get Started <FaChevronRight size={11} />
              </Link>
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
              <button type="button" className="lp-theme-toggle" onClick={toggleLpTheme}>
                {lpTheme === 'dark' ? <FaSun size={13} /> : <FaMoon size={13} />}
                <span>{lpTheme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
              </button>
              <Link to="/login" className="lp-login-btn" onClick={() => setMenuOpen(false)}>Log in</Link>
              <Link to="/register" className="lp-signup-btn" onClick={() => setMenuOpen(false)}>
                Get Started <FaChevronRight size={11} />
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="lp-main">
        <section className="lp-hero" id="product">
          <div className="lp-hero-bg" aria-hidden="true" />
          <div className="lp-container">
            <div className="lp-hero-stage">
              <article className="lp-float-card lp-float-left lp-fade-up" style={{ '--delay': '200ms' }}>
                <div className="lp-float-icon green"><FaUser size={14} /></div>
                <div>
                  <strong>All-in-One</strong>
                  <p>Tasks, projects, chat, meetings &amp; more</p>
                </div>
              </article>

              <div className="lp-hero-center">
                <div className="lp-eyebrow lp-fade-up" style={{ '--delay': '80ms' }}>
                  <span className="lp-eyebrow-dot" />
                  Built for Modern Teams
                </div>

                <h1 className="lp-hero-title lp-fade-up" style={{ '--delay': '180ms' }}>
                  The workspace your team <span className="lp-title-accent">actually needs</span>
                </h1>

                <p className="lp-hero-subtitle lp-fade-up" style={{ '--delay': '280ms' }}>
                  Collaborate brings your projects, tasks, and team communication into one unified workspace.
                  Less chaos. More done.
                </p>

                <div className="lp-hero-ctas lp-fade-up" style={{ '--delay': '380ms' }}>
                  <Link to="/register" className="lp-cta-primary">
                    Start for free <FaChevronRight size={12} />
                  </Link>
                  <button type="button" className="lp-cta-demo" onClick={scrollToMockup}>
                    <span className="lp-play-icon" />
                    Watch demo
                  </button>
                </div>

                <div className="lp-social-proof lp-fade-up" style={{ '--delay': '480ms' }} id="customers">
                  <div className="lp-avatar-stack" aria-hidden="true">
                    {avatars.map((avatar, i) => (
                      <span key={avatar} className="lp-avatar-circle" style={{ '--i': i }}>{avatar}</span>
                    ))}
                  </div>
                  <div className="lp-proof-text">
                    <span className="lp-live-dot" />
                    Trusted by 2,000+ teams worldwide
                  </div>
                </div>
              </div>

              <article className="lp-float-card lp-float-right lp-fade-up" style={{ '--delay': '200ms' }}>
                <div className="lp-float-icon green"><FaBolt size={14} /></div>
                <div>
                  <strong>Modern &amp; Fast</strong>
                  <p>Built for speed and efficiency</p>
                </div>
              </article>
            </div>

            <div className="lp-dashboard-wrap lp-fade-up" style={{ '--delay': '600ms' }} ref={dashboardRef} id="hero-dashboard">
              <div className="lp-dashboard-window">
                <aside className="lp-mock-sidebar">
                  <div className="lp-mock-sidebar-brand">
                    <span className="lp-mock-logo">C</span>
                    <span>Collaborate</span>
                  </div>
                  <nav className="lp-mock-nav">
                    {sidebarNav.map((item) => (
                      <div key={item.label} className={`lp-mock-nav-item ${item.active ? 'active' : ''}`}>
                        <item.icon size={13} />
                        <span>{item.label}</span>
                      </div>
                    ))}
                  </nav>
                </aside>

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
                    {kpiCards.map((kpi) => (
                      <div key={kpi.label} className="lp-mock-kpi">
                        <div className={`lp-mock-kpi-icon ${kpi.color}`}>
                          <kpi.icon size={13} />
                        </div>
                        <div className="lp-mock-kpi-body">
                          <span className="lp-mock-kpi-value">{kpi.value}</span>
                          <span className="lp-mock-kpi-label">{kpi.label}</span>
                        </div>
                        <span className={`lp-mock-kpi-trend ${kpi.color}`}>
                          <FaChartLine size={9} /> {kpi.trend}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="lp-mock-content-row">
                    <div className="lp-mock-panel lp-mock-chart-panel">
                      <div className="lp-mock-panel-head">
                        <span>Project Overview</span>
                        <span className="lp-mock-chip">This week</span>
                      </div>
                      <div className="lp-mock-chart-area">
                        <svg className="lp-mock-chart" viewBox="0 0 320 100" preserveAspectRatio="none" aria-hidden="true">
                          <defs>
                            <linearGradient id="lpChartGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="rgba(31,69,54,0.25)" />
                              <stop offset="100%" stopColor="rgba(31,69,54,0)" />
                            </linearGradient>
                          </defs>
                          <path
                            d="M0,80 L40,72 L80,68 L120,52 L160,48 L200,40 L240,32 L280,28 L320,20 L320,100 L0,100 Z"
                            fill="url(#lpChartGrad)"
                          />
                          <polyline
                            points="0,80 40,72 80,68 120,52 160,48 200,40 240,32 280,28 320,20"
                            fill="none"
                            stroke="#1f4536"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        <div className="lp-mock-chart-tooltip">
                          <strong>72% Progress</strong>
                          <span>Wed, 15 May</span>
                        </div>
                      </div>
                    </div>

                    <div className="lp-mock-panel">
                      <div className="lp-mock-panel-head">
                        <span>Recent Activity</span>
                      </div>
                      <ul className="lp-mock-activity-list">
                        {recentActivity.map((item) => (
                          <li key={item.title} className="lp-mock-activity-item">
                            <span className="lp-mock-activity-dot" style={{ background: item.color }} />
                            <div className="lp-mock-activity-copy">
                              <strong>{item.title}</strong>
                              <span>{item.user} · {item.time}</span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="lp-mock-panel">
                      <div className="lp-mock-panel-head">
                        <span>Upcoming</span>
                      </div>
                      <ul className="lp-mock-upcoming-list">
                        {upcomingEvents.map((item) => (
                          <li key={item.title} className="lp-mock-upcoming-item">
                            <span className="lp-mock-upcoming-icon" style={{ background: item.color }} />
                            <div className="lp-mock-upcoming-copy">
                              <strong>{item.title}</strong>
                              <span>{item.date} · {item.time}</span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="lp-logo-strip">
          <div className="lp-container lp-logo-strip-inner">
            <span className="lp-strip-label">POWERING TEAMS AT</span>
            <div className="lp-logo-row">
              {logoCloud.map((name) => (
                <span key={name} className="lp-logo-name">{name}</span>
              ))}
            </div>
          </div>
        </section>

        <section className="lp-section" id="solutions">
          <div className="lp-container">
            <div className="lp-section-intro">
              <div className="lp-section-kicker">Platform</div>
              <h2 className="lp-section-title">Everything your team needs in one workspace</h2>
              <p className="lp-section-copy">
                From AI-assisted planning to live video meetings — Collaborate spans the full delivery loop
                without tool sprawl.
              </p>
            </div>
            <div className="lp-feature-grid">
              {platformFeatures.map((feature) => (
                <article key={feature.title} className="lp-feature-card">
                  <div className="lp-feature-icon"><feature.icon size={18} /></div>
                  <h3>{feature.title}</h3>
                  <p>{feature.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="lp-section lp-section-alt" id="pricing">
          <div className="lp-container">
            <div className="lp-section-intro">
              <div className="lp-section-kicker">Peer Learning</div>
              <h2 className="lp-section-title">Built for academic skill exchange</h2>
              <p className="lp-section-copy">
                Students teach what they know and learn what they need — with booking, ratings,
                and matchmaking built into the platform.
              </p>
            </div>
            <div className="lp-feature-grid lp-feature-grid-4">
              {peerLearningFeatures.map((feature) => (
                <article key={feature.title} className="lp-feature-card">
                  <div className="lp-feature-icon"><feature.icon size={18} /></div>
                  <h3>{feature.title}</h3>
                  <p>{feature.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="lp-section" id="resources">
          <div className="lp-container">
            <div className="lp-section-intro">
              <div className="lp-section-kicker">Growth &amp; Recognition</div>
              <h2 className="lp-section-title">Gamification that rewards real contribution</h2>
              <p className="lp-section-copy">
                Dev Score, badges, credits, and a developer leaderboard keep momentum visible
                across the whole community.
              </p>
            </div>
            <div className="lp-feature-grid lp-feature-grid-4">
              {gamificationFeatures.map((feature) => (
                <article key={feature.title} className="lp-feature-card">
                  <div className="lp-feature-icon"><feature.icon size={18} /></div>
                  <h3>{feature.title}</h3>
                  <p>{feature.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="lp-section lp-section-alt">
          <div className="lp-container">
            <div className="lp-section-intro">
              <div className="lp-section-kicker">Roles &amp; Permissions</div>
              <h2 className="lp-section-title">Scales from a single team to an entire institution</h2>
            </div>
            <div className="lp-role-grid">
              {roleRows.map((row) => (
                <article key={row.role} className="lp-role-card">
                  <div className="lp-role-badge">
                    {row.role === 'Org Admins' ? <FaBuilding size={14} /> : <FaUser size={14} />}
                  </div>
                  <h3>{row.role}</h3>
                  <p>{row.desc}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="lp-section">
          <div className="lp-container">
            <div className="lp-section-intro">
              <div className="lp-section-kicker">How it works</div>
              <h2 className="lp-section-title">From setup to shipping in three steps</h2>
            </div>
            <div className="lp-workflow-grid">
              {workflowSteps.map((step) => (
                <article key={step.number} className="lp-workflow-card">
                  <div className="lp-workflow-number">{step.number}</div>
                  <h3>{step.title}</h3>
                  <p>{step.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="lp-section">
          <div className="lp-container">
            <div className="lp-cta-panel">
              <div className="lp-section-kicker">Ready to start</div>
              <h2 className="lp-section-title">Bring planning, peer learning, chat, and meetings into one workspace</h2>
              <p className="lp-section-copy">
                Start with teams and projects, then scale into structured organisation workflows
                with skill exchange, Dev Score, and admin oversight — without changing products.
              </p>
              <div className="lp-cta-panel-actions">
                <Link to="/register" className="lp-cta-primary">
                  Start for free <FaChevronRight size={12} />
                </Link>
                <Link to="/login" className="lp-login-btn lp-login-btn-lg">Log in</Link>
              </div>
            </div>
          </div>
        </section>

        <footer className="lp-footer">
          <div className="lp-container lp-footer-inner">
            <div className="lp-footer-brand">
              <span className="lp-brand-mark">C</span>
              <span>Collaborate</span>
            </div>
            <p className="lp-footer-copy">
              Academic peer-learning and collaboration platform. Projects, tasks, skill exchange, sessions, and more.
            </p>
            <div className="lp-footer-links">
              <a href="#product">Product</a>
              <a href="#solutions">Solutions</a>
              <a href="#pricing">Pricing</a>
              <a href="#resources">Resources</a>
              <Link to="/login">Log in</Link>
              <Link to="/register">Sign up</Link>
            </div>
            <p className="lp-footer-meta">© {new Date().getFullYear()} Collaborate. All rights reserved.</p>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default LandingPage;
