import {
    MESSAGE_SEND_REQUEST,
    MESSAGE_SEND_SUCCESS,
    MESSAGE_SEND_FAIL,
    MESSAGE_LIST_REQUEST,
    MESSAGE_LIST_SUCCESS,
    MESSAGE_LIST_FAIL,
    MESSAGE_LIST_RESET,
    MESSAGE_RECEIVE,
  } from '../constants/messageConstants';
  
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
  
  export const messageListReducer = (state = { messages: [] }, action) => {
    switch (action.type) {
      case MESSAGE_LIST_REQUEST:
        return { ...state, loading: true };
      case MESSAGE_LIST_SUCCESS:
        return { loading: false, messages: action.payload };
      case MESSAGE_RECEIVE:
        return { ...state, messages: [...state.messages, action.payload] };
      case MESSAGE_LIST_FAIL:
        return { loading: false, error: action.payload, messages: [] };
      case MESSAGE_LIST_RESET:
        return { messages: [] };
      default:
        return state;
    }
  };
  