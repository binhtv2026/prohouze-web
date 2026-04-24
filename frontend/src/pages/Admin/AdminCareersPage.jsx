import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Plus, Pencil, Trash2, Search, Briefcase, MapPin, Users, 
  Calendar, DollarSign, Clock, Flame, AlertCircle, Eye, RefreshCw,
  Paperclip, Download, FileText, Image as ImageIcon
} from 'lucide-react';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const DEMO_CAREERS = [
  {
    id: 'career-1',
    title: 'Chuyên viên kinh doanh bất động sản',
    department: 'Kinh doanh',
    location: 'TP.HCM',
    type: 'full-time',
    salary_min: 12000000,
    salary_max: 35000000,
    salary_display: '12 - 35 triệu + thưởng',
    description: 'Tư vấn khách hàng, follow lead và chốt giao dịch các dự án sơ cấp.',
    requirements: ['Có kinh nghiệm sales là lợi thế', 'Giao tiếp tốt', 'Chăm chỉ và bám mục tiêu'],
    benefits: ['Data khách hàng hỗ trợ', 'Đào tạo sản phẩm', 'Lộ trình lên team lead'],
    openings: 8,
    deadline: '2026-04-30',
    is_hot: true,
    is_urgent: true,
    is_active: true,
  },
  {
    id: 'career-2',
    title: 'Chuyên viên marketing performance',
    department: 'Marketing',
    location: 'TP.HCM',
    type: 'full-time',
    salary_min: 15000000,
    salary_max: 25000000,
    salary_display: '15 - 25 triệu',
    description: 'Triển khai chiến dịch đa kênh, quản trị lead và tối ưu chuyển đổi.',
    requirements: ['Có kinh nghiệm chạy ads', 'Biết đọc số liệu', 'Phối hợp tốt với sales'],
    benefits: ['Ngân sách ổn định', 'Môi trường tăng trưởng nhanh', 'Thưởng theo lead chất lượng'],
    openings: 2,
    deadline: '2026-05-15',
    is_hot: false,
    is_urgent: false,
    is_active: true,
  },
  {
    id: 'career-3',
    title: 'Chuyên viên pháp lý dự án',
    department: 'Pháp lý',
    location: 'TP.HCM',
    type: 'full-time',
    salary_min: 18000000,
    salary_max: 30000000,
    salary_display: '18 - 30 triệu',
    description: 'Phụ trách hồ sơ pháp lý, hợp đồng và tài liệu hỗ trợ bán hàng.',
    requirements: ['Kinh nghiệm pháp lý bất động sản', 'Làm việc cẩn thận', 'Phối hợp liên phòng ban tốt'],
    benefits: ['Làm việc với dự án lớn', 'Môi trường chuyên nghiệp', 'Đầy đủ chế độ'],
    openings: 1,
    deadline: '2026-05-10',
    is_hot: false,
    is_urgent: true,
    is_active: true,
  },
];

const DEMO_APPLICATIONS = [
  {
    id: 'application-1',
    full_name: 'Phạm Quốc Bảo',
    email: 'bao.ungvien@example.com',
    phone: '0909123456',
    position_title: 'Chuyên viên Tư vấn BĐS',
    cover_letter: 'Kính gửi anh/chị HR, tôi có 5 năm kinh nghiệm trong lĩnh vực bất động sản...',
    file_urls: [
      { name: 'CV_PhamQuocBao.pdf', url: '#', type: 'pdf', size: '1.2 MB' },
      { name: 'CCCD_front.jpg', url: '#', type: 'image', size: '820 KB' },
    ],
    status: 'new',
    created_at: '2026-03-24T09:30:00',
  },
  {
    id: 'application-2',
    full_name: 'Vũ Ngọc Linh',
    email: 'linh.hr@example.com',
    phone: '0911222333',
    position_title: 'Chuyên viên Marketing Digital',
    cover_letter: 'Tôi đã đồng hành cùng các agency lớn và quản lý ngân sách quảng cáo trên 2 tỷ/tháng...',
    file_urls: [
      { name: 'CV_VuNgocLinh.pdf', url: '#', type: 'pdf', size: '950 KB' },
      { name: 'Portfolio_2026.pdf', url: '#', type: 'pdf', size: '4.5 MB' },
      { name: 'Bang_cap.jpg', url: '#', type: 'image', size: '1.1 MB' },
    ],
    status: 'reviewing',
    created_at: '2026-03-23T14:15:00',
  },
  {
    id: 'application-3',
    full_name: 'Trần Minh Đăng',
    email: 'dang.ung@prohouze.com',
    phone: '0888567890',
    position_title: 'Cộng tác viên Bán hàng',
    cover_letter: '',
    file_urls: [
      { name: 'CV_TranMinhDang.docx', url: '#', type: 'doc', size: '540 KB' },
    ],
    status: 'new',
    created_at: '2026-03-25T08:00:00',
  },
];

