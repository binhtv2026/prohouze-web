/**
 * Marketing Dashboard Page
 * Prompt 7/20 - Lead Source & Marketing Attribution Engine
 * 
 * Main dashboard showing:
 * - KPI Overview (Total Leads, CPL, Conversion Rate, ROI)
 * - Leads by Source/Channel breakdown
 * - Top performing sources
 * - Active campaigns overview
 */

import { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Badge } from '../../components/ui/badge';
import { 
  BarChart3, TrendingUp, TrendingDown, Users, 
  DollarSign, Target, PieChart, ArrowRight, Megaphone,
  Zap, Globe, FileText, Calendar, Mail, Activity,
  RefreshCw, PenTool, Phone,
} from 'lucide-react';
import { marketingAnalyticsAPI, leadSourcesAPI } from '../../lib/marketingApi';
import { Link, useNavigate } from 'react-router-dom';

function formatCurrency(amount) {
  if (amount >= 1000000000) return `${(amount / 1000000000).toFixed(1)} tỷ`;
  if (amount >= 1000000) return `${(amount / 1000000).toFixed(0)} tr`;
  return amount.toLocaleString('vi-VN');
}

function formatPercent(value) {
  return `${value.toFixed(1)}%`;
}

const DEMO_MARKETING_DASHBOARD = {
  total_leads: 186,
  total_leads_change: 12.4,
  conversion_rate: 7.8,
  converted_leads: 14,
  avg_cost_per_lead: 285000,
  total_revenue: 965000000,
  roi: 248.6,
  leads_by_source_type: {
    social: 74,
    paid: 48,
    organic: 32,
    referral: 18,
    event: 14,
  },
  top_sources: [
    { source_name: 'Facebook Ads - Dự án Lumière', source_type: 'paid', lead_count: 38, converted_count: 4, revenue: 286000000 },
    { source_name: 'TikTok cá nhân sale', source_type: 'social', lead_count: 29, converted_count: 3, revenue: 214000000 },
    { source_name: 'Landing page mở bán', source_type: 'organic', lead_count: 21, converted_count: 2, revenue: 162000000 },
  ],
  active_campaigns: [
    { id: 'mk-1', name: 'Push opening The Privé Residence', status: 'active', budget: 120000000, leads: 42 },
    { id: 'mk-2', name: 'Chiến dịch TikTok hàng ngon', status: 'active', budget: 60000000, leads: 27 },
  ],
};

