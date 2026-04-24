/**
 * ProHouze CRM API Service v2
 * Connected to PostgreSQL Master Data Model
 * 
 * Business Flow: Customer → Lead → Deal → Booking → Contract → Payment → Commission
 */

import { api } from './api';

// API v2 base path - /api is already included by the base api instance
const V2_BASE = '/v2';

// Helper to transform v2 response to v1 format for backward compatibility
const transformResponse = (response) => {
  if (response?.data?.success && response?.data?.data) {
    return { data: response.data.data, meta: response.data.meta };
  }
  return response;
};

// Transform lead from v2 to v1 format
const transformLeadV2toV1 = (lead) => ({
  ...lead,
  stage: lead.lead_status,  // v2 uses lead_status, v1 uses stage
  status: lead.lead_status,  // Alias
  full_name: lead.contact_name,
  phone: lead.contact_phone,
  email: lead.contact_email,
  source: lead.source_channel,
  priority: lead.intent_level,
  assigned_to: lead.owner_user_id,
  notes: lead.qualification_notes,
  contact_count: lead.contact_attempts,
});

// Transform customer from v2 to v1 format
const transformCustomerV2toV1 = (customer) => ({
  ...customer,
  name: customer.full_name,
  phone: customer.primary_phone,
  email: customer.primary_email,
  stage: customer.customer_stage,
  assigned_to: customer.owner_user_id,
  notes: customer.note_summary,
});

// Transform deal from v2 to v1 format
const transformDealV2toV1 = (deal) => ({
  ...deal,
  title: deal.deal_name,
  name: deal.deal_name,
  contact_name: deal.deal_name || 'Untitled Deal',  // For display in pipeline
  code: deal.deal_code,  // For display
  stage: deal.current_stage,
  value: deal.deal_value,
  amount: deal.deal_value,
  estimated_value: parseFloat(deal.deal_value) || 0,
  probability: deal.win_probability,
  assigned_to: deal.owner_user_id,
  owner_id: deal.owner_user_id,
  lead_id: deal.source_lead_id,
});

// Helper to extract data array from response
const extractData = (response) => {
  if (response?.data?.success && Array.isArray(response?.data?.data)) {
    return response.data.data;
  }
  if (Array.isArray(response?.data)) {
    return response.data;
  }
  return [];
};

// ============================================
// CUSTOMERS API (v2)
// Replaces: contactsAPI
// ============================================
export const customersAPI = {
  getAll: async (params) => {
    const response = await api.get(`${V2_BASE}/customers`, { params });
    const transformed = transformResponse(response);
    if (transformed.data && Array.isArray(transformed.data)) {
      transformed.data = transformed.data.map(transformCustomerV2toV1);
    }
    return transformed;
  },
  
  getById: async (id) => {
    const response = await api.get(`${V2_BASE}/customers/${id}`);
    const transformed = transformResponse(response);
    if (transformed.data && !Array.isArray(transformed.data)) {
      transformed.data = transformCustomerV2toV1(transformed.data);
    }
    return transformed;
  },
  
  create: async (data) => {
    const response = await api.post(`${V2_BASE}/customers`, data);
    return transformResponse(response);
  },
  
  update: async (id, data) => {
    const response = await api.put(`${V2_BASE}/customers/${id}`, data);
    return transformResponse(response);
  },
  
  delete: async (id) => {
    return api.delete(`${V2_BASE}/customers/${id}`);
  },
  
  // Customer 360 View
  get360View: async (id) => {
    const response = await api.get(`${V2_BASE}/customers/${id}/360`);
    return transformResponse(response);
  },
  
  // Identity Management
  addIdentity: (customerId, data) => api.post(`${V2_BASE}/customers/${customerId}/identities`, data),
  listIdentities: (customerId) => api.get(`${V2_BASE}/customers/${customerId}/identities`),
  
  // Address Management
  addAddress: (customerId, data) => api.post(`${V2_BASE}/customers/${customerId}/addresses`, data),
  listAddresses: (customerId) => api.get(`${V2_BASE}/customers/${customerId}/addresses`),
  
  // Deduplication
  findDuplicates: (phone, email) => api.get(`${V2_BASE}/customers/duplicates`, { params: { phone, email } }),
  mergeCustomers: (primaryId, secondaryIds) => api.post(`${V2_BASE}/customers/merge`, { primary_id: primaryId, secondary_ids: secondaryIds }),
};

