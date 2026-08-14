export const processUpcomingSessions = (sessions) => {
  // Filter for sessions that are still scheduled to occur
  const activeSessions = sessions.filter(s => 
    s.status === 'Scheduled' || s.status === 'Rescheduled'
  );
  
  // Sort chronologically (YYYY-MM-DD HH:mm string sorting works natively)
  activeSessions.sort((a, b) => {
    const timeA = a.time || '00:00';
    const timeB = b.time || '00:00';
    const dateA = a.date || '9999-12-31';
    const dateB = b.date || '9999-12-31';
    
    if (dateA !== dateB) {
      return dateA.localeCompare(dateB);
    }
    return timeA.localeCompare(timeB);
  });
  
  return activeSessions;
};

export const getNearestSession = (sessions) => {
  const sorted = processUpcomingSessions(sessions);
  // To avoid strict timezone mismatch issues, we let the frontend determine 
  // if the absolute closest one is past its duration. 
  // We just return the first chronological active session.
  return sorted.length > 0 ? sorted[0] : null;
};
