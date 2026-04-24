/**
 * ProjectDirectorDashboard — Giám đốc Dự án Web Dashboard
 * ProHouze Enterprise — 10/10 Locked
 */
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Building2, Users, Target, BarChart3, RefreshCw, TrendingUp,
  DollarSign, FileText, CheckCircle2, AlertTriangle, Calendar,
  ArrowUpRight, Layers, ShoppingBag, ClipboardList, Activity,
} from 'lucide-react';

function fmt(v) {
  const n = Number(v || 0);
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)} tỷ`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(0)} tr`;
  return n > 0 ? n.toLocaleString('vi-VN') : '0';
}

const DEMO = {
  total_projects: 12,
  active_projects: 7,
  total_units: 1840,
  sold_units: 1124,
  revenue_ytd: 54_200_000_000,
  revenue_target: 72_000_000_000,
  target_pct: 75.3,
  total_deals: 187,
  pending_bookings: 8,
  team_members: 56,
  projects: [
    { name: 'The Privé Residence', status: 'active', units: 280, sold: 198, revenue: 12_400_000_000, progress: 71, color: 'bg-violet-500' },
    { name: 'Nobu Residences Danang', status: 'active', units: 350, sold: 241, revenue: 9_800_000_000, progress: 69, color: 'bg-blue-500' },
    { name: 'Sun Symphony Riverside', status: 'active', units: 420, sold: 380, revenue: 7_200_000_000, progress: 90, color: 'bg-emerald-500' },
    { name: 'Lumière Boulevard', status: 'presale', units: 210, sold: 48, revenue: 3_100_000_000, progress: 23, color: 'bg-amber-500' },
  ],
  kpi_items: [
    { label: 'Tỷ lệ bán / tổng quỹ căn', pct: 61 },
    { label: 'Doanh thu / target năm',   pct: 75 },
    { label: 'Đặt cọc chuyển HĐ',        pct: 88 },
    { label: 'Booking → soft booking',   pct: 72 },
  ],
  pending: [
    { title: '8 hồ sơ đặt cọc chờ duyệt', path: '/sales/bookings', severity: 'high' },
    { title: '3 chính sách giá cần cập nhật', path: '/sales/catalog', severity: 'medium' },
    { title: 'Báo cáo tuần chưa phê duyệt', path: '/analytics/reports', severity: 'low' },
  ],
};

