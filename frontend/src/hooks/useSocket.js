import { useEffect } from 'react';
import { connectSocket, disconnectSocket, getSocket } from '../utils/socket';

export function useSocket(token) {
  useEffect(() => {
    if (token) {
      connectSocket(token);
    }
    return () => {
      disconnectSocket();
    };
  }, [token]);

  return getSocket();
}

export function useSocketEvent(eventName, handler) {
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    socket.on(eventName, handler);
    return () => {
      socket.off(eventName, handler);
    };
  }, [eventName, handler]);
}
