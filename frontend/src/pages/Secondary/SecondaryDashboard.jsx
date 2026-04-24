/**
 * SecondaryDashboard.jsx
 * Dashboard chính của môi giới thứ cấp
 * Tập trung vào: Tin đăng, Lead mua-bán lại, Deal pipeline, Định giá
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  ArrowUpRight, Building2, Clock, FileText, Flame,
  HandCoins, Home, PlusCircle, RefreshCw, Star,
  TrendingUp, Users, Wallet, BarChart3, CheckCircle2,
  AlertCircle, PhoneCall,
} from 'lucide-react';

// ─── DEMO DATA ────────────────────────────────────────────────────────────────
const STATS = [
  { label: 'Lead nóng', value: '6', sub: 'Chờ liên hệ', icon: Flame, color: 'text-rose-500', bg: 'bg-rose-50', border: 'border-rose-100' },
  { label: 'Tin đăng', value: '12', sub: 'Đang hiển thị', icon: Home, color: 'text-blue-500', bg: 'bg-blue-50', border: 'border-blue-100' },
  { label: 'Đang thương lượng', value: '3', sub: 'Cần chăm sóc', icon: RefreshCw, color: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-100' },
  { label: 'Hoa hồng dự kiến', value: '42 triệu', sub: 'Tháng này', icon: Wallet, color: 'text-emerald-500', bg: 'bg-emerald-50', border: 'border-emerald-100' },
];

const HOT_LEADS = [
  { id: 1, name: 'Anh Minh Tuấn', type: 'Mua', budget: '3.5–4 tỷ', area: 'Thủ Đức', status: 'Nóng', lastContact: '2 giờ trước', matched: 2 },
  { id: 2, name: 'Chị Thu Hà', type: 'Mua', budget: '5–6 tỷ', area: 'Quận 2', status: 'Nóng', lastContact: '1 ngày trước', matched: 4 },
  { id: 3, name: 'Anh Quốc Hùng', type: 'Bán', budget: '6.2 tỷ', area: 'Quận 9', status: 'Mới', lastContact: 'Hôm nay', matched: 0 },
  { id: 4, name: 'Chị Lan Anh', type: 'Mua', budget: '2–2.5 tỷ', area: 'Bình Thạnh', status: 'Ấm', lastContact: '3 ngày trước', matched: 3 },
];

const ACTIVE_LISTINGS = [
  { id: 1, title: '2PN Vinhomes Grand Park', address: 'S1.01, Tầng 18, VGP', price: '3.2 tỷ', area: '70m²', views: 147, leads: 3, status: 'active', daysOnMarket: 12 },
  { id: 2, title: '3PN Masteri Thảo Điền', address: 'T3A, Tầng 22', price: '7.8 tỷ', area: '115m²', views: 89, leads: 1, status: 'active', daysOnMarket: 7 },
  { id: 3, title: '1PN Celadon City', address: 'Ruby 5, Tầng 8', price: '2.1 tỷ', area: '50m²', views: 231, leads: 5, status: 'boosted', daysOnMarket: 21 },
  { id: 4, title: '2PN Akari City', address: 'A3, Tầng 12', price: '3.8 tỷ', area: '75m²', views: 62, leads: 1, status: 'active', daysOnMarket: 5 },
];

const DEALS = [
  { id: 1, property: '2PN Vinhomes Grand Park', buyer: 'Anh Minh Tuấn', price: '3.2 tỷ', stage: 'Đang thương lượng', commission: '38.4 triệu', progress: 60 },
  { id: 2, property: '3PN Masteri Thảo Điền', buyer: 'Chị Thu Hà', price: '7.8 tỷ', stage: 'Chờ công chứng', commission: '93.6 triệu', progress: 85 },
  { id: 3, property: '1PN Celadon City', buyer: 'Anh Phi Long', price: '2.1 tỷ', stage: 'Khảo sát căn', commission: '31.5 triệu', progress: 30 },
];

const STAGE_COLOR = {
  'Khảo sát căn': 'bg-blue-100 text-blue-700',
  'Đang thương lượng': 'bg-amber-100 text-amber-700',
  'Chờ công chứng': 'bg-violet-100 text-violet-700',
  'Sang nhượng xong': 'bg-emerald-100 text-emerald-700',
};

// ─── COMPONENTS ───────────────────────────────────────────────────────────────
function StatCard({ stat }) {
  const Icon = stat.icon;
  return (
    <Card className={`border ${stat.border}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className={`w-9 h-9 rounded-xl ${stat.bg} flex items-center justify-center`}>
            <Icon className={`w-4 h-4 ${stat.color}`} />
          </div>
          <TrendingUp className="w-3.5 h-3.5 text-slate-300" />
        </div>
        <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
        <div className="text-xs font-medium text-slate-700 mt-0.5">{stat.label}</div>
        <div className="text-xs text-slate-400 mt-0.5">{stat.sub}</div>
      </CardContent>
    </Card>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function SecondaryDashboard() {
  const today = new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'numeric' });

  return (
    <div className="space-y-5 p-1" data-testid="secondary-dashboard">

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Dashboard Thứ cấp</h1>
          <p className="text-sm text-slate-500">{today} — Môi giới mua bán lại & sang nhượng</p>
        </div>
        <div className="flex gap-2">
          <Link to="/secondary/listings/new">
            <Button size="sm" className="bg-[#316585] hover:bg-[#264f68] gap-1.5">
              <PlusCircle className="w-4 h-4" /> Đăng tin mới
            </Button>
          </Link>
          <Link to="/secondary/leads/new">
            <Button size="sm" variant="outline" className="gap-1.5">
              <Users className="w-4 h-4" /> Thêm khách
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {STATS.map(s => <StatCard key={s.label} stat={s} />)}
      </div>

      {/* Việc cần làm ngay */}
      <Card className="border-rose-200 bg-rose-50/40">
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm font-semibold text-rose-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" /> Việc cần làm ngay hôm nay
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="space-y-2">
            {[
              { text: 'Gọi lại 6 lead nóng chưa liên hệ — ưu tiên Anh Tuấn và Chị Thu Hà', path: '/secondary/leads?status=hot', urgent: true },
              { text: 'Cập nhật giá 2 tin đang hiển thị — thị trường Thủ Đức đang điều chỉnh', path: '/secondary/listings', urgent: false },
              { text: 'Thúc tiến độ công chứng HĐ Masteri Thảo Điền — khách đang chờ', path: '/secondary/deals', urgent: true },
            ].map((item, i) => (
              <Link key={i} to={item.path} className="flex items-start gap-2.5 group">
                <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${item.urgent ? 'bg-rose-500' : 'bg-amber-400'}`} />
                <p className="text-sm text-slate-700 group-hover:text-[#316585] transition-colors">{item.text}</p>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Main grid: Lead nóng + Tin đăng */}
      <div className="grid lg:grid-cols-2 gap-4">

        {/* Lead nóng */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <Flame className="w-4 h-4 text-rose-500" /> Lead nóng
              </CardTitle>
              <Link to="/secondary/leads">
                <Button size="sm" variant="ghost" className="text-xs gap-1 h-7">
                  Tất cả <ArrowUpRight className="w-3 h-3" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {HOT_LEADS.map(lead => (
              <div key={lead.id} className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 hover:border-[#316585]/30 hover:bg-slate-50 transition-all group">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm text-slate-900">{lead.name}</span>
                    <Badge className={`text-[10px] px-1.5 py-0 ${lead.status === 'Nóng' ? 'bg-rose-100 text-rose-700' : lead.status === 'Ấm' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                      {lead.type} · {lead.status}
                    </Badge>
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">{lead.budget} · {lead.area} · {lead.lastContact}</div>
                  {lead.matched > 0 && (
                    <div className="text-xs text-emerald-600 mt-0.5">✓ {lead.matched} căn phù hợp</div>
                  )}
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0" title="Gọi ngay">
                    <PhoneCall className="w-3.5 h-3.5 text-[#316585]" />
                  </Button>
                  <Link to={`/secondary/leads/${lead.id}`}>
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0">
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Tin đăng đang chạy */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <Home className="w-4 h-4 text-blue-500" /> Tin đang hiển thị
              </CardTitle>
              <Link to="/secondary/listings">
                <Button size="sm" variant="ghost" className="text-xs gap-1 h-7">
                  Quản lý <ArrowUpRight className="w-3 h-3" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {ACTIVE_LISTINGS.map(listing => (
              <div key={listing.id} className="p-2.5 rounded-xl border border-slate-100 hover:border-[#316585]/30 hover:bg-slate-50 transition-all">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-slate-900 truncate">{listing.title}</p>
                    <p className="text-xs text-slate-400 truncate">{listing.address}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="font-bold text-sm text-[#316585]">{listing.price}</div>
                    <div className="text-xs text-slate-400">{listing.area}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                  <span className="flex items-center gap-1"><BarChart3 className="w-3 h-3" /> {listing.views} lượt xem</span>
                  <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {listing.leads} khách hỏi</span>
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {listing.daysOnMarket} ngày</span>
                  {listing.status === 'boosted' && <Badge className="bg-amber-100 text-amber-700 text-[10px] px-1.5 py-0">Boost</Badge>}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Deal Pipeline */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <RefreshCw className="w-4 h-4 text-violet-500" /> Deal đang xử lý
            </CardTitle>
            <Link to="/secondary/deals">
              <Button size="sm" variant="ghost" className="text-xs gap-1 h-7">
                Tất cả deals <ArrowUpRight className="w-3 h-3" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {DEALS.map(deal => (
              <div key={deal.id} className="p-3 rounded-xl border border-slate-100 hover:border-violet-200 hover:bg-violet-50/30 transition-all">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <p className="font-medium text-sm text-slate-900">{deal.property}</p>
                    <p className="text-xs text-slate-400">{deal.buyer} · {deal.price}</p>
                  </div>
                  <div className="text-right">
                    <Badge className={`text-xs ${STAGE_COLOR[deal.stage]}`}>{deal.stage}</Badge>
                    <p className="text-xs text-emerald-600 font-medium mt-1">{deal.commission}</p>
                  </div>
                </div>
                {/* Progress bar */}
                <div className="w-full bg-slate-100 rounded-full h-1.5">
                  <div
                    className="bg-gradient-to-r from-[#316585] to-violet-500 h-1.5 rounded-full transition-all"
                    style={{ width: `${deal.progress}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                  <span>0%</span>
                  <span>{deal.progress}% hoàn thành</span>
                  <span>100%</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick links */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Định giá căn', icon: BarChart3, path: '/secondary/valuation', color: 'text-violet-500', bg: 'bg-violet-50' },
          { label: 'Đăng tin mới', icon: PlusCircle, path: '/secondary/listings/new', color: 'text-blue-500', bg: 'bg-blue-50' },
          { label: 'Sang nhượng', icon: FileText, path: '/secondary/transfer', color: 'text-amber-500', bg: 'bg-amber-50' },
          { label: 'Hoa hồng', icon: HandCoins, path: '/secondary/commission', color: 'text-emerald-500', bg: 'bg-emerald-50' },
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
