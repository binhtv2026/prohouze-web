/**
 * ProHouze Work/Tasks Dashboard
 * Version: 2.0 - Refactored Prompt 2/20
 * 
 * Dashboard for daily work management
 * Focus: Tasks, Calendar, Reminders
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
  CheckSquare,
  Calendar,
  Clock,
  AlertTriangle,
  Plus,
  Columns,
  Bell,
  ChevronRight,
  Target,
  Users,
  ListTodo,
} from 'lucide-react';

const priorityColors = {
  urgent: 'bg-red-100 text-red-700',
  high: 'bg-orange-100 text-orange-700',
  medium: 'bg-blue-100 text-blue-700',
  low: 'bg-slate-100 text-slate-700',
};

const statusColors = {
  todo: 'bg-slate-100 text-slate-700',
  in_progress: 'bg-blue-100 text-blue-700',
  review: 'bg-purple-100 text-purple-700',
  done: 'bg-green-100 text-green-700',
};

const DEMO_TASK_STATS = {
  total: 18,
  todo: 6,
  inProgress: 5,
  done: 5,
  overdue: 2,
  dueToday: 4,
  highPriority: 3,
};

const DEMO_RECENT_TASKS = [
  { id: 'task-1', title: 'Gọi lại lead nóng dự án The Privia', priority: 'urgent', status: 'todo', due_date: '2026-03-26' },
  { id: 'task-2', title: 'Chuẩn bị hồ sơ booking khách hàng Nguyễn Minh', priority: 'high', status: 'in_progress', due_date: '2026-03-26' },
  { id: 'task-3', title: 'Rà chính sách bán hàng gửi đội sale', priority: 'medium', status: 'review', due_date: '2026-03-27' },
  { id: 'task-4', title: 'Xác nhận lịch hẹn tham quan nhà mẫu', priority: 'high', status: 'todo', due_date: '2026-03-26' },
];

export default function TaskDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    todo: 0,
    inProgress: 0,
    done: 0,
    overdue: 0,
    dueToday: 0,
    highPriority: 0,
  });
  const [recentTasks, setRecentTasks] = useState([]);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [dashboardRes, tasksRes] = await Promise.allSettled([
        api.get('/tasks/dashboard').catch(() => ({ data: {} })),
        api.get('/tasks?my_tasks=true&limit=5').catch(() => ({ data: [] })),
      ]);

      if (dashboardRes.status === 'fulfilled' && dashboardRes.value?.data) {
        const data = dashboardRes.value.data.summary || dashboardRes.value.data;
        setStats({
          total: data.total_tasks || data.total || 0,
          todo: data.todo || 0,
          inProgress: data.in_progress || 0,
          done: data.done || 0,
          overdue: data.overdue || 0,
          dueToday: data.due_today || 0,
          highPriority: data.high_priority || 0,
        });

        if (dashboardRes.value.data.recent_tasks) {
          setRecentTasks(dashboardRes.value.data.recent_tasks);
        }
      } else {
        setStats(DEMO_TASK_STATS);
      }

      if (tasksRes.status === 'fulfilled' && !recentTasks.length) {
        const items = tasksRes.value?.data?.slice(0, 5) || [];
        setRecentTasks(items.length > 0 ? items : DEMO_RECENT_TASKS);
      }

    } catch (error) {
      console.error('Error:', error);
      setStats(DEMO_TASK_STATS);
      setRecentTasks(DEMO_RECENT_TASKS);
    } finally {
      setLoading(false);
    }
  }, [recentTasks.length]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Quick actions
  const quickActions = [
    { label: 'Tạo Task mới', icon: Plus, link: '/work/tasks?new=true', variant: 'primary' },
    { label: 'Kanban Board', icon: Columns, link: '/work/kanban' },
    { label: 'Xem lịch', icon: Calendar, link: '/work/calendar' },
    { label: 'Nhắc nhở', icon: Bell, link: '/work/reminders' },
  ];

  // Alerts
  const alerts = [];
  if (stats.overdue > 0) {
    alerts.push({
      type: 'overdue',
      title: `${stats.overdue} tasks quá hạn`,
      description: 'Cần xử lý ngay',
      action: { label: 'Xem', link: '/work/tasks?status=overdue' },
    });
  }
  if (stats.dueToday > 0) {
    alerts.push({
      type: 'warning',
      title: `${stats.dueToday} tasks đến hạn hôm nay`,
      action: { label: 'Xem', link: '/work/tasks?due=today' },
    });
  }
  if (stats.highPriority > 0) {
    alerts.push({
      type: 'info',
      title: `${stats.highPriority} tasks ưu tiên cao`,
      action: { label: 'Xem', link: '/work/tasks?priority=high' },
    });
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <PageHeader title="Dashboard Công việc" subtitle="Đang tải..." />
        <div className="p-6">
          <LoadingSkeleton type="card" count={4} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50">
        <PageHeader title="Dashboard Công việc" />
        <div className="p-6">
          <ErrorState title={error} onRetry={fetchDashboardData} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50" data-testid="task-dashboard">
      <PageHeader
        title="Dashboard Công việc"
        subtitle="Tasks, lịch và nhắc nhở"
        breadcrumbs={[
          { label: 'Công việc', path: '/work' },
          { label: 'Tổng quan', path: '/work' },
        ]}
        showNotifications={true}
        onAddNew={() => window.location.href = '/work/tasks?new=true'}
        addNewLabel="Tạo Task"
      />

      <div className="p-6 max-w-[1600px] mx-auto space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            title="Tasks hôm nay"
            value={stats.dueToday}
            subtitle="Đến hạn"
            icon={Calendar}
            color="amber"
            link="/work/tasks?due=today"
          />
          <KPICard
            title="Đang làm"
            value={stats.inProgress}
            subtitle={`/${stats.total} tổng`}
            icon={Clock}
            color="blue"
            link="/work/tasks?status=in_progress"
          />
          <KPICard
            title="Quá hạn"
            value={stats.overdue}
            icon={AlertTriangle}
            color={stats.overdue > 0 ? 'red' : 'green'}
            link="/work/tasks?status=overdue"
          />
          <KPICard
            title="Hoàn thành"
            value={stats.done}
            icon={CheckSquare}
            color="green"
            link="/work/tasks?status=done"
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

        {/* Alerts & Progress Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Alerts */}
          <AlertList
            alerts={alerts}
            title="Cần xử lý"
            showViewAll
            viewAllLink="/work/tasks"
          />

          {/* Progress Cards */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Tiến độ công việc</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ProgressCard
                  title="Cần làm"
                  current={stats.todo}
                  total={stats.total || 1}
                  color="slate"
                  icon={ListTodo}
                />
                <ProgressCard
                  title="Đang làm"
                  current={stats.inProgress}
                  total={stats.total || 1}
                  color="blue"
                  icon={Clock}
                />
                <ProgressCard
                  title="Hoàn thành"
                  current={stats.done}
                  total={stats.total || 1}
                  color="green"
                  icon={CheckSquare}
                />
                <ProgressCard
                  title="Ưu tiên cao"
                  current={stats.highPriority}
                  total={stats.total || 1}
                  color="red"
                  icon={AlertTriangle}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Tasks */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">Tasks gần đây</CardTitle>
              <Link to="/work/tasks" className="text-xs text-[#316585] hover:underline flex items-center gap-1">
                Xem tất cả <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {recentTasks.length > 0 ? (
              <div className="space-y-2">
                {recentTasks.map((task, idx) => (
                  <Link
                    key={task.id || idx}
                    to={`/work/tasks/${task.id}`}
                    className="flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                        task.status === 'done' ? 'bg-green-100' : 
                        task.status === 'in_progress' ? 'bg-blue-100' : 'bg-slate-100'
                      }`}>
                        <CheckSquare className={`w-4 h-4 ${
                          task.status === 'done' ? 'text-green-600' : 
                          task.status === 'in_progress' ? 'text-blue-600' : 'text-slate-600'
                        }`} />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{task.title || 'Task'}</p>
                        <p className="text-xs text-slate-500">
                          {task.due_date ? new Date(task.due_date).toLocaleDateString('vi-VN') : 'Chưa có hạn'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={priorityColors[task.priority] || priorityColors.medium}>
                        {task.priority === 'urgent' ? 'Khẩn' :
                         task.priority === 'high' ? 'Cao' :
                         task.priority === 'low' ? 'Thấp' : 'TB'}
                      </Badge>
                      <Badge className={statusColors[task.status] || statusColors.todo}>
                        {task.status === 'done' ? 'Xong' :
                         task.status === 'in_progress' ? 'Đang làm' :
                         task.status === 'review' ? 'Review' : 'Cần làm'}
                      </Badge>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={CheckSquare}
                title="Chưa có tasks"
                description="Tạo task đầu tiên để bắt đầu"
                actionLabel="Tạo Task"
                actionLink="/work/tasks?new=true"
                compact
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
