/**
 * MobileSalesSupportPage.jsx — Sales Admin + CSKH Dashboard (Mobile)
 * Route: dispatched from /app for SALES_SUPPORT role
 * Quyền: Hồ sơ booking, theo dõi hợp đồng, CSKH
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText, Users, Clock, CheckCircle, AlertCircle,
  ChevronRight, Phone, MessageCircle, Calendar,
  ClipboardCheck, RefreshCw, Upload, Bell, Inbox
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const PENDING_TASKS = [
  { id: 1, type: 'doc', title: 'Hồ sơ KH Nguyễn Văn A — thiếu CCCD', priority: 'high', time: '2h trước', project: 'VGP-HCM' },
  { id: 2, type: 'contract', title: 'Chuẩn bị HĐ đặt cọc — Phòng B1205', priority: 'medium', time: '4h trước', project: 'VGP-HCM' },
  { id: 3, type: 'followup', title: 'Nhắc thanh toán đợt 2 — KH Trần Thị B', priority: 'medium', time: 'Hôm nay', project: 'VGP-HCM' },
  { id: 4, type: 'cskh', title: 'KH hỏi tiến độ bàn giao B1101', priority: 'low', time: '1 ngày trước', project: 'VGP-HCM' },
];

const QUICK_ACTIONS = [
  { icon: FileText,       label: 'Hồ sơ đang xử lý', path: '/sales/bookings',     color: '#316585', bg: 'bg-[#316585]/10' },
  { icon: Users,          label: 'Danh sách KH',      path: '/crm/contacts',       color: '#2563eb', bg: 'bg-blue-50' },
  { icon: Calendar,       label: 'Lịch làm việc',     path: '/work/calendar',      color: '#7c3aed', bg: 'bg-violet-50' },
  { icon: ClipboardCheck, label: 'Checklist hồ sơ',   path: '/sales/bookings',     color: '#059669', bg: 'bg-green-50' },
  { icon: Upload,         label: 'Upload tài liệu',    path: '/sales/bookings',     color: '#d97706', bg: 'bg-amber-50' },
  { icon: Phone,          label: 'Nhắc khách thanh toán', path: '/crm/contacts',  color: '#dc2626', bg: 'bg-red-50' },
];

const STATS = [
  { label: 'Hồ sơ đang xử lý', value: '7',  color: '#f59e0b' },
  { label: 'Đã hoàn thành',     value: '23', color: '#16a34a' },
  { label: 'Khách cần CSKH',    value: '4',  color: '#7c3aed' },
  { label: 'Quá hạn',           value: '2',  color: '#dc2626' },
];

const priorityConfig = {
  high:   { label: 'Gấp',    bg: 'bg-red-100',    text: 'text-red-700' },
  medium: { label: 'Bình thường', bg: 'bg-amber-100', text: 'text-amber-700' },
  low:    { label: 'Thấp',   bg: 'bg-slate-100',  text: 'text-slate-600' },
};

const typeIcon = {
  doc:       { icon: FileText,       color: '#316585' },
  contract:  { icon: ClipboardCheck, color: '#059669' },
  followup:  { icon: Bell,           color: '#d97706' },
  cskh:      { icon: MessageCircle,  color: '#7c3aed' },
};

export default function MobileSalesSupportPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [refreshing, setRefreshing] = useState(false);

  const isSalesAdmin = user?.position?.toLowerCase().includes('admin') || user?.department === 'sales_ops';
  const roleLabel = isSalesAdmin ? 'Sales Admin' : 'Chăm sóc Khách hàng';
  const accent = isSalesAdmin ? '#316585' : '#7c3aed';

  return (
    <div className="h-screen bg-[#f1f5f9] flex flex-col overflow-hidden">

      {/* HEADER */}
      <div
        className="px-4 pt-12 pb-6 flex-shrink-0"
        style={{ background: `linear-gradient(135deg, #0c4a6e 0%, #0369a1 50%, #0891b2 100%)` }}
      >
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-white/60 text-xs">{roleLabel}</p>
            <h1 className="text-white font-bold text-xl">Xin chào, {user?.full_name?.split(' ').pop()}!</h1>
            <p className="text-white/70 text-xs mt-0.5">{user?.project_name || 'Dự án đang phụ trách'}</p>
          </div>
          <button onClick={() => setRefreshing(r => !r)} className="w-9 h-9 bg-white/10 rounded-full flex items-center justify-center">
            <RefreshCw className={`w-4 h-4 text-white ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-4 gap-2">
          {STATS.map(s => (
            <div key={s.label} className="bg-white/10 rounded-xl p-2 text-center">
              <p className="text-white font-bold text-lg leading-none">{s.value}</p>
              <p className="text-white/60 text-[9px] leading-tight mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CONTENT */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 pb-28">

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
          <p className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-3">Thao tác nhanh</p>
          <div className="grid grid-cols-3 gap-3">
            {QUICK_ACTIONS.map(action => {
              const Icon = action.icon;
              return (
                <button
                  key={action.label}
                  onClick={() => navigate(action.path)}
                  className="flex flex-col items-center gap-2 active:scale-95 transition-all"
                >
                  <div className={`w-12 h-12 ${action.bg} rounded-2xl flex items-center justify-center`}>
                    <Icon className="w-5 h-5" style={{ color: action.color }} />
                  </div>
                  <span className="text-[10px] font-medium text-slate-600 text-center leading-tight">{action.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Việc cần làm */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-slate-100">
            <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">Việc cần làm hôm nay</p>
            <Inbox className="w-4 h-4 text-slate-400" />
          </div>
          <div className="divide-y divide-slate-50">
            {PENDING_TASKS.map(task => {
              const { icon: TypeIcon, color } = typeIcon[task.type] || typeIcon.doc;
              const pConf = priorityConfig[task.priority];
              return (
                <button
                  key={task.id}
                  onClick={() => navigate('/sales/bookings')}
                  className="w-full flex items-start gap-3 px-4 py-3.5 text-left active:bg-slate-50 transition-colors"
                >
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ background: `${color}15` }}>
                    <TypeIcon className="w-4 h-4" style={{ color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-800 font-medium leading-snug">{task.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${pConf.bg} ${pConf.text}`}>
                        {pConf.label}
                      </span>
                      <span className="text-[10px] text-slate-400">{task.time}</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 mt-1 flex-shrink-0" />
                </button>
              );
            })}
          </div>
          <button
            onClick={() => navigate('/sales/bookings')}
            className="w-full py-3 text-center text-xs font-semibold text-cyan-600 border-t border-slate-100"
          >
            Xem tất cả hồ sơ →
          </button>
        </div>

        {/* Hướng dẫn role */}
        <div className="bg-cyan-50 rounded-2xl p-4 border border-cyan-200">
          <p className="text-xs font-bold text-cyan-700 uppercase tracking-wider mb-2">
            {isSalesAdmin ? 'Quy trình Sales Admin' : 'Quy trình CSKH'}
          </p>
          {isSalesAdmin ? (
            <div className="space-y-1.5">
              {['Sales chốt KH → nhận bàn giao hồ sơ', 'Kiểm tra CCCD, giấy tờ pháp lý', 'Chuẩn bị phiếu giữ chỗ / HĐ đặt cọc', 'Submit booking lên chủ đầu tư', 'Theo dõi tiến độ ký & thanh toán'].map((s, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="text-[10px] font-bold text-cyan-500 mt-0.5">{i + 1}.</span>
                  <p className="text-xs text-cyan-700">{s}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-1.5">
              {['KH ký HĐ → tiếp nhận từ Sales', 'Onboard KH: hướng dẫn app & thủ tục', 'Thông báo lịch thanh toán định kỳ', 'Giải quyết khiếu nại, sự cố', 'Nurture KH để giới thiệu thêm'].map((s, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="text-[10px] font-bold text-cyan-500 mt-0.5">{i + 1}.</span>
                  <p className="text-xs text-cyan-700">{s}</p>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
