import React from 'react';

const USER_SORT_OPTIONS = [
  { value: 'bestMatch', label: 'Best Match' },
  { value: 'highestRating', label: 'Highest Rating' },
  { value: 'highestTrustScore', label: 'Highest Trust Score' },
  { value: 'mostActive', label: 'Most Active' },
  { value: 'mostSessions', label: 'Most Sessions Completed' },
  { value: 'recentlyJoined', label: 'Recently Joined' },
];

const GIG_SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'budgetHigh', label: 'Budget: High to Low' },
  { value: 'budgetLow', label: 'Budget: Low to High' },
];

const SortDropdown = ({ activeTab, value, onChange }) => {
  const options = activeTab === 'users' ? USER_SORT_OPTIONS : GIG_SORT_OPTIONS;

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-[var(--text-secondary)] whitespace-nowrap font-medium">Sort by:</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="text-sm border border-[var(--border-subtle)] rounded-xl px-3 py-2 bg-[var(--bg-card)] focus:outline-none focus:ring-2 focus:ring-indigo-500/40 text-gray-700 font-medium cursor-pointer"
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
};

export default SortDropdown;
