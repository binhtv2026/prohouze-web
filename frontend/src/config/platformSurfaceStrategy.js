import { ROLES } from '@/config/navigation';

export const PLATFORM_SURFACES = {
  WEB: 'web',
  APP: 'app',
  HYBRID: 'hybrid',
};

export const PLATFORM_SURFACE_META = {
  [PLATFORM_SURFACES.WEB]: {
    key: PLATFORM_SURFACES.WEB,
    label: 'Web quản trị',
    shortLabel: 'Web',
    description: 'Dành cho điều hành, back office, quản trị sâu, báo cáo và cấu hình.',
    badgeClassName: 'bg-sky-100 text-sky-700 border-0',
  },
  [PLATFORM_SURFACES.APP]: {
    key: PLATFORM_SURFACES.APP,
    label: 'App hiện trường',
    shortLabel: 'App',
    description: 'Dành cho lực lượng tuyến đầu, xử lý công việc nhanh, di động, chốt khách và theo ngày.',
    badgeClassName: 'bg-emerald-100 text-emerald-700 border-0',
  },
  [PLATFORM_SURFACES.HYBRID]: {
    key: PLATFORM_SURFACES.HYBRID,
    label: 'Hybrid',
    shortLabel: 'Hybrid',
    description: 'Dùng cả web và app: web để phân tích/sâu, app để duyệt nhanh/cảnh báo/điều hành ngắn.',
    badgeClassName: 'bg-amber-100 text-amber-700 border-0',
  },
};

