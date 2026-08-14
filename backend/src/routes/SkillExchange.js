import express from 'express'
import SkillExchange from '../models/SkillExchange.js'
import Profile from '../models/UserProfile.js'
import { generateMatchInsights } from '../services/aiService.js'
import { aiLimiter } from '../middleware/rateLimiter.js'

// SkillExchange routes — secured by the global authenticate middleware
const router = express.Router()

/**
 * GET /api/skill-exchange/recommendations
 * Fetches the top 3 best-matched profiles for a user and generates AI insights
 * explaining why they match and suggesting an exchange plan.
 */
router.get('/recommendations', aiLimiter, async (req, res) => {
  try {
    const { userId } = req.query

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required to fetch recommendations' })
    }

    const currentUserProfile = await SkillExchange.findOne({ userId }).sort({ createdAt: -1 })
    
    if (!currentUserProfile) {
      return res.status(200).json([])
    }
    const potentialMatches = await SkillExchange.find({ userId: { $ne: userId } })
      .sort({ matchScore: -1 })
      .limit(3)

    if (potentialMatches.length === 0) {
      return res.status(200).json([])
    }

    const insights = await generateMatchInsights(currentUserProfile, potentialMatches)

    const recommendedMatches = potentialMatches.map((match) => {
      const insightData = insights.find(i => i.id === match._id.toString())
      return {
        ...match.toObject(),
        aiInsight: insightData?.aiInsight || null,
        suggestedExchange: insightData?.suggestedExchange || null
      }
    })

    res.status(200).json(recommendedMatches)
  } catch (error) {
    console.error('Error fetching skill exchange recommendations:', error)
    res.status(500).json({ message: 'Failed to fetch recommendations' })
  }
})

/**
 * POST /api/skill-exchange
 * Creates or updates a user's skill exchange profile. 
 * Increments the user's total skill exchanges count on their first post.
 */
router.post('/', async (req, res) => {
  try {
    const {
      name,
      userId,
      email,
      skillOffered,
      skillWanted,
      location,
      matchScore,
    } = req.body


    const existing = await SkillExchange.findOne({ userId });
    const entry = await SkillExchange.findOneAndUpdate(
      { userId },
      {
        name,
        email,
        userId,
        skillOffered,
        skillWanted,
        location,
        matchScore: matchScore ?? 80,
      },
      { returnDocument: 'after', upsert: true }
    )

    if (!existing) {
      try {
        if (email) {
          await Profile.findOneAndUpdate(
            { email },
            { $inc: { 'stats.skillExchanges': 1 } },
            { upsert: true }
          )
        }
      } catch (err) {
        console.error(
          'Error updating profile stats (skillExchanges +1):',
          err
        )
      }
    }

    res.status(201).json(entry)
  } catch (error) {
    console.error('Error creating skill exchange entry:', error)
    res
      .status(500)
      .json({ message: 'Failed to create skill exchange entry' })
  }
})

/**
 * Computes a compatibility score (0-100) between two users.
 * Tokenizes 'skillOffered' and 'skillWanted' by whitespace/commas.
 * A match is found if any token in one user's list is a substring of the other's.
 * Score = (myNeedsMet + theirNeedsMet) / (totalNeeds) * 100.
 */
function computeMatchScore(currentUser, candidate) {
  const normalize = (str) => (str || '').toLowerCase().trim();
  const splitStr = (str) => normalize(str).split(/[\s,]+/).filter(Boolean);

  const myOffered = splitStr(currentUser.skillOffered);
  const myWanted = splitStr(currentUser.skillWanted);
  const theirOffered = splitStr(candidate.skillOffered);
  const theirWanted = splitStr(candidate.skillWanted);

  const wantCovered = myWanted.filter(s =>
    theirOffered.some(t => t.includes(s) || s.includes(t))
  ).length;

  const offerCovered = theirWanted.filter(s =>
    myOffered.some(t => t.includes(s) || s.includes(t))
  ).length;

  const maxPossible = Math.max(myWanted.length + theirWanted.length, 1);
  const rawScore = ((wantCovered + offerCovered) / maxPossible) * 100;

  return Math.min(Math.round(rawScore), 100);
}

/**
 * GET /api/skill-exchange
 * Fetches all skill exchange profiles. If 'currentUserId' is provided, dynamically
 * computes and sorts other users by their match score against the current user.
 */
router.get('/', async (req, res) => {
  try {
    const { userId, currentUserId } = req.query;

    if (userId) {
      const entries = await SkillExchange.find({ userId }).sort({ createdAt: -1 });
      return res.json(entries);
    }

    let entriesDocs = await SkillExchange.find({}).sort({ createdAt: -1 });
    let entries = entriesDocs.map(p => ({ ...p.toObject(), matchScore: null }));

    if (currentUserId) {
      const currentUserProfile = await SkillExchange.findOne({ userId: currentUserId }).sort({ createdAt: -1 });
      if (currentUserProfile) {
        entries = entries.map(p => {
          if (p.userId === currentUserId) return p;
          return {
            ...p,
            matchScore: computeMatchScore(currentUserProfile, p)
          };
        });
        
        entries.sort((a, b) => {
          if (a.userId === currentUserId) return -1;
          const scoreA = a.matchScore || 0;
          const scoreB = b.matchScore || 0;
          return scoreB - scoreA;
        });
      }
    }

    res.json(entries);
  } catch (error) {
    console.error('Error fetching skill exchange entries:', error);
    res.status(500).json({ message: 'Failed to fetch skill exchange entries' });
  }
})

export default router
