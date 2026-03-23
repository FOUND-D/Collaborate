import api from '../utils/api';
import {
  ORG_CREATE_REQUEST, ORG_CREATE_SUCCESS, ORG_CREATE_FAIL,
  ORG_LIST_REQUEST, ORG_LIST_SUCCESS, ORG_LIST_FAIL,
  ORG_DETAILS_REQUEST, ORG_DETAILS_SUCCESS, ORG_DETAILS_FAIL,
  ORG_UPDATE_REQUEST, ORG_UPDATE_SUCCESS, ORG_UPDATE_FAIL,
  ORG_DELETE_REQUEST, ORG_DELETE_SUCCESS, ORG_DELETE_FAIL,
  ORG_INVITE_REQUEST, ORG_INVITE_SUCCESS, ORG_INVITE_FAIL,
  ORG_CURRENT_SET,
} from '../constants/organisationConstants';

export const createOrganisation = (name, description, logo) => async (dispatch) => {
  try {
    dispatch({ type: ORG_CREATE_REQUEST });
    const { data } = await api.post('/api/organisations', { name, description, logo });
    dispatch({ type: ORG_CREATE_SUCCESS, payload: data });
    dispatch({ type: ORG_CURRENT_SET, payload: data });
    return data;
  } catch (err) {
    dispatch({ type: ORG_CREATE_FAIL, payload: err.response?.data?.message || err.message });
    throw err;
  }
};
export const listMyOrganisations = () => async (dispatch) => {
  try {
    dispatch({ type: ORG_LIST_REQUEST });
    const { data } = await api.get('/api/organisations');
    dispatch({ type: ORG_LIST_SUCCESS, payload: data });
    if (data.length > 0) dispatch({ type: ORG_CURRENT_SET, payload: data[0] });
    return data;
  } catch (err) {
    dispatch({ type: ORG_LIST_FAIL, payload: err.response?.data?.message || err.message });
    throw err;
  }
};
export const getOrganisationDetails = (id) => async (dispatch) => {
  try {
    dispatch({ type: ORG_DETAILS_REQUEST });
    const { data } = await api.get(`/api/organisations/${id}`);
    dispatch({ type: ORG_DETAILS_SUCCESS, payload: data });
  } catch (err) {
    dispatch({ type: ORG_DETAILS_FAIL, payload: err.response?.data?.message || err.message });
  }
};
export const updateOrganisation = (id, updateData) => async (dispatch) => {
  try {
    dispatch({ type: ORG_UPDATE_REQUEST });
    const { data } = await api.put(`/api/organisations/${id}`, updateData);
    dispatch({ type: ORG_UPDATE_SUCCESS, payload: data });
  } catch (err) {
    dispatch({ type: ORG_UPDATE_FAIL, payload: err.response?.data?.message || err.message });
  }
};
export const deleteOrganisation = (id) => async (dispatch) => {
  try {
    dispatch({ type: ORG_DELETE_REQUEST });
    await api.delete(`/api/organisations/${id}`);
    dispatch({ type: ORG_DELETE_SUCCESS, payload: id });
  } catch (err) {
    dispatch({ type: ORG_DELETE_FAIL, payload: err.response?.data?.message || err.message });
  }
};
export const inviteMemberToOrg = (orgId, email, role) => async (dispatch) => {
  try {
    dispatch({ type: ORG_INVITE_REQUEST });
    await api.post(`/api/organisations/${orgId}/members/invite`, { email, role });
    dispatch({ type: ORG_INVITE_SUCCESS });
  } catch (err) {
    dispatch({ type: ORG_INVITE_FAIL, payload: err.response?.data?.message || err.message });
  }
};
export const setCurrentOrganisation = (org) => (dispatch) => {
  dispatch({ type: ORG_CURRENT_SET, payload: org });
  localStorage.setItem('currentOrgId', org._id);
};
