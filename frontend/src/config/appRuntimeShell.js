import {
  BarChart3,
  Bell,
  BookOpen,
  Briefcase,
  Building2,
  Calendar,
  FileText,
  Flame,
  HandCoins,
  Home,
  KeyRound,
  LineChart,
  Megaphone,
  ShieldCheck,
  Target,
  TrendingUp,
  User,
  Users,
  Wallet,
  Wrench,
} from 'lucide-react';
import { DEFAULT_DASHBOARD, ROLES } from '@/config/navigation';

const ACTION_TONES = {
  blue: 'bg-sky-50 text-sky-700 border-sky-100',
  emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  amber: 'bg-amber-50 text-amber-700 border-amber-100',
  rose: 'bg-rose-50 text-rose-700 border-rose-100',
  violet: 'bg-violet-50 text-violet-700 border-violet-100',
  slate: 'bg-slate-50 text-slate-700 border-slate-100',
};

export const APP_RUNTIME_ROLES = [
  ROLES.SALES, ROLES.AGENCY, ROLES.MANAGER, ROLES.BOD, ROLES.MARKETING,
  ROLES.AUDIT, ROLES.PROJECT_DIRECTOR, ROLES.SALES_SUPPORT, ROLES.ADMIN,
  ROLES.HR, ROLES.CONTENT, ROLES.LEGAL, ROLES.FINANCE,
  'LEASING_MANAGER',
];

