import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { getUserDetails, updateUserProfile } from '../actions/userActions';
import Loader from '../components/Loader';
import Message from '../components/Message';
import './ProfileScreen.css'; // Import the new CSS file

const ProfileScreen = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const [techStack, setTechStack] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState(null);
  const [showPasswordFields, setShowPasswordFields] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const userDetails = useSelector((state) => state.userDetails);
  const { loading, error, user } = userDetails;

  const userLogin = useSelector((state) => state.userLogin);
  const { userInfo } = userLogin;

  const userUpdateProfile = useSelector((state) => state.userUpdateProfile);
  const { success } = userUpdateProfile;

  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (!userInfo) {
      navigate('/login');
    } else {
      if (!user || !user.name || success) {
        dispatch({ type: 'USER_UPDATE_PROFILE_RESET' });
        dispatch(getUserDetails('profile'));
      } else {
        setName(user.name);
        setEmail(user.email);
        setRole(user.role);
        if (Array.isArray(user.techStack)) {
          setTechStack(user.techStack.join(','));
        }
      }
    }
  }, [dispatch, navigate, userInfo, user, success]);

  useEffect(() => {
    if (user) {
      const isNameChanged = name !== user.name;
      const isEmailChanged = email !== user.email;
      const isRoleChanged = role !== user.role;
      const isTechStackChanged = techStack !== (Array.isArray(user.techStack) ? user.techStack.join(',') : '');
      const isPasswordChanged = password !== '';
      setIsDirty(isNameChanged || isEmailChanged || isRoleChanged || isTechStackChanged || isPasswordChanged);
    }
  }, [name, email, role, techStack, password, user]);

  const submitHandler = (e) => {
    e.preventDefault();
    if (showPasswordFields && password !== confirmPassword) {
      setMessage('Passwords do not match');
    } else {
      const updatedData = {
        id: user._id,
        name,
        email,
        role,
        techStack: techStack.split(','),
      };
      if (showPasswordFields && password) {
        updatedData.password = password;
      }
      dispatch(updateUserProfile(updatedData));
    }
  };

  return (
    <div className="profile-page-wrapper">
      <div className="profile-card-container">
        <h2>User Profile</h2>
        {message && <Message variant="danger">{message}</Message>}
        {error && <Message variant="danger">{error}</Message>}
        {success && <Message variant="success">Profile Updated</Message>}
        {loading && (
          <div className="loader-container">
            <Loader />
          </div>
        )}
        <form onSubmit={submitHandler}>
          <div className="form-group">
            <label htmlFor="name">Name</label>
            <input
              type="text"
              id="name"
              placeholder="Enter your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label htmlFor="role">Role</label>
            <input
              type="text"
              id="role"
              placeholder="Enter your role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label htmlFor="techStack">Tech Stack (comma separated)</label>
            <input
              type="text"
              id="techStack"
              placeholder="e.g., React, Node.js, MongoDB"
              value={techStack}
              onChange={(e) => setTechStack(e.target.value)}
            />
          </div>

          {showPasswordFields && (
            <>
              <div className="form-group">
                <label htmlFor="password">New Password</label>
                <input
                  type="password"
                  id="password"
                  placeholder="Enter new password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm New Password</label>
                <input
                  type="password"
                  id="confirmPassword"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </>
          )}

          <div className="profile-buttons-container">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setShowPasswordFields(!showPasswordFields)}
            >
              {showPasswordFields ? 'Cancel' : 'Change Password'}
            </button>
            <button type="submit" className="btn btn-primary" disabled={!isDirty}>
              Update
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileScreen;
