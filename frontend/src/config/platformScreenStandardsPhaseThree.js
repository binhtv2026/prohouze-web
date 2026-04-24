import { PLATFORM_SURFACES } from '@/config/platformSurfaceStrategy';
import { PLATFORM_LAUNCH_STATUS, PLATFORM_PHASE_1_SCOPE_MODULES } from '@/config/platformLaunchScopePhaseOne';

export const PLATFORM_SCREEN_STANDARD_PHASE_3 = {
  id: 'platform_screen_standards_phase_3_locked',
  label: 'Chuẩn hóa màn hình theo nền tảng',
  description: 'Mỗi cụm module vận hành phải có bộ màn hình chuẩn theo nền tảng. Không dùng màn cũ lẫn lộn giữa website quản trị và ứng dụng.',
};

export const SCREEN_REQUIREMENT_TYPES = {
  WORKSPACE: 'workspace',
  LIST: 'list',
  DETAIL: 'detail',
  ACTION: 'action',
  QUICK_ACTION: 'quick_action',
  APPROVAL: 'approval',
};

export const SCREEN_REQUIREMENT_META = {
  [SCREEN_REQUIREMENT_TYPES.WORKSPACE]: {
    key: SCREEN_REQUIREMENT_TYPES.WORKSPACE,
    label: 'Bảng làm việc',
    description: 'Màn tổng quan đúng vai trò, trả lời ngay hôm nay làm gì và vào đâu.',
    badgeClassName: 'bg-sky-100 text-sky-700 border-0',
  },
  [SCREEN_REQUIREMENT_TYPES.LIST]: {
    key: SCREEN_REQUIREMENT_TYPES.LIST,
    label: 'Danh sách',
    description: 'Màn danh sách xử lý công việc, lọc theo trạng thái / phân loại / hành động.',
    badgeClassName: 'bg-indigo-100 text-indigo-700 border-0',
  },
  [SCREEN_REQUIREMENT_TYPES.DETAIL]: {
    key: SCREEN_REQUIREMENT_TYPES.DETAIL,
    label: 'Chi tiết',
    description: 'Màn hồ sơ chi tiết cho một khách, giao dịch, chiến dịch, chứng từ hoặc đối tượng.',
    badgeClassName: 'bg-violet-100 text-violet-700 border-0',
  },
  [SCREEN_REQUIREMENT_TYPES.ACTION]: {
    key: SCREEN_REQUIREMENT_TYPES.ACTION,
    label: 'Thao tác chính',
    description: 'Màn hoặc luồng thực thi chính: tạo, sửa, duyệt, cập nhật trạng thái, chốt.',
    badgeClassName: 'bg-amber-100 text-amber-700 border-0',
  },
  [SCREEN_REQUIREMENT_TYPES.QUICK_ACTION]: {
    key: SCREEN_REQUIREMENT_TYPES.QUICK_ACTION,
    label: 'Thao tác nhanh',
    description: 'Thao tác nhanh trên ứng dụng: gọi, nhắn, theo bám, tạo lịch, đẩy giữ chỗ, cập nhật.',
    badgeClassName: 'bg-emerald-100 text-emerald-700 border-0',
  },
  [SCREEN_REQUIREMENT_TYPES.APPROVAL]: {
    key: SCREEN_REQUIREMENT_TYPES.APPROVAL,
    label: 'Phê duyệt',
    description: 'Màn duyệt nhanh cho quản lý, lãnh đạo, tài chính và pháp lý.',
    badgeClassName: 'bg-rose-100 text-rose-700 border-0',
  },
};

