/**
 * ProHouze Master Data Configuration
 * Version: 1.0 - Prompt 3/20
 * 
 * SINGLE SOURCE OF TRUTH for all picklists, statuses, categories, and master data
 * This file should be the ONLY place where these values are defined
 */

// ============================================
// LEAD STATUSES
// ============================================
export const LEAD_STATUSES = [
  { code: 'new', label: 'Mới', color: 'bg-slate-100 text-slate-700', order: 1, stage: 'prospect' },
  { code: 'contacted', label: 'Đã liên hệ', color: 'bg-blue-100 text-blue-700', order: 2, stage: 'prospect' },
  { code: 'called', label: 'Đã gọi điện', color: 'bg-blue-100 text-blue-700', order: 3, stage: 'prospect' },
  { code: 'warm', label: 'Ấm', color: 'bg-amber-100 text-amber-700', order: 4, stage: 'engaged' },
  { code: 'hot', label: 'Nóng', color: 'bg-red-100 text-red-700', order: 5, stage: 'engaged' },
  { code: 'viewing', label: 'Đã xem nhà', color: 'bg-purple-100 text-purple-700', order: 6, stage: 'engaged' },
  { code: 'qualified', label: 'Đủ điều kiện', color: 'bg-cyan-100 text-cyan-700', order: 7, stage: 'qualified' },
  { code: 'deposit', label: 'Đã đặt cọc', color: 'bg-emerald-100 text-emerald-700', order: 8, stage: 'committed' },
  { code: 'negotiation', label: 'Đang đàm phán', color: 'bg-indigo-100 text-indigo-700', order: 9, stage: 'committed' },
  { code: 'closed_won', label: 'Thành công', color: 'bg-green-100 text-green-700', order: 10, stage: 'closed' },
  { code: 'closed_lost', label: 'Thất bại', color: 'bg-gray-100 text-gray-700', order: 11, stage: 'closed' },
];

// ============================================
// LEAD SOURCES (Channels)
// ============================================
export const LEAD_SOURCES = [
  { code: 'facebook', label: 'Facebook', icon: 'facebook', group: 'social', isActive: true },
  { code: 'zalo', label: 'Zalo', icon: 'message-circle', group: 'social', isActive: true },
  { code: 'tiktok', label: 'TikTok', icon: 'video', group: 'social', isActive: true },
  { code: 'youtube', label: 'YouTube', icon: 'youtube', group: 'social', isActive: true },
  { code: 'linkedin', label: 'LinkedIn', icon: 'linkedin', group: 'social', isActive: true },
  { code: 'website', label: 'Website', icon: 'globe', group: 'digital', isActive: true },
  { code: 'landing_page', label: 'Landing Page', icon: 'layout', group: 'digital', isActive: true },
  { code: 'google_ads', label: 'Google Ads', icon: 'search', group: 'ads', isActive: true },
  { code: 'email', label: 'Email', icon: 'mail', group: 'direct', isActive: true },
  { code: 'phone', label: 'Điện thoại', icon: 'phone', group: 'direct', isActive: true },
  { code: 'referral', label: 'Giới thiệu', icon: 'users', group: 'offline', isActive: true },
  { code: 'event', label: 'Sự kiện', icon: 'calendar', group: 'offline', isActive: true },
  { code: 'collaborator', label: 'CTV', icon: 'user-plus', group: 'partner', isActive: true },
  { code: 'partner', label: 'Đối tác', icon: 'handshake', group: 'partner', isActive: true },
  { code: 'other', label: 'Khác', icon: 'more-horizontal', group: 'other', isActive: true },
];

