import {
  NOTIFICATION_LIST_REQUEST,
  NOTIFICATION_LIST_SUCCESS,
  NOTIFICATION_LIST_FAIL,
  NOTIFICATION_MARK_READ_SUCCESS,
  NOTIFICATION_MARK_ALL_READ_SUCCESS,
  NOTIFICATION_ADD_REALTIME,
} from '../constants/notificationConstants';

export const notificationListReducer = (state = { notifications: [] }, action) => {
  switch (action.type) {
    case NOTIFICATION_LIST_REQUEST:
      return { loading: true, notifications: [] };
    case NOTIFICATION_LIST_SUCCESS:
      return { loading: false, notifications: action.payload };
    case NOTIFICATION_LIST_FAIL:
      return { loading: false, error: action.payload, notifications: [] };
    case NOTIFICATION_MARK_READ_SUCCESS:
      return {
        ...state,
        notifications: state.notifications.map((n) =>
          n.id === action.payload.id ? { ...n, is_read: true } : n
        ),
      };
    case NOTIFICATION_MARK_ALL_READ_SUCCESS:
      return {
        ...state,
        notifications: state.notifications.map((n) => ({ ...n, is_read: true })),
      };
    case NOTIFICATION_ADD_REALTIME:
      // Prevent duplicates in state
      const exists = state.notifications.some((n) => n.id === action.payload.id);
      if (exists) return state;
      return {
        ...state,
        notifications: [action.payload, ...state.notifications],
      };
    default:
      return state;
  }
};
