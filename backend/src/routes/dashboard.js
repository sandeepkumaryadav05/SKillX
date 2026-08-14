import express from 'express';
import Gig from '../models/Gig.js';
import SkillExchange from '../models/SkillExchange.js';
import UserProfile from '../models/UserProfile.js';

// Dashboard routes — secured by the global authenticate middleware
const router = express.Router();

/**
 * GET /api/dashboard
 * Aggregates global platform statistics. If 'email' is provided, also computes 
 * personalized perfect matches based on skill overlaps.
 */
router.get('/', async (req, res) => {
  try {
    const { email } = req.query;

    // Global stats
    const [totalGigs, totalSkillExchanges, totalProfiles] = await Promise.all([
      Gig.countDocuments({}),
      SkillExchange.countDocuments({}),
      UserProfile.countDocuments({}),
    ]);

    let user = null;
    let matches = [];

    if (email) {
      const profile = await UserProfile.findOne({ email });

      user = {
        email,
        name: profile?.name || '',
        stats: {
          gigsPosted: profile?.stats?.gigsPosted ?? 0,
          gigsCompleted: profile?.stats?.gigsCompleted ?? 0,
          skillExchanges: profile?.stats?.skillExchanges ?? 0,
        },
      };

      // Find Perfect Matches
      const userExchanges = await SkillExchange.find({ email });
      if (userExchanges.length > 0) {
        const otherExchanges = await SkillExchange.find({ email: { $ne: email } });
        
        for (const exchange of userExchanges) {
          // Extract keywords by splitting on commas, spaces, and converting to lowercase
          const extractKeywords = (str) => str.toLowerCase().split(/[\s,]+/).filter(w => w.length > 2);
          
          const myOffered = extractKeywords(exchange.skillOffered);
          const myWanted = extractKeywords(exchange.skillWanted);

          for (const other of otherExchanges) {
            const theirOffered = extractKeywords(other.skillOffered);
            const theirWanted = extractKeywords(other.skillWanted);

            // Check for intersection (do we offer something they want, AND do they offer something we want?)
            const weHaveWhatTheyWant = myOffered.some(skill => theirWanted.includes(skill));
            const theyHaveWhatWeWant = theirOffered.some(skill => myWanted.includes(skill));

            if (weHaveWhatTheyWant && theyHaveWhatWeWant) {
              // Avoid duplicates
              if (!matches.some(existing => existing.matchedExchange._id.toString() === other._id.toString())) {
                matches.push({
                  myExchangeId: exchange._id,
                  matchedExchange: other
                });
              }
            }
          }
        }
      }
    }

    res.json({
      totalGigs,
      totalSkillExchanges,
      totalProfiles,
      user,
      matches,
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ message: 'Failed to fetch dashboard stats' });
  }
});

export default router;
