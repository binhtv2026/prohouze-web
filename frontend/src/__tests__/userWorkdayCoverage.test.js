import { ROLE_ORDER } from '@/config/roleGovernance';
import { QUICK_ACTIONS } from '@/config/navigation';
import {
  APP_RUNTIME_ROLES,
  getRoleAppRuntime,
  isRoleInAppRuntime,
} from '@/config/appRuntimeShell';
import {
  NAVIGATION_SHELLS,
  getRoleNavigationShellTabs,
} from '@/config/platformNavigationSplit';
import {
  roleWorkspaceConfig,
} from '@/config/roleWorkspaceUx';
import {
  getNormalizedGoLivePath,
} from '@/config/goLiveRouteRegistry';

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
    targets.push({
      source: 'app-tab',
      label: tab.label,
      path: `/app/${tab.key}`,
    });

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
    ...(roleWorkspaceConfig[role] ? [{ source: 'workspace-home', label: 'Trang chủ công việc', path: '/workspace' }] : []),
    { source: 'profile-self', label: 'Hồ sơ của tôi', path: '/me' },
    ...collectWorkspaceHighlightTargets(role),
    ...collectShellTargets(role, NAVIGATION_SHELLS.WEB),
    ...collectShellTargets(role, NAVIGATION_SHELLS.APP),
    ...collectQuickActionTargets(role),
    ...collectAppRuntimeTargets(role),
  ]);

const hasSupportPath = (targets, candidates) => {
  const rawSet = new Set(targets.map((target) => target.path));
  const normalizedSet = new Set(targets.map((target) => target.normalizedPath));

  return candidates.some((candidate) => rawSet.has(candidate) || normalizedSet.has(normalize(candidate)));
};

