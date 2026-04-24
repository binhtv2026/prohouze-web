import {
  FOUNDATION_APPROVAL_FLOWS,
  FOUNDATION_APPROVAL_RULES,
  FOUNDATION_AUDIT_DELIVERABLES,
  FOUNDATION_AUDIT_RULES,
  FOUNDATION_CRITICAL_MOMENTS,
  FOUNDATION_STATUS_MODELS,
  FOUNDATION_STATUS_RULES,
  FOUNDATION_TIMELINE_STREAMS,
} from '@/config/foundationRegistry';
import { CANONICAL_ENTITY_REGISTRY } from '@/config/canonicalEntityRegistry';

export const governanceFoundationService = {
  getStatusModels() {
    return FOUNDATION_STATUS_MODELS;
  },

  getStatusRules() {
    return FOUNDATION_STATUS_RULES;
  },

  getApprovalFlows() {
    return FOUNDATION_APPROVAL_FLOWS;
  },

  getApprovalRules() {
    return FOUNDATION_APPROVAL_RULES;
  },

  getAuditRules() {
    return FOUNDATION_AUDIT_RULES;
  },

  getTimelineStreams() {
    return FOUNDATION_TIMELINE_STREAMS;
  },

  getAuditDeliverables() {
    return FOUNDATION_AUDIT_DELIVERABLES;
  },

  getCriticalMoments() {
    return FOUNDATION_CRITICAL_MOMENTS;
  },

  getCanonicalEntities() {
    return CANONICAL_ENTITY_REGISTRY;
  },

  getEntityGovernanceIndex() {
    return CANONICAL_ENTITY_REGISTRY.flatMap((domain) =>
      domain.entities.map((entity) => {
        const controls = domain.governance || [];
        const workflows = domain.workflows || [];

        return {
          entity,
          domain: domain.domain,
          purpose: domain.purpose,
          workflows,
          controls,
          linkedStatusModels: controls.includes('status_model')
            ? FOUNDATION_STATUS_MODELS.filter((model) => {
                if (entity === 'lead') return model.code === 'lead_status';
                if (entity === 'deal') return model.code === 'deal_stage';
                if (entity === 'booking' || entity === 'booking_queue') return model.code === 'booking_status';
                if (entity === 'contract' || entity === 'contract_version') return model.code === 'contract_status';
                if (entity === 'payment' || entity === 'payment_schedule_item' || entity === 'receivable') {
                  return model.code === 'payment_status';
                }
                if (entity === 'payout_batch' || entity === 'payout_item') return model.code === 'payout_status';
                if (domain.domain === 'HR') return ['lead_status', 'payout_status'].includes(model.code) === false;
                return false;
              }).map((model) => model.code)
            : [],
          linkedApprovalFlows: controls.includes('approval_matrix')
            ? FOUNDATION_APPROVAL_FLOWS.filter((flow) => {
                if (domain.domain === 'Sales') return flow.title === 'Booking Exception Approval';
                if (domain.domain === 'Contract & Legal') return flow.title === 'Contract Approval';
                if (domain.domain === 'Finance' || domain.domain === 'Commission') {
                  return ['Payout Approval', 'Expense Approval'].includes(flow.title);
                }
                if (domain.domain === 'HR') return flow.title === 'Expense Approval';
                return false;
              }).map((flow) => flow.title)
            : [],
          linkedTimelineStreams: controls.includes('timeline_events')
            ? FOUNDATION_TIMELINE_STREAMS.filter((stream) => {
                if (entity === 'lead' || entity === 'customer') return stream.title === 'Lead Timeline';
                if (entity === 'deal') return stream.title === 'Deal Timeline';
                if (entity === 'booking' || entity === 'booking_queue') return stream.title === 'Booking Timeline';
                if (domain.domain === 'Finance' || domain.domain === 'Commission') return stream.title === 'Finance Timeline';
                if (domain.domain === 'Contract & Legal') return stream.title === 'Deal Timeline';
                return false;
              }).map((stream) => stream.title)
            : [],
        };
      }),
    );
  },

  getEntityGovernanceForEntity(entityName) {
    return this.getEntityGovernanceIndex().find((entry) => entry.entity === entityName) || null;
  },

  getEntityGovernanceCoverage(entityNames = []) {
    const index = this.getEntityGovernanceIndex();
    const mapped = entityNames.filter((entityName) => index.some((entry) => entry.entity === entityName));
    const unmapped = entityNames.filter((entityName) => index.every((entry) => entry.entity !== entityName));

    return {
      total: entityNames.length,
      mapped: mapped.length,
      unmapped: unmapped.length,
      mappedEntities: mapped,
      unmappedEntities: unmapped,
    };
  },

  getGovernanceSummary() {
    const entityGovernanceIndex = this.getEntityGovernanceIndex();
    return {
      domainCount: CANONICAL_ENTITY_REGISTRY.length,
      mappedEntityCount: entityGovernanceIndex.length,
      statusModelCount: FOUNDATION_STATUS_MODELS.length,
      approvalFlowCount: FOUNDATION_APPROVAL_FLOWS.length,
      timelineStreamCount: FOUNDATION_TIMELINE_STREAMS.length,
      criticalMomentCount: FOUNDATION_CRITICAL_MOMENTS.length,
    };
  },
};
