import { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../hooks/useRedux';
import { register, clearError } from '../store/authSlice';

export function Register() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { status, error } = useAppSelector((s) => s.auth);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const result = await dispatch(register({ email, password, name }));
    if (register.fulfilled.match(result)) {
      navigate('/');
    }
  };

  return (
    <div className="vf-auth-page">
      <div className="vf-auth-card">
        <h1 className="vf-auth-card__title">Join VibeFit</h1>
        <p className="vf-auth-card__subtitle">Start your transformation today</p>

        {error && (
          <div className="vf-alert vf-alert--error" role="alert">
            {error}
            <button onClick={() => dispatch(clearError())} aria-label="Dismiss">✕</button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="vf-form">
          <div className="vf-field">
            <label htmlFor="name">Name</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              required
              autoComplete="name"
            />
          </div>
          <div className="vf-field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
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
              placeholder="Min 8 characters"
              required
              minLength={8}
              autoComplete="new-password"
            />
          </div>
          <button
            type="submit"
            className="vf-btn vf-btn--primary vf-btn--full"
            disabled={status === 'loading'}
          >
            {status === 'loading' ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <p className="vf-auth-card__footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
