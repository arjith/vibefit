import { useEffect, useState } from 'react';
import { api } from '../lib/api';

interface RecapData {
  period: 'weekly' | 'monthly';
  startDate: string;
  totalWorkouts: number;
  totalDurationMin: number;
  totalVolume: number;
  totalSets: number;
  avgRpe: number;
  avgMood: number;
  currentStreak: number;
  longestStreak: number;
  newAchievements: { name: string; rarity: string }[];
}

const MOOD_EMOJIS = ['', '😫', '😕', '😐', '😊', '🔥'];

export function Recaps() {
  const [tab, setTab] = useState<'weekly' | 'monthly'>('weekly');
  const [data, setData] = useState<RecapData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get(`/recaps/${tab}`)
      .then((res) => setData(res.data.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [tab]);

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">📅 Recap</h1>
          <p className="page-subtitle">Your {tab} training summary</p>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="recap-tabs">
        <button
          className={`recap-tab ${tab === 'weekly' ? 'recap-tab--active' : ''}`}
          onClick={() => setTab('weekly')}
        >
          This Week
        </button>
        <button
          className={`recap-tab ${tab === 'monthly' ? 'recap-tab--active' : ''}`}
          onClick={() => setTab('monthly')}
        >
          This Month
        </button>
      </div>

      {loading && <p className="loading-text">Loading recap...</p>}

      {!loading && data && (
        <>
          <div className="recap-stats">
            <div className="recap-stat">
              <span className="recap-stat__value">{data.totalWorkouts}</span>
              <span className="recap-stat__label">Workouts</span>
            </div>
            <div className="recap-stat">
              <span className="recap-stat__value">{data.totalDurationMin}m</span>
              <span className="recap-stat__label">Training Time</span>
            </div>
            <div className="recap-stat">
              <span className="recap-stat__value">{formatVolume(data.totalVolume)}</span>
              <span className="recap-stat__label">Volume (lbs)</span>
            </div>
            <div className="recap-stat">
              <span className="recap-stat__value">{data.totalSets}</span>
              <span className="recap-stat__label">Sets</span>
            </div>
          </div>

          <div className="recap-details">
            <div className="recap-detail-row">
              <span>🎯 Avg RPE</span>
              <span className="recap-detail-value">{data.avgRpe || '—'}</span>
            </div>
            <div className="recap-detail-row">
              <span>{MOOD_EMOJIS[Math.round(data.avgMood)] || '😐'} Avg Mood</span>
              <span className="recap-detail-value">{data.avgMood || '—'}</span>
            </div>
            <div className="recap-detail-row">
              <span>🔥 Current Streak</span>
              <span className="recap-detail-value">{data.currentStreak} days</span>
            </div>
            <div className="recap-detail-row">
              <span>🏆 Longest Streak</span>
              <span className="recap-detail-value">{data.longestStreak} days</span>
            </div>
          </div>

          {data.newAchievements.length > 0 && (
            <div className="recap-section">
              <h3>🏅 New Achievements</h3>
              <div className="recap-achievements">
                {data.newAchievements.map((a, i) => (
                  <div key={i} className="recap-achievement">
                    <span className="recap-achievement__name">{a.name}</span>
                    <span className={`recap-achievement__rarity rarity-${a.rarity}`}>{a.rarity}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {!loading && !data && (
        <p className="page-empty">No data for this period. Complete some workouts to see your recap!</p>
      )}
    </div>
  );
}

function formatVolume(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}K`;
  return String(v);
}
