import { ROLES } from '@/config/navigation';
import { getGoLiveDataPolicy, getGoLiveModeStats, isRouteVisibleInGoLive } from '@/config/goLiveDataPolicy';

const leaf = (role, tabCha, tabCon, tabChau, label, path, badge) => ({
  id: `${role}.${tabCha}.${tabCon}.${tabChau}`,
  screenKey: `${role}.${tabCha}.${tabCon}.${tabChau}`,
  label,
  path,
  badge,
});

const child = (id, label, path, grandchildren) => ({
  id,
  label,
  path,
  grandchildren,
});

const parent = (id, label, description, children) => ({
  id,
  label,
  description,
  children,
});

export const ROLE_DASHBOARD_SPEC = {
  [ROLES.SALES]: {
    title: 'Nhân viên kinh doanh',
    tabs: [
      parent('tong_quan', 'Tổng quan', 'Việc hôm nay, thông báo và chỉ số cần nhìn đầu tiên.', [
        child('dashboard', 'Bảng chính', '/sales', [
          leaf('sales', 'overview', 'dashboard', 'lead-hot', 'Khách nóng', '/crm/leads?status=hot'),
          leaf('sales', 'overview', 'dashboard', 'booking-open', 'Giữ chỗ đang mở', '/sales/soft-bookings?status=open'),
          leaf('sales', 'overview', 'dashboard', 'revenue-month', 'Doanh thu', '/sales/finance-center?tab=doanh-thu'),
          leaf('sales', 'overview', 'dashboard', 'ranking-current', 'Xếp hạng', '/sales/my-team?view=ranking'),
        ]),
        child('today', 'Việc hôm nay', '/work', [
          leaf('sales', 'overview', 'today', 'need-call', 'Cần gọi', '/work/reminders?type=call'),
          leaf('sales', 'overview', 'today', 'need-meet', 'Cần gặp', '/work/calendar?type=meeting'),
          leaf('sales', 'overview', 'today', 'need-follow', 'Cần follow', '/work/tasks?filter=follow'),
        ]),
        child('notice', 'Thông báo', '/work/reminders', [
          leaf('sales', 'overview', 'notice', 'from-manager', 'Từ quản lý', '/work/reminders?source=manager'),
          leaf('sales', 'overview', 'notice', 'from-system', 'Từ hệ thống', '/work/reminders?source=system'),
        ]),
      ]),
      parent('my_team', 'Đội nhóm của tôi', 'Người dẫn đội, thành viên và xếp hạng hiện tại.', [
        child('leader', 'Thủ lĩnh', '/sales/my-team', [
          leaf('sales', 'my-team', 'leader', 'team-lead', 'Trưởng nhóm', '/sales/my-team?view=team-lead'),
          leaf('sales', 'my-team', 'leader', 'sales-director', 'Giám đốc kinh doanh', '/sales/my-team?view=sales-director'),
        ]),
        child('members', 'Thành viên', '/sales/my-team', [
          leaf('sales', 'my-team', 'members', 'active', 'Đang hoạt động', '/sales/my-team?view=active'),
          leaf('sales', 'my-team', 'members', 'top-performer', 'Dẫn đầu', '/sales/my-team?view=top'),
        ]),
        child('ranking', 'Xếp hạng', '/sales/my-team', [
          leaf('sales', 'my-team', 'ranking', 'current-rank', 'Hạng hiện tại', '/sales/my-team?view=current-rank'),
          leaf('sales', 'my-team', 'ranking', 'top-10', 'Top 10', '/sales/my-team?view=top-10'),
          leaf('sales', 'my-team', 'ranking', 'gap-to-next', 'Khoảng cách', '/sales/my-team?view=gap'),
        ]),
      ]),
      parent('khach_hang', 'Khách hàng', 'Nguồn khách và khách hàng đang theo.', [
        child('nguon_khach', 'Nguồn khách', '/crm/leads', [
          leaf('sales', 'customer', 'source', 'new', 'Khách mới', '/crm/leads?status=new'),
          leaf('sales', 'customer', 'source', 'contacted', 'Đã liên hệ', '/crm/leads?status=contacted'),
          leaf('sales', 'customer', 'source', 'unhandled', 'Chưa xử lý', '/crm/leads?status=unhandled'),
        ]),
        child('khach_hang', 'Khách hàng', '/crm/contacts', [
          leaf('sales', 'customer', 'customer', 'active', 'Đang theo', '/crm/contacts?status=active'),
          leaf('sales', 'customer', 'customer', 'potential', 'Tiềm năng', '/crm/contacts?status=potential'),
          leaf('sales', 'customer', 'customer', 'won', 'Đã chốt', '/crm/contacts?status=won'),
          leaf('sales', 'customer', 'customer', 'lost', 'Đã mất', '/crm/contacts?status=lost'),
        ]),
      ]),
      parent('san_pham', 'Sản phẩm', 'Dự án, sản phẩm chọn lọc và tài liệu bán hàng.', [
        child('du_an', 'Dự án', '/sales/product-center?tab=du-an', [
          leaf('sales', 'product', 'project', 'selling', 'Đang bán', '/sales/product-center?tab=du-an&view=ban'),
          leaf('sales', 'product', 'project', 'upcoming', 'Sắp mở bán', '/sales/product-center?tab=du-an&view=sap-mo'),
        ]),
        child('sp_chon_loc', 'Sản phẩm chọn lọc', '/sales/product-center?tab=hang-ngon', [
          leaf('sales', 'product', 'selected-product', 'hot-today', 'Hot hôm nay', '/sales/product-center?tab=hang-ngon&view=hot'),
          leaf('sales', 'product', 'selected-product', 'priority-push', 'Ưu tiên đẩy', '/sales/product-center?tab=hang-ngon&view=push'),
        ]),
        child('tai_lieu', 'Tài liệu bán hàng', '/sales/product-center?tab=tai-lieu', [
          leaf('sales', 'product', 'materials', 'price-list', 'Bảng giá', '/sales/product-center?tab=bang-gia'),
          leaf('sales', 'product', 'materials', 'sales-policy', 'Chính sách bán', '/sales/product-center?tab=chinh-sach'),
          leaf('sales', 'product', 'materials', 'legal', 'Pháp lý', '/sales/product-center?tab=phap-ly'),
          leaf('sales', 'product', 'materials', 'customer-material', 'Tài liệu', '/sales/product-center?tab=tai-lieu'),
        ]),
      ]),
      parent('ban_hang', 'Bán hàng', 'Tiến trình giao dịch, giữ chỗ và hợp đồng.', [
        child('pipeline', 'Tiến trình giao dịch', '/sales/pipeline', [
          leaf('sales', 'sales', 'pipeline', 'lead', 'Khách mới', '/sales/pipeline?stage=lead'),
          leaf('sales', 'sales', 'pipeline', 'consulting', 'Tư vấn', '/sales/pipeline?stage=consulting'),
          leaf('sales', 'sales', 'pipeline', 'booking', 'Giữ chỗ', '/sales/pipeline?stage=booking'),
          leaf('sales', 'sales', 'pipeline', 'closing', 'Chốt', '/sales/pipeline?stage=closing'),
        ]),
        child('booking', 'Giữ chỗ', '/sales/soft-bookings', [
          leaf('sales', 'sales', 'booking', 'soft', 'Giữ chỗ tạm', '/sales/soft-bookings'),
          leaf('sales', 'sales', 'booking', 'hard', 'Giữ chỗ chính thức', '/sales/hard-bookings'),
        ]),
        child('contract', 'Hợp đồng', '/sales/contracts', [
          leaf('sales', 'sales', 'contract', 'processing', 'Đang xử lý', '/sales/contracts?status=processing'),
          leaf('sales', 'sales', 'contract', 'pending-sign', 'Chờ ký', '/sales/contracts?status=pending-sign'),
          leaf('sales', 'sales', 'contract', 'signed', 'Đã ký', '/sales/contracts?status=signed'),
        ]),
      ]),
      parent('kenh_ban_hang', 'Kênh bán hàng', 'Kênh cá nhân, nội dung, form và AI.', [
        child('kenh', 'Kênh', '/sales/channel-center?tab=kenh-cua-toi', [
          leaf('sales', 'channel', 'channel', 'facebook', 'Facebook', '/sales/channel-center?tab=kenh-cua-toi&view=facebook'),
          leaf('sales', 'channel', 'channel', 'zalo', 'Zalo', '/sales/channel-center?tab=kenh-cua-toi&view=zalo'),
          leaf('sales', 'channel', 'channel', 'tiktok', 'TikTok', '/sales/channel-center?tab=kenh-cua-toi&view=tiktok'),
        ]),
        child('noi_dung', 'Nội dung', '/sales/channel-center?tab=noi-dung', [
          leaf('sales', 'channel', 'content', 'post', 'Bài đăng', '/sales/channel-center?tab=noi-dung&view=post'),
          leaf('sales', 'channel', 'content', 'video', 'Video', '/sales/channel-center?tab=noi-dung&view=video'),
        ]),
        child('form_lead', 'Biểu mẫu lấy khách', '/sales/channel-center?tab=bieu-mau', [
          leaf('sales', 'channel', 'form', 'active-form', 'Form đang chạy', '/sales/channel-center?tab=bieu-mau&view=active'),
          leaf('sales', 'channel', 'form', 'lead-from-form', 'Khách từ biểu mẫu', '/sales/channel-center?tab=bieu-mau&view=lead'),
        ]),
        child('ai', 'AI', '/sales/channel-center?tab=ai', [
          leaf('sales', 'channel', 'ai', 'script', 'Kịch bản', '/sales/channel-center?tab=ai&view=script', 'AI'),
          leaf('sales', 'channel', 'ai', 'chat-support', 'Chat hỗ trợ', '/sales/channel-center?tab=ai&view=chat', 'AI'),
        ]),
      ]),
      parent('tai_chinh', 'Tài chính', 'Doanh thu, hoa hồng, thưởng.', [
        child('doanh_thu', 'Doanh thu', '/sales/finance-center?tab=doanh-thu', [
          leaf('sales', 'finance', 'revenue', 'today', 'Hôm nay', '/sales/finance-center?tab=doanh-thu&view=today'),
          leaf('sales', 'finance', 'revenue', 'month', 'Tháng', '/sales/finance-center?tab=doanh-thu&view=month'),
        ]),
        child('hoa_hong', 'Hoa hồng', '/sales/finance-center?tab=hoa-hong', [
          leaf('sales', 'finance', 'commission', 'received', 'Đã nhận', '/sales/finance-center?tab=hoa-hong&view=received'),
          leaf('sales', 'finance', 'commission', 'pending', 'Chờ nhận', '/sales/finance-center?tab=hoa-hong&view=pending'),
        ]),
        child('thuong', 'Thưởng', '/sales/finance-center?tab=luong-thuong', [
          leaf('sales', 'finance', 'bonus', 'kpi', 'KPI', '/sales/finance-center?tab=luong-thuong&view=kpi'),
          leaf('sales', 'finance', 'bonus', 'hot-bonus', 'Thưởng nóng', '/sales/finance-center?tab=luong-thuong&view=hot'),
        ]),
      ]),
    ],
  },
  [ROLES.MARKETING]: {
    title: 'Nhân viên marketing',
    tabs: [
      parent('tong_quan', 'Tổng quan', 'Toàn cảnh chiến dịch, khách mới và việc cần đẩy.', [
        child('dashboard', 'Bảng chính', '/workspace', [
          leaf('marketing', 'overview', 'dashboard', 'active-campaign', 'Chiến dịch đang chạy', '/marketing/campaigns?status=active'),
          leaf('marketing', 'overview', 'dashboard', 'lead-today', 'Khách mới hôm nay', '/crm/leads?group=source'),
          leaf('marketing', 'overview', 'dashboard', 'best-channel', 'Kênh hiệu quả', '/marketing/sources'),
        ]),
        child('today', 'Việc hôm nay', '/workspace', [
          leaf('marketing', 'overview', 'today', 'need-launch', 'Cần launch', '/marketing/campaigns?status=draft'),
          leaf('marketing', 'overview', 'today', 'need-optimize', 'Cần tối ưu', '/marketing/sources?status=optimize'),
          leaf('marketing', 'overview', 'today', 'need-handover', 'Cần bàn giao', '/crm/leads?handover=pending'),
        ]),
      ]),
      parent('chien_dich_kenh', 'Chiến dịch & kênh', 'Theo dõi chiến dịch và hiệu quả từng kênh.', [
        child('chien_dich', 'Chiến dịch', '/marketing/campaigns', [
          leaf('marketing', 'campaign', 'list', 'active', 'Đang chạy', '/marketing/campaigns?status=active'),
          leaf('marketing', 'campaign', 'list', 'paused', 'Tạm dừng', '/marketing/campaigns?status=paused'),
          leaf('marketing', 'campaign', 'list', 'ended', 'Kết thúc', '/marketing/campaigns?status=ended'),
        ]),
        child('kenh', 'Kênh', '/marketing/sources', [
          leaf('marketing', 'campaign', 'channel', 'facebook', 'Facebook', '/marketing/sources?channel=facebook'),
          leaf('marketing', 'campaign', 'channel', 'zalo', 'Zalo', '/marketing/sources?channel=zalo'),
          leaf('marketing', 'campaign', 'channel', 'tiktok', 'TikTok', '/marketing/sources?channel=tiktok'),
          leaf('marketing', 'campaign', 'channel', 'referral', 'Giới thiệu', '/marketing/sources?channel=referral'),
        ]),
      ]),
      parent('noi_dung', 'Nội dung kéo khách', 'Nội dung xuất bản và mẫu hỗ trợ kinh doanh.', [
        child('noi_dung', 'Nội dung', '/marketing/content', [
          leaf('marketing', 'content', 'list', 'pending-approval', 'Chờ duyệt', '/marketing/content?status=pending'),
          leaf('marketing', 'content', 'list', 'published', 'Đã đăng', '/marketing/content?status=published'),
        ]),
        child('mau_cho_sale', 'Mẫu cho kinh doanh', '/marketing/content?scope=sales-kit', [
          leaf('marketing', 'content', 'sales-kit', 'post-template', 'Bài mẫu', '/marketing/content?scope=sales-kit&type=post'),
          leaf('marketing', 'content', 'sales-kit', 'script-template', 'Kịch bản', '/marketing/content?scope=sales-kit&type=script'),
          leaf('marketing', 'content', 'sales-kit', 'video-template', 'Video mẫu', '/marketing/content?scope=sales-kit&type=video'),
        ]),
      ]),
      parent('lead_tracking', 'Nguồn khách & theo dõi', 'Nguồn khách, theo dõi và biểu mẫu.', [
        child('lead', 'Khách đổ về', '/crm/leads?group=source', [
          leaf('marketing', 'lead', 'list', 'by-channel', 'Theo kênh', '/crm/leads?group=source'),
          leaf('marketing', 'lead', 'list', 'by-campaign', 'Theo chiến dịch', '/crm/leads?group=campaign'),
        ]),
        child('tracking', 'Theo dõi', '/marketing/forms', [
          leaf('marketing', 'lead', 'tracking', 'form', 'Form', '/marketing/forms?view=form'),
          leaf('marketing', 'lead', 'tracking', 'pixel', 'Pixel', '/marketing/forms?view=pixel'),
          leaf('marketing', 'lead', 'tracking', 'attribution', 'Ghi nhận nguồn', '/marketing/attribution'),
        ]),
      ]),
    ],
  },
  [ROLES.CONTENT]: {
    title: 'Nhân viên trang web & nội dung',
    tabs: [
      parent('tong_quan_web', 'Tổng quan website', 'Nhìn nhanh trang cần sửa và cảnh báo web.', [
        child('dashboard', 'Bảng chính', '/cms', [
          leaf('content', 'overview', 'dashboard', 'page-update', 'Trang cần cập nhật', '/cms/pages'),
          leaf('content', 'overview', 'dashboard', 'seo-warning', 'Lỗi SEO', '/cms/analytics'),
          leaf('content', 'overview', 'dashboard', 'form-warning', 'Form cảnh báo', '/marketing/forms'),
        ]),
        child('today', 'Việc hôm nay', '/cms', [
          leaf('content', 'overview', 'today', 'need-fix', 'Cần sửa', '/cms/pages?status=need-fix'),
          leaf('content', 'overview', 'today', 'need-publish', 'Cần xuất bản', '/cms/articles?status=pending'),
        ]),
      ]),
      parent('trang_landing', 'Trang & landing page', 'Quản lý trang và landing page.', [
        child('trang', 'Trang', '/cms/pages', [
          leaf('content', 'site', 'page', 'active', 'Đang dùng', '/cms/pages?status=active'),
          leaf('content', 'site', 'page', 'draft', 'Bản nháp', '/cms/pages?status=draft'),
        ]),
        child('landing', 'Landing page', '/cms/landing-pages', [
          leaf('content', 'site', 'landing', 'active', 'Đang chạy', '/cms/landing-pages?status=active'),
          leaf('content', 'site', 'landing', 'archived', 'Đã lưu', '/cms/landing-pages?status=archived'),
        ]),
      ]),
      parent('noi_dung_web', 'Nội dung website', 'Bài viết và dự án hiển thị công khai.', [
        child('bai_viet', 'Bài viết', '/cms/articles', [
          leaf('content', 'content', 'article', 'pending', 'Chờ đăng', '/cms/articles?status=pending'),
          leaf('content', 'content', 'article', 'published', 'Đã đăng', '/cms/articles?status=published'),
        ]),
        child('du_an_hien_thi', 'Dự án hiển thị', '/cms/public-projects', [
          leaf('content', 'content', 'project', 'active', 'Đang hiển thị', '/cms/public-projects?status=active'),
          leaf('content', 'content', 'project', 'hidden', 'Đang ẩn', '/cms/public-projects?status=hidden'),
        ]),
      ]),
      parent('form_cta', 'Form & CTA', 'Form web, CTA và banner.', [
        child('form_web', 'Form web', '/marketing/forms', [
          leaf('content', 'conversion', 'form', 'active', 'Đang chạy', '/marketing/forms?status=active'),
          leaf('content', 'conversion', 'form', 'inactive', 'Tạm dừng', '/marketing/forms?status=inactive'),
        ]),
        child('cta_banner', 'CTA / banner', '/cms', [
          leaf('content', 'conversion', 'cta', 'active', 'Đang chạy', '/cms?tab=cta&status=active'),
          leaf('content', 'conversion', 'cta', 'expired', 'Hết hạn', '/cms?tab=cta&status=expired'),
        ]),
      ]),
      parent('seo_hieu_suat', 'SEO & hiệu suất', 'Theo dõi SEO và hiệu suất nội dung.', [
        child('seo', 'SEO', '/cms/analytics', [
          leaf('content', 'performance', 'seo', 'warning', 'Có lỗi', '/cms/analytics?section=seo&status=warning'),
          leaf('content', 'performance', 'seo', 'healthy', 'Ổn định', '/cms/analytics?section=seo&status=healthy'),
        ]),
        child('hieu_suat', 'Hiệu suất', '/cms/analytics', [
          leaf('content', 'performance', 'content', 'top-page', 'Trang tốt nhất', '/cms/analytics?section=content&view=top'),
          leaf('content', 'performance', 'content', 'low-performance', 'Trang yếu', '/cms/analytics?section=content&view=low'),
        ]),
      ]),
    ],
  },
  [ROLES.MANAGER]: {
    title: 'Quản lý',
    tabs: [
      parent('dieu_hanh_doi', 'Điều hành đội', 'Điều phối đội nhóm và cảnh báo.', [
        child('dashboard', 'Bảng chính', '/workspace', [
          leaf('manager', 'team', 'dashboard', 'team-summary', 'Tổng quan đội', '/workspace?view=team-summary'),
          leaf('manager', 'team', 'dashboard', 'team-ranking', 'Xếp hạng đội', '/sales/kpi'),
        ]),
        child('kpi', 'KPI', '/sales/kpi', [
          leaf('manager', 'team', 'kpi', 'by-member', 'Theo nhân viên', '/sales/kpi?view=member'),
          leaf('manager', 'team', 'kpi', 'by-team', 'Theo đội', '/sales/kpi?view=team'),
        ]),
        child('warning', 'Cảnh báo', '/work/tasks?status=overdue', [
          leaf('manager', 'team', 'warning', 'overdue', 'Quá hạn', '/work/tasks?status=overdue'),
          leaf('manager', 'team', 'warning', 'low-performance', 'Hiệu suất thấp', '/sales/kpi?view=low'),
        ]),
      ]),
      parent('kinh_doanh', 'Kinh doanh', 'Theo khách mới và giao dịch của đội.', [
        child('lead', 'Khách mới', '/crm/leads', [
          leaf('manager', 'business', 'lead', 'new', 'Khách mới', '/crm/leads?status=new'),
          leaf('manager', 'business', 'lead', 'hot', 'Khách nóng', '/crm/leads?status=hot'),
        ]),
        child('deal', 'Giao dịch', '/sales/deals', [
          leaf('manager', 'business', 'deal', 'booking', 'Giữ chỗ', '/sales/bookings'),
          leaf('manager', 'business', 'deal', 'closing', 'Đang chốt', '/sales/deals?stage=closing'),
        ]),
      ]),
      parent('cong_viec', 'Công việc', 'Việc và lịch của đội.', [
        child('viec', 'Việc', '/work/tasks', [
          leaf('manager', 'work', 'task', 'overdue', 'Quá hạn', '/work/tasks?status=overdue'),
          leaf('manager', 'work', 'task', 'today', 'Hôm nay', '/work/tasks?status=today'),
        ]),
        child('lich', 'Lịch', '/work/calendar', [
          leaf('manager', 'work', 'calendar', 'meeting', 'Họp', '/work/calendar?type=meeting'),
          leaf('manager', 'work', 'calendar', 'appointment', 'Lịch hẹn', '/work/calendar?type=appointment'),
        ]),
      ]),
      parent('my_team', 'Đội nhóm của tôi', 'Thành viên, xếp hạng và thông báo.', [
        child('thanh_vien', 'Thành viên', '/hr/organization', [
          leaf('manager', 'my-team', 'member', 'active', 'Đang hoạt động', '/hr/organization?status=active'),
          leaf('manager', 'my-team', 'member', 'probation', 'Thử việc', '/hr/organization?status=probation'),
        ]),
        child('xep_hang', 'Xếp hạng', '/sales/kpi', [
          leaf('manager', 'my-team', 'ranking', 'top', 'Top', '/sales/kpi?view=top'),
          leaf('manager', 'my-team', 'ranking', 'need-push', 'Cần đẩy', '/sales/kpi?view=need-push'),
        ]),
        child('thong_bao', 'Thông báo', '/work/reminders', [
          leaf('manager', 'my-team', 'notice', 'from-director', 'Từ giám đốc', '/work/reminders?source=director'),
          leaf('manager', 'my-team', 'notice', 'from-system', 'Từ hệ thống', '/work/reminders?source=system'),
        ]),
      ]),
    ],
  },
  [ROLES.BOD]: {
    title: 'Lãnh đạo',
    tabs: [
      parent('tong_quan', 'Tổng quan', 'Doanh thu, lợi nhuận, tăng trưởng.', [
        child('dashboard', 'Bảng chính', '/workspace', [
          leaf('bod', 'overview', 'dashboard', 'revenue', 'Doanh thu', '/finance'),
          leaf('bod', 'overview', 'dashboard', 'profit', 'Lợi nhuận', '/finance?view=profit'),
          leaf('bod', 'overview', 'dashboard', 'growth', 'Tăng trưởng', '/analytics/reports?view=growth'),
        ]),
      ]),
      parent('kinh_doanh', 'Kinh doanh', 'Theo dự án và khu vực.', [
        child('du_an', 'Theo dự án', '/analytics/reports?view=project', [
          leaf('bod', 'business', 'project', 'top-project', 'Dự án tốt', '/analytics/reports?view=top-project'),
          leaf('bod', 'business', 'project', 'weak-project', 'Dự án yếu', '/analytics/reports?view=weak-project'),
        ]),
        child('khu_vuc', 'Theo khu vực', '/analytics/reports?view=region', [
          leaf('bod', 'business', 'region', 'top-region', 'Khu vực tốt', '/analytics/reports?view=top-region'),
          leaf('bod', 'business', 'region', 'weak-region', 'Khu vực yếu', '/analytics/reports?view=weak-region'),
        ]),
      ]),
      parent('tai_chinh', 'Tài chính', 'Dòng tiền và công nợ.', [
        child('dong_tien', 'Dòng tiền', '/finance', [
          leaf('bod', 'finance', 'cashflow', 'inflow', 'Dòng tiền vào', '/finance?view=inflow'),
          leaf('bod', 'finance', 'cashflow', 'outflow', 'Dòng tiền ra', '/finance?view=outflow'),
        ]),
        child('cong_no', 'Công nợ', '/finance/receivables', [
          leaf('bod', 'finance', 'debt', 'receivable', 'Phải thu', '/finance/receivables'),
          leaf('bod', 'finance', 'debt', 'overdue', 'Quá hạn', '/finance/receivables?status=overdue'),
        ]),
      ]),
      parent('canh_bao_phe_duyet', 'Cảnh báo & phê duyệt', 'Các điểm cần quyết định ngay.', [
        child('phe_duyet', 'Phê duyệt', '/contracts/pending', [
          leaf('bod', 'approval', 'list', 'booking', 'Giữ chỗ', '/sales/bookings?status=pending'),
          leaf('bod', 'approval', 'list', 'expense', 'Chi phí', '/finance/expenses?status=pending'),
          leaf('bod', 'approval', 'list', 'legal', 'Pháp lý', '/contracts/pending'),
        ]),
        child('canh_bao', 'Cảnh báo', '/workspace?view=alerts', [
          leaf('bod', 'approval', 'warning', 'finance', 'Tài chính', '/finance?alert=1'),
          leaf('bod', 'approval', 'warning', 'hr', 'Nhân sự', '/hr?alert=1'),
          leaf('bod', 'approval', 'warning', 'legal', 'Pháp lý', '/legal/licenses?alert=1'),
          leaf('bod', 'approval', 'warning', 'website', 'Website', '/cms/analytics?alert=1'),
        ]),
      ]),
    ],
  },
  [ROLES.FINANCE]: {
    title: 'Nhân viên tài chính',
    tabs: [
      parent('tong_quan', 'Tổng quan', 'Khoản cần kiểm soát đầu tiên.', [
        child('dashboard', 'Bảng chính', '/workspace', [
          leaf('finance', 'overview', 'dashboard', 'revenue', 'Doanh thu', '/finance'),
          leaf('finance', 'overview', 'dashboard', 'expense', 'Chi phí', '/finance/expenses'),
          leaf('finance', 'overview', 'dashboard', 'pending-approval', 'Chờ duyệt', '/finance/expenses?status=pending'),
        ]),
        child('today', 'Việc hôm nay', '/workspace', [
          leaf('finance', 'overview', 'today', 'need-reconcile', 'Cần đối soát', '/finance/receivables?status=need-check'),
          leaf('finance', 'overview', 'today', 'need-approve', 'Cần duyệt', '/finance/expenses?status=pending'),
        ]),
      ]),
      parent('thu_chi', 'Thu chi', 'Phiếu thu và phiếu chi.', [
        child('phieu_thu', 'Phiếu thu', '/finance?tab=receipts', [
          leaf('finance', 'cash', 'receipt', 'today', 'Hôm nay', '/finance?tab=receipts&view=today'),
          leaf('finance', 'cash', 'receipt', 'pending', 'Chờ xử lý', '/finance?tab=receipts&view=pending'),
        ]),
        child('phieu_chi', 'Phiếu chi', '/finance/expenses', [
          leaf('finance', 'cash', 'expense', 'pending', 'Chờ duyệt', '/finance/expenses?status=pending'),
          leaf('finance', 'cash', 'expense', 'approved', 'Đã duyệt', '/finance/expenses?status=approved'),
        ]),
      ]),
      parent('cong_no', 'Công nợ', 'Danh sách và đối soát.', [
        child('danh_sach', 'Danh sách', '/finance/receivables', [
          leaf('finance', 'debt', 'list', 'receivable', 'Phải thu', '/finance/receivables'),
          leaf('finance', 'debt', 'list', 'overdue', 'Quá hạn', '/finance/receivables?status=overdue'),
        ]),
        child('doi_soat', 'Đối soát', '/finance/receivables?view=reconcile', [
          leaf('finance', 'debt', 'reconcile', 'need-check', 'Cần kiểm tra', '/finance/receivables?view=reconcile&status=need-check'),
          leaf('finance', 'debt', 'reconcile', 'completed', 'Đã xong', '/finance/receivables?view=reconcile&status=completed'),
        ]),
      ]),
      parent('hoa_hong', 'Hoa hồng', 'Theo dõi và chi trả hoa hồng.', [
        child('danh_sach', 'Danh sách', '/commission', [
          leaf('finance', 'commission', 'list', 'pending', 'Chờ duyệt', '/commission?status=pending'),
          leaf('finance', 'commission', 'list', 'approved', 'Đã duyệt', '/commission?status=approved'),
        ]),
        child('chi_tra', 'Chi trả', '/commission?view=payment', [
          leaf('finance', 'commission', 'payment', 'not-paid', 'Chưa chi', '/commission?view=payment&status=not-paid'),
          leaf('finance', 'commission', 'payment', 'paid', 'Đã chi', '/commission?view=payment&status=paid'),
        ]),
      ]),
      parent('luong_thuong', 'Lương thưởng', 'Bảng lương và thưởng.', [
        child('bang_luong', 'Bảng lương', '/payroll', [
          leaf('finance', 'payroll', 'salary', 'current-month', 'Tháng này', '/payroll?view=current'),
          leaf('finance', 'payroll', 'salary', 'history', 'Lịch sử', '/payroll?view=history'),
        ]),
        child('thuong', 'Thưởng', '/payroll?tab=bonus', [
          leaf('finance', 'payroll', 'bonus', 'kpi', 'KPI', '/payroll?tab=bonus&view=kpi'),
          leaf('finance', 'payroll', 'bonus', 'campaign', 'Chiến dịch', '/payroll?tab=bonus&view=campaign'),
        ]),
      ]),
    ],
  },
  [ROLES.HR]: {
    title: 'Nhân viên nhân sự',
    tabs: [
      parent('tong_quan', 'Tổng quan', 'Nhìn nhanh tuyển dụng, hồ sơ, đào tạo.', [
        child('dashboard', 'Bảng chính', '/workspace', [
          leaf('hr', 'overview', 'dashboard', 'new-candidate', 'Ứng viên mới', '/hr/recruitment?status=new'),
          leaf('hr', 'overview', 'dashboard', 'missing-profile', 'Thiếu hồ sơ', '/hr/employees?status=missing'),
          leaf('hr', 'overview', 'dashboard', 'training-this-week', 'Đào tạo tuần này', '/training?view=upcoming'),
        ]),
        child('today', 'Việc hôm nay', '/workspace', [
          leaf('hr', 'overview', 'today', 'need-call', 'Cần gọi', '/hr/recruitment?status=new'),
          leaf('hr', 'overview', 'today', 'need-onboard', 'Cần onboard', '/hr/recruitment?status=accepted'),
        ]),
      ]),
      parent('tuyen_dung', 'Tuyển dụng', 'Ứng viên và onboard.', [
        child('ung_vien', 'Ứng viên', '/hr/recruitment', [
          leaf('hr', 'recruitment', 'candidate', 'new', 'Mới', '/hr/recruitment?status=new'),
          leaf('hr', 'recruitment', 'candidate', 'interviewing', 'Đang phỏng vấn', '/hr/recruitment?status=interviewing'),
          leaf('hr', 'recruitment', 'candidate', 'accepted', 'Đã nhận', '/hr/recruitment?status=accepted'),
        ]),
        child('onboard', 'Onboard', '/hr/recruitment?view=onboard', [
          leaf('hr', 'recruitment', 'onboard', 'pending', 'Chờ xử lý', '/hr/recruitment?view=onboard&status=pending'),
          leaf('hr', 'recruitment', 'onboard', 'completed', 'Hoàn tất', '/hr/recruitment?view=onboard&status=completed'),
        ]),
      ]),
      parent('ho_so_nhan_su', 'Hồ sơ nhân sự', 'Hồ sơ, hợp đồng, chấm công.', [
        child('ho_so', 'Hồ sơ', '/hr/employees', [
          leaf('hr', 'employee', 'profile', 'missing', 'Còn thiếu', '/hr/employees?status=missing'),
          leaf('hr', 'employee', 'profile', 'completed', 'Đã đủ', '/hr/employees?status=completed'),
        ]),
        child('hop_dong', 'Hợp đồng', '/hr/contracts', [
          leaf('hr', 'employee', 'contract', 'pending-sign', 'Chờ ký', '/hr/contracts?status=pending-sign'),
          leaf('hr', 'employee', 'contract', 'signed', 'Đã ký', '/hr/contracts?status=signed'),
        ]),
        child('cham_cong', 'Chấm công', '/payroll/attendance', [
          leaf('hr', 'employee', 'attendance', 'today', 'Hôm nay', '/payroll/attendance?view=today'),
          leaf('hr', 'employee', 'attendance', 'anomaly', 'Bất thường', '/payroll/attendance?view=anomaly'),
        ]),
      ]),
      parent('dao_tao', 'Đào tạo', 'Lịch đào tạo và khóa học.', [
        child('lich_dao_tao', 'Lịch đào tạo', '/training', [
          leaf('hr', 'training', 'schedule', 'upcoming', 'Sắp diễn ra', '/training?view=upcoming'),
          leaf('hr', 'training', 'schedule', 'completed', 'Đã xong', '/training?view=completed'),
        ]),
        child('khoa_hoc', 'Khóa học', '/training/courses', [
          leaf('hr', 'training', 'course', 'assigned', 'Được giao', '/training/courses?status=assigned'),
          leaf('hr', 'training', 'course', 'completed', 'Hoàn thành', '/training/courses?status=completed'),
        ]),
      ]),
      parent('phat_trien', 'Phát triển', 'Năng lực và thăng tiến.', [
        child('kpi_nang_luc', 'KPI / năng lực', '/kpi', [
          leaf('hr', 'growth', 'performance', 'by-role', 'Theo vai trò', '/kpi?view=role'),
          leaf('hr', 'growth', 'performance', 'low-score', 'Điểm thấp', '/kpi?view=low'),
        ]),
        child('to_chuc', 'Cơ cấu tổ chức', '/hr/organization', [
          leaf('hr', 'growth', 'organization', 'active', 'Đang hoạt động', '/hr/organization?status=active'),
          leaf('hr', 'growth', 'organization', 'probation', 'Thử việc', '/hr/organization?status=probation'),
        ]),
        child('lo_trinh', 'Lộ trình thăng tiến', '/hr?tab=promotion', [
          leaf('hr', 'growth', 'promotion', 'in-progress', 'Đang theo', '/hr?tab=promotion&status=in-progress'),
          leaf('hr', 'growth', 'promotion', 'qualified', 'Đủ điều kiện', '/hr?tab=promotion&status=qualified'),
        ]),
      ]),
    ],
  },
  [ROLES.LEGAL]: {
    title: 'Nhân viên pháp lý',
    tabs: [
      parent('tong_quan', 'Tổng quan', 'Hồ sơ cần rà và rủi ro cần chú ý.', [
        child('dashboard', 'Bảng chính', '/workspace', [
          leaf('legal', 'overview', 'dashboard', 'pending-review', 'Chờ rà soát', '/contracts/pending'),
          leaf('legal', 'overview', 'dashboard', 'risk-warning', 'Rủi ro', '/legal/licenses?alert=1'),
        ]),
        child('today', 'Việc hôm nay', '/workspace', [
          leaf('legal', 'overview', 'today', 'need-review', 'Cần rà', '/contracts/pending'),
          leaf('legal', 'overview', 'today', 'need-update', 'Cần cập nhật', '/legal/licenses?status=need-update'),
        ]),
      ]),
      parent('ho_so_du_an', 'Hồ sơ dự án', 'Pháp lý và tiến độ xử lý.', [
        child('danh_sach', 'Danh sách', '/legal/licenses', [
          leaf('legal', 'project', 'list', 'active', 'Đang xử lý', '/legal/licenses?status=active'),
          leaf('legal', 'project', 'list', 'missing', 'Còn thiếu', '/legal/licenses?status=missing'),
        ]),
        child('tuan_thu', 'Tuân thủ', '/legal/compliance', [
          leaf('legal', 'project', 'compliance', 'active', 'Đang theo', '/legal/compliance?status=active'),
          leaf('legal', 'project', 'compliance', 'warning', 'Cảnh báo', '/legal/compliance?status=warning'),
        ]),
        child('tien_do', 'Tiến độ', '/legal/licenses?view=progress', [
          leaf('legal', 'project', 'progress', 'in-progress', 'Đang làm', '/legal/licenses?view=progress&status=in-progress'),
          leaf('legal', 'project', 'progress', 'completed', 'Hoàn tất', '/legal/licenses?view=progress&status=completed'),
        ]),
      ]),
      parent('hop_dong', 'Hợp đồng', 'Danh sách hợp đồng và chờ ký.', [
        child('danh_sach', 'Danh sách', '/contracts', [
          leaf('legal', 'contract', 'list', 'processing', 'Đang xử lý', '/contracts?status=processing'),
          leaf('legal', 'contract', 'list', 'reviewed', 'Đã rà', '/contracts?status=reviewed'),
        ]),
        child('cho_ky', 'Chờ ký', '/contracts/pending', [
          leaf('legal', 'contract', 'signing', 'pending-sign', 'Chờ ký', '/contracts/pending?status=pending-sign'),
          leaf('legal', 'contract', 'signing', 'signed', 'Đã ký', '/contracts/pending?status=signed'),
        ]),
      ]),
      parent('tai_lieu_cho_sale', 'Tài liệu cho kinh doanh', 'Tài liệu và biểu mẫu gửi cho kinh doanh.', [
        child('tai_lieu', 'Tài liệu', '/legal/licenses?view=materials', [
          leaf('legal', 'support', 'material', 'ready', 'Sẵn gửi', '/legal/licenses?view=materials&status=ready'),
          leaf('legal', 'support', 'material', 'need-update', 'Cần cập nhật', '/legal/licenses?view=materials&status=need-update'),
        ]),
        child('bieu_mau', 'Biểu mẫu', '/legal/licenses?view=forms', [
          leaf('legal', 'support', 'form', 'active', 'Đang dùng', '/legal/licenses?view=forms&status=active'),
          leaf('legal', 'support', 'form', 'archived', 'Đã lưu', '/legal/licenses?view=forms&status=archived'),
        ]),
      ]),
    ],
  },
  [ROLES.ADMIN]: {
    title: 'Quản trị hệ thống',
    tabs: [
      parent('tong_quan_he_thong', 'Tổng quan hệ thống', 'Thay đổi, người dùng và cảnh báo.', [
        child('dashboard', 'Bảng chính', '/settings/governance', [
          leaf('admin', 'system', 'dashboard', 'pending-change', 'Thay đổi chờ duyệt', '/settings/change-management'),
          leaf('admin', 'system', 'dashboard', 'active-user', 'Người dùng hoạt động', '/settings/users?status=active'),
        ]),
        child('canh_bao', 'Cảnh báo', '/settings/governance-coverage', [
          leaf('admin', 'system', 'warning', 'security', 'Bảo mật', '/settings/governance-coverage?section=security'),
          leaf('admin', 'system', 'warning', 'workflow', 'Quy trình', '/settings/governance-coverage?section=workflow'),
        ]),
      ]),
      parent('nguoi_dung_quyen', 'Người dùng & quyền', 'Người dùng và ma trận quyền.', [
        child('nguoi_dung', 'Người dùng', '/settings/users', [
          leaf('admin', 'identity', 'user', 'active', 'Đang hoạt động', '/settings/users?status=active'),
          leaf('admin', 'identity', 'user', 'locked', 'Đã khóa', '/settings/users?status=locked'),
        ]),
        child('vai_tro', 'Vai trò', '/settings/roles', [
          leaf('admin', 'identity', 'role', 'role-list', 'Danh sách vai trò', '/settings/roles'),
          leaf('admin', 'identity', 'role', 'permission-matrix', 'Ma trận quyền', '/settings/roles?view=matrix'),
        ]),
      ]),
      parent('du_lieu_chuan', 'Dữ liệu chuẩn', 'Danh mục và mapping.', [
        child('danh_muc', 'Danh mục', '/settings/data-foundation', [
          leaf('admin', 'data', 'catalog', 'active', 'Đang dùng', '/settings/data-foundation?status=active'),
          leaf('admin', 'data', 'catalog', 'mismatch', 'Lệch chuẩn', '/settings/governance-remediation'),
        ]),
        child('mapping', 'Mapping', '/settings/entity-governance', [
          leaf('admin', 'data', 'mapping', 'missing', 'Còn thiếu', '/settings/entity-governance?status=missing'),
          leaf('admin', 'data', 'mapping', 'completed', 'Đã đủ', '/settings/entity-governance?status=completed'),
        ]),
      ]),
      parent('quy_trinh', 'Quy trình', 'Phê duyệt và thay đổi vận hành.', [
        child('phe_duyet', 'Phê duyệt', '/settings/approval-matrix', [
          leaf('admin', 'workflow', 'approval', 'pending', 'Chờ duyệt', '/settings/approval-matrix?status=pending'),
          leaf('admin', 'workflow', 'approval', 'applied', 'Đã áp dụng', '/settings/approval-matrix?status=applied'),
        ]),
        child('change', 'Thay đổi vận hành', '/settings/change-management', [
          leaf('admin', 'workflow', 'change', 'draft', 'Nháp', '/settings/change-management?status=draft'),
          leaf('admin', 'workflow', 'change', 'approved', 'Đã duyệt', '/settings/change-management?status=approved'),
        ]),
      ]),
      parent('website_cms', 'Trang web & nội dung', 'Nội dung web và công khai.', [
        child('noi_dung_web', 'Nội dung web', '/cms', [
          leaf('admin', 'site', 'content', 'pending', 'Chờ duyệt', '/cms?status=pending'),
          leaf('admin', 'site', 'content', 'published', 'Đã xuất bản', '/cms?status=published'),
        ]),
        child('cong_khai', 'Công khai', '/cms/analytics', [
          leaf('admin', 'site', 'public', 'active', 'Đang ổn', '/cms/analytics?status=active'),
          leaf('admin', 'site', 'public', 'warning', 'Cảnh báo', '/cms/analytics?status=warning'),
        ]),
      ]),
    ],
  },
  [ROLES.AGENCY]: {
    title: 'Cộng tác viên / Đại lý',
    tabs: [
      parent('tong_quan', 'Tổng quan', 'Khách, booking, hoa hồng và việc trong ngày.', [
        child('dashboard', 'Bảng chính', '/workspace', [
          leaf('agency', 'overview', 'dashboard', 'customer-active', 'Khách đang theo', '/crm/leads?status=active'),
          leaf('agency', 'overview', 'dashboard', 'booking-open', 'Giữ chỗ đang mở', '/sales/bookings?status=open'),
          leaf('agency', 'overview', 'dashboard', 'commission-pending', 'Hoa hồng chờ nhận', '/finance/my-income?status=pending'),
        ]),
        child('today', 'Việc hôm nay', '/workspace', [
          leaf('agency', 'overview', 'today', 'need-call', 'Cần gọi', '/work/reminders?type=call'),
          leaf('agency', 'overview', 'today', 'need-follow', 'Cần follow', '/work/tasks?filter=follow'),
        ]),
      ]),
      parent('khach_hang', 'Khách hàng', 'Nguồn khách và khách của tôi.', [
        child('nguon_khach', 'Nguồn khách', '/crm/leads', [
          leaf('agency', 'customer', 'source', 'new', 'Mới', '/crm/leads?status=new'),
          leaf('agency', 'customer', 'source', 'active', 'Đang theo', '/crm/leads?status=active'),
        ]),
        child('khach_cua_toi', 'Khách của tôi', '/crm/contacts', [
          leaf('agency', 'customer', 'account', 'following', 'Đang theo', '/crm/contacts?status=active'),
          leaf('agency', 'customer', 'account', 'won', 'Đã chốt', '/crm/contacts?status=won'),
        ]),
      ]),
      parent('ban_hang', 'Bán hàng', 'Giao dịch và giữ chỗ của tôi.', [
        child('giao_dich', 'Giao dịch', '/sales/pipeline', [
          leaf('agency', 'sales', 'deal', 'pipeline', 'Tiến trình giao dịch', '/sales/pipeline'),
          leaf('agency', 'sales', 'deal', 'closing', 'Đang chốt', '/sales/pipeline?stage=closing'),
        ]),
        child('booking', 'Giữ chỗ', '/sales/bookings', [
          leaf('agency', 'sales', 'booking', 'soft', 'Giữ chỗ tạm', '/sales/bookings?type=soft'),
          leaf('agency', 'sales', 'booking', 'hard', 'Giữ chỗ chính thức', '/sales/bookings?type=hard'),
        ]),
      ]),
      parent('tai_chinh', 'Tài chính', 'Hoa hồng và thưởng.', [
        child('hoa_hong', 'Hoa hồng', '/finance/my-income', [
          leaf('agency', 'finance', 'commission', 'pending', 'Chờ nhận', '/finance/my-income?status=pending'),
          leaf('agency', 'finance', 'commission', 'received', 'Đã nhận', '/finance/my-income?status=received'),
        ]),
        child('thuong', 'Thưởng', '/finance/my-income?view=bonus', [
          leaf('agency', 'finance', 'bonus', 'campaign', 'Chiến dịch', '/finance/my-income?view=bonus&type=campaign'),
          leaf('agency', 'finance', 'bonus', 'hot', 'Thưởng nóng', '/finance/my-income?view=bonus&type=hot'),
        ]),
      ]),
      parent('tai_lieu', 'Tài liệu', 'Bảng giá, chính sách, tài liệu gửi khách.', [
        child('bang_gia', 'Bảng giá', '/sales/product-center?tab=bang-gia', [
          leaf('agency', 'material', 'price', 'current', 'Bảng giá hiện tại', '/sales/product-center?tab=bang-gia'),
        ]),
        child('chinh_sach', 'Chính sách', '/sales/product-center?tab=chinh-sach', [
          leaf('agency', 'material', 'policy', 'active', 'Chính sách hiện hành', '/sales/product-center?tab=chinh-sach'),
        ]),
        child('tai_lieu_gui_khach', 'Tài liệu gửi khách', '/sales/product-center?tab=tai-lieu', [
          leaf('agency', 'material', 'customer-doc', 'ready', 'Sẵn gửi khách', '/sales/product-center?tab=tai-lieu'),
        ]),
      ]),
    ],
  },
  // ─ Giám đốc dự án ──────────────────────────────────────────────────────
  [ROLES.PROJECT_DIRECTOR]: {
    title: 'Giám đốc Dự án',
    tabs: [
      parent('tong_quan_da', 'Tổng quan Dự án', 'KPI, booking và đội sales của dự án.', [
        child('dashboard', 'Bảng chính', '/app', [
          leaf('pd', 'overview', 'dashboard', 'pending-booking', 'Booking chờ duyệt', '/sales/bookings?status=pending'),
          leaf('pd', 'overview', 'dashboard', 'kpi-team', 'KPI đội', '/kpi/team'),
          leaf('pd', 'overview', 'dashboard', 'revenue', 'Doanh số dự án', '/analytics/reports'),
        ]),
        child('booking', 'Booking', '/sales/bookings', [
          leaf('pd', 'booking', 'list', 'pending', 'Chờ duyệt', '/sales/bookings?status=pending'),
          leaf('pd', 'booking', 'list', 'approved', 'Đã duyệt', '/sales/bookings?status=approved'),
        ]),
        child('doi_sales', 'Đội sales', '/kpi/team', [
          leaf('pd', 'team', 'kpi', 'by-member', 'Theo nhân viên', '/kpi/team?view=member'),
          leaf('pd', 'team', 'kpi', 'leaderboard', 'Xếp hạng', '/kpi/leaderboard'),
        ]),
      ]),
      parent('gio_hang', 'Giỏ hàng dự án', 'Sản phẩm và tiến trình bán.', [
        child('san_pham', 'Sản phẩm', '/sales/catalog', [
          leaf('pd', 'catalog', 'unit', 'available', 'Còn hàng', '/sales/catalog?status=available'),
          leaf('pd', 'catalog', 'unit', 'booked', 'Đã giữ chỗ', '/sales/catalog?status=booked'),
          leaf('pd', 'catalog', 'unit', 'sold', 'Đã bán', '/sales/catalog?status=sold'),
        ]),
      ]),
    ],
  },
  // ─ Hỗ trợ nghiệp vụ ──────────────────────────────────────────────────────
  [ROLES.SALES_SUPPORT]: {
    title: 'Hỗ trợ Nghiệp vụ',
    tabs: [
      parent('ho_so', 'Hồ sơ', 'Hồ sơ booking và tiến trình.', [
        child('booking', 'Booking', '/sales/bookings', [
          leaf('ss', 'doc', 'booking', 'pending', 'Chờ xử lý', '/sales/bookings?status=pending'),
          leaf('ss', 'doc', 'booking', 'processing', 'Đang xử lý', '/sales/bookings?status=processing'),
        ]),
        child('khach_hang', 'Khách CSKH', '/crm/contacts', [
          leaf('ss', 'doc', 'contact', 'need-followup', 'Cần follow', '/crm/contacts?cskh=1'),
        ]),
      ]),
      parent('cong_viec', 'Công việc', 'Lịch và việc ngày.', [
        child('lich', 'Lịch làm việc', '/work/calendar', [
          leaf('ss', 'work', 'calendar', 'today', 'Hôm nay', '/work/calendar?view=today'),
        ]),
      ]),
    ],
  },
  // ─ Ban Kiểm soát ──────────────────────────────────────────────────────
  [ROLES.AUDIT]: {
    title: 'Ban Kiểm soát',
    tabs: [
      parent('kiem_soat', 'Kiểm soát', 'Báo cáo và cảnh báo.', [
        child('bao_cao', 'Báo cáo', '/audit/reports', [
          leaf('audit', 'reports', 'finance', 'monthly', 'Tư chính tháng', '/audit/finance'),
          leaf('audit', 'reports', 'hr', 'summary', 'Nhân sự', '/audit/hr'),
        ]),
        child('canh_bao', 'Cảnh báo', '/audit/reports', [
          leaf('audit', 'alert', 'finance', 'anomaly', 'Bất thường TC', '/audit/finance'),
          leaf('audit', 'alert', 'hr', 'anomaly', 'Bất thường NS', '/audit/hr'),
        ]),
      ]),
    ],
  },
};

