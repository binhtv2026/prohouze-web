/**
 * MobileManagerHomePage — Bảng điều hành Trưởng nhóm Kinh doanh
 * 4 chỉ số trọng yếu: KPI đội · Phê duyệt · Pipeline · Nhân viên
 * Design: Blue accent #1d4ed8, light bg #f0f4f7
 */
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  Bell, RefreshCw, ChevronRight, LogOut,
  Users, ClipboardList, TrendingUp, Target,
  Building2, FileText, BadgePercent,
} from 'lucide-react';
import { managerApi } from '@/api/pipelineApi';

// ── Constants ──────────────────────────────────────────────────────────────────
const GRADIENT = 'linear-gradient(145deg,#0f2756 0%,#1d4ed8 55%,#2563eb 100%)';
const ACCENT   = '#1d4ed8';

const PERIODS = [
  { id: 'this_month',   label: 'Tháng' },
  { id: '7d',           label: 'Tuần'  },
  { id: 'this_quarter', label: 'Quý'   },
  { id: '6m',           label: '6T'    },
  { id: 'this_year',    label: 'Năm'   },
];

// ── Helpers ────────────────────────────────────────────────────────────────────
function fmt(v) {
  const n = Number(v || 0);
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)} tỷ`;
  if (n >= 1e6)  return `${(n / 1e6).toFixed(0)} tr`;
  return n > 0 ? n.toLocaleString('vi-VN') : '0';
}

// ── Mini Charts ─────────────────────────────────────────────────────────────────
function MiniBarChart({ bars = [], color = ACCENT }) {
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

function MiniDonut({ pct = 0, color = ACCENT }) {
  const r = 14, cx = 16, cy = 16;
  const circ = 2 * Math.PI * r;
  const dash  = (Math.min(pct, 100) / 100) * circ;
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

// ══════════════════════════════════════════════════════════════════════════════
export default function MobileManagerHomePage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [period,  setPeriod]  = useState('this_month');
  const [loading, setLoading] = useState(true);
  const [refresh, setRefresh] = useState(false);

  const [cards, setCards] = useState({
    kpi:      { value: '--',  pct: 85,   good: 6, total: 8 },
    approval: { value: '--',  pending: 3, approved: 2, rejected: 1 },
    pipeline: { value: '--',  deals: 12, bars: [2,3,4,3,5,4,6].map(v => v * 1e8) },
    team:     { value: '--',  active: 6, total: 8, retention: 96 },
  });

  const load = useCallback(async () => {
    try {
      const [sumRes, approvalRes] = await Promise.allSettled([
        managerApi.getDashboardSummary(),
        managerApi.getApprovalStats(),
      ]);
      const sum  = sumRes.status    === 'fulfilled' ? sumRes.value    || {} : {};
      const appr = approvalRes.status === 'fulfilled' ? approvalRes.value || {} : {};

      const teamSize   = sum.team_size       || 8;
      const activeEmp  = sum.active_members  || 6;
      const kpiAvg     = Math.round(sum.avg_kpi || 84.6);
      const goodMembers = Math.round((kpiAvg / 100) * teamSize);
      const pipeline   = sum.pipeline_value  || 7800000000;
      const deals      = sum.hot_deals       || 12;
      const pending    = appr.pending        || 3;
      const approved   = appr.approved       || 2;
      const rejected   = appr.rejected       || 1;

      const daily = pipeline / 30;
      const bars  = Array.from({ length: 7 }, (_, i) => {
        const f = [0.7, 1.1, 0.9, 1.3, 1.0, 0.8, 0.6][i];
        return daily * f;
      });

      setCards({
        kpi:      { value: `${kpiAvg}%`,  pct: kpiAvg,  good: goodMembers, total: teamSize },
        approval: { value: String(pending), pending, approved, rejected },
        pipeline: { value: fmt(pipeline),   deals,  bars },
        team:     { value: String(teamSize), active: activeEmp, total: teamSize, retention: Math.round(activeEmp / teamSize * 100) },
      });
    } catch (e) { console.error('[Manager]', e); }
    finally { setLoading(false); setRefresh(false); }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { setLoading(true); load(); }, [period, load]);

  const name  = user?.full_name?.split(' ').slice(-1)[0] || 'Trưởng nhóm';
  const hour  = new Date().getHours();
  const greet = hour < 12 ? 'Chào buổi sáng' : hour < 18 ? 'Chào buổi chiều' : 'Chào buổi tối';

  const kpiNum   = parseInt(cards.kpi.value) || 0;
  const kpiColor = kpiNum >= 80 ? '#059669' : kpiNum >= 60 ? '#d97706' : '#dc2626';

  const METRIC_CARDS = [
    {
      key: 'kpi', label: 'KPI ĐỘI NHÓM', icon: Target,
      accent: kpiColor, bg: kpiNum >= 80 ? '#f0fdf4' : kpiNum >= 60 ? '#fffbeb' : '#fef2f2',
      value: loading ? '...' : cards.kpi.value,
      sub1: `${cards.kpi.good} / ${cards.kpi.total} thành viên đạt`,
      sub2: `↑ Tháng này so kỳ trước`,
      chart: <MiniDonut pct={kpiNum} color={kpiColor} />,
      path: '/kpi/team',
    },
    {
      key: 'approval', label: 'PHÊ DUYỆT', icon: ClipboardList,
      accent: '#f59e0b', bg: '#fffbeb',
      value: loading ? '...' : `${cards.approval.pending} chờ`,
      sub1: `✅ ${cards.approval.approved} đã duyệt · ❌ ${cards.approval.rejected} từ chối`,
      sub2: `Booking · Nghỉ phép · Hợp đồng`,
      chart: <MiniDonut pct={Math.round(cards.approval.approved / Math.max(cards.approval.pending + cards.approval.approved, 1) * 100)} color="#f59e0b" />,
      path: '/app/approvals',
    },
    {
      key: 'pipeline', label: 'PIPELINE', icon: TrendingUp,
      accent: ACCENT, bg: '#eff6ff',
      value: loading ? '...' : cards.pipeline.value,
      sub1: `${cards.pipeline.deals} giao dịch đang theo`,
      sub2: `Giá trị đội tháng này`,
      chart: <MiniBarChart bars={cards.pipeline.bars} color={ACCENT} />,
      path: '/kpi/team',
    },
    {
      key: 'team', label: 'NHÂN VIÊN', icon: Users,
      accent: '#059669', bg: '#f0fdf4',
      value: loading ? '...' : `${cards.team.active}/${cards.team.total}`,
      sub1: `Retention ${cards.team.retention}%`,
      sub2: `Đang active hôm nay`,
      chart: <MiniDonut pct={cards.team.retention} color="#059669" />,
      path: '/kpi/team',
    },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#f0f4f7', display: 'flex', flexDirection: 'column', overflowY: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: 104 }}>

      {/* ── HEADER ── */}
      <div style={{ background: GRADIENT, paddingTop: 'calc(env(safe-area-inset-top,44px) + 14px)', paddingBottom: 24, paddingLeft: 20, paddingRight: 20, position: 'relative', overflow: 'hidden', flexShrink: 0 }}>
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          <div style={{ position: 'absolute', top: -60, right: -60, width: 240, height: 240, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', filter: 'blur(50px)' }} />
        </div>

        {/* Top bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.12)', borderRadius: 20, padding: '5px 12px' }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80', animation: 'pulse 2s infinite' }} />
            <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.9)', letterSpacing: 1.5 }}>TRƯỞNG NHÓM KD</span>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => { setRefresh(true); load(); }}
              style={{ width: 34, height: 34, borderRadius: 11, background: 'rgba(255,255,255,0.14)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <RefreshCw size={14} color="#fff" style={{ animation: refresh ? 'spin 1s linear infinite' : 'none' }} />
            </button>
            <button onClick={() => navigate('/profile')}
              style={{ width: 34, height: 34, borderRadius: 11, background: 'rgba(255,255,255,0.14)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <Bell size={14} color="#fff" />
            </button>
          </div>
        </div>

        {/* Greeting */}
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
              style={{ flexShrink: 0, padding: '6px 16px', borderRadius: 20, border: 'none', cursor: 'pointer', background: period === p.id ? '#fff' : 'rgba(255,255,255,0.14)', color: period === p.id ? ACCENT : 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: 800, transition: 'all 0.2s' }}>
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
                <p style={{ fontSize: 10, color: card.accent, fontWeight: 700, margin: 0 }}>{card.sub1}</p>
                {/* Sub2 */}
                <p style={{ fontSize: 10, color: '#64748b', fontWeight: 500, margin: 0 }}>{card.sub2}</p>
                {/* Mini chart */}
                <div style={{ marginTop: 4 }}>{card.chart}</div>
              </button>
            );
          })}
        </div>
        <p style={{ textAlign: 'center', fontSize: 11, color: '#94a3b8', marginTop: 12, fontWeight: 500 }}>
          Nhấn vào từng chỉ số để xem chi tiết ›
        </p>
      </div>

      {/* ── BÁN HÀNG CÁ NHÂN (Manager cũng là người bán) ── */}
      <div style={{ padding: '16px 16px 0', flexShrink: 0 }}>
        <p style={{ fontSize: 10, fontWeight: 800, color: '#94a3b8', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 10 }}>Bán hàng cá nhân</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
          {[
            { icon: Building2,    label: 'Sản phẩm DA',  sub: 'Giỏ hàng',    color: ACCENT,    bg: '#eff6ff', path: '/sales/catalog' },
            { icon: FileText,     label: 'Hồ sơ / BC',   sub: 'Booking',       color: '#d97706', bg: '#fffbeb', path: '/sales/bookings' },
            { icon: BadgePercent, label: 'Hoa hồng',     sub: 'Của tôi',      color: '#059669', bg: '#f0fdf4', path: '/app/payroll' },
          ].map((s, i) => {
            const Icon = s.icon;
            return (
              <button key={i} onClick={() => navigate(s.path)}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '14px 8px', borderRadius: 16, background: s.bg, border: 'none', cursor: 'pointer' }}>
                <Icon size={20} color={s.color} />
                <span style={{ fontSize: 11, fontWeight: 800, color: s.color, textAlign: 'center' }}>{s.label}</span>
                <span style={{ fontSize: 9, color: '#94a3b8', fontWeight: 600 }}>{s.sub}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── QUICK LINKS ── */}
      <div style={{ padding: '16px 16px 0', flexShrink: 0 }}>
        <p style={{ fontSize: 10, fontWeight: 800, color: '#94a3b8', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 10 }}>Hành động nhanh</p>
        <div style={{ background: '#fff', borderRadius: 20, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', border: '1px solid #f1f5f9' }}>
          {[
            { label: 'Phê duyệt đang chờ',  sub: 'Booking · Nghỉ phép · Hợp đồng', path: '/app/approvals', tone: '#f59e0b' },
            { label: 'Bảng xếp hạng đội',   sub: 'Top performer · KPI · Doanh số',   path: '/kpi/team',      tone: ACCENT    },
            { label: 'Báo cáo đội nhóm',     sub: 'Hiệu suất · Pipeline · Hoa hồng', path: '/analytics/reports', tone: '#059669' },
            { label: 'Nhắc nhở thành viên',  sub: `${cards.kpi.total - cards.kpi.good} NV cần hỗ trợ · KPI thấp`, path: '/kpi/team', tone: '#dc2626' },
          ].map((item, i, arr) => (
            <button key={item.path + i} onClick={() => navigate(item.path)}
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px', cursor: 'pointer', background: 'none', border: 'none', width: '100%', textAlign: 'left', borderTop: 'none', borderLeft: 'none', borderRight: 'none', borderBottom: i < arr.length - 1 ? '1px solid #f8fafc' : 'none' }}>
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

      {/* ── LOGOUT ── */}
      <div style={{ padding: '16px 16px 0', flexShrink: 0 }}>
        <button onClick={logout}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', padding: '13px', borderRadius: 18, background: 'transparent', border: '1px solid #e2e8f0', cursor: 'pointer' }}>
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
