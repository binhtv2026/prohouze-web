import { ROLE_ORDER } from '@/config/roleGovernance';
import { QUICK_ACTIONS } from '@/config/navigation';
import {
  getGoLiveDataPolicy,
} from '@/config/goLiveDataPolicy';
import {
  areBackendContractsLockedForPath,
} from '@/config/goLiveBackendContracts';
import {
  areFoundationDependenciesLockedForPath,
} from '@/config/goLiveFoundationBaseline';
import {
  canRoleAccessPath,
} from '@/config/goLiveActionPermissions';
import {
  getNormalizedGoLivePath,
  isPathRegisteredForGoLive,
} from '@/config/goLiveRouteRegistry';
import {
  isPlatformApiPermissionLockedForRolePath,
} from '@/config/platformApiPermissionPhaseSix';
import {
  APP_RUNTIME_ROLES,
  getRoleAppRuntime,
  isRoleInAppRuntime,
} from '@/config/appRuntimeShell';
import {
  NAVIGATION_SHELLS,
  getRoleNavigationShellTabs,
  getRoleNavigationSplit,
} from '@/config/platformNavigationSplit';
import {
  roleDayIntent,
  roleSupportBenefits,
  roleWorkspaceConfig,
} from '@/config/roleWorkspaceUx';
import {
  isPathInRoleGoLiveScope,
} from '@/config/roleDashboardSpec';

const normalize = (path) => getNormalizedGoLivePath(path);

const dedupeTargets = (targets) => {
  const registry = new Map();

  targets.forEach((target) => {
    const key = `${target.source}|${target.label}|${target.path}`;
    if (!registry.has(key)) {
      registry.set(key, { ...target, normalizedPath: normalize(target.path) });
    }
  });

  return Array.from(registry.values());
};

const validateSevenBusinessGates = (role, path) => {
  const dataPolicy = getGoLiveDataPolicy(path);

  return {
    inScope: isPathInRoleGoLiveScope(role, path),
    routeRegistered: isPathRegisteredForGoLive(path),
    dataVisible: dataPolicy.visibleInGoLive !== false,
    backendLocked: areBackendContractsLockedForPath(path),
    actionLocked: canRoleAccessPath(role, path),
    foundationLocked: areFoundationDependenciesLockedForPath(path),
    platformApiLocked: isPlatformApiPermissionLockedForRolePath(role, path),
  };
};

const getFailures = (role, targets) =>
  targets.flatMap((target) => {
    const gates = validateSevenBusinessGates(role, target.path);
    const failedGates = Object.entries(gates)
      .filter(([, passed]) => !passed)
      .map(([gate]) => gate);

    if (!failedGates.length) {
      return [];
    }

    return [
      `${target.source} | ${target.label} | ${target.path} -> ${failedGates.join(', ')}`,
    ];
  });

const collectWorkspaceHighlightTargets = (role) =>
  dedupeTargets(
    (roleWorkspaceConfig[role]?.highlights || [])
      .filter((highlight) => highlight.link)
      .map((highlight) => ({
        source: 'workspace-highlight',
        label: highlight.label,
        path: highlight.link,
      })),
  );

const collectShellTargets = (role, shell) => {
  const tabs = getRoleNavigationShellTabs(role, shell);
  const targets = [];

  tabs.forEach((tab) => {
    (tab.children || []).forEach((subtab) => {
      if (subtab.path) {
        targets.push({
          source: `${shell}-subtab`,
          label: `${tab.label} / ${subtab.label}`,
          path: subtab.path,
        });
      }

      (subtab.grandchildren || []).forEach((grandchild) => {
        if (grandchild.path) {
          targets.push({
            source: `${shell}-leaf`,
            label: `${tab.label} / ${subtab.label} / ${grandchild.label}`,
            path: grandchild.path,
          });
        }
      });
    });
  });

  return dedupeTargets(targets);
};

const collectQuickActionTargets = (role) =>
  dedupeTargets(
    (QUICK_ACTIONS[role] || []).map((item) => ({
      source: 'quick-action',
      label: item.label,
      path: item.path,
    })),
  );

