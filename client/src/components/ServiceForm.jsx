import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const POPULAR_ICONS = [
  'Router', 'Shield', 'Activity', 'Monitor', 'Server', 'Globe',
  'Laptop', 'Wifi', 'Database', 'HardDrive', 'Cloud', 'Lock',
  'BarChart', 'Download', 'Upload', 'Settings', 'Zap', 'Home',
  'Network', 'Radio', 'Tv', 'Smartphone', 'Tablet', 'Watch'
];

export function ServiceForm({ service, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    icon: 'Router',
    display_order: 1
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (service) {
      setFormData({
        name: service.name,
        url: service.url,
        icon: service.icon,
        display_order: service.display_order
      });
    }
  }, [service]);

  const validate = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.length > 100) {
      newErrors.name = 'Name must be less than 100 characters';
    }

    if (!formData.url.trim()) {
      newErrors.url = 'URL is required';
    } else {
      try {
        new URL(formData.url);
      } catch {
        newErrors.url = 'Invalid URL format';
      }
    }

    if (!formData.icon) {
      newErrors.icon = 'Icon is required';
    }

    if (formData.display_order < 0) {
      newErrors.display_order = 'Display order must be positive';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(formData);
    } catch (err) {
      console.error('Form submission error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'display_order' ? parseInt(value) || 0 : value
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="border-5 border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface shadow-brutal max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-display text-display-sm uppercase text-light-text dark:text-dark-text">
              {service ? 'Edit Service' : 'Add Service'}
            </h2>
            <button
              onClick={onCancel}
              className="text-light-text dark:text-dark-text hover:text-light-error dark:hover:text-dark-error transition-colors"
              aria-label="Close"
            >
              <X size={32} strokeWidth={3} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block font-display uppercase text-sm mb-2 text-light-text dark:text-dark-text">
                Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="input-brutal w-full"
                placeholder="Router Admin"
              />
              {errors.name && (
                <p className="mt-2 text-light-error dark:text-dark-error text-sm">{errors.name}</p>
              )}
            </div>

            <div>
              <label className="block font-display uppercase text-sm mb-2 text-light-text dark:text-dark-text">
                URL
              </label>
              <input
                type="text"
                name="url"
                value={formData.url}
                onChange={handleChange}
                className="input-brutal w-full"
                placeholder="http://192.168.1.1"
              />
              {errors.url && (
                <p className="mt-2 text-light-error dark:text-dark-error text-sm">{errors.url}</p>
              )}
            </div>

            <div>
              <label className="block font-display uppercase text-sm mb-2 text-light-text dark:text-dark-text">
                Icon
              </label>
              <select
                name="icon"
                value={formData.icon}
                onChange={handleChange}
                className="input-brutal w-full"
              >
                {POPULAR_ICONS.map(icon => (
                  <option key={icon} value={icon}>{icon}</option>
                ))}
              </select>
              {errors.icon && (
                <p className="mt-2 text-light-error dark:text-dark-error text-sm">{errors.icon}</p>
              )}
            </div>

            <div>
              <label className="block font-display uppercase text-sm mb-2 text-light-text dark:text-dark-text">
                Display Order
              </label>
              <input
                type="number"
                name="display_order"
                value={formData.display_order}
                onChange={handleChange}
                className="input-brutal w-full"
                min="0"
              />
              {errors.display_order && (
                <p className="mt-2 text-light-error dark:text-dark-error text-sm">{errors.display_order}</p>
              )}
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={submitting}
                className="btn-brutal-primary flex-1"
              >
                {submitting ? 'Saving...' : service ? 'Update' : 'Create'}
              </button>
              <button
                type="button"
                onClick={onCancel}
                className="btn-brutal flex-1"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ServiceForm;
