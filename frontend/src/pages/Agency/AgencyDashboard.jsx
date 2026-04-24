/**
 * AgencyDashboard.jsx — Command Center cho Module Đại lý & Phân phối
 * 10/10 LOCKED
 * 
 * Features:
 * - Real-time stats: tổng đại lý, phân cấp F1/F2/F3, CTV, doanh số mạng lưới
 * - Network health indicators
 * - Top performers leaderboard (mini)
 * - Giỏ hàng distribution summary
 * - Alert items (allocation expiring, pending approval)
 */
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Store, Users, TrendingUp, DollarSign, Network, Package,
  AlertTriangle, ChevronRight, Clock, Award, BarChart3,
  CheckCircle2, XCircle, Timer, Percent, ArrowUpRight, ArrowDownRight,
  Building2, Layers, Shield,
} from 'lucide-react';
import agencyApi from '@/api/agencyApi';

// ─── MOCK DATA (replace with API when backend ready) ──────────────────────────
const DEMO_STATS = {
  total_agencies: 24,
  active: 18,
  pending_approval: 3,
  suspended: 3,
  by_tier: { F1: 2, F2: 12, F3: 10 },
  total_ctv: 487,
  network_sales_mtd: 34800000000,  // 34.8 tỷ
  network_sales_target: 40000000000, // 40 tỷ
  network_achievement_pct: 87,
  total_units_allocated: 340,
  total_units_sold: 218,
  total_units_remaining: 122,
  commission_pending: 1240000000, // 1.24 tỷ hoa hồng chờ duyệt
};

const DEMO_TOP_AGENCIES = [
  { rank: 1, id: 'ag1', name: 'Sàn BĐS Phú Mỹ Hưng', tier: 'F1', sales: 8500000000, achievement: 142, deals: 22, trend: 'up', delta: 18 },
  { rank: 2, id: 'ag2', name: 'Đại lý Masterise Q2', tier: 'F2', sales: 6200000000, achievement: 103, deals: 17, trend: 'up', delta: 5 },
  { rank: 3, id: 'ag3', name: 'Bình Thạnh Realty', tier: 'F2', sales: 5100000000, achievement: 95, deals: 14, trend: 'up', delta: 3 },
  { rank: 4, id: 'ag4', name: 'Sun Property Q7', tier: 'F2', sales: 4300000000, achievement: 82, deals: 11, trend: 'down', delta: -8 },
  { rank: 5, id: 'ag5', name: 'Đại lý Thủ Đức Central', tier: 'F3', sales: 3200000000, achievement: 76, deals: 9, trend: 'down', delta: -4 },
];

const DEMO_ALERTS = [
  { id: 1, type: 'expiring', title: 'Giỏ hàng độc quyền sắp hết hạn', body: 'Sàn Phú Mỹ Hưng — Block B The Opus One · Còn 3 ngày', severity: 'high' },
  { id: 2, type: 'pending', title: 'Đại lý mới chờ phê duyệt', body: 'Đại lý Sunny Property — Hồ sơ đã đầy đủ', severity: 'medium' },
  { id: 3, type: 'expiring', title: 'Giỏ hàng độc quyền sắp hết hạn', body: 'Đại lý Q2 — Block T2 Masteri Grand View · Còn 7 ngày', severity: 'medium' },
  { id: 4, type: 'commission', title: 'Hoa hồng chờ phê duyệt', body: '1.24 tỷ đồng hoa hồng đại lý chờ duyệt · 8 bộ hồ sơ', severity: 'low' },
];

const DEMO_DISTRIBUTIONS = [
  { project: 'The Opus One', agency: 'Sàn BĐS Phú Mỹ Hưng', tier: 'F1', allocated: 80, sold: 62, pct: 78, expiry: '30/05/2026' },
  { project: 'Masteri Grand View', agency: 'Đại lý Masterise Q2', tier: 'F2', allocated: 50, sold: 28, pct: 56, expiry: '15/06/2026' },
  { project: 'Lumiere Riverside', agency: 'Bình Thạnh Realty', tier: 'F2', allocated: 40, sold: 31, pct: 78, expiry: '20/05/2026' },
];

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const fmtBillion = (v) => {
  if (!v) return '—';
  if (v >= 1e9) return `${(v / 1e9).toFixed(1)} tỷ`;
  if (v >= 1e6) return `${(v / 1e6).toFixed(0)} tr`;
  return `${v.toLocaleString('vi-VN')}đ`;
};

const TIER_COLORS = {
  F1: 'bg-violet-100 text-violet-700 border-violet-200',
  F2: 'bg-blue-100 text-blue-700 border-blue-200',
  F3: 'bg-slate-100 text-slate-600 border-slate-200',
};

