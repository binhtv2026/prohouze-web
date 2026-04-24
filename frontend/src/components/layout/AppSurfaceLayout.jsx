import { Link, Navigate, Outlet, useLocation } from 'react-router-dom';
import { Bell, ChevronRight, Home, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { DEFAULT_DASHBOARD } from '@/config/navigation';
import { canRoleAccessAppPath, getRoleAppHomePath, getRoleAppRuntime } from '@/config/appRuntimeShell';
import { AICopilotButton } from '@/components/ai';

export default function AppSurfaceLayout() {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#316585]/20 border-t-[#316585]" />
          <p className="text-sm font-medium text-slate-500">Đang mở ứng dụng...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user?.role) {
    return <Navigate to="/login" replace />;
  }

  const runtime = getRoleAppRuntime(user.role);

  if (!runtime) {
    return <Navigate to={DEFAULT_DASHBOARD[user.role] || '/workspace'} replace />;
  }

  if (!canRoleAccessAppPath(user.role, location.pathname)) {
    return <Navigate to={getRoleAppHomePath(user.role)} replace />;
  }

  const bottomNavItems = [
    { key: 'home', label: 'Tổng quan', path: '/app', icon: Home },
    ...runtime.tabs,
  ];

  return (
    <div className="min-h-screen bg-[#f1f5f9]">
      <main className="flex-1">
        <Outlet />
      </main>

      {/* ── AI Copilot Button — hiển thị toàn bộ app sau đăng nhập ── */}
      <AICopilotButton
        role={user.role}
        userName={user.fullName || user.name || 'Anh/chị'}
      />
    </div>
  );
}
