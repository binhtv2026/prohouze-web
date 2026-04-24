/**
 * Marketing V2 API - Prompt 13/20
 * Standardized Omnichannel Marketing Engine
 */

import api from '@/lib/api';

const BASE_URL = '/api/marketing/v2';

// ============================================
// CONFIG APIs
// ============================================

export const getChannelTypes = () => api.get(`${BASE_URL}/config/channel-types`);
export const getChannelStatuses = () => api.get(`${BASE_URL}/config/channel-statuses`);
export const getContentTypes = () => api.get(`${BASE_URL}/config/content-types`);
export const getContentStatuses = () => api.get(`${BASE_URL}/config/content-statuses`);
export const getFormFieldTypes = () => api.get(`${BASE_URL}/config/form-field-types`);
export const getFormStatuses = () => api.get(`${BASE_URL}/config/form-statuses`);
export const getTemplateCategories = () => api.get(`${BASE_URL}/config/template-categories`);
export const getTemplateStatuses = () => api.get(`${BASE_URL}/config/template-statuses`);
export const getAttributionModels = () => api.get(`${BASE_URL}/config/attribution-models`);
export const getTemplateVariables = () => api.get(`${BASE_URL}/config/template-variables`);

// ============================================
// CHANNEL APIs
// ============================================

export const getChannels = (params = {}) => api.get(`${BASE_URL}/channels`, { params });
export const getChannel = (channelId) => api.get(`${BASE_URL}/channels/${channelId}`);
export const createChannel = (data) => api.post(`${BASE_URL}/channels`, data);
export const updateChannel = (channelId, data) => api.put(`${BASE_URL}/channels/${channelId}`, data);
export const connectChannel = (channelId, credentials) => api.post(`${BASE_URL}/channels/${channelId}/connect`, credentials);
export const disconnectChannel = (channelId) => api.post(`${BASE_URL}/channels/${channelId}/disconnect`);
export const toggleChannel = (channelId) => api.post(`${BASE_URL}/channels/${channelId}/toggle`);
export const syncChannel = (channelId) => api.post(`${BASE_URL}/channels/${channelId}/sync`);
export const getChannelStats = (channelId) => api.get(`${BASE_URL}/channels/${channelId}/stats`);

// ============================================
// CONTENT APIs
// ============================================

export const getContents = (params = {}) => api.get(`${BASE_URL}/contents`, { params });
export const getContent = (contentId) => api.get(`${BASE_URL}/contents/${contentId}`);
export const createContent = (data) => api.post(`${BASE_URL}/contents`, data);
export const updateContent = (contentId, data) => api.put(`${BASE_URL}/contents/${contentId}`, data);
export const submitContentForReview = (contentId) => api.post(`${BASE_URL}/contents/${contentId}/submit-review`);
export const approveContent = (contentId, notes = null) => api.post(`${BASE_URL}/contents/${contentId}/approve`, { notes });
export const rejectContent = (contentId, reason) => api.post(`${BASE_URL}/contents/${contentId}/reject`, { reason });
export const publishContent = (contentId, channelIds = null) => api.post(`${BASE_URL}/contents/${contentId}/publish`, { channel_ids: channelIds });
export const scheduleContent = (contentId, scheduledAt) => api.post(`${BASE_URL}/contents/${contentId}/schedule`, { scheduled_at: scheduledAt });
export const getContentPublications = (contentId) => api.get(`${BASE_URL}/contents/${contentId}/publications`);

// ============================================
// FORM APIs
// ============================================

export const getForms = (params = {}) => api.get(`${BASE_URL}/forms`, { params });
export const getForm = (formId) => api.get(`${BASE_URL}/forms/${formId}`);
export const createForm = (data) => api.post(`${BASE_URL}/forms`, data);
export const updateForm = (formId, data) => api.put(`${BASE_URL}/forms/${formId}`, data);
export const activateForm = (formId) => api.post(`${BASE_URL}/forms/${formId}/activate`);
export const pauseForm = (formId) => api.post(`${BASE_URL}/forms/${formId}/pause`);
export const renderForm = (formId, params = {}) => api.get(`${BASE_URL}/forms/${formId}/render`, { params });
export const submitForm = (formId, data) => api.post(`${BASE_URL}/forms/${formId}/submit`, data);
export const getFormSubmissions = (formId, params = {}) => api.get(`${BASE_URL}/forms/${formId}/submissions`, { params });

// ============================================
// RESPONSE TEMPLATE APIs
// ============================================

