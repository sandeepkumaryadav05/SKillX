import UserProfile from '../models/UserProfile.js';
import Gig from '../models/Gig.js';

/**
 * Compute a trust score from user stats (0-100).
 * Formula: weighted combination of rating, reviews, and completed exchanges.
 */
const computeTrustScore = (stats) => {
  if (!stats) return 0;
  const ratingWeight = 40; // 40% from average rating (scaled 0-5 -> 0-40)
  const reviewWeight = 30; // 30% from review count (capped at 50 reviews -> 30)
  const exchangeWeight = 30; // 30% from completed exchanges (capped at 30 -> 30)

  const ratingScore = ((stats.averageRating || 0) / 5) * ratingWeight;
  const reviewScore = Math.min((stats.totalReviews || 0) / 50, 1) * reviewWeight;
  const exchangeScore = Math.min((stats.skillExchangesCompleted || 0) / 30, 1) * exchangeWeight;

  return Math.round(ratingScore + reviewScore + exchangeScore);
};

/**
 * Search users with filters, sorting, and pagination.
 */
export const searchUsers = async ({
  search = '',
  skills = '',
  minRating = 0,
  minTrustScore = 0,
  location = '',
  sortBy = 'bestMatch',
  page = 1,
  limit = 12,
}) => {
  const query = { status: 'active' };

  // Text search across name, email, bio, skills
  if (search.trim()) {
    const regex = new RegExp(search.trim(), 'i');
    query.$or = [
      { name: regex },
      { email: regex },
      { bio: regex },
      { skills: regex },
    ];
  }

  // Filter by skills (comma-separated)
  if (skills.trim()) {
    const skillArr = skills.split(',').map(s => s.trim()).filter(Boolean);
    if (skillArr.length > 0) {
      query.skills = { $in: skillArr.map(s => new RegExp(s, 'i')) };
    }
  }

  // Filter by minimum rating
  if (Number(minRating) > 0) {
    query['stats.averageRating'] = { $gte: Number(minRating) };
  }

  // Filter by location
  if (location.trim()) {
    query.location = new RegExp(location.trim(), 'i');
  }

  // Sorting
  let sortObj = { createdAt: -1 }; // default newest
  switch (sortBy) {
    case 'highestRating':
      sortObj = { 'stats.averageRating': -1 };
      break;
    case 'mostActive':
      sortObj = { 'stats.skillExchanges': -1 };
      break;
    case 'recentlyJoined':
      sortObj = { createdAt: -1 };
      break;
    case 'mostSessions':
      sortObj = { 'stats.skillExchangesCompleted': -1 };
      break;
    case 'oldest':
      sortObj = { createdAt: 1 };
      break;
    case 'bestMatch':
    case 'highestTrustScore':
      // We'll sort post-query for trust score
      sortObj = { 'stats.averageRating': -1, 'stats.totalReviews': -1 };
      break;
    default:
      sortObj = { createdAt: -1 };
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [users, total] = await Promise.all([
    UserProfile.find(query).sort(sortObj).skip(skip).limit(Number(limit)).lean(),
    UserProfile.countDocuments(query),
  ]);

  // Attach computed trust score
  const enriched = users.map(user => ({
    ...user,
    trustScore: computeTrustScore(user.stats),
  }));

  // Post-filter by minTrustScore
  let filtered = enriched;
  if (Number(minTrustScore) > 0) {
    filtered = enriched.filter(u => u.trustScore >= Number(minTrustScore));
  }

  // Post-sort by trust score if requested
  if (sortBy === 'highestTrustScore') {
    filtered.sort((a, b) => b.trustScore - a.trustScore);
  }

  return {
    users: filtered,
    total: Number(minTrustScore) > 0 ? filtered.length : total,
    page: Number(page),
    totalPages: Math.ceil((Number(minTrustScore) > 0 ? filtered.length : total) / Number(limit)),
  };
};

/**
 * Search gigs with filters, sorting, and pagination.
 */
export const searchGigs = async ({
  search = '',
  category = '',
  skills = '',
  sortBy = 'newest',
  page = 1,
  limit = 12,
}) => {
  const query = {};

  // Text search across title, description, skills, category
  if (search.trim()) {
    const regex = new RegExp(search.trim(), 'i');
    query.$or = [
      { title: regex },
      { description: regex },
      { skills: regex },
      { category: regex },
    ];
  }

  // Filter by category
  if (category.trim()) {
    query.category = new RegExp(category.trim(), 'i');
  }

  // Filter by skills
  if (skills.trim()) {
    const skillArr = skills.split(',').map(s => s.trim()).filter(Boolean);
    if (skillArr.length > 0) {
      query.skills = { $in: skillArr.map(s => new RegExp(s, 'i')) };
    }
  }

  // Sorting
  let sortObj = { createdAt: -1 };
  switch (sortBy) {
    case 'newest':
      sortObj = { createdAt: -1 };
      break;
    case 'oldest':
      sortObj = { createdAt: 1 };
      break;
    case 'budgetHigh':
      sortObj = { budget: -1 };
      break;
    case 'budgetLow':
      sortObj = { budget: 1 };
      break;
    default:
      sortObj = { createdAt: -1 };
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [gigs, total] = await Promise.all([
    Gig.find(query).sort(sortObj).skip(skip).limit(Number(limit)).lean(),
    Gig.countDocuments(query),
  ]);

  return {
    gigs,
    total,
    page: Number(page),
    totalPages: Math.ceil(total / Number(limit)),
  };
};

/**
 * Get autocomplete suggestions from skills and gig titles.
 */
export const getSearchSuggestions = async (query) => {
  if (!query || query.trim().length < 2) return [];

  const regex = new RegExp(query.trim(), 'i');

  const [skillMatches, gigMatches] = await Promise.all([
    UserProfile.distinct('skills', { skills: regex }),
    Gig.find({ title: regex }, { title: 1, _id: 0 }).limit(5).lean(),
  ]);

  const suggestions = [];

  // Add matching skills
  const filteredSkills = skillMatches
    .filter(s => regex.test(s))
    .slice(0, 5)
    .map(s => ({ type: 'skill', text: s }));

  suggestions.push(...filteredSkills);

  // Add matching gig titles
  gigMatches.forEach(g => {
    suggestions.push({ type: 'gig', text: g.title });
  });

  return suggestions.slice(0, 8);
};
