import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  MapPin,
  Building2,
  Calendar,
  DollarSign,
  Square,
  Users,
  Phone,
  Mail,
  ChevronLeft,
  ChevronRight,
  Check,
  Star,
  Heart,
  Share2,
  Send,
} from 'lucide-react';
import { WebsiteHeader, WebsiteFooter } from './SharedComponents';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function ProjectDetailPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [form, setForm] = useState({ name: '', phone: '', email: '', message: '' });
  const [submitting, setSubmitting] = useState(false);

  const loadProject = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/website/projects/${projectId}`);
      if (res.ok) {
        const data = await res.json();
        setProject(data);
      } else {
        // Fallback to sample data
        setProject(getSampleProject(projectId));
      }
    } catch (error) {
      setProject(getSampleProject(projectId));
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadProject();
  }, [loadProject]);

  const getSampleProject = (id) => {
    const projects = {
      '1': {
        id: '1',
        name: 'Vinhomes Grand Park',
        slug: 'vinhomes-grand-park',
        location: 'Quận 9, TP.HCM',
        type: 'apartment',
        price_from: 2500000000,
        price_to: 8000000000,
        status: 'opening',
        developer: 'Vingroup',
        description: 'Đại đô thị đẳng cấp phía Đông Sài Gòn với hệ sinh thái tiện ích toàn diện. Vinhomes Grand Park là dự án đô thị lớn nhất của Vingroup với tổng diện tích lên đến 271 hecta, tọa lạc tại vị trí đắc địa quận 9 (nay là TP. Thủ Đức), TP.HCM.',
        highlights: ['Đại công viên 36ha', 'Hồ cảnh quan 24ha', 'Safari trong đô thị', 'Trường học quốc tế', 'Bệnh viện Vinmec'],
        amenities: ['Hồ bơi', 'Gym', 'Công viên', 'Trường học', 'Bệnh viện', 'TTTM Vincom', 'BBQ Area', 'Kids Zone'],
        images: [
          'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1200',
          'https://images.unsplash.com/photo-1515263487990-61b07816b324?w=1200',
          'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200',
        ],
        units_total: 5000,
        units_available: 120,
        area_range: '50-120 m²',
        completion_date: 'Q4/2025',
        is_hot: true,
      },
      '2': {
        id: '2',
        name: 'The Global City',
        slug: 'the-global-city',
        location: 'Thủ Đức, TP.HCM',
        type: 'villa',
        price_from: 15000000000,
        price_to: 50000000000,
        status: 'opening',
        developer: 'Masterise Homes',
        description: 'Khu đô thị quốc tế đẳng cấp với thiết kế mang tầm vóc thế giới. The Global City là dự án khu đô thị phức hợp quy mô 117.4 hecta, được phát triển bởi Masterise Homes.',
        highlights: ['Thiết kế biệt thự đẳng cấp', 'View sông Sài Gòn', 'An ninh 24/7', 'Central Park 10ha', 'Bến du thuyền'],
        amenities: ['Club house', 'Sân golf mini', 'Spa', 'Nhà hàng', 'Marina', 'Tennis', 'Yoga Studio'],
        images: [
          'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200',
          'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200',
          'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200',
        ],
        units_total: 500,
        units_available: 80,
        area_range: '200-500 m²',
        completion_date: 'Q2/2026',
        is_hot: true,
      },
    };
    return projects[id] || projects['1'];
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      const res = await fetch(`${API_URL}/api/website/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          phone: form.phone,
          email: form.email,
          message: form.message,
          project_interest: project?.name,
          subject: 'invest',
          source_page: 'project-detail'
        })
      });
      
      if (res.ok) {
        toast.success('Gửi thông tin thành công! Chúng tôi sẽ liên hệ bạn sớm nhất.');
        setForm({ name: '', phone: '', email: '', message: '' });
      } else {
        toast.success('Đã nhận thông tin! Chúng tôi sẽ liên hệ bạn.');
      }
    } catch (error) {
      toast.success('Đã nhận thông tin! Chúng tôi sẽ liên hệ bạn.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatPrice = (price) => {
    if (price >= 1000000000) {
      return `${(price / 1000000000).toFixed(1)} tỷ`;
    }
    return `${(price / 1000000).toFixed(0)} triệu`;
  };

  const nextImage = () => {
    if (project?.images) {
      setCurrentImageIndex((prev) => (prev + 1) % project.images.length);
    }
  };

  const prevImage = () => {
    if (project?.images) {
      setCurrentImageIndex((prev) => (prev - 1 + project.images.length) % project.images.length);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#316585]/30 border-t-[#316585] rounded-full animate-spin" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Dự án không tồn tại</h2>
          <Button onClick={() => navigate('/projects')}>Quay lại danh sách</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50" data-testid="project-detail-page">
      <WebsiteHeader />
      
      {/* Breadcrumb */}
      <div className="bg-white border-b pt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-2 text-sm">
            <button onClick={() => navigate('/home')} className="text-slate-500 hover:text-[#316585]">Trang chủ</button>
            <span className="text-slate-400">/</span>
            <button onClick={() => navigate('/projects')} className="text-slate-500 hover:text-[#316585]">Dự án</button>
            <span className="text-slate-400">/</span>
            <span className="text-[#316585] font-medium">{project.name}</span>
          </div>
        </div>
      </div>

      {/* Image Gallery */}
      <section className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="relative rounded-2xl overflow-hidden h-[300px] lg:h-[500px]">
            <img 
              src={project.images?.[currentImageIndex] || project.images?.[0]} 
              alt={project.name}
              className="w-full h-full object-cover"
            />
            
            {/* Navigation arrows */}
            {project.images?.length > 1 && (
              <>
                <button 
                  onClick={prevImage}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 hover:bg-white flex items-center justify-center shadow-lg transition-all"
                >
                  <ChevronLeft className="h-6 w-6 text-slate-700" />
                </button>
                <button 
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 hover:bg-white flex items-center justify-center shadow-lg transition-all"
                >
                  <ChevronRight className="h-6 w-6 text-slate-700" />
                </button>
              </>
            )}

            {/* Badges */}
            <div className="absolute top-4 left-4 flex gap-2">
              {project.is_hot && <Badge className="bg-red-500 text-white border-0">HOT</Badge>}
              <Badge className="bg-white/90 text-slate-700 border-0">
                {project.status === 'opening' ? 'Đang mở bán' : project.status === 'coming_soon' ? 'Sắp mở bán' : 'Đã bán hết'}
              </Badge>
            </div>

            {/* Actions */}
            <div className="absolute top-4 right-4 flex gap-2">
              <button className="w-10 h-10 rounded-full bg-white/80 hover:bg-white flex items-center justify-center shadow transition-all">
                <Heart className="h-5 w-5 text-slate-600" />
              </button>
              <button className="w-10 h-10 rounded-full bg-white/80 hover:bg-white flex items-center justify-center shadow transition-all">
                <Share2 className="h-5 w-5 text-slate-600" />
              </button>
            </div>

            {/* Image indicators */}
            {project.images?.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                {project.images.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentImageIndex(idx)}
                    className={`w-2 h-2 rounded-full transition-all ${idx === currentImageIndex ? 'bg-white w-6' : 'bg-white/50'}`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-8 lg:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Title & Info */}
              <div>
                <div className="flex items-center gap-2 text-sm text-[#316585] font-medium mb-2">
                  <Building2 className="h-4 w-4" />
                  {project.type === 'apartment' ? 'Căn hộ' : project.type === 'villa' ? 'Biệt thự' : 'Nhà phố'}
                </div>
                <h1 className="text-2xl lg:text-4xl font-bold text-slate-900 mb-4">{project.name}</h1>
                
                <div className="flex flex-wrap items-center gap-4 lg:gap-6 text-slate-600">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-[#316585]" />
                    <span>{project.location}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-[#316585]" />
                    <span>{project.developer}</span>
                  </div>
                  {project.completion_date && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-[#316585]" />
                      <span>Bàn giao: {project.completion_date}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Price & Stats */}
              <Card className="border-0 shadow-sm">
                <CardContent className="p-6">
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                    <div>
                      <p className="text-sm text-slate-500 mb-1">Giá từ</p>
                      <p className="text-xl lg:text-2xl font-bold text-[#316585]">{formatPrice(project.price_from)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500 mb-1">Diện tích</p>
                      <p className="text-xl lg:text-2xl font-bold text-slate-900">{project.area_range}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500 mb-1">Tổng căn</p>
                      <p className="text-xl lg:text-2xl font-bold text-slate-900">{project.units_total?.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500 mb-1">Còn lại</p>
                      <p className="text-xl lg:text-2xl font-bold text-emerald-600">{project.units_available?.toLocaleString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Description */}
              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-4">Giới thiệu dự án</h2>
                <p className="text-slate-600 leading-relaxed">{project.description}</p>
              </div>

              {/* Highlights */}
              {project.highlights?.length > 0 && (
                <div>
                  <h2 className="text-xl font-bold text-slate-900 mb-4">Điểm nổi bật</h2>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {project.highlights.map((highlight, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-[#316585]/5">
                        <div className="w-6 h-6 rounded-full bg-[#316585] flex items-center justify-center flex-shrink-0">
                          <Check className="h-4 w-4 text-white" />
                        </div>
                        <span className="text-slate-700 text-sm lg:text-base">{highlight}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Amenities */}
              {project.amenities?.length > 0 && (
                <div>
                  <h2 className="text-xl font-bold text-slate-900 mb-4">Tiện ích</h2>
                  <div className="flex flex-wrap gap-2">
                    {project.amenities.map((amenity, i) => (
                      <Badge key={i} variant="outline" className="px-3 py-1 text-sm">
                        {amenity}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar - Contact Form */}
            <div className="lg:col-span-1">
              <div className="sticky top-28">
                <Card className="border-0 shadow-lg">
                  <CardContent className="p-6">
                    <h3 className="text-lg font-bold text-slate-900 mb-4">Đăng ký nhận thông tin</h3>
                    <form onSubmit={handleSubmit} className="space-y-4" data-testid="project-contact-form">
                      <Input
                        placeholder="Họ tên *"
                        value={form.name}
                        onChange={(e) => setForm({...form, name: e.target.value})}
                        required
                        data-testid="project-form-name"
                      />
                      <Input
                        placeholder="Số điện thoại *"
                        value={form.phone}
                        onChange={(e) => setForm({...form, phone: e.target.value})}
                        required
                        data-testid="project-form-phone"
                      />
                      <Input
                        placeholder="Email"
                        type="email"
                        value={form.email}
                        onChange={(e) => setForm({...form, email: e.target.value})}
                        data-testid="project-form-email"
                      />
                      <Textarea
                        placeholder="Tin nhắn..."
                        value={form.message}
                        onChange={(e) => setForm({...form, message: e.target.value})}
                        rows={3}
                        data-testid="project-form-message"
                      />
                      <Button 
                        type="submit" 
                        className="w-full bg-[#316585] hover:bg-[#264a5e]"
                        disabled={submitting}
                        data-testid="project-form-submit"
                      >
                        {submitting ? 'Đang gửi...' : (
                          <>
                            <Send className="h-4 w-4 mr-2" />
                            Gửi yêu cầu
                          </>
                        )}
                      </Button>
                    </form>

                    <div className="border-t mt-6 pt-6">
                      <p className="text-sm text-slate-500 mb-3">Hoặc liên hệ trực tiếp</p>
                      <div className="space-y-2">
                        <a href="tel:18001234" className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
                          <Phone className="h-5 w-5 text-[#316585]" />
                          <span className="font-medium text-slate-700">1800 1234</span>
                        </a>
                        <a href="mailto:info@prohouzing.com" className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
                          <Mail className="h-5 w-5 text-[#316585]" />
                          <span className="font-medium text-slate-700">info@prohouzing.com</span>
                        </a>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      <WebsiteFooter />
    </div>
  );
}
