import { useEffect, useState } from 'react';
import { api } from '../lib/api';

interface AnalyticsSummary {
  totalWorkouts: number;
  totalDurationMin: number;
  avgDurationMin: number;
  totalVolume: number;
  totalSets: number;
  totalPRs: number;
  weeklyData: { week: string; count: number }[];
  topExercises: { exerciseId: string; timesPerformed: number; personalBestWeight: number | null; mastery: string }[];
}

export function Analytics() {
  const [data, setData] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/analytics/summary')
      .then((res) => setData(res.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="page-container"><p className="loading-text">Loading analytics...</p></div>;
  if (!data) return <div className="page-container"><p>No data available yet. Complete some workouts first!</p></div>;

  const maxWeekly = Math.max(...data.weeklyData.map((w) => w.count), 1);

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">📊 Progress Analytics</h1>
          <p className="page-subtitle">Your training at a glance</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="analytics-cards">
        <div className="analytics-card">
          <span className="analytics-card__value">{data.totalWorkouts}</span>
          <span className="analytics-card__label">Total Workouts</span>
        </div>
        <div className="analytics-card">
          <span className="analytics-card__value">{formatVolume(data.totalVolume)}</span>
          <span className="analytics-card__label">Total Volume (lbs)</span>
        </div>
        <div className="analytics-card">
          <span className="analytics-card__value">{data.totalSets}</span>
          <span className="analytics-card__label">Total Sets</span>
        </div>
        <div className="analytics-card">
          <span className="analytics-card__value">{data.totalPRs}</span>
          <span className="analytics-card__label">Personal Records</span>
        </div>
        <div className="analytics-card">
          <span className="analytics-card__value">{data.avgDurationMin}m</span>
          <span className="analytics-card__label">Avg Duration</span>
        </div>
        <div className="analytics-card">
          <span className="analytics-card__value">{data.totalDurationMin}m</span>
          <span className="analytics-card__label">Total Time</span>
        </div>
      </div>

      {/* Weekly Chart (CSS bar chart) */}
      <section className="analytics-section">
        <h2>Workouts Per Week (Last 8 Weeks)</h2>
        <div className="analytics-bar-chart">
          {data.weeklyData.map((w) => (
            <div key={w.week} className="analytics-bar-col">
              <div className="analytics-bar-wrapper">
                <div
                  className="analytics-bar"
                  style={{ height: `${(w.count / maxWeekly) * 100}%` }}
                />
              </div>
              <span className="analytics-bar-count">{w.count}</span>
              <span className="analytics-bar-label">{w.week}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Top Exercises */}
      {data.topExercises.length > 0 && (
        <section className="analytics-section">
          <h2>Top Exercises</h2>
          <div className="analytics-exercises">
            {data.topExercises.map((ex, i) => (
              <div key={ex.exerciseId} className="analytics-exercise-row">
                <span className="analytics-rank">#{i + 1}</span>
                <div className="analytics-exercise-info">
                  <span className="analytics-exercise-id">{ex.exerciseId.slice(0, 8)}...</span>
                  <span className={`analytics-mastery mastery-${ex.mastery}`}>{ex.mastery}</span>
                </div>
                <div className="analytics-exercise-stats">
                  <span>{ex.timesPerformed} sets</span>
                  {ex.personalBestWeight && <span className="analytics-pr">PR: {ex.personalBestWeight} lbs</span>}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function formatVolume(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}K`;
  return String(v);
}
