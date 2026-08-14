import Session from '../models/Session.js';

/**
 * Detects if there's an overlap between two time intervals
 */
const isOverlap = (start1, end1, start2, end2) => {
  return (start1 < end2 && end1 > start2);
};

/**
 * Convert time string HH:mm to minutes since midnight for easy comparison
 */
const timeToMinutes = (timeStr) => {
  if (!timeStr) return 0;
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

/**
 * Check for scheduling conflicts for a set of participants
 * @param {Array<String>} participants Array of emails
 * @param {String} date YYYY-MM-DD
 * @param {String} startTime HH:mm
 * @param {String} endTime HH:mm
 * @param {String} excludeSessionId Session ID to ignore (for rescheduling)
 */
export const checkConflict = async (participants, date, startTime, endTime, excludeSessionId = null) => {
  // Find all active sessions for these participants on this date
  const query = {
    participants: { $in: participants },
    date: date,
    status: { $in: ['Pending', 'Accepted', 'Scheduled', 'Rescheduled'] }
  };

  if (excludeSessionId) {
    query._id = { $ne: excludeSessionId };
  }

  const existingSessions = await Session.find(query).lean();

  if (existingSessions.length === 0) {
    return { hasConflict: false, conflictingSession: null, conflictUser: null };
  }

  const newStart = timeToMinutes(startTime);
  const newEnd = timeToMinutes(endTime);

  for (const session of existingSessions) {
    // Determine the end time of the existing session. 
    // If it has a specific endTime, use it. Otherwise calculate from time + duration.
    let existStart = timeToMinutes(session.startTime || session.time);
    let existEnd = 0;

    if (session.endTime) {
      existEnd = timeToMinutes(session.endTime);
    } else {
      // Legacy session using duration string like '60 mins'
      const durationMins = parseInt(session.duration.split(' ')[0]) || 60;
      existEnd = existStart + durationMins;
    }

    if (isOverlap(newStart, newEnd, existStart, existEnd)) {
      // Find whose session it is (could be both)
      const conflictUser = participants.find(p => session.participants.includes(p));
      return {
        hasConflict: true,
        conflictingSession: session,
        conflictUser
      };
    }
  }

  return { hasConflict: false, conflictingSession: null, conflictUser: null };
};
