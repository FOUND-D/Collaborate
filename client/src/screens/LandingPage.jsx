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

const featureCards = [
  {
    title: 'AI Project Planning',
    description: 'Turn a rough brief into a structured roadmap with tasks, milestones, and delivery momentum in minutes.',
  },
  {
    title: 'Team Management',
    description: 'Create organisations, manage teams, assign roles, and keep collaboration structured as the workspace grows.',
  },
  {
    title: 'Task Execution',
    description: 'Move from planning to shipping with task ownership, progress visibility, and live execution context in one view.',
  },
  {
    title: 'Realtime Chat',
    description: 'Discuss work where it happens instead of scattering decisions across disconnected communication tools.',
  },
  {
    title: 'Meetings & Presence',
    description: 'Run browser-based team meetings with live room presence so standups and reviews stay inside the product.',
  },
  {
    title: 'Org Compliance',
    description: 'Add member onboarding, role controls, and compliance rules for teams that need more than a lightweight task app.',
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
    title: 'Create the workspace',
    description: 'Start with an organisation, spin up teams, and give the right people access from day one.',
  },
  {
    number: '02',
    title: 'Generate or create projects',
    description: 'Use AI to draft a roadmap or create a project manually, then connect it to the team responsible for delivery.',
  },
  {
    number: '03',
    title: 'Execute in one system',
    description: 'Manage tasks, communicate in context, meet live, and keep the full delivery loop visible without tool sprawl.',
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

const LandingPage = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const stats = useMemo(() => statConfig, []);
  const { theme, toggleTheme } = useTheme();

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
        <div className="lp-container lp-hero-layout">
          <section className="lp-hero-copy">
            <div className="lp-eyebrow lp-fade-up" style={{ '--delay': '100ms' }}>
              Built for Modern Teams
            </div>

            <h1 className="lp-hero-title lp-fade-up" style={{ '--delay': '250ms' }}>
              The workspace your team <span className="lp-title-shimmer">actually</span> needs
            </h1>

            <p className="lp-hero-subtitle lp-fade-up" style={{ '--delay': '400ms' }}>
              Collaborate brings your projects, tasks, and team communication into one unified workspace. Less chaos. More done.
            </p>

            <div className="lp-hero-ctas lp-fade-up" style={{ '--delay': '550ms' }}>
              <Link to="/register" className="lp-cta-free">
                Start for free
              </Link>
              <button type="button" className="lp-cta-demo" onClick={scrollToMockup}>
                <span className="lp-play-icon" />
                <span>Watch demo</span>
              </button>
            </div>

            <div className="lp-social-proof lp-fade-up" style={{ '--delay': '650ms' }} id="customers">
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
        </div>
        <section className="lp-hero-visual lp-fade-up" style={{ '--delay': '800ms' }} id="hero-dashboard">
          <div className="lp-container">
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
          </div>
        </section>
      </section>

      <section className="lp-section lp-logo-strip">
        <div className="lp-container lp-logo-strip-inner">
          <span className="lp-strip-label">Powering modern delivery teams</span>
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

      <section className="lp-section" id="capabilities">
        <div className="lp-container">
          <div className="lp-section-intro">
            <div className="lp-section-kicker">Everything in one place</div>
            <h2 className="lp-section-title">A full product page for what the platform actually offers</h2>
            <p className="lp-section-copy">
              Collaborate is not just a hero with a dashboard. It is a full team workspace that spans planning, project delivery, communication, meetings, and organisation operations.
            </p>
          </div>

          <div className="lp-feature-grid">
            {featureCards.map((feature) => (
              <article key={feature.title} className="lp-feature-card">
                <div className="lp-feature-glow" />
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="lp-section lp-section-alt">
        <div className="lp-container lp-capability-stack">
          {capabilityRows.map((row) => (
            <article key={row.title} className="lp-capability-row">
              <div className="lp-capability-copy">
                <div className="lp-section-kicker">{row.eyebrow}</div>
                <h3>{row.title}</h3>
                <p>{row.body}</p>
              </div>
              <div className="lp-capability-list">
                {row.bullets.map((bullet) => (
                  <div key={bullet} className="lp-capability-pill">
                    <span className="lp-pill-dot" />
                    <span>{bullet}</span>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="lp-section">
        <div className="lp-container">
          <div className="lp-section-intro">
            <div className="lp-section-kicker">How it works</div>
            <h2 className="lp-section-title">A cleaner flow from setup to shipping</h2>
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
            <h2 className="lp-section-title">Bring planning, execution, chat, and meetings into one workspace</h2>
            <p className="lp-section-copy">
              Start with teams and projects, then scale into a structured organisation workflow without changing products.
            </p>
            <div className="lp-cta-panel-actions">
              <Link to="/register" className="lp-signup-btn">Start free</Link>
              <Link to="/login" className="lp-login-btn">Log In</Link>
            </div>
          </div>
        </div>
      </section>
      </main>
    </div>
  );
};

export default LandingPage;
