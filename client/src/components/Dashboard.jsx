import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, LogOut, ChevronDown, ChevronRight } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { sectionsApi } from '../utils/api';
import ServiceCard from './ServiceCard';

export function Dashboard() {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const [sectionsWithServices, setSectionsWithServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [collapsedSections, setCollapsedSections] = useState({});

  useEffect(() => {
    fetchSectionsWithServices();
  }, []);

  const fetchSectionsWithServices = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await sectionsApi.getAllWithServices();
      setSectionsWithServices(response.data);
    } catch (err) {
      console.error('Error fetching sections with services:', err);
      setError('Failed to load services');
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (sectionId) => {
    setCollapsedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  const totalServices = sectionsWithServices.reduce((total, section) => total + section.services.length, 0);

  const handleAdminClick = () => {
    navigate('/admin');
  };

  return (
    <div className="min-h-screen p-6 md:p-12">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-12 flex justify-between items-start flex-wrap gap-4">
          <div>
            <h1 className="font-display text-display-lg uppercase text-text mb-2">
              HOME
              <span className="text-accent1"> Things</span>
            </h1>
            <p className="font-body text-xl text-text/80">
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

        {/* Sections with Services */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block border-5 border-border bg-surface p-8 shadow-brutal">
              <p className="font-display text-2xl uppercase text-accent1">
                Loading Services...
              </p>
            </div>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <div className="inline-block border-5 border-error bg-surface p-8 shadow-brutal">
              <p className="font-display text-2xl uppercase text-error">
                {error}
              </p>
            </div>
          </div>
        ) : totalServices === 0 ? (
          <div className="text-center py-12">
            <div className="inline-block border-5 border-border bg-surface p-8 shadow-brutal">
              <p className="font-display text-2xl uppercase text-text">
                No Services Available
              </p>
              {isAdmin && (
                <p className="font-body mt-4 text-text/70">
                  Click Admin to add services
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {sectionsWithServices
              .filter(section => section.services.length > 0)
              .map((section) => (
                <div key={section.id} className="">
                  {/* Section Header */}
                  <button
                    onClick={() => toggleSection(section.id)}
                    className="w-full flex items-center justify-between py-6 transition-colors border-t-5 border-black hover:border-neon-red"
                    aria-label={`Toggle ${section.name} section`}
                  >
                    <h2 className="font-display text-display-sm uppercase text-text">
                      {section.name}
                      <span className="ml-3 text-lg text-text/60">
                        ({section.services.length})
                      </span>
                    </h2>
                    {collapsedSections[section.id] ? (
                      <ChevronRight size={32} strokeWidth={3} className="text-accent1" />
                    ) : (
                      <ChevronDown size={32} strokeWidth={3} className="text-accent1" />
                    )}
                  </button>

                  {/* Section Services Grid */}
                  {!collapsedSections[section.id] && (
                    <div className="pb-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {section.services.map((service) => (
                          <ServiceCard key={service.id} service={service} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
