import {
  MESSAGE_SEND_REQUEST,
  MESSAGE_SEND_SUCCESS,
  MESSAGE_SEND_FAIL,
  MESSAGE_LIST_REQUEST,
  MESSAGE_LIST_SUCCESS,
  MESSAGE_LIST_FAIL,
  MESSAGE_LIST_RESET,
  MESSAGE_MARK_READ_REQUEST,
  MESSAGE_MARK_READ_SUCCESS,
  MESSAGE_MARK_READ_FAIL,
  MESSAGE_RECEIVE,
  MESSAGE_SOCKET_RECEIVE,
} from '../constants/messageConstants';

const mergeMessages = (messages, incomingMessage) => {
  const currentMessages = Array.isArray(messages) ? messages : [];
  if (!incomingMessage?._id) return currentMessages;

  const existingIndex = currentMessages.findIndex((message) => message._id === incomingMessage._id);
  if (existingIndex === -1) {
    return [...currentMessages, incomingMessage];
  }

  return currentMessages.map((message, index) => (
    index === existingIndex ? { ...message, ...incomingMessage } : message
  ));
};

export const messageSendReducer = (state = {}, action) => {
  switch (action.type) {
    case MESSAGE_SEND_REQUEST:
      return { loading: true };
    case MESSAGE_SEND_SUCCESS:
      return { loading: false, success: true, message: action.payload };
    case MESSAGE_SEND_FAIL:
      return { loading: false, error: action.payload };
    default:
      return state;
  }
};

export const messageMarkReadReducer = (state = {}, action) => {
  switch (action.type) {
    case MESSAGE_MARK_READ_REQUEST:
      return { loading: true };
    case MESSAGE_MARK_READ_SUCCESS:
      return { loading: false, success: true };
    case MESSAGE_MARK_READ_FAIL:
      return { loading: false, error: action.payload };
    default:
      return state;
  }
};

export const messageListReducer = (state = { messages: [] }, action) => {
  switch (action.type) {
    case MESSAGE_LIST_REQUEST:
      return { ...state, loading: true };
    case MESSAGE_LIST_SUCCESS:
      return { loading: false, messages: action.payload };
    case MESSAGE_RECEIVE:
    case MESSAGE_SOCKET_RECEIVE:
      return { ...state, messages: mergeMessages(state.messages, action.payload) };
    case MESSAGE_LIST_FAIL:
      return { loading: false, error: action.payload, messages: [] };
    case MESSAGE_LIST_RESET:
      return { messages: [] };
    default:
      return state;
  }
};
