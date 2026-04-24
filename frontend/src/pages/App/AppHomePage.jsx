/**
 * AppHomePage.jsx — Redesign hoàn chỉnh
 * - Greeting cá nhân theo giờ
 * - Quick actions icon to, màu sắc
 * - Hot products banner cho Sales
 * - Stats cards trực quan
 * - Cảm giác native app thật sự
 */
import { useEffect, useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import {
  Flame, Users, Target, Wallet, Calendar, BookOpen,
  TrendingUp, Bell, ChevronRight, Star, Zap,
  Home, Building2, Phone, FileText, Award,
  BarChart3, MessageSquare, Settings, LogOut,
  ShieldCheck, Clock, CheckCircle2, ArrowRight,
  Plus, Gift, HelpCircle, Shield, ClipboardCheck,
  UserCheck, DollarSign, Eye, Upload, MessageCircle,
  Trophy, Medal, ChevronUp, TrendingDown,
  BadgePercent, ClipboardList, Lightbulb,
  MapPin, PenLine, Smile, Newspaper, Sparkles,
  UserCog, PenTool, Globe, Scale,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getRoleAppRuntime } from '@/config/appRuntimeShell';
import { ROLES } from '@/config/navigation';
import { dashboardAPI } from '@/lib/api';
import { dealApi, softBookingApi } from '@/lib/salesApi';
import { managerApi } from '@/api/pipelineApi';
import { getMyIncomeWithKPI } from '@/api/commissionApi';
import MobileSalesSupportPage from '@/pages/App/MobileSalesSupportPage';
import MobileAuditPage from '@/pages/App/MobileAuditPage';
import MobileProjectDirectorPage from '@/pages/App/MobileProjectDirectorPage';
import MobileBODHomePage from '@/pages/App/MobileBODHomePage';
import MobileManagerHomePage from '@/pages/App/MobileManagerHomePage';

// ─── Seasonal & Greeting System ─────────────────────────────────────────────
const SEASONS = {
  xuan: {
    name: 'Xuân', emoji: '🌸',
    gradient: 'from-pink-600 via-rose-500 to-fuchsia-700',
    overlay: 'from-pink-900/70 via-rose-900/60 to-fuchsia-900/70',
    decor: ['🌸','🌺','🌻','🦋'],
    months: [2, 3, 4],
  },
  ha: {
    name: 'Hạ', emoji: '🌊',
    gradient: 'from-sky-600 via-blue-500 to-emerald-600',
    overlay: 'from-sky-900/70 via-blue-900/60 to-emerald-900/70',
    decor: ['☀️','🌴','🌊','🏖️'],
    months: [5, 6, 7, 8],
  },
  thu: {
    name: 'Thu', emoji: '🍂',
    gradient: 'from-amber-600 via-orange-500 to-red-600',
    overlay: 'from-amber-900/70 via-orange-900/60 to-red-900/70',
    decor: ['🍂','🍁','🌾','🎑'],
    months: [9, 10, 11],
  },
  dong: {
    name: 'Đông', emoji: '❄️',
    gradient: 'from-slate-700 via-blue-800 to-indigo-900',
    overlay: 'from-slate-900/70 via-blue-900/60 to-indigo-900/70',
    decor: ['❄️','⛄','🌨️','✨'],
    months: [12, 1],
  },
};

const WISHES = {
  sang: [
    'Chúc anh/chị một buổi sáng tràn đầy năng lượng — hôm nay thêm một deal nữa nhé!',
    'Một ngày mới, một trang mới. Chúc anh/chị chinh phục được nhiều khách hàng!',
    'Buổi sáng tốt lành mở đầu cho một ngày bứt phá. Anh/chị ngon lành lắm!',
    'Nắng mai tươi sáng như cơ hội đang chờ phía trước. Cứ tự tin tiến lên!',
    'Mỗi cuộc gọi sáng nay là một cơ hội — anh/chị hãy nắm lấy nhé!',
    'Thành công hôm nay bắt đầu từ thái độ lúc này. Chúc anh/chị ngày vui!',
    'Giờ vàng buổi sáng — khách còn tươi tỉnh, gọi ngay là hiệu quả nhất!',
    'Anh/chị ổn không? Hôm nay cũng sẽ là một ngày tuyệt vời đấy!',
  ],
  trua: [
    'Đã đến trưa rồi — nhớ ăn no trước khi tiếp tục chinh phục nhé!',
    'Buổi sáng đã làm được gì chưa? Buổi chiều còn nhiều cơ hội đang chờ!',
    'Nạp năng lượng tốt để chiều về bứt phá nốt nhé anh/chị!',
    'Giữa ngày nghỉ xíu, hít thở và lấy lại tinh thần — chiều lại lên đỉnh!',
  ],
  chieu: [
    'Giờ vàng chốt deal — khách hàng thường quyết định vào buổi chiều đấy!',
    'Chiều tà nhưng cơ hội vẫn sáng. Một cuộc gọi nữa thôi anh/chị ơi!',
    'Hãy kết thúc ngày bằng ít nhất 1 thành tích đáng tự hào nhé!',
    'Buổi chiều là lúc khách suy nghĩ nhiều nhất — đây là thời điểm vàng!',
    'Mỗi phút chiều nay là tiền thật sự. Anh/chị hãy làm cho trọn vẹn!',
    'Chỉ còn vài tiếng nữa thôi — anh/chị đang ở top mấy rồi?',
    'Hoa hồng không đến tự nhiên, nhưng chiều nay anh/chị có thể tạo ra nó!',
  ],
  toi: [
    'Buổi tối bình yên sau một ngày làm việc hết sức. Chúc anh/chị ngủ ngon!',
    'Hôm nay đã cố gắng hết mình chưa? Nếu rồi thì thật đáng tự hào!',
    'Tối đến là lúc tổng kết và nạp lại năng lượng cho ngày mai!',
    'Mỗi buổi tối là cơ hội để chuẩn bị tốt hơn cho ngày mai!',
    'Nghỉ ngơi tốt để ngày mai lại bứt phá tiếp anh/chị nhé!',
    'Ánh đèn thành phố về đêm — chúc anh/chị một buổi tối thư giãn xứng đáng!',
  ],
  dem: [
    'Đêm khuya rồi — hãy nghỉ ngơi để tái tạo năng lượng anh/chị nhé!',
    'Sức khỏe là tài sản quý nhất. Ngủ đủ giấc để ngày mai lại chiến!',
  ],
};

function getSeason() {
  const m = new Date().getMonth() + 1;
  return Object.values(SEASONS).find(s => s.months.includes(m)) || SEASONS.dong;
}

function getDayWish() {
  const h = new Date().getHours();
  const d = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
  let pool, period;
  if (h < 6)       { pool = WISHES.dem;    period = 'đêm khuya'; }
  else if (h < 11) { pool = WISHES.sang;   period = 'buổi sáng'; }
  else if (h < 13) { pool = WISHES.trua;   period = 'buổi trưa'; }
  else if (h < 18) { pool = WISHES.chieu;  period = 'buổi chiều'; }
  else             { pool = WISHES.toi;    period = 'buổi tối'; }
  const wish = pool[d % pool.length];
  return { period, wish };
}

// ─── Utils ───────────────────────────────────────────────────────────────────
function getGreeting(fullName) {
  const { period, wish } = getDayWish();
  const season = getSeason();
  const givenName = fullName?.split(' ').slice(-1)[0] || 'bạn';
  return { period, wish, givenName, fullName: fullName || 'Bạn', season };
}

function fmt(n) {
  if (!n) return '0';
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)} tỷ`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(0)} tr`;
  return `${n}`;
}

