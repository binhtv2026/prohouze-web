/**
 * ProHouze Sidebar Component
 * Version: 2.0 - Refactored for Enterprise SaaS
 * 
 * Features:
 * - Collapsible sections
 * - Role-based visibility
 * - Active state highlighting
 * - Smooth animations
 * - Responsive design
 */

import React, { useState, useMemo, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { getRoleLabel } from '@/lib/utils';
import {
  ChevronRight,
  ChevronDown,
  LogOut,
  PanelLeftClose,
  PanelLeft,
} from 'lucide-react';
import { NAVIGATION, filterNavigationByRole, QUICK_ACTIONS, ROLES } from '@/config/navigation';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';

// Logo Component
const Logo = ({ collapsed }) => (
  <div className="flex items-center gap-3">
    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#316585] to-[#4a8fb5] flex items-center justify-center flex-shrink-0 shadow-lg">
      <svg viewBox="0 0 40 40" className="w-5 h-5 text-white">
        <path
          fill="currentColor"
          d="M20 4L4 14v22h32V14L20 4zm0 4l12 8v16H8V16l12-8zm-4 10v8h8v-8h-8z"
        />
      </svg>
    </div>
    {!collapsed && (
      <div className="overflow-hidden">
        <h1 className="font-bold text-lg text-white tracking-tight leading-tight">ProHouze</h1>
        <p className="text-[10px] uppercase tracking-widest text-slate-400">Real Estate CRM</p>
      </div>
    )}
  </div>
);

// Menu Section Component
const MenuSection = ({ 
  item, 
  isOpen, 
  onToggle, 
  collapsed,
  currentPath 
}) => {
  const hasChildren = item.children && item.children.length > 0;
  const Icon = item.icon;
  
  // Check if any child is active
  const isChildActive = useMemo(() => {
    if (!hasChildren) return false;
    return item.children.some(child => currentPath.startsWith(child.path));
  }, [hasChildren, item.children, currentPath]);
  
  // Auto-expand if child is active
  useEffect(() => {
    if (isChildActive && !isOpen) {
      onToggle();
    }
  }, [isChildActive]);

  if (!hasChildren) {
    // Single item (no children)
    return (
      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger asChild>
            <NavLink
              to={item.path}
              data-testid={`nav-${item.id}`}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                  'hover:bg-slate-700/50',
                  isActive
                    ? 'bg-[#316585]/30 text-white border-l-[3px] border-[#316585] ml-0'
                    : 'text-slate-400 hover:text-white',
                  collapsed && 'justify-center px-2'
                )
              }
            >
              <Icon className={cn('flex-shrink-0', collapsed ? 'w-5 h-5' : 'w-4 h-4')} />
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          </TooltipTrigger>
          {collapsed && (
            <TooltipContent side="right" className="bg-slate-800 text-white border-slate-700">
              {item.label}
            </TooltipContent>
          )}
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Section with children
  return (
    <div className="space-y-0.5">
      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={onToggle}
              data-testid={`nav-${item.id}-toggle`}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                'hover:bg-slate-700/50',
                isOpen || isChildActive
                  ? 'text-white bg-slate-800/50'
                  : 'text-slate-400 hover:text-white',
                collapsed && 'justify-center px-2'
              )}
            >
              <Icon className={cn('flex-shrink-0', collapsed ? 'w-5 h-5' : 'w-4 h-4')} />
              {!collapsed && (
                <>
                  <span className="flex-1 text-left">{item.label}</span>
                  <ChevronRight 
                    className={cn(
                      'w-4 h-4 transition-transform duration-200',
                      isOpen && 'rotate-90'
                    )} 
                  />
                </>
              )}
            </button>
          </TooltipTrigger>
          {collapsed && (
            <TooltipContent side="right" className="bg-slate-800 text-white border-slate-700">
              {item.label}
            </TooltipContent>
          )}
        </Tooltip>
      </TooltipProvider>
      
      {/* Children */}
      {!collapsed && isOpen && (
        <div className="ml-3 pl-3 border-l border-slate-700/50 space-y-0.5 animate-in slide-in-from-top-2 duration-200">
          {item.children.map(child => {
            const ChildIcon = child.icon;
            return (
              <NavLink
                key={child.id}
                to={child.path}
                data-testid={`nav-${child.id}`}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-150',
                    isActive
                      ? 'bg-[#316585]/20 text-white font-medium'
                      : 'text-slate-400 hover:text-white hover:bg-slate-700/30'
                  )
                }
              >
                <ChildIcon className="w-4 h-4" />
                <span>{child.label}</span>
                {child.isNew && (
                  <Badge variant="secondary" className="ml-auto text-[10px] px-1.5 py-0 bg-emerald-500/20 text-emerald-400 border-0">
                    Mới
                  </Badge>
                )}
              </NavLink>
            );
          })}
        </div>
      )}
    </div>
  );
};

