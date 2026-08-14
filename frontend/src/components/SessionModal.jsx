import React, { useState, useEffect, useRef, useCallback } from 'react';
import { apiFetch } from '../api/apiClient';

const SessionModal = ({ isOpen, onClose, onSubmit, isSubmitting, initialData, currentUserEmail, recipientEmail }) => {
  const [method, setMethod] = useState('custom'); // 'slots' or 'custom'
  const [date, setDate] = useState(initialData?.date || '');
  const [time, setTime] = useState(initialData?.time || '');
  const [duration, setDuration] = useState(initialData?.duration || '60 mins');
  const [mode, setMode] = useState(initialData?.mode || 'Remote');
  const [notes, setNotes] = useState(initialData?.notes || '');
  const [isPreApproved, setIsPreApproved] = useState(false);
  const [error, setError] = useState('');

  // Conflict and availability
  const [recipientAvail, setRecipientAvail] = useState([]);
  const [conflictWarning, setConflictWarning] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [checkingConflict, setCheckingConflict] = useState(false);
  const debounceRef = useRef(null);

  useEffect(() => {
    if (isOpen && recipientEmail) {
      apiFetch(`/api/schedule/availability/${recipientEmail}`)
        .then(res => res.json())
        .then(data => {
          setRecipientAvail(data);
          if (data && data.length > 0) setMethod('slots');
        })
        .catch(err => console.error(err));
    }
  }, [isOpen, recipientEmail]);

  const checkConflicts = useCallback(async (checkDate, checkTime, checkDur) => {
    if (!currentUserEmail || !recipientEmail) return;

    setCheckingConflict(true);
    setConflictWarning(null);
    setSuggestions([]);

    try {
      const durMins = parseInt(checkDur.split(' ')[0]) || 60;
      const [h, m] = checkTime.split(':').map(Number);
      const endMins = (h * 60 + m) + durMins;
      const endH = Math.floor(endMins / 60).toString().padStart(2, '0');
      const endM = (endMins % 60).toString().padStart(2, '0');
      const endTime = `${endH}:${endM}`;

      const res = await apiFetch(`/api/schedule/session/check-conflict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          participants: [currentUserEmail, recipientEmail],
          date: checkDate,
          startTime: checkTime,
          endTime
        })
      });

      const data = await res.json();

      if (data.hasConflict) {
        setConflictWarning(data);

        // Fetch suggestions
        const sugRes = await apiFetch(`/api/schedule/session/suggestions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            participants: [currentUserEmail, recipientEmail],
            date: checkDate,
            durationMins: durMins
          })
        });
        const sugData = await sugRes.json();
        setSuggestions(sugData);
      } else if (data.matchesAvailability) {
        // If no conflict but outside availability
        const recipientMatched = data.matchesAvailability[recipientEmail];
        if (recipientMatched === false) {
          setConflictWarning({ type: 'outside_availability' });
        }
      }

    } catch (err) {
      console.error(err);
    } finally {
      setCheckingConflict(false);
    }
  }, [currentUserEmail, recipientEmail]);

  useEffect(() => {
    if (method === 'custom' && date && time) {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        checkConflicts(date, time, duration);
      }, 500);
    }
  }, [date, time, duration, method, checkConflicts]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!date || !time) {
      setError('Date and time are required.');
      return;
    }

    const sessionDateTime = new Date(`${date}T${time}`);
    if (sessionDateTime < new Date()) {
      setError('Cannot schedule a session in the past.');
      return;
    }

    onSubmit({ date, time, duration, mode, notes, isPreApproved });
  };

  const handleSlotSelect = (slot) => {
    setDate(slot.date);
    setTime(slot.startTime);
    setIsPreApproved(true);
    setMethod('custom'); // Switch to custom to show form and run conflict checks
  };

  const handleSuggestionSelect = (sug) => {
    setTime(sug.startTime);
    setIsPreApproved(false);
    setConflictWarning(null);
  };

  const groupedAvail = recipientAvail.reduce((acc, slot) => {
    if (!acc[slot.date]) acc[slot.date] = [];
    acc[slot.date].push(slot);
    return acc;
  }, {});

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200 backdrop-blur-[4px]" style={{ background: 'rgba(0, 0, 0, 0.7)' }}>
      <div className="bg-[var(--bg-card)] rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col">
        <div className="p-6 border-b border-[var(--border-subtle)] flex items-center justify-between">
          <h2 className="text-xl font-bold text-[var(--text-primary)]">
            {initialData ? 'Reschedule Session' : 'Schedule Session'}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[var(--bg-card)] text-[var(--text-secondary)] transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[75vh]">
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
              {error}
            </div>
          )}

          {!initialData && recipientAvail.length > 0 && (
            <div className="flex gap-2 mb-6 bg-[var(--bg-input)] p-1 rounded-xl">
              <button
                onClick={() => setMethod('slots')}
                className={`flex-1 py-2 text-sm font-bold rounded-lg transition ${method === 'slots' ? 'bg-[var(--brand-purple)] text-white shadow-sm' : 'text-[var(--text-secondary)] hover:text-white'}`}
              >
                Available Slots
              </button>
              <button
                onClick={() => { setMethod('custom'); setIsPreApproved(false); }}
                className={`flex-1 py-2 text-sm font-bold rounded-lg transition ${method === 'custom' ? 'bg-[var(--brand-purple)] text-white shadow-sm' : 'text-[var(--text-secondary)] hover:text-white'}`}
              >
                Suggest Custom Time
              </button>
            </div>
          )}

          {method === 'slots' ? (
            <div className="space-y-4">
              <h3 className="font-bold text-[var(--text-primary)] text-sm">Pick a preferred slot:</h3>
              {Object.entries(groupedAvail).map(([dateStr, slots]) => {
                const dateObj = new Date(dateStr);
                const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dateObj.getDay()];
                const formattedDate = dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                return (
                  <div key={dateStr} className="flex gap-4 border border-[var(--border-subtle)] p-4 rounded-xl hover:bg-[var(--bg-input)] transition">
                    <div className="w-16">
                      <div className="font-bold text-[var(--text-secondary)]">{dayName}</div>
                      <div className="text-xs text-[var(--text-primary)]">{formattedDate}</div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {slots.map((slot, i) => (
                        <button
                          key={i}
                          onClick={() => handleSlotSelect(slot)}
                          className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition bg-[var(--brand-purple-alpha)] text-[var(--brand-purple-light)] border border-[rgba(124,111,224,0.4)] hover:bg-[rgba(124,111,224,0.3)]`}
                          title={slot.type === 'custom' ? 'Custom Date Slot' : 'Weekly Slot'}
                        >
                          {slot.startTime} - {slot.endTime}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <form id="session-form" onSubmit={handleSubmit} className="space-y-4">

              {conflictWarning?.hasConflict && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                  <p className="text-sm font-bold text-red-700 flex items-center gap-2">
                    <span>⚠</span> Time Conflict Detected
                  </p>
                  <p className="text-xs text-red-600 mt-1">
                    {conflictWarning.conflictUser === currentUserEmail ? 'You already have' : 'The recipient already has'} a session at this time.
                  </p>
                  {suggestions.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs font-bold text-gray-700 mb-2">Suggestions:</p>
                      <div className="flex gap-2">
                        {suggestions.map((s, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => handleSuggestionSelect(s)}
                            className="bg-[var(--bg-card)] border border-[var(--border-subtle)] text-gray-700 px-2 py-1 rounded text-xs hover:bg-[var(--bg-card)] font-medium"
                          >
                            {s.startTime}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {conflictWarning?.type === 'outside_availability' && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-xl flex items-start gap-2">
                  <span className="text-yellow-600">⚠</span>
                  <div>
                    <p className="text-sm font-bold text-yellow-800">Outside preferred availability</p>
                    <p className="text-xs text-yellow-700 mt-0.5">You can still send the request, but they might be less likely to accept.</p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">Date *</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-[var(--bg-input)] border border-[var(--border-subtle)] text-[var(--text-primary)] rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-[var(--brand-purple)] focus:border-[var(--brand-purple)] focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-1 flex justify-between">
                    Time *
                    {checkingConflict && <span className="text-xs text-[var(--brand-purple)]">Checking...</span>}
                  </label>
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className={`w-full bg-[var(--bg-input)] border text-[var(--text-primary)] rounded-lg px-3 py-2 text-sm focus:ring-1 focus:outline-none ${conflictWarning?.hasConflict ? 'border-red-400 focus:ring-red-500 focus:border-red-500' : 'border-[var(--border-subtle)] focus:ring-[var(--brand-purple)] focus:border-[var(--brand-purple)]'}`}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">Duration</label>
                <select
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full bg-[var(--bg-input)] border border-[var(--border-subtle)] text-[var(--text-primary)] rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-[var(--brand-purple)] focus:border-[var(--brand-purple)] focus:outline-none"
                >
                  <option value="30 mins">30 mins</option>
                  <option value="60 mins">60 mins</option>
                  <option value="90 mins">90 mins</option>
                  <option value="120 mins">120 mins</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">Mode</label>
                <select
                  value={mode}
                  onChange={(e) => setMode(e.target.value)}
                  className="w-full bg-[var(--bg-input)] border border-[var(--border-subtle)] text-[var(--text-primary)] rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-[var(--brand-purple)] focus:border-[var(--brand-purple)] focus:outline-none"
                >
                  <option value="Remote">Remote</option>
                  <option value="Video Session">Video Session</option>
                  <option value="In Person">In Person</option>
                  <option value="Chat Session">Chat Session</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">Notes (Optional)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Will this time work?"
                  className="w-full bg-[var(--bg-input)] border border-[var(--border-subtle)] text-[var(--text-primary)] placeholder-[var(--text-muted-new)] rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-[var(--brand-purple)] focus:border-[var(--brand-purple)] focus:outline-none h-24 resize-none"
                />
              </div>
            </form>
          )}
        </div>

        <div className="p-6 border-t border-[var(--border-subtle)] bg-[var(--bg-card)] flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-[#9CA3AF] hover:text-white bg-transparent rounded-lg transition-colors"
          >
            Cancel
          </button>

          {method === 'custom' && (
            <button
              type="submit"
              form="session-form"
              disabled={isSubmitting}
              className={`px-6 py-2 text-sm font-medium text-white rounded-lg shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${conflictWarning?.hasConflict ? 'bg-red-600 hover:bg-red-700' : 'bg-[var(--brand-purple)] hover:bg-[#6b5edd]'}`}
            >
              {isSubmitting ? 'Saving...' : (conflictWarning?.hasConflict ? 'Send Anyway' : (initialData ? 'Update Session' : 'Send Request'))}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SessionModal;
