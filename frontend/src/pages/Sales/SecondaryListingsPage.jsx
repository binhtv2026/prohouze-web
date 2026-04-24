/**
 * SecondaryListingsPage.jsx — Kho BDS Thứ cấp
 * Thêm BDS nhanh < 3 phút · Bộ lọc thông minh · Chia sẻ 1 chạm · Admin duyệt
 */
import { useState, useMemo } from 'react';
import {
  Plus, Search, SlidersHorizontal, MapPin, Bed, Maximize2,
  Share2, Eye, Clock, CheckCircle, XCircle, AlertCircle,
  Camera, ChevronRight, Phone, Star, Flame, TrendingUp,
  Edit2, X, Home, Building, TreePine, Store,
} from 'lucide-react';

// ─── MOCK DATA ────────────────────────────────────────────────────────────────
const MY_LISTINGS = [
  {
    id: 'SC001', type: 'house', title: 'Nhà phố Lê Văn Lương', district: 'Quận 7',
    address: '45 Lê Văn Lương, P.Tân Kiểng, Q.7',
    beds: 4, area: 68, price: 5200000000, commission: 2,
    status: 'approved', views: 234, leads: 3,
    images: 4, postedDays: 12, owner: 'Tôi',
    hot: true, note: 'Mặt tiền hẻm 6m, sổ hồng đủ',
  },
  {
    id: 'SC002', type: 'land', title: 'Đất lô góc Thủ Đức', district: 'TP.Thủ Đức',
    address: 'Đường 21, P.Bình Chiểu, TP.Thủ Đức',
    beds: 0, area: 120, price: 3800000000, commission: 1.5,
    status: 'pending', views: 45, leads: 0,
    images: 3, postedDays: 2, owner: 'Tôi',
    hot: false, note: 'Đang chờ admin duyệt',
  },
  {
    id: 'SC003', type: 'apartment', title: 'Căn hộ Masteri Q.2', district: 'TP.Thủ Đức',
    address: 'Masteri An Phú, P.An Phú, Q.2',
    beds: 3, area: 95, price: 8100000000, commission: 1.8,
    status: 'approved', views: 567, leads: 8,
    images: 8, postedDays: 20, owner: 'Tôi',
    hot: true, note: 'View sông, tầng 25',
  },
];

const TEAM_LISTINGS = [
  {
    id: 'T001', type: 'house', title: 'Nhà HXH Bình Thạnh', district: 'Bình Thạnh',
    beds: 3, area: 52, price: 4500000000, commission: 2, owner: 'Nguyễn A',
    status: 'approved', hot: false, area_note: 'Hẻm xe hơi vào thoải mái',
  },
  {
    id: 'T002', type: 'house', title: 'Nhà mặt tiền Quận 4', district: 'Quận 4',
    beds: 5, area: 90, price: 12000000000, commission: 1.5, owner: 'Trần B',
    status: 'approved', hot: true, area_note: 'Mặt tiền kinh doanh',
  },
  {
    id: 'T003', type: 'apartment', title: 'CH Vinhomes Q.9', district: 'Quận 9',
    beds: 2, area: 72, price: 2800000000, commission: 2.5, owner: 'Lê C',
    status: 'approved', hot: false, area_note: 'Còn bảo hành CĐT',
  },
];

const TYPE_CONFIG = {
  house:     { icon: Home,      label: 'Nhà', color: 'text-orange-600', bg: 'bg-orange-50' },
  land:      { icon: TreePine,  label: 'Đất', color: 'text-green-600',  bg: 'bg-green-50' },
  apartment: { icon: Building,  label: 'Căn hộ', color: 'text-blue-600', bg: 'bg-blue-50' },
  shophouse: { icon: Store,     label: 'Shophouse', color: 'text-purple-600', bg: 'bg-purple-50' },
};

