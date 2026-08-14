/**
 * Dashboard.jsx
 * Main dashboard for user stats, session management, and exchange requests.
 */
import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { useAuth } from '../context/AuthContext'
import { apiFetch } from '../api/apiClient'
const Hand = ({ size, color, style }) => <i className="ti ti-hand-stop" style={{ fontSize: size || 'inherit', color, ...style }} />;
const ArrowLeftRight = ({ size, color, style }) => <i className="ti ti-arrows-exchange" style={{ fontSize: size || 'inherit', color, ...style }} />;
const UserCircle = ({ size, color, style }) => <i className="ti ti-user-circle" style={{ fontSize: size || 'inherit', color, ...style }} />;
const Bell = ({ size, color, style }) => <i className="ti ti-bell" style={{ fontSize: size || 'inherit', color, ...style }} />;
const LayoutDashboard = ({ size, color, style }) => <i className="ti ti-layout-dashboard" style={{ fontSize: size || 'inherit', color, ...style }} />;
const Briefcase = ({ size, color, style }) => <i className="ti ti-briefcase" style={{ fontSize: size || 'inherit', color, ...style }} />;
const Brain = ({ size, color, style }) => <i className="ti ti-brain" style={{ fontSize: size || 'inherit', color, ...style }} />;
const RefreshCw = ({ size, color, style }) => <i className="ti ti-refresh" style={{ fontSize: size || 'inherit', color, ...style }} />;
const Plus = ({ size, color, style }) => <i className="ti ti-plus" style={{ fontSize: size || 'inherit', color, ...style }} />;
const Search = ({ size, color, style }) => <i className="ti ti-search" style={{ fontSize: size || 'inherit', color, ...style }} />;
const CalendarDays = ({ size, color, style }) => <i className="ti ti-calendar" style={{ fontSize: size || 'inherit', color, ...style }} />;
const Globe = ({ size, color, style }) => <i className="ti ti-world" style={{ fontSize: size || 'inherit', color, ...style }} />;
const CheckCircle2 = ({ size, color, style }) => <i className="ti ti-circle-check" style={{ fontSize: size || 'inherit', color, ...style }} />;
const MessageCircle = ({ size, color, style }) => <i className="ti ti-message-2" style={{ fontSize: size || 'inherit', color, ...style }} />;
import LoadingSpinner from '../components/LoadingSpinner';
import LearningRoadmap from '../components/LearningRoadmap'
import MyLearningHub from '../components/MyLearningHub'
import SessionCard from '../components/SessionCard'
import SessionModal from '../components/SessionModal'
import ReviewModal from '../components/ReviewModal'
import UpcomingSessionsModal from '../components/session/UpcomingSessionsModal'

