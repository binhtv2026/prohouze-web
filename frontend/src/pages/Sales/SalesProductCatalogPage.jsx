/**
 * SalesProductCatalogPage.jsx — Giỏ hàng thực tế
 * Dự án: NOBU RESIDENCES DANANG (Đang mở bán 2025)
 * Nguồn: VCRE / Circle Point Real Estate JSC
 * Dữ liệu: Từ Factsheet, FAQ, Booking Form chính thức
 */
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, SlidersHorizontal, Flame, Share2, BookmarkCheck, X,
  CheckCircle, Clock, AlertCircle, Filter, MapPin,
  RotateCcw, Home, ChevronDown, Bed, Maximize2,
  Phone, Info, Star, TrendingUp, Building2,
  BookOpen, ChevronRight, Lightbulb, ShieldCheck, MessageSquare,
} from 'lucide-react';

// ─── 63 TỈNH THÀNH VIỆT NAM ───────────────────────────────────────────────────
const ALL_PROVINCES = [
  'An Giang','Bà Rịa - Vũng Tàu','Bắc Giang','Bắc Kạn','Bạc Liêu',
  'Bắc Ninh','Bến Tre','Bình Định','Bình Dương','Bình Phước','Bình Thuận',
  'Cà Mau','Cần Thơ','Cao Bằng','Đà Nẵng','Đắk Lắk','Đắk Nông',
  'Điện Biên','Đồng Nai','Đồng Tháp','Gia Lai','Hà Giang','Hà Nam',
  'Hà Nội','Hà Tĩnh','Hải Dương','Hải Phòng','Hậu Giang','Hòa Bình',
  'Hưng Yên','Khánh Hòa','Kiên Giang','Kon Tum','Lai Châu','Lâm Đồng',
  'Lạng Sơn','Lào Cai','Long An','Nam Định','Nghệ An','Ninh Bình',
  'Ninh Thuận','Phú Thọ','Phú Yên','Quảng Bình','Quảng Nam','Quảng Ngãi',
  'Quảng Ninh','Quảng Trị','Sóc Trăng','Sơn La','Tây Ninh','Thái Bình',
  'Thái Nguyên','Thanh Hóa','Thừa Thiên Huế','Tiền Giang','TP. Hồ Chí Minh',
  'Trà Vinh','Tuyên Quang','Vĩnh Long','Vĩnh Phúc','Yên Bái',
];

// ─── DỰ ÁN THẬT (NOBU + SUN SYMPHONY) ────────────────────────────────────────
const PROJECTS = [
  {
    id: 'NBU',
    name: 'Nobu Residences Danang',
    nameShort: 'NOBU DANANG',
    developer: 'Circle Point Real Estate JSC (VCRE)',
    developerShort: 'VCRE',
    operator: 'Nobu Hospitality (Robert De Niro, Nobu Matsuhisa)',
    province: 'Đà Nẵng',
    address: 'Lô A2 góc Võ Nguyên Giáp – Võ Văn Kiệt, P. Phước Mỹ, Q. Sơn Trà, Đà Nẵng',
    type: 'condotel',
    typeName: 'Căn hộ du lịch (Condotel)',
    totalUnits: 264,
    hotelRooms: 186,
    floors: 43,
    height: '186m',
    siteArea: 3000,
    guarantee: 6,
    guaranteeYears: 2,
    revenueShare: 40,
    openYear: 2027,
    tag: '🔴 ĐANG MỞ BÁN',
    tagColor: 'bg-red-500',
    badge: 'ĐẶC BIỆT',
    badgeColor: 'bg-amber-500',
    image: '🏙️',
    status: 'selling',
    commPct: 3.5,
    hotline: '+84 931 713 713',
    bankAccount: '617 7979 686868 – Ngân hàng Bản Việt (BVBank)',
    highlight: [
      'Nobu Residences đầu tiên tại Đông Nam Á',
      'Cam kết thuê 6%/năm trong 2 năm đầu từ khai trương 2027',
      'Vận hành bởi Nobu Hospitality – Top 25 luxury brands (Robb Report)',
      '264 căn giới hạn – Biểu tượng kiến trúc 186m tại My Khe Beach',
    ],
    floorMap: {
      '1': 'Lobby + Reception + Retail',
      '3-4': 'Wellness & Retreat (Spa)',
      '5': 'Ballroom + Meeting Rooms',
      '6': 'Taste of Asia Restaurant',
      '7-16': 'Nobu Hotel (186 phòng)',
      '18': 'Tiện ích cư dân',
      '19-36': 'Nobu Residences (Studio, 1PN, 2PN, 3DK)',
      '38-40': 'Sky Villas (3PN + hồ bơi)',
      '41': 'Penthouses',
      '42': 'Nobu Restaurant',
      '43': 'Tsukimidai Sky Bar',
    },
  },
  {
    id: 'SSR',
    name: 'Sun Symphony Residence',
    nameShort: 'SUN SYMPHONY',
    developer: 'S-Realty Đà Nẵng (Sun Group)',
    developerShort: 'Sun Group',
    operator: 'Sun Hospitality Group',
    province: 'Đà Nẵng',
    address: 'Mặt tiền Trần Hưng Đạo, bờ Sông Hàn, Q. Sơn Trà, Đà Nẵng',
    type: 'apartment',
    typeName: 'Căn hộ chung cư (sở hữu lâu dài)',
    totalUnits: 1373,
    hotelRooms: 0,
    floors: 30,
    height: '~110m',
    siteArea: 5400,
    guarantee: 0,
    guaranteeYears: 0,
    revenueShare: 0,
    openYear: 2026,
    tag: '🟢 GIÁ TỐT',
    tagColor: 'bg-emerald-500',
    badge: 'VIEW SÔNG HÀN',
    badgeColor: 'bg-blue-500',
    image: '🌇',
    status: 'selling',
    commPct: 3.0,
    hotline: 'Liên hệ CSBH',
    bankAccount: 'Liên hệ để biết TK chính thức',
    highlight: [
      'View trực diện Sông Hàn – ngắm pháo hoa DIFF từ nhà',
      'Sở hữu lâu dài – CĐT Sun Group uy tín bậc nhất',
      'Chiết khấu lên tới 9.5% khi TT sớm 95%',
      'Hỗ trợ vay 70%, ân hạn nợ gốc đến 30 tháng',
    ],
    floorMap: {
      '1-2': 'Shophouse & Retail',
      '3': 'Tiện ích (Bể bơi, Gym, Spa, BBQ)',
      '4-28': 'The Symphony (Căn hộ)',
      '29-30': 'Duplex & Penthouse',
      'B1-B3': 'Bãi đỗ xe',
    },
  },
];



