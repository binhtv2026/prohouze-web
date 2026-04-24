/**
 * MobileRewardsPage.jsx — Vinh danh & Thành tích (Base Reward)
 * Huy hiệu · Top sales · Wall of Fame
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Trophy, Medal, Star, Award, Flame, Crown, Gift, ChevronRight, Zap } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const BADGES = [
  { id: 'b1', icon: '🥇', label: 'Top Sales Q1', desc: 'Doanh số xuất sắc nhất Q1/2026', earned: true, date: '31/03/2026', rarity: 'legendary' },
  { id: 'b2', icon: '🔥', label: 'Streak 7 ngày', desc: 'Check-in liên tục 7 ngày', earned: true, date: '20/04/2026', rarity: 'rare' },
  { id: 'b3', icon: '💎', label: 'Diamond Seller', desc: 'Đạt 20+ giao dịch', earned: false, progress: 12, target: 20, rarity: 'legendary' },
  { id: 'b4', icon: '⭐', label: 'Rising Star', desc: 'Hoàn thành tháng đầu 100% KPI', earned: true, date: '31/01/2026', rarity: 'rare' },
  { id: 'b5', icon: '🏆', label: '1 tỷ tháng', desc: 'Đạt hoa hồng 1 tỷ trong 1 tháng', earned: false, progress: 0.154, target: 1, rarity: 'epic', unit: 'tỷ' },
  { id: 'b6', icon: '🤝', label: 'Team Player', desc: 'Hỗ trợ 10 đồng nghiệp', earned: true, date: '15/03/2026', rarity: 'common' },
  { id: 'b7', icon: '📚', label: 'Knowledge Master', desc: 'Đọc 10 bài Kho tri thức', earned: false, progress: 6, target: 10, rarity: 'common' },
  { id: 'b8', icon: '🚀', label: 'Speed Closer', desc: 'Chốt deal trong 24h', earned: true, date: '10/04/2026', rarity: 'epic' },
];

const LEADERBOARD = [
  { rank: 1, name: 'Nguyễn Phúc Hùng', deals: 5, revenue: 24.5e9, badge: '👑', change: '+2' },
  { rank: 2, name: 'Trần Minh Khoa',   deals: 4, revenue: 18.2e9, badge: '🥈', change: '+1' },
  { rank: 3, name: 'Lê Thu Hương',     deals: 3, revenue: 14.1e9, badge: '🥉', change: '-1' },
  { rank: 4, name: 'Phạm Thùy Linh',  deals: 2, revenue: 9.8e9,  badge: '4️⃣', change: '0' },
  { rank: 5, name: 'Võ Thị Kim Anh',  deals: 1, revenue: 4.1e9,  badge: '5️⃣', change: '-2' },
];

const RARITY_STYLE = {
  legendary: { bg: 'bg-gradient-to-br from-amber-400 to-yellow-600', border: 'border-amber-300', text: 'text-amber-800', label: 'Legendary' },
  epic:      { bg: 'bg-gradient-to-br from-violet-500 to-purple-700', border: 'border-violet-300', text: 'text-violet-800', label: 'Epic' },
  rare:      { bg: 'bg-gradient-to-br from-blue-400 to-blue-700',     border: 'border-blue-300',   text: 'text-blue-800',   label: 'Rare' },
  common:    { bg: 'bg-gradient-to-br from-slate-400 to-slate-600',   border: 'border-slate-300',  text: 'text-slate-700',  label: 'Common' },
};

const fmtBn = n => (n / 1e9).toFixed(1) + ' tỷ';

export default function MobileRewardsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tab, setTab] = useState('badges');

  const earned = BADGES.filter(b => b.earned);
  const inProgress = BADGES.filter(b => !b.earned);

  return (
    <div className="h-screen bg-[#f1f5f9] flex flex-col overflow-hidden">
      {/* HEADER */}
      <div
        className="flex-shrink-0 px-4 pt-12 pb-5 text-white"
        style={{ background: 'linear-gradient(135deg, #d97706 0%, #92400e 100%)' }}
      >
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => navigate(-1)} className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center">
            <ArrowLeft className="w-4 h-4 text-white" />
          </button>
          <div>
            <h1 className="text-xl font-bold">Vinh danh & Thành tích</h1>
            <p className="text-white/70 text-xs">{earned.length} huy hiệu đạt được · Tháng 04/2026</p>
          </div>
        </div>

        {/* My stats */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Huy hiệu', value: earned.length, icon: '🏅' },
            { label: 'Xếp hạng', value: '#2', icon: '🥈' },
            { label: 'Điểm XP', value: '2.840', icon: '⚡' },
          ].map(s => (
            <div key={s.label} className="bg-white/15 rounded-2xl p-3 text-center">
              <p className="text-xl mb-0.5">{s.icon}</p>
              <p className="text-lg font-black">{s.value}</p>
              <p className="text-[10px] text-white/60">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-slate-100 px-4 py-2 flex-shrink-0">
        <div className="flex gap-1">
          {[['badges','🏅 Huy hiệu'], ['leaderboard','🏆 Top Sales']].map(([k, l]) => (
            <button key={k} onClick={() => setTab(k)}
              className={`flex-1 py-2 rounded-full text-xs font-semibold ${tab === k ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-600'}`}>
              {l}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {tab === 'badges' && (
          <>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Đã đạt được ({earned.length})</p>
            <div className="grid grid-cols-2 gap-3 mb-5">
              {earned.map(b => {
                const r = RARITY_STYLE[b.rarity];
                return (
                  <div key={b.id} className={`${r.bg} rounded-2xl p-4 text-center shadow-md`}>
                    <p className="text-4xl mb-2">{b.icon}</p>
                    <p className="text-white font-black text-sm">{b.label}</p>
                    <p className="text-white/70 text-[10px] mt-0.5">{b.desc}</p>
                    <p className="text-white/50 text-[10px] mt-1">{b.date}</p>
                    <span className="text-[9px] font-black text-white/80 bg-white/20 px-2 py-0.5 rounded-full">{r.label}</span>
                  </div>
                );
              })}
            </div>

            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Đang chinh phục ({inProgress.length})</p>
            <div className="space-y-2">
              {inProgress.map(b => {
                const r = RARITY_STYLE[b.rarity];
                const pct = b.unit === 'tỷ' ? Math.round((b.progress / b.target) * 100) : Math.round((b.progress / b.target) * 100);
                return (
                  <div key={b.id} className={`bg-white rounded-2xl p-3 border ${r.border} shadow-sm flex items-center gap-3`}>
                    <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 grayscale opacity-50">
                      {b.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-bold text-slate-700">{b.label}</p>
                        <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full bg-slate-100 ${r.text}`}>{r.label}</span>
                      </div>
                      <p className="text-xs text-slate-500 mb-1.5">{b.desc}</p>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-400 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5">{pct}% hoàn thành</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {tab === 'leaderboard' && (
          <div className="space-y-3">
            {/* Podium top 3 */}
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wide text-center mb-4">🏆 Top 3 tháng 04/2026</p>
              <div className="flex items-end justify-center gap-4">
                {[LEADERBOARD[1], LEADERBOARD[0], LEADERBOARD[2]].map((p, i) => {
                  const heights = ['h-16', 'h-24', 'h-12'];
                  const colors = ['bg-slate-300', 'bg-amber-400', 'bg-amber-600'];
                  return (
                    <div key={p.rank} className="flex flex-col items-center gap-2">
                      <p className="text-2xl">{p.badge}</p>
                      <p className="text-xs font-bold text-slate-700 text-center">{p.name.split(' ').slice(-1)[0]}</p>
                      <p className="text-xs text-slate-500">{fmtBn(p.revenue)}</p>
                      <div className={`w-16 ${heights[i]} ${colors[i]} rounded-t-xl flex items-center justify-center`}>
                        <span className="text-white font-black text-sm">#{p.rank}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Full list */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              {LEADERBOARD.map((p, i) => (
                <div key={p.rank} className={`flex items-center gap-3 px-4 py-3.5 border-b border-slate-50 last:border-0 ${p.rank <= 3 ? 'bg-amber-50/40' : ''}`}>
                  <span className="text-xl w-6 text-center flex-shrink-0">{p.badge}</span>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-800">{p.name}</p>
                    <p className="text-xs text-slate-500">{p.deals} giao dịch · {fmtBn(p.revenue)}</p>
                  </div>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${p.change.startsWith('+') ? 'bg-emerald-100 text-emerald-700' : p.change === '0' ? 'bg-slate-100 text-slate-500' : 'bg-red-100 text-red-600'}`}>
                    {p.change}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="h-24" />
      </div>
    </div>
  );
}
