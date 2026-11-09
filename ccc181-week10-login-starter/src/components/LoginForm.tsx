// GIVEN FILE (styled in form.css by Member 3). Do not edit.
// The sign-in is a DEMO: nothing is sent to a server and nothing is saved.
// Part 2 replaces the original local demo: only a successful API response signs in.
import { useRef, useState } from 'react';
import { ApiError, login, NETWORK_MESSAGE } from '../api/auth';
import type { ChangeEvent, FormEvent } from 'react';
import type { LoginErrors, LoginFormValues, SessionResponse } from '../types';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const INITIAL_VALUES: LoginFormValues = {
  email: '',
  password: '',
  remember: false,
};

function validate(values: LoginFormValues): LoginErrors {
  const errors: LoginErrors = {};
  if (!EMAIL_PATTERN.test(values.email)) {
    errors.email = 'Enter a valid email address.';
  }
  if (values.password.length < 8) {
    errors.password = 'Password must be at least 8 characters.';
  }
  return errors;
}

interface LoginFormProps {
  onAuthenticated: (session: SessionResponse) => void;
  initialMessage?: string;
}

export default function LoginForm({ onAuthenticated, initialMessage = '' }: LoginFormProps) {
  const [values, setValues] = useState<LoginFormValues>(INITIAL_VALUES);
  const [errors, setErrors] = useState<LoginErrors>({});
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);
  const [apiMessage, setApiMessage] = useState(initialMessage);
  const pending = useRef(false);

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const { name, type, value, checked } = event.target;
    setValues((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending.current) return;
    const nextErrors = validate({ ...values, email: values.email.trim() });
    setErrors(nextErrors);
    setApiMessage('');
    if (Object.keys(nextErrors).length > 0) return;

    pending.current = true;
    setLoading(true);
    try {
      const session = await login(values.email, values.password);
      onAuthenticated(session);
    } catch (error) {
      setApiMessage(error instanceof ApiError ? error.message : NETWORK_MESSAGE);
    } finally {
      pending.current = false;
      setLoading(false);
    }
  }

  return (
    <section className="login-card" aria-labelledby="login-title">
      <h2 id="login-title" className="login-card__title">
        Sign in
      </h2>
      <p className="login-card__subtitle">Use your school email to continue.</p>

      {apiMessage && <p className="auth-message auth-message--error" role="alert">{apiMessage}</p>}
      <p className="auth-note">Classroom demo: use student@campusconnect.test and Campus26. No real credentials.</p>

      <form className="login-form" onSubmit={handleSubmit} noValidate aria-busy={loading}>
        <div className="form-field">
          <label htmlFor="email">School email</label>
          <input
            id="email"
            name="email"
            disabled={loading}
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="name@school.edu.ph"
            value={values.email}
            onChange={handleChange}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? 'email-error' : undefined}
          />
          {errors.email && (
            <p id="email-error" className="form-error" role="alert">
              {errors.email}
            </p>
          )}
        </div>

        <div className="form-field">
          <label htmlFor="password">Password</label>
          <div className="password-row">
            <input
              id="password"
              name="password"
              disabled={loading}
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              value={values.password}
              onChange={handleChange}
              aria-invalid={Boolean(errors.password)}
              aria-describedby={errors.password ? 'password-error' : undefined}
            />
            <button
              type="button"
              disabled={loading}
              className="btn btn--ghost toggle-password"
              aria-controls="password"
              aria-pressed={showPassword}
              onClick={() => setShowPassword((current) => !current)}
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
          {errors.password && (
            <p id="password-error" className="form-error" role="alert">
              {errors.password}
            </p>
          )}
        </div>

        <div className="form-options">
          <label className="checkbox">
            <input
              type="checkbox"
              name="remember"
              disabled={loading}
              checked={values.remember}
              onChange={handleChange}
            />
            <span>Keep me signed in</span>
          </label>
          <a className="link" href="#forgot">
            Forgot password?
          </a>
        </div>

        <button type="submit" className="btn btn--primary" disabled={loading}>
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
        {loading && <p className="auth-note" role="status">Signing in...</p>}
      </form>

      <p className="auth-note">Sessions last in this tab until logout or token expiry; the checkbox does not enable permanent storage.</p>

      <div className="login-card__divider">
        <span>or</span>
      </div>

      <div className="alt-actions">
        <button type="button" className="btn btn--secondary">
          Create account
        </button>
        <button type="button" className="btn btn--secondary">
          Continue as guest
        </button>
      </div>
    </section>
  );
}
