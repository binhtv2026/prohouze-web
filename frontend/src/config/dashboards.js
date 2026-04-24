/**
 * ProHouze Dashboard Configuration
 * Version: 1.0 - Prompt 2/20
 * 
 * Central configuration for all dashboards
 */

import {
  LayoutDashboard,
  Users,
  ShoppingCart,
  Building2,
  DollarSign,
  UserCog,
  Scale,
  CheckSquare,
  Share2,
  BarChart3,
  Bot,
  Globe,
  UserPlus,
  Target,
  Calendar,
  FileText,
  Zap,
  TrendingUp,
  Package,
  Briefcase,
  Flame,
  Star,
  BookOpen,
  Wallet,
  ShieldCheck,
  MessageSquare,
} from 'lucide-react';
import { ROLES, ROLE_GROUPS } from '@/config/navigation';

// ============================================
// DASHBOARD DEFINITIONS
// ============================================

export const DASHBOARDS = {
  // Main System Dashboard
  main: {
    id: 'main',
    title: 'Tổng quan',
    subtitle: 'Tổng quan hoạt động kinh doanh',
    route: '/dashboard',
    icon: LayoutDashboard,
    roles: ROLE_GROUPS.ALL,
    description: 'Bảng điều khiển tổng quan cho CEO, Admin, Quản lý',
    kpiGroups: ['revenue', 'leads', 'deals', 'tasks'],
  },

  // CRM & Sales Dashboard
  crm: {
    id: 'crm',
    title: 'CRM & Bán hàng',
    subtitle: 'Quản lý lead, khách hàng và pipeline',
    route: '/sales',
    icon: Users,
    roles: ROLE_GROUPS.SALES_TEAM,
    description: 'Bảng điều khiển cho quản lý kinh doanh và trưởng nhóm',
    kpiGroups: ['leads', 'customers', 'pipeline', 'conversion'],
  },

  // Inventory Dashboard  
  inventory: {
    id: 'inventory',
    title: 'Kho hàng',
    subtitle: 'Quản lý dự án và nguồn hàng BĐS',
    route: '/inventory',
    icon: Building2,
    roles: ROLE_GROUPS.MANAGEMENT,
    description: 'Bảng điều khiển quản lý quỹ hàng và giỏ sản phẩm',
    kpiGroups: ['projects', 'products', 'availability'],
  },

  // Marketing Dashboard
  marketing: {
    id: 'marketing',
    title: 'Marketing',
    subtitle: 'Tổng quan marketing đa kênh',
    route: '/marketing',
    icon: Share2,
    roles: ROLE_GROUPS.MARKETING_TEAM,
    description: 'Bảng điều khiển cho đội marketing',
    kpiGroups: ['channels', 'campaigns', 'leadSource', 'content'],
  },

  // Work Dashboard
  work: {
    id: 'work',
    title: 'Công việc',
    subtitle: 'Quản lý tasks và lịch làm việc',
    route: '/work',
    icon: CheckSquare,
    roles: ROLE_GROUPS.ALL,
    description: 'Bảng điều khiển công việc hằng ngày',
    kpiGroups: ['tasks', 'calendar', 'reminders'],
  },

  // HR Dashboard
  hr: {
    id: 'hr',
    title: 'Nhân sự',
    subtitle: 'Quản lý nhân sự và tổ chức',
    route: '/hr',
    icon: UserCog,
    roles: ROLE_GROUPS.HR_TEAM,
    description: 'Bảng điều khiển cho đội nhân sự',
    kpiGroups: ['employees', 'recruitment', 'training'],
  },

  // Finance Dashboard
  finance: {
    id: 'finance',
    title: 'Tài chính',
    subtitle: 'Tổng quan tài chính doanh nghiệp',
    route: '/finance',
    icon: DollarSign,
    roles: ROLE_GROUPS.ADMIN_ONLY,
    description: 'Bảng điều khiển cho tài chính và quản trị',
    kpiGroups: ['revenue', 'expense', 'profit', 'commission'],
  },

  // Legal Dashboard
  legal: {
    id: 'legal',
    title: 'Pháp lý',
    subtitle: 'Quản lý hồ sơ và tuân thủ pháp lý',
    route: '/legal',
    icon: Scale,
    roles: ROLE_GROUPS.ADMIN_ONLY,
    description: 'Bảng điều khiển cho đội pháp lý',
    kpiGroups: ['contracts', 'licenses', 'compliance'],
  },

  // Analytics Dashboard
  analytics: {
    id: 'analytics',
    title: 'Phân tích',
    subtitle: 'Báo cáo và phân tích dữ liệu',
    route: '/analytics',
    icon: BarChart3,
    roles: ROLE_GROUPS.MANAGEMENT,
    description: 'Bảng điều khiển báo cáo và BI',
    kpiGroups: ['reports', 'trends', 'performance'],
  },

  // AI & Tools Dashboard
  tools: {
    id: 'tools',
    title: 'AI & Công cụ',
    subtitle: 'Trợ lý AI và công cụ hỗ trợ',
    route: '/tools/ai',
    icon: Bot,
    roles: [...ROLE_GROUPS.MANAGEMENT, ROLES.SALES, ROLES.MARKETING],
    description: 'Bảng điều khiển trợ lý AI',
    kpiGroups: ['aiUsage', 'automation'],
  },

  // CMS Dashboard
  cms: {
    id: 'cms',
    title: 'Website',
    subtitle: 'Quản lý nội dung website',
    route: '/cms',
    icon: Globe,
    roles: ROLE_GROUPS.MARKETING_TEAM,
    description: 'Bảng điều khiển quản lý CMS',
    kpiGroups: ['content', 'traffic', 'engagement'],
  },
};

