import { ROLES, filterNavigationByRole } from '@/config/navigation';

export const CAP_BAC = {
  QUAN_TRI_HE_THONG: 'quan_tri_he_thong',
  LANH_DAO: 'lanh_dao',
  QUAN_LY: 'quan_ly',
  NHAN_VIEN: 'nhan_vien',
  CONG_TAC_VIEN: 'cong_tac_vien',
};

export const MANG_PHU_TRACH = {
  DIEU_HANH: 'dieu_hanh',
  KINH_DOANH: 'kinh_doanh',
  MARKETING: 'marketing',
  TAI_CHINH: 'tai_chinh',
  NHAN_SU: 'nhan_su',
  PHAP_LY: 'phap_ly',
  VAN_HANH: 'van_hanh',
  WEBSITE_CMS: 'website_cms',
};

export const HO_SO_ROLE = {
  [ROLES.ADMIN]: {
    capBac: CAP_BAC.QUAN_TRI_HE_THONG,
    mang: MANG_PHU_TRACH.DIEU_HANH,
    tenHienThi: 'Quản trị hệ thống',
  },
  [ROLES.BOD]: {
    capBac: CAP_BAC.LANH_DAO,
    mang: MANG_PHU_TRACH.DIEU_HANH,
    tenHienThi: 'Lãnh đạo',
  },
  [ROLES.MANAGER]: {
    capBac: CAP_BAC.QUAN_LY,
    mang: MANG_PHU_TRACH.KINH_DOANH,
    tenHienThi: 'Quản lý',
  },
  [ROLES.SALES]: {
    capBac: CAP_BAC.NHAN_VIEN,
    mang: MANG_PHU_TRACH.KINH_DOANH,
    tenHienThi: 'Nhân viên kinh doanh',
  },
  [ROLES.MARKETING]: {
    capBac: CAP_BAC.NHAN_VIEN,
    mang: MANG_PHU_TRACH.MARKETING,
    tenHienThi: 'Nhân viên marketing',
  },
  [ROLES.CONTENT]: {
    capBac: CAP_BAC.NHAN_VIEN,
    mang: MANG_PHU_TRACH.WEBSITE_CMS,
    tenHienThi: 'Nhân viên website / CMS',
  },
  [ROLES.HR]: {
    capBac: CAP_BAC.NHAN_VIEN,
    mang: MANG_PHU_TRACH.NHAN_SU,
    tenHienThi: 'Nhân viên nhân sự',
  },
  [ROLES.FINANCE]: {
    capBac: CAP_BAC.NHAN_VIEN,
    mang: MANG_PHU_TRACH.TAI_CHINH,
    tenHienThi: 'Nhân viên tài chính',
  },
  [ROLES.LEGAL]: {
    capBac: CAP_BAC.NHAN_VIEN,
    mang: MANG_PHU_TRACH.PHAP_LY,
    tenHienThi: 'Nhân viên pháp lý',
  },
  [ROLES.AGENCY]: {
    capBac: CAP_BAC.CONG_TAC_VIEN,
    mang: MANG_PHU_TRACH.KINH_DOANH,
    tenHienThi: 'Cộng tác viên / Đại lý',
  },
};

