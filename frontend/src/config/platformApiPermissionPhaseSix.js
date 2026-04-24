import { ROLES } from '@/config/navigation';
import { GO_LIVE_BACKEND_CONTRACTS } from '@/config/goLiveBackendContracts';
import { GO_LIVE_ACTION_PERMISSIONS, getRouteActionContract } from '@/config/goLiveActionPermissions';

export const PLATFORM_API_PERMISSION_PHASE_6 = {
  id: 'platform_api_permission_phase_6_locked',
  label: 'Khóa API + permission theo web/app',
  description: 'Mỗi cụm web/app/hybrid phải map tới backend contract và permission resource.action cụ thể. Không chỉ tách UI, mà tách luôn contract và quyền thực thi.',
};

export const PLATFORM_CLIENTS = {
  WEB: 'web',
  APP: 'app',
  BOTH: 'both',
};

export const PLATFORM_CLIENT_META = {
  [PLATFORM_CLIENTS.WEB]: {
    key: PLATFORM_CLIENTS.WEB,
    label: 'Web only',
    badgeClassName: 'bg-sky-100 text-sky-700 border-0',
  },
  [PLATFORM_CLIENTS.APP]: {
    key: PLATFORM_CLIENTS.APP,
    label: 'App only',
    badgeClassName: 'bg-emerald-100 text-emerald-700 border-0',
  },
  [PLATFORM_CLIENTS.BOTH]: {
    key: PLATFORM_CLIENTS.BOTH,
    label: 'Web + App',
    badgeClassName: 'bg-amber-100 text-amber-700 border-0',
  },
};

const contractKeys = new Set(GO_LIVE_BACKEND_CONTRACTS.map((item) => item.key));
const permissionKeys = new Set(Object.keys(GO_LIVE_ACTION_PERMISSIONS));
const contractMap = new Map(GO_LIVE_BACKEND_CONTRACTS.map((item) => [item.key, item]));

const requirement = (resource, actions) => ({ resource, actions });

const normalizePathname = (path = '/') => {
  if (!path) return '/';

  try {
    return new URL(path, 'http://localhost').pathname || '/';
  } catch (_error) {
    return path.split('?')[0] || '/';
  }
};

