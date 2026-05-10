import { motion } from 'framer-motion';
import { useGemini } from '../context/GeminiContext';
import TopBar from '../components/layout/TopBar';
import ChatWindow from '../components/chat/ChatWindow';
import PromptInput from '../components/chat/PromptInput';
import SuggestionChips from '../components/chat/SuggestionChips';

// Change this to the logged-in user's first name later
const FIRST_NAME = 'There';

/**
 * ChatPage
 *
 * HOME state  →  greeting + centered input + chips (matches screenshot)
 * CHAT state  →  scrollable messages + bottom input bar
 */
export default function ChatPage() {
  const { activeChat } = useGemini();
  const isHome = !activeChat || activeChat.messages.length === 0;

  return (
    <div className="flex flex-col h-full">
      <TopBar />

      {isHome ? (
        /* ── Home / Welcome ─────────────────────────────────────────────── */
        <div className="flex-1 flex flex-col items-center justify-center pb-10 overflow-y-auto">
          <div className="w-full max-w-[700px] px-4">
            {/* Greeting */}
            <motion.div
              initial={{ opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.2, 0, 0, 1] }}
              className="mb-7"
            >
              <p className="text-4xl font-semibold bg-gradient-to-r from-[#4285f4] via-[#9b59b6] to-[#ea4335] bg-clip-text text-transparent mb-1">
                Hi {FIRST_NAME} !
              </p>
              <h1 className="text-4xl font-semibold text-white m-0 leading-[1.2]">
                Where should we start?
              </h1>
            </motion.div>
          </div>

          {/* Centered prompt input */}
          <motion.div
            className="w-full"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.45, ease: [0.2, 0, 0, 1] }}
          >
            <PromptInput centered />
          </motion.div>

          {/* Suggestion chips */}
          <SuggestionChips />
        </div>
      ) : (
        /* ── Chat state ─────────────────────────────────────────────────── */
        <>
          <ChatWindow />
          <PromptInput />
        </>
      )}
    </div>
  );
}