const collectAppRuntimeTargets = (role) => {
  if (!isRoleInAppRuntime(role)) {
    return [];
  }

  const runtime = getRoleAppRuntime(role);
  const targets = [
    { source: 'app-home', label: 'Trang chủ ứng dụng', path: runtime.homeRoute },
    { source: 'app-profile', label: 'Hồ sơ ứng dụng', path: '/app/ho-so' },
  ];

  (runtime.alerts || []).forEach((item) => {
    if (item.path) {
      targets.push({
        source: 'app-alert',
        label: item.title,
        path: item.path,
      });
    }
  });

  (runtime.quickActions || []).forEach((item) => {
    if (item.path) {
      targets.push({
        source: 'app-quick-action',
        label: item.label,
        path: item.path,
      });
    }
  });

  (runtime.tabs || []).forEach((tab) => {
    if (tab.primaryAction?.path) {
      targets.push({
        source: 'app-primary-action',
        label: `${tab.label} / ${tab.primaryAction.label}`,
        path: tab.primaryAction.path,
      });
    }

    (tab.secondaryActions || []).forEach((action) => {
      if (action.path) {
        targets.push({
          source: 'app-secondary-action',
          label: `${tab.label} / ${action.label}`,
          path: action.path,
        });
      }
    });
  });

  (runtime.extraLinks || []).forEach((item) => {
    if (item.path) {
      targets.push({
        source: 'app-extra-link',
        label: item.label,
        path: item.path,
      });
    }
  });

  return dedupeTargets(targets);
};

const collectUserSupportTargets = (role) =>
  dedupeTargets([
    ...collectWorkspaceHighlightTargets(role),
    ...collectShellTargets(role, NAVIGATION_SHELLS.WEB),
    ...collectShellTargets(role, NAVIGATION_SHELLS.APP),
    ...collectQuickActionTargets(role),
    ...collectAppRuntimeTargets(role),
  ]);

const CRITICAL_ROLE_JOBS = {
  admin: [
    { label: 'Quản lý người dùng', candidates: ['/settings/users'] },
    { label: 'Quản trị thay đổi', candidates: ['/settings/change-management', '/settings/governance-coverage'] },
    { label: 'Khóa quyền hành động', candidates: ['/settings/action-permissions', '/settings/roles'] },
  ],
  bod: [
    { label: 'Cảnh báo điều hành', candidates: ['/control/alerts'] },
    { label: 'Phê duyệt cấp cao', candidates: ['/finance/expenses?status=pending', '/contracts/pending'] },
    { label: 'Xem doanh thu lãnh đạo', candidates: ['/analytics/executive', '/control'] },
  ],
  manager: [
    { label: 'Lead nóng của đội', candidates: ['/crm/leads?status=hot'] },
    { label: 'Booking cần duyệt', candidates: ['/sales/bookings?status=pending'] },
    { label: 'KPI và tải đội', candidates: ['/kpi/team', '/work/manager'] },
  ],
  sales: [
    { label: 'Gọi khách nóng', candidates: ['/crm/leads?status=hot'] },
    { label: 'Đẩy giao dịch / giữ chỗ', candidates: ['/sales/pipeline', '/sales/bookings'] },
    { label: 'Lấy tài liệu bán hàng', candidates: ['/sales/product-center'] },
    { label: 'Xem tiền và KPI cá nhân', candidates: ['/finance/my-income', '/sales/kpi'] },
  ],
  marketing: [
    { label: 'Theo dõi chiến dịch', candidates: ['/marketing/campaigns'] },
    { label: 'Theo dõi nguồn khách', candidates: ['/marketing/sources'] },
    { label: 'Xử lý nội dung và kênh', candidates: ['/communications/content', '/communications/channels'] },
    { label: 'Kiểm form / attribution', candidates: ['/marketing/forms', '/marketing/attribution'] },
  ],
  finance: [
    { label: 'Xử lý chi phí', candidates: ['/finance/expenses?status=pending', '/finance/expenses'] },
    { label: 'Đối soát công nợ', candidates: ['/finance/receivables'] },
    { label: 'Kiểm hoa hồng', candidates: ['/commission', '/finance/commission'] },
    { label: 'Kiểm bảng lương', candidates: ['/payroll'] },
  ],
  hr: [
    { label: 'Tuyển dụng', candidates: ['/hr/recruitment'] },
    { label: 'Danh sách nhân sự', candidates: ['/hr/employees'] },
    { label: 'Đào tạo', candidates: ['/training'] },
  ],
  legal: [
    { label: 'Hồ sơ pháp lý dự án', candidates: ['/legal/licenses'] },
    { label: 'Hợp đồng chờ xử lý', candidates: ['/contracts/pending', '/legal/contracts'] },
    { label: 'Tài liệu cho kinh doanh', candidates: ['/legal/licenses?view=materials&status=ready', '/legal/licenses'] },
  ],
  content: [
    { label: 'Tổng quan CMS', candidates: ['/cms'] },
    { label: 'Bài viết / nội dung', candidates: ['/cms/articles', '/marketing/content'] },
    { label: 'Trang đích / dự án', candidates: ['/cms/landing-pages', '/cms/public-projects'] },
    { label: 'Hiệu suất trang web', candidates: ['/cms/analytics', '/marketing/forms'] },
  ],
  agency: [
    { label: 'Khách của tôi', candidates: ['/crm/leads?status=new', '/crm/leads'] },
    { label: 'Giữ chỗ của tôi', candidates: ['/sales/bookings'] },
    { label: 'Hoa hồng của tôi', candidates: ['/finance/my-income'] },
    { label: 'Tài liệu bán hàng', candidates: ['/sales/knowledge-center', '/sales/product-center'] },
  ],
};

