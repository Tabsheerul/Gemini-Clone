import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGemini } from '../../context/GeminiContext';
import { Plus, Sliders, ChevronDown, Mic, ArrowUp } from 'lucide-react';

const MODELS = [
  { id: 'gemini-3-flash-preview', shortName: 'Gemini 3',         full: 'Gemini 3 Flash (Preview)' },
  { id: 'gemini-2.5-pro',         shortName: 'Gemini 2.5 Pro',   full: 'Gemini 2.5 Pro'   },
  { id: 'gemini-2.5-flash',       shortName: 'Gemini 2.5 Flash', full: 'Gemini 2.5 Flash'  },
];

const dropdownVariants = {
  hidden:  { opacity: 0, y: 8,  scale: 0.96 },
  visible: { opacity: 1, y: 0,  scale: 1,    transition: { type: 'spring', stiffness: 380, damping: 28 } },
  exit:    { opacity: 0, y: 6,  scale: 0.96, transition: { duration: 0.13 } },
};

/**
 * PromptInput
 *
 * Pixel-perfect match to the reference screenshot:
 *   Dark rounded box (#282828)
 *   ┌──────────────────────────────────────────┐
 *   │  Ask Gemini (textarea, auto-grow)        │
 *   │                                          │
 *   │  [+] [⚙ Tools]        [Fast ▾] [🎤/↑]  │
 *   └──────────────────────────────────────────┘
 *
 * Props:
 *   centered — when true (home state), no bottom disclaimer shown
 */
