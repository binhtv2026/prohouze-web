import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '@/components/layout/PageHeader';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ROLE_GOVERNANCE } from '@/config/roleGovernance';
import { getInitials, getRoleLabel } from '@/lib/utils';
import {
  Award,
  BarChart3,
  Briefcase,
  Building2,
  Calendar,
  CheckSquare,
  DollarSign,
  FileText,
  GraduationCap,
  ShieldCheck,
  TrendingUp,
  UserCircle,
  Users,
} from 'lucide-react';

const profileContentByRole = {
  admin: {
    teamName: 'Ban quản trị hệ thống',
    manager: 'Hội đồng điều hành',
    kpis: [
      { label: 'Yêu cầu đã xử lý', value: '42', note: 'Phân quyền, cấu hình, workflow' },
      { label: 'Mức ổn định hệ thống', value: '97%', note: 'Theo dõi bởi quản trị' },
      { label: 'Thay đổi chờ áp dụng', value: '8', note: 'Cần rà soát trước khi mở rộng' },
    ],
    benefits: ['Toàn quyền truy cập hệ thống', 'Quản trị người dùng & phân quyền', 'Theo dõi audit và change management'],
    growth: 'Vai trò trung tâm giữ chuẩn vận hành, bảo mật và cấu trúc hệ thống.',
  },
  bod: {
    teamName: 'Ban lãnh đạo',
    manager: 'Hội đồng quản trị',
    kpis: [
      { label: 'Doanh thu đang theo dõi', value: '24,8 tỷ', note: 'Toàn doanh nghiệp' },
      { label: 'Yêu cầu chờ phê duyệt', value: '9', note: 'Booking, chi phí, pháp lý' },
      { label: 'Cảnh báo điều hành', value: '5', note: 'Cần quyết định trong ngày' },
    ],
    benefits: ['Toàn quyền xem báo cáo chiến lược', 'Phê duyệt cấp cao', 'Điều hành đa phòng ban'],
    growth: 'Vai trò định hướng tăng trưởng, kiểm soát rủi ro và ra quyết định cấp doanh nghiệp.',
  },
  manager: {
    teamName: 'Phòng kinh doanh',
    manager: 'Giám đốc kinh doanh',
    kpis: [
      { label: 'Đội nhóm đang theo', value: '16 người', note: 'Bao gồm sale và cộng tác viên' },
      { label: 'Deal đang mở', value: '48', note: 'Theo pipeline đội nhóm' },
      { label: 'KPI đội tuần này', value: '82%', note: 'Theo dõi hiệu suất và tuân thủ' },
    ],
    benefits: ['Điều phối đội nhóm', 'Phê duyệt theo phạm vi quản lý', 'Theo dõi KPI và cảnh báo vận hành'],
    growth: 'Có thể phát triển lên giám đốc kinh doanh khi đội tăng trưởng bền vững và giữ chuẩn vận hành.',
  },
  sales: {
    teamName: 'Team kinh doanh 1',
    manager: 'Nguyễn Hoàng Nam - Trưởng nhóm',
    kpis: [
      { label: 'Doanh số tháng', value: '2,4 tỷ', note: 'Mục tiêu 5 tỷ' },
      { label: 'Hoa hồng tạm tính', value: '28,8 triệu', note: 'Theo giao dịch hiện tại' },
      { label: 'KPI tổng hợp', value: '78%', note: 'Bán hàng, tác phong, tuân thủ, đóng góp' },
    ],
    benefits: ['Theo dõi hoa hồng và thưởng', 'Xem tài liệu dự án, pháp lý, chính sách', 'Theo dõi lộ trình lên trưởng nhóm'],
    growth: 'Còn thiếu một số mốc doanh số và KPI để được xét lên trưởng nhóm hoặc mở team riêng.',
  },
  marketing: {
    teamName: 'Phòng marketing',
    manager: 'Trưởng phòng marketing',
    kpis: [
      { label: 'Chiến dịch đang chạy', value: '11', note: 'Meta, Zalo, TikTok, landing page' },
      { label: 'Lead về hôm nay', value: '84', note: 'Theo các kênh đang chạy' },
      { label: 'Nội dung chờ xuất bản', value: '6', note: 'Bài viết, landing page, video' },
    ],
    benefits: ['Quản lý nguồn lead và chiến dịch', 'Theo dõi hiệu quả nội dung', 'Hỗ trợ sale bằng truyền thông đa kênh'],
    growth: 'Phát triển theo năng lực tăng trưởng lead, hiệu quả chiến dịch và chất lượng nội dung hỗ trợ bán hàng.',
  },
  finance: {
    teamName: 'Phòng tài chính',
    manager: 'Kế toán trưởng',
    kpis: [
      { label: 'Doanh thu ghi nhận', value: '24,8 tỷ', note: 'Theo kỳ hiện tại' },
      { label: 'Công nợ cần đối soát', value: '7 hồ sơ', note: 'Cần xử lý hôm nay' },
      { label: 'Hoa hồng chờ chi', value: '3,2 tỷ', note: 'Đang rà soát trước khi chi' },
    ],
    benefits: ['Theo dõi thu chi, công nợ, hoa hồng', 'Đối soát số liệu', 'Kiểm soát chặt dòng tiền'],
    growth: 'Phát triển theo độ chính xác số liệu, tốc độ đối soát và năng lực kiểm soát tài chính doanh nghiệp.',
  },
  hr: {
    teamName: 'Phòng nhân sự',
    manager: 'Trưởng phòng nhân sự',
    kpis: [
      { label: 'Ứng viên mới', value: '26', note: 'Cần sàng lọc và gọi lại' },
      { label: 'Nhân sự đang hoạt động', value: '132', note: 'Chính thức và cộng tác viên' },
      { label: 'Buổi đào tạo tuần này', value: '4', note: 'Cần chuẩn bị nội dung và nhắc lịch' },
    ],
    benefits: ['Quản lý hồ sơ nhân sự', 'Theo dõi tuyển dụng và onboarding', 'Vận hành đào tạo nội bộ'],
    growth: 'Đi lên theo năng lực tuyển đúng người, giữ nhịp vận hành đội ngũ và phát triển lộ trình nhân sự.',
  },
  legal: {
    teamName: 'Phòng pháp lý',
    manager: 'Trưởng phòng pháp lý',
    kpis: [
      { label: 'Hồ sơ đang xử lý', value: '18', note: 'Hồ sơ dự án và giao dịch' },
      { label: 'Hợp đồng chờ rà soát', value: '11', note: 'Cần kiểm tra trước khi ký' },
      { label: 'Tài liệu sẵn gửi sale', value: '22 bộ', note: 'Dùng để hỗ trợ chốt khách' },
    ],
    benefits: ['Kiểm soát hồ sơ pháp lý', 'Rà soát hợp đồng', 'Hỗ trợ sale bằng pháp lý dự án chuẩn'],
    growth: 'Phát triển theo năng lực giảm rủi ro, chuẩn hóa hồ sơ và hỗ trợ giao dịch an toàn hơn.',
  },
  content: {
    teamName: 'Bộ phận website / CMS',
    manager: 'Trưởng bộ phận nội dung số',
    kpis: [
      { label: 'Trang cần cập nhật', value: '8', note: 'Dự án, landing page, trang thương hiệu' },
      { label: 'Bài viết chờ xuất bản', value: '5', note: 'Website và chiến dịch' },
      { label: 'Form đang chạy', value: '13', note: 'Các điểm lấy lead trên web' },
    ],
    benefits: ['Vận hành nội dung và website', 'Theo dõi landing page và form lead', 'Hỗ trợ marketing và sale bằng nội dung chuẩn'],
    growth: 'Phát triển theo chất lượng nội dung, tốc độ cập nhật và khả năng hỗ trợ tăng trưởng trên web.',
  },
  agency: {
    teamName: 'Mạng lưới cộng tác viên',
    manager: 'Quản lý đại lý / cộng tác viên',
    kpis: [
      { label: 'Khách đang theo', value: '12', note: 'Những khách cần bám trong ngày' },
      { label: 'Booking đang mở', value: '3', note: 'Cần xử lý tiếp' },
      { label: 'Hoa hồng dự kiến', value: '18 triệu', note: 'Theo giao dịch gần nhất' },
    ],
    benefits: ['Theo dõi khách của mình', 'Xem hoa hồng liên quan', 'Nhận tài liệu bán hàng và chính sách mới'],
    growth: 'Có thể phát triển thành cộng tác viên mạnh hoặc mở rộng đội giới thiệu khách ổn định hơn.',
  },
};

