import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import exercisesReducer from './exercisesSlice';
import cardioReducer from './cardioSlice';
import routinesReducer from './routinesSlice';
import profileReducer from './profileSlice';
import workoutReducer from './workoutSlice';
import toastReducer from './toastSlice';
import streakReducer from './streakSlice';
import socialReducer from './socialSlice';
import challengesReducer from './challengesSlice';
import marketplaceReducer from './marketplaceSlice';
import { achievementsPageReducer } from '../pages/Achievements';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    exercises: exercisesReducer,
    cardio: cardioReducer,
    routines: routinesReducer,
    profile: profileReducer,
    workout: workoutReducer,
    toast: toastReducer,
    streak: streakReducer,
    social: socialReducer,
    challenges: challengesReducer,
    marketplace: marketplaceReducer,
    _achievementsPage: achievementsPageReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
