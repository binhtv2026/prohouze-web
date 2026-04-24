/**
 * MobileFinanceReportPage.jsx — Báo cáo Tài chính (C)
 * P&L đội · Doanh thu theo dự án · Chi phí Marketing · ROI
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, TrendingUp, TrendingDown, DollarSign,
  BarChart3, PieChart, Download, ChevronDown,
  Wallet, Target, BadgePercent, Award,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const fmt = (n) => {
  if (n >= 1e9) return (n / 1e9).toFixed(1) + ' tỷ';
  if (n >= 1e6) return (n / 1e6).toFixed(0) + ' tr';
  return n.toLocaleString('vi-VN');
};

const fmtFull = (n) => n.toLocaleString('vi-VN') + 'đ';

const MONTHS = ['04/2026', '03/2026', '02/2026', 'Q1/2026'];

const MONTHLY_DATA = {
  '04/2026': {
    revenue: 24.8e9, target: 20e9, lastMonth: 18.2e9,
    commission: 62000000, baseSalary: 32000000, marketing: 8500000, other: 3200000,
    byProject: [
      { name: 'NOBU Residences', revenue: 11.4e9, deals: 3, color: '#316585' },
      { name: 'Sun Symphony',    revenue: 8.2e9,  deals: 2, color: '#f59e0b' },
      { name: 'Sun Ponte',       revenue: 5.2e9,  deals: 1, color: '#10b981' },
    ],
    topSales: [
      { name: 'Nguyễn Phúc Hùng', revenue: 9.2e9, commission: 24600000 },
      { name: 'Trần Minh Khoa',   revenue: 7.8e9, commission: 20800000 },
      { name: 'Lê Thu Hương',     revenue: 5.1e9, commission: 12800000 },
    ],
  },
  '03/2026': {
    revenue: 18.2e9, target: 20e9, lastMonth: 22.1e9,
    commission: 48000000, baseSalary: 32000000, marketing: 7200000, other: 2800000,
    byProject: [
      { name: 'NOBU Residences', revenue: 8.6e9,  deals: 2, color: '#316585' },
      { name: 'Sun Symphony',    revenue: 6.4e9,  deals: 2, color: '#f59e0b' },
      { name: 'Sun Cosmo',       revenue: 3.2e9,  deals: 1, color: '#8b5cf6' },
    ],
    topSales: [
      { name: 'Trần Minh Khoa',   revenue: 7.5e9, commission: 20000000 },
      { name: 'Nguyễn Phúc Hùng', revenue: 6.8e9, commission: 18200000 },
      { name: 'Phạm Thùy Linh',   revenue: 3.9e9, commission: 9800000 },
    ],
  },
};

function ProfitBar({ label, value, total, color }) {
  const pct = Math.round((value / total) * 100);
  return (
    <div className="mb-3">
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs text-slate-600">{label}</p>
        <p className="text-xs font-bold text-slate-800">{fmt(value)}</p>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

export default function MobileFinanceReportPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedMonth, setSelectedMonth] = useState('04/2026');
  const [tab, setTab] = useState('overview');

  const d = MONTHLY_DATA[selectedMonth] || MONTHLY_DATA['04/2026'];
  const totalCost = d.commission + d.baseSalary + d.marketing + d.other;
  const grossProfit = d.revenue * 0.035; // 3.5% margin sau trả CĐT
  const netProfit = grossProfit - totalCost;
  const roi = Math.round((netProfit / totalCost) * 100);
  const vsTarget = Math.round((d.revenue / d.target) * 100);
  const vsLastMonth = Math.round(((d.revenue - d.lastMonth) / d.lastMonth) * 100);

  return (
    <div className="h-screen bg-[#f1f5f9] flex flex-col overflow-hidden">
      {/* HEADER */}
      <div
        className="flex-shrink-0 px-4 pt-12 pb-5 text-white"
        style={{ background: 'linear-gradient(135deg, #059669 0%, #064e3b 100%)' }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center">
              <ArrowLeft className="w-4 h-4 text-white" />
            </button>
            <div>
              <h1 className="text-xl font-bold">Báo cáo Tài chính</h1>
              <p className="text-white/70 text-xs">P&L · Doanh thu · ROI</p>
            </div>
          </div>
          <button className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center">
            <Download className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Month selector */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide mb-4">
          {MONTHS.map(m => (
            <button key={m} onClick={() => setSelectedMonth(m === 'Q1/2026' ? '03/2026' : m)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold ${selectedMonth === m || (m === 'Q1/2026' && selectedMonth === '02/2026') ? 'bg-white text-emerald-700' : 'bg-white/20 text-white'}`}>
              {m}
            </button>
          ))}
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-white/15 rounded-2xl p-3">
            <p className="text-[10px] text-white/60 mb-1">Doanh số</p>
            <p className="text-xl font-black">{fmt(d.revenue)}</p>
            <div className="flex items-center gap-1 mt-1">
              {vsLastMonth >= 0
                ? <TrendingUp className="w-3 h-3 text-emerald-300" />
                : <TrendingDown className="w-3 h-3 text-red-300" />}
              <p className={`text-xs font-bold ${vsLastMonth >= 0 ? 'text-emerald-300' : 'text-red-300'}`}>
                {vsLastMonth >= 0 ? '+' : ''}{vsLastMonth}% vs tháng trước
              </p>
            </div>
          </div>
          <div className="bg-white/15 rounded-2xl p-3">
            <p className="text-[10px] text-white/60 mb-1">Lợi nhuận ròng</p>
            <p className="text-xl font-black">{fmt(netProfit)}</p>
            <p className={`text-xs font-bold mt-1 ${roi >= 0 ? 'text-emerald-300' : 'text-red-300'}`}>ROI: {roi}%</p>
          </div>
          <div className="bg-white/15 rounded-2xl p-3">
            <p className="text-[10px] text-white/60 mb-1">vs Chỉ tiêu</p>
            <p className="text-xl font-black">{vsTarget}%</p>
            <p className={`text-xs font-bold mt-1 ${vsTarget >= 100 ? 'text-emerald-300' : 'text-amber-300'}`}>
              {vsTarget >= 100 ? '✅ Vượt target' : `Còn ${fmt(d.target - d.revenue)}`}
            </p>
          </div>
          <div className="bg-white/15 rounded-2xl p-3">
            <p className="text-[10px] text-white/60 mb-1">Tổng chi phí</p>
            <p className="text-xl font-black">{fmt(totalCost)}</p>
            <p className="text-xs text-white/60 mt-1">{Math.round((totalCost / (d.revenue * 0.035)) * 100)}% gross margin</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-slate-100 px-4 py-2 flex-shrink-0">
        <div className="flex gap-1">
          {[['overview','📊 Tổng quan'], ['revenue','💰 Doanh thu'], ['cost','📉 Chi phí']].map(([k, l]) => (
            <button key={k} onClick={() => setTab(k)}
              className={`flex-1 py-2 rounded-full text-xs font-semibold ${tab === k ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
              {l}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">

        {tab === 'overview' && (
          <>
            {/* P&L Summary */}
            <div className="bg-white rounded-2xl p-4 shadow-sm mb-4">
              <h3 className="font-bold text-slate-800 mb-3">📋 P&L tháng {selectedMonth}</h3>
              <div className="space-y-2">
                {[
                  { label: 'Doanh thu từ commission CĐT', value: d.revenue * 0.035, type: 'income' },
                  { label: '— Chi hoa hồng Sales',  value: -d.commission, type: 'cost' },
                  { label: '— Lương cơ bản Staff',  value: -d.baseSalary, type: 'cost' },
                  { label: '— Marketing & Event',   value: -d.marketing, type: 'cost' },
                  { label: '— Chi phí khác',        value: -d.other, type: 'cost' },
                ].map((row, i) => (
                  <div key={i} className={`flex justify-between py-2 ${i < 4 ? 'border-b border-slate-50' : ''}`}>
                    <span className="text-sm text-slate-600">{row.label}</span>
                    <span className={`text-sm font-bold ${row.type === 'income' ? 'text-emerald-600' : 'text-red-500'}`}>
                      {row.value >= 0 ? '+' : ''}{fmt(row.value)}
                    </span>
                  </div>
                ))}
                <div className="flex justify-between pt-2 border-t-2 border-slate-200">
                  <span className="text-sm font-bold text-slate-800">Lợi nhuận ròng</span>
                  <span className={`text-sm font-black ${netProfit >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>{fmt(netProfit)}</span>
                </div>
              </div>
            </div>

            {/* Top Sales */}
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <h3 className="font-bold text-slate-800 mb-3">🏆 Top Sales tháng này</h3>
              {d.topSales.map((s, i) => (
                <div key={i} className="flex items-center gap-3 py-2.5 border-b border-slate-50 last:border-0">
                  <span className="text-lg w-6">{['🥇','🥈','🥉'][i]}</span>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-800">{s.name}</p>
                    <p className="text-xs text-slate-500">{fmt(s.revenue)} doanh số</p>
                  </div>
                  <p className="text-sm font-bold text-emerald-600">{fmt(s.commission)}</p>
                </div>
              ))}
            </div>
          </>
        )}

        {tab === 'revenue' && (
          <>
            <div className="bg-white rounded-2xl p-4 shadow-sm mb-4">
              <h3 className="font-bold text-slate-800 mb-4">Doanh thu theo dự án</h3>
              {d.byProject.map((p, i) => {
                const pct = Math.round((p.revenue / d.revenue) * 100);
                return (
                  <div key={i} className="mb-4">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ background: p.color }} />
                        <p className="text-sm font-medium text-slate-700">{p.name}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-slate-800">{fmt(p.revenue)}</p>
                        <p className="text-[10px] text-slate-400">{p.deals} GD · {pct}%</p>
                      </div>
                    </div>
                    <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: p.color }} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Target progress */}
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="flex justify-between mb-2">
                <p className="font-bold text-slate-800">Tiến độ vs Chỉ tiêu</p>
                <p className="text-sm font-bold text-emerald-600">{vsTarget}%</p>
              </div>
              <div className="h-4 bg-slate-100 rounded-full overflow-hidden mb-2">
                <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${Math.min(vsTarget, 100)}%` }} />
              </div>
              <div className="flex justify-between text-xs text-slate-500">
                <span>Thực tế: {fmt(d.revenue)}</span>
                <span>Chỉ tiêu: {fmt(d.target)}</span>
              </div>
            </div>
          </>
        )}

        {tab === 'cost' && (
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <h3 className="font-bold text-slate-800 mb-4">Phân tích chi phí</h3>
            <ProfitBar label="Hoa hồng Sales"    value={d.commission}  total={totalCost} color="#316585" />
            <ProfitBar label="Lương cơ bản"      value={d.baseSalary}  total={totalCost} color="#7c3aed" />
            <ProfitBar label="Marketing & Event" value={d.marketing}   total={totalCost} color="#f59e0b" />
            <ProfitBar label="Chi phí khác"      value={d.other}       total={totalCost} color="#6b7280" />

            <div className="mt-4 pt-4 border-t border-slate-100">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Tổng chi phí', value: totalCost, color: 'text-slate-800' },
                  { label: 'Gross margin', value: d.revenue * 0.035, color: 'text-emerald-600' },
                  { label: 'ROI', value: roi + '%', color: roi >= 0 ? 'text-emerald-600' : 'text-red-500', raw: true },
                  { label: 'Marketing ROI', value: Math.round((d.revenue * 0.035 / d.marketing) * 10) / 10 + 'x', color: 'text-blue-600', raw: true },
                ].map(s => (
                  <div key={s.label} className="bg-slate-50 rounded-xl p-3 text-center">
                    <p className={`text-lg font-black ${s.color}`}>{s.raw ? s.value : fmt(s.value)}</p>
                    <p className="text-[10px] text-slate-500">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="h-24" />
      </div>
    </div>
  );
}
