import { motion, AnimatePresence } from 'framer-motion';

/**
 * DeleteChatModal
 *
 * A styled confirmation dialog for deleting a chat.
 * Replaces the ugly browser-default `window.confirm()` with a modal
 * that matches the dark theme of the rest of the app.
 *
 * Props:
 *   isOpen    — whether the modal is visible
 *   onClose   — called when the user clicks "Cancel" or the backdrop
 *   onConfirm — called when the user clicks "Delete"
 *   chatTitle — the title of the chat being deleted (shown in the message)
 */
export default function DeleteChatModal({ isOpen, onClose, onConfirm, chatTitle }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Semi-transparent backdrop — clicking it cancels the delete */}
          <motion.div
            key="delete-backdrop"
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal panel */}
          <motion.div
            key="delete-modal"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
          >
            <div className="pointer-events-auto w-full max-w-[360px] bg-[#1e1e1e] border border-[#333] rounded-2xl shadow-2xl p-6">
              
              {/* Icon */}
              <div className="w-10 h-10 rounded-full bg-[#ff5546]/15 flex items-center justify-center mb-4">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ff5546" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6l-1 14H6L5 6"></path>
                  <path d="M10 11v6"></path>
                  <path d="M14 11v6"></path>
                  <path d="M9 6V4h6v2"></path>
                </svg>
              </div>

              {/* Title */}
              <h3 className="text-[16px] font-semibold text-[#e3e3e3] mb-2">
                Delete chat?
              </h3>

              {/* Description */}
              <p className="text-[13.5px] text-[#9aa0a6] leading-[1.6] mb-6">
                {chatTitle
                  ? <>This will permanently delete <span className="text-[#e3e3e3] font-medium">"{chatTitle}"</span> and all its messages. This cannot be undone.</>
                  : 'This will permanently delete the chat and all its messages. This cannot be undone.'
                }
              </p>

              {/* Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-[#2a2a2a] border border-[#444] text-[#e3e3e3] text-[13.5px] font-medium cursor-pointer hover:bg-[#333] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => { onConfirm(); onClose(); }}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-[#ff5546] text-white text-[13.5px] font-medium cursor-pointer hover:bg-[#ff6657] transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
