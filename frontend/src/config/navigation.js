/**
 * ProHouze Navigation Configuration
 * Version: 3.0 - LOCKED 15 MODULES STRUCTURE
 * 
 * 15 MODULES (KHÔNG THÊM/BỚT/TÁCH/GỘP):
 * 1. Trung tâm điều hành
 * 2. CRM & Khách hàng 360 🔥
 * 3. Marketing & Tăng trưởng
 * 4. Kinh doanh & Giao dịch 🔥
 * 5. Hợp đồng & Pháp lý
 * 6. Hoa hồng & Tài chính 🔥
 * 7. Quản lý dự án 🔥
 * 8. Sản phẩm & Kho hàng 🔥
 * 9. Đại lý & Phân phối 🔥
 * 10. Quy trình & Vận hành
 * 11. Nhân sự & Tuyển dụng
 * 12. Đào tạo & Học viện
 * 13. Phân tích & BI 🔥
 * 14. Hệ thống & Bảo mật 🔒
 * 15. Cổng khách hàng 🔥
 */

import { MODULES } from './module_registry';

import {
  LayoutDashboard,
  Gauge,
  Users,
  UserCircle,
  HandCoins,
  Building2,
  Package,
  Layers,
  Target,
  ShoppingCart,
  FileText,
  BarChart3,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Coins,
  CreditCard,
  UserCog,
  Network,
  Briefcase,
  UserPlus,
  GraduationCap,
  Scale,
  FileCheck,
  ShieldCheck,
  Shield,
  CheckSquare,
  Columns,
  Calendar,
  Bell,
  Share2,
  List,
  Percent,
  MessageSquare,
  Zap,
  PieChart,
  Globe,
  Bot,
  Video,
  Newspaper,
  Quote,
  Settings,
  Home,
  Database,
  FileCode,
  Tag,
  History,
  GitBranch,
  Flame,
  Lock,
  BookOpen,
  Store,
  Truck,
  FolderKanban,
  ClipboardList,
  AlertTriangle,
  Award,
  LineChart,
  Eye,
  ExternalLink,
  Smartphone,
  Monitor,
  ChevronRight,
  ArrowLeftRight,
} from 'lucide-react';

// ============================================
// ROLE DEFINITIONS
// ============================================
export const ROLES = {
  BOD:               'bod',
  ADMIN:             'admin',
  MANAGER:           'manager',
  SALES:             'sales',
  MARKETING:         'marketing',
  HR:                'hr',
  CONTENT:           'content',
  LEGAL:             'legal',
  FINANCE:           'finance',
  AGENCY:            'agency',
  // ── Mới — Quản trị Công ty Cổ phần ──────────────────────────────────
  AUDIT:             'audit',          // HĐQT + Ban Kiểm soát (read-only toàn hệ thống)
  // ── Mới — Kinh doanh Dự án ———————————————————————————————
  PROJECT_DIRECTOR:  'project_director', // GĐ Dự án (phạm vi project_code)
  // ── Mới — Hỗ trợ Nghiệp vụ ——————————————————————————————
  SALES_SUPPORT:     'sales_support',   // Sales Admin + CSKH + QH Chủ ĐT
};

// Role groups for easier permission assignment
export const ROLE_GROUPS = {
  ALL:          Object.values(ROLES),
  MANAGEMENT:   [ROLES.BOD, ROLES.ADMIN, ROLES.MANAGER, ROLES.PROJECT_DIRECTOR],
  SALES_TEAM:   [ROLES.BOD, ROLES.ADMIN, ROLES.MANAGER, ROLES.SALES, ROLES.PROJECT_DIRECTOR],
  SALES_FULL:   [ROLES.BOD, ROLES.ADMIN, ROLES.MANAGER, ROLES.SALES, ROLES.PROJECT_DIRECTOR, ROLES.SALES_SUPPORT],
  MARKETING_TEAM: [ROLES.BOD, ROLES.ADMIN, ROLES.MARKETING, ROLES.CONTENT],
  HR_TEAM:      [ROLES.BOD, ROLES.ADMIN, ROLES.HR],
  FINANCE_TEAM: [ROLES.BOD, ROLES.ADMIN, ROLES.FINANCE, ROLES.AUDIT],
  ADMIN_ONLY:   [ROLES.BOD, ROLES.ADMIN],
  GOVERNANCE:   [ROLES.AUDIT, ROLES.BOD, ROLES.ADMIN],
};

