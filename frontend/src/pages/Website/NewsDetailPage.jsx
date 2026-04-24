import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, Calendar, User, Eye, Clock, Share2, 
  Link as LinkIcon, Loader2
} from 'lucide-react';
import { FaFacebook, FaTwitter, FaLinkedin } from 'react-icons/fa';
import { WebsiteHeader, WebsiteFooter } from './SharedComponents';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const CATEGORIES = {
  'market': { label: 'Thị trường', color: 'bg-blue-500' },
  'project': { label: 'Dự án', color: 'bg-green-500' },
  'company': { label: 'Tin công ty', color: 'bg-purple-500' },
  'tips': { label: 'Hướng dẫn', color: 'bg-orange-500' },
};

const getSampleArticle = (id) => ({
  id: id || 'sample-news-1',
  title: 'Thị trường căn hộ TP.HCM đang bước vào chu kỳ chọn lọc mạnh hơn',
  excerpt: 'Người mua ở thực đang ưu tiên dự án có pháp lý rõ, tiến độ tốt và chính sách thanh toán linh hoạt.',
  category: 'market',
  author: 'Ban biên tập ProHouze',
  published_at: '2026-03-24T08:00:00',
  views: 1284,
  image: 'https://images.unsplash.com/photo-1460317442991-0ec209397118?w=1600',
  content: `
    <p>Thị trường đang ghi nhận xu hướng dịch chuyển rõ rệt sang những dự án có pháp lý minh bạch và khả năng khai thác thật.</p>
    <p>Đối với đội ngũ kinh doanh, đây là thời điểm cần ưu tiên truyền tải rõ chính sách bán hàng, tiến độ pháp lý và năng lực chủ đầu tư.</p>
    <h3>Điểm cần chú ý</h3>
    <ul>
      <li>Khách hàng quan tâm nhiều hơn tới tiến độ thực tế.</li>
      <li>Các sản phẩm có chính sách thanh toán linh hoạt đang hấp thụ tốt.</li>
      <li>Nội dung truyền thông cần sát với nhu cầu ở thực và đầu tư dài hạn.</li>
    </ul>
  `,
});

const SAMPLE_RELATED_NEWS = [
  {
    id: 'related-1',
    title: '3 nhóm chính sách bán hàng giúp tăng tốc chốt booking',
    published_at: '2026-03-21T09:00:00',
    image: 'https://images.unsplash.com/photo-1494526585095-c41746248156?w=400',
  },
  {
    id: 'related-2',
    title: 'Pháp lý dự án: điều gì khiến khách hàng xuống tiền nhanh hơn',
    published_at: '2026-03-20T14:00:00',
    image: 'https://images.unsplash.com/photo-1430285561322-7808604715df?w=400',
  },
  {
    id: 'related-3',
    title: 'Cách sale dùng nội dung dự án để trả lời khách trong 3 phút',
    published_at: '2026-03-18T10:00:00',
    image: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=400',
  },
];

