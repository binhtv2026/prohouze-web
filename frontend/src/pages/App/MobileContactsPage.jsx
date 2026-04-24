/**
 * MobileContactsPage.jsx — Danh sách khách hàng mobile-native
 * Dùng cùng API với admin: customersAPI (v2/customers)
 * Route: /crm/contacts
 */
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft, Search, Plus, Phone, User,
  ChevronRight, Filter, X, Flame, Star,
} from 'lucide-react';
import { customersAPI } from '@/lib/crmApi';
import { toast } from 'sonner';

const STAGE_CONFIG = {
  new:          { label: 'Mới',         color: 'text-blue-600',    bg: 'bg-blue-50'    },
  contacted:    { label: 'Đã liên hệ',  color: 'text-yellow-600',  bg: 'bg-yellow-50'  },
  qualified:    { label: 'Đủ đk',       color: 'text-violet-600',  bg: 'bg-violet-50'  },
  negotiating:  { label: 'Thương lượng',color: 'text-amber-600',   bg: 'bg-amber-50'   },
  won:          { label: 'Thành công',  color: 'text-emerald-600', bg: 'bg-emerald-50' },
  lost:         { label: 'Thất bại',    color: 'text-slate-400',   bg: 'bg-slate-100'  },
};

function ContactCard({ contact, onCall }) {
  const stage = STAGE_CONFIG[contact.customer_stage || contact.stage || 'new'] || STAGE_CONFIG.new;
  const initials = (contact.full_name || contact.name || '?')
    .trim().split(' ').slice(-2).map(w => w[0]).join('').toUpperCase();

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-4 py-3 flex items-center gap-3">
      {/* Avatar */}
      <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#264f68] to-[#316585] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
        {initials}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-bold text-slate-800 text-sm truncate">
          {contact.full_name || contact.name || 'Không tên'}
        </p>
        <p className="text-xs text-slate-500 mt-0.5">
          {contact.primary_phone || contact.phone || '—'}
        </p>
        <div className="flex items-center gap-1.5 mt-1">
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${stage.color} ${stage.bg}`}>
            {stage.label}
          </span>
          {contact.note_summary || contact.notes ? (
            <span className="text-[10px] text-slate-400 truncate max-w-[120px]">
              {contact.note_summary || contact.notes}
            </span>
          ) : null}
        </div>
      </div>

      {/* Call button */}
      <button
        onClick={() => onCall(contact.primary_phone || contact.phone)}
        className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center flex-shrink-0 active:scale-90 transition-transform"
      >
        <Phone className="w-4 h-4 text-emerald-600" />
      </button>
    </div>
  );
}

export default function MobileContactsPage() {
  const navigate = useNavigate();
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [total, setTotal]       = useState(0);

  const load = useCallback(async (q = '') => {
    setLoading(true);
    try {
      const params = { limit: 50, search: q || undefined };
      const res = await customersAPI.getAll(params);
      const list = Array.isArray(res.data) ? res.data : [];
      setContacts(list);
      setTotal(res.meta?.total || list.length);
    } catch {
      toast.error('Không tải được danh sách khách');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => load(search), 400);
    return () => clearTimeout(t);
  }, [search, load]);

  const handleCall = (phone) => {
    if (phone) window.open(`tel:${phone}`);
  };

  return (
    <div className="h-screen bg-[#f1f5f9] flex flex-col overflow-hidden">

      {/* HEADER */}
      <div className="bg-gradient-to-br from-[#16314f] via-[#264f68] to-[#316585] px-4 pt-12 pb-4 flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center active:scale-95">
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>
            <div>
              <h1 className="text-white font-bold text-base">Khách hàng</h1>
              <p className="text-white/60 text-xs">{total} liên hệ</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/crm/contacts/new')}
            className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center active:scale-95"
          >
            <Plus className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Search */}
        <div className="flex items-center gap-2 bg-white/15 rounded-xl px-3 py-2.5">
          <Search className="w-4 h-4 text-white/60 flex-shrink-0" />
          <input
            type="text"
            placeholder="Tìm theo tên, SĐT..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 text-sm bg-transparent outline-none text-white placeholder:text-white/50"
          />
          {search && (
            <button onClick={() => setSearch('')}>
              <X className="w-4 h-4 text-white/60" />
            </button>
          )}
        </div>
      </div>

      {/* LIST */}
      <div className="flex-1 overflow-y-auto px-4 py-3 pb-24 space-y-2.5">
        {loading ? (
          Array.from({length: 6}).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-4 animate-pulse flex gap-3">
              <div className="w-11 h-11 rounded-full bg-slate-200 flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-slate-100 rounded w-1/2" />
                <div className="h-3 bg-slate-100 rounded w-1/3" />
              </div>
            </div>
          ))
        ) : contacts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <User className="w-12 h-12 text-slate-300 mb-3" />
            <p className="text-sm font-semibold text-slate-600">
              {search ? 'Không tìm thấy khách' : 'Chưa có khách hàng nào'}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              {search ? 'Thử tìm với từ khóa khác' : 'Thêm khách hàng mới để bắt đầu'}
            </p>
            {!search && (
              <button
                onClick={() => navigate('/crm/contacts/new')}
                className="mt-4 bg-[#316585] text-white text-sm font-semibold px-5 py-2.5 rounded-xl"
              >
                + Thêm khách hàng
              </button>
            )}
          </div>
        ) : (
          contacts.map(c => (
            <ContactCard key={c.id} contact={c} onCall={handleCall} />
          ))
        )}
      </div>

      {/* FAB ADD */}
      <button
        onClick={() => navigate('/crm/contacts/new')}
        className="fixed bottom-24 right-5 w-14 h-14 bg-[#316585] rounded-full flex items-center justify-center shadow-lg shadow-[#316585]/30 active:scale-95 transition-transform z-40"
      >
        <Plus className="w-6 h-6 text-white" />
      </button>
    </div>
  );
}
