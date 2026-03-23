import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { FaChevronDown, FaCheck, FaPlus } from 'react-icons/fa';
import { setCurrentOrganisation } from '../actions/organisationActions';

const OrgSwitcher = ({ collapsed = false }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const ref = useRef(null);
  const [open, setOpen] = useState(false);
  const orgCurrent = useSelector((state) => state.orgCurrent);
  const orgList = useSelector((state) => state.orgList);
  const currentOrg = orgCurrent.organisation || orgList.organisations?.[0];
  const organisations = orgList.organisations || [];

  useEffect(() => {
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  if (!currentOrg) {
    return (
      <div className="sidebar-org-section" ref={ref}>
        <button className="sidebar-create-org-btn" onClick={() => navigate('/organisations/create')}>
          <div className="sidebar-create-org-btn-icon"><FaPlus /></div>
          {!collapsed && <span className="sidebar-create-org-btn-label">Create organisation</span>}
        </button>
      </div>
    );
  }

  const selectOrg = (org) => {
    dispatch(setCurrentOrganisation(org));
    navigate(`/organisations/${org._id}`);
    setOpen(false);
  };

  return (
    <div className="sidebar-org-section" ref={ref}>
      <div className={`org-switcher ${open ? 'open' : ''}`} onClick={() => setOpen((v) => !v)}>
        <div className="org-switcher-avatar">{currentOrg.name.charAt(0).toUpperCase()}</div>
        {!collapsed && <span className="org-switcher-name">{currentOrg.name}</span>}
        {!collapsed && <FaChevronDown className="org-switcher-chevron" />}
      </div>

      {open && !collapsed && (
        <div className="org-dropdown">
          <div className="org-dropdown-header">Organisations</div>
          {organisations.map((org) => (
            <div key={org._id} className={`org-dropdown-item ${currentOrg._id === org._id ? 'active' : ''}`} onClick={() => selectOrg(org)}>
              <div className="org-dropdown-item-avatar">{org.name.charAt(0).toUpperCase()}</div>
              <div className="org-dropdown-item-name">{org.name}</div>
              {currentOrg._id === org._id && <FaCheck className="org-dropdown-check" />}
            </div>
          ))}
          <div className="org-dropdown-divider" />
          <div className="org-dropdown-create" onClick={() => navigate('/organisations/create')}>
            <FaPlus /> Create new org
          </div>
        </div>
      )}
    </div>
  );
};

export default OrgSwitcher;
