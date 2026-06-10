import './index.css';
import { GeminiProvider } from './context/GeminiContext';
import { Provider, useSelector } from 'react-redux';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { store } from './redux/store';
import Sidebar from './components/layout/Sidebar';
import ChatPage from './pages/ChatPage';
import AuthPage from './pages/AuthPage';

function MainApp() {
  const user = useSelector((state) => state.auth.user);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={user && user.role !== 'guest' ? <Navigate to="/" /> : <AuthPage />} />
        <Route path="/" element={
          <GeminiProvider>
            <div className="flex h-screen bg-black text-[#e3e3e3] overflow-hidden">
              <Sidebar />
              <main className="flex-1 overflow-hidden">
                <ChatPage />
              </main>
            </div>
          </GeminiProvider>
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <Provider store={store}>
      <MainApp />
    </Provider>
  );
}
