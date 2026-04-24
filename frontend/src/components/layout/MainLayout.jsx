import React, { useState, createContext, useContext } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Sidebar from './Sidebar';
import AppBottomNav from './AppBottomNav';
import { Toaster } from 'sonner';
import { ROUTE_REDIRECTS } from '@/config/navigation';
import { AICopilotButton } from '@/components/ai';

// Layout Context for sidebar state
const LayoutContext = createContext({ sidebarCollapsed: false });
export const useLayout = () => useContext(LayoutContext);

export default function MainLayout() {
  const { isAuthenticated, loading, user } = useAuth();
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Check for route redirects
  const redirectPath = ROUTE_REDIRECTS[location.pathname];
  if (redirectPath) {
    return <Navigate to={redirectPath} replace />;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#316585]/30 border-t-[#316585] rounded-full animate-spin" />
          <p className="text-slate-500 font-medium">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <LayoutContext.Provider value={{ sidebarCollapsed, setSidebarCollapsed }}>
      <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
        <div className="hidden md:block">
          <Sidebar />
        </div>
        <main className="flex-1 md:pl-64 min-h-screen pb-16 md:pb-0 transition-all duration-300 w-full overflow-x-hidden">
          <Outlet />
        </main>
        {/* Bottom Nav mobile/iPad */}
        <div className="md:hidden">
          <AppBottomNav />
        </div>
        <Toaster position="top-right" richColors />

        {/* ── AI Copilot — hiển thị toàn bộ web dashboard ── */}
        <AICopilotButton
          role={user?.role || 'sale'}
          userName={user?.fullName || user?.name || 'Anh/chị'}
          style={{ bottom: 32, right: 28 }}
        />
      </div>
    </LayoutContext.Provider>
  );
}
