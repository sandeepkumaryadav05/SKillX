import React, { useState, useEffect, useRef } from 'react';
import { apiFetch } from '../../api/apiClient';

const SearchBar = ({ value, onChange, onSearch }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const suggestionsRef = useRef(null);
  const debounceRef = useRef(null);

  // Load recent searches from localStorage
  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('skillx_recent_searches') || '[]');
    setRecentSearches(stored);
  }, []);

  // Fetch autocomplete suggestions
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!value || value.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await apiFetch(`/api/search/suggestions?q=${encodeURIComponent(value)}`);
        const data = await res.json();
        setSuggestions(Array.isArray(data) ? data : []);
      } catch {
        setSuggestions([]);
      }
    }, 300);
  }, [value]);

  // Click outside to close
  useEffect(() => {
    const handler = (e) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const saveSearch = (term) => {
    if (!term.trim()) return;
    const stored = JSON.parse(localStorage.getItem('skillx_recent_searches') || '[]');
    const updated = [term, ...stored.filter(s => s !== term)].slice(0, 5);
    localStorage.setItem('skillx_recent_searches', JSON.stringify(updated));
    setRecentSearches(updated);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setShowSuggestions(false);
    saveSearch(value);
    onSearch(value);
  };

  const handleSuggestionClick = (text) => {
    onChange(text);
    setShowSuggestions(false);
    saveSearch(text);
    onSearch(text);
  };

  return (
    <div className="relative w-full" ref={suggestionsRef}>
      <form onSubmit={handleSubmit} className="relative">
        <span className="absolute inset-y-0 left-4 flex items-center text-gray-400 text-lg">🔍</span>
        <input
          type="text"
          value={value}
          onChange={(e) => { onChange(e.target.value); setShowSuggestions(true); }}
          onFocus={() => setShowSuggestions(true)}
          placeholder="Search skills, users, gigs... (e.g. React, Node, Design)"
          className="w-full pl-12 pr-16 py-4 text-base bg-[var(--bg-card)] border-2 border-[var(--border-subtle)] rounded-2xl focus:outline-none focus:border-indigo-400 shadow-sm transition-all placeholder-gray-400"
        />
        <button
          type="submit"
          className="absolute right-3 top-1/2 -translate-y-1/2 bg-indigo-600 text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition"
        >
          Search
        </button>
      </form>

      {/* Suggestions Dropdown */}
      {showSuggestions && (value.length >= 2 ? suggestions.length > 0 : recentSearches.length > 0) && (
        <div className="absolute top-full mt-2 w-full bg-[var(--bg-card)] rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden">
          {value.length < 2 && recentSearches.length > 0 && (
            <>
              <p className="px-4 pt-3 pb-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Recent Searches</p>
              {recentSearches.map((s, i) => (
                <button key={i} onClick={() => handleSuggestionClick(s)} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-[var(--bg-card)] transition text-left">
                  <span className="text-gray-400">🕐</span> {s}
                </button>
              ))}
            </>
          )}
          {value.length >= 2 && suggestions.map((s, i) => (
            <button key={i} onClick={() => handleSuggestionClick(s.text)} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 transition text-left">
              <span>{s.type === 'skill' ? '⚡' : '💼'}</span>
              <span>{s.text}</span>
              <span className="ml-auto text-[10px] text-gray-400 capitalize">{s.type}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
