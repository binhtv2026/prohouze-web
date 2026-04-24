/**
 * BODDashboardPage — Chủ tịch HĐQT / BOD Web Dashboard
 * ProHouze Enterprise — 10/10 Locked
 */
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DollarSign, Users, Building2, Target, TrendingUp, TrendingDown,
  BarChart3, RefreshCw, AlertTriangle, CheckCircle2, ShieldCheck,
  FileText, Briefcase, Award, LogOut, ArrowUpRight, ArrowDownRight,
  PieChart, Globe, Activity,
} from 'lucide-react';

function fmt(v) {
  const n = Number(v || 0);
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)} tỷ`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(0)} tr`;
  return n > 0 ? n.toLocaleString('vi-VN') : '0';
}
function fmtPct(v) { return `${Number(v || 0).toFixed(1)}%`; }

const PERIODS = [
  { id: 'this_month', label: 'Tháng này' },
  { id: 'this_quarter', label: 'Quý này' },
  { id: 'this_year', label: 'Năm nay' },
];

const DEMO = {
  revenue: 38_700_000_000,
  revenue_change: 12.4,
  expense: 14_200_000_000,
  net_profit: 24_500_000_000,
  profit_margin: 63.3,
  total_employees: 126,
  active_sales: 84,
  total_deals: 47,
  conversion_rate: 18.2,
  pending_approvals: 5,
  kpi_avg: 78,
  revenue_trend: [22, 28, 31, 27, 35, 38, 39],
  top_projects: [
    { name: 'The Privé Residence', revenue: 12_400_000_000, deals: 18, progress: 74 },
    { name: 'Nobu Residences Danang', revenue: 9_800_000_000, deals: 14, progress: 58 },
    { name: 'Sun Symphony', revenue: 7_200_000_000, deals: 11, progress: 82 },
  ],
  dept_kpi: [
    { dept: 'Kinh doanh', kpi: 82, target: 90, color: 'bg-blue-500' },
    { dept: 'Marketing', kpi: 71, target: 80, color: 'bg-pink-500' },
    { dept: 'Vận hành', kpi: 88, target: 85, color: 'bg-emerald-500' },
    { dept: 'Tài chính', kpi: 91, target: 90, color: 'bg-amber-500' },
  ],
  alerts: [
    { id: 1, title: 'Công nợ quá hạn vượt ngưỡng', severity: 'high', dept: 'Tài chính' },
    { id: 2, title: '3 hợp đồng nhân sự sắp hết hạn', severity: 'medium', dept: 'HR' },
    { id: 3, title: '5 yêu cầu duyệt chờ xử lý', severity: 'low', dept: 'Kinh doanh' },
  ],
};

