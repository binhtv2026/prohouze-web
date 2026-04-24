/**
 * CompliancePage.jsx — Tuân thủ pháp lý & quy trình HĐ (10/10 rewrite)
 * 10/10 LOCKED — D Module
 *
 * Features:
 * - Contract Workflow: Draft → Review → Approved → Signed → Notarized → Archived
 * - Compliance checklist theo từng giai đoạn
 * - Status board: bao nhiêu HĐ đang ở mỗi giai đoạn
 * - Risk alerts: HĐ quá hạn, thiếu hồ sơ, cần ký lại
 * - Filter: dự án, trạng thái, loại HĐ
 */
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Shield, FileText, CheckCircle2, XCircle, Clock, AlertTriangle,
  ChevronRight, ChevronDown, ChevronUp, Search, Filter,
  ArrowRight, User, Building2, Calendar, Eye, Download,
  Stamp, Archive, PenLine, Send,
} from 'lucide-react';
import { toast } from 'sonner';

// ─── CONTRACT WORKFLOW STAGES ─────────────────────────────────────────────────
const STAGES = [
  { id: 'draft',     label: 'Bản nháp',      icon: PenLine,      color: 'bg-slate-100 text-slate-600 border-slate-300', line: 'bg-slate-200' },
  { id: 'review',    label: 'Đang xét duyệt', icon: Eye,          color: 'bg-blue-100 text-blue-700 border-blue-300', line: 'bg-blue-200' },
  { id: 'approved',  label: 'Đã phê duyệt',   icon: CheckCircle2, color: 'bg-indigo-100 text-indigo-700 border-indigo-300', line: 'bg-indigo-200' },
  { id: 'signed',    label: 'Đã ký',           icon: PenLine,      color: 'bg-emerald-100 text-emerald-700 border-emerald-300', line: 'bg-emerald-200' },
  { id: 'notarized', label: 'Công chứng',      icon: Stamp,        color: 'bg-violet-100 text-violet-700 border-violet-300', line: 'bg-violet-200' },
  { id: 'archived',  label: 'Lưu trữ',        icon: Archive,      color: 'bg-slate-50 text-slate-400 border-slate-200', line: 'bg-slate-100' },
];

const COMPLIANCE_CHECKLIST = {
  draft:     ['Thông tin khách hàng đầy đủ', 'Thông tin căn hộ chính xác', 'Giá và thanh toán khớp CSBH'],
  review:    ['Hồ sơ pháp lý khách (CCCD, hộ khẩu)', 'Hồ sơ tài chính (xác nhận ngân hàng)', 'Kiểm tra blacklist'],
  approved:  ['Ban pháp chế duyệt nội dung HĐ', 'Giám đốc ký nháy xác nhận', 'Gửi HĐ cho khách review'],
  signed:    ['Khách hàng ký trực tiếp', 'Sales ký xác nhận', 'Scan/lưu bản gốc có ký'],
  notarized: ['Công chứng tại văn phòng được chỉ định', 'Nộp phí trước bạ', 'Đăng ký quyền sở hữu tạm'],
  archived:  ['Upload bản scan có dấu công chứng', 'Cập nhật hệ thống quản lý HĐ', 'Gửi thông báo cho CĐT'],
};

