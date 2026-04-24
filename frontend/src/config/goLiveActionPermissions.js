import { ROLES } from '@/config/navigation';

export const ACTION_SCOPE = {
  NONE: 'none',
  SELF: 'self',
  TEAM: 'team',
  DEPARTMENT: 'department',
  BRANCH: 'branch',
  ALL: 'all',
};

export const ACTION_KEYS = ['view', 'create', 'edit', 'delete', 'assign', 'approve', 'export', 'configure', 'publish'];

const roleMap = (entries) => ({
  [ROLES.ADMIN]:            entries.admin            || ACTION_SCOPE.NONE,
  [ROLES.BOD]:              entries.bod              || ACTION_SCOPE.NONE,
  [ROLES.MANAGER]:          entries.manager          || ACTION_SCOPE.NONE,
  [ROLES.SALES]:            entries.sales            || ACTION_SCOPE.NONE,
  [ROLES.MARKETING]:        entries.marketing        || ACTION_SCOPE.NONE,
  [ROLES.FINANCE]:          entries.finance          || ACTION_SCOPE.NONE,
  [ROLES.HR]:               entries.hr               || ACTION_SCOPE.NONE,
  [ROLES.LEGAL]:            entries.legal            || ACTION_SCOPE.NONE,
  [ROLES.CONTENT]:          entries.content          || ACTION_SCOPE.NONE,
  [ROLES.AGENCY]:           entries.agency           || ACTION_SCOPE.NONE,
  [ROLES.PROJECT_DIRECTOR]: entries.project_director || ACTION_SCOPE.NONE,
  [ROLES.SALES_SUPPORT]:    entries.sales_support    || ACTION_SCOPE.NONE,
  [ROLES.AUDIT]:            entries.audit            || ACTION_SCOPE.NONE,
});

