/**
 * aiKnowledgeBase.js
 * ─────────────────────────────────────────────────────────────
 * Cơ sở tri thức doanh nghiệp cho AI ProHouze.
 * AI đọc file này để trả lời câu hỏi về dự án, chính sách, quy trình.
 *
 * Admin cập nhật dự án → AI tự động học từ dữ liệu mới nhất.
 * Nguồn: Factsheet + FAQ + Booking Form chính thức VCRE
 */

// ─── DỰ ÁN ĐANG BÁN ──────────────────────────────────────────────────────────
export const KNOWLEDGE_PROJECTS = {
  NBU: {
    id: 'NBU',
    name: 'Nobu Residences Danang',
    developer: 'Circle Point Real Estate JSC (VCRE)',
    operator: 'Nobu Hospitality (Robert De Niro & Nobu Matsuhisa)',
    ecosystem: 'Phoenix Holdings (BVBank, Vietcap Securities, 7-Eleven, McDonald\'s)',
    location: 'Lô A2 góc Võ Nguyên Giáp – Võ Văn Kiệt, P.Phước Mỹ, Q.Sơn Trà, Đà Nẵng',
    beach: 'Mỹ Khê – một trong những bãi biển đẹp nhất ĐNA',
    floors: 43, basements: 2, height: '186m',
    totalResidences: 264, hotelRooms: 186,
    openYear: 2027,
    guarantee: { pct: 6, years: 2, note: 'trên giá trị HĐ chưa VAT, chưa KPBT' },
    revenueShare: { pct: 40, basis: 'gross revenue theo pool cùng loại căn' },
    ctct: { term: 25, periods: [10, 5, 5, 5], mandatory: 'Tầng 19-33 bắt buộc kỳ 1 (10 năm)', optional: 'Tầng 34-41: tùy chọn, tối thiểu 5 năm' },
    hotline: '+84 931 713 713',
    bankAccount: '617 7979 686868 – BVBank (Ngân hàng Bản Việt)',
    legalDocs: ['GCN QSDĐ', 'GCN Đăng ký DN', 'GPXD + Phụ lục', 'GCN Đầu tư MS0650824421'],
    supportBanks: ['MB Bank', 'BVBank'],
    unitTypes: {
      STU: { name: 'Studio', area: '36–40m²', maxGuests: 2, rentalEst: 3800000, floors: '19–36' },
      '1PN': { name: '1 Phòng ngủ', area: '52–58m²', maxGuests: '2 người lớn + 1 trẻ', rentalEst: 5500000, floors: '19–36' },
      '2PN': { name: '2 Phòng ngủ', area: '74–82m²', maxGuests: '4 người lớn + 1 trẻ', rentalEst: 9500000, floors: '19–36' },
      '3DK': { name: '3PN Dual Key', area: '110–120m²', maxGuests: '6 người lớn + 1 trẻ', rentalEst: 12000000, floors: '19–33 (bắt buộc CTCT)' },
      '3SP': { name: '3PN Sky Villa + Hồ bơi', area: '145m²+', maxGuests: '6 người lớn + 1 trẻ', rentalEst: 30000000, floors: '38–40' },
      PH: { name: 'Penthouse', area: '280m²+', maxGuests: 'Liên hệ', rentalEst: null, floors: '41' },
    },
    floorMap: {
      '1': 'Lobby + Reception + Retail',
      '3–4': 'Wellness & Retreat (Spa)',
      '5': 'Ballroom + Meeting Rooms',
      '6': 'Taste of Asia Restaurant',
      '7–16': 'Nobu Hotel (186 phòng)',
      '17': 'Refuge Floor (Tầng lánh nạn)',
      '18': 'Tiện ích cư dân',
      '19–36': 'Nobu Residences (Studio, 1PN, 2PN, 3DK)',
      '37': 'Refuge Floor',
      '38–40': 'Sky Villas (3PN + hồ bơi)',
      '41': 'Penthouses',
      '42': 'Nobu Restaurant',
      '43': 'Tsukimidai Sky Bar',
    },
    ownerBenefits: [
      '45 điểm nghỉ dưỡng/năm — đổi đêm miễn phí tại Nobu Danang hoặc Nobu toàn cầu',
      'Miễn phí bữa sáng và dọn phòng trong thời gian lưu trú miễn phí',
      'Ưu tiên nâng hạng phòng tại check-in, early check-in / late check-out',
      'Đặt chỗ nhà hàng ưu tiên: 1 ngày (Danang) / 1 tuần (toàn cầu)',
      'Giảm 15% nhà hàng Nobu Danang + Nobu Saigon + hệ thống VCRE',
      'Giảm 15% spa tại Nobu Danang',
      'Giảm 10% khách sạn Nobu toàn cầu',
      'Ưu tiên tham dự sự kiện Nobu Hospitality',
    ],
    pointsExchange: {
      weekday: 1,
      weekend: 1.5,
      holiday: 2,
      specialHoliday: 3,
      note: 'Lễ đặc biệt: 30/4–1/5, Giáng Sinh, Tết Nguyên Đán',
    },
    ownerCosts: [
      'Bảo hiểm căn hộ (bắt buộc khi tham gia CTCT)',
      'FF&E fund: 4% doanh thu gộp',
      'Phí quản lý: 45,000đ/m² NFA/tháng (chưa VAT)',
      'Thuế TNCN: 5% | Thuế GTGT: 5% | Thuế môn bài: 300k–1tr/năm',
    ],
    usps: [
      'Nobu Residences ĐẦU TIÊN & DUY NHẤT tại Đông Nam Á',
      'Robert De Niro & Nobu Matsuhisa đứng sau thương hiệu',
      'Top 25 Most Innovative Luxury Brands – Robb Report',
      'Lô đất DI SẢN cuối cùng tại Mỹ Khê – không thể tái tạo',
      'Cao 186m – biểu tượng kiến trúc số 1 Đà Nẵng',
      'Cam kết 6%/năm · 40% gross revenue · 45 điểm miễn phí/năm',
      'Pháp lý 4 loại đầy đủ · MB Bank + BVBank hỗ trợ vay',
    ],
  },
  SSR: {
    id: 'SSR',
    name: 'Sun Symphony Residence Da Nang',
    developer: 'S-Realty (Sun Group / Sun Property)',
    operator: 'Sun Property Management',
    ecosystem: 'Sun Group (Sun World, Sun Hospitality, NCB)',
    location: 'Mặt tiền đường Trần Hưng Đạo, bên bờ Sông Hàn, Q.Sơn Trà, Đà Nẵng',
    beach: 'View trực diện Sông Hàn, ngắm pháo hoa quốc tế DIFF',
    floors: 30, basements: 3, height: '112m',
    totalResidences: 1373, hotelRooms: 0,
    openYear: 2026,
    guarantee: { pct: 0, years: 0, note: 'Sản phẩm mua để ở/tự khai thác' },
    revenueShare: { pct: 0, basis: '' },
    ctct: { mandatory: 'Không bắt buộc', optional: 'Tự do khai thác hoặc để ở' },
    hotline: '1800 6636',
    bankAccount: 'Tài khoản chủ đầu tư định danh NCB',
    legalDocs: ['Quy hoạch 1/500', 'Giấy phép xây dựng', 'Sở hữu lâu dài đối với người Việt'],
    supportBanks: ['NCB', 'VietinBank', 'MB Bank'],
    unitTypes: {
      STU: { name: 'Studio', area: '35–38m²', maxGuests: 2, rentalEst: 1500000, floors: '3-30' },
      '1PN': { name: '1 Phòng ngủ', area: '50–55m²', maxGuests: '2 người lớn', rentalEst: 2000000, floors: '3-30' },
      '2PN': { name: '2 Phòng ngủ', area: '68–80m²', maxGuests: '4 người lớn', rentalEst: 3500000, floors: '3-30' },
      '3PN': { name: '3 Phòng ngủ', area: '90–110m²', maxGuests: '6 người lớn', rentalEst: 5000000, floors: '3-30' },
      'DUP': { name: 'Duplex / Penthouse', area: '150m²+', maxGuests: '8 người lớn', rentalEst: 10000000, floors: '29-30' },
    },
    floorMap: {
      '1-2': 'Shophouse khối đế, Retail',
      '3': 'Tiện ích (Bể bơi resort, Gym, Spa)',
      '4-28': 'Căn hộ cao cấp (Symphony)',
      '29-30': 'Duplex / Penthouse / Sky Garden',
    },
    ownerBenefits: [
      'Miễn phí 3 năm dịch vụ quản lý căn hộ.',
      'Gói "Trải nghiệm đặc quyền Hệ sinh thái Sun Group" (chiết khấu 0.5 - 2% dựa trên hạng thành viên NCB).',
      'Chiết khấu 1% - 1.5% khi mua sản phẩm BĐS thứ 2 của Sun Group.',
    ],
    pointsExchange: {
      weekday: 0,
      weekend: 0,
      holiday: 0,
      specialHoliday: 0,
      note: 'Không có đổi đêm, tự khai thác 100%',
    },
    ownerCosts: [
      'Phí quản lý hàng tháng (miễn phí 3 năm đầu)',
      'Quỹ bảo trì 2% lúc nhận nhà',
    ],
    usps: [
      'Vị trí "tọa sơn hướng thủy" bên bờ sông Hàn, ngắm pháo hoa DIFF trực diện',
      'Chủ đầu tư Sun Group uy tín hàng đầu',
      'Tiện ích resort 5 sao nội khu',
      'Sở hữu lâu dài ở vị trí lõi trung tâm Đà Nẵng',
      'Hỗ trợ vay 70%, ân hạn nợ gốc và miễn lãi tối đa 30 tháng',
      'Chiết khấu khủng 9.5% nếu thanh toán nhanh 95%',
      'Chiết khấu 6% nếu không dùng gói hỗ trợ lãi suất',
    ],
  },
};

