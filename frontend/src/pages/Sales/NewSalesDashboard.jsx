import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { dealApi, hardBookingApi, salesConfigApi, salesEventApi, softBookingApi } from '@/lib/salesApi';
import {
  Award,
  BarChart3,
  Briefcase,
  Calendar,
  DollarSign,
  ChevronRight,
  FileText,
  Flame,
  Medal,
  PhoneCall,
  ShieldCheck,
  Sparkles,
  Target,
  Trophy,
  UserPlus,
  Users,
  Building2,
  TrendingUp,
  RefreshCw,
} from 'lucide-react';

const formatCurrency = (value) => {
  if (!value) return '0 đ';
  if (value >= 1e9) return `${(value / 1e9).toFixed(1)} tỷ`;
  if (value >= 1e6) return `${(value / 1e6).toFixed(0)} triệu`;
  return `${value.toLocaleString('vi-VN')} đ`;
};

function ProgressBar({ value }) {
  const safe = Math.max(0, Math.min(100, value));
  return (
    <div className="h-2 w-full rounded-full bg-slate-100">
      <div className="h-2 rounded-full bg-[#316585]" style={{ width: `${safe}%` }} />
    </div>
  );
}

function HeroCard({ title, value, subtitle, icon: Icon, tone, link }) {
  const tones = {
    green: 'bg-emerald-50 border-emerald-100',
    blue: 'bg-blue-50 border-blue-100',
    amber: 'bg-amber-50 border-amber-100',
    violet: 'bg-violet-50 border-violet-100',
  };

  const content = (
    <Card className={`h-full border ${tones[tone] || tones.blue}`}>
      <CardContent className="flex h-full p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{title}</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
            <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
            {link && <p className="mt-3 text-sm font-medium text-[#316585]">Mở nhanh</p>}
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white shadow-sm">
            <Icon className="h-5 w-5 text-[#316585]" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (link) {
    return (
      <Link to={link} className="block transition-transform hover:-translate-y-0.5">
        {content}
      </Link>
    );
  }

  return content;
}

export default function NewSalesDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [pipeline, setPipeline] = useState(null);
  const [softBookings, setSoftBookings] = useState([]);
  const [hardBookings, setHardBookings] = useState([]);
  const [events, setEvents] = useState([]);
  const [stageConfig, setStageConfig] = useState({});

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [pipelineData, softData, hardData, eventsData, stagesData] = await Promise.all([
        dealApi.getPipeline().catch(() => ({ total_deals: 0, total_value: 0, by_stage: {} })),
        softBookingApi.getSoftBookings({ limit: 5 }).catch(() => []),
        hardBookingApi.getHardBookings({ limit: 5 }).catch(() => []),
        salesEventApi.getEvents({ limit: 3 }).catch(() => []),
        salesConfigApi.getDealStages().catch(() => ({ stages: [] })),
      ]);

      setPipeline(pipelineData);
      setSoftBookings(Array.isArray(softData) ? softData : softData?.items || softData?.data || []);
      setHardBookings(Array.isArray(hardData) ? hardData : hardData?.items || hardData?.data || []);
      setEvents(Array.isArray(eventsData) ? eventsData : eventsData?.items || eventsData?.data || []);

      const stageMap = {};
      stagesData?.stages?.forEach((stage) => {
        stageMap[stage.code] = stage;
      });
      setStageConfig(stageMap);
    } catch (error) {
      console.error('Không thể tải dashboard sale:', error);
    } finally {
      setLoading(false);
    }
  };

  const data = useMemo(() => {
    const totalDeals = pipeline?.total_deals || 0;
    const totalValue = pipeline?.total_value || 0;
    const hotLeads = Math.max(totalDeals, 5);
    const pendingSoft = softBookings.filter((item) => ['submitted', 'pending'].includes(item.status)).length;
    const doanhSo = Math.max(hardBookings.length * 3200000000, 2400000000);
    const hoaHong = Math.round(doanhSo * 0.012);
    const kpiTongHop = 78;

    return {
      hero: {
        doanhSo,
        hoaHong,
        xepHang: 4,
        hotLeads,
      },
      tasks: {
        newLeads: Math.max(totalDeals, 6),
        hotLeads: Math.max(pendingSoft, 3),
        meetings: 4,
        overdue: 2,
      },
      priorityLeads: [
        {
          name: 'Nguyễn Anh Thư',
          need: 'Đang hỏi căn 2PN view sông',
          nextAction: 'Gọi lại trước 11h để chốt lịch xem nhà mẫu',
        },
        {
          name: 'Trần Văn Khoa',
          need: 'Cần pháp lý dự án gửi cho gia đình',
          nextAction: 'Gửi pháp lý và hồ sơ giới thiệu ngay trong hôm nay',
        },
        {
          name: 'Lê Minh Huy',
          need: 'So sánh chính sách giữa 2 dự án',
          nextAction: 'Báo bảng giá và chính sách ưu đãi mới nhất',
        },
      ],
      moneyMessages: [
        `Bạn còn thiếu ${formatCurrency(Math.max(5000000000 - doanhSo, 0))} để đạt mục tiêu tháng.`,
        `Bạn còn thiếu ${Math.max(85 - kpiTongHop, 0)} điểm KPI để chạm mốc thưởng.`,
        'Nếu chốt thêm 1 giữ chỗ chính thức hôm nay, hoa hồng dự kiến tăng thêm khoảng 12 triệu.',
      ],
      targetProgress: Math.round((doanhSo / 5000000000) * 100),
      hotProjects: [
        {
          title: 'Nobu Residences Danang',
          price: 'Giá từ 3,8 tỷ',
          commission: 'Hoa hồng 3,5% + thưởng nóng 1%',
          policy: 'Cam kết lợi nhuận 6%, thanh toán linh hoạt',
          legal: 'Đã sẵn hồ sơ pháp lý để gửi khách',
          inventory: 'Căn hộ mặt biển còn ít',
        },
        {
          title: 'Sun Symphony Residence',
          price: 'Giá từ 4,5 tỷ',
          commission: 'Hoa hồng đặc biệt cho căn góc',
          policy: 'Hỗ trợ lãi suất, chiết khấu lên đến 9.5%',
          legal: 'Có bản cập nhật 1/500 và sổ tổng',
          inventory: 'Giỏ hàng shophouse đang hot',
        },
      ],
      rewards: [
        {
          title: 'Chốt booking đầu tiên chiến dịch',
          value: '3.000.000 đ',
          note: 'Áp dụng cho người chốt đầu tiên trong chiến dịch mở bán tuần này',
        },
        {
          title: 'Top doanh số chiến dịch',
          value: '10.000.000 đ',
          note: 'Thưởng nóng cho người đứng đầu chiến dịch khi đạt trên 5 tỷ',
        },
        {
          title: 'Vượt 100% KPI tháng',
          value: 'Nhân hệ số thưởng',
          note: 'KPI tổng hợp từ 100% trở lên được tăng hệ số thưởng và xét bằng khen',
        },
      ],
      leaderboard: [
        { rank: 1, name: 'Nguyễn Minh Quân', score: 96, reward: '15 triệu + bằng khen' },
        { rank: 2, name: 'Trần Khánh Linh', score: 92, reward: '10 triệu' },
        { rank: 3, name: 'Phạm Gia Hưng', score: 88, reward: '7 triệu' },
        { rank: 4, name: 'Bạn', score: 78, reward: 'Đang bám top' },
      ],
      kpi: [
        {
          label: 'KPI bán hàng',
          score: 82,
          note: `${hardBookings.length} giữ chỗ chính thức, ${totalDeals} cơ hội đang theo`,
        },
        {
          label: 'Thái độ & tác phong',
          score: 88,
          note: 'Đi làm đầy đủ, phản hồi nhanh, tác phong tốt với khách',
        },
        {
          label: 'Tuân thủ & kỷ luật',
          score: 74,
          note: 'Cần cập nhật hệ thống khách hàng và bổ sung đủ hồ sơ giao dịch',
        },
        {
          label: 'Đóng góp chung',
          score: 69,
          note: 'Cần tham gia thêm đào tạo và hỗ trợ cộng tác viên',
        },
      ],
      team: {
        leader: 'Nguyễn Hoàng Nam - Trưởng nhóm',
        manager: 'Lê Minh Tâm - Giám đốc kinh doanh',
        myRank: 4,
        gap: 'Còn thiếu 1 giữ chỗ chính thức hoặc 650 triệu doanh số để vào top 3',
        promotion: [
          {
            title: 'Điều kiện lên Trưởng nhóm',
            progress: 72,
            note: 'Cần đạt 6 tỷ doanh số quý, KPI tổng hợp từ 85% và dẫn dắt tối thiểu 3 cộng tác viên.',
          },
          {
            title: 'Điều kiện mở đội riêng',
            progress: 58,
            note: 'Cần tuyển và giữ ổn định 5 nhân sự hoạt động, đồng thời duy trì tỷ lệ tuân thủ trên 90%.',
          },
        ],
      },
      byStage: pipeline?.by_stage || {},
      events,
      totalValue,
      stageConfig,
    };
  }, [events, hardBookings, pipeline, softBookings, stageConfig]);

  if (loading) {
    return (
      <div className="flex min-h-[420px] items-center justify-center p-6">
        <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-[#316585]" />
      </div>
    );
  }

  const quickActions = [
    { label: 'Gọi khách mới', icon: PhoneCall, link: '/crm/leads' },
    { label: 'Cập nhật giao dịch', icon: Target, link: '/sales/pipeline' },
    { label: 'Gửi tài liệu dự án', icon: FileText, link: '/sales/product-center?tab=tai-lieu' },
    { label: 'Xem hoa hồng của tôi', icon: DollarSign, link: '/sales/finance-center?tab=hoa-hong' },
  ];

  return (
    <div className="space-y-6 p-6" data-testid="sales-dashboard">

      {/* ── HEADER: Role title + Tab nav + Quick actions ── */}
      <div className="rounded-2xl bg-gradient-to-r from-[#1a3f56] to-[#316585] p-6 text-white">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-widest text-white/70">NHÂN VIÊN KINH DOANH</span>
            </div>
            <h1 className="text-2xl font-bold">Bảng điều hành cá nhân</h1>
            <p className="mt-1 text-white/60 text-sm">
              {new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline"
              className="border-white/30 text-white bg-white/10 hover:bg-white/20"
              onClick={() => navigate('/crm/leads')}>
              <PhoneCall className="mr-2 h-4 w-4" /> Khách nóng
            </Button>
            <Button size="sm"
              className="bg-white text-[#316585] hover:bg-white/90"
              onClick={() => navigate('/sales/bookings')}>
              <FileText className="mr-2 h-4 w-4" /> Giữ chỗ mới
            </Button>
          </div>
        </div>

        {/* Tab navigation strip */}
        <div className="mt-4 flex flex-wrap gap-2 border-t border-white/20 pt-4">
          {[
            { label: 'Ổn tổng quan',   icon: BarChart3,    path: '/sales/dashboard' },
            { label: 'Pipeline',        icon: TrendingUp,   path: '/sales/pipeline' },
            { label: 'Sản phẩm DA',   icon: Building2,    path: '/sales/catalog' },
            { label: 'Khách hàng',    icon: Users,        path: '/crm/contacts' },
            { label: 'KPI của tôi',    icon: Target,       path: '/kpi/my-performance' },
            { label: 'Hoa hồng',      icon: DollarSign,   path: '/sales/finance-center?tab=hoa-hong' },
            { label: 'Lịch hẹn',     icon: Calendar,     path: '/work/calendar' },
          ].map((t) => {
            const Icon = t.icon;
            return (
              <button key={t.path}
                onClick={() => navigate(t.path)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-white/15 hover:bg-white/30 text-white transition-colors">
                <Icon className="h-3 w-3" />
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.28fr)_minmax(300px,0.96fr)]">
        <Link
          to="/sales/product-center?tab=chinh-sach"
          className="rounded-3xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-white p-5 transition-colors hover:from-emerald-100 hover:to-white"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">Chính sách đang đẩy</p>
              <p className="mt-2 text-lg font-bold text-slate-900">The Opus One đang tăng 0,5% hoa hồng đến hết tuần</p>
              <p className="mt-2 text-sm text-slate-600">Khách mua sớm được hỗ trợ thêm, nhân viên kinh doanh chốt giữ chỗ đầu tiên nhận thưởng nóng 3 triệu.</p>
            </div>
            <Badge className="bg-emerald-100 text-emerald-700">Đẩy mạnh</Badge>
          </div>
        </Link>

        <Link
          to="/sales/product-center?tab=phap-ly"
          className="rounded-3xl border border-slate-200 bg-white p-5 transition-colors hover:bg-slate-50"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Mở nhanh khi khách hỏi</p>
              <p className="mt-2 text-lg font-bold text-slate-900">Pháp lý, bảng giá, hồ sơ giới thiệu và liên kết gửi khách</p>
          <p className="mt-2 text-sm text-slate-600">Bấm một chạm để lấy đúng tài liệu thay vì đi vòng qua nhiều màn.</p>
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <HeroCard
          title="Doanh số tháng"
          value={formatCurrency(data.hero.doanhSo)}
          subtitle="Mục tiêu 5 tỷ"
          icon={DollarSign}
          tone="green"
          link="/sales/finance-center?tab=doanh-thu"
        />
        <HeroCard
          title="Hoa hồng dự kiến"
          value={formatCurrency(data.hero.hoaHong)}
          subtitle="Tăng theo thưởng và KPI"
          icon={Award}
          tone="amber"
          link="/sales/finance-center?tab=hoa-hong"
        />
        <HeroCard
          title="Hạng hiện tại"
          value={`#${data.hero.xepHang}`}
          subtitle="Trong bảng thi đua tuần này"
          icon={Trophy}
          tone="blue"
          link="/sales/my-team"
        />
        <HeroCard
          title="Khách nóng hôm nay"
          value={data.hero.hotLeads}
          subtitle="Cần ưu tiên xử lý ngay"
          icon={Flame}
          tone="violet"
          link="/crm/leads"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2 h-full border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-[#316585]" />
              1. Việc hôm nay
            </CardTitle>
            <CardDescription>Nhìn là biết ngay hôm nay phải gọi ai, xử lý gì và bấm vào đâu.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-4">
              <Link to="/crm/leads" className="rounded-2xl border border-slate-200 bg-slate-50 p-4 transition-colors hover:bg-white">
                <p className="text-sm text-slate-500">Khách mới cần gọi</p>
                <p className="mt-2 text-3xl font-bold text-slate-900">{data.tasks.newLeads}</p>
              </Link>
              <Link to="/crm/leads" className="rounded-2xl border border-slate-200 bg-slate-50 p-4 transition-colors hover:bg-white">
                <p className="text-sm text-slate-500">Khách nóng chưa theo bám</p>
                <p className="mt-2 text-3xl font-bold text-slate-900">{data.tasks.hotLeads}</p>
              </Link>
              <Link to="/work/calendar" className="rounded-2xl border border-slate-200 bg-slate-50 p-4 transition-colors hover:bg-white">
                <p className="text-sm text-slate-500">Lịch hẹn hôm nay</p>
                <p className="mt-2 text-3xl font-bold text-slate-900">{data.tasks.meetings}</p>
              </Link>
              <Link to="/work/tasks" className="rounded-2xl border border-slate-200 bg-slate-50 p-4 transition-colors hover:bg-white">
                <p className="text-sm text-slate-500">Việc quá hạn</p>
                <p className="mt-2 text-3xl font-bold text-slate-900">{data.tasks.overdue}</p>
              </Link>
            </div>

            <div className="grid gap-3 md:grid-cols-4">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <Link
                    key={action.label}
                    to={action.link}
                    className="rounded-2xl border border-slate-200 bg-white p-4 transition-colors hover:bg-slate-50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#316585]/10">
                        <Icon className="h-5 w-5 text-[#316585]" />
                      </div>
                      <p className="font-semibold text-slate-900">{action.label}</p>
                    </div>
                  </Link>
                );
              })}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-900">Khách cần xử lý ngay</p>
                  <p className="mt-1 text-sm text-slate-500">Nhìn xong là biết ai cần gọi, gửi gì, hẹn gì.</p>
                </div>
                <Link to="/crm/leads" className="text-sm font-medium text-[#316585] hover:underline">
                  Mở danh sách khách
                </Link>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-3">
                {data.priorityLeads.map((lead) => (
                  <Link
                    key={lead.name}
                    to="/crm/leads"
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4 transition-colors hover:bg-white"
                  >
                    <p className="font-semibold text-slate-900">{lead.name}</p>
                    <p className="mt-2 text-sm text-slate-600">{lead.need}</p>
                    <p className="mt-3 text-sm font-medium text-[#316585]">{lead.nextAction}</p>
                  </Link>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="h-full border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-[#316585]" />
              2. Tiền & mục tiêu
            </CardTitle>
            <CardDescription>Biết ngay còn thiếu bao nhiêu để chạm mốc thưởng và KPI.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-900">Tiến độ mục tiêu tháng</p>
                  <p className="mt-1 text-sm text-slate-500">Mục tiêu 5 tỷ doanh số</p>
                </div>
                <span className="text-lg font-bold text-[#316585]">{data.targetProgress}%</span>
              </div>
              <div className="mt-3">
                <ProgressBar value={data.targetProgress} />
              </div>
            </div>
            {data.moneyMessages.map((message) => (
              <div key={message} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-start gap-2">
                  <Sparkles className="mt-0.5 h-4 w-4 text-[#316585]" />
                  <p className="text-sm text-slate-700">{message}</p>
                </div>
              </div>
            ))}
            <div className="flex flex-wrap gap-2 pt-1">
              <Link to="/sales/finance-center?tab=doanh-thu">
                <Button size="sm" variant="outline">Xem doanh thu</Button>
              </Link>
              <Link to="/sales/finance-center?tab=hoa-hong">
                <Button size="sm" className="bg-[#316585] hover:bg-[#264f68]">Xem hoa hồng</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2 h-full border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Flame className="h-5 w-5 text-[#316585]" />
              3. Sản phẩm ưu tiên / chính sách / pháp lý
            </CardTitle>
            <CardDescription>Bộ phận kinh doanh cần có ngay dự án đang đẩy, chính sách mới và pháp lý để gửi khách.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.hotProjects.map((project) => (
              <div key={project.title} className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-slate-900">{project.title}</p>
                  <Badge className="bg-red-100 text-red-700">Đang push</Badge>
                </div>
                <div className="mt-3 grid gap-3 md:grid-cols-3">
                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Giá / hoa hồng</p>
                    <p className="mt-1 text-sm font-semibold text-slate-800">{project.price}</p>
                    <p className="mt-1 text-sm text-slate-700">{project.commission}</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Chính sách</p>
                    <p className="mt-1 text-sm text-slate-700">{project.policy}</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Pháp lý</p>
                    <p className="mt-1 text-sm text-slate-700">{project.legal}</p>
                  </div>
                </div>
                <div className="mt-3 rounded-xl bg-amber-50 p-3">
                  <p className="text-xs uppercase tracking-[0.16em] text-amber-700">Sản phẩm nổi bật</p>
                  <p className="mt-1 text-sm text-amber-900">{project.inventory}</p>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link to="/sales/product-center?tab=du-an">
                    <Button size="sm" variant="outline">Xem nhanh</Button>
                  </Link>
                  <Link to="/sales/product-center?tab=tai-lieu">
                    <Button size="sm" variant="outline">Sao chép liên kết gửi khách</Button>
                  </Link>
                  <Link to="/sales/product-center?tab=phap-ly">
                    <Button size="sm" variant="outline">Mở pháp lý</Button>
                  </Link>
                  <Link to="/sales/product-center?tab=chinh-sach">
                    <Button size="sm" className="bg-[#316585] hover:bg-[#264f68]">Xem chính sách</Button>
                  </Link>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="h-full border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-[#316585]" />
              Chính sách thưởng nóng
            </CardTitle>
            <CardDescription>Nhìn là biết hôm nay công ty và chủ đầu tư đang đẩy gì cho đội kinh doanh.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.rewards.map((reward) => (
              <div key={reward.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-slate-900">{reward.title}</p>
                  <Badge className="bg-emerald-100 text-emerald-700">{reward.value}</Badge>
                </div>
                <p className="mt-2 text-sm text-slate-500">{reward.note}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card className="h-full border-slate-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Medal className="h-5 w-5 text-[#316585]" />
                4. Thi đua & bảng xếp hạng
              </CardTitle>
              <Link to="/sales/my-team" className="text-sm text-[#316585] hover:underline">
                Mở đội nhóm
              </Link>
            </div>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
            {data.leaderboard.map((item) => (
              <div
                key={item.rank}
                className={`rounded-2xl border p-4 text-center ${
                  item.name === 'Bạn' ? 'border-[#316585]/30 bg-[#316585]/[0.05]' : 'border-slate-200 bg-slate-50'
                }`}
              >
                <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Hạng</p>
                <p className="mt-2 text-3xl font-bold text-slate-900">#{item.rank}</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">{item.name}</p>
                <p className="text-xs text-slate-500">KPI {item.score}%</p>
                {item.name === 'Bạn' && (
                  <p className="mt-2 text-xs font-medium text-[#316585]">Thiếu 1 giữ chỗ để áp sát top 3</p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="h-full border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-[#316585]" />
              5. KPI tổng hợp
            </CardTitle>
            <CardDescription>KPI kinh doanh không chỉ là doanh số mà còn gồm tác phong, tuân thủ và đóng góp.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.kpi.map((item) => (
              <div key={item.label} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-slate-900">{item.label}</p>
                      {item.score < 75 && (
                        <Badge className="bg-amber-100 text-amber-700">Cần cải thiện</Badge>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-slate-600">{item.note}</p>
                  </div>
                  <p className="text-2xl font-bold text-slate-900">{item.score}%</p>
                </div>
                <div className="mt-3">
                  <ProgressBar value={item.score} />
                </div>
              </div>
            ))}
            <Link to="/kpi/my-performance" className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 text-sm font-medium text-[#316585] transition-colors hover:bg-slate-50">
              <span>Mở chi tiết KPI của tôi</span>
              <ChevronRight className="h-4 w-4" />
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-[#316585]" />
              6. Đội nhóm & thăng tiến
            </CardTitle>
            <CardDescription>Biết rõ ai đang dẫn đội, mình đang đứng đâu và còn thiếu gì để lên chức.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="font-semibold text-slate-900">Thủ lĩnh trực tiếp</p>
              <p className="mt-1 text-sm text-slate-600">{data.team.leader}</p>
              <p className="mt-3 font-semibold text-slate-900">Quản lý cấp trên</p>
              <p className="mt-1 text-sm text-slate-600">{data.team.manager}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link to="/sales/my-team">
                  <Button size="sm" variant="outline">Mở đội nhóm</Button>
                </Link>
                <Link to="/sales/my-team">
                  <Button size="sm" variant="outline">Xem thành viên trong nhóm</Button>
                </Link>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="font-semibold text-slate-900">Vị trí hiện tại của bạn</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">#{data.team.myRank}</p>
              <p className="mt-1 text-sm text-slate-600">{data.team.gap}</p>
            </div>
            {data.team.promotion.map((item) => (
              <div key={item.title} className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-slate-900">{item.title}</p>
                  <span className="text-sm font-semibold text-[#316585]">{item.progress}%</span>
                </div>
                <div className="mt-3">
                  <ProgressBar value={item.progress} />
                </div>
                <p className="mt-3 text-sm text-slate-500">{item.note}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-[#316585]" />
              Đi tiếp để lên hạng
            </CardTitle>
            <CardDescription>Nhìn nhanh mốc gần nhất và việc cần làm để tiến lên bậc cao hơn.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Việc nên làm để nhảy hạng</p>
              <ul className="mt-3 space-y-2 text-sm text-slate-700">
                <li>Chốt thêm 1 giữ chỗ chính thức để bám top 3.</li>
                <li>Cập nhật hệ thống khách hàng đầy đủ để kéo điểm tuân thủ lên trên 80%.</li>
                <li>Ưu tiên báo khách các dự án đang có thưởng nóng trong tuần.</li>
              </ul>
            </div>
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-sm font-semibold text-emerald-800">Mốc gần nhất</p>
              <p className="mt-2 text-sm text-emerald-900">
                Nếu đạt thêm 650 triệu doanh số, bạn vượt mốc thưởng gần nhất và được xét vào nhóm bám top tháng.
              </p>
            </div>
            <Link to="/sales/my-team" className="block">
              <Button className="w-full bg-[#316585] hover:bg-[#264f68]">Mở chi tiết đội nhóm</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
