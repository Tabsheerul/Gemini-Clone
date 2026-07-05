import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { DEFAULT_MODEL_ID } from '../constants/models';
import * as api from '../services/api';
import { streamAiResponse, stopGeneration } from '../services/geminiService';

// Key used to store/retrieve chat sessions from the browser's localStorage.
// Using a constant avoids typos when we read/write the same key.
const CHATS_CACHE_KEY = 'gemini_cached_chats';

// ─────────────────────────────────────────────────────────────────────────────
// GeminiContext
//
// This is the global "brain" of the chat app. It holds the state that many
// different components need to share:
//
//   chatSessions  — the list of past chats shown in the sidebar
//   activeChat    — the chat currently open on screen (null = home/welcome screen)
//   isThinking    — true while we are waiting for the AI's first response chunk
//   selectedModel — which Gemini model the user has chosen in the dropdown
//
// Every function here is wrapped in `useCallback` so that child components
// that receive these functions as props don't re-render unnecessarily.
// ─────────────────────────────────────────────────────────────────────────────

const GeminiContext = createContext(null);

export function GeminiProvider({ children }) {
  // Read the auth token from Redux so we can attach it to every API request.
  // When the user logs in/out, this value updates and triggers a re-fetch.
  const token = useSelector((state) => state.auth.token);

  // Each session has the shape: { id, title, messages: [{id, role, text, timestamp}] }
  const [chatSessions, setChatSessions] = useState([]);

  // The currently open chat. null means the welcome/home screen is showing.
  const [activeChat, setActiveChat] = useState(null);

  // True while the AI has not yet sent its first character (shows the loading spinner)
  const [isThinking, setIsThinking] = useState(false);

  // The model ID currently selected (e.g. 'gemini-2.5-flash')
  const [selectedModel, setSelectedModel] = useState(DEFAULT_MODEL_ID);

  // ── Load chats whenever the user logs in or out ───────────────────────────
  // When `token` changes (login/logout), we either fetch the user's chats or clear them.
  useEffect(() => {
    const loadChats = async () => {
      if (!token) {
        // User logged out — clear sidebar, cache, and go back to the home screen
        setChatSessions([]);
        setActiveChat(null);
        localStorage.removeItem(CHATS_CACHE_KEY);
        return;
      }

      // ── Cache: show previously saved chats instantly while we fetch fresh data ──
      // This makes the sidebar appear immediately on page reload (no blank flash).
      const cached = localStorage.getItem(CHATS_CACHE_KEY);
      if (cached) {
        setChatSessions(JSON.parse(cached));
      }

      try {
        const data = await api.fetchChats(token);
        // Map backend entities to the minimal shape our frontend needs
        const formatted = data.map((c) => ({ id: c.id, title: c.title, messages: [] }));
        setChatSessions(formatted);
        // Save fresh data to cache for next page load
        localStorage.setItem(CHATS_CACHE_KEY, JSON.stringify(formatted));
      } catch (e) {
        console.error('Failed to load chats from backend:', e);
      }
    };

    loadChats();
  }, [token]);

  // ── Start a brand new chat ────────────────────────────────────────────────
  // Called by the "New chat" button. Simply clears the active chat,
  // which causes the home/welcome screen to appear.
  const startNewChat = useCallback(() => {
    setActiveChat(null);
  }, []);

  // ── Open an existing chat from the sidebar ────────────────────────────────
  // Lazy-loads the messages the first time a chat is opened (messages array is empty).
  const openChat = useCallback(async (sessionId) => {
    const session = chatSessions.find((s) => s.id === sessionId);
    if (!session) return;

    // Only fetch messages if they haven't been loaded yet
    if (session.messages.length === 0 && token) {
      try {
        const msgs = await api.fetchMessages(token, sessionId);
        const loadedMessages = msgs.map((m) => ({
          id: m.id,
          role: m.role,
          text: m.text,
          timestamp: m.timestamp,
        }));

        // Update the session in the sidebar list with the loaded messages
        const updatedSession = { ...session, messages: loadedMessages };
        setChatSessions((prev) =>
          prev.map((s) => (s.id === sessionId ? updatedSession : s))
        );
        setActiveChat(updatedSession);
        return;
      } catch (e) {
        console.error('Failed to load messages for chat:', e);
      }
    }

    setActiveChat({ ...session });
  }, [chatSessions, token]);

  // ── Send a message ────────────────────────────────────────────────────────
  // This is the most complex function. It:
  //   1. Creates a new chat session if none is open
  //   2. Adds the user's message to the screen instantly
  //   3. Calls the Gemini AI service and streams the response
  //   4. Saves both messages to the backend database
  const sendMessage = useCallback(async (text, attachment = null) => {
    // Don't do anything if the message is completely empty
    if (!text.trim() && !attachment) return;

    // Our image/file is stored as a single encoded string: "base64data|filename"
    // This format lets us pass one string to the backend while keeping both pieces of info
    const encodedAttachment = attachment
      ? `${attachment.base64}|${attachment.file.name}`
      : null;

    // Build the user message object in the shape our app uses internally
    const userMessage = {
      id: `msg-${Date.now()}-user`,
      role: 'user',
      text: text.trim(),
      imageBase64: encodedAttachment,
      timestamp: new Date(),
    };

    // ── Step 1: Ensure there's an active chat session ──
    let currentSession = activeChat;
    if (!currentSession) {
      // No chat is open — create a new one. The title is the first 40 characters
      // of the user's message so the sidebar label is meaningful.
      const titleText = text.trim() || attachment?.file.name || 'Image Query';
      const title = titleText.slice(0, 40) + (titleText.length > 40 ? '…' : '');

      // Start with a temporary ID; we'll replace it with the real database ID below
      const newSession = { id: `chat-${Date.now()}`, title, messages: [] };

      if (token) {
        try {
          const created = await api.createChat(token, title);
          newSession.id = created.id; // Replace temporary ID with the real database ID
        } catch (e) {
          console.error('Failed to create chat on backend:', e);
        }
      }

      currentSession = newSession;
      // Add the new session to the top of the sidebar list
      setChatSessions((prev) => [newSession, ...prev]);
    }

    // ── Step 2: Save user message to the database ──
    // We only save if the session has a real backend ID (not a temporary "chat-xxxxx" ID)
    const hasRealId = !String(currentSession.id).startsWith('chat-');
    if (token && hasRealId) {
      try {
        await api.saveMessage(token, currentSession.id, 'user', text.trim(), encodedAttachment);
      } catch (e) {
        console.error('Failed to save user message:', e);
      }
    }

    // ── Step 3: Update the screen with the user's message immediately ──
    // We don't wait for the AI — the user's message appears right away
    const messagesWithUser = [...currentSession.messages, userMessage];
    const sessionWithUser = { ...currentSession, messages: messagesWithUser };
    setActiveChat(sessionWithUser);

    // ── Step 4: Call the Gemini AI API (streaming) ──
    // We create a placeholder empty AI message so the chat shows it immediately
    const aiMessageId = `msg-${Date.now()}-ai`;
    const emptyAiMessage = { id: aiMessageId, role: 'model', text: '', timestamp: new Date() };

    setIsThinking(true);

    // Add the empty AI message bubble to the screen while we wait for the first chunk
    setActiveChat((prev) => {
      if (!prev) return prev;
      return { ...prev, messages: [...prev.messages, emptyAiMessage] };
    });

    // Call the Gemini service. It streams chunks back and calls our onChunk function
    // each time a new piece of text arrives.
    const finalAiText = await streamAiResponse({
      modelId: selectedModel,
      history: currentSession.messages,     // history BEFORE the user's new message
      userText: text.trim(),
      attachment,
      onChunk: (accumulatedText) => {
        // Turn off the thinking spinner as soon as we have the first chunk
        setIsThinking(false);

        // Update the AI message bubble in real-time with the latest accumulated text
        setActiveChat((prev) => {
          if (!prev) return prev;
          const updatedMessages = prev.messages.map((m) =>
            m.id === aiMessageId ? { ...m, text: accumulatedText } : m
          );
          return { ...prev, messages: updatedMessages };
        });
      },
    });

    // Make sure the thinking spinner is off (in case of an error with no chunks)
    setIsThinking(false);

    // ── Step 5: Save the final, complete AI response to the database ──
    if (token && hasRealId) {
      try {
        await api.saveMessage(token, currentSession.id, 'model', finalAiText);
      } catch (e) {
        console.error('Failed to save AI message:', e);
      }
    }

    // ── Step 6: Update the sidebar so it has both messages ──
    setChatSessions((prev) => {
      const updated = prev.map((s) => {
        if (s.id !== currentSession.id) return s;
        return {
          ...s,
          messages: [
            ...messagesWithUser,
            { role: 'model', text: finalAiText, timestamp: new Date() },
          ],
        };
      });
      // Persist the updated sessions list so the sidebar loads instantly on refresh
      localStorage.setItem(
        CHATS_CACHE_KEY,
        JSON.stringify(updated.map((s) => ({ id: s.id, title: s.title, messages: [] })))
      );
      return updated;
    });
  }, [activeChat, selectedModel, chatSessions, token]);

  // ── Rename a chat ─────────────────────────────────────────────────────────
  const renameChat = useCallback(async (chatId, newTitle) => {
    if (!token) return;
    try {
      await api.renameChat(token, chatId, newTitle);
      // Update the local state so the sidebar reflects the new name instantly
      setChatSessions((prev) =>
        prev.map((s) => (s.id === chatId ? { ...s, title: newTitle } : s))
      );
      if (activeChat?.id === chatId) {
        setActiveChat((prev) => ({ ...prev, title: newTitle }));
      }
    } catch (e) {
      console.error('Failed to rename chat:', e);
    }
  }, [token, activeChat]);

  // ── Delete a chat ─────────────────────────────────────────────────────────
  const deleteChat = useCallback(async (chatId) => {
    if (!token) return;
    try {
      await api.deleteChat(token, chatId);
      // Remove the session from the sidebar
      setChatSessions((prev) => prev.filter((s) => s.id !== chatId));
      // If the deleted chat was open, go back to the home screen
      if (activeChat?.id === chatId) {
        setActiveChat(null);
      }
    } catch (e) {
      console.error('Failed to delete chat:', e);
    }
  }, [token, activeChat]);

  // Provide the state and functions to all children via context
  return (
    <GeminiContext.Provider
      value={{
        chatSessions,
        activeChat,
        isThinking,
        selectedModel,
        setSelectedModel,
        startNewChat,
        openChat,
        sendMessage,
        stopGeneration,  // exposed so PromptInput can wire up the Stop button
        renameChat,
        deleteChat,
      }}
    >
      {children}
    </GeminiContext.Provider>
  );
}

/**
 * useGemini — Convenience hook
 *
 * Use this anywhere instead of importing GeminiContext and calling useContext manually.
 * Throws a helpful error if you accidentally use it outside of <GeminiProvider>.
 */
export function useGemini() {
  const ctx = useContext(GeminiContext);
  if (!ctx) throw new Error('useGemini must be used inside <GeminiProvider>');
  return ctx;
}
