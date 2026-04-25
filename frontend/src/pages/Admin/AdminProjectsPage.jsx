import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import PageHeader from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import { SUN_GROUP_PROJECTS, SUN_GROUP_STATS } from '@/data/sunGroupProjects';
import { toast } from 'sonner';
import {
  Building2, MapPin, DollarSign, Plus, Pencil, Trash2, Eye, ExternalLink,
  Image as ImageIcon, Video, RotateCcw, Compass, ListChecks, CreditCard,
  LayoutGrid, Settings, FileVideo, Star, StarOff, EyeOff, ChevronRight,
  Upload, Link as LinkIcon, Globe, Home, Users, Calendar, Check, X,
  Play, Layers
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

// Format currency
const formatCurrency = (value) => {
  if (!value) return 'N/A';
  if (value >= 1000000000) return `${(value / 1000000000).toFixed(1)} tỷ`;
  if (value >= 1000000) return `${(value / 1000000).toFixed(0)} triệu`;
  return value.toLocaleString('vi-VN') + ' VND';
};

// Status badge colors
const statusColors = {
  opening: 'bg-green-500',
  coming_soon: 'bg-amber-500',
  sold_out: 'bg-slate-500'
};

const statusLabels = {
  opening: 'Đang mở bán',
  coming_soon: 'Sắp mở bán',
  sold_out: 'Đã bán hết'
};

const DEMO_PROJECTS = SUN_GROUP_PROJECTS;
const DEMO_PROJECT_STATS = SUN_GROUP_STATS;


export default function AdminProjectsPage() {
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');
  const [selectedProject, setSelectedProject] = useState(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [stats, setStats] = useState(null);

  const loadProjects = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterStatus) params.append('status', filterStatus);
      if (filterType) params.append('type', filterType);
      if (search) params.append('search', search);
      
      const response = await api.get(`/admin/projects?${params.toString()}`);
      const items = Array.isArray(response.data) && response.data.length > 0 ? response.data : DEMO_PROJECTS;
      setProjects(items);
    } catch {
      setProjects(DEMO_PROJECTS);
    } finally {
      setLoading(false);
    }
  }, [filterStatus, filterType, search]);

  const loadStats = useCallback(async () => {
    try {
      const response = await api.get('/admin/projects/stats/overview');
      setStats(response.data || DEMO_PROJECT_STATS);
    } catch {
      setStats(DEMO_PROJECT_STATS);
    }
  }, []);

  useEffect(() => {
    loadProjects();
    loadStats();
  }, [loadProjects, loadStats]);

  const handleSearch = (value) => {
    setSearch(value);
    // Debounce search
    setTimeout(() => loadProjects(), 500);
  };

  const handleToggleHot = async (projectId) => {
    try {
      const response = await api.put(`/admin/projects/${projectId}/toggle-hot`);
      toast.success(response.data.is_hot ? 'Đã đánh dấu HOT' : 'Đã bỏ đánh dấu HOT');
      loadProjects();
    } catch (error) {
      toast.error('Không thể cập nhật');
    }
  };

  const handleTogglePriceList = async (projectId) => {
    try {
      const response = await api.put(`/admin/projects/${projectId}/toggle-price-list`);
      toast.success(response.data.price_list_enabled ? 'Đã hiện bảng giá' : 'Đã ẩn bảng giá');
      loadProjects();
    } catch (error) {
      toast.error('Không thể cập nhật');
    }
  };

  const handleDelete = async (projectId) => {
    if (!window.confirm('Bạn có chắc muốn xóa dự án này?')) return;
    try {
      await api.delete(`/admin/projects/${projectId}`);
      toast.success('Đã xóa dự án');
      loadProjects();
    } catch (error) {
      toast.error('Không thể xóa dự án');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900" data-testid="admin-projects-page">
      <PageHeader
        title="Quản lý Dự án"
        subtitle="Quản lý chi tiết các dự án và nội dung landing page"
        breadcrumbs={[
          { label: 'Website', path: '/cms/projects' },
          { label: 'Dự án', path: '/cms/projects' },
        ]}
        onSearch={handleSearch}
        searchPlaceholder="Tìm kiếm dự án..."
        onAddNew={() => setShowCreateDialog(true)}
        addNewLabel="Thêm Dự án"
        showNotifications={true}
      />

      <div className="p-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <Card className="bg-white dark:bg-slate-800 border-0 shadow-sm">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#316585]/10 flex items-center justify-center">
                <Building2 className="w-6 h-6 text-[#316585]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats?.total || 0}</p>
                <p className="text-sm text-slate-500">Tổng dự án</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white dark:bg-slate-800 border-0 shadow-sm">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <Check className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats?.opening || 0}</p>
                <p className="text-sm text-slate-500">Đang mở bán</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white dark:bg-slate-800 border-0 shadow-sm">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats?.coming_soon || 0}</p>
                <p className="text-sm text-slate-500">Sắp mở bán</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white dark:bg-slate-800 border-0 shadow-sm">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                <Star className="w-6 h-6 text-orange-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats?.hot_projects || 0}</p>
                <p className="text-sm text-slate-500">Nổi bật</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white dark:bg-slate-800 border-0 shadow-sm">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <FileVideo className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <Button 
                  variant="link" 
                  className="p-0 h-auto text-[#316585]"
                  onClick={() => navigate('/admin/video-editor')}
                >
                  Video Editor
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
                <p className="text-sm text-slate-500">Tạo video</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          <Select value={filterStatus || "all"} onValueChange={(v) => setFilterStatus(v === "all" ? "" : v)}>
            <SelectTrigger className="w-[180px] bg-white dark:bg-slate-800">
              <SelectValue placeholder="Trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value="opening">Đang mở bán</SelectItem>
              <SelectItem value="coming_soon">Sắp mở bán</SelectItem>
              <SelectItem value="sold_out">Đã bán hết</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterType || "all"} onValueChange={(v) => setFilterType(v === "all" ? "" : v)}>
            <SelectTrigger className="w-[180px] bg-white dark:bg-slate-800">
              <SelectValue placeholder="Loại dự án" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value="apartment">Căn hộ</SelectItem>
              <SelectItem value="villa">Biệt thự</SelectItem>
              <SelectItem value="townhouse">Nhà phố</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Projects List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-[#316585]/30 border-t-[#316585] rounded-full animate-spin" />
          </div>
        ) : projects.length === 0 ? (
          <Card className="bg-white dark:bg-slate-800">
            <CardContent className="py-20 text-center">
              <Building2 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Chưa có dự án nào</h3>
              <p className="text-slate-500 mb-6">Bắt đầu thêm dự án để hiển thị trên website</p>
              <Button onClick={() => setShowCreateDialog(true)} className="bg-[#316585] hover:bg-[#264f68]">
                <Plus className="w-4 h-4 mr-2" /> Thêm Dự án
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {projects.map((project) => (
              <Card key={project.id} className="bg-white dark:bg-slate-800 border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-0">
                  <div className="flex flex-col md:flex-row">
                    {/* Thumbnail */}
                    <div className="relative w-full md:w-64 h-48 md:h-auto flex-shrink-0">
                      <img
                        src={project.images?.[0] || 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400'}
                        alt={project.name}
                        className="w-full h-full object-cover rounded-t-lg md:rounded-l-lg md:rounded-tr-none"
                      />
                      {project.is_hot && (
                        <Badge className="absolute top-3 left-3 bg-orange-500 border-0">HOT</Badge>
                      )}
                      <Badge className={`absolute top-3 right-3 ${statusColors[project.status]} border-0`}>
                        {statusLabels[project.status]}
                      </Badge>
                    </div>

                    {/* Content */}
                    <div className="flex-1 p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">{project.name}</h3>
                          <div className="flex items-center gap-2 text-slate-500 text-sm">
                            <MapPin className="w-4 h-4" />
                            <span>{project.location?.address || project.location?.city || 'N/A'}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleToggleHot(project.id)}>
                            {project.is_hot ? (
                              <Star className="w-5 h-5 text-orange-500 fill-orange-500" />
                            ) : (
                              <StarOff className="w-5 h-5 text-slate-400" />
                            )}
                          </Button>
                        </div>
                      </div>

                      <p className="text-slate-600 dark:text-slate-400 text-sm mb-4 line-clamp-2">
                        {project.description}
                      </p>

                      {/* Quick Stats */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div>
                          <p className="text-xs text-slate-500">Giá từ</p>
                          <p className="font-semibold text-[#316585]">{formatCurrency(project.price_from)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Căn còn</p>
                          <p className="font-semibold text-slate-900 dark:text-white">
                            {project.units_available}/{project.units_total}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Diện tích</p>
                          <p className="font-semibold text-slate-900 dark:text-white">{project.area_range || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Bàn giao</p>
                          <p className="font-semibold text-slate-900 dark:text-white">{project.completion_date || 'N/A'}</p>
                        </div>
                      </div>

                      {/* Feature Badges */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        {project.virtual_tour?.enabled && (
                          <Badge variant="outline" className="text-xs">
                            <Compass className="w-3 h-3 mr-1" /> Virtual Tour
                          </Badge>
                        )}
                        {project.view_360?.enabled && (
                          <Badge variant="outline" className="text-xs">
                            <RotateCcw className="w-3 h-3 mr-1" /> 360°
                          </Badge>
                        )}
                        {project.videos?.intro_url && (
                          <Badge variant="outline" className="text-xs">
                            <Video className="w-3 h-3 mr-1" /> Video
                          </Badge>
                        )}
                        {project.price_list?.enabled ? (
                          <Badge variant="outline" className="text-xs text-green-600 border-green-300">
                            <Eye className="w-3 h-3 mr-1" /> Bảng giá
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs text-slate-400">
                            <EyeOff className="w-3 h-3 mr-1" /> Ẩn bảng giá
                          </Badge>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 pt-4 border-t border-slate-200 dark:border-slate-700">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setSelectedProject(project);
                            setShowEditDialog(true);
                          }}
                        >
                          <Pencil className="w-4 h-4 mr-1" /> Sửa
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleTogglePriceList(project.id)}
                        >
                          {project.price_list?.enabled ? (
                            <><EyeOff className="w-4 h-4 mr-1" /> Ẩn giá</>
                          ) : (
                            <><Eye className="w-4 h-4 mr-1" /> Hiện giá</>
                          )}
                        </Button>
                        <a 
                          href={`/projects/${project.id}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center rounded-md text-sm font-medium h-9 px-3 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700"
                        >
                          <ExternalLink className="w-4 h-4 mr-1" /> Xem trang
                        </a>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-red-500 hover:text-red-600 hover:bg-red-50"
                          onClick={() => handleDelete(project.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Sample Projects Notice */}
        {projects.length === 0 && (
          <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 mt-6">
            <CardContent className="p-4">
              <p className="text-blue-800 dark:text-blue-200 text-sm">
                <strong>Lưu ý:</strong> Hiện tại trang đang sử dụng dữ liệu mẫu. 
                Bạn có thể thêm dự án mới để quản lý thực tế.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Create Project Dialog */}
      <CreateProjectDialog 
        open={showCreateDialog} 
        onOpenChange={setShowCreateDialog}
        onSuccess={() => {
          setShowCreateDialog(false);
          loadProjects();
          loadStats();
        }}
      />

      {/* Edit Project Dialog */}
      {selectedProject && (
        <EditProjectDialog
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          project={selectedProject}
          onSuccess={() => {
            setShowEditDialog(false);
            setSelectedProject(null);
            loadProjects();
          }}
        />
      )}
    </div>
  );
}

// Create Project Dialog Component
function CreateProjectDialog({ open, onOpenChange, onSuccess }) {
  const [formData, setFormData] = useState({
    name: '',
    slogan: '',
    type: 'apartment',
    status: 'opening',
    description: '',
    price_from: '',
    price_to: '',
    location: {
      address: '',
      district: '',
      city: '',
      map_url: ''
    },
    developer: {
      name: '',
      description: ''
    },
    units_total: '',
    units_available: '',
    area_range: '',
    completion_date: '',
    is_hot: false,
    highlights: [''],
    images: ['']
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.price_from) {
      toast.error('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...formData,
        price_from: parseFloat(formData.price_from) || 0,
        price_to: parseFloat(formData.price_to) || null,
        units_total: parseInt(formData.units_total) || 0,
        units_available: parseInt(formData.units_available) || 0,
        highlights: formData.highlights.filter(h => h.trim()),
        images: formData.images.filter(i => i.trim())
      };

      await api.post('/admin/projects', payload);
      toast.success('Đã tạo dự án thành công!');
      onSuccess();
    } catch (error) {
      console.error('Create project error:', error);
      toast.error('Không thể tạo dự án');
    } finally {
      setLoading(false);
    }
  };

  const updateLocation = (field, value) => {
    setFormData(prev => ({
      ...prev,
      location: { ...prev.location, [field]: value }
    }));
  };

  const updateDeveloper = (field, value) => {
    setFormData(prev => ({
      ...prev,
      developer: { ...prev.developer, [field]: value }
    }));
  };

  const addHighlight = () => {
    setFormData(prev => ({
      ...prev,
      highlights: [...prev.highlights, '']
    }));
  };

  const updateHighlight = (index, value) => {
    const newHighlights = [...formData.highlights];
    newHighlights[index] = value;
    setFormData(prev => ({ ...prev, highlights: newHighlights }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Thêm Dự án Mới</DialogTitle>
          <DialogDescription>Điền thông tin dự án để tạo landing page</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Tabs defaultValue="basic">
            <TabsList className="grid grid-cols-4 w-full">
              <TabsTrigger value="basic">Cơ bản</TabsTrigger>
              <TabsTrigger value="location">Vị trí</TabsTrigger>
              <TabsTrigger value="details">Chi tiết</TabsTrigger>
              <TabsTrigger value="media">Media</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label>Tên dự án *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="VD: Nobu Residences Danang"
                  />
                </div>
                <div className="col-span-2">
                  <Label>Slogan</Label>
                  <Input
                    value={formData.slogan}
                    onChange={(e) => setFormData(prev => ({ ...prev, slogan: e.target.value }))}
                    placeholder="VD: Đại đô thị đẳng cấp"
                  />
                </div>
                <div>
                  <Label>Loại dự án</Label>
                  <Select value={formData.type} onValueChange={(v) => setFormData(prev => ({ ...prev, type: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="apartment">Căn hộ</SelectItem>
                      <SelectItem value="villa">Biệt thự</SelectItem>
                      <SelectItem value="townhouse">Nhà phố</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Trạng thái</Label>
                  <Select value={formData.status} onValueChange={(v) => setFormData(prev => ({ ...prev, status: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="opening">Đang mở bán</SelectItem>
                      <SelectItem value="coming_soon">Sắp mở bán</SelectItem>
                      <SelectItem value="sold_out">Đã bán hết</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Giá từ (VND) *</Label>
                  <Input
                    type="number"
                    value={formData.price_from}
                    onChange={(e) => setFormData(prev => ({ ...prev, price_from: e.target.value }))}
                    placeholder="2500000000"
                  />
                </div>
                <div>
                  <Label>Giá đến (VND)</Label>
                  <Input
                    type="number"
                    value={formData.price_to}
                    onChange={(e) => setFormData(prev => ({ ...prev, price_to: e.target.value }))}
                    placeholder="8000000000"
                  />
                </div>
                <div className="col-span-2">
                  <Label>Mô tả</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Mô tả chi tiết về dự án..."
                    rows={4}
                  />
                </div>
                <div className="col-span-2 flex items-center gap-2">
                  <Switch
                    checked={formData.is_hot}
                    onCheckedChange={(v) => setFormData(prev => ({ ...prev, is_hot: v }))}
                  />
                  <Label>Đánh dấu HOT</Label>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="location" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label>Địa chỉ</Label>
                  <Input
                    value={formData.location.address}
                    onChange={(e) => updateLocation('address', e.target.value)}
                    placeholder="VD: 123 Nguyễn Xiển, P. Long Thạnh Mỹ"
                  />
                </div>
                <div>
                  <Label>Quận/Huyện</Label>
                  <Input
                    value={formData.location.district}
                    onChange={(e) => updateLocation('district', e.target.value)}
                    placeholder="VD: TP. Thủ Đức"
                  />
                </div>
                <div>
                  <Label>Tỉnh/Thành phố</Label>
                  <Input
                    value={formData.location.city}
                    onChange={(e) => updateLocation('city', e.target.value)}
                    placeholder="VD: TP. Hồ Chí Minh"
                  />
                </div>
                <div className="col-span-2">
                  <Label>Google Maps Embed URL</Label>
                  <Input
                    value={formData.location.map_url}
                    onChange={(e) => updateLocation('map_url', e.target.value)}
                    placeholder="https://www.google.com/maps/embed?..."
                  />
                </div>
              </div>

              <div className="border-t pt-4">
                <Label className="font-semibold">Chủ đầu tư</Label>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div>
                    <Label>Tên</Label>
                    <Input
                      value={formData.developer.name}
                      onChange={(e) => updateDeveloper('name', e.target.value)}
                      placeholder="VD: Sun Group / VBR"
                    />
                  </div>
                  <div>
                    <Label>Mô tả</Label>
                    <Input
                      value={formData.developer.description}
                      onChange={(e) => updateDeveloper('description', e.target.value)}
                      placeholder="Thông tin về chủ đầu tư"
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="details" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Tổng số căn</Label>
                  <Input
                    type="number"
                    value={formData.units_total}
                    onChange={(e) => setFormData(prev => ({ ...prev, units_total: e.target.value }))}
                    placeholder="5000"
                  />
                </div>
                <div>
                  <Label>Số căn còn</Label>
                  <Input
                    type="number"
                    value={formData.units_available}
                    onChange={(e) => setFormData(prev => ({ ...prev, units_available: e.target.value }))}
                    placeholder="120"
                  />
                </div>
                <div>
                  <Label>Diện tích</Label>
                  <Input
                    value={formData.area_range}
                    onChange={(e) => setFormData(prev => ({ ...prev, area_range: e.target.value }))}
                    placeholder="50-120 m²"
                  />
                </div>
                <div>
                  <Label>Ngày bàn giao</Label>
                  <Input
                    value={formData.completion_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, completion_date: e.target.value }))}
                    placeholder="Q4/2025"
                  />
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-2">
                  <Label className="font-semibold">Điểm nổi bật</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addHighlight}>
                    <Plus className="w-4 h-4 mr-1" /> Thêm
                  </Button>
                </div>
                <div className="space-y-2">
                  {formData.highlights.map((h, idx) => (
                    <Input
                      key={idx}
                      value={h}
                      onChange={(e) => updateHighlight(idx, e.target.value)}
                      placeholder={`Điểm nổi bật ${idx + 1}`}
                    />
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="media" className="space-y-4 mt-4">
              <div>
                <Label>URL Hình ảnh (mỗi dòng 1 URL)</Label>
                <Textarea
                  value={formData.images.join('\n')}
                  onChange={(e) => setFormData(prev => ({ ...prev, images: e.target.value.split('\n') }))}
                  placeholder="https://example.com/image1.jpg&#10;https://example.com/image2.jpg"
                  rows={5}
                />
              </div>
              <p className="text-sm text-slate-500">
                Bạn có thể thêm video, 360° view và virtual tour sau khi tạo dự án.
              </p>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Hủy
            </Button>
            <Button type="submit" className="bg-[#316585] hover:bg-[#264f68]" disabled={loading}>
              {loading ? 'Đang tạo...' : 'Tạo dự án'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Edit Project Dialog Component
function EditProjectDialog({ open, onOpenChange, project, onSuccess }) {
  const [activeTab, setActiveTab] = useState('basic');
  const [formData, setFormData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (project) {
      setFormData({
        ...project,
        highlights: project.highlights?.length ? project.highlights : [''],
        images: project.images?.length ? project.images : ['']
      });
    }
  }, [project]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData?.name) {
      toast.error('Tên dự án là bắt buộc');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...formData,
        highlights: formData.highlights?.filter(h => h?.trim()) || [],
        images: formData.images?.filter(i => i?.trim()) || []
      };

      await api.put(`/admin/projects/${project.id}`, payload);
      toast.success('Đã cập nhật dự án!');
      onSuccess();
    } catch (error) {
      console.error('Update project error:', error);
      toast.error('Không thể cập nhật dự án');
    } finally {
      setLoading(false);
    }
  };

  if (!formData) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Chỉnh sửa: {project.name}</DialogTitle>
          <DialogDescription>Cập nhật thông tin dự án và nội dung landing page</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-6 w-full">
              <TabsTrigger value="basic">Cơ bản</TabsTrigger>
              <TabsTrigger value="location">Vị trí</TabsTrigger>
              <TabsTrigger value="units">Loại căn</TabsTrigger>
              <TabsTrigger value="pricing">Bảng giá</TabsTrigger>
              <TabsTrigger value="media">Media</TabsTrigger>
              <TabsTrigger value="tours">360/Tour</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label>Tên dự án</Label>
                  <Input
                    value={formData.name || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className="col-span-2">
                  <Label>Slogan</Label>
                  <Input
                    value={formData.slogan || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, slogan: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Trạng thái</Label>
                  <Select 
                    value={formData.status} 
                    onValueChange={(v) => setFormData(prev => ({ ...prev, status: v }))}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="opening">Đang mở bán</SelectItem>
                      <SelectItem value="coming_soon">Sắp mở bán</SelectItem>
                      <SelectItem value="sold_out">Đã bán hết</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.is_hot}
                    onCheckedChange={(v) => setFormData(prev => ({ ...prev, is_hot: v }))}
                  />
                  <Label>Đánh dấu HOT</Label>
                </div>
                <div className="col-span-2">
                  <Label>Mô tả</Label>
                  <Textarea
                    value={formData.description || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={4}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="location" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label>Địa chỉ</Label>
                  <Input
                    value={formData.location?.address || ''}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      location: { ...prev.location, address: e.target.value } 
                    }))}
                  />
                </div>
                <div>
                  <Label>Quận/Huyện</Label>
                  <Input
                    value={formData.location?.district || ''}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      location: { ...prev.location, district: e.target.value } 
                    }))}
                  />
                </div>
                <div>
                  <Label>Tỉnh/Thành phố</Label>
                  <Input
                    value={formData.location?.city || ''}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      location: { ...prev.location, city: e.target.value } 
                    }))}
                  />
                </div>
                <div className="col-span-2">
                  <Label>Google Maps Embed URL</Label>
                  <Input
                    value={formData.location?.map_url || ''}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      location: { ...prev.location, map_url: e.target.value } 
                    }))}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="units" className="space-y-4 mt-4">
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div>
                  <Label>Tổng số căn</Label>
                  <Input
                    type="number"
                    value={formData.units_total || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, units_total: parseInt(e.target.value) || 0 }))}
                  />
                </div>
                <div>
                  <Label>Số căn còn</Label>
                  <Input
                    type="number"
                    value={formData.units_available || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, units_available: parseInt(e.target.value) || 0 }))}
                  />
                </div>
                <div>
                  <Label>Diện tích</Label>
                  <Input
                    value={formData.area_range || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, area_range: e.target.value }))}
                  />
                </div>
              </div>
              <p className="text-sm text-slate-500">
                Quản lý chi tiết các loại căn hộ có thể được thêm sau khi lưu.
              </p>
            </TabsContent>

            <TabsContent value="pricing" className="space-y-4 mt-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.price_list?.enabled ?? true}
                    onCheckedChange={(v) => setFormData(prev => ({ 
                      ...prev, 
                      price_list: { ...prev.price_list, enabled: v } 
                    }))}
                  />
                  <Label>Hiển thị bảng giá trên website</Label>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Giá từ (VND)</Label>
                  <Input
                    type="number"
                    value={formData.price_from || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, price_from: parseFloat(e.target.value) || 0 }))}
                  />
                </div>
                <div>
                  <Label>Giá đến (VND)</Label>
                  <Input
                    type="number"
                    value={formData.price_to || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, price_to: parseFloat(e.target.value) || null }))}
                  />
                </div>
              </div>
              <p className="text-sm text-slate-500 mt-4">
                Chi tiết bảng giá theo căn có thể được quản lý qua API riêng.
              </p>
            </TabsContent>

            <TabsContent value="media" className="space-y-4 mt-4">
              <div>
                <Label>URL Video giới thiệu</Label>
                <Input
                  value={formData.videos?.intro_url || ''}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    videos: { ...prev.videos, intro_url: e.target.value } 
                  }))}
                  placeholder="https://..."
                />
              </div>
              <div>
                <Label>YouTube Embed URL</Label>
                <Input
                  value={formData.videos?.youtube_url || ''}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    videos: { ...prev.videos, youtube_url: e.target.value } 
                  }))}
                  placeholder="https://www.youtube.com/embed/..."
                />
              </div>
              <div>
                <Label>URL Hình ảnh (mỗi dòng 1 URL)</Label>
                <Textarea
                  value={formData.images?.join('\n') || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, images: e.target.value.split('\n') }))}
                  rows={5}
                />
              </div>
            </TabsContent>

            <TabsContent value="tours" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Compass className="w-5 h-5" /> Virtual Tour
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={formData.virtual_tour?.enabled ?? false}
                      onCheckedChange={(v) => setFormData(prev => ({ 
                        ...prev, 
                        virtual_tour: { ...prev.virtual_tour, enabled: v } 
                      }))}
                    />
                    <Label>Bật Virtual Tour</Label>
                  </div>
                  <div>
                    <Label>URL Virtual Tour (Matterport, etc.)</Label>
                    <Input
                      value={formData.virtual_tour?.url || ''}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        virtual_tour: { ...prev.virtual_tour, url: e.target.value } 
                      }))}
                      placeholder="https://my.matterport.com/show/?m=..."
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <RotateCcw className="w-5 h-5" /> 360° View
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={formData.view_360?.enabled ?? false}
                      onCheckedChange={(v) => setFormData(prev => ({ 
                        ...prev, 
                        view_360: { ...prev.view_360, enabled: v } 
                      }))}
                    />
                    <Label>Bật 360° View</Label>
                  </div>
                  <p className="text-sm text-slate-500">
                    Thêm hình ảnh 360° qua API riêng sau khi lưu.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-3 pt-4 border-t mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Hủy
            </Button>
            <Button type="submit" className="bg-[#316585] hover:bg-[#264f68]" disabled={loading}>
              {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
