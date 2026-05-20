import api from '../utils/api';
import { logout } from './userActions';
import {
  SESSION_LIST_REQUEST,
  SESSION_LIST_SUCCESS,
  SESSION_LIST_FAIL,
  SESSION_DETAILS_REQUEST,
  SESSION_DETAILS_SUCCESS,
  SESSION_DETAILS_FAIL,
  SESSION_CREATE_REQUEST,
  SESSION_CREATE_SUCCESS,
  SESSION_CREATE_FAIL,
  SESSION_CONFIRM_REQUEST,
  SESSION_CONFIRM_SUCCESS,
  SESSION_CONFIRM_FAIL,
  SESSION_CANCEL_REQUEST,
  SESSION_CANCEL_SUCCESS,
  SESSION_CANCEL_FAIL,
  SESSION_COMPLETE_REQUEST,
  SESSION_COMPLETE_SUCCESS,
  SESSION_COMPLETE_FAIL,
} from '../constants/sessionConstants';

const getAuthConfig = (getState, contentType = false) => {
  const {
    userLogin: { userInfo },
  } = getState();

  if (!userInfo || !userInfo.token) {
    throw new Error('No authorization token found');
  }

  return {
    headers: {
      ...(contentType ? { 'Content-Type': 'application/json' } : {}),
      Authorization: `Bearer ${userInfo.token}`,
    },
  };
};

const handleAuthError = (dispatch, error, failType) => {
  const message = error.response?.data?.message || error.message;
  if (message === 'No authorization token found' || message === 'Not authorized, token failed') {
    dispatch(logout());
  }
  dispatch({ type: failType, payload: message });
};

export const listSessions = () => async (dispatch, getState) => {
  try {
    dispatch({ type: SESSION_LIST_REQUEST });
    const config = getAuthConfig(getState);
    const { data } = await api.get('/api/sessions', config);
    dispatch({ type: SESSION_LIST_SUCCESS, payload: data });
  } catch (error) {
    handleAuthError(dispatch, error, SESSION_LIST_FAIL);
  }
};

export const getSessionDetails = (id) => (dispatch, getState) => {
  dispatch({ type: SESSION_DETAILS_REQUEST });
  const sessionsState = getState().sessionList;
  const upcoming = sessionsState?.sessions?.upcoming || [];
  const past = sessionsState?.sessions?.past || [];
  const session = [...upcoming, ...past].find((entry) => entry._id === id);

  if (session) {
    dispatch({ type: SESSION_DETAILS_SUCCESS, payload: session });
  } else {
    dispatch({ type: SESSION_DETAILS_FAIL, payload: 'Session not found in current store' });
  }
};

export const createSession = (payload) => async (dispatch, getState) => {
  try {
    dispatch({ type: SESSION_CREATE_REQUEST });
    const config = getAuthConfig(getState, true);
    const { data } = await api.post('/api/sessions', payload, config);
    dispatch({ type: SESSION_CREATE_SUCCESS, payload: data });
    dispatch(listSessions());
    return data;
  } catch (error) {
    handleAuthError(dispatch, error, SESSION_CREATE_FAIL);
    return null;
  }
};

const updateSessionAction = async ({ dispatch, getState, id, path, requestType, successType, failType }) => {
  try {
    dispatch({ type: requestType });
    const config = getAuthConfig(getState, true);
    const { data } = await api.put(`/api/sessions/${id}/${path}`, {}, config);
    dispatch({ type: successType, payload: data });
    dispatch(listSessions());
    return data;
  } catch (error) {
    handleAuthError(dispatch, error, failType);
    return null;
  }
};

export const confirmSession = (id) => (dispatch, getState) => updateSessionAction({
  dispatch,
  getState,
  id,
  path: 'confirm',
  requestType: SESSION_CONFIRM_REQUEST,
  successType: SESSION_CONFIRM_SUCCESS,
  failType: SESSION_CONFIRM_FAIL,
});

export const cancelSession = (id) => (dispatch, getState) => updateSessionAction({
  dispatch,
  getState,
  id,
  path: 'cancel',
  requestType: SESSION_CANCEL_REQUEST,
  successType: SESSION_CANCEL_SUCCESS,
  failType: SESSION_CANCEL_FAIL,
});

export const completeSession = (id) => (dispatch, getState) => updateSessionAction({
  dispatch,
  getState,
  id,
  path: 'complete',
  requestType: SESSION_COMPLETE_REQUEST,
  successType: SESSION_COMPLETE_SUCCESS,
  failType: SESSION_COMPLETE_FAIL,
});
