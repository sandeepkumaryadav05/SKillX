import express from 'express';
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  archiveNotifications
} from '../controllers/notificationController.js';

// Notification routes — secured by the global authenticate middleware
const router = express.Router();

/** GET /api/notifications - Fetch user's notifications */
router.get('/', getNotifications);

/** GET /api/notifications/unread-count - Fetch total unread count */
router.get('/unread-count', getUnreadCount);

/** PUT /api/notifications/:id/read - Mark specific notification as read */
router.put('/:id/read', markAsRead);

/** PUT /api/notifications/read-all - Mark all user notifications as read */
router.put('/read-all', markAllAsRead);

/** PUT /api/notifications/archive - Archive a notification */
router.put('/archive', archiveNotifications);

export default router;
