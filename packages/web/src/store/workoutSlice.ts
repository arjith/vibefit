import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../lib/api';

interface WorkoutSet {
  id: string;
  exerciseId: string;
  setNumber: number;
  weight: number;
  reps: number;
  rpe: number | null;
  completedAt: string;
  isWarmup: boolean;
  isDropSet: boolean;
}

interface WorkoutSession {
  id: string;
  userId: string;
  routineId: string;
  weekNumber: number;
  dayNumber: number;
  status: string;
  startedAt: string | null;
  completedAt: string | null;
  pausedAt: string | null;
  totalDurationSec: number;
  rpe: number | null;
  mood: number | null;
  notes: string | null;
  sets?: WorkoutSet[];
  createdAt: string;
}

interface WorkoutState {
  sessions: WorkoutSession[];
  activeSession: WorkoutSession | null;
  status: 'idle' | 'loading' | 'loaded' | 'error';
  error: string | null;
}

const initialState: WorkoutState = {
  sessions: [],
  activeSession: null,
  status: 'idle',
  error: null,
};

export const fetchSessions = createAsyncThunk('workout/fetchSessions', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/workouts');
    return data.data as WorkoutSession[];
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.error?.message ?? 'Failed to load sessions');
  }
});

export const fetchSession = createAsyncThunk('workout/fetchSession', async (id: string, { rejectWithValue }) => {
  try {
    const { data } = await api.get(`/workouts/${id}`);
    return data.data as WorkoutSession;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.error?.message ?? 'Failed to load session');
  }
});

export const startWorkout = createAsyncThunk(
  'workout/start',
  async (payload: { routineId: string; weekNumber: number; dayNumber: number }, { rejectWithValue }) => {
    try {
      const { data } = await api.post('/workouts/start', payload);
      return data.data as WorkoutSession;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error?.message ?? 'Failed to start workout');
    }
  }
);

export const logSet = createAsyncThunk(
  'workout/logSet',
  async (payload: { sessionId: string; exerciseId: string; setNumber: number; weight: number; reps: number; rpe?: number; isWarmup?: boolean; isDropSet?: boolean }, { rejectWithValue }) => {
    try {
      const { sessionId, ...body } = payload;
      const { data } = await api.post(`/workouts/${sessionId}/sets`, body);
      return data.data as WorkoutSet;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error?.message ?? 'Failed to log set');
    }
  }
);

export const pauseWorkout = createAsyncThunk('workout/pause', async (sessionId: string, { rejectWithValue }) => {
  try {
    const { data } = await api.put(`/workouts/${sessionId}/pause`);
    return data.data as WorkoutSession;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.error?.message ?? 'Failed to pause');
  }
});

export const resumeWorkout = createAsyncThunk('workout/resume', async (sessionId: string, { rejectWithValue }) => {
  try {
    const { data } = await api.put(`/workouts/${sessionId}/resume`);
    return data.data as WorkoutSession;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.error?.message ?? 'Failed to resume');
  }
});

export const completeWorkout = createAsyncThunk(
  'workout/complete',
  async (payload: { sessionId: string; rpe?: number; mood?: number; notes?: string; totalDurationSec: number }, { rejectWithValue }) => {
    try {
      const { sessionId, ...body } = payload;
      const { data } = await api.put(`/workouts/${sessionId}/complete`, body);
      return data.data as WorkoutSession;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error?.message ?? 'Failed to complete workout');
    }
  }
);

const workoutSlice = createSlice({
  name: 'workout',
  initialState,
  reducers: {
    clearActiveSession(state) {
      state.activeSession = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch sessions list
    builder.addCase(fetchSessions.pending, (state) => { state.status = 'loading'; });
    builder.addCase(fetchSessions.fulfilled, (state, action) => { state.status = 'loaded'; state.sessions = action.payload; });
    builder.addCase(fetchSessions.rejected, (state, action) => { state.status = 'error'; state.error = action.payload as string; });

    // Fetch single session
    builder.addCase(fetchSession.fulfilled, (state, action) => { state.activeSession = action.payload; });

    // Start workout
    builder.addCase(startWorkout.fulfilled, (state, action) => {
      state.activeSession = action.payload;
      state.sessions.unshift(action.payload);
    });

    // Log set — append to active session's sets
    builder.addCase(logSet.fulfilled, (state, action) => {
      if (state.activeSession) {
        if (!state.activeSession.sets) state.activeSession.sets = [];
        state.activeSession.sets.push(action.payload);
      }
    });

    // Pause / Resume / Complete
    builder.addCase(pauseWorkout.fulfilled, (state, action) => { state.activeSession = action.payload; });
    builder.addCase(resumeWorkout.fulfilled, (state, action) => { state.activeSession = action.payload; });
    builder.addCase(completeWorkout.fulfilled, (state, action) => {
      state.activeSession = action.payload;
      const idx = state.sessions.findIndex((s) => s.id === action.payload.id);
      if (idx !== -1) state.sessions[idx] = action.payload;
    });
  },
});

export const { clearActiveSession } = workoutSlice.actions;
export default workoutSlice.reducer;
