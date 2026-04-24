/**
 * MobileApprovalsPage.jsx — Quản lý Phê duyệt (Base Request)
 * Roles: Sales gửi đề xuất / Manager + BOD duyệt
 */
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2, XCircle, Clock, Home, FileText, Wallet,
  Calendar, ChevronRight, Filter, Bell, ArrowLeft,
  PlusCircle, Building2, UserCheck, DollarSign, AlertCircle,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

// ─── MOCK DATA ─────────────────────────────────────────────────────────────────
const MOCK_REQUESTS = [
  {
    id: 'req-001', type: 'booking', title: 'Giữ chỗ S1-08B — NOBU Residences',
    detail: 'Căn 2PN | Tầng 8 | 3.8 tỷ | KH: Nguyễn Văn An (0901 234 567)',
    submittedBy: 'Trần Minh Khoa', submittedAt: '2026-04-20T08:30:00Z',
    status: 'pending', priority: 'high', icon: Building2, color: 'bg-blue-500',
    deadline: '2026-04-20T17:00:00Z',
  },
  {
    id: 'req-002', type: 'leave', title: 'Xin nghỉ phép — Thứ 4, 23/04',
    detail: 'Lý do: Công việc cá nhân | 1 ngày | Đã bàn giao cho Hương',
    submittedBy: 'Lê Thu Hương', submittedAt: '2026-04-19T15:00:00Z',
    status: 'pending', priority: 'medium', icon: Calendar, color: 'bg-violet-500',
    deadline: '2026-04-21T09:00:00Z',
  },
  {
    id: 'req-003', type: 'expense', title: 'Chi phí tiếp khách — Đoàn 5 người',
    detail: 'Nhà hàng Ý — 2.400.000đ | Hóa đơn đính kèm | Dự án: Sun Symphony',
    submittedBy: 'Nguyễn Phúc Hùng', submittedAt: '2026-04-19T12:00:00Z',
    status: 'approved', priority: 'medium', icon: Wallet, color: 'bg-emerald-500',
    deadline: null, approvedBy: 'Trần Thị Mai', approvedAt: '2026-04-19T14:30:00Z',
  },
  {
    id: 'req-004', type: 'booking', title: 'Giữ chỗ T3-12A — Sun Symphony',
    detail: 'Căn 3PN | Tầng 12 | 6.2 tỷ | KH: Lê Thị Bích (0912 345 678)',
    submittedBy: 'Phạm Thùy Linh', submittedAt: '2026-04-18T09:00:00Z',
    status: 'rejected', priority: 'high', icon: Building2, color: 'bg-blue-500',
    deadline: null, rejectedBy: 'Trần Thị Mai', rejectedAt: '2026-04-18T11:00:00Z',
    rejectReason: 'Căn đã có khách đặt cọc trước — vui lòng chọn căn khác',
  },
  {
    id: 'req-005', type: 'contract', title: 'Đề xuất ký HĐMB — NOBU S2-15C',
    detail: 'Căn 1PN Premium | Tầng 15 | 4.1 tỷ | KH: Võ Thanh Tùng',
    submittedBy: 'Trần Minh Khoa', submittedAt: '2026-04-20T10:00:00Z',
    status: 'pending', priority: 'high', icon: FileText, color: 'bg-amber-500',
    deadline: '2026-04-21T12:00:00Z',
  },
  {
    id: 'req-006', type: 'expense', title: 'Marketing — In ấn Tờ rơi Sun Ponte',
    detail: '5.000 tờ rơi A5 | 3.500.000đ | Công ty In Minh Đức',
    submittedBy: 'Nguyễn Thị Hoa', submittedAt: '2026-04-17T14:00:00Z',
    status: 'approved', priority: 'low', icon: Wallet, color: 'bg-emerald-500',
    deadline: null, approvedBy: 'Lê Tuấn Anh', approvedAt: '2026-04-17T16:00:00Z',
  },
];

