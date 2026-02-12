import React from 'react';
import { FaInfoCircle, FaCheckCircle, FaExclamationTriangle, FaExclamationCircle } from 'react-icons/fa';
import './Message.css';

const Message = ({ variant, children }) => {
  let icon = <FaInfoCircle />;

  // Choose icon based on variant
  if (variant === 'danger' || variant === 'error') {
    icon = <FaExclamationCircle />;
  } else if (variant === 'success') {
    icon = <FaCheckCircle />;
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
