import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { useSelector } from 'react-redux';

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
  // We use Redux to watch for the token dynamically!
  const token = useSelector((state) => state.auth.token);

  // Each session: { id, title, messages: [{id, role, text, timestamp}] }
  const [chatSessions, setChatSessions] = useState([]);

  // null = home/welcome state; otherwise the active session object
  const [activeChat, setActiveChat] = useState(null);

  const [isThinking, setIsThinking] = useState(false);

  // Which Gemini model is selected
  const [selectedModel, setSelectedModel] = useState('gemini-3-flash-preview');

  // ── Load chats automatically whenever the token changes (login/logout) ──
  useEffect(() => {
    const fetchChats = async () => {
      if (!token) {
        // If logged out, clear the sidebar and chat
        setChatSessions([]);
        setActiveChat(null);
        return;
      }
      try {
        const res = await fetch('http://localhost:8080/api/chats', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          // Map backend entities to frontend format
          const formatted = data.map(c => ({ id: c.id, title: c.title, messages: [] }));
          setChatSessions(formatted);
        } else {
           console.error("Failed fetching chats, status:", res.status);
        }
      } catch (e) {
        console.error("Failed to load chats from backend", e);
      }
    };
    fetchChats();
  }, [token]);

  // ── Start a brand new chat ──────────────────────────────────────────────────
  const startNewChat = useCallback(() => {
    setActiveChat(null);
  }, []);

  // ── Open an existing session from the sidebar ──────────────────────────────
  const openChat = useCallback(async (sessionId) => {
    let session = chatSessions.find((s) => s.id === sessionId);
    if (session) {
      // If messages aren't loaded, fetch them from backend
      if (session.messages.length === 0 && token) {
        try {
          const res = await fetch(`http://localhost:8080/api/chats/${sessionId}/messages`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            const msgs = await res.json();
            session.messages = msgs.map(m => ({ 
              id: m.id, 
              role: m.role, 
              text: m.text, 
              timestamp: m.timestamp 
            }));
            // Update state with newly loaded messages
            setChatSessions(prev => prev.map(s => s.id === sessionId ? session : s));
          }
        } catch (e) {
          console.error("Failed to load messages", e);
        }
      }
      setActiveChat({ ...session });
    }
  }, [chatSessions, token]);

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
      const title = text.trim().slice(0, 40) + (text.length > 40 ? '…' : '');
      const newSession = {
        id: `chat-${Date.now()}`, // Temporary ID
        title: title,
        messages: [],
      };
      
      // Save session to backend immediately
      if (token) {
        try {
          const res = await fetch('http://localhost:8080/api/chats', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ title })
          });
          if (res.ok) {
            const data = await res.json();
            newSession.id = data.id; // Switch temp ID to real backend ID!
          } else {
             console.error("Failed to create chat, status:", res.status);
          }
        } catch (e) {
          console.error("Failed to create chat on backend", e);
        }
      }
      
      currentSession = newSession;
      // Add to sidebar history
      setChatSessions((prev) => [newSession, ...prev]);
    }

    // A helper to know if we successfully got a real backend ID
    // Our temp IDs start with "chat-". If it doesn't, it's a real DB ID!
    const isRealBackendId = !String(currentSession.id).startsWith('chat-');

    // Save User message to backend
    if (token && isRealBackendId) {
      try {
        await fetch(`http://localhost:8080/api/chats/${currentSession.id}/messages`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ role: 'user', text: text.trim() })
        });
      } catch (e) {
        console.error("Failed to save user message", e);
      }
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
      } else if (errorMessage.includes('429') || errorMessage.includes('Quota exceeded') || errorMessage.includes('quota')) {
        aiText = "**Rate Limit Exceeded:** You've reached your free usage quota for the Gemini API. Please wait a moment and try again, or check your Google AI billing plan. 🛑";
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

    // Save AI message to backend
    if (token && isRealBackendId) {
      try {
        await fetch(`http://localhost:8080/api/chats/${currentSession.id}/messages`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ role: 'model', text: aiText })
        });
      } catch (e) {
        console.error("Failed to save AI message", e);
      }
    }

    const finalMessages = [...updatedMessages, aiMsg];
    const finalSession = { ...updatedSession, messages: finalMessages };
    setActiveChat(finalSession);

    // Update sidebar session title + messages
    setChatSessions((prev) =>
      prev.map((s) => (s.id === finalSession.id ? finalSession : s))
    );
  }, [activeChat, selectedModel, chatSessions, token]);

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
