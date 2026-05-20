import api from '../utils/api';
import { logout } from './userActions';
import {
  LISTING_LIST_REQUEST,
  LISTING_LIST_SUCCESS,
  LISTING_LIST_FAIL,
  LISTING_DETAILS_REQUEST,
  LISTING_DETAILS_SUCCESS,
  LISTING_DETAILS_FAIL,
  LISTING_CREATE_REQUEST,
  LISTING_CREATE_SUCCESS,
  LISTING_CREATE_FAIL,
  LISTING_UPDATE_REQUEST,
  LISTING_UPDATE_SUCCESS,
  LISTING_UPDATE_FAIL,
  LISTING_DELETE_REQUEST,
  LISTING_DELETE_SUCCESS,
  LISTING_DELETE_FAIL,
} from '../constants/listingConstants';

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

export const listListings = (filters = {}) => async (dispatch, getState) => {
  try {
    dispatch({ type: LISTING_LIST_REQUEST });
    const config = getAuthConfig(getState);
    const search = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        search.set(key, value);
      }
    });
    const query = search.toString() ? `?${search.toString()}` : '';
    const { data } = await api.get(`/api/listings${query}`, config);
    dispatch({ type: LISTING_LIST_SUCCESS, payload: data });
  } catch (error) {
    handleAuthError(dispatch, error, LISTING_LIST_FAIL);
  }
};

export const getListingDetails = (id) => async (dispatch, getState) => {
  try {
    dispatch({ type: LISTING_DETAILS_REQUEST });
    const config = getAuthConfig(getState);
    const { data } = await api.get(`/api/listings/${id}`, config);
    dispatch({ type: LISTING_DETAILS_SUCCESS, payload: data });
  } catch (error) {
    handleAuthError(dispatch, error, LISTING_DETAILS_FAIL);
  }
};

export const createListing = (payload) => async (dispatch, getState) => {
  try {
    dispatch({ type: LISTING_CREATE_REQUEST });
    const config = getAuthConfig(getState, true);
    const { data } = await api.post('/api/listings', payload, config);
    dispatch({ type: LISTING_CREATE_SUCCESS, payload: data });
    return data;
  } catch (error) {
    handleAuthError(dispatch, error, LISTING_CREATE_FAIL);
    return null;
  }
};

export const updateListing = (id, payload) => async (dispatch, getState) => {
  try {
    dispatch({ type: LISTING_UPDATE_REQUEST });
    const config = getAuthConfig(getState, true);
    const { data } = await api.put(`/api/listings/${id}`, payload, config);
    dispatch({ type: LISTING_UPDATE_SUCCESS, payload: data });
    return data;
  } catch (error) {
    handleAuthError(dispatch, error, LISTING_UPDATE_FAIL);
    return null;
  }
};

export const deleteListing = (id) => async (dispatch, getState) => {
  try {
    dispatch({ type: LISTING_DELETE_REQUEST });
    const config = getAuthConfig(getState);
    await api.delete(`/api/listings/${id}`, config);
    dispatch({ type: LISTING_DELETE_SUCCESS, payload: id });
  } catch (error) {
    handleAuthError(dispatch, error, LISTING_DELETE_FAIL);
  }
};
