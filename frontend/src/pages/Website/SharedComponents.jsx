import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { MapPin, Phone, Mail, ArrowRight, Menu, X, Moon, Sun, Globe } from 'lucide-react';
import { FaFacebook, FaLinkedin, FaYoutube, FaInstagram } from 'react-icons/fa';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';

export const LOGO_HORIZONTAL_LIGHT = '/logo512.png';
export const LOGO_HORIZONTAL_DARK = '/logo512.png';
export const LOGO_VERTICAL = '/logo512.png';

// Logo style for removing background and adjusting brightness
export const LOGO_STYLE = "mix-blend-screen brightness-125 contrast-110";

export const WebsiteHeader = ({ transparent = false }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();
  const { language, toggleLanguage, t } = useLanguage();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Simplified navigation - only essential pages
  const navLinks = [
    { name: 'Trang chủ', href: '/home' },
    { name: 'Dự án', href: '/projects' },
    { name: 'Cẩm nang', href: '/cam-nang', highlight: true },
    { name: 'Về chúng tôi', href: '/about' },
    { name: 'Tuyển dụng', href: '/careers' },
    { name: 'Liên hệ', href: '/contact' },
  ];

  const showTransparent = transparent && !isScrolled;

  return (
    <header data-testid="website-header" className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
      showTransparent ? 'bg-transparent' : 'bg-white/95 backdrop-blur-xl shadow-sm border-b border-slate-200'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo - text-based for clean look on dark background */}
          <Link to="/home" className="flex items-center gap-2" data-testid="header-logo">
            <img 
              src="/logo.png" 
              alt="ProHouze Logo" 
              className="h-14 lg:h-16 w-auto object-contain"
              onError={(e) => {
                e.target.style.display = 'none';
                if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
              }}
            />
            <div className="flex items-center gap-2" style={{ display: 'none' }}>
              <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl bg-gradient-to-br from-[#316585] to-[#4a8fb5] flex items-center justify-center shadow-sm">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="w-6 h-6 lg:w-7 lg:h-7">
                  <path d="M3 21V8l9-6 9 6v13H3z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M9 21V12h6v9" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span className="text-xl lg:text-2xl font-bold tracking-tight text-slate-800">
                Pro<span className="text-[#316585]">Houze</span>
              </span>
            </div>
          </Link>

          {/* Desktop Navigation - Simplified */}
          <nav className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link 
                key={link.href} 
                to={link.href} 
                className={`text-sm font-semibold transition-all duration-300 relative group flex items-center gap-1.5 ${
                  link.highlight 
                    ? 'text-[#316585]' 
                    : 'text-slate-700 hover:text-[#316585]'
                }`}
              >
                {link.name}
                {link.highlight && (
                  <span className="inline-flex items-center text-[9px] font-bold bg-[#316585] text-white px-1.5 py-0.5 rounded-full leading-none">MỚI</span>
                )}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#316585] transition-all duration-300 group-hover:w-full" />
              </Link>
            ))}
          </nav>

          {/* Right Actions */}
          <div className="hidden lg:flex items-center gap-3">
            <div className="flex items-center border-r border-slate-200 pr-3 mr-1">
              <button 
                onClick={toggleLanguage}
                title="Thay đổi ngôn ngữ / Change language"
                className="flex items-center gap-1.5 px-3 h-10 rounded-full text-slate-600 hover:bg-slate-100 hover:text-[#316585] transition-colors"
              >
                <Globe className="w-4 h-4" />
                <span className="text-sm font-bold uppercase">{language || 'vi'}</span>
              </button>
            </div>
            <Button 
              variant="ghost" 
              data-testid="header-login-btn" 
              className="text-slate-700 hover:bg-slate-100/50 hover:text-[#316585] font-semibold"
              onClick={() => navigate('/login')}
            >
              Đăng nhập
            </Button>
            <Button 
              data-testid="header-contact-btn" 
              className="bg-[#316585] hover:bg-[#28506b] text-white rounded-full px-6 font-semibold shadow-sm shadow-[#316585]/20"
              onClick={() => navigate('/contact')}
            >
              Liên hệ ngay
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex lg:hidden items-center gap-2">
            <button
              className="p-2 text-slate-800"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? 'Đóng menu' : 'Mở menu'}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-menu"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" aria-hidden="true" /> : <Menu className="h-6 w-6" aria-hidden="true" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <div id="mobile-menu" className={`lg:hidden transition-all duration-300 ${mobileMenuOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
        <div className="mx-4 rounded-2xl p-4 mt-2 bg-[#162d50]/95 backdrop-blur-xl border border-white/10">
          {navLinks.map((link) => (
            <Link 
              key={link.href} 
              to={link.href} 
              className="block py-3 px-4 rounded-lg text-white/80 hover:text-white hover:bg-white/5 font-medium" 
              onClick={() => setMobileMenuOpen(false)}
            >
              {link.name}
            </Link>
          ))}
          <div className="border-t border-white/10 mt-4 pt-4 space-y-2">
            <button 
              onClick={toggleLanguage} 
              className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-white/5 text-white"
            >
              <Globe className="h-4 w-4" />
              {language === 'vi' ? 'English' : 'Tiếng Việt'}
            </button>
            <Button variant="outline" className="w-full border-white/20 text-white hover:bg-white/10" onClick={() => navigate('/login')}>
              Đăng nhập CRM
            </Button>
            <Button className="w-full bg-[#316585] hover:bg-[#3d7a9e]" onClick={() => navigate('/contact')}>
              Liên hệ ngay
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export const WebsiteFooter = () => {
  const { isDark } = useTheme();
  const currentYear = new Date().getFullYear();

  return (
    <footer data-testid="website-footer" className="bg-[#0d1f35] text-white pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-6">
              <img 
                src="/logo.png" 
                alt="ProHouze Logo" 
                className="h-16 w-auto object-contain brightness-0 invert"
                onError={(e) => {
                  e.target.onerror = (e2) => {
                    e2.target.style.display = 'none';
                    if (e2.target.nextSibling) e2.target.nextSibling.style.display = 'flex';
                  };
                  // No specific white logo handled for now, pure invert of main logo works nicely
                }}
              />
              <div className="flex items-center gap-2" style={{ display: 'none' }}>
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#316585] to-[#4a8fb5] flex items-center justify-center">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="w-7 h-7">
                    <path d="M3 21V8l9-6 9 6v13H3z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M9 21V12h6v9" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <span className="text-2xl font-bold text-white tracking-tight">
                  Pro<span className="text-[#4a9fc5]">Houze</span>
                </span>
              </div>
            </div>
            <p className="text-white/60 mb-6 max-w-md leading-relaxed">
              ProHouze - Nền tảng môi giới bất động sản sơ cấp hàng đầu Việt Nam. 
              Kết nối bạn với những dự án đẳng cấp từ các chủ đầu tư uy tín.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              {/* App Store Button */}
              <a href="#" className="flex items-center justify-center sm:justify-start gap-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl px-5 py-2.5 transition-all w-full sm:w-auto">
                <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.15 2.95.92 3.78 2.04-3.11 1.88-2.6 6.36.43 7.64-.69 1.4-1.74 2.82-2.86 3.33zm-4.75-13.4c-.16-2.58 2.1-4.73 4.54-4.88.35 2.76-2.3 4.96-4.54 4.88z"/>
                </svg>
                <div className="text-left">
                  <div className="text-[10px] text-white/70 leading-none mb-0.5">Download on the</div>
                  <div className="text-base font-bold text-white leading-none">App Store</div>
                </div>
              </a>
              {/* Google Play Button */}
              <a href="#" className="flex items-center justify-center sm:justify-start gap-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl px-5 py-2.5 transition-all w-full sm:w-auto">
                <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3.23 21.05c-.13-.19-.23-.46-.23-.79V3.74c0-.33.1-.6.23-.79L13.8 13.5l-10.57 7.55zM14.54 12.76l2.12-2.12L4.66 3.69c.33-.14.73-.13 1.18.06l14.15 8.16c1.07.61 1.07 1.62 0 2.23l-14.15 8.16c-.45.19-.85.2-1.18.06l11.97-6.95c.03-.02.06-.04.09-.07z"/>
                </svg>
                <div className="text-left">
                  <div className="text-[10px] text-white/70 leading-none mb-0.5">GET IT ON</div>
                  <div className="text-base font-bold text-white leading-none">Google Play</div>
                </div>
              </a>
            </div>
            
            <div className="flex gap-4">
              {[
                { Icon: FaFacebook, label: 'Facebook', href: 'https://facebook.com/prohouze' },
                { Icon: FaLinkedin, label: 'LinkedIn', href: 'https://linkedin.com/company/prohouze' },
                { Icon: FaYoutube, label: 'YouTube', href: 'https://youtube.com/@prohouze' },
                { Icon: FaInstagram, label: 'Instagram', href: 'https://instagram.com/prohouze' },
              ].map(({ Icon, label, href }) => (
                <a 
                  key={label}
                  href={href}
                  aria-label={label}
                  rel="noopener noreferrer"
                  target="_blank"
                  className="w-10 h-10 rounded-full bg-white/5 hover:bg-[#316585] flex items-center justify-center transition-colors"
                >
                  <Icon className="w-4 h-4" aria-hidden="true" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-bold mb-6 text-white">Liên kết</h3>
            <ul className="space-y-3">
              {[
                { name: 'Trang chủ', href: '/home' },
                { name: 'Dự án', href: '/projects' },
                { name: 'Cẩm nang BĐS', href: '/cam-nang' },
                { name: 'Về chúng tôi', href: '/about' },
                { name: 'Tuyển dụng', href: '/careers' },
                { name: 'Liên hệ', href: '/contact' },
              ].map(link => (
                <li key={link.name}>
                  <Link to={link.href} className="text-white/60 hover:text-[#316585] transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-bold mb-6 text-white">Liên hệ</h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-[#316585] flex-shrink-0 mt-0.5" />
                <span className="text-white/60">123 Nguyễn Huệ, Q.1, TP.HCM</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-[#316585]" />
                <a href="tel:19001234" className="text-white/60 hover:text-[#316585]">1900 1234</a>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-[#316585]" />
                <a href="mailto:contact@prohouze.com" className="text-white/60 hover:text-[#316585]">contact@prohouze.com</a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-white/40 text-sm">© {currentYear} ProHouze. All rights reserved.</p>
          <div className="flex gap-6 text-sm text-white/40">
            <Link to="/terms" className="hover:text-white transition-colors">Điều khoản</Link>
            <Link to="/privacy" className="hover:text-white transition-colors">Bảo mật</Link>
          </div>
        </div>

        {/* Beta Notice */}
        <div className="mt-6 text-center">
          <span className="inline-flex items-center gap-2 text-xs text-white/30 border border-white/10 rounded-full px-4 py-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400/60 animate-pulse" />
            Website đang trong giai đoạn ra mắt thử nghiệm — một số tính năng có thể chưa hoàn chỉnh
          </span>
        </div>
      </div>
    </footer>
  );
};
