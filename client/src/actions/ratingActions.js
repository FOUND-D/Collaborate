import api from '../utils/api';
import { logout } from './userActions';
import {
  RATING_CREATE_REQUEST,
  RATING_CREATE_SUCCESS,
  RATING_CREATE_FAIL,
  RATING_LIST_REQUEST,
  RATING_LIST_SUCCESS,
  RATING_LIST_FAIL,
} from '../constants/ratingConstants';

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

export const createRating = (payload) => async (dispatch, getState) => {
  try {
    dispatch({ type: RATING_CREATE_REQUEST });
    const config = getAuthConfig(getState, true);
    const { data } = await api.post('/api/ratings', payload, config);
    dispatch({ type: RATING_CREATE_SUCCESS, payload: data });
    return data;
  } catch (error) {
    handleAuthError(dispatch, error, RATING_CREATE_FAIL);
    return null;
  }
};

export const listRatings = (userId) => async (dispatch, getState) => {
  try {
    dispatch({ type: RATING_LIST_REQUEST });
    const config = getAuthConfig(getState);
    const { data } = await api.get(`/api/ratings/${userId}`, config);
    dispatch({ type: RATING_LIST_SUCCESS, payload: data });
  } catch (error) {
    handleAuthError(dispatch, error, RATING_LIST_FAIL);
  }
};
