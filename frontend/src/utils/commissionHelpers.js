/**
 * Commission Helpers
 * Prompt 11/20 - Commission Engine
 * 
 * Utility functions for commission display and validation
 */

/**
 * Check if commission record is legacy (no snapshot)
 * @param {Object} record - Commission record
 * @returns {boolean}
 */
export const isLegacyRecord = (record) => {
  return !record?.rule_snapshot;
};

/**
 * Get legacy status info
 * @param {Object} record - Commission record
 * @returns {Object} { isLegacy, warning, badgeText }
 */
export const getLegacyInfo = (record) => {
  const isLegacy = isLegacyRecord(record);
  return {
    isLegacy,
    warning: isLegacy 
      ? 'Record này được tạo trước khi hệ thống snapshot. Giá trị hiển thị dựa trên dữ liệu gốc, không có chi tiết policy.'
      : '',
    badgeText: isLegacy ? 'Legacy (Ước tính)' : '',
  };
};

/**
 * Format currency VND
 * @param {number} amount 
 * @returns {string}
 */
export const formatCurrency = (amount) => {
  if (!amount && amount !== 0) return '0 đ';
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

/**
 * Format short currency (M, B)
 * @param {number} amount 
 * @returns {string}
 */
export const formatShortCurrency = (amount) => {
  if (!amount) return '0';
  if (amount >= 1_000_000_000) return `${(amount / 1_000_000_000).toFixed(1)}B`;
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(0)}M`;
  return amount.toLocaleString('vi-VN');
};

/**
 * Get commission formula string
 * @param {Object} record - Commission record
 * @returns {string}
 */
export const getFormulaString = (record) => {
  if (!record) return '';
  
  // Nếu có applied_formula từ snapshot, dùng trực tiếp
  if (record.applied_formula) {
    return record.applied_formula;
  }
  
  // Legacy fallback - generate formula từ fields có sẵn
  const base = record.base_amount || 0;
  const rate = record.brokerage_rate || 0;
  const split = record.split_percent || 0;
  const final = record.final_amount || 0;
  
  if (base > 0) {
    return `${formatShortCurrency(base)} × ${rate}% × ${split}% = ${formatShortCurrency(final)} (ước tính)`;
  }
  
  return `Giá trị: ${formatCurrency(final)}`;
};

/**
 * Get status badge config
 * @param {string} status 
 * @returns {Object} { label, variant, className }
 */
export const getStatusConfig = (status) => {
  const config = {
    draft: { label: 'Nháp', variant: 'outline', className: 'border-slate-500 text-slate-600' },
    estimated: { label: 'Ước tính', variant: 'outline', className: 'border-blue-500 text-blue-600' },
    pending: { label: 'Chờ xử lý', variant: 'outline', className: 'border-yellow-500 text-yellow-600' },
    pending_approval: { label: 'Chờ duyệt', variant: 'outline', className: 'border-orange-500 text-orange-600' },
    approved: { label: 'Đã duyệt', variant: 'default', className: 'bg-green-500 text-white' },
    rejected: { label: 'Từ chối', variant: 'destructive', className: '' },
    ready_for_payout: { label: 'Sẵn sàng chi', variant: 'default', className: 'bg-teal-500 text-white' },
    scheduled: { label: 'Đã lên lịch', variant: 'outline', className: 'border-indigo-500 text-indigo-600' },
    paid: { label: 'Đã chi', variant: 'default', className: 'bg-emerald-600 text-white' },
    cancelled: { label: 'Đã huỷ', variant: 'outline', className: 'border-gray-500 text-gray-600' },
    disputed: { label: 'Tranh chấp', variant: 'outline', className: 'border-purple-500 text-purple-600' },
  };
  return config[status] || { label: status, variant: 'outline', className: '' };
};

/**
 * Check if record can be edited
 * @param {Object} record 
 * @returns {boolean}
 */
export const canEditRecord = (record) => {
  if (!record) return false;
  
  // Không edit được nếu đã lock
  if (record.is_locked) return false;
  
  // Không edit được nếu đã approved
  if (record.approval_status === 'approved') return false;
  
  // Không edit được nếu ở các trạng thái final
  const nonEditableStatuses = ['approved', 'paid', 'ready_for_payout', 'scheduled'];
  if (nonEditableStatuses.includes(record.status)) return false;
  
  return true;
};

/**
 * Check if record can be approved
 * @param {Object} record 
 * @param {string} userRole 
 * @returns {boolean}
 */
export const canApproveRecord = (record, userRole) => {
  if (!record) return false;
  if (record.approval_status !== 'pending') return false;
  
  const approvalRoles = {
    1: ['sales_manager', 'manager', 'admin', 'bod'],
    2: ['finance_manager', 'admin', 'bod'],
    3: ['director', 'bod'],
  };
  
  const currentStep = record.current_approval_step || 1;
  const allowedRoles = approvalRoles[currentStep] || [];
  
  return allowedRoles.includes(userRole);
};

export default {
  isLegacyRecord,
  getLegacyInfo,
  formatCurrency,
  formatShortCurrency,
  getFormulaString,
  getStatusConfig,
  canEditRecord,
  canApproveRecord,
};