// ============================================
// NAVIGATION STRUCTURE - 15 LOCKED MODULES
// ============================================
export const NAVIGATION = [
  // ============================================
  // 1. CONTROL CENTER
  // ============================================
  {
    id: 'control-center',
    label: 'Trung tâm điều hành',
    labelEn: 'Control Center',
    icon: Gauge,
    path: null,
    roles: ROLE_GROUPS.MANAGEMENT,
    description: 'Trung tâm điều hành',
    children: [
      {
        id: 'control-dashboard',
        label: 'Bảng điều khiển',
        icon: LayoutDashboard,
        path: '/dashboard',
        roles: ROLE_GROUPS.ALL,
      },
      {
        id: 'control-executive',
        label: 'Góc nhìn điều hành',
        icon: Gauge,
        path: '/control',
        roles: ROLE_GROUPS.MANAGEMENT,
      },
      {
        id: 'control-alerts',
        label: 'Cảnh báo & thông báo',
        icon: Bell,
        path: '/control/alerts',
        roles: ROLE_GROUPS.MANAGEMENT,
      },
    ],
  },

  // ============================================
  // 2. CRM & CUSTOMER 360 🔥
  // ============================================
  {
    id: 'crm-customer-360',
    label: 'Khách hàng 360',
    labelEn: 'CRM & Customer 360',
    icon: Users,
    path: null,
    roles: [...ROLE_GROUPS.SALES_TEAM, ROLES.MARKETING],
    description: 'Quản lý khách hàng 360°',
    isHot: true,
    children: [
      {
        id: 'crm-dashboard',
        label: 'Tổng quan',
        icon: LayoutDashboard,
        path: '/crm',
        roles: [...ROLE_GROUPS.SALES_TEAM, ROLES.MARKETING],
      },
      {
        id: 'crm-contacts',
        label: 'Khách hàng',
        icon: UserCircle,
        path: '/crm/contacts',
        roles: [...ROLE_GROUPS.SALES_TEAM, ROLES.MARKETING],
      },
      {
        id: 'crm-leads',
        label: 'Nguồn khách',
        icon: Target,
        path: '/crm/leads',
        roles: [...ROLE_GROUPS.SALES_TEAM, ROLES.MARKETING],
      },
      {
        id: 'crm-demands',
        label: 'Nhu cầu khách',
        icon: ClipboardList,
        path: '/crm/demands',
        roles: ROLE_GROUPS.SALES_TEAM,
      },
      {
        id: 'crm-collaborators',
        label: 'Cộng tác viên',
        icon: HandCoins,
        path: '/crm/collaborators',
        roles: ROLE_GROUPS.SALES_TEAM,
      },
    ],
  },

  // ============================================
  // 3. MARKETING & GROWTH
  // ============================================
  {
    id: 'marketing-growth',
    label: 'Marketing & Tăng trưởng',
    labelEn: 'Marketing & Growth',
    icon: TrendingUp,
    path: null,
    roles: [...ROLE_GROUPS.SALES_TEAM, ROLES.MARKETING, ROLES.CONTENT],
    description: 'Marketing, chiến dịch và tăng trưởng',
    children: [
      {
        id: 'marketing-dashboard',
        label: 'Tổng quan',
        icon: LayoutDashboard,
        path: '/marketing',
        roles: [...ROLE_GROUPS.SALES_TEAM, ROLES.MARKETING],
      },
      {
        id: 'marketing-sources',
        label: 'Nguồn khách',
        icon: Globe,
        path: '/marketing/sources',
        roles: [...ROLE_GROUPS.SALES_TEAM, ROLES.MARKETING],
      },
      {
        id: 'marketing-campaigns',
        label: 'Chiến dịch',
        icon: Zap,
        path: '/marketing/campaigns',
        roles: [...ROLE_GROUPS.SALES_TEAM, ROLES.MARKETING],
      },
      {
        id: 'marketing-rules',
        label: 'Quy tắc phân bổ',
        icon: Settings,
        path: '/marketing/rules',
        roles: ROLE_GROUPS.MANAGEMENT,
      },
      {
        id: 'marketing-channels',
        label: 'Kênh truyền thông',
        icon: Share2,
        path: '/communications/channels',
        roles: ROLE_GROUPS.MARKETING_TEAM,
      },
      {
        id: 'marketing-content',
        label: 'Lịch nội dung',
        icon: Calendar,
        path: '/communications/content',
        roles: ROLE_GROUPS.MARKETING_TEAM,
      },
      {
        id: 'marketing-templates',
        label: 'Mẫu trả lời',
        icon: MessageSquare,
        path: '/communications/templates',
        roles: ROLE_GROUPS.MARKETING_TEAM,
      },
      {
        id: 'marketing-forms',
        label: 'Biểu mẫu',
        icon: FileText,
        path: '/communications/forms',
        roles: ROLE_GROUPS.MARKETING_TEAM,
      },
      {
        id: 'marketing-attribution',
        label: 'Ghi nhận nguồn',
        icon: PieChart,
        path: '/communications/attribution',
        roles: ROLE_GROUPS.MARKETING_TEAM,
      },
      {
        id: 'marketing-automation',
        label: 'Tự động hóa',
        icon: Bot,
        path: '/communications/automation',
        roles: ROLE_GROUPS.ADMIN_ONLY,
      },
      {
        id: 'marketing-email',
        label: 'Tự động hóa email',
        icon: MessageSquare,
        path: '/email',
        roles: ROLE_GROUPS.ADMIN_ONLY,
        badge: 'AI',
      },
      {
        id: 'marketing-ai',
        label: 'Trợ lý AI',
        icon: Bot,
        path: '/tools/ai',
        roles: ROLE_GROUPS.MARKETING_TEAM,
      },
      {
        id: 'ai-lead-distribution',
        label: 'AI Lead Distribution',
        icon: Bot,
        path: '/ai/lead-distribution',
        roles: ROLE_GROUPS.MANAGEMENT,
        badge: 'Mới',
      },
    ],
  },

  // ============================================
  // 4. SALES & TRANSACTION 🔥
  // ============================================
  {
    id: 'sales-transaction',
    label: 'Kinh doanh & Giao dịch',
    labelEn: 'Sales & Transaction',
    icon: ShoppingCart,
    path: null,
    roles: ROLE_GROUPS.SALES_TEAM,
    description: 'Bán hàng, giữ chỗ và giao dịch',
    isHot: true,
    children: [
      {
        id: 'sales-dashboard',
        label: 'Tổng quan',
        icon: LayoutDashboard,
        path: '/sales',
        roles: ROLE_GROUPS.SALES_TEAM,
      },
      {
        id: 'sales-pipeline',
        label: 'Phễu giao dịch',
        icon: Target,
        path: '/sales/pipeline',
        roles: ROLE_GROUPS.SALES_TEAM,
        badge: 'Nóng',
      },
      {
        id: 'sales-soft-booking',
        label: 'Giữ chỗ mềm',
        icon: Users,
        path: '/sales/soft-bookings',
        roles: ROLE_GROUPS.SALES_TEAM,
        badge: 'Hàng đợi',
      },
      {
        id: 'sales-hard-booking',
        label: 'Giữ chỗ cứng',
        icon: CheckSquare,
        path: '/sales/hard-bookings',
        roles: ROLE_GROUPS.SALES_TEAM,
      },
      {
        id: 'sales-events',
        label: 'Sự kiện bán hàng',
        icon: Calendar,
        path: '/sales/events',
        roles: ROLE_GROUPS.SALES_TEAM,
      },
      {
        id: 'sales-pricing',
        label: 'Quản lý giá',
        icon: DollarSign,
        path: '/sales/pricing',
        roles: ROLE_GROUPS.MANAGEMENT,
      },
      {
        id: 'sales-kpi',
        label: 'Bảng KPI',
        icon: Award,
        path: '/kpi',
        roles: ROLE_GROUPS.SALES_TEAM,
      },
      {
        id: 'sales-kpi-my',
        label: 'KPI của tôi',
        icon: Target,
        path: '/kpi/my-performance',
        roles: ROLE_GROUPS.ALL,
        badge: 'Mới',
      },
      {
        id: 'sales-kpi-team',
        label: 'KPI đội nhóm',
        icon: Users,
        path: '/kpi/team',
        roles: ROLE_GROUPS.MANAGEMENT,
        badge: 'Mới',
      },
      {
        id: 'sales-kpi-leaderboard',
        label: 'Bảng xếp hạng',
        icon: TrendingUp,
        path: '/kpi/leaderboard',
        roles: ROLE_GROUPS.SALES_TEAM,
      },
      {
        id: 'sales-kpi-targets',
        label: 'Mục tiêu KPI',
        icon: Target,
        path: '/kpi/targets',
        roles: ROLE_GROUPS.MANAGEMENT,
      },
      {
        id: 'sales-kpi-config',
        label: 'Cấu hình KPI',
        icon: Settings,
        path: '/kpi/config',
        roles: ROLE_GROUPS.ADMIN_ONLY,
        badge: 'Mới',
      },
    ],
  },

  // ============================================
  // 5. CONTRACT & LEGAL
  // ============================================
  {
    id: 'contract-legal',
    label: 'Hợp đồng & Pháp lý',
    labelEn: 'Contract & Legal',
    icon: FileText,
    path: null,
    roles: [...ROLE_GROUPS.SALES_TEAM, ROLES.LEGAL],
    description: 'Hợp đồng và pháp lý',
    children: [
      {
        id: 'contract-list',
        label: 'Danh sách HĐ',
        icon: FileText,
        path: '/contracts',
        roles: [...ROLE_GROUPS.SALES_TEAM, ROLES.LEGAL],
      },
      {
        id: 'contract-pending',
        label: 'Chờ duyệt',
        icon: FileCheck,
        path: '/contracts/pending',
        roles: [...ROLE_GROUPS.MANAGEMENT, ROLES.LEGAL],
        badge: 'Mới',
      },
      {
        id: 'legal-overview',
        label: 'Pháp lý tổng quan',
        icon: Scale,
        path: '/legal',
        roles: ROLE_GROUPS.ADMIN_ONLY,
      },
      {
        id: 'legal-contracts',
        label: 'Hợp đồng pháp lý',
        icon: FileText,
        path: '/legal/contracts',
        roles: ROLE_GROUPS.ADMIN_ONLY,
      },
      {
        id: 'legal-licenses',
        label: 'Giấy phép',
        icon: FileCheck,
        path: '/legal/licenses',
        roles: ROLE_GROUPS.ADMIN_ONLY,
      },
      {
        id: 'legal-compliance',
        label: 'Tuân thủ & Workflow HĐ',
        icon: ShieldCheck,
        path: '/legal/compliance',
        roles: ROLE_GROUPS.ADMIN_ONLY,
        badge: 'Nâng cấp',
      },
    ],
  },

  // ============================================
  // 5b. SECONDARY MARKET
  // ============================================
  {
    id: 'secondary-market',
    label: 'Thị trường thứ cấp',
    labelEn: 'Secondary Market',
    icon: Building2,
    path: null,
    roles: ROLE_GROUPS.SALES_TEAM,
    description: 'Căn thứ cấp, định giá, chuyển nhượng',
    children: [
      {
        id: 'secondary-listings',
        label: 'Căn đang rao bán',
        icon: Home,
        path: '/secondary/listings',
        roles: ROLE_GROUPS.SALES_TEAM,
        badge: 'Mới',
      },
      {
        id: 'secondary-valuation',
        label: 'Định giá AI',
        icon: BarChart3,
        path: '/secondary/valuation',
        roles: ROLE_GROUPS.SALES_TEAM,
        badge: 'Mới',
      },
      {
        id: 'secondary-deals',
        label: 'Giao dịch thứ cấp',
        icon: FileText,
        path: '/secondary/deals',
        roles: ROLE_GROUPS.SALES_TEAM,
      },
      {
        id: 'secondary-transfer',
        label: 'Chuyển nhượng',
        icon: ArrowLeftRight,
        path: '/secondary/transfer',
        roles: ROLE_GROUPS.MANAGEMENT,
      },
    ],
  },

  // ============================================
  // 5c. DEVELOPER PORTAL
  // ============================================
  {
    id: 'developer-portal',
    label: 'Cổng Chủ Đầu Tư',
    labelEn: 'Developer Portal',
    icon: Building2,
    path: null,
    roles: ROLE_GROUPS.ADMIN_ONLY,
    description: 'Dành cho Chủ Đầu Tư và Ban Giám Đốc',
    children: [
      {
        id: 'developer-overview',
        label: 'Tổng quan CĐT',
        icon: LayoutDashboard,
        path: '/developer',
        roles: ROLE_GROUPS.ADMIN_ONLY,
        badge: 'Mới',
      },
      {
        id: 'developer-approvals',
        label: 'Phê duyệt CSBH',
        icon: ShieldCheck,
        path: '/developer/portal',
        roles: ROLE_GROUPS.ADMIN_ONLY,
        badge: 'Nóng',
      },
    ],
  },

  // ============================================
  // 6. COMMISSION & FINANCE 🔥
  // ============================================
  {
    id: 'commission-finance',
    label: 'Hoa hồng & Tài chính',
    labelEn: 'Commission & Finance',
    icon: DollarSign,
    path: null,
    roles: ROLE_GROUPS.ALL,
    description: 'Tài chính, Hoa hồng, Thanh toán',
    isHot: true,
    children: [
      {
        id: 'finance-overview',
        label: 'Tổng quan',
        icon: LayoutDashboard,
        path: '/finance/overview',
        roles: ROLE_GROUPS.FINANCE_TEAM,
      },
      {
        id: 'finance-receivables',
        label: 'Khoản phải thu',
        icon: TrendingUp,
        path: '/finance/receivables',
        roles: ROLE_GROUPS.FINANCE_TEAM,
      },
      {
        id: 'finance-payouts',
        label: 'Khoản chi',
        icon: TrendingDown,
        path: '/finance/payouts',
        roles: ROLE_GROUPS.FINANCE_TEAM,
      },
      {
        id: 'finance-commissions',
        label: 'Hoa hồng',
        icon: Coins,
        path: '/finance/commissions',
        roles: [...ROLE_GROUPS.FINANCE_TEAM, ROLES.MANAGER],
      },
      {
        id: 'finance-commission-policies',
        label: 'Tỷ lệ chia',
        icon: Percent,
        path: '/finance/commission/policies',
        roles: ROLE_GROUPS.ADMIN_ONLY,
      },
      {
        id: 'finance-project-commissions',
        label: 'Cấu hình dự án',
        icon: Settings,
        path: '/finance/project-commissions',
        roles: ROLE_GROUPS.ADMIN_ONLY,
      },
      {
        id: 'finance-my-income',
        label: 'Thu nhập của tôi',
        icon: DollarSign,
        path: '/finance/my-income',
        roles: ROLE_GROUPS.ALL,
      },
      {
        id: 'payroll-dashboard',
        label: 'Tổng quan lương',
        icon: CreditCard,
        path: '/payroll',
        roles: ROLE_GROUPS.ALL,
        badge: 'Tự động',
      },
      {
        id: 'payroll-attendance',
        label: 'Chấm công',
        icon: CheckSquare,
        path: '/payroll/attendance',
        roles: ROLE_GROUPS.ALL,
      },
      {
        id: 'payroll-leave',
        label: 'Nghỉ phép',
        icon: Calendar,
        path: '/payroll/leave',
        roles: ROLE_GROUPS.ALL,
      },
      {
        id: 'payroll-my-salary',
        label: 'Lương của tôi',
        icon: DollarSign,
        path: '/payroll/salary',
        roles: ROLE_GROUPS.ALL,
      },
      {
        id: 'payroll-list',
        label: 'Bảng lương',
        icon: FileText,
        path: '/payroll/payrolls',
        roles: ROLE_GROUPS.ADMIN_ONLY,
        badge: 'Tự động',
      },
      {
        id: 'payroll-summary',
        label: 'Tổng hợp công',
        icon: BarChart3,
        path: '/payroll/summary',
        roles: ROLE_GROUPS.ADMIN_ONLY,
      },
      {
        id: 'payroll-rules',
        label: 'Cấu hình lương',
        icon: Settings,
        path: '/payroll/rules',
        roles: ROLE_GROUPS.ADMIN_ONLY,
      },
      {
        id: 'payroll-audit',
        label: 'Nhật ký kiểm tra',
        icon: History,
        path: '/payroll/audit',
        roles: ROLE_GROUPS.ADMIN_ONLY,
      },
    ],
  },

  // ============================================
  // 7. PROJECT MANAGEMENT 🔥
  // ============================================
  {
    id: 'project-management',
    label: 'Quản lý dự án',
    labelEn: 'Project Management',
    icon: FolderKanban,
    path: null,
    roles: ROLE_GROUPS.MANAGEMENT,
    description: 'Quản lý dự án BĐS',
    isHot: true,
    children: [
      {
        id: 'project-dashboard',
        label: 'Tổng quan',
        icon: LayoutDashboard,
        path: '/inventory',
        roles: ROLE_GROUPS.MANAGEMENT,
      },
      {
        id: 'project-list',
        label: 'Danh sách dự án',
        icon: Building2,
        path: '/inventory/projects',
        roles: ROLE_GROUPS.MANAGEMENT,
      },
      {
        id: 'project-phases',
        label: 'Phân kỳ & Block',
        icon: Layers,
        path: '/sales/projects',
        roles: ROLE_GROUPS.MANAGEMENT,
      },
    ],
  },

  // ============================================
  // 8. PRODUCT & INVENTORY 🔥
  // ============================================
  {
    id: 'product-inventory',
    label: 'Sản phẩm & Kho hàng',
    labelEn: 'Product & Inventory',
    icon: Package,
    path: null,
    roles: ROLE_GROUPS.MANAGEMENT,
    description: 'Sản phẩm và tồn kho',
    isHot: true,
    children: [
      {
        id: 'inventory-dashboard',
        label: 'Tổng quan',
        icon: LayoutDashboard,
        path: '/inventory',
        roles: ROLE_GROUPS.MANAGEMENT,
      },
      {
        id: 'inventory-products',
        label: 'Sản phẩm',
        icon: Home,
        path: '/inventory/products',
        roles: ROLE_GROUPS.MANAGEMENT,
      },
      {
        id: 'inventory-stock',
        label: 'Tồn kho',
        icon: Package,
        path: '/inventory/stock',
        roles: ROLE_GROUPS.MANAGEMENT,
      },
      {
        id: 'inventory-price-lists',
        label: 'Bảng giá',
        icon: DollarSign,
        path: '/inventory/price-lists',
        roles: ROLE_GROUPS.MANAGEMENT,
      },
      {
        id: 'inventory-promotions',
        label: 'Khuyến mãi',
        icon: Tag,
        path: '/inventory/promotions',
        roles: ROLE_GROUPS.MANAGEMENT,
      },
    ],
  },

  // ============================================
  // 9. AGENCY & DISTRIBUTION 🔥
  // ============================================
  {
    id: 'agency-distribution',
    label: 'Đại lý & Phân phối',
    labelEn: 'Agency & Distribution',
    icon: Store,
    path: null,
    roles: [...ROLE_GROUPS.MANAGEMENT, ROLES.AGENCY],
    description: 'Đại lý và phân phối',
    isHot: true,
    children: [
      {
        id: 'agency-dashboard',
        label: 'Tổng quan',
        icon: LayoutDashboard,
        path: '/agency',
        roles: [...ROLE_GROUPS.MANAGEMENT, ROLES.AGENCY],
      },
      {
        id: 'agency-list',
        label: 'Danh sách đại lý',
        icon: Store,
        path: '/agency/list',
        roles: ROLE_GROUPS.MANAGEMENT,
      },
      {
        id: 'agency-distribution',
        label: 'Phân phối sản phẩm',
        icon: Truck,
        path: '/agency/distribution',
        roles: ROLE_GROUPS.MANAGEMENT,
      },
      {
        id: 'agency-performance',
        label: 'Hiệu suất đại lý',
        icon: BarChart3,
        path: '/agency/performance',
        roles: ROLE_GROUPS.MANAGEMENT,
      },
      {
        id: 'agency-network',
        label: 'Cây mạng lưới',
        icon: Network,
        path: '/agency/network',
        roles: ROLE_GROUPS.MANAGEMENT,
        badge: 'Mới',
      },
      {
        id: 'agency-collaborators',
        label: 'CTV & Môi giới',
        icon: HandCoins,
        path: '/crm/collaborators',
        roles: ROLE_GROUPS.MANAGEMENT,
      },
    ],
  },

  // ============================================
  // 10. WORKFLOW & OPERATIONS
  // ============================================
  {
    id: 'workflow-operations',
    label: 'Quy trình & Vận hành',
    labelEn: 'Workflow & Operations',
    icon: CheckSquare,
    path: null,
    roles: ROLE_GROUPS.ALL,
    description: 'Công việc và vận hành',
    children: [
      {
        id: 'work-my-day',
        label: 'Ngày làm việc',
        icon: LayoutDashboard,
        path: '/work',
        roles: ROLE_GROUPS.ALL,
        badge: 'Mới',
      },
      {
        id: 'work-tasks',
        label: 'Công việc',
        icon: CheckSquare,
        path: '/work/tasks',
        roles: ROLE_GROUPS.ALL,
      },
      {
        id: 'work-manager',
        label: 'Khối lượng việc đội nhóm',
        icon: Users,
        path: '/work/manager',
        roles: ROLE_GROUPS.MANAGEMENT,
        badge: 'Mới',
      },
      {
        id: 'work-kanban',
        label: 'Kanban',
        icon: Columns,
        path: '/work/kanban',
        roles: ROLE_GROUPS.ALL,
      },
      {
        id: 'work-calendar',
        label: 'Lịch',
        icon: Calendar,
        path: '/work/calendar',
        roles: ROLE_GROUPS.ALL,
      },
      {
        id: 'work-reminders',
        label: 'Nhắc nhở',
        icon: Bell,
        path: '/work/reminders',
        roles: ROLE_GROUPS.ALL,
      },
    ],
  },

  // ============================================
  // 11. HR & RECRUITMENT
  // ============================================
  {
    id: 'hr-recruitment',
    label: 'Nhân sự & Tuyển dụng',
    labelEn: 'HR & Recruitment',
    icon: UserCog,
    path: null,
    roles: [...ROLE_GROUPS.HR_TEAM, ROLES.MANAGER],
    description: 'Nhân sự và tuyển dụng',
    children: [
      {
        id: 'hr-dashboard',
        label: 'Tổng quan',
        icon: LayoutDashboard,
        path: '/hr',
        roles: ROLE_GROUPS.HR_TEAM,
      },
      {
        id: 'hr-employees',
        label: 'Hồ sơ nhân sự',
        icon: Users,
        path: '/hr/employees',
        roles: [...ROLE_GROUPS.HR_TEAM, ROLES.MANAGER],
        badge: '360°',
      },
      {
        id: 'hr-organization',
        label: 'Cơ cấu tổ chức',
        icon: Network,
        path: '/hr/organization',
        roles: [...ROLE_GROUPS.HR_TEAM, ROLES.MANAGER],
      },
      {
        id: 'hr-positions',
        label: 'Chức danh',
        icon: Briefcase,
        path: '/hr/positions',
        roles: ROLE_GROUPS.HR_TEAM,
      },
      {
        id: 'recruitment-dashboard',
        label: 'Tuyển dụng',
        icon: UserPlus,
        path: '/recruitment',
        roles: ROLE_GROUPS.HR_TEAM,
      },
      {
        id: 'recruitment-link',
        label: 'Tạo link tuyển dụng',
        icon: Share2,
        path: '/recruitment/link',
        roles: ROLE_GROUPS.HR_TEAM,
      },
      {
        id: 'hr-contracts',
        label: 'Hợp đồng LĐ',
        icon: FileText,
        path: '/hr/contracts',
        roles: ROLE_GROUPS.HR_TEAM,
      },
    ],
  },

  // ============================================
  // 12. TRAINING & ACADEMY
  // ============================================
  {
    id: 'training-academy',
    label: 'Đào tạo & Học viện',
    labelEn: 'Training & Academy',
    icon: GraduationCap,
    path: null,
    roles: [...ROLE_GROUPS.HR_TEAM, ROLES.MANAGER, ROLES.SALES],
    description: 'Đào tạo và phát triển',
    children: [
      {
        id: 'training-dashboard',
        label: 'Tổng quan',
        icon: LayoutDashboard,
        path: '/hr/training',
        roles: [...ROLE_GROUPS.HR_TEAM, ROLES.MANAGER],
      },
      {
        id: 'training-courses',
        label: 'Khóa học',
        icon: BookOpen,
        path: '/training/courses',
        roles: [...ROLE_GROUPS.HR_TEAM, ROLES.MANAGER, ROLES.SALES],
      },
      {
        id: 'training-culture',
        label: 'Văn hóa công ty',
        icon: Award,
        path: '/hr/culture',
        roles: ROLE_GROUPS.ALL,
      },
    ],
  },

  // ============================================
  // 13. ANALYTICS & BI 🔥
  // ============================================
  {
    id: 'analytics-bi',
    label: 'Phân tích & BI',
    labelEn: 'Analytics & BI',
    icon: BarChart3,
    path: null,
    roles: ROLE_GROUPS.MANAGEMENT,
    description: 'Phân tích và báo cáo BI',
    isHot: true,
    children: [
      {
        id: 'analytics-dashboard',
        label: 'Tổng quan',
        icon: LayoutDashboard,
        path: '/analytics',
        roles: ROLE_GROUPS.MANAGEMENT,
      },
      {
        id: 'analytics-executive',
        label: 'Báo cáo điều hành',
        icon: Gauge,
        path: '/analytics/executive',
        roles: ROLE_GROUPS.MANAGEMENT,
      },
      {
        id: 'analytics-reports',
        label: 'Báo cáo',
        icon: FileText,
        path: '/analytics/reports',
        roles: ROLE_GROUPS.MANAGEMENT,
      },
      {
        id: 'analytics-business',
        label: 'Kinh doanh',
        icon: LineChart,
        path: '/analytics/business',
        roles: ROLE_GROUPS.MANAGEMENT,
      },
      {
        id: 'analytics-market',
        label: 'Thị trường',
        icon: Globe,
        path: '/analytics/market',
        roles: ROLE_GROUPS.MANAGEMENT,
      },
      {
        id: 'analytics-trends',
        label: 'Xu hướng',
        icon: TrendingUp,
        path: '/analytics/trends',
        roles: ROLE_GROUPS.MANAGEMENT,
      },
    ],
  },

  // ============================================
  // 14. SYSTEM & SECURITY 🔒
  // ============================================
  {
    id: 'system-security',
    label: 'Hệ thống & Bảo mật',
    labelEn: 'System & Security',
    icon: Shield,
    path: null,
    roles: ROLE_GROUPS.ADMIN_ONLY,
    description: 'Cài đặt hệ thống và bảo mật',
    isLocked: true,
    children: [
      {
        id: 'settings-general',
        label: 'Cài đặt chung',
        icon: Settings,
        path: '/settings',
        roles: ROLE_GROUPS.ADMIN_ONLY,
      },
      {
        id: 'settings-governance',
        label: 'Trung tâm quản trị',
        icon: LayoutDashboard,
        path: '/settings/governance',
        roles: ROLE_GROUPS.ADMIN_ONLY,
        badge: 'Cốt lõi',
      },
      {
        id: 'settings-governance-coverage',
        label: 'Độ phủ quản trị',
        icon: Eye,
        path: '/settings/governance-coverage',
        roles: ROLE_GROUPS.ADMIN_ONLY,
        badge: 'Cốt lõi',
      },
      {
        id: 'settings-governance-remediation',
        label: 'Kế hoạch chuẩn hóa',
        icon: ShieldCheck,
        path: '/settings/governance-remediation',
        roles: ROLE_GROUPS.ADMIN_ONLY,
        badge: 'Cốt lõi',
      },
      {
        id: 'settings-change-management',
        label: 'Quản lý thay đổi',
        icon: LayoutDashboard,
        path: '/settings/change-management',
        roles: ROLE_GROUPS.ADMIN_ONLY,
        badge: 'Cốt lõi',
      },
      {
        id: 'settings-blueprint',
        label: 'Bản thiết kế chuyển đổi',
        icon: Target,
        path: '/settings/blueprint',
        roles: ROLE_GROUPS.ADMIN_ONLY,
        badge: 'Khóa',
      },
      {
        id: 'settings-data-foundation',
        label: 'Nền tảng dữ liệu',
        icon: Database,
        path: '/settings/data-foundation',
        roles: ROLE_GROUPS.ADMIN_ONLY,
        badge: 'Cốt lõi',
      },
      {
        id: 'settings-status-model',
        label: 'Mô hình trạng thái',
        icon: GitBranch,
        path: '/settings/status-model',
        roles: ROLE_GROUPS.ADMIN_ONLY,
      },
      {
        id: 'settings-approval-matrix',
        label: 'Ma trận phê duyệt',
        icon: ShieldCheck,
        path: '/settings/approval-matrix',
        roles: ROLE_GROUPS.ADMIN_ONLY,
      },
      {
        id: 'settings-audit-timeline',
        label: 'Lịch sử / Nhật ký',
        icon: History,
        path: '/settings/audit-timeline',
        roles: ROLE_GROUPS.ADMIN_ONLY,
      },
      {
        id: 'settings-entity-governance',
        label: 'Liên kết thực thể',
        icon: Network,
        path: '/settings/entity-governance',
        roles: ROLE_GROUPS.ADMIN_ONLY,
      },
      {
        id: 'settings-organization',
        label: 'Cơ cấu Tổ chức',
        icon: Network,
        path: '/settings/organization',
        roles: ROLE_GROUPS.ADMIN_ONLY,
        badge: 'Mới',
      },
      {
        id: 'settings-roles',
        label: 'Vai trò & Quyền',
        icon: Shield,
        path: '/settings/roles',
        roles: ROLE_GROUPS.ADMIN_ONLY,
        badge: 'Mới',
      },
      {
        id: 'settings-dashboard-architecture',
        label: 'Cấu trúc bảng điều hành',
        icon: LayoutDashboard,
        path: '/settings/dashboard-architecture',
        roles: ROLE_GROUPS.ADMIN_ONLY,
        badge: 'Cốt lõi',
      },
      {
        id: 'settings-platform-surfaces',
        label: 'Phân bổ website quản trị / ứng dụng',
        icon: Globe,
        path: '/settings/platform-surfaces',
        roles: ROLE_GROUPS.ADMIN_ONLY,
        badge: 'Khóa',
      },
      {
        id: 'settings-platform-launch-scope',
        label: 'Khóa scope đợt 1',
        icon: Layers,
        path: '/settings/platform-launch-scope',
        roles: ROLE_GROUPS.ADMIN_ONLY,
        badge: 'Khóa',
      },
      {
        id: 'settings-platform-navigation',
        label: 'Tách điều hướng website quản trị / ứng dụng',
        icon: Columns,
        path: '/settings/platform-navigation',
        roles: ROLE_GROUPS.ADMIN_ONLY,
        badge: 'Khóa',
      },
      {
        id: 'settings-platform-screen-standards',
        label: 'Chuẩn màn hình theo nền tảng',
        icon: LayoutDashboard,
        path: '/settings/platform-screen-standards',
        roles: ROLE_GROUPS.ADMIN_ONLY,
        badge: 'Khóa',
      },
      {
        id: 'settings-platform-app-shell',
        label: 'Khóa giao diện ứng dụng',
        icon: Smartphone,
        path: '/settings/platform-app-shell',
        roles: ROLE_GROUPS.ADMIN_ONLY,
        badge: 'Khóa',
      },
      {
        id: 'settings-platform-web-shell',
        label: 'Khóa giao diện website quản trị',
        icon: Monitor,
        path: '/settings/platform-web-shell',
        roles: ROLE_GROUPS.ADMIN_ONLY,
        badge: 'Khóa',
      },
      {
        id: 'settings-platform-api-permissions',
        label: 'Khóa API và quyền truy cập',
        icon: Database,
        path: '/settings/platform-api-permissions',
        roles: ROLE_GROUPS.ADMIN_ONLY,
        badge: 'Khóa',
      },
      {
        id: 'settings-platform-field-validation',
        label: 'Kiểm thử thực địa website / ứng dụng',
        icon: ClipboardList,
        path: '/settings/platform-field-validation',
        roles: ROLE_GROUPS.ADMIN_ONLY,
        badge: 'Khóa',
      },
      {
        id: 'settings-platform-go-live-final',
        label: 'Chạy thử và vận hành chính thức',
        icon: ShieldCheck,
        path: '/settings/platform-go-live-final',
        roles: ROLE_GROUPS.ADMIN_ONLY,
        badge: 'Khóa',
      },
      {
        id: 'settings-go-live-validation',
        label: 'Kiểm thử vận hành',
        icon: ShieldCheck,
        path: '/settings/go-live-validation',
        roles: ROLE_GROUPS.ADMIN_ONLY,
        badge: 'Khóa',
      },
      {
        id: 'settings-backend-contracts',
        label: 'Hợp đồng backend',
        icon: Database,
        path: '/settings/backend-contracts',
        roles: ROLE_GROUPS.ADMIN_ONLY,
        badge: 'Khóa',
      },
      {
        id: 'settings-action-permissions',
        label: 'Quyền hành động',
        icon: Shield,
        path: '/settings/action-permissions',
        roles: ROLE_GROUPS.ADMIN_ONLY,
        badge: 'Khóa',
      },
      {
        id: 'settings-foundation-baseline',
        label: 'Dữ liệu nền go-live',
        icon: Database,
        path: '/settings/foundation-baseline',
        roles: ROLE_GROUPS.ADMIN_ONLY,
        badge: 'Khóa',
      },
      {
        id: 'settings-users',
        label: 'Người dùng',
        icon: Users,
        path: '/settings/users',
        roles: ROLE_GROUPS.ADMIN_ONLY,
        badge: 'Mới',
      },
      {
        id: 'settings-master-data',
        label: 'Dữ liệu chuẩn',
        icon: Database,
        path: '/settings/master-data',
        roles: ROLE_GROUPS.ADMIN_ONLY,
      },
      {
        id: 'settings-entity-schemas',
        label: 'Cấu trúc thực thể',
        icon: FileCode,
        path: '/settings/entity-schemas',
        roles: ROLE_GROUPS.ADMIN_ONLY,
      },
      {
        id: 'cms-dashboard',
        label: 'Tổng quan CMS',
        icon: Globe,
        path: '/cms',
        roles: ROLE_GROUPS.MARKETING_TEAM,
      },
      {
        id: 'cms-pages',
        label: 'Trang',
        icon: FileText,
        path: '/cms/pages',
        roles: ROLE_GROUPS.MARKETING_TEAM,
      },
      {
        id: 'cms-articles',
        label: 'Bài viết',
        icon: Newspaper,
        path: '/cms/articles',
        roles: ROLE_GROUPS.MARKETING_TEAM,
      },
      {
        id: 'cms-landing-pages',
        label: 'Trang đích',
        icon: Target,
        path: '/cms/landing-pages',
        roles: ROLE_GROUPS.MARKETING_TEAM,
      },
      {
        id: 'cms-public-projects',
        label: 'Dự án công khai',
        icon: Building2,
        path: '/cms/public-projects',
        roles: ROLE_GROUPS.MARKETING_TEAM,
      },
      {
        id: 'cms-testimonials',
        label: 'Đánh giá',
        icon: Quote,
        path: '/cms/testimonials',
        roles: ROLE_GROUPS.MARKETING_TEAM,
      },
      {
        id: 'cms-partners',
        label: 'Đối tác',
        icon: Layers,
        path: '/cms/partners',
        roles: ROLE_GROUPS.ADMIN_ONLY,
      },
      {
        id: 'cms-careers',
        label: 'Tuyển dụng',
        icon: Briefcase,
        path: '/cms/careers',
        roles: [...ROLE_GROUPS.ADMIN_ONLY, ROLES.HR],
      },
      {
        id: 'cms-analytics',
        label: 'Thống kê',
        icon: BarChart3,
        path: '/cms/analytics',
        roles: ROLE_GROUPS.MARKETING_TEAM,
      },
      {
        id: 'cms-video',
        label: 'Biên tập video',
        icon: Video,
        path: '/tools/video',
        roles: ROLE_GROUPS.MARKETING_TEAM,
      },
    ],
  },

  // ============================================
  // 15. CUSTOMER PORTAL 🔥
  // ============================================
  {
    id: 'customer-portal',
    label: 'Cổng khách hàng',
    labelEn: 'Customer Portal',
    icon: ExternalLink,
    path: null,
    roles: ROLE_GROUPS.ADMIN_ONLY,
    description: 'Cổng khách hàng - Website công khai',
    isHot: true,
    children: [
      {
        id: 'portal-overview',
        label: 'Tổng quan cổng khách hàng',
        icon: LayoutDashboard,
        path: '/admin/overview',
        roles: ROLE_GROUPS.ADMIN_ONLY,
      },
      {
        id: 'portal-projects',
        label: 'Dự án hiển thị',
        icon: Building2,
        path: '/admin/projects',
        roles: ROLE_GROUPS.ADMIN_ONLY,
      },
      {
        id: 'portal-news',
        label: 'Tin tức',
        icon: Newspaper,
        path: '/admin/news',
        roles: ROLE_GROUPS.MARKETING_TEAM,
      },
      {
        id: 'portal-careers',
        label: 'Tuyển dụng',
        icon: Briefcase,
        path: '/admin/careers',
        roles: [...ROLE_GROUPS.ADMIN_ONLY, ROLES.HR],
      },
      {
        id: 'portal-testimonials',
        label: 'Đánh giá KH',
        icon: Quote,
        path: '/admin/testimonials',
        roles: ROLE_GROUPS.MARKETING_TEAM,
      },
      {
        id: 'portal-partners',
        label: 'Đối tác',
        icon: Layers,
        path: '/admin/partners',
        roles: ROLE_GROUPS.ADMIN_ONLY,
      },
      {
        id: 'portal-notifications',
        label: 'Thông báo',
        icon: Bell,
        path: '/admin/notifications',
        roles: ROLE_GROUPS.ADMIN_ONLY,
      },
    ],
  },
];

