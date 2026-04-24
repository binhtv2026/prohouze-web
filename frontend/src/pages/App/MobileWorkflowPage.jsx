/**
 * MobileWorkflowPage.jsx — Tự động hoá quy trình (B)
 * Trigger → Điều kiện → Hành động · Rule builder trực quan
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Zap, Plus, Play, Pause, ChevronRight,
  Check, Bell, Mail, Users, Clock, AlertCircle,
  ToggleLeft, ToggleRight, Settings, ArrowRight,
  RefreshCw, Flame,
} from 'lucide-react';
import { toast } from 'sonner';

const WORKFLOW_TEMPLATES = [
  {
    id: 'wf-01',
    name: 'Lead nóng → Giao ngay',
    trigger: 'Lead được đánh dấu HOT',
    condition: 'Chưa có Sales phụ trách',
    action: 'Tự động giao cho Sales có ít lead nhất',
    icon: Flame, iconColor: 'text-red-500', iconBg: 'bg-red-50',
    active: true, runs: 24, lastRun: '20 phút trước',
  },
  {
    id: 'wf-02',
    name: 'Giữ chỗ sắp hết hạn',
    trigger: 'Giữ chỗ còn ≤ 24h',
    condition: 'Status = Đang giữ',
    action: 'Gửi thông báo cho Sales phụ trách + Manager',
    icon: Clock, iconColor: 'text-amber-500', iconBg: 'bg-amber-50',
    active: true, runs: 38, lastRun: '2 giờ trước',
  },
  {
    id: 'wf-03',
    name: 'Khách không phản hồi 3 ngày',
    trigger: 'Lần liên hệ cuối > 3 ngày',
    condition: 'Status = Đang follow',
    action: 'Chuyển sang "Cần follow lại" + nhắc Sales',
    icon: Bell, iconColor: 'text-blue-500', iconBg: 'bg-blue-50',
    active: true, runs: 12, lastRun: '1 ngày trước',
  },
  {
    id: 'wf-04',
    name: 'Deal thắng → Tạo hợp đồng',
    trigger: 'Deal chuyển sang THẮNG',
    condition: 'Có đầy đủ thông tin khách',
    action: 'Tự tạo draft hợp đồng + notify Sales Support',
    icon: Check, iconColor: 'text-emerald-600', iconBg: 'bg-emerald-50',
    active: true, runs: 8, lastRun: '3 ngày trước',
  },
  {
    id: 'wf-05',
    name: 'Nhân viên mới → Onboarding',
    trigger: 'Nhân viên được thêm vào hệ thống',
    condition: 'Role = Sales / Agency',
    action: 'Gửi email chào mừng + gán mentor + tạo checklist onboard',
    icon: Users, iconColor: 'text-violet-500', iconBg: 'bg-violet-50',
    active: false, runs: 3, lastRun: '2 tuần trước',
  },
  {
    id: 'wf-06',
    name: 'KPI chưa đạt → Cảnh báo',
    trigger: 'Cuối tháng (ngày 25)',
    condition: 'KPI đạt < 60%',
    action: 'Notif Manager + gửi báo cáo cần hỗ trợ',
    icon: AlertCircle, iconColor: 'text-rose-500', iconBg: 'bg-rose-50',
    active: true, runs: 5, lastRun: '25/03/2026',
  },
];

const TRIGGER_OPTIONS = [
  'Lead được tạo mới', 'Lead đánh dấu HOT', 'Deal chuyển trạng thái',
  'Giữ chỗ sắp hết hạn', 'Khách không phản hồi', 'KPI thấp',
  'Nhân viên mới', 'Cuối ngày / tuần / tháng',
];
const ACTION_OPTIONS = [
  'Gửi thông báo push', 'Gửi email', 'Giao việc cho người dùng',
  'Tạo task mới', 'Chuyển trạng thái record', 'Tạo draft hợp đồng',
  'Thêm vào danh sách follow', 'Gửi tin nhắn Zalo',
];

function WorkflowCard({ wf, onToggle }) {
  const Icon = wf.icon;
  return (
    <div className={`bg-white rounded-2xl p-4 shadow-sm mb-3 border ${wf.active ? 'border-emerald-200' : 'border-slate-200'}`}>
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 ${wf.iconBg} rounded-xl flex items-center justify-center flex-shrink-0`}>
          <Icon className={`w-5 h-5 ${wf.iconColor}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <p className="text-sm font-bold text-slate-800 truncate">{wf.name}</p>
            <button
              onClick={() => onToggle(wf.id)}
              className={`flex-shrink-0 w-10 h-6 rounded-full transition-all ${wf.active ? 'bg-emerald-400' : 'bg-slate-300'} relative`}
            >
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${wf.active ? 'right-1' : 'left-1'}`} />
            </button>
          </div>

          {/* Flow visual */}
          <div className="flex items-center gap-1.5 mb-2 flex-wrap">
            <span className="text-[10px] font-semibold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">⚡ {wf.trigger}</span>
            <ArrowRight className="w-3 h-3 text-slate-400 flex-shrink-0" />
            <span className="text-[10px] font-semibold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">🔀 {wf.condition}</span>
            <ArrowRight className="w-3 h-3 text-slate-400 flex-shrink-0" />
            <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">✅ {wf.action}</span>
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <RefreshCw className="w-3 h-3" /> {wf.runs} lần chạy
            </span>
            <span>Lần cuối: {wf.lastRun}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function NewWorkflowSheet({ onClose, onSave }) {
  const [step, setStep] = useState(0); // 0=trigger, 1=action, 2=name
  const [trigger, setTrigger] = useState('');
  const [action, setAction] = useState('');
  const [name, setName] = useState('');

  return (
    <div className="fixed inset-0 z-50 flex flex-col">
      <div className="flex-1 bg-black/50" onClick={onClose} />
      <div className="bg-white rounded-t-3xl p-5 pb-10 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-slate-800">Tạo Workflow mới</h2>
          <button onClick={onClose} className="text-slate-400 text-sm">✕</button>
        </div>

        {/* Step indicator */}
        <div className="flex gap-2 mb-5">
          {['Trigger', 'Hành động', 'Đặt tên'].map((s, i) => (
            <div key={s} className={`flex-1 h-1.5 rounded-full ${step >= i ? 'bg-[#316585]' : 'bg-slate-100'}`} />
          ))}
        </div>

        {step === 0 && (
          <>
            <p className="text-sm font-semibold text-slate-700 mb-3">⚡ Chọn sự kiện kích hoạt</p>
            <div className="space-y-2">
              {TRIGGER_OPTIONS.map(t => (
                <button key={t} onClick={() => { setTrigger(t); setStep(1); }}
                  className={`w-full text-left py-3 px-4 rounded-xl border text-sm transition-all ${trigger === t ? 'border-[#316585] bg-[#316585]/5 text-[#316585] font-semibold' : 'border-slate-200 text-slate-700'}`}>
                  {t}
                </button>
              ))}
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <p className="text-xs text-slate-500 mb-1">Trigger: <strong>{trigger}</strong></p>
            <p className="text-sm font-semibold text-slate-700 mb-3">✅ Chọn hành động thực hiện</p>
            <div className="space-y-2">
              {ACTION_OPTIONS.map(a => (
                <button key={a} onClick={() => { setAction(a); setStep(2); }}
                  className={`w-full text-left py-3 px-4 rounded-xl border text-sm transition-all ${action === a ? 'border-[#316585] bg-[#316585]/5 text-[#316585] font-semibold' : 'border-slate-200 text-slate-700'}`}>
                  {a}
                </button>
              ))}
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <p className="text-xs text-slate-500 mb-3">
              <strong>{trigger}</strong> → <strong>{action}</strong>
            </p>
            <p className="text-sm font-semibold text-slate-700 mb-2">Đặt tên workflow</p>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="VD: Lead nóng → Giao Sales ngay"
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#316585]/30 mb-5"
            />
            <button
              onClick={() => {
                if (!name.trim()) { toast.error('Nhập tên workflow'); return; }
                onSave({ trigger, action, name });
                onClose();
                toast.success('⚡ Workflow đã được tạo và kích hoạt!');
              }}
              className="w-full py-3.5 bg-[#316585] text-white font-bold rounded-xl text-sm"
            >
              Tạo & Kích hoạt
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function MobileWorkflowPage() {
  const navigate = useNavigate();
  const [workflows, setWorkflows] = useState(WORKFLOW_TEMPLATES);
  const [showNew, setShowNew] = useState(false);
  const [tab, setTab] = useState('active');

  const handleToggle = (id) => {
    setWorkflows(prev => prev.map(w => {
      if (w.id !== id) return w;
      const next = { ...w, active: !w.active };
      toast(next.active ? '✅ Workflow đã được kích hoạt' : '⏸️ Workflow tạm dừng');
      return next;
    }));
  };

  const handleSave = ({ trigger, action, name }) => {
    setWorkflows(prev => [{
      id: `wf-${Date.now()}`, name, trigger, condition: 'Luôn thực hiện', action,
      icon: Zap, iconColor: 'text-blue-500', iconBg: 'bg-blue-50',
      active: true, runs: 0, lastRun: 'Chưa chạy',
    }, ...prev]);
  };

  const filtered = tab === 'active'
    ? workflows.filter(w => w.active)
    : tab === 'paused'
    ? workflows.filter(w => !w.active)
    : workflows;

  const totalRuns = workflows.reduce((a, b) => a + b.runs, 0);

  return (
    <div className="h-screen bg-[#f1f5f9] flex flex-col overflow-hidden">
      <div
        className="flex-shrink-0 px-4 pt-12 pb-5 text-white"
        style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #4c1d95 100%)' }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center">
              <ArrowLeft className="w-4 h-4 text-white" />
            </button>
            <div>
              <h1 className="text-xl font-bold">Tự động hoá</h1>
              <p className="text-white/70 text-xs">Workflow · {workflows.filter(w=>w.active).length} đang chạy</p>
            </div>
          </div>
          <button onClick={() => setShowNew(true)} className="flex items-center gap-1.5 px-3 py-2 bg-white/20 rounded-xl text-white text-sm font-semibold">
            <Plus className="w-4 h-4" /> Tạo mới
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Đang chạy', value: workflows.filter(w=>w.active).length, icon: '⚡' },
            { label: 'Tổng lần chạy', value: totalRuns, icon: '🔄' },
            { label: 'Tiết kiệm giờ', value: '~12h', icon: '⏱️' },
          ].map(s => (
            <div key={s.label} className="bg-white/15 rounded-2xl p-3 text-center">
              <p className="text-lg mb-0.5">{s.icon}</p>
              <p className="text-base font-black">{s.value}</p>
              <p className="text-[10px] text-white/60">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white border-b border-slate-100 px-4 py-2 flex-shrink-0">
        <div className="flex gap-1">
          {[['active','⚡ Đang chạy'], ['paused','⏸️ Tạm dừng'], ['all','Tất cả']].map(([k, l]) => (
            <button key={k} onClick={() => setTab(k)}
              className={`flex-1 py-2 rounded-full text-xs font-semibold ${tab === k ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
              {l}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {filtered.map(wf => (
          <WorkflowCard key={wf.id} wf={wf} onToggle={handleToggle} />
        ))}

        <button onClick={() => setShowNew(true)}
          className="w-full py-4 border-2 border-dashed border-violet-300 rounded-2xl text-violet-600 font-semibold text-sm flex items-center justify-center gap-2 mb-3">
          <Plus className="w-4 h-4" /> Thêm workflow mới
        </button>
        <div className="h-24" />
      </div>

      {showNew && <NewWorkflowSheet onClose={() => setShowNew(false)} onSave={handleSave} />}
    </div>
  );
}