// ============================================
// ROLE-BASED DASHBOARD ENTRY
// ============================================

export const ROLE_DEFAULT_DASHBOARD = {
  [ROLES.BOD]: { ...DASHBOARDS.main, route: '/workspace' },
  [ROLES.ADMIN]: { ...DASHBOARDS.main, route: '/workspace' },
  [ROLES.MANAGER]: { ...DASHBOARDS.crm, route: '/workspace' },
  [ROLES.SALES]: { ...DASHBOARDS.crm, route: '/sales' },
  [ROLES.MARKETING]: { ...DASHBOARDS.marketing, route: '/workspace' },
  [ROLES.HR]: { ...DASHBOARDS.hr, route: '/workspace' },
  [ROLES.CONTENT]: { ...DASHBOARDS.cms, route: '/workspace' },
  [ROLES.LEGAL]: { ...DASHBOARDS.legal, route: '/workspace' },
  [ROLES.FINANCE]: { ...DASHBOARDS.finance, route: '/workspace' },
  [ROLES.AGENCY]: { ...DASHBOARDS.work, route: '/workspace' },
};

// ============================================
// QUICK ACTIONS BY ROLE
// ============================================

export const ROLE_QUICK_ACTIONS = {
  [ROLES.BOD]: [
    { label: 'Xem báo cáo', icon: BarChart3, link: '/analytics/reports' },
    { label: 'Tài chính', icon: DollarSign, link: '/finance' },
    { label: 'KPI Sales', icon: Target, link: '/sales/kpi' },
    { label: 'Phễu giao dịch', icon: TrendingUp, link: '/sales/deals' },
  ],
  [ROLES.ADMIN]: [
    { label: 'Quản lý người dùng', icon: Users, link: '/hr/organization' },
    { label: 'Cài đặt', icon: UserCog, link: '/settings' },
    { label: 'Dự án website', icon: Globe, link: '/cms/projects' },
    { label: 'Báo cáo', icon: BarChart3, link: '/analytics/reports' },
  ],
  [ROLES.MANAGER]: [
    { label: 'Phễu bán hàng', icon: Target, link: '/sales/deals' },
    { label: 'Công việc đội nhóm', icon: CheckSquare, link: '/work/tasks' },
    { label: 'Leads mới', icon: UserPlus, link: '/crm/leads?status=new' },
    { label: 'Báo cáo', icon: BarChart3, link: '/analytics/reports' },
  ],
  [ROLES.SALES]: [
    { label: 'Lead nóng',    icon: Flame,       link: '/crm/leads?status=hot' },
    { label: 'Giỏ hàng',    icon: Building2,   link: '/sales/catalog' },
    { label: 'Lịch hẹn',    icon: Calendar,    link: '/work/calendar' },
    { label: 'Giữ chỗ',     icon: ShieldCheck, link: '/sales/bookings' },
    { label: 'Tài liệu',    icon: BookOpen,    link: '/sales/product-center' },
    { label: 'Hoa hồng',    icon: Wallet,      link: '/finance/my-income' },
    { label: 'Khách hàng',  icon: Users,       link: '/crm/contacts' },
    { label: 'KPI của tôi',  icon: Target,      link: '/kpi/personal' },
  ],
  [ROLES.MARKETING]: [
    { label: 'Tạo chiến dịch', icon: Zap, link: '/marketing/campaigns?new=true', variant: 'primary' },
    { label: 'Nội dung', icon: FileText, link: '/marketing/content' },
    { label: 'Nguồn khách theo kênh', icon: Share2, link: '/crm/leads?group=source' },
    { label: 'Thống kê', icon: BarChart3, link: '/cms/analytics' },
  ],
  [ROLES.HR]: [
    { label: 'Tuyển dụng', icon: Briefcase, link: '/hr/recruitment', variant: 'primary' },
    { label: 'Nhân viên', icon: Users, link: '/hr/organization' },
    { label: 'Đào tạo', icon: MessageSquare, link: '/hr/training' },
    { label: 'Hợp đồng', icon: FileText, link: '/hr/contracts' },
  ],
  [ROLES.CONTENT]: [
    { label: 'Viết bài mới', icon: FileText, link: '/cms/news?new=true', variant: 'primary' },
    { label: 'Dự án', icon: Building2, link: '/cms/projects' },
    { label: 'Thống kê', icon: BarChart3, link: '/cms/analytics' },
    { label: 'Biên tập video', icon: Package, link: '/tools/video' },
  ],
  [ROLES.FINANCE]: [
    { label: 'Doanh thu', icon: DollarSign, link: '/finance/overview' },
    { label: 'Công nợ', icon: Target, link: '/finance/receivables' },
    { label: 'Hoa hồng', icon: Users, link: '/finance/commissions' },
    { label: 'Đối soát', icon: CheckSquare, link: '/finance/payouts' },
  ],
  [ROLES.LEGAL]: [
    { label: 'Hợp đồng', icon: FileText, link: '/contracts' },
    { label: 'Hồ sơ pháp lý', icon: Building2, link: '/legal/licenses' },
    { label: 'Hợp đồng chờ xử lý', icon: Target, link: '/contracts/pending' },
    { label: 'Tài liệu gửi sale', icon: Package, link: '/legal/licenses' },
  ],
  [ROLES.AGENCY]: [
    { label: 'Sản phẩm',    icon: Building2,   link: '/sales/catalog' },
    { label: 'Khách tôi',    icon: Users,       link: '/crm/contacts' },
    { label: 'Hoa hồng',    icon: Wallet,      link: '/finance/my-income' },
    { label: 'Giới thiệu',   icon: UserPlus,    link: '/recruitment/referral' },
    { label: 'Xếp hạng',    icon: Star,        link: '/kpi/leaderboard' },
    { label: 'Tài liệu',    icon: BookOpen,    link: '/sales/product-center' },
    { label: 'Chia sẻ',     icon: Share2,      link: '/sales/catalog' },
    { label: 'Mã CTV',      icon: Zap,         link: '/recruitment/referral' },
  ],
};

