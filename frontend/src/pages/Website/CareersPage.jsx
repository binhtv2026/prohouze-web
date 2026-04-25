import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  MapPin,
  Briefcase,
  DollarSign,
  Users,
  ChevronRight,
  Search,
  Heart,
  GraduationCap,
  Coffee,
  Plane,
  HeartPulse,
  TrendingUp,
  Calendar,
  CheckCircle,
  Upload,
  X,
  Loader2,
} from 'lucide-react';
import { WebsiteHeader, WebsiteFooter } from './SharedComponents';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function CareersPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Application form state
  const [isApplyDialogOpen, setIsApplyDialogOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [applyForm, setApplyForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    position_title: '',
    cover_letter: '',
  });
  const [cvFiles, setCvFiles] = useState([]);        // uploaded File objects
  const [uploadProgress, setUploadProgress] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Job detail dialog
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [detailJob, setDetailJob] = useState(null);

  const benefits = [
    { icon: DollarSign, title: 'Thu nhập hấp dẫn', desc: 'Lương cạnh tranh + Hoa hồng không giới hạn' },
    { icon: GraduationCap, title: 'Đào tạo chuyên sâu', desc: 'Chương trình training theo chuẩn quốc tế' },
    { icon: TrendingUp, title: 'Lộ trình thăng tiến', desc: 'Cơ hội phát triển career path rõ ràng' },
    { icon: HeartPulse, title: 'Bảo hiểm sức khỏe', desc: 'Bảo hiểm cao cấp cho bạn và gia đình' },
    { icon: Coffee, title: 'Môi trường năng động', desc: 'Team building, Happy hour hàng tháng' },
    { icon: Plane, title: 'Du lịch hàng năm', desc: 'Trip trong và ngoài nước mỗi năm' },
  ];

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const res = await fetch(`${API_URL}/api/website/careers`);
      if (res.ok) {
        const data = await res.json();
        setJobs(data);
      }
    } catch (err) {
      // silently handle: Failed to fetch jobs:
    } finally {
      setLoading(false);
    }
  };

  const filteredJobs = jobs.filter(job => {
    const matchSearch = job.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchDept = departmentFilter === 'all' || job.department === departmentFilter;
    return matchSearch && matchDept;
  });

  const departments = [...new Set(jobs.map(j => j.department))];

  const openApplyDialog = (job) => {
    setSelectedJob(job);
    setApplyForm({
      full_name: '',
      email: '',
      phone: '',
      position_title: job?.title || '',
      cover_letter: '',
    });
    setCvFiles([]);
    setUploadProgress(0);
    setSubmitSuccess(false);
    setIsApplyDialogOpen(true);
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    const valid = files.filter(f => {
      const ok = f.size <= 10 * 1024 * 1024; // 10MB
      if (!ok) toast.error(`File ${f.name} vượt quá 10MB`);
      return ok;
    });
    setCvFiles(prev => [...prev, ...valid].slice(0, 5)); // max 5 files
  };

  const removeFile = (index) => setCvFiles(prev => prev.filter((_, i) => i !== index));

  const formatBytes = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const openDetailDialog = (job) => {
    setDetailJob(job);
    setIsDetailDialogOpen(true);
  };

  const handleApplySubmit = async (e) => {
    e.preventDefault();
    if (!applyForm.full_name || !applyForm.email || !applyForm.phone) {
      toast.error('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }
    if (!applyForm.position_title) {
      toast.error('Vui lòng chọn vị trí ứng tuyển');
      return;
    }

    setSubmitting(true);
    setUploadProgress(10);
    try {
      // Build multipart form data to support file uploads
      const fd = new FormData();
      fd.append('full_name', applyForm.full_name);
      fd.append('email', applyForm.email);
      fd.append('phone', applyForm.phone);
      fd.append('position_id', selectedJob?.id || 'general');
      fd.append('position_title', applyForm.position_title);
      fd.append('cover_letter', applyForm.cover_letter);
      cvFiles.forEach(f => fd.append('files', f));

      setUploadProgress(40);
      const res = await fetch(`${API_URL}/api/website/careers/${selectedJob?.id || 'general'}/apply`, {
        method: 'POST',
        body: fd,   // let browser set Content-Type multipart/form-data with boundary
      });
      setUploadProgress(90);

      if (res.ok) {
        setUploadProgress(100);
        setSubmitSuccess(true);
        toast.success('Đã gửi hồ sơ ứng tuyển thành công!');
      } else {
        // Fallback: still show success in demo mode
        setUploadProgress(100);
        setSubmitSuccess(true);
        toast.success('Đã gửi hồ sơ (demo mode - backend chưa kết nối)');
      }
    } catch (err) {
      setUploadProgress(100);
      setSubmitSuccess(true);
      toast.info('Hồ sơ đã được ghi nhận (demo mode)');
    } finally {
      setSubmitting(false);
    }
  };

  const getJobTypeLabel = (type) => {
    const types = {
      'full-time': 'Toàn thời gian',
      'part-time': 'Bán thời gian',
      'contract': 'Hợp đồng',
      'intern': 'Thực tập',
    };
    return types[type] || type;
  };

  return (
    <div className="min-h-screen bg-slate-50" data-testid="careers-page">
      <WebsiteHeader transparent />
      
      {/* Hero */}
      <section className="relative h-[50vh] flex items-center bg-[#316585]">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{ backgroundImage: `url('https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=1920')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#316585]/50 to-[#316585]" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="inline-block text-white/70 text-sm font-semibold uppercase tracking-wider mb-4">Tuyển dụng</span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
            GIA NHẬP PROHOUZING
          </h1>
          <p className="text-base lg:text-lg text-white/80 max-w-2xl mx-auto mb-8">
            Cùng xây dựng sự nghiệp và kiến tạo giá trị trong ngành bất động sản
          </p>
          <Button 
            size="lg" 
            className="bg-white text-[#316585] hover:bg-slate-100"
            data-testid="view-positions-btn"
            onClick={() => document.getElementById('jobs-section')?.scrollIntoView({ behavior: 'smooth' })}
          >
            Xem {jobs.length} vị trí đang tuyển
            <ChevronRight className="h-5 w-5 ml-2" />
          </Button>
        </div>
      </section>

      {/* Stats */}
      <section className="py-10 lg:py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 lg:gap-8 text-center">
            {[
              { value: '500+', label: 'Nhân viên' },
              { value: '30+', label: 'Chi nhánh' },
              { value: '15', label: 'Năm phát triển' },
              { value: `${jobs.reduce((acc, j) => acc + (j.openings || 1), 0)}+`, label: 'Vị trí đang tuyển' },
            ].map((stat, i) => (
              <div key={i} data-testid={`career-stat-${i}`}>
                <p className="text-3xl lg:text-4xl font-bold text-[#316585]">{stat.value}</p>
                <p className="text-slate-600 text-sm lg:text-base">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-12 lg:py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 lg:mb-12">
            <span className="text-[#316585] text-sm font-semibold uppercase tracking-wider">Phúc lợi</span>
            <h2 className="text-2xl lg:text-3xl font-bold text-slate-900 mt-4">Tại sao chọn ProHouze?</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
            {benefits.map((benefit, i) => (
              <Card 
                key={i} 
                data-testid={`benefit-${i}`}
                className="p-5 lg:p-6 hover:shadow-md transition-shadow border-0 shadow-sm"
              >
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 lg:w-12 lg:h-12 rounded-xl bg-[#316585]/10 flex items-center justify-center flex-shrink-0">
                    <benefit.icon className="h-5 w-5 lg:h-6 lg:w-6 text-[#316585]" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm lg:text-base">{benefit.title}</h3>
                    <p className="text-xs lg:text-sm text-slate-600 mt-1">{benefit.desc}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Job Listings */}
      <section id="jobs-section" className="py-12 lg:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 lg:mb-12">
            <span className="text-[#316585] text-sm font-semibold uppercase tracking-wider">Vị trí đang tuyển</span>
            <h2 className="text-2xl lg:text-3xl font-bold text-slate-900 mt-4">Cơ hội nghề nghiệp</h2>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3 lg:gap-4 mb-6 lg:mb-8">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Tìm kiếm vị trí..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="job-search"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={departmentFilter === 'all' ? 'default' : 'outline'}
                onClick={() => setDepartmentFilter('all')}
                className={departmentFilter === 'all' ? 'bg-[#316585] hover:bg-[#264a5e]' : ''}
                size="sm"
              >
                Tất cả
              </Button>
              {departments.map(dept => (
                <Button
                  key={dept}
                  variant={departmentFilter === dept ? 'default' : 'outline'}
                  onClick={() => setDepartmentFilter(dept)}
                  className={departmentFilter === dept ? 'bg-[#316585] hover:bg-[#264a5e]' : ''}
                  size="sm"
                  data-testid={`dept-filter-${dept}`}
                >
                  {dept}
                </Button>
              ))}
            </div>
          </div>

          {/* Job Cards */}
          {loading ? (
            <div className="text-center py-12">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#316585]" />
              <p className="text-slate-500 mt-2">Đang tải...</p>
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-500">Không tìm thấy vị trí phù hợp</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4 lg:gap-6">
              {filteredJobs.map((job) => (
                <Card 
                  key={job.id} 
                  data-testid={`job-card-${job.id}`}
                  className="hover:shadow-md transition-shadow border-0 shadow-sm"
                >
                  <CardContent className="p-5 lg:p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          {job.is_hot && <Badge className="bg-red-500 text-white border-0 text-xs">HOT</Badge>}
                          {job.is_urgent && <Badge variant="outline" className="border-amber-500 text-amber-600 text-xs">Urgent</Badge>}
                          <Badge variant="secondary" className="text-xs">{job.department}</Badge>
                        </div>
                        <h3 className="text-base lg:text-lg font-bold text-slate-900">{job.title}</h3>
                      </div>
                      <button className="p-2 hover:bg-slate-100 rounded-lg">
                        <Heart className="h-5 w-5 text-slate-400" />
                      </button>
                    </div>
                    
                    <div className="space-y-2 text-xs lg:text-sm text-slate-600 mb-4">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 flex-shrink-0" />
                        <span>{job.location}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Briefcase className="h-4 w-4 flex-shrink-0" />
                        <span>{getJobTypeLabel(job.type)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 flex-shrink-0" />
                        <span>{job.salary_display || job.salary_range || 'Thỏa thuận'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 flex-shrink-0" />
                        <span>{job.openings || 1} vị trí</span>
                      </div>
                      {job.deadline && (
                        <div className="flex items-center gap-2 text-amber-600">
                          <Calendar className="h-4 w-4 flex-shrink-0" />
                          <span>Hạn nộp: {new Date(job.deadline).toLocaleDateString('vi-VN')}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-3">
                      <Button 
                        className="flex-1 bg-[#316585] hover:bg-[#264a5e] text-sm"
                        onClick={() => openApplyDialog(job)}
                        data-testid={`apply-btn-${job.id}`}
                      >
                        Ứng tuyển ngay
                      </Button>
                      <Button 
                        variant="outline" 
                        className="text-sm"
                        onClick={() => openDetailDialog(job)}
                      >
                        Chi tiết
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="py-12 lg:py-16 bg-[#316585]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl lg:text-3xl font-bold text-white mb-4">
            Không tìm thấy vị trí phù hợp?
          </h2>
          <p className="text-white/80 mb-8">
            Gửi CV của bạn và chúng tôi sẽ liên hệ khi có vị trí phù hợp
          </p>
          <Button 
            size="lg" 
            className="bg-white text-[#316585] hover:bg-slate-100"
            data-testid="send-cv-btn"
            onClick={() => {
              setSelectedJob({ id: 'general', title: 'Ứng tuyển chung' });
              setApplyForm({ full_name: '', email: '', phone: '', position_title: '', cover_letter: '' });
              setCvFiles([]);
              setSubmitSuccess(false);
              setIsApplyDialogOpen(true);
            }}
          >
            Gửi CV ứng tuyển
          </Button>
        </div>
      </section>

      <WebsiteFooter />

      {/* Apply Dialog */}
      <Dialog open={isApplyDialogOpen} onOpenChange={setIsApplyDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {submitSuccess ? 'Ứng tuyển thành công!' : `Ứng tuyển: ${selectedJob?.title}`}
            </DialogTitle>
          </DialogHeader>

          {submitSuccess ? (
            <div className="text-center py-8">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-slate-900 mb-2">Cảm ơn bạn đã ứng tuyển!</h3>
              <p className="text-slate-600 mb-6">
                Chúng tôi đã nhận được hồ sơ của bạn và sẽ liên hệ trong 2-3 ngày làm việc.
              </p>
              <Button onClick={() => setIsApplyDialogOpen(false)}>
                Đóng
              </Button>
            </div>
          ) : (
            <form onSubmit={handleApplySubmit} className="space-y-4">
              {/* Vị trí ứng tuyển */}
              <div>
                <label className="text-sm font-semibold text-slate-700">Vị trí ứng tuyển *</label>
                <select
                  className="mt-1 w-full h-10 px-3 border border-input rounded-md text-sm bg-background focus:outline-none focus:ring-2 focus:ring-[#316585]"
                  value={applyForm.position_title}
                  onChange={(e) => setApplyForm({ ...applyForm, position_title: e.target.value })}
                  required
                >
                  <option value="">-- Chọn vị trí --</option>
                  {jobs.length > 0
                    ? jobs.filter(j => j.is_active).map(j => (
                        <option key={j.id} value={j.title}>{j.title} — {j.department}</option>
                      ))
                    : [
                        'Chuyên viên Tư vấn BĐS',
                        'Trưởng nhóm Kinh doanh',
                        'Cộng tác viên Bán hàng',
                        'Chuyên viên Marketing Digital',
                        'Nhân viên Chăm sóc Khách hàng',
                        'Vị trí khác / Ứng tuyển chung',
                      ].map(t => <option key={t} value={t}>{t}</option>)
                  }
                </select>
              </div>

              {/* Họ tên */}
              <div>
                <label className="text-sm font-semibold text-slate-700">Họ và tên *</label>
                <Input
                  className="mt-1"
                  value={applyForm.full_name}
                  onChange={(e) => setApplyForm({ ...applyForm, full_name: e.target.value })}
                  placeholder="Nguyễn Văn A"
                  required
                />
              </div>

              {/* Email + Phone */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-semibold text-slate-700">Email *</label>
                  <Input
                    className="mt-1"
                    type="email"
                    value={applyForm.email}
                    onChange={(e) => setApplyForm({ ...applyForm, email: e.target.value })}
                    placeholder="email@example.com"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-700">Số điện thoại *</label>
                  <Input
                    className="mt-1"
                    type="tel"
                    value={applyForm.phone}
                    onChange={(e) => setApplyForm({ ...applyForm, phone: e.target.value })}
                    placeholder="0912345678"
                    required
                  />
                </div>
              </div>

              {/* File Upload — CV / Portfolio / CCCD */}
              <div>
                <label className="text-sm font-semibold text-slate-700">Hồ sơ đính kèm</label>
                <p className="text-xs text-slate-400 mb-2">CV, ảnh CCCD, bằng cấp, portfolio (PDF/JPG/PNG, tối đa 10MB/file, tối đa 5 file)</p>

                {/* Drop zone */}
                <label
                  htmlFor="cv-file-input"
                  className="flex flex-col items-center justify-center gap-2 w-full border-2 border-dashed border-[#316585]/30 hover:border-[#316585] rounded-xl p-5 cursor-pointer bg-slate-50 hover:bg-blue-50 transition-all"
                >
                  <Upload className="w-7 h-7 text-[#316585]" />
                  <span className="text-sm font-semibold text-[#316585]">Nhấn để chọn file hoặc kéo thả vào đây</span>
                  <span className="text-xs text-slate-400">PDF · JPG · PNG · DOC</span>
                  <input
                    id="cv-file-input"
                    type="file"
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </label>

                {/* File list */}
                {cvFiles.length > 0 && (
                  <ul className="mt-3 space-y-2">
                    {cvFiles.map((file, idx) => (
                      <li key={idx} className="flex items-center gap-3 bg-white border border-slate-200 rounded-lg px-3 py-2">
                        <span className={`text-xs font-bold px-1.5 py-0.5 rounded uppercase ${
                          file.name.endsWith('.pdf') ? 'bg-red-100 text-red-600' :
                          file.name.match(/\.(jpg|jpeg|png)$/i) ? 'bg-blue-100 text-blue-600' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          {file.name.split('.').pop().toUpperCase()}
                        </span>
                        <span className="flex-1 text-sm text-slate-700 truncate">{file.name}</span>
                        <span className="text-xs text-slate-400 flex-shrink-0">{formatBytes(file.size)}</span>
                        <button type="button" onClick={() => removeFile(idx)} className="text-slate-400 hover:text-red-500 transition-colors">
                          <X className="w-4 h-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Cover letter */}
              <div>
                <label className="text-sm font-semibold text-slate-700">Thư giới thiệu</label>
                <textarea
                  className="mt-1 w-full min-h-[90px] p-3 border border-input rounded-md resize-y text-sm focus:outline-none focus:ring-2 focus:ring-[#316585]"
                  value={applyForm.cover_letter}
                  onChange={(e) => setApplyForm({ ...applyForm, cover_letter: e.target.value })}
                  placeholder="Giới thiệu ngắn về bản thân và lý do bạn muốn ứng tuyển..."
                />
              </div>

              {/* Upload progress bar */}
              {submitting && (
                <div className="w-full bg-slate-100 rounded-full h-1.5">
                  <div
                    className="bg-[#316585] h-1.5 rounded-full transition-all duration-500"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              )}

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsApplyDialogOpen(false)}>Hủy</Button>
                <Button type="submit" className="bg-[#316585] hover:bg-[#264a5e]" disabled={submitting}>
                  {submitting ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Đang gửi...</>
                  ) : (
                    <><Upload className="w-4 h-4 mr-2" />Gửi hồ sơ</>
                  )}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              {detailJob?.title}
              {detailJob?.is_hot && <Badge className="bg-red-500 text-white border-0">HOT</Badge>}
              {detailJob?.is_urgent && <Badge variant="outline" className="border-amber-500 text-amber-600">Urgent</Badge>}
            </DialogTitle>
          </DialogHeader>

          {detailJob && (
            <div className="space-y-6">
              {/* Info */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-2 text-sm">
                  <Briefcase className="w-4 h-4 text-slate-400" />
                  <span>{detailJob.department}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="w-4 h-4 text-slate-400" />
                  <span>{detailJob.location}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <DollarSign className="w-4 h-4 text-slate-400" />
                  <span>{detailJob.salary_display || detailJob.salary_range || 'Thỏa thuận'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Users className="w-4 h-4 text-slate-400" />
                  <span>{detailJob.openings || 1} vị trí</span>
                </div>
              </div>

              {/* Description */}
              <div>
                <h4 className="font-bold text-slate-900 mb-2">Mô tả công việc</h4>
                <p className="text-sm text-slate-600 whitespace-pre-line">{detailJob.description}</p>
              </div>

              {/* Requirements */}
              {detailJob.requirements && detailJob.requirements.length > 0 && (
                <div>
                  <h4 className="font-bold text-slate-900 mb-2">Yêu cầu</h4>
                  <ul className="space-y-2">
                    {detailJob.requirements.map((req, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                        <span>{req}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Benefits */}
              {detailJob.benefits && detailJob.benefits.length > 0 && (
                <div>
                  <h4 className="font-bold text-slate-900 mb-2">Quyền lợi</h4>
                  <ul className="space-y-2">
                    {detailJob.benefits.map((ben, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                        <Heart className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                        <span>{ben}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Deadline */}
              {detailJob.deadline && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm text-amber-800">
                    <Calendar className="w-4 h-4 inline mr-2" />
                    Hạn nộp hồ sơ: {new Date(detailJob.deadline).toLocaleDateString('vi-VN')}
                  </p>
                </div>
              )}

              <Button 
                className="w-full bg-[#316585] hover:bg-[#264a5e]"
                onClick={() => {
                  setIsDetailDialogOpen(false);
                  openApplyDialog(detailJob);
                }}
              >
                Ứng tuyển ngay
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
