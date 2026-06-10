import { createContext, useContext, useState, useCallback } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';

// ─────────────────────────────────────────────────────────────────────────────
// GeminiContext
//
// This is the single source of truth for the entire app:
//   • chatSessions  – array of past chats shown in the sidebar
//   • activeChat    – the currently open chat (id + messages)
//   • isThinking    – true while the AI "response" is loading
//   • sendMessage   – calls the real Gemini API
// ─────────────────────────────────────────────────────────────────────────────

const GeminiContext = createContext(null);

export function GeminiProvider({ children }) {
  // Each session: { id, title, messages: [{id, role, text, timestamp}] }
  const [chatSessions, setChatSessions] = useState([]);

  // null = home/welcome state; otherwise the active session object
  const [activeChat, setActiveChat] = useState(null);

  const [isThinking, setIsThinking] = useState(false);

  // Which Gemini model is selected
  const [selectedModel, setSelectedModel] = useState('gemini-3-flash-preview');

  // ── Start a brand new chat ──────────────────────────────────────────────────
  const startNewChat = useCallback(() => {
    setActiveChat(null);
  }, []);

  // ── Open an existing session from the sidebar ──────────────────────────────
  const openChat = useCallback((sessionId) => {
    const session = chatSessions.find((s) => s.id === sessionId);
    if (session) setActiveChat({ ...session });
  }, [chatSessions]);

  // ── Send a message ─────────────────────────────────────────────────────────
  const sendMessage = useCallback(async (text) => {
    if (!text.trim()) return;

    const userMsg = {
      id: `msg-${Date.now()}-user`,
      role: 'user',
      text: text.trim(),
      timestamp: new Date(),
    };

    // If there's no active chat, create a new session
    let currentSession = activeChat;
    if (!currentSession) {
      const newSession = {
        id: `chat-${Date.now()}`,
        // Use first ~40 chars of prompt as title
        title: text.trim().slice(0, 40) + (text.length > 40 ? '…' : ''),
        messages: [],
      };
      currentSession = newSession;
      // Add to sidebar history
      setChatSessions((prev) => [newSession, ...prev]);
    }

    const updatedMessages = [...currentSession.messages, userMsg];
    const updatedSession = { ...currentSession, messages: updatedMessages };
    setActiveChat(updatedSession);

    // ── Real API call to Gemini ──────────────────────────────────────────────
    setIsThinking(true);
    let aiText = '';

    try {
      // Initialize Gemini with the provided API key
      const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: selectedModel });

      // Convert our local message history into Gemini's format
      // (Exclude the current user message, we pass it to sendMessage directly)
      const history = currentSession.messages.map((m) => ({
        role: m.role,
        parts: [{ text: m.text }],
      }));

      const chat = model.startChat({ history });
      const result = await chat.sendMessage(text.trim());
      
      aiText = result.response.text();
    } catch (error) {
      console.error('Gemini API Error:', error);
      
      const errorMessage = error?.message || '';
      
      if (errorMessage.includes('503') || errorMessage.includes('high demand')) {
        aiText = "**Model Overloaded:** The AI is currently experiencing high demand. Please wait a few moments and try again. ⏳";
      } else if (errorMessage.includes('API key not valid') || errorMessage.includes('API_KEY_INVALID')) {
        aiText = "**Configuration Error:** Your API key appears to be invalid. Please check your settings.";
      } else {
        aiText = `**Oops! Something went wrong:** \n\n\`${errorMessage}\`\n\nPlease try again later.`;
      }
    }

    setIsThinking(false);

    const aiMsg = {
      id: `msg-${Date.now()}-ai`,
      role: 'model',
      text: aiText,
      timestamp: new Date(),
    };

    const finalMessages = [...updatedMessages, aiMsg];
    const finalSession = { ...updatedSession, messages: finalMessages };
    setActiveChat(finalSession);

    // Update sidebar session title + messages
    setChatSessions((prev) =>
      prev.map((s) => (s.id === finalSession.id ? finalSession : s))
    );
  }, [activeChat, selectedModel, chatSessions]);

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
      }}
    >
      {children}
    </GeminiContext.Provider>
  );
}

// Convenient hook
export function useGemini() {
  const ctx = useContext(GeminiContext);
  if (!ctx) throw new Error('useGemini must be used inside <GeminiProvider>');
  return ctx;
}
