/**
 * TeamKPIPage — Đội nhóm (CEO Mobile)
 * Color: Đồng bộ tab "Tôi" — light bg + ProHouze teal #316585
 */
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft, RefreshCw, Users, Zap, AlertCircle, DollarSign,
  Trophy, Crown, Medal, Shield, Gem, Bell,
} from 'lucide-react';
import { kpiApi } from '../../api/kpiApi';

// ─── Design tokens (match tab "Tôi") ─────────────────────────────────────────
const C = {
  primary:   '#316585',          // ProHouze brand teal
  primaryDk: '#1e4a6e',          // darker teal (header gradient)
  primaryLt: '#e8f1f7',          // light teal tint
  bg:        '#f0f4f7',          // page background
  card:      '#ffffff',          // card background
  border:    '#e2e8f0',          // card border
  text:      '#1e293b',          // primary text
  sub:       '#64748b',          // secondary text
  muted:     '#94a3b8',          // muted text
  green:     '#16a34a',
  red:       '#dc2626',
  amber:     '#d97706',
  greenBg:   '#f0fdf4',
  redBg:     '#fef2f2',
  amberBg:   '#fffbeb',
};

const fmt = (n) => {
  if (!n) return '0 đ';
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)} tỷ`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(0)} tr`;
  return new Intl.NumberFormat('vi-VN').format(n) + ' đ';
};

const LEVEL = {
  diamond: { icon: Gem,    color: '#0891b2', label: 'Kim cương', bg: '#e0f7fa' },
  gold:    { icon: Crown,  color: '#d97706', label: 'Vàng',      bg: '#fffbeb' },
  silver:  { icon: Medal,  color: '#64748b', label: 'Bạc',       bg: '#f1f5f9' },
  bronze:  { icon: Shield, color: '#b45309', label: 'Đồng',      bg: '#fef3c7' },
};

const PERIODS = [
  { id: 'today',        label: 'Hôm nay'   },
  { id: '7d',           label: 'Tuần này'  },
  { id: 'this_month',   label: 'Tháng này' },
  { id: 'this_quarter', label: 'Quý'       },
  { id: '6m',           label: '6 Tháng'   },
  { id: 'this_year',    label: 'Năm'       },
];

const DEMO = {
  team_name: 'Team Rivera',
  period_label: 'Tháng 3/2026',
  total_users: 8,
  active_count: 6,
  lazy_count: 2,
  summary: { total_revenue: 7850000000, avg_score: 84.6 },
  leaderboard: [
    { user_id: '1', user_name: 'Nguyễn Minh Anh', level: 'gold',    score: 96.2, revenue: 2350000000, deals: 4, calls: 42, status: 'active' },
    { user_id: '2', user_name: 'Trần Quốc Huy',   level: 'silver',  score: 88.7, revenue: 1810000000, deals: 3, calls: 35, status: 'active' },
    { user_id: '3', user_name: 'Lê Thanh Hà',     level: 'bronze',  score: 82.4, revenue: 1540000000, deals: 2, calls: 28, status: 'active' },
    { user_id: '4', user_name: 'Vũ Hoàng Nam',    level: 'silver',  score: 79.1, revenue: 980000000,  deals: 2, calls: 20, status: 'active' },
    { user_id: '5', user_name: 'Đỗ Thị Mai',      level: 'bronze',  score: 71.3, revenue: 720000000,  deals: 1, calls: 18, status: 'active' },
    { user_id: '6', user_name: 'Ngô Bá Khá',      level: 'bronze',  score: 64.5, revenue: 450000000,  deals: 1, calls: 15, status: 'active' },
    { user_id: '7', user_name: 'Phạm Hoài Nam',   level: 'bronze',  score: 41.2, revenue: 220000000,  deals: 0, calls: 4,  status: 'lazy'   },
    { user_id: '8', user_name: 'Bùi Thị Thảo',    level: 'bronze',  score: 32.8, revenue: 0,          deals: 0, calls: 1,  status: 'lazy'   },
  ],
  alerts: [
    { id: 'a1', message: '2 lead nóng chưa cập nhật trong 24h', severity: 'high'   },
    { id: 'a2', message: '1 thành viên có KPI dưới 50%',         severity: 'medium' },
  ],
};