const ROLE_APP_RUNTIME = {
  [ROLES.SALES]: {
    role: ROLES.SALES,
    title: 'Ứng dụng kinh doanh',
    shortTitle: 'Kinh doanh',
    appFirst: true,
    homeRoute: '/app',
    accentClassName: 'from-[#16314f] via-[#264f68] to-[#316585]',
    stats: [
      { label: 'Lead nóng', value: '8', note: 'Cần gọi ngay', tone: 'rose' },
      { label: 'Giữ chỗ', value: '4', note: 'Đang mở hôm nay', tone: 'amber' },
      { label: 'Hoa hồng', value: '28 triệu', note: 'Dự kiến tháng này', tone: 'emerald' },
      { label: 'Lịch hẹn', value: '4', note: 'Trong ngày', tone: 'blue' },
    ],
    todayItems: [
      'Gọi lại 3 khách nóng trước 11h.',
      'Gửi bảng giá và pháp lý cho 2 khách gia đình.',
      'Chốt thêm 1 giữ chỗ để bám top 3 tháng này.',
    ],
    alerts: [
      { title: '8 khách nóng chưa liên hệ', note: 'Ưu tiên gọi ngay trong buổi sáng.', path: '/crm/leads?status=hot' },
      { title: 'Có 2 bộ pháp lý khách đang chờ', note: 'Mở trung tâm sản phẩm để gửi ngay.', path: '/sales/product-center' },
      { title: 'KPI còn thiếu 1,8 tỷ', note: 'Chốt thêm 1 giữ chỗ chính thức sẽ vào nhịp thưởng.', path: '/sales/kpi' },
    ],
    quickActions: [
      { label: 'Gọi khách nóng', path: '/crm/leads?status=hot', icon: Flame, tone: 'rose' },
      { label: 'Tạo lịch hẹn', path: '/work/calendar', icon: Briefcase, tone: 'blue' },
      { label: 'Đẩy giữ chỗ', path: '/sales/bookings', icon: ShieldCheck, tone: 'amber' },
      { label: 'Gửi tài liệu', path: '/sales/product-center', icon: BookOpen, tone: 'emerald' },
    ],
    tabs: [
      {
        key: 'khach-hang',
        label: 'Khách hàng',
        icon: Users,
        heading: 'Khách hàng cần xử lý',
        description: 'Theo dõi lead mới, khách đang theo và những trường hợp cần gọi lại ngay.',
        cards: [
          { label: 'Lead mới', value: '12', note: 'Từ quảng cáo và cộng tác viên', tone: 'blue' },
          { label: 'Đang theo', value: '28', note: 'Khách đang trong chuỗi chăm sóc', tone: 'emerald' },
          { label: 'Cần gọi', value: '6', note: 'Quá 1 ngày chưa chạm lại', tone: 'rose' },
          { label: 'Đã chốt', value: '3', note: 'Chốt trong 7 ngày gần nhất', tone: 'amber' },
        ],
        primaryAction: { label: 'Mở lead nóng', path: '/crm/leads?status=hot' },
        secondaryActions: [
          { label: 'Danh sách khách hàng', path: '/crm/contacts' },
          { label: 'Nguồn khách mới', path: '/crm/leads?status=new' },
          { label: 'Nhu cầu khách', path: '/crm/demands' },
        ],
      },
      {
        key: 'ban-hang',
        label: 'Bán hàng',
        icon: Target,
        heading: 'Nhịp giao dịch hôm nay',
        description: 'Theo phễu giao dịch, giữ chỗ và hợp đồng đang cần đẩy tiếp.',
        cards: [
          { label: 'Phễu giao dịch', value: '14', note: 'Cơ hội đang bám sát', tone: 'blue' },
          { label: 'Giữ chỗ tạm', value: '4', note: 'Cần xác nhận trong ngày', tone: 'amber' },
          { label: 'Chờ ký', value: '2', note: 'Cần bám khách và hồ sơ', tone: 'rose' },
          { label: 'Doanh số', value: '3,2 tỷ', note: 'Doanh số đang ghi nhận', tone: 'emerald' },
        ],
        primaryAction: { label: 'Mở phễu giao dịch', path: '/sales/pipeline' },
        secondaryActions: [
          { label: 'Giữ chỗ', path: '/sales/bookings' },
          { label: 'Hợp đồng', path: '/sales/contracts' },
          { label: 'Kanban giao dịch', path: '/sales/kanban' },
        ],
      },
      {
        key: 'san-pham',
        label: 'Sản phẩm',
        icon: Building2,
        heading: 'Hàng đang đẩy',
        description: 'Mở nhanh dự án, bảng giá, chính sách và pháp lý để gửi khách ngay.',
        cards: [
          { label: 'Dự án đẩy', value: '3', note: 'Dự án có chính sách tốt nhất tuần này', tone: 'blue' },
          { label: 'SP chọn lọc', value: '7', note: 'Căn góc, phong thủy đẹp', tone: 'emerald' },
          { label: 'Pháp lý sẵn gửi', value: '5', note: 'Có hồ sơ PDF đầy đủ', tone: 'amber' },
          { label: 'Chính sách nóng', value: '2', note: 'Đang tăng hoa hồng / thưởng nóng', tone: 'rose' },
        ],
        primaryAction: { label: 'Mở trung tâm sản phẩm', path: '/sales/product-center' },
        secondaryActions: [
          { label: 'Dự án đang bán', path: '/sales/projects' },
          { label: 'Bảng giá & chính sách', path: '/sales/pricing' },
          { label: 'Sản phẩm / giỏ hàng', path: '/sales/products' },
        ],
      },
      {
        key: 'tai-chinh',
        label: 'Tài chính',
        icon: Wallet,
        heading: 'Tiền của tôi',
        description: 'Theo dõi doanh số, hoa hồng, thưởng nóng và mốc KPI để nhận tiền.',
        cards: [
          { label: 'Hoa hồng chờ nhận', value: '28 triệu', note: 'Sắp đối soát', tone: 'emerald' },
          { label: 'Thưởng nóng', value: '3 triệu', note: 'Booking đầu tiên chiến dịch', tone: 'amber' },
          { label: 'KPI hiện tại', value: '78%', note: 'Còn thiếu 7 điểm để nhận thưởng', tone: 'blue' },
          { label: 'Mục tiêu tháng', value: 'Còn 1,8 tỷ', note: 'Để đạt mốc thưởng chính', tone: 'rose' },
        ],
        primaryAction: { label: 'Mở thu nhập của tôi', path: '/finance/my-income' },
        secondaryActions: [
          { label: 'Trung tâm tài chính', path: '/sales/finance-center' },
          { label: 'KPI của tôi', path: '/sales/kpi' },
          { label: 'Bảng thi đua', path: '/sales/kpi/leaderboard' },
        ],
      },
    ],
    extraLinks: [
      { label: 'Đội nhóm của tôi', path: '/sales/my-team' },
      { label: 'Kiến thức bán hàng', path: '/sales/knowledge-center' },
      { label: 'Hồ sơ của tôi', path: '/app/ho-so' },
    ],
  },
  [ROLES.AGENCY]: {
    role: ROLES.AGENCY,
    title: 'Ứng dụng cộng tác viên',
    shortTitle: 'Cộng tác viên',
    appFirst: true,
    homeRoute: '/app',
    accentClassName: 'from-[#0f3a53] via-[#1b6382] to-[#3294b8]',
    stats: [
      { label: 'Khách mới', value: '6', note: 'Trong 7 ngày gần nhất', tone: 'blue' },
      { label: 'Giữ chỗ', value: '2', note: 'Đang theo với đội kinh doanh', tone: 'amber' },
      { label: 'Hoa hồng', value: '18 triệu', note: 'Đang chờ nhận', tone: 'emerald' },
      { label: 'Tài liệu mới', value: '3', note: 'Dự án vừa cập nhật', tone: 'violet' },
    ],
    todayItems: [
      'Gửi lại bảng giá cho 2 khách đang so sánh dự án.',
      'Bám 2 giữ chỗ đang chờ xác nhận.',
      'Đẩy thêm 1 khách quan tâm vào đội kinh doanh trong hôm nay.',
    ],
    alerts: [
      { title: 'Có 2 khách đang chờ bảng giá mới', note: 'Mở phần tài liệu để gửi ngay.', path: '/sales/knowledge-center' },
      { title: '1 giữ chỗ cần cập nhật', note: 'Liên hệ đội kinh doanh để xác nhận.', path: '/sales/bookings' },
      { title: 'Hoa hồng sắp đối soát', note: 'Kiểm tra lại khách đã chốt và kỳ thanh toán.', path: '/finance/my-income' },
    ],
    quickActions: [
      { label: 'Gửi bảng giá', path: '/sales/product-center', icon: BookOpen, tone: 'blue' },
      { label: 'Mở giữ chỗ', path: '/sales/bookings', icon: ShieldCheck, tone: 'amber' },
      { label: 'Xem hoa hồng', path: '/finance/my-income', icon: Wallet, tone: 'emerald' },
      { label: 'Tài liệu bán hàng', path: '/sales/knowledge-center', icon: Building2, tone: 'violet' },
    ],
    tabs: [
      {
        key: 'khach-hang',
        label: 'Khách hàng',
        icon: Users,
        heading: 'Khách của tôi',
        description: 'Theo lead đã gửi, khách đang theo và những trường hợp cần chạm lại.',
        cards: [
          { label: 'Khách mới', value: '6', note: 'Chưa bàn giao hết', tone: 'blue' },
          { label: 'Đang theo', value: '11', note: 'Khách còn tương tác tốt', tone: 'emerald' },
          { label: 'Cần gọi lại', value: '3', note: 'Ưu tiên trong hôm nay', tone: 'rose' },
          { label: 'Đã chốt', value: '1', note: 'Đã ghi nhận hoa hồng', tone: 'amber' },
        ],
        primaryAction: { label: 'Mở nguồn khách', path: '/crm/leads' },
        secondaryActions: [
          { label: 'Danh sách khách', path: '/crm/contacts' },
          { label: 'Khách đang theo', path: '/crm/contacts?status=active' },
        ],
      },
      {
        key: 'ban-hang',
        label: 'Bán hàng',
        icon: HandCoins,
        heading: 'Giao dịch liên quan',
        description: 'Theo giữ chỗ, booking và cập nhật từ đội kinh doanh cho khách của bạn.',
        cards: [
          { label: 'Giữ chỗ tạm', value: '2', note: 'Đang chờ xác nhận', tone: 'amber' },
          { label: 'Đang tư vấn', value: '4', note: 'Khách cần follow thêm', tone: 'blue' },
          { label: 'Đã booking', value: '1', note: 'Khách đã chốt', tone: 'emerald' },
          { label: 'Chờ hợp đồng', value: '1', note: 'Cần bám hồ sơ', tone: 'rose' },
        ],
        primaryAction: { label: 'Mở giữ chỗ', path: '/sales/bookings' },
        secondaryActions: [
          { label: 'Tài liệu dự án', path: '/sales/product-center' },
          { label: 'Phễu giao dịch', path: '/sales/pipeline' },
        ],
      },
      {
        key: 'tai-chinh',
        label: 'Tài chính',
        icon: Wallet,
        heading: 'Hoa hồng của tôi',
        description: 'Theo kỳ đối soát, khoản chờ nhận và chính sách chia hoa hồng hiện tại.',
        cards: [
          { label: 'Chờ nhận', value: '18 triệu', note: 'Kỳ đối soát gần nhất', tone: 'emerald' },
          { label: 'Đã nhận', value: '42 triệu', note: 'Trong quý này', tone: 'blue' },
          { label: 'Đối soát mở', value: '2', note: 'Hai booking đang chờ đối soát', tone: 'amber' },
          { label: 'Sai khác cần kiểm', value: '1', note: 'Cần xác nhận với tài chính', tone: 'rose' },
        ],
        primaryAction: { label: 'Mở thu nhập của tôi', path: '/finance/my-income' },
        secondaryActions: [
          { label: 'Chính sách hoa hồng', path: '/finance/my-income?tab=policy' },
          { label: 'Trung tâm tài chính', path: '/finance/my-income?tab=overview' },
        ],
      },
      {
        key: 'tai-lieu',
        label: 'Tài liệu',
        icon: BookOpen,
        heading: 'Tài liệu để gửi khách',
        description: 'Bảng giá, pháp lý, brochure và tài liệu dự án đang dùng trong ngày.',
        cards: [
          { label: 'Dự án mở bán', value: '3', note: 'Có tài liệu đầy đủ', tone: 'blue' },
          { label: 'Bộ pháp lý', value: '5', note: 'Sẵn gửi khách', tone: 'emerald' },
          { label: 'Bảng giá mới', value: '2', note: 'Cập nhật trong tuần', tone: 'amber' },
          { label: 'FAQ dự án', value: '4', note: 'Có sẵn để xử lý phản đối', tone: 'violet' },
        ],
        primaryAction: { label: 'Mở trung tâm kiến thức', path: '/sales/knowledge-center' },
        secondaryActions: [
          { label: 'Trung tâm sản phẩm', path: '/sales/product-center' },
          { label: 'Dự án đang bán', path: '/sales/product-center?tab=du-an' },
        ],
      },
    ],
    extraLinks: [
      { label: 'Hồ sơ của tôi', path: '/app/ho-so' },
    ],
  },
  [ROLES.MANAGER]: {
    role: ROLES.MANAGER,
    title: 'Ứng dụng quản lý',
    shortTitle: 'Quản lý',
    appFirst: false,
    homeRoute: '/app',
    accentClassName: 'from-[#3d2a73] via-[#4f3f8a] to-[#6d56b8]',
    stats: [
      { label: 'Lead nóng', value: '14', note: 'Đội chưa xử lý hết', tone: 'rose' },
      { label: 'Giữ chỗ chờ duyệt', value: '7', note: 'Cần phản ứng trong ngày', tone: 'amber' },
      { label: 'Việc quá hạn', value: '5', note: 'Tập trung ở 2 nhân sự', tone: 'blue' },
      { label: 'Doanh số đội', value: '12,4 tỷ', note: 'Tiến độ tháng', tone: 'emerald' },
    ],
    todayItems: [
      'Gỡ 3 khách nóng chưa được chạm lại trong đội.',
      'Duyệt nhanh 2 booking và 1 chi phí nhỏ.',
      'Kéo 2 sale cuối bảng trở lại nhịp gọi khách.',
    ],
    alerts: [
      { title: '7 giữ chỗ chờ xử lý', note: 'Nếu chậm phản hồi sẽ ảnh hưởng tỷ lệ chốt.', path: '/sales/bookings?status=pending' },
      { title: '2 nhân sự rơi KPI tác phong', note: 'Cần nhắc nhịp và giao việc lại.', path: '/kpi/team' },
      { title: 'Lead nóng dồn về cuối ngày', note: 'Mở lead nóng để phân lại ngay.', path: '/crm/leads?status=hot' },
    ],
    quickActions: [
      { label: 'Lead nóng', path: '/crm/leads?status=hot', icon: Flame, tone: 'rose' },
      { label: 'Duyệt giữ chỗ', path: '/sales/bookings?status=pending', icon: ShieldCheck, tone: 'amber' },
      { label: 'KPI đội', path: '/kpi/team', icon: LineChart, tone: 'blue' },
      { label: 'Việc đội', path: '/work/manager', icon: Briefcase, tone: 'emerald' },
    ],
    tabs: [
      {
        key: 'khach-nong',
        label: 'Khách nóng',
        icon: Flame,
        heading: 'Khách nóng của đội',
        description: 'Nhìn nhanh những khách đang có nguy cơ mất nhịp hoặc cần quản lý can thiệp.',
        cards: [
          { label: 'Lead nóng', value: '14', note: 'Đang cần gọi ngay', tone: 'rose' },
          { label: 'Lead mới', value: '21', note: 'Tăng mạnh sau chiến dịch', tone: 'blue' },
          { label: 'Chậm follow', value: '5', note: 'Quá 24h chưa cập nhật', tone: 'amber' },
          { label: 'Có thể chốt', value: '3', note: 'Cần quản lý tham gia hỗ trợ', tone: 'emerald' },
        ],
        primaryAction: { label: 'Mở lead nóng', path: '/crm/leads?status=hot' },
        secondaryActions: [
          { label: 'Khách hàng đội', path: '/crm/contacts' },
          { label: 'Nhu cầu khách', path: '/crm/demands' },
        ],
      },
      {
        key: 'giu-cho',
        label: 'Giữ chỗ',
        icon: ShieldCheck,
        heading: 'Giữ chỗ và booking',
        description: 'Theo các yêu cầu giữ chỗ cần duyệt hoặc các booking có nguy cơ treo.',
        cards: [
          { label: 'Chờ duyệt', value: '7', note: 'Yêu cầu đang nằm trong hàng đợi', tone: 'amber' },
          { label: 'Sắp quá hạn', value: '3', note: 'Cần quản lý vào xử lý', tone: 'rose' },
          { label: 'Đã duyệt hôm nay', value: '5', note: 'Đội đang chạy tốt', tone: 'emerald' },
          { label: 'Bị treo', value: '1', note: 'Cần kiểm lại hồ sơ', tone: 'blue' },
        ],
        primaryAction: { label: 'Mở hàng đợi booking', path: '/sales/bookings?status=pending' },
        secondaryActions: [
          { label: 'Giữ chỗ tạm', path: '/sales/soft-bookings' },
          { label: 'Giữ chỗ chính thức', path: '/sales/hard-bookings' },
          { label: 'Hợp đồng chờ ký', path: '/sales/contracts' },
        ],
      },
      {
        key: 'doi-nhom',
        label: 'Đội nhóm',
        icon: Users,
        heading: 'Nhịp đội nhóm',
        description: 'Xem hiệu suất đội, người đang dẫn đầu và nhân sự cần kéo lên.',
        cards: [
          { label: 'Đang hoạt động', value: '18', note: 'Nhân sự có giao dịch trong tuần', tone: 'emerald' },
          { label: 'Top đầu', value: '3', note: 'Nhóm dẫn nhịp doanh số', tone: 'blue' },
          { label: 'Rơi KPI', value: '2', note: 'Cần coaching ngay', tone: 'rose' },
          { label: 'Việc quá hạn', value: '5', note: 'Tập trung ở 2 nhân sự', tone: 'amber' },
        ],
        primaryAction: { label: 'Mở KPI đội', path: '/kpi/team' },
        secondaryActions: [
          { label: 'Bảng điều hành quản lý', path: '/workspace' },
          { label: 'Khối lượng công việc', path: '/work/manager' },
          { label: 'Bảng thi đua', path: '/sales/kpi/leaderboard' },
        ],
      },
      {
        key: 'duyet',
        label: 'Duyệt nhanh',
        icon: ShieldCheck,
        heading: 'Hàng đợi cần duyệt',
        description: 'Những việc quản lý cần ra quyết định nhanh trên ứng dụng.',
        cards: [
          { label: 'Booking', value: '4', note: 'Chờ quản lý xác nhận', tone: 'amber' },
          { label: 'Chi phí nhỏ', value: '2', note: 'Chi phí đội phát sinh', tone: 'blue' },
          { label: 'KPI cần xác nhận', value: '1', note: 'Liên quan thưởng nóng', tone: 'emerald' },
          { label: 'Điểm nghẽn', value: '2', note: 'Đang chờ quản lý phản hồi', tone: 'rose' },
        ],
        primaryAction: { label: 'Mở duyệt nhanh', path: '/sales/bookings?status=pending' },
        secondaryActions: [
          { label: 'Booking chờ duyệt', path: '/sales/bookings?status=pending' },
          { label: 'Chi phí chờ duyệt', path: '/finance/expenses?status=pending' },
          { label: 'Việc quá hạn', path: '/work/tasks?status=overdue' },
        ],
      },
    ],
    extraLinks: [
      { label: 'Hồ sơ của tôi', path: '/app/ho-so' },
      { label: 'Mở website quản trị', path: '/workspace' },
    ],
  },
  [ROLES.BOD]: {
    role: ROLES.BOD,
    title: 'Ứng dụng điều hành nhanh',
    shortTitle: 'Lãnh đạo',
    appFirst: false,
    homeRoute: '/app',
    accentClassName: 'from-[#3a1f2d] via-[#5a2d45] to-[#7b4260]',
    stats: [
      { label: 'Doanh thu ngày', value: '3,8 tỷ', note: 'Cập nhật theo ngày', tone: 'emerald' },
      { label: 'Cảnh báo nóng', value: '5', note: 'Cần ra quyết định', tone: 'rose' },
      { label: 'Phê duyệt', value: '6', note: 'Đang chờ lãnh đạo', tone: 'amber' },
      { label: 'Tăng trưởng', value: '12%', note: 'So với tháng trước', tone: 'blue' },
    ],
    todayItems: [
      'Mở 3 cảnh báo nóng và quyết định trong ngày.',
      'Duyệt nhanh các khoản chờ phê duyệt cấp cao.',
      'Theo dõi doanh thu ngày và sức khỏe các dự án đang đẩy.',
    ],
    alerts: [
      { title: '5 cảnh báo điều hành mới', note: 'Tập trung vào doanh thu, chi phí và pháp lý.', path: '/control/alerts' },
      { title: '2 chi phí lớn chờ duyệt', note: 'Cần quyết định trong hôm nay.', path: '/finance/expenses?status=pending' },
      { title: '1 hồ sơ pháp lý quan trọng bị treo', note: 'Cần mở ngay để chỉ đạo xử lý.', path: '/legal/licenses' },
    ],
    quickActions: [
      { label: 'Cảnh báo nóng', path: '/control/alerts', icon: Bell, tone: 'rose' },
      { label: 'Duyệt nhanh', path: '/finance/expenses?status=pending', icon: ShieldCheck, tone: 'amber' },
      { label: 'Doanh thu ngày', path: '/analytics/executive', icon: LineChart, tone: 'emerald' },
      { label: 'Đội nhóm', path: '/kpi/team', icon: Users, tone: 'blue' },
    ],
    tabs: [
      {
        key: 'canh-bao',
        label: 'Cảnh báo',
        icon: Bell,
        heading: 'Cảnh báo điều hành',
        description: 'Nhìn nhanh những điểm nghẽn cần lãnh đạo vào quyết định ngay.',
        cards: [
          { label: 'Doanh thu', value: '2', note: 'Dự án hụt nhịp', tone: 'rose' },
          { label: 'Chi phí', value: '2', note: 'Khoản lớn chờ duyệt', tone: 'amber' },
          { label: 'Pháp lý', value: '1', note: 'Hồ sơ đang treo', tone: 'blue' },
          { label: 'Nhân sự', value: '1', note: 'Đội nhóm thiếu lực', tone: 'emerald' },
        ],
        primaryAction: { label: 'Mở trung tâm cảnh báo', path: '/control/alerts' },
        secondaryActions: [
          { label: 'Bảng điều hành', path: '/control' },
          { label: 'Tổng quan lãnh đạo', path: '/analytics/executive' },
        ],
      },
      {
        key: 'duyet',
        label: 'Phê duyệt',
        icon: ShieldCheck,
        heading: 'Phê duyệt nhanh',
        description: 'Mọi quyết định cần lãnh đạo chốt nhanh trên ứng dụng.',
        cards: [
          { label: 'Booking lớn', value: '2', note: 'Vượt ngưỡng quản lý', tone: 'amber' },
          { label: 'Chi phí', value: '2', note: 'Khoản phát sinh cần ký duyệt', tone: 'rose' },
          { label: 'Pháp lý', value: '1', note: 'Cần chấp thuận gấp', tone: 'blue' },
          { label: 'Chính sách', value: '1', note: 'Đang chờ duyệt phát hành', tone: 'emerald' },
        ],
        primaryAction: { label: 'Mở hàng chờ phê duyệt', path: '/finance/expenses?status=pending' },
        secondaryActions: [
          { label: 'Booking chờ duyệt', path: '/sales/bookings?status=pending' },
          { label: 'Chi phí chờ duyệt', path: '/finance/expenses?status=pending' },
          { label: 'Pháp lý cần xem', path: '/contracts/pending' },
        ],
      },
      {
        key: 'doanh-thu',
        label: 'Doanh thu',
        icon: LineChart,
        heading: 'Doanh thu và tăng trưởng',
        description: 'Theo dõi sức khỏe doanh thu ngắn hạn và các mốc tăng trưởng của doanh nghiệp.',
        cards: [
          { label: 'Doanh thu ngày', value: '3,8 tỷ', note: 'Hôm nay', tone: 'emerald' },
          { label: 'Doanh thu tháng', value: '86 tỷ', note: 'Tính đến hiện tại', tone: 'blue' },
          { label: 'Tăng trưởng', value: '12%', note: 'So với tháng trước', tone: 'amber' },
          { label: 'Dòng tiền', value: 'Ổn định', note: 'Không có cảnh báo ngắn hạn', tone: 'violet' },
        ],
        primaryAction: { label: 'Mở góc nhìn lãnh đạo', path: '/analytics/executive' },
        secondaryActions: [
          { label: 'Tổng quan tài chính', path: '/finance/overview' },
          { label: 'Báo cáo', path: '/analytics/reports' },
        ],
      },
      {
        key: 'doi-nhom',
        label: 'Đội nhóm',
        icon: Users,
        heading: 'Hiệu suất đội nhóm',
        description: 'Xem nhanh đội nào đang dẫn đầu và nơi nào cần lãnh đạo can thiệp.',
        cards: [
          { label: 'Đội vượt kế hoạch', value: '2', note: 'Đang kéo tăng trưởng', tone: 'emerald' },
          { label: 'Đội chậm nhịp', value: '1', note: 'Cần hỗ trợ ngay', tone: 'rose' },
          { label: 'Quản lý nổi bật', value: '3', note: 'Đang dẫn đầu thi đua', tone: 'blue' },
          { label: 'Vấn đề nhân sự', value: '1', note: 'Cần điều phối thêm nguồn lực', tone: 'amber' },
        ],
        primaryAction: { label: 'Mở hiệu suất đội', path: '/kpi/team' },
        secondaryActions: [
          { label: 'KPI đội', path: '/kpi/team' },
          { label: 'Khối lượng công việc', path: '/work/manager' },
        ],
      },
    ],
    extraLinks: [
      { label: 'Hồ sơ điều hành', path: '/app/ho-so' },
      { label: 'Mở website quản trị', path: '/workspace' },
    ],
  },
  [ROLES.MARKETING]: {
    role: ROLES.MARKETING,
    title: 'Ứng dụng marketing nhanh',
    shortTitle: 'Marketing',
    appFirst: false,
    homeRoute: '/app',
    accentClassName: 'from-[#0d4638] via-[#12624d] to-[#178368]',
    stats: [
      { label: 'Chiến dịch chạy', value: '4', note: 'Đang tiêu ngân sách', tone: 'emerald' },
      { label: 'Lead mới', value: '26', note: 'Từ 24 giờ gần nhất', tone: 'blue' },
      { label: 'Kênh cần xử lý', value: '3', note: 'Hiệu suất tụt', tone: 'amber' },
      { label: 'Biểu mẫu lỗi', value: '1', note: 'Cần kiểm gấp', tone: 'rose' },
    ],
    todayItems: [
      'Theo dõi 2 chiến dịch đang đẩy lead mạnh nhất.',
      'Bàn giao lead nóng cho kinh doanh trong ngày.',
      'Kiểm tra ngay 1 biểu mẫu có dấu hiệu hụt lead.',
    ],
    alerts: [
      { title: '1 biểu mẫu có dấu hiệu lỗi', note: 'Cần mở lại kênh và CTA ngay.', path: '/marketing/forms' },
      { title: '3 kênh đang giảm chất lượng lead', note: 'Mở phân bổ nguồn để xử lý.', path: '/marketing/sources' },
      { title: 'Campaign A tăng lead đột biến', note: 'Cần theo dõi chất lượng và giao sale.', path: '/marketing/campaigns' },
    ],
    quickActions: [
      { label: 'Mở chiến dịch', path: '/marketing/campaigns', icon: Megaphone, tone: 'emerald' },
      { label: 'Nguồn khách', path: '/marketing/sources', icon: Users, tone: 'blue' },
      { label: 'Biểu mẫu', path: '/marketing/forms', icon: ShieldCheck, tone: 'amber' },
      { label: 'Kênh', path: '/communications/channels', icon: TrendingUp, tone: 'rose' },
    ],
    tabs: [
      {
        key: 'chien-dich',
        label: 'Chiến dịch',
        icon: Megaphone,
        heading: 'Chiến dịch đang chạy',
        description: 'Xem nhanh chiến dịch nào đang tạo lead tốt và chiến dịch nào cần can thiệp.',
        cards: [
          { label: 'Đang chạy', value: '4', note: 'Chiến dịch có ngân sách mở', tone: 'emerald' },
          { label: 'Tạm dừng', value: '1', note: 'Cần kiểm lại nội dung / tệp', tone: 'amber' },
          { label: 'Hiệu suất tốt', value: '2', note: 'Lead chất lượng cao', tone: 'blue' },
          { label: 'Cần cứu', value: '1', note: 'Giảm CPL / giảm chất lượng', tone: 'rose' },
        ],
        primaryAction: { label: 'Mở chiến dịch', path: '/marketing/campaigns' },
        secondaryActions: [
          { label: 'Bảng điều hành marketing', path: '/marketing' },
          { label: 'Phân bổ lead', path: '/marketing/rules' },
        ],
      },
      {
        key: 'khach-moi',
        label: 'Khách mới',
        icon: Users,
        heading: 'Lead mới trong ngày',
        description: 'Theo số lượng lead mới, nguồn về và tốc độ bàn giao sang kinh doanh.',
        cards: [
          { label: 'Lead mới', value: '26', note: '24 giờ gần nhất', tone: 'blue' },
          { label: 'Bàn giao nhanh', value: '18', note: 'Đã giao sale xử lý', tone: 'emerald' },
          { label: 'Chờ xử lý', value: '6', note: 'Cần gán người nhận', tone: 'amber' },
          { label: 'Bất thường', value: '2', note: 'Lead chất lượng kém', tone: 'rose' },
        ],
        primaryAction: { label: 'Mở nguồn khách', path: '/marketing/sources' },
        secondaryActions: [
          { label: 'Lead CRM', path: '/crm/leads' },
          { label: 'Attribution', path: '/marketing/attribution' },
        ],
      },
      {
        key: 'kenh',
        label: 'Kênh',
        icon: TrendingUp,
        heading: 'Kênh và nội dung',
        description: 'Theo dõi kênh nào đang khỏe, kênh nào đang yếu, nội dung nào đang kéo lead.',
        cards: [
          { label: 'Kênh khỏe', value: '3', note: 'Hiệu suất tốt nhất tuần', tone: 'emerald' },
          { label: 'Kênh yếu', value: '2', note: 'Cần đổi nội dung / CTA', tone: 'rose' },
          { label: 'Nội dung nổi bật', value: '5', note: 'CTR và lead tốt', tone: 'blue' },
          { label: 'CTA cần sửa', value: '1', note: 'Đang ảnh hưởng chuyển đổi', tone: 'amber' },
        ],
        primaryAction: { label: 'Mở kênh marketing', path: '/communications/channels' },
        secondaryActions: [
          { label: 'Nội dung', path: '/communications/content' },
          { label: 'Mẫu phản hồi', path: '/communications/templates' },
        ],
      },
      {
        key: 'canh-bao',
        label: 'Cảnh báo',
        icon: Bell,
        heading: 'Cảnh báo marketing',
        description: 'Những điểm gãy cần phản ứng nhanh trước khi ảnh hưởng lead và ngân sách.',
        cards: [
          { label: 'Form lỗi', value: '1', note: 'Cần xử lý ngay', tone: 'rose' },
          { label: 'Ngân sách lệch', value: '2', note: 'Vượt phân bổ dự kiến', tone: 'amber' },
          { label: 'Lead chất lượng thấp', value: '3', note: 'Cần xem lại tệp / nội dung', tone: 'blue' },
          { label: 'Kênh tụt mạnh', value: '1', note: 'Cần đổi hướng triển khai', tone: 'emerald' },
        ],
        primaryAction: { label: 'Mở cảnh báo marketing', path: '/marketing' },
        secondaryActions: [
          { label: 'Biểu mẫu', path: '/marketing/forms' },
          { label: 'Attribution', path: '/marketing/attribution' },
        ],
      },
    ],
    extraLinks: [
      { label: 'Hồ sơ của tôi', path: '/app/ho-so' },
      { label: 'Mở website quản trị', path: '/workspace' },
    ],
  },

  // ===================================================
  // LEASING MANAGER — Quản lý cho thuê & vận hành
  // (Port từ ProLeazing)
  // ===================================================
  LEASING_MANAGER: {
    role: 'LEASING_MANAGER',
    title: 'Ứng dụng Cho thuê & Vận hành',
    shortTitle: 'Cho thuê',
    appFirst: true,
    homeRoute: '/app',
    accentClassName: 'from-[#0f3d2e] via-[#155e3a] to-[#1a7a4a]',
    stats: [
      { label: 'Tỉ lệ lấp đầy', value: '87%', note: 'Tài sản đang cho thuê', tone: 'emerald' },
      { label: 'HĐ sắp hết hạn', value: '4', note: 'Trong vòng 30 ngày', tone: 'amber' },
      { label: 'Sự cố mở', value: '3', note: 'Chưa xử lý xong', tone: 'rose' },
      { label: 'Chờ trả chủ nhà', value: '28tr', note: 'Trước ngày 10', tone: 'blue' },
    ],
    todayItems: [
      'Liên hệ gia hạn 2 hợp đồng sắp hết trong tháng.',
      'Xử lý 1 sự cố kỹ thuật đang mở tại tòa A.',
      'Tạo hóa đơn tiền thuê tháng này cho 5 khách.',
    ],
    alerts: [
      { title: '4 hợp đồng sắp hết hạn', note: 'Liên hệ khách thuê để gia hạn hoặc chuẩn bị tìm khách mới.', path: '/leasing/contracts' },
      { title: '3 yêu cầu bảo trì đang mở', note: 'Cần phân công kỹ thuật viên và cập nhật tiến độ.', path: '/leasing/maintenance' },
      { title: '5 tài sản đang trống', note: 'Đẩy mạnh tìm kiếm khách thuê mới.', path: '/leasing/assets' },
    ],
    quickActions: [
      { label: 'Thêm tài sản', path: '/leasing/assets/new', icon: Home, tone: 'emerald' },
      { label: 'Tạo hợp đồng', path: '/leasing/contracts/new', icon: KeyRound, tone: 'blue' },
      { label: 'Ghi sự cố', path: '/leasing/maintenance/new', icon: Wrench, tone: 'rose' },
      { label: 'Tạo hóa đơn', path: '/leasing/invoices/new', icon: Wallet, tone: 'amber' },
    ],
    tabs: [
      {
        key: 'tai-san',
        label: 'Tài sản',
        icon: Home,
        heading: 'Quản lý tài sản cho thuê',
        description: 'Danh sách căn hộ, nhà phố, mặt bằng đang quản lý — trạng thái và thông tin chủ nhà.',
        cards: [
          { label: 'Tổng tài sản', value: '42', note: 'Đang quản lý', tone: 'blue' },
          { label: 'Đang cho thuê', value: '37', note: 'Có hợp đồng hiệu lực', tone: 'emerald' },
          { label: 'Đang trống', value: '5', note: 'Cần tìm khách mới', tone: 'rose' },
          { label: 'Chờ bàn giao', value: '2', note: 'Vừa ký hợp đồng mới', tone: 'amber' },
        ],
        primaryAction: { label: 'Mở danh sách tài sản', path: '/leasing/assets' },
        secondaryActions: [
          { label: 'Thêm tài sản mới', path: '/leasing/assets/new' },
          { label: 'Tài sản đang trống', path: '/leasing/assets?status=available' },
          { label: 'Chủ nhà', path: '/leasing/owners' },
        ],
      },
      {
        key: 'hop-dong',
        label: 'Hợp đồng',
        icon: KeyRound,
        heading: 'Hợp đồng thuê',
        description: 'Theo dõi hợp đồng đang hiệu lực, sắp hết hạn và quá trình gia hạn.',
        cards: [
          { label: 'Đang hiệu lực', value: '37', note: 'Hợp đồng đang chạy', tone: 'emerald' },
          { label: 'Sắp hết hạn', value: '4', note: 'Trong 30 ngày tới', tone: 'amber' },
          { label: 'Chờ ký', value: '2', note: 'Đã soạn, chờ chữ ký', tone: 'blue' },
          { label: 'Đã chấm dứt', value: '8', note: 'Trong tháng này', tone: 'rose' },
        ],
        primaryAction: { label: 'Mở danh sách hợp đồng', path: '/leasing/contracts' },
        secondaryActions: [
          { label: 'Tạo hợp đồng mới', path: '/leasing/contracts/new' },
          { label: 'HĐ sắp hết hạn', path: '/leasing/contracts?filter=expiring' },
          { label: 'Khách thuê', path: '/leasing/tenants' },
        ],
      },
      {
        key: 'bao-tri',
        label: 'Bảo trì',
        icon: Wrench,
        heading: 'Yêu cầu bảo trì & sự cố',
        description: 'Ghi nhận, phân công và theo dõi tiến độ xử lý sự cố tại các tài sản.',
        cards: [
          { label: 'Đang mở', value: '3', note: 'Chưa xử lý xong', tone: 'rose' },
          { label: 'Đã phân công', value: '5', note: 'Kỹ thuật đang xử lý', tone: 'amber' },
          { label: 'Hoàn thành tuần', value: '9', note: 'Đóng trong 7 ngày qua', tone: 'emerald' },
          { label: 'Ưu tiên cao', value: '1', note: 'Cần xử lý trong ngày', tone: 'blue' },
        ],
        primaryAction: { label: 'Mở sự cố', path: '/leasing/maintenance' },
        secondaryActions: [
          { label: 'Ghi nhận sự cố mới', path: '/leasing/maintenance/new' },
          { label: 'Nhà cung cấp', path: '/leasing/vendors' },
        ],
      },
      {
        key: 'tai-chinh-cho-thue',
        label: 'Tài chính',
        icon: Wallet,
        heading: 'Thu chi & doanh thu cho thuê',
        description: 'Hóa đơn tiền thuê, thanh toán, sao kê chủ nhà và báo cáo doanh thu kỳ.',
        cards: [
          { label: 'Thu tháng này', value: '186tr', note: 'Tiền thuê đã thu', tone: 'emerald' },
          { label: 'Chưa thu', value: '24tr', note: 'Khách chưa thanh toán', tone: 'rose' },
          { label: 'Chờ trả chủ nhà', value: '28tr', note: 'Cần chuyển trước ngày 10', tone: 'amber' },
          { label: 'Phí dịch vụ', value: '18tr', note: 'Doanh thu vận hành tháng', tone: 'blue' },
        ],
        primaryAction: { label: 'Mở hóa đơn', path: '/leasing/invoices' },
        secondaryActions: [
          { label: 'Tạo hóa đơn', path: '/leasing/invoices/new' },
          { label: 'Sao kê chủ nhà', path: '/leasing/revenue' },
          { label: 'Báo cáo tài chính', path: '/leasing/reports' },
        ],
      },
    ],
    extraLinks: [
      { label: 'Nhân viên vận hành', path: '/leasing/staff' },
      { label: 'Tài liệu hợp đồng', path: '/leasing/documents' },
      { label: 'Hồ sơ của tôi', path: '/app/ho-so' },
    ],
  },
  // ── Ban Kiểm soát / HĐQT (AUDIT) ────────────────────────────────────
  [ROLES.AUDIT]: {
    role: ROLES.AUDIT,
    title: 'Ban Kiểm soát',
    shortTitle: 'Audit',
    appFirst: true,
    homeRoute: '/app',
    accentClassName: 'from-[#1e293b] via-[#334155] to-[#374151]',
    stats: [
      { label: 'Cảnh báo', value: '3', note: 'Chưa xử lý', tone: 'rose' },
      { label: 'Giao dịch', value: '142', note: 'Tháng này', tone: 'blue' },
      { label: 'Hoa hồng', value: '2,4 tỷ', note: 'Chờ đối soát', tone: 'amber' },
      { label: 'Nhân sự', value: '124', note: 'Nhân viên active', tone: 'emerald' },
    ],
    todayItems: [
      'Xác nhận 3 giao dịch bất thường.',
      'Xử lý báo cáo kiểm toán tháng 4.',
      'Phê duyệt biên bản HĐQT.',
    ],
    alerts: [
      { title: '3 giao dịch hoa hồng chưa đối soát', note: 'Cần xác nhận với khối tài chính.', path: '/audit/finance' },
      { title: 'Báo cáo tháng 4 sẵn sàng', note: 'Xem xét và đóng báo cáo kiểm toán.', path: '/audit/reports' },
    ],
    quickActions: [
      { label: 'Tài chính', path: '/audit/finance', icon: TrendingUp, tone: 'emerald' },
      { label: 'Nhân sự', path: '/audit/hr', icon: Users, tone: 'blue' },
      { label: 'Báo cáo', path: '/audit/reports', icon: BarChart3, tone: 'amber' },
      { label: 'Hồ sơ tôi', path: '/profile', icon: User, tone: 'slate' },
    ],
    tabs: [],
    extraLinks: [],
  },

  // ── Giám đốc Dự án (PROJECT_DIRECTOR) ──────────────────────────────────
  [ROLES.PROJECT_DIRECTOR]: {
    role: ROLES.PROJECT_DIRECTOR,
    title: 'Giám đốc Dự án',
    shortTitle: 'GĐ Dự án',
    appFirst: true,
    homeRoute: '/app',
    accentClassName: 'from-[#3b0764] via-[#6d28d9] to-[#7c3aed]',
    stats: [
      { label: 'Booking chờ duyệt', value: '5', note: 'Cần duyệt ngay', tone: 'rose' },
      { label: 'Sales team', value: '18', note: 'Nhân viên active', tone: 'blue' },
      { label: 'Doanh số tháng', value: '12,4 tỷ', note: 'Tại dự án', tone: 'emerald' },
      { label: 'Tỉ lệ chuyển đổi', value: '14%', note: 'Lead → Booking', tone: 'amber' },
    ],
    todayItems: [
      'Duyệt 5 booking đang chờ xử lý.',
      'Họn cập nhật tiến độ với Chủ Đầu tư lúc 14h.',
      'Review KPI tuần của đội sales.',
    ],
    alerts: [
      { title: '5 booking mới chưa duyệt', note: 'Giữ chỗ cần xác nhận trong ngày.', path: '/sales/bookings?status=pending' },
      { title: '2 nhân viên KPI dưới mức', note: 'Cần can thiệp động viên.', path: '/kpi/team' },
    ],
    quickActions: [
      { label: 'Duyệt booking', path: '/sales/bookings?status=pending', icon: ShieldCheck, tone: 'rose' },
      { label: 'KPI đội sales', path: '/kpi/team', icon: BarChart3, tone: 'blue' },
      { label: 'Giỏ hàng', path: '/sales/catalog', icon: Building2, tone: 'emerald' },
      { label: 'Xếp hạng', path: '/kpi/leaderboard', icon: TrendingUp, tone: 'amber' },
    ],
    tabs: [],
    extraLinks: [],
  },

  // ── Hỗ trợ Nghiệp vụ (SALES_SUPPORT) ────────────────────────────────────
  [ROLES.SALES_SUPPORT]: {
    role: ROLES.SALES_SUPPORT,
    title: 'Hỗ trợ Nghiệp vụ',
    shortTitle: 'Sales Support',
    appFirst: true,
    homeRoute: '/app',
    accentClassName: 'from-[#0c4a6e] via-[#0369a1] to-[#0891b2]',
    stats: [
      { label: 'Hồ sơ đang xử lý', value: '7', note: 'Pending', tone: 'amber' },
      { label: 'Đã hoàn thành', value: '23', note: 'Tháng này', tone: 'emerald' },
      { label: 'Khách CSKH', value: '4', note: 'Đang theo dõi', tone: 'blue' },
      { label: 'Quá hạn', value: '2', note: 'Cần đẩy ngay', tone: 'rose' },
    ],
    todayItems: [
      'Kiểm tra hồ sơ booking KH Nguyễn Văn A.',
      'Chuẩn bị HH đặt cọc phòng B1205.',
      'Nhắc thanh toán đợt 2 cho KH Trần Thị B.',
    ],
    alerts: [
      { title: '2 hồ sơ quá hạn xử lý', note: 'Cần upload gấp lên hệ thống chủ đầu tư.', path: '/sales/bookings' },
      { title: 'KH hỏi tiến độ bàn giao', note: 'Phản hồi trong ngày.', path: '/crm/contacts' },
    ],
    quickActions: [
      { label: 'Hồ sơ booking', path: '/sales/bookings', icon: FileText, tone: 'blue' },
      { label: 'Danh sách KH', path: '/crm/contacts', icon: Users, tone: 'emerald' },
      { label: 'Lịch làm việc', path: '/work/calendar', icon: Calendar, tone: 'violet' },
      { label: 'Hồ sơ tôi', path: '/profile', icon: User, tone: 'slate' },
    ],
    tabs: [],
    extraLinks: [],
  },

  // ── Nhân sự (HR) ──────────────────────────────────────────────
  [ROLES.HR]: {
    role: ROLES.HR,
    title: 'Ứng dụng Nhân sự',
    shortTitle: 'Nhân sự',
    appFirst: true,
    homeRoute: '/app',
    accentClassName: 'from-[#0c4a6e] via-[#0369a1] to-[#0891b2]',
    stats: [
      { label: 'Nhân viên active', value: '124', note: 'Đang làm việc', tone: 'emerald' },
      { label: 'Tuyển dụng', value: '8', note: 'Vị trí đang mở', tone: 'blue' },
      { label: 'Nghỉ phép', value: '5', note: 'Chờ duyệt hôm nay', tone: 'amber' },
      { label: 'Hợp đồng hết hạn', value: '3', note: 'Trong 30 ngày tới', tone: 'rose' },
    ],
    todayItems: [
      'Duyệt 5 đơn nghỉ phép đang chờ.',
      'Phỏng vấn 2 ứng viên lúc 14h.',
      'Gửi thông báo lương tháng 4.',
    ],
    alerts: [
      { title: '3 hợp đồng sắp hết hạn', note: 'Liên hệ gia hạn hoặc chuẩn bị thủ tục.', path: '/app/recruitment' },
      { title: '5 đơn nghỉ phép chờ duyệt', note: 'Cần phản hồi trong ngày.', path: '/app/approvals' },
    ],
    quickActions: [
      { label: 'Nhân viên', path: '/kpi/team', icon: Users, tone: 'blue' },
      { label: 'Tuyển dụng', path: '/app/recruitment', icon: Users, tone: 'emerald' },
      { label: 'Bảng lương', path: '/app/payroll', icon: Wallet, tone: 'amber' },
      { label: 'Duyệt', path: '/app/approvals', icon: ShieldCheck, tone: 'rose' },
    ],
    tabs: [],
    extraLinks: [],
  },

  // ── Content / Website CMS ─────────────────────────────────────────
  [ROLES.CONTENT]: {
    role: ROLES.CONTENT,
    title: 'Ứng dụng Nội dung',
    shortTitle: 'Content',
    appFirst: true,
    homeRoute: '/app',
    accentClassName: 'from-[#3b0764] via-[#6d28d9] to-[#7c3aed]',
    stats: [
      { label: 'Bài viết đã đăng', value: '14', note: 'Tuần này', tone: 'emerald' },
      { label: 'Chờ duyệt', value: '3', note: 'Cần admin phê duyệt', tone: 'amber' },
      { label: 'Lượt xem', value: '12.4K', note: '7 ngày gần nhất', tone: 'blue' },
      { label: 'Lịch đăng hôm nay', value: '2', note: 'Cần chuẩn bị', tone: 'rose' },
    ],
    todayItems: [
      'Hoàn thiện 2 bài cẩm nang BDS lúc 10h.',
      'Upload video giới thiệu dự án mới.',
      'Lên lịch nội dung tuần tới.',
    ],
    alerts: [
      { title: '3 bài viết chờ duyệt', note: 'Gửi lại admin để xuất bản.', path: '/cms/articles' },
      { title: '2 bài viết lên lịch hôm nay', note: 'Kiểm tra lại trước khi đăng.', path: '/cms/articles' },
    ],
    quickActions: [
      { label: 'Bài viết', path: '/cms/articles', icon: BookOpen, tone: 'violet' },
      { label: 'Tin tức', path: '/cms/news', icon: BarChart3, tone: 'blue' },
      { label: 'Media', path: '/cms/media', icon: Target, tone: 'rose' },
      { label: 'Lịch đăng', path: '/work/calendar', icon: Calendar, tone: 'emerald' },
    ],
    tabs: [],
    extraLinks: [],
  },

  // ── Pháp lý (LEGAL) ───────────────────────────────────────────────
  [ROLES.LEGAL]: {
    role: ROLES.LEGAL,
    title: 'Ứng dụng Pháp lý',
    shortTitle: 'Pháp lý',
    appFirst: true,
    homeRoute: '/app',
    accentClassName: 'from-[#451a03] via-[#92400e] to-[#b45309]',
    stats: [
      { label: 'Hồ sơ chờ duyệt', value: '5', note: 'Cần kiểm tra pháp lý', tone: 'amber' },
      { label: 'Hợp đồng mới', value: '3', note: 'Cần soạn thảo', tone: 'blue' },
      { label: 'Bàn giao tuần', value: '7', note: 'Hồ sơ đã xử lý', tone: 'emerald' },
      { label: 'Vi phạm', value: '1', note: 'Cần xử lý gấp', tone: 'rose' },
    ],
    todayItems: [
      'Kiểm tra hồ sơ pháp lý 3 booking mới.',
      'Gửi hợp đồng cho KH Trần Văn A.',
      'Phản hồi vi phạm với Trưởng phòng.',
    ],
    alerts: [
      { title: '5 hồ sơ booking chờ kiểm pháp lý', note: 'Cần xác nhận trước khi xuất hợp đồng.', path: '/sales/bookings' },
      { title: '1 vi phạm hợp đồng', note: 'Cần xử lý gấp với bộ phận liên quan.', path: '/app/approvals' },
    ],
    quickActions: [
      { label: 'Hồ sơ', path: '/sales/bookings', icon: FileText, tone: 'amber' },
      { label: 'Phê duyệt', path: '/app/approvals', icon: ShieldCheck, tone: 'rose' },
      { label: 'Lịch', path: '/work/calendar', icon: Calendar, tone: 'blue' },
      { label: 'KH', path: '/crm/contacts', icon: Users, tone: 'emerald' },
    ],
    tabs: [],
    extraLinks: [],
  },

  // ── Kế toán / Tài chính (FINANCE) ────────────────────────────────────
  [ROLES.FINANCE]: {
    role: ROLES.FINANCE,
    title: 'Ứng dụng Kế toán',
    shortTitle: 'Kế toán',
    appFirst: true,
    homeRoute: '/app',
    accentClassName: 'from-[#052e16] via-[#14532d] to-[#15803d]',
    stats: [
      { label: 'Hoa hồng chờ đối soát', value: '2,4 tỷ', note: 'Tháng này', tone: 'emerald' },
      { label: 'Hóa đơn chờ', value: '12', note: 'Cần xuất', tone: 'amber' },
      { label: 'Chi phí chờ duyệt', value: '5', note: 'Khoản phát sinh', tone: 'rose' },
      { label: 'Tổng thu tháng', value: '86 tỷ', note: 'Tính đến hiện tại', tone: 'blue' },
    ],
    todayItems: [
      'Đối soát hoa hồng 15 booking tháng 4.',
      'Xuất hóa đơn cho 3 khách thanh toán đợt 2.',
      'Gửi báo cáo tài chính tuần cho quản lý.',
    ],
    alerts: [
      { title: '5 chi phí chờ duyệt', note: 'Cần lãnh đạo phê duyệt sớm.', path: '/app/approvals' },
      { title: '12 hóa đơn chưa xuất', note: 'Tương ứng với các đợt thanh toán mới.', path: '/app/finance-report' },
    ],
    quickActions: [
      { label: 'Thu chi', path: '/finance/my-income', icon: Wallet, tone: 'emerald' },
      { label: 'Báo cáo TC', path: '/app/finance-report', icon: BarChart3, tone: 'blue' },
      { label: 'Phê duyệt', path: '/app/approvals', icon: ShieldCheck, tone: 'rose' },
      { label: 'Bảng lương', path: '/app/payroll', icon: Wallet, tone: 'amber' },
    ],
    tabs: [],
    extraLinks: [],
  },
};

