import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { FaArrowRight, FaEye, FaEyeSlash, FaGoogle, FaUpload } from 'react-icons/fa';
import { register } from '../actions/userActions';
import Loader from '../components/Loader';
import '../styles/auth.css';

const RegisterScreen = () => {
  const yearOptions = [
    { value: '1', label: '1' },
    { value: '2', label: '2' },
    { value: '3', label: '3' },
    { value: '4', label: '4' },
    { value: '5', label: 'PG-1' },
    { value: '6', label: 'PG-2' },
    { value: '7', label: 'Faculty' },
  ];
  const roleOptions = [
    { value: 'undergrad', label: 'Undergrad' },
    { value: 'postgrad', label: 'Postgrad' },
    { value: 'faculty', label: 'Faculty' },
  ];

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState('');
  const [yearOfStudy, setYearOfStudy] = useState('1');
  const [studentId, setStudentId] = useState('');
  const [role, setRole] = useState('undergrad');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [message, setMessage] = useState(null);
  const [image, setImage] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();

  const userLogin = useSelector((state) => state.userLogin);
  const { userInfo } = userLogin;

  const userRegister = useSelector((state) => state.userRegister);
  const { loading, error } = userRegister;

  const redirect = location.search ? location.search.split('=')[1] : '/dashboard';

  useEffect(() => {
    if (userInfo) {
      navigate(redirect, { replace: true });
    }
  }, [navigate, userInfo, redirect]);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      setPreviewUrl(dataUrl);
      setImage(dataUrl);
      setUploading(false);
    };
    reader.onerror = () => {
      setUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const submitHandler = (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setMessage('Passwords do not match');
      return;
    }
    if (!department) {
      setMessage('Please select your department');
      return;
    }

    setMessage(null);
    const finalYear = role === 'faculty' ? 7 : Number(yearOfStudy);
    dispatch(register(name, email, password, image, department, role, finalYear, studentId));
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
            <div className="auth-attribution-avatar auth-avatar-accent">S</div>
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
            <div className="auth-avatar auth-avatar-accent">A</div>
            <div className="auth-avatar auth-avatar-accent-soft">M</div>
            <div className="auth-avatar auth-avatar-accent-strong">S</div>
            <div className="auth-avatar auth-avatar-accent-warm">R</div>
            <div className="auth-avatar auth-avatar-count">+2k</div>
          </div>
          <p className="auth-proof-text">Join <strong>2,000+</strong> teams already using Collaborate</p>
        </div>
      </aside>

      <section className="auth-right">
        <div className="auth-form-wrap">
          <div className="auth-form-header">
            <h1>Create your account</h1>
            <p>Already have an account? <Link to="/login">Log in</Link>.</p>
          </div>

          {message && <div className="field-error-msg">{message}</div>}
          {error && <div className="field-error-msg">{error}</div>}

          <form className="auth-form" onSubmit={submitHandler}>
            <div className="field-group">
              <label className="field-label">I am a</label>
              <div className="role-toggle-group">
                <button 
                  type="button" 
                  className={`role-toggle-btn ${role !== 'faculty' ? 'active' : ''}`}
                  onClick={() => setRole('undergrad')}
                >
                  🎓 Student
                </button>
                <button 
                  type="button" 
                  className={`role-toggle-btn ${role === 'faculty' ? 'active' : ''}`}
                  onClick={() => setRole('faculty')}
                >
                  👨‍🏫 Faculty
                </button>
              </div>
              {role === 'faculty' && (
                <p className="role-info-note">
                  Faculty accounts require prior approval. Your email must be registered by your administrator.
                </p>
              )}
            </div>

            <div className="field-group">
              <label className="field-label" htmlFor="name">Full name</label>
              <input
                id="name"
                type="text"
                className="field-input"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

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
              <label className="field-label" htmlFor="department">Department</label>
              <input
                id="department"
                type="text"
                className="field-input"
                placeholder="Enter your department"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
              />
            </div>

            <div className="field-group">
              <label className="field-label" htmlFor="yearOfStudy">Year of study</label>
              <select
                id="yearOfStudy"
                className="field-input"
                value={yearOfStudy}
                onChange={(e) => setYearOfStudy(e.target.value)}
              >
                {yearOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>

            {role !== 'faculty' && (
              <div className="field-group">
                <label className="field-label" htmlFor="role">Student Level</label>
                <select
                  id="role"
                  className="field-input"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                >
                  <option value="undergrad">Undergrad</option>
                  <option value="postgrad">Postgrad</option>
                </select>
              </div>
            )}

            <div className="field-group">
              <label className="field-label" htmlFor="studentId">
                Student ID <span className="field-optional">(optional)</span>
              </label>
              <input
                id="studentId"
                type="text"
                className="field-input"
                placeholder="Enter your student ID"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
              />
            </div>

            <div className="field-group">
              <label className="field-label" htmlFor="password">Password</label>
              <div className="field-input-wrap">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className="field-input"
                  placeholder="Create a password"
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

            <div className="field-group">
              <label className="field-label" htmlFor="confirmPassword">Confirm password</label>
              <div className="field-input-wrap">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  className="field-input"
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="field-toggle-btn"
                  onClick={() => setShowConfirmPassword((value) => !value)}
                >
                  {showConfirmPassword ? <FaEyeSlash size={15} /> : <FaEye size={15} />}
                </button>
              </div>
            </div>

            <div className="field-group">
              <label className="field-label" htmlFor="image-file">
                Profile image <span className="field-optional">(optional)</span>
              </label>
              <div
                className={`upload-zone ${previewUrl ? 'has-preview' : ''}`}
                onClick={() => fileInputRef.current?.click()}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
              >
                {previewUrl ? (
                  <>
                    <img src={previewUrl} className="upload-preview-img" alt="preview" />
                    <span className="upload-preview-label">Click to change</span>
                  </>
                ) : (
                  <>
                    <div className="upload-icon"><FaUpload size={13} /></div>
                    <span className="upload-label">Upload a photo</span>
                    <span className="upload-sublabel">PNG, JPG up to 25MB</span>
                  </>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  id="image-file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleFileChange}
                />
              </div>
              {uploading && <Loader />}
            </div>

            <button type="submit" className="auth-submit-btn" disabled={loading}>
              {loading ? 'Creating account...' : <>Create account <FaArrowRight className="btn-arrow" /></>}
            </button>

            <div className="auth-divider"><span>or continue with</span></div>

            <button type="button" className="auth-google-btn">
              <FaGoogle size={14} /> Google
            </button>
          </form>

          <p className="auth-switch-text">
            Already have an account? <Link to="/login">Log in</Link>
          </p>

          <p className="auth-terms">
            By creating an account, you agree to our{' '}
            <a href="/terms">Terms of Service</a> and{' '}
            <a href="/privacy">Privacy Policy</a>.
          </p>
        </div>
      </section>
    </div>
  );
};

export default RegisterScreen;
