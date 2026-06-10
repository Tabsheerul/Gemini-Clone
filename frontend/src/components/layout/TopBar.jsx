import { useState } from 'react';
import { useGemini } from '../../context/GeminiContext';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logoutUser } from '../../redux/authSlice';
import { ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Tailwind class strings ───────────────────────────────────────────────────

// The gradient "Upgrade" pill button in the top-right
const upgradeBtnClasses =
  'flex items-center gap-[6px] px-[14px] py-[7px] rounded-full ' +
  'bg-gradient-to-br from-[#1a73e8] to-[#7c3aed] text-white text-[13px] ' +
  'font-medium whitespace-nowrap';

// ─── Framer Motion animation for the dropdown ────────────────────────────────
// Animates the model picker dropdown from slightly above and invisible
// to fully visible and in position.
const dropdownVariants = {
  hidden:  { opacity: 0, y: -6, scale: 0.97 },
  visible: { opacity: 1, y: 0,  scale: 1,    transition: { type: 'spring', stiffness: 400, damping: 30 } },
  exit:    { opacity: 0, y: -4, scale: 0.97, transition: { duration: 0.12 } },
};

/**
 * TopBar
 *
 * The fixed header bar at the top of the page.
 * Layout:
 *   Left  → "Gemini" text logo
 *   Right → "✦ Upgrade to Google AI Plus" gradient button + user avatar
 */
export default function TopBar() {
  const { selectedModel, setSelectedModel } = useGemini();
  const [modelOpen, setModelOpen] = useState(false); // controls the dropdown visibility
  const [profileOpen, setProfileOpen] = useState(false);
  const user = useSelector((state) => state.auth.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleProfileClick = () => {
    if (!user) {
      navigate('/login');
    } else {
      setProfileOpen((prev) => !prev);
    }
  };

  return (
    <header className="flex items-center justify-between shrink-0 px-4 py-2 bg-black pr-1">

      {/* ── Left: "Gemini" text logo ── */}
      <span className="text-lg font-medium text-[#e3e3e3] pl-1 tracking-wide">
        Gemini
      </span>

      {/* ── Right: Upgrade button + User avatar ── */}
      <div className="flex items-center gap-3">

        {/* Gradient "Upgrade" button — lifts slightly on hover */}
        <motion.button
          className={upgradeBtnClasses}
          whileHover={{ scale: 1.03, filter: 'brightness(1.1)', y: -1 }}
          whileTap={{ scale: 0.97 }}
        >
          {/* Gemini star/sparkle icon (SVG path draws a 4-pointed star shape) */}
          <svg width="13" height="13" viewBox="0 0 28 28" fill="none">
            <path d="M14 2C14 2 16.5 9.5 22 14C16.5 18.5 14 26 14 26C14 26 11.5 18.5 6 14C11.5 9.5 14 2 14 2Z" fill="white"/>
          </svg>
          Upgrade to Google AI Plus
        </motion.button>

        {/* User avatar and dropdown container */}
        <div className="relative">
          <motion.button
            onClick={handleProfileClick}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.94 }}
            title={user ? `Logged in as ${user.username}` : "Sign in"}
            className="w-8 h-8 rounded-full border-2 border-[#444] flex items-center justify-center cursor-pointer shrink-0"
            style={{ background: user ? 'linear-gradient(135deg, #1a73e8, #7c3aed)' : '#333' }}
          >
            {/* Head + shoulders silhouette */}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
              <circle cx="12" cy="8" r="4"/>
              <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" fill="white"/>
            </svg>
          </motion.button>

          {/* Profile Dropdown */}
          <AnimatePresence>
            {profileOpen && user && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setProfileOpen(false)}
                />
                <motion.div
                  variants={dropdownVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  style={{ transformOrigin: 'top right' }}
                  className="absolute right-0 top-full mt-2 w-[240px] z-20 bg-[#262626] border border-[#333] rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] p-2 flex flex-col"
                >
                  <div className="px-3 py-2 border-b border-[#333] mb-1">
                    <p className="text-[14px] text-[#e3e3e3] font-medium truncate">{user.username}</p>
                    <p className="text-[12px] text-[#9aa0a6] truncate">{user.email}</p>
                  </div>
                  
                  <button
                    onClick={() => {
                      dispatch(logoutUser());
                      setProfileOpen(false);
                    }}
                    className="flex items-center justify-start w-full px-3 py-2.5 rounded-xl border-none bg-transparent text-[13.5px] text-[#ff5546] font-medium cursor-pointer transition-colors duration-200 hover:bg-[#333]"
                  >
                    Sign out
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