// ─── QUY TRÌNH NỘI BỘ ─────────────────────────────────────────────────────────
export const KNOWLEDGE_PROCESS = {
  sales: {
    dealStages: [
      { id: 'lead', name: 'Lead mới', desc: 'Khách vừa về, chưa phân loại' },
      { id: 'contact', name: 'Đã liên hệ', desc: 'Đã gọi/nhắn, chưa có nhu cầu rõ' },
      { id: 'qualified', name: 'Đã qualify', desc: 'Xác nhận ngân sách + mục tiêu' },
      { id: 'showing', name: 'Đặt lịch xem', desc: 'Đã lên lịch xem căn hoặc showroom' },
      { id: 'negotiating', name: 'Đang thương lượng', desc: 'Đàm phán giá, thanh toán' },
      { id: 'booked', name: 'Đặt cọc', desc: 'Đã nộp booking/giữ chỗ' },
      { id: 'signed', name: 'Ký HĐ', desc: 'Hợp đồng mua bán đã ký' },
      { id: 'won', name: 'Chốt thành công', desc: 'Hoàn tất giao dịch' },
    ],
    followUpTemplates: {
      cold: 'Anh/chị [Tên] ơi, em là [Tên sale] từ ProHouze. Hôm trước anh/chị có tìm hiểu về dự án [Dự án]. Anh/chị có tiện chia sẻ thêm nhu cầu của mình để em hỗ trợ tốt hơn không ạ?',
      warm: 'Anh/chị [Tên] ơi, em [Tên sale]. Dự án [Dự án] hôm nay vừa có thông tin hay về [Chính sách mới]. Em muốn chia sẻ với anh/chị ngay vì biết mình đang quan tâm. Anh/chị có 2 phút không ạ?',
      hot: 'Anh/chị [Tên] ơi, em [Tên sale]. Căn [Mã căn] anh/chị đang hold còn hiệu lực đến [Ngày]. Em cần confirm để giữ ưu tiên cho anh/chị. Anh/chị có thể xác nhận hôm nay không ạ?',
    },
    objectionHandling: {
      'giá cao': 'Giá tỷ lệ với giá trị: thương hiệu Nobu 5 sao quốc tế, vận hành bởi Robert De Niro, vị trí di sản duy nhất. ROI 6% cam kết + 40% gross sau đó. Không có dự án thứ 2 tại vị trí này.',
      'condotel 50 năm': '5 lý do vẫn đáng: (1) Đà Nẵng tăng trưởng du lịch bền vững (2) Vị trí di sản (3) Nobu vận hành đảm bảo công suất (4) Branded residences luôn tăng giá trị (5) Thời hạn gia hạn theo pháp luật.',
      'vcre mới': 'VCRE/Phoenix Holdings: cùng nhóm BVBank, Vietcap Securities, 7-Eleven, McDonald\'s. Pháp lý 4 loại đầy đủ. Tiến độ xây dựng tháng 4/2025 đã cập nhật.',
      'không tự cho thuê': 'Bù lại: 40% gross revenue + 45 đêm miễn phí/năm + kiểm toán độc lập minh bạch. Điều này bảo đảm chất lượng 5 sao, tăng tỷ lệ lấp đầy, tăng doanh thu pool.',
      'phí quản lý': '45,000đ/m²/tháng đã tính trong ROI 6% cam kết. Hoàn toàn hợp lý so với vận hành 5 sao Nobu.',
    },
  },
  hr: {
    onboarding: ['Ký HĐ lao động', 'Thiết lập tài khoản hệ thống', 'Đào tạo sản phẩm 3 ngày', 'Shadow với senior 1 tuần', 'KPI tháng đầu: 2 lead qualified'],
    kpiSale: { leads: 10, qualified: 4, bookings: 1, closings: 0.5 },
  },
};

