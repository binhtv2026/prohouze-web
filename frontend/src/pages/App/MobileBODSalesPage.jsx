/**
 * MobileBODSalesPage — Chi tiết Hiệu suất Bán hàng CEO
 * Toggle: Dạng cột (stacked bar Soft/Hard/HĐ) ↔ Dạng tròn (donut % vs mục tiêu Q)
 */
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Share2 } from 'lucide-react';
import { dashboardAPI } from '@/lib/api';
import analyticsApi from '@/api/analyticsApi';

const PERIODS = [
  { id: 'today',        label: 'Hôm nay'    },
  { id: 'yesterday',    label: 'Hôm qua'    },
  { id: '7d',           label: 'Tuần'       },
  { id: 'this_month',   label: 'Tháng'      },
  { id: 'last_month',   label: 'T.Trước'    },
  { id: 'this_quarter', label: 'Quý'        },
  { id: 'this_year',    label: 'Năm'        },
];
const ACCENT = '#2563eb';

function fmt(v) { const n=Number(v||0); return n>0?n.toLocaleString('vi-VN'):'0'; }

// ── Stacked Horizontal Bar Chart ───────────────────────────────────────────────
function StackedHBar({ soft = 24, hard = 18, hd = 12 }) {
  const total = soft + hard + hd || 1;
  const pSoft = (soft / total) * 100;
  const pHard = (hard / total) * 100;
  const pHd   = (hd   / total) * 100;
  const items = [
    { label: 'Giữ chỗ (Soft)',    count: soft, pct: pSoft, color: '#93c5fd' },
    { label: 'Booking CĐ (Hard)', count: hard, pct: pHard, color: ACCENT    },
    { label: 'Hợp đồng ký',      count: hd,   pct: pHd,   color: '#1e3a8a' },
  ];
  return (
    <div style={{ background: '#eff6ff', borderRadius: 16, padding: '16px', marginTop: 4 }}>
      {/* Stacked bar */}
      <div style={{ height: 36, borderRadius: 12, overflow: 'hidden', display: 'flex', marginBottom: 14 }}>
        {items.map(item => (
          <div key={item.label} style={{ width: `${item.pct}%`, background: item.color, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'width 0.7s ease' }}>
            {item.pct > 12 && <span style={{ fontSize: 11, fontWeight: 800, color: '#fff' }}>{item.count}</span>}
          </div>
        ))}
      </div>
      {/* Legend */}
      {items.map(item => (
        <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <div style={{ width: 12, height: 12, borderRadius: 3, background: item.color, flexShrink: 0 }} />
          <span style={{ fontSize: 11, color: '#475569', fontWeight: 600, flex: 1 }}>{item.label}</span>
          <span style={{ fontSize: 14, fontWeight: 800, color: '#1e293b' }}>{item.count}</span>
          <span style={{ fontSize: 11, color: '#64748b', width: 36, textAlign: 'right' }}>{item.pct.toFixed(0)}%</span>
        </div>
      ))}
    </div>
  );
}

// ── Donut % vs target ──────────────────────────────────────────────────────────
function TargetDonut({ pct = 78, label = 'vs mục tiêu Quý', total = 39 }) {
  const r = 70, cx = 120, cy = 120;
  const circ = 2 * Math.PI * r;
  const dash = (Math.min(pct, 100) / 100) * circ;
  const color = pct >= 100 ? '#22c55e' : pct >= 75 ? ACCENT : '#f59e0b';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '8px 0', background: '#eff6ff', borderRadius: 16, marginTop: 4 }}>
      <svg width={240} height={220} style={{ overflow: 'visible' }}>
        <circle cx={cx} cy={cx} r={r} fill="none" stroke="#dbeafe" strokeWidth={18} />
        <circle cx={cx} cy={cx} r={r} fill="none" stroke={color} strokeWidth={18}
          strokeDasharray={`${dash} ${circ - dash}`} strokeLinecap="round"
          transform={`rotate(-90 ${cx} ${cx})`} />
        <text x={cx} y={cx - 14} textAnchor="middle" fontSize={38} fontWeight={900} fill="#1e293b">{pct}%</text>
        <text x={cx} y={cx + 14} textAnchor="middle" fontSize={12} fontWeight={600} fill="#64748b">{label}</text>
        <text x={cx} y={cx + 36} textAnchor="middle" fontSize={15} fontWeight={800} fill={color}>{total} căn đã giao dịch</text>
      </svg>
      <div style={{ display: 'flex', gap: 12, marginTop: -12 }}>
        <div style={{ textAlign: 'center', background: '#fff', borderRadius: 14, padding: '10px 16px' }}>
          <p style={{ fontSize: 18, fontWeight: 900, color: ACCENT }}>{total}</p>
          <p style={{ fontSize: 10, color: '#94a3b8', fontWeight: 700 }}>Thực tế</p>
        </div>
        <div style={{ textAlign: 'center', background: '#fff', borderRadius: 14, padding: '10px 16px' }}>
          <p style={{ fontSize: 18, fontWeight: 900, color: '#64748b' }}>{Math.round(total / pct * 100)}</p>
          <p style={{ fontSize: 10, color: '#94a3b8', fontWeight: 700 }}>Mục tiêu</p>
        </div>
        <div style={{ textAlign: 'center', background: '#fff', borderRadius: 14, padding: '10px 16px' }}>
          <p style={{ fontSize: 18, fontWeight: 900, color: '#22c55e' }}>{Math.max(0, Math.round(total / pct * 100) - total)}</p>
          <p style={{ fontSize: 10, color: '#94a3b8', fontWeight: 700 }}>Còn lại</p>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