export function getRoleAppRuntime(role) {
  return ROLE_APP_RUNTIME[role] || null;
}

export function isRoleInAppRuntime(role) {
  return APP_RUNTIME_ROLES.includes(role);
}

export function getRoleAppHomePath(role) {
  return isRoleInAppRuntime(role) ? '/app' : DEFAULT_DASHBOARD[role] || '/workspace';
}

export function getRoleAppSection(role, sectionKey) {
  const runtime = getRoleAppRuntime(role);
  return runtime?.tabs?.find((tab) => tab.key === sectionKey) || null;
}

export function canRoleAccessAppPath(role, pathname) {
  const runtime = getRoleAppRuntime(role);
  if (!runtime) return false;

  // Always allow home and profile
  if (pathname === runtime.homeRoute || pathname === '/app/ho-so' || pathname === '/profile') {
    return true;
  }

  // Allow legacy /app/:sectionKey pattern
  if (runtime.tabs.some((tab) => pathname === `/app/${tab.key}`)) {
    return true;
  }

  // Allow all mobile app routes — auth guard is handled by AppSurfaceLayout itself
  const MOBILE_ALLOWED_PREFIXES = [
    '/app/', // Cho phép tất cả các trang mobile chuyên sâu (approvals, payroll, etc.)
    '/crm/', '/sales/', '/recruitment/', '/finance/', '/work/',
    '/kpi/', '/analytics/', '/hrm/', '/hr/',
    '/settings/', '/inventory/', '/legal/',
    '/recruitment', '/profile',
    '/audit/',  // Ban Kiểm soát routes
  ];
  if (MOBILE_ALLOWED_PREFIXES.some(prefix => pathname.startsWith(prefix))) {
    return true;
  }

  return false;
}

export function getActionToneClassName(tone) {
  return ACTION_TONES[tone] || ACTION_TONES.slate;
}
