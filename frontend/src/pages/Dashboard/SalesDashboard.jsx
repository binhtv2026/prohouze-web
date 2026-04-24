/**
 * ProHouze Sales Dashboard
 * Version: 2.0 - Refactored Prompt 2/20
 * 
 * Dashboard for Sales Manager, Team Leader
 * Focus: Pipeline, Deals, Bookings, KPI
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import {
  KPICard,
  QuickActionGrid,
  AlertList,
  EmptyState,
  LoadingSkeleton,
  ErrorState,
  ProgressCard,
} from '@/components/dashboard/DashboardWidgets';
import {
  Building2,
  Target,
  TrendingUp,
  Users,
  ShoppingCart,
  DollarSign,
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ChevronRight,
  BarChart3,
  Layers,
  MapPin,
  UserPlus,
  FileText,
  Plus,
} from 'lucide-react';

export default function SalesDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    activeCampaigns: 0,
    totalBookings: 0,
    totalDeals: 0,
    wonDeals: 0,
    lostDeals: 0,
    pipelineValue: 0,
    revenue: 0,
  });
  const [campaigns, setCampaigns] = useState([]);
  const [pipeline, setPipeline] = useState([]);
  const [recentBookings, setRecentBookings] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [dashboardRes, campaignsRes, pipelineRes, bookingsRes] = await Promise.allSettled([
        api.get('/sales/dashboard').catch(() => ({ data: {} })),
        api.get('/sales/campaigns').catch(() => ({ data: [] })),
        api.get('/sales/deals/pipeline').catch(() => ({ data: [] })),
        api.get('/sales/bookings?limit=5').catch(() => ({ data: [] })),
      ]);

      if (dashboardRes.status === 'fulfilled' && dashboardRes.value?.data) {
        const data = dashboardRes.value.data.summary || dashboardRes.value.data;
        setStats({
          activeCampaigns: data.active_campaigns || 0,
          totalBookings: data.total_bookings || 0,
          totalDeals: data.total_deals || 0,
          wonDeals: data.won_deals || 0,
          lostDeals: data.lost_deals || 0,
          pipelineValue: data.pipeline_value || 0,
          revenue: data.total_revenue || 0,
        });
      }

      if (campaignsRes.status === 'fulfilled') {
        setCampaigns(campaignsRes.value?.data?.slice(0, 3) || []);
      }

      if (pipelineRes.status === 'fulfilled') {
        setPipeline(pipelineRes.value?.data || []);
      }

      if (bookingsRes.status === 'fulfilled') {
        setRecentBookings(bookingsRes.value?.data || []);
      }

    } catch (error) {
      console.error('Error:', error);
      setError('Không thể tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    if (value >= 1000000000) return `${(value / 1000000000).toFixed(1)} tỷ`;
    if (value >= 1000000) return `${(value / 1000000).toFixed(0)} tr`;
    return new Intl.NumberFormat('vi-VN').format(value);
  };

  // Quick actions for sales
  const quickActions = [
    { label: 'Tạo Deal mới', icon: Plus, link: '/sales/deals?new=true', variant: 'primary' },
    { label: 'Thêm Booking', icon: ShoppingCart, link: '/sales/bookings?new=true' },
    { label: 'Xem Pipeline', icon: Target, link: '/sales/deals' },
    { label: 'KPI Team', icon: BarChart3, link: '/sales/kpi' },
  ];

  // Alerts
  const alerts = [];
  if (stats.totalBookings > 0) {
    alerts.push({
      type: 'info',
      title: `${stats.totalBookings} booking đang chờ`,
      action: { label: 'Xem', link: '/sales/bookings' },
    });
  }
  const pendingDeals = stats.totalDeals - stats.wonDeals - stats.lostDeals;
  if (pendingDeals > 5) {
    alerts.push({
      type: 'warning',
      title: `${pendingDeals} deals đang xử lý`,
      description: 'Cần follow-up',
      action: { label: 'Xem', link: '/sales/deals?status=pending' },
    });
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <PageHeader title="Dashboard Bán hàng" subtitle="Đang tải..." />
        <div className="p-6">
          <LoadingSkeleton type="card" count={4} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50">
        <PageHeader title="Dashboard Bán hàng" />
        <div className="p-6">
          <ErrorState title={error} onRetry={fetchDashboardData} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50" data-testid="sales-dashboard">
      <PageHeader
        title="Dashboard Bán hàng"
        subtitle="Pipeline, deals và hiệu suất kinh doanh"
        breadcrumbs={[
          { label: 'Bán hàng', path: '/sales' },
          { label: 'Tổng quan', path: '/sales' },
        ]}
        showNotifications={true}
        onAddNew={() => window.location.href = '/sales/deals?new=true'}
        addNewLabel="Tạo Deal"
      />

      <div className="p-6 max-w-[1600px] mx-auto space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            title="Deals đang xử lý"
            value={stats.totalDeals}
            subtitle={`${stats.wonDeals} thắng, ${stats.lostDeals} thua`}
            icon={Target}
            color="purple"
            link="/sales/deals"
          />
          <KPICard
            title="Giá trị Pipeline"
            value={formatCurrency(stats.pipelineValue)}
            icon={TrendingUp}
            color="indigo"
            link="/sales/deals"
          />
          <KPICard
            title="Bookings"
            value={stats.totalBookings}
            subtitle="Đang xử lý"
            icon={ShoppingCart}
            color="amber"
            link="/sales/bookings"
          />
          <KPICard
            title="Doanh thu tháng"
            value={formatCurrency(stats.revenue)}
            icon={DollarSign}
            trend="up"
            trendValue="+15%"
            color="green"
            link="/finance/revenue"
          />
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Hành động nhanh</CardTitle>
          </CardHeader>
          <CardContent>
            <QuickActionGrid actions={quickActions} columns={4} />
          </CardContent>
        </Card>

        {/* Alerts & Campaigns Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Alerts */}
          <AlertList
            alerts={alerts}
            title="Cần xử lý"
            showViewAll
            viewAllLink="/sales/deals"
          />

          {/* Active Campaigns */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">Chiến dịch đang chạy</CardTitle>
                <Link to="/inventory/campaigns" className="text-xs text-[#316585] hover:underline flex items-center gap-1">
                  Xem tất cả <ChevronRight className="h-3 w-3" />
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {campaigns.length > 0 ? (
                <div className="space-y-3">
                  {campaigns.map((campaign, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-[#316585]/10 flex items-center justify-center">
                          <Building2 className="w-5 h-5 text-[#316585]" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{campaign.name || 'Chiến dịch'}</p>
                          <p className="text-xs text-slate-500">
                            {campaign.project_name || 'Dự án'} • {campaign.available_units || 0} căn
                          </p>
                        </div>
                      </div>
                      <Badge className="bg-green-100 text-green-700">Đang bán</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={Layers}
                  title="Chưa có chiến dịch"
                  description="Tạo chiến dịch mở bán đầu tiên"
                  actionLabel="Tạo chiến dịch"
                  actionLink="/inventory/campaigns?new=true"
                  compact
                />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Pipeline & Bookings Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pipeline Stages */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">Pipeline theo Stage</CardTitle>
                <Link to="/sales/deals" className="text-xs text-[#316585] hover:underline flex items-center gap-1">
                  Xem chi tiết <ChevronRight className="h-3 w-3" />
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {pipeline.length > 0 ? (
                <div className="space-y-3">
                  {pipeline.map((stage, idx) => (
                    <ProgressCard
                      key={idx}
                      title={stage.name || `Stage ${idx + 1}`}
                      current={stage.count || 0}
                      total={stats.totalDeals || 1}
                      color={['blue', 'purple', 'amber', 'green'][idx % 4]}
                    />
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  <ProgressCard title="Tiếp cận" current={stats.totalDeals} total={stats.totalDeals || 1} color="blue" />
                  <ProgressCard title="Đàm phán" current={Math.floor(stats.totalDeals * 0.6)} total={stats.totalDeals || 1} color="purple" />
                  <ProgressCard title="Đề xuất" current={Math.floor(stats.totalDeals * 0.3)} total={stats.totalDeals || 1} color="amber" />
                  <ProgressCard title="Thành công" current={stats.wonDeals} total={stats.totalDeals || 1} color="green" />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Bookings */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">Booking gần đây</CardTitle>
                <Link to="/sales/bookings" className="text-xs text-[#316585] hover:underline flex items-center gap-1">
                  Xem tất cả <ChevronRight className="h-3 w-3" />
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {recentBookings.length > 0 ? (
                <div className="space-y-2">
                  {recentBookings.slice(0, 4).map((booking, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center">
                          <ShoppingCart className="w-4 h-4 text-amber-600" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{booking.customer_name || 'Khách hàng'}</p>
                          <p className="text-xs text-slate-500">{booking.product_name || 'Sản phẩm'}</p>
                        </div>
                      </div>
                      <Badge variant="outline">{formatCurrency(booking.amount || 0)}</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={ShoppingCart}
                  title="Chưa có booking"
                  description="Booking mới sẽ hiển thị ở đây"
                  actionLabel="Tạo booking"
                  actionLink="/sales/bookings?new=true"
                  compact
                />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
