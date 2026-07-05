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
 * The main export is `streamAiResponse`, which:
 *   1. Formats our chat history into the shape Gemini expects
 *   2. Sends the message as a streaming request
 *   3. Calls an `onChunk` callback with each new piece of text as it arrives
 *   4. Returns the full final text when the stream is done
 */

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
    // Every message has at least a text part
    const parts = [{ text: message.text || ' ' }];

    // If there's an attached image or file, add it as an inline data part
    if (message.imageBase64) {
      // Our imageBase64 format is: "data:image/png;base64,XXXXX|filename.png"
      // We only need the raw base64 data part (before the pipe '|')
      const rawData = message.imageBase64.split('|')[0];

      // Extract the MIME type (e.g. "image/png") from the data URL header
      const mimeTypeMatch = rawData.match(/^data:([a-zA-Z0-9/+-]+);base64,/);
      const mimeType = mimeTypeMatch ? mimeTypeMatch[1] : 'image/jpeg';

      // Extract only the raw base64 string (the part after "base64,")
      const base64Data = rawData.includes('base64,') ? rawData.split('base64,')[1] : rawData;

      parts.push({ inlineData: { data: base64Data, mimeType } });
    }

    return { role: message.role, parts };
  });
}

/**
 * Builds a user-friendly error message from a Gemini API error.
 *
 * Instead of showing a raw error to the user, we check for known issues
 * (quota exceeded, overloaded, etc.) and provide a clear, helpful message.
 *
 * @param {Error} error
 * @returns {string} A markdown-formatted message to display in the chat
 */
function buildErrorMessage(error) {
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
 * @param {string}   options.modelId        - The Gemini model ID (e.g. 'gemini-2.5-flash')
 * @param {Array}    options.history         - Chat history BEFORE the current user message
 * @param {string}   options.userText        - The text the user just sent
 * @param {object|null} options.attachment   - Optional { base64, mimeType } file attachment
 * @param {Function} options.onChunk         - Called with the full accumulated text on each new chunk
 *
 * @returns {Promise<string>} The complete AI response text
 */
export async function streamAiResponse({ modelId, history, userText, attachment, onChunk }) {
  try {
    // Initialize the Gemini SDK with our API key from the .env file
    const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: modelId });

    // Convert our message history to Gemini's expected format
    const geminiHistory = formatHistoryForGemini(history);

    // Start a chat session with the formatted history
    const chat = model.startChat({ history: geminiHistory });

    // Build the parts for the current user message
    // A "part" is either a text block or an image block
    const userMessageParts = [{ text: userText || ' ' }];
    if (attachment) {
      userMessageParts.push({
        inlineData: {
          data: attachment.base64.split('base64,')[1], // strip the data URL prefix
          mimeType: attachment.mimeType,
        },
      });
    }

    // Ask Gemini to stream the response (returns piece by piece, not all at once)
    const result = await chat.sendMessageStream(userMessageParts);

    // Build up the full response text as chunks arrive
    let fullText = '';
    for await (const chunk of result.stream) {
      fullText += chunk.text();
      // Notify the caller about the latest text so the UI can update in real time
      onChunk(fullText);
    }

    return fullText;

  } catch (error) {
    console.error('Gemini API Error:', error);
    // Build and return a friendly error message instead of crashing the app
    const errorText = buildErrorMessage(error);
    onChunk(errorText);
    return errorText;
  }
}
