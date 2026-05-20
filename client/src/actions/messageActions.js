import api from '../utils/api';
import {
  MESSAGE_SEND_REQUEST,
  MESSAGE_SEND_SUCCESS,
  MESSAGE_SEND_FAIL,
  MESSAGE_LIST_REQUEST,
  MESSAGE_LIST_SUCCESS,
  MESSAGE_LIST_FAIL,
  MESSAGE_RECEIVE,
  MESSAGE_SOCKET_RECEIVE,
  MESSAGE_MARK_READ_REQUEST,
  MESSAGE_MARK_READ_SUCCESS,
  MESSAGE_MARK_READ_FAIL,
} from '../constants/messageConstants';

export const sendMessage = (messageData) => async (dispatch, getState) => {
  try {
    dispatch({ type: MESSAGE_SEND_REQUEST });

    const {
      userLogin: { userInfo },
    } = getState();

    const config = {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userInfo.token}`,
      },
    };

    const { data } = await api.post('/api/messages', messageData, config);

    dispatch({
      type: MESSAGE_SEND_SUCCESS,
      payload: data,
    });

    dispatch({
      type: MESSAGE_RECEIVE,
      payload: data,
    });

    return data;
  } catch (error) {
    dispatch({
      type: MESSAGE_SEND_FAIL,
      payload: error.response?.data?.message || error.message,
    });
    return null;
  }
};

export const listMessages = (type, id, silent = false) => async (dispatch, getState) => {
  try {
    if (!silent) {
      dispatch({ type: MESSAGE_LIST_REQUEST });
    }

    const {
      userLogin: { userInfo },
    } = getState();

    const config = {
      headers: {
        Authorization: `Bearer ${userInfo.token}`,
      },
    };

    const { data } = await api.get(`/api/messages/${type}/${id}`, config);
    const messagesPayload = Array.isArray(data) ? data : (data ? [data] : []);

    dispatch({
      type: MESSAGE_LIST_SUCCESS,
      payload: messagesPayload,
    });
  } catch (error) {
    if (!silent) {
      dispatch({
        type: MESSAGE_LIST_FAIL,
        payload: error.response?.data?.message || error.message,
      });
    }
  }
};

export const receiveSocketMessage = (message) => (dispatch) => {
  dispatch({
    type: MESSAGE_SOCKET_RECEIVE,
    payload: message,
  });
};

export const markMessagesAsRead = (messageIds) => async (dispatch, getState) => {
  try {
    dispatch({ type: MESSAGE_MARK_READ_REQUEST });

    const {
      userLogin: { userInfo },
    } = getState();

    const config = {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userInfo.token}`,
      },
    };

    await api.put('/api/messages/read', { messageIds }, config);

    dispatch({
      type: MESSAGE_MARK_READ_SUCCESS,
    });
  } catch (error) {
    dispatch({
      type: MESSAGE_MARK_READ_FAIL,
      payload: error.response?.data?.message || error.message,
    });
  }
};