function ProfileMetricCard({ icon: Icon, label, value, note }) {
  return (
    <Card className="border-slate-200">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm text-slate-500">{label}</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
            <p className="mt-2 text-sm text-slate-500">{note}</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#316585]/10">
            <Icon className="h-5 w-5 text-[#316585]" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function MyProfilePage() {
  const { user } = useAuth();
  const role = user?.role || 'sales';
  const roleInfo = ROLE_GOVERNANCE[role];
  const profile = useMemo(() => profileContentByRole[role] || profileContentByRole.sales, [role]);

  const actionLinks = [
    { label: 'Bảng làm việc của tôi', link: role === 'sales' ? '/sales' : '/workspace', icon: Briefcase },
    { label: 'Công việc hôm nay', link: '/work', icon: CheckSquare },
    { label: 'KPI của tôi', link: role === 'sales' ? '/kpi/my-performance' : '/kpi', icon: BarChart3 },
    { label: 'Hồ sơ / hợp đồng', link: role === 'sales' ? '/sales/contracts' : '/contracts', icon: FileText },
  ];
  const identityCards = [
    { icon: UserCircle, label: 'Vai trò', value: roleInfo?.ten || 'Nhân sự', note: roleInfo?.phamVi || 'Theo phân quyền' },
    { icon: Users, label: 'Quản lý trực tiếp', value: profile.manager, note: 'Người theo sát công việc của bạn' },
    { icon: Building2, label: 'Đơn vị làm việc', value: profile.teamName, note: 'Phòng ban / team hiện tại' },
    { icon: Calendar, label: 'Trạng thái', value: 'Đang hoạt động', note: 'Tài khoản đang sử dụng bình thường' },
  ];
  const nextSteps = [
    {
      title: 'Cập nhật hồ sơ cá nhân',
      note: 'Giữ đúng thông tin vai trò, đơn vị và hồ sơ làm việc.',
      link: '/me',
    },
    {
      title: 'Theo dõi KPI & quyền lợi',
      note: 'Biết mình đang nhận được gì và còn thiếu gì để tiến xa hơn.',
      link: role === 'sales' ? '/kpi/my-performance' : '/kpi',
    },
    {
      title: 'Quay lại bảng làm việc',
      note: 'Sau khi xem hồ sơ, quay lại màn công việc chính để xử lý tiếp.',
      link: role === 'sales' ? '/sales' : '/workspace',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <PageHeader
        title="Hồ sơ cá nhân"
        subtitle="Nơi xem thông tin, quyền lợi, KPI, lộ trình và tình trạng làm việc của chính bạn."
        showNotifications={true}
        showAIButton={true}
      />

      <div className="mx-auto max-w-[1600px] space-y-6 p-6">
        <div className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
          <Card className="border-slate-200">
            <CardContent className="p-6">
              <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                <div className="flex gap-4">
                  <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-[#316585] to-[#4a8fb5] text-2xl font-bold text-white">
                    {getInitials(user?.full_name || user?.name)}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">{user?.full_name || user?.name || 'Người dùng'}</h2>
                    <p className="mt-1 text-slate-500">{user?.email}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Badge className="bg-slate-100 text-slate-700">{getRoleLabel(role)}</Badge>
                      <Badge className="bg-[#316585]/10 text-[#316585]">{roleInfo?.mang}</Badge>
                      <Badge className="bg-emerald-50 text-emerald-700">{profile.teamName}</Badge>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {actionLinks.map((action) => {
                    const Icon = action.icon;
                    return (
                      <Link key={action.label} to={action.link}>
                        <Button size="sm" variant={action.label === 'Bảng làm việc của tôi' ? 'default' : 'outline'} className={action.label === 'Bảng làm việc của tôi' ? 'bg-[#316585] hover:bg-[#264f68]' : ''}>
                          <Icon className="mr-2 h-4 w-4" />
                          {action.label}
                        </Button>
                      </Link>
                    );
                  })}
                </div>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {identityCards.map((item) => (
                  <ProfileMetricCard key={item.label} icon={item.icon} label={item.label} value={item.value} note={item.note} />
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle>Điểm nổi bật của tôi</CardTitle>
              <CardDescription>Những gì bạn cần biết ngay về công việc, quyền lợi và hành trình phát triển.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-2xl border border-[#316585]/15 bg-[#316585]/[0.04] p-4">
                <p className="text-sm font-semibold text-slate-900">Mô tả vai trò</p>
                <p className="mt-2 text-sm text-slate-600">{roleInfo?.moTa}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-sm font-semibold text-slate-900">Ưu tiên công việc</p>
                <p className="mt-2 text-sm text-slate-600">{roleInfo?.uuTien}</p>
              </div>
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                <p className="text-sm font-semibold text-emerald-800">Lộ trình phát triển</p>
                <p className="mt-2 text-sm text-emerald-900">{profile.growth}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {profile.kpis.map((item) => (
            <ProfileMetricCard
              key={item.label}
              icon={TrendingUp}
              label={item.label}
              value={item.value}
              note={item.note}
            />
          ))}
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-[#316585]" />
                Quyền lợi & hỗ trợ
              </CardTitle>
              <CardDescription>Những gì hệ thống đang hỗ trợ bạn để làm việc tốt hơn.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {profile.benefits.map((item) => (
                <div key={item} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                  {item}
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-[#316585]" />
                Hồ sơ & trạng thái cá nhân
              </CardTitle>
              <CardDescription>Các đầu mục để nhân sự tự theo dõi hồ sơ của mình.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="font-semibold text-slate-900">Hợp đồng / giấy tờ</p>
                <p className="mt-1 text-sm text-slate-500">Theo dõi hợp đồng, giấy tờ và hồ sơ làm việc.</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="font-semibold text-slate-900">KPI & đánh giá</p>
                <p className="mt-1 text-sm text-slate-500">Biết mình đang đạt ở đâu và còn thiếu gì.</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="font-semibold text-slate-900">Đào tạo & phát triển</p>
                <p className="mt-1 text-sm text-slate-500">Theo dõi khóa học, kỹ năng và lộ trình thăng tiến.</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-[#316585]" />
              Việc nên làm tiếp theo
            </CardTitle>
            <CardDescription>Những hành động giúp bạn dùng hệ thống hiệu quả hơn trong ngày.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-3">
            {nextSteps.map((item) => (
              <Link key={item.title} to={item.link} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 transition-colors hover:bg-white">
                <p className="font-semibold text-slate-900">{item.title}</p>
                <p className="mt-1 text-sm text-slate-500">{item.note}</p>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
