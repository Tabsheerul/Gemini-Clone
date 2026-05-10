import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Copy, ThumbsUp, ThumbsDown, RotateCcw } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Tailwind class strings ───────────────────────────────────────────────────
// Extracted here so they are easy to find and change without hunting through JSX.

// Wrapper for each AI message row (avatar + text side by side)
const aiMessageRowClasses = 'flex items-start gap-3 px-6 py-2';

// The small rounded Gemini avatar on the left of AI messages
const geminiAvatarClasses =
  'w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5';

// User message bubble (dark pill, right-aligned)
const userBubbleClasses =
  'max-w-[72%] bg-[#2a2a2a] text-[#e3e3e3] rounded-[20px] rounded-br-[6px] ' +
  'px-[18px] py-3 text-[15px] leading-[1.65]';

// Action icon button (copy, thumbs up/down, regenerate)
const actionBtnClasses =
  'w-[30px] h-[30px] rounded-full border-none bg-transparent text-[#9aa0a6] ' +
  'flex items-center justify-center cursor-pointer transition-colors duration-150';

// Prose/markdown container — uses Tailwind arbitrary selectors like [&_p] to style
// child HTML elements rendered by ReactMarkdown (paragraphs, headings, code, etc.)
const markdownClasses = [
  'text-[15px] leading-[1.72] text-[#e3e3e3]',
  // Headings
  '[&_h1]:text-[#e3e3e3] [&_h1]:mt-[0.75rem] [&_h1]:mb-[0.4rem] [&_h1]:font-semibold',
  '[&_h2]:text-[#e3e3e3] [&_h2]:mt-[0.75rem] [&_h2]:mb-[0.4rem] [&_h2]:font-semibold',
  '[&_h3]:text-[#e3e3e3] [&_h3]:mt-[0.75rem] [&_h3]:mb-[0.4rem] [&_h3]:font-semibold',
  // Paragraphs and lists
  '[&_p]:mb-[0.7rem] [&_p]:leading-[1.75]',
  '[&_ul]:pl-[1.4rem] [&_ul]:mb-[0.7rem]',
  '[&_ol]:pl-[1.4rem] [&_ol]:mb-[0.7rem]',
  '[&_li]:mb-[0.2rem]',
  // Emphasis
  '[&_strong]:text-white [&_strong]:font-semibold',
  '[&_a]:text-[#8ab4f8] [&_a]:underline',
  // Inline code
  '[&_code]:bg-[#1e1e1e] [&_code]:px-[6px] [&_code]:py-[2px] [&_code]:rounded-[5px] [&_code]:text-[0.87em] [&_code]:text-[#8ab4f8]',
  // Code blocks (<pre>)
  '[&_pre]:bg-[#1e1e1e] [&_pre]:border [&_pre]:border-[#333] [&_pre]:rounded-[10px] [&_pre]:p-4 [&_pre]:overflow-x-auto [&_pre]:my-[0.7rem]',
  '[&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:text-[#e3e3e3]',
  // Blockquotes
  '[&_blockquote]:border-l-[3px] [&_blockquote]:border-[#555] [&_blockquote]:pl-4 [&_blockquote]:text-[#aaa] [&_blockquote]:my-[0.7rem]',
].join(' ');

// ─────────────────────────────────────────────────────────────────────────────

/**
 * MessageBubble
 *
 * Renders a single chat message. Automatically decides which layout to use:
 *   - User messages → right-aligned dark pill
 *   - AI messages   → left-aligned with Gemini avatar and Markdown support
 *
 * Props:
 *   message — { id, role: 'user' | 'model', text: string }
 */
export default function MessageBubble({ message }) {
  // Route to the right sub-component based on who sent the message
  return message.role === 'user'
    ? <UserMessage message={message} />
    : <AiMessage message={message} />;
}

// ─── User Message ─────────────────────────────────────────────────────────────
// Simple right-aligned text bubble, slides in from the right on appearance.
function UserMessage({ message }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, x: 10 }}
      animate={{ opacity: 1, y: 0, x: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 28 }}
      className="flex justify-end px-6 py-1.5"
    >
      <div className={userBubbleClasses}>
        {message.text}
      </div>
    </motion.div>
  );
}

// ─── AI Message ───────────────────────────────────────────────────────────────
// Left-aligned with avatar, renders Markdown, and shows action buttons on hover.
function AiMessage({ message }) {
  const [copied, setCopied] = useState(false);       // True briefly after copying text
  const [showActions, setShowActions] = useState(false); // True when user hovers this message

  // Copy the AI's message text to the clipboard, then show a ✓ for 2 seconds
  const handleCopy = () => {
    navigator.clipboard.writeText(message.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // The four action buttons: copy, thumbs up, thumbs down, regenerate
  const actionButtons = [
    { icon: copied ? '✓' : <Copy size={14} />, title: 'Copy',          fn: handleCopy },
    { icon: <ThumbsUp size={14} />,             title: 'Good response'                },
    { icon: <ThumbsDown size={14} />,           title: 'Bad response'                 },
    { icon: <RotateCcw size={14} />,            title: 'Regenerate'                   },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 280, damping: 26 }}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
      className={aiMessageRowClasses}
    >
      {/* Gemini avatar — gradient circle with the Gemini star icon */}
      <div
        className={geminiAvatarClasses}
        style={{ background: 'linear-gradient(135deg, #4285f4, #9c59d1)' }}
      >
        <svg width="14" height="14" viewBox="0 0 28 28" fill="none">
          <path d="M14 2C14 2 16.5 9.5 22 14C16.5 18.5 14 26 14 26C14 26 11.5 18.5 6 14C11.5 9.5 14 2 14 2Z" fill="white"/>
        </svg>
      </div>

      {/* Message content area */}
      <div className="flex-1 min-w-0">
        {/* Markdown renderer — applies styles to AI-generated headings, code, links, etc. */}
        <div className={markdownClasses}>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.text}</ReactMarkdown>
        </div>

        {/* Action buttons — fade in when the user hovers this message */}
        <AnimatePresence>
          {showActions && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 2 }}
              transition={{ duration: 0.15 }}
              className="flex items-center gap-0.5 mt-1.5"
            >
              {actionButtons.map((btn, i) => (
                <motion.button
                  key={i}
                  whileHover={{ scale: 1.15, backgroundColor: 'rgba(255,255,255,0.08)' }}
                  whileTap={{ scale: 0.9 }}
                  onClick={btn.fn}
                  title={btn.title}
                  className={`${actionBtnClasses} ${copied && i === 0 ? 'text-[13px]' : ''}`}
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
