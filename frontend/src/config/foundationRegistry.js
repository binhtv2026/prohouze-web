/**
 * ProHouze Foundation Registry
 * Canonical source for phase 1 transformation foundation:
 * - Status models
 * - Approval matrix
 * - Audit / timeline catalog
 */

export const FOUNDATION_STATUS_MODELS = [
  {
    title: 'Lead Status',
    code: 'lead_status',
    states: ['new', 'contacted', 'qualified', 'viewing', 'hot', 'converted', 'lost'],
    rule: 'Lead chi duoc convert sang deal khi da qualified hoac hot.',
  },
  {
    title: 'Deal Stage',
    code: 'deal_stage',
    states: ['new', 'consulting', 'proposal', 'negotiation', 'soft_booking', 'hard_booking', 'won', 'lost'],
    rule: 'Deal khong duoc ve hard_booking neu chua gan product.',
  },
  {
    title: 'Booking Status',
    code: 'booking_status',
    states: ['draft', 'queued', 'reserved', 'confirmed', 'expired', 'cancelled'],
    rule: 'Booking queued va reserved phai co expiry time de tranh giu cho vo han.',
  },
  {
    title: 'Contract Status',
    code: 'contract_status',
    states: ['draft', 'pending_sales', 'pending_legal', 'approved', 'signed', 'amended', 'cancelled'],
    rule: 'Hop dong chi duoc signed sau khi approval day du.',
  },
  {
    title: 'Payment Status',
    code: 'payment_status',
    states: ['pending', 'scheduled', 'partially_paid', 'paid', 'overdue', 'cancelled'],
    rule: 'Payment overdue phai kich hoat alert cho finance va sales owner.',
  },
  {
    title: 'Payout Status',
    code: 'payout_status',
    states: ['draft', 'pending_manager', 'pending_finance', 'approved', 'paid', 'rejected'],
    rule: 'Payout khong duoc approved neu khong truy duoc commission source.',
  },
];

export const FOUNDATION_STATUS_RULES = [
  'Khong cho phep status free-text cho cac entity core.',
  'Moi transition quan trong phai co actor, timestamp va ly do neu la override.',
  'Status thay doi phai duoc day vao timeline va audit log.',
  'Dashboard dieu hanh chi doc chi so tu state machine canonical.',
];

export const FOUNDATION_APPROVAL_FLOWS = [
  {
    title: 'Booking Exception Approval',
    owner: 'Sales Manager',
    steps: ['Sales Owner request', 'Manager review', 'Ops confirmation'],
    trigger: 'Booking ngoai policy, override queue, reserve qua quota.',
  },
  {
    title: 'Contract Approval',
    owner: 'Legal',
    steps: ['Sales review', 'Legal review', 'Final approval'],
    trigger: 'Hop dong moi, phu luc, dieu chinh dieu khoan.',
  },
  {
    title: 'Payout Approval',
    owner: 'Finance',
    steps: ['Manager confirm source', 'Finance verify', 'Final payout approval'],
    trigger: 'Chi hoa hong, chi payout batch, chi thuong dac biet.',
  },
  {
    title: 'Expense Approval',
    owner: 'Finance Controller',
    steps: ['Requester submit', 'Budget owner review', 'Finance approve'],
    trigger: 'Chi phi marketing, van hanh, sales support, su kien.',
  },
];

export const FOUNDATION_APPROVAL_RULES = [
  'Moi approval phai co resource_type, resource_id, current_step va final_status.',
  'Khong duyet mieng cho cac dong tien va ngoai le anh huong doanh thu.',
  'Moi reject phai co ly do va duoc ghi vao timeline.',
  'Approval step phai map duoc sang role, khong hardcode theo ten nguoi dung.',
];

export const FOUNDATION_AUDIT_RULES = [
  'Moi thao tac quan trong phai co actor_id, resource_type, resource_id, action, created_at.',
  'Thay doi nhay cam phai luu before_value va after_value de doi soat.',
  'Khong cap nhat du lieu core ma khong sinh audit event.',
  'Audit event va timeline event la hai lop lien ket, nhung khong duoc tron nghia voi nhau.',
];

export const FOUNDATION_TIMELINE_STREAMS = [
  {
    title: 'Lead Timeline',
    items: ['lead_created', 'lead_assigned', 'interaction_logged', 'lead_status_changed'],
  },
  {
    title: 'Deal Timeline',
    items: ['deal_created', 'deal_stage_changed', 'product_matched', 'deal_lost_or_won'],
  },
  {
    title: 'Booking Timeline',
    items: ['booking_created', 'queue_joined', 'reserved', 'confirmed', 'expired'],
  },
  {
    title: 'Finance Timeline',
    items: ['payment_scheduled', 'payment_recorded', 'commission_calculated', 'payout_approved'],
  },
];

export const FOUNDATION_AUDIT_DELIVERABLES = [
  'Audit event schema',
  'Timeline event schema',
  'Actor and resource mapping',
  'Before/after diff policy',
  'UI history panels cho cac module core',
  'Alert hooks cho override va exception',
];

export const FOUNDATION_CRITICAL_MOMENTS = [
  'Lead ownership thay doi',
  'Deal chuyen stage',
  'Booking override queue',
  'Contract approve / reject',
  'Payment overdue',
  'Payout approve / reject',
];
