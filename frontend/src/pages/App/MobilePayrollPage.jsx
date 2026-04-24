/**
 * MobilePayrollPage.jsx — Lương & Hoa hồng (Base Payroll)
 * Nhân viên xem bảng lương + hoa hồng của mình
 * HR/Admin xem toàn bộ đội
 */
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, DollarSign, TrendingUp, Award, ChevronDown,
  Download, Eye, EyeOff, CheckCircle2, Clock, Wallet,
  Users, BadgePercent, FileText,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

// ─── MOCK DATA ─────────────────────────────────────────────────────────────────
const MY_PAYROLL = [
  {
    month: '04/2026', baseSalary: 8000000,
    kpiBonus: 2000000, commission: 15400000,
    deductions: 1200000, total: 24200000,
    status: 'pending', deals: [
      { project: 'NOBU Residences', unit: 'S1-08B', value: 3800000000, rate: 0.3, commission: 11400000, closedAt: '10/04/2026' },
      { project: 'Sun Symphony',   unit: 'T2-05A', value: 5200000000, rate: 0.2, commission: 10400000, closedAt: '04/04/2026', partial: 4000000 },
    ],
  },
  {
    month: '03/2026', baseSalary: 8000000,
    kpiBonus: 3000000, commission: 22500000,
    deductions: 1200000, total: 32300000,
    status: 'paid', deals: [
      { project: 'NOBU Residences', unit: 'S3-12C', value: 4100000000, rate: 0.3, commission: 12300000, closedAt: '22/03/2026' },
      { project: 'Sun Cosmo',       unit: 'C1-07B', value: 3400000000, rate: 0.3, commission: 10200000, closedAt: '15/03/2026' },
    ],
  },
  {
    month: '02/2026', baseSalary: 8000000,
    kpiBonus: 1500000, commission: 8500000,
    deductions: 1200000, total: 16800000,
    status: 'paid', deals: [
      { project: 'Sun Ponte', unit: 'T4-09A', value: 5600000000, rate: 0.15, commission: 8400000, closedAt: '18/02/2026' },
    ],
  },
];

const TEAM_PAYROLL = [
  { name: 'Trần Minh Khoa',  role: 'Sales Senior', month: '04/2026', total: 24200000, commission: 15400000, deals: 2, status: 'pending', avatar: 'TK' },
  { name: 'Lê Thu Hương',    role: 'Sales',        month: '04/2026', total: 18700000, commission: 9700000,  deals: 1, status: 'pending', avatar: 'LH' },
  { name: 'Nguyễn Phúc Hùng',role: 'Sales Senior', month: '04/2026', total: 31000000, commission: 22000000, deals: 3, status: 'approved',avatar: 'NH' },
  { name: 'Phạm Thùy Linh',  role: 'Sales',        month: '04/2026', total: 12500000, commission: 3500000,  deals: 1, status: 'pending', avatar: 'PL' },
  { name: 'Võ Thị Kim Anh',  role: 'CTV',          month: '04/2026', total: 6800000,  commission: 6800000,  deals: 1, status: 'paid',    avatar: 'VA' },
];

const fmt = (n) => n?.toLocaleString('vi-VN') + 'đ';
const fmtBn = (n) => {
  if (n >= 1e9) return (n / 1e9).toFixed(1) + ' tỷ';
  if (n >= 1e6) return (n / 1e6).toFixed(0) + ' triệu';
  return n?.toLocaleString('vi-VN');
};

