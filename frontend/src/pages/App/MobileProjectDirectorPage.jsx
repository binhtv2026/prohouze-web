/**
 * MobileProjectDirectorPage.jsx — Giám đốc Dự án Dashboard (Mobile)
 * Route: /app (for PROJECT_DIRECTOR role)
 * Scope: project_code-filtered — quản lý bán hàng tại 1 dự án cụ thể
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2, Users, CheckSquare, TrendingUp, BarChart3,
  Bell, ChevronRight, Star, AlertTriangle, Clock,
  Target, Shield, RefreshCw, Phone, Award, Zap, User,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const MOCK_STATS = [
  { label: 'Booking chờ duyệt', value: '5', sub: 'Cần xử lý hôm nay', color: '#dc2626', bg: 'bg-red-50', border: 'border-red-100' },
  { label: 'Đội Sales', value: '18', sub: 'Đang hoạt động', color: '#2563eb', bg: 'bg-blue-50', border: 'border-blue-100' },
  { label: 'Doanh số tháng', value: '12,4 tỷ', sub: 'Tại dự án', color: '#16a34a', bg: 'bg-green-50', border: 'border-green-100' },
  { label: 'Tỉ lệ chốt', value: '14%', sub: 'Lead → Booking', color: '#7c3aed', bg: 'bg-violet-50', border: 'border-violet-100' },
];

const QUICK_ACTIONS = [
  { icon: CheckSquare, label: 'Duyệt booking', path: '/sales/bookings?status=pending', color: '#dc2626', bg: 'bg-red-50',    badge: '5' },
  { icon: Users,       label: 'KPI đội sales', path: '/kpi/team',                      color: '#2563eb', bg: 'bg-blue-50',   badge: null },
  { icon: Building2,   label: 'Giỏ hàng DA',  path: '/sales/catalog',                  color: '#7c3aed', bg: 'bg-violet-50', badge: null },
  { icon: Award,       label: 'Xếp hạng',     path: '/kpi/leaderboard',                color: '#d97706', bg: 'bg-amber-50',  badge: null },
  { icon: TrendingUp,  label: 'Báo cáo DA',   path: '/analytics/reports',              color: '#16a34a', bg: 'bg-green-50',  badge: null },
  { icon: Phone,       label: 'Liên hệ CĐT',  path: '/crm/contacts',                   color: '#0891b2', bg: 'bg-cyan-50',   badge: null },
];

const PENDING_BOOKINGS = [
  { id: 1, unit: 'B1205', buyer: 'Nguyễn Văn An', sales: 'Trần Văn Minh', amount: '3,2 tỷ', time: '30 phút trước' },
  { id: 2, unit: 'A0803', buyer: 'Phạm Thị Lan',  sales: 'Lê Thị Hoa',   amount: '2,8 tỷ', time: '2h trước' },
  { id: 3, unit: 'C1104', buyer: 'Hoàng Minh Tuấn',sales: 'Nguyễn Văn Nam',amount: '4,1 tỷ', time: '3h trước' },
];

const TOP_SALES = [
  { rank: 1, name: 'Lê Thị Hoa',     value: '4,2 tỷ', deals: 3, emoji: '🥇' },
  { rank: 2, name: 'Trần Văn Minh',  value: '3,8 tỷ', deals: 2, emoji: '🥈' },
  { rank: 3, name: 'Nguyễn Văn Nam', value: '2,1 tỷ', deals: 2, emoji: '🥉' },
];

export default function MobileProjectDirectorPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [refreshing, setRefreshing] = useState(false);

  const firstName = user?.full_name?.split(' ').pop() || 'Giám đốc';
  const projectName = user?.project_name || 'Dự án đang quản lý';

  return (
    <div className="h-screen bg-[#f1f5f9] flex flex-col overflow-hidden">

      {/* HEADER */}
      <div className="bg-gradient-to-br from-[#3b0764] via-[#6d28d9] to-[#7c3aed] px-4 pt-12 pb-5 flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-white/60 text-xs">Giám đốc Dự án</p>
            <h1 className="text-white font-bold text-lg leading-tight">Xin chào, {firstName}!</h1>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Building2 className="w-3 h-3 text-violet-300" />
              <p className="text-violet-200 text-xs">{projectName}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="relative w-9 h-9 bg-white/10 rounded-full flex items-center justify-center">
              <Bell className="w-4 h-4 text-white" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-400 rounded-full" />
            </button>
            <button
              onClick={() => setRefreshing(r => !r)}
              className="w-9 h-9 bg-white/10 rounded-full flex items-center justify-center"
            >
              <RefreshCw className={`w-4 h-4 text-white ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-4 gap-2">
          {MOCK_STATS.map(s => (
            <div key={s.label} className="bg-white/10 rounded-xl p-2 text-center">
              <p className="text-white font-bold text-sm leading-none">{s.value}</p>
              <p className="text-white/60 text-[9px] leading-tight mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Tab selector */}
        <div className="flex bg-white/10 rounded-xl p-0.5 mt-4 gap-0.5">
          {[
            { id: 'overview', label: 'Tổng quan' },
            { id: 'bookings', label: 'Booking' },
            { id: 'team',     label: 'Đội Sales' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === tab.id
                  ? 'bg-white text-violet-700 shadow-sm'
                  : 'text-white/70'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* CONTENT */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 pb-28">

        {/* ── Overview Tab ── */}
        {activeTab === 'overview' && (
          <>
            {/* Alert: pending bookings */}
            <div className="bg-red-50 border border-red-200 rounded-2xl p-3.5 flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-bold text-red-700">5 booking chờ duyệt</p>
                <p className="text-xs text-red-500">Cần xem xét và duyệt trước cuối ngày</p>
              </div>
              <button
                onClick={() => navigate('/sales/bookings?status=pending')}
                className="bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg active:scale-95"
              >
                Duyệt
              </button>
            </div>

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
                      className="flex flex-col items-center gap-2 active:scale-95 transition-all relative"
                    >
                      <div className={`w-12 h-12 ${action.bg} rounded-2xl flex items-center justify-center`}>
                        <Icon className="w-5 h-5" style={{ color: action.color }} />
                      </div>
                      {action.badge && (
                        <span className="absolute top-0 right-3 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                          {action.badge}
                        </span>
                      )}
                      <span className="text-[10px] font-medium text-slate-600 text-center leading-tight">{action.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Top Sales Preview */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-slate-50">
                <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">Top Sales tuần này</p>
                <Award className="w-4 h-4 text-amber-400" />
              </div>
              {TOP_SALES.map(s => (
                <div key={s.rank} className="flex items-center gap-3 px-4 py-3 border-b border-slate-50 last:border-0">
                  <span className="text-lg">{s.emoji}</span>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-800">{s.name}</p>
                    <p className="text-xs text-slate-400">{s.deals} giao dịch</p>
                  </div>
                  <p className="text-sm font-bold text-violet-700">{s.value}</p>
                </div>
              ))}
              <button
                onClick={() => navigate('/kpi/leaderboard')}
                className="w-full py-3 text-center text-xs font-semibold text-violet-600 border-t border-slate-100"
              >
                Xem xếp hạng đầy đủ →
              </button>
            </div>
          </>
        )}

        {/* ── Bookings Tab ── */}
        {activeTab === 'bookings' && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-slate-100">
              <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">Booking chờ duyệt</p>
              <span className="text-xs bg-red-100 text-red-700 font-bold px-2 py-0.5 rounded-full">5 pending</span>
            </div>
            {PENDING_BOOKINGS.map(b => (
              <button
                key={b.id}
                onClick={() => navigate('/sales/bookings')}
                className="w-full flex items-start gap-3 px-4 py-3.5 text-left border-b border-slate-50 last:border-0 active:bg-slate-50"
              >
                <div className="w-10 h-10 bg-violet-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-5 h-5 text-violet-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-slate-800 text-sm">Căn {b.unit}</p>
                    <p className="text-xs font-bold text-violet-700">{b.amount}</p>
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5">{b.buyer}</p>
                  <p className="text-xs text-slate-400">Sales: {b.sales} · {b.time}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300 mt-1 flex-shrink-0" />
              </button>
            ))}
            <div className="flex gap-2 px-4 py-3 border-t border-slate-100">
              <button
                onClick={() => navigate('/sales/bookings')}
                className="flex-1 py-2.5 bg-violet-600 text-white text-sm font-bold rounded-xl active:scale-95"
              >
                Duyệt tất cả
              </button>
              <button
                onClick={() => navigate('/sales/bookings')}
                className="flex-1 py-2.5 bg-slate-100 text-slate-700 text-sm font-bold rounded-xl active:scale-95"
              >
                Xem chi tiết
              </button>
            </div>
          </div>
        )}

        {/* ── Team Tab ── */}
        {activeTab === 'team' && (
          <div className="space-y-3">
            <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
              <p className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-3">KPI đội tháng này</p>
              {[
                { name: 'Lê Thị Hoa', kpi: 95, deals: 3, status: 'on-track' },
                { name: 'Trần Văn Minh', kpi: 78, deals: 2, status: 'on-track' },
                { name: 'Nguyễn Văn Nam', kpi: 52, deals: 2, status: 'warning' },
                { name: 'Phạm Thu Hà', kpi: 30, deals: 1, status: 'danger' },
              ].map(member => (
                <div key={member.name} className="flex items-center gap-3 mb-3 last:mb-0">
                  <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-violet-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs font-semibold text-slate-800">{member.name}</p>
                      <span className={`text-[10px] font-bold ${
                        member.status === 'on-track' ? 'text-green-600' :
                        member.status === 'warning' ? 'text-amber-600' : 'text-red-600'
                      }`}>{member.kpi}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full">
                      <div
                        className={`h-1.5 rounded-full ${
                          member.status === 'on-track' ? 'bg-green-500' :
                          member.status === 'warning' ? 'bg-amber-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${member.kpi}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-xs text-slate-400 flex-shrink-0">{member.deals} deal</span>
                </div>
              ))}
            </div>
            <button
              onClick={() => navigate('/kpi/team')}
              className="w-full bg-violet-600 text-white py-3 rounded-2xl text-sm font-bold active:scale-95 transition-all"
            >
              Xem KPI đội đầy đủ →
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