export const getRoleDashboardSpec = (role) => ROLE_DASHBOARD_SPEC[role] || ROLE_DASHBOARD_SPEC[ROLES.MANAGER];

export const GO_LIVE_PHASE = {
  id: 'phase_1_locked',
  label: 'Đã khóa vận hành đợt 1',
  description: 'Chỉ hiển thị các vùng làm việc đã được chốt cho vận hành chính thức.',
};

const normalizePathname = (path = '/') => {
  if (!path) return '/';

  try {
    return new URL(path, 'http://localhost').pathname || '/';
  } catch (_error) {
    return path.split('?')[0] || '/';
  }
};

const ROLE_HOME_PATH = {
  [ROLES.SALES]:            '/sales/dashboard',
  [ROLES.AGENCY]:           '/agency',
  [ROLES.MANAGER]:          '/manager/dashboard',
  [ROLES.MARKETING]:        '/marketing',
  [ROLES.FINANCE]:          '/finance',
  [ROLES.HR]:               '/hr',
  [ROLES.BOD]:              '/bod/dashboard',
  [ROLES.PROJECT_DIRECTOR]: '/project-director/dashboard',
  [ROLES.SALES_SUPPORT]:    '/sales-support/dashboard',
  [ROLES.AUDIT]:            '/app',
};

