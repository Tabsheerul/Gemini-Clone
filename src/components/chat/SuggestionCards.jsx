import { useGemini } from '../../context/GeminiContext';

/**
 * SuggestionCards
 *
 * Four prompt suggestion cards shown on the home (no active chat) state.
 * Clicking a card sends that prompt as a message.
 */

const SUGGESTIONS = [
  {
    id: 'sug-1',
    icon: '✏️',
    title: 'Write a poem',
    subtitle: 'about the beauty of mathematics',
  },
  {
    id: 'sug-2',
    icon: '🧠',
    title: 'Explain quantum computing',
    subtitle: 'in simple terms with analogies',
  },
  {
    id: 'sug-3',
    icon: '💻',
    title: 'Debug my React code',
    subtitle: 'and suggest performance improvements',
  },
  {
    id: 'sug-4',
    icon: '🌍',
    title: 'Plan a trip to Japan',
    subtitle: 'with a 10-day itinerary',
  },
];

export default function SuggestionCards() {
  const { sendMessage } = useGemini();

  return (
    <div className="grid grid-cols-2 gap-3 max-w-2xl w-full mx-auto px-4">
      {SUGGESTIONS.map((s) => (
        <button
          key={s.id}
          onClick={() => sendMessage(`${s.title} ${s.subtitle}`)}
          className="
            suggestion-card text-left
            bg-[#1e1e22] hover:bg-[#252528]
            border border-[#2a2a2e] hover:border-[#3d3d42]
            rounded-2xl p-4 cursor-pointer
          "
        >
          <div className="text-2xl mb-2">{s.icon}</div>
          <p className="text-[14px] font-semibold text-[#e3e3e3] leading-snug mb-0.5">
            {s.title}
          </p>
          <p className="text-[13px] text-[#9aa0a6] leading-snug">
            {s.subtitle}
          </p>
        </button>
      ))}
    </div>
  );
}