const STATUS_MAP = {
  approved: { label: 'Đã duyệt', icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  pending:  { label: 'Chờ duyệt', icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
  rejected: { label: 'Bị từ chối', icon: XCircle, color: 'text-red-600', bg: 'bg-red-50' },
};

const DISTRICTS = ['Tất cả', 'Quận 1', 'Quận 2', 'Quận 4', 'Quận 7', 'Bình Thạnh', 'TP.Thủ Đức', 'Quận 9', 'Bình Tân'];
const PRICE_OPTS = ['Tất cả', '< 3 tỷ', '3-5 tỷ', '5-8 tỷ', '8-12 tỷ', '> 12 tỷ'];

function fmt(n) {
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)} tỷ`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(0)} tr`;
  return '-';
}

// ─── Add BDS Form (< 3 phút) ─────────────────────────────────────────────────
function AddListingForm({ onClose, onSuccess }) {
  const [step, setStep] = useState(1); // 1=type, 2=info, 3=price, 4=done
  const [form, setForm] = useState({
    type: '', address: '', district: '', beds: '3', area: '',
    price: '', commission: '2', note: '', negotiate: true,
  });

  const update = (k, v) => setForm(prev => ({ ...prev, [k]: v }));
  const comm = form.price ? Math.round(Number(form.price.replace(/,/g, '')) * Number(form.commission) / 100) : 0;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-end">
      <div className="bg-white w-full rounded-t-3xl max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-100 p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400">Bước {step}/3</p>
            <h3 className="font-bold text-slate-900">
              {step === 1 ? 'Loại BDS' : step === 2 ? 'Thông tin' : 'Giá & Hoa hồng'}
            </h3>
          </div>
          <button onClick={onClose} className="p-2 rounded-full bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5">
          {/* Step 1: Type */}
          {step === 1 && (
            <div className="space-y-4">
              <p className="text-sm text-slate-600">Chọn loại bất động sản</p>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(TYPE_CONFIG).map(([key, cfg]) => {
                  const Icon = cfg.icon;
                  return (
                    <button
                      key={key}
                      onClick={() => { update('type', key); setStep(2); }}
                      className={`p-5 rounded-2xl border-2 text-center transition-all ${
                        form.type === key ? 'border-[#316585] bg-blue-50' : 'border-slate-200'
                      }`}
                    >
                      <Icon className={`w-8 h-8 mx-auto mb-2 ${cfg.color}`} />
                      <p className="font-semibold text-slate-800">{cfg.label}</p>
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-slate-400 text-center mt-2">
                📸 Bạn sẽ thêm ảnh ở bước tiếp theo
              </p>
            </div>
          )}

          {/* Step 2: Info */}
          {step === 2 && (
            <div className="space-y-4">
              {/* Ảnh */}
              <div>
                <p className="text-sm font-semibold text-slate-700 mb-2">Ảnh (tối thiểu 3)</p>
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {[1,2,3,4].map(i => (
                    <button key={i} className="flex-shrink-0 w-24 h-24 rounded-2xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center bg-slate-50">
                      <Camera className="w-6 h-6 text-slate-400" />
                      <span className="text-xs text-slate-400 mt-1">Chụp ảnh</span>
                    </button>
                  ))}
                </div>
              </div>
              {/* Địa chỉ */}
              <div>
                <p className="text-sm font-semibold text-slate-700 mb-1.5">📍 Địa chỉ</p>
                <input
                  value={form.address}
                  onChange={e => update('address', e.target.value)}
                  placeholder="Nhập địa chỉ (AI tự điền quận/phường)"
                  className="w-full border border-slate-200 rounded-2xl px-4 py-3 text-sm outline-none focus:border-[#316585]"
                />
              </div>
              {/* Quận */}
              <div>
                <p className="text-sm font-semibold text-slate-700 mb-1.5">Quận / Khu vực</p>
                <div className="flex gap-2 flex-wrap">
                  {DISTRICTS.slice(1).map(d => (
                    <button key={d} onClick={() => update('district', d)}
                      className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                        form.district === d ? 'bg-[#316585] text-white border-[#316585]' : 'border-slate-200 text-slate-600'
                      }`}
                    >{d}</button>
                  ))}
                </div>
              </div>
              {/* PN + DT */}
              <div className="grid grid-cols-2 gap-3">
                {form.type !== 'land' && (
                  <div>
                    <p className="text-sm font-semibold text-slate-700 mb-1.5">Phòng ngủ</p>
                    <div className="flex gap-2">
                      {['1','2','3','4','5+'].map(b => (
                        <button key={b} onClick={() => update('beds', b)}
                          className={`flex-1 py-2 rounded-xl text-xs font-bold border ${
                            form.beds === b ? 'bg-[#316585] text-white border-[#316585]' : 'border-slate-200 text-slate-600'
                          }`}
                        >{b}</button>
                      ))}
                    </div>
                  </div>
                )}
                <div>
                  <p className="text-sm font-semibold text-slate-700 mb-1.5">Diện tích (m²)</p>
                  <input value={form.area} onChange={e => update('area', e.target.value)}
                    type="number" placeholder="VD: 80"
                    className="w-full border border-slate-200 rounded-2xl px-4 py-3 text-sm outline-none focus:border-[#316585]"
                  />
                </div>
              </div>
              {/* Đặc điểm nổi bật */}
              <div>
                <p className="text-sm font-semibold text-slate-700 mb-1.5">Đặc điểm (chọn nhanh)</p>
                <div className="flex gap-2 flex-wrap">
                  {['Mặt tiền','Hẻm xe hơi','Sổ hồng sẵn','View đẹp','Gần trường','Gần chợ','Thang máy','Hầm xe'].map(tag => (
                    <button key={tag} className="text-xs px-3 py-1.5 rounded-full border border-slate-200 text-slate-600 hover:border-[#316585] hover:text-[#316585]">
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
              {/* Note */}
              <div>
                <p className="text-sm font-semibold text-slate-700 mb-1.5">Ghi chú thêm</p>
                <textarea value={form.note} onChange={e => update('note', e.target.value)}
                  placeholder="Thông tin thêm cho khách..."
                  rows={2}
                  className="w-full border border-slate-200 rounded-2xl px-4 py-3 text-sm outline-none focus:border-[#316585] resize-none"
                />
              </div>
              <button onClick={() => setStep(3)}
                className="w-full bg-[#316585] text-white py-4 rounded-2xl font-bold">
                Tiếp theo →
              </button>
            </div>
          )}

          {/* Step 3: Price */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-semibold text-slate-700 mb-1.5">Giá bán / cho thuê</p>
                <div className="relative">
                  <input value={form.price} onChange={e => update('price', e.target.value)}
                    type="number" placeholder="VD: 5200000000"
                    className="w-full border border-slate-200 rounded-2xl px-4 py-3 text-sm outline-none focus:border-[#316585] pr-16"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-400">VNĐ</span>
                </div>
                {form.price && (
                  <p className="text-xs text-[#316585] mt-1 font-semibold">= {fmt(parseInt(form.price))}</p>
                )}
                <label className="flex items-center gap-2 mt-2">
                  <input type="checkbox" checked={form.negotiate} onChange={e => update('negotiate', e.target.checked)} />
                  <span className="text-sm text-slate-600">Cho thương lượng</span>
                </label>
              </div>

              <div>
                <p className="text-sm font-semibold text-slate-700 mb-1.5">Hoa hồng bạn nhận (%)</p>
                <div className="flex gap-2">
                  {['1', '1.5', '2', '2.5', '3'].map(c => (
                    <button key={c} onClick={() => update('commission', c)}
                      className={`flex-1 py-3 rounded-xl text-sm font-bold border ${
                        form.commission === c ? 'bg-emerald-500 text-white border-emerald-500' : 'border-slate-200 text-slate-600'
                      }`}
                    >{c}%</button>
                  ))}
                </div>
                <p className="text-xs text-slate-500 mt-2">⚠️ Admin sẽ xác nhận tỷ lệ hoa hồng khi duyệt</p>
              </div>

              {/* Preview commission */}
              {form.price && (
                <div className="bg-emerald-50 rounded-2xl p-4">
                  <p className="text-sm font-semibold text-emerald-800">Hoa hồng ước tính</p>
                  <p className="text-2xl font-bold text-emerald-600 mt-1">+{fmt(comm)}</p>
                  <p className="text-xs text-emerald-600">{form.commission}% × {fmt(parseInt(form.price))}</p>
                </div>
              )}

              <button onClick={() => { setStep(1); onSuccess?.(); }}
                className="w-full bg-[#316585] text-white py-4 rounded-2xl font-bold text-base">
                🚀 GỬI ADMIN DUYỆT
              </button>
              <p className="text-xs text-slate-400 text-center">Admin sẽ duyệt trong vòng 2-4 giờ làm việc</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Listing Card ─────────────────────────────────────────────────────────────
function ListingCard({ listing, showOwner = false }) {
  const st = STATUS_MAP[listing.status];
  const tc = TYPE_CONFIG[listing.type];
  const Icon = tc?.icon || Home;
  const comm = Math.round(listing.price * listing.commission / 100);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            {listing.hot && (
              <span className="text-[10px] font-bold bg-red-500 text-white px-2 py-0.5 rounded-full flex items-center gap-1">
                <Flame className="w-3 h-3" />HOT
              </span>
            )}
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${tc?.bg} ${tc?.color}`}>{tc?.label}</span>
          </div>
          <p className="font-bold text-slate-900 text-sm mt-1 leading-tight">{listing.title}</p>
          <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
            <MapPin className="w-3 h-3" /> {listing.district}
            {showOwner && <span className="ml-2">· 👤 {listing.owner}</span>}
          </p>
        </div>
        <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-semibold ${st.bg} ${st.color}`}>
          <st.icon className="w-3 h-3" />
          {st.label}
        </div>
      </div>

      <div className="flex gap-3 text-xs text-slate-500 mb-3">
        {listing.beds > 0 && <span className="flex items-center gap-1"><Bed className="w-3 h-3" />{listing.beds}PN</span>}
        <span className="flex items-center gap-1"><Maximize2 className="w-3 h-3" />{listing.area}m²</span>
        {listing.views !== undefined && <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{listing.views} xem</span>}
        {listing.leads !== undefined && <span className="flex items-center gap-1 text-[#316585]"><Phone className="w-3 h-3" />{listing.leads} khách</span>}
      </div>

      <div className="flex items-center justify-between">
        <div>
          <p className="text-base font-bold text-[#316585]">{fmt(listing.price)}</p>
          <p className="text-[11px] text-emerald-600 font-semibold">HH: +{fmt(comm)}</p>
        </div>
        <div className="flex gap-2">
          <button className="p-2 rounded-xl bg-slate-100 text-slate-600">
            <Share2 className="w-4 h-4" />
          </button>
          {!showOwner && (
            <button className="p-2 rounded-xl bg-slate-100 text-slate-600">
              <Edit2 className="w-4 h-4" />
            </button>
          )}
          {showOwner && (
            <button className="p-2 rounded-xl bg-[#316585]/10 text-[#316585]">
              <Phone className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {listing.note && (
        <p className="mt-2 text-xs text-slate-500 bg-slate-50 px-3 py-1.5 rounded-xl">{listing.note}</p>
      )}
    </div>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function SecondaryListingsPage() {
  const [activeTab, setActiveTab] = useState('mine');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [searchQ, setSearchQ] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('Tất cả');
  const [selectedPrice, setSelectedPrice] = useState('Tất cả');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedType, setSelectedType] = useState('all');

  const pendingCount = MY_LISTINGS.filter(l => l.status === 'pending').length;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#16314f] to-[#7c3aed] p-5 pb-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-white font-bold text-lg">Kho Thứ Cấp 🔄</h1>
            <p className="text-white/70 text-xs">{MY_LISTINGS.length} tin của tôi · {TEAM_LISTINGS.length} tin đội</p>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 bg-white text-[#316585] px-4 py-2.5 rounded-2xl font-bold text-sm shadow-lg active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Thêm BDS
          </button>
        </div>
        {pendingCount > 0 && (
          <div className="bg-amber-500/20 border border-amber-400/30 rounded-xl px-3 py-2 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-300" />
            <p className="text-amber-200 text-xs">{pendingCount} tin đang chờ admin duyệt</p>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex bg-white border-b border-slate-200 px-4">
        {[
          { id: 'mine', label: `Của tôi (${MY_LISTINGS.length})` },
          { id: 'team', label: `Kho đội (${TEAM_LISTINGS.length})` },
        ].map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`flex-1 py-3 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === t.id ? 'border-[#7c3aed] text-[#7c3aed]' : 'border-transparent text-slate-400'
            }`}
          >{t.label}</button>
        ))}
      </div>

      {/* Search + Filter */}
      <div className="bg-white px-4 py-3 border-b border-slate-100 space-y-2">
        <div className="flex gap-2">
          <div className="flex-1 flex items-center gap-2 bg-slate-100 rounded-2xl px-4 py-2.5">
            <Search className="w-4 h-4 text-slate-400" />
            <input value={searchQ} onChange={e => setSearchQ(e.target.value)}
              placeholder={activeTab === 'mine' ? 'Tìm BDS của tôi...' : 'Tìm trong kho đội...'}
              className="flex-1 bg-transparent text-sm outline-none"
            />
          </div>
          <button onClick={() => setShowFilters(!showFilters)}
            className={`p-3 rounded-2xl ${showFilters ? 'bg-[#7c3aed] text-white' : 'bg-slate-100 text-slate-600'}`}>
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        </div>

        {/* Type filter */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {[
            { id: 'all', label: 'Tất cả' },
            { id: 'house', label: '🏠 Nhà' },
            { id: 'land', label: '🌿 Đất' },
            { id: 'apartment', label: '🏢 Căn hộ' },
            { id: 'shophouse', label: '🏪 Shophouse' },
          ].map(t => (
            <button key={t.id} onClick={() => setSelectedType(t.id)}
              className={`flex-shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full ${
                selectedType === t.id ? 'bg-[#7c3aed] text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >{t.label}</button>
          ))}
        </div>

        {showFilters && (
          <div className="bg-slate-50 rounded-2xl p-4 space-y-3">
            <div>
              <p className="text-xs font-semibold text-slate-600 mb-2">Khu vực</p>
              <div className="flex gap-2 flex-wrap">
                {DISTRICTS.map(d => (
                  <button key={d} onClick={() => setSelectedDistrict(d)}
                    className={`text-xs px-3 py-1.5 rounded-xl border ${
                      selectedDistrict === d ? 'bg-[#7c3aed] text-white border-[#7c3aed]' : 'bg-white text-slate-600 border-slate-200'
                    }`}
                  >{d}</button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-600 mb-2">Mức giá</p>
              <div className="flex gap-2 flex-wrap">
                {PRICE_OPTS.map(p => (
                  <button key={p} onClick={() => setSelectedPrice(p)}
                    className={`text-xs px-3 py-1.5 rounded-xl border ${
                      selectedPrice === p ? 'bg-[#7c3aed] text-white border-[#7c3aed]' : 'bg-white text-slate-600 border-slate-200'
                    }`}
                  >{p}</button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-4 pb-24 space-y-3">
        {activeTab === 'mine' ? (
          MY_LISTINGS.map(l => <ListingCard key={l.id} listing={l} />)
        ) : (
          TEAM_LISTINGS.map(l => <ListingCard key={l.id} listing={l} showOwner />)
        )}
      </div>

      {/* Add Form Modal */}
      {showAddForm && (
        <AddListingForm
          onClose={() => setShowAddForm(false)}
          onSuccess={() => {
            setShowAddForm(false);
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 3000);
          }}
        />
      )}

      {/* Success Toast */}
      {showSuccess && (
        <div className="fixed bottom-24 left-4 right-4 z-50 bg-emerald-500 text-white rounded-2xl p-4 flex items-center gap-3 shadow-lg">
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          <div>
            <p className="font-bold text-sm">Đã gửi duyệt thành công!</p>
            <p className="text-xs text-white/80">Admin sẽ xét duyệt trong 2-4 giờ làm việc</p>
          </div>
        </div>
      )}
    </div>
  );
}