export const ROLE_PLATFORM_ALLOCATION = {
  [ROLES.ADMIN]: {
    role: ROLES.ADMIN,
    ten: 'Quản trị hệ thống',
    boPhan: 'Admin / Hệ thống',
    primarySurface: PLATFORM_SURFACES.WEB,
    secondarySurface: null,
    useCase: 'Quản trị người dùng, quyền, cấu hình, quy trình, go-live, audit, data foundation.',
    webCore: ['Người dùng', 'Vai trò & quyền', 'Workflow', 'Dữ liệu nền', 'CMS / Website', 'Go-live control'],
    appCore: [],
    deploymentDecision: 'Web only',
  },
  [ROLES.BOD]: {
    role: ROLES.BOD,
    ten: 'Lãnh đạo / BOD',
    boPhan: 'Điều hành cấp cao',
    primarySurface: PLATFORM_SURFACES.HYBRID,
    secondarySurface: PLATFORM_SURFACES.WEB,
    useCase: 'Web để điều hành sâu, app để xem nhanh cảnh báo, doanh thu, duyệt và quyết định tức thời.',
    webCore: ['Điều hành tổng', 'Tài chính doanh nghiệp', 'Báo cáo chiến lược', 'Phê duyệt', 'Rủi ro'],
    appCore: ['Cảnh báo nóng', 'Phê duyệt nhanh', 'Doanh thu / ngày', 'Top team'],
    deploymentDecision: 'Hybrid',
  },
  [ROLES.MANAGER]: {
    role: ROLES.MANAGER,
    ten: 'Quản lý',
    boPhan: 'Quản lý kinh doanh / vận hành đội',
    primarySurface: PLATFORM_SURFACES.HYBRID,
    secondarySurface: PLATFORM_SURFACES.APP,
    useCase: 'Web để xem đội sâu và giao chỉ tiêu, app để theo lead nóng, booking, phê duyệt nhanh khi đi ngoài.',
    webCore: ['KPI đội', 'Workload', 'Báo cáo đội', 'Phân tích phễu', 'Điều phối team'],
    appCore: ['Lead nóng', 'Booking cần xử lý', 'Top sales', 'Việc quá hạn', 'Duyệt nhanh'],
    deploymentDecision: 'Hybrid',
  },
  [ROLES.SALES]: {
    role: ROLES.SALES,
    ten: 'Nhân viên kinh doanh',
    boPhan: 'Kinh doanh',
    primarySurface: PLATFORM_SURFACES.APP,
    secondarySurface: PLATFORM_SURFACES.WEB,
    useCase: 'App là mặt trận chính để làm việc trong ngày, chăm khách, dẫn khách, chốt giao dịch và xem hoa hồng.',
    webCore: ['Xem sâu lịch sử / hồ sơ nếu cần'],
    appCore: ['Dashboard ngày', 'Khách hàng', 'Sản phẩm', 'Bán hàng', 'Kênh bán hàng', 'Tài chính của tôi', 'My Team'],
    deploymentDecision: 'App first',
  },
  [ROLES.MARKETING]: {
    role: ROLES.MARKETING,
    ten: 'Nhân viên marketing',
    boPhan: 'Marketing',
    primarySurface: PLATFORM_SURFACES.HYBRID,
    secondarySurface: PLATFORM_SURFACES.WEB,
    useCase: 'Web để setup chiến dịch, tracking, content, attribution; app để theo lead/kênh/campaign khi cần theo dõi nhanh.',
    webCore: ['Campaign setup', 'Nguồn lead', 'Tracking', 'Attribution', 'Nội dung', 'Form / CTA'],
    appCore: ['Theo dõi chiến dịch', 'Lead theo kênh', 'Cảnh báo hiệu suất'],
    deploymentDecision: 'Hybrid',
  },
  [ROLES.FINANCE]: {
    role: ROLES.FINANCE,
    ten: 'Nhân viên tài chính',
    boPhan: 'Tài chính',
    primarySurface: PLATFORM_SURFACES.WEB,
    secondarySurface: null,
    useCase: 'Cần màn hình lớn, bảng nhiều cột, đối soát, công nợ, lương, hoa hồng và kiểm soát dòng tiền.',
    webCore: ['Doanh thu', 'Thu chi', 'Công nợ', 'Hoa hồng', 'Bảng lương', 'Thuế', 'Forecast'],
    appCore: [],
    deploymentDecision: 'Web only',
  },
  [ROLES.HR]: {
    role: ROLES.HR,
    ten: 'Nhân viên nhân sự',
    boPhan: 'HR',
    primarySurface: PLATFORM_SURFACES.WEB,
    secondarySurface: null,
    useCase: 'Cần quản lý hồ sơ, tuyển dụng, onboarding, đào tạo, chấm công và payroll trên web.',
    webCore: ['Tuyển dụng', 'Nhân sự', 'Hồ sơ', 'Đào tạo', 'Chấm công', 'Payroll'],
    appCore: [],
    deploymentDecision: 'Web only',
  },
  [ROLES.LEGAL]: {
    role: ROLES.LEGAL,
    ten: 'Nhân viên pháp lý',
    boPhan: 'Pháp lý',
    primarySurface: PLATFORM_SURFACES.WEB,
    secondarySurface: null,
    useCase: 'Cần quản lý hợp đồng, hồ sơ pháp lý dự án, biểu mẫu và checklist tuân thủ trên web.',
    webCore: ['Hợp đồng', 'Pháp lý dự án', 'Phê duyệt', 'Compliance', 'Regulations'],
    appCore: [],
    deploymentDecision: 'Web only',
  },
  [ROLES.CONTENT]: {
    role: ROLES.CONTENT,
    ten: 'Nhân viên website / CMS',
    boPhan: 'Website / CMS',
    primarySurface: PLATFORM_SURFACES.WEB,
    secondarySurface: null,
    useCase: 'Quản trị trang, bài viết, landing page, CTA, SEO và xuất bản nội dung trên web.',
    webCore: ['Pages', 'Articles', 'Landing Pages', 'Public Projects', 'SEO', 'Analytics nội dung'],
    appCore: [],
    deploymentDecision: 'Web only',
  },
  [ROLES.AGENCY]: {
    role: ROLES.AGENCY,
    ten: 'Cộng tác viên / Đại lý Giới thiệu',
    boPhan: 'Lực lượng ngoài',
    primarySurface: PLATFORM_SURFACES.APP,
    secondarySurface: null,
    useCase: 'App để giới thiệu khách mua sơ cấp, theo booking của mình và xem hoa hồng giới thiệu.',
    webCore: [],
    appCore: ['Khách giới thiệu', 'Booking của tôi', 'Hoa hồng của tôi', 'Tài liệu dự án'],
    deploymentDecision: 'App first',
  },
  [ROLES.PROJECT_DIRECTOR]: {
    role: ROLES.PROJECT_DIRECTOR,
    ten: 'Giám đốc Dự án',
    boPhan: 'Kinh doanh / Quản lý dự án',
    primarySurface: PLATFORM_SURFACES.HYBRID,
    secondarySurface: PLATFORM_SURFACES.APP,
    useCase: 'App để duyệt booking, quản lý đội sales và cập nhật tiến độ; web để phân tích sâu theo dự án.',
    webCore: ['KPI dự án', 'Phân tích phễu', 'Báo cáo chủ ĐT', 'Sản phẩm / giỏ hàng'],
    appCore: ['Duyệt booking nhanh', 'KPI đội', 'Xếp hạng sales', 'Cảnh báo dự án'],
    deploymentDecision: 'Hybrid (App primary for field)',
  },
  [ROLES.SALES_SUPPORT]: {
    role: ROLES.SALES_SUPPORT,
    ten: 'Hỗ trợ Nghiệp vụ (Sales Admin + CSKH)',
    boPhan: 'Vận hành kinh doanh',
    primarySurface: PLATFORM_SURFACES.APP,
    secondarySurface: PLATFORM_SURFACES.WEB,
    useCase: 'App để xử lý nhanh hồ sơ booking, theo dõi CSKH; web để tra cứu hồ sơ sâu.',
    webCore: ['Hồ sơ, hợp đồng', 'Công nợ thanh toán'],
    appCore: ['Hồ sơ booking', 'Task list ngày', 'Khách hàng CSKH', 'Upload tài liệu'],
    deploymentDecision: 'App first',
  },
  [ROLES.AUDIT]: {
    role: ROLES.AUDIT,
    ten: 'Ban Kiểm soát / HĐQT',
    boPhan: 'Quản trị công ty',
    primarySurface: PLATFORM_SURFACES.HYBRID,
    secondarySurface: PLATFORM_SURFACES.WEB,
    useCase: 'Read-only toàn hệ thống. App để xem nhanh cảnh báo và báo cáo tóm tắt; web để đọc báo cáo đầy đủ.',
    webCore: ['Báo cáo tài chính đầy đủ', 'Hồ sơ nhân sự', 'Audit log chi tiết'],
    appCore: ['Cảnh báo bất thường', 'Tóm tắt tháng', 'Phê duyệt biên bản HĐQT'],
    deploymentDecision: 'Hybrid (read-only)',
  },
};

