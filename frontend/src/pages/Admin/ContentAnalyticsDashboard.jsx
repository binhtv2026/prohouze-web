import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Eye, TrendingUp, TrendingDown, Users, Briefcase, 
  FileText, Newspaper, MessageSquare, Clock, BarChart3,
  ArrowUp, ArrowDown
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const DEMO_NEWS = [
  { id: 'news-001', title: 'Chính sách bán hàng mới nhất', views: 1850, is_published: true, published_at: new Date().toISOString() },
  { id: 'news-002', title: 'Cập nhật tiến độ dự án', views: 1260, is_published: true, published_at: new Date().toISOString() },
];
const DEMO_CAREERS = [
  { id: 'career-001', title: 'Chuyên viên kinh doanh', openings: 12, applications_count: 34, is_hot: true },
  { id: 'career-002', title: 'Nhân viên marketing', openings: 4, applications_count: 11, is_hot: false },
];
const DEMO_TESTIMONIALS = [
  { id: 'tt-001', rating: 5, is_active: true },
  { id: 'tt-002', rating: 4, is_active: true },
];
const DEMO_PARTNERS = [
  { id: 'pt-001', category: 'developer', is_active: true },
  { id: 'pt-002', category: 'bank', is_active: true },
  { id: 'pt-003', category: 'agency', is_active: false },
];

