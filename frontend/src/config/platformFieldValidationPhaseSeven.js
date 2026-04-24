import { ROLE_ORDER, ROLE_GOVERNANCE } from '@/config/roleGovernance';
import { getGoLiveDataPolicy } from '@/config/goLiveDataPolicy';
import { areBackendContractsLockedForPath } from '@/config/goLiveBackendContracts';
import { canRoleAccessPath } from '@/config/goLiveActionPermissions';
import { areFoundationDependenciesLockedForPath } from '@/config/goLiveFoundationBaseline';
import { isPathRegisteredForGoLive } from '@/config/goLiveRouteRegistry';
import { getPlatformPhaseOneRoleCoverage } from '@/config/platformLaunchScopePhaseOne';
import { getRoleDefaultNavigationShell, getRoleNavigationSplit } from '@/config/platformNavigationSplit';
import { isPlatformApiPermissionLockedForRolePath } from '@/config/platformApiPermissionPhaseSix';
import { getPlatformSurfaceScreenTemplate, SCREEN_REQUIREMENT_TYPES } from '@/config/platformScreenStandardsPhaseThree';
import { PLATFORM_SURFACES, PLATFORM_SURFACE_META, getRoleSurfaceStrategy } from '@/config/platformSurfaceStrategy';
import { getRoleAppShell } from '@/config/platformAppShellPhaseFour';
import { getRoleWebShell } from '@/config/platformWebShellPhaseFive';

export const PLATFORM_FIELD_VALIDATION_PHASE_7 = {
  id: 'platform_field_validation_phase_7_locked',
  label: 'Kiểm thử thực địa theo role',
  description: 'Mỗi role phải có checklist web/app riêng để test thật trên đúng surface, đúng shell và đúng luồng xử lý công việc.',
};

const checkpoint = (label, route, type, expected) => ({
  label,
  route,
  type,
  expected,
});

