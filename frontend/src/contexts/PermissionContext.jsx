/**
 * ProHouze Permission Context & Hooks
 * Prompt 4/20 - Organization & Permission Foundation
 * 
 * Centralized permission management for the frontend
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import {
  ACTION_SCOPE,
  canRoleAccessPath,
  getRoleActionPermissionFlatMap,
  getRoleActionPermissionSummary,
} from '@/config/goLiveActionPermissions';

// Permission Context
const PermissionContext = createContext(null);

// Permission scopes
export const PermissionScope = {
  NONE: ACTION_SCOPE.NONE,
  SELF: ACTION_SCOPE.SELF,
  TEAM: ACTION_SCOPE.TEAM,
  DEPARTMENT: ACTION_SCOPE.DEPARTMENT,
  BRANCH: ACTION_SCOPE.BRANCH,
  ALL: ACTION_SCOPE.ALL,
};

// Provider Component
export function PermissionProvider({ children }) {
  const { user, isAuthenticated } = useAuth();
  const [permissions, setPermissions] = useState({});
  const [menuAccess, setMenuAccess] = useState({});
  const [roleInfo, setRoleInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch permissions from backend
  const fetchPermissions = useCallback(async () => {
    if (!isAuthenticated || !user) {
      setPermissions({});
      setMenuAccess({});
      setRoleInfo(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const role = user.role;
      const rolePerms = getRoleActionPermissionFlatMap(role);
      const summary = getRoleActionPermissionSummary(role);

      setPermissions(rolePerms);
      setRoleInfo({
        code: role,
        originalRole: role,
        summary,
      });
      setMenuAccess({});
      setError(null);
    } catch (err) {
      console.error('Failed to fetch permissions:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  // Check if user has permission for resource.action
  const hasPermission = useCallback((resource, action) => {
    if (!permissions) return false;
    
    const permKey = `${resource}.${action}`;
    const scope = permissions[permKey];
    
    return scope && scope !== PermissionScope.NONE;
  }, [permissions]);

  // Get permission scope for resource.action
  const getPermissionScope = useCallback((resource, action) => {
    if (!permissions) return PermissionScope.NONE;
    
    const permKey = `${resource}.${action}`;
    return permissions[permKey] || PermissionScope.NONE;
  }, [permissions]);

  // Check if user can access menu path
  const canAccessMenu = useCallback((path) => {
    if (!user?.role) return false;
    return canRoleAccessPath(user.role, path);
  }, [user?.role]);

  // Check multiple permissions at once
  const checkPermissions = useCallback((checks) => {
    const results = {};
    checks.forEach(({ resource, action }) => {
      const key = `${resource}.${action}`;
      results[key] = {
        allowed: hasPermission(resource, action),
        scope: getPermissionScope(resource, action),
      };
    });
    return results;
  }, [hasPermission, getPermissionScope]);

  // Refresh permissions
  const refreshPermissions = useCallback(() => {
    return fetchPermissions();
  }, [fetchPermissions]);

  const value = {
    permissions,
    menuAccess,
    roleInfo,
    loading,
    error,
    hasPermission,
    getPermissionScope,
    canAccessMenu,
    checkPermissions,
    refreshPermissions,
    // Aliases for common checks
    canView: (resource) => hasPermission(resource, 'view'),
    canCreate: (resource) => hasPermission(resource, 'create'),
    canEdit: (resource) => hasPermission(resource, 'edit'),
    canDelete: (resource) => hasPermission(resource, 'delete'),
    canAssign: (resource) => hasPermission(resource, 'assign'),
    canApprove: (resource) => hasPermission(resource, 'approve'),
    canExport: (resource) => hasPermission(resource, 'export'),
  };

  return (
    <PermissionContext.Provider value={value}>
      {children}
    </PermissionContext.Provider>
  );
}

// Hook to use permissions
export function usePermissions() {
  const context = useContext(PermissionContext);
  if (!context) {
    throw new Error('usePermissions must be used within a PermissionProvider');
  }
  return context;
}

// Hook to check single permission
export function usePermission(resource, action) {
  const { hasPermission, getPermissionScope, loading } = usePermissions();
  
  return {
    allowed: hasPermission(resource, action),
    scope: getPermissionScope(resource, action),
    loading,
  };
}

// Hook to check menu access
export function useMenuAccess(path) {
  const { canAccessMenu, loading } = usePermissions();
  
  return {
    allowed: canAccessMenu(path),
    loading,
  };
}

// HOC for permission-protected components
export function withPermission(WrappedComponent, resource, action, fallback = null) {
  return function PermissionWrappedComponent(props) {
    const { hasPermission, loading } = usePermissions();
    
    if (loading) {
      return <div className="animate-pulse bg-gray-200 h-8 rounded" />;
    }
    
    if (!hasPermission(resource, action)) {
      return fallback;
    }
    
    return <WrappedComponent {...props} />;
  };
}

// Component for conditional rendering based on permission
export function PermissionGate({ resource, action, children, fallback = null }) {
  const { hasPermission, loading } = usePermissions();
  
  if (loading) {
    return null;
  }
  
  if (!hasPermission(resource, action)) {
    return fallback;
  }
  
  return children;
}

// Component for scope-based rendering
export function ScopeGate({ resource, action, requiredScope, children, fallback = null }) {
  const { getPermissionScope, loading } = usePermissions();
  
  if (loading) {
    return null;
  }
  
  const scopeOrder = ['none', 'self', 'team', 'department', 'branch', 'all'];
  const userScope = getPermissionScope(resource, action);
  const userScopeIndex = scopeOrder.indexOf(userScope);
  const requiredScopeIndex = scopeOrder.indexOf(requiredScope);
  
  if (userScopeIndex < requiredScopeIndex) {
    return fallback;
  }
  
  return children;
}

export default PermissionContext;
