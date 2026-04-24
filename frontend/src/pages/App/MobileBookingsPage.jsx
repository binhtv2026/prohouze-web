/**
 * MobileBookingsPage.jsx — Giữ chỗ & Booking (Mobile)
 * API: softBookingApi.getSoftBookings from salesApi
 * Route: /sales/bookings
 */
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ChevronLeft, ShieldCheck, Clock, CheckCircle2,
  X, Search, Building2, User, Phone,
} from 'lucide-react';
import { softBookingApi } from '@/lib/salesApi';
import { toast } from 'sonner';

const STATUS = {
  pending:   { label: 'Chờ xác nhận', color: 'text-amber-600',   bg: 'bg-amber-50',   dot: 'bg-amber-500'   },
  confirmed: { label: 'Đã xác nhận',  color: 'text-emerald-600', bg: 'bg-emerald-50', dot: 'bg-emerald-500' },
  expired:   { label: 'Hết hạn',      color: 'text-slate-500',   bg: 'bg-slate-100',  dot: 'bg-slate-400'   },
  cancelled: { label: 'Đã huỷ',       color: 'text-red-500',     bg: 'bg-red-50',     dot: 'bg-red-500'     },
};

function fmt(n) {
  if (!n) return '—';
  const v = Number(n);
  if (v >= 1e9) return `${(v / 1e9).toFixed(1)} tỷ`;
  if (v >= 1e6) return `${(v / 1e6).toFixed(0)} triệu`;
  return v.toLocaleString('vi-VN');
}

function BookingCard({ item }) {
  const st = STATUS[item.status || item.booking_status] || STATUS.pending;
  const expiry = item.expiry_time || item.hold_until
    ? new Date(item.expiry_time || item.hold_until).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-4 py-3">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 bg-amber-50 rounded-xl flex items-center justify-center flex-shrink-0">
            <ShieldCheck className="w-4 h-4 text-amber-600" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-800 leading-tight truncate">
              {item.product_name || item.code || 'Booking'}
            </p>
            <p className="text-xs text-slate-500">{item.project_name || '—'}</p>
          </div>
        </div>
        <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full flex-shrink-0 ${st.color} ${st.bg}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
          {st.label}
        </span>
      </div>

      <div className="flex items-center gap-4 text-xs text-slate-500">
        <div className="flex items-center gap-1">
          <User className="w-3 h-3" />
          <span>{item.contact_name || item.customer_name || '—'}</span>
        </div>
        {item.amount || item.booking_amount ? (
          <div className="flex items-center gap-1 text-emerald-600 font-semibold">
            💰 {fmt(item.amount || item.booking_amount)}
          </div>
        ) : null}
      </div>

      {expiry && (
        <div className="flex items-center gap-1 mt-1.5 text-[11px] font-semibold text-red-500">
          <Clock className="w-3 h-3" />
          <span>Hạn: {expiry}</span>
        </div>
      )}
    </div>
  );
}

export default function MobileBookingsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initStatus = searchParams.get('status') || 'all';

  const [bookings, setBookings]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [filterStatus, setFilter] = useState(initStatus);
  const [search, setSearch]       = useState('');

  const FILTERS = [
    { key: 'all',       label: 'Tất cả'       },
    { key: 'pending',   label: '⏳ Chờ duyệt' },
    { key: 'confirmed', label: '✅ Đã xác nhận'},
    { key: 'expired',   label: '⏰ Hết hạn'   },
  ];

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const params = {
          limit: 50,
          status: filterStatus !== 'all' ? filterStatus : undefined,
        };
        const res = await softBookingApi.getSoftBookings(params);
        const list = res?.items || res?.data?.items || res?.data || [];
        setBookings(Array.isArray(list) ? list : []);
      } catch {
        toast.error('Không tải được danh sách giữ chỗ');
      } finally {
        setLoading(false);
      }
    })();
  }, [filterStatus]);

  const filtered = search
    ? bookings.filter(b =>
        (b.contact_name || b.customer_name || '').toLowerCase().includes(search.toLowerCase()) ||
        (b.product_name || b.code || '').toLowerCase().includes(search.toLowerCase())
      )
    : bookings;

  const pendingCount = bookings.filter(b => (b.status || b.booking_status) === 'pending').length;

  return (
    <div className="h-screen bg-[#f1f5f9] flex flex-col overflow-hidden">
      {/* HEADER */}
      <div className="bg-gradient-to-br from-[#78350f] via-[#b45309] to-[#d97706] px-4 pt-12 pb-4 flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center active:scale-95">
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>
            <div>
              <h1 className="text-white font-bold text-base flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" /> Giữ chỗ
              </h1>
              <p className="text-white/60 text-xs">
                {pendingCount > 0 ? `${pendingCount} chờ xác nhận` : `${bookings.length} booking`}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-white/15 rounded-xl px-3 py-2">
          <Search className="w-4 h-4 text-white/60" />
          <input
            type="text"
            placeholder="Tìm khách, sản phẩm..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 text-sm bg-transparent outline-none text-white placeholder:text-white/50"
          />
        </div>
      </div>

      {/* FILTER TABS */}
      <div className="flex gap-2 overflow-x-auto px-4 py-2.5 flex-shrink-0 scrollbar-hide bg-white border-b border-slate-100">
        {FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`flex-shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full transition-all ${
              filterStatus === f.key ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-600'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* LIST */}
      <div className="flex-1 overflow-y-auto px-4 py-3 pb-24 space-y-2.5">
        {loading ? (
          Array.from({length: 4}).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-4 animate-pulse space-y-2">
              <div className="flex gap-3"><div className="w-9 h-9 rounded-xl bg-amber-100 flex-shrink-0" /><div className="flex-1 space-y-2"><div className="h-3 bg-slate-100 rounded w-3/4" /><div className="h-3 bg-slate-100 rounded w-1/2" /></div></div>
            </div>
          ))
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <ShieldCheck className="w-12 h-12 text-slate-300 mb-3" />
            <p className="text-sm font-semibold text-slate-600">Không có booking nào</p>
          </div>
        ) : (
          filtered.map((b, i) => <BookingCard key={b.id || i} item={b} />)
        )}
      </div>
    </div>
  );
}
