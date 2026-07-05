import { useState, useRef, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { useGemini } from '../../context/GeminiContext';
import { MODELS } from '../../constants/models';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';
import { useFileAttachment } from '../../hooks/useFileAttachment';
import {
  Plus, ChevronDown, Mic, ArrowUp,
  Image as ImageIcon, FileUp, HardDrive, X, FileText,
} from 'lucide-react';
import LoginModal from '../layout/LoginModal';

// ─── Animation Variants ───────────────────────────────────────────────────────
// These objects describe how elements animate between states using Framer Motion.
// "hidden" = invisible starting state, "visible" = fully shown, "exit" = closing state.

const dropdownVariants = {
  hidden:  { opacity: 0, y: 6,  scale: 0.96 },
  visible: { opacity: 1, y: 0,  scale: 1, transition: { duration: 0.2, ease: [0.2, 0, 0, 1] } },
  exit:    { opacity: 0, y: 4,  scale: 0.96, transition: { duration: 0.15, ease: 'easeIn' } },
};

const sendButtonAnimation = {
  initial: { scale: 0.7, opacity: 0 },
  animate: { scale: 1,   opacity: 1, transition: { type: 'spring', stiffness: 420, damping: 22 } },
  exit:    { scale: 0.7, opacity: 0, transition: { duration: 0.1 } },
};

// ─── Reusable CSS Class Strings ───────────────────────────────────────────────
// Extracting class strings from JSX makes the markup much easier to scan.
// Each constant has a comment explaining what UI element it styles.

// The dark rounded box that wraps the textarea and toolbar
const INPUT_BOX =
  'bg-[#282828] rounded-[26px] border-[1.5px] border-transparent transition-colors duration-200 focus-within:border-[#444]';

// Small circular icon buttons (+ and mic icons in the toolbar)
const ICON_BTN =
  'w-9 h-9 flex items-center justify-center rounded-full text-[#bdc1c6] ' +
  'transition-colors duration-150 hover:bg-[rgba(255,255,255,0.08)] hover:text-[#e3e3e3] ' +
  'active:bg-[rgba(255,255,255,0.12)] shrink-0';

// The white circular Send button (arrow up icon)
const SEND_BTN =
  'w-[34px] h-[34px] rounded-full border-none bg-white text-[#1a1a1a] ' +
  'flex items-center justify-center cursor-pointer shadow-[0_2px_8px_rgba(255,255,255,0.15)]';

// The pill-shaped button that shows the active model name and opens the picker
const MODEL_PILL =
  'flex items-center gap-[5px] px-[13px] py-1.5 rounded-full border-[1.5px] border-[#3a3a3a] ' +
  'bg-transparent text-[#bdc1c6] text-[13.5px] font-inherit cursor-pointer transition-colors duration-150';

// The floating dropdown panel for both the model picker and the attachment menu
const DROPDOWN_PANEL =
  'absolute bottom-full mb-3 z-50 bg-[#262626] border border-[#333] ' +
  'rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] p-1.5 flex flex-col gap-0.5';

// ─────────────────────────────────────────────────────────────────────────────

/**
 * PromptInput
 *
 * The chat input bar at the bottom of the page. Responsible for:
 *   - Accepting and sending user messages
 *   - Attaching files (via useFileAttachment hook)
 *   - Voice input (via useSpeechRecognition hook)
 *   - Picking the AI model (reads model list from constants/models.js)
 *
 * Layout:
 *   ┌───────────────────────────────────────────────┐
 *   │  Ask Gemini... (auto-growing textarea)         │
 *   │  [+] [attachment]            [Model ▾] [🎤/↑] │
 *   └───────────────────────────────────────────────┘
 *
 * Props:
 *   centered — when true (home screen), hides the small disclaimer text below the bar
 */
export default function PromptInput({ centered = false }) {
  // Pull what we need from global state
  const { sendMessage, isThinking, stopGeneration, selectedModel, setSelectedModel, activeChat } = useGemini();
  const user = useSelector((state) => state.auth.user);

  // ── Local UI state ──────────────────────────────────────────────────────────
  const [text, setText] = useState('');               // What the user is typing
  const [modelOpen, setModelOpen] = useState(false);     // Is the model picker open?
  const [attachmentOpen, setAttachmentOpen] = useState(false); // Is the attachment menu open?
  const [showLoginModal, setShowLoginModal] = useState(false); // Is the login prompt shown?

  // A ref to the textarea DOM element, used for auto-grow logic below
  const textareaRef = useRef(null);

  // Ref to remember what text was in the box BEFORE the mic started recording
  // (so we can append the transcribed speech to existing text, not replace it)
  const textBeforeRecordingRef = useRef('');

  // ── File attachment (logic lives in the hook) ─────────────────────────────
  const {
    attachment,
    fileInputRef,
    openFilePicker,
    clearAttachment,
    handleFileInputChange,
  } = useFileAttachment();

  // ── Speech recognition (logic lives in the hook) ─────────────────────────
  // When the mic hears something, we append it to whatever text was already typed
  const { isRecording, startOrStopListening } = useSpeechRecognition({
    onTranscript: (transcript) => {
      const existingText = textBeforeRecordingRef.current;
      // Add a space between the existing text and the new transcribed speech
      const spacing = existingText.length > 0 && !existingText.endsWith(' ') ? ' ' : '';
      setText(existingText + spacing + transcript);
    },
  });

  // ── Auto-grow textarea (debounced) ────────────────────────────────────────
  // Runs after 50ms of no typing instead of on every single keystroke.
  // This reduces unnecessary DOM measurements when the user types fast.
  useEffect(() => {
    const timer = setTimeout(() => {
      const ta = textareaRef.current;
      if (!ta) return;
      ta.style.height = 'auto';
      ta.style.height = Math.min(ta.scrollHeight, 200) + 'px'; // cap at 200px tall
    }, 50);
    return () => clearTimeout(timer); // cancel timer if text changes before 50ms
  }, [text]);

  // ── Send message ───────────────────────────────────────────────────────────
  const handleSend = () => {
    // Do nothing if there's nothing to send, or if the AI is still responding
    if ((!text.trim() && !attachment) || isThinking) return;

    sendMessage(text.trim(), attachment);
    setText('');
    clearAttachment();
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  // ── Keyboard shortcuts ─────────────────────────────────────────────────────
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      // Enter alone = send message (Shift+Enter adds a new line instead)
      e.preventDefault();
      handleSend();
    } else if (e.key === 'ArrowUp' && text === '') {
      // ArrowUp when the box is empty = re-populate with the last user message
      // (Helpful for quickly editing and resending)
      if (activeChat?.messages) {
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

  // ── Mic button click ───────────────────────────────────────────────────────
  const handleMicClick = () => {
    // Save the current text so the hook's onTranscript can append to it
    textBeforeRecordingRef.current = text;
    startOrStopListening();
  };

  // The attachment menu button requires login for guests
  const handleAttachmentButtonClick = () => {
    if (!user) {
      setShowLoginModal(true);
    } else {
      setAttachmentOpen((prev) => !prev);
    }
  };

  // ─── Derived values ────────────────────────────────────────────────────────
  // canSend drives the Send vs. Mic button swap
  const canSend = (text.trim().length > 0 || attachment) && !isThinking && !isRecording;

  // Look up the full model object for the currently selected ID
  const currentModel = MODELS.find((m) => m.id === selectedModel) || MODELS[0];

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className={`w-full max-w-[700px] mx-auto ${centered ? 'px-4' : 'px-4 pb-4'}`}>

      {/* ── Main input box ─────────────────────────────────────────────────── */}
      {/* Animates a subtle ring shadow when the user has something to send */}
      <motion.div
        className={`${INPUT_BOX} relative overflow-hidden`}
        initial={false}
        animate={{ boxShadow: canSend ? '0 0 0 1.5px #444' : '0 0 0 0px transparent' }}
        transition={{ duration: 0.2 }}
      >
        {/* Loading progress bar — slides across the top while Gemini is thinking */}
        {isThinking && (
          <motion.div
            className="absolute top-0 left-0 h-[2px] w-full bg-gradient-to-r from-transparent via-[#8ab4f8] to-transparent"
            initial={{ x: '-100%' }}
            animate={{ x: '100%' }}
            transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
          />
        )}

        {/* Hidden file input — triggered programmatically by openFilePicker() */}
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          onChange={(e) => {
            handleFileInputChange(e);
            setAttachmentOpen(false); // Close the menu after selection
          }}
        />

        {/* Attachment preview — shown above the textarea when a file is selected */}
        {attachment && (
          <div className="px-5 pt-4 pb-0 relative">
            <div className="relative rounded-xl overflow-hidden border border-[#444] group inline-block bg-[#1e1e1e]">
              {attachment.mimeType.startsWith('image/') ? (
                /* Image preview thumbnail */
                <div className="w-16 h-16">
                  <img src={attachment.url} alt="attachment" className="w-full h-full object-cover" />
                </div>
              ) : (
                /* Non-image (PDF, text) preview — shows icon + filename */
                <div className="flex items-center gap-2 px-3 py-2 w-[180px] h-16">
                  <FileText size={24} className="text-blue-400 shrink-0" />
                  <div className="text-[13px] text-[#e3e3e3] truncate">{attachment.file.name}</div>
                </div>
              )}
              {/* Remove button — appears on hover */}
              <button
                onClick={clearAttachment}
                className="absolute top-1 right-1 bg-black/60 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X size={12} className="text-white" />
              </button>
            </div>
          </div>
        )}

        {/* Textarea — auto-grows with content, sends on Enter */}
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

        {/* ── Bottom toolbar ─────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-2.5 pb-3 pt-1">

          {/* Left side: Attachment (+) button and its dropdown menu */}
          <div className="flex items-center gap-0.5 relative">
            <motion.button
              onClick={handleAttachmentButtonClick}
              className={ICON_BTN}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              title="Add attachment"
            >
              {/* The + icon rotates 45° to become an × when the menu is open */}
              <motion.div
                animate={{ rotate: attachmentOpen ? 45 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <Plus size={18} />
              </motion.div>
            </motion.button>

            {/* Attachment dropdown menu */}
            <AnimatePresence>
              {attachmentOpen && (
                <>
                  {/* Invisible overlay — clicking anywhere outside closes the menu */}
                  <div className="fixed inset-0 z-10" onClick={() => setAttachmentOpen(false)} />

                  <motion.div
                    variants={dropdownVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    style={{ transformOrigin: 'bottom left' }}
                    className={`${DROPDOWN_PANEL} left-0 w-[240px]`}
                  >
                    {/* Upload any supported file type */}
                    <button
                      onClick={() => openFilePicker('image/*,application/pdf,text/plain')}
                      className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl border-none bg-transparent text-[14px] text-[#e3e3e3] font-inherit cursor-pointer hover:bg-[#333]"
                    >
                      <FileUp size={18} className="text-[#bdc1c6]" />
                      Upload files
                    </button>

                    {/* Upload images only */}
                    <button
                      onClick={() => openFilePicker('image/*')}
                      className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl border-none bg-transparent text-[14px] text-[#e3e3e3] font-inherit cursor-pointer hover:bg-[#333]"
                    >
                      <ImageIcon size={18} className="text-[#bdc1c6]" />
                      Upload photos
                    </button>

                    {/* Drive (placeholder — not implemented yet) */}
                    <button
                      onClick={() => setAttachmentOpen(false)}
                      className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl border-none bg-transparent text-[14px] text-[#e3e3e3] font-inherit cursor-pointer hover:bg-[#333]"
                    >
                      <HardDrive size={18} className="text-[#bdc1c6]" />
                      Upload from Drive
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* Right side: Model picker + Mic/Send button */}
          <div className="flex items-center gap-1.5">

            {/* ── Model picker ─────────────────────────────────────────── */}
            <div className="relative">
              {/* Pill button — shows the active model short name */}
              <motion.button
                onClick={() => setModelOpen((prev) => !prev)}
                whileHover={{ backgroundColor: 'rgba(255,255,255,0.08)', color: '#e3e3e3' }}
                className={MODEL_PILL}
              >
                {currentModel.shortName}
                {/* Chevron rotates 180° when the dropdown is open */}
                <motion.div
                  animate={{ rotate: modelOpen ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown size={13} />
                </motion.div>
              </motion.button>

              {/* Model picker dropdown */}
              <AnimatePresence>
                {modelOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setModelOpen(false)} />
                    <motion.div
                      variants={dropdownVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      style={{ transformOrigin: 'bottom right' }}
                      className={`${DROPDOWN_PANEL} right-0 w-[210px]`}
                    >
                      {/* Header */}
                      <div className="px-3 pt-2 pb-1.5 mb-1 text-[11px] uppercase tracking-[0.1em] text-[#7a7a7a] font-medium border-b border-[#333]">
                        Select model
                      </div>

                      {/* One button per model */}
                      {MODELS.map((model) => {
                        const isSelected = model.id === selectedModel;
                        return (
                          <button
                            key={model.id}
                            onClick={() => { setSelectedModel(model.id); setModelOpen(false); }}
                            className={`
                              flex items-center justify-between w-full px-3 py-[10px] rounded-xl
                              border-none bg-transparent text-[13.5px] font-inherit cursor-pointer
                              transition-colors duration-200 hover:bg-[#333]
                              ${isSelected ? 'text-[#8ab4f8]' : 'text-[#bdc1c6]'}
                            `}
                          >
                            {model.full}
                            {/* Blue dot marks the currently active model */}
                            {isSelected && <div className="w-[7px] h-[7px] rounded-full bg-[#8ab4f8]" />}
                          </button>
                        );
                      })}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* ── Mic / Send / Stop button ──────────────────────────────── */}
            {/* AnimatePresence with mode="wait" smoothly swaps between all three */}
            <AnimatePresence mode="wait">
              {isThinking ? (
                /* Stop button — shown while the AI is generating a response.
                   Lets the user cancel the stream mid-generation. */
                <motion.button
                  key="stop"
                  {...sendButtonAnimation}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.88 }}
                  onClick={stopGeneration}
                  title="Stop generating"
                  className="w-[34px] h-[34px] rounded-full border-2 border-[#bdc1c6] text-[#bdc1c6] flex items-center justify-center cursor-pointer"
                >
                  {/* Filled square = the universal "stop" symbol */}
                  <div className="w-[10px] h-[10px] rounded-[2px] bg-[#bdc1c6]" />
                </motion.button>
              ) : canSend ? (
                /* Send button — white circle with an up-arrow icon */
                <motion.button
                  key="send"
                  {...sendButtonAnimation}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.88 }}
                  onClick={handleSend}
                  title="Send"
                  className={SEND_BTN}
                >
                  <ArrowUp size={16} strokeWidth={2.5} />
                </motion.button>
              ) : (
                /* Mic button — pulses red while recording, grey otherwise */
                <motion.button
                  key="mic"
                  {...sendButtonAnimation}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.88 }}
                  onClick={handleMicClick}
                  title={isRecording ? 'Stop recording' : 'Use microphone'}
                  className={`${ICON_BTN} ${isRecording ? 'text-red-500 bg-[rgba(239,68,68,0.15)] hover:bg-[rgba(239,68,68,0.2)]' : ''}`}
                >
                  {isRecording ? (
                    /* Pulsing animation while recording */
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                    >
                      <Mic size={17} />
                    </motion.div>
                  ) : (
                    <Mic size={17} />
                  )}
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>

      {/* Small disclaimer shown in chat mode (hidden on the home/welcome screen) */}
      {!centered && (
        <p className="text-center text-[11px] text-[#5f6368] mt-2">
          Gemini can make mistakes. Check important info.
        </p>
      )}

      {/* Login prompt shown when a guest tries to attach a file */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        title="Sign in to upload"
        message="Please sign in or create an account to upload files and images."
      />
    </div>
  );
}
