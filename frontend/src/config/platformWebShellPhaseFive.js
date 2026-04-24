import { ROLES } from '@/config/navigation';

export const PLATFORM_WEB_SHELL_PHASE_5 = {
  id: 'platform_web_shell_phase_5_locked',
  label: 'Khóa giao diện website quản trị chuẩn',
  description: 'Chốt màn chính website quản trị, menu điều hành, hàng chờ xử lý, phê duyệt và báo cáo cho toàn bộ vai trò dùng web.',
};

export const WEB_SHELL_BLOCKS = {
  HOME: 'home',
  LEFT_NAV: 'left_nav',
  WORK_QUEUE: 'work_queue',
  APPROVAL_CENTER: 'approval_center',
  REPORTING_PANEL: 'reporting_panel',
  PROFILE: 'profile',
};

export const WEB_SHELL_BLOCK_META = {
  [WEB_SHELL_BLOCKS.HOME]: {
    key: WEB_SHELL_BLOCKS.HOME,
    label: 'Màn chính website quản trị',
    description: 'Bảng làm việc mở đầu của vai trò trên website quản trị.',
    badgeClassName: 'bg-sky-100 text-sky-700 border-0',
  },
  [WEB_SHELL_BLOCKS.LEFT_NAV]: {
    key: WEB_SHELL_BLOCKS.LEFT_NAV,
    label: 'Menu trái',
    description: 'Các nhóm menu chính thức của giao diện website quản trị.',
    badgeClassName: 'bg-indigo-100 text-indigo-700 border-0',
  },
  [WEB_SHELL_BLOCKS.WORK_QUEUE]: {
    key: WEB_SHELL_BLOCKS.WORK_QUEUE,
    label: 'Hàng chờ xử lý',
    description: 'Danh sách việc phải xử lý trong ngày trên website quản trị.',
    badgeClassName: 'bg-emerald-100 text-emerald-700 border-0',
  },
  [WEB_SHELL_BLOCKS.APPROVAL_CENTER]: {
    key: WEB_SHELL_BLOCKS.APPROVAL_CENTER,
    label: 'Trung tâm phê duyệt',
    description: 'Các loại phê duyệt bắt buộc trên website quản trị.',
    badgeClassName: 'bg-amber-100 text-amber-700 border-0',
  },
  [WEB_SHELL_BLOCKS.REPORTING_PANEL]: {
    key: WEB_SHELL_BLOCKS.REPORTING_PANEL,
    label: 'Báo cáo / phân tích',
    description: 'Bảng điều hành, báo cáo hoặc phân tích phải có trên website quản trị.',
    badgeClassName: 'bg-violet-100 text-violet-700 border-0',
  },
  [WEB_SHELL_BLOCKS.PROFILE]: {
    key: WEB_SHELL_BLOCKS.PROFILE,
    label: 'Hồ sơ / quyền lợi',
    description: 'Điểm vào hồ sơ cá nhân, KPI, quyền lợi, lộ trình, thiết lập cá nhân.',
    badgeClassName: 'bg-slate-100 text-slate-700 border-0',
  },
};

