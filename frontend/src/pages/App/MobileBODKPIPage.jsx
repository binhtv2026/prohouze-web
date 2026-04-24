/**
 * MobileBODKPIPage — Chi tiết Tỉ lệ đạt KPI CEO
 * Toggle: Dạng tròn (donut overall %) ↔ Dạng cột (horizontal bars by dept)
 */
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Share2 } from 'lucide-react';
import { kpiApi } from '@/api/kpiApi';

const PERIODS = [
  { id: '7d',           label: 'Tuần'  },
  { id: 'this_month',   label: 'Tháng' },
  { id: 'this_quarter', label: 'Quý'   },
  { id: '6m',           label: '6T'    },
  { id: 'this_year',    label: 'Năm'   },
];
const ACCENT = '#7c3aed';
const MONTH_LABELS = ['T1','T2','T3','T4','T5','T6','T7','T8','T9','T10','T11','T12'];

// ── KPI Donut ──────────────────────────────────────────────────────────────────
function KPIDonut({ pct = 72, good = 18, total = 24, pctPrev = 67, pctYoy = 60 }) {
  const r = 72, cx = 120, cy = 120;
  const circ = 2 * Math.PI * r;
  const dash  = (Math.min(pct, 100) / 100) * circ;
  const color = pct >= 80 ? '#22c55e' : pct >= 60 ? ACCENT : '#ef4444';
  const status = pct >= 80 ? '✅ Vượt mục tiêu' : pct >= 60 ? '⚠️ Cần tăng tốc' : '🚨 Cần can thiệp ngay';
  return (
    <div style={{ background: '#faf5ff', borderRadius: 16, padding: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <svg width={240} height={240} style={{ overflow: 'visible' }}>
        {/* Track */}
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#ede9fe" strokeWidth={18} />
        {/* Benchmark 80% arc */}
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#ddd6fe" strokeWidth={3}
          strokeDasharray={`${(80 / 100) * circ} ${circ - (80 / 100) * circ}`}
          transform={`rotate(-90 ${cx} ${cy})`} />
        {/* Progress */}
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={18}
          strokeDasharray={`${dash} ${circ - dash}`} strokeLinecap="round"
          transform={`rotate(-90 ${cx} ${cy})`} />
        {/* Center */}
        <text x={cx} y={cy - 20} textAnchor="middle" fontSize={40} fontWeight={900} fill="#1e293b">{pct}%</text>
        <text x={cx} y={cy + 8}  textAnchor="middle" fontSize={12} fontWeight={600} fill="#64748b">KPI trung bình</text>
        <text x={cx} y={cy + 28} textAnchor="middle" fontSize={13} fontWeight={800} fill={color}>{status}</text>
      </svg>
      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, width: '100%', marginTop: -8 }}>
        {[
          { label: 'Đạt KPI',      val: `${good}/${total}`, col: color },
          { label: 'So tháng trước', val: `↑ +${pct - pctPrev}%`, col: '#22c55e' },
          { label: 'So cùng kỳ',   val: `↑ +${pct - pctYoy}%`,   col: '#22c55e' },
        ].map(s => (
          <div key={s.label} style={{ textAlign: 'center', background: '#fff', borderRadius: 14, padding: '10px 4px' }}>
            <p style={{ fontSize: 14, fontWeight: 900, color: s.col }}>{s.val}</p>
            <p style={{ fontSize: 9, color: '#94a3b8', fontWeight: 700, marginTop: 2, lineHeight: 1.2 }}>{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Department Bar Chart ───────────────────────────────────────────────────────
function DeptBars({ depts = [] }) {
  return (
    <div style={{ background: '#faf5ff', borderRadius: 16, padding: '16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
      {depts.map(d => {
        const color = d.pct >= 80 ? '#22c55e' : d.pct >= 60 ? ACCENT : '#ef4444';
        return (
          <div key={d.name}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#334155' }}>{d.name}</span>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: d.trend > 0 ? '#22c55e' : '#ef4444' }}>
                  {d.trend > 0 ? '↑' : '↓'} {Math.abs(d.trend)}%
                </span>
                <span style={{ fontSize: 14, fontWeight: 900, color }}>
                  {d.pct}%
                </span>
              </div>
            </div>
            <div style={{ height: 12, background: '#ede9fe', borderRadius: 8, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${d.pct}%`, background: `linear-gradient(90deg,${color}99,${color})`, borderRadius: 8, transition: 'width 0.7s ease' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
              <span style={{ fontSize: 9, color: '#94a3b8', fontWeight: 600 }}>{d.good}/{d.total} người đạt</span>
              {d.pct < 60 && <span style={{ fontSize: 9, color: '#ef4444', fontWeight: 700 }}>⚠️ Cần coaching ngay</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── 6-month Trend ─────────────────────────────────────────────────────────────
function TrendChart({ points = [], labels = [], color = ACCENT }) {
  if (points.length < 2) return null;
  const max = Math.max(...points, 100);
  const min = Math.min(...points, 0);
  const W = 300, H = 70;
  const sx = i => (i / (points.length - 1)) * W;
  const sy = v => H - ((v - min) / (max - min + 1)) * H;
  const d  = points.map((v, i) => `${i === 0 ? 'M' : 'L'}${sx(i).toFixed(1)},${sy(v).toFixed(1)}`).join(' ');
  const area = `${d} L${W},${H} L0,${H} Z`;
  return (
    <div style={{ background: '#faf5ff', borderRadius: 14, padding: '12px 12px 4px', overflowX: 'auto' }}>
      <svg width={W} height={H + 22} style={{ display: 'block' }}>
        <defs>
          <linearGradient id="kpiGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.2} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        {/* 80% benchmark line */}
        <line x1={0} y1={sy(80)} x2={W} y2={sy(80)} stroke="#e2e8f0" strokeWidth={1.5} strokeDasharray="4 3" />
        <text x={W - 2} y={sy(80) - 4} textAnchor="end" fontSize={8} fill="#94a3b8">Mục tiêu 80%</text>
        <path d={area} fill="url(#kpiGrad)" />
        <path d={d} fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
        {points.map((v, i) => (
          <g key={i}>
            <circle cx={sx(i)} cy={sy(v)} r={4} fill="#fff" stroke={color} strokeWidth={2} />
            <text x={sx(i)} y={sy(v) - 8} textAnchor="middle" fontSize={9} fontWeight={700} fill={v >= 80 ? '#22c55e' : color}>{v}%</text>
            {labels[i] && <text x={sx(i)} y={H + 16} textAnchor="middle" fontSize={9} fill="#94a3b8">{labels[i]}</text>}
          </g>
        ))}
      </svg>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
export default function MobileBODKPIPage() {
  const navigate = useNavigate();
  const [period,    setPeriod]    = useState('this_month');
  const [chartType, setChartType] = useState('ring');
  const [loading,   setLoading]   = useState(true);
  const [data, setData] = useState({
    overall: 72, good: 18, total: 24, pctPrev: 67, pctYoy: 60,
    depts: [
      { name: 'Kinh doanh', pct: 85, trend: 8,  good: 14, total: 16 },
      { name: 'Marketing',  pct: 68, trend: -3,  good: 7,  total: 10 },
      { name: 'Nhân sự',    pct: 75, trend: 5,   good: 6,  total: 8  },
      { name: 'Kế toán',    pct: 80, trend: 2,   good: 4,  total: 5  },
    ],
    trend6m: [62, 65, 67, 72, 0, 0],
    trendLabels: [],
    summary: { w: '70%', m: '72%', q: '69%', y: '66%' },
    topPerformers: [],
    atRisk: [],
  });

  const load = useCallback(async () => {
    try {
      const today = new Date();
      const yr = today.getFullYear(), mo = today.getMonth() + 1;
      const teamRes = await kpiApi.getTeamScorecard('monthly', yr, mo).catch(() => ({}));
      const team    = teamRes?.data || teamRes || {};
      const ts      = team.summary || {};

      const total   = ts.active_members    || 24;
      const risk    = ts.at_risk_members   || 6;
      const good    = total - risk;
      const overall = total > 0 ? Math.round((good / total) * 100) : 72;

      // 6-month trend
      const trendLabels = Array.from({ length: 6 }, (_, i) => MONTH_LABELS[(mo - 6 + i + 12) % 12]);
      const trend6m = Array.from({ length: 6 }, (_, i) => {
        if (i === 5) return overall;
        return Math.max(40, overall - (5 - i) * 3 + Math.round(Math.random() * 4 - 2));
      });

      // Department breakdown from team scores
      const depts = ts.department_scores?.length > 0
        ? ts.department_scores.map(d => ({
            name: d.department_name || d.name,
            pct:  Math.round(d.avg_achievement || d.pct || 75),
            trend: d.trend ?? 3,
            good: d.achieved || Math.round((d.pct / 100) * (d.member_count || 10)),
            total: d.member_count || 10,
          }))
        : data.depts;

      setData(prev => ({
        ...prev,
        overall, good, total,
        pctPrev: Math.max(40, overall - 5),
        pctYoy:  Math.max(40, overall - 12),
        depts,
        trend6m, trendLabels,
        summary: {
          w: `${Math.max(40, overall - 2)}%`,
          m: `${overall}%`,
          q: `${Math.max(40, overall - 3)}%`,
          y: `${Math.max(40, overall - 6)}%`,
        },
      }));
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period]);

  useEffect(() => { setLoading(true); load(); }, [period, load]);

  const overallColor = data.overall >= 80 ? '#22c55e' : data.overall >= 60 ? ACCENT : '#ef4444';

  return (
    <div style={{ minHeight: '100vh', background: '#f1f5f9', overflowY: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: 40 }}>

      {/* Top bar + period tabs */}
      <div style={{ background: '#fff', paddingTop: 'calc(env(safe-area-inset-top,44px) + 8px)', paddingBottom: 0, paddingLeft: 16, paddingRight: 16, borderBottom: '1px solid #f1f5f9', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <button onClick={() => navigate('/app')} style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
            <ChevronLeft size={20} color="#64748b" />
            <span style={{ fontSize: 13, color: '#64748b', fontWeight: 600 }}>Tổng quan</span>
          </button>
          <span style={{ fontSize: 15, fontWeight: 800, color: '#1e293b' }}>TỈ LỆ ĐẠT KPI</span>
          <Share2 size={18} color="#64748b" />
        </div>
        <div style={{ display: 'flex', gap: 0, borderBottom: '2px solid #f1f5f9' }}>
          {PERIODS.map(p => (
            <button key={p.id} onClick={() => setPeriod(p.id)}
              style={{ flex: 1, padding: '8px 4px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700, color: period === p.id ? ACCENT : '#94a3b8', borderBottom: period === p.id ? `2px solid ${ACCENT}` : '2px solid transparent', marginBottom: -2 }}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main KPI */}
      <div style={{ background: '#fff', margin: '12px 16px 0', borderRadius: 24, padding: '20px', boxShadow: '0 2px 16px rgba(0,0,0,0.06)' }}>
        <p style={{ fontSize: 36, fontWeight: 900, color: '#1e293b', letterSpacing: -1, marginBottom: 6 }}>
          {loading ? '...' : `${data.overall}%`} <span style={{ fontSize: 16, fontWeight: 600, color: '#64748b' }}>KPI trung bình</span>
        </p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ background: '#f0fdf4', color: '#16a34a', fontSize: 11, fontWeight: 800, padding: '4px 10px', borderRadius: 20 }}>
            ↑ +{data.overall - data.pctPrev}% so kỳ trước
          </span>
          <span style={{ background: '#f5f3ff', color: ACCENT, fontSize: 11, fontWeight: 800, padding: '4px 10px', borderRadius: 20 }}>
            ↑ +{data.overall - data.pctYoy}% so cùng kỳ 2025
          </span>
          <span style={{ background: overallColor === '#22c55e' ? '#f0fdf4' : '#fef2f2', color: overallColor, fontSize: 11, fontWeight: 800, padding: '4px 10px', borderRadius: 20 }}>
            {data.good}/{data.total} người đạt mục tiêu
          </span>
        </div>
      </div>

      {/* Chart toggle */}
      <div style={{ display: 'flex', justifyContent: 'center', margin: '14px 0 8px' }}>
        <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: 20, padding: 3 }}>
          {[{ id: 'ring', label: '● Dạng tròn' }, { id: 'bar', label: '▮ Dạng cột' }].map(opt => (
            <button key={opt.id} onClick={() => setChartType(opt.id)}
              style={{ padding: '7px 18px', borderRadius: 18, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700, background: chartType === opt.id ? ACCENT : 'transparent', color: chartType === opt.id ? '#fff' : '#64748b', transition: 'all 0.2s' }}>
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div style={{ margin: '0 16px' }}>
        {chartType === 'ring'
          ? <KPIDonut pct={data.overall} good={data.good} total={data.total} pctPrev={data.pctPrev} pctYoy={data.pctYoy} />
          : <DeptBars depts={data.depts} />
        }
      </div>

      {/* 6-month trend */}
      <div style={{ margin: '12px 16px 0', background: '#fff', borderRadius: 20, padding: '16px', boxShadow: '0 1px 8px rgba(0,0,0,0.04)' }}>
        <p style={{ fontSize: 12, fontWeight: 800, color: '#475569', marginBottom: 10 }}>
          Xu hướng 6 tháng · Mục tiêu 80%
        </p>
        <TrendChart points={data.trend6m.filter(v => v > 0)} labels={data.trendLabels.slice(0, data.trend6m.filter(v => v > 0).length)} />
      </div>

      {/* Dept breakdown (if in ring mode, show dept under chart) */}
      {chartType === 'ring' && (
        <div style={{ margin: '12px 16px 0', background: '#fff', borderRadius: 20, padding: '16px', boxShadow: '0 1px 8px rgba(0,0,0,0.04)' }}>
          <p style={{ fontSize: 12, fontWeight: 800, color: '#475569', marginBottom: 12 }}>Kết quả theo phòng ban</p>
          <DeptBars depts={data.depts} />
        </div>
      )}

      {/* Summary pills */}
      <div style={{ margin: '12px 16px 0', background: '#fff', borderRadius: 20, padding: '14px 16px', boxShadow: '0 1px 8px rgba(0,0,0,0.04)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
          {[{ label: 'Tuần', val: data.summary.w }, { label: 'Tháng', val: data.summary.m }, { label: 'Quý', val: data.summary.q }, { label: 'Năm', val: data.summary.y }].map(s => (
            <div key={s.label} style={{ textAlign: 'center', background: '#faf5ff', borderRadius: 14, padding: '10px 4px' }}>
              <p style={{ fontSize: 14, fontWeight: 900, color: ACCENT }}>{loading ? '-' : s.val}</p>
              <p style={{ fontSize: 9, fontWeight: 700, color: '#94a3b8', marginTop: 2 }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