export const TAB_DASHBOARD = {
  tong_quan: { id: 'tong_quan', label: 'Tổng quan' },
  nguoi_dung: { id: 'nguoi_dung', label: 'Người dùng' },
  vai_tro_phan_quyen: { id: 'vai_tro_phan_quyen', label: 'Vai trò & phân quyền' },
  co_cau_to_chuc: { id: 'co_cau_to_chuc', label: 'Cơ cấu tổ chức' },
  quy_trinh_phe_duyet: { id: 'quy_trinh_phe_duyet', label: 'Quy trình & phê duyệt' },
  du_lieu_chuan: { id: 'du_lieu_chuan', label: 'Dữ liệu chuẩn' },
  website_cms: { id: 'website_cms', label: 'Trang web & nội dung' },
  tich_hop: { id: 'tich_hop', label: 'Tích hợp' },
  bao_mat: { id: 'bao_mat', label: 'Bảo mật' },
  nhat_ky_he_thong: { id: 'nhat_ky_he_thong', label: 'Nhật ký hệ thống' },
  tong_quan_dieu_hanh: { id: 'tong_quan_dieu_hanh', label: 'Tổng quan điều hành' },
  kinh_doanh: { id: 'kinh_doanh', label: 'Kinh doanh' },
  tai_chinh: { id: 'tai_chinh', label: 'Tài chính' },
  nhan_su: { id: 'nhan_su', label: 'Nhân sự' },
  marketing: { id: 'marketing', label: 'Marketing' },
  phap_ly: { id: 'phap_ly', label: 'Pháp lý' },
  du_an_san_pham: { id: 'du_an_san_pham', label: 'Dự án & sản phẩm' },
  doi_tac_dai_ly: { id: 'doi_tac_dai_ly', label: 'Đối tác & đại lý' },
  canh_bao: { id: 'canh_bao', label: 'Cảnh báo' },
  bao_cao_chien_luoc: { id: 'bao_cao_chien_luoc', label: 'Báo cáo chiến lược' },
  doi_nhom: { id: 'doi_nhom', label: 'Đội nhóm' },
  kpi_hieu_suat: { id: 'kpi_hieu_suat', label: 'KPI & hiệu suất' },
  cong_viec: { id: 'cong_viec', label: 'Công việc' },
  khach_hang: { id: 'khach_hang', label: 'Khách hàng' },
  giao_dich: { id: 'giao_dich', label: 'Giao dịch' },
  bao_cao: { id: 'bao_cao', label: 'Báo cáo' },
  lich_lam_viec: { id: 'lich_lam_viec', label: 'Lịch làm việc' },
  canh_bao_van_hanh: { id: 'canh_bao_van_hanh', label: 'Cảnh báo vận hành' },
  viec_cua_toi: { id: 'viec_cua_toi', label: 'Việc của tôi' },
  du_lieu_cua_toi: { id: 'du_lieu_cua_toi', label: 'Dữ liệu của tôi' },
  lich_hen: { id: 'lich_hen', label: 'Lịch hẹn' },
  kpi_cua_toi: { id: 'kpi_cua_toi', label: 'KPI của tôi' },
  thong_bao: { id: 'thong_bao', label: 'Thông báo' },
  bieu_mau: { id: 'bieu_mau', label: 'Biểu mẫu' },
  lich_su_hoat_dong: { id: 'lich_su_hoat_dong', label: 'Lịch sử hoạt động' },
  nguon_khach: { id: 'nguon_khach', label: 'Nguồn khách' },
  pheu_giao_dich: { id: 'pheu_giao_dich', label: 'Phễu giao dịch' },
  booking: { id: 'booking', label: 'Giữ chỗ' },
  hop_dong: { id: 'hop_dong', label: 'Hợp đồng' },
  san_pham_gio_hang: { id: 'san_pham_gio_hang', label: 'Sản phẩm / giỏ hàng' },
  hoa_hong: { id: 'hoa_hong', label: 'Hoa hồng' },
  chien_dich: { id: 'chien_dich', label: 'Chiến dịch' },
  nguon_lead: { id: 'nguon_lead', label: 'Nguồn khách' },
  noi_dung: { id: 'noi_dung', label: 'Nội dung' },
  landing_page: { id: 'landing_page', label: 'Trang đích' },
  seo: { id: 'seo', label: 'Tối ưu tìm kiếm' },
  tracking: { id: 'tracking', label: 'Theo dõi' },
  tu_dong_hoa: { id: 'tu_dong_hoa', label: 'Tự động hóa' },
  doanh_thu: { id: 'doanh_thu', label: 'Doanh thu' },
  thu_chi: { id: 'thu_chi', label: 'Thu chi' },
  cong_no: { id: 'cong_no', label: 'Công nợ' },
  bang_luong: { id: 'bang_luong', label: 'Bảng lương' },
  du_bao: { id: 'du_bao', label: 'Dự báo' },
  bao_cao_thue: { id: 'bao_cao_thue', label: 'Báo cáo thuế' },
  phe_duyet_tai_chinh: { id: 'phe_duyet_tai_chinh', label: 'Phê duyệt tài chính' },
  doi_soat: { id: 'doi_soat', label: 'Đối soát' },
  tuyen_dung: { id: 'tuyen_dung', label: 'Tuyển dụng' },
  ho_so_nhan_su: { id: 'ho_so_nhan_su', label: 'Hồ sơ nhân sự' },
  cong_tac_vien: { id: 'cong_tac_vien', label: 'Cộng tác viên' },
  hop_dong_lao_dong: { id: 'hop_dong_lao_dong', label: 'Hợp đồng lao động' },
  cham_cong: { id: 'cham_cong', label: 'Chấm công' },
  dao_tao: { id: 'dao_tao', label: 'Đào tạo' },
  lo_trinh_thang_tien: { id: 'lo_trinh_thang_tien', label: 'Lộ trình thăng tiến' },
  danh_gia_nang_luc: { id: 'danh_gia_nang_luc', label: 'Đánh giá năng lực' },
  bao_cao_nhan_su: { id: 'bao_cao_nhan_su', label: 'Báo cáo nhân sự' },
  ho_so_phap_ly_du_an: { id: 'ho_so_phap_ly_du_an', label: 'Hồ sơ pháp lý dự án' },
  bieu_mau_phap_ly: { id: 'bieu_mau_phap_ly', label: 'Biểu mẫu pháp lý' },
  tien_do_xu_ly: { id: 'tien_do_xu_ly', label: 'Tiến độ xử lý' },
  canh_bao_rui_ro: { id: 'canh_bao_rui_ro', label: 'Cảnh báo rủi ro' },
  luu_tru_tai_lieu: { id: 'luu_tru_tai_lieu', label: 'Lưu trữ tài liệu' },
  trang: { id: 'trang', label: 'Trang' },
  du_an_hien_thi: { id: 'du_an_hien_thi', label: 'Dự án hiển thị' },
  bai_viet: { id: 'bai_viet', label: 'Bài viết' },
  menu_dieu_huong: { id: 'menu_dieu_huong', label: 'Menu / điều hướng' },
  form_lead: { id: 'form_lead', label: 'Biểu mẫu lấy khách' },
  banner_cta: { id: 'banner_cta', label: 'Banner / CTA' },
  lich_su_xuat_ban: { id: 'lich_su_xuat_ban', label: 'Lịch sử xuất bản' },
};

