import {
    SERVER_STATUS_OFFLINE,
    SERVER_STATUS_ONLINE,
} from '../constants/serverConstants';

export const setServerOffline = () => (dispatch) => {
    dispatch({
        type: SERVER_STATUS_OFFLINE,
    });
};

export const setServerOnline = () => (dispatch) => {
    dispatch({
        type: SERVER_STATUS_ONLINE,
    });
};
