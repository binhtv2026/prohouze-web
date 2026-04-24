/**
 * Dynamic Form API Service
 * API for Form Schema System - Phase 4 of Dynamic Data Foundation
 */

import { api } from '../lib/api';

const V2_BASE = '/v2';

// ============================================
// FORMS API
// ============================================
export const formsAPI = {
  /**
   * Get renderable form for an entity type
   * @param {string} entityType - lead, customer, deal, product, task
   * @param {string} formType - create, edit, view, quick, import, filter
   * @param {object} options - { orgId, context }
   */
  getRenderableForm: async (entityType, formType = 'create', options = {}) => {
    const params = { form_type: formType };
    if (options.orgId) params.org_id = options.orgId;
    if (options.context) params.context = JSON.stringify(options.context);
    
    const response = await api.get(`${V2_BASE}/forms/render/${entityType}`, { params });
    return response.data;
  },

  /**
   * List all form schemas
   */
  list: async (params = {}) => {
    const response = await api.get(`${V2_BASE}/forms`, { params });
    return response.data;
  },

  /**
   * Get form by ID with full details
   */
  getById: async (id) => {
    const response = await api.get(`${V2_BASE}/forms/${id}?include_details=true`);
    return response.data;
  },

  /**
   * Get available form types
   */
  getFormTypes: async () => {
    const response = await api.get(`${V2_BASE}/forms/types`);
    return response.data;
  },

  /**
   * Get available field layouts
   */
  getLayouts: async () => {
    const response = await api.get(`${V2_BASE}/forms/layouts`);
    return response.data;
  },

  /**
   * Get form statistics
   */
  getStats: async (orgId) => {
    const params = orgId ? { org_id: orgId } : {};
    const response = await api.get(`${V2_BASE}/forms/stats`, { params });
    return response.data;
  },

  /**
   * Seed default forms
   */
  seed: async (entityTypes, force = false) => {
    const params = { force };
    if (entityTypes) params.entity_types = entityTypes;
    const response = await api.post(`${V2_BASE}/forms/seed`, null, { params });
    return response.data;
  },
};

// ============================================
// ATTRIBUTES API
// ============================================
export const attributesAPI = {
  /**
   * Get schema for an entity type (grouped by attribute groups)
   */
  getSchema: async (entityType, options = {}) => {
    const params = { include_custom: true };
    if (options.orgId) params.org_id = options.orgId;
    
    const response = await api.get(`${V2_BASE}/attributes/schema/${entityType}`, { params });
    return response.data;
  },

  /**
   * Get attribute values for an entity
   */
  getValues: async (entityType, entityId) => {
    const response = await api.get(`${V2_BASE}/attributes/values/${entityType}/${entityId}`);
    return response.data;
  },

  /**
   * Set attribute values for an entity
   */
  setValues: async (entityType, entityId, values) => {
    const response = await api.post(`${V2_BASE}/attributes/values/${entityType}/${entityId}`, { values });
    return response.data;
  },

  /**
   * Get available data types
   */
  getDataTypes: async () => {
    const response = await api.get(`${V2_BASE}/attributes/data-types`);
    return response.data;
  },

  /**
   * Seed system attributes
   */
  seed: async (force = false) => {
    const response = await api.post(`${V2_BASE}/attributes/seed?force=${force}`);
    return response.data;
  },
};

// ============================================
// MASTER DATA API (for dropdowns)
// ============================================
export const masterDataAPI = {
  /**
   * Get lookup data for a category (for dropdowns)
   */
  lookup: async (categoryCode, orgId) => {
    const params = orgId ? { org_id: orgId } : {};
    const response = await api.get(`${V2_BASE}/master-data/lookup/${categoryCode}`, { params });
    return response.data;
  },

  /**
   * Get all categories
   */
  getCategories: async (params = {}) => {
    const response = await api.get(`${V2_BASE}/master-data/categories`, { params });
    return response.data;
  },

  /**
   * Get items by category code
   */
  getItems: async (categoryCode, params = {}) => {
    const response = await api.get(`${V2_BASE}/master-data/items`, { 
      params: { category_code: categoryCode, ...params } 
    });
    return response.data;
  },
};

export default {
  forms: formsAPI,
  attributes: attributesAPI,
  masterData: masterDataAPI,
};
