// rateLimiter.js — Named rate limiters for different endpoint sensitivity levels.
// All limiters are automatically skipped in development (NODE_ENV === 'development')
// so local testing is not affected. Only active in production.

import rateLimit from 'express-rate-limit';

/**
 * aiLimiter — Applied to all Gemini-calling routes.
 * 15 requests per user per hour. Prevents API cost abuse.
 */
export const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 15,
  message: { success: false, message: 'AI request limit reached. Please wait before trying again.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'development',
});

/**
 * profileSpamLimiter — Applied to the unauthenticated POST /api/profile route.
 * 20 requests per IP per hour. Prevents account creation spam.
 */
export const profileSpamLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  message: { success: false, message: 'Too many profile creation attempts. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'development',
});

/**
 * searchLimiter — Applied to all /api/search/* routes.
 * 30 requests per IP per minute. Prevents MongoDB search hammering.
 */
export const searchLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30,
  message: { success: false, message: 'Too many search requests. Please slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'development',
});

/**
 * generalLimiter — Broad fallback for any route that needs basic protection.
 * 100 requests per IP per 15 minutes.
 */
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: { success: false, message: 'Too many requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'development',
});
