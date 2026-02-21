import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import exercisesReducer from './exercisesSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    exercises: exercisesReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
