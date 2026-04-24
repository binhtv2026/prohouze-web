/**
 * KPI & Performance Engine API Client
 * Prompt 12/20 - Phase 2: Real Estate KPI
 */

const API_URL = process.env.REACT_APP_BACKEND_URL;

// ============================================
// CONFIG ENDPOINTS
// ============================================
export const kpiApi = {
  // Config
  getCategories: async () => {
    const res = await fetch(`${API_URL}/api/kpi/config/categories`);
    if (!res.ok) throw new Error('Failed to fetch categories');
    return res.json();
  },

  getScopes: async () => {
    const res = await fetch(`${API_URL}/api/kpi/config/scopes`);
    if (!res.ok) throw new Error('Failed to fetch scopes');
    return res.json();
  },

  getPeriods: async () => {
    const res = await fetch(`${API_URL}/api/kpi/config/periods`);
    if (!res.ok) throw new Error('Failed to fetch periods');
    return res.json();
  },

  getStatuses: async () => {
    const res = await fetch(`${API_URL}/api/kpi/config/statuses`);
    if (!res.ok) throw new Error('Failed to fetch statuses');
    return res.json();
  },

  getLeaderboardTypes: async () => {
    const res = await fetch(`${API_URL}/api/kpi/config/leaderboard-types`);
    if (!res.ok) throw new Error('Failed to fetch leaderboard types');
    return res.json();
  },

  // KPI Definitions
  getDefinitions: async (category = null, isActive = true) => {
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    params.append('is_active', isActive);
    
    const res = await fetch(`${API_URL}/api/kpi/definitions?${params}`);
    if (!res.ok) throw new Error('Failed to fetch definitions');
    return res.json();
  },

  getDefinition: async (kpiCode) => {
    const res = await fetch(`${API_URL}/api/kpi/definitions/${kpiCode}`);
    if (!res.ok) throw new Error('Failed to fetch definition');
    return res.json();
  },

  seedSystemKpis: async () => {
    const res = await fetch(`${API_URL}/api/kpi/definitions/seed`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to seed KPIs');
    return res.json();
  },

  // KPI Definitions Config
  getKPIDefinitions: async () => {
    const res = await fetch(`${API_URL}/api/kpi/config/kpi-definitions`);
    if (!res.ok) throw new Error('Failed to fetch KPI definitions');
    return res.json();
  },

  updateKPIDefinition: async (kpiCode, updates) => {
    const res = await fetch(`${API_URL}/api/kpi/config/kpi-definitions/${kpiCode}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error('Failed to update KPI definition');
    return res.json();
  },

  // Bonus Tiers Config
  getBonusTiers: async () => {
    const res = await fetch(`${API_URL}/api/kpi/config/bonus-tiers`);
    if (!res.ok) throw new Error('Failed to fetch bonus tiers');
    return res.json();
  },

  updateBonusTiers: async (tiers) => {
    const res = await fetch(`${API_URL}/api/kpi/config/bonus-tiers`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tiers),
    });
    if (!res.ok) throw new Error('Failed to update bonus tiers');
    return res.json();
  },

  // KPI Targets
  createTarget: async (data) => {
    const res = await fetch(`${API_URL}/api/kpi/targets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create target');
    return res.json();
  },

  getTargets: async (filters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        params.append(key, value);
      }
    });
    
    const res = await fetch(`${API_URL}/api/kpi/targets?${params}`);
    if (!res.ok) throw new Error('Failed to fetch targets');
    return res.json();
  },

  getTarget: async (targetId) => {
    const res = await fetch(`${API_URL}/api/kpi/targets/${targetId}`);
    if (!res.ok) throw new Error('Failed to fetch target');
    return res.json();
  },

  // ============================================
  // PHASE 2: REAL ESTATE KPI ENDPOINTS
  // ============================================

  // My Performance (for sales rep daily use)
  getMyScorecard: async (userId = null, periodType = 'monthly', periodYear = null, periodMonth = null) => {
    const params = new URLSearchParams();
    if (userId) params.append('user_id', userId);
    params.append('period_type', periodType);
    if (periodYear) params.append('period_year', periodYear);
    if (periodMonth) params.append('period_month', periodMonth);
    
    const res = await fetch(`${API_URL}/api/kpi/my-performance?${params}`);
    if (!res.ok) throw new Error('Failed to fetch performance');
    return res.json();
  },

  // Team Performance (for leaders)
  getTeamScorecard: async (periodType = 'monthly', periodYear = null, periodMonth = null, teamId = null) => {
    const params = new URLSearchParams();
    params.append('period_type', periodType);
    if (periodYear) params.append('period_year', periodYear);
    if (periodMonth) params.append('period_month', periodMonth);
    if (teamId) params.append('team_id', teamId);
    
    const res = await fetch(`${API_URL}/api/kpi/team-performance?${params}`);
    if (!res.ok) throw new Error('Failed to fetch team performance');
    return res.json();
  },

  // Alerts
  getMyAlerts: async (userId = null, limit = 10) => {
    const params = new URLSearchParams();
    if (userId) params.append('user_id', userId);
    params.append('limit', limit);
    
    const res = await fetch(`${API_URL}/api/kpi/my-alerts?${params}`);
    if (!res.ok) throw new Error('Failed to fetch alerts');
    return res.json();
  },

  getTeamAlerts: async (teamId = null, limit = 10) => {
    const params = new URLSearchParams();
    if (teamId) params.append('team_id', teamId);
    params.append('limit', limit);
    
    const res = await fetch(`${API_URL}/api/kpi/team-alerts?${params}`);
    if (!res.ok) throw new Error('Failed to fetch team alerts');
    return res.json();
  },

  // Legacy scorecard endpoints (for backward compatibility)
  getUserScorecard: async (userId, periodType = 'monthly', periodYear = null, periodMonth = null) => {
    const params = new URLSearchParams();
    params.append('period_type', periodType);
    if (periodYear) params.append('period_year', periodYear);
    if (periodMonth) params.append('period_month', periodMonth);
    
    const res = await fetch(`${API_URL}/api/kpi/scorecard/${userId}?${params}`);
    if (!res.ok) throw new Error('Failed to fetch user scorecard');
    return res.json();
  },

  // Leaderboards
  getAvailableLeaderboards: async () => {
    const res = await fetch(`${API_URL}/api/kpi/leaderboards`);
    if (!res.ok) throw new Error('Failed to fetch leaderboards');
    return res.json();
  },

  getLeaderboard: async (type, scopeType = 'company', scopeId = null, currentUserId = null) => {
    const params = new URLSearchParams();
    params.append('scope_type', scopeType);
    if (scopeId) params.append('scope_id', scopeId);
    if (currentUserId) params.append('current_user_id', currentUserId);
    
    const res = await fetch(`${API_URL}/api/kpi/leaderboards/${type}?${params}`);
    if (!res.ok) throw new Error('Failed to fetch leaderboard');
    return res.json();
  },

  // Bonus
  getBonusRules: async (isActive = true) => {
    const params = new URLSearchParams();
    params.append('is_active', isActive);
    
    const res = await fetch(`${API_URL}/api/kpi/bonus-rules?${params}`);
    if (!res.ok) throw new Error('Failed to fetch bonus rules');
    return res.json();
  },

  createBonusRule: async (data) => {
    const res = await fetch(`${API_URL}/api/kpi/bonus-rules`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create bonus rule');
    return res.json();
  },

  getMyBonusModifier: async (userId = null, periodType = 'monthly', periodYear = null, periodMonth = null) => {
    const params = new URLSearchParams();
    if (userId) params.append('user_id', userId);
    params.append('period_type', periodType);
    if (periodYear) params.append('period_year', periodYear);
    if (periodMonth) params.append('period_month', periodMonth);
    
    const res = await fetch(`${API_URL}/api/kpi/my-bonus-modifier?${params}`);
    if (!res.ok) throw new Error('Failed to fetch bonus modifier');
    return res.json();
  },

  getUserBonusModifier: async (userId, periodType = 'monthly', periodYear = null, periodMonth = null) => {
    const params = new URLSearchParams();
    params.append('period_type', periodType);
    if (periodYear) params.append('period_year', periodYear);
    if (periodMonth) params.append('period_month', periodMonth);
    
    const res = await fetch(`${API_URL}/api/kpi/bonus-modifier/${userId}?${params}`);
    if (!res.ok) throw new Error('Failed to fetch user bonus modifier');
    return res.json();
  },

  applyBonus: async (userId, periodType = 'monthly', periodYear = null, periodMonth = null) => {
    const params = new URLSearchParams();
    params.append('user_id', userId);
    params.append('period_type', periodType);
    if (periodYear) params.append('period_year', periodYear);
    if (periodMonth) params.append('period_month', periodMonth);
    
    const res = await fetch(`${API_URL}/api/kpi/apply-bonus?${params}`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to apply bonus');
    return res.json();
  },

  // Trends
  getKpiTrend: async (kpiCode, scopeType = 'individual', scopeId = null, periods = 6, periodType = 'monthly') => {
    const params = new URLSearchParams();
    params.append('scope_type', scopeType);
    if (scopeId) params.append('scope_id', scopeId);
    params.append('periods', periods);
    params.append('period_type', periodType);
    
    const res = await fetch(`${API_URL}/api/kpi/trends/${kpiCode}?${params}`);
    if (!res.ok) throw new Error('Failed to fetch trend');
    return res.json();
  },

  // Stats
  getOverview: async (periodType = 'monthly', periodYear = null, periodMonth = null) => {
    const params = new URLSearchParams();
    params.append('period_type', periodType);
    if (periodYear) params.append('period_year', periodYear);
    if (periodMonth) params.append('period_month', periodMonth);
    
    const res = await fetch(`${API_URL}/api/kpi/stats/overview?${params}`);
    if (!res.ok) throw new Error('Failed to fetch overview');
    return res.json();
  },

  // ============================================
  // PHASE 2 ENHANCEMENTS - 10/10 ENDPOINTS
  // ============================================

  // 1. Validate KPI Weights (total = 100%)
  validateWeights: async () => {
    const res = await fetch(`${API_URL}/api/kpi/weights/validate`);
    if (!res.ok) throw new Error('Failed to validate weights');
    return res.json();
  },

  updateWeightsBatch: async (weights) => {
    const res = await fetch(`${API_URL}/api/kpi/weights/batch`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(weights),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.detail || 'Failed to update weights');
    }
    return res.json();
  },

  // 2. AUTO Data from CRM
  refreshActuals: async (userId = null, periodType = 'monthly', periodYear = null, periodMonth = null) => {
    const params = new URLSearchParams();
    if (userId) params.append('user_id', userId);
    params.append('period_type', periodType);
    if (periodYear) params.append('period_year', periodYear);
    if (periodMonth) params.append('period_month', periodMonth);
    
    const res = await fetch(`${API_URL}/api/kpi/actuals/refresh?${params}`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to refresh actuals');
    return res.json();
  },

  getDataSources: async () => {
    const res = await fetch(`${API_URL}/api/kpi/data-sources`);
    if (!res.ok) throw new Error('Failed to fetch data sources');
    return res.json();
  },

  // 3. Commission from KPI
  calculateCommission: async (userId, kpiAchievement, baseCommission) => {
    const params = new URLSearchParams();
    params.append('user_id', userId);
    params.append('kpi_achievement', kpiAchievement);
    params.append('base_commission', baseCommission);
    
    const res = await fetch(`${API_URL}/api/kpi/commission/calculate?${params}`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to calculate commission');
    return res.json();
  },

  getCommissionRules: async () => {
    const res = await fetch(`${API_URL}/api/kpi/commission/rules`);
    if (!res.ok) throw new Error('Failed to fetch commission rules');
    return res.json();
  },

  // 4. KPI Lock
  lockPeriod: async (periodType = 'monthly', periodYear = null, periodMonth = null, lockedBy = 'system') => {
    const params = new URLSearchParams();
    params.append('period_type', periodType);
    if (periodYear) params.append('period_year', periodYear);
    if (periodMonth) params.append('period_month', periodMonth);
    params.append('locked_by', lockedBy);
    
    const res = await fetch(`${API_URL}/api/kpi/period/lock?${params}`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to lock period');
    return res.json();
  },

  getPeriodStatus: async (periodType = 'monthly', periodYear = null, periodMonth = null) => {
    const params = new URLSearchParams();
    params.append('period_type', periodType);
    if (periodYear) params.append('period_year', periodYear);
    if (periodMonth) params.append('period_month', periodMonth);
    
    const res = await fetch(`${API_URL}/api/kpi/period/status?${params}`);
    if (!res.ok) throw new Error('Failed to get period status');
    return res.json();
  },

  // 5. Level System
  getUserLevel: async (userId = null, periodType = 'monthly', periodYear = null, periodMonth = null) => {
    const params = new URLSearchParams();
    params.append('period_type', periodType);
    if (periodYear) params.append('period_year', periodYear);
    if (periodMonth) params.append('period_month', periodMonth);
    
    const url = userId 
      ? `${API_URL}/api/kpi/level/${userId}?${params}`
      : `${API_URL}/api/kpi/level/current?${params}`;
    
    const res = await fetch(url);
    if (!res.ok) return null; // Return null if not found
    return res.json();
  },

  getLevelsConfig: async () => {
    const res = await fetch(`${API_URL}/api/kpi/levels/config`);
    if (!res.ok) throw new Error('Failed to fetch levels config');
    return res.json();
  },

  // 6. Real-time Events
  processEvent: async (eventType, userId, data = {}) => {
    const params = new URLSearchParams();
    params.append('event_type', eventType);
    params.append('user_id', userId);
    
    const res = await fetch(`${API_URL}/api/kpi/event?${params}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to process event');
    return res.json();
  },

  // 7. Alerts
  checkAlerts: async (userId = null, periodType = 'monthly', periodYear = null, periodMonth = null) => {
    const params = new URLSearchParams();
    if (userId) params.append('user_id', userId);
    params.append('period_type', periodType);
    if (periodYear) params.append('period_year', periodYear);
    if (periodMonth) params.append('period_month', periodMonth);
    
    const res = await fetch(`${API_URL}/api/kpi/alerts/check?${params}`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to check alerts');
    return res.json();
  },

  checkInactivityAlert: async (userId, days = 3) => {
    const params = new URLSearchParams();
    params.append('user_id', userId);
    params.append('days', days);
    
    const res = await fetch(`${API_URL}/api/kpi/alerts/inactivity?${params}`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to check inactivity');
    return res.json();
  },

  // 8. Enhanced Leaderboard (shows who works / who's lazy)
  getEnhancedLeaderboard: async (periodType = 'monthly', periodYear = null, periodMonth = null, scopeType = 'company', scopeId = null, limit = 20) => {
    const params = new URLSearchParams();
    params.append('period_type', periodType);
    if (periodYear) params.append('period_year', periodYear);
    if (periodMonth) params.append('period_month', periodMonth);
    params.append('scope_type', scopeType);
    if (scopeId) params.append('scope_id', scopeId);
    params.append('limit', limit);
    
    const res = await fetch(`${API_URL}/api/kpi/leaderboard/enhanced?${params}`);
    if (!res.ok) throw new Error('Failed to fetch enhanced leaderboard');
    return res.json();
  },
};

export default kpiApi;