// ─── GIỎ HÀNG CĂN HỘ (representative sample, giá tham khảo thị trường) ───────
// Lưu ý: Giá chính thức liên hệ CSBH từ VCRE. Số căn còn theo trạng thái thực.
const UNITS = [
  // ── STUDIO (Tầng 19-36, bắt buộc CTCT, ~35-40m²) ──
  {
    id: 'NBU-STU-2201', project: 'NBU', code: 'STU-22-01',
    type: 'STU', typeName: 'Studio', floor: 22, block: 'A',
    beds: 0, area: 36, gfa: 39,
    price: 6200000000, priceNeg: false,
    status: 'available',
    view: 'Biển Mỹ Khê + Bán đảo Sơn Trà', direction: 'Đông Nam',
    rentalEst: 3800000, rentalNote: '3.8 tr/đêm kỳ vọng 2027',
    roiGuarantee: 6, ctct: true,
    tag: '🏖️ VIEW BIỂN',
  },
  {
    id: 'NBU-STU-2801', project: 'NBU', code: 'STU-28-01',
    type: 'STU', typeName: 'Studio', floor: 28, block: 'A',
    beds: 0, area: 36, gfa: 39,
    price: 6800000000, priceNeg: false,
    status: 'available',
    view: 'Sông Hàn + Thành phố + Pháo hoa', direction: 'Tây',
    rentalEst: 3800000, rentalNote: '3.8 tr/đêm kỳ vọng 2027',
    roiGuarantee: 6, ctct: true,
    tag: '🎆 VIEW PHÁO HOA',
  },
  // ── 1 PHÒNG NGỦ (1PN, ~52-58m²) ──
  {
    id: 'NBU-1PN-2401', project: 'NBU', code: '1PN-24-01',
    type: '1PN', typeName: '1 Phòng ngủ', floor: 24, block: 'B',
    beds: 1, area: 54, gfa: 59,
    price: 10500000000, priceNeg: false,
    status: 'available',
    view: 'Biển Mỹ Khê trực diện', direction: 'Đông',
    rentalEst: 5500000, rentalNote: '5.5 tr/đêm kỳ vọng 2027',
    roiGuarantee: 6, ctct: true,
    tag: '⭐ HOT',
  },
  {
    id: 'NBU-1PN-3101', project: 'NBU', code: '1PN-31-01',
    type: '1PN', typeName: '1 Phòng ngủ', floor: 31, block: 'C',
    beds: 1, area: 52, gfa: 57,
    price: 11800000000, priceNeg: false,
    status: 'hold',
    view: 'Thành phố + Cầu Rồng', direction: 'Tây Bắc',
    rentalEst: 5500000, rentalNote: '5.5 tr/đêm kỳ vọng 2027',
    roiGuarantee: 6, ctct: true,
    tag: '⏳ ĐANG HOLD',
  },
  // ── 2 PHÒNG NGỦ (2PN, ~74-82m²) ──
  {
    id: 'NBU-2PN-2601', project: 'NBU', code: '2PN-26-01',
    type: '2PN', typeName: '2 Phòng ngủ', floor: 26, block: 'A',
    beds: 2, area: 76, gfa: 83,
    price: 17200000000, priceNeg: false,
    status: 'available',
    view: 'Biển Mỹ Khê + Võ Nguyên Giáp', direction: 'Đông Nam',
    rentalEst: 9500000, rentalNote: '9.5 tr/đêm kỳ vọng 2027',
    roiGuarantee: 6, ctct: true,
    tag: '💎 TỐNG BÁN',
  },
  {
    id: 'NBU-2PN-3401', project: 'NBU', code: '2PN-34-01',
    type: '2PN', typeName: '2 Phòng ngủ', floor: 34, block: 'B',
    beds: 2, area: 78, gfa: 85,
    price: 19800000000, priceNeg: true,
    status: 'available',
    view: 'Toàn cảnh Đà Nẵng 360°', direction: 'Đông Bắc',
    rentalEst: 9500000, rentalNote: '9.5 tr/đêm kỳ vọng 2027',
    roiGuarantee: 6, ctct: false,
    tag: '🌅 TẦNG CAO',
  },
  // ── 3 PHÒNG NGỦ DUAL KEY (3DK, ~110-120m²) ──
  {
    id: 'NBU-3DK-2901', project: 'NBU', code: '3DK-29-01',
    type: '3DK', typeName: '3PN Dual Key', floor: 29, block: 'A',
    beds: 3, area: 112, gfa: 122,
    price: 31000000000, priceNeg: false,
    status: 'available',
    view: 'Biển Mỹ Khê + Sông Hàn', direction: 'Đông Nam',
    rentalEst: 12000000, rentalNote: '12 tr/đêm kỳ vọng 2027',
    roiGuarantee: 6, ctct: true,
    tag: '⭐ HOT',
  },
  {
    id: 'NBU-3DK-3301', project: 'NBU', code: '3DK-33-01',
    type: '3DK', typeName: '3PN Dual Key', floor: 33, block: 'C',
    beds: 3, area: 118, gfa: 128,
    price: 34500000000, priceNeg: true,
    status: 'hold',
    view: 'Panorama 180° biển và thành phố', direction: 'Đông',
    rentalEst: 12000000, rentalNote: '12 tr/đêm kỳ vọng 2027',
    roiGuarantee: 6, ctct: true,
    tag: '⏳ ĐANG HOLD',
  },
  // ── SKY VILLA 3PN + HỒ BƠI (3SP, Tầng 38-40) ──
  {
    id: 'NBU-3SP-3801', project: 'NBU', code: '3SP-38-01',
    type: '3SP', typeName: '3PN Sky Villa + Hồ bơi', floor: 38, block: 'SK',
    beds: 3, area: 145, gfa: 160,
    price: 75000000000, priceNeg: true,
    status: 'available',
    view: 'Toàn cảnh biển Mỹ Khê + Sơn Trà', direction: 'Đông',
    rentalEst: 30000000, rentalNote: '30 tr/đêm kỳ vọng 2027',
    roiGuarantee: 6, ctct: false,
    tag: '👑 SKY VILLA',
  },
  // ── PENTHOUSE (Tầng 41) ──
  {
    id: 'NBU-PH-4101', project: 'NBU', code: 'PH-41-01',
    type: 'PH', typeName: 'Penthouse', floor: 41, block: 'SK',
    beds: 4, area: 280, gfa: 310,
    price: 155000000000, priceNeg: true,
    status: 'available',
    view: '360° Biển – Sông Hàn – Núi Sơn Trà – TP Đà Nẵng', direction: 'Đông Bắc',
    rentalEst: null, rentalNote: 'Liên hệ để biết giá thuê',
    roiGuarantee: 6, ctct: false,
    tag: '💎 ĐỘC BẢN',
  },
  // ── SUN SYMPHONY RESIDENCE ──────────────────────────────────────────────────
  {
    id: 'SSR-STU-0501', project: 'SSR', code: 'STU-05-01',
    type: 'STU', typeName: 'Studio', floor: 5, block: 'A',
    beds: 0, area: 36, gfa: 38,
    price: 0, priceNeg: false,
    status: 'available',
    view: 'Sông Hàn + Cầu Rồng', direction: 'Tây',
    rentalEst: 0, rentalNote: 'Tự khai thác',
    roiGuarantee: 0, ctct: false,
    tag: '🌉 VIEW SÔNG HÀN',
  },
  {
    id: 'SSR-1PN-1001', project: 'SSR', code: '1PN-10-01',
    type: '1PN', typeName: '1 Phòng ngủ', floor: 10, block: 'B',
    beds: 1, area: 52, gfa: 56,
    price: 0, priceNeg: false,
    status: 'available',
    view: 'Sông Hàn + Cầu Tình Yêu', direction: 'Tây Bắc',
    rentalEst: 0, rentalNote: 'Tự khai thác',
    roiGuarantee: 0, ctct: false,
    tag: '⭐ HOT',
  },
  {
    id: 'SSR-2PN-1501', project: 'SSR', code: '2PN-15-01',
    type: '2PN', typeName: '2 Phòng ngủ', floor: 15, block: 'A',
    beds: 2, area: 72, gfa: 77,
    price: 0, priceNeg: false,
    status: 'available',
    view: 'Sông Hàn + Pháo hoa DIFF', direction: 'Tây',
    rentalEst: 0, rentalNote: 'Tự khai thác',
    roiGuarantee: 0, ctct: false,
    tag: '🎆 VIEW PHÁO HOA',
  },
  {
    id: 'SSR-2PN-2001', project: 'SSR', code: '2PN-20-01',
    type: '2PN', typeName: '2 Phòng ngủ', floor: 20, block: 'B',
    beds: 2, area: 78, gfa: 83,
    price: 0, priceNeg: true,
    status: 'hold',
    view: 'Núi Sơn Trà + Biển', direction: 'Đông',
    rentalEst: 0, rentalNote: 'Tự khai thác',
    roiGuarantee: 0, ctct: false,
    tag: '⏳ ĐANG HOLD',
  },
  {
    id: 'SSR-3PN-2501', project: 'SSR', code: '3PN-25-01',
    type: '3PN', typeName: '3 Phòng ngủ', floor: 25, block: 'A',
    beds: 3, area: 98, gfa: 105,
    price: 0, priceNeg: false,
    status: 'available',
    view: 'Toàn cảnh Đà Nẵng 360°', direction: 'Đông Tây',
    rentalEst: 0, rentalNote: 'Tự khai thác',
    roiGuarantee: 0, ctct: false,
    tag: '🏙️ TẦNG CAO',
  },
  {
    id: 'SSR-PH-3001', project: 'SSR', code: 'PH-30-01',
    type: 'PH', typeName: 'Penthouse/Duplex', floor: 30, block: 'SK',
    beds: 4, area: 150, gfa: 165,
    price: 0, priceNeg: true,
    status: 'available',
    view: 'Sông Hàn + Biển Mỹ Khê + Núi', direction: 'Toàn cảnh',
    rentalEst: 0, rentalNote: 'Tự khai thác',
    roiGuarantee: 0, ctct: false,
    tag: '👑 PENTHOUSE',
  },
];


// ─── Hàng gửi bán lại ─────────────────────────────────────────────────────────
const CONSIGNMENT_UNITS = [
  {
    id: 'GBL-NBU-001',
    name: 'NOBU Danang Studio 22-01',
    project: 'Nobu Residences Danang',
    province: 'Đà Nẵng',
    beds: 0, area: 36, floor: 22,
    price: 6500000000, originalPrice: 6200000000,
    view: 'Biển Mỹ Khê', direction: 'Đông Nam',
    verified: true,
    ownerNote: 'Chủ cần thanh khoản, giá thấp hơn giá cùng tầng hiện tại',
    saleYear: 2024, tag: '🔑 CHÍNH CHỦ',
  },
];

