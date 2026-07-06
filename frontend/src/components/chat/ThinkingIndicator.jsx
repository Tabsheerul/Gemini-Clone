import { motion } from 'framer-motion';

// ─── Dot animation delays ─────────────────────────────────────────────────────
// Each dot in the "thinking" animation starts a little later than the previous one,
// creating a nice cascading bounce effect.
const DOT_DELAYS = [0, 0.16, 0.32]; // seconds

// ─── Framer Motion animation for each dot ─────────────────────────────────────
// The dot bounces: it starts at y=0 (rest), moves to y=-5 (up), then returns to y=0.
// `times` maps each value in the `y` array to a point in the animation timeline (0–1).
const dotAnimation = {
  animate: { y: [0, -5, 0, 0] },
  transition: {
    duration: 1.4,    // full cycle takes 1.4 seconds
    repeat: Infinity, // loops forever
    ease: 'easeInOut',
    times: [0, 0.4, 0.8, 1], // when each y value is reached in the 0–1 timeline
  },
};

/**
 * ThinkingIndicator
 *
 * Shown while the AI is generating a response.
 * Displays the Gemini avatar next to three animated bouncing dots.
 */
export default function ThinkingIndicator() {
  return (
    // Fades + slides up into view when it first appears
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 26 }}
      className="flex items-center px-6 py-2"
    >
      {/* Indent to align with AI message text (avatar w-8 + gap-3 = 44px) */}
      <div className="ml-11 flex items-center gap-[5px] px-3.5 py-2.5 bg-[#282828] rounded-2xl">
        {DOT_DELAYS.map((delay, i) => (
          <motion.span
            key={i}
            className="w-[7px] h-[7px] rounded-full bg-[#8ab4f8]"
            animate={dotAnimation.animate}
            transition={{ ...dotAnimation.transition, delay }}
          />
        ))}
      </div>
    </motion.div>
  );
}
