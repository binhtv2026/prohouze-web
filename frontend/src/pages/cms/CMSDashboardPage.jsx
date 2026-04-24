import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, Newspaper, Rocket, Building2, Star, Users, 
  Briefcase, Image, HelpCircle, Eye, FormInput, TrendingUp,
  Plus, Settings, RefreshCw
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { cmsDashboardApi, cmsSeedApi } from '@/api/cmsApi';

const DEMO_CMS_STATS = {
  total_pages: 12,
  published_pages: 10,
  total_articles: 24,
  published_articles: 18,
  total_landing_pages: 6,
  active_landing_pages: 4,
  total_public_projects: 8,
  total_testimonials: 14,
  total_partners: 11,
  total_careers: 7,
  active_careers: 3,
  total_media_assets: 126,
  total_faqs: 32,
  total_page_views: 158420,
  total_form_submissions: 482,
  avg_conversion_rate: 3.75,
};

export default function CMSDashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    try {
      const data = await cmsDashboardApi.getStats();
      setStats(data || DEMO_CMS_STATS);
    } catch (err) {
      setStats(DEMO_CMS_STATS);
      toast.error('Không thể tải thống kê CMS, đang hiển thị dữ liệu mẫu');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSeedData = async () => {
    try {
      await cmsSeedApi.seed();
      toast.success('Đã tạo dữ liệu mẫu');
      fetchStats();
    } catch (err) {
      toast.error('Lỗi tạo dữ liệu mẫu');
    }
  };

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const statCards = [
    {
      title: 'Trang tĩnh',
      icon: FileText,
      value: stats?.total_pages || 0,
      subValue: `${stats?.published_pages || 0} đã xuất bản`,
      color: 'blue',
      link: '/cms/pages'
    },
    {
      title: 'Bài viết',
      icon: Newspaper,
      value: stats?.total_articles || 0,
      subValue: `${stats?.published_articles || 0} đã xuất bản`,
      color: 'green',
      link: '/cms/articles'
    },
    {
      title: 'Landing Pages',
      icon: Rocket,
      value: stats?.total_landing_pages || 0,
      subValue: `${stats?.active_landing_pages || 0} đang hoạt động`,
      color: 'purple',
      link: '/cms/landing-pages'
    },
    {
      title: 'Dự án công khai',
      icon: Building2,
      value: stats?.total_public_projects || 0,
      subValue: 'Đang hiển thị',
      color: 'orange',
      link: '/cms/public-projects'
    },
    {
      title: 'Đánh giá',
      icon: Star,
      value: stats?.total_testimonials || 0,
      subValue: 'Testimonials',
      color: 'yellow',
      link: '/cms/testimonials'
    },
    {
      title: 'Đối tác',
      icon: Users,
      value: stats?.total_partners || 0,
      subValue: 'Partners',
      color: 'indigo',
      link: '/cms/partners'
    },
    {
      title: 'Tuyển dụng',
      icon: Briefcase,
      value: stats?.total_careers || 0,
      subValue: `${stats?.active_careers || 0} đang tuyển`,
      color: 'pink',
      link: '/cms/careers'
    },
    {
      title: 'Media',
      icon: Image,
      value: stats?.total_media_assets || 0,
      subValue: 'Tài sản media',
      color: 'cyan',
      link: '/cms/public-projects'
    },
    {
      title: 'FAQ',
      icon: HelpCircle,
      value: stats?.total_faqs || 0,
      subValue: 'Câu hỏi thường gặp',
      color: 'gray',
      link: '/cms/pages'
    }
  ];

  const analyticsCards = [
    {
      title: 'Lượt xem',
      icon: Eye,
      value: stats?.total_page_views?.toLocaleString() || '0',
      color: 'blue'
    },
    {
      title: 'Form submissions',
      icon: FormInput,
      value: stats?.total_form_submissions?.toLocaleString() || '0',
      color: 'green'
    },
    {
      title: 'Tỷ lệ chuyển đổi',
      icon: TrendingUp,
      value: `${stats?.avg_conversion_rate?.toFixed(2) || 0}%`,
      color: 'purple'
    }
  ];

  const quickActions = [
    { label: 'Tạo trang mới', icon: FileText, link: '/cms/pages?action=create', color: 'bg-blue-500' },
    { label: 'Viết bài mới', icon: Newspaper, link: '/cms/articles?action=create', color: 'bg-green-500' },
    { label: 'Tạo Landing Page', icon: Rocket, link: '/cms/landing-pages?action=create', color: 'bg-purple-500' },
    { label: 'Thêm dự án công khai', icon: Building2, link: '/cms/public-projects?action=create', color: 'bg-orange-500' },
  ];

  const getColorClass = (color) => {
    const colors = {
      blue: 'bg-blue-100 text-blue-600',
      green: 'bg-green-100 text-green-600',
      purple: 'bg-purple-100 text-purple-600',
      orange: 'bg-orange-100 text-orange-600',
      yellow: 'bg-yellow-100 text-yellow-600',
      indigo: 'bg-indigo-100 text-indigo-600',
      pink: 'bg-pink-100 text-pink-600',
      cyan: 'bg-cyan-100 text-cyan-600',
      gray: 'bg-gray-100 text-gray-600',
    };
    return colors[color] || colors.gray;
  };

  return (
    <div className="p-6 space-y-6" data-testid="cms-dashboard">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">CMS Dashboard</h1>
          <p className="text-muted-foreground">Quản lý nội dung website công khai</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleSeedData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Seed Data
          </Button>
          <Link to="/settings">
            <Button variant="outline">
              <Settings className="w-4 h-4 mr-2" />
              Cài đặt
            </Button>
          </Link>
        </div>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Tạo nhanh</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {quickActions.map((action, idx) => (
              <Link key={idx} to={action.link}>
                <Button 
                  variant="outline" 
                  className="w-full h-auto py-4 flex flex-col items-center gap-2 hover:border-primary"
                >
                  <div className={`p-2 rounded-lg ${action.color} text-white`}>
                    <action.icon className="w-5 h-5" />
                  </div>
                  <span className="text-sm">{action.label}</span>
                </Button>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Analytics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {analyticsCards.map((card, idx) => (
          <Card key={idx}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-lg ${getColorClass(card.color)}`}>
                  <card.icon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-3xl font-bold">{card.value}</p>
                  <p className="text-sm text-muted-foreground">{card.title}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Content Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {statCards.map((card, idx) => (
          <Link key={idx} to={card.link}>
            <Card className="hover:border-primary transition-colors cursor-pointer h-full">
              <CardContent className="pt-4">
                <div className="flex flex-col gap-2">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getColorClass(card.color)}`}>
                    <card.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{card.value}</p>
                    <p className="text-sm font-medium">{card.title}</p>
                    <p className="text-xs text-muted-foreground">{card.subValue}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Recent Activity Placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Bài viết gần đây</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <Newspaper className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Chưa có bài viết nào</p>
              <Link to="/cms/articles?action=create">
                <Button variant="link" className="mt-2">
                  <Plus className="w-4 h-4 mr-1" /> Viết bài mới
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Landing Pages hoạt động</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <Rocket className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Chưa có landing page nào</p>
              <Link to="/cms/landing-pages?action=create">
                <Button variant="link" className="mt-2">
                  <Plus className="w-4 h-4 mr-1" /> Tạo landing page
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