// ─── Mini Donut (sáng) ────────────────────────────────────────────────────────
function MiniDonut({ pct = 85, color = C.primary, size = 76 }) {
  const r = (size - 12) / 2, cx = size / 2, cy = size / 2;
  const circ = 2 * Math.PI * r;
  const dash = (Math.min(pct, 100) / 100) * circ;
  return (
    <svg width={size} height={size}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={C.primaryLt} strokeWidth={9} />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={9}
        strokeDasharray={`${dash} ${circ - dash}`} strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cy})`} />
      <text x={cx} y={cy + 6} textAnchor="middle" fontSize={15} fontWeight={900} fill={color}>{pct}%</text>
    </svg>
  );
}

// ─── Rank Badge ───────────────────────────────────────────────────────────────
function RankBadge({ rank }) {
  if (rank === 1) return <span style={{ fontSize: 18 }}>🥇</span>;
  if (rank === 2) return <span style={{ fontSize: 18 }}>🥈</span>;
  if (rank === 3) return <span style={{ fontSize: 18 }}>🥉</span>;
  return (
    <div style={{ width: 26, height: 26, borderRadius: 13, background: C.border,
      display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ fontSize: 11, fontWeight: 800, color: C.muted }}>{rank}</span>
    </div>
  );
}

// ─── Member Card (clickable) ─────────────────────────────────────────────────
function MemberCard({ member, rank, onTap, onRemind }) {
  const lvl = LEVEL[member.level] || LEVEL.bronze;
  const LvlIcon = lvl.icon;
  const isLazy = member.status === 'lazy' || member.score < 50;
  const scoreColor = member.score >= 80 ? C.green : member.score >= 60 ? C.primary : member.score >= 40 ? C.amber : C.red;
  const initial = (member.user_name || '?').split(' ').pop()[0];

  return (
    <div
      onClick={onTap}
      style={{
        background: isLazy ? '#fff5f5' : C.card,
        border: `1px solid ${isLazy ? '#fecaca' : C.border}`,
        borderRadius: 14, padding: '12px 14px', marginBottom: 8,
        display: 'flex', alignItems: 'center', gap: 10,
        cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
        transition: 'transform 0.1s',
        active: { transform: 'scale(0.98)' },
      }}
    >
      <RankBadge rank={rank} />

      {/* Avatar */}
      <div style={{
        width: 38, height: 38, borderRadius: 19, flexShrink: 0,
        background: isLazy ? '#fecaca' : lvl.bg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{ fontSize: 15, fontWeight: 900, color: isLazy ? C.red : lvl.color }}>{initial}</span>
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
          <span style={{ fontSize: 13, fontWeight: 800, color: C.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 120 }}>
            {member.user_name}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 3, background: lvl.bg, borderRadius: 8, padding: '1px 6px', flexShrink: 0 }}>
            <LvlIcon size={9} color={lvl.color} />
            <span style={{ fontSize: 9, fontWeight: 700, color: lvl.color }}>{lvl.label}</span>
          </div>
          {isLazy && <span style={{ fontSize: 9, fontWeight: 800, color: C.red, background: C.redBg, padding: '1px 6px', borderRadius: 8 }}>⚠ Lười</span>}
        </div>

        {/* Progress */}
        <div style={{ height: 5, background: C.border, borderRadius: 4, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${Math.min(member.score, 100)}%`, background: scoreColor, borderRadius: 4, transition: 'width 0.6s ease' }} />
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 5 }}>
          <span style={{ fontSize: 10, color: C.muted, fontWeight: 600 }}>📞 {member.calls || 0}</span>
          <span style={{ fontSize: 10, color: C.muted, fontWeight: 600 }}>📄 {member.deals || 0} HĐ</span>
          <span style={{ fontSize: 10, color: C.primary, fontWeight: 700 }}>{fmt(member.revenue)}</span>
        </div>
      </div>

      {/* Right: Score + action */}
      <div style={{ textAlign: 'right', flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 900, color: scoreColor, lineHeight: 1 }}>{member.score?.toFixed(0)}</div>
          <div style={{ fontSize: 9, color: C.muted, fontWeight: 700, marginTop: 2 }}>điểm</div>
        </div>
        {isLazy ? (
          <button
            onClick={(e) => { e.stopPropagation(); onRemind?.(member); }}
            style={{ fontSize: 10, fontWeight: 800, color: C.red, background: C.redBg, border: `1px solid #fecaca`, borderRadius: 8, padding: '3px 8px', cursor: 'pointer' }}
          >
            Nhắc
          </button>
        ) : (
          <div style={{ fontSize: 9, color: C.green, fontWeight: 700 }}>✓ Active</div>
        )}
      </div>
    </div>
  );
}


