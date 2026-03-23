import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../utils/api';

const AcceptInviteScreen = () => {
  const [status, setStatus] = useState('loading');
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    api.get(`/organisations/invite/accept?token=${params.get('token')}&org=${params.get('org')}`)
      .then((res) => {
        setStatus('success');
        setTimeout(() => navigate(`/organisations/${res.data.organisationId || params.get('org')}`), 1200);
      })
      .catch(() => setStatus('error'));
  }, [location.search, navigate]);

  return <div className="home-dashboard-page">{status === 'loading' ? 'Verifying your invite' : status === 'error' ? 'This invite link is invalid or has expired.' : 'You have joined the organisation.'}</div>;
};

export default AcceptInviteScreen;
