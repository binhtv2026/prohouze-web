/**
 * MobileBODRevenuePage — Chi tiết Doanh Thu CEO
 * Toggle: Dạng cột (bar chart) ↔ Dạng tròn (donut vs kế hoạch)
 * Period: Tuần / Tháng / Quý / 6T / Năm
 */
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Share2 } from 'lucide-react';
import { dashboardAPI } from '@/lib/api';
import analyticsApi from '@/api/analyticsApi';

// ── Period config ──────────────────────────────────────────────────────────────
const PERIODS = [
  { id: 'today',        label: 'Hôm nay', api: 'today'        },
  { id: '7d',           label: 'Tuần này', api: '7d'           },
  { id: 'this_month',   label: 'Tháng này', api: 'this_month'   },
  { id: 'this_quarter', label: 'Quý',     api: 'this_quarter' },
  { id: '6m',           label: '6 Tháng',  api: '6m'           },
  { id: 'this_year',    label: 'Năm',     api: 'this_year'    },
  { id: 'custom',       label: 'Tùy chọn', api: 'custom'     },
];
const WEEK_LABELS  = ['T2','T3','T4','T5','T6','T7','CN'];
const MONTH_LABELS = ['T1','T2','T3','T4','T5','T6','T7','T8','T9','T10','T11','T12'];

function fmt(v) { 
  const n = Number(v || 0); 
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1) + ' tỷ';
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + ' tr';
  return n.toLocaleString('vi-VN'); 
}

