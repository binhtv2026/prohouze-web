/**
 * MobileOfficePage.jsx — Văn bản Nội bộ (Base Office)
 * Thông báo, Quyết định, Quy định có chữ ký số
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, FileText, Bell, BookOpen, Download,
  CheckCircle2, Clock, ChevronRight, Shield, Stamp,
  Filter, Search,
} from 'lucide-react';

const DOC_TYPES = [
  { key: 'all',     label: 'Tất cả' },
  { key: 'notice',  label: '📢 Thông báo' },
  { key: 'decision',label: '📋 Quyết định' },
  { key: 'policy',  label: '📜 Quy định' },
  { key: 'contract',label: '📄 Hợp đồng' },
];

const DOCUMENTS = [
  {
    id: 'd1', type: 'notice', title: 'Thông báo: Điều chỉnh thời gian làm việc tháng 05/2026',
    issuer: 'Ban Giám đốc', date: '20/04/2026', signed: true, important: true,
    summary: 'Áp dụng từ 01/05/2026, giờ làm việc chính thức: 08:00 – 17:00 (T2–T6), 08:00 – 12:00 (T7).',
    readBy: 18, total: 24,
  },
  {
    id: 'd2', type: 'decision', title: 'Quyết định: Bổ nhiệm Trưởng phòng Kinh doanh miền Trung',
    issuer: 'Tổng Giám đốc', date: '18/04/2026', signed: true, important: true,
    summary: 'Bổ nhiệm anh Nguyễn Văn A giữ chức Trưởng phòng Kinh doanh Khu vực Miền Trung kể từ ngày 01/05/2026.',
    readBy: 21, total: 24,
  },
  {
    id: 'd3', type: 'policy', title: 'Quy định: Chính sách hoa hồng và thưởng doanh số Q2/2026',
    issuer: 'Phòng Nhân sự', date: '15/04/2026', signed: true, important: false,
    summary: 'Cập nhật bảng tỷ lệ hoa hồng theo dự án và điều kiện thưởng KPI quý 2/2026.',
    readBy: 15, total: 24,
  },
  {
    id: 'd4', type: 'policy', title: 'Quy định: Sử dụng thương hiệu và tài liệu marketing nội bộ',
    issuer: 'Phòng Marketing', date: '10/04/2026', signed: false, important: false,
    summary: 'Hướng dẫn sử dụng đúng nhận diện thương hiệu ANKAPU trong tài liệu sale và mạng xã hội.',
    readBy: 22, total: 24,
  },
  {
    id: 'd5', type: 'notice', title: 'Thông báo: Lịch nghỉ lễ 30/04 và 01/05/2026',
    issuer: 'Ban Giám đốc', date: '08/04/2026', signed: true, important: true,
    summary: 'Công ty nghỉ từ 30/04 (T4) đến 02/05 (CN). Làm bù ngày 09/05 (T7).',
    readBy: 24, total: 24,
  },
];

function DocCard({ doc }) {
  const [expanded, setExpanded] = useState(false);
  const typeColors = {
    notice:  'bg-blue-100 text-blue-700',
    decision:'bg-violet-100 text-violet-700',
    policy:  'bg-amber-100 text-amber-700',
    contract:'bg-emerald-100 text-emerald-700',
  };
  const typeLabels = { notice:'Thông báo', decision:'Quyết định', policy:'Quy định', contract:'Hợp đồng' };
  const readPct = Math.round((doc.readBy / doc.total) * 100);

  return (
    <div className={`bg-white rounded-2xl shadow-sm mb-3 overflow-hidden border ${doc.important ? 'border-blue-200' : 'border-slate-100'}`}>
      <button className="w-full text-left p-4" onClick={() => setExpanded(!expanded)}>
        {doc.important && (
          <div className="flex items-center gap-1.5 mb-2">
            <Bell className="w-3 h-3 text-red-500" />
            <span className="text-[10px] font-black text-red-600 uppercase tracking-wide">Quan trọng</span>
          </div>
        )}
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${doc.type === 'notice' ? 'bg-blue-50' : doc.type === 'decision' ? 'bg-violet-50' : 'bg-amber-50'}`}>
            <FileText className={`w-5 h-5 ${doc.type === 'notice' ? 'text-blue-600' : doc.type === 'decision' ? 'text-violet-600' : 'text-amber-600'}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${typeColors[doc.type]}`}>
                {typeLabels[doc.type]}
              </span>
              {doc.signed && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 flex items-center gap-1">
                  <Stamp className="w-2.5 h-2.5" /> CKS
                </span>
              )}
            </div>
            <p className="text-sm font-semibold text-slate-800 leading-snug">{doc.title}</p>
            <p className="text-xs text-slate-500 mt-0.5">{doc.issuer} · {doc.date}</p>
          </div>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-slate-100 px-4 pb-4">
          <p className="text-sm text-slate-600 bg-slate-50 rounded-xl p-3 my-3 leading-relaxed">{doc.summary}</p>

          {/* Read progress */}
          <div className="mb-3">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-slate-500">Đã đọc trong đội</span>
              <span className="font-semibold text-slate-700">{doc.readBy}/{doc.total} người ({readPct}%)</span>
            </div>
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-[#316585] rounded-full" style={{ width: `${readPct}%` }} />
            </div>
          </div>

          <div className="flex gap-2">
            <button className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold flex items-center justify-center gap-1">
              <Download className="w-3.5 h-3.5" /> Tải về
            </button>
            <button className="flex-1 py-2.5 bg-[#316585] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Đã đọc
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MobileOfficePage() {
  const navigate = useNavigate();
  const [activeType, setActiveType] = useState('all');
  const [search, setSearch] = useState('');

  const filtered = DOCUMENTS.filter(d => {
    const matchType = activeType === 'all' || d.type === activeType;
    const matchSearch = !search || d.title.toLowerCase().includes(search.toLowerCase());
    return matchType && matchSearch;
  });

  return (
    <div className="h-screen bg-[#f1f5f9] flex flex-col overflow-hidden">
      <div className="bg-white border-b border-slate-100 px-4 pt-12 pb-3 flex-shrink-0">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => navigate(-1)} className="w-9 h-9 bg-slate-100 rounded-full flex items-center justify-center">
            <ArrowLeft className="w-4 h-4 text-slate-600" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Văn bản Nội bộ</h1>
            <p className="text-xs text-slate-500">{DOCUMENTS.filter(d => d.important).length} văn bản quan trọng</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input className="w-full bg-slate-100 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none"
            placeholder="Tìm văn bản..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        {/* Type filter */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {DOC_TYPES.map(t => (
            <button key={t.key} onClick={() => setActiveType(t.key)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${activeType === t.key ? 'bg-[#316585] text-white' : 'bg-slate-100 text-slate-600'}`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {filtered.map(doc => <DocCard key={doc.id} doc={doc} />)}
        <div className="h-24" />
      </div>
    </div>
  );
}