export const SURFACE_SCREEN_TEMPLATES = {
  [PLATFORM_SURFACES.WEB]: {
    surface: PLATFORM_SURFACES.WEB,
    title: 'Website quản trị',
    principle: 'Website quản trị phải có bảng làm việc điều hành, danh sách xử lý, chi tiết chuyên sâu và thao tác thật. Không được dừng ở bảng xem số liệu.',
    requiredScreens: [
      SCREEN_REQUIREMENT_TYPES.WORKSPACE,
      SCREEN_REQUIREMENT_TYPES.LIST,
      SCREEN_REQUIREMENT_TYPES.DETAIL,
      SCREEN_REQUIREMENT_TYPES.ACTION,
    ],
    bannedPatterns: [
      'Màn chỉ có KPI mà không có điểm vào xử lý',
      'Màn trộn nhiều mục tiêu chính trong một page',
      'Màn generic không rõ role hoặc owner',
    ],
  },
  [PLATFORM_SURFACES.APP]: {
    surface: PLATFORM_SURFACES.APP,
    title: 'Ứng dụng hiện trường',
    principle: 'Ứng dụng phải có màn chính theo ngày, danh sách công việc, chi tiết ngắn gọn và thao tác nhanh. Không sao chép nguyên website quản trị xuống ứng dụng.',
    requiredScreens: [
      SCREEN_REQUIREMENT_TYPES.WORKSPACE,
      SCREEN_REQUIREMENT_TYPES.LIST,
      SCREEN_REQUIREMENT_TYPES.DETAIL,
      SCREEN_REQUIREMENT_TYPES.QUICK_ACTION,
    ],
    bannedPatterns: [
      'Bảng nhiều cột kiểu back office',
      'Màn cấu hình sâu hoặc data foundation',
      'Chi tiết quá dài làm chậm nhịp thao tác hiện trường',
    ],
  },
  [PLATFORM_SURFACES.HYBRID]: {
    surface: PLATFORM_SURFACES.HYBRID,
    title: 'Hai nền tảng',
    principle: 'Mô hình hai nền tảng phải có bộ màn riêng cho website quản trị và ứng dụng. Không được dùng một màn chung rồi cố ép cho cả hai bên.',
    requiredScreens: [
      SCREEN_REQUIREMENT_TYPES.WORKSPACE,
      SCREEN_REQUIREMENT_TYPES.LIST,
      SCREEN_REQUIREMENT_TYPES.DETAIL,
      SCREEN_REQUIREMENT_TYPES.ACTION,
      SCREEN_REQUIREMENT_TYPES.QUICK_ACTION,
      SCREEN_REQUIREMENT_TYPES.APPROVAL,
    ],
    bannedPatterns: [
      'Một route dùng chung cho cả giao diện website quản trị và giao diện ứng dụng',
      'Màn duyệt nhanh bị nhúng vào page phân tích sâu',
      'Role hybrid nhìn cùng một menu cho mọi bối cảnh',
    ],
  },
};

const EXAMPLE_ROUTE_BY_SURFACE = {
  [PLATFORM_SURFACES.WEB]: {
    workspace: '/workspace',
    list: '/settings/users?status=active',
    detail: '/contracts/1',
    action: '/settings/change-management?status=draft',
  },
  [PLATFORM_SURFACES.APP]: {
    workspace: '/sales',
    list: '/crm/leads?status=hot',
    detail: '/crm/contacts?status=active',
    quick_action: '/work/reminders?type=call',
  },
  [PLATFORM_SURFACES.HYBRID]: {
    workspace: '/workspace',
    list: '/sales/kpi',
    detail: '/crm/leads?status=hot',
    action: '/contracts/pending',
    quick_action: '/work/tasks?status=overdue',
    approval: '/contracts/pending',
  },
};

export const PLATFORM_SCREEN_STANDARD_MATRIX = PLATFORM_PHASE_1_SCOPE_MODULES.map((cluster) => ({
  ...cluster,
  screenTemplate: SURFACE_SCREEN_TEMPLATES[cluster.surface],
  exampleRoutes: EXAMPLE_ROUTE_BY_SURFACE[cluster.surface],
  mustHave: SURFACE_SCREEN_TEMPLATES[cluster.surface].requiredScreens,
}));

export function getPlatformScreenStandardSummary() {
  const clusters = PLATFORM_SCREEN_STANDARD_MATRIX;
  const countBySurface = (surface) => clusters.filter((item) => item.surface === surface).length;
  const goLive = clusters.filter((item) => item.launchStatus === PLATFORM_LAUNCH_STATUS.GO_LIVE).length;

  return {
    totalClusters: clusters.length,
    goLiveClusters: goLive,
    webClusters: countBySurface(PLATFORM_SURFACES.WEB),
    appClusters: countBySurface(PLATFORM_SURFACES.APP),
    hybridClusters: countBySurface(PLATFORM_SURFACES.HYBRID),
  };
}

export function getPlatformScreenStandardMatrix() {
  return PLATFORM_SCREEN_STANDARD_MATRIX;
}

export function getPlatformScreenStandardsBySurface(surface) {
  return PLATFORM_SCREEN_STANDARD_MATRIX.filter((item) => item.surface === surface);
}

export function getPlatformSurfaceScreenTemplate(surface) {
  return SURFACE_SCREEN_TEMPLATES[surface] || null;
}
