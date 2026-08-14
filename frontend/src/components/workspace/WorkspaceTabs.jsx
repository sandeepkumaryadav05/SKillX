import React from 'react';

const tabs = [
  { id: 'chat', label: '💬 Chat' },
  { id: 'resources', label: '📁 Resources' },
  { id: 'notes', label: '📝 Notes' },
  { id: 'tasks', label: '✅ Tasks' },
];

const WorkspaceTabs = ({ activeTab, onTabChange }) => {
  return (
    <div className="flex border-b border-gray-100 bg-[var(--bg-card)] overflow-x-auto scrollbar-hide">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`flex-1 min-w-[80px] px-4 py-3 text-xs font-semibold whitespace-nowrap transition-all border-b-2 ${
            activeTab === tab.id
              ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50'
              : 'border-transparent text-[var(--text-secondary)] hover:text-gray-700 hover:bg-[var(--bg-card)]'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};

export default WorkspaceTabs;
