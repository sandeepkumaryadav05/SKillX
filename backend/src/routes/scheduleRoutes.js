import express from 'express';
import {
  getUserAvailability,
  updateUserAvailability,
  checkSessionConflict,
  getSuggestions,
  scheduleSession
} from '../controllers/scheduleController.js';

// Schedule routes — secured by the global authenticate middleware
const router = express.Router();

/** GET /api/schedule/availability/:email - Fetch user's availability schedule */
router.get('/availability/:email', getUserAvailability);

/** POST /api/schedule/availability/save - Save user's availability schedule */
router.post('/availability/save', updateUserAvailability);

/** POST /api/schedule/session/check-conflict - Check if a proposed time conflicts with existing sessions */
router.post('/session/check-conflict', checkSessionConflict);

/** POST /api/schedule/session/suggestions - Suggest available times for two users */
router.post('/session/suggestions', getSuggestions);

/** POST /api/schedule/session/schedule - Schedule a new session */
router.post('/session/schedule', scheduleSession);

export default router;
