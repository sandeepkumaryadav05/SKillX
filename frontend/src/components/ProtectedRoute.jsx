import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth()

  // Show nothing while Firebase auth state is resolving
  if (loading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: '60vh', color: 'var(--text-muted)', fontSize: 13,
      }}>
        <i className="ti ti-loader animate-spin" style={{ marginRight: 8 }} />
        Verifying authentication...
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/signin" replace />
  }

  return children
}

export default ProtectedRoute
