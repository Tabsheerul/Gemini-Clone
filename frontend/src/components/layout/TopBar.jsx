import { useState } from 'react';
import { useGemini } from '../../context/GeminiContext';
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

        {/* User avatar — gradient circle with a simple user silhouette icon */}
        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.94 }}
          title="Google Account"
          className="w-8 h-8 rounded-full border-2 border-[#444] flex items-center justify-center cursor-pointer shrink-0"
          style={{ background: 'linear-gradient(135deg, #4285f4, #9c59d1)' }}
        >
          {/* Head + shoulders silhouette */}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
            <circle cx="12" cy="8" r="4"/>
            <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" fill="white"/>
          </svg>
        </motion.button>
      </div>
    </header>
  );
}
