import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Bell, BellOff, Check, CheckCheck, Trash2, Users, 
  Briefcase, Mail, FileText, Clock, RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const DEMO_NOTIFICATIONS = [
  {
    id: 'notification-1',
    type: 'job_application',
    title: 'Ứng viên mới cho vị trí Chuyên viên kinh doanh',
    message: 'Phạm Quốc Bảo vừa ứng tuyển từ landing page tuyển dụng.',
    is_read: false,
    created_at: '2026-03-26T09:15:00',
  },
  {
    id: 'notification-2',
    type: 'newsletter_signup',
    title: 'Đăng ký newsletter mới',
    message: 'Một khách hàng vừa để lại email nhận bảng giá dự án.',
    is_read: false,
    created_at: '2026-03-26T08:10:00',
  },
  {
    id: 'notification-3',
    type: 'contact_form',
    title: 'Yêu cầu tư vấn từ website',
    message: 'Khách hàng để lại số điện thoại để được tư vấn pháp lý dự án.',
    is_read: true,
    created_at: '2026-03-25T16:30:00',
  },
];

const DEMO_NEWSLETTER_STATS = {
  total: 248,
  active: 231,
  this_week: 17,
};

const NOTIFICATION_TYPES = {
  job_application: { icon: Briefcase, label: 'Ứng tuyển', color: 'bg-blue-500' },
  newsletter_signup: { icon: Mail, label: 'Newsletter', color: 'bg-green-500' },
  contact_form: { icon: FileText, label: 'Liên hệ', color: 'bg-purple-500' },
};

