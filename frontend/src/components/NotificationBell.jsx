import React from 'react'
const Bell = ({ size, color, style }) => <i className="ti ti-bell" style={{ fontSize: size || 'inherit', color, ...style }} />
import { useState, useEffect, useRef } from 'react'
import NotificationDropdown from './NotificationDropdown'
import { connectSocket, getSocket } from '../config/socket'
import { apiFetch } from '../api/apiClient'
import { useAuth } from '../context/AuthContext'

const NotificationBell = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [activeTab, setActiveTab] = useState('All')
  const [loading, setLoading] = useState(false)

  const dropdownRef = useRef(null)
  const { user: firebaseUser } = useAuth()
  const userEmail = firebaseUser?.email

  useEffect(() => {
    if (!userEmail) return

    const fetchInitialData = async () => {
      try {
        setLoading(true)
        const countRes = await apiFetch(`/api/notifications/unread-count`, {
          headers: { 'user-email': userEmail },
        })
        const countData = await countRes.json()
        setUnreadCount(countData.count || 0)

        const notifRes = await apiFetch(`/api/notifications`, {
          headers: { 'user-email': userEmail },
        })
        const notifData = await notifRes.json()
        setNotifications(notifData)
      } catch (error) {
        console.error('Failed to fetch notifications', error)
      } finally {
        setLoading(false)
      }
    }

    const initSocket = async () => {
      // Await connection so joinUserRoom is safe to emit immediately after
      const sock = await connectSocket()
      if (!sock) return

      // Join personal room — socket is guaranteed connected at this point
      sock.emit('joinUserRoom', userEmail)

      // Attach real-time listeners
      sock.on('newNotification', notification => {
        setNotifications(prev => [notification, ...prev.filter(n => n._id !== notification._id)])
      })
      sock.on('notificationCountUpdated', count => {
        setUnreadCount(count)
      })
    }

    fetchInitialData()
    initSocket()

    return () => {
      const sock = getSocket()
      if (sock) {
        sock.off('newNotification')
        sock.off('notificationCountUpdated')
      }
    }
  }, [userEmail])

  useEffect(() => {
    const handleClickOutside = event => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleNotificationClick = async notification => {
    if (!notification.isRead) {
      try {
        await apiFetch(`/api/notifications/${notification._id}/read`, {
          method: 'PUT',
          headers: { 'user-email': userEmail },
        })
        setNotifications(prev =>
          prev.map(n => (n._id === notification._id ? { ...n, isRead: true } : n))
        )
      } catch (error) {
        console.error('Failed to mark read', error)
      }
    }
    setIsOpen(false)
  }

  const handleMarkAllRead = async () => {
    try {
      await apiFetch(`/api/notifications/read-all`, {
        method: 'PUT',
        headers: { 'user-email': userEmail },
      })
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
      setUnreadCount(0)
    } catch (error) {
      console.error('Failed to mark all read', error)
    }
  }

  const handleClearAll = async () => {
    try {
      await apiFetch(`/api/notifications/archive`, {
        method: 'PUT',
        headers: { 'user-email': userEmail },
      })
      setNotifications([])
      setUnreadCount(0)
      setIsOpen(false)
    } catch (error) {
      console.error('Failed to archive notifications', error)
    }
  }

  if (!userEmail) return null

  return (
    <div className="relative" ref={dropdownRef} style={{ zIndex: 'var(--z-dropdown)' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
        className="icon-btn relative"
      >
        <Bell size={16} aria-hidden="true" />
        {unreadCount > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 flex items-center justify-center text-white font-bold text-[9px] bg-red-500 rounded-full"
            style={{ width: '16px', height: '16px', lineHeight: 1 }}
            aria-hidden="true"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <NotificationDropdown
          notifications={notifications}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onMarkAllRead={handleMarkAllRead}
          onClearAll={handleClearAll}
          onNotificationClick={handleNotificationClick}
          loading={loading}
        />
      )}
    </div>
  )
}

export default NotificationBell
