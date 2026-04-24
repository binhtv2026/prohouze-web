/**
 * AI Insight API
 * Prompt 18/20 - AI Decision Engine
 * 
 * Frontend API for AI-powered insights, scoring, and recommendations.
 */

const API_URL = process.env.REACT_APP_BACKEND_URL;

/**
 * Get auth headers
 */
const getHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

// ==================== LEAD SCORING ====================

/**
 * Get AI score for a lead
 * @param {string} leadId - Lead ID
 * @returns {Promise<Object>} Lead score with explanation
 */
export const getLeadScore = async (leadId) => {
  const response = await fetch(`${API_URL}/api/ai-insight/lead/${leadId}/score`, {
    headers: getHeaders()
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to get lead score');
  }
  return response.json();
};

/**
 * Get complete AI insight for a lead
 * @param {string} leadId - Lead ID
 * @returns {Promise<Object>} Complete insight with score, NBA, signals
 */
export const getLeadInsight = async (leadId) => {
  const response = await fetch(`${API_URL}/api/ai-insight/lead/${leadId}/insight`, {
    headers: getHeaders()
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to get lead insight');
  }
  return response.json();
};

/**
 * Get lead score history
 * @param {string} leadId - Lead ID
 * @param {number} limit - Max records
 * @returns {Promise<Object>} Score history
 */
export const getLeadScoreHistory = async (leadId, limit = 10) => {
  const response = await fetch(
    `${API_URL}/api/ai-insight/lead/${leadId}/score-history?limit=${limit}`,
    { headers: getHeaders() }
  );
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to get score history');
  }
  return response.json();
};

/**
 * Batch score multiple leads
 * @param {string[]} leadIds - Array of lead IDs
 * @returns {Promise<Object>} Batch scoring results
 */
export const batchScoreLeads = async (leadIds) => {
  const response = await fetch(`${API_URL}/api/ai-insight/leads/batch-score`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ lead_ids: leadIds })
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to batch score leads');
  }
  return response.json();
};

// ==================== DEAL RISK ====================

/**
 * Get AI risk assessment for a deal
 * @param {string} dealId - Deal ID
 * @returns {Promise<Object>} Risk assessment with signals
 */
export const getDealRisk = async (dealId) => {
  const response = await fetch(`${API_URL}/api/ai-insight/deal/${dealId}/risk`, {
    headers: getHeaders()
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to get deal risk');
  }
  return response.json();
};

/**
 * Get complete AI insight for a deal
 * @param {string} dealId - Deal ID
 * @returns {Promise<Object>} Complete insight with risk, NBA, signals
 */
export const getDealInsight = async (dealId) => {
  const response = await fetch(`${API_URL}/api/ai-insight/deal/${dealId}/insight`, {
    headers: getHeaders()
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to get deal insight');
  }
  return response.json();
};

/**
 * Get deals with high risk
 * @param {number} limit - Max records
 * @returns {Promise<Object>} High risk deals
 */
export const getHighRiskDeals = async (limit = 20) => {
  const response = await fetch(
    `${API_URL}/api/ai-insight/deals/high-risk?limit=${limit}`,
    { headers: getHeaders() }
  );
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to get high risk deals');
  }
  return response.json();
};

/**
 * Batch assess risk for multiple deals
 * @param {string[]} dealIds - Array of deal IDs
 * @returns {Promise<Object>} Batch assessment results
 */
export const batchAssessDeals = async (dealIds) => {
  const response = await fetch(`${API_URL}/api/ai-insight/deals/batch-assess`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ deal_ids: dealIds })
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to batch assess deals');
  }
  return response.json();
};

// ==================== NEXT BEST ACTION ====================

/**
 * Get next best action for an entity
 * @param {string} entityType - 'lead' or 'deal'
 * @param {string} entityId - Entity ID
 * @returns {Promise<Object>} NBA with primary and alternative actions
 */
export const getNextBestAction = async (entityType, entityId) => {
  const response = await fetch(
    `${API_URL}/api/ai-insight/nba/${entityType}/${entityId}`,
    { headers: getHeaders() }
  );
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to get next best action');
  }
  return response.json();
};

/**
 * Get prioritized actions for today
 * @param {number} limit - Max actions
 * @returns {Promise<Object>} Today's actions
 */
export const getTodayActions = async (limit = 10) => {
  const response = await fetch(
    `${API_URL}/api/ai-insight/today-actions?limit=${limit}`,
    { headers: getHeaders() }
  );
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to get today actions');
  }
  return response.json();
};

// ==================== CONTROL CENTER INTEGRATION ====================

/**
 * Generate AI-driven alerts for Control Center
 * @returns {Promise<Object>} Generation result
 */
