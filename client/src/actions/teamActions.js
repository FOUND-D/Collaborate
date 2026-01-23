import api from '../utils/api';
import { logout } from './userActions';
import {
  TEAM_LIST_REQUEST,
  TEAM_LIST_SUCCESS,
  TEAM_LIST_FAIL,
  TEAM_CREATE_REQUEST,
  TEAM_CREATE_SUCCESS,
  TEAM_CREATE_FAIL,
  TEAM_JOIN_REQUEST,
  TEAM_JOIN_SUCCESS,
  TEAM_JOIN_FAIL,
  TEAM_DELETE_REQUEST,
  TEAM_DELETE_SUCCESS,
  TEAM_DELETE_FAIL,
  TEAM_UPDATE_JOIN_REQUEST_REQUEST,
  TEAM_UPDATE_JOIN_REQUEST_SUCCESS,
  TEAM_UPDATE_JOIN_REQUEST_FAIL,
  TEAM_DETAILS_REQUEST,
  TEAM_DETAILS_SUCCESS,
  TEAM_DETAILS_FAIL,
} from '../constants/teamConstants';

export const listTeams = () => async (dispatch, getState) => {
  try {
    dispatch({ type: TEAM_LIST_REQUEST });

    const {
      userLogin: { userInfo },
    } = getState();

    if (!userInfo || !userInfo.token) {
      dispatch(logout());
      throw new Error('No authorization token found');
    }

    const config = {
      headers: {
        Authorization: `Bearer ${userInfo.token}`,
      },
    };
    const { data } = await api.get('/api/teams', config);

    dispatch({
      type: TEAM_LIST_SUCCESS,
      payload: data,
    });
  } catch (error) {
    const message =
      error.response && error.response.data.message
        ? error.response.data.message
        : error.message;
    if (message === 'No authorization token found' || message === 'Not authorized, token failed') {
      dispatch(logout());
    }
    dispatch({
      type: TEAM_LIST_FAIL,
      payload: message,
    });
  }
};

export const getTeamDetails = (id) => async (dispatch, getState) => {
  try {
    dispatch({ type: TEAM_DETAILS_REQUEST });

    const {
      userLogin: { userInfo },
    } = getState();

    if (!userInfo || !userInfo.token) {
      dispatch(logout());
      throw new Error('No authorization token found');
    }

    const config = {
      headers: {
        Authorization: `Bearer ${userInfo.token}`,
      },
    };
    const { data } = await api.get(`/api/teams/${id}`, config);

    dispatch({
      type: TEAM_DETAILS_SUCCESS,
      payload: data,
    });
  } catch (error) {
    const message =
      error.response && error.response.data.message
        ? error.response.data.message
        : error.message;
    if (message === 'No authorization token found' || message === 'Not authorized, token failed') {
      dispatch(logout());
    }
    dispatch({
      type: TEAM_DETAILS_FAIL,
      payload: message,
    });
  }
};

export const createTeam = (name) => async (dispatch, getState) => {
  try {
    dispatch({
      type: TEAM_CREATE_REQUEST,
    });


    const {
      userLogin: { userInfo },
    } = getState();

    if (!userInfo || !userInfo.token) {
      dispatch(logout());
      throw new Error('No authorization token found');
    }

    const config = {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userInfo.token}`,
      },
    };

    const { data } = await api.post('/api/teams', { name }, config);

    dispatch({
      type: TEAM_CREATE_SUCCESS,
      payload: data,
    });
  } catch (error) {
    const message =
      error.response && error.response.data.message
        ? error.response.data.message
        : error.message;
    if (message === 'No authorization token found' || message === 'Not authorized, token failed') {
      dispatch(logout());
    }
    dispatch({
      type: TEAM_CREATE_FAIL,
      payload: message,
    });
  }
};

export const joinTeam = (teamId) => async (dispatch, getState) => {
  try {
    dispatch({
      type: TEAM_JOIN_REQUEST,
    });

    const {
      userLogin: { userInfo },
    } = getState();

    if (!userInfo || !userInfo.token) {
      dispatch(logout());
      throw new Error('No authorization token found');
    }

    const config = {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userInfo.token}`,
      },
    };

    const { data } = await api.post(`/api/teams/${teamId}/join`, {}, config);

    dispatch({
      type: TEAM_JOIN_SUCCESS,
      payload: data.message, // The server now returns a message: 'Join request sent successfully'
    });
  } catch (error) {
    const message =
      error.response && error.response.data.message
        ? error.response.data.message
        : error.message;
    if (message === 'No authorization token found' || message === 'Not authorized, token failed') {
      dispatch(logout());
    }
    dispatch({
      type: TEAM_JOIN_FAIL,
      payload: message,
    });
  }
};

export const deleteTeam = (id) => async (dispatch, getState) => {
  try {
    dispatch({
      type: TEAM_DELETE_REQUEST,
    });

    const {
      userLogin: { userInfo },
    } = getState();

    if (!userInfo || !userInfo.token) {
      dispatch(logout());
      throw new Error('No authorization token found');
    }

    const config = {
      headers: {
        Authorization: `Bearer ${userInfo.token}`,
      },
    };

    await api.delete(`/api/teams/${id}`, config);

    dispatch({
      type: TEAM_DELETE_SUCCESS,
    });
  } catch (error) {
    const message =
      error.response && error.response.data.message
        ? error.response.data.message
        : error.message;
    if (message === 'No authorization token found' || message === 'Not authorized, token failed') {
      dispatch(logout());
    }
    dispatch({
      type: TEAM_DELETE_FAIL,
      payload: message,
    });
  }
};

export const updateTeamJoinRequest = (teamId, userId, action) => async (dispatch, getState) => {
  try {
    dispatch({
      type: TEAM_UPDATE_JOIN_REQUEST_REQUEST,
    });

    const {
      userLogin: { userInfo },
    } = getState();

    if (!userInfo || !userInfo.token) {
      dispatch(logout());
      throw new Error('No authorization token found');
    }

    const config = {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userInfo.token}`,
      },
    };

    const { data } = await api.put(`/api/teams/${teamId}/join`, { userId, action }, config);

    dispatch({
      type: TEAM_UPDATE_JOIN_REQUEST_SUCCESS,
      payload: data.message,
    });
  } catch (error) {
    const message =
      error.response && error.response.data.message
        ? error.response.data.message
        : error.message;
    if (message === 'No authorization token found' || message === 'Not authorized, token failed') {
      dispatch(logout());
    }
    dispatch({
      type: TEAM_UPDATE_JOIN_REQUEST_FAIL,
      payload: message,
    });
  }
};
