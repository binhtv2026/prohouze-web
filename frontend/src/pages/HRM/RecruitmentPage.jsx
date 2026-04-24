import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import {
  Plus,
  Briefcase,
  Users,
  Building2,
  MapPin,
  Calendar,
  DollarSign,
  Clock,
  Eye,
  ExternalLink,
  Share2,
  Send,
  UserPlus,
  CheckCircle2,
  XCircle,
  Video,
  FileText,
  Search,
  Filter,
  Copy,
} from 'lucide-react';
import { toast } from 'sonner';

const DEMO_RECRUITMENTS = [
  {
    id: 'rec-001',
    title: 'Chuyen vien kinh doanh du an',
    position_name: 'Chuyen vien kinh doanh',
    org_unit_name: 'Phong Kinh doanh 1',
    quantity: 8,
    status: 'open',
    location: 'Ho Chi Minh',
    work_type: 'fulltime',
    salary_range_min: 12000000,
    salary_range_max: 30000000,
    applications_count: 16,
    deadline: '2026-04-15'
  },
  {
    id: 'rec-002',
    title: 'Chuyen vien Marketing Performance',
    position_name: 'Chuyen vien Marketing',
    org_unit_name: 'Phong Marketing',
    quantity: 2,
    status: 'draft',
    location: 'Ho Chi Minh',
    work_type: 'hybrid',
    salary_range_min: 15000000,
    salary_range_max: 22000000,
    applications_count: 4,
    deadline: '2026-04-20'
  }
];

const DEMO_APPLICATIONS = [
  {
    id: 'app-001',
    recruitment_title: 'Chuyen vien kinh doanh du an',
    full_name: 'Vo Thanh Dat',
    email: 'thanhdat@gmail.com',
    phone: '0909000111',
    current_position: 'Sales Bat dong san',
    years_of_experience: 3,
    status: 'screening'
  },
  {
    id: 'app-002',
    recruitment_title: 'Chuyen vien Marketing Performance',
    full_name: 'Nguyen Bao Tram',
    email: 'baotram@gmail.com',
    phone: '0909222333',
    current_position: 'Digital Marketing Executive',
    years_of_experience: 2,
    status: 'interview_hr'
  }
];

const DEMO_POSITIONS = [
  { id: 'pos-001', name: 'Chuyen vien kinh doanh' },
  { id: 'pos-002', name: 'Chuyen vien Marketing' },
  { id: 'pos-003', name: 'Chuyen vien Tuyen dung' }
];

const DEMO_ORG_UNITS = [
  { id: 'org-001', name: 'Phong Kinh doanh 1' },
  { id: 'org-002', name: 'Phong Marketing' },
  { id: 'org-003', name: 'Phong Nhan su' }
];

const statusLabels = {
  draft: { label: 'Nháp', color: 'bg-slate-100 text-slate-700' },
  open: { label: 'Đang tuyển', color: 'bg-green-100 text-green-700' },
  closed: { label: 'Đã đóng', color: 'bg-red-100 text-red-700' },
  on_hold: { label: 'Tạm dừng', color: 'bg-amber-100 text-amber-700' },
  filled: { label: 'Đã tuyển đủ', color: 'bg-blue-100 text-blue-700' },
};

const applicationStatusLabels = {
  submitted: { label: 'Đã nộp', color: 'bg-slate-100 text-slate-700' },
  screening: { label: 'Sàng lọc', color: 'bg-blue-100 text-blue-700' },
  interview_hr: { label: 'PV HR', color: 'bg-purple-100 text-purple-700' },
  interview_tech: { label: 'PV Chuyên môn', color: 'bg-indigo-100 text-indigo-700' },
  interview_manager: { label: 'PV Manager', color: 'bg-cyan-100 text-cyan-700' },
  interview_bod: { label: 'PV BOD', color: 'bg-orange-100 text-orange-700' },
  assessment: { label: 'Làm test', color: 'bg-amber-100 text-amber-700' },
  offer: { label: 'Đã gửi offer', color: 'bg-emerald-100 text-emerald-700' },
  accepted: { label: 'Đã nhận', color: 'bg-green-100 text-green-700' },
  rejected: { label: 'Từ chối', color: 'bg-red-100 text-red-700' },
  withdrawn: { label: 'Rút đơn', color: 'bg-slate-100 text-slate-700' },
  onboarding: { label: 'Onboarding', color: 'bg-teal-100 text-teal-700' },
};

