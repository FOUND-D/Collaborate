import axios from 'axios';
import store from '../store';
import { BACKEND_URL, REQUEST_TIMEOUT_MS } from '../config/runtime';
import { setServerOffline, setServerOnline } from '../actions/serverActions';
import { SERVER_STATUS_OFFLINE, SERVER_STATUS_ONLINE } from '../constants/serverConstants';

const api = axios.create({
  baseURL: BACKEND_URL,
  timeout: REQUEST_TIMEOUT_MS,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const state = store.getState();
    const token = state.userLogin?.userInfo?.token;

    if (!config.baseURL) {
      config.baseURL = BACKEND_URL;
    }

    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// --- RESPONSE INTERCEPTOR (Error Handling) ---
api.interceptors.response.use(
  (response) => {
    const { serverStatus } = store.getState();
    if (serverStatus?.status !== SERVER_STATUS_ONLINE) {
      store.dispatch(setServerOnline());
    }
    return response;
  },
  (error) => {
    if (error.request && !error.response && error.code !== 'ERR_CANCELED') {
      const { serverStatus } = store.getState();

      if (serverStatus?.status !== SERVER_STATUS_OFFLINE) {
        console.error('Network Error: Server unreachable at', BACKEND_URL);
        store.dispatch(setServerOffline());
      }
    } else if (!error.response) {
      console.error('API Setup Error:', error.message);
    }

    return Promise.reject(error);
  }
);

export const buildRequestConfig = ({ token, headers = {}, ...config } = {}) => ({
  ...config,
  headers: {
    ...headers,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  },
});

export default api;
