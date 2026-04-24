import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  Send,
  MessageSquare,
} from 'lucide-react';
import { WebsiteHeader, WebsiteFooter } from './SharedComponents';
import { toast } from 'sonner';

export default function ContactPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    subject: '',
    message: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    setTimeout(() => {
      toast.success('Gửi thông tin thành công! Chúng tôi sẽ liên hệ bạn sớm nhất.');
      setForm({ name: '', phone: '', email: '', subject: '', message: '' });
      setLoading(false);
    }, 1500);
  };

  const offices = [
    {
      city: 'TP. Hồ Chí Minh',
      address: 'Tầng 25, Landmark 81, Vinhomes Central Park, Q. Bình Thạnh',
      phone: '(028) 3820 1234',
      email: 'hcm@prohouzing.com',
      isHQ: true,
    },
    {
      city: 'Hà Nội',
      address: 'Tầng 18, Keangnam Landmark Tower, Nam Từ Liêm',
      phone: '(024) 3795 5678',
      email: 'hanoi@prohouzing.com',
      isHQ: false,
    },
    {
      city: 'Đà Nẵng',
      address: 'Tầng 10, Indochina Riverside Tower, Q. Hải Châu',
      phone: '(0236) 382 9999',
      email: 'danang@prohouzing.com',
      isHQ: false,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50" data-testid="contact-page">
      <WebsiteHeader />
      
      {/* Hero */}
      <section className="relative h-[40vh] flex items-center bg-[#316585]">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{ backgroundImage: `url('https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1920')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#316585]/50 to-[#316585]" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-16">
          <span className="inline-block text-white/70 text-sm font-semibold uppercase tracking-wider mb-4">Liên hệ</span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
            KẾT NỐI VỚI CHÚNG TÔI
          </h1>
          <p className="text-base lg:text-lg text-white/80 max-w-2xl mx-auto">
            Đội ngũ tư vấn ProHouze luôn sẵn sàng hỗ trợ bạn 24/7
          </p>
        </div>
      </section>

      {/* Contact Info */}
      <section className="py-10 lg:py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-6">
            {[
              { icon: Phone, title: 'Hotline', value: '1800 1234', sub: 'Miễn phí 24/7' },
              { icon: Mail, title: 'Email', value: 'info@prohouzing.com', sub: 'Phản hồi trong 24h' },
              { icon: Clock, title: 'Giờ làm việc', value: '8:00 - 20:00', sub: 'Thứ 2 - Chủ nhật' },
              { icon: MessageSquare, title: 'Live Chat', value: 'Chat ngay', sub: 'Hỗ trợ trực tuyến' },
            ].map((item, i) => (
              <Card 
                key={i} 
                data-testid={`contact-info-${i}`}
                className="text-center p-4 lg:p-6 hover:shadow-md transition-shadow border-0 shadow-sm"
              >
                <div className="w-12 h-12 lg:w-14 lg:h-14 rounded-full bg-[#316585]/10 flex items-center justify-center mx-auto mb-3 lg:mb-4">
                  <item.icon className="h-5 w-5 lg:h-6 lg:w-6 text-[#316585]" />
                </div>
                <h3 className="font-semibold text-slate-900 text-sm lg:text-base">{item.title}</h3>
                <p className="text-[#316585] font-semibold mt-1 text-sm lg:text-base">{item.value}</p>
                <p className="text-xs text-slate-500 mt-1">{item.sub}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form & Offices */}
      <section className="py-10 lg:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-12">
            {/* Form */}
            <div>
              <h2 className="text-xl lg:text-2xl font-bold text-slate-900 mb-6">Gửi yêu cầu tư vấn</h2>
              <Card className="border-0 shadow-sm">
                <CardContent className="p-5 lg:p-6">
                  <form onSubmit={handleSubmit} className="space-y-4" data-testid="contact-form">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-slate-700">Họ và tên *</label>
                        <Input
                          value={form.name}
                          onChange={(e) => setForm({ ...form, name: e.target.value })}
                          placeholder="Nguyễn Văn A"
                          required
                          className="mt-1"
                          data-testid="contact-name"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-700">Số điện thoại *</label>
                        <Input
                          value={form.phone}
                          onChange={(e) => setForm({ ...form, phone: e.target.value })}
                          placeholder="0901 234 567"
                          required
                          className="mt-1"
                          data-testid="contact-phone"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-700">Email</label>
                      <Input
                        type="email"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        placeholder="email@example.com"
                        className="mt-1"
                        data-testid="contact-email"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-700">Chủ đề</label>
                      <Select value={form.subject} onValueChange={(v) => setForm({ ...form, subject: v })}>
                        <SelectTrigger className="mt-1" data-testid="contact-subject">
                          <SelectValue placeholder="Chọn chủ đề" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="buy">Mua bất động sản</SelectItem>
                          <SelectItem value="sell">Bán bất động sản</SelectItem>
                          <SelectItem value="rent">Thuê bất động sản</SelectItem>
                          <SelectItem value="invest">Tư vấn đầu tư</SelectItem>
                          <SelectItem value="other">Khác</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-700">Nội dung</label>
                      <Textarea
                        value={form.message}
                        onChange={(e) => setForm({ ...form, message: e.target.value })}
                        placeholder="Mô tả yêu cầu của bạn..."
                        rows={4}
                        className="mt-1"
                        data-testid="contact-message"
                      />
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full bg-[#316585] hover:bg-[#264a5e]"
                      disabled={loading}
                      data-testid="contact-submit"
                    >
                      {loading ? (
                        'Đang gửi...'
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          Gửi yêu cầu
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Offices */}
            <div>
              <h2 className="text-xl lg:text-2xl font-bold text-slate-900 mb-6">Hệ thống văn phòng</h2>
              
              {/* Map Placeholder */}
              <div className="bg-slate-200 rounded-xl h-[200px] lg:h-[250px] mb-6 flex items-center justify-center">
                <div className="text-center text-slate-500">
                  <MapPin className="h-10 w-10 lg:h-12 lg:w-12 mx-auto mb-2" />
                  <p className="font-medium">Google Maps</p>
                  <p className="text-sm">Landmark 81, TP.HCM</p>
                </div>
              </div>

              {/* Office List */}
              <div className="space-y-4">
                {offices.map((office, i) => (
                  <Card 
                    key={i} 
                    data-testid={`office-${i}`}
                    className={`border-0 shadow-sm ${office.isHQ ? 'ring-1 ring-[#316585]/30' : ''}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-[#316585]/10 flex items-center justify-center flex-shrink-0">
                          <MapPin className="h-5 w-5 text-[#316585]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-bold text-slate-900 text-sm lg:text-base">{office.city}</h3>
                            {office.isHQ && <Badge className="bg-[#316585] text-xs">Trụ sở chính</Badge>}
                          </div>
                          <p className="text-xs lg:text-sm text-slate-600 mt-1">{office.address}</p>
                          <div className="flex flex-wrap items-center gap-3 lg:gap-4 mt-2 text-xs text-slate-500">
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3" /> {office.phone}
                            </span>
                            <span className="flex items-center gap-1">
                              <Mail className="h-3 w-3" /> {office.email}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <WebsiteFooter />
    </div>
  );
}
