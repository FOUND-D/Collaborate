import {
  TEAM_LIST_REQUEST,
  TEAM_LIST_SUCCESS,
  TEAM_LIST_FAIL,
  TEAM_CREATE_REQUEST,
  TEAM_CREATE_SUCCESS,
  TEAM_CREATE_FAIL,
  TEAM_CREATE_RESET,
  TEAM_JOIN_REQUEST,
  TEAM_JOIN_SUCCESS,
  TEAM_JOIN_FAIL,
  TEAM_JOIN_RESET,
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

export const teamListReducer = (state = { teams: [] }, action) => {
  switch (action.type) {
    case TEAM_LIST_REQUEST:
      return { loading: true, teams: [] };
    case TEAM_LIST_SUCCESS:
      return { loading: false, teams: action.payload };
    case TEAM_LIST_FAIL:
      return { loading: false, error: action.payload };
    default:
      return state;
  }
};

export const teamDetailsReducer = (
  state = { team: { members: [], projects: [] } },
  action
) => {
  switch (action.type) {
    case TEAM_DETAILS_REQUEST:
      return { ...state, loading: true };
    case TEAM_DETAILS_SUCCESS:
      return { loading: false, team: action.payload };
    case TEAM_DETAILS_FAIL:
      return { loading: false, error: action.payload };
    default:
      return state;
  }
};

export const teamCreateReducer = (state = {}, action) => {
  switch (action.type) {
    case TEAM_CREATE_REQUEST:
      return { loading: true };
    case TEAM_CREATE_SUCCESS:
      return { loading: false, success: true, team: action.payload };
    case TEAM_CREATE_FAIL:
      return { loading: false, error: action.payload };
    case TEAM_CREATE_RESET:
      return {};
    default:
      return state;
  }
};

export const teamJoinReducer = (state = {}, action) => {
  switch (action.type) {
    case TEAM_JOIN_REQUEST:
      return { loading: true };
    case TEAM_JOIN_SUCCESS:
      return { loading: false, success: true, team: action.payload };
    case TEAM_JOIN_FAIL:
      return { loading: false, error: action.payload };
    case TEAM_JOIN_RESET:
      return {};
    default:
      return state;
  }
};

export const teamDeleteReducer = (state = {}, action) => {
  switch (action.type) {
    case TEAM_DELETE_REQUEST:
      return { loading: true };
    case TEAM_DELETE_SUCCESS:
      return { loading: false, success: true };
    case TEAM_DELETE_FAIL:
      return { loading: false, error: action.payload };
    default:
      return state;
  }
};

export const teamUpdateJoinRequestReducer = (state = {}, action) => {
  switch (action.type) {
    case TEAM_UPDATE_JOIN_REQUEST_REQUEST:
      return { loading: true };
    case TEAM_UPDATE_JOIN_REQUEST_SUCCESS:
      return { loading: false, success: true, message: action.payload };
    case TEAM_UPDATE_JOIN_REQUEST_FAIL:
      return { loading: false, error: action.payload };
    default:
      return state;
  }
};
