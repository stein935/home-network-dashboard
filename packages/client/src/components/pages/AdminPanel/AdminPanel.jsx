import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Edit, Trash2, Menu } from 'lucide-react';
import * as Icons from 'lucide-react';
import { servicesApi } from '@utils/api';
import { useNotification } from '@hooks/useNotification';
import UserManagement from '@features/admin/UserManagement';
import ServiceForm from '@features/services/ServiceForm';
import SectionManager from '@features/admin/SectionManager';
import { GetDataManager } from '@features/admin/GetDataManager';
import { ChangeLogViewer } from '@features/admin/ChangeLogViewer';
import Footer from '@layout/Footer';

export function AdminPanel() {
  const navigate = useNavigate();
  const { notify, confirm } = useNotification();
  const [activeTab, setActiveTab] = useState('services');
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [navCollapsed, setNavCollapsed] = useState(true);

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
    const confirmed = await confirm({
      title: 'Delete Service',
      message:
        'Are you sure you want to delete this service? This action cannot be undone.',
      confirmText: 'Delete',
      confirmVariant: 'danger',
      cancelText: 'Cancel',
    });

    if (!confirmed) return;

    try {
      await servicesApi.delete(serviceId);
      fetchServices();
    } catch (err) {
      console.error('Error deleting service:', err);
      notify.error('Failed to delete service');
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

  const toggleNavCollapsed = () => {
    setNavCollapsed(!navCollapsed); // Toggles the boolean value of isOn
  };

  return (
    <div className="min-h-screen px-6 pb-0 pt-6 md:px-12 md:pt-12">
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

          <div className="flex items-center justify-between">
            <h1 className="font-display text-display-sm uppercase text-text sm:text-display-lg">
              Admin <span className="text-accent1">Panel</span>
            </h1>
            <button className="sm:hidden" onClick={toggleNavCollapsed}>
              <Menu size={36} />
            </button>
          </div>
        </header>

        {/* Tabs */}
        <div
          className={`flex flex-row flex-wrap gap-1 sm:gap-4 ${
            navCollapsed ? 'max-sm:hidden' : 'visible'
          } sm:visible`}
          onClick={toggleNavCollapsed}
        >
          <button
            onClick={() => setActiveTab('services')}
            className={`w-full border-b-5 bg-gray-200 px-3 pb-1 pt-2 text-left font-display uppercase transition-colors sm:w-auto sm:bg-inherit sm:px-6 sm:py-3 sm:text-center ${
              activeTab === 'services'
                ? 'border-accent1 text-accent1'
                : 'border-transparent text-text/60 hover:text-text'
            }`}
          >
            Services
          </button>
          <button
            onClick={() => setActiveTab('sections')}
            className={`w-full border-b-5 bg-gray-200 px-3 py-1 text-left font-display uppercase transition-colors sm:w-auto sm:bg-inherit sm:px-6 sm:py-3 sm:text-center ${
              activeTab === 'sections'
                ? 'border-accent1 text-accent1'
                : 'border-transparent text-text/60 hover:text-text'
            }`}
          >
            Sections
          </button>
          <button
            onClick={() => setActiveTab('get-data')}
            className={`w-full border-b-5 bg-gray-200 px-3 py-1 text-left font-display uppercase transition-colors sm:w-auto sm:bg-inherit sm:px-6 sm:py-3 sm:text-center ${
              activeTab === 'get-data'
                ? 'border-accent1 text-accent1'
                : 'border-transparent text-text/60 hover:text-text'
            }`}
          >
            Get Data
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`w-full border-b-5 bg-gray-200 px-3 py-1 text-left font-display uppercase transition-colors sm:w-auto sm:bg-inherit sm:px-6 sm:py-3 sm:text-center ${
              activeTab === 'users'
                ? 'border-accent1 text-accent1'
                : 'border-transparent text-text/60 hover:text-text'
            }`}
          >
            Users
          </button>
          <button
            onClick={() => setActiveTab('change-log')}
            className={`w-full border-b-5 bg-gray-200 px-3 py-1 text-left font-display uppercase transition-colors sm:w-auto sm:bg-inherit sm:px-6 sm:py-3 sm:text-center ${
              activeTab === 'change-log'
                ? 'border-accent1 text-accent1'
                : 'border-transparent text-text/60 hover:text-text'
            }`}
          >
            Change Log
          </button>
        </div>
        <div className="mb-8 border-b-5 border-border"></div>

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
                <table className="w-full sm:table-fixed">
                  <thead className="border-b-3 border-border">
                    <tr>
                      <th className="p-2 text-left font-display uppercase text-text sm:w-20 sm:p-4">
                        Icon
                      </th>
                      <th className="p-2 text-left font-display uppercase text-text sm:w-[15%] sm:p-4">
                        Type
                      </th>
                      <th className="p-2 text-left font-display uppercase text-text sm:w-[20%] sm:p-4">
                        Name
                      </th>
                      <th className="hidden p-2 text-left font-display uppercase text-text sm:table-cell sm:p-4">
                        URL
                      </th>
                      <th className="p-2 text-right font-display uppercase text-text sm:w-28 sm:p-4">
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
                        <td className="p-2 font-body text-text sm:p-4">
                          {(() => {
                            const IconComponent =
                              Icons[service.icon] || Icons.ExternalLink;
                            return <IconComponent size={24} strokeWidth={2} />;
                          })()}
                        </td>
                        <td className="truncate p-2 font-body text-text sm:p-4">
                          {service.card_type}
                        </td>
                        <td className="truncate p-2 font-body text-text sm:p-4">
                          {service.name}
                        </td>
                        <td className="hidden truncate break-all p-2 font-body text-sm text-text/70 sm:table-cell sm:p-4">
                          {service.url}
                        </td>
                        <td className="p-2 text-right sm:p-4">
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
        ) : activeTab === 'get-data' ? (
          <GetDataManager />
        ) : activeTab === 'change-log' ? (
          <ChangeLogViewer />
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
        <Footer />
      </div>
    </div>
  );
}

export default AdminPanel;