// ─── Hot Product Banner (compact) ────────────────────────────────────────────
const HOT_PRODUCTS = [
  { id: 1, name: 'Nobu Residences Danang', tag: '🔴 ĐANG MỞ BÁN', left: '264 căn · Cam kết 6%', comm: 'Hấp dẫn', color: 'from-[#316585] to-[#1a3f52]' },
  { id: 2, name: 'Sun Symphony Residence', tag: '🟢 GIÁ TỐT',      left: '1373 căn · Bờ Sông Hàn', comm: 'CK 9.5%', color: 'from-orange-500 to-amber-600' },
];


function HotProductsBanner({ onViewAll }) {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % HOT_PRODUCTS.length), 4000);
    return () => clearInterval(t);
  }, []);
  const p = HOT_PRODUCTS[idx];
  return (
    <div className="mx-4 mb-4 mt-2">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="relative flex items-center justify-center w-3 h-3">
            <span className="absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75 animate-ping"></span>
            <span className="relative inline-flex rounded-full w-2 h-2 bg-red-500"></span>
          </div>
          <span className="text-xs font-black text-slate-800 uppercase tracking-widest">Hot Hôm Nay</span>
        </div>
        <button onClick={onViewAll} className="text-xs text-[#316585] font-bold flex items-center gap-0.5 hover:underline">
          Tất cả <ChevronRight className="w-3 h-3" />
        </button>
      </div>
      <button
        onClick={onViewAll}
        className={`relative w-full rounded-[24px] px-5 py-4 text-left text-white overflow-hidden shadow-xl shadow-slate-900/10 active:scale-[0.98] transition-all duration-300 group`}
      >
        <div className={`absolute inset-0 bg-gradient-to-br ${p.color}`} />
        {/* Animated Background effects */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:scale-125 transition-transform duration-700" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/10 rounded-full blur-xl translate-y-1/2 -translate-x-1/2" />
        
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex-1 pr-4">
            <span className="text-[10px] font-bold bg-white/20 backdrop-blur-md px-2.5 py-1 rounded-full uppercase tracking-wider shadow-sm inline-block mb-2">
              {p.tag}
            </span>
            <p className="text-lg font-black leading-tight tracking-tight mb-1">{p.name}</p>
            <p className="text-white/80 text-[11px] font-medium">{p.left}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl px-3 py-2 text-center flex-shrink-0 shadow-inner">
            <p className="text-[9px] text-white/70 uppercase tracking-wide font-bold mb-0.5">Hoa hồng</p>
            <p className="text-[17px] font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-yellow-400">{p.comm}</p>
          </div>
        </div>
        
        <div className="relative z-10 flex gap-1.5 mt-4">
          {HOT_PRODUCTS.map((_, i) => (
            <div key={i} className={`h-1 rounded-full transition-all duration-300 ${i === idx ? 'w-8 bg-white shadow-[0_0_8px_rgba(255,255,255,0.6)]' : 'w-2 bg-white/30'}`} />
          ))}
        </div>
      </button>
    </div>
  );
}

// ─── Quick Action Button ──────────────────────────────────────────────────────
function QuickBtn({ icon: Icon, label, color, bg, onTap }) {
  return (
    <button
      onClick={onTap}
      className="group flex flex-col items-center gap-2 active:scale-95 transition-all duration-300"
    >
      <div className={`relative w-[52px] h-[52px] ${bg} rounded-[20px] flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow`}>
        <div className="absolute inset-0 rounded-[20px] bg-white/40 opacity-0 group-hover:opacity-100 transition-opacity" />
        <Icon className={`w-[22px] h-[22px] ${color} relative z-10`} strokeWidth={2.5} />
      </div>
      <span className="text-[11px] font-bold text-slate-700 leading-tight text-center">{label}</span>
    </button>
  );
}

// ─── Stat Card (compact) ─────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub, color, bg, borderColor, onTap }) {
  return (
    <button
      onClick={onTap}
      className={`relative overflow-hidden bg-white ${borderColor} border-2 rounded-[20px] p-3 text-left w-full shadow-sm hover:shadow-md active:scale-95 transition-all duration-300 group`}
    >
      {/* Soft background blob */}
      <div className={`absolute -top-4 -right-4 w-12 h-12 ${bg} rounded-full opacity-50 group-hover:scale-150 transition-transform duration-500`} />
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-2">
          <div className={`${bg} w-[26px] h-[26px] rounded-full flex items-center justify-center`}>
            <Icon className={`w-3.5 h-3.5 ${color}`} strokeWidth={2.5} />
          </div>
          <ArrowRight className={`w-3 h-3 ${color} opacity-40 group-hover:translate-x-1 group-hover:opacity-100 transition-all duration-300`} />
        </div>
        <p className={`text-2xl font-black ${color} leading-none mb-1 tracking-tight`}>{value}</p>
        <p className="text-[10px] font-bold text-slate-600 leading-tight uppercase tracking-wider">{label}</p>
      </div>
    </button>
  );
}



// ─── Competition / Thi đua Widget — PREMIUM REDESIGN ─────────────────────────
const MOCK_RANKS = {
  team:    { current: 3,  total: 8,   label: 'Nhóm',      emoji: '👥', color: '#38bdf8', glow: '#38bdf880' },
  branch:  { current: 12, total: 45,  label: 'Tỉnh',      emoji: '🏙️',  color: '#a78bfa', glow: '#a78bfa80' },
  company: { current: 47, total: 210, label: 'Công ty',   emoji: '🏢', color: '#fb923c', glow: '#fb923c80' },
};

