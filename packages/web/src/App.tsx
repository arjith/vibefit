import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from './hooks/useRedux';
import { fetchMe } from './store/authSlice';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Exercises } from './pages/Exercises';
import { ExerciseDetail } from './pages/ExerciseDetail';
import { Cardio } from './pages/Cardio';
import { CardioDetail } from './pages/CardioDetail';
import { Routines } from './pages/Routines';
import { RoutineDetail } from './pages/RoutineDetail';
import { Onboarding } from './pages/Onboarding';
import { WorkoutExecution } from './pages/WorkoutExecution';
import { Achievements } from './pages/Achievements';
import { Analytics } from './pages/Analytics';
import { Recaps } from './pages/Recaps';
import { Coach } from './pages/Coach';
import { Subscription } from './pages/Subscription';

function RequireAuth({ children }: { children: React.ReactNode }) {
  const status = useAppSelector((s) => s.auth.status);
  if (status === 'loading') return null;
  if (status !== 'authenticated') return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export function App() {
  const dispatch = useAppDispatch();
  const authStatus = useAppSelector((s) => s.auth.status);

  useEffect(() => {
    if (authStatus === 'loading') {
      dispatch(fetchMe());
    }
  }, [dispatch, authStatus]);

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/exercises" element={<Exercises />} />
        <Route path="/exercises/:id" element={<ExerciseDetail />} />
        <Route path="/cardio" element={<Cardio />} />
        <Route path="/cardio/:id" element={<CardioDetail />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/routines" element={<RequireAuth><Routines /></RequireAuth>} />
        <Route path="/routines/:id" element={<RequireAuth><RoutineDetail /></RequireAuth>} />
        <Route path="/onboarding" element={<RequireAuth><Onboarding /></RequireAuth>} />
        <Route path="/workout/:routineId" element={<RequireAuth><WorkoutExecution /></RequireAuth>} />
        <Route path="/achievements" element={<RequireAuth><Achievements /></RequireAuth>} />
        <Route path="/analytics" element={<RequireAuth><Analytics /></RequireAuth>} />
        <Route path="/recaps" element={<RequireAuth><Recaps /></RequireAuth>} />
        <Route path="/coach" element={<RequireAuth><Coach /></RequireAuth>} />
        <Route path="/subscription" element={<RequireAuth><Subscription /></RequireAuth>} />
      </Route>
    </Routes>
  );
}
