import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FaArrowRight, FaEye, FaEyeSlash, FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';
import api from '../utils/api';
import '../styles/auth.css';

const ResetPasswordScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const query = new URLSearchParams(location.search);
  const token = query.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  const submitHandler = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await api.post('/api/auth/reset-password', { token, newPassword: password });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || 'This reset link is invalid or has expired.');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="auth-page">
        <section className="auth-right" style={{ width: '100%' }}>
          <div className="auth-form-wrap" style={{ textAlign: 'center' }}>
            <FaExclamationCircle size={48} color="#ef4444" style={{ marginBottom: '24px' }} />
            <h1 style={{ color: '#f1f5f9', marginBottom: '12px' }}>Invalid Reset Link</h1>
            <p style={{ color: 'rgba(241, 245, 249, 0.45)', marginBottom: '32px' }}>
              The password reset link is missing or malformed.
            </p>
            <Link to="/login" className="auth-submit-btn">Back to Login</Link>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <aside className="auth-left">
        <div className="auth-left-top">
          <Link to="/" className="auth-logo">
            <span className="auth-logo-icon" />
            <span>Collaborate</span>
          </Link>
        </div>
        <div className="auth-left-body">
          <h2 style={{ color: '#f1f5f9', fontSize: '24px', fontWeight: 700, letterSpacing: '-0.5px' }}>
            Secure your account
          </h2>
          <p style={{ color: 'rgba(241, 245, 249, 0.5)', lineHeight: 1.6 }}>
            Set a strong password to protect your projects and data. We recommend using a mix of letters, numbers, and symbols.
          </p>
        </div>
      </aside>

      <section className="auth-right">
        <div className="auth-form-wrap">
          {success ? (
            <div style={{ textAlign: 'center' }}>
              <FaCheckCircle size={48} color="#14b8a6" style={{ marginBottom: '24px' }} />
              <h1 style={{ color: '#f1f5f9', marginBottom: '12px' }}>Password Reset!</h1>
              <p style={{ color: 'rgba(241, 245, 249, 0.45)', marginBottom: '32px' }}>
                Your password has been successfully updated. You can now log in with your new password.
              </p>
              <Link to="/login" className="auth-submit-btn">Go to Login <FaArrowRight /></Link>
            </div>
          ) : (
            <>
              <div className="auth-form-header">
                <h1>Set new password</h1>
                <p>Please enter and confirm your new password below.</p>
              </div>

              {error && <div className="field-error-msg" style={{ marginBottom: '20px' }}>{error}</div>}

              <form className="auth-form" onSubmit={submitHandler}>
                <div className="field-group">
                  <label className="field-label" htmlFor="password">New Password</label>
                  <div className="field-input-wrap">
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      className="field-input"
                      placeholder="At least 6 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="field-toggle-btn"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <FaEyeSlash size={15} /> : <FaEye size={15} />}
                    </button>
                  </div>
                </div>

                <div className="field-group">
                  <label className="field-label" htmlFor="confirmPassword">Confirm New Password</label>
                  <div className="field-input-wrap">
                    <input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      className="field-input"
                      placeholder="Repeat new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="field-toggle-btn"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <FaEyeSlash size={15} /> : <FaEye size={15} />}
                    </button>
                  </div>
                </div>

                <button type="submit" className="auth-submit-btn" disabled={loading}>
                  {loading ? 'Updating...' : 'Reset Password'}
                </button>
              </form>
              
              <div style={{ marginTop: '24px', textAlign: 'center' }}>
                <Link to="/login" className="field-forgot-btn" style={{ fontSize: '13px' }}>
                  Cancel and return to login
                </Link>
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
};

export default ResetPasswordScreen;
