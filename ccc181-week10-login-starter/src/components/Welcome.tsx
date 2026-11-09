import { useEffect, useRef } from 'react';
import type { AuthUser } from '../types';

interface WelcomeProps {
  user: AuthUser;
  onLogout: () => void;
}

export default function Welcome({ user, onLogout }: WelcomeProps) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { heading.current?.focus(); }, []);

  return (
    <section className="login-card auth-welcome" aria-labelledby="welcome-user-title">
      <p className="auth-message" role="status">You are signed in.</p>
      <h2 className="login-card__title" id="welcome-user-title" tabIndex={-1} ref={heading}>
        Welcome, {user.name}
      </h2>
      <p className="auth-email">{user.email}</p>
      <p className="auth-note">Your session is verified by the CampusConnect API.</p>
      <button type="button" className="btn btn--primary" onClick={onLogout}>Log out</button>
    </section>
  );
}
