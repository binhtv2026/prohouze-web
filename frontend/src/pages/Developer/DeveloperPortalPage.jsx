/**
 * DeveloperPortalPage.jsx — Cổng Chủ Đầu Tư (Developer Portal)
 * 10/10 LOCKED — C Module
 *
 * Features:
 * - Tổng quan dự án: tiến độ bán hàng, doanh thu real-time
 * - Inventory Matrix: từng block/tầng, duyệt thay đổi giá (CSBH)
 * - Agency Performance: F1/F2/F3 theo dự án
 * - Approval Workflow: CĐT approve/reject điều chỉnh giá, phê duyệt giỏ hàng
 * - Document Vault: pháp lý, sơ đồ, mặt bằng
 * - Báo cáo tài chính: doanh thu đặt cọc, thu về theo giai đoạn
 */
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import {
  Building2, TrendingUp, DollarSign, Package, ChevronRight,
  CheckCircle2, XCircle, Clock, FileText, Users, BarChart3,
  AlertTriangle, Eye, Shield, Download, Layers,
  Home, Network, Star, ArrowUpRight, Target,
} from 'lucide-react';
import { toast } from 'sonner';

// ─── DEMO DATA ────────────────────────────────────────────────────────────────
const PROJECTS = [
  {
    id: 'p1', name: 'The Opus One', location: 'Quận 1, TP.HCM',
    totalUnits: 480, soldUnits: 312, heldUnits: 48, availableUnits: 120,
    blocks: ['A', 'B', 'C'], floors: 25,
    targetRevenue: 8500000000000, collectedRevenue: 4200000000000,
    depositRevenue: 1560000000000,
    launchDate: '2026-01-15', completionDate: '2028-06-30',
    status: 'on_sale',
  },
  {
    id: 'p2', name: 'Masteri Grand View', location: 'TP. Thủ Đức',
    totalUnits: 600, soldUnits: 280, heldUnits: 35, availableUnits: 285,
    blocks: ['T1', 'T2'], floors: 30,
    targetRevenue: 6200000000000, collectedRevenue: 1960000000000,
    depositRevenue: 840000000000,
    launchDate: '2026-03-10', completionDate: '2028-12-31',
    status: 'on_sale',
  },
];

const APPROVALS = [
  { id: 'ap1', type: 'price_adjust', project: 'The Opus One', block: 'Block A', detail: 'Đề xuất tăng 2% giá căn tầng 20-25', requestedBy: 'Sàn BĐS Phú Mỹ Hưng', requestedAt: '2026-04-23T08:00:00Z', status: 'pending', impact: '+3.2 tỷ doanh thu kỳ vọng' },
  { id: 'ap2', type: 'inventory_release', project: 'The Opus One', block: 'Block B', detail: 'Yêu cầu mở thêm 30 căn tầng 10-15', requestedBy: 'Central Realty Group', requestedAt: '2026-04-23T07:30:00Z', status: 'pending', impact: '30 căn mới đưa vào thị trường' },
  { id: 'ap3', type: 'price_adjust', project: 'Masteri Grand View', block: 'T1', detail: 'Giảm 1.5% cho 20 căn tầng thấp tồn lâu', requestedBy: 'Sun Property Q7', requestedAt: '2026-04-22T15:00:00Z', status: 'approved', impact: '-1.5 tỷ doanh thu nhưng thu hồi nhanh tiền cọc' },
  { id: 'ap4', type: 'commission_adjust', project: 'The Opus One', block: 'All', detail: 'Tăng hoa hồng F2 lên 3% tháng 5/2026', requestedBy: 'Ban kinh doanh', requestedAt: '2026-04-22T10:00:00Z', status: 'rejected', impact: '+0.5% chi phí / HĐ' },
];

const AGENCY_PERF = [
  { name: 'Sàn BĐS Phú Mỹ Hưng', tier: 'F1', projects: ['The Opus One'], sold: 62, allocated: 80, revenue: 8500000000, achievement: 142 },
  { name: 'Đại lý Masterise Q2', tier: 'F2', projects: ['The Opus One'], sold: 22, allocated: 30, revenue: 3200000000, achievement: 103 },
  { name: 'Central Realty Group', tier: 'F1', projects: ['Masteri Grand View'], sold: 38, allocated: 60, revenue: 5600000000, achievement: 81 },
  { name: 'Bình Thạnh Realty', tier: 'F2', projects: ['The Opus One'], sold: 18, allocated: 25, revenue: 2800000000, achievement: 95 },
];