export const DASHBOARD_CHINH = [
  {
    id: 'trung_tam_quan_tri',
    label: 'Trung tâm quản trị',
    moTa: 'Điều khiển toàn bộ quyền, cấu hình, quy trình và trang web.',
    tabs: [
      'tong_quan',
      'nguoi_dung',
      'vai_tro_phan_quyen',
      'co_cau_to_chuc',
      'quy_trinh_phe_duyet',
      'du_lieu_chuan',
      'website_cms',
      'tich_hop',
      'bao_mat',
      'nhat_ky_he_thong',
    ],
  },
  {
    id: 'bang_dieu_hanh_lanh_dao',
    label: 'Bảng điều hành lãnh đạo',
    moTa: 'Toàn cảnh điều hành doanh nghiệp bất động sản sơ cấp.',
    tabs: [
      'tong_quan_dieu_hanh',
      'kinh_doanh',
      'tai_chinh',
      'nhan_su',
      'marketing',
      'phap_ly',
      'du_an_san_pham',
      'doi_tac_dai_ly',
      'canh_bao',
      'quy_trinh_phe_duyet',
      'bao_cao_chien_luoc',
    ],
  },
  {
    id: 'bang_dieu_hanh_quan_ly',
    label: 'Bảng điều hành quản lý',
    moTa: 'Điều hành đội nhóm, phê duyệt, KPI và cảnh báo vận hành.',
    tabs: [
      'tong_quan',
      'doi_nhom',
      'kpi_hieu_suat',
      'cong_viec',
      'khach_hang',
      'giao_dich',
      'quy_trinh_phe_duyet',
      'bao_cao',
      'lich_lam_viec',
      'canh_bao_van_hanh',
    ],
  },
  {
    id: 'bang_lam_viec_nhan_vien',
    label: 'Bảng làm việc nhân viên',
    moTa: 'Trung tâm công việc cá nhân và nghiệp vụ được giao.',
    tabs: [
      'tong_quan',
      'viec_cua_toi',
      'du_lieu_cua_toi',
      'lich_hen',
      'kpi_cua_toi',
      'thong_bao',
      'bieu_mau',
      'lich_su_hoat_dong',
    ],
  },
  {
    id: 'bang_kinh_doanh',
    label: 'Bảng kinh doanh',
    moTa: 'Nguồn khách, khách hàng, giao dịch, giữ chỗ, hợp đồng và hoa hồng.',
    tabs: [
      'tong_quan',
      'nguon_khach',
      'khach_hang',
      'pheu_giao_dich',
      'booking',
      'hop_dong',
      'san_pham_gio_hang',
      'kpi_hieu_suat',
      'hoa_hong',
      'bao_cao',
    ],
  },
  {
    id: 'bang_marketing',
    label: 'Bảng marketing',
    moTa: 'Nguồn khách, chiến dịch, nội dung, tối ưu tìm kiếm và theo dõi.',
    tabs: [
      'tong_quan',
      'chien_dich',
      'nguon_lead',
      'noi_dung',
      'landing_page',
      'bieu_mau',
      'seo',
      'tracking',
      'tu_dong_hoa',
      'bao_cao',
    ],
  },
  {
    id: 'bang_tai_chinh',
    label: 'Bảng tài chính',
    moTa: 'Doanh thu, công nợ, lương, thuế, đối soát và phê duyệt tài chính.',
    tabs: [
      'tong_quan',
      'doanh_thu',
      'thu_chi',
      'cong_no',
      'hoa_hong',
      'bang_luong',
      'du_bao',
      'bao_cao_thue',
      'phe_duyet_tai_chinh',
      'doi_soat',
    ],
  },
  {
    id: 'bang_nhan_su',
    label: 'Bảng nhân sự',
    moTa: 'Tuyển dụng, hồ sơ, đào tạo và phát triển năng lực.',
    tabs: [
      'tong_quan',
      'tuyen_dung',
      'ho_so_nhan_su',
      'cong_tac_vien',
      'hop_dong_lao_dong',
      'cham_cong',
      'dao_tao',
      'lo_trinh_thang_tien',
      'danh_gia_nang_luc',
      'bao_cao_nhan_su',
    ],
  },
  {
    id: 'bang_phap_ly',
    label: 'Bảng pháp lý',
    moTa: 'Pháp lý dự án, hợp đồng và kiểm soát rủi ro tuân thủ.',
    tabs: [
      'tong_quan',
      'ho_so_phap_ly_du_an',
      'hop_dong',
      'bieu_mau_phap_ly',
      'tien_do_xu_ly',
      'quy_trinh_phe_duyet',
      'canh_bao_rui_ro',
      'luu_tru_tai_lieu',
    ],
  },
  {
    id: 'bang_website_cms',
    label: 'Bảng trang web & nội dung',
    moTa: 'Điều hành trang web, trang đích, tối ưu tìm kiếm và lịch sử xuất bản.',
    tabs: [
      'tong_quan',
      'trang',
      'du_an_hien_thi',
      'bai_viet',
      'landing_page',
      'menu_dieu_huong',
      'form_lead',
      'seo',
      'banner_cta',
      'lich_su_xuat_ban',
    ],
  },
];

