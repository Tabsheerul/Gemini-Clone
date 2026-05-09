import { motion } from 'framer-motion';
import { useGemini } from '../../context/GeminiContext';

/**
 * SuggestionChips
 *
 * Pixel-perfect match to the reference screenshot.
 * Row 1: Create image | Explore IPL Fan Zone | Create music | Write anything
 * Row 2 (centered): Help me learn | Boost my day
 *
 * Each chip has a staggered entrance animation and a spring-based hover lift.
 */

const CHIPS = [
  // Row 1
  { id: 'c1', icon: '🖼️', label: 'Create image',        prompt: "Help me create an image — describe what you'd like to generate." },
  { id: 'c2', icon: '🏏', label: 'Explore IPL Fan Zone', prompt: 'Tell me about IPL 2025 — scores, teams, top players and highlights.' },
  { id: 'c3', icon: '🎵', label: 'Create music',         prompt: 'Help me create a music concept — genre, mood, instruments and lyrics ideas.' },
  { id: 'c4', icon: '✍️', label: 'Write anything',       prompt: 'Help me write something creative — a story, poem, essay or script.' },
  // Row 2
  { id: 'c5', icon: '📚', label: 'Help me learn',        prompt: 'Teach me something interesting and useful today.' },
  { id: 'c6', icon: '⚡', label: 'Boost my day',         prompt: 'Give me productivity tips, motivation and a power plan for today.' },
];

const containerVariants = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.07, delayChildren: 0.15 } },
};

const chipVariants = {
  hidden:  { opacity: 0, y: 12, scale: 0.96 },
  visible: { opacity: 1, y: 0,  scale: 1, transition: { type: 'spring', stiffness: 280, damping: 24 } },
};

export default function SuggestionChips() {
  const { sendMessage } = useGemini();

  return (
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
          className="chip"
          onClick={() => sendMessage(chip.prompt)}
        >
          <span className="text-[15px]">{chip.icon}</span>
          {chip.label}
        </motion.button>
      ))}
    </motion.div>
  );
}
