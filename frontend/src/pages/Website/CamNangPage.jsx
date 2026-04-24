import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Search, BookOpen, ShieldCheck, TrendingUp, Home, FileText,
  ChevronRight, Clock, Eye, Star, ArrowRight
} from 'lucide-react';
import { WebsiteHeader, WebsiteFooter } from './SharedComponents';

// ─── Dữ liệu cẩm nang ────────────────────────────────────────────────────────
const CATEGORIES = [
  { value: 'all',      label: 'Tất cả',         icon: BookOpen,    color: '#316585' },
  { value: 'buying',   label: 'Hướng dẫn mua',  icon: Home,        color: '#10b981' },
  { value: 'legal',    label: 'Pháp lý',         icon: ShieldCheck, color: '#f59e0b' },
  { value: 'invest',   label: 'Đầu tư',          icon: TrendingUp,  color: '#8b5cf6' },
  { value: 'finance',  label: 'Tài chính',       icon: FileText,    color: '#ef4444' },
];

const GUIDES = [
  // ─ Featured ────────────────────────────────────────────────────────────────
  {
    id: 'g-01', category: 'buying', featured: true, readMin: 8,
    title: 'Quy trình mua BĐS sơ cấp từ A–Z: 6 bước không thể bỏ qua',
    excerpt: 'Từ bước tìm hiểu dự án, kiểm tra pháp lý, đặt cọc cho đến bàn giao sổ hồng — hướng dẫn chi tiết giúp người mua lần đầu tránh sai lầm tốn kém.',
    image: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=900&q=80',
    views: 12400, rating: 4.9,
    tags: ['Mua lần đầu', '6 bước', 'Sơ cấp'],
  },
  {
    id: 'g-02', category: 'legal', featured: true, readMin: 10,
    title: '10 điều cần kiểm tra pháp lý trước khi ký hợp đồng mua BĐS',
    excerpt: 'Pháp lý dự án sạch là yếu tố tiên quyết. Cẩm nang này liệt kê đầy đủ 10 hạng mục cần kiểm tra để bảo vệ quyền lợi người mua nhà.',
    image: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=900&q=80',
    views: 9800, rating: 4.8,
    tags: ['Pháp lý', 'Hợp đồng', 'An toàn'],
  },
  // ─ Normal ──────────────────────────────────────────────────────────────────
  {
    id: 'g-03', category: 'finance', featured: false, readMin: 6,
    title: 'Vay ngân hàng mua nhà: Điều kiện, hồ sơ và lãi suất 2026',
    excerpt: 'Hướng dẫn cách tính khả năng vay, so sánh lãi suất các ngân hàng, chuẩn bị hồ sơ vay và tối ưu kế hoạch trả nợ.',
    image: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=700&q=80',
    views: 7200, rating: 4.7,
    tags: ['Vay vốn', 'Ngân hàng', '2026'],
  },
  {
    id: 'g-04', category: 'invest', featured: false, readMin: 12,
    title: 'BĐS nghỉ dưỡng: Lợi suất 6–8%/năm có thực tế không?',
    excerpt: 'Phân tích mô hình cam kết lợi suất, rủi ro tiềm ẩn, và tiêu chí chọn dự án nghỉ dưỡng đáng tin cậy để tối ưu danh mục đầu tư.',
    image: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=700&q=80',
    views: 6500, rating: 4.6,
    tags: ['Nghỉ dưỡng', 'Lợi suất', 'Rủi ro'],
  },
  {
    id: 'g-05', category: 'buying', featured: false, readMin: 5,
    title: 'Phân biệt căn hộ thông thường và căn hộ officetel: Nên chọn loại nào?',
    excerpt: 'So sánh ưu nhược điểm, pháp lý sở hữu, chi phí dịch vụ và khả năng sinh lời của hai loại hình căn hộ phổ biến nhất hiện nay.',
    image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=700&q=80',
    views: 5800, rating: 4.5,
    tags: ['Căn hộ', 'Officetel', 'So sánh'],
  },
  {
    id: 'g-06', category: 'legal', featured: false, readMin: 7,
    title: 'Sổ đỏ, sổ hồng và GCNQSDD: Phân biệt và cách tra cứu online',
    excerpt: 'Giải thích sự khác nhau giữa các loại giấy tờ sở hữu bất động sản, cách đọc thông tin và tra cứu tình trạng pháp lý trực tuyến.',
    image: 'https://images.unsplash.com/photo-1586953983027-d7508a64f4bb?w=700&q=80',
    views: 8100, rating: 4.8,
    tags: ['Sổ đỏ', 'Sổ hồng', 'Pháp lý'],
  },
  {
    id: 'g-07', category: 'invest', featured: false, readMin: 9,
    title: 'Đầu tư căn hộ cho thuê: Tính toán dòng tiền và tỷ suất sinh lời thực tế',
    excerpt: 'Công thức tính gross yield, net yield, cash-on-cash return và ví dụ thực tế với số liệu thị trường TP.HCM và Hà Nội năm 2026.',
    image: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=700&q=80',
    views: 4900, rating: 4.4,
    tags: ['Cho thuê', 'Dòng tiền', 'ROI'],
  },
  {
    id: 'g-08', category: 'finance', featured: false, readMin: 6,
    title: 'Phí và thuế khi mua bán BĐS: Đầy đủ các khoản phải nộp năm 2026',
    excerpt: 'Thuế thu nhập cá nhân, lệ phí trước bạ, phí công chứng, phí môi giới và các khoản phí ẩn cần biết trước khi giao dịch.',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=700&q=80',
    views: 6100, rating: 4.6,
    tags: ['Thuế', 'Phí', 'Giao dịch'],
  },
  {
    id: 'g-09', category: 'buying', featured: false, readMin: 7,
    title: 'Checklist bàn giao căn hộ: 50 điểm cần kiểm tra khi nhận nhà',
    excerpt: 'Danh sách kiểm tra chi tiết từ kết cấu, hệ thống điện nước, hoàn thiện nội thất đến thiết bị bàn giao — bảo vệ quyền lợi người mua.',
    image: 'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=700&q=80',
    views: 5400, rating: 4.7,
    tags: ['Bàn giao', 'Checklist', 'Nhận nhà'],
  },
];

