import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom'; // Import useLocation and useNavigate
import { useDispatch, useSelector } from 'react-redux';
import { login } from '../actions/userActions';
// import FormContainer from '../components/FormContainer'; // Removed
import AuthLayout from '../components/AuthLayout'; // New import
import { FaLock } from 'react-icons/fa';

const LoginScreen = () => { // Remove location and history props
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const dispatch = useDispatch();
  const location = useLocation(); // Use useLocation hook
  const navigate = useNavigate(); // Use useNavigate hook

  const userLogin = useSelector((state) => state.userLogin);
  const { loading, error, userInfo } = userLogin;

  const redirect = location.search ? location.search.split('=')[1] : '/';

  useEffect(() => {
    if (userInfo) {
      navigate(redirect); // Use navigate instead of history.push
    }
  }, [navigate, userInfo, redirect]); // Update dependencies

  const submitHandler = (e) => {
    e.preventDefault();
    dispatch(login(email, password));
  };

  return (
    <AuthLayout>
      <div className="auth-form-content">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '1rem' }}>
          <div style={{
            background: 'rgba(46, 140, 251, 0.1)',
            padding: '12px',
            borderRadius: '50%',
            marginBottom: '1rem',
            color: 'var(--accent-color)'
          }}>
            <FaLock size={24} />
          </div>
          <h1 className="auth-title" style={{ marginBottom: '0.5rem' }}>Welcome Back</h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Please enter your details to sign in.</p>
        </div>
        {error && <h3 className="auth-error-message">{error}</h3>}
        {loading && <h3 className="auth-loading-message">Loading...</h3>}
        <form onSubmit={submitHandler} className="auth-form">
          <div className="form-group floating-label">
            <input
              type="email"
              id="email"
              placeholder=" " /* Important for floating label */
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="form-input"
            />
            <label htmlFor="email">Email Address</label>
          </div>
          <div className="form-group floating-label">
            <input
              type="password"
              id="password"
              placeholder=" " /* Important for floating label */
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="form-input"
            />
            <label htmlFor="password">Password</label>
          </div>
          <button type="submit" className="btn btn-primary btn-full-width">Sign In</button>
        </form>
        <div className="auth-link-container">
          New Customer?{' '}
          <Link to={redirect ? `/register?redirect=${redirect}` : '/register'} className="auth-link">
            Register
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
};

export default LoginScreen;
