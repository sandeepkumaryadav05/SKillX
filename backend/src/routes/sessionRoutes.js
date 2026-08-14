import express from 'express';
import mongoose from 'mongoose';
import Session from '../models/Session.js';
import { calculateExchangeRoles } from '../services/roleService.js';
import { getUpcomingSession, getAllUpcomingSessions } from '../controllers/sessionController.js';
import { emitSessionUpdate } from '../socket/notificationSocket.js';

// Session routes — secured by the global authenticate middleware
const router = express.Router();

/**
 * GET /api/sessions/upcoming
 * Get the nearest upcoming session for a user
 */
router.get('/upcoming', getUpcomingSession);

/**
 * GET /api/sessions/all-upcoming
 * Get all upcoming sessions for a user sorted chronologically
 */
router.get('/all-upcoming', getAllUpcomingSessions);

/**
 * POST /api/sessions
 * Create a new session
 */
router.post('/', async (req, res) => {
  try {
    const { participants, chatRoomId, date, time, duration, mode, notes, requestedBy, isPreApproved } = req.body;

    if (!participants || participants.length !== 2) {
      return res.status(400).json({ message: 'Exactly 2 participants are required.' });
    }
    if (!chatRoomId || !date || !time) {
      return res.status(400).json({ message: 'chatRoomId, date, and time are required.' });
    }
    if (!requestedBy) {
      return res.status(400).json({ message: 'requestedBy is required.' });
    }

    // Prevent duplicate: same participants + same chatRoom + same date/time + active status
    const duplicate = await Session.findOne({
      chatRoomId,
      date,
      time,
      status: { $in: ['Scheduled', 'Rescheduled'] },
    });
    if (duplicate) {
      return res.status(409).json({ message: 'A session already exists at this date and time for this conversation.' });
    }

    const exchangeRoles = await calculateExchangeRoles(participants[0], participants[1]);

    const initialStatus = isPreApproved ? 'Scheduled' : 'Pending';
    const roomId = initialStatus === 'Scheduled' ? new mongoose.Types.ObjectId().toString() : undefined;

    const session = await Session.create({
      roomId,
      participants,
      chatRoomId,
      date,
      time,
      duration: duration || '60 mins',
      mode: mode || 'Remote',
      notes: notes || '',
      status: initialStatus,
      requestedBy,
      exchangeRoles,
    });

    res.status(201).json(session);
  } catch (error) {
    console.error('Error creating session:', error);
    res.status(500).json({ message: 'Failed to create session.' });
  }
});

/**
 * GET /api/sessions?email=...
 * Get all sessions for a user
 */
router.get('/', async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ message: 'Email query parameter is required.' });
    }

    const sessions = await Session.find({ participants: email }).sort({ date: 1, time: 1 });
    res.json(sessions);
  } catch (error) {
    console.error('Error fetching sessions:', error);
    res.status(500).json({ message: 'Failed to fetch sessions.' });
  }
});

/**
 * GET /api/sessions/room/:chatRoomId
 * Get sessions for a specific chat room
 */
router.get('/room/:chatRoomId', async (req, res) => {
  try {
    const { chatRoomId } = req.params;
    const sessions = await Session.find({
      chatRoomId,
      status: { $in: ['Pending', 'Scheduled', 'Rescheduled', 'Completed', 'Cancelled', 'Declined'] },
    }).sort({ date: 1, time: 1 });

    res.json(sessions);
  } catch (error) {
    console.error('Error fetching room sessions:', error);
    res.status(500).json({ message: 'Failed to fetch room sessions.' });
  }
});

/**
 * PUT /api/sessions/:id/reschedule
 * Reschedule a session
 */
router.put('/:id/reschedule', async (req, res) => {
  try {
    const { date, time, duration, mode, notes } = req.body;

    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid session ID.' });
    }
    if (!date || !time) {
      return res.status(400).json({ message: 'New date and time are required to reschedule.' });
    }

    const session = await Session.findById(req.params.id);
    if (!session) {
      return res.status(404).json({ message: 'Session not found.' });
    }

    session.date = date;
    session.time = time;
    if (duration) session.duration = duration;
    if (mode) session.mode = mode;
    if (notes !== undefined) session.notes = notes;
    session.status = 'Rescheduled';
    await session.save();

    emitSessionUpdate(session.participants, { _id: session._id, status: session.status, date, time });

    res.json(session);
  } catch (error) {
    console.error('Error rescheduling session:', error);
    res.status(500).json({ message: 'Failed to reschedule session.' });
  }
});

/**
 * PUT /api/sessions/:id/cancel
 * Cancel a session
 */
router.put('/:id/cancel', async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid session ID.' });
    }
    const session = await Session.findById(req.params.id);
    if (!session) {
      return res.status(404).json({ message: 'Session not found.' });
    }

    session.status = 'Cancelled';
    await session.save();

    emitSessionUpdate(session.participants, { _id: session._id, status: session.status });

    res.json(session);
  } catch (error) {
    console.error('Error cancelling session:', error);
    res.status(500).json({ message: 'Failed to cancel session.' });
  }
});

/**
 * PUT /api/sessions/:id/accept
 * Accept a pending session
 */
router.put('/:id/accept', async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid session ID.' });
    }
    const session = await Session.findById(req.params.id);
    if (!session) {
      return res.status(404).json({ message: 'Session not found.' });
    }

    if (!session.roomId) {
      session.roomId = new mongoose.Types.ObjectId().toString();
    }
    session.status = 'Scheduled';
    await session.save();

    emitSessionUpdate(session.participants, { _id: session._id, status: session.status });

    res.json(session);
  } catch (error) {
    console.error('Error accepting session:', error);
    res.status(500).json({ message: 'Failed to accept session.' });
  }
});

/**
 * PUT /api/sessions/:id/decline
 * Decline a pending session
 */
router.put('/:id/decline', async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid session ID.' });
    }
    const session = await Session.findById(req.params.id);
    if (!session) {
      return res.status(404).json({ message: 'Session not found.' });
    }

    session.status = 'Declined';
    await session.save();

    emitSessionUpdate(session.participants, { _id: session._id, status: session.status });

    res.json(session);
  } catch (error) {
    console.error('Error declining session:', error);
    res.status(500).json({ message: 'Failed to decline session.' });
  }
});

/**
 * PUT /api/sessions/:id/complete
 * Mark a session as completed
 */
router.put('/:id/complete', async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid session ID.' });
    }
    const session = await Session.findById(req.params.id);
    if (!session) {
      return res.status(404).json({ message: 'Session not found.' });
    }

    session.status = 'Completed';
    await session.save();

    emitSessionUpdate(session.participants, { _id: session._id, status: session.status });

    res.json(session);
  } catch (error) {
    console.error('Error completing session:', error);
    res.status(500).json({ message: 'Failed to complete session.' });
  }
});

export default router;
