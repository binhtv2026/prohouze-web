/**
 * Sales Pipeline API
 * TASK 4 - FRONTEND FOR SALES PIPELINE
 * 
 * Connects to backend APIs at /api/pipeline/*
 */

import { api } from '@/lib/api';

/**
 * Pipeline API Client
 */
export const pipelineApi = {
  /**
   * Get pipeline stages configuration
   */
  getStages: async () => {
    const res = await api.get('/pipeline/config/stages');
    return res.data;
  },

  /**
   * Get all deals
   */
  getDeals: async (params = {}) => {
    const res = await api.get('/pipeline/deals', { params });
    return res.data;
  },

  /**
   * Get single deal by ID
   */
  getDeal: async (dealId) => {
    const res = await api.get(`/pipeline/deals/${dealId}`);
    return res.data;
  },

  /**
   * Create a new deal
   */
  createDeal: async (data) => {
    const res = await api.post('/pipeline/deals', data);
    return res.data;
  },

  /**
   * Change deal stage (triggers inventory sync)
   */
  changeStage: async (dealId, newStage, notes = null) => {
    const res = await api.patch(`/pipeline/deals/${dealId}/stage`, { new_stage: newStage, notes });
    return res.data;
  },

  /**
   * Get pipeline statistics
   */
  getStats: async () => {
    const res = await api.get('/pipeline/stats');
    return res.data;
  },

  /**
   * Get Kanban view data (optimized for UI)
   */
  getKanban: async () => {
    const res = await api.get('/pipeline/kanban');
    return res.data;
  },

  /**
   * Get deal events (activity log)
   */
  getDealEvents: async (dealId) => {
    const res = await api.get(`/pipeline/deals/${dealId}/events`);
    return res.data;
  },
};

/**
 * Manager Control API Client
 */
export const managerApi = {
  /**
   * Get inventory summary
   */
  getInventorySummary: async () => {
    const res = await api.get('/manager/inventory/summary');
    return res.data;
  },

  /**
   * Get active holds
   */
  getActiveHolds: async (page = 1, pageSize = 50) => {
    const res = await api.get('/manager/inventory/holds', { params: { page, page_size: pageSize } });
    return res.data;
  },

  /**
   * Get overdue holds
   */
  getOverdueHolds: async () => {
    const res = await api.get('/manager/inventory/overdue');
    return res.data;
  },

  /**
   * Get unassigned products
   */
  getUnassignedProducts: async (page = 1, pageSize = 50) => {
    const res = await api.get('/manager/inventory/unassigned', { params: { page, page_size: pageSize } });
    return res.data;
  },

  /**
   * Get blocked products
   */
  getBlockedProducts: async (days = 7) => {
    const res = await api.get('/manager/inventory/blocked', { params: { days } });
    return res.data;
  },

  /**
   * Force release a hold
   */
  forceReleaseHold: async (productId, reason) => {
    const res = await api.post('/manager/inventory/force-release', { product_id: productId, reason });
    return res.data;
  },

  /**
   * Reassign product owner
   */
  reassignOwner: async (productId, newOwnerId, reason) => {
    const res = await api.post('/manager/inventory/reassign', { product_id: productId, new_owner_id: newOwnerId, reason });
    return res.data;
  },

  /**
   * Override deal stage
   */
  overrideDealStage: async (dealId, newStage, reason) => {
    const res = await api.post('/manager/inventory/override-stage', { deal_id: dealId, new_stage: newStage, reason });
    return res.data;
  },

  /**
   * Get dashboard summary
   */
  getDashboardSummary: async (teamId = null, dateFrom = null, dateTo = null) => {
    const params = {};
    if (teamId) params.team_id = teamId;
    if (dateFrom) params.date_from = dateFrom;
    if (dateTo) params.date_to = dateTo;
    
    const res = await api.get('/manager/dashboard/summary', { params });
    return res.data;
  },

  /**
   * Get sales performance
   */
  getSalesPerformance: async (teamId = null, limit = 20) => {
    const params = { limit };
    if (teamId) params.team_id = teamId;
    
    const res = await api.get('/manager/dashboard/performance', { params });
    return res.data;
  },

  /**
   * Get pipeline analysis
   */
  getPipelineAnalysis: async (teamId = null) => {
    const params = {};
    if (teamId) params.team_id = teamId;
    
    const res = await api.get('/manager/dashboard/pipeline', { params });
    return res.data;
  },

  /**
   * Get pending approvals
   */
  getPendingApprovals: async (requestType = null, requiredRole = null, page = 1) => {
    const params = { page };
    if (requestType) params.request_type = requestType;
    if (requiredRole) params.required_role = requiredRole;
    
    const res = await api.get('/manager/approvals', { params });
    return res.data;
  },

  /**
   * Get approval stats
   */
  getApprovalStats: async () => {
    const res = await api.get('/manager/approvals/stats');
    return res.data;
  },

  /**
   * Approve a request
   */
  approveRequest: async (approvalId, notes = null) => {
    const res = await api.post(`/manager/approvals/${approvalId}/approve`, { notes });
    return res.data;
  },

  /**
   * Reject a request
   */
  rejectRequest: async (approvalId, reason) => {
    const res = await api.post(`/manager/approvals/${approvalId}/reject`, { reason });
    return res.data;
  },

  /**
   * Check if approval is needed
   */
  checkApprovalNeeded: async (value, discountPercent = null) => {
    const params = { value };
    if (discountPercent) params.discount_percent = discountPercent;
    
    const res = await api.post('/manager/check-approval', null, { params });
    return res.data;
  },
};

export default { pipelineApi, managerApi };
