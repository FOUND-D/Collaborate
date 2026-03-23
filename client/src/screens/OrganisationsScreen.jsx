import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { FaArrowRight, FaBuilding, FaPlus } from 'react-icons/fa';
import { listMyOrganisations } from '../actions/organisationActions';
import '../styles/auth.css';
import './OrganisationScreens.css';

const OrganisationsScreen = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const orgList = useSelector((state) => state.orgList);
  const { organisations = [], loading } = orgList;

  useEffect(() => {
    dispatch(listMyOrganisations());
  }, [dispatch]);

  return (
    <div className="orgs-page">
      <div className="orgs-page-header">
        <div>
          <h1>Your Organisations</h1>
          <p>Create or open an organisation to manage teams and projects.</p>
        </div>
        <button className="btn-create" onClick={() => navigate('/organisations/create')}><FaPlus /> Create Organisation</button>
      </div>
      {loading ? null : organisations.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><FaBuilding /></div>
          <div className="empty-state-title">No organisations yet</div>
          <div className="empty-state-sub">Create your first organisation to start collaborating with your team.</div>
          <button className="btn-create" onClick={() => navigate('/organisations/create')}><FaPlus /> Create Organisation</button>
        </div>
      ) : (
        <div className="orgs-grid">
          {organisations.map((org) => (
            <div key={org._id} className="org-card" onClick={() => navigate(`/organisations/${org._id}`)}>
              <div className="org-card-header">
                <div className="org-card-avatar">{org.name.charAt(0).toUpperCase()}</div>
                <div className="org-card-title">
                  <div className="org-card-name">{org.name}</div>
                  <div className="org-card-slug">{org.slug}</div>
                </div>
                <div className={`org-card-role ${org.role || 'member'}`}>{org.role || 'member'}</div>
              </div>
              <div className="org-card-stats">
                <div className="org-stat"><div className="org-stat-value">{org.members?.length || 0}</div><div className="org-stat-label">Members</div></div>
                <div className="org-stat"><div className="org-stat-value">{org.teams?.length || 0}</div><div className="org-stat-label">Teams</div></div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrganisationsScreen;
