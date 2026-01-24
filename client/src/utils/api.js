import axios from 'axios';
import store from '../store';
import { setServerOffline, setServerOnline } from '../actions/serverActions';

// --- CONFIGURATION ---
// We are hardcoding the URL to prevent "undefined" errors on refresh.
const BACKEND_URL = "https://collaborate-el4m.onrender.com"; 

console.log("Using API Base URL:", BACKEND_URL); 
// ---------------------

const api = axios.create({
  baseURL: BACKEND_URL,
});

// Request interceptor
api.interceptors.request.use((config) => {
  const { serverStatus } = store.getState();
  
  // Double-check: ensure baseURL is never empty
  if (!config.baseURL) {
      config.baseURL = BACKEND_URL;
  }

  if (serverStatus.status === 'offline') {
    store.dispatch(setServerOnline());
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Response interceptor to catch network errors
api.interceptors.response.use(
  (response) => {
    const { serverStatus } = store.getState();
    if (serverStatus.status !== 'online') {
      store.dispatch(setServerOnline());
    }
    return response;
  },
  (error) => {
    if (error.response) {
      // Server responded with an error (4xx, 5xx)
    } else if (error.request) {
      // Network Error (Server is down or unreachable)
      console.error('Network Error: Server unreachable at', BACKEND_URL);
      store.dispatch(setServerOffline());
    }
    return Promise.reject(error);
  }
);

export default api;