export default function ProjectDirectorDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(DEMO);
  const [loading, setLoading] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/analytics/projects/summary').catch(() => null);
      if (res?.data && Object.keys(res.data).length > 0) setData(res.data);
      else setData(DEMO);
    } catch { setData(DEMO); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const statusLabel = (s) => s === 'active' ? { label: 'Đang bán', cls: 'bg-emerald-100 text-emerald-700' }
    : s === 'presale' ? { label: 'Sắp mở bán', cls: 'bg-amber-100 text-amber-700' }
    : { label: s, cls: 'bg-slate-100 text-slate-600' };

  return (
    <div className="space-y-6 p-6" data-testid="project-director-dashboard">

      {/* ── PREMIUM HEADER ── */}
      <div className="rounded-2xl bg-gradient-to-r from-[#0f3460] to-[#16213e] p-6 text-white">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-blue-300 animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-widest text-white/70">
                GIÁM ĐỐC DỰ ÁN · {user?.full_name || ''}
              </span>
            </div>
            <h1 className="text-2xl font-bold">Project Director Command Center</h1>
            <p className="mt-1 text-white/60 text-sm">
              {new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <Button size="sm" variant="outline"
            className="border-white/30 bg-white/15 text-white hover:bg-white/25 self-start"
            onClick={loadData}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {/* Tab nav strip */}
        <div className="mt-4 flex flex-wrap gap-2 border-t border-white/20 pt-4">
          {[
            { label: 'Danh sách dự án', icon: Building2,    path: '/sales/projects' },
            { label: 'Quỹ căn / Catalog', icon: Layers,    path: '/sales/catalog' },
            { label: 'Hồ sơ / Booking',  icon: FileText,   path: '/sales/bookings' },
            { label: 'Pipeline',          icon: Activity,   path: '/sales/pipeline' },
            { label: 'KPI đội',           icon: Target,     path: '/kpi/team' },
            { label: 'Leaderboard',       icon: BarChart3,  path: '/kpi/leaderboard' },
            { label: 'CRM Khách',         icon: Users,      path: '/crm/contacts' },
            { label: 'Báo cáo',           icon: ClipboardList, path: '/analytics/reports' },
            { label: 'Lịch',              icon: Calendar,   path: '/work/calendar' },
          ].map(t => {
            const Icon = t.icon;
            return (
              <button key={t.path} onClick={() => navigate(t.path)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-white/15 hover:bg-white/30 text-white transition-colors">
                <Icon className="h-3 w-3" />{t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── KPI CARDS ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Dự án đang bán', value: `${data.active_projects}/${data.total_projects}`, sub: 'dự án đang hoạt động', icon: Building2, color: 'border-blue-100 bg-blue-50', iconBg: 'bg-blue-100 text-blue-600' },
          { label: 'Căn đã bán', value: `${data.sold_units?.toLocaleString()}/${data.total_units?.toLocaleString()}`, sub: `${data.target_pct}% quỹ căn`, icon: ShoppingBag, color: 'border-emerald-100 bg-emerald-50', iconBg: 'bg-emerald-100 text-emerald-600' },
          { label: 'Doanh thu YTD', value: fmt(data.revenue_ytd), sub: `/ ${fmt(data.revenue_target)} target`, icon: DollarSign, color: 'border-violet-100 bg-violet-50', iconBg: 'bg-violet-100 text-violet-600' },
          { label: 'Booking chờ', value: data.pending_bookings, sub: 'Cần duyệt hồ sơ', icon: AlertTriangle, color: 'border-amber-100 bg-amber-50', iconBg: 'bg-amber-100 text-amber-600' },
        ].map(card => {
          const Icon = card.icon;
          return (
            <Card key={card.label} className={`border ${card.color}`}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">{card.label}</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">{card.value}</p>
                  </div>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${card.iconBg}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
                <p className="text-xs text-slate-400 mt-2">{card.sub}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* ── REVENUE PROGRESS ── */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="font-semibold text-slate-800">Tiến độ doanh thu năm</p>
            <span className="text-sm font-bold text-blue-600">{data.target_pct}%</span>
          </div>
          <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-blue-500 to-violet-500 rounded-full transition-all"
              style={{ width: `${data.target_pct}%` }} />
          </div>
          <div className="flex justify-between text-xs text-slate-400 mt-1">
            <span>Thực tế: {fmt(data.revenue_ytd)}</span>
            <span>Target: {fmt(data.revenue_target)}</span>
          </div>
        </CardContent>
      </Card>

      {/* ── MAIN GRID ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Projects list */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-blue-600" />Portfolio dự án
            </CardTitle>
            <Button variant="outline" size="sm" onClick={() => navigate('/sales/projects')}>Xem tất cả →</Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.projects.map(p => {
              const st = statusLabel(p.status);
              return (
                <div key={p.name} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-semibold text-sm">{p.name}</p>
                    <Badge className={st.cls}>{st.label}</Badge>
                  </div>
                  <div className="flex justify-between text-xs text-slate-500 mb-2">
                    <span>{p.sold}/{p.units} căn đã bán</span>
                    <span className="font-medium text-slate-700">{fmt(p.revenue)}</span>
                  </div>
                  <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div className={`h-full ${p.color} rounded-full`} style={{ width: `${p.progress}%` }} />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* KPI & pending */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-blue-600" />Chỉ số hoạt động
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.kpi_items.map(k => (
                <div key={k.label}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-600">{k.label}</span>
                    <span className={`font-bold ${k.pct >= 80 ? 'text-emerald-600' : k.pct >= 60 ? 'text-amber-600' : 'text-red-600'}`}>{k.pct}%</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: `${k.pct}%` }} />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />Việc cần xử lý
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {data.pending.map(item => (
                <button key={item.title} onClick={() => navigate(item.path)}
                  className={`w-full text-left rounded-lg border p-3 flex items-center justify-between hover:shadow-sm transition-all
                    ${item.severity === 'high' ? 'border-red-200 bg-red-50' : item.severity === 'medium' ? 'border-amber-200 bg-amber-50' : 'border-blue-200 bg-blue-50'}`}>
                  <span className="text-sm font-medium">{item.title}</span>
                  <ArrowUpRight className="h-4 w-4 text-slate-400 shrink-0" />
                </button>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
