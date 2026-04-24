/**
 * ProHouze Marketing API Service
 * Prompt 7/20 - Lead Source & Marketing Attribution Engine
 * 
 * APIs for:
 * - Lead Sources CRUD & Analytics
 * - Campaigns CRUD & Analytics
 * - Touchpoints & Attribution
 * - Assignment Rules
 * - Marketing Dashboard
 */

import { api } from './api';

// ============================================
// CONFIG API
// ============================================
export const marketingConfigAPI = {
  getSourceTypes: () => api.get('/marketing/config/source-types'),
  getChannels: () => api.get('/marketing/config/channels'),
  getCampaignTypes: () => api.get('/marketing/config/campaign-types'),
  getCampaignStatuses: () => api.get('/marketing/config/campaign-statuses'),
  getAssignmentRuleTypes: () => api.get('/marketing/config/assignment-rule-types'),
  getAttributionModels: () => api.get('/marketing/config/attribution-models'),
  getTouchpointTypes: () => api.get('/marketing/config/touchpoint-types'),
};

// ============================================
// LEAD SOURCES API
// ============================================
export const leadSourcesAPI = {
  getAll: (params) => api.get('/marketing/sources', { params }),
  getById: (id) => api.get(`/marketing/sources/${id}`),
  create: (data) => api.post('/marketing/sources', data),
  update: (id, data) => api.put(`/marketing/sources/${id}`, data),
  delete: (id) => api.delete(`/marketing/sources/${id}`),
  getAnalytics: (id) => api.get(`/marketing/sources/${id}/analytics`),
  getSummary: () => api.get('/marketing/sources/summary/all'),
  seedDefaults: () => api.post('/marketing/sources/seed-defaults'),
};

// ============================================
// CAMPAIGNS API
// ============================================
export const campaignsAPI = {
  getAll: (params) => api.get('/marketing/campaigns', { params }),
  getById: (id) => api.get(`/marketing/campaigns/${id}`),
  create: (data) => api.post('/marketing/campaigns', data),
  update: (id, data) => api.put(`/marketing/campaigns/${id}`, data),
  updateStatus: (id, data) => api.put(`/marketing/campaigns/${id}/status`, data),
  getLeads: (id, params) => api.get(`/marketing/campaigns/${id}/leads`, { params }),
  getAnalytics: (id) => api.get(`/marketing/campaigns/${id}/analytics`),
};

// ============================================
// TOUCHPOINTS & ATTRIBUTION API
// ============================================
export const attributionAPI = {
  createTouchpoint: (data) => api.post('/marketing/touchpoints', data),
  getContactAttribution: (contactId, params) => 
    api.get(`/marketing/attribution/contact/${contactId}`, { params }),
  getDealAttribution: (dealId, params) => 
    api.get(`/marketing/attribution/deal/${dealId}`, { params }),
};

// ============================================
// ASSIGNMENT RULES API
// ============================================
export const assignmentRulesAPI = {
  getAll: (params) => api.get('/marketing/assignment-rules', { params }),
  create: (data) => api.post('/marketing/assignment-rules', data),
  update: (id, data) => api.put(`/marketing/assignment-rules/${id}`, data),
  delete: (id) => api.delete(`/marketing/assignment-rules/${id}`),
  test: (data) => api.post('/marketing/assignment-rules/test', data),
};

// ============================================
// DASHBOARD & ANALYTICS API
// ============================================
export const marketingAnalyticsAPI = {
  getDashboard: (params) => api.get('/marketing/dashboard', { params }),
  getChannelAnalytics: (params) => api.get('/marketing/analytics/channels', { params }),
};
