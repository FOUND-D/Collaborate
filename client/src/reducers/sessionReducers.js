import {
  SESSION_LIST_REQUEST,
  SESSION_LIST_SUCCESS,
  SESSION_LIST_FAIL,
  SESSION_DETAILS_REQUEST,
  SESSION_DETAILS_SUCCESS,
  SESSION_DETAILS_FAIL,
  SESSION_CREATE_REQUEST,
  SESSION_CREATE_SUCCESS,
  SESSION_CREATE_FAIL,
  SESSION_CREATE_RESET,
  SESSION_CONFIRM_REQUEST,
  SESSION_CONFIRM_SUCCESS,
  SESSION_CONFIRM_FAIL,
  SESSION_CANCEL_REQUEST,
  SESSION_CANCEL_SUCCESS,
  SESSION_CANCEL_FAIL,
  SESSION_COMPLETE_REQUEST,
  SESSION_COMPLETE_SUCCESS,
  SESSION_COMPLETE_FAIL,
} from '../constants/sessionConstants';

export const sessionListReducer = (state = { sessions: { upcoming: [], past: [] } }, action) => {
  switch (action.type) {
    case SESSION_LIST_REQUEST:
      return { loading: true, sessions: state.sessions || { upcoming: [], past: [] } };
    case SESSION_LIST_SUCCESS:
      return { loading: false, sessions: action.payload };
    case SESSION_LIST_FAIL:
      return { loading: false, error: action.payload, sessions: { upcoming: [], past: [] } };
    default:
      return state;
  }
};

export const sessionDetailsReducer = (state = { session: null }, action) => {
  switch (action.type) {
    case SESSION_DETAILS_REQUEST:
      return { loading: true, ...state };
    case SESSION_DETAILS_SUCCESS:
      return { loading: false, session: action.payload };
    case SESSION_DETAILS_FAIL:
      return { loading: false, error: action.payload, session: null };
    default:
      return state;
  }
};

export const sessionCreateReducer = (state = {}, action) => {
  switch (action.type) {
    case SESSION_CREATE_REQUEST:
      return { loading: true };
    case SESSION_CREATE_SUCCESS:
      return { loading: false, success: true, session: action.payload };
    case SESSION_CREATE_FAIL:
      return { loading: false, error: action.payload };
    case SESSION_CREATE_RESET:
      return {};
    default:
      return state;
  }
};

export const sessionStatusReducer = (state = {}, action) => {
  switch (action.type) {
    case SESSION_CONFIRM_REQUEST:
    case SESSION_CANCEL_REQUEST:
    case SESSION_COMPLETE_REQUEST:
      return { loading: true };
    case SESSION_CONFIRM_SUCCESS:
    case SESSION_CANCEL_SUCCESS:
    case SESSION_COMPLETE_SUCCESS:
      return { loading: false, success: true, session: action.payload };
    case SESSION_CONFIRM_FAIL:
    case SESSION_CANCEL_FAIL:
    case SESSION_COMPLETE_FAIL:
      return { loading: false, error: action.payload };
    default:
      return state;
  }
};
