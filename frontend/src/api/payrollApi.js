/**
 * ProHouze Payroll API
 * API client for Payroll & Workforce Management
 */

const API_URL = process.env.REACT_APP_BACKEND_URL;

// Helper function to get auth headers
const getHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
};

// Helper function to handle responses
const handleResponse = async (response) => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Request failed' }));
    throw new Error(error.detail || 'Request failed');
  }
  return response.json();
};

export const payrollApi = {
  // ═══════════════════════════════════════════════════════════════════════════
  // DASHBOARD
  // ═══════════════════════════════════════════════════════════════════════════
  
  getDashboard: async () => {
    const response = await fetch(`${API_URL}/api/payroll/dashboard`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // WORK SHIFTS
  // ═══════════════════════════════════════════════════════════════════════════
  
  getShifts: async (activeOnly = true) => {
    const response = await fetch(`${API_URL}/api/payroll/shifts?active_only=${activeOnly}`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  createShift: async (data) => {
    const response = await fetch(`${API_URL}/api/payroll/shifts`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  initDefaultShifts: async () => {
    const response = await fetch(`${API_URL}/api/payroll/shifts/init-defaults`, {
      method: 'POST',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // ATTENDANCE
  // ═══════════════════════════════════════════════════════════════════════════
  
  checkIn: async (data = {}) => {
    const response = await fetch(`${API_URL}/api/payroll/attendance/check-in`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  checkOut: async (data = {}) => {
    const response = await fetch(`${API_URL}/api/payroll/attendance/check-out`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  getTodayAttendance: async () => {
    const response = await fetch(`${API_URL}/api/payroll/attendance/today`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  getAttendanceRecords: async (params = {}) => {
    const searchParams = new URLSearchParams();
    if (params.hr_profile_id) searchParams.append('hr_profile_id', params.hr_profile_id);
    if (params.start_date) searchParams.append('start_date', params.start_date);
    if (params.end_date) searchParams.append('end_date', params.end_date);
    if (params.status) searchParams.append('status', params.status);
    if (params.limit) searchParams.append('limit', params.limit);

    const response = await fetch(`${API_URL}/api/payroll/attendance/records?${searchParams}`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  /**
   * Get monthly attendance summaries for all employees
   */
  getAttendanceSummaries: async (period) => {
    const response = await fetch(`${API_URL}/api/payroll/attendance/summaries?period=${period}`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  /**
   * Refresh/recalculate attendance summaries for period
   */
  refreshAttendanceSummaries: async (period) => {
    const response = await fetch(`${API_URL}/api/payroll/attendance/summaries/refresh`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ period }),
    });
    return handleResponse(response);
  },

  getAttendanceSummary: async (hrProfileId, period) => {
    const response = await fetch(
      `${API_URL}/api/payroll/attendance/summary/${hrProfileId}/${period}`,
      { headers: getHeaders() }
    );
    return handleResponse(response);
  },

  adjustAttendance: async (recordId, data) => {
    const response = await fetch(`${API_URL}/api/payroll/attendance/${recordId}/adjust`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // LEAVE MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════════
  
  createLeaveRequest: async (data) => {
    const response = await fetch(`${API_URL}/api/payroll/leave/request`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  getLeaveRequests: async (params = {}) => {
    const searchParams = new URLSearchParams();
    if (params.hr_profile_id) searchParams.append('hr_profile_id', params.hr_profile_id);
    if (params.status) searchParams.append('status', params.status);
    if (params.pending_only) searchParams.append('pending_only', params.pending_only);
    if (params.limit) searchParams.append('limit', params.limit);

    const response = await fetch(`${API_URL}/api/payroll/leave/requests?${searchParams}`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  approveLeaveRequest: async (requestId) => {
    const response = await fetch(`${API_URL}/api/payroll/leave/requests/${requestId}/approve`, {
      method: 'PUT',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  rejectLeaveRequest: async (requestId, reason) => {
    const response = await fetch(
      `${API_URL}/api/payroll/leave/requests/${requestId}/reject?reason=${encodeURIComponent(reason)}`,
      { method: 'PUT', headers: getHeaders() }
    );
    return handleResponse(response);
  },

  getLeaveBalance: async (year) => {
    const params = year ? `?year=${year}` : '';
    const response = await fetch(`${API_URL}/api/payroll/leave/balance${params}`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  initializeLeaveBalance: async (hrProfileId, year) => {
    const response = await fetch(
      `${API_URL}/api/payroll/leave/balance/init?hr_profile_id=${hrProfileId}&year=${year}`,
      { method: 'POST', headers: getHeaders() }
    );
    return handleResponse(response);
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // SALARY STRUCTURE
  // ═══════════════════════════════════════════════════════════════════════════
  
  createSalaryStructure: async (data) => {
    const response = await fetch(`${API_URL}/api/payroll/salary-structure`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  getSalaryStructure: async (hrProfileId) => {
    const response = await fetch(`${API_URL}/api/payroll/salary-structure/${hrProfileId}`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // PAYROLL
  // ═══════════════════════════════════════════════════════════════════════════
  
  calculatePayroll: async (period, hrProfileIds = null) => {
    const response = await fetch(`${API_URL}/api/payroll/calculate`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ period, hr_profile_ids: hrProfileIds }),
    });
    return handleResponse(response);
  },

  approvePayroll: async (payrollIds, notes = null) => {
    const response = await fetch(`${API_URL}/api/payroll/approve`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ payroll_ids: payrollIds, notes }),
    });
    return handleResponse(response);
  },

  markPayrollPaid: async (payrollIds, paymentReference = null) => {
    const response = await fetch(`${API_URL}/api/payroll/pay`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ payroll_ids: payrollIds, payment_reference: paymentReference }),
    });
    return handleResponse(response);
  },

  lockPayroll: async (period) => {
    const response = await fetch(`${API_URL}/api/payroll/lock/${period}`, {
      method: 'POST',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  getMyPayrolls: async (limit = 12) => {
    const response = await fetch(`${API_URL}/api/payroll/my-payrolls?limit=${limit}`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  getPayroll: async (payrollId) => {
    const response = await fetch(`${API_URL}/api/payroll/payroll/${payrollId}`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  getPayrollsForPeriod: async (period, status = null) => {
    const params = status ? `?status=${status}` : '';
    const response = await fetch(`${API_URL}/api/payroll/payrolls/${period}${params}`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  getPayrollSummary: async (period) => {
    const response = await fetch(`${API_URL}/api/payroll/summary/${period}`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // RULES CONFIG
  // ═══════════════════════════════════════════════════════════════════════════
  
  getPayrollRules: async () => {
    const response = await fetch(`${API_URL}/api/payroll/rules`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  updatePayrollRules: async (rules) => {
    const response = await fetch(`${API_URL}/api/payroll/rules`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(rules),
    });
    return handleResponse(response);
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // AUDIT LOGS
  // ═══════════════════════════════════════════════════════════════════════════
  
  getAuditLogs: async (params = {}) => {
    const searchParams = new URLSearchParams();
    if (params.payroll_id) searchParams.append('payroll_id', params.payroll_id);
    if (params.hr_profile_id) searchParams.append('hr_profile_id', params.hr_profile_id);
    if (params.action) searchParams.append('action', params.action);
    if (params.period) searchParams.append('period', params.period);
    if (params.limit) searchParams.append('limit', params.limit);

    const response = await fetch(`${API_URL}/api/payroll/audit-logs?${searchParams}`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  getSalaryViewLogs: async (params = {}) => {
    const searchParams = new URLSearchParams();
    if (params.target_hr_profile_id) searchParams.append('target_hr_profile_id', params.target_hr_profile_id);
    if (params.viewer_id) searchParams.append('viewer_id', params.viewer_id);
    if (params.period) searchParams.append('period', params.period);
    if (params.limit) searchParams.append('limit', params.limit);
    
    const response = await fetch(`${API_URL}/api/payroll/salary-view-logs?${searchParams}`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },
};

export default payrollApi;
