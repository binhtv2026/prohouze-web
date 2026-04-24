import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Calendar,
  User,
  Search,
  Eye,
  ArrowRight,
} from 'lucide-react';
import { WebsiteHeader, WebsiteFooter } from './SharedComponents';

export default function NewsPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const categories = [
    { id: 'all', name: 'Tất cả' },
    { id: 'market', name: 'Thị trường' },
    { id: 'project', name: 'Dự án' },
    { id: 'tips', name: 'Kiến thức' },
    { id: 'legal', name: 'Pháp lý' },
    { id: 'company', name: 'Công ty' },
  ];

  const news = [
    {
      id: 1,
      title: 'Thị trường BĐS TP.HCM năm 2026: Dự báo tăng trưởng 15%',
      excerpt: 'Theo các chuyên gia, thị trường bất động sản TP.HCM sẽ có sự phục hồi mạnh mẽ trong năm 2026 với mức tăng trưởng dự kiến 15%...',
      category: 'market',
      image: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800',
      author: 'Admin',
      date: '10/12/2025',
      views: 1250,
      featured: true,
    },
    {
      id: 2,
      title: 'Vinhomes Grand Park mở bán giai đoạn 3 với ưu đãi hấp dẫn',
      excerpt: 'Vinhomes Grand Park chính thức mở bán giai đoạn 3 với các chính sách ưu đãi thanh toán linh hoạt...',
      category: 'project',
      image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800',
      author: 'Nguyễn Văn A',
      date: '09/12/2025',
      views: 850,
      featured: true,
    },
    {
      id: 3,
      title: '5 điều cần biết trước khi mua căn hộ lần đầu',
      excerpt: 'Mua nhà là quyết định lớn đòi hỏi sự chuẩn bị kỹ lưỡng. Đây là 5 điều quan trọng bạn cần biết...',
      category: 'tips',
      image: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
      author: 'Trần Thị B',
      date: '08/12/2025',
      views: 2100,
      featured: false,
    },
    {
      id: 4,
      title: 'Luật Đất đai 2024: Những điểm mới quan trọng',
      excerpt: 'Luật Đất đai 2024 có hiệu lực từ 01/01/2025 với nhiều điểm mới về quyền sử dụng đất...',
      category: 'legal',
      image: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800',
      author: 'Lê Văn C',
      date: '07/12/2025',
      views: 1800,
      featured: false,
    },
    {
      id: 5,
      title: 'ProHouze đạt giải BĐS tốt nhất Đông Nam Á 2025',
      excerpt: 'ProHouze vinh dự được xếp hạng Công ty phân phối BĐS tốt nhất Đông Nam Á năm 2025...',
      category: 'company',
      image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800',
      author: 'Admin',
      date: '05/12/2025',
      views: 950,
      featured: false,
    },
    {
      id: 6,
      title: 'The Global City: Cơ hội đầu tư sinh lời hấp dẫn',
      excerpt: 'Với vị trí đắc địa và tiện ích đẳng cấp, The Global City được đánh giá là dự án có tiềm năng sinh lời cao...',
      category: 'project',
      image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800',
      author: 'Phạm Thị D',
      date: '04/12/2025',
      views: 720,
      featured: false,
    },
  ];

  const filteredNews = news.filter(item => {
    const matchSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCategory = categoryFilter === 'all' || item.category === categoryFilter;
    return matchSearch && matchCategory;
  });

  const featuredNews = news.filter(n => n.featured);

  return (
    <div className="min-h-screen bg-slate-50" data-testid="news-page">
      <WebsiteHeader />
      
      {/* Hero */}
      <section className="relative h-[40vh] flex items-center bg-[#316585]">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{ backgroundImage: `url('https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=1920')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#316585]/50 to-[#316585]" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-16">
          <span className="inline-block text-white/70 text-sm font-semibold uppercase tracking-wider mb-4">Tin tức</span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
            TIN TỨC & CẬP NHẬT
          </h1>
          <p className="text-base lg:text-lg text-white/80 max-w-2xl mx-auto">
            Thông tin mới nhất về thị trường bất động sản và hoạt động của ProHouze
          </p>
        </div>
      </section>

      {/* Featured News */}
      <section className="py-10 lg:py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl lg:text-2xl font-bold text-slate-900 mb-6">Tin nổi bật</h2>
          <div className="grid md:grid-cols-2 gap-5 lg:gap-6">
            {featuredNews.map((item) => (
              <Card 
                key={item.id} 
                data-testid={`featured-news-${item.id}`}
                className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group border-0 shadow-sm"
              >
                <div className="flex flex-col md:flex-row">
                  <div className="md:w-2/5 h-48 md:h-auto overflow-hidden">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <CardContent className="flex-1 p-5 lg:p-6">
                    <Badge className="mb-3 bg-[#316585] text-xs">
                      {categories.find(c => c.id === item.category)?.name}
                    </Badge>
                    <h3 className="text-base lg:text-lg font-bold text-slate-900 mb-2 group-hover:text-[#316585] transition-colors line-clamp-2">
                      {item.title}
                    </h3>
                    <p className="text-slate-600 text-xs lg:text-sm mb-4 line-clamp-2">{item.excerpt}</p>
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" /> {item.date}
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3" /> {item.views}
                      </span>
                    </div>
                  </CardContent>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* All News */}
      <section className="py-10 lg:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Filters */}
          <div className="flex flex-wrap gap-3 lg:gap-4 mb-6 lg:mb-8">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Tìm kiếm bài viết..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="news-search"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {categories.map(cat => (
                <Button
                  key={cat.id}
                  variant={categoryFilter === cat.id ? 'default' : 'outline'}
                  onClick={() => setCategoryFilter(cat.id)}
                  className={categoryFilter === cat.id ? 'bg-[#316585] hover:bg-[#264a5e]' : ''}
                  size="sm"
                  data-testid={`cat-filter-${cat.id}`}
                >
                  {cat.name}
                </Button>
              ))}
            </div>
          </div>

          {/* News Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
            {filteredNews.map((item) => (
              <Card 
                key={item.id} 
                data-testid={`news-card-${item.id}`}
                className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group border-0 shadow-sm"
              >
                <div className="h-44 lg:h-48 overflow-hidden">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <CardContent className="p-4 lg:p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant="outline" className="text-xs">
                      {categories.find(c => c.id === item.category)?.name}
                    </Badge>
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm lg:text-base mb-2 group-hover:text-[#316585] transition-colors line-clamp-2">
                    {item.title}
                  </h3>
                  <p className="text-slate-600 text-xs lg:text-sm mb-4 line-clamp-2">{item.excerpt}</p>
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" /> {item.author}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> {item.date}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Load More */}
          <div className="text-center mt-10">
            <Button variant="outline" size="lg" data-testid="load-more-btn">
              Xem thêm bài viết
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      <WebsiteFooter />
    </div>
  );
}
