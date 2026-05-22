import React from 'react';
import { FaChartLine, FaCompass, FaLayerGroup } from 'react-icons/fa';

const cards = [
  {
    icon: <FaCompass />,
    title: 'Design imported',
    description: 'This area now follows the new workspace styling while keeping the existing route and fallback behavior intact.',
  },
  {
    icon: <FaLayerGroup />,
    title: 'Legacy-safe fallback',
    description: 'If a dedicated redesign file is missing, the app can continue using the older implementation without breaking navigation.',
  },
  {
    icon: <FaChartLine />,
    title: 'Ready for iteration',
    description: 'You can refine this page later without affecting the rest of the current product flow.',
  },
];

const PhaseOnePlaceholderScreen = ({ title, description }) => (
  <div className="modern-placeholder">
    <div className="modern-placeholder__shell">
      <div className="modern-placeholder__eyebrow">Phase 1 Workspace</div>
      <h1 className="modern-placeholder__title">{title}</h1>
      <p className="modern-placeholder__copy">{description}</p>
      <div className="modern-placeholder__cards">
        {cards.map((card) => (
          <section key={card.title} className="modern-placeholder__card">
            <div className="modern-placeholder__icon">{card.icon}</div>
            <h2>{card.title}</h2>
            <p>{card.description}</p>
          </section>
        ))}
      </div>
    </div>
  </div>
);

export default PhaseOnePlaceholderScreen;
