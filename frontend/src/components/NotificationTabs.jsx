import React from 'react';

const NotificationTabs = ({ activeTab, onTabChange }) => {
  const tabs = ['All', 'Messages', 'Sessions', 'Reviews', 'System'];

  return (
    <div className="flex gap-2 p-3 border-b border-gray-100 overflow-x-auto scrollbar-hide">
      {tabs.map((tab) => (
        <button
          key={tab}
          onClick={() => onTabChange(tab)}
          className={`px-3 py-1 text-xs font-semibold rounded-full whitespace-nowrap transition-colors ${
            activeTab === tab
              ? 'bg-indigo-600 text-white'
              : 'bg-[var(--bg-card)] text-gray-600 hover:bg-gray-200'
          }`}
        >
          {tab}
        </button>
      ))}
    </div>
  );
};

export default NotificationTabs;
