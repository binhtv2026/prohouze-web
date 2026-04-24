/**
 * MobileTeamMemberDetailPage — Chi tiết từng thành viên đội nhóm
 * Route: /kpi/team/member/:memberId
 * Design: teal #316585, light bg #f0f4f7
 */
import { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import {
  ChevronLeft, Phone, MessageCircle, ClipboardList,
  TrendingUp, Target, DollarSign, Flame, CheckCircle2,
} from 'lucide-react';

// ── Design tokens ───────────────────────────────────────────────────────────
const C = {
  primary:   '#316585',
  primaryDk: '#1e4a6e',
  primaryLt: '#e8f1f7',
  bg:        '#f0f4f7',
  card:      '#ffffff',
  border:    '#e2e8f0',
  text:      '#1e293b',
  sub:       '#64748b',
  muted:     '#94a3b8',
  green:     '#16a34a',
  red:       '#dc2626',
  amber:     '#d97706',
  greenBg:   '#f0fdf4',
  redBg:     '#fef2f2',
  amberBg:   '#fffbeb',
};

const fmt = (n) => {
  if (!n) return '0';
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)} tỷ`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(0)} tr`;
  return new Intl.NumberFormat('vi-VN').format(n);
};

// ── Mock 6-month KPI history ─────────────────────────────────────────────────
function buildHistory(currentScore) {
  const base = currentScore;
  return [
    { month: 'Th11', score: Math.round(base * 0.82) },
    { month: 'Th12', score: Math.round(base * 0.88) },
    { month: 'Th1',  score: Math.round(base * 0.79) },
    { month: 'Th2',  score: Math.round(base * 0.91) },
    { month: 'Th3',  score: Math.round(base * 0.95) },
    { month: 'Th4',  score: Math.round(base) },
  ];
}

