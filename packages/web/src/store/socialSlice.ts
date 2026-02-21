import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../lib/api';

// ─── Types ───────────────────────────────────────────────────
export interface FeedPost {
  id: string;
  userId: string;
  type: 'workout_complete' | 'pr' | 'achievement' | 'streak_milestone' | 'general';
  content: string | null;
  metadata: Record<string, unknown>;
  visibility: string;
  createdAt: string;
  userName: string;
  userAvatar: string | null;
  kudosCount: number;
  commentCount: number;
  hasKudos: boolean;
}

export interface SocialUser {
  id?: string;
  userId?: string;
  name: string;
  avatarUrl: string | null;
  followedAt?: string;
}

export interface Comment {
  id: string;
  userId: string;
  content: string;
  createdAt: string;
  userName: string;
  userAvatar: string | null;
}

export interface SocialState {
  feed: FeedPost[];
  following: SocialUser[];
  followers: SocialUser[];
  searchResults: SocialUser[];
  comments: Record<string, Comment[]>;
  status: 'idle' | 'loading' | 'error';
  error: string | null;
}

const initialState: SocialState = {
  feed: [],
  following: [],
  followers: [],
  searchResults: [],
  comments: {},
  status: 'idle',
  error: null,
};

// ─── Thunks ──────────────────────────────────────────────────
export const fetchFeed = createAsyncThunk('social/fetchFeed', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/social/feed');
    return data.data as FeedPost[];
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.error?.message ?? 'Failed to load feed');
  }
});

export const fetchFollowing = createAsyncThunk('social/fetchFollowing', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/social/following');
    return data.data as SocialUser[];
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.error?.message ?? 'Failed to load following');
  }
});

export const fetchFollowers = createAsyncThunk('social/fetchFollowers', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/social/followers');
    return data.data as SocialUser[];
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.error?.message ?? 'Failed to load followers');
  }
});

export const followUser = createAsyncThunk('social/followUser', async (userId: string, { rejectWithValue }) => {
  try {
    await api.post(`/social/follow/${encodeURIComponent(userId)}`);
    return userId;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.error?.message ?? 'Failed to follow user');
  }
});

export const unfollowUser = createAsyncThunk('social/unfollowUser', async (userId: string, { rejectWithValue }) => {
  try {
    await api.delete(`/social/follow/${encodeURIComponent(userId)}`);
    return userId;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.error?.message ?? 'Failed to unfollow user');
  }
});

export const createPost = createAsyncThunk(
  'social/createPost',
  async (body: { type: FeedPost['type']; content?: string; visibility?: string }, { rejectWithValue }) => {
    try {
      const { data } = await api.post('/social/posts', body);
      return data.data as FeedPost;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error?.message ?? 'Failed to create post');
    }
  },
);

export const toggleKudos = createAsyncThunk(
  'social/toggleKudos',
  async ({ postId, hasKudos }: { postId: string; hasKudos: boolean }, { rejectWithValue }) => {
    try {
      if (hasKudos) {
        await api.delete(`/social/posts/${encodeURIComponent(postId)}/kudos`);
      } else {
        await api.post(`/social/posts/${encodeURIComponent(postId)}/kudos`);
      }
      return { postId, hasKudos: !hasKudos };
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error?.message ?? 'Failed to toggle kudos');
    }
  },
);

export const fetchComments = createAsyncThunk(
  'social/fetchComments',
  async (postId: string, { rejectWithValue }) => {
    try {
      const { data } = await api.get(`/social/posts/${encodeURIComponent(postId)}/comments`);
      return { postId, comments: data.data as Comment[] };
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error?.message ?? 'Failed to load comments');
    }
  },
);

export const addComment = createAsyncThunk(
  'social/addComment',
  async ({ postId, content }: { postId: string; content: string }, { rejectWithValue }) => {
    try {
      const { data } = await api.post(`/social/posts/${encodeURIComponent(postId)}/comments`, { content });
      return { postId, comment: data.data as Comment };
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error?.message ?? 'Failed to add comment');
    }
  },
);

export const searchUsers = createAsyncThunk('social/searchUsers', async (q: string, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/social/search', { params: { q } });
    return data.data as SocialUser[];
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.error?.message ?? 'Search failed');
  }
});

// ─── Slice ───────────────────────────────────────────────────
const socialSlice = createSlice({
  name: 'social',
  initialState,
  reducers: {
    clearSearch(state) {
      state.searchResults = [];
    },
  },
  extraReducers: (builder) => {
    // Feed
    builder.addCase(fetchFeed.pending, (state) => { state.status = 'loading'; state.error = null; });
    builder.addCase(fetchFeed.fulfilled, (state, action) => { state.status = 'idle'; state.feed = action.payload; });
    builder.addCase(fetchFeed.rejected, (state, action) => { state.status = 'error'; state.error = action.payload as string; });

    // Following
    builder.addCase(fetchFollowing.fulfilled, (state, action) => { state.following = action.payload; });

    // Followers
    builder.addCase(fetchFollowers.fulfilled, (state, action) => { state.followers = action.payload; });

    // Follow
    builder.addCase(followUser.fulfilled, (state, action) => {
      const user = state.searchResults.find((u) => (u.id ?? u.userId) === action.payload);
      if (user) state.following.push(user);
    });

    // Unfollow
    builder.addCase(unfollowUser.fulfilled, (state, action) => {
      state.following = state.following.filter((u) => (u.userId ?? u.id) !== action.payload);
    });

    // Create post
    builder.addCase(createPost.fulfilled, (state, action) => {
      state.feed.unshift({ ...action.payload, kudosCount: 0, commentCount: 0, hasKudos: false });
    });

    // Toggle kudos
    builder.addCase(toggleKudos.fulfilled, (state, action) => {
      const post = state.feed.find((p) => p.id === action.payload.postId);
      if (post) {
        post.hasKudos = action.payload.hasKudos;
        post.kudosCount += action.payload.hasKudos ? 1 : -1;
      }
    });

    // Comments
    builder.addCase(fetchComments.fulfilled, (state, action) => {
      state.comments[action.payload.postId] = action.payload.comments;
    });
    builder.addCase(addComment.fulfilled, (state, action) => {
      const { postId, comment } = action.payload;
      if (!state.comments[postId]) state.comments[postId] = [];
      state.comments[postId].push(comment);
      const post = state.feed.find((p) => p.id === postId);
      if (post) post.commentCount += 1;
    });

    // Search
    builder.addCase(searchUsers.fulfilled, (state, action) => { state.searchResults = action.payload; });
  },
});

export const { clearSearch } = socialSlice.actions;
export default socialSlice.reducer;
