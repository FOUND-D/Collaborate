import {
    SERVER_STATUS_REQUEST,
    SERVER_STATUS_SUCCESS,
    SERVER_STATUS_FAIL,
    SERVER_STATUS_OFFLINE,
    SERVER_STATUS_ONLINE,
} from '../constants/serverConstants';

export const serverStatusReducer = (state = { status: SERVER_STATUS_ONLINE }, action) => {
    switch (action.type) {
        case SERVER_STATUS_REQUEST:
            return { loading: true, status: action.payload };
        case SERVER_STATUS_SUCCESS:
            return { loading: false, status: action.payload };
        case SERVER_STATUS_FAIL:
            return { loading: false, error: action.payload, status: SERVER_STATUS_OFFLINE };
        case SERVER_STATUS_OFFLINE:
            return { loading: false, status: SERVER_STATUS_OFFLINE };
        case SERVER_STATUS_ONLINE:
            return { loading: false, status: SERVER_STATUS_ONLINE };
        default:
            return state;
    }
};