/**
 * MobileKPIPage.jsx — KPI cá nhân (Mobile)
 * Route: /sales/kpi
 * APIs: kpiApi.getMyScorecard, kpiApi.getLeaderboard
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Target, Star, TrendingUp, Award, ChevronRight } from 'lucide-react';
import { kpiApi } from '@/api/kpiApi';
import { useAuth } from '@/contexts/AuthContext';

function ProgressBar({ pct, color = 'bg-blue-500' }) {
  return (
    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all ${color}`}
        style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
      />
    </div>
  );
}

function KPIRow({ item }) {
  const pct = Math.round(item.achievement_pct || item.current / item.target * 100 || 0);
  const color = pct >= 100 ? 'bg-emerald-500' : pct >= 80 ? 'bg-blue-500' : pct >= 50 ? 'bg-amber-500' : 'bg-red-400';

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-4 py-3">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-bold text-slate-800">{item.metric_name || item.name || 'Chỉ tiêu'}</p>
        <span className={`text-xs font-black px-2 py-0.5 rounded-full ${pct >= 100 ? 'bg-emerald-50 text-emerald-600' : pct >= 80 ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'}`}>
          {pct}%
        </span>
      </div>
      <ProgressBar pct={pct} color={color} />
      <div className="flex justify-between mt-1.5">
        <span className="text-[11px] text-slate-500">Hiện: {item.current_value ?? item.current ?? '—'}</span>
        <span className="text-[11px] text-slate-400">Mục tiêu: {item.target_value ?? item.target ?? '—'}</span>
      </div>
    </div>
  );
}

export default function MobileKPIPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [data, setData]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const now = new Date();
        const res = await kpiApi.getMyScorecard(
          user?.id, 'monthly', now.getFullYear(), now.getMonth() + 1
        );
        setData(res?.data?.data || res?.data || res || null);
      } catch {}
      setLoading(false);
    })();
  }, [user]);

  const summary = data?.summary || data?.kpi || {};
  const metrics  = data?.metrics || data?.kpis || [];
  const overall  = Math.round(summary.total_score || summary.overall_achievement || 0);
  const tier     = summary.bonus_tier || summary.tier || '—';

  const tierConfig = {
    A: { label: 'Xuất sắc', color: 'text-emerald-600', bg: 'bg-emerald-50' },
    B: { label: 'Khá',       color: 'text-blue-600',    bg: 'bg-blue-50'    },
    C: { label: 'Đạt',       color: 'text-amber-600',   bg: 'bg-amber-50'   },
    D: { label: 'Cần cải thiện', color: 'text-red-500', bg: 'bg-red-50'     },
  }[tier] || { label: tier, color: 'text-slate-600', bg: 'bg-slate-100' };

  return (
    <div className="h-screen bg-[#f1f5f9] flex flex-col overflow-hidden">
      {/* HEADER */}
      <div className="bg-gradient-to-br from-[#1e1b4b] via-[#312e81] to-[#4338ca] px-4 pt-12 pb-5 flex-shrink-0">
        <div className="flex items-center gap-3 mb-5">
          <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center active:scale-95">
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
          <div>
            <h1 className="text-white font-bold text-base">KPI của tôi</h1>
            <p className="text-white/60 text-xs">Tháng {new Date().getMonth() + 1} / {new Date().getFullYear()}</p>
          </div>
        </div>

        {/* Score circle */}
        <div className="flex items-center gap-4 bg-white/10 rounded-3xl px-5 py-4">
          <div className="relative w-20 h-20 flex-shrink-0">
            <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
              <circle cx="40" cy="40" r="32" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="8" />
              <circle cx="40" cy="40" r="32" fill="none" stroke="white" strokeWidth="8"
                strokeDasharray={`${2 * Math.PI * 32}`}
                strokeDashoffset={`${2 * Math.PI * 32 * (1 - overall / 100)}`}
                strokeLinecap="round" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <p className="text-white text-xl font-black leading-none">{loading ? '—' : overall}</p>
              <p className="text-white/60 text-[9px]">%</p>
            </div>
          </div>
          <div>
            <p className="text-white/70 text-xs">Điểm tổng hợp</p>
            <p className="text-white text-2xl font-black">{loading ? '—' : overall}%</p>
            {!loading && (
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${tierConfig.color} ${tierConfig.bg}`}>
                Bậc {tier} — {tierConfig.label}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Metrics list */}
      <div className="flex-1 overflow-y-auto px-4 py-4 pb-24 space-y-2.5">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Các chỉ tiêu</p>
          <button
            onClick={() => navigate('/kpi/leaderboard')}
            className="flex items-center gap-1 text-xs font-semibold text-blue-500"
          >
            Xếp hạng <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {loading ? (
          Array.from({length: 4}).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-4 animate-pulse space-y-2">
              <div className="flex justify-between"><div className="h-3 bg-slate-100 rounded w-1/2" /><div className="h-4 bg-blue-100 rounded w-10" /></div>
              <div className="h-2.5 bg-slate-100 rounded" />
            </div>
          ))
        ) : metrics.length === 0 ? (
          <div className="bg-white rounded-2xl p-6 text-center border border-slate-100">
            <Target className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-600">Chưa có chỉ tiêu tháng này</p>
          </div>
        ) : (
          metrics.map((m, i) => <KPIRow key={m.id || i} item={m} />)
        )}
      </div>
    </div>
  );
}
