import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from '../components/Header';
import MobileBottomNav from '../components/MobileBottomNav';
import { useAuth } from '../context/AuthContext';

/** Restores scroll position on every navigation (React Router keeps it otherwise). */
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [pathname]);
  return null;
}

export default function PublicLayout() {
  const { isAdmin } = useAuth();

  return (
    <div className="flex min-h-screen flex-col">
      <ScrollToTop />
      <Header />
      <main className={!isAdmin ? 'flex-1 pb-20 lg:pb-0' : 'flex-1'}>
        <Outlet />
      </main>
      <MobileBottomNav />
    </div>
  );
}
