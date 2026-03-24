import api from '../utils/api';
import { logout } from './userActions';
import {
  ORG_CREATE_REQUEST, ORG_CREATE_SUCCESS, ORG_CREATE_FAIL,
  ORG_LIST_REQUEST, ORG_LIST_SUCCESS, ORG_LIST_FAIL,
  ORG_DETAILS_REQUEST, ORG_DETAILS_SUCCESS, ORG_DETAILS_FAIL,
  ORG_UPDATE_REQUEST, ORG_UPDATE_SUCCESS, ORG_UPDATE_FAIL,
  ORG_DELETE_REQUEST, ORG_DELETE_SUCCESS, ORG_DELETE_FAIL,
  ORG_INVITE_REQUEST, ORG_INVITE_SUCCESS, ORG_INVITE_FAIL,
  ORG_CURRENT_SET,
} from '../constants/organisationConstants';

const getAuthConfig = (getState) => {
  const {
    userLogin: { userInfo },
  } = getState();

  if (!userInfo || !userInfo.token) {
    throw new Error('No authorization token found');
  }

  return {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${userInfo.token}`,
    },
  };
};

export const createOrganisation = (name, description, logo) => async (dispatch, getState) => {
  try {
    dispatch({ type: ORG_CREATE_REQUEST });
    const config = getAuthConfig(getState);
    const { data } = await api.post('/api/organisations', { name, description, logo }, config);
    dispatch({ type: ORG_CREATE_SUCCESS, payload: data });
    dispatch({ type: ORG_CURRENT_SET, payload: data });
    return data;
  } catch (err) {
    const message = err.response?.data?.message || err.message;
    if (message === 'No authorization token found' || message === 'Not authorized, token failed') {
      dispatch(logout());
    }
    dispatch({ type: ORG_CREATE_FAIL, payload: message });
    throw err;
  }
};
export const listMyOrganisations = () => async (dispatch, getState) => {
  try {
    dispatch({ type: ORG_LIST_REQUEST });
    const config = getAuthConfig(getState);
    const { data } = await api.get('/api/organisations', config);
    dispatch({ type: ORG_LIST_SUCCESS, payload: data });
    if (data.length > 0) dispatch({ type: ORG_CURRENT_SET, payload: data[0] });
    return data;
  } catch (err) {
    const message = err.response?.data?.message || err.message;
    if (message === 'No authorization token found' || message === 'Not authorized, token failed') {
      dispatch(logout());
    }
    dispatch({ type: ORG_LIST_FAIL, payload: message });
    return [];
  }
};
export const getOrganisationDetails = (id) => async (dispatch, getState) => {
  try {
    dispatch({ type: ORG_DETAILS_REQUEST });
    const config = getAuthConfig(getState);
    const { data } = await api.get(`/api/organisations/${id}`, config);
    dispatch({ type: ORG_DETAILS_SUCCESS, payload: data });
  } catch (err) {
    const message = err.response?.data?.message || err.message;
    if (message === 'No authorization token found' || message === 'Not authorized, token failed') {
      dispatch(logout());
    }
    dispatch({ type: ORG_DETAILS_FAIL, payload: message });
  }
};
export const updateOrganisation = (id, updateData) => async (dispatch, getState) => {
  try {
    dispatch({ type: ORG_UPDATE_REQUEST });
    const config = getAuthConfig(getState);
    const { data } = await api.put(`/api/organisations/${id}`, updateData, config);
    dispatch({ type: ORG_UPDATE_SUCCESS, payload: data });
  } catch (err) {
    const message = err.response?.data?.message || err.message;
    if (message === 'No authorization token found' || message === 'Not authorized, token failed') {
      dispatch(logout());
    }
    dispatch({ type: ORG_UPDATE_FAIL, payload: message });
  }
};
export const deleteOrganisation = (id) => async (dispatch, getState) => {
  try {
    dispatch({ type: ORG_DELETE_REQUEST });
    const config = getAuthConfig(getState);
    await api.delete(`/api/organisations/${id}`, config);
    dispatch({ type: ORG_DELETE_SUCCESS, payload: id });
  } catch (err) {
    const message = err.response?.data?.message || err.message;
    if (message === 'No authorization token found' || message === 'Not authorized, token failed') {
      dispatch(logout());
    }
    dispatch({ type: ORG_DELETE_FAIL, payload: message });
  }
};
export const inviteMemberToOrg = (orgId, email, role) => async (dispatch, getState) => {
  try {
    dispatch({ type: ORG_INVITE_REQUEST });
    const config = getAuthConfig(getState);
    await api.post(`/api/organisations/${orgId}/members/invite`, { email, role }, config);
    dispatch({ type: ORG_INVITE_SUCCESS });
  } catch (err) {
    const message = err.response?.data?.message || err.message;
    if (message === 'No authorization token found' || message === 'Not authorized, token failed') {
      dispatch(logout());
    }
    dispatch({ type: ORG_INVITE_FAIL, payload: message });
  }
};
export const setCurrentOrganisation = (org) => (dispatch) => {
  dispatch({ type: ORG_CURRENT_SET, payload: org });
  localStorage.setItem('currentOrgId', org._id);
};
