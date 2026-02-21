import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../lib/api';

interface CardioActivity {
  id: string;
  name: string;
  category: string;
  funRating: number;
  intensityLevel: string;
  caloriesPerHour: number;
  durationMin: number;
  description: string;
  howToStart: string;
  imageUrl: string;
  tags: string[];
}

interface CardioFilters {
  search: string;
  category: string;
  intensity: string;
}

interface CardioMeta {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

interface CardioState {
  items: CardioActivity[];
  selected: CardioActivity | null;
  filters: CardioFilters;
  meta: CardioMeta;
  status: 'idle' | 'loading' | 'loaded' | 'error';
  error: string | null;
}

const initialState: CardioState = {
  items: [],
  selected: null,
  filters: { search: '', category: '', intensity: '' },
  meta: { total: 0, page: 1, pageSize: 24, totalPages: 0 },
  status: 'idle',
  error: null,
};

export const fetchCardio = createAsyncThunk(
  'cardio/fetch',
  async (params: { page?: number; search?: string; category?: string; intensity?: string } = {}, { rejectWithValue }) => {
    try {
      const query = new URLSearchParams();
      if (params.page) query.set('page', String(params.page));
      if (params.search) query.set('search', params.search);
      if (params.category) query.set('category', params.category);
      if (params.intensity) query.set('intensity', params.intensity);

      const { data } = await api.get(`/cardio?${query}`);
      return { items: data.data as CardioActivity[], meta: data.meta as CardioMeta };
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error?.message ?? 'Failed to load cardio activities');
    }
  }
);

export const fetchCardioById = createAsyncThunk(
  'cardio/fetchById',
  async (id: string, { rejectWithValue }) => {
    try {
      const { data } = await api.get(`/cardio/${id}`);
      return data.data as CardioActivity;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error?.message ?? 'Activity not found');
    }
  }
);

const cardioSlice = createSlice({
  name: 'cardio',
  initialState,
  reducers: {
    setCardioFilters(state, action) {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearSelectedCardio(state) {
      state.selected = null;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchCardio.pending, (state) => { state.status = 'loading'; state.error = null; });
    builder.addCase(fetchCardio.fulfilled, (state, action) => {
      state.status = 'loaded';
      state.items = action.payload.items;
      state.meta = action.payload.meta;
    });
    builder.addCase(fetchCardio.rejected, (state, action) => { state.status = 'error'; state.error = action.payload as string; });
    builder.addCase(fetchCardioById.fulfilled, (state, action) => { state.selected = action.payload; });
  },
});

export const { setCardioFilters, clearSelectedCardio } = cardioSlice.actions;
export default cardioSlice.reducer;
