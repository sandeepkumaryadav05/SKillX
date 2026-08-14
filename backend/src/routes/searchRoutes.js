import express from 'express';
import { searchUsers, searchGigs, getSearchSuggestions } from '../controllers/searchController.js';
import { searchLimiter } from '../middleware/rateLimiter.js';

// Search routes — secured by the global authenticate middleware
const router = express.Router();

/** GET /api/search/users - Search users by name, skills, or location */
router.get('/users', searchLimiter, searchUsers);

/** GET /api/search/gigs - Search gigs by title, description, or tags */
router.get('/gigs', searchLimiter, searchGigs);

/** GET /api/search/suggestions - Get autocomplete suggestions for search queries */
router.get('/suggestions', searchLimiter, getSearchSuggestions);

export default router;