const GO_LIVE_COMMON_PATHS = ['/dashboard', '/me'];

const GO_LIVE_EXTRA_PREFIXES = {
  [ROLES.ADMIN]:            ['/settings'],
  [ROLES.SALES]:            [
    // Mobile app shell
    '/app',
    // Web dashboard
    '/sales', '/sales/dashboard',
    // Sản phẩm & dự án
    '/sales/catalog', '/sales/products', '/sales/projects',
    '/sales/product-center', '/sales/knowledge-center',
    '/sales/channel-center',
    // Bán hàng
    '/sales/pipeline', '/sales/kanban', '/sales/pricing',
    '/sales/bookings', '/sales/soft-bookings', '/sales/hard-bookings',
    '/sales/contracts', '/sales/deals', '/sales/my-team',
    '/sales/events',
    // CRM
    '/crm/contacts', '/crm/leads', '/crm/demands',
    // Tài chính cá nhân
    '/sales/finance-center', '/finance/my-income', '/commission',
    // Công việc
    '/work/tasks', '/work/calendar', '/work/reminders',
    // KPI
    '/sales/kpi', '/kpi/my-performance', '/kpi/leaderboard',
    // Hợp đồng
    '/contracts/',
  ],
  [ROLES.AGENCY]:           [
    '/app',
    '/agency', '/agency/list', '/agency/distribution',
    '/agency/performance', '/agency/network',
    '/finance/my-income', '/commission',
    '/sales/catalog', '/sales/knowledge-center',
    '/sales/product-center', '/sales/pipeline',
    '/crm/contacts', '/crm/leads',
    '/work/calendar', '/work/tasks',
    '/analytics/reports',
  ],
  [ROLES.MANAGER]:          [
    // Mobile app shell
    '/app', '/kpi/team', '/kpi/team/member',
    '/app/approvals',
    // Web dashboard
    '/manager', '/manager/dashboard',
    // Sales (Manager bán hàng cá nhân + quản lý đội)
    '/sales/catalog', '/sales/bookings', '/sales/soft-bookings',
    '/sales/hard-bookings', '/sales/contracts', '/sales/kpi',
    '/sales/deals', '/sales/pipeline', '/sales/product-center',
    // CRM (team-scoped via manager_id API filter)
    '/crm/contacts', '/crm/leads', '/crm/demands',
    // Work
    '/work/manager', '/work/tasks', '/work/calendar',
    // Analytics / Reports
    '/analytics/reports', '/analytics/business',
    // HR (chỉ xem NV do mình quản lý)
    '/hr/organization',
    // Finance
    '/finance/expenses', '/finance/my-income',
    // Contracts
    '/contracts/',
  ],
  [ROLES.BOD]:              [
    // Mobile app shell
    '/app', '/app/bod/',
    // Web dashboard
    '/bod/dashboard',
    // Phân tích & điều hành — prefix để catch mọi sub-route
    '/analytics/', '/analytics',
    '/analytics/executive', '/analytics/reports',
    '/control',
    // Tài chính — prefix để catch mọi sub-route
    '/finance/',
    '/finance', '/finance/revenue', '/finance/expenses',
    '/finance/overview', '/finance/summary', '/finance/receivables',
    // Hợp đồng & kiểm soát
    '/contracts/', '/sales/contracts', '/sales/bookings',
    // Nhân sự & KPI — prefix để catch /kpi, /kpi/*, /hr/*
    '/kpi/', '/kpi', '/kpi/team', '/kpi/leaderboard',
    '/hr/', '/hr', '/hr/employees', '/hr/organization',
    // CRM & Sales
    '/crm/', '/crm/leads', '/crm/contacts',
    '/sales/', '/sales/catalog', '/sales/pipeline', '/sales/leads',
    // Công việc
    '/work/', '/work/manager', '/work/tasks', '/work/calendar',
    // Duyệt
    '/app/approvals',
  ],
  [ROLES.MARKETING]:        [
    // Mobile app shell
    '/app',
    // Web dashboard
    '/marketing', '/marketing/dashboard',
    // Chiến dịch & kênh
    '/marketing/campaigns', '/marketing/sources',
    '/marketing/rules', '/marketing/attribution',
    '/marketing/forms',
    // Truyền thông
    '/communications/channels', '/communications/content',
    '/communications/templates',
    // Nội dung
    '/marketing/content', '/cms/articles', '/cms/pages',
    '/cms/landing-pages', '/cms/analytics',
    // CRM (xem lead từ các kênh)
    '/crm/leads', '/crm/demands',
    // Công việc
    '/work/calendar', '/work/tasks', '/work/reminders',
    // Thống kê
    '/analytics/reports', '/analytics/content',
  ],
  [ROLES.FINANCE]:          [
    // Mobile app shell
    '/app',
    // Web dashboard
    '/finance', '/finance/dashboard',
    // Thu chi
    '/finance/revenue', '/finance/expenses', '/finance/expense',
    '/finance/transactions', '/finance/my-income',
    '/finance/receivables', '/finance/payables',
    // Hoà hồng & lương
    '/commission', '/payroll', '/payroll/detail/',
    '/payroll/attendance',
    // Báo cáo
    '/analytics/reports', '/analytics/finance',
    '/finance/forecast', '/finance/budget',
    // Hợp đồng & công nợ
    '/contracts/', '/finance/bank-accounts',
    // Công việc
    '/work/tasks', '/work/calendar',
  ],
  [ROLES.HR]:               [
    // Mobile app shell
    '/app',
    // Web dashboard
    '/hr', '/hr/dashboard',
    // Nhân sự
    '/hr/employees', '/hr/employees/new',
    '/hr/organization', '/hr/teams', '/hr/org-chart',
    '/hr/positions', '/hr/alerts',
    // Tuyển dụng
    '/recruitment', '/app/recruitment',
    '/recruitment/referral',
    // Lương & chấm công
    '/payroll', '/payroll/attendance',
    // KPI & hiệu suất
    '/kpi/team', '/kpi/leaderboard',
    // Đào tạo
    '/hr/training',
    // Công việc
    '/work/tasks', '/work/calendar',
    // Báo cáo
    '/analytics/reports',
    // Hồ sơ
    '/hr/employees/',
  ],
  [ROLES.LEGAL]:            ['/contracts/'],
  [ROLES.CONTENT]:          [
    '/app',
    '/content/dashboard',
    '/cms/articles', '/cms/articles/', '/cms/pages', '/cms/pages/',
    '/cms/landing-pages', '/cms/landing-pages/', '/cms/news', '/cms/media',
    '/cms/analytics', '/marketing/content',
    '/work/calendar', '/work/tasks',
    '/analytics/reports', '/analytics/content',
  ],
  [ROLES.PROJECT_DIRECTOR]: [
    // Mobile app shell
    '/app',
    // Web dashboard
    '/project-director/dashboard',
    // Dự án
    '/sales/projects', '/sales/catalog',
    '/sales/bookings', '/sales/pipeline',
    '/projects',
    // KPI & Team
    '/kpi/team', '/kpi/leaderboard',
    // CRM
    '/crm/contacts', '/crm/leads',
    // Báo cáo
    '/analytics/reports', '/analytics/executive',
    // Công việc
    '/work/calendar', '/work/tasks', '/work/manager',
    // Hợp đồng
    '/contracts/',
  ],
  [ROLES.SALES_SUPPORT]:    [
    // Mobile
    '/app',
    // Web dashboard
    '/sales-support/dashboard',
    // Hồ sơ & hợp đồng
    '/sales/bookings', '/sales/pipeline',
    '/contracts/',
    // CRM
    '/crm/contacts', '/crm/leads', '/crm/demands',
    // Công việc
    '/work/calendar', '/work/tasks', '/work/reminders',
    // Báo cáo
    '/analytics/reports',
  ],
  [ROLES.AUDIT]:            ['/app', '/audit/', '/finance/', '/analytics/', '/hrm/', '/kpi/'],
};

