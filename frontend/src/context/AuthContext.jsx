// AuthContext.jsx — Single source of truth for authentication state.
// Uses Firebase onAuthStateChanged to reactively track the current user.
// Provides: user (Firebase user), userProfile (MongoDB profile), loading, getIdToken()

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '../firebase/firebaseConfig'
import { API_BASE_URL } from '../config/api.js'

const AuthContext = createContext(null)

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)        // Firebase Auth user
  const [userProfile, setUserProfile] = useState(null) // MongoDB profile
  const [loading, setLoading] = useState(true)   // Initial auth check

  /**
   * Gets a fresh Firebase ID token for API requests.
   * Returns null if no user is signed in.
   */
  const getIdToken = useCallback(async () => {
    const currentUser = auth.currentUser
    if (!currentUser) return null
    try {
      return await currentUser.getIdToken()
    } catch (error) {
      console.error('Failed to get ID token:', error)
      return null
    }
  }, [])

  /**
   * Fetches the user's MongoDB profile using a verified token.
   */
  const fetchUserProfile = useCallback(async (firebaseUser) => {
    try {
      const token = await firebaseUser.getIdToken()
      const res = await fetch(`${API_BASE_URL}/api/profile/${firebaseUser.email}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const profile = await res.json()
        setUserProfile(profile)
        return profile
      }
    } catch (error) {
      console.error('Failed to fetch user profile:', error)
    }
    setUserProfile(null)
    return null
  }, [])

  /**
   * Refreshes the cached userProfile from the server.
   * Call this after profile updates to keep context in sync.
   */
  const refreshProfile = useCallback(async () => {
    if (auth.currentUser) {
      return fetchUserProfile(auth.currentUser)
    }
    return null
  }, [fetchUserProfile])

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser)
        await fetchUserProfile(firebaseUser)
      } else {
        setUser(null)
        setUserProfile(null)
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [fetchUserProfile])

  const value = {
    user,            // Firebase Auth user object (has .email, .uid, .displayName, etc.)
    userProfile,     // MongoDB UserProfile document (has .role, .skills, .stats, etc.)
    loading,         // true while initial auth state is resolving
    getIdToken,      // () => Promise<string|null> — fresh token for API calls
    refreshProfile,  // () => Promise — re-fetch MongoDB profile
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
