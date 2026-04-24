/**
 * MobileAuditPage.jsx — Ban Kiểm soát / HĐQT Dashboard (Mobile)
 * Route: /audit/overview (dispatched from /app for AUDIT role)
 * Quyền: Read-only toàn hệ thống · Báo cáo lên ĐHĐCĐ
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield, Eye, AlertTriangle, TrendingUp, Users, FileText,
  CheckCircle, XCircle, Clock, ChevronRight, RefreshCw,
  BarChart3, DollarSign, UserCheck, Lock
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const AUDIT_SECTIONS = [
  {
    id: 'finance',
    title: 'Tài chính & Hoa hồng',
    icon: DollarSign,
    path: '/audit/finance',
    color: '#16a34a',
    bg: 'bg-green-50',
    border: 'border-green-200',
    desc: 'Xem toàn bộ thu chi, hoa hồng, đối soát',
  },
  {
    id: 'hr',
    title: 'Nhân sự & Tuân thủ',
    icon: UserCheck,
    path: '/audit/hr',
    color: '#2563eb',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    desc: 'Hồ sơ nhân sự, hợp đồng lao động, vi phạm',
  },
  {
    id: 'deals',
    title: 'Giao dịch & Booking',
    icon: FileText,
    path: '/audit/reports',
    color: '#7c3aed',
    bg: 'bg-violet-50',
    border: 'border-violet-200',
    desc: 'Soft booking, hard booking, huỷ giao dịch',
  },
  {
    id: 'reports',
    title: 'Báo cáo Kiểm soát',
    icon: BarChart3,
    path: '/audit/reports',
    color: '#ea580c',
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    desc: 'Báo cáo audit nội bộ, cảnh báo bất thường',
  },
];

const MOCK_ALERTS = [
  { id: 1, type: 'warning', text: '3 giao dịch hoa hồng chưa được đối soát', time: '2h trước' },
  { id: 2, type: 'info',    text: 'Báo cáo tháng 4/2025 đã sẵn sàng xem xét', time: '5h trước' },
  { id: 3, type: 'ok',      text: 'Kiểm tra nhân sự tháng 4 — Không có vi phạm', time: '1 ngày trước' },
];

export default function MobileAuditPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1200);
  };

  return (
    <div className="h-screen bg-[#f1f5f9] flex flex-col overflow-hidden">

      {/* HEADER */}
      <div className="bg-gradient-to-br from-[#1e293b] via-[#334155] to-[#374151] px-4 pt-12 pb-6 flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-white/60 text-xs">Ban Kiểm soát</p>
              <h1 className="text-white font-bold text-lg leading-tight">Giám sát & Kiểm toán</h1>
            </div>
          </div>
          <button
            onClick={handleRefresh}
            className="w-9 h-9 bg-white/10 rounded-full flex items-center justify-center active:scale-95"
          >
            <RefreshCw className={`w-4 h-4 text-white ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Read-only badge */}
        <div className="flex items-center gap-2 bg-amber-400/20 border border-amber-400/30 rounded-xl px-3 py-2">
          <Lock className="w-3.5 h-3.5 text-amber-300 flex-shrink-0" />
          <p className="text-amber-200 text-xs font-medium">
            Chế độ xem — Không thể chỉnh sửa hay phê duyệt
          </p>
        </div>
      </div>

      {/* CONTENT */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 pb-28">

        {/* Thông tin tài khoản */}
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Vai trò</p>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-700 rounded-xl flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-bold text-slate-800 text-sm">{user?.full_name}</p>
              <p className="text-xs text-slate-500">{user?.position || 'Thành viên Ban Kiểm soát'}</p>
            </div>
            <div className="ml-auto">
              <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded-lg">AUDIT</span>
            </div>
          </div>
        </div>

        {/* Cảnh báo & Alerts */}
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">Cảnh báo gần đây</p>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="space-y-3">
            {MOCK_ALERTS.map(alert => (
              <div key={alert.id} className="flex items-start gap-3">
                <div className="mt-0.5 flex-shrink-0">
                  {alert.type === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-500" />}
                  {alert.type === 'info'    && <Clock className="w-4 h-4 text-blue-500" />}
                  {alert.type === 'ok'      && <CheckCircle className="w-4 h-4 text-green-500" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-700 leading-snug">{alert.text}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{alert.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Phân mục giám sát */}
        <div className="space-y-3">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">Phân mục giám sát</p>
          {AUDIT_SECTIONS.map(section => {
            const Icon = section.icon;
            return (
              <button
                key={section.id}
                onClick={() => navigate(section.path)}
                className={`w-full bg-white rounded-2xl p-4 border ${section.border} shadow-sm flex items-center gap-4 active:scale-[0.98] transition-all text-left`}
              >
                <div className={`w-11 h-11 ${section.bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                  <Icon className="w-5 h-5" style={{ color: section.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-800 text-sm">{section.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5 leading-snug">{section.desc}</p>
                </div>
                <div className="flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5 text-slate-400" />
                  <ChevronRight className="w-4 h-4 text-slate-300" />
                </div>
              </button>
            );
          })}
        </div>

        {/* Quyền hạn của role */}
        <div className="bg-slate-800 rounded-2xl p-4 border border-slate-700">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Quyền của Ban Kiểm soát</p>
          <div className="space-y-2">
            {[
              { icon: CheckCircle, text: 'Xem toàn bộ tài chính (read-only)', ok: true },
              { icon: CheckCircle, text: 'Xem hồ sơ nhân sự (read-only)', ok: true },
              { icon: CheckCircle, text: 'Xem mọi giao dịch, hoa hồng', ok: true },
              { icon: CheckCircle, text: 'Xuất báo cáo kiểm toán nội bộ', ok: true },
              { icon: XCircle,     text: 'Không phê duyệt giao dịch', ok: false },
              { icon: XCircle,     text: 'Không can thiệp vận hành', ok: false },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <div key={i} className="flex items-center gap-2.5">
                  <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${item.ok ? 'text-green-400' : 'text-red-400'}`} />
                  <span className="text-xs text-slate-400">{item.text}</span>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
