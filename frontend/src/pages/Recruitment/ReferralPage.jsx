/**
 * ReferralPage.jsx — Giới thiệu đồng nghiệp vào ProHouze
 * Sprint 1: QR + link cá nhân + danh sách người đã giới thiệu
 */
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import {
  ChevronLeft, Copy, Share2, Users, CheckCircle2,
  Clock, XCircle, ClockIcon, UserPlus, Search,
  ChevronRight, Briefcase, Phone, Calendar,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

// ─── Helpers ─────────────────────────────────────────────────────────────────
function generateRefCode(user) {
  const lastName = user?.full_name?.trim().split(' ').pop() || 'USER';
  const id = String(user?.id || '').slice(-4).padStart(4, '0');
  return `${lastName.toUpperCase()}${id}`;
}

function maskPhone(phone = '') {
  if (!phone || phone.length < 7) return phone;
  return phone.slice(0, 4) + ' xxx ' + phone.slice(-3);
}

// ─── Status config ─────────────────────────────────────────────────────────
const STATUS = {
  testing:      { label: 'Đang làm bài test',     color: 'text-blue-600',    bg: 'bg-blue-50',    dot: 'bg-blue-500'   },
  interviewing: { label: 'Đang phỏng vấn',         color: 'text-amber-600',   bg: 'bg-amber-50',   dot: 'bg-amber-500'  },
  hired:        { label: 'Đã nhận chính thức',     color: 'text-emerald-600', bg: 'bg-emerald-50', dot: 'bg-emerald-500'},
  rejected:     { label: 'Không phù hợp',          color: 'text-slate-500',   bg: 'bg-slate-100',  dot: 'bg-slate-400'  },
  withdrawn:    { label: 'Tự rút hồ sơ',           color: 'text-purple-500',  bg: 'bg-purple-50',  dot: 'bg-purple-400' },
  applied:      { label: 'Vừa nộp hồ sơ',         color: 'text-blue-600',    bg: 'bg-blue-50',    dot: 'bg-blue-500'   },
};

// ─── Mock data (sẽ thay bằng API thật) ──────────────────────────────────────
const MOCK_REFERRALS = [
  { id: 1, name: 'Nguyễn Văn An',  phone: '0912345678', position: 'Sales Sơ cấp',   date: '10/04/2026', status: 'hired'        },
  { id: 2, name: 'Trần Thị Bình',  phone: '0987654321', position: 'CTV Thứ cấp',    date: '15/04/2026', status: 'interviewing' },
  { id: 3, name: 'Lê Minh Châu',   phone: '0901234567', position: 'Sales Thứ cấp',  date: '17/04/2026', status: 'testing'      },
  { id: 4, name: 'Phạm Thị Dung',  phone: '0978123456', position: 'Kế toán',        date: '18/04/2026', status: 'rejected'     },
];

// ─── Components ───────────────────────────────────────────────────────────────

function StatusBadge({ status }) {
  const s = STATUS[status] || STATUS.applied;
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-semibold ${s.color} ${s.bg} px-2 py-0.5 rounded-full`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}

function ReferralCard({ item }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center flex-shrink-0">
          <span className="text-slate-600 font-bold text-sm">
            {item.name.trim().split(' ').pop()?.[0] || '?'}
          </span>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="font-bold text-slate-800 text-sm leading-tight">{item.name}</p>

          <div className="flex items-center gap-1 mt-1">
            <Phone className="w-3 h-3 text-slate-400" />
            <span className="text-xs text-slate-500">{maskPhone(item.phone)}</span>
          </div>

          <div className="flex items-center gap-1 mt-0.5">
            <Briefcase className="w-3 h-3 text-slate-400" />
            <span className="text-xs text-slate-500">{item.position}</span>
          </div>

          <div className="flex items-center gap-1 mt-0.5">
            <Calendar className="w-3 h-3 text-slate-400" />
            <span className="text-xs text-slate-400">Giới thiệu: {item.date}</span>
          </div>

          <div className="mt-2">
            <StatusBadge status={item.status} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function ReferralPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const refCode  = generateRefCode(user);
  const refLink  = `https://prohouzing.com/join?ref=${refCode}`;

  // Load referred people (mock, thay API thật sau)
  useEffect(() => {
    const t = setTimeout(() => {
      setReferrals(MOCK_REFERRALS);
      setLoading(false);
    }, 600);
    return () => clearTimeout(t);
  }, []);

  // Copy link
  const copyLink = useCallback(() => {
    navigator.clipboard?.writeText(refLink).then(() => {
      toast.success('Đã copy link giới thiệu!');
    }).catch(() => {
      toast.error('Không thể copy, vui lòng copy thủ công');
    });
  }, [refLink]);

  // Native share
  const shareLink = useCallback(async () => {
    const text = `🏢 ProHouze đang tuyển dụng!\nDùng link của tôi để ứng tuyển và nhận ưu tiên xét duyệt:\n${refLink}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'ProHouze Tuyển dụng', text, url: refLink });
      } else {
        await navigator.clipboard.writeText(text);
        toast.success('Đã copy nội dung chia sẻ!');
      }
    } catch (_) {}
  }, [refLink]);

  // Stats
  const stats = {
    total:   referrals.length,
    hired:   referrals.filter(r => r.status === 'hired').length,
    pending: referrals.filter(r => ['testing','interviewing','applied'].includes(r.status)).length,
  };

  // Filter
  const filtered = referrals.filter(r => {
    const matchSearch = !search || r.name.toLowerCase().includes(search.toLowerCase()) || r.position.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || r.status === filterStatus;
    return matchSearch && matchStatus;
  });

  return (
    <div className="h-screen bg-[#f1f5f9] flex flex-col overflow-hidden">

      {/* ── HEADER ── */}
      <div className="bg-gradient-to-br from-[#16314f] via-[#264f68] to-[#316585] px-4 pt-12 pb-6 flex-shrink-0">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center active:scale-95"
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
          <div>
            <h1 className="text-white font-bold text-lg">Giới thiệu đồng nghiệp</h1>
            <p className="text-white/60 text-xs">Chia sẻ để mở rộng đội ngũ ProHouze</p>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Đã giới thiệu', value: stats.total, color: 'text-white' },
            { label: 'Đã nhận việc',  value: stats.hired,   color: 'text-emerald-300' },
            { label: 'Đang xử lý',   value: stats.pending, color: 'text-amber-300' },
          ].map(s => (
            <div key={s.label} className="bg-white/10 rounded-2xl px-3 py-2 text-center">
              <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
              <p className="text-white/60 text-[10px] font-medium leading-tight">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── SCROLLABLE CONTENT ── */}
      <div className="flex-1 overflow-y-auto pb-24">

        {/* QR + Link card */}
        <div className="mx-4 mt-4 bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          {/* QR Section */}
          <div className="flex flex-col items-center py-5 px-4 bg-gradient-to-b from-slate-50 to-white border-b border-slate-100">
            <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-200 mb-3">
              <QRCodeSVG
                value={refLink}
                size={120}
                fgColor="#16314f"
                bgColor="#ffffff"
                level="M"
              />
            </div>
            <p className="text-xs text-slate-500 mb-0.5">Mã giới thiệu của tôi</p>
            <p className="text-lg font-black text-[#316585] tracking-widest">{refCode}</p>
            <p className="text-[10px] text-slate-400 mt-1 text-center leading-relaxed max-w-[240px]">
              Ứng viên quét QR hoặc dùng link để tải app & ứng tuyển
            </p>
          </div>

          {/* Link + Actions */}
          <div className="px-4 py-3">
            <div className="flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2 mb-3">
              <span className="flex-1 text-xs text-slate-500 truncate font-mono">{refLink}</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={copyLink}
                className="flex items-center justify-center gap-2 bg-slate-100 rounded-xl py-2.5 active:scale-95 transition-transform"
              >
                <Copy className="w-4 h-4 text-slate-600" />
                <span className="text-sm font-semibold text-slate-700">Copy link</span>
              </button>
              <button
                onClick={shareLink}
                className="flex items-center justify-center gap-2 bg-[#316585] rounded-xl py-2.5 active:scale-95 transition-transform"
              >
                <Share2 className="w-4 h-4 text-white" />
                <span className="text-sm font-semibold text-white">Chia sẻ ngay</span>
              </button>
            </div>
          </div>
        </div>

        {/* ── Danh sách người đã giới thiệu ── */}
        <div className="mx-4 mt-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-bold text-slate-800">
              Người tôi đã giới thiệu
              {referrals.length > 0 && (
                <span className="ml-2 text-xs font-bold bg-[#316585] text-white px-2 py-0.5 rounded-full">
                  {referrals.length}
                </span>
              )}
            </p>
          </div>

          {/* Search */}
          {referrals.length > 2 && (
            <div className="flex items-center gap-2 bg-white rounded-xl px-3 py-2 border border-slate-200 mb-3">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm tên hoặc vị trí..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="flex-1 text-sm bg-transparent outline-none text-slate-700 placeholder:text-slate-400"
              />
            </div>
          )}

          {/* Filter tabs */}
          <div className="flex gap-2 overflow-x-auto pb-1 mb-3 scrollbar-hide">
            {[
              { key: 'all',         label: 'Tất cả' },
              { key: 'hired',       label: '✅ Đã nhận' },
              { key: 'interviewing',label: '⏳ Đang PV' },
              { key: 'testing',     label: '📝 Đang test' },
              { key: 'rejected',    label: '❌ Không phù hợp' },
            ].map(f => (
              <button
                key={f.key}
                onClick={() => setFilterStatus(f.key)}
                className={`flex-shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full transition-all ${
                  filterStatus === f.key
                    ? 'bg-[#316585] text-white'
                    : 'bg-white text-slate-500 border border-slate-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* List */}
          {loading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => (
                <div key={i} className="bg-white rounded-2xl p-4 animate-pulse">
                  <div className="flex gap-3">
                    <div className="w-10 h-10 bg-slate-200 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 bg-slate-200 rounded w-1/2" />
                      <div className="h-3 bg-slate-100 rounded w-2/3" />
                      <div className="h-3 bg-slate-100 rounded w-1/3" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center border border-slate-100">
              <UserPlus className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-600 mb-1">
                {referrals.length === 0 ? 'Bạn chưa giới thiệu ai' : 'Không tìm thấy'}
              </p>
              <p className="text-xs text-slate-400">
                {referrals.length === 0
                  ? 'Chia sẻ link để bắt đầu tuyển người tài cho đội ngũ!'
                  : 'Thử tìm kiếm với từ khóa khác'}
              </p>
              {referrals.length === 0 && (
                <button
                  onClick={shareLink}
                  className="mt-4 bg-[#316585] text-white text-sm font-semibold px-5 py-2.5 rounded-xl active:scale-95 transition-transform"
                >
                  Chia sẻ ngay
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map(item => (
                <ReferralCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </div>

        {/* Note bảo mật */}
        <div className="mx-4 mt-4 mb-4 bg-slate-100 rounded-2xl px-4 py-3">
          <p className="text-[11px] text-slate-500 leading-relaxed text-center">
            🔒 Thông tin tài chính, lương thưởng của ứng viên được bảo mật hoàn toàn.
            Bạn chỉ thấy thông tin cơ bản và trạng thái tiến trình.
          </p>
        </div>
      </div>
    </div>
  );
}
