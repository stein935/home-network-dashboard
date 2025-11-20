import { useState, useEffect } from 'react';
import { sectionsApi, calendarApi } from '@utils/api';
import { Dialog } from '@common/Dialog';

const POPULAR_ICONS = [
  'Router',
  'ShieldCheck',
  'Activity',
  'Monitor',
  'Server',
  'Globe',
  'Laptop',
  'Wifi',
  'Database',
  'HardDrive',
  'Cloud',
  'Lock',
  'BarChart',
  'Download',
  'Upload',
  'Settings',
  'Zap',
  'Home',
  'Network',
  'Radio',
  'Tv',
  'Smartphone',
  'Tablet',
  'Watch',
  'Utensils',
  'Calendar',
  'MessageCircleHeart',
  'Speaker',
];

const SORTED_POPULAR_ICONS = POPULAR_ICONS.sort((a, b) => a.localeCompare(b));

export function ServiceForm({ service, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    icon: 'Router',
    section_id: '',
    card_type: 'link',
    config: {
      calendar_id: '', // Backward compatibility
      calendar_ids: [], // Multi-calendar support
      view_type: 'week',
    },
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
      // Support both old format (calendar_id) and new format (calendar_ids)
      let calendarIds = [];
      if (
        service.config?.calendar_ids &&
        Array.isArray(service.config.calendar_ids)
      ) {
        calendarIds = service.config.calendar_ids;
      } else if (service.config?.calendar_id) {
        calendarIds = [service.config.calendar_id];
      }

      setFormData({
        name: service.name,
        url: service.url || '',
        icon: service.icon,
        section_id: service.section_id || '',
        card_type: service.card_type || 'link',
        config: service.config
          ? {
              calendar_id: service.config.calendar_id || '', // Backward compat
              calendar_ids: calendarIds,
              view_type: service.config.view_type || 'week',
            }
          : {
              calendar_id: '',
              calendar_ids: [],
              view_type: 'week',
            },
      });

      // Load calendars if card type is calendar
      if (service.card_type === 'calendar') {
        fetchCalendars();
      }
    } else if (sections.length > 0 && !formData.section_id) {
      // Set default section for new services
      const defaultSection = sections.find((s) => s.is_default);
      if (defaultSection) {
        setFormData((prev) => ({ ...prev, section_id: defaultSection.id }));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      const errorMessage =
        err.response?.data?.error ||
        'Failed to load calendars. Please log out and log back in to grant calendar access.';
      setErrors((prev) => ({ ...prev, calendar: errorMessage }));
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
      if (
        !formData.config.calendar_ids ||
        formData.config.calendar_ids.length === 0
      ) {
        newErrors.calendar_ids = 'At least one calendar is required';
      } else if (formData.config.calendar_ids.length > 5) {
        newErrors.calendar_ids = 'Maximum 5 calendars allowed';
      }
      if (!formData.config.view_type) {
        newErrors.view_type = 'View type is required';
      }
    }

    if (!formData.icon) {
      newErrors.icon = 'Icon is required';
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
      setFormData((prev) => ({
        ...prev,
        config: {
          ...prev.config,
          [configKey]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: name === 'section_id' ? parseInt(value) || 0 : value,
      }));
    }

    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }

    // Load calendars when switching to calendar type
    if (
      name === 'card_type' &&
      value === 'calendar' &&
      calendars.length === 0
    ) {
      fetchCalendars();
    }
  };

  const handleCalendarMultiSelectChange = (e) => {
    const selectedOptions = Array.from(e.target.selectedOptions).map(
      (option) => option.value
    );

    setFormData((prev) => ({
      ...prev,
      config: {
        ...prev.config,
        calendar_ids: selectedOptions,
      },
    }));

    // Clear error
    if (errors.calendar_ids) {
      setErrors((prev) => ({ ...prev, calendar_ids: '' }));
    }
  };

  const footer = (
    <div className="flex gap-4">
      <button
        type="button"
        onClick={handleSubmit}
        disabled={submitting}
        className="btn-brutal-primary flex-1"
      >
        {submitting ? 'Saving...' : service ? 'Update' : 'Create'}
      </button>
      <button type="button" onClick={onCancel} className="btn-brutal flex-1">
        Cancel
      </button>
    </div>
  );

  return (
    <Dialog
      title={service ? 'Edit Service' : 'Add Service'}
      onClose={onCancel}
      footer={footer}
      zIndex={50}
    >
      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        <div>
          <label className="mb-2 block font-display text-sm uppercase text-text">
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
            <p className="mt-2 text-sm text-error">{errors.card_type}</p>
          )}
        </div>

        <div>
          <label className="mb-2 block font-display text-sm uppercase text-text">
            Name
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="input-brutal w-full"
          />
          {errors.name && (
            <p className="mt-2 text-sm text-error">{errors.name}</p>
          )}
        </div>

        {formData.card_type === 'link' && (
          <div>
            <label className="mb-2 block font-display text-sm uppercase text-text">
              URL
            </label>
            <input
              type="text"
              name="url"
              value={formData.url}
              onChange={handleChange}
              className="input-brutal w-full"
            />
            {errors.url && (
              <p className="mt-2 text-sm text-error">{errors.url}</p>
            )}
          </div>
        )}

        {formData.card_type === 'calendar' && (
          <>
            <div>
              <label className="mb-2 block font-display text-sm uppercase text-text">
                Calendars (select up to 5)
              </label>
              <div className="mb-2 text-sm text-text/70">
                Hold Ctrl (Cmd on Mac) to select multiple calendars
              </div>
              {loadingCalendars ? (
                <div className="input-brutal w-full text-text/60">
                  Loading calendars...
                </div>
              ) : calendars.length === 0 ? (
                <div className="input-brutal w-full text-text/60">
                  No calendars found. Please ensure calendar access is granted.
                </div>
              ) : (
                <>
                  <select
                    multiple
                    size={Math.min(calendars.length, 8)}
                    value={formData.config.calendar_ids}
                    onChange={handleCalendarMultiSelectChange}
                    className="input-brutal w-full"
                  >
                    {calendars.map((cal) => (
                      <option key={cal.id} value={cal.id}>
                        {cal.summary} {cal.primary ? '(Primary)' : ''}
                      </option>
                    ))}
                  </select>
                  {formData.config.calendar_ids.length > 0 && (
                    <div className="mt-2 text-sm text-text/70">
                      {formData.config.calendar_ids.length} calendar
                      {formData.config.calendar_ids.length > 1 ? 's' : ''}{' '}
                      selected
                    </div>
                  )}
                </>
              )}
              {errors.calendar_ids && (
                <p className="mt-2 text-sm text-error">{errors.calendar_ids}</p>
              )}
              {errors.calendar && (
                <p className="mt-2 text-sm text-error">{errors.calendar}</p>
              )}
            </div>

            <div>
              <label className="mb-2 block font-display text-sm uppercase text-text">
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
                <option value="fiveday">5 Day</option>
                <option value="month">Month</option>
              </select>
              {errors.view_type && (
                <p className="mt-2 text-sm text-error">{errors.view_type}</p>
              )}
            </div>
          </>
        )}

        <div>
          <label className="mb-2 block font-display text-sm uppercase text-text">
            Icon
          </label>
          <select
            name="icon"
            value={formData.icon}
            onChange={handleChange}
            className="input-brutal w-full"
          >
            {SORTED_POPULAR_ICONS.map((icon) => (
              <option key={icon} value={icon}>
                {icon}
              </option>
            ))}
          </select>
          {errors.icon && (
            <p className="mt-2 text-sm text-error">{errors.icon}</p>
          )}
        </div>

        <div>
          <label className="mb-2 block font-display text-sm uppercase text-text">
            Section
          </label>
          {loadingSections ? (
            <div className="input-brutal w-full text-text/60">
              Loading sections...
            </div>
          ) : (
            <select
              name="section_id"
              value={formData.section_id}
              onChange={handleChange}
              className="input-brutal w-full"
            >
              <option value="">Select a section</option>
              {sections.map((section) => (
                <option key={section.id} value={section.id}>
                  {section.name} {section.is_default ? '(Default)' : ''}
                </option>
              ))}
            </select>
          )}
          {errors.section_id && (
            <p className="mt-2 text-sm text-error">{errors.section_id}</p>
          )}
        </div>
      </form>
    </Dialog>
  );
}

export default ServiceForm;
