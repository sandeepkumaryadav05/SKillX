import React, { useState, useEffect, useCallback } from 'react';
import SearchBar from '../components/search/SearchBar';
import FilterPanel from '../components/search/FilterPanel';
import SortDropdown from '../components/search/SortDropdown';
import UserResultCard from '../components/search/UserResultCard';
import GigResultCard from '../components/search/GigResultCard';
import { apiFetch } from '../api/apiClient';
import { useAuth } from '../context/AuthContext';

const Search = () => {
  const [activeTab, setActiveTab] = useState('users'); // 'users' or 'gigs'
  const [query, setQuery] = useState('');
  
  // Results & Pagination
  const { user: firebaseUser } = useAuth();
  const currentUser = firebaseUser || {};
  const [results, setResults] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // State indicators
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);

  // Filters & Sort
  const [filters, setFilters] = useState({});
  const [sortBy, setSortBy] = useState('');

  // Update default sort when tab changes
  useEffect(() => {
    setSortBy(activeTab === 'users' ? 'bestMatch' : 'newest');
    setFilters({});
    setPage(1);
  }, [activeTab]);

  const fetchResults = useCallback(async (currentQuery, currentPage, currentFilters, currentSort) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        search: currentQuery,
        page: currentPage,
        limit: 12,
        sortBy: currentSort,
        ...currentFilters
      });

      const endpoint = activeTab === 'users' ? 'users' : 'gigs';
      const res = await apiFetch(`/api/search/${endpoint}?${params.toString()}`);
      if (!res.ok) throw new Error('Search failed');
      
      const data = await res.json();
      setResults(activeTab === 'users' ? data.users : data.gigs);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch (err) {
      console.error(err);
      setResults([]);
      setTotal(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
      setInitialLoad(false);
    }
  }, [activeTab]);

  // Re-fetch when dependencies change (excluding query which is handled by SearchBar)
  useEffect(() => {
    fetchResults(query, page, filters, sortBy);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, filters, sortBy, activeTab, fetchResults]); // intentionally excluding query to avoid rapid firing, it's triggered on submit

  const handleSearch = (searchQuery) => {
    setQuery(searchQuery);
    setPage(1);
    fetchResults(searchQuery, 1, filters, sortBy);
  };

  return (
    <div className="max-w-7xl mx-auto py-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-extrabold text-[var(--text-primary)] mb-4">Discover the SkillX Network</h1>
        <div className="max-w-2xl mx-auto">
          <SearchBar value={query} onChange={setQuery} onSearch={handleSearch} />
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Filters */}
        <div className="w-full lg:w-72 flex-shrink-0">
          <div className="sticky top-28">
            <FilterPanel activeTab={activeTab} filters={filters} onChange={(f) => { setFilters(f); setPage(1); }} />
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {/* Tabs & Sort */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 bg-[var(--bg-card)] p-2 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('users')}
                className={`px-6 py-2.5 rounded-xl text-sm font-bold transition ${activeTab === 'users' ? 'bg-indigo-600 text-white shadow-md' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-card)]'}`}
              >
                👥 Users
              </button>
              <button
                onClick={() => setActiveTab('gigs')}
                className={`px-6 py-2.5 rounded-xl text-sm font-bold transition ${activeTab === 'gigs' ? 'bg-indigo-600 text-white shadow-md' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-card)]'}`}
              >
                💼 Gigs
              </button>
            </div>
            <div className="px-2">
              <SortDropdown activeTab={activeTab} value={sortBy} onChange={(val) => { setSortBy(val); setPage(1); }} />
            </div>
          </div>

          <div className="mb-6 flex justify-between items-center text-sm text-[var(--text-secondary)] font-medium px-2">
            <span>{loading ? 'Searching...' : `Found ${total} result${total !== 1 ? 's' : ''}`}</span>
          </div>

          {/* Results Grid */}
          {loading && !results.length ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="bg-[var(--bg-card)] rounded-2xl border border-gray-100 p-5 h-[280px] animate-pulse">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                    <div className="space-y-2 flex-1">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="h-3 bg-gray-200 rounded"></div>
                    <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                    <div className="h-3 bg-gray-200 rounded w-4/6"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : results.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {activeTab === 'users' 
                  ? results.filter(user => user._id !== currentUser._id).length > 0
                    ? results.filter(user => user._id !== currentUser._id).map(item => (
                        <UserResultCard key={item._id} user={item} />
                      ))
                    : <div className="col-span-full text-center py-20 bg-[var(--bg-card)] rounded-3xl border border-gray-100 shadow-sm">
                        <div className="text-6xl mb-4">🔍</div>
                        <h3 className="text-xl font-bold text-gray-800 mb-2">No results found</h3>
                        <p className="text-[var(--text-secondary)] max-w-md mx-auto">We couldn't find any users matching your search criteria.</p>
                      </div>
                  : results.map(item => (
                      <GigResultCard key={item._id} gig={item} />
                    ))
                }
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-12 flex justify-center gap-2">
                  <button
                    disabled={page === 1}
                    onClick={() => setPage(p => p - 1)}
                    className="px-4 py-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] text-gray-600 font-medium disabled:opacity-50 hover:bg-[var(--bg-card)] transition"
                  >
                    Previous
                  </button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum = i + 1;
                      // Logic to center current page if lots of pages
                      if (totalPages > 5 && page > 3) {
                        pageNum = page - 3 + i;
                        if (pageNum > totalPages) pageNum = totalPages - (4 - i);
                      }
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setPage(pageNum)}
                          className={`w-10 h-10 rounded-xl font-bold transition ${page === pageNum ? 'bg-indigo-600 text-white shadow-md' : 'bg-[var(--bg-card)] border border-[var(--border-subtle)] text-gray-600 hover:bg-[var(--bg-card)]'}`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    disabled={page === totalPages}
                    onClick={() => setPage(p => p + 1)}
                    className="px-4 py-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] text-gray-600 font-medium disabled:opacity-50 hover:bg-[var(--bg-card)] transition"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          ) : !initialLoad ? (
            <div className="text-center py-20 bg-[var(--bg-card)] rounded-3xl border border-gray-100 shadow-sm">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">No results found</h3>
              <p className="text-[var(--text-secondary)] max-w-md mx-auto">We couldn't find any {activeTab} matching your search criteria. Try adjusting your filters or search terms.</p>
              <button 
                onClick={() => { setQuery(''); setFilters({}); setPage(1); fetchResults('', 1, {}, activeTab === 'users' ? 'bestMatch' : 'newest'); }}
                className="mt-6 bg-indigo-50 text-indigo-700 px-6 py-2.5 rounded-xl font-bold hover:bg-indigo-100 transition"
              >
                Clear All Filters
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default Search;
