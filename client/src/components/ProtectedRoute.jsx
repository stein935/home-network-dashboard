import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export function ProtectedRoute({ children, requireAdmin = false }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="border-5 border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface p-8 shadow-brutal">
            <h1 className="font-display text-display-sm uppercase text-light-accent1 dark:text-dark-accent1">
              Loading...
            </h1>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    // Redirect to Google OAuth
    window.location.href = '/auth/google';
    return null;
  }

  if (requireAdmin && user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default ProtectedRoute;
