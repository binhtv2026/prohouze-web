import { useState } from 'react';
import { Plus, Search, Wrench, AlertTriangle, Clock, CheckCircle2, MoreHorizontal, Eye, Pencil, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

const STATUS_MAP = {
  open:        { label: 'Đang mở',       icon: <AlertTriangle className="w-3 h-3" />, color: 'bg-rose-100 text-rose-700 border-rose-200' },
  assigned:    { label: 'Đã phân công',  icon: <Clock className="w-3 h-3" />,         color: 'bg-amber-100 text-amber-700 border-amber-200' },
  in_progress: { label: 'Đang xử lý',   icon: <Clock className="w-3 h-3" />,         color: 'bg-blue-100 text-blue-700 border-blue-200' },
  resolved:    { label: 'Hoàn thành',    icon: <CheckCircle2 className="w-3 h-3" />,  color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
};

const PRIORITY_MAP = {
  high:   { label: '🔴 Cao',    color: 'text-rose-700' },
  medium: { label: '🟡 Trung',  color: 'text-amber-700' },
  low:    { label: '🟢 Thấp',   color: 'text-emerald-700' },
};

const CATEGORIES = ['Điện', 'Nước', 'Điều hòa', 'Nội thất', 'Thang máy', 'Internet', 'An ninh', 'Khác'];

const DEMO_TICKETS = [
  { id: 't1', code: 'BT-001', asset_name: 'Căn hộ 12A - Vinhomes Grand Park', category: 'Điều hòa', title: 'Điều hòa không làm lạnh', description: 'Máy lạnh phòng ngủ chạy nhưng không xuống nhiệt độ.', priority: 'high', status: 'open', reporter: 'Trần Thị Bình', assignee: '', created_at: '2026-04-17', resolved_at: null },
  { id: 't2', code: 'BT-002', asset_name: 'Nhà phố 123 Trần Hưng Đạo', category: 'Nước', title: 'Vòi nước phòng tắm bị rỉ', description: 'Vòi sen rỉ nước làm ướt sàn liên tục.', priority: 'medium', status: 'assigned', reporter: 'Hoàng Gia Bảo', assignee: 'Kỹ thuật viên A', created_at: '2026-04-15', resolved_at: null },
  { id: 't3', code: 'BT-003', asset_name: 'VP B202 Saigon Centre', category: 'Internet', title: 'Mạng wifi bị ngắt kết nối', description: 'Wifi hay bị mất kết nối, cần kiểm tra router.', priority: 'medium', status: 'in_progress', reporter: 'Công ty Bình Minh', assignee: 'Kỹ thuật viên B', created_at: '2026-04-14', resolved_at: null },
  { id: 't4', code: 'BT-004', asset_name: 'Căn hộ 5B - Masteri Thảo Điền', category: 'Nội thất', title: 'Tủ bếp bị bong tróc', description: 'Cánh tủ bếp bị bong tróc lớp sơn, cần sơn lại.', priority: 'low', status: 'resolved', reporter: 'Đặng Quang Huy', assignee: 'Kỹ thuật viên A', created_at: '2026-04-10', resolved_at: '2026-04-12' },
];

export default function LeasingMaintenancePage() {
  const [tickets, setTickets] = useState(DEMO_TICKETS);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editTicket, setEditTicket] = useState(null);
  const [viewTicket, setViewTicket] = useState(null);
  const [form, setForm] = useState({ code: '', asset_name: '', category: 'Điện', title: '', description: '', priority: 'medium', status: 'open', reporter: '', assignee: '' });

  const filtered = tickets.filter(t => {
    const q = search.toLowerCase();
    const matchSearch = !search || t.title.toLowerCase().includes(q) || t.asset_name.toLowerCase().includes(q) || t.code.toLowerCase().includes(q);
    const matchStatus = statusFilter === 'all' || t.status === statusFilter;
    const matchPriority = priorityFilter === 'all' || t.priority === priorityFilter;
    return matchSearch && matchStatus && matchPriority;
  });

  const openCount = tickets.filter(t => t.status === 'open').length;
  const highCount = tickets.filter(t => t.priority === 'high' && t.status !== 'resolved').length;

  function openAdd() {
    setEditTicket(null);
    setForm({ code: `BT-${String(tickets.length + 1).padStart(3, '0')}`, asset_name: '', category: 'Điện', title: '', description: '', priority: 'medium', status: 'open', reporter: '', assignee: '' });
    setShowForm(true);
  }

  function openEdit(t) {
    setEditTicket(t);
    setForm({ ...t });
    setShowForm(true);
  }

  function handleSave() {
    if (!form.title || !form.asset_name) {
      toast.error('Vui lòng điền tên sự cố và tài sản');
      return;
    }
    if (editTicket) {
      setTickets(prev => prev.map(t => t.id === editTicket.id ? { ...t, ...form } : t));
      toast.success('Đã cập nhật phiếu bảo trì');
    } else {
      setTickets(prev => [...prev, { ...form, id: `t${Date.now()}`, created_at: new Date().toISOString().split('T')[0], resolved_at: null }]);
      toast.success('Đã ghi nhận sự cố');
    }
    setShowForm(false);
  }

  function handleDelete(id) {
    setTickets(prev => prev.filter(t => t.id !== id));
    toast.success('Đã xóa phiếu bảo trì');
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-slate-900">🔧 Bảo trì & Sự cố</h1>
          <p className="text-sm text-slate-500 mt-0.5">Ghi nhận, phân công và theo dõi xử lý sự cố tại tài sản</p>
        </div>
        <Button onClick={openAdd} className="bg-[#1a7a4a] hover:bg-[#155e3a] text-white gap-1.5">
          <Plus className="w-4 h-4" /> Ghi nhận sự cố
        </Button>
      </div>

      {/* Alert */}
      {highCount > 0 && (
        <div className="flex items-center gap-3 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 text-sm text-rose-800">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span><strong>{highCount} sự cố ưu tiên cao</strong> đang mở — cần xử lý trong ngày.</span>
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Đang mở', value: tickets.filter(t => t.status === 'open').length, color: 'text-rose-700' },
          { label: 'Đang xử lý', value: tickets.filter(t => ['assigned','in_progress'].includes(t.status)).length, color: 'text-amber-700' },
          { label: 'Hoàn thành', value: tickets.filter(t => t.status === 'resolved').length, color: 'text-emerald-700' },
          { label: 'Ưu tiên cao', value: highCount, color: 'text-rose-700' },
        ].map(s => (
          <Card key={s.label} className="border shadow-none">
            <CardContent className="p-3 text-center">
              <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-xs text-slate-500">{s.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input placeholder="Tìm sự cố, tài sản..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]"><SelectValue placeholder="Trạng thái" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            <SelectItem value="open">Đang mở</SelectItem>
            <SelectItem value="assigned">Đã phân công</SelectItem>
            <SelectItem value="in_progress">Đang xử lý</SelectItem>
            <SelectItem value="resolved">Hoàn thành</SelectItem>
          </SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Ưu tiên" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            <SelectItem value="high">🔴 Cao</SelectItem>
            <SelectItem value="medium">🟡 Trung bình</SelectItem>
            <SelectItem value="low">🟢 Thấp</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <Card className="border shadow-none">
            <CardContent className="py-12 text-center text-slate-400">
              <Wrench className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>Không có sự cố nào</p>
            </CardContent>
          </Card>
        ) : filtered.map(t => {
          const st = STATUS_MAP[t.status];
          const pr = PRIORITY_MAP[t.priority];
          return (
            <Card key={t.id} className="border shadow-none hover:border-[#1a7a4a]/30 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center flex-shrink-0">
                      <Wrench className="w-5 h-5 text-rose-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs text-slate-400">{t.code}</span>
                        <Badge className={`${st.color} border text-xs`}>{st.label}</Badge>
                        <span className={`text-xs font-medium ${pr.color}`}>{pr.label}</span>
                        <Badge variant="outline" className="text-xs">{t.category}</Badge>
                      </div>
                      <p className="font-semibold text-slate-900 mt-0.5">{t.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5 truncate">{t.asset_name}</p>
                      <div className="flex flex-wrap gap-3 mt-1 text-xs text-slate-500">
                        <span>👤 {t.reporter}</span>
                        {t.assignee && <span>🔧 {t.assignee}</span>}
                        <span>📅 {t.created_at}</span>
                      </div>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="flex-shrink-0"><MoreHorizontal className="w-4 h-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setViewTicket(t)}><Eye className="w-4 h-4 mr-2" />Xem chi tiết</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openEdit(t)}><Pencil className="w-4 h-4 mr-2" />Cập nhật</DropdownMenuItem>
                      <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(t.id)}><Trash2 className="w-4 h-4 mr-2" />Xóa phiếu</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editTicket ? '✏️ Cập nhật phiếu bảo trì' : '➕ Ghi nhận sự cố mới'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Mã phiếu</Label>
                <Input value={form.code} onChange={e => setForm(p => ({ ...p, code: e.target.value }))} className="mt-1" />
              </div>
              <div>
                <Label>Danh mục</Label>
                <Select value={form.category} onValueChange={v => setForm(p => ({ ...p, category: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Tài sản *</Label>
              <Input value={form.asset_name} onChange={e => setForm(p => ({ ...p, asset_name: e.target.value }))} className="mt-1" />
            </div>
            <div>
              <Label>Tiêu đề sự cố *</Label>
              <Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} className="mt-1" />
            </div>
            <div>
              <Label>Mô tả chi tiết</Label>
              <Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={3} className="mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Ưu tiên</Label>
                <Select value={form.priority} onValueChange={v => setForm(p => ({ ...p, priority: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">🔴 Cao</SelectItem>
                    <SelectItem value="medium">🟡 Trung bình</SelectItem>
                    <SelectItem value="low">🟢 Thấp</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Trạng thái</Label>
                <Select value={form.status} onValueChange={v => setForm(p => ({ ...p, status: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Đang mở</SelectItem>
                    <SelectItem value="assigned">Đã phân công</SelectItem>
                    <SelectItem value="in_progress">Đang xử lý</SelectItem>
                    <SelectItem value="resolved">Hoàn thành</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Người báo cáo</Label>
                <Input value={form.reporter} onChange={e => setForm(p => ({ ...p, reporter: e.target.value }))} className="mt-1" />
              </div>
              <div>
                <Label>Phân công cho</Label>
                <Input value={form.assignee} onChange={e => setForm(p => ({ ...p, assignee: e.target.value }))} placeholder="Kỹ thuật viên..." className="mt-1" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>Hủy</Button>
            <Button onClick={handleSave} className="bg-[#1a7a4a] hover:bg-[#155e3a] text-white">
              {editTicket ? 'Lưu thay đổi' : 'Ghi nhận sự cố'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      {viewTicket && (
        <Dialog open={!!viewTicket} onOpenChange={() => setViewTicket(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>🔧 {viewTicket.code} — {viewTicket.title}</DialogTitle>
            </DialogHeader>
            <div className="space-y-2 text-sm">
              <div className="flex gap-2 flex-wrap">
                <Badge className={`${STATUS_MAP[viewTicket.status]?.color} border`}>{STATUS_MAP[viewTicket.status]?.label}</Badge>
                <span className={`text-xs font-medium ${PRIORITY_MAP[viewTicket.priority]?.color}`}>{PRIORITY_MAP[viewTicket.priority]?.label}</span>
                <Badge variant="outline">{viewTicket.category}</Badge>
              </div>
              {[
                { label: 'Tài sản', value: viewTicket.asset_name },
                { label: 'Mô tả', value: viewTicket.description || '—' },
                { label: 'Người báo cáo', value: viewTicket.reporter },
                { label: 'Kỹ thuật viên', value: viewTicket.assignee || 'Chưa phân công' },
                { label: 'Ngày tạo', value: viewTicket.created_at },
                { label: 'Ngày xong', value: viewTicket.resolved_at || 'Chưa xong' },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between border-b pb-1.5 last:border-0">
                  <span className="text-slate-500">{label}</span>
                  <span className="font-medium text-right">{value}</span>
                </div>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
