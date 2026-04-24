/**
 * MobileLeaderboardPage.jsx — Bảng xếp hạng (Mobile)
 * Route: /kpi/leaderboard
 * API: kpiApi.getLeaderboard
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Trophy, Crown, Medal, Star } from 'lucide-react';
import { kpiApi } from '@/api/kpiApi';
import { useAuth } from '@/contexts/AuthContext';

const RANKS = {
  1: { icon: Crown,  color: 'text-yellow-500', bg: 'bg-yellow-50', border: 'border-yellow-200' },
  2: { icon: Medal,  color: 'text-slate-400',  bg: 'bg-slate-50',  border: 'border-slate-200'  },
  3: { icon: Medal,  color: 'text-amber-600',  bg: 'bg-amber-50',  border: 'border-amber-200'  },
};

function RankCard({ entry, rank, currentUserId }) {
  const RankIcon = RANKS[rank]?.icon;
  const isMe = entry.user_id === currentUserId;
  const name  = entry.display_name || entry.full_name || entry.name || 'Nhân viên';
  const score = Math.round(entry.total_score || entry.score || entry.achievement_pct || 0);
  const initials = name.split(' ').slice(-2).map(w => w[0]).join('').toUpperCase();

  return (
    <div className={`bg-white rounded-2xl border shadow-sm px-4 py-3 flex items-center gap-3 ${
      isMe ? 'border-[#316585] bg-blue-50/50' : 'border-slate-100'
    }`}>
      {/* Rank badge */}
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
        RANKS[rank] ? `${RANKS[rank].bg} ${RANKS[rank].border} border` : 'bg-slate-50'
      }`}>
        {RankIcon
          ? <RankIcon className={`w-5 h-5 ${RANKS[rank].color}`} />
          : <span className="text-sm font-black text-slate-500">#{rank}</span>
        }
      </div>

      {/* Avatar */}
      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${
        isMe ? 'bg-gradient-to-br from-[#316585] to-[#264f68]' : 'bg-gradient-to-br from-slate-400 to-slate-600'
      }`}>
        {entry.avatar_url
          ? <img src={entry.avatar_url} className="w-full h-full rounded-full object-cover" alt="" />
          : initials
        }
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-sm font-bold text-slate-800 truncate">{name}</p>
          {isMe && <span className="text-[9px] font-bold bg-[#316585] text-white px-1.5 py-0.5 rounded-full">Tôi</span>}
        </div>
        <p className="text-xs text-slate-500 truncate">{entry.role_name || entry.branch_name || '—'}</p>
      </div>

      {/* Score */}
      <div className="text-right flex-shrink-0">
        <p className="text-lg font-black text-slate-800">{score}<span className="text-xs font-medium text-slate-400">%</span></p>
      </div>
    </div>
  );
}

export default function MobileLeaderboardPage() {
  const navigate = useNavigate();
  const { user }  = useAuth();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [myRank, setMyRank]   = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await kpiApi.getLeaderboard('sales', 'company', null, user?.id);
        const list = res?.data?.data || res?.data?.entries || res?.data || res?.entries || [];
        const arr  = Array.isArray(list) ? list : [];
        setEntries(arr);
        const idx = arr.findIndex(e => e.user_id === user?.id);
        if (idx >= 0) setMyRank(idx + 1);
      } catch {}
      setLoading(false);
    })();
  }, [user]);

  return (
    <div className="h-screen bg-[#f1f5f9] flex flex-col overflow-hidden">
      {/* HEADER */}
      <div className="bg-gradient-to-br from-[#713f12] via-[#92400e] to-[#b45309] px-4 pt-12 pb-5 flex-shrink-0">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center active:scale-95">
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
          <div>
            <h1 className="text-white font-bold text-base">🏆 Bảng xếp hạng</h1>
            <p className="text-white/60 text-xs">Top Sales tháng này</p>
          </div>
        </div>

        {myRank && (
          <div className="bg-white/15 rounded-2xl px-4 py-3 flex items-center gap-3">
            <Trophy className="w-6 h-6 text-yellow-300 flex-shrink-0" />
            <div>
              <p className="text-white/70 text-xs">Xếp hạng của tôi</p>
              <p className="text-white font-black text-xl">#{myRank} <span className="text-sm font-medium text-white/70">/ {entries.length}</span></p>
            </div>
          </div>
        )}
      </div>

      {/* LIST */}
      <div className="flex-1 overflow-y-auto px-4 py-3 pb-24 space-y-2.5">
        {loading ? (
          Array.from({length: 6}).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-4 animate-pulse flex gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-100 flex-shrink-0" />
              <div className="w-10 h-10 rounded-full bg-slate-200 flex-shrink-0" />
              <div className="flex-1 space-y-2"><div className="h-3 bg-slate-100 rounded w-3/5" /><div className="h-3 bg-slate-100 rounded w-2/5" /></div>
            </div>
          ))
        ) : entries.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <Trophy className="w-12 h-12 text-slate-300 mb-3" />
            <p className="text-sm font-semibold text-slate-600">Chưa có dữ liệu xếp hạng</p>
          </div>
        ) : (
          entries.map((e, i) => (
            <RankCard key={e.user_id || i} entry={e} rank={i + 1} currentUserId={user?.id} />
          ))
        )}
      </div>
    </div>
  );
}