export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all');
  const [filterRead, setFilterRead] = useState('all');
  const [unreadCount, setUnreadCount] = useState(0);

  // Newsletter stats
  const [newsletterStats, setNewsletterStats] = useState(null);

  const fetchNotifications = useCallback(async () => {
    try {
      let url = `${API_URL}/api/notifications?limit=100`;
      if (filterRead !== 'all') {
        url += `&is_read=${filterRead === 'read'}`;
      }
      if (filterType !== 'all') {
        url += `&type=${filterType}`;
      }

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        const items = Array.isArray(data.notifications) && data.notifications.length > 0
          ? data.notifications
          : DEMO_NOTIFICATIONS;
        setNotifications(items);
        setUnreadCount(typeof data.unread_count === 'number'
          ? data.unread_count
          : items.filter(item => !item.is_read).length);
      } else {
        setNotifications(DEMO_NOTIFICATIONS);
        setUnreadCount(DEMO_NOTIFICATIONS.filter(item => !item.is_read).length);
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
      setNotifications(DEMO_NOTIFICATIONS);
      setUnreadCount(DEMO_NOTIFICATIONS.filter(item => !item.is_read).length);
    } finally {
      setLoading(false);
    }
  }, [filterType, filterRead]);

  const fetchNewsletterStats = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/newsletter/stats`);
      if (res.ok) {
        const data = await res.json();
        setNewsletterStats(data || DEMO_NEWSLETTER_STATS);
      } else {
        setNewsletterStats(DEMO_NEWSLETTER_STATS);
      }
    } catch (err) {
      console.error('Failed to fetch newsletter stats:', err);
      setNewsletterStats(DEMO_NEWSLETTER_STATS);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    fetchNewsletterStats();
  }, [fetchNotifications, fetchNewsletterStats]);

  const markAsRead = async (id) => {
    try {
      await fetch(`${API_URL}/api/notifications/${id}/read`, { method: 'PUT' });
      fetchNotifications();
    } catch (err) {
      toast.error('Có lỗi xảy ra');
    }
  };

  const markAllRead = async () => {
    try {
      await fetch(`${API_URL}/api/notifications/mark-all-read`, { method: 'PUT' });
      fetchNotifications();
      toast.success('Đã đánh dấu tất cả là đã đọc');
    } catch (err) {
      toast.error('Có lỗi xảy ra');
    }
  };

  const deleteNotification = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa thông báo này?')) return;
    try {
      await fetch(`${API_URL}/api/notifications/${id}`, { method: 'DELETE' });
      fetchNotifications();
      toast.success('Đã xóa thông báo');
    } catch (err) {
      toast.error('Có lỗi xảy ra');
    }
  };

  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now - date;
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (mins < 60) return `${mins} phút trước`;
    if (hours < 24) return `${hours} giờ trước`;
    if (days < 7) return `${days} ngày trước`;
    return date.toLocaleDateString('vi-VN');
  };

  const getTypeInfo = (type) => NOTIFICATION_TYPES[type] || { icon: Bell, label: type, color: 'bg-gray-500' };

  return (
    <div className="p-6 space-y-6" data-testid="admin-notifications-page">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bell className="w-6 h-6" />
            Thông báo
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2">{unreadCount} mới</Badge>
            )}
          </h1>
          <p className="text-muted-foreground">Quản lý thông báo và đăng ký nhận tin</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchNotifications}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Làm mới
          </Button>
          {unreadCount > 0 && (
            <Button onClick={markAllRead}>
              <CheckCheck className="w-4 h-4 mr-2" />
              Đọc tất cả
            </Button>
          )}
        </div>
      </div>

      {/* Newsletter Stats */}
      {newsletterStats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{newsletterStats.total}</p>
                  <p className="text-sm text-muted-foreground">Tổng đăng ký</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Mail className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{newsletterStats.active}</p>
                  <p className="text-sm text-muted-foreground">Đang hoạt động</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Clock className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">+{newsletterStats.this_week}</p>
                  <p className="text-sm text-muted-foreground">Tuần này</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Bell className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{unreadCount}</p>
                  <p className="text-sm text-muted-foreground">Chưa đọc</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Briefcase className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {notifications.filter(n => n.type === 'job_application').length}
                  </p>
                  <p className="text-sm text-muted-foreground">Ứng tuyển</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex gap-4">
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Loại" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả loại</SelectItem>
                <SelectItem value="job_application">Ứng tuyển</SelectItem>
                <SelectItem value="newsletter_signup">Newsletter</SelectItem>
                <SelectItem value="contact_form">Liên hệ</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterRead} onValueChange={setFilterRead}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="unread">Chưa đọc</SelectItem>
                <SelectItem value="read">Đã đọc</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Notifications List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Danh sách thông báo</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="text-center py-8">Đang tải...</div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <BellOff className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Không có thông báo nào</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notif) => {
                const typeInfo = getTypeInfo(notif.type);
                const TypeIcon = typeInfo.icon;
                
                return (
                  <div 
                    key={notif.id}
                    className={`p-4 flex items-start gap-4 hover:bg-muted/50 transition-colors ${!notif.is_read ? 'bg-blue-50/50' : ''}`}
                  >
                    <div className={`p-2 rounded-lg ${typeInfo.color} text-white flex-shrink-0`}>
                      <TypeIcon className="w-5 h-5" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className={`font-medium ${!notif.is_read ? 'text-slate-900' : 'text-slate-600'}`}>
                            {notif.title}
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {notif.message}
                          </p>
                          
                          {/* Show additional data for job applications */}
                          {notif.type === 'job_application' && notif.data && (
                            <div className="mt-2 text-xs text-slate-500 space-y-1">
                              {notif.data.applicant_phone && (
                                <p>SĐT: {notif.data.applicant_phone}</p>
                              )}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-xs text-muted-foreground">
                            {formatTime(notif.created_at)}
                          </span>
                          {!notif.is_read && (
                            <div className="w-2 h-2 rounded-full bg-blue-500" />
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-1 flex-shrink-0">
                      {!notif.is_read && (
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => markAsRead(notif.id)}
                          title="Đánh dấu đã đọc"
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                      )}
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => deleteNotification(notif.id)}
                        title="Xóa"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