const collectRolePathnames = (tabs = []) => {
  const pathnames = new Set();

  tabs.forEach((tab) => {
    (tab.children || []).forEach((subtab) => {
      if (subtab.path) {
        pathnames.add(normalizePathname(subtab.path));
      }

      (subtab.grandchildren || []).forEach((leafNode) => {
        if (leafNode.path) {
          pathnames.add(normalizePathname(leafNode.path));
        }
      });
    });
  });

  return pathnames;
};

const decorateGrandchild = (item) => {
  const dataPolicy = getGoLiveDataPolicy(item.path);
  return {
    ...item,
    dataPolicy,
  };
};

const decorateSubtab = (subtab) => {
  const grandchildren = (subtab.grandchildren || [])
    .filter((item) => isRouteVisibleInGoLive(item.path))
    .map(decorateGrandchild);

  if (!grandchildren.length && !isRouteVisibleInGoLive(subtab.path)) {
    return null;
  }

  return {
    ...subtab,
    dataPolicy: getGoLiveDataPolicy(subtab.path),
    grandchildren,
  };
};

const decorateTabsForGoLive = (tabs = []) =>
  tabs
    .map((tab) => ({
      ...tab,
      children: (tab.children || []).map(decorateSubtab).filter(Boolean),
    }))
    .filter((tab) => tab.children.length > 0);

