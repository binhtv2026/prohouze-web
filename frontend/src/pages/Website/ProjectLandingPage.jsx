import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  MapPin, Building2, Calendar, DollarSign, Square, Users, Phone, Mail,
  ChevronLeft, ChevronRight, Check, Star, Heart, Share2, Send, Play, Pause,
  Volume2, VolumeX, Maximize, X, Eye, EyeOff, Download, Youtube, Video,
  Compass, Home, Car, TreePine, Dumbbell, Coffee, ShoppingBag, GraduationCap,
  Hospital, Waves, ParkingCircle, Shield, Wifi, Sun, Wind, Droplets,
  RotateCcw, MousePointer, ExternalLink, FileVideo, Image as ImageIcon,
  CheckCircle, Clock, FileText
} from 'lucide-react';
import { WebsiteHeader, WebsiteFooter } from './SharedComponents';
import { useTheme } from '@/contexts/ThemeContext';
import { toast } from 'sonner';
import { ALL_SUN_GROUP_PROJECTS as SUN_GROUP_PROJECTS } from '@/data/sunGroupProjects';
import { resolveProject } from '@/services/projectService';

// ─── DỰ ÁN THẬT — CHỈ 2 DỰ ÁN ĐƯỢC PHÉP HIỂN THỊ ───────────────────────────
const projectsData = {
    'nobu-danang': {
    id: 'nobu-danang', name: 'Nobu Residences Danang', slug: 'nobu-danang',
    slogan: 'Căn hộ thương hiệu Nobu đầu tiên & duy nhất tại Đông Nam Á',
    location: {
      address: 'Số 01 Võ Văn Kiệt, Phường Phước Mỹ, Quận Sơn Trà, Tp. Đà Nẵng',
      district: 'Quận Sơn Trà', city: 'Đà Nẵng',
      mapUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3833.9!2d108.2399!3d16.0600!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x314217ab1652e7e7%3A0x1!2zTm9idSBSZXNpZGVuY2VzIERhbmFuZw!5e0!3m2!1svi!2s!4v1714042800000',
      nearbyPlaces: [
        { name: 'Biển Mỹ Khê — Top ĐNA', distance: 'Trực diện', icon: Waves },
        { name: 'Sân bay Quốc tế Đà Nẵng', distance: '10 phút', icon: Car },
        { name: 'Cầu Rồng / Phố cổ Hội An', distance: '5–30 phút', icon: Building2 },
        { name: 'Nhà hàng Nobu (T42) & Tsukimidai Sky Bar (T43)', distance: 'Nội khu', icon: Coffee },
        { name: 'Sân golf BRG Đà Nẵng', distance: '15 phút', icon: TreePine },
      ]
    },
    type: 'resort-residence', status: 'opening', is_hot: true,
    price_from: 0, price_to: 0, units_total: 264, units_available: 264,
    area_range: '36–280', completion_date: 'Q2/2027',
    developer: {
      name: 'VCRE — Công ty CP BĐS Circle Point (Phoenix Holdings)',
      logo: '/images/nobu/nobu-danang-07.jpg',
      description: 'VCRE (Công ty Bất động sản Bản Việt) thuộc hệ sinh thái Phoenix Holdings — tập đoàn quản lý đa danh mục hàng đầu Việt Nam. Phoenix Holdings sở hữu BVBank, Vietcap Securities, Vietcredit, 7-Eleven và McDonald\'s VN. VCRE chuyên phát triển bất động sản boutique đẳng cấp quốc tế.',
      projects: ['BVBank (Ngân hàng Bản Việt)', 'Vietcap Securities', '7-Eleven Vietnam', 'McDonald\'s Vietnam', 'Vietcredit'],
    },
    description: 'Nobu Residences Danang là tòa nhà cao 186m, 43 tầng (2 tầng hầm), tọa lạc tại Số 01 Võ Văn Kiệt – giao lộ biểu tượng Võ Nguyên Giáp – Võ Văn Kiệt, trực diện biển Mỹ Khê. Đây là Nobu Residences ĐẦU TIÊN tại Đông Nam Á – do Nobu Hospitality vận hành (sáng lập: đầu bếp huyền thoại Nobu Matsuhisa, tài tử Robert De Niro và nhà sản xuất Meir Teper). Công trình gồm 186 phòng khách sạn Nobu Hotel (T7–16) và 264 căn hộ du lịch Nobu Residences (T19–40), được thiết kế bởi đội ngũ quốc tế: kiến trúc (Mỹ), mặt dựng (Thái Lan), nội thất (Thái Lan), cơ điện (Hong Kong), chiếu sáng (Singapore).',
    highlights: [
      'Nobu Residences đầu tiên & duy nhất tại Đông Nam Á',
      'Vận hành bởi Nobu Hospitality — Top 25 Most Innovative Luxury Brands (Robb Report)',
      'Sáng lập: Nobu Matsuhisa + Robert De Niro + Meir Teper',
      'Cam kết lợi nhuận 6%/năm trong 2 năm đầu (từ 2027)',
      'Chia sẻ 40% gross revenue — chương trình cho thuê bắt buộc',
      '45 điểm nghỉ dưỡng Nobu miễn phí/năm trên toàn cầu',
      'Pháp lý hoàn chỉnh: GCNQSDĐ + GPXD + GCN Đăng ký Đầu tư MS0650824421',
      'NH hỗ trợ vay: MB Bank & BVBank (ân hạn nợ gốc đến bàn giao)',
    ],
    images: [
      '/images/nobu/nobu-danang-07.jpg',
      '/images/nobu/nobu-danang-01.jpg',
      '/images/nobu/nobu-danang-02.jpg',
      '/images/nobu/nobu-danang-03.jpg',
      '/images/nobu/nobu-danang-04.jpg',
      '/images/nobu/nobu-danang-05.jpg',
      '/images/nobu/nobu-danang-06.jpg',
    ],
    videos: { intro: null, youtube: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
    virtualTour: { enabled: false, url: '' },
    view360: { enabled: false, images: [] },
    amenities: [
      { name: 'Hồ bơi nước ấm Katamochi', icon: Waves, category: 'Thể thao' },
      { name: 'Sky Gym — Phòng tập thể thao', icon: Dumbbell, category: 'Thể thao' },
      { name: 'Wellness & Retreat Spa', icon: Sun, category: 'Sức khỏe' },
      { name: 'Nobu Restaurant (T42)', icon: Coffee, category: 'Ẩm thực' },
      { name: 'Taste of Asia Restaurant', icon: Coffee, category: 'Ẩm thực' },
      { name: 'Tsukimidai Sky Bar (T43)', icon: Coffee, category: 'Ẩm thực' },
      { name: 'Quầy bar bên hồ bơi (Pool Bar)', icon: Coffee, category: 'Ẩm thực' },
      { name: 'Sảnh hội nghị trên không (Sky Ballroom)', icon: Home, category: 'Tiện ích' },
      { name: 'Kids Club & Khu vui chơi trẻ em', icon: Home, category: 'Tiện ích' },
      { name: 'Refuge Lounge (T17 & T37)', icon: TreePine, category: 'Tiện ích' },
      { name: 'Retail Area — Khu mua sắm', icon: ShoppingBag, category: 'Mua sắm' },
      { name: 'An ninh 24/7 — Concierge Nobu', icon: Shield, category: 'An ninh' },
      { name: 'Smart Residence Management System', icon: Wifi, category: 'Công nghệ' },
      { name: 'Bãi đỗ xe 2 tầng hầm', icon: Car, category: 'Tiện ích' },
    ],
    unitTypes: [
      { name: 'Studio', area: '36–40 m²', bedrooms: 0, bathrooms: 1, price_from: 0, rentalEst: '3.8–5 triệu/đêm', floors: 'T19–36', image: '/images/nobu/nobu-danang-03.jpg' },
      { name: '1 Phòng ngủ', area: '52–58 m²', bedrooms: 1, bathrooms: 1, price_from: 0, rentalEst: '5.5–8 triệu/đêm', floors: 'T19–36', image: '/images/nobu/nobu-danang-04.jpg' },
      { name: '2 Phòng ngủ', area: '74–82 m²', bedrooms: 2, bathrooms: 2, price_from: 0, rentalEst: '9.5–14 triệu/đêm', floors: 'T19–36', image: '/images/nobu/nobu-danang-05.jpg' },
      { name: '3PN Dual Key', area: '110–120 m²', bedrooms: 3, bathrooms: 3, price_from: 0, rentalEst: '12–18 triệu/đêm', floors: 'T19–33', image: '/images/nobu/nobu-danang-06.jpg' },
      { name: 'Sky Villa + Hồ bơi riêng', area: '145 m²+', bedrooms: 3, bathrooms: 4, price_from: 0, rentalEst: 'Từ 30 triệu/đêm', floors: 'T38–40', image: '/images/nobu/nobu-danang-01.jpg' },
      { name: 'Penthouse', area: '280 m²+', bedrooms: 4, bathrooms: 5, price_from: 0, rentalEst: 'Liên hệ', floors: 'T41', image: '/images/nobu/nobu-danang-02.jpg' },
    ],
    priceList: {
      enabled: true, lastUpdated: '01/2025',
      items: [
        { block: 'Nobu Residences', floor: 'T19–33', type: 'Studio', area: '36–40m²', price: 'Liên hệ VCRE', status: 'available' },
        { block: 'Nobu Residences', floor: 'T19–36', type: '1 Phòng ngủ', area: '52–58m²', price: 'Liên hệ VCRE', status: 'available' },
        { block: 'Nobu Residences', floor: 'T19–36', type: '2 Phòng ngủ', area: '74–82m²', price: 'Liên hệ VCRE', status: 'available' },
        { block: 'Nobu Residences', floor: 'T19–33', type: '3PN Dual Key', area: '110–120m²', price: 'Liên hệ VCRE', status: 'available' },
        { block: 'Sky', floor: 'T38–40', type: 'Sky Villa + Pool', area: '145m²+', price: 'Liên hệ VCRE', status: 'available' },
        { block: 'Penthouse', floor: 'T41', type: 'Penthouse', area: '280m²+', price: 'Liên hệ VCRE', status: 'hold' },
      ]
    },
    paymentSchedule: [
      { milestone: 'Phí đặt chỗ', percentage: 5, description: 'Nộp phí đăng ký tham gia lựa chọn sản phẩm (hoàn lại nếu không chọn được)' },
      { milestone: 'Đợt 1 — Ký HĐMB', percentage: 20, description: 'Thanh toán khi ký Hợp đồng Mua bán' },
      { milestone: 'Đợt 2 — Tiến độ XD', percentage: 25, description: 'Theo tiến độ xây dựng — Q1/2026' },
      { milestone: 'Đợt 3 — Tiến độ XD', percentage: 25, description: 'Theo tiến độ xây dựng — Q4/2026' },
      { milestone: 'Bàn giao Q2/2027', percentage: 20, description: 'Nhận bàn giao căn hộ & ký CTCT' },
      { milestone: 'Sổ hồng', percentage: 5, description: 'Khi có Giấy chứng nhận quyền sở hữu' },
    ],
    legal: [
      { title: 'Giấy chứng nhận Quyền sử dụng đất', number: 'GCN QSDĐ', date: 'Đã có', status: 'approved', description: 'GCN quyền sử dụng đất tại Số 01 Võ Văn Kiệt, Phước Mỹ, Sơn Trà, Đà Nẵng — Diện tích 3.000 m²' },
      { title: 'Giấy chứng nhận Đăng ký Doanh nghiệp', number: 'GCN ĐKDN', date: 'Đã có', status: 'approved', description: 'CTCP BĐS Circle Point — Chủ đầu tư dự án Nobu Residences Danang' },
      { title: 'Giấy phép Xây dựng', number: 'GPXD + Phụ lục GPXD', date: 'Đã có', status: 'approved', description: 'Giấy phép xây dựng tòa nhà 43 tầng, cao 186m và phụ lục bổ sung' },
      { title: 'Giấy chứng nhận Đăng ký Đầu tư', number: 'MS0650824421', date: 'Đã có', status: 'approved', description: 'GCN đăng ký đầu tư dự án Nobu Residences Danang — Bộ Kế hoạch & Đầu tư cấp' },
      { title: 'Bảo lãnh Ngân hàng', number: 'MB Bank + BVBank', date: 'Đã có', status: 'approved', description: 'Ngân hàng MB và BVBank bảo lãnh cho người mua nhà, hỗ trợ vay vốn ân hạn đến bàn giao' },
    ],
    progress: [
      { phase: 'Khởi công', date: 'Q1/2024', status: 'completed', description: 'Khởi công chính thức dự án Nobu Residences Danang' },
      { phase: 'Hoàn thiện tầng hầm', date: 'Q3/2024', status: 'completed', description: 'Hoàn thành 2 tầng hầm & phần móng toàn bộ' },
      { phase: 'Xây dựng tầng đế (T1–T18)', date: 'Q1/2025', status: 'in_progress', description: 'Thi công phần đế: lobby, spa, Nobu Hotel (T7–16)' },
      { phase: 'Xây dựng Nobu Residences (T19–T40)', date: 'Q4/2025', status: 'upcoming', description: 'Thi công phần căn hộ Nobu Residences & Sky Villa' },
      { phase: 'Hoàn thiện nội thất', date: 'Q1/2026', status: 'upcoming', description: 'Hoàn thiện nội thất theo tiêu chuẩn Nobu Hospitality' },
      { phase: 'Bàn giao', date: 'Q2/2027', status: 'upcoming', description: 'Bàn giao căn hộ cho khách hàng, vận hành chương trình cho thuê' },
    ],
    masterPlan: {
      image: '/images/nobu/nobu-danang-07.jpg',
      zones: [
        { name: 'Tầng B2–B1: Bãi đỗ xe 2 tầng hầm', units: 0 },
        { name: 'Tầng 1–2: Grand Lobby & Reception', units: 0 },
        { name: 'Tầng 3–4: Wellness & Retreat Spa', units: 0 },
        { name: 'Tầng 5: Ballroom — Sảnh hội nghị', units: 0 },
        { name: 'Tầng 6: Taste of Asia Restaurant', units: 0 },
        { name: 'Tầng 7–16: Nobu Hotel (186 phòng)', units: 186 },
        { name: 'Tầng 17: Refuge Lounge', units: 0 },
        { name: 'Tầng 19–36: Nobu Residences (264 căn)', units: 264 },
        { name: 'Tầng 37: Refuge Lounge 2', units: 0 },
        { name: 'Tầng 38–40: Sky Villas + Hồ bơi riêng', units: 0 },
        { name: 'Tầng 41: Penthouses', units: 0 },
        { name: 'Tầng 42: Nobu Restaurant', units: 0 },
        { name: 'Tầng 43: Tsukimidai Sky Bar', units: 0 },
      ]
    },
    progress_images: [
      '/images/nobu/nobu-danang-01.jpg',
      '/images/nobu/nobu-danang-02.jpg',
      '/images/nobu/nobu-danang-03.jpg',
      '/images/nobu/nobu-danang-04.jpg',
    ],
  },
  'sun-symphony': {
    id: 'sun-symphony',
    name: 'Sun Symphony Residence',
    slug: 'sun-symphony',
    slogan: 'Tọa sơn hướng thủy — Sở hữu lâu dài bên Sông Hàn huyền thoại',
    location: {
      address: 'Mặt tiền Trần Hưng Đạo, bờ Tây Sông Hàn, Quận Sơn Trà, Đà Nẵng',
      district: 'Quận Sơn Trà',
      city: 'Đà Nẵng',
      mapUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3833.9!2d108.2240!3d16.0558!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31421741d41b1af9%3A0x1!2zU3VuIFN5bXBob255!5e0!3m2!1svi!2s!4v1700000000001!5m2!1svi!2s',
      nearbyPlaces: [
        { name: 'Bờ Sông Hàn — View pháo hoa DIFF', distance: 'Trực diện', icon: Waves },
        { name: 'Cầu Rồng / Cầu Tình Yêu', distance: '2 phút', icon: Building2 },
        { name: 'Cảng Tiên Sa & Biển Mỹ Khê', distance: '5 phút', icon: Waves },
        { name: 'Sân bay Quốc tế Đà Nẵng', distance: '8 phút', icon: Car },
        { name: 'Trung tâm thành phố Đà Nẵng', distance: '3 phút', icon: Building2 },
        { name: 'Bệnh viện C Đà Nẵng', distance: '5 phút', icon: Hospital },
      ]
    },
    type: 'apartment',
    price_from: 2500000000,
    price_to: 15000000000,
    status: 'opening',
    developer: {
      name: 'Công ty CP Địa ốc Sun Group (S-Realty)',
      logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Sun_Group_logo.svg/200px-Sun_Group_logo.svg.png',
      description: 'Sun Group — Top 5 tập đoàn tư nhân lớn nhất Việt Nam. Hệ sinh thái gồm Sun World, Sun Hospitality, Sun Property (S-Realty), NCB Bank, BRG Group. Đã phát triển trên 50 dự án biểu tượng trên toàn quốc.',
      projects: ['Sun World Ba Na Hills', 'InterContinental Da Nang Sun Peninsula', 'JW Marriott Phu Quoc', 'Sun Premier Village Primavera', 'Sun Grand City Ancora Residence']
    },
    description: 'Sun Symphony Residence là tổ hợp căn hộ cao cấp sở hữu lâu dài bên bờ Sông Hàn huyền thoại — nơi diễn ra Lễ hội Pháo hoa Quốc tế DIFF hàng năm. Gồm 3 phân khu: The Symphony (S1, S2, S3 — 30 tầng căn hộ view sông) và The Sonata (Townhouse 5 tầng mặt nước). Tổng 1.373 căn hộ tích hợp phong thủy "tọa sơn hướng thủy", tiện ích 5 sao chuẩn resort.',
    highlights: [
      'View trực diện Sông Hàn — ngắm pháo hoa DIFF ngay từ ban công',
      'Sở hữu lâu dài 100% cho người Việt (Tòa S1, S2, S3)',
      'Chiết khấu 6% cho khách hàng không vay (CSBH 02/2024)',
      'Bàn giao thô Tòa S3: dự kiến 04/06/2026',
      'Hỗ trợ vay ngân hàng: NCB, VietinBank, HDBank, Techcombank',
      'Miễn phí quản lý vận hành 3 năm đầu',
      'Tiện ích resort 5 sao: Sky Pool, Gym, Spa, BBQ Garden',
      'Dự án "Dòng sông Ánh sáng" đầu tư 400 tỷ VNĐ trước nhà',
    ],
    legal: [
      { name: 'GCNQSDĐ (Sổ đỏ)', status: 'approved', number: 'Đã cấp — Quận Sơn Trà, Đà Nẵng', date: '2022' },
      { name: 'GPXD — Giấy phép xây dựng', status: 'approved', number: 'GP số 127/GPXD-SXD-ĐN', date: '2022' },
      { name: 'HĐMB công chứng (NĐ96)', status: 'approved', number: 'Hợp đồng chuẩn theo Nghị định 96/2024/NĐ-CP', date: '2024' },
      { name: 'Bảo lãnh ngân hàng', status: 'approved', number: 'NCB Bank & VietinBank bảo lãnh toàn bộ S1, S2, S3', date: '2023' },
      { name: 'CSBH 02 — Chính sách bán hàng', status: 'approved', number: 'CSBH 02/The Symphony/SPG/08-2024', date: '23/08/2024' },
    ],
    progress: [
      { phase: 'Khởi công The Symphony S1', date: 'Q3/2022', status: 'done', description: 'Lễ động thổ và khởi công tòa S1' },
      { phase: 'Bàn giao thô Tòa S1 & S2', date: 'Q4/2024', status: 'done', description: 'Hoàn thiện cơ cấu tòa S1, S2' },
      { phase: 'Khởi công Tòa S3', date: 'Q1/2024', status: 'done', description: 'Thi công tầng hầm & kết cấu S3' },
      { phase: 'The Sonata — Townhouse hoàn thiện', date: 'Q2/2025', status: 'done', description: 'Bàn giao khu townhouse mặt nước' },
      { phase: 'Bàn giao thô Tòa S3', date: '04/06/2026', status: 'ongoing', description: 'Bàn giao thô căn hộ Tòa S3 (theo CSBH 02)' },
      { phase: 'Sổ hồng & cấp GCN quyền sở hữu', date: 'Q4/2026', status: 'upcoming', description: 'Hoàn thiện pháp lý, cấp sổ hồng cho cư dân' },
    ],
    amenities: [
      { name: 'Sky Pool — Bể bơi vô cực view sông', icon: Waves, category: 'Thể thao' },
      { name: 'Sky Gym tầng 3', icon: Dumbbell, category: 'Thể thao' },
      { name: 'Spa & Wellness Center', icon: Sun, category: 'Sức khỏe' },
      { name: 'Sky Garden & BBQ Terrace', icon: TreePine, category: 'Cảnh quan' },
      { name: 'Phòng sinh hoạt cộng đồng', icon: Coffee, category: 'Tiện ích' },
      { name: 'Khu vui chơi trẻ em nội khu', icon: Home, category: 'Tiện ích' },
      { name: 'Shophouse Retail T1–T2', icon: ShoppingBag, category: 'Mua sắm' },
      { name: 'An ninh 24/7 — Camera AI', icon: Shield, category: 'An ninh' },
      { name: 'Smart Home System', icon: Wifi, category: 'Công nghệ' },
      { name: 'Bãi đỗ xe thông minh B1–B2', icon: Car, category: 'Tiện ích' },
      { name: 'Bến du thuyền mặt sông', icon: Waves, category: 'Cao cấp' },
      { name: 'View pháo hoa DIFF trực tiếp', icon: Sun, category: 'Đặc quyền' },
    ],
    images: [
      '/images/sun-symphony/sun-symphony-01.jpg',
      '/images/sun-symphony/sun-symphony-02.jpg',
      '/images/sun-symphony/sun-symphony-03.jpg',
      '/images/sun-symphony/sun-symphony-04.jpg',
      '/images/sun-symphony/sun-symphony-05.jpg',
      '/images/sun-symphony/sun-symphony-06.jpg',
      '/images/sun-symphony/sun-symphony-07.jpg',
      '/images/sun-symphony/sun-symphony-08.jpg',
      '/images/sun-symphony/sun-symphony-09.jpg',
      '/images/sun-symphony/sun-symphony-10.jpg',
    ],
    videos: { intro: null, youtube: 'https://www.youtube.com/embed/dQw4w9WgXcQ' },
    virtualTour: { enabled: false, url: '' },
    view360: { enabled: false, images: [] },
    units_total: 1373,
    units_available: 420,
    area_range: '35–200',
    completion_date: '04/06/2026',
    is_hot: true,
    unitTypes: [
      { name: 'Studio', area: '35–38 m²', bedrooms: 0, bathrooms: 1, price_from: 2500000000, rentalEst: '12–15 triệu/tháng', floors: 'T3A–12A', image: '/images/sun-symphony/sun-symphony-03.jpg' },
      { name: '1 Phòng ngủ (1BR)', area: '50–55 m²', bedrooms: 1, bathrooms: 1, price_from: 3200000000, rentalEst: '18–22 triệu/tháng', floors: 'T3–30', image: '/images/sun-symphony/sun-symphony-04.jpg' },
      { name: '1 Phòng ngủ + (1BR+)', area: '58–65 m²', bedrooms: 1, bathrooms: 1, price_from: 3800000000, rentalEst: '22–26 triệu/tháng', floors: 'T3–30', image: '/images/sun-symphony/sun-symphony-05.jpg' },
      { name: '2 Phòng ngủ (2BR)', area: '68–80 m²', bedrooms: 2, bathrooms: 2, price_from: 5000000000, rentalEst: '28–35 triệu/tháng', floors: 'T3–30', image: '/images/sun-symphony/sun-symphony-06.jpg' },
      { name: '2 Phòng ngủ + (2BR+)', area: '80–95 m²', bedrooms: 2, bathrooms: 2, price_from: 6000000000, rentalEst: '32–40 triệu/tháng', floors: 'T12–30', image: '/images/sun-symphony/sun-symphony-07.jpg' },
      { name: '3 Phòng ngủ (3BR)', area: '95–115 m²', bedrooms: 3, bathrooms: 2, price_from: 7500000000, rentalEst: '40–55 triệu/tháng', floors: 'T15–30', image: '/images/sun-symphony/sun-symphony-08.jpg' },
      { name: 'Dual Front / Sky Villa', area: '120–160 m²', bedrooms: 3, bathrooms: 3, price_from: 10000000000, rentalEst: '60–90 triệu/tháng', floors: 'T24–29', image: '/images/sun-symphony/sun-symphony-09.jpg' },
      { name: 'Duplex / Penthouse', area: '160–200 m²', bedrooms: 4, bathrooms: 4, price_from: 12000000000, rentalEst: 'Tự khai thác cao cấp', floors: 'T29–30', image: '/images/sun-symphony/sun-symphony-10.jpg' },
    ],
    priceList: {
      enabled: true,
      lastUpdated: '23/08/2024',
      items: [
        { block: 'S1/S2', floor: 'T3A–12A', type: 'Studio', area: '35–38m²', price: 'Từ 2.5 tỷ', status: 'available' },
        { block: 'S1/S2/S3', floor: 'T3–30', type: '1BR / 1BR+', area: '50–65m²', price: 'Từ 3.2 tỷ', status: 'available' },
        { block: 'S1/S2/S3', floor: 'T3–30', type: '2BR / 2BR+', area: '68–95m²', price: 'Từ 5.0 tỷ', status: 'available' },
        { block: 'S3', floor: 'T15–30', type: '3BR', area: '95–115m²', price: 'Từ 7.5 tỷ', status: 'available' },
        { block: 'S3', floor: 'T24–29', type: 'Dual Front / Sky Villa', area: '120–160m²', price: 'Từ 10 tỷ', status: 'hold' },
        { block: 'S3', floor: 'T29–30', type: 'Duplex / Penthouse', area: '160–200m²', price: 'Từ 12 tỷ', status: 'hold' },
      ]
    },
    paymentSchedule: [
      { milestone: 'Ký HĐMB — Đặt cọc', percentage: 5, description: '100tr (Studio–2BR+) / 150tr (3BR) / 300tr (Sky Villa–PH)' },
      { milestone: 'Đợt 2 — Ngày thứ 5', percentage: 5, description: '5% GTHC (gồm GTGT), đã bao gồm tiền đặt cọc' },
      { milestone: 'Đợt 3→9 — Theo tiến độ', percentage: 35, description: '5% × 7 đợt (ngày 10→275 kể từ ký HĐMB)' },
      { milestone: 'Đợt 10–11 — Tiến độ XD', percentage: 20, description: '10% × 2 đợt (ngày 425 và 515)' },
      { milestone: 'Bàn giao thô S3', percentage: 25, description: 'Dự kiến 04/06/2026 — 25% + 100% KPBT' },
      { milestone: 'Sổ hồng — GCN quyền sở hữu', percentage: 5, description: '5% sau khi BĐS được cấp GCN (CK 6% nếu không vay)' },
    ],
    masterPlan: {
      image: '/images/sun-symphony/sun-symphony-01.jpg',
      zones: [
        { name: 'Tầng hầm B1–B2: Bãi đỗ xe thông minh', units: 0 },
        { name: 'Tầng 1–2: Shophouse & Khu Retail', units: 0 },
        { name: 'Tầng 3: Tiện ích (Sky Pool, Gym, Spa, Sân BBQ)', units: 0 },
        { name: 'Tầng 3A–12A: The Symphony S1 (Studio – 2BR+)', units: 480 },
        { name: 'Tầng 12–30: The Symphony S2 & S3 (2BR – 3BR)', units: 720 },
        { name: 'Tầng 24–29: Dual Front & Sky Villa (view sông)', units: 96 },
        { name: 'Tầng 29–30: Duplex & Penthouse', units: 77 },
        { name: 'The Sonata — Townhouse mặt nước 5 tầng', units: 0 },
      ]
    },
    progress_images: [
      '/images/sun-symphony/sun-symphony-01.jpg',
      '/images/sun-symphony/sun-symphony-02.jpg',
      '/images/sun-symphony/sun-symphony-03.jpg',
    ],
  },
  // Legacy slugs — redirect về NOBU
  '1': { redirect: 'nobu-danang' },
  '2': { redirect: 'sun-symphony' },
};


// ==================== COMPONENTS ====================




// Hero Section with Video
const HeroSection = ({ project }) => {
  const [showVideo, setShowVideo] = useState(false);
  const [videoType, setVideoType] = useState('intro'); // 'intro' or 'youtube'

  return (
    <section className="relative h-[70vh] lg:h-[80vh] flex items-end overflow-hidden">
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url('${project.images[0]}')` }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 lg:pb-20 w-full">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-4">
              {project.is_hot && <Badge className="bg-red-500 text-white border-0">HOT</Badge>}
              <Badge className="bg-white/20 text-white border-0 backdrop-blur-sm">
                {project.status === 'opening' ? 'Đang mở bán' : 'Sắp mở bán'}
              </Badge>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-3">{project.name}</h1>
            <p className="text-xl text-white/80 mb-4">{project.slogan}</p>
            <div className="flex items-center gap-2 text-white/70">
              <MapPin className="h-5 w-5" />
              <span>{project.location.address}</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            {project.videos?.intro && (
              <Button 
                size="lg" 
                className="bg-white text-slate-900 hover:bg-white/90"
                onClick={() => { setVideoType('intro'); setShowVideo(true); }}
              >
                <Play className="h-5 w-5 mr-2" /> Video dự án
              </Button>
            )}
            {project.videos?.youtube && (
              <Button 
                size="lg" 
                variant="outline"
                className="border-white text-white hover:bg-white/10 bg-transparent"
                onClick={() => { setVideoType('youtube'); setShowVideo(true); }}
              >
                <Youtube className="h-5 w-5 mr-2" /> YouTube
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Video Modal */}
      <Dialog open={showVideo} onOpenChange={setShowVideo}>
        <DialogContent className="max-w-4xl p-0 bg-black border-0">
          <div className="relative aspect-video">
            {videoType === 'intro' && project.videos?.intro ? (
              <video 
                src={project.videos.intro} 
                controls 
                autoPlay 
                className="w-full h-full"
              />
            ) : (
              <iframe 
                src={project.videos?.youtube?.replace('watch?v=', 'embed/')}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
};

// Quick Stats Section
const QuickStatsSection = ({ project }) => {
  const { isDark } = useTheme();
  
  const formatPrice = (price) => {
    if (price >= 1000000000) return `${(price / 1000000000).toFixed(1)} tỷ`;
    return `${(price / 1000000).toFixed(0)} triệu`;
  };

  const stats = [
    { label: 'Giá từ', value: formatPrice(project.price_from), icon: DollarSign },
    { label: 'Diện tích', value: `${project.area_range} m²`, icon: Square },
    { label: 'Tổng căn', value: project.units_total.toLocaleString(), icon: Building2 },
    { label: 'Còn lại', value: project.units_available.toLocaleString(), icon: Check },
    { label: 'Bàn giao', value: project.completion_date, icon: Calendar },
  ];

  return (
    <section className={`py-8 ${isDark ? 'bg-slate-800' : 'bg-white'} shadow-lg -mt-16 relative z-10 mx-4 lg:mx-auto max-w-6xl rounded-2xl`}>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-6 px-6">
        {stats.map((stat, i) => (
          <div key={i} className="text-center">
            <stat.icon className="h-8 w-8 mx-auto mb-2 text-[#316585]" />
            <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{stat.value}</p>
            <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{stat.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

// Overview Section
const OverviewSection = ({ project }) => {
  const { isDark } = useTheme();

  return (
    <section className={`py-16 ${isDark ? 'bg-slate-900' : 'bg-slate-50'}`} id="overview">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12">
          <div>
            <span className="text-[#316585] text-sm font-semibold uppercase tracking-wider">Tổng quan</span>
            <h2 className={`text-3xl font-bold mt-2 mb-6 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Giới thiệu {project.name}
            </h2>
            <p className={`text-lg leading-relaxed mb-8 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              {project.description}
            </p>
            
            <h3 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>Điểm nổi bật</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {project.highlights.map((highlight, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#316585] flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="h-4 w-4 text-white" />
                  </div>
                  <span className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{highlight}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Developer Info */}
          <Card className={`${isDark ? 'bg-slate-800 border-slate-700' : ''}`}>
            <CardHeader>
              <CardTitle className={isDark ? 'text-white' : ''}>Chủ đầu tư</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-20 h-20 rounded-lg bg-white p-2 flex items-center justify-center">
                  <img loading="lazy" src={project.developer.logo} alt={project.developer.name} className="w-full h-full object-contain"  />
                </div>
                <div>
                  <h4 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{project.developer.name}</h4>
                  <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Chủ đầu tư uy tín</p>
                </div>
              </div>
              <p className={`text-sm mb-4 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{project.developer.description}</p>
              <div>
                <p className={`text-sm font-medium mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>Các dự án khác:</p>
                <div className="flex flex-wrap gap-2">
                  {project.developer.projects.map((p, i) => (
                    <Badge key={i} variant="outline" className={isDark ? 'border-slate-600 text-slate-300' : ''}>{p}</Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

// Location Section with Map
const LocationSection = ({ project }) => {
  const { isDark } = useTheme();

  return (
    <section className={`py-16 ${isDark ? 'bg-slate-800' : 'bg-white'}`} id="location">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <span className="text-[#316585] text-sm font-semibold uppercase tracking-wider">Vị trí</span>
          <h2 className={`text-3xl font-bold mt-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>Vị trí dự án</h2>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="rounded-xl overflow-hidden h-[400px]">
              <iframe 
                src={project.location.mapUrl}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>

          <div>
            <Card className={`h-full ${isDark ? 'bg-slate-900 border-slate-700' : ''}`}>
              <CardHeader>
                <CardTitle className={`flex items-center gap-2 ${isDark ? 'text-white' : ''}`}>
                  <MapPin className="h-5 w-5 text-[#316585]" />
                  Kết nối xung quanh
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {project.location.nearbyPlaces.map((place, i) => (
                  <div key={i} className={`flex items-center justify-between p-3 rounded-lg ${isDark ? 'bg-slate-800' : 'bg-slate-50'}`}>
                    <div className="flex items-center gap-3">
                      <place.icon className="h-5 w-5 text-[#316585]" />
                      <span className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{place.name}</span>
                    </div>
                    <Badge variant="outline" className={isDark ? 'border-slate-600' : ''}>{place.distance}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};

// Virtual Tour & 360 Section
const VirtualTourSection = ({ project }) => {
  const { isDark } = useTheme();
  const [show360, setShow360] = useState(false);
  const [showVirtualTour, setShowVirtualTour] = useState(false);

  if (!project.virtualTour?.enabled && !project.view360?.enabled) return null;

  return (
    <section className={`py-16 ${isDark ? 'bg-slate-900' : 'bg-slate-50'}`} id="virtual-tour">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <span className="text-[#316585] text-sm font-semibold uppercase tracking-wider">Trải nghiệm</span>
          <h2 className={`text-3xl font-bold mt-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>Virtual Tour & 360°</h2>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Virtual Tour */}
          {project.virtualTour?.enabled && (
            <Card className={`overflow-hidden ${isDark ? 'bg-slate-800 border-slate-700' : ''}`}>
              <div className="relative h-80 bg-slate-900">
                {showVirtualTour ? (
                  <iframe
                    src={project.virtualTour.url}
                    width="100%"
                    height="100%"
                    frameBorder="0"
                    allowFullScreen
                    allow="xr-spatial-tracking"
                    title="Virtual Tour"
                  />
                ) : (
                  <>
                    <img loading="lazy" 
                      src={project.virtualTour.thumbnail || project.images[0]} 
                      alt="Virtual Tour" 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <Button 
                        size="lg" 
                        className="bg-[#316585] hover:bg-[#264a5e]"
                        onClick={() => setShowVirtualTour(true)}
                      >
                        <MousePointer className="h-5 w-5 mr-2" />
                        Khám phá Virtual Tour
                      </Button>
                    </div>
                  </>
                )}
              </div>
              <CardContent className="p-4">
                <h3 className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Virtual Tour 3D</h3>
                <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Tham quan thực tế ảo toàn bộ dự án</p>
                {showVirtualTour && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-2"
                    onClick={() => window.open(project.virtualTour.url, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4 mr-1" /> Mở fullscreen
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* 360 View with Pannellum */}
          {project.view360?.enabled && project.view360.images?.length > 0 && (
            <Card className={`overflow-hidden ${isDark ? 'bg-slate-800 border-slate-700' : ''}`}>
              <div className="relative h-80">
                {show360 ? (
                  <PannellumViewer images={project.view360.images} />
                ) : (
                  <>
                    <img loading="lazy" 
                      src={project.view360.images[0]?.url || project.images[1]} 
                      alt="360 View" 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <Button 
                        size="lg" 
                        className="bg-[#316585] hover:bg-[#264a5e]"
                        onClick={() => setShow360(true)}
                      >
                        <RotateCcw className="h-5 w-5 mr-2" />
                        Xem 360°
                      </Button>
                    </div>
                  </>
                )}
              </div>
              <CardContent className="p-4">
                <h3 className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Ảnh 360°</h3>
                <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  {show360 ? 'Kéo để xoay - Cuộn để zoom' : 'Xem chi tiết từng góc của dự án'}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </section>
  );
};

// Simple Pannellum Viewer inline for now
const PannellumViewer = ({ images }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentImage = images[currentIndex];

  return (
    <div className="relative w-full h-full">
      <img loading="lazy" 
        src={currentImage?.url}
        alt={currentImage?.name}
        className="w-full h-full object-cover cursor-move"
        style={{ objectPosition: 'center' }}
      />
      <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex items-center gap-2 bg-black/50 backdrop-blur-sm rounded-full px-3 py-1">
        <button 
          onClick={() => setCurrentIndex(prev => prev === 0 ? images.length - 1 : prev - 1)}
          className="text-white hover:text-[#316585] p-1"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-white text-xs px-2">{currentImage?.name || `${currentIndex + 1}/${images.length}`}</span>
        <button 
          onClick={() => setCurrentIndex(prev => prev === images.length - 1 ? 0 : prev + 1)}
          className="text-white hover:text-[#316585] p-1"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

// Unit Types Section
const UnitTypesSection = ({ project }) => {
  const { isDark } = useTheme();

  const formatPrice = (price) => {
    if (price >= 1000000000) return `${(price / 1000000000).toFixed(1)} tỷ`;
    return `${(price / 1000000).toFixed(0)} triệu`;
  };

  return (
    <section className={`py-16 ${isDark ? 'bg-slate-800' : 'bg-white'}`} id="units">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <span className="text-[#316585] text-sm font-semibold uppercase tracking-wider">Sản phẩm</span>
          <h2 className={`text-3xl font-bold mt-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>Loại căn hộ</h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          {project.unitTypes.map((unit, i) => (
            <Card key={i} className={`overflow-hidden hover:shadow-lg transition-shadow ${isDark ? 'bg-slate-900 border-slate-700' : ''}`}>
              {unit.image && (
                <div className="h-40 overflow-hidden">
                  <img loading="lazy" src={unit.image} alt={unit.name} className="w-full h-full object-cover hover:scale-105 transition-transform"  />
                </div>
              )}
              <CardContent className="p-4">
                <h3 className={`font-bold text-lg mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>{unit.name}</h3>
                <div className={`space-y-1 text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  <p className="flex justify-between"><span>Diện tích:</span><span className="font-medium">{unit.area}</span></p>
                  <p className="flex justify-between"><span>Phòng ngủ:</span><span className="font-medium">{unit.bedrooms}</span></p>
                  <p className="flex justify-between"><span>Phòng tắm:</span><span className="font-medium">{unit.bathrooms}</span></p>
                </div>
                <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                  <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Giá từ</p>
                  <p className="text-xl font-bold text-[#316585]">{formatPrice(unit.price_from)}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

// Price List Section
const PriceListSection = ({ project }) => {
  const { isDark } = useTheme();

  if (!project.priceList?.enabled || !project.priceList?.items?.length) return null;

  const getStatusBadge = (status) => {
    switch (status) {
      case 'available': return <Badge className="bg-green-500 text-white border-0">Còn</Badge>;
      case 'hold': return <Badge className="bg-yellow-500 text-white border-0">Giữ chỗ</Badge>;
      case 'sold': return <Badge className="bg-red-500 text-white border-0">Đã bán</Badge>;
      default: return null;
    }
  };

  return (
    <section className={`py-16 ${isDark ? 'bg-slate-900' : 'bg-slate-50'}`} id="price">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <span className="text-[#316585] text-sm font-semibold uppercase tracking-wider">Bảng giá</span>
          <h2 className={`text-3xl font-bold mt-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>Bảng giá chi tiết</h2>
          <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Cập nhật: {project.priceList.lastUpdated}
          </p>
        </div>

        <Card className={isDark ? 'bg-slate-800 border-slate-700' : ''}>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className={isDark ? 'border-slate-700' : ''}>
                    <TableHead className={isDark ? 'text-slate-300' : ''}>Block</TableHead>
                    <TableHead className={isDark ? 'text-slate-300' : ''}>Tầng</TableHead>
                    <TableHead className={isDark ? 'text-slate-300' : ''}>Loại</TableHead>
                    <TableHead className={isDark ? 'text-slate-300' : ''}>Diện tích</TableHead>
                    <TableHead className={isDark ? 'text-slate-300' : ''}>Giá bán</TableHead>
                    <TableHead className={isDark ? 'text-slate-300' : ''}>Trạng thái</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {project.priceList.items.map((item, i) => (
                    <TableRow key={i} className={isDark ? 'border-slate-700' : ''}>
                      <TableCell className={`font-medium ${isDark ? 'text-white' : ''}`}>{item.block}</TableCell>
                      <TableCell className={isDark ? 'text-slate-300' : ''}>{item.floor}</TableCell>
                      <TableCell className={isDark ? 'text-slate-300' : ''}>{item.type}</TableCell>
                      <TableCell className={isDark ? 'text-slate-300' : ''}>{item.area}</TableCell>
                      <TableCell className="font-bold text-[#316585]">{item.price}</TableCell>
                      <TableCell>{getStatusBadge(item.status)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

// Payment Schedule Section
const PaymentSection = ({ project }) => {
  const { isDark } = useTheme();

  return (
    <section className={`py-16 ${isDark ? 'bg-slate-800' : 'bg-white'}`} id="payment">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <span className="text-[#316585] text-sm font-semibold uppercase tracking-wider">Thanh toán</span>
          <h2 className={`text-3xl font-bold mt-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>Tiến độ thanh toán</h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {project.paymentSchedule.map((item, i) => (
            <Card key={i} className={`text-center ${isDark ? 'bg-slate-900 border-slate-700' : ''}`}>
              <CardContent className="p-6">
                <div className="w-16 h-16 rounded-full bg-[#316585] text-white flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  {item.percentage}%
                </div>
                <h3 className={`font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>{item.milestone}</h3>
                {item.description && (
                  <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{item.description}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

// Amenities Section
const AmenitiesSection = ({ project }) => {
  const { isDark } = useTheme();
  const [activeCategory, setActiveCategory] = useState('all');

  const categories = ['all', ...new Set(project.amenities.map(a => a.category))];
  const filteredAmenities = activeCategory === 'all' 
    ? project.amenities 
    : project.amenities.filter(a => a.category === activeCategory);

  return (
    <section className={`py-16 ${isDark ? 'bg-slate-900' : 'bg-slate-50'}`} id="amenities">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <span className="text-[#316585] text-sm font-semibold uppercase tracking-wider">Tiện ích</span>
          <h2 className={`text-3xl font-bold mt-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>Tiện ích nội khu</h2>
        </div>

        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {categories.map(cat => (
            <Button
              key={cat}
              variant={activeCategory === cat ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveCategory(cat)}
              className={activeCategory === cat ? 'bg-[#316585]' : isDark ? 'border-slate-600' : ''}
            >
              {cat === 'all' ? 'Tất cả' : cat}
            </Button>
          ))}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {filteredAmenities.map((amenity, i) => (
            <Card key={i} className={`text-center p-4 hover:shadow-md transition-shadow ${isDark ? 'bg-slate-800 border-slate-700' : ''}`}>
              <amenity.icon className="h-8 w-8 mx-auto mb-2 text-[#316585]" />
              <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-slate-700'}`}>{amenity.name}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

// Gallery Section
const GallerySection = ({ project }) => {
  const { isDark } = useTheme();
  const [selectedImage, setSelectedImage] = useState(null);

  return (
    <section className={`py-16 ${isDark ? 'bg-slate-800' : 'bg-white'}`} id="gallery">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <span className="text-[#316585] text-sm font-semibold uppercase tracking-wider">Thư viện</span>
          <h2 className={`text-3xl font-bold mt-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>Hình ảnh dự án</h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {project.images.map((img, i) => (
            <div 
              key={i} 
              className="aspect-square rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => setSelectedImage(img)}
            >
              <img loading="lazy" src={img} alt={`${project.name} ${i + 1}`} className="w-full h-full object-cover"  />
            </div>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-5xl p-0 bg-black border-0">
          <img loading="lazy" src={selectedImage} alt="Gallery" className="w-full h-auto"  />
        </DialogContent>
      </Dialog>
    </section>
  );
};

// Progress Section - Tiến độ dự án
const ProgressSection = ({ project }) => {
  const { isDark } = useTheme();
  
  // Default progress data if not available from API
  const defaultProgress = [
    { phase: 'Khởi công', date: '01/2024', status: 'completed', description: 'Khởi công xây dựng dự án' },
    { phase: 'Hoàn thiện móng', date: '06/2024', status: 'completed', description: 'Hoàn thành phần móng và tầng hầm' },
    { phase: 'Xây dựng thân', date: '12/2024', status: 'in_progress', description: 'Thi công phần thân tòa nhà' },
    { phase: 'Hoàn thiện nội thất', date: '06/2025', status: 'upcoming', description: 'Hoàn thiện nội thất các căn hộ' },
    { phase: 'Bàn giao', date: '12/2025', status: 'upcoming', description: 'Bàn giao căn hộ cho cư dân' },
  ];
  
  const progress = project.progress || defaultProgress;
  
  const statusColors = {
    completed: 'bg-green-500',
    in_progress: 'bg-amber-500',
    upcoming: 'bg-slate-400'
  };
  
  const statusLabels = {
    completed: 'Hoàn thành',
    in_progress: 'Đang thực hiện',
    upcoming: 'Sắp tới'
  };

  return (
    <section className={`py-16 ${isDark ? 'bg-slate-800' : 'bg-white'}`} id="progress">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <span className="text-[#316585] text-sm font-medium uppercase tracking-wider">Tiến độ</span>
          <h2 className={`text-3xl font-bold mt-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>Tiến độ xây dựng</h2>
        </div>
        
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-0.5 bg-slate-200 dark:bg-slate-700" />
          
          <div className="space-y-8">
            {progress.map((item, index) => (
              <div key={index} className={`relative flex items-center ${index % 2 === 0 ? 'flex-row' : 'flex-row-reverse'}`}>
                {/* Content */}
                <div className={`w-5/12 ${index % 2 === 0 ? 'pr-8 text-right' : 'pl-8 text-left'}`}>
                  <div className={`p-6 rounded-xl ${isDark ? 'bg-slate-700' : 'bg-slate-50'} shadow-lg`}>
                    <div className="flex items-center gap-2 mb-2 justify-end">
                      <Badge className={`${statusColors[item.status]} text-white`}>
                        {statusLabels[item.status]}
                      </Badge>
                    </div>
                    <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{item.phase}</h3>
                    <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'} mt-1`}>{item.description}</p>
                    <p className="text-[#316585] font-semibold mt-2">{item.date}</p>
                  </div>
                </div>
                
                {/* Timeline dot */}
                <div className="absolute left-1/2 transform -translate-x-1/2 w-4 h-4 rounded-full border-4 border-white dark:border-slate-800 shadow-lg z-10"
                  style={{ backgroundColor: statusColors[item.status].replace('bg-', '#').replace('green-500', '22c55e').replace('amber-500', 'f59e0b').replace('slate-400', '94a3b8') }}
                />
                
                {/* Empty space */}
                <div className="w-5/12" />
              </div>
            ))}
          </div>
        </div>

        {/* Progress images */}
        {project.progress_images && project.progress_images.length > 0 && (
          <div className="mt-12">
            <h3 className={`text-xl font-bold mb-6 ${isDark ? 'text-white' : 'text-slate-900'}`}>Hình ảnh tiến độ</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {project.progress_images.slice(0, 4).map((img, index) => (
                <div key={index} className="relative aspect-video rounded-xl overflow-hidden">
                  <img loading="lazy" src={img} alt={`Tiến độ ${index + 1}`} className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

// Legal Section - Pháp lý dự án
const LegalSection = ({ project }) => {
  const { isDark } = useTheme();
  
  // Default legal data if not available from API
  const defaultLegal = [
    { title: 'Quyết định phê duyệt quy hoạch', number: 'Số 1234/QĐ-UBND', date: '15/03/2023', status: 'approved', description: 'Quyết định phê duyệt quy hoạch chi tiết tỷ lệ 1/500' },
    { title: 'Giấy phép xây dựng', number: 'Số 567/GPXD', date: '20/06/2023', status: 'approved', description: 'Giấy phép xây dựng công trình' },
    { title: 'Giấy chứng nhận QSDĐ', number: 'Số 789/GCN', date: '01/01/2023', status: 'approved', description: 'Giấy chứng nhận quyền sử dụng đất' },
    { title: 'Bảo lãnh ngân hàng', number: 'Vietcombank', date: '25/07/2023', status: 'approved', description: 'Ngân hàng bảo lãnh cho người mua nhà' },
  ];
  
  const legal = project.legal || defaultLegal;
  
  const statusIcons = {
    approved: { icon: CheckCircle, color: 'text-green-500', label: 'Đã phê duyệt' },
    pending: { icon: Clock, color: 'text-amber-500', label: 'Đang xử lý' },
    processing: { icon: FileText, color: 'text-blue-500', label: 'Đang hoàn thiện' }
  };

  return (
    <section className={`py-16 ${isDark ? 'bg-slate-900' : 'bg-slate-50'}`} id="legal">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <span className="text-[#316585] text-sm font-medium uppercase tracking-wider">Pháp lý</span>
          <h2 className={`text-3xl font-bold mt-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>Pháp lý dự án</h2>
          <p className={`mt-4 max-w-2xl mx-auto ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            Dự án {project.name} được đảm bảo đầy đủ pháp lý, minh bạch cho khách hàng
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-6">
          {legal.map((item, index) => {
            const StatusIcon = statusIcons[item.status]?.icon || CheckCircle;
            const statusColor = statusIcons[item.status]?.color || 'text-green-500';
            const statusLabel = statusIcons[item.status]?.label || 'Đã phê duyệt';
            
            return (
              <Card key={index} className={`${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white'} hover:shadow-lg transition-shadow`}>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isDark ? 'bg-slate-700' : 'bg-slate-100'}`}>
                      <FileText className="w-6 h-6 text-[#316585]" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{item.title}</h3>
                        <div className={`flex items-center gap-1 ${statusColor}`}>
                          <StatusIcon className="w-4 h-4" />
                          <span className="text-sm">{statusLabel}</span>
                        </div>
                      </div>
                      <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{item.description}</p>
                      <div className="flex items-center gap-4 mt-3">
                        <span className={`text-sm ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                          <strong>Số:</strong> {item.number}
                        </span>
                        <span className={`text-sm ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                          <strong>Ngày:</strong> {item.date}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Legal certification banner */}
        <div className={`mt-12 p-8 rounded-2xl ${isDark ? 'bg-gradient-to-r from-slate-800 to-slate-700' : 'bg-gradient-to-r from-[#316585]/10 to-[#316585]/5'}`}>
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
                <Shield className="w-8 h-8 text-green-500" />
              </div>
              <div>
                <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Pháp lý hoàn chỉnh 100%</h3>
                <p className={`${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Sổ hồng sở hữu lâu dài - An tâm đầu tư</p>
              </div>
            </div>
            <Button className="bg-[#316585] hover:bg-[#264d66] text-white">
              Xem chi tiết pháp lý
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

// Contact Section
const ContactSection = ({ project }) => {
  const { isDark } = useTheme();
  const [form, setForm] = useState({ name: '', phone: '', email: '', message: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch(`${API_URL}/api/website/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          project_interest: project.name,
          subject: 'invest',
          source_page: 'project-landing'
        })
      });
      toast.success('Gửi thông tin thành công! Chúng tôi sẽ liên hệ bạn sớm nhất.');
      setForm({ name: '', phone: '', email: '', message: '' });
    } catch (error) {
      toast.success('Đã nhận thông tin!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="py-16 bg-[#316585]" id="contact">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12">
          <div className="text-white">
            <h2 className="text-3xl font-bold mb-4">Đăng ký nhận thông tin</h2>
            <p className="text-white/80 mb-8">
              Để lại thông tin để được tư vấn chi tiết về dự án {project.name} và các chương trình ưu đãi mới nhất.
            </p>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center">
                  <Phone className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-white/60 text-sm">Hotline</p>
                  <p className="text-xl font-bold">1800 1234</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center">
                  <Mail className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-white/60 text-sm">Email</p>
                  <p className="text-xl font-bold">sales@prohouzing.com</p>
                </div>
              </div>
            </div>
          </div>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input placeholder="Họ tên *" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} className="bg-white/10 border-white/20 text-white placeholder:text-white/50" required />
                <Input placeholder="Số điện thoại *" value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value})} className="bg-white/10 border-white/20 text-white placeholder:text-white/50" required />
                <Input placeholder="Email" type="email" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} className="bg-white/10 border-white/20 text-white placeholder:text-white/50" />
                <Textarea placeholder="Ghi chú..." value={form.message} onChange={(e) => setForm({...form, message: e.target.value})} className="bg-white/10 border-white/20 text-white placeholder:text-white/50" rows={3} />
                <Button type="submit" className="w-full bg-white text-[#316585] hover:bg-white/90" disabled={loading}>
                  {loading ? 'Đang gửi...' : <><Send className="h-4 w-4 mr-2" />Đăng ký ngay</>}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

// Sticky Navigation
const StickyNav = ({ project }) => {
  const [activeSection, setActiveSection] = useState('overview');

  const sections = [
    { id: 'overview', name: 'Tổng quan' },
    { id: 'location', name: 'Vị trí' },
    { id: 'virtual-tour', name: '360°' },
    { id: 'units', name: 'Loại căn' },
    { id: 'price', name: 'Bảng giá' },
    { id: 'payment', name: 'Thanh toán' },
    { id: 'amenities', name: 'Tiện ích' },
    { id: 'gallery', name: 'Hình ảnh' },
    { id: 'progress', name: 'Tiến độ' },
    { id: 'legal', name: 'Pháp lý' },
    { id: 'contact', name: 'Liên hệ' },
  ];

  return (
    <nav className="sticky top-20 lg:top-24 z-40 bg-white dark:bg-slate-900 shadow-md">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center gap-1 overflow-x-auto py-3 scrollbar-hide">
          {sections.map(section => (
            <a
              key={section.id}
              href={`#${section.id}`}
              className={`px-4 py-2 text-sm font-medium whitespace-nowrap rounded-lg transition-colors ${
                activeSection === section.id 
                  ? 'bg-[#316585] text-white' 
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
              }`}
              onClick={() => setActiveSection(section.id)}
            >
              {section.name}
            </a>
          ))}
        </div>
      </div>
    </nav>
  );
};

// ==================== HELPER: Transform API data to match frontend format ====================
const transformApiProject = (apiProject) => {
  if (!apiProject) return null;
  
  // Map icon strings to Lucide components
  const iconMap = {
    'Car': Car, 'Building2': Building2, 'Waves': Waves, 'TreePine': TreePine,
    'Dumbbell': Dumbbell, 'Coffee': Coffee, 'ShoppingBag': ShoppingBag,
    'Home': Home, 'Shield': Shield, 'Wifi': Wifi, 'ParkingCircle': ParkingCircle,
    'Users': Users, 'Sun': Sun, 'GraduationCap': GraduationCap, 'Hospital': Hospital,
    'Droplets': Droplets
  };
  
  return {
    ...apiProject,
    location: {
      ...apiProject.location,
      mapUrl: apiProject.location?.map_url,
      nearbyPlaces: (apiProject.location?.nearby_places || []).map(p => ({
        ...p,
        icon: iconMap[p.icon] || Car
      }))
    },
    virtualTour: apiProject.virtual_tour || { enabled: false },
    view360: apiProject.view_360 || { enabled: false },
    unitTypes: apiProject.unit_types || [],
    priceList: {
      enabled: apiProject.price_list?.enabled ?? true,
      lastUpdated: apiProject.price_list?.last_updated,
      items: apiProject.price_list?.items || []
    },
    paymentSchedule: apiProject.payment_schedule || [],
    videos: {
      intro: apiProject.videos?.intro_url,
      youtube: apiProject.videos?.youtube_url
    },
    amenities: (apiProject.amenities || []).map(a => ({
      ...a,
      icon: iconMap[a.icon] || Coffee
    })),
    masterPlan: apiProject.masterPlan || { image: apiProject.images?.[0], zones: [] }
  };
};


// Build full project object from SUN_GROUP_PROJECTS simple data
function buildSGProject(sg) {
  const imgs = sg.images && sg.images.length ? sg.images : [
    'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200'
  ];
  return {
    id: sg.id, slug: sg.slug, name: sg.name,
    slogan: sg.description?.slice(0,80) || sg.name,
    status: sg.status || 'opening', type: sg.type || 'apartment',
    price_from: sg.price_from || 0, price_to: sg.price_to || null,
    images: imgs,
    developer: {
      name: typeof sg.developer==='string' ? sg.developer : (sg.developer?.name||'Sun Group'),
      logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Sun_Group_logo.svg/200px-Sun_Group_logo.svg.png',
      description: 'Tập đoàn Sun Group — Top 10 doanh nghiệp tư nhân lớn nhất Việt Nam, hệ sinh thái gồm Sun World, Sun Hospitality, Sun Property, BRG Group và NCB Bank.',
      projects: ['Sun World Ba Na Hills', 'Sun World Fansipan', 'InterContinental Da Nang', 'JW Marriott Phu Quoc', 'Sun Premier Village'],
    },
    location: {
      address: sg.location?.address || '',
      district: sg.location?.district || '',
      city: sg.location?.city || '',
      mapUrl: '',
      nearbyPlaces: []
    },
    description: sg.description || '',
    highlights: (sg.highlights && sg.highlights.length) ? sg.highlights : ['Chủ đầu tư Sun Group uy tín', 'Vị trí đắc địa', 'Pháp lý hoàn chỉnh', 'Tiện ích đẳng cấp', 'Tiềm năng tăng giá cao'],
    units_total: sg.units_total || 0,
    units_available: sg.units_available || 0,
    area_range: sg.area_range || '',
    completion_date: sg.completion_date || '',
    videos: { intro: null, youtube: null },
    virtualTour: { enabled: false, url: '' },
    view360: { enabled: false, images: [] },
    unitTypes: sg.type === 'villa' ? [
      { name: 'Biệt thự đơn lập', area: '200–400 m²', bedrooms: 4, bathrooms: 4, price_from: sg.price_from || 10000000000, image: imgs[0] },
      { name: 'Biệt thự song lập', area: '150–250 m²', bedrooms: 3, bathrooms: 3, price_from: (sg.price_from || 8000000000)*0.7, image: imgs[0] },
      { name: 'Shophouse', area: '80–120 m²', bedrooms: 3, bathrooms: 3, price_from: (sg.price_from || 5000000000)*0.6, image: imgs[0] },
    ] : sg.type === 'mixed' ? [
      { name: 'Căn hộ Studio', area: '30–45 m²', bedrooms: 0, bathrooms: 1, price_from: (sg.price_from || 2500000000)*0.5, image: imgs[0] },
      { name: 'Căn hộ 1PN', area: '45–65 m²', bedrooms: 1, bathrooms: 1, price_from: sg.price_from || 2500000000, image: imgs[0] },
      { name: 'Căn hộ 2PN', area: '65–90 m²', bedrooms: 2, bathrooms: 2, price_from: (sg.price_from || 2500000000)*1.5, image: imgs[0] },
      { name: 'Shophouse', area: '80–150 m²', bedrooms: 0, bathrooms: 1, price_from: (sg.price_from || 2500000000)*2, image: imgs[0] },
    ] : [
      { name: 'Studio', area: '32–45 m²', bedrooms: 0, bathrooms: 1, price_from: (sg.price_from || 3000000000)*0.7, image: imgs[0] },
      { name: '1 Phòng ngủ', area: '50–65 m²', bedrooms: 1, bathrooms: 1, price_from: sg.price_from || 3000000000, image: imgs[0] },
      { name: '2 Phòng ngủ', area: '70–90 m²', bedrooms: 2, bathrooms: 2, price_from: (sg.price_from || 3000000000)*1.6, image: imgs[0] },
      { name: '3 Phòng ngủ', area: '95–130 m²', bedrooms: 3, bathrooms: 2, price_from: (sg.price_from || 3000000000)*2.2, image: imgs[0] },
    ],
    priceList: { enabled: true, lastUpdated: '01/04/2025', items: [
      { block: 'A', floor: '5–15', type: 'Studio', area: sg.area_range?.split('–')[0]+'m²'||'45m²', price: sg.price_from ? `Từ ${(sg.price_from/1000000000).toFixed(1)} tỷ` : 'Liên hệ', status: 'available' },
      { block: 'A', floor: '5–20', type: '1PN', area: sg.area_range?.split('–')[1]?.split(' ')[0]+'m²'||'65m²', price: sg.price_from ? `Từ ${((sg.price_from*1.5)/1000000000).toFixed(1)} tỷ` : 'Liên hệ', status: 'available' },
      { block: 'B', floor: '10–25', type: '2PN', area: '75–90m²', price: sg.price_from ? `Từ ${((sg.price_from*2)/1000000000).toFixed(1)} tỷ` : 'Liên hệ', status: 'available' },
      { block: 'B', floor: '20–30', type: '3PN', area: '100–130m²', price: 'Liên hệ', status: 'hold' },
    ]},
    paymentSchedule: [
      { percentage: 30, milestone: 'Ký HĐMB', description: 'Thanh toán đợt 1' },
      { percentage: 30, milestone: 'Tiến độ XD', description: 'Theo tiến độ xây dựng' },
      { percentage: 30, milestone: 'Nhận bàn giao', description: 'Khi nhận nhà' },
      { percentage: 10, milestone: 'Sổ hồng', description: 'Khi có sổ hồng' },
    ],
    amenities: [
      { name: 'Hồ bơi', category: 'Thể thao', icon: Waves },
      { name: 'Phòng gym', category: 'Thể thao', icon: Dumbbell },
      { name: 'Bãi đỗ xe', category: 'Tiện ích', icon: Car },
      { name: 'Công viên', category: 'Tiện ích', icon: TreePine },
      { name: 'Trung tâm TM', category: 'Dịch vụ', icon: ShoppingBag },
      { name: 'An ninh 24/7', category: 'An ninh', icon: Shield },
    ],
    masterPlan: { image: imgs[0], zones: [] },
    is_hot: sg.is_hot || false,
  };
}

// ==================== MAIN COMPONENT ====================
export default function ProjectLandingPage() {
  const { projectId } = useParams();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProject = async () => {
      setLoading(true);
      try {
        // Resolve theo thứ tự ưu tiên:
        // 1. Redirect slugs cũ (1, 2)
        const redirectEntry = projectsData[projectId];
        if (redirectEntry?.redirect) {
          window.location.replace(`/projects/${redirectEntry.redirect}`);
          return;
        }

        // 2. Local premium data (Nobu, Sun Symphony) → ưu tiên rich data
        const localData = projectsData[projectId] || null;

        // 3. Thử API qua Vercel proxy (/api/projects/slug/:slug)
        //    Nếu API có data → dùng API (source of truth)
        //    Nếu API 404 hoặc lỗi → dùng local
        const { project: resolved, source } = await resolveProject(projectId, localData);

        // 4. Nếu API trả về → transform field names
        if (source === 'api') {
          setProject(transformApiProject(resolved));
        } else {
          // 5. Local data đã đúng format → dùng thẳng
          if (resolved) {
            setProject(resolved);
          } else {
            // 6. Thử SUN_GROUP_PROJECTS (33 dự án)
            const sg = SUN_GROUP_PROJECTS.find(p => p.slug === projectId || p.id === projectId);
            setProject(sg ? buildSGProject(sg) : projectsData['nobu-danang']);
          }
        }
      } catch {
        // Final fallback → tránh màn hình trắng
        const sg = SUN_GROUP_PROJECTS.find(p => p.slug === projectId || p.id === projectId);
        setProject(sg ? buildSGProject(sg) : (projectsData[projectId] || projectsData['nobu-danang']));
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [projectId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0d1f35]">
        <div className="text-white text-xl">Đang tải...</div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0d1f35]">
        <p className="text-white">Dự án không tồn tại</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen" data-testid="project-landing-page">
      <WebsiteHeader />
      <HeroSection project={project} />
      <QuickStatsSection project={project} />
      <StickyNav project={project} />
      <OverviewSection project={project} />
      <LocationSection project={project} />
      <VirtualTourSection project={project} />
      <UnitTypesSection project={project} />
      <PriceListSection project={project} />
      <PaymentSection project={project} />
      <AmenitiesSection project={project} />
      <GallerySection project={project} />
      <ProgressSection project={project} />
      <LegalSection project={project} />
      <ContactSection project={project} />
      <WebsiteFooter />
    </div>
  );
}
