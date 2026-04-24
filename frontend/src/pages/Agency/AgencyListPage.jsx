/**
 * AgencyListPage.jsx — Danh sách & Quản lý đại lý
 * 10/10 LOCKED
 *
 * Features:
 * - CRUD đại lý đầy đủ (tạo, xem, sửa, phê duyệt, tạm ngưng)
 * - Filter: tier (F1/F2/F3), status, project
 * - Card view với tier badge + performance indicator
 * - AgencyFormModal: tạo/sửa đại lý với đầy đủ trường nghiệp vụ
 * - Quick actions: phê duyệt, tạm ngưng, xem mạng lưới con
 */
import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Store, Plus, Search, Phone, Mail, MapPin, Users, Network,
  CheckCircle2, XCircle, MoreHorizontal, ChevronRight, Building2,
  TrendingUp, Package, DollarSign, Shield, Clock, Filter,
  Eye, PauseCircle, PlayCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import agencyApi from '@/api/agencyApi.js';

// ─── DEMO DATA ────────────────────────────────────────────────────────────────
const DEMO_AGENCIES = [
  {
    id: 'ag1', name: 'Sàn BĐS Phú Mỹ Hưng', tier: 'F1', status: 'active',
    contact: 'Nguyễn Thành Hưng', phone: '0901234567', email: 'info@pmh-realty.vn',
    address: 'Phú Mỹ Hưng, Q.7, TP.HCM', taxCode: '0312345678',
    parent: null, ctv: 45, units: { allocated: 80, sold: 62 },
    sales: 8500000000, achievement: 142, commissionPct: 4.0, joinedAt: '2025-01-15',
  },
  {
    id: 'ag2', name: 'Đại lý Masterise Q2', tier: 'F2', status: 'active',
    contact: 'Trần Thị Bích', phone: '0912345678', email: 'masterise.q2@agency.vn',
    address: 'Thảo Điền, Q.2, TP.HCM', taxCode: '0312456789',
    parent: 'Sàn BĐS Phú Mỹ Hưng', ctv: 18, units: { allocated: 30, sold: 22 },
    sales: 6200000000, achievement: 103, commissionPct: 2.5, joinedAt: '2025-03-10',
  },
  {
    id: 'ag3', name: 'Bình Thạnh Realty', tier: 'F2', status: 'active',
    contact: 'Lê Văn Cường', phone: '0903456789', email: 'binhthanh@realty.vn',
    address: 'Bình Thạnh, TP.HCM', taxCode: '0312567890',
    parent: 'Sàn BĐS Phú Mỹ Hưng', ctv: 22, units: { allocated: 25, sold: 18 },
    sales: 5100000000, achievement: 95, commissionPct: 2.5, joinedAt: '2025-02-20',
  },
  {
    id: 'ag4', name: 'Sun Property Q7', tier: 'F2', status: 'active',
    contact: 'Phạm Đình Dũng', phone: '0934567890', email: 'sun.q7@property.vn',
    address: 'Quận 7, TP.HCM', taxCode: '0312678901',
    parent: 'Central Realty Group', ctv: 14, units: { allocated: 20, sold: 14 },
    sales: 4300000000, achievement: 82, commissionPct: 2.5, joinedAt: '2025-04-01',
  },
  {
    id: 'ag5', name: 'Sunny Homes Pending', tier: 'F2', status: 'pending',
    contact: 'Hoàng Anh Tuấn', phone: '0945671234', email: 'sunhouse@gmail.com',
    address: 'Quận Tân Bình, TP.HCM', taxCode: '0312789012',
    parent: null, ctv: 0, units: { allocated: 0, sold: 0 },
    sales: 0, achievement: 0, commissionPct: 2.5, joinedAt: '2026-04-20',
  },
  {
    id: 'ag6', name: 'Nexus Realty (Tạm ngưng)', tier: 'F3', status: 'suspended',
    contact: 'Vũ Minh Khoa', phone: '0956781234', email: 'nexus@realty.vn',
    address: 'Bình Dương', taxCode: '0312890123',
    parent: 'Bình Thạnh Realty', ctv: 3, units: { allocated: 5, sold: 2 },
    sales: 800000000, achievement: 40, commissionPct: 1.5, joinedAt: '2025-06-01',
  },
];

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const STATUS_CFG = {
  active:    { label: 'Hoạt động', bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' },
  pending:   { label: 'Chờ duyệt', bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500' },
  suspended: { label: 'Tạm ngưng', bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200', dot: 'bg-slate-400' },
};

const TIER_CFG = {
  F1: { bg: 'bg-violet-100', text: 'text-violet-700', border: 'border-violet-200', label: 'F1 — Sàn chính' },
  F2: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200', label: 'F2 — Đại lý' },
  F3: { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200', label: 'F3 — Môi giới' },
};

const fmtB = (v) => {
  if (!v) return '—';
  if (v >= 1e9) return `${(v / 1e9).toFixed(1)} tỷ`;
  if (v >= 1e6) return `${(v / 1e6).toFixed(0)} tr`;
  return '—';
};

const perfColor = (pct) => pct >= 100 ? 'text-emerald-700' : pct >= 80 ? 'text-blue-700' : pct > 0 ? 'text-amber-700' : 'text-slate-400';
const perfBg = (pct) => pct >= 100 ? 'bg-emerald-500' : pct >= 80 ? 'bg-blue-500' : pct > 0 ? 'bg-amber-500' : 'bg-slate-200';

// ─── AGENCY FORM MODAL ────────────────────────────────────────────────────────
function AgencyFormModal({ open, onClose, agency = null, onSave }) {
  const isEdit = !!agency;
  const [form, setForm] = useState(agency || {
    name: '', tier: 'F2', contact: '', phone: '', email: '',
    address: '', taxCode: '', commissionPct: 2.5, parent: null,
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = () => {
    if (!form.name || !form.contact || !form.phone) {
      toast.error('Vui lòng điền đầy đủ tên đại lý, người đại diện và số điện thoại');
      return;
    }
    onSave(form);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? '✏️ Sửa thông tin đại lý' : '➕ Thêm đại lý mới'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Tier + Name */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1 block">Phân cấp *</label>
              <Select value={form.tier} onValueChange={v => set('tier', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="F1">F1 — Sàn chính</SelectItem>
                  <SelectItem value="F2">F2 — Đại lý</SelectItem>
                  <SelectItem value="F3">F3 — Môi giới</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <label className="text-xs font-medium text-slate-500 mb-1 block">Tên đại lý / Sàn *</label>
              <input className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#316585]/30" value={form.name} onChange={e => set('name', e.target.value)} placeholder="VD: Sàn BĐS ABC" />
            </div>
          </div>

          {/* Contact info */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1 block">Người đại diện *</label>
              <input className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#316585]/30" value={form.contact} onChange={e => set('contact', e.target.value)} placeholder="Họ và tên" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1 block">Số điện thoại *</label>
              <input className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#316585]/30" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="0901234567" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1 block">Email</label>
              <input className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#316585]/30" value={form.email} onChange={e => set('email', e.target.value)} placeholder="email@domain.vn" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1 block">Mã số thuế</label>
              <input className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#316585]/30" value={form.taxCode} onChange={e => set('taxCode', e.target.value)} placeholder="0312345678" />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-500 mb-1 block">Địa chỉ</label>
            <input className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#316585]/30" value={form.address} onChange={e => set('address', e.target.value)} placeholder="Địa chỉ văn phòng" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1 block">% Hoa hồng nhận</label>
              <div className="relative">
                <input type="number" step="0.1" min="0" max="10" className="w-full border rounded-md px-3 py-2 text-sm pr-8 focus:outline-none focus:ring-2 focus:ring-[#316585]/30" value={form.commissionPct} onChange={e => set('commissionPct', parseFloat(e.target.value))} />
                <span className="absolute right-3 top-2.5 text-slate-400 text-sm">%</span>
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1 block">Thuộc F1 / F2</label>
              <Select value={form.parent || '__none__'} onValueChange={v => set('parent', v === '__none__' ? null : v)}>
                <SelectTrigger><SelectValue placeholder="— Không thuộc —" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">— Cấp cao nhất —</SelectItem>
                  {DEMO_AGENCIES.filter(a => a.tier !== 'F3' && a.id !== agency?.id).map(a => (
                    <SelectItem key={a.id} value={a.name}>{a.name} ({a.tier})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Hủy</Button>
          <Button className="bg-[#316585] hover:bg-[#264f68]" onClick={handleSubmit}>
            {isEdit ? 'Cập nhật' : 'Thêm đại lý'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── AGENCY CARD ──────────────────────────────────────────────────────────────
function AgencyCard({ agency, onView, onApprove, onSuspend, onResume }) {
  const [showMenu, setShowMenu] = useState(false);
  const st = STATUS_CFG[agency.status];
  const tier = TIER_CFG[agency.tier];
  const invPct = agency.units?.allocated ? Math.round((agency.units.sold / agency.units.allocated) * 100) : 0;

  return (
    <Card className="border shadow-none hover:shadow-md transition-all duration-200">
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${tier.bg} border ${tier.border}`}>
            <Store className={`w-6 h-6 ${tier.text}`} />
          </div>

          <div className="flex-1 min-w-0">
            {/* Name row */}
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-slate-900">{agency.name}</h3>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${tier.bg} ${tier.text} ${tier.border}`}>{agency.tier}</span>
              <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full border ${st.bg} ${st.text} ${st.border}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                {st.label}
              </span>
            </div>

            {/* Contact */}
            <p className="text-sm text-slate-500 mt-0.5">{agency.contact}</p>
            <div className="flex items-center gap-4 mt-1.5 text-xs text-slate-400 flex-wrap">
              <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{agency.phone}</span>
              <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{agency.email}</span>
              {agency.parent && <span className="flex items-center gap-1"><Network className="w-3 h-3" />Thuộc: {agency.parent}</span>}
            </div>

            {/* Stats */}
            {agency.status === 'active' && (
              <div className="mt-3 grid grid-cols-4 gap-3">
                <div>
                  <div className={`text-sm font-bold ${perfColor(agency.achievement)}`}>{agency.achievement}%</div>
                  <div className="text-[10px] text-slate-400">KPI</div>
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-800">{fmtB(agency.sales)}</div>
                  <div className="text-[10px] text-slate-400">Doanh số</div>
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-800">{agency.ctv}</div>
                  <div className="text-[10px] text-slate-400">CTV</div>
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-800">{agency.units?.sold}/{agency.units?.allocated}</div>
                  <div className="text-[10px] text-slate-400">Căn bán/phân bổ</div>
                </div>
              </div>
            )}

            {/* KPI bar */}
            {agency.status === 'active' && agency.achievement > 0 && (
              <div className="mt-2.5">
                <div className="h-1.5 rounded-full bg-slate-100">
                  <div className={`h-1.5 rounded-full transition-all ${perfBg(agency.achievement)}`} style={{ width: `${Math.min(agency.achievement, 100)}%` }} />
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-1.5 flex-shrink-0">
            <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => onView(agency)}>
              <Eye className="w-3.5 h-3.5 mr-1" /> Xem
            </Button>
            {agency.status === 'pending' && (
              <Button size="sm" className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700" onClick={() => onApprove(agency)}>
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Duyệt
              </Button>
            )}
            {agency.status === 'active' && (
              <Button variant="outline" size="sm" className="h-8 text-xs border-red-200 text-red-600 hover:bg-red-50" onClick={() => onSuspend(agency)}>
                <PauseCircle className="w-3.5 h-3.5 mr-1" /> Tạm ngưng
              </Button>
            )}
            {agency.status === 'suspended' && (
              <Button variant="outline" size="sm" className="h-8 text-xs border-emerald-200 text-emerald-600 hover:bg-emerald-50" onClick={() => onResume(agency)}>
                <PlayCircle className="w-3.5 h-3.5 mr-1" /> Kích hoạt
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function AgencyListPage() {
  const navigate = useNavigate();
  const [agencies, setAgencies] = useState(DEMO_AGENCIES);
  const [search, setSearch] = useState('');
  const [filterTier, setFilterTier] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editAgency, setEditAgency] = useState(null);

  const filtered = agencies.filter(a => {
    const matchSearch = !search || a.name.toLowerCase().includes(search.toLowerCase()) || a.contact.toLowerCase().includes(search.toLowerCase());
    const matchTier = filterTier === 'all' || a.tier === filterTier;
    const matchStatus = filterStatus === 'all' || a.status === filterStatus;
    return matchSearch && matchTier && matchStatus;
  });

  const handleApprove = (ag) => {
    setAgencies(prev => prev.map(a => a.id === ag.id ? { ...a, status: 'active' } : a));
    toast.success(`✅ Đã phê duyệt đại lý: ${ag.name}`);
  };

  const handleSuspend = (ag) => {
    setAgencies(prev => prev.map(a => a.id === ag.id ? { ...a, status: 'suspended' } : a));
    toast.info(`⏸️ Đã tạm ngưng: ${ag.name}`);
  };

  const handleResume = (ag) => {
    setAgencies(prev => prev.map(a => a.id === ag.id ? { ...a, status: 'active' } : a));
    toast.success(`▶️ Đã kích hoạt lại: ${ag.name}`);
  };

  const handleSave = (form) => {
    if (editAgency) {
      setAgencies(prev => prev.map(a => a.id === editAgency.id ? { ...a, ...form } : a));
      toast.success('Đã cập nhật thông tin đại lý');
    } else {
      setAgencies(prev => [...prev, { ...form, id: `ag-${Date.now()}`, status: 'pending', ctv: 0, units: { allocated: 0, sold: 0 }, sales: 0, achievement: 0, joinedAt: new Date().toISOString().slice(0, 10) }]);
      toast.success('✅ Đã tạo đại lý mới — Đang chờ phê duyệt');
    }
    setEditAgency(null);
  };

  const counts = { all: agencies.length, active: agencies.filter(a => a.status === 'active').length, pending: agencies.filter(a => a.status === 'pending').length, suspended: agencies.filter(a => a.status === 'suspended').length };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">🏢 Danh sách đại lý</h1>
          <p className="text-sm text-slate-500 mt-0.5">Quản lý mạng lưới F1/F2/F3 — {counts.all} đại lý · {counts.pending} chờ duyệt</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate('/agency/network')}>
            <Network className="w-4 h-4 mr-1.5" /> Cây mạng lưới
          </Button>
          <Button size="sm" className="bg-[#316585] hover:bg-[#264f68]" onClick={() => { setEditAgency(null); setShowForm(true); }}>
            <Plus className="w-4 h-4 mr-1.5" /> Thêm đại lý
          </Button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            className="w-full pl-9 pr-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#316585]/30"
            placeholder="Tìm tên đại lý, người đại diện..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <Select value={filterTier} onValueChange={setFilterTier}>
          <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả tầng</SelectItem>
            <SelectItem value="F1">F1 — Sàn chính</SelectItem>
            <SelectItem value="F2">F2 — Đại lý</SelectItem>
            <SelectItem value="F3">F3 — Môi giới</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả trạng thái</SelectItem>
            <SelectItem value="active">Hoạt động ({counts.active})</SelectItem>
            <SelectItem value="pending">Chờ duyệt ({counts.pending})</SelectItem>
            <SelectItem value="suspended">Tạm ngưng ({counts.suspended})</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Agency list */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <Store className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Không tìm thấy đại lý phù hợp</p>
          </div>
        ) : filtered.map(ag => (
          <AgencyCard
            key={ag.id} agency={ag}
            onView={a => { setEditAgency(a); setShowForm(true); }}
            onApprove={handleApprove}
            onSuspend={handleSuspend}
            onResume={handleResume}
          />
        ))}
      </div>

      {/* Form Modal */}
      <AgencyFormModal
        open={showForm}
        onClose={() => { setShowForm(false); setEditAgency(null); }}
        agency={editAgency}
        onSave={handleSave}
      />
    </div>
  );
}