// ─── KIẾN THỨC BÁN HÀNG — NOBU DANANG ────────────────────────────────────────
// Nguồn chính thức: Nobu DN FAQ 2024.11.15.pdf (VCRE)
const PROJECT_KNOWLEDGE = {
  NBU: {
    usps: [
      {
        title: 'Nobu Residences đầu tiên & duy nhất tại Đông Nam Á',
        body: 'Nobu là thương hiệu nghỉ dưỡng hạng sang được xếp hạng Top 25 Most Innovative Brands bởi Robb Report. Robert De Niro & Nobu Matsuhisa đứng sau thương hiệu này. Đây là cơ hội sở hữu "lần đầu tiên" có 1-0-2 trong khu vực.',
        icon: '🏆', tag: 'ĐIỂM NHẤT',
      },
      {
        title: 'Vị trí "Di sản" — Không thể tái tạo',
        body: 'Góc đường Võ Nguyên Giáp – Võ Văn Kiệt, trực diện biển Mỹ Khê. Đây là lô đất cuối cùng tại vị trí đắc địa nhất Đà Nẵng. Không có dự án thứ 2 được xây tại đây.',
        icon: '📍', tag: 'VỊ TRÍ',
      },
      {
        title: 'Cam kết thuê 6%/năm – 2 năm đầu từ khai trương 2027',
        body: 'CĐT cam kết 6%/năm trên giá trị HĐ (chưa VAT, chưa KPBT) trong 2 năm đầu tiên kể từ ngày khai trương chính thức. Sau đó nhận 40% doanh thu gộp theo pool cùng loại căn.',
        icon: '💰', tag: 'ROI',
      },
      {
        title: '45 điểm nghỉ dưỡng – Đổi đêm miễn phí mỗi năm',
        body: 'Mỗi năm chủ sở hữu có 45 điểm đổi đêm nghỉ miễn phí tại Nobu Danang hoặc Nobu toàn cầu. Giảm 15% nhà hàng Nobu, 10% khách sạn Nobu toàn hệ thống.',
        icon: '🎁', tag: 'ĐẶC QUYỀN',
      },
      {
        title: 'Pháp lý đầy đủ – 4 loại giấy tờ',
        body: 'GCN QSDĐ + GCN Đăng ký DN + GPXD + GCN Đăng ký đầu tư (MS0650824421). Ngân hàng hỗ trợ vay: MB Bank, BVBank. Đặc biệt – BVBank là ngân hàng trong cùng hệ sinh thái Phoenix Holdings.',
        icon: '📋', tag: 'PHÁP LÝ',
      },
    ],
    objections: [
      {
        q: 'Condotel chỉ sở hữu 50 năm, sao đầu tư được?',
        a: '5 lý do để đầu tư vẫn hấp dẫn: (1) Đà Nẵng là thành phố đáng sống nhất ĐNA – du lịch tăng trưởng bền vững; (2) Vị trí di sản – không thể tái tạo; (3) Nobu 5 sao quốc tế vận hành – đảm bảo công suất thuê cao; (4) BĐS Branded Residences luôn giữ giá và gia tăng giá trị theo thương hiệu; (5) Thời hạn sẽ được gia hạn theo pháp luật tại từng thời điểm.',
        icon: '⏰',
      },
      {
        q: 'VCRE là CĐT mới, có đảm bảo không?',
        a: 'VCRE thuộc hệ sinh thái Phoenix Holdings – cùng nhóm với BVBank, Vietcap Securities, 7-Eleven, McDonald\'s, CLB Saigon Heat. Phoenix Holdings là quỹ đầu tư gia đình tiên phong tại VN với danh mục đa ngành. VCRE cam kết bàn giao đúng tiến độ với pháp lý hoàn chỉnh.',
        icon: '🏢',
      },
      {
        q: 'Chủ sở hữu có tự ý cho thuê được không?',
        a: 'Không được tự cho thuê ra ngoài để bảo đảm chất lượng vận hành 5 sao. Nhưng bù lại: được nhận 40% gross revenue theo pool, 45 điểm đổi đêm miễn phí/năm, và báo cáo kiểm toán minh bạch hàng năm từ công ty kiểm toán độc lập.',
        icon: '🔑',
      },
      {
        q: 'Giá thuê kỳ vọng có thực tế không?',
        a: 'Giá thuê kỳ vọng năm 2027 dựa trên benchmark thị trường Đà Nẵng + tham chiếu các Nobu Hotel tương tự tại Phuket, Bali. Studio 3.8M/đêm tương đương giá phòng khách sạn 4+ sao tại Đà Nẵng năm 2024. Khi Nobu khai trương 2027, mức này sẽ là competitive.',
        icon: '📊',
      },
      {
        q: 'Có phải đóng phí quản lý không?',
        a: 'Có – 45,000 VNĐ/m²/tháng (NFA) chưa VAT, điều chỉnh theo đơn vị vận hành. Ngoài ra: bảo hiểm căn hộ, FF&E fund 4% gross revenue. Tuy nhiên toàn bộ chi phí này đã được tính vào ROI 6% cam kết 2 năm đầu.',
        icon: '💸',
      },
    ],
    faqs: [
      {
        cat: 'I. TỔNG QUAN DỰ ÁN',
        icon: '🏙️',
        items: [
          {
            q: 'Nhà phát triển dự án VCRE là ai?',
            a: 'Công ty BĐS Bản Việt (VCRE) thuộc hệ sinh thái Phoenix Holdings – nhà phát triển "Boutique Real Estate" hàng đầu VN. Hệ sinh thái gồm: BVBank, Vietcap Securities, Vietcredit, VCAM, Timo, 7-Eleven, McDonald\'s, Saigon Heat, Bloomberg Businessweek. Website: vcre.com.vn.',
          },
          {
            q: 'Thông tin tổng quan dự án?',
            a: 'Tên: Nobu Residences Danang | CĐT: Circle Point Real Estate JSC | Địa chỉ: Lô A2 góc Võ Nguyên Giáp – Võ Văn Kiệt, P.Phước Mỹ, Q.Sơn Trà, Đà Nẵng | Diện tích khuôn viên: 3,000m² | Quy mô: 43 tầng + 2 hầm, cao 186m | 264 căn nghỉ dưỡng + 186 phòng KS | Vận hành: Nobu Hospitality.',
          },
          {
            q: 'Ý tưởng thiết kế kiến trúc có gì đặc biệt?',
            a: 'Kiến trúc lấy cảm hứng từ triết học Nhật Bản – đơn giản nhưng tinh tế. Tòa nhà cao 186m là công trình đáng chú ý nhất Đà Nẵng, kết hợp giữa hiện đại và văn hóa bản địa. Đội ngũ thiết kế quốc tế: KTS Mỹ (chì đạo), thiết kế mặt đứng từ Thái Lan, nội thất Thái Lan, kỹ thuật từ HK, lighting Singapore, kitchen US/Malaysia.',
          },
          {
            q: 'Dự án có tầng trú ẩn không?',
            a: 'Có – Tầng 17 và Tầng 37 là tầng lánh nạn (Refuge Floor) theo tiêu chuẩn PCCC VN 3890:2023 + NFPA 5000.',
          },
          {
            q: 'Dự án có những tiện ích gì đặc biệt?',
            a: 'Lobby Lounge · Nobu Restaurant (tầng 42) · Ballroom + 3 phòng họp · Taste of Asia Restaurant (tầng 6) · Wellness & Retreat spa center (tầng 3-4) · Heated Swimming Pool (Katamochi) · Sky Gym · Kids Club · Pool Bar · Tsukimidai Sky Bar (tầng 43) · Retail Area.',
          },
          {
            q: 'Có bao nhiêu mẫu thiết kế căn hộ?',
            a: '6 loại: Studio · 1 Phòng ngủ · 2 Phòng ngủ · 3PN Dual Key · 3PN Sky Villa (+ hồ bơi riêng) · Penthouse. Phân bố: Tầng 19-36 (căn tiêu chuẩn), Tầng 38-40 (Sky Villas), Tầng 41 (Penthouses).',
          },
          {
            q: 'Tại sao đầu tư Căn hộ du lịch 50 năm vẫn đáng?',
            a: '5 lý do: (1) Đà Nẵng – thành phố đáng sống ĐNA; (2) Vị trí di sản không thể tái tạo; (3) Nobu 5 sao quốc tế vận hành; (4) BĐS Branded Residences giữ và tăng giá trị theo thương hiệu; (5) Thời hạn gia hạn theo pháp luật.',
          },
        ],
      },
      {
        cat: 'II. ĐƠN VỊ VẬN HÀNH',
        icon: '⭐',
        items: [
          {
            q: 'Đơn vị vận hành Nobu là ai?',
            a: 'Nobu Hospitality – được đồng sáng lập bởi đầu bếp Nobu Matsuhisa, diễn viên Robert De Niro, và nhà đầu tư Meir Teper. Được Robb Report xếp hạng Top 25 Most Innovative Luxury Brands. Hoạt động tại 5 châu lục, là trải nghiệm lifestyle đích thực.',
          },
          {
            q: 'Sự khác biệt của Nobu so với đơn vị vận hành khác tại VN?',
            a: 'Nobu tích hợp nhà hàng – khách sạn – residences thành một ecosystem. Ước tính 10-15% khách nhà hàng Nobu sẽ lưu trú tại khách sạn → tăng công suất phòng tự nhiên. Bản sắc Nhật-Mỹ độc đáo, thiết kế tinh tế hòa quyện văn hóa bản địa.',
          },
        ],
      },
      {
        cat: 'III. CHƯƠNG TRÌNH CHO THUÊ',
        icon: '💰',
        items: [
          {
            q: 'Dự án có cam kết thu nhập cho thuê không?',
            a: 'Có. Cam kết 6%/năm trên giá trị HĐ (chưa VAT, chưa KPBT) trong 2 năm đầu tiên kể từ ngày khai trương chính thức.',
          },
          {
            q: 'Sau 2 năm cam kết, doanh thu được chia như thế nào?',
            a: 'Chủ sở hữu nhận 40% doanh thu gộp theo pool cùng loại căn. Gross revenue = Doanh thu thuê phòng – VAT – Phí HH đại lý du lịch – Phí thẻ NH – thuế phí khách trả. Tỷ lệ phân chia theo giá trị đầu tư + điểm nghỉ dưỡng chưa dùng.',
          },
          {
            q: 'Chủ sở hữu phải đóng những phí gì?',
            a: '• Bảo hiểm căn hộ • FF&E fund: 4% gross revenue • Phí quản lý: 45,000đ/m²/tháng (NFA, chưa VAT) • Thuế TNCN: 5% • Thuế GTGT: 5% • Thuế môn bài: 300k-1tr/năm.',
          },
          {
            q: 'Thời hạn hợp đồng CTCT?',
            a: '25 năm chia 4 kỳ: Kỳ 1 – 10 năm (bắt buộc) · Kỳ 2 – 5 năm · Kỳ 3 – 5 năm · Kỳ 4 – 5 năm. Sau mỗi kỳ tự động gia hạn nếu không báo trước 180 ngày.',
          },
          {
            q: 'Căn nào bắt buộc tham gia CTCT?',
            a: 'Tầng 19-33: Bắt buộc tham gia CTCT (kỳ 1: 10 năm). Tầng 34-41: Tùy chọn, nếu tham gia tối thiểu 5 năm/kỳ.',
          },
          {
            q: 'Giá thuê kỳ vọng năm 2027?',
            a: '• Studio: 3.8 triệu/đêm • 1 Phòng ngủ: 5.5 triệu/đêm • 2 Phòng ngủ: 9.5 triệu/đêm • 3PN Dual Key: 12 triệu/đêm • 3PN Dual Key + hồ bơi: 30 triệu/đêm. Giá điều chỉnh theo mùa và thị trường.',
          },
          {
            q: 'Chủ sở hữu có bao nhiêu điểm nghỉ dưỡng/năm?',
            a: '45 điểm/năm. Quy đổi: 1 điểm = 1 đêm ngày thường · 1.5 điểm = 1 đêm cuối tuần · 2 điểm = 1 đêm Lễ thường · 3 điểm = 1 đêm Lễ đặc biệt (30/4-1/5, Giáng Sinh, Tết). Tặng tối đa 25 điểm cho người thân.',
          },
          {
            q: 'Chủ sở hữu có tự cho thuê được không?',
            a: 'Không. Chỉ cho thuê qua CTCT của CĐT hoặc tự sử dụng theo nội quy tòa nhà. Điều này đảm bảo chất lượng dịch vụ 5 sao đồng đều.',
          },
        ],
      },
      {
        cat: 'IV. QUẢN LÝ & VẬN HÀNH',
        icon: '🏨',
        items: [
          {
            q: 'Chủ sở hữu được những ưu đãi gì từ Nobu?',
            a: '• Đặt chỗ nhà hàng Nobu Danang ưu tiên 1 ngày · Toàn cầu ưu tiên 1 tuần · Giảm 15% nhà hàng (+ Nobu Saigon & hệ thống VCRE) · Luxury dine-in tại căn hộ · Giảm 15% spa · Giảm 10% khách sạn Nobu toàn cầu · App Nobu đặt phòng/nhà hàng · Ưu tiên tham dự sự kiện Nobu.',
          },
          {
            q: 'Số người lưu trú tối đa theo loại căn?',
            a: '• Studio: 2 người • 1PN: 2 người lớn + 1 trẻ dưới 12 • 2PN: 4 người lớn + 1 trẻ dưới 12 • 3PN: 6 người lớn + 1 trẻ dưới 12.',
          },
        ],
      },
      {
        cat: 'V. PHÁP LÝ DỰ ÁN',
        icon: '📋',
        items: [
          {
            q: 'Pháp lý dự án bao gồm những gì?',
            a: '(1) GCN Quyền sử dụng đất · (2) GCN Đăng ký doanh nghiệp · (3) Giấy phép xây dựng + Phụ lục GPXD · (4) GCN Đăng ký đầu tư MS0650824421.',
          },
          {
            q: 'Ngân hàng nào hỗ trợ vay mua căn hộ Nobu?',
            a: 'MB Bank và BVBank (Ngân hàng Bản Việt – cùng hệ sinh thái Phoenix Holdings với VCRE). Liên hệ hotline +84 931 713 713 để được tư vấn cụ thể.',
          },
          {
            q: 'Tài khoản nhận tiền chính thức của CĐT?',
            a: 'Số TK: 617 7979 686868 · Ngân hàng: BVBank (Ngân hàng TMCP Bản Việt) · Tên TK: Công ty CP BĐS Circle Point. Lưu ý: Không chuyển tiền cho bất kỳ tổ chức/cá nhân nào khác.',
          },
          {
            q: 'Đơn vị kiểm toán của dự án?',
            a: 'Đơn vị vận hành chỉ định công ty kiểm toán chuyên nghiệp theo danh sách Bộ Tài chính (mof.gov.vn). Chủ sở hữu nhận báo cáo kiểm toán hàng năm trong vòng 45 ngày sau kết thúc năm dương lịch.',
          },
        ],
      },
    ],
  },
};