const ROLE_FIELD_CHECKPOINTS = {
  admin: {
    web: [
      checkpoint('Workspace quản trị', '/workspace', SCREEN_REQUIREMENT_TYPES.WORKSPACE, 'Vào đúng workspace điều hành hệ thống.'),
      checkpoint('Danh sách người dùng active', '/settings/users?status=active', SCREEN_REQUIREMENT_TYPES.LIST, 'Xử lý người dùng và trạng thái truy cập.'),
      checkpoint('Vai trò & quyền', '/settings/roles', SCREEN_REQUIREMENT_TYPES.DETAIL, 'Xem và khóa role / permission chuẩn.'),
      checkpoint('Governance tổng', '/settings/governance', SCREEN_REQUIREMENT_TYPES.DETAIL, 'Mở đúng trung tâm quản trị nền.'),
      checkpoint('Change management', '/settings/change-management', SCREEN_REQUIREMENT_TYPES.ACTION, 'Xử lý thay đổi cấu hình và điều hành go-live.'),
      checkpoint('CMS dashboard', '/cms', SCREEN_REQUIREMENT_TYPES.LIST, 'Đi tới khu vực website/CMS quản trị.'),
    ],
  },
  bod: {
    web: [
      checkpoint('Workspace lãnh đạo', '/workspace', SCREEN_REQUIREMENT_TYPES.WORKSPACE, 'Mở đúng workspace điều hành cấp cao.'),
      checkpoint('Executive analytics', '/analytics', SCREEN_REQUIREMENT_TYPES.LIST, 'Xem phân tích điều hành và chỉ số chiến lược.'),
      checkpoint('Tài chính tổng', '/finance/overview', SCREEN_REQUIREMENT_TYPES.DETAIL, 'Xem dòng tiền và trạng thái tài chính doanh nghiệp.'),
      checkpoint('Pipeline kinh doanh', '/sales/pipeline', SCREEN_REQUIREMENT_TYPES.DETAIL, 'Xem pipeline giao dịch để quyết định.'),
      checkpoint('Pháp lý dự án', '/legal/licenses', SCREEN_REQUIREMENT_TYPES.DETAIL, 'Xem hồ sơ pháp lý / rủi ro.'),
    ],
    app: [
      checkpoint('Quick workspace', '/workspace', SCREEN_REQUIREMENT_TYPES.WORKSPACE, 'Mở đúng quick workspace của BOD.'),
      checkpoint('Phê duyệt booking', '/sales/bookings', SCREEN_REQUIREMENT_TYPES.APPROVAL, 'Vào đúng hàng chờ booking cần duyệt nhanh.'),
      checkpoint('Cảnh báo tài chính', '/finance/overview', SCREEN_REQUIREMENT_TYPES.QUICK_ACTION, 'Xem ngay cảnh báo tài chính quan trọng.'),
    ],
  },
  manager: {
    web: [
      checkpoint('Workspace quản lý', '/workspace', SCREEN_REQUIREMENT_TYPES.WORKSPACE, 'Mở đúng workspace quản lý đội.'),
      checkpoint('Lead nóng', '/crm/leads?status=hot', SCREEN_REQUIREMENT_TYPES.LIST, 'Xem lead nóng để điều phối đội.'),
      checkpoint('Pipeline đội', '/sales/pipeline', SCREEN_REQUIREMENT_TYPES.DETAIL, 'Xem pipeline đội và bottleneck.'),
      checkpoint('Việc quá hạn', '/work/tasks?status=overdue', SCREEN_REQUIREMENT_TYPES.ACTION, 'Đi vào đúng hàng chờ việc quá hạn.'),
      checkpoint('KPI đội', '/kpi', SCREEN_REQUIREMENT_TYPES.DETAIL, 'Xem KPI đội và top sales.'),
    ],
    app: [
      checkpoint('Quick workspace manager', '/workspace', SCREEN_REQUIREMENT_TYPES.WORKSPACE, 'Mở đúng quick workspace manager.'),
      checkpoint('Lead nóng mobile', '/crm/leads?status=hot', SCREEN_REQUIREMENT_TYPES.LIST, 'Theo lead nóng khi đang ngoài hiện trường.'),
      checkpoint('Booking chờ xử lý', '/sales/bookings', SCREEN_REQUIREMENT_TYPES.APPROVAL, 'Xử lý booking nhanh trên mobile context.'),
      checkpoint('Việc quá hạn mobile', '/work/tasks?status=overdue', SCREEN_REQUIREMENT_TYPES.QUICK_ACTION, 'Mở đúng hàng chờ xử lý nhanh.'),
    ],
  },
  sales: {
    app: [
      checkpoint('Sales home', '/sales', SCREEN_REQUIREMENT_TYPES.WORKSPACE, 'Mở đúng dashboard app-first của sales.'),
      checkpoint('Lead nóng', '/crm/leads?status=hot', SCREEN_REQUIREMENT_TYPES.LIST, 'Đi vào lead nóng để xử lý trong ngày.'),
      checkpoint('Khách hàng active', '/crm/contacts?status=active', SCREEN_REQUIREMENT_TYPES.DETAIL, 'Xem đúng danh sách khách đang theo.'),
      checkpoint('Pipeline', '/sales/pipeline', SCREEN_REQUIREMENT_TYPES.DETAIL, 'Mở đúng pipeline giao dịch của sales.'),
      checkpoint('Booking', '/sales/bookings', SCREEN_REQUIREMENT_TYPES.ACTION, 'Vào đúng luồng booking.'),
      checkpoint('Trung tâm sản phẩm', '/sales/product-center', SCREEN_REQUIREMENT_TYPES.DETAIL, 'Mở đúng khu sản phẩm / bảng giá / pháp lý cho khách.'),
      checkpoint('Thu nhập của tôi', '/finance/my-income', SCREEN_REQUIREMENT_TYPES.QUICK_ACTION, 'Xem nhanh doanh thu / hoa hồng của tôi.'),
    ],
  },
  marketing: {
    web: [
      checkpoint('Workspace marketing', '/workspace', SCREEN_REQUIREMENT_TYPES.WORKSPACE, 'Mở đúng workspace marketing.'),
      checkpoint('Chiến dịch', '/marketing/campaigns', SCREEN_REQUIREMENT_TYPES.LIST, 'Đi vào setup và theo dõi chiến dịch.'),
      checkpoint('Nguồn khách', '/marketing/sources', SCREEN_REQUIREMENT_TYPES.DETAIL, 'Xem nguồn lead / kênh.'),
      checkpoint('Nội dung', '/marketing/content', SCREEN_REQUIREMENT_TYPES.DETAIL, 'Quản lý nội dung marketing.'),
      checkpoint('Forms', '/marketing/forms', SCREEN_REQUIREMENT_TYPES.ACTION, 'Đi vào forms / CTA / tracking.'),
      checkpoint('Attribution', '/marketing/attribution', SCREEN_REQUIREMENT_TYPES.DETAIL, 'Xem attribution và hiệu quả.'),
    ],
    app: [
      checkpoint('Quick workspace marketing', '/workspace', SCREEN_REQUIREMENT_TYPES.WORKSPACE, 'Mở quick workspace theo dõi nhanh marketing.'),
      checkpoint('Campaign mobile', '/marketing/campaigns', SCREEN_REQUIREMENT_TYPES.LIST, 'Theo dõi chiến dịch khi đang di chuyển.'),
      checkpoint('Lead nóng từ kênh', '/crm/leads?status=hot', SCREEN_REQUIREMENT_TYPES.QUICK_ACTION, 'Bắt lead nóng từ campaign nhanh.'),
      checkpoint('Nguồn khách mobile', '/marketing/sources', SCREEN_REQUIREMENT_TYPES.DETAIL, 'Xem kênh hiệu quả / yếu ngay.'),
    ],
  },
  finance: {
    web: [
      checkpoint('Workspace tài chính', '/workspace', SCREEN_REQUIREMENT_TYPES.WORKSPACE, 'Mở đúng workspace tài chính.'),
      checkpoint('Tổng quan tài chính', '/finance/overview', SCREEN_REQUIREMENT_TYPES.LIST, 'Xem dashboard tài chính tổng.'),
      checkpoint('Chi phí', '/finance/expenses', SCREEN_REQUIREMENT_TYPES.ACTION, 'Đi vào phiếu chi / xử lý chi phí.'),
      checkpoint('Công nợ', '/finance/receivables', SCREEN_REQUIREMENT_TYPES.DETAIL, 'Xem công nợ và đối soát.'),
      checkpoint('Hoa hồng', '/finance/commission', SCREEN_REQUIREMENT_TYPES.DETAIL, 'Xử lý hoa hồng / duyệt chi.'),
      checkpoint('Payroll', '/payroll', SCREEN_REQUIREMENT_TYPES.DETAIL, 'Đi vào payroll support.'),
    ],
  },
  hr: {
    web: [
      checkpoint('Workspace HR', '/workspace', SCREEN_REQUIREMENT_TYPES.WORKSPACE, 'Mở đúng workspace HR.'),
      checkpoint('Tuyển dụng', '/hr/recruitment', SCREEN_REQUIREMENT_TYPES.LIST, 'Xử lý ứng viên / funnel tuyển dụng.'),
      checkpoint('Nhân sự', '/hr/employees', SCREEN_REQUIREMENT_TYPES.DETAIL, 'Xem hồ sơ nhân sự.'),
      checkpoint('Đào tạo', '/training', SCREEN_REQUIREMENT_TYPES.ACTION, 'Đi vào đào tạo / lộ trình.'),
      checkpoint('Payroll support', '/payroll', SCREEN_REQUIREMENT_TYPES.DETAIL, 'Hỗ trợ chấm công / payroll.'),
    ],
  },
  legal: {
    web: [
      checkpoint('Workspace pháp lý', '/workspace', SCREEN_REQUIREMENT_TYPES.WORKSPACE, 'Mở đúng workspace pháp lý.'),
      checkpoint('Pháp lý dự án', '/legal/licenses', SCREEN_REQUIREMENT_TYPES.LIST, 'Xem pháp lý dự án.'),
      checkpoint('Hợp đồng', '/contracts', SCREEN_REQUIREMENT_TYPES.DETAIL, 'Đi vào hợp đồng để xử lý.'),
      checkpoint('Compliance', '/legal/compliance', SCREEN_REQUIREMENT_TYPES.ACTION, 'Đi vào compliance / cảnh báo.'),
    ],
  },
  content: {
    web: [
      checkpoint('Workspace CMS', '/workspace', SCREEN_REQUIREMENT_TYPES.WORKSPACE, 'Mở đúng workspace CMS.'),
      checkpoint('CMS dashboard', '/cms', SCREEN_REQUIREMENT_TYPES.LIST, 'Đi vào dashboard website / CMS.'),
      checkpoint('Pages', '/cms/pages', SCREEN_REQUIREMENT_TYPES.DETAIL, 'Xem và quản lý pages.'),
      checkpoint('Articles', '/cms/articles', SCREEN_REQUIREMENT_TYPES.DETAIL, 'Xem và quản lý articles.'),
      checkpoint('Public projects', '/cms/public-projects', SCREEN_REQUIREMENT_TYPES.ACTION, 'Quản lý dự án hiển thị ra ngoài.'),
      checkpoint('CMS analytics', '/cms/analytics', SCREEN_REQUIREMENT_TYPES.DETAIL, 'Xem hiệu suất nội dung / website.'),
    ],
  },
  agency: {
    app: [
      checkpoint('Agency workspace', '/workspace', SCREEN_REQUIREMENT_TYPES.WORKSPACE, 'Mở đúng quick workspace CTV / đại lý.'),
      checkpoint('Lead của tôi', '/crm/leads?status=new', SCREEN_REQUIREMENT_TYPES.LIST, 'Xem nguồn khách của tôi.'),
      checkpoint('Khách hàng của tôi', '/crm/contacts?status=active', SCREEN_REQUIREMENT_TYPES.DETAIL, 'Theo khách đang theo.'),
      checkpoint('Booking của tôi', '/sales/bookings', SCREEN_REQUIREMENT_TYPES.ACTION, 'Vào đúng booking của mình.'),
      checkpoint('Tài liệu bán hàng', '/sales/product-center', SCREEN_REQUIREMENT_TYPES.DETAIL, 'Mở tài liệu / bảng giá / pháp lý để gửi khách.'),
      checkpoint('Hoa hồng của tôi', '/finance/my-income', SCREEN_REQUIREMENT_TYPES.QUICK_ACTION, 'Xem ngay thu nhập / commission của tôi.'),
    ],
  },
};