export default function ContentAnalyticsDashboard() {
  const [timeRange, setTimeRange] = useState('7d');
  const [stats, setStats] = useState({
    news: { total: 0, views: 0, published: 0, thisWeek: 0 },
    careers: { total: 0, openings: 0, applications: 0, hot: 0 },
    testimonials: { total: 0, active: 0, avgRating: 0 },
    partners: { total: 0, active: 0, developers: 0, banks: 0 },
  });
  const [topNews, setTopNews] = useState([]);
  const [topCareers, setTopCareers] = useState([]);
  const [recentApplications, setRecentApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = useCallback(async () => {
    try {
      // Fetch all content data
      const [newsRes, careersRes, testimonialsRes, partnersRes] = await Promise.all([
        fetch(`${API_URL}/api/admin/content/news`),
        fetch(`${API_URL}/api/admin/content/careers`),
        fetch(`${API_URL}/api/admin/content/testimonials`),
        fetch(`${API_URL}/api/admin/content/partners`),
      ]);

      const news = newsRes.ok ? await newsRes.json() : DEMO_NEWS;
      const careers = careersRes.ok ? await careersRes.json() : DEMO_CAREERS;
      const testimonials = testimonialsRes.ok ? await testimonialsRes.json() : DEMO_TESTIMONIALS;
      const partners = partnersRes.ok ? await partnersRes.json() : DEMO_PARTNERS;

      // Calculate stats
      const newsStats = {
        total: news.length,
        views: news.reduce((acc, n) => acc + (n.views || 0), 0),
        published: news.filter(n => n.is_published).length,
        thisWeek: news.filter(n => {
          const date = new Date(n.published_at);
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          return date >= weekAgo;
        }).length,
      };

      const careersStats = {
        total: careers.length,
        openings: careers.reduce((acc, c) => acc + (c.openings || 1), 0),
        applications: careers.reduce((acc, c) => acc + (c.applications_count || 0), 0),
        hot: careers.filter(c => c.is_hot || c.is_urgent).length,
      };

      const testimonialsStats = {
        total: testimonials.length,
        active: testimonials.filter(t => t.is_active).length,
        avgRating: testimonials.length > 0 
          ? (testimonials.reduce((acc, t) => acc + t.rating, 0) / testimonials.length).toFixed(1)
          : 0,
      };

      const partnersStats = {
        total: partners.length,
        active: partners.filter(p => p.is_active).length,
        developers: partners.filter(p => p.category === 'developer').length,
        banks: partners.filter(p => p.category === 'bank').length,
      };

      setStats({
        news: newsStats,
        careers: careersStats,
        testimonials: testimonialsStats,
        partners: partnersStats,
      });

      // Top news by views
      setTopNews(news.sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 5));

      // Top careers by applications
      setTopCareers(careers.sort((a, b) => (b.applications_count || 0) - (a.applications_count || 0)).slice(0, 5));

    } catch (err) {
      console.error('Failed to fetch analytics:', err);
      const news = DEMO_NEWS;
      const careers = DEMO_CAREERS;
      const testimonials = DEMO_TESTIMONIALS;
      const partners = DEMO_PARTNERS;
      setStats({
        news: {
          total: news.length,
          views: news.reduce((acc, n) => acc + (n.views || 0), 0),
          published: news.filter(n => n.is_published).length,
          thisWeek: news.length,
        },
        careers: {
          total: careers.length,
          openings: careers.reduce((acc, c) => acc + (c.openings || 1), 0),
          applications: careers.reduce((acc, c) => acc + (c.applications_count || 0), 0),
          hot: careers.filter(c => c.is_hot || c.is_urgent).length,
        },
        testimonials: {
          total: testimonials.length,
          active: testimonials.filter(t => t.is_active).length,
          avgRating: (testimonials.reduce((acc, t) => acc + t.rating, 0) / testimonials.length).toFixed(1),
        },
        partners: {
          total: partners.length,
          active: partners.filter(p => p.is_active).length,
          developers: partners.filter(p => p.category === 'developer').length,
          banks: partners.filter(p => p.category === 'bank').length,
        },
      });
      setTopNews(news);
      setTopCareers(careers);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const StatCard = ({ title, value, subtitle, icon: Icon, trend, trendValue, color = "blue" }) => (
    <Card>
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold mt-1">{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
          </div>
          <div className={`p-3 rounded-xl bg-${color}-100`}>
            <Icon className={`w-6 h-6 text-${color}-600`} />
          </div>
        </div>
        {trend && (
          <div className={`flex items-center gap-1 mt-3 text-sm ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
            {trend === 'up' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
            <span>{trendValue}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="p-6 space-y-6" data-testid="content-analytics-dashboard">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground">Thống kê hiệu suất nội dung website</p>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">7 ngày qua</SelectItem>
            <SelectItem value="30d">30 ngày qua</SelectItem>
            <SelectItem value="90d">90 ngày qua</SelectItem>
            <SelectItem value="all">Tất cả</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Tổng lượt xem" 
          value={stats.news.views.toLocaleString()} 
          subtitle={`${stats.news.total} bài viết`}
          icon={Eye}
          color="blue"
        />
        <StatCard 
          title="Vị trí tuyển dụng" 
          value={stats.careers.openings} 
          subtitle={`${stats.careers.total} vị trí • ${stats.careers.hot} hot`}
          icon={Briefcase}
          color="green"
        />
        <StatCard 
          title="Đơn ứng tuyển" 
          value={stats.careers.applications} 
          subtitle="Chờ xử lý"
          icon={FileText}
          color="orange"
        />
        <StatCard 
          title="Đánh giá" 
          value={`${stats.testimonials.avgRating}/5`}
          subtitle={`${stats.testimonials.total} đánh giá`}
          icon={MessageSquare}
          color="purple"
        />
      </div>

      {/* Content Stats */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Newspaper className="w-4 h-4 text-blue-500" />
              Tin tức
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tổng bài</span>
                <span className="font-medium">{stats.news.total}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Đã xuất bản</span>
                <span className="font-medium">{stats.news.published}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tuần này</span>
                <span className="font-medium text-green-600">+{stats.news.thisWeek}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-green-500" />
              Tuyển dụng
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Vị trí</span>
                <span className="font-medium">{stats.careers.total}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Số lượng cần</span>
                <span className="font-medium">{stats.careers.openings}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Hot/Urgent</span>
                <span className="font-medium text-orange-600">{stats.careers.hot}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-purple-500" />
              Testimonials
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tổng</span>
                <span className="font-medium">{stats.testimonials.total}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Đang hiển thị</span>
                <span className="font-medium">{stats.testimonials.active}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Rating TB</span>
                <span className="font-medium text-yellow-600">{stats.testimonials.avgRating}⭐</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="w-4 h-4 text-cyan-500" />
              Đối tác
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tổng</span>
                <span className="font-medium">{stats.partners.total}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Chủ đầu tư</span>
                <span className="font-medium">{stats.partners.developers}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Ngân hàng</span>
                <span className="font-medium">{stats.partners.banks}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Content */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Top News */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-500" />
              Top bài viết
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topNews.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-4">Chưa có dữ liệu</p>
            ) : (
              <div className="space-y-3">
                {topNews.map((news, i) => (
                  <div key={news.id} className="flex items-center gap-3">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      i === 0 ? 'bg-yellow-100 text-yellow-700' :
                      i === 1 ? 'bg-slate-100 text-slate-700' :
                      i === 2 ? 'bg-orange-100 text-orange-700' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{news.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(news.published_at).toLocaleDateString('vi-VN')}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Eye className="w-4 h-4" />
                      {(news.views || 0).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Careers */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-green-500" />
              Top vị trí ứng tuyển
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topCareers.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-4">Chưa có dữ liệu</p>
            ) : (
              <div className="space-y-3">
                {topCareers.map((career, i) => (
                  <div key={career.id} className="flex items-center gap-3">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      i === 0 ? 'bg-green-100 text-green-700' :
                      i === 1 ? 'bg-blue-100 text-blue-700' :
                      i === 2 ? 'bg-purple-100 text-purple-700' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium truncate">{career.title}</p>
                        {career.is_hot && <Badge className="bg-red-500 text-white border-0 text-[10px] py-0">HOT</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground">{career.department}</p>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <FileText className="w-4 h-4" />
                      {career.applications_count || 0}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
