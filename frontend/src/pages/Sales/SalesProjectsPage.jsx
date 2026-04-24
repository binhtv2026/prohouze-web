/**
 * SalesProjectsPage — Danh sách dự án cho nhân viên bán hàng
 *
 * LUỒNG SỬ DỤNG TRÊN iPad:
 *   1. Nhân viên đăng nhập → vào Sales → Dự án
 *   2. Click vào dự án muốn tư vấn
 *   3. Mở PresentationMode: trang thông tin dự án đẹp fullscreen
 *   4. Đưa iPad cho khách xem / scroll thoải mái
 *   5. Click ← Thoát để về lại app khi xong
 */
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  ArrowLeft,
  Building2,
  ExternalLink,
  Maximize2,
  MapPin,
  Minimize2,
  Search,
  Star,
  Tag,
  Clock,
} from 'lucide-react';

// ─── DANH SÁCH DỰ ÁN (map slug → trang public đã có sẵn) ─────────────────────
const PROJECTS = [
  {
    id: 'nobu-residences-danang',
    name: 'Nobu Residences Danang',
    slug: 'nobu-danang',
    developer: 'VCRE & Phoenix Holdings',
    location: 'Sơn Trà, Đà Nẵng',
    priceFrom: 'Từ 3.8 triệu/đêm (Giá thuê)',
    status: 'hot',
    area: '36–280 m²',
    handover: '2027',
    tags: ['Nghỉ dưỡng hạng sang', 'Brand Nobu', 'ROI 6%'],
    commission: 'Hấp dẫn',
    highlight: 'Hỗ trợ AI tư vấn đầy đủ',
  },
  {
    id: 'sun-symphony-residence',
    name: 'Sun Symphony Residence',
    slug: 'sun-symphony',
    developer: 'Sun Group',
    location: 'Sơn Trà, Đà Nẵng',
    priceFrom: 'Liên hệ',
    status: 'hot',
    area: '35–150 m²',
    handover: '2026',
    tags: ['Sở hữu lâu dài', 'View sông Hàn', 'Chiết khấu khủng'],
    commission: 'Tùy chính sách',
    highlight: 'Chiết khấu lên tới 9.5% khi TT sớm',
  },
];

const STATUS_CONFIG = {
  hot:      { label: '🔥 Đang đẩy mạnh', bg: 'bg-red-100',    text: 'text-red-700',    border: 'border-red-200' },
  open:     { label: '✅ Đang mở bán',   bg: 'bg-green-100',  text: 'text-green-700',  border: 'border-green-200' },
  upcoming: { label: '🕐 Sắp mở bán',   bg: 'bg-amber-100',  text: 'text-amber-700',  border: 'border-amber-200' },
};

// ─── PRESENTATION MODE — fullscreen iframe + overlay controls ─────────────────
function PresentationMode({ project, onClose }) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  // Dùng trang public đã build sẵn
  const url = `https://prohouzing.com/projects/${project.slug}`;

  return (
    <div
      className={`fixed inset-0 z-50 bg-white flex flex-col ${isFullscreen ? '' : 'pt-0'}`}
      data-testid="presentation-mode"
    >
      {/* Top bar — nhỏ gọn để không che nội dung */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#316585] text-white flex-shrink-0 shadow-md">
        <button
          onClick={onClose}
          className="flex items-center gap-2 text-sm font-medium hover:text-white/80 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          ← Thoát tư vấn
        </button>

        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold hidden sm:block">{project.name}</span>
          <Badge className="bg-white/20 text-white border-0 text-xs">{project.commission}</Badge>
        </div>

        <div className="flex items-center gap-2">
          {/* Nút mở thật trên tab mới nếu cần */}
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 text-xs text-white/80 hover:text-white border border-white/30 rounded px-2 py-1"
          >
            <ExternalLink className="w-3 h-3" /> Mở tab mới
          </a>
          <button
            onClick={() => setIsFullscreen(f => !f)}
            className="text-white/80 hover:text-white p-1 rounded"
            title="Toàn màn hình"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Sales note bar — nhắc nhanh cho nhân viên */}
      {project.highlight && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-1.5 flex items-center gap-2 text-xs text-amber-800 flex-shrink-0">
          <Star className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
          <span className="font-medium">Nhắc bán hàng:</span>
          <span>{project.highlight}</span>
        </div>
      )}

      {/* iframe trang thông tin dự án public */}
      <div className="flex-1 overflow-hidden">
        <iframe
          src={url}
          title={`Thông tin dự án ${project.name}`}
          className="w-full h-full border-0"
          allow="fullscreen; autoplay"
          loading="eager"
        />
      </div>
    </div>
  );
}

