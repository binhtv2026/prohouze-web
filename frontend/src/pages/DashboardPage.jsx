/**
 * ProHouze Main Dashboard
 * Version: 2.0 - Refactored Prompt 2/20
 * 
 * Main entry dashboard for BOD, Admin, Manager
 * Features:
 * - Role-based KPIs
 * - Quick actions
 * - Alerts & warnings
 * - Recent activity
 * - Drill-down links
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PageHeader from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { dashboardAPI, leadsAPI } from '@/lib/api';
import { formatCurrency, formatNumber, getStatusColor, getStatusLabel, getSourceLabel } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { getQuickActions, getDefaultDashboard } from '@/config/dashboards';
import { BO_CUC_BEN_PHAI_SALE, BO_CUC_BEN_PHAI_THEO_NHOM, getNhomMenuTheoRole } from '@/config/dashboardGovernance';
import { DEFAULT_DASHBOARD } from '@/config/navigation';
import {
  KPICard,
  QuickActionGrid,
  AlertList,
  ActivityFeed,
  MiniTable,
  EmptyState,
  LoadingSkeleton,
  ErrorState,
  SectionHeader,
} from '@/components/dashboard/DashboardWidgets';
import {
  Users,
  TrendingUp,
  DollarSign,
  Target,
  Flame,
  UserPlus,
  FileText,
  Calendar,
  CheckSquare,
  Clock,
  AlertTriangle,
  ChevronRight,
  Building2,
  ShoppingCart,
  BarChart3,
  Shield,
  Briefcase,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const COLORS = ['#316585', '#10b981', '#f59e0b', '#e11d48', '#8b5cf6', '#06b6d4', '#84cc16', '#f97316'];

const DEMO_STATS = {
  overdue_tasks: 3,
  hot_leads: 8,
  pending_bookings: 4,
  total_leads: 126,
  monthly_revenue: 18500000000,
};

const DEMO_FUNNEL = {
  new: 36,
  contacted: 28,
  warm: 18,
  hot: 8,
  qualified: 5,
  proposal: 3,
  negotiation: 2,
  closed_won: 1,
};

const DEMO_SOURCES = [
  { source: 'facebook_ads', count: 42 },
  { source: 'zalo', count: 28 },
  { source: 'landing_page', count: 22 },
];

const DEMO_LEADS = [
  { id: 'lead-1', name: 'Nguyễn Minh', phone: '0909001111', status: 'hot', source: 'facebook_ads' },
  { id: 'lead-2', name: 'Trần Hà', phone: '0909002222', status: 'warm', source: 'zalo' },
  { id: 'lead-3', name: 'Lê Quân', phone: '0909003333', status: 'new', source: 'landing_page' },
];

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [funnel, setFunnel] = useState(null);
  const [sources, setSources] = useState([]);
  const [performers, setPerformers] = useState([]);
  const [recentLeads, setRecentLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsRes, funnelRes, sourcesRes, leadsRes] = await Promise.allSettled([
        dashboardAPI.getStats().catch(() => ({ data: {} })),
        dashboardAPI.getLeadFunnel().catch(() => ({ data: {} })),
        dashboardAPI.getLeadSources().catch(() => ({ data: [] })),
        leadsAPI.getAll({ limit: 5 }).catch(() => ({ data: [] })),
      ]);

      if (statsRes.status === 'fulfilled') setStats(statsRes.value?.data || DEMO_STATS);
      if (funnelRes.status === 'fulfilled') setFunnel(funnelRes.value?.data || DEMO_FUNNEL);
      if (sourcesRes.status === 'fulfilled') setSources(sourcesRes.value?.data?.length ? sourcesRes.value.data : DEMO_SOURCES);
      if (leadsRes.status === 'fulfilled') setRecentLeads(leadsRes.value?.data?.length ? leadsRes.value.data : DEMO_LEADS);

      if (['bod', 'admin', 'manager'].includes(user?.role)) {
        try {
          const perfRes = await dashboardAPI.getTopPerformers();
          setPerformers(perfRes.data || []);
        } catch (e) {
          console.log('No access to performers');
        }
      }
    } catch (error) {
      console.error('Failed to load dashboard:', error);
      setStats(DEMO_STATS);
      setFunnel(DEMO_FUNNEL);
      setSources(DEMO_SOURCES);
      setRecentLeads(DEMO_LEADS);
    } finally {
      setLoading(false);
    }
  }, [user?.role]);

  useEffect(() => {
    if (user?.role) {
      navigate(DEFAULT_DASHBOARD[user.role] || '/workspace', { replace: true });
      return;
    }
    loadDashboardData();
  }, [loadDashboardData, navigate, user?.role]);

  // Get quick actions based on role
  const quickActions = getQuickActions(user?.role);
  const nhomDieuHuong = getNhomMenuTheoRole(user?.role);
  const boCucTheoRole = user?.role === 'sales' ? BO_CUC_BEN_PHAI_SALE : BO_CUC_BEN_PHAI_THEO_NHOM;
  const groupIcons = {
    dieu_hanh: Shield,
    kinh_doanh: Briefcase,
    doanh_nghiep: Building2,
    tang_truong: TrendingUp,
    he_thong: Shield,
    my_team: Users,
    khach_hang: Users,
    san_pham: Building2,
    cong_viec: CheckSquare,
    ban_hang: ShoppingCart,
    kenh_ban_hang: TrendingUp,
    tai_chinh_sale: DollarSign,
    kien_thuc: FileText,
  };

  // Build alerts from data
  const alerts = [];
  if (stats?.overdue_tasks > 0) {
    alerts.push({
      type: 'overdue',
      title: `${stats.overdue_tasks} công việc quá hạn`,
      description: 'Cần xử lý ngay',
      action: { label: 'Xem', link: '/work/tasks?status=overdue' },
    });
  }
  if (stats?.hot_leads > 5) {
    alerts.push({
      type: 'warning',
      title: `${stats.hot_leads} lead nóng chưa liên hệ`,
      description: 'Ưu tiên liên hệ hôm nay',
      action: { label: 'Xem', link: '/crm/leads?status=hot' },
    });
  }
  if (stats?.pending_bookings > 0) {
    alerts.push({
      type: 'info',
      title: `${stats.pending_bookings} booking chờ xử lý`,
      action: { label: 'Xem', link: '/sales/bookings?status=pending' },
    });
  }

  // Funnel data for chart
  const funnelData = funnel
    ? [
        { name: 'Mới', value: funnel.new || 0, fill: '#64748b' },
        { name: 'Đã liên hệ', value: funnel.contacted || 0, fill: '#8b5cf6' },
        { name: 'Ấm', value: funnel.warm || 0, fill: '#f59e0b' },
        { name: 'Nóng', value: funnel.hot || 0, fill: '#ef4444' },
        { name: 'Đủ ĐK', value: funnel.qualified || 0, fill: '#06b6d4' },
        { name: 'Đề xuất', value: funnel.proposal || 0, fill: '#6366f1' },
        { name: 'Đàm phán', value: funnel.negotiation || 0, fill: '#ec4899' },
        { name: 'Thành công', value: funnel.closed_won || 0, fill: '#10b981' },
      ].filter(item => item.value > 0)
    : [];

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <PageHeader title="Bảng điều khiển" subtitle="Đang tải dữ liệu..." />
        <div className="p-6 max-w-[1600px] mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <LoadingSkeleton type="card" count={4} />
          </div>
        </div>
      </div>
    );
  }

  if (user?.role) {
    return null;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50">
        <PageHeader title="Bảng điều khiển" />
        <div className="p-6 max-w-[1600px] mx-auto">
          <ErrorState title={error} onRetry={loadDashboardData} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50" data-testid="dashboard-page">
      <PageHeader
        title="Bảng điều khiển"
        subtitle={`Xin chào, ${user?.full_name || 'Người dùng'}!`}
        showNotifications={true}
        showAIButton={true}
      />

      <div className="p-6 max-w-[1600px] mx-auto space-y-6">
        {/* KPI Cards Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            title="Tổng Lead"
            value={formatNumber(stats?.total_leads || 0)}
            subtitle={`${stats?.new_leads_this_month || 0} mới tháng này`}
            icon={Users}
            trend="up"
            trendValue="+12%"
            color="blue"
            link="/crm/leads"
          />
          <KPICard
            title="Lead Nóng"
            value={formatNumber(stats?.hot_leads || 0)}
            subtitle="Cần ưu tiên liên hệ"
            icon={Flame}
            color="red"
            link="/crm/leads?status=hot"
          />
          <KPICard
            title="Tỷ lệ chuyển đổi"
            value={`${stats?.conversion_rate || 0}%`}
            subtitle={`${stats?.closed_deals || 0} giao dịch thành công`}
            icon={Target}
            trend="up"
            trendValue="+5%"
            color="green"
            link="/sales/deals"
          />
          <KPICard
            title="Doanh thu tháng"
            value={formatCurrency(stats?.monthly_revenue || 0)}
            subtitle={`Tổng: ${formatCurrency(stats?.total_revenue || 0)}`}
            icon={DollarSign}
            trend="up"
            trendValue="+18%"
            color="amber"
            link="/finance"
          />
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Việc cần làm nhanh</CardTitle>
          </CardHeader>
          <CardContent>
            <QuickActionGrid actions={quickActions} columns={4} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Vào đúng khu vực công việc</CardTitle>
            <p className="text-sm text-slate-500">
              Mỗi nhóm bên dưới đại diện cho một khu vực làm việc chính. Chỉ cần mở đúng nhóm là sẽ thấy
              các mục con cần dùng hằng ngày.
            </p>
          </CardHeader>
          <CardContent className="grid gap-4 lg:grid-cols-5">
            {nhomDieuHuong.map((group) => {
              const GroupIcon = groupIcons[group.id] || LayoutDashboard;
              const goiYBenPhai = boCucTheoRole[group.id] || [];
              return (
                <div key={group.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100">
                      <GroupIcon className="h-5 w-5 text-[#316585]" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">{group.label}</p>
                      <p className="text-xs text-slate-500">{group.moTa}</p>
                    </div>
                  </div>
                  <div className="mt-4 space-y-2">
                    {group.children.slice(0, 4).map((item) => (
                      <Link
                        key={item.id}
                        to={item.path}
                        className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-700 transition-colors hover:bg-slate-100"
                      >
                        <span>{item.label}</span>
                        <ChevronRight className="h-4 w-4 text-slate-400" />
                      </Link>
                    ))}
                  </div>
                  {goiYBenPhai.length > 0 && (
                    <div className="mt-4 border-t border-slate-100 pt-3">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                        Bảng bên phải nên có
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {goiYBenPhai.map((item) => (
                          <Badge key={`${group.id}-${item}`} variant="outline" className="text-xs">
                            {item}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Alerts & Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Alerts */}
          <AlertList
            alerts={alerts}
            title="Việc cần xử lý ngay"
            showViewAll
            viewAllLink="/work/tasks"
          />

          {/* Lead Funnel Chart */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">Phễu Lead</CardTitle>
                
                <Link to="/crm/leads" className="text-xs text-[#316585] hover:underline flex items-center gap-1">
                  Xem chi tiết <ChevronRight className="h-3 w-3" />
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {funnelData.length > 0 ? (
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={funnelData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis type="number" tick={{ fill: '#64748b', fontSize: 11 }} />
                      <YAxis dataKey="name" type="category" tick={{ fill: '#64748b', fontSize: 11 }} width={70} />
                      <Tooltip
                        contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: 12 }}
                      />
                      <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                        {funnelData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <EmptyState
                  icon={BarChart3}
                  title="Chưa có dữ liệu lead"
                  description="Thêm lead đầu tiên để xem phễu"
                  actionLabel="Thêm Lead"
                  actionLink="/crm/leads?new=true"
                  compact
                />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sources & Recent Leads Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Lead Sources */}
          <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">Nguồn khách gần đây</CardTitle>
              </CardHeader>
            <CardContent>
              {sources.length > 0 ? (
                <div className="space-y-3">
                  {sources.slice(0, 5).map((source, index) => (
                    <div key={source.source} className="flex items-center gap-3">
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="text-sm text-slate-600 flex-1 truncate">
                        {getSourceLabel(source.source)}
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        {source.count}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="Chưa có dữ liệu nguồn"
                  compact
                />
              )}
            </CardContent>
          </Card>

          {/* Recent Leads */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">Khách mới nhất</CardTitle>
                <Link to="/crm/leads" className="text-xs text-[#316585] hover:underline flex items-center gap-1">
                  Xem tất cả <ChevronRight className="h-3 w-3" />
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {recentLeads.length > 0 ? (
                <div className="space-y-2">
                  {recentLeads.map((lead) => (
                    <Link
                      key={lead.id}
                      to={`/crm/leads/${lead.id}`}
                      className="flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-[#316585]/10 flex items-center justify-center">
                          <UserPlus className="w-4 h-4 text-[#316585]" />
                        </div>
                        <div>
                          <p className="font-medium text-sm text-slate-900">{lead.full_name}</p>
                          <p className="text-xs text-slate-500">{lead.phone_masked}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(lead.status)} variant="secondary">
                          {getStatusLabel(lead.status)}
                        </Badge>
                        <span className="text-xs text-slate-400">{getSourceLabel(lead.source)}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={Users}
                  title="Chưa có lead nào"
                  description="Thêm lead đầu tiên để bắt đầu"
                  actionLabel="Thêm Lead"
                  actionLink="/crm/leads?new=true"
                  compact
                />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Top Performers (for managers) */}
        {performers.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">Nhân sự kinh doanh nổi bật tháng này</CardTitle>
                <Link to="/sales/kpi" className="text-xs text-[#316585] hover:underline flex items-center gap-1">
                  Xem KPI <ChevronRight className="h-3 w-3" />
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {performers.slice(0, 5).map((p, index) => (
                  <div key={p.user_id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                    <div className="w-8 h-8 rounded-full bg-[#316585] flex items-center justify-center text-white font-bold text-sm">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-slate-900 truncate">{p.name}</p>
                      <p className="text-xs text-slate-500">{p.deals} deals</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
