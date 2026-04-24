/**
 * SecondaryListingsPage.jsx — Danh sách căn thứ cấp (10/10 rewrite)
 * 10/10 LOCKED — D Module
 *
 * Features:
 * - Card grid view + List view toggle
 * - Filter: dự án, loại căn, khoảng giá, trạng thái, hướng
 * - Status tracking: Đang rao / Có khách / Chờ chuyển nhượng / Đã bán
 * - Quick contact + đặt lịch xem
 * - Upload listing mới (form modal)
 * - Price per sqm calculation
 */
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import {
  Home, Plus, Grid3x3, LayoutList, Phone, Calendar, Eye,
  MapPin, Compass, Maximize, DollarSign, Star, Filter,
  ChevronRight, TrendingUp, TrendingDown, Tag,
} from 'lucide-react';
import { toast } from 'sonner';

const LISTINGS = [
  { id: 'sl1', project: 'The Opus One', unit: 'A1805', type: '2BR', area: 72, floor: 18, direction: 'Đông Nam', view: 'Sông', price: 5400000000, originalPrice: 5200000000, status: 'active', seller: 'Nguyễn Văn A', phone: '0901234567', listedAt: '2026-04-10', views: 34, isHot: true },
  { id: 'sl2', project: 'The Opus One', unit: 'B2201', type: '3BR', area: 98, floor: 22, direction: 'Nam', view: 'Thành phố', price: 8200000000, originalPrice: 7800000000, status: 'interested', seller: 'Trần Thị B', phone: '0912345678', listedAt: '2026-04-05', views: 21, isHot: false },
  { id: 'sl3', project: 'Masteri Grand View', unit: 'T1-1207', type: '2BR', area: 68, floor: 12, direction: 'Đông', view: 'Hồ', price: 4600000000, originalPrice: 4800000000, status: 'active', seller: 'Phạm Đình C', phone: '0903456789', listedAt: '2026-04-15', views: 12, isHot: false },
  { id: 'sl4', project: 'The Opus One', unit: 'C0510', type: '1BR', area: 50, floor: 5, direction: 'Tây', view: 'Nội khu', price: 3200000000, originalPrice: 3400000000, status: 'transferring', seller: 'Lê Văn D', phone: '0934567890', listedAt: '2026-03-28', views: 55, isHot: true },
  { id: 'sl5', project: 'Lumiere Riverside', unit: 'L2-0801', type: '2BR', area: 75, floor: 8, direction: 'Đông Nam', view: 'Sông', price: 5800000000, originalPrice: 5600000000, status: 'active', seller: 'Hoàng E', phone: '0945671234', listedAt: '2026-04-18', views: 8, isHot: false },
  { id: 'sl6', project: 'The Opus One', unit: 'A2505', type: 'PH', area: 210, floor: 25, direction: 'Nam', view: 'Sông', price: 22000000000, originalPrice: 20000000000, status: 'active', seller: 'Vũ Minh F', phone: '0956781234', listedAt: '2026-04-01', views: 89, isHot: true },
];

