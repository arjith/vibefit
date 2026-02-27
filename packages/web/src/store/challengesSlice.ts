import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../lib/api';
import type { Challenge } from '@vibefit/shared';

// ─── Types ───────────────────────────────────────────────────
export interface LeaderboardEntry {
  userId: string;
  progress: number;
  joinedAt: string;
  userName: string;
  userAvatar: string | null;
}

export interface ChallengeDetail extends Challenge {
  leaderboard: LeaderboardEntry[];
}

export interface ChallengesState {
  challenges: Challenge[];
  myChallenges: Challenge[];
  selected: ChallengeDetail | null;
  status: 'idle' | 'loading' | 'error';
  error: string | null;
}

const initialState: ChallengesState = {
  challenges: [],
  myChallenges: [],
  selected: null,
  status: 'idle',
  error: null,
};

// ─── Thunks ──────────────────────────────────────────────────
export const fetchChallenges = createAsyncThunk('challenges/fetchAll', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/challenges');
    return data.data as Challenge[];
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.error?.message ?? 'Failed to load challenges');
  }
});

export const fetchMyChallenges = createAsyncThunk('challenges/fetchMy', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/challenges/my/active');
    return data.data as Challenge[];
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.error?.message ?? 'Failed to load your challenges');
  }
});

export const fetchChallengeDetail = createAsyncThunk('challenges/fetchDetail', async (id: string, { rejectWithValue }) => {
  try {
    const { data } = await api.get(`/challenges/${encodeURIComponent(id)}`);
    return data.data as ChallengeDetail;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.error?.message ?? 'Failed to load challenge');
  }
});

export const joinChallenge = createAsyncThunk('challenges/join', async (id: string, { rejectWithValue }) => {
  try {
    await api.post(`/challenges/${encodeURIComponent(id)}/join`);
    return id;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.error?.message ?? 'Failed to join challenge');
  }
});

export const leaveChallenge = createAsyncThunk('challenges/leave', async (id: string, { rejectWithValue }) => {
  try {
    await api.delete(`/challenges/${encodeURIComponent(id)}/leave`);
    return id;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.error?.message ?? 'Failed to leave challenge');
  }
});

export const updateProgress = createAsyncThunk(
  'challenges/updateProgress',
  async ({ id, increment }: { id: string; increment: number }, { rejectWithValue }) => {
    try {
      const { data } = await api.post(`/challenges/${encodeURIComponent(id)}/progress`, { increment });
      return { id, progress: data.data.currentProgress as number };
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error?.message ?? 'Failed to update progress');
    }
  },
);

// ─── Slice ───────────────────────────────────────────────────
const challengesSlice = createSlice({
  name: 'challenges',
  initialState,
  reducers: {
    clearSelected(state) {
      state.selected = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch all
    builder.addCase(fetchChallenges.pending, (state) => { state.status = 'loading'; state.error = null; });
    builder.addCase(fetchChallenges.fulfilled, (state, action) => { state.status = 'idle'; state.challenges = action.payload; });
    builder.addCase(fetchChallenges.rejected, (state, action) => { state.status = 'error'; state.error = action.payload as string; });

    // My challenges
    builder.addCase(fetchMyChallenges.fulfilled, (state, action) => { state.myChallenges = action.payload; });

    // Detail
    builder.addCase(fetchChallengeDetail.pending, (state) => { state.status = 'loading'; });
    builder.addCase(fetchChallengeDetail.fulfilled, (state, action) => { state.status = 'idle'; state.selected = action.payload; });
    builder.addCase(fetchChallengeDetail.rejected, (state, action) => { state.status = 'error'; state.error = action.payload as string; });

    // Join
    builder.addCase(joinChallenge.fulfilled, (state, action) => {
      const challenge = state.challenges.find((c) => c.id === action.payload);
      if (challenge) {
        challenge.participantCount += 1;
        state.myChallenges.push(challenge);
      }
    });

    // Leave
    builder.addCase(leaveChallenge.fulfilled, (state, action) => {
      const challenge = state.challenges.find((c) => c.id === action.payload);
      if (challenge) challenge.participantCount = Math.max(0, challenge.participantCount - 1);
      state.myChallenges = state.myChallenges.filter((c) => c.id !== action.payload);
    });

    // Update progress
    builder.addCase(updateProgress.fulfilled, (state, action) => {
      const { id, progress } = action.payload;
      const my = state.myChallenges.find((c) => c.id === id);
      if (my) my.currentProgress = progress;
      if (state.selected?.id === id) {
        state.selected.currentProgress = progress;
      }
    });
  },
});

export const { clearSelected } = challengesSlice.actions;
export default challengesSlice.reducer;
