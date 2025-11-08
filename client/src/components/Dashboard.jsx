import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, LogOut } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { servicesApi } from '../utils/api';
import ServiceCard from './ServiceCard';

export function Dashboard() {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await servicesApi.getAll();
      setServices(response.data);
    } catch (err) {
      console.error('Error fetching services:', err);
      setError('Failed to load services');
    } finally {
      setLoading(false);
    }
  };

  const handleAdminClick = () => {
    navigate('/admin');
  };

  return (
    <div className="min-h-screen p-6 md:p-12">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-12 flex justify-between items-start flex-wrap gap-4">
          <div>
            <h1 className="font-display text-display-lg uppercase text-light-text dark:text-dark-text mb-2">
              Network
              <span className="text-light-accent1 dark:text-dark-accent1"> Dashboard</span>
            </h1>
            <p className="font-body text-xl text-light-text/80 dark:text-dark-text/80">
              Welcome, {user?.name || user?.email}
            </p>
          </div>

          <div className="flex gap-4">
            {isAdmin && (
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
        </header>

        {/* Services Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block border-5 border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface p-8 shadow-brutal">
              <p className="font-display text-2xl uppercase text-light-accent1 dark:text-dark-accent1">
                Loading Services...
              </p>
            </div>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <div className="inline-block border-5 border-light-error dark:border-dark-error bg-light-surface dark:bg-dark-surface p-8 shadow-brutal">
              <p className="font-display text-2xl uppercase text-light-error dark:text-dark-error">
                {error}
              </p>
            </div>
          </div>
        ) : services.length === 0 ? (
          <div className="text-center py-12">
            <div className="inline-block border-5 border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface p-8 shadow-brutal">
              <p className="font-display text-2xl uppercase text-light-text dark:text-dark-text">
                No Services Available
              </p>
              {isAdmin && (
                <p className="font-body mt-4 text-light-text/70 dark:text-dark-text/70">
                  Click Admin to add services
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
