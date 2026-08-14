import Notification from '../models/Notification.js';
import { emitNotification, emitNotificationCount } from '../socket/notificationSocket.js';

export const createNotification = async ({ userId, type, message, referenceId }) => {
  try {
    // 1. Grouping Logic: Check if there's an identical unread notification (e.g. repetitive message)
    // To implement simple grouping: if type is MESSAGE and it's from the same sender (parsed from message or referenceId), 
    // we could update the string. For now, we will create it and limit repetitions on the frontend, or implement exact matching:
    
    // For repetitive "Rahul sent message":
    if (type === 'MESSAGE' && referenceId) {
      const existing = await Notification.findOne({
        userId,
        type: 'MESSAGE',
        referenceId,
        isRead: false,
        isArchived: false
      });
      
      if (existing) {
        // Just update the timestamp
        existing.message = message; // Could be updated to "Rahul sent X messages"
        existing.updatedAt = Date.now();
        await existing.save();
        
        await updateUnreadCount(userId);
        emitNotification(userId, existing);
        return existing;
      }
    }

    const newNotification = await Notification.create({
      userId,
      type,
      message,
      referenceId,
    });

    // Broadcast to connected client
    emitNotification(userId, newNotification);
    await updateUnreadCount(userId);

    return newNotification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error; // re-throw so caller can handle
  }
};

export const updateUnreadCount = async (userId) => {
  try {
    const count = await Notification.countDocuments({ userId, isRead: false, isArchived: false });
    emitNotificationCount(userId, count);
    return count;
  } catch (error) {
    console.error('Error updating unread count:', error);
  }
};

export const getUserNotifications = async (userId) => {
  return await Notification.find({ userId, isArchived: false }).sort({ createdAt: -1 }).limit(100);
};

export const getUnreadCount = async (userId) => {
  return await Notification.countDocuments({ userId, isRead: false, isArchived: false });
};

export const markAsRead = async (notificationId, userId) => {
  // Scope the update by userId so users can only mark their own notifications read
  const notification = await Notification.findOneAndUpdate(
    { _id: notificationId, userId },
    { isRead: true },
    { returnDocument: 'after' }
  );
  if (notification) {
    await updateUnreadCount(notification.userId);
  }
  return notification;
};

export const markAllAsRead = async (userId) => {
  await Notification.updateMany({ userId, isRead: false, isArchived: false }, { isRead: true });
  await updateUnreadCount(userId);
};

export const archiveAll = async (userId) => {
  await Notification.updateMany({ userId, isArchived: false }, { isArchived: true, isRead: true });
  await updateUnreadCount(userId);
};
