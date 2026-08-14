/**
 * Central API configuration.
 * Set VITE_API_URL in your .env to point at the backend.
 * - Local:      http://localhost:5000
 * - Production: https://your-render-app.onrender.com
 */
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
export const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
