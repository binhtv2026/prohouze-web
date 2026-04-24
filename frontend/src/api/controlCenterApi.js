/**
 * Control Center API
 * Prompt 17/20 - Executive Control Center
 */

const API_URL = process.env.REACT_APP_BACKEND_URL;

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : '',
  };
};

const handleResponse = async (response) => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Request failed' }));
    throw new Error(error.detail || 'Request failed');
  }
  return response.json();
};

const controlCenterApi = {
  // ==================== EXECUTIVE OVERVIEW ====================
  
  getExecutiveOverview: async () => {
    const response = await fetch(`${API_URL}/api/control/executive-overview`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },
  
  // ==================== HEALTH SCORE ====================
  
  getHealthScore: async () => {
    const response = await fetch(`${API_URL}/api/control/health-score`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },
  
  saveHealthScoreSnapshot: async () => {
    const response = await fetch(`${API_URL}/api/control/health-score/snapshot`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },
  
  // ==================== ALERTS ====================
  
  getAlerts: async (params = {}) => {
    const query = new URLSearchParams();
    if (params.category) query.append('category', params.category);
    if (params.severity) query.append('severity', params.severity);
    if (params.includeAcknowledged) query.append('include_acknowledged', 'true');
    
    const response = await fetch(`${API_URL}/api/control/alerts?${query}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },
  
  getAlertsSummary: async () => {
    const response = await fetch(`${API_URL}/api/control/alerts/summary`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },
  
  acknowledgeAlert: async (alertId) => {
    const response = await fetch(`${API_URL}/api/control/alerts/acknowledge`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ alert_id: alertId }),
    });
    return handleResponse(response);
  },
  
  resolveAlert: async (alertId, note = null) => {
    const response = await fetch(`${API_URL}/api/control/alerts/resolve`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ alert_id: alertId, resolution_note: note }),
    });
    return handleResponse(response);
  },
  
  // ==================== BOTTLENECKS ====================
  
  getBottlenecks: async () => {
    const response = await fetch(`${API_URL}/api/control/bottlenecks`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },
  
  getBottleneckDetails: async (type) => {
    const response = await fetch(`${API_URL}/api/control/bottlenecks/${type}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },
  
  // ==================== SUGGESTIONS ====================
  
  getSuggestions: async () => {
    const response = await fetch(`${API_URL}/api/control/suggestions`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },
  
  getSuggestionsSummary: async () => {
    const response = await fetch(`${API_URL}/api/control/suggestions/summary`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },
  
  // ==================== ACTIONS ====================
  
  executeAction: async (actionType, data) => {
    const response = await fetch(`${API_URL}/api/control/actions/${actionType}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },
  
  verifyAction: async (actionId, isResolved) => {
    const response = await fetch(`${API_URL}/api/control/actions/verify`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ action_id: actionId, is_resolved: isResolved }),
    });
    return handleResponse(response);
  },
  
  getActionEffectiveness: async () => {
    const response = await fetch(`${API_URL}/api/control/actions/effectiveness`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },
  
  // ==================== PRIORITY & FOCUS ====================
  
  getTodayFocus: async () => {
    const response = await fetch(`${API_URL}/api/control/focus`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },
  
  getUserFocus: async () => {
    const response = await fetch(`${API_URL}/api/control/focus/user`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },
  
  getPriorityMatrix: async () => {
    const response = await fetch(`${API_URL}/api/control/priority-matrix`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },
  
  // ==================== CONTROL FEED ====================
  
  getControlFeed: async (limit = 50) => {
    const response = await fetch(`${API_URL}/api/control/feed?limit=${limit}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },
  
  // ==================== OPERATIONS ====================
  
  getOperationsOverview: async () => {
    const response = await fetch(`${API_URL}/api/control/operations/overview`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },
  
  getPipelineOverview: async () => {
    const response = await fetch(`${API_URL}/api/control/operations/pipeline`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },
  
  getTeamHeatmap: async () => {
    const response = await fetch(`${API_URL}/api/control/operations/team-heatmap`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  // ==================== AUTO ACTION RULES ====================
  
  getAutoRules: async (activeOnly = false) => {
    const response = await fetch(`${API_URL}/api/control/auto/rules?active_only=${activeOnly}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  getAutoRule: async (ruleId) => {
    const response = await fetch(`${API_URL}/api/control/auto/rules/${ruleId}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  createAutoRule: async (ruleData) => {
    const response = await fetch(`${API_URL}/api/control/auto/rules`, {
      method: 'POST',
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify(ruleData),
    });
    return handleResponse(response);
  },

  updateAutoRule: async (ruleId, ruleData) => {
    const response = await fetch(`${API_URL}/api/control/auto/rules/${ruleId}`, {
      method: 'PUT',
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify(ruleData),
    });
    return handleResponse(response);
  },

  toggleAutoRule: async (ruleId, isActive) => {
    const response = await fetch(`${API_URL}/api/control/auto/rules/${ruleId}/toggle`, {
      method: 'POST',
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: isActive }),
    });
    return handleResponse(response);
  },

  deleteAutoRule: async (ruleId) => {
    const response = await fetch(`${API_URL}/api/control/auto/rules/${ruleId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  runAutoActions: async () => {
    const response = await fetch(`${API_URL}/api/control/auto/run`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  undoAutoAction: async (actionId) => {
    const response = await fetch(`${API_URL}/api/control/auto/undo`, {
      method: 'POST',
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ action_id: actionId }),
    });
    return handleResponse(response);
  },

  getAutoStats: async () => {
    const response = await fetch(`${API_URL}/api/control/auto/stats`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  getRecentAutoActions: async (limit = 20) => {
    const response = await fetch(`${API_URL}/api/control/auto/actions?limit=${limit}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  initDefaultRules: async () => {
    const response = await fetch(`${API_URL}/api/control/auto/init-defaults`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },
};

export default controlCenterApi;
