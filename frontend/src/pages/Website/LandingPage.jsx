import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Building2, MapPin, Phone, Mail, ChevronRight, Award, Users, TrendingUp,
  Star, ArrowRight, CheckCircle2, Briefcase, Home, Zap, Send, Play,
  Sparkles, Globe, Shield, Clock, Heart, Target, ArrowUpRight, Eye,
  GraduationCap, DollarSign, Headphones, Rocket, Quote, ChevronLeft, User, Search
} from 'lucide-react';
import { toast } from 'sonner';
import { WebsiteHeader, WebsiteFooter } from './SharedComponents';
import { useTheme } from '@/contexts/ThemeContext';
import AIChatWidget from '@/components/AIChatWidget';

const API_URL = process.env.REACT_APP_BACKEND_URL;

// ===================== ANIMATED COUNTER =====================
const AnimatedCounter = ({ target, suffix = '', prefix = '' }) => {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsVisible(true); },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return;
    let start = 0;
    const increment = target / 60;
    const timer = setInterval(() => {
      start += increment;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [isVisible, target]);

  return <span ref={ref}>{prefix}{count.toLocaleString()}{suffix}</span>;
};

// ===================== TRUST STATS BAR =====================
const TrustStatsBar = () => (
  <section className="relative z-10 bg-white border-y border-slate-200 shadow-sm">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-0 md:divide-x divide-slate-200">
        {[
          { value: 50, suffix: '+', label: 'Dự án phân phối', color: 'from-[#316585] to-[#4a9fc5]' },
          { value: 500, suffix: '+', label: 'Chuyên viên tư vấn', color: 'from-[#316585] to-[#4a9fc5]' },
          { value: 10, suffix: 'K+', label: 'Giao dịch thành công', color: 'from-[#316585] to-[#4a9fc5]' },
          { value: 5, suffix: ' tỷ+', label: 'Hoa hồng đã chi trả', color: 'from-[#316585] to-[#4a9fc5]' },
        ].map((stat, i) => (
          <div key={i} className="text-center px-6 py-2 transition-transform hover:scale-105">
            <p className={`text-3xl md:text-4xl font-extrabold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent tracking-tight`}>
              <AnimatedCounter target={stat.value} suffix={stat.suffix} />
            </p>
            <p className="text-slate-500 font-medium text-xs mt-2 uppercase tracking-wider">{stat.label}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

// ===================== HERO SECTION - PRODUCTION READY =====================
const HeroSection = () => {
  const navigate = useNavigate();
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const heroParticles = useMemo(
    () =>
      Array.from({ length: 18 }, (_, index) => ({
        id: index,
        left: `${6 + ((index * 17) % 88)}%`,
        top: `${8 + ((index * 29) % 76)}%`,
        size: `${index % 3 === 0 ? 6 : 4}px`,
        delay: `${(index % 6) * 0.7}s`,
        duration: `${9 + (index % 5) * 1.6}s`,
      })),
    []
  );
  const floatingHighlights = useMemo(
    () => [
      {
        title: 'Giỏ hàng mở bán',
        value: '12 dự án',
        description: 'Cập nhật theo ngày',
        position: { top: '45%', right: '25%' },
        delay: '0s',
      },
      {
        title: 'Pháp lý minh bạch',
        value: '100%',
        description: 'Tài liệu sẵn gửi khách',
        position: { top: '18%', right: '8%' },
        delay: '0.8s',
      },
      {
        title: 'Tư vấn 1:1',
        value: '< 5 phút',
        description: 'Kết nối chuyên viên phù hợp',
        position: { bottom: '22%', right: '10%' },
        delay: '1.6s',
      },
    ],
    []
  );
  const skylineBuildings = useMemo(
    () => [
      { width: 82, height: 152, delay: '0s' },
      { width: 62, height: 214, delay: '0.6s' },
      { width: 96, height: 268, delay: '1.1s' },
      { width: 74, height: 186, delay: '1.7s' },
      { width: 108, height: 298, delay: '2.2s' },
      { width: 68, height: 238, delay: '2.7s' },
      { width: 88, height: 202, delay: '3.1s' },
    ],
    []
  );

  return (
    <section data-testid="hero-section" className="relative min-h-screen flex items-center overflow-hidden">
      {/* Real photo background */}
      <div className="absolute inset-0 z-0">
        <img loading="lazy"
          src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1920&q=90"
          alt="ProHouze - Bất động sản"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-white/[0.45] backdrop-blur-[1px]" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-50/60 via-white/30 to-transparent" />
      </div>

      {/* Animated glow orbs */}
      <div className="absolute inset-0 z-[1] pointer-events-none">
        <div className="absolute -left-24 top-24 h-96 w-96 rounded-full bg-blue-400/10 blur-3xl animate-hero-orb-left" />
        <div className="absolute right-0 top-14 h-96 w-96 rounded-full bg-cyan-400/10 blur-3xl animate-hero-orb-right" />
      </div>

      {/* Floating highlights */}
      <div className="pointer-events-none absolute inset-0 z-[2] hidden xl:block">
        {floatingHighlights.map((item) => (
          <div
            key={item.title}
            className="absolute w-60 rounded-2xl border border-white/80 bg-white/80 px-5 py-4 text-left backdrop-blur-xl shadow-2xl shadow-slate-200/50 animate-float-highlight"
            style={{ ...item.position, animationDelay: item.delay }}
          >
            <p className="text-xs uppercase tracking-[0.1em] font-semibold text-[#316585]">{item.title}</p>
            <p className="mt-1.5 text-2xl font-bold text-slate-900">{item.value}</p>
            <p className="mt-1 text-sm text-slate-600">{item.description}</p>
            <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          </div>
        ))}
      </div>

      {/* Particles */}
      <div className="absolute inset-0 z-[2] pointer-events-none overflow-hidden">
        {heroParticles.map((particle) => (
          <div
            key={particle.id}
            className="absolute rounded-full bg-cyan-300/20 animate-float-particle"
            style={{ width: particle.size, height: particle.size, left: particle.left, top: particle.top, animationDelay: particle.delay, animationDuration: particle.duration }}
          />
        ))}
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-24 w-full">
        <div className="max-w-4xl">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-white/70 backdrop-blur-md border border-[#316585]/20 rounded-full px-5 py-2.5 mb-8 animate-fade-in shadow-sm">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-[#316585] text-sm font-semibold">Phân phối trực tiếp từ chủ đầu tư</span>
            <Sparkles className="w-4 h-4 text-yellow-500" />
          </div>

          {/* H1 Title */}
          <h1 className="text-5xl sm:text-6xl lg:text-[60px] font-extrabold text-slate-900 leading-tight mb-6 animate-slide-up tracking-tight">
            <span className="block mb-1 sm:mb-2 text-slate-900">Mua bất động sản</span>
            <span className="block bg-gradient-to-r from-[#316585] to-[#4a9fc5] bg-clip-text text-transparent pb-2">
              Trực tiếp từ chủ đầu tư
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mb-10 animate-slide-up leading-relaxed font-medium" style={{ animationDelay: '0.1s' }}>
            Giá tốt nhất thị trường · Pháp lý minh bạch · Giỏ hàng đa dạng · Tư vấn chuyên sâu 1:1
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap gap-4 mb-0 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <Button
              size="lg"
              data-testid="hero-view-projects-btn"
              className="bg-gradient-to-r from-[#316585] to-[#4a9fc5] hover:from-[#2a5570] hover:to-[#3b85a8] text-white px-10 py-7 text-base font-semibold rounded-full shadow-xl shadow-[#316585]/20 border-0 group transition-all duration-300"
              onClick={() => navigate('/projects')}
            >
              Xem dự án đang mở bán
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              data-testid="hero-contact-btn"
              className="border-[#316585]/30 text-[#316585] bg-white/50 hover:bg-white hover:border-[#316585] px-10 py-7 text-base font-semibold rounded-full backdrop-blur-md shadow-sm transition-all duration-300"
              onClick={() => document.getElementById('lead-form-section')?.scrollIntoView({ behavior: 'smooth' })}
            >
              <Phone className="w-5 h-5 mr-2" />
              Nhận tư vấn ngay
            </Button>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 animate-bounce">
        <div className="w-6 h-10 rounded-full border-2 border-slate-400 flex items-start justify-center p-1.5 bg-white/50 backdrop-blur-sm">
          <div className="w-1 h-2 bg-[#316585] rounded-full animate-scroll-down" />
        </div>
      </div>

      <style>{`
        @keyframes float-particle {
          0%, 100% { transform: translateY(0) translateX(0); opacity: 0.2; }
          50% { transform: translateY(-28px) translateX(8px); opacity: 0.6; }
        }
        @keyframes hero-orb-left {
          0%, 100% { transform: translate3d(0,0,0) scale(1); opacity: 0.5; }
          50% { transform: translate3d(40px,-30px,0) scale(1.1); opacity: 0.8; }
        }
        @keyframes hero-orb-right {
          0%, 100% { transform: translate3d(0,0,0) scale(1); opacity: 0.4; }
          50% { transform: translate3d(-36px,24px,0) scale(1.12); opacity: 0.7; }
        }
        @keyframes float-highlight {
          0%, 100% { transform: translate3d(0,0,0); }
          50% { transform: translate3d(0,-12px,0); }
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes scroll-down {
          0%, 100% { transform: translateY(0); opacity: 1; }
          50% { transform: translateY(6px); opacity: 0.3; }
        }
        .animate-float-particle { animation: float-particle 10s ease-in-out infinite; }
        .animate-hero-orb-left { animation: hero-orb-left 12s ease-in-out infinite; }
        .animate-hero-orb-right { animation: hero-orb-right 14s ease-in-out infinite; }
        .animate-float-highlight { animation: float-highlight 8s ease-in-out infinite; }
        .animate-fade-in { animation: fade-in 0.6s ease-out forwards; }
        .animate-slide-up { animation: slide-up 0.6s ease-out forwards; opacity: 0; }
        .animate-scroll-down { animation: scroll-down 1.5s ease-in-out infinite; }
      `}</style>
    </section>
  );
};

// ===================== TESTIMONIALS SLIDER =====================
const TestimonialsSection = () => {
  const [current, setCurrent] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [testimonials, setTestimonials] = useState([]);

  useEffect(() => {
    // Fetch testimonials from API
    const fetchTestimonials = async () => {
      try {
        const res = await fetch(`${API_URL}/api/website/testimonials`);
        if (res.ok) {
          const data = await res.json();
          if (data.length > 0) setTestimonials(data);
        }
      } catch {
        // silently use default testimonials
      }
    };
    fetchTestimonials();
  }, []);

  // Default testimonials if API returns empty
  const displayTestimonials = testimonials.length > 0 ? testimonials : [
    {
      name: 'Nguyễn Văn Minh',
      role: 'Khách hàng mua căn hộ',
      avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
      content: 'Tôi rất hài lòng với dịch vụ của ProHouze. Đội ngũ tư vấn chuyên nghiệp, giúp tôi tìm được căn hộ ưng ý với giá tốt nhất.',
      rating: 5,
      project: 'Sun Symphony Residence'
    },
    {
      name: 'Trần Thị Hương',
      role: 'Nhà đầu tư BĐS',
      avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
      content: 'Đã đầu tư dự án qua ProHouze, lợi nhuận thực tế đạt đúng như cam kết. Thông tin cập nhật nhanh, chính xác.',
      rating: 5,
      project: 'Nobu Residences Danang'
    },
    {
      name: 'Lê Hoàng Nam',
      role: 'CTV bán hàng',
      avatar: 'https://randomuser.me/api/portraits/men/67.jpg',
      content: 'Làm CTV cho ProHouze giúp thu nhập tăng gấp 3 lần. Hoa hồng rõ ràng, nhanh chóng và hỗ trợ 24/7.',
      rating: 5,
      project: 'Sun Symphony Residence'
    },
    {
      name: 'Phạm Thị Mai',
      role: 'Đại lý chính thức',
      avatar: 'https://randomuser.me/api/portraits/women/65.jpg',
      content: 'ProHouze là đối tác cung cấp giỏ hàng tốt nhất khu vực Miền Trung. Tư liệu phong phú, nền tảng xuất sắc.',
      rating: 5,
      project: 'Nobu Residences Danang'
    },
  ];

  useEffect(() => {
    if (!isAutoPlaying || displayTestimonials.length === 0) return;
    const timer = setInterval(() => {
      setCurrent(prev => (prev + 1) % displayTestimonials.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [isAutoPlaying, displayTestimonials.length]);

  const goTo = (index) => {
    setCurrent(index);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const prev = () => goTo((current - 1 + displayTestimonials.length) % displayTestimonials.length);
  const next = () => goTo((current + 1) % displayTestimonials.length);

  if (displayTestimonials.length === 0) return null;

  return (
    <section className="py-24 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <span className="text-[#316585] text-sm font-semibold uppercase tracking-wider">Đánh giá</span>
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mt-2">
            Khách hàng nói gì về <span className="text-[#316585]">ProHouze</span>
          </h2>
        </div>

        <div className="relative max-w-4xl mx-auto">
          {/* Main Testimonial */}
          <div className="relative bg-white shadow-xl shadow-slate-200/50 border border-slate-100 rounded-3xl p-8 md:p-12">
            {/* Quote Icon */}
            <div className="absolute -top-6 left-8 w-12 h-12 bg-[#316585] rounded-full flex items-center justify-center shadow-md">
              <Quote className="w-6 h-6 text-white" />
            </div>

            <div className="flex flex-col md:flex-row gap-8 items-start">
              {/* Avatar */}
              <div className="flex-shrink-0">
                <img loading="lazy" 
                  src={displayTestimonials[current]?.avatar || 'https://randomuser.me/api/portraits/men/32.jpg'} 
                  alt={displayTestimonials[current]?.name}
                  className="w-20 h-20 rounded-full border-4 border-slate-100 object-cover shadow-sm"
                />
              </div>

              {/* Content */}
              <div className="flex-1">
                <p className="text-slate-700 font-medium text-lg leading-relaxed mb-6 italic">
                  "{displayTestimonials[current]?.content}"
                </p>

                <div className="flex items-center gap-4 mb-4">
                  {/* Rating Stars */}
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i} 
                        className={`w-5 h-5 ${i < (displayTestimonials[current]?.rating || 5) ? 'text-yellow-400 fill-yellow-400' : 'text-slate-200'}`}
                      />
                    ))}
                  </div>
                  <span className="text-slate-500 font-medium text-sm">• {displayTestimonials[current]?.project}</span>
                </div>

                <div>
                  <h4 className="text-slate-900 font-bold text-lg">{displayTestimonials[current]?.name}</h4>
                  <p className="text-slate-600">{displayTestimonials[current]?.role}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-center gap-4 mt-8">
            <button 
              onClick={prev}
              className="w-12 h-12 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-sm"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            
            {/* Dots */}
            <div className="flex gap-2">
              {displayTestimonials.map((_, i) => (
                <button
                  key={i}
                  onClick={() => goTo(i)}
                  className={`transition-all duration-300 rounded-full ${
                    i === current 
                      ? 'w-8 h-2 bg-[#316585]' 
                      : 'w-2 h-2 bg-slate-300 hover:bg-slate-400'
                  }`}
                />
              ))}
            </div>
            
            <button 
              onClick={next}
              className="w-12 h-12 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-sm"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

// ===================== FEATURED PROJECTS =====================
const ProjectsSection = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Sample projects as fallback
  const sampleProjects = useMemo(() => [
    { name: 'Nobu Residences Danang', slug: 'nobu-danang', location: 'Sơn Trà, Đà Nẵng', price: 'Từ 3.8 triệu/đêm', remaining: '264 căn', image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800', hot: true },
    { name: 'Sun Symphony Residence', slug: 'sun-symphony', location: 'Sơn Trà, Đà Nẵng', price: 'Liên hệ', remaining: '1373 căn', image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800', hot: true },
  ], []);

  const fetchProjects = useCallback(async () => {
      try {
        const response = await fetch(`${API_URL}/api/website/projects-list?is_hot=true&limit=4`);
        if (response.ok) {
          const dbProjects = await response.json();
          if (dbProjects.length > 0) {
            const transformed = dbProjects.map(p => ({
              name: p.name,
              slug: p.slug || p.id,
              location: p.location?.city ? `${p.location.district || ''}, ${p.location.city}` : '',
              price: p.price_from ? `Từ ${(p.price_from / 1000000000).toFixed(1)} tỷ` : 'Liên hệ',
              remaining: `${p.units_available || 0} căn`,
              image: p.images?.[0] || 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800',
              hot: p.is_hot || false,
            }));
            // Combine DB projects first, then fill with samples
            const dbNames = new Set(transformed.map(p => p.name.toLowerCase()));
            const filteredSample = sampleProjects.filter(p => !dbNames.has(p.name.toLowerCase()));
            setProjects([...transformed, ...filteredSample].slice(0, 4));
          } else {
            setProjects(sampleProjects);
          }
        } else {
          setProjects(sampleProjects);
        }
      } catch {
        // silently use sample projects as fallback
        setProjects(sampleProjects);
      }
      setLoading(false);
  }, [sampleProjects]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  return (
    <section className="py-24 bg-[#f0f4f8]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-12">
          <div>
            <span className="text-cyan-600 text-sm font-semibold uppercase tracking-widest">Dự án nổi bật</span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-[#0a1a30] mt-2">Đang mở bán tại ProHouze</h2>
            <p className="text-gray-500 mt-2">Cập nhật liên tục từ chủ đầu tư — pháp lý minh bạch</p>
          </div>
          <Button
            variant="outline"
            className="mt-4 md:mt-0 border-[#316585] text-[#316585] hover:bg-[#316585] hover:text-white rounded-full font-semibold transition-all"
            onClick={() => navigate('/projects')}
          >
            Xem tất cả <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {projects.map((project, index) => (
            <div
              key={project.slug || index}
              className="group bg-white rounded-2xl overflow-hidden cursor-pointer shadow-md hover:shadow-2xl hover:shadow-cyan-200/50 transition-all duration-400 hover:-translate-y-2 border border-gray-100"
              onClick={() => navigate(`/projects/${project.slug}`)}
            >
              <div className="relative h-52 overflow-hidden">
                <img loading="lazy" src={project.image} alt={project.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-600"  />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                <div className="absolute top-3 left-3 flex gap-2">
                  {project.hot && (
                    <span className="inline-flex items-center gap-1 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">🔥 HOT</span>
                  )}
                  {index === 2 && (
                    <span className="inline-flex items-center gap-1 bg-gradient-to-r from-violet-500 to-purple-600 text-white text-xs font-bold px-2.5 py-1 rounded-full">VIP</span>
                  )}
                  {index === 1 && (
                    <span className="inline-flex items-center gap-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">✨ MỚI</span>
                  )}
                </div>
                <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-sm text-white text-xs font-semibold px-2.5 py-1 rounded-full">
                  Còn {project.remaining}
                </div>
              </div>
              <div className="p-5">
                <h3 className="font-extrabold text-[#0a1a30] text-lg mb-1.5 group-hover:text-cyan-600 transition-colors line-clamp-1">{project.name}</h3>
                <p className="text-gray-500 text-sm flex items-center gap-1 mb-4">
                  <MapPin className="w-3.5 h-3.5 text-cyan-500" /> {project.location}
                </p>
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <span className="text-cyan-600 font-extrabold text-base">{project.price}</span>
                  <span className="text-[#316585] text-xs font-semibold bg-cyan-50 px-2.5 py-1 rounded-full">Xem chi tiết →</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ===================== ABOUT SECTION =====================
const AboutSection = () => {
  const features = [
    { icon: Shield, title: 'Chuyên nghiệp', desc: 'Đội ngũ môi giới được đào tạo bài bản' },
    { icon: DollarSign, title: 'Hoa hồng cao', desc: 'Chính sách hoa hồng hấp dẫn nhất' },
    { icon: Building2, title: 'Dự án chất lượng', desc: 'Hợp tác với chủ đầu tư uy tín' },
    { icon: Headphones, title: 'Hỗ trợ 24/7', desc: 'Đồng hành suốt quá trình giao dịch' },
  ];

  return (
    <section className="py-24 bg-slate-50 border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <span className="text-[#316585] text-sm font-semibold uppercase tracking-wider">Về chúng tôi</span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mt-2 mb-6">
              Nền tảng BĐS sơ cấp
              <br />
              <span className="text-[#316585]">hàng đầu Việt Nam</span>
            </h2>
            <p className="text-slate-600 font-medium mb-8 leading-relaxed">
              ProHouze kết nối trực tiếp khách hàng với các dự án từ chủ đầu tư. 
              Chúng tôi cam kết mang đến trải nghiệm mua nhà minh bạch, chuyên nghiệp và hiệu quả nhất.
            </p>
            
            <div className="grid grid-cols-2 gap-4">
              {features.map((f, i) => (
                <div key={i} className="bg-white border border-slate-200 rounded-xl p-4 hover:shadow-md transition-shadow shadow-sm">
                  <f.icon className="w-8 h-8 text-[#316585] mb-3" />
                  <h4 className="font-bold text-slate-900 mb-1">{f.title}</h4>
                  <p className="text-slate-500 text-sm">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="bg-gradient-to-br from-[#316585] to-[#4a9fc5] rounded-3xl p-8 text-center shadow-xl shadow-[#316585]/20">
              <div className="text-6xl font-extrabold text-white mb-2">10+</div>
              <p className="text-white/90 font-medium text-lg">Năm kinh nghiệm</p>
              <div className="grid grid-cols-2 gap-4 mt-8">
                <div className="bg-white/20 backdrop-blur-md rounded-xl p-4">
                  <div className="text-2xl font-bold text-white">500+</div>
                  <p className="text-white/80 font-medium text-sm">Đại lý</p>
                </div>
                <div className="bg-white/20 backdrop-blur-md rounded-xl p-4">
                  <div className="text-2xl font-bold text-white">50+</div>
                  <p className="text-white/80 font-medium text-sm">Dự án</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// ===================== JOIN US / CAREERS SECTION =====================
const CareersSection = () => {
  const navigate = useNavigate();
  
  const benefits = [
    'Hoa hồng lên đến 70% cho CTV',
    'Đào tạo miễn phí, chứng chỉ nghề',
    'App quản lý khách hàng chuyên nghiệp',
    'Hỗ trợ marketing, leads chất lượng',
    'Thanh toán hoa hồng nhanh chóng',
    'Cơ hội thăng tiến không giới hạn',
  ];

  return (
    <section className="py-24 bg-[#316585]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="text-sky-200 text-sm font-semibold uppercase tracking-wider">Tuyển dụng</span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-white mt-2 mb-6">
              Gia nhập đội ngũ
              <br />
              ProHouze
            </h2>
            <p className="text-sky-100 font-medium mb-8">
              Bạn đam mê bất động sản? Muốn có thu nhập không giới hạn? 
              Hãy trở thành đại lý/cộng tác viên của ProHouze ngay hôm nay!
            </p>
            
            <div className="grid grid-cols-2 gap-3">
              {benefits.map((b, i) => (
                <div key={i} className="flex items-center gap-2 text-white font-medium text-sm">
                  <CheckCircle2 className="w-4 h-4 text-green-300 flex-shrink-0" />
                  {b}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-3xl p-8 shadow-2xl">
            <h3 className="text-xl font-extrabold text-slate-900 mb-6">Đăng ký ngay</h3>
            <div className="space-y-4">
              <Button 
                className="w-full bg-[#316585] text-white hover:bg-[#28506b] py-6 rounded-xl font-bold shadow-md"
                onClick={() => navigate('/careers')}
              >
                <Rocket className="w-5 h-5 mr-2" />
                Đăng ký Cộng tác viên (CTV)
              </Button>
              <Button 
                variant="outline" 
                className="w-full border-slate-200 text-slate-700 hover:bg-slate-50 py-6 rounded-xl font-bold"
                onClick={() => navigate('/careers')}
              >
                <Building2 className="w-5 h-5 mr-2" />
                Đăng ký Đại lý chính thức
              </Button>
              <div className="text-center pt-2">
                <button 
                  className="text-slate-500 hover:text-[#316585] text-sm font-medium underline"
                  onClick={() => navigate('/login')}
                >
                  Đã có tài khoản? Đăng nhập ngay
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// ===================== MAP & CONTACT SECTION =====================
const ContactMapSection = () => {
  const [formData, setFormData] = useState({ name: '', phone: '', message: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) {
      toast.error('Vui lòng nhập họ tên và số điện thoại');
      return;
    }
    setLoading(true);
    try {
      await fetch(`${API_URL}/api/website/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, source: 'landing_page' })
      });
      toast.success('Cảm ơn bạn! Chúng tôi sẽ liên hệ sớm nhất.');
      setFormData({ name: '', phone: '', message: '' });
    } catch (error) {
      toast.error('Có lỗi xảy ra. Vui lòng thử lại!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="py-24 bg-slate-50 border-t border-slate-200" id="contact">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <span className="text-[#316585] text-sm font-semibold uppercase tracking-wider">Liên hệ</span>
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mt-2">Kết nối với chúng tôi</h2>
        </div>

        {/* Balanced 2-column grid */}
        <div className="grid lg:grid-cols-2 gap-8 items-stretch">
          {/* Map - same height as form */}
          <div className="rounded-2xl overflow-hidden border border-slate-200 min-h-[500px] shadow-sm">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3919.4241674197905!2d106.69779231533417!3d10.77653439232684!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31752f385570472f%3A0x1787491df0ed8d6a!2zTmd1eeG7hW4gSHXhu4csIELhur9uIE5naMOpLCBRdeG6rW4gMSwgVGjDoG5oIHBo4buRIEjhu5MgQ2jDrSBNaW5oLCBWaeG7h3QgTmFt!5e0!3m2!1svi!2s!4v1644825834825!5m2!1svi!2s"
              width="100%"
              height="100%"
              style={{ border: 0, minHeight: '100%' }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="ProHouze Location"
            />
          </div>

          {/* Contact Form - same height as map */}
          <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-8 flex flex-col min-h-[500px]">
            <h3 className="text-xl font-extrabold text-slate-900 mb-6">Gửi tin nhắn</h3>
            
            <div className="space-y-4 mb-6">
              <div className="flex items-center gap-4 text-slate-600 font-medium">
                <div className="w-10 h-10 rounded-full bg-sky-50 flex items-center justify-center flex-shrink-0 border border-sky-100">
                  <MapPin className="w-5 h-5 text-[#316585]" />
                </div>
                <span>123 Nguyễn Huệ, Q.1, TP.HCM</span>
              </div>
              <div className="flex items-center gap-4 text-slate-600 font-medium">
                <div className="w-10 h-10 rounded-full bg-sky-50 flex items-center justify-center flex-shrink-0 border border-sky-100">
                  <Phone className="w-5 h-5 text-[#316585]" />
                </div>
                <span>1900 1234 (Miễn phí)</span>
              </div>
              <div className="flex items-center gap-4 text-slate-600 font-medium">
                <div className="w-10 h-10 rounded-full bg-sky-50 flex items-center justify-center flex-shrink-0 border border-sky-100">
                  <Mail className="w-5 h-5 text-[#316585]" />
                </div>
                <span>contact@prohouze.com</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 flex-1 flex flex-col">
              <Input
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Họ và tên *"
                aria-label="Họ và tên"
                className="bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 h-12 outline-none focus:border-[#316585] focus:ring-1 focus:ring-[#316585]"
              />
              <Input
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="Số điện thoại *"
                aria-label="Số điện thoại"
                type="tel"
                className="bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 h-12 outline-none focus:border-[#316585] focus:ring-1 focus:ring-[#316585]"
              />
              <textarea
                value={formData.message}
                onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                placeholder="Nội dung..."
                rows={4}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-900 placeholder:text-slate-400 resize-none focus:outline-none focus:border-[#316585] focus:ring-1 focus:ring-[#316585] flex-1"
              />
              <Button 
                type="submit" 
                className="w-full bg-[#316585] hover:bg-[#2a5570] py-6 rounded-xl mt-auto font-bold shadow-md"
                disabled={loading}
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Send className="w-5 h-5 mr-2" />
                    Gửi tin nhắn
                  </>
                )}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

// ===================== PARTNERS SECTION =====================
const PartnersSection = () => {
  const [partners, setPartners] = useState([]);
  
  useEffect(() => {
    const fetchPartners = async () => {
      try {
        const res = await fetch(`${API_URL}/api/website/partners`);
        if (res.ok) {
          const data = await res.json();
          if (data.length > 0) setPartners(data);
        }
      } catch {
        // silently use default partners
      }
    };
    fetchPartners();
  }, []);

  // Default partners if API returns empty
  const displayPartners = partners.length > 0 ? partners : [
    { name: 'VINGROUP', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/70/Vingroup_logo.svg/320px-Vingroup_logo.svg.png' },
    { name: 'SUN GROUP', logo: null },
    { name: 'BRG GROUP', logo: null },
    { name: 'MASTERISE', logo: null },
    { name: 'NOVALAND', logo: null },
    { name: 'ECOPARK', logo: null },
    { name: 'VIETCOMBANK', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b0/Logo_ViecB.svg/320px-Logo_ViecB.svg.png' },
    { name: 'BIDV', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/BIDV_Logo.svg/320px-BIDV_Logo.svg.png' },
    { name: 'VIETINBANK', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/29/VietinBank_logo.svg/320px-VietinBank_logo.svg.png' },
    { name: 'AGRIBANK', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/Agribank_Logo.svg/320px-Agribank_Logo.svg.png' },
  ];

  return (
    <section className="py-16 bg-white border-y border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <span className="text-[#316585] text-sm font-semibold uppercase tracking-wider">Đối tác</span>
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mt-2">Đồng hành cùng các thương hiệu hàng đầu</h2>
        </div>

        {/* Partners Logo Slider */}
        <div className="relative overflow-hidden w-full max-w-6xl mx-auto">
          {/* Fading edges for smooth scroll effect */}
          <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-white to-transparent z-10 hidden md:block" />
          <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-white to-transparent z-10 hidden md:block" />
          
          <div className="flex animate-scroll-x gap-8 items-center py-4">
            {[...displayPartners, ...displayPartners, ...displayPartners].map((partner, i) => (
              <div 
                key={i}
                className="flex-shrink-0 w-48 h-20 bg-slate-50 border border-slate-100 shadow-sm rounded-xl flex items-center justify-center p-4 hover:bg-white hover:border-slate-200 hover:shadow-md transition-all group"
              >
                {partner.logo ? (
                  <>
                    <img loading="lazy" 
                      src={partner.logo} 
                      alt={partner.name}
                      className="max-h-12 max-w-[140px] w-auto object-contain filter grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-300 mix-blend-multiply"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        if (e.target.nextSibling) {
                          e.target.nextSibling.style.display = 'block';
                        }
                      }}
                    />
                    <span className="text-slate-800 font-extrabold text-lg tracking-wider text-center" style={{display: 'none'}}>
                      {partner.name}
                    </span>
                  </>
                ) : (
                  <span className="text-slate-800 font-black text-lg tracking-widest text-center filter opacity-60 group-hover:opacity-100 transition-opacity">
                    {partner.name}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Trust indicators */}
        <div className="flex justify-center gap-8 mt-10 flex-wrap">
          {[
            { value: '50+', label: 'Dự án phân phối' },
            { value: '20+', label: 'Chủ đầu tư đối tác' },
            { value: '100%', label: 'Dự án chính chủ' },
          ].map((item, i) => (
            <div key={i} className="text-center">
              <p className="text-2xl font-bold text-[#316585]">{item.value}</p>
              <p className="text-slate-500 font-medium text-sm">{item.label}</p>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes scroll-x {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-scroll-x {
          animation: scroll-x 20s linear infinite;
        }
        .animate-scroll-x:hover {
          animation-play-state: paused;
        }
      `}</style>
    </section>
  );
};

// ===================== NEWS SECTION =====================
const HANDBOOK_TABS = [
  { id: 'all',       label: 'Nổi bật',      emoji: '🔥' },
  { id: 'market',    label: 'Thị trường',    emoji: '📈' },
  { id: 'buy',       label: 'Mua nhà',       emoji: '🏠' },
  { id: 'invest',    label: 'Đầu tư',        emoji: '💰' },
  { id: 'finance',   label: 'Tài chính',     emoji: '🏦' },
  { id: 'legal',     label: 'Pháp lý',       emoji: '⚖️' },
  { id: 'design',    label: 'Nhà đẹp',       emoji: '🏡' },
  { id: 'fengshui',  label: 'Phong thủy',    emoji: '🧭' },
  { id: 'developer', label: 'Doanh nghiệp',  emoji: '🏢' },
  { id: 'review',    label: 'Review Dự án',  emoji: '📋' },
];

const DEFAULT_ARTICLES = [
  { id: 1, title: 'Scandinavian là gì? Tìm hiểu phong cách scandinavian 2025', excerpt: 'Tìm hiểu chi tiết về phong cách Scandinavian là gì. Cùng khám phá và trải nghiệm phong cách Scandinavian qua bài viết này.', image: 'https://images.unsplash.com/photo-1593696140826-c58b021acf8b?w=800', category: 'design',    date: '31/05/2025', readTime: '5 phút', isAI: true },
  { id: 2, title: 'Kiến trúc hiện đại: xu hướng thiết kế đẹp, bền vững 2025',   excerpt: 'Những xu hướng kiến trúc nổi bật nhất sẽ định hình ngành xây dựng trong năm 2025.', image: 'https://images.unsplash.com/photo-1487958449943-2429e8be8625?w=800', category: 'design',    date: '31/05/2025', readTime: '4 phút', isAI: true },
  { id: 3, title: 'Mệnh Kim nên trồng cây nào? Top 10 loại cây hợp mệnh Kim',    excerpt: 'Người mệnh Kim nên chọn những loại cây nào để mang lại may mắn và tài lộc?', image: 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=800', category: 'fengshui',  date: '31/05/2025', readTime: '3 phút', isAI: true },
  { id: 4, title: 'Kinh nghiệm mua nhà lần đầu: 10 điều cần kiểm tra trước khi đặt cọc', excerpt: 'Mua nhà lần đầu rất dễ mắc bẫy. Đây là checklist 10 điều quan trọng nhất bạn cần kiểm tra.', image: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800', category: 'buy',       date: '30/05/2025', readTime: '6 phút', isAI: true },
  { id: 5, title: 'Thị trường căn hộ Hà Nội Q2/2025: Nguồn cung khan hiếm, giá tiếp tục tăng', excerpt: 'Phân tích chi tiết biến động thị trường căn hộ Hà Nội trong quý 2/2025.', image: 'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=800', category: 'market',    date: '29/05/2025', readTime: '7 phút', isAI: true },
  { id: 6, title: 'Sổ đỏ và sổ hồng: Sự khác biệt quan trọng người mua nhà cần biết', excerpt: 'Giải thích rõ ràng sự khác nhau giữa sổ đỏ và sổ hồng theo Luật Đất đai 2024.', image: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800', category: 'legal',     date: '28/05/2025', readTime: '5 phút', isAI: true },
  { id: 7, title: 'Vay mua nhà ngân hàng nào lãi suất tốt nhất tháng 6/2025?',   excerpt: 'So sánh lãi suất vay mua nhà của 10 ngân hàng lớn tại Việt Nam.', image: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800', category: 'finance',   date: '27/05/2025', readTime: '8 phút', isAI: true },
];

const NewsSection = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [news, setNews] = useState([]);
  
  useEffect(() => {
    const fetchNews = async () => {
      try {
        const res = await fetch(`${API_URL}/api/website/news?limit=10&status=published`);
        if (res.ok) {
          const data = await res.json();
          if (data.length > 0) setNews(data);
        }
      } catch (err) {
        // silently handle: Failed to fetch news:
      }
    };
    fetchNews();
  }, []);

  const allArticles = news.length > 0 ? news.map(n => ({
    id: n.id,
    title: n.title,
    excerpt: n.excerpt || n.content?.substring(0, 150) + '...',
    image: n.image || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800',
    category: n.category || 'all',
    date: new Date(n.published_at || new Date()).toLocaleDateString('vi-VN'),
    readTime: `${Math.ceil((n.content?.length || 500) / 1000)} phút`,
    isAI: n.is_ai_generated || false,
  })) : DEFAULT_ARTICLES;

  const filteredArticles = allArticles.filter(a => {
    const matchTab = activeTab === 'all' || a.category === activeTab;
    const matchSearch = !searchQuery || a.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchTab && matchSearch;
  });

  const featured = filteredArticles[0];
  const listNews = filteredArticles.slice(1, 6);

  return (
    <section className="bg-white" id="cam-nang">

      {/* ── STICKY: Tab menu + Search ── */}
      <div className="sticky top-[80px] z-30 bg-white border-b border-slate-200 shadow-sm">
        {/* Title row + search */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-2 flex items-center justify-between gap-4">
          <div>
            <span className="text-[#316585] font-extrabold text-xl tracking-tight">Cẩm nang BĐS</span>
            <span className="hidden md:inline text-slate-400 text-sm ml-3">Kiến thức mua nhà · Đầu tư · Pháp lý · Thiết kế</span>
          </div>
          <div className="relative hidden md:block">
            <input
              type="text"
              placeholder="Tìm bài viết..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-56 h-9 bg-slate-50 border border-slate-200 rounded-full pl-4 pr-9 text-sm outline-none focus:border-[#316585] transition-colors"
            />
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
          </div>
        </div>
        {/* 10-tab scrollable row */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center gap-1 overflow-x-auto whitespace-nowrap scrollbar-hide">
            {HANDBOOK_TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all whitespace-nowrap
                  ${activeTab === tab.id
                    ? 'text-[#316585] border-[#316585] bg-sky-50/60'
                    : 'text-slate-600 border-transparent hover:text-[#316585] hover:border-slate-200'
                  }`}
              >
                <span>{tab.emoji}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {filteredArticles.length === 0 ? (
          <div className="text-center py-20 text-slate-400">
            <span className="text-5xl block mb-4">📭</span>
            <p className="font-semibold">Chưa có bài viết trong chuyên mục này.</p>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-12">
            {/* Featured Article - Left 2/3 */}
            {featured && (
              <div className="lg:col-span-2 group cursor-pointer" onClick={() => navigate(`/news/${featured.id}`)}>
                <div className="overflow-hidden rounded-2xl mb-6 shadow-sm border border-slate-100 relative">
                  <img loading="lazy" src={featured.image} alt={featured.title} className="w-full aspect-[16/9] object-cover group-hover:scale-105 transition-transform duration-700"  />
                  {featured.isAI && (
                    <span className="absolute top-3 left-3 bg-violet-600/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                      ✨ AI · Đã duyệt
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-sm font-semibold text-slate-500 mb-3">
                  <span className="text-[#316585] bg-sky-50 px-2 py-0.5 rounded-md text-xs font-bold">
                    {HANDBOOK_TABS.find(t => t.id === featured.category)?.emoji}{' '}
                    {HANDBOOK_TABS.find(t => t.id === featured.category)?.label || featured.category}
                  </span>
                  <span className="w-1 h-1 rounded-full bg-slate-300" />
                  <span>{featured.date}</span>
                  <span className="w-1 h-1 rounded-full bg-slate-300" />
                  <span>{featured.readTime} đọc</span>
                </div>
                <h3 className="text-2xl md:text-3xl font-extrabold text-slate-900 leading-snug mb-4 group-hover:text-[#316585] transition-colors">
                  {featured.title}
                </h3>
                <p className="text-slate-600 leading-relaxed md:text-lg">{featured.excerpt}</p>
              </div>
            )}
            {/* Sidebar - Right 1/3 */}
            <div className="flex flex-col divide-y divide-slate-100">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest pb-3">Bài mới nhất</p>
              {listNews.map((item) => (
                <div key={item.id} className="py-4 group cursor-pointer hover:bg-slate-50 transition-colors -mx-3 px-3 rounded-xl" onClick={() => navigate(`/news/${item.id}`)}>
                  <div className="flex gap-3 items-start">
                    {item.image && (
                      <img loading="lazy" src={item.image} alt={item.title} className="w-16 h-12 object-cover rounded-lg flex-shrink-0"  />
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-slate-900 leading-snug mb-1.5 group-hover:text-[#316585] transition-colors line-clamp-2">
                        {item.title}
                      </h4>
                      <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
                        <span>{HANDBOOK_TABS.find(t => t.id === item.category)?.emoji}</span>
                        <span className="truncate">{HANDBOOK_TABS.find(t => t.id === item.category)?.label || item.category}</span>
                        <span className="w-1 h-1 rounded-full bg-slate-200 flex-shrink-0" />
                        <span className="flex-shrink-0">{item.date}</span>
                        {item.isAI && <span className="ml-auto text-violet-500 text-[9px] font-bold bg-violet-50 px-1.5 py-0.5 rounded-full flex-shrink-0">✨ AI</span>}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              <div className="pt-4">
                <button onClick={() => navigate('/news')} className="w-full text-center text-sm font-bold text-[#316585] hover:bg-sky-50 py-2.5 rounded-lg transition-colors border border-[#316585]/20">
                  Xem tất cả bài viết →
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};




// ===================== NEWSLETTER SECTION =====================
const NewsletterSection = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!email) {
      toast.error('Vui lòng nhập email');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/newsletter/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, interests: ['market', 'project', 'tips'] }),
      });

      if (res.ok) {
        const data = await res.json();
        setSubscribed(true);
        toast.success(data.message || 'Đăng ký thành công!');
        setEmail('');
      } else {
        throw new Error('Failed to subscribe');
      }
    } catch (err) {
      toast.error('Có lỗi xảy ra. Vui lòng thử lại!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-16 bg-white border border-slate-200 shadow-xl shadow-[#316585]/5 rounded-3xl p-8 md:p-12 relative overflow-hidden">
      <div className="absolute top-0 right-0 -mt-16 -mr-16 w-64 h-64 bg-gradient-to-bl from-sky-100 to-transparent rounded-full opacity-50 pointer-events-none" />
      <div className="grid md:grid-cols-2 gap-8 items-center relative z-10">
        <div>
          <h3 className="text-2xl font-extrabold text-slate-900 mb-2">Đăng ký nhận tin</h3>
          <p className="text-slate-600 font-medium">Cập nhật thông tin dự án mới và xu hướng thị trường hàng tuần</p>
        </div>
        {subscribed ? (
          <div className="text-center md:text-left">
            <p className="text-green-600 font-bold text-lg">✓ Đăng ký thành công!</p>
            <p className="text-slate-500 font-medium text-sm">Cảm ơn bạn đã quan tâm</p>
          </div>
        ) : (
          <form onSubmit={handleSubscribe} className="flex gap-3">
            <Input 
              type="email"
              placeholder="Email của bạn"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 h-12 flex-1 focus:border-[#316585] focus:ring-[#316585]"
              required
            />
            <Button 
              type="submit"
              className="bg-[#316585] hover:bg-[#28506b] h-12 px-6 rounded-xl font-bold shadow-md"
              disabled={loading}
            >
              {loading ? 'Đang gửi...' : 'Đăng ký'}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
};

// ===================== LEAD FORM SECTION (MANDATORY) =====================
const LeadFormSection = () => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    interest: 'apartment',
    budget: '',
    notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.phone.trim()) {
      toast.error('Vui lòng nhập họ tên và số điện thoại');
      return;
    }

    // Validate phone format
    const phoneRegex = /^(0[35789])\d{8}$/;
    const cleanPhone = formData.phone.replace(/\s|-|\./g, '');
    if (!phoneRegex.test(cleanPhone)) {
      toast.error('Số điện thoại không hợp lệ');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/ai/lead`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          phone: cleanPhone,
          source: 'landing_form',
          interest: formData.interest,
          budget: formData.budget,
          notes: formData.notes,
        }),
      });

      if (res.ok) {
        setSubmitted(true);
        toast.success('Đăng ký thành công! Chuyên viên sẽ liên hệ trong 15 phút.');
        setFormData({ name: '', phone: '', interest: 'apartment', budget: '', notes: '' });
      } else {
        throw new Error('API error');
      }
    } catch (err) {
      // silently handle: Lead submission error:
      toast.error('Có lỗi xảy ra. Vui lòng thử lại!');
    } finally {
      setLoading(false);
    }
  };

  const interests = [
    { value: 'apartment', label: 'Căn hộ' },
    { value: 'townhouse', label: 'Nhà phố' },
    { value: 'villa', label: 'Biệt thự' },
    { value: 'land', label: 'Đất nền' },
    { value: 'investment', label: 'Đầu tư' },
  ];

  const budgets = [
    { value: '', label: 'Chọn ngân sách' },
    { value: 'under_2b', label: 'Dưới 2 tỷ' },
    { value: '2_5b', label: '2 - 5 tỷ' },
    { value: '5_10b', label: '5 - 10 tỷ' },
    { value: 'over_10b', label: 'Trên 10 tỷ' },
  ];

  return (
    <section id="lead-form-section" className="py-24 bg-white border-t border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left - Content */}
          <div>
            <span className="text-[#316585] text-sm font-semibold uppercase tracking-wider">Tư vấn miễn phí</span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mt-2 mb-6">
              Nhận tư vấn
              <br />
              <span className="text-[#316585]">từ chuyên gia BĐS</span>
            </h2>
            <p className="text-slate-600 font-medium mb-8 leading-relaxed">
              Để lại thông tin, chuyên viên tư vấn sẽ liên hệ bạn trong vòng <span className="text-[#316585] font-bold">15 phút</span> để hỗ trợ tìm kiếm bất động sản phù hợp nhất.
            </p>

            {/* Benefits */}
            <div className="space-y-4">
              {[
                { icon: CheckCircle2, text: 'Giá tốt nhất - Trực tiếp từ chủ đầu tư' },
                { icon: Shield, text: 'Pháp lý minh bạch - Hỗ trợ full thủ tục' },
                { icon: Headphones, text: 'Tư vấn 1:1 - Đúng nhu cầu của bạn' },
                { icon: DollarSign, text: 'Hỗ trợ vay ngân hàng - Lãi suất ưu đãi' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 text-slate-700 font-medium">
                  <div className="w-8 h-8 rounded-full bg-sky-50 flex items-center justify-center border border-sky-100">
                    <item.icon className="w-4 h-4 text-[#316585]" />
                  </div>
                  <span>{item.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right - Form */}
          <div className="bg-white border border-slate-200 shadow-xl shadow-slate-200/50 rounded-3xl p-8">
            {submitted ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-200">
                  <CheckCircle2 className="w-8 h-8 text-green-500" />
                </div>
                <h3 className="text-xl font-extrabold text-slate-900 mb-2">Đăng ký thành công!</h3>
                <p className="text-slate-600 mb-6 font-medium">Chuyên viên sẽ liên hệ bạn trong 15 phút</p>
                <Button 
                  onClick={() => setSubmitted(false)}
                  variant="outline"
                  className="border-slate-300 text-slate-700 hover:bg-slate-50 font-bold"
                >
                  Gửi yêu cầu khác
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <h3 className="text-xl font-extrabold text-slate-900 mb-2">Nhận tư vấn ngay</h3>
                <p className="text-slate-500 font-medium text-sm mb-6">Điền thông tin để được hỗ trợ nhanh nhất</p>
                
                {/* Name */}
                <div>
                  <label className="text-slate-700 font-bold text-sm mb-1 block">Họ và tên *</label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="VD: Nguyễn Văn A"
                    data-testid="lead-name-input"
                    className="bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 h-12 outline-none focus:border-[#316585] focus:ring-1 focus:ring-[#316585]"
                    required
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="text-slate-700 font-bold text-sm mb-1 block">Số điện thoại *</label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="VD: 0901234567"
                    data-testid="lead-phone-input"
                    className="bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 h-12 outline-none focus:border-[#316585] focus:ring-1 focus:ring-[#316585]"
                    required
                  />
                </div>

                {/* Interest */}
                <div>
                  <label className="text-slate-700 font-bold text-sm mb-1 block">Quan tâm</label>
                  <div className="flex flex-wrap gap-2">
                    {interests.map((item) => (
                      <button
                        key={item.value}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, interest: item.value }))}
                        className={`px-4 py-2 rounded-full text-sm font-semibold transition-all border ${
                          formData.interest === item.value
                            ? 'bg-[#316585] text-white border-[#316585]'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Budget */}
                <div>
                  <label className="text-slate-700 font-bold text-sm mb-1 block">Ngân sách dự kiến</label>
                  <select
                    value={formData.budget}
                    onChange={(e) => setFormData(prev => ({ ...prev, budget: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-lg h-12 px-4 outline-none focus:border-[#316585] focus:ring-1 focus:ring-[#316585] font-medium"
                  >
                    {budgets.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Submit */}
                <Button
                  type="submit"
                  data-testid="lead-submit-btn"
                  className="w-full bg-[#316585] hover:bg-[#2a5570] py-6 rounded-xl text-base font-bold shadow-md"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="animate-spin mr-2">⏳</span>
                      Đang gửi...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5 mr-2" />
                      Gửi yêu cầu tư vấn
                    </>
                  )}
                </Button>

                <p className="text-slate-400 font-medium text-xs text-center pt-2">
                  Bằng việc gửi form, bạn đồng ý với chính sách bảo mật của chúng tôi
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

// ===================== PURCHASE PROCESS SECTION =====================
const PurchaseProcessSection = () => {
  const steps = [
    { num: '01', title: 'Chọn dự án', desc: 'Tìm dự án phù hợp với nhu cầu và ngân sách' },
    { num: '02', title: 'Tư vấn & Tham quan', desc: 'Chuyên viên đồng hành, xem nhà mẫu thực tế' },
    { num: '03', title: 'Giữ chỗ / Booking', desc: 'Đặt cọc giữ chỗ căn hộ ưng ý' },
    { num: '04', title: 'Ký hợp đồng', desc: 'Hoàn tất thủ tục pháp lý, ký HĐMB' },
    { num: '05', title: 'Hoàn tất', desc: 'Nhận bàn giao nhà, hỗ trợ sau bán' },
  ];

  return (
    <section className="py-24 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <span className="text-[#316585] text-sm font-semibold uppercase tracking-wider">Quy trình</span>
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mt-2">
            Quy trình mua nhà <span className="text-[#316585]">đơn giản</span>
          </h2>
          <p className="text-slate-600 mt-4 max-w-2xl mx-auto font-medium">
            5 bước đơn giản để sở hữu ngôi nhà mơ ước cùng ProHouze
          </p>
        </div>

        {/* Timeline */}
        <div className="relative">
          {/* Line */}
          <div className="hidden md:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#316585]/30 to-transparent" />

          <div className="grid md:grid-cols-5 gap-8">
            {steps.map((step, i) => (
              <div key={i} className="relative text-center group">
                {/* Number */}
                <div className="w-16 h-16 mx-auto mb-4 bg-white border-2 border-[#316585] rounded-full flex items-center justify-center text-[#316585] font-bold text-lg group-hover:bg-[#316585] group-hover:text-white transition-colors relative z-10 shadow-sm">
                  {step.num}
                </div>
                <h4 className="font-bold text-slate-900 mb-2">{step.title}</h4>
                <p className="text-slate-600 text-sm">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

// ===================== WHY CHOOSE US SECTION =====================
const WhyChooseUsSection = () => {
  const reasons = [
    { icon: Building2, title: 'Giỏ hàng trực tiếp', desc: 'Phân phối trực tiếp từ chủ đầu tư, không qua trung gian' },
    { icon: DollarSign, title: 'Giá tốt nhất', desc: 'Cam kết giá tốt nhất thị trường, nhiều ưu đãi độc quyền' },
    { icon: User, title: 'Tư vấn chuyên sâu', desc: 'Chuyên viên am hiểu thị trường, tư vấn đúng nhu cầu' },
    { icon: Shield, title: 'Pháp lý minh bạch', desc: 'Hỗ trợ đầy đủ thủ tục pháp lý, bảo vệ quyền lợi khách hàng' },
    { icon: Headphones, title: 'Hỗ trợ tài chính', desc: 'Liên kết ngân hàng, hỗ trợ vay với lãi suất ưu đãi' },
    { icon: CheckCircle2, title: 'Quy trình minh bạch', desc: 'Quy trình giao dịch rõ ràng, nhanh chóng, an toàn' },
  ];

  const gradients = [
    'from-cyan-500 to-sky-500',
    'from-sky-500 to-blue-600',
    'from-violet-500 to-purple-600',
    'from-emerald-500 to-teal-500',
    'from-amber-500 to-orange-500',
    'from-rose-500 to-pink-500',
  ];

  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <span className="text-[#316585] text-sm font-semibold uppercase tracking-widest">Lý do chọn chúng tôi</span>
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mt-3">
            Vì sao chọn <span className="bg-gradient-to-r from-[#316585] to-[#4a9fc5] bg-clip-text text-transparent">ProHouze?</span>
          </h2>
          <p className="text-slate-600 font-medium mt-4 max-w-2xl mx-auto">Cam kết mang đến trải nghiệm mua nhà minh bạch, chuyên nghiệp và hiệu quả nhất Việt Nam</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {reasons.map((item, i) => (
            <div key={i} className="group relative bg-white border border-slate-100 rounded-2xl p-6 hover:shadow-xl hover:-translate-y-1 hover:border-slate-200 transition-all duration-300 overflow-hidden shadow-sm">
              <div className="absolute inset-0 bg-gradient-to-br from-[#316585]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${gradients[i]} flex items-center justify-center mb-5 shadow-sm`}>
                <item.icon className="w-6 h-6 text-white" />
              </div>
              <h4 className="font-bold text-slate-900 mb-2 text-base">{item.title}</h4>
              <p className="text-slate-600 text-sm leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ===================== ZALO FLOATING BUTTON =====================
const ZaloFloatingButton = () => (
  <a
    href="https://zalo.me/prohouzing"
    target="_blank"
    rel="noopener noreferrer"
    className="fixed bottom-24 right-5 z-50 w-14 h-14 rounded-full shadow-2xl shadow-blue-500/40 flex items-center justify-center transition-transform hover:scale-110 active:scale-95"
    style={{ background: 'linear-gradient(135deg, #0068FF, #00A8FF)' }}
    title="Chat Zalo với ProHouze"
  >
    <svg viewBox="0 0 48 48" width="32" height="32" fill="none">
      <rect width="48" height="48" rx="12" fill="none"/>
      <text x="50%" y="54%" dominantBaseline="middle" textAnchor="middle" fontFamily="Arial Black,sans-serif" fontWeight="900" fontSize="18" fill="white">Z</text>
    </svg>
    <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-green-400 rounded-full border-2 border-white animate-pulse" />
  </a>
);

// ===================== MAIN LANDING PAGE =====================
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <WebsiteHeader transparent />
      <HeroSection />
      <TrustStatsBar />
      <PartnersSection />
      <ProjectsSection />
      <WhyChooseUsSection />
      <PurchaseProcessSection />
      <LeadFormSection />
      <TestimonialsSection />
      <CareersSection />
      <NewsSection />
      <ContactMapSection />
      <WebsiteFooter />

      {/* Floating Buttons */}
      <ZaloFloatingButton />
      <AIChatWidget />
    </div>
  );
}