// ============================================
// LEAD SEGMENTS (Customer Types)
// ============================================
export const LEAD_SEGMENTS = [
  { code: 'vip', label: 'VIP', description: 'Ngân sách > 10 tỷ', budgetMin: 10000000000, color: 'bg-purple-100 text-purple-700' },
  { code: 'high_value', label: 'Cao cấp', description: '5-10 tỷ', budgetMin: 5000000000, budgetMax: 10000000000, color: 'bg-indigo-100 text-indigo-700' },
  { code: 'mid_value', label: 'Trung cấp', description: '2-5 tỷ', budgetMin: 2000000000, budgetMax: 5000000000, color: 'bg-blue-100 text-blue-700' },
  { code: 'standard', label: 'Tiêu chuẩn', description: '1-2 tỷ', budgetMin: 1000000000, budgetMax: 2000000000, color: 'bg-slate-100 text-slate-700' },
  { code: 'entry', label: 'Phổ thông', description: '< 1 tỷ', budgetMax: 1000000000, color: 'bg-gray-100 text-gray-700' },
  { code: 'investor', label: 'Nhà đầu tư', description: 'Mua nhiều căn', color: 'bg-amber-100 text-amber-700' },
  { code: 'first_time_buyer', label: 'Lần đầu mua nhà', description: 'Khách mới', color: 'bg-green-100 text-green-700' },
  { code: 'corporate', label: 'Doanh nghiệp', description: 'Pháp nhân', color: 'bg-cyan-100 text-cyan-700' },
];

// ============================================
// PROPERTY TYPES (Loại BĐS)
// ============================================
export const PROPERTY_TYPES = [
  { code: 'apartment', label: 'Căn hộ chung cư', labelShort: 'Căn hộ', icon: 'building', isActive: true },
  { code: 'villa', label: 'Biệt thự', labelShort: 'Biệt thự', icon: 'home', isActive: true },
  { code: 'townhouse', label: 'Nhà phố liền kề', labelShort: 'Nhà phố', icon: 'building-2', isActive: true },
  { code: 'shophouse', label: 'Shophouse', labelShort: 'Shophouse', icon: 'store', isActive: true },
  { code: 'land', label: 'Đất nền', labelShort: 'Đất nền', icon: 'map-pin', isActive: true },
  { code: 'office', label: 'Văn phòng', labelShort: 'Văn phòng', icon: 'briefcase', isActive: true },
  { code: 'condotel', label: 'Condotel', labelShort: 'Condotel', icon: 'hotel', isActive: true },
  { code: 'officetel', label: 'Officetel', labelShort: 'Officetel', icon: 'building', isActive: true },
  { code: 'penthouse', label: 'Penthouse', labelShort: 'Penthouse', icon: 'crown', isActive: true },
  { code: 'duplex', label: 'Duplex', labelShort: 'Duplex', icon: 'layers', isActive: true },
];

// ============================================
// PRODUCT/LISTING STATUSES
// ============================================
export const PRODUCT_STATUSES = [
  { code: 'available', label: 'Còn hàng', color: 'bg-green-100 text-green-700', canSell: true },
  { code: 'booking', label: 'Đang giữ chỗ', color: 'bg-amber-100 text-amber-700', canSell: false },
  { code: 'deposited', label: 'Đã đặt cọc', color: 'bg-blue-100 text-blue-700', canSell: false },
  { code: 'sold', label: 'Đã bán', color: 'bg-slate-100 text-slate-700', canSell: false },
  { code: 'reserved', label: 'Giữ nội bộ', color: 'bg-purple-100 text-purple-700', canSell: false },
  { code: 'unavailable', label: 'Không bán', color: 'bg-gray-100 text-gray-700', canSell: false },
];