// ============================================
// ROUTE REDIRECTS (Backward Compatibility)
// ============================================
export const ROUTE_REDIRECTS = {
  // Dashboard redirects
  '/dashboard/sales': '/sales',
  '/dashboard/customers': '/crm',
  '/dashboard/products': '/inventory',
  '/dashboard/hr': '/hr',
  '/dashboard/legal': '/legal',
  '/dashboard/tasks': '/work',
  '/dashboard/omnichannel': '/marketing',
  '/dashboard/data': '/analytics',
  '/dashboard/automation': '/communications/automation',
  
  // CRM redirects
  '/leads': '/crm/leads',
  '/customers': '/crm/contacts',
  '/collaborators': '/crm/collaborators',
  
  // Sales redirects
  '/sales/contracts': '/contracts',
  '/sales/kpi': '/kpi',
  '/sales/deals': '/sales/pipeline',
  
  // Work redirects
  '/tasks': '/work/tasks',
  '/tasks/kanban': '/work/kanban',
  '/calendar': '/work/calendar',
  '/reminders': '/work/reminders',
  
  // Marketing redirects
  '/channels': '/communications/channels',
  '/content-calendar': '/communications/content',
  '/response-templates': '/communications/templates',
  '/distribution-rules': '/marketing/rules',
  '/automation': '/communications/automation',
  
  // HR redirects
  '/organization': '/hr/organization',
  '/job-positions': '/hr/positions',
  '/hrm/contracts': '/hr/contracts',
  '/hrm/recruitment': '/recruitment',
  '/hrm/training': '/hr/training',
  '/hrm/messages': '/hr/messages',
  '/hrm/culture': '/hr/culture',
  
  // Analytics redirects
  '/reports': '/analytics/reports',
  '/data/analytics': '/analytics/business',
  '/data/market': '/analytics/market',
  '/data/trends': '/analytics/trends',
  '/data/management': '/analytics/data',
  
  // Tools redirects
  '/ai-assistant': '/tools/ai',
  '/admin/video-editor': '/tools/video',
  
  // CMS redirects
  '/admin/content-analytics': '/cms/analytics',
};