export const PLATFORM_API_PERMISSION_MATRIX = [
  {
    id: 'sales_app_runtime',
    label: 'Sales app runtime',
    client: PLATFORM_CLIENTS.APP,
    roles: [ROLES.SALES],
    contracts: [
      'auth.me',
      'crm.leads.list',
      'crm.contacts.list',
      'crm.demands.list',
      'sales.pipeline',
      'sales.soft-bookings',
      'sales.hard-bookings',
      'sales.events',
      'sales.stage-config',
      'finance.commissions',
      'work.tasks',
      'work.calendar',
      'kpi.core',
    ],
    permissions: [
      requirement('workspace', ['view']),
      requirement('profile', ['view', 'edit']),
      requirement('crm_leads', ['view', 'create', 'edit']),
      requirement('crm_contacts', ['view', 'create', 'edit']),
      requirement('crm_demands', ['view', 'create', 'edit']),
      requirement('sales_pipeline', ['view', 'create', 'edit']),
      requirement('sales_bookings', ['view', 'create', 'edit']),
      requirement('sales_products', ['view', 'export']),
      requirement('sales_channels', ['view', 'create', 'edit', 'publish']),
      requirement('finance_commissions', ['view']),
      requirement('work_tasks', ['view', 'create', 'edit']),
      requirement('work_calendar', ['view', 'create', 'edit']),
      requirement('kpi', ['view']),
    ],
    why: 'Sales app chỉ được gọi đúng API bán hàng và quyền thao tác cá nhân/team liên quan đến chốt deal trong ngày.',
  },
  {
    id: 'agency_app_runtime',
    label: 'CTV / Đại lý app runtime',
    client: PLATFORM_CLIENTS.APP,
    roles: [ROLES.AGENCY],
    contracts: [
      'auth.me',
      'crm.leads.list',
      'crm.contacts.list',
      'sales.pipeline',
      'sales.soft-bookings',
      'finance.commissions',
      'work.tasks',
      'work.calendar',
    ],
    permissions: [
      requirement('workspace', ['view']),
      requirement('profile', ['view', 'edit']),
      requirement('crm_leads', ['view', 'create', 'edit']),
      requirement('crm_contacts', ['view', 'create', 'edit']),
      requirement('sales_pipeline', ['view']),
      requirement('sales_bookings', ['view', 'create']),
      requirement('sales_products', ['view', 'export']),
      requirement('finance_commissions', ['view']),
      requirement('work_tasks', ['view']),
      requirement('work_calendar', ['view']),
    ],
    why: 'CTV / Đại lý app phải cực gọn: chỉ giữ khách, booking, tài liệu và hoa hồng của chính mình.',
  },
  {
    id: 'manager_hybrid_runtime',
    label: 'Manager hybrid runtime',
    client: PLATFORM_CLIENTS.BOTH,
    roles: [ROLES.MANAGER],
    contracts: [
      'auth.me',
      'crm.leads.list',
      'crm.contacts.list',
      'crm.demands.list',
      'sales.pipeline',
      'sales.soft-bookings',
      'sales.hard-bookings',
      'finance.commissions',
      'hr.employees',
      'work.tasks',
      'work.calendar',
      'kpi.core',
    ],
    permissions: [
      requirement('workspace', ['view']),
      requirement('profile', ['view', 'edit']),
      requirement('crm_leads', ['view', 'assign', 'export']),
      requirement('crm_contacts', ['view', 'export']),
      requirement('crm_demands', ['view', 'export']),
      requirement('sales_pipeline', ['view', 'approve', 'export']),
      requirement('sales_bookings', ['view', 'approve', 'export']),
      requirement('contracts', ['view']),
      requirement('finance_revenue', ['view']),
      requirement('finance_commissions', ['view', 'export']),
      requirement('hr_employees', ['view']),
      requirement('work_tasks', ['view', 'create', 'edit', 'approve']),
      requirement('work_calendar', ['view', 'create', 'edit']),
      requirement('kpi', ['view', 'configure', 'export']),
    ],
    why: 'Manager dùng cả web và app, nên contract và permission phải chặn đúng phạm vi điều hành đội chứ không tràn sang BO.',
  },
  {
    id: 'bod_hybrid_runtime',
    label: 'BOD hybrid runtime',
    client: PLATFORM_CLIENTS.BOTH,
    roles: [ROLES.BOD],
    contracts: [
      'auth.me',
      'crm.leads.list',
      'sales.pipeline',
      'sales.soft-bookings',
      'sales.hard-bookings',
      'marketing.attribution',
      'finance.dashboard',
      'finance.expenses',
      'finance.receivables',
      'finance.commissions',
      'legal.licenses',
      'legal.contracts',
      'analytics.executive',
    ],
    permissions: [
      requirement('workspace', ['view']),
      requirement('profile', ['view', 'edit']),
      requirement('crm_leads', ['view', 'export']),
      requirement('sales_pipeline', ['view', 'approve', 'export']),
      requirement('sales_bookings', ['view', 'approve', 'export']),
      requirement('contracts', ['view', 'approve', 'export']),
      requirement('marketing_campaigns', ['view', 'export']),
      requirement('finance_revenue', ['view', 'export']),
      requirement('finance_expenses', ['view', 'approve', 'export']),
      requirement('finance_receivables', ['view', 'export']),
      requirement('finance_commissions', ['view', 'approve', 'export']),
      requirement('legal_licenses', ['view', 'export']),
      requirement('analytics', ['view', 'export']),
    ],
    why: 'BOD chỉ được nhìn và duyệt theo bề mặt điều hành, không bị lẫn các quyền create/edit kiểu BO sâu.',
  },
  {
    id: 'marketing_hybrid_runtime',
    label: 'Marketing hybrid runtime',
    client: PLATFORM_CLIENTS.BOTH,
    roles: [ROLES.MARKETING],
    contracts: [
      'auth.me',
      'crm.leads.list',
      'marketing.campaigns',
      'marketing.sources',
      'marketing.forms',
      'marketing.attribution',
    ],
    permissions: [
      requirement('workspace', ['view']),
      requirement('profile', ['view', 'edit']),
      requirement('crm_leads', ['view', 'create', 'edit', 'export']),
      requirement('marketing_campaigns', ['view', 'create', 'edit', 'export']),
      requirement('marketing_content', ['view', 'create', 'edit', 'approve', 'publish', 'export']),
      requirement('marketing_forms', ['view', 'create', 'edit', 'configure']),
    ],
    why: 'Marketing dùng cả web và app theo dõi, nhưng quyền thực thi vẫn phải bám đúng campaign/content/forms.',
  },
  {
    id: 'admin_web_runtime',
    label: 'Admin / System web runtime',
    client: PLATFORM_CLIENTS.WEB,
    roles: [ROLES.ADMIN],
    contracts: [
      'auth.login',
      'auth.me',
      'cms.pages',
      'cms.articles',
      'cms.analytics',
    ],
    permissions: [
      requirement('workspace', ['view']),
      requirement('profile', ['view', 'edit']),
      requirement('settings_users', ['view', 'create', 'edit', 'delete', 'configure']),
      requirement('settings_roles', ['view', 'edit', 'approve', 'configure']),
      requirement('settings_governance', ['view', 'edit', 'approve', 'configure']),
      requirement('cms', ['view', 'create', 'edit', 'publish', 'configure']),
      requirement('analytics', ['view', 'export']),
    ],
    why: 'Admin web phải khóa toàn bộ quyền hệ thống, CMS và governance; tuyệt đối không mở app-only runtime ở đây.',
  },
  {
    id: 'finance_web_runtime',
    label: 'Finance web runtime',
    client: PLATFORM_CLIENTS.WEB,
    roles: [ROLES.FINANCE],
    contracts: [
      'auth.me',
      'finance.dashboard',
      'finance.expenses',
      'finance.receivables',
      'finance.commissions',
      'payroll.core',
      'payroll.attendance',
    ],
    permissions: [
      requirement('workspace', ['view']),
      requirement('profile', ['view', 'edit']),
      requirement('finance_revenue', ['view', 'export']),
      requirement('finance_expenses', ['view', 'create', 'edit', 'approve', 'export']),
      requirement('finance_receivables', ['view', 'edit', 'approve', 'export']),
      requirement('finance_commissions', ['view', 'edit', 'approve', 'export']),
      requirement('payroll', ['view', 'edit', 'approve', 'export']),
      requirement('analytics', ['view']),
    ],
    why: 'Finance là web-first và phải dùng đúng contract tài chính/payroll, không đi vòng qua route app hay contract không liên quan.',
  },
  {
    id: 'hr_web_runtime',
    label: 'HR web runtime',
    client: PLATFORM_CLIENTS.WEB,
    roles: [ROLES.HR],
    contracts: [
      'auth.me',
      'hr.recruitment',
      'hr.employees',
      'hr.training',
      'payroll.attendance',
    ],
    permissions: [
      requirement('workspace', ['view']),
      requirement('profile', ['view', 'edit']),
      requirement('hr_recruitment', ['view', 'create', 'edit', 'approve', 'export']),
      requirement('hr_employees', ['view', 'create', 'edit', 'export']),
      requirement('hr_training', ['view', 'create', 'edit', 'approve']),
      requirement('payroll', ['view']),
    ],
    why: 'HR web phải bám đúng contract tuyển dụng/nhân sự/đào tạo, không tràn sang runtime tài chính hay sales.',
  },
  {
    id: 'legal_web_runtime',
    label: 'Legal web runtime',
    client: PLATFORM_CLIENTS.WEB,
    roles: [ROLES.LEGAL],
    contracts: [
      'auth.me',
      'legal.licenses',
      'legal.contracts',
    ],
    permissions: [
      requirement('workspace', ['view']),
      requirement('profile', ['view', 'edit']),
      requirement('legal_licenses', ['view', 'create', 'edit', 'approve', 'export']),
      requirement('contracts', ['view', 'create', 'edit', 'approve', 'export']),
    ],
    why: 'Legal web chỉ dùng contract và quyền pháp lý/hợp đồng, tránh nhập nhằng với sales runtime.',
  },
  {
    id: 'cms_web_runtime',
    label: 'CMS web runtime',
    client: PLATFORM_CLIENTS.WEB,
    roles: [ROLES.CONTENT],
    contracts: [
      'auth.me',
      'cms.pages',
      'cms.articles',
      'marketing.forms',
      'cms.analytics',
    ],
    permissions: [
      requirement('workspace', ['view']),
      requirement('profile', ['view', 'edit']),
      requirement('cms', ['view', 'create', 'edit', 'publish', 'configure']),
      requirement('marketing_forms', ['view', 'configure']),
    ],
    why: 'CMS web phải gắn với pages/articles/forms/analytics, không được dùng chung runtime của marketing setup hay admin system.',
  },
];

