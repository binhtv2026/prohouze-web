import { ROLES } from '@/config/navigation';
import { PLATFORM_SURFACES, PLATFORM_SURFACE_META } from '@/config/platformSurfaceStrategy';

export const PLATFORM_LAUNCH_SCOPE_PHASE_1 = {
  id: 'web_app_phase_1_locked',
  label: 'Khóa phạm vi website quản trị / ứng dụng đợt 1',
  description: 'Nguồn sự thật để chốt cụm module nào mở ngay, cụm nào chỉ nội bộ và cụm nào để pha sau.',
};

export const PLATFORM_LAUNCH_STATUS = {
  GO_LIVE: 'go_live',
  INTERNAL_ONLY: 'internal_only',
  LATER_PHASE: 'later_phase',
};

export const PLATFORM_LAUNCH_STATUS_META = {
  [PLATFORM_LAUNCH_STATUS.GO_LIVE]: {
    key: PLATFORM_LAUNCH_STATUS.GO_LIVE,
    label: 'Mở đợt 1',
    description: 'Được phép triển khai chính thức ngay trong pha đầu.',
    badgeClassName: 'bg-emerald-100 text-emerald-700 border-0',
  },
  [PLATFORM_LAUNCH_STATUS.INTERNAL_ONLY]: {
    key: PLATFORM_LAUNCH_STATUS.INTERNAL_ONLY,
    label: 'Chỉ nội bộ',
    description: 'Dùng cho đội vận hành hoặc admin, chưa mở như sản phẩm chính thức.',
    badgeClassName: 'bg-amber-100 text-amber-700 border-0',
  },
  [PLATFORM_LAUNCH_STATUS.LATER_PHASE]: {
    key: PLATFORM_LAUNCH_STATUS.LATER_PHASE,
    label: 'Pha sau',
    description: 'Không mở trong đợt 1, để dành cho giai đoạn tiếp theo.',
    badgeClassName: 'bg-slate-100 text-slate-700 border-0',
  },
};