// Backward compatible alias
export const contactsAPI = {
  getAll: customersAPI.getAll,
  getById: customersAPI.getById,
  create: customersAPI.create,
  update: customersAPI.update,
  delete: customersAPI.delete,
  changeStatus: async (id, data) => customersAPI.update(id, { status: data.status }),
  getUnifiedProfile: customersAPI.get360View,
};

// ============================================
// LEADS API (v2)
// ============================================
export const leadsAPI = {
  getAll: async (params) => {
    const response = await api.get(`${V2_BASE}/leads`, { params });
    const transformed = transformResponse(response);
    // Transform each lead to v1 format
    if (transformed.data && Array.isArray(transformed.data)) {
      transformed.data = transformed.data.map(transformLeadV2toV1);
    }
    return transformed;
  },
  
  getById: async (id) => {
    const response = await api.get(`${V2_BASE}/leads/${id}`);
    const transformed = transformResponse(response);
    if (transformed.data && !Array.isArray(transformed.data)) {
      transformed.data = transformLeadV2toV1(transformed.data);
    }
    return transformed;
  },
  
  create: async (data) => {
    const response = await api.post(`${V2_BASE}/leads`, data);
    return transformResponse(response);
  },
  
  update: async (id, data) => {
    const response = await api.put(`${V2_BASE}/leads/${id}`, data);
    return transformResponse(response);
  },
  
  delete: async (id) => {
    return api.delete(`${V2_BASE}/leads/${id}`);
  },
  
  // Lead Actions
  convert: (id, data) => api.post(`${V2_BASE}/leads/${id}/convert`, data),
  qualify: (id, data) => api.patch(`${V2_BASE}/leads/${id}/qualify`, data),
  disqualify: (id, data) => api.patch(`${V2_BASE}/leads/${id}/disqualify`, data),
  assign: (id, userId) => api.patch(`${V2_BASE}/leads/${id}/assign`, { owner_user_id: userId }),
  
  // Stage change (backward compatible)
  changeStage: async (id, data) => {
    const response = await api.put(`${V2_BASE}/leads/${id}`, { lead_status: data.stage });
    return transformResponse(response);
  },
  
  // Activities
  addActivity: (leadId, data) => api.post(`${V2_BASE}/leads/${leadId}/activities`, data),
  listActivities: (leadId) => api.get(`${V2_BASE}/leads/${leadId}/activities`),
  
  // Statistics
  getStats: (params = {}) => api.get(`${V2_BASE}/leads/stats`, { params }),
  getFunnel: (params = {}) => api.get(`${V2_BASE}/leads/funnel`, { params }),
};

// Backward compatible alias
export const crmLeadsAPI = {
  getAll: leadsAPI.getAll,
  getById: leadsAPI.getById,
  create: leadsAPI.create,
  update: leadsAPI.update,
  changeStage: leadsAPI.changeStage,
  assign: async (id, userId, reason) => {
    return api.patch(`${V2_BASE}/leads/${id}/assign`, { owner_user_id: userId, reason });
  },
};

// ============================================
// DEALS API (v2)
// ============================================
export const dealsAPI = {
  getAll: async (params) => {
    const response = await api.get(`${V2_BASE}/deals`, { params });
    const transformed = transformResponse(response);
    if (transformed.data && Array.isArray(transformed.data)) {
      transformed.data = transformed.data.map(transformDealV2toV1);
    }
    return transformed;
  },
  
  getById: async (id) => {
    const response = await api.get(`${V2_BASE}/deals/${id}`);
    const transformed = transformResponse(response);
    if (transformed.data && !Array.isArray(transformed.data)) {
      transformed.data = transformDealV2toV1(transformed.data);
    }
    return transformed;
  },
  
  create: async (data) => {
    const response = await api.post(`${V2_BASE}/deals`, data);
    return transformResponse(response);
  },
  
  update: async (id, data) => {
    const response = await api.put(`${V2_BASE}/deals/${id}`, data);
    return transformResponse(response);
  },
  
  delete: async (id) => {
    return api.delete(`${V2_BASE}/deals/${id}`);
  },
  
  // Deal Stage Transitions
  moveStage: (id, stageCode, note) => api.patch(`${V2_BASE}/deals/${id}/stage`, { stage_code: stageCode, note }),
  win: (id, data) => api.post(`${V2_BASE}/deals/${id}/win`, data),
  lose: (id, data) => api.post(`${V2_BASE}/deals/${id}/lose`, data),
  
  // Statistics
  getStats: (params = {}) => api.get(`${V2_BASE}/deals/stats`, { params }),
  getPipeline: (params = {}) => api.get(`${V2_BASE}/deals/pipeline`, { params }),
  
  // History
  getHistory: (id) => api.get(`${V2_BASE}/deals/${id}/history`),
};

