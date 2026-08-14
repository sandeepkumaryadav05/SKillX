// apiClient.js — Centralized API client that attaches Firebase ID tokens to every request.
// Replaces raw fetch() calls throughout the app to ensure all API calls are authenticated.

import { auth } from '../firebase/firebaseConfig'
import { API_BASE_URL } from '../config/api.js'
import { toast } from 'sonner'

/**
 * Authenticated fetch wrapper.
 * Automatically attaches the Firebase ID token as an Authorization header.
 *
 * @param {string} endpoint - API path (e.g., '/api/gigs') or full URL
 * @param {object} options - Standard fetch options (method, body, headers, etc.)
 * @returns {Promise<Response>}
 */
export const apiFetch = async (endpoint, options = {}) => {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`

  // Get a fresh token from the current Firebase user
  const currentUser = auth.currentUser
  let token = null
  if (currentUser) {
    try {
      token = await currentUser.getIdToken()
    } catch (error) {
      console.error('Failed to get Firebase ID token:', error)
    }
  }

  const headers = {
    ...options.headers,
  }

  // Attach auth header if we have a token
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  // Auto-set Content-Type for JSON bodies (skip for FormData)
  if (options.body && !(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json'
  }

  const response = await fetch(url, {
    ...options,
    headers,
  })

  // Handle 401 — token expired or revoked
  if (response.status === 401) {
    console.warn('API returned 401 — user may need to re-authenticate')
    // Optionally: sign out and redirect
    // await auth.signOut()
    // window.location.href = '/signin'
  }

  // Handle 429 — rate limit exceeded
  if (response.status === 429) {
    const isRecommendationsRoute = response.url?.includes('/skill-exchange/recommendations')
    if (!isRecommendationsRoute) {
      toast.warning("You're going too fast. Please wait a moment and try again.")
    }
  }

  return response
}

/**
 * Convenience: GET request
 */
export const apiGet = (endpoint, options = {}) =>
  apiFetch(endpoint, { method: 'GET', ...options })

/**
 * Convenience: POST request with JSON body
 */
export const apiPost = (endpoint, body, options = {}) =>
  apiFetch(endpoint, {
    method: 'POST',
    body: body instanceof FormData ? body : JSON.stringify(body),
    ...options,
  })

/**
 * Convenience: PUT request with JSON body
 */
export const apiPut = (endpoint, body, options = {}) =>
  apiFetch(endpoint, {
    method: 'PUT',
    body: JSON.stringify(body),
    ...options,
  })

/**
 * Convenience: PATCH request with JSON body
 */
export const apiPatch = (endpoint, body, options = {}) =>
  apiFetch(endpoint, {
    method: 'PATCH',
    body: JSON.stringify(body),
    ...options,
  })

/**
 * Convenience: DELETE request
 */
export const apiDelete = (endpoint, options = {}) =>
  apiFetch(endpoint, { method: 'DELETE', ...options })
