/**
 * ProHouze Commission API
 * Prompt 11/20 - Commission Engine
 */

const API_URL = process.env.REACT_APP_BACKEND_URL;

// Helper to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIG APIs
// ═══════════════════════════════════════════════════════════════════════════════

export const getTriggers = async () => {
  const res = await fetch(`${API_URL}/api/commission/config/triggers`);
  return res.json();
};

export const getSplitTypes = async () => {
  const res = await fetch(`${API_URL}/api/commission/config/split-types`);
  return res.json();
};

export const getStatuses = async () => {
  const res = await fetch(`${API_URL}/api/commission/config/statuses`);
  return res.json();
};

// ═══════════════════════════════════════════════════════════════════════════════
// POLICY APIs
// ═══════════════════════════════════════════════════════════════════════════════

export const createPolicy = async (data) => {
  const res = await fetch(`${API_URL}/api/commission/policies`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create policy');
  return res.json();
};

export const listPolicies = async (params = {}) => {
  const query = new URLSearchParams(params).toString();
  const res = await fetch(`${API_URL}/api/commission/policies?${query}`, {
    headers: getAuthHeaders(),
  });
  return res.json();
};

export const getPolicy = async (policyId) => {
  const res = await fetch(`${API_URL}/api/commission/policies/${policyId}`, {
    headers: getAuthHeaders(),
  });
  return res.json();
};

export const activatePolicy = async (policyId) => {
  const res = await fetch(`${API_URL}/api/commission/policies/${policyId}/activate`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });
  return res.json();
};

export const deactivatePolicy = async (policyId) => {
  const res = await fetch(`${API_URL}/api/commission/policies/${policyId}/deactivate`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });
  return res.json();
};

// ═══════════════════════════════════════════════════════════════════════════════
// COMMISSION RECORD APIs
// ═══════════════════════════════════════════════════════════════════════════════

export const listRecords = async (params = {}) => {
  const query = new URLSearchParams(params).toString();
  const res = await fetch(`${API_URL}/api/commission/records?${query}`, {
    headers: getAuthHeaders(),
  });
  return res.json();
};

export const getRecord = async (recordId) => {
  const res = await fetch(`${API_URL}/api/commission/records/${recordId}`, {
    headers: getAuthHeaders(),
  });
  return res.json();
};

export const getRecordsByContract = async (contractId) => {
  const res = await fetch(`${API_URL}/api/commission/records/by-contract/${contractId}`, {
    headers: getAuthHeaders(),
  });
  return res.json();
};

export const adjustCommission = async (recordId, data) => {
  const res = await fetch(`${API_URL}/api/commission/records/${recordId}/adjust`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  return res.json();
};

export const raiseDispute = async (recordId, reason) => {
  const res = await fetch(`${API_URL}/api/commission/records/${recordId}/dispute?reason=${encodeURIComponent(reason)}`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });
  return res.json();
};

export const resolveDispute = async (recordId, resolution) => {
  const res = await fetch(`${API_URL}/api/commission/records/${recordId}/resolve-dispute?resolution=${encodeURIComponent(resolution)}`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });
  return res.json();
};

// ═══════════════════════════════════════════════════════════════════════════════
// CALCULATION APIs
// ═══════════════════════════════════════════════════════════════════════════════

export const calculateCommission = async (data) => {
  const res = await fetch(`${API_URL}/api/commission/calculate`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  return res.json();
};

export const calculateAndCreate = async (data) => {
  const res = await fetch(`${API_URL}/api/commission/calculate-and-create`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  return res.json();
};

// ═══════════════════════════════════════════════════════════════════════════════
// APPROVAL APIs
// ═══════════════════════════════════════════════════════════════════════════════

export const getPendingApprovals = async (params = {}) => {
  const query = new URLSearchParams(params).toString();
  const res = await fetch(`${API_URL}/api/commission/approvals/pending?${query}`, {
    headers: getAuthHeaders(),
  });
  return res.json();
};

export const submitForApproval = async (recordId) => {
  const res = await fetch(`${API_URL}/api/commission/records/${recordId}/submit-for-approval`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });
  return res.json();
};

export const approveCommission = async (recordId, comments = null) => {
  const url = comments
    ? `${API_URL}/api/commission/records/${recordId}/approve?comments=${encodeURIComponent(comments)}`
    : `${API_URL}/api/commission/records/${recordId}/approve`;
  const res = await fetch(url, {
    method: 'POST',
    headers: getAuthHeaders(),
  });
  return res.json();
};

export const rejectCommission = async (recordId, reason) => {
  const res = await fetch(`${API_URL}/api/commission/records/${recordId}/reject?reason=${encodeURIComponent(reason)}`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });
  return res.json();
};

