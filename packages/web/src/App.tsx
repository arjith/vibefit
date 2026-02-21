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
      </Route>
    </Routes>
  );
}
