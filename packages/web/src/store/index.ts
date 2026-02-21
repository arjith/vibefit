import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import exercisesReducer from './exercisesSlice';
import cardioReducer from './cardioSlice';
import routinesReducer from './routinesSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    exercises: exercisesReducer,
    cardio: cardioReducer,
    routines: routinesReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