// ══════════════════════════════════════════════════════════════════════════════
export default function TeamKPIPage() {
  const navigate = useNavigate();
  const [period,      setPeriod]      = useState('this_month');
  const [loading,     setLoading]     = useState(true);
  const [refreshing,  setRefreshing]  = useState(false);
  const [data,        setData]        = useState(DEMO);
  const [showPicker,  setShowPicker]  = useState(false);
  const [customRange, setCustomRange] = useState({ start: '', end: '' });
  const [filterTab,   setFilterTab]   = useState('all');    // 'all' | 'active' | 'lazy'
  const [remindTarget, setRemindTarget] = useState(null);   // member object | null

  const load = useCallback(async () => {
    try {
      const now = new Date();
      const [team, enhanced] = await Promise.all([
        kpiApi.getTeamScorecard(period, now.getFullYear(), now.getMonth() + 1).catch(() => null),
        kpiApi.getEnhancedLeaderboard(period, now.getFullYear(), now.getMonth() + 1, 'company', null, 50).catch(() => null),
      ]);
      if (enhanced || team) {
        setData(prev => ({
          ...prev, ...(team || {}), ...(enhanced || {}),
          leaderboard: enhanced?.leaderboard || team?.members || prev.leaderboard,
          summary:     enhanced?.summary     || team?.summary  || prev.summary,
        }));
      }
    } catch { /* use demo */ }
    finally { setLoading(false); setRefreshing(false); }
  }, [period]);

  useEffect(() => {
    if (period === 'custom' && (!customRange.start || !customRange.end)) { setShowPicker(true); return; }
    setLoading(true); load();
  }, [period, customRange, load]);

  const members      = data.leaderboard || [];
  const activeCount  = data.active_count || members.filter(m => m.status !== 'lazy' && m.score >= 50).length;
  const lazyCount    = data.lazy_count   || members.filter(m => m.status === 'lazy'  || m.score < 50).length;
  const avgScore     = data.summary?.avg_score || 84.6;
  const totalRev     = data.summary?.total_revenue || 0;
  const scoreColor   = avgScore >= 80 ? C.green : avgScore >= 60 ? C.primary : C.red;

  const filteredMembers = filterTab === 'active'
    ? members.filter(m => m.score >= 50 && m.status !== 'lazy')
    : filterTab === 'lazy'
    ? members.filter(m => m.score < 50 || m.status === 'lazy')
    : members;

  return (
    <div style={{ minHeight: '100vh', background: C.bg, overflowY: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: 90 }}>

      {/* ── Sticky Header — same teal as "Tôi" ─── */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: `linear-gradient(135deg, ${C.primaryDk} 0%, ${C.primary} 100%)`,
        paddingTop: 'calc(env(safe-area-inset-top, 44px) + 8px)',
        paddingBottom: 0,
        boxShadow: '0 2px 12px rgba(49,101,133,0.3)',
      }}>
        {/* Top bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px 12px' }}>
          <button onClick={() => navigate(-1)} style={{
            background: 'rgba(255,255,255,0.15)', border: 'none', cursor: 'pointer',
            borderRadius: 12, padding: '7px 12px', display: 'flex', alignItems: 'center', gap: 4
          }}>
            <ChevronLeft size={17} color="#fff" />
            <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>Quay lại</span>
          </button>

          <span style={{ fontSize: 16, fontWeight: 900, color: '#fff', letterSpacing: 0.5 }}>ĐỘI NHÓM</span>

          <button onClick={() => { setRefreshing(true); load(); }}
            style={{ background: 'rgba(255,255,255,0.15)', border: 'none', cursor: 'pointer', borderRadius: 12, padding: 8 }}>
            <RefreshCw size={17} color="#fff" style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
          </button>
        </div>

        {/* Period tabs — white text on teal */}
        <div style={{ display: 'flex', overflowX: 'auto', padding: '0 16px', gap: 2, scrollbarWidth: 'none' }}>
          {PERIODS.map(p => (
            <button key={p.id} onClick={() => setPeriod(p.id)} style={{
              flexShrink: 0, padding: '9px 14px', border: 'none', cursor: 'pointer',
              fontSize: 12, fontWeight: 700, transition: 'all 0.2s',
              background: period === p.id ? '#fff' : 'transparent',
              color:      period === p.id ? C.primary : 'rgba(255,255,255,0.7)',
              borderRadius: period === p.id ? '12px 12px 0 0' : 8,
              marginBottom: period === p.id ? 0 : 4,
            }}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Content ─────────────────────────────────────────────── */}
      <div style={{ padding: '16px 16px 0' }}>

        {/* Team name + period */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 22, fontWeight: 900, color: C.text }}>{data.team_name || 'Sales Team'}</div>
          <div style={{ fontSize: 12, color: C.sub, fontWeight: 600, marginTop: 2 }}>{data.period_label}</div>
        </div>

        {/* ── KPI Hero card ─── */}
        <div style={{
          background: C.card, border: `1px solid ${C.border}`, borderRadius: 18,
          padding: 16, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 14,
          boxShadow: '0 2px 12px rgba(49,101,133,0.08)',
        }}>
          <MiniDonut pct={Math.round(avgScore)} color={scoreColor} size={80} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: C.muted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 }}>KPI trung bình team</div>
            <div style={{ fontSize: 30, fontWeight: 900, color: C.text, lineHeight: 1 }}>{avgScore.toFixed(1)}%</div>
            <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
              <span style={{ background: C.greenBg, color: C.green, fontSize: 10, fontWeight: 800, padding: '3px 8px', borderRadius: 10 }}>
                ✓ {activeCount} đang làm việc
              </span>
              {lazyCount > 0 && (
                <span style={{ background: C.redBg, color: C.red, fontSize: 10, fontWeight: 800, padding: '3px 8px', borderRadius: 10 }}>
                  ⚠ {lazyCount} cần nhắc nhở
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ── 4 Stat mini cards (2x2) ─── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
          {[
            { icon: Users,        color: C.primary,  label: 'Thành viên',    val: `${data.total_users || members.length}`, sub: 'tổng'    },
            { icon: Zap,          color: C.green,    label: 'Hoạt động',      val: `${activeCount}`,                        sub: 'người'   },
            { icon: AlertCircle,  color: C.red,      label: 'Lười / Không HĐ',val: `${lazyCount}`,                          sub: 'người'   },
            { icon: DollarSign,   color: C.amber,    label: 'Doanh thu',      val: fmt(totalRev),                           sub: ''        },
          ].map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={i} style={{
                background: C.card, border: `1px solid ${C.border}`, borderRadius: 14,
                padding: '12px 14px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
                  <div style={{ width: 30, height: 30, borderRadius: 9, background: `${s.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={15} color={s.color} />
                  </div>
                  <span style={{ fontSize: 11, color: C.sub, fontWeight: 700 }}>{s.label}</span>
                </div>
                <div style={{ fontSize: 21, fontWeight: 900, color: s.color }}>{loading ? '—' : s.val}</div>
                {s.sub && <div style={{ fontSize: 10, color: C.muted, fontWeight: 600, marginTop: 2 }}>{s.sub}</div>}
              </div>
            );
          })}
        </div>

        {/* ── Alerts ─── */}
        {data.alerts?.length > 0 && (
          <div style={{ background: C.card, border: `1px solid #fde68a`, borderRadius: 14, padding: '12px 14px', marginBottom: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <Bell size={15} color={C.amber} />
              <span style={{ fontSize: 11, fontWeight: 800, color: C.sub, textTransform: 'uppercase', letterSpacing: 0.6 }}>Cảnh báo · {data.alerts.length}</span>
            </div>
            {data.alerts.slice(0, 3).map((a, i) => (
              <div key={a.id || i} style={{
                background: a.severity === 'high' ? C.redBg : C.amberBg,
                borderRadius: 10, padding: '9px 12px', marginBottom: 6,
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <span style={{ fontSize: 14 }}>{a.severity === 'high' ? '🚨' : '⚠️'}</span>
                <span style={{ fontSize: 13, color: C.text, fontWeight: 600 }}>{a.message || a.title}</span>
              </div>
            ))}
          </div>
        )}

        {/* ── Leaderboard ─── */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: '14px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Trophy size={15} color={C.amber} />
              <span style={{ fontSize: 11, fontWeight: 800, color: C.sub, textTransform: 'uppercase', letterSpacing: 0.6 }}>Danh sách đội nhóm</span>
            </div>
            <span style={{ fontSize: 11, color: C.muted, fontWeight: 700 }}>{members.length} thành viên</span>
          </div>

          {/* Filter tabs */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
            {[
              { id: 'all',    label: `Tất cả (${members.length})` },
              { id: 'active', label: `Đang HĐ (${activeCount})`, color: C.green },
              { id: 'lazy',   label: `Cần hỗ trợ (${lazyCount})`, color: C.red },
            ].map(tab => (
              <button key={tab.id} onClick={() => setFilterTab(tab.id)}
                style={{
                  padding: '5px 12px', borderRadius: 20, border: 'none', cursor: 'pointer',
                  fontSize: 11, fontWeight: 800, transition: 'all 0.2s',
                  background: filterTab === tab.id
                    ? (tab.color ? `${tab.color}15` : C.primaryLt)
                    : '#f8fafc',
                  color: filterTab === tab.id
                    ? (tab.color || C.primary)
                    : C.muted,
                  outline: filterTab === tab.id ? `1.5px solid ${tab.color || C.primary}` : 'none',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 28 }}>
              <div style={{ width: 28, height: 28, borderRadius: 14, border: `3px solid ${C.primary}`, borderTopColor: 'transparent', animation: 'spin 1s linear infinite' }} />
            </div>
          ) : filteredMembers.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px 0', color: C.muted, fontSize: 13, fontWeight: 600 }}>
              Không có thành viên nào
            </div>
          ) : (
            filteredMembers.map((m, i) => (
              <MemberCard
                key={m.user_id || i}
                member={m}
                rank={members.indexOf(m) + 1}
                onTap={() => navigate(`/kpi/team/member/${m.user_id}`, { state: { member: m } })}
                onRemind={(member) => setRemindTarget(member)}
              />
            ))
          )}
        </div>

        {/* ── Level legend ─── */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: '10px 14px', display: 'flex', flexWrap: 'wrap', gap: '6px 16px' }}>
          {Object.entries(LEVEL).map(([k, v]) => {
            const Icon = v.icon;
            return (
              <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Icon size={11} color={v.color} />
                <span style={{ fontSize: 11, color: v.color, fontWeight: 700 }}>{v.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Remind Modal ── */}
      {remindTarget && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9998, display: 'flex', alignItems: 'flex-end' }}
          onClick={() => setRemindTarget(null)}>
          <div style={{ width: '100%', background: '#fff', borderRadius: '24px 24px 0 0', padding: '24px 20px', paddingBottom: 'calc(env(safe-area-inset-bottom,20px) + 20px)' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ width: 36, height: 4, borderRadius: 2, background: '#e2e8f0', margin: '0 auto 20px' }} />
            <p style={{ fontSize: 16, fontWeight: 900, color: C.text, marginBottom: 4 }}>Nhắc nhở: {remindTarget.user_name}</p>
            <p style={{ fontSize: 12, color: C.muted, marginBottom: 20 }}>KPI hiện tại: {remindTarget.score?.toFixed(0)} điểm</p>
            {[
              { label: '📞 Gọi trực tiếp', action: () => { window.open(`tel:${remindTarget.phone || ''}`); setRemindTarget(null); }, color: C.primary },
              { label: '💬 Nhắn tin nội bộ', action: () => { navigate('/app/inside'); setRemindTarget(null); }, color: '#7c3aed' },
              { label: '📋 Giao việc cụ thể', action: () => { navigate(`/kpi/team/member/${remindTarget.user_id}`, { state: { member: remindTarget } }); setRemindTarget(null); }, color: C.amber },
            ].map((btn, i) => (
              <button key={i} onClick={btn.action}
                style={{ width: '100%', padding: '14px', borderRadius: 14, border: 'none', cursor: 'pointer', background: `${btn.color}12`, color: btn.color, fontSize: 14, fontWeight: 800, marginBottom: 8, textAlign: 'left' }}>
                {btn.label}
              </button>
            ))}
            <button onClick={() => setRemindTarget(null)}
              style={{ width: '100%', padding: '13px', borderRadius: 14, background: '#f1f5f9', border: 'none', cursor: 'pointer', color: C.muted, fontSize: 13, fontWeight: 700, marginTop: 4 }}>
              Huỷ
            </button>
          </div>
        </div>
      )}

      {/* ── Custom date picker modal ─── */}
      {showPicker && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'flex-end' }}>
          <div style={{ width: '100%', background: '#fff', borderRadius: '24px 24px 0 0', padding: '24px 20px', paddingBottom: 'calc(env(safe-area-inset-bottom,20px) + 20px)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <span style={{ fontSize: 17, fontWeight: 900, color: C.text }}>Chọn khoảng thời gian</span>
              <button onClick={() => { setShowPicker(false); setPeriod('this_month'); }}
                style={{ background: C.border, border: 'none', cursor: 'pointer', borderRadius: 10, padding: '6px 14px', color: C.sub, fontWeight: 700, fontSize: 13 }}>Hủy</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
              {[{ label: 'TỪ NGÀY', key: 'start' }, { label: 'ĐẾN NGÀY', key: 'end' }].map(f => (
                <div key={f.key}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: C.muted, letterSpacing: 1, marginBottom: 8 }}>{f.label}</div>
                  <input type="date" value={customRange[f.key]}
                    onChange={e => setCustomRange(p => ({ ...p, [f.key]: e.target.value }))}
                    style={{ width: '100%', background: C.bg, border: `1px solid ${C.border}`, borderRadius: 12, padding: '12px', color: C.text, fontWeight: 700, fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
                </div>
              ))}
            </div>
            <button disabled={!customRange.start || !customRange.end} onClick={() => setShowPicker(false)}
              style={{
                width: '100%', padding: '15px', borderRadius: 16, border: 'none', cursor: 'pointer',
                fontWeight: 900, fontSize: 16,
                background: (!customRange.start || !customRange.end) ? C.border : C.primary,
                color: (!customRange.start || !customRange.end) ? C.muted : '#fff',
              }}>
              Xem kết quả đội nhóm
            </button>
          </div>
        </div>
      )}

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}*{-webkit-tap-highlight-color:transparent}`}</style>
    </div>
  );
}
