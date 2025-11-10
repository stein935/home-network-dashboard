import { useState, useEffect } from 'react';
import { SortAsc, X } from 'lucide-react';
import { sectionsApi, calendarApi } from '../utils/api';

const POPULAR_ICONS = [
  'Router', 'ShieldCheck', 'Activity', 'Monitor', 'Server', 'Globe',
  'Laptop', 'Wifi', 'Database', 'HardDrive', 'Cloud', 'Lock',
  'BarChart', 'Download', 'Upload', 'Settings', 'Zap', 'Home',
  'Network', 'Radio', 'Tv', 'Smartphone', 'Tablet', 'Watch',
  'Utensils', 'Calendar'
];

const SORTED_POPULAR_ICONS = POPULAR_ICONS.sort((a, b) => a.localeCompare(b));

export function ServiceForm({ service, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    icon: 'Router',
    display_order: 1,
    section_id: '',
    card_type: 'link',
    config: {
      calendar_id: '',
      view_type: 'week'
    }
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [sections, setSections] = useState([]);
  const [loadingSections, setLoadingSections] = useState(true);
  const [calendars, setCalendars] = useState([]);
  const [loadingCalendars, setLoadingCalendars] = useState(false);

  useEffect(() => {
    fetchSections();
  }, []);

  useEffect(() => {
    if (service) {
      setFormData({
        name: service.name,
        url: service.url || '',
        icon: service.icon,
        display_order: service.display_order,
        section_id: service.section_id || '',
        card_type: service.card_type || 'link',
        config: service.config ? {
          calendar_id: service.config.calendar_id || '',
          view_type: service.config.view_type || 'week'
        } : {
          calendar_id: '',
          view_type: 'week'
        }
      });

      // Load calendars if card type is calendar
      if (service.card_type === 'calendar') {
        fetchCalendars();
      }
    } else if (sections.length > 0 && !formData.section_id) {
      // Set default section for new services
      const defaultSection = sections.find(s => s.is_default);
      if (defaultSection) {
        setFormData(prev => ({ ...prev, section_id: defaultSection.id }));
      }
    }
  }, [service, sections]);

  const fetchSections = async () => {
    try {
      setLoadingSections(true);
      const response = await sectionsApi.getAll();
      setSections(response.data);
    } catch (err) {
      console.error('Error fetching sections:', err);
    } finally {
      setLoadingSections(false);
    }
  };

  const fetchCalendars = async () => {
    try {
      setLoadingCalendars(true);
      const response = await calendarApi.getCalendars();
      setCalendars(response.data);
    } catch (err) {
      console.error('Error fetching calendars:', err);
      const errorMessage = err.response?.data?.error || 'Failed to load calendars. Please log out and log back in to grant calendar access.';
      setErrors(prev => ({ ...prev, calendar: errorMessage }));
    } finally {
      setLoadingCalendars(false);
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.length > 100) {
      newErrors.name = 'Name must be less than 100 characters';
    }

    // URL only required for link cards
    if (formData.card_type === 'link') {
      if (!formData.url.trim()) {
        newErrors.url = 'URL is required';
      } else {
        try {
          new URL(formData.url);
        } catch {
          newErrors.url = 'Invalid URL format';
        }
      }
    }

    // Calendar config required for calendar cards
    if (formData.card_type === 'calendar') {
      if (!formData.config.calendar_id) {
        newErrors.calendar_id = 'Calendar is required';
      }
      if (!formData.config.view_type) {
        newErrors.view_type = 'View type is required';
      }
    }

    if (!formData.icon) {
      newErrors.icon = 'Icon is required';
    }

    if (formData.display_order < 0) {
      newErrors.display_order = 'Display order must be positive';
    }

    if (!formData.section_id) {
      newErrors.section_id = 'Section is required';
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

    // Handle nested config fields
    if (name.startsWith('config.')) {
      const configKey = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        config: {
          ...prev.config,
          [configKey]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: name === 'display_order' || name === 'section_id' ? parseInt(value) || 0 : value
      }));
    }

    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }

    // Load calendars when switching to calendar type
    if (name === 'card_type' && value === 'calendar' && calendars.length === 0) {
      fetchCalendars();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="border-5 border-border bg-surface shadow-brutal max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-display text-display-sm uppercase text-text">
              {service ? 'Edit Service' : 'Add Service'}
            </h2>
            <button
              onClick={onCancel}
              className="text-text hover:text-error transition-colors"
              aria-label="Close"
            >
              <X size={32} strokeWidth={3} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block font-display uppercase text-sm mb-2 text-text">
                Card Type
              </label>
              <select
                name="card_type"
                value={formData.card_type}
                onChange={handleChange}
                className="input-brutal w-full"
              >
                <option value="link">Link</option>
                <option value="calendar">Calendar</option>
              </select>
              {errors.card_type && (
                <p className="mt-2 text-error text-sm">{errors.card_type}</p>
              )}
            </div>
            
            <div>
              <label className="block font-display uppercase text-sm mb-2 text-text">
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
                <p className="mt-2 text-error text-sm">{errors.name}</p>
              )}
            </div>

            {formData.card_type === 'link' && (
              <div>
                <label className="block font-display uppercase text-sm mb-2 text-text">
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
                  <p className="mt-2 text-error text-sm">{errors.url}</p>
                )}
              </div>
            )}

            {formData.card_type === 'calendar' && (
              <>
                <div>
                  <label className="block font-display uppercase text-sm mb-2 text-text">
                    Calendar
                  </label>
                  {loadingCalendars ? (
                    <div className="input-brutal w-full text-text/60">Loading calendars...</div>
                  ) : calendars.length === 0 ? (
                    <div className="input-brutal w-full text-text/60">
                      No calendars found. Please ensure calendar access is granted.
                    </div>
                  ) : (
                    <select
                      name="config.calendar_id"
                      value={formData.config.calendar_id}
                      onChange={handleChange}
                      className="input-brutal w-full"
                    >
                      <option value="">Select a calendar</option>
                      {calendars.map(cal => (
                        <option key={cal.id} value={cal.id}>
                          {cal.summary} {cal.primary ? '(Primary)' : ''}
                        </option>
                      ))}
                    </select>
                  )}
                  {errors.calendar_id && (
                    <p className="mt-2 text-error text-sm">{errors.calendar_id}</p>
                  )}
                  {errors.calendar && (
                    <p className="mt-2 text-error text-sm">{errors.calendar}</p>
                  )}
                </div>

                <div>
                  <label className="block font-display uppercase text-sm mb-2 text-text">
                    Default View
                  </label>
                  <select
                    name="config.view_type"
                    value={formData.config.view_type}
                    onChange={handleChange}
                    className="input-brutal w-full"
                  >
                    <option value="day">Day</option>
                    <option value="week">Week</option>
                    <option value="month">Month</option>
                  </select>
                  {errors.view_type && (
                    <p className="mt-2 text-error text-sm">{errors.view_type}</p>
                  )}
                </div>
              </>
            )}

            <div>
              <label className="block font-display uppercase text-sm mb-2 text-text">
                Icon
              </label>
              <select
                name="icon"
                value={formData.icon}
                onChange={handleChange}
                className="input-brutal w-full"
              >
                {SORTED_POPULAR_ICONS.map(icon => (
                  <option key={icon} value={icon}>{icon}</option>
                ))}
              </select>
              {errors.icon && (
                <p className="mt-2 text-error text-sm">{errors.icon}</p>
              )}
            </div>

            <div>
              <label className="block font-display uppercase text-sm mb-2 text-text">
                Section
              </label>
              {loadingSections ? (
                <div className="input-brutal w-full text-text/60">Loading sections...</div>
              ) : (
                <select
                  name="section_id"
                  value={formData.section_id}
                  onChange={handleChange}
                  className="input-brutal w-full"
                >
                  <option value="">Select a section</option>
                  {sections.map(section => (
                    <option key={section.id} value={section.id}>
                      {section.name} {section.is_default ? '(Default)' : ''}
                    </option>
                  ))}
                </select>
              )}
              {errors.section_id && (
                <p className="mt-2 text-error text-sm">{errors.section_id}</p>
              )}
            </div>

            <div>
              <label className="block font-display uppercase text-sm mb-2 text-text">
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
                <p className="mt-2 text-error text-sm">{errors.display_order}</p>
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