const STATUS_CONFIG = {
  available: { label: 'Còn hàng', color: 'text-emerald-600', bg: 'bg-emerald-50', icon: CheckCircle },
  hold:      { label: 'Đang hold', color: 'text-amber-600',  bg: 'bg-amber-50',   icon: Clock },
  sold:      { label: 'Đã bán',   color: 'text-slate-400',  bg: 'bg-slate-50',   icon: AlertCircle },
};

const UNIT_TYPES = [
  { id: 'all', label: '🏠 Tất cả' },
  { id: 'STU', label: '🚪 Studio' },
  { id: '1PN', label: '🛏️ 1 Phòng ngủ' },
  { id: '2PN', label: '🛏️ 2 Phòng ngủ' },
  { id: '3DK', label: '🛏️ 3PN Dual Key' },
  { id: '3SP', label: '🌊 Sky Villa + Pool' },
  { id: 'PH',  label: '👑 Penthouse' },
];

const PRICE_RANGES = [
  { label: 'Tất cả', min: 0, max: Infinity },
  { label: '< 8 tỷ',    min: 0,    max: 8e9 },
  { label: '8–15 tỷ',   min: 8e9,  max: 15e9 },
  { label: '15–30 tỷ',  min: 15e9, max: 30e9 },
  { label: '30–60 tỷ',  min: 30e9, max: 60e9 },
  { label: '> 60 tỷ',   min: 60e9, max: Infinity },
];

const AREA_RANGES = [
  { label: 'Tất cả', min: 0, max: Infinity },
  { label: '< 50m²',   min: 0,   max: 50 },
  { label: '50–80m²',  min: 50,  max: 80 },
  { label: '80–120m²', min: 80,  max: 120 },
  { label: '> 120m²',  min: 120, max: Infinity },
];

const PROVINCES_WITH_PRODUCTS = { 'Đà Nẵng': 264 };
const VIEWS = ['Tất cả','Biển Mỹ Khê','Sông Hàn','Thành phố','Pháo hoa','Sơn Trà','Toàn cảnh'];

