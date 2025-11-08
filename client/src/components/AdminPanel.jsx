import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Edit, Trash2 } from 'lucide-react';
import { servicesApi } from '../utils/api';
import UserManagement from './UserManagement';
import ServiceForm from './ServiceForm';

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
    <div className="min-h-screen p-6 md:p-12">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-12">
          <button
            onClick={() => navigate('/')}
            className="btn-brutal flex items-center gap-2 mb-6"
          >
            <ArrowLeft size={20} />
            Back to Dashboard
          </button>

          <h1 className="font-display text-display-lg uppercase text-light-text dark:text-dark-text">
            Admin <span className="text-light-accent1 dark:text-dark-accent1">Panel</span>
          </h1>
        </header>

        {/* Tabs */}
        <div className="mb-8 flex gap-4 border-b-5 border-light-border dark:border-dark-border">
          <button
            onClick={() => setActiveTab('services')}
            className={`font-display uppercase px-6 py-3 border-b-5 transition-colors ${
              activeTab === 'services'
                ? 'border-light-accent1 dark:border-dark-accent1 text-light-accent1 dark:text-dark-accent1'
                : 'border-transparent text-light-text/60 dark:text-dark-text/60 hover:text-light-text dark:hover:text-dark-text'
            }`}
          >
            Services
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`font-display uppercase px-6 py-3 border-b-5 transition-colors ${
              activeTab === 'users'
                ? 'border-light-accent1 dark:border-dark-accent1 text-light-accent1 dark:text-dark-accent1'
                : 'border-transparent text-light-text/60 dark:text-dark-text/60 hover:text-light-text dark:hover:text-dark-text'
            }`}
          >
            Users
          </button>
        </div>

        {/* Content */}
        {activeTab === 'services' ? (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-display text-display-sm uppercase text-light-text dark:text-dark-text">
                Manage Services
              </h2>
              <button
                onClick={handleAddClick}
                className="btn-brutal-primary flex items-center gap-2"
              >
                <Plus size={20} />
                Add Service
              </button>
            </div>

            {loading ? (
              <div className="text-center py-8">
                <p className="font-display text-xl uppercase text-light-accent1 dark:text-dark-accent1">
                  Loading Services...
                </p>
              </div>
            ) : error ? (
              <div className="border-3 border-light-error dark:border-dark-error bg-light-surface dark:bg-dark-surface p-4">
                <p className="text-light-error dark:text-dark-error">{error}</p>
              </div>
            ) : (
              <div className="border-5 border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface shadow-brutal overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b-3 border-light-border dark:border-dark-border">
                    <tr>
                      <th className="text-left p-4 font-display uppercase text-light-text dark:text-dark-text">Order</th>
                      <th className="text-left p-4 font-display uppercase text-light-text dark:text-dark-text">Name</th>
                      <th className="text-left p-4 font-display uppercase text-light-text dark:text-dark-text">URL</th>
                      <th className="text-left p-4 font-display uppercase text-light-text dark:text-dark-text">Icon</th>
                      <th className="text-right p-4 font-display uppercase text-light-text dark:text-dark-text">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {services.map((service) => (
                      <tr
                        key={service.id}
                        className="border-b border-light-border/30 dark:border-dark-border/30 last:border-0"
                      >
                        <td className="p-4 font-body text-light-text dark:text-dark-text">
                          {service.display_order}
                        </td>
                        <td className="p-4 font-body text-light-text dark:text-dark-text">
                          {service.name}
                        </td>
                        <td className="p-4 font-body text-sm text-light-text/70 dark:text-dark-text/70 break-all max-w-xs">
                          {service.url}
                        </td>
                        <td className="p-4 font-body text-light-text dark:text-dark-text">
                          {service.icon}
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex justify-end gap-3">
                            <button
                              onClick={() => handleEditClick(service)}
                              className="text-light-accent1 dark:text-dark-accent1 hover:opacity-80"
                              aria-label="Edit service"
                            >
                              <Edit size={20} />
                            </button>
                            <button
                              onClick={() => handleDeleteService(service.id)}
                              className="text-light-error dark:text-dark-error hover:opacity-80"
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
        ) : (
          <UserManagement />
        )}

        {/* Service Form Modal */}
        {showServiceForm && (
          <ServiceForm
            service={editingService}
            onSubmit={editingService ? handleUpdateService : handleCreateService}
            onCancel={handleCloseForm}
          />
        )}
      </div>
    </div>
  );
}

export default AdminPanel;
