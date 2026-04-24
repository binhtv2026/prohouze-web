/**
 * ProHouze Module Registry
 * SINGLE SOURCE OF TRUTH for all module definitions
 * 
 * IMPORTANT: 
 * - All sidebar labels MUST come from here
 * - All breadcrumbs MUST come from here
 * - All page titles MUST come from here
 * - DO NOT hardcode module labels anywhere else
 * 
 * Architecture Guardrails:
 * - Each module has ONE ownership (Acquisition, Engagement, Relationship, Revenue, Execution, Admin)
 * - No duplicate domains under different names
 * - New modules must belong to existing ownership categories
 * 
 * Business Flow Order (BĐS Sơ cấp):
 * CRM → Marketing → Kho → Sales → Contract → Work → Finance
 */

// ============================================
// MODULE OWNERSHIP CATEGORIES
// ============================================
export const OWNERSHIP = {
  ACQUISITION: 'Acquisition',      // Marketing - Lead sources, campaigns
  ENGAGEMENT: 'Engagement',        // Communications - Content, social, automation
  RELATIONSHIP: 'Relationship',    // CRM - Contacts, leads, customers
  REVENUE: 'Revenue',              // Sales, Contracts - Pipeline, booking, contracts
  INVENTORY: 'Inventory',          // Kho hàng - Projects, products
  EXECUTION: 'Execution',          // Work OS - Tasks, calendar, reminders
  FINANCE: 'Finance',              // Tài chính - Payments, reports
  LEGAL: 'Legal',                  // Pháp lý - Legal docs, compliance
  HR: 'HR',                        // Nhân sự - Staff, teams
  ANALYTICS: 'Analytics',          // Phân tích - Reports, dashboards
  ADMIN: 'Admin',                  // Admin - System settings
};

