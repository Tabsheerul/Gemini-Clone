import { useState, useRef, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { useGemini } from '../../context/GeminiContext';
import { Plus, ChevronDown, Mic, ArrowUp, Image as ImageIcon, FileUp, HardDrive, X, FileText } from 'lucide-react';
import LoginModal from '../layout/LoginModal';

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
  hidden:  { opacity: 0, y: 6, scale: 0.96 },
  visible: { opacity: 1, y: 0,  scale: 1,    transition: { duration: 0.2, ease: [0.2, 0, 0, 1] } },
  exit:    { opacity: 0, y: 4, scale: 0.96, transition: { duration: 0.15, ease: 'easeIn' } },
};

const attachmentVariants = {
  hidden:  { opacity: 0, y: 6, scale: 0.96 },
  visible: { opacity: 1, y: 0,  scale: 1,    transition: { duration: 0.2, ease: [0.2, 0, 0, 1] } },
  exit:    { opacity: 0, y: 4, scale: 0.96, transition: { duration: 0.15, ease: 'easeIn' } },
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
  'absolute right-0 bottom-full mb-3 w-[210px] z-50 bg-[#262626] border border-[#333] ' +
  'rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] p-1.5 flex flex-col gap-0.5';

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
  const { sendMessage, isThinking, selectedModel, setSelectedModel, activeChat } = useGemini();
  const user = useSelector((state) => state.auth.user);

  // Local state: the text the user is typing, and whether the dropdowns are open
  const [text, setText] = useState('');
  const [modelOpen, setModelOpen] = useState(false);
  const [attachmentOpen, setAttachmentOpen] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [attachment, setAttachment] = useState(null);

  // A ref lets us directly read & set the textarea's height (needed for auto-grow)
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

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
    if ((!text.trim() && !attachment) || isThinking) return;
    sendMessage(text.trim(), attachment);
    setText(''); // Clear the textarea after sending
    setAttachment(null); // Clear attachment
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  // ── Handle keyboard: send on Enter, allow Shift+Enter for new line ─────────
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault(); // Prevent newline being added
      handleSend();
    } else if (e.key === 'ArrowUp' && text === '') {
      if (activeChat && activeChat.messages) {
        for (let i = activeChat.messages.length - 1; i >= 0; i--) {
          if (activeChat.messages[i].role === 'user') {
            setText(activeChat.messages[i].text);
            e.preventDefault();
            break;
          }
        }
      }
    }
  };

  // True only when there is text AND the AI is not already responding
  const canSend = (text.trim().length > 0 || attachment) && !isThinking;

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
        {/* Hidden file input */}
        <input 
          type="file" 
          accept="image/*,application/pdf,text/plain" 
          ref={fileInputRef}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files[0];
            if (file) {
              const reader = new FileReader();
              reader.onloadend = () => {
                setAttachment({
                  file,
                  base64: reader.result,
                  mimeType: file.type,
                  url: URL.createObjectURL(file)
                });
                setAttachmentOpen(false);
              };
              reader.readAsDataURL(file);
            }
          }}
        />

        {/* Attachment preview */}
        {attachment && (
          <div className="px-5 pt-4 pb-0 relative">
             <div className="relative rounded-xl overflow-hidden border border-[#444] group inline-block bg-[#1e1e1e]">
               {attachment.mimeType.startsWith('image/') ? (
                 <div className="w-16 h-16">
                   <img src={attachment.url} alt="attachment" className="w-full h-full object-cover" />
                 </div>
               ) : (
                 <div className="flex items-center gap-2 px-3 py-2 w-[180px] h-16">
                   <FileText size={24} className="text-blue-400 shrink-0" />
                   <div className="text-[13px] text-[#e3e3e3] truncate">
                     {attachment.file.name}
                   </div>
                 </div>
               )}
               <button 
                 onClick={() => setAttachment(null)}
                 className="absolute top-1 right-1 bg-black/60 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
               >
                 <X size={12} className="text-white" />
               </button>
             </div>
          </div>
        )}

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

          {/* Left side: Attachment (+) button */}
          <div className="flex items-center gap-0.5 relative">

            {/* Attachment button */}
            <motion.button
              onClick={() => {
                if (!user) {
                  setShowLoginModal(true);
                  return;
                }
                setAttachmentOpen((prev) => !prev);
              }}
              className={iconBtnClasses}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              title="Add attachment"
            >
              <motion.div animate={{ rotate: attachmentOpen ? 45 : 0 }} transition={{ duration: 0.2 }}>
                <Plus size={18} />
              </motion.div>
            </motion.button>

            {/* Attachment Dropdown */}
            <AnimatePresence>
              {attachmentOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setAttachmentOpen(false)}
                  />
                  <motion.div
                    variants={attachmentVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    style={{ transformOrigin: 'bottom left' }}
                    className="absolute left-0 bottom-full mb-3 w-[240px] z-50 bg-[#262626] border border-[#333] rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] p-1.5 flex flex-col gap-0.5"
                  >
                    <button
                      onClick={() => {
                        fileInputRef.current?.setAttribute('accept', 'image/*,application/pdf,text/plain');
                        fileInputRef.current?.click();
                      }}
                      className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl border-none bg-transparent text-[14px] text-[#e3e3e3] font-inherit cursor-pointer transition-colors duration-200 hover:bg-[#333]"
                    >
                      <FileUp size={18} className="text-[#bdc1c6]" />
                      Upload files
                    </button>
                    <button
                      onClick={() => {
                        fileInputRef.current?.setAttribute('accept', 'image/*');
                        fileInputRef.current?.click();
                      }}
                      className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl border-none bg-transparent text-[14px] text-[#e3e3e3] font-inherit cursor-pointer transition-colors duration-200 hover:bg-[#333]"
                    >
                      <ImageIcon size={18} className="text-[#bdc1c6]" />
                      Upload photos
                    </button>
                    <button
                      onClick={() => setAttachmentOpen(false)}
                      className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl border-none bg-transparent text-[14px] text-[#e3e3e3] font-inherit cursor-pointer transition-colors duration-200 hover:bg-[#333]"
                    >
                      <HardDrive size={18} className="text-[#bdc1c6]" />
                      Upload from Drive
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
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
                      style={{ transformOrigin: 'bottom right' }}
                      className={dropdownPanelClasses}
                    >
                      {/* Header label */}
                      {/* Header label */}
                      <div className="px-3 pt-2 pb-1.5 mb-1 text-[11px] uppercase tracking-[0.1em] text-[#7a7a7a] font-medium border-b border-[#333]">
                        Select model
                      </div>

                      {/* List of model options */}
                      {MODELS.map((model) => {
                        const isSelected = model.id === selectedModel;
                        return (
                          <button
                            key={model.id}
                            onClick={() => {
                              setSelectedModel(model.id);
                              setModelOpen(false);
                            }}
                            className={`
                              flex items-center justify-between w-full px-3 py-[10px] rounded-xl
                              border-none bg-transparent text-[13.5px] font-inherit cursor-pointer
                              transition-colors duration-200 hover:bg-[#333]
                              ${isSelected ? 'text-[#8ab4f8]' : 'text-[#bdc1c6]'}
                            `}
                          >
                            {model.full}
                            {/* Blue dot shows which model is currently active */}
                            {isSelected && (
                              <div className="w-[7px] h-[7px] rounded-full bg-[#8ab4f8]" />
                            )}
                          </button>
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

      {/* Login Modal for Guest Users */}
      <LoginModal 
        isOpen={showLoginModal} 
        onClose={() => setShowLoginModal(false)} 
        title="Sign in to upload"
        message="Please sign in or create an account to upload files and images."
      />
    </div>
  );
}