const ALERT_COLORS = {
  high: 'border-l-red-500 bg-red-50',
  medium: 'border-l-amber-500 bg-amber-50',
  low: 'border-l-blue-500 bg-blue-50',
};

const ALERT_ICONS = {
  expiring: Timer,
  pending: Clock,
  commission: DollarSign,
};

// ─── STAT CARD ────────────────────────────────────────────────────────────────
function StatCard({ title, value, sub, icon: Icon, color, action, onClick }) {
  return (
    <Card
      className={`border shadow-none ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
      onClick={onClick}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className={`p-2.5 rounded-xl ${color}`}>
            <Icon className="w-5 h-5" />
          </div>
          {action && (
            <Button variant="ghost" size="sm" className="h-7 text-xs text-slate-400 hover:text-slate-600 -mr-1" onClick={e => { e.stopPropagation(); onClick?.(); }}>
              {action} <ChevronRight className="w-3 h-3 ml-0.5" />
            </Button>
          )}
        </div>
        <div className="text-2xl font-bold text-slate-900">{value}</div>
        <div className="text-sm text-slate-500 mt-0.5">{title}</div>
        {sub && <div className="text-xs text-slate-400 mt-1">{sub}</div>}
      </CardContent>
    </Card>
  );
}

// ─── NETWORK DONUT ────────────────────────────────────────────────────────────
function NetworkDonut({ byTier, total }) {
  const f1Pct = Math.round(((byTier?.F1 || 0) / total) * 100);
  const f2Pct = Math.round(((byTier?.F2 || 0) / total) * 100);
  const f3Pct = 100 - f1Pct - f2Pct;
  const cx = 60, cy = 60, r = 45, stroke = 12;
  const circ = 2 * Math.PI * r;
  const segments = [
    { pct: f1Pct, color: '#7c3aed', label: 'F1 (Sàn chính)', count: byTier?.F1 || 0 },
    { pct: f2Pct, color: '#3b82f6', label: 'F2 (Đại lý)', count: byTier?.F2 || 0 },
    { pct: f3Pct, color: '#94a3b8', label: 'F3 (Môi giới CTV)', count: byTier?.F3 || 0 },
  ];
  let offset = 0;
  return (
    <div className="flex items-center gap-6">
      <svg width="120" height="120" viewBox="0 0 120 120">
        {segments.map((s, i) => {
          const dashLen = (s.pct / 100) * circ;
          const el = (
            <circle key={i}
              cx={cx} cy={cy} r={r}
              fill="none" stroke={s.color} strokeWidth={stroke}
              strokeDasharray={`${dashLen} ${circ - dashLen}`}
              strokeDashoffset={-offset}
              strokeLinecap="butt"
              transform={`rotate(-90 ${cx} ${cy})`}
            />
          );
          offset += dashLen;
          return el;
        })}
        <text x={cx} y={cy - 6} textAnchor="middle" fontSize="22" fontWeight="800" fill="#1e293b">{total}</text>
        <text x={cx} y={cy + 12} textAnchor="middle" fontSize="9" fill="#94a3b8">Đại lý</text>
      </svg>
      <div className="space-y-2">
        {segments.map((s, i) => (
          <div key={i} className="flex items-center gap-2.5">
            <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ background: s.color }} />
            <div>
              <div className="text-sm font-semibold text-slate-800">{s.count} — {s.label}</div>
              <div className="text-xs text-slate-400">{s.pct}% mạng lưới</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function AgencyDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(DEMO_STATS);
  const [topAgencies, setTopAgencies] = useState(DEMO_TOP_AGENCIES);
  const [alerts, setAlerts] = useState(DEMO_ALERTS);
  const [distributions, setDistributions] = useState(DEMO_DISTRIBUTIONS);
  const [loading, setLoading] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, topRes] = await Promise.allSettled([
        agencyApi.getDashboardStats(),
        agencyApi.getLeaderboard('this_month'),
      ]);
      if (statsRes.status === 'fulfilled' && statsRes.value?.data) setStats(statsRes.value.data);
      if (topRes.status === 'fulfilled' && topRes.value?.data) setTopAgencies(topRes.value.data.slice(0, 5));
    } catch (_) { /* use demo */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const networkPct = stats.network_achievement_pct;
  const invPct = stats.total_units_allocated ? Math.round((stats.total_units_sold / stats.total_units_allocated) * 100) : 0;

  return (
    <div className="space-y-6" data-testid="agency-dashboard">

      {/* ── PREMIUM HEADER ── */}
      <div className="rounded-2xl bg-gradient-to-r from-[#1a3a4c] to-[#316585] p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-blue-300 animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-widest text-white/70">CỘNG TÁC VIÊN / ĐẠI LÝ</span>
            </div>
            <h1 className="text-2xl font-bold">Đại lý & Phân phối</h1>
            <p className="mt-1 text-white/60 text-sm">
              {new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline"
              className="border-white/30 bg-white/15 text-white hover:bg-white/25"
              onClick={() => navigate('/agency/network')}>
              <Network className="w-4 h-4 mr-1.5" /> Mạng lưới
            </Button>
            <Button size="sm" className="bg-white text-[#316585] hover:bg-white/90"
              onClick={() => navigate('/agency/list')}>
              <Store className="w-4 h-4 mr-1.5" /> Qản lý đại lý
            </Button>
          </div>
        </div>
        {/* Tab nav strip */}
        <div className="mt-4 flex flex-wrap gap-2 border-t border-white/20 pt-4">
          {[
            { label: 'Tổng quan',       icon: BarChart3,  path: '/agency' },
            { label: 'Danh sách ĐL',   icon: Store,      path: '/agency/list' },
            { label: 'Phân phối giỏ hàng', icon: Package, path: '/agency/distribution' },
            { label: 'Hiệu suất',      icon: TrendingUp, path: '/agency/performance' },
            { label: 'Cây mạng lưới',  icon: Network,   path: '/agency/network' },
            { label: 'Hoa hồng',        icon: DollarSign, path: '/finance/my-income' },
            { label: 'Sản phẩm',        icon: Layers,    path: '/sales/catalog' },
            { label: 'Kiến thức',       icon: Shield,    path: '/sales/knowledge-center' },
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

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map(a => {
            const Icon = ALERT_ICONS[a.type] || AlertTriangle;
            return (
              <div key={a.id} className={`flex items-start gap-3 border-l-4 rounded-lg p-3 ${ALERT_COLORS[a.severity]}`}>
                <Icon className="w-4 h-4 mt-0.5 flex-shrink-0 text-slate-600" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800">{a.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{a.body}</p>
                </div>
                <Button variant="ghost" size="sm" className="h-7 text-xs flex-shrink-0">Xử lý</Button>
              </div>
            );
          })}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Tổng đại lý" value={stats.total_agencies} sub={`${stats.pending_approval} chờ duyệt · ${stats.suspended} tạm ngưng`} icon={Store} color="bg-blue-100 text-blue-600" action="Xem tất cả" onClick={() => navigate('/agency/list')} />
        <StatCard title="CTV trong mạng lưới" value={stats.total_ctv} sub="Qua tất cả F1/F2/F3" icon={Users} color="bg-purple-100 text-purple-600" />
        <StatCard title="Doanh số mạng lưới (MTD)" value={fmtBillion(stats.network_sales_mtd)} sub={`Mục tiêu ${fmtBillion(stats.network_sales_target)} · ${networkPct}% đạt`} icon={TrendingUp} color={networkPct >= 100 ? 'bg-emerald-100 text-emerald-600' : networkPct >= 80 ? 'bg-blue-100 text-blue-600' : 'bg-amber-100 text-amber-600'} />
        <StatCard title="Hoa hồng chờ duyệt" value={fmtBillion(stats.commission_pending)} sub="Cần phê duyệt trước ngày 30" icon={DollarSign} color="bg-amber-100 text-amber-600" action="Duyệt" onClick={() => navigate('/finance/commissions')} />
      </div>

      {/* Main Content Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Network Breakdown */}
        <Card className="border shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Network className="w-4 h-4 text-violet-600" /> Cấu trúc mạng lưới
            </CardTitle>
          </CardHeader>
          <CardContent>
            <NetworkDonut byTier={stats.by_tier} total={stats.total_agencies} />
            <div className="mt-5 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-xl bg-violet-50 border border-violet-100 p-2.5">
                <div className="text-xl font-bold text-violet-700">{stats.by_tier?.F1 || 0}</div>
                <div className="text-[10px] font-semibold text-violet-500 uppercase tracking-wider mt-0.5">F1 — Sàn chính</div>
                <div className="text-[10px] text-violet-400">Lấy trực tiếp từ CĐT</div>
              </div>
              <div className="rounded-xl bg-blue-50 border border-blue-100 p-2.5">
                <div className="text-xl font-bold text-blue-700">{stats.by_tier?.F2 || 0}</div>
                <div className="text-[10px] font-semibold text-blue-500 uppercase tracking-wider mt-0.5">F2 — Đại lý</div>
                <div className="text-[10px] text-blue-400">Nhận hàng từ F1</div>
              </div>
              <div className="rounded-xl bg-slate-50 border border-slate-100 p-2.5">
                <div className="text-xl font-bold text-slate-700">{stats.by_tier?.F3 || 0}</div>
                <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mt-0.5">F3 — Môi giới</div>
                <div className="text-[10px] text-slate-400">Bán lẻ qua F2</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top Agencies Leaderboard */}
        <Card className="border shadow-none lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-500" /> Top 5 Đại lý tháng này
              </CardTitle>
              <Button variant="ghost" size="sm" className="text-xs text-[#316585]" onClick={() => navigate('/agency/performance')}>
                Xem đầy đủ <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {topAgencies.map((ag) => (
                <div key={ag.id} className="flex items-center gap-4 px-5 py-3 hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => navigate(`/agency/list`)}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${ag.rank === 1 ? 'bg-amber-100 text-amber-600' : ag.rank === 2 ? 'bg-slate-100 text-slate-600' : ag.rank === 3 ? 'bg-orange-100 text-orange-600' : 'bg-slate-50 text-slate-400'}`}>
                    {ag.rank}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-slate-800 truncate">{ag.name}</p>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${TIER_COLORS[ag.tier]}`}>{ag.tier}</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">{ag.deals} giao dịch · {ag.achievement}% KPI</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-sm font-bold text-slate-900">{fmtBillion(ag.sales)}</div>
                    <div className={`flex items-center justify-end gap-0.5 text-xs font-medium ${ag.trend === 'up' ? 'text-emerald-600' : 'text-red-500'}`}>
                      {ag.trend === 'up' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                      {Math.abs(ag.delta)}%
                    </div>
                  </div>
                  <div className="w-16">
                    <div className="h-1.5 rounded-full bg-slate-100">
                      <div className={`h-1.5 rounded-full transition-all ${ag.achievement >= 100 ? 'bg-emerald-500' : ag.achievement >= 80 ? 'bg-blue-500' : 'bg-amber-500'}`} style={{ width: `${Math.min(ag.achievement, 100)}%` }} />
                    </div>
                    <div className="text-[10px] text-slate-400 text-right mt-0.5">{ag.achievement}%</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Inventory Distribution Summary */}
      <Card className="border shadow-none">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Package className="w-4 h-4 text-blue-600" /> Tình trạng giỏ hàng phân bổ
            </CardTitle>
            <div className="flex items-center gap-4 text-sm text-slate-500">
              <span>Tổng phân bổ: <strong className="text-slate-800">{stats.total_units_allocated} căn</strong></span>
              <span>Đã bán: <strong className="text-emerald-700">{stats.total_units_sold} căn</strong></span>
              <span>Còn lại: <strong className="text-amber-700">{stats.total_units_remaining} căn</strong></span>
              <Button variant="ghost" size="sm" className="text-xs text-[#316585]" onClick={() => navigate('/agency/distribution')}>
                Quản lý <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
              </Button>
            </div>
          </div>
          {/* Master progress bar */}
          <div className="mt-2">
            <div className="flex justify-between text-xs text-slate-500 mb-1">
              <span>Tỉ lệ bán hàng toàn mạng</span>
              <span className="font-semibold text-slate-700">{invPct}%</span>
            </div>
            <div className="h-2.5 rounded-full bg-slate-100">
              <div className={`h-2.5 rounded-full transition-all ${invPct >= 80 ? 'bg-emerald-500' : invPct >= 60 ? 'bg-blue-500' : 'bg-amber-500'}`} style={{ width: `${invPct}%` }} />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {distributions.map((d, i) => {
              const pct = d.pct;
              return (
                <div key={i} className="grid grid-cols-12 items-center gap-4 px-5 py-3.5 hover:bg-slate-50">
                  <div className="col-span-3">
                    <p className="text-sm font-semibold text-slate-800">{d.project}</p>
                    <p className="text-xs text-slate-400">HH đến: {d.expiry}</p>
                  </div>
                  <div className="col-span-3 flex items-center gap-2">
                    <Store className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-slate-700 font-medium truncate">{d.agency}</p>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${TIER_COLORS[d.tier]}`}>{d.tier}</span>
                    </div>
                  </div>
                  <div className="col-span-2 text-center">
                    <div className="text-base font-bold text-slate-800">{d.allocated}</div>
                    <div className="text-xs text-slate-400">phân bổ</div>
                  </div>
                  <div className="col-span-2 text-center">
                    <div className="text-base font-bold text-emerald-700">{d.sold}</div>
                    <div className="text-xs text-slate-400">đã bán</div>
                  </div>
                  <div className="col-span-2">
                    <div className="flex justify-between text-xs text-slate-500 mb-1">
                      <span>{d.allocated - d.sold} còn</span>
                      <span className="font-semibold">{pct}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100">
                      <div className={`h-2 rounded-full ${pct >= 80 ? 'bg-emerald-500' : pct >= 60 ? 'bg-blue-500' : 'bg-amber-500'}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
