import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from './hooks/useRedux';
import { fetchMe } from './store/authSlice';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Exercises } from './pages/Exercises';

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
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/routines" element={<RequireAuth><div>Routines — coming soon</div></RequireAuth>} />
      </Route>
    </Routes>
  );
}
