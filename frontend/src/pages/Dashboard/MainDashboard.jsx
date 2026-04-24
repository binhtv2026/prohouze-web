import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Link } from 'react-router-dom';
import {
  Users,
  DollarSign,
  MessageSquare,
  CheckSquare,
  UserCheck,
  TrendingUp,
  Building2,
  Target,
  Calendar,
  Clock,
  AlertTriangle,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Briefcase,
  PiggyBank,
  UserPlus,
  FileText,
  ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';

const DEMO_MAIN_DASHBOARD = {
  hrStats: { employees: 58, recruiting: 6, training: 4 },
  financeStats: { revenue: 12450000000, expense: 3860000000, profit: 8590000000 },
  taskStats: { todo: 18, inProgress: 12, done: 41, overdue: 3 },
  salesStats: { deals: 34, bookings: 12, revenue: 9650000000 },
  leadStats: { total: 186, new: 27, converted: 14 }
};

// Mini Dashboard Widget Component
const DashboardWidget = ({ title, value, subtitle, icon: Icon, trend, trendValue, color, link }) => {
  const colorClasses = {
    blue: 'from-blue-50 to-white border-blue-100',
    green: 'from-green-50 to-white border-green-100',
    purple: 'from-purple-50 to-white border-purple-100',
    amber: 'from-amber-50 to-white border-amber-100',
    red: 'from-red-50 to-white border-red-100',
    indigo: 'from-indigo-50 to-white border-indigo-100',
  };
  
  const iconColorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
    amber: 'bg-amber-100 text-amber-600',
    red: 'bg-red-100 text-red-600',
    indigo: 'bg-indigo-100 text-indigo-600',
  };
  
  return (
    <Card className={`bg-gradient-to-br ${colorClasses[color]} hover:shadow-md transition-shadow`}>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className={`h-12 w-12 rounded-xl ${iconColorClasses[color]} flex items-center justify-center`}>
              <Icon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-slate-500">{title}</p>
              <p className="text-2xl font-bold text-slate-900">{value}</p>
              {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
            </div>
          </div>
          {trend && (
            <div className={`flex items-center gap-1 text-sm ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
              {trend === 'up' ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
              {trendValue}
            </div>
          )}
        </div>
        {link && (
          <Link to={link} className="mt-4 flex items-center text-sm text-blue-600 hover:underline">
            Xem chi tiết <ChevronRight className="h-4 w-4" />
          </Link>
        )}
      </CardContent>
    </Card>
  );
};

// Sub-Dashboard Card Component
const SubDashboardCard = ({ title, description, icon: Icon, color, link, stats }) => {
  const colorClasses = {
    blue: 'border-blue-200 hover:border-blue-400',
    green: 'border-green-200 hover:border-green-400',
    purple: 'border-purple-200 hover:border-purple-400',
    amber: 'border-amber-200 hover:border-amber-400',
    red: 'border-red-200 hover:border-red-400',
    indigo: 'border-indigo-200 hover:border-indigo-400',
  };
  
  const iconColorClasses = {
    blue: 'bg-blue-600',
    green: 'bg-green-600',
    purple: 'bg-purple-600',
    amber: 'bg-amber-600',
    red: 'bg-red-600',
    indigo: 'bg-indigo-600',
  };
  
  return (
    <Link to={link}>
      <Card className={`border-2 ${colorClasses[color]} hover:shadow-lg transition-all cursor-pointer group`}>
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className={`h-14 w-14 rounded-xl ${iconColorClasses[color]} flex items-center justify-center shadow-lg`}>
              <Icon className="h-7 w-7 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg text-slate-900 group-hover:text-blue-600 transition-colors">
                {title}
              </h3>
              <p className="text-sm text-slate-500">{description}</p>
            </div>
          </div>
          {stats && (
            <div className="mt-4 grid grid-cols-3 gap-2 pt-4 border-t">
              {stats.map((stat, idx) => (
                <div key={idx} className="text-center">
                  <p className="text-lg font-bold text-slate-900">{stat.value}</p>
                  <p className="text-xs text-slate-500">{stat.label}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
};

export default function MainDashboard() {
  const { token, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [hrStats, setHrStats] = useState({ employees: 0, recruiting: 0, training: 0 });
  const [financeStats, setFinanceStats] = useState({ revenue: 0, expense: 0, profit: 0 });
  const [taskStats, setTaskStats] = useState({ todo: 0, inProgress: 0, done: 0, overdue: 0 });
  const [salesStats, setSalesStats] = useState({ deals: 0, bookings: 0, revenue: 0 });
  const [leadStats, setLeadStats] = useState({ total: 0, new: 0, converted: 0 });

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch multiple dashboard data in parallel
      const [hrRes, financeRes, taskRes, salesRes] = await Promise.allSettled([
        api.get('/hrm/dashboard').catch(() => ({ data: {} })),
        api.get('/finance/summary').catch(() => ({ data: {} })),
        api.get('/tasks/dashboard').catch(() => ({ data: {} })),
        api.get('/sales/dashboard').catch(() => ({ data: {} })),
      ]);
      
      // Parse HR stats
      if (hrRes.status === 'fulfilled' && hrRes.value?.data) {
        const hr = hrRes.value.data;
        setHrStats({
          employees: hr.total_employees || 0,
          recruiting: hr.open_positions || 0,
          training: hr.active_trainings || 0,
        });
      }
      
      // Parse Finance stats
      if (financeRes.status === 'fulfilled' && financeRes.value?.data) {
        const fin = financeRes.value.data;
        setFinanceStats({
          revenue: fin.total_revenue || 0,
          expense: fin.total_expense || 0,
          profit: (fin.total_revenue || 0) - (fin.total_expense || 0),
        });
      }
      
      // Parse Task stats
      if (taskRes.status === 'fulfilled' && taskRes.value?.data?.summary) {
        const task = taskRes.value.data.summary;
        setTaskStats({
          todo: task.todo || 0,
          inProgress: task.in_progress || 0,
          done: task.done || 0,
          overdue: task.overdue || 0,
        });
      }
      
      // Parse Sales stats
      if (salesRes.status === 'fulfilled' && salesRes.value?.data?.summary) {
        const sales = salesRes.value.data.summary;
        setSalesStats({
          deals: sales.total_deals || 0,
          bookings: sales.total_bookings || 0,
          revenue: sales.total_revenue || 0,
        });
      }
      
      // Fetch lead stats
      try {
        const leadsRes = await api.get('/leads?limit=1000');
        const leads = leadsRes.data || [];
        setLeadStats({
          total: leads.length,
          new: leads.filter(l => l.status === 'new').length,
          converted: leads.filter(l => l.status === 'converted').length,
        });
      } catch (e) {
        setLeadStats(DEMO_MAIN_DASHBOARD.leadStats);
      }
      
    } catch (error) {
      console.error('Error fetching dashboard:', error);
      setHrStats(DEMO_MAIN_DASHBOARD.hrStats);
      setFinanceStats(DEMO_MAIN_DASHBOARD.financeStats);
      setTaskStats(DEMO_MAIN_DASHBOARD.taskStats);
      setSalesStats(DEMO_MAIN_DASHBOARD.salesStats);
      setLeadStats(DEMO_MAIN_DASHBOARD.leadStats);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const formatCurrency = (value) => {
    if (value >= 1000000000) return `${(value / 1000000000).toFixed(1)} tỷ`;
    if (value >= 1000000) return `${(value / 1000000).toFixed(0)} tr`;
    return new Intl.NumberFormat('vi-VN').format(value);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="main-dashboard">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white">
        <h1 className="text-2xl font-bold">Xin chào, {user?.full_name || 'User'}!</h1>
        <p className="text-blue-100 mt-1">Đây là tổng quan hoạt động kinh doanh của bạn</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <DashboardWidget
          title="Doanh thu tháng"
          value={formatCurrency(financeStats.revenue)}
          icon={TrendingUp}
          color="green"
          trend="up"
          trendValue="+12.5%"
          link="/finance/revenue"
        />
        <DashboardWidget
          title="Leads mới"
          value={leadStats.new}
          subtitle={`/${leadStats.total} tổng`}
          icon={UserPlus}
          color="blue"
          link="/leads"
        />
        <DashboardWidget
          title="Deals đang xử lý"
          value={salesStats.deals}
          icon={Target}
          color="purple"
          link="/sales/deals"
        />
        <DashboardWidget
          title="Công việc trễ hạn"
          value={taskStats.overdue}
          icon={AlertTriangle}
          color={taskStats.overdue > 0 ? "red" : "green"}
          link="/tasks"
        />
      </div>

      {/* Sub-Dashboards */}
      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Dashboard theo Nhóm</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Nhân sự */}
          <SubDashboardCard
            title="Nhân sự"
            description="Quản lý nhân viên, tuyển dụng, đào tạo"
            icon={Users}
            color="blue"
            link="/dashboard/hr"
            stats={[
              { value: hrStats.employees, label: 'Nhân viên' },
              { value: hrStats.recruiting, label: 'Đang tuyển' },
              { value: hrStats.training, label: 'Đào tạo' },
            ]}
          />
          
          {/* Tài chính */}
          <SubDashboardCard
            title="Tài chính"
            description="Doanh thu, chi phí, công nợ, báo cáo"
            icon={DollarSign}
            color="green"
            link="/finance"
            stats={[
              { value: formatCurrency(financeStats.revenue), label: 'Doanh thu' },
              { value: formatCurrency(financeStats.expense), label: 'Chi phí' },
              { value: formatCurrency(financeStats.profit), label: 'Lợi nhuận' },
            ]}
          />
          
          {/* Omnichannel */}
          <SubDashboardCard
            title="Omnichannel"
            description="Marketing, chiến dịch, automation"
            icon={MessageSquare}
            color="purple"
            link="/dashboard/omnichannel"
            stats={[
              { value: 5, label: 'Kênh' },
              { value: 3, label: 'Chiến dịch' },
              { value: '85%', label: 'Hiệu suất' },
            ]}
          />
          
          {/* Công việc */}
          <SubDashboardCard
            title="Công việc"
            description="Tasks, calendar, KPI, reminders"
            icon={CheckSquare}
            color="amber"
            link="/dashboard/tasks"
            stats={[
              { value: taskStats.todo, label: 'Cần làm' },
              { value: taskStats.inProgress, label: 'Đang làm' },
              { value: taskStats.done, label: 'Hoàn thành' },
            ]}
          />
          
          {/* Khách hàng */}
          <SubDashboardCard
            title="Khách hàng"
            description="Leads, customers, phân khúc"
            icon={UserCheck}
            color="indigo"
            link="/dashboard/customers"
            stats={[
              { value: leadStats.total, label: 'Leads' },
              { value: leadStats.converted, label: 'Converted' },
              { value: `${leadStats.total > 0 ? ((leadStats.converted / leadStats.total) * 100).toFixed(0) : 0}%`, label: 'Tỷ lệ' },
            ]}
          />
          
          {/* Bán hàng */}
          <SubDashboardCard
            title="Bán hàng"
            description="Chiến dịch mở bán, dự án, pipeline"
            icon={Building2}
            color="red"
            link="/dashboard/sales"
            stats={[
              { value: salesStats.bookings, label: 'Booking' },
              { value: salesStats.deals, label: 'Deals' },
              { value: formatCurrency(salesStats.revenue), label: 'Doanh số' },
            ]}
          />
        </div>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Thao tác nhanh</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Link to="/crm/leads/new">
              <Button variant="outline" size="sm">
                <UserPlus className="h-4 w-4 mr-2" />
                Thêm Lead
              </Button>
            </Link>
            <Link to="/tasks?new=true">
              <Button variant="outline" size="sm">
                <CheckSquare className="h-4 w-4 mr-2" />
                Tạo Task
              </Button>
            </Link>
            <Link to="/sales/deals">
              <Button variant="outline" size="sm">
                <Target className="h-4 w-4 mr-2" />
                Xem Pipeline
              </Button>
            </Link>
            <Link to="/finance">
              <Button variant="outline" size="sm">
                <BarChart3 className="h-4 w-4 mr-2" />
                Báo cáo TC
              </Button>
            </Link>
            <Link to="/hrm/recruitment">
              <Button variant="outline" size="sm">
                <Briefcase className="h-4 w-4 mr-2" />
                Tuyển dụng
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
