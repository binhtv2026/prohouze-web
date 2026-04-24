import api from '@/lib/api';

export const governanceFoundationApi = {
  getSummary: async () => {
    const response = await api.get('/config/governance/summary');
    return response.data;
  },

  getCanonicalDomains: async () => {
    const response = await api.get('/config/governance/canonical-domains');
    return response.data;
  },

  getEntityMapping: async () => {
    const response = await api.get('/config/governance/entity-mapping');
    return response.data;
  },

  getStatusModels: async () => {
    const response = await api.get('/config/governance/status-models');
    return response.data;
  },

  getStatusRules: async () => {
    const response = await api.get('/config/governance/status-rules');
    return response.data;
  },

  getApprovalFlows: async () => {
    const response = await api.get('/config/governance/approval-flows');
    return response.data;
  },

  getApprovalRules: async () => {
    const response = await api.get('/config/governance/approval-rules');
    return response.data;
  },

  getAuditRules: async () => {
    const response = await api.get('/config/governance/audit-rules');
    return response.data;
  },

  getTimelineStreams: async () => {
    const response = await api.get('/config/governance/timeline-streams');
    return response.data;
  },

  getCriticalMoments: async () => {
    const response = await api.get('/config/governance/critical-moments');
    return response.data;
  },

  getAuditDeliverables: async () => {
    const response = await api.get('/config/governance/audit-deliverables');
    return response.data;
  },

  getMasterDataAlignment: async () => {
    const response = await api.get('/config/governance/master-data-alignment');
    return response.data;
  },

  getEntitySchemaAlignment: async () => {
    const response = await api.get('/config/governance/entity-schema-alignment');
    return response.data;
  },

  getCoverage: async () => {
    const response = await api.get('/config/governance/coverage');
    return response.data;
  },

  getFoundationRules: async () => {
    const response = await api.get('/config/governance/foundation-rules');
    return response.data;
  },

  getMigrationPriorities: async () => {
    const response = await api.get('/config/governance/migration-priorities');
    return response.data;
  },

  getFoundationDeliverables: async () => {
    const response = await api.get('/config/governance/foundation-deliverables');
    return response.data;
  },

  getStatusAlignment: async () => {
    const response = await api.get('/config/governance/status-alignment');
    return response.data;
  },

  getRemediationPlan: async () => {
    const response = await api.get('/config/governance/remediation-plan');
    return response.data;
  },

  getStatusNormalization: async () => {
    const response = await api.get('/config/governance/status-normalization');
    return response.data;
  },

  getChangeManagementQueue: async () => {
    const response = await api.get('/config/governance/change-management');
    return response.data;
  },
};
