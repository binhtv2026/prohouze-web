/**
 * ProHouze Dashboard Widget Library
 * Version: 1.0 - Prompt 2/20
 * 
 * Standard widgets for all dashboards - ensures consistency across the app
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  Info,
  RefreshCw,
  Plus,
  ExternalLink,
} from 'lucide-react';

// ============================================
// KPI STAT CARD
// Primary metric display with trend indicator
// ============================================
export function KPICard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendValue,
  color = 'blue',
  link,
  onClick,
  className,
}) {
  const colorStyles = {
    blue: { bg: 'bg-blue-50', border: 'border-blue-100', icon: 'bg-blue-100 text-blue-600', value: 'text-blue-700' },
    green: { bg: 'bg-green-50', border: 'border-green-100', icon: 'bg-green-100 text-green-600', value: 'text-green-700' },
    amber: { bg: 'bg-amber-50', border: 'border-amber-100', icon: 'bg-amber-100 text-amber-600', value: 'text-amber-700' },
    red: { bg: 'bg-red-50', border: 'border-red-100', icon: 'bg-red-100 text-red-600', value: 'text-red-700' },
    purple: { bg: 'bg-purple-50', border: 'border-purple-100', icon: 'bg-purple-100 text-purple-600', value: 'text-purple-700' },
    indigo: { bg: 'bg-indigo-50', border: 'border-indigo-100', icon: 'bg-indigo-100 text-indigo-600', value: 'text-indigo-700' },
    slate: { bg: 'bg-slate-50', border: 'border-slate-100', icon: 'bg-slate-100 text-slate-600', value: 'text-slate-700' },
  };

  const styles = colorStyles[color] || colorStyles.blue;
  
  const content = (
    <Card 
      className={cn(
        styles.bg, styles.border,
        'hover:shadow-md transition-all cursor-pointer',
        className
      )}
      onClick={onClick}
      data-testid={`kpi-card-${title?.toLowerCase().replace(/\s/g, '-')}`}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {Icon && (
              <div className={cn('h-10 w-10 rounded-xl flex items-center justify-center', styles.icon)}>
                <Icon className="h-5 w-5" />
              </div>
            )}
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{title}</p>
              <p className={cn('text-2xl font-bold', styles.value)}>{value}</p>
              {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
            </div>
          </div>
          {trend && (
            <div className={cn(
              'flex items-center gap-0.5 text-xs font-medium px-1.5 py-0.5 rounded',
              trend === 'up' ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100'
            )}>
              {trend === 'up' ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
              {trendValue}
            </div>
          )}
        </div>
        {link && (
          <div className="mt-3 pt-3 border-t border-slate-200/50">
            <span className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1">
              Xem chi tiết <ChevronRight className="h-3 w-3" />
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (link) {
    return <Link to={link}>{content}</Link>;
  }

  return content;
}

// ============================================
// QUICK ACTION GRID
// Grid of quick action buttons
// ============================================
export function QuickActionGrid({ actions, columns = 4, className }) {
  return (
    <div 
      className={cn(
        'grid gap-3',
        columns === 2 && 'grid-cols-2',
        columns === 3 && 'grid-cols-3',
        columns === 4 && 'grid-cols-2 md:grid-cols-4',
        columns === 6 && 'grid-cols-2 md:grid-cols-3 lg:grid-cols-6',
        className
      )}
      data-testid="quick-action-grid"
    >
      {actions.map((action, idx) => {
        const Icon = action.icon;
        const ActionWrapper = action.link ? Link : 'button';
        
        return (
          <ActionWrapper
            key={idx}
            to={action.link}
            onClick={action.onClick}
            className={cn(
              'flex items-center gap-3 p-3 rounded-lg border transition-all text-left',
              'bg-white hover:bg-slate-50 hover:border-slate-300',
              action.variant === 'primary' && 'bg-[#316585]/5 border-[#316585]/20 hover:bg-[#316585]/10',
              action.className
            )}
            data-testid={`quick-action-${idx}`}
          >
            {Icon && (
              <div className={cn(
                'h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0',
                action.variant === 'primary' ? 'bg-[#316585]/10 text-[#316585]' : 'bg-slate-100 text-slate-600'
              )}>
                <Icon className="h-4 w-4" />
              </div>
            )}
            <div className="min-w-0">
              <p className="font-medium text-sm text-slate-900 truncate">{action.label}</p>
              {action.description && (
                <p className="text-xs text-slate-500 truncate">{action.description}</p>
              )}
            </div>
          </ActionWrapper>
        );
      })}
    </div>
  );
}

// ============================================
// ALERT LIST
// List of alerts, warnings, overdue items
// ============================================
export function AlertList({ alerts, title = 'Cần xử lý', showViewAll, viewAllLink, className }) {
  const typeStyles = {
    warning: { icon: AlertTriangle, bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
    error: { icon: XCircle, bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
    info: { icon: Info, bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
    overdue: { icon: Clock, bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
    success: { icon: CheckCircle2, bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
  };

  if (!alerts || alerts.length === 0) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={CheckCircle2}
            title="Không có cảnh báo"
            description="Mọi thứ đang hoạt động bình thường"
            compact
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className} data-testid="alert-list">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            {title}
            <Badge variant="secondary" className="text-xs">{alerts.length}</Badge>
          </CardTitle>
          {showViewAll && viewAllLink && (
            <Link to={viewAllLink} className="text-xs text-[#316585] hover:underline flex items-center gap-1">
              Xem tất cả <ChevronRight className="h-3 w-3" />
            </Link>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {alerts.slice(0, 5).map((alert, idx) => {
          const style = typeStyles[alert.type] || typeStyles.info;
          const Icon = style.icon;
          
          return (
            <div
              key={idx}
              className={cn(
                'flex items-start gap-3 p-3 rounded-lg border',
                style.bg, style.border
              )}
            >
              <Icon className={cn('h-4 w-4 mt-0.5 flex-shrink-0', style.text)} />
              <div className="flex-1 min-w-0">
                <p className={cn('text-sm font-medium', style.text)}>{alert.title}</p>
                {alert.description && (
                  <p className="text-xs text-slate-600 mt-0.5">{alert.description}</p>
                )}
                {alert.time && (
                  <p className="text-xs text-slate-400 mt-1">{alert.time}</p>
                )}
              </div>
              {alert.action && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-xs"
                  onClick={alert.action.onClick}
                  asChild={!!alert.action.link}
                >
                  {alert.action.link ? (
                    <Link to={alert.action.link}>{alert.action.label}</Link>
                  ) : (
                    alert.action.label
                  )}
                </Button>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

// ============================================
// RECENT ACTIVITY FEED
// Timeline of recent activities
// ============================================
export function ActivityFeed({ activities, title = 'Hoạt động gần đây', showViewAll, viewAllLink, className }) {
  if (!activities || activities.length === 0) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={Clock}
            title="Chưa có hoạt động"
            description="Các hoạt động sẽ hiển thị ở đây"
            compact
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className} data-testid="activity-feed">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">{title}</CardTitle>
          {showViewAll && viewAllLink && (
            <Link to={viewAllLink} className="text-xs text-[#316585] hover:underline flex items-center gap-1">
              Xem tất cả <ChevronRight className="h-3 w-3" />
            </Link>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {activities.slice(0, 5).map((activity, idx) => {
            const Icon = activity.icon;
            return (
              <div key={idx} className="flex items-start gap-3">
                <div className={cn(
                  'h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0',
                  activity.color || 'bg-slate-100 text-slate-600'
                )}>
                  {Icon ? <Icon className="h-4 w-4" /> : (
                    <span className="text-xs font-semibold">{activity.user?.charAt(0) || '?'}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-700">
                    {activity.user && <span className="font-medium">{activity.user} </span>}
                    {activity.action}
                    {activity.target && (
                      <span className="font-medium"> {activity.target}</span>
                    )}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">{activity.time}</p>
                </div>
                {activity.link && (
                  <Link to={activity.link}>
                    <ExternalLink className="h-4 w-4 text-slate-400 hover:text-slate-600" />
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================
// MINI TABLE
// Compact table for dashboard widgets
// ============================================
export function MiniTable({ 
  columns, 
  data, 
  title, 
  showViewAll, 
  viewAllLink, 
  emptyMessage = 'Không có dữ liệu',
  className 
}) {
  return (
    <Card className={className} data-testid="mini-table">
      {title && (
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold">{title}</CardTitle>
            {showViewAll && viewAllLink && (
              <Link to={viewAllLink} className="text-xs text-[#316585] hover:underline flex items-center gap-1">
                Xem tất cả <ChevronRight className="h-3 w-3" />
              </Link>
            )}
          </div>
        </CardHeader>
      )}
      <CardContent className={!title ? 'pt-4' : ''}>
        {data && data.length > 0 ? (
          <div className="space-y-2">
            {data.slice(0, 5).map((row, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors"
              >
                {columns.map((col, colIdx) => (
                  <div key={colIdx} className={cn('flex-1', col.className)}>
                    {col.render ? col.render(row) : row[col.key]}
                  </div>
                ))}
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title={emptyMessage} compact />
        )}
      </CardContent>
    </Card>
  );
}

// ============================================
// EMPTY STATE
// Standard empty state component
// ============================================
export function EmptyState({ 
  icon: Icon, 
  title, 
  description, 
  action, 
  actionLabel, 
  actionLink,
  compact = false,
  className 
}) {
  return (
    <div 
      className={cn(
        'flex flex-col items-center justify-center text-center',
        compact ? 'py-6' : 'py-12',
        className
      )}
      data-testid="empty-state"
    >
      {Icon && (
        <div className={cn(
          'rounded-full bg-slate-100 flex items-center justify-center mb-3',
          compact ? 'h-10 w-10' : 'h-14 w-14'
        )}>
          <Icon className={cn('text-slate-400', compact ? 'h-5 w-5' : 'h-7 w-7')} />
        </div>
      )}
      <h3 className={cn(
        'font-medium text-slate-700',
        compact ? 'text-sm' : 'text-base'
      )}>
        {title}
      </h3>
      {description && (
        <p className={cn(
          'text-slate-500 mt-1',
          compact ? 'text-xs' : 'text-sm'
        )}>
          {description}
        </p>
      )}
      {(action || actionLink) && (
        <Button
          size={compact ? 'sm' : 'default'}
          className="mt-4"
          onClick={action}
          asChild={!!actionLink}
        >
          {actionLink ? (
            <Link to={actionLink}>
              <Plus className="h-4 w-4 mr-2" />
              {actionLabel || 'Thêm mới'}
            </Link>
          ) : (
            <>
              <Plus className="h-4 w-4 mr-2" />
              {actionLabel || 'Thêm mới'}
            </>
          )}
        </Button>
      )}
    </div>
  );
}

// ============================================
// LOADING SKELETON
// Skeleton loading state
// ============================================
export function LoadingSkeleton({ type = 'card', count = 1, className }) {
  const skeletons = {
    card: (
      <div className="animate-pulse">
        <div className="h-4 w-24 bg-slate-200 rounded mb-2" />
        <div className="h-8 w-16 bg-slate-200 rounded mb-1" />
        <div className="h-3 w-20 bg-slate-200 rounded" />
      </div>
    ),
    row: (
      <div className="animate-pulse flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
        <div className="h-10 w-10 bg-slate-200 rounded-full" />
        <div className="flex-1">
          <div className="h-4 w-32 bg-slate-200 rounded mb-1" />
          <div className="h-3 w-24 bg-slate-200 rounded" />
        </div>
        <div className="h-6 w-16 bg-slate-200 rounded" />
      </div>
    ),
    chart: (
      <div className="animate-pulse h-[200px] bg-slate-100 rounded-lg flex items-center justify-center">
        <div className="h-8 w-8 bg-slate-200 rounded" />
      </div>
    ),
  };

  return (
    <div className={cn('space-y-3', className)}>
      {Array.from({ length: count }).map((_, idx) => (
        <div key={idx}>{skeletons[type]}</div>
      ))}
    </div>
  );
}

// ============================================
// ERROR STATE
// Standard error state component
// ============================================
export function ErrorState({ 
  title = 'Có lỗi xảy ra', 
  description, 
  onRetry, 
  compact = false,
  className 
}) {
  return (
    <div 
      className={cn(
        'flex flex-col items-center justify-center text-center',
        compact ? 'py-6' : 'py-12',
        className
      )}
      data-testid="error-state"
    >
      <div className={cn(
        'rounded-full bg-red-100 flex items-center justify-center mb-3',
        compact ? 'h-10 w-10' : 'h-14 w-14'
      )}>
        <XCircle className={cn('text-red-500', compact ? 'h-5 w-5' : 'h-7 w-7')} />
      </div>
      <h3 className={cn(
        'font-medium text-slate-700',
        compact ? 'text-sm' : 'text-base'
      )}>
        {title}
      </h3>
      {description && (
        <p className={cn(
          'text-slate-500 mt-1',
          compact ? 'text-xs' : 'text-sm'
        )}>
          {description}
        </p>
      )}
      {onRetry && (
        <Button
          size={compact ? 'sm' : 'default'}
          variant="outline"
          className="mt-4"
          onClick={onRetry}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Thử lại
        </Button>
      )}
    </div>
  );
}

// ============================================
// SECTION HEADER
// Standard section divider with title
// ============================================
export function SectionHeader({ title, subtitle, action, actionLabel, actionLink, className }) {
  return (
    <div className={cn('flex items-center justify-between', className)}>
      <div>
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
      </div>
      {(action || actionLink) && (
        <Button
          size="sm"
          variant="outline"
          onClick={action}
          asChild={!!actionLink}
        >
          {actionLink ? (
            <Link to={actionLink}>
              {actionLabel || 'Xem tất cả'}
              <ChevronRight className="h-4 w-4 ml-1" />
            </Link>
          ) : (
            <>
              {actionLabel || 'Xem tất cả'}
              <ChevronRight className="h-4 w-4 ml-1" />
            </>
          )}
        </Button>
      )}
    </div>
  );
}

// ============================================
// PROGRESS CARD
// Card with progress indicator
// ============================================
export function ProgressCard({ 
  title, 
  current, 
  total, 
  unit = '', 
  color = 'blue',
  icon: Icon,
  link,
  className 
}) {
  const percentage = total > 0 ? Math.round((current / total) * 100) : 0;
  
  const colorStyles = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    amber: 'bg-amber-500',
    red: 'bg-red-500',
    purple: 'bg-purple-500',
  };

  const content = (
    <Card className={cn('hover:shadow-md transition-shadow', className)}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {Icon && <Icon className="h-4 w-4 text-slate-400" />}
            <span className="text-sm font-medium text-slate-700">{title}</span>
          </div>
          <span className="text-sm font-bold text-slate-900">{percentage}%</span>
        </div>
        <div className="w-full bg-slate-200 rounded-full h-2 mb-2">
          <div
            className={cn('h-2 rounded-full transition-all', colorStyles[color])}
            style={{ width: `${percentage}%` }}
          />
        </div>
        <p className="text-xs text-slate-500">
          {current}{unit} / {total}{unit}
        </p>
      </CardContent>
    </Card>
  );

  if (link) {
    return <Link to={link}>{content}</Link>;
  }

  return content;
}

export default {
  KPICard,
  QuickActionGrid,
  AlertList,
  ActivityFeed,
  MiniTable,
  EmptyState,
  LoadingSkeleton,
  ErrorState,
  SectionHeader,
  ProgressCard,
};
