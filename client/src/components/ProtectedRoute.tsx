import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LoadingState } from './Feedback';

interface ProtectedRouteProps {
  children: ReactNode;
  /** When true the user must also have the ADMIN role. */
  adminOnly?: boolean;
}

/**
 * Gates dashboard routes. While the session is being restored it shows a
 * spinner (so we never bounce a logged-in user to /login), then redirects to
 * /login with a `from` hint so the auth page can return them afterwards.
 */
export default function ProtectedRoute({ children, adminOnly = false }: ProtectedRouteProps) {
  const { user, isLoading, hasToken, isAdmin } = useAuth();
  const location = useLocation();

  if (isLoading && hasToken) return <LoadingState />;

  if (!user) {
    const redirectTo = adminOnly ? '/admin/login' : '/login';
    return <Navigate to={redirectTo} replace state={{ from: location.pathname + location.search }} />;
  }

  if (adminOnly && !isAdmin) return <Navigate to="/admin/login" replace state={{ from: location.pathname + location.search }} />;

  return <>{children}</>;
}