export const ROLE_WEB_SHELL_STANDARD = {
  [ROLES.ADMIN]: {
    role: ROLES.ADMIN,
    title: 'Giao diện website quản trị hệ thống',
    webOnly: true,
    homeRoute: '/workspace',
    leftNav: ['Tổng quan hệ thống', 'Người dùng & quyền', 'Dữ liệu chuẩn', 'Quy trình', 'Trang web & nội dung'],
    workQueues: ['Thay đổi vận hành', 'Người dùng bị khóa', 'Lệch dữ liệu nền', 'Điểm chặn vận hành'],
    approvals: ['Quyền truy cập', 'Thay đổi quy trình', 'Thay đổi dữ liệu nền', 'Cho phép ngoại lệ vận hành'],
    reporting: ['Kiểm thử vận hành', 'Ràng buộc backend', 'Quyền hành động', 'Dữ liệu nền'],
    profile: ['Hồ sơ quản trị', 'Vai trò hiện tại', 'Nhật ký thao tác'],
    mustHave: [
      WEB_SHELL_BLOCKS.HOME,
      WEB_SHELL_BLOCKS.LEFT_NAV,
      WEB_SHELL_BLOCKS.WORK_QUEUE,
      WEB_SHELL_BLOCKS.APPROVAL_CENTER,
      WEB_SHELL_BLOCKS.REPORTING_PANEL,
      WEB_SHELL_BLOCKS.PROFILE,
    ],
    why: 'Admin dùng website quản trị để khóa quyền, dữ liệu, quy trình và toàn bộ trạng thái hệ thống.',
  },
  [ROLES.BOD]: {
    role: ROLES.BOD,
    title: 'Giao diện website điều hành lãnh đạo',
    webOnly: false,
    homeRoute: '/workspace',
    leftNav: ['Tổng quan', 'Kinh doanh', 'Tài chính', 'Cảnh báo & phê duyệt'],
    workQueues: ['Các khoản cần quyết định', 'Giữ chỗ lớn', 'Cảnh báo doanh thu', 'Rủi ro pháp lý'],
    approvals: ['Giữ chỗ lớn', 'Chi phí', 'Chính sách', 'Pháp lý quan trọng'],
    reporting: ['Doanh thu', 'Lợi nhuận', 'Tăng trưởng', 'Top đội / top dự án'],
    profile: ['Hồ sơ điều hành', 'Lịch phê duyệt', 'Báo cáo nhanh của tôi'],
    mustHave: [
      WEB_SHELL_BLOCKS.HOME,
      WEB_SHELL_BLOCKS.LEFT_NAV,
      WEB_SHELL_BLOCKS.WORK_QUEUE,
      WEB_SHELL_BLOCKS.APPROVAL_CENTER,
      WEB_SHELL_BLOCKS.REPORTING_PANEL,
      WEB_SHELL_BLOCKS.PROFILE,
    ],
    why: 'BOD cần web để ra quyết định sâu, xem nhiều chiều và xử lý phê duyệt quan trọng.',
  },
  [ROLES.MANAGER]: {
    role: ROLES.MANAGER,
    title: 'Giao diện website quản lý',
    webOnly: false,
    homeRoute: '/workspace',
    leftNav: ['Điều hành đội', 'Kinh doanh', 'Công việc', 'Đội nhóm của tôi'],
    workQueues: ['Khách nóng', 'Việc quá hạn', 'Giữ chỗ chờ xử lý', 'Nhân sự cần hỗ trợ'],
    approvals: ['Giữ chỗ của đội', 'Chi phí nhỏ', 'Điều phối nguồn lực'],
    reporting: ['KPI đội', 'Khối lượng công việc', 'Tiến trình giao dịch của đội', 'Top kinh doanh'],
    profile: ['Vai trò quản lý', 'Đội nhóm của tôi', 'Lịch điều hành'],
    mustHave: [
      WEB_SHELL_BLOCKS.HOME,
      WEB_SHELL_BLOCKS.LEFT_NAV,
      WEB_SHELL_BLOCKS.WORK_QUEUE,
      WEB_SHELL_BLOCKS.APPROVAL_CENTER,
      WEB_SHELL_BLOCKS.REPORTING_PANEL,
      WEB_SHELL_BLOCKS.PROFILE,
    ],
    why: 'Manager dùng web để điều hành đội, soi KPI và gỡ nghẽn theo chiều sâu.',
  },
  [ROLES.MARKETING]: {
    role: ROLES.MARKETING,
    title: 'Giao diện website marketing',
    webOnly: false,
    homeRoute: '/workspace',
    leftNav: ['Tổng quan', 'Chiến dịch & kênh', 'Nội dung', 'Nguồn khách & theo dõi'],
    workQueues: ['Chiến dịch cần khởi chạy', 'Kênh cần tối ưu', 'Khách cần bàn giao', 'Nội dung chờ xuất bản'],
    approvals: ['Duyệt nội dung', 'Duyệt CTA / biểu mẫu', 'Duyệt ngân sách nhỏ'],
    reporting: ['Ghi nhận nguồn', 'Khách theo kênh', 'Chiến dịch hiệu quả', 'Hiệu suất nội dung'],
    profile: ['Chiến dịch của tôi', 'KPI marketing', 'Khách đã bàn giao'],
    mustHave: [
      WEB_SHELL_BLOCKS.HOME,
      WEB_SHELL_BLOCKS.LEFT_NAV,
      WEB_SHELL_BLOCKS.WORK_QUEUE,
      WEB_SHELL_BLOCKS.APPROVAL_CENTER,
      WEB_SHELL_BLOCKS.REPORTING_PANEL,
      WEB_SHELL_BLOCKS.PROFILE,
    ],
    why: 'Marketing vận hành trên website quản trị để thiết lập, theo dõi nguồn và theo dõi bàn giao khách.',
  },
  [ROLES.FINANCE]: {
    role: ROLES.FINANCE,
    title: 'Giao diện website tài chính',
    webOnly: true,
    homeRoute: '/workspace',
    leftNav: ['Tổng quan', 'Thu chi', 'Công nợ', 'Hoa hồng', 'Lương thưởng'],
    workQueues: ['Phiếu chi chờ duyệt', 'Công nợ cần đối soát', 'Hoa hồng chờ chi', 'Thuế / dự báo cần khóa'],
    approvals: ['Chi phí', 'Hoa hồng', 'Bảng lương', 'Phiếu đối soát'],
    reporting: ['Doanh thu', 'Chi phí', 'Công nợ', 'Dự báo', 'Thuế'],
    profile: ['Hồ sơ tài chính', 'Lịch chốt số liệu', 'Vai trò của tôi'],
    mustHave: [
      WEB_SHELL_BLOCKS.HOME,
      WEB_SHELL_BLOCKS.LEFT_NAV,
      WEB_SHELL_BLOCKS.WORK_QUEUE,
      WEB_SHELL_BLOCKS.APPROVAL_CENTER,
      WEB_SHELL_BLOCKS.REPORTING_PANEL,
      WEB_SHELL_BLOCKS.PROFILE,
    ],
    why: 'Tài chính cần website quản trị để kiểm soát số liệu, bảng nhiều cột và các hàng chờ đối soát.',
  },
  [ROLES.HR]: {
    role: ROLES.HR,
    title: 'Giao diện website nhân sự',
    webOnly: true,
    homeRoute: '/workspace',
    leftNav: ['Tổng quan', 'Tuyển dụng', 'Hồ sơ nhân sự', 'Đào tạo', 'Phát triển'],
    workQueues: ['Ứng viên mới', 'Hồ sơ thiếu', 'Tiếp nhận nhân sự mới', 'Đào tạo tuần này'],
    approvals: ['Tiếp nhận nhân sự mới', 'Hồ sơ hợp lệ', 'Đào tạo', 'Điều chuyển nội bộ'],
    reporting: ['Tuyển dụng', 'Nhân sự hoạt động', 'Đào tạo', 'Tăng trưởng đội ngũ'],
    profile: ['Hồ sơ nhân sự', 'Lịch tuyển dụng', 'Vai trò hiện tại'],
    mustHave: [
      WEB_SHELL_BLOCKS.HOME,
      WEB_SHELL_BLOCKS.LEFT_NAV,
      WEB_SHELL_BLOCKS.WORK_QUEUE,
      WEB_SHELL_BLOCKS.APPROVAL_CENTER,
      WEB_SHELL_BLOCKS.REPORTING_PANEL,
      WEB_SHELL_BLOCKS.PROFILE,
    ],
    why: 'Nhân sự dùng website quản trị để quản lý hồ sơ, tuyển dụng, đào tạo và các quy trình nội bộ nhiều bước.',
  },
  [ROLES.LEGAL]: {
    role: ROLES.LEGAL,
    title: 'Giao diện website pháp lý',
    webOnly: true,
    homeRoute: '/workspace',
    leftNav: ['Tổng quan', 'Hồ sơ dự án', 'Hợp đồng', 'Tài liệu cho kinh doanh'],
    workQueues: ['Hồ sơ pháp lý cần rà', 'Hợp đồng chờ ký', 'Rủi ro pháp lý', 'Tài liệu cần cập nhật'],
    approvals: ['Hợp đồng', 'Danh sách kiểm tra pháp lý', 'Tài liệu phát hành cho kinh doanh'],
    reporting: ['Tiến độ hồ sơ', 'Tuân thủ', 'Quy định', 'Cảnh báo rủi ro'],
    profile: ['Hồ sơ pháp lý', 'Vai trò hiện tại', 'Lịch review'],
    mustHave: [
      WEB_SHELL_BLOCKS.HOME,
      WEB_SHELL_BLOCKS.LEFT_NAV,
      WEB_SHELL_BLOCKS.WORK_QUEUE,
      WEB_SHELL_BLOCKS.APPROVAL_CENTER,
      WEB_SHELL_BLOCKS.REPORTING_PANEL,
      WEB_SHELL_BLOCKS.PROFILE,
    ],
    why: 'Pháp lý cần web để rà hồ sơ, hợp đồng và phát hành tài liệu chuẩn cho lực lượng bán.',
  },
  [ROLES.CONTENT]: {
    role: ROLES.CONTENT,
    title: 'Giao diện website trang web & nội dung',
    webOnly: true,
    homeRoute: '/workspace',
    leftNav: ['Tổng quan trang web', 'Trang & trang đích', 'Nội dung web', 'Biểu mẫu & CTA', 'Tối ưu tìm kiếm & hiệu suất'],
    workQueues: ['Trang cần sửa', 'Bài chờ đăng', 'Biểu mẫu lỗi', 'CTA hết hạn'],
    approvals: ['Xuất bản bài', 'Trang công khai', 'Trang đích', 'CTA / banner'],
    reporting: ['Tối ưu tìm kiếm', 'Phân tích nội dung', 'Trang nổi bật', 'Trang cần cải thiện'],
    profile: ['Hồ sơ nội dung', 'Nhiệm vụ xuất bản', 'Vai trò nội dung'],
    mustHave: [
      WEB_SHELL_BLOCKS.HOME,
      WEB_SHELL_BLOCKS.LEFT_NAV,
      WEB_SHELL_BLOCKS.WORK_QUEUE,
      WEB_SHELL_BLOCKS.APPROVAL_CENTER,
      WEB_SHELL_BLOCKS.REPORTING_PANEL,
      WEB_SHELL_BLOCKS.PROFILE,
    ],
    why: 'Trang web và nội dung là hậu cần nội dung, cần website quản trị để quản lý trang, bài, trang đích, CTA và tối ưu tìm kiếm.',
  },
};

export function getRoleWebShell(role) {
  return ROLE_WEB_SHELL_STANDARD[role] || null;
}

export function getWebShellMatrix() {
  return Object.values(ROLE_WEB_SHELL_STANDARD);
}

export function getWebShellSummary() {
  const items = getWebShellMatrix();
  return {
    totalShells: items.length,
    webOnlyShells: items.filter((item) => item.webOnly).length,
    hybridWebShells: items.filter((item) => !item.webOnly).length,
  };
}
