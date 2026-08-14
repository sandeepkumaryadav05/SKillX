import express from 'express';
import {
  generateRoadmap,
  saveRoadmap,
  getUserRoadmaps,
  updateProgress,
  deleteRoadmap,
} from '../controllers/roadmapController.js';
import { aiLimiter } from '../middleware/rateLimiter.js';

// Roadmap routes — secured by the global authenticate middleware
const router = express.Router();

/** POST /api/roadmap/generate - Generate a roadmap preview (not saved) */
router.post('/generate', aiLimiter, generateRoadmap);

/** POST /api/roadmap/save - Save a roadmap to DB */
router.post('/save', saveRoadmap);

/** GET /api/roadmap/user - Get all saved roadmaps for a user */
router.get('/user', getUserRoadmaps);

/** PUT /api/roadmap/progress - Toggle week completion and update progress */
router.put('/progress', updateProgress);

/** DELETE /api/roadmap/:id - Delete a roadmap */
router.delete('/:id', deleteRoadmap);

export default router;
