/**
 * TrainingHubPage.jsx — A4
 * Training Hub nâng cấp: 4 tab: Văn hóa DN | Phòng ban | Cấp bậc | Thư viện BĐS
 */
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/contexts/AuthContext';
import {
  BookOpen, Building2, CheckCircle2, ChevronRight,
  GraduationCap, Key, Lock, Play, RefreshCw,
  Star, Target, Users, Video, Zap, Award, FileText,
  Heart, Globe, TrendingUp, Scale, DollarSign,
} from 'lucide-react';

// ─── Tab config ───────────────────────────────────────────────────────────────
const TABS = [
  { key: 'culture',    label: 'Văn hóa DN',    icon: Heart },
  { key: 'department', label: 'Phòng ban',      icon: Building2 },
  { key: 'level',      label: 'Theo cấp bậc',  icon: Star },
  { key: 'library',    label: 'Thư viện BĐS',  icon: BookOpen },
];

// ─── A. Văn hóa doanh nghiệp ─────────────────────────────────────────────────
const CULTURE_LESSONS = [
  { id: 'c1', title: 'Sứ mệnh & Tầm nhìn', desc: 'ProHouze tồn tại để làm gì, đi đến đâu?', duration: '20 phút', icon: '🎯', progress: 100, mandatory: true },
  { id: 'c2', title: 'Giá trị cốt lõi', desc: '5 giá trị: Chính trực · Tận tâm · Chuyên nghiệp · Đổi mới · Hợp tác', duration: '25 phút', icon: '💎', progress: 100, mandatory: true },
  { id: 'c3', title: 'Quy tắc ứng xử', desc: 'Dress code, giao tiếp nội bộ và khách hàng', duration: '15 phút', icon: '🤝', progress: 60, mandatory: true },
  { id: 'c4', title: 'Quy trình nội bộ', desc: 'Check-in, báo cáo, họp, deadline', duration: '20 phút', icon: '📋', progress: 0, mandatory: true },
  { id: 'c5', title: 'Phúc lợi & Quyền lợi', desc: 'Lương, thưởng, nghỉ phép, BHXH, đào tạo', duration: '15 phút', icon: '🎁', progress: 0, mandatory: false },
  { id: 'c6', title: 'Câu chuyện thành công', desc: 'Case study từ các Senior trong công ty', duration: '30 phút', icon: '🌟', progress: 0, mandatory: false },
];

// ─── B. Phòng ban ─────────────────────────────────────────────────────────────
const DEPARTMENTS = [
  {
    id: 'primary', icon: '🏢', label: 'Kinh doanh Sơ cấp', accent: 'bg-blue-100 text-blue-700 border-blue-200',
    courses: [
      { title: 'Quy trình bán BĐS sơ cấp', hours: 4, level: 'Cơ bản', done: true },
      { title: 'Pháp lý căn hộ & dự án', hours: 3, level: 'Cơ bản', done: true },
      { title: 'Kỹ năng tư vấn 1-1, xử lý objection', hours: 6, level: 'Trung cấp', done: false },
      { title: 'Chốt deal & pipeline management', hours: 8, level: 'Nâng cao', done: false },
    ],
  },
  {
    id: 'secondary', icon: '🔄', label: 'Kinh doanh Thứ cấp', accent: 'bg-violet-100 text-violet-700 border-violet-200',
    courses: [
      { title: 'Định giá BĐS thứ cấp', hours: 4, level: 'Cơ bản', done: false },
      { title: 'Thủ tục sang nhượng pháp lý', hours: 3, level: 'Cơ bản', done: false },
      { title: 'Match bên mua-bán, cross-sell', hours: 5, level: 'Trung cấp', done: false },
    ],
  },
  {
    id: 'leasing', icon: '🔑', label: 'Cho thuê', accent: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    courses: [
      { title: 'Pháp lý hợp đồng thuê', hours: 3, level: 'Cơ bản', done: false },
      { title: 'Quy trình vận hành tài sản', hours: 4, level: 'Cơ bản', done: false },
      { title: 'Quản lý khách thuê, xử lý tranh chấp', hours: 4, level: 'Trung cấp', done: false },
    ],
  },
  {
    id: 'marketing', icon: '📣', label: 'Marketing', accent: 'bg-rose-100 text-rose-700 border-rose-200',
    courses: [
      { title: 'Digital Marketing BĐS', hours: 5, level: 'Cơ bản', done: false },
      { title: 'Content & Video dự án', hours: 4, level: 'Trung cấp', done: false },
      { title: 'CRM & Data Analytics', hours: 6, level: 'Nâng cao', done: false },
    ],
  },
];

