import axios from 'axios';

const api = axios.create({
  baseURL: '',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Services API
export const servicesApi = {
  getAll: () => api.get('/api/services'),
  create: (data) => api.post('/api/services', data),
  update: (id, data) => api.put(`/api/services/${id}`, data),
  delete: (id) => api.delete(`/api/services/${id}`),
  reorder: (updates) => api.put('/api/services/reorder/bulk', { updates })
};

// Sections API
export const sectionsApi = {
  getAll: () => api.get('/api/sections'),
  getAllWithServices: () => api.get('/api/sections/with-services'),
  create: (data) => api.post('/api/sections', data),
  update: (id, data) => api.put(`/api/sections/${id}`, data),
  delete: (id) => api.delete(`/api/sections/${id}`),
  reorder: (updates) => api.put('/api/sections/reorder/bulk', { updates })
};

// Users API
export const usersApi = {
  getAll: () => api.get('/api/users'),
  create: (data) => api.post('/api/users', data),
  updateRole: (id, role) => api.put(`/api/users/${id}`, { role }),
  delete: (id) => api.delete(`/api/users/${id}`)
};

// Auth API
export const authApi = {
  getUser: () => api.get('/auth/user'),
  logout: () => api.get('/auth/logout')
};

// Calendar API
export const calendarApi = {
  getCalendars: () => api.get('/api/calendar/calendars'),
  getEvents: (calendarId, timeMin, timeMax) =>
    api.get('/api/calendar/events', {
      params: { calendarId, timeMin, timeMax }
    })
};

export default api;
