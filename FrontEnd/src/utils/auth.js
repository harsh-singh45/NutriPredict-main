import { apiRequest, ApiError } from './api';

const STORAGE_KEY = 'nutripredict_auth'; // { token, user }

function readStoredAuth() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function persistAuth(authResponse) {
  const record = { token: authResponse.access_token, user: authResponse.user };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
  // 'storage' only fires in OTHER tabs by default — dispatch it manually so
  // components in this tab (e.g. the Navbar) update immediately too.
  window.dispatchEvent(new Event('storage'));
  return record.user;
}

/**
 * Create a new account. Does NOT log the user in — the account starts
 * unverified, so there's no session to store yet. Resolves with
 * { message, email }; the caller should route to the verify-email screen.
 * Throws ApiError (409 if the email is taken, 422 for validation issues).
 */
export async function signup(name, email, password) {
  return apiRequest('/auth/signup', { method: 'POST', body: { name, email, password } });
}

/**
 * Completes signup by checking the 6-digit code emailed to the user. Logs
 * them in on success (stores the session, same as login()). Throws
 * ApiError (400 for an invalid/expired/already-exhausted code).
 */
export async function verifyEmail(email, code) {
  const data = await apiRequest('/auth/verify-email', { method: 'POST', body: { email, code } });
  return persistAuth(data);
}

/** Requests a fresh verification code. Always resolves with a generic message. */
export async function resendVerification(email) {
  const data = await apiRequest('/auth/resend-verification', { method: 'POST', body: { email } });
  return data.message;
}

/**
 * Log in with email + password. Throws ApiError — 401 for bad credentials,
 * 403 if the account exists but hasn't been verified yet (check
 * `err.status === 403` to route to the verify-email screen instead of
 * just showing a generic error).
 */
export async function login(email, password) {
  const data = await apiRequest('/auth/login', { method: 'POST', body: { email, password } });
  return persistAuth(data);
}

export function logoutUser() {
  localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new Event('storage'));
}

/**
 * Requests a password reset email. Always resolves with the same generic
 * message whether or not the email is registered — don't use the response
 * to tell the user "no account found", that's the backend intentionally
 * not leaking who has an account.
 */
export async function forgotPassword(email) {
  const data = await apiRequest('/auth/forgot-password', { method: 'POST', body: { email } });
  return data.message;
}

/** Completes a password reset using the token from the emailed link. Throws ApiError (400 if invalid/expired). */
export async function resetPassword(token, newPassword) {
  const data = await apiRequest('/auth/reset-password', {
    method: 'POST',
    body: { token, new_password: newPassword },
  });
  return data.message;
}

/**
 * Changes the logged-in user's password. Requires the current password.
 * Throws ApiError (401 if current_password is wrong, 422 for a too-short
 * new password).
 */
export async function changePassword(currentPassword, newPassword) {
  const token = getToken();
  const data = await apiRequest('/auth/change-password', {
    method: 'POST',
    body: { current_password: currentPassword, new_password: newPassword },
    token,
  });
  return data.message;
}

/** The currently logged-in user's profile ({ id, name, email, created_at }), or null. */
export function getUser() {
  return readStoredAuth()?.user ?? null;
}

/** The current JWT, or null if not logged in. Pass to apiRequest's `token` option. */
export function getToken() {
  return readStoredAuth()?.token ?? null;
}

/**
 * Clears a stale/expired session and returns true if one was cleared.
 * Call this when a protected API request comes back 401 outside of the
 * login/signup forms themselves (those 401s just mean "wrong password",
 * not "your session expired").
 */
export function clearExpiredSession() {
  if (readStoredAuth()) {
    logoutUser();
    return true;
  }
  return false;
}

export { ApiError };
