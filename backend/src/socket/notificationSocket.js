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
  if (!io) return;

  // Every authenticated socket auto-joins `user:<email>` on connect (index.js),
  // so a single room emit reaches all of the user's tabs — no duplicates.
  io.to(`user:${userEmail}`).emit('newNotification', notificationData);
};

export const emitNotificationCount = (userEmail, count) => {
  if (!io) return;

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
