import { getAvailability, saveAvailability, checkMatchesAvailability } from '../services/availabilityService.js';
import { checkConflict } from '../services/conflictService.js';
import { suggestAlternativeSlots } from '../services/scheduleSuggestionService.js';
import Session from '../models/Session.js';
import { calculateExchangeRoles } from '../services/roleService.js';

export const getUserAvailability = async (req, res) => {
  try {
    const { email } = req.params;
    const availability = await getAvailability(email);
    res.json(availability);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch availability', error: error.message });
  }
};

export const updateUserAvailability = async (req, res) => {
  try {
    const { email, availability, customAvailability } = req.body;
    const updated = await saveAvailability(email, availability, customAvailability);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Failed to save availability', error: error.message });
  }
};

export const checkSessionConflict = async (req, res) => {
  try {
    const { participants, date, startTime, endTime } = req.body;

    if (!participants || participants.length !== 2 || !date || !startTime || !endTime) {
      return res.status(400).json({ message: 'Missing required parameters' });
    }

    const conflict = await checkConflict(participants, date, startTime, endTime);

    // Also check if it matches availability for the recipient (participant 1 usually if participant 0 is requester)
    // Actually let's check for both
    const p1Avail = await getAvailability(participants[0]);
    const p2Avail = await getAvailability(participants[1]);

    const p1Matches = checkMatchesAvailability(p1Avail, date, startTime, endTime);
    const p2Matches = checkMatchesAvailability(p2Avail, date, startTime, endTime);

    res.json({
      ...conflict,
      matchesAvailability: {
        [participants[0]]: p1Avail.length === 0 ? true : p1Matches, // If no availability set, assume true to not block
        [participants[1]]: p2Avail.length === 0 ? true : p2Matches,
      }
    });

  } catch (error) {
    res.status(500).json({ message: 'Failed to check conflict', error: error.message });
  }
};

export const getSuggestions = async (req, res) => {
  try {
    const { participants, date, durationMins } = req.body;
    const suggestions = await suggestAlternativeSlots(participants, date, durationMins);
    res.json(suggestions);
  } catch (error) {
    res.status(500).json({ message: 'Failed to get suggestions', error: error.message });
  }
};

export const scheduleSession = async (req, res) => {
  try {
    const { participants, chatRoomId, requestedBy, date, startTime, endTime, duration, mode, notes, force, isPreApproved } = req.body;

    if (!participants || participants.length !== 2 || !chatRoomId || !requestedBy || !date || !startTime || !endTime) {
      return res.status(400).json({ message: 'Missing required parameters' });
    }

    // Check for conflict unless forced
    let conflictDetected = false;
    if (!force) {
      const conflict = await checkConflict(participants, date, startTime, endTime);
      if (conflict.hasConflict) {
        return res.status(409).json({ message: 'Time conflict detected', conflict });
      }
    } else {
      const conflict = await checkConflict(participants, date, startTime, endTime);
      conflictDetected = conflict.hasConflict;
    }

    // Check availability matching
    const recipient = participants.find(p => p !== requestedBy) || participants[1];
    const recipientAvail = await getAvailability(recipient);
    const matchesAvailability = recipientAvail.length === 0 ? true : checkMatchesAvailability(recipientAvail, date, startTime, endTime);

    const exchangeRoles = await calculateExchangeRoles(participants[0], participants[1]);

    const session = await Session.create({
      participants,
      chatRoomId,
      requestedBy,
      date,
      time: startTime, // Legacy field support
      startTime,
      endTime,
      duration: duration || '60 mins',
      mode: mode || 'Remote',
      notes: notes || '',
      status: isPreApproved ? 'Scheduled' : 'Pending',
      matchesAvailability,
      conflictDetected,
      exchangeRoles,
    });

    res.status(201).json(session);
  } catch (error) {
    console.error('❌ scheduleSession error:', error);
    res.status(500).json({ message: 'Failed to schedule session', error: error.message });
  }
};