const workTypeLabels = {
  fulltime: 'Toàn thời gian',
  parttime: 'Bán thời gian',
  remote: 'Làm việc từ xa',
  hybrid: 'Hybrid',
};

export default function RecruitmentPage() {
  const [recruitments, setRecruitments] = useState([]);
  const [applications, setApplications] = useState([]);
  const [positions, setPositions] = useState([]);
  const [orgUnits, setOrgUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [showApplyDialog, setShowApplyDialog] = useState(false);
  const [selectedRecruitment, setSelectedRecruitment] = useState(null);
  const [activeTab, setActiveTab] = useState('recruitments');
  const [filters, setFilters] = useState({
    status: 'all',
    search: '',
  });

  const [formData, setFormData] = useState({
    title: '',
    position_id: '',
    org_unit_id: '',
    quantity: 1,
    job_description: '',
    requirements: '',
    benefits: '',
    salary_range_min: '',
    salary_range_max: '',
    salary_negotiable: true,
    location: 'Hồ Chí Minh',
    work_type: 'fulltime',
    deadline: '',
    is_published: false,
  });

  const [applyFormData, setApplyFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    cv_url: '',
    cover_letter: '',
    years_of_experience: 0,
    current_company: '',
    current_position: '',
    expected_salary: '',
  });

  const fetchRecruitments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/hrm-advanced/recruitments');
      setRecruitments(Array.isArray(res.data) && res.data.length > 0 ? res.data : DEMO_RECRUITMENTS);
    } catch (error) {
      console.error('Error:', error);
      setRecruitments(DEMO_RECRUITMENTS);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchApplications = useCallback(async () => {
    try {
      const res = await api.get('/hrm-advanced/applications');
      setApplications(Array.isArray(res.data) && res.data.length > 0 ? res.data : DEMO_APPLICATIONS);
    } catch (error) {
      console.error('Error:', error);
      setApplications(DEMO_APPLICATIONS);
    }
  }, []);

  const fetchPositions = useCallback(async () => {
    try {
      const res = await api.get('/hrm/positions');
      setPositions(Array.isArray(res.data) && res.data.length > 0 ? res.data : DEMO_POSITIONS);
    } catch (error) {
      console.error('Error:', error);
      setPositions(DEMO_POSITIONS);
    }
  }, []);

  const fetchOrgUnits = useCallback(async () => {
    try {
      const res = await api.get('/hrm/org-units');
      setOrgUnits(Array.isArray(res.data) && res.data.length > 0 ? res.data : DEMO_ORG_UNITS);
    } catch (error) {
      console.error('Error:', error);
      setOrgUnits(DEMO_ORG_UNITS);
    }
  }, []);

  useEffect(() => {
    fetchRecruitments();
    fetchPositions();
    fetchOrgUnits();
  }, [fetchRecruitments, fetchPositions, fetchOrgUnits]);

  useEffect(() => {
    if (activeTab === 'applications') {
      fetchApplications();
    }
  }, [activeTab, fetchApplications]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        requirements: formData.requirements.split('\n').filter(r => r.trim()),
        benefits: formData.benefits.split('\n').filter(b => b.trim()),
        salary_range_min: formData.salary_range_min ? parseFloat(formData.salary_range_min) : null,
        salary_range_max: formData.salary_range_max ? parseFloat(formData.salary_range_max) : null,
      };

      await api.post('/hrm-advanced/recruitments', payload);
      toast.success('Đã tạo tin tuyển dụng');
      setShowDialog(false);
      fetchRecruitments();
      resetForm();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Không thể tạo tin tuyển dụng');
    }
  };

  const handleApply = async (e) => {
    e.preventDefault();
    try {
      await api.post('/hrm-advanced/applications', {
        ...applyFormData,
        recruitment_id: selectedRecruitment.id,
        expected_salary: applyFormData.expected_salary ? parseFloat(applyFormData.expected_salary) : null,
      });
      toast.success('Đã nộp đơn ứng tuyển thành công!');
      setShowApplyDialog(false);
      resetApplyForm();
    } catch (error) {
      console.error('Error:', error);
      toast.error(error.response?.data?.detail || 'Không thể nộp đơn');
    }
  };

  const handleUpdateStatus = async (applicationId, newStatus) => {
    try {
      await api.put(`/hrm-advanced/applications/${applicationId}/status?status=${newStatus}`);
      toast.success('Đã cập nhật trạng thái');
      fetchApplications();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Không thể cập nhật');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      position_id: '',
      org_unit_id: '',
      quantity: 1,
      job_description: '',
      requirements: '',
      benefits: '',
      salary_range_min: '',
      salary_range_max: '',
      salary_negotiable: true,
      location: 'Hồ Chí Minh',
      work_type: 'fulltime',
      deadline: '',
      is_published: false,
    });
  };

  const resetApplyForm = () => {
    setApplyFormData({
      full_name: '',
      email: '',
      phone: '',
      cv_url: '',
      cover_letter: '',
      years_of_experience: 0,
      current_company: '',
      current_position: '',
      expected_salary: '',
    });
    setSelectedRecruitment(null);
  };

  const formatCurrency = (value) => {
    if (!value) return 'Thương lượng';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  };

  const copyJobLink = (recruitmentId) => {
    const url = `${window.location.origin}/careers/${recruitmentId}`;
    navigator.clipboard.writeText(url);
    toast.success('Đã sao chép link');
  };

  // Stats
  const openJobs = recruitments.filter(r => r.status === 'open').length;
  const totalApplications = applications.length;
  const pendingApplications = applications.filter(a => a.status === 'submitted').length;
  const hiredCount = applications.filter(a => a.status === 'accepted').length;

  return (
    <div className="space-y-6" data-testid="recruitment-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tuyển dụng</h1>
          <p className="text-slate-500 text-sm mt-1">Quản lý tin tuyển dụng và ứng viên</p>
        </div>
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button data-testid="add-recruitment-btn">
              <Plus className="h-4 w-4 mr-2" />
              Tạo tin tuyển dụng
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-blue-600" />
                Tạo Tin Tuyển dụng
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Tiêu đề *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="VD: Tuyển Nhân viên Kinh doanh BĐS"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Vị trí *</Label>
                  <Select value={formData.position_id} onValueChange={(v) => setFormData({ ...formData, position_id: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn vị trí" />
                    </SelectTrigger>
                    <SelectContent>
                      {positions.map((pos) => (
                        <SelectItem key={pos.id} value={pos.id}>{pos.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Phòng ban *</Label>
                  <Select value={formData.org_unit_id} onValueChange={(v) => setFormData({ ...formData, org_unit_id: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn phòng ban" />
                    </SelectTrigger>
                    <SelectContent>
                      {orgUnits.map((unit) => (
                        <SelectItem key={unit.id} value={unit.id}>{unit.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Số lượng</Label>
                  <Input
                    type="number"
                    min="1"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <Label>Địa điểm</Label>
                  <Input
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Hình thức</Label>
                  <Select value={formData.work_type} onValueChange={(v) => setFormData({ ...formData, work_type: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(workTypeLabels).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Mô tả công việc *</Label>
                <Textarea
                  value={formData.job_description}
                  onChange={(e) => setFormData({ ...formData, job_description: e.target.value })}
                  placeholder="Mô tả chi tiết công việc..."
                  rows={4}
                  required
                />
              </div>

              <div>
                <Label>Yêu cầu ứng viên (mỗi dòng 1 yêu cầu)</Label>
                <Textarea
                  value={formData.requirements}
                  onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                  placeholder="- Tốt nghiệp ĐH&#10;- 1+ năm kinh nghiệm&#10;- Kỹ năng giao tiếp tốt"
                  rows={4}
                />
              </div>

              <div>
                <Label>Quyền lợi (mỗi dòng 1 quyền lợi)</Label>
                <Textarea
                  value={formData.benefits}
                  onChange={(e) => setFormData({ ...formData, benefits: e.target.value })}
                  placeholder="- Lương thưởng hấp dẫn&#10;- BHXH, BHYT đầy đủ&#10;- Du lịch hàng năm"
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Lương từ (VNĐ)</Label>
                  <Input
                    type="number"
                    value={formData.salary_range_min}
                    onChange={(e) => setFormData({ ...formData, salary_range_min: e.target.value })}
                    placeholder="10,000,000"
                  />
                </div>
                <div>
                  <Label>Lương đến (VNĐ)</Label>
                  <Input
                    type="number"
                    value={formData.salary_range_max}
                    onChange={(e) => setFormData({ ...formData, salary_range_max: e.target.value })}
                    placeholder="20,000,000"
                  />
                </div>
                <div>
                  <Label>Hạn nộp hồ sơ</Label>
                  <Input
                    type="date"
                    value={formData.deadline}
                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                  Huỷ
                </Button>
                <Button type="submit">Tạo tin</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-100">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                <Briefcase className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-blue-600">Đang tuyển</p>
                <p className="text-2xl font-bold text-blue-700">{openJobs}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-50 to-white border-purple-100">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-purple-600">Tổng ứng viên</p>
                <p className="text-2xl font-bold text-purple-700">{totalApplications}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-amber-50 to-white border-amber-100">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center">
                <Clock className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-amber-600">Chờ xử lý</p>
                <p className="text-2xl font-bold text-amber-700">{pendingApplications}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-50 to-white border-green-100">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-green-600">Đã tuyển</p>
                <p className="text-2xl font-bold text-green-700">{hiredCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="recruitments">Tin tuyển dụng</TabsTrigger>
          <TabsTrigger value="applications">Đơn ứng tuyển</TabsTrigger>
        </TabsList>

        <TabsContent value="recruitments" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Danh sách Tin tuyển dụng</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-slate-500">Đang tải...</div>
              ) : recruitments.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <Briefcase className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                  <p>Chưa có tin tuyển dụng nào</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recruitments.map((rec) => {
                    const statusInfo = statusLabels[rec.status] || statusLabels.draft;

                    return (
                      <div key={rec.id} className="p-4 rounded-lg border hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-medium text-slate-900">{rec.title}</p>
                              <Badge className={statusInfo.color}>{statusInfo.label}</Badge>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-slate-500">
                              <span className="flex items-center gap-1">
                                <Building2 className="h-4 w-4" />
                                {rec.org_unit_name}
                              </span>
                              <span className="flex items-center gap-1">
                                <MapPin className="h-4 w-4" />
                                {rec.location}
                              </span>
                              <span className="flex items-center gap-1">
                                <Users className="h-4 w-4" />
                                {rec.quantity} vị trí
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-blue-600">
                              {rec.salary_range_min && rec.salary_range_max
                                ? `${(rec.salary_range_min / 1000000).toFixed(0)}-${(rec.salary_range_max / 1000000).toFixed(0)}M`
                                : 'Thương lượng'}
                            </p>
                            <p className="text-xs text-slate-500">{workTypeLabels[rec.work_type]}</p>
                          </div>
                        </div>

                        <div className="mt-4 flex items-center justify-between">
                          <div className="flex items-center gap-4 text-sm">
                            <span className="text-slate-500">
                              <span className="font-medium text-slate-900">{rec.total_applications}</span> ứng viên
                            </span>
                            <span className="text-green-600">
                              <span className="font-medium">{rec.hired}</span> đã tuyển
                            </span>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => copyJobLink(rec.id)}>
                              <Copy className="h-4 w-4 mr-1" />
                              Copy link
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedRecruitment(rec);
                                setShowApplyDialog(true);
                              }}
                            >
                              <UserPlus className="h-4 w-4 mr-1" />
                              Thêm ứng viên
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="applications" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Danh sách Ứng viên</CardTitle>
            </CardHeader>
            <CardContent>
              {applications.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <Users className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                  <p>Chưa có ứng viên nào</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {applications.map((app) => {
                    const statusInfo = applicationStatusLabels[app.status] || applicationStatusLabels.submitted;

                    return (
                      <div key={app.id} className="p-4 rounded-lg border hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-4">
                            <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center">
                              <span className="text-lg font-medium text-slate-600">
                                {app.full_name?.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-medium text-slate-900">{app.full_name}</p>
                                <Badge className={statusInfo.color}>{statusInfo.label}</Badge>
                              </div>
                              <p className="text-sm text-slate-500">{app.recruitment_title}</p>
                              <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                                <span>{app.email}</span>
                                <span>{app.phone}</span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-slate-500">
                              {app.years_of_experience} năm KN
                            </p>
                            {app.expected_salary && (
                              <p className="text-sm font-medium text-blue-600">
                                {formatCurrency(app.expected_salary)}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="mt-4 pt-4 border-t flex items-center justify-between">
                          <div className="text-xs text-slate-500">
                            Nộp: {new Date(app.submitted_at).toLocaleDateString('vi-VN')}
                          </div>
                          <div className="flex gap-2">
                            {app.cv_url && (
                              <Button size="sm" variant="outline" asChild>
                                <a href={app.cv_url} target="_blank" rel="noopener noreferrer">
                                  <FileText className="h-4 w-4 mr-1" />
                                  Xem CV
                                </a>
                              </Button>
                            )}
                            <Select
                              value={app.status}
                              onValueChange={(v) => handleUpdateStatus(app.id, v)}
                            >
                              <SelectTrigger className="w-40 h-8">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {Object.entries(applicationStatusLabels).map(([key, val]) => (
                                  <SelectItem key={key} value={key}>{val.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Apply Dialog */}
      <Dialog open={showApplyDialog} onOpenChange={setShowApplyDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Thêm Ứng viên</DialogTitle>
            <DialogDescription>{selectedRecruitment?.title}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleApply} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Họ tên *</Label>
                <Input
                  value={applyFormData.full_name}
                  onChange={(e) => setApplyFormData({ ...applyFormData, full_name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>Email *</Label>
                <Input
                  type="email"
                  value={applyFormData.email}
                  onChange={(e) => setApplyFormData({ ...applyFormData, email: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Số điện thoại *</Label>
                <Input
                  value={applyFormData.phone}
                  onChange={(e) => setApplyFormData({ ...applyFormData, phone: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>Số năm kinh nghiệm</Label>
                <Input
                  type="number"
                  value={applyFormData.years_of_experience}
                  onChange={(e) => setApplyFormData({ ...applyFormData, years_of_experience: Number(e.target.value) })}
                />
              </div>
            </div>
            <div>
              <Label>Link CV (Google Drive, Dropbox...)</Label>
              <Input
                value={applyFormData.cv_url}
                onChange={(e) => setApplyFormData({ ...applyFormData, cv_url: e.target.value })}
                placeholder="https://drive.google.com/..."
              />
            </div>
            <div>
              <Label>Thư giới thiệu</Label>
              <Textarea
                value={applyFormData.cover_letter}
                onChange={(e) => setApplyFormData({ ...applyFormData, cover_letter: e.target.value })}
                rows={3}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => setShowApplyDialog(false)}>
                Huỷ
              </Button>
              <Button type="submit">Nộp đơn</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Interview Process Guide */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="h-5 w-5 text-indigo-600" />
            Quy trình Tuyển dụng
          </CardTitle>
          <CardDescription>Các vòng phỏng vấn và đánh giá ứng viên</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 overflow-x-auto py-4">
            {[
              { step: 1, label: 'Sàng lọc CV', icon: FileText },
              { step: 2, label: 'Phỏng vấn HR', icon: Users },
              { step: 3, label: 'Phỏng vấn Chuyên môn', icon: Briefcase },
              { step: 4, label: 'Làm bài Test', icon: FileText },
              { step: 5, label: 'Phỏng vấn Manager', icon: Building2 },
              { step: 6, label: 'Video Training', icon: Video },
              { step: 7, label: 'Onboarding', icon: CheckCircle2 },
            ].map((item, idx) => (
              <React.Fragment key={item.step}>
                <div className="flex flex-col items-center min-w-[100px]">
                  <div className={`h-12 w-12 rounded-full flex items-center justify-center ${idx === 0 ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                    <item.icon className="h-5 w-5" />
                  </div>
                  <p className="text-xs mt-2 text-center">{item.label}</p>
                </div>
                {idx < 6 && (
                  <div className="h-0.5 w-8 bg-slate-200 flex-shrink-0" />
                )}
              </React.Fragment>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
