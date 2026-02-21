import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import exercisesReducer from './exercisesSlice';
import cardioReducer from './cardioSlice';
import routinesReducer from './routinesSlice';
import profileReducer from './profileSlice';
import workoutReducer from './workoutSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    exercises: exercisesReducer,
    cardio: cardioReducer,
    routines: routinesReducer,
    profile: profileReducer,
    workout: workoutReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