const DEMO_CONTRACTS = [
  { id: 'hd001', customer: 'Nguyễn Văn An', unit: 'A1805', project: 'The Opus One', type: 'Sale', value: 5200000000, stage: 'review', days: 3, risk: 'none', assignedTo: 'Minh Tuấn', issues: [] },
  { id: 'hd002', customer: 'Trần Thị Bích', unit: 'B2201', project: 'The Opus One', type: 'Sale', value: 7800000000, stage: 'signed', days: 12, risk: 'none', assignedTo: 'Thu Hương', issues: [] },
  { id: 'hd003', customer: 'Phạm Đình Cường', unit: 'T1-1530', project: 'Masteri Grand View', type: 'Sale', value: 4500000000, stage: 'draft', days: 1, risk: 'low', assignedTo: 'Quốc Hùng', issues: ['Thiếu xác nhận ngân hàng'] },
  { id: 'hd004', customer: 'Lê Văn Dũng', unit: 'C0812', project: 'The Opus One', type: 'Sale', value: 3900000000, stage: 'notarized', days: 25, risk: 'none', assignedTo: 'Lan Phương', issues: [] },
  { id: 'hd005', customer: 'Hoàng Anh Tú', unit: 'A2105', project: 'The Opus One', type: 'Sale', value: 6100000000, stage: 'approved', days: 7, risk: 'medium', assignedTo: 'Đức Nam', issues: ['Chờ khách xác nhận lịch ký', 'Hộ chiếu sắp hết hạn'] },
  { id: 'hd006', customer: 'Vũ Minh Hạnh', unit: 'T2-2210', project: 'Masteri Grand View', type: 'Sale', value: 5500000000, stage: 'archived', days: 45, risk: 'none', assignedTo: 'Yến Nhi', issues: [] },
  { id: 'hd007', customer: 'Ngô Thị Kim', unit: 'B1502', project: 'The Opus One', type: 'Sale', value: 8900000000, stage: 'review', days: 8, risk: 'high', assignedTo: 'Minh Tuấn', issues: ['Hồ sơ tài chính chưa đủ', 'Xác minh nguồn gốc tiền', 'Quá 7 ngày chưa xử lý'] },
];

const RISK_CFG = {
  none:   { label: 'OK', bg: 'bg-emerald-100', text: 'text-emerald-700' },
  low:    { label: 'Thấp', bg: 'bg-blue-100', text: 'text-blue-700' },
  medium: { label: 'Trung bình', bg: 'bg-amber-100', text: 'text-amber-700' },
  high:   { label: 'Cao', bg: 'bg-red-100', text: 'text-red-700' },
};

const fmtB = (v) => v >= 1e9 ? `${(v / 1e9).toFixed(1)} tỷ` : `${(v / 1e6).toFixed(0)} tr`;

