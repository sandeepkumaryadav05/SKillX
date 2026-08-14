import React, { useState } from 'react'
import { toast } from 'sonner'
import { apiFetch } from '../api/apiClient';
import { useAuth } from '../context/AuthContext';

const MAX_REGENERATIONS = 5

const PostGig = () => {
  const { user: firebaseUser } = useAuth();
  const currentUserEmail = firebaseUser?.email || 'Anonymous';

  const [form, setForm] = useState({
    title: '',
    category: 'Web Development',
    type: 'One-time Project',
    skills: '',
    description: '',
    budget: '',
    duration: '',
    location: 'Remote',
  })

  const [loading, setLoading] = useState(false)
  const [isDirty, setIsDirty] = useState(false)

  // AI Enhancement state
  const [enhancedText, setEnhancedText] = useState(null)
  const [isEnhancing, setIsEnhancing] = useState(false)
  const [enhanceError, setEnhanceError] = useState(null)
  const [regenCount, setRegenCount] = useState(0)

  const handleChange = (e) => {
    const { name, value } = e.target
    setIsDirty(true)
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      // convert comma-separated skills -> array
      const skillsArray = form.skills
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)

      const payload = {
        title: form.title,
        category: form.category,
        type: form.type,
        skills: skillsArray,
        description: form.description,
        budget: Number(form.budget),
        duration: form.duration,
        location: form.location,
        postedBy: currentUserEmail,
      }

      const res = await apiFetch(`/api/gigs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        throw new Error('Failed to create gig')
      }

      toast.success('Gig posted successfully!')

      // reset form
      setForm({
        title: '',
        category: 'Web Development',
        type: 'One-time Project',
        skills: '',
        description: '',
        budget: '',
        duration: '',
        location: 'Remote',
      })
      setEnhancedText(null)
      setRegenCount(0)
      setIsDirty(false)
    } catch (err) {
      console.error(err)
      toast.error('Something went wrong while posting gig.')
    } finally {
      setLoading(false)
    }
  }

  // --- AI Enhancement handlers ---
  const handleEnhance = async () => {
    if (!form.title.trim() || !form.category.trim() || !form.skills.trim()) {
      setEnhanceError('Title, Category, and at least one Skill are required to generate an AI description.')
      return
    }

    if (regenCount >= MAX_REGENERATIONS) {
      setEnhanceError(`Maximum enhancement limit reached (${MAX_REGENERATIONS}). Please use or discard the current result.`)
      return
    }

    try {
      setIsEnhancing(true)
      setEnhanceError(null)

      const skillsArray = form.skills.split(',').map((s) => s.trim()).filter(Boolean)

      const payload = {
        title: form.title,
        category: form.category,
        skills: skillsArray,
        description: form.description,
      }

      const res = await apiFetch(`/api/gigs/enhance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.message || 'Failed to enhance description')
      }

      const data = await res.json()
      setEnhancedText(data.enhanced)
      setRegenCount((prev) => prev + 1)
    } catch (err) {
      setEnhanceError(err.message || 'Something went wrong. Try again.')
    } finally {
      setIsEnhancing(false)
    }
  }

  const handleUseDescription = () => {
    if (enhancedText) {
      setForm((prev) => ({ ...prev, description: enhancedText }))
      setEnhancedText(null)
      setEnhanceError(null)
    }
  }

  const handleRegenerate = () => {
    if (regenCount >= MAX_REGENERATIONS) {
      setEnhanceError(`Maximum enhancement limit reached (${MAX_REGENERATIONS}).`)
      return
    }
    handleEnhance()
  }

  const handleDiscardEnhanced = () => {
    setEnhancedText(null)
    setEnhanceError(null)
  }

  return (
    <main role="main" aria-label="Post a Gig" className="page-content" style={{ maxWidth: 800 }}>
      <div className="card">
        {/* Header */}
        <div style={{ marginBottom: 28, paddingBottom: 20, borderBottom: '0.5px solid var(--border)' }}>
          <h1 className="text-h1">Post a New Gig</h1>
          <p className="text-caption" style={{ marginTop: 8, fontSize: 13 }}>
            Describe the gig clearly so the right talent can find you.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Gig Title */}
          <div>
            <label className="input-label">Gig Title</label>
            <input
              type="text"
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="e.g. Frontend Developer for Portfolio Website"
              className="input"
              required
            />
          </div>

          {/* Category + Type */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label className="input-label">Category</label>
              <select
                name="category"
                value={form.category}
                onChange={handleChange}
                className="input"
              >
                <option>Web Development</option>
                <option>Design</option>
                <option>Content Writing</option>
                <option>Marketing</option>
                <option>Data / Analytics</option>
                <option>Other</option>
              </select>
            </div>

            <div>
              <label className="input-label">Gig Type</label>
              <select
                name="type"
                value={form.type}
                onChange={handleChange}
                className="input"
              >
                <option>One-time Project</option>
                <option>Part-time</option>
                <option>Full-time</option>
                <option>Skill Exchange</option>
              </select>
            </div>
          </div>

          {/* Skills Required */}
          <div>
            <label className="input-label">Skills Required</label>
            <input
              type="text"
              name="skills"
              value={form.skills}
              onChange={handleChange}
              placeholder="e.g. React, Tailwind, API Integration"
              className="input"
            />
            <p className="input-helper">Separate skills with commas.</p>
          </div>

          {/* Description */}
          <div>
            <label className="input-label">Gig Description</label>
            <textarea
              rows="5"
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Describe the work, expectations, and any important details..."
              className="input"
              style={{ resize: 'vertical' }}
              required
            />
            
            <button
              type="button"
              onClick={handleEnhance}
              disabled={isEnhancing || !form.title.trim() || !form.category.trim() || !form.skills.trim()}
              style={{
                width: '100%', padding: '10px', marginTop: '12px',
                background: (isEnhancing || !form.title.trim() || !form.category.trim() || !form.skills.trim()) ? 'var(--surface2)' : 'var(--accent-dim)',
                border: '0.5px solid ' + ((isEnhancing || !form.title.trim() || !form.category.trim() || !form.skills.trim()) ? 'var(--border)' : 'var(--accent)'),
                borderRadius: 'var(--radius-md)',
                color: (isEnhancing || !form.title.trim() || !form.category.trim() || !form.skills.trim()) ? 'var(--text-dim)' : 'var(--accent-light)',
                fontWeight: 600, fontSize: 13,
                cursor: (isEnhancing || !form.title.trim() || !form.category.trim() || !form.skills.trim()) ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                transition: 'all var(--t-fast)'
              }}
            >
              {isEnhancing ? (
                <><i className="ti ti-loader animate-spin" /> Generating...</>
              ) : (
                <><i className="ti ti-sparkles" /> Generate Description with AI</>
              )}
            </button>
          </div>

          {/* AI Enhancement Error */}
          {enhanceError && (
            <div style={{ background: 'var(--amber-bg)', color: 'var(--amber-text)', padding: 12, borderRadius: 'var(--radius-md)', border: '0.5px solid var(--amber)', display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13 }}>
              <i className="ti ti-alert-triangle" style={{ marginTop: 2 }} />
              <p style={{ margin: 0 }}>{enhanceError}</p>
            </div>
          )}

          {/* AI Enhanced Preview Card */}
          {enhancedText && (
            <div className="card-accent" style={{ overflow: 'hidden', padding: 0 }}>
              <div style={{ background: 'var(--accent-dim)', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <i className="ti ti-sparkles" style={{ color: 'var(--accent-light)' }} />
                <h4 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: 'var(--accent-light)' }}>AI Enhanced Description</h4>
                <span style={{ marginLeft: 'auto', fontSize: 11, background: 'var(--surface)', padding: '2px 8px', borderRadius: 'var(--radius-full)', color: 'var(--text-muted)' }}>
                  {regenCount}/{MAX_REGENERATIONS} used
                </span>
              </div>

              <div style={{ padding: 16 }}>
                <p style={{ fontSize: 13, color: 'var(--text)', whiteSpace: 'pre-wrap', lineHeight: 1.6, margin: 0 }}>
                  {enhancedText}
                </p>
              </div>

              <div style={{ display: 'flex', gap: 8, padding: '0 16px 16px' }}>
                <button type="button" onClick={handleUseDescription} className="btn-success">
                  <i className="ti ti-check" /> Use Description
                </button>
                <button type="button" onClick={handleRegenerate} disabled={isEnhancing || regenCount >= MAX_REGENERATIONS} className="btn-ghost">
                  <i className="ti ti-refresh" /> Regenerate
                </button>
                <button type="button" onClick={handleDiscardEnhanced} className="btn-danger">
                  <i className="ti ti-trash" /> Discard
                </button>
              </div>
            </div>
          )}

          {/* Budget + Duration */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label className="input-label">Budget (₹)</label>
              <input
                type="number"
                name="budget"
                value={form.budget}
                onChange={handleChange}
                placeholder="e.g. 3000"
                className="input"
                required
              />
            </div>

            <div>
              <label className="input-label">Duration</label>
              <input
                type="text"
                name="duration"
                value={form.duration}
                onChange={handleChange}
                placeholder="e.g. 1 week, 1 month"
                className="input"
                required
              />
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="input-label">Location</label>
            <select
              name="location"
              value={form.location}
              onChange={handleChange}
              className="input"
            >
              <option>Remote</option>
              <option>On-site</option>
              <option>Hybrid</option>
            </select>
          </div>

          {/* Draft indicator */}
          {isDirty && (
            <p style={{ fontSize: 12, color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: 6, margin: 0 }}>
              <i className="ti ti-circle-filled" style={{ fontSize: 8, color: 'var(--accent)' }} /> Draft in progress
            </p>
          )}

          {/* Buttons */}
          <div className="divider" style={{ margin: '8px 0' }} />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
            <button
              type="button"
              onClick={() => {
                setForm({
                  title: '', category: 'Web Development', type: 'One-time Project',
                  skills: '', description: '', budget: '', duration: '', location: 'Remote',
                })
                setEnhancedText(null)
                setRegenCount(0)
                setEnhanceError(null)
                setIsDirty(false)
              }}
              className="btn-ghost"
            >
              Clear
            </button>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? (
                <><i className="ti ti-loader animate-spin" /> Posting...</>
              ) : (
                <><i className="ti ti-upload" /> Post Gig</>
              )}
            </button>
          </div>
        </form>
      </div>
    </main>
  )
}

export default PostGig
