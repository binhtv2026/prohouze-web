import React, { createContext, useContext, useState, useEffect } from 'react';

// Translations
const translations = {
  vi: {
    nav: { home: 'Trang chủ', about: 'Về chúng tôi', projects: 'Dự án', services: 'Dịch vụ', news: 'Tin tức', careers: 'Tuyển dụng', contact: 'Liên hệ', login: 'Đăng nhập', contactNow: 'Liên hệ ngay' },
    hero: { badge: 'Công Ty Phân Phối BĐS Tốt Nhất Đông Nam Á 2025', title1: 'NHÀ PHÁT TRIỂN VÀ', title2: 'PHÂN PHỐI BẤT ĐỘNG SẢN', title3: 'CHUYÊN NGHIỆP', subtitle: 'Tự hào là đơn vị hàng đầu trong lĩnh vực phát triển, môi giới và phân phối bất động sản tại Việt Nam với tôn chỉ hoạt động', slogan: '"Trọn chữ Tín - Vẹn niềm Tin"', exploreProjects: 'Khám phá dự án', contactConsult: 'Liên hệ tư vấn' },
    stats: { yearsExp: 'Năm kinh nghiệm', projects: 'Dự án phân phối', customers: 'Khách hàng', branches: 'Chi nhánh' },
    about: { title: 'VỀ CHÚNG TÔI', vision: 'TẦM NHÌN CỦA PROHOUZING', visionDesc: 'Luôn đặt mục tiêu trở thành Nhà phát triển & phân phối bất động sản hàng đầu Việt Nam với tôn chỉ hoạt động "Trọn chữ Tín - Vẹn niềm Tin"', trust: 'Trọn chữ Tín', trustDesc: 'Cam kết uy tín trong mọi giao dịch', faith: 'Vẹn niềm Tin', faithDesc: 'Xây dựng niềm tin bền vững', learnMore: 'Tìm hiểu thêm' },
    footer: { tagline: 'Nền tảng Công nghệ Bất động sản Thông minh & Đáng Tin cậy. Trọn chữ Tín - Vẹn niềm Tin.', services: 'Dịch vụ', brokerage: 'Môi giới BĐS', investment: 'Tư vấn đầu tư', valuation: 'Định giá BĐS', assetMgmt: 'Quản lý tài sản', legalService: 'Pháp lý BĐS', links: 'Liên kết', contactTitle: 'Liên hệ', terms: 'Điều khoản sử dụng', privacy: 'Chính sách bảo mật', rights: 'All rights reserved.' },
  },
  en: {
    nav: { home: 'Home', about: 'About Us', projects: 'Projects', services: 'Services', news: 'News', careers: 'Careers', contact: 'Contact', login: 'Login', contactNow: 'Contact Now' },
    hero: { badge: 'Best Real Estate Distributor in Southeast Asia 2025', title1: 'DEVELOPER AND', title2: 'REAL ESTATE', title3: 'DISTRIBUTOR', subtitle: 'Proudly a leading company in real estate development, brokerage and distribution in Vietnam with the motto', slogan: '"Trust & Reliability"', exploreProjects: 'Explore Projects', contactConsult: 'Get Consultation' },
    stats: { yearsExp: 'Years Experience', projects: 'Projects Distributed', customers: 'Customers', branches: 'Branches' },
    about: { title: 'ABOUT US', vision: 'PROHOUZING VISION', visionDesc: 'Always aiming to become the leading real estate developer & distributor in Vietnam with the motto "Trust & Reliability"', trust: 'Trustworthy', trustDesc: 'Commitment to credibility in every transaction', faith: 'Reliable', faithDesc: 'Building lasting trust', learnMore: 'Learn More' },
    footer: { tagline: 'Smart & Reliable Real Estate Technology Platform. Trust & Reliability.', services: 'Services', brokerage: 'Real Estate Brokerage', investment: 'Investment Consulting', valuation: 'Property Valuation', assetMgmt: 'Asset Management', legalService: 'Legal Services', links: 'Links', contactTitle: 'Contact', terms: 'Terms of Use', privacy: 'Privacy Policy', rights: 'All rights reserved.' },
  },
};

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('prohouzing-lang') || 'vi';
    }
    return 'vi';
  });

  useEffect(() => {
    localStorage.setItem('prohouzing-lang', language);
    document.documentElement.lang = language;
  }, [language]);

  const t = (key) => {
    const keys = key.split('.');
    let value = translations[language];
    for (const k of keys) {
      value = value?.[k];
    }
    return value || key;
  };

  const toggleLanguage = () => {
    setLanguage(lang => lang === 'vi' ? 'en' : 'vi');
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  // Return default values if context is null
  if (!context) {
    const defaultT = (key) => {
      const keys = key.split('.');
      let value = translations['vi'];
      for (const k of keys) {
        value = value?.[k];
      }
      return value || key;
    };
    return { language: 'vi', setLanguage: () => {}, toggleLanguage: () => {}, t: defaultT };
  }
  return context;
};

export { translations };
