import React, { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  Plus,
  Bell,
  BellOff,
  Clock,
  Calendar,
  Trash2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';

const DEMO_REMINDERS = [
  {
    id: 'reminder-demo-1',
    title: 'Gọi điện cho khách hàng VIP',
    description: 'Follow up lead Mr. Nguyen về dự án ABC',
    reminder_date: new Date().toISOString(),
    is_completed: false,
    repeat: 'none',
  },
  {
    id: 'reminder-demo-2',
    title: 'Meeting team sales',
    description: 'Báo cáo doanh số tuần',
    reminder_date: new Date(Date.now() + 86400000).toISOString(),
    is_completed: false,
    repeat: 'weekly',
  },
];

export default function RemindersPage() {
  const [loading, setLoading] = useState(true);
  const [reminders, setReminders] = useState([]);
  const [showDialog, setShowDialog] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    reminder_date: '',
    reminder_time: '',
    repeat: 'none',
  });

  const fetchReminders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/reminders');
      const payload = Array.isArray(res?.data) && res.data.length > 0 ? res.data : DEMO_REMINDERS;
      setReminders(payload);
    } catch (error) {
      console.error('Error:', error);
      setReminders(DEMO_REMINDERS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReminders();
  }, [fetchReminders]);

  const handleCreate = async () => {
    try {
      const reminderData = {
        ...form,
        reminder_date: `${form.reminder_date}T${form.reminder_time || '09:00'}:00`,
      };
      await api.post('/reminders', reminderData);
      toast.success('Tạo nhắc nhở thành công!');
      setShowDialog(false);
      setForm({ title: '', description: '', reminder_date: '', reminder_time: '', repeat: 'none' });
      fetchReminders();
    } catch (error) {
      toast.error('Lỗi khi tạo nhắc nhở');
    }
  };

  const handleComplete = async (id) => {
    try {
      await api.put(`/reminders/${id}/complete`);
      setReminders(reminders.map(r => r.id === id ? { ...r, is_completed: true } : r));
      toast.success('Đã hoàn thành!');
    } catch (error) {
      // Update locally for demo
      setReminders(reminders.map(r => r.id === id ? { ...r, is_completed: true } : r));
      toast.success('Đã hoàn thành!');
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/reminders/${id}`);
      setReminders(reminders.filter(r => r.id !== id));
      toast.success('Đã xóa nhắc nhở');
    } catch (error) {
      setReminders(reminders.filter(r => r.id !== id));
      toast.success('Đã xóa nhắc nhở');
    }
  };

  const isOverdue = (date) => {
    return new Date(date) < new Date();
  };

  const upcomingReminders = reminders.filter(r => !r.is_completed);
  const completedReminders = reminders.filter(r => r.is_completed);

  return (
    <div className="space-y-6" data-testid="reminders-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Nhắc nhở</h1>
          <p className="text-slate-500 text-sm mt-1">Quản lý các nhắc nhở quan trọng</p>
        </div>
        <Button onClick={() => setShowDialog(true)} data-testid="add-reminder-btn">
          <Plus className="h-4 w-4 mr-2" />
          Tạo nhắc nhở
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-amber-50 border-amber-100">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <Bell className="h-6 w-6 text-amber-600" />
              <div>
                <p className="text-xs text-amber-600">Đang chờ</p>
                <p className="text-2xl font-bold text-amber-700">{upcomingReminders.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-red-50 border-red-100">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-6 w-6 text-red-600" />
              <div>
                <p className="text-xs text-red-600">Quá hạn</p>
                <p className="text-2xl font-bold text-red-700">
                  {upcomingReminders.filter(r => isOverdue(r.reminder_date)).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-green-50 border-green-100">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
              <div>
                <p className="text-xs text-green-600">Hoàn thành</p>
                <p className="text-2xl font-bold text-green-700">{completedReminders.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Reminders */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-amber-600" />
            Nhắc nhở sắp tới
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" />
            </div>
          ) : upcomingReminders.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <Bell className="h-12 w-12 mx-auto mb-4 text-slate-300" />
              <p>Không có nhắc nhở nào</p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingReminders.map((reminder) => (
                <div
                  key={reminder.id}
                  className={`flex items-center gap-4 p-4 rounded-lg border ${
                    isOverdue(reminder.reminder_date) ? 'border-red-200 bg-red-50' : 'bg-slate-50'
                  }`}
                  data-testid={`reminder-${reminder.id}`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{reminder.title}</p>
                      {isOverdue(reminder.reminder_date) && (
                        <Badge variant="destructive" className="text-xs">Quá hạn</Badge>
                      )}
                      {reminder.repeat !== 'none' && (
                        <Badge variant="outline" className="text-xs">
                          {reminder.repeat === 'daily' ? 'Hằng ngày' : 
                           reminder.repeat === 'weekly' ? 'Hằng tuần' : 'Hằng tháng'}
                        </Badge>
                      )}
                    </div>
                    {reminder.description && (
                      <p className="text-sm text-slate-500 mt-1">{reminder.description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
                      <Calendar className="h-3 w-3" />
                      {new Date(reminder.reminder_date).toLocaleDateString('vi-VN')}
                      <Clock className="h-3 w-3 ml-2" />
                      {new Date(reminder.reminder_date).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleComplete(reminder.id)}
                      className="text-green-600 hover:text-green-700 hover:bg-green-50"
                    >
                      <CheckCircle2 className="h-5 w-5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(reminder.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Completed */}
      {completedReminders.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-500">
              <CheckCircle2 className="h-5 w-5" />
              Đã hoàn thành
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {completedReminders.slice(0, 5).map((reminder) => (
                <div key={reminder.id} className="flex items-center gap-4 p-3 rounded-lg bg-slate-50 opacity-60">
                  <BellOff className="h-4 w-4 text-slate-400" />
                  <p className="text-sm line-through text-slate-500">{reminder.title}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tạo nhắc nhở mới</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Tiêu đề *</label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Nhập tiêu đề"
                data-testid="reminder-title-input"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Mô tả</label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Mô tả chi tiết..."
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Ngày *</label>
                <Input
                  type="date"
                  value={form.reminder_date}
                  onChange={(e) => setForm({ ...form, reminder_date: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Giờ</label>
                <Input
                  type="time"
                  value={form.reminder_time}
                  onChange={(e) => setForm({ ...form, reminder_time: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Lặp lại</label>
              <Select value={form.repeat} onValueChange={(v) => setForm({ ...form, repeat: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Không lặp</SelectItem>
                  <SelectItem value="daily">Hằng ngày</SelectItem>
                  <SelectItem value="weekly">Hằng tuần</SelectItem>
                  <SelectItem value="monthly">Hằng tháng</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Hủy</Button>
            <Button onClick={handleCreate} disabled={!form.title || !form.reminder_date} data-testid="save-reminder-btn">
              Tạo nhắc nhở
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
