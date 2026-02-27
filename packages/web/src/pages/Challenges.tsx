import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../hooks/useRedux';
import {
  fetchChallenges,
  fetchMyChallenges,
  fetchChallengeDetail,
  joinChallenge,
  leaveChallenge,
  clearSelected,
  type LeaderboardEntry,
} from '../store/challengesSlice';
import type { Challenge, ChallengeType } from '@vibefit/shared';

const TYPE_ICONS: Record<ChallengeType, string> = {
  personal: '🎯',
  community: '🌍',
  'head-to-head': '⚔️',
  seasonal: '🎄',
};

const TYPE_LABELS: Record<ChallengeType, string> = {
  personal: 'Personal',
  community: 'Community',
  'head-to-head': 'Head-to-Head',
  seasonal: 'Seasonal',
};

function daysLeft(endDate: string): string {
  const diff = new Date(endDate).getTime() - Date.now();
  if (diff <= 0) return 'Ended';
  const days = Math.ceil(diff / 86400000);
  return days === 1 ? '1 day left' : `${days} days left`;
}

function progressPercent(current: number, target: number): number {
  return Math.min(100, Math.round((current / target) * 100));
}

// ─── Challenge Card ─────────────────────────────────────────
function ChallengeCard({
  challenge,
  joined,
  onView,
  onJoin,
  onLeave,
}: {
  challenge: Challenge;
  joined: boolean;
  onView: () => void;
  onJoin: () => void;
  onLeave: () => void;
}) {
  const pct = progressPercent(challenge.currentProgress, challenge.target);
  const type = challenge.type as ChallengeType;

  return (
    <div className="challenge-card" onClick={onView}>
      <div className="challenge-card__header">
        <span className="challenge-card__type-badge" data-type={type}>
          {TYPE_ICONS[type]} {TYPE_LABELS[type]}
        </span>
        <span className="challenge-card__timer">{daysLeft(challenge.endDate)}</span>
      </div>

      <h3 className="challenge-card__name">{challenge.name}</h3>
      <p className="challenge-card__desc">{challenge.description}</p>

      <div className="challenge-card__progress">
        <div className="challenge-progress-bar">
          <div className="challenge-progress-bar__fill" style={{ width: `${pct}%` }} />
        </div>
        <span className="challenge-card__progress-text">
          {challenge.currentProgress} / {challenge.target} {challenge.unit}
        </span>
      </div>

      <div className="challenge-card__footer">
        <span className="challenge-card__participants">
          👥 {challenge.participantCount} participant{challenge.participantCount !== 1 ? 's' : ''}
        </span>
        <button
          className={`vf-btn vf-btn--sm ${joined ? 'vf-btn--ghost' : 'vf-btn--primary'}`}
          onClick={(e) => { e.stopPropagation(); joined ? onLeave() : onJoin(); }}
        >
          {joined ? 'Leave' : 'Join'}
        </button>
      </div>
    </div>
  );
}

