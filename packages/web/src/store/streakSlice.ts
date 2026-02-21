import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { api } from '../lib/api';

interface StreakData {
  userId: string;
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string | null;
  freezesUsedThisWeek: number;
  freezesAvailable: number;
}

export interface StreakState {
  data: StreakData | null;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

const initialState: StreakState = {
  data: null,
  status: 'idle',
  error: null,
};

export const fetchStreak = createAsyncThunk('streak/fetch', async () => {
  const res = await api.get('/streaks');
  return res.data.data;
});

export const useStreakFreeze = createAsyncThunk('streak/freeze', async () => {
  const res = await api.post('/streaks/freeze');
  return res.data.data;
});

const streakSlice = createSlice({
  name: 'streak',
  initialState,
  reducers: {
    setStreak(state, action) {
      state.data = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchStreak.pending, (state) => { state.status = 'loading'; })
      .addCase(fetchStreak.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.data = action.payload;
      })
      .addCase(fetchStreak.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message ?? 'Failed to fetch streak';
      })
      .addCase(useStreakFreeze.fulfilled, (state, action) => {
        state.data = action.payload;
      });
  },
});

export const { setStreak } = streakSlice.actions;
export default streakSlice.reducer;
