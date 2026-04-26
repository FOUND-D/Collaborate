import React from 'react';

const PhaseOnePlaceholderScreen = ({ title, description }) => (
  <div style={{ padding: '32px 28px', color: '#f1f5f9' }}>
    <div style={{ maxWidth: 720 }}>
      <div style={{ fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(241,245,249,0.45)', marginBottom: 10 }}>
        Phase 1
      </div>
      <h1 style={{ margin: 0, fontSize: 32, lineHeight: 1.1 }}>{title}</h1>
      <p style={{ marginTop: 14, color: 'rgba(241,245,249,0.72)', fontSize: 15, lineHeight: 1.6 }}>
        {description}
      </p>
    </div>
  </div>
);

export default PhaseOnePlaceholderScreen;
