/**
 * WarRoomMode.jsx — Chế độ Chiến Phòng bán hàng real-time
 * 10/10 LOCKED
 *
 * Features:
 * - Banner "ĐANG MỞ BÁN" với Countdown timer đến sự kiện
 * - Live Activity Feed: hiển thị ai đang xem căn nào, ai vừa giữ chỗ
 * - Booking Lock: khi Sales click "Giữ chỗ" → căn bị LOCK X phút hiển thị đếm ngược
 * - Pulse animation trên các căn đang có người xem
 * - Real-time thống kê: còn/giữ/đã cọc cập nhật liên tục
 * - Mini leaderboard Sales: ai chốt nhiều căn nhất trong event
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Zap, Users, Clock, AlertTriangle, TrendingUp,
  Activity, Lock, Unlock, Bell, X, ChevronRight,
  Target, Award,
} from 'lucide-react';
import { toast } from 'sonner';

// ─── MOCK LIVE ACTIVITY DATA ──────────────────────────────────────────────────
const SALES_AGENTS = [
  { id: 's1', name: 'Minh Tuấn', avatar: 'MT' },
  { id: 's2', name: 'Thu Hương', avatar: 'TH' },
  { id: 's3', name: 'Quốc Hùng', avatar: 'QH' },
  { id: 's4', name: 'Lan Phương', avatar: 'LP' },
  { id: 's5', name: 'Đức Nam', avatar: 'ĐN' },
  { id: 's6', name: 'Yến Nhi', avatar: 'YN' },
];

const ACTIVITY_TYPES = {
  viewing: { label: 'đang xem căn', color: 'text-blue-600', bg: 'bg-blue-50', icon: '👁️' },
  soft_lock: { label: 'vừa giữ chỗ mềm căn', color: 'text-amber-700', bg: 'bg-amber-50', icon: '🔒' },
  hard_lock: { label: 'đặt cọc căn', color: 'text-emerald-700', bg: 'bg-emerald-50', icon: '✅' },
  released: { label: 'hủy giữ chỗ căn', color: 'text-slate-500', bg: 'bg-slate-50', icon: '↩️' },
};

// Generate random activity
function generateActivity(units) {
  if (!units?.length) return null;
  const agent = SALES_AGENTS[Math.floor(Math.random() * SALES_AGENTS.length)];
  const unit = units[Math.floor(Math.random() * Math.min(units.length, 20))];
  const types = ['viewing', 'viewing', 'viewing', 'soft_lock', 'hard_lock', 'released'];
  const type = types[Math.floor(Math.random() * types.length)];
  return {
    id: Date.now() + Math.random(),
    agent,
    unit: unit?.code || '—',
    type,
    time: new Date(),
  };
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function fmtCountdown(ms) {
  if (ms <= 0) return '00:00:00';
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return [h, m, s].map(n => String(n).padStart(2, '0')).join(':');
}

function fmtLockCountdown(ms) {
  if (ms <= 0) return '0:00';
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${m}:${String(s).padStart(2, '0')}`;
}

function timeAgo(date) {
  const diff = (Date.now() - date.getTime()) / 1000;
  if (diff < 5) return 'vừa xong';
  if (diff < 60) return `${Math.floor(diff)}s trước`;
  return `${Math.floor(diff / 60)}ph trước`;
}

// ─── UNIT LOCK INDICATOR ──────────────────────────────────────────────────────
export function UnitLockBadge({ lockInfo }) {
  const [remaining, setRemaining] = useState(lockInfo?.expiresAt ? lockInfo.expiresAt - Date.now() : 0);

  useEffect(() => {
    if (!lockInfo?.expiresAt) return;
    const id = setInterval(() => {
      const r = lockInfo.expiresAt - Date.now();
      setRemaining(r);
      if (r <= 0) clearInterval(id);
    }, 1000);
    return () => clearInterval(id);
  }, [lockInfo?.expiresAt]);

  if (!lockInfo || remaining <= 0) return null;

  return (
    <div className="flex items-center gap-1 bg-amber-100 border border-amber-300 rounded-full px-2 py-0.5 text-[10px] font-bold text-amber-700 animate-pulse">
      <Lock className="w-2.5 h-2.5" />
      {fmtLockCountdown(remaining)}
    </div>
  );
}

// ─── MINI LEADERBOARD ─────────────────────────────────────────────────────────
function MiniLeaderboard({ activities }) {
  const scores = {};
  activities.forEach(a => {
    if (a.type === 'hard_lock') {
      scores[a.agent.id] = scores[a.agent.id] || { agent: a.agent, deals: 0 };
      scores[a.agent.id].deals++;
    }
  });
  const sorted = Object.values(scores).sort((a, b) => b.deals - a.deals).slice(0, 3);
  if (!sorted.length) return null;

  const medals = ['🥇', '🥈', '🥉'];
  return (
    <div className="space-y-1.5">
      {sorted.map((s, i) => (
        <div key={s.agent.id} className="flex items-center gap-2">
          <span className="text-sm">{medals[i]}</span>
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            <div className="w-6 h-6 rounded-full bg-[#316585] text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">
              {s.agent.avatar}
            </div>
            <span className="text-xs font-semibold text-slate-800 truncate">{s.agent.name}</span>
          </div>
          <span className="text-xs font-bold text-emerald-700 flex-shrink-0">{s.deals} căn</span>
        </div>
      ))}
    </div>
  );
}

// ─── ACTIVITY ITEM ────────────────────────────────────────────────────────────
function ActivityItem({ activity }) {
  const cfg = ACTIVITY_TYPES[activity.type];
  return (
    <div className={`flex items-start gap-2.5 p-2 rounded-lg ${cfg.bg} border border-transparent`}>
      <span className="text-sm flex-shrink-0 mt-0.5">{cfg.icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-slate-700">
          <span className="font-bold">{activity.agent.name}</span>
          <span className={` ${cfg.color} mx-1`}>{cfg.label}</span>
          <span className="font-bold text-slate-900">{activity.unit}</span>
        </p>
      </div>
      <span className="text-[10px] text-slate-400 flex-shrink-0">{timeAgo(activity.time)}</span>
    </div>
  );
}

// ─── WAR ROOM BANNER ─────────────────────────────────────────────────────────
function WarRoomBanner({ eventName, eventEndTime, stats, onClose }) {
  const [countdown, setCountdown] = useState(eventEndTime ? eventEndTime - Date.now() : 0);

  useEffect(() => {
    if (!eventEndTime) return;
    const id = setInterval(() => {
      const r = eventEndTime - Date.now();
      setCountdown(r);
      if (r <= 0) clearInterval(id);
    }, 1000);
    return () => clearInterval(id);
  }, [eventEndTime]);

  const isUrgent = countdown < 30 * 60 * 1000; // <30ph còn lại

  return (
    <div className={`relative rounded-2xl overflow-hidden border-2 ${isUrgent ? 'border-red-500' : 'border-[#316585]'}`}>
      {/* Gradient background */}
      <div className={`absolute inset-0 ${isUrgent
        ? 'bg-gradient-to-r from-red-600 to-red-800'
        : 'bg-gradient-to-r from-[#316585] to-[#1d4e6e]'}`} />

      {/* Pulse rings for urgent */}
      {isUrgent && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-full h-full bg-red-500 opacity-10 animate-ping" style={{ animationDuration: '1s' }} />
        </div>
      )}

      <div className="relative p-4">
        <div className="flex items-center justify-between gap-4">
          {/* Left: Event name + animated badge */}
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isUrgent ? 'bg-red-400' : 'bg-white/20'}`}>
                <Zap className="w-6 h-6 text-white" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white/70 uppercase tracking-wider">⚡ Chiến Phòng Đang Hoạt Động</span>
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              </div>
              <h2 className="text-white font-bold text-lg leading-tight">{eventName}</h2>
            </div>
          </div>

          {/* Center: Countdown */}
          <div className="text-center flex-shrink-0">
            <div className="text-[10px] text-white/60 uppercase tracking-wider mb-1">
              {countdown > 0 ? 'Thời gian còn lại' : 'Đã kết thúc'}
            </div>
            <div className={`font-mono font-black text-3xl ${isUrgent ? 'text-red-200 animate-pulse' : 'text-white'}`}>
              {fmtCountdown(countdown)}
            </div>
          </div>

          {/* Right: Live stats */}
          <div className="flex items-center gap-4 flex-shrink-0">
            {[
              { label: 'Còn trống', value: stats.available, color: 'text-emerald-300' },
              { label: 'Đang giữ', value: stats.held + stats.reserved, color: 'text-amber-300' },
              { label: 'Đã chốt', value: stats.sold + stats.booked, color: 'text-white' },
            ].map(s => (
              <div key={s.label} className="text-center">
                <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
                <div className="text-[10px] text-white/60">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Close */}
          <button onClick={onClose} className="flex-shrink-0 p-1.5 rounded-lg hover:bg-white/10 transition-colors">
            <X className="w-4 h-4 text-white/70" />
          </button>
        </div>

        {/* Progress bar */}
        {stats.total > 0 && (
          <div className="mt-3">
            <div className="h-1.5 rounded-full bg-white/20">
              <div className="h-1.5 rounded-full bg-white transition-all"
                style={{ width: `${Math.round(((stats.sold + stats.booked) / stats.total) * 100)}%` }} />
            </div>
            <div className="flex justify-between text-[10px] text-white/60 mt-1">
              <span>{Math.round(((stats.sold + stats.booked) / stats.total) * 100)}% đã được chốt</span>
              <span>{stats.total} căn tổng</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── MAIN WAR ROOM COMPONENT ──────────────────────────────────────────────────
export default function WarRoomMode({
  units = [],
  eventName = 'Mở bán đợt 1 — The Opus One Block A',
  eventEndTime = Date.now() + 2 * 3600 * 1000, // 2h from now
  onUnitLock,
  onClose,
}) {
  const [activities, setActivities] = useState([]);
  const [lockedUnits, setLockedUnits] = useState({}); // unitId → { expiresAt, agentName }
  const [activeViewers, setActiveViewers] = useState({}); // unitId → count
  const [showWarRoom, setShowWarRoom] = useState(true);
  const activityRef = useRef(null);

  // Simulated real-time activity feed
  useEffect(() => {
    const generateInitial = () => {
      const initial = [];
      for (let i = 0; i < 5; i++) {
        const a = generateActivity(units);
        if (a) initial.push({ ...a, time: new Date(Date.now() - (5 - i) * 15000) });
      }
      setActivities(initial);
    };
    generateInitial();
  }, [units]);

  useEffect(() => {
    if (!units.length) return;
    const id = setInterval(() => {
      const a = generateActivity(units);
      if (!a) return;
      setActivities(prev => [a, ...prev.slice(0, 19)]); // keep last 20

      // Update active viewers
      if (a.type === 'viewing') {
        setActiveViewers(prev => ({
          ...prev,
          [a.unit]: (prev[a.unit] || 0) + 1,
        }));
        setTimeout(() => {
          setActiveViewers(prev => {
            const next = { ...prev };
            next[a.unit] = Math.max(0, (next[a.unit] || 1) - 1);
            return next;
          });
        }, 30000);
      }

      // Sound-like notification for hot locks
      if (a.type === 'hard_lock') {
        toast.success(`⚡ ${a.agent.name} vừa chốt căn ${a.unit}!`, { duration: 4000 });
      }
    }, 8000 + Math.random() * 7000); // Every 8-15s

    return () => clearInterval(id);
  }, [units]);

  // Clean expired locks
  useEffect(() => {
    const id = setInterval(() => {
      const now = Date.now();
      setLockedUnits(prev => {
        const next = { ...prev };
        let changed = false;
        Object.keys(next).forEach(k => {
          if (next[k].expiresAt <= now) {
            delete next[k];
            changed = true;
          }
        });
        return changed ? next : prev;
      });
    }, 5000);
    return () => clearInterval(id);
  }, []);

  const handleManualLock = useCallback((unitCode, minutes = 10) => {
    const expiresAt = Date.now() + minutes * 60 * 1000;
    setLockedUnits(prev => ({
      ...prev,
      [unitCode]: { expiresAt, agentName: 'Bạn', minutes },
    }));
    setActivities(prev => [{
      id: Date.now(),
      agent: { id: 'me', name: 'Bạn', avatar: '★' },
      unit: unitCode,
      type: 'soft_lock',
      time: new Date(),
    }, ...prev.slice(0, 19)]);
    onUnitLock?.(unitCode, expiresAt);
    toast.success(`🔒 Đã giữ chỗ mềm căn ${unitCode} trong ${minutes} phút`, { duration: 5000 });
  }, [onUnitLock]);

  // Stats
  const stats = {
    available: units.filter(u => u.status === 'available').length,
    reserved: units.filter(u => u.status === 'reserved').length,
    held: units.filter(u => u.status === 'held').length,
    booked: units.filter(u => u.status === 'booked').length,
    sold: units.filter(u => u.status === 'sold').length,
    total: units.length,
    activeAgents: new Set(activities.slice(0, 10).map(a => a.agent.id)).size,
  };

  return (
    <div className="space-y-4">
      {/* War Room Banner */}
      {showWarRoom && (
        <WarRoomBanner
          eventName={eventName}
          eventEndTime={eventEndTime}
          stats={stats}
          onClose={() => setShowWarRoom(false)}
        />
      )}

      {!showWarRoom && (
        <button
          className="w-full flex items-center justify-center gap-2 py-2 rounded-xl border-2 border-dashed border-[#316585] text-[#316585] text-sm font-semibold hover:bg-[#316585]/5 transition-colors"
          onClick={() => setShowWarRoom(true)}>
          <Zap className="w-4 h-4" /> Hiện lại Chiến Phòng
        </button>
      )}

      {/* War Room Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Live Activity Feed */}
        <div className="lg:col-span-2">
          <Card className="border shadow-none">
            <div className="flex items-center justify-between px-4 pt-4 pb-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-sm font-bold text-slate-800">Hoạt động thời gian thực</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <Users className="w-3.5 h-3.5" />
                <span>{stats.activeAgents} sales đang hoạt động</span>
              </div>
            </div>
            <CardContent className="p-3 space-y-2 max-h-64 overflow-y-auto" ref={activityRef}>
              {activities.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-sm">
                  <Activity className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  Đang chờ hoạt động...
                </div>
              ) : (
                activities.map(a => <ActivityItem key={a.id} activity={a} />)
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Panel: Stats + Leaderboard + Locks */}
        <div className="space-y-3">
          {/* Active Locks */}
          <Card className="border shadow-none">
            <div className="px-4 pt-4 pb-2">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-600" />
                <span className="text-sm font-bold text-slate-800">Căn đang bị khóa</span>
              </div>
            </div>
            <CardContent className="p-3">
              {Object.keys(lockedUnits).length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-3">Không có căn nào đang bị khóa</p>
              ) : (
                <div className="space-y-2">
                  {Object.entries(lockedUnits).map(([code, lock]) => (
                    <div key={code} className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-2">
                      <div>
                        <p className="text-xs font-bold text-slate-800">Căn {code}</p>
                        <p className="text-[10px] text-slate-500">{lock.agentName} đang giữ</p>
                      </div>
                      <UnitLockBadge lockInfo={lock} />
                    </div>
                  ))}
                </div>
              )}
              <Button
                size="sm"
                className="w-full mt-2 text-xs bg-amber-500 hover:bg-amber-600 h-8"
                onClick={() => handleManualLock('DEMO-01')}
              >
                <Lock className="w-3 h-3 mr-1" /> Test Khóa căn DEMO-01
              </Button>
            </CardContent>
          </Card>

          {/* Mini Leaderboard */}
          <Card className="border shadow-none">
            <div className="px-4 pt-4 pb-2">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-500" />
                <span className="text-sm font-bold text-slate-800">BXH hôm nay</span>
              </div>
            </div>
            <CardContent className="p-3">
              {activities.length > 0 ? (
                <MiniLeaderboard activities={activities} />
              ) : (
                <p className="text-xs text-slate-400 text-center py-3">Chưa có giao dịch</p>
              )}
            </CardContent>
          </Card>

          {/* Quick Lock Panel */}
          <Card className="border shadow-none">
            <div className="px-4 pt-4 pb-2">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#316585]" />
                <span className="text-sm font-bold text-slate-800">Khóa nhanh căn hộ</span>
              </div>
            </div>
            <CardContent className="p-3 space-y-2">
              <p className="text-[10px] text-slate-500">Giữ chỗ mềm — tự động hủy sau thời gian quy định</p>
              {[
                { label: '5 phút', minutes: 5, color: 'border-emerald-300 text-emerald-700 hover:bg-emerald-50' },
                { label: '10 phút', minutes: 10, color: 'border-blue-300 text-blue-700 hover:bg-blue-50' },
                { label: '30 phút', minutes: 30, color: 'border-amber-300 text-amber-700 hover:bg-amber-50' },
              ].map(opt => (
                <Button key={opt.minutes} variant="outline"
                  className={`w-full h-8 text-xs ${opt.color}`}
                  onClick={() => toast.info(`Chọn căn trên sơ đồ để khóa ${opt.label}`)}>
                  <Lock className="w-3 h-3 mr-1" /> Giữ chỗ {opt.label}
                </Button>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
