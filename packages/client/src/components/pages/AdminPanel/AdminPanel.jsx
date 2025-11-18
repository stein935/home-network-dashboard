import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Edit, Trash2 } from 'lucide-react';
import * as Icons from 'lucide-react';
import { servicesApi } from '@utils/api';
import UserManagement from '@features/admin/UserManagement';
import ServiceForm from '@features/services/ServiceForm';
import SectionManager from '@features/admin/SectionManager';
import { ScraperManager } from '@features/admin/ScraperManager';

export function AdminPanel() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('services');
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [editingService, setEditingService] = useState(null);

  useEffect(() => {
    if (activeTab === 'services') {
      fetchServices();
    }
  }, [activeTab]);

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

  const handleCreateService = async (formData) => {
    try {
      await servicesApi.create(formData);
      setShowServiceForm(false);
      fetchServices();
    } catch (err) {
      console.error('Error creating service:', err);
      throw err;
    }
  };

  const handleUpdateService = async (formData) => {
    try {
      await servicesApi.update(editingService.id, formData);
      setShowServiceForm(false);
      setEditingService(null);
      fetchServices();
    } catch (err) {
      console.error('Error updating service:', err);
      throw err;
    }
  };

  const handleDeleteService = async (serviceId) => {
    if (!confirm('Are you sure you want to delete this service?')) {
      return;
    }

    try {
      await servicesApi.delete(serviceId);
      fetchServices();
    } catch (err) {
      console.error('Error deleting service:', err);
      alert('Failed to delete service');
    }
  };

  const handleEditClick = (service) => {
    setEditingService(service);
    setShowServiceForm(true);
  };

  const handleAddClick = () => {
    setEditingService(null);
    setShowServiceForm(true);
  };

  const handleCloseForm = () => {
    setShowServiceForm(false);
    setEditingService(null);
  };

  return (
    <div className="min-h-[80vh] p-6 md:p-12">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <header className="mb-6 sm:mb-12">
          <button
            onClick={() => navigate('/')}
            className="btn-brutal mb-6 flex w-full items-center justify-center gap-2 sm:w-auto"
          >
            <ArrowLeft size={20} />
            Back to Dashboard
          </button>

          <h1 className="font-display text-display-sm uppercase text-text sm:text-display-lg">
            Admin <span className="text-accent1">Panel</span>
          </h1>
        </header>

        {/* Tabs */}
        <div className="mb-8 flex gap-4 border-b-5 border-border">
          <button
            onClick={() => setActiveTab('services')}
            className={`border-b-5 px-3 py-1 font-display uppercase transition-colors sm:px-6 sm:py-3 ${
              activeTab === 'services'
                ? 'border-accent1 text-accent1'
                : 'border-transparent text-text/60 hover:text-text'
            }`}
          >
            Services
          </button>
          <button
            onClick={() => setActiveTab('sections')}
            className={`border-b-5 px-3 py-1 font-display uppercase transition-colors sm:px-6 sm:py-3 ${
              activeTab === 'sections'
                ? 'border-accent1 text-accent1'
                : 'border-transparent text-text/60 hover:text-text'
            }`}
          >
            Sections
          </button>
          <button
            onClick={() => setActiveTab('scrapers')}
            className={`border-b-5 px-3 py-1 font-display uppercase transition-colors sm:px-6 sm:py-3 ${
              activeTab === 'scrapers'
                ? 'border-accent1 text-accent1'
                : 'border-transparent text-text/60 hover:text-text'
            }`}
          >
            Scrapers
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`border-b-5 px-3 py-1 font-display uppercase transition-colors sm:px-6 sm:py-3 ${
              activeTab === 'users'
                ? 'border-accent1 text-accent1'
                : 'border-transparent text-text/60 hover:text-text'
            }`}
          >
            Users
          </button>
        </div>

        {/* Content */}
        {activeTab === 'services' ? (
          <div>
            <div className="mb-6 flex flex-wrap items-center justify-between">
              <h2 className="mb-1 w-full font-display text-display-sm uppercase text-text sm:mb-0 sm:w-auto">
                Manage Services
              </h2>
              <button
                onClick={handleAddClick}
                className="btn-brutal-primary flex w-full items-center justify-center gap-2 sm:w-auto"
              >
                <Plus size={20} />
                Add Service
              </button>
            </div>

            {loading ? (
              <div className="py-8 text-center">
                <p className="font-display text-xl uppercase text-accent1">
                  Loading Services...
                </p>
              </div>
            ) : error ? (
              <div className="border-3 border-error bg-surface p-4">
                <p className="text-error">{error}</p>
              </div>
            ) : (
              <div className="overflow-x-auto border-5 border-border bg-surface shadow-brutal">
                <table className="w-full">
                  <thead className="border-b-3 border-border">
                    <tr>
                      <th className="p-4 text-left font-display uppercase text-text">
                        Type
                      </th>
                      <th className="p-4 text-left font-display uppercase text-text">
                        Name
                      </th>
                      <th className="p-4 text-left font-display uppercase text-text">
                        URL
                      </th>
                      <th className="p-4 text-left font-display uppercase text-text">
                        Icon
                      </th>
                      <th className="p-4 text-right font-display uppercase text-text">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {services.map((service) => (
                      <tr
                        key={service.id}
                        className="border-b border-border/30 last:border-0"
                      >
                        <td className="p-4 font-body text-text">
                          {service.card_type}
                        </td>
                        <td className="p-4 font-body text-text">
                          {service.name}
                        </td>
                        <td className="max-w-xs break-all p-4 font-body text-sm text-text/70">
                          {service.url}
                        </td>
                        <td className="p-4 font-body text-text">
                          {(() => {
                            const IconComponent =
                              Icons[service.icon] || Icons.ExternalLink;
                            return <IconComponent size={24} strokeWidth={2} />;
                          })()}
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex justify-end gap-3">
                            <button
                              onClick={() => handleEditClick(service)}
                              className="text-accent1 hover:opacity-80"
                              aria-label="Edit service"
                            >
                              <Edit size={20} />
                            </button>
                            <button
                              onClick={() => handleDeleteService(service.id)}
                              className="text-error hover:opacity-80"
                              aria-label="Delete service"
                            >
                              <Trash2 size={20} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : activeTab === 'sections' ? (
          <SectionManager />
        ) : activeTab === 'scrapers' ? (
          <ScraperManager />
        ) : (
          <UserManagement />
        )}

        {/* Service Form Modal */}
        {showServiceForm && (
          <ServiceForm
            service={editingService}
            onSubmit={
              editingService ? handleUpdateService : handleCreateService
            }
            onCancel={handleCloseForm}
          />
        )}
      </div>
    </div>
  );
}

export default AdminPanel;
