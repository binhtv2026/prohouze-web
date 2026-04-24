/**
 * ProHouze PageHeader Component
 * Standard header for all pages - ensures consistent UX across the app
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Search,
  Plus,
  Bell,
  MessageSquare,
  ChevronRight,
  Home,
  Filter,
  Download,
  MoreHorizontal,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Breadcrumb from './Breadcrumb';

export default function PageHeader({
  // Required
  title,
  
  // Optional - Breadcrumb
  breadcrumbs = [],
  
  // Optional - Subtitle/description
  subtitle,
  
  // Optional - Badge next to title
  badge,
  badgeVariant = 'secondary',
  
  // Optional - Search
  onSearch,
  searchPlaceholder = 'Tìm kiếm...',
  searchValue = '',
  
  // Optional - Primary Action (Add New)
  onAddNew,
  addNewLabel = 'Thêm mới',
  addNewIcon: AddNewIcon = Plus,
  
  // Optional - Secondary Actions
  actions = [],
  
  // Optional - Filter
  onFilter,
  filterCount = 0,
  
  // Optional - Export
  onExport,
  
  // Optional - Tabs (for tabbed pages)
  tabs,
  activeTab,
  onTabChange,
  
  // Optional - Stats row below header
  stats,
  
  // Optional - Custom right content
  rightContent,
  
  // Optional - Notifications
  showNotifications = false,
  notificationCount = 0,
  
  // Optional - AI Quick Access
  showAIButton = false,
  onAIClick,
  
  // Styling
  className,
  sticky = true,
}) {
  const navigate = useNavigate();

  return (
    <header
      className={cn(
        'bg-white/95 backdrop-blur-md border-b border-slate-200',
        sticky && 'sticky top-0 z-40',
        className
      )}
      data-testid="page-header"
    >
      {/* Main Header Row */}
      <div className="px-6 py-4">
        <div className="flex items-center justify-between gap-4">
          {/* Left Side: Breadcrumb, Title, Subtitle */}
          <div className="min-w-0 flex-1">
            {/* Breadcrumb */}
            {breadcrumbs.length > 0 && (
              <Breadcrumb items={breadcrumbs} className="mb-1" />
            )}
            
            {/* Title Row */}
            <div className="flex items-center gap-3">
              <h1 
                className="text-xl font-bold text-slate-900 truncate"
                data-testid="page-title"
              >
                {title}
              </h1>
              
              {badge && (
                <Badge variant={badgeVariant} className="flex-shrink-0">
                  {badge}
                </Badge>
              )}
            </div>
            
            {/* Subtitle */}
            {subtitle && (
              <p className="text-sm text-slate-500 mt-0.5 truncate">
                {subtitle}
              </p>
            )}
          </div>

          {/* Right Side: Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Search */}
            {onSearch && (
              <div className="relative w-64 hidden md:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  type="text"
                  placeholder={searchPlaceholder}
                  value={searchValue}
                  onChange={(e) => onSearch(e.target.value)}
                  data-testid="search-input"
                  className="pl-9 h-9 bg-slate-50 border-slate-200 focus:bg-white text-sm"
                />
              </div>
            )}

            {/* Filter Button */}
            {onFilter && (
              <Button
                variant="outline"
                size="sm"
                onClick={onFilter}
                className="h-9 gap-2"
                data-testid="filter-btn"
              >
                <Filter className="w-4 h-4" />
                <span className="hidden sm:inline">Lọc</span>
                {filterCount > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                    {filterCount}
                  </Badge>
                )}
              </Button>
            )}

            {/* Export Button */}
            {onExport && (
              <Button
                variant="outline"
                size="sm"
                onClick={onExport}
                className="h-9 gap-2"
                data-testid="export-btn"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Xuất</span>
              </Button>
            )}

            {/* Custom Actions */}
            {actions.length > 0 && actions.length <= 2 && actions.map((action, idx) => (
              <Button
                key={idx}
                variant={action.variant || 'outline'}
                size="sm"
                onClick={action.onClick}
                className={cn('h-9 gap-2', action.className)}
                data-testid={`action-${idx}`}
              >
                {action.icon && <action.icon className="w-4 h-4" />}
                <span className="hidden sm:inline">{action.label}</span>
              </Button>
            ))}

            {/* More Actions Dropdown (if > 2 actions) */}
            {actions.length > 2 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-9">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {actions.map((action, idx) => (
                    <DropdownMenuItem key={idx} onClick={action.onClick}>
                      {action.icon && <action.icon className="w-4 h-4 mr-2" />}
                      {action.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* Notifications */}
            {showNotifications && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="relative h-9 w-9"
                    data-testid="notifications-btn"
                  >
                    <Bell className="w-5 h-5 text-slate-600" />
                    {notificationCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center">
                        {notificationCount > 9 ? '9+' : notificationCount}
                      </span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80">
                  <DropdownMenuLabel>Thông báo</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <div className="max-h-64 overflow-y-auto">
                    <DropdownMenuItem className="flex flex-col items-start gap-1 py-3">
                      <span className="font-medium">Chưa có thông báo mới</span>
                      <span className="text-xs text-slate-500">Tất cả đã được xem</span>
                    </DropdownMenuItem>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* AI Button */}
            {showAIButton && (
              <Button
                variant="outline"
                size="icon"
                onClick={onAIClick || (() => navigate('/tools/ai'))}
                className="h-9 w-9 border-[#316585]/30 text-[#316585] hover:bg-[#316585]/10"
                data-testid="ai-quick-btn"
              >
                <MessageSquare className="w-5 h-5" />
              </Button>
            )}

            {/* Primary Action (Add New) */}
            {onAddNew && (
              <Button
                onClick={onAddNew}
                data-testid="add-new-btn"
                className="h-9 bg-[#316585] hover:bg-[#264f68] text-white gap-2"
              >
                <AddNewIcon className="w-4 h-4" />
                <span className="hidden sm:inline">{addNewLabel}</span>
              </Button>
            )}

            {/* Custom Right Content */}
            {rightContent}
          </div>
        </div>

        {/* Tabs Row */}
        {tabs && tabs.length > 0 && (
          <div className="mt-4 border-b border-slate-200 -mb-4">
            <nav className="flex gap-4" aria-label="Tabs">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => onTabChange?.(tab.id)}
                  className={cn(
                    'pb-3 px-1 text-sm font-medium border-b-2 transition-colors',
                    activeTab === tab.id
                      ? 'border-[#316585] text-[#316585]'
                      : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                  )}
                >
                  {tab.label}
                  {tab.count !== undefined && (
                    <Badge variant="secondary" className="ml-2 text-xs">
                      {tab.count}
                    </Badge>
                  )}
                </button>
              ))}
            </nav>
          </div>
        )}
      </div>

      {/* Stats Row (Optional) */}
      {stats && stats.length > 0 && (
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100">
          <div className="flex items-center gap-6 overflow-x-auto">
            {stats.map((stat, idx) => (
              <div key={idx} className="flex items-center gap-2 flex-shrink-0">
                {stat.icon && (
                  <div className={cn(
                    'w-8 h-8 rounded-lg flex items-center justify-center',
                    stat.iconBg || 'bg-slate-200'
                  )}>
                    <stat.icon className={cn('w-4 h-4', stat.iconColor || 'text-slate-600')} />
                  </div>
                )}
                <div>
                  <p className="text-xs text-slate-500">{stat.label}</p>
                  <p className="text-sm font-semibold text-slate-900">{stat.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}

// Export a simpler Header for backward compatibility
export function Header({ title, onSearch, onAddNew, addNewLabel }) {
  return (
    <PageHeader
      title={title}
      onSearch={onSearch}
      onAddNew={onAddNew}
      addNewLabel={addNewLabel}
      showNotifications={true}
      showAIButton={true}
    />
  );
}
