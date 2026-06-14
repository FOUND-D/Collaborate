import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { 
  FaBook, FaPlus, FaSearch, FaFilePdf, FaFileWord, FaVideo, FaLink, 
  FaFileAlt, FaRobot, FaThumbtack, FaTrash, FaUser, FaCalendarAlt, FaDownload, FaEye 
} from 'react-icons/fa';
import { 
  listResources, 
  createResource, 
  summariseResource, 
  deleteResource, 
  togglePinResource 
} from '../actions/resourceActions';
import { RESOURCE_CREATE_RESET } from '../constants/resourceConstants';
import Loader from '../components/Loader';
import './ResourcesScreen.css';

const ResourcesScreen = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [activeSummaryId, setActiveSummaryId] = useState(null);

  // New Resource Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [fileType, setFileType] = useState('PDF');
  const [tags, setTags] = useState('');
  const [teamId, setTeamId] = useState('');
  const [uploadingFile, setUploadingFile] = useState(false);
  const [fileName, setFileName] = useState('');

  const dispatch = useDispatch();

  const userLogin = useSelector((state) => state.userLogin);
  const { userInfo } = userLogin;

  const resourceList = useSelector((state) => state.resourceList);
  const { loading, error, resources } = resourceList;

  const resourceCreate = useSelector((state) => state.resourceCreate);
  const { loading: loadingCreate, success: successCreate, error: errorCreate } = resourceCreate;

  const teamList = useSelector((state) => state.teamList);
  const { teams } = teamList;

  useEffect(() => {
    dispatch(listResources());
  }, [dispatch]);

  useEffect(() => {
    if (successCreate) {
      setShowUploadModal(false);
      setTitle('');
      setDescription('');
      setFileUrl('');
      setFileType('PDF');
      setTags('');
      setTeamId('');
      setFileName('');
      dispatch({ type: RESOURCE_CREATE_RESET });
      dispatch(listResources());
    }
  }, [successCreate, dispatch]);

  const handleFileUploadChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingFile(true);
    setFileName(file.name);
    
    // Auto-detect type
    const ext = file.name.split('.').pop().toLowerCase();
    if (['pdf'].includes(ext)) setFileType('PDF');
    else if (['doc', 'docx'].includes(ext)) setFileType('DOC');
    else if (['mp4', 'mov', 'avi'].includes(ext)) setFileType('VIDEO');
    else setFileType('OTHER');

    const reader = new FileReader();
    reader.onload = () => {
      setFileUrl(reader.result);
      setUploadingFile(false);
    };
    reader.onerror = () => {
      setUploadingFile(false);
      alert('Failed to read file');
    };
    reader.readAsDataURL(file);
  };


  const handleUploadSubmit = (e) => {
    e.preventDefault();
    dispatch(createResource({
      title,
      description,
      file_url: fileUrl,
      file_type: fileType,
      tags: tags.split(',').map(t => t.trim()).filter(t => t),
      team_id: teamId || null
    }));
  };

  const handleSummarise = (id) => {
    if (activeSummaryId === id) {
      setActiveSummaryId(null);
    } else {
      setActiveSummaryId(id);
      const resource = resources.find(r => r.id === id);
      if (!resource.aiSummary) {
        dispatch(summariseResource(id));
      }
    }
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this resource?')) {
      dispatch(deleteResource(id));
    }
  };

  const handleTogglePin = (id) => {
    dispatch(togglePinResource(id));
  };

  const getFileIcon = (type) => {
    switch (type?.toUpperCase()) {
      case 'PDF': return <FaFilePdf className="file-icon pdf" />;
      case 'DOC':
      case 'DOCX': return <FaFileWord className="file-icon doc" />;
      case 'VIDEO': return <FaVideo className="file-icon video" />;
      case 'LINK': return <FaLink className="file-icon link" />;
      default: return <FaFileAlt className="file-icon other" />;
    }
  };

  // Filtering
  const uniqueTags = [...new Set(resources?.flatMap(r => r.tags || []) || [])];
  
  const filteredResources = resources?.filter(r => {
    const matchesSearch = r.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTag = selectedTag ? r.tags?.includes(selectedTag) : true;
    return matchesSearch && matchesTag;
  }) || [];

  return (
    <div className="resources-page">
      <header className="resources-header">
        <div className="header-left">
          <h1>Resources</h1>
          <p className="subtitle">Knowledge library and documentation shared by the community.</p>
        </div>
        <button className="add-resource-btn" onClick={() => setShowUploadModal(true)}>
          <FaPlus /> Upload Resource
        </button>
      </header>

      <div className="resources-filters">
        <div className="search-box">
          <FaSearch />
          <input 
            type="text" 
            placeholder="Search by title..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="tag-filters">
          <button 
            className={`tag-chip ${!selectedTag ? 'active' : ''}`}
            onClick={() => setSelectedTag('')}
          >
            All
          </button>
          {uniqueTags.map(tag => (
            <button 
              key={tag}
              className={`tag-chip ${selectedTag === tag ? 'active' : ''}`}
              onClick={() => setSelectedTag(tag)}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <Loader />
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : filteredResources.length === 0 ? (
        <div className="empty-state-container">
          <div className="empty-state-icon-wrapper">
            <FaBook size={48} />
          </div>
          <h2 className="empty-state-heading">No resources yet</h2>
          <p className="empty-state-subtext">Be the first to share helpful content with your peers!</p>
          <button className="primary-btn" onClick={() => setShowUploadModal(true)}>
            Add First Resource
          </button>
        </div>
      ) : (
        <div className="resources-grid">
          {filteredResources.map(resource => (
            <div key={resource.id} className={`resource-card ${resource.isPinned ? 'pinned' : ''}`}>
              {resource.isPinned && <FaThumbtack className="pin-icon" />}
              
              <div className="card-header">
                {getFileIcon(resource.fileType)}
                <span className="file-type-badge">{resource.fileType}</span>
                <button 
                  className={`ai-summary-btn ${activeSummaryId === resource.id ? 'active' : ''}`}
                  onClick={() => handleSummarise(resource.id)}
                  style={{ marginLeft: '8px', padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                >
                  <FaRobot /> AI Summary
                </button>
                <div className="card-actions">
                  {userInfo.role === 'faculty' || userInfo.role === 'admin' ? (
                    <button 
                      className={`action-icon-btn ${resource.isPinned ? 'active' : ''}`}
                      onClick={() => handleTogglePin(resource.id)}
                      title={resource.isPinned ? "Unpin" : "Pin to top"}
                    >
                      <FaThumbtack />
                    </button>
                  ) : null}
                  {(resource.uploaderId === userInfo._id || userInfo.role === 'admin') && (
                    <button 
                      className="action-icon-btn delete"
                      onClick={() => handleDelete(resource.id)}
                      title="Delete"
                    >
                      <FaTrash />
                    </button>
                  )}
                </div>
              </div>

              <h3 className="resource-title">{resource.title}</h3>
              <p className="resource-description">{resource.description}</p>
              
              <div className="resource-tags">
                {resource.tags?.map(tag => (
                  <span key={tag} className="resource-tag">{tag}</span>
                ))}
              </div>

              <div className="resource-meta">
                <div className="meta-item">
                  <FaUser /> 
                  {resource.uploaderId ? (
                    <Link to={`/profile/${resource.uploaderId}`} className="uploader-link" style={{ color: 'var(--teal-accent)', textDecoration: 'none' }}>
                      {resource.uploaderName || 'Anonymous'}
                    </Link>
                  ) : (
                    <span>{resource.uploaderName || 'Anonymous'}</span>
                  )}
                </div>
                <div className="meta-item">
                  <FaCalendarAlt /> {new Date(resource.createdAt).toLocaleDateString()}
                </div>
              </div>

              <div className="card-footer">
                <div className="footer-actions" style={{ width: '100%', display: 'flex', gap: '12px', marginTop: 'auto' }}>
                  <a 
                    href={resource.fileUrl} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="download-link"
                    style={{ flex: 1, justifyContent: 'center', background: 'transparent', color: 'var(--text-primary)', border: '1px solid var(--border-subtle)' }}
                  >
                    <FaEye /> View
                  </a>
                  <a 
                    href={resource.fileUrl} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="download-link"
                    style={{ flex: 1, justifyContent: 'center' }}
                    download={resource.title || 'resource'}
                  >
                    <FaDownload /> Download
                  </a>
                </div>
              </div>

              {activeSummaryId === resource.id && (
                <div className="ai-summary-section">
                  <h4><FaRobot /> AI Analysis</h4>
                  {resource.aiSummary ? (
                    <p>{resource.aiSummary}</p>
                  ) : (
                    <div className="summarising-loader">Generating summary...</div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="modal-overlay">
          <div className="modal-content resource-modal">
            <div className="modal-header">
              <h2>Upload Resource</h2>
              <button className="close-btn" onClick={() => setShowUploadModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleUploadSubmit}>
              <div className="form-group">
                <label>Title *</label>
                <input 
                  type="text" 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)} 
                  required 
                  placeholder="e.g. CS101 Lecture Notes - Week 5"
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What is this resource about?"
                />
              </div>
              <div className="form-row">
                <div className="form-group" style={{ flex: 2 }}>
                  <label>Resource File *</label>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input 
                      type="url" 
                      value={fileUrl} 
                      onChange={(e) => {
                        setFileUrl(e.target.value);
                        setFileName('');
                      }} 
                      required={!fileName} 
                      placeholder="https://docs.google.com/..."
                      disabled={!!fileName}
                      style={{ flex: 1 }}
                    />
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>OR</span>
                    <input 
                      type="file" 
                      id="resource-device-upload" 
                      hidden 
                      onChange={handleFileUploadChange} 
                    />
                    <button 
                      type="button" 
                      className="secondary-btn" 
                      onClick={() => document.getElementById('resource-device-upload').click()}
                      disabled={uploadingFile}
                      style={{ whiteSpace: 'nowrap' }}
                    >
                      {uploadingFile ? 'Reading...' : (fileName ? 'File Selected' : 'From Device')}
                    </button>
                  </div>
                  {fileName && (
                    <div style={{ fontSize: '12px', color: 'var(--teal-accent)', marginTop: '4px' }}>
                      Selected: {fileName}
                      <button 
                        type="button" 
                        onClick={() => { setFileName(''); setFileUrl(''); }}
                        style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', marginLeft: '8px', cursor: 'pointer' }}
                      >
                        (Clear)
                      </button>
                    </div>
                  )}
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Type</label>
                  <select value={fileType} onChange={(e) => setFileType(e.target.value)}>
                    <option value="PDF">PDF</option>
                    <option value="DOC">DOC / Word</option>
                    <option value="VIDEO">Video</option>
                    <option value="LINK">Link / Website</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Tags (comma separated)</label>
                <input 
                  type="text" 
                  value={tags} 
                  onChange={(e) => setTags(e.target.value)} 
                  placeholder="computer-science, notes, algorithms"
                />
              </div>
              <div className="form-group">
                <label>Share with Team (Optional)</label>
                <select value={teamId} onChange={(e) => setTeamId(e.target.value)}>
                  <option value="">University-wide</option>
                  {teams?.map(team => (
                    <option key={team._id} value={team._id}>{team.name}</option>
                  ))}
                </select>
              </div>
              
              {errorCreate && <div className="error-message">{errorCreate}</div>}
              
              <div className="modal-footer">
                <button type="button" className="secondary-btn" onClick={() => setShowUploadModal(false)}>Cancel</button>
                <button type="submit" className="primary-btn" disabled={loadingCreate}>
                  {loadingCreate ? 'Uploading...' : 'Upload Resource'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResourcesScreen;
