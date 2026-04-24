import { ROLES } from '@/config/navigation';
import { PLATFORM_SURFACES, getRoleSurfaceStrategy } from '@/config/platformSurfaceStrategy';
import { getRoleSidebarTabs, getRoleWorkspaceTabs } from '@/config/roleDashboardSpec';

export const NAVIGATION_SHELLS = {
  WEB: 'web_shell',
  APP: 'app_shell',
};

export const NAVIGATION_SHELL_META = {
  [NAVIGATION_SHELLS.WEB]: {
    key: NAVIGATION_SHELLS.WEB,
    label: 'Giao diện website quản trị',
    description: 'Điều hướng dành cho điều hành, back office và các tác vụ dữ liệu lớn.',
    badgeClassName: 'bg-sky-100 text-sky-700 border-0',
  },
  [NAVIGATION_SHELLS.APP]: {
    key: NAVIGATION_SHELLS.APP,
    label: 'Giao diện ứng dụng',
    description: 'Điều hướng dành cho lực lượng hiện trường, xử lý nhanh và thao tác trong ngày.',
    badgeClassName: 'bg-emerald-100 text-emerald-700 border-0',
  },
};

export const PLATFORM_NAVIGATION_SPLIT_PHASE_1 = {
  id: 'platform_navigation_phase_1_locked',
  label: 'Tách điều hướng website quản trị / ứng dụng đợt 1',
  description: 'Mỗi vai trò có giao diện mặc định riêng, và nếu dùng song song thì có thêm giao diện thứ hai để mở khi cần.',
};

export const ROLE_NAVIGATION_SPLIT = {
  [ROLES.ADMIN]: {
    defaultShell: NAVIGATION_SHELLS.WEB,
    webTabIds: ['tong_quan_he_thong', 'nguoi_dung_quyen', 'du_lieu_chuan', 'quy_trinh', 'website_cms'],
    appTabIds: [],
  },
  [ROLES.BOD]: {
    defaultShell: NAVIGATION_SHELLS.WEB,
    webTabIds: ['tong_quan', 'kinh_doanh', 'tai_chinh', 'canh_bao_phe_duyet'],
    appTabIds: ['tong_quan', 'canh_bao_phe_duyet'],
  },
  [ROLES.MANAGER]: {
    defaultShell: NAVIGATION_SHELLS.WEB,
    webTabIds: ['dieu_hanh_doi', 'kinh_doanh', 'cong_viec', 'my_team'],
    appTabIds: ['dieu_hanh_doi', 'kinh_doanh', 'cong_viec'],
  },
  [ROLES.SALES]: {
    defaultShell: NAVIGATION_SHELLS.APP,
    webTabIds: ['tong_quan', 'san_pham', 'tai_chinh'],
    appTabIds: ['tong_quan', 'my_team', 'khach_hang', 'san_pham', 'ban_hang', 'kenh_ban_hang', 'tai_chinh'],
  },
  [ROLES.MARKETING]: {
    defaultShell: NAVIGATION_SHELLS.WEB,
    webTabIds: ['tong_quan', 'chien_dich_kenh', 'noi_dung', 'lead_tracking'],
    appTabIds: ['tong_quan', 'chien_dich_kenh', 'lead_tracking'],
  },
  [ROLES.FINANCE]: {
    defaultShell: NAVIGATION_SHELLS.WEB,
    webTabIds: ['tong_quan', 'thu_chi', 'cong_no', 'hoa_hong', 'luong_thuong'],
    appTabIds: [],
  },
  [ROLES.HR]: {
    defaultShell: NAVIGATION_SHELLS.WEB,
    webTabIds: ['tong_quan', 'tuyen_dung', 'ho_so_nhan_su', 'dao_tao', 'phat_trien'],
    appTabIds: [],
  },
  [ROLES.LEGAL]: {
    defaultShell: NAVIGATION_SHELLS.WEB,
    webTabIds: ['tong_quan', 'ho_so_du_an', 'hop_dong', 'tai_lieu_cho_sale'],
    appTabIds: [],
  },
  [ROLES.CONTENT]: {
    defaultShell: NAVIGATION_SHELLS.WEB,
    webTabIds: ['tong_quan_web', 'trang_landing', 'noi_dung_web', 'form_cta', 'seo_hieu_suat'],
    appTabIds: [],
  },
  [ROLES.AGENCY]: {
    defaultShell: NAVIGATION_SHELLS.APP,
    webTabIds: ['tong_quan', 'tai_lieu'],
    appTabIds: ['tong_quan', 'khach_hang', 'ban_hang', 'tai_chinh', 'tai_lieu'],
  },
};

const filterTabsByIds = (tabs = [], ids = []) => {
  if (!ids.length) {
    return [];
  }

  const idSet = new Set(ids);
  return tabs.filter((tab) => idSet.has(tab.id));
};

export function getRoleNavigationSplit(role) {
  return ROLE_NAVIGATION_SPLIT[role] || ROLE_NAVIGATION_SPLIT[ROLES.MANAGER];
}

export function getRoleDefaultNavigationShell(role) {
  const split = getRoleNavigationSplit(role);
  return split.defaultShell;
}

export function getRoleNavigationShellTabs(role, shell = getRoleDefaultNavigationShell(role)) {
  const split = getRoleNavigationSplit(role);
  const tabs = getRoleWorkspaceTabs(role);
  const ids = shell === NAVIGATION_SHELLS.APP ? split.appTabIds : split.webTabIds;
  return filterTabsByIds(tabs, ids);
}

export function getRoleSidebarShellTabs(role, shell = getRoleDefaultNavigationShell(role)) {
  const split = getRoleNavigationSplit(role);
  const tabs = getRoleSidebarTabs(role);
  const ids = shell === NAVIGATION_SHELLS.APP ? split.appTabIds : split.webTabIds;
  return filterTabsByIds(tabs, ids);
}

export function getRoleNavigationShellSummary(role) {
  const split = getRoleNavigationSplit(role);
  const surfaceStrategy = getRoleSurfaceStrategy(role);
  return {
    role,
    defaultShell: split.defaultShell,
    defaultShellMeta: NAVIGATION_SHELL_META[split.defaultShell],
    primarySurface: surfaceStrategy?.primarySurface || PLATFORM_SURFACES.WEB,
    surfaceStrategy,
    webTabs: getRoleNavigationShellTabs(role, NAVIGATION_SHELLS.WEB),
    appTabs: getRoleNavigationShellTabs(role, NAVIGATION_SHELLS.APP),
  };
}

export function getRoleNavigationShellMatrix() {
  return Object.keys(ROLE_NAVIGATION_SPLIT).map((role) => getRoleNavigationShellSummary(role));
}
