export const DATA_SOURCE_MODE = {
  LIVE: 'live',
  HYBRID: 'hybrid',
  SEED: 'seed',
  HIDDEN: 'hidden',
};

const DEFAULT_POLICY = {
  mode: DATA_SOURCE_MODE.HYBRID,
  label: 'Dữ liệu kết hợp',
  shortLabel: 'Kết hợp',
  description: 'Ưu tiên dữ liệu thật, dùng seed dự phòng khi API chưa sẵn hoặc trả rỗng.',
  visibleInGoLive: true,
};

const POLICY_BY_PREFIX = [
  {
    prefix: '/me',
    mode: DATA_SOURCE_MODE.LIVE,
    label: 'Dữ liệu thật',
    shortLabel: 'Thật',
    description: 'Dữ liệu tài khoản và hồ sơ cá nhân lấy từ nguồn thật.',
    visibleInGoLive: true,
  },
  {
    prefix: '/settings',
    mode: DATA_SOURCE_MODE.LIVE,
    label: 'Dữ liệu thật',
    shortLabel: 'Thật',
    description: 'Cấu hình hệ thống và quản trị lấy trực tiếp từ nguồn điều hành.',
    visibleInGoLive: true,
  },
  {
    prefix: '/workspace',
    mode: DATA_SOURCE_MODE.HYBRID,
    label: 'Dữ liệu kết hợp',
    shortLabel: 'Kết hợp',
    description: 'Workspace ưu tiên dữ liệu thật theo role và giữ seed dự phòng để không trắng màn.',
    visibleInGoLive: true,
  },
  {
    prefix: '/sales',
    mode: DATA_SOURCE_MODE.HYBRID,
    label: 'Dữ liệu kết hợp',
    shortLabel: 'Kết hợp',
    description: 'Khai thác dữ liệu bán hàng thật, có seed hỗ trợ khi backend chưa đủ.',
    visibleInGoLive: true,
  },
  {
    prefix: '/crm',
    mode: DATA_SOURCE_MODE.HYBRID,
    label: 'Dữ liệu kết hợp',
    shortLabel: 'Kết hợp',
    description: 'CRM dùng dữ liệu thật theo khách hàng và có seed giữ luồng làm việc không bị đứt.',
    visibleInGoLive: true,
  },
  {
    prefix: '/marketing',
    mode: DATA_SOURCE_MODE.HYBRID,
    label: 'Dữ liệu kết hợp',
    shortLabel: 'Kết hợp',
    description: 'Marketing lấy dữ liệu thật từ chiến dịch/kênh, seed dùng để giữ màn không rỗng.',
    visibleInGoLive: true,
  },
  {
    prefix: '/communications',
    mode: DATA_SOURCE_MODE.HYBRID,
    label: 'Dữ liệu kết hợp',
    shortLabel: 'Kết hợp',
    description: 'Nội dung và tracking dùng dữ liệu thật khi có, fallback khi thiếu cấu hình.',
    visibleInGoLive: true,
  },
  {
    prefix: '/finance',
    mode: DATA_SOURCE_MODE.HYBRID,
    label: 'Dữ liệu kết hợp',
    shortLabel: 'Kết hợp',
    description: 'Tài chính đang ở chế độ go-live kết hợp để giữ số liệu hiển thị ổn định.',
    visibleInGoLive: true,
  },
  {
    prefix: '/commission',
    mode: DATA_SOURCE_MODE.HYBRID,
    label: 'Dữ liệu kết hợp',
    shortLabel: 'Kết hợp',
    description: 'Hoa hồng và chi trả đang dùng dữ liệu kết hợp trong đợt go-live đầu.',
    visibleInGoLive: true,
  },
  {
    prefix: '/payroll',
    mode: DATA_SOURCE_MODE.HYBRID,
    label: 'Dữ liệu kết hợp',
    shortLabel: 'Kết hợp',
    description: 'Payroll và chấm công giữ seed dự phòng để không làm gãy thao tác.',
    visibleInGoLive: true,
  },
  {
    prefix: '/hr',
    mode: DATA_SOURCE_MODE.HYBRID,
    label: 'Dữ liệu kết hợp',
    shortLabel: 'Kết hợp',
    description: 'Nhân sự, tuyển dụng và đào tạo đang chạy theo chế độ dữ liệu kết hợp.',
    visibleInGoLive: true,
  },
  {
    prefix: '/training',
    mode: DATA_SOURCE_MODE.HYBRID,
    label: 'Dữ liệu kết hợp',
    shortLabel: 'Kết hợp',
    description: 'Đào tạo dùng dữ liệu thật nếu sẵn, còn lại giữ seed để không trắng màn.',
    visibleInGoLive: true,
  },
  {
    prefix: '/contracts',
    mode: DATA_SOURCE_MODE.HYBRID,
    label: 'Dữ liệu kết hợp',
    shortLabel: 'Kết hợp',
    description: 'Hợp đồng và tiến trình ký đang ở chế độ kết hợp có kiểm soát.',
    visibleInGoLive: true,
  },
  {
    prefix: '/legal',
    mode: DATA_SOURCE_MODE.HYBRID,
    label: 'Dữ liệu kết hợp',
    shortLabel: 'Kết hợp',
    description: 'Pháp lý dự án và tài liệu hỗ trợ sale đang chạy theo dữ liệu kết hợp.',
    visibleInGoLive: true,
  },
  {
    prefix: '/cms',
    mode: DATA_SOURCE_MODE.HYBRID,
    label: 'Dữ liệu kết hợp',
    shortLabel: 'Kết hợp',
    description: 'Website/CMS dùng dữ liệu thật khi có, seed giữ cho luồng biên tập ổn định.',
    visibleInGoLive: true,
  },
  {
    prefix: '/work',
    mode: DATA_SOURCE_MODE.HYBRID,
    label: 'Dữ liệu kết hợp',
    shortLabel: 'Kết hợp',
    description: 'Công việc, lịch và nhắc việc đang ở chế độ dữ liệu kết hợp.',
    visibleInGoLive: true,
  },
  {
    prefix: '/kpi',
    mode: DATA_SOURCE_MODE.HYBRID,
    label: 'Dữ liệu kết hợp',
    shortLabel: 'Kết hợp',
    description: 'KPI và bảng xếp hạng dùng dữ liệu kết hợp trong đợt go-live đầu.',
    visibleInGoLive: true,
  },
  {
    prefix: '/analytics',
    mode: DATA_SOURCE_MODE.HYBRID,
    label: 'Dữ liệu kết hợp',
    shortLabel: 'Kết hợp',
    description: 'Báo cáo lãnh đạo và phân tích điều hành được mở trong đợt go-live với dữ liệu kết hợp.',
    visibleInGoLive: true,
  },
  {
    prefix: '/control',
    mode: DATA_SOURCE_MODE.HYBRID,
    label: 'Dữ liệu kết hợp',
    shortLabel: 'Kết hợp',
    description: 'Trung tâm điều hành nhanh cho lãnh đạo dùng dữ liệu kết hợp trong đợt go-live đầu.',
    visibleInGoLive: true,
  },
  {
    prefix: '/automation',
    mode: DATA_SOURCE_MODE.SEED,
    label: 'Seed nội bộ',
    shortLabel: 'Seed',
    description: 'Automation vẫn là vùng nội bộ, chưa mở production đợt 1.',
    visibleInGoLive: false,
  },
  {
    prefix: '/email',
    mode: DATA_SOURCE_MODE.SEED,
    label: 'Seed nội bộ',
    shortLabel: 'Seed',
    description: 'Email automation chưa mở trong phạm vi go-live đợt 1.',
    visibleInGoLive: false,
  },
  {
    prefix: '/inventory',
    mode: DATA_SOURCE_MODE.SEED,
    label: 'Seed nội bộ',
    shortLabel: 'Seed',
    description: 'Các route inventory sâu vẫn để nội bộ, chưa mở production đợt 1.',
    visibleInGoLive: false,
  },
  {
    prefix: '/agency',
    mode: DATA_SOURCE_MODE.SEED,
    label: 'Seed nội bộ',
    shortLabel: 'Seed',
    description: 'Cụm đại lý riêng chưa mở độc lập trong đợt go-live chính thức.',
    visibleInGoLive: false,
  },
  {
    prefix: '/dashboard/',
    mode: DATA_SOURCE_MODE.SEED,
    label: 'Seed nội bộ',
    shortLabel: 'Seed',
    description: 'Các dashboard legacy được giữ để tham chiếu nội bộ, không mở go-live.',
    visibleInGoLive: false,
  },
];

