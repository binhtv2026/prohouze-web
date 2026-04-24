/**
 * ProHouze Canonical Entity Registry
 * Maps phase 1 business domains to entities, workflows and governance controls.
 */

export const CANONICAL_ENTITY_REGISTRY = [
  {
    domain: 'Organization',
    purpose: 'Quan tri da phong ban, da team, da chi nhanh',
    entities: ['organization', 'branch', 'department', 'team', 'position', 'user', 'user_membership'],
    workflows: ['access control', 'ownership', 'resource visibility'],
    governance: ['RBAC', 'audit_log', 'approval_scope'],
  },
  {
    domain: 'Customer',
    purpose: 'Customer 360 va lead lifecycle',
    entities: ['customer', 'customer_identity', 'lead', 'demand_profile', 'interaction', 'tag'],
    workflows: ['lead capture', 'deduplication', 'assignment', 'customer timeline'],
    governance: ['status_model', 'audit_log', 'timeline_events'],
  },
  {
    domain: 'Product',
    purpose: 'Giỏ hàng sơ cấp va inventory chuan',
    entities: ['developer', 'project', 'project_structure', 'product', 'price_history', 'promotion'],
    workflows: ['inventory update', 'pricing', 'public publishing'],
    governance: ['status_model', 'approval_matrix', 'audit_log'],
  },
  {
    domain: 'Sales',
    purpose: 'Lead -> deal -> booking -> chot giao dich',
    entities: ['deal', 'booking', 'booking_queue', 'sales_event', 'allocation_result'],
    workflows: ['deal pipeline', 'soft booking', 'hard booking', 'allocation'],
    governance: ['status_model', 'approval_matrix', 'timeline_events'],
  },
  {
    domain: 'Contract & Legal',
    purpose: 'Hop dong va ho so phap ly xuyen suot',
    entities: ['contract', 'contract_version', 'contract_approval', 'legal_document', 'compliance_item'],
    workflows: ['contract approval', 'legal checklist', 'amendment tracking'],
    governance: ['approval_matrix', 'audit_log', 'timeline_events'],
  },
  {
    domain: 'Finance',
    purpose: 'Thuc thu, cong no, payout, du bao',
    entities: ['payment', 'payment_schedule_item', 'receivable', 'expense', 'budget', 'ledger_event'],
    workflows: ['receivable tracking', 'expense control', 'cash reporting'],
    governance: ['approval_matrix', 'audit_log', 'alert_hooks'],
  },
  {
    domain: 'Commission',
    purpose: 'Tinh hoa hong va doi soat payout',
    entities: ['commission_rule', 'commission_entry', 'commission_split', 'payout_batch', 'payout_item'],
    workflows: ['commission calculation', 'payout approval', 'income tracking'],
    governance: ['approval_matrix', 'audit_log', 'timeline_events'],
  },
  {
    domain: 'HR',
    purpose: 'Nhan su chinh thuc, CTV, onboarding, payroll',
    entities: ['employee_profile', 'collaborator_profile', 'recruitment_candidate', 'payroll_record', 'attendance_record'],
    workflows: ['recruitment', 'onboarding', 'payroll'],
    governance: ['status_model', 'approval_matrix', 'audit_log'],
  },
];