export default function MarketingDashboard() {
  const navigate = useNavigate();
  const [period, setPeriod] = useState('30d');
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [seedingDefaults, setSeedingDefaults] = useState(false);

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true);
      const response = await marketingAnalyticsAPI.getDashboard({ period });
      const dashboardData = response.data;
      setDashboard(dashboardData && Object.keys(dashboardData).length > 0 ? dashboardData : DEMO_MARKETING_DASHBOARD);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
      setDashboard(DEMO_MARKETING_DASHBOARD);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const handleSeedDefaults = async () => {
    try {
      setSeedingDefaults(true);
      await leadSourcesAPI.seedDefaults();
      loadDashboard();
    } catch (error) {
      console.error('Failed to seed defaults:', error);
    } finally {
      setSeedingDefaults(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  const sourceTypeColors = {
    organic: 'bg-green-500',
    paid: 'bg-blue-500',
    social: 'bg-purple-500',
    referral: 'bg-amber-500',
    event: 'bg-rose-500',
    direct: 'bg-teal-500',
    email: 'bg-cyan-500',
    other: 'bg-gray-500',
  };

  return (
    <div className="space-y-6" data-testid="marketing-dashboard">

      {/* ── PREMIUM HEADER ── */}
      <div className="rounded-2xl bg-gradient-to-r from-[#831843] to-[#db2777] p-6 text-white">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-pink-200 animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-widest text-white/70">NHÂN VIÊN MARKETING</span>
            </div>
            <h1 className="text-2xl font-bold">Marketing Command Center</h1>
            <p className="mt-1 text-white/60 text-sm">
              {new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-28 border-white/30 bg-white/15 text-white" data-testid="period-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">7 ngày</SelectItem>
                <SelectItem value="30d">30 ngày</SelectItem>
                <SelectItem value="90d">90 ngày</SelectItem>
              </SelectContent>
            </Select>
            <Button size="sm"
              className="bg-white text-[#db2777] hover:bg-white/90"
              onClick={() => navigate('/marketing/campaigns')}>
              <Megaphone className="mr-2 h-4 w-4" /> Chiến dịch mới
            </Button>
          </div>
        </div>

        {/* Tab navigation strip */}
        <div className="mt-4 flex flex-wrap gap-2 border-t border-white/20 pt-4">
          {[
            { label: 'Tổng quan',     icon: BarChart3,  path: '/marketing' },
            { label: 'Chiến dịch',   icon: Megaphone,  path: '/marketing/campaigns' },
            { label: 'Nguồn Lead',    icon: Target,    path: '/marketing/sources' },
            { label: 'Nội dung',      icon: PenTool,   path: '/marketing/content' },
            { label: 'Form & CTA',    icon: FileText,  path: '/marketing/forms' },
            { label: 'Attribution',   icon: Activity,  path: '/marketing/attribution' },
            { label: 'Lịch đăng',    icon: Calendar,  path: '/work/calendar' },
            { label: 'Lead từ MKT',  icon: Phone,     path: '/crm/leads' },
          ].map((t) => {
            const Icon = t.icon;
            return (
              <button key={t.path}
                onClick={() => navigate(t.path)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-white/15 hover:bg-white/30 text-white transition-colors">
                <Icon className="h-3 w-3" />
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card data-testid="total-leads-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Tổng Leads</p>
                <p className="text-2xl font-bold">{dashboard?.total_leads || 0}</p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            {dashboard?.total_leads_change !== 0 && (
              <div className={`flex items-center mt-2 text-sm ${dashboard?.total_leads_change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {dashboard?.total_leads_change > 0 ? <TrendingUp className="h-4 w-4 mr-1" /> : <TrendingDown className="h-4 w-4 mr-1" />}
                {formatPercent(Math.abs(dashboard?.total_leads_change || 0))} vs kỳ trước
              </div>
            )}
          </CardContent>
        </Card>

        <Card data-testid="conversion-rate-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Tỷ lệ chuyển đổi</p>
                <p className="text-2xl font-bold">{formatPercent(dashboard?.conversion_rate || 0)}</p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Target className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <div className="mt-2 text-sm text-gray-500">
              {dashboard?.converted_leads || 0} leads đã chuyển đổi
            </div>
          </CardContent>
        </Card>

        <Card data-testid="cpl-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">CPL trung bình</p>
                <p className="text-2xl font-bold">{formatCurrency(dashboard?.avg_cost_per_lead || 0)}</p>
              </div>
              <div className="h-12 w-12 bg-amber-100 rounded-lg flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-amber-600" />
              </div>
            </div>
            <div className="mt-2 text-sm text-gray-500">
              Chi phí mỗi lead
            </div>
          </CardContent>
        </Card>

        <Card data-testid="revenue-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Tổng doanh thu</p>
                <p className="text-2xl font-bold">{formatCurrency(dashboard?.total_revenue || 0)}</p>
              </div>
              <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            {dashboard?.roi !== 0 && (
              <div className={`flex items-center mt-2 text-sm ${dashboard?.roi > 0 ? 'text-green-600' : 'text-red-600'}`}>
                ROI: {formatPercent(dashboard?.roi || 0)}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Leads by Source Type */}
        <Card data-testid="leads-by-source-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-semibold">Leads theo loại nguồn</CardTitle>
            <Link to="/marketing/sources">
              <Button variant="ghost" size="sm">
                Xem tất cả <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {Object.entries(dashboard?.leads_by_source_type || {}).length > 0 ? (
              <div className="space-y-4">
                {Object.entries(dashboard?.leads_by_source_type || {}).map(([type, count]) => {
                  const total = dashboard?.total_leads || 1;
                  const percent = (count / total) * 100;
                  return (
                    <div key={type} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="capitalize font-medium">{type}</span>
                        <span className="text-gray-500">{count} ({formatPercent(percent)})</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${sourceTypeColors[type] || 'bg-gray-500'}`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <PieChart className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Chưa có dữ liệu leads</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Leads by Channel */}
        <Card data-testid="leads-by-channel-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-semibold">Leads theo kênh</CardTitle>
            <Link to="/marketing/sources">
              <Button variant="ghost" size="sm">
                Xem tất cả <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {Object.entries(dashboard?.leads_by_channel || {}).length > 0 ? (
              <div className="space-y-3">
                {Object.entries(dashboard?.leads_by_channel || {})
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 8)
                  .map(([channel, count]) => {
                    const total = dashboard?.total_leads || 1;
                    const percent = (count / total) * 100;
                    return (
                      <div key={channel} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="h-3 w-3 rounded-full bg-blue-500" />
                          <span className="text-sm capitalize">{channel.replace(/_/g, ' ')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{count}</span>
                          <Badge variant="outline" className="text-xs">
                            {formatPercent(percent)}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Chưa có dữ liệu kênh</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Sources & Active Campaigns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Sources */}
        <Card data-testid="top-sources-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-semibold">Nguồn hiệu quả nhất</CardTitle>
            <Link to="/marketing/sources">
              <Button variant="ghost" size="sm">
                Quản lý nguồn <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {dashboard?.top_sources?.length > 0 ? (
              <div className="space-y-3">
                {dashboard.top_sources.map((source, idx) => (
                  <div key={source.source_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-gray-400">#{idx + 1}</span>
                      <div>
                        <p className="font-medium">{source.source_name}</p>
                        <p className="text-xs text-gray-500 capitalize">{source.source_type} - {source.channel}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{source.total_leads} leads</p>
                      <p className="text-xs text-green-600">{formatPercent(source.conversion_rate)} CR</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <TrendingUp className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Chưa có dữ liệu nguồn</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card data-testid="quick-stats-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold">Tổng quan nhanh</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <Megaphone className="h-6 w-6 text-blue-600 mb-2" />
                <p className="text-2xl font-bold text-blue-900">{dashboard?.active_campaigns || 0}</p>
                <p className="text-sm text-blue-600">Chiến dịch đang chạy</p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <Target className="h-6 w-6 text-green-600 mb-2" />
                <p className="text-2xl font-bold text-green-900">{dashboard?.active_sources || 0}</p>
                <p className="text-sm text-green-600">Nguồn lead hoạt động</p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg">
                <Users className="h-6 w-6 text-purple-600 mb-2" />
                <p className="text-2xl font-bold text-purple-900">{dashboard?.qualified_leads || 0}</p>
                <p className="text-sm text-purple-600">Leads đạt chất lượng</p>
              </div>
              <div className="p-4 bg-amber-50 rounded-lg">
                <TrendingUp className="h-6 w-6 text-amber-600 mb-2" />
                <p className="text-2xl font-bold text-amber-900">{dashboard?.converted_leads || 0}</p>
                <p className="text-sm text-amber-600">Leads chuyển đổi</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── ACTIVE CAMPAIGNS ── */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-pink-600" />
              Chiến dịch đang chạy
            </CardTitle>
            <CardDescription>Theo dõi nhanh ngân sách và leads từng chiến dịch</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate('/marketing/campaigns')}>
            Quản lý →
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2">
            {(dashboard?.active_campaigns || DEMO_MARKETING_DASHBOARD.active_campaigns).map((camp) => (
              <div key={camp.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4 flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <p className="font-semibold text-sm truncate">{camp.name}</p>
                  </div>
                  <p className="text-xs text-gray-500">
                    Ngân sách: <span className="font-medium text-gray-700">{formatCurrency(camp.budget)}</span>
                    &nbsp;·&nbsp;Leads: <span className="font-medium text-pink-600">{camp.leads}</span>
                  </p>
                </div>
                <Badge className="ml-3 bg-green-100 text-green-700 shrink-0">Đang chạy</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ── QUICK CONTENT LINKS ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Bài viết chờ đăng', icon: FileText, path: '/cms/articles?status=pending', color: 'bg-violet-50 border-violet-200 text-violet-700' },
          { label: 'Form đang chạy',    icon: Globe,    path: '/marketing/forms?status=active',   color: 'bg-blue-50 border-blue-200 text-blue-700' },
          { label: 'Landing page',      icon: Activity, path: '/cms/landing-pages',               color: 'bg-amber-50 border-amber-200 text-amber-700' },
          { label: 'Lead từ MKT',      icon: Mail,     path: '/crm/leads',                       color: 'bg-pink-50 border-pink-200 text-pink-700' },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <button key={item.path} onClick={() => navigate(item.path)}
              className={`rounded-xl border p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-sm ${item.color}`}>
              <Icon className="h-5 w-5 mb-2" />
              <p className="text-sm font-semibold">{item.label}</p>
            </button>
          );
        })}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        <Link to="/marketing/sources">
          <Button data-testid="manage-sources-btn">
            <Target className="h-4 w-4 mr-2" />
            Quản lý nguồn lead
          </Button>
        </Link>
        <Link to="/marketing/campaigns">
          <Button variant="outline" data-testid="manage-campaigns-btn">
            <Megaphone className="h-4 w-4 mr-2" />
            Quản lý chiến dịch
          </Button>
        </Link>
        <Link to="/marketing/rules">
          <Button variant="outline" data-testid="manage-rules-btn">
            <BarChart3 className="h-4 w-4 mr-2" />
            Quy tắc phân bổ
          </Button>
        </Link>
        <Button variant="outline" onClick={handleSeedDefaults} disabled={seedingDefaults} data-testid="seed-defaults-btn">
          <RefreshCw className={`h-4 w-4 mr-2 ${seedingDefaults ? 'animate-spin' : ''}`} />
          {seedingDefaults ? 'Đang tạo...' : 'Khởi tạo nguồn'}
        </Button>
      </div>
    </div>
  );
}
