import api from '../utils/api';
import { logout } from './userActions';
import {
  SKILL_LIST_REQUEST,
  SKILL_LIST_SUCCESS,
  SKILL_LIST_FAIL,
  USER_SKILL_LIST_REQUEST,
  USER_SKILL_LIST_SUCCESS,
  USER_SKILL_LIST_FAIL,
  USER_SKILL_CREATE_REQUEST,
  USER_SKILL_CREATE_SUCCESS,
  USER_SKILL_CREATE_FAIL,
  USER_SKILL_DELETE_REQUEST,
  USER_SKILL_DELETE_SUCCESS,
  USER_SKILL_DELETE_FAIL,
  SKILL_MATCH_LIST_REQUEST,
  SKILL_MATCH_LIST_SUCCESS,
  SKILL_MATCH_LIST_FAIL,
} from '../constants/skillConstants';

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
  const message =
    error.response?.data?.message ||
    error.message;

  if (message === 'No authorization token found' || message === 'Not authorized, token failed') {
    dispatch(logout());
  }

  dispatch({
    type: failType,
    payload: message,
  });
};

export const listSkills = () => async (dispatch, getState) => {
  try {
    dispatch({ type: SKILL_LIST_REQUEST });
    const config = getAuthConfig(getState);
    const { data } = await api.get('/api/skills', config);
    dispatch({ type: SKILL_LIST_SUCCESS, payload: data });
  } catch (error) {
    handleAuthError(dispatch, error, SKILL_LIST_FAIL);
  }
};

export const listUserSkills = (userId) => async (dispatch, getState) => {
  try {
    dispatch({ type: USER_SKILL_LIST_REQUEST });
    const config = getAuthConfig(getState);
    const { data } = await api.get(`/api/skills/user/${userId}`, config);
    dispatch({ type: USER_SKILL_LIST_SUCCESS, payload: data });
  } catch (error) {
    handleAuthError(dispatch, error, USER_SKILL_LIST_FAIL);
  }
};

export const createUserSkill = (payload) => async (dispatch, getState) => {
  try {
    dispatch({ type: USER_SKILL_CREATE_REQUEST });
    const config = getAuthConfig(getState, true);
    const { data } = await api.post('/api/skills/user', payload, config);
    dispatch({ type: USER_SKILL_CREATE_SUCCESS, payload: data });
    dispatch(listUserSkills(getState().userLogin.userInfo._id));
    return data;
  } catch (error) {
    handleAuthError(dispatch, error, USER_SKILL_CREATE_FAIL);
    return null;
  }
};

export const deleteUserSkill = (skillId, type) => async (dispatch, getState) => {
  try {
    dispatch({ type: USER_SKILL_DELETE_REQUEST });
    const config = getAuthConfig(getState);
    const suffix = type ? `?type=${encodeURIComponent(type)}` : '';
    await api.delete(`/api/skills/user/${skillId}${suffix}`, config);
    dispatch({ type: USER_SKILL_DELETE_SUCCESS, payload: { skillId, type } });
    dispatch(listUserSkills(getState().userLogin.userInfo._id));
  } catch (error) {
    handleAuthError(dispatch, error, USER_SKILL_DELETE_FAIL);
  }
};

export const listSkillMatches = () => async (dispatch, getState) => {
  try {
    dispatch({ type: SKILL_MATCH_LIST_REQUEST });
    const config = getAuthConfig(getState);
    const { data } = await api.get('/api/skills/matches', config);
    dispatch({ type: SKILL_MATCH_LIST_SUCCESS, payload: data });
  } catch (error) {
    handleAuthError(dispatch, error, SKILL_MATCH_LIST_FAIL);
  }
};