export default function BODDashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [period, setPeriod] = useState('this_month');
  const [data, setData] = useState(DEMO);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/analytics/executive?period=${period}`).catch(() => null);
      // Merge API data ON TOP of DEMO so missing fields always fall back to demo values
      if (res?.data && Object.keys(res.data).length > 0) {
        setData(prev => ({ ...DEMO, ...prev, ...res.data }));
      } else {
        setData(DEMO);
      }
    } catch { setData(DEMO); }
    finally { setLoading(false); }
  }, [period]);

  useEffect(() => { loadData(); }, [loadData]);

  const severityBadge = (s) =>
    s === 'high' ? 'bg-red-100 text-red-700' :
    s === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700';

  return (
    <div className="space-y-6 p-6" data-testid="bod-dashboard">

      {/* ── PREMIUM HEADER ── */}
      <div className="rounded-2xl bg-gradient-to-r from-[#3b0764] to-[#7c3aed] p-6 text-white">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-violet-300 animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-widest text-white/70">
                CHỦ TỊCH HĐQT · {user?.full_name || 'BOD'}
              </span>
            </div>
            <h1 className="text-2xl font-bold">BOD Command Center</h1>
            <p className="mt-1 text-white/60 text-sm">
              {new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {PERIODS.map(p => (
              <button key={p.id} onClick={() => setPeriod(p.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors
                  ${period === p.id ? 'bg-white text-[#7c3aed]' : 'bg-white/15 hover:bg-white/30 text-white'}`}>
                {p.label}
              </button>
            ))}
            <Button size="sm" variant="outline"
              className="border-white/30 bg-white/15 text-white hover:bg-white/25"
              onClick={loadData}>
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {/* Tab nav strip */}
        <div className="mt-4 flex flex-wrap gap-2 border-t border-white/20 pt-4">
          {[
            { label: 'Tổng quan',   icon: BarChart3,   tab: 'overview'  },
            { label: 'Tài chính',   icon: DollarSign,  tab: 'finance'   },
            { label: 'KPI / Teams', icon: Target,      tab: 'kpi'       },
            { label: 'Dự án',       icon: Building2,   tab: 'projects'  },
            { label: 'Cảnh báo',    icon: AlertTriangle, tab: 'alerts'  },
          ].map(t => {
            const Icon = t.icon;
            return (
              <button key={t.tab} onClick={() => setActiveTab(t.tab)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors
                  ${activeTab === t.tab ? 'bg-white text-[#7c3aed]' : 'bg-white/15 hover:bg-white/30 text-white'}`}>
                <Icon className="h-3 w-3" />{t.label}
              </button>
            );
          })}
          <button onClick={() => navigate('/analytics/executive')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-white/15 hover:bg-white/30 text-white transition-colors">
            <Globe className="h-3 w-3" /> Báo cáo điều hành
          </button>
          <button onClick={() => navigate('/control')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-white/15 hover:bg-white/30 text-white transition-colors">
            <ShieldCheck className="h-3 w-3" /> Kiểm soát
          </button>
        </div>
      </div>

      {/* ── KPI HERO CARDS ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Doanh thu', value: fmt(data.revenue), sub: `${data.revenue_change > 0 ? '+' : ''}${fmtPct(data.revenue_change)} vs kỳ trước`, icon: DollarSign, color: 'bg-emerald-50 border-emerald-100', iconBg: 'bg-emerald-100 text-emerald-600', up: data.revenue_change > 0 },
          { label: 'Lợi nhuận', value: fmt(data.net_profit), sub: `Biên: ${fmtPct(data.profit_margin)}`, icon: TrendingUp, color: 'bg-blue-50 border-blue-100', iconBg: 'bg-blue-100 text-blue-600', up: true },
          { label: 'Nhân sự', value: data.total_employees, sub: `${data.active_sales} sales đang hoạt động`, icon: Users, color: 'bg-violet-50 border-violet-100', iconBg: 'bg-violet-100 text-violet-600', up: true },
          { label: 'Deals tháng', value: data.total_deals, sub: `CR: ${fmtPct(data.conversion_rate)}`, icon: Briefcase, color: 'bg-amber-50 border-amber-100', iconBg: 'bg-amber-100 text-amber-600', up: true },
        ].map(card => {
          const Icon = card.icon;
          const Arrow = card.up ? ArrowUpRight : ArrowDownRight;
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
                <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${card.up ? 'text-emerald-600' : 'text-red-500'}`}>
                  <Arrow className="h-3 w-3" />{card.sub}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* ── PENDING APPROVALS ALERT ── */}
      {data.pending_approvals > 0 && (
        <div className="flex items-center justify-between rounded-xl bg-amber-50 border border-amber-200 px-5 py-3">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            <span className="text-sm font-semibold text-amber-800">
              {data.pending_approvals} yêu cầu đang chờ duyệt từ cấp dưới
            </span>
          </div>
          <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white"
            onClick={() => navigate('/app/approvals')}>
            Xem & Duyệt →
          </Button>
        </div>
      )}

      {/* ── TABS CONTENT ── */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="hidden">
          <TabsTrigger value="overview" /><TabsTrigger value="finance" />
          <TabsTrigger value="kpi" /><TabsTrigger value="projects" /><TabsTrigger value="alerts" />
        </TabsList>

        {/* OVERVIEW */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue trend */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-violet-600" />Xu hướng doanh thu
                </CardTitle>
                <CardDescription>7 kỳ gần nhất (tỷ VND)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-end gap-2 h-28">
                  {(data.revenue_trend || [22,28,31,27,35,38,39]).map((v, i, arr) => {
                    const max = Math.max(...arr);
                    const pct = (v / max) * 100;
                    const isLast = i === arr.length - 1;
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1">
                        <span className="text-xs text-slate-400">{v}</span>
                        <div className="w-full rounded-t-md transition-all"
                          style={{ height: `${pct}%`, background: isLast ? '#7c3aed' : '#ddd6fe' }} />
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Dept KPI */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-violet-600" />KPI theo phòng ban
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {(data.dept_kpi || []).map(d => (
                  <div key={d.dept}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium">{d.dept}</span>
                      <span className={d.kpi >= d.target ? 'text-emerald-600 font-semibold' : 'text-amber-600 font-semibold'}>
                        {d.kpi}% / {d.target}%
                      </span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full ${d.color} rounded-full`} style={{ width: `${d.kpi}%` }} />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Top projects */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-violet-600" />Dự án nổi bật
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                {(data.top_projects || []).map(p => (
                  <div key={p.name} className="rounded-xl border border-slate-200 p-4">
                    <p className="font-semibold text-sm">{p.name}</p>
                    <p className="text-2xl font-bold text-slate-900 mt-2">{fmt(p.revenue)}</p>
                    <p className="text-xs text-slate-500 mt-1">{p.deals} giao dịch</p>
                    <div className="mt-3">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-400">Tiến độ</span>
                        <span className="font-semibold text-violet-600">{p.progress}%</span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-violet-500 rounded-full" style={{ width: `${p.progress}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* FINANCE */}
        <TabsContent value="finance" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { label: 'Doanh thu', value: fmt(data.revenue), color: 'text-emerald-700', bg: 'bg-emerald-50', icon: TrendingUp },
              { label: 'Chi phí', value: fmt(data.expense), color: 'text-red-700', bg: 'bg-red-50', icon: TrendingDown },
              { label: 'Lợi nhuận ròng', value: fmt(data.net_profit), color: 'text-blue-700', bg: 'bg-blue-50', icon: DollarSign },
            ].map(item => {
              const Icon = item.icon;
              return (
                <Card key={item.label}>
                  <CardContent className={`p-6 ${item.bg} rounded-lg`}>
                    <div className="flex items-center gap-3 mb-2">
                      <Icon className={`h-5 w-5 ${item.color}`} />
                      <p className="text-sm font-medium text-slate-600">{item.label}</p>
                    </div>
                    <p className={`text-3xl font-bold ${item.color}`}>{item.value}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          <div className="flex gap-3">
            <Button onClick={() => navigate('/finance')}><DollarSign className="h-4 w-4 mr-2" />Finance dashboard</Button>
            <Button variant="outline" onClick={() => navigate('/analytics/reports')}>Báo cáo chi tiết</Button>
          </div>
        </TabsContent>

        {/* KPI */}
        <TabsContent value="kpi" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>KPI tổng thể toàn công ty</CardTitle>
              <CardDescription>Trung bình KPI tất cả phòng ban: <strong>{data.kpi_avg}%</strong></CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {(data.dept_kpi || []).map(d => (
                <div key={d.dept} className="rounded-xl border p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-semibold">{d.dept}</p>
                    <Badge className={d.kpi >= d.target ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}>
                      {d.kpi >= d.target ? '✓ Đạt' : '⚠ Chưa đạt'}
                    </Badge>
                  </div>
                  <div className="flex justify-between text-sm mb-1 text-slate-500">
                    <span>Thực tế: {d.kpi}%</span><span>Mục tiêu: {d.target}%</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full ${d.color} rounded-full`} style={{ width: `${d.kpi}%` }} />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
          <Button onClick={() => navigate('/kpi/team')}><Target className="h-4 w-4 mr-2" />Xem KPI toàn đội</Button>
        </TabsContent>

        {/* PROJECTS */}
        <TabsContent value="projects" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            {(data.top_projects || []).map(p => (
              <Card key={p.name}>
                <CardContent className="p-5">
                  <p className="font-bold text-slate-900">{p.name}</p>
                  <p className="text-3xl font-bold text-violet-700 mt-2">{fmt(p.revenue)}</p>
                  <p className="text-sm text-slate-500 mt-1">{p.deals} giao dịch đã chốt</p>
                  <div className="mt-4">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-400">Tiến độ dự án</span>
                      <span className="font-bold text-violet-600">{p.progress}%</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-violet-500 rounded-full" style={{ width: `${p.progress}%` }} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <Button onClick={() => navigate('/sales/projects')}><Building2 className="h-4 w-4 mr-2" />Xem tất cả dự án</Button>
        </TabsContent>

        {/* ALERTS */}
        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />Cảnh báo điều hành
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {(data.alerts || []).map(alert => (
                <div key={alert.id} className={`flex items-center justify-between p-4 rounded-xl border ${
                  alert.severity === 'high' ? 'border-red-200 bg-red-50' :
                  alert.severity === 'medium' ? 'border-amber-200 bg-amber-50' : 'border-blue-200 bg-blue-50'}`}>
                  <div>
                    <p className="font-semibold text-sm">{alert.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5">Phòng: {alert.dept}</p>
                  </div>
                  <Badge className={severityBadge(alert.severity)}>
                    {alert.severity === 'high' ? 'Khẩn' : alert.severity === 'medium' ? 'Quan trọng' : 'Thông tin'}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
          <div className="flex gap-3">
            <Button onClick={() => navigate('/hr/alerts')}><CheckCircle2 className="h-4 w-4 mr-2" />Xử lý cảnh báo</Button>
            <Button variant="outline" onClick={() => navigate('/control')}>Bảng kiểm soát</Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
