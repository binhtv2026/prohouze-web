import { ROLES } from '@/config/navigation';

export const PLATFORM_APP_SHELL_PHASE_4 = {
  id: 'platform_app_shell_phase_4_locked',
  label: 'Khóa giao diện ứng dụng chuẩn',
  description: 'Chốt màn chính ứng dụng, điều hướng đáy, thao tác nhanh, thông báo và khay duyệt nhanh cho các vai trò dùng ứng dụng.',
};

export const APP_SHELL_BLOCKS = {
  HOME: 'home',
  BOTTOM_NAV: 'bottom_nav',
  QUICK_ACTIONS: 'quick_actions',
  NOTIFICATIONS: 'notifications',
  APPROVAL_TRAY: 'approval_tray',
  PROFILE: 'profile',
};

export const APP_SHELL_BLOCK_META = {
  [APP_SHELL_BLOCKS.HOME]: {
    key: APP_SHELL_BLOCKS.HOME,
    label: 'Màn chính ứng dụng',
    description: 'Màn mở ứng dụng đầu tiên, phải trả lời ngay hôm nay làm gì và mở nhanh vào đâu.',
    badgeClassName: 'bg-sky-100 text-sky-700 border-0',
  },
  [APP_SHELL_BLOCKS.BOTTOM_NAV]: {
    key: APP_SHELL_BLOCKS.BOTTOM_NAV,
    label: 'Điều hướng đáy',
    description: 'Thanh điều hướng đáy, chỉ giữ 4-5 tab sống còn.',
    badgeClassName: 'bg-indigo-100 text-indigo-700 border-0',
  },
  [APP_SHELL_BLOCKS.QUICK_ACTIONS]: {
    key: APP_SHELL_BLOCKS.QUICK_ACTIONS,
    label: 'Thao tác nhanh',
    description: 'Các thao tác trong ngày: gọi, theo bám, tạo lịch, đẩy giữ chỗ, gửi tài liệu.',
    badgeClassName: 'bg-emerald-100 text-emerald-700 border-0',
  },
  [APP_SHELL_BLOCKS.NOTIFICATIONS]: {
    key: APP_SHELL_BLOCKS.NOTIFICATIONS,
    label: 'Thông báo',
    description: 'Cảnh báo nóng, việc quá hạn, khách nóng, khách cần xử lý ngay.',
    badgeClassName: 'bg-amber-100 text-amber-700 border-0',
  },
  [APP_SHELL_BLOCKS.APPROVAL_TRAY]: {
    key: APP_SHELL_BLOCKS.APPROVAL_TRAY,
    label: 'Khay phê duyệt nhanh',
    description: 'Chỉ dành cho quản lý, lãnh đạo hoặc vai trò cần duyệt trên ứng dụng.',
    badgeClassName: 'bg-rose-100 text-rose-700 border-0',
  },
  [APP_SHELL_BLOCKS.PROFILE]: {
    key: APP_SHELL_BLOCKS.PROFILE,
    label: 'Hồ sơ / KPI / thu nhập',
    description: 'Điểm vào hồ sơ cá nhân, KPI, hoa hồng, quyền lợi, lộ trình của tôi.',
    badgeClassName: 'bg-slate-100 text-slate-700 border-0',
  },
};

