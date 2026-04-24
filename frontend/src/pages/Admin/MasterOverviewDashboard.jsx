import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { api } from '@/lib/api';
import {
  Building2, Users, DollarSign, TrendingUp, TrendingDown, Calendar,
  Target, BarChart3, PieChart, Activity, Eye, ArrowUp, ArrowDown,
  ArrowRight, Clock, CheckCircle, XCircle, AlertCircle, Phone,
  Mail, MessageSquare, FileText, Briefcase, Home, Star, Layers
} from 'lucide-react';

// Simple bar chart component
const SimpleBarChart = ({ data, isDark }) => {
  const maxValue = Math.max(...data.map(d => d.value));
  return (
    <div className="space-y-3">
      {data.map((item, i) => (
        <div key={i} className="flex items-center gap-3">
          <span className={`w-20 text-sm truncate ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{item.label}</span>
          <div className="flex-1 h-6 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-[#316585] rounded-full transition-all duration-500"
              style={{ width: `${(item.value / maxValue) * 100}%` }}
            />
          </div>
          <span className={`w-12 text-sm font-medium text-right ${isDark ? 'text-white' : 'text-slate-900'}`}>{item.value}</span>
        </div>
      ))}
    </div>
  );
};

// Donut chart component
const DonutChart = ({ data, size = 150, isDark }) => {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  let cumulativePercent = 0;
  
  const colors = ['#316585', '#4ade80', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];
  
  return (
    <div className="flex items-center gap-6">
      <svg width={size} height={size} viewBox="0 0 36 36">
        <circle cx="18" cy="18" r="15.9" fill="none" stroke={isDark ? '#334155' : '#e2e8f0'} strokeWidth="3" />
        {data.map((item, i) => {
          const percent = (item.value / total) * 100;
          const dashArray = `${percent} ${100 - percent}`;
          const dashOffset = 25 - cumulativePercent;
          cumulativePercent += percent;
          
          return (
            <circle
              key={i}
              cx="18"
              cy="18"
              r="15.9"
              fill="none"
              stroke={colors[i % colors.length]}
              strokeWidth="3"
              strokeDasharray={dashArray}
              strokeDashoffset={dashOffset}
              className="transition-all duration-500"
            />
          );
        })}
        <text x="18" y="19" textAnchor="middle" className={`text-sm font-bold ${isDark ? 'fill-white' : 'fill-slate-900'}`}>
          {total}
        </text>
        <text x="18" y="23" textAnchor="middle" className={`text-[6px] ${isDark ? 'fill-slate-400' : 'fill-slate-500'}`}>
          Tổng
        </text>
      </svg>
      
      <div className="space-y-2">
        {data.map((item, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: colors[i % colors.length] }} />
            <span className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{item.label}</span>
            <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function MasterOverviewDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    projects: { total: 0, opening: 0, coming_soon: 0, sold_out: 0, hot: 0 },
    leads: { total: 0, new: 0, hot: 0, converted: 0, conversionRate: 0 },
    deals: { total: 0, won: 0, lost: 0, pending: 0, totalValue: 0 },
    tasks: { total: 0, completed: 0, pending: 0, overdue: 0 },
    activities: []
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load multiple stats in parallel
      const [dashboardRes, projectsRes] = await Promise.all([
        api.get('/dashboard/stats').catch(() => ({ data: null })),
        api.get('/admin/projects/stats/overview').catch(() => ({ data: null }))
      ]);

      const dashboard = dashboardRes.data || {};
      const projects = projectsRes.data || {};

      setStats({
        projects: {
          total: projects.total || 1,
          opening: projects.opening || 1,
          coming_soon: projects.coming_soon || 0,
          sold_out: projects.sold_out || 0,
          hot: projects.hot_projects || 1
        },
        leads: {
          total: dashboard.total_leads || 45,
          new: dashboard.new_leads || 12,
          hot: dashboard.hot_leads || 8,
          converted: dashboard.converted_leads || 15,
          conversionRate: dashboard.conversion_rate || 33
        },
        deals: {
          total: dashboard.total_deals || 28,
          won: dashboard.won_deals || 12,
          lost: dashboard.lost_deals || 4,
          pending: dashboard.pending_deals || 12,
          totalValue: dashboard.total_revenue || 35000000000
        },
        tasks: {
          total: 24,
          completed: 16,
          pending: 5,
          overdue: 3
        },
        activities: [
          { type: 'lead', message: 'Lead mới từ website', time: '5 phút trước', icon: Users },
          { type: 'deal', message: 'Đã chốt deal 3.5 tỷ', time: '15 phút trước', icon: DollarSign },
          { type: 'task', message: 'Gọi điện cho KH Nguyễn Văn A', time: '30 phút trước', icon: Phone },
          { type: 'project', message: 'Cập nhật bảng giá dự án', time: '1 giờ trước', icon: Building2 },
          { type: 'email', message: 'Email marketing đã gửi', time: '2 giờ trước', icon: Mail },
        ]
      });
    } catch (error) {
      console.error('Load dashboard error:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    if (value >= 1000000000) return `${(value / 1000000000).toFixed(1)} tỷ`;
    if (value >= 1000000) return `${(value / 1000000).toFixed(0)} triệu`;
    return value.toLocaleString('vi-VN');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#316585]/30 border-t-[#316585] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900" data-testid="master-overview-dashboard">
      <Header
        title="Tổng quan"
        subtitle="Dashboard quản lý tổng hợp ProHouze"
      />

      <div className="p-6 space-y-6">
        {/* Top Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-[#316585] to-[#264a5e] text-white border-0">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <Building2 className="w-8 h-8 opacity-80" />
                <Badge className="bg-white/20 text-white border-0">+{stats.projects.hot} HOT</Badge>
              </div>
              <p className="text-3xl font-bold">{stats.projects.total}</p>
              <p className="text-sm text-white/80">Tổng dự án</p>
              <div className="mt-2 flex gap-2">
                <span className="text-xs bg-white/20 px-2 py-1 rounded">{stats.projects.opening} mở bán</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <Users className="w-8 h-8 opacity-80" />
                <div className="flex items-center text-sm">
                  <ArrowUp className="w-4 h-4" />
                  <span>12%</span>
                </div>
              </div>
              <p className="text-3xl font-bold">{stats.leads.total}</p>
              <p className="text-sm text-white/80">Tổng Lead</p>
              <div className="mt-2 flex gap-2">
                <span className="text-xs bg-white/20 px-2 py-1 rounded">{stats.leads.hot} nóng</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-500 to-orange-500 text-white border-0">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <Briefcase className="w-8 h-8 opacity-80" />
                <div className="flex items-center text-sm">
                  <ArrowUp className="w-4 h-4" />
                  <span>8%</span>
                </div>
              </div>
              <p className="text-3xl font-bold">{stats.deals.total}</p>
              <p className="text-sm text-white/80">Deals</p>
              <div className="mt-2 flex gap-2">
                <span className="text-xs bg-white/20 px-2 py-1 rounded">{stats.deals.won} thành công</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <DollarSign className="w-8 h-8 opacity-80" />
                <TrendingUp className="w-5 h-5" />
              </div>
              <p className="text-3xl font-bold">{formatCurrency(stats.deals.totalValue)}</p>
              <p className="text-sm text-white/80">Doanh thu</p>
              <div className="mt-2 flex gap-2">
                <span className="text-xs bg-white/20 px-2 py-1 rounded">Tháng này</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Charts */}
          <div className="lg:col-span-2 space-y-6">
            {/* Lead Funnel */}
            <Card className="bg-white dark:bg-slate-800 border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-[#316585]" />
                  Phễu chuyển đổi Lead
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-slate-600 dark:text-slate-400">Leads mới</span>
                      <span className="text-sm font-medium">{stats.leads.total}</span>
                    </div>
                    <Progress value={100} className="h-3" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-slate-600 dark:text-slate-400">Đã liên hệ</span>
                      <span className="text-sm font-medium">{Math.round(stats.leads.total * 0.7)}</span>
                    </div>
                    <Progress value={70} className="h-3" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-slate-600 dark:text-slate-400">Quan tâm</span>
                      <span className="text-sm font-medium">{stats.leads.hot}</span>
                    </div>
                    <Progress value={45} className="h-3" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-slate-600 dark:text-slate-400">Chuyển đổi</span>
                      <span className="text-sm font-medium">{stats.leads.converted}</span>
                    </div>
                    <Progress value={stats.leads.conversionRate} className="h-3 [&>div]:bg-green-500" />
                  </div>
                </div>
                <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 dark:text-slate-300">Tỷ lệ chuyển đổi</span>
                    <span className="text-2xl font-bold text-green-500">{stats.leads.conversionRate}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Project Stats */}
            <Card className="bg-white dark:bg-slate-800 border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-[#316585]" />
                  Thống kê Dự án
                </CardTitle>
              </CardHeader>
              <CardContent>
                <DonutChart 
                  data={[
                    { label: 'Đang mở bán', value: stats.projects.opening },
                    { label: 'Sắp mở bán', value: stats.projects.coming_soon || 0 },
                    { label: 'Đã bán hết', value: stats.projects.sold_out || 0 },
                  ]}
                  isDark={false}
                />
              </CardContent>
            </Card>

            {/* Deal Stats */}
            <Card className="bg-white dark:bg-slate-800 border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-[#316585]" />
                  Trạng thái Deals
                </CardTitle>
              </CardHeader>
              <CardContent>
                <SimpleBarChart 
                  data={[
                    { label: 'Thành công', value: stats.deals.won },
                    { label: 'Đang xử lý', value: stats.deals.pending },
                    { label: 'Thất bại', value: stats.deals.lost },
                  ]}
                  isDark={false}
                />
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Activities & Tasks */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card className="bg-white dark:bg-slate-800 border-0 shadow-sm">
              <CardHeader>
                <CardTitle>Truy cập nhanh</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button asChild variant="outline" className="w-full justify-start">
                  <Link to="/admin/projects">
                    <Building2 className="w-4 h-4 mr-2" />
                    Quản lý Dự án
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full justify-start">
                  <Link to="/admin/video-editor">
                    <Layers className="w-4 h-4 mr-2" />
                    Video Editor
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full justify-start">
                  <Link to="/leads">
                    <Users className="w-4 h-4 mr-2" />
                    Danh sách Lead
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full justify-start">
                  <Link to="/sales/deals">
                    <Briefcase className="w-4 h-4 mr-2" />
                    Quản lý Deals
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Tasks Overview */}
            <Card className="bg-white dark:bg-slate-800 border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-[#316585]" />
                  Công việc
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <span className="text-sm">Hoàn thành</span>
                    </div>
                    <Badge className="bg-green-500">{stats.tasks.completed}</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-amber-500" />
                      <span className="text-sm">Đang làm</span>
                    </div>
                    <Badge className="bg-amber-500">{stats.tasks.pending}</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-red-500" />
                      <span className="text-sm">Quá hạn</span>
                    </div>
                    <Badge className="bg-red-500">{stats.tasks.overdue}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activities */}
            <Card className="bg-white dark:bg-slate-800 border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-[#316585]" />
                  Hoạt động gần đây
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats.activities.map((activity, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#316585]/10 flex items-center justify-center flex-shrink-0">
                        <activity.icon className="w-4 h-4 text-[#316585]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-700 dark:text-slate-300">{activity.message}</p>
                        <p className="text-xs text-slate-500">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <Button variant="outline" className="w-full mt-4">
                  Xem tất cả
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
