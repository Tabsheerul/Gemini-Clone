import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGemini } from '../../context/GeminiContext';
import { Plus, Sliders, ChevronDown, Mic, ArrowUp } from 'lucide-react';

// ─── Available AI Models ───────────────────────────────────────────────────────
// Each model has a short name shown on the button and a full name shown in the dropdown.
const MODELS = [
  { id: 'gemini-3-flash-preview', shortName: 'Gemini 3',         full: 'Gemini 3 Flash (Preview)' },
  { id: 'gemini-2.5-pro',         shortName: 'Gemini 2.5 Pro',   full: 'Gemini 2.5 Pro'           },
  { id: 'gemini-2.5-flash',       shortName: 'Gemini 2.5 Flash', full: 'Gemini 2.5 Flash'          },
];

// ─── Framer Motion animation states ──────────────────────────────────────────
// These define how the model-picker dropdown animates in/out.
// "hidden" = start state, "visible" = open state, "exit" = closing state.
const dropdownVariants = {
  hidden:  { opacity: 0, y: 8,  scale: 0.96 },
  visible: { opacity: 1, y: 0,  scale: 1,    transition: { type: 'spring', stiffness: 380, damping: 28 } },
  exit:    { opacity: 0, y: 6,  scale: 0.96, transition: { duration: 0.13 } },
};

// ─── Shared Tailwind class strings ────────────────────────────────────────────
// Extracting long class strings into named constants makes JSX easier to read.

// The dark rounded input container (#282828 background, subtle border on focus)
const inputBoxClasses =
  'bg-[#282828] rounded-[26px] border-[1.5px] border-transparent transition-colors duration-200 focus-within:border-[#444]';

// Rounded icon buttons (+ and mic) — grey icon, subtle hover highlight
const iconBtnClasses =
  'w-9 h-9 flex items-center justify-center rounded-full text-[#bdc1c6] ' +
  'transition-colors duration-150 hover:bg-[rgba(255,255,255,0.08)] hover:text-[#e3e3e3] ' +
  'active:bg-[rgba(255,255,255,0.12)] shrink-0';

// The white "Send" circular button that appears when the user has typed something
const sendBtnClasses =
  'w-[34px] h-[34px] rounded-full border-none bg-white text-[#1a1a1a] ' +
  'flex items-center justify-center cursor-pointer shadow-[0_2px_8px_rgba(255,255,255,0.15)]';

// The model picker pill button (e.g. "Gemini 3 ▾")
const modelPickerBtnClasses =
  'flex items-center gap-[5px] px-[13px] py-1.5 rounded-full border-[1.5px] border-[#3a3a3a] ' +
  'bg-transparent text-[#bdc1c6] text-[13.5px] font-inherit cursor-pointer transition-colors duration-150';

// The dropdown panel that lists all models to choose from
const dropdownPanelClasses =
  'absolute right-0 bottom-full mb-2 w-[210px] z-20 bg-[#262626] border border-[#333] ' +
  'rounded-2xl overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.5)]';

// Inline-style for the send button pop-in animation
const sendBtnAnimation = {
  initial: { scale: 0.7, opacity: 0 },
  animate: { scale: 1, opacity: 1, transition: { type: 'spring', stiffness: 420, damping: 22 } },
  exit:    { scale: 0.7, opacity: 0, transition: { duration: 0.1 } },
};

// ─────────────────────────────────────────────────────────────────────────────

/**
 * PromptInput
 *
 * The main chat input bar at the bottom of the page.
 * Layout:
 *   ┌───────────────────────────────────────────────┐
 *   │  Ask Gemini... (auto-growing textarea)         │
 *   │  [+] [⚙ Tools]            [Model ▾] [🎤 / ↑] │
 *   └───────────────────────────────────────────────┘
 *
 * Props:
 *   centered — when true (home/welcome screen), hides the bottom disclaimer text
 */