// ─── XÂY DỰNG CONTEXT STRING CHO AI ──────────────────────────────────────────
export function buildProjectContext(projectId = 'NBU') {
  const p = KNOWLEDGE_PROJECTS[projectId];
  if (!p) return '';

  return `
DỰ ÁN ĐANG BÁN: ${p.name}
Chủ đầu tư: ${p.developer}
Vận hành: ${p.operator}
Vị trí: ${p.location} (${p.beach})
Quy mô: ${p.floors} tầng, cao ${p.height}, ${p.totalResidences} căn nghỉ dưỡng + ${p.hotelRooms} phòng KS
Khai trương: ${p.openYear}
CAM KẾT: ${p.guarantee.pct}%/năm trong ${p.guarantee.years} năm đầu → ${p.revenueShare.pct}% gross revenue
CTCT: ${p.ctct.mandatory} | ${p.ctct.optional}
LOẠI CĂN: Studio(36-40m²/3.8tr/đêm) | 1PN(52-58m²/5.5tr) | 2PN(74-82m²/9.5tr) | 3DK(110-120m²/12tr) | Sky Villa(145m²+/30tr) | Penthouse(280m²+)
PHÁP LÝ: ${p.legalDocs.join(', ')}
NH HỖ TRỢ: ${p.supportBanks.join(', ')}
HOTLINE: ${p.hotline} | TK: ${p.bankAccount}
USP: ${p.usps.slice(0, 4).join(' | ')}
`.trim();
}

