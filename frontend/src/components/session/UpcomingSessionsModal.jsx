import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../api/apiClient';
import { useNow } from '../../hooks/useNow';

const UpcomingSessionsModal = ({ isOpen, onClose, userEmail }) => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const now = useNow();

  useEffect(() => {
    if (isOpen && userEmail) {
      const fetchAllUpcoming = async () => {
        try {
          setLoading(true);
          const res = await apiFetch(`/api/sessions/all-upcoming?email=${encodeURIComponent(userEmail)}`);
          if (res.ok) {
            const data = await res.json();
            setSessions(data);
          }
        } catch (err) {
          console.error('Failed to fetch all upcoming sessions', err);
        } finally {
          setLoading(false);
        }
      };
      fetchAllUpcoming();
    }
  }, [isOpen, userEmail]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-[var(--bg-card)] rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-800">
            Upcoming Sessions
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[var(--bg-card)] text-[var(--text-secondary)] transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[70vh]">
          {loading ? (
            <div className="space-y-4 animate-pulse">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-20 bg-[var(--bg-card)] rounded-xl"></div>
              ))}
            </div>
          ) : sessions.length === 0 ? (
            <p className="text-[var(--text-secondary)] text-center py-8">No upcoming sessions found.</p>
          ) : (
            <div className="space-y-4">
              {sessions.map((session) => {
                const dateObj = new Date(session.date);
                
                // Format the text representation
                let timeText = '';
                const sessionTime = new Date(`${session.date}T${session.time}`).getTime();
                const distance = sessionTime - now;
                const days = Math.floor(distance / (1000 * 60 * 60 * 24));
                const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

                if (distance <= 0) timeText = 'Live';
                else if (days === 0 && hours === 0) timeText = 'Starts soon';
                else if (days === 0) timeText = `Starts in ${hours} hrs`;
                else if (days === 1) timeText = 'Tomorrow';
                else timeText = `${days} days later`;

                const otherName = (session.participants?.find(p => p !== userEmail) || 'Unknown').split('@')[0];

                return (
                  <div key={session._id} className="flex flex-col gap-2 p-4 border border-gray-100 rounded-xl hover:bg-[var(--bg-card)] transition-colors relative">
                    {/* Badge */}
                    <div className="absolute top-4 right-4 bg-indigo-50 text-indigo-700 text-xs font-bold px-2 py-1 rounded">
                      {timeText}
                    </div>
                    
                    <h4 className="font-bold text-gray-800 capitalize pr-24">
                      {userEmail.split('@')[0]} ↔ {otherName}
                    </h4>
                    
                    <p className="text-sm text-[var(--text-secondary)] flex items-center gap-2">
                      <span className="font-medium text-gray-700">{dateObj.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span> 
                      • 
                      <span>{new Date(`1970-01-01T${session.time}`).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}</span>
                    </p>
                    
                    <div className="flex flex-wrap gap-2 mt-2">
                      {session.exchangeRoles?.[userEmail]?.mentorSkills?.map(s => (
                        <span key={s} className="text-xs bg-[var(--bg-card)] text-gray-600 px-2 py-0.5 rounded">{s}</span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-100 bg-[var(--bg-card)] flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 bg-[var(--bg-card)] rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default UpcomingSessionsModal;
