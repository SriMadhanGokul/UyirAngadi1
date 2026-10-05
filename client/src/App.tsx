import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import { LoadingState } from "./components/Feedback";
import PublicLayout from "./layouts/PublicLayout";
import SearchPage from "./pages/SearchPage";
import SoldHistoryPage from "./pages/SoldHistoryPage";
import ListingDetailPage from "./pages/ListingDetailPage";
import SellPage from "./pages/SellPage";
import LoginPage from "./pages/LoginPage";
import ProfilePage from "./pages/ProfilePage";
import FavouritesPage from "./pages/FavouritesPage";
import SellerDashboardPage from "./pages/SellerDashboardPage";
import AdminOverviewPage from "./pages/AdminOverviewPage";
import AdminUsersPage from "./pages/AdminUsersPage";
import AdminListingsPage from "./pages/AdminListingsPage";
import AdminReportsPage from "./pages/AdminReportsPage";
import AdminCategoriesPage from "./pages/AdminCategoriesPage";
import MyEnquiriesPage from "./pages/MyEnquiriesPage";
import StaticPage from "./pages/StaticPage";
import NotFoundPage from "./pages/NotFoundPage";

/**
 * Public landing page: everyone can browse listings directly, while actual
 * contact and posting actions remain gated behind login.
 */
function HomeRedirect() {
  const { isLoading, hasToken } = useAuth();
  if (isLoading && hasToken) return <LoadingState />;

  return <Navigate to="/listings" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<PublicLayout />}>
            <Route index element={<HomeRedirect />} />
            <Route path="listings" element={<SearchPage />} />
            <Route
              path="sold-history"
              element={
                <ProtectedRoute>
                  <SoldHistoryPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="search"
              element={<Navigate to="/listings" replace />}
            />
            <Route path="listings/:id" element={<ListingDetailPage />} />
            <Route path="about" element={<StaticPage page="about" />} />
            <Route path="terms" element={<StaticPage page="terms" />} />
            <Route path="privacy" element={<StaticPage page="privacy" />} />
            <Route path="safety" element={<StaticPage page="safety" />} />
            <Route
              path="favourites"
              element={
                <ProtectedRoute>
                  <FavouritesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="sell"
              element={
                <ProtectedRoute>
                  <SellPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="sell/:id"
              element={
                <ProtectedRoute>
                  <SellPage />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFoundPage />} />
          </Route>

          <Route path="login" element={<LoginPage />} />
          <Route path="admin/login" element={<LoginPage adminMode />} />

          <Route
            path="profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="dashboard"
            element={
              <ProtectedRoute>
                <SellerDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="enquiries"
            element={
              <ProtectedRoute>
                <MyEnquiriesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="admin"
            element={
              <ProtectedRoute adminOnly>
                <AdminOverviewPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="admin/users"
            element={
              <ProtectedRoute adminOnly>
                <AdminUsersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="admin/listings"
            element={
              <ProtectedRoute adminOnly>
                <AdminListingsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="admin/reports"
            element={
              <ProtectedRoute adminOnly>
                <AdminReportsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="admin/categories"
            element={
              <ProtectedRoute adminOnly>
                <AdminCategoriesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="dashboard/listings"
            element={<Navigate to="/dashboard" replace />}
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