export const DEPARTMENT_PLATFORM_ALLOCATION = [
  {
    id: 'bo_dieu_hanh',
    label: 'BOD / Điều hành cấp cao',
    surface: PLATFORM_SURFACES.HYBRID,
    reason: 'Web để xem sâu và điều hành, app để duyệt nhanh và nhận cảnh báo nóng.',
    includedRoles: [ROLES.BOD],
  },
  {
    id: 'admin_backoffice',
    label: 'Admin / Back Office',
    surface: PLATFORM_SURFACES.WEB,
    reason: 'Quản trị hệ thống, dữ liệu nền, quyền, cấu hình và CMS cần web.',
    includedRoles: [ROLES.ADMIN, ROLES.FINANCE, ROLES.HR, ROLES.LEGAL, ROLES.CONTENT],
  },
  {
    id: 'kinh_doanh_hien_truong',
    label: 'Kinh doanh hiện trường',
    surface: PLATFORM_SURFACES.APP,
    reason: 'Cần tốc độ, thao tác nhanh, di động, theo khách, theo lịch và theo giao dịch.',
    includedRoles: [ROLES.SALES, ROLES.AGENCY],
  },
  {
    id: 'quan_ly_kinh_doanh',
    label: 'Quản lý kinh doanh',
    surface: PLATFORM_SURFACES.HYBRID,
    reason: 'Web để xem sâu KPI đội, app để bám lead nóng và duyệt nhanh.',
    includedRoles: [ROLES.MANAGER],
  },
  {
    id: 'marketing_hybrid',
    label: 'Marketing',
    surface: PLATFORM_SURFACES.HYBRID,
    reason: 'Web để setup, app để theo dõi nhanh hiệu quả và lead.',
    includedRoles: [ROLES.MARKETING],
  },
];

