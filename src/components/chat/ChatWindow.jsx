import { useEffect, useRef } from 'react';
import { useGemini } from '../../context/GeminiContext';
import MessageBubble from './MessageBubble';
import ThinkingIndicator from './ThinkingIndicator';

/**
 * ChatWindow
 *
 * Scrollable area containing all messages for the active chat.
 * Auto-scrolls to the bottom on new messages.
 */
export default function ChatWindow() {
  const { activeChat, isThinking } = useGemini();
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeChat?.messages, isThinking]);

  const messages = activeChat?.messages ?? [];

  return (
    <div className="flex-1 overflow-y-auto pt-4 pb-2">
      <div className="max-w-[760px] mx-auto w-full">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        {isThinking && <ThinkingIndicator />}
        <div ref={bottomRef} className="h-2" />
      </div>
    </div>
  );
}
