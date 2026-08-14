import { getAvailability } from './availabilityService.js';
import { checkConflict } from './conflictService.js';

/**
 * Convert time string HH:mm to minutes since midnight
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
 * Generate suggestions for a new time slot
 */
export const suggestAlternativeSlots = async (participants, dateString, durationMins = 60) => {
  // Get availabilities for both users
  let availabilities = [];
  try {
    const user1Avail = await getAvailability(participants[0]);
    const user2Avail = await getAvailability(participants[1]);
    availabilities = [user1Avail, user2Avail];
  } catch (e) {
    console.error('Error fetching availability for suggestions', e);
  }

  // We will try to find 3 suggestions.
  // We check from 09:00 to 21:00 in 30 min increments.
  const suggestions = [];
  const startOfDay = timeToMinutes('09:00');
  const endOfDay = timeToMinutes('21:00');
  const step = 30;

  for (let mins = startOfDay; mins <= endOfDay - durationMins; mins += step) {
    const slotStart = minutesToTime(mins);
    const slotEnd = minutesToTime(mins + durationMins);

    // 1. Check if this slot conflicts with either user's schedule
    const conflict = await checkConflict(participants, dateString, slotStart, slotEnd);
    if (!conflict.hasConflict) {
      // Score this slot. Higher is better.
      let score = 0;

  // Check if it matches availability (getAvailability returns a flat list of
  // { date, startTime, endTime } slots, so match on date + time window)
  let matchesUser1 = false;
  let matchesUser2 = false;

  if (availabilities[0] && availabilities[0].length > 0) {
    matchesUser1 = availabilities[0].some(
      a => a.date === dateString && slotStart >= a.startTime && slotEnd <= a.endTime
    );
  }

  if (availabilities[1] && availabilities[1].length > 0) {
    matchesUser2 = availabilities[1].some(
      a => a.date === dateString && slotStart >= a.startTime && slotEnd <= a.endTime
    );
  }

      if (matchesUser1 && matchesUser2) score = 3; // Common availability
      else if (matchesUser1 || matchesUser2) score = 2; // Matches one user
      else score = 1; // Free slot but outside availability

      suggestions.push({
        startTime: slotStart,
        endTime: slotEnd,
        score
      });
    }

    if (suggestions.length >= 10) break; // Don't generate too many
  }

  // Sort by score (highest first) and return top 3
  suggestions.sort((a, b) => b.score - a.score);
  return suggestions.slice(0, 3).map(s => ({
    startTime: s.startTime,
    endTime: s.endTime
  }));
};
