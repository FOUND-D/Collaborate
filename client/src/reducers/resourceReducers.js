import {
  RESOURCE_LIST_REQUEST,
  RESOURCE_LIST_SUCCESS,
  RESOURCE_LIST_FAIL,
  RESOURCE_CREATE_REQUEST,
  RESOURCE_CREATE_SUCCESS,
  RESOURCE_CREATE_FAIL,
  RESOURCE_CREATE_RESET,
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

export const resourceListReducer = (state = { resources: [] }, action) => {
  switch (action.type) {
    case RESOURCE_LIST_REQUEST:
      return { loading: true, resources: [] };
    case RESOURCE_LIST_SUCCESS:
      return {
        loading: false,
        resources: action.payload.resources,
        total: action.payload.total,
        page: action.payload.page,
        pages: action.payload.pages,
      };
    case RESOURCE_LIST_FAIL:
      return { loading: false, error: action.payload };
    case RESOURCE_SUMMARISE_SUCCESS:
      return {
        ...state,
        resources: state.resources.map(r => 
          r.id === action.payload.id ? { ...r, aiSummary: action.payload.summary } : r
        )
      };
    case RESOURCE_DELETE_SUCCESS:
      return {
        ...state,
        resources: state.resources.filter(r => r.id !== action.payload)
      };
    case RESOURCE_PIN_SUCCESS:
      return {
        ...state,
        resources: state.resources.map(r => 
          r.id === action.payload.id ? action.payload : r
        ).sort((a, b) => (b.isPinned === a.isPinned) ? 0 : b.isPinned ? 1 : -1)
      };
    default:
      return state;
  }
};

export const resourceCreateReducer = (state = {}, action) => {
  switch (action.type) {
    case RESOURCE_CREATE_REQUEST:
      return { loading: true };
    case RESOURCE_CREATE_SUCCESS:
      return { loading: false, success: true, resource: action.payload };
    case RESOURCE_CREATE_FAIL:
      return { loading: false, error: action.payload };
    case RESOURCE_CREATE_RESET:
      return {};
    default:
      return state;
  }
};
