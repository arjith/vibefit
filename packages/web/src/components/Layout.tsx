import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../hooks/useRedux';
import { logout } from '../store/authSlice';
import { useState } from 'react';

export function Layout() {
  const { user, status } = useAppSelector((s) => s.auth);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const isAuth = status === 'authenticated';

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/exercises', label: 'Exercises' },
    { to: '/cardio', label: 'Cardio' },
    ...(isAuth ? [{ to: '/routines', label: 'Routines' }] : []),
  ];

  return (
    <div className="vf-layout">
      <header className="vf-header">
        <div className="vf-header__inner">
          <NavLink to="/" className="vf-logo">
            <span className="vf-logo__icon">⚡</span>
            <span className="vf-logo__text">VibeFit</span>
          </NavLink>

          <nav className={`vf-nav ${menuOpen ? 'vf-nav--open' : ''}`} aria-label="Main navigation">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) => `vf-nav__link ${isActive ? 'vf-nav__link--active' : ''}`}
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          <div className="vf-header__actions">
            {isAuth ? (
              <div className="vf-header__user">
                <span className="vf-header__name">{user?.name}</span>
                <button className="vf-btn vf-btn--ghost vf-btn--sm" onClick={handleLogout}>
                  Log out
                </button>
              </div>
            ) : (
              <NavLink to="/login" className="vf-btn vf-btn--primary vf-btn--sm">
                Sign in
              </NavLink>
            )}

            <button
              className="vf-hamburger"
              onClick={() => setMenuOpen((p) => !p)}
              aria-label="Toggle navigation"
              aria-expanded={menuOpen}
            >
              <span />
              <span />
              <span />
            </button>
          </div>
        </div>
      </header>

      <main className="vf-main">
        <Outlet />
      </main>
    </div>
  );
}