// ─── Leaderboard ────────────────────────────────────────────
function Leaderboard({ entries, target, unit }: { entries: LeaderboardEntry[]; target: number; unit: string }) {
  return (
    <div className="challenge-leaderboard">
      <h3 className="challenge-leaderboard__title">🏆 Leaderboard</h3>
      {entries.length === 0 && <p className="challenge-leaderboard__empty">No participants yet</p>}
      <ol className="challenge-leaderboard__list">
        {entries.map((entry, idx) => {
          const pct = progressPercent(entry.progress, target);
          const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}.`;
          return (
            <li key={entry.userId} className="challenge-leaderboard__item">
              <span className="challenge-leaderboard__rank">{medal}</span>
              <div className="challenge-leaderboard__avatar">
                {entry.userAvatar ? (
                  <img src={entry.userAvatar} alt={entry.userName} />
                ) : (
                  <span className="avatar-placeholder">{entry.userName.charAt(0).toUpperCase()}</span>
                )}
              </div>
              <span className="challenge-leaderboard__name">{entry.userName}</span>
              <div className="challenge-leaderboard__bar-wrap">
                <div className="challenge-progress-bar challenge-progress-bar--sm">
                  <div className="challenge-progress-bar__fill" style={{ width: `${pct}%` }} />
                </div>
              </div>
              <span className="challenge-leaderboard__score">
                {entry.progress} {unit}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

// ─── Detail Modal ───────────────────────────────────────────
function ChallengeDetailPanel({ onClose }: { onClose: () => void }) {
  const { selected, status } = useAppSelector((s) => s.challenges);

  if (!selected) return null;

  const pct = progressPercent(selected.currentProgress, selected.target);
  const type = selected.type as ChallengeType;

  return (
    <div className="challenge-detail-overlay" onClick={onClose}>
      <div className="challenge-detail" onClick={(e) => e.stopPropagation()}>
        <button className="challenge-detail__close" onClick={onClose}>✕</button>
        {status === 'loading' && <p className="loading-text">Loading...</p>}

        <div className="challenge-detail__header">
          <span className="challenge-card__type-badge" data-type={type}>
            {TYPE_ICONS[type]} {TYPE_LABELS[type]}
          </span>
          <h2>{selected.name}</h2>
          <p>{selected.description}</p>
        </div>

        <div className="challenge-detail__stats">
          <div className="challenge-stat">
            <span className="challenge-stat__value">{selected.participantCount}</span>
            <span className="challenge-stat__label">Participants</span>
          </div>
          <div className="challenge-stat">
            <span className="challenge-stat__value">{daysLeft(selected.endDate)}</span>
            <span className="challenge-stat__label">Remaining</span>
          </div>
          <div className="challenge-stat">
            <span className="challenge-stat__value">{pct}%</span>
            <span className="challenge-stat__label">Your Progress</span>
          </div>
        </div>

        <div className="challenge-card__progress" style={{ marginBottom: 24 }}>
          <div className="challenge-progress-bar">
            <div className="challenge-progress-bar__fill" style={{ width: `${pct}%` }} />
          </div>
          <span className="challenge-card__progress-text">
            {selected.currentProgress} / {selected.target} {selected.unit}
          </span>
        </div>

        <Leaderboard entries={selected.leaderboard ?? []} target={selected.target} unit={selected.unit} />
      </div>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────
export function Challenges() {
  const dispatch = useAppDispatch();
  const { challenges, myChallenges, selected, status, error } = useAppSelector((s) => s.challenges);
  const [filter, setFilter] = useState<'all' | ChallengeType>('all');
  const [tab, setTab] = useState<'browse' | 'mine'>('browse');

  useEffect(() => {
    dispatch(fetchChallenges());
    dispatch(fetchMyChallenges());
  }, [dispatch]);

  const myIds = new Set(myChallenges.map((c) => c.id));

  const filtered = (tab === 'mine' ? myChallenges : challenges).filter(
    (c) => filter === 'all' || c.type === filter,
  );

  const handleView = (id: string) => {
    dispatch(fetchChallengeDetail(id));
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">🏆 Challenges</h1>
          <p className="page-subtitle">Compete, achieve, and push your limits</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="challenge-tabs">
        <button
          className={`challenge-tab ${tab === 'browse' ? 'challenge-tab--active' : ''}`}
          onClick={() => setTab('browse')}
        >
          Browse All
        </button>
        <button
          className={`challenge-tab ${tab === 'mine' ? 'challenge-tab--active' : ''}`}
          onClick={() => setTab('mine')}
        >
          My Challenges ({myChallenges.length})
        </button>
      </div>

      {/* Type filters */}
      <div className="challenge-filters">
        {(['all', 'community', 'seasonal', 'head-to-head', 'personal'] as const).map((t) => (
          <button
            key={t}
            className={`challenge-filter ${filter === t ? 'challenge-filter--active' : ''}`}
            onClick={() => setFilter(t)}
          >
            {t === 'all' ? '🔥 All' : `${TYPE_ICONS[t]} ${TYPE_LABELS[t]}`}
          </button>
        ))}
      </div>

      {status === 'loading' && !challenges.length && <p className="loading-text">Loading challenges...</p>}
      {status === 'error' && (
        <div className="error-state">
          <h2>Something went wrong</h2>
          <p>{error}</p>
          <button className="vf-btn vf-btn--primary" onClick={() => dispatch(fetchChallenges())}>Try again</button>
        </div>
      )}

      {filtered.length === 0 && status === 'idle' && (
        <div className="social-empty">
          <p className="social-empty__icon">{tab === 'mine' ? '🏁' : '🏋️'}</p>
          <h3>{tab === 'mine' ? 'No active challenges' : 'No challenges found'}</h3>
          <p>{tab === 'mine' ? 'Join a challenge to get started!' : 'Check back for new challenges'}</p>
        </div>
      )}

      <div className="challenge-grid">
        {filtered.map((c) => (
          <ChallengeCard
            key={c.id}
            challenge={c}
            joined={myIds.has(c.id)}
            onView={() => handleView(c.id)}
            onJoin={() => dispatch(joinChallenge(c.id))}
            onLeave={() => dispatch(leaveChallenge(c.id))}
          />
        ))}
      </div>

      {selected && <ChallengeDetailPanel onClose={() => dispatch(clearSelected())} />}
    </div>
  );
}
