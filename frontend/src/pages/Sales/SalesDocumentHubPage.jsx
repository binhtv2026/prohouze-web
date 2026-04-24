import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Eye, Share2, Link as LinkIcon, Star, Clock, X,
  FileSpreadsheet, FileText, Shield, LayoutTemplate, BookOpen, BarChart2,
  ArrowLeft, ChevronRight, ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Browser } from '@capacitor/browser';

// ─── DATA SOURCE ─────────────────────────────────────────────────────────────
// TODO: Khi sếp gửi link Google Drive thật, cập nhật tại đây (1 chỗ duy nhất).
// Định dạng driveUrl: dùng link /preview hoặc /embed để nhúng iframe.
// Định dạng shareUrl: link gốc để share ra app bên ngoài.

// ── HELPER: extract Google Drive folder/file ID ─────────────────────────────
const DOCUMENTS = [
  // ══════════════════════════════════════════════════════════════════
  // VINHOMES HAI VÂN BAY — 16 tài liệu nội bộ
  // ══════════════════════════════════════════════════════════════════
  {
    id: 'vhvb-tmb',
    title: 'TMB - Mã căn, diện tích & tiện ích dự án',
    project: 'vhvb',
    projectLabel: 'VH Hai Vân Bay',
    projectColor: 'bg-indigo-600',
    type: 'thu-muc',
    typeLabel: '📋 Bảng giá / TMB',
    typeIcon: FileSpreadsheet,
    iconColor: 'bg-indigo-100 text-indigo-600',
    format: 'Google Drive Folder',
    updatedAt: 'Mới nhất',
    shareUrl: 'https://drive.google.com/drive/folders/1H5CPAaedDai9qLku8m9p98VKcRitHL09',
    isHot: true,
  },
  {
    id: 'vhvb-bandovitri',
    title: 'Bản đồ vị trí dự án',
    project: 'vhvb',
    projectLabel: 'VH Hai Vân Bay',
    projectColor: 'bg-indigo-600',
    type: 'ban-do',
    typeLabel: '🗺️ Bản đồ',
    typeIcon: LayoutTemplate,
    iconColor: 'bg-teal-100 text-teal-600',
    format: 'Google Drive Folder',
    updatedAt: 'Mới nhất',
    shareUrl: 'https://drive.google.com/drive/folders/1CbbpR3pLqmekAKYQhxOLUaDIpAfVlrEJ',
    isHot: false,
  },
  {
    id: 'vhvb-phoincanh',
    title: 'Ảnh phối cảnh dự án',
    project: 'vhvb',
    projectLabel: 'VH Hai Vân Bay',
    projectColor: 'bg-indigo-600',
    type: 'hinh-anh',
    typeLabel: '🖼️ Phối cảnh',
    typeIcon: LayoutTemplate,
    iconColor: 'bg-purple-100 text-purple-600',
    format: 'Google Drive Folder',
    updatedAt: 'Mới nhất',
    shareUrl: 'https://drive.google.com/drive/folders/1_4An_DjojZkiBQBvJxA0Tmq_0ARzjqX6',
    isHot: false,
  },
  {
    id: 'vhvb-brand',
    title: 'Bộ nhận diện thương hiệu',
    project: 'vhvb',
    projectLabel: 'VH Hai Vân Bay',
    projectColor: 'bg-indigo-600',
    type: 'nhan-dien',
    typeLabel: '🎨 Nhận diện',
    typeIcon: Shield,
    iconColor: 'bg-pink-100 text-pink-600',
    format: 'Google Drive Folder',
    updatedAt: 'Mới nhất',
    shareUrl: 'https://drive.google.com/drive/folders/1NeXfCqSULl6mNqQn4YW-BtLi1M8ZmArf',
    isHot: false,
  },
  {
    id: 'vhvb-kv-rumor',
    title: 'KV Rumor dự án',
    project: 'vhvb',
    projectLabel: 'VH Hai Vân Bay',
    projectColor: 'bg-indigo-600',
    type: 'kv',
    typeLabel: '📣 Key Visual',
    typeIcon: BarChart2,
    iconColor: 'bg-orange-100 text-orange-600',
    format: 'Google Drive Folder',
    updatedAt: 'Mới nhất',
    shareUrl: 'https://drive.google.com/drive/folders/1GHkdq2bnEB8KlPJux9vyhHvX9PcFOdpP',
    isHot: false,
  },
  {
    id: 'vhvb-kv-ramats',
    title: 'KV Ra mắt dự án',
    project: 'vhvb',
    projectLabel: 'VH Hai Vân Bay',
    projectColor: 'bg-indigo-600',
    type: 'kv',
    typeLabel: '📣 Key Visual',
    typeIcon: BarChart2,
    iconColor: 'bg-orange-100 text-orange-600',
    format: 'Google Drive Folder',
    updatedAt: 'Mới nhất',
    shareUrl: 'https://drive.google.com/drive/folders/1yfbjeEV5-ybPjxVz6km0m4Mdf5orzkfy',
    isHot: true,
  },
  {
    id: 'vhvb-bando-tienich',
    title: 'Bản đồ tiện ích dự án',
    project: 'vhvb',
    projectLabel: 'VH Hai Vân Bay',
    projectColor: 'bg-indigo-600',
    type: 'ban-do',
    typeLabel: '🗺️ Bản đồ',
    typeIcon: LayoutTemplate,
    iconColor: 'bg-teal-100 text-teal-600',
    format: 'Google Drive File',
    updatedAt: 'Mới nhất',
    shareUrl: 'https://drive.google.com/file/d/1sNKDKuIL0VBEiuV5gZf-1I6Fnx-5iJ7F/view',
    isHot: false,
  },
  {
    id: 'vhvb-bando-hatang',
    title: 'Bản đồ hạ tầng',
    project: 'vhvb',
    projectLabel: 'VH Hai Vân Bay',
    projectColor: 'bg-indigo-600',
    type: 'ban-do',
    typeLabel: '🗺️ Bản đồ',
    typeIcon: LayoutTemplate,
    iconColor: 'bg-teal-100 text-teal-600',
    format: 'Google Drive File',
    updatedAt: 'Mới nhất',
    shareUrl: 'https://drive.google.com/file/d/1huWsNlxNCt4QNrP8g7-q9VFAhDpldKqB/view',
    isHot: false,
  },
  {
    id: 'vhvb-toroi',
    title: 'Tờ rơi',
    project: 'vhvb',
    projectLabel: 'VH Hai Vân Bay',
    projectColor: 'bg-indigo-600',
    type: 'thu-muc',
    typeLabel: '📄 Tờ rơi',
    typeIcon: FileText,
    iconColor: 'bg-green-100 text-green-600',
    format: 'Google Drive Folder',
    updatedAt: 'Mới nhất',
    shareUrl: 'https://drive.google.com/drive/folders/1m_KyuIsFgP6RLIclH-GJSE82rC9wEy32',
    isHot: false,
  },
  {
    id: 'vhvb-bikit',
    title: 'Bộ bí kíp tư vấn',
    project: 'vhvb',
    projectLabel: 'VH Hai Vân Bay',
    projectColor: 'bg-indigo-600',
    type: 'tu-van',
    typeLabel: '💡 Bí kíp tư vấn',
    typeIcon: BookOpen,
    iconColor: 'bg-amber-100 text-amber-600',
    format: 'Google Drive Folder',
    updatedAt: 'Mới nhất',
    shareUrl: 'https://drive.google.com/drive/folders/1mY4CqH8I0FWKMCyx1nFYeQNdhhKL39Xi',
    isHot: true,
  },
  {
    id: 'vhvb-clip-thitruong',
    title: 'Chuỗi Clip thị trường',
    project: 'vhvb',
    projectLabel: 'VH Hai Vân Bay',
    projectColor: 'bg-indigo-600',
    type: 'video',
    typeLabel: '🎬 Video',
    typeIcon: BarChart2,
    iconColor: 'bg-red-100 text-red-600',
    format: 'Google Drive Folder',
    updatedAt: 'Mới nhất',
    shareUrl: 'https://drive.google.com/drive/folders/10z8i_JEHAzmvdSBWJ5iJVGKiOEtdnzdD',
    isHot: false,
  },
  {
    id: 'vhvb-phim-ftz',
    title: 'Phim FTZ — Phân tích giá trị',
    project: 'vhvb',
    projectLabel: 'VH Hai Vân Bay',
    projectColor: 'bg-indigo-600',
    type: 'video',
    typeLabel: '🎬 Video',
    typeIcon: BarChart2,
    iconColor: 'bg-red-100 text-red-600',
    format: 'Google Drive Folder',
    updatedAt: 'Mới nhất',
    shareUrl: 'https://drive.google.com/drive/folders/1jn66TIYpF3M1XBA6QjMXCD-qlMXcWfNF',
    isHot: false,
  },
  {
    id: 'vhvb-phim-bachvan',
    title: 'Phim Mood Bạch Vân',
    project: 'vhvb',
    projectLabel: 'VH Hai Vân Bay',
    projectColor: 'bg-indigo-600',
    type: 'video',
    typeLabel: '🎬 Video',
    typeIcon: BarChart2,
    iconColor: 'bg-red-100 text-red-600',
    format: 'Google Drive Folder',
    updatedAt: 'Mới nhất',
    shareUrl: 'https://drive.google.com/drive/folders/1FbkyzaHQLMXSgN5HpC8RXSwBRztGUOdK',
    isHot: false,
  },
  {
    id: 'vhvb-phim-mood-tong',
    title: 'Phim Mood tổng dự án',
    project: 'vhvb',
    projectLabel: 'VH Hai Vân Bay',
    projectColor: 'bg-indigo-600',
    type: 'video',
    typeLabel: '🎬 Video',
    typeIcon: BarChart2,
    iconColor: 'bg-red-100 text-red-600',
    format: 'Google Drive Folder',
    updatedAt: 'Mới nhất',
    shareUrl: 'https://drive.google.com/drive/folders/1ZzEyImCqOdHKn5yp6HzWIkTD9HezvdgY',
    isHot: false,
  },
  {
    id: 'vhvb-phim-tvc',
    title: 'Phim TVC tổng dự án',
    project: 'vhvb',
    projectLabel: 'VH Hai Vân Bay',
    projectColor: 'bg-indigo-600',
    type: 'video',
    typeLabel: '🎬 Video',
    typeIcon: BarChart2,
    iconColor: 'bg-red-100 text-red-600',
    format: 'Google Drive Folder',
    updatedAt: 'Mới nhất',
    shareUrl: 'https://drive.google.com/drive/folders/1OGSwVrNAKoWzFNx2OtEI0MZcJiJPtFVq',
    isHot: false,
  },
  {
    id: 'vhvb-phim-vitri',
    title: 'Phim vị trí & thị trường',
    project: 'vhvb',
    projectLabel: 'VH Hai Vân Bay',
    projectColor: 'bg-indigo-600',
    type: 'video',
    typeLabel: '🎬 Video',
    typeIcon: BarChart2,
    iconColor: 'bg-red-100 text-red-600',
    format: 'Google Drive Folder',
    updatedAt: 'Mới nhất',
    shareUrl: 'https://drive.google.com/drive/folders/1Ku3ryWPXYxvcWNXsIs2j0PPRYycNnS46',
    isHot: false,
  },
  // ══════════════════════════════════════════════════════════════════
  // CÁC DỰ ÁN KHÁC
  // ══════════════════════════════════════════════════════════════════
  {
    id: 'nobu-folder',
    title: 'Toàn bộ tài liệu — NOBU Residences Danang',
    project: 'nobu',
    projectLabel: 'Nobu Danang',
    projectColor: 'bg-sky-500',
    type: 'thu-muc',
    typeLabel: '📂 Thư mục dự án',
    typeIcon: BookOpen,
    iconColor: 'bg-sky-100 text-sky-600',
    format: 'Google Drive Folder',
    updatedAt: 'Mới nhất',
    shareUrl: 'https://drive.google.com/drive/folders/1K-rKGFZj4QywwHW1ISJTnnFMCprcsjBg',
    isHot: true,
  },
  {
    id: 'ssr-folder',
    title: 'Toàn bộ tài liệu — Sun Symphony Residence',
    project: 'ssr',
    projectLabel: 'Sun Symphony',
    projectColor: 'bg-amber-500',
    type: 'thu-muc',
    typeLabel: '📂 Thư mục dự án',
    typeIcon: BookOpen,
    iconColor: 'bg-amber-100 text-amber-600',
    format: 'Google Drive Folder',
    updatedAt: 'Mới nhất',
    shareUrl: 'https://drive.google.com/drive/folders/1YZw6R2ZzSfv4OfmybkqJC5F_6RiVFK9L',
    isHot: true,
  },
  {
    id: 'sunponte-folder',
    title: 'Toàn bộ tài liệu — Sun Ponte Residence Da Nang',
    project: 'sunponte',
    projectLabel: 'Sun Ponte',
    projectColor: 'bg-blue-500',
    type: 'thu-muc',
    typeLabel: '📂 Thư mục dự án',
    typeIcon: BookOpen,
    iconColor: 'bg-blue-100 text-blue-600',
    format: 'Google Drive Folder',
    updatedAt: 'Mới nhất',
    shareUrl: 'https://drive.google.com/drive/folders/1qVbf8TOK5dXh-m8iOtvk3LoofrDI5Hdh',
    isHot: false,
  },
  {
    id: 'suncosmo-folder',
    title: 'Toàn bộ tài liệu — Sun Cosmo Residence Da Nang',
    project: 'suncosmo',
    projectLabel: 'Sun Cosmo',
    projectColor: 'bg-emerald-500',
    type: 'thu-muc',
    typeLabel: '📂 Thư mục dự án',
    typeIcon: BookOpen,
    iconColor: 'bg-emerald-100 text-emerald-600',
    format: 'Google Drive Folder',
    updatedAt: 'Mới nhất',
    shareUrl: 'https://drive.google.com/drive/u/0/folders/1-VQfj5jfp6A_ZhAD6FM6C-iLv_48zxU_',
    isHot: false,
  },
  {
    id: 'vkres-folder',
    title: 'Toàn bộ tài liệu — VKRES Capital Square',
    project: 'vkres',
    projectLabel: 'VKRES Capital Sq.',
    projectColor: 'bg-rose-600',
    type: 'thu-muc',
    typeLabel: '📂 Thư mục dự án',
    typeIcon: BookOpen,
    iconColor: 'bg-rose-100 text-rose-600',
    format: 'Google Drive Folder',
    updatedAt: 'Mới nhất',
    shareUrl: 'https://drive.google.com/drive/folders/12ZKadto8ML-TGdkM5Q7VcrisDwQ8wNxa',
    isHot: true,
  },
];

