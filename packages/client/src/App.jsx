import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@context/AuthContext';
import { NotificationProvider } from '@context/NotificationContext';
import { NotificationContainer } from '@common/NotificationContainer';
import ProtectedRoute from '@layout/ProtectedRoute';
import ScrollToTop from '@layout/ScrollToTop';
import Dashboard from '@pages/Dashboard';
import AdminPanel from '@pages/AdminPanel';
import Privacy from '@pages/Privacy';
import Terms from '@pages/Terms';

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <Router>
          <ScrollToTop />
          <Routes>
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute requireAdmin={true}>
                  <AdminPanel />
                </ProtectedRoute>
              }
            />
            <Route
              path="/privacy"
              element={
                <ProtectedRoute>
                  <Privacy />
                </ProtectedRoute>
              }
            />
            <Route
              path="/terms"
              element={
                <ProtectedRoute>
                  <Terms />
                </ProtectedRoute>
              }
            />
          </Routes>
        </Router>
        <NotificationContainer />
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;
