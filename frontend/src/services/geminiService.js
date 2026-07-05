import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * geminiService.js — Gemini AI Streaming Service
 *
 * This file is responsible for ONE thing: talking to the Google Gemini API.
 *
 * Why separate this from GeminiContext?
 *   GeminiContext's job is to manage STATE (chat sessions, active chat, etc.).
 *   This file's job is to make the AI API call and stream back the result.
 *   By separating them, each file is easier to read and test independently.
 *
 * Enhancements in this version:
 *   1. Context truncation — only the last 20 messages are sent (faster + cheaper)
 *   2. Stop generation  — AbortController lets the user cancel mid-stream
 */

// ─── Context Truncation ───────────────────────────────────────────────────────
// Problem: If a chat has 100 messages, sending all 100 every request is slow
// and wastes API tokens (= costs money). Fix: only send the most recent N messages.
// The full history stays visible in the UI — the AI just "remembers" the recent ones.
const MAX_HISTORY_MESSAGES = 20;

// ─── Stop Generation ──────────────────────────────────────────────────────────
// We store the AbortController at the module level so stopGeneration() can reach it.
let currentAbortController = null;

/**
 * Stops the currently in-progress AI stream.
 * Called when the user clicks the "Stop ⬛" button.
 * Safe to call even when nothing is running (no-op in that case).
 */
export function stopGeneration() {
  if (currentAbortController) {
    currentAbortController.abort();
    currentAbortController = null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────

/**
 * Converts our internal message format to the format Google's SDK requires.
 *
 * Our format:  { role: 'user' | 'model', text: '...', imageBase64: '...' }
 * Gemini format: { role: 'user' | 'model', parts: [{ text }, { inlineData }] }
 *
 * @param {Array} messages - Our internal message array
 * @returns {Array} Gemini-formatted history array
 */
function formatHistoryForGemini(messages) {
  return messages.map((message) => {
    const parts = [{ text: message.text || ' ' }];

    if (message.imageBase64) {
      // Our format: "data:image/png;base64,XXX|filename.png" — split on '|' to get the data URL
      const rawData = message.imageBase64.split('|')[0];
      const mimeTypeMatch = rawData.match(/^data:([a-zA-Z0-9/+-]+);base64,/);
      const mimeType = mimeTypeMatch ? mimeTypeMatch[1] : 'image/jpeg';
      const base64Data = rawData.includes('base64,') ? rawData.split('base64,')[1] : rawData;
      parts.push({ inlineData: { data: base64Data, mimeType } });
    }

    return { role: message.role, parts };
  });
}

/**
 * Builds a user-friendly error message from a Gemini API error.
 * Shows clear guidance for known issues rather than a raw error string.
 *
 * @param {Error} error
 * @returns {string} Markdown-formatted message to display in the chat
 */
function buildErrorMessage(error) {
  // User deliberately stopped the generation — show a quiet italic note
  if (error?.name === 'AbortError') {
    return '_Generation stopped._';
  }

  const msg = error?.message || '';

  if (msg.includes('503') || msg.includes('high demand')) {
    return '**Model Overloaded:** The AI is experiencing high demand. Please wait and try again. ⏳';
  }
  if (msg.includes('API key not valid') || msg.includes('API_KEY_INVALID')) {
    return '**Configuration Error:** Your API key is invalid. Please check your settings.';
  }
  if (msg.includes('429') || msg.includes('Quota exceeded') || msg.includes('quota')) {
    return '**Rate Limit Exceeded:** You have reached the free usage quota. Please wait or check your billing plan. 🛑';
  }
  return `**Oops! Something went wrong:**\n\n\`${msg}\`\n\nPlease try again later.`;
}

/**
 * Sends a message to the Gemini API and streams the response back chunk by chunk.
 *
 * @param {object} options
 * @param {string}      options.modelId    - The Gemini model ID (e.g. 'gemini-2.5-flash')
 * @param {Array}       options.history    - Full chat history BEFORE the current user message
 * @param {string}      options.userText   - The text the user just sent
 * @param {object|null} options.attachment - Optional { base64, mimeType } file attachment
 * @param {Function}    options.onChunk    - Called with the accumulated text on each new chunk
 *
 * @returns {Promise<string>} The complete AI response text
 */
export async function streamAiResponse({ modelId, history, userText, attachment, onChunk }) {
  // Create a new AbortController for this request — used to cancel mid-stream
  currentAbortController = new AbortController();

  try {
    const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: modelId });

    // ── Truncate history before sending ───────────────────────────────────
    // Only send the last MAX_HISTORY_MESSAGES to the API. This is the key
    // optimization: reduces payload size, speeds up response, lowers token cost.
    const recentHistory = history.slice(-MAX_HISTORY_MESSAGES);
    const geminiHistory = formatHistoryForGemini(recentHistory);

    const chat = model.startChat({ history: geminiHistory });

    // Build the current user message parts (text + optional attachment)
    const userMessageParts = [{ text: userText || ' ' }];
    if (attachment) {
      userMessageParts.push({
        inlineData: {
          data: attachment.base64.split('base64,')[1],
          mimeType: attachment.mimeType,
        },
      });
    }

    // Stream the response — Gemini sends the reply in small chunks as it generates
    const result = await chat.sendMessageStream(userMessageParts);

    let fullText = '';
    for await (const chunk of result.stream) {
      // Check on every chunk if the user has clicked "Stop"
      if (currentAbortController?.signal.aborted) break;

      fullText += chunk.text();
      onChunk(fullText); // Update the UI with the latest accumulated text
    }

    currentAbortController = null;
    return fullText;

  } catch (error) {
    currentAbortController = null;
    console.error('Gemini API Error:', error);
    const errorText = buildErrorMessage(error);
    onChunk(errorText);
    return errorText;
  }
}
