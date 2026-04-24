/**
 * LeasingDashboard.jsx
 * Dashboard vận hành cho thuê — port từ ProLeazing
 * Dữ liệu demo, sẵn kết nối Supabase sau
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  AlertTriangle, ArrowUpRight, BarChart3, Building2,
  CheckCircle2, Clock, FileText, Home, PlusCircle,
  TrendingUp, Users, Wallet, Wrench, Zap,
} from 'lucide-react';

const STATS = [
  { label: 'Tổng tài sản', value: '24', sub: '18 đang thuê · 6 trống', icon: Building2, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
  { label: 'Tỉ lệ lấp đầy', value: '75%', sub: '18 / 24 tài sản', icon: BarChart3, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
  { label: 'HĐ sắp hết hạn', value: '3', sub: 'Trong 30 ngày tới', icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
  { label: 'Yêu cầu bảo trì', value: '5', sub: 'Đang mở / chưa xử lý', icon: Wrench, color: 'text-violet-600', bg: 'bg-violet-50', border: 'border-violet-100' },
  { label: 'Chờ trả chủ nhà', value: '48 triệu', sub: 'Trước ngày 10/05', icon: Wallet, color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-100' },
  { label: 'Thu tiền thuê', value: '312 triệu', sub: 'Tháng này · 85% đã thu', icon: TrendingUp, color: 'text-teal-600', bg: 'bg-teal-50', border: 'border-teal-100' },
];

const EXPIRING_CONTRACTS = [
  { id: 1, code: 'HD-2024-018', asset: 'Căn 2PN - Masteri Q2-T18-08', tenant: 'Anh Hoàng Nam', rent: '22.000.000', daysLeft: 8, phone: '0901234567' },
  { id: 2, code: 'HD-2024-022', asset: 'Shophouse - Vinhomes GP SH-04', tenant: 'Cty TNHH Đại Phúc', rent: '45.000.000', daysLeft: 15, phone: '0282345678' },
  { id: 3, code: 'HD-2024-031', asset: 'Officetel - The Sun Av O-208', tenant: 'Startup ABC', rent: '12.000.000', daysLeft: 28, phone: '0912345678' },
];

const URGENT_MAINTENANCE = [
  { id: 1, title: 'Điều hòa không lạnh', asset: 'Căn 2PN Masteri Q2 T18-08', type: '❄️ Điện lạnh', priority: 'urgent', tenant: 'Anh Hoàng Nam', date: 'Hôm nay 09:30' },
  { id: 2, title: 'Vòi nước bị rò rỉ', asset: 'Shophouse GP SH-04', type: '🚿 Nước', priority: 'normal', tenant: 'Cty Đại Phúc', date: 'Hôm qua 14:00' },
  { id: 3, title: 'Khóa cửa bị kẹt', asset: 'Officetel The Sun O-208', type: '🔐 Cửa/Khóa', priority: 'urgent', tenant: 'Startup ABC', date: 'Hôm qua 16:45' },
];

const PENDING_PAYMENTS = [
  { tenant: 'Nguyễn Thị Mai', asset: 'Căn 1PN VGP S1-12-05', amount: '14.500.000', dueDate: '01/05', status: 'overdue' },
  { tenant: 'Trần Văn Hùng', asset: 'Căn 3PN Lumiere T5-18', amount: '38.000.000', dueDate: '05/05', status: 'due' },
  { tenant: 'Phạm Thu Lan', asset: 'Shophouse Akari SH-03', amount: '25.000.000', dueDate: '10/05', status: 'upcoming' },
];

export default function LeasingDashboard() {
  const today = new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'numeric' });

  return (
    <div className="space-y-5" data-testid="leasing-dashboard">

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">🏠 Quản lý cho thuê</h1>
          <p className="text-sm text-slate-500">{today} — Vận hành & quản lý tài sản cho thuê</p>
        </div>
        <div className="flex gap-2">
          <Link to="/leasing/contracts/new">
            <Button size="sm" className="bg-[#316585] hover:bg-[#264f68] gap-1.5">
              <PlusCircle className="w-4 h-4" /> Tạo hợp đồng
            </Button>
          </Link>
          <Link to="/leasing/maintenance/new">
            <Button size="sm" variant="outline" className="gap-1.5">
              <Wrench className="w-4 h-4" /> Ghi sự cố
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {STATS.map(s => {
          const Icon = s.icon;
          return (
            <Card key={s.label} className={`border ${s.border}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center`}>
                    <Icon className={`w-4 h-4 ${s.color}`} />
                  </div>
                </div>
                <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
                <div className="text-xs font-medium text-slate-700 mt-0.5">{s.label}</div>
                <div className="text-xs text-slate-400 mt-0.5">{s.sub}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Việc cần làm ngay */}
      <Card className="border-rose-200 bg-rose-50/40">
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm font-semibold text-rose-700 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" /> Ưu tiên hôm nay
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 space-y-2">
          {[
            { text: 'Liên hệ 3 khách có HĐ sắp hết hạn — xác nhận gia hạn hoặc chấm dứt', path: '/leasing/contracts?filter=expiring_soon', urgent: true },
            { text: 'Xử lý 2 sự cố khẩn cấp: điều hòa và khóa cửa', path: '/leasing/maintenance', urgent: true },
            { text: 'Thu tiền thuê tháng 5 — 3 khách còn chưa thanh toán', path: '/leasing/payments', urgent: false },
          ].map((item, i) => (
            <Link key={i} to={item.path} className="flex items-start gap-2.5 group">
              <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${item.urgent ? 'bg-rose-500' : 'bg-amber-400'}`} />
              <p className="text-sm text-slate-700 group-hover:text-[#316585] transition-colors">{item.text}</p>
            </Link>
          ))}
        </CardContent>
      </Card>

      {/* Main grid */}
      <div className="grid lg:grid-cols-2 gap-4">

        {/* HĐ sắp hết hạn */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <Clock className="w-4 h-4 text-amber-500" /> HĐ sắp hết hạn
              </CardTitle>
              <Link to="/leasing/contracts?filter=expiring_soon">
                <Button size="sm" variant="ghost" className="text-xs h-7 gap-1">Tất cả <ArrowUpRight className="w-3 h-3" /></Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {EXPIRING_CONTRACTS.map(c => (
              <div key={c.id} className="p-2.5 rounded-xl border border-slate-100 hover:border-amber-200 hover:bg-amber-50/40 transition-all">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-sm text-slate-900">{c.asset}</p>
                    <p className="text-xs text-slate-400">{c.tenant}</p>
                  </div>
                  <Badge className={`text-xs flex-shrink-0 ${c.daysLeft <= 10 ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                    Còn {c.daysLeft} ngày
                  </Badge>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-slate-500">{c.rent}đ/tháng</span>
                  <div className="flex gap-1.5">
                    <Link to={`/leasing/contracts/${c.id}`}>
                      <Button size="sm" variant="outline" className="h-6 text-xs px-2">Gia hạn</Button>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Bảo trì khẩn */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <Wrench className="w-4 h-4 text-violet-500" /> Sự cố cần xử lý
              </CardTitle>
              <Link to="/leasing/maintenance">
                <Button size="sm" variant="ghost" className="text-xs h-7 gap-1">Tất cả <ArrowUpRight className="w-3 h-3" /></Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {URGENT_MAINTENANCE.map(m => (
              <div key={m.id} className={`p-2.5 rounded-xl border transition-all ${m.priority === 'urgent' ? 'border-rose-200 bg-rose-50/30' : 'border-slate-100 hover:bg-slate-50'}`}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm text-slate-900">{m.title}</p>
                      {m.priority === 'urgent' && <Badge className="bg-rose-100 text-rose-700 text-[10px] px-1.5 py-0">🚨 Khẩn</Badge>}
                    </div>
                    <p className="text-xs text-slate-400">{m.asset} · {m.tenant}</p>
                    <p className="text-xs text-slate-300 mt-0.5">{m.type} · {m.date}</p>
                  </div>
                  <Link to={`/leasing/maintenance/${m.id}`}>
                    <Button size="sm" variant="outline" className="h-6 text-xs px-2">Xử lý</Button>
                  </Link>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Tiền thuê chưa thu */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Wallet className="w-4 h-4 text-teal-500" /> Tiền thuê chưa thu
            </CardTitle>
            <Link to="/leasing/payments">
              <Button size="sm" variant="ghost" className="text-xs h-7 gap-1">Quản lý thanh toán <ArrowUpRight className="w-3 h-3" /></Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {PENDING_PAYMENTS.map((p, i) => (
              <div key={i} className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors">
                <div>
                  <p className="font-medium text-sm text-slate-900">{p.tenant}</p>
                  <p className="text-xs text-slate-400">{p.asset}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-sm text-slate-900">{p.amount}đ</p>
                  <Badge className={`text-[10px] ${p.status === 'overdue' ? 'bg-rose-100 text-rose-700' : p.status === 'due' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                    {p.status === 'overdue' ? '⚠️ Quá hạn' : p.status === 'due' ? `Hạn ${p.dueDate}` : `Hạn ${p.dueDate}`}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick nav */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Hợp đồng', icon: FileText, path: '/leasing/contracts', color: 'text-blue-500', bg: 'bg-blue-50' },
          { label: 'Người thuê', icon: Users, path: '/leasing/tenants', color: 'text-violet-500', bg: 'bg-violet-50' },
          { label: 'Bảo trì', icon: Wrench, path: '/leasing/maintenance', color: 'text-amber-500', bg: 'bg-amber-50' },
          { label: 'Tài sản', icon: Building2, path: '/leasing/assets', color: 'text-teal-500', bg: 'bg-teal-50' },
        ].map(item => {
          const Icon = item.icon;
          return (
            <Link key={item.label} to={item.path}>
              <Card className="cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all border-slate-200">
                <CardContent className="flex flex-col items-center py-4 px-2 gap-2">
                  <div className={`w-10 h-10 rounded-xl ${item.bg} flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 ${item.color}`} />
                  </div>
                  <span className="text-xs font-medium text-slate-700 text-center">{item.label}</span>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
