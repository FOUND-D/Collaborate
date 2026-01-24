import axios from 'axios';
import store from '../store';
import { setServerOffline, setServerOnline } from '../actions/serverActions';

const api = axios.create({
  baseURL: import.meta.env.VITE_APP_API_URL || '', // Use environment variable or relative path
});

// Request interceptor to potentially set server online if it was offline
api.interceptors.request.use((config) => {
  const { serverStatus } = store.getState();
  if (serverStatus.status === 'offline') {
    // If server was offline, try to set it online with a dummy action or check
    // This is a simplistic approach; a more robust solution might involve
    // a dedicated ping endpoint or more sophisticated retry logic.
    store.dispatch(setServerOnline());
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Response interceptor to catch network errors and dispatch server offline action
api.interceptors.response.use(
  (response) => {
    // If a request succeeds, ensure server status is online
    const { serverStatus } = store.getState();
    if (serverStatus.status !== 'online') {
      store.dispatch(setServerOnline());
    }
    return response;
  },
  (error) => {
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      // console.error('API Error Response:', error.response.data);
      // console.error('API Error Status:', error.response.status);
      // console.error('API Error Headers:', error.response.headers);
    } else if (error.request) {
      // The request was made but no response was received
      // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
      // http.ClientRequest in node.js
      // console.error('API Error Request:', error.request);
      store.dispatch(setServerOffline());
    } else {
      // Something happened in setting up the request that triggered an Error
      // console.error('API Error Message:', error.message);
    }
    return Promise.reject(error);
  }
);

export default api;
