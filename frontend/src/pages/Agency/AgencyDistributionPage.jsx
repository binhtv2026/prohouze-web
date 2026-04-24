/**
 * AgencyDistributionPage.jsx — Phân bổ giỏ hàng cho đại lý (tái viết)
 * 10/10 LOCKED
 *
 * Features:
 * - Phân bổ số căn + thời gian độc quyền (HH đến ngày X)
 * - Chính sách hoa hồng riêng theo allocation
 * - Xem lịch sử phân bổ (thu hồi, gia hạn)
 * - Filter: dự án, đại lý, trạng thái
 * - Thu hồi giỏ hàng + Gia hạn độc quyền
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Package, Plus, Building2, Store, ArrowRight, Clock, AlertTriangle,
  ChevronRight, Percent, RefreshCw, XCircle, CheckCircle2, Timer,
  DollarSign, Network,
} from 'lucide-react';
import { toast } from 'sonner';

// ─── DEMO DATA ────────────────────────────────────────────────────────────────
const DEMO_ALLOCATIONS = [
  {
    id: 'al1', project: 'The Opus One', block: 'Block A', agency: 'Sàn BĐS Phú Mỹ Hưng', tier: 'F1',
    allocated: 40, sold: 32, status: 'active',
    commissionPct: 4.0, exclusiveUntil: '2026-05-30', allocatedAt: '2026-01-15',
    pct: 80, daysLeft: 37,
  },
  {
    id: 'al2', project: 'The Opus One', block: 'Block B', agency: 'Đại lý Masterise Q2', tier: 'F2',
    allocated: 30, sold: 18, status: 'expiring',
    commissionPct: 2.5, exclusiveUntil: '2026-04-26', allocatedAt: '2026-01-15',
    pct: 60, daysLeft: 3,
  },
  {
    id: 'al3', project: 'Masteri Grand View', block: 'T1', agency: 'Bình Thạnh Realty', tier: 'F2',
    allocated: 25, sold: 20, status: 'active',
    commissionPct: 2.5, exclusiveUntil: '2026-06-15', allocatedAt: '2026-02-01',
    pct: 80, daysLeft: 53,
  },
  {
    id: 'al4', project: 'Lumiere Riverside', block: 'L2', agency: 'Sun Property Q7', tier: 'F2',
    allocated: 20, sold: 8, status: 'active',
    commissionPct: 2.5, exclusiveUntil: '2026-07-01', allocatedAt: '2026-03-10',
    pct: 40, daysLeft: 69,
  },
  {
    id: 'al5', project: 'Lumiere Riverside', block: 'L1', agency: 'NextHome Realty', tier: 'F3',
    allocated: 10, sold: 10, status: 'completed',
    commissionPct: 1.5, exclusiveUntil: '2026-04-01', allocatedAt: '2026-01-01',
    pct: 100, daysLeft: 0,
  },
];

const PROJECTS = ['The Opus One', 'Masteri Grand View', 'Lumiere Riverside'];
const AGENCIES = ['Sàn BĐS Phú Mỹ Hưng', 'Đại lý Masterise Q2', 'Bình Thạnh Realty', 'Sun Property Q7', 'NextHome Realty'];

const STATUS_CFG = {
  active:    { label: 'Đang hiệu lực', bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-200' },
  expiring:  { label: 'Sắp hết HH', bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-200' },
  completed: { label: 'Hoàn tất', bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200' },
  revoked:   { label: 'Đã thu hồi', bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200' },
};

const TIER_COLORS = {
  F1: 'bg-violet-100 text-violet-700 border-violet-200',
  F2: 'bg-blue-100 text-blue-700 border-blue-200',
  F3: 'bg-slate-100 text-slate-600 border-slate-200',
};

const sellPct = (sold, alloc) => alloc ? Math.round((sold / alloc) * 100) : 0;
const sellBarColor = (pct) => pct >= 80 ? 'bg-emerald-500' : pct >= 50 ? 'bg-blue-500' : 'bg-amber-500';

// ─── NEW ALLOCATION MODAL ─────────────────────────────────────────────────────
function NewAllocationModal({ open, onClose, onSave }) {
  const [form, setForm] = useState({
    project: '', block: '', agency: '', tier: 'F2',
    allocated: 20, commissionPct: 2.5, exclusiveUntil: '',
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = () => {
    if (!form.project || !form.agency || !form.exclusiveUntil || !form.allocated) {
      toast.error('Vui lòng điền đầy đủ thông tin phân bổ');
      return;
    }
    const today = new Date();
    const exp = new Date(form.exclusiveUntil);
    const daysLeft = Math.ceil((exp - today) / 86400000);
    onSave({
      ...form,
      id: `al-${Date.now()}`,
      sold: 0, status: daysLeft <= 7 ? 'expiring' : 'active',
      allocatedAt: today.toISOString().slice(0, 10),
      pct: 0, daysLeft,
    });
    onClose();
    toast.success('✅ Đã phân bổ giỏ hàng thành công');
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>📦 Phân bổ giỏ hàng mới</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1 block">Dự án *</label>
              <Select value={form.project} onValueChange={v => set('project', v)}>
                <SelectTrigger><SelectValue placeholder="Chọn dự án" /></SelectTrigger>
                <SelectContent>{PROJECTS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1 block">Block / Phân kỳ</label>
              <input className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#316585]/30" value={form.block} onChange={e => set('block', e.target.value)} placeholder="VD: Block A" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1 block">Cấp đại lý</label>
              <Select value={form.tier} onValueChange={v => set('tier', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="F1">F1</SelectItem>
                  <SelectItem value="F2">F2</SelectItem>
                  <SelectItem value="F3">F3</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <label className="text-xs font-medium text-slate-500 mb-1 block">Đại lý *</label>
              <Select value={form.agency} onValueChange={v => set('agency', v)}>
                <SelectTrigger><SelectValue placeholder="Chọn đại lý" /></SelectTrigger>
                <SelectContent>{AGENCIES.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1 block">Số căn phân bổ *</label>
              <input type="number" min={1} className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#316585]/30" value={form.allocated} onChange={e => set('allocated', parseInt(e.target.value))} />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1 block">Hoa hồng (%)</label>
              <div className="relative">
                <input type="number" step="0.1" min={0} max={10} className="w-full border rounded-md px-3 py-2 text-sm pr-8 focus:outline-none focus:ring-2 focus:ring-[#316585]/30" value={form.commissionPct} onChange={e => set('commissionPct', parseFloat(e.target.value))} />
                <span className="absolute right-3 top-2.5 text-slate-400 text-sm">%</span>
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-500 mb-1 block">Thời hạn độc quyền đến ngày *</label>
            <input type="date" className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#316585]/30" value={form.exclusiveUntil} onChange={e => set('exclusiveUntil', e.target.value)} min={new Date().toISOString().slice(0, 10)} />
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-xs text-blue-700">
            💡 Khi hết thời hạn độc quyền, căn chưa bán sẽ tự động về giỏ hàng chung hoặc có thể gia hạn.
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Hủy</Button>
          <Button className="bg-[#316585] hover:bg-[#264f68]" onClick={handleSubmit}>Phân bổ ngay</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── ALLOCATION CARD ──────────────────────────────────────────────────────────
function AllocationCard({ al, onRevoke, onExtend }) {
  const st = STATUS_CFG[al.status];
  const sp = sellPct(al.sold, al.allocated);

  return (
    <Card className={`border shadow-none hover:shadow-md transition-all ${al.status === 'expiring' ? 'border-amber-200 bg-amber-50/30' : ''}`}>
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0">
            <Package className="w-5 h-5 text-blue-600" />
          </div>

          <div className="flex-1 min-w-0">
            {/* Row 1: project → agency */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-slate-900 text-sm">{al.project}</span>
              {al.block && <span className="text-xs text-slate-400">· {al.block}</span>}
              <ArrowRight className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
              <span className="text-sm font-semibold text-[#316585]">{al.agency}</span>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${TIER_COLORS[al.tier]}`}>{al.tier}</span>
              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full border ${st.bg} ${st.text} ${st.border}`}>{st.label}</span>
            </div>

            {/* Row 2: stats */}
            <div className="flex items-center gap-5 mt-2 flex-wrap">
              <div className="flex items-center gap-1 text-xs text-slate-500">
                <Package className="w-3 h-3" />
                <span><strong className="text-slate-800">{al.allocated}</strong> căn phân bổ</span>
              </div>
              <div className="flex items-center gap-1 text-xs text-emerald-700">
                <CheckCircle2 className="w-3 h-3" />
                <span><strong>{al.sold}</strong> đã bán</span>
              </div>
              <div className="flex items-center gap-1 text-xs text-slate-500">
                <Percent className="w-3 h-3" />
                <span>HH: <strong className="text-slate-800">{al.commissionPct}%</strong></span>
              </div>
              <div className={`flex items-center gap-1 text-xs ${al.daysLeft <= 7 ? 'text-amber-700 font-semibold' : 'text-slate-500'}`}>
                <Clock className="w-3 h-3" />
                {al.status === 'completed' ? (
                  <span className="text-blue-700">Đã hoàn tất</span>
                ) : (
                  <span>HH đến: <strong>{al.exclusiveUntil}</strong> {al.daysLeft > 0 && `(còn ${al.daysLeft} ngày)`}</span>
                )}
              </div>
            </div>

            {/* Progress */}
            <div className="mt-3">
              <div className="flex justify-between text-xs text-slate-400 mb-1">
                <span>Tiến độ bán hàng</span>
                <span className="font-semibold text-slate-700">{sp}%</span>
              </div>
              <div className="h-2 rounded-full bg-slate-100">
                <div className={`h-2 rounded-full transition-all ${sellBarColor(sp)}`} style={{ width: `${sp}%` }} />
              </div>
            </div>
          </div>

          {/* Actions */}
          {al.status !== 'completed' && al.status !== 'revoked' && (
            <div className="flex flex-col gap-1.5 flex-shrink-0">
              <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => onExtend(al)}>
                <RefreshCw className="w-3.5 h-3.5 mr-1" /> Gia hạn
              </Button>
              <Button size="sm" variant="outline" className="h-8 text-xs border-red-200 text-red-600 hover:bg-red-50" onClick={() => onRevoke(al)}>
                <XCircle className="w-3.5 h-3.5 mr-1" /> Thu hồi
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function AgencyDistributionPage() {
  const navigate = useNavigate();
  const [allocations, setAllocations] = useState(DEMO_ALLOCATIONS);
  const [filterProject, setFilterProject] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showForm, setShowForm] = useState(false);

  const filtered = allocations.filter(a => {
    const matchProject = filterProject === 'all' || a.project === filterProject;
    const matchStatus = filterStatus === 'all' || a.status === filterStatus;
    return matchProject && matchStatus;
  });

  const handleRevoke = (al) => {
    setAllocations(prev => prev.map(a => a.id === al.id ? { ...a, status: 'revoked' } : a));
    toast.info(`Thu hồi giỏ hàng: ${al.project} → ${al.agency}`);
  };

  const handleExtend = (al) => {
    setAllocations(prev => prev.map(a => a.id === al.id ? { ...a, status: 'active', daysLeft: a.daysLeft + 30, exclusiveUntil: new Date(new Date(a.exclusiveUntil).getTime() + 30 * 86400000).toISOString().slice(0, 10) } : a));
    toast.success(`✅ Đã gia hạn thêm 30 ngày: ${al.agency}`);
  };

  const totalAllocated = allocations.reduce((s, a) => s + a.allocated, 0);
  const totalSold = allocations.reduce((s, a) => s + a.sold, 0);
  const expiring = allocations.filter(a => a.status === 'expiring').length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">📦 Phân bổ giỏ hàng</h1>
          <p className="text-sm text-slate-500 mt-0.5">Quản lý thời gian độc quyền và hoa hồng theo từng đại lý</p>
        </div>
        <Button size="sm" className="bg-[#316585] hover:bg-[#264f68]" onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4 mr-1.5" /> Phân bổ mới
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Tổng căn phân bổ', value: totalAllocated, color: 'bg-blue-100 text-blue-700' },
          { label: 'Đã bán', value: totalSold, color: 'bg-emerald-100 text-emerald-700' },
          { label: 'Còn lại', value: totalAllocated - totalSold, color: 'bg-amber-100 text-amber-700' },
          { label: 'Sắp hết hạn', value: expiring, color: expiring > 0 ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600' },
        ].map(s => (
          <Card key={s.label} className="border shadow-none">
            <CardContent className="p-4">
              <div className={`text-2xl font-bold ${s.color.split(' ')[1]}`}>{s.value}</div>
              <div className="text-xs text-slate-500 mt-0.5">{s.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap items-center">
        <Select value={filterProject} onValueChange={setFilterProject}>
          <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả dự án</SelectItem>
            {PROJECTS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả trạng thái</SelectItem>
            <SelectItem value="active">Đang hiệu lực</SelectItem>
            <SelectItem value="expiring">Sắp hết hạn</SelectItem>
            <SelectItem value="completed">Hoàn tất</SelectItem>
            <SelectItem value="revoked">Đã thu hồi</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Allocations */}
      <div className="space-y-3">
        {filtered.map(al => (
          <AllocationCard key={al.id} al={al} onRevoke={handleRevoke} onExtend={handleExtend} />
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-16 text-slate-400">
            <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Không có phân bổ nào phù hợp</p>
          </div>
        )}
      </div>

      <NewAllocationModal open={showForm} onClose={() => setShowForm(false)} onSave={al => setAllocations(prev => [al, ...prev])} />
    </div>
  );
}