const normalizePathname = (path = '/') => {
  if (!path) return '/';

  try {
    return new URL(path, 'http://localhost').pathname || '/';
  } catch (_error) {
    return path.split('?')[0] || '/';
  }
};

export const getGoLiveDataPolicy = (path = '/') => {
  const pathname = normalizePathname(path);
  const match = POLICY_BY_PREFIX
    .filter((item) => pathname === item.prefix || pathname.startsWith(`${item.prefix}/`) || (item.prefix.endsWith('/') && pathname.startsWith(item.prefix)))
    .sort((a, b) => b.prefix.length - a.prefix.length)[0];

  return match || DEFAULT_POLICY;
};

export const isRouteVisibleInGoLive = (path = '/') => getGoLiveDataPolicy(path).visibleInGoLive !== false;

export const getGoLiveModeStats = (paths = []) => {
  const summary = {
    live: 0,
    hybrid: 0,
    seed: 0,
  };

  const seen = new Set();
  paths.forEach((path) => {
    const normalized = normalizePathname(path);
    if (seen.has(normalized)) return;
    seen.add(normalized);

    const policy = getGoLiveDataPolicy(normalized);
    if (policy.mode === DATA_SOURCE_MODE.LIVE) summary.live += 1;
    if (policy.mode === DATA_SOURCE_MODE.HYBRID) summary.hybrid += 1;
    if (policy.mode === DATA_SOURCE_MODE.SEED) summary.seed += 1;
  });

  return summary;
};