// User Section Component
const UserSection = ({ user, collapsed, onLogout }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  
  return (
    <div className="p-3 border-t border-slate-700/50">
      {!collapsed ? (
        <>
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#316585] to-[#4a8fb5] flex items-center justify-center font-semibold text-white text-sm flex-shrink-0">
              {user?.full_name?.charAt(0) || user?.name?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 text-left min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {user?.full_name || user?.name || 'User'}
              </p>
              <p className="text-xs text-slate-400 truncate">{getRoleLabel(user?.role)}</p>
            </div>
            <ChevronDown className={cn(
              'w-4 h-4 text-slate-400 transition-transform',
              showDropdown && 'rotate-180'
            )} />
          </button>
          
          {showDropdown && (
            <div className="mt-1 animate-in slide-in-from-top-2 duration-150">
              <button
                onClick={onLogout}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Đăng xuất
              </button>
            </div>
          )}
        </>
      ) : (
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={onLogout}
                className="w-full flex justify-center p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" className="bg-slate-800 text-white border-slate-700">
              Đăng xuất
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
};

// Main Sidebar Component
export default function Sidebar() {
  const { user, logout, hasRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [openSections, setOpenSections] = useState({});

  // Filter navigation by user role
  const filteredNavigation = useMemo(() => {
    const userRole = user?.role || 'sales';
    
    return NAVIGATION.map(item => {
      // Check if user has access to this section
      const hasAccess = item.roles.some(role => {
        if (Array.isArray(role)) {
          return role.includes(userRole);
        }
        return hasRole([role]);
      });
      
      if (!hasAccess) return null;
      
      // Filter children if exists
      if (item.children) {
        const filteredChildren = item.children.filter(child => {
          return child.roles.some(role => {
            if (Array.isArray(role)) {
              return role.includes(userRole);
            }
            return hasRole([role]);
          });
        });
        
        if (filteredChildren.length === 0) return null;
        
        return { ...item, children: filteredChildren };
      }
      
      return item;
    }).filter(Boolean);
  }, [user?.role, hasRole]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // ACCORDION BEHAVIOR: Only one section can be open at a time
  const toggleSection = (sectionId) => {
    setOpenSections(prev => {
      // If clicking on already open section, close it
      if (prev[sectionId]) {
        return { [sectionId]: false };
      }
      // Otherwise, close all and open only this one
      return { [sectionId]: true };
    });
  };

  // Determine which sections should be open based on current path
  useEffect(() => {
    const currentPath = location.pathname;
    
    // Find the active module and open only that one
    let activeModuleId = null;
    filteredNavigation.forEach(item => {
      if (item.children) {
        const isChildActive = item.children.some(child => 
          currentPath.startsWith(child.path?.split('?')[0] || '')
        );
        if (isChildActive) {
          activeModuleId = item.id;
        }
      }
    });
    
    // Set only the active module as open (accordion behavior)
    if (activeModuleId) {
      setOpenSections({ [activeModuleId]: true });
    }
  }, [location.pathname]);

  return (
    <aside 
      className={cn(
        'fixed left-0 top-0 h-full bg-slate-900 text-slate-200 z-50 flex flex-col shadow-xl transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
      data-testid="sidebar"
    >
      {/* Header with Logo and Collapse Button */}
      <div className={cn(
        'h-16 flex items-center border-b border-slate-700/50',
        collapsed ? 'px-3 justify-center' : 'px-4 justify-between'
      )}>
        <Logo collapsed={collapsed} />
        {!collapsed && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(true)}
            className="h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <PanelLeftClose className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Expand button when collapsed */}
      {collapsed && (
        <div className="px-3 py-2 border-b border-slate-700/50">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(false)}
            className="w-full h-8 text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <PanelLeft className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 py-3 px-2 overflow-y-auto custom-scrollbar">
        <div className="space-y-1">
          {filteredNavigation.map(item => (
            <MenuSection
              key={item.id}
              item={item}
              isOpen={openSections[item.id] || false}
              onToggle={() => toggleSection(item.id)}
              collapsed={collapsed}
              currentPath={location.pathname}
            />
          ))}
        </div>
      </nav>

      {/* User Section */}
      <UserSection 
        user={user} 
        collapsed={collapsed} 
        onLogout={handleLogout} 
      />
      
      {/* Custom scrollbar styles */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(100, 116, 139, 0.3);
          border-radius: 2px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(100, 116, 139, 0.5);
        }
      `}</style>
    </aside>
  );
}
