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
 * Every function here follows the same pattern:
 *   1. Make a fetch() call to the backend
 *   2. Return the parsed JSON response on success
 *   3. Throw an error on failure (so the caller can handle it with try/catch)
 */

/** The root URL of our Spring Boot backend. Change this once here if it moves. */
const BASE_URL = 'http://localhost:8080';

/**
 * A small helper to build the Authorization header.
 * Every protected endpoint needs this, so we reuse it everywhere.
 *
 * @param {string} token - The JWT token from Redux store
 */
const authHeaders = (token) => ({
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json',
});

// ─── Chat Session Endpoints ───────────────────────────────────────────────────

/**
 * Get all chat sessions for the logged-in user.
 * @param {string} token
 * @returns {Promise<Array>} Array of chat objects from the backend
 */
export async function fetchChats(token) {
  const res = await fetch(`${BASE_URL}/api/chats`, {
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error(`Failed to fetch chats (status ${res.status})`);
  return res.json();
}

/**
 * Create a new chat session in the database.
 * @param {string} token
 * @param {string} title - The first few words of the user's message, used as the chat title
 * @returns {Promise<Object>} The newly created chat object (including its real database ID)
 */
export async function createChat(token, title) {
  const res = await fetch(`${BASE_URL}/api/chats`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ title }),
  });
  if (!res.ok) throw new Error(`Failed to create chat (status ${res.status})`);
  return res.json();
}

/**
 * Rename an existing chat session.
 * @param {string} token
 * @param {number} chatId - The database ID of the chat to rename
 * @param {string} newTitle
 */
export async function renameChat(token, chatId, newTitle) {
  const res = await fetch(`${BASE_URL}/api/chats/${chatId}`, {
    method: 'PUT',
    headers: authHeaders(token),
    body: JSON.stringify({ title: newTitle }),
  });
  if (!res.ok) throw new Error(`Failed to rename chat (status ${res.status})`);
}

/**
 * Permanently delete a chat session and all its messages.
 * @param {string} token
 * @param {number} chatId
 */
export async function deleteChat(token, chatId) {
  const res = await fetch(`${BASE_URL}/api/chats/${chatId}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error(`Failed to delete chat (status ${res.status})`);
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
  const res = await fetch(`${BASE_URL}/api/chats/${chatId}/messages`, {
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error(`Failed to fetch messages (status ${res.status})`);
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
  const res = await fetch(`${BASE_URL}/api/chats/${chatId}/messages`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ role, text, imageBase64 }),
  });
  if (!res.ok) throw new Error(`Failed to save message (status ${res.status})`);
}