// ─── PROJECT CARD ─────────────────────────────────────────────────────────────
function ProjectCard({ project, onPresent }) {
  const st = STATUS_CONFIG[project.status];

  return (
    <div
      className="rounded-2xl border border-slate-200 bg-white overflow-hidden hover:shadow-lg transition-all hover:-translate-y-0.5 flex flex-col"
      data-testid={`project-card-${project.id}`}
    >
      {/* Ảnh placeholder gradient */}
      <div className="h-44 bg-gradient-to-br from-slate-700 via-slate-600 to-[#316585] flex items-end p-4 relative overflow-hidden">
        {/* Overlay decorative */}
        <div className="absolute inset-0 opacity-20"
          style={{ backgroundImage: 'radial-gradient(circle at 30% 40%, #fff 0%, transparent 60%)' }} />
        <div className="relative z-10">
          <div className="flex gap-2 flex-wrap mb-2">
            <Badge className={`${st.bg} ${st.text} border ${st.border} text-xs`}>{st.label}</Badge>
          </div>
          <p className="text-white font-bold text-lg leading-tight drop-shadow">{project.name}</p>
          <p className="text-white/80 text-xs mt-0.5">{project.developer}</p>
        </div>
      </div>

      <div className="p-4 flex flex-col flex-1">
        {/* Location */}
        <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-3">
          <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
          {project.location}
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          {[
            { label: 'Giá từ', value: project.priceFrom },
            { label: 'Diện tích', value: project.area },
            { label: 'Bàn giao', value: project.handover },
          ].map(({ label, value }) => (
            <div key={label} className="bg-slate-50 rounded-xl p-2 text-center">
              <div className="text-[10px] text-slate-400">{label}</div>
              <div className="text-xs font-bold text-slate-800 mt-0.5">{value}</div>
            </div>
          ))}
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1 mb-3">
          {project.tags.map(t => (
            <span key={t} className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-100">
              {t}
            </span>
          ))}
        </div>

        {/* Commission highlight */}
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-2 mb-3">
          <div className="flex items-center gap-1.5 text-xs">
            <Tag className="w-3.5 h-3.5 text-emerald-600" />
            <span className="font-semibold text-emerald-700">HH {project.commission}</span>
          </div>
          {project.highlight && (
            <p className="text-xs text-emerald-600 mt-0.5">{project.highlight}</p>
          )}
        </div>

        {/* CTA */}
        <div className="mt-auto">
          <Button
            onClick={() => onPresent(project)}
            className="w-full bg-[#316585] hover:bg-[#264f68] text-white gap-2 font-semibold"
            data-testid={`present-btn-${project.id}`}
          >
            <Maximize2 className="w-4 h-4" />
            Mở tư vấn khách — iPad
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function SalesProjectsPage() {
  const [presentProject, setPresentProject] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filtered = PROJECTS.filter(p => {
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.location.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  if (presentProject) {
    return <PresentationMode project={presentProject} onClose={() => setPresentProject(null)} />;
  }

  return (
    <div className="space-y-5" data-testid="sales-projects-page">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-[#316585]" />
            Dự án đang bán
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Click vào dự án → mở màn hình tư vấn khách trên iPad
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs bg-amber-50 border border-amber-200 text-amber-800 px-3 py-2 rounded-xl">
          <Clock className="w-4 h-4 flex-shrink-0" />
          <span>Cập nhật hàng ngày · {new Date().toLocaleDateString('vi-VN')}</span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Tìm dự án..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          {[
            { key: 'all', label: 'Tất cả' },
            { key: 'hot', label: '🔥 Đang đẩy' },
            { key: 'open', label: '✅ Mở bán' },
          ].map(f => (
            <Button
              key={f.key}
              size="sm"
              variant={statusFilter === f.key ? 'default' : 'outline'}
              className={statusFilter === f.key ? 'bg-[#316585] hover:bg-[#264f68]' : ''}
              onClick={() => setStatusFilter(f.key)}
            >
              {f.label}
            </Button>
          ))}
        </div>
      </div>

      {/* How to use hint */}
      <div className="rounded-2xl bg-[#316585]/5 border border-[#316585]/20 p-4 flex gap-3">
        <div className="w-8 h-8 rounded-full bg-[#316585]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
          <Maximize2 className="w-4 h-4 text-[#316585]" />
        </div>
        <div>
          <p className="text-sm font-semibold text-[#316585]">Cách dùng khi tư vấn khách trên iPad</p>
          <p className="text-xs text-slate-600 mt-0.5">
            Click <strong>"Mở tư vấn khách"</strong> → trang thông tin dự án đầy đủ mở toàn màn hình → đưa iPad cho khách xem.
            Có ảnh, bảng giá, 360°, pháp lý, tiến độ đầy đủ.
          </p>
        </div>
      </div>

      {/* Project Grid — 2 cột trên iPad, 3 cột trên desktop */}
      <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
        {filtered.map(project => (
          <ProjectCard
            key={project.id}
            project={project}
            onPresent={setPresentProject}
          />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="py-16 text-center text-slate-400">
          <Building2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Không tìm thấy dự án phù hợp</p>
        </div>
      )}
    </div>
  );
}
