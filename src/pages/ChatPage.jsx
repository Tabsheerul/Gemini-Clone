import { motion } from 'framer-motion';
import { useGemini } from '../context/GeminiContext';
import { useSelector } from 'react-redux';
import TopBar from '../components/layout/TopBar';
import ChatWindow from '../components/chat/ChatWindow';
import PromptInput from '../components/chat/PromptInput';
import SuggestionChips from '../components/chat/SuggestionChips';

// ─── Gradient text classes (the colourful "Hi There!" greeting) ───────────────
const greetingGradientClasses =
  'text-4xl font-semibold bg-gradient-to-r from-[#4285f4] via-[#9b59b6] to-[#ea4335] ' +
  'bg-clip-text text-transparent mb-1';

/**
 * ChatPage
 *
 * The main page of the app. It has two distinct states:
 *
 *   HOME state (no messages yet):
 *     Shows a welcome greeting, a centered input bar, and suggestion chips.
 *
 *   CHAT state (at least one message):
 *     Shows the scrollable message history and the input bar at the bottom.
 */
export default function ChatPage() {
  const { activeChat } = useGemini();
  const user = useSelector((state) => state.auth.user);

  // isHome is true if there are no messages yet (fresh start or new chat)
  const isHome = !activeChat || activeChat.messages.length === 0;

  return (
    <div className="flex flex-col h-full">
      {/* Top navigation bar (always visible) */}
      <TopBar />

      {isHome ? (
        /* ── HOME state: greeting + input + suggestion chips ─────────────── */
        <div className="flex-1 flex flex-col items-center justify-center pb-10 overflow-y-auto">

          {/* Greeting text: "Hi There! / Where should we start?" */}
          <div className="w-full max-w-[700px] px-4">
            <motion.div
              initial={{ opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.2, 0, 0, 1] }}
              className="mb-7"
            >
              {/* Colourful gradient "Hi There!" line */}
              <p className={greetingGradientClasses}>
                Hi {user?.firstName || 'There'}!
              </p>
              {/* Plain white sub-heading */}
              <h1 className="text-4xl font-semibold text-white m-0 leading-[1.2]">
                Where should we start?
              </h1>
            </motion.div>
          </div>

          {/* Centered prompt input (the `centered` prop hides the disclaimer below it) */}
          <motion.div
            className="w-full"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.45, ease: [0.2, 0, 0, 1] }}
          >
            <PromptInput centered />
          </motion.div>

          {/* Clickable suggestion chip row */}
          <SuggestionChips />
        </div>

      ) : (
        /* ── CHAT state: message history + input at the bottom ──────────── */
        <>
          {/* Scrollable list of user & AI messages */}
          <ChatWindow />
          {/* Input bar (without the `centered` prop, it shows a disclaimer below) */}
          <PromptInput />
        </>
      )}
    </div>
  );
}
