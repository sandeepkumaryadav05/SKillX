import UserProfile from '../models/UserProfile.js';
import Session from '../models/Session.js';

/**
 * Helper to add days to a date
 */
const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

/**
 * Format a Date as a local YYYY-MM-DD string.
 * (Using toISOString() here would shift dates by a day for servers east of UTC.)
 */
const toDateStr = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
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
 * Convert minutes since midnight to HH:mm
 */
const minutesToTime = (mins) => {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
};

/**
 * Derive a session's end time. Falls back to `time` + `duration` for legacy
 * sessions that never stored startTime/endTime.
 */
const getSessionEndTime = (session) => {
  if (session.endTime) return session.endTime;
  const start = session.startTime || session.time;
  const durationMins = parseInt(String(session.duration || '60').split(' ')[0], 10) || 60;
  return minutesToTime(timeToMinutes(start) + durationMins);
};

/**
 * Get user availability by email (generates actual available slots for the next 14 days)
 */
export const getAvailability = async (email) => {
  const user = await UserProfile.findOne({ email }).lean();
  if (!user) return [];

  const recurring = user.availability || [];
  const custom = user.customAvailability || [];

  // Generate the next 14 days
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const daysMap = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  let allPossibleSlots = [];

  for (let i = 0; i < 14; i++) {
    const targetDate = addDays(today, i);
    const dateStr = toDateStr(targetDate);
    const dayName = daysMap[targetDate.getDay()];

    // Add recurring slots for this day
    const dayAvail = recurring.find(a => a.day === dayName);
    if (dayAvail && dayAvail.slots) {
      dayAvail.slots.forEach(slot => {
        allPossibleSlots.push({
          date: dateStr,
          startTime: slot.startTime,
          endTime: slot.endTime,
          type: 'recurring'
        });
      });
    }

    // Add custom slots for this date
    const customAvail = custom.find(a => a.date === dateStr);
    if (customAvail && customAvail.slots) {
      customAvail.slots.forEach(slot => {
        allPossibleSlots.push({
          date: dateStr,
          startTime: slot.startTime,
          endTime: slot.endTime,
          type: 'custom'
        });
      });
    }
  }

  // Fetch all booked sessions for this user (Scheduled or Pending) in the next 14 days
  const endDateStr = toDateStr(addDays(today, 14));
  const bookedSessions = await Session.find({
    participants: email,
    status: { $in: ['Scheduled', 'Rescheduled', 'Pending'] },
    date: { $gte: toDateStr(today), $lte: endDateStr }
  }).lean();

  // Filter out slots that conflict with booked sessions
  // A simple overlap check: max(start1, start2) < min(end1, end2)
  const availableSlots = allPossibleSlots.filter(slot => {
    const slotConflictingSession = bookedSessions.find(session => {
      if (session.date !== slot.date) return false;
      const s2 = session.startTime || session.time;
      const e2 = getSessionEndTime(session);

      // If we still have no start time, fall back to conflicting (defensive)
      if (!s2) return true;

      return (slot.startTime < e2 && s2 < slot.endTime);
    });
    return !slotConflictingSession;
  });

  // Sort chronologically
  availableSlots.sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return a.startTime.localeCompare(b.startTime);
  });

  return availableSlots;
};

/**
 * Save user availability (recurring and custom)
 */
export const saveAvailability = async (email, availability, customAvailability = []) => {
  const updateData = { availability };
  if (customAvailability) {
    updateData.customAvailability = customAvailability;
  }
  
  const user = await UserProfile.findOneAndUpdate(
    { email },
    updateData,
    { returnDocument: 'after' }
  ).lean();

  if (!user) throw new Error('User not found');
  return { availability: user.availability, customAvailability: user.customAvailability };
};

/**
 * Check if a given date and time matches user's availability
 * @param {Array} availableSlots Flat array returned by getAvailability
 * @param {String} dateString YYYY-MM-DD
 * @param {String} startTime HH:mm
 * @param {String} endTime HH:mm
 */
export const checkMatchesAvailability = (availableSlots, dateString, startTime, endTime) => {
  if (!availableSlots || availableSlots.length === 0) return false;

  // Check if requested time falls within ANY of the available slots for that date
  for (const slot of availableSlots) {
    if (slot.date === dateString) {
      if (startTime >= slot.startTime && endTime <= slot.endTime) {
        return true;
      }
    }
  }

  return false;
};
