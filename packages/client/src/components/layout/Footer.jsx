import { Settings, LogOut } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@hooks/useAuth';

export function Footer() {
  const { isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const hideOnAdmin = location.pathname === '/admin';

  const handleAdminClick = () => {
    navigate('/admin');
  };

  return (
    <div className="px-6 pb-6 pt-0 md:px-12 md:pb-12">
      <div className="mx-auto max-w-7xl border-t-5 border-black pt-3 md:pt-6">
        <div className="flex gap-4">
          {isAdmin && !hideOnAdmin && (
            <button
              onClick={handleAdminClick}
              className="btn-brutal-primary flex items-center gap-2"
              aria-label="Admin Settings"
            >
              <Settings size={20} />
              <span className="hidden sm:inline">Admin</span>
            </button>
          )}
          <button
            onClick={logout}
            className="btn-brutal flex items-center gap-2"
            aria-label="Logout"
          >
            <LogOut size={20} />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default Footer;
