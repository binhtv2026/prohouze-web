/**
 * ProHouze Finance API
 * API endpoints cho Hệ thống Tài chính
 */

const API_URL = process.env.REACT_APP_BACKEND_URL;

// Helper function
async function fetchAPI(endpoint, options = {}) {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Network error' }));
    throw new Error(error.detail || 'API error');
  }

  return response.json();
}

// ══════════════════════════════════════════════════════════════
// PAYMENT TRACKING
// ══════════════════════════════════════════════════════════════

export async function getPaymentInstallments(params = {}) {
  const queryString = new URLSearchParams(params).toString();
  return fetchAPI(`/api/finance/payments?${queryString}`);
}

export async function createPaymentInstallment(data) {
  return fetchAPI('/api/finance/payments', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function createPaymentsFromContract(contractId) {
  return fetchAPI(`/api/finance/payments/from-contract/${contractId}`, {
    method: 'POST',
  });
}

export async function updatePaymentStatus(installmentId, status, paidDate = null) {
  const params = new URLSearchParams({ status });
  if (paidDate) params.append('paid_date', paidDate);
  return fetchAPI(`/api/finance/payments/${installmentId}/status?${params}`, {
    method: 'PUT',
  });
}

export async function checkOverduePayments() {
  return fetchAPI('/api/finance/payments/check-overdue', { method: 'POST' });
}

// ══════════════════════════════════════════════════════════════
// PROJECT COMMISSION
// ══════════════════════════════════════════════════════════════

export async function getProjectCommissions(params = {}) {
  const queryString = new URLSearchParams(params).toString();
  return fetchAPI(`/api/finance/project-commissions?${queryString}`);
}

export async function createProjectCommission(data) {
  return fetchAPI('/api/finance/project-commissions', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getProjectCommissionRate(projectId) {
  return fetchAPI(`/api/finance/project-commissions/${projectId}/rate`);
}

// ══════════════════════════════════════════════════════════════
// FINANCE COMMISSION
// ══════════════════════════════════════════════════════════════

export async function getFinanceCommissions(params = {}) {
  const queryString = new URLSearchParams(params).toString();
  return fetchAPI(`/api/finance/commissions?${queryString}`);
}

export async function getFinanceCommission(commissionId) {
  return fetchAPI(`/api/finance/commissions/${commissionId}`);
}

export async function confirmDeveloperPayment(contractId) {
  return fetchAPI(`/api/finance/commissions/confirm/${contractId}`, {
    method: 'POST',
  });
}

// ══════════════════════════════════════════════════════════════
// COMMISSION SPLIT
// ══════════════════════════════════════════════════════════════

export async function getCommissionSplits(params = {}) {
  const queryString = new URLSearchParams(params).toString();
  return fetchAPI(`/api/finance/splits?${queryString}`);
}

export async function getMyCommissionSplits(params = {}) {
  const queryString = new URLSearchParams(params).toString();
  return fetchAPI(`/api/finance/splits/my?${queryString}`);
}

// ══════════════════════════════════════════════════════════════
// RECEIVABLE
// ══════════════════════════════════════════════════════════════

export async function getReceivables(params = {}) {
  const queryString = new URLSearchParams(params).toString();
  return fetchAPI(`/api/finance/receivables?${queryString}`);
}

export async function confirmReceivable(receivableId, dueDate = null) {
  const params = dueDate ? `?due_date=${dueDate}` : '';
  return fetchAPI(`/api/finance/receivables/${receivableId}/confirm${params}`, {
    method: 'POST',
  });
}

export async function recordReceivablePayment(receivableId, data) {
  return fetchAPI(`/api/finance/receivables/${receivableId}/payment`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// ══════════════════════════════════════════════════════════════
// INVOICE
// ══════════════════════════════════════════════════════════════

export async function getInvoices(params = {}) {
  const queryString = new URLSearchParams(params).toString();
  return fetchAPI(`/api/finance/invoices?${queryString}`);
}

export async function createInvoice(data) {
  return fetchAPI('/api/finance/invoices', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// ══════════════════════════════════════════════════════════════
// PAYOUT
// ══════════════════════════════════════════════════════════════

export async function getPayouts(params = {}) {
  const queryString = new URLSearchParams(params).toString();
  return fetchAPI(`/api/finance/payouts?${queryString}`);
}

export async function getMyPayouts(params = {}) {
  const queryString = new URLSearchParams(params).toString();
  return fetchAPI(`/api/finance/payouts/my?${queryString}`);
}

export async function approvePayout(payoutId, notes = null) {
  return fetchAPI(`/api/finance/payouts/${payoutId}/approve`, {
    method: 'POST',
    body: JSON.stringify({ notes }),
  });
}

export async function markPayoutPaid(payoutId, data) {
  return fetchAPI(`/api/finance/payouts/${payoutId}/mark-paid`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function batchApprovePayouts(payoutIds) {
  return fetchAPI('/api/finance/payouts/batch-approve', {
    method: 'POST',
    body: JSON.stringify(payoutIds),
  });
}

// ══════════════════════════════════════════════════════════════
// DASHBOARD
// ══════════════════════════════════════════════════════════════

export async function getCEODashboard(periodMonth = null, periodYear = null) {
  const params = new URLSearchParams();
  if (periodMonth) params.append('period_month', periodMonth);
  if (periodYear) params.append('period_year', periodYear);
  return fetchAPI(`/api/finance/dashboard/ceo?${params}`);
}

export async function getSaleDashboard(userId = null, periodMonth = null, periodYear = null) {
  const params = new URLSearchParams();
  if (userId) params.append('user_id', userId);
  if (periodMonth) params.append('period_month', periodMonth);
  if (periodYear) params.append('period_year', periodYear);
  return fetchAPI(`/api/finance/dashboard/sale?${params}`);
}

export async function getTaxDashboard(periodMonth = null, periodYear = null) {
  const params = new URLSearchParams();
  if (periodMonth) params.append('period_month', periodMonth);
  if (periodYear) params.append('period_year', periodYear);
  return fetchAPI(`/api/finance/dashboard/tax?${params}`);
}

// ══════════════════════════════════════════════════════════════
// SUMMARY
// ══════════════════════════════════════════════════════════════

export async function getReceivablesSummary() {
  return fetchAPI('/api/finance/summary/receivables');
}

export async function getPayoutsSummary() {
  return fetchAPI('/api/finance/summary/payouts');
}

// ══════════════════════════════════════════════════════════════
// WORKFLOW
// ══════════════════════════════════════════════════════════════

export async function triggerFullWorkflow(contractId) {
  return fetchAPI(`/api/finance/workflow/full-cycle/${contractId}`, {
    method: 'POST',
  });
}


// ══════════════════════════════════════════════════════════════
// AUTO FLOW ENGINE
// ══════════════════════════════════════════════════════════════

export async function triggerContractSigned(contractId) {
  return fetchAPI(`/api/finance/flow/contract-signed/${contractId}`, {
    method: 'POST',
  });
}

export async function triggerDeveloperPayment(contractId) {
  return fetchAPI(`/api/finance/flow/developer-payment/${contractId}`, {
    method: 'POST',
  });
}

export async function triggerReceivablePayment(receivableId, amount, paymentReference = null) {
  const params = new URLSearchParams({ amount });
  if (paymentReference) params.append('payment_reference', paymentReference);
  return fetchAPI(`/api/finance/flow/receivable-payment/${receivableId}?${params}`, {
    method: 'POST',
  });
}

export async function triggerApprovePayout(payoutId) {
  return fetchAPI(`/api/finance/flow/approve-payout/${payoutId}`, {
    method: 'POST',
  });
}

// ══════════════════════════════════════════════════════════════
// TIMELINE
// ══════════════════════════════════════════════════════════════

export async function getContractTimeline(contractId) {
  return fetchAPI(`/api/finance/timeline-steps/${contractId}`);
}

// ══════════════════════════════════════════════════════════════
// ALERTS
// ══════════════════════════════════════════════════════════════

export async function getFinanceAlerts() {
  return fetchAPI('/api/finance/alerts');
}

export async function checkFinanceAlerts() {
  return fetchAPI('/api/finance/alerts/check', { method: 'POST' });
}

export async function resolveFinanceAlert(alertId) {
  return fetchAPI(`/api/finance/alerts/${alertId}/resolve`, { method: 'POST' });
}

// ══════════════════════════════════════════════════════════════
// EVENTS LOG
// ══════════════════════════════════════════════════════════════

export async function getFinanceEvents(params = {}) {
  const queryString = new URLSearchParams(params).toString();
  return fetchAPI(`/api/finance/events?${queryString}`);
}

// ══════════════════════════════════════════════════════════════
// STATISTICS
// ══════════════════════════════════════════════════════════════

export async function getFlowStatistics() {
  return fetchAPI('/api/finance/stats/flow');
}

// ══════════════════════════════════════════════════════════════
// SEEDER (DEV/DEMO)
// ══════════════════════════════════════════════════════════════

export async function seedSampleData() {
  return fetchAPI('/api/finance/seed/sample-data', { method: 'POST' });
}

export async function verifySeedData() {
  return fetchAPI('/api/finance/seed/verify');
}

// ══════════════════════════════════════════════════════════════
// CEO TRUST PANEL
// ══════════════════════════════════════════════════════════════

export async function getTrustPanel(month, year) {
  const params = new URLSearchParams();
  if (month) params.append('month', month);
  if (year) params.append('year', year);
  return fetchAPI(`/api/finance/dashboard/trust?${params}`);
}

// ══════════════════════════════════════════════════════════════
// AUDIT LOGS
// ══════════════════════════════════════════════════════════════

export async function getAuditLogs(filters = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value) params.append(key, value);
  });
  return fetchAPI(`/api/finance/audit-logs?${params}`);
}

export async function getContractAuditTrail(contractId) {
  return fetchAPI(`/api/finance/audit-logs/contract/${contractId}`);
}

// ══════════════════════════════════════════════════════════════
// HARD RULES VALIDATION
// ══════════════════════════════════════════════════════════════

export async function checkCanDeleteDeal(dealId) {
  return fetchAPI(`/api/finance/rules/can-delete-deal/${dealId}`);
}

export async function checkCanEditPayout(payoutId) {
  return fetchAPI(`/api/finance/rules/can-edit-payout/${payoutId}`);
}
