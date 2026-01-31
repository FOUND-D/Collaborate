import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom'; // Import useLocation and useNavigate
import { useDispatch, useSelector } from 'react-redux';
import { register } from '../actions/userActions';
// import FormContainer from '../components/FormContainer'; // Removed
import AuthLayout from '../components/AuthLayout'; // New import

const RegisterScreen = () => { // Remove location and history props
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState(null);

  const dispatch = useDispatch();
  const location = useLocation(); // Use useLocation hook
  const navigate = useNavigate(); // Use useNavigate hook

  const userRegister = useSelector((state) => state.userRegister);
  const { loading, error, userInfo } = userRegister;

  const redirect = location.search ? location.search.split('=')[1] : '/';

  useEffect(() => {
    if (userInfo) {
      navigate(redirect); // Use navigate instead of history.push
    }
  }, [navigate, userInfo, redirect]); // Update dependencies

  const submitHandler = (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setMessage('Passwords do not match');
    } else {
      dispatch(register(name, email, password));
    }
  };

  return (
    <AuthLayout>
      <div className="auth-form-content">
        <h1 className="auth-title">Sign Up</h1>
        {message && <h3 className="auth-error-message">{message}</h3>}
        {error && <h3 className="auth-error-message">{error}</h3>}
        {loading && <h3 className="auth-loading-message">Loading...</h3>}
        <form onSubmit={submitHandler} className="auth-form">
          <div className="form-group floating-label">
            <input
              type="text" // Changed from 'name' to 'text' as 'name' is not a standard HTML type for text input
              id="name"
              placeholder=" "
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="form-input"
            />
            <label htmlFor="name">Name</label>
          </div>
          <div className="form-group floating-label">
            <input
              type="email"
              id="email"
              placeholder=" "
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
              placeholder=" "
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="form-input"
            />
            <label htmlFor="password">Password</label>
          </div>
          <div className="form-group floating-label">
            <input
              type="password"
              id="confirmPassword"
              placeholder=" "
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="form-input"
            />
            <label htmlFor="confirmPassword">Confirm Password</label>
          </div>
          <button type="submit" className="btn btn-primary btn-full-width">Register</button>
        </form>
        <div className="auth-link-container">
          Have an Account?{' '}
          <Link to={redirect ? `/login?redirect=${redirect}` : '/login'} className="auth-link">
            Login
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
};

export default RegisterScreen;
