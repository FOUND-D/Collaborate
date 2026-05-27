import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  updateUserProfile,
  updateUserProfileImage,
} from '../actions/userActions';
import { listRatings } from '../actions/ratingActions';
import { BACKEND_URL } from '../config/runtime';
import Loader from '../components/Loader';
import Message from '../components/Message';
import { FaStar, FaRegStar } from 'react-icons/fa';
import './ProfileScreen.css'; // Import the new CSS file

const yearOptions = [
  { value: '1', label: '1' },
  { value: '2', label: '2' },
  { value: '3', label: '3' },
  { value: '4', label: '4' },
  { value: '5', label: 'PG-1' },
  { value: '6', label: 'PG-2' },
  { value: '7', label: 'Faculty' },
];

const ProfileScreen = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const [department, setDepartment] = useState('');
  const [yearOfStudy, setYearOfStudy] = useState('');
  const [studentId, setStudentId] = useState('');
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

  const ratingList = useSelector((state) => state.ratingList);
  const { ratings = [] } = ratingList;

  const [isDirty, setIsDirty] = useState(false);

  const uploadFileHandler = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);

    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result;
      setImage(dataUrl);
      try {
        await dispatch(updateUserProfileImage({ image: dataUrl }));
      } finally {
        setUploading(false);
      }
    };
    reader.onerror = () => {
      setUploading(false);
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    if (!userInfo) {
      navigate('/login');
    } else {
      dispatch(listRatings(userInfo._id));
      setName(userInfo.name);
      setEmail(userInfo.email);
      setRole(userInfo.role);
      setDepartment(userInfo.department || '');
      setYearOfStudy(userInfo.yearOfStudy ? String(userInfo.yearOfStudy) : '');
      setStudentId(userInfo.studentId || '');
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
      const isDepartmentChanged = department !== (userInfo.department || '');
      const isYearChanged = yearOfStudy !== (userInfo.yearOfStudy ? String(userInfo.yearOfStudy) : '');
      const isStudentIdChanged = studentId !== (userInfo.studentId || '');
      const isTechStackChanged =
        techStack !== (Array.isArray(userInfo.techStack) ? userInfo.techStack.join(',') : '');
      const isPasswordChanged = password !== '';
      setIsDirty(
        isNameChanged ||
        isEmailChanged ||
        isRoleChanged ||
        isDepartmentChanged ||
        isYearChanged ||
        isStudentIdChanged ||
        isTechStackChanged ||
        isPasswordChanged
      );
    }
  }, [name, email, role, department, yearOfStudy, studentId, techStack, password, userInfo]);

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
        department,
        yearOfStudy: yearOfStudy ? Number(yearOfStudy) : null,
        studentId,
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
        <div className="profile-header-main">
            <h2>User Profile</h2>
            <div className="profile-rating-display">
                {userInfo?.avg_rating ? (
                    <>
                        <div className="profile-stars">
                            {[1, 2, 3, 4, 5].map((i) => (
                                i <= Math.round(userInfo.avg_rating) 
                                ? <FaStar key={i} className="star-filled" /> 
                                : <FaRegStar key={i} className="star-empty" />
                            ))}
                        </div>
                        <span className="rating-text">
                            {userInfo.avg_rating.toFixed(1)} / 5.0 ({ratings.length} ratings)
                        </span>
                    </>
                ) : (
                    <span className="rating-text muted">Not yet rated</span>
                )}
            </div>
        </div>
        {message && <Message variant="danger">{message}</Message>}
        {error && <Message variant="danger">{error}</Message>}
        {success && <Message variant="success">Profile Updated</Message>}
        {loading && (
          <div className="loader-container">
            <Loader />
          </div>
        )}
        <div
          style={{
            marginBottom: '1rem',
            padding: '0.85rem 1rem',
            borderRadius: '12px',
            border: '1px solid var(--border-color)',
            background: 'var(--background-secondary-cards)',
            display: 'inline-flex',
            gap: '0.5rem',
            alignItems: 'center',
          }}
        >
          <strong>Credits:</strong> <span>{userInfo?.credits ?? 50}</span>
        </div>
        <img
          src={
            image && image.startsWith('data:image')
              ? image
              : `${BACKEND_URL}${image}`
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
                {uploading ? 'Uploading...' : 'PNG, JPG up to 25MB'}
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
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="undergrad">Undergrad</option>
              <option value="postgrad">Postgrad</option>
              <option value="faculty">Faculty</option>
              {userInfo?.role === 'admin' && <option value="admin">Admin</option>}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="department">Department</label>
            <input
              type="text"
              id="department"
              placeholder="Enter your department"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label htmlFor="yearOfStudy">Year of Study</label>
            <select
              id="yearOfStudy"
              value={yearOfStudy}
              onChange={(e) => setYearOfStudy(e.target.value)}
            >
              <option value="">Select year</option>
              {yearOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="studentId">Student ID</label>
            <input
              type="text"
              id="studentId"
              placeholder="Enter your student ID"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
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
