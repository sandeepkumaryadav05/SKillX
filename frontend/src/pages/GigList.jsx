import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import LoadingSpinner from '../components/LoadingSpinner';
import { apiFetch } from '../api/apiClient';
import { useAuth } from '../context/AuthContext';

const GigList = () => {
  const { user: firebaseUser } = useAuth();
  const userEmail = firebaseUser?.email;
  const navigate = useNavigate();

  const [gigs, setGigs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // Modal states
  const [applyModalOpen, setApplyModalOpen] = useState(false)
  const [gigToApply, setGigToApply] = useState(null)
  const [applyMessage, setApplyMessage] = useState('')
  const [isApplying, setIsApplying] = useState(false)
  
  // Inline confirm delete state
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)

  const fetchGigs = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await apiFetch(`/api/gigs`)
      if (!res.ok) throw new Error('Failed to fetch gigs')
      const data = await res.json()
      setGigs(data)
    } catch (err) {
      console.error(err)
      setError('Could not load gigs. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    try {
      const res = await apiFetch(`/api/gigs/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete gig')
      setGigs((prev) => prev.filter((g) => g._id !== id))
      toast.success('Gig deleted successfully')
    } catch (err) {
      console.error(err)
      toast.error('Error deleting gig')
    } finally {
      setConfirmDeleteId(null)
    }
  }

  const handleOpenApplyModal = (gig) => {
    if (!userEmail) {
      toast.error('Please sign in to apply for a gig.')
      return
    }
    setGigToApply(gig)
    setApplyMessage('')
    setApplyModalOpen(true)
  }

  const submitApplication = async (e) => {
    e.preventDefault()
    if (!gigToApply) return
    
    setIsApplying(true)
    try {
      const res = await apiFetch(`/api/gig-applications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gigId: gigToApply._id,
          applicantEmail: userEmail,
          message: applyMessage,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Failed to apply for gig')

      toast.success('Application submitted successfully!')
      setApplyModalOpen(false)
      setGigToApply(null)
    } catch (err) {
      console.error(err)
      toast.error(err.message || 'Could not apply for this gig.')
    } finally {
      setIsApplying(false)
    }
  }

  useEffect(() => {
    fetchGigs()
  }, [])

  return (
    <main role="main" aria-label="Gig List" className="page-content">
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 className="text-h1">Available Gigs</h1>
          <p className="text-caption" style={{ marginTop: 6, fontSize: 13 }}>
            Find freelance projects, skill exchanges, and part-time opportunities.
          </p>
        </div>
        <button onClick={fetchGigs} className="btn-ghost">
          <i className="ti ti-refresh" aria-hidden="true" />
          Refresh
        </button>
      </div>

      {/* Loading / Error / Empty states */}
      {loading && <LoadingSpinner message="Fetching gigs…" />}
      
      {error && (
        <div style={{ padding: '12px 16px', background: 'var(--red-bg)', color: 'var(--red-text)', border: '0.5px solid var(--red)', borderRadius: 'var(--radius-md)', fontSize: 13, marginBottom: 20 }}>
          <i className="ti ti-alert-circle" style={{ marginRight: 6 }} aria-hidden="true" />
          {error}
        </div>
      )}

      {!loading && !error && gigs.length === 0 && (
        <div className="empty-state">
          <i className="ti ti-briefcase" />
          <p>No gigs found. Try posting one!</p>
        </div>
      )}

      {/* Gig Cards */}
      {!loading && !error && gigs.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
          {gigs.map((gig) => {
            const isOwner = userEmail && gig.postedBy && gig.postedBy === userEmail

            return (
              <div key={gig._id} className="card flex flex-col justify-between" style={{ padding: 20 }}>
                {/* Title & Category */}
                <div>
                  <h2 className="text-h2" style={{ marginBottom: 4 }}>{gig.title}</h2>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                    <span className="badge badge-info">{gig.category}</span>
                    <span className="badge badge-exchange">{gig.type}</span>
                  </div>

                  {/* Skills */}
                  {gig.skills && gig.skills.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
                      {gig.skills.map((skill, index) => (
                        <span key={index} className="skill-tag">
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Description */}
                  <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 16, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {gig.description}
                  </p>

                  {/* Details */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-dim)', fontSize: 12 }}>
                      <i className="ti ti-currency-rupee" style={{ fontSize: 14 }} aria-hidden="true" />
                      <span style={{ color: 'var(--text)' }}>{gig.budget}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-dim)', fontSize: 12 }}>
                      <i className="ti ti-clock" style={{ fontSize: 14 }} aria-hidden="true" />
                      <span style={{ color: 'var(--text)' }}>{gig.duration}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-dim)', fontSize: 12 }}>
                      <i className="ti ti-map-pin" style={{ fontSize: 14 }} aria-hidden="true" />
                      <span style={{ color: 'var(--text)' }}>{gig.location}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-dim)', fontSize: 12 }}>
                      <i className="ti ti-user" style={{ fontSize: 14 }} aria-hidden="true" />
                      <span 
                        style={{ color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', cursor: 'pointer' }}
                        onClick={() => navigate(`/profile/${gig.creatorEmail || gig.postedBy}`)}
                      >
                        {gig.postedBy}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="divider" style={{ marginBottom: 16 }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <button className="btn-ghost" style={{ padding: '6px 12px', fontSize: 12 }}>
                    View Details
                  </button>

                  {!isOwner ? (
                    <button 
                      onClick={() => handleOpenApplyModal(gig)}
                      className="btn-success"
                      style={{ padding: '6px 12px', fontSize: 12 }}
                    >
                      Apply Now
                    </button>
                  ) : (
                    confirmDeleteId === gig._id ? (
                      <div className="inline-confirm">
                        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--red-text)' }}>Sure?</span>
                        <button onClick={() => handleDelete(gig._id)} style={{ background: 'var(--red)', color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)', padding: '2px 8px', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>Yes</button>
                        <button onClick={() => setConfirmDeleteId(null)} style={{ background: 'transparent', color: 'var(--red-text)', border: 'none', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>No</button>
                      </div>
                    ) : (
                      <button 
                        onClick={() => setConfirmDeleteId(gig._id)}
                        className="btn-danger"
                        style={{ padding: '6px 12px', fontSize: 12 }}
                      >
                        <i className="ti ti-trash" aria-hidden="true" />
                        Delete
                      </button>
                    )
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Apply Modal */}
      {applyModalOpen && gigToApply && (
        <div className="modal-overlay" onClick={() => setApplyModalOpen(false)}>
          <div className="modal-panel" onClick={e => e.stopPropagation()}>
            <div style={{ padding: '20px 24px', borderBottom: '0.5px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 className="text-h2">Apply for Gig</h2>
              <button className="icon-btn" onClick={() => setApplyModalOpen(false)}>
                <i className="ti ti-x" aria-hidden="true" />
              </button>
            </div>
            
            <form onSubmit={submitApplication}>
              <div style={{ padding: '24px' }}>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
                  You are applying for <strong style={{ color: 'var(--text)' }}>{gigToApply.title}</strong>.
                </p>
                
                <label className="input-label" htmlFor="apply-message">Why are you a good fit? (Optional)</label>
                <textarea
                  id="apply-message"
                  className="input"
                  rows={4}
                  placeholder="Share a brief message about your skills and experience..."
                  value={applyMessage}
                  onChange={e => setApplyMessage(e.target.value)}
                  style={{ resize: 'none' }}
                />
              </div>
              
              <div style={{ padding: '16px 24px', borderTop: '0.5px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: 12, background: 'var(--surface2)' }}>
                <button type="button" className="btn-ghost" onClick={() => setApplyModalOpen(false)} disabled={isApplying}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={isApplying}>
                  {isApplying ? (
                    <><i className="ti ti-loader animate-spin" /> Sending...</>
                  ) : (
                    <><i className="ti ti-send" /> Send Application</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  )
}

export default GigList