const TYPE_LABELS = {
  booking: { label: 'Giữ chỗ căn', color: 'bg-blue-100 text-blue-700', border: 'border-blue-200' },
  leave:   { label: 'Xin nghỉ phép', color: 'bg-violet-100 text-violet-700', border: 'border-violet-200' },
  expense: { label: 'Chi phí', color: 'bg-emerald-100 text-emerald-700', border: 'border-emerald-200' },
  contract:{ label: 'Ký hợp đồng', color: 'bg-amber-100 text-amber-700', border: 'border-amber-200' },
};

const STATUS_CONFIG = {
  pending:  { label: 'Chờ duyệt', icon: Clock,         color: 'text-amber-500',  bg: 'bg-amber-50',  border: 'border-amber-200' },
  approved: { label: 'Đã duyệt',  icon: CheckCircle2,  color: 'text-emerald-600',bg: 'bg-emerald-50',border: 'border-emerald-200' },
  rejected: { label: 'Từ chối',   icon: XCircle,       color: 'text-red-500',    bg: 'bg-red-50',    border: 'border-red-200' },
};

const PRIORITY_CONFIG = {
  high:   { label: 'Khẩn', color: 'bg-red-100 text-red-600' },
  medium: { label: 'Bình thường', color: 'bg-slate-100 text-slate-600' },
  low:    { label: 'Thấp', color: 'bg-gray-100 text-gray-500' },
};

function timeAgo(iso) {
  const diff = (Date.now() - new Date(iso)) / 1000;
  if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
  return `${Math.floor(diff / 86400)} ngày trước`;
}

