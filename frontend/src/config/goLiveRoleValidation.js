import { ROLE_ORDER, ROLE_GOVERNANCE, DEMO_ACCOUNTS } from '@/config/roleGovernance';
import { getGoLiveDataPolicy } from '@/config/goLiveDataPolicy';
import { getNormalizedGoLivePath, isPathRegisteredForGoLive } from '@/config/goLiveRouteRegistry';
import { canRoleAccessPath, getRouteActionContract } from '@/config/goLiveActionPermissions';
import { areBackendContractsLockedForPath, getBackendContractsForPath } from '@/config/goLiveBackendContracts';
import { areFoundationDependenciesLockedForPath, getFoundationDependenciesForPath } from '@/config/goLiveFoundationBaseline';
import { isPlatformFieldValidationLocked } from '@/config/platformFieldValidationPhaseSeven';
import { getPlatformApiPermissionRuntimeForRolePath, isPlatformApiPermissionLockedForRolePath } from '@/config/platformApiPermissionPhaseSix';
import { getRoleGoLiveHomePath, getRoleWorkspaceTabs, isPathInRoleGoLiveScope } from '@/config/roleDashboardSpec';

const DEMO_EMAIL_BY_ROLE = Object.values(DEMO_ACCOUNTS).reduce((accumulator, account) => {
  accumulator[account.role] = account.email;
  return accumulator;
}, {});

const createEntryStep = (role) => {
  const route = getRoleGoLiveHomePath(role);
  return {
    id: `${role}.entry`,
    loai: 'entry',
    nhom: 'Điểm vào',
    tabCha: 'Điểm vào',
    tabCon: 'Màn hình mặc định',
    label: 'Vào đúng màn hình mặc định',
    route,
    screenKey: `${role}.entry.home`,
    expected: 'Đăng nhập xong phải vào đúng dashboard/workspace của vai trò.',
  };
};

const createAuthStep = (role) => ({
  id: `${role}.auth`,
  loai: 'auth',
  nhom: 'Đăng nhập',
  tabCha: 'Đăng nhập',
  tabCon: 'Tài khoản demo',
  label: 'Đăng nhập bằng tài khoản demo',
  route: '/login',
  screenKey: `${role}.auth.login`,
  expected: 'Đăng nhập thành công bằng tài khoản demo và giữ đúng vai trò sau khi vào hệ thống.',
  demoEmail: DEMO_EMAIL_BY_ROLE[role],
});

const createSubtabStep = (role, parentTab, subtab) => {
  const primaryLeaf = (subtab.grandchildren || [])[0];
  return {
    id: `${role}.${parentTab.id}.${subtab.id}`,
    loai: 'journey',
    nhom: parentTab.label,
    tabCha: parentTab.label,
    tabCon: subtab.label,
    label: primaryLeaf?.label || subtab.label,
    route: primaryLeaf?.path || subtab.path,
    screenKey: primaryLeaf?.screenKey || `${role}.${parentTab.id}.${subtab.id}`,
    expected: `Mở đúng nơi xử lý công việc của "${subtab.label}" trong nhóm "${parentTab.label}".`,
  };
};

const decorateStep = (role, step) => {
  const normalizedPath = getNormalizedGoLivePath(step.route);
  const dataPolicy = getGoLiveDataPolicy(step.route);
  const inScope = isPathInRoleGoLiveScope(role, step.route);
  const routeRegistered = isPathRegisteredForGoLive(step.route);
  const actionLocked = canRoleAccessPath(role, step.route);
  const routeActionContract = getRouteActionContract(step.route);
  const backendContracts = getBackendContractsForPath(step.route);
  const backendLocked = areBackendContractsLockedForPath(step.route);
  const foundationDependencies = getFoundationDependenciesForPath(step.route);
  const foundationLocked = areFoundationDependenciesLockedForPath(step.route);
  const platformApiRuntime = getPlatformApiPermissionRuntimeForRolePath(role, step.route);
  const platformApiLocked = isPlatformApiPermissionLockedForRolePath(role, step.route);
  const ready = Boolean(
    inScope &&
      routeRegistered &&
      dataPolicy.visibleInGoLive !== false &&
      backendLocked &&
      actionLocked &&
      foundationLocked &&
      platformApiLocked,
  );

  return {
    ...step,
    normalizedPath,
    dataPolicy,
    inScope,
    routeRegistered,
    actionLocked,
    routeActionContract,
    backendContracts,
    backendLocked,
    foundationDependencies,
    foundationLocked,
    platformApiRuntime,
    platformApiLocked,
    ready,
  };
};

