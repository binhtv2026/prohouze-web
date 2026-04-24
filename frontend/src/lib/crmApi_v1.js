/**
 * ProHouze CRM API Service
 * Prompt 6/20 - CRM Unified Profile Standardization
 * 
 * IMPORTANT: All POST/PUT requests must wrap payload in named key
 * Example: { contact: {...} } not just {...}
 */

import { api } from './api';

// ============================================
// CONTACTS API
// ============================================
export const contactsAPI = {
  getAll: (params) => api.get('/crm/contacts', { params }),
  getById: (id) => api.get(`/crm/contacts/${id}`),
  create: (data) => api.post('/crm/contacts', data),
  update: (id, data) => api.put(`/crm/contacts/${id}`, data),
  changeStatus: (id, data) => api.put(`/crm/contacts/${id}/status`, data),
  getUnifiedProfile: (id) => api.get(`/crm/contacts/${id}/unified-profile`),
};

// ============================================
// LEADS API (New CRM Router)
// ============================================
export const crmLeadsAPI = {
  getAll: (params) => api.get('/crm/leads', { params }),
  getById: (id) => api.get(`/crm/leads/${id}`),
  create: (data) => api.post('/crm/leads', data),
  update: (id, data) => api.put(`/crm/leads/${id}`, data),
  changeStage: (id, data) => api.put(`/crm/leads/${id}/stage`, data),
  assign: (id, userId, reason) => api.post(`/crm/leads/${id}/assign`, null, { 
    params: { user_id: userId, reason } 
  }),
};

// ============================================
// DEMAND PROFILES API
// ============================================
export const demandsAPI = {
  getAll: (params) => api.get('/crm/demands', { params }),
  getById: (id) => api.get(`/crm/demands/${id}`),
  create: (data) => api.post('/crm/demands', data),
  update: (id, data) => api.put(`/crm/demands/${id}`, data),
  matchProducts: (id) => api.post(`/crm/demands/${id}/match-products`),
};

// ============================================
// INTERACTIONS API (Timeline)
// ============================================
export const crmInteractionsAPI = {
  getAll: (params) => api.get('/crm/interactions', { params }),
  create: (data) => api.post('/crm/interactions', data),
  getContactTimeline: (contactId, params) => 
    api.get(`/crm/timeline/contact/${contactId}`, { params }),
};

// ============================================
// DUPLICATES API
// ============================================
export const duplicatesAPI = {
  check: (data) => api.post('/crm/duplicates/check', data),
  getAll: (params) => api.get('/crm/duplicates', { params }),
  merge: (data) => api.post('/crm/duplicates/merge', data),
};

// ============================================
// ASSIGNMENT HISTORY API
// ============================================
export const assignmentHistoryAPI = {
  getAll: (params) => api.get('/crm/assignment-history', { params }),
};

// ============================================
// CRM CONFIG API
// ============================================
export const crmConfigAPI = {
  getLeadStages: () => api.get('/crm/config/lead-stages'),
  getDealStages: () => api.get('/crm/config/deal-stages'),
  getContactStatuses: () => api.get('/crm/config/contact-statuses'),
  getInteractionTypes: () => api.get('/crm/config/interaction-types'),
};

// ============================================
// HELPER: Format currency for display
// ============================================
export const formatBudget = (min, max) => {
  const fmt = (val) => {
    if (!val) return '';
    if (val >= 1000000000) return `${(val / 1000000000).toFixed(1)} tỷ`;
    if (val >= 1000000) return `${(val / 1000000).toFixed(0)} triệu`;
    return val.toLocaleString('vi-VN');
  };
  
  if (min && max) return `${fmt(min)} - ${fmt(max)}`;
  if (max) return `Đến ${fmt(max)}`;
  if (min) return `Từ ${fmt(min)}`;
  return '';
};

export default {
  contacts: contactsAPI,
  leads: crmLeadsAPI,
  demands: demandsAPI,
  interactions: crmInteractionsAPI,
  duplicates: duplicatesAPI,
  assignmentHistory: assignmentHistoryAPI,
  config: crmConfigAPI,
};