// ============================================
// KPI DEFINITIONS
// ============================================

export const KPI_DEFINITIONS = {
  // Revenue KPIs
  revenue: {
    monthly_revenue: { label: 'Doanh thu tháng', color: 'green', icon: DollarSign },
    total_revenue: { label: 'Tổng doanh thu', color: 'green', icon: TrendingUp },
    commission: { label: 'Hoa hồng', color: 'amber', icon: DollarSign },
  },
  
  // Lead KPIs
  leads: {
    total_leads: { label: 'Tổng Lead', color: 'blue', icon: Users },
    new_leads: { label: 'Lead mới', color: 'blue', icon: UserPlus },
    hot_leads: { label: 'Lead nóng', color: 'red', icon: Users },
  },
  
  // Deal KPIs
  deals: {
    total_deals: { label: 'Tổng Deals', color: 'purple', icon: Target },
    won_deals: { label: 'Deals thắng', color: 'green', icon: Target },
    pipeline_value: { label: 'Giá trị pipeline', color: 'indigo', icon: TrendingUp },
  },
  
  // Task KPIs
  tasks: {
    total_tasks: { label: 'Tổng tasks', color: 'slate', icon: CheckSquare },
    overdue_tasks: { label: 'Quá hạn', color: 'red', icon: CheckSquare },
    due_today: { label: 'Hôm nay', color: 'amber', icon: Calendar },
  },
  
  // Product KPIs
  products: {
    total_projects: { label: 'Dự án', color: 'blue', icon: Building2 },
    available_units: { label: 'Căn còn', color: 'green', icon: Package },
    sold_units: { label: 'Đã bán', color: 'amber', icon: Package },
  },
  
  // HR KPIs
  employees: {
    total_employees: { label: 'Nhân viên', color: 'blue', icon: Users },
    open_positions: { label: 'Vị trí tuyển', color: 'amber', icon: Briefcase },
    active_trainings: { label: 'Đào tạo', color: 'purple', icon: MessageSquare },
  },
};

// ============================================
// ALERT PRIORITIES
// ============================================

export const ALERT_PRIORITIES = {
  critical: { order: 1, color: 'red', label: 'Khẩn cấp' },
  high: { order: 2, color: 'amber', label: 'Cao' },
  medium: { order: 3, color: 'blue', label: 'Trung bình' },
  low: { order: 4, color: 'slate', label: 'Thấp' },
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get dashboard config by ID
 */
export const getDashboard = (id) => DASHBOARDS[id];

/**
 * Get default dashboard for user role
 */
export const getDefaultDashboard = (role) => {
  return ROLE_DEFAULT_DASHBOARD[role] || DASHBOARDS.main;
};

/**
 * Get quick actions for user role
 */
export const getQuickActions = (role) => {
  return ROLE_QUICK_ACTIONS[role] || ROLE_QUICK_ACTIONS[ROLES.SALES];
};

/**
 * Get KPI definition
 */
export const getKPIDefinition = (group, key) => {
  return KPI_DEFINITIONS[group]?.[key];
};

/**
 * Filter dashboards by role
 */
export const filterDashboardsByRole = (role) => {
  return Object.values(DASHBOARDS).filter(dashboard => 
    dashboard.roles.includes(role)
  );
};

export default {
  DASHBOARDS,
  ROLE_DEFAULT_DASHBOARD,
  ROLE_QUICK_ACTIONS,
  KPI_DEFINITIONS,
  ALERT_PRIORITIES,
  getDashboard,
  getDefaultDashboard,
  getQuickActions,
  getKPIDefinition,
  filterDashboardsByRole,
};
