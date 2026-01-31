import React from 'react';
import './AuthLayout.css';

const AuthLayout = ({ children }) => {
  return (
    <div className="auth-layout-container">
      <div className="auth-graphic-side">
        {/* Placeholder for the aesthetic graphic or 3D abstract shape */}
        <h1 className="auth-graphic-title">Collaborate Smarter.</h1>
        <p className="auth-graphic-subtitle">AI-powered project management for modern teams.</p>
        <div className="auth-graphic-shape"></div> {/* This could be styled with CSS for a subtle abstract shape */}
      </div>
      <div className="auth-form-side">
        {children}
      </div>
    </div>
  );
};

export default AuthLayout;
