import React from 'react';
import { Link } from 'react-router-dom';
import './LandingPage.css';
import { FaBars, FaChartLine, FaCheckCircle, FaComments, FaHeart, FaMagic, FaPlay, FaProjectDiagram, FaTasks, FaUsers } from 'react-icons/fa';

const features = [
  { icon: FaProjectDiagram, title: 'Project Tracking', desc: 'Visualize timelines, milestones, and blockers in real time.', tone: 'blue' },
  { icon: FaUsers, title: 'Team Management', desc: 'Assign roles, manage permissions, and keep everyone aligned.', tone: 'purple' },
  { icon: FaMagic, title: 'AI Project Builder', desc: 'Let AI draft your entire project plan in seconds.', tone: 'blue' },
  { icon: FaComments, title: 'Integrated Chat', desc: 'Discuss tasks right where the work happens.', tone: 'green' },
  { icon: FaTasks, title: 'Smart Task Board', desc: 'Kanban, list, or calendar — pick your view.', tone: 'purple' },
  { icon: FaChartLine, title: 'Progress Analytics', desc: 'Track completion rates and team velocity.', tone: 'green' },
];

const steps = [
  { icon: FaProjectDiagram, title: 'Create a project', desc: 'Set the goal, scope, and timeline in minutes.' },
  { icon: FaUsers, title: 'Invite your team', desc: 'Bring the right people into the workspace.' },
  { icon: FaCheckCircle, title: 'Get work done', desc: 'Track tasks, chat, and move faster together.' },
];

const logos = ['Acme Corp', 'Lightspeed', 'Vertex', 'NovaCo', 'Orbis', 'Fable'];

const LandingPage = () => {
  return (
    <div className="landing-page">
      <header className="landing-navbar">
        <Link to="/" className="landing-brand">
          <span className="brand-mark" />
          <span>Collaborate</span>
        </Link>
        <div className="landing-nav-desktop">
          <a href="#features">Features</a>
          <a href="#pricing">Pricing</a>
          <a href="#about">About</a>
          <Link to="/login" className="nav-ghost">Log In</Link>
          <Link to="/register" className="nav-solid">Get Started</Link>
        </div>
        <button className="landing-mobile-menu" aria-label="Open navigation">
          <FaBars />
        </button>
      </header>

      <main>
        <section className="hero-section">
          <div className="hero-content">
            <div className="hero-badge">Built for modern teams</div>
            <h1 className="hero-title">
              The workspace your
              {'\n'}team <span className="accent">actually</span> needs
            </h1>
            <p className="hero-subtitle">
              Collaborate brings your projects, tasks, and team communication into one unified workspace. Less chaos. More done.
            </p>
            <div className="hero-ctas">
              <Link to="/register" className="hero-btn hero-btn-primary">Start for free</Link>
              <button
                type="button"
                className="hero-btn hero-btn-secondary"
                onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
              >
                <FaPlay /> Watch demo
              </button>
            </div>
            <p className="hero-proof">Trusted by 2,000+ teams worldwide</p>
            <div className="hero-mockup">
              <div className="mockup-topbar">
                <span />
                <span />
                <span />
              </div>
              <div className="mockup-grid">
                <div className="mockup-panel large">
                  <div className="mockup-label">Active Projects</div>
                  <div className="mockup-value">24</div>
                </div>
                <div className="mockup-panel">
                  <div className="mockup-label">Pending Tasks</div>
                  <div className="mockup-value">18</div>
                </div>
                <div className="mockup-panel">
                  <div className="mockup-label">Team Velocity</div>
                  <div className="mockup-value">+12%</div>
                </div>
                <div className="mockup-chart" />
              </div>
            </div>
          </div>
        </section>

        <section className="logos-bar">
          <span>Powering teams at</span>
          <div className="logos-row">
            {logos.map((logo) => <span key={logo}>{logo}</span>)}
          </div>
        </section>

        <section className="landing-section" id="features">
          <div className="section-badge">FEATURES</div>
          <h2>Everything your team needs</h2>
          <p>Clear planning, sharper communication, and a dashboard built to keep momentum visible.</p>
          <div className="features-grid">
            {features.map(({ icon: Icon, title, desc, tone }) => (
              <article className="feature-card" key={title}>
                <div className={`feature-icon ${tone}`}><Icon /></div>
                <h3>{title}</h3>
                <p>{desc}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="how-it-works" id="about">
          <div className="section-badge">HOW IT WORKS</div>
          <div className="steps-grid">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div className="step-card" key={step.title}>
                  <div className="step-number">{index + 1}</div>
                  <Icon className="step-icon" />
                  <h3>{step.title}</h3>
                  <p>{step.desc}</p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="cta-banner" id="pricing">
          <h2>Ready to bring your team together?</h2>
          <p>Start with a shared workspace, then scale your process without changing tools.</p>
          <Link to="/register" className="hero-btn hero-btn-primary">Get started free</Link>
        </section>
      </main>

      <footer className="landing-footer">
        <div className="footer-grid">
          <div>
            <div className="footer-brand"><span className="brand-mark" /> Collaborate</div>
            <p>Project management for teams that need less noise and more progress.</p>
          </div>
          <div>
            <h4>Product</h4>
            <a href="#features">Features</a>
            <a href="#pricing">Pricing</a>
            <a href="#about">About</a>
          </div>
          <div>
            <h4>Company</h4>
            <a href="#about">Careers</a>
            <a href="#about">Contact</a>
            <a href="#about">Blog</a>
          </div>
          <div>
            <h4>Legal</h4>
            <a href="#about">Privacy</a>
            <a href="#about">Terms</a>
            <a href="#about">Security</a>
          </div>
        </div>
        <div className="footer-bar">
          <span>Copyright 2026 Collaborate</span>
          <span>Made with <FaHeart className="heart" /> for teams</span>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