const hasSupportPath = (targets, candidates) => {
  const rawSet = new Set(targets.map((target) => target.path));
  const normalizedSet = new Set(targets.map((target) => target.normalizedPath));

  return candidates.some((candidate) => rawSet.has(candidate) || normalizedSet.has(normalize(candidate)));
};

describe('User journey support is truly useful for each role', () => {
  test.each(ROLE_ORDER)('%s workspace supports the day with enough cues and actions', (role) => {
    const workspace = roleWorkspaceConfig[role];
    const benefits = roleSupportBenefits[role] || [];
    const dayIntent = roleDayIntent[role];
    const highlightTargets = collectWorkspaceHighlightTargets(role);
    const failures = getFailures(role, highlightTargets);

    if (!workspace) {
      expect(isRoleInAppRuntime(role)).toBe(true);
      return;
    }

    expect(workspace.highlights.length).toBeGreaterThanOrEqual(4);
    expect(workspace.queue.length).toBeGreaterThanOrEqual(3);
    expect(benefits.length).toBeGreaterThanOrEqual(3);
    expect(dayIntent.successSignals.length).toBeGreaterThanOrEqual(3);
    expect(highlightTargets.length).toBeGreaterThanOrEqual(3);
    expect(failures).toEqual([]);
  });

  test.each(ROLE_ORDER)('%s shell navigation exposes actionable paths on every active surface', (role) => {
    const split = getRoleNavigationSplit(role);
    const webTargets = collectShellTargets(role, NAVIGATION_SHELLS.WEB);
    const appTargets = collectShellTargets(role, NAVIGATION_SHELLS.APP);
    const failures = getFailures(role, [...webTargets, ...appTargets]);

    if (split.webTabIds.length > 0) {
      expect(webTargets.length).toBeGreaterThan(0);
    }

    if (split.appTabIds.length > 0) {
      expect(appTargets.length).toBeGreaterThan(0);
    }

    expect(failures).toEqual([]);
  });

  test.each(APP_RUNTIME_ROLES)('%s app runtime exposes đủ cảnh báo, hành động nhanh và đường xử lý', (role) => {
    const runtime = getRoleAppRuntime(role);
    const targets = collectAppRuntimeTargets(role);
    const failures = getFailures(role, targets);

    expect(runtime).toBeTruthy();
    expect(runtime.stats.length).toBeGreaterThanOrEqual(4);
    expect(runtime.todayItems.length).toBeGreaterThanOrEqual(3);
    expect(runtime.alerts.length).toBeGreaterThanOrEqual(3);
    expect(runtime.quickActions.length).toBeGreaterThanOrEqual(4);
    expect(runtime.tabs.length).toBeGreaterThanOrEqual(3);
    expect(targets.length).toBeGreaterThanOrEqual(10);
    expect(failures).toEqual([]);
  });

  test.each(ROLE_ORDER)('%s has enough support paths for critical jobs-to-be-done', (role) => {
    const targets = collectUserSupportTargets(role);
    const uncoveredJobs = (CRITICAL_ROLE_JOBS[role] || [])
      .filter((job) => !hasSupportPath(targets, job.candidates))
      .map((job) => job.label);

    expect(targets.length).toBeGreaterThanOrEqual(8);
    expect(uncoveredJobs).toEqual([]);
  });
});
