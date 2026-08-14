import React, { useState } from 'react';
import { generateRoadmapAPI, saveRoadmapAPI } from '../api/roadmapAPI';
import { Compass, Save, RefreshCw, Trash2, Sprout, Sparkles, AlertTriangle, CheckCircle } from 'lucide-react';

const MAX_REGENERATIONS = 5;

const LearningRoadmap = ({ userEmail, onRoadmapSaved }) => {
  const [goal, setGoal] = useState('');
  const [preview, setPreview] = useState(null); // temporary unsaved roadmap
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [regenCount, setRegenCount] = useState(0);
  const [successMsg, setSuccessMsg] = useState(null);

  const handleGenerate = async (e) => {
    if (e) e.preventDefault();

    if (!goal.trim()) {
      setError('Please enter a learning goal first.');
      return;
    }
    if (!userEmail) {
      setError('You must be logged in to generate a roadmap.');
      return;
    }
    if (regenCount >= MAX_REGENERATIONS) {
      setError(`Maximum roadmap regenerations reached (${MAX_REGENERATIONS}). Save or discard the current roadmap.`);
      return;
    }

    try {
      setIsGenerating(true);
      setError(null);
      setSuccessMsg(null);
      const data = await generateRoadmapAPI(userEmail, goal);
      setPreview(data);
      setRegenCount((prev) => prev + 1);
    } catch (err) {
      setError(err.message || 'Error generating roadmap. Please try again later.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!preview) return;

    try {
      setIsSaving(true);
      setError(null);
      await saveRoadmapAPI(userEmail, preview.goal, preview.generatedRoadmap);
      setSuccessMsg('Roadmap saved successfully! Check your Learning Hub below.');
      setPreview(null);
      setGoal('');
      setRegenCount(0);
      if (onRoadmapSaved) onRoadmapSaved();
    } catch (err) {
      setError(err.message || 'Failed to save roadmap.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDiscard = () => {
    setPreview(null);
    setError(null);
    setSuccessMsg(null);
  };

  const handleGenerateAnother = () => {
    if (regenCount >= MAX_REGENERATIONS) {
      setError(`Maximum roadmap regenerations reached (${MAX_REGENERATIONS}). Save or discard the current roadmap.`);
      return;
    }
    handleGenerate();
  };

  const renderPreview = () => {
    if (!preview || !preview.generatedRoadmap) return null;
    const rm = preview.generatedRoadmap;

    return (
      <div className="mt-8">
        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 mb-6">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-5 py-2.5 rounded-xl font-bold text-white bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center gap-2"
          >
            {isSaving ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </>
            ) : (
              <><Save size={14} aria-hidden="true" /> Save Roadmap</>
            )}
          </button>

          <button
            onClick={handleGenerateAnother}
            disabled={isGenerating || regenCount >= MAX_REGENERATIONS}
            className={`px-5 py-2.5 rounded-xl font-bold shadow-lg transition-all flex items-center gap-2
              ${regenCount >= MAX_REGENERATIONS
                ? 'bg-gray-300 text-[var(--text-secondary)] cursor-not-allowed'
                : 'bg-[var(--bg-card)] text-indigo-600 border-2 border-indigo-200 hover:border-indigo-400 hover:bg-indigo-50 hover:-translate-y-0.5 hover:shadow-xl'
              }`}
          >
            <RefreshCw size={14} aria-hidden="true" /> Generate Another ({MAX_REGENERATIONS - regenCount} left)
          </button>

          <button
            onClick={handleDiscard}
            className="px-5 py-2.5 rounded-xl font-bold bg-[var(--bg-card)] text-red-500 border-2 border-red-200 hover:border-red-400 hover:bg-red-50 shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center gap-2"
          >
            <Trash2 size={14} aria-hidden="true" /> Discard
          </button>
        </div>

        {/* Preview Card */}
        <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-md)', overflow: 'hidden', border: '1px solid var(--border)' }}>
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 sm:p-8 text-white relative">
            <div className="absolute top-0 right-0 w-40 h-40 bg-[var(--bg-card)] opacity-10 rounded-full blur-2xl transform translate-x-10 -translate-y-10"></div>
            <div className="flex items-center gap-2 mb-3">
              <span className="bg-yellow-400/20 text-yellow-200 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border border-yellow-400/30">
                Preview — Not Saved Yet
              </span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-bold mb-2 relative z-10">
              {rm.goalTitle || preview.goal}
            </h3>
            <p className="text-indigo-100 text-sm sm:text-base max-w-2xl relative z-10 leading-relaxed">
              {rm.description || 'Follow this structured roadmap to achieve your goals!'}
            </p>
          </div>

          {/* Milestones */}
          <div style={{ padding: '24px 32px', background: 'var(--surface2)' }}>
            <div className="space-y-6">
              {rm.milestones && rm.milestones.map((milestone, idx) => (
                <div
                  key={idx}
                  className="group flex flex-col sm:flex-row gap-4 sm:gap-6 p-5 rounded-xl border transition-all duration-300"
                  style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
                >
                  <div className="flex-shrink-0 flex items-center justify-center w-14 h-14 rounded-full bg-indigo-50 text-indigo-600 font-bold text-sm border-2 border-indigo-100 group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
                    W {idx + 1}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-bold text-purple-600 uppercase tracking-wider bg-purple-50 px-2 py-1 rounded-md">
                        {milestone.week}
                      </span>
                      <h4 className="text-lg font-bold text-gray-800">
                        {milestone.title}
                      </h4>
                    </div>

                    <div className="mb-4">
                      <h5 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">Key Topics</h5>
                      <div className="flex flex-wrap gap-2">
                        {milestone.topics && milestone.topics.map((topic, tIdx) => (
                          <span
                            key={tIdx}
                            className="text-sm bg-[var(--bg-card)] text-gray-700 px-3 py-1 rounded-full border border-[var(--border-subtle)]"
                          >
                            {topic}
                          </span>
                        ))}
                      </div>
                    </div>

                    {milestone.projectSuggestion && (
                      <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-3 group-hover:bg-emerald-100 transition-colors duration-300">
                        <div className="flex gap-2 items-start">
                          <Sparkles size={14} color="var(--accent)" aria-hidden="true" />
                          <div>
                            <p className="text-xs font-bold text-emerald-800 uppercase tracking-wide">Suggested Project</p>
                            <p className="text-sm text-emerald-700 mt-0.5 font-medium">{milestone.projectSuggestion}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)', padding: '24px 32px', marginTop: 24, border: '1px solid var(--border)' }}>
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--accent-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Compass size={24} color="var(--accent)" aria-hidden="true" />
            </div>
            <div>
              <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', margin: 0 }}>AI Learning Roadmap Generator</h2>
              <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: '2px 0 0' }}>Let AI create a customized, step-by-step learning path for your career goals.</p>
            </div>
          </div>
      </div>

      {error && (
        <div style={{ marginBottom: 24, background: 'var(--red-bg)', color: 'var(--red)', padding: '14px 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--red)', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <AlertTriangle size={18} aria-hidden="true" />
          <p style={{ fontSize: 13, fontWeight: 500, margin: 0 }}>{error}</p>
        </div>
      )}

      {successMsg && (
        <div style={{ marginBottom: 24, background: 'var(--green-bg)', color: 'var(--green)', padding: '14px 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--green)', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <CheckCircle size={18} aria-hidden="true" />
          <p style={{ fontSize: 13, fontWeight: 500, margin: 0 }}>{successMsg}</p>
        </div>
      )}

      {/* Generate Form — only show when no preview is active */}
      {!preview && (
        <form onSubmit={handleGenerate} style={{ background: 'var(--surface2)', borderRadius: 'var(--radius-lg)', padding: '16px 20px', border: '1px solid var(--border)', position: 'relative', overflow: 'hidden' }}>
          <div className="absolute top-0 left-0 w-1 bg-gradient-to-b from-indigo-500 to-purple-500 h-full"></div>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <label htmlFor="goal" className="sr-only">What do you want to learn?</label>
              <input
                id="goal"
                type="text"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder="e.g., Become a MERN Stack Developer, Learn UI/UX Design..."
                style={{ width: '100%', height: 48, padding: '0 16px', background: 'var(--surface)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-md)', fontSize: 14, color: 'var(--text)', outline: 'none', fontFamily: 'inherit', transition: 'border-color 200ms' }}
                onFocus={e => { e.target.style.borderColor = 'var(--accent)' }}
                onBlur={e => { e.target.style.borderColor = 'var(--border)' }}
                disabled={isGenerating}
              />
            </div>
            <button
              type="submit"
              disabled={isGenerating || !goal.trim() || !userEmail}
              className={`h-12 px-6 rounded-xl font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2 whitespace-nowrap
                ${isGenerating
                  ? 'bg-indigo-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 hover:-translate-y-0.5 hover:shadow-xl active:translate-y-0'
                }`}
            >
              {isGenerating ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Generating AI Roadmap...
                </>
              ) : (
                <>
                  <><Sparkles size={16} aria-hidden="true" /> Generate Roadmap</>
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* Loading state during regeneration */}
      {isGenerating && preview && (
        <div className="flex flex-col items-center justify-center py-12 mt-6">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-600 mb-4"></div>
          <p className="text-[var(--text-secondary)] text-sm font-medium">Generating a new variation...</p>
        </div>
      )}

      {/* Preview area */}
      {!isGenerating && preview && renderPreview()}

      {/* Empty state — only show when no preview and not generating */}
      {!preview && !isGenerating && (
        <div style={{ textAlign: 'center', padding: '56px 16px', background: 'var(--surface2)', borderRadius: 'var(--radius-lg)', border: '1.5px dashed var(--border-strong)', marginTop: 24 }}>
          <Sprout size={44} color="var(--text-muted)" style={{ margin: '0 auto 16px', opacity: 0.5 }} aria-hidden="true" />
          <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>No Roadmap Generated</h3>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', maxWidth: 360, margin: '0 auto' }}>Enter a learning goal above and let AI map out your learning journey!</p>
        </div>
      )}
    </div>
  );
};

export default LearningRoadmap;
