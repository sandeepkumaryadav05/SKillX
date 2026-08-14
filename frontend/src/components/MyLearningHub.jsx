import React, { useState, useEffect, useRef, useCallback } from 'react';
import { fetchUserRoadmapsAPI, updateProgressAPI, deleteRoadmapAPI } from '../api/roadmapAPI';

const MyLearningHub = ({ userEmail, refreshKey }) => {
  const [roadmaps, setRoadmaps] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const expandedRef = useRef(null);

  const loadRoadmaps = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await fetchUserRoadmapsAPI(userEmail);
      setRoadmaps(data);
    } catch (err) {
      setError(err.message || 'Failed to load your roadmaps.');
    } finally {
      setIsLoading(false);
    }
  }, [userEmail]);

  useEffect(() => {
    if (userEmail) {
      loadRoadmaps();
    } else {
      setIsLoading(false);
    }
  }, [userEmail, refreshKey, loadRoadmaps]);

  const handleToggleWeek = async (roadmapId, weekIndex) => {
    try {
      const updatedRoadmap = await updateProgressAPI(roadmapId, weekIndex);
      setRoadmaps((prev) =>
        prev.map((r) => (r._id === updatedRoadmap._id ? updatedRoadmap : r))
      );
    } catch (err) {
      setError(err.message || 'Failed to update progress.');
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteRoadmapAPI(id);
      setRoadmaps((prev) => prev.filter((r) => r._id !== id));
      setDeleteConfirmId(null);
      if (expandedId === id) setExpandedId(null);
    } catch (err) {
      setError(err.message || 'Failed to delete roadmap.');
    }
  };

  const handleOpen = (id) => {
    setExpandedId(expandedId === id ? null : id);
    setTimeout(() => {
      if (expandedRef.current) {
        expandedRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const handleContinue = (roadmap) => {
    setExpandedId(roadmap._id);
    setTimeout(() => {
      // Scroll to the first uncompleted week
      const firstUncompleted = roadmap.generatedRoadmap?.milestones?.findIndex(
        (_, idx) => !roadmap.completedWeeks?.includes(idx)
      );
      if (firstUncompleted !== -1 && firstUncompleted !== undefined) {
        const el = document.getElementById(`week-${roadmap._id}-${firstUncompleted}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.classList.add('ring-2', 'ring-indigo-400', 'ring-offset-2');
          setTimeout(() => el.classList.remove('ring-2', 'ring-indigo-400', 'ring-offset-2'), 2000);
        }
      }
    }, 150);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'Paused': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      default: return 'bg-[var(--brand-purple-alpha)] text-[var(--brand-purple-light)] border-[var(--border-brand)]';
    }
  };

  const renderProgressBar = (progress) => (
    <div className="w-full bg-[var(--border-subtle)] rounded-full h-2.5 overflow-hidden">
      <div
        className="h-2.5 rounded-full transition-all duration-500 ease-out"
        style={{
          width: `${progress}%`,
          background: progress === 100
            ? 'linear-gradient(90deg, #10b981, #059669)'
            : 'linear-gradient(90deg, #7C6FE0, #9B8FF0)',
        }}
      ></div>
    </div>
  );

  const renderExpandedRoadmap = (roadmap) => {
    const rm = roadmap.generatedRoadmap;
    if (!rm || !rm.milestones) return null;

    return (
      <div ref={expandedRef} className="mt-4 bg-[var(--bg-card)] rounded-xl border border-[var(--border-subtle)] p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-lg font-bold text-gray-800">{rm.goalTitle || roadmap.goal}</h4>
          <button
            onClick={() => setExpandedId(null)}
            className="text-gray-400 hover:text-gray-600 text-sm font-medium px-3 py-1 rounded-lg hover:bg-gray-200 transition-colors"
          >
            ✕ Close
          </button>
        </div>
        <p className="text-sm text-[var(--text-secondary)] mb-4">{rm.description}</p>

        {/* Progress Summary */}
        <div className="bg-[var(--bg-card)] rounded-xl border border-gray-100 p-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-gray-700">Overall Progress</span>
            <span className="text-sm font-bold text-indigo-600">{roadmap.progress}%</span>
          </div>
          {renderProgressBar(roadmap.progress)}
          <p className="text-xs text-gray-400 mt-2">
            {roadmap.completedWeeks?.length || 0} of {roadmap.totalWeeks} milestones completed
          </p>
        </div>

        {/* Milestones with checkboxes */}
        <div className="space-y-3">
          {rm.milestones.map((milestone, idx) => {
            const isCompleted = roadmap.completedWeeks?.includes(idx);
            return (
              <div
                key={idx}
                id={`week-${roadmap._id}-${idx}`}
                className={`flex flex-col sm:flex-row gap-4 p-4 rounded-xl border transition-all duration-300 cursor-pointer ${
                  isCompleted
                    ? 'bg-emerald-50/50 border-emerald-200'
                    : 'bg-[var(--bg-card)] border-gray-100 hover:border-indigo-200 hover:shadow-sm'
                }`}
                onClick={() => handleToggleWeek(roadmap._id, idx)}
              >
                {/* Checkbox */}
                <div className="flex-shrink-0 flex items-center justify-center">
                  <div
                    className={`w-8 h-8 rounded-lg border-2 flex items-center justify-center transition-all duration-300 ${
                      isCompleted
                        ? 'bg-emerald-500 border-emerald-500 text-white'
                        : 'border-gray-300 hover:border-indigo-400'
                    }`}
                  >
                    {isCompleted && (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                      isCompleted ? 'bg-emerald-100 text-emerald-600' : 'bg-purple-50 text-purple-600'
                    }`}>
                      {milestone.week}
                    </span>
                    <h5 className={`text-sm font-bold ${isCompleted ? 'text-[var(--text-secondary)] line-through' : 'text-gray-800'}`}>
                      {milestone.title}
                    </h5>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {milestone.topics && milestone.topics.map((topic, tIdx) => (
                      <span
                        key={tIdx}
                        className={`text-xs px-2 py-0.5 rounded-full border ${
                          isCompleted
                            ? 'bg-[var(--bg-card)] text-gray-400 border-[var(--border-subtle)]'
                            : 'bg-[var(--bg-card)] text-gray-600 border-[var(--border-subtle)]'
                        }`}
                      >
                        {topic}
                      </span>
                    ))}
                  </div>
                  {milestone.projectSuggestion && (
                    <p className={`text-xs mt-2 ${isCompleted ? 'text-gray-400' : 'text-emerald-600'}`}>
                      🚀 {milestone.projectSuggestion}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (!userEmail) return null;

  return (
    <div className="bg-[var(--bg-card)] rounded-2xl shadow-md p-6 lg:p-8 mt-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <span className="text-3xl">📚</span> My Learning Hub
          </h2>
          <p className="text-[var(--text-secondary)] text-sm mt-1">
            Your saved roadmaps, progress tracking, and learning analytics — all in one place.
          </p>
        </div>
        {roadmaps.length > 0 && (
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-2xl font-bold text-indigo-600">{roadmaps.length}</p>
              <p className="text-xs text-gray-400">Saved Roadmaps</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-emerald-600">
                {roadmaps.filter((r) => r.status === 'Completed').length}
              </p>
              <p className="text-xs text-gray-400">Completed</p>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="mb-6 bg-red-50 text-red-700 p-4 rounded-xl border border-red-100 flex items-start gap-3">
          <span className="text-xl">⚠️</span>
          <p className="text-sm font-medium mt-0.5">{error}</p>
        </div>
      )}

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-600 mb-4"></div>
          <p className="text-[var(--text-secondary)] text-sm font-medium">Loading your learning hub...</p>
        </div>
      ) : roadmaps.length > 0 ? (
        <div className="space-y-4">
          {roadmaps.map((roadmap) => (
            <div key={roadmap._id}>
              {/* Card */}
              <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border-brand)] p-5 hover:shadow-md transition-all duration-300">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Left — Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold text-[var(--text-primary)] truncate">
                        {roadmap.generatedRoadmap?.goalTitle || roadmap.goal}
                      </h3>
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full border whitespace-nowrap ${getStatusColor(roadmap.status)}`}>
                        {roadmap.status}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--text-secondary)] mb-3">
                      Saved: {new Date(roadmap.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </p>
                    {/* Progress Bar */}
                    <div className="flex items-center gap-3">
                      <div className="flex-1">{renderProgressBar(roadmap.progress)}</div>
                      <span className="text-sm font-bold text-[var(--text-primary)] whitespace-nowrap">{roadmap.progress}%</span>
                    </div>
                  </div>

                  {/* Right — Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleOpen(roadmap._id)}
                      className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all border ${
                        expandedId === roadmap._id
                          ? 'bg-[var(--brand-purple)] text-white border-[var(--brand-purple)] shadow-md'
                          : 'bg-transparent text-[var(--brand-purple)] border-[var(--brand-purple)] hover:bg-[rgba(124,111,224,0.1)]'
                      }`}
                    >
                      {expandedId === roadmap._id ? 'Close' : 'Open'}
                    </button>
                    <button
                      onClick={() => handleContinue(roadmap)}
                      className="px-4 py-2 rounded-lg text-sm font-semibold bg-[var(--brand-purple)] text-white hover:bg-[#6b5edd] shadow-md hover:shadow-lg transition-all border border-transparent"
                    >
                      Continue
                    </button>

                    {/* Delete with confirmation */}
                    {deleteConfirmId === roadmap._id ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleDelete(roadmap._id)}
                          className="px-3 py-2 rounded-lg text-sm font-semibold bg-red-500 text-white hover:bg-red-600 transition-all border border-transparent"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(null)}
                          className="px-3 py-2 rounded-lg text-sm font-semibold bg-transparent border border-[#4B5563] text-[#9CA3AF] hover:bg-[var(--surface2)] hover:text-[var(--text-primary)] transition-all"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirmId(roadmap._id)}
                        className="px-4 py-2 rounded-lg text-sm font-semibold bg-transparent text-[#9CA3AF] border border-[#4B5563] hover:text-[#EF4444] hover:border-[#EF4444] transition-all"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Expanded Content */}
              {expandedId === roadmap._id && renderExpandedRoadmap(roadmap)}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-[var(--bg-card)] rounded-2xl border border-dashed border-gray-300">
          <div className="text-5xl mb-4">📖</div>
          <h3 className="text-lg font-bold text-gray-800 mb-2">No Saved Roadmaps</h3>
          <p className="text-[var(--text-secondary)] text-sm max-w-md mx-auto">
            Generate a learning roadmap above and save it here to start tracking your progress!
          </p>
        </div>
      )}
    </div>
  );
};

export default MyLearningHub;
