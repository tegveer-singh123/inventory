import axios from 'axios'

const BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

export const api = axios.create({
  baseURL: BASE,
  headers: { 'Content-Type': 'application/json' },
})

// Attach stored token on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers['Authorization'] = `Bearer ${token}`
  return config
})

// Global response error interceptor — redirect to /login on 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      // Only redirect if not already on login page
      if (!window.location.pathname.includes('/login')) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        window.location.href = '/login'
      }
    }
    return Promise.reject(err)
  }
)

/**
 * Extract a clean, human-readable error message from an axios error.
 * Handles: FastAPI validation errors (422), domain errors (400/404/409),
 * auth errors (401), network failures, and unexpected shapes.
 */
export function errMsg(error) {
  if (!error) return 'An unexpected error occurred'

  // Network / no response
  if (!error.response) {
    if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
      return 'Cannot reach the server — check your connection or try again'
    }
    return error.message || 'No response from server'
  }

  const { status, data } = error.response

  // FastAPI validation errors (422) — join all field messages
  if (status === 422 && Array.isArray(data?.detail)) {
    const messages = data.detail.map((e) => {
      const field = e.loc?.slice(-1)[0] ?? 'field'
      return `${field}: ${e.msg}`
    })
    return messages.join(' · ')
  }

  // Standard FastAPI error with detail string
  if (typeof data?.detail === 'string') return data.detail

  // HTTP status fallbacks
  const fallbacks = {
    400: 'Bad request — check the values you entered',
    401: 'Not authenticated — please log in',
    403: 'You do not have permission to perform this action',
    404: 'The requested resource was not found',
    409: 'Conflict — a record with these details already exists',
    500: 'Internal server error — please try again later',
    503: 'Service unavailable — the server is starting up',
  }

  return fallbacks[status] || `Unexpected error (HTTP ${status})`
}