export const generateAIAlerts = async () => {
  const response = await fetch(`${API_URL}/api/ai-insight/generate-alerts`, {
    method: 'POST',
    headers: getHeaders()
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to generate AI alerts');
  }
  return response.json();
};

/**
 * Push AI actions to Today Focus panel
 * @returns {Promise<Object>} Push result
 */
export const pushTodayActions = async () => {
  const response = await fetch(`${API_URL}/api/ai-insight/push-today-actions`, {
    method: 'POST',
    headers: getHeaders()
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to push today actions');
  }
  return response.json();
};

// ==================== AI GOVERNANCE ====================

/**
 * Get current lead scoring rules
 * @returns {Promise<Object>} Scoring rules
 */
export const getScoringRules = async () => {
  const response = await fetch(`${API_URL}/api/ai-insight/rules/scoring`, {
    headers: getHeaders()
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to get scoring rules');
  }
  return response.json();
};

/**
 * Get current deal risk rules
 * @returns {Promise<Object>} Risk rules
 */
export const getRiskRules = async () => {
  const response = await fetch(`${API_URL}/api/ai-insight/rules/risk`, {
    headers: getHeaders()
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to get risk rules');
  }
  return response.json();
};

/**
 * Update lead scoring rules
 * @param {Object} rules - New scoring rules
 * @returns {Promise<Object>} Update result
 */
export const updateScoringRules = async (rules) => {
  const response = await fetch(`${API_URL}/api/ai-insight/rules/scoring`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify({ rules })
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to update scoring rules');
  }
  return response.json();
};

/**
 * Update deal risk rules
 * @param {Object} rules - New risk rules
 * @returns {Promise<Object>} Update result
 */
export const updateRiskRules = async (rules) => {
  const response = await fetch(`${API_URL}/api/ai-insight/rules/risk`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify({ rules })
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to update risk rules');
  }
  return response.json();
};

// ==================== FULL INSIGHT WITH MONEY (PHASE 1) ====================

/**
 * Get FULL AI insight for lead with money impact
 * @param {string} leadId - Lead ID
 * @returns {Promise<Object>} Full insight with money impact and executable actions
 */
export const getLeadInsightFull = async (leadId) => {
  const response = await fetch(`${API_URL}/api/ai-insight/lead/${leadId}/full`, {
    headers: getHeaders()
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to get lead insight');
  }
  return response.json();
};

/**
 * Get FULL AI insight for deal with money impact
 * @param {string} dealId - Deal ID
 * @returns {Promise<Object>} Full insight with money impact and executable actions
 */
export const getDealInsightFull = async (dealId) => {
  const response = await fetch(`${API_URL}/api/ai-insight/deal/${dealId}/full`, {
    headers: getHeaders()
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to get deal insight');
  }
  return response.json();
};

// ==================== ACTION EXECUTION (PHASE 1) ====================

/**
 * Execute an AI-recommended action for real
 * Click phải chạy thật!
 * @param {Object} actionData - Action to execute
 * @returns {Promise<Object>} Execution result
 */
export const executeAction = async (actionData) => {
  const response = await fetch(`${API_URL}/api/ai-insight/execute`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(actionData)
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to execute action');
  }
  return response.json();
};

/**
 * Execute multiple actions in batch
 * @param {Array} actions - List of actions to execute
 * @returns {Promise<Object>} Batch execution result
 */
export const batchExecuteActions = async (actions) => {
  const response = await fetch(`${API_URL}/api/ai-insight/execute/batch`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ actions })
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to batch execute actions');
  }
  return response.json();
};

// ==================== WAR ROOM (PHASE 2) ====================

/**
 * Get WAR ROOM dashboard data
 * @returns {Promise<Object>} War room data with revenue at risk, deals, actions
 */
export const getWarRoomData = async () => {
  const response = await fetch(`${API_URL}/api/ai-insight/war-room`, {
    headers: getHeaders()
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to get war room data');
  }
  return response.json();
};

/**
 * Get today's actions with money impact
 * @param {number} limit - Max actions
 * @returns {Promise<Object>} Today's actions with money context
 */
export const getTodayActionsWithMoney = async (limit = 10) => {
  const response = await fetch(
    `${API_URL}/api/ai-insight/today-actions-money?limit=${limit}`,
    { headers: getHeaders() }
  );
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to get today actions');
  }
  return response.json();
};

// ==================== ANALYTICS ====================

/**
 * Get AI usage statistics
 * @returns {Promise<Object>} AI stats
 */
export const getAIStats = async () => {
  const response = await fetch(`${API_URL}/api/ai-insight/stats`, {
    headers: getHeaders()
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to get AI stats');
  }
  return response.json();
};

/**
 * Get AI audit log
 * @param {number} limit - Max records
 * @returns {Promise<Object>} Audit log
 */
export const getAIAuditLog = async (limit = 50) => {
  const response = await fetch(
    `${API_URL}/api/ai-insight/audit-log?limit=${limit}`,
    { headers: getHeaders() }
  );
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to get audit log');
  }
  return response.json();
};

// ==================== EXPORT ====================

const aiInsightApi = {
  // Lead Scoring
  getLeadScore,
  getLeadInsight,
  getLeadScoreHistory,
  batchScoreLeads,
  
  // Deal Risk
  getDealRisk,
  getDealInsight,
  getHighRiskDeals,
  batchAssessDeals,
  
  // Next Best Action
  getNextBestAction,
  getTodayActions,
  
  // FULL Insight with Money (PHASE 1)
  getLeadInsightFull,
  getDealInsightFull,
  
  // Action Execution (PHASE 1)
  executeAction,
  batchExecuteActions,
  
  // WAR ROOM (PHASE 2)
  getWarRoomData,
  getTodayActionsWithMoney,
  
  // Control Center Integration
  generateAIAlerts,
  pushTodayActions,
  
  // AI Governance
  getScoringRules,
  getRiskRules,
  updateScoringRules,
  updateRiskRules,
  
  // Analytics
  getAIStats,
  getAIAuditLog
};

export default aiInsightApi;
