import { useState } from 'react';
import { Plus, Search, Home, MapPin, User, MoreHorizontal, Eye, Pencil, Trash2, Building2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

const STATUS_MAP = {
  leased:     { label: 'Đang cho thuê', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  available:  { label: 'Đang trống',    color: 'bg-rose-100 text-rose-700 border-rose-200' },
  pending:    { label: 'Chờ bàn giao',  color: 'bg-amber-100 text-amber-700 border-amber-200' },
  maintenance:{ label: 'Đang bảo trì', color: 'bg-violet-100 text-violet-700 border-violet-200' },
};

const ASSET_TYPES = ['Căn hộ', 'Nhà phố', 'Mặt bằng thương mại', 'Biệt thự', 'Văn phòng'];

const DEMO_ASSETS = [
  { id: 'a1', name: 'Căn hộ 12A - Vinhomes Grand Park', type: 'Căn hộ', address: 'Q9, TP.HCM', owner: 'Nguyễn Văn An', rent_price: 12000000, status: 'leased', tenant: 'Trần Thị Bình', area: 68, floors: 12, bedrooms: 2 },
  { id: 'a2', name: 'Mặt bằng tầng trệt 45 Lê Lợi', type: 'Mặt bằng thương mại', address: 'Q1, TP.HCM', owner: 'Lê Hồng Phúc', rent_price: 35000000, status: 'available', tenant: null, area: 120, floors: 1, bedrooms: 0 },
  { id: 'a3', name: 'Nhà phố 123 Trần Hưng Đạo', type: 'Nhà phố', address: 'Q5, TP.HCM', owner: 'Phạm Minh Châu', rent_price: 22000000, status: 'leased', tenant: 'Hoàng Gia Bảo', area: 180, floors: 4, bedrooms: 4 },
  { id: 'a4', name: 'Văn phòng B202 - Saigon Centre', type: 'Văn phòng', address: 'Q1, TP.HCM', owner: 'Công ty ABC', rent_price: 48000000, status: 'maintenance', tenant: null, area: 95, floors: 2, bedrooms: 0 },
  { id: 'a5', name: 'Căn hộ 5B - Masteri Thảo Điền', type: 'Căn hộ', address: 'Q2, TP.HCM', owner: 'Vũ Ngọc Linh', rent_price: 18000000, status: 'pending', tenant: 'Đặng Quang Huy', area: 75, floors: 5, bedrooms: 2 },
];

function formatMoney(v) {
  if (!v) return '—';
  return `${(v / 1_000_000).toFixed(0)} triệu/tháng`;
}

export default function LeasingAssetsPage() {
  const [assets, setAssets] = useState(DEMO_ASSETS);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editAsset, setEditAsset] = useState(null);
  const [viewAsset, setViewAsset] = useState(null);
  const [form, setForm] = useState({ name: '', type: 'Căn hộ', address: '', owner: '', rent_price: '', area: '', bedrooms: '', floors: '', status: 'available' });

  const filtered = assets.filter(a => {
    const matchSearch = !search || a.name.toLowerCase().includes(search.toLowerCase()) || a.address.toLowerCase().includes(search.toLowerCase()) || (a.owner || '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || a.status === statusFilter;
    const matchType = typeFilter === 'all' || a.type === typeFilter;
    return matchSearch && matchStatus && matchType;
  });

  const stats = {
    total: assets.length,
    leased: assets.filter(a => a.status === 'leased').length,
    available: assets.filter(a => a.status === 'available').length,
    occupancy: assets.length ? Math.round((assets.filter(a => a.status === 'leased').length / assets.length) * 100) : 0,
  };

  function openAdd() {
    setEditAsset(null);
    setForm({ name: '', type: 'Căn hộ', address: '', owner: '', rent_price: '', area: '', bedrooms: '', floors: '', status: 'available' });
    setShowForm(true);
  }

  function openEdit(asset) {
    setEditAsset(asset);
    setForm({ ...asset, rent_price: asset.rent_price?.toString() || '', area: asset.area?.toString() || '', bedrooms: asset.bedrooms?.toString() || '', floors: asset.floors?.toString() || '' });
    setShowForm(true);
  }

  function handleSave() {
    if (!form.name || !form.address || !form.owner) {
      toast.error('Vui lòng điền đủ thông tin bắt buộc');
      return;
    }
    const payload = { ...form, rent_price: Number(form.rent_price), area: Number(form.area), bedrooms: Number(form.bedrooms), floors: Number(form.floors) };
    if (editAsset) {
      setAssets(prev => prev.map(a => a.id === editAsset.id ? { ...a, ...payload } : a));
      toast.success('Đã cập nhật tài sản');
    } else {
      setAssets(prev => [...prev, { ...payload, id: `a${Date.now()}`, tenant: null }]);
      toast.success('Đã thêm tài sản mới');
    }
    setShowForm(false);
  }

  function handleDelete(id) {
    setAssets(prev => prev.filter(a => a.id !== id));
    toast.success('Đã xóa tài sản');
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-slate-900">🏠 Quản lý Tài sản</h1>
          <p className="text-sm text-slate-500 mt-0.5">Danh sách tài sản đang quản lý và vận hành cho thuê</p>
        </div>
        <Button onClick={openAdd} className="bg-[#1a7a4a] hover:bg-[#155e3a] text-white gap-1.5">
          <Plus className="w-4 h-4" /> Thêm tài sản
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Tổng tài sản', value: stats.total, icon: '🏢', color: 'text-blue-700' },
          { label: 'Đang cho thuê', value: stats.leased, icon: '✅', color: 'text-emerald-700' },
          { label: 'Đang trống', value: stats.available, icon: '🔑', color: 'text-rose-700' },
          { label: 'Tỉ lệ lấp đầy', value: `${stats.occupancy}%`, icon: '📊', color: 'text-amber-700' },
        ].map(s => (
          <Card key={s.label} className="border shadow-none">
            <CardContent className="p-4">
              <div className="text-2xl mb-1">{s.icon}</div>
              <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-xs text-slate-500 mt-0.5">{s.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input placeholder="Tìm tài sản, địa chỉ, chủ nhà..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Trạng thái" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả trạng thái</SelectItem>
            <SelectItem value="leased">Đang cho thuê</SelectItem>
            <SelectItem value="available">Đang trống</SelectItem>
            <SelectItem value="pending">Chờ bàn giao</SelectItem>
            <SelectItem value="maintenance">Bảo trì</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Loại tài sản" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả loại</SelectItem>
            {ASSET_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Asset list */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <Card className="border shadow-none">
            <CardContent className="py-12 text-center text-slate-400">
              <Home className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>Không tìm thấy tài sản nào</p>
            </CardContent>
          </Card>
        ) : filtered.map(asset => {
          const st = STATUS_MAP[asset.status] || STATUS_MAP.available;
          return (
            <Card key={asset.id} className="border shadow-none hover:border-[#1a7a4a]/30 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
                      <Building2 className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-slate-900 truncate">{asset.name}</p>
                        <Badge className={`${st.color} border text-xs flex-shrink-0`}>{st.label}</Badge>
                        <Badge variant="outline" className="text-xs flex-shrink-0">{asset.type}</Badge>
                      </div>
                      <div className="flex flex-wrap gap-3 mt-1.5 text-xs text-slate-500">
                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{asset.address}</span>
                        <span className="flex items-center gap-1"><User className="w-3 h-3" />Chủ nhà: {asset.owner}</span>
                        {asset.area && <span>📐 {asset.area}m²</span>}
                        {asset.bedrooms > 0 && <span>🛏 {asset.bedrooms} PN</span>}
                      </div>
                      <div className="flex flex-wrap gap-3 mt-1 text-xs">
                        <span className="font-semibold text-emerald-700">💰 {formatMoney(asset.rent_price)}</span>
                        {asset.tenant && <span className="text-slate-500">👤 Khách: {asset.tenant}</span>}
                      </div>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="flex-shrink-0"><MoreHorizontal className="w-4 h-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setViewAsset(asset)}><Eye className="w-4 h-4 mr-2" />Xem chi tiết</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openEdit(asset)}><Pencil className="w-4 h-4 mr-2" />Chỉnh sửa</DropdownMenuItem>
                      <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(asset.id)}><Trash2 className="w-4 h-4 mr-2" />Xóa tài sản</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editAsset ? '✏️ Chỉnh sửa tài sản' : '➕ Thêm tài sản mới'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label>Tên tài sản *</Label>
              <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="VD: Căn hộ 12A Vinhomes..." className="mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Loại tài sản</Label>
                <Select value={form.type} onValueChange={v => setForm(p => ({ ...p, type: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{ASSET_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Trạng thái</Label>
                <Select value={form.status} onValueChange={v => setForm(p => ({ ...p, status: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Đang trống</SelectItem>
                    <SelectItem value="leased">Đang cho thuê</SelectItem>
                    <SelectItem value="pending">Chờ bàn giao</SelectItem>
                    <SelectItem value="maintenance">Đang bảo trì</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Địa chỉ *</Label>
              <Input value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} placeholder="Quận, Thành phố..." className="mt-1" />
            </div>
            <div>
              <Label>Tên chủ nhà *</Label>
              <Input value={form.owner} onChange={e => setForm(p => ({ ...p, owner: e.target.value }))} placeholder="Họ tên chủ nhà..." className="mt-1" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Giá thuê (VNĐ/th)</Label>
                <Input type="number" value={form.rent_price} onChange={e => setForm(p => ({ ...p, rent_price: e.target.value }))} placeholder="12000000" className="mt-1" />
              </div>
              <div>
                <Label>Diện tích (m²)</Label>
                <Input type="number" value={form.area} onChange={e => setForm(p => ({ ...p, area: e.target.value }))} className="mt-1" />
              </div>
              <div>
                <Label>Phòng ngủ</Label>
                <Input type="number" value={form.bedrooms} onChange={e => setForm(p => ({ ...p, bedrooms: e.target.value }))} className="mt-1" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>Hủy</Button>
            <Button onClick={handleSave} className="bg-[#1a7a4a] hover:bg-[#155e3a] text-white">
              {editAsset ? 'Lưu thay đổi' : 'Thêm tài sản'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Detail Dialog */}
      {viewAsset && (
        <Dialog open={!!viewAsset} onOpenChange={() => setViewAsset(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>🏠 {viewAsset.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 text-sm">
              <div className="flex gap-2 flex-wrap">
                <Badge className={`${STATUS_MAP[viewAsset.status]?.color} border`}>{STATUS_MAP[viewAsset.status]?.label}</Badge>
                <Badge variant="outline">{viewAsset.type}</Badge>
              </div>
              {[
                { label: 'Địa chỉ', value: viewAsset.address },
                { label: 'Chủ nhà', value: viewAsset.owner },
                { label: 'Khách thuê', value: viewAsset.tenant || '(Chưa có)' },
                { label: 'Giá thuê', value: formatMoney(viewAsset.rent_price) },
                { label: 'Diện tích', value: viewAsset.area ? `${viewAsset.area} m²` : '—' },
                { label: 'Phòng ngủ', value: viewAsset.bedrooms || '—' },
                { label: 'Số tầng', value: viewAsset.floors || '—' },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between border-b pb-2 last:border-0">
                  <span className="text-slate-500">{label}</span>
                  <span className="font-medium">{value}</span>
                </div>
              ))}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setViewAsset(null); openEdit(viewAsset); }}>
                <Pencil className="w-4 h-4 mr-2" />Chỉnh sửa
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