export default function PromptInput({ centered = false }) {
  // Pull what we need from the global Gemini context
  const { sendMessage, isThinking, selectedModel, setSelectedModel } = useGemini();

  // Local state: the text the user is typing, and whether the model dropdown is open
  const [text, setText] = useState('');
  const [modelOpen, setModelOpen] = useState(false);

  // A ref lets us directly read & set the textarea's height (needed for auto-grow)
  const textareaRef = useRef(null);

  // ── Auto-grow: resize the textarea height to fit its content ──────────────
  // Runs every time `text` changes. Resets to 'auto' first so it can shrink too.
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 200) + 'px'; // max 200px tall
  }, [text]);

  // ── Send the message ───────────────────────────────────────────────────────
  const handleSend = () => {
    // Don't send if text is empty or AI is still responding
    if (!text.trim() || isThinking) return;
    sendMessage(text.trim());
    setText(''); // Clear the textarea after sending
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  // ── Handle keyboard: send on Enter, allow Shift+Enter for new line ─────────
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault(); // Prevent newline being added
      handleSend();
    }
  };

  // True only when there is text AND the AI is not already responding
  const canSend = text.trim().length > 0 && !isThinking;

  // Find the currently selected model object; fallback to the first model
  const currentModel = MODELS.find((m) => m.id === selectedModel) || MODELS[0];

  return (
    <div className={`w-full max-w-[700px] mx-auto ${centered ? 'px-4' : 'px-4 pb-4'}`}>

      {/* ── Input box ─────────────────────────────────────────────────────── */}
      {/* Animates a subtle ring shadow when the user can send */}
      <motion.div
        className={inputBoxClasses}
        initial={false}
        animate={{ boxShadow: canSend ? '0 0 0 1.5px #444' : '0 0 0 0px transparent' }}
        transition={{ duration: 0.2 }}
      >
        {/* The text area where users type their prompt */}
        <textarea
          ref={textareaRef}
          id="prompt-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask Gemini"
          rows={1}
          className="w-full block bg-transparent border-none outline-none resize-none overflow-y-hidden px-5 pt-4 pb-1 text-[15px] text-[#e3e3e3] font-inherit leading-[1.6] max-h-[200px]"
        />

        {/* ── Bottom toolbar ──────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-2.5 pb-3 pt-1">

          {/* Left side: Attachment (+) button and Tools button */}
          <div className="flex items-center gap-0.5">

            {/* Attachment button */}
            <motion.button
              className={iconBtnClasses}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              title="Add attachment"
            >
              <Plus size={18} />
            </motion.button>

            {/* Tools button */}
            <motion.button
              whileHover={{ backgroundColor: 'rgba(255,255,255,0.08)', color: '#e3e3e3' }}
              className="flex items-center gap-[7px] px-3.5 py-[7px] rounded-full border-none bg-transparent text-[#bdc1c6] text-[13.5px] font-inherit cursor-pointer transition-colors duration-150"
              title="Tools"
            >
              <Sliders size={14} />
              Tools
            </motion.button>
          </div>

          {/* Right side: Model picker pill + Mic/Send button */}
          <div className="flex items-center gap-1.5">

            {/* ── Model picker dropdown ──────────────────────────────────── */}
            <div className="relative">
              {/* The pill button that shows the current model name and opens the dropdown */}
              <motion.button
                onClick={() => setModelOpen((prev) => !prev)}
                whileHover={{ backgroundColor: 'rgba(255,255,255,0.08)', color: '#e3e3e3' }}
                className={modelPickerBtnClasses}
              >
                {currentModel.shortName}
                {/* The chevron icon rotates 180° when the dropdown is open */}
                <motion.div
                  animate={{ rotate: modelOpen ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown size={13} />
                </motion.div>
              </motion.button>

              {/* Dropdown — only rendered when modelOpen is true */}
              <AnimatePresence>
                {modelOpen && (
                  <>
                    {/* Invisible full-screen overlay — clicking it closes the dropdown */}
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setModelOpen(false)}
                    />

                    {/* The dropdown panel */}
                    <motion.div
                      variants={dropdownVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      className={dropdownPanelClasses}
                    >
                      {/* Header label */}
                      <div className="px-4 pt-3 pb-2 text-[11px] uppercase tracking-[0.1em] text-[#7a7a7a] font-medium border-b border-[#333]">
                        Select model
                      </div>

                      {/* List of model options */}
                      {MODELS.map((model) => {
                        const isSelected = model.id === selectedModel;
                        return (
                          <motion.button
                            key={model.id}
                            whileHover={{ backgroundColor: 'rgba(255,255,255,0.06)' }}
                            onClick={() => {
                              setSelectedModel(model.id);
                              setModelOpen(false);
                            }}
                            className={`
                              flex items-center justify-between w-full px-4 py-[11px]
                              border-none bg-transparent text-[13.5px] font-inherit cursor-pointer
                              transition-colors duration-150
                              ${isSelected ? 'text-[#8ab4f8]' : 'text-[#bdc1c6]'}
                            `}
                          >
                            {model.full}
                            {/* Blue dot shows which model is currently active */}
                            {isSelected && (
                              <div className="w-[7px] h-[7px] rounded-full bg-[#8ab4f8]" />
                            )}
                          </motion.button>
                        );
                      })}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* ── Mic / Send button ──────────────────────────────────────── */}
            {/* AnimatePresence with mode="wait" smoothly swaps between the two buttons */}
            <AnimatePresence mode="wait">
              {canSend ? (
                // ── Send button (white circle with up-arrow) ──
                <motion.button
                  key="send"
                  {...sendBtnAnimation}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.88 }}
                  onClick={handleSend}
                  title="Send"
                  className={sendBtnClasses}
                >
                  <ArrowUp size={16} strokeWidth={2.5} />
                </motion.button>
              ) : (
                // ── Mic button (shown when no text is typed) ──
                <motion.button
                  key="mic"
                  {...sendBtnAnimation}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.88 }}
                  className={iconBtnClasses}
                  title="Use microphone"
                >
                  <Mic size={17} />
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>

      {/* Disclaimer shown below the input when in chat mode (not on home screen) */}
      {!centered && (
        <p className="text-center text-[11px] text-[#5f6368] mt-2">
          Gemini can make mistakes. Check important info.
        </p>
      )}
    </div>
  );
}