// ============================================
// DEAL STAGES (Pipeline)
// ============================================
export const DEAL_STAGES = [
  { code: 'lead', label: 'Lead mới', order: 1, probability: 10, color: 'bg-slate-500' },
  { code: 'qualified', label: 'Đã xác nhận', order: 2, probability: 20, color: 'bg-blue-500' },
  { code: 'site_visit', label: 'Đã xem nhà', order: 3, probability: 30, color: 'bg-cyan-500' },
  { code: 'proposal', label: 'Gửi báo giá', order: 4, probability: 50, color: 'bg-purple-500' },
  { code: 'negotiation', label: 'Đàm phán', order: 5, probability: 70, color: 'bg-indigo-500' },
  { code: 'booking', label: 'Đã booking', order: 6, probability: 80, color: 'bg-amber-500' },
  { code: 'deposit', label: 'Đã đặt cọc', order: 7, probability: 90, color: 'bg-orange-500' },
  { code: 'contract', label: 'Làm hợp đồng', order: 8, probability: 95, color: 'bg-emerald-500' },
  { code: 'won', label: 'Thành công', order: 9, probability: 100, color: 'bg-green-500', isClosed: true },
  { code: 'lost', label: 'Thất bại', order: 10, probability: 0, color: 'bg-gray-500', isClosed: true },
];

// ============================================
// BOOKING STATUSES
// ============================================
export const BOOKING_STATUSES = [
  { code: 'pending', label: 'Chờ xác nhận', color: 'bg-amber-100 text-amber-700' },
  { code: 'confirmed', label: 'Đã xác nhận', color: 'bg-blue-100 text-blue-700' },
  { code: 'deposited', label: 'Đã đặt cọc', color: 'bg-green-100 text-green-700' },
  { code: 'contract_signed', label: 'Đã ký HĐ', color: 'bg-emerald-100 text-emerald-700' },
  { code: 'cancelled', label: 'Đã hủy', color: 'bg-red-100 text-red-700' },
  { code: 'expired', label: 'Hết hạn', color: 'bg-gray-100 text-gray-700' },
];

// ============================================
// TASK STATUSES
// ============================================
export const TASK_STATUSES = [
  { code: 'todo', label: 'Cần làm', color: 'bg-slate-100 text-slate-700', order: 1, isOpen: true },
  { code: 'in_progress', label: 'Đang làm', color: 'bg-blue-100 text-blue-700', order: 2, isOpen: true },
  { code: 'review', label: 'Đang review', color: 'bg-purple-100 text-purple-700', order: 3, isOpen: true },
  { code: 'done', label: 'Hoàn thành', color: 'bg-green-100 text-green-700', order: 4, isOpen: false },
  { code: 'cancelled', label: 'Đã hủy', color: 'bg-gray-100 text-gray-700', order: 5, isOpen: false },
];

// ============================================
// TASK PRIORITIES
// ============================================
export const TASK_PRIORITIES = [
  { code: 'urgent', label: 'Khẩn cấp', color: 'bg-red-100 text-red-700', order: 1, icon: 'alert-circle' },
  { code: 'high', label: 'Cao', color: 'bg-orange-100 text-orange-700', order: 2, icon: 'arrow-up' },
  { code: 'medium', label: 'Trung bình', color: 'bg-blue-100 text-blue-700', order: 3, icon: 'minus' },
  { code: 'low', label: 'Thấp', color: 'bg-slate-100 text-slate-700', order: 4, icon: 'arrow-down' },
];

// ============================================
// TASK TYPES
// ============================================
export const TASK_TYPES = [
  { code: 'task', label: 'Công việc', icon: 'check-square' },
  { code: 'follow_up', label: 'Follow-up', icon: 'phone-call' },
  { code: 'call', label: 'Gọi điện', icon: 'phone' },
  { code: 'meeting', label: 'Cuộc họp', icon: 'users' },
  { code: 'site_visit', label: 'Dẫn khách xem', icon: 'map-pin' },
  { code: 'document', label: 'Hồ sơ/Giấy tờ', icon: 'file-text' },
  { code: 'reminder', label: 'Nhắc nhở', icon: 'bell' },
];

