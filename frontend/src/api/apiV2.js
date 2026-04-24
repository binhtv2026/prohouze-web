/**
 * ProHouze API v2 Client
 * Version: 1.0.0
 * 
 * Master Data Model API - PostgreSQL Backend
 * Business Flow: CRM → Sales → Contract → Payment → Commission
 */

import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

// Create axios instance with default config
const apiV2 = axios.create({
  baseURL: `${API_URL}/api/v2`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiV2.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
apiV2.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired, redirect to login
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ═══════════════════════════════════════════════════════════════════════════════
// CUSTOMERS API
// Business Entity: Contact/Customer Management
// ═══════════════════════════════════════════════════════════════════════════════
export const customersApi = {
  // CRUD
  list: (params = {}) => apiV2.get('/customers', { params }),
  get: (id) => apiV2.get(`/customers/${id}`),
  create: (data) => apiV2.post('/customers', data),
  update: (id, data) => apiV2.put(`/customers/${id}`, data),
  delete: (id) => apiV2.delete(`/customers/${id}`),
  
  // Identity Management
  addIdentity: (customerId, data) => apiV2.post(`/customers/${customerId}/identities`, data),
  listIdentities: (customerId) => apiV2.get(`/customers/${customerId}/identities`),
  
  // Address Management
  addAddress: (customerId, data) => apiV2.post(`/customers/${customerId}/addresses`, data),
  listAddresses: (customerId) => apiV2.get(`/customers/${customerId}/addresses`),
  
  // Customer 360 View
  get360View: (customerId) => apiV2.get(`/customers/${customerId}/360`),
  
  // Deduplication
  findDuplicates: (phone, email) => apiV2.get('/customers/duplicates', { params: { phone, email } }),
  mergeCustomers: (primaryId, secondaryIds) => apiV2.post('/customers/merge', { primary_id: primaryId, secondary_ids: secondaryIds }),
};

// ═══════════════════════════════════════════════════════════════════════════════
// LEADS API
// Business Entity: Lead Capture & Qualification
// ═══════════════════════════════════════════════════════════════════════════════
export const leadsApi = {
  // CRUD
  list: (params = {}) => apiV2.get('/leads', { params }),
  get: (id) => apiV2.get(`/leads/${id}`),
  create: (data) => apiV2.post('/leads', data),
  update: (id, data) => apiV2.put(`/leads/${id}`, data),
  delete: (id) => apiV2.delete(`/leads/${id}`),
  
  // Lead Actions
  convert: (id, data) => apiV2.post(`/leads/${id}/convert`, data),
  qualify: (id, data) => apiV2.patch(`/leads/${id}/qualify`, data),
  disqualify: (id, data) => apiV2.patch(`/leads/${id}/disqualify`, data),
  assign: (id, userId) => apiV2.patch(`/leads/${id}/assign`, { owner_user_id: userId }),
  
  // Lead Activities
  addActivity: (leadId, data) => apiV2.post(`/leads/${leadId}/activities`, data),
  listActivities: (leadId) => apiV2.get(`/leads/${leadId}/activities`),
  
  // Lead Statistics
  getStats: (params = {}) => apiV2.get('/leads/stats', { params }),
  getFunnel: (params = {}) => apiV2.get('/leads/funnel', { params }),
};

// ═══════════════════════════════════════════════════════════════════════════════
// DEALS API
// Business Entity: Sales Pipeline & Opportunities
// ═══════════════════════════════════════════════════════════════════════════════
export const dealsApi = {
  // CRUD
  list: (params = {}) => apiV2.get('/deals', { params }),
  get: (id) => apiV2.get(`/deals/${id}`),
  create: (data) => apiV2.post('/deals', data),
  update: (id, data) => apiV2.put(`/deals/${id}`, data),
  delete: (id) => apiV2.delete(`/deals/${id}`),
  
  // Deal Stage Transitions
  moveStage: (id, stageCode, note) => apiV2.patch(`/deals/${id}/stage`, { stage_code: stageCode, note }),
  win: (id, data) => apiV2.post(`/deals/${id}/win`, data),
  lose: (id, data) => apiV2.post(`/deals/${id}/lose`, data),
  
  // Deal Statistics
  getStats: (params = {}) => apiV2.get('/deals/stats', { params }),
  getPipeline: (params = {}) => apiV2.get('/deals/pipeline', { params }),
  
  // Deal History
  getHistory: (id) => apiV2.get(`/deals/${id}/history`),
};

// ═══════════════════════════════════════════════════════════════════════════════
// BOOKINGS API
// Business Entity: Soft & Hard Booking Management
// ═══════════════════════════════════════════════════════════════════════════════
export const bookingsApi = {
  // CRUD
  list: (params = {}) => apiV2.get('/bookings', { params }),
  get: (id) => apiV2.get(`/bookings/${id}`),
  create: (data) => apiV2.post('/bookings', data),
  update: (id, data) => apiV2.put(`/bookings/${id}`, data),
  delete: (id) => apiV2.delete(`/bookings/${id}`),
  
  // Booking Status Transitions
  confirm: (id, data) => apiV2.post(`/bookings/${id}/confirm`, data),
  cancel: (id, data) => apiV2.post(`/bookings/${id}/cancel`, data),
  upgrade: (id, data) => apiV2.post(`/bookings/${id}/upgrade`, data),  // soft → hard
  
  // Deposit Management
  recordDeposit: (id, data) => apiV2.post(`/bookings/${id}/deposit`, data),
  refundDeposit: (id, data) => apiV2.post(`/bookings/${id}/refund`, data),
  
  // Booking Statistics
  getStats: (params = {}) => apiV2.get('/bookings/stats', { params }),
  getByProject: (projectId) => apiV2.get('/bookings/by-project', { params: { project_id: projectId } }),
};

// ═══════════════════════════════════════════════════════════════════════════════
// CONTRACTS API
// Business Entity: Contract Management & Approval
// ═══════════════════════════════════════════════════════════════════════════════
export const contractsApi = {
  // CRUD
  list: (params = {}) => apiV2.get('/contracts', { params }),
  get: (id) => apiV2.get(`/contracts/${id}`),
  create: (data) => apiV2.post('/contracts', data),
  update: (id, data) => apiV2.put(`/contracts/${id}`, data),
  delete: (id) => apiV2.delete(`/contracts/${id}`),
  
  // Contract Lifecycle
  submit: (id) => apiV2.post(`/contracts/${id}/submit`),
  approve: (id, data) => apiV2.post(`/contracts/${id}/approve`, data),
  reject: (id, data) => apiV2.post(`/contracts/${id}/reject`, data),
  sign: (id, data) => apiV2.post(`/contracts/${id}/sign`, data),
  activate: (id) => apiV2.post(`/contracts/${id}/activate`),
  terminate: (id, data) => apiV2.post(`/contracts/${id}/terminate`, data),
  
  // Contract Documents
  addDocument: (contractId, data) => apiV2.post(`/contracts/${contractId}/documents`, data),
  listDocuments: (contractId) => apiV2.get(`/contracts/${contractId}/documents`),
  
  // Contract Statistics
  getStats: (params = {}) => apiV2.get('/contracts/stats', { params }),
  getPending: () => apiV2.get('/contracts/pending'),
};

// ═══════════════════════════════════════════════════════════════════════════════
// PAYMENTS API
// Business Entity: Payment & Commission Management
// ═══════════════════════════════════════════════════════════════════════════════
export const paymentsApi = {
  // CRUD
  list: (params = {}) => apiV2.get('/payments', { params }),
  get: (id) => apiV2.get(`/payments/${id}`),
  create: (data) => apiV2.post('/payments', data),
  update: (id, data) => apiV2.put(`/payments/${id}`, data),
  delete: (id) => apiV2.delete(`/payments/${id}`),
  
  // Payment Actions
  confirm: (id, data) => apiV2.post(`/payments/${id}/confirm`, data),
  cancel: (id, data) => apiV2.post(`/payments/${id}/cancel`, data),
  
  // Payment Schedule
  getSchedule: (contractId) => apiV2.get(`/payments/schedule/${contractId}`),
  createSchedule: (contractId, data) => apiV2.post(`/payments/schedule/${contractId}`, data),
  
  // Payment Statistics
  getStats: (params = {}) => apiV2.get('/payments/stats', { params }),
  getReceivables: (params = {}) => apiV2.get('/payments/receivables', { params }),
  getOverdue: (params = {}) => apiV2.get('/payments/overdue', { params }),
};

// ═══════════════════════════════════════════════════════════════════════════════
// MIGRATION API
// System: Data Migration & Sync
// ═══════════════════════════════════════════════════════════════════════════════
export const migrationApi = {
  // Migration Status
  getStatus: () => apiV2.get('/migration/status'),
  
  // Data Sync
  syncFromMongoDB: (entity, options) => apiV2.post('/migration/sync', { entity, ...options }),
  
  // Reconciliation
  reconcile: (entity) => apiV2.post('/migration/reconcile', { entity }),
  getReconciliationReport: () => apiV2.get('/migration/reconciliation-report'),
};

// ═══════════════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Helper to extract data from API response
 */
export const extractData = (response) => {
  if (response?.data?.success && response?.data?.data) {
    return response.data.data;
  }
  return response?.data || null;
};

/**
 * Helper to extract pagination meta
 */
export const extractMeta = (response) => {
  return response?.data?.meta || null;
};

/**
 * Helper to handle API errors
 */
export const handleApiError = (error) => {
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  if (error.response?.data?.detail) {
    return error.response.data.detail;
  }
  return error.message || 'An error occurred';
};

export default {
  customers: customersApi,
  leads: leadsApi,
  deals: dealsApi,
  bookings: bookingsApi,
  contracts: contractsApi,
  payments: paymentsApi,
  migration: migrationApi,
};