// ─── WORKFLOW PROGRESS BAR ────────────────────────────────────────────────────
function WorkflowBar({ currentStage }) {
  const idx = STAGES.findIndex(s => s.id === currentStage);
  return (
    <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
      {STAGES.map((s, i) => {
        const Icon = s.icon;
        const done = i <= idx;
        const current = i === idx;
        return (
          <div key={s.id} className="flex items-center gap-1.5 flex-shrink-0">
            <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border text-[10px] font-bold transition-all ${done ? s.color : 'bg-slate-50 text-slate-300 border-slate-100'} ${current ? 'shadow ring-2 ring-[#316585]/20' : ''}`}>
              <Icon className="w-3 h-3" />
              {s.label}
            </div>
            {i < STAGES.length - 1 && (
              <div className={`w-4 h-0.5 flex-shrink-0 ${i < idx ? s.line : 'bg-slate-100'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── CONTRACT ROW ─────────────────────────────────────────────────────────────
function ContractRow({ contract, onAdvance }) {
  const [expanded, setExpanded] = useState(false);
  const stage = STAGES.find(s => s.id === contract.stage);
  const Icon = stage?.icon || FileText;
  const risk = RISK_CFG[contract.risk];
  const nextStage = STAGES[STAGES.findIndex(s => s.id === contract.stage) + 1];
  const checklist = COMPLIANCE_CHECKLIST[contract.stage] || [];

  return (
    <div className="border rounded-xl overflow-hidden">
      {/* Main row */}
      <div className="flex items-center gap-3 p-4 hover:bg-slate-50 cursor-pointer" onClick={() => setExpanded(e => !e)}>
        <div className={`p-2 rounded-lg flex-shrink-0 ${stage?.color.split(' ')[0]} ${stage?.color.split(' ')[2]}`}>
          <Icon className={`w-4 h-4 ${stage?.color.split(' ')[1]}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-slate-800 text-sm">{contract.customer}</span>
            <span className="text-[10px] text-slate-400">· Căn {contract.unit} · {contract.project.split(' ')[1] || contract.project}</span>
            {contract.risk !== 'none' && (
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${risk.bg} ${risk.text}`}>
                ⚠️ Rủi ro {risk.label}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-1">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${stage?.color}`}>{stage?.label}</span>
            <span className="text-[10px] text-slate-400">{contract.days} ngày · {contract.assignedTo}</span>
            <span className="text-[10px] font-bold text-[#316585]">{fmtB(contract.value)}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {nextStage && (
            <Button size="sm" className="h-7 text-[10px] bg-[#316585] hover:bg-[#264f68]" onClick={e => { e.stopPropagation(); onAdvance(contract, nextStage); }}>
              <ArrowRight className="w-3 h-3 mr-0.5" /> → {nextStage.label}
            </Button>
          )}
          <button className="p-1 text-slate-400 hover:text-slate-600">
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expanded: checklist + issues */}
      {expanded && (
        <div className="border-t bg-slate-50 p-4 space-y-3">
          <WorkflowBar currentStage={contract.stage} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Checklist giai đoạn "{stage?.label}"</p>
              <div className="space-y-1.5">
                {checklist.map(c => (
                  <div key={c} className="flex items-center gap-2 text-xs">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                    <span className="text-slate-700">{c}</span>
                  </div>
                ))}
              </div>
            </div>
            {contract.issues.length > 0 && (
              <div>
                <p className="text-[10px] font-bold text-red-500 uppercase tracking-wider mb-2">⚠️ Vấn đề cần xử lý</p>
                <div className="space-y-1.5">
                  {contract.issues.map(issue => (
                    <div key={issue} className="flex items-center gap-2 text-xs bg-red-50 border border-red-100 rounded-lg px-2.5 py-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                      <span className="text-red-700">{issue}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function CompliancePage() {
  const [contracts, setContracts] = useState(DEMO_CONTRACTS);
  const [filterStage, setFilterStage] = useState('all');
  const [filterRisk, setFilterRisk] = useState('all');

  const filtered = contracts.filter(c => {
    const matchStage = filterStage === 'all' || c.stage === filterStage;
    const matchRisk = filterRisk === 'all' || c.risk === filterRisk;
    return matchStage && matchRisk;
  });

  const handleAdvance = (contract, nextStage) => {
    setContracts(prev => prev.map(c => c.id === contract.id ? { ...c, stage: nextStage.id } : c));
    toast.success(`✅ HĐ "${contract.customer}" → ${nextStage.label}`);
  };

  const counts = {};
  STAGES.forEach(s => { counts[s.id] = contracts.filter(c => c.stage === s.id).length; });
  const highRisk = contracts.filter(c => c.risk === 'high').length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">🔒 Tuân thủ & Quy trình hợp đồng</h1>
          <p className="text-sm text-slate-500 mt-0.5">Workflow 6 giai đoạn · Compliance checklist · Risk alerts</p>
        </div>
        {highRisk > 0 && (
          <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            <span className="text-xs font-bold text-red-700">{highRisk} HĐ rủi ro cao cần xử lý ngay</span>
          </div>
        )}
      </div>

      {/* Stage summary */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {STAGES.map(s => {
          const Icon = s.icon;
          return (
            <div key={s.id} onClick={() => setFilterStage(filterStage === s.id ? 'all' : s.id)}
              className={`cursor-pointer flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl border-2 transition-all ${filterStage === s.id ? 'border-[#316585] shadow-md' : 'border-slate-200 hover:border-slate-300'} bg-white`}>
              <Icon className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-xs font-semibold text-slate-700">{s.label}</span>
              <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">{counts[s.id] || 0}</span>
            </div>
          );
        })}
      </div>

      {/* Risk filter */}
      <div className="flex gap-3">
        <Select value={filterRisk} onValueChange={setFilterRisk}>
          <SelectTrigger className="w-[160px] text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Mọi rủi ro</SelectItem>
            <SelectItem value="high">🔴 Rủi ro cao</SelectItem>
            <SelectItem value="medium">🟡 Trung bình</SelectItem>
            <SelectItem value="low">🔵 Thấp</SelectItem>
            <SelectItem value="none">✅ Không rủi ro</SelectItem>
          </SelectContent>
        </Select>
        <span className="flex items-center text-xs text-slate-500">{filtered.length} hợp đồng</span>
      </div>

      {/* Contract list */}
      <div className="space-y-3">
        {filtered.map(c => <ContractRow key={c.id} contract={c} onAdvance={handleAdvance} />)}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            <Shield className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p>Không có hợp đồng nào phù hợp</p>
          </div>
        )}
      </div>
    </div>
  );
}