export const MA_TRAN_HIEN_THI_DASHBOARD = {
  [CAP_BAC.QUAN_TRI_HE_THONG]: [
    'trung_tam_quan_tri',
    'bang_dieu_hanh_lanh_dao',
    'bang_dieu_hanh_quan_ly',
    'bang_lam_viec_nhan_vien',
    'bang_kinh_doanh',
    'bang_marketing',
    'bang_tai_chinh',
    'bang_nhan_su',
    'bang_phap_ly',
    'bang_website_cms',
  ],
  [CAP_BAC.LANH_DAO]: [
    'bang_dieu_hanh_lanh_dao',
    'bang_kinh_doanh',
    'bang_marketing',
    'bang_tai_chinh',
    'bang_nhan_su',
    'bang_phap_ly',
    'bang_website_cms',
  ],
  [CAP_BAC.QUAN_LY]: [
    'bang_dieu_hanh_quan_ly',
    'bang_lam_viec_nhan_vien',
    'bang_kinh_doanh',
    'bang_marketing',
    'bang_tai_chinh',
    'bang_nhan_su',
    'bang_phap_ly',
    'bang_website_cms',
  ],
  [CAP_BAC.NHAN_VIEN]: [
    'bang_lam_viec_nhan_vien',
    'bang_kinh_doanh',
    'bang_marketing',
    'bang_tai_chinh',
    'bang_nhan_su',
    'bang_phap_ly',
    'bang_website_cms',
  ],
  [CAP_BAC.CONG_TAC_VIEN]: [
    'bang_lam_viec_nhan_vien',
    'bang_kinh_doanh',
  ],
};

export const GIOI_HAN_THEO_MANG = {
  [MANG_PHU_TRACH.DIEU_HANH]: [],
  [MANG_PHU_TRACH.KINH_DOANH]: ['bang_kinh_doanh'],
  [MANG_PHU_TRACH.MARKETING]: ['bang_marketing', 'bang_website_cms'],
  [MANG_PHU_TRACH.TAI_CHINH]: ['bang_tai_chinh'],
  [MANG_PHU_TRACH.NHAN_SU]: ['bang_nhan_su'],
  [MANG_PHU_TRACH.PHAP_LY]: ['bang_phap_ly'],
  [MANG_PHU_TRACH.VAN_HANH]: ['bang_dieu_hanh_quan_ly'],
  [MANG_PHU_TRACH.WEBSITE_CMS]: ['bang_website_cms', 'bang_marketing'],
};

export const NHOM_MENU_MOI = [
  {
    id: 'dieu_hanh',
    label: 'Điều hành',
    moTa: 'Xem nhanh tình hình doanh nghiệp và cảnh báo quan trọng.',
    dashboards: ['bang_dieu_hanh_lanh_dao', 'bang_dieu_hanh_quan_ly'],
  },
  {
    id: 'kinh_doanh',
    label: 'Kinh doanh',
    moTa: 'Quản lý khách hàng, giao dịch, dự án và sản phẩm.',
    dashboards: ['bang_kinh_doanh'],
  },
  {
    id: 'doanh_nghiep',
    label: 'Doanh nghiệp',
    moTa: 'Quản lý tiền, nhân sự, hợp đồng và công việc nội bộ.',
    dashboards: ['bang_tai_chinh', 'bang_nhan_su', 'bang_phap_ly'],
  },
  {
    id: 'tang_truong',
    label: 'Tăng trưởng',
    moTa: 'Quản lý marketing, trang web và thu hút khách hàng.',
    dashboards: ['bang_marketing', 'bang_website_cms'],
  },
  {
    id: 'he_thong',
    label: 'Hệ thống',
    moTa: 'Thiết lập quyền, người dùng và cấu hình quản trị.',
    dashboards: [],
  },
];

