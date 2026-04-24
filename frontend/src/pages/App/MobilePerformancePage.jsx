/**
 * MobilePerformancePage.jsx — Đánh giá Hiệu suất (Base Review)
 * KPI quý · 360° Feedback · Mục tiêu cá nhân
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Target, TrendingUp, Star, Award,
  ChevronDown, CheckCircle2, MessageSquare, BarChart3,
  Users, Zap,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const MY_KPIS = [
  { label: 'Doanh số tháng',     target: 20e9,   actual: 15.6e9, unit: 'tỷ',  pct: 78, color: 'bg-blue-500' },
  { label: 'Số giao dịch',       target: 4,      actual: 3,      unit: 'GD',  pct: 75, color: 'bg-violet-500' },
  { label: 'Khách hàng mới',     target: 20,     actual: 18,     unit: 'KH',  pct: 90, color: 'bg-emerald-500' },
  { label: 'Tỷ lệ chuyển đổi',  target: 30,     actual: 22,     unit: '%',   pct: 73, color: 'bg-amber-500' },
  { label: 'Chấm công',          target: 22,     actual: 21,     unit: 'ngày',pct: 95, color: 'bg-teal-500' },
];

const FEEDBACK_RECEIVED = [
  { from: 'Nguyễn Văn Manager', role: 'Trưởng phòng', score: 4.5, comment: 'Tinh thần làm việc tốt, chủ động. Cần cải thiện kỹ năng chốt deal và xử lý phản đối.', date: 'Q1/2026' },
  { from: 'Lê Thu Hương',       role: 'Đồng nghiệp',  score: 4.8, comment: 'Hỗ trợ team rất nhiệt tình, kiến thức sản phẩm rất tốt.', date: 'Q1/2026' },
  { from: 'Trần Minh Khoa',     role: 'Đồng nghiệp',  score: 4.2, comment: 'Làm việc nhóm tốt, đôi khi cần quyết đoán hơn.', date: 'Q1/2026' },
];

const GOALS = [
  { title: 'Đạt 3 giao dịch tháng 05', deadline: '31/05/2026', progress: 30, status: 'active' },
  { title: 'Hoàn thành khóa học Đàm phán BĐS', deadline: '15/05/2026', progress: 60, status: 'active' },
  { title: 'Tăng tỷ lệ chuyển đổi lên 35%', deadline: '30/06/2026', progress: 20, status: 'active' },
  { title: 'Mời 5 khách tham quan dự án', deadline: '30/04/2026', progress: 100, status: 'done' },
];

const formatVal = (n, unit) => {
  if (unit === 'tỷ') return (n / 1e9).toFixed(1) + ' tỷ';
  return n + ' ' + unit;
};

function KPIBar({ kpi }) {
  const good = kpi.pct >= 80;
  const warn = kpi.pct >= 60 && kpi.pct < 80;
  const barColor = good ? 'bg-emerald-500' : warn ? 'bg-amber-400' : 'bg-red-400';

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-1.5">
        <p className="text-sm font-medium text-slate-700">{kpi.label}</p>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-bold ${good ? 'text-emerald-600' : warn ? 'text-amber-600' : 'text-red-500'}`}>
            {formatVal(kpi.actual, kpi.unit)} / {formatVal(kpi.target, kpi.unit)}
          </span>
          <span className={`text-xs font-black px-1.5 py-0.5 rounded-full ${good ? 'bg-emerald-100 text-emerald-700' : warn ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-600'}`}>
            {kpi.pct}%
          </span>
        </div>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full ${barColor} rounded-full transition-all duration-700`} style={{ width: `${kpi.pct}%` }} />
      </div>
    </div>
  );
}

export default function MobilePerformancePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tab, setTab] = useState('kpi');

  const overallScore = Math.round(MY_KPIS.reduce((a, b) => a + b.pct, 0) / MY_KPIS.length);
  const avgFeedback = (FEEDBACK_RECEIVED.reduce((a, b) => a + b.score, 0) / FEEDBACK_RECEIVED.length).toFixed(1);

  return (
    <div className="h-screen bg-[#f1f5f9] flex flex-col overflow-hidden">
      <div
        className="flex-shrink-0 px-4 pt-12 pb-5 text-white"
        style={{ background: 'linear-gradient(135deg, #316585 0%, #1e4560 100%)' }}
      >
        <div className="flex items-center gap-3 mb-5">
          <button onClick={() => navigate(-1)} className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center">
            <ArrowLeft className="w-4 h-4 text-white" />
          </button>
          <div>
            <h1 className="text-xl font-bold">Đánh giá hiệu suất</h1>
            <p className="text-white/70 text-xs">Q2/2026 · Tháng 04</p>
          </div>
        </div>

        {/* Overall scores */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'KPI tổng', value: overallScore + '%', sub: 'Trung bình', good: overallScore >= 80 },
            { label: 'Đánh giá', value: avgFeedback + '/5', sub: 'Từ đồng nghiệp', good: true },
            { label: 'Xếp hạng', value: '#3', sub: 'Trong nhóm', good: true },
          ].map(s => (
            <div key={s.label} className="bg-white/15 rounded-2xl p-3 text-center">
              <p className={`text-xl font-black ${s.good ? 'text-white' : 'text-amber-300'}`}>{s.value}</p>
              <p className="text-[10px] text-white/70 font-medium">{s.label}</p>
              <p className="text-[9px] text-white/50">{s.sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-slate-100 px-4 py-2 flex-shrink-0">
        <div className="flex gap-1">
          {[['kpi','📊 KPI'], ['feedback','💬 Feedback'], ['goals','🎯 Mục tiêu']].map(([k, l]) => (
            <button key={k} onClick={() => setTab(k)}
              className={`flex-1 py-2 rounded-full text-xs font-semibold transition-all ${tab === k ? 'bg-[#316585] text-white' : 'bg-slate-100 text-slate-600'}`}>
              {l}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {tab === 'kpi' && (
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <h3 className="font-bold text-slate-800 mb-4">KPI tháng 04/2026</h3>
            {MY_KPIS.map(kpi => <KPIBar key={kpi.label} kpi={kpi} />)}
          </div>
        )}

        {tab === 'feedback' && (
          <div className="space-y-3">
            {FEEDBACK_RECEIVED.map((fb, i) => (
              <div key={i} className="bg-white rounded-2xl p-4 shadow-sm">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-sm font-bold text-slate-800">{fb.from}</p>
                    <p className="text-xs text-slate-500">{fb.role} · {fb.date}</p>
                  </div>
                  <div className="flex items-center gap-1 bg-amber-50 border border-amber-200 rounded-full px-2 py-1">
                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                    <span className="text-xs font-black text-amber-700">{fb.score}</span>
                  </div>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 rounded-xl p-3 italic">
                  "{fb.comment}"
                </p>
              </div>
            ))}

            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
              <p className="text-xs font-bold text-blue-700 mb-1">📝 Phản hồi của bạn</p>
              <textarea rows={3} placeholder="Đánh giá bản thân và đặt mục tiêu cải thiện..."
                className="w-full bg-white border border-blue-200 rounded-xl p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-300" />
              <button className="mt-2 w-full py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold">Gửi tự đánh giá</button>
            </div>
          </div>
        )}

        {tab === 'goals' && (
          <div className="space-y-3">
            {GOALS.map((g, i) => (
              <div key={i} className={`bg-white rounded-2xl p-4 shadow-sm border ${g.status === 'done' ? 'border-emerald-200' : 'border-slate-100'}`}>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-start gap-2">
                    {g.status === 'done'
                      ? <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                      : <Target className="w-5 h-5 text-[#316585] flex-shrink-0 mt-0.5" />}
                    <p className="text-sm font-semibold text-slate-800">{g.title}</p>
                  </div>
                  <span className="text-[10px] text-slate-400 flex-shrink-0">HN: {g.deadline}</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden mb-1">
                  <div
                    className={`h-full rounded-full ${g.status === 'done' ? 'bg-emerald-500' : 'bg-[#316585]'}`}
                    style={{ width: `${g.progress}%` }}
                  />
                </div>
                <p className="text-xs text-slate-400">{g.progress}% hoàn thành</p>
              </div>
            ))}
            <button className="w-full py-3 border-2 border-dashed border-slate-300 rounded-2xl text-sm text-slate-500 font-medium flex items-center justify-center gap-2">
              <Zap className="w-4 h-4" /> + Thêm mục tiêu mới
            </button>
          </div>
        )}

        <div className="h-24" />
      </div>
    </div>
  );
}
