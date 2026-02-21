import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../hooks/useRedux';
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { api } from '../lib/api';

// ─── Inline slice (co-located for simplicity) ────────────────
interface AchievementItem {
  id: string;
  name: string;
  description: string;
  category: string;
  rarity: string;
  progress: number;
  unlocked: boolean;
  unlockedAt: string | null;
}

const fetchAchievements = createAsyncThunk('achievements/fetch', async () => {
  const res = await api.get('/achievements');
  return res.data.data as AchievementItem[];
});

const RARITY_COLORS: Record<string, string> = {
  common: '#9ca3af',
  uncommon: '#22c55e',
  rare: '#3b82f6',
  legendary: '#f59e0b',
};

const CATEGORY_ICONS: Record<string, string> = {
  milestone: '🎯',
  streak: '🔥',
  variety: '🌈',
  strength: '💪',
  volume: '📊',
  habit: '⏰',
};

export function Achievements() {
  const dispatch = useAppDispatch();
  const achievements = useAppSelector((s: any) => s._achievementsPage);

  useEffect(() => {
    dispatch(fetchAchievements());
  }, [dispatch]);

  // We manage local state since this is a standalone page slice
  const items: AchievementItem[] = achievements?.items ?? [];
  const loading = achievements?.status === 'loading';

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">🏆 Achievements</h1>
          <p className="page-subtitle">
            {items.filter((a) => a.unlocked).length} / {items.length} unlocked
          </p>
        </div>
      </div>

      {loading && <p className="loading-text">Loading achievements...</p>}

      <div className="achievement-grid">
        {items.map((a) => (
          <div
            key={a.id}
            className={`achievement-card ${a.unlocked ? 'achievement-unlocked' : 'achievement-locked'}`}
          >
            <div className="achievement-icon">
              {CATEGORY_ICONS[a.category] ?? '⭐'}
            </div>
            <div className="achievement-info">
              <h3 className="achievement-name">{a.name}</h3>
              <p className="achievement-desc">{a.description}</p>
              <div className="achievement-meta">
                <span
                  className="achievement-rarity"
                  style={{ color: RARITY_COLORS[a.rarity] ?? '#9ca3af' }}
                >
                  {a.rarity}
                </span>
                {a.unlocked && a.unlockedAt && (
                  <span className="achievement-date">
                    {new Date(a.unlockedAt).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
            {!a.unlocked && (
              <div className="achievement-progress-bar">
                <div
                  className="achievement-progress-fill"
                  style={{ width: `${a.progress}%` }}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// Export the reducer for wiring
const achievementsPageSlice = createSlice({
  name: '_achievementsPage',
  initialState: { items: [] as AchievementItem[], status: 'idle' as string },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAchievements.pending, (state) => { state.status = 'loading'; })
      .addCase(fetchAchievements.fulfilled, (state, action) => {
        state.status = 'loaded';
        state.items = action.payload;
      })
      .addCase(fetchAchievements.rejected, (state) => { state.status = 'error'; });
  },
});

export const achievementsPageReducer = achievementsPageSlice.reducer;
