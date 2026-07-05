/**
 * api.js — Backend API Service
 *
 * This is the ONLY file in the project that makes HTTP requests to our Spring Boot backend.
 *
 * Why have a dedicated file like this?
 *   This is the "loose coupling" principle in action. If we ever need to:
 *     - Change the backend URL (e.g. deploy to production)
 *     - Change how authentication headers are sent
 *     - Switch from fetch() to axios
 *   ...we ONLY need to edit THIS file. No other file knows or cares about HTTP.
 *
 * Enhancements in this version:
 *   - Retry logic: failed requests are automatically retried up to 2 times
 *     with a 1-second delay, so brief backend restarts don't break the user experience.
 */

/** The root URL of our Spring Boot backend. Change this once here if it moves. */
const BASE_URL = 'http://localhost:8080';

/**
 * How many times to retry a failed request before giving up.
 * 2 retries = 3 total attempts.
 */
const MAX_RETRIES = 2;

/**
 * How long (in milliseconds) to wait between retry attempts.
 * 1000ms = 1 second.
 */
const RETRY_DELAY_MS = 1000;

/**
 * A small helper to pause execution for a given number of milliseconds.
 * Used between retry attempts so we don't hammer the server immediately.
 *
 * @param {number} ms - Milliseconds to wait
 */
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * A helper to build the Authorization header.
 * Every protected endpoint needs this, so we reuse it everywhere.
 *
 * @param {string} token - The JWT token from Redux store
 */
const authHeaders = (token) => ({
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json',
});

/**
 * Wrapper around fetch() that automatically retries on failure.
 *
 * Why this matters: If the backend (Spring Boot) is briefly restarting or the
 * network hiccups for a moment, without retry the user would see an error.
 * With retry, the request silently tries again and usually succeeds.
 *
 * @param {string} url     - The endpoint URL
 * @param {object} options - fetch() options (method, headers, body, etc.)
 * @param {number} retries - Remaining retry attempts (decrements with each call)
 * @returns {Promise<Response>} The successful Response object
 * @throws {Error} If all retry attempts are exhausted
 */
async function fetchWithRetry(url, options, retries = MAX_RETRIES) {
  try {
    const res = await fetch(url, options);

    // Treat non-2xx HTTP responses as errors so they trigger a retry
    if (!res.ok) {
      // For 4xx errors (bad request, unauthorized), don't retry — the problem is
      // with the request itself, not the server. Retrying would just fail again.
      if (res.status >= 400 && res.status < 500) {
        throw new Error(`HTTP ${res.status}: ${await res.text()}`);
      }
      throw new Error(`HTTP ${res.status}`);
    }

    return res;
  } catch (err) {
    if (retries > 0) {
      console.warn(`Request failed (${err.message}). Retrying in ${RETRY_DELAY_MS}ms... (${retries} attempts left)`);
      await wait(RETRY_DELAY_MS);
      return fetchWithRetry(url, options, retries - 1);
    }
    // No more retries — give up and let the caller handle the error
    throw err;
  }
}

// ─── Chat Session Endpoints ───────────────────────────────────────────────────

/**
 * Get all chat sessions for the logged-in user.
 * @param {string} token
 * @returns {Promise<Array>} Array of chat objects from the backend
 */
export async function fetchChats(token) {
  const res = await fetchWithRetry(`${BASE_URL}/api/chats`, {
    headers: authHeaders(token),
  });
  return res.json();
}

/**
 * Create a new chat session in the database.
 * @param {string} token
 * @param {string} title - The first few words of the user's message, used as the chat title
 * @returns {Promise<Object>} The newly created chat object (including its real database ID)
 */
export async function createChat(token, title) {
  const res = await fetchWithRetry(`${BASE_URL}/api/chats`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ title }),
  });
  return res.json();
}

/**
 * Rename an existing chat session.
 * @param {string} token
 * @param {number} chatId - The database ID of the chat to rename
 * @param {string} newTitle
 */
export async function renameChat(token, chatId, newTitle) {
  await fetchWithRetry(`${BASE_URL}/api/chats/${chatId}`, {
    method: 'PUT',
    headers: authHeaders(token),
    body: JSON.stringify({ title: newTitle }),
  });
}

/**
 * Permanently delete a chat session and all its messages.
 * @param {string} token
 * @param {number} chatId
 */
export async function deleteChat(token, chatId) {
  await fetchWithRetry(`${BASE_URL}/api/chats/${chatId}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });
}

// ─── Message Endpoints ────────────────────────────────────────────────────────

/**
 * Fetch all messages for a specific chat session.
 * Called when a user clicks on a chat in the sidebar for the first time.
 * @param {string} token
 * @param {number} chatId
 * @returns {Promise<Array>} Array of message objects from the backend
 */
export async function fetchMessages(token, chatId) {
  const res = await fetchWithRetry(`${BASE_URL}/api/chats/${chatId}/messages`, {
    headers: authHeaders(token),
  });
  return res.json();
}

/**
 * Save a single message (user or AI) to the database.
 * @param {string} token
 * @param {number} chatId
 * @param {'user' | 'model'} role
 * @param {string} text
 * @param {string | null} imageBase64 - Optional encoded image/file attachment
 */
export async function saveMessage(token, chatId, role, text, imageBase64 = null) {
  await fetchWithRetry(`${BASE_URL}/api/chats/${chatId}/messages`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ role, text, imageBase64 }),
  });
}
