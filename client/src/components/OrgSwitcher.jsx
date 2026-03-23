import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { FaChevronDown, FaPlus } from 'react-icons/fa';
import { setCurrentOrganisation } from '../actions/organisationActions';

const OrgSwitcher = ({ collapsed = false }) => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const orgCurrent = useSelector((state) => state.orgCurrent);
  const orgList = useSelector((state) => state.orgList);
  const currentOrg = orgCurrent.organisation || orgList.organisations?.[0];
  const organisations = orgList.organisations || [];

  if (!currentOrg) {
    return (
      <button className="org-switcher" onClick={() => navigate('/organisations/create')}>
        <div className="org-avatar">+</div>
        {!collapsed && <span className="org-name">Create organisation</span>}
      </button>
    );
  }

  const selectOrg = (org) => {
    dispatch(setCurrentOrganisation(org));
    navigate(`/organisations/${org._id}`);
    setOpen(false);
  };

  return (
    <div style={{ position: 'relative' }}>
      <button className="org-switcher" onClick={() => setOpen((v) => !v)}>
        <div className="org-avatar">{currentOrg.name.charAt(0).toUpperCase()}</div>
        {!collapsed && <span className="org-name">{currentOrg.name}</span>}
        {!collapsed && <FaChevronDown className="org-chevron" />}
      </button>
      {open && !collapsed && (
        <div className="org-dropdown">
          {organisations.map((org) => (
            <div
              key={org._id}
              className={`org-dropdown-item ${currentOrg._id === org._id ? 'active' : ''}`}
              onClick={() => selectOrg(org)}
            >
              <div className="org-avatar">{org.name.charAt(0).toUpperCase()}</div>
              <span>{org.name}</span>
            </div>
          ))}
          <div className="org-dropdown-divider" />
          <div className="org-dropdown-create" onClick={() => navigate('/organisations/create')}>
            <FaPlus size={11} /> Create new org
          </div>
        </div>
      )}
    </div>
  );
};

export default OrgSwitcher;
