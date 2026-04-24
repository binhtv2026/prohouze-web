import { useState } from 'react';
import { Plus, Search, Wallet, CheckCircle2, Clock, AlertTriangle, MoreHorizontal, Eye, Pencil, Trash2, Receipt } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

const STATUS_MAP = {
  pending:  { label: 'Chờ thanh toán', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  paid:     { label: 'Đã thanh toán',  color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  overdue:  { label: 'Quá hạn',        color: 'bg-rose-100 text-rose-700 border-rose-200' },
  partial:  { label: 'Thanh toán 1 phần', color: 'bg-blue-100 text-blue-700 border-blue-200' },
};

const TYPES = ['Tiền thuê', 'Tiền điện', 'Tiền nước', 'Phí dịch vụ', 'Phí vệ sinh', 'Phí gửi xe', 'Khác'];

function formatMoney(v) {
  if (!v) return '—';
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)} triệu`;
  return `${v.toLocaleString('vi-VN')} đ`;
}

const DEMO_INVOICES = [
  { id: 'i1', code: 'HD-24001-T4', asset_name: 'Căn hộ 12A - Vinhomes Grand Park', tenant_name: 'Trần Thị Bình', type: 'Tiền thuê', amount: 12000000, due_date: '2026-04-05', paid_date: '2026-04-03', status: 'paid', note: '' },
  { id: 'i2', code: 'HD-24001-T4-DNC', asset_name: 'Căn hộ 12A - Vinhomes Grand Park', tenant_name: 'Trần Thị Bình', type: 'Tiền điện', amount: 850000, due_date: '2026-04-10', paid_date: null, status: 'pending', note: '210 số điện' },
  { id: 'i3', code: 'HD-24015-T4', asset_name: 'Nhà phố 123 Trần Hưng Đạo', tenant_name: 'Hoàng Gia Bảo', type: 'Tiền thuê', amount: 22000000, due_date: '2026-04-01', paid_date: null, status: 'overdue', note: '' },
  { id: 'i4', code: 'HD-25003-T4', asset_name: 'Căn hộ 5B - Masteri Thảo Điền', tenant_name: 'Đặng Quang Huy', type: 'Tiền thuê', amount: 18000000, due_date: '2026-04-15', paid_date: '2026-04-14', status: 'paid', note: '' },
  { id: 'i5', code: 'HD-24008-T4', asset_name: 'VP B202 Saigon Centre', tenant_name: 'Cty Bình Minh', type: 'Phí dịch vụ', amount: 5500000, due_date: '2026-04-10', paid_date: null, status: 'partial', note: 'Đã trả 3 triệu, còn thiếu 2.5 triệu' },
];

export default function LeasingInvoicesPage() {
  const [invoices, setInvoices] = useState(DEMO_INVOICES);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editInvoice, setEditInvoice] = useState(null);
  const [viewInvoice, setViewInvoice] = useState(null);
  const [form, setForm] = useState({ code: '', asset_name: '', tenant_name: '', type: 'Tiền thuê', amount: '', due_date: '', paid_date: '', status: 'pending', note: '' });

  const filtered = invoices.filter(inv => {
    const q = search.toLowerCase();
    const matchSearch = !search || inv.code.toLowerCase().includes(q) || inv.tenant_name.toLowerCase().includes(q) || inv.asset_name.toLowerCase().includes(q);
    const matchStatus = statusFilter === 'all' || inv.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalPaid = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + i.amount, 0);
  const totalPending = invoices.filter(i => i.status === 'pending').reduce((s, i) => s + i.amount, 0);
  const totalOverdue = invoices.filter(i => i.status === 'overdue').reduce((s, i) => s + i.amount, 0);

  function openAdd() {
    setEditInvoice(null);
    const d = new Date();
    setForm({ code: `INV-${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}-${String(invoices.length+1).padStart(3,'0')}`, asset_name: '', tenant_name: '', type: 'Tiền thuê', amount: '', due_date: '', paid_date: '', status: 'pending', note: '' });
    setShowForm(true);
  }

  function openEdit(inv) {
    setEditInvoice(inv);
    setForm({ ...inv, amount: inv.amount?.toString() || '' });
    setShowForm(true);
  }

  function handleSave() {
    if (!form.asset_name || !form.tenant_name || !form.amount || !form.due_date) {
      toast.error('Vui lòng điền đủ thông tin bắt buộc');
      return;
    }
    const payload = { ...form, amount: Number(form.amount) };
    if (editInvoice) {
      setInvoices(prev => prev.map(i => i.id === editInvoice.id ? { ...i, ...payload } : i));
      toast.success('Đã cập nhật hóa đơn');
    } else {
      setInvoices(prev => [...prev, { ...payload, id: `i${Date.now()}` }]);
      toast.success('Đã tạo hóa đơn mới');
    }
    setShowForm(false);
  }

  function markPaid(id) {
    setInvoices(prev => prev.map(i => i.id === id ? { ...i, status: 'paid', paid_date: new Date().toISOString().split('T')[0] } : i));
    toast.success('Đã đánh dấu thanh toán');
  }

  function handleDelete(id) {
    setInvoices(prev => prev.filter(i => i.id !== id));
    toast.success('Đã xóa hóa đơn');
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-slate-900">💰 Hóa đơn & Thu tiền</h1>
          <p className="text-sm text-slate-500 mt-0.5">Quản lý hóa đơn tiền thuê, điện, nước và các khoản thu dịch vụ</p>
        </div>
        <Button onClick={openAdd} className="bg-[#1a7a4a] hover:bg-[#155e3a] text-white gap-1.5">
          <Plus className="w-4 h-4" /> Tạo hóa đơn
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="border shadow-none bg-emerald-50 border-emerald-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1"><CheckCircle2 className="w-4 h-4 text-emerald-600" /><span className="text-xs text-emerald-700 font-medium">Đã thu tháng này</span></div>
            <div className="text-2xl font-bold text-emerald-700">{formatMoney(totalPaid)}</div>
          </CardContent>
        </Card>
        <Card className="border shadow-none bg-amber-50 border-amber-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1"><Clock className="w-4 h-4 text-amber-600" /><span className="text-xs text-amber-700 font-medium">Chờ thu</span></div>
            <div className="text-2xl font-bold text-amber-700">{formatMoney(totalPending)}</div>
          </CardContent>
        </Card>
        <Card className="border shadow-none bg-rose-50 border-rose-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1"><AlertTriangle className="w-4 h-4 text-rose-600" /><span className="text-xs text-rose-700 font-medium">Quá hạn</span></div>
            <div className="text-2xl font-bold text-rose-700">{formatMoney(totalOverdue)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input placeholder="Tìm mã HĐ, khách thuê, tài sản..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Trạng thái" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            <SelectItem value="pending">Chờ thanh toán</SelectItem>
            <SelectItem value="paid">Đã thanh toán</SelectItem>
            <SelectItem value="overdue">Quá hạn</SelectItem>
            <SelectItem value="partial">Thanh toán 1 phần</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Invoice list */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <Card className="border shadow-none">
            <CardContent className="py-12 text-center text-slate-400">
              <Receipt className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>Không có hóa đơn nào</p>
            </CardContent>
          </Card>
        ) : filtered.map(inv => {
          const st = STATUS_MAP[inv.status];
          return (
            <Card key={inv.id} className="border shadow-none hover:border-[#1a7a4a]/30 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                      <Wallet className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs text-slate-400">{inv.code}</span>
                        <Badge className={`${st.color} border text-xs`}>{st.label}</Badge>
                        <Badge variant="outline" className="text-xs">{inv.type}</Badge>
                      </div>
                      <p className="font-semibold text-slate-900 mt-0.5 truncate">{inv.asset_name}</p>
                      <div className="flex flex-wrap gap-3 mt-1 text-xs text-slate-500">
                        <span>👤 {inv.tenant_name}</span>
                        <span>📅 Hạn: {inv.due_date}</span>
                        {inv.paid_date && <span className="text-emerald-600">✅ Trả: {inv.paid_date}</span>}
                      </div>
                      <div className="mt-1">
                        <span className="text-base font-bold text-slate-800">{formatMoney(inv.amount)}</span>
                        {inv.note && <span className="text-xs text-slate-400 ml-2">— {inv.note}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {inv.status === 'pending' || inv.status === 'overdue' || inv.status === 'partial' ? (
                      <Button size="sm" onClick={() => markPaid(inv.id)} className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8 px-3">
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" />Đã thu
                      </Button>
                    ) : null}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon"><MoreHorizontal className="w-4 h-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setViewInvoice(inv)}><Eye className="w-4 h-4 mr-2" />Xem chi tiết</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openEdit(inv)}><Pencil className="w-4 h-4 mr-2" />Chỉnh sửa</DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(inv.id)}><Trash2 className="w-4 h-4 mr-2" />Xóa</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editInvoice ? '✏️ Chỉnh sửa hóa đơn' : '➕ Tạo hóa đơn mới'}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Mã hóa đơn</Label><Input value={form.code} onChange={e => setForm(p=>({...p,code:e.target.value}))} className="mt-1" /></div>
              <div>
                <Label>Loại phí</Label>
                <Select value={form.type} onValueChange={v=>setForm(p=>({...p,type:v}))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{TYPES.map(t=><SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>Tài sản *</Label><Input value={form.asset_name} onChange={e=>setForm(p=>({...p,asset_name:e.target.value}))} className="mt-1" /></div>
            <div><Label>Khách thuê *</Label><Input value={form.tenant_name} onChange={e=>setForm(p=>({...p,tenant_name:e.target.value}))} className="mt-1" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Số tiền (VNĐ) *</Label><Input type="number" value={form.amount} onChange={e=>setForm(p=>({...p,amount:e.target.value}))} className="mt-1" /></div>
              <div>
                <Label>Trạng thái</Label>
                <Select value={form.status} onValueChange={v=>setForm(p=>({...p,status:v}))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Chờ thanh toán</SelectItem>
                    <SelectItem value="paid">Đã thanh toán</SelectItem>
                    <SelectItem value="overdue">Quá hạn</SelectItem>
                    <SelectItem value="partial">Thanh toán 1 phần</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Ngày đến hạn *</Label><Input type="date" value={form.due_date} onChange={e=>setForm(p=>({...p,due_date:e.target.value}))} className="mt-1" /></div>
              <div><Label>Ngày thanh toán</Label><Input type="date" value={form.paid_date || ''} onChange={e=>setForm(p=>({...p,paid_date:e.target.value}))} className="mt-1" /></div>
            </div>
            <div><Label>Ghi chú</Label><Input value={form.note} onChange={e=>setForm(p=>({...p,note:e.target.value}))} className="mt-1" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={()=>setShowForm(false)}>Hủy</Button>
            <Button onClick={handleSave} className="bg-[#1a7a4a] hover:bg-[#155e3a] text-white">{editInvoice ? 'Lưu' : 'Tạo hóa đơn'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      {viewInvoice && (
        <Dialog open={!!viewInvoice} onOpenChange={()=>setViewInvoice(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>💰 {viewInvoice.code}</DialogTitle></DialogHeader>
            <div className="space-y-2 text-sm">
              <Badge className={`${STATUS_MAP[viewInvoice.status]?.color} border`}>{STATUS_MAP[viewInvoice.status]?.label}</Badge>
              {[
                { label: 'Tài sản', value: viewInvoice.asset_name },
                { label: 'Khách thuê', value: viewInvoice.tenant_name },
                { label: 'Loại phí', value: viewInvoice.type },
                { label: 'Số tiền', value: formatMoney(viewInvoice.amount) },
                { label: 'Hạn thanh toán', value: viewInvoice.due_date },
                { label: 'Ngày đã trả', value: viewInvoice.paid_date || '—' },
                { label: 'Ghi chú', value: viewInvoice.note || '—' },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between border-b pb-1.5 last:border-0">
                  <span className="text-slate-500">{label}</span>
                  <span className="font-medium">{value}</span>
                </div>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
