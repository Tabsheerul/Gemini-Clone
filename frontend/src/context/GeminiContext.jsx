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
  const sendMessage = useCallback(async (text, attachment = null) => {
    if (!text.trim() && !attachment) return;

    const encodedAttachment = attachment ? `${attachment.base64}|${attachment.file.name}` : null;

    const userMsg = {
      id: `msg-${Date.now()}-user`,
      role: 'user',
      text: text.trim(),
      imageBase64: encodedAttachment,
      timestamp: new Date(),
    };

    // If there's no active chat, create a new session
    let currentSession = activeChat;
    if (!currentSession) {
      const titleText = text.trim() || attachment?.file.name || 'Image Query';
      const title = titleText.slice(0, 40) + (titleText.length > 40 ? '…' : '');
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
          body: JSON.stringify({ role: 'user', text: text.trim(), imageBase64: encodedAttachment })
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
      const history = currentSession.messages.map((m) => {
        const parts = [{ text: m.text || " " }];
        if (m.imageBase64) {
          const rawData = m.imageBase64.split('|')[0];
          const match = rawData.match(/^data:([a-zA-Z0-9/+-]+);base64,/);
          const mimeType = match ? match[1] : 'image/jpeg';
          const data = rawData.includes('base64,') ? rawData.split('base64,')[1] : rawData;
          parts.push({ inlineData: { data, mimeType } });
        }
        return { role: m.role, parts };
      });

      const chat = model.startChat({ history });
      
      const promptParts = [{ text: text.trim() || " " }];
      if (attachment) {
        promptParts.push({
          inlineData: {
            data: attachment.base64.split('base64,')[1],
            mimeType: attachment.mimeType,
          }
        });
      }

      // --- START STREAMING CHANGES ---
      const aiMsgId = `msg-${Date.now()}-ai`;
      
      // 1. Add an empty AI message to the screen immediately so we have a place to put the incoming text
      setActiveChat(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          messages: [...prev.messages, { id: aiMsgId, role: 'model', text: '', timestamp: new Date() }]
        };
      });

      // 2. Ask Gemini for the response as a STREAM (piece by piece)
      const result = await chat.sendMessageStream(promptParts);
      
      // Turn off the loading spinner because words are about to appear!
      setIsThinking(false); 

      // 3. Loop through each piece (chunk) of text as soon as Gemini sends it
      for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        aiText += chunkText; // Add the new piece to our total text
        
        // 4. Update the screen instantly with the new piece of text
        setActiveChat(prev => {
          if (!prev) return prev;
          const newMessages = prev.messages.map(m => 
            m.id === aiMsgId ? { ...m, text: aiText } : m
          );
          return { ...prev, messages: newMessages };
        });
      }
      // --- END STREAMING CHANGES ---

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

      // If there was an error, we manually update the screen with the error message
      setIsThinking(false);
      setActiveChat(prev => {
        if (!prev) return prev;
        // If the empty message was added before the error, update it. Otherwise, add it.
        const hasTempMsg = prev.messages.some(m => m.role === 'model' && m.text === '');
        if (hasTempMsg) {
           const newMsgs = prev.messages.map(m => (m.role === 'model' && m.text === '') ? { ...m, text: aiText } : m);
           return { ...prev, messages: newMsgs };
        } else {
           return { ...prev, messages: [...prev.messages, { id: `msg-${Date.now()}-ai`, role: 'model', text: aiText, timestamp: new Date() }] };
        }
      });
    }

    // 5. Save the FINAL, complete text to our Spring Boot backend database
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

    // 6. Update the sidebar so it has the latest messages too
    setChatSessions((prev) =>
      prev.map((s) => {
        if (s.id === currentSession.id) {
          return {
            ...s,
            // Ensure the sidebar has both the user's message and the AI's final text
            messages: [...updatedMessages, { role: 'model', text: aiText, timestamp: new Date() }]
          };
        }
        return s;
      })
    );
  }, [activeChat, selectedModel, chatSessions, token]);

  // ── Rename a chat ──────────────────────────────────────────────────────────
  const renameChat = useCallback(async (chatId, newTitle) => {
    if (!token) return;
    try {
      const res = await fetch(`http://localhost:8080/api/chats/${chatId}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle })
      });
      if (res.ok) {
        setChatSessions((prev) =>
          prev.map((s) => (s.id === chatId ? { ...s, title: newTitle } : s))
        );
        if (activeChat && activeChat.id === chatId) {
          setActiveChat((prev) => ({ ...prev, title: newTitle }));
        }
      }
    } catch (e) {
      console.error("Failed to rename chat", e);
    }
  }, [token, activeChat]);

  // ── Delete a chat ──────────────────────────────────────────────────────────
  const deleteChat = useCallback(async (chatId) => {
    if (!token) return;
    try {
      const res = await fetch(`http://localhost:8080/api/chats/${chatId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setChatSessions((prev) => prev.filter((s) => s.id !== chatId));
        if (activeChat && activeChat.id === chatId) {
          setActiveChat(null);
        }
      }
    } catch (e) {
      console.error("Failed to delete chat", e);
    }
  }, [token, activeChat]);

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
        renameChat,
        deleteChat,
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
