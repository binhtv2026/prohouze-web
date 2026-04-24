/**
 * CareerPathPage.jsx
 * Lộ trình thăng tiến — ProHouze
 * Chức danh chuẩn theo CBRE / Savills / Vinhomes style
 */
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/contexts/AuthContext';
import {
  Award, BookOpen, CheckCircle2, ChevronRight, Circle,
  Crown, Lock, Star, Target, TrendingUp, Users, Zap,
} from 'lucide-react';

// ─── Chức danh chuẩn quốc tế (CBRE / Savills / Vinhomes) ──────────────────────
const CAREER_TRACKS = [
  {
    id: 'primary',
    label: 'Sơ cấp',
    icon: '🏢',
    color: 'from-[#1a3a52] to-[#316585]',
    accent: '#316585',
    lightBg: 'bg-blue-50',
    lightBorder: 'border-blue-200',
    lightText: 'text-blue-700',
    levels: [
      {
        id: 'sales-trainee',
        title: 'Sales Trainee',
        subtitle: 'Học việc kinh doanh',
        monthRange: 'Tháng 1–3',
        icon: '🌱',
        requirements: [
          { label: 'Hoàn thành Onboarding', done: true },
          { label: 'Đạt 50% KPI tháng', done: true },
          { label: 'Chứng chỉ văn hóa DN', done: true },
        ],
        rewards: ['Lương cơ bản', 'Mentor 1-1', 'Thiết bị làm việc'],
        kpi: 'Hỗ trợ 10 khách/tháng',
        approver: 'Sales Manager',
      },
      {
        id: 'sales-consultant',
        title: 'Sales Consultant',
        subtitle: 'Tư vấn viên kinh doanh',
        monthRange: 'Tháng 3–18',
        icon: '💼',
        requirements: [
          { label: '3 deal/tháng liên tiếp 3 tháng', done: true },
          { label: 'Doanh số 3 tỷ/quý', done: false },
          { label: 'Hoàn thành Level 1 Training', done: false },
          { label: 'NPS ≥ 8.0', done: false },
        ],
        rewards: ['Tăng lương 15%', 'Hoa hồng tier 2', 'Card danh thiếp Senior'],
        kpi: '3 deal, 1.5 tỷ/tháng',
        approver: 'Sales Manager',
      },
      {
        id: 'senior-consultant',
        title: 'Senior Consultant',
        subtitle: 'Chuyên viên tư vấn cao cấp',
        monthRange: 'Tháng 18–36',
        icon: '⭐',
        requirements: [
          { label: '5 deal/tháng liên tiếp 6 tháng', done: false },
          { label: 'Doanh số 5 tỷ/quý', done: false },
          { label: 'Hoàn thành Level 2 Training', done: false },
          { label: 'Lead 1-2 Consultant mới', done: false },
        ],
        rewards: ['Tăng lương 25%', 'Hoa hồng tier 3', 'Budget đào tạo riêng'],
        kpi: '5 deal, 2.5 tỷ/tháng',
        approver: 'Manager + BOD',
      },
      {
        id: 'team-leader',
        title: 'Team Leader',
        subtitle: 'Trưởng nhóm kinh doanh',
        monthRange: 'Năm 3–5',
        icon: '🎯',
        requirements: [
          { label: 'Doanh số cá nhân 20 tỷ/năm', done: false },
          { label: 'Lead team 3–5 người thành công', done: false },
          { label: 'Hoàn thành Leadership Course', done: false },
          { label: 'Team đạt 100% KPI quý', done: false },
        ],
        rewards: ['Phụ cấp quản lý', 'Thưởng team performance', 'Cổ phần ưu đãi'],
        kpi: 'Team 15 deal/tháng',
        approver: 'Sales Manager + Director',
      },
      {
        id: 'sales-manager',
        title: 'Sales Manager',
        subtitle: 'Quản lý kinh doanh',
        monthRange: 'Năm 5+',
        icon: '🏆',
        requirements: [
          { label: 'P&L phòng ban dương liên tiếp 4 quý', done: false },
          { label: 'Quản lý team 8+ người', done: false },
          { label: 'Doanh số phòng 50 tỷ/năm', done: false },
          { label: 'Hoàn thành Management Program', done: false },
        ],
        rewards: ['Lương executive', 'Xe công ty', 'ESOP', 'Ngân sách tuyển dụng'],
        kpi: 'Phòng 50 tỷ/năm',
        approver: 'Director + BOD',
      },
    ],
  },
  {
    id: 'secondary',
    label: 'Thứ cấp',
    icon: '🔄',
    color: 'from-[#2d1b69] to-[#7c3aed]',
    accent: '#7c3aed',
    lightBg: 'bg-violet-50',
    lightBorder: 'border-violet-200',
    lightText: 'text-violet-700',
    levels: [
      { id: 'prop-trainee', title: 'Property Trainee', subtitle: 'Thực tập viên BĐS', monthRange: 'Tháng 1–3', icon: '🌱', kpi: 'Hỗ trợ listing', approver: 'Manager', requirements: [{ label: 'Onboarding', done: true }, { label: 'Hỗ trợ 5 listing', done: true }], rewards: ['Lương cơ bản', 'Đào tạo] định giá'] },
      { id: 'prop-advisor', title: 'Property Advisor', subtitle: 'Tư vấn bất động sản', monthRange: 'Tháng 3–18', icon: '💼', kpi: '2 deal/tháng', approver: 'Manager', requirements: [{ label: '2 deal/tháng', done: false }, { label: 'Chứng chỉ định giá', done: false }], rewards: ['Hoa hồng tier 2', 'Tăng lương 15%'] },
      { id: 'senior-advisor', title: 'Senior Property Advisor', subtitle: 'Tư vấn cao cấp', monthRange: 'Tháng 18–36', icon: '⭐', kpi: '4 deal/tháng', approver: 'Manager + BOD', requirements: [{ label: '4 deal liên tiếp', done: false }, { label: 'Level 2 Training', done: false }], rewards: ['Tier 3 HH', 'Budget cá nhân'] },
      { id: 'prop-specialist', title: 'Property Specialist', subtitle: 'Chuyên gia BĐS thứ cấp', monthRange: 'Năm 3+', icon: '🏆', kpi: 'Portfolio 10 tỷ', approver: 'Director', requirements: [{ label: 'Portfolio 10 tỷ/quý', done: false }, { label: 'Lead nhóm 3 người', done: false }], rewards: ['Executive package', 'ESOP'] },
    ],
  },
  {
    id: 'leasing',
    label: 'Cho thuê',
    icon: '🔑',
    color: 'from-[#064e3b] to-[#059669]',
    accent: '#059669',
    lightBg: 'bg-emerald-50',
    lightBorder: 'border-emerald-200',
    lightText: 'text-emerald-700',
    levels: [
      { id: 'leasing-trainee', title: 'Leasing Trainee', subtitle: 'Học việc cho thuê', monthRange: 'Tháng 1–3', icon: '🌱', kpi: 'Hỗ trợ vận hành', approver: 'Manager', requirements: [{ label: 'Onboarding', done: true }, { label: 'Quy trình vận hành', done: true }], rewards: ['Lương cơ bản'] },
      { id: 'leasing-exec', title: 'Leasing Executive', subtitle: 'Chuyên viên cho thuê', monthRange: 'Tháng 3–18', icon: '💼', kpi: '3 HĐ mới/tháng', approver: 'Manager', requirements: [{ label: '3 HĐ mới/tháng', done: false }, { label: '95% thu tiền đúng hạn', done: false }], rewards: ['Hoa hồng tier 2'] },
      { id: 'senior-leasing', title: 'Senior Leasing Executive', subtitle: 'Chuyên viên cao cấp', monthRange: 'Tháng 18–36', icon: '⭐', kpi: 'Quản lý 15 tài sản', approver: 'Manager + BOD', requirements: [{ label: '15 tài sản portfolio', done: false }, { label: 'CSAT ≥ 9.0', done: false }], rewards: ['Tier 3 HH', 'Phụ cấp xe'] },
      { id: 'leasing-manager', title: 'Leasing Manager', subtitle: 'Quản lý vận hành cho thuê', monthRange: 'Năm 3+', icon: '🏆', kpi: 'Đội 50+ tài sản', approver: 'Director', requirements: [{ label: '50+ tài sản dưới quản lý', done: false }, { label: 'CSAT team ≥ 9.0', done: false }], rewards: ['Executive package'] },
    ],
  },
];

