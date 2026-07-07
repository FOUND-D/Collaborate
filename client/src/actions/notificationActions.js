import api from '../utils/api';
import {
  NOTIFICATION_LIST_REQUEST,
  NOTIFICATION_LIST_SUCCESS,
  NOTIFICATION_LIST_FAIL,
  NOTIFICATION_MARK_READ_REQUEST,
  NOTIFICATION_MARK_READ_SUCCESS,
  NOTIFICATION_MARK_READ_FAIL,
  NOTIFICATION_MARK_ALL_READ_REQUEST,
  NOTIFICATION_MARK_ALL_READ_SUCCESS,
  NOTIFICATION_MARK_ALL_READ_FAIL,
  NOTIFICATION_ADD_REALTIME,
} from '../constants/notificationConstants';

export const listNotifications = () => async (dispatch) => {
  try {
    dispatch({ type: NOTIFICATION_LIST_REQUEST });
    const { data } = await api.get('/api/notifications');
    dispatch({
      type: NOTIFICATION_LIST_SUCCESS,
      payload: data.notifications || [],
    });
  } catch (error) {
    dispatch({
      type: NOTIFICATION_LIST_FAIL,
      payload: error.response && error.response.data.message
        ? error.response.data.message
        : error.message,
    });
  }
};

export const markNotificationAsRead = (id) => async (dispatch) => {
  try {
    dispatch({ type: NOTIFICATION_MARK_READ_REQUEST });
    const { data } = await api.put(`/api/notifications/${id}/read`);
    dispatch({
      type: NOTIFICATION_MARK_READ_SUCCESS,
      payload: data.notification,
    });
  } catch (error) {
    dispatch({
      type: NOTIFICATION_MARK_READ_FAIL,
      payload: error.response && error.response.data.message
        ? error.response.data.message
        : error.message,
    });
  }
};

export const markAllNotificationsAsRead = () => async (dispatch) => {
  try {
    dispatch({ type: NOTIFICATION_MARK_ALL_READ_REQUEST });
    await api.put('/api/notifications/read-all');
    dispatch({
      type: NOTIFICATION_MARK_ALL_READ_SUCCESS,
    });
  } catch (error) {
    dispatch({
      type: NOTIFICATION_MARK_ALL_READ_FAIL,
      payload: error.response && error.response.data.message
        ? error.response.data.message
        : error.message,
    });
  }
};

export const addRealtimeNotification = (notification) => (dispatch) => {
  dispatch({
    type: NOTIFICATION_ADD_REALTIME,
    payload: notification,
  });
};
