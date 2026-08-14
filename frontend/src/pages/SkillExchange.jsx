/**
 * SkillExchange.jsx
 * Community hub for discovering and requesting skill exchanges.
 */
import React, { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { toast } from 'sonner'
const ArrowLeftRight = ({ size, color, style }) => <i className="ti ti-arrows-exchange" style={{ fontSize: size || 'inherit', color, ...style }} />;
const ChevronDown = ({ size, color, style }) => <i className="ti ti-chevron-down" style={{ fontSize: size || 'inherit', color, ...style }} />;
const MapPin = ({ size, color, style }) => <i className="ti ti-map-pin" style={{ fontSize: size || 'inherit', color, ...style }} />;
const Send = ({ size, color, style }) => <i className="ti ti-send" style={{ fontSize: size || 'inherit', color, ...style }} />;
const Star = ({ size, color, style }) => <i className="ti ti-star-filled" style={{ fontSize: size || 'inherit', color, ...style }} />;
const Sparkles = ({ size, color, style }) => <i className="ti ti-sparkles" style={{ fontSize: size || 'inherit', color, ...style }} />;
const Search = ({ size, color, style }) => <i className="ti ti-search" style={{ fontSize: size || 'inherit', color, ...style }} />;
const User = ({ size, color, style }) => <i className="ti ti-user" style={{ fontSize: size || 'inherit', color, ...style }} />;
const RefreshCw = ({ size, className, style }) => <i className={`ti ti-refresh ${className || ''}`} style={{ fontSize: size || 'inherit', ...style }} />;
import LoadingSpinner from '../components/LoadingSpinner'
import Skeleton from '../components/ui/Skeleton'
import { apiFetch } from '../api/apiClient'
import { useAuth } from '../context/AuthContext'
import { getAvatarColors, getAvatarInitials } from '../utils/avatarUtils'

/* ─── Match Score Ring SVG ──────────────────────────────── */
const MatchScoreRing = ({ score, size = 52 }) => {
  const r = 20
  const c = 2 * Math.PI * r
  
  const isNeutral = score === '--' || score == null;
  const numericScore = isNeutral ? 0 : Number(score);
  
  const fill = isNeutral ? 0 : (numericScore / 100) * c
  const color = isNeutral ? 'var(--border-strong)' : numericScore >= 70 ? 'var(--green)' : numericScore >= 40 ? '#F59E0B' : 'var(--text-muted)'
  const textColor = isNeutral ? 'var(--text-muted)' : color;

  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-label={isNeutral ? 'No match score' : `${numericScore}% match`} role="img">
      <circle cx="24" cy="24" r={r} fill="none" stroke="var(--border)" strokeWidth="4" />
      {!isNeutral && (
        <circle
          cx="24" cy="24" r={r} fill="none" stroke={color} strokeWidth="4"
          strokeDasharray={`${fill} ${c}`} strokeLinecap="round"
          transform="rotate(-90 24 24)"
        />
      )}
      <text x="24" y="28" textAnchor="middle" fontSize="11" fontWeight="700" fill={textColor}>
        {isNeutral ? '--' : `${numericScore}%`}
      </text>
    </svg>
  )
}

