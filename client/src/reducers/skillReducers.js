import {
  SKILL_LIST_REQUEST,
  SKILL_LIST_SUCCESS,
  SKILL_LIST_FAIL,
  USER_SKILL_LIST_REQUEST,
  USER_SKILL_LIST_SUCCESS,
  USER_SKILL_LIST_FAIL,
  USER_SKILL_CREATE_REQUEST,
  USER_SKILL_CREATE_SUCCESS,
  USER_SKILL_CREATE_FAIL,
  USER_SKILL_CREATE_RESET,
  USER_SKILL_DELETE_REQUEST,
  USER_SKILL_DELETE_SUCCESS,
  USER_SKILL_DELETE_FAIL,
  SKILL_MATCH_LIST_REQUEST,
  SKILL_MATCH_LIST_SUCCESS,
  SKILL_MATCH_LIST_FAIL,
} from '../constants/skillConstants';

export const skillListReducer = (state = { skills: [] }, action) => {
  switch (action.type) {
    case SKILL_LIST_REQUEST:
      return { loading: true, skills: [] };
    case SKILL_LIST_SUCCESS:
      return { loading: false, skills: action.payload };
    case SKILL_LIST_FAIL:
      return { loading: false, error: action.payload, skills: [] };
    default:
      return state;
  }
};

export const userSkillListReducer = (state = { skills: [] }, action) => {
  switch (action.type) {
    case USER_SKILL_LIST_REQUEST:
      return { loading: true, skills: state.skills || [] };
    case USER_SKILL_LIST_SUCCESS:
      return { loading: false, skills: action.payload };
    case USER_SKILL_LIST_FAIL:
      return { loading: false, error: action.payload, skills: [] };
    default:
      return state;
  }
};

export const userSkillCreateReducer = (state = {}, action) => {
  switch (action.type) {
    case USER_SKILL_CREATE_REQUEST:
      return { loading: true };
    case USER_SKILL_CREATE_SUCCESS:
      return { loading: false, success: true, skill: action.payload };
    case USER_SKILL_CREATE_FAIL:
      return { loading: false, error: action.payload };
    case USER_SKILL_CREATE_RESET:
      return {};
    default:
      return state;
  }
};

export const userSkillDeleteReducer = (state = {}, action) => {
  switch (action.type) {
    case USER_SKILL_DELETE_REQUEST:
      return { loading: true };
    case USER_SKILL_DELETE_SUCCESS:
      return { loading: false, success: true, deleted: action.payload };
    case USER_SKILL_DELETE_FAIL:
      return { loading: false, error: action.payload };
    default:
      return state;
  }
};

export const skillMatchListReducer = (state = { matches: [] }, action) => {
  switch (action.type) {
    case SKILL_MATCH_LIST_REQUEST:
      return { loading: true, matches: state.matches || [] };
    case SKILL_MATCH_LIST_SUCCESS:
      return { loading: false, matches: action.payload };
    case SKILL_MATCH_LIST_FAIL:
      return { loading: false, error: action.payload, matches: [] };
    default:
      return state;
  }
};