const DEPARTMENTS = ['Kinh doanh', 'Marketing', 'CSKH', 'IT', 'Nhân sự', 'Tài chính', 'Pháp lý'];
const JOB_TYPES = [
  { value: 'full-time', label: 'Toàn thời gian' },
  { value: 'part-time', label: 'Bán thời gian' },
  { value: 'contract', label: 'Hợp đồng' },
  { value: 'intern', label: 'Thực tập' },
];

const emptyForm = {
  title: '',
  department: 'Kinh doanh',
  location: 'TP.HCM',
  type: 'full-time',
  salary_min: '',
  salary_max: '',
  salary_display: '',
  description: '',
  requirements: [''],
  benefits: [''],
  openings: 1,
  deadline: '',
  is_hot: false,
  is_urgent: false,
  is_active: true,
};

export default function AdminCareersPage() {
  const [careers, setCareers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCareer, setEditingCareer] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [applicationsDialog, setApplicationsDialog] = useState(null);
  const [applications, setApplications] = useState([]);

  const fetchCareers = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/content/careers`);
      if (!res.ok) throw new Error('Failed to fetch careers');
      const data = await res.json();
      setCareers(Array.isArray(data) && data.length > 0 ? data : DEMO_CAREERS);
    } catch (err) {
      setCareers(DEMO_CAREERS);
      toast.error('Không thể tải danh sách vị trí tuyển dụng');
    } finally {
      setLoading(false);
    }
  };

  const seedData = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/content/seed`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to seed data');
      toast.success('Đã tạo dữ liệu mẫu thành công');
      fetchCareers();
    } catch (err) {
      toast.error('Không thể tạo dữ liệu mẫu');
    }
  };

  useEffect(() => {
    fetchCareers();
  }, []);

  const filteredCareers = careers.filter(c => {
    const matchSearch = c.title.toLowerCase().includes(search.toLowerCase()) ||
                       c.department.toLowerCase().includes(search.toLowerCase());
    const matchDept = filterDepartment === 'all' || c.department === filterDepartment;
    return matchSearch && matchDept;
  });

  const openCreateDialog = () => {
    setEditingCareer(null);
    setForm(emptyForm);
    setIsDialogOpen(true);
  };

  const openEditDialog = (career) => {
    setEditingCareer(career);
    setForm({
      ...career,
      salary_min: career.salary_min || '',
      salary_max: career.salary_max || '',
      deadline: career.deadline || '',
      requirements: career.requirements.length > 0 ? career.requirements : [''],
      benefits: career.benefits.length > 0 ? career.benefits : [''],
    });
    setIsDialogOpen(true);
  };

  const handleArrayChange = (field, index, value) => {
    const newArray = [...form[field]];
    newArray[index] = value;
    setForm({ ...form, [field]: newArray });
  };

  const addArrayItem = (field) => {
    setForm({ ...form, [field]: [...form[field], ''] });
  };

  const removeArrayItem = (field, index) => {
    const newArray = form[field].filter((_, i) => i !== index);
    setForm({ ...form, [field]: newArray.length > 0 ? newArray : [''] });
  };

  const handleSubmit = async () => {
    if (!form.title || !form.department || !form.description) {
      toast.error('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...form,
        salary_min: form.salary_min ? parseInt(form.salary_min) : null,
        salary_max: form.salary_max ? parseInt(form.salary_max) : null,
        requirements: form.requirements.filter(r => r.trim() !== ''),
        benefits: form.benefits.filter(b => b.trim() !== ''),
        openings: parseInt(form.openings) || 1,
      };

      const url = editingCareer 
        ? `${API_URL}/api/admin/content/careers/${editingCareer.id}`
        : `${API_URL}/api/admin/content/careers`;
      
      const res = await fetch(url, {
        method: editingCareer ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Failed to save');
      
      toast.success(editingCareer ? 'Đã cập nhật vị trí' : 'Đã tạo vị trí mới');
      setIsDialogOpen(false);
      fetchCareers();
    } catch (err) {
      toast.error('Có lỗi xảy ra khi lưu');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa vị trí này?')) return;
    
    try {
      const res = await fetch(`${API_URL}/api/admin/content/careers/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      toast.success('Đã xóa vị trí');
      fetchCareers();
    } catch (err) {
      toast.error('Không thể xóa vị trí');
    }
  };

  const viewApplications = async (career) => {
    setApplicationsDialog(career);
    try {
      const res = await fetch(`${API_URL}/api/admin/content/careers/${career.id}/applications`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setApplications(Array.isArray(data) && data.length > 0 ? data : DEMO_APPLICATIONS);
    } catch (err) {
      setApplications(DEMO_APPLICATIONS);
      toast.error('Không thể tải danh sách ứng viên');
    }
  };

  return (
    <div className="p-6 space-y-6" data-testid="admin-careers-page">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Quản lý Tuyển dụng</h1>
          <p className="text-muted-foreground">Quản lý các vị trí tuyển dụng trên website</p>
        </div>
        <div className="flex gap-2">
          {careers.length === 0 && (
            <Button variant="outline" onClick={seedData}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Tạo dữ liệu mẫu
            </Button>
          )}
          <Button onClick={openCreateDialog} data-testid="create-career-btn">
            <Plus className="w-4 h-4 mr-2" />
            Thêm vị trí
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Briefcase className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{careers.length}</p>
                <p className="text-sm text-muted-foreground">Vị trí</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Users className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{careers.reduce((acc, c) => acc + c.openings, 0)}</p>
                <p className="text-sm text-muted-foreground">Số lượng cần</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Flame className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{careers.filter(c => c.is_hot).length}</p>
                <p className="text-sm text-muted-foreground">Hot</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{careers.filter(c => c.is_urgent).length}</p>
                <p className="text-sm text-muted-foreground">Urgent</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm vị trí..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filterDepartment} onValueChange={setFilterDepartment}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Phòng ban" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả phòng ban</SelectItem>
                {DEPARTMENTS.map(dept => (
                  <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vị trí</TableHead>
                <TableHead>Phòng ban</TableHead>
                <TableHead>Địa điểm</TableHead>
                <TableHead>Mức lương</TableHead>
                <TableHead className="text-center">Số lượng</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">Đang tải...</TableCell>
                </TableRow>
              ) : filteredCareers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Chưa có vị trí nào
                  </TableCell>
                </TableRow>
              ) : (
                filteredCareers.map((career) => (
                  <TableRow key={career.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div>
                          <p className="font-medium">{career.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {JOB_TYPES.find(t => t.value === career.type)?.label || career.type}
                          </p>
                        </div>
                        {career.is_hot && <Badge className="bg-orange-500">HOT</Badge>}
                        {career.is_urgent && <Badge variant="destructive">URGENT</Badge>}
                      </div>
                    </TableCell>
                    <TableCell>{career.department}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <MapPin className="w-3 h-3" />
                        {career.location}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <DollarSign className="w-3 h-3" />
                        {career.salary_display}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">{career.openings}</TableCell>
                    <TableCell>
                      <Badge variant={career.is_active ? 'default' : 'secondary'}>
                        {career.is_active ? 'Đang tuyển' : 'Đã đóng'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => viewApplications(career)}
                          title="Xem ứng viên"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => openEditDialog(career)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleDelete(career.id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingCareer ? 'Chỉnh sửa vị trí' : 'Thêm vị trí mới'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="text-sm font-medium">Tên vị trí *</label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="VD: Chuyên viên Tư vấn BĐS"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Phòng ban *</label>
                <Select value={form.department} onValueChange={(v) => setForm({ ...form, department: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DEPARTMENTS.map(dept => (
                      <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Loại hình</label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {JOB_TYPES.map(type => (
                      <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
                <label className="text-sm font-medium">Địa điểm</label>
                <Input
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  placeholder="VD: TP.HCM, Hà Nội"
                />
              </div>
            </div>

            {/* Salary */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium">Lương tối thiểu</label>
                <Input
                  type="number"
                  value={form.salary_min}
                  onChange={(e) => setForm({ ...form, salary_min: e.target.value })}
                  placeholder="15000000"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Lương tối đa</label>
                <Input
                  type="number"
                  value={form.salary_max}
                  onChange={(e) => setForm({ ...form, salary_max: e.target.value })}
                  placeholder="30000000"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Hiển thị</label>
                <Input
                  value={form.salary_display}
                  onChange={(e) => setForm({ ...form, salary_display: e.target.value })}
                  placeholder="15-30 triệu"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="text-sm font-medium">Mô tả công việc *</label>
              <textarea
                className="w-full min-h-[100px] p-2 border rounded-md resize-y"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Mô tả chi tiết về vị trí công việc..."
              />
            </div>

            {/* Requirements */}
            <div>
              <label className="text-sm font-medium">Yêu cầu</label>
              {form.requirements.map((req, i) => (
                <div key={i} className="flex gap-2 mt-2">
                  <Input
                    value={req}
                    onChange={(e) => handleArrayChange('requirements', i, e.target.value)}
                    placeholder={`Yêu cầu ${i + 1}`}
                  />
                  <Button variant="ghost" size="icon" onClick={() => removeArrayItem('requirements', i)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              <Button variant="link" size="sm" onClick={() => addArrayItem('requirements')} className="mt-1">
                + Thêm yêu cầu
              </Button>
            </div>

            {/* Benefits */}
            <div>
              <label className="text-sm font-medium">Quyền lợi</label>
              {form.benefits.map((ben, i) => (
                <div key={i} className="flex gap-2 mt-2">
                  <Input
                    value={ben}
                    onChange={(e) => handleArrayChange('benefits', i, e.target.value)}
                    placeholder={`Quyền lợi ${i + 1}`}
                  />
                  <Button variant="ghost" size="icon" onClick={() => removeArrayItem('benefits', i)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              <Button variant="link" size="sm" onClick={() => addArrayItem('benefits')} className="mt-1">
                + Thêm quyền lợi
              </Button>
            </div>

            {/* Other */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium">Số lượng cần</label>
                <Input
                  type="number"
                  min="1"
                  value={form.openings}
                  onChange={(e) => setForm({ ...form, openings: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Hạn nộp hồ sơ</label>
                <Input
                  type="date"
                  value={form.deadline}
                  onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                />
              </div>
            </div>

            {/* Flags */}
            <div className="flex gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.is_hot}
                  onChange={(e) => setForm({ ...form, is_hot: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm">HOT (Nổi bật)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.is_urgent}
                  onChange={(e) => setForm({ ...form, is_urgent: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm">URGENT (Gấp)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm">Đang tuyển</span>
              </label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Hủy</Button>
            <Button onClick={handleSubmit} disabled={saving}>
              {saving ? 'Đang lưu...' : (editingCareer ? 'Cập nhật' : 'Tạo mới')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Applications Dialog */}
      <Dialog open={!!applicationsDialog} onOpenChange={() => setApplicationsDialog(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Ứng viên — {applicationsDialog?.title}
            </DialogTitle>
          </DialogHeader>
          
          {applications.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              Chưa có ứng viên nào
            </div>
          ) : (
            <div className="space-y-3">
              {applications.map((app) => (
                <Card key={app.id} className="border border-slate-200 shadow-none">
                  <CardContent className="pt-4 pb-3">
                    <div className="flex flex-col md:flex-row md:items-start gap-4">

                      {/* Basic Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 flex-wrap">
                          <div>
                            <p className="font-bold text-slate-900">{app.full_name}</p>
                            <p className="text-xs text-slate-500">{app.email} · {app.phone}</p>
                          </div>
                          <Badge className={`flex-shrink-0 ${
                            app.status === 'new' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                            app.status === 'reviewing' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                            app.status === 'accepted' ? 'bg-green-100 text-green-700 border-green-200' :
                            'bg-slate-100 text-slate-600'
                          } border`}>
                            {app.status === 'new' ? '✍️ Mới nộp' :
                             app.status === 'reviewing' ? '🔍 Đang xem xét' :
                             app.status === 'accepted' ? '✅ Chấp nhận' :
                             app.status}
                          </Badge>
                        </div>

                        {/* Position */}
                        {app.position_title && (
                          <p className="mt-1.5 text-sm text-slate-600">
                            <span className="font-semibold">💼 Vị trí:</span> {app.position_title}
                          </p>
                        )}

                        {/* Cover letter preview */}
                        {app.cover_letter && (
                          <p className="mt-1 text-xs text-slate-500 line-clamp-2 italic">
                            &quot;{app.cover_letter}&quot;
                          </p>
                        )}

                        <p className="mt-2 text-xs text-slate-400">
                          Nộp ngày: {new Date(app.created_at).toLocaleString('vi-VN')}
                        </p>
                      </div>

                      {/* File Attachments */}
                      {app.file_urls && app.file_urls.length > 0 && (
                        <div className="md:w-56 flex-shrink-0">
                          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1">
                            <Paperclip className="w-3 h-3" />
                            Hồ sơ đính kèm ({app.file_urls.length})
                          </p>
                          <ul className="space-y-1.5">
                            {app.file_urls.map((file, fi) => (
                              <li key={fi} className="flex items-center gap-2 bg-slate-50 rounded-lg px-2 py-1.5">
                                {file.type === 'pdf' ? (
                                  <FileText className="w-4 h-4 text-red-500 flex-shrink-0" />
                                ) : file.type === 'image' ? (
                                  <ImageIcon className="w-4 h-4 text-blue-500 flex-shrink-0" />
                                ) : (
                                  <FileText className="w-4 h-4 text-slate-400 flex-shrink-0" />
                                )}
                                <span className="flex-1 text-xs text-slate-700 truncate">{file.name}</span>
                                <span className="text-[10px] text-slate-400 flex-shrink-0">{file.size}</span>
                                <a
                                  href={file.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  title="Tải xuống"
                                  className="text-[#316585] hover:text-[#264a5e] flex-shrink-0"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                </a>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* No file fallback */}
                      {(!app.file_urls || app.file_urls.length === 0) && (
                        <div className="md:w-56 flex-shrink-0 flex items-center gap-2 text-xs text-slate-400 italic">
                          <Paperclip className="w-3 h-3" />
                          Chưa đính kèm hồ sơ
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
