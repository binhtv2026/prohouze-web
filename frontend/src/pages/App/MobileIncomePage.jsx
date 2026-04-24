/**
 * MobileIncomePage.jsx — Hoa hồng & Thu nhập (Mobile)
 * API: getMyIncomeWithKPI from commissionApi + kpiApi
 * Route: /finance/my-income
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Wallet, TrendingUp, Star, Clock, CheckCircle2 } from 'lucide-react';
import { getMyIncomeWithKPI } from '@/api/commissionApi';
import { kpiApi } from '@/api/kpiApi';

function fmt(n) {
  const v = Number(n || 0);
  if (!v) return '—';
  if (v >= 1e9) return `${(v / 1e9).toFixed(1)} tỷ`;
  if (v >= 1e6) return `${(v / 1e6).toFixed(0)} triệu`;
  return v.toLocaleString('vi-VN') + ' đ';
}

function StatCard({ icon: Icon, label, value, color, bg }) {
  return (
    <div className={`${bg} rounded-2xl p-4 flex flex-col gap-1`}>
      <Icon className={`w-4 h-4 ${color}`} />
      <p className={`text-xl font-black ${color} leading-tight mt-1`}>{value}</p>
      <p className="text-[11px] font-semibold text-slate-600">{label}</p>
    </div>
  );
}

function CommissionRow({ item, index }) {
  const status = item.status || item.commission_status || 'pending';
  const statusConfig = {
    approved:  { label: 'Đã duyệt', color: 'text-emerald-600', icon: CheckCircle2 },
    pending:   { label: 'Chờ duyệt', color: 'text-amber-600',  icon: Clock        },
    paid:      { label: 'Đã thanh toán', color: 'text-blue-600', icon: Wallet      },
  }[status] || { label: status, color: 'text-slate-500', icon: Clock };
  const StatusIcon = statusConfig.icon;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-4 py-3 flex items-center gap-3">
      <div className="w-9 h-9 bg-emerald-50 rounded-xl flex items-center justify-center text-sm font-black text-emerald-600 flex-shrink-0">
        #{index + 1}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-slate-800 truncate">
          {item.deal_name || item.product_name || item.description || 'Hoa hồng giao dịch'}
        </p>
        <p className="text-xs text-slate-400 mt-0.5">
          {item.created_at ? new Date(item.created_at).toLocaleDateString('vi-VN') : '—'}
        </p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-sm font-black text-emerald-600">{fmt(item.amount || item.commission_amount)}</p>
        <div className={`flex items-center gap-0.5 justify-end mt-0.5 ${statusConfig.color}`}>
          <StatusIcon className="w-3 h-3" />
          <span className="text-[10px] font-semibold">{statusConfig.label}</span>
        </div>
      </div>
    </div>
  );
}

export default function MobileIncomePage() {
  const navigate = useNavigate();
  const [data, setData]       = useState(null);
  const [commissions, setCommissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const now = new Date();
        const [incomeRes, kpiRes] = await Promise.allSettled([
          getMyIncomeWithKPI({ year: now.getFullYear(), month: now.getMonth() + 1 }),
          kpiApi.getMyScorecard(null, 'monthly', now.getFullYear(), now.getMonth() + 1),
        ]);
        const income = incomeRes.status === 'fulfilled'
          ? (incomeRes.value?.data?.data || incomeRes.value?.data || incomeRes.value || {})
          : {};
        const kpi = kpiRes.status === 'fulfilled'
          ? (kpiRes.value?.data?.data || kpiRes.value?.data || kpiRes.value || {})
          : {};

        setData({ income, kpi });

        // Commission breakdown
        const breakdown = income?.income?.commission_breakdown
          || income?.breakdowns
          || income?.commissions
          || [];
        setCommissions(Array.isArray(breakdown) ? breakdown : []);
      } catch {}
      setLoading(false);
    })();
  }, []);

  const inc = data?.income?.income || data?.income || {};
  const kpi = data?.kpi?.summary || data?.kpi?.kpi || {};

  return (
    <div className="h-screen bg-[#f1f5f9] flex flex-col overflow-hidden">
      {/* HEADER */}
      <div className="bg-gradient-to-br from-[#064e3b] via-[#065f46] to-[#047857] px-4 pt-12 pb-5 flex-shrink-0">
        <div className="flex items-center gap-3 mb-5">
          <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center active:scale-95">
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
          <div>
            <h1 className="text-white font-bold text-base">Hoa hồng của tôi</h1>
            <p className="text-white/60 text-xs">
              Tháng {new Date().getMonth() + 1} / {new Date().getFullYear()}
            </p>
          </div>
        </div>

        {/* Hero commission */}
        <div className="bg-white/10 rounded-3xl px-5 py-4 text-center">
          <p className="text-white/70 text-xs font-medium">Tổng hoa hồng tháng này</p>
          {loading ? (
            <div className="h-10 bg-white/20 rounded-xl animate-pulse mx-8 mt-2" />
          ) : (
            <p className="text-white text-3xl font-black mt-1">
              {fmt(inc.total_amount || inc.estimated_amount || 0)}
            </p>
          )}
        </div>
      </div>

      {/* STATS */}
      <div className="px-4 mt-4 flex-shrink-0">
        {loading ? (
          <div className="grid grid-cols-3 gap-2">
            {[1,2,3].map(i => <div key={i} className="h-24 bg-white rounded-2xl animate-pulse" />)}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            <StatCard icon={Clock}      label="Chờ duyệt"   value={fmt(inc.pending_approval_amount || 0)} color="text-amber-600"   bg="bg-amber-50"   />
            <StatCard icon={TrendingUp} label="KPI"          value={`${Math.round(kpi.total_score || kpi.overall_achievement || 0)}%`} color="text-blue-600"    bg="bg-blue-50"    />
            <StatCard icon={Star}       label="Bậc thưởng"   value={kpi.bonus_tier || '—'}                color="text-violet-600" bg="bg-violet-50" />
          </div>
        )}
      </div>

      {/* BREAKDOWN LIST */}
      <div className="flex-1 overflow-y-auto px-4 mt-4 pb-24 space-y-2.5">
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Chi tiết giao dịch</p>
        {loading ? (
          Array.from({length: 3}).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-4 animate-pulse flex gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 flex-shrink-0" />
              <div className="flex-1 space-y-2"><div className="h-3 bg-slate-100 rounded w-3/4" /><div className="h-3 bg-slate-100 rounded w-1/2" /></div>
            </div>
          ))
        ) : commissions.length === 0 ? (
          <div className="bg-white rounded-2xl p-6 text-center border border-slate-100">
            <Wallet className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-600">Chưa có giao dịch tháng này</p>
          </div>
        ) : (
          commissions.map((c, i) => <CommissionRow key={c.id || i} item={c} index={i} />)
        )}
      </div>
    </div>
  );
}
