import { motion } from 'framer-motion';

/**
 * ThinkingIndicator
 *
 * Three animated dots shown while AI is processing.
 * Renders with the same Gemini avatar as AI messages.
 */
export default function ThinkingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 26 }}
      className="flex items-center gap-3 px-6 py-2"
    >
      {/* Gemini avatar */}
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
        style={{ background: 'linear-gradient(135deg, #4285f4, #9c59d1)' }}
      >
        <svg width="14" height="14" viewBox="0 0 28 28" fill="none">
          <path d="M14 2C14 2 16.5 9.5 22 14C16.5 18.5 14 26 14 26C14 26 11.5 18.5 6 14C11.5 9.5 14 2 14 2Z" fill="white"/>
        </svg>
      </div>

      {/* Dots */}
      <div className="flex items-center gap-[5px] px-3.5 py-2.5 bg-[#282828] rounded-2xl">
        {[0, 0.16, 0.32].map((delay, i) => (
          <motion.span
            key={i}
            className="w-[7px] h-[7px] rounded-full bg-[#8ab4f8]"
            animate={{ y: [0, -5, 0, 0] }}
            transition={{
              duration: 1.4,
              repeat: Infinity,
              ease: "easeInOut",
              times: [0, 0.4, 0.8, 1],
              delay: delay,
            }}
          />
        ))}
      </div>
    </motion.div>
  );
}
