/**
 * ProHouze Analytics API Client
 * Prompt 16/20 - Advanced Reports & Analytics Engine
 */

import api from '../lib/api';

const analyticsApi = {
  // ==================== CONFIG ====================
  
  /**
   * Get all metric definitions
   */
  getMetricDefinitions: (category = null) => {
    const params = category ? { category } : {};
    return api.get('/analytics/config/metrics', { params }).then(res => res.data);
  },

  /**
   * Get metric categories
   */
  getCategories: () => 
    api.get('/analytics/config/categories').then(res => res.data),

  /**
   * Get available period options
   */
  getPeriods: () => 
    api.get('/analytics/config/periods').then(res => res.data),

  /**
   * Get report definitions for current user
   */
  getReportDefinitions: () => 
    api.get('/analytics/config/reports').then(res => res.data),

  // ==================== METRICS ====================

  /**
   * Get single metric value
   */
  getMetric: (metricCode, params = {}) => {
    const { periodType = 'this_month', compare = false, ...rest } = params;
    return api.get(`/analytics/metrics/${metricCode}`, {
      params: { period_type: periodType, compare, ...rest }
    }).then(res => res.data);
  },

  /**
   * Get multiple metrics in batch
   */
  getMetricsBatch: (metricCodes, params = {}) => {
    const { periodType = 'this_month', compare = false } = params;
    return api.post('/analytics/metrics/batch', metricCodes, {
      params: { period_type: periodType, compare }
    }).then(res => res.data);
  },

  /**
   * Get metric with trend history
   */
  getMetricTrend: (metricCode, periods = 6, periodType = 'this_month') =>
    api.get(`/analytics/metrics/${metricCode}/trend`, {
      params: { periods, period_type: periodType }
    }).then(res => res.data),

  /**
   * Get metric breakdown by dimension
   */
  getMetricBreakdown: (metricCode, dimension, params = {}) => {
    const { periodType = 'this_month', limit = 10 } = params;
    return api.get(`/analytics/metrics/${metricCode}/breakdown/${dimension}`, {
      params: { period_type: periodType, limit }
    }).then(res => res.data);
  },

  /**
   * Get metric time series for charting
   */
  getMetricTimeSeries: (metricCode, params = {}) => {
    const { granularity = 'day', periodType = 'this_month' } = params;
    return api.get(`/analytics/metrics/${metricCode}/timeseries`, {
      params: { granularity, period_type: periodType }
    }).then(res => res.data);
  },

  // ==================== DASHBOARDS ====================

  /**
   * Get executive dashboard data
   */
  getExecutiveDashboard: (periodType = 'this_month') =>
    api.get('/analytics/dashboards/executive', {
      params: { period_type: periodType }
    }).then(res => res.data),

  /**
   * Get key metrics for dashboard cards
   */
  getKeyMetrics: (params = {}) => {
    const { periodType = 'this_month', compare = true } = params;
    return api.get('/analytics/dashboards/key-metrics', {
      params: { period_type: periodType, compare }
    }).then(res => res.data);
  },

  // ==================== REPORTS ====================

  /**
   * Get conversion report
   */
  getConversionReport: (periodType = 'this_month') =>
    api.get('/analytics/reports/conversion', {
      params: { period_type: periodType }
    }).then(res => res.data),

  /**
   * Get pipeline report
   */
  getPipelineReport: (periodType = 'this_month') =>
    api.get('/analytics/reports/pipeline', {
      params: { period_type: periodType }
    }).then(res => res.data),

  // ==================== CALCULATED METRICS ====================

  /**
   * Get conversion rate
   */
  getConversionRate: (periodType = 'this_month') =>
    api.get('/analytics/calculated/conversion-rate', {
      params: { period_type: periodType }
    }).then(res => res.data),

  /**
   * Get win rate
   */
  getWinRate: (periodType = 'this_month') =>
    api.get('/analytics/calculated/win-rate', {
      params: { period_type: periodType }
    }).then(res => res.data),

  // ==================== DRILL-DOWN ====================

  /**
   * Get drill-down data for a metric (raw records)
   */
  getDrilldown: (metricCode, params = {}) => {
    const { periodType = 'this_month', page = 1, pageSize = 50 } = params;
    return api.get('/analytics/drilldown', {
      params: { metric_code: metricCode, period_type: periodType, page, page_size: pageSize }
    }).then(res => res.data);
  },

  // ==================== FUNNEL ====================

  /**
   * Get full funnel analytics
   * @param funnelType - "lead" or "deal"
   */
  getFunnel: (funnelType = 'lead', periodType = 'this_month') =>
    api.get('/analytics/funnel', {
      params: { funnel_type: funnelType, period_type: periodType }
    }).then(res => res.data),

  /**
   * Get funnel stage definitions
   */
  getFunnelStages: (funnelType = 'lead') =>
    api.get('/analytics/funnel/stages', {
      params: { funnel_type: funnelType }
    }).then(res => res.data),

  // ==================== BOTTLENECKS ====================

  /**
   * Get operational bottlenecks
   */
  getBottlenecks: (periodType = 'this_month') =>
    api.get('/analytics/bottlenecks', {
      params: { period_type: periodType }
    }).then(res => res.data),

  // ==================== SAVED VIEWS ====================

  /**
   * Save a report view
   */
  saveView: (viewData) =>
    api.post('/analytics/views', viewData).then(res => res.data),

  /**
   * Get saved views
   */
  getViews: (reportType = null) =>
    api.get('/analytics/views', {
      params: reportType ? { report_type: reportType } : {}
    }).then(res => res.data),

  /**
   * Get default view for a report type
   */
  getDefaultView: (reportType) =>
    api.get('/analytics/views/default', {
      params: { report_type: reportType }
    }).then(res => res.data),

  /**
   * Delete a saved view
   */
  deleteView: (viewId) =>
    api.delete(`/analytics/views/${viewId}`).then(res => res.data),

  // ==================== EXPORT ====================

  /**
   * Export metric data as CSV
   */
  exportMetric: (metricCode, params = {}) => {
    const { periodType = 'this_month', format = 'csv' } = params;
    return api.get(`/analytics/export/${metricCode}`, {
      params: { period_type: periodType, format }
    }).then(res => res.data);
  },

  /**
   * Export report data
   */
  exportReport: (reportType, params = {}) => {
    const { periodType = 'this_month', format = 'csv' } = params;
    return api.get(`/analytics/export/report/${reportType}`, {
      params: { period_type: periodType, format }
    }).then(res => res.data);
  },

  // ==================== GOVERNANCE ====================

  /**
   * Get metrics governance info
   */
  getGovernance: () =>
    api.get('/analytics/governance/metrics').then(res => res.data),

  /**
   * Validate a metric code
   */
  validateMetric: (metricCode) =>
    api.get(`/analytics/governance/validate/${metricCode}`).then(res => res.data),
};

export default analyticsApi;

// Named exports for convenience
export const {
  getMetricDefinitions,
  getCategories,
  getPeriods,
  getReportDefinitions,
  getMetric,
  getMetricsBatch,
  getMetricTrend,
  getMetricBreakdown,
  getMetricTimeSeries,
  getExecutiveDashboard,
  getKeyMetrics,
  getConversionReport,
  getPipelineReport,
  getConversionRate,
  getWinRate,
  getDrilldown,
  getFunnel,
  getFunnelStages,
  getBottlenecks,
  saveView,
  getViews,
  getDefaultView,
  deleteView,
  exportMetric,
  exportReport,
  getGovernance,
  validateMetric,
} = analyticsApi;
