import { Settings, LogOut } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@hooks/useAuth';
import { Link } from 'react-router-dom';

export function Footer() {
  const { isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const hideOnAdmin = location.pathname === '/admin';

  const handleAdminClick = () => {
    navigate('/admin');
  };

  const currentYear = new Date().getFullYear();

  return (
    <div className="border-t-5 border-black object-bottom pb-[100px] pt-3 md:pt-6">
      <div className="mb-4 flex gap-2 sm:hidden">
        <Link to="/privacy">PP</Link>
        <span>•</span>
        <Link to="/terms">T&Cs</Link>
        <span>•</span>
        <span>{currentYear}</span>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex w-full flex-row gap-4 sm:w-auto">
          {isAdmin && !hideOnAdmin && (
            <button
              onClick={handleAdminClick}
              className="btn-brutal-primary flex basis-1/2 items-center justify-center gap-2"
              aria-label="Admin Settings"
            >
              <Settings size={20} />
              <span className="hidden sm:inline">Admin</span>
            </button>
          )}
          <button
            onClick={logout}
            className="btn-brutal flex basis-1/2 items-center justify-center gap-2"
            aria-label="Logout"
          >
            <LogOut size={20} />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
        <div className="hidden gap-4 sm:flex">
          <Link to="/privacy">Privacy Policy</Link>
          <span>•</span>
          <Link to="/terms">Terms & Conditions</Link>
          <span>•</span>
          <span>{currentYear}</span>
        </div>
      </div>
    </div>
  );
}

export default Footer;