// ============================================
// CAMPAIGN TYPES
// ============================================
export const CAMPAIGN_TYPES = [
  { code: 'grand_opening', label: 'Mở bán lớn', description: 'Sự kiện mở bán chính thức' },
  { code: 'soft_opening', label: 'Mở bán mềm', description: 'Bán cho khách VIP trước' },
  { code: 'flash_sale', label: 'Flash Sale', description: 'Ưu đãi giới hạn thời gian' },
  { code: 'vip_sale', label: 'VIP Sale', description: 'Dành riêng khách VIP' },
  { code: 'phase_launch', label: 'Mở bán theo đợt', description: 'Phân đợt bán hàng' },
];

// ============================================
// CAMPAIGN STATUSES
// ============================================
export const CAMPAIGN_STATUSES = [
  { code: 'draft', label: 'Bản nháp', color: 'bg-slate-100 text-slate-700' },
  { code: 'upcoming', label: 'Sắp diễn ra', color: 'bg-blue-100 text-blue-700' },
  { code: 'active', label: 'Đang chạy', color: 'bg-green-100 text-green-700' },
  { code: 'paused', label: 'Tạm dừng', color: 'bg-amber-100 text-amber-700' },
  { code: 'ended', label: 'Kết thúc', color: 'bg-gray-100 text-gray-700' },
  { code: 'cancelled', label: 'Đã hủy', color: 'bg-red-100 text-red-700' },
];

// ============================================
// LOSS REASONS
// ============================================
export const LOSS_REASONS = [
  { code: 'price', label: 'Giá cao', group: 'financial' },
  { code: 'budget', label: 'Không đủ ngân sách', group: 'financial' },
  { code: 'location', label: 'Vị trí không phù hợp', group: 'product' },
  { code: 'product', label: 'Sản phẩm không phù hợp', group: 'product' },
  { code: 'competitor', label: 'Chọn đối thủ', group: 'competition' },
  { code: 'timing', label: 'Chưa sẵn sàng', group: 'timing' },
  { code: 'no_response', label: 'Không phản hồi', group: 'engagement' },
  { code: 'duplicate', label: 'Lead trùng', group: 'data' },
  { code: 'invalid', label: 'Thông tin không hợp lệ', group: 'data' },
  { code: 'other', label: 'Lý do khác', group: 'other' },
];

// ============================================
// PROVINCES (Vietnam)
// ============================================
export const PROVINCES = [
  { code: 'HN', label: 'Hà Nội', region: 'north' },
  { code: 'HCM', label: 'TP. Hồ Chí Minh', region: 'south' },
  { code: 'DN', label: 'Đà Nẵng', region: 'central' },
  { code: 'HP', label: 'Hải Phòng', region: 'north' },
  { code: 'CT', label: 'Cần Thơ', region: 'south' },
  { code: 'BD', label: 'Bình Dương', region: 'south' },
  { code: 'DNA', label: 'Đồng Nai', region: 'south' },
  { code: 'KH', label: 'Khánh Hòa', region: 'central' },
  { code: 'QN', label: 'Quảng Ninh', region: 'north' },
  { code: 'QNA', label: 'Quảng Nam', region: 'central' },
  { code: 'TH', label: 'Thanh Hóa', region: 'north' },
  { code: 'NA', label: 'Nghệ An', region: 'north' },
  { code: 'BR', label: 'Bà Rịa-Vũng Tàu', region: 'south' },
  { code: 'LA', label: 'Long An', region: 'south' },
  { code: 'PY', label: 'Phú Yên', region: 'central' },
];

// ============================================
// PRICE RANGES (VND)
// ============================================
export const PRICE_RANGES = [
  { code: 'under_2b', label: 'Dưới 2 tỷ', min: 0, max: 2000000000 },
  { code: '2b_5b', label: '2 - 5 tỷ', min: 2000000000, max: 5000000000 },
  { code: '5b_10b', label: '5 - 10 tỷ', min: 5000000000, max: 10000000000 },
  { code: '10b_20b', label: '10 - 20 tỷ', min: 10000000000, max: 20000000000 },
  { code: '20b_50b', label: '20 - 50 tỷ', min: 20000000000, max: 50000000000 },
  { code: 'over_50b', label: 'Trên 50 tỷ', min: 50000000000, max: null },
];

