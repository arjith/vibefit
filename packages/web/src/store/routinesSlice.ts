import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../lib/api';
import type { Routine, RoutineWeek } from '@vibefit/shared';

type SavedRoutine = Routine;

interface RoutinePreview {
  name: string;
  goal: string;
  daysPerWeek: number;
  sessionDurationMin: number;
  fitnessLevel: string;
  availableEquipment: string[];
  totalWeeks: number;
  weeks: RoutineWeek[];
}

export interface GenerateRequest {
  goal: string;
  daysPerWeek: number;
  sessionDurationMin: number;
  fitnessLevel: string;
  availableEquipment: string[];
  totalWeeks?: number;
}

export interface RoutinesState {
  list: SavedRoutine[];
  selected: SavedRoutine | null;
  preview: RoutinePreview | null;
  status: 'idle' | 'loading' | 'loaded' | 'error';
  previewStatus: 'idle' | 'loading' | 'loaded' | 'error';
  error: string | null;
}

const initialState: RoutinesState = {
  list: [],
  selected: null,
  preview: null,
  status: 'idle',
  previewStatus: 'idle',
  error: null,
};

// ─── Thunks ──────────────────────────────────────────────────
export const fetchRoutines = createAsyncThunk(
  'routines/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/routines');
      return data.data as SavedRoutine[];
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error?.message ?? 'Failed to load routines');
    }
  }
);

export const fetchRoutineById = createAsyncThunk(
  'routines/fetchById',
  async (id: string, { rejectWithValue }) => {
    try {
      const { data } = await api.get(`/routines/${id}`);
      return data.data as SavedRoutine;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error?.message ?? 'Routine not found');
    }
  }
);

export const previewRoutine = createAsyncThunk(
  'routines/preview',
  async (request: GenerateRequest, { rejectWithValue }) => {
    try {
      const { data } = await api.post('/routines/preview', request);
      return data.data as RoutinePreview;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error?.message ?? 'Failed to generate preview');
    }
  }
);

export const generateRoutine = createAsyncThunk(
  'routines/generate',
  async (request: GenerateRequest, { rejectWithValue }) => {
    try {
      const { data } = await api.post('/routines/generate', request);
      return data.data as SavedRoutine;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error?.message ?? 'Failed to save routine');
    }
  }
);

export const deleteRoutine = createAsyncThunk(
  'routines/delete',
  async (id: string, { rejectWithValue }) => {
    try {
      await api.delete(`/routines/${id}`);
      return id;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error?.message ?? 'Failed to delete routine');
    }
  }
);

export const duplicateRoutine = createAsyncThunk(
  'routines/duplicate',
  async (id: string, { rejectWithValue }) => {
    try {
      const { data } = await api.post(`/routines/${id}/duplicate`);
      return data.data as SavedRoutine;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error?.message ?? 'Failed to duplicate routine');
    }
  }
);

// ─── Slice ───────────────────────────────────────────────────
const routinesSlice = createSlice({
  name: 'routines',
  initialState,
  reducers: {
    clearPreview(state) { state.preview = null; state.previewStatus = 'idle'; },
    clearSelectedRoutine(state) { state.selected = null; },
  },
  extraReducers: (builder) => {
    // Fetch all
    builder.addCase(fetchRoutines.pending, (state) => { state.status = 'loading'; state.error = null; });
    builder.addCase(fetchRoutines.fulfilled, (state, action) => { state.status = 'loaded'; state.list = action.payload; });
    builder.addCase(fetchRoutines.rejected, (state, action) => { state.status = 'error'; state.error = action.payload as string; });

    // Fetch by id
    builder.addCase(fetchRoutineById.fulfilled, (state, action) => { state.selected = action.payload; });

    // Preview
    builder.addCase(previewRoutine.pending, (state) => { state.previewStatus = 'loading'; state.error = null; });
    builder.addCase(previewRoutine.fulfilled, (state, action) => { state.previewStatus = 'loaded'; state.preview = action.payload; });
    builder.addCase(previewRoutine.rejected, (state, action) => { state.previewStatus = 'error'; state.error = action.payload as string; });

    // Generate (save)
    builder.addCase(generateRoutine.fulfilled, (state, action) => {
      state.list.push(action.payload);
      state.preview = null;
      state.previewStatus = 'idle';
    });

    // Delete
    builder.addCase(deleteRoutine.fulfilled, (state, action) => {
      state.list = state.list.filter((r) => r.id !== action.payload);
      if (state.selected?.id === action.payload) state.selected = null;
    });

    // Duplicate
    builder.addCase(duplicateRoutine.fulfilled, (state, action) => {
      state.list.push(action.payload);
    });
  },
});

export const { clearPreview, clearSelectedRoutine } = routinesSlice.actions;
export default routinesSlice.reducer;
