import Session from '../models/Session.js';
import { processUpcomingSessions, getNearestSession } from '../services/countdownService.js';

export const getUpcomingSession = async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ message: 'Email query parameter is required.' });
    }

    const sessions = await Session.find({ participants: email });
    const nearest = getNearestSession(sessions);

    if (!nearest) {
      return res.status(404).json({ message: 'No upcoming sessions found.' });
    }

    res.json(nearest);
  } catch (error) {
    console.error('Error fetching nearest session:', error);
    res.status(500).json({ message: 'Failed to fetch upcoming session.' });
  }
};

export const getAllUpcomingSessions = async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ message: 'Email query parameter is required.' });
    }

    const sessions = await Session.find({ participants: email });
    const upcoming = processUpcomingSessions(sessions);

    res.json(upcoming);
  } catch (error) {
    console.error('Error fetching all upcoming sessions:', error);
    res.status(500).json({ message: 'Failed to fetch all upcoming sessions.' });
  }
};
