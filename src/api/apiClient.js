const defaultUrl = (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1')
  ? window.location.origin
  : 'http://localhost:5000';

const rawUrl = (import.meta.env.VITE_API_URL || defaultUrl).trim().replace(/\/+$/, '');
let normalizedUrl = rawUrl;
if (!/^https?:\/\//i.test(normalizedUrl)) {
  normalizedUrl = `https://${normalizedUrl}`;
}
normalizedUrl = normalizedUrl.replace(/\/api\/?$/i, '');

export const SERVER_URL = normalizedUrl;
export const BASE_URL = `${SERVER_URL}/api`;

export const apiClient = {
  async get(endpoint) {
    try {
      const response = await fetch(`${BASE_URL}${endpoint}`);
      if (!response.ok) throw new Error(`HTTP Error ${response.status}`);
      return await response.json();
    } catch (error) {
      console.warn(`API GET ${endpoint} fallback:`, error);
      throw error;
    }
  },

  async post(endpoint, body) {
    try {
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (!response.ok) {
        const errorJson = await response.json().catch(() => null);
        if (errorJson) return errorJson;
        throw new Error(`HTTP Error ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.warn(`API POST ${endpoint} fallback:`, error);
      throw error;
    }
  },

  async put(endpoint, body) {
    try {
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (!response.ok) throw new Error(`HTTP Error ${response.status}`);
      return await response.json();
    } catch (error) {
      console.warn(`API PUT ${endpoint} fallback:`, error);
      throw error;
    }
  },

  async delete(endpoint) {
    try {
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error(`HTTP Error ${response.status}`);
      return await response.json();
    } catch (error) {
      console.warn(`API DELETE ${endpoint} fallback:`, error);
      throw error;
    }
  }
};
