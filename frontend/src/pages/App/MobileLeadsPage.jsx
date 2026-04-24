/**
 * MobileLeadsPage.jsx — Danh sách lead mobile-native
 * API: leadsAPI.getAll() → /v2/leads
 * Route: /crm/leads
 */
import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ChevronLeft, Search, Flame, Phone, X,
  Plus, User, Clock, ArrowRight,
} from 'lucide-react';
import { leadsAPI } from '@/lib/crmApi';
import { toast } from 'sonner';

const STAGES = [
  { key: 'all',          label: 'Tất cả' },
  { key: 'hot',          label: '🔥 Nóng' },
  { key: 'new',          label: '💙 Mới' },
  { key: 'contacted',    label: '📞 Đã gọi' },
  { key: 'qualified',    label: '✅ Đủ đk' },
  { key: 'negotiating',  label: '🤝 Thương lượng' },
];

const STAGE_STYLE = {
  new:          { label: 'Mới',          color: 'text-blue-600',    bg: 'bg-blue-50'    },
  contacted:    { label: 'Đã liên hệ',   color: 'text-yellow-600',  bg: 'bg-yellow-50'  },
  qualified:    { label: 'Đủ điều kiện', color: 'text-violet-600',  bg: 'bg-violet-50'  },
  negotiating:  { label: 'Thương lượng', color: 'text-amber-600',   bg: 'bg-amber-50'   },
  won:          { label: 'Thành công',   color: 'text-emerald-600', bg: 'bg-emerald-50' },
  lost:         { label: 'Thất bại',     color: 'text-slate-400',   bg: 'bg-slate-100'  },
};

const INTENT_CONFIG = {
  hot:    { icon: '🔥', color: 'text-red-500' },
  warm:   { icon: '😊', color: 'text-amber-500' },
  cold:   { icon: '❄️', color: 'text-blue-400' },
};

function LeadCard({ lead, onCall }) {
  const stage   = STAGE_STYLE[lead.stage || lead.lead_status || 'new'] || STAGE_STYLE.new;
  const intent  = INTENT_CONFIG[lead.intent_level || lead.priority || 'warm'] || INTENT_CONFIG.warm;
  const name    = lead.full_name || lead.contact_name || 'Không tên';
  const phone   = lead.phone || lead.contact_phone || '';
  const initials = name.trim().split(' ').slice(-2).map(w => w[0]).join('').toUpperCase();

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-4 py-3 flex items-center gap-3">
      <div className="w-11 h-11 rounded-full bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center text-amber-700 font-bold text-sm flex-shrink-0">
        {initials}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="font-bold text-slate-800 text-sm truncate">{name}</p>
          <span className={`text-sm ${intent.color}`}>{intent.icon}</span>
        </div>
        <p className="text-xs text-slate-500 mt-0.5">{phone || '—'}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${stage.color} ${stage.bg}`}>
            {stage.label}
          </span>
          {lead.source_channel || lead.source ? (
            <span className="text-[10px] text-slate-400">{lead.source_channel || lead.source}</span>
          ) : null}
        </div>
      </div>
      <button
        onClick={() => onCall(phone)}
        disabled={!phone}
        className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center flex-shrink-0 active:scale-90 transition-transform disabled:opacity-30"
      >
        <Phone className="w-4 h-4 text-emerald-600" />
      </button>
    </div>
  );
}

export default function MobileLeadsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialStatus = searchParams.get('status') || 'all';

  const [leads, setLeads]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [filterStatus, setFilterStatus] = useState(initialStatus);
  const [total, setTotal]       = useState(0);

  const load = useCallback(async (q = '', stage = 'all') => {
    setLoading(true);
    try {
      const params = {
        limit: 50,
        search: q || undefined,
        lead_status: stage !== 'all' && stage !== 'hot' ? stage : undefined,
        intent_level: stage === 'hot' ? 'hot' : undefined,
      };
      const res = await leadsAPI.getAll(params);
      const list = Array.isArray(res.data) ? res.data : [];
      setLeads(list);
      setTotal(res.meta?.total || list.length);
    } catch {
      toast.error('Không tải được danh sách lead');
    } finally {
      setLoading(false);
    }
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(search, filterStatus); }, [load, filterStatus]);

  useEffect(() => {
    const t = setTimeout(() => load(search, filterStatus), 400);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);


  return (
    <div className="h-screen bg-[#f1f5f9] flex flex-col overflow-hidden">

      {/* HEADER */}
      <div className="bg-gradient-to-br from-[#7c2d12] via-[#c2410c] to-[#ea580c] px-4 pt-12 pb-4 flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center active:scale-95">
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>
            <div>
              <h1 className="text-white font-bold text-base flex items-center gap-1.5">
                <Flame className="w-4 h-4" /> Lead Pipeline
              </h1>
              <p className="text-white/60 text-xs">{total} leads</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/crm/leads/new')}
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
            placeholder="Tìm tên, SĐT..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 text-sm bg-transparent outline-none text-white placeholder:text-white/50"
          />
          {search && <button onClick={() => setSearch('')}><X className="w-4 h-4 text-white/60" /></button>}
        </div>
      </div>

      {/* FILTER TABS */}
      <div className="flex gap-2 overflow-x-auto px-4 py-2.5 flex-shrink-0 scrollbar-hide bg-white border-b border-slate-100">
        {STAGES.map(s => (
          <button
            key={s.key}
            onClick={() => setFilterStatus(s.key)}
            className={`flex-shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full transition-all ${
              filterStatus === s.key
                ? 'bg-orange-500 text-white'
                : 'bg-slate-100 text-slate-600'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* LIST */}
      <div className="flex-1 overflow-y-auto px-4 py-3 pb-24 space-y-2.5">
        {loading ? (
          Array.from({length: 5}).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-4 animate-pulse flex gap-3">
              <div className="w-11 h-11 rounded-full bg-amber-100 flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-slate-100 rounded w-1/2" />
                <div className="h-3 bg-slate-100 rounded w-1/3" />
              </div>
            </div>
          ))
        ) : leads.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Flame className="w-12 h-12 text-slate-300 mb-3" />
            <p className="text-sm font-semibold text-slate-600">Không có lead nào</p>
            <p className="text-xs text-slate-400 mt-1">
              {filterStatus !== 'all' ? 'Thử xem tất cả các trạng thái' : 'Thêm lead mới để bắt đầu'}
            </p>
          </div>
        ) : (
          leads.map(l => (
            <LeadCard key={l.id} lead={l} onCall={phone => phone && window.open(`tel:${phone}`)} />
          ))
        )}
      </div>
    </div>
  );
}
