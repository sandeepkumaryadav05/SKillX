import { io } from 'socket.io-client';
import { API_BASE_URL } from './api.js';
import { auth } from '../firebase/firebaseConfig';

let socket = null;

export const getSocket = () => {
  if (!socket) {
    socket = io(API_BASE_URL, {
      autoConnect: false, // We'll connect it manually when the user is authenticated
    });
  }
  return socket;
};

/**
 * Connects the socket with Firebase ID token authentication.
 * The server's io.use() middleware verifies the token during handshake.
 * No more sending raw email — identity comes from the verified token.
 */
export const connectSocket = async () => {
  const s = getSocket();
  const currentUser = auth.currentUser;
  
  if (!currentUser) {
    console.warn('Cannot connect socket: no authenticated user');
    return s;
  }

  try {
    const token = await currentUser.getIdToken();
    // Set auth token for the handshake
    s.auth = { token };
    
    if (!s.connected) {
      s.connect();
    }
  } catch (error) {
    console.error('Socket auth error:', error);
  }

  return s;
};

export const disconnectSocket = () => {
  if (socket && socket.connected) {
    socket.disconnect();
  }
};
