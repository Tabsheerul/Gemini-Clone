import './index.css';
import React, { Suspense, lazy } from 'react';
import { GeminiProvider } from './context/GeminiContext';
import { Provider, useSelector } from 'react-redux';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { store } from './redux/store';
import Sidebar from './components/layout/Sidebar';
import ChatPage from './pages/ChatPage';

// ── Lazy load AuthPage ──────────────────────────────────────────────────────
// AuthPage is only needed when the user is NOT logged in.
// By using lazy(), React splits it into a separate JS chunk that only gets
// downloaded when someone actually navigates to /login.
// Logged-in users never download this code at all — faster first load!
const AuthPage = lazy(() => import('./pages/AuthPage'));

function MainApp() {
  const user = useSelector((state) => state.auth.user);

  return (
    <BrowserRouter>
      {/*
        Suspense provides a fallback UI while the lazy-loaded chunk is downloading.
        We use a simple dark-background div so there's no flash of white.
      */}
      <Suspense fallback={<div className="h-screen bg-black" />}>
        <Routes>
          <Route
            path="/login"
            element={user && user.role !== 'guest' ? <Navigate to="/" /> : <AuthPage />}
          />
          <Route
            path="/"
            element={
              <GeminiProvider>
                <div className="flex h-screen bg-black text-[#e3e3e3] overflow-hidden">
                  <Sidebar />
                  <main className="flex-1 overflow-hidden">
                    <ChatPage />
                  </main>
                </div>
              </GeminiProvider>
            }
          />
        </Routes>
      </Suspense>
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
