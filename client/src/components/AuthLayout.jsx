import React from 'react';
import './AuthLayout.css';

const AuthLayout = ({ children }) => {
  return (
    <div className="auth-layout-container">
      <div className="auth-graphic-side">
        <div className="auth-graphic-content">
          <h1 className="auth-graphic-title">Collaborate Smarter.</h1>
          <p className="auth-graphic-subtitle">AI-powered project management for modern teams.</p>
        </div>

        {/* Abstract Background Shapes */}
        <div className="auth-graphic-shape shape-1"></div>
        <div className="auth-graphic-shape shape-2"></div>
        <div className="auth-graphic-shape shape-3"></div>
      </div>
      <div className="auth-form-side">
        {children}
      </div>
    </div>
  );
};

export default AuthLayout;
