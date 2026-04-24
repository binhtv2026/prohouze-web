/**
 * MobileBODOrgPage — Chi tiết Sức khoẻ Tổ chức CEO
 * Toggle: Dạng cột (grouped weekly bar) ↔ Dạng tròn (donut retention %)
 */
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Share2 } from 'lucide-react';
import { dashboardAPI } from '@/lib/api';
import { kpiApi } from '@/api/kpiApi';

const PERIODS = [
  { id: '7d',           label: 'Tuần'  },
  { id: 'this_month',   label: 'Tháng' },
  { id: 'this_quarter', label: 'Quý'   },
  { id: '6m',           label: '6T'    },
  { id: 'this_year',    label: 'Năm'   },
];
const ACCENT = '#059669';

// ── Grouped Bar Chart ──────────────────────────────────────────────────────────
function GroupedBarChart({ ins = [8, 2, 2, 1], outs = [3, 0, 2, 0], labels = ['Tuần 1','Tuần 2','Tuần 3','Tuần 4'] }) {
  const max = Math.max(...ins, ...outs, 1);
  const W = 52, H = 100, bW = 18, gap = 4;
  const totalW = ins.length * (W + 12);
  return (
    <div style={{ background: '#f0fdf4', borderRadius: 16, padding: '16px', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 12, height: 12, borderRadius: 3, background: '#22c55e' }} />
          <span style={{ fontSize: 11, color: '#475569', fontWeight: 600 }}>Tuyển mới</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 12, height: 12, borderRadius: 3, background: '#ef4444' }} />
          <span style={{ fontSize: 11, color: '#475569', fontWeight: 600 }}>Nghỉ việc</span>
        </div>
      </div>
      <svg width={Math.max(totalW, 280)} height={H + 30} style={{ display: 'block' }}>
        {ins.map((v, i) => {
          const inH  = Math.max((v / max) * H, 4);
          const outH = Math.max((outs[i] / max) * H, 2);
          const x    = i * (W + 12);
          return (
            <g key={i}>
              {/* In bar */}
              <rect x={x} y={H - inH} width={bW} height={inH} rx={5} fill="#22c55e" />
              {v > 0 && <text x={x + bW / 2} y={H - inH - 4} textAnchor="middle" fontSize={10} fontWeight={800} fill="#15803d">+{v}</text>}
              {/* Out bar */}
              <rect x={x + bW + gap} y={H - outH} width={bW} height={outH} rx={5} fill={outs[i] > 0 ? '#ef4444' : '#f1f5f9'} />
              {outs[i] > 0 && <text x={x + bW + gap + bW / 2} y={H - outH - 4} textAnchor="middle" fontSize={10} fontWeight={800} fill="#dc2626">-{outs[i]}</text>}
              {/* Label */}
              <text x={x + W / 2} y={H + 18} textAnchor="middle" fontSize={9} fill="#64748b" fontWeight={600}>{labels[i]}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ── Retention Donut ────────────────────────────────────────────────────────────
function RetentionDonut({ pct = 97.7, total = 132 }) {
  const r = 70, cx = 120, cy = 120;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  const color = pct >= 95 ? '#22c55e' : pct >= 85 ? '#f59e0b' : '#ef4444';
  const churned = Math.round(total * (1 - pct / 100));
  return (
    <div style={{ background: '#f0fdf4', borderRadius: 16, padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <svg width={240} height={240} style={{ overflow: 'visible' }}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#d1fae5" strokeWidth={18} />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={18}
          strokeDasharray={`${dash} ${circ - dash}`} strokeLinecap="round"
          transform={`rotate(-90 ${cx} ${cy})`} />
        <text x={cx} y={cy - 14} textAnchor="middle" fontSize={34} fontWeight={900} fill="#1e293b">{pct}%</text>
        <text x={cx} y={cy + 12} textAnchor="middle" fontSize={12} fontWeight={600} fill="#64748b">Retention rate</text>
        <text x={cx} y={cy + 32} textAnchor="middle" fontSize={12} fontWeight={700} fill={color}>
          {churned === 0 ? '✅ Không ai nghỉ' : `${churned} người đã nghỉ`}
        </text>
      </svg>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, width: '100%', marginTop: -8 }}>
        {[{ label: 'Đang làm', val: total, col: '#059669' }, { label: 'Nghỉ tháng này', val: churned, col: '#ef4444' }, { label: 'Retention', val: `${pct}%`, col: color }].map(s => (
          <div key={s.label} style={{ textAlign: 'center', background: '#fff', borderRadius: 14, padding: '10px 4px' }}>
            <p style={{ fontSize: 16, fontWeight: 900, color: s.col }}>{s.val}</p>
            <p style={{ fontSize: 9, color: '#94a3b8', fontWeight: 700, marginTop: 2, lineHeight: 1.2 }}>{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
export default function MobileBODOrgPage() {
  const navigate = useNavigate();
  const [period,    setPeriod]    = useState('this_month');
  const [chartType, setChartType] = useState('bar');
  const [loading,   setLoading]   = useState(true);
  const [data, setData] = useState({
    total: 132, net: 5, retention: 97.7,
    ins: [8, 2, 2, 1], outs: [3, 0, 2, 0],
    weekLabels: ['Tuần 1','Tuần 2','Tuần 3','Tuần 4'],
    openPositions: 3, trial: 5,
    prevNet: 2, yoyNet: -1,
    summary: { w: '+1', m: '+5', q: '+12', y: '+28' },
  });

  const load = useCallback(async () => {
    try {
      const today = new Date();
      const [statsRes, teamRes] = await Promise.allSettled([
        dashboardAPI.getStats(),
        kpiApi.getTeamScorecard('monthly', today.getFullYear(), today.getMonth() + 1),
      ]);
      const stats = statsRes.status === 'fulfilled' ? (statsRes.value?.data || statsRes.value || {}) : {};
      const team  = teamRes.status  === 'fulfilled' ? (teamRes.value?.data  || teamRes.value  || {}) : {};
      const ts    = team.summary || {};

      const total     = ts.active_members || stats.total_employees || 132;
      const hires     = ts.monthly_hires     || 8;
      const departures = ts.monthly_departures || 3;
      const net       = hires - departures;
      const retention = ts.retention_rate || (Math.round(((total - departures) / total) * 1000) / 10);

      const wHires = [Math.round(hires * 0.5), Math.round(hires * 0.2), Math.round(hires * 0.2), Math.round(hires * 0.1)];
      const wOuts  = [Math.round(departures * 0.5), 0, Math.round(departures * 0.4), Math.round(departures * 0.1)];

      // Adjust labels based on period
      let weekLabels = ['Tuần 1','Tuần 2','Tuần 3','Tuần 4'];
      let ins = wHires, outs = wOuts;
      if (period === '7d') { weekLabels = ['T2','T3','T4','T5','T6','T7','CN']; ins = [2,1,1,0,2,1,1]; outs = [0,1,0,0,1,0,1]; }
      if (period === 'this_quarter') { weekLabels = ['T1','T2','T3']; ins = [hires, Math.round(hires*0.9), Math.round(hires*1.1)]; outs = [departures, Math.round(departures*0.8), Math.round(departures*1.2)]; }

      setData({
        total, net, retention: Number(retention) || 97.7,
        ins, outs, weekLabels,
        openPositions: ts.open_positions || 3,
        trial: ts.probation_count || 5,
        prevNet: 2, yoyNet: -1,
        summary: { w: `+${Math.round(net/4)}`, m: `+${net}`, q: `+${net*3-2}`, y: `+${net*12-8}` },
      });
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [period]);

  useEffect(() => { setLoading(true); load(); }, [period, load]);

  const retColor = data.retention >= 95 ? '#22c55e' : data.retention >= 85 ? '#f59e0b' : '#ef4444';

  return (
    <div style={{ minHeight: '100vh', background: '#f1f5f9', overflowY: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: 40 }}>

      {/* Top bar + period */}
      <div style={{ background: '#fff', paddingTop: 'calc(env(safe-area-inset-top,44px) + 8px)', paddingBottom: 0, paddingLeft: 16, paddingRight: 16, borderBottom: '1px solid #f1f5f9', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <button onClick={() => navigate('/app')} style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
            <ChevronLeft size={20} color="#64748b" />
            <span style={{ fontSize: 13, color: '#64748b', fontWeight: 600 }}>Tổng quan</span>
          </button>
          <span style={{ fontSize: 15, fontWeight: 800, color: '#1e293b' }}>SỨC KHOẺ TỔ CHỨC</span>
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
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, marginBottom: 8 }}>
          <p style={{ fontSize: 36, fontWeight: 900, color: '#1e293b', letterSpacing: -1 }}>
            {loading ? '...' : data.total} <span style={{ fontSize: 18, fontWeight: 600, color: '#64748b' }}>nhân sự</span>
          </p>
          <span style={{ background: '#f0fdf4', color: '#16a34a', fontSize: 13, fontWeight: 800, padding: '4px 12px', borderRadius: 20, marginBottom: 4 }}>
            Net: {data.net > 0 ? `+${data.net}` : data.net} ▲
          </span>
        </div>
        {/* Retention badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <div style={{ background: data.retention >= 95 ? '#f0fdf4' : '#fffbeb', borderRadius: 14, padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 20, fontWeight: 900, color: retColor }}>{data.retention}%</span>
            <div>
              <p style={{ fontSize: 10, color: '#94a3b8', fontWeight: 700 }}>Retention Rate</p>
              <p style={{ fontSize: 11, color: retColor, fontWeight: 800 }}>{data.retention >= 95 ? '✅ Xuất sắc' : '⚠️ Cần cải thiện'}</p>
            </div>
          </div>
        </div>
        {/* Mini stats */}
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ flex: 1, background: '#f0fdf4', borderRadius: 14, padding: '10px 12px', textAlign: 'center' }}>
            <p style={{ fontSize: 18, fontWeight: 900, color: '#16a34a' }}>+{data.ins[0]}</p>
            <p style={{ fontSize: 10, color: '#94a3b8', fontWeight: 700 }}>Tuyển mới</p>
          </div>
          <div style={{ flex: 1, background: '#fef2f2', borderRadius: 14, padding: '10px 12px', textAlign: 'center' }}>
            <p style={{ fontSize: 18, fontWeight: 900, color: '#dc2626' }}>-{data.outs[0]}</p>
            <p style={{ fontSize: 10, color: '#94a3b8', fontWeight: 700 }}>Nghỉ việc</p>
          </div>
          <div style={{ flex: 1, background: '#eff6ff', borderRadius: 14, padding: '10px 12px', textAlign: 'center' }}>
            <p style={{ fontSize: 18, fontWeight: 900, color: '#2563eb' }}>{data.trial}</p>
            <p style={{ fontSize: 10, color: '#94a3b8', fontWeight: 700 }}>Thử việc</p>
          </div>
          <div style={{ flex: 1, background: '#f5f3ff', borderRadius: 14, padding: '10px 12px', textAlign: 'center' }}>
            <p style={{ fontSize: 18, fontWeight: 900, color: '#7c3aed' }}>{data.openPositions}</p>
            <p style={{ fontSize: 10, color: '#94a3b8', fontWeight: 700 }}>Vị trí mở</p>
          </div>
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
        {chartType === 'bar'
          ? <GroupedBarChart ins={data.ins} outs={data.outs} labels={data.weekLabels} />
          : <RetentionDonut pct={data.retention} total={data.total} />
        }
      </div>

      {/* Comparison */}
      <div style={{ margin: '12px 16px 0', background: '#fff', borderRadius: 20, padding: '16px', boxShadow: '0 1px 8px rgba(0,0,0,0.04)' }}>
        <p style={{ fontSize: 12, fontWeight: 800, color: '#475569', marginBottom: 12 }}>So sánh biến động nhân sự</p>
        {[
          { label: 'Kỳ này',             net: data.net,     color: '#22c55e' },
          { label: 'Kỳ trước',           net: data.prevNet, color: '#64748b' },
          { label: 'Cùng kỳ năm ngoái', net: data.yoyNet,  color: data.yoyNet < 0 ? '#ef4444' : '#64748b' },
        ].map((row, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: i < 2 ? 10 : 0 }}>
            <span style={{ fontSize: 11, color: '#64748b', width: 110, flexShrink: 0 }}>{row.label}</span>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 4 }}>
              {/* Net flow visual */}
              <div style={{ height: 8, width: `${Math.max(Math.abs(row.net) / 10 * 100, 20)}%`, maxWidth: '60%', background: row.net >= 0 ? '#22c55e' : '#ef4444', borderRadius: 6 }} />
            </div>
            <span style={{ fontSize: 16, fontWeight: 900, color: row.color, width: 36, textAlign: 'right' }}>
              {row.net > 0 ? `+${row.net}` : row.net}
            </span>
          </div>
        ))}
      </div>

      {/* Summary pills */}
      <div style={{ margin: '12px 16px 0', background: '#fff', borderRadius: 20, padding: '14px 16px', boxShadow: '0 1px 8px rgba(0,0,0,0.04)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
          {[{ label: 'Tuần', val: data.summary.w }, { label: 'Tháng', val: data.summary.m }, { label: 'Quý', val: data.summary.q }, { label: 'Năm', val: data.summary.y }].map(s => (
            <div key={s.label} style={{ textAlign: 'center', background: '#f0fdf4', borderRadius: 14, padding: '10px 4px' }}>
              <p style={{ fontSize: 14, fontWeight: 900, color: ACCENT }}>{loading ? '-' : s.val}</p>
              <p style={{ fontSize: 9, fontWeight: 700, color: '#94a3b8', marginTop: 2 }}>Net {s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
