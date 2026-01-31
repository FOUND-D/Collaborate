import React from 'react';
import './AuthLayout.css';

const AuthLayout = ({ children }) => {
  return (
    <div className="auth-layout-container">
      <div className="auth-form-side">
        {children}
      </div>
    </div>
  );
};

export default AuthLayout;
