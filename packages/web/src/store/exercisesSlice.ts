import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../lib/api';

interface Exercise {
  id: string;
  name: string;
  muscleGroup: string;
  secondaryMuscles: string[];
  equipment: string;
  difficulty: string;
  instructions: string[];
  tips: string[];
  imageUrls: string[];
  tags: string[];
}

interface ExerciseFilters {
  search: string;
  muscleGroup: string;
  equipment: string;
  difficulty: string;
}

interface ExerciseMeta {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ExercisesState {
  items: Exercise[];
  selected: Exercise | null;
  filters: ExerciseFilters;
  meta: ExerciseMeta;
  status: 'idle' | 'loading' | 'loaded' | 'error';
  error: string | null;
}

const initialState: ExercisesState = {
  items: [],
  selected: null,
  filters: { search: '', muscleGroup: '', equipment: '', difficulty: '' },
  meta: { total: 0, page: 1, pageSize: 24, totalPages: 0 },
  status: 'idle',
  error: null,
};

export const fetchExercises = createAsyncThunk(
  'exercises/fetch',
  async (params: { page?: number; search?: string; muscleGroup?: string; equipment?: string; difficulty?: string } = {}, { rejectWithValue }) => {
    try {
      const query = new URLSearchParams();
      if (params.page) query.set('page', String(params.page));
      if (params.search) query.set('search', params.search);
      if (params.muscleGroup) query.set('muscleGroup', params.muscleGroup);
      if (params.equipment) query.set('equipment', params.equipment);
      if (params.difficulty) query.set('difficulty', params.difficulty);

      const { data } = await api.get(`/exercises?${query}`);
      return { items: data.data as Exercise[], meta: data.meta as ExerciseMeta };
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error?.message ?? 'Failed to load exercises');
    }
  }
);

export const fetchExerciseById = createAsyncThunk(
  'exercises/fetchById',
  async (id: string, { rejectWithValue }) => {
    try {
      const { data } = await api.get(`/exercises/${id}`);
      return data.data as Exercise;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error?.message ?? 'Exercise not found');
    }
  }
);

const exercisesSlice = createSlice({
  name: 'exercises',
  initialState,
  reducers: {
    setFilters(state, action) {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearSelected(state) {
      state.selected = null;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchExercises.pending, (state) => { state.status = 'loading'; state.error = null; });
    builder.addCase(fetchExercises.fulfilled, (state, action) => {
      state.status = 'loaded';
      state.items = action.payload.items;
      state.meta = action.payload.meta;
    });
    builder.addCase(fetchExercises.rejected, (state, action) => { state.status = 'error'; state.error = action.payload as string; });
    builder.addCase(fetchExerciseById.fulfilled, (state, action) => { state.selected = action.payload; });
  },
});

export const { setFilters, clearSelected } = exercisesSlice.actions;
export default exercisesSlice.reducer;
