import { FOUNDATION_STATUS_MODELS } from '@/config/foundationRegistry';

const normalizePathname = (path = '/') => {
  if (!path) return '/';

  try {
    return new URL(path, 'http://localhost').pathname || '/';
  } catch (_error) {
    return path.split('?')[0] || '/';
  }
};

export const FOUNDATION_BASELINE_STATUS = {
  LOCKED: 'locked',
  INTERNAL: 'internal',
};

export const GO_LIVE_FOUNDATION_BASELINES = [
  {
    key: 'user_directory',
    group: 'identity',
    label: 'Người dùng & vai trò',
    status: FOUNDATION_BASELINE_STATUS.LOCKED,
    owner: 'Hệ thống',
    settingsPath: '/settings/users',
    sourceOfTruth: ['users', 'roles', 'role profiles'],
    entities: ['user', 'role', 'owner scope'],
    lockedChecks: [
      'Có danh sách người dùng chuẩn cho go-live',
      'Mỗi người dùng map đúng role vận hành',
      'Không dùng free-text role trong luồng nghiệp vụ',
    ],
  },
  {
    key: 'organization_hierarchy',
    group: 'identity',
    label: 'Cơ cấu công ty / chi nhánh / team',
    status: FOUNDATION_BASELINE_STATUS.LOCKED,
    owner: 'Hệ thống + HR',
    settingsPath: '/settings/organization',
    sourceOfTruth: ['organization', 'branch', 'team'],
    entities: ['company', 'branch', 'team'],
    lockedChecks: [
      'Có cây công ty → chi nhánh → team',
      'User map đúng branch/team',
      'Không hardcode tên chi nhánh, team trong page',
    ],
  },
  {
    key: 'master_data_catalog',
    group: 'foundation',
    label: 'Master data chuẩn',
    status: FOUNDATION_BASELINE_STATUS.LOCKED,
    owner: 'Data Foundation',
    settingsPath: '/settings/master-data',
    sourceOfTruth: ['master data categories', 'canonical picklists'],
    entities: ['source', 'channel', 'priority', 'payment method'],
    lockedChecks: [
      'Không cho phép free-text ở dữ liệu nền quan trọng',
      'Category map đúng với schema và form',
      'Danh mục chọn dùng chung toàn hệ',
    ],
  },
  {
    key: 'status_models',
    group: 'foundation',
    label: 'State machine canonical',
    status: FOUNDATION_BASELINE_STATUS.LOCKED,
    owner: 'Governance',
    settingsPath: '/settings/status-model',
    sourceOfTruth: FOUNDATION_STATUS_MODELS.map((model) => model.code),
    entities: FOUNDATION_STATUS_MODELS.map((model) => model.title),
    lockedChecks: [
      'Lead / Deal / Booking / Contract / Payment / Payout có state chuẩn',
      'Không cập nhật status free-text',
      'Dashboard và list chỉ đọc theo state machine canonical',
    ],
  },
  {
    key: 'project_catalog',
    group: 'product',
    label: 'Danh mục dự án & sản phẩm bán',
    status: FOUNDATION_BASELINE_STATUS.LOCKED,
    owner: 'Sales + Product',
    settingsPath: '/settings/data-foundation',
    sourceOfTruth: ['project catalog', 'product inventory'],
    entities: ['project', 'inventory unit', 'product grouping'],
    lockedChecks: [
      'Mọi booking/deal phải gắn được dự án/sản phẩm',
      'Không để route bán hàng chạy mà thiếu dự án nền',
      'Catalog dự án dùng chung cho sales, marketing, legal, cms',
    ],
  },
  {
    key: 'pricing_catalog',
    group: 'product',
    label: 'Bảng giá chuẩn',
    status: FOUNDATION_BASELINE_STATUS.LOCKED,
    owner: 'Sales + Finance',
    settingsPath: '/sales/pricing',
    sourceOfTruth: ['price list', 'pricing policy'],
    entities: ['price book', 'discount policy', 'commission basis'],
    lockedChecks: [
      'Bảng giá có phiên bản chuẩn để sales tra cứu',
      'Không dùng giá tản mạn theo file riêng lẻ',
      'Deal/booking/commission đọc cùng nguồn giá',
    ],
  },
  {
    key: 'sales_policy_catalog',
    group: 'policy',
    label: 'Chính sách bán hàng chuẩn',
    status: FOUNDATION_BASELINE_STATUS.LOCKED,
    owner: 'Sales Operations',
    settingsPath: '/settings/approval-matrix',
    sourceOfTruth: ['sales policy', 'approval matrix', 'reserve policy'],
    entities: ['booking rule', 'approval policy', 'campaign policy'],
    lockedChecks: [
      'Chính sách bán hàng có owner rõ ràng',
      'Booking exception phải bám policy chuẩn',
      'Không duyệt ngoại lệ bằng cách truyền miệng',
    ],
  },
  {
    key: 'legal_catalog',
    group: 'legal',
    label: 'Pháp lý & tài liệu chuẩn',
    status: FOUNDATION_BASELINE_STATUS.LOCKED,
    owner: 'Legal',
    settingsPath: '/legal/licenses',
    sourceOfTruth: ['project legal docs', 'contract templates', 'forms'],
    entities: ['license', 'legal status', 'contract template'],
    lockedChecks: [
      'Dự án có trạng thái pháp lý chuẩn để sales tra cứu',
      'Hợp đồng và biểu mẫu dùng chung một kho chuẩn',
      'Tài liệu gửi sale/khách không phụ thuộc file cá nhân',
    ],
  },
];