export const GO_LIVE_ACTION_PERMISSIONS = {
  workspace: {
    label: 'Workspace theo vai trò',
    actions: {
      view: roleMap({ admin: 'all', bod: 'all', manager: 'all', sales: 'self', marketing: 'department', finance: 'department', hr: 'department', legal: 'department', content: 'department', agency: 'self', project_director: 'branch', sales_support: 'team', audit: 'all' }),
    },
  },
  profile: {
    label: 'Hồ sơ cá nhân',
    actions: {
      view: roleMap({ admin: 'all', bod: 'self', manager: 'self', sales: 'self', marketing: 'self', finance: 'self', hr: 'self', legal: 'self', content: 'self', agency: 'self' }),
      edit: roleMap({ admin: 'all', bod: 'self', manager: 'self', sales: 'self', marketing: 'self', finance: 'self', hr: 'self', legal: 'self', content: 'self', agency: 'self' }),
    },
  },
  crm_leads: {
    label: 'Lead CRM',
    actions: {
      view: roleMap({ admin: 'all', bod: 'all', manager: 'team', sales: 'self', marketing: 'department', agency: 'self', project_director: 'branch', sales_support: 'team', audit: 'all' }),
      create: roleMap({ admin: 'all', manager: 'team', sales: 'self', marketing: 'department', agency: 'self', project_director: 'branch' }),
      edit: roleMap({ admin: 'all', manager: 'team', sales: 'self', marketing: 'department', agency: 'self', project_director: 'branch' }),
      assign: roleMap({ admin: 'all', manager: 'team', project_director: 'branch' }),
      export: roleMap({ admin: 'all', bod: 'all', manager: 'team', marketing: 'department', audit: 'all' }),
    },
  },
  crm_contacts: {
    label: 'Khách hàng CRM',
    actions: {
      view: roleMap({ admin: 'all', bod: 'all', manager: 'team', sales: 'self', agency: 'self', project_director: 'branch', sales_support: 'team', audit: 'all' }),
      create: roleMap({ admin: 'all', manager: 'team', sales: 'self', agency: 'self', project_director: 'branch', sales_support: 'team' }),
      edit: roleMap({ admin: 'all', manager: 'team', sales: 'self', agency: 'self', project_director: 'branch', sales_support: 'team' }),
      export: roleMap({ admin: 'all', bod: 'all', manager: 'team', audit: 'all' }),
    },
  },
  crm_demands: {
    label: 'Nhu cầu khách',
    actions: {
      view: roleMap({ admin: 'all', bod: 'all', manager: 'team', sales: 'self' }),
      create: roleMap({ admin: 'all', manager: 'team', sales: 'self' }),
      edit: roleMap({ admin: 'all', manager: 'team', sales: 'self' }),
      export: roleMap({ admin: 'all', manager: 'team' }),
    },
  },
  sales_pipeline: {
    label: 'Pipeline giao dịch',
    actions: {
      view: roleMap({ admin: 'all', bod: 'all', manager: 'team', sales: 'self', agency: 'self' }),
      create: roleMap({ admin: 'all', manager: 'team', sales: 'self' }),
      edit: roleMap({ admin: 'all', manager: 'team', sales: 'self' }),
      approve: roleMap({ admin: 'all', bod: 'all', manager: 'team' }),
      export: roleMap({ admin: 'all', bod: 'all', manager: 'team' }),
    },
  },
  sales_bookings: {
    label: 'Booking',
    actions: {
      view: roleMap({ admin: 'all', bod: 'all', manager: 'team', sales: 'self', agency: 'self', project_director: 'branch', sales_support: 'team', audit: 'all' }),
      create: roleMap({ admin: 'all', manager: 'team', sales: 'self', agency: 'self', project_director: 'branch' }),
      edit: roleMap({ admin: 'all', manager: 'team', sales: 'self', sales_support: 'team' }),
      approve: roleMap({ admin: 'all', bod: 'all', manager: 'team', project_director: 'branch' }),
      export: roleMap({ admin: 'all', bod: 'all', manager: 'team', finance: 'department', audit: 'all' }),
    },
  },
  contracts: {
    label: 'Hợp đồng',
    actions: {
      view: roleMap({ admin: 'all', bod: 'all', manager: 'team', sales: 'self', legal: 'department' }),
      create: roleMap({ admin: 'all', manager: 'team', sales: 'self', legal: 'department' }),
      edit: roleMap({ admin: 'all', legal: 'department' }),
      approve: roleMap({ admin: 'all', bod: 'all', legal: 'department' }),
      export: roleMap({ admin: 'all', bod: 'all', manager: 'team', legal: 'department', finance: 'department' }),
    },
  },
  sales_products: {
    label: 'Sản phẩm / dự án bán hàng',
    actions: {
      view: roleMap({ admin: 'all', bod: 'all', manager: 'team', sales: 'self', marketing: 'department', legal: 'department', agency: 'self' }),
      export: roleMap({ admin: 'all', bod: 'all', manager: 'team', sales: 'self', agency: 'self' }),
    },
  },
  sales_channels: {
    label: 'Kênh bán hàng cá nhân',
    actions: {
      view: roleMap({ admin: 'all', manager: 'team', sales: 'self', marketing: 'department', agency: 'self' }),
      create: roleMap({ admin: 'all', sales: 'self', marketing: 'department', agency: 'self' }),
      edit: roleMap({ admin: 'all', sales: 'self', marketing: 'department', agency: 'self' }),
      publish: roleMap({ admin: 'all', marketing: 'department', sales: 'self', agency: 'self' }),
    },
  },
  marketing_campaigns: {
    label: 'Chiến dịch marketing',
    actions: {
      view: roleMap({ admin: 'all', bod: 'all', manager: 'team', marketing: 'department' }),
      create: roleMap({ admin: 'all', marketing: 'department' }),
      edit: roleMap({ admin: 'all', marketing: 'department' }),
      approve: roleMap({ admin: 'all', bod: 'all', manager: 'team' }),
      export: roleMap({ admin: 'all', bod: 'all', marketing: 'department' }),
    },
  },
  marketing_content: {
    label: 'Nội dung marketing',
    actions: {
      view: roleMap({ admin: 'all', bod: 'all', marketing: 'department', content: 'department', sales: 'self' }),
      create: roleMap({ admin: 'all', marketing: 'department', content: 'department' }),
      edit: roleMap({ admin: 'all', marketing: 'department', content: 'department' }),
      approve: roleMap({ admin: 'all', marketing: 'department', content: 'department' }),
      publish: roleMap({ admin: 'all', marketing: 'department', content: 'department' }),
      export: roleMap({ admin: 'all', marketing: 'department', content: 'department', sales: 'self' }),
    },
  },
  marketing_forms: {
    label: 'Form & tracking',
    actions: {
      view: roleMap({ admin: 'all', bod: 'all', marketing: 'department', content: 'department' }),
      create: roleMap({ admin: 'all', marketing: 'department', content: 'department' }),
      edit: roleMap({ admin: 'all', marketing: 'department', content: 'department' }),
      configure: roleMap({ admin: 'all', marketing: 'department', content: 'department' }),
    },
  },
  finance_revenue: {
    label: 'Doanh thu tài chính',
    actions: {
      view: roleMap({ admin: 'all', bod: 'all', finance: 'department', manager: 'team', sales: 'self' }),
      export: roleMap({ admin: 'all', bod: 'all', finance: 'department' }),
    },
  },
  finance_expenses: {
    label: 'Chi phí',
    actions: {
      view: roleMap({ admin: 'all', bod: 'all', manager: 'team', finance: 'department' }),
      create: roleMap({ admin: 'all', finance: 'department', manager: 'team' }),
      edit: roleMap({ admin: 'all', finance: 'department' }),
      approve: roleMap({ admin: 'all', bod: 'all', finance: 'department' }),
      export: roleMap({ admin: 'all', bod: 'all', finance: 'department' }),
    },
  },
  finance_receivables: {
    label: 'Công nợ',
    actions: {
      view: roleMap({ admin: 'all', bod: 'all', finance: 'department' }),
      edit: roleMap({ admin: 'all', finance: 'department' }),
      approve: roleMap({ admin: 'all', finance: 'department' }),
      export: roleMap({ admin: 'all', bod: 'all', finance: 'department' }),
    },
  },
  finance_commissions: {
    label: 'Hoa hồng',
    actions: {
      view: roleMap({ admin: 'all', bod: 'all', finance: 'department', sales: 'self', agency: 'self' }),
      edit: roleMap({ admin: 'all', finance: 'department' }),
      approve: roleMap({ admin: 'all', bod: 'all', finance: 'department' }),
      export: roleMap({ admin: 'all', bod: 'all', finance: 'department', sales: 'self' }),
    },
  },
  payroll: {
    label: 'Payroll',
    actions: {
      view: roleMap({ admin: 'all', finance: 'department', hr: 'department', sales: 'self', marketing: 'self', legal: 'self', content: 'self' }),
      edit: roleMap({ admin: 'all', finance: 'department', hr: 'department' }),
      approve: roleMap({ admin: 'all', finance: 'department' }),
      export: roleMap({ admin: 'all', finance: 'department', hr: 'department' }),
    },
  },
  hr_recruitment: {
    label: 'Tuyển dụng',
    actions: {
      view: roleMap({ admin: 'all', bod: 'all', hr: 'department', manager: 'team' }),
      create: roleMap({ admin: 'all', hr: 'department' }),
      edit: roleMap({ admin: 'all', hr: 'department' }),
      approve: roleMap({ admin: 'all', hr: 'department' }),
      export: roleMap({ admin: 'all', hr: 'department' }),
    },
  },
  hr_employees: {
    label: 'Nhân sự',
    actions: {
      view: roleMap({ admin: 'all', bod: 'all', hr: 'department', manager: 'team' }),
      create: roleMap({ admin: 'all', hr: 'department' }),
      edit: roleMap({ admin: 'all', hr: 'department' }),
      export: roleMap({ admin: 'all', hr: 'department' }),
    },
  },
  hr_training: {
    label: 'Đào tạo',
    actions: {
      view: roleMap({ admin: 'all', hr: 'department', manager: 'team', sales: 'self', marketing: 'self', finance: 'self', legal: 'self', content: 'self' }),
      create: roleMap({ admin: 'all', hr: 'department' }),
      edit: roleMap({ admin: 'all', hr: 'department' }),
      approve: roleMap({ admin: 'all', hr: 'department' }),
    },
  },
  legal_licenses: {
    label: 'Pháp lý dự án',
    actions: {
      view: roleMap({ admin: 'all', bod: 'all', legal: 'department', sales: 'self', manager: 'team' }),
      create: roleMap({ admin: 'all', legal: 'department' }),
      edit: roleMap({ admin: 'all', legal: 'department' }),
      approve: roleMap({ admin: 'all', legal: 'department', bod: 'all' }),
      export: roleMap({ admin: 'all', legal: 'department', sales: 'self' }),
    },
  },
  work_tasks: {
    label: 'Công việc',
    actions: {
      view: roleMap({ admin: 'all', bod: 'all', manager: 'team', sales: 'self', marketing: 'self', finance: 'self', hr: 'department', legal: 'self', content: 'self', agency: 'self' }),
      create: roleMap({ admin: 'all', manager: 'team', sales: 'self', marketing: 'self', finance: 'self', hr: 'department', legal: 'self', content: 'self' }),
      edit: roleMap({ admin: 'all', manager: 'team', sales: 'self', marketing: 'self', finance: 'self', hr: 'department', legal: 'self', content: 'self' }),
      approve: roleMap({ admin: 'all', manager: 'team' }),
    },
  },
  work_calendar: {
    label: 'Lịch làm việc',
    actions: {
      view: roleMap({ admin: 'all', bod: 'all', manager: 'team', sales: 'self', marketing: 'self', finance: 'self', hr: 'department', legal: 'self', content: 'self', agency: 'self' }),
      create: roleMap({ admin: 'all', manager: 'team', sales: 'self', marketing: 'self', finance: 'self', hr: 'department', legal: 'self', content: 'self' }),
      edit: roleMap({ admin: 'all', manager: 'team', sales: 'self', marketing: 'self', finance: 'self', hr: 'department', legal: 'self', content: 'self' }),
    },
  },
  kpi: {
    label: 'KPI & xếp hạng',
    actions: {
      view: roleMap({ admin: 'all', bod: 'all', manager: 'team', sales: 'self', hr: 'department', agency: 'self', project_director: 'branch', audit: 'all' }),
      configure: roleMap({ admin: 'all', hr: 'department', manager: 'team', project_director: 'branch' }),
      export: roleMap({ admin: 'all', bod: 'all', hr: 'department', manager: 'team', audit: 'all' }),
    },
  },
  cms: {
    label: 'Website / CMS',
    actions: {
      view: roleMap({ admin: 'all', bod: 'all', content: 'department', marketing: 'department' }),
      create: roleMap({ admin: 'all', content: 'department' }),
      edit: roleMap({ admin: 'all', content: 'department' }),
      publish: roleMap({ admin: 'all', content: 'department', marketing: 'department' }),
      configure: roleMap({ admin: 'all', content: 'department' }),
    },
  },
  analytics: {
    label: 'Phân tích điều hành',
    actions: {
      view: roleMap({ admin: 'all', bod: 'all', finance: 'department', audit: 'all', project_director: 'branch' }),
      export: roleMap({ admin: 'all', bod: 'all', finance: 'department', audit: 'all' }),
    },
  },
  settings_users: {
    label: 'Quản trị người dùng',
    actions: {
      view: roleMap({ admin: 'all' }),
      create: roleMap({ admin: 'all' }),
      edit: roleMap({ admin: 'all' }),
      delete: roleMap({ admin: 'all' }),
      configure: roleMap({ admin: 'all' }),
    },
  },
  settings_roles: {
    label: 'Vai trò & quyền',
    actions: {
      view: roleMap({ admin: 'all' }),
      edit: roleMap({ admin: 'all' }),
      approve: roleMap({ admin: 'all' }),
      configure: roleMap({ admin: 'all' }),
    },
  },
  settings_governance: {
    label: 'Governance & cấu hình nền',
    actions: {
      view: roleMap({ admin: 'all' }),
      edit: roleMap({ admin: 'all' }),
      approve: roleMap({ admin: 'all' }),
      configure: roleMap({ admin: 'all' }),
    },
  },
};

