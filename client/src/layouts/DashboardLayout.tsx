import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FiLogOut } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import LanguageSwitcher from '../components/LanguageSwitcher';
import MobileBottomNav from '../components/MobileBottomNav';
import { cx } from '../utils/format';

interface NavItem {
  to: string;
  labelKey: string;
  icon: ReactNode;
  end?: boolean;
}

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [pathname]);
  return null;
}

/**
 * Layout for every signed-in area. Renders a desktop sidebar plus a bottom tab
 * bar on mobile, which is the pattern rural first-time users navigate best.
 */
export default function DashboardLayout({
  items,
  title,
  subtitle,
  actions,
  children,
}: {
  items: NavItem[];
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
  children?: ReactNode;
}) {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const navClass = ({ isActive }: { isActive: boolean }) =>
    cx(
      'flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
      isActive ? 'bg-brand-600 text-white' : 'text-neutral-700 hover:bg-neutral-100'
    );

  return (
    <div className="min-h-screen bg-neutral-50">
      <ScrollToTop />
      <Header />

      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6 sm:px-6">
        <aside className="hidden w-60 shrink-0 lg:block">
          <div className="sticky top-20 space-y-4">
            <div className="card p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                {t('nav.dashboard')}
              </p>
              <p className="mt-1 truncate text-sm font-bold text-neutral-900">
                {user?.name || user?.phone}
              </p>
            </div>
            <nav className="card space-y-1 p-2">
              {items.map((item) => (
                <NavLink key={item.to} to={item.to} className={navClass} end={item.end}>
                  <span className="flex h-4 w-4 items-center justify-center text-base leading-none" aria-hidden>
                    {item.icon}
                  </span>
                  {t(item.labelKey)}
                </NavLink>
              ))}
              <button
                type="button"
                onClick={logout}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50"
              >
                <span className="flex h-4 w-4 items-center justify-center text-base leading-none" aria-hidden>
                  <FiLogOut />
                </span>
                {t('nav.logout')}
              </button>
            </nav>
            <LanguageSwitcher />
          </div>
        </aside>

        <main className="min-w-0 flex-1 pb-24 lg:pb-0">
          {(title || actions) && (
            <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
              <div>
                {title && <h1 className="page-title">{title}</h1>}
                {subtitle && <p className="mt-1 text-sm text-neutral-600">{subtitle}</p>}
              </div>
              {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
            </div>
          )}
          {children ?? <Outlet />}
        </main>
      </div>

      <MobileBottomNav />
    </div>
  );
}

export type { NavItem };