const ROLE_SUPPORT_DIMENSIONS = {
  admin: [
    { label: 'Bắt đầu ngày', candidates: ['/workspace'] },
    { label: 'Người dùng', candidates: ['/settings/users'] },
    { label: 'Quyền & vai trò', candidates: ['/settings/roles', '/settings/action-permissions'] },
    { label: 'Quản trị thay đổi', candidates: ['/settings/change-management'] },
    { label: 'Kiểm tra go-live', candidates: ['/settings/go-live-validation', '/settings/platform-field-validation', '/settings/platform-go-live-final'] },
    { label: 'Chiến lược nền tảng', candidates: ['/settings/platform-surfaces', '/settings/platform-launch-scope'] },
    { label: 'Hồ sơ bản thân', candidates: ['/me'] },
  ],
  bod: [
    { label: 'Bắt đầu ngày', candidates: ['/workspace', '/app'] },
    { label: 'Cảnh báo điều hành', candidates: ['/control/alerts'] },
    { label: 'Phê duyệt cấp cao', candidates: ['/contracts/pending', '/finance/expenses?status=pending'] },
    { label: 'Góc nhìn doanh thu', candidates: ['/analytics/executive', '/control'] },
    { label: 'Đội nhóm / quản lý', candidates: ['/kpi/team', '/work/manager'] },
    { label: 'Điều hành nhanh trên app', candidates: ['/app/canh-bao', '/app/duyet'] },
    { label: 'Hồ sơ bản thân', candidates: ['/me', '/app/ho-so'] },
  ],
  manager: [
    { label: 'Bắt đầu ngày', candidates: ['/workspace', '/app'] },
    { label: 'Khách nóng', candidates: ['/crm/leads?status=hot'] },
    { label: 'Booking cần xử lý', candidates: ['/sales/bookings?status=pending', '/sales/bookings'] },
    { label: 'Đội nhóm', candidates: ['/kpi/team', '/work/manager'] },
    { label: 'Việc quá hạn', candidates: ['/work/tasks?status=overdue', '/work/manager'] },
    { label: 'Điều hành nhanh trên app', candidates: ['/app/khach-nong', '/app/duyet'] },
    { label: 'Hồ sơ bản thân', candidates: ['/me', '/app/ho-so'] },
  ],
  sales: [
    { label: 'Bắt đầu ngày', candidates: ['/sales', '/app'] },
    { label: 'Khách nóng', candidates: ['/crm/leads?status=hot'] },
    { label: 'Giao dịch / booking', candidates: ['/sales/pipeline', '/sales/bookings'] },
    { label: 'Tài liệu bán hàng', candidates: ['/sales/product-center', '/sales/knowledge-center'] },
    { label: 'Tiền và KPI', candidates: ['/finance/my-income', '/sales/kpi'] },
    { label: 'Đội nhóm của tôi', candidates: ['/sales/my-team'] },
    { label: 'Hồ sơ bản thân', candidates: ['/me', '/app/ho-so'] },
  ],
  marketing: [
    { label: 'Bắt đầu ngày', candidates: ['/workspace', '/app'] },
    { label: 'Chiến dịch', candidates: ['/marketing/campaigns'] },
    { label: 'Nguồn khách', candidates: ['/marketing/sources'] },
    { label: 'Kênh / attribution', candidates: ['/marketing/attribution', '/communications/channels'] },
    { label: 'Nội dung / phản hồi', candidates: ['/communications/content', '/communications/templates'] },
    { label: 'Biểu mẫu / cảnh báo', candidates: ['/marketing/forms', '/app/canh-bao'] },
    { label: 'Hồ sơ bản thân', candidates: ['/me', '/app/ho-so'] },
  ],
  finance: [
    { label: 'Bắt đầu ngày', candidates: ['/workspace'] },
    { label: 'Chi phí', candidates: ['/finance/expenses?status=pending', '/finance/expenses'] },
    { label: 'Công nợ', candidates: ['/finance/receivables'] },
    { label: 'Hoa hồng', candidates: ['/commission', '/finance/commission'] },
    { label: 'Bảng lương', candidates: ['/payroll'] },
    { label: 'Doanh thu / cảnh báo', candidates: ['/finance', '/control/alerts'] },
    { label: 'Hồ sơ bản thân', candidates: ['/me'] },
  ],
  hr: [
    { label: 'Bắt đầu ngày', candidates: ['/workspace'] },
    { label: 'Tuyển dụng', candidates: ['/hr/recruitment'] },
    { label: 'Nhân sự', candidates: ['/hr/employees'] },
    { label: 'Đào tạo', candidates: ['/training'] },
    { label: 'Cơ cấu tổ chức', candidates: ['/hr/organization'] },
    { label: 'Chấm công / lương', candidates: ['/payroll', '/payroll/attendance'] },
    { label: 'Hồ sơ bản thân', candidates: ['/me'] },
  ],
  legal: [
    { label: 'Bắt đầu ngày', candidates: ['/workspace'] },
    { label: 'Pháp lý dự án', candidates: ['/legal/licenses'] },
    { label: 'Hợp đồng', candidates: ['/legal/contracts', '/contracts/pending'] },
    { label: 'Tài liệu cho kinh doanh', candidates: ['/legal/licenses?view=materials&status=ready', '/legal/licenses'] },
    { label: 'Tuân thủ', candidates: ['/legal/compliance', '/legal/regulations'] },
    { label: 'Cảnh báo nghẽn', candidates: ['/workspace', '/contracts/pending'] },
    { label: 'Hồ sơ bản thân', candidates: ['/me'] },
  ],
  content: [
    { label: 'Bắt đầu ngày', candidates: ['/workspace'] },
    { label: 'Dashboard CMS', candidates: ['/cms'] },
    { label: 'Bài viết', candidates: ['/cms/articles', '/marketing/content'] },
    { label: 'Trang / landing', candidates: ['/cms/pages', '/cms/landing-pages'] },
    { label: 'Biểu mẫu / CTA', candidates: ['/marketing/forms', '/cms/landing-pages'] },
    { label: 'Hiệu suất / analytics', candidates: ['/cms/analytics'] },
    { label: 'Hồ sơ bản thân', candidates: ['/me'] },
  ],
  agency: [
    { label: 'Bắt đầu ngày', candidates: ['/app'] },
    { label: 'Khách của tôi', candidates: ['/crm/leads', '/crm/contacts?status=active'] },
    { label: 'Booking của tôi', candidates: ['/sales/bookings'] },
    { label: 'Tài liệu bán hàng', candidates: ['/sales/knowledge-center', '/sales/product-center'] },
    { label: 'Hoa hồng', candidates: ['/finance/my-income'] },
    { label: 'Tiến độ giao dịch', candidates: ['/sales/pipeline'] },
    { label: 'Hồ sơ bản thân', candidates: ['/app/ho-so', '/me'] },
  ],
};

describe('Each role has 7 support dimensions for a strong workday flow', () => {
  test.each(ROLE_ORDER)('%s has đủ 7 chiều hỗ trợ công việc trong ngày', (role) => {
    const targets = collectUserSupportTargets(role);
    const uncoveredDimensions = (ROLE_SUPPORT_DIMENSIONS[role] || [])
      .filter((dimension) => !hasSupportPath(targets, dimension.candidates))
      .map((dimension) => dimension.label);

    expect(ROLE_SUPPORT_DIMENSIONS[role]).toHaveLength(7);
    expect(targets.length).toBeGreaterThanOrEqual(8);
    expect(uncoveredDimensions).toEqual([]);
  });

  test.each(APP_RUNTIME_ROLES)('%s app runtime covers at least 7 user-facing action paths', (role) => {
    const targets = collectAppRuntimeTargets(role);
    const actionTargets = targets.filter((target) => target.source !== 'app-home' && target.source !== 'app-profile');

    expect(targets.length).toBeGreaterThanOrEqual(10);
    expect(actionTargets.length).toBeGreaterThanOrEqual(7);
  });
});
