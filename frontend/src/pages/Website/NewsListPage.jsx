import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Search, Calendar, User, Eye, ArrowRight, Loader2, ChevronRight
} from 'lucide-react';
import { WebsiteHeader, WebsiteFooter } from './SharedComponents';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const MOCK_NEWS = [
  {
    id: 'mock-1', title: 'Thị trường BĐS sơ cấp Q1/2026: Tín hiệu tích cực từ phân khúc nghỉ dưỡng',
    excerpt: 'Phân khúc nghỉ dưỡng cao cấp ghi nhận lượng giao dịch tăng 35% so với cùng kỳ năm trước, đặc biệt tại các thị trường Đà Nẵng, Phú Quốc và Quy Nhơn.',
    category: 'market', is_featured: true, views: 2840,
    image: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=80',
    published_at: '2026-04-15T08:00:00Z', author: 'ProHouze Research',
  },
  {
    id: 'mock-2', title: 'NOBU Residences Danang: Dự án nghỉ dưỡng đẳng cấp quốc tế giữa lòng Đà Nẵng',
    excerpt: 'Nobu Residences Danang mang đến chuẩn sống 5 sao với thương hiệu NOBU nổi tiếng toàn cầu, cam kết thuê 6%/năm trong 2 năm đầu.',
    category: 'project', is_featured: true, views: 5120,
    image: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&q=80',
    published_at: '2026-04-12T08:00:00Z', author: 'ProHouze',
  },
  {
    id: 'mock-3', title: '5 điểm cần kiểm tra pháp lý trước khi ký hợp đồng mua BĐS sơ cấp',
    excerpt: 'Mua bất động sản sơ cấp từ chủ đầu tư có nhiều ưu điểm nhưng cũng tiềm ẩn rủi ro nếu không kiểm tra kỹ hồ sơ pháp lý dự án.',
    category: 'tips', is_featured: false, views: 3210,
    image: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800&q=80',
    published_at: '2026-04-10T08:00:00Z', author: 'Phòng Pháp lý ProHouze',
  },
  {
    id: 'mock-4', title: 'Sun Symphony Residence: Bản giao hưởng hoàn hảo giữa thiên nhiên và kiến trúc',
    excerpt: 'Sun Symphony Residence tọa lạc tại vị trí vàng Đà Nẵng, nơi hội tụ tinh hoa kiến trúc châu Âu và thiên nhiên nhiệt đới.',
    category: 'project', is_featured: false, views: 1870,
    image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80',
    published_at: '2026-04-08T08:00:00Z', author: 'ProHouze',
  },
  {
    id: 'mock-5', title: 'Hoa hồng môi giới BĐS 2026: Cơ hội thu nhập 100 triệu/tháng cho nhân viên kinh doanh giỏi',
    excerpt: 'Với mô hình phân phối sơ cấp, chuyên viên kinh doanh ProHouze có thể nhận hoa hồng từ 2.5–4% giá trị giao dịch mỗi hợp đồng.',
    category: 'company', is_featured: false, views: 4650,
    image: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&q=80',
    published_at: '2026-04-05T08:00:00Z', author: 'HR ProHouze',
  },
  {
    id: 'mock-6', title: 'Đầu tư BĐS nghỉ dưỡng: Lợi suất 6–8%/năm có thực tế không?',
    excerpt: 'Phân tích chi tiết các mô hình cam kết lợi suất từ chủ đầu tư, những rủi ro tiềm ẩn và tiêu chí chọn dự án đáng tin cậy.',
    category: 'tips', is_featured: false, views: 2990,
    image: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&q=80',
    published_at: '2026-04-01T08:00:00Z', author: 'ProHouze Research',
  },
];


const CATEGORIES = [
  { value: 'all', label: 'Tất cả' },
  { value: 'market', label: 'Thị trường', color: 'bg-blue-500' },
  { value: 'project', label: 'Dự án', color: 'bg-green-500' },
  { value: 'company', label: 'Tin công ty', color: 'bg-purple-500' },
  { value: 'tips', label: 'Hướng dẫn', color: 'bg-orange-500' },
];