export default function NewsDetailPage() {
  const { newsId } = useParams();
  const navigate = useNavigate();
  const [article, setArticle] = useState(null);
  const [relatedNews, setRelatedNews] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchArticle = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/website/news/${newsId}`);
      if (res.ok) {
        const data = await res.json();
        setArticle(data);
      } else {
        setArticle(getSampleArticle(newsId));
      }
    } catch (err) {
      console.error('Failed to fetch article:', err);
      setArticle(getSampleArticle(newsId));
    } finally {
      setLoading(false);
    }
  }, [newsId]);

  const fetchRelatedNews = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/website/news?limit=4`);
      if (res.ok) {
        const data = await res.json();
        const items = Array.isArray(data) && data.length > 0
          ? data.filter(n => n.id !== newsId).slice(0, 3)
          : SAMPLE_RELATED_NEWS;
        setRelatedNews(items);
      } else {
        setRelatedNews(SAMPLE_RELATED_NEWS);
      }
    } catch (err) {
      console.error('Failed to fetch related news:', err);
      setRelatedNews(SAMPLE_RELATED_NEWS);
    }
  }, [newsId]);

  useEffect(() => {
    fetchArticle();
    fetchRelatedNews();
  }, [fetchArticle, fetchRelatedNews]);

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Đã copy link');
  };

  const shareOnFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`, '_blank');
  };

  const shareOnTwitter = () => {
    window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(article?.title)}`, '_blank');
  };

  const shareOnLinkedIn = () => {
    window.open(`https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(window.location.href)}&title=${encodeURIComponent(article?.title)}`, '_blank');
  };

  const getCategoryInfo = (cat) => CATEGORIES[cat] || { label: cat, color: 'bg-gray-500' };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#316585]" />
      </div>
    );
  }

  if (!article) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50" data-testid="news-detail-page">
      <WebsiteHeader />
      
      {/* Hero Image */}
      <section className="relative h-[40vh] md:h-[50vh] bg-slate-900">
        {article.image && (
          <img 
            src={article.image} 
            alt={article.title}
            className="absolute inset-0 w-full h-full object-cover opacity-50"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/50 to-transparent" />
        
        <div className="relative h-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-end pb-12">
          <Button 
            variant="ghost" 
            className="text-white/70 hover:text-white w-fit mb-6"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Quay lại
          </Button>
          
          <Badge className={`w-fit ${getCategoryInfo(article.category).color} border-0 mb-4`}>
            {getCategoryInfo(article.category).label}
          </Badge>
          
          <h1 className="text-2xl md:text-4xl font-bold text-white mb-4">
            {article.title}
          </h1>
          
          <div className="flex flex-wrap items-center gap-4 text-white/60 text-sm">
            <span className="flex items-center gap-1">
              <User className="w-4 h-4" />
              {article.author || 'Admin'}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {new Date(article.published_at).toLocaleDateString('vi-VN')}
            </span>
            <span className="flex items-center gap-1">
              <Eye className="w-4 h-4" />
              {(article.views || 0).toLocaleString()} lượt xem
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {Math.ceil((article.content?.length || 1000) / 1000)} phút đọc
            </span>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-[1fr_300px] gap-8">
            {/* Article Content */}
            <article className="bg-white rounded-2xl shadow-sm p-6 md:p-10">
              {/* Excerpt */}
              <p className="text-lg text-slate-600 font-medium mb-8 border-l-4 border-[#316585] pl-4">
                {article.excerpt}
              </p>
              
              {/* Main Content */}
              <div 
                className="prose prose-slate max-w-none prose-headings:text-slate-900 prose-p:text-slate-600 prose-a:text-[#316585] prose-strong:text-slate-900"
                dangerouslySetInnerHTML={{ __html: article.content }}
              />

              {/* Share */}
              <div className="mt-10 pt-8 border-t">
                <p className="text-sm font-medium text-slate-500 mb-4">Chia sẻ bài viết</p>
                <div className="flex gap-2">
                  <Button variant="outline" size="icon" onClick={shareOnFacebook}>
                    <FaFacebook className="w-4 h-4 text-blue-600" />
                  </Button>
                  <Button variant="outline" size="icon" onClick={shareOnTwitter}>
                    <FaTwitter className="w-4 h-4 text-sky-500" />
                  </Button>
                  <Button variant="outline" size="icon" onClick={shareOnLinkedIn}>
                    <FaLinkedin className="w-4 h-4 text-blue-700" />
                  </Button>
                  <Button variant="outline" size="icon" onClick={copyLink}>
                    <LinkIcon className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </article>

            {/* Sidebar */}
            <aside className="space-y-6">
              {/* Related News */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-bold text-slate-900 mb-4">Bài viết liên quan</h3>
                  <div className="space-y-4">
                    {relatedNews.map((news) => (
                      <Link 
                        key={news.id}
                        to={`/news/${news.id}`}
                        className="flex gap-3 group"
                      >
                        {news.image && (
                          <img 
                            src={news.image} 
                            alt={news.title}
                            className="w-20 h-14 object-cover rounded flex-shrink-0"
                          />
                        )}
                        <div>
                          <h4 className="text-sm font-medium text-slate-900 line-clamp-2 group-hover:text-[#316585] transition-colors">
                            {news.title}
                          </h4>
                          <p className="text-xs text-slate-500 mt-1">
                            {new Date(news.published_at).toLocaleDateString('vi-VN')}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* CTA */}
              <Card className="bg-[#316585]">
                <CardContent className="p-6 text-center">
                  <h3 className="font-bold text-white mb-2">Cần tư vấn?</h3>
                  <p className="text-white/80 text-sm mb-4">Liên hệ ngay để được tư vấn miễn phí</p>
                  <Button className="w-full bg-white text-[#316585] hover:bg-slate-100">
                    Liên hệ ngay
                  </Button>
                </CardContent>
              </Card>
            </aside>
          </div>
        </div>
      </section>

      <WebsiteFooter />
    </div>
  );
}