export const getRoleGoLiveHomePath = (role) => ROLE_HOME_PATH[role] || '/workspace';

export const getRoleGoLivePathnames = (role) => {
  const tabs = getRoleWorkspaceTabs(role);
  const pathnames = collectRolePathnames(tabs);

  GO_LIVE_COMMON_PATHS.forEach((path) => pathnames.add(path));
  pathnames.add(getRoleGoLiveHomePath(role));

  return Array.from(pathnames);
};

export const getRoleGoLivePrefixPathnames = (role) => GO_LIVE_EXTRA_PREFIXES[role] || [];

export const isPathInRoleGoLiveScope = (role, pathname = '/') => {
  if (!role) return true;

  const normalizedPathname = normalizePathname(pathname);
  const allowedPathnames = getRoleGoLivePathnames(role);

  if (allowedPathnames.includes(normalizedPathname)) {
    return true;
  }

  return getRoleGoLivePrefixPathnames(role).some((prefix) => normalizedPathname.startsWith(prefix));
};

export const getRoleWorkspaceTabs = (role) => decorateTabsForGoLive(getRoleDashboardSpec(role).tabs || []);

export const getRoleGoLiveDataSummary = (role) => getGoLiveModeStats(getRoleGoLivePathnames(role));

export const getRoleSidebarTabs = (role) => {
  const tabs = getRoleWorkspaceTabs(role);

  return tabs.map((tab) => ({
    id: tab.id,
    label: tab.label,
    moTa: tab.description,
    children: tab.children.flatMap((subtab) => {
      const heading = {
        id: `${tab.id}-${subtab.id}-heading`,
        label: subtab.label,
        isHeading: true,
      };

      const leafNodes = subtab.grandchildren.slice(0, 3).map((item) => ({
        id: item.id,
        label: item.label,
        path: item.path,
        badge: item.badge,
      }));

      const remainingCount = Math.max((subtab.grandchildren?.length || 0) - leafNodes.length, 0);
      const moreNode = remainingCount
        ? [{
            id: `${tab.id}-${subtab.id}-more`,
            label: 'Xem thêm',
            path: subtab.path,
            badge: `+${remainingCount}`,
          }]
        : [];

      return [heading, ...leafNodes, ...moreNode];
    }),
  }));
};