const PROJECTS = [
  { key: 'all', label: 'Tất cả' },
  { key: 'vhvb', label: '🏙️ VH Hai Vân Bay' },
  { key: 'vkres', label: '🏢 VKRES Capital Sq.' },
  { key: 'nobu', label: 'Nobu Danang' },
  { key: 'ssr', label: 'Sun Symphony' },
  { key: 'sunponte', label: 'Sun Ponte' },
  { key: 'suncosmo', label: 'Sun Cosmo' },
];

const DOC_TYPES = [
  { key: 'all', label: 'Tất cả loại' },
  { key: 'thu-muc', label: '📂 Thư mục / Tài liệu' },
  { key: 'ban-do', label: '🗺️ Bản đồ' },
  { key: 'kv', label: '📣 Key Visual' },
  { key: 'video', label: '🎬 Video / Phim' },
  { key: 'hinh-anh', label: '🖼️ Phối cảnh' },
  { key: 'tu-van', label: '💡 Bí kíp tư vấn' },
  { key: 'nhan-dien', label: '🎨 Nhận diện' },
];

const PINNED_KEY = 'ph_pinned_docs';
const RECENT_KEY = 'ph_recent_docs';
const MAX_RECENT = 3;

function getPinned() {
  try { return JSON.parse(localStorage.getItem(PINNED_KEY) || '[]'); } catch { return []; }
}
function getRecent() {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]'); } catch { return []; }
}
function togglePin(id) {
  const pins = getPinned();
  const next = pins.includes(id) ? pins.filter(p => p !== id) : [...pins, id];
  localStorage.setItem(PINNED_KEY, JSON.stringify(next));
}
function addRecent(id) {
  const recents = getRecent().filter(r => r !== id);
  localStorage.setItem(RECENT_KEY, JSON.stringify([id, ...recents].slice(0, MAX_RECENT)));
}

