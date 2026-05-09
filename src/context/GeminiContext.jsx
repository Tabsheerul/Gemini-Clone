import { createContext, useContext, useState, useCallback } from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// GeminiContext
//
// This is the single source of truth for the entire app:
//   • chatSessions  – array of past chats shown in the sidebar
//   • activeChat    – the currently open chat (id + messages)
//   • isThinking    – true while the AI "response" is loading
//   • sendMessage   – stub that will call the real Gemini API later
//
// HOW TO WIRE THE REAL API LATER:
//   1. Create a .env file:  VITE_GEMINI_API_KEY=your_key_here
//   2. Inside sendMessage(), replace the mock timeout with:
//
//      const res = await fetch(
//        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${import.meta.env.VITE_GEMINI_API_KEY}`,
//        {
//          method: 'POST',
//          headers: { 'Content-Type': 'application/json' },
//          body: JSON.stringify({
//            contents: activeChat.messages.map(m => ({
//              role: m.role === 'user' ? 'user' : 'model',
//              parts: [{ text: m.text }],
//            })),
//          }),
//        }
//      );
//      const data = await res.json();
//      const text = data.candidates[0].content.parts[0].text;
//
// ─────────────────────────────────────────────────────────────────────────────

const GeminiContext = createContext(null);

// Some canned mock replies to cycle through so the UI feels alive
const MOCK_REPLIES = [
  "I'm a mock response for now! Wire up the **Gemini API** by adding your key to `.env` as `VITE_GEMINI_API_KEY` and replacing the stub in `GeminiContext.jsx`.",
  "Great question! Here's a quick breakdown:\n\n1. **Step one** – Set up your environment\n2. **Step two** – Call the API\n3. **Step three** – Profit 🎉\n\nLet me know if you'd like more details.",
  "Sure! Here's a simple Python snippet:\n\n```python\nimport google.generativeai as genai\n\ngenai.configure(api_key='YOUR_KEY')\nmodel = genai.GenerativeModel('gemini-1.5-pro')\nresponse = model.generate_content('Hello!')\nprint(response.text)\n```",
  "Interesting! I can help with that. The key things to consider are:\n\n- **Context** – what information do you already have?\n- **Goal** – what outcome are you aiming for?\n- **Constraints** – any limitations to keep in mind?\n\nFeel free to share more and I'll dive deeper.",
];

let mockIdx = 0;

export function GeminiProvider({ children }) {
  // Each session: { id, title, messages: [{id, role, text, timestamp}] }
  const [chatSessions, setChatSessions] = useState([
    {
      id: 'demo-1',
      title: 'React project structure help',
      messages: [],
    },
    {
      id: 'demo-2',
      title: 'Explain transformers in ML',
      messages: [],
    },
  ]);

  // null = home/welcome state; otherwise the active session object
  const [activeChat, setActiveChat] = useState(null);

  const [isThinking, setIsThinking] = useState(false);

  // Which Gemini model is selected (UI only for now)
  const [selectedModel, setSelectedModel] = useState('gemini-2.0-flash');

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

    // ── Mock AI response (replace this block with real API call) ─────────────
    setIsThinking(true);
    await new Promise((r) => setTimeout(r, 1400 + Math.random() * 800));
    setIsThinking(false);

    const aiText = MOCK_REPLIES[mockIdx % MOCK_REPLIES.length];
    mockIdx += 1;

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
  }, [activeChat]);

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
