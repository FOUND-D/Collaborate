import axios from 'axios';
import store from '../store'; // Direct import of the Redux store
import { setServerOffline, setServerOnline } from '../actions/serverActions';

// --- CONFIGURATION ---
// 1. The "Unbreakable" Fallback
// If Vite/Vercel variables fail, this hardcoded string saves the day.
export const HARDCODED_BACKEND_URL = "https://collaborate-1.onrender.com"; 

// 2. Initial Setup
// We set the baseURL here, but we will ALSO double-check it in the interceptor
const api = axios.create({
  baseURL: HARDCODED_BACKEND_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// --- REQUEST INTERCEPTOR (The "Just-in-Time" Fix) ---
api.interceptors.request.use(
  (config) => {
    // 1. Get the freshest state from Redux
    // Because we used PersistGate in main.jsx, we know this data is ready!
    const state = store.getState();
    const { serverStatus, auth } = state; // Assuming your auth reducer is named 'auth'

    // 2. FORCE the Base URL
    // Even if axios 'forgot' the URL during a refresh, we re-inject it here.
    if (!config.baseURL) {
        config.baseURL = HARDCODED_BACKEND_URL;
    }

    // 3. Auto-Inject Auth Token
    // If the user is logged in, attach their token automatically.
    // Adjust 'auth.token' to match your actual Redux state structure (e.g., auth.userInfo.token)
    if (auth && auth.token) {
      config.headers.Authorization = `Bearer ${auth.token}`;
    }

    // 4. Optimistic Online Check
    // If we are sending a request, we assume we are trying to connect.
    if (serverStatus && serverStatus.status === 'offline') {
      store.dispatch(setServerOnline());
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
    // Request succeeded! Ensure server is marked Online.
    const { serverStatus } = store.getState();
    if (serverStatus && serverStatus.status !== 'online') {
      store.dispatch(setServerOnline());
    }
    return response;
  },
  (error) => {
    if (error.response) {
      // The server responded with a standard error code (400, 401, 500, etc.)
      // console.error(`API Error ${error.response.status}:`, error.response.data);
    } else if (error.request) {
      // NETWORK ERROR: The request was made but no response received.
      // This usually means the API is down or the user has no internet.
      console.error('Network Error: Server unreachable at', HARDCODED_BACKEND_URL);
      store.dispatch(setServerOffline());
    } else {
      console.error('API Setup Error:', error.message);
    }
    return Promise.reject(error);
  }
);

export default api;