const getRoleRequiredSurfaces = (role) => {
  const clusters = getPlatformPhaseOneRoleCoverage()[role] || [];
  const surfaces = new Set();

  clusters.forEach((cluster) => {
    if (cluster.surface === PLATFORM_SURFACES.HYBRID) {
      surfaces.add(PLATFORM_SURFACES.WEB);
      surfaces.add(PLATFORM_SURFACES.APP);
      return;
    }
    surfaces.add(cluster.surface);
  });

  return Array.from(surfaces);
};

const decorateCheckpoint = (role, surface, item) => {
  const dataPolicy = getGoLiveDataPolicy(item.route);
  const routeRegistered = isPathRegisteredForGoLive(item.route);
  const actionLocked = canRoleAccessPath(role, item.route);
  const backendLocked = areBackendContractsLockedForPath(item.route);
  const foundationLocked = areFoundationDependenciesLockedForPath(item.route);
  const platformApiLocked = isPlatformApiPermissionLockedForRolePath(role, item.route);
  const ready = Boolean(
    routeRegistered &&
      dataPolicy.visibleInGoLive !== false &&
      actionLocked &&
      backendLocked &&
      foundationLocked &&
      platformApiLocked,
  );

  return {
    ...item,
    surface,
    dataPolicy,
    routeRegistered,
    actionLocked,
    backendLocked,
    foundationLocked,
    platformApiLocked,
    ready,
  };
};

