import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Sparkles, X } from 'lucide-react';

export default function LoginModal({ isOpen, onClose, title = "Sign in required", message = "Please sign in or create an account to use this feature." }) {
  const navigate = useNavigate();

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
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
            className="relative w-full max-w-sm bg-[#1e1f20] border border-[#333] rounded-2xl shadow-2xl p-6 overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#1a73e8] to-[#7c3aed]" />
            
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 text-[#bdc1c6] hover:text-white transition-colors"
            >
              <X size={20} />
            </button>

            <div className="flex justify-center mb-4 mt-2">
              <div className="w-12 h-12 rounded-full bg-[#1a73e8]/10 flex items-center justify-center">
                <Sparkles className="text-[#8ab4f8]" size={24} />
              </div>
            </div>

            <h3 className="text-xl font-semibold text-center text-[#e3e3e3] mb-2">
              {title}
            </h3>
            
            <p className="text-[#bdc1c6] text-center text-sm mb-6 leading-relaxed">
              {message}
            </p>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => {
                  onClose();
                  navigate('/login');
                }}
                className="w-full bg-[#8ab4f8] text-[#1a1a1a] font-medium py-2.5 rounded-xl hover:bg-[#9fc3f9] transition-colors"
              >
                Sign in
              </button>
              <button
                onClick={onClose}
                className="w-full bg-transparent text-[#e3e3e3] font-medium py-2.5 rounded-xl hover:bg-white/5 transition-colors"
              >
                Not now
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
