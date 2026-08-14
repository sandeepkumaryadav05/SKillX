import express from 'express';
import { generateLearningRoadmap } from '../services/aiService.js';
import { aiLimiter } from '../middleware/rateLimiter.js';

// AI proxy routes — all Gemini calls are made here on the server using
// process.env.GEMINI_API_KEY. The key is never sent to the frontend.
// Protected by the global authenticate middleware applied in index.js.
const router = express.Router();

/**
 * POST /api/ai/roadmap
 * Proxies a roadmap generation request to the Gemini API.
 * Request body: { goal: string }
 * Returns: { goal, generatedRoadmap, totalWeeks }
 */
router.post('/roadmap', aiLimiter, async (req, res) => {
  try {
    const { goal } = req.body;

    if (!goal || typeof goal !== 'string' || !goal.trim()) {
      return res.status(400).json({ message: 'A non-empty goal string is required.' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ message: 'AI service is not configured on the server.' });
    }

    const generatedRoadmap = await generateLearningRoadmap(goal.trim());

    return res.status(200).json({
      goal: goal.trim(),
      generatedRoadmap,
      totalWeeks: generatedRoadmap?.milestones?.length || 0,
    });
  } catch (error) {
    console.error('POST /api/ai/roadmap error:', error.message || error);
    return res.status(500).json({
      message: 'Failed to generate roadmap. Please try again in a moment.',
    });
  }
});

export default router;
