/**
 * agencyApi.js — API Client cho Module Đại lý & Phân phối
 * Chuẩn hóa: 10/10 LOCKED
 */
import { apiV2 } from '@/lib/api';

const BASE = '/agency';

// ─── AGENCY MANAGEMENT ──────────────────────────────
export const agencyApi = {
  // Danh sách đại lý (có filter tier/status/project)
  getAgencies: (params = {}) =>
    apiV2.get(`${BASE}/agencies`, { params }),

  getAgencyById: (id) =>
    apiV2.get(`${BASE}/agencies/${id}`),

  getAgencyNetwork: (id) =>
    apiV2.get(`${BASE}/agencies/${id}/network`), // full tree F1→F2→F3

  createAgency: (data) =>
    apiV2.post(`${BASE}/agencies`, data),

  updateAgency: (id, data) =>
    apiV2.patch(`${BASE}/agencies/${id}`, data),

  approveAgency: (id) =>
    apiV2.post(`${BASE}/agencies/${id}/approve`),

  suspendAgency: (id, reason) =>
    apiV2.post(`${BASE}/agencies/${id}/suspend`, { reason }),

  // ─── NETWORK TREE ──────────────────────────────────
  getFullNetworkTree: () =>
    apiV2.get(`${BASE}/network/tree`),

  getNetworkStats: () =>
    apiV2.get(`${BASE}/network/stats`),

  // ─── INVENTORY ALLOCATION (Giỏ hàng phân bổ) ──────
  getAllocations: (params = {}) =>
    apiV2.get(`${BASE}/allocations`, { params }),

  getAllocationsByAgency: (agencyId) =>
    apiV2.get(`${BASE}/allocations/agency/${agencyId}`),

  getAllocationsByProject: (projectId) =>
    apiV2.get(`${BASE}/allocations/project/${projectId}`),

  createAllocation: (data) =>
    apiV2.post(`${BASE}/allocations`, data),

  updateAllocation: (id, data) =>
    apiV2.patch(`${BASE}/allocations/${id}`, data),

  revokeAllocation: (id, reason) =>
    apiV2.post(`${BASE}/allocations/${id}/revoke`, { reason }),

  extendExclusivity: (id, days) =>
    apiV2.post(`${BASE}/allocations/${id}/extend`, { days }),

  // ─── COMMISSION SPLITS ─────────────────────────────
  getSplitPolicy: (projectId) =>
    apiV2.get(`${BASE}/commission-splits/project/${projectId}`),

  createSplitPolicy: (data) =>
    apiV2.post(`${BASE}/commission-splits`, data),

  updateSplitPolicy: (id, data) =>
    apiV2.patch(`${BASE}/commission-splits/${id}`, data),

  // ─── PERFORMANCE ───────────────────────────────────
  getPerformanceList: (params = {}) =>
    apiV2.get(`${BASE}/performance`, { params }),

  getAgencyPerformance: (agencyId, period) =>
    apiV2.get(`${BASE}/performance/${agencyId}`, { params: { period } }),

  getLeaderboard: (period = 'this_month') =>
    apiV2.get(`${BASE}/leaderboard`, { params: { period } }),

  getDashboardStats: () =>
    apiV2.get(`${BASE}/dashboard/stats`),
};

export default agencyApi;
