import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useNow } from '../hooks/useNow';

const SessionCard = ({ session, onReschedule, onCancel, onComplete, onReview, userEmail, onAccept, onDecline }) => {
  const [timeLeft, setTimeLeft] = useState('');
  const [prevStatus, setPrevStatus] = useState(session.status);
  const now = useNow();

  // Reset the countdown label when the session status changes
  if (prevStatus !== session.status) {
    setPrevStatus(session.status);
    setTimeLeft('');
  }

  useEffect(() => {
    if (session.status !== 'Scheduled' && session.status !== 'Rescheduled') {
      return;
    }

    const sessionTime = new Date(`${session.date}T${session.time}`).getTime();

    const updateTimer = () => {
      const distance = sessionTime - new Date().getTime();

      if (distance < 0) {
        setTimeLeft('Live now');
        return;
      }

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));

      if (days > 0) {
        setTimeLeft(`In ${days} day${days > 1 ? 's' : ''}`);
      } else if (hours > 0) {
        setTimeLeft(`In ${hours} hour${hours > 1 ? 's' : ''}`);
      } else {
        setTimeLeft(`In ${minutes} minute${minutes > 1 ? 's' : ''}`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 60000);

    return () => clearInterval(interval);
  }, [session.date, session.time, session.status]);

  const getStatusColor = (status, isReceiver) => {
    switch (status) {
      case 'Scheduled':
      case 'Rescheduled':
        return 'bg-[var(--green-bg)] text-[var(--green-text)] border border-[var(--green)]';
      case 'Completed':
        return 'bg-[var(--accent-dim)] text-[var(--accent-light)] border border-[var(--accent)]';
      case 'Cancelled':
      case 'Declined':
        return 'bg-[var(--surface2)] text-[var(--text-muted)] border border-[var(--border-subtle)]';
      case 'Pending':
        return isReceiver 
          ? 'bg-[rgba(124,111,224,0.15)] text-[#A78BFA] border border-[rgba(124,111,224,0.3)]' 
          : 'bg-[rgba(234,179,8,0.15)] text-[#EAB308] border border-[rgba(234,179,8,0.3)]';
      default:
        return 'bg-[var(--surface2)] text-[var(--text-muted)] border border-[var(--border)]';
    }
  };

  const isActive = session.status === 'Scheduled' || session.status === 'Rescheduled';
  const isPending = session.status === 'Pending';
  const isCompleted = session.status === 'Completed';
  const isDeclined = session.status === 'Declined';
  const isCancelled = session.status === 'Cancelled';
  const hasReviewed = session.reviewedBy && session.reviewedBy.includes(userEmail);
  const isReceiver = session.requestedBy && session.requestedBy !== userEmail;
  const isSender = session.requestedBy === userEmail;

  // Join button logic — only Video Sessions within the 15-min early window
  const isVideoSession = session.mode === 'Video Session';
  const canJoinNow = isActive && isVideoSession && (() => {
    const sessionTime = new Date(`${session.date}T${session.time}`).getTime();
    const durationMs = parseInt(session.duration || '60') * 60 * 1000;
    const earlyWindow = 15 * 60 * 1000;
    const lateWindow = durationMs + 30 * 60 * 1000;
    return now >= sessionTime - earlyWindow && now <= sessionTime + lateWindow;
  })();

  const userRoles = session.exchangeRoles?.[userEmail] || { mentorSkills: [], learnerSkills: [] };
  const hasRoles = userRoles.mentorSkills.length > 0 || userRoles.learnerSkills.length > 0;

  return (
    <div className={`bg-[var(--bg-card)] border border-[var(--border-subtle)] shadow-sm rounded-xl p-4 transition-shadow group flex flex-col justify-between h-full ${(isDeclined || isCancelled) ? 'opacity-70' : 'hover:shadow-md'}`}>
      <div className="flex justify-between items-start mb-3">
        <div>
          {isPending && isReceiver ? (
            <>
              <h4 className="font-bold text-[var(--text-primary)] flex items-center gap-1.5 text-sm mb-1">
                📅 Session request from {session.requestedBy.split('@')[0]}
              </h4>
              <p className="text-[14px] text-[var(--text-secondary)] font-medium mt-1">
                {new Date(session.date).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })} · {new Date(`1970-01-01T${session.time}`).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })} · {session.duration}
              </p>
              <p className="text-[14px] text-[var(--text-secondary)] font-medium">
                {session.mode}
              </p>
            </>
          ) : (
            <>
              <h4 className="font-bold text-[var(--brand-purple-light)] flex items-center gap-1.5 text-sm">
                📅 {new Date(session.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
              </h4>
              <p className="text-[var(--text-primary)]" style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '4px' }}>
                with {session.partnerName || session.partner?.name || session.participants?.find(p => p !== userEmail)?.split('@')[0] || 'Unknown'}
              </p>
              <p className="text-[11px] text-[var(--text-secondary)] mt-1 font-medium">
                {new Date(`1970-01-01T${session.time}`).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })} • {session.duration} • {session.mode}
              </p>
            </>
          )}

          {hasRoles && (
            <div className="flex flex-wrap gap-1 mt-2">
              {userRoles.mentorSkills.map((skill, idx) => (
                <span key={`mentor-${idx}`} className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-purple-100 text-purple-700">
                  {skill} Mentor
                </span>
              ))}
              {userRoles.learnerSkills.map((skill, idx) => (
                <span key={`learner-${idx}`} className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-teal-100 text-teal-700">
                  {skill} Learner
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider ${getStatusColor(session.status, isReceiver)}`}>
            {session.status === 'Pending'
              ? isReceiver
                ? 'ACTION REQUIRED'
                : 'AWAITING THEIR REPLY'
              : session.status === 'Declined'
              ? 'Request Declined'
              : session.status === 'Cancelled'
              ? 'Request Cancelled'
              : session.status === 'Scheduled' || session.status === 'Rescheduled'
              ? 'CONFIRMED'
              : session.status}
          </span>
          {isActive && timeLeft && (
            <span className={`text-[10px] font-bold flex items-center gap-1 ${timeLeft === 'Live now' ? 'text-[var(--accent-light)] bg-[var(--accent-dim)] px-2 py-0.5 rounded-full border border-[var(--accent)]' : 'text-orange-500'}`}>
              {timeLeft === 'Live now' && <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-pulse" />}
              {timeLeft !== 'Live now' && '⏳'} {timeLeft}
            </span>
          )}
        </div>
      </div>

      {session.notes && (
        <div className="mb-4 bg-[var(--bg-input)] p-3 rounded-lg border border-[var(--border-subtle)]">
          <p className="text-sm text-[var(--text-secondary)] italic">"{session.notes}"</p>
        </div>
      )}

      {isActive && (
        <div className="flex gap-2 pt-2 border-t border-[var(--border-subtle)] mt-4">
          {canJoinNow ? (
            <Link
              to={`/session/${session._id}`}
              className="flex-1 text-sm font-semibold py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors text-center flex items-center justify-center gap-1.5 shadow-sm"
            >
              🎥 Join Session
            </Link>
          ) : isVideoSession ? (
            <button
              disabled
              className="flex-1 text-sm font-medium py-2 rounded-lg bg-[var(--bg-card)] text-gray-400 cursor-not-allowed relative group"
            >
              🎥 Join Session
              <span className="absolute bottom-full mb-2 hidden group-hover:block w-max bg-gray-800 text-white text-xs px-2 py-1 rounded left-1/2 -translate-x-1/2 whitespace-nowrap z-10">
                Available 15 min before session time
              </span>
            </button>
          ) : (
            <button
              disabled
              className="flex-1 text-sm font-medium py-2 rounded-lg bg-indigo-50 text-indigo-400 cursor-not-allowed relative group"
            >
              Join
              <span className="absolute bottom-full mb-2 hidden group-hover:block w-max bg-gray-800 text-white text-xs px-2 py-1 rounded left-1/2 -translate-x-1/2 whitespace-nowrap z-10">
                Set mode to "Video Session" to join via SkillX
              </span>
            </button>
          )}

          <button
            onClick={() => onReschedule(session)}
            className="flex-1 text-sm font-medium py-2 rounded-lg border border-[var(--border-subtle)] text-gray-700 hover:bg-[var(--bg-card)] transition-colors"
          >
            Reschedule
          </button>

          <div className="flex gap-2">
            <button
              onClick={() => onComplete(session._id)}
              title="Mark Completed"
              className="w-9 h-9 flex items-center justify-center rounded-lg border border-green-200 text-green-600 hover:bg-green-50 transition-colors"
            >
              ✓
            </button>
            <button
              onClick={() => onCancel(session._id)}
              title="Cancel Session"
              className="w-9 h-9 flex items-center justify-center rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Pending session — Accept / Suggest Alternative / Reject */}
      {isPending && (
        <div className="flex gap-2 pt-2 border-t border-[var(--border-subtle)] mt-4">
          {isReceiver ? (
            <>
              <button
                onClick={() => onDecline(session._id)}
                className="flex-1 text-sm font-semibold py-2 rounded-lg bg-transparent border border-[#4B5563] text-[#9CA3AF] hover:border-[#EF4444] hover:text-[#EF4444] transition-colors"
              >
                ✕ Decline
              </button>
              <button
                onClick={() => onAccept(session._id)}
                className="flex-1 text-sm font-semibold py-2 rounded-lg bg-[#7C6FE0] text-white hover:bg-[#6B5FCC] transition-colors shadow-sm border border-transparent"
              >
                ✓ Accept
              </button>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-between">
              <span className="text-sm font-medium text-[var(--text-muted-new)] italic">Awaiting their reply...</span>
              <button
                onClick={() => onCancel(session._id)}
                className="text-xs font-semibold py-1.5 px-3 rounded-lg bg-transparent border border-[#4B5563] text-[#9CA3AF] hover:border-[#EF4444] hover:text-[#EF4444] transition-colors"
              >
                Cancel Request
              </button>
            </div>
          )}
        </div>
      )}

      {/* Declined / Cancelled Actions */}
      {(isDeclined || isCancelled) && isSender && (
        <div className="flex gap-2 pt-2 border-t border-[var(--border-subtle)] mt-4">
          <button
            onClick={() => onReschedule(session)}
            className="flex-1 text-sm font-semibold py-2 rounded-lg border border-[var(--border-subtle)] text-[var(--text-primary)] hover:bg-[var(--surface2)] transition-colors"
          >
            Reschedule
          </button>
        </div>
      )}

      {isCompleted && !hasReviewed && onReview && (
        <div className="pt-3 border-t border-gray-50 mt-4">
          <button
            onClick={() => onReview(session)}
            className="w-full text-sm font-semibold py-2.5 rounded-lg bg-gradient-to-r from-yellow-400 to-orange-400 text-white hover:from-yellow-500 hover:to-orange-500 transition-all shadow-sm flex items-center justify-center gap-2"
          >
            ⭐ Rate This Session
          </button>
        </div>
      )}

      {isCompleted && hasReviewed && (
        <div className="pt-3 border-t border-gray-50 mt-4">
          <p className="text-xs text-center text-green-600 font-medium">✅ You reviewed this session</p>
        </div>
      )}
    </div>
  );
};

export default SessionCard;
