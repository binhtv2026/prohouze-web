import React, { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { User, Calendar } from 'lucide-react';
import { toast } from 'sonner';

const columns = [
  { id: 'todo', label: 'Cần làm', color: 'bg-slate-100', borderColor: 'border-slate-300' },
  { id: 'in_progress', label: 'Đang làm', color: 'bg-blue-50', borderColor: 'border-blue-300' },
  { id: 'review', label: 'Review', color: 'bg-purple-50', borderColor: 'border-purple-300' },
  { id: 'done', label: 'Hoàn thành', color: 'bg-green-50', borderColor: 'border-green-300' },
];

const priorityColors = {
  urgent: 'bg-red-500',
  high: 'bg-orange-500',
  medium: 'bg-blue-500',
  low: 'bg-slate-400',
};

const DEMO_KANBAN_TASKS = [
  { id: 'kanban-demo-1', title: 'Gọi 3 khách nóng buổi sáng', description: 'Ưu tiên khách đã quan tâm căn góc dự án Rivera.', priority: 'urgent', status: 'todo', due_date: new Date().toISOString(), assignee_name: 'Bạn' },
  { id: 'kanban-demo-2', title: 'Cập nhật CRM sau buổi gặp khách', description: 'Bổ sung nhu cầu và mức ngân sách.', priority: 'high', status: 'in_progress', due_date: new Date(Date.now() + 86400000).toISOString(), assignee_name: 'Bạn' },
  { id: 'kanban-demo-3', title: 'Kiểm tra lại booking giữ chỗ', description: 'Đối chiếu chính sách mới nhất trước khi gửi khách.', priority: 'medium', status: 'review', due_date: new Date(Date.now() + 2 * 86400000).toISOString(), assignee_name: 'Bạn' },
  { id: 'kanban-demo-4', title: 'Gửi bảng giá cho khách Huy', description: 'Khách cần bảng giá và pháp lý trong chiều nay.', priority: 'low', status: 'done', due_date: new Date(Date.now() - 86400000).toISOString(), assignee_name: 'Bạn' },
];

export default function KanbanPage() {
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [draggedTask, setDraggedTask] = useState(null);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/tasks?my_tasks=true');
      const payload = Array.isArray(res?.data) && res.data.length > 0 ? res.data : DEMO_KANBAN_TASKS;
      setTasks(payload);
    } catch (error) {
      console.error('Error:', error);
      setTasks(DEMO_KANBAN_TASKS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleDragStart = (e, task) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e, newStatus) => {
    e.preventDefault();
    if (!draggedTask || draggedTask.status === newStatus) {
      setDraggedTask(null);
      return;
    }

    try {
      await api.put(`/tasks/${draggedTask.id}`, { status: newStatus });
      setTasks(tasks.map(t => 
        t.id === draggedTask.id ? { ...t, status: newStatus } : t
      ));
      toast.success('Cập nhật trạng thái thành công!');
    } catch (error) {
      toast.error('Lỗi khi cập nhật');
    }
    setDraggedTask(null);
  };

  const getTasksByStatus = (status) => tasks.filter(t => t.status === status);

  return (
    <div className="space-y-6" data-testid="kanban-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Kanban Board</h1>
          <p className="text-slate-500 text-sm mt-1">Kéo thả để cập nhật trạng thái task</p>
        </div>
      </div>

      {/* Kanban Columns */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {columns.map((column) => (
            <div
              key={column.id}
              className={`rounded-xl ${column.color} border-2 ${column.borderColor} p-4 min-h-[500px]`}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, column.id)}
              data-testid={`kanban-column-${column.id}`}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-slate-900">{column.label}</h3>
                <Badge variant="secondary">{getTasksByStatus(column.id).length}</Badge>
              </div>

              <div className="space-y-3">
                {getTasksByStatus(column.id).map((task) => (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, task)}
                    className={`bg-white rounded-lg p-3 shadow-sm border cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow ${
                      draggedTask?.id === task.id ? 'opacity-50' : ''
                    }`}
                    data-testid={`kanban-task-${task.id}`}
                  >
                    <div className="flex items-start gap-2">
                      <div className={`w-2 h-2 rounded-full mt-2 ${priorityColors[task.priority]}`} />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-slate-900">{task.title}</p>
                        {task.description && (
                          <p className="text-xs text-slate-500 mt-1 line-clamp-2">{task.description}</p>
                        )}
                        <div className="flex items-center gap-3 mt-2">
                          {task.due_date && (
                            <span className="flex items-center gap-1 text-xs text-slate-400">
                              <Calendar className="h-3 w-3" />
                              {new Date(task.due_date).toLocaleDateString('vi-VN')}
                            </span>
                          )}
                          {task.assignee_name && (
                            <span className="flex items-center gap-1 text-xs text-slate-400">
                              <User className="h-3 w-3" />
                              {task.assignee_name.split(' ').pop()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {getTasksByStatus(column.id).length === 0 && (
                  <div className="text-center py-8 text-slate-400 text-sm">
                    Kéo task vào đây
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