export const ROLE_APP_SHELL_STANDARD = {
  [ROLES.SALES]: {
    role: ROLES.SALES,
    title: 'Ứng dụng kinh doanh',
    appFirst: true,
    homeRoute: '/app',
    bottomNav: ['Tổng quan', 'Khách hàng', 'Bán hàng', 'Sản phẩm', 'Tài chính'],
    quickActions: ['Gọi khách', 'Tạo lịch hẹn', 'Cập nhật giao dịch', 'Gửi tài liệu dự án', 'Xem hoa hồng'],
    notifications: ['Khách nóng', 'Lịch hẹn hôm nay', 'Việc quá hạn', 'Chính sách nóng / thưởng nóng'],
    approvalTray: [],
    profile: ['KPI của tôi', 'Hoa hồng của tôi', 'Lộ trình thăng tiến', 'Đội nhóm của tôi'],
    mustHave: [APP_SHELL_BLOCKS.HOME, APP_SHELL_BLOCKS.BOTTOM_NAV, APP_SHELL_BLOCKS.QUICK_ACTIONS, APP_SHELL_BLOCKS.NOTIFICATIONS, APP_SHELL_BLOCKS.PROFILE],
    why: 'Nhân viên kinh doanh là lực lượng kiếm tiền trực tiếp, ứng dụng phải là công cụ làm việc trong ngày chứ không phải bản sao của website quản trị.',
  },
  [ROLES.AGENCY]: {
    role: ROLES.AGENCY,
    title: 'Ứng dụng cộng tác viên / đại lý',
    appFirst: true,
    homeRoute: '/app',
    bottomNav: ['Tổng quan', 'Khách hàng', 'Bán hàng', 'Tài chính', 'Tài liệu'],
    quickActions: ['Gọi khách', 'Gửi bảng giá', 'Gửi pháp lý', 'Xem giữ chỗ', 'Xem hoa hồng'],
    notifications: ['Khách mới', 'Giữ chỗ cần theo', 'Tài liệu mới', 'Hoa hồng cập nhật'],
    approvalTray: [],
    profile: ['Hoa hồng của tôi', 'Khách của tôi', 'Tài liệu bán hàng'],
    mustHave: [APP_SHELL_BLOCKS.HOME, APP_SHELL_BLOCKS.BOTTOM_NAV, APP_SHELL_BLOCKS.QUICK_ACTIONS, APP_SHELL_BLOCKS.NOTIFICATIONS, APP_SHELL_BLOCKS.PROFILE],
    why: 'Cộng tác viên cần ứng dụng rút gọn, chỉ giữ phần trực tiếp giúp họ gửi khách, theo giữ chỗ và xem tiền.',
  },
  [ROLES.MANAGER]: {
    role: ROLES.MANAGER,
    title: 'Ứng dụng quản lý',
    appFirst: false,
    homeRoute: '/app',
    bottomNav: ['Điều hành', 'Khách nóng', 'Giữ chỗ', 'Đội nhóm', 'Duyệt nhanh'],
    quickActions: ['Gọi nhân viên kinh doanh', 'Xem việc quá hạn', 'Đẩy giữ chỗ', 'Xem KPI đội'],
    notifications: ['Khách nóng chưa xử lý', 'Giữ chỗ cần duyệt', 'Việc quá hạn của đội', 'Top kinh doanh thay đổi'],
    approvalTray: ['Giữ chỗ', 'Chi phí nhỏ', 'Cập nhật giao dịch'],
    profile: ['KPI đội', 'Khối lượng công việc', 'Lịch quản lý'],
    mustHave: [APP_SHELL_BLOCKS.HOME, APP_SHELL_BLOCKS.BOTTOM_NAV, APP_SHELL_BLOCKS.QUICK_ACTIONS, APP_SHELL_BLOCKS.NOTIFICATIONS, APP_SHELL_BLOCKS.APPROVAL_TRAY, APP_SHELL_BLOCKS.PROFILE],
    why: 'Quản lý dùng ứng dụng để phản ứng nhanh ngoài hiện trường, nhưng vẫn cần website quản trị là mặt trận chính để soi sâu.',
  },
  [ROLES.BOD]: {
    role: ROLES.BOD,
    title: 'Ứng dụng điều hành nhanh',
    appFirst: false,
    homeRoute: '/app',
    bottomNav: ['Tổng quan', 'Cảnh báo', 'Phê duyệt', 'Doanh thu', 'Đội nhóm'],
    quickActions: ['Duyệt nhanh', 'Xem doanh thu ngày', 'Mở cảnh báo nóng'],
    notifications: ['Cảnh báo doanh thu', 'Chi phí chờ duyệt', 'Rủi ro pháp lý', 'Dòng tiền bất thường'],
    approvalTray: ['Giữ chỗ lớn', 'Chi phí', 'Quyền / chính sách', 'Pháp lý'],
    profile: ['Vai trò điều hành', 'Lịch phê duyệt', 'Báo cáo nhanh'],
    mustHave: [APP_SHELL_BLOCKS.HOME, APP_SHELL_BLOCKS.BOTTOM_NAV, APP_SHELL_BLOCKS.QUICK_ACTIONS, APP_SHELL_BLOCKS.NOTIFICATIONS, APP_SHELL_BLOCKS.APPROVAL_TRAY, APP_SHELL_BLOCKS.PROFILE],
    why: 'Lãnh đạo không dùng ứng dụng để quản trị sâu, mà để nhận cảnh báo nóng và ra quyết định nhanh.',
  },
  [ROLES.MARKETING]: {
    role: ROLES.MARKETING,
    title: 'Ứng dụng marketing nhanh',
    appFirst: false,
    homeRoute: '/app',
    bottomNav: ['Tổng quan', 'Chiến dịch', 'Khách mới', 'Kênh', 'Cảnh báo'],
    quickActions: ['Mở chiến dịch', 'Xem khách theo kênh', 'Bàn giao khách', 'Kiểm tra biểu mẫu'],
    notifications: ['Chiến dịch tụt hiệu suất', 'Khách đổ về tăng mạnh', 'Biểu mẫu lỗi', 'Kênh nổi bật thay đổi'],
    approvalTray: [],
    profile: ['Chiến dịch của tôi', 'KPI marketing', 'Khách đã bàn giao'],
    mustHave: [APP_SHELL_BLOCKS.HOME, APP_SHELL_BLOCKS.BOTTOM_NAV, APP_SHELL_BLOCKS.QUICK_ACTIONS, APP_SHELL_BLOCKS.NOTIFICATIONS, APP_SHELL_BLOCKS.PROFILE],
    why: 'Marketing dùng ứng dụng để theo dõi nhanh và phản ứng, còn thiết lập và phân tích chuyên sâu vẫn ở website quản trị.',
  },
};

export function getRoleAppShell(role) {
  return ROLE_APP_SHELL_STANDARD[role] || null;
}

export function getAppShellMatrix() {
  return Object.values(ROLE_APP_SHELL_STANDARD);
}

export function getAppShellSummary() {
  const items = getAppShellMatrix();
  return {
    totalShells: items.length,
    appFirstShells: items.filter((item) => item.appFirst).length,
    hybridSupportShells: items.filter((item) => !item.appFirst).length,
  };
}
