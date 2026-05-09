import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Copy, ThumbsUp, ThumbsDown, RotateCcw } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * MessageBubble
 *
 * User messages  → right-aligned rounded pill, dark bg
 * AI messages    → left-aligned, Gemini star avatar, Markdown + hover actions
 */
export default function MessageBubble({ message }) {
  return message.role === 'user'
    ? <UserMessage message={message} />
    : <AiMessage message={message} />;
}

/* ── User message ── */
function UserMessage({ message }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, x: 10 }}
      animate={{ opacity: 1, y: 0, x: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 28 }}
      className="flex justify-end px-6 py-1.5"
    >
      <div className="max-w-[72%] bg-[#2a2a2a] text-[#e3e3e3] rounded-[20px] rounded-br-[6px] px-[18px] py-3 text-[15px] leading-[1.65]">
        {message.text}
      </div>
    </motion.div>
  );
}

/* ── AI message ── */
function AiMessage({ message }) {
  const [copied, setCopied] = useState(false);
  const [showActions, setShowActions] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 280, damping: 26 }}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
      className="flex items-start gap-3 px-6 py-2"
    >
      {/* Gemini avatar */}
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5"
        style={{ background: 'linear-gradient(135deg, #4285f4, #9c59d1)' }}
      >
        <svg width="14" height="14" viewBox="0 0 28 28" fill="none">
          <path d="M14 2C14 2 16.5 9.5 22 14C16.5 18.5 14 26 14 26C14 26 11.5 18.5 6 14C11.5 9.5 14 2 14 2Z" fill="white"/>
        </svg>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="prose-g text-[15px] leading-[1.72] text-[#e3e3e3]">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.text}</ReactMarkdown>
        </div>

        {/* Hover action row */}
        <AnimatePresence>
          {showActions && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 2 }}
              transition={{ duration: 0.15 }}
              className="flex items-center gap-0.5 mt-1.5"
            >
              {[
                { icon: copied ? '✓' : <Copy size={14} />, title: 'Copy',         fn: handleCopy },
                { icon: <ThumbsUp size={14} />,             title: 'Good response' },
                { icon: <ThumbsDown size={14} />,           title: 'Bad response'  },
                { icon: <RotateCcw size={14} />,            title: 'Regenerate'    },
              ].map((btn, i) => (
                <motion.button
                  key={i}
                  whileHover={{ scale: 1.15, backgroundColor: 'rgba(255,255,255,0.08)' }}
                  whileTap={{ scale: 0.9 }}
                  onClick={btn.fn}
                  title={btn.title}
                  className={`w-[30px] h-[30px] rounded-full border-none bg-transparent text-[#9aa0a6] flex items-center justify-center cursor-pointer transition-colors duration-150 ${copied && i === 0 ? 'text-[13px]' : ''}`}
                >
                  {btn.icon}
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
