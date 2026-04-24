import { useContext } from 'react';

// Safe hook wrappers that provide fallbacks when context is not available

// Theme fallback
const defaultTheme = { isDark: false, toggleTheme: () => {}, setIsDark: () => {} };

export const useSafeTheme = () => {
  try {
    // Dynamic import to avoid issues
    const { useTheme } = require('@/contexts/ThemeContext');
    return useTheme();
  } catch (e) {
    return defaultTheme;
  }
};

// Language fallback with Vietnamese translations
const defaultTranslations = {
  // Navigation
  'nav.home': 'Trang chủ',
  'nav.about': 'Về chúng tôi',
  'nav.projects': 'Dự án',
  'nav.services': 'Dịch vụ',
  'nav.news': 'Tin tức',
  'nav.careers': 'Tuyển dụng',
  'nav.contact': 'Liên hệ',
  'nav.login': 'Đăng nhập',
  'nav.contactNow': 'Liên hệ ngay',
  // Hero
  'hero.badge': 'Công Ty Phân Phối BĐS Tốt Nhất Đông Nam Á 2025',
  'hero.title1': 'NHÀ PHÁT TRIỂN VÀ',
  'hero.title2': 'PHÂN PHỐI BẤT ĐỘNG SẢN',
  'hero.title3': 'CHUYÊN NGHIỆP',
  'hero.subtitle': 'Tự hào là đơn vị hàng đầu trong lĩnh vực phát triển, môi giới và phân phối bất động sản tại Việt Nam với tôn chỉ hoạt động',
  'hero.slogan': '"Trọn chữ Tín - Vẹn niềm Tin"',
  'hero.exploreProjects': 'Khám phá dự án',
  'hero.contactConsult': 'Liên hệ tư vấn',
  // Stats
  'stats.yearsExp': 'Năm kinh nghiệm',
  'stats.projects': 'Dự án phân phối',
  'stats.customers': 'Khách hàng',
  'stats.branches': 'Chi nhánh',
  // About
  'about.title': 'VỀ CHÚNG TÔI',
  'about.vision': 'TẦM NHÌN CỦA PROHOUZING',
  'about.visionDesc': 'Luôn đặt mục tiêu trở thành Nhà phát triển & phân phối bất động sản hàng đầu Việt Nam với tôn chỉ hoạt động "Trọn chữ Tín - Vẹn niềm Tin"',
  'about.trust': 'Trọn chữ Tín',
  'about.trustDesc': 'Cam kết uy tín trong mọi giao dịch',
  'about.faith': 'Vẹn niềm Tin',
  'about.faithDesc': 'Xây dựng niềm tin bền vững',
  'about.learnMore': 'Tìm hiểu thêm',
  // Footer
  'footer.tagline': 'Nền tảng Công nghệ Bất động sản Thông minh & Đáng Tin cậy. Trọn chữ Tín - Vẹn niềm Tin.',
  'footer.services': 'Dịch vụ',
  'footer.brokerage': 'Môi giới BĐS',
  'footer.investment': 'Tư vấn đầu tư',
  'footer.valuation': 'Định giá BĐS',
  'footer.assetMgmt': 'Quản lý tài sản',
  'footer.legalService': 'Pháp lý BĐS',
  'footer.links': 'Liên kết',
  'footer.contactTitle': 'Liên hệ',
  'footer.terms': 'Điều khoản sử dụng',
  'footer.privacy': 'Chính sách bảo mật',
  'footer.rights': 'All rights reserved.',
};

const defaultLanguage = {
  language: 'vi',
  setLanguage: () => {},
  toggleLanguage: () => {},
  t: (key) => defaultTranslations[key] || key
};

export const useSafeLanguage = () => {
  try {
    const { useLanguage } = require('@/contexts/LanguageContext');
    return useLanguage();
  } catch (e) {
    return defaultLanguage;
  }
};
