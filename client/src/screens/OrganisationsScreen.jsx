import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { FaPlus } from 'react-icons/fa';
import { listMyOrganisations } from '../actions/organisationActions';

const OrganisationsScreen = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const orgList = useSelector((state) => state.orgList);
  const { organisations = [], loading } = orgList;

  useEffect(() => {
    dispatch(listMyOrganisations());
  }, [dispatch]);

  return (
    <div className="home-dashboard-page">
      <div className="dashboard-header">
        <div className="header-content">
          <h1 className="welcome-title">Your Organisations</h1>
          <p className="welcome-subtitle">Create or open an organisation to manage teams and projects.</p>
        </div>
        <button className="onboarding-banner-btn" onClick={() => navigate('/organisations/create')}>
          <FaPlus /> Create Organisation
        </button>
      </div>
      {loading ? null : organisations.length === 0 ? (
        <div className="onboarding-banner">
          <div className="onboarding-banner-text">
            <h3>No organisations yet</h3>
            <p>Create your first organisation to start collaborating with your team.</p>
          </div>
        </div>
      ) : (
        <div className="action-cards-grid">
          {organisations.map((org) => (
            <div key={org._id} className="action-card" onClick={() => navigate(`/organisations/${org._id}`)}>
              <h3 className="action-card-title">{org.name}</h3>
              <p className="action-card-description">{org.slug}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrganisationsScreen;