// ─── SMART LOCAL AI ENGINE ────────────────────────────────────────────────────
// Được dùng khi không có kết nối API hoặc để phản hồi nhanh
export function localAIAnswer(question, role = 'sale', projectId = 'NBU') {
  const q = question.toLowerCase();
  const p = KNOWLEDGE_PROJECTS[projectId];
  const proc = KNOWLEDGE_PROCESS;

  // ── Greeting / chào hỏi ──
  if (/^(xin chào|chào|hi|hello|alo|helo)/.test(q)) {
    const roleGreets = {
      sale: `Chào anh/chị! 👋 Tôi là trợ lý AI ProHouze. Tôi biết toàn bộ thông tin về **${p?.name || 'các dự án đang bán'}**. Hỏi tôi bất cứ điều gì nhé!`,
      manager: `Xin chào! 📊 Tôi là trợ lý AI ProHouze. Tôi có thể giúp anh/chị phân tích pipeline, review hiệu suất team, và gợi ý hành động ưu tiên.`,
      admin: `Chào admin! ⚙️ Tôi là trợ lý AI hệ thống. Tôi hỗ trợ quản trị dữ liệu, phân quyền, và báo cáo vận hành.`,
    };
    return roleGreets[role] || roleGreets.sale;
  }

  // ── Cam kết thuê / ROI ──
  if (/cam kết|roi|lợi nhuận|thuê|6%|sinh lời/.test(q)) {
    return `**${p.name}** cam kết:\n\n✅ **${p.guarantee.pct}%/năm** trong ${p.guarantee.years} năm đầu (tính trên giá trị HĐ, chưa VAT)\n✅ Sau đó nhận **${p.revenueShare.pct}% gross revenue** theo pool cùng loại căn\n\n*Gross revenue = Doanh thu phòng – VAT – HH đại lý – Phí thẻ NH*`;
  }

  // ── CTCT / Chương trình cho thuê ──
  if (/ctct|chương trình cho thuê|bắt buộc|ký kết|25 năm|kỳ|tầng/.test(q)) {
    return `**Chương trình Cho Thuê (CTCT) NOBU:**\n\n📋 Tổng thời hạn: **25 năm** / 4 kỳ:\n• Kỳ 1: **10 năm** (Tầng 19-33: bắt buộc | Tầng 34-41: tùy chọn)\n• Kỳ 2,3,4: 5 năm mỗi kỳ (tự động gia hạn)\n\n⚠️ **Bắt buộc:** Tầng 19-33, kỳ 1\n✅ **Tùy chọn:** Tầng 34-41, tối thiểu 5 năm/kỳ\n\n📅 Báo trước 180 ngày nếu không gia hạn`;
  }

  // ── Giá thuê kỳ vọng ──
  if (/giá thuê|kỳ vọng|3\.8|5\.5|9\.5|12|30 triệu|đêm/.test(q)) {
    return `**Giá thuê kỳ vọng năm 2027:**\n\n| Loại căn | Giá/đêm |\n|----------|----------|\n| Studio | **3.8 triệu** |\n| 1 Phòng ngủ | **5.5 triệu** |\n| 2 Phòng ngủ | **9.5 triệu** |\n| 3PN Dual Key | **12 triệu** |\n| 3PN Sky Villa + Pool | **30 triệu** |\n\n*Giá điều chỉnh theo mùa và thị trường.*`;
  }

  // ── Điểm nghỉ dưỡng ──
  if (/điểm|45 điểm|đổi đêm|miễn phí|lưu trú/.test(q)) {
    return `**45 điểm nghỉ dưỡng/năm:**\n\n• 1 điểm = 1 đêm ngày thường\n• 1.5 điểm = 1 đêm cuối tuần\n• 2 điểm = 1 đêm Lễ thường\n• 3 điểm = 1 đêm Lễ đặc biệt (30/4-1/5, Giáng Sinh, Tết)\n\n🎁 **Ưu đãi chủ sở hữu kèm theo:**\n• Giảm 15% nhà hàng Nobu\n• Giảm 10% khách sạn Nobu toàn cầu\n• Ưu tiên đặt chỗ trước 1 tuần`;
  }

  // ── Pháp lý ──
  if (/pháp lý|giấy tờ|gpxd|gcn|qsdđ|đăng ký đầu tư|ms065/.test(q)) {
    return `**Pháp lý NOBU Danang (đầy đủ 4 loại):**\n\n✅ GCN Quyền sử dụng đất\n✅ GCN Đăng ký doanh nghiệp\n✅ Giấy phép xây dựng + Phụ lục GPXD\n✅ GCN Đăng ký đầu tư **MS0650824421**\n\n🏦 Ngân hàng hỗ trợ vay: **MB Bank & BVBank**\n\n💳 Tài khoản CĐT: **617 7979 686868 – BVBank**\n\n⚠️ *Không chuyển tiền cho cá nhân/tổ chức nào khác.*`;
  }

  // ── Vị trí / địa chỉ ──
  if (/vị trí|địa chỉ|đường|mỹ khê|sơn trà|đà nẵng|bãi biển/.test(q)) {
    return `**Vị trí NOBU Danang:**\n\n📍 Lô A2, góc **Võ Nguyên Giáp – Võ Văn Kiệt**, P.Phước Mỹ, Q.Sơn Trà\n\n🏖️ Trực diện **biển Mỹ Khê** – một trong những bãi biển đẹp nhất ĐNA\n🌆 View: Biển Mỹ Khê | Sông Hàn | Cầu Rồng | Pháo hoa | Bán đảo Sơn Trà\n\n⭐ **Lô đất di sản cuối cùng** tại vị trí đắc địa nhất Đà Nẵng – không thể tái tạo.`;
  }

  // ── Đơn vị vận hành ──
  if (/nobu|robert de niro|matsuhisa|vận hành|hospitality|brand/.test(q)) {
    return `**Nobu Hospitality:**\n\n👥 Đồng sáng lập: **Robert De Niro + Nobu Matsuhisa + Meir Teper**\n🏆 Top 25 Most Innovative Luxury Brands – Robb Report\n🌍 Hiện diện tại 5 châu lục\n\n💡 **Lợi thế độc đáo:** ~10-15% khách nhà hàng Nobu chọn lưu trú tại Nobu Hotel → tăng công suất tự nhiên\n\n🎌 Bản sắc Nhật-Mỹ độc đáo, thiết kế hòa quyện văn hóa bản địa.`;
  }

  // ── Tiện ích ──
  if (/tiện ích|facilities|hồ bơi|spa|gym|nhà hàng|ballroom/.test(q)) {
    return `**Tiện ích NOBU Danang:**\n\n🏊 Heated Pool (Katamochi)\n🍽️ Nobu Restaurant (Tầng 42)\n🍜 Taste of Asia Restaurant (Tầng 6)\n🏋️ Sky Gym\n💆 Wellness & Retreat Spa (Tầng 3-4)\n🎉 Ballroom + 3 Meeting Rooms (Tầng 5)\n🍹 Pool Bar + Tsukimidai Sky Bar (Tầng 43)\n👶 Kids Club\n🛍️ Retail Area (Tầng 1)`;
  }

  // ── Phí chủ sở hữu ──
  if (/phí|chi phí|quản lý|ff.e|bảo hiểm|45.000/.test(q)) {
    return `**Chi phí chủ sở hữu khi tham gia CTCT:**\n\n• Bảo hiểm căn hộ\n• FF&E fund: **4% gross revenue**\n• Phí quản lý: **45,000đ/m² NFA/tháng** (chưa VAT), điều chỉnh theo vận hành\n• Thuế TNCN: **5%**\n• Thuế GTGT: **5%**\n• Thuế môn bài: **300k–1tr/năm**\n\n💡 *Các chi phí này đã được tính trong ROI 6% cam kết 2 năm đầu.*`;
  }

  // ── Follow-up script ──
  if (/soạn|viết|follow.up|email|tin nhắn|sms|khách/.test(q)) {
    const isHot = q.includes('hot') || q.includes('nóng');
    const isWarm = q.includes('warm') || q.includes('ấm');
    const template = isHot ? proc.sales.followUpTemplates.hot
      : isWarm ? proc.sales.followUpTemplates.warm
      : proc.sales.followUpTemplates.cold;
    return `**Mẫu follow-up ${isHot ? 'NÓNG 🔴' : isWarm ? 'ẤM 🟡' : 'LẠNH 🔵'}:**\n\n> ${template}\n\n*Thay [Tên], [Dự án], [Chính sách mới], [Mã căn], [Ngày] theo thực tế.*`;
  }

  // ── Xử lý phản đối ──
  if (/phản đối|objection|từ chối|do dự|băn khoăn/.test(q)) {
    return `**Xử lý phản đối – NOBU Danang:**\n\n1. 🏠 **Condotel 50 năm:** "5 lý do vẫn đáng đầu tư: Đà Nẵng du lịch bền vững · Vị trí di sản · Nobu 5 sao · Branded tăng giá trị · Gia hạn theo PL"\n\n2. 🏢 **VCRE mới:** "Phoenix Holdings: BVBank, Vietcap, 7-Eleven, McDonald's. Pháp lý 4 loại đầy đủ."\n\n3. 🔑 **Không tự cho thuê:** "Bù lại: 40% gross + 45 đêm miễn phí + báo cáo kiểm toán minh bạch"\n\n4. 💰 **Phí quản lý:** "45k/m²/tháng — đã tính trong ROI 6% cam kết, hợp lý cho chuẩn 5 sao Nobu"`;
  }

  // ── So sánh căn ──
  if (/so sánh|khác nhau|studio|1pn|2pn|3dk|sky villa|penthouse/.test(q)) {
    return `**So sánh loại căn NOBU:**\n\n| Loại | Diện tích | Đêm kỳ vọng | CTCT |\n|------|-----------|-------------|------|\n| Studio | 36-40m² | 3.8 tr | Bắt buộc (T19-33) |\n| 1PN | 52-58m² | 5.5 tr | Bắt buộc |\n| 2PN | 74-82m² | 9.5 tr | Bắt buộc |\n| 3DK | 110-120m² | 12 tr | Bắt buộc T19-33 |\n| Sky Villa | 145m²+ | 30 tr | Tùy chọn |\n| Penthouse | 280m²+ | Liên hệ | Tùy chọn |`;
  }

  // ── Hỏi về KPI sale ──
  if (/kpi|doanh số|chỉ tiêu|mục tiêu|tháng/.test(q) && role === 'sale') {
    return `**KPI chuẩn nhân viên kinh doanh (tháng):**\n\n📞 Lead mới: **10 lead**\n✅ Qualified: **4 lead**\n📅 Booking: **1 đặt cọc**\n💰 Chốt: **0.5 giao dịch/tháng** (= 1 deal / 2 tháng)\n\n💡 *Hỏi tôi "soạn kịch bản tư vấn khách [tình huống]" để tôi hỗ trợ cụ thể hơn.*`;
  }

  // ── Default ──
  return `Câu hỏi hay! 🤔 Tôi đang học thêm về chủ đề này.\n\nBạn có thể hỏi tôi về:\n• 📋 **Dự án ${p?.name || 'NOBU / Sun Symphony'}** — chính sách, giá, pháp lý, tiện ích\n• 💬 **Soạn script** — follow-up, tư vấn, xử lý phản đối\n• 📊 **So sánh loại căn** — Studio, 1PN, 2PN, 3PN\n• ❓ **Q&A khách hàng** — câu hỏi thường gặp và cách trả lời`;
}