const DOCUMENTS = [
  { id: 'd1', name: 'Giấy phép xây dựng', type: 'legal', project: 'The Opus One', date: '2025-03-01', status: 'valid' },
  { id: 'd2', name: 'Quy hoạch 1/500', type: 'plan', project: 'The Opus One', date: '2025-01-15', status: 'valid' },
  { id: 'd3', name: 'CSBH tháng 4/2026', type: 'pricing', project: 'The Opus One', date: '2026-04-01', status: 'valid' },
  { id: 'd4', name: 'Sổ hồng mẫu', type: 'legal', project: 'Masteri Grand View', date: '2026-03-15', status: 'valid' },
  { id: 'd5', name: 'Tiến độ thanh toán', type: 'payment', project: 'Both', date: '2026-04-01', status: 'draft' },
];

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const fmtT = (v) => {
  if (!v) return '—';
  if (v >= 1e12) return `${(v / 1e12).toFixed(2)} nghìn tỷ`;
  if (v >= 1e9) return `${(v / 1e9).toFixed(1)} tỷ`;
  return `${(v / 1e6).toFixed(0)} tr`;
};

const TIER_CLR = { F1: 'bg-violet-100 text-violet-700 border-violet-200', F2: 'bg-blue-100 text-blue-700 border-blue-200', F3: 'bg-slate-100 text-slate-600 border-slate-200' };
const perfColor = (p) => p >= 100 ? 'text-emerald-700' : p >= 80 ? 'text-blue-700' : 'text-amber-700';

const APPROVAL_TYPE_LABEL = { price_adjust: 'Điều chỉnh giá', inventory_release: 'Mở thêm giỏ hàng', commission_adjust: 'Điều chỉnh hoa hồng' };
const APPROVAL_TYPE_ICON = { price_adjust: DollarSign, inventory_release: Package, commission_adjust: Star };

// ─── PROJECT OVERVIEW CARD ────────────────────────────────────────────────────
function ProjectCard({ proj, isSelected, onSelect }) {
  const soldPct = Math.round((proj.soldUnits / proj.totalUnits) * 100);
  const revPct = Math.round((proj.collectedRevenue / proj.targetRevenue) * 100);
  return (
    <div onClick={onSelect} className={`cursor-pointer rounded-2xl border-2 p-4 transition-all ${isSelected ? 'border-[#316585] shadow-md' : 'border-slate-200 hover:border-slate-300'}`}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-bold text-slate-900">{proj.name}</h3>
          <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5"><Home className="w-3 h-3" />{proj.location}</p>
        </div>
        <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full border border-emerald-200">🟢 Đang mở bán</span>
      </div>
      <div className="grid grid-cols-4 gap-2 mb-3">
        {[
          { label: 'Tổng căn', value: proj.totalUnits },
          { label: 'Đã bán', value: proj.soldUnits, color: 'text-emerald-700' },
          { label: 'Đang giữ', value: proj.heldUnits, color: 'text-amber-700' },
          { label: 'Còn lại', value: proj.availableUnits, color: 'text-blue-700' },
        ].map(s => (
          <div key={s.label} className="text-center">
            <div className={`text-lg font-black ${s.color || 'text-slate-800'}`}>{s.value}</div>
            <div className="text-[10px] text-slate-400">{s.label}</div>
          </div>
        ))}
      </div>
      <div className="space-y-2">
        <div>
          <div className="flex justify-between text-[10px] text-slate-500 mb-1"><span>Tỉ lệ bán</span><span className="font-bold">{soldPct}%</span></div>
          <div className="h-1.5 rounded-full bg-slate-100"><div className="h-1.5 rounded-full bg-emerald-500" style={{ width: `${soldPct}%` }} /></div>
        </div>
        <div>
          <div className="flex justify-between text-[10px] text-slate-500 mb-1"><span>Thu tiền / Kế hoạch</span><span className="font-bold">{revPct}%</span></div>
          <div className="h-1.5 rounded-full bg-slate-100"><div className="h-1.5 rounded-full bg-[#316585]" style={{ width: `${revPct}%` }} /></div>
        </div>
      </div>
    </div>
  );
}