export const DASHBOARD_DIEU_HUONG = {
  trung_tam_quan_tri: { path: '/settings/governance', labelMenu: 'Trung tâm quản trị' },
  bang_dieu_hanh_lanh_dao: { path: '/dashboard', labelMenu: 'Lãnh đạo' },
  bang_dieu_hanh_quan_ly: { path: '/manager/dashboard', labelMenu: 'Quản lý' },
  bang_lam_viec_nhan_vien: { path: '/work', labelMenu: 'Làm việc' },
  bang_kinh_doanh: { path: '/sales', labelMenu: 'Kinh doanh' },
  bang_marketing: { path: '/marketing', labelMenu: 'Marketing' },
  bang_tai_chinh: { path: '/finance/overview', labelMenu: 'Tài chính' },
  bang_nhan_su: { path: '/hr', labelMenu: 'Nhân sự' },
  bang_phap_ly: { path: '/legal', labelMenu: 'Pháp lý' },
  bang_website_cms: { path: '/cms', labelMenu: 'Trang web & nội dung' },
};

export const MENU_HE_THONG = [
  { id: 'he-thong-governance', label: 'Trung tâm quản trị', path: '/settings/governance' },
  { id: 'he-thong-dashboard-architecture', label: 'Cấu trúc màn hình', path: '/settings/dashboard-architecture' },
  { id: 'he-thong-roles', label: 'Vai trò & phân quyền', path: '/settings/roles' },
  { id: 'he-thong-users', label: 'Người dùng', path: '/settings/users' },
  { id: 'he-thong-data-foundation', label: 'Dữ liệu chuẩn', path: '/settings/data-foundation' },
];

export const NHOM_MENU_CHI_TIET = {
  dieu_hanh: [
    { sectionId: 'control-center', heading: 'Tình hình chung' },
    { sectionId: 'analytics-bi', heading: 'Báo cáo & phân tích' },
  ],
  kinh_doanh: [
    { sectionId: 'crm-customer-360', heading: 'Khách hàng & nguồn khách' },
    { sectionId: 'sales-transaction', heading: 'Giao dịch & đặt chỗ' },
    { sectionId: 'project-management', heading: 'Dự án' },
    { sectionId: 'product-inventory', heading: 'Sản phẩm & kho hàng' },
    { sectionId: 'agency-distribution', heading: 'Đại lý & phân phối' },
  ],
  doanh_nghiep: [
    { sectionId: 'contract-legal', heading: 'Hợp đồng & pháp lý' },
    { sectionId: 'commission-finance', heading: 'Tiền bạc & hoa hồng' },
    { sectionId: 'workflow-operations', heading: 'Công việc & vận hành' },
    { sectionId: 'hr-recruitment', heading: 'Nhân sự & tuyển dụng' },
    { sectionId: 'training-academy', heading: 'Đào tạo & học viện' },
  ],
  tang_truong: [
    { sectionId: 'marketing-growth', heading: 'Marketing & thu hút khách' },
    { sectionId: 'system-security', heading: 'Trang web & nội dung', childFilter: (child) => child.id.startsWith('cms-') },
    { sectionId: 'customer-portal', heading: 'Cổng khách hàng', childFilter: () => true },
  ],
  he_thong: [
    { sectionId: 'system-security', heading: 'Thiết lập quản trị', childFilter: (child) => !child.id.startsWith('cms-') },
  ],
};

export const NHAN_MENU_DE_HIEU = {
  'Nguồn Lead': 'Nguồn khách',
  'Nhu cầu KH': 'Nhu cầu khách',
  'Phễu giao dịch': 'Các bước giao dịch',
  'Giữ chỗ mềm': 'Giữ chỗ tạm',
  'Giữ chỗ cứng': 'Giữ chỗ chính thức',
  'Bảng KPI': 'Kết quả kinh doanh',
  'KPI của tôi': 'Kết quả của tôi',
  'KPI đội nhóm': 'Kết quả đội nhóm',
  'Tỷ lệ chia': 'Chia hoa hồng',
  'Tổng quan lương': 'Tổng quan lương thưởng',
  'Nhật ký kiểm tra': 'Lịch sử kiểm tra',
  'Phân kỳ & Block': 'Phân khu & block',
  'Ngày làm việc': 'Việc trong ngày',
  'Khối lượng việc đội nhóm': 'Việc của đội',
  'Hợp đồng LĐ': 'Hợp đồng lao động',
  'Báo cáo điều hành': 'Báo cáo cho lãnh đạo',
  'Biên tập video': 'Làm video',
};