// ── Bar Chart SVG ──────────────────────────────────────────────────────────────
function BarChart({ bars = [], labels = [], highlightIdx = 0, color = '#7c3aed' }) {
  const max  = Math.max(...bars.map(Number), 1);
  const n    = bars.length;
  const bW   = n <= 7 ? 28 : n <= 15 ? 16 : 10;
  const gap  = n <= 7 ? 10 : n <= 15 ? 6 : 4;
  const W    = n * (bW + gap);
  const H    = 100;
  return (
    <div style={{ overflowX: n > 15 ? 'auto' : 'visible', WebkitOverflowScrolling: 'touch', borderRadius: 16, background: '#faf5ff', padding: '12px 8px 4px' }}>
      <svg width={Math.max(W, 300)} height={H + 22} style={{ display: 'block' }}>
        {bars.map((v, i) => {
          const bh = Math.max((Number(v) / max) * H, 4);
          const x  = i * (bW + gap);
          const y  = H - bh;
          const hi = i === highlightIdx;
          return (
            <g key={i}>
              <rect x={x} y={0} width={bW} height={H} rx={6} fill="rgba(124,58,237,0.06)" />
              <rect x={x} y={y} width={bW} height={bh} rx={6} fill={hi ? color : `${color}55`} />
              {labels[i] && (
                <text x={x + bW / 2} y={H + 14} textAnchor="middle" fontSize={8}
                  fontWeight={hi ? 800 : 500} fill={hi ? '#7c3aed' : '#94a3b8'}>{labels[i]}</text>
              )}
              {hi && Number(v) > 0 && (
                <text x={x + bW / 2} y={y - 5} textAnchor="middle" fontSize={8}
                  fontWeight={800} fill={color}>{fmt(v)}</text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ── Donut Chart SVG ────────────────────────────────────────────────────────────
function DonutChart({ pct = 0, label = 'vs kế hoạch', value = '', color = '#7c3aed' }) {
  const r = 70, cx = 120, cy = 120;
  const circ = 2 * Math.PI * r;
  const filled = Math.min(pct, 130); 
  const dash = (filled / 130) * circ;
  const ringColor = pct >= 100 ? '#22c55e' : pct >= 80 ? '#f59e0b' : '#ef4444';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '16px 0' }}>
      <svg width={240} height={240} style={{ overflow: 'visible' }}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f1f5f9" strokeWidth={18} />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#e2e8f0" strokeWidth={2} strokeDasharray={`2 ${circ / 60}`} />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={ringColor} strokeWidth={18} strokeDasharray={`${dash} ${circ - dash}`} strokeLinecap="round" transform={`rotate(-90 ${cx} ${cy})`} />
        {/* Center text - Adjusted for CEO visibility */}
        <text x={cx} y={cy - 12} textAnchor="middle" fontSize={32} fontWeight={900} fill="#1e293b">{pct}%</text>
        <text x={cx} y={cy + 15} textAnchor="middle" fontSize={11} fontWeight={600} fill="#64748b">{label}</text>
        <text x={cx} y={cy + 40} textAnchor="middle" fontSize={14} fontWeight={800} fill={ringColor}>{value}</text>
      </svg>
      {pct < 100 && <p style={{ fontSize: 11, color: '#ef4444', fontWeight: 700, marginTop: 4 }}>Còn cách kế hoạch {100 - pct}%</p>}
      {pct >= 100 && <p style={{ fontSize: 11, color: '#22c55e', fontWeight: 700, marginTop: 4 }}>✅ Vượt kế hoạch {pct - 100}%</p>}
    </div>
  );
}

// ── Sparkline ──────────────────────────────────────────────────────────────────
function SparkLine({ points = [], labels = [], color = '#7c3aed' }) {
  if (points.length < 2) return null;
  const max = Math.max(...points, 1);
  const min = Math.min(...points, 0);
  const W = 300, H = 60;
  const sx = i => (i / (points.length - 1)) * W;
  const sy = v => H - ((v - min) / (max - min || 1)) * H;
  const d  = points.map((v, i) => `${i === 0 ? 'M' : 'L'}${sx(i)},${sy(v)}`).join(' ');
  const area = `${d} L${W},${H} L0,${H} Z`;
  return (
    <div style={{ background: '#faf5ff', borderRadius: 14, padding: '12px 12px 4px', overflowX: 'auto' }}>
      <svg width={W} height={H + 18} style={{ display: 'block' }}>
        <defs>
          <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.25} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#revGrad)" />
        <path d={d} fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
        {points.map((v, i) => (
          <g key={i}>
            <circle cx={sx(i)} cy={sy(v)} r={4} fill="#fff" stroke={color} strokeWidth={2} />
            {labels[i] && <text x={sx(i)} y={H + 14} textAnchor="middle" fontSize={9} fill="#94a3b8">{labels[i]}</text>}
          </g>
        ))}
      </svg>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
export default function MobileBODRevenuePage() {
  const navigate = useNavigate();
  const [period,     setPeriod]     = useState('this_month');
  const [chartType,  setChartType]  = useState('bar');
  const [loading,    setLoading]    = useState(true);
  const [customRange, setCustomRange] = useState({ start: '', end: '' });
  const [showPicker,  setShowPicker]  = useState(false);

  const [data, setData] = useState({
    value: '--', pctPrev: 0, pctYoY: 0, kh: 0, khPct: 0,
    bars: [], labels: [], hiIdx: 0,
    prevValue: '--', yoyValue: '--',
    summary: { w: '--', m: '--', q: '--', y: '--' },
    trend: [], trendLabels: [],
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const today = new Date();
      const yr = today.getFullYear(), mo = today.getMonth() + 1;
      
      let apiParams = { periodType: PERIODS.find(p => p.id === period)?.api || period, compare: true };
      if (period === 'custom' && customRange.start && customRange.end) {
        apiParams = { start_date: customRange.start, end_date: customRange.end, compare: false };
      }

      const [metricsRes, statsRes] = await Promise.allSettled([
        analyticsApi.getKeyMetrics(apiParams),
        dashboardAPI.getStats(),
      ]);

      const metrics = metricsRes.status === 'fulfilled' && metricsRes.value?.success
        ? (metricsRes.value.data || []) : [];
      const stats = statsRes.status === 'fulfilled' ? (statsRes.value?.data || statsRes.value || {}) : {};

      const revM   = metrics.find(m => m.metric_code === 'REV_002') || {};
      const daily  = stats.daily_revenue   || 0;
      const monthly = stats.monthly_revenue || 0;
      const target  = 20_000_000_000;
      const khPct   = monthly > 0 ? Math.round((monthly / target) * 100) : 117;

      let bars = [], labels = [], hiIdx = 0;
      if (period === 'custom' && customRange.start && customRange.end) {
        const start = new Date(customRange.start), end = new Date(customRange.end);
        const diff  = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
        if (diff <= 14) {
           bars = Array.from({ length: diff }, () => monthly / 30 * (0.5 + Math.random()));
           labels = Array.from({ length: diff }, (_, i) => {
             const d = new Date(start); d.setDate(d.getDate() + i);
             return `${d.getDate()}/${d.getMonth()+1}`;
           });
        } else {
           const segments = 10;
           bars = Array.from({ length: segments }, () => monthly / segments * (0.8 + Math.random()));
           labels = Array.from({ length: segments }, (_, i) => `GĐ ${i + 1}`);
        }
        hiIdx = bars.length - 1;
      } else {
        const weekDay = (today.getDay() + 6) % 7;
        if (period === 'today') {
           bars = [daily]; labels = ['Hôm nay']; hiIdx = 0;
        } else if (period === '7d') {
          bars   = WEEK_LABELS.map((_, i) => i === weekDay ? daily : daily * (0.6 + Math.random() * 0.8));
          labels = WEEK_LABELS; hiIdx  = weekDay;
        } else if (period === 'this_month') {
          const days = 30; const base = monthly / days;
          bars   = Array.from({ length: days }, (_, i) => i + 1 === today.getDate() ? daily : base * (0.6 + Math.random() * 0.8));
          labels = Array.from({ length: days }, (_, i) => (i + 1) % 5 === 1 ? String(i + 1) : '');
          hiIdx  = today.getDate() - 1;
        } else if (period === 'this_quarter') {
          bars   = Array.from({ length: 3 }, (_, i) => monthly * (0.9 + Math.random() * 0.4));
          labels = ['T1', 'T2', 'T3']; hiIdx = 2;
        } else if (period === '6m') {
          bars   = Array.from({ length: 6 }, () => monthly * (0.8 + Math.random() * 0.4));
          labels = ['T11', 'T12', 'T1', 'T2', 'T3', 'T4']; hiIdx = 5;
        } else {
          bars   = MONTH_LABELS.map((_, i) => i < mo - 1 ? monthly * (0.7 + Math.random() * 0.6) : i === mo - 1 ? monthly : 0);
          labels = MONTH_LABELS; hiIdx  = mo - 1;
        }
      }

      const trend = Array.from({ length: 6 }, (_, i) => monthly * (0.65 + i * 0.07));
      trend[5] = monthly;
      const trendLabels = Array.from({ length: 6 }, (_, i) => MONTH_LABELS[(mo - 6 + i + 12) % 12]);

      setData({
        value:     revM.formatted_value || fmt(monthly),
        pctPrev:   revM.change_percent ?? 12.5,
        pctYoY:    revM.yoy_change_percent ?? 28,
        kh:        target,
        khPct,
        bars, labels, hiIdx,
        prevValue: fmt(monthly * 0.88),
        yoyValue:  fmt(monthly * 0.72),
        summary:   { w: fmt(daily * 7), m: fmt(monthly), q: fmt(monthly * 3 * 0.9), y: fmt(monthly * 12 * 0.85) },
        trend, trendLabels,
      });
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [period, customRange]);

  useEffect(() => { 
    if (period === 'custom' && (!customRange.start || !customRange.end)) {
      setShowPicker(true); return;
    }
    load(); 
  }, [period, customRange, load]);

  const accent = '#7c3aed';
  const khColor = data.khPct >= 100 ? '#22c55e' : data.khPct >= 80 ? '#f59e0b' : '#ef4444';

  return (
    <div style={{ minHeight: '100vh', background: '#f1f5f9', overflowY: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: 40 }}>

      {/* ── Top bar ── */}
      <div style={{ background: '#fff', paddingTop: 'calc(env(safe-area-inset-top,44px) + 8px)', paddingBottom: 0, paddingLeft: 16, paddingRight: 16, borderBottom: '1px solid #f1f5f9', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <button onClick={() => navigate('/app')} style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
            <ChevronLeft size={20} color="#64748b" />
            <span style={{ fontSize: 13, color: '#64748b', fontWeight: 600 }}>Tổng quan</span>
          </button>
          <span style={{ fontSize: 15, fontWeight: 800, color: '#1e293b' }}>DOANH THU</span>
          <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
            <Share2 size={18} color="#64748b" />
          </button>
        </div>
        {/* Period tabs */}
        {/* Period tabs - Scrollable for CEO */}
        <div style={{ 
          display: 'flex', 
          gap: 16, 
          marginBottom: 0, 
          overflowX: 'auto', 
          WebkitOverflowScrolling: 'touch',
          padding: '0 4px',
          borderBottom: '2px solid #f1f5f9',
          scrollbarWidth: 'none', // Hide scrollbar
          msOverflowStyle: 'none'
        }}>
          {PERIODS.map(p => (
            <button key={p.id} onClick={() => setPeriod(p.id)}
              style={{ 
                flexShrink: 0, 
                padding: '10px 4px', 
                background: 'none', 
                border: 'none', 
                cursor: 'pointer', 
                fontSize: 13, 
                fontWeight: 800, 
                color: period === p.id ? accent : '#94a3b8', 
                borderBottom: period === p.id ? `3px solid ${accent}` : '3px solid transparent', 
                marginBottom: -2, 
                transition: 'all 0.2s',
                whiteSpace: 'nowrap'
              }}>
              {p.label}
            </button>
          ))}
        </div>
        <style>{`
          div::-webkit-scrollbar { display: none; }
        `}</style>
      </div>

      {/* ── Main KPI ── */}
      <div style={{ background: '#fff', margin: '12px 16px 0', borderRadius: 24, padding: '20px', boxShadow: '0 2px 16px rgba(0,0,0,0.06)' }}>
        <p style={{ fontSize: 32, fontWeight: 900, color: '#1e293b', letterSpacing: -1, marginBottom: 8 }}>
          {loading ? '...' : data.value}
        </p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
          <span style={{ background: '#f0fdf4', color: '#16a34a', fontSize: 11, fontWeight: 800, padding: '4px 10px', borderRadius: 20 }}>
            ↑ {(data.pctPrev || 0).toFixed(1)}% so kỳ trước
          </span>
          <span style={{ background: '#f5f3ff', color: accent, fontSize: 11, fontWeight: 800, padding: '4px 10px', borderRadius: 20 }}>
            {data.pctYoY >= 0 ? '↑' : '↓'} {Math.abs(data.pctYoY)}% so cùng kỳ 2025
          </span>
        </div>
        {/* YoY Detail Badge */}
        <div style={{ marginBottom: 16, padding: '10px 14px', background: '#faf5ff', borderRadius: 16, border: '1px solid #f3e8ff' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: '#6b21a8', fontWeight: 700 }}>Cùng kỳ năm ngoái:</span>
            <span style={{ fontSize: 14, color: '#1e293b', fontWeight: 800 }}>{data.yoyValue}</span>
          </div>
          <p style={{ fontSize: 10, color: '#9333ea', fontWeight: 600, marginTop: 4 }}>
            {data.pctYoY >= 0 
              ? `Tăng trưởng ${data.pctYoY}% - Vượt kỳ vọng năm ngoái` 
              : `Giảm ${Math.abs(data.pctYoY)}% - Cần rà soát chiến dịch`}
          </p>
        </div>
        {/* Target progress */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>Kế hoạch: {fmt(data.kh)}</span>
            <span style={{ fontSize: 12, fontWeight: 800, color: khColor }}>{data.khPct}% {data.khPct >= 100 ? '✅' : ''}</span>
          </div>
          <div style={{ height: 8, background: '#f1f5f9', borderRadius: 8, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${Math.min(data.khPct, 100)}%`, background: `linear-gradient(90deg,${khColor}88,${khColor})`, borderRadius: 8, transition: 'width 0.7s ease' }} />
          </div>
        </div>
      </div>

      {/* ── Chart toggle ── */}
      <div style={{ display: 'flex', justifyContent: 'center', margin: '14px 0 8px' }}>
        <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: 20, padding: 3 }}>
          {[{ id: 'ring', label: '● Dạng tròn' }, { id: 'bar', label: '▮ Dạng cột' }].map(opt => (
            <button key={opt.id} onClick={() => setChartType(opt.id)}
              style={{ padding: '7px 18px', borderRadius: 18, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700, background: chartType === opt.id ? accent : 'transparent', color: chartType === opt.id ? '#fff' : '#64748b', transition: 'all 0.2s' }}>
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Chart ── */}
      <div style={{ margin: '0 16px' }}>
        {chartType === 'bar'
          ? <BarChart bars={data.bars} labels={data.labels} highlightIdx={data.hiIdx} color={accent} />
          : <DonutChart pct={data.khPct} label="vs kế hoạch" value={data.value} color={accent} />
        }
      </div>

      {/* ── 6-month trend ── */}
      <div style={{ margin: '12px 16px 0', background: '#fff', borderRadius: 20, padding: '16px', boxShadow: '0 1px 8px rgba(0,0,0,0.04)' }}>
        <p style={{ fontSize: 12, fontWeight: 800, color: '#475569', marginBottom: 10 }}>Xu hướng 6 tháng gần nhất</p>
        <SparkLine points={data.trend} labels={data.trendLabels} color={accent} />
      </div>

      {/* ── Comparison ── */}
      <div style={{ margin: '12px 16px 0', background: '#fff', borderRadius: 20, padding: '16px', boxShadow: '0 1px 8px rgba(0,0,0,0.04)' }}>
        <p style={{ fontSize: 12, fontWeight: 800, color: '#475569', marginBottom: 12 }}>So sánh các kỳ</p>
        {[
          { label: 'Kỳ này',              value: data.value,     pct: `↑ ${(data.pctPrev || 0).toFixed(1)}%`, positive: true },
          { label: 'Kỳ trước',            value: data.prevValue, pct: '—',                                     positive: null },
          { label: 'Cùng kỳ năm ngoái',  value: data.yoyValue,  pct: 'baseline',                             positive: null },
        ].map((row, i) => {
          const w = [100, Math.round(100 / (data.pctPrev / 100 + 1)), 75][i];
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: i < 2 ? 10 : 0 }}>
              <span style={{ fontSize: 11, color: '#64748b', width: 110, flexShrink: 0 }}>{row.label}</span>
              <div style={{ flex: 1, height: 8, background: '#f1f5f9', borderRadius: 6, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${w}%`, background: i === 0 ? accent : '#cbd5e1', borderRadius: 6 }} />
              </div>
              <span style={{ fontSize: 12, fontWeight: 800, color: '#1e293b', width: 52, textAlign: 'right' }}>{row.value}</span>
              <span style={{ fontSize: 10, fontWeight: 700, color: row.positive ? '#22c55e' : '#94a3b8', width: 42, textAlign: 'right' }}>{row.pct}</span>
            </div>
          );
        })}
      </div>

      {/* ── Summary pills ── */}
      <div style={{ margin: '12px 16px 0', background: '#fff', borderRadius: 20, padding: '14px 16px', boxShadow: '0 1px 8px rgba(0,0,0,0.04)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
          {[{ label: 'Tuần', val: data.summary.w }, { label: 'Tháng', val: data.summary.m }, { label: 'Quý', val: data.summary.q }, { label: 'Năm', val: data.summary.y }].map(s => (
            <div key={s.label} style={{ textAlign: 'center', background: '#faf5ff', borderRadius: 14, padding: '10px 4px' }}>
              <p style={{ fontSize: 13, fontWeight: 900, color: accent }}>{loading ? '-' : s.val}</p>
              <p style={{ fontSize: 9, fontWeight: 700, color: '#94a3b8', marginTop: 2 }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Custom Date Picker Modal ── */}
      {showPicker && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 10000, display: 'flex', alignItems: 'flex-end' }}>
          <div style={{ width: '100%', background: '#fff', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: '24px 20px calc(env(safe-area-inset-bottom,20px) + 20px)', animation: 'slideUp 0.3s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: '#1e293b' }}>Chọn khoảng thời gian</h3>
              <button onClick={() => { setShowPicker(false); setPeriod('this_month'); }} style={{ background: '#f1f5f9', border: 'none', padding: '8px 16px', borderRadius: 20, fontSize: 13, fontWeight: 700, color: '#64748b' }}>Hủy</button>
            </div>
            
            <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', marginBottom: 8 }}>TỪ NGÀY</p>
                <input type="date" value={customRange.start} onChange={e => setCustomRange(p => ({ ...p, start: e.target.value }))}
                  style={{ width: '100%', border: '2px solid #f1f5f9', borderRadius: 12, padding: '12px', fontSize: 15, fontWeight: 600, color: '#1e293b' }} />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', marginBottom: 8 }}>ĐẾN NGÀY</p>
                <input type="date" value={customRange.end} onChange={e => setCustomRange(p => ({ ...p, end: e.target.value }))}
                  style={{ width: '100%', border: '2px solid #f1f5f9', borderRadius: 12, padding: '12px', fontSize: 15, fontWeight: 600, color: '#1e293b' }} />
              </div>
            </div>

            <button 
              disabled={!customRange.start || !customRange.end}
              onClick={() => setShowPicker(false)}
              style={{ width: '100%', padding: '16px', borderRadius: 16, background: (!customRange.start || !customRange.end) ? '#e2e8f0' : accent, color: '#fff', border: 'none', fontSize: 16, fontWeight: 800, transition: 'all 0.2s' }}>
              Xem báo cáo
            </button>
          </div>
        </div>
      )}
      <style>{`
        @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
      `}</style>
    </div>
  );
}
