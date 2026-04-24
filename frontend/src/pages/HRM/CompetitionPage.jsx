/**
 * CompetitionPage.jsx
 * Thi đua KPI — 5 chu kỳ: Tuần / Tháng / Quý / 6 tháng / Năm
 * Demo data, badge system, leaderboard realtime
 */
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/contexts/AuthContext';
import {
  Award, Crown, Flame, Star, Trophy, Zap,
  TrendingUp, Medal, Target, Users, Calendar,
  ChevronRight, Gift,
} from 'lucide-react';

// ─── Cấu hình chu kỳ thi đua ──────────────────────────────────────────────────
const PERIODS = [
  { key: 'week',    label: 'Tuần',     shortLabel: 'T',  icon: Zap,      color: 'text-amber-600',  bg: 'bg-amber-50',  border: 'border-amber-200', prize: 'Voucher 500k' },
  { key: 'month',   label: 'Tháng',    shortLabel: 'M',  icon: Star,     color: 'text-blue-600',   bg: 'bg-blue-50',   border: 'border-blue-200',  prize: 'Thưởng 3 triệu' },
  { key: 'quarter', label: 'Quý',      shortLabel: 'Q',  icon: Trophy,   color: 'text-violet-600', bg: 'bg-violet-50', border: 'border-violet-200', prize: 'Thưởng 15 triệu' },
  { key: 'half',    label: '6 tháng',  shortLabel: 'H',  icon: Medal,    color: 'text-rose-600',   bg: 'bg-rose-50',   border: 'border-rose-200',   prize: 'Thưởng 35 triệu' },
  { key: 'year',    label: 'Năm',      shortLabel: 'Y',  icon: Crown,    color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200', prize: 'TOP PERFORMER + Xe máy' },
];

// ─── Demo leaderboard data ─────────────────────────────────────────────────────
const LEADERBOARD = {
  week: [
    { rank: 1, name: 'Nguyễn Hoàng Nam', avatar: 'N', role: 'Senior Consultant', deals: 4, revenue: '4.2 tỷ', progress: 100, badge: '🏆' },
    { rank: 2, name: 'Trần Thu Trang', avatar: 'T', role: 'Sales Consultant', deals: 3, revenue: '3.1 tỷ', progress: 74, badge: '🥈' },
    { rank: 3, name: 'Lê Minh Khoa', avatar: 'L', role: 'Sales Consultant', deals: 2, revenue: '2.4 tỷ', progress: 57, badge: '🥉' },
    { rank: 4, name: 'Phạm Thị Lan', avatar: 'P', role: 'Property Advisor', deals: 2, revenue: '1.8 tỷ', progress: 43 },
    { rank: 5, name: 'Vũ Đức Thắng', avatar: 'V', role: 'Sales Trainee', deals: 1, revenue: '1.1 tỷ', progress: 26 },
  ],
  month: [
    { rank: 1, name: 'Trần Thu Trang', avatar: 'T', role: 'Sales Consultant', deals: 12, revenue: '18.5 tỷ', progress: 100, badge: '🏆' },
    { rank: 2, name: 'Nguyễn Hoàng Nam', avatar: 'N', role: 'Senior Consultant', deals: 10, revenue: '15.2 tỷ', progress: 82, badge: '🥈' },
    { rank: 3, name: 'Lê Minh Khoa', avatar: 'L', role: 'Sales Consultant', deals: 9, revenue: '12.8 tỷ', progress: 69, badge: '🥉' },
    { rank: 4, name: 'Phạm Thị Lan', avatar: 'P', role: 'Property Advisor', deals: 7, revenue: '9.4 tỷ', progress: 51 },
    { rank: 5, name: 'Vũ Đức Thắng', avatar: 'V', role: 'Sales Trainee', deals: 4, revenue: '5.1 tỷ', progress: 28 },
  ],
  quarter: [
    { rank: 1, name: 'Nguyễn Hoàng Nam', avatar: 'N', role: 'Senior Consultant', deals: 28, revenue: '42 tỷ', progress: 100, badge: '🏆' },
    { rank: 2, name: 'Trần Thu Trang', avatar: 'T', role: 'Sales Consultant', deals: 24, revenue: '36 tỷ', progress: 86, badge: '🥈' },
    { rank: 3, name: 'Bùi Văn Hùng', avatar: 'B', role: 'Team Leader', deals: 22, revenue: '34 tỷ', progress: 81, badge: '🥉' },
    { rank: 4, name: 'Lê Minh Khoa', avatar: 'L', role: 'Sales Consultant', deals: 19, revenue: '28 tỷ', progress: 67 },
    { rank: 5, name: 'Phạm Thị Lan', avatar: 'P', role: 'Property Advisor', deals: 15, revenue: '22 tỷ', progress: 52 },
  ],
  half: [
    { rank: 1, name: 'Bùi Văn Hùng', avatar: 'B', role: 'Team Leader', deals: 58, revenue: '86 tỷ', progress: 100, badge: '🏆' },
    { rank: 2, name: 'Nguyễn Hoàng Nam', avatar: 'N', role: 'Senior Consultant', deals: 52, revenue: '78 tỷ', progress: 91, badge: '🥈' },
    { rank: 3, name: 'Trần Thu Trang', avatar: 'T', role: 'Sales Consultant', deals: 46, revenue: '68 tỷ', progress: 79, badge: '🥉' },
    { rank: 4, name: 'Lê Minh Khoa', avatar: 'L', role: 'Sales Consultant', deals: 38, revenue: '56 tỷ', progress: 65 },
    { rank: 5, name: 'Phạm Thị Lan', avatar: 'P', role: 'Property Advisor', deals: 30, revenue: '44 tỷ', progress: 51 },
  ],
  year: [
    { rank: 1, name: 'Bùi Văn Hùng', avatar: 'B', role: 'Team Leader', deals: 108, revenue: '162 tỷ', progress: 100, badge: '👑' },
    { rank: 2, name: 'Nguyễn Hoàng Nam', avatar: 'N', role: 'Senior Consultant', deals: 96, revenue: '144 tỷ', progress: 89, badge: '🏆' },
    { rank: 3, name: 'Trần Thu Trang', avatar: 'T', role: 'Sales Consultant', deals: 84, revenue: '126 tỷ', progress: 78, badge: '🥈' },
    { rank: 4, name: 'Lê Minh Khoa', avatar: 'L', role: 'Sales Consultant', deals: 72, revenue: '108 tỷ', progress: 67, badge: '🥉' },
    { rank: 5, name: 'Phạm Thị Lan', avatar: 'P', role: 'Property Advisor', deals: 58, revenue: '86 tỷ', progress: 53 },
  ],
};

// ─── My badges earned ─────────────────────────────────────────────────────────
const MY_BADGES = [
  { icon: '🔥', label: 'On Fire', desc: '3 deal trong 1 tuần', earned: true },
  { icon: '⚡', label: 'Speed Closer', desc: 'Chốt deal trong 48h', earned: true },
  { icon: '🎯', label: 'Bullseye', desc: 'Đạt 100% KPI tháng', earned: true },
  { icon: '🌟', label: 'Rising Star', desc: 'Top 3 tuần đầu tiên', earned: true },
  { icon: '💎', label: 'Diamond Deal', desc: 'Deal trên 5 tỷ đơn lẻ', earned: false },
  { icon: '🦅', label: 'Eagle Eye', desc: 'Tìm được 5 khách tiềm năng/tuần', earned: false },
  { icon: '🏆', label: 'Champion', desc: 'Top 1 tháng', earned: false },
  { icon: '👑', label: 'King/Queen', desc: 'Top 1 cả năm', earned: false },
];

// Demo: vị trí của tôi
const MY_POSITION = { rank: 4, name: 'Nguyễn Văn A', progress: 62 };

const RANK_COLORS = {
  1: 'bg-yellow-400 text-yellow-900',
  2: 'bg-slate-300 text-slate-700',
  3: 'bg-amber-500/80 text-amber-900',
};

export default function CompetitionPage() {
  const { user } = useAuth();
  const [activePeriod, setActivePeriod] = useState('month');

  const period = PERIODS.find(p => p.key === activePeriod);
  const PeriodIcon = period.icon;
  const board = LEADERBOARD[activePeriod] || [];

  // Summary counts
  const myStats = { deals: 7, revenue: '9.4 tỷ', rank: 4, streak: 3 };

  return (
    <div className="space-y-5 max-w-3xl" data-testid="competition-page">

      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-500" /> Thi đua KPI
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">Leaderboard realtime — Phấn đấu lên top nhận thưởng</p>
      </div>

      {/* My position card */}
      <Card className="bg-gradient-to-r from-[#1a3a52] to-[#316585] border-0 text-white">
        <CardContent className="p-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <p className="text-white/60 text-xs font-medium uppercase tracking-wider">Thứ hạng của tôi · Tháng này</p>
              <div className="flex items-center gap-3 mt-1">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-xl font-bold">
                  #{MY_POSITION.rank}
                </div>
                <div>
                  <p className="font-bold text-lg">{user?.full_name || 'Nguyễn Văn A'}</p>
                  <p className="text-white/70 text-sm">{myStats.deals} deals · {myStats.revenue}</p>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className="flex items-center gap-2 bg-white/10 rounded-xl px-3 py-1.5">
                <Flame className="w-4 h-4 text-orange-300" />
                <span className="text-sm font-semibold">{myStats.streak} tuần streak 🔥</span>
              </div>
              <p className="text-white/60 text-xs">Cần vượt #{MY_POSITION.rank - 1} để nhận thưởng top 3</p>
            </div>
          </div>
          {/* Progress to next rank */}
          <div className="mt-3">
            <div className="flex justify-between text-xs text-white/60 mb-1">
              <span>Tiến độ</span>
              <span>{MY_POSITION.progress}% so với #3</span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-2">
              <div className="bg-white h-2 rounded-full transition-all" style={{ width: `${MY_POSITION.progress}%` }} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Period selector */}
      <div className="grid grid-cols-5 gap-1.5">
        {PERIODS.map(p => {
          const Icon = p.icon;
          return (
            <button
              key={p.key}
              onClick={() => setActivePeriod(p.key)}
              className={`flex flex-col items-center py-2.5 px-1 rounded-xl text-xs font-medium transition-all border ${
                activePeriod === p.key
                  ? `${p.bg} ${p.border} ${p.color} shadow-sm`
                  : 'border-slate-200 text-slate-400 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-4 h-4 mb-1" />
              {p.label}
            </button>
          );
        })}
      </div>

      {/* Period info banner */}
      <div className={`flex items-center justify-between p-3 rounded-xl ${period.bg} ${period.border} border`}>
        <div className="flex items-center gap-2">
          <PeriodIcon className={`w-4 h-4 ${period.color}`} />
          <div>
            <p className={`text-sm font-semibold ${period.color}`}>Thi đua {period.label}</p>
            <p className="text-xs text-slate-500">
              {activePeriod === 'week' ? 'Tuần 16: 14/04 – 20/04/2026' :
               activePeriod === 'month' ? 'Tháng 4/2026 · Còn 11 ngày' :
               activePeriod === 'quarter' ? 'Q2/2026: 01/04 – 30/06 · Còn 72 ngày' :
               activePeriod === 'half' ? 'H1/2026: 01/01 – 30/06 · Còn 72 ngày' :
               'Năm 2026: 01/01 – 31/12 · Còn 256 ngày'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <Gift className={`w-4 h-4 ${period.color}`} />
          <span className={`text-sm font-bold ${period.color}`}>{period.prize}</span>
        </div>
      </div>

      {/* Leaderboard */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#316585]" /> Bảng xếp hạng {period.label} này
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {board.map((person) => (
            <div
              key={person.rank}
              className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                person.rank === MY_POSITION.rank
                  ? 'border-[#316585]/30 bg-blue-50/40'
                  : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50/50'
              }`}
            >
              {/* Rank */}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                RANK_COLORS[person.rank] || 'bg-slate-100 text-slate-600'
              }`}>
                {person.badge || `#${person.rank}`}
              </div>

              {/* Avatar */}
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#316585] to-violet-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                {person.avatar}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <p className="font-semibold text-sm text-slate-900 truncate">{person.name}</p>
                  {person.rank === MY_POSITION.rank && <Badge className="text-[10px] bg-blue-100 text-blue-700 px-1.5">Tôi</Badge>}
                </div>
                <p className="text-xs text-slate-400">{person.role}</p>
                <div className="mt-1 flex items-center gap-2">
                  <div className="flex-1 bg-slate-100 rounded-full h-1.5">
                    <div
                      className="h-1.5 rounded-full transition-all"
                      style={{ width: `${person.progress}%`, backgroundColor: person.rank === 1 ? '#f59e0b' : '#316585' }}
                    />
                  </div>
                  <span className="text-[11px] text-slate-400 flex-shrink-0">{person.progress}%</span>
                </div>
              </div>

              {/* Stats */}
              <div className="text-right flex-shrink-0">
                <p className="font-bold text-sm text-slate-900">{person.revenue}</p>
                <p className="text-xs text-slate-400">{person.deals} deals</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Badge System */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-500" /> Huy hiệu cá nhân
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-3">
            {MY_BADGES.map((badge, i) => (
              <div
                key={i}
                className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl border text-center transition-all ${
                  badge.earned
                    ? 'border-amber-200 bg-amber-50/60'
                    : 'border-slate-100 bg-slate-50 opacity-40 grayscale'
                }`}
              >
                <span className="text-2xl">{badge.icon}</span>
                <p className="text-[11px] font-semibold text-slate-700 leading-tight">{badge.label}</p>
                <p className="text-[10px] text-slate-400 leading-tight">{badge.desc}</p>
                {badge.earned && <span className="text-[9px] text-amber-600 font-bold">ĐÃ ĐẠT ✓</span>}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Hall of Fame */}
      <Card className="border-yellow-200 bg-yellow-50/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Crown className="w-4 h-4 text-yellow-500" /> Hall of Fame — TOP PERFORMER
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3 overflow-x-auto pb-1">
            {[
              { year: '2025', name: 'Bùi Văn Hùng', revenue: '180 tỷ', icon: '👑' },
              { year: '2024', name: 'Nguyễn Thanh Mai', revenue: '156 tỷ', icon: '🏆' },
              { year: '2023', name: 'Trần Gia Bảo', revenue: '132 tỷ', icon: '🎖️' },
            ].map(item => (
              <div key={item.year} className="flex-shrink-0 text-center p-3 rounded-xl bg-white border border-yellow-200 min-w-[110px]">
                <p className="text-2xl mb-1">{item.icon}</p>
                <p className="text-xs font-bold text-yellow-700">{item.year}</p>
                <p className="text-xs font-semibold text-slate-800 mt-0.5">{item.name}</p>
                <p className="text-xs text-slate-400">{item.revenue}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
