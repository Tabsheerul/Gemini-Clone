import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, X } from 'lucide-react';

export default function LogoutModal({ isOpen, onClose, onConfirm }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-[320px] bg-[#1e1f20] border border-[#333] rounded-2xl shadow-2xl p-6 overflow-hidden z-10 flex flex-col items-center text-center"
          >
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 text-[#bdc1c6] hover:text-white transition-colors"
            >
              <X size={20} />
            </button>

            <div className="w-12 h-12 rounded-full bg-[#ff5546]/10 text-[#ff5546] flex items-center justify-center mb-4 mt-2">
              <LogOut size={24} />
            </div>

            <h3 className="text-xl font-semibold text-[#e3e3e3] mb-2">
              Sign Out
            </h3>
            
            <p className="text-[#9aa0a6] text-sm mb-6">
              Are you sure you want to log out? You will need to sign in again to access your chat history.
            </p>

            <div className="flex gap-3 w-full">
              <button
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl border border-[#444] text-[#e3e3e3] font-medium hover:bg-[#333] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onConfirm();
                  onClose();
                }}
                className="flex-1 py-2.5 rounded-xl bg-[#ff5546] text-white font-medium hover:bg-[#ff3b2d] transition-colors"
              >
                Sign Out
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
