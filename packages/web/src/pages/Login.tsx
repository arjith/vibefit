import { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../hooks/useRedux';
import { login, clearError } from '../store/authSlice';

export function Login() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { status, error } = useAppSelector((s) => s.auth);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const result = await dispatch(login({ email, password }));
    if (login.fulfilled.match(result)) {
      navigate('/');
    }
  };

  return (
    <div className="vf-auth-page">
      <div className="vf-auth-card">
        <h1 className="vf-auth-card__title">Welcome back</h1>
        <p className="vf-auth-card__subtitle">Sign in to continue your fitness journey</p>

        {error && (
          <div className="vf-alert vf-alert--error" role="alert">
            {error}
            <button onClick={() => dispatch(clearError())} aria-label="Dismiss">✕</button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="vf-form">
          <div className="vf-field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="demo@vibefit.app"
              required
              autoComplete="email"
            />
          </div>
          <div className="vf-field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="current-password"
            />
          </div>
          <button
            type="submit"
            className="vf-btn vf-btn--primary vf-btn--full"
            disabled={status === 'loading'}
          >
            {status === 'loading' ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <p className="vf-auth-card__footer">
          Don't have an account? <Link to="/register">Create one</Link>
        </p>
      </div>
    </div>
  );
}