export default function NewsListPage() {

  const navigate = useNavigate();
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [featuredNews, setFeaturedNews] = useState([]);

  useEffect(() => {
    fetchNews();
  }, []);

  const fetchNews = async () => {
    try {
      const res = await fetch(`${API_URL}/api/website/news`, { signal: AbortSignal.timeout(5000) });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setNews(data);
          setFeaturedNews(data.filter(n => n.is_featured).slice(0, 2));
          return;
        }
      }
    } catch (_) { /* fall through to mock */ }
    // Fallback: dùng mock data khi backend không phản hồi
    setNews(MOCK_NEWS);
    setFeaturedNews(MOCK_NEWS.filter(n => n.is_featured).slice(0, 2));
    setLoading(false);
  };


  const filteredNews = news.filter(n => {
    const matchSearch = n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                       n.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCategory = selectedCategory === 'all' || n.category === selectedCategory;
    return matchSearch && matchCategory;
  });

  const getCategoryInfo = (cat) => CATEGORIES.find(c => c.value === cat) || { label: cat, color: 'bg-gray-500' };

  return (
    <div className="min-h-screen bg-slate-50" data-testid="news-list-page">
      <WebsiteHeader />
      
      {/* Hero */}
      <section className="relative py-16 bg-[#316585]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Tin tức & Cập nhật
          </h1>
          <p className="text-white/80 max-w-2xl mx-auto">
            Cập nhật những tin tức mới nhất về thị trường bất động sản, dự án và kinh nghiệm đầu tư
          </p>
        </div>
      </section>

      {/* Featured News */}
      {featuredNews.length > 0 && (
        <section className="py-8 -mt-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 gap-6">
              {featuredNews.map((item) => (
                <Card 
                  key={item.id}
                  className="overflow-hidden group cursor-pointer"
                  onClick={() => navigate(`/news/${item.id}`)}
                >
                  <div className="relative h-64">
                    <img 
                      src={item.image} 
                      alt={item.title}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-6">
                      <Badge className={`${getCategoryInfo(item.category).color} border-0 mb-3`}>
                        {getCategoryInfo(item.category).label}
                      </Badge>
                      <h3 className="text-xl font-bold text-white mb-2 group-hover:text-[#4a9fc5] transition-colors">
                        {item.title}
                      </h3>
                      <div className="flex items-center gap-4 text-white/60 text-sm">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(item.published_at).toLocaleDateString('vi-VN')}
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye className="w-4 h-4" />
                          {(item.views || 0).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Filters & News List */}
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Filters */}
          <div className="flex flex-wrap gap-4 mb-8">
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Tìm kiếm bài viết..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {CATEGORIES.map(cat => (
                <Button
                  key={cat.value}
                  variant={selectedCategory === cat.value ? 'default' : 'outline'}
                  onClick={() => setSelectedCategory(cat.value)}
                  className={selectedCategory === cat.value ? 'bg-[#316585] hover:bg-[#264a5e]' : ''}
                  size="sm"
                >
                  {cat.label}
                </Button>
              ))}
            </div>
          </div>

          {/* News Grid */}
          {loading ? (
            <div className="text-center py-12">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#316585]" />
            </div>
          ) : filteredNews.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-500">Không tìm thấy bài viết</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredNews.map((item) => (
                <Card 
                  key={item.id}
                  className="overflow-hidden group cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => navigate(`/news/${item.id}`)}
                  data-testid={`news-card-${item.id}`}
                >
                  <div className="relative h-48">
                    <img 
                      src={item.image} 
                      alt={item.title}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <Badge className={`absolute top-4 left-4 ${getCategoryInfo(item.category).color} border-0`}>
                      {getCategoryInfo(item.category).label}
                    </Badge>
                  </div>
                  <CardContent className="p-5">
                    <h3 className="font-bold text-slate-900 mb-2 line-clamp-2 group-hover:text-[#316585] transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-sm text-slate-600 line-clamp-2 mb-4">
                      {item.excerpt}
                    </p>
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(item.published_at).toLocaleDateString('vi-VN')}
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {(item.views || 0).toLocaleString()}
                        </span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-[#316585] group-hover:translate-x-1 transition-transform" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">
            Đăng ký nhận tin mới
          </h2>
          <p className="text-slate-600 mb-6">
            Cập nhật tin tức thị trường và cơ hội đầu tư hàng tuần
          </p>
          <div className="flex gap-3 max-w-md mx-auto">
            <Input placeholder="Email của bạn" type="email" className="flex-1" />
            <Button className="bg-[#316585] hover:bg-[#264a5e]">
              Đăng ký
            </Button>
          </div>
        </div>
      </section>

      <WebsiteFooter />
    </div>
  );
}
