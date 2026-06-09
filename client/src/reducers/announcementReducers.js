import {
  ANNOUNCEMENT_LIST_REQUEST,
  ANNOUNCEMENT_LIST_SUCCESS,
  ANNOUNCEMENT_LIST_FAIL,
  ANNOUNCEMENT_CREATE_REQUEST,
  ANNOUNCEMENT_CREATE_SUCCESS,
  ANNOUNCEMENT_CREATE_FAIL,
  ANNOUNCEMENT_CREATE_RESET,
  ANNOUNCEMENT_RSVP_SUCCESS,
  ANNOUNCEMENT_DELETE_SUCCESS,
} from '../constants/announcementConstants';

export const announcementListReducer = (state = { announcements: [] }, action) => {
  switch (action.type) {
    case ANNOUNCEMENT_LIST_REQUEST:
      return { loading: true, announcements: [] };
    case ANNOUNCEMENT_LIST_SUCCESS:
      return {
        loading: false,
        announcements: action.payload.announcements,
        total: action.payload.total,
        page: action.payload.page,
        pages: action.payload.pages,
      };
    case ANNOUNCEMENT_LIST_FAIL:
      return { loading: false, error: action.payload };
    case ANNOUNCEMENT_RSVP_SUCCESS:
      return {
        ...state,
        announcements: state.announcements.map(a => 
          a.id === action.payload.id ? { ...a, rsvpCount: action.payload.count, hasRsvped: action.payload.rsvped } : a
        )
      };
    case ANNOUNCEMENT_DELETE_SUCCESS:
      return {
        ...state,
        announcements: state.announcements.filter(a => a.id !== action.payload)
      };
    case 'ANNOUNCEMENT_NEW':
      return {
        ...state,
        announcements: [action.payload, ...state.announcements]
      };
    default:
      return state;
  }
};

export const announcementCreateReducer = (state = {}, action) => {
  switch (action.type) {
    case ANNOUNCEMENT_CREATE_REQUEST:
      return { loading: true };
    case ANNOUNCEMENT_CREATE_SUCCESS:
      return { loading: false, success: true, announcement: action.payload };
    case ANNOUNCEMENT_CREATE_FAIL:
      return { loading: false, error: action.payload };
    case ANNOUNCEMENT_CREATE_RESET:
      return {};
    default:
      return state;
  }
};