const TIERS = [
  { id: 'starter', label: 'Starter',      threshold: 0,  gradient: ['#94a3b8','#64748b'], icon: '⭐' },
  { id: 'bronze',  label: 'Bronze Seller',threshold: 3,  gradient: ['#f59e0b','#d97706'], icon: '🥉' },
  { id: 'silver',  label: 'Silver Seller',threshold: 6,  gradient: ['#94a3b8','#6b7280'], icon: '🥈' },
  { id: 'gold',    label: 'Gold Seller',  threshold: 10, gradient: ['#f59e0b','#ea580c'], icon: '🥇' },
  { id: 'diamond', label: 'Diamond',      threshold: 20, gradient: ['#06b6d4','#8b5cf6'], icon: '💎' },
];

// Mini top-3 teammates
const MOCK_TEAM_TOP = [
  { name: 'Phúc Hùng',  deals: 9, avatar: 'P', color: '#f59e0b' },
  { name: 'Trần K.',    deals: 7, avatar: 'T', color: '#316585' },
  { name: 'Thu Hương',  deals: 5, avatar: 'H', color: '#a78bfa' },
];

function CompetitionWidget({ navigate, closedDeals = 4 }) {
  const currentTier = TIERS.filter(t => closedDeals >= t.threshold).pop();
  const nextTier    = TIERS.find(t => closedDeals < t.threshold);
  const prevTier    = TIERS[TIERS.indexOf(currentTier) - 1] || currentTier;
  const progressPct = nextTier
    ? Math.min(((closedDeals - currentTier.threshold) / (nextTier.threshold - currentTier.threshold)) * 100, 100)
    : 100;
  const dealsLeft = nextTier ? nextTier.threshold - closedDeals : 0;
  const [c1, c2] = currentTier.gradient;

  return (
    <div className="mx-4 mb-4">
      {/* ── Section header ── */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)' }}>
            <Trophy className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-[13px] font-black text-slate-800 uppercase tracking-widest">Thi đua tháng này</span>
        </div>
        <button onClick={() => navigate('/kpi/leaderboard')}
          className="flex items-center gap-0.5 text-[11px] font-bold text-[#316585] active:opacity-70">
          Bảng vàng <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* ── MAIN CARD ── */}
      <div
        className="rounded-[28px] overflow-hidden relative"
        style={{
          background: 'linear-gradient(145deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.35), 0 4px 20px rgba(0,0,0,0.2)',
        }}
        onClick={() => navigate('/kpi/leaderboard')}
      >
        {/* Glow orbs background */}
        <div style={{
          position: 'absolute', top: -30, left: '20%',
          width: 120, height: 120, borderRadius: '50%',
          background: 'radial-gradient(circle, #38bdf840, transparent 70%)',
          filter: 'blur(20px)', pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', top: 20, right: '10%',
          width: 100, height: 100, borderRadius: '50%',
          background: 'radial-gradient(circle, #a78bfa40, transparent 70%)',
          filter: 'blur(20px)', pointerEvents: 'none',
        }} />

        <div className="relative px-5 pt-5 pb-4">

          {/* ── Rank badges ── */}
          <div className="grid grid-cols-3 gap-3 mb-5">
            {Object.values(MOCK_RANKS).map((r, i) => {
              const pct = Math.round(((r.total - r.current + 1) / r.total) * 100);
              return (
                <div key={r.label} className="text-center">
                  {/* Rank number */}
                  <div className="relative inline-flex flex-col items-center">
                    <div style={{
                      background: `radial-gradient(circle, ${r.glow}, transparent 70%)`,
                      position: 'absolute', inset: -8, borderRadius: '50%', pointerEvents: 'none',
                    }} />
                    <p className="text-[10px] font-bold uppercase tracking-widest mb-1"
                      style={{ color: `${r.color}aa` }}>
                      {r.emoji} {r.label}
                    </p>
                    <p className="font-black leading-none"
                      style={{ fontSize: 28, color: r.color, textShadow: `0 0 20px ${r.glow}` }}>
                      #{r.current}
                      <span style={{ fontSize: 11, color: `${r.color}77`, fontWeight: 600 }}>/{r.total}</span>
                    </p>
                  </div>
                  {/* Mini progress bar */}
                  <div className="h-1.5 rounded-full mt-2 overflow-hidden"
                    style={{ background: 'rgba(255,255,255,0.08)' }}>
                    <div className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${pct}%`,
                        background: `linear-gradient(to right, ${r.color}88, ${r.color})`,
                        boxShadow: `0 0 6px ${r.color}`,
                      }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── Divider ── */}
          <div style={{ height: 1, background: 'rgba(255,255,255,0.07)', marginBottom: 16 }} />

          {/* ── Tier badge + progress ── */}
          <div className="flex items-center gap-4 mb-4">
            {/* Current tier badge */}
            <div style={{
              width: 56, height: 56, borderRadius: 16, flexShrink: 0,
              background: `linear-gradient(135deg, ${c1}, ${c2})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: `0 6px 20px ${c1}55`,
              fontSize: 26,
            }}>
              {currentTier.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[13px] font-black text-white">{currentTier.label}</p>
                {nextTier && (
                  <p className="text-[10px] font-bold" style={{ color: '#a78bfa' }}>
                    → {nextTier.icon} {nextTier.label}
                  </p>
                )}
              </div>
              {/* Glowing progress bar */}
              <div className="rounded-full overflow-hidden" style={{ height: 8, background: 'rgba(255,255,255,0.08)' }}>
                <div className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${progressPct}%`,
                    background: `linear-gradient(to right, ${c1}, ${c2})`,
                    boxShadow: `0 0 10px ${c1}`,
                  }} />
              </div>
              {nextTier && (
                <p className="text-[10px] mt-1.5" style={{ color: 'rgba(255,255,255,0.45)' }}>
                  Cần thêm{' '}
                  <span style={{ color: '#fbbf24', fontWeight: 800 }}>{dealsLeft} giao dịch</span>
                  {' '}để đạt {nextTier.label}
                </p>
              )}
            </div>
          </div>

          {/* ── Tier path visualizer ── */}
          <div className="flex items-center justify-between gap-1 mb-5">
            {TIERS.filter(t => t.id !== 'starter').map((tier, i) => {
              const reached = closedDeals >= tier.threshold;
              const isCurrent = tier.id === currentTier.id;
              return (
                <div key={tier.id} className="flex-1 flex flex-col items-center gap-1">
                  <div style={{
                    width: isCurrent ? 34 : 26,
                    height: isCurrent ? 34 : 26,
                    borderRadius: isCurrent ? 10 : 8,
                    background: reached
                      ? `linear-gradient(135deg, ${tier.gradient[0]}, ${tier.gradient[1]})`
                      : 'rgba(255,255,255,0.08)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: isCurrent ? 18 : 13,
                    boxShadow: (isCurrent && reached) ? `0 4px 16px ${tier.gradient[0]}66` : 'none',
                    border: isCurrent ? `2px solid ${tier.gradient[0]}` : '1px solid rgba(255,255,255,0.1)',
                    transition: 'all 0.3s',
                  }}>
                    {reached ? tier.icon : <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>🔒</span>}
                  </div>
                  <span style={{
                    fontSize: 8, fontWeight: isCurrent ? 800 : 500,
                    color: reached ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.25)',
                    textAlign: 'center', lineHeight: 1.2,
                  }}>
                    {tier.label.split(' ')[0]}
                  </span>
                </div>
              );
            })}
          </div>

          {/* ── Mini top-3 team ── */}
          <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: '10px 14px' }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
              🏆 Top nhóm tuần này
            </p>
            <div className="flex flex-col gap-2">
              {MOCK_TEAM_TOP.map((m, i) => (
                <div key={m.name} className="flex items-center gap-2.5">
                  <span style={{ fontSize: 13, minWidth: 20 }}>{['🥇','🥈','🥉'][i]}</span>
                  <div style={{
                    width: 22, height: 22, borderRadius: 7,
                    background: m.color, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 9, fontWeight: 800, color: '#fff', flexShrink: 0,
                  }}>
                    {m.avatar}
                  </div>
                  <p style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.75)', flex: 1 }}>{m.name}</p>
                  <p style={{ fontSize: 11, fontWeight: 800, color: '#fbbf24' }}>{m.deals} GD</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── You are here indicator ── */}
          <div className="flex items-center justify-center gap-2 mt-3">
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80', animation: 'pulse 2s infinite' }} />
            <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>
              Bạn đang ở vị trí <span style={{ color: '#4ade80', fontWeight: 700 }}>#3</span> trong nhóm · <span style={{ color: '#a78bfa', fontWeight: 700 }}>4 GD</span> tháng này
            </p>
          </div>
        </div>

        {/* Bottom CTA */}
        <div style={{
          background: 'rgba(255,255,255,0.05)',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          padding: '10px 20px',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        }}>
          <BarChart3 style={{ width: 13, height: 13, color: '#38bdf8' }} />
          <span style={{ fontSize: 11, fontWeight: 700, color: '#38bdf8' }}>Xem bảng xếp hạng đầy đủ</span>
          <ChevronRight style={{ width: 12, height: 12, color: '#38bdf8' }} />
        </div>
      </div>
    </div>
  );
}

// ─── SALES home config ────────────────────────────────────────────────────────
// NOTE: Stats đã có Lead nóng/Giữ chỗ/Hoa hồng/Lịch hẹn — KHÔNG lặp lại
// Sales quick actions: 8 slots in 4-col grid
const SALES_QUICK = (navigate) => [
  { icon: Building2,      label: 'Giỏ hàng DA',  color: 'text-blue-600',    bg: 'bg-blue-50',    onTap: () => navigate('/sales/catalog') },
  { icon: Users,          label: 'Khách hàng',   color: 'text-violet-600',  bg: 'bg-violet-50',  onTap: () => navigate('/crm/contacts') },
  { icon: Sparkles,       label: 'AI Sales',      color: 'text-violet-600',  bg: 'bg-violet-50',  onTap: () => navigate('/app/ai-sales') },
  { icon: Lightbulb,      label: 'Kho tri thức', color: 'text-amber-600',   bg: 'bg-amber-50',   onTap: () => navigate('/app/knowledge') },
  { icon: BadgePercent,   label: 'Hoa hồng',     color: 'text-emerald-600', bg: 'bg-emerald-50', onTap: () => navigate('/app/payroll') },
  { icon: ClipboardList,  label: 'Đề xuất',      color: 'text-rose-600',    bg: 'bg-rose-50',    onTap: () => navigate('/app/approvals') },
  { icon: MapPin,         label: 'Chấm công',    color: 'text-teal-600',    bg: 'bg-teal-50',    onTap: () => navigate('/app/checkin') },
  { icon: Trophy,         label: 'Vinh danh',     color: 'text-yellow-600',  bg: 'bg-yellow-50',  onTap: () => navigate('/app/rewards') },
];

// NOTE: Manager = Trưởng nhóm VỪA quản lý đội VỪA tự bán hàng
// Row 1: Sales cá nhân | Row 2: Quản lý đội
const MANAGER_QUICK = (navigate) => [
  { icon: Building2,      label: 'Sản phẩm DA', sublabel: '', color: 'text-blue-600',    bg: 'bg-blue-50',    onTap: () => navigate('/sales/catalog') },
  { icon: Users,          label: 'Khách hàng',  sublabel: '', color: 'text-violet-600',  bg: 'bg-violet-50',  onTap: () => navigate('/crm/contacts') },
  { icon: FileText,       label: 'Hồ sơ',       sublabel: '', color: 'text-amber-600',   bg: 'bg-amber-50',   onTap: () => navigate('/sales/bookings') },
  { icon: BadgePercent,   label: 'Hoa hồng',    sublabel: '', color: 'text-emerald-600', bg: 'bg-emerald-50', onTap: () => navigate('/app/payroll') },
  { icon: Users,          label: 'Đội nhóm',    sublabel: '', color: 'text-sky-600',     bg: 'bg-sky-50',     onTap: () => navigate('/kpi/team') },
  { icon: ClipboardList,  label: 'Phê duyệt',   sublabel: '', color: 'text-rose-600',    bg: 'bg-rose-50',    onTap: () => navigate('/app/approvals') },
  { icon: Smile,          label: 'Hiệu suất',   sublabel: '', color: 'text-violet-600',  bg: 'bg-violet-50',  onTap: () => navigate('/app/performance') },
  { icon: MapPin,         label: 'Chấm công',   sublabel: '', color: 'text-teal-600',    bg: 'bg-teal-50',    onTap: () => navigate('/app/checkin') },
];

// NOTE: Stats row BOD đã có Doanh số/Cảnh báo/Booking/Nhân sự
const BOD_QUICK = (navigate) => [
  { icon: BarChart3,      label: 'Tổng quan',     sublabel: '', color: 'text-blue-600',    bg: 'bg-blue-50',    onTap: () => navigate('/analytics/executive') },
  { icon: ClipboardList,  label: 'Phê duyệt',     sublabel: '', color: 'text-rose-600',    bg: 'bg-rose-50',    onTap: () => navigate('/app/approvals') },
  { icon: BadgePercent,   label: 'Lương đội',     sublabel: '', color: 'text-emerald-600', bg: 'bg-emerald-50', onTap: () => navigate('/app/payroll') },
  { icon: BarChart3,      label: 'Báo cáo TC',    sublabel: '', color: 'text-green-600',   bg: 'bg-green-50',   onTap: () => navigate('/app/finance-report') },
  { icon: Zap,            label: 'Workflow',      sublabel: '', color: 'text-violet-600',  bg: 'bg-violet-50',  onTap: () => navigate('/app/workflow') },
  { icon: Users,          label: 'Tuyển dụng',    sublabel: '', color: 'text-sky-600',     bg: 'bg-sky-50',     onTap: () => navigate('/app/recruitment') },
  { icon: Newspaper,      label: 'Văn bản',       sublabel: '', color: 'text-slate-600',   bg: 'bg-slate-50',   onTap: () => navigate('/app/office') },
  { icon: MessageCircle,  label: 'Nội bộ',        sublabel: '', color: 'text-pink-600',    bg: 'bg-pink-50',    onTap: () => navigate('/app/inside') },
];

// NOTE: Stats AGENCY = Lead nóng/Giữ chỗ/Hoa hồng/Lịch hẹn — không lặp
// NOTE: Nút "+" trung tâm xử lý Thêm KH — bỏ ở đây
const AGENCY_QUICK = (navigate) => [
  { icon: Building2, label: 'Sản phẩm DA', color: 'text-blue-600',    bg: 'bg-blue-50',    onTap: () => navigate('/sales/catalog') },
  { icon: Users,     label: 'Khách tôi',   color: 'text-violet-600',  bg: 'bg-violet-50',  onTap: () => navigate('/crm/contacts') },
  { icon: BookOpen,  label: 'Tài liệu',    color: 'text-sky-600',     bg: 'bg-sky-50',     onTap: () => navigate('/sales/product-center') },
  { icon: BarChart3, label: 'KPI của tôi', color: 'text-emerald-600', bg: 'bg-emerald-50', onTap: () => navigate('/sales/kpi') },
  { icon: Zap,       label: 'Mã CTV',      color: 'text-indigo-600',  bg: 'bg-indigo-50',  onTap: () => navigate('/recruitment/referral') },
  { icon: Trophy,    label: 'Bảng vàng',   color: 'text-yellow-600',  bg: 'bg-yellow-50',  onTap: () => navigate('/kpi/leaderboard') },
];

// ── Marketing ─────────────────────────────────────────────────────────────────
const MARKETING_QUICK = (navigate) => [
  { icon: PenTool,      label: 'Content',     color: 'text-pink-600',    bg: 'bg-pink-50',    onTap: () => navigate('/cms/articles') },
  { icon: Globe,        label: 'Tin tức',     color: 'text-blue-600',    bg: 'bg-blue-50',    onTap: () => navigate('/cms/news') },
  { icon: BarChart3,    label: 'Analytics',   color: 'text-violet-600',  bg: 'bg-violet-50',  onTap: () => navigate('/analytics/content') },
  { icon: Calendar,     label: 'Lịch đăng',  color: 'text-teal-600',    bg: 'bg-teal-50',    onTap: () => navigate('/work/calendar') },
  { icon: Users,        label: 'Khách hàng',  color: 'text-emerald-600', bg: 'bg-emerald-50', onTap: () => navigate('/crm/contacts') },
  { icon: Star,         label: 'Bảng vàng',   color: 'text-yellow-600',  bg: 'bg-yellow-50',  onTap: () => navigate('/kpi/leaderboard') },
];

// ── HR / Nhân sự ──────────────────────────────────────────────────────────────
const HR_QUICK = (navigate) => [
  { icon: Users,        label: 'Nhân viên',   color: 'text-blue-600',    bg: 'bg-blue-50',    onTap: () => navigate('/kpi/team') },
  { icon: UserCog,      label: 'Tuyển dụng',  color: 'text-cyan-600',    bg: 'bg-cyan-50',    onTap: () => navigate('/app/recruitment') },
  { icon: BarChart3,    label: 'Hiệu suất',   color: 'text-violet-600',  bg: 'bg-violet-50',  onTap: () => navigate('/app/performance') },
  { icon: Calendar,     label: 'Lịch làm',    color: 'text-teal-600',    bg: 'bg-teal-50',    onTap: () => navigate('/work/calendar') },
  { icon: BadgePercent, label: 'Bảng lương',  color: 'text-emerald-600', bg: 'bg-emerald-50', onTap: () => navigate('/app/payroll') },
  { icon: ClipboardList,label: 'Đề xuất',     color: 'text-rose-600',    bg: 'bg-rose-50',    onTap: () => navigate('/app/approvals') },
];

// ── Content / CMS ─────────────────────────────────────────────────────────────
const CONTENT_QUICK = (navigate) => [
  { icon: PenTool,      label: 'Bài viết',    color: 'text-violet-600',  bg: 'bg-violet-50',  onTap: () => navigate('/cms/articles') },
  { icon: Globe,        label: 'Tin tức',     color: 'text-blue-600',    bg: 'bg-blue-50',    onTap: () => navigate('/cms/news') },
  { icon: Newspaper,    label: 'Media',       color: 'text-rose-600',    bg: 'bg-rose-50',    onTap: () => navigate('/cms/media') },
  { icon: Calendar,     label: 'Lịch đăng',  color: 'text-teal-600',    bg: 'bg-teal-50',    onTap: () => navigate('/work/calendar') },
  { icon: BarChart3,    label: 'Analytics',   color: 'text-emerald-600', bg: 'bg-emerald-50', onTap: () => navigate('/analytics/content') },
  { icon: Users,        label: 'Cộng tác',    color: 'text-amber-600',   bg: 'bg-amber-50',   onTap: () => navigate('/app/inside') },
];

// ── Legal / Pháp lý ───────────────────────────────────────────────────────────
const LEGAL_QUICK = (navigate) => [
  { icon: FileText,     label: 'Hồ sơ',      color: 'text-amber-600',   bg: 'bg-amber-50',   onTap: () => navigate('/sales/bookings') },
  { icon: Scale,        label: 'Hợp đồng',   color: 'text-blue-600',    bg: 'bg-blue-50',    onTap: () => navigate('/app/approvals') },
  { icon: ClipboardList,label: 'Phê duyệt',  color: 'text-rose-600',    bg: 'bg-rose-50',    onTap: () => navigate('/app/approvals') },
  { icon: Calendar,     label: 'Lịch',        color: 'text-teal-600',    bg: 'bg-teal-50',    onTap: () => navigate('/work/calendar') },
  { icon: Users,        label: 'Khách hàng',  color: 'text-violet-600',  bg: 'bg-violet-50',  onTap: () => navigate('/crm/contacts') },
  { icon: Lightbulb,    label: 'Tri thức',    color: 'text-emerald-600', bg: 'bg-emerald-50', onTap: () => navigate('/app/knowledge') },
];

// ── Finance / Kế toán ─────────────────────────────────────────────────────────
const FINANCE_QUICK = (navigate) => [
  { icon: Wallet,       label: 'Thu chi',     color: 'text-emerald-600', bg: 'bg-emerald-50', onTap: () => navigate('/finance/my-income') },
  { icon: BadgePercent, label: 'Hoa hồng',    color: 'text-blue-600',    bg: 'bg-blue-50',    onTap: () => navigate('/app/payroll') },
  { icon: BarChart3,    label: 'Báo cáo TC',  color: 'text-violet-600',  bg: 'bg-violet-50',  onTap: () => navigate('/app/finance-report') },
  { icon: ClipboardList,label: 'Phê duyệt',   color: 'text-rose-600',    bg: 'bg-rose-50',    onTap: () => navigate('/app/approvals') },
  { icon: Calendar,     label: 'Lịch',         color: 'text-teal-600',    bg: 'bg-teal-50',    onTap: () => navigate('/work/calendar') },
  { icon: Users,        label: 'Nhân viên',    color: 'text-amber-600',   bg: 'bg-amber-50',   onTap: () => navigate('/kpi/team') },
];

function getQuickActions(role, navigate) {
  if (role === ROLES.MANAGER)          return MANAGER_QUICK(navigate);
  if (role === ROLES.PROJECT_DIRECTOR) return MANAGER_QUICK(navigate);
  if (role === ROLES.BOD || role === ROLES.ADMIN) return BOD_QUICK(navigate);
  if (role === ROLES.AGENCY)           return AGENCY_QUICK(navigate);
  if (role === ROLES.MARKETING)        return MARKETING_QUICK(navigate);
  if (role === ROLES.HR)               return HR_QUICK(navigate);
  if (role === ROLES.CONTENT)          return CONTENT_QUICK(navigate);
  if (role === ROLES.LEGAL)            return LEGAL_QUICK(navigate);
  if (role === ROLES.FINANCE)          return FINANCE_QUICK(navigate);
  return SALES_QUICK(navigate); // default: sales / sales_support
}

// ─── Priority Tasks (thay "Khu làm việc") ────────────────────────────────────
// Derive actionable items from live stats — mỗi task là 1 việc CỤ THỂ cần làm
function PriorityTasks({ stats, loading, navigate, role }) {
  if (loading) {
    return (
      <div className="bg-white rounded-3xl px-3 py-3 shadow-sm border border-slate-100 h-full flex flex-col gap-2.5">
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1">Việc ưu tiên hôm nay</p>
        {[1,2,3].map(i => (
          <div key={i} className="flex items-center gap-3 px-1 animate-pulse">
            <div className="w-7 h-7 rounded-full bg-slate-200 flex-shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3 bg-slate-100 rounded w-4/5" />
              <div className="h-2.5 bg-slate-100 rounded w-3/5" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Tạo danh sách task từ stats thật
  const tasks = [];
  const hotVal = parseInt(stats?.hot?.value) || 0;
  const bookVal = parseInt(stats?.booking?.value) || 0;
  const calVal  = parseInt(stats?.calendar?.value) || 0;

  if (hotVal > 0)
    tasks.push({ icon: Flame, color: 'text-red-500', bg: 'bg-red-50',
      label: `Có ${hotVal} khách nóng đang chờ gọi lại`,
      sub: 'Gọi trong 2 tiếng để không mất cơ hội',
      path: '/crm/leads?status=hot', urgency: 'high' });

  if (bookVal > 0)
    tasks.push({ icon: ShieldCheck, color: 'text-amber-500', bg: 'bg-amber-50',
      label: `${bookVal} giữ chỗ đang chờ xác nhận`,
      sub: 'Kiểm tra và xử lý trước khi hết hạn',
      path: '/sales/bookings', urgency: 'high' });

  if (calVal > 0)
    tasks.push({ icon: Calendar, color: 'text-violet-500', bg: 'bg-violet-50',
      label: `${calVal} lịch hẹn trong hôm nay`,
      sub: 'Xem chi tiết và chuẩn bị trước buổi hẹn',
      path: '/work/calendar', urgency: 'normal' });

  // Gợi ý mặc định nếu ngày bình thường
  if (tasks.length === 0 && [ROLES.SALES, ROLES.AGENCY].includes(role)) {
    tasks.push(
      { icon: Users, color: 'text-blue-500', bg: 'bg-blue-50',
        label: 'Chủ động thêm khách hàng mới hôm nay',
        sub: 'Mỗi khách hàng mới là cơ hội mới',
        path: '/crm/contacts/new', urgency: 'normal' },
      { icon: Building2, color: 'text-sky-500', bg: 'bg-sky-50',
        label: 'Cập nhật sản phẩm hot để gửi khách',
        sub: 'Sản phẩm mới ra hôm nay',
        path: '/sales/catalog', urgency: 'normal' },
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="bg-white rounded-3xl px-4 py-6 shadow-sm border border-slate-100 h-full flex flex-col items-center justify-center text-center">
        <CheckCircle2 className="w-10 h-10 text-emerald-400 mb-2" />
        <p className="text-sm font-bold text-slate-700">Tuyệt vời! Xong việc rồi 🎉</p>
        <p className="text-xs text-slate-400 mt-1">Không có việc gấp cần xử lý hôm nay</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl px-3 py-3 shadow-sm border border-slate-100 h-full flex flex-col">
      <div className="flex items-center justify-between mb-2.5 px-1">
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Việc ưu tiên hôm nay</p>
        <span className="text-[10px] font-bold bg-red-500 text-white px-2 py-0.5 rounded-full">{tasks.length}</span>
      </div>
      <div className="flex flex-col gap-2 flex-1">
        {tasks.map((t, i) => (
          <button
            key={i}
            onClick={() => navigate(t.path)}
            className="flex items-center gap-3 bg-slate-50 rounded-2xl px-3 py-2.5 text-left active:scale-[0.98] transition-transform w-full"
          >
            <div className={`w-8 h-8 ${t.bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
              <t.icon className={`w-4 h-4 ${t.color}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-800 leading-tight">{t.label}</p>
              <p className="text-[10px] text-slate-400 mt-0.5 leading-tight truncate">{t.sub}</p>
            </div>
            {t.urgency === 'high' && (
              <div className="w-2 h-2 rounded-full bg-red-400 animate-pulse flex-shrink-0" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function AppHomePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const runtime = getRoleAppRuntime(user?.role);
  const isSalesOrAgency = [ROLES.SALES, ROLES.AGENCY].includes(user?.role);
  const greeting = getGreeting(user?.full_name);

  const [stats, setStats] = useState({
    hot:      { value: '--', label: 'Lead nóng',   sub: 'Cần gọi ngay',       color: 'text-red-600',     bg: 'bg-red-50',     border: 'border-red-100', icon: Flame,    path: '/crm/leads?status=hot' },
    booking:  { value: '--', label: 'Giữ chỗ',     sub: 'Đang mở / chờ xử lý',color: 'text-amber-600',  bg: 'bg-amber-50',   border: 'border-amber-100',icon: ShieldCheck, path: '/sales/bookings' },
    income:   { value: '--', label: 'Hoa hồng',    sub: 'Ước tính tháng này',  color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100',icon: Wallet, path: '/finance/my-income' },
    calendar: { value: '--', label: 'Lịch hẹn',    sub: 'Sự kiện trong ngày',  color: 'text-violet-600',  bg: 'bg-violet-50',  border: 'border-violet-100',icon: Calendar, path: '/work/calendar' },
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.role) return;
    let mounted = true;
    (async () => {
      try {
        if ([ROLES.SALES, ROLES.AGENCY].includes(user.role)) {
          const today = new Date();
          const [statsRes, softBookingRes, incomeRes] = await Promise.allSettled([
            dashboardAPI.getStats(),
            softBookingApi.getSoftBookings({ limit: 10 }),
            getMyIncomeWithKPI({ year: today.getFullYear(), month: today.getMonth() + 1 }),
          ]);
          const sd = statsRes.status === 'fulfilled' ? statsRes.value?.data || {} : {};
          const books = softBookingRes.status === 'fulfilled' ? (softBookingRes.value?.items || []) : [];
          const inc = incomeRes.status === 'fulfilled' ? incomeRes.value || {} : {};
          const incVal = inc?.income?.estimated_amount || 0;
          if (mounted) setStats(s => ({
            ...s,
            hot:      { ...s.hot,     value: String(sd.hot_leads || 0) },
            booking:  { ...s.booking, value: String(sd.pending_bookings || books.length || 0) },
            income:   { ...s.income,  value: fmt(incVal) },
            calendar: { ...s.calendar,value: String(sd.overdue_tasks || 1) },
          }));
        } else if (user.role === ROLES.MANAGER) {
          const [sumRes, approvalRes] = await Promise.allSettled([
            managerApi.getDashboardSummary(),
            managerApi.getApprovalStats(),
          ]);
          const sum = sumRes.status === 'fulfilled' ? sumRes.value || {} : {};
          const appr = approvalRes.status === 'fulfilled' ? approvalRes.value || {} : {};
          if (mounted) setStats(s => ({
            hot:      { ...s.hot,     label: 'Lead đội',   value: String(sum.hot_deals || 0), sub: 'Cần can thiệp' },
            booking:  { ...s.booking, label: 'Chờ duyệt',  value: String(appr.pending || 0),  sub: 'Booking/HĐ' },
            income:   { ...s.income,  label: 'Pipeline',   value: fmt(sum.pipeline_value || 0),sub: 'Giá trị đội' },
            calendar: { ...s.calendar,label: 'Nhân viên',  value: String(sum.team_size || 8),  sub: 'Đang active' },
          }));
        } else if (user.role === ROLES.BOD) {
          const res = await dashboardAPI.getStats().catch(() => ({ data: {} }));
          const d = res?.data || {};
          if (mounted) setStats(s => ({
            hot:      { ...s.hot,     label: 'Doanh số',   value: fmt(d.monthly_revenue || 0), sub: 'Tháng này' },
            booking:  { ...s.booking, label: 'Cảnh báo',   value: String((d.hot_leads||0)+(d.overdue_tasks||0)), sub: 'Cần quyết định' },
            income:   { ...s.income,  label: 'Booking',    value: String(d.pending_bookings || 0), sub: 'Chờ xử lý' },
            calendar: { ...s.calendar,label: 'Nhân sự',    value: '24', sub: 'Đang hoạt động' },
          }));
        }
      } catch(_) {}
      if (mounted) setLoading(false);
    })();
    return () => { mounted = false; };
  }, [user?.role]);

  const quickActions = getQuickActions(user?.role, navigate);

  // ── Role-specific dedicated home pages (after all hooks) ──────────────────────
  // Platform detection: Capacitor native (iOS/Android) vs web browser
  const isNative = !!(window.Capacitor?.isNativePlatform?.() ||
    window.Capacitor?.getPlatform?.() === 'ios' ||
    window.Capacitor?.getPlatform?.() === 'android');

  if (user?.role === ROLES.BOD)              return isNative ? <MobileBODHomePage /> : <Navigate to="/bod/dashboard" replace />;
  // Manager: iOS app → mobile shell; Web browser → desktop dashboard
  if (user?.role === ROLES.MANAGER)          return isNative ? <MobileManagerHomePage /> : <Navigate to="/manager/dashboard" replace />;
  if (user?.role === ROLES.PROJECT_DIRECTOR) return isNative ? <MobileManagerHomePage /> : <Navigate to="/project-director/dashboard" replace />;
  // Sales: iOS app → mobile shell (AppHomePage với SALES_QUICK); Web browser → full desktop dashboard
  if (user?.role === ROLES.SALES && !isNative)  return <Navigate to="/sales/dashboard" replace />;
  // Marketing: iOS app → mobile shell; Web browser → full marketing dashboard
  if (user?.role === ROLES.MARKETING && !isNative) return <Navigate to="/marketing" replace />;
  // Finance/Kế toán: iOS app → mobile shell; Web browser → Finance dashboard
  if (user?.role === ROLES.FINANCE && !isNative) return <Navigate to="/finance" replace />;
  // HR/Nhân sự: iOS app → mobile shell; Web browser → HR dashboard
  if (user?.role === ROLES.HR && !isNative) return <Navigate to="/hr" replace />;
  if (user?.role === ROLES.SALES_SUPPORT)    return isNative ? <MobileSalesSupportPage /> : <Navigate to="/sales-support/dashboard" replace />;
  // Agency: iOS → mobile app shell; Web → Agency dashboard
  if (user?.role === ROLES.AGENCY && !isNative) return <Navigate to="/agency" replace />;
  // Content: iOS → mobile app shell; Web → Content dashboard
  if (user?.role === ROLES.CONTENT && !isNative) return <Navigate to="/content/dashboard" replace />;
  if (user?.role === ROLES.AUDIT)            return <MobileAuditPage />;

  return (
    <div className="h-screen bg-[#f1f5f9] flex flex-col overflow-hidden">
      
      {/* ── HEADER — Full-bleed seasonal ── */}
      <div className={`relative bg-gradient-to-br ${greeting.season.gradient} flex-shrink-0 overflow-hidden`}
           style={{ paddingTop: 'calc(env(safe-area-inset-top, 44px) + 12px)', paddingBottom: '24px' }}>
        {/* Decorative blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute top-16 -left-6 w-28 h-28 rounded-full bg-white/8 blur-xl" />
          <div className="absolute bottom-0 right-1/3 w-24 h-24 rounded-full bg-white/10 blur-xl" />
          {/* Floating seasonal emojis */}
          <span className="absolute top-6 right-6 text-3xl opacity-20 select-none">{greeting.season.emoji}</span>
          <span className="absolute bottom-8 right-14 text-2xl opacity-10 select-none">{greeting.season.decor[1]}</span>
        </div>

        {/* Top bar */}
        <div className="relative flex items-center justify-between px-4 mb-4">
          {/* Role badge */}
          <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm rounded-full px-3 py-1.5">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-white/90 text-xs font-semibold">{runtime?.shortTitle || user?.role}</span>
          </div>
          {/* Notification bell */}
          <div className="flex items-center gap-3">
            <button className="relative" onClick={() => navigate('/profile')}>
              <Bell className="w-5 h-5 text-white/80" />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[9px] text-white font-bold flex items-center justify-center">1</span>
            </button>
            <button onClick={logout} className="flex items-center gap-1 text-white/60 text-xs active:text-white">
              <LogOut className="w-3.5 h-3.5" />
              <span>Ra</span>
            </button>
          </div>
        </div>

        {/* Main greeting row */}
        <div className="relative flex items-end gap-4 px-4">
          {/* Avatar — Premium Glassmorphic */}
          <button
            onClick={() => navigate('/profile')}
            className="flex-shrink-0 active:scale-95 transition-transform relative group"
          >
            <div className="absolute inset-0 bg-white rounded-full blur-md opacity-30 group-hover:opacity-50 transition-opacity duration-300" />
            <div className="w-16 h-16 rounded-full border-[3px] border-white/80 shadow-lg bg-white/20 backdrop-blur-md flex items-center justify-center overflow-hidden relative z-10 transition-transform group-hover:scale-105">
              {user?.avatar_url ? (
                <img src={user.avatar_url} alt={user.full_name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-white font-black text-2xl">{user?.full_name?.split(' ').slice(-1)[0]?.[0] || 'U'}</span>
              )}
            </div>
            <div className="absolute bottom-0 right-0 bg-emerald-400 w-4 h-4 rounded-full border-2 border-white z-20 shadow-sm" />
          </button>

          {/* Text */}
          <div className="flex-1 min-w-0 pb-1">
            <p className="text-white/70 text-xs font-medium mb-0.5">
              Xin chào {greeting.period},
            </p>
            <p className="text-white text-xl font-black leading-tight truncate">
              {greeting.fullName} 👋
            </p>
            <p className="text-white/65 text-[11px] leading-relaxed mt-1.5 line-clamp-2">
              {greeting.season.emoji} {greeting.wish}
            </p>
          </div>
        </div>
      </div>

      {/* ── STATS (overlap header) ── */}
      <div className="px-4 -mt-3 mb-3 flex-shrink-0">
        <div className="grid grid-cols-4 gap-2">
          {Object.values(stats).map((s) => (
            <StatCard
              key={s.label}
              icon={s.icon}
              label={s.label}
              value={loading ? '—' : s.value}
              sub={s.sub}
              color={s.color}
              bg={s.bg}
              borderColor={s.border}
              onTap={() => navigate(s.path || '/')}
            />
          ))}
        </div>
      </div>

      {/* ── HOT PRODUCTS BANNER (Sales/Agency only) ── */}
      {isSalesOrAgency && (
        <div className="flex-shrink-0">
          <HotProductsBanner onViewAll={() => navigate('/sales/catalog')} />
        </div>
      )}

      {/* ── QUICK ACTIONS ── */}
      <div className="mx-4 mb-4 flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-black text-slate-800 uppercase tracking-widest">Thao tác nhanh</p>
          <div className="bg-amber-100 w-6 h-6 rounded-full flex items-center justify-center">
            <Zap className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
          </div>
        </div>
        <div className="bg-white rounded-[28px] px-3 py-5 shadow-sm border border-slate-100">
          <div className={`grid gap-y-5 gap-x-2 ${quickActions.length <= 6 ? 'grid-cols-3' : 'grid-cols-4'}`}>
            {quickActions.slice(0, 8).map((q) => (
              <QuickBtn key={q.label} {...q} onTap={q.onTap} />
            ))}
          </div>
        </div>
      </div>

      {/* ── THI ĐUA (Sales/Agency only) ── */}
      {isSalesOrAgency && (
        <div className="flex-shrink-0">
          <CompetitionWidget navigate={navigate} closedDeals={4} />
        </div>
      )}

      {/* ── VIỆC ƯU TIÊN HÔM NAY — fill khoảng trống còn lại ── */}
      <div className="mx-4 flex-1 min-h-0 mb-20">
        <PriorityTasks stats={stats} loading={loading} navigate={navigate} role={user?.role} />
      </div>
    </div>
  );
}
