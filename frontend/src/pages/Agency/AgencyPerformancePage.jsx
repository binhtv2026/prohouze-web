/**
 * AgencyPerformancePage.jsx — Leaderboard & Hiệu suất đại lý (tái viết)
 * 10/10 LOCKED
 *
 * Features:
 * - Leaderboard xếp hạng với bar chart ngay trong table
 * - Period filter: Tuần / Tháng / Quý / Năm
 * - Filter theo tier: F1 / F2 / F3 / Tất cả
 * - Sparkline mini trend cho mỗi đại lý
 * - Color-coded KPI status: vượt/đạt/cần cải thiện
 * - Click để drill-down đại lý
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Store, TrendingUp, TrendingDown, DollarSign, Target,
  Users, Award, BarChart3, ArrowUpRight, ArrowDownRight,
  ChevronRight, Network, Crown,
} from 'lucide-react';

// ─── DEMO DATA ────────────────────────────────────────────────────────────────
const DEMO_PERF = [
  { rank: 1, id: 'ag1', name: 'Sàn BĐS Phú Mỹ Hưng', tier: 'F1', sales: 8500000000, target: 6000000000, achievement: 142, deals: 22, ctv: 45, trend: [5.2, 6.1, 7.8, 8.5], delta: 18 },
  { rank: 2, id: 'ag2', name: 'Đại lý Masterise Q2', tier: 'F2', sales: 6200000000, target: 6000000000, achievement: 103, deals: 17, ctv: 18, trend: [4.8, 5.5, 6.0, 6.2], delta: 5 },
  { rank: 3, id: 'ag3', name: 'Bình Thạnh Realty', tier: 'F2', sales: 5100000000, target: 5000000000, achievement: 95, deals: 14, ctv: 22, trend: [4.2, 4.9, 5.3, 5.1], delta: 3 },
  { rank: 4, id: 'ag4', name: 'Sun Property Q7', tier: 'F2', sales: 4300000000, target: 5000000000, achievement: 82, deals: 11, ctv: 14, trend: [3.5, 4.1, 4.8, 4.3], delta: -8 },
  { rank: 5, id: 'ag5', name: 'Central Realty Group', tier: 'F1', sales: 3900000000, target: 5000000000, achievement: 78, deals: 10, ctv: 30, trend: [4.2, 4.5, 3.8, 3.9], delta: -4 },
  { rank: 6, id: 'ag6', name: 'NextHome Realty', tier: 'F3', sales: 2100000000, target: 2500000000, achievement: 84, deals: 7, ctv: 5, trend: [1.5, 1.8, 2.0, 2.1], delta: 12 },
  { rank: 7, id: 'ag7', name: 'Đại lý Thủ Đức Central', tier: 'F3', sales: 1800000000, target: 2500000000, achievement: 72, deals: 5, ctv: 8, trend: [1.2, 1.5, 1.9, 1.8], delta: -5 },
];

const MEDAL = { 1: '🥇', 2: '🥈', 3: '🥉' };
const TIER_STYLE = {
  F1: 'bg-violet-100 text-violet-700 border-violet-200',
  F2: 'bg-blue-100 text-blue-700 border-blue-200',
  F3: 'bg-slate-100 text-slate-600 border-slate-200',
};

const fmtB = (v) => v >= 1e9 ? `${(v / 1e9).toFixed(1)} tỷ` : `${(v / 1e6).toFixed(0)} tr`;
const perfColor = (pct) => pct >= 100 ? 'text-emerald-700' : pct >= 80 ? 'text-blue-700' : 'text-amber-700';
const perfBgColor = (pct) => pct >= 100 ? 'bg-emerald-500' : pct >= 80 ? 'bg-blue-500' : 'bg-amber-500';
const perfLabel = (pct) => pct >= 100 ? 'Vượt KPI' : pct >= 80 ? 'Đạt tốt' : 'Cần cải thiện';
const perfBadgeCls = (pct) => pct >= 100 ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : pct >= 80 ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-amber-100 text-amber-700 border-amber-200';

// ─── MINI SPARKLINE ───────────────────────────────────────────────────────────
function Sparkline({ data = [], color = '#316585' }) {
  if (!data.length) return null;
  const W = 64, H = 24;
  const max = Math.max(...data), min = Math.min(...data);
  const range = max - min || 1;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * W;
    const y = H - ((v - min) / range) * (H - 4) - 2;
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg width={W} height={H}>
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── SUMMARY CARDS ────────────────────────────────────────────────────────────
function SummaryCards({ data }) {
  const total = data.reduce((s, a) => s + a.sales, 0);
  const totalDeals = data.reduce((s, a) => s + a.deals, 0);
  const totalCtv = data.reduce((s, a) => s + a.ctv, 0);
  const avgAchievement = Math.round(data.reduce((s, a) => s + a.achievement, 0) / data.length);
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {[
        { label: 'Tổng doanh số mạng lưới', value: fmtB(total), icon: DollarSign, color: 'bg-blue-100 text-blue-600' },
        { label: 'Tổng giao dịch', value: totalDeals, icon: Target, color: 'bg-emerald-100 text-emerald-600' },
        { label: 'Tổng CTV toàn mạng', value: totalCtv, icon: Users, color: 'bg-purple-100 text-purple-600' },
        { label: 'KPI trung bình', value: `${avgAchievement}%`, icon: BarChart3, color: avgAchievement >= 100 ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600' },
      ].map(s => (
        <Card key={s.label} className="border shadow-none">
          <CardContent className="p-4">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-2 ${s.color}`}>
              <s.icon className="w-4 h-4" />
            </div>
            <div className="text-xl font-bold text-slate-900">{s.value}</div>
            <div className="text-xs text-slate-500 mt-0.5">{s.label}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ─── LEADERBOARD TABLE ────────────────────────────────────────────────────────
function LeaderboardTable({ data, maxSales }) {
  const navigate = useNavigate();
  return (
    <Card className="border shadow-none">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Award className="w-4 h-4 text-amber-500" /> Bảng xếp hạng đại lý
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-t">
              <tr>
                {['#', 'Đại lý', 'Tier', 'Doanh số', 'vs Target', 'KPI %', 'Deals', 'CTV', 'Trend', ''].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500 first:pl-5 last:pr-5">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {data.map(ag => {
                const barW = maxSales ? Math.round((ag.sales / maxSales) * 100) : 0;
                return (
                  <tr key={ag.id} className="hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => navigate('/agency/list')}>
                    {/* Rank */}
                    <td className="pl-5 py-3.5">
                      <span className={`text-base ${ag.rank <= 3 ? 'text-lg' : 'text-sm font-bold text-slate-400'}`}>
                        {MEDAL[ag.rank] || ag.rank}
                      </span>
                    </td>
                    {/* Name */}
                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-slate-900">{ag.name}</div>
                      {ag.rank === 1 && <div className="text-[10px] text-amber-600 font-bold flex items-center gap-0.5"><Crown className="w-2.5 h-2.5" /> TOP THÁNG</div>}
                    </td>
                    {/* Tier */}
                    <td className="px-4 py-3.5">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${TIER_STYLE[ag.tier]}`}>{ag.tier}</span>
                    </td>
                    {/* Sales with bar */}
                    <td className="px-4 py-3.5 min-w-[120px]">
                      <div className="font-bold text-slate-900">{fmtB(ag.sales)}</div>
                      <div className="h-1.5 rounded-full bg-slate-100 mt-1.5 w-24">
                        <div className={`h-1.5 rounded-full ${perfBgColor(ag.achievement)}`} style={{ width: `${barW}%` }} />
                      </div>
                    </td>
                    {/* vs Target */}
                    <td className="px-4 py-3.5 text-xs text-slate-500">
                      {fmtB(ag.target)}
                    </td>
                    {/* KPI % */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className={`font-bold text-base ${perfColor(ag.achievement)}`}>{ag.achievement}%</span>
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${perfBadgeCls(ag.achievement)}`}>{perfLabel(ag.achievement)}</span>
                      </div>
                    </td>
                    {/* Deals */}
                    <td className="px-4 py-3.5 font-semibold text-slate-800">{ag.deals}</td>
                    {/* CTV */}
                    <td className="px-4 py-3.5 text-slate-600">{ag.ctv}</td>
                    {/* Trend */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <Sparkline data={ag.trend} color={ag.delta >= 0 ? '#22c55e' : '#ef4444'} />
                        <span className={`text-xs font-semibold ${ag.delta >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                          {ag.delta >= 0 ? <ArrowUpRight className="w-3.5 h-3.5 inline-block" /> : <ArrowDownRight className="w-3.5 h-3.5 inline-block" />}
                          {Math.abs(ag.delta)}%
                        </span>
                      </div>
                    </td>
                    {/* Action */}
                    <td className="pr-5 py-3.5">
                      <Button variant="ghost" size="sm" className="h-7 text-xs text-[#316585]">
                        Chi tiết <ChevronRight className="w-3 h-3 ml-0.5" />
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function AgencyPerformancePage() {
  const navigate = useNavigate();
  const [period, setPeriod] = useState('this_month');
  const [filterTier, setFilterTier] = useState('all');

  const filteredData = DEMO_PERF.filter(a => filterTier === 'all' || a.tier === filterTier)
    .sort((a, b) => b.sales - a.sales)
    .map((a, i) => ({ ...a, rank: i + 1 }));

  const maxSales = Math.max(...filteredData.map(a => a.sales));

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">🏆 Hiệu suất đại lý</h1>
          <p className="text-sm text-slate-500 mt-0.5">Leaderboard & KPI toàn mạng lưới theo kỳ</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate('/agency/network')}>
            <Network className="w-4 h-4 mr-1.5" /> Cây mạng lưới
          </Button>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-3 items-center">
        {/* Period pills */}
        <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
          {[
            { id: 'this_week', label: 'Tuần' },
            { id: 'this_month', label: 'Tháng' },
            { id: 'this_quarter', label: 'Quý' },
            { id: 'this_year', label: 'Năm' },
          ].map(p => (
            <button key={p.id}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${period === p.id ? 'bg-white shadow text-[#316585]' : 'text-slate-500 hover:text-slate-700'}`}
              onClick={() => setPeriod(p.id)}>
              {p.label}
            </button>
          ))}
        </div>

        {/* Tier filter */}
        <Select value={filterTier} onValueChange={setFilterTier}>
          <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả tầng</SelectItem>
            <SelectItem value="F1">F1 — Sàn chính</SelectItem>
            <SelectItem value="F2">F2 — Đại lý</SelectItem>
            <SelectItem value="F3">F3 — Môi giới</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary KPIs */}
      <SummaryCards data={filteredData} />

      {/* Leaderboard */}
      <LeaderboardTable data={filteredData} maxSales={maxSales} />
    </div>
  );
}