export const getRoleValidationSuite = (role) => {
  const tabs = getRoleWorkspaceTabs(role);
  const flowSteps = tabs.flatMap((parentTab) =>
    (parentTab.children || [])
      .filter((subtab) => (subtab.grandchildren || []).length > 0)
      .map((subtab) => createSubtabStep(role, parentTab, subtab)),
  );

  return [createAuthStep(role), createEntryStep(role), ...flowSteps].map((step) => decorateStep(role, step));
};

export const getGoLiveRoleValidationMatrix = () =>
  ROLE_ORDER.map((role) => {
    const profile = ROLE_GOVERNANCE[role];
    const steps = getRoleValidationSuite(role);
    const totalSteps = steps.length;
    const readySteps = steps.filter((step) => step.ready).length;
    const liveSteps = steps.filter((step) => step.dataPolicy.mode === 'live').length;
    const hybridSteps = steps.filter((step) => step.dataPolicy.mode === 'hybrid').length;
    const backendLockedSteps = steps.filter((step) => step.backendLocked).length;
    const actionLockedSteps = steps.filter((step) => step.actionLocked).length;
    const foundationLockedSteps = steps.filter((step) => step.foundationLocked).length;
    const platformApiLockedSteps = steps.filter((step) => step.platformApiLocked).length;
    const platformFieldLocked = isPlatformFieldValidationLocked(role);

    return {
      role,
      profile,
      demoEmail: DEMO_EMAIL_BY_ROLE[role],
      homePath: getRoleGoLiveHomePath(role),
      totalSteps,
      readySteps,
      liveSteps,
      hybridSteps,
      backendLockedSteps,
      actionLockedSteps,
      foundationLockedSteps,
      platformApiLockedSteps,
      platformFieldLocked,
      locked: totalSteps > 0 && totalSteps === readySteps && platformFieldLocked,
      steps,
    };
  });

export const getGoLiveValidationSummary = () => {
  const matrix = getGoLiveRoleValidationMatrix();
  const rolesLocked = matrix.filter((item) => item.locked).length;
  const totalSteps = matrix.reduce((sum, item) => sum + item.totalSteps, 0);
  const readySteps = matrix.reduce((sum, item) => sum + item.readySteps, 0);
  const liveSteps = matrix.reduce((sum, item) => sum + item.liveSteps, 0);
  const hybridSteps = matrix.reduce((sum, item) => sum + item.hybridSteps, 0);
  const backendLockedSteps = matrix.reduce((sum, item) => sum + item.backendLockedSteps, 0);
  const actionLockedSteps = matrix.reduce((sum, item) => sum + item.actionLockedSteps, 0);
  const foundationLockedSteps = matrix.reduce((sum, item) => sum + item.foundationLockedSteps, 0);
  const platformApiLockedSteps = matrix.reduce((sum, item) => sum + item.platformApiLockedSteps, 0);
  const platformFieldLockedRoles = matrix.filter((item) => item.platformFieldLocked).length;

  return {
    totalRoles: matrix.length,
    rolesLocked,
    totalSteps,
    readySteps,
    liveSteps,
    hybridSteps,
    backendLockedSteps,
    actionLockedSteps,
    foundationLockedSteps,
    platformApiLockedSteps,
    platformFieldLockedRoles,
    fullyLocked: matrix.length > 0 && matrix.length === rolesLocked && totalSteps === readySteps,
  };
};
