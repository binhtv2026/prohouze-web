/**
 * Contract & Document API Library
 * Prompt 9/20 - Contract & Document Workflow Engine
 */

const API_URL = process.env.REACT_APP_BACKEND_URL;

// ═══════════════════════════════════════════════════════════════════════════════
// CONTRACT APIs
// ═══════════════════════════════════════════════════════════════════════════════

export const contractApi = {
  // Reference data
  getTypes: () => fetch(`${API_URL}/api/contracts/types`).then(r => r.json()),
  getStatuses: () => fetch(`${API_URL}/api/contracts/status`).then(r => r.json()),
  getPipeline: () => fetch(`${API_URL}/api/contracts/pipeline`).then(r => r.json()),

  // CRUD
  list: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetch(`${API_URL}/api/contracts${query ? '?' + query : ''}`).then(r => r.json());
  },
  
  get: (id) => fetch(`${API_URL}/api/contracts/${id}`).then(r => r.json()),
  
  create: (data) => fetch(`${API_URL}/api/contracts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(r => r.json()),
  
  update: (id, data) => fetch(`${API_URL}/api/contracts/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(r => r.json()),

  // Workflow actions
  submit: (id) => fetch(`${API_URL}/api/contracts/${id}/submit`, {
    method: 'POST'
  }).then(r => r.json()),
  
  approve: (id, data) => fetch(`${API_URL}/api/contracts/${id}/approve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(r => r.json()),
  
  reject: (id, data) => fetch(`${API_URL}/api/contracts/${id}/reject`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(r => r.json()),
  
  sign: (id, data) => fetch(`${API_URL}/api/contracts/${id}/sign`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(r => r.json()),
  
  activate: (id) => fetch(`${API_URL}/api/contracts/${id}/activate`, {
    method: 'POST'
  }).then(r => r.json()),

  // Payments
  addPayment: (id, data) => fetch(`${API_URL}/api/contracts/${id}/payments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(r => r.json()),
  
  getPayments: (id) => fetch(`${API_URL}/api/contracts/${id}/payments`).then(r => r.json()),

  // Amendments
  createAmendment: (id, data) => fetch(`${API_URL}/api/contracts/${id}/amendments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(r => r.json()),
  
  getAmendments: (id) => fetch(`${API_URL}/api/contracts/${id}/amendments`).then(r => r.json()),

  // Audit
  getAuditLogs: (id) => fetch(`${API_URL}/api/contracts/${id}/audit-logs`).then(r => r.json()),
};

// ═══════════════════════════════════════════════════════════════════════════════
// DOCUMENT APIs
// ═══════════════════════════════════════════════════════════════════════════════

export const documentApi = {
  // Reference data
  getCategories: () => fetch(`${API_URL}/api/documents/categories`).then(r => r.json()),
  getStatuses: () => fetch(`${API_URL}/api/documents/statuses`).then(r => r.json()),

  // CRUD
  list: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetch(`${API_URL}/api/documents${query ? '?' + query : ''}`).then(r => r.json());
  },
  
  get: (id) => fetch(`${API_URL}/api/documents/${id}`).then(r => r.json()),
  
  upload: (formData) => fetch(`${API_URL}/api/documents/upload`, {
    method: 'POST',
    body: formData
  }).then(r => r.json()),
  
  delete: (id) => fetch(`${API_URL}/api/documents/${id}`, {
    method: 'DELETE'
  }).then(r => r.json()),

  // Versioning
  createVersion: (id, formData) => fetch(`${API_URL}/api/documents/${id}/versions`, {
    method: 'POST',
    body: formData
  }).then(r => r.json()),
  
  getVersions: (id) => fetch(`${API_URL}/api/documents/${id}/versions`).then(r => r.json()),

  // Verification
  verify: (id) => fetch(`${API_URL}/api/documents/${id}/verify`, {
    method: 'POST'
  }).then(r => r.json()),

  // Download
  getDownloadUrl: (id) => `${API_URL}/api/documents/${id}/download`,

  // By entity
  getByContract: (contractId) => fetch(`${API_URL}/api/documents/by-contract/${contractId}`).then(r => r.json()),
  
  // Checklist
  getChecklist: (contractId) => fetch(`${API_URL}/api/documents/checklist/${contractId}`).then(r => r.json()),
};

// ═══════════════════════════════════════════════════════════════════════════════
// HELPER CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

export const CONTRACT_STATUS_COLORS = {
  draft: 'bg-slate-100 text-slate-700',
  pending_review: 'bg-amber-100 text-amber-700',
  revision_required: 'bg-orange-100 text-orange-700',
  approved: 'bg-blue-100 text-blue-700',
  pending_signature: 'bg-purple-100 text-purple-700',
  signed: 'bg-emerald-100 text-emerald-700',
  active: 'bg-green-100 text-green-700',
  completed: 'bg-teal-100 text-teal-700',
  expired: 'bg-gray-100 text-gray-700',
  terminated: 'bg-red-100 text-red-700',
  cancelled: 'bg-red-100 text-red-700',
  archived: 'bg-gray-100 text-gray-500',
};

export const LOCKED_STATUSES = ['signed', 'active', 'completed', 'cancelled', 'archived'];

export const isContractLocked = (status) => LOCKED_STATUSES.includes(status);

export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};
