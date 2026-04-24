/**
 * MobileBODHomePage — Tổng quan CEO
 * 1 màn hình đầy đủ: 4 chỉ số tổng hợp dạng 2×2 grid
 * Tap từng card → màn hình chi tiết riêng với biểu đồ lớn
 */
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Bell, RefreshCw, ChevronRight, DollarSign, Building2, Users, Target, LogOut } from 'lucide-react';
import { api } from '@/lib/api';

// ── Constants ──────────────────────────────────────────────────────────────────
const GRADIENT = 'linear-gradient(145deg,#2d1b35 0%,#4a2060 55%,#6b3580 100%)';
const PERIODS = [
  { id: 'this_month',    label: 'Tháng' },
  { id: '7d',            label: 'Tuần'  },
  { id: 'this_quarter',  label: 'Quý'   },
  { id: '6m',            label: '6T'    },
  { id: 'this_year',     label: 'Năm'   },
];

// ── Helpers ────────────────────────────────────────────────────────────────────
function fmt(v) {
  const n = Number(v || 0);
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)} tỷ`;
  if (n >= 1e6)  return `${(n / 1e6).toFixed(0)} tr`;
  return n > 0 ? n.toLocaleString('vi-VN') : '0';
}

// ── Mini Charts ────────────────────────────────────────────────────────────────
function MiniBarChart({ bars = [], color = '#8b5cf6' }) {
  const max = Math.max(...bars.map(Number), 1);
  const bW = 7, gap = 3, H = 28;
  return (
    <svg width={bars.length * (bW + gap)} height={H} style={{ display: 'block' }}>
      {bars.map((v, i) => {
        const bh = Math.max((Number(v) / max) * H, 3);
        return (
          <rect key={i} x={i * (bW + gap)} y={H - bh} width={bW} height={bh}
            rx={2} fill={i === bars.length - 1 ? color : `${color}55`} />
        );
      })}
    </svg>
  );
}

function MiniDonut({ pct = 0, color = '#6366f1' }) {
  const r = 14, cx = 16, cy = 16;
  const circ = 2 * Math.PI * r;
  const dash = (Math.min(pct, 100) / 100) * circ;
  return (
    <svg width={32} height={32}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f1f5f9" strokeWidth={4} />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={4}
        strokeDasharray={`${dash} ${circ - dash}`} strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cy})`} />
      <text x={cx} y={cy + 4} textAnchor="middle" fontSize={7} fontWeight={800} fill="#1e293b">
        {pct}%
      </text>
    </svg>
  );
}