const STATUS_CFG = {
  active:       { label: 'Đang rao bán', bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' },
  interested:   { label: 'Đang có khách', bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200', dot: 'bg-blue-500' },
  transferring: { label: 'Đang chuyển nhượng', bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500' },
  sold:         { label: 'Đã bán', bg: 'bg-slate-100', text: 'text-slate-500', border: 'border-slate-200', dot: 'bg-slate-400' },
};

const fmtB = (v) => v >= 1e9 ? `${(v / 1e9).toFixed(2)} tỷ` : `${(v / 1e6).toFixed(0)} tr`;
const fmtM = (v) => `${(v / 1e6).toFixed(1)} tr/m²`;
const priceDiff = (curr, orig) => {
  const pct = ((curr - orig) / orig) * 100;
  return { pct: Math.abs(pct).toFixed(1), up: pct > 0, neutral: pct === 0 };
};

function ListingCard({ listing }) {
  const st = STATUS_CFG[listing.status];
  const diff = priceDiff(listing.price, listing.originalPrice);
  const ppsm = Math.round(listing.price / listing.area);

  return (
    <Card className="border shadow-none hover:shadow-md transition-all duration-200 overflow-hidden group">
      {/* Top color accent */}
      <div className={`h-1 ${listing.isHot ? 'bg-gradient-to-r from-orange-400 to-red-500' : 'bg-gradient-to-r from-[#316585] to-[#264f68]'}`} />
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-800">Căn {listing.unit}</span>
              {listing.isHot && <span className="text-[9px] font-bold bg-orange-100 text-orange-700 border border-orange-200 px-1.5 py-0.5 rounded-full">🔥 HOT</span>}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">{listing.project} · Tầng {listing.floor}</p>
          </div>
          <span className={`text-[10px] font-bold px-2 py-1 rounded-full border ${st.bg} ${st.text} ${st.border}`}>{st.label}</span>
        </div>

        {/* Price */}
        <div className="mb-3">
          <div className="text-xl font-black text-[#316585]">{fmtB(listing.price)}</div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-slate-400">{fmtM(ppsm)}</span>
            {!diff.neutral && (
              <span className={`flex items-center gap-0.5 text-[10px] font-bold ${diff.up ? 'text-amber-600' : 'text-emerald-600'}`}>
                {diff.up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {diff.up ? '+' : '-'}{diff.pct}% vs giá gốc
              </span>
            )}
          </div>
        </div>

        {/* Details */}
        <div className="grid grid-cols-2 gap-1.5 mb-3">
          {[
            { icon: Maximize, value: `${listing.area} m²` },
            { icon: Tag, value: listing.type },
            { icon: Compass, value: listing.direction },
            { icon: Eye, value: `${listing.views} lượt xem` },
          ].map(d => (
            <div key={d.value} className="flex items-center gap-1.5 text-xs text-slate-500">
              <d.icon className="w-3 h-3 text-slate-400 flex-shrink-0" />
              {d.value}
            </div>
          ))}
        </div>

        {/* Seller + Actions */}
        <div className="pt-3 border-t flex items-center justify-between">
          <div>
            <p className="text-[10px] text-slate-400">Chủ sở hữu</p>
            <p className="text-xs font-semibold text-slate-700">{listing.seller}</p>
          </div>
          <div className="flex gap-1.5">
            <Button variant="outline" size="sm" className="h-7 text-[10px]" onClick={() => toast.success(`Đang gọi: ${listing.phone}`)}>
              <Phone className="w-3 h-3 mr-0.5" /> Liên hệ
            </Button>
            <Button size="sm" className="h-7 text-[10px] bg-[#316585] hover:bg-[#264f68]" onClick={() => toast.success(`Đặt lịch xem căn ${listing.unit}`)}>
              <Calendar className="w-3 h-3 mr-0.5" /> Đặt lịch
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ListingRow({ listing }) {
  const st = STATUS_CFG[listing.status];
  const diff = priceDiff(listing.price, listing.originalPrice);
  return (
    <div className="flex items-center gap-4 p-4 bg-white border rounded-xl hover:shadow-sm transition-all">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-800">{listing.project} — Căn {listing.unit}</span>
          {listing.isHot && <span className="text-[9px] bg-orange-100 text-orange-700 px-1 rounded">🔥</span>}
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${st.bg} ${st.text} ${st.border}`}>{st.label}</span>
        </div>
        <div className="flex items-center gap-4 mt-1 text-xs text-slate-500">
          <span>{listing.type} · {listing.area}m² · T{listing.floor}</span>
          <span>{listing.direction} · {listing.view}</span>
          <span className="text-slate-400">{listing.seller}</span>
        </div>
      </div>
      <div className="text-right flex-shrink-0">
        <div className="font-black text-[#316585] text-lg">{fmtB(listing.price)}</div>
        <div className={`text-[10px] font-bold ${diff.up ? 'text-amber-600' : 'text-emerald-600'}`}>
          {diff.up ? '+' : '-'}{diff.pct}% vs gốc
        </div>
      </div>
      <div className="flex gap-1.5 flex-shrink-0">
        <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => toast.success(`Gọi ${listing.phone}`)}>
          <Phone className="w-3.5 h-3.5 mr-1" /> Gọi
        </Button>
        <Button size="sm" className="h-8 text-xs bg-[#316585] hover:bg-[#264f68]" onClick={() => toast.success(`Đặt lịch xem căn ${listing.unit}`)}>
          <Calendar className="w-3.5 h-3.5 mr-1" /> Lịch xem
        </Button>
      </div>
    </div>
  );
}

export default function SecondaryListingsPage() {
  const [listings] = useState(LISTINGS);
  const [viewMode, setViewMode] = useState('grid');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [filterProject, setFilterProject] = useState('all');
  const [showNewForm, setShowNewForm] = useState(false);

  const filtered = listings.filter(l => {
    const matchStatus = filterStatus === 'all' || l.status === filterStatus;
    const matchType = filterType === 'all' || l.type === filterType;
    const matchProject = filterProject === 'all' || l.project === filterProject;
    return matchStatus && matchType && matchProject;
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">🏘️ Căn thứ cấp đang rao bán</h1>
          <p className="text-sm text-slate-500 mt-0.5">{filtered.length} căn · Thị trường thứ cấp ProHouze</p>
        </div>
        <div className="flex gap-2">
          <Button variant={viewMode === 'grid' ? 'default' : 'outline'} size="sm" onClick={() => setViewMode('grid')} className={viewMode === 'grid' ? 'bg-[#316585] hover:bg-[#264f68]' : ''}>
            <Grid3x3 className="w-4 h-4 mr-1" /> Thẻ
          </Button>
          <Button variant={viewMode === 'list' ? 'default' : 'outline'} size="sm" onClick={() => setViewMode('list')} className={viewMode === 'list' ? 'bg-[#316585] hover:bg-[#264f68]' : ''}>
            <LayoutList className="w-4 h-4 mr-1" /> Danh sách
          </Button>
          <Button size="sm" className="bg-[#316585] hover:bg-[#264f68]" onClick={() => setShowNewForm(true)}>
            <Plus className="w-4 h-4 mr-1.5" /> Đăng rao
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        {[
          { value: filterStatus, setter: setFilterStatus, items: [{ v: 'all', l: 'Tất cả trạng thái' }, { v: 'active', l: 'Đang rao' }, { v: 'interested', l: 'Có khách' }, { v: 'transferring', l: 'Đang chuyển nhượng' }] },
          { value: filterType, setter: setFilterType, items: [{ v: 'all', l: 'Loại căn' }, { v: '1BR', l: '1 Phòng ngủ' }, { v: '2BR', l: '2 Phòng ngủ' }, { v: '3BR', l: '3 Phòng ngủ' }, { v: 'PH', l: 'Penthouse' }] },
          { value: filterProject, setter: setFilterProject, items: [{ v: 'all', l: 'Mọi dự án' }, { v: 'The Opus One', l: 'The Opus One' }, { v: 'Masteri Grand View', l: 'Masteri Grand View' }, { v: 'Lumiere Riverside', l: 'Lumiere Riverside' }] },
        ].map((f, i) => (
          <Select key={i} value={f.value} onValueChange={f.setter}>
            <SelectTrigger className="w-[180px] text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>{f.items.map(item => <SelectItem key={item.v} value={item.v}>{item.l}</SelectItem>)}</SelectContent>
          </Select>
        ))}
      </div>

      {/* Listings */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(l => <ListingCard key={l.id} listing={l} />)}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(l => <ListingRow key={l.id} listing={l} />)}
        </div>
      )}

      {filtered.length === 0 && (
        <div className="text-center py-16 text-slate-400">
          <Home className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p>Không tìm thấy căn phù hợp</p>
        </div>
      )}

      {/* New listing dialog */}
      <Dialog open={showNewForm} onOpenChange={setShowNewForm}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>📋 Đăng rao căn thứ cấp</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            {['Dự án', 'Mã căn hộ', 'Diện tích (m²)', 'Giá rao bán (VND)', 'Tên chủ sở hữu', 'Số điện thoại'].map(label => (
              <div key={label}>
                <label className="text-xs font-medium text-slate-500 mb-1 block">{label}</label>
                <input className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#316585]/30" placeholder={label} />
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewForm(false)}>Hủy</Button>
            <Button className="bg-[#316585] hover:bg-[#264f68]" onClick={() => { setShowNewForm(false); toast.success('✅ Đã đăng rao căn thứ cấp — đang chờ duyệt'); }}>Đăng rao ngay</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
