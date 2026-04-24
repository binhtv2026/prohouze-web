import { ROLE_ORDER } from '../config/roleGovernance';
import { QUICK_ACTIONS } from '../config/navigation';
import { getGoLiveDataPolicy } from '../config/goLiveDataPolicy';
import { areBackendContractsLockedForPath } from '../config/goLiveBackendContracts';
import { areFoundationDependenciesLockedForPath } from '../config/goLiveFoundationBaseline';
import { canRoleAccessPath } from '../config/goLiveActionPermissions';
import { isPathRegisteredForGoLive } from '../config/goLiveRouteRegistry';
import { isPlatformApiPermissionLockedForRolePath } from '../config/platformApiPermissionPhaseSix';
import { getPlatformFieldValidationSuite } from '../config/platformFieldValidationPhaseSeven';
import { getRoleSidebarTabs, getRoleWorkspaceTabs, isPathInRoleGoLiveScope } from '../config/roleDashboardSpec';

const dedupeTargets = (targets) => {
  const registry = new Map();

  targets.forEach((target) => {
    const key = `${target.source}|${target.label}|${target.path}`;
    if (!registry.has(key)) {
      registry.set(key, target);
    }
  });

  return Array.from(registry.values());
};

const collectWorkspaceTargets = (role) => {
  const tabs = getRoleWorkspaceTabs(role);
  const targets = [];

  tabs.forEach((tab) => {
    (tab.children || []).forEach((subtab) => {
      if (subtab.path) {
        targets.push({
          source: 'workspace-subtab',
          parent: tab.label,
          label: subtab.label,
          path: subtab.path,
        });
      }

      (subtab.grandchildren || []).forEach((grandchild) => {
        if (grandchild.path) {
          targets.push({
            source: 'workspace-leaf',
            parent: tab.label,
            label: `${subtab.label} / ${grandchild.label}`,
            path: grandchild.path,
          });
        }
      });
    });
  });

  return dedupeTargets(targets);
};

const collectSidebarTargets = (role) => {
  const tabs = getRoleSidebarTabs(role);
  const targets = [];

  tabs.forEach((tab) => {
    (tab.children || []).forEach((item) => {
      if (item.path) {
        targets.push({
          source: 'sidebar',
          parent: tab.label,
          label: item.label,
          path: item.path,
        });
      }
    });
  });

  return dedupeTargets(targets);
};

const collectQuickActions = (role) =>
  dedupeTargets(
    (QUICK_ACTIONS[role] || []).map((action) => ({
      source: 'quick-action',
      parent: 'Quick actions',
      label: action.label,
      path: action.path,
    })),
  );

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
      `${target.source} | ${target.parent} | ${target.label} | ${target.path} -> ${failedGates.join(', ')}`,
    ];
  });

describe('Role flows are locked across all interactive targets', () => {
  test.each(ROLE_ORDER)('%s workspace targets pass 7 business gates', (role) => {
    const targets = collectWorkspaceTargets(role);
    const failures = getFailures(role, targets);

    expect(targets.length).toBeGreaterThan(0);
    expect(failures).toEqual([]);
  });

  test.each(ROLE_ORDER)('%s sidebar targets pass 7 business gates', (role) => {
    const targets = collectSidebarTargets(role);
    const failures = getFailures(role, targets);

    expect(targets.length).toBeGreaterThan(0);
    expect(failures).toEqual([]);
  });

  test.each(ROLE_ORDER)('%s quick actions pass 7 business gates', (role) => {
    const targets = collectQuickActions(role);
    const failures = getFailures(role, targets);

    expect(targets.length).toBeGreaterThan(0);
    expect(failures).toEqual([]);
  });

  test.each(ROLE_ORDER)('%s field validation checkpoints are all ready', (role) => {
    const checkpoints = getPlatformFieldValidationSuite(role);
    const notReady = checkpoints
      .filter((checkpoint) => !checkpoint.ready)
      .map(
        (checkpoint) =>
          `${checkpoint.surface} | ${checkpoint.label} | ${checkpoint.route} -> not ready`,
      );

    expect(checkpoints.length).toBeGreaterThan(0);
    expect(notReady).toEqual([]);
  });
});
