import axios from 'axios';

const api = axios.create({
  baseURL: '',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Services API
export const servicesApi = {
  getAll: () => api.get('/api/services'),
  create: (data) => api.post('/api/services', data),
  update: (id, data) => api.put(`/api/services/${id}`, data),
  delete: (id) => api.delete(`/api/services/${id}`),
  reorder: (updates) => api.put('/api/services/reorder/bulk', { updates }),
};

// Sections API
export const sectionsApi = {
  getAll: () => api.get('/api/sections'),
  getAllWithServices: () => api.get('/api/sections/with-services'),
  create: (data) => api.post('/api/sections', data),
  update: (id, data) => api.put(`/api/sections/${id}`, data),
  delete: (id) => api.delete(`/api/sections/${id}`),
  reorder: (updates) => api.put('/api/sections/reorder/bulk', { updates }),
};

// Users API
export const usersApi = {
  getAll: () => api.get('/api/users'),
  create: (data) => api.post('/api/users', data),
  updateRole: (id, role) => api.put(`/api/users/${id}`, { role }),
  delete: (id) => api.delete(`/api/users/${id}`),
};

// Auth API
export const authApi = {
  getUser: () => api.get('/auth/user'),
  logout: () => api.get('/auth/logout'),
};

// Calendar API
export const calendarApi = {
  getCalendars: () => api.get('/api/calendar/calendars'),
  getEvents: (calendarIds, timeMin, timeMax) => {
    // Support both single calendar ID (string) and multiple IDs (array)
    const params = new URLSearchParams();
    params.append('timeMin', timeMin);
    params.append('timeMax', timeMax);

    if (Array.isArray(calendarIds)) {
      // Multiple calendar IDs: send as comma-separated string
      if (calendarIds.length > 0) {
        params.append('calendarIds', calendarIds.join(','));
      }
    } else if (calendarIds) {
      // Single calendar ID: backward compatibility
      params.append('calendarId', calendarIds);
    }

    return api.get(`/api/calendar/events?${params.toString()}`);
  },
};

// Notes API
export const notesApi = {
  getAll: () => api.get('/api/notes'),
  getBySection: (sectionId) => api.get(`/api/notes/section/${sectionId}`),
  create: (data) => api.post('/api/notes', data),
  update: (id, data) => api.put(`/api/notes/${id}`, data),
  reorder: (updates) => api.put('/api/notes/reorder/bulk', { updates }),
  delete: (id) => api.delete(`/api/notes/${id}`),
};

// GetData API (for data functions)
export const getDataApi = {
  getAll: () => api.get('/api/get-data'),
  getById: (id) => api.get(`/api/get-data/${id}`),
  trigger: (id) => api.post(`/api/get-data/${id}/trigger`),
  getLogs: (id, limit = 10) =>
    api.get(`/api/get-data/${id}/logs`, { params: { limit } }),
};

// Scraper API (Deprecated - use getDataApi instead)
export const scraperApi = {
  getAll: () => api.get('/api/scrapers'),
  getById: (id) => api.get(`/api/scrapers/${id}`),
  create: (data) => api.post('/api/scrapers', data),
  update: (id, data) => api.put(`/api/scrapers/${id}`, data),
  delete: (id) => api.delete(`/api/scrapers/${id}`),
  trigger: (id) => api.post(`/api/scrapers/${id}/trigger`),
  getLogs: (id, limit = 10) =>
    api.get(`/api/scrapers/${id}/logs`, { params: { limit } }),
};

export default api;