/* ─── Match Card ────────────────────────────────────────── */
function MatchCard({ match, isRec = false, onRequest, currentUid, currentEmail }) {
  const navigate = useNavigate();
  const isOwnPost = (currentUid && match.userId === currentUid) || (currentEmail && match.email === currentEmail);
  
  // Use backend provided matchScore if available, otherwise fallback
  const finalScore = match.matchScore ?? null;

  const avatarColors = getAvatarColors(match.name || match.email || '')
  const avatarInitials = getAvatarInitials(match.name, match.email)

  const handleProfileClick = () => {
    if (match.email) {
      navigate(`/profile/${match.email}`);
    } else {
      navigate(`/profile/${match.userId || match._id}`);
    }
  };

  return (
    <motion.div
      whileHover={{ y: -3, scale: 1.01 }}
      transition={{ type: 'spring', stiffness: 360, damping: 22 }}
      style={{
        background: 'var(--surface)',
        border: isRec ? '2px solid var(--border-strong)' : '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding: 20,
        boxShadow: isRec ? 'var(--shadow-md)' : 'var(--shadow-sm)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {isRec && (
        <div style={{
          position: 'absolute', top: 10, right: 10,
          display: 'flex', alignItems: 'center', gap: 4,
          padding: '2px 8px', borderRadius: 9999,
          background: 'var(--accent-dim)', color: 'var(--accent)',
          fontSize: 10, fontWeight: 700, letterSpacing: '0.04em',
        }}>
          <Sparkles size={9} aria-hidden="true" /> RECOMMENDED
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
        <div style={{
          width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
          background: avatarColors.bg, color: avatarColors.text,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 16, fontWeight: 700, border: '2px solid var(--border-strong)',
        }}>
          {avatarInitials}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div 
            style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', marginBottom: 2, cursor: 'pointer' }}
            className="hover:underline"
            onClick={handleProfileClick}
            title="View profile"
          >
            {match.name}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <MapPin size={11} aria-hidden="true" /> {match.location}
          </div>
        </div>
        <MatchScoreRing score={finalScore} />
      </div>

      {/* Skills */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)', minWidth: 50 }}>Offers:</span>
          <span style={{
            padding: '3px 10px', borderRadius: 9999,
            background: 'var(--blue-bg)', color: 'var(--blue)',
            border: '1px solid var(--blue)', fontSize: 12, fontWeight: 500,
          }}>{match.skillOffered}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)', minWidth: 50 }}>Wants:</span>
          <span style={{
            padding: '3px 10px', borderRadius: 9999,
            background: 'var(--accent-dim)', color: 'var(--accent)',
            border: '1px solid var(--border-strong)', fontSize: 12, fontWeight: 500,
          }}>{match.skillWanted}</span>
        </div>
      </div>

      {/* AI Insight */}
      {match.aiInsight && (
        <div style={{
          marginBottom: 12, padding: '10px 12px',
          background: 'var(--bg-overlay)', borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border)',
        }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
            <Sparkles size={11} aria-hidden="true" /> AI Insight
          </p>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6 }}>{match.aiInsight}</p>
        </div>
      )}

      {/* Action */}
      {isOwnPost ? (
        <div style={{
          width: '100%', padding: '8px 0',
          border: '1px solid var(--accent-dim)',
          borderRadius: 'var(--radius-md)',
          color: 'var(--accent)',
          fontSize: 13, fontWeight: 600,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'var(--accent-dim)',
          cursor: 'default',
          userSelect: 'none'
        }}>
          ✦ Your Exchange Listing
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={handleProfileClick}
            className="text-xs px-3 py-1.5 rounded-lg border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)] transition-colors flex items-center gap-1"
            title="View full profile"
          >
            <User size={14} aria-hidden="true" /> Profile
          </button>
          <button
            onClick={() => onRequest(match)}
            style={{
              flex: 1, padding: 9,
              background: 'var(--accent)', color: '#fff',
              border: 'none', borderRadius: 'var(--radius-md)',
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              transition: 'background var(--transition-fast)',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--primary-hover)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--accent)' }}
          >
            <Send size={14} aria-hidden="true" /> Request Exchange
          </button>
        </div>
      )}
    </motion.div>
  )
}

