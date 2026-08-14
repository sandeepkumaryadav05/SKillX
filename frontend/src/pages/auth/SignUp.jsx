// src/pages/auth/SignUp.jsx
import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth'
import { auth } from '../../firebase/firebaseConfig'
import { API_BASE_URL } from '../../config/api.js'

const SignUp = () => {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        form.email,
        form.password
      )
      const user = userCredential.user

      if (form.name) {
        await updateProfile(user, { displayName: form.name })
      }

      // Create MongoDB profile — POST /api/profile is exempt from auth middleware
      try {
        await fetch(`${API_BASE_URL}/api/profile`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: form.email,
            name: form.name || form.email,
          }),
        })
      } catch (err) {
        console.error('Profile API error (non-blocking):', err)
      }

      // AuthContext's onAuthStateChanged listener will automatically pick up the new user
      navigate('/dashboard')
    } catch (error) {
      console.error('Sign up error:', error)
      let message = 'Failed to sign up. Please try again.'

      if (error.code === 'auth/email-already-in-use') {
        message = 'This email is already in use.'
      } else if (error.code === 'auth/weak-password') {
        message = 'Password should be at least 6 characters.'
      } else if (error.code === 'auth/invalid-email') {
        message = 'Invalid email format.'
      } else if (error.code === 'auth/operation-not-allowed') {
        message = 'Email/Password sign-in is not enabled in Firebase Console.'
      } else {
        message = error.message || 'Failed to sign up. Please try again.'
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
        <div style={{ position: 'absolute', top: -50, right: -50, width: 200, height: 200, background: 'var(--accent)', filter: 'blur(100px)', opacity: 0.15, pointerEvents: 'none' }} />

        <div style={{ textAlign: 'center', marginBottom: 28, position: 'relative' }}>
          <h1 className="text-h1" style={{ marginBottom: 8 }}>Create Account</h1>
          <p className="text-caption">
            Join SkillX to start exchanging skills and posting gigs.
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
            <label className="input-label">Name</label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              className="input"
              placeholder="Your name"
            />
          </div>

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
              placeholder="At least 6 characters"
            />
          </div>

          <div>
            <label className="input-label">Confirm Password</label>
            <input
              type="password"
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={handleChange}
              required
              className="input"
              placeholder="Re-enter password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
            style={{ width: '100%', justifyContent: 'center', marginTop: 8, padding: '10px' }}
          >
            {loading ? <><i className="ti ti-loader animate-spin" /> Creating account...</> : 'Sign Up'}
          </button>
        </form>

        <p className="text-caption" style={{ marginTop: 24, textAlign: 'center' }}>
          Already have an account?{' '}
          <Link to="/signin" style={{ color: 'var(--accent-light)', fontWeight: 500, textDecoration: 'none' }}>
            Sign In
          </Link>
        </p>
      </div>
    </div>
  )
}

export default SignUp