export default function PromptInput({ centered = false }) {
  const { sendMessage, isThinking, selectedModel, setSelectedModel } = useGemini();
  const [text, setText] = useState('');
  const [modelOpen, setModelOpen] = useState(false);
  const textareaRef = useRef(null);

  // Auto-grow textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 200) + 'px';
  }, [text]);

  const handleSend = () => {
    if (!text.trim() || isThinking) return;
    sendMessage(text.trim());
    setText('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const canSend = text.trim().length > 0 && !isThinking;
  const currentModel = MODELS.find((m) => m.id === selectedModel) || MODELS[0];

  return (
    <div className={`w-full max-w-[700px] mx-auto ${centered ? 'px-4' : 'px-4 pb-4'}`}>
      {/* ── Input box ── */}
      <motion.div
        className="bg-[#282828] rounded-[26px] border-[1.5px] border-transparent transition-colors duration-200 focus-within:border-[#444]"
        initial={false}
        animate={{ boxShadow: canSend ? '0 0 0 1.5px #444' : '0 0 0 0px transparent' }}
        transition={{ duration: 0.2 }}
      >
        {/* Textarea */}
        <textarea
          ref={textareaRef}
          id="prompt-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask Gemini"
          rows={1}
          className="w-full block bg-transparent border-none outline-none resize-none overflow-y-hidden px-5 pt-4 pb-1 text-[15px] text-[#e3e3e3] font-inherit leading-[1.6] max-h-[200px]"
          placeholder="Ask Gemini"
        />

        {/* Toolbar */}
        <div className="flex items-center justify-between px-2.5 pb-3 pt-1">

          {/* Left: + | Tools */}
          <div className="flex items-center gap-0.5">
            <motion.button
              className="w-9 h-9 flex items-center justify-center rounded-full text-[#bdc1c6] transition-colors duration-150 hover:bg-[rgba(255,255,255,0.08)] hover:text-[#e3e3e3] active:bg-[rgba(255,255,255,0.12)] shrink-0"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              title="Add attachment"
            >
              <Plus size={18} />
            </motion.button>

            <motion.button
              whileHover={{ backgroundColor: 'rgba(255,255,255,0.08)', color: '#e3e3e3' }}
              className="flex items-center gap-[7px] px-3.5 py-[7px] rounded-full border-none bg-transparent text-[#bdc1c6] text-[13.5px] font-inherit cursor-pointer transition-colors duration-150"
              title="Tools"
            >
              <Sliders size={14} />
              Tools
            </motion.button>
          </div>

          {/* Right: Fast pill | mic or send */}
          <div className="flex items-center gap-1.5">

            {/* Model speed picker */}
            <div className="relative">
              <motion.button
                onClick={() => setModelOpen((v) => !v)}
                whileHover={{ backgroundColor: 'rgba(255,255,255,0.08)', color: '#e3e3e3' }}
                className="flex items-center gap-[5px] px-[13px] py-1.5 rounded-full border-[1.5px] border-[#3a3a3a] bg-transparent text-[#bdc1c6] text-[13.5px] font-inherit cursor-pointer transition-colors duration-150"
              >
                {currentModel.shortName}
                <motion.div animate={{ rotate: modelOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                  <ChevronDown size={13} />
                </motion.div>
              </motion.button>

              <AnimatePresence>
                {modelOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setModelOpen(false)} />
                    <motion.div
                      variants={dropdownVariants}
                      initial="hidden" animate="visible" exit="exit"
                      className="absolute right-0 bottom-full mb-2 w-[210px] z-20 bg-[#262626] border border-[#333] rounded-2xl overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.5)]"
                    >
                      <div className="px-4 pt-3 pb-2 text-[11px] uppercase tracking-[0.1em] text-[#7a7a7a] font-medium border-b border-[#333]">
                        Select model
                      </div>
                      {MODELS.map((m) => {
                        const active = m.id === selectedModel;
                        return (
                          <motion.button
                            key={m.id}
                            whileHover={{ backgroundColor: 'rgba(255,255,255,0.06)' }}
                            onClick={() => { setSelectedModel(m.id); setModelOpen(false); }}
                            className={`flex items-center justify-between w-full px-4 py-[11px] border-none bg-transparent ${active ? 'text-[#8ab4f8]' : 'text-[#bdc1c6]'} text-[13.5px] font-inherit cursor-pointer transition-colors duration-150`}
                          >
                            {m.full}
                            {active && <div className="w-[7px] h-[7px] rounded-full bg-[#8ab4f8]" />}
                          </motion.button>
                        );
                      })}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Mic (idle) or Send (active) */}
            <AnimatePresence mode="wait">
              {canSend ? (
                <motion.button
                  key="send"
                  initial={{ scale: 0.7, opacity: 0 }}
                  animate={{ scale: 1,   opacity: 1, transition: { type: 'spring', stiffness: 420, damping: 22 } }}
                  exit={{   scale: 0.7, opacity: 0, transition: { duration: 0.1 } }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.88 }}
                  onClick={handleSend}
                  title="Send"
                  className="w-[34px] h-[34px] rounded-full border-none bg-white text-[#1a1a1a] flex items-center justify-center cursor-pointer shadow-[0_2px_8px_rgba(255,255,255,0.15)]"
                >
                  <ArrowUp size={16} strokeWidth={2.5} />
                </motion.button>
              ) : (
                <motion.button
                  key="mic"
                  initial={{ scale: 0.7, opacity: 0 }}
                  animate={{ scale: 1,   opacity: 1, transition: { type: 'spring', stiffness: 420, damping: 22 } }}
                  exit={{   scale: 0.7, opacity: 0, transition: { duration: 0.1 } }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.88 }}
                  className="w-9 h-9 flex items-center justify-center rounded-full text-[#bdc1c6] transition-colors duration-150 hover:bg-[rgba(255,255,255,0.08)] hover:text-[#e3e3e3] active:bg-[rgba(255,255,255,0.12)] shrink-0"
                  title="Use microphone"
                >
                  <Mic size={17} />
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>

      {/* Disclaimer */}
      {!centered && (
        <p className="text-center text-[11px] text-[#5f6368] mt-2">
          Gemini can make mistakes. Check important info.
        </p>
      )}
    </div>
  );
}