// ============================================
// MODULE DEFINITIONS
// Order follows BĐS business flow:
// Khách → Hàng → Bán → Hợp đồng → Công việc → Tiền
// ============================================
export const MODULES = {
  // ----------------------------------------
  // 1. DASHBOARD
  // ----------------------------------------
  DASHBOARD: {
    id: 'dashboard',
    label: 'Dashboard',
    labelEn: 'Dashboard',
    ownership: null,
    description: 'Tổng quan hệ thống',
    basePath: '/dashboard',
    icon: 'LayoutDashboard',
    order: 1,
  },

  // ----------------------------------------
  // 2. CRM - Relationship (Prompt 6)
  // ----------------------------------------
  CRM: {
    id: 'crm',
    label: 'CRM',
    labelEn: 'CRM',
    ownership: OWNERSHIP.RELATIONSHIP,
    description: 'Quản lý quan hệ khách hàng',
    basePath: '/crm',
    icon: 'Users',
    order: 2,
    children: {
      DASHBOARD: { id: 'crm-dashboard', label: 'Tổng quan', path: '/crm' },
      CONTACTS: { id: 'crm-contacts', label: 'Contacts', path: '/crm/contacts' },
      LEADS: { id: 'crm-leads', label: 'Lead Pipeline', path: '/crm/leads' },
      DEMANDS: { id: 'crm-demands', label: 'Nhu cầu KH', path: '/crm/demands' },
      COLLABORATORS: { id: 'crm-collaborators', label: 'CTV', path: '/crm/collaborators' },
    },
  },

  // ----------------------------------------
  // 3. MARKETING - Acquisition (Prompt 7)
  // ----------------------------------------
  MARKETING: {
    id: 'marketing',
    label: 'Marketing',
    labelEn: 'Marketing',
    ownership: OWNERSHIP.ACQUISITION,
    description: 'Nguồn leads và chiến dịch marketing',
    basePath: '/marketing',
    icon: 'Target',
    order: 3,
    children: {
      DASHBOARD: { id: 'marketing-dashboard', label: 'Dashboard', path: '/marketing' },
      SOURCES: { id: 'marketing-sources', label: 'Nguồn Lead', path: '/marketing/sources' },
      CAMPAIGNS: { id: 'marketing-campaigns', label: 'Chiến dịch', path: '/marketing/campaigns' },
      RULES: { id: 'marketing-rules', label: 'Quy tắc phân bổ', path: '/marketing/rules' },
    },
  },

  // ----------------------------------------
  // 4. INVENTORY - Inventory (TRƯỚC SALES)
  // ----------------------------------------
  INVENTORY: {
    id: 'inventory',
    label: 'Kho hàng',
    labelEn: 'Inventory',
    ownership: OWNERSHIP.INVENTORY,
    description: 'Quản lý dự án và sản phẩm',
    basePath: '/inventory',
    icon: 'Building',
    order: 4,
    children: {
      DASHBOARD: { id: 'inventory-dashboard', label: 'Tổng quan', path: '/inventory' },
      PROJECTS: { id: 'inventory-projects', label: 'Dự án', path: '/inventory/projects' },
      PRODUCTS: { id: 'inventory-products', label: 'Sản phẩm', path: '/inventory/products' },
      PRICE_LISTS: { id: 'inventory-price-lists', label: 'Bảng giá', path: '/inventory/price-lists' },
      PROMOTIONS: { id: 'inventory-promotions', label: 'Khuyến mãi', path: '/inventory/promotions' },
      HANDOVER: { id: 'inventory-handover', label: 'Bàn giao', path: '/inventory/stock' },
    },
  },

  // ----------------------------------------
  // 5. SALES - Revenue (Prompt 8)
  // ----------------------------------------
  SALES: {
    id: 'sales',
    label: 'Bán hàng',
    labelEn: 'Sales',
    ownership: OWNERSHIP.REVENUE,
    description: 'Quản lý quy trình bán hàng',
    basePath: '/sales',
    icon: 'TrendingUp',
    order: 5,
    children: {
      DASHBOARD: { id: 'sales-dashboard', label: 'Tổng quan', path: '/sales' },
      PIPELINE: { id: 'sales-pipeline', label: 'Deal Pipeline', path: '/sales/pipeline' },
      SOFT_BOOKING: { id: 'sales-soft-booking', label: 'Soft Booking', path: '/sales/soft-bookings' },
      HARD_BOOKING: { id: 'sales-hard-booking', label: 'Hard Booking', path: '/sales/hard-bookings' },
      EVENTS: { id: 'sales-events', label: 'Sales Events', path: '/sales/events' },
      PRICING: { id: 'sales-pricing', label: 'Quản lý giá', path: '/sales/pricing' },
      KPI: { id: 'sales-kpi', label: 'KPI Dashboard', path: '/sales/kpi', isNew: true },
      KPI_LEADERBOARD: { id: 'sales-kpi-leaderboard', label: 'Bảng xếp hạng', path: '/sales/kpi/leaderboard', isNew: true },
      KPI_TARGETS: { id: 'sales-kpi-targets', label: 'Mục tiêu KPI', path: '/sales/kpi/targets', isNew: true },
    },
  },

  // ----------------------------------------
  // 6. CONTRACTS - Revenue/Legal (Prompt 9)
  // ----------------------------------------
  CONTRACTS: {
    id: 'contracts',
    label: 'Hợp đồng',
    labelEn: 'Contracts',
    ownership: OWNERSHIP.REVENUE,
    description: 'Quản lý hợp đồng và tài liệu',
    basePath: '/contracts',
    icon: 'FileText',
    order: 6,
    children: {
      LIST: { id: 'contracts-list', label: 'Danh sách HĐ', path: '/contracts', isNew: true },
      PENDING: { id: 'contracts-pending', label: 'Chờ duyệt', path: '/contracts?status=pending_approval', isNew: true },
    },
  },

  // ----------------------------------------
  // 7. WORK - Execution (Prompt 10)
  // ----------------------------------------
  WORK: {
    id: 'work',
    label: 'Công việc',
    labelEn: 'Work',
    ownership: OWNERSHIP.EXECUTION,
    description: 'Quản lý công việc và lịch',
    basePath: '/work',
    icon: 'CheckSquare',
    order: 7,
    children: {
      MY_DAY: { id: 'work-my-day', label: 'My Day', path: '/work', isNew: true },
      TASKS: { id: 'work-tasks', label: 'Tasks', path: '/work/tasks' },
      MANAGER: { id: 'work-manager', label: 'Team Workload', path: '/work/manager', isNew: true },
      KANBAN: { id: 'work-kanban', label: 'Kanban', path: '/work/kanban' },
      CALENDAR: { id: 'work-calendar', label: 'Lịch', path: '/work/calendar' },
      REMINDERS: { id: 'work-reminders', label: 'Nhắc nhở', path: '/work/reminders' },
    },
  },

  // ----------------------------------------
  // 8. FINANCE - Finance
  // ----------------------------------------
  FINANCE: {
    id: 'finance',
    label: 'Tài chính',
    labelEn: 'Finance',
    ownership: OWNERSHIP.FINANCE,
    description: 'Quản lý tài chính và thanh toán',
    basePath: '/finance',
    icon: 'DollarSign',
    order: 8,
    children: {
      // Main Dashboard - Single entry point
      OVERVIEW: { id: 'finance-overview', label: 'Dashboard', path: '/finance/overview' },
      // Core Finance Features
      RECEIVABLES: { id: 'finance-receivables', label: 'Công nợ', path: '/finance/receivables' },
      PAYOUTS: { id: 'finance-payouts', label: 'Chi trả', path: '/finance/payouts' },
      // Commission - Group
      COMMISSIONS: { id: 'finance-commissions', label: 'Hoa hồng', path: '/finance/commissions' },
      PROJECT_COMMISSIONS: { id: 'finance-project-commissions', label: 'Chính sách HH', path: '/finance/project-commissions' },
      COMMISSION_APPROVALS: { id: 'finance-commission-approvals', label: 'Duyệt HH', path: '/finance/commission/approvals' },
      // Personal - All roles
      MY_INCOME: { id: 'finance-my-income', label: 'Thu nhập của tôi', path: '/finance/my-income' },
      // Legacy - HIDDEN
      DASHBOARD: { id: 'finance-dashboard', label: 'Legacy Dashboard', path: '/finance', hidden: true },
      TRANSACTIONS: { id: 'finance-transactions', label: 'Giao dịch', path: '/finance/revenue', hidden: true },
      PAYMENTS: { id: 'finance-payments', label: 'Thanh toán', path: '/finance/payouts', hidden: true },
      COMMISSION_POLICIES: { id: 'finance-commission-policies', label: 'Chính sách HH cũ', path: '/finance/commission/policies', hidden: true },
      REPORTS: { id: 'finance-reports', label: 'Báo cáo', path: '/analytics/reports', hidden: true },
    },
  },

  // ----------------------------------------
  // 9. COMMUNICATIONS - Engagement
  // Updated for Prompt 13/20 - Marketing V2
  // ----------------------------------------
  COMMUNICATIONS: {
    id: 'communications',
    label: 'Truyền thông',
    labelEn: 'Communications',
    ownership: OWNERSHIP.ENGAGEMENT,
    description: 'Quản lý nội dung và kênh truyền thông',
    basePath: '/communications',
    icon: 'Share2',
    order: 9,
    children: {
      DASHBOARD: { id: 'communications-dashboard', label: 'Tổng quan', path: '/communications' },
      CHANNELS: { id: 'communications-channels', label: 'Kênh', path: '/communications/channels' },
      CONTENT: { id: 'communications-content', label: 'Nội dung', path: '/communications/content' },
      TEMPLATES: { id: 'communications-templates', label: 'Mẫu trả lời', path: '/communications/templates' },
      FORMS: { id: 'communications-forms', label: 'Forms', path: '/communications/forms' },
      ATTRIBUTION: { id: 'communications-attribution', label: 'Attribution', path: '/communications/attribution' },
      AUTOMATION: { id: 'communications-automation', label: 'Automation', path: '/communications/automation' },
    },
  },

  // ----------------------------------------
  // 10. LEGAL - Legal
  // ----------------------------------------
  LEGAL: {
    id: 'legal',
    label: 'Pháp lý',
    labelEn: 'Legal',
    ownership: OWNERSHIP.LEGAL,
    description: 'Quản lý pháp lý và tuân thủ',
    basePath: '/legal',
    icon: 'Shield',
    order: 10,
    children: {
      DASHBOARD: { id: 'legal-dashboard', label: 'Tổng quan', path: '/legal' },
      DOCUMENTS: { id: 'legal-documents', label: 'Tài liệu', path: '/legal/contracts' },
      APPROVALS: { id: 'legal-approvals', label: 'Phê duyệt', path: '/legal/compliance' },
    },
  },

  // ----------------------------------------
  // 11. HR - Human Resources
  // ----------------------------------------
  HR: {
    id: 'hr',
    label: 'Nhân sự',
    labelEn: 'HR',
    ownership: OWNERSHIP.HR,
    description: 'Quản lý nhân sự và tổ chức',
    basePath: '/hr',
    icon: 'Users',
    order: 11,
    children: {
      DASHBOARD: { id: 'hr-dashboard', label: 'Tổng quan', path: '/hr' },
      EMPLOYEES: { id: 'hr-employees', label: 'Nhân viên', path: '/hr/employees' },
      TEAMS: { id: 'hr-teams', label: 'Đội nhóm', path: '/organization' },
      ORG_CHART: { id: 'hr-org-chart', label: 'Sơ đồ tổ chức', path: '/organization' },
    },
  },

  // ----------------------------------------
  // 12. ANALYTICS - Analytics
  // ----------------------------------------
  ANALYTICS: {
    id: 'analytics',
    label: 'Phân tích',
    labelEn: 'Analytics',
    ownership: OWNERSHIP.ANALYTICS,
    description: 'Báo cáo và phân tích dữ liệu',
    basePath: '/analytics',
    icon: 'BarChart3',
    order: 12,
    children: {
      DASHBOARD: { id: 'analytics-dashboard', label: 'Tổng quan', path: '/analytics' },
      REPORTS: { id: 'analytics-reports', label: 'Báo cáo', path: '/analytics/reports' },
      BUSINESS: { id: 'analytics-business', label: 'Kinh doanh', path: '/analytics/business' },
      MARKET: { id: 'analytics-market', label: 'Thị trường', path: '/analytics/market' },
      TRENDS: { id: 'analytics-trends', label: 'Xu hướng', path: '/analytics/trends' },
    },
  },

  // ----------------------------------------
  // 13. TOOLS - Utilities
  // ----------------------------------------
  TOOLS: {
    id: 'tools',
    label: 'Công cụ',
    labelEn: 'Tools',
    ownership: OWNERSHIP.ADMIN,
    description: 'Công cụ và tiện ích',
    basePath: '/tools',
    icon: 'Wrench',
    order: 13,
    children: {
      AI: { id: 'tools-ai', label: 'AI Assistant', path: '/tools/ai' },
      VIDEO: { id: 'tools-video', label: 'Video Editor', path: '/tools/video' },
    },
  },

  // ----------------------------------------
  // 14. CMS - Website Content
  // ----------------------------------------
  CMS: {
    id: 'cms',
    label: 'Website',
    labelEn: 'CMS',
    ownership: OWNERSHIP.ADMIN,
    description: 'Quản lý nội dung website',
    basePath: '/cms',
    icon: 'Globe',
    order: 14,
    children: {
      PROJECTS: { id: 'cms-projects', label: 'Dự án', path: '/cms/projects' },
      NEWS: { id: 'cms-news', label: 'Tin tức', path: '/cms/news' },
      CAREERS: { id: 'cms-careers', label: 'Tuyển dụng', path: '/cms/careers' },
      TESTIMONIALS: { id: 'cms-testimonials', label: 'Đánh giá', path: '/cms/testimonials' },
      PARTNERS: { id: 'cms-partners', label: 'Đối tác', path: '/cms/partners' },
    },
  },

  // ----------------------------------------
  // 15. SETTINGS - Admin
  // ----------------------------------------
  SETTINGS: {
    id: 'settings',
    label: 'Cài đặt',
    labelEn: 'Settings',
    ownership: OWNERSHIP.ADMIN,
    description: 'Cài đặt hệ thống',
    basePath: '/settings',
    icon: 'Settings',
    order: 15,
    children: {
      GENERAL: { id: 'settings-general', label: 'Chung', path: '/settings' },
      USERS: { id: 'settings-users', label: 'Người dùng', path: '/settings/users' },
      ROLES: { id: 'settings-roles', label: 'Vai trò', path: '/settings/roles' },
      INTEGRATIONS: { id: 'settings-integrations', label: 'Tích hợp', path: '/settings/backend-contracts' },
    },
  },

  // ----------------------------------------
  // 16. ADMIN_SYSTEM - Super Admin
  // ----------------------------------------
  ADMIN_SYSTEM: {
    id: 'admin-system',
    label: 'Admin System',
    labelEn: 'Admin System',
    ownership: OWNERSHIP.ADMIN,
    description: 'Quản trị hệ thống',
    basePath: '/admin',
    icon: 'ShieldCheck',
    order: 16,
    children: {
      DASHBOARD: { id: 'admin-dashboard', label: 'Tổng quan', path: '/admin/overview' },
      TENANTS: { id: 'admin-tenants', label: 'Tenants', path: '/settings/organization' },
      LOGS: { id: 'admin-logs', label: 'Logs', path: '/settings/audit-timeline' },
    },
  },
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get module by ID
 */
export const getModuleById = (moduleId) => {
  return Object.values(MODULES).find(m => m.id === moduleId);
};

/**
 * Get module by path
 */
export const getModuleByPath = (path) => {
  return Object.values(MODULES).find(m => path.startsWith(m.basePath));
};

/**
 * Get module label (Vietnamese)
 */
export const getModuleLabel = (moduleId) => {
  const module = getModuleById(moduleId);
  return module?.label || moduleId;
};

/**
 * Get module label English
 */
export const getModuleLabelEn = (moduleId) => {
  const module = getModuleById(moduleId);
  return module?.labelEn || moduleId;
};

/**
 * Get child item by path
 */
export const getChildByPath = (path) => {
  for (const module of Object.values(MODULES)) {
    if (module.children) {
      for (const child of Object.values(module.children)) {
        if (child.path === path) {
          return { module, child };
        }
      }
    }
  }
  return null;
};

/**
 * Generate breadcrumb from path
 */
export const getBreadcrumb = (path) => {
  const result = getChildByPath(path);
  if (!result) {
    const module = getModuleByPath(path);
    if (module) {
      return [{ label: module.label, path: module.basePath }];
    }
    return [];
  }
  
  return [
    { label: result.module.label, path: result.module.basePath },
    { label: result.child.label, path: result.child.path },
  ];
};

/**
 * Get page title from path
 */
export const getPageTitle = (path) => {
  const result = getChildByPath(path);
  if (result) {
    return `${result.child.label} | ${result.module.label} | ProHouze`;
  }
  
  const module = getModuleByPath(path);
  if (module) {
    return `${module.label} | ProHouze`;
  }
  
  return 'ProHouze';
};

/**
 * Get all modules sorted by order
 */
export const getAllModulesSorted = () => {
  return Object.values(MODULES).sort((a, b) => a.order - b.order);
};

/**
 * Get modules by ownership
 */
export const getModulesByOwnership = (ownership) => {
  return Object.values(MODULES).filter(m => m.ownership === ownership);
};

// ============================================
// EXPORTS
// ============================================
export default MODULES;