// ============================================
// BOOKINGS API (v2)
// ============================================
export const bookingsAPI = {
  getAll: async (params) => {
    const response = await api.get(`${V2_BASE}/bookings`, { params });
    const bookingsData = response.data?.data || response.data || [];
    
    // Fetch related customers and products for display
    const customerIds = [...new Set(bookingsData.map(b => b.customer_id).filter(Boolean))];
    const productIds = [...new Set(bookingsData.map(b => b.product_id).filter(Boolean))];
    const projectIds = [...new Set(bookingsData.map(b => b.project_id).filter(Boolean))];
    
    // Fetch customers in parallel
    const customersMap = {};
    const productsMap = {};
    const projectsMap = {};
    
    try {
      // Fetch all related data
      const [customersRes, productsRes, projectsRes] = await Promise.all([
        customerIds.length > 0 ? api.get(`${V2_BASE}/customers`, { params: { limit: 100 } }) : { data: { data: [] } },
        productIds.length > 0 ? api.get(`${V2_BASE}/products`, { params: { limit: 100 } }) : { data: { data: [] } },
        projectIds.length > 0 ? api.get(`${V2_BASE}/projects`, { params: { limit: 100 } }) : { data: { data: [] } },
      ]);
      
      // Build lookup maps
      (customersRes.data?.data || []).forEach(c => { customersMap[c.id] = c; });
      (productsRes.data?.data || []).forEach(p => { productsMap[p.id] = p; });
      (projectsRes.data?.data || []).forEach(p => { projectsMap[p.id] = p; });
    } catch (e) {
      console.warn('Could not fetch related data for bookings:', e);
    }
    
    // Transform bookings with related data
    const transformedBookings = bookingsData.map((booking, index) => {
      const customer = customersMap[booking.customer_id] || {};
      const product = productsMap[booking.product_id] || {};
      const project = projectsMap[booking.project_id] || {};
      
      return {
        ...booking,
        // Legacy field mappings for UI compatibility
        code: booking.booking_code,
        status: booking.booking_status,
        queue_number: index + 1,
        contact_name: customer.full_name || `KH-${booking.customer_id?.substring(0, 6) || 'N/A'}`,
        contact_phone: customer.phone || '',
        customer_name: customer.full_name || '',
        product_name: product.title || product.product_code || `SP-${booking.product_id?.substring(0, 6) || 'N/A'}`,
        product_code: product.product_code || '',
        project_name: project.project_name || `DA-${booking.project_id?.substring(0, 6) || 'N/A'}`,
        amount: booking.booking_amount,
        deposit_amount: booking.booking_amount,
        booking_tier: booking.booking_status === 'confirmed' ? 'vip' : 'standard',
      };
    });
    
    return {
      data: transformedBookings,
      meta: response.data?.meta || { total: transformedBookings.length }
    };
  },
  
  getById: async (id) => {
    const response = await api.get(`${V2_BASE}/bookings/${id}`);
    return transformResponse(response);
  },
  
  create: async (data) => {
    const response = await api.post(`${V2_BASE}/bookings`, data);
    return transformResponse(response);
  },
  
  update: async (id, data) => {
    const response = await api.put(`${V2_BASE}/bookings/${id}`, data);
    return transformResponse(response);
  },
  
  delete: async (id) => {
    return api.delete(`${V2_BASE}/bookings/${id}`);
  },
  
  // Booking Actions
  confirm: (id, data) => api.post(`${V2_BASE}/bookings/${id}/confirm`, data),
  cancel: (id, data) => api.post(`${V2_BASE}/bookings/${id}/cancel`, data),
  upgrade: (id, data) => api.post(`${V2_BASE}/bookings/${id}/upgrade`, data),  // soft → hard
  
  // Deposit Management
  recordDeposit: (id, data) => api.post(`${V2_BASE}/bookings/${id}/deposit`, data),
  refundDeposit: (id, data) => api.post(`${V2_BASE}/bookings/${id}/refund`, data),
  
  // Statistics
  getStats: (params = {}) => api.get(`${V2_BASE}/bookings/stats`, { params }),
  getByProject: (projectId) => api.get(`${V2_BASE}/bookings/by-project`, { params: { project_id: projectId } }),
};