export function getPlatformFieldValidationSuite(role) {
  const checkpointsBySurface = ROLE_FIELD_CHECKPOINTS[role] || {};
  return Object.entries(checkpointsBySurface).flatMap(([surface, checkpoints]) =>
    checkpoints.map((item) => decorateCheckpoint(role, surface, item)),
  );
}

export function getRolePlatformFieldValidation(role) {
  const profile = ROLE_GOVERNANCE[role];
  const surfaceStrategy = getRoleSurfaceStrategy(role);
  const requiredSurfaces = getRoleRequiredSurfaces(role);
  const scopeClusters = getPlatformPhaseOneRoleCoverage()[role] || [];
  const navigationSplit = getRoleNavigationSplit(role);
  const defaultShell = getRoleDefaultNavigationShell(role);
  const webShell = getRoleWebShell(role);
  const appShell = getRoleAppShell(role);
  const checkpoints = getPlatformFieldValidationSuite(role);
  const readyCheckpoints = checkpoints.filter((item) => item.ready).length;
  const webCheckpoints = checkpoints.filter((item) => item.surface === PLATFORM_SURFACES.WEB).length;
  const appCheckpoints = checkpoints.filter((item) => item.surface === PLATFORM_SURFACES.APP).length;

  const launchLocked = scopeClusters.length > 0;
  const navigationLocked = Boolean(navigationSplit?.defaultShell);
  const webShellLocked = !requiredSurfaces.includes(PLATFORM_SURFACES.WEB) || Boolean(webShell?.mustHave?.length);
  const appShellLocked = !requiredSurfaces.includes(PLATFORM_SURFACES.APP) || Boolean(appShell?.mustHave?.length);
  const screenStandardLocked = requiredSurfaces.every((surface) => Boolean(getPlatformSurfaceScreenTemplate(surface)));
  const checkpointsLocked = checkpoints.length > 0 && readyCheckpoints === checkpoints.length;
  const locked = launchLocked && navigationLocked && webShellLocked && appShellLocked && screenStandardLocked && checkpointsLocked;

  return {
    role,
    profile,
    surfaceStrategy,
    requiredSurfaces,
    requiredSurfaceMeta: requiredSurfaces.map((surface) => PLATFORM_SURFACE_META[surface]),
    scopeClusters,
    navigationSplit,
    defaultShell,
    webShell,
    appShell,
    launchLocked,
    navigationLocked,
    webShellLocked,
    appShellLocked,
    screenStandardLocked,
    checkpointsLocked,
    checkpoints,
    totalCheckpoints: checkpoints.length,
    readyCheckpoints,
    webCheckpoints,
    appCheckpoints,
    locked,
  };
}

export function getPlatformFieldValidationMatrix() {
  return ROLE_ORDER.map((role) => getRolePlatformFieldValidation(role));
}

export function isPlatformFieldValidationLocked(role) {
  return getRolePlatformFieldValidation(role).locked;
}

export function getPlatformFieldValidationSummary() {
  const matrix = getPlatformFieldValidationMatrix();
  return {
    totalRoles: matrix.length,
    lockedRoles: matrix.filter((item) => item.locked).length,
    totalCheckpoints: matrix.reduce((sum, item) => sum + item.totalCheckpoints, 0),
    readyCheckpoints: matrix.reduce((sum, item) => sum + item.readyCheckpoints, 0),
    webCheckpoints: matrix.reduce((sum, item) => sum + item.webCheckpoints, 0),
    appCheckpoints: matrix.reduce((sum, item) => sum + item.appCheckpoints, 0),
    fullyLocked: matrix.length > 0 && matrix.every((item) => item.locked),
  };
}
