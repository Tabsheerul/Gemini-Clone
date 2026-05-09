import './index.css';
import { GeminiProvider } from './context/GeminiContext';
import Sidebar from './components/layout/Sidebar';
import ChatPage from './pages/ChatPage';

/**
 * App — root component
 *
 * Layout:
 *   ┌──────┬───────────────────────────────────────┐
 *   │ 56px │                                       │
 *   │ icon │           ChatPage                    │
 *   │ rail │                                       │
 *   └──────┴───────────────────────────────────────┘
 *
 * The Sidebar renders an icon rail at 56px wide.
 * Clicking the hamburger opens a drawer overlay on top.
 */
export default function App() {
  return (
    <GeminiProvider>
      <div className="flex h-screen bg-black text-[#e3e3e3] overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-hidden">
          <ChatPage />
        </main>
      </div>
    </GeminiProvider>
  );
}