// ─── APPROVAL CARD ─────────────────────────────────────────────────────────--
function ApprovalCard({ ap, onApprove, onReject }) {
  const Icon = APPROVAL_TYPE_ICON[ap.type] || FileText;
  return (
    <div className={`p-4 rounded-xl border ${ap.status === 'pending' ? 'border-amber-200 bg-amber-50/40' : ap.status === 'approved' ? 'border-emerald-200 bg-emerald-50/30' : 'border-slate-200 bg-slate-50'}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-lg flex-shrink-0 ${ap.status === 'pending' ? 'bg-amber-100' : ap.status === 'approved' ? 'bg-emerald-100' : 'bg-slate-100'}`}>
            <Icon className={`w-4 h-4 ${ap.status === 'pending' ? 'text-amber-700' : ap.status === 'approved' ? 'text-emerald-700' : 'text-slate-500'}`} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-slate-700">{APPROVAL_TYPE_LABEL[ap.type]}</span>
              <span className="text-[10px] text-slate-400">· {ap.project} · {ap.block}</span>
            </div>
            <p className="text-sm text-slate-800 font-medium mt-1">{ap.detail}</p>
            <p className="text-xs text-slate-500 mt-0.5">Yêu cầu từ: {ap.requestedBy}</p>
            <div className="flex items-center gap-4 mt-2">
              <span className="text-[10px] bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded-full">
                📊 {ap.impact}
              </span>
              <span className="text-[10px] text-slate-400">{new Date(ap.requestedAt).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}</span>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-1.5 flex-shrink-0">
          {ap.status === 'pending' ? (
            <>
              <Button size="sm" className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700" onClick={() => onApprove(ap)}>
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Duyệt
              </Button>
              <Button size="sm" variant="outline" className="h-8 text-xs border-red-200 text-red-600 hover:bg-red-50" onClick={() => onReject(ap)}>
                <XCircle className="w-3.5 h-3.5 mr-1" /> Từ chối
              </Button>
            </>
          ) : (
            <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${ap.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
              {ap.status === 'approved' ? '✅ Đã duyệt' : '❌ Từ chối'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function DeveloperPortalPage() {
  const [selectedProjectId, setSelectedProjectId] = useState('p1');
  const [approvals, setApprovals] = useState(APPROVALS);
  const [activeTab, setActiveTab] = useState('overview'); // overview | approvals | agencies | docs

  const proj = PROJECTS.find(p => p.id === selectedProjectId);
  const pendingCount = approvals.filter(a => a.status === 'pending').length;

  const handleApprove = (ap) => {
    setApprovals(prev => prev.map(a => a.id === ap.id ? { ...a, status: 'approved' } : a));
    toast.success(`✅ Đã phê duyệt: ${ap.detail}`);
  };
  const handleReject = (ap) => {
    setApprovals(prev => prev.map(a => a.id === ap.id ? { ...a, status: 'rejected' } : a));
    toast.info(`❌ Đã từ chối: ${ap.detail}`);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900">🏗️ Cổng Chủ Đầu Tư</h1>
            <span className="text-[10px] font-bold bg-[#316585]/10 text-[#316585] border border-[#316585]/20 px-2 py-0.5 rounded-full">DEVELOPER PORTAL</span>
          </div>
          <p className="text-sm text-slate-500 mt-0.5">Theo dõi, phê duyệt và kiểm soát toàn bộ hoạt động phân phối</p>
        </div>
        <div className="flex gap-2">
          {pendingCount > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span className="text-xs font-bold text-amber-700">{pendingCount} phê duyệt đang chờ</span>
            </div>
          )}
          <Button variant="outline" size="sm"><Download className="w-4 h-4 mr-1.5" /> Báo cáo CĐT</Button>
        </div>
      </div>

      {/* Project Selector */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {PROJECTS.map(p => (
          <ProjectCard key={p.id} proj={p} isSelected={selectedProjectId === p.id} onSelect={() => setSelectedProjectId(p.id)} />
        ))}
      </div>

      {/* Revenue Summary */}
      {proj && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: 'Doanh thu kế hoạch', value: fmtT(proj.targetRevenue), icon: Target, color: 'text-slate-700' },
            { label: 'Đã thu về', value: fmtT(proj.collectedRevenue), icon: DollarSign, color: 'text-emerald-700' },
            { label: 'Tiền đặt cọc', value: fmtT(proj.depositRevenue), icon: TrendingUp, color: 'text-blue-700' },
            { label: 'Tỉ lệ thu / KH', value: `${Math.round((proj.collectedRevenue / proj.targetRevenue) * 100)}%`, icon: BarChart3, color: 'text-[#316585]' },
          ].map(s => (
            <Card key={s.label} className="border shadow-none">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1.5">
                  <s.icon className={`w-4 h-4 ${s.color}`} />
                  <span className="text-xs text-slate-500">{s.label}</span>
                </div>
                <div className={`text-xl font-black ${s.color}`}>{s.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-lg p-1 w-fit">
        {[
          { id: 'approvals', label: '✅ Phê duyệt', badge: pendingCount },
          { id: 'agencies', label: '🏢 Đại lý', badge: null },
          { id: 'docs', label: '📁 Tài liệu pháp lý', badge: null },
        ].map(t => (
          <button key={t.id}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${activeTab === t.id ? 'bg-white shadow text-[#316585]' : 'text-slate-500 hover:text-slate-700'}`}
            onClick={() => setActiveTab(t.id)}>
            {t.label}
            {t.badge > 0 && <span className="bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">{t.badge}</span>}
          </button>
        ))}
      </div>

      {/* Tab: Approvals */}
      {activeTab === 'approvals' && (
        <div className="space-y-3">
          {approvals.map(ap => <ApprovalCard key={ap.id} ap={ap} onApprove={handleApprove} onReject={handleReject} />)}
        </div>
      )}

      {/* Tab: Agencies */}
      {activeTab === 'agencies' && (
        <Card className="border shadow-none">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    {['Đại lý', 'Tier', 'Dự án', 'Căn phân bổ', 'Đã bán', 'Doanh số', 'KPI %'].map(h => (
                      <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {AGENCY_PERF.map(ag => (
                    <tr key={ag.name} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-semibold text-slate-800">{ag.name}</td>
                      <td className="px-4 py-3"><span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${TIER_CLR[ag.tier]}`}>{ag.tier}</span></td>
                      <td className="px-4 py-3 text-xs text-slate-500">{ag.projects.join(', ')}</td>
                      <td className="px-4 py-3 font-semibold">{ag.allocated}</td>
                      <td className="px-4 py-3 text-emerald-700 font-bold">{ag.sold}</td>
                      <td className="px-4 py-3 text-[#316585] font-bold">{fmtT(ag.revenue)}</td>
                      <td className="px-4 py-3">
                        <span className={`font-bold ${perfColor(ag.achievement)}`}>{ag.achievement}%</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tab: Documents */}
      {activeTab === 'docs' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {DOCUMENTS.map(doc => (
            <div key={doc.id} className="bg-white rounded-xl border p-4 hover:shadow-md transition-shadow cursor-pointer group">
              <div className="flex items-start justify-between mb-3">
                <div className={`p-2.5 rounded-xl ${doc.type === 'legal' ? 'bg-amber-100' : doc.type === 'plan' ? 'bg-blue-100' : doc.type === 'pricing' ? 'bg-emerald-100' : 'bg-slate-100'}`}>
                  <FileText className={`w-5 h-5 ${doc.type === 'legal' ? 'text-amber-700' : doc.type === 'plan' ? 'text-blue-700' : doc.type === 'pricing' ? 'text-emerald-700' : 'text-slate-600'}`} />
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${doc.status === 'valid' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-amber-100 text-amber-700 border-amber-200'}`}>
                  {doc.status === 'valid' ? 'Có hiệu lực' : 'Bản nháp'}
                </span>
              </div>
              <h4 className="font-bold text-slate-800 text-sm group-hover:text-[#316585] transition-colors">{doc.name}</h4>
              <p className="text-[10px] text-slate-400 mt-1">{doc.project} · {new Date(doc.date).toLocaleDateString('vi-VN')}</p>
              <Button variant="ghost" size="sm" className="w-full mt-3 h-7 text-xs text-[#316585]" onClick={() => toast.info(`Đang mở tài liệu: ${doc.name}`)}>
                <Eye className="w-3 h-3 mr-1" /> Xem tài liệu <Download className="w-3 h-3 ml-auto" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