// ============================================
// CONTRACTS API (v2)
// ============================================
export const contractsAPI = {
  getAll: async (params) => {
    const response = await api.get(`${V2_BASE}/contracts`, { params });
    return transformResponse(response);
  },
  
  getById: async (id) => {
    const response = await api.get(`${V2_BASE}/contracts/${id}`);
    return transformResponse(response);
  },
  
  create: async (data) => {
    const response = await api.post(`${V2_BASE}/contracts`, data);
    return transformResponse(response);
  },
  
  update: async (id, data) => {
    const response = await api.put(`${V2_BASE}/contracts/${id}`, data);
    return transformResponse(response);
  },
  
  delete: async (id) => {
    return api.delete(`${V2_BASE}/contracts/${id}`);
  },
  
  // Contract Lifecycle
  submit: (id) => api.post(`${V2_BASE}/contracts/${id}/submit`),
  approve: (id, data) => api.post(`${V2_BASE}/contracts/${id}/approve`, data),
  reject: (id, data) => api.post(`${V2_BASE}/contracts/${id}/reject`, data),
  sign: (id, data) => api.post(`${V2_BASE}/contracts/${id}/sign`, data),
  activate: (id) => api.post(`${V2_BASE}/contracts/${id}/activate`),
  terminate: (id, data) => api.post(`${V2_BASE}/contracts/${id}/terminate`, data),
  
  // Documents
  addDocument: (contractId, data) => api.post(`${V2_BASE}/contracts/${contractId}/documents`, data),
  listDocuments: (contractId) => api.get(`${V2_BASE}/contracts/${contractId}/documents`),
  
  // Statistics
  getStats: (params = {}) => api.get(`${V2_BASE}/contracts/stats`, { params }),
  getPending: () => api.get(`${V2_BASE}/contracts/pending`),
};

// ============================================
// PAYMENTS API (v2)
// ============================================
export const paymentsAPI = {
  getAll: async (params) => {
    const response = await api.get(`${V2_BASE}/payments`, { params });
    return transformResponse(response);
  },
  
  getById: async (id) => {
    const response = await api.get(`${V2_BASE}/payments/${id}`);
    return transformResponse(response);
  },
  
  create: async (data) => {
    const response = await api.post(`${V2_BASE}/payments`, data);
    return transformResponse(response);
  },
  
  update: async (id, data) => {
    const response = await api.put(`${V2_BASE}/payments/${id}`, data);
    return transformResponse(response);
  },
  
  delete: async (id) => {
    return api.delete(`${V2_BASE}/payments/${id}`);
  },
  
  // Payment Actions
  confirm: (id, data) => api.post(`${V2_BASE}/payments/${id}/confirm`, data),
  cancel: (id, data) => api.post(`${V2_BASE}/payments/${id}/cancel`, data),
  
  // Payment Schedule
  getSchedule: (contractId) => api.get(`${V2_BASE}/payments/schedule/${contractId}`),
  createSchedule: (contractId, data) => api.post(`${V2_BASE}/payments/schedule/${contractId}`, data),
  
  // Statistics
  getStats: (params = {}) => api.get(`${V2_BASE}/payments/stats`, { params }),
  getReceivables: (params = {}) => api.get(`${V2_BASE}/payments/receivables`, { params }),
  getOverdue: (params = {}) => api.get(`${V2_BASE}/payments/overdue`, { params }),
};

// ============================================
// CRM CONFIG API (v2 compatible)
// ============================================
export const crmConfigAPI = {
  getLeadStages: () => Promise.resolve({
    data: {
      stages: [
        { code: 'new', label: 'Mới', color: 'blue' },
        { code: 'contacted', label: 'Đã liên hệ', color: 'yellow' },
        { code: 'qualified', label: 'Đủ điều kiện', color: 'green' },
        { code: 'negotiating', label: 'Đang thương lượng', color: 'purple' },
        { code: 'won', label: 'Thành công', color: 'emerald' },
        { code: 'lost', label: 'Thất bại', color: 'red' },
      ]
    }
  }),
  
  getDealStages: () => Promise.resolve({
    data: {
      stages: [
        { code: 'new', label: 'Mới', color: 'blue' },
        { code: 'qualified', label: 'Qualified', color: 'yellow' },
        { code: 'proposal', label: 'Đề xuất', color: 'purple' },
        { code: 'negotiation', label: 'Thương lượng', color: 'orange' },
        { code: 'won', label: 'Thành công', color: 'green' },
        { code: 'lost', label: 'Thất bại', color: 'red' },
      ]
    }
  }),
  
  getContactStatuses: () => Promise.resolve({
    data: [
      { code: 'active', label: 'Hoạt động' },
      { code: 'inactive', label: 'Không hoạt động' },
    ]
  }),
  
  getInteractionTypes: () => Promise.resolve({
    data: [
      { code: 'call', label: 'Gọi điện' },
      { code: 'email', label: 'Email' },
      { code: 'meeting', label: 'Gặp mặt' },
      { code: 'note', label: 'Ghi chú' },
    ]
  }),
};

