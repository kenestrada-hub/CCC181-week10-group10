// GIVEN FILE: your job is the CSS in src/styles/. Do not edit .tsx files
// (if you must, tell your group first). Class names are fixed; style them.
// Part 2 adds real API authentication while preserving the Part 1 layout.
import { useEffect, useState } from 'react';
import { ApiError, getMe, TOKEN_KEY, NETWORK_MESSAGE } from './api/auth';
import type { AuthUser, SessionResponse } from './types';
import Welcome from './components/Welcome';
import Navbar from './components/Navbar';
import BrandPanel from './components/BrandPanel';
import LoginForm from './components/LoginForm';
import Footer from './components/Footer';

function readToken(): string | null {
  try {
    return sessionStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export default function App() {
  const [savedToken] = useState(readToken);
  const [checking, setChecking] = useState(Boolean(savedToken));
  const [user, setUser] = useState<AuthUser | null>(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!savedToken) return;
    let active = true;
    getMe(savedToken)
      .then((verifiedUser) => {
        if (active) setUser(verifiedUser);
      })
      .catch((error: unknown) => {
        if (!active) return;
        if (error instanceof ApiError && error.status === 401) {
          sessionStorage.removeItem(TOKEN_KEY);
          setMessage('Your session expired. Please sign in again.');
        } else {
          setMessage(error instanceof ApiError ? error.message : NETWORK_MESSAGE);
        }
      })
      .finally(() => { if (active) setChecking(false); });
    return () => { active = false; };
  }, [savedToken]);

  function authenticated(session: SessionResponse) {
    try {
      sessionStorage.setItem(TOKEN_KEY, session.token);
    } catch {
      throw new ApiError(0, 'Your browser could not save this session. Please allow site storage and try again.');
    }
    setMessage('');
    setUser(session.user);
  }

  function logout() {
    sessionStorage.removeItem(TOKEN_KEY);
    setUser(null);
    setMessage('');
  }

  return (
    <div className="page">
      <Navbar />
      <main className="container">
        <div className="login-layout">
          <BrandPanel />
          {checking ? (
            <section className="login-card" aria-busy="true">
              <p role="status">Checking your session...</p>
            </section>
          ) : user ? (
            <Welcome user={user} onLogout={logout} />
          ) : (
            <LoginForm onAuthenticated={authenticated} initialMessage={message} />
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
