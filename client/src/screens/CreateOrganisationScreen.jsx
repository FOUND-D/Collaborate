import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { createOrganisation } from '../actions/organisationActions';

const CreateOrganisationScreen = () => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [logo, setLogo] = useState('');
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const submitHandler = async (e) => {
    e.preventDefault();
    const action = await dispatch(createOrganisation(name, description, logo));
    if (action?.payload?._id) navigate(`/organisations/${action.payload._id}`);
  };

  return (
    <div className="home-dashboard-page">
      <div className="create-org-form">
        <div className="create-org-header">
          <h1>Create Organisation</h1>
          <p>Set up a workspace for multiple teams.</p>
        </div>
        <form onSubmit={submitHandler}>
          <div className="field-group">
            <label className="field-label">Organisation name</label>
            <input className="field-input" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="field-group">
            <label className="field-label">Description</label>
            <textarea className="field-input field-textarea" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="field-group">
            <label className="field-label">Logo URL</label>
            <input className="field-input" value={logo} onChange={(e) => setLogo(e.target.value)} />
          </div>
          <button className="auth-submit-btn" type="submit">Create Organisation</button>
        </form>
      </div>
    </div>
  );
};

export default CreateOrganisationScreen;
