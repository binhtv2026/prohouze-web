import { ROLE_ORDER, ROLE_GOVERNANCE } from '@/config/roleGovernance';
import { ROLES } from '@/config/navigation';
import { PLATFORM_SURFACE_META } from '@/config/platformSurfaceStrategy';
import { getPlatformPhaseOneRoleCoverage, getPlatformPhaseOneScopeSummary } from '@/config/platformLaunchScopePhaseOne';
import { getRoleNavigationShellMatrix } from '@/config/platformNavigationSplit';
import { getPlatformScreenStandardMatrix, getPlatformScreenStandardSummary } from '@/config/platformScreenStandardsPhaseThree';
import { getAppShellMatrix, getAppShellSummary } from '@/config/platformAppShellPhaseFour';
import { getWebShellMatrix, getWebShellSummary } from '@/config/platformWebShellPhaseFive';
import { getPlatformApiPermissionSummary } from '@/config/platformApiPermissionPhaseSix';
import { getPlatformFieldValidationSummary } from '@/config/platformFieldValidationPhaseSeven';
import { getGoLiveValidationSummary } from '@/config/goLiveRoleValidation';

export const PLATFORM_FINAL_GO_LIVE_PHASE_8 = {
  id: 'platform_final_go_live_phase_8_locked',
  label: 'Chạy thử và vận hành chính thức',
  description: 'Khóa tuyệt đối giai đoạn chạy thử, hỗ trợ sau mở hệ thống, quay lui và quyết định vận hành cuối cùng dựa trên toàn bộ bước 1-7.',
};

export const PLATFORM_GO_LIVE_WAVES = [
  {
    id: 'wave_0_internal_pilot',
    label: 'Đợt 0 - Chạy thử nội bộ',
    focus: 'Chạy thử có kiểm soát với đội vận hành lõi.',
    roles: [ROLES.ADMIN, ROLES.SALES, ROLES.MANAGER, ROLES.FINANCE],
    owners: ['Admin hệ thống', 'Quản lý kinh doanh', 'Đầu mối tài chính'],
    exitCriteria: [
      'Đăng nhập và vào đúng nền tảng của từng vai trò',
      'Luồng khách mới -> tiến trình giao dịch -> giữ chỗ -> hoa hồng thông suốt',
      'Không có route chết hoặc màn trắng trên các luồng chính',
    ],
  },
  {
    id: 'wave_1_controlled_launch',
    label: 'Đợt 1 - Mở có kiểm soát',
    focus: 'Mở có kiểm soát cho điều hành và marketing sau đợt chạy thử.',
    roles: [ROLES.BOD, ROLES.MARKETING],
    owners: ['Lãnh đạo bảo trợ', 'Đầu mối marketing'],
    exitCriteria: [
      'Lãnh đạo duyệt nhanh được trên ứng dụng và xem sâu được trên website quản trị',
      'Marketing theo dõi được chiến dịch, khách mới và ghi nhận nguồn trên cả website quản trị và ứng dụng',
      'Không còn điểm chặn nghiêm trọng trong 3 ngày vận hành liên tiếp',
    ],
  },
  {
    id: 'wave_2_backoffice_completion',
    label: 'Đợt 2 - Hoàn tất back office',
    focus: 'Mở nốt các role BO và lực lượng ngoài theo chuẩn đã khóa.',
    roles: [ROLES.HR, ROLES.LEGAL, ROLES.CONTENT, ROLES.AGENCY],
    owners: ['Đầu mối nhân sự', 'Đầu mối pháp lý', 'Đầu mối nội dung', 'Đầu mối kênh'],
    exitCriteria: [
      'Nhân sự, pháp lý và nội dung dùng đúng giao diện website quản trị và xử lý được luồng chính',
      'Đại lý dùng được giao diện ứng dụng rút gọn mà không lẫn nghiệp vụ back office',
      'Danh sách kiểm thử thực địa theo vai trò đạt 100%',
    ],
  },
];

export const PLATFORM_HYPERCARE_RUNBOOK = [
  {
    id: 'support_roster',
    label: 'Danh sách hỗ trợ',
    owner: 'Admin / Quản lý dự án',
    artifact: '/settings/go-live-validation',
    locked: true,
    note: 'Có đầu mối trực hỗ trợ theo từng vai trò trong 72 giờ đầu.',
  },
  {
    id: 'issue_triage',
    label: 'Bảng điều phối sự cố',
    owner: 'Admin / BO',
    artifact: '/work/tasks?status=overdue',
    locked: true,
    note: 'Mọi lỗi vận hành phải đổ về một hàng chờ xử lý duy nhất.',
  },
  {
    id: 'rollback_plan',
    label: 'Kế hoạch quay lui',
    owner: 'Admin / Nền tảng',
    artifact: '/settings/platform-launch-scope',
    locked: true,
    note: 'Có phạm vi khóa để thu hẹp bề mặt hệ thống nếu cần quay lui.',
  },
  {
    id: 'field_feedback',
    label: 'Vòng phản hồi hiện trường',
    owner: 'Quản lý / Đầu mối kinh doanh',
    artifact: '/settings/platform-field-validation',
    locked: true,
    note: 'Phản hồi hiện trường quay về danh sách kiểm thử vai trò và nền tảng chuẩn.',
  },
  {
    id: 'launch_command_center',
    label: 'Trung tâm chỉ huy mở hệ thống',
    owner: 'Lãnh đạo bảo trợ + Admin',
    artifact: '/settings/platform-go-live-final',
    locked: true,
    note: 'Một màn chỉ huy duy nhất để quyết định mở hoặc chưa mở hệ thống.',
  },
];

