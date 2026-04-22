import api from './client';

// ─── Auth ───
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  refresh: () => api.post('/auth/refresh'),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
};

// ─── Users ───
export const usersApi = {
  list: (params?: any) => api.get('/users', { params }),
  getById: (id: string) => api.get(`/users/${id}`),
  create: (data: any) => api.post('/users', data),
  update: (id: string, data: any) => api.patch(`/users/${id}`, data),
  delete: (id: string) => api.delete(`/users/${id}`),
};

// ─── Customers ───
export const customersApi = {
  list: (params?: any) => api.get('/customers', { params }),
  getById: (id: string) => api.get(`/customers/${id}`),
  create: (data: any) => api.post('/customers', data),
  update: (id: string, data: any) => api.patch(`/customers/${id}`, data),
  delete: (id: string) => api.delete(`/customers/${id}`),
  bulkImport: (rows: any[]) => api.post('/customers/bulk-import', { rows }),
};

// ─── Services (Master) ───
export const servicesApi = {
  list: (params?: any) => api.get('/services', { params }),
  getById: (id: string) => api.get(`/services/${id}`),
  create: (data: any) => api.post('/services', data),
  update: (id: string, data: any) => api.patch(`/services/${id}`, data),
  delete: (id: string) => api.delete(`/services/${id}`),
};

// ─── Customer Services ───
export const customerServicesApi = {
  list: (params?: any) => api.get('/customer-services', { params }),
  getById: (id: string) => api.get(`/customer-services/${id}`),
  create: (data: any) => api.post('/customer-services', data),
  update: (id: string, data: any) => api.patch(`/customer-services/${id}`, data),
  getExpiring: (days?: number) => api.get('/customer-services/expiring', { params: { days } }),
};

// ─── Payments ───
export const paymentsApi = {
  list: (params?: any) => api.get('/payments', { params }),
  create: (data: any) => api.post('/payments', data),
  getOverdue: () => api.get('/payments/overdue'),
  getSummary: (params?: any) => api.get('/payments/summary', { params }),
};

// ─── Dashboard ───
export const dashboardApi = {
  getSummary: () => api.get('/dashboard/summary'),
};

// ─── Notifications ───
export const notificationsApi = {
  list: (params?: any) => api.get('/notifications', { params }),
  send: (data: any) => api.post('/notifications/send', data),
  getStats: () => api.get('/notifications/stats'),
};
