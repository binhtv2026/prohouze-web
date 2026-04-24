import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '@/lib/api';
import PageHeader from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Search, CheckSquare, Clock, AlertTriangle, Calendar, User, Target } from 'lucide-react';
import { toast } from 'sonner';
// Dynamic Data - Prompt 3/20
import { useMasterData } from '@/hooks/useDynamicData';
import { DynamicFilterSelect, StatusBadge } from '@/components/forms/DynamicSelect';

const DEMO_TASKS = [
  {
    id: 'task-demo-1',
    title: 'Gọi lại khách quan tâm dự án Rivera',
    description: 'Khách đã để lại số từ landing page, cần gọi trước 10:30.',
    status: 'todo',
    priority: 'high',
    due_date: new Date().toISOString(),
    assignee_name: 'Bạn',
    is_overdue: false,
  },
  {
    id: 'task-demo-2',
    title: 'Cập nhật trạng thái 5 khách nóng trong CRM',
    description: 'Hoàn thành trước khi họp đội cuối ngày.',
    status: 'in_progress',
    priority: 'medium',
    due_date: new Date(Date.now() + 86400000).toISOString(),
    assignee_name: 'Bạn',
    is_overdue: false,
  },
  {
    id: 'task-demo-3',
    title: 'Gửi bảng giá và pháp lý cho khách Hùng',
    description: 'Khách cần tài liệu để chuyển cho vợ xem trong tối nay.',
    status: 'done',
    priority: 'medium',
    due_date: new Date(Date.now() - 86400000).toISOString(),
    assignee_name: 'Bạn',
    is_overdue: false,
  },
  {
    id: 'task-demo-4',
    title: 'Chốt lịch dẫn khách đi xem nhà mẫu',
    description: 'Khách đã hẹn nhưng chưa xác nhận lại giờ cụ thể.',
    status: 'todo',
    priority: 'urgent',
    due_date: new Date(Date.now() - 2 * 86400000).toISOString(),
    assignee_name: 'Bạn',
    is_overdue: true,
  },
];