export default function MobilePayrollPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedMonth, setSelectedMonth] = useState(0);
  const [showAmount, setShowAmount] = useState(true);
  const [viewMode, setViewMode] = useState('personal'); // personal | team

  const isManager = ['manager', 'bod', 'admin', 'hr'].includes(user?.role);
  const current = MY_PAYROLL[selectedMonth];

  const statusLabel = { pending: 'Chờ xác nhận', paid: 'Đã thanh toán', approved: 'Đã duyệt' };
  const statusColor = { pending: 'text-amber-500 bg-amber-50', paid: 'text-emerald-600 bg-emerald-50', approved: 'text-blue-600 bg-blue-50' };

  return (
    <div className="h-screen bg-[#f1f5f9] flex flex-col overflow-hidden">
      {/* HEADER */}
      <div
        className="flex-shrink-0 px-4 pt-12 pb-5 text-white"
        style={{ background: 'linear-gradient(135deg, #316585 0%, #1e4560 100%)' }}
      >
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center">
              <ArrowLeft className="w-4 h-4 text-white" />
            </button>
            <h1 className="text-xl font-bold">Lương & Hoa hồng</h1>
          </div>
          <button onClick={() => setShowAmount(!showAmount)} className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center">
            {showAmount ? <Eye className="w-4 h-4 text-white" /> : <EyeOff className="w-4 h-4 text-white" />}
          </button>
        </div>

        {/* View toggle — Manager only */}
        {isManager && (
          <div className="flex bg-white/20 rounded-xl p-1 mb-4">
            {[['personal', 'Của tôi'], ['team', 'Cả đội']].map(([k, label]) => (
              <button
                key={k}
                onClick={() => setViewMode(k)}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${viewMode === k ? 'bg-white text-[#316585]' : 'text-white/70'}`}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        {/* Month selector */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {MY_PAYROLL.map((p, i) => (
            <button
              key={p.month}
              onClick={() => setSelectedMonth(i)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all ${i === selectedMonth ? 'bg-white text-[#316585]' : 'bg-white/20 text-white'}`}
            >
              {p.month}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">

        {viewMode === 'personal' ? (
          <>
            {/* Total card */}
            <div className="bg-white rounded-2xl p-4 mb-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-slate-500 font-medium">Tổng thu nhập {current.month}</p>
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${statusColor[current.status]}`}>
                  {statusLabel[current.status]}
                </span>
              </div>
              <p className="text-3xl font-bold text-slate-900 mb-4">
                {showAmount ? fmt(current.total) : '••••••••'}
              </p>

              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Lương cứng', value: current.baseSalary, color: 'text-slate-700', icon: Wallet },
                  { label: 'Thưởng KPI', value: current.kpiBonus,   color: 'text-blue-600',  icon: Award },
                  { label: 'Hoa hồng',   value: current.commission, color: 'text-emerald-600',icon: BadgePercent },
                ].map(item => (
                  <div key={item.label} className="bg-slate-50 rounded-xl p-3 text-center">
                    <item.icon className={`w-4 h-4 ${item.color} mx-auto mb-1`} />
                    <p className={`text-sm font-bold ${item.color}`}>
                      {showAmount ? (item.value / 1e6).toFixed(1) + 'tr' : '•••'}
                    </p>
                    <p className="text-[10px] text-slate-500">{item.label}</p>
                  </div>
                ))}
              </div>

              {current.deductions > 0 && (
                <div className="mt-3 flex justify-between items-center text-sm border-t border-slate-100 pt-3">
                  <span className="text-slate-500">Các khoản khấu trừ</span>
                  <span className="text-red-500 font-semibold">-{showAmount ? fmt(current.deductions) : '•••'}</span>
                </div>
              )}
            </div>

            {/* Commission breakdown */}
            <div className="bg-white rounded-2xl p-4 shadow-sm mb-4">
              <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-500" />
                Chi tiết hoa hồng giao dịch
              </h3>
              {current.deals.map((deal, i) => (
                <div key={i} className="flex items-start justify-between py-3 border-b border-slate-50 last:border-0">
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-800">{deal.project}</p>
                    <p className="text-xs text-slate-500">Căn {deal.unit} · {fmtBn(deal.value)} · {deal.closedAt}</p>
                    <p className="text-xs text-blue-600 mt-0.5">Tỷ lệ: {(deal.rate * 100).toFixed(1)}%</p>
                    {deal.partial && (
                      <p className="text-xs text-amber-600">⚠️ Nhận trước: {fmt(deal.partial)}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-emerald-600">
                      {showAmount ? fmt(deal.commission) : '•••'}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Download slip */}
            <button className="w-full flex items-center justify-center gap-2 py-3.5 bg-[#316585] text-white rounded-xl font-semibold text-sm">
              <Download className="w-4 h-4" />
              Tải phiếu lương PDF
            </button>
          </>
        ) : (
          /* TEAM VIEW */
          <>
            {/* Team summary */}
            <div className="bg-white rounded-2xl p-4 mb-4 shadow-sm">
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Tổng chi lương', value: TEAM_PAYROLL.reduce((a,b)=>a+b.total,0), color: 'text-slate-700' },
                  { label: 'Tổng hoa hồng', value: TEAM_PAYROLL.reduce((a,b)=>a+b.commission,0), color: 'text-emerald-600' },
                  { label: 'Giao dịch', value: TEAM_PAYROLL.reduce((a,b)=>a+b.deals,0) + ' GD', color: 'text-blue-600', raw: true },
                ].map(s => (
                  <div key={s.label} className="bg-slate-50 rounded-xl p-3 text-center">
                    <p className={`text-base font-bold ${s.color}`}>
                      {s.raw ? s.value : (showAmount ? (s.value/1e6).toFixed(0)+'tr' : '•••')}
                    </p>
                    <p className="text-[10px] text-slate-500">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Team list */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100">
                <h3 className="font-bold text-slate-800">Bảng lương đội ngũ — Tháng 04/2026</h3>
              </div>
              {TEAM_PAYROLL.map((emp, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-50 last:border-0">
                  <div className="w-10 h-10 bg-[#316585] rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xs font-bold">{emp.avatar}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800">{emp.name}</p>
                    <p className="text-xs text-slate-500">{emp.role} · {emp.deals} GD</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-900">
                      {showAmount ? (emp.total/1e6).toFixed(1)+'tr' : '•••'}
                    </p>
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${statusColor[emp.status]}`}>
                      {statusLabel[emp.status]}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        <div className="h-24" />
      </div>
    </div>
  );
}
