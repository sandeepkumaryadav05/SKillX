// notificationSocket.js — Handles server-to-client push events via Socket.io.
// Exposes utility functions to emit notifications and session updates to connected users.

let io;
let onlineUsers;

export const initNotificationSocket = (socketIoInstance, usersMap) => {
  io = socketIoInstance;
  onlineUsers = usersMap;
};

/**
 * Emits a real-time notification to a specific user if they are online.
 * @param {String} userEmail 
 * @param {Object} notificationData 
 */
export const emitNotification = (userEmail, notificationData) => {
  if (!io || !onlineUsers) return;

  const socketIds = [];
  for (const [id, email] of onlineUsers.entries()) {
    if (email === userEmail) {
      socketIds.push(id);
    }
  }

  // Method 1: direct socketId (for users already in onlineUsers map)
  socketIds.forEach(socketId => {
    io.to(socketId).emit('newNotification', notificationData);
  });

  // Method 2: named room fallback (for users who joined via joinUserRoom)
  io.to(`user:${userEmail}`).emit('newNotification', notificationData);
};

export const emitNotificationCount = (userEmail, count) => {
  if (!io || !onlineUsers) return;

  const socketIds = [];
  for (const [id, email] of onlineUsers.entries()) {
    if (email === userEmail) {
      socketIds.push(id);
    }
  }

  // Method 1: direct socketId (for users already in onlineUsers map)
  socketIds.forEach(socketId => {
    io.to(socketId).emit('notificationCountUpdated', count);
  });

  // Method 2: named room fallback (for users who joined via joinUserRoom)
  io.to(`user:${userEmail}`).emit('notificationCountUpdated', count);
};

/**
 * Emits a sessionUpdated event to every participant of a session.
 * @param {String[]} participantEmails - Array of 2 participant emails
 * @param {Object} sessionData - Partial session data (e.g. { _id, status })
 */
export const emitSessionUpdate = (participantEmails, sessionData) => {
  if (!io || !onlineUsers) return;

  participantEmails.forEach(email => {
    const socketIds = [];
    for (const [id, em] of onlineUsers.entries()) {
      if (em === email) socketIds.push(id);
    }
    socketIds.forEach(socketId => {
      io.to(socketId).emit('sessionUpdated', sessionData);
    });
  });
};