// ── Mini Sparkline ───────────────────────────────────────────────────────────
function Sparkline({ data, color = C.primary }) {
  const W = 280, H = 56, pad = 8;
  const scores = data.map(d => d.score);
  const min = Math.min(...scores) - 5;
  const max = Math.max(...scores) + 5;
  const xStep = (W - pad * 2) / (data.length - 1);
  const yOf = (v) => H - pad - ((v - min) / (max - min)) * (H - pad * 2);
  const points = data.map((d, i) => `${pad + i * xStep},${yOf(d.score)}`).join(' ');

  return (
    <svg width={W} height={H} style={{ display: 'block', overflow: 'visible' }}>
      {/* Fill area */}
      <polygon
        points={`${pad},${H} ${points} ${pad + (data.length - 1) * xStep},${H}`}
        fill={`${color}18`}
      />
      {/* Line */}
      <polyline points={points} fill="none" stroke={color} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
      {/* Dots */}
      {data.map((d, i) => (
        <g key={i}>
          <circle cx={pad + i * xStep} cy={yOf(d.score)} r={4} fill={color} />
          <text x={pad + i * xStep} y={H - 2} textAnchor="middle" fontSize={8} fill={C.muted} fontWeight={600}>{d.month}</text>
          <text x={pad + i * xStep} y={yOf(d.score) - 6} textAnchor="middle" fontSize={8} fill={color} fontWeight={800}>{d.score}</text>
        </g>
      ))}
    </svg>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
export default function MobileTeamMemberDetailPage() {
  const navigate  = useNavigate();
  const { memberId } = useParams();
  const { state } = useLocation();

  // Ưu tiên dữ liệu từ navigate state, fallback mock
  const [member, setMember] = useState(state?.member || null);
  const [loading, setLoading] = useState(!state?.member);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignNote, setAssignNote] = useState('');

  useEffect(() => {
    if (state?.member) { setLoading(false); return; }
    // Fallback: nếu navigate trực tiếp không có state → dùng mock
    const mock = {
      user_id:   memberId,
      user_name: 'Thành viên #' + memberId,
      level:     'bronze',
      score:     72,
      revenue:   980000000,
      deals:     2,
      calls:     20,
      status:    'active',
      phone:     '',
      position:  'Chuyên viên Kinh doanh',
    };
    setMember(mock);
    setLoading(false);
  }, [memberId, state]);

  if (loading || !member) {
    return (
      <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 32, height: 32, borderRadius: 16, border: `3px solid ${C.primary}`, borderTopColor: 'transparent', animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  const isLazy = member.score < 50 || member.status === 'lazy';
  const scoreColor = member.score >= 80 ? C.green : member.score >= 60 ? C.primary : member.score >= 40 ? C.amber : C.red;
  const initial = (member.user_name || '?').split(' ').pop()[0];
  const history = buildHistory(member.score);

  return (
    <div style={{ minHeight: '100vh', background: C.bg, overflowY: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: 100 }}>

      {/* ── Header ── */}
      <div style={{
        background: `linear-gradient(135deg, ${C.primaryDk} 0%, ${C.primary} 100%)`,
        paddingTop: 'calc(env(safe-area-inset-top,44px) + 8px)',
        paddingBottom: 24, paddingLeft: 20, paddingRight: 20,
        position: 'sticky', top: 0, zIndex: 50,
        boxShadow: '0 2px 12px rgba(49,101,133,0.3)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <button onClick={() => navigate(-1)}
            style={{ background: 'rgba(255,255,255,0.15)', border: 'none', cursor: 'pointer', borderRadius: 12, padding: '7px 12px', display: 'flex', alignItems: 'center', gap: 4 }}>
            <ChevronLeft size={17} color="#fff" />
            <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>Quay lại</span>
          </button>
          <span style={{ fontSize: 15, fontWeight: 900, color: '#fff' }}>HỒ SƠ THÀNH VIÊN</span>
          <div style={{ width: 70 }} />
        </div>

        {/* Mini profile in header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 26,
            background: isLazy ? '#fecaca' : 'rgba(255,255,255,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '2px solid rgba(255,255,255,0.5)',
            fontSize: 22, fontWeight: 900, color: '#fff',
          }}>
            {initial}
          </div>
          <div>
            <p style={{ fontSize: 18, fontWeight: 900, color: '#fff', margin: 0 }}>{member.user_name}</p>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)', margin: '2px 0 0', fontWeight: 500 }}>
              {member.position || 'Chuyên viên Kinh doanh'}
              {isLazy && <span style={{ marginLeft: 8, background: C.red, color: '#fff', fontSize: 9, padding: '1px 6px', borderRadius: 8, fontWeight: 800 }}>⚠ Cần hỗ trợ</span>}
            </p>
          </div>
        </div>
      </div>

      <div style={{ padding: '16px 16px 0' }}>

        {/* ── 3 Action buttons ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 16 }}>
          {[
            { icon: Phone, label: 'Gọi điện', color: C.primary, bg: C.primaryLt, action: () => window.open(`tel:${member.phone || ''}`) },
            { icon: MessageCircle, label: 'Nhắn tin', color: '#7c3aed', bg: '#f5f3ff', action: () => navigate('/app/inside') },
            { icon: ClipboardList, label: 'Giao việc', color: C.amber, bg: C.amberBg, action: () => setShowAssignModal(true) },
          ].map((btn, i) => {
            const Icon = btn.icon;
            return (
              <button key={i} onClick={btn.action}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '12px 8px', borderRadius: 14, background: btn.bg, border: 'none', cursor: 'pointer' }}>
                <Icon size={20} color={btn.color} />
                <span style={{ fontSize: 11, fontWeight: 800, color: btn.color }}>{btn.label}</span>
              </button>
            );
          })}
        </div>

        {/* ── KPI Score card ── */}
        <div style={{ background: C.card, borderRadius: 18, padding: '16px', marginBottom: 12, border: `1px solid ${C.border}`, boxShadow: '0 2px 12px rgba(49,101,133,0.06)' }}>
          <p style={{ fontSize: 10, fontWeight: 800, color: C.muted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 }}>KPI Tháng này</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {/* Circle */}
            <svg width={72} height={72} style={{ flexShrink: 0 }}>
              {(() => {
                const r = 30, cx = 36, cy = 36, circ = 2 * Math.PI * r;
                const dash = (Math.min(member.score, 100) / 100) * circ;
                return (
                  <>
                    <circle cx={cx} cy={cy} r={r} fill="none" stroke={C.primaryLt} strokeWidth={8} />
                    <circle cx={cx} cy={cy} r={r} fill="none" stroke={scoreColor} strokeWidth={8}
                      strokeDasharray={`${dash} ${circ - dash}`} strokeLinecap="round"
                      transform={`rotate(-90 ${cx} ${cy})`} />
                    <text x={cx} y={cy + 5} textAnchor="middle" fontSize={16} fontWeight={900} fill={scoreColor}>{member.score?.toFixed(0)}</text>
                    <text x={cx} y={cy + 17} textAnchor="middle" fontSize={8} fontWeight={700} fill={C.muted}>điểm</text>
                  </>
                );
              })()}
            </svg>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: C.sub, fontWeight: 600, marginBottom: 4 }}>
                Trạng thái: <span style={{ fontWeight: 800, color: isLazy ? C.red : C.green }}>{isLazy ? '⚠ Cần cải thiện' : '✓ Đạt chỉ tiêu'}</span>
              </div>
              <div style={{ height: 8, background: C.border, borderRadius: 4, overflow: 'hidden', marginBottom: 6 }}>
                <div style={{ height: '100%', width: `${member.score}%`, background: scoreColor, borderRadius: 4, transition: 'width 0.6s ease' }} />
              </div>
              <div style={{ fontSize: 11, color: C.muted, fontWeight: 600 }}>Mục tiêu: 80 điểm · Còn thiếu {Math.max(0, 80 - member.score).toFixed(0)}</div>
            </div>
          </div>
        </div>

        {/* ── 4 Stats ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
          {[
            { icon: Flame,        color: C.red,     bg: C.redBg,   label: 'Lead đang xử lý', value: `${(member.calls || 0) > 10 ? Math.round(member.calls / 5) : 3}` },
            { icon: CheckCircle2, color: C.green,   bg: C.greenBg, label: 'Deal đang theo',  value: `${member.deals || 0}` },
            { icon: Phone,        color: C.primary, bg: C.primaryLt, label: 'Cuộc gọi',     value: `${member.calls || 0}` },
            { icon: DollarSign,   color: C.amber,   bg: C.amberBg, label: 'Doanh thu',       value: fmt(member.revenue) },
          ].map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={i} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: '12px 14px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={14} color={s.color} />
                  </div>
                  <span style={{ fontSize: 10, color: C.sub, fontWeight: 700 }}>{s.label}</span>
                </div>
                <div style={{ fontSize: 20, fontWeight: 900, color: s.color }}>{s.value}</div>
              </div>
            );
          })}
        </div>

        {/* ── KPI 6 tháng gần nhất ── */}
        <div style={{ background: C.card, borderRadius: 18, padding: '16px', marginBottom: 12, border: `1px solid ${C.border}`, boxShadow: '0 2px 12px rgba(49,101,133,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <TrendingUp size={15} color={C.primary} />
            <span style={{ fontSize: 11, fontWeight: 800, color: C.sub, textTransform: 'uppercase', letterSpacing: 0.6 }}>Lịch sử KPI · 6 tháng</span>
          </div>
          <Sparkline data={history} color={scoreColor} />
        </div>

        {/* ── Gợi ý hành động ── */}
        {isLazy && (
          <div style={{ background: C.redBg, border: `1px solid #fecaca`, borderRadius: 14, padding: '14px', marginBottom: 12 }}>
            <p style={{ fontSize: 12, fontWeight: 800, color: C.red, marginBottom: 10 }}>🚨 Đề xuất hành động cho Manager</p>
            {[
              'Đặt lịch 1-on-1 coaching trong tuần này',
              'Giao ít nhất 2 lead nóng để cải thiện confidence',
              'Theo dõi daily check-in trong 2 tuần tới',
            ].map((tip, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                <span style={{ fontSize: 13, flexShrink: 0 }}>•</span>
                <span style={{ fontSize: 12, color: C.text, fontWeight: 500 }}>{tip}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Assign Task Modal ── */}
      {showAssignModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'flex-end' }}
          onClick={() => setShowAssignModal(false)}>
          <div style={{ width: '100%', background: '#fff', borderRadius: '24px 24px 0 0', padding: '24px 20px', paddingBottom: 'calc(env(safe-area-inset-bottom,20px) + 20px)' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ width: 36, height: 4, borderRadius: 2, background: '#e2e8f0', margin: '0 auto 20px' }} />
            <p style={{ fontSize: 16, fontWeight: 900, color: C.text, marginBottom: 4 }}>📋 Giao việc cho {member.user_name}</p>
            <p style={{ fontSize: 12, color: C.muted, marginBottom: 14 }}>Nhập nội dung công việc cụ thể:</p>
            <textarea
              value={assignNote}
              onChange={e => setAssignNote(e.target.value)}
              placeholder="VD: Gọi lại 3 khách nóng trong danh sách hôm nay, cập nhật CRM trước 18h..."
              style={{
                width: '100%', height: 100, borderRadius: 14, border: `1px solid ${C.border}`,
                padding: '12px', fontSize: 13, color: C.text, resize: 'none',
                outline: 'none', background: C.bg, boxSizing: 'border-box', fontFamily: 'inherit',
              }}
            />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 14 }}>
              <button onClick={() => setShowAssignModal(false)}
                style={{ padding: '13px', borderRadius: 14, background: '#f1f5f9', border: 'none', cursor: 'pointer', color: C.muted, fontSize: 13, fontWeight: 700 }}>
                Huỷ
              </button>
              <button
                onClick={() => {
                  // TODO: call assignTask API
                  alert(`Đã giao việc cho ${member.user_name}:\n"${assignNote}"`);
                  setAssignNote('');
                  setShowAssignModal(false);
                }}
                disabled={!assignNote.trim()}
                style={{ padding: '13px', borderRadius: 14, background: assignNote.trim() ? C.primary : C.border, border: 'none', cursor: 'pointer', color: assignNote.trim() ? '#fff' : C.muted, fontSize: 13, fontWeight: 800 }}>
                Gửi giao việc
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}*{-webkit-tap-highlight-color:transparent}`}</style>
    </div>
  );
}