export const MENU_CON_CHUAN = {
  dieu_hanh: {
    'control-center': ['control-dashboard', 'control-alerts'],
    'analytics-bi': ['analytics-executive', 'analytics-reports'],
  },
  kinh_doanh: {
    'crm-customer-360': ['crm-leads', 'crm-contacts', 'crm-demands'],
    'sales-transaction': ['sales-pipeline', 'sales-soft-booking', 'sales-hard-booking', 'sales-kpi-my', 'sales-kpi-team'],
    'project-management': ['project-list', 'project-phases'],
    'product-inventory': ['inventory-products', 'inventory-stock', 'inventory-price-lists'],
    'agency-distribution': ['agency-list', 'agency-distribution', 'agency-performance', 'agency-collaborators'],
  },
  doanh_nghiep: {
    'contract-legal': ['contract-list', 'contract-pending', 'legal-overview'],
    'commission-finance': ['finance-overview', 'finance-receivables', 'finance-payouts', 'finance-commissions', 'finance-my-income', 'payroll-my-salary'],
    'workflow-operations': ['work-my-day', 'work-tasks', 'work-manager', 'work-calendar'],
    'hr-recruitment': ['hr-employees', 'hr-organization', 'recruitment-dashboard', 'hr-contracts'],
    'training-academy': ['training-courses', 'training-culture'],
  },
  tang_truong: {
    'marketing-growth': ['marketing-sources', 'marketing-campaigns', 'marketing-content', 'marketing-forms', 'marketing-automation'],
    'system-security': ['cms-dashboard', 'cms-pages', 'cms-articles', 'cms-landing-pages', 'cms-public-projects', 'cms-analytics'],
    'customer-portal': ['customer-portal-dashboard', 'customer-portal-profile', 'customer-portal-documents'],
  },
  he_thong: {},
};

export const BO_CUC_BEN_PHAI_THEO_NHOM = {
  dieu_hanh: ['Tình hình hôm nay', 'Cảnh báo cần xử lý', 'Báo cáo cho lãnh đạo'],
  kinh_doanh: ['Khách mới', 'Giao dịch đang theo', 'Giỏ hàng / booking'],
  doanh_nghiep: ['Việc nội bộ', 'Tiền bạc cần kiểm soát', 'Nhân sự / hồ sơ'],
  tang_truong: ['Chiến dịch đang chạy', 'Website / nội dung', 'Nguồn khách theo kênh'],
  he_thong: ['Người dùng', 'Vai trò & phân quyền', 'Dữ liệu chuẩn'],
};