export const getTemplates = (params = {}) => api.get(`${BASE_URL}/templates`, { params });
export const getTemplate = (templateId) => api.get(`${BASE_URL}/templates/${templateId}`);
export const createTemplate = (data) => api.post(`${BASE_URL}/templates`, data);
export const updateTemplate = (templateId, data) => api.put(`${BASE_URL}/templates/${templateId}`, data);
export const submitTemplateForApproval = (templateId) => api.post(`${BASE_URL}/templates/${templateId}/submit-approval`);
export const approveTemplate = (templateId) => api.post(`${BASE_URL}/templates/${templateId}/approve`);
export const rejectTemplate = (templateId, reason) => api.post(`${BASE_URL}/templates/${templateId}/reject`, { reason });
export const matchTemplate = (message, channelId, contactId = null) => api.post(`${BASE_URL}/templates/match`, { message, channel_id: channelId, contact_id: contactId });

// ============================================
// ATTRIBUTION APIs
// ============================================

export const getAttributions = (params = {}) => api.get(`${BASE_URL}/attributions`, { params });
export const getAttribution = (attributionId) => api.get(`${BASE_URL}/attributions/${attributionId}`);
export const getAttributionByContact = (contactId) => api.get(`${BASE_URL}/attributions/contact/${contactId}`);
export const lockAttribution = (attributionId, reason = 'manual') => api.post(`${BASE_URL}/attributions/${attributionId}/lock`, { reason });
export const getAttributionReport = (params = {}) => api.get(`${BASE_URL}/attributions/report`, { params });

// ============================================
// DASHBOARD APIs
// ============================================

export const getMarketingDashboard = (period = '30d') => api.get(`${BASE_URL}/dashboard`, { params: { period } });

// ============================================
// HELPER FUNCTIONS
// ============================================

export const CHANNEL_ICONS = {
  facebook: 'Facebook',
  facebook_ads: 'Facebook',
  tiktok: 'TikTok',
  tiktok_ads: 'TikTok',
  youtube: 'Youtube',
  linkedin: 'Linkedin',
  zalo: 'Zalo',
  zalo_ads: 'Zalo',
  website: 'Globe',
  landing_page: 'Globe',
  email: 'Mail',
  sms: 'MessageSquare',
  hotline: 'Phone',
  google_ads: 'Search',
};

export const CHANNEL_COLORS = {
  facebook: 'bg-blue-600',
  facebook_ads: 'bg-blue-700',
  tiktok: 'bg-gray-900',
  tiktok_ads: 'bg-gray-800',
  youtube: 'bg-red-600',
  linkedin: 'bg-blue-700',
  zalo: 'bg-blue-500',
  zalo_ads: 'bg-blue-600',
  website: 'bg-emerald-600',
  landing_page: 'bg-purple-600',
  email: 'bg-orange-500',
  sms: 'bg-green-500',
  hotline: 'bg-red-500',
  google_ads: 'bg-red-500',
};

export const STATUS_COLORS = {
  // Content statuses
  draft: 'bg-gray-100 text-gray-700',
  pending_review: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  scheduled: 'bg-blue-100 text-blue-700',
  published: 'bg-purple-100 text-purple-700',
  archived: 'bg-gray-100 text-gray-600',
  // Channel statuses
  pending: 'bg-yellow-100 text-yellow-700',
  connected: 'bg-green-100 text-green-700',
  disconnected: 'bg-gray-100 text-gray-600',
  error: 'bg-red-100 text-red-700',
  disabled: 'bg-gray-100 text-gray-600',
  // Form statuses
  active: 'bg-green-100 text-green-700',
  paused: 'bg-yellow-100 text-yellow-700',
  // Template statuses
  pending_approval: 'bg-yellow-100 text-yellow-700',
};

export default {
  // Config
  getChannelTypes,
  getContentTypes,
  getFormFieldTypes,
  getTemplateCategories,
  getTemplateVariables,
  // Channels
  getChannels,
  getChannel,
  createChannel,
  updateChannel,
  connectChannel,
  disconnectChannel,
  toggleChannel,
  syncChannel,
  getChannelStats,
  // Contents
  getContents,
  getContent,
  createContent,
  updateContent,
  submitContentForReview,
  approveContent,
  rejectContent,
  publishContent,
  scheduleContent,
  getContentPublications,
  // Forms
  getForms,
  getForm,
  createForm,
  updateForm,
  activateForm,
  pauseForm,
  renderForm,
  submitForm,
  getFormSubmissions,
  // Templates
  getTemplates,
  getTemplate,
  createTemplate,
  updateTemplate,
  submitTemplateForApproval,
  approveTemplate,
  rejectTemplate,
  matchTemplate,
  // Attributions
  getAttributions,
  getAttribution,
  getAttributionByContact,
  lockAttribution,
  getAttributionReport,
  // Dashboard
  getMarketingDashboard,
};