export const GO_LIVE_ROUTE_ACTION_MAP = [
  { prefixes: ['/workspace', '/dashboard'], resource: 'workspace', action: 'view' },
  { prefixes: ['/manager'], resource: 'workspace', action: 'view' },
  { prefixes: ['/me'], resource: 'profile', action: 'view' },
  { prefixes: ['/control', '/control/alerts'], resource: 'analytics', action: 'view' },
  { prefixes: ['/crm/leads'], resource: 'crm_leads', action: 'view' },
  { prefixes: ['/crm/contacts'], resource: 'crm_contacts', action: 'view' },
  { prefixes: ['/crm/demands'], resource: 'crm_demands', action: 'view' },
  { prefixes: ['/sales/knowledge-center'], resource: 'sales_products', action: 'view' },
  { prefixes: ['/sales/finance-center'], resource: 'finance_commissions', action: 'view' },
  { prefixes: ['/sales/kanban', '/sales', '/sales/pipeline', '/sales/deals'], resource: 'sales_pipeline', action: 'view' },
  { prefixes: ['/sales/soft-bookings', '/sales/hard-bookings', '/sales/bookings'], resource: 'sales_bookings', action: 'view' },
  { prefixes: ['/sales/contracts', '/legal/contracts', '/contracts'], resource: 'contracts', action: 'view' },
  { prefixes: ['/sales/product-center', '/sales/products', '/sales/projects', '/sales/pricing'], resource: 'sales_products', action: 'view' },
  { prefixes: ['/sales/channel-center'], resource: 'sales_channels', action: 'view' },
  { prefixes: ['/marketing', '/marketing/campaigns', '/marketing/rules'], resource: 'marketing_campaigns', action: 'view' },
  { prefixes: ['/marketing/content', '/communications/content', '/communications/templates'], resource: 'marketing_content', action: 'view' },
  { prefixes: ['/marketing/forms', '/marketing/attribution', '/communications/forms', '/communications/attribution'], resource: 'marketing_forms', action: 'view' },
  { prefixes: ['/marketing/sources', '/communications/channels'], resource: 'marketing_campaigns', action: 'view' },
  { prefixes: ['/finance/commission', '/finance/commissions', '/commission', '/finance/my-income'], resource: 'finance_commissions', action: 'view' },
  { prefixes: ['/finance', '/finance/revenue'], resource: 'finance_revenue', action: 'view' },
  { prefixes: ['/finance/expense', '/finance/expenses'], resource: 'finance_expenses', action: 'view' },
  { prefixes: ['/finance/receivables', '/finance/debt'], resource: 'finance_receivables', action: 'view' },
  { prefixes: ['/payroll'], resource: 'payroll', action: 'view' },
  { prefixes: ['/hr/recruitment'], resource: 'hr_recruitment', action: 'view' },
  { prefixes: ['/hr', '/hr/employees', '/hr/organization', '/organization', '/hr/contracts'], resource: 'hr_employees', action: 'view' },
  { prefixes: ['/hr/training', '/training'], resource: 'hr_training', action: 'view' },
  { prefixes: ['/legal/licenses', '/legal/compliance', '/legal/regulations', '/legal/approvals'], resource: 'legal_licenses', action: 'view' },
  { prefixes: ['/work', '/work/tasks', '/work/reminders'], resource: 'work_tasks', action: 'view' },
  { prefixes: ['/work/calendar', '/calendar'], resource: 'work_calendar', action: 'view' },
  { prefixes: ['/kpi', '/sales/kpi'], resource: 'kpi', action: 'view' },
  { prefixes: ['/cms'], resource: 'cms', action: 'view' },
  { prefixes: ['/analytics'], resource: 'analytics', action: 'view' },
  { prefixes: ['/settings/users'], resource: 'settings_users', action: 'view' },
  { prefixes: ['/settings/roles'], resource: 'settings_roles', action: 'view' },
  { prefixes: ['/settings'], resource: 'settings_governance', action: 'view' },
];