export const GO_LIVE_FOUNDATION_ROUTE_MAP = [
  { prefixes: ['/login'], dependencies: ['user_directory'] },
  { prefixes: ['/workspace', '/dashboard', '/me'], dependencies: ['user_directory', 'organization_hierarchy'] },
  { prefixes: ['/app'], dependencies: ['user_directory', 'organization_hierarchy', 'master_data_catalog', 'status_models'] },
  { prefixes: ['/crm'], dependencies: ['user_directory', 'organization_hierarchy', 'master_data_catalog', 'status_models'] },
  {
    prefixes: ['/sales', '/sales/pipeline', '/sales/deals', '/sales/bookings', '/sales/soft-bookings', '/sales/hard-bookings'],
    dependencies: ['user_directory', 'organization_hierarchy', 'master_data_catalog', 'status_models', 'project_catalog', 'pricing_catalog', 'sales_policy_catalog'],
  },
  {
    prefixes: ['/sales/product-center', '/sales/products', '/sales/projects', '/sales/pricing'],
    dependencies: ['project_catalog', 'pricing_catalog', 'sales_policy_catalog', 'legal_catalog'],
  },
  {
    prefixes: ['/sales/knowledge-center'],
    dependencies: ['project_catalog', 'pricing_catalog', 'sales_policy_catalog', 'legal_catalog'],
  },
  {
    prefixes: ['/sales/finance-center'],
    dependencies: ['user_directory', 'organization_hierarchy', 'master_data_catalog', 'status_models', 'pricing_catalog', 'sales_policy_catalog'],
  },
  {
    prefixes: ['/sales/channel-center'],
    dependencies: ['user_directory', 'organization_hierarchy', 'master_data_catalog', 'project_catalog'],
  },
  {
    prefixes: ['/marketing', '/communications'],
    dependencies: ['user_directory', 'organization_hierarchy', 'master_data_catalog', 'project_catalog'],
  },
  {
    prefixes: ['/control'],
    dependencies: ['user_directory', 'organization_hierarchy', 'master_data_catalog', 'status_models', 'project_catalog', 'pricing_catalog', 'sales_policy_catalog', 'legal_catalog'],
  },
  {
    prefixes: ['/manager'],
    dependencies: ['user_directory', 'organization_hierarchy'],
  },
  {
    prefixes: ['/finance', '/commission'],
    dependencies: ['user_directory', 'organization_hierarchy', 'master_data_catalog', 'status_models', 'pricing_catalog', 'sales_policy_catalog'],
  },
  {
    prefixes: ['/payroll', '/hr'],
    dependencies: ['user_directory', 'organization_hierarchy', 'master_data_catalog'],
  },
  {
    prefixes: ['/training'],
    dependencies: ['user_directory', 'organization_hierarchy', 'master_data_catalog'],
  },
  {
    prefixes: ['/legal', '/contracts'],
    dependencies: ['organization_hierarchy', 'status_models', 'project_catalog', 'legal_catalog', 'sales_policy_catalog'],
  },
  {
    prefixes: ['/work', '/kpi'],
    dependencies: ['user_directory', 'organization_hierarchy', 'master_data_catalog', 'status_models'],
  },
  {
    prefixes: ['/cms'],
    dependencies: ['project_catalog', 'legal_catalog', 'sales_policy_catalog'],
  },
  {
    prefixes: ['/analytics'],
    dependencies: ['user_directory', 'organization_hierarchy', 'master_data_catalog', 'status_models', 'project_catalog', 'pricing_catalog', 'sales_policy_catalog', 'legal_catalog'],
  },
  {
    prefixes: ['/settings'],
    dependencies: [
      'user_directory',
      'organization_hierarchy',
      'master_data_catalog',
      'status_models',
      'project_catalog',
      'pricing_catalog',
      'sales_policy_catalog',
      'legal_catalog',
    ],
  },
];

export const getGoLiveFoundationBaselines = () => GO_LIVE_FOUNDATION_BASELINES;

export const getFoundationBaseline = (key) =>
  GO_LIVE_FOUNDATION_BASELINES.find((item) => item.key === key) || null;

export const getFoundationDependenciesForPath = (path) => {
  const normalized = normalizePathname(path);
  const mapping = GO_LIVE_FOUNDATION_ROUTE_MAP
    .flatMap((item) =>
      item.prefixes
        .filter((prefix) => normalized === prefix || normalized.startsWith(`${prefix}/`))
        .map((prefix) => ({ item, prefix })),
    )
    .sort((left, right) => right.prefix.length - left.prefix.length)[0]?.item;

  if (!mapping) return [];

  return mapping.dependencies
    .map((key) => getFoundationBaseline(key))
    .filter(Boolean);
};

export const areFoundationDependenciesLockedForPath = (path) => {
  const dependencies = getFoundationDependenciesForPath(path);
  return dependencies.length > 0 && dependencies.every((item) => item.status === FOUNDATION_BASELINE_STATUS.LOCKED);
};

export const getFoundationBaselineSummary = () => {
  const groups = new Set(GO_LIVE_FOUNDATION_BASELINES.map((item) => item.group));
  const lockedDomains = GO_LIVE_FOUNDATION_BASELINES.filter((item) => item.status === FOUNDATION_BASELINE_STATUS.LOCKED).length;
  const routeCoverage = GO_LIVE_FOUNDATION_ROUTE_MAP.length;

  return {
    totalDomains: GO_LIVE_FOUNDATION_BASELINES.length,
    lockedDomains,
    groups: groups.size,
    routeCoverage,
    fullyLocked:
      GO_LIVE_FOUNDATION_BASELINES.length > 0 &&
      GO_LIVE_FOUNDATION_BASELINES.length === lockedDomains,
  };
};