// ─── C. Cấp bậc ───────────────────────────────────────────────────────────────
const LEVEL_PLAYLISTS = [
  {
    level: 'Sales Trainee', icon: '🌱', locked: false, progress: 80,
    courses: ['Onboarding văn hóa DN', 'Pháp lý cơ bản', 'Quy trình làm việc', 'Kỹ năng giao tiếp'],
  },
  {
    level: 'Sales Consultant', icon: '💼', locked: false, progress: 45,
    courses: ['Kỹ năng chốt deal', 'CRM & Pipeline', 'Quản lý thời gian', 'Xử lý objection Level 1'],
  },
  {
    level: 'Senior Consultant', icon: '⭐', locked: true, progress: 0,
    courses: ['Mentoring nhân viên mới', 'Phân tích thị trường', 'Định giá nâng cao', 'Xử lý objection Level 2'],
  },
  {
    level: 'Team Leader', icon: '🎯', locked: true, progress: 0,
    courses: ['Leadership Fundamentals', 'Quản lý KPI team', 'Tuyển dụng & onboarding', 'P&L cơ bản'],
  },
];

// ─── D. Thư viện BĐS ─────────────────────────────────────────────────────────
const LIBRARY_ITEMS = [
  { icon: Scale, label: 'Pháp lý BĐS', items: ['Luật Đất Đai 2024', 'Luật Nhà ở', 'Luật Kinh doanh BĐS', 'Thủ tục công chứng'], color: 'text-blue-600 bg-blue-50' },
  { icon: DollarSign, label: 'Tài chính BĐS', items: ['Đòn bẩy tài chính', 'Lãi suất & dòng tiền', 'Tính hiệu suất đầu tư', 'Phân tích ROI'], color: 'text-emerald-600 bg-emerald-50' },
  { icon: TrendingUp, label: 'Thị trường', items: ['Đọc báo cáo thị trường', 'Chu kỳ BĐS', 'Phân tích khu vực', 'Xu hướng 2025-2030'], color: 'text-violet-600 bg-violet-50' },
  { icon: Globe, label: 'Kỹ năng mềm', items: ['Thuyết trình chuyên nghiệp', 'Đàm phán win-win', 'Giao tiếp khách hàng', 'Viết email chuyên nghiệp'], color: 'text-amber-600 bg-amber-50' },
];