// ============================================
// DEMANDS API (v2 compatible - maps to leads with demands)
// ============================================
export const demandsAPI = {
  getAll: async (params) => {
    // For now, filter leads that have demand information
    const response = await leadsAPI.getAll({ ...params, has_demand: true });
    return response;
  },
  getById: leadsAPI.getById,
  create: async (data) => {
    // Create lead with demand fields
    return leadsAPI.create({
      ...data,
      has_demand: true,
    });
  },
  update: leadsAPI.update,
  matchProducts: async (id) => {
    return api.post(`${V2_BASE}/leads/${id}/match-products`);
  },
};

// ============================================
// INTERACTIONS API (v2)
// ============================================
export const crmInteractionsAPI = {
  getAll: (params) => api.get(`${V2_BASE}/activities`, { params }),
  create: (data) => api.post(`${V2_BASE}/activities`, data),
  getContactTimeline: (customerId, params) => 
    api.get(`${V2_BASE}/customers/${customerId}/activities`, { params }),
};

// ============================================
// DUPLICATES API (v2)
// ============================================
export const duplicatesAPI = {
  check: (data) => api.post(`${V2_BASE}/customers/duplicates/check`, data),
  getAll: (params) => api.get(`${V2_BASE}/customers/duplicates`, { params }),
  merge: (data) => api.post(`${V2_BASE}/customers/merge`, data),
};

// ============================================
// ASSIGNMENT HISTORY API (v2)
// ============================================
export const assignmentHistoryAPI = {
  getAll: (params) => api.get(`${V2_BASE}/assignments/history`, { params }),
};

// ============================================
// COMMISSIONS API (v2)
// ============================================
export const commissionsAPI = {
  getAll: async (params = {}) => {
    const response = await api.get(`${V2_BASE}/commissions`, { params });
    return response.data;
  },
  
  getById: async (id) => {
    const response = await api.get(`${V2_BASE}/commissions/${id}`);
    return response.data;
  },
  
  getPendingApprovals: async (params = {}) => {
    const response = await api.get(`${V2_BASE}/commissions/pending-approvals`, { params });
    return response.data;
  },
  
  getSummary: async (params = {}) => {
    const response = await api.get(`${V2_BASE}/commissions/summary`, { params });
    return response.data;
  },
  
  approve: async (id, data = {}) => {
    const response = await api.post(`${V2_BASE}/commissions/${id}/approve`, data);
    return response.data;
  },
  
  reject: async (id, data) => {
    const response = await api.post(`${V2_BASE}/commissions/${id}/reject`, data);
    return response.data;
  },
  
  updatePayoutStatus: async (id, data) => {
    const response = await api.put(`${V2_BASE}/commissions/${id}/payout-status`, data);
    return response.data;
  },
  
  getByUser: async (userId, params = {}) => {
    const response = await api.get(`${V2_BASE}/commissions/by-user/${userId}`, { params });
    return response.data;
  },
};

// ============================================
// HELPER FUNCTIONS
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

// ============================================
// DEFAULT EXPORT
// ============================================
export default {
  customers: customersAPI,
  contacts: contactsAPI,  // Backward compatible
  leads: leadsAPI,
  crmLeads: crmLeadsAPI,  // Backward compatible
  deals: dealsAPI,
  bookings: bookingsAPI,
  contracts: contractsAPI,
  payments: paymentsAPI,
  commissions: commissionsAPI,
  demands: demandsAPI,
  interactions: crmInteractionsAPI,
  duplicates: duplicatesAPI,
  assignmentHistory: assignmentHistoryAPI,
  config: crmConfigAPI,
};