export const PLATFORM_PHASE_1_SCOPE_MODULES = [
  {
    id: 'sales_app_core',
    label: 'Ứng dụng kinh doanh',
    surface: PLATFORM_SURFACES.APP,
    launchStatus: PLATFORM_LAUNCH_STATUS.GO_LIVE,
    owner: 'Kinh doanh',
    roles: [ROLES.SALES],
    modules: ['Bảng chính trong ngày', 'Khách hàng', 'Sản phẩm', 'Bán hàng', 'Kênh bán hàng', 'Tài chính của tôi', 'Đội nhóm của tôi'],
    why: 'Đây là mặt trận kiếm tiền trực tiếp, phải mở ngay trên ứng dụng.',
  },
  {
    id: 'agency_app_core',
    label: 'Ứng dụng cộng tác viên / đại lý',
    surface: PLATFORM_SURFACES.APP,
    launchStatus: PLATFORM_LAUNCH_STATUS.GO_LIVE,
    owner: 'Phân phối',
    roles: [ROLES.AGENCY],
    modules: ['Khách của tôi', 'Giữ chỗ của tôi', 'Hoa hồng của tôi', 'Tài liệu bán hàng'],
    why: 'Lực lượng ngoài hiện trường cần ứng dụng gọn, nhanh và bám đúng giao dịch của mình.',
  },
  {
    id: 'manager_hybrid_workspace',
    label: 'Bảng làm việc quản lý đa nền tảng',
    surface: PLATFORM_SURFACES.HYBRID,
    launchStatus: PLATFORM_LAUNCH_STATUS.GO_LIVE,
    owner: 'Quản lý kinh doanh',
    roles: [ROLES.MANAGER],
    modules: ['KPI đội', 'Khách nóng', 'Giữ chỗ chờ xử lý', 'Top kinh doanh', 'Khối lượng công việc', 'Duyệt nhanh'],
    why: 'Quản lý cần cả website quản trị để soi sâu và ứng dụng để phản ứng nhanh khi ở ngoài hiện trường.',
  },
  {
    id: 'bod_hybrid_workspace',
    label: 'Bảng làm việc lãnh đạo đa nền tảng',
    surface: PLATFORM_SURFACES.HYBRID,
    launchStatus: PLATFORM_LAUNCH_STATUS.GO_LIVE,
    owner: 'Điều hành cấp cao',
    roles: [ROLES.BOD],
    modules: ['Bảng điều hành lãnh đạo', 'Cảnh báo', 'Phê duyệt', 'Doanh thu', 'Dòng tiền', 'Rủi ro'],
    why: 'Lãnh đạo cần website quản trị để điều hành sâu và ứng dụng để duyệt nhanh, nhận cảnh báo nóng.',
  },
  {
    id: 'marketing_hybrid_workspace',
    label: 'Bảng làm việc marketing đa nền tảng',
    surface: PLATFORM_SURFACES.HYBRID,
    launchStatus: PLATFORM_LAUNCH_STATUS.GO_LIVE,
    owner: 'Marketing',
    roles: [ROLES.MARKETING],
    modules: ['Chiến dịch', 'Nguồn khách', 'Theo dõi', 'Ghi nhận nguồn', 'Nội dung', 'Biểu mẫu', 'Theo dõi nhanh trên ứng dụng'],
    why: 'Marketing vận hành trên website quản trị nhưng vẫn cần ứng dụng để theo dõi nhanh chiến dịch và khách mới.',
  },
  {
    id: 'admin_web_core',
    label: 'Trang quản trị hệ thống',
    surface: PLATFORM_SURFACES.WEB,
    launchStatus: PLATFORM_LAUNCH_STATUS.GO_LIVE,
    owner: 'Admin / Hệ thống',
    roles: [ROLES.ADMIN],
    modules: ['Người dùng', 'Vai trò & quyền', 'Quy trình', 'Dữ liệu nền', 'Kiểm soát vận hành', 'Trang web & nội dung'],
    why: 'Toàn bộ quản trị sâu và kiểm soát hệ thống phải nằm trên website quản trị.',
  },
  {
    id: 'finance_web_core',
    label: 'Trang quản trị tài chính',
    surface: PLATFORM_SURFACES.WEB,
    launchStatus: PLATFORM_LAUNCH_STATUS.GO_LIVE,
    owner: 'Tài chính',
    roles: [ROLES.FINANCE],
    modules: ['Doanh thu', 'Chi phí', 'Công nợ', 'Hoa hồng', 'Bảng lương', 'Dự báo', 'Thuế'],
    why: 'Các tác vụ tài chính cần màn hình lớn, dữ liệu nhiều cột và quy trình kiểm soát chặt.',
  },
  {
    id: 'hr_web_core',
    label: 'Trang quản trị nhân sự',
    surface: PLATFORM_SURFACES.WEB,
    launchStatus: PLATFORM_LAUNCH_STATUS.GO_LIVE,
    owner: 'Nhân sự',
    roles: [ROLES.HR],
    modules: ['Tuyển dụng', 'Nhân sự', 'Tiếp nhận nhân sự mới', 'Đào tạo', 'Chấm công', 'Hỗ trợ bảng lương'],
    why: 'Nhân sự cần website quản trị để xử lý hồ sơ, tuyển dụng, đào tạo và bảng nhiều cột.',
  },
  {
    id: 'legal_web_core',
    label: 'Trang quản trị pháp lý',
    surface: PLATFORM_SURFACES.WEB,
    launchStatus: PLATFORM_LAUNCH_STATUS.GO_LIVE,
    owner: 'Pháp lý',
    roles: [ROLES.LEGAL],
    modules: ['Hợp đồng', 'Pháp lý dự án', 'Tuân thủ', 'Quy định', 'Phê duyệt pháp lý'],
    why: 'Pháp lý là back office chuyên sâu, không phù hợp ưu tiên ứng dụng.',
  },
  {
    id: 'cms_web_core',
    label: 'Trang quản trị nội dung',
    surface: PLATFORM_SURFACES.WEB,
    launchStatus: PLATFORM_LAUNCH_STATUS.GO_LIVE,
    owner: 'Trang web & nội dung',
    roles: [ROLES.CONTENT],
    modules: ['Trang', 'Bài viết', 'Trang đích', 'Dự án công khai', 'Tối ưu tìm kiếm', 'Phân tích nội dung'],
    why: 'Trang web và hệ quản trị nội dung là cụm quản trị nội dung, xuất bản và tối ưu nên giữ trên website quản trị.',
  },
  {
    id: 'inventory_internal',
    label: 'Kho hàng / giá nội bộ',
    surface: PLATFORM_SURFACES.WEB,
    launchStatus: PLATFORM_LAUNCH_STATUS.INTERNAL_ONLY,
    owner: 'Vận hành sản phẩm',
    roles: [ROLES.ADMIN, ROLES.MANAGER],
    modules: ['Kho hàng', 'Giá nội bộ', 'Ghép sản phẩm', 'Bàn giao'],
    why: 'Cần tiếp tục chuẩn hóa trước khi mở rộng thành module chính thức cho đợt 1.',
  },
  {
    id: 'automation_internal',
    label: 'Tự động hóa / thư điện tử nội bộ',
    surface: PLATFORM_SURFACES.WEB,
    launchStatus: PLATFORM_LAUNCH_STATUS.INTERNAL_ONLY,
    owner: 'Admin / Vận hành marketing',
    roles: [ROLES.ADMIN, ROLES.MARKETING],
    modules: ['Bảng điều hành tự động hóa', 'Tác vụ thư điện tử', 'Chiến dịch thư điện tử', 'Quy tắc nội bộ'],
    why: 'Đây là lớp vận hành hỗ trợ, chưa nên mở thành mặt trận chính cho go-live đợt 1.',
  },
  {
    id: 'advanced_bi_later',
    label: 'Phân tích nâng cao',
    surface: PLATFORM_SURFACES.WEB,
    launchStatus: PLATFORM_LAUNCH_STATUS.LATER_PHASE,
    owner: 'Điều hành / BI',
    roles: [ROLES.BOD, ROLES.ADMIN],
    modules: ['Phân tích nâng cao', 'Bảng điều hành đa chiều', 'Đối chiếu chuẩn', 'Phân tích dự báo'],
    why: 'Để pha sau khi dữ liệu nền và KPI đã thật sự ổn định.',
  },
  {
    id: 'customer_portal_later',
    label: 'Cổng khách hàng / ứng dụng khách hàng',
    surface: PLATFORM_SURFACES.APP,
    launchStatus: PLATFORM_LAUNCH_STATUS.LATER_PHASE,
    owner: 'Sản phẩm / Marketing',
    roles: [],
    modules: ['Cổng khách hàng', 'Tự phục vụ', 'Theo dõi dành cho khách'],
    why: 'Không ưu tiên cho đợt 1 vì chưa phục vụ trực tiếp BO và lực lượng bán.',
  },
];