export const getApprovalHistory = async (recordId) => {
  const res = await fetch(`${API_URL}/api/commission/approvals/history/${recordId}`, {
    headers: getAuthHeaders(),
  });
  return res.json();
};

// ═══════════════════════════════════════════════════════════════════════════════
// PAYOUT APIs
// ═══════════════════════════════════════════════════════════════════════════════

export const createPayoutBatch = async (data) => {
  const res = await fetch(`${API_URL}/api/commission/payouts/batches`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  return res.json();
};

export const listPayoutBatches = async (params = {}) => {
  const query = new URLSearchParams(params).toString();
  const res = await fetch(`${API_URL}/api/commission/payouts/batches?${query}`, {
    headers: getAuthHeaders(),
  });
  return res.json();
};

export const getPayoutBatch = async (batchId) => {
  const res = await fetch(`${API_URL}/api/commission/payouts/batches/${batchId}`, {
    headers: getAuthHeaders(),
  });
  return res.json();
};

export const getBatchRecords = async (batchId) => {
  const res = await fetch(`${API_URL}/api/commission/payouts/batches/${batchId}/records`, {
    headers: getAuthHeaders(),
  });
  return res.json();
};

export const approvePayoutBatch = async (batchId) => {
  const res = await fetch(`${API_URL}/api/commission/payouts/batches/${batchId}/approve`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });
  return res.json();
};

export const markPayoutPaid = async (payoutId, data = {}) => {
  const res = await fetch(`${API_URL}/api/commission/payouts/${payoutId}/mark-paid`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  return res.json();
};

export const getReadyForPayout = async (params = {}) => {
  const query = new URLSearchParams(params).toString();
  const res = await fetch(`${API_URL}/api/commission/payouts/ready-for-payout?${query}`, {
    headers: getAuthHeaders(),
  });
  return res.json();
};

// ═══════════════════════════════════════════════════════════════════════════════
// INCOME DASHBOARD APIs
// ═══════════════════════════════════════════════════════════════════════════════

export const getMyIncome = async (params = {}) => {
  const query = new URLSearchParams(params).toString();
  const res = await fetch(`${API_URL}/api/commission/my-income?${query}`, {
    headers: getAuthHeaders(),
  });
  return res.json();
};

// Phase 5: KPI x Commission Integration
export const getMyIncomeWithKPI = async (params = {}) => {
  const query = new URLSearchParams(params).toString();
  const res = await fetch(`${API_URL}/api/commission/my-income/with-kpi?${query}`, {
    headers: getAuthHeaders(),
  });
  return res.json();
};

export const getMyIncomeRecords = async (params = {}) => {
  const query = new URLSearchParams(params).toString();
  const res = await fetch(`${API_URL}/api/commission/my-income/records?${query}`, {
    headers: getAuthHeaders(),
  });
  return res.json();
};

export const getTeamIncome = async (params = {}) => {
  const query = new URLSearchParams(params).toString();
  const res = await fetch(`${API_URL}/api/commission/team-income?${query}`, {
    headers: getAuthHeaders(),
  });
  return res.json();
};

export const getCompanyIncome = async (params = {}) => {
  const query = new URLSearchParams(params).toString();
  const res = await fetch(`${API_URL}/api/commission/company-income?${query}`, {
    headers: getAuthHeaders(),
  });
  return res.json();
};

// ═══════════════════════════════════════════════════════════════════════════════
// STATISTICS APIs
// ═══════════════════════════════════════════════════════════════════════════════

export const getCommissionOverview = async (params = {}) => {
  const query = new URLSearchParams(params).toString();
  const res = await fetch(`${API_URL}/api/commission/stats/overview?${query}`, {
    headers: getAuthHeaders(),
  });
  return res.json();
};

export default {
  // Config
  getTriggers,
  getSplitTypes,
  getStatuses,
  // Policy
  createPolicy,
  listPolicies,
  getPolicy,
  activatePolicy,
  deactivatePolicy,
  // Records
  listRecords,
  getRecord,
  getRecordsByContract,
  adjustCommission,
  raiseDispute,
  resolveDispute,
  // Calculation
  calculateCommission,
  calculateAndCreate,
  // Approval
  getPendingApprovals,
  submitForApproval,
  approveCommission,
  rejectCommission,
  getApprovalHistory,
  // Payout
  createPayoutBatch,
  listPayoutBatches,
  getPayoutBatch,
  getBatchRecords,
  approvePayoutBatch,
  markPayoutPaid,
  getReadyForPayout,
  // Income
  getMyIncome,
  getMyIncomeWithKPI,
  getMyIncomeRecords,
  getTeamIncome,
  getCompanyIncome,
  // Stats
  getCommissionOverview,
};
