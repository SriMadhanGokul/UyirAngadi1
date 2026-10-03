import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import LanguageSwitcher from './LanguageSwitcher';
import { cx } from '../utils/format';

export default function Header() {
  const { t } = useTranslation();
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
    navigate('/');
  };

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    cx(
      'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
      isActive ? 'bg-brand-50 text-brand-700' : 'text-neutral-700 hover:bg-neutral-100'
    );

  return (
    <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6">
        <Link to="/" className="flex shrink-0 items-center gap-2" onClick={() => setMenuOpen(false)}>
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-600 text-lg text-white">
            🐾
          </span>
          <span className="leading-tight">
            <span className="block text-base font-extrabold tracking-tight text-brand-700">
              {t('brand.name')}
            </span>
            <span className="hidden text-[10px] font-medium text-neutral-500 sm:block">
              {t('brand.tagline')}
            </span>
          </span>
        </Link>

        <nav className="ml-4 hidden items-center gap-1 md:flex">
          <NavLink to="/" className={linkClass} end>
            {t('nav.home')}
          </NavLink>
          <NavLink to="/listings" className={linkClass}>
            {t('nav.search')}
          </NavLink>
          {isAuthenticated && (
            <NavLink to="/favourites" className={linkClass}>
              {t('nav.favourites')}
            </NavLink>
          )}
          {isAuthenticated && !isAdmin && (
            <NavLink to="/dashboard" className={linkClass}>
              {t('nav.sellerDashboard')}
            </NavLink>
          )}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <div className="hidden sm:block">
            <LanguageSwitcher compact />
          </div>

          <Link to="/sell" className="btn-accent btn-sm hidden sm:inline-flex">
            + {t('nav.sellShort')}
          </Link>
          {isAuthenticated ? (
            <div className="relative hidden md:block">
              <Link
                to={isAdmin ? '/admin' : '/dashboard'}
                className="flex items-center gap-2 rounded-full border border-neutral-300 py-1 pl-1 pr-3 hover:bg-neutral-50"
              >
                <span className="grid h-7 w-7 place-items-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">
                  {(user?.name || user?.phone || 'U').trim().charAt(0).toUpperCase()}
                </span>
                <span className="max-w-[9rem] truncate text-sm font-medium text-neutral-700">
                  {user?.name || t('nav.profile')}
                </span>
              </Link>
            </div>
          ) : (
            <Link to="/login" className="btn-outline btn-sm hidden md:inline-flex">
              {t('nav.login')}
            </Link>
          )}

          <button
            type="button"
            className="rounded-lg p-2 text-neutral-700 hover:bg-neutral-100 md:hidden"
            aria-label={t('nav.menu')}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="border-t border-neutral-200 bg-white md:hidden">
          <nav className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-3">
            <NavLink to="/" className={linkClass} end onClick={() => setMenuOpen(false)}>
              {t('nav.home')}
            </NavLink>
            <NavLink to="/listings" className={linkClass} onClick={() => setMenuOpen(false)}>
              {t('nav.search')}
            </NavLink>
            <Link to="/sell" className="btn-accent mt-1" onClick={() => setMenuOpen(false)}>
              + {t('nav.sell')}
            </Link>
            <div className="my-2 border-t border-neutral-200" />
            <LanguageSwitcher />
            <div className="my-2 border-t border-neutral-200" />
            {isAuthenticated ? (
              <>
                {isAdmin && (
                  <Link
                    to="/admin"
                    className="rounded-lg px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
                    onClick={() => setMenuOpen(false)}
                  >
                    {t('nav.adminDashboard')}
                  </Link>
                )}
                <Link to="/favourites" className="rounded-lg px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100" onClick={() => setMenuOpen(false)}>
                  {t('nav.favourites')}
                </Link>
                {!isAdmin && (
                  <Link to="/dashboard" className="btn-outline btn-sm mt-1" onClick={() => setMenuOpen(false)}>
                    {t('nav.sellerDashboard')}
                  </Link>
                )}
                <Link to="/profile" className="rounded-lg px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100" onClick={() => setMenuOpen(false)}>
                  {t('nav.profile')}
                </Link>
                <button type="button" className="btn-ghost justify-start" onClick={handleLogout}>
                  {t('nav.logout')}
                </button>
              </>
            ) : (
              <Link to="/login" className="btn-primary" onClick={() => setMenuOpen(false)}>
                {t('nav.login')}
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