export default function TrainingHubPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('culture');
  const [activeDept, setActiveDept] = useState('primary');

  const dept = DEPARTMENTS.find(d => d.id === activeDept);

  return (
    <div className="space-y-5 max-w-3xl" data-testid="training-hub-page">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <GraduationCap className="w-5 h-5 text-[#316585]" /> Training Hub
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">Hệ thống đào tạo toàn diện — Văn hóa · Chuyên môn · Kiến thức</p>
      </div>

      {/* My progress banner */}
      <Card className="border-[#316585]/30 bg-gradient-to-r from-[#316585]/5 to-blue-50/50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <p className="text-xs text-slate-500 font-medium">TIẾN ĐỘ TỔNG QUAN</p>
              <p className="font-bold text-slate-900 text-lg mt-0.5">{user?.full_name || 'Nhân viên'}</p>
              <p className="text-sm text-slate-500">4/18 khóa hoàn thành · Cần 6 khóa bắt buộc</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-center">
                <p className="text-2xl font-bold text-[#316585]">67%</p>
                <p className="text-xs text-slate-400">Bắt buộc</p>
              </div>
              <div className="w-20">
                <Progress value={67} className="h-2" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto">
        {TABS.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all border ${
                activeTab === tab.key
                  ? 'bg-[#316585] text-white border-[#316585] shadow-sm'
                  : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ─── TAB: VĂN HÓA DN ──────────────────────────────────────────────── */}
      {activeTab === 'culture' && (
        <div className="space-y-3">
          <p className="text-sm text-slate-500">Bắt buộc hoàn thành trong <span className="font-semibold text-slate-700">7 ngày đầu</span> tiên vào công ty</p>
          {CULTURE_LESSONS.map(lesson => (
            <Card key={lesson.id} className={`border transition-all hover:shadow-sm ${lesson.progress === 100 ? 'border-emerald-200 bg-emerald-50/30' : 'border-slate-200'}`}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="text-2xl flex-shrink-0">{lesson.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="font-semibold text-sm text-slate-900">{lesson.title}</p>
                      {lesson.mandatory && <Badge className="text-[10px] bg-red-100 text-red-700 border-0">Bắt buộc</Badge>}
                      {lesson.progress === 100 && <Badge className="text-[10px] bg-emerald-100 text-emerald-700 border-0">✅ Hoàn thành</Badge>}
                    </div>
                    <p className="text-xs text-slate-500 mb-2">{lesson.desc}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex-1 mr-3">
                        <Progress value={lesson.progress} className="h-1.5" />
                      </div>
                      <span className="text-xs text-slate-400 flex-shrink-0">{lesson.progress}% · {lesson.duration}</span>
                    </div>
                  </div>
                  <Button size="sm" className="flex-shrink-0 h-8 text-xs gap-1 bg-[#316585] hover:bg-[#264f68]">
                    <Play className="w-3 h-3" />
                    {lesson.progress === 0 ? 'Bắt đầu' : lesson.progress < 100 ? 'Tiếp tục' : 'Xem lại'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ─── TAB: PHÒNG BAN ───────────────────────────────────────────────── */}
      {activeTab === 'department' && (
        <div className="space-y-4">
          <div className="flex gap-2 overflow-x-auto">
            {DEPARTMENTS.map(d => (
              <button key={d.id} onClick={() => setActiveDept(d.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap border transition-all ${
                  activeDept === d.id ? d.accent : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                }`}>
                {d.icon} {d.label}
              </button>
            ))}
          </div>
          <div className="space-y-3">
            {dept?.courses.map((course, i) => (
              <Card key={i} className={`border transition-all hover:shadow-sm ${course.done ? 'border-emerald-200 bg-emerald-50/30' : 'border-slate-200'}`}>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${course.done ? 'bg-emerald-100' : 'bg-slate-100'}`}>
                    {course.done ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <BookOpen className="w-5 h-5 text-slate-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-slate-900">{course.title}</p>
                    <p className="text-xs text-slate-400">{course.hours}h · {course.level}</p>
                  </div>
                  <Button size="sm" variant={course.done ? "outline" : "default"} className="h-8 text-xs flex-shrink-0">
                    {course.done ? 'Xem lại' : 'Học ngay'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ─── TAB: CẤP BẬC ────────────────────────────────────────────────── */}
      {activeTab === 'level' && (
        <div className="space-y-3">
          <p className="text-sm text-slate-500">Hoàn thành playlist theo cấp bậc để mở khóa cấp tiếp theo</p>
          {LEVEL_PLAYLISTS.map((pl, i) => (
            <Card key={i} className={`border transition-all ${pl.locked ? 'opacity-60' : 'hover:shadow-sm'} ${pl.progress > 0 && !pl.locked ? 'border-[#316585]/30' : 'border-slate-200'}`}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-xl flex-shrink-0 ${pl.locked ? 'bg-slate-100' : 'bg-blue-50'}`}>
                    {pl.locked ? '🔒' : pl.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <p className="font-bold text-sm text-slate-900">{pl.level}</p>
                      {pl.locked && <Badge className="text-[10px] bg-slate-100 text-slate-500 border-0">🔒 Chưa mở</Badge>}
                      {!pl.locked && pl.progress > 0 && <Badge className="text-[10px] bg-blue-100 text-blue-700 border-0">Đang học</Badge>}
                    </div>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {pl.courses.map((c, j) => (
                        <span key={j} className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">{c}</span>
                      ))}
                    </div>
                    {!pl.locked && (
                      <div className="flex items-center gap-2">
                        <Progress value={pl.progress} className="flex-1 h-1.5" />
                        <span className="text-xs text-slate-400">{pl.progress}%</span>
                      </div>
                    )}
                  </div>
                  {!pl.locked && (
                    <Button size="sm" className="h-8 text-xs flex-shrink-0 bg-[#316585] hover:bg-[#264f68]">
                      {pl.progress === 0 ? 'Bắt đầu' : 'Tiếp tục'}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ─── TAB: THƯ VIỆN BĐS ───────────────────────────────────────────── */}
      {activeTab === 'library' && (
        <div className="grid sm:grid-cols-2 gap-4">
          {LIBRARY_ITEMS.map((cat, i) => {
            const Icon = cat.icon;
            return (
              <Card key={i} className="border border-slate-200 hover:shadow-sm transition-all">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${cat.color.split(' ').slice(1).join(' ')}`}>
                      <Icon className={`w-4 h-4 ${cat.color.split(' ')[0]}`} />
                    </div>
                    {cat.label}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-1.5">
                  {cat.items.map((item, j) => (
                    <button key={j} className="w-full flex items-center justify-between text-left px-3 py-2 rounded-lg hover:bg-slate-50 group transition-all">
                      <span className="text-sm text-slate-700">{item}</span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500 transition-colors" />
                    </button>
                  ))}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
