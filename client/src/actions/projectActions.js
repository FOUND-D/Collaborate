import api from '../utils/api';
import { logout } from './userActions';
import {
  PROJECT_CREATE_WITH_AI_REQUEST,
  PROJECT_CREATE_WITH_AI_SUCCESS,
  PROJECT_CREATE_WITH_AI_FAIL,
  PROJECT_DETAILS_REQUEST,
  PROJECT_DETAILS_SUCCESS,
  PROJECT_DETAILS_FAIL,
  PROJECT_LIST_REQUEST,
  PROJECT_LIST_SUCCESS,
  PROJECT_LIST_FAIL,
  PROJECT_DELETE_REQUEST,
  PROJECT_DELETE_SUCCESS,
  PROJECT_DELETE_FAIL,
  PROJECT_CREATE_REQUEST,
  PROJECT_CREATE_SUCCESS,
  PROJECT_CREATE_FAIL,
  PROJECT_UPDATE_REQUEST,
  PROJECT_UPDATE_SUCCESS,
  PROJECT_UPDATE_FAIL,
} from '../constants/projectConstants';

export const createProjectWithAI = (project) => async (dispatch, getState) => {
  try {
    dispatch({
      type: PROJECT_CREATE_WITH_AI_REQUEST,
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

    const { data } = await api.post('/api/projects/ai', project, config);

    dispatch({
      type: PROJECT_CREATE_WITH_AI_SUCCESS,
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
      type: PROJECT_CREATE_WITH_AI_FAIL,
      payload: message,
    });
  }
};

export const getProjectDetails = (id) => async (dispatch, getState) => {
  try {
    dispatch({ type: PROJECT_DETAILS_REQUEST });

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

    const { data } = await api.get(`/api/projects/${id}`, config);

    dispatch({
      type: PROJECT_DETAILS_SUCCESS,
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
      type: PROJECT_DETAILS_FAIL,
      payload: message,
    });
  }
};

export const listProjects = () => async (dispatch, getState) => {
  try {
    dispatch({
      type: PROJECT_LIST_REQUEST,
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

    const { data } = await api.get('/api/projects', config);

    dispatch({
      type: PROJECT_LIST_SUCCESS,
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
      type: PROJECT_LIST_FAIL,
      payload: message,
    });
  }
};

export const deleteProject = (id) => async (dispatch, getState) => {
  try {
    dispatch({
      type: PROJECT_DELETE_REQUEST,
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

    await api.delete(`/api/projects/${id}`, config);

    dispatch({
      type: PROJECT_DELETE_SUCCESS,
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
      type: PROJECT_DELETE_FAIL,
      payload: message,
    });
  }
};

export const createProject = (project) => async (dispatch, getState) => {
  try {
    dispatch({
      type: PROJECT_CREATE_REQUEST,
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

    const { data } = await api.post('/api/projects', project, config);

    dispatch({
      type: PROJECT_CREATE_SUCCESS,
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
      type: PROJECT_CREATE_FAIL,
      payload: message,
    });
  }
};

export const updateProject = (project) => async (dispatch, getState) => {
  try {
    dispatch({
      type: PROJECT_UPDATE_REQUEST,
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

    const { data } = await api.put(
      `/api/projects/${project._id}`,
      project,
      config
    );

    dispatch({
      type: PROJECT_UPDATE_SUCCESS,
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
      type: PROJECT_UPDATE_FAIL,
      payload: message,
    });
  }
};
