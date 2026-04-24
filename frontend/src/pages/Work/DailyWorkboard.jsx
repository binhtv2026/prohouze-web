/**
 * ProHouze Daily Workboard (My Day)
 * Prompt 10/20 - Task, Reminder & Follow-up Operating System
 * 
 * Main screen for sales users showing:
 * - Daily stats
 * - Overdue tasks
 * - Today's tasks
 * - Upcoming tasks
 * - Recent activities
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  AlertTriangle, Clock, CheckCircle, Calendar,
  Phone, FileText, MapPin, MessageCircle, CreditCard,
  DollarSign, FolderOpen, RefreshCw, Plus, ChevronRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { toast } from 'sonner';
import TaskCompleteModal from '../../components/work/TaskCompleteModal';
import TaskRescheduleModal from '../../components/work/TaskRescheduleModal';
import CreateTaskModal from '../../components/work/CreateTaskModal';
import { 
  getDailyWorkboard, 
  getStatusColor, 
  getPriorityColor,
  getUrgencyLabel 
} from '../../lib/workApi';

const iconMap = {
  Phone, FileText, MapPin, MessageCircle, CreditCard,
  DollarSign, FolderOpen, RefreshCw, Calendar,
  AlertTriangle, CheckCircle, Clock
};

const getIcon = (iconName) => iconMap[iconName] || Clock;

const DEMO_WORKBOARD = {
  greeting: 'Chào buổi sáng',
  date_display: new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
  stats: {
    overdue_count: 1,
    today_count: 5,
    completed_today: 2,
    total_this_week: 18,
  },
  overdue_tasks: [
    { id: 'work-overdue-1', title: 'Gọi lại khách nóng dự án Rivera', icon: 'Phone', urgency: 'high', priority: 'urgent', due_time: '09:00' },
  ],
  today_tasks: [
    { id: 'work-today-1', title: 'Dẫn khách đi xem nhà mẫu', icon: 'MapPin', urgency: 'high', priority: 'high', due_time: '14:00' },
    { id: 'work-today-2', title: 'Gửi bảng giá và chính sách', icon: 'FileText', urgency: 'medium', priority: 'medium', due_time: '11:30' },
  ],
  upcoming_tasks: [
    { id: 'work-upcoming-1', title: 'Họp team sales đầu tuần', icon: 'Calendar', urgency: 'medium', priority: 'low', due_time: 'Ngày mai' },
  ],
  recent_activities: [
    { id: 'work-activity-1', action: 'Đã hoàn thành follow-up khách Hùng', time_display: '15 phút trước' },
    { id: 'work-activity-2', action: 'Đã tạo lịch hẹn xem nhà mẫu', time_display: '1 giờ trước' },
  ],
};

export default function DailyWorkboard() {
  const [workboard, setWorkboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // TODO: Get from auth context
  const userId = 'user-001';
  
  const fetchWorkboard = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getDailyWorkboard(userId);
      setWorkboard(data || DEMO_WORKBOARD);
    } catch (err) {
      toast.error('Khong the tai du lieu workboard');
      setWorkboard(DEMO_WORKBOARD);
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [userId]);
  
  useEffect(() => {
    fetchWorkboard();
  }, [fetchWorkboard]);
  
  const handleCompleteClick = (task) => {
    setSelectedTask(task);
    setShowCompleteModal(true);
  };
  
  const handleRescheduleClick = (task) => {
    setSelectedTask(task);
    setShowRescheduleModal(true);
  };
  
  const handleTaskAction = () => {
    setShowCompleteModal(false);
    setShowRescheduleModal(false);
    setShowCreateModal(false);
    setSelectedTask(null);
    fetchWorkboard();
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  if (!workboard) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Khong co du lieu</p>
        <Button onClick={fetchWorkboard} className="mt-4">Thu lai</Button>
      </div>
    );
  }
  
  const { greeting, date_display, stats, overdue_tasks, today_tasks, upcoming_tasks, recent_activities } = workboard;
  
  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen" data-testid="daily-workboard">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900" data-testid="workboard-greeting">
            {greeting}!
          </h1>
          <p className="text-gray-500 flex items-center gap-2 mt-1">
            <Calendar className="w-4 h-4" />
            {date_display}
          </p>
        </div>
        <Button 
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 hover:bg-blue-700"
          data-testid="create-task-btn"
        >
          <Plus className="w-4 h-4 mr-2" />
          Tao task moi
        </Button>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4" data-testid="workboard-stats">
        <Card className={stats.overdue_count > 0 ? 'border-red-200 bg-red-50' : ''}>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Qua han</p>
                <p className="text-2xl font-bold text-red-600" data-testid="overdue-count">
                  {stats.overdue_count}
                </p>
              </div>
              <AlertTriangle className={`w-8 h-8 ${stats.overdue_count > 0 ? 'text-red-500' : 'text-gray-300'}`} />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Hom nay</p>
                <p className="text-2xl font-bold text-blue-600" data-testid="today-count">
                  {stats.today_count}
                </p>
              </div>
              <Clock className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Da xong</p>
                <p className="text-2xl font-bold text-green-600" data-testid="completed-count">
                  {stats.completed_today}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Tong tuan</p>
                <p className="text-2xl font-bold text-gray-700" data-testid="week-count">
                  {stats.total_this_week}
                </p>
              </div>
              <Calendar className="w-8 h-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Column - Today's Tasks */}
        <div className="lg:col-span-2 space-y-6">
          {/* Overdue Tasks */}
          {overdue_tasks.length > 0 && (
            <Card className="border-red-200" data-testid="overdue-section">
              <CardHeader className="bg-red-50 border-b border-red-100">
                <CardTitle className="text-red-700 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  QUA HAN CAN XU LY NGAY ({overdue_tasks.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y">
                  {overdue_tasks.map((task) => (
                    <TaskItem 
                      key={task.id} 
                      task={task} 
                      isOverdue 
                      onComplete={() => handleCompleteClick(task)}
                      onReschedule={() => handleRescheduleClick(task)}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Today's Tasks */}
          <Card data-testid="today-section">
            <CardHeader className="border-b">
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-600" />
                VIEC HOM NAY ({today_tasks.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {today_tasks.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Khong co viec cho hom nay
                </div>
              ) : (
                <div className="divide-y">
                  {today_tasks.map((task) => (
                    <TaskItem 
                      key={task.id} 
                      task={task}
                      onComplete={() => handleCompleteClick(task)}
                      onReschedule={() => handleRescheduleClick(task)}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Upcoming Tasks */}
          {upcoming_tasks.length > 0 && (
            <Card data-testid="upcoming-section">
              <CardHeader className="border-b">
                <CardTitle className="flex items-center gap-2 text-gray-600">
                  <Calendar className="w-5 h-5" />
                  SAP TOI ({upcoming_tasks.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y">
                  {upcoming_tasks.map((task) => (
                    <TaskItem 
                      key={task.id} 
                      task={task}
                      isUpcoming
                      onComplete={() => handleCompleteClick(task)}
                      onReschedule={() => handleRescheduleClick(task)}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
        
        {/* Sidebar - Recent Activities */}
        <div className="space-y-6">
          <Card data-testid="activities-section">
            <CardHeader className="border-b">
              <CardTitle className="text-sm flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                HOAT DONG GAN DAY
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {recent_activities.length === 0 ? (
                <div className="text-center py-6 text-gray-500 text-sm">
                  Chua co hoat dong hom nay
                </div>
              ) : (
                <div className="divide-y">
                  {recent_activities.map((activity) => (
                    <div key={activity.id} className="p-3">
                      <div className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {activity.title}
                          </p>
                          <p className="text-xs text-gray-500">
                            {activity.outcome_label}
                            {activity.outcome_notes && (
                              <span className="block mt-1 text-gray-400 truncate">
                                {activity.outcome_notes}
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Modals */}
      {showCompleteModal && selectedTask && (
        <TaskCompleteModal
          task={selectedTask}
          onClose={() => {
            setShowCompleteModal(false);
            setSelectedTask(null);
          }}
          onSuccess={handleTaskAction}
        />
      )}
      
      {showRescheduleModal && selectedTask && (
        <TaskRescheduleModal
          task={selectedTask}
          onClose={() => {
            setShowRescheduleModal(false);
            setSelectedTask(null);
          }}
          onSuccess={handleTaskAction}
        />
      )}
      
      {showCreateModal && (
        <CreateTaskModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleTaskAction}
        />
      )}
    </div>
  );
}

// Task Item Component
function TaskItem({ task, isOverdue, isUpcoming, onComplete, onReschedule }) {
  const IconComponent = getIcon(task.task_type_icon);
  
  return (
    <div 
      className={`p-4 hover:bg-gray-50 transition-colors ${isOverdue ? 'bg-red-50/50' : ''}`}
      data-testid={`task-item-${task.id}`}
    >
      <div className="flex items-start gap-3">
        {/* Time/Status */}
        <div className="flex-shrink-0 w-16 text-center">
          {isOverdue ? (
            <span className="text-xs text-red-600 font-medium">
              {getUrgencyLabel(task.hours_until_due)}
            </span>
          ) : (
            <span className="text-sm font-medium text-gray-700">
              {task.due_time}
            </span>
          )}
        </div>
        
        {/* Icon */}
        <div className={`flex-shrink-0 p-2 rounded-full ${
          isOverdue ? 'bg-red-100' : 'bg-blue-100'
        }`}>
          <IconComponent className={`w-4 h-4 ${
            isOverdue ? 'text-red-600' : 'text-blue-600'
          }`} />
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-900 truncate">
              {task.title}
            </span>
            <Badge className={getPriorityColor(task.priority)} variant="secondary">
              {task.priority_label}
            </Badge>
          </div>
          
          <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
            <Badge variant="outline" className="text-xs">
              {task.related_entity_type}
            </Badge>
            {task.related_entity_name && (
              <span className="truncate">{task.related_entity_name}</span>
            )}
            {task.customer_name && (
              <>
                <span>|</span>
                <span className="truncate">{task.customer_name}</span>
              </>
            )}
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex-shrink-0 flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={onReschedule}
            className="text-gray-600"
            data-testid={`reschedule-btn-${task.id}`}
          >
            Doi lich
          </Button>
          <Button
            size="sm"
            onClick={onComplete}
            className={isOverdue ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}
            data-testid={`complete-btn-${task.id}`}
          >
            Hoan thanh
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}