export const MODULE_PLATFORM_ALLOCATION = [
  {
    id: 'sales_field_stack',
    label: 'Kinh doanh tuyến đầu',
    surface: PLATFORM_SURFACES.APP,
    modules: ['Tổng quan ngày', 'Khách hàng', 'Sản phẩm', 'Bán hàng', 'Kênh bán hàng', 'Tài chính cá nhân', 'My Team'],
    why: 'Đây là bộ công cụ kiếm tiền trực tiếp, phải tối ưu cho di động và nhịp bán hàng trong ngày.',
  },
  {
    id: 'manager_field_control',
    label: 'Điều hành đội ngoài hiện trường',
    surface: PLATFORM_SURFACES.HYBRID,
    modules: ['Lead nóng', 'Top sales', 'Booking cần duyệt', 'KPI đội', 'Cảnh báo đội'],
    why: 'Manager cần app để phản ứng nhanh, web để soi sâu.',
  },
  {
    id: 'executive_control',
    label: 'Điều hành lãnh đạo',
    surface: PLATFORM_SURFACES.HYBRID,
    modules: ['Executive workspace', 'Cảnh báo', 'Phê duyệt', 'Doanh thu', 'Dòng tiền', 'Rủi ro'],
    why: 'Lãnh đạo dùng cả hai mặt trận nhưng web vẫn là nơi ra quyết định sâu.',
  },
  {
    id: 'marketing_operations',
    label: 'Marketing vận hành',
    surface: PLATFORM_SURFACES.WEB,
    modules: ['Campaigns', 'Sources', 'Content', 'Tracking', 'Attribution', 'Forms'],
    why: 'Các nghiệp vụ marketing cần bảng, lọc, setup và phân tích nhiều cột.',
  },
  {
    id: 'finance_backoffice',
    label: 'Tài chính',
    surface: PLATFORM_SURFACES.WEB,
    modules: ['Revenue', 'Expense', 'Debt', 'Commission engine', 'Payroll', 'Forecast', 'Tax'],
    why: 'Không phù hợp triển khai app-first vì dữ liệu phức tạp và cần độ chính xác cao.',
  },
  {
    id: 'hr_legal_web',
    label: 'HR / Legal',
    surface: PLATFORM_SURFACES.WEB,
    modules: ['Recruitment', 'Employees', 'Training', 'Contracts', 'Compliance', 'Legal docs'],
    why: 'Cần bảng nhiều cột, biểu mẫu, phê duyệt và hồ sơ chi tiết trên web.',
  },
  {
    id: 'cms_website_web',
    label: 'Website / CMS',
    surface: PLATFORM_SURFACES.WEB,
    modules: ['Pages', 'Articles', 'Landing pages', 'Public projects', 'SEO', 'Content analytics'],
    why: 'Quản trị website là back office, không nên đẩy sang app.',
  },
];

export const PLATFORM_ROLLOUT_PRIORITIES = {
  web: [
    'Admin / System',
    'BOD workspace',
    'Manager workspace',
    'Marketing operations',
    'Finance',
    'HR',
    'Legal',
    'CMS / Website',
  ],
  app: [
    'Sales app',
    'Agency / CTV app',
    'Manager app',
    'BOD quick app',
    'Marketing quick monitor app',
  ],
};

export function getRolePlatformMatrix() {
  return Object.values(ROLE_PLATFORM_ALLOCATION);
}

export function getDepartmentPlatformMatrix() {
  return DEPARTMENT_PLATFORM_ALLOCATION;
}

export function getModulePlatformMatrix() {
  return MODULE_PLATFORM_ALLOCATION;
}

export function getPlatformSurfaceSummary() {
  const roles = Object.values(ROLE_PLATFORM_ALLOCATION);
  const summary = {
    totalRoles: roles.length,
    webOnlyRoles: roles.filter((item) => item.primarySurface === PLATFORM_SURFACES.WEB).length,
    appFirstRoles: roles.filter((item) => item.primarySurface === PLATFORM_SURFACES.APP).length,
    hybridRoles: roles.filter((item) => item.primarySurface === PLATFORM_SURFACES.HYBRID).length,
  };

  return {
    ...summary,
    totalDepartments: DEPARTMENT_PLATFORM_ALLOCATION.length,
    totalModuleClusters: MODULE_PLATFORM_ALLOCATION.length,
  };
}

export function getRoleSurfaceStrategy(role) {
  return ROLE_PLATFORM_ALLOCATION[role] || null;
}
