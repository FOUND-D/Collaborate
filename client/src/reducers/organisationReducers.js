import {
  ORG_CREATE_REQUEST, ORG_CREATE_SUCCESS, ORG_CREATE_FAIL, ORG_CREATE_RESET,
  ORG_LIST_REQUEST, ORG_LIST_SUCCESS, ORG_LIST_FAIL,
  ORG_DETAILS_REQUEST, ORG_DETAILS_SUCCESS, ORG_DETAILS_FAIL, ORG_DETAILS_RESET,
  ORG_UPDATE_REQUEST, ORG_UPDATE_SUCCESS, ORG_UPDATE_FAIL, ORG_UPDATE_RESET,
  ORG_DELETE_REQUEST, ORG_DELETE_SUCCESS, ORG_DELETE_FAIL,
  ORG_INVITE_REQUEST, ORG_INVITE_SUCCESS, ORG_INVITE_FAIL, ORG_INVITE_RESET,
  ORG_CURRENT_SET, ORG_CURRENT_CLEAR,
} from '../constants/organisationConstants';

export const orgCreateReducer = (state = {}, action) => {
  switch (action.type) {
    case ORG_CREATE_REQUEST: return { loading: true };
    case ORG_CREATE_SUCCESS: return { loading: false, success: true, organisation: action.payload };
    case ORG_CREATE_FAIL: return { loading: false, error: action.payload };
    case ORG_CREATE_RESET: return {};
    default: return state;
  }
};
export const orgListReducer = (state = { organisations: [] }, action) => {
  switch (action.type) {
    case ORG_LIST_REQUEST: return { loading: true, organisations: [] };
    case ORG_LIST_SUCCESS: return { loading: false, organisations: action.payload };
    case ORG_LIST_FAIL: return { loading: false, error: action.payload };
    default: return state;
  }
};
export const orgDetailsReducer = (state = { organisation: null }, action) => {
  switch (action.type) {
    case ORG_DETAILS_REQUEST: return { loading: true, organisation: null };
    case ORG_DETAILS_SUCCESS: return { loading: false, organisation: action.payload };
    case ORG_DETAILS_FAIL: return { loading: false, error: action.payload };
    case ORG_DETAILS_RESET: return { organisation: null };
    default: return state;
  }
};
export const orgUpdateReducer = (state = {}, action) => {
  switch (action.type) {
    case ORG_UPDATE_REQUEST: return { loading: true };
    case ORG_UPDATE_SUCCESS: return { loading: false, success: true, organisation: action.payload };
    case ORG_UPDATE_FAIL: return { loading: false, error: action.payload };
    case ORG_UPDATE_RESET: return {};
    default: return state;
  }
};
export const orgDeleteReducer = (state = {}, action) => {
  switch (action.type) {
    case ORG_DELETE_REQUEST: return { loading: true };
    case ORG_DELETE_SUCCESS: return { loading: false, success: true };
    case ORG_DELETE_FAIL: return { loading: false, error: action.payload };
    default: return state;
  }
};
export const orgInviteReducer = (state = {}, action) => {
  switch (action.type) {
    case ORG_INVITE_REQUEST: return { loading: true };
    case ORG_INVITE_SUCCESS: return { loading: false, success: true };
    case ORG_INVITE_FAIL: return { loading: false, error: action.payload };
    case ORG_INVITE_RESET: return {};
    default: return state;
  }
};
export const orgCurrentReducer = (state = { organisation: null }, action) => {
  switch (action.type) {
    case ORG_CURRENT_SET: return { organisation: action.payload };
    case ORG_CURRENT_CLEAR: return { organisation: null };
    default: return state;
  }
};
