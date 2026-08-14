import React from 'react';
import NotificationCard from './NotificationCard';
import NotificationTabs from './NotificationTabs';

const NotificationDropdown = ({ 
  notifications, 
  activeTab, 
  onTabChange, 
  onMarkAllRead, 
  onClearAll, 
  onNotificationClick,
  loading
}) => {
  const filteredNotifications = activeTab === 'All' 
    ? notifications 
    : notifications.filter(n => {
        if (activeTab === 'Messages') return n.type === 'MESSAGE';
        if (activeTab === 'Sessions') return n.type === 'SESSION';
        if (activeTab === 'Reviews') return n.type === 'REVIEW';
        if (activeTab === 'System') return ['SYSTEM', 'ADMIN'].includes(n.type);
        return true;
      });

  return (
    <div role="region" aria-label="Notifications panel" className="absolute right-0 mt-2 w-80 md:w-96 bg-[var(--bg-card)] rounded-2xl shadow-xl border border-[var(--border)] overflow-hidden" style={{ zIndex: 'var(--z-dropdown)' }}>
      <div className="p-4 border-b border-[var(--border)] bg-[var(--surface2)]" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h3 className="font-bold text-[var(--text)] text-lg">Notifications</h3>
        <button
          onClick={onMarkAllRead}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '0.78rem',
            color: '#7c3aed',
            cursor: 'pointer',
            fontWeight: 500,
            padding: '2px 0'
          }}
        >
          Mark all as read
        </button>
      </div>

      <NotificationTabs activeTab={activeTab} onTabChange={onTabChange} />

      <div className="max-h-[400px] overflow-y-auto">
        {loading ? (
          <div className="p-4 space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse flex gap-3">
                <div className="w-10 h-10 bg-gray-200 rounded-full shrink-0"></div>
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <div className="text-3xl mb-2">📭</div>
            <p className="text-sm">No notifications here</p>
          </div>
        ) : (
          (() => {
            const today = new Date().toDateString();
            const todayItems = filteredNotifications.filter(n => new Date(n.createdAt).toDateString() === today);
            const earlierItems = filteredNotifications.filter(n => new Date(n.createdAt).toDateString() !== today);

            return (
              <>
                {todayItems.length > 0 && (
                  <>
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '8px 16px 4px' }}>
                      Today
                    </div>
                    {todayItems.map(notification => (
                      <NotificationCard 
                        key={notification._id} 
                        notification={notification} 
                        onClick={onNotificationClick}
                      />
                    ))}
                  </>
                )}
                {earlierItems.length > 0 && (
                  <>
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '8px 16px 4px' }}>
                      Earlier
                    </div>
                    {earlierItems.map(notification => (
                      <NotificationCard 
                        key={notification._id} 
                        notification={notification} 
                        onClick={onNotificationClick}
                      />
                    ))}
                  </>
                )}
              </>
            );
          })()
        )}
      </div>

      <div className="p-3 border-t border-[var(--border)] bg-[var(--surface2)] flex justify-between gap-2">
        <button 
          onClick={onMarkAllRead}
          className="flex-1 py-2 text-xs font-semibold text-[var(--accent-light)] hover:bg-[var(--accent-dim)] rounded-lg transition-colors"
        >
          Mark All Read
        </button>
        <button 
          onClick={onClearAll}
          className="flex-1 py-2 text-xs font-semibold text-[var(--red-text)] hover:bg-[var(--red-bg)] rounded-lg transition-colors"
        >
          Clear All
        </button>
      </div>
    </div>
  );
};

export default NotificationDropdown;