const normalizePathname = (path = '/') => {
  if (!path) return '/';

  try {
    return new URL(path, 'http://localhost').pathname || '/';
  } catch (_error) {
    return path.split('?')[0] || '/';
  }
};

export const getActionScope = (role, resource, action) =>
  GO_LIVE_ACTION_PERMISSIONS[resource]?.actions?.[action]?.[role] || ACTION_SCOPE.NONE;

export const canRolePerformAction = (role, resource, action) => getActionScope(role, resource, action) !== ACTION_SCOPE.NONE;

export const getRouteActionContract = (path = '/') => {
  const pathname = normalizePathname(path);
  return GO_LIVE_ROUTE_ACTION_MAP
    .flatMap((item) =>
      item.prefixes
        .filter((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))
        .map((prefix) => ({ ...item, matchedPrefix: prefix })),
    )
    .sort((left, right) => right.matchedPrefix.length - left.matchedPrefix.length)[0] || null;
};

export const canRoleAccessPath = (role, path = '/') => {
  const routeContract = getRouteActionContract(path);
  if (!routeContract) return true;
  return canRolePerformAction(role, routeContract.resource, routeContract.action);
};

export const getRoleActionPermissionFlatMap = (role) =>
  Object.entries(GO_LIVE_ACTION_PERMISSIONS).reduce((accumulator, [resource, config]) => {
    ACTION_KEYS.forEach((action) => {
      accumulator[`${resource}.${action}`] = config.actions[action]?.[role] || ACTION_SCOPE.NONE;
    });
    return accumulator;
  }, {});

export const getRoleActionPermissionSummary = (role) => {
  const flatMap = getRoleActionPermissionFlatMap(role);

  return {
    view: Object.keys(flatMap).filter((key) => key.endsWith('.view') && flatMap[key] !== ACTION_SCOPE.NONE).length,
    create: Object.keys(flatMap).filter((key) => key.endsWith('.create') && flatMap[key] !== ACTION_SCOPE.NONE).length,
    edit: Object.keys(flatMap).filter((key) => key.endsWith('.edit') && flatMap[key] !== ACTION_SCOPE.NONE).length,
    approve: Object.keys(flatMap).filter((key) => key.endsWith('.approve') && flatMap[key] !== ACTION_SCOPE.NONE).length,
    export: Object.keys(flatMap).filter((key) => key.endsWith('.export') && flatMap[key] !== ACTION_SCOPE.NONE).length,
    configure: Object.keys(flatMap).filter((key) => key.endsWith('.configure') && flatMap[key] !== ACTION_SCOPE.NONE).length,
  };
};
