import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaArrowRight } from 'react-icons/fa';
import { useDispatch } from 'react-redux';
import { createOrganisation } from '../actions/organisationActions';
import '../styles/auth.css';
import './OrganisationScreens.css';

const slugify = (value) => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

const CreateOrganisationScreen = () => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [logo, setLogo] = useState('');
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const previewInitial = useMemo(() => (name ? name.charAt(0).toUpperCase() : 'C'), [name]);
  const previewSlug = useMemo(() => (name ? slugify(name) : 'your-organisation'), [name]);

  const submitHandler = async (e) => {
    e.preventDefault();
    try {
      const org = await dispatch(createOrganisation(name, description, logo));
      if (org?._id) {
        navigate(`/organisations/${org._id}`);
      }
    } catch (err) {
      console.error('Failed to create organisation:', err);
    }
  };

  return (
    <div className="create-org-page dashboard-page">
      <Link to="/organisations" className="create-org-breadcrumb"><FaArrowLeft /> Back to organisations</Link>
      <div className="create-org-header">
        <h1>Create Organisation</h1>
        <p>Set up a workspace for multiple teams.</p>
      </div>
      <div className="create-org-card">
        <div className="org-preview-row">
          <div className="org-preview-avatar">{previewInitial}</div>
          <div className="org-preview-info">
            <div className={`org-preview-name ${name ? '' : 'placeholder'}`}>{name || 'Your organisation name'}</div>
            <div className="org-preview-slug">{previewSlug}</div>
          </div>
        </div>

        <form onSubmit={submitHandler}>
          <div className="field-group">
            <label className="field-label">Organisation name</label>
            <input className="field-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Acme Corp" />
          </div>
          <div className="field-group">
            <label className="field-label">Description</label>
            <textarea className="field-input field-textarea" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What does your organisation do?" />
          </div>
          <div className="field-group">
            <label className="field-label">Logo URL</label>
            <input className="field-input" value={logo} onChange={(e) => setLogo(e.target.value)} placeholder="https://..." />
          </div>
          <div className="create-org-actions">
            <button type="button" className="btn-cancel" onClick={() => navigate('/organisations')}>Cancel</button>
            <button className="btn-submit-inline" type="submit">Create Organisation <FaArrowRight /></button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateOrganisationScreen;