// ─── SUB-COMPONENTS ──────────────────────────────────────────────────────────

function FilterChips({ options, active, onChange, size = 'md' }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none" style={{ scrollbarWidth: 'none' }}>
      {options.map(opt => (
        <button
          key={opt.key}
          onClick={() => onChange(opt.key)}
          className={`flex-shrink-0 rounded-full font-semibold transition-all active:scale-95 whitespace-nowrap
            ${size === 'sm' ? 'text-[11px] px-3 py-1' : 'text-xs px-4 py-2'}
            ${active === opt.key
              ? 'bg-[#316585] text-white shadow-md shadow-[#316585]/30'
              : 'bg-white text-slate-600 border border-slate-200 hover:border-[#316585]/40'
            }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function DocCard({ doc, onView, onShare, onCopy, onTogglePin, isPinned }) {
  const IconComp = doc.typeIcon;
  return (
    <div className="bg-white rounded-[24px] p-4 border border-slate-100 shadow-sm flex flex-col gap-3 active:scale-[0.98] transition-transform">
      {/* Top Row */}
      <div className="flex items-start gap-3">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${doc.iconColor}`}>
          <IconComp className="w-6 h-6" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-slate-800 text-sm leading-snug line-clamp-2">{doc.title}</p>
          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
            <span className={`text-[10px] font-bold text-white px-2 py-0.5 rounded-full ${doc.projectColor}`}>
              {doc.projectLabel}
            </span>
            <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
              {doc.typeLabel}
            </span>
            {doc.isHot && (
              <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                🔥 Hot
              </span>
            )}
          </div>
          <p className="text-[10px] text-slate-400 mt-1">{doc.format} · Cập nhật {doc.updatedAt}</p>
        </div>
        <button
          onClick={() => onTogglePin(doc.id)}
          className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors
            ${isPinned ? 'bg-amber-50 text-amber-500' : 'bg-slate-50 text-slate-300 hover:text-amber-400'}`}
        >
          <Star className="w-4 h-4" fill={isPinned ? 'currentColor' : 'none'} />
        </button>
      </div>

      {/* Action Row */}
      <div className="flex gap-2">
        <Button
          size="sm"
          className="flex-1 h-9 rounded-2xl bg-[#316585] hover:bg-[#264f68] text-white text-xs font-bold shadow-sm flex items-center gap-1.5"
          onClick={() => onView(doc)}
        >
          <Eye className="w-3.5 h-3.5" />
          Mở xem ngay
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="flex-1 h-9 rounded-2xl text-xs font-bold border-[#316585]/30 text-[#316585] hover:bg-[#316585]/5 flex items-center gap-1.5"
          onClick={() => onShare(doc)}
        >
          <Share2 className="w-3.5 h-3.5" />
          Gửi khách
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="h-9 w-9 rounded-2xl p-0 border-slate-200 text-slate-400 hover:text-slate-600"
          onClick={() => onCopy(doc.shareUrl, doc.title)}
        >
          <LinkIcon className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}

function PinnedMiniCard({ doc, onView, onTogglePin }) {
  const IconComp = doc.typeIcon;
  return (
    <div className="flex-1 bg-white rounded-[20px] p-3 border border-amber-100 shadow-sm flex flex-col gap-2 min-w-0">
      <div className="flex items-center justify-between gap-1">
        <div className={`w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 ${doc.iconColor}`}>
          <IconComp className="w-3.5 h-3.5" />
        </div>
        <button onClick={() => onTogglePin(doc.id)}>
          <Star className="w-4 h-4 text-amber-400" fill="currentColor" />
        </button>
      </div>
      <p className="text-xs font-bold text-slate-700 leading-tight line-clamp-2">{doc.title}</p>
      <button
        onClick={() => onView(doc)}
        className="mt-auto w-full h-8 rounded-xl bg-[#316585]/10 text-[#316585] text-[10px] font-bold flex items-center justify-center gap-1"
      >
        <Eye className="w-3 h-3" />
        Mở xem
      </button>
    </div>
  );
}

// ─── VIEWER MODAL removed — replaced by @capacitor/browser (SFSafariViewController) ─
// Khi user bấm "Mở xem ngay", Browser.open() sẽ mở SFSafariViewController
// ngay trong App (không thoát ra Safari). User bấm nút Done để quay lại App.

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

export default function SalesDocumentHubPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [projectFilter, setProjectFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [pinnedIds, setPinnedIds] = useState(getPinned);
  const [recentIds, setRecentIds] = useState(getRecent);

  // Mở thư mục Google Drive bằng SFSafariViewController (trong app, không thoát Safari)
  const handleView = async (doc) => {
    addRecent(doc.id);
    setRecentIds(getRecent());
    try {
      // Dùng shareUrl (link gốc) để mở full Google Drive interface trong app
      await Browser.open({
        url: doc.shareUrl,
        windowName: '_self',
        presentationStyle: 'popover', // iOS: SFSafariViewController dạng modal
        toolbarColor: '#316585',
      });
    } catch {
      // Fallback nếu không có Capacitor (web browser)
      window.open(doc.shareUrl, '_blank');
    }
  };

  const handleShare = async (doc) => {
    if (navigator.share) {
      try {
        await navigator.share({ title: doc.title, text: `Gửi anh/chị tài liệu: ${doc.title}`, url: doc.shareUrl });
      } catch {}
    } else {
      navigator.clipboard.writeText(doc.shareUrl);
      toast.success('Đã copy link tài liệu!');
    }
  };

  const handleCopy = (url, title) => {
    navigator.clipboard.writeText(url);
    toast.success(`Đã copy link: ${title}`);
  };

  const handleTogglePin = (id) => {
    togglePin(id);
    setPinnedIds(getPinned());
    toast.success(getPinned().includes(id) ? 'Đã ghim tài liệu!' : 'Đã bỏ ghim!');
  };

  const filtered = useMemo(() => {
    return DOCUMENTS.filter(doc => {
      if (projectFilter !== 'all' && doc.project !== projectFilter) return false;
      if (typeFilter !== 'all' && doc.type !== typeFilter) return false;
      if (search && !doc.title.toLowerCase().includes(search.toLowerCase()) && !doc.typeLabel.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [projectFilter, typeFilter, search]);

  const pinnedDocs = DOCUMENTS.filter(d => pinnedIds.includes(d.id)).slice(0, 4);
  const recentDocs = DOCUMENTS.filter(d => recentIds.includes(d.id)).slice(0, 3);

  return (
    <div className="min-h-screen bg-[#f1f5f9] flex flex-col overflow-hidden pb-24">
      {/* ── HEADER ── */}
      <div
        className="relative bg-gradient-to-br from-[#1b3a4d] to-[#316585] flex-shrink-0 overflow-hidden"
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 44px) + 16px)', paddingBottom: '24px' }}
      >
        {/* Decorative blobs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute bottom-0 left-1/3 w-28 h-28 rounded-full bg-white/10 blur-xl" />
        </div>

        {/* Title row */}
        <div className="relative z-10 px-4 flex items-center gap-3 mb-4">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center text-white flex-shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl font-black text-white leading-tight">Tài liệu bán hàng</h1>
            <p className="text-white/60 text-[11px] mt-0.5">Brochure, Bảng giá, Pháp lý & Sale Kit</p>
          </div>
        </div>

        {/* Search bar */}
        <div className="relative z-10 px-4">
          <div className="flex items-center gap-2 bg-white/15 backdrop-blur-md rounded-2xl px-3 py-2.5 border border-white/20">
            <Search className="w-4 h-4 text-white/60 flex-shrink-0" />
            <input
              type="text"
              placeholder="Tìm tài liệu..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-white placeholder-white/50 text-sm font-medium outline-none"
            />
            {search && (
              <button onClick={() => setSearch('')}>
                <X className="w-4 h-4 text-white/60" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── FILTER CARDS (floating, shadow) ── */}
      <div className="px-4 -mt-4 z-20 flex-shrink-0">
        <div className="bg-white rounded-[24px] shadow-md border border-slate-100 p-3.5 flex flex-col gap-2.5">
          <FilterChips options={PROJECTS} active={projectFilter} onChange={setProjectFilter} />
          <FilterChips options={DOC_TYPES} active={typeFilter} onChange={setTypeFilter} size="sm" />
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div className="flex-1 flex flex-col gap-5 px-4 mt-5">

        {/* PINNED */}
        {pinnedDocs.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Star className="w-4 h-4 text-amber-500" fill="currentColor" />
              <h2 className="text-xs font-black text-slate-700 uppercase tracking-widest">Tài liệu hay dùng</h2>
            </div>
            <div className="flex gap-3">
              {pinnedDocs.map(doc => (
                <PinnedMiniCard
                  key={doc.id}
                  doc={doc}
                  onView={handleView}
                  onTogglePin={handleTogglePin}
                />
              ))}
            </div>
          </div>
        )}

        {/* RECENTLY VIEWED */}
        {recentDocs.length > 0 && !search && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4 text-slate-400" />
              <h2 className="text-xs font-black text-slate-700 uppercase tracking-widest">Vừa mở gần đây</h2>
            </div>
            <div className="flex flex-col gap-2.5">
              {recentDocs.map(doc => (
                <DocCard
                  key={doc.id}
                  doc={doc}
                  onView={handleView}
                  onShare={handleShare}
                  onCopy={handleCopy}
                  onTogglePin={handleTogglePin}
                  isPinned={pinnedIds.includes(doc.id)}
                />
              ))}
            </div>
          </div>
        )}

        {/* FULL LIST */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-black text-slate-700 uppercase tracking-widest">
              {search ? `Kết quả (${filtered.length})` : 'Tất cả tài liệu'}
            </h2>
            <span className="text-[10px] font-semibold text-slate-400">{filtered.length} tài liệu</span>
          </div>

          {filtered.length === 0 ? (
            <div className="bg-white rounded-[24px] p-8 flex flex-col items-center text-center border border-slate-100">
              <FileText className="w-10 h-10 text-slate-200 mb-3" />
              <p className="font-bold text-slate-600 text-sm">Không tìm thấy tài liệu</p>
              <p className="text-slate-400 text-xs mt-1">Thử thay đổi bộ lọc hoặc từ khoá tìm kiếm</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {filtered.map(doc => (
                <DocCard
                  key={doc.id}
                  doc={doc}
                  onView={handleView}
                  onShare={handleShare}
                  onCopy={handleCopy}
                  onTogglePin={handleTogglePin}
                  isPinned={pinnedIds.includes(doc.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* No ViewerModal needed — Browser.open() handles it natively */}
    </div>
  );
}