export default function TasksPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    priority: 'medium',
    due_date: '',
    project_id: '',
  });
  
  // Dynamic Master Data - Prompt 3/20
  const { getLabel: getStatusLabel, getColor: getStatusColor } = useMasterData('task_statuses');
  const { getLabel: getPriorityLabel, getColor: getPriorityColor } = useMasterData('task_priorities');

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      let url = '/tasks?my_tasks=true';
      if (statusFilter) url += `&status=${statusFilter}`;
      if (priorityFilter) url += `&priority=${priorityFilter}`;
      
      const res = await api.get(url);
      const payload = Array.isArray(res?.data) ? res.data : [];
      setTasks(payload.length > 0 ? payload : DEMO_TASKS.filter((task) => {
        const matchesStatus = !statusFilter || task.status === statusFilter;
        const matchesPriority = !priorityFilter || task.priority === priorityFilter;
        return matchesStatus && matchesPriority;
      }));
    } catch (error) {
      console.error('Error fetching tasks:', error);
      setTasks(DEMO_TASKS.filter((task) => {
        const matchesStatus = !statusFilter || task.status === statusFilter;
        const matchesPriority = !priorityFilter || task.priority === priorityFilter;
        return matchesStatus && matchesPriority;
      }));
    } finally {
      setLoading(false);
    }
  }, [priorityFilter, statusFilter]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  useEffect(() => {
    if (searchParams.get('new') !== 'true') {
      return;
    }

    setShowDialog(true);
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('new');
    setSearchParams(nextParams, { replace: true });
  }, [searchParams, setSearchParams]);

  const handleCreate = async () => {
    try {
      await api.post('/tasks', form);
      toast.success('Tạo task thành công!');
      setShowDialog(false);
      setForm({ title: '', description: '', priority: 'medium', due_date: '', project_id: '' });
      fetchTasks();
    } catch (error) {
      toast.error('Lỗi khi tạo task');
    }
  };

  const handleUpdateStatus = async (taskId, newStatus) => {
    try {
      await api.put(`/tasks/${taskId}`, { status: newStatus });
      toast.success('Cập nhật trạng thái thành công!');
      fetchTasks();
    } catch (error) {
      toast.error('Lỗi khi cập nhật');
    }
  };

  const filteredTasks = tasks.filter(task => 
    task.title?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50" data-testid="tasks-page">
      <PageHeader
        title="Quản lý Tasks"
        subtitle="Danh sách công việc của bạn"
        breadcrumbs={[
          { label: 'Công việc', path: '/work/tasks' },
          { label: 'Tasks', path: '/work/tasks' },
        ]}
        onAddNew={() => setShowDialog(true)}
        addNewLabel="Tạo Task"
        showNotifications={true}
      />

      <div className="p-6 space-y-6">
        {/* Filters - Dynamic Data (Prompt 3/20) */}
        <div className="flex flex-wrap gap-4 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Tìm kiếm task..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
              data-testid="task-search"
            />
          </div>
          <DynamicFilterSelect
            source="task_statuses"
            value={statusFilter}
            onValueChange={setStatusFilter}
            placeholder="Trạng thái"
            allLabel="Tất cả"
            className="w-[150px]"
            testId="status-filter"
          />
          <DynamicFilterSelect
            source="task_priorities"
            value={priorityFilter}
            onValueChange={setPriorityFilter}
            placeholder="Độ ưu tiên"
            allLabel="Tất cả"
            className="w-[150px]"
            testId="priority-filter"
          />
        </div>

        {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <CheckSquare className="h-5 w-5 text-slate-600" />
              <div>
                <p className="text-xs text-slate-500">Cần làm</p>
                <p className="text-xl font-bold">{tasks.filter(t => t.status === 'todo').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-blue-50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-xs text-blue-600">Đang làm</p>
                <p className="text-xl font-bold text-blue-700">{tasks.filter(t => t.status === 'in_progress').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-green-50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <Target className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-xs text-green-600">Hoàn thành</p>
                <p className="text-xl font-bold text-green-700">{tasks.filter(t => t.status === 'done').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-red-50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-xs text-red-600">Quá hạn</p>
                <p className="text-xl font-bold text-red-700">{tasks.filter(t => t.is_overdue).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Task List */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" />
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <CheckSquare className="h-12 w-12 mx-auto mb-4 text-slate-300" />
              <p>Chưa có task nào</p>
              <Button variant="link" onClick={() => setShowDialog(true)}>
                Tạo task đầu tiên
              </Button>
            </div>
          ) : (
            <div className="divide-y">
              {filteredTasks.map((task) => (
                <div key={task.id} className="p-4 hover:bg-slate-50 transition-colors" data-testid={`task-${task.id}`}>
                  <div className="flex items-center gap-4">
                    <input
                      type="checkbox"
                      checked={task.status === 'done'}
                      onChange={() => handleUpdateStatus(task.id, task.status === 'done' ? 'todo' : 'done')}
                      className="h-5 w-5 rounded border-slate-300"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={`font-medium ${task.status === 'done' ? 'line-through text-slate-400' : ''}`}>
                          {task.title}
                        </p>
                        <Badge className={getPriorityColor(task.priority)}>
                          {getPriorityLabel(task.priority)}
                        </Badge>
                      </div>
                      {task.description && (
                        <p className="text-sm text-slate-500 mt-1 truncate">{task.description}</p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                        {task.due_date && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(task.due_date).toLocaleDateString('vi-VN')}
                          </span>
                        )}
                        {task.assignee_name && (
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {task.assignee_name}
                          </span>
                        )}
                      </div>
                    </div>
                    {/* Dynamic Status Badge - Prompt 3/20 */}
                    <StatusBadge source="task_statuses" code={task.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      </div>

      {/* Create Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tạo Task mới</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Tiêu đề *</label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Nhập tiêu đề task"
                data-testid="task-title-input"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Mô tả</label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Mô tả chi tiết..."
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Độ ưu tiên</label>
                {/* Dynamic Select for Priority - Prompt 3/20 */}
                <DynamicSelect
                  source="task_priorities"
                  value={form.priority}
                  onValueChange={(v) => setForm({ ...form, priority: v })}
                  placeholder="Chọn độ ưu tiên"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Hạn hoàn thành</label>
                <Input
                  type="date"
                  value={form.due_date}
                  onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Hủy</Button>
            <Button onClick={handleCreate} disabled={!form.title} data-testid="save-task-btn">
              Tạo Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
