import express from 'express';
import Session from '../models/Session.js';
import ExchangeRequest from '../models/ExchangeRequest.js';
import UserProfile from '../models/UserProfile.js';
import SkillExchange from '../models/SkillExchange.js';
import Review from '../models/Review.js';

// Analytics routes — secured by the global authenticate middleware
const router = express.Router();

/**
 * GET /api/analytics/user
 * Returns: completedExchanges, activeSessions, averageRating, requestsSent, requestsAccepted, successRate
 */
router.get('/user', async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) return res.status(400).json({ message: 'Email required' });

    // Completed Exchanges
    const completedExchanges = await Session.countDocuments({
      participants: email,
      status: 'Completed',
    });

    // Active Sessions
    const activeSessions = await Session.countDocuments({
      participants: email,
      status: { $in: ['Scheduled', 'Rescheduled'] },
    });

    // Average Rating
    const userProfile = await UserProfile.findOne({ email });
    const averageRating = userProfile?.stats?.averageRating || 0;

    // Requests Sent & Accepted
    const requestsSent = await ExchangeRequest.countDocuments({ fromEmail: email });
    const requestsAccepted = await ExchangeRequest.countDocuments({
      fromEmail: email,
      status: 'accepted',
    });

    // Success Rate
    const successRate = requestsSent > 0 ? Math.round((requestsAccepted / requestsSent) * 100) : 0;

    res.json({
      completedExchanges,
      activeSessions,
      averageRating,
      requestsSent,
      requestsAccepted,
      successRate,
    });
  } catch (error) {
    console.error('Analytics User Error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

/**
 * GET /api/analytics/activity
 * Returns weekly activity (last 7 days of completed sessions)
 */
router.get('/activity', async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) return res.status(400).json({ message: 'Email required' });

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const sessions = await Session.find({
      participants: email,
      status: 'Completed',
      createdAt: { $gte: sevenDaysAgo },
    });

    // Initialize array for the last 7 days
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const activityMap = new Map();
    
    // Create an ordered list of the last 7 days starting from 6 days ago up to today
    const chartData = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayName = days[d.getDay()];
      activityMap.set(dayName, 0);
      chartData.push({ name: dayName, sessions: 0 }); // Pre-fill with 0
    }

    sessions.forEach((session) => {
      const dayName = days[new Date(session.createdAt).getDay()];
      if (activityMap.has(dayName)) {
        activityMap.set(dayName, activityMap.get(dayName) + 1);
      }
    });

    // Map the counts back into chartData
    chartData.forEach(data => {
      data.sessions = activityMap.get(data.name);
    });

    res.json(chartData);
  } catch (error) {
    console.error('Analytics Activity Error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

/**
 * GET /api/analytics/skills
 * Returns skill distribution based on completed session partners
 */
router.get('/skills', async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) return res.status(400).json({ message: 'Email required' });

    const sessions = await Session.find({
      participants: email,
      status: 'Completed',
    });

    const partnerEmails = [];
    sessions.forEach(session => {
      const partner = session.participants.find(p => p !== email);
      if (partner) partnerEmails.push(partner);
    });

    const partnerProfiles = await SkillExchange.find({
      email: { $in: partnerEmails }
    });

    const skillCounts = {};
    let totalSkills = 0;

    partnerProfiles.forEach(profile => {
      if (profile.skillOffered) {
        // Handle comma-separated skills
        const skills = profile.skillOffered.split(',').map(s => s.trim()).filter(Boolean);
        skills.forEach(skill => {
          skillCounts[skill] = (skillCounts[skill] || 0) + 1;
          totalSkills++;
        });
      }
    });

    const distribution = Object.keys(skillCounts).map(skill => ({
      name: skill,
      value: Math.round((skillCounts[skill] / totalSkills) * 100),
      rawCount: skillCounts[skill]
    })).sort((a, b) => b.value - a.value);

    res.json(distribution);
  } catch (error) {
    console.error('Analytics Skills Error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

/**
 * GET /api/analytics/badges
 * Evaluates and returns earned badges
 */
router.get('/badges', async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) return res.status(400).json({ message: 'Email required' });

    const badges = [];

    const completedExchanges = await Session.countDocuments({
      participants: email,
      status: 'Completed',
    });

    if (completedExchanges >= 1) badges.push({ id: 'first_exchange', name: 'First Exchange', icon: '🏆', color: 'bg-yellow-100 text-yellow-700' });
    if (completedExchanges >= 10) badges.push({ id: 'session_master', name: 'Session Master', icon: '🔥', color: 'bg-red-100 text-red-700' });

    const userProfile = await UserProfile.findOne({ email });
    const averageRating = userProfile?.stats?.averageRating || 0;
    const totalReviews = userProfile?.stats?.totalReviews || 0;

    if (averageRating >= 4.5 && totalReviews >= 1) {
      badges.push({ id: 'top_rated', name: 'Top Rated User', icon: '⭐', color: 'bg-blue-100 text-blue-700' });
    }

    // Determine Skill Explorer (5 unique skills)
    const sessions = await Session.find({ participants: email, status: 'Completed' });
    const partnerEmails = sessions.map(s => s.participants.find(p => p !== email)).filter(Boolean);
    const partnerProfiles = await SkillExchange.find({ email: { $in: partnerEmails } });
    
    const uniqueSkills = new Set();
    partnerProfiles.forEach(p => {
      if (p.skillOffered) {
        p.skillOffered.split(',').forEach(s => uniqueSkills.add(s.trim().toLowerCase()));
      }
    });

    if (uniqueSkills.size >= 5) {
      badges.push({ id: 'skill_explorer', name: 'Skill Explorer', icon: '🚀', color: 'bg-purple-100 text-purple-700' });
    }

    res.json(badges);
  } catch (error) {
    console.error('Analytics Badges Error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

/**
 * GET /api/analytics/recent-activity
 * Returns unified recent activity (sessions completed, reviews received, requests received)
 */
router.get('/recent-activity', async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) return res.status(400).json({ message: 'Email required' });

    // 1. Sessions completed
    const recentSessions = await Session.find({ participants: email, status: 'Completed' })
      .sort({ updatedAt: -1 })
      .limit(3);
    
    const sessionActivity = recentSessions.map(s => ({
      id: `session_${s._id}`,
      type: 'session_completed',
      title: 'You completed a session',
      description: `${s.duration} • ${s.mode}`,
      date: s.updatedAt,
      icon: '✅',
      color: 'bg-green-100 text-green-600'
    }));

    // 2. Reviews received
    const recentReviews = await Review.find({ reviewedUserEmail: email })
      .sort({ createdAt: -1 })
      .limit(3);

    const reviewActivity = recentReviews.map(r => ({
      id: `review_${r._id}`,
      type: 'review_received',
      title: 'You received a review',
      description: `⭐ ${r.rating} rating from ${r.reviewerEmail.split('@')[0]}`,
      date: r.createdAt,
      icon: '⭐',
      color: 'bg-yellow-100 text-yellow-600'
    }));

    // 3. Requests received
    const recentRequests = await ExchangeRequest.find({ toEmail: email })
      .sort({ createdAt: -1 })
      .limit(3);

    const requestActivity = recentRequests.map(r => ({
      id: `req_${r._id}`,
      type: 'request_received',
      title: 'New skill exchange request received',
      description: `From ${r.fromEmail}`,
      date: r.createdAt,
      icon: '📩',
      color: 'bg-blue-100 text-blue-600'
    }));

    const unifiedActivity = [...sessionActivity, ...reviewActivity, ...requestActivity]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5); // top 5 overall

    res.json(unifiedActivity);
  } catch (error) {
    console.error('Analytics Recent Activity Error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

export default router;
