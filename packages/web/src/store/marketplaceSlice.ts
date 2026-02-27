import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { CoachProgram, ProgramReview } from '@vibefit/shared';

const API = '/api/marketplace';

export interface ProgramDetail extends CoachProgram {
  reviews: ProgramReview[];
}

export interface MarketplaceState {
  programs: CoachProgram[];
  myPrograms: CoachProgram[];
  selected: ProgramDetail | null;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

const initialState: MarketplaceState = {
  programs: [],
  myPrograms: [],
  selected: null,
  status: 'idle',
  error: null,
};

export const fetchPrograms = createAsyncThunk(
  'marketplace/fetchPrograms',
  async (params?: { category?: string; difficulty?: string; sort?: string }) => {
    const sp = new URLSearchParams();
    if (params?.category) sp.set('category', params.category);
    if (params?.difficulty) sp.set('difficulty', params.difficulty);
    if (params?.sort) sp.set('sort', params.sort);
    const res = await fetch(`${API}?${sp}`);
    const json = await res.json();
    return json.data as CoachProgram[];
  },
);

export const fetchProgramDetail = createAsyncThunk(
  'marketplace/fetchProgramDetail',
  async (id: string) => {
    const res = await fetch(`${API}/${id}`);
    const json = await res.json();
    return json.data as ProgramDetail;
  },
);

export const fetchMyPrograms = createAsyncThunk(
  'marketplace/fetchMyPrograms',
  async () => {
    const res = await fetch(`${API}/my/programs`, { credentials: 'include' });
    const json = await res.json();
    return json.data as CoachProgram[];
  },
);

export const createProgram = createAsyncThunk(
  'marketplace/createProgram',
  async (data: {
    name: string;
    description: string;
    price: number;
    durationWeeks: number;
    difficulty: string;
    category: string;
    routineId?: string;
  }) => {
    const res = await fetch(`${API}/my/programs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    const json = await res.json();
    return json.data as CoachProgram;
  },
);

export const togglePublish = createAsyncThunk(
  'marketplace/togglePublish',
  async (id: string) => {
    const res = await fetch(`${API}/my/programs/${id}/publish`, {
      method: 'POST',
      credentials: 'include',
    });
    const json = await res.json();
    return { id, isPublished: json.data.isPublished as boolean };
  },
);

export const enrollProgram = createAsyncThunk(
  'marketplace/enrollProgram',
  async (id: string) => {
    const res = await fetch(`${API}/${id}/enroll`, {
      method: 'POST',
      credentials: 'include',
    });
    const json = await res.json();
    return { id, enrolled: json.data.enrolled as boolean };
  },
);

export const submitReview = createAsyncThunk(
  'marketplace/submitReview',
  async ({ programId, rating, comment }: { programId: string; rating: number; comment?: string }) => {
    const res = await fetch(`${API}/${programId}/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ rating, comment }),
    });
    const json = await res.json();
    return { programId, rating: json.data.rating as number };
  },
);

const marketplaceSlice = createSlice({
  name: 'marketplace',
  initialState,
  reducers: {
    clearSelected(state) {
      state.selected = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPrograms.pending, (state) => { state.status = 'loading'; })
      .addCase(fetchPrograms.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.programs = action.payload;
      })
      .addCase(fetchPrograms.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message ?? 'Failed to fetch programs';
      })
      .addCase(fetchProgramDetail.fulfilled, (state, action) => {
        state.selected = action.payload;
      })
      .addCase(fetchMyPrograms.fulfilled, (state, action) => {
        state.myPrograms = action.payload;
      })
      .addCase(createProgram.fulfilled, (state, action) => {
        state.myPrograms.unshift(action.payload);
      })
      .addCase(togglePublish.fulfilled, (state, action) => {
        const p = state.myPrograms.find((x) => x.id === action.payload.id);
        if (p) p.isPublished = action.payload.isPublished;
      })
      .addCase(enrollProgram.fulfilled, (state, action) => {
        const p = state.programs.find((x) => x.id === action.payload.id);
        if (p) p.enrollmentCount += 1;
        if (state.selected && state.selected.id === action.payload.id) {
          state.selected.enrollmentCount += 1;
        }
      });
  },
});

export const { clearSelected } = marketplaceSlice.actions;
export default marketplaceSlice.reducer;
