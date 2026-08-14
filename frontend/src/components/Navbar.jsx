import React, { useEffect, useState } from 'react'
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { auth } from '../firebase/firebaseConfig'
import { useAuth } from '../context/AuthContext'
import NotificationBell from './NotificationBell'
import { AnimatePresence } from 'framer-motion'
import { getAvatarColors } from '../utils/avatarUtils'
import { apiFetch } from '../api/apiClient'
import { getSocket } from '../config/socket'

const NAV_LINKS = [
  { to: '/dashboard',      label: 'Dashboard',     icon: 'ti-layout-dashboard' },
  { to: '/post-gig',       label: 'Post Gig',       icon: 'ti-briefcase-upload' },
  { to: '/gig-list',       label: 'Gigs',           icon: 'ti-briefcase' },
  { to: '/browse',         label: 'Browse',         icon: 'ti-compass' },
  { to: '/skill-exchange', label: 'Skill Exchange', icon: 'ti-arrows-exchange', badgeCount: 1 },
  { to: '/chat',           label: 'Messages',       icon: 'ti-message-2' },
  { to: '/profile',        label: 'Profile',        icon: 'ti-user-circle' },
]

const VISIBLE_LINKS = NAV_LINKS.filter(l => !l.hide)

const Navbar = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user: firebaseUser, userProfile } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)

  // Unread state — fetched from API and kept live via socket
  const [unreadExchanges] = useState(0)
  const [unreadMessages, setUnreadMessages] = useState(0)

  // Derive user display info from AuthContext
  const user = firebaseUser ? {
    email: firebaseUser.email,
    name: firebaseUser.displayName || userProfile?.name || '',
    uid: firebaseUser.uid,
  } : null
  const currentUserEmail = user?.email
  const isAdmin = userProfile?.role === 'admin'

  useEffect(() => { setMobileOpen(false) }, [location])

  // Fetch initial unread count — extracted so socket handler can re-use it
  const fetchUnreadTotal = async () => {
    try {
      const res = await apiFetch('/api/chat/unread-total')
      if (res.ok) {
        const data = await res.json()
        setUnreadMessages(data.total || 0)
      }
    } catch (e) {
      console.warn('Failed to fetch unread message count:', e)
    }
  }

  // Fetch initial unread message count
  useEffect(() => {
    if (!currentUserEmail) return
    fetchUnreadTotal()
  }, [currentUserEmail])

  // Real-time unread badge updates via socket
  useEffect(() => {
    if (!currentUserEmail) return
    const sock = getSocket()
    if (!sock) return

    const attachListener = () => {
      sock.on('unreadCountUpdated', fetchUnreadTotal)
    }

    if (sock.connected) {
      attachListener()
    } else {
      sock.once('connect', attachListener)
    }

    return () => {
      sock.off('unreadCountUpdated', fetchUnreadTotal)
      sock.off('connect', attachListener)
    }
  }, [currentUserEmail])

  const handleLogout = async () => {
    try {
      await signOut(auth)
      localStorage.removeItem('user') // Clean up any legacy data
      navigate('/signin')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const userInitial = user?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || '?'
  const userName = user?.name || user?.email?.split('@')[0] || 'Account'
  const navAvatarColors = getAvatarColors(user?.name || user?.email || '')

  const visibleLinks = user
    ? [...VISIBLE_LINKS, ...(isAdmin ? [{ to: '/admin', label: 'Admin', icon: 'ti-shield-check' }] : [])]
    : []

  return (
    <>
      <nav
        className="navbar"
        role="navigation"
        aria-label="Main navigation"
      >
        <div style={{ display: 'flex', alignItems: 'center', width: '100%', maxWidth: 1200, margin: '0 auto', gap: 8 }}>
          {/* Logo */}
          <Link
            to="/"
            aria-label="SkillX Home"
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: 'var(--accent-light)',
              letterSpacing: '-0.02em',
              marginRight: 12,
              flexShrink: 0,
              textDecoration: 'none',
            }}
          >
            Skill<span style={{ color: 'var(--text)' }}>X</span>
          </Link>

          {/* Desktop nav links */}
          {user && (
            <div className="hidden md:flex" style={{ alignItems: 'center', gap: 2, flex: 1 }}>
              {visibleLinks.map(({ to, label, icon }) => {
                let currentCount = 0;
                if (label === 'Messages') currentCount = unreadMessages;
                if (label === 'Skill Exchange') currentCount = unreadExchanges;
                
                return (
                  <NavLink
                    key={`${to}-${label}`}
                    to={to}
                    className={({ isActive }) =>
                      `flex items-center gap-1.5 text-[13px] font-medium px-3 py-1.5 rounded-[8px] transition-all duration-120 ${
                        isActive
                          ? 'nav-link-active'
                          : 'hover:bg-[var(--surface2)]'
                      }`
                    }
                    style={({ isActive }) => ({
                      color: isActive ? 'var(--accent-light)' : 'var(--text-muted)',
                      textDecoration: 'none',
                      position: 'relative',
                    })}
                  >
                    <i className={`ti ${icon}`} style={{ fontSize: 15, lineHeight: 1 }} aria-hidden="true" />
                    {label}
                    {currentCount > 0 && (
                      <span style={{
                        background: 'var(--accent)',
                        color: 'white',
                        fontSize: 10,
                        fontWeight: 700,
                        padding: '1px 5px',
                        borderRadius: 10,
                        marginLeft: 4,
                        lineHeight: 1
                      }}>
                        {currentCount}
                      </span>
                    )}
                  </NavLink>
                )
              })}
            </div>
          )}

          {!user && <div style={{ flex: 1 }} />}

          {/* Right section */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 'auto' }}>
            {user ? (
              <>
                {/* Search */}
                <Link
                  to="/search"
                  className="icon-btn"
                  aria-label="Search"
                  title="Search"
                >
                  <i className="ti ti-search" style={{ fontSize: 16 }} aria-hidden="true" />
                </Link>

                {/* Notification bell */}
                <NotificationBell />

                {/* Avatar chip */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '4px 10px 4px 4px',
                    background: 'var(--surface2)',
                    border: '0.5px solid var(--border)',
                    borderRadius: 'var(--radius-full)',
                    cursor: 'pointer',
                    transition: 'all var(--t-fast)',
                  }}
                  onClick={() => navigate('/profile')}
                  role="button"
                  tabIndex={0}
                  aria-label={`Go to profile for ${userName}`}
                  onKeyDown={e => { if (e.key === 'Enter') navigate('/profile') }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = 'var(--border-strong)'
                    e.currentTarget.style.background = 'var(--surface3)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = 'var(--border)'
                    e.currentTarget.style.background = 'var(--surface2)'
                  }}
                >
                  <div style={{
                    width: 26, height: 26, borderRadius: '50%',
                    background: navAvatarColors.bg,
                    color: navAvatarColors.text,
                    fontSize: 11, fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    {userInitial}
                  </div>
                  <span className="hidden sm:block" style={{ fontSize: 12, fontWeight: 500, color: 'var(--text)', maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {userName}
                  </span>
                </div>

                {/* Logout */}
                <button
                  onClick={handleLogout}
                  className="icon-btn"
                  aria-label="Logout"
                  title="Logout"
                >
                  <i className="ti ti-logout" style={{ fontSize: 16 }} aria-hidden="true" />
                </button>

                {/* Mobile hamburger */}
                <button
                  className="md:hidden icon-btn"
                  onClick={() => setMobileOpen(o => !o)}
                  aria-label="Open navigation menu"
                  aria-expanded={mobileOpen}
                >
                  <i className={`ti ${mobileOpen ? 'ti-x' : 'ti-menu-2'}`} style={{ fontSize: 16 }} aria-hidden="true" />
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/signin"
                  style={{
                    fontSize: 13, fontWeight: 500,
                    color: 'var(--text-muted)',
                    padding: '6px 12px',
                    borderRadius: 'var(--radius-md)',
                    textDecoration: 'none',
                    transition: 'color var(--t-fast)',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.color = 'var(--text)' }}
                  onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)' }}
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  className="btn-primary"
                  style={{ textDecoration: 'none', fontSize: 13 }}
                >
                  <i className="ti ti-sparkles" style={{ fontSize: 14 }} aria-hidden="true" />
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile Slide Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              style={{
                position: 'fixed', inset: 0, zIndex: 40,
                background: 'rgba(0,0,0,0.6)',
                backdropFilter: 'blur(4px)',
              }}
              className="md:hidden"
              onClick={() => setMobileOpen(false)}
              aria-hidden="true"
            />
            {/* Drawer */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 220 }}
              style={{
                position: 'fixed', left: 0, top: 0, bottom: 0,
                zIndex: 50, width: 264,
                background: 'var(--panel)',
                borderRight: '0.5px solid var(--border)',
                display: 'flex', flexDirection: 'column',
              }}
              className="md:hidden"
              role="dialog"
              aria-label="Navigation menu"
            >
              {/* Drawer header */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '0 16px', height: 56,
                borderBottom: '0.5px solid var(--border)',
              }}>
                <span style={{ fontSize: 17, fontWeight: 700, color: 'var(--accent-light)' }}>
                  Skill<span style={{ color: 'var(--text)' }}>X</span>
                </span>
                <button className="icon-btn" onClick={() => setMobileOpen(false)} aria-label="Close menu">
                  <i className="ti ti-x" style={{ fontSize: 16 }} aria-hidden="true" />
                </button>
              </div>

              {/* User info strip */}
              {user && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '12px 16px',
                  borderBottom: '0.5px solid var(--border)',
                }}>
                  <div style={{
                    width: 34, height: 34, borderRadius: '50%',
                    background: navAvatarColors.bg, color: navAvatarColors.text,
                    fontSize: 13, fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    {userInitial}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{userName}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{user?.email}</div>
                  </div>
                </div>
              )}

              {/* Nav links */}
              <nav style={{ flex: 1, overflowY: 'auto', padding: '10px 10px' }}>
                {visibleLinks.map(({ to, label, icon }) => (
                  <NavLink
                    key={`${to}-${label}-mobile`}
                    to={to}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 rounded-[8px] text-[13px] font-medium transition-all mb-0.5 ${
                        isActive ? 'nav-link-active' : ''
                      }`
                    }
                    style={({ isActive }) => ({
                      color: isActive ? 'var(--accent-light)' : 'var(--text-muted)',
                      textDecoration: 'none',
                      display: 'flex', alignItems: 'center', gap: 10,
                    })}
                    onMouseEnter={e => { if (!e.currentTarget.classList.contains('nav-link-active')) e.currentTarget.style.background = 'var(--surface2)' }}
                    onMouseLeave={e => { if (!e.currentTarget.classList.contains('nav-link-active')) e.currentTarget.style.background = '' }}
                  >
                    <i className={`ti ${icon}`} style={{ fontSize: 17 }} aria-hidden="true" />
                    {label}
                  </NavLink>
                ))}
              </nav>

              {/* Drawer footer */}
              <div style={{ padding: '10px', borderTop: '0.5px solid var(--border)' }}>
                <button
                  onClick={handleLogout}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                    padding: '9px 12px', borderRadius: 'var(--radius-md)',
                    fontSize: 13, fontWeight: 500,
                    color: 'var(--red-text)',
                    background: 'var(--red-bg)',
                    border: '0.5px solid var(--red)',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    transition: 'all var(--t-fast)',
                  }}
                >
                  <i className="ti ti-logout" style={{ fontSize: 16 }} aria-hidden="true" />
                  Sign Out
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

export default Navbar