export const NHOM_SALE_CHUYEN_BIET = [
  {
    id: 'my_team',
    label: 'Đội nhóm của tôi',
    moTa: 'Ai đang dẫn đội, bạn đứng đâu, quản lý đang push gì.',
    children: [
      { id: 'sales-team-lead', label: 'Thủ lĩnh của tôi', path: '/sales/my-team' },
      { id: 'sales-team-members', label: 'Thành viên trong nhóm', path: '/sales/my-team' },
      { id: 'sales-kpi-leaderboard', label: 'Xếp hạng hiện tại', path: '/sales/my-team' },
      { id: 'work-reminders', label: 'Thông báo từ quản lý', path: '/work/reminders' },
    ],
  },
  {
    id: 'khach_hang',
    label: 'Khách hàng',
    moTa: 'Khách mới, khách nóng và nhu cầu cần chốt.',
    children: [
      { id: 'crm-leads', label: 'Nguồn khách', path: '/crm/leads' },
      { id: 'crm-contacts', label: 'Khách hàng', path: '/crm/contacts' },
      { id: 'crm-demands', label: 'Nhu cầu khách', path: '/crm/demands' },
    ],
  },
  {
    id: 'san_pham',
    label: 'Sản phẩm',
    moTa: 'Dự án đang bán, sản phẩm ưu tiên, pháp lý và link gửi khách.',
    children: [
      { id: 'sales-projects', label: 'Dự án đang bán', path: '/sales/product-center?tab=du-an' },
      { id: 'sales-products', label: 'Sản phẩm nổi bật', path: '/sales/product-center?tab=hang-ngon' },
      { id: 'inventory-price-lists', label: 'Bảng giá', path: '/sales/product-center?tab=bang-gia' },
      { id: 'sales-pricing', label: 'Chính sách bán hàng', path: '/sales/product-center?tab=chinh-sach' },
      { id: 'sales-legal', label: 'Pháp lý dự án', path: '/sales/product-center?tab=phap-ly' },
      { id: 'sales-customer-materials', label: 'Tài liệu gửi khách', path: '/sales/product-center?tab=tai-lieu' },
    ],
  },
  {
    id: 'cong_viec',
    label: 'Công việc',
    moTa: 'Mở ra là biết hôm nay cần gọi ai, gặp ai, làm gì.',
    children: [
      { id: 'work-my-day', label: 'Việc hôm nay', path: '/work' },
      { id: 'work-tasks', label: 'Việc cần làm', path: '/work/tasks' },
      { id: 'work-calendar', label: 'Lịch hẹn', path: '/work/calendar' },
      { id: 'work-reminders-2', label: 'Nhắc việc', path: '/work/reminders' },
    ],
  },
  {
    id: 'ban_hang',
    label: 'Bán hàng',
    moTa: 'Theo giao dịch, giữ chỗ, hợp đồng và kết quả chốt bán hàng.',
    children: [
      { id: 'sales-pipeline', label: 'Các bước giao dịch', path: '/sales/pipeline', badge: 'Nóng' },
      { id: 'sales-soft-booking', label: 'Giữ chỗ tạm', path: '/sales/soft-bookings', badge: 'Hàng đợi' },
      { id: 'sales-hard-booking', label: 'Giữ chỗ chính thức', path: '/sales/hard-bookings' },
      { id: 'contract-list', label: 'Hợp đồng của tôi', path: '/sales/contracts' },
      { id: 'sales-kpi-my', label: 'Kết quả của tôi', path: '/kpi/my-performance' },
    ],
  },
  {
    id: 'kenh_ban_hang',
    label: 'Kênh bán hàng',
    moTa: 'Kênh cá nhân, nội dung để đăng và AI hỗ trợ kiếm khách.',
    children: [
      { id: 'marketing-sources', label: 'Kênh của tôi', path: '/sales/channel-center?tab=kenh-cua-toi' },
      { id: 'marketing-content', label: 'Nội dung để đăng', path: '/sales/channel-center?tab=noi-dung' },
      { id: 'marketing-forms', label: 'Biểu mẫu lấy khách', path: '/sales/channel-center?tab=bieu-mau' },
      { id: 'marketing-automation', label: 'AI hỗ trợ bán hàng', path: '/sales/channel-center?tab=ai', badge: 'AI' },
    ],
  },
  {
    id: 'tai_chinh_sale',
    label: 'Tài chính',
    moTa: 'Tiền mình làm ra, hoa hồng, thưởng và khoản chờ chi.',
    children: [
      { id: 'finance-my-income', label: 'Doanh thu của tôi', path: '/sales/finance-center?tab=doanh-thu' },
      { id: 'finance-commissions', label: 'Hoa hồng của tôi', path: '/sales/finance-center?tab=hoa-hong' },
      { id: 'payroll-my-salary', label: 'Lương / thưởng của tôi', path: '/sales/finance-center?tab=luong-thuong' },
    ],
  },
  {
    id: 'kien_thuc',
    label: 'Kiến thức',
    moTa: 'Những gì giúp kinh doanh trả lời nhanh, đúng và tự tin hơn.',
    children: [
      { id: 'marketing-templates', label: 'Kịch bản tư vấn', path: '/sales/knowledge-center?tab=tu-van' },
      { id: 'sales-faq', label: 'Câu hỏi thường gặp', path: '/sales/knowledge-center?tab=hoi-dap' },
      { id: 'training-courses', label: 'Khóa học', path: '/sales/knowledge-center?tab=dao-tao' },
    ],
  },
];

export const BO_CUC_BEN_PHAI_SALE = {
  my_team: ['Thủ lĩnh trực tiếp', 'Xếp hạng hiện tại', 'Thông báo từ quản lý'],
  khach_hang: ['Khách mới cần gọi', 'Khách đang theo', 'Nhu cầu cần xử lý'],
  san_pham: ['Dự án đang push', 'Chính sách mới nhất', 'Pháp lý gửi khách'],
  cong_viec: ['Việc hôm nay', 'Lịch hẹn sắp tới', 'Việc quá hạn'],
  ban_hang: ['Giao dịch đang theo', 'Giữ chỗ chờ xử lý', 'Kết quả tháng này'],
  kenh_ban_hang: ['Kênh hiệu quả nhất', 'Nội dung nên đăng', 'Gợi ý AI'],
  tai_chinh_sale: ['Doanh thu của tôi', 'Hoa hồng của tôi', 'Lương / thưởng'],
  kien_thuc: ['Tài liệu dự án', 'Kịch bản tư vấn', 'Khóa học mới'],
};

export const getNhomMenuTheoRole = (role) => {
  if (role === ROLES.SALES) {
    return NHOM_SALE_CHUYEN_BIET;
  }

  const dashboardsTheoRole = getDanhSachDashboardTheoRole(role);
  const dashboardsTheoId = new Map(dashboardsTheoRole.map((dashboard) => [dashboard.id, dashboard]));
  const laQuanTri = getHoSoRole(role).capBac === CAP_BAC.QUAN_TRI_HE_THONG;

  return NHOM_MENU_MOI.map((group) => {
    const children = group.id === 'he_thong'
      ? (laQuanTri
          ? MENU_HE_THONG.map((item) => ({
              id: item.id,
              label: item.label,
              path: item.path,
              dashboardId: 'trung_tam_quan_tri',
            }))
          : [])
      : group.dashboards
          .map((dashboardId) => dashboardsTheoId.get(dashboardId))
          .filter(Boolean)
          .map((dashboard) => ({
            id: dashboard.id,
            label: DASHBOARD_DIEU_HUONG[dashboard.id]?.labelMenu || dashboard.label,
            path: DASHBOARD_DIEU_HUONG[dashboard.id]?.path || '/dashboard',
            dashboardId: dashboard.id,
          }));

    if (!children.length) return null;

    return {
      id: group.id,
      label: group.label,
      moTa: group.moTa,
      children,
    };
  }).filter(Boolean);
};