const createGate = (id, label, locked, detail) => ({ id, label, locked, detail });

export function getPlatformFinalGoLiveGates() {
  const phaseOneCoverage = getPlatformPhaseOneRoleCoverage();
  const scopeSummary = getPlatformPhaseOneScopeSummary();
  const navigationMatrix = getRoleNavigationShellMatrix();
  const screenSummary = getPlatformScreenStandardSummary();
  const screenMatrix = getPlatformScreenStandardMatrix();
  const appShellSummary = getAppShellSummary();
  const appShellMatrix = getAppShellMatrix();
  const webShellSummary = getWebShellSummary();
  const webShellMatrix = getWebShellMatrix();
  const apiPermissionSummary = getPlatformApiPermissionSummary();
  const fieldSummary = getPlatformFieldValidationSummary();
  const roleValidationSummary = getGoLiveValidationSummary();

  const scopeLocked =
    ROLE_ORDER.every((role) => (phaseOneCoverage[role] || []).length > 0) &&
    scopeSummary.goLiveClusters > 0;

  const navigationLocked =
    navigationMatrix.length === ROLE_ORDER.length &&
    navigationMatrix.every((item) => item.defaultShell && (item.webTabs.length > 0 || item.appTabs.length > 0));

  const screenLocked =
    screenSummary.totalClusters > 0 &&
    screenMatrix.every(
      (item) =>
        item.screenTemplate &&
        Array.isArray(item.mustHave) &&
        item.mustHave.length === item.screenTemplate.requiredScreens.length,
    );

  const appShellLocked =
    appShellSummary.totalShells > 0 &&
    appShellMatrix.every((item) => item.homeRoute && item.mustHave?.length > 0 && item.bottomNav?.length > 0);

  const webShellLocked =
    webShellSummary.totalShells > 0 &&
    webShellMatrix.every((item) => item.homeRoute && item.mustHave?.length > 0 && item.leftNav?.length > 0);

  const apiPermissionLocked = apiPermissionSummary.fullyLocked;
  const fieldLocked = fieldSummary.fullyLocked;
  const roleValidationLocked = roleValidationSummary.fullyLocked;

  return [
    createGate('scope_phase_one', 'Khóa scope đợt 1', scopeLocked, `${scopeSummary.goLiveClusters}/${scopeSummary.totalClusters} cụm đã mở đợt 1.`),
    createGate('navigation_split', 'Tách điều hướng website quản trị / ứng dụng', navigationLocked, `${navigationMatrix.length}/${ROLE_ORDER.length} vai trò có giao diện chuẩn.`),
    createGate('screen_standards', 'Chuẩn màn hình theo nền tảng', screenLocked, `${screenSummary.totalClusters} cụm màn hình đã chuẩn hóa.`),
    createGate('app_shell', 'Khóa giao diện ứng dụng', appShellLocked, `${appShellSummary.totalShells} giao diện ứng dụng đã khóa.`),
    createGate('web_shell', 'Khóa giao diện website quản trị', webShellLocked, `${webShellSummary.totalShells} giao diện website quản trị đã khóa.`),
    createGate('api_permission', 'Khóa API và quyền truy cập', apiPermissionLocked, `${apiPermissionSummary.fullyLockedClusters}/${apiPermissionSummary.totalRuntimeClusters} cụm chạy đã đạt.`),
    createGate('field_validation', 'Kiểm thử thực địa website quản trị / ứng dụng', fieldLocked, `${fieldSummary.readyCheckpoints}/${fieldSummary.totalCheckpoints} điểm kiểm tra đã đạt.`),
    createGate('role_validation', 'Đối chiếu vận hành tổng', roleValidationLocked, `${roleValidationSummary.rolesLocked}/${roleValidationSummary.totalRoles} vai trò đã đạt.`),
  ];
}

export function getPlatformWaveMatrix() {
  return PLATFORM_GO_LIVE_WAVES.map((wave) => ({
    ...wave,
    rolesDetail: wave.roles.map((role) => ({
      role,
      profile: ROLE_GOVERNANCE[role],
      surfaceLabel: ROLE_GOVERNANCE[role]?.nenTangChinh || PLATFORM_SURFACE_META.web?.label,
    })),
    locked: wave.roles.length > 0 && wave.owners.length > 0 && wave.exitCriteria.length > 0,
  }));
}

export function getPlatformRunbookMatrix() {
  return PLATFORM_HYPERCARE_RUNBOOK;
}

export function getPlatformFinalGoLiveSummary() {
  const gates = getPlatformFinalGoLiveGates();
  const waves = getPlatformWaveMatrix();
  const runbook = getPlatformRunbookMatrix();

  return {
    totalGates: gates.length,
    lockedGates: gates.filter((gate) => gate.locked).length,
    totalWaves: waves.length,
    lockedWaves: waves.filter((wave) => wave.locked).length,
    totalRunbookItems: runbook.length,
    lockedRunbookItems: runbook.filter((item) => item.locked).length,
    fullyLocked:
      gates.length > 0 &&
      gates.every((gate) => gate.locked) &&
      waves.length > 0 &&
      waves.every((wave) => wave.locked) &&
      runbook.length > 0 &&
      runbook.every((item) => item.locked),
  };
}
