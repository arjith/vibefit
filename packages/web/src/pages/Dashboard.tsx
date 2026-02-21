import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../hooks/useRedux';
import { fetchProfile } from '../store/profileSlice';
import { fetchSessions } from '../store/workoutSlice';
import { fetchStreak, useStreakFreeze } from '../store/streakSlice';
import { api } from '../lib/api';

interface DashboardStats {
  totalWorkouts: number;
  currentStreak: number;
  longestStreak: number;
  totalExercises: number;
  recentRoutines: { id: string; name: string; goal: string }[];
}

export function Dashboard() {
  const user = useAppSelector((s) => s.auth.user);
  const profile = useAppSelector((s) => s.profile.profile);
  const sessions = useAppSelector((s) => s.workout.sessions);
  const streakData = useAppSelector((s) => s.streak.data);
  const dispatch = useAppDispatch();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    dispatch(fetchProfile());
    dispatch(fetchSessions());
    dispatch(fetchStreak());
  }, [dispatch]);

  // Redirect to onboarding if not completed
  useEffect(() => {
    if (profile && !profile.onboardingCompleted) {
      navigate('/onboarding', { replace: true });
    }
  }, [profile, navigate]);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [routinesRes] = await Promise.all([
          api.get('/routines').catch(() => ({ data: { data: [] } })),
        ]);
        setStats({
          totalWorkouts: sessions.filter((s) => s.status === 'completed').length,
          currentStreak: streakData?.currentStreak ?? 0,
          longestStreak: streakData?.longestStreak ?? 0,
          totalExercises: 64,
          recentRoutines: (routinesRes.data.data ?? []).slice(0, 3),
        });
      } catch {
        setStats({
          totalWorkouts: sessions.filter((s) => s.status === 'completed').length,
          currentStreak: streakData?.currentStreak ?? 0,
          longestStreak: streakData?.longestStreak ?? 0,
          totalExercises: 64,
          recentRoutines: [],
        });
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, [sessions, streakData]);

  const greeting = getGreeting();

  if (loading) {
    return (
      <div className="vf-dashboard">
        <div className="vf-dashboard__greeting">
          <div className="vf-skeleton vf-skeleton--text vf-skeleton--w60" style={{ height: 32 }} />
          <div className="vf-skeleton vf-skeleton--text vf-skeleton--w40" />
        </div>
        <div className="vf-stats-grid">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="vf-stat-card vf-stat-card--skeleton" aria-hidden="true">
              <div className="vf-skeleton vf-skeleton--text vf-skeleton--w40" />
              <div className="vf-skeleton vf-skeleton--text vf-skeleton--w60" style={{ height: 28 }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="vf-dashboard">
      {/* Greeting */}
      <div className="vf-dashboard__greeting">
        <h1>{greeting}, {user?.name?.split(' ')[0] ?? 'Athlete'} 👋</h1>
        <p className="vf-text--muted">Here's your fitness overview</p>
      </div>

      {/* Stats Cards */}
      <div className="vf-stats-grid">
        <div className="vf-stat-card">
          <span className="vf-stat-card__icon">🏋️</span>
          <div className="vf-stat-card__body">
            <span className="vf-stat-card__value">{stats?.totalWorkouts ?? 0}</span>
            <span className="vf-stat-card__label">Workouts</span>
          </div>
        </div>
        <div className="vf-stat-card vf-stat-card--brand">
          <span className="vf-stat-card__icon">🔥</span>
          <div className="vf-stat-card__body">
            <span className="vf-stat-card__value">{stats?.currentStreak ?? 0}</span>
            <span className="vf-stat-card__label">Day Streak</span>
          </div>
        </div>
        <div className="vf-stat-card">
          <span className="vf-stat-card__icon">🏆</span>
          <div className="vf-stat-card__body">
            <span className="vf-stat-card__value">{stats?.longestStreak ?? 0}</span>
            <span className="vf-stat-card__label">Best Streak</span>
          </div>
        </div>
        <div className="vf-stat-card">
          <span className="vf-stat-card__icon">💪</span>
          <div className="vf-stat-card__body">
            <span className="vf-stat-card__value">{stats?.totalExercises ?? 0}</span>
            <span className="vf-stat-card__label">Exercises</span>
          </div>
        </div>
      </div>

      {/* Streak Widget */}
      {streakData && streakData.currentStreak > 0 && (
        <div className="streak-widget">
          <span className="streak-fire">🔥</span>
          <div className="streak-info">
            <h3>{streakData.currentStreak} Day Streak</h3>
            <p>Best: {streakData.longestStreak} days &middot; {streakData.freezesAvailable} freeze{streakData.freezesAvailable !== 1 ? 's' : ''} left</p>
          </div>
          {streakData.freezesAvailable > 0 && (
            <button className="streak-freeze-btn" onClick={() => dispatch(useStreakFreeze())}>
              ❄️ Use Freeze
            </button>
          )}
        </div>
      )}

      {/* Quick Actions */}
      <section className="vf-dashboard-section">
        <h2>Quick Actions</h2>
        <div className="vf-quick-actions">
          <Link to="/exercises" className="vf-action-card">
            <span className="vf-action-card__icon">📖</span>
            <span className="vf-action-card__label">Browse Exercises</span>
            <span className="vf-action-card__desc">64 exercises with instructions</span>
          </Link>
          <Link to="/routines" className="vf-action-card">
            <span className="vf-action-card__icon">📋</span>
            <span className="vf-action-card__label">My Routines</span>
            <span className="vf-action-card__desc">View & manage your routines</span>
          </Link>
          <Link to="/cardio" className="vf-action-card">
            <span className="vf-action-card__icon">🏃</span>
            <span className="vf-action-card__label">Cardio Library</span>
            <span className="vf-action-card__desc">37 cardio activities</span>
          </Link>
          <Link to="/achievements" className="vf-action-card">
            <span className="vf-action-card__icon">🏆</span>
            <span className="vf-action-card__label">Achievements</span>
            <span className="vf-action-card__desc">Track your milestones</span>
          </Link>
        </div>
      </section>

      {/* Recent Routines */}
      {stats && stats.recentRoutines.length > 0 && (
        <section className="vf-dashboard-section">
          <h2>Your Routines</h2>
          <div className="vf-routines-list">
            {stats.recentRoutines.map((r) => (
              <Link to={`/routines/${r.id}`} key={r.id} className="vf-routine-item">
                <div>
                  <h3>{r.name}</h3>
                  <span className="vf-badge">{r.goal}</span>
                </div>
                <span className="vf-routine-item__arrow">→</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Get Started */}
      {stats && stats.totalWorkouts === 0 && (
        <section className="vf-dashboard-section vf-get-started">
          <div className="vf-get-started__content">
            <span className="vf-get-started__icon">🚀</span>
            <h2>Ready to start your fitness journey?</h2>
            <p className="vf-text--muted">
              Explore our exercise library and build your first routine.
            </p>
            <Link to="/exercises" className="vf-btn vf-btn--primary">
              View Exercises
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}