const Dashboard = () => {
  const navigate = useNavigate()
  const { user: firebaseUser } = useAuth()
  const userEmail = firebaseUser?.email
  const [hubRefreshKey, setHubRefreshKey] = useState(0)
  
  const [activeTab, setActiveTab] = useState('overview')

  const [stats, setStats] = useState({
    totalGigs: 0,
    totalSkillExchanges: 0,
    totalProfiles: 0,
    user: null,
  })

  const [requests, setRequests] = useState({
    received: [],
    sent: [],
  })

  const [gigApplications, setGigApplications] = useState({
    received: [],
    sent: [],
  })

  const [upcomingSessions, setUpcomingSessions] = useState([])
  const [isSessionModalOpen, setIsSessionModalOpen] = useState(false)
  const [editingSession, setEditingSession] = useState(null)
  const [isSubmittingSession, setIsSubmittingSession] = useState(false)
  const [isUpcomingModalOpen, setIsUpcomingModalOpen] = useState(false)

  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false)
  const [reviewingSession, setReviewingSession] = useState(null)
  const [isSubmittingReview, setIsSubmittingReview] = useState(false)

  const [analyticsData, setAnalyticsData] = useState({
    user: null,
    activity: [],
    skills: [],
    badges: [],
    recentActivity: [],
  })
  const [, setLoadingAnalytics] = useState(true)


  const [loadingRequests, setLoadingRequests] = useState(true)
  const [loadingGigApps, setLoadingGigApps] = useState(true)
  const [, setLoadingSessions] = useState(true)
  const [error, setError] = useState(null)

  // ------------ DASHBOARD STATS ------------
  const fetchStats = async () => {
    try {
      const url = userEmail
        ? `/api/dashboard?email=${encodeURIComponent(userEmail)}`
        : `/api/dashboard`

      const res = await apiFetch(url)
      if (!res.ok) throw new Error('Failed to fetch dashboard stats')
      const data = await res.json()
      setStats(data)
    } catch (err) {
      console.error(err)
      setError('Could not load dashboard data. Please try again.')
    }
  }

  // ------------ SKILL EXCHANGE REQUESTS ------------
  const fetchRequests = async () => {
    try {
      if (!firebaseUser?.uid) {
        setLoadingRequests(false)
        return
      }
      setLoadingRequests(true)
      const res = await apiFetch(
        `/api/exchange-requests?userId=${encodeURIComponent(
          firebaseUser?.uid,
        )}`,
      )
      if (!res.ok) throw new Error('Failed to fetch requests')
      const data = await res.json()
      setRequests({
        received: data.received || [],
        sent: data.sent || [],
      })
    } catch (err) {
      console.error(err)
      setError('Could not load exchange requests. Please try again.')
    } finally {
      setLoadingRequests(false)
    }
  }

  const handleUpdateRequest = async (id, newStatus) => {
    try {
      const res = await apiFetch(
        `/api/exchange-requests/${id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus }),
        },
      )
      if (!res.ok) throw new Error('Failed to update request')
      const updated = await res.json()

      setRequests(prev => ({
        received: prev.received.map(r =>
          r._id === updated._id ? updated : r,
        ),
        sent: prev.sent.map(r =>
          r._id === updated._id ? updated : r,
        ),
      }))

      if (newStatus === 'accepted') {
        toast.success('Exchange request accepted!')
      } else if (newStatus === 'rejected') {
        toast.info('Exchange request rejected.')
      }
    } catch (err) {
      console.error(err)
      toast.error('Could not update request. Please try again.')
    }
  }

  // ------------ GIG APPLICATIONS (NEW) ------------
  const fetchGigApplications = async () => {
    try {
      if (!userEmail) {
        setLoadingGigApps(false)
        return
      }
      setLoadingGigApps(true)
      const res = await apiFetch(
        `/api/gig-applications?email=${encodeURIComponent(
          userEmail,
        )}`,
      )
      if (!res.ok) throw new Error('Failed to fetch gig applications')

      const data = await res.json()
      setGigApplications({
        received: data.received || [],
        sent: data.sent || [],
      })
    } catch (err) {
      console.error(err)
      setError('Could not load gig applications. Please try again.')
    } finally {
      setLoadingGigApps(false)
    }
  }

  const handleUpdateGigApplication = async (id, newStatus) => {
    try {
      const res = await apiFetch(
        `/api/gig-applications/${id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus }),
        },
      )
      if (!res.ok) throw new Error('Failed to update gig application')

      const updated = await res.json()

      setGigApplications(prev => ({
        received: prev.received.map(a =>
          a._id === updated._id ? updated : a,
        ),
        sent: prev.sent.map(a =>
          a._id === updated._id ? updated : a,
        ),
      }))

      if (newStatus === 'accepted') {
        toast.success('Gig application accepted!')
      } else if (newStatus === 'rejected') {
        toast.info('Gig application rejected.')
      }
    } catch (err) {
      console.error(err)
      toast.error('Could not update gig application. Please try again.')
    }
  }

  // ------------ SESSIONS ------------
  const fetchUpcomingSessions = async () => {
    try {
      if (!userEmail) {
        setLoadingSessions(false)
        return
      }
      setLoadingSessions(true)
      const res = await apiFetch(`/api/sessions?email=${encodeURIComponent(userEmail)}`)
      if (!res.ok) throw new Error('Failed to fetch sessions')
      const data = await res.json()
      setUpcomingSessions(data.filter(s => ['Scheduled', 'Rescheduled', 'Pending'].includes(s.status)))
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingSessions(false)
    }
  }

  const handleSessionSubmit = async (sessionData) => {
    setIsSubmittingSession(true)
    try {
      if (editingSession && editingSession._id) {
        const res = await apiFetch(`/api/sessions/${editingSession._id}/reschedule`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(sessionData),
        })
        if (!res.ok) throw new Error(await res.text())
        setIsSessionModalOpen(false)
        setEditingSession(null)
        fetchUpcomingSessions()
      }
    } catch (error) {
      console.error(error)
    } finally {
      setIsSubmittingSession(false)
    }
  }

  const handleSessionAction = async (sessionId, action) => {
    // Removed window.confirm for now, assumes inline confirm is handled at the component level or passes through

    try {
      const res = await apiFetch(`/api/sessions/${sessionId}/${action}`, { method: 'PUT' })
      if (!res.ok) throw new Error(`Failed to ${action} session`)
      fetchUpcomingSessions()
      if (action === 'accept') toast.success('Session accepted!')
      else if (action === 'cancel') toast.info('Session cancelled.')
      else if (action === 'complete') toast.success('Session marked as completed!')
    } catch (error) {
      console.error('Failed session action', error)
      toast.error(`Could not ${action} session. Please try again.`)
    }
  }

  // ------------ REVIEWS ------------
  const handleReviewSubmit = async ({ sessionId, reviewedUserEmail, rating, feedback }) => {
    setIsSubmittingReview(true)
    try {
      const res = await apiFetch(`/api/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewerEmail: userEmail,
          reviewedUserEmail,
          sessionId,
          rating,
          feedback,
        }),
      })
      if (!res.ok) {
        const errData = await res.json()
        alert(errData.message || 'Failed to submit review')
        return
      }
      setIsReviewModalOpen(false)
      setReviewingSession(null)
      fetchUpcomingSessions()
    } catch (error) {
      console.error('Failed to submit review', error)
    } finally {
      setIsSubmittingReview(false)
    }
  }

  // ------------ ANALYTICS ------------
  const fetchAnalytics = async () => {
    if (!userEmail) return
    setLoadingAnalytics(true)
    try {
      const [userRes, activityRes, skillsRes, badgesRes, recentRes] = await Promise.all([
        apiFetch(`/api/analytics/user?email=${encodeURIComponent(userEmail)}`),
        apiFetch(`/api/analytics/activity?email=${encodeURIComponent(userEmail)}`),
        apiFetch(`/api/analytics/skills?email=${encodeURIComponent(userEmail)}`),
        apiFetch(`/api/analytics/badges?email=${encodeURIComponent(userEmail)}`),
        apiFetch(`/api/analytics/recent-activity?email=${encodeURIComponent(userEmail)}`),
      ])

      setAnalyticsData({
        user: userRes.ok ? await userRes.json() : null,
        activity: activityRes.ok ? await activityRes.json() : [],
        skills: skillsRes.ok ? await skillsRes.json() : [],
        badges: badgesRes.ok ? await badgesRes.json() : [],
        recentActivity: recentRes.ok ? await recentRes.json() : [],
      })
    } catch (error) {
      console.error('Failed to fetch analytics', error)
    } finally {
      setLoadingAnalytics(false)
    }
  }

  // ------------ EFFECT ------------
  useEffect(() => {
    fetchStats()
    if (userEmail) {
      fetchRequests()
      fetchGigApplications()
      fetchUpcomingSessions()
      fetchAnalytics()
    } else {
      setLoadingRequests(false)
      setLoadingGigApps(false)
      setLoadingSessions(false)
      setLoadingAnalytics(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userEmail, firebaseUser?.uid])

  const userStats = stats.user?.stats || {
    gigsPosted: 0,
    gigsCompleted: 0,
    skillExchanges: 0,
  }

  const pendingReceivedCount = requests.received.filter(
    r => r.status === 'pending',
  ).length

  return (
    <motion.main
      role="main"
      aria-label="Dashboard"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      style={{ minHeight: '100vh', background: 'var(--bg)', padding: '0 0 48px' }}
    >
      <div className="w-full max-w-6xl mx-auto space-y-6" style={{ padding: '24px' }}>
        {(() => {
          const liveSession = upcomingSessions.find(s => s.status?.toLowerCase() === 'live' && s.participants?.includes(userEmail));
          if (!liveSession) return null;
          const otherUser = liveSession.participants.find(p => p !== userEmail) || 'Someone';
          return (
            <div style={{
              width: '100%', background: 'var(--accent-dim)', border: '0.5px solid var(--accent)',
              borderRadius: 12, padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              marginBottom: 24
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--green)', boxShadow: '0 0 8px var(--green)', animation: 'pulse 2s infinite' }} />
                <span style={{ color: 'var(--text)', fontSize: 14, fontWeight: 500 }}>
                  Live — You ↔ {otherUser.split('@')[0]} · Video session · Started just now
                </span>
              </div>
              <button 
                onClick={() => navigate(`/video-session/${liveSession._id}`)}
                style={{
                  background: 'var(--accent-light)', color: '#26215C', borderRadius: 8,
                  padding: '8px 16px', fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer'
                }}
              >
                Join now
              </button>
            </div>
          );
        })()}
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 700, color: 'var(--text)', margin: 0 }}>Dashboard</h1>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 4 }}>
              Overview of gigs, skill exchanges, your activity, and requests.
            </p>
            {userEmail && pendingReceivedCount > 0 && (
              <p style={{ marginTop: 8, fontSize: 13, color: 'var(--accent)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Bell size={13} aria-hidden="true" />
                {pendingReceivedCount} pending skill exchange request{pendingReceivedCount > 1 ? 's' : ''}
              </p>
            )}
          </div>
          <button
            onClick={() => {
              fetchStats()
              if (userEmail) {
                fetchRequests()
                fetchGigApplications()
                fetchUpcomingSessions()
                fetchAnalytics()
              }
            }}
            className="inline-flex items-center gap-2 self-start"
            style={{
              fontSize: 13, background: 'var(--surface2)', color: 'var(--text-muted)',
              border: '1px solid var(--border)', padding: '7px 14px',
              borderRadius: 'var(--radius-md)', cursor: 'pointer', fontWeight: 500,
              transition: 'all var(--transition-fast)',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent-dim)'; e.currentTarget.style.color = 'var(--accent)'; e.currentTarget.style.borderColor = 'var(--border-strong)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--surface2)'; e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border)' }}
          >
            <RefreshCw size={13} aria-hidden="true" />
            Refresh
          </button>
        </div>

        {/* Errors */}
        {error && (
          <div style={{ fontSize: 13, background: 'var(--red-bg)', color: 'var(--red)', border: '1px solid var(--red)', padding: '10px 16px', borderRadius: 'var(--radius-md)' }}>
            {error}
          </div>
        )}

        {/* --- Tab Navigation --- */}
        {userEmail && (
          <div
            className="flex overflow-x-auto hide-scrollbar"
            style={{ borderBottom: '1px solid var(--border)' }}
          >
            <div className="flex min-w-max" style={{ gap: 4 }}>
              {[
                { id: 'overview',  label: 'Overview',  Icon: LayoutDashboard },
                { id: 'network',   label: 'Network',   Icon: ArrowLeftRight },
                { id: 'gigs',      label: 'Gigs',      Icon: Briefcase },
                { id: 'learning',  label: 'Learning',  Icon: Brain },
              ].map(({ id, label, Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '12px 14px',
                    borderBottom: activeTab === id ? '2px solid var(--accent)' : '2px solid transparent',
                    color: activeTab === id ? 'var(--accent)' : 'var(--text-muted)',
                    fontWeight: activeTab === id ? 600 : 500,
                    fontSize: 13,
                    background: 'none',
                    cursor: 'pointer',
                    transition: 'all var(--transition-fast)',
                    whiteSpace: 'nowrap',
                  }}
                  aria-selected={activeTab === id}
                  role="tab"
                >
                  <Icon size={14} aria-hidden="true" />
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* --- OVERVIEW TAB --- */}
        {userEmail && activeTab === 'overview' && (
          <div className="space-y-8">
            {/* 2. STATS ROW */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
              {[
                { label: 'Gigs Posted', value: userStats.gigsPosted || 0 },
                { label: 'Gigs Completed', value: userStats.gigsCompleted || 0 },
                { label: 'Exchanges Sent', value: userStats.skillExchanges || 0 },
                { label: 'Your Rating', value: userStats.averageRating ? `${userStats.averageRating} / 5.0` : 'New' },
              ].map((stat, i) => (
                <div key={i} style={{ background: 'var(--surface)', border: '0.5px solid var(--border)', borderRadius: 12, padding: '14px 16px' }}>
                  <div style={{ fontSize: 10, textTransform: 'uppercase', color: 'var(--text-dim)', letterSpacing: '0.7px', marginBottom: 4, fontWeight: 600 }}>{stat.label}</div>
                  <div style={{ fontSize: 24, fontWeight: 500, color: 'var(--text)' }}>{stat.value}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 4 }}>Updated just now</div>
                </div>
              ))}
            </div>

            {/* 3. UPCOMING SESSIONS */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', margin: 0 }}>Upcoming sessions</h3>
                <span style={{ background: 'var(--accent-dim)', color: 'var(--accent-light)', fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 99 }}>
                  {upcomingSessions.length}
                </span>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                {upcomingSessions.slice(0, 4).map(session => {
                  const isLive = session.status?.toLowerCase() === 'live';
                  const isAwaiting = session.status?.toLowerCase() === 'pending';
                  const isScheduled = session.status?.toLowerCase() === 'scheduled';
                  
                  return (
                    <div key={session._id} style={{ 
                      background: isLive ? 'var(--surface2)' : 'var(--surface)', 
                      border: isLive ? '1px solid var(--accent)' : '0.5px solid var(--border)', 
                      borderRadius: 12, padding: 14,
                      display: 'flex', flexDirection: 'column', gap: 12
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
                            {session.participants.find(p => p !== userEmail)?.split('@')[0] || 'User'}
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                            {new Date(session.date).toLocaleDateString()} at {session.time}
                          </div>
                        </div>
                        
                        {isLive && <span style={{ background: 'var(--accent-dim)', color: 'var(--accent-light)', fontSize: 10, fontWeight: 600, padding: '2px 6px', borderRadius: 4 }}>Live now</span>}
                        {isAwaiting && <span style={{ background: 'var(--surface2)', color: 'var(--text-dim)', fontSize: 10, fontWeight: 600, padding: '2px 6px', borderRadius: 4 }}>Awaiting confirmation</span>}
                        {isScheduled && <span style={{ background: 'var(--green-bg)', color: 'var(--green)', fontSize: 10, fontWeight: 600, padding: '2px 6px', borderRadius: 4 }}>Scheduled</span>}
                      </div>

                      <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }}>
                        {isLive && (
                          <>
                            <button onClick={() => navigate(`/video-session/${session._id}`)} style={{ flex: 1, background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 0', fontSize: 12, fontWeight: 500, cursor: 'pointer' }}>Join session</button>
                            <button onClick={() => { setEditingSession(session); setIsSessionModalOpen(true); }} style={{ flex: 1, background: 'transparent', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: 6, padding: '6px 0', fontSize: 12, fontWeight: 500, cursor: 'pointer' }}>Reschedule</button>
                          </>
                        )}
                        {isAwaiting && (
                          <button onClick={() => handleSessionAction(session._id, 'cancel')} style={{ background: 'transparent', color: 'var(--red)', border: 'none', padding: '6px 0', fontSize: 12, fontWeight: 500, cursor: 'pointer' }}>Cancel request</button>
                        )}
                        {isScheduled && (
                          <>
                            <button onClick={() => navigate(`/video-session/${session._id}`)} style={{ flex: 1, background: 'var(--surface2)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: 6, padding: '6px 0', fontSize: 12, fontWeight: 500, cursor: 'pointer' }}>Prepare</button>
                            <button onClick={() => { setEditingSession(session); setIsSessionModalOpen(true); }} style={{ flex: 1, background: 'transparent', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: 6, padding: '6px 0', fontSize: 12, fontWeight: 500, cursor: 'pointer' }}>Reschedule</button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
                {upcomingSessions.length === 0 && (
                  <div style={{ gridColumn: '1 / -1', padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, background: 'var(--surface)', borderRadius: 12, border: '0.5px dashed var(--border)' }}>
                    No upcoming sessions found.
                  </div>
                )}
              </div>
            </div>

            {/* 4. TWO-COLUMN ROW */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
              
              {/* RECENT ACTIVITY */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', margin: 0 }}>Recent Activity</h3>
                  <a href="#" style={{ fontSize: 12, color: 'var(--text-muted)', textDecoration: 'none' }}>View all</a>
                </div>
                <div style={{ background: 'var(--surface)', borderRadius: 12, border: '0.5px solid var(--border)', padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {analyticsData.recentActivity && analyticsData.recentActivity.length > 0 ? (
                    analyticsData.recentActivity.slice(0, 5).map((act, i) => {
                      let typeColor = 'var(--text-dim)';
                      let typeBg = 'var(--surface2)';
                      let iconClass = 'ti-activity';
                      if (act.type === 'session_completed' || act.type === 'completed') { typeColor = 'var(--green)'; typeBg = 'var(--green-bg)'; iconClass = 'ti-check'; }
                      else if (act.type === 'review') { typeColor = 'var(--amber)'; typeBg = 'var(--amber-bg)'; iconClass = 'ti-star'; }
                      else if (act.type === 'exchange') { typeColor = 'var(--accent-light)'; typeBg = 'var(--accent-dim)'; iconClass = 'ti-arrows-exchange'; }

                      return (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{ width: 28, height: 28, borderRadius: '50%', background: typeBg, color: typeColor, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <i className={`ti ${iconClass}`} style={{ fontSize: 14 }} />
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 13, color: 'var(--text)' }}>{act.description || act.title}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>{new Date(act.createdAt || act.date).toLocaleDateString()}</div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', padding: 12 }}>No recent activity.</div>
                  )}
                </div>
              </div>

              {/* BADGES */}
              <div>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', margin: 0, marginBottom: 16 }}>Badges</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                                  {[
                    { 
                      name: 'First Exchange', 
                      emoji: '🤝',
                      isEarned: (analyticsData.user?.completedExchanges || 0) >= 1,
                      progress: Math.min(((analyticsData.user?.completedExchanges || 0) / 1) * 100, 100)
                    },
                    { 
                      name: 'Session Rookie', 
                      emoji: '🌱',
                      isEarned: (analyticsData.user?.completedExchanges || 0) >= 3,
                      progress: Math.min(((analyticsData.user?.completedExchanges || 0) / 3) * 100, 100)
                    },
                    { 
                      name: 'Top Rated', 
                      emoji: '⭐',
                      isEarned: (analyticsData.user?.averageRating || 0) >= 4.5,
                      progress: Math.min(((analyticsData.user?.averageRating || 0) / 4.5) * 100, 100)
                    },
                    { 
                      name: 'Skill Explorer', 
                      emoji: '🧭',
                      isEarned: (analyticsData.skills?.length || 0) >= 5,
                      progress: Math.min(((analyticsData.skills?.length || 0) / 5) * 100, 100)
                    },
                    { 
                      name: 'Connector', 
                      emoji: '🔗',
                      isEarned: (analyticsData.user?.requestsSent || 0) >= 5,
                      progress: Math.min(((analyticsData.user?.requestsSent || 0) / 5) * 100, 100)
                    },
                    { 
                      name: 'Learner', 
                      emoji: '📚',
                      isEarned: (analyticsData.user?.completedExchanges || 0) >= 2,
                      progress: Math.min(((analyticsData.user?.completedExchanges || 0) / 2) * 100, 100)
                    },
                  ].map((badgeDef, i) => {
                    const isEarned = badgeDef.isEarned;
                    const progress = badgeDef.progress;
                    
                    return (
                      <div key={i} style={{ 
                        background: isEarned ? 'var(--accent-dim)' : 'var(--surface2)', 
                        border: isEarned ? '0.5px solid var(--accent)' : '0.5px solid transparent', 
                        borderRadius: 12, padding: 12, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center'
                      }}>
                        <div style={{ fontSize: 24, opacity: isEarned ? 1 : 0.4, marginBottom: 8 }}>{badgeDef.emoji}</div>
                        <div style={{ fontSize: 11, fontWeight: 600, color: isEarned ? 'var(--accent-light)' : 'var(--text-dim)', marginBottom: 8 }}>
                          {badgeDef.name}
                        </div>
                        {!isEarned && (
                          <div style={{ width: '100%', height: 3, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
                            <div style={{ width: `${progress}%`, height: '100%', background: 'var(--accent)' }} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* --- NETWORK TAB --- */}
        {userEmail && activeTab === 'network' && (
          <motion.div
            className="space-y-8"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
          >
            {stats.matches && stats.matches.length > 0 && (
              <div className="card-accent relative overflow-hidden">
                <div className="absolute -right-20 -top-20 w-64 h-64 bg-[var(--bg-card)] opacity-5 rounded-full blur-3xl"></div>
                <h2 className="text-2xl font-bold flex items-center gap-3 relative z-10">
                  <span className="text-3xl">✨</span> Perfect Matches Found!
                </h2>
                <p className="text-sm text-[var(--text-muted)] mt-2 mb-6 relative z-10 max-w-2xl">
                  Our smart algorithm detected that these users are offering exactly what you need, and they need exactly what you are offering!
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 relative z-10">
                  {stats.matches.map((match, i) => (
                    <div key={i} className="card flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 rounded-full bg-[var(--bg-card)]/20 flex items-center justify-center font-bold text-lg">
                            {match.matchedExchange.name ? match.matchedExchange.name.charAt(0).toUpperCase() : '?'}
                          </div>
                          <p className="font-bold text-lg">{match.matchedExchange.name}</p>
                        </div>
                        <div className="space-y-1 mt-3">
                          <p className="text-sm flex items-center gap-2">
                            <span className="opacity-70 w-14">Offers:</span>
                            <span className="font-semibold text-[var(--green-text)] bg-[var(--green-bg)] px-2 py-0.5 rounded text-xs">{match.matchedExchange.skillOffered}</span>
                          </p>
                          <p className="text-sm flex items-center gap-2">
                            <span className="opacity-70 w-14">Needs:</span>
                            <span className="font-semibold text-[var(--accent-light)] bg-[var(--accent-dim)] px-2 py-0.5 rounded text-xs">{match.matchedExchange.skillWanted}</span>
                          </p>
                        </div>
                      </div>
                      <Link to={`/user/${match.matchedExchange.email}`} className="mt-5 text-center btn-primary w-full text-center">
                        View Profile &amp; Message
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="card">
                <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', marginBottom: 12 }}>Skill Exchange Requests For You</h2>
                {loadingRequests ? (
                  <LoadingSpinner message="Fetching your data…" />
                ) : requests.received.length === 0 ? (
                  <p className="text-sm text-[var(--text-muted)]">No one has requested a skill exchange with you yet.</p>
                ) : (
                  <>
                    <div className="space-y-3">
                      {requests.received.filter(req => req.status === 'pending').map(req => (
                        <div key={req._id} className="card p-4 text-sm">
                          <p className="text-[var(--text)]"><span className="font-medium">From: </span>{req.fromName || req.fromEmail?.split('@')[0] || 'Unknown'}</p>
                          <p className="text-[var(--text-muted)] mt-1">{req.message || 'No message provided.'}</p>
                          <p className="text-xs text-[var(--text-dim)] mt-1">Status: <span className="text-[var(--amber-text)] font-medium">pending</span></p>
                          <div className="flex gap-2 mt-2">
                            <button className=" btn-success transition" onClick={() => handleUpdateRequest(req._id, 'accepted')}>Accept</button>
                            <button className=" btn-danger transition" onClick={() => handleUpdateRequest(req._id, 'rejected')}>Reject</button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 border-t border-gray-100 pt-3">
                      <p className="text-xs font-semibold text-[var(--text-dim)] mb-2">Previous decisions</p>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {requests.received.filter(req => req.status !== 'pending').map(req => (
                          <div key={req._id} className="card p-4 text-xs">
                            <p className="text-[var(--text)]"><span className="font-medium">From: </span>{req.fromName || req.fromEmail?.split('@')[0] || 'Unknown'}</p>
                            <p className="text-[var(--text-muted)] mt-1 line-clamp-2">{req.message || 'No message provided.'}</p>
                            <p className="text-xs text-[var(--text-dim)] mt-1">Status: <span className={req.status === 'accepted' ? 'text-[var(--green-text)] font-medium' : 'text-[var(--red-text)] font-medium'}>{req.status}</span></p>
                            {req.status === 'accepted' && (<button onClick={() => navigate('/chat', req.chatRoomId ? { state: { roomId: req.chatRoomId } } : undefined)} className="inline-block mt-2 text-[10px] badge badge-exchange transition">💬 Go to Messages</button>)}
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
              <div className="card">
                <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', marginBottom: 12 }}>Skill Exchange Requests You Sent</h2>
                {loadingRequests ? (
                  <LoadingSpinner message="Fetching your data…" />
                ) : requests.sent.length === 0 ? (
                  <p className="text-sm text-[var(--text-muted)]">You haven&apos;t sent any skill exchange requests yet.</p>
                ) : (
                  <div className="space-y-3">
                    {requests.sent.map(req => (
                      <div key={req._id} className="card p-4 text-sm">
                        <p className="text-[var(--text)]"><span className="font-medium">To: </span>{req.toName || req.toEmail?.split('@')[0] || 'Unknown'}</p>
                        <p className="text-[var(--text-muted)] mt-1">{req.message || 'No message provided.'}</p>
                        <p className="text-xs text-[var(--text-dim)] mt-1">Status: <span className={req.status === 'accepted' ? 'text-[var(--green-text)] font-medium' : req.status === 'rejected' ? 'text-[var(--red-text)] font-medium' : 'text-[var(--amber-text)] font-medium'}>{req.status}</span></p>
                        {req.status === 'accepted' && (<button onClick={() => navigate('/chat', req.chatRoomId ? { state: { roomId: req.chatRoomId } } : undefined)} className="inline-block mt-2 text-[10px] badge badge-exchange transition">💬 Go to Messages</button>)}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* --- GIGS TAB --- */}
        {userEmail && activeTab === 'gigs' && (
          <motion.div
            className="space-y-8"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="card">
                <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', marginBottom: 12 }}>Gig Applications For Your Gigs</h2>
                {loadingGigApps ? (
                  <LoadingSpinner message="Fetching your data…" />
                ) : gigApplications.received.length === 0 ? (
                  <p className="text-sm text-[var(--text-muted)]">No one has applied to your gigs yet.</p>
                ) : (
                  <div className="space-y-3">
                    {gigApplications.received.map(app => (
                      <div key={app._id} className="card p-4 text-sm">
                        <p className="text-[var(--text)]"><span className="font-medium">Gig:</span> {app.gigTitle}</p>
                        <p className="text-[var(--text)]"><span className="font-medium">From:</span> {app.applicantEmail}</p>
                        {app.message && (<p className="text-[var(--text-muted)] mt-1">Message: {app.message}</p>)}
                        <p className="text-xs text-[var(--text-dim)] mt-1">Status: <span className={app.status === 'accepted' ? 'text-[var(--green-text)] font-medium' : app.status === 'rejected' ? 'text-[var(--red-text)] font-medium' : 'text-[var(--amber-text)] font-medium'}>{app.status}</span></p>
                        {app.status === 'pending' && (
                          <div className="flex gap-2 mt-2">
                            <button className=" btn-success transition" onClick={() => handleUpdateGigApplication(app._id, 'accepted')}>Accept</button>
                            <button className=" btn-danger transition" onClick={() => handleUpdateGigApplication(app._id, 'rejected')}>Reject</button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="card">
                <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', marginBottom: 12 }}>Gig Applications You Sent</h2>
                {loadingGigApps ? (
                  <LoadingSpinner message="Fetching your data…" />
                ) : gigApplications.sent.length === 0 ? (
                  <p className="text-sm text-[var(--text-muted)]">You haven&apos;t applied to any gigs yet.</p>
                ) : (
                  <div className="space-y-3">
                    {gigApplications.sent.map(app => (
                      <div key={app._id} className="card p-4 text-sm">
                        <p className="text-[var(--text)]"><span className="font-medium">Gig:</span> {app.gigTitle}</p>
                        <p className="text-[var(--text)]"><span className="font-medium">Owner:</span> {app.gigOwnerEmail}</p>
                        {app.message && (<p className="text-[var(--text-muted)] mt-1">Message: {app.message}</p>)}
                        <p className="text-xs text-[var(--text-dim)] mt-1">Status: <span className={app.status === 'accepted' ? 'text-[var(--green-text)] font-medium' : app.status === 'rejected' ? 'text-[var(--red-text)] font-medium' : 'text-[var(--amber-text)] font-medium'}>{app.status}</span></p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* --- LEARNING TAB --- */}
        {userEmail && activeTab === 'learning' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* AI Learning Roadmap Section */}
            <LearningRoadmap
              userEmail={userEmail}
              onRoadmapSaved={() => setHubRefreshKey((k) => k + 1)}
            />

            {/* My Learning Hub Section */}
            <MyLearningHub userEmail={userEmail} refreshKey={hubRefreshKey} />
          </div>
        )}
      </div>

      {/* Session Modal for Rescheduling */}
      <SessionModal
        isOpen={isSessionModalOpen}
        onClose={() => setIsSessionModalOpen(false)}
        onSubmit={handleSessionSubmit}
        isSubmitting={isSubmittingSession}
        initialData={editingSession}
      />

      <UpcomingSessionsModal 
        isOpen={isUpcomingModalOpen} 
        onClose={() => setIsUpcomingModalOpen(false)} 
        userEmail={userEmail} 
      />

      {/* Review Modal */}
      <ReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => { setIsReviewModalOpen(false); setReviewingSession(null) }}
        onSubmit={handleReviewSubmit}
        isSubmitting={isSubmittingReview}
        sessionId={reviewingSession?._id}
        reviewedUserEmail={reviewingSession?.reviewedUserEmail}
      />
    </motion.main>
  )
}

export default Dashboard
