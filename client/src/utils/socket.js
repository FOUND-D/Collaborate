import { io } from 'socket.io-client';
import { SOCKET_URL } from '../config/runtime';

export const createSocketConnection = (options = {}) => {
  let token = null;
  try {
    const persistRoot = localStorage.getItem('persist:root');
    if (persistRoot) {
      const parsed = JSON.parse(persistRoot);
      if (parsed.userLogin) {
        const userLogin = JSON.parse(parsed.userLogin);
        token = userLogin.userInfo?.token;
      }
    }
  } catch (err) {
    console.error('Failed to parse persistent user info for socket token:', err);
  }

  return io(SOCKET_URL, {
    transports: ['websocket'],
    auth: token ? { token } : undefined,
    ...options,
  });
};
