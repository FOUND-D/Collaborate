import React from 'react';
import './Loader.css';

const Loader = ({ text = "Loading..." }) => {
  return (
    <div className="loader-container-custom">
      <div className="spinner-ring"></div>
      <div className="loader-text">{text}</div>
    </div>
  );
};

export default Loader;
