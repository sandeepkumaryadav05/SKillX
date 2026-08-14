import express from 'express';
import UserProfile from '../models/UserProfile.js';
import { profileSpamLimiter } from '../middleware/rateLimiter.js';
import asyncHandler from '../utils/asyncHandler.js';

// UserProfile routes — POST is exempt from auth (for first-time signup).
// All other routes are secured by the global authenticate middleware.
const router = express.Router();

/**
 * GET /api/profile/:email
 * Fetches a user profile by email address.
 */
router.get('/:email', asyncHandler(async (req, res) => {
  const email = req.params.email;
  const profile = await UserProfile.findOne({ email });

  if (!profile) {
    return res.status(404).json({ message: 'Profile not found' });
  }

  res.json(profile);
}));

/**
 * POST /api/profile
 * Upserts a user profile. Handles initial creation and subsequent updates.
 */
router.post('/', profileSpamLimiter, asyncHandler(async (req, res) => {
  // NOTE: `role` is intentionally NOT accepted from the request body.
  // Roles are only ever set server-side (default 'user'; admins via promote.js),
  // so this public endpoint cannot be used to escalate privileges.
  const { email, name, location, bio, skills, stats, socialLinks } = req.body;

  if (!email || !name) {
    return res.status(400).json({ message: 'Email and name are required' });
  }

  const safeEmail = typeof email === 'string' ? email.trim() : email;
  const safeName = typeof name === 'string' ? name.trim() : name;

  const skillsArray = Array.isArray(skills)
    ? skills
    : typeof skills === 'string'
      ? skills.split(',').map((s) => s.trim()).filter(Boolean)
      : [];

  // Load the existing profile so update payloads never wipe rating/review stats.
  const existing = await UserProfile.findOne({ email: safeEmail });
  const existingStats = existing?.stats || {};

  const mergedStats = {
    gigsPosted: stats?.gigsPosted ?? existingStats.gigsPosted ?? 0,
    gigsCompleted: stats?.gigsCompleted ?? existingStats.gigsCompleted ?? 0,
    skillExchanges: stats?.skillExchanges ?? existingStats.skillExchanges ?? 0,
    skillExchangesCompleted: existingStats.skillExchangesCompleted ?? 0,
    averageRating: existingStats.averageRating ?? 0,
    totalReviews: existingStats.totalReviews ?? 0,
  };

  const updatedProfile = await UserProfile.findOneAndUpdate(
    { email: safeEmail },
    {
      email: safeEmail,
      name: safeName,
      location,
      bio,
      skills: skillsArray,
      socialLinks: socialLinks || [],
      stats: mergedStats,
    },
    { returnDocument: 'after', upsert: true }
  );

  res.status(200).json(updatedProfile);
}));

export default router;
