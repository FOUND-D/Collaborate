import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { FaArrowRight, FaEye, FaEyeSlash, FaGoogle } from 'react-icons/fa';
import { login } from '../actions/userActions';
import '../styles/auth.css';

const LoginScreen = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const [email, setEmail] = useState(() => params.get('email') || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const userLogin = useSelector((state) => state.userLogin);
  const { loading, error, userInfo } = userLogin;

  const redirect = params.get('redirect') || '/dashboard';
  const provisioned = params.get('provisioned') === '1';

  useEffect(() => {
    if (userInfo) {
      navigate(redirect, { replace: true });
    }
  }, [navigate, userInfo, redirect]);

  const submitHandler = (e) => {
    e.preventDefault();
    dispatch(login(email, password));
  };

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
          <p className="auth-left-eyebrow">Trusted by teams at</p>
          <div className="auth-left-companies">
            <span>Acme</span>
            <span>Lightspeed</span>
            <span>Vertex</span>
            <span>NovaCo</span>
          </div>
          <blockquote className="auth-left-quote">
            "Finally a tool where our whole team actually stays on the same page."
          </blockquote>
          <div className="auth-left-attribution">
            <div className="auth-attribution-avatar" style={{ background: '#3b82f6' }}>S</div>
            <div>
              <p className="auth-attribution-name">Sarah K.</p>
              <p className="auth-attribution-role">Head of Product, Vertex</p>
            </div>
          </div>
          <ul className="auth-feature-list">
            <li>AI-assisted project planning</li>
            <li>Real-time team collaboration</li>
            <li>Unified tasks, chat, and reporting</li>
          </ul>
        </div>

        <div className="auth-left-bottom">
          <div className="auth-avatar-stack">
            <div className="auth-avatar" style={{ background: '#3b82f6' }}>A</div>
            <div className="auth-avatar" style={{ background: '#8b5cf6' }}>M</div>
            <div className="auth-avatar" style={{ background: '#10b981' }}>S</div>
            <div className="auth-avatar" style={{ background: '#f59e0b' }}>R</div>
            <div className="auth-avatar auth-avatar-count">+2k</div>
          </div>
          <p className="auth-proof-text">Join <strong>2,000+</strong> teams already using Collaborate</p>
        </div>
      </aside>

      <section className="auth-right">
        <div className="auth-form-wrap">
          <div className="auth-form-header">
            <h1>Welcome back</h1>
            <p>Sign in to continue to Collaborate. <Link to="/register">Sign up free</Link>.</p>
          </div>

          {provisioned && (
            <div className="field-info-msg">
              Use the provisioned email and temporary password shared by your organisation admin. After sign-in, you will be sent to your onboarding flow.
            </div>
          )}

          {error && <div className="field-error-msg">{error}</div>}

          <form className="auth-form" onSubmit={submitHandler}>
            <div className="field-group">
              <label className="field-label" htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                className="field-input"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="field-group">
              <div className="field-row-between">
                <label className="field-label" htmlFor="password" style={{ margin: 0 }}>Password</label>
                <a href="#forgot-password" className="field-forgot">Forgot password?</a>
              </div>
              <div className="field-input-wrap">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className="field-input"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="field-toggle-btn"
                  onClick={() => setShowPassword((value) => !value)}
                >
                  {showPassword ? <FaEyeSlash size={15} /> : <FaEye size={15} />}
                </button>
              </div>
            </div>

            <button type="submit" className="auth-submit-btn" disabled={loading}>
              {loading ? 'Signing in...' : <>Sign in <FaArrowRight className="btn-arrow" /></>}
            </button>

            <div className="auth-divider"><span>or continue with</span></div>

            <button type="button" className="auth-google-btn">
              <FaGoogle size={14} /> Google
            </button>
          </form>

          <p className="auth-switch-text">
            Don't have an account? <Link to="/register">Sign up free</Link>
          </p>
        </div>
      </section>
    </div>
  );
};

export default LoginScreen;
