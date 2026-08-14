import React, { useState } from 'react';

const SKILL_CATEGORIES = [
  'All', 'Web Development', 'Mobile Development', 'Design', 'Data Science',
  'Machine Learning', 'DevOps', 'Cybersecurity', 'Blockchain', 'Marketing',
  'Content Writing', 'Video Editing', 'Photography', 'Music', 'Other'
];

const FilterPanel = ({ activeTab, filters, onChange }) => {
  const [isOpen, setIsOpen] = useState(true);

  const update = (key, value) => onChange({ ...filters, [key]: value });

  return (
    <div className="bg-[var(--bg-card)] rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 font-semibold text-gray-800 text-sm hover:bg-[var(--bg-card)] transition"
      >
        <span className="flex items-center gap-2">
          <span>🎛</span> Filters
        </span>
        <span className={`text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>▼</span>
      </button>

      {isOpen && (
        <div className="px-4 pb-4 space-y-5 border-t border-gray-50">
          {/* Skill Category */}
          <div>
            <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2 mt-4">
              Skill Category
            </label>
            <select
              value={filters.category || 'All'}
              onChange={(e) => update('category', e.target.value === 'All' ? '' : e.target.value)}
              className="w-full text-sm border border-[var(--border-subtle)] rounded-xl px-3 py-2 bg-[var(--bg-card)] focus:outline-none focus:ring-2 focus:ring-indigo-500/40 text-gray-700"
            >
              {SKILL_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Skills text input */}
          <div>
            <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
              Specific Skills
            </label>
            <input
              type="text"
              placeholder="React, Node, Python..."
              value={filters.skills || ''}
              onChange={(e) => update('skills', e.target.value)}
              className="w-full text-sm border border-[var(--border-subtle)] rounded-xl px-3 py-2 bg-[var(--bg-card)] focus:outline-none focus:ring-2 focus:ring-indigo-500/40 text-gray-700 placeholder-gray-400"
            />
            <p className="text-[10px] text-gray-400 mt-1">Comma-separated</p>
          </div>

          {/* User-only filters */}
          {activeTab === 'users' && (
            <>
              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
                  Minimum Rating: ⭐{filters.minRating || 0}+
                </label>
                <input
                  type="range"
                  min="0" max="5" step="0.5"
                  value={filters.minRating || 0}
                  onChange={(e) => update('minRating', e.target.value)}
                  className="w-full accent-indigo-600"
                />
                <div className="flex justify-between text-[10px] text-gray-400">
                  <span>0</span><span>2.5</span><span>5</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
                  Minimum Trust Score: {filters.minTrustScore || 0}+
                </label>
                <input
                  type="range"
                  min="0" max="100" step="5"
                  value={filters.minTrustScore || 0}
                  onChange={(e) => update('minTrustScore', e.target.value)}
                  className="w-full accent-indigo-600"
                />
                <div className="flex justify-between text-[10px] text-gray-400">
                  <span>0</span><span>50</span><span>100</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
                  Location
                </label>
                <input
                  type="text"
                  placeholder="e.g. Remote, Mumbai..."
                  value={filters.location || ''}
                  onChange={(e) => update('location', e.target.value)}
                  className="w-full text-sm border border-[var(--border-subtle)] rounded-xl px-3 py-2 bg-[var(--bg-card)] focus:outline-none focus:ring-2 focus:ring-indigo-500/40 text-gray-700 placeholder-gray-400"
                />
              </div>
            </>
          )}

          {/* Reset */}
          <button
            onClick={() => onChange({ category: '', skills: '', minRating: 0, minTrustScore: 0, location: '' })}
            className="w-full py-2 text-xs font-semibold text-red-500 hover:bg-red-50 rounded-xl transition"
          >
            Reset Filters
          </button>
        </div>
      )}
    </div>
  );
};

export default FilterPanel;
