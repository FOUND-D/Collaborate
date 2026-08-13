import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import LandingDashboardMockup from '../components/landing/LandingDashboardMockup';
import {
  FaMoon,
  FaSun,
  FaChevronRight,
  FaChevronDown,
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
  FaFolder,
  FaUsers,
  FaComments,
  FaCalendarAlt,
  FaChartBar,
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

const heroStagger = {
  hidden: { opacity: 0, y: 18 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.45,
      ease: [0.2, 0.8, 0.2, 1],
    },
  }),
};

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
  const heroCenterRef = useRef(null);
  const [cursorGlow, setCursorGlow] = useState({ x: 50, y: 42 });

  const onHeroMouseMove = useCallback((e) => {
    const node = heroCenterRef.current;
    if (!node) return;
    const rect = node.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setCursorGlow({
      x: Math.max(0, Math.min(100, x)),
      y: Math.max(0, Math.min(100, y)),
    });
  }, []);

  const onHeroMouseLeave = useCallback(() => {
    setCursorGlow({ x: 50, y: 42 });
  }, []);

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
              <motion.article
                className="lp-float-card lp-float-left lp-interactive-card"
                custom={2}
                initial="hidden"
                animate="visible"
                variants={heroStagger}
              >
                <motion.div
                  className="lp-float-card-inner"
                  animate={{ y: [0, -7, 0] }}
                  transition={{ duration: 3.8, repeat: Infinity, ease: 'easeInOut', delay: 0.9 }}
                >
                  <div className="lp-float-icon green"><FaUser size={14} /></div>
                  <div>
                    <strong>All-in-One</strong>
                    <p>Tasks, projects, chat, meetings &amp; more</p>
                  </div>
                </motion.div>
              </motion.article>

              <div
                className="lp-hero-center"
                ref={heroCenterRef}
                onMouseMove={onHeroMouseMove}
                onMouseLeave={onHeroMouseLeave}
              >
                <div
                  className="lp-hero-cursor-glow"
                  aria-hidden="true"
                  style={{
                    left: `${cursorGlow.x}%`,
                    top: `${cursorGlow.y}%`,
                  }}
                />

                <motion.div
                  className="lp-eyebrow"
                  custom={0}
                  initial="hidden"
                  animate="visible"
                  variants={heroStagger}
                >
                  <span className="lp-eyebrow-dot" />
                  Built for Modern Teams
                </motion.div>

                <motion.h1
                  className="lp-hero-title"
                  custom={1}
                  initial="hidden"
                  animate="visible"
                  variants={heroStagger}
                >
                  The workspace your team{' '}
                  <span className="lp-title-accent lp-title-accent-shimmer">actually needs</span>
                </motion.h1>

                <motion.p
                  className="lp-hero-subtitle"
                  custom={2}
                  initial="hidden"
                  animate="visible"
                  variants={heroStagger}
                >
                  Collaborate brings your projects, tasks, and team communication into one unified workspace.
                  Less chaos. More done.
                </motion.p>

                <motion.div
                  className="lp-hero-ctas"
                  custom={3}
                  initial="hidden"
                  animate="visible"
                  variants={heroStagger}
                >
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Link to="/register" className="lp-cta-primary">
                      Start for free <FaChevronRight size={12} />
                    </Link>
                  </motion.div>
                  <motion.button
                    type="button"
                    className="lp-cta-demo"
                    onClick={scrollToMockup}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <span className="lp-play-icon" />
                    Watch demo
                  </motion.button>
                </motion.div>

                <motion.div
                  className="lp-social-proof"
                  id="customers"
                  custom={4}
                  initial="hidden"
                  animate="visible"
                  variants={heroStagger}
                >
                  <div className="lp-avatar-stack" aria-hidden="true">
                    {avatars.map((avatar, i) => (
                      <motion.span
                        key={avatar}
                        className="lp-avatar-circle"
                        style={{ zIndex: i }}
                        whileHover={{ scale: 1.14, zIndex: 10 }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                      >
                        {avatar}
                      </motion.span>
                    ))}
                  </div>
                  <div className="lp-proof-text">
                    <span className="lp-live-dot" />
                    Trusted by 2,000+ teams worldwide
                  </div>
                </motion.div>
              </div>

              <motion.article
                className="lp-float-card lp-float-right lp-interactive-card"
                custom={2}
                initial="hidden"
                animate="visible"
                variants={heroStagger}
              >
                <motion.div
                  className="lp-float-card-inner"
                  animate={{ y: [0, -7, 0] }}
                  transition={{ duration: 4.2, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }}
                >
                  <div className="lp-float-icon green"><FaBolt size={14} /></div>
                  <div>
                    <strong>Modern &amp; Fast</strong>
                    <p>Built for speed and efficiency</p>
                  </div>
                </motion.div>
              </motion.article>
            </div>

            <LandingDashboardMockup dashboardRef={dashboardRef} />
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
                <motion.article
                  key={feature.title}
                  className="lp-feature-card lp-interactive-card"
                  whileHover={{ y: -2 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                >
                  <div className="lp-feature-icon"><feature.icon size={18} /></div>
                  <h3>{feature.title}</h3>
                  <p>{feature.description}</p>
                </motion.article>
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
                <motion.article
                  key={feature.title}
                  className="lp-feature-card lp-interactive-card"
                  whileHover={{ y: -2 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                >
                  <div className="lp-feature-icon"><feature.icon size={18} /></div>
                  <h3>{feature.title}</h3>
                  <p>{feature.description}</p>
                </motion.article>
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
                <motion.article
                  key={feature.title}
                  className="lp-feature-card lp-interactive-card"
                  whileHover={{ y: -2 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                >
                  <div className="lp-feature-icon"><feature.icon size={18} /></div>
                  <h3>{feature.title}</h3>
                  <p>{feature.description}</p>
                </motion.article>
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
                <motion.article
                  key={row.role}
                  className="lp-role-card lp-interactive-card"
                  whileHover={{ y: -2 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                >
                  <div className="lp-role-badge">
                    {row.role === 'Org Admins' ? <FaBuilding size={14} /> : <FaUser size={14} />}
                  </div>
                  <h3>{row.role}</h3>
                  <p>{row.desc}</p>
                </motion.article>
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
                <motion.article
                  key={step.number}
                  className="lp-workflow-card lp-interactive-card"
                  whileHover={{ y: -2 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                >
                  <div className="lp-workflow-number">{step.number}</div>
                  <h3>{step.title}</h3>
                  <p>{step.description}</p>
                </motion.article>
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
                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
                  <Link to="/register" className="lp-cta-primary">
                    Start for free <FaChevronRight size={12} />
                  </Link>
                </motion.div>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Link to="/login" className="lp-login-btn lp-login-btn-lg">Log in</Link>
                </motion.div>
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
