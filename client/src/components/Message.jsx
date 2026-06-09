import React from 'react';
import { FaInfoCircle, FaCheckCircle, FaExclamationTriangle, FaExclamationCircle } from 'react-icons/fa';
import './Message.css';

const Message = ({ variant, children }) => {
  let icon = <FaInfoCircle />;

  // Choose icon based on variant
  if (variant === 'danger' || variant === 'error') {
    icon = <FaExclamationCircle />;
  } else if (variant === 'success') {
      icon = (typeof FaCheckCircle !== 'undefined') ? <FaCheckCircle /> : <svg width="16" height="16" viewBox="0 0 24 24" style={{ width: '1rem', height: '1rem' }} xmlns="http://www.w3.org/2000/svg"><path fill="currentColor" d="M12 2a10 10 0 1 0 .001 20.001A10 10 0 0 0 12 2zm-1 14.5l-5-5 1.41-1.41L11 13.67l6.59-6.59L19 8.5l-8 8z"/></svg>;
  } else if (variant === 'warning') {
    icon = <FaExclamationTriangle />;
  }

  // Normalize 'danger' class for compatibility
  const alertClass = `custom-alert custom-alert-${variant === 'error' ? 'danger' : variant}`;

  return (
    <div className={alertClass} role="alert">
      <div className="alert-icon">{icon}</div>
      <div className="alert-content">{children}</div>
    </div>
  );
};

Message.defaultProps = {
  variant: 'info',
};

export default Message;
