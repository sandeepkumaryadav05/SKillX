import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import LoadingSpinner from '../components/LoadingSpinner';

import { apiFetch } from '../api/apiClient';
import { useAuth } from '../context/AuthContext';

const GigDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()

  const { user: firebaseUser } = useAuth();
  const userEmail = firebaseUser?.email;

  const [gig, setGig] = useState(null)
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingApps, setLoadingApps] = useState(false)
  const [applyMessage, setApplyMessage] = useState('')
  const [error, setError] = useState(null)
  const [info, setInfo] = useState(null)

  const isOwner = gig && userEmail && gig.postedBy === userEmail

  const fetchGig = async () => {
    try {
      setLoading(true)
      const res = await apiFetch(`/api/gigs/${id}`)
      if (!res.ok) throw new Error('Failed to fetch gig')
      const data = await res.json()
      setGig(data)
    } catch (err) {
      console.error(err)
      setError('Could not load gig details.')
    } finally {
      setLoading(false)
    }
  }

  const fetchApplications = async () => {
    if (!isOwner) return
    try {
      setLoadingApps(true)
      const res = await apiFetch(
        `/api/gig-applications?gigId=${id}`
      )
      if (!res.ok) throw new Error('Failed to fetch applications')
      const data = await res.json()
      setApplications(data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingApps(false)
    }
  }

  useEffect(() => {
    fetchGig()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  // once gig is loaded, if user is owner, load applications
  useEffect(() => {
    if (isOwner) {
      fetchApplications()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOwner])

  const handleDelete = async () => {
    try {
      const res = await apiFetch(`/api/gigs/${id}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Failed to delete gig')
      navigate('/gig-list')
    } catch (err) {
      console.error(err)
      alert('Could not delete gig. Please try again.')
    }
  }

  const handleApply = async () => {
    if (!userEmail) {
      alert('Please sign in to apply for this gig.')
      return
    }

    try {
      setError(null)
      setInfo(null)
      const res = await apiFetch(`/api/gig-applications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gigId: id,
          applicantEmail: userEmail,
          message: applyMessage,
        }),
      })
      if (!res.ok) throw new Error('Failed to send application')
      setInfo('Your request has been sent to the gig owner ✅')
      setApplyMessage('')
    } catch (err) {
      console.error(err)
      setError('Could not send application. Please try again.')
    }
  }

  const handleUpdateApplication = async (appId, newStatus) => {
    try {
      const res = await apiFetch(
        `/api/gig-applications/${appId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus }),
        }
      )
      if (!res.ok) throw new Error('Failed to update application')
      const updated = await res.json()
      setApplications((prev) =>
        prev.map((a) => (a._id === updated._id ? updated : a))
      )
    } catch (err) {
      console.error(err)
      alert('Could not update request. Please try again.')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-card)] flex items-center justify-center px-4">
        <LoadingSpinner message="Fetching your data…" />
      </div>
    )
  }

  if (!gig) {
    return (
      <div className="min-h-screen bg-[var(--bg-card)] flex items-center justify-center px-4">
        <p className="text-sm text-gray-600">Gig not found.</p>
      </div>
    )
  }

  const skills = Array.isArray(gig.skills)
    ? gig.skills.map((s) => String(s).trim()).filter(Boolean)
    : typeof gig.skills === 'string'
      ? gig.skills.split(',').map((s) => s.trim()).filter(Boolean)
      : []

  return (
    <main role="main" aria-label="Gig Details" className="min-h-screen bg-[var(--bg-card)] px-4 py-10 flex justify-center">
      <div className="w-full max-w-3xl space-y-6">
        <button
          onClick={() => navigate(-1)}
          className="text-sm text-gray-600 hover:underline mb-2"
        >
          ← Back to Gigs
        </button>

        {error && (
          <div className="text-sm bg-red-100 text-red-800 px-4 py-2 rounded-lg">
            {error}
          </div>
        )}
        {info && (
          <div className="text-sm bg-green-100 text-green-800 px-4 py-2 rounded-lg">
            {info}
          </div>
        )}

        {/* Gig Card */}
        <div className="bg-[var(--bg-card)] rounded-2xl shadow-md p-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-1">
            {gig.title}
          </h1>
          <p className="text-xs text-indigo-600 font-medium mb-3">
            {gig.category} • {gig.type}
          </p>

          {/* Skills */}
          <div className="flex flex-wrap gap-2 mb-4">
            {skills.map((skill, idx) => (
              <span
                key={idx}
                className="inline-flex items-center px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-xs"
              >
                {skill}
              </span>
            ))}
          </div>

          <p className="text-sm text-gray-700 mb-4 whitespace-pre-line">
            {gig.description}
          </p>

          <div className="text-sm text-gray-700 space-y-1 mb-4">
            <p>
              <span className="font-medium">Budget:</span> ₹{gig.budget}
            </p>
            <p>
              <span className="font-medium">Duration:</span>{' '}
              {gig.duration}
            </p>
            <p>
              <span className="font-medium">Location:</span>{' '}
              {gig.location}
            </p>
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              Posted by: {gig.postedBy || 'Unknown'}
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center justify-between gap-3 mt-4 border-t pt-3">
            {isOwner ? (
              <div className="flex gap-3">
                <span className="text-xs text-[var(--text-secondary)] self-center">
                  You are the owner of this gig.
                </span>
                <button
                  onClick={handleDelete}
                  className="text-sm bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition"
                >
                  Delete Gig
                </button>
              </div>
            ) : (
              <div className="w-full">
                <p className="text-sm text-gray-700 mb-2">
                  Interested in this gig? Send a short message to the owner.
                </p>
                <textarea
                  value={applyMessage}
                  onChange={(e) => setApplyMessage(e.target.value)}
                  rows={3}
                  className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-2"
                  placeholder="Hi, I would like to work on this gig..."
                />
                <button
                  onClick={handleApply}
                  className="text-sm bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
                >
                  Send Request
                </button>
              </div>
            )}
          </div>
        </div>

        {/* OWNER: see all requests with Accept / Reject */}
        {isOwner && (
          <div className="bg-[var(--bg-card)] rounded-2xl shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">
              Requests for this Gig
            </h2>
            {loadingApps ? (
              <LoadingSpinner message="Fetching your data…" />
            ) : applications.length === 0 ? (
              <p className="text-sm text-gray-600">
                No one has requested to work on this gig yet.
              </p>
            ) : (
              <div className="space-y-3">
                {applications.map((app) => (
                  <div
                    key={app._id}
                    className="border border-[var(--border-subtle)] rounded-xl p-3 text-sm"
                  >
                    <p className="text-gray-800">
                      <span className="font-medium">From: </span>
                      {app.applicantEmail}
                    </p>
                    {app.message && (
                      <p className="text-gray-600 mt-1">
                        {app.message}
                      </p>
                    )}
                    <p className="text-xs text-[var(--text-secondary)] mt-1">
                      Status:{' '}
                      <span
                        className={
                          app.status === 'accepted'
                            ? 'text-green-600 font-medium'
                            : app.status === 'rejected'
                            ? 'text-red-600 font-medium'
                            : 'text-yellow-600 font-medium'
                        }
                      >
                        {app.status}
                      </span>
                    </p>

                    {app.status === 'pending' && (
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() =>
                            handleUpdateApplication(
                              app._id,
                              'accepted'
                            )
                          }
                          className="px-3 py-1 text-xs rounded-lg bg-green-600 text-white hover:bg-green-700 transition"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() =>
                            handleUpdateApplication(
                              app._id,
                              'rejected'
                            )
                          }
                          className="px-3 py-1 text-xs rounded-lg bg-red-500 text-white hover:bg-red-600 transition"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  )
}

export default GigDetails