const POPULAR_TAGS = ['Mua lần đầu', 'Pháp lý', 'Vay vốn', 'Sơ cấp', 'Nghỉ dưỡng', 'Sổ đỏ', 'Dòng tiền', 'Hợp đồng'];

// ─── Component ────────────────────────────────────────────────────────────────
export default function CamNangPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [activeCat, setActiveCat] = useState('all');
  const [activeTag, setActiveTag] = useState('');

  const featured = GUIDES.filter(g => g.featured);
  const filtered = GUIDES.filter(g => {
    const matchCat = activeCat === 'all' || g.category === activeCat;
    const matchTag = !activeTag || g.tags.includes(activeTag);
    const matchSearch = !search ||
      g.title.toLowerCase().includes(search.toLowerCase()) ||
      g.excerpt.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchTag && matchSearch;
  });

  const getCatInfo = (val) => CATEGORIES.find(c => c.value === val) || CATEGORIES[0];

  const goToDetail = (id) => navigate(`/cam-nang/${id}`);

  return (
    <div className="min-h-screen bg-slate-50" data-testid="cam-nang-page">
      <WebsiteHeader />

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="relative py-20 overflow-hidden bg-gradient-to-br from-[#1e3d4f] via-[#316585] to-[#4a8fb5]">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1497366216548-37526070297c?w=1400&q=60')", backgroundSize: 'cover' }} />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur text-white text-sm font-medium px-4 py-1.5 rounded-full mb-6">
            <BookOpen className="w-4 h-4" />
            Cẩm nang BĐS ProHouze
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white leading-tight mb-4">
            Kiến thức BĐS <span className="text-amber-300">chuyên sâu</span><br />cho người mua thông minh
          </h1>
          <p className="text-white/80 text-lg max-w-2xl mx-auto mb-8">
            Hướng dẫn thực tế về mua nhà, pháp lý, tài chính và đầu tư bất động sản — được biên soạn bởi chuyên gia ProHouze
          </p>
          {/* Search bar */}
          <div className="relative max-w-xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input
              placeholder="Tìm kiếm chủ đề: pháp lý, vay vốn, đầu tư..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-12 pr-4 py-3 h-13 text-base bg-white border-0 shadow-xl rounded-xl"
            />
          </div>
        </div>
      </section>

      {/* ── Stats bar ────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-slate-100 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap justify-center gap-8 text-sm text-slate-600">
            {[
              { label: 'Bài viết', value: `${GUIDES.length}+` },
              { label: 'Lượt đọc', value: '150K+' },
              { label: 'Chủ đề', value: `${CATEGORIES.length - 1}` },
              { label: 'Chuyên gia biên soạn', value: '12' },
            ].map(s => (
              <div key={s.label} className="flex items-center gap-2">
                <span className="font-bold text-[#316585] text-base">{s.value}</span>
                <span>{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Featured ─────────────────────────────────────────────────────── */}
      {!search && activeCat === 'all' && (
        <section className="py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                Bài viết nổi bật
              </h2>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              {featured.map(guide => {
                const cat = getCatInfo(guide.category);
                const CatIcon = cat.icon;
                return (
                  <Card
                    key={guide.id}
                    onClick={() => goToDetail(guide.id)}
                    className="overflow-hidden group cursor-pointer hover:shadow-xl transition-all duration-300 border-0 shadow-md"
                  >
                    <div className="relative h-64">
                      <img
                        src={guide.image} alt={guide.title}
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                      <div className="absolute top-4 left-4">
                        <Badge
                          className="text-white border-0 flex items-center gap-1.5"
                          style={{ backgroundColor: cat.color }}
                        >
                          <CatIcon className="w-3 h-3" />
                          {cat.label}
                        </Badge>
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 p-6">
                        <h3 className="text-xl font-bold text-white mb-2 group-hover:text-amber-300 transition-colors line-clamp-2">
                          {guide.title}
                        </h3>
                        <div className="flex items-center gap-4 text-white/70 text-sm">
                          <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{guide.readMin} phút đọc</span>
                          <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" />{guide.views.toLocaleString()}</span>
                          <span className="flex items-center gap-1"><Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />{guide.rating}</span>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ── Category Filter + Tag Filter ─────────────────────────────────── */}
      <section className="py-4 bg-white sticky top-0 z-10 border-b border-slate-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(cat => {
              const CatIcon = cat.icon;
              const active = activeCat === cat.value;
              return (
                <button
                  key={cat.value}
                  onClick={() => { setActiveCat(cat.value); setActiveTag(''); }}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                    active
                      ? 'text-white shadow-md'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                  style={active ? { backgroundColor: cat.color } : {}}
                >
                  <CatIcon className="w-4 h-4" />
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Tag cloud ────────────────────────────────────────────────────── */}
      {!search && (
        <div className="bg-slate-50 py-4 border-b border-slate-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-xs text-slate-500 font-medium mr-1">Chủ đề hot:</span>
              {POPULAR_TAGS.map(tag => (
                <button
                  key={tag}
                  onClick={() => setActiveTag(activeTag === tag ? '' : tag)}
                  className={`text-xs px-3 py-1 rounded-full border transition-all ${
                    activeTag === tag
                      ? 'bg-[#316585] text-white border-[#316585]'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-[#316585] hover:text-[#316585]'
                  }`}
                >
                  #{tag}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Guide Grid ───────────────────────────────────────────────────── */}
      <section className="py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Result header */}
          <div className="flex items-center justify-between mb-6">
            <p className="text-sm text-slate-500">
              {filtered.length} bài viết
              {activeCat !== 'all' ? ` về "${getCatInfo(activeCat).label}"` : ''}
              {activeTag ? ` #${activeTag}` : ''}
              {search ? ` khớp với "${search}"` : ''}
            </p>
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-20">
              <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">Không tìm thấy bài viết phù hợp</p>
              <Button variant="outline" className="mt-4" onClick={() => { setSearch(''); setActiveCat('all'); setActiveTag(''); }}>
                Xem tất cả
              </Button>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map(guide => {
                const cat = getCatInfo(guide.category);
                const CatIcon = cat.icon;
                return (
                  <Card
                    key={guide.id}
                    onClick={() => goToDetail(guide.id)}
                    className="overflow-hidden group cursor-pointer hover:shadow-lg transition-all duration-300 border border-slate-200 bg-white"
                    data-testid={`guide-card-${guide.id}`}
                  >
                    <div className="relative h-48">
                      <img
                        src={guide.image} alt={guide.title}
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-3 left-3">
                        <span
                          className="text-xs text-white font-medium px-2.5 py-1 rounded-full flex items-center gap-1"
                          style={{ backgroundColor: cat.color }}
                        >
                          <CatIcon className="w-3 h-3" />
                          {cat.label}
                        </span>
                      </div>
                    </div>
                    <CardContent className="p-5">
                      <h3 className="font-bold text-slate-900 mb-2 line-clamp-2 group-hover:text-[#316585] transition-colors text-base leading-snug">
                        {guide.title}
                      </h3>
                      <p className="text-sm text-slate-500 line-clamp-2 mb-4">
                        {guide.excerpt}
                      </p>
                      {/* Tags */}
                      <div className="flex flex-wrap gap-1 mb-4">
                        {guide.tags.slice(0, 2).map(tag => (
                          <span key={tag} className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full">
                            #{tag}
                          </span>
                        ))}
                      </div>
                      <div className="flex items-center justify-between text-xs text-slate-400 pt-3 border-t border-slate-100">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{guide.readMin} phút</span>
                          <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{guide.views.toLocaleString()}</span>
                          <span className="flex items-center gap-1">
                            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                            {guide.rating}
                          </span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-[#316585] group-hover:translate-x-1 transition-transform" />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ── CTA Banner ───────────────────────────────────────────────────── */}
      <section className="py-16 bg-gradient-to-r from-[#1e3d4f] to-[#316585]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
            Cần tư vấn trực tiếp từ chuyên gia?
          </h2>
          <p className="text-white/70 mb-8 max-w-xl mx-auto">
            Đội ngũ chuyên gia ProHouze sẵn sàng giải đáp mọi thắc mắc về pháp lý, tài chính và chiến lược đầu tư BĐS
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => navigate('/contact')}
              className="bg-amber-400 hover:bg-amber-500 text-slate-900 font-semibold px-8 py-3 h-auto"
            >
              Đặt lịch tư vấn miễn phí
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/du-an')}
              className="border-white text-white hover:bg-white hover:text-slate-900 px-8 py-3 h-auto"
            >
              Xem dự án đang mở bán
            </Button>
          </div>
        </div>
      </section>

      <WebsiteFooter />
    </div>
  );
}
