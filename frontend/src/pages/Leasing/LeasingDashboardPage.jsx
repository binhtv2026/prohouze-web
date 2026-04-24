import { Link } from 'react-router-dom';
import { Home, KeyRound, Wrench, Wallet, AlertTriangle, ChevronRight, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const STATS = [
  { label: 'Tổng tài sản', value: '42', sub: '37 đang cho thuê · 5 trống', icon: '🏢', color: 'text-blue-700' },
  { label: 'Tỉ lệ lấp đầy', value: '88%', sub: '37 / 42 tài sản', icon: '📊', color: 'text-emerald-700' },
  { label: 'HĐ sắp hết hạn', value: '4', sub: 'Trong 30 ngày tới', icon: '⚠️', color: 'text-amber-700' },
  { label: 'Sự cố đang mở', value: '3', sub: 'Chưa xử lý xong', icon: '🔧', color: 'text-violet-700' },
  { label: 'Thu tháng này', value: '186 triệu', sub: '5 hóa đơn còn chờ', icon: '💰', color: 'text-emerald-700' },
  { label: 'Quá hạn thu', value: '22 triệu', sub: '2 khách chậm trả', icon: '🚨', color: 'text-rose-700' },
];

const ALERTS = [
  { title: '4 hợp đồng sắp hết hạn', desc: 'Liên hệ gia hạn hoặc tìm khách mới', path: '/leasing/contracts', color: 'bg-amber-50 border-amber-200 text-amber-800', icon: '📅' },
  { title: '1 sự cố ưu tiên cao đang mở', desc: 'Điều hòa căn 12A cần xử lý trong ngày', path: '/leasing/maintenance', color: 'bg-rose-50 border-rose-200 text-rose-800', icon: '🔧' },
  { title: '22 triệu tiền thuê quá hạn', desc: 'Nhà phố Trần Hưng Đạo — HĐ-24015', path: '/leasing/invoices', color: 'bg-red-50 border-red-200 text-red-800', icon: '💸' },
];

const QUICK_ACTIONS = [
  { label: 'Tài sản', icon: Home, path: '/leasing/assets', desc: 'Quản lý tài sản cho thuê', color: 'bg-blue-50 text-blue-600' },
  { label: 'Hợp đồng', icon: KeyRound, path: '/leasing/contracts', desc: 'Hợp đồng & gia hạn', color: 'bg-emerald-50 text-emerald-600' },
  { label: 'Bảo trì', icon: Wrench, path: '/leasing/maintenance', desc: 'Sự cố & phân công', color: 'bg-rose-50 text-rose-600' },
  { label: 'Thu tiền', icon: Wallet, path: '/leasing/invoices', desc: 'Hóa đơn & hạch toán', color: 'bg-amber-50 text-amber-600' },
];

export default function LeasingDashboardPage() {
  const today = new Intl.DateTimeFormat('vi-VN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date());

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900">🏠 Tổng quan Cho thuê & Vận hành</h1>
        <p className="text-sm text-slate-500 mt-0.5 capitalize">{today}</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {STATS.map(s => (
          <Card key={s.label} className="border shadow-none">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-slate-500 font-medium">{s.label}</p>
                  <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{s.sub}</p>
                </div>
                <span className="text-2xl">{s.icon}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Occupancy bar */}
      <Card className="border shadow-none">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <span className="text-sm font-semibold text-slate-700">Tỉ lệ lấp đầy</span>
            </div>
            <span className="text-sm font-bold text-emerald-700">88%</span>
          </div>
          <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all" style={{ width: '88%' }} />
          </div>
          <div className="flex justify-between text-xs text-slate-400 mt-1.5">
            <span>37 đang cho thuê</span>
            <span>5 đang trống</span>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="border shadow-none">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">⚡ Thao tác nhanh</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-3">
          {QUICK_ACTIONS.map(action => {
            const Icon = action.icon;
            return (
              <Link key={action.path} to={action.path} className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:border-[#1a7a4a]/30 hover:bg-slate-50 transition-colors">
                <div className={`w-9 h-9 rounded-xl ${action.color} flex items-center justify-center flex-shrink-0`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">{action.label}</p>
                  <p className="text-xs text-slate-500">{action.desc}</p>
                </div>
              </Link>
            );
          })}
        </CardContent>
      </Card>

      {/* Alerts */}
      <Card className="border shadow-none">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">🚨 Đang cần chú ý</CardTitle>
            <Badge className="bg-rose-100 text-rose-700 border border-rose-200">{ALERTS.length} vấn đề</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {ALERTS.map(alert => (
            <Link key={alert.path} to={alert.path} className={`flex items-start gap-3 p-3 rounded-xl border ${alert.color} transition-opacity hover:opacity-80`}>
              <span className="text-lg flex-shrink-0">{alert.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">{alert.title}</p>
                <p className="text-xs opacity-80 mt-0.5">{alert.desc}</p>
              </div>
              <ChevronRight className="w-4 h-4 flex-shrink-0 opacity-60" />
            </Link>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