export function getPlatformApiPermissionMatrix() {
  return PLATFORM_API_PERMISSION_MATRIX.map((item) => {
    const missingContracts = item.contracts.filter((key) => !contractKeys.has(key));
    const missingPermissions = item.permissions.filter((entry) => !permissionKeys.has(entry.resource));
    const missingActions = item.permissions.flatMap((entry) => {
      const actions = GO_LIVE_ACTION_PERMISSIONS[entry.resource]?.actions || {};
      return entry.actions.filter((action) => !actions[action]).map((action) => `${entry.resource}.${action}`);
    });

    return {
      ...item,
      missingContracts,
      missingPermissions,
      missingActions,
      locked: missingContracts.length === 0 && missingPermissions.length === 0 && missingActions.length === 0,
    };
  });
}

export function getPlatformApiPermissionSummary() {
  const matrix = getPlatformApiPermissionMatrix();
  return {
    totalRuntimeClusters: matrix.length,
    fullyLockedClusters: matrix.filter((item) => item.locked).length,
    webClusters: matrix.filter((item) => item.client === PLATFORM_CLIENTS.WEB).length,
    appClusters: matrix.filter((item) => item.client === PLATFORM_CLIENTS.APP).length,
    sharedClusters: matrix.filter((item) => item.client === PLATFORM_CLIENTS.BOTH).length,
    fullyLocked: matrix.every((item) => item.locked),
  };
}

export function getPlatformApiPermissionRuntimeForRolePath(role, path = '/') {
  const pathname = normalizePathname(path);
  const routeActionContract = getRouteActionContract(path);
  const matrix = getPlatformApiPermissionMatrix();

  return (
    matrix.find((item) => {
      if (!item.roles.includes(role)) return false;

      const contractMatched = item.contracts.some((key) => {
        const contract = contractMap.get(key);
        return (contract?.routePrefixes || []).some(
          (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
        );
      });

      if (contractMatched) return true;

      if (!routeActionContract) return false;

      return item.permissions.some((entry) => entry.resource === routeActionContract.resource);
    }) || null
  );
}

export function isPlatformApiPermissionLockedForRolePath(role, path = '/') {
  const runtime = getPlatformApiPermissionRuntimeForRolePath(role, path);

  if (!runtime) {
    return true;
  }

  return runtime.locked;
}
