import express from 'express';
import Review from '../models/Review.js';
import Session from '../models/Session.js';
import UserProfile from '../models/UserProfile.js';
import asyncHandler from '../utils/asyncHandler.js';
import AppError from '../utils/AppError.js';

// Review routes — secured by the global authenticate middleware
const router = express.Router();

/**
 * POST /api/reviews
 * Submit a new review for a completed session
 */
router.post('/', asyncHandler(async (req, res) => {
  const { reviewerEmail, reviewedUserEmail, sessionId, rating, feedback } = req.body;

  if (!reviewerEmail || !reviewedUserEmail || !sessionId || !rating) {
    return res.status(400).json({ message: 'reviewerEmail, reviewedUserEmail, sessionId, and rating are required.' });
  }

  if (rating < 1 || rating > 5) {
    return res.status(400).json({ message: 'Rating must be between 1 and 5.' });
  }

  if (feedback && feedback.length > 500) {
    return res.status(400).json({ message: 'Feedback must be 500 characters or less.' });
  }

  const session = await Session.findById(sessionId);
  if (!session) {
    return res.status(404).json({ message: 'Session not found.' });
  }
  if (session.status !== 'Completed') {
    return res.status(400).json({ message: 'You can only review completed sessions.' });
  }

  if (!session.participants.includes(reviewerEmail)) {
    return res.status(403).json({ message: 'You are not a participant of this session.' });
  }

  if (session.reviewedBy && session.reviewedBy.includes(reviewerEmail)) {
    return res.status(409).json({ message: 'You have already reviewed this session.' });
  }

  let review;
  try {
    review = await Review.create({
      reviewerEmail,
      reviewedUserEmail,
      sessionId,
      rating,
      feedback: feedback || '',
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: 'You have already reviewed this session.' });
    }
    throw error;
  }

  session.reviewedBy.push(reviewerEmail);
  await session.save();

  const allReviews = await Review.find({ reviewedUserEmail });
  const totalReviews = allReviews.length;
  const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews;

  await UserProfile.findOneAndUpdate(
    { email: reviewedUserEmail },
    {
      $set: {
        'stats.averageRating': Math.round(avgRating * 10) / 10,
        'stats.totalReviews': totalReviews,
      },
    }
  );

  res.status(201).json(review);
}));

/**
 * GET /api/reviews/user/:email
 * Get all reviews for a specific user (reviews they received)
 */
router.get('/user/:email', asyncHandler(async (req, res) => {
  const { email } = req.params;
  const reviews = await Review.find({ reviewedUserEmail: email }).sort({ createdAt: -1 });
  res.json(reviews);
}));

/**
 * GET /api/reviews/session/:sessionId
 * Get all reviews for a specific session
 */
router.get('/session/:sessionId', asyncHandler(async (req, res) => {
  const { sessionId } = req.params;
  const reviews = await Review.find({ sessionId }).sort({ createdAt: -1 });
  res.json(reviews);
}));

export default router;
