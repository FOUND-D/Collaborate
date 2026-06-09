import api from '../utils/api';
import {
  RESOURCE_LIST_REQUEST,
  RESOURCE_LIST_SUCCESS,
  RESOURCE_LIST_FAIL,
  RESOURCE_CREATE_REQUEST,
  RESOURCE_CREATE_SUCCESS,
  RESOURCE_CREATE_FAIL,
  RESOURCE_SUMMARISE_REQUEST,
  RESOURCE_SUMMARISE_SUCCESS,
  RESOURCE_SUMMARISE_FAIL,
  RESOURCE_DELETE_REQUEST,
  RESOURCE_DELETE_SUCCESS,
  RESOURCE_DELETE_FAIL,
  RESOURCE_PIN_REQUEST,
  RESOURCE_PIN_SUCCESS,
  RESOURCE_PIN_FAIL,
} from '../constants/resourceConstants';

export const listResources = (filters = {}) => async (dispatch) => {
  try {
    dispatch({ type: RESOURCE_LIST_REQUEST });

    const { team_id, tags, search, page } = filters;
    let url = '/api/resources?';
    if (team_id) url += `team_id=${team_id}&`;
    if (tags) url += `tags=${tags}&`;
    if (search) url += `search=${search}&`;
    if (page) url += `page=${page}&`;

    const { data } = await api.get(url);

    dispatch({
      type: RESOURCE_LIST_SUCCESS,
      payload: data,
    });
  } catch (error) {
    dispatch({
      type: RESOURCE_LIST_FAIL,
      payload: error.response && error.response.data.message
        ? error.response.data.message
        : error.message,
    });
  }
};

export const createResource = (resourceData) => async (dispatch) => {
  try {
    dispatch({ type: RESOURCE_CREATE_REQUEST });

    const { data } = await api.post('/api/resources', resourceData);

    dispatch({
      type: RESOURCE_CREATE_SUCCESS,
      payload: data,
    });
  } catch (error) {
    dispatch({
      type: RESOURCE_CREATE_FAIL,
      payload: error.response && error.response.data.message
        ? error.response.data.message
        : error.message,
    });
  }
};

export const summariseResource = (id) => async (dispatch) => {
  try {
    dispatch({ type: RESOURCE_SUMMARISE_REQUEST });

    const { data } = await api.post(`/api/resources/${id}/summarise`);

    dispatch({
      type: RESOURCE_SUMMARISE_SUCCESS,
      payload: { id, summary: data.summary },
    });
  } catch (error) {
    dispatch({
      type: RESOURCE_SUMMARISE_FAIL,
      payload: error.response && error.response.data.message
        ? error.response.data.message
        : error.message,
    });
  }
};

export const deleteResource = (id) => async (dispatch) => {
  try {
    dispatch({ type: RESOURCE_DELETE_REQUEST });

    await api.delete(`/api/resources/${id}`);

    dispatch({
      type: RESOURCE_DELETE_SUCCESS,
      payload: id,
    });
  } catch (error) {
    dispatch({
      type: RESOURCE_DELETE_FAIL,
      payload: error.response && error.response.data.message
        ? error.response.data.message
        : error.message,
    });
  }
};

export const togglePinResource = (id) => async (dispatch) => {
  try {
    dispatch({ type: RESOURCE_PIN_REQUEST });

    const { data } = await api.patch(`/api/resources/${id}/pin`);

    dispatch({
      type: RESOURCE_PIN_SUCCESS,
      payload: data,
    });
  } catch (error) {
    dispatch({
      type: RESOURCE_PIN_FAIL,
      payload: error.response && error.response.data.message
        ? error.response.data.message
        : error.message,
    });
  }
};