export function getPlatformPhaseOneScopeModules() {
  return PLATFORM_PHASE_1_SCOPE_MODULES;
}

export function getPlatformPhaseOneScopeSummary() {
  const items = PLATFORM_PHASE_1_SCOPE_MODULES;
  const countByStatus = (status) => items.filter((item) => item.launchStatus === status).length;
  const countBySurface = (surface) => items.filter((item) => item.surface === surface).length;

  return {
    totalClusters: items.length,
    goLiveClusters: countByStatus(PLATFORM_LAUNCH_STATUS.GO_LIVE),
    internalClusters: countByStatus(PLATFORM_LAUNCH_STATUS.INTERNAL_ONLY),
    laterPhaseClusters: countByStatus(PLATFORM_LAUNCH_STATUS.LATER_PHASE),
    webClusters: countBySurface(PLATFORM_SURFACES.WEB),
    appClusters: countBySurface(PLATFORM_SURFACES.APP),
    hybridClusters: countBySurface(PLATFORM_SURFACES.HYBRID),
  };
}

export function getPlatformPhaseOneScopeByStatus(status) {
  return PLATFORM_PHASE_1_SCOPE_MODULES.filter((item) => item.launchStatus === status);
}

export function getPlatformPhaseOneScopeBySurface(surface) {
  return PLATFORM_PHASE_1_SCOPE_MODULES.filter((item) => item.surface === surface);
}

export function getPlatformPhaseOneRoleCoverage() {
  return PLATFORM_PHASE_1_SCOPE_MODULES.reduce((acc, item) => {
    item.roles.forEach((role) => {
      if (!acc[role]) {
        acc[role] = [];
      }
      acc[role].push(item);
    });
    return acc;
  }, {});
}

export function getPlatformPhaseOneReadableSurface(surface) {
  return PLATFORM_SURFACE_META[surface] || null;
}

export function getPlatformPhaseOneReadableStatus(status) {
  return PLATFORM_LAUNCH_STATUS_META[status] || null;
}