export const getSidebarGroupsByRole = (role) => {
  if (role === ROLES.SALES) {
    return NHOM_SALE_CHUYEN_BIET;
  }

  const filteredNavigation = filterNavigationByRole(role);
  const sectionMap = new Map(filteredNavigation.map((section) => [section.id, section]));
  const laQuanTri = getHoSoRole(role).capBac === CAP_BAC.QUAN_TRI_HE_THONG;

  return NHOM_MENU_MOI.map((group) => {
    const groupConfig = NHOM_MENU_CHI_TIET[group.id] || [];
    const children = [];

    if (group.id === 'he_thong' && laQuanTri) {
      MENU_HE_THONG.forEach((item) => {
        children.push({
          id: item.id,
          label: item.label,
          path: item.path,
        });
      });
    }

    groupConfig.forEach((config) => {
      const section = sectionMap.get(config.sectionId);
      if (!section?.children?.length) return;

      const filteredBySection = config.childFilter
        ? section.children.filter(config.childFilter)
        : section.children;

      const childAllowList = MENU_CON_CHUAN[group.id]?.[config.sectionId];
      const filteredChildren = childAllowList?.length
        ? filteredBySection.filter((child) => childAllowList.includes(child.id))
        : filteredBySection;

      if (!filteredChildren.length) return;

      children.push({
        id: `${group.id}-${config.sectionId}-heading`,
        label: config.heading,
        isHeading: true,
      });

      filteredChildren.forEach((child) => {
        children.push({
          id: child.id,
          label: NHAN_MENU_DE_HIEU[child.label] || child.label,
          path: child.path,
          badge: child.badge,
        });
      });
    });

    if (!children.length) return null;

    return {
      id: group.id,
      label: group.label,
      moTa: group.moTa,
      children,
    };
  }).filter(Boolean);
};

export const getHoSoRole = (role) => HO_SO_ROLE[role] || {
  capBac: CAP_BAC.NHAN_VIEN,
  mang: MANG_PHU_TRACH.KINH_DOANH,
  tenHienThi: 'Nhân viên',
};

export const getDanhSachDashboardTheoRole = (role) => {
  const profile = getHoSoRole(role);
  const danhSachTheoCapBac = MA_TRAN_HIEN_THI_DASHBOARD[profile.capBac] || [];
  const gioiHanTheoMang = GIOI_HAN_THEO_MANG[profile.mang] || [];

  const dashboardBatBuoc = new Set();

  if (profile.capBac === CAP_BAC.QUAN_TRI_HE_THONG) {
    return DASHBOARD_CHINH;
  }

  if (profile.capBac === CAP_BAC.LANH_DAO) {
    return DASHBOARD_CHINH.filter((dashboard) => danhSachTheoCapBac.includes(dashboard.id));
  }

  if (profile.capBac === CAP_BAC.QUAN_LY) {
    ['bang_dieu_hanh_quan_ly', 'bang_lam_viec_nhan_vien', ...gioiHanTheoMang].forEach((id) => dashboardBatBuoc.add(id));
    return DASHBOARD_CHINH.filter((dashboard) => dashboardBatBuoc.has(dashboard.id));
  }

  if (profile.capBac === CAP_BAC.CONG_TAC_VIEN) {
    ['bang_lam_viec_nhan_vien', 'bang_kinh_doanh'].forEach((id) => dashboardBatBuoc.add(id));
    return DASHBOARD_CHINH.filter((dashboard) => dashboardBatBuoc.has(dashboard.id));
  }

  ['bang_lam_viec_nhan_vien', ...gioiHanTheoMang].forEach((id) => dashboardBatBuoc.add(id));
  return DASHBOARD_CHINH.filter((dashboard) => dashboardBatBuoc.has(dashboard.id));
};

export const getTabsChoDashboard = (dashboardId) => {
  const dashboard = DASHBOARD_CHINH.find((item) => item.id === dashboardId);
  if (!dashboard) return [];
  return dashboard.tabs.map((tabId) => TAB_DASHBOARD[tabId]).filter(Boolean);
};

export const getMaTranHienThiTabs = () =>
  DASHBOARD_CHINH.map((dashboard) => ({
    ...dashboard,
    tabsChiTiet: getTabsChoDashboard(dashboard.id),
  }));