// Demo: nhân viên hiện đang ở level nào
const DEMO_CURRENT_LEVEL = { track: 'primary', levelIndex: 1 }; // Sales Consultant

export default function CareerPathPage() {
  const { user } = useAuth();
  const [activeTrack, setActiveTrack] = useState('primary');

  const track = CAREER_TRACKS.find(t => t.id === activeTrack);
  const isCurrentTrack = activeTrack === DEMO_CURRENT_LEVEL.track;
  const currentLevelIdx = isCurrentTrack ? DEMO_CURRENT_LEVEL.levelIndex : -1;

  // Tính progress cho mỗi level
  const getLevelStatus = (levelIdx) => {
    if (!isCurrentTrack) return 'locked';
    if (levelIdx < currentLevelIdx) return 'completed';
    if (levelIdx === currentLevelIdx) return 'current';
    return 'locked';
  };

  return (
    <div className="space-y-5 max-w-4xl" data-testid="career-path-page">

      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-[#316585]" /> Lộ trình thăng tiến
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Biết chính xác cần làm gì để lên cấp — chuẩn CBRE / Savills / Vinhomes
        </p>
      </div>

      {/* My current position banner */}
      <Card className="border-[#316585]/30 bg-gradient-to-r from-[#316585]/5 to-blue-50/50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#316585] flex items-center justify-center text-2xl">⭐</div>
              <div>
                <p className="text-xs text-slate-500 font-medium">VỊ TRÍ HIỆN TẠI</p>
                <p className="font-bold text-slate-900 text-lg">Sales Consultant</p>
                <p className="text-sm text-slate-500">Sơ cấp · Tháng 3–18 · {user?.full_name || 'Nhân viên'}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500 mb-1">Tiến độ lên Senior Consultant</p>
              <div className="flex items-center gap-2">
                <div className="w-32 bg-slate-200 rounded-full h-2.5">
                  <div className="bg-[#316585] h-2.5 rounded-full" style={{ width: '45%' }} />
                </div>
                <span className="text-sm font-bold text-[#316585]">45%</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">2/4 tiêu chí đạt</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Track tabs */}
      <div className="flex gap-2 overflow-x-auto">
        {CAREER_TRACKS.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTrack(t.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
              activeTrack === t.id
                ? `bg-gradient-to-r ${t.color} text-white shadow-md`
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {t.icon} {t.label}
            {t.id === DEMO_CURRENT_LEVEL.track && (
              <span className="w-1.5 h-1.5 rounded-full bg-white/80 flex-shrink-0" />
            )}
          </button>
        ))}
      </div>

      {/* Timeline levels */}
      <div className="space-y-0">
        {track.levels.map((level, idx) => {
          const status = getLevelStatus(idx);
          const isCurrent = status === 'current';
          const isCompleted = status === 'completed';
          const isLocked = status === 'locked';
          const doneReqs = level.requirements?.filter(r => r.done).length || 0;
          const totalReqs = level.requirements?.length || 0;
          const progress = totalReqs > 0 ? Math.round((doneReqs / totalReqs) * 100) : 0;

          return (
            <div key={level.id} className="flex gap-4 relative">
              {/* Vertical line */}
              {idx < track.levels.length - 1 && (
                <div className={`absolute left-5 top-11 w-0.5 h-[calc(100%-20px)] ${
                  isCompleted ? 'bg-emerald-300' : 'bg-slate-200'
                }`} />
              )}

              {/* Step icon */}
              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 z-10 mt-1 text-lg ${
                isCompleted ? 'bg-emerald-500 ring-4 ring-emerald-100' :
                isCurrent   ? 'bg-gradient-to-br from-[#316585] to-blue-500 ring-4 ring-blue-100' :
                              'bg-slate-200'
              }`}>
                {isCompleted ? '✅' : isLocked ? '🔒' : level.icon}
              </div>

              {/* Card */}
              <div className={`flex-1 mb-4 rounded-2xl border p-4 transition-all ${
                isCurrent   ? `${track.lightBorder} ${track.lightBg} shadow-sm` :
                isCompleted ? 'border-emerald-200 bg-emerald-50/30' :
                              'border-slate-200 bg-white opacity-60'
              }`}>
                <div className="flex items-start justify-between flex-wrap gap-2 mb-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className={`font-bold text-base ${isCurrent ? track.lightText : isCompleted ? 'text-emerald-700' : 'text-slate-400'}`}>
                        {level.title}
                      </h3>
                      {isCurrent && <Badge className={`text-xs ${track.lightBg} ${track.lightText} border ${track.lightBorder}`}>Đang ở đây</Badge>}
                      {isCompleted && <Badge className="text-xs bg-emerald-100 text-emerald-700 border-emerald-200">✅ Đã đạt</Badge>}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{level.subtitle} · {level.monthRange}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-400">KPI mục tiêu</p>
                    <p className="text-sm font-semibold text-slate-700">{level.kpi}</p>
                  </div>
                </div>

                {/* Requirements */}
                {level.requirements && !isLocked && (
                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-xs font-medium text-slate-600">Điều kiện thăng tiến</p>
                      <span className={`text-xs font-bold ${isCurrent ? track.lightText : 'text-emerald-600'}`}>
                        {doneReqs}/{totalReqs}
                      </span>
                    </div>
                    {isCurrent && (
                      <div className="w-full bg-slate-200 rounded-full h-1.5 mb-2">
                        <div
                          className="h-1.5 rounded-full transition-all"
                          style={{ width: `${progress}%`, backgroundColor: track.accent }}
                        />
                      </div>
                    )}
                    <div className="space-y-1">
                      {level.requirements.map((req, rIdx) => (
                        <div key={rIdx} className="flex items-center gap-2 text-xs">
                          {req.done
                            ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                            : <Circle className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />
                          }
                          <span className={req.done ? 'text-slate-500 line-through' : 'text-slate-700'}>{req.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Rewards */}
                {level.rewards && !isLocked && (
                  <div>
                    <p className="text-xs font-medium text-slate-500 mb-1.5">🎁 Phần thưởng khi đạt</p>
                    <div className="flex flex-wrap gap-1.5">
                      {level.rewards.map((r, i) => (
                        <span key={i} className="text-[11px] px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-600">
                          {r}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Approver */}
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
                  <p className="text-xs text-slate-400">
                    Duyệt bởi: <span className="text-slate-600 font-medium">{level.approver}</span>
                  </p>
                  {isCurrent && (
                    <Button size="sm" className="h-7 text-xs gap-1" style={{ backgroundColor: track.accent }}>
                      Xem yêu cầu đầy đủ <ChevronRight className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tips */}
      <Card className="border-amber-200 bg-amber-50/50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Zap className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-800 text-sm">Muốn thăng tiến nhanh hơn?</p>
              <p className="text-xs text-amber-700 mt-1">
                Hoàn thành các khóa đào tạo bắt buộc sớm hơn thời hạn, vượt KPI ≥120% trong 2 quý liên tiếp,
                và chủ động mentor cho nhân viên mới để tích lũy điểm Leadership.
              </p>
              <div className="flex gap-2 mt-2">
                <Button size="sm" variant="outline" className="h-7 text-xs border-amber-300 text-amber-800 hover:bg-amber-100">
                  Xem khóa đào tạo
                </Button>
                <Button size="sm" variant="outline" className="h-7 text-xs border-amber-300 text-amber-800 hover:bg-amber-100">
                  KPI của tôi
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
