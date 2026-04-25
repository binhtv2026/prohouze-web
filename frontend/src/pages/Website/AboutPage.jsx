import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Award,
  Users,
  Target,
  TrendingUp,
  Star,
  CheckCircle2,
  Shield,
  Heart,
  ArrowRight,
} from 'lucide-react';
import { WebsiteHeader, WebsiteFooter } from './SharedComponents';

export function AboutPage() {
  const navigate = useNavigate();
  
  const milestones = [
    { year: '2009', title: 'Thành lập', desc: 'ProHouze ra đời tại TP.HCM' },
    { year: '2012', title: 'Mở rộng', desc: 'Mở chi nhánh tại Hà Nội' },
    { year: '2015', title: 'Top 10', desc: 'Lọt Top 10 đơn vị môi giới uy tín' },
    { year: '2018', title: 'Công nghệ', desc: 'Ra mắt nền tảng CRM hiện đại' },
    { year: '2022', title: '30,000 KH', desc: 'Cột mốc 30,000 khách hàng' },
    { year: '2025', title: '#1 SEA', desc: 'BĐS tốt nhất Đông Nam Á' },
  ];

  const values = [
    { icon: CheckCircle2, title: 'Tín nhiệm', desc: 'Giữ vững niềm tin bằng cam kết và hành động thực tế' },
    { icon: Shield, title: 'Uy tín', desc: 'Cam kết minh bạch và trung thực trong mọi giao dịch' },
    { icon: Target, title: 'Chuyên nghiệp', desc: 'Dịch vụ chuẩn quốc tế, đội ngũ được đào tạo bài bản' },
    { icon: TrendingUp, title: 'Đổi mới', desc: 'Không ngừng cải tiến và sáng tạo để phục vụ tốt hơn' },
  ];

  const leaders = [
    { name: 'Nguyễn Văn A', role: 'Chủ tịch HĐQT', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300' },
    { name: 'Trần Thị B', role: 'Tổng Giám đốc', image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300' },
    { name: 'Lê Văn C', role: 'Giám đốc Kinh doanh', image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300' },
    { name: 'Phạm Thị D', role: 'Giám đốc Marketing', image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300' },
  ];

  return (
    <div className="min-h-screen" data-testid="about-page">
      <WebsiteHeader transparent />
      
      {/* Hero */}
      <section className="relative h-[50vh] lg:h-[60vh] flex items-center bg-[#316585]">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{ backgroundImage: `url('https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1920')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#316585]/50 to-[#316585]" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="inline-block text-white/70 text-sm font-semibold uppercase tracking-wider mb-4">Về chúng tôi</span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
            15+ NĂM KIẾN TẠO GIÁ TRỊ
          </h1>
          <p className="text-base lg:text-lg text-white/80 max-w-2xl mx-auto">
            ProHouze - Đối tác tin cậy trong hành trình tìm kiếm ngôi nhà mơ ước và cơ hội đầu tư sinh lời
          </p>
        </div>
      </section>

      {/* Story */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div>
              <span className="text-[#316585] text-sm font-semibold uppercase tracking-wider">Câu chuyện</span>
              <h2 className="text-2xl lg:text-3xl font-bold text-slate-900 mt-4 mb-6">Hành trình 15 năm</h2>
              <div className="space-y-4 text-slate-600">
                <p>
                  Được thành lập năm 2009, ProHouze khởi đầu là một công ty môi giới nhỏ tại TP.HCM 
                  với tầm nhìn trở thành đơn vị môi giới bất động sản hàng đầu Việt Nam.
                </p>
                <p>
                  Sau 15 năm phát triển, chúng tôi tự hào đã đồng hành cùng hơn 50,000 khách hàng, 
                  phân phối thành công hơn 200 dự án từ các chủ đầu tư uy tín nhất.
                </p>
                <p>
                  Với mạng lưới 30+ chi nhánh trên toàn quốc và đội ngũ 500+ chuyên viên, 
                  ProHouze cam kết mang đến dịch vụ tư vấn bất động sản chuyên nghiệp nhất.
                </p>
              </div>
              <Button 
                className="mt-6 bg-[#316585] hover:bg-[#264a5e] text-white"
                onClick={() => navigate('/contact')}
              >
                Liên hệ ngay
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
            <div className="relative">
              <img loading="lazy"
                src="https://images.unsplash.com/photo-1497366216548-37526070297c?w=800"
                alt="ProHouze Office"
                className="rounded-2xl shadow-xl w-full h-[350px] lg:h-[450px] object-cover"
              />
              {/* Stats overlay */}
              <div className="absolute -bottom-6 left-6 right-6 bg-white rounded-xl shadow-xl p-6 grid grid-cols-3 gap-4">
                {[
                  { value: '50K+', label: 'Khách hàng' },
                  { value: '200+', label: 'Dự án' },
                  { value: '30+', label: 'Chi nhánh' },
                ].map((stat, i) => (
                  <div key={i} className="text-center">
                    <p className="text-xl lg:text-2xl font-bold text-[#316585]">{stat.value}</p>
                    <p className="text-xs text-slate-500">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Milestones */}
      <section className="py-16 lg:py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-[#316585] text-sm font-semibold uppercase tracking-wider">Cột mốc</span>
            <h2 className="text-2xl lg:text-3xl font-bold text-slate-900 mt-4">Hành trình phát triển</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 lg:gap-6">
            {milestones.map((m, i) => (
              <div 
                key={i} 
                data-testid={`milestone-${i}`}
                className="text-center p-5 lg:p-6 bg-white rounded-xl shadow-sm border border-slate-100 hover:shadow-md hover:border-[#316585]/20 transition-all"
              >
                <p className="text-xl lg:text-2xl font-bold text-[#316585]">{m.year}</p>
                <p className="font-semibold text-slate-900 mt-2 text-sm">{m.title}</p>
                <p className="text-xs text-slate-500 mt-1">{m.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-[#316585] text-sm font-semibold uppercase tracking-wider">Giá trị cốt lõi</span>
            <h2 className="text-2xl lg:text-3xl font-bold text-slate-900 mt-4">Điều làm nên ProHouze</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {values.map((v, i) => (
              <div 
                key={i} 
                data-testid={`value-${i}`}
                className="text-center p-6 rounded-xl hover:bg-slate-50 transition-colors"
              >
                <div className="w-14 h-14 lg:w-16 lg:h-16 rounded-xl bg-[#316585] flex items-center justify-center mx-auto mb-4">
                  <v.icon className="h-7 w-7 lg:h-8 lg:w-8 text-white" />
                </div>
                <h3 className="font-bold text-slate-900 mb-2">{v.title}</h3>
                <p className="text-slate-600 text-sm">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Leadership */}
      <section className="py-16 lg:py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-[#316585] text-sm font-semibold uppercase tracking-wider">Đội ngũ lãnh đạo</span>
            <h2 className="text-2xl lg:text-3xl font-bold text-slate-900 mt-4">Ban điều hành</h2>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {leaders.map((leader, i) => (
              <div key={i} className="text-center" data-testid={`leader-${i}`}>
                <img loading="lazy"
                  src={leader.image}
                  alt={leader.name}
                  className="w-28 h-28 lg:w-36 lg:h-36 rounded-full mx-auto object-cover shadow-lg mb-4"
                />
                <h3 className="font-bold text-slate-900 text-sm lg:text-base">{leader.name}</h3>
                <p className="text-[#316585] text-xs lg:text-sm">{leader.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 lg:py-20 bg-[#316585]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl lg:text-3xl font-bold text-white mb-4">
            Sẵn sàng bắt đầu hành trình cùng ProHouze?
          </h2>
          <p className="text-white/80 mb-8">
            Liên hệ ngay để được tư vấn miễn phí về các dự án bất động sản tiềm năng nhất
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg"
              className="bg-white text-[#316585] hover:bg-slate-100"
              onClick={() => navigate('/contact')}
            >
              Liên hệ tư vấn
            </Button>
            <Button 
              size="lg"
              variant="outline"
              className="border-white text-white hover:bg-white/10 bg-transparent"
              onClick={() => navigate('/projects')}
            >
              Xem dự án
            </Button>
          </div>
        </div>
      </section>

      <WebsiteFooter />
    </div>
  );
}

// Export Header and Footer for backward compatibility
export { WebsiteHeader as Header, WebsiteFooter as Footer } from './SharedComponents';
