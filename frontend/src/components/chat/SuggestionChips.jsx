import { motion } from 'framer-motion';
import { useGemini } from '../../context/GeminiContext';

// ─── Chip Data ────────────────────────────────────────────────────────────────
// Each chip has:
//   id     — a unique key React uses to track list items
//   icon   — emoji displayed on the left
//   label  — the text shown on the chip button
//   prompt — the message sent to the AI when the chip is clicked
const CHIPS = [
  { id: 'c1', icon: '🖼️', label: 'Create image',        prompt: "Help me create an image — describe what you'd like to generate." },
  { id: 'c2', icon: '🏏', label: 'Explore IPL Fan Zone', prompt: 'Tell me about IPL 2025 — scores, teams, top players and highlights.' },
  { id: 'c3', icon: '🎵', label: 'Create music',         prompt: 'Help me create a music concept — genre, mood, instruments and lyrics ideas.' },
  { id: 'c4', icon: '✍️', label: 'Write anything',       prompt: 'Help me write something creative — a story, poem, essay or script.' },
  { id: 'c5', icon: '📚', label: 'Help me learn',        prompt: 'Teach me something interesting and useful today.' },
  { id: 'c6', icon: '⚡', label: 'Boost my day',         prompt: 'Give me productivity tips, motivation and a power plan for today.' },
];

// ─── Framer Motion Animation Variants ─────────────────────────────────────────
// containerVariants: makes all chips stagger their entrance (each chip waits a bit before animating in)
const containerVariants = {
  hidden:  {},
  visible: {
    transition: {
      staggerChildren: 0.07,  // each chip delays by 0.07s after the previous one
      delayChildren: 0.15,    // wait 0.15s before the first chip starts animating
    },
  },
};

// chipVariants: each chip fades + slides up from below when it appears
const chipVariants = {
  hidden:  { opacity: 0, y: 12, scale: 0.96 },
  visible: { opacity: 1, y: 0,  scale: 1, transition: { type: 'spring', stiffness: 280, damping: 24 } },
};

// Tailwind classes for each chip pill button
const chipClasses =
  'flex items-center gap-[7px] px-[18px] py-[9px] rounded-full border-[1.5px] border-transparent ' +
  'bg-[#2828284c] text-[#c8c8c8] text-[13.5px] cursor-pointer transition-all duration-150 ' +
  'whitespace-nowrap hover:bg-[#333333] hover:text-[#e3e3e3]';

// ─────────────────────────────────────────────────────────────────────────────

/**
 * SuggestionChips
 *
 * Displays a row of clickable suggestion pills on the home screen.
 * When a chip is clicked, its `prompt` is sent directly to the AI.
 * Each chip animates in with a staggered fade+slide effect.
 */
export default function SuggestionChips() {
  // sendMessage sends a prompt string to the Gemini AI
  const { sendMessage } = useGemini();

  return (
    // The container uses staggered animation variants to animate each chip in sequence
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="mt-[22px] flex flex-wrap justify-center gap-2.5 max-w-[700px] px-4"
    >
      {CHIPS.map((chip) => (
        <motion.button
          key={chip.id}
          variants={chipVariants}
          whileHover={{ y: -2, transition: { type: 'spring', stiffness: 400, damping: 20 } }}
          whileTap={{ scale: 0.95 }}
          className={chipClasses}
          onClick={() => sendMessage(chip.prompt)}
        >
          {/* Emoji icon */}
          <span className="text-[15px]">{chip.icon}</span>
          {/* Label text */}
          {chip.label}
        </motion.button>
      ))}
    </motion.div>
  );
}
