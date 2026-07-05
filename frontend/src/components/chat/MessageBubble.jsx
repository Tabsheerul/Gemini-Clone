import React, { useState, useEffect, useCallback, memo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Copy, ThumbsUp, ThumbsDown, RotateCcw, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Tailwind class strings ───────────────────────────────────────────────────

const aiMessageRowClasses = 'flex items-start gap-3 px-6 py-2';

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

// Prose/markdown container — styles child elements rendered by ReactMarkdown
const markdownClasses = [
  'text-[15px] leading-[1.72] text-[#e3e3e3]',
  '[&_h1]:text-[#e3e3e3] [&_h1]:mt-[0.75rem] [&_h1]:mb-[0.4rem] [&_h1]:font-semibold',
  '[&_h2]:text-[#e3e3e3] [&_h2]:mt-[0.75rem] [&_h2]:mb-[0.4rem] [&_h2]:font-semibold',
  '[&_h3]:text-[#e3e3e3] [&_h3]:mt-[0.75rem] [&_h3]:mb-[0.4rem] [&_h3]:font-semibold',
  '[&_p]:mb-[0.7rem] [&_p]:leading-[1.75]',
  '[&_ul]:pl-[1.4rem] [&_ul]:mb-[0.7rem]',
  '[&_ol]:pl-[1.4rem] [&_ol]:mb-[0.7rem]',
  '[&_li]:mb-[0.2rem]',
  '[&_strong]:text-white [&_strong]:font-semibold',
  '[&_a]:text-[#8ab4f8] [&_a]:underline',
  '[&_code]:bg-[#1e1e1e] [&_code]:px-[6px] [&_code]:py-[2px] [&_code]:rounded-[5px] [&_code]:text-[0.87em] [&_code]:text-[#8ab4f8]',
  // Fenced code blocks are handled by our CodeBlock component, so we reset the default pre styling
  '[&_pre]:bg-transparent [&_pre]:p-0 [&_pre]:m-0',
  '[&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:text-[#e3e3e3]',
  '[&_blockquote]:border-l-[3px] [&_blockquote]:border-[#555] [&_blockquote]:pl-4 [&_blockquote]:text-[#aaa] [&_blockquote]:my-[0.7rem]',
].join(' ');

// ─────────────────────────────────────────────────────────────────────────────

/**
 * CodeBlock — Custom renderer for fenced ``` code blocks ``` inside AI messages.
 *
 * ReactMarkdown lets us swap out its default <pre><code> output with our own component.
 * This gives us a styled header bar with a language label and a per-block "Copy" button.
 *
 * Props:
 *   children  — the code content string
 *   className — e.g. "language-javascript" (from the ``` js fence)
 */
function CodeBlock({ children, className }) {
  const [copied, setCopied] = useState(false);

  const codeText = String(children).replace(/\n$/, '');
  const language = className ? className.replace('language-', '') : '';

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(codeText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [codeText]);

  return (
    <div className="relative my-[0.7rem] rounded-[10px] border border-[#333] bg-[#1e1e1e] overflow-hidden">
      {/* Header: language label on the left, copy button on the right */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-[#333] bg-[#161616]">
        <span className="text-[11px] text-[#7a7a7a] uppercase tracking-wider font-mono">
          {language || 'code'}
        </span>
        <motion.button
          onClick={handleCopy}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-1.5 text-[11px] text-[#9aa0a6] hover:text-[#e3e3e3] transition-colors"
          title="Copy code"
        >
          {copied ? (
            <><Check size={12} className="text-green-400" /><span className="text-green-400">Copied!</span></>
          ) : (
            <><Copy size={12} /><span>Copy</span></>
          )}
        </motion.button>
      </div>
      {/* The actual code content */}
      <pre className="overflow-x-auto p-4 text-[13.5px] text-[#e3e3e3] font-mono leading-[1.6] m-0">
        <code>{codeText}</code>
      </pre>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

/**
 * MessageBubble
 *
 * Renders a single chat message. Routes to UserMessage or AiMessage
 * based on the message role.
 *
 * Wrapped in React.memo — during streaming (when state updates fire 10–60×/sec),
 * only the currently updating AI message re-renders. All older messages stay
 * frozen because their `message` prop hasn't changed.
 *
 * Props:
 *   message — { id, role: 'user' | 'model', text: string }
 */
const MessageBubble = memo(function MessageBubble({ message }) {
  return message.role === 'user'
    ? <UserMessage message={message} />
    : <AiMessage message={message} />;
});

export default MessageBubble;

// ─── User Message ─────────────────────────────────────────────────────────────
function UserMessage({ message }) {
  let isImage = false;
  let base64Url = null;
  let fileName = 'Document';

  if (message.imageBase64) {
    const parts = message.imageBase64.split('|');
    base64Url = parts[0];
    fileName = parts[1] || 'Attachment';
    isImage = base64Url.startsWith('data:image/');
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, x: 10 }}
      animate={{ opacity: 1, y: 0, x: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 28 }}
      className="flex justify-end px-6 py-1.5 w-full"
    >
      <div className="flex flex-col items-end gap-1 w-full">
        {base64Url && isImage && (
          <div className="max-w-[260px] rounded-2xl overflow-hidden border border-[#444] shadow-md mb-1">
            <img src={base64Url} alt={fileName} className="w-full h-auto object-cover block" />
          </div>
        )}
        {base64Url && !isImage && (
          <div className="flex items-center gap-2 px-3 py-2.5 max-w-[260px] rounded-2xl bg-[#2a2a2a] border border-[#444] shadow-md mb-1">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
              <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2-2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
            </svg>
            <div className="text-[13px] text-[#e3e3e3] truncate">{fileName}</div>
          </div>
        )}
        {message.text && (
          <div className={`${userBubbleClasses} break-words whitespace-pre-wrap`}>
            {message.text}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ─── AI Message ───────────────────────────────────────────────────────────────
function AiMessage({ message }) {
  const [copied, setCopied] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [displayedText, setDisplayedText] = useState('');

  useEffect(() => {
    // With streaming, the text prop updates chunk-by-chunk — just mirror it directly
    setDisplayedText(message.text);
    // Trigger auto-scroll in ChatWindow as new words appear
    window.dispatchEvent(new Event('chat-scroll'));
  }, [message.text]);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(message.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [message.text]);

  const actionButtons = [
    { icon: copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />, title: 'Copy',          fn: handleCopy },
    { icon: <ThumbsUp size={14} />,   title: 'Good response' },
    { icon: <ThumbsDown size={14} />, title: 'Bad response'  },
    { icon: <RotateCcw size={14} />,  title: 'Regenerate'    },
  ];

  // Tell ReactMarkdown to use our CodeBlock component for fenced code blocks.
  // The `code` renderer receives `inline` = false for fenced blocks, true for `backtick` code.
  const markdownComponents = {
    code({ node, inline, className, children, ...props }) {
      if (inline) return <code className={className} {...props}>{children}</code>;
      return <CodeBlock className={className}>{children}</CodeBlock>;
    },
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 280, damping: 26 }}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
      className={aiMessageRowClasses}
    >
      {/* Gemini avatar */}
      <div
        className={geminiAvatarClasses}
        style={{ background: 'linear-gradient(135deg, #4285f4, #9c59d1)' }}
      >
        <svg width="14" height="14" viewBox="0 0 28 28" fill="none">
          <path d="M14 2C14 2 16.5 9.5 22 14C16.5 18.5 14 26 14 26C14 26 11.5 18.5 6 14C11.5 9.5 14 2 14 2Z" fill="white"/>
        </svg>
      </div>

      <div className="flex-1 min-w-0">
        <div className={markdownClasses}>
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
            {displayedText}
          </ReactMarkdown>
        </div>

        {/* Action buttons — fade in on hover */}
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
                  className={actionBtnClasses}
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
