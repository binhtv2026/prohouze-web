/**
 * MobileCheckinPage.jsx — Chấm công & Ca trực (Base Schedule)
 * Check-in/out GPS · Lịch ca · Tổng hợp ngày công
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, MapPin, Clock, CheckCircle2, LogIn, LogOut,
  Calendar, ChevronRight, AlertCircle, Users, Briefcase,
  Sun, Moon, Sunset, Coffee,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const SHIFTS = [
  { key: 'sang',   label: 'Ca Sáng',   time: '08:00 – 12:00', icon: Sun,    color: 'text-amber-500',  bg: 'bg-amber-50' },
  { key: 'chieu',  label: 'Ca Chiều',  time: '13:00 – 17:00', icon: Sunset, color: 'text-orange-500', bg: 'bg-orange-50' },
  { key: 'full',   label: 'Cả ngày',   time: '08:00 – 17:00', icon: Briefcase,color:'text-blue-600',  bg: 'bg-blue-50' },
  { key: 'toi',    label: 'Ca Tối',    time: '18:00 – 22:00', icon: Moon,   color: 'text-violet-600', bg: 'bg-violet-50' },
];

const MOCK_HISTORY = [
  { date: '19/04', shift: 'Cả ngày', inTime: '07:58', outTime: '17:12', status: 'full', late: false },
  { date: '18/04', shift: 'Cả ngày', inTime: '08:05', outTime: '17:00', status: 'full', late: true },
  { date: '17/04', shift: 'Ca Sáng', inTime: '07:55', outTime: '12:03', status: 'half', late: false },
  { date: '16/04', shift: 'Cả ngày', inTime: '08:00', outTime: '17:30', status: 'full', late: false },
  { date: '15/04', shift: 'Nghỉ phép', inTime: '--',  outTime: '--',    status: 'leave', late: false },
  { date: '14/04', shift: 'Cả ngày', inTime: '08:10', outTime: '17:05', status: 'full', late: true },
];

const TEAM_STATUS = [
  { name: 'Trần Minh Khoa',  status: 'in',    inTime: '07:55', shift: 'Cả ngày', avatar: 'TK' },
  { name: 'Lê Thu Hương',    status: 'in',    inTime: '08:02', shift: 'Cả ngày', avatar: 'LH' },
  { name: 'Nguyễn Phúc Hùng',status: 'out',   inTime: '08:00', shift: 'Ca Sáng', avatar: 'NH' },
  { name: 'Phạm Thùy Linh',  status: 'leave', inTime: '--',    shift: 'Nghỉ phép',avatar: 'PL' },
  { name: 'Võ Thị Kim Anh',  status: 'not_in',inTime: '--',    shift: 'Ca Chiều', avatar: 'VA' },
];

const STATUS_STYLE = {
  full:  { label: 'Đủ công',    color: 'text-emerald-600', bg: 'bg-emerald-50' },
  half:  { label: 'Nửa ngày',   color: 'text-amber-600',   bg: 'bg-amber-50' },
  late:  { label: 'Trễ',        color: 'text-red-500',     bg: 'bg-red-50' },
  leave: { label: 'Nghỉ phép',  color: 'text-violet-600',  bg: 'bg-violet-50' },
  absent:{ label: 'Vắng',       color: 'text-red-600',     bg: 'bg-red-50' },
};

function getNow() {
  const d = new Date();
  return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function getDate() {
  return new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default function MobileCheckinPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isManager = ['manager', 'bod', 'admin', 'hr'].includes(user?.role);

  const [nowTime, setNowTime] = useState(getNow());
  const [checkedIn, setCheckedIn] = useState(false);
  const [inTime, setInTime] = useState(null);
  const [outTime, setOutTime] = useState(null);
  const [selectedShift, setSelectedShift] = useState('full');
  const [tab, setTab] = useState('personal'); // personal | team | history
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setNowTime(getNow()), 1000);
    return () => clearInterval(t);
  }, []);

  const handleCheckin = () => {
    setLoading(true);
    setTimeout(() => {
      setCheckedIn(true);
      setInTime(getNow().slice(0, 5));
      toast.success(`✅ Check-in lúc ${getNow().slice(0,5)} — ${SHIFTS.find(s=>s.key===selectedShift)?.label}`);
      setLoading(false);
    }, 1000);
  };

  const handleCheckout = () => {
    setLoading(true);
    setTimeout(() => {
      setOutTime(getNow().slice(0, 5));
      toast.success(`👋 Check-out lúc ${getNow().slice(0,5)} — Về nhà an toàn nhé!`);
      setLoading(false);
    }, 800);
  };

  const workDays = MOCK_HISTORY.filter(h => h.status === 'full' || h.status === 'half').length;
  const lateCount = MOCK_HISTORY.filter(h => h.late).length;

  return (
    <div className="h-screen bg-[#f1f5f9] flex flex-col overflow-hidden">
      {/* HEADER */}
      <div className="flex-shrink-0 px-4 pt-12 pb-4 bg-white border-b border-slate-100">
        <div className="flex items-center gap-3 mb-1">
          <button onClick={() => navigate(-1)} className="w-9 h-9 bg-slate-100 rounded-full flex items-center justify-center">
            <ArrowLeft className="w-4 h-4 text-slate-600" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Chấm công</h1>
            <p className="text-xs text-slate-500">{getDate()}</p>
          </div>
        </div>
        {/* Tabs */}
        <div className="flex gap-1 mt-3">
          {[['personal','Của tôi'], ...(isManager ? [['team','Đội nhóm']] : []), ['history','Lịch sử']].map(([k, l]) => (
            <button key={k} onClick={() => setTab(k)}
              className={`flex-1 py-2 rounded-full text-xs font-semibold transition-all ${tab === k ? 'bg-[#316585] text-white' : 'bg-slate-100 text-slate-600'}`}>
              {l}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">

        {tab === 'personal' && (
          <>
            {/* Clock */}
            <div className="bg-gradient-to-br from-[#316585] to-[#1a3f52] rounded-3xl p-6 text-center text-white mb-4 shadow-lg">
              <p className="text-5xl font-black tracking-tight mb-1">{nowTime.slice(0,5)}</p>
              <p className="text-white/60 text-sm mb-4">{nowTime.slice(6)}</p>

              {/* Status line */}
              {inTime && (
                <div className="flex justify-center gap-6 text-sm mb-4 bg-white/10 rounded-2xl py-3">
                  <div>
                    <p className="text-white/60 text-xs mb-0.5">Check-in</p>
                    <p className="font-bold text-emerald-300">{inTime}</p>
                  </div>
                  {outTime && (
                    <div>
                      <p className="text-white/60 text-xs mb-0.5">Check-out</p>
                      <p className="font-bold text-amber-300">{outTime}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Action button */}
              {!checkedIn ? (
                <button
                  onClick={handleCheckin}
                  disabled={loading}
                  className="w-full py-4 bg-emerald-400 hover:bg-emerald-300 text-white font-bold rounded-2xl text-base flex items-center justify-center gap-2 disabled:opacity-60 transition-all active:scale-95"
                >
                  <LogIn className="w-5 h-5" />
                  {loading ? 'Đang xử lý...' : 'Check-in ngay'}
                </button>
              ) : !outTime ? (
                <button
                  onClick={handleCheckout}
                  disabled={loading}
                  className="w-full py-4 bg-amber-400 hover:bg-amber-300 text-white font-bold rounded-2xl text-base flex items-center justify-center gap-2 disabled:opacity-60 transition-all active:scale-95"
                >
                  <LogOut className="w-5 h-5" />
                  {loading ? 'Đang xử lý...' : 'Check-out'}
                </button>
              ) : (
                <div className="py-3 flex items-center justify-center gap-2 bg-white/10 rounded-2xl">
                  <CheckCircle2 className="w-5 h-5 text-emerald-300" />
                  <span className="font-bold text-emerald-300">Hoàn thành ca hôm nay!</span>
                </div>
              )}
            </div>

            {/* Shift selector */}
            {!checkedIn && (
              <div className="bg-white rounded-2xl p-4 mb-4 shadow-sm">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Chọn ca làm việc</p>
                <div className="grid grid-cols-2 gap-2">
                  {SHIFTS.map(s => (
                    <button key={s.key} onClick={() => setSelectedShift(s.key)}
                      className={`flex items-center gap-2 p-3 rounded-xl border transition-all ${selectedShift === s.key ? 'border-[#316585] bg-[#316585]/5' : 'border-slate-200 bg-slate-50'}`}>
                      <div className={`w-8 h-8 ${s.bg} rounded-lg flex items-center justify-center flex-shrink-0`}>
                        <s.icon className={`w-4 h-4 ${s.color}`} />
                      </div>
                      <div className="text-left">
                        <p className={`text-xs font-bold ${selectedShift === s.key ? 'text-[#316585]' : 'text-slate-700'}`}>{s.label}</p>
                        <p className="text-[10px] text-slate-400">{s.time}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Summary tháng */}
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Tháng 04/2026</p>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Ngày công', value: workDays, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                  { label: 'Đi trễ', value: lateCount, color: 'text-red-500', bg: 'bg-red-50' },
                  { label: 'Nghỉ phép', value: 1, color: 'text-violet-600', bg: 'bg-violet-50' },
                ].map(s => (
                  <div key={s.label} className={`${s.bg} rounded-xl p-3 text-center`}>
                    <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
                    <p className="text-[10px] text-slate-500 font-medium">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Location */}
              <div className="mt-3 flex items-center gap-2 bg-slate-50 rounded-xl p-3">
                <MapPin className="w-4 h-4 text-[#316585] flex-shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-slate-700">Vị trí check-in</p>
                  <p className="text-xs text-slate-500">Văn phòng ANKAPU — 98 Nguyễn Văn Linh, Đà Nẵng</p>
                </div>
              </div>
            </div>
          </>
        )}

        {tab === 'team' && isManager && (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100">
              <p className="font-bold text-slate-800">Trạng thái hôm nay — {new Date().toLocaleDateString('vi-VN')}</p>
            </div>
            {TEAM_STATUS.map((emp, i) => {
              const statusDot = emp.status === 'in' ? 'bg-emerald-400' : emp.status === 'out' ? 'bg-blue-400' : emp.status === 'leave' ? 'bg-violet-400' : 'bg-slate-300';
              const statusLabel = emp.status === 'in' ? 'Đang làm' : emp.status === 'out' ? 'Đã về' : emp.status === 'leave' ? 'Nghỉ phép' : 'Chưa check-in';
              return (
                <div key={i} className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-50 last:border-0">
                  <div className="relative">
                    <div className="w-10 h-10 bg-[#316585] rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">{emp.avatar}</span>
                    </div>
                    <div className={`absolute bottom-0 right-0 w-3 h-3 ${statusDot} rounded-full border-2 border-white`} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-800">{emp.name}</p>
                    <p className="text-xs text-slate-500">{emp.shift} · Check-in: {emp.inTime}</p>
                  </div>
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                    emp.status === 'in' ? 'bg-emerald-100 text-emerald-700' :
                    emp.status === 'out' ? 'bg-blue-100 text-blue-700' :
                    emp.status === 'leave' ? 'bg-violet-100 text-violet-700' :
                    'bg-slate-100 text-slate-500'
                  }`}>{statusLabel}</span>
                </div>
              );
            })}
          </div>
        )}

        {tab === 'history' && (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100">
              <p className="font-bold text-slate-800">Lịch sử chấm công — Tháng 04</p>
            </div>
            {MOCK_HISTORY.map((h, i) => {
              const s = STATUS_STYLE[h.status] || STATUS_STYLE.full;
              return (
                <div key={i} className="flex items-center gap-3 px-4 py-3 border-b border-slate-50 last:border-0">
                  <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <p className="text-xs font-bold text-slate-600">{h.date}</p>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-800">{h.shift}</p>
                    <p className="text-xs text-slate-500">
                      {h.inTime !== '--' ? `Vào: ${h.inTime} · Ra: ${h.outTime}` : 'Không có dữ liệu'}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${s.bg} ${s.color}`}>{s.label}</span>
                    {h.late && <span className="text-[10px] text-red-500 font-semibold">⚠️ Trễ</span>}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="h-24" />
      </div>
    </div>
  );
}
