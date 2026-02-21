import { Link } from 'react-router-dom';
import { useAppSelector } from '../hooks/useRedux';
import { Dashboard } from './Dashboard';

export function Home() {
  const authStatus = useAppSelector((s) => s.auth.status);

  if (authStatus === 'authenticated') {
    return <Dashboard />;
  }

  return (
    <div className="vf-landing">
      <section className="vf-hero">
        <h1 className="vf-hero__title">
          Train Smarter.<br />
          <span className="vf-hero__accent">Get Stronger.</span>
        </h1>
        <p className="vf-hero__subtitle">
          Your AI-powered fitness companion with 64 exercises,
          personalized routines, and smart progress tracking.
        </p>
        <div className="vf-hero__cta">
          <Link to="/register" className="vf-btn vf-btn--primary">
            Get Started Free
          </Link>
          <Link to="/exercises" className="vf-btn vf-btn--secondary">
            Browse Exercises
          </Link>
        </div>
      </section>

      <section className="vf-features">
        <div className="vf-feature">
          <span className="vf-feature__icon">📖</span>
          <h3>Exercise Library</h3>
          <p>64 exercises with step-by-step instructions, pro tips, and difficulty levels.</p>
        </div>
        <div className="vf-feature">
          <span className="vf-feature__icon">🎯</span>
          <h3>Smart Routines</h3>
          <p>AI-generated routines with progressive overload tailored to your goals.</p>
        </div>
        <div className="vf-feature">
          <span className="vf-feature__icon">🔥</span>
          <h3>Streak System</h3>
          <p>Stay motivated with streaks, achievements, and personal records.</p>
        </div>
        <div className="vf-feature">
          <span className="vf-feature__icon">📊</span>
          <h3>Progress Analytics</h3>
          <p>Volume charts, strength curves, and muscle balance radar.</p>
        </div>
      </section>
    </div>
  );
}
