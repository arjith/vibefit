import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../lib/api';

interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
}

export interface AuthState {
  user: AuthUser | null;
  status: 'idle' | 'loading' | 'authenticated' | 'error';
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  status: localStorage.getItem('vibefit_access_token') ? 'loading' : 'idle',
  error: null,
};

export const login = createAsyncThunk('auth/login', async (creds: { email: string; password: string }, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/auth/login', creds);
    localStorage.setItem('vibefit_access_token', data.data.tokens.accessToken);
    localStorage.setItem('vibefit_refresh_token', data.data.tokens.refreshToken);
    return data.data.user as AuthUser;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.error?.message ?? 'Login failed');
  }
});

export const register = createAsyncThunk('auth/register', async (creds: { email: string; password: string; name: string }, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/auth/register', creds);
    localStorage.setItem('vibefit_access_token', data.data.tokens.accessToken);
    localStorage.setItem('vibefit_refresh_token', data.data.tokens.refreshToken);
    return data.data.user as AuthUser;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.error?.message ?? 'Registration failed');
  }
});

export const fetchMe = createAsyncThunk('auth/fetchMe', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/auth/me');
    return data.data as AuthUser;
  } catch (err: any) {
    localStorage.removeItem('vibefit_access_token');
    localStorage.removeItem('vibefit_refresh_token');
    return rejectWithValue('Session expired');
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout(state) {
      state.user = null;
      state.status = 'idle';
      state.error = null;
      localStorage.removeItem('vibefit_access_token');
      localStorage.removeItem('vibefit_refresh_token');
    },
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Login
    builder.addCase(login.pending, (state) => { state.status = 'loading'; state.error = null; });
    builder.addCase(login.fulfilled, (state, action) => { state.status = 'authenticated'; state.user = action.payload; });
    builder.addCase(login.rejected, (state, action) => { state.status = 'error'; state.error = action.payload as string; });
    // Register
    builder.addCase(register.pending, (state) => { state.status = 'loading'; state.error = null; });
    builder.addCase(register.fulfilled, (state, action) => { state.status = 'authenticated'; state.user = action.payload; });
    builder.addCase(register.rejected, (state, action) => { state.status = 'error'; state.error = action.payload as string; });
    // Fetch me
    builder.addCase(fetchMe.pending, (state) => { state.status = 'loading'; });
    builder.addCase(fetchMe.fulfilled, (state, action) => { state.status = 'authenticated'; state.user = action.payload; });
    builder.addCase(fetchMe.rejected, (state) => { state.status = 'idle'; state.user = null; });
  },
});

export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer;
