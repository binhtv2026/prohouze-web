import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

const api = axios.create({
  // Empty API_URL → relative path → CRA proxy forwards to backend
  // Full URL → direct call (production)
  baseURL: API_URL ? `${API_URL}/api` : '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// apiV2 — axios instance trỏ vào /api/v2 (PostgreSQL CRUD endpoints)
const apiV2 = axios.create({
  baseURL: API_URL ? `${API_URL}/api/v2` : '/api/v2',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Export api instances
export { api, apiV2 };

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add auth token to apiV2 requests
apiV2.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isLocalhost = typeof window !== 'undefined' && ['localhost', '127.0.0.1'].includes(window.location.hostname);
    const isLoginRequest = error.config?.url?.includes('/auth/login');
    const isLocalDemoToken = localStorage.getItem('token') === 'local-demo-token';

    if (error.response?.status === 401 && !isLoginRequest && !(isLocalhost && isLocalDemoToken)) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'),
};

// Leads
export const leadsAPI = {
  getAll: (params) => api.get('/leads', { params }),
  getById: (id) => api.get(`/leads/${id}`),
  create: (data) => api.post('/leads', data),
  update: (id, data) => api.put(`/leads/${id}`, data),
  assign: (id, userId) => api.post(`/leads/${id}/assign?user_id=${userId}`),
  autoDistribute: (data) => api.post('/leads/auto-distribute', data),
};

// Projects
export const projectsAPI = {
  getAll: (params) => api.get('/projects', { params }),
  getById: (id) => api.get(`/projects/${id}`),
  create: (data) => api.post('/projects', data),
};

// Customers
export const customersAPI = {
  getAll: (params) => api.get('/customers', { params }),
  getById: (id) => api.get(`/customers/${id}`),
  create: (data) => api.post('/customers', data),
};

// Contracts
export const contractsAPI = {
  getAll: (params) => api.get('/contracts', { params }),
  create: (data) => api.post('/contracts', data),
};

// Branches
export const branchesAPI = {
  getAll: () => api.get('/branches'),
  create: (data) => api.post('/branches', data),
};

// Users
export const usersAPI = {
  getAll: (params) => api.get('/users', { params }),
};

// Interactions
export const interactionsAPI = {
  getAll: (params) => api.get('/interactions', { params }),
  create: (data) => api.post('/interactions', data),
};

// KPIs
export const kpisAPI = {
  getAll: (params) => api.get('/kpis', { params }),
  create: (data) => api.post('/kpis', data),
};

// Dashboard
export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats'),
  getLeadFunnel: () => api.get('/dashboard/lead-funnel'),
  getLeadSources: () => api.get('/dashboard/lead-sources'),
  getTopPerformers: () => api.get('/dashboard/top-performers'),
};

// Reports
export const reportsAPI = {
  getConversion: (period) => api.get('/reports/conversion', { params: { period } }),
};

// AI
export const aiAPI = {
  chat: (data) => api.post('/ai/chat', data),
  analyzeLead: (leadId) => api.post(`/ai/analyze-lead?lead_id=${leadId}`),
  getDailyBriefing: () => api.get('/ai/daily-briefing'),
};

// Automation
export const automationAPI = {
  getRules: () => api.get('/automation/rules'),
  createRule: (data) => api.post('/automation/rules', data),
  toggleRule: (ruleId) => api.put(`/automation/rules/${ruleId}/toggle`),
  getLogs: (params) => api.get('/automation/logs', { params }),
  testTrigger: (trigger, leadId) => api.post('/automation/test-trigger', null, { params: { trigger, lead_id: leadId } }),
};

// Activities
export const activitiesAPI = {
  getAll: (params) => api.get('/activities', { params }),
  create: (data) => api.post('/activities', data),
};

// Tasks
export const tasksAPI = {
  getAll: (params) => api.get('/tasks', { params }),
  create: (data) => api.post('/tasks', data),
  complete: (taskId) => api.put(`/tasks/${taskId}/complete`),
};

// Deals
export const dealsAPI = {
  getAll: (params) => api.get('/deals', { params }),
  create: (data) => api.post('/deals', data),
  updateStage: (dealId, stage, probability) => api.put(`/deals/${dealId}/stage`, null, { params: { stage, probability } }),
};

// Notifications
export const notificationsAPI = {
  getAll: (params) => api.get('/notifications', { params }),
  markRead: (notificationId) => api.put(`/notifications/${notificationId}/read`),
  markAllRead: () => api.put('/notifications/read-all'),
};

// Channels (Omnichannel)
export const channelsAPI = {
  getAll: () => api.get('/channels'),
  create: (data) => api.post('/channels', data),
  toggle: (channelId) => api.put(`/channels/${channelId}/toggle`),
  getStats: () => api.get('/channels/stats'),
};

// Content Management
export const contentAPI = {
  getAll: (params) => api.get('/content', { params }),
  create: (data) => api.post('/content', data),
  generate: (data) => api.post('/content/generate', data),
  submitForReview: (contentId) => api.post(`/content/${contentId}/submit-for-review`),
  approve: (contentId, data) => api.post(`/content/${contentId}/approve`, data),
  publish: (contentId) => api.post(`/content/${contentId}/publish`),
};

// Response Templates
export const responseTemplatesAPI = {
  getAll: (params) => api.get('/response-templates', { params }),
  create: (data) => api.post('/response-templates', data),
  approve: (templateId) => api.put(`/response-templates/${templateId}/approve`),
};

// Distribution Rules
export const distributionRulesAPI = {
  getAll: () => api.get('/distribution-rules'),
  create: (data) => api.post('/distribution-rules', data),
  toggle: (ruleId) => api.put(`/distribution-rules/${ruleId}/toggle`),
};

export default api;