function RequestCard({ req, canApprove, onApprove, onReject }) {
  const [expanded, setExpanded] = useState(false);
  const typeInfo = TYPE_LABELS[req.type] || TYPE_LABELS.booking;
  const statusCfg = STATUS_CONFIG[req.status];
  const priorityCfg = PRIORITY_CONFIG[req.priority];
  const StatusIcon = statusCfg.icon;
  const TypeIcon = req.icon;

  return (
    <div className={`bg-white rounded-2xl border ${statusCfg.border} shadow-sm overflow-hidden mb-3`}>
      {/* Header */}
      <button
        className="w-full text-left p-4"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 ${req.color} rounded-xl flex items-center justify-center flex-shrink-0`}>
            <TypeIcon className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${typeInfo.color}`}>
                {typeInfo.label}
              </span>
              {req.priority === 'high' && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-100 text-red-600">
                  🔴 Khẩn
                </span>
              )}
            </div>
            <p className="font-semibold text-slate-800 text-sm leading-snug">{req.title}</p>
            <p className="text-xs text-slate-500 mt-0.5">{req.submittedBy} · {timeAgo(req.submittedAt)}</p>
          </div>
          <div className="flex flex-col items-end gap-1 flex-shrink-0">
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full ${statusCfg.bg} ${statusCfg.border} border`}>
              <StatusIcon className={`w-3 h-3 ${statusCfg.color}`} />
              <span className={`text-[10px] font-semibold ${statusCfg.color}`}>{statusCfg.label}</span>
            </div>
          </div>
        </div>
      </button>

      {/* Expanded Detail */}
      {expanded && (
        <div className="border-t border-slate-100 px-4 pb-4">
          <p className="text-sm text-slate-600 mt-3 leading-relaxed bg-slate-50 rounded-xl p-3">
            {req.detail}
          </p>

          {req.deadline && req.status === 'pending' && (
            <div className="flex items-center gap-2 mt-2 text-xs text-amber-600">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Hạn duyệt: {new Date(req.deadline).toLocaleString('vi-VN')}</span>
            </div>
          )}

          {req.status === 'rejected' && req.rejectReason && (
            <div className="mt-3 bg-red-50 border border-red-200 rounded-xl p-3">
              <p className="text-xs font-semibold text-red-600 mb-1">Lý do từ chối:</p>
              <p className="text-xs text-red-700">{req.rejectReason}</p>
            </div>
          )}

          {req.status === 'approved' && (
            <p className="text-xs text-emerald-600 mt-2">
              ✅ Duyệt bởi {req.approvedBy} · {timeAgo(req.approvedAt)}
            </p>
          )}

          {/* Action buttons — only for pending + manager */}
          {req.status === 'pending' && canApprove && (
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => onReject(req.id)}
                className="flex-1 py-2.5 rounded-xl border border-red-300 text-red-600 text-sm font-semibold flex items-center justify-center gap-2"
              >
                <XCircle className="w-4 h-4" /> Từ chối
              </button>
              <button
                onClick={() => onApprove(req.id)}
                className="flex-1 py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-semibold flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" /> Duyệt
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── NEW REQUEST FORM ─────────────────────────────────────────────────────────
function NewRequestSheet({ onClose, onSubmit }) {
  const [type, setType] = useState('booking');
  const [title, setTitle] = useState('');
  const [detail, setDetail] = useState('');

  const typeOptions = [
    { value: 'booking',  label: '🏠 Giữ chỗ căn' },
    { value: 'leave',    label: '📅 Xin nghỉ phép' },
    { value: 'expense',  label: '💰 Chi phí' },
    { value: 'contract', label: '📄 Ký hợp đồng' },
  ];

  const placeholders = {
    booking: 'Tên căn, tầng, giá, thông tin khách hàng...',
    leave: 'Ngày nghỉ, lý do, người bàn giao công việc...',
    expense: 'Khoản chi, số tiền, nhà cung cấp, mục đích...',
    contract: 'Mã căn, khách hàng, giá trị hợp đồng...',
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col">
      <div className="flex-1 bg-black/50" onClick={onClose} />
      <div className="bg-white rounded-t-3xl p-5 pb-10 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-slate-800">Tạo đề xuất mới</h2>
          <button onClick={onClose} className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center">
            <XCircle className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        {/* Type selector */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          {typeOptions.map(opt => (
            <button
              key={opt.value}
              onClick={() => setType(opt.value)}
              className={`py-2.5 px-3 rounded-xl text-sm font-semibold border transition-all ${
                type === opt.value
                  ? 'bg-[#316585] text-white border-[#316585]'
                  : 'bg-slate-50 text-slate-600 border-slate-200'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Title */}
        <div className="mb-3">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">Tiêu đề</label>
          <input
            className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#316585]/30"
            placeholder="Tóm tắt nội dung đề xuất..."
            value={title}
            onChange={e => setTitle(e.target.value)}
          />
        </div>

        {/* Detail */}
        <div className="mb-5">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">Chi tiết</label>
          <textarea
            rows={4}
            className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#316585]/30 resize-none"
            placeholder={placeholders[type]}
            value={detail}
            onChange={e => setDetail(e.target.value)}
          />
        </div>

        <button
          onClick={() => {
            if (!title.trim()) { toast.error('Vui lòng nhập tiêu đề'); return; }
            onSubmit({ type, title, detail });
            onClose();
          }}
          className="w-full py-3.5 bg-[#316585] text-white font-bold rounded-xl text-sm"
        >
          Gửi đề xuất
        </button>
      </div>
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function MobileApprovalsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [requests, setRequests] = useState(MOCK_REQUESTS);
  const [activeTab, setActiveTab] = useState('pending');
  const [showNew, setShowNew] = useState(false);

  // Roles có thể duyệt
  const canApprove = ['manager', 'bod', 'admin', 'project_director'].includes(user?.role);
  // Sales chỉ xem của mình
  const isSales = ['sales', 'agency'].includes(user?.role);

  const tabs = [
    { key: 'pending',  label: 'Chờ duyệt', count: requests.filter(r => r.status === 'pending').length },
    { key: 'approved', label: 'Đã duyệt',  count: requests.filter(r => r.status === 'approved').length },
    { key: 'rejected', label: 'Từ chối',   count: requests.filter(r => r.status === 'rejected').length },
    { key: 'all',      label: 'Tất cả',    count: requests.length },
  ];

  const filtered = useMemo(() =>
    activeTab === 'all' ? requests : requests.filter(r => r.status === activeTab),
    [activeTab, requests]
  );

  const handleApprove = (id) => {
    setRequests(prev => prev.map(r => r.id === id
      ? { ...r, status: 'approved', approvedBy: user?.name || 'Manager', approvedAt: new Date().toISOString() }
      : r
    ));
    toast.success('✅ Đã phê duyệt đề xuất');
  };

  const handleReject = (id) => {
    setRequests(prev => prev.map(r => r.id === id
      ? { ...r, status: 'rejected', rejectedBy: user?.name || 'Manager', rejectedAt: new Date().toISOString(), rejectReason: 'Không phù hợp thời điểm hiện tại' }
      : r
    ));
    toast.error('❌ Đã từ chối đề xuất');
  };

  const handleNewRequest = ({ type, title, detail }) => {
    const newReq = {
      id: `req-${Date.now()}`, type, title, detail,
      submittedBy: user?.name || 'Bạn',
      submittedAt: new Date().toISOString(),
      status: 'pending', priority: 'medium',
      icon: type === 'booking' ? Building2 : type === 'expense' ? Wallet : type === 'leave' ? Calendar : FileText,
      color: type === 'booking' ? 'bg-blue-500' : type === 'expense' ? 'bg-emerald-500' : type === 'leave' ? 'bg-violet-500' : 'bg-amber-500',
    };
    setRequests(prev => [newReq, ...prev]);
    toast.success('📨 Đề xuất đã được gửi đi');
    setActiveTab('pending');
  };

  const pendingCount = requests.filter(r => r.status === 'pending').length;

  return (
    <div className="h-screen bg-slate-50 flex flex-col overflow-hidden">
      {/* HEADER */}
      <div className="bg-white border-b border-slate-100 px-4 pt-12 pb-0 flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="w-9 h-9 bg-slate-100 rounded-full flex items-center justify-center">
              <ArrowLeft className="w-4 h-4 text-slate-600" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Phê duyệt</h1>
              <p className="text-xs text-slate-500">
                {canApprove ? `${pendingCount} đề xuất chờ duyệt` : 'Đề xuất của tôi'}
              </p>
            </div>
          </div>
          {/* New request button — Sales only */}
          <button
            onClick={() => setShowNew(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#316585] text-white rounded-xl text-sm font-semibold"
          >
            <PlusCircle className="w-4 h-4" />
            Gửi đề xuất
          </button>
        </div>

        {/* Stats row */}
        <div className="flex gap-2 mb-4">
          {[
            { label: 'Chờ duyệt', val: requests.filter(r=>r.status==='pending').length, color: 'text-amber-500 bg-amber-50' },
            { label: 'Đã duyệt',  val: requests.filter(r=>r.status==='approved').length, color: 'text-emerald-600 bg-emerald-50' },
            { label: 'Từ chối',   val: requests.filter(r=>r.status==='rejected').length, color: 'text-red-500 bg-red-50' },
          ].map(s => (
            <div key={s.label} className={`flex-1 ${s.color} rounded-xl py-2 text-center`}>
              <p className="text-lg font-bold">{s.val}</p>
              <p className="text-[10px] font-medium">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 overflow-x-auto pb-3 scrollbar-hide">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-semibold transition-all ${
                activeTab === tab.key
                  ? 'bg-[#316585] text-white'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {tab.label} {tab.count > 0 && `(${tab.count})`}
            </button>
          ))}
        </div>
      </div>

      {/* LIST */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <CheckCircle2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">Không có đề xuất nào</p>
            <p className="text-slate-400 text-sm mt-1">Mọi thứ đã được xử lý 🎉</p>
          </div>
        ) : (
          filtered.map(req => (
            <RequestCard
              key={req.id}
              req={req}
              canApprove={canApprove}
              onApprove={handleApprove}
              onReject={handleReject}
            />
          ))
        )}
        <div className="h-24" />
      </div>

      {/* NEW REQUEST SHEET */}
      {showNew && (
        <NewRequestSheet
          onClose={() => setShowNew(false)}
          onSubmit={handleNewRequest}
        />
      )}
    </div>
  );
}
