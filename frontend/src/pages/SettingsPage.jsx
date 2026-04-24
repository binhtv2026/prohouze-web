import React from 'react';
import { Link } from 'react-router-dom';
import Header from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { getRoleLabel } from '@/lib/utils';
import {
  Building2,
  Users,
  Shield,
  Bell,
  Palette,
  Database,
  Key,
  Globe,
  Mail,
  MessageSquare,
  ArrowRight,
  Target,
  LayoutDashboard,
} from 'lucide-react';

export default function SettingsPage() {
  const { user, hasRole } = useAuth();

  const settingsSections = [
    {
      title: 'Chi nhánh',
      description: 'Quản lý danh sách chi nhánh và vùng hoạt động',
      icon: Building2,
      badge: '34 chi nhánh',
    },
    {
      title: 'Người dùng & Phân quyền',
      description: 'Quản lý tài khoản và phân quyền truy cập',
      icon: Users,
      badge: '1000+ người dùng',
    },
    {
      title: 'Bảo mật',
      description: 'Cấu hình bảo mật và xác thực',
      icon: Shield,
    },
    {
      title: 'Thông báo',
      description: 'Cài đặt thông báo email, SMS, push',
      icon: Bell,
    },
    {
      title: 'Giao diện',
      description: 'Tùy chỉnh theme, logo và màu sắc',
      icon: Palette,
    },
    {
      title: 'Dữ liệu',
      description: 'Sao lưu, xuất nhập dữ liệu',
      icon: Database,
    },
    {
      title: 'Độ phủ quản trị',
      description: 'Theo dõi độ phủ governance, master data và entity schema của phase 1',
      icon: Target,
      badge: 'Cốt lõi',
    },
    {
      title: 'Kế hoạch chuẩn hóa',
      description: 'Danh sách mismatch, legacy state và thứ tự xử lý để đưa phase 1 về chuẩn',
      icon: Shield,
      badge: 'Cốt lõi',
    },
    {
      title: 'Kiến trúc dashboard',
      description: 'Khóa dashboard chính, tab chuẩn và quyền ai được thấy để dọn menu về một nguồn chuẩn',
      icon: LayoutDashboard,
      badge: 'Cốt lõi',
    },
  ];

  const integrations = [
    { name: 'Zalo OA', status: 'connected', icon: MessageSquare },
    { name: 'Facebook', status: 'connected', icon: Globe },
    { name: 'Email (SendGrid)', status: 'pending', icon: Mail },
    { name: 'SMS (Twilio)', status: 'pending', icon: MessageSquare },
  ];

  return (
    <div className="min-h-screen bg-slate-50" data-testid="settings-page">
      <Header title="Cài đặt hệ thống" />

      <div className="p-6 max-w-[1200px] mx-auto">
        {/* Profile Card */}
        <Card className="bg-white border border-slate-200 mb-6">
          <CardContent className="p-6">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 rounded-2xl bg-[#316585] flex items-center justify-center text-white text-3xl font-bold">
                {user?.full_name?.charAt(0)}
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-slate-900">{user?.full_name}</h2>
                <p className="text-slate-500">{user?.email}</p>
                <Badge className="mt-2 bg-[#316585]">
                  {getRoleLabel(user?.role)}
                </Badge>
              </div>
              <Button variant="outline">Chỉnh sửa hồ sơ</Button>
            </div>
          </CardContent>
        </Card>

        {/* Settings Grid */}
        <Card className="bg-gradient-to-r from-[#0d1f35] via-[#16314f] to-[#316585] border border-[#316585]/20 mb-6 text-white">
          <CardContent className="p-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/85">
                <Target className="w-4 h-4" />
                Bản thiết kế chuyển đổi đã khóa
              </div>
              <h3 className="text-2xl font-bold mt-3">Toàn bộ kế hoạch phase 1 đã được khóa trong hệ thống</h3>
              <p className="text-sm text-white/75 mt-2 leading-6">
                Xem 6 module ưu tiên, KPI nghiệm thu, tiêu chí chấp nhận và thứ tự build để giữ đúng hướng triển khai 10/10.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild variant="secondary" className="w-fit bg-white text-[#16314f] hover:bg-white/90">
                <Link to="/settings/governance">
                  Mở trung tâm quản trị
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
              <Button asChild variant="secondary" className="w-fit bg-white/10 text-white hover:bg-white/15 border border-white/20">
                <Link to="/settings/blueprint">
                  Mở blueprint
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
              <Button asChild variant="secondary" className="w-fit bg-white/10 text-white hover:bg-white/15 border border-white/20">
                <Link to="/settings/governance-remediation">
                  Mở chuẩn hóa
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
              <Button asChild variant="secondary" className="w-fit bg-white/10 text-white hover:bg-white/15 border border-white/20">
                <Link to="/settings/dashboard-architecture">
                  Mở kiến trúc dashboard
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {settingsSections.map((section, index) => (
            <Card
              key={index}
              className="bg-white border border-slate-200 hover:shadow-md transition-shadow cursor-pointer group"
            >
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center group-hover:bg-[#316585]/10 transition-colors">
                    <section.icon className="w-5 h-5 text-slate-600 group-hover:text-[#316585] transition-colors" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-slate-900">{section.title}</h3>
                      {section.badge && (
                        <Badge variant="outline" className="text-xs">{section.badge}</Badge>
                      )}
                    </div>
                    <p className="text-sm text-slate-500 mt-1">{section.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Integrations */}
        <Card className="bg-white border border-slate-200 mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Tích hợp bên ngoài</CardTitle>
            <CardDescription>Kết nối với các dịch vụ và nền tảng khác</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {integrations.map((integration, index) => (
                <div key={index} className="flex items-center justify-between p-4 rounded-lg bg-slate-50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-white border flex items-center justify-center">
                      <integration.icon className="w-5 h-5 text-slate-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-slate-900">{integration.name}</h4>
                      <p className="text-xs text-slate-500">
                        {integration.status === 'connected' ? 'Đã kết nối' : 'Chưa kết nối'}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant={integration.status === 'connected' ? 'default' : 'outline'}
                    className={integration.status === 'connected' ? 'bg-green-500' : ''}
                  >
                    {integration.status === 'connected' ? 'Đã kết nối' : 'Kết nối'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* API Keys */}
        <Card className="bg-white border border-slate-200">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Key className="w-5 h-5" />
              API Keys
            </CardTitle>
            <CardDescription>Quản lý API keys cho tích hợp bên ngoài</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg bg-slate-50">
                <div>
                  <h4 className="font-medium text-slate-900">Production API Key</h4>
                  <p className="text-sm text-slate-500 font-mono">pk_live_****...****</p>
                </div>
                <Button variant="outline" size="sm">Xem</Button>
              </div>
              <div className="flex items-center justify-between p-4 rounded-lg bg-slate-50">
                <div>
                  <h4 className="font-medium text-slate-900">Development API Key</h4>
                  <p className="text-sm text-slate-500 font-mono">pk_test_****...****</p>
                </div>
                <Button variant="outline" size="sm">Xem</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
