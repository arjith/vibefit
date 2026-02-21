import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { UserProfile } from '@vibefit/shared';
import { api } from '../lib/api';

interface ProfileState {
  profile: UserProfile | null;
  status: 'idle' | 'loading' | 'loaded' | 'error';
  error: string | null;
}

const initialState: ProfileState = {
  profile: null,
  status: 'idle',
  error: null,
};

export const fetchProfile = createAsyncThunk('profile/fetch', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/profile');
    return data.data as UserProfile;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.error?.message ?? 'Failed to load profile');
  }
});

export const updateProfile = createAsyncThunk('profile/update', async (updates: Partial<UserProfile>, { rejectWithValue }) => {
  try {
    const { data } = await api.put('/profile', updates);
    return data.data as UserProfile;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.error?.message ?? 'Failed to update profile');
  }
});

export const saveOnboardingStep = createAsyncThunk(
  'profile/onboardingStep',
  async (payload: { step: number; data: Record<string, unknown> }, { rejectWithValue }) => {
    try {
      const { data } = await api.put('/profile/onboarding', payload);
      return data.data as UserProfile;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error?.message ?? 'Failed to save onboarding step');
    }
  }
);

const profileSlice = createSlice({
  name: 'profile',
  initialState,
  reducers: {
    clearProfile(state) {
      state.profile = null;
      state.status = 'idle';
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchProfile.pending, (state) => { state.status = 'loading'; state.error = null; });
    builder.addCase(fetchProfile.fulfilled, (state, action) => { state.status = 'loaded'; state.profile = action.payload; });
    builder.addCase(fetchProfile.rejected, (state, action) => { state.status = 'error'; state.error = action.payload as string; });

    builder.addCase(updateProfile.fulfilled, (state, action) => { state.profile = action.payload; });

    builder.addCase(saveOnboardingStep.fulfilled, (state, action) => { state.profile = action.payload; });
  },
});

export const { clearProfile } = profileSlice.actions;
export default profileSlice.reducer;
