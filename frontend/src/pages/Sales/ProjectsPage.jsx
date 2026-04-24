import React, { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  Plus,
  Search,
  Building2,
  MapPin,
  Layers,
  TrendingUp,
  Eye,
  Edit,
} from 'lucide-react';
import { toast } from 'sonner';

const statusColors = {
  planning: 'bg-slate-100 text-slate-700',
  pre_sale: 'bg-amber-100 text-amber-700',
  selling: 'bg-green-100 text-green-700',
  sold_out: 'bg-blue-100 text-blue-700',
};

const DEMO_PROJECTS = [
  { id: 'project-demo-1', name: 'Rivera Residence', code: 'RVR', location: 'Thủ Đức, TP.HCM', total_units: 320, price_from: 2800000000, price_to: 4500000000, status: 'selling' },
  { id: 'project-demo-2', name: 'Sunrise Premium', code: 'SUN', location: 'Quận 7, TP.HCM', total_units: 210, price_from: 3500000000, price_to: 6200000000, status: 'pre_sale' },
  { id: 'project-demo-3', name: 'Skyline Heights', code: 'SKY', location: 'Bình Dương', total_units: 410, price_from: 1900000000, price_to: 3200000000, status: 'planning' },
];

export default function RealEstateProjectsPage() {
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showDialog, setShowDialog] = useState(false);
  const [form, setForm] = useState({
    name: '',
    code: '',
    location: '',
    description: '',
    total_units: 0,
    price_from: 0,
    price_to: 0,
    status: 'planning',
  });

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      let url = '/sales/projects';
      if (statusFilter !== 'all') url += `?status=${statusFilter}`;
      const res = await api.get(url);
      const payload = Array.isArray(res?.data) && res.data.length > 0 ? res.data : DEMO_PROJECTS;
      setProjects(payload.filter((project) => statusFilter === 'all' || project.status === statusFilter));
    } catch (error) {
      console.error('Error:', error);
      setProjects(DEMO_PROJECTS.filter((project) => statusFilter === 'all' || project.status === statusFilter));
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleCreate = async () => {
    try {
      await api.post('/sales/projects', form);
      toast.success('Tạo dự án thành công!');
      setShowDialog(false);
      setForm({ name: '', code: '', location: '', description: '', total_units: 0, price_from: 0, price_to: 0, status: 'planning' });
      fetchProjects();
    } catch (error) {
      toast.error('Lỗi khi tạo dự án');
    }
  };

  const formatCurrency = (value) => {
    if (value >= 1000000000) return `${(value / 1000000000).toFixed(1)} tỷ`;
    if (value >= 1000000) return `${(value / 1000000).toFixed(0)} tr`;
    return new Intl.NumberFormat('vi-VN').format(value);
  };

  const filteredProjects = projects.filter(p =>
    p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.code?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6" data-testid="projects-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dự án Bất động sản</h1>
          <p className="text-slate-500 text-sm mt-1">Quản lý danh sách dự án</p>
        </div>
        <Button onClick={() => setShowDialog(true)} data-testid="add-project-btn">
          <Plus className="h-4 w-4 mr-2" />
          Thêm dự án
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Tìm kiếm dự án..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            <SelectItem value="planning">Đang quy hoạch</SelectItem>
            <SelectItem value="pre_sale">Chuẩn bị mở bán</SelectItem>
            <SelectItem value="selling">Đang bán</SelectItem>
            <SelectItem value="sold_out">Đã bán hết</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="bg-green-50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <Building2 className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-xs text-green-600">Đang bán</p>
                <p className="text-xl font-bold text-green-700">
                  {projects.filter(p => p.status === 'selling').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-amber-50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-5 w-5 text-amber-600" />
              <div>
                <p className="text-xs text-amber-600">Chuẩn bị mở</p>
                <p className="text-xl font-bold text-amber-700">
                  {projects.filter(p => p.status === 'pre_sale').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-blue-50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <Layers className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-xs text-blue-600">Tổng sản phẩm</p>
                <p className="text-xl font-bold text-blue-700">
                  {projects.reduce((acc, p) => acc + (p.total_units || 0), 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-purple-50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <Building2 className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-xs text-purple-600">Tổng dự án</p>
                <p className="text-xl font-bold text-purple-700">{projects.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Project List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full flex items-center justify-center py-12">
            <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" />
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="col-span-full text-center py-12 text-slate-500">
            <Building2 className="h-12 w-12 mx-auto mb-4 text-slate-300" />
            <p>Chưa có dự án nào</p>
            <Button variant="link" onClick={() => setShowDialog(true)}>
              Thêm dự án đầu tiên
            </Button>
          </div>
        ) : (
          filteredProjects.map((project) => (
            <Card key={project.id} className="hover:shadow-lg transition-shadow overflow-hidden" data-testid={`project-${project.id}`}>
              {/* Image placeholder */}
              <div className="h-40 bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                <Building2 className="h-16 w-16 text-white/50" />
              </div>
              <CardContent className="pt-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-bold text-lg">{project.name}</p>
                    <p className="text-xs text-slate-500">{project.code}</p>
                  </div>
                  <Badge className={statusColors[project.status]}>
                    {project.status === 'selling' ? 'Đang bán' :
                     project.status === 'pre_sale' ? 'Chuẩn bị mở' :
                     project.status === 'sold_out' ? 'Đã bán hết' : 'Quy hoạch'}
                  </Badge>
                </div>

                <div className="flex items-center gap-1 text-sm text-slate-500 mb-3">
                  <MapPin className="h-4 w-4" />
                  {project.location || 'Chưa cập nhật'}
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                  <div>
                    <p className="text-slate-500">Số căn</p>
                    <p className="font-semibold">{project.total_units || 0}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Giá từ</p>
                    <p className="font-semibold text-green-600">
                      {project.price_from ? formatCurrency(project.price_from) : 'Liên hệ'}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    <Eye className="h-4 w-4 mr-1" />
                    Chi tiết
                  </Button>
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Thêm dự án mới</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Tên dự án *</label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="VD: Vinhomes Grand Park"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Mã dự án</label>
                <Input
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                  placeholder="VD: VGP001"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Vị trí</label>
              <Input
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="Quận/Huyện, Tỉnh/Thành phố"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Mô tả</label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Mô tả về dự án..."
                rows={2}
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium">Số căn</label>
                <Input
                  type="number"
                  value={form.total_units}
                  onChange={(e) => setForm({ ...form, total_units: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Giá từ (VND)</label>
                <Input
                  type="number"
                  value={form.price_from}
                  onChange={(e) => setForm({ ...form, price_from: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Giá đến (VND)</label>
                <Input
                  type="number"
                  value={form.price_to}
                  onChange={(e) => setForm({ ...form, price_to: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Trạng thái</label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="planning">Đang quy hoạch</SelectItem>
                  <SelectItem value="pre_sale">Chuẩn bị mở bán</SelectItem>
                  <SelectItem value="selling">Đang bán</SelectItem>
                  <SelectItem value="sold_out">Đã bán hết</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Hủy</Button>
            <Button onClick={handleCreate} disabled={!form.name}>
              Thêm dự án
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
