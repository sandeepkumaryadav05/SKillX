// src/pages/auth/SignIn.jsx
import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '../../firebase/firebaseConfig'
import { API_BASE_URL } from '../../config/api.js'

const SignIn = () => {
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      await signInWithEmailAndPassword(
        auth,
        form.email,
        form.password
      )

      // AuthContext's onAuthStateChanged listener will automatically pick up the new user
      navigate('/dashboard')
    } catch (error) {
      console.error('Sign in error:', error)
      let message = 'Failed to sign in. Please try again.'

      if (error.code === 'auth/user-not-found') {
        message = 'No user found with this email.'
      } else if (error.code === 'auth/wrong-password') {
        message = 'Incorrect password.'
      } else if (error.code === 'auth/invalid-email') {
        message = 'Invalid email format.'
      } else if (error.code === 'auth/invalid-credential') {
        message = 'Invalid email or password.'
      }

      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--bg)' }}>
      <div className="w-full max-w-md card-glass p-8 mt-16 relative overflow-hidden">
        {/* Glow effect */}
        <div style={{ position: 'absolute', top: -50, left: -50, width: 200, height: 200, background: 'var(--accent)', filter: 'blur(100px)', opacity: 0.15, pointerEvents: 'none' }} />

        <div style={{ textAlign: 'center', marginBottom: 28, position: 'relative' }}>
          <h1 className="text-h1" style={{ marginBottom: 8 }}>Welcome Back</h1>
          <p className="text-caption">
            Sign in to your SkillX account to continue.
          </p>
        </div>

        {error && (
          <div style={{ marginBottom: 24, padding: '12px 16px', background: 'var(--red-bg)', color: 'var(--red-text)', border: '0.5px solid var(--red)', borderRadius: 'var(--radius-md)', fontSize: 13, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
            <i className="ti ti-alert-circle" style={{ marginTop: 2 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16, position: 'relative' }}>
          <div>
            <label className="input-label">Email</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
              className="input"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="input-label">Password</label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              required
              className="input"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
            style={{ width: '100%', justifyContent: 'center', marginTop: 8, padding: '10px' }}
          >
            {loading ? <><i className="ti ti-loader animate-spin" /> Signing in...</> : 'Sign In'}
          </button>
        </form>

        <p className="text-caption" style={{ marginTop: 24, textAlign: 'center' }}>
          Don&apos;t have an account?{' '}
          <Link to="/signup" style={{ color: 'var(--accent-light)', fontWeight: 500, textDecoration: 'none' }}>
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  )
}

export default SignIn
