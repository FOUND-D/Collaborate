import { io } from 'socket.io-client';
import { SOCKET_URL } from '../config/runtime';

export const createSocketConnection = (options = {}) =>
  io(SOCKET_URL, {
    transports: ['websocket'],
    ...options,
  });