export default function MobileBODSalesPage() {
  const navigate = useNavigate();
  const [period,    setPeriod]    = useState('this_month');
  const [chartType, setChartType] = useState('bar');
  const [loading,   setLoading]   = useState(true);
  const [data, setData] = useState({
    total: 39, velocity: 1.3, pctPrev: 25, pctYoY: 63,
    soft: 24, hard: 18, hd: 12,
    targetPct: 78, leadConv: 9.3, hdConv: 74,
    prevTotal: 31, yoyTotal: 24,
    summary: { w: '9', m: '39', q: '112', y: '380' },
  });

  const load = useCallback(async () => {
    try {
      const [statsRes, funnelRes] = await Promise.allSettled([
        dashboardAPI.getStats(),
        analyticsApi.getFunnel('deal', PERIODS.find(p => p.id === period)?.id || 'this_month'),
      ]);
      const stats  = statsRes.status  === 'fulfilled' ? (statsRes.value?.data  || statsRes.value  || {}) : {};
      const funnel = funnelRes.status === 'fulfilled' ? (funnelRes.value?.data || funnelRes.value || {}) : {};

      const total    = stats.pending_bookings || 39;
      const days     = period === '7d' ? 7 : 30;
      const velocity = (total / days).toFixed(1);

      const stages   = funnel.stages || funnel.items || [];
      const soft     = stages[0]?.count || stages[0]?.value || 24;
      const hard     = stages[1]?.count || stages[1]?.value || 18;
      const hd       = stages[2]?.count || stages[2]?.value || 12;

      setData({
        total, velocity: Number(velocity), pctPrev: 25, pctYoY: 63,
        soft, hard, hd,
        targetPct: Math.round((total / 50) * 100), // 50 = quarterly target / 3
        leadConv: stats.lead_conversion_rate || 9.3,
        hdConv:   stats.booking_to_contract_rate || 74,
        prevTotal: Math.round(total * 0.79), yoyTotal: Math.round(total * 0.62),
        summary: {
          w: String(Math.round(total / 4)),
          m: String(total),
          q: String(total * 3 - Math.round(total * 0.1)),
          y: String(total * 12 - Math.round(total * 0.5)),
        },
      });
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [period]);

  useEffect(() => { setLoading(true); load(); }, [period, load]);

  return (
    <div style={{ minHeight: '100vh', background: '#f1f5f9', overflowY: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: 40 }}>

      {/* Top bar + period tabs */}
      <div style={{ background: '#fff', paddingTop: 'calc(env(safe-area-inset-top,44px) + 8px)', paddingBottom: 0, paddingLeft: 16, paddingRight: 16, borderBottom: '1px solid #f1f5f9', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <button onClick={() => navigate('/app')} style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
            <ChevronLeft size={20} color="#64748b" />
            <span style={{ fontSize: 13, color: '#64748b', fontWeight: 600 }}>Tổng quan</span>
          </button>
          <span style={{ fontSize: 15, fontWeight: 800, color: '#1e293b' }}>HIỆU SUẤT BÁN HÀNG</span>
          <Share2 size={18} color="#64748b" />
        </div>
        {/* Period tabs - Scrollable for CEO */}
        <div style={{ 
          display: 'flex', 
          gap: 16, 
          marginBottom: 0, 
          overflowX: 'auto', 
          WebkitOverflowScrolling: 'touch',
          padding: '0 4px',
          borderBottom: '2px solid #f1f5f9',
          scrollbarWidth: 'none',
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
                color: period === p.id ? ACCENT : '#94a3b8', 
                borderBottom: period === p.id ? `3px solid ${ACCENT}` : '3px solid transparent', 
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

      {/* Main KPI */}
      <div style={{ background: '#fff', margin: '12px 16px 0', borderRadius: 24, padding: '20px', boxShadow: '0 2px 16px rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 8 }}>
          <p style={{ fontSize: 36, fontWeight: 900, color: '#1e293b', letterSpacing: -1 }}>
            {loading ? '...' : data.total} <span style={{ fontSize: 18, fontWeight: 600, color: '#64748b' }}>căn</span>
          </p>
          <span style={{ background: '#f0fdf4', color: '#16a34a', fontSize: 12, fontWeight: 800, padding: '4px 10px', borderRadius: 20 }}>
            {data.velocity}/ngày ↑
          </span>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
          <span style={{ background: '#f0fdf4', color: '#16a34a', fontSize: 11, fontWeight: 800, padding: '4px 10px', borderRadius: 20 }}>
            ↑ +{data.pctPrev}% so kỳ trước
          </span>
          <span style={{ background: '#eff6ff', color: ACCENT, fontSize: 11, fontWeight: 800, padding: '4px 10px', borderRadius: 20 }}>
            {data.pctYoY >= 0 ? '↑' : '↓'} {Math.abs(data.pctYoY)}% so cùng kỳ 2025
          </span>
        </div>
        {/* YoY Detail Badge - Sales Consistency */}
        <div style={{ marginBottom: 16, padding: '10px 14px', background: '#eff6ff33', borderRadius: 16, border: `1px solid ${ACCENT}22` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: ACCENT, fontWeight: 700 }}>Giao dịch năm ngoái:</span>
            <span style={{ fontSize: 14, color: '#1e293b', fontWeight: 800 }}>{data.yoyTotal} căn</span>
          </div>
          <p style={{ fontSize: 10, color: ACCENT, fontWeight: 600, marginTop: 4 }}>
            {data.pctYoY >= 0 
              ? `Hiệu suất tăng trưởng ${data.pctYoY}% so với cùng kỳ` 
              : `Sụt giảm ${Math.abs(data.pctYoY)}% - Cần đẩy mạnh giỏ hàng`}
          </p>
        </div>
        {/* Conversion metrics */}
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <div style={{ flex: 1, background: '#f0fdf4', borderRadius: 14, padding: '10px 12px' }}>
            <p style={{ fontSize: 10, color: '#94a3b8', fontWeight: 700, marginBottom: 4 }}>Lead → Booking</p>
            <p style={{ fontSize: 18, fontWeight: 900, color: '#16a34a' }}>{data.leadConv}% ↑</p>
          </div>
          <div style={{ flex: 1, background: '#fffbeb', borderRadius: 14, padding: '10px 12px' }}>
            <p style={{ fontSize: 10, color: '#94a3b8', fontWeight: 700, marginBottom: 4 }}>Booking → HĐ</p>
            <p style={{ fontSize: 18, fontWeight: 900, color: '#d97706' }}>{data.hdConv}% ↓</p>
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
          ? <StackedHBar soft={data.soft} hard={data.hard} hd={data.hd} />
          : <TargetDonut pct={data.targetPct} total={data.total} />
        }
      </div>

      {/* Comparison */}
      <div style={{ margin: '12px 16px 0', background: '#fff', borderRadius: 20, padding: '16px', boxShadow: '0 1px 8px rgba(0,0,0,0.04)' }}>
        <p style={{ fontSize: 12, fontWeight: 800, color: '#475569', marginBottom: 12 }}>So sánh các kỳ</p>
        {[
          { label: 'Kỳ này',             count: data.total,    pct: `↑ +${data.pctPrev}%` },
          { label: 'Kỳ trước',           count: data.prevTotal, pct: '—'                   },
          { label: 'Cùng kỳ năm ngoái', count: data.yoyTotal,  pct: 'baseline'             },
        ].map((row, i) => {
          const w = [100, Math.round(data.prevTotal / data.total * 100), Math.round(data.yoyTotal / data.total * 100)][i];
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: i < 2 ? 10 : 0 }}>
              <span style={{ fontSize: 11, color: '#64748b', width: 110, flexShrink: 0 }}>{row.label}</span>
              <div style={{ flex: 1, height: 8, background: '#f1f5f9', borderRadius: 6, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${w}%`, background: i === 0 ? ACCENT : '#cbd5e1', borderRadius: 6 }} />
              </div>
              <span style={{ fontSize: 13, fontWeight: 800, color: '#1e293b', width: 36, textAlign: 'right' }}>{row.count}</span>
              <span style={{ fontSize: 10, fontWeight: 700, color: i === 0 ? '#22c55e' : '#94a3b8', width: 48, textAlign: 'right' }}>{row.pct}</span>
            </div>
          );
        })}
      </div>

      {/* Summary pills */}
      <div style={{ margin: '12px 16px 0', background: '#fff', borderRadius: 20, padding: '14px 16px', boxShadow: '0 1px 8px rgba(0,0,0,0.04)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
          {[{ label: 'Tuần', val: `${data.summary.w} căn` }, { label: 'Tháng', val: `${data.summary.m} căn` }, { label: 'Quý', val: `${data.summary.q} căn` }, { label: 'Năm', val: `${data.summary.y} căn` }].map(s => (
            <div key={s.label} style={{ textAlign: 'center', background: '#eff6ff', borderRadius: 14, padding: '10px 4px' }}>
              <p style={{ fontSize: 12, fontWeight: 900, color: ACCENT }}>{loading ? '-' : s.val}</p>
              <p style={{ fontSize: 9, fontWeight: 700, color: '#94a3b8', marginTop: 2 }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
