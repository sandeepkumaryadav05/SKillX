import { apiFetch } from './apiClient';

/**
 * generateRoadmapViaAIProxy
 * Calls the dedicated AI proxy endpoint (POST /api/ai/roadmap).
 * The backend makes the Gemini API call using process.env.GEMINI_API_KEY —
 * no API key is ever sent to or stored in the frontend.
 * Auth token is attached automatically by apiFetch via Firebase.
 *
 * @param {string} goal - The learning goal to generate a roadmap for
 * @returns {Promise<{ goal: string, generatedRoadmap: object, totalWeeks: number }>}
 */
export const generateRoadmapViaAIProxy = async (goal) => {
  const response = await apiFetch('/api/ai/roadmap', {
    method: 'POST',
    body: JSON.stringify({ goal }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to generate roadmap');
  }

  return response.json();
};

export const generateRoadmapAPI = async (email, goal) => {
  const response = await apiFetch(`/api/roadmap/generate`, {
    method: 'POST',
    body: JSON.stringify({ email, goal }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to generate roadmap');
  }

  return await response.json();
};

export const saveRoadmapAPI = async (email, goal, generatedRoadmap) => {
  const response = await apiFetch(`/api/roadmap/save`, {
    method: 'POST',
    body: JSON.stringify({ email, goal, generatedRoadmap }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to save roadmap');
  }

  return await response.json();
};

export const fetchUserRoadmapsAPI = async (email) => {
  const response = await apiFetch(`/api/roadmap/user?email=${encodeURIComponent(email)}`);

  if (!response.ok) {
    throw new Error('Failed to fetch roadmaps');
  }

  return await response.json();
};

export const updateProgressAPI = async (id, weekIndex) => {
  const response = await apiFetch(`/api/roadmap/progress`, {
    method: 'PUT',
    body: JSON.stringify({ id, weekIndex }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to update progress');
  }

  return await response.json();
};

export const deleteRoadmapAPI = async (id) => {
  const response = await apiFetch(`/api/roadmap/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to delete roadmap');
  }

  return await response.json();
};