function fmt(n) {
  if (!n) return 'Liên hệ';
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)} tỷ`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(0)} tr`;
  return n.toLocaleString('vi-VN');
}
function fmtM(n) {
  if (!n) return '';
  return `${(n / 1e6).toFixed(1)} tr/đêm`;
}

// ─── Chip ─────────────────────────────────────────────────────────────────────
function Chip({ label, active, onClick }) {
  return (
    <button onClick={onClick}
      className={`flex-shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full border transition-all ${
        active ? 'bg-[#316585] text-white border-[#316585]' : 'bg-white text-slate-600 border-slate-200'}`}
    >{label}</button>
  );
}

// ─── Province Selector ────────────────────────────────────────────────────────
function ProvinceSelector({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const sorted = useMemo(() => {
    const withP = Object.keys(PROVINCES_WITH_PRODUCTS).sort();
    const withoutP = ALL_PROVINCES.filter(p => !PROVINCES_WITH_PRODUCTS[p]).sort();
    const all = [...withP, ...withoutP];
    return q ? all.filter(p => p.toLowerCase().includes(q.toLowerCase())) : all;
  }, [q]);
  const select = (p) => { onChange(p); setOpen(false); setQ(''); };
  return (
    <>
      <button onClick={() => setOpen(true)}
        className={`flex items-center justify-between w-full px-4 py-2.5 rounded-2xl border text-sm font-semibold transition-all ${
          value !== 'Tất cả' ? 'bg-[#316585]/10 border-[#316585] text-[#316585]' : 'bg-white border-slate-200 text-slate-600'}`}
      >
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4" />
          <span>{value !== 'Tất cả' ? value : 'Tỉnh / Thành phố'}</span>
          {PROVINCES_WITH_PRODUCTS[value] && (
            <span className="text-[10px] bg-emerald-100 text-emerald-700 font-bold px-1.5 py-0.5 rounded-full">
              {PROVINCES_WITH_PRODUCTS[value]} căn
            </span>
          )}
        </div>
        <ChevronDown className="w-4 h-4" />
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => { setOpen(false); setQ(''); }} />
          <div className="relative bg-white rounded-t-3xl max-h-[80vh] flex flex-col">
            <div className="px-4 pt-4 pb-2 border-b border-slate-100">
              <div className="flex items-center justify-between mb-3">
                <p className="font-bold text-slate-900">Chọn Tỉnh / Thành phố</p>
                <button onClick={() => { setOpen(false); setQ(''); }} className="p-1.5 rounded-full bg-slate-100">
                  <X className="w-4 h-4 text-slate-600" />
                </button>
              </div>
              <div className="flex items-center gap-2 bg-slate-100 rounded-2xl px-3 py-2.5">
                <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <input autoFocus value={q} onChange={e => setQ(e.target.value)}
                  placeholder="Nhập tên tỉnh thành..."
                  className="flex-1 bg-transparent text-sm outline-none" />
                {q && <button onClick={() => setQ('')}><X className="w-3.5 h-3.5 text-slate-400" /></button>}
              </div>
            </div>
            <div className="overflow-y-auto flex-1 py-2">
              <button onClick={() => select('Tất cả')}
                className={`w-full flex items-center justify-between px-4 py-3 text-sm ${value === 'Tất cả' ? 'bg-[#316585]/10 text-[#316585] font-bold' : 'text-slate-700'}`}>
                <span>🗺️ Tất cả tỉnh thành</span>
                {value === 'Tất cả' && <CheckCircle className="w-4 h-4 text-[#316585]" />}
              </button>
              {!q && <p className="px-4 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wide">Đang có sản phẩm</p>}
              {sorted.map(p => {
                const count = PROVINCES_WITH_PRODUCTS[p];
                return (
                  <button key={p} onClick={() => select(p)}
                    className={`w-full flex items-center justify-between px-4 py-3 text-sm ${value === p ? 'bg-[#316585]/10 text-[#316585] font-bold' : 'text-slate-700'}`}>
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${count ? 'bg-emerald-500' : 'bg-slate-200'}`} />
                      <span>{p}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {count > 0 && <span className="text-[10px] bg-emerald-100 text-emerald-700 font-bold px-2 py-0.5 rounded-full">{count} căn</span>}
                      {value === p && <CheckCircle className="w-4 h-4 text-[#316585]" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ─── Unit Card ────────────────────────────────────────────────────────────────
function UnitCard({ unit, project, onDetail }) {
  const st = STATUS_CONFIG[unit.status];
  const comm = unit.price ? Math.round(unit.price * (project?.commPct || 3.5) / 100) : null;
  const roiPerYear = unit.price ? Math.round(unit.price * 0.06) : null;
  return (
    <button onClick={() => onDetail(unit)}
      className="w-full bg-white rounded-2xl border border-slate-200 p-4 text-left hover:border-[#316585]/40 hover:shadow-md transition-all active:scale-[0.98]">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-1">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-slate-900 text-sm">{unit.code}</span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700">{unit.typeName}</span>
            {unit.tag && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">{unit.tag}</span>}
          </div>
          <p className="text-xs text-slate-500 mt-0.5 truncate">
            {unit.beds > 0 ? `${unit.beds}PN` : 'Studio'} · {unit.area}m² · Tầng {unit.floor} · {unit.view}
          </p>
        </div>
        <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-semibold flex-shrink-0 ${st.bg} ${st.color}`}>
          <st.icon className="w-3 h-3" />{st.label}
        </div>
      </div>
      {/* Price row */}
      <div className="flex items-end justify-between mt-3">
        <div>
          <p className="text-lg font-bold text-[#316585]">
            {fmt(unit.price)} {unit.priceNeg && <span className="text-xs font-normal text-slate-400">(TL)</span>}
          </p>
          {unit.price && <p className="text-[11px] text-slate-400">{(unit.price / unit.area / 1e6).toFixed(0)} tr/m²</p>}
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-500">HH sale</p>
          <p className="text-sm font-bold text-emerald-600">{comm ? `+${fmt(comm)}` : 'TL'}</p>
        </div>
      </div>
      {/* CTCT + ROI */}
      <div className="flex gap-2 mt-2">
        {unit.ctct && (
          <span className="text-[10px] bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full font-semibold">
            Bắt buộc CTCT
          </span>
        )}
        {unit.roiGuarantee > 0 && (
          <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-semibold">
            Cam kết {unit.roiGuarantee}%/năm
          </span>
        )}
        {unit.rentalEst && (
          <span className="text-[10px] bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded-full font-semibold">
            {fmtM(unit.rentalEst)} khai thác
          </span>
        )}
      </div>
    </button>
  );
}

// ─── Consignment Card ─────────────────────────────────────────────────────────
function ConsignmentCard({ item }) {
  const gainPct = ((item.price - item.originalPrice) / item.originalPrice * 100).toFixed(1);
  const positive = item.price > item.originalPrice;
  return (
    <div className="w-full bg-white rounded-2xl border border-amber-200 p-4">
      <div className="flex items-start gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap gap-1 items-center mb-1">
            <span className="font-bold text-slate-900 text-sm">{item.name}</span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">{item.tag}</span>
            {item.verified && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700">✅ Xác minh</span>}
          </div>
          <p className="text-xs text-slate-500">{item.beds > 0 ? `${item.beds}PN` : 'Studio'} · {item.area}m² · Tầng {item.floor} · {item.view}</p>
          <p className="text-xs text-slate-400">📍 {item.province}</p>
        </div>
      </div>
      <div className="flex items-end justify-between mt-2">
        <div>
          <p className="text-lg font-bold text-amber-700">{fmt(item.price)}</p>
          <p className={`text-[10px] font-semibold mt-0.5 ${positive ? 'text-emerald-600' : 'text-red-500'}`}>
            {positive ? '+' : ''}{gainPct}% so giá mua ({fmt(item.originalPrice)})
          </p>
        </div>
        <p className="text-[10px] text-slate-400">Mua năm {item.saleYear}</p>
      </div>
      {item.ownerNote && <p className="mt-2 text-xs text-amber-800 bg-amber-50 px-3 py-1.5 rounded-xl">💬 {item.ownerNote}</p>}
      <div className="grid grid-cols-2 gap-2 mt-3">
        <button className="flex items-center justify-center gap-1.5 border border-slate-200 rounded-xl py-2 text-xs font-semibold text-slate-700">
          <Share2 className="w-3.5 h-3.5" /> Gửi khách
        </button>
        <button className="flex items-center justify-center gap-1.5 bg-amber-500 rounded-xl py-2 text-xs font-bold text-white">
          <BookmarkCheck className="w-3.5 h-3.5" /> Đặt lịch xem
        </button>
      </div>
    </div>
  );
}

// ─── Unit Detail Modal ────────────────────────────────────────────────────────
function UnitDetail({ unit, project, onClose }) {
  const [booked, setBooked] = useState(false);
  const comm = unit.price ? Math.round(unit.price * (project?.commPct || 3.5) / 100) : null;
  const roiPerYear = unit.price ? Math.round(unit.price * unit.roiGuarantee / 100) : null;
  if (booked) {
    return (
      <div className="fixed inset-0 z-50 bg-white flex flex-col items-center justify-center p-8">
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Đã giữ chỗ!</h2>
        <p className="text-slate-600 text-center mb-1">Căn {unit.code} đã được hold</p>
        {comm && <p className="text-sm text-emerald-600 font-semibold mb-2">Hoa hồng của bạn: +{fmt(comm)}</p>}
        <p className="text-xs text-slate-500 text-center mb-6">Liên hệ VCRE hotline {project?.hotline} để hoàn tất</p>
        <button onClick={onClose} className="bg-[#316585] text-white px-8 py-3 rounded-2xl font-semibold">
          Về giỏ hàng
        </button>
      </div>
    );
  }
  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-end">
      <div className="bg-white w-full rounded-t-3xl max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-100 px-4 py-3 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900">{project?.nameShort} — {unit.code}</h3>
            <p className="text-xs text-slate-500">{unit.typeName} · {unit.area}m² · Tầng {unit.floor}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full bg-slate-100"><X className="w-5 h-5 text-slate-600" /></button>
        </div>
        <div className="p-4 space-y-4">
          {/* Price hero */}
          <div className="bg-gradient-to-br from-[#16314f] to-[#316585] rounded-2xl p-5 text-white">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-white/70 text-xs">Giá bán tham khảo</p>
                <p className="text-3xl font-bold">{fmt(unit.price)}</p>
                {unit.priceNeg && <p className="text-white/60 text-xs">⚡ Thương lượng</p>}
                {unit.price && <p className="text-white/60 text-xs">{(unit.price / unit.area / 1e6).toFixed(0)} triệu/m²</p>}
              </div>
              {comm && (
                <div className="text-right bg-white/15 rounded-xl p-3">
                  <p className="text-white/70 text-[10px]">HH của bạn</p>
                  <p className="text-xl font-bold text-emerald-300">+{fmt(comm)}</p>
                  <p className="text-white/60 text-[10px]">{project?.commPct}%</p>
                </div>
              )}
            </div>
          </div>

          {/* ROI */}
          {roiPerYear && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                <p className="text-sm font-bold text-emerald-800">Hiệu quả đầu tư (ROI)</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-emerald-600">Cam kết {unit.roiGuarantee}%/năm (2 năm)</p>
                  <p className="font-bold text-emerald-800">{fmt(roiPerYear)}/năm</p>
                </div>
                {unit.rentalEst && (
                  <div>
                    <p className="text-xs text-emerald-600">Kỳ vọng cho thuê/đêm</p>
                    <p className="font-bold text-emerald-800">{fmtM(unit.rentalEst)}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Info grid */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Loại căn', value: unit.typeName },
              { label: 'GFA', value: `${unit.gfa}m²` },
              { label: 'NFA (NTA)', value: `${unit.area}m²` },
              { label: 'Tầng', value: `Tầng ${unit.floor}` },
              { label: 'View', value: unit.view },
              { label: 'Hướng', value: unit.direction },
            ].map(i => (
              <div key={i.label} className="bg-slate-50 rounded-xl p-2.5">
                <p className="text-[10px] text-slate-500">{i.label}</p>
                <p className="font-semibold text-slate-800 text-xs mt-0.5 leading-tight">{i.value}</p>
              </div>
            ))}
          </div>

          {/* CTCT note */}
          {unit.ctct && (
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-3">
              <p className="text-sm font-bold text-blue-900 mb-1">📋 Chương trình cho thuê (CTCT)</p>
              <p className="text-xs text-blue-700">
                Căn này thuộc tầng 19-33, bắt buộc tham gia CTCT tối thiểu 10 năm.
                Sau 2 năm cam kết, nhận 40% gross revenue theo pool cùng loại căn.
                45 điểm nghỉ dưỡng/năm để tự sử dụng miễn phí.
              </p>
            </div>
          )}

          {/* Project info */}
          <div className="bg-slate-50 rounded-2xl p-4 space-y-1.5">
            <p className="text-xs font-bold text-slate-700 mb-2">🏗️ Thông tin dự án</p>
            {[
              ['Chủ đầu tư', project?.developer],
              ['Vận hành', project?.operator],
              ['Địa chỉ', project?.address],
              ['Tổng căn', `${project?.totalUnits} căn nghỉ dưỡng + ${project?.hotelRooms} phòng KS`],
              ['Khai trương', `Dự kiến ${project?.openYear}`],
              ['TK nhận tiền', project?.bankAccount],
            ].map(([k, v]) => (
              <div key={k} className="flex gap-2 text-xs">
                <span className="text-slate-500 min-w-[80px] flex-shrink-0">{k}</span>
                <span className="text-slate-800 font-medium leading-tight">{v}</span>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="space-y-3">
            {unit.status === 'available' && (
              <button onClick={() => setBooked(true)}
                className="w-full bg-[#316585] text-white py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 active:scale-[0.98]">
                <BookmarkCheck className="w-5 h-5" />
                ĐĂNG KÝ NGUYỆN VỌNG
              </button>
            )}
            <a href={`tel:${project?.hotline}`}
              className="w-full flex items-center justify-center gap-2 border border-[#316585] text-[#316585] rounded-2xl py-3 text-sm font-bold">
              <Phone className="w-4 h-4" />
              Hotline VCRE: {project?.hotline}
            </a>
            <button className="w-full flex items-center justify-center gap-2 border border-slate-300 rounded-2xl py-3 text-sm font-semibold text-slate-700">
              <Share2 className="w-4 h-4" />
              Gửi thông tin cho khách
            </button>
          </div>

          <p className="text-[10px] text-slate-400 text-center leading-relaxed px-2">
            * Giá tham khảo thị trường. Giá chính thức theo CSBH của VCRE/Circle Point Real Estate JSC.
            HH ước tính. Liên hệ VCRE để biết giá và chính sách bán hàng chính xác.
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function SalesProductCatalogPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('primary');
  const [showKnowledge, setShowKnowledge] = useState(null); // project id
  const [searchQ, setSearchQ] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [selectedProjectId, setSelectedProjectId] = useState('NBU'); // 'NBU' | 'SSR'

  const [fProvince, setFProvince] = useState('Tất cả');
  const [fType, setFType] = useState('all');
  const [fPrice, setFPrice] = useState(0);
  const [fArea, setFArea] = useState(0);
  const [fView, setFView] = useState('Tất cả');
  const [fCtct, setFCtct] = useState('all');
  const [statusFilter, setStatusFilter] = useState('available');


  const priceRange = PRICE_RANGES[fPrice];
  const areaRange  = AREA_RANGES[fArea];

  const activeFilterCount = [
    fProvince !== 'Tất cả', fType !== 'all', fPrice > 0,
    fArea > 0, fView !== 'Tất cả', fCtct !== 'all',
  ].filter(Boolean).length;

  const resetAll = () => {
    setFProvince('Tất cả'); setFType('all'); setFPrice(0);
    setFArea(0); setFView('Tất cả'); setFCtct('all');
    setStatusFilter('available'); setSearchQ('');
  };

  const filtered = useMemo(() => {
    let list = UNITS.filter(u => u.project === selectedProjectId);
    if (statusFilter !== 'all') list = list.filter(u => u.status === statusFilter);
    if (fType !== 'all') list = list.filter(u => u.type === fType);
    if (fCtct !== 'all') list = list.filter(u => fCtct === 'yes' ? u.ctct : !u.ctct);
    if (fView !== 'Tất cả') list = list.filter(u => u.view.toLowerCase().includes(fView.toLowerCase()));
    // Only apply price/area filters if project has prices set
    if (selectedProjectId === 'NBU') {
      list = list.filter(u => u.price >= priceRange.min && u.price <= priceRange.max);
      list = list.filter(u => u.area >= areaRange.min && u.area <= areaRange.max);
    } else {
      list = list.filter(u => u.area >= areaRange.min && u.area <= areaRange.max);
    }
    if (fProvince !== 'Tất cả') {
      list = list.filter(u => {
        const proj = PROJECTS.find(p => p.id === u.project);
        return proj?.province === fProvince;
      });
    }
    if (searchQ) {
      const q = searchQ.toLowerCase();
      list = list.filter(u => {
        const proj = PROJECTS.find(p => p.id === u.project);
        return proj?.name.toLowerCase().includes(q)
          || u.typeName.toLowerCase().includes(q)
          || u.view.toLowerCase().includes(q)
          || proj?.developer.toLowerCase().includes(q);
      });
    }
    return list;
  }, [searchQ, statusFilter, fType, fView, fProvince, fCtct, priceRange, areaRange, selectedProjectId]);


  const selectedUnitProject = selectedUnit ? PROJECTS.find(p => p.id === selectedUnit.project) : null;


  return (
    <div className="flex flex-col h-full">
      {/* Tabs */}
      <div className="flex bg-white border-b border-slate-200 px-4 pt-2">
        {[
          { id: 'primary', label: '🏗️ Sơ cấp' },
          { id: 'consignment', label: '🔑 Gửi bán lại' },
        ].map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`flex-1 pb-2.5 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === t.id ? 'border-[#316585] text-[#316585]' : 'border-transparent text-slate-400'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Gửi bán lại ── */}
      {activeTab === 'consignment' && (
        <div className="flex-1 overflow-y-auto pb-20 px-4 pt-4">
          <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 mb-4">
            <p className="text-sm font-bold text-amber-800">🔑 Hàng gửi bán qua ProHouze</p>
            <p className="text-xs text-amber-700 mt-1">
              BĐS của khách đã mua sơ cấp qua ProHouze, nay muốn bán lại. Chính chủ xác minh.
            </p>
          </div>
          <div className="space-y-3">
            {CONSIGNMENT_UNITS.map(item => <ConsignmentCard key={item.id} item={item} />)}
          </div>
          <div className="mt-4 bg-slate-50 rounded-2xl p-4 text-center">
            <p className="text-sm font-bold text-slate-700 mb-1">Khách muốn ký gửi bán?</p>
            <button className="bg-amber-500 text-white px-6 py-2.5 rounded-xl text-sm font-bold mt-2">
              + Thêm hàng gửi bán
            </button>
          </div>
        </div>
      )}

      {/* ── Sơ cấp ── */}
      {activeTab === 'primary' && (
        <div className="flex-1 overflow-y-auto pb-20">

          {/* ── PROJECT SELECTOR ── */}
          <div className="mx-4 mt-4 mb-2 flex gap-2">
            {PROJECTS.map(proj => (
              <button
                key={proj.id}
                onClick={() => { setSelectedProjectId(proj.id); setSearchQ(''); setFType('all'); setStatusFilter('available'); }}
                className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
                  selectedProjectId === proj.id
                    ? 'bg-[#316585] text-white shadow-md scale-[1.02]'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                <span className="text-sm">{proj.image}</span> {proj.nameShort}
              </button>
            ))}
          </div>

          {/* Project Hero — Dynamic */}
          {(() => {
            const proj = PROJECTS.find(p => p.id === selectedProjectId) || PROJECTS[0];
            const isNobu = proj.id === 'NBU';
            return (
              <div className={`mx-4 mb-3 rounded-2xl p-4 text-white overflow-hidden relative ${isNobu ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700' : 'bg-gradient-to-br from-blue-900 via-blue-800 to-cyan-700'}`}>
                <div className="absolute top-0 right-0 text-[80px] opacity-10 leading-none translate-x-2 -translate-y-2">{proj.image}</div>
                <div className="relative">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-[10px] font-bold ${proj.tagColor} text-white px-2 py-0.5 rounded-full`}>● ĐANG MỞ BÁN 2025</span>
                    <span className={`text-[10px] ${proj.badgeColor} text-white font-bold px-2 py-0.5 rounded-full`}>{proj.badge}</span>
                  </div>
                  <p className="text-lg font-black leading-tight">{proj.name.toUpperCase()}</p>
                  <p className="text-white/60 text-xs mb-3">by {proj.developerShort} · {proj.address.split(',').slice(-2).join(',').trim()}</p>
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    {(isNobu ? [
                      { label: 'Tổng căn', value: '264' },
                      { label: 'Số tầng', value: '43F + 2B' },
                      { label: 'Cam kết thuê', value: '6%/năm' },
                    ] : [
                      { label: 'Tổng căn', value: '1.373' },
                      { label: 'Số tầng', value: '30F + 3B' },
                      { label: 'Chiết khấu', value: '9.5%' },
                    ]).map(item => (

                      <div key={item.label} className="bg-white/10 rounded-xl p-2 text-center">
                        <p className="text-base font-bold text-amber-300">{item.value}</p>
                        <p className="text-[10px] text-white/60">{item.label}</p>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-1">
                    {proj.highlight.map((h, i) => (
                      <p key={i} className="text-[11px] text-white/70 flex gap-1.5">
                        <Star className="w-3 h-3 text-amber-400 flex-shrink-0 mt-0.5" />
                        {h}
                      </p>
                    ))}
                  </div>
                  <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between">
                    <a href={`tel:${proj.hotline}`} className="flex items-center gap-1.5 text-xs text-white/80">
                      <Phone className="w-3.5 h-3.5 text-amber-400" />
                      {proj.hotline}
                    </a>
                    <button
                      onClick={() => setShowKnowledge(proj.id)}
                      className="flex items-center gap-1.5 bg-amber-400 text-slate-900 text-xs font-bold px-3 py-1.5 rounded-full active:scale-95 transition-transform"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      📚 Kiến thức
                    </button>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Search + Filter */}
          <div className="px-4 pb-3 space-y-2">
            <div className="flex gap-2">
              <div className="flex-1 flex items-center gap-2 bg-slate-100 rounded-2xl px-4 py-2.5">
                <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <input value={searchQ} onChange={e => setSearchQ(e.target.value)}
                  placeholder="Loại căn, view, chủ đầu tư..."
                  className="flex-1 bg-transparent text-sm outline-none" />
                {searchQ && <button onClick={() => setSearchQ('')}><X className="w-3.5 h-3.5 text-slate-400" /></button>}
              </div>
              <button onClick={() => setShowFilters(!showFilters)}
                className={`relative p-3 rounded-2xl ${showFilters || activeFilterCount > 0 ? 'bg-[#316585] text-white' : 'bg-slate-100 text-slate-600'}`}>
                <SlidersHorizontal className="w-4 h-4" />
                {activeFilterCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </button>
            </div>

            {/* Status chips */}
            <div className="flex gap-2 overflow-x-auto pb-1">
              <Chip label="✅ Còn hàng"  active={statusFilter === 'available'} onClick={() => setStatusFilter('available')} />
              <Chip label="📋 Tất cả"    active={statusFilter === 'all'}       onClick={() => setStatusFilter('all')} />
              <Chip label="⏳ Đang hold"  active={statusFilter === 'hold'}      onClick={() => setStatusFilter('hold')} />
              <Chip label="🌊 Có hồ bơi" active={fType === '3SP'}              onClick={() => setFType(fType === '3SP' ? 'all' : '3SP')} />
              <Chip label="👑 Penthouse"  active={fType === 'PH'}               onClick={() => setFType(fType === 'PH' ? 'all' : 'PH')} />
            </div>

            {/* Advanced Filter */}
            {showFilters && (
              <div className="bg-slate-50 rounded-2xl p-4 space-y-4 border border-slate-200">
                <div>
                  <p className="text-xs font-bold text-slate-600 mb-2">📍 Tỉnh / Thành phố</p>
                  <ProvinceSelector value={fProvince} onChange={setFProvince} />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-600 mb-2">🏠 Loại căn</p>
                  <div className="flex gap-2 flex-wrap">
                    {UNIT_TYPES.map(t => (
                      <Chip key={t.id} label={t.label} active={fType === t.id} onClick={() => setFType(t.id)} />
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-bold text-slate-600 mb-2">💰 Mức giá</p>
                    <div className="space-y-1.5">
                      {PRICE_RANGES.map((r, i) => (
                        <Chip key={r.label} label={r.label} active={fPrice === i} onClick={() => setFPrice(i)} />
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-600 mb-2">📐 Diện tích</p>
                    <div className="space-y-1.5">
                      {AREA_RANGES.map((r, i) => (
                        <Chip key={r.label} label={r.label} active={fArea === i} onClick={() => setFArea(i)} />
                      ))}
                    </div>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-600 mb-2">🌅 View</p>
                  <div className="flex gap-2 flex-wrap">
                    {VIEWS.map(v => (
                      <Chip key={v} label={v} active={fView === v} onClick={() => setFView(v)} />
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-600 mb-2">📋 Chương trình cho thuê</p>
                  <div className="flex gap-2">
                    <Chip label="Tất cả"        active={fCtct === 'all'} onClick={() => setFCtct('all')} />
                    <Chip label="Bắt buộc CTCT" active={fCtct === 'yes'} onClick={() => setFCtct('yes')} />
                    <Chip label="Tự do"          active={fCtct === 'no'}  onClick={() => setFCtct('no')} />
                  </div>
                </div>
                <button onClick={resetAll} className="flex items-center gap-1.5 text-xs text-red-500 font-semibold">
                  <RotateCcw className="w-3 h-3" />
                  Xóa bộ lọc {activeFilterCount > 0 && `(${activeFilterCount})`}
                </button>
              </div>
            )}
          </div>

          {/* Results */}
          <div className="px-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-slate-700">{filtered.length} căn phù hợp</p>
              <div className="flex items-center gap-1 text-xs text-emerald-600">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Giỏ hàng thực tế
              </div>
            </div>
            {filtered.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <Filter className="w-10 h-10 mx-auto mb-3 opacity-50" />
                <p className="text-sm">Không có căn phù hợp</p>
                <button onClick={resetAll} className="text-xs text-[#316585] mt-2 underline">Xóa bộ lọc</button>
              </div>
            ) : (
              <div className="space-y-3">
                {filtered.map(unit => {
                  const proj = PROJECTS.find(p => p.id === unit.project);
                  return <UnitCard key={unit.id} unit={unit} project={proj} onDetail={setSelectedUnit} />;
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Unit Detail */}
      {selectedUnit && (
        <UnitDetail unit={selectedUnit} project={selectedUnitProject} onClose={() => setSelectedUnit(null)} />
      )}

      {/* Knowledge / Q&A Modal */}
      {showKnowledge && (
        <ProjectKnowledgeModal projectId={showKnowledge} onClose={() => setShowKnowledge(null)} />
      )}
    </div>
  );
}

// ─── Knowledge Modal ─────────────────────────────────────────────────────────
function ProjectKnowledgeModal({ projectId, onClose }) {
  const [tab, setTab] = useState('usp'); // usp | objections | faq
  const [openIdx, setOpenIdx] = useState(null);
  const [faqSearch, setFaqSearch] = useState('');
  const [activeCat, setActiveCat] = useState(null);
  const data = PROJECT_KNOWLEDGE[projectId];
  if (!data) return null;

  const filteredFaqs = data.faqs.map(cat => ({
    ...cat,
    items: cat.items.filter(item =>
      !faqSearch || item.q.toLowerCase().includes(faqSearch.toLowerCase()) || item.a.toLowerCase().includes(faqSearch.toLowerCase())
    ),
  })).filter(cat => (!activeCat || cat.cat === activeCat) && cat.items.length > 0);

  return (
    <div className="fixed inset-0 z-[60] bg-white flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#16314f] to-[#316585] px-4 pt-10 pb-3 flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-white font-bold text-base">📚 Kiến thức bán hàng</p>
            <p className="text-white/60 text-xs">NOBU Residences Danang · VCRE</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full bg-white/20">
            <X className="w-4 h-4 text-white" />
          </button>
        </div>
        {/* Tab bar */}
        <div className="flex gap-1">
          {[
            { id: 'usp', label: '💎 Điểm bán', icon: Star },
            { id: 'objections', label: '🛡️ Phản đối', icon: ShieldCheck },
            { id: 'faq', label: '❓ Q&A', icon: MessageSquare },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                tab === t.id ? 'bg-white text-[#316585]' : 'text-white/70'}`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">

        {/* ── USP Tab ── */}
        {tab === 'usp' && (
          <div className="p-4 space-y-3">
            <p className="text-xs text-slate-500 mb-1">5 lý do hàng đầu để chốt deal NOBU DANANG</p>
            {data.usps.map((usp, i) => (
              <div key={i} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                <div className="flex items-start gap-3">
                  <span className="text-2xl flex-shrink-0">{usp.icon}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-bold text-slate-900 text-sm leading-tight">{usp.title}</p>
                      <span className="text-[10px] bg-amber-100 text-amber-700 font-bold px-2 py-0.5 rounded-full flex-shrink-0">{usp.tag}</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">{usp.body}</p>
                  </div>
                </div>
              </div>
            ))}
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
              <p className="text-sm font-bold text-blue-900 mb-1">💡 Gợi ý mở đầu tư vấn</p>
              <p className="text-xs text-blue-700 leading-relaxed">
                "Anh/chị biết không, NOBU là thương hiệu mà Robert De Niro đứng sau. Dự án này là Nobu Residences đầu tiên và duy nhất tại Đông Nam Á. Không phải ai cũng có cơ hội sở hữu lần đầu tiên như thế này..."
              </p>
            </div>
          </div>
        )}

        {/* ── Objections Tab ── */}
        {tab === 'objections' && (
          <div className="p-4 space-y-3">
            <p className="text-xs text-slate-500 mb-1">Các phản đối thường gặp & cách xử lý chuẩn</p>
            {data.objections.map((obj, i) => (
              <div key={i} className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                <button
                  onClick={() => setOpenIdx(openIdx === i ? null : i)}
                  className="w-full flex items-center gap-3 p-4 text-left"
                >
                  <span className="text-xl flex-shrink-0">{obj.icon}</span>
                  <p className="flex-1 font-semibold text-slate-800 text-sm leading-tight">❝ {obj.q}</p>
                  <ChevronRight className={`w-4 h-4 text-slate-400 flex-shrink-0 transition-transform ${openIdx === i ? 'rotate-90' : ''}`} />
                </button>
                {openIdx === i && (
                  <div className="px-4 pb-4 border-t border-slate-100">
                    <div className="bg-emerald-50 rounded-xl p-3 mt-3">
                      <p className="text-[10px] font-bold text-emerald-700 mb-1">✅ CÁCH TRẢ LỜI CHUẨN</p>
                      <p className="text-xs text-emerald-900 leading-relaxed">{obj.a}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── FAQ Tab ── */}
        {tab === 'faq' && (
          <div className="p-4">
            {/* Search */}
            <div className="flex items-center gap-2 bg-slate-100 rounded-2xl px-4 py-2.5 mb-3">
              <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <input value={faqSearch} onChange={e => setFaqSearch(e.target.value)}
                placeholder="Tìm câu hỏi..."
                className="flex-1 bg-transparent text-sm outline-none" />
              {faqSearch && <button onClick={() => setFaqSearch('')}><X className="w-3.5 h-3.5 text-slate-400" /></button>}
            </div>
            {/* Category filter */}
            <div className="flex gap-2 overflow-x-auto pb-2 mb-3">
              <button onClick={() => setActiveCat(null)}
                className={`flex-shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full border ${
                  !activeCat ? 'bg-[#316585] text-white border-[#316585]' : 'bg-white text-slate-600 border-slate-200'}`}>
                Tất cả
              </button>
              {data.faqs.map(cat => (
                <button key={cat.cat} onClick={() => setActiveCat(cat.cat === activeCat ? null : cat.cat)}
                  className={`flex-shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full border whitespace-nowrap ${
                    activeCat === cat.cat ? 'bg-[#316585] text-white border-[#316585]' : 'bg-white text-slate-600 border-slate-200'}`}>
                  {cat.icon} {cat.cat.split('. ')[1]?.split('/')[0] || cat.cat}
                </button>
              ))}
            </div>
            {/* Q&A items */}
            <div className="space-y-2">
              {filteredFaqs.map((cat, ci) => (
                <div key={ci}>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                    <span>{cat.icon}</span>{cat.cat}
                  </p>
                  {cat.items.map((item, ii) => {
                    const globalIdx = `${ci}-${ii}`;
                    return (
                      <div key={ii} className="bg-white border border-slate-200 rounded-xl mb-1.5 overflow-hidden">
                        <button
                          onClick={() => setOpenIdx(openIdx === globalIdx ? null : globalIdx)}
                          className="w-full flex items-start gap-2 p-3 text-left"
                        >
                          <span className="text-slate-400 text-xs font-bold mt-0.5 flex-shrink-0">Q</span>
                          <p className="flex-1 font-semibold text-slate-800 text-xs leading-snug">{item.q}</p>
                          <ChevronRight className={`w-3.5 h-3.5 text-slate-300 flex-shrink-0 mt-0.5 transition-transform ${
                            openIdx === globalIdx ? 'rotate-90' : ''}`} />
                        </button>
                        {openIdx === globalIdx && (
                          <div className="px-3 pb-3 border-t border-slate-100">
                            <div className="flex gap-1.5 mt-2">
                              <span className="text-[#316585] text-xs font-bold flex-shrink-0">A</span>
                              <p className="text-xs text-slate-700 leading-relaxed">{item.a}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
              {filteredFaqs.length === 0 && (
                <div className="text-center py-8 text-slate-400">
                  <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Không tìm thấy câu hỏi nào</p>
                </div>
              )}
            </div>
            <p className="text-[10px] text-slate-400 text-center mt-4">Nguồn: Nobu DN FAQ 2024.11.15.pdf · VCRE</p>
          </div>
        )}

      </div>
    </div>
  );
}