/* ─── Main Component ────────────────────────────────────── */
const SkillExchange = () => {
  const { user: firebaseUser, userProfile } = useAuth()
  const currentEmail = firebaseUser?.email
  const currentUid = firebaseUser?.uid
  const storedUser = { name: firebaseUser?.displayName || userProfile?.name }

  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [recommendations, setRecommendations] = useState([])
  const [loadingRecommendations, setLoadingRecommendations] = useState(false)

  const [form, setForm] = useState({
    name: storedUser.name || '',
    skillOffered: '',
    skillWanted: '',
    location: 'Remote',
  })
  const [submitting, setSubmitting] = useState(false)
  const [bannerOpen, setBannerOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const fetchEntries = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const url = currentUid ? `/api/skill-exchange?currentUserId=${encodeURIComponent(currentUid)}` : `/api/skill-exchange`
      const res = await apiFetch(url)
      if (!res.ok) throw new Error('Failed to fetch skill exchange entries')
      const data = await res.json()
      setEntries(data)
    } catch (err) {
      console.error(err)
      setError('Could not load skill exchange data. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [currentUid])

  const fetchRecommendations = useCallback(async () => {
    if (!currentUid) return

    const cacheKey = `skillx_recommendations_${currentUid}`
    const cachedData = localStorage.getItem(cacheKey)
    if (cachedData) {
      try {
        setRecommendations(JSON.parse(cachedData))
        return
      } catch { /* ignore */ }
    }

    try {
      setLoadingRecommendations(true)
      const res = await apiFetch(`/api/skill-exchange/recommendations?userId=${encodeURIComponent(currentUid)}`)
      if (res.ok) {
        const data = await res.json()
        setRecommendations(data)
        if (data.length > 0) localStorage.setItem(cacheKey, JSON.stringify(data))
      } else if (res.status === 429) {
        // Rate limited — fail silently, section will be hidden
        // Do NOT show a toast here — apiClient handles 429 globally
        console.warn('Recommendations rate limited — hiding section')
      } else {
        console.warn('Recommendations fetch failed with status:', res.status)
      }
    } catch (err) {
      console.error('Failed to fetch recommendations:', err)
    } finally {
      setLoadingRecommendations(false)
    }
  }, [currentUid])

  useEffect(() => {
    fetchEntries()
    fetchRecommendations()
  }, [currentUid, fetchEntries, fetchRecommendations])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      if (!currentUid) {
        toast.error('You must be signed in to create a skill exchange profile.')
        setSubmitting(false)
        return
      }

      const payload = { ...form, userId: currentUid, email: currentEmail, matchScore: 80 }
      const res = await apiFetch(`/api/skill-exchange`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error('Failed to create skill exchange entry')

      const newEntry = await res.json()
      setEntries(prev => [newEntry, ...prev])
      setForm({ name: storedUser.name || '', skillOffered: '', skillWanted: '', location: 'Remote' })
      toast.success('Exchange profile saved! Refreshing matches…')

      localStorage.removeItem(`skillx_recommendations_${currentUid}`)
      fetchRecommendations()
    } catch (err) {
      console.error(err)
      toast.error('Could not save profile. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleRequestExchange = async (user) => {
    try {
      if (!currentUid) {
        toast.error('You must be signed in to send a request.')
        return
      }

      const message = `Hi ${user.name}, I would like to exchange my skills (${user.skillWanted}) with yours (${user.skillOffered}).`
      const res = await apiFetch(`/api/exchange-requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          fromUserId: currentUid, 
          toUserId: user.userId, 
          exchangeId: user._id,
          message,
          fromEmail: currentEmail,
          toEmail: user.email
        }),
      })
      if (!res.ok) throw new Error('Failed to send exchange request')
      toast.success(`Exchange request sent to ${user.name}!`)
      fetchEntries() // refresh listings
    } catch (err) {
      console.error(err)
      toast.error('Could not send exchange request. Please try again.')
    }
  }

  const inputStyle = {
    width: '100%',
    background: 'var(--surface2)',
    border: '1.5px solid var(--border)',
    borderRadius: 'var(--radius-md)',
    padding: '10px 14px',
    fontSize: 14,
    color: 'var(--text)',
    outline: 'none',
    transition: 'border-color 200ms, box-shadow 200ms',
    fontFamily: 'inherit',
  }

  const labelStyle = {
    display: 'block',
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--text-muted)',
    marginBottom: 6,
  }

  const otherEntries = entries.filter(u => u.userId !== currentUid)
  const filteredEntries = searchQuery
    ? otherEntries.filter(u =>
        u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.skillOffered?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.skillWanted?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : otherEntries

  return (
    <main
      role="main"
      aria-label="Skill Exchange"
      style={{ minHeight: '100vh', background: 'var(--bg)', paddingBottom: 48 }}
    >
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 16px' }}>

        {/* ── Header ── */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: 'var(--text)', margin: 0 }}>
            Skill Exchange
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 4 }}>
            Find your perfect learning partner. No money — just skills.
          </p>
        </div>

        {/* ── Collapsible Info Banner ── */}
        <div style={{
          background: 'var(--accent-dim)',
          borderLeft: '4px solid var(--accent)',
          borderRadius: `0 var(--radius-md) var(--radius-md) 0`,
          marginBottom: 24,
          overflow: 'hidden',
        }}>
          <button
            onClick={() => setBannerOpen(!bannerOpen)}
            style={{
              width: '100%', padding: '12px 16px',
              display: 'flex', alignItems: 'center', gap: 8,
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--accent)', fontWeight: 600, fontSize: 14,
            }}
            aria-expanded={bannerOpen}
          >
            <ArrowLeftRight size={16} aria-hidden="true" />
            How Skill Exchange works
            <motion.span
              animate={{ rotate: bannerOpen ? 180 : 0 }}
              transition={{ duration: 0.2 }}
              style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center' }}
            >
              <ChevronDown size={16} aria-hidden="true" />
            </motion.span>
          </button>
          <AnimatePresence initial={false}>
            {bannerOpen && (
              <motion.div
                key="banner-body"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
                style={{ overflow: 'hidden' }}
              >
                <p style={{ padding: '0 16px 14px', fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.7, margin: 0 }}>
                  Offer a skill you have, find someone who needs it — and get something you need in return.
                  No money changes hands. Your match score is automatically calculated based on how well your skills align with theirs.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Profile Form ── */}
        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          padding: 28,
          marginBottom: 28,
          boxShadow: 'var(--shadow-sm)',
        }}>
          <h2 style={{ fontSize: 17, fontWeight: 600, color: 'var(--text)', margin: '0 0 20px' }}>
            Your Exchange Profile
          </h2>

          <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
            {/* Name */}
            <div>
              <label htmlFor="se-name" style={labelStyle}>Your Name</label>
              <input
                id="se-name" type="text" name="name" value={form.name}
                onChange={handleChange} required
                placeholder="Your display name"
                style={inputStyle}
                onFocus={e => { e.target.style.borderColor = 'var(--accent)'; e.target.style.boxShadow = '0 0 0 3px rgba(91,79,232,0.12)' }}
                onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none' }}
              />
            </div>

            {/* Location */}
            <div>
              <label htmlFor="se-location" style={labelStyle}>Location</label>
              <select
                id="se-location" name="location" value={form.location} onChange={handleChange}
                style={inputStyle}
                onFocus={e => { e.target.style.borderColor = 'var(--accent)'; e.target.style.boxShadow = '0 0 0 3px rgba(91,79,232,0.12)' }}
                onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none' }}
              >
                <option>Remote</option>
                <option>On-site</option>
                <option>Hybrid</option>
              </select>
            </div>

            {/* Skill Offered */}
            <div>
              <label htmlFor="se-offered" style={labelStyle}>Skill You Offer</label>
              <input
                id="se-offered" type="text" name="skillOffered" value={form.skillOffered}
                onChange={handleChange} required
                placeholder="e.g. UI/UX Design, React, Python…"
                style={inputStyle}
                onFocus={e => { e.target.style.borderColor = 'var(--accent)'; e.target.style.boxShadow = '0 0 0 3px rgba(91,79,232,0.12)' }}
                onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none' }}
              />
            </div>

            {/* Skill Wanted */}
            <div>
              <label htmlFor="se-wanted" style={labelStyle}>Skill You Want</label>
              <input
                id="se-wanted" type="text" name="skillWanted" value={form.skillWanted}
                onChange={handleChange} required
                placeholder="e.g. React JS, Data Analysis…"
                style={inputStyle}
                onFocus={e => { e.target.style.borderColor = 'var(--accent)'; e.target.style.boxShadow = '0 0 0 3px rgba(91,79,232,0.12)' }}
                onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none' }}
              />
            </div>

            {/* Submit */}
            <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                type="submit"
                disabled={submitting}
                style={{
                  padding: '10px 24px',
                  background: submitting ? 'var(--text-muted)' : 'var(--accent)',
                  color: '#fff', border: 'none',
                  borderRadius: 'var(--radius-md)',
                  fontSize: 14, fontWeight: 600, cursor: submitting ? 'not-allowed' : 'pointer',
                  transition: 'background var(--transition-fast)',
                  display: 'flex', alignItems: 'center', gap: 8,
                }}
              >
                {submitting ? (
                  <><RefreshCw size={14} className="animate-spin" aria-hidden="true" /> Saving…</>
                ) : (
                  <><Send size={14} aria-hidden="true" /> Save Exchange Profile</>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* ── Recommended For You ── */}
        {currentEmail && (loadingRecommendations || recommendations.length > 0) && (
          <div style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Star size={18} color="#F59E0B" fill="#F59E0B" aria-hidden="true" />
              Recommended For You
            </h2>

            {loadingRecommendations ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                {[1, 2, 3].map(i => (
                  <div key={i} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 20 }}>
                    <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                      <Skeleton height="44px" width="44px" style={{ borderRadius: '50%', flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <Skeleton height="14px" width="60%" className="mb-2" />
                        <Skeleton height="11px" width="40%" />
                      </div>
                    </div>
                    <Skeleton height="12px" width="80%" className="mb-2" />
                    <Skeleton height="12px" width="70%" className="mb-4" />
                    <Skeleton height="36px" />
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                {recommendations.map(match => (
                  <MatchCard key={`rec-${match._id}`} match={match} onRequest={handleRequestExchange} isRec currentUid={currentUid} currentEmail={currentEmail} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── All Entries ── */}
        {loading ? (
          <LoadingSpinner message="Fetching exchanges…" />
        ) : error ? (
          <div style={{ padding: '12px 16px', background: 'var(--red-bg)', color: 'var(--red)', border: '1px solid var(--red)', borderRadius: 'var(--radius-md)', fontSize: 14 }}>
            {error}
          </div>
        ) : otherEntries.length > 0 ? (
          <>
            {/* Search bar */}
            <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', margin: 0, flex: 1 }}>
                All Members
                <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-muted)', marginLeft: 8 }}>({otherEntries.length})</span>
              </h2>
              <div style={{ position: 'relative' }}>
                <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} aria-hidden="true" />
                <input
                  type="text" placeholder="Search skills or names…"
                  value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                  style={{ ...inputStyle, paddingLeft: 36, width: 220 }}
                  onFocus={e => { e.target.style.borderColor = 'var(--accent)' }}
                  onBlur={e => { e.target.style.borderColor = 'var(--border)' }}
                />
              </div>
            </div>

            {filteredEntries.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--text-muted)' }}>
                <Search size={32} style={{ margin: '0 auto 12px', opacity: 0.4 }} aria-hidden="true" />
                <div style={{ fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4 }}>No matches for "{searchQuery}"</div>
                <div style={{ fontSize: 13 }}>Try a different skill or name</div>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                {filteredEntries.map(match => (
                  <MatchCard key={match._id} match={match} onRequest={handleRequestExchange} currentUid={currentUid} currentEmail={currentEmail} />
                ))}
              </div>
            )}
          </>
        ) : (
          <div style={{
            textAlign: 'center', padding: '64px 24px',
            background: 'var(--surface)', border: '1px dashed var(--border-strong)',
            borderRadius: 'var(--radius-lg)',
          }}>
            <User size={40} color="var(--text-muted)" style={{ margin: '0 auto 14px', opacity: 0.5 }} aria-hidden="true" />
            <div style={{ fontWeight: 600, fontSize: 16, color: 'var(--text-muted)', marginBottom: 6 }}>No matches found yet</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              Be the first! Save your exchange profile above to get discovered.
            </div>
          </div>
        )}
      </div>
    </main>
  )
}

export default SkillExchange