// ============================================
// DEFAULT DASHBOARD BY ROLE
// ============================================
export const DEFAULT_DASHBOARD = {
  // Mobile App roles → đến app shell
  [ROLES.SALES]:            '/app',
  [ROLES.AGENCY]:           '/app',
  [ROLES.MANAGER]:          '/app',
  [ROLES.BOD]:              '/app',
  [ROLES.ADMIN]:            '/app',
  [ROLES.PROJECT_DIRECTOR]: '/app',
  [ROLES.SALES_SUPPORT]:    '/app',
  [ROLES.AUDIT]:            '/app',
  // Bo phận chức năng → web admin
  [ROLES.MARKETING]: '/workspace',
  [ROLES.HR]:        '/workspace',
  [ROLES.CONTENT]:   '/workspace',
  [ROLES.LEGAL]:     '/workspace',
  [ROLES.FINANCE]:   '/workspace',
};

// ============================================
// QUICK ACTIONS BY ROLE
// ============================================
export const QUICK_ACTIONS = {
  [ROLES.BOD]: [
    { label: 'Xem báo cáo', path: '/analytics/reports', icon: BarChart3 },
    { label: 'Tài chính', path: '/finance', icon: DollarSign },
    { label: 'Phê duyệt giữ chỗ', path: '/sales/bookings?status=pending', icon: Target },
  ],
  [ROLES.ADMIN]: [
    { label: 'Cài đặt', path: '/settings', icon: Settings },
    { label: 'Quản lý người dùng', path: '/settings/users', icon: Users },
    { label: 'Kiểm tra go-live', path: '/settings/go-live-validation', icon: ClipboardList },
    { label: 'Cấu trúc bảng điều hành', path: '/settings/dashboard-architecture', icon: LayoutDashboard },
    { label: 'Phân bổ website quản trị / ứng dụng', path: '/settings/platform-surfaces', icon: Globe },
    { label: 'Khóa scope đợt 1', path: '/settings/platform-launch-scope', icon: Layers },
    { label: 'Tách điều hướng website quản trị / ứng dụng', path: '/settings/platform-navigation', icon: Columns },
    { label: 'Chuẩn màn hình theo nền tảng', path: '/settings/platform-screen-standards', icon: LayoutDashboard },
    { label: 'Khóa giao diện ứng dụng', path: '/settings/platform-app-shell', icon: Smartphone },
    { label: 'Khóa giao diện website quản trị', path: '/settings/platform-web-shell', icon: Monitor },
    { label: 'Khóa API và quyền truy cập', path: '/settings/platform-api-permissions', icon: Database },
    { label: 'Kiểm thử thực địa website / ứng dụng', path: '/settings/platform-field-validation', icon: ClipboardList },
    { label: 'Chạy thử và vận hành chính thức', path: '/settings/platform-go-live-final', icon: ShieldCheck },
    { label: 'Trang web', path: '/cms', icon: Globe },
  ],
  [ROLES.MANAGER]: [
    { label: 'Mở ứng dụng quản lý', path: '/app', icon: Smartphone },
    { label: 'Phễu giao dịch', path: '/sales/deals', icon: Target },
    { label: 'Công việc', path: '/work/tasks', icon: CheckSquare },
    { label: 'KPI đội', path: '/sales/kpi', icon: BarChart3 },
  ],
  [ROLES.SALES]: [
    { label: 'Mở ứng dụng kinh doanh', path: '/app', icon: Smartphone },
    { label: 'Thêm nguồn khách', path: '/crm/leads?new=true', icon: UserPlus },
    { label: 'Phễu giao dịch', path: '/sales/pipeline', icon: Target },
    { label: 'Công việc', path: '/work/tasks', icon: CheckSquare },
  ],
  [ROLES.MARKETING]: [
    { label: 'Mở ứng dụng marketing', path: '/app', icon: Smartphone },
    { label: 'Nội dung', path: '/marketing/content', icon: Calendar },
    { label: 'Kênh', path: '/marketing/sources', icon: Share2 },
    { label: 'Phân tích', path: '/marketing/attribution', icon: BarChart3 },
  ],
  [ROLES.FINANCE]: [
    { label: 'Chi phí chờ duyệt', path: '/finance/expenses?status=pending', icon: DollarSign },
    { label: 'Công nợ', path: '/finance/receivables', icon: CreditCard },
    { label: 'Bảng lương', path: '/payroll', icon: Briefcase },
  ],
  [ROLES.HR]: [
    { label: 'Tuyển dụng', path: '/hr/recruitment', icon: UserPlus },
    { label: 'Nhân viên', path: '/hr/employees', icon: Users },
    { label: 'Đào tạo', path: '/training', icon: GraduationCap },
    { label: 'Cơ cấu tổ chức', path: '/hr/organization', icon: Building2 },
    { label: 'Chấm công', path: '/payroll/attendance', icon: Briefcase },
  ],
  [ROLES.CONTENT]: [
    { label: 'Tin tức', path: '/cms/articles', icon: Newspaper },
    { label: 'Dự án', path: '/cms/public-projects', icon: Building2 },
    { label: 'Trang đích', path: '/cms/landing-pages', icon: Video },
  ],
  [ROLES.LEGAL]: [
    { label: 'Chờ ký', path: '/contracts/pending', icon: FileText },
    { label: 'Pháp lý dự án', path: '/legal/licenses', icon: Shield },
    { label: 'Tài liệu cho kinh doanh', path: '/legal/licenses?view=materials&status=ready', icon: BookOpen },
    { label: 'Tuân thủ', path: '/legal/compliance', icon: AlertTriangle },
  ],
  [ROLES.AGENCY]: [
    { label: 'Mở ứng dụng cộng tác viên', path: '/app', icon: Smartphone },
    { label: 'Khách của tôi', path: '/crm/leads?status=new', icon: UserPlus },
    { label: 'Giữ chỗ của tôi', path: '/sales/bookings', icon: Target },
    { label: 'Hoa hồng của tôi', path: '/finance/my-income', icon: DollarSign },
  ],
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Filter navigation items by user role
 */
export const filterNavigationByRole = (role) => {
  const filterItems = (items) => {
    return items
      .filter(item => item.roles.includes(role))
      .map(item => {
        if (item.children) {
          const filteredChildren = filterItems(item.children);
          return { ...item, children: filteredChildren.length > 0 ? filteredChildren : undefined };
        }
        return item;
      })
      .filter(item => !item.children || item.children.length > 0);
  };
  
  return filterItems(NAVIGATION);
};

/**
 * Get breadcrumb trail for a path
 */
export const getBreadcrumb = (path) => {
  const breadcrumb = [];
  
  for (const item of NAVIGATION) {
    if (item.path === path) {
      breadcrumb.push({ label: item.label, path: item.path });
      break;
    }
    
    if (item.children) {
      for (const child of item.children) {
        if (child.path === path) {
          breadcrumb.push({ label: item.label, path: item.children[0]?.path });
          breadcrumb.push({ label: child.label, path: child.path });
          break;
        }
      }
    }
  }
  
  return breadcrumb;
};

/**
 * Get redirect path if exists
 */
export const getRedirectPath = (path) => {
  return ROUTE_REDIRECTS[path] || null;
};

/**
 * Check if user has access to path
 */
export const hasAccessToPath = (path, role) => {
  for (const item of NAVIGATION) {
    if (item.path === path && item.roles.includes(role)) {
      return true;
    }
    
    if (item.children) {
      for (const child of item.children) {
        if (child.path === path && child.roles.includes(role)) {
          return true;
        }
      }
    }
  }
  
  return false;
};

/**
 * Get all navigation items flat
 */
export const getFlatNavigation = () => {
  const flatList = [];
  
  const flatten = (items, parent = null) => {
    for (const item of items) {
      flatList.push({ ...item, parent });
      if (item.children) {
        flatten(item.children, item);
      }
    }
  };
  
  flatten(NAVIGATION);
  return flatList;
};

export default NAVIGATION;