// ============================================
// AREA RANGES (m²)
// ============================================
export const AREA_RANGES = [
  { code: 'under_50', label: 'Dưới 50m²', min: 0, max: 50 },
  { code: '50_100', label: '50 - 100m²', min: 50, max: 100 },
  { code: '100_200', label: '100 - 200m²', min: 100, max: 200 },
  { code: '200_500', label: '200 - 500m²', min: 200, max: 500 },
  { code: 'over_500', label: 'Trên 500m²', min: 500, max: null },
];

// ============================================
// PROJECT STATUSES (BĐS Project)
// ============================================
export const PROJECT_STATUSES = [
  { code: 'upcoming', label: 'Sắp mở bán', color: 'bg-blue-100 text-blue-700' },
  { code: 'selling', label: 'Đang mở bán', color: 'bg-green-100 text-green-700' },
  { code: 'sold_out', label: 'Đã bán hết', color: 'bg-slate-100 text-slate-700' },
  { code: 'handover', label: 'Đã bàn giao', color: 'bg-amber-100 text-amber-700' },
];

// ============================================
// USER ROLES
// ============================================
export const USER_ROLES = [
  { code: 'bod', label: 'Ban Giám đốc', permissions: ['all'] },
  { code: 'admin', label: 'Admin', permissions: ['manage_users', 'manage_settings', 'view_all'] },
  { code: 'manager', label: 'Quản lý', permissions: ['manage_team', 'view_reports', 'approve'] },
  { code: 'sales', label: 'Sales', permissions: ['manage_leads', 'manage_deals', 'manage_tasks'] },
  { code: 'marketing', label: 'Marketing', permissions: ['manage_campaigns', 'manage_content'] },
  { code: 'hr', label: 'Nhân sự', permissions: ['manage_hr'] },
  { code: 'content', label: 'Content', permissions: ['manage_cms'] },
];

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get label by code from a master data array
 */
export const getLabel = (list, code, fallback = 'N/A') => {
  const item = list.find(i => i.code === code);
  return item?.label || fallback;
};

/**
 * Get color by code from a master data array
 */
export const getColor = (list, code, fallback = 'bg-slate-100 text-slate-700') => {
  const item = list.find(i => i.code === code);
  return item?.color || fallback;
};

/**
 * Get item by code
 */
export const getItem = (list, code) => {
  return list.find(i => i.code === code);
};

/**
 * Get active items only
 */
export const getActiveItems = (list) => {
  return list.filter(i => i.isActive !== false);
};

/**
 * Get items by group
 */
export const getItemsByGroup = (list, group) => {
  return list.filter(i => i.group === group);
};

/**
 * Convert to select options format
 */
export const toSelectOptions = (list, labelKey = 'label', valueKey = 'code') => {
  return list.map(item => ({
    label: item[labelKey],
    value: item[valueKey],
  }));
};

// ============================================
// EXPORT ALL
// ============================================
export default {
  LEAD_STATUSES,
  LEAD_SOURCES,
  LEAD_SEGMENTS,
  PROPERTY_TYPES,
  PRODUCT_STATUSES,
  DEAL_STAGES,
  BOOKING_STATUSES,
  TASK_STATUSES,
  TASK_PRIORITIES,
  TASK_TYPES,
  CAMPAIGN_TYPES,
  CAMPAIGN_STATUSES,
  LOSS_REASONS,
  PROVINCES,
  PRICE_RANGES,
  AREA_RANGES,
  PROJECT_STATUSES,
  USER_ROLES,
  // Helpers
  getLabel,
  getColor,
  getItem,
  getActiveItems,
  getItemsByGroup,
  toSelectOptions,
};
