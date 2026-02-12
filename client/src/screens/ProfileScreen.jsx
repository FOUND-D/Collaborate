import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import api, { HARDCODED_BACKEND_URL } from '../utils/api';
import {
  getUserDetails,
  updateUserProfile,
  updateUserProfileImage,
} from '../actions/userActions';
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
  const [image, setImage] = useState('');
  const [uploading, setUploading] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const userLogin = useSelector((state) => state.userLogin);
  const { userInfo } = userLogin;

  const userUpdateProfile = useSelector((state) => state.userUpdateProfile);
  const { success, loading, error } = userUpdateProfile;

  const [isDirty, setIsDirty] = useState(false);

  const uploadFileHandler = async (e) => {
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('image', file);
    setUploading(true);

    try {
      const config = {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      };

      const { data } = await api.post('/api/upload', formData, config);

      setImage(data);
      await dispatch(updateUserProfileImage({ image: data }));
      setUploading(false);
    } catch (error) {
      console.error(error);
      setUploading(false);
    }
  };

  useEffect(() => {
    if (!userInfo) {
      navigate('/login');
    } else {
      setName(userInfo.name);
      setEmail(userInfo.email);
      setRole(userInfo.role);
      if (Array.isArray(userInfo.techStack)) {
        setTechStack(userInfo.techStack.join(','));
      }
      if (userInfo.profileImage) {
        setImage(userInfo.profileImage);
      }
    }
  }, [dispatch, navigate, userInfo]);

  useEffect(() => {
    if (userInfo) {
      const isNameChanged = name !== userInfo.name;
      const isEmailChanged = email !== userInfo.email;
      const isRoleChanged = role !== userInfo.role;
      const isTechStackChanged =
        techStack !== (Array.isArray(userInfo.techStack) ? userInfo.techStack.join(',') : '');
      const isPasswordChanged = password !== '';
      setIsDirty(
        isNameChanged ||
        isEmailChanged ||
        isRoleChanged ||
        isTechStackChanged ||
        isPasswordChanged
      );
    }
  }, [name, email, role, techStack, password, userInfo]);

  const submitHandler = (e) => {
    e.preventDefault();
    if (showPasswordFields && password !== confirmPassword) {
      setMessage('Passwords do not match');
    } else {
      const updatedData = {
        id: userInfo._id,
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
        <img
          src={
            image && image.startsWith('data:image')
              ? image
              : `${HARDCODED_BACKEND_URL}${image}`
          }
          alt={name}
          className="profile-image"
        />
        <form onSubmit={submitHandler}>
          <div className="form-group">
            <label htmlFor="image">Image</label>
            <input
              type="text"
              id="image"
              placeholder="Enter image url"
              value={image}
              onChange={(e) => setImage(e.target.value)}
              style={{ display: 'none' }}
            />
            <div className="file-input-wrapper">
              <label htmlFor="image-file" className="btn-secondary" style={{ display: 'inline-block', cursor: 'pointer', marginBottom: '0.5rem' }}>
                Change Profile Photo
              </label>
              <input
                type="file"
                id="image-file"
                label="Choose File"
                custom
                onChange={uploadFileHandler}
                style={{ display: 'none' }}
              />
              <span style={{ marginLeft: '10px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                {uploading ? 'Uploading...' : ''}
              </span>
            </div>
            {uploading && <Loader />}
          </div>
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
