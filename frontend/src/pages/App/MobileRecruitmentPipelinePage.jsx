/**
 * MobileRecruitmentPage.jsx — Pipeline Tuyển dụng (Base E-Hiring)
 * Kanban: CV → Phỏng vấn → Offer → Onboard
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, UserPlus, ChevronRight, Star, Phone,
  Mail, Calendar, CheckCircle2, XCircle, Clock,
  Briefcase, GraduationCap, MapPin, Filter,
} from 'lucide-react';
import { toast } from 'sonner';

const STAGES = [
  { key: 'cv',        label: 'Nhận CV',       color: 'bg-slate-500',   light: 'bg-slate-50 border-slate-200',   textColor: 'text-slate-700' },
  { key: 'interview', label: 'Phỏng vấn',     color: 'bg-blue-500',    light: 'bg-blue-50 border-blue-200',     textColor: 'text-blue-700' },
  { key: 'offer',     label: 'Offer',          color: 'bg-amber-500',   light: 'bg-amber-50 border-amber-200',   textColor: 'text-amber-700' },
  { key: 'onboard',   label: 'Đang onboard',  color: 'bg-emerald-500', light: 'bg-emerald-50 border-emerald-200',textColor: 'text-emerald-700' },
];

const initCandidates = [
  { id: 'c1', name: 'Nguyễn Thu Trang', role: 'Sales Consultant', phone: '0901 234 567', email: 'trang@email.com', stage: 'cv', rating: 4, source: 'LinkedIn', location: 'Đà Nẵng', exp: '3 năm kinh nghiệm BĐS', applied: '18/04/2026' },
  { id: 'c2', name: 'Lê Hoàng Minh',   role: 'Sales Manager',    phone: '0912 345 678', email: 'minh@email.com', stage: 'interview', rating: 5, source: 'Referral', location: 'HCM', exp: '5 năm + quản lý team', applied: '15/04/2026' },
  { id: 'c3', name: 'Phạm Bích Ngọc',  role: 'Sales Consultant', phone: '0923 456 789', email: 'ngoc@email.com', stage: 'interview', rating: 3, source: 'Facebook', location: 'Đà Nẵng', exp: '1 năm', applied: '14/04/2026' },
  { id: 'c4', name: 'Vũ Thanh Hải',    role: 'Sales Consultant', phone: '0934 567 890', email: 'hai@email.com', stage: 'offer', rating: 5, source: 'LinkedIn', location: 'Hà Nội', exp: '4 năm BĐS cao cấp', applied: '10/04/2026' },
  { id: 'c5', name: 'Trần Mỹ Linh',    role: 'HR Executive',     phone: '0945 678 901', email: 'linh@email.com', stage: 'onboard', rating: 4, source: 'Website', location: 'Đà Nẵng', exp: '2 năm HR Startup', applied: '05/04/2026' },
  { id: 'c6', name: 'Hồ Văn Dũng',     role: 'Sales Consultant', phone: '0956 789 012', email: 'dung@email.com', stage: 'cv', rating: 3, source: 'JobStreet', location: 'Đà Nẵng', exp: 'Fresher', applied: '20/04/2026' },
];

function StarRating({ rating }) {
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(i => (
        <Star key={i} className={`w-3 h-3 ${i <= rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`} />
      ))}
    </div>
  );
}

function CandidateCard({ candidate, onMove, onReject }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="bg-white rounded-2xl shadow-sm mb-2 overflow-hidden border border-slate-100">
      <button className="w-full text-left p-3" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-[#316585] to-[#1a3f52] rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-white text-sm font-bold">{candidate.name.split(' ').map(n=>n[0]).slice(-2).join('')}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-slate-800 truncate">{candidate.name}</p>
            <p className="text-xs text-slate-500">{candidate.role}</p>
            <StarRating rating={candidate.rating} />
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-400">{candidate.source}</p>
            <p className="text-xs text-slate-400">{candidate.applied}</p>
          </div>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-slate-100 px-3 pb-3">
          <div className="bg-slate-50 rounded-xl p-3 my-2 space-y-1.5">
            <div className="flex items-center gap-2 text-xs text-slate-600"><MapPin className="w-3 h-3" />{candidate.location}</div>
            <div className="flex items-center gap-2 text-xs text-slate-600"><GraduationCap className="w-3 h-3" />{candidate.exp}</div>
            <div className="flex items-center gap-2 text-xs text-slate-600"><Phone className="w-3 h-3" />{candidate.phone}</div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => onReject(candidate.id)} className="flex-1 py-2 border border-red-300 text-red-600 rounded-xl text-xs font-bold flex items-center justify-center gap-1">
              <XCircle className="w-3.5 h-3.5" /> Loại
            </button>
            <button onClick={() => onMove(candidate.id)} className="flex-1 py-2 bg-[#316585] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1">
              <ChevronRight className="w-3.5 h-3.5" /> Chuyển bước
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MobileRecruitmentPage() {
  const navigate = useNavigate();
  const [candidates, setCandidates] = useState(initCandidates);
  const [activeStage, setActiveStage] = useState('cv');

  const stageOrder = ['cv', 'interview', 'offer', 'onboard'];

  const handleMove = (id) => {
    setCandidates(prev => prev.map(c => {
      if (c.id !== id) return c;
      const idx = stageOrder.indexOf(c.stage);
      if (idx < stageOrder.length - 1) {
        const next = stageOrder[idx + 1];
        toast.success(`✅ Chuyển ứng viên sang "${STAGES.find(s=>s.key===next)?.label}"`);
        return { ...c, stage: next };
      }
      toast.success('🎉 Ứng viên đã hoàn thành onboard!');
      return c;
    }));
  };

  const handleReject = (id) => {
    const c = candidates.find(x => x.id === id);
    toast.error(`❌ Loại ứng viên ${c?.name}`);
    setCandidates(prev => prev.filter(x => x.id !== id));
  };

  const filtered = candidates.filter(c => c.stage === activeStage);

  return (
    <div className="h-screen bg-[#f1f5f9] flex flex-col overflow-hidden">
      <div className="bg-white border-b border-slate-100 px-4 pt-12 pb-3 flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="w-9 h-9 bg-slate-100 rounded-full flex items-center justify-center">
              <ArrowLeft className="w-4 h-4 text-slate-600" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Tuyển dụng</h1>
              <p className="text-xs text-slate-500">{candidates.length} ứng viên đang theo dõi</p>
            </div>
          </div>
          <button className="w-9 h-9 bg-[#316585] rounded-full flex items-center justify-center">
            <UserPlus className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Stage stats */}
        <div className="flex gap-2 mb-3 overflow-x-auto pb-1 scrollbar-hide">
          {STAGES.map(s => {
            const count = candidates.filter(c => c.stage === s.key).length;
            return (
              <button key={s.key} onClick={() => setActiveStage(s.key)}
                className={`flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl border transition-all ${activeStage === s.key ? s.light + ' border' : 'bg-slate-50 border-slate-200'}`}>
                <div className={`w-5 h-5 ${activeStage === s.key ? s.color : 'bg-slate-300'} rounded-full flex items-center justify-center`}>
                  <span className="text-white text-[10px] font-black">{count}</span>
                </div>
                <span className={`text-xs font-semibold ${activeStage === s.key ? s.textColor : 'text-slate-600'}`}>{s.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <UserPlus className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">Không có ứng viên ở bước này</p>
          </div>
        ) : filtered.map(c => (
          <CandidateCard key={c.id} candidate={c} onMove={handleMove} onReject={handleReject} />
        ))}
        <div className="h-24" />
      </div>
    </div>
  );
}
