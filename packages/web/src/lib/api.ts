import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// Attach access token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('vibefit_access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auto-refresh on 401
let isRefreshing = false;
let pendingRequests: Array<(token: string) => void> = [];

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    if (error.response?.status === 401 && !original._retry) {
      if (isRefreshing) {
        return new Promise((resolve) => {
          pendingRequests.push((token: string) => {
            original.headers.Authorization = `Bearer ${token}`;
            resolve(api(original));
          });
        });
      }

      original._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = localStorage.getItem('vibefit_refresh_token');
        if (!refreshToken) throw new Error('No refresh token');

        const { data } = await axios.post('/api/auth/refresh', { refreshToken });
        const newToken = data.data.tokens.accessToken;

        localStorage.setItem('vibefit_access_token', newToken);
        localStorage.setItem('vibefit_refresh_token', data.data.tokens.refreshToken);

        pendingRequests.forEach((cb) => cb(newToken));
        pendingRequests = [];

        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      } catch {
        localStorage.removeItem('vibefit_access_token');
        localStorage.removeItem('vibefit_refresh_token');
        window.location.href = '/login';
        return Promise.reject(error);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export { api };
