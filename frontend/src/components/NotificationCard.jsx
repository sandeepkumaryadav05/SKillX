import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useNow } from '../hooks/useNow';

const NotificationCard = ({ notification, onClick }) => {
  const navigate = useNavigate();
  const now = useNow();

  const getIcon = (type) => {
    switch (type) {
      case 'MESSAGE': return '💬';
      case 'REQUEST': return '🔁';
      case 'SESSION': return '📅';
      case 'REVIEW': return '⭐';
      case 'GIG': return '💼';
      case 'SYSTEM': return '⚠';
      case 'ADMIN': return '🛡';
      default: return '🔔';
    }
  };

  const timeAgo = (dateStr, currentTime) => {
    const diff = currentTime - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  const handleClick = () => {
    // Mark as read via parent callback (keeps existing logic)
    if (onClick) onClick(notification);

    // Navigate based on notification type
    switch (notification.type) {
      case 'MESSAGE':
        navigate('/chat', {
          state: { roomId: notification.referenceId },
        });
        break;
      case 'REQUEST':
        navigate('/profile', {
          state: { scrollTo: 'exchanges' },
        });
        break;
      case 'SESSION':
        if (notification.referenceId) {
          navigate(`/session/${notification.referenceId}`);
        } else {
          navigate('/dashboard');
        }
        break;
      case 'REVIEW':
        navigate('/profile');
        break;
      default:
        navigate('/dashboard');
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`p-4 flex gap-3 cursor-pointer transition-colors border-b border-[var(--border)] last:border-0 hover:bg-[var(--surface2)] ${
        !notification.isRead ? 'bg-[var(--accent-dim)]/20' : 'bg-transparent'
      }`}
    >
      <div className="flex-shrink-0 text-xl w-10 h-10 bg-[var(--surface2)] border border-[var(--border)] rounded-full flex items-center justify-center">
        {getIcon(notification.type)}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm ${!notification.isRead ? 'font-semibold text-[var(--text)]' : 'text-[var(--text-muted)]'}`}>
          {notification.message}
        </p>
        <span style={{ fontSize: '0.72rem', color: '#9ca3af' }}>{timeAgo(notification.createdAt, now)}</span>
      </div>
      {!notification.isRead && (
        <div className="w-2 h-2 bg-indigo-600 rounded-full mt-2 flex-shrink-0"></div>
      )}
    </div>
  );
};

export default NotificationCard;