function MiniGroupedBars({ ins = [4, 2, 2, 1], outs = [1, 0, 2, 0] }) {
  const max = Math.max(...ins, ...outs, 1);
  const H = 28;
  return (
    <svg width={56} height={H} style={{ display: 'block' }}>
      {ins.map((v, i) => {
        const inH  = Math.max((v / max) * H, 2);
        const outH = Math.max((outs[i] / max) * H, 2);
        return (
          <g key={i}>
            <rect x={i * 14}     y={H - inH}  width={6} height={inH}  rx={1.5} fill="#22c55e" />
            {outs[i] > 0 && <rect x={i * 14 + 7} y={H - outH} width={6} height={outH} rx={1.5} fill="#ef4444" />}
          </g>
        );
      })}
    </svg>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
export default function MobileBODHomePage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [period,  setPeriod]  = useState('this_month');
  const [loading, setLoading] = useState(true);
  const [refresh, setRefresh] = useState(false);
  const [dataSource, setDataSource] = useState(null); // 'mongodb' | 'fallback' | null

  const [cards, setCards] = useState({
    revenue: { value: '--',    pct: null,  subA: '',    subB: '', bars: [3,4,3,5,4,5,6].map(v=>v*1e8), kh: 0 },
    sales:   { value: '--',    pct: null,  sub: '',     targetPct: 78 },
    org:     { value: '--',    pct: null,  retention: 97.7, ins: [4,2,2,1], outs: [1,0,2,0] },
    kpi:     { value: '--',    pct: null,  good: 18,    total: 24 },
  });

  const load = useCallback(async () => {
    try {
      console.log('🚀 BOD Dashboard load start...');
      const [salesRes, hrRes, finRes] = await Promise.allSettled([
        api.get('/sales/dashboard'),
        api.get('/hr/dashboard'),
        api.get('/finance/kpi'),
      ]);

      const sales = salesRes.status === 'fulfilled' ? (salesRes.value?.data || {}) : {};
      const hr    = hrRes.status   === 'fulfilled' ? (hrRes.value?.data   || {}) : {};
      const fin   = finRes.status   === 'fulfilled' ? (finRes.value?.data   || {}) : {};

      // Track data source — 'mongodb' | 'fallback_*' | 'offline'
      const src = hr.data_source || sales.data_source || 'unknown';
      setDataSource(src === 'unknown' ? 'offline' : src.startsWith('mongodb') ? 'mongodb' : 'fallback');

      // ── REVENUE DEFAULTS (380B) ──────────────────────────────────────────
      const ytd       = sales.total_revenue_ytd || 380000000000;
      const revFactor = { 'this_year': 1, 'this_month': 1/12, '7d': 7/365, 'this_quarter': 0.25, '6m': 0.5 };
      const revValue  = Math.round(ytd * (revFactor[period] || 1/12));
      const khTarget  = { 'this_year': 570e9, 'this_month': 47.5e9, '7d': 11e9, 'this_quarter': 142.5e9, '6m': 285e9 };
      const kh        = Math.round((revValue / (khTarget[period] || 47.5e9)) * 100);

      // ── SALES DEFAULTS ──────────────────────────────────────────────────
      const salesUnits = sales.deals_closed_mtd || 23;
      const convRate   = Math.round((sales.conversion_rate || 0.28) * 100);
      const periodSalesFactor = { 'this_year': 12, '7d': 0.23, 'this_quarter': 3, '6m': 6 };
      const salesDisplay = period === 'this_month' ? salesUnits
        : Math.round(salesUnits * (periodSalesFactor[period] || 1));

      // ── HR DEFAULTS (700 NV) ───────────────────────────────────────────
      const totalEmp    = hr.total_employees    || 700;
      const activeEmp   = hr.active_employees   || (totalEmp * 0.96);
      const kpiScore    = hr.avg_kpi_score      || 78.4;
      const goodMembers = Math.round((kpiScore / 100) * totalEmp);

      // ── FINANCE DEFAULTS ───────────────────────────────────────────────
      const revYoy      = fin.revenue_yoy    || 46.2;
      const netMargin   = fin.net_margin     || 15.2;
      const ebitdaYoy   = fin.ebitda_yoy     || 54.5;

      const daily  = ytd / 365;
      const bars   = Array.from({ length: 7 }, (_, i) => {
        const f = [0.7, 1.1, 0.9, 1.3, 1.0, 0.8, 0.6][i];
        return daily * f;
      });

      setCards({
        revenue: {
          value: fmt(revValue),
          pct:   revYoy,
          subA:  `↑ ${revYoy.toFixed(1)}% so năm trước`,
          subB:  `${kh}% kế hoạch · NM ${netMargin.toFixed(1)}%`,
          bars,
          kh,
        },
        sales: {
          value:     String(salesDisplay),
          pct:       convRate,
          sub:       `${convRate}% chuyển đổi · ${(salesDisplay / 30).toFixed(1)}/ngày`,
          targetPct: convRate,
        },
        org: {
          value:     String(totalEmp),
          pct:       null,
          retention: activeEmp > 0 ? Math.round(activeEmp / totalEmp * 1000) / 10 : 97.7,
          ins:       [Math.max(1, Math.round(totalEmp * 0.06)), 2, 2, 1],
          outs:      [Math.max(1, Math.round(totalEmp * 0.02)), 0, 1, 0],
        },
        kpi: {
          value: `${Math.round(kpiScore)}%`,
          pct:   ebitdaYoy || 5,
          good:  goodMembers,
          total: totalEmp,
        },
      });
    } catch (e) { console.error(e); }
    finally { setLoading(false); setRefresh(false); }
  }, [period]);


  useEffect(() => { setLoading(true); load(); }, [period, load]);

  const name  = user?.full_name?.split(' ').slice(-1)[0] || 'CEO';
  const hour  = new Date().getHours();
  const greet = hour < 12 ? 'Chào buổi sáng' : hour < 18 ? 'Chào buổi chiều' : 'Chào buổi tối';
  const kpiColor = parseInt(cards.kpi.value) >= 80 ? '#059669' : parseInt(cards.kpi.value) >= 60 ? '#d97706' : '#dc2626';

  const METRIC_CARDS = [
    {
      key: 'revenue', label: 'DOANH THU', icon: DollarSign,
      accent: '#7c3aed', bg: '#f5f3ff',
      value: loading ? '...' : cards.revenue.value,
      sub1:  `↑ ${(cards.revenue.pct || 0).toFixed(1)}% so kỳ trước`,
      sub2:  `${cards.revenue.kh}% kế hoạch ✅`,
      chart: <MiniBarChart bars={cards.revenue.bars} color="#7c3aed" />,
      path:  '/app/bod/revenue',
    },
    {
      key: 'sales', label: 'BÁN HÀNG', icon: Building2,
      accent: '#2563eb', bg: '#eff6ff',
      value: loading ? '...' : `${cards.sales.value} căn`,
      sub1:  cards.sales.sub,
      sub2:  `${cards.sales.targetPct}% vs mục tiêu Q`,
      chart: <MiniDonut pct={cards.sales.targetPct} color="#2563eb" />,
      path:  '/app/bod/sales',
    },
    {
      key: 'org', label: 'TỔ CHỨC', icon: Users,
      accent: '#059669', bg: '#f0fdf4',
      value: loading ? '...' : `${cards.org.value} NV`,
      sub1:  `Retention ${cards.org.retention}%`,
      sub2:  `+${(cards.org.ins[0] || 0) - (cards.org.outs[0] || 0)} net tháng này`,
      chart: <MiniGroupedBars ins={cards.org.ins} outs={cards.org.outs} />,
      path:  '/app/bod/org',
    },
    {
      key: 'kpi', label: 'KPI', icon: Target,
      accent: kpiColor, bg: parseInt(cards.kpi.value) >= 80 ? '#f0fdf4' : parseInt(cards.kpi.value) >= 60 ? '#fffbeb' : '#fef2f2',
      value: loading ? '...' : cards.kpi.value,
      sub1:  `↑ ${cards.kpi.pct || 5}% so kỳ trước`,
      sub2:  `${cards.kpi.good}/${cards.kpi.total} người đạt`,
      chart: <MiniDonut pct={parseInt(cards.kpi.value) || 72} color={kpiColor} />,
      path:  '/app/bod/kpi',
    },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#f1f5f9', display: 'flex', flexDirection: 'column', overflowY: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: 104 }}>

      {/* ── HEADER ── */}
      <div style={{ background: GRADIENT, paddingTop: 'calc(env(safe-area-inset-top,44px) + 14px)', paddingBottom: 24, paddingLeft: 20, paddingRight: 20, position: 'relative', overflow: 'hidden', flexShrink: 0 }}>
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          <div style={{ position: 'absolute', top: -60, right: -60, width: 240, height: 240, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', filter: 'blur(50px)' }} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.12)', borderRadius: 20, padding: '5px 12px' }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80', animation: 'pulse 2s infinite' }} />
            <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.9)', letterSpacing: 1.5 }}>TỔNG GIÁM ĐỐC</span>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            {/* Data source badge */}
            {dataSource && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 4,
                background: dataSource === 'mongodb' ? 'rgba(74,222,128,0.2)' : 'rgba(251,191,36,0.2)',
                borderRadius: 12, padding: '3px 8px',
              }}>
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: dataSource === 'mongodb' ? '#4ade80' : '#fbbf24' }} />
                <span style={{ fontSize: 9, fontWeight: 700, color: dataSource === 'mongodb' ? '#4ade80' : dataSource === 'offline' ? '#f87171' : '#fbbf24', letterSpacing: 0.8 }}>
                  {dataSource === 'mongodb' ? 'LIVE' : dataSource === 'offline' ? 'OFFLINE' : 'CACHED'}
                </span>
              </div>
            )}
            <button onClick={() => { setRefresh(true); load(); }} style={{ width: 34, height: 34, borderRadius: 11, background: 'rgba(255,255,255,0.14)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <RefreshCw size={14} color="#fff" style={{ animation: refresh ? 'spin 1s linear infinite' : 'none' }} />
            </button>
            <button onClick={() => navigate('/profile')} style={{ width: 34, height: 34, borderRadius: 11, background: 'rgba(255,255,255,0.14)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <Bell size={14} color="#fff" />
            </button>
          </div>
        </div>

        <div style={{ position: 'relative', zIndex: 1, marginBottom: 16 }}>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.58)', marginBottom: 3, fontWeight: 500 }}>{greet}, {name} 👋</p>
          <h1 style={{ fontSize: 24, fontWeight: 900, color: '#fff', letterSpacing: -0.5, lineHeight: 1.1, marginBottom: 3 }}>Bảng điều hành</h1>
          <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)' }}>
            {new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>

        {/* Period selector */}
        <div style={{ display: 'flex', gap: 8, position: 'relative', zIndex: 1, overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          {PERIODS.map(p => (
            <button key={p.id} onClick={() => setPeriod(p.id)}
              style={{ flexShrink: 0, padding: '6px 16px', borderRadius: 20, border: 'none', cursor: 'pointer', background: period === p.id ? '#fff' : 'rgba(255,255,255,0.14)', color: period === p.id ? '#4a2060' : 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: 800, transition: 'all 0.2s' }}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── 2×2 GRID ── */}
      <div style={{ padding: '20px 16px 0', flexShrink: 0 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {METRIC_CARDS.map(card => {
            const Icon = card.icon;
            return (
              <button key={card.key} onClick={() => navigate(card.path)}
                style={{ background: '#fff', borderRadius: 24, padding: '16px', boxShadow: '0 2px 16px rgba(0,0,0,0.07)', border: '1px solid #f1f5f9', cursor: 'pointer', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 6, transition: 'transform 0.12s', minHeight: 140 }}>
                {/* Top row */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ width: 32, height: 32, borderRadius: 10, background: card.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={16} color={card.accent} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                    <span style={{ fontSize: 9, fontWeight: 700, color: '#94a3b8', letterSpacing: 1 }}>{card.label}</span>
                    <ChevronRight size={11} color="#94a3b8" />
                  </div>
                </div>
                {/* Value */}
                <p style={{ fontSize: 24, fontWeight: 900, color: '#1e293b', letterSpacing: -0.5, lineHeight: 1, margin: 0 }}>{card.value}</p>
                {/* Sub1 */}
                <p style={{ fontSize: 10, color: '#22c55e', fontWeight: 700, margin: 0 }}>{card.sub1}</p>
                {/* Sub2 */}
                <p style={{ fontSize: 10, color: '#64748b', fontWeight: 500, margin: 0 }}>{card.sub2}</p>
                {/* Mini chart */}
                <div style={{ marginTop: 4 }}>{card.chart}</div>
              </button>
            );
          })}
        </div>

        <p style={{ textAlign: 'center', fontSize: 11, color: '#94a3b8', marginTop: 12, fontWeight: 500 }}>
          Nhấn vào từng chỉ số để xem biểu đồ chi tiết ›
        </p>
      </div>

      {/* ── QUICK LINKS ── */}
      <div style={{ padding: '16px 16px 0', flexShrink: 0 }}>
        <p style={{ fontSize: 10, fontWeight: 800, color: '#94a3b8', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 10 }}>Hành động nhanh</p>
        <div style={{ background: '#fff', borderRadius: 20, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', border: '1px solid #f1f5f9' }}>
          {[
            { label: 'Phê duyệt đang chờ',   sub: 'Booking · Chi phí · Hợp đồng', path: '/app/approvals',      tone: '#f59e0b' },
            { label: 'Báo cáo điều hành',     sub: 'Analytics · Bottleneck · Risk', path: '/analytics/executive', tone: '#6366f1' },
            { label: 'Xếp hạng đội nhóm',     sub: 'Top performer · Cần hỗ trợ',   path: '/kpi/leaderboard',    tone: '#0ea5e9' },
          ].map((item, i) => (
            <button key={item.path} onClick={() => navigate(item.path)}
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px', borderBottom: i < 2 ? '1px solid #f8fafc' : 'none', cursor: 'pointer', background: 'none', border: 'none', width: '100%', textAlign: 'left', borderTop: 'none', borderLeft: 'none', borderRight: 'none', borderBottom: i < 2 ? '1px solid #f8fafc' : 'none' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: item.tone, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#334155', margin: 0 }}>{item.label}</p>
                <p style={{ fontSize: 10, color: '#94a3b8', marginTop: 1, margin: 0 }}>{item.sub}</p>
              </div>
              <ChevronRight size={14} color="#94a3b8" />
            </button>
          ))}
        </div>
      </div>

      {/* Logout */}
      <div style={{ padding: '16px 16px 0', flexShrink: 0 }}>
        <button onClick={logout} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', padding: '13px', borderRadius: 18, background: 'transparent', border: '1px solid #e2e8f0', cursor: 'pointer' }}>
          <LogOut size={14} color="#94a3b8" />
          <span style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8' }}>Đăng xuất</span>
        </button>
      </div>

      <style>{`
        @keyframes spin  { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
      `}</style>
    </div>
  );
}
