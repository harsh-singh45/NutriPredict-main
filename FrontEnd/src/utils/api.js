// Central fetch wrapper for talking to the NutriPredict API.
// Base URL comes from Vite env (.env: VITE_API_BASE_URL), falling back to
// the local dev default so the app still works if that var isn't set.
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

export class ApiError extends Error {
  constructor(message, status, details) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

/**
 * Turns a FastAPI error body into a single readable message.
 * FastAPI validation errors come back as { detail: [{ msg, loc, ... }, ...] };
 * everything else (401/404/409/etc.) comes back as { detail: "some string" }.
 */
function extractErrorMessage(data, status) {
  if (!data || !data.detail) return `Request failed (${status})`;
  if (Array.isArray(data.detail)) {
    return data.detail.map((d) => d.msg || JSON.stringify(d)).join(', ');
  }
  return data.detail;
}

/**
 * @param {string} path - e.g. '/auth/login' (appended to API_BASE_URL)
 * @param {object} [options]
 * @param {string} [options.method]
 * @param {object} [options.body] - JSON-serializable request body
 * @param {string} [options.token] - bearer token to attach, if any
 */
export async function apiRequest(path, { method = 'GET', body, token } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (networkError) {
    throw new ApiError(
      'Could not reach the server. Is the API running?',
      0,
      networkError
    );
  }

  if (response.status === 204) return null;

  let data = null;
  try {
    data = await response.json();
  } catch {
    // No JSON body (shouldn't normally happen outside 204) — leave data null.
  }

  if (!response.ok) {
    throw new ApiError(extractErrorMessage(data, response.status), response.status, data);
  }

  return data;
}
