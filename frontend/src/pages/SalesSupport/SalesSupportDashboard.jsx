/**
 * SalesSupportDashboard — Hỗ trợ Nghiệp vụ / Sales Admin Web Dashboard
 * ProHouze Enterprise — 10/10 Locked
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  FileText, Users, Clock, CheckCircle2, AlertCircle,
  Phone, MessageCircle, Calendar, ClipboardCheck,
  Upload, Bell, BarChart3, ArrowUpRight, RefreshCw,
  Inbox, Shield,
} from 'lucide-react';

const PENDING_TASKS = [
  { id: 1, type: 'doc',      title: 'Hồ sơ KH Nguyễn Văn A — thiếu CCCD',     priority: 'high',   time: '2h trước',    project: 'The Privé' },
  { id: 2, type: 'contract', title: 'Chuẩn bị HĐ đặt cọc — Phòng B1205',       priority: 'medium', time: '4h trước',    project: 'Lumière' },
  { id: 3, type: 'followup', title: 'Nhắc thanh toán đợt 2 — KH Trần Thị B',   priority: 'medium', time: 'Hôm nay',     project: 'Sun Symphony' },
  { id: 4, type: 'cskh',    title: 'KH hỏi tiến độ bàn giao B1101',             priority: 'low',    time: '1 ngày trước', project: 'Nobu' },
  { id: 5, type: 'doc',      title: 'Bổ sung sổ hộ khẩu — KH Phạm Gia Bảo',   priority: 'high',   time: '30 phút',     project: 'The Privé' },
];

const STATS = [
  { label: 'Hồ sơ đang xử lý', value: 7,  icon: Clock,         color: 'bg-amber-50 border-amber-100 text-amber-700' },
  { label: 'Đã hoàn thành',     value: 23, icon: CheckCircle2,  color: 'bg-emerald-50 border-emerald-100 text-emerald-700' },
  { label: 'Khách cần CSKH',   value: 4,  icon: MessageCircle, color: 'bg-violet-50 border-violet-100 text-violet-700' },
  { label: 'Quá hạn',           value: 2,  icon: AlertCircle,   color: 'bg-red-50 border-red-100 text-red-700' },
];

const priorityConfig = {
  high:   { label: 'Gấp',        cls: 'bg-red-100 text-red-700' },
  medium: { label: 'Bình thường', cls: 'bg-amber-100 text-amber-700' },
  low:    { label: 'Thấp',        cls: 'bg-slate-100 text-slate-600' },
};

const QUICK_LINKS = [
  { icon: FileText,       label: 'Hồ sơ Booking',       path: '/sales/bookings',  color: 'bg-blue-50 border-blue-200 text-blue-700' },
  { icon: Users,          label: 'Danh sách Khách',      path: '/crm/contacts',    color: 'bg-violet-50 border-violet-200 text-violet-700' },
  { icon: ClipboardCheck, label: 'Checklist hồ sơ',      path: '/sales/bookings',  color: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
  { icon: Calendar,       label: 'Lịch hẹn',             path: '/work/calendar',   color: 'bg-amber-50 border-amber-200 text-amber-700' },
  { icon: Phone,          label: 'Nhắc thanh toán',      path: '/crm/contacts',    color: 'bg-red-50 border-red-200 text-red-700' },
  { icon: Upload,         label: 'Upload tài liệu',      path: '/sales/bookings',  color: 'bg-cyan-50 border-cyan-200 text-cyan-700' },
  { icon: MessageCircle,  label: 'CSKH',                 path: '/crm/contacts',    color: 'bg-pink-50 border-pink-200 text-pink-700' },
  { icon: Inbox,          label: 'Hộp thư nhắc việc',   path: '/work/tasks',      color: 'bg-indigo-50 border-indigo-200 text-indigo-700' },
];

export default function SalesSupportDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [filter, setFilter] = useState('all');

  const filtered = filter === 'all' ? PENDING_TASKS : PENDING_TASKS.filter(t => t.priority === filter);

  return (
    <div className="space-y-6 p-6" data-testid="sales-support-dashboard">

      {/* ── PREMIUM HEADER ── */}
      <div className="rounded-2xl bg-gradient-to-r from-[#0f4c75] to-[#1b6ca8] p-6 text-white">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-cyan-300 animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-widest text-white/70">
                HỖ TRỢ NGHIỆP VỤ · {user?.full_name || ''}
              </span>
            </div>
            <h1 className="text-2xl font-bold">Sales Admin & CSKH</h1>
            <p className="mt-1 text-white/60 text-sm">
              {new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <Button size="sm" variant="outline"
            className="border-white/30 bg-white/15 text-white hover:bg-white/25 self-start"
            onClick={() => navigate('/sales/bookings')}>
            <FileText className="h-4 w-4 mr-2" />Xem tất cả hồ sơ
          </Button>
        </div>

        {/* Tab nav strip */}
        <div className="mt-4 flex flex-wrap gap-2 border-t border-white/20 pt-4">
          {[
            { label: 'Hồ sơ Booking',  icon: FileText,       path: '/sales/bookings' },
            { label: 'Khách hàng',     icon: Users,          path: '/crm/contacts' },
            { label: 'Hợp đồng',       icon: ClipboardCheck, path: '/contracts/' },
            { label: 'Lịch hẹn',       icon: Calendar,       path: '/work/calendar' },
            { label: 'Công việc',       icon: CheckCircle2,   path: '/work/tasks' },
            { label: 'Nhắc việc',       icon: Bell,           path: '/work/tasks' },
            { label: 'Báo cáo',         icon: BarChart3,      path: '/analytics/reports' },
          ].map(t => {
            const Icon = t.icon;
            return (
              <button key={t.path + t.label} onClick={() => navigate(t.path)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-white/15 hover:bg-white/30 text-white transition-colors">
                <Icon className="h-3 w-3" />{t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── STATS ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {STATS.map(s => {
          const Icon = s.icon;
          return (
            <Card key={s.label} className={`border ${s.color}`}>
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">{s.label}</p>
                    <p className="text-3xl font-bold mt-1">{s.value}</p>
                  </div>
                  <Icon className="h-8 w-8 opacity-30" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* ── QUICK LINKS ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {QUICK_LINKS.map(item => {
          const Icon = item.icon;
          return (
            <button key={item.path + item.label} onClick={() => navigate(item.path)}
              className={`rounded-xl border p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-md ${item.color}`}>
              <Icon className="h-5 w-5 mb-2" />
              <p className="text-sm font-semibold">{item.label}</p>
            </button>
          );
        })}
      </div>

      {/* ── PENDING TASKS ── */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />Việc cần xử lý hôm nay
          </CardTitle>
          <div className="flex gap-2">
            {[['all','Tất cả'],['high','Gấp'],['medium','BT'],['low','Thấp']].map(([val, lbl]) => (
              <button key={val} onClick={() => setFilter(val)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors
                  ${filter === val ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                {lbl}
              </button>
            ))}
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {filtered.map(task => {
            const pCfg = priorityConfig[task.priority];
            return (
              <button key={task.id} onClick={() => navigate('/sales/bookings')}
                className="w-full text-left rounded-xl border border-slate-200 bg-slate-50 p-4 flex items-center justify-between hover:shadow-sm transition-all group">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className={pCfg.cls}>{pCfg.label}</Badge>
                    <span className="text-xs text-slate-400">{task.time}</span>
                    <span className="text-xs text-slate-400">· {task.project}</span>
                  </div>
                  <p className="text-sm font-semibold text-slate-800 truncate">{task.title}</p>
                </div>
                <ArrowUpRight className="h-4 w-4 text-slate-400 group-hover:text-blue-600 shrink-0 ml-3 transition-colors" />
              </button>
            );
          })}
          <Button variant="outline" className="w-full mt-2" onClick={() => navigate('/sales/bookings')}>
            Xem tất cả hồ sơ →
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
