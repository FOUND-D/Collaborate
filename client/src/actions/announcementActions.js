import api from '../utils/api';
import {
  ANNOUNCEMENT_LIST_REQUEST,
  ANNOUNCEMENT_LIST_SUCCESS,
  ANNOUNCEMENT_LIST_FAIL,
  ANNOUNCEMENT_CREATE_REQUEST,
  ANNOUNCEMENT_CREATE_SUCCESS,
  ANNOUNCEMENT_CREATE_FAIL,
  ANNOUNCEMENT_RSVP_REQUEST,
  ANNOUNCEMENT_RSVP_SUCCESS,
  ANNOUNCEMENT_RSVP_FAIL,
  ANNOUNCEMENT_DELETE_REQUEST,
  ANNOUNCEMENT_DELETE_SUCCESS,
  ANNOUNCEMENT_DELETE_FAIL,
} from '../constants/announcementConstants';

export const listAnnouncements = (filters = {}) => async (dispatch) => {
  try {
    dispatch({ type: ANNOUNCEMENT_LIST_REQUEST });

    const { team_id, page } = filters;
    let url = '/api/announcements?';
    if (team_id) url += `team_id=${team_id}&`;
    if (page) url += `page=${page}&`;

    const { data } = await api.get(url);

    dispatch({
      type: ANNOUNCEMENT_LIST_SUCCESS,
      payload: data,
    });
  } catch (error) {
    dispatch({
      type: ANNOUNCEMENT_LIST_FAIL,
      payload: error.response && error.response.data.message
        ? error.response.data.message
        : error.message,
    });
  }
};

export const createAnnouncement = (announcementData) => async (dispatch) => {
  try {
    dispatch({ type: ANNOUNCEMENT_CREATE_REQUEST });

    const { data } = await api.post('/api/announcements', announcementData);

    dispatch({
      type: ANNOUNCEMENT_CREATE_SUCCESS,
      payload: data,
    });
  } catch (error) {
    dispatch({
      type: ANNOUNCEMENT_CREATE_FAIL,
      payload: error.response && error.response.data.message
        ? error.response.data.message
        : error.message,
    });
  }
};

export const rsvpAnnouncement = (id) => async (dispatch) => {
  try {
    dispatch({ type: ANNOUNCEMENT_RSVP_REQUEST });

    const { data } = await api.post(`/api/announcements/${id}/rsvp`);

    dispatch({
      type: ANNOUNCEMENT_RSVP_SUCCESS,
      payload: { id, ...data },
    });
  } catch (error) {
    dispatch({
      type: ANNOUNCEMENT_RSVP_FAIL,
      payload: error.response && error.response.data.message
        ? error.response.data.message
        : error.message,
    });
  }
};

export const deleteAnnouncement = (id) => async (dispatch) => {
  try {
    dispatch({ type: ANNOUNCEMENT_DELETE_REQUEST });

    await api.delete(`/api/announcements/${id}`);

    dispatch({
      type: ANNOUNCEMENT_DELETE_SUCCESS,
      payload: id,
    });
  } catch (error) {
    dispatch({
      type: ANNOUNCEMENT_DELETE_FAIL,
      payload: error.response && error.response.data.message
        ? error.response.data.message
        : error.message,
    });
  }
};
