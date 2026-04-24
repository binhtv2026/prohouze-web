/**
 * NotificationCenterPage.jsx — A5
 * Trung tâm thông báo: In-app notifications với badge, filter, mark-read
 */
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  AlertTriangle, Bell, Building2, Check, CheckCheck,
  FileText, Key, RefreshCw, Star, TrendingUp, Users, Zap,
} from 'lucide-react';

const NOTIF_TYPES = {
  contract:    { icon: FileText,   color: 'bg-blue-100 text-blue-600',   label: 'Hợp đồng' },
  deal:        { icon: TrendingUp, color: 'bg-violet-100 text-violet-600', label: 'Deal' },
  maintenance: { icon: Key,        color: 'bg-emerald-100 text-emerald-600', label: 'Bảo trì' },
  kpi:         { icon: Star,       color: 'bg-amber-100 text-amber-600', label: 'KPI' },
  system:      { icon: Bell,       color: 'bg-slate-100 text-slate-600', label: 'Hệ thống' },
  alert:       { icon: AlertTriangle, color: 'bg-red-100 text-red-600', label: 'Cảnh báo' },
  ranking:     { icon: Zap,        color: 'bg-orange-100 text-orange-600', label: 'Thi đua' },
};

const DEMO_NOTIFICATIONS = [
  { id: 1, type: 'alert', title: 'HĐ thuê sắp hết hạn', body: 'Hợp đồng căn 12.05 Vinhomes Central — còn 7 ngày', time: '5 phút trước', read: false, priority: 'high' },
  { id: 2, type: 'ranking', title: 'Bạn đã lên hạng #3!', body: 'Trần Thu Trang bị bạn vượt qua trong bảng xếp hạng tháng', time: '15 phút trước', read: false, priority: 'normal' },
  { id: 3, type: 'deal', title: 'Deal mới cần xử lý', body: 'Khách Nguyễn Minh Hào quan tâm dự án Masteri West Heights - 2PN', time: '1 giờ trước', read: false, priority: 'high' },
  { id: 4, type: 'contract', title: 'HĐ cần ký duyệt', body: 'Hợp đồng sơ cấp #HĐ-2026-0412 đang chờ ký', time: '2 giờ trước', read: false, priority: 'normal' },
  { id: 5, type: 'kpi', title: 'Chúc mừng! Đạt 100% KPI tuần', body: 'Bạn đã hoàn thành mục tiêu 3 deal trong tuần này 🎉', time: '3 giờ trước', read: true, priority: 'normal' },
  { id: 6, type: 'maintenance', title: 'Sự cố bảo trì được phân công', body: 'Thợ Nguyễn Văn Hùng sẽ đến sửa điều hòa căn 8.02 lúc 14:00', time: '4 giờ trước', read: true, priority: 'normal' },
  { id: 7, type: 'system', title: 'Cập nhật ứng dụng', body: 'ProHouze v2.1.0 — Thêm tính năng thi đua và lộ trình thăng tiến', time: 'Hôm qua', read: true, priority: 'low' },
  { id: 8, type: 'alert', title: 'Hóa đơn quá hạn', body: 'Khách thuê Lê Văn Bình chưa thanh toán tháng 4 — 3 ngày quá hạn', time: 'Hôm qua', read: true, priority: 'high' },
  { id: 9, type: 'deal', title: 'Deal thứ cấp bước sang Đàm phán', body: 'Căn 2PN Summer Riverside — bên bán chấp nhận mức giá 3.2 tỷ', time: '2 ngày trước', read: true, priority: 'normal' },
];

const FILTERS = ['Tất cả', 'Chưa đọc', 'HĐ', 'Deal', 'Cảnh báo', 'Thi đua'];

export default function NotificationCenterPage() {
  const [notifications, setNotifications] = useState(DEMO_NOTIFICATIONS);
  const [activeFilter, setActiveFilter] = useState('Tất cả');

  const unreadCount = notifications.filter(n => !n.read).length;

  const filtered = notifications.filter(n => {
    if (activeFilter === 'Tất cả') return true;
    if (activeFilter === 'Chưa đọc') return !n.read;
    if (activeFilter === 'HĐ') return n.type === 'contract';
    if (activeFilter === 'Deal') return n.type === 'deal';
    if (activeFilter === 'Cảnh báo') return n.type === 'alert';
    if (activeFilter === 'Thi đua') return n.type === 'ranking' || n.type === 'kpi';
    return true;
  });

  const markRead = (id) => setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  const markAllRead = () => setNotifications(prev => prev.map(n => ({ ...n, read: true })));

  return (
    <div className="space-y-5 max-w-2xl" data-testid="notification-center-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Bell className="w-5 h-5 text-[#316585]" /> Thông báo
            {unreadCount > 0 && (
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold">
                {unreadCount}
              </span>
            )}
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">{unreadCount} chưa đọc · {notifications.length} tổng cộng</p>
        </div>
        {unreadCount > 0 && (
          <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={markAllRead}>
            <CheckCheck className="w-3.5 h-3.5" /> Đọc tất cả
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto">
        {FILTERS.map(f => (
          <button key={f} onClick={() => setActiveFilter(f)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap border transition-all ${
              activeFilter === f ? 'bg-[#316585] text-white border-[#316585]' : 'bg-white border-slate-200 text-slate-600'
            }`}>
            {f === 'Chưa đọc' && unreadCount > 0 ? `${f} (${unreadCount})` : f}
          </button>
        ))}
      </div>

      {/* Notification list */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <Bell className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Không có thông báo nào</p>
          </div>
        ) : filtered.map(notif => {
          const typeInfo = NOTIF_TYPES[notif.type];
          const Icon = typeInfo.icon;
          return (
            <div
              key={notif.id}
              onClick={() => markRead(notif.id)}
              className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                !notif.read
                  ? 'border-[#316585]/20 bg-blue-50/30 hover:bg-blue-50/50'
                  : 'border-slate-100 bg-white hover:bg-slate-50'
              }`}
            >
              {/* Icon */}
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${typeInfo.color.split(' ').slice(1).join(' ')}`}>
                <Icon className={`w-5 h-5 ${typeInfo.color.split(' ')[0]}`} />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className={`text-sm font-semibold ${!notif.read ? 'text-slate-900' : 'text-slate-700'}`}>
                    {notif.title}
                  </p>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {notif.priority === 'high' && (
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                    )}
                    {!notif.read && (
                      <span className="w-2 h-2 rounded-full bg-[#316585]" />
                    )}
                  </div>
                </div>
                <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{notif.body}</p>
                <p className="text-[11px] text-slate-400 mt-1">{notif.time}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
