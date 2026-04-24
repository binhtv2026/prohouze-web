import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, Pencil, Trash2, Search, Building2, Eye, MapPin, 
  ExternalLink, RefreshCw, Star, Flame, Image
} from 'lucide-react';
import { toast } from 'sonner';
import { cmsPublicProjectsApi } from '@/api/cmsApi';
import RichTextEditor from '@/components/RichTextEditor';

const STATUS_COLORS = {
  draft: 'bg-gray-500',
  published: 'bg-green-500',
  scheduled: 'bg-blue-500',
  archived: 'bg-red-500'
};

const STATUS_LABELS = {
  draft: 'Bản nháp',
  published: 'Công khai',
  scheduled: 'Đã lên lịch',
  archived: 'Lưu trữ'
};

const emptyForm = {
  project_master_id: '',
  slug: '',
  display_name: '',
  tagline: '',
  short_description: '',
  full_description: '',
  highlights: [],
  show_price: true,
  price_display: '',
  hero_image: '',
  video_url: '',
  virtual_tour_url: '',
  brochure_url: '',
  template: 'project_full',
  visibility: 'public',
  show_available_units: false,
  show_progress: true,
  show_handover_date: true,
  is_featured: false,
  is_hot: false,
  status: 'draft'
};

const DEMO_PUBLIC_PROJECTS = [
  {
    id: 'public-001',
    project_master_id: 'master-001',
    slug: 'nobu-danang',
    display_name: 'Nobu Residences Danang',
    location: 'Sơn Trà, Đà Nẵng',
    tagline: 'Giao lộ thịnh vượng, dấu ấn đương đại',
    short_description: '264 căn hộ mặt biển, quản lý bởi thương hiệu Nobu danh tiếng.',
    status: 'published',
    is_featured: true,
    is_hot: true,
  },
  {
    id: 'public-002',
    project_master_id: 'master-002',
    slug: 'sun-symphony',
    display_name: 'Sun Symphony Residence',
    location: 'Sơn Trà, Đà Nẵng',
    tagline: 'Giao hưởng ánh sáng bờ Sông Hàn',
    short_description: 'Tổ hợp căn hộ và shophouse đẳng cấp bên bờ sông Hàn.',
    status: 'published',
    is_featured: true,
    is_hot: true,
  },
];

const DEMO_MASTER_PROJECTS = [
  { id: 'master-001', name: 'Nobu Residences Danang' },
  { id: 'master-002', name: 'Sun Symphony Residence' },
];

export default function CMSPublicProjectsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [projects, setProjects] = useState([]);
  const [masterProjects, setMasterProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [highlightInput, setHighlightInput] = useState('');

  const fetchProjects = useCallback(async () => {
    try {
      const data = await cmsPublicProjectsApi.list();
      const projectItems = Array.isArray(data) ? data : [];
      setProjects(projectItems.length > 0 ? projectItems : DEMO_PUBLIC_PROJECTS);
    } catch (err) {
      setProjects(DEMO_PUBLIC_PROJECTS);
      toast.error('Không thể tải danh sách dự án, đang hiển thị dữ liệu mẫu');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMasterProjects = useCallback(async () => {
    try {
      const API_URL = process.env.REACT_APP_BACKEND_URL;
      const res = await fetch(`${API_URL}/api/projects/master`);
      const data = await res.json();
      setMasterProjects(Array.isArray(data) && data.length > 0 ? data : DEMO_MASTER_PROJECTS);
    } catch (err) {
      console.error('Failed to load master projects', err);
      setMasterProjects(DEMO_MASTER_PROJECTS);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
    fetchMasterProjects();
  }, [fetchProjects, fetchMasterProjects]);

  const filteredProjects = projects.filter(p => {
    const matchSearch = p.display_name?.toLowerCase().includes(search.toLowerCase()) ||
                       p.location?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || p.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const openCreateDialog = useCallback(() => {
    setEditingProject(null);
    setForm(emptyForm);
    setActiveTab('basic');
    setIsDialogOpen(true);
  }, []);

  useEffect(() => {
    if (searchParams.get('action') !== 'create') {
      return;
    }

    openCreateDialog();
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('action');
    setSearchParams(nextParams, { replace: true });
  }, [openCreateDialog, searchParams, setSearchParams]);

  const openEditDialog = (project) => {
    setEditingProject(project);
    setForm({
      project_master_id: project.project_master_id || '',
      slug: project.slug || '',
      display_name: project.display_name || '',
      tagline: project.tagline || '',
      short_description: project.short_description || '',
      full_description: project.full_description || '',
      highlights: project.highlights || [],
      show_price: project.show_price !== false,
      price_display: project.price_display || '',
      hero_image: project.hero_image || '',
      video_url: project.video_url || '',
      virtual_tour_url: project.virtual_tour_url || '',
      brochure_url: project.brochure_url || '',
      template: project.template || 'project_full',
      visibility: project.visibility || 'public',
      show_available_units: project.show_available_units || false,
      show_progress: project.show_progress !== false,
      show_handover_date: project.show_handover_date !== false,
      is_featured: project.is_featured || false,
      is_hot: project.is_hot || false,
      status: project.status || 'draft'
    });
    setActiveTab('basic');
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.project_master_id && !editingProject) {
      toast.error('Vui lòng chọn dự án nguồn');
      return;
    }

    setSaving(true);
    try {
      const payload = { ...form };

      if (editingProject) {
        delete payload.project_master_id;
        await cmsPublicProjectsApi.update(editingProject.id, payload);
        toast.success('Đã cập nhật dự án');
      } else {
        await cmsPublicProjectsApi.create(payload);
        toast.success('Đã tạo dự án công khai mới');
      }
      
      setIsDialogOpen(false);
      fetchProjects();
    } catch (err) {
      toast.error('Có lỗi xảy ra khi lưu');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa dự án công khai này?')) return;
    
    try {
      await cmsPublicProjectsApi.delete(id);
      toast.success('Đã xóa dự án');
      fetchProjects();
    } catch (err) {
      toast.error('Không thể xóa dự án');
    }
  };

  const handleSync = async (id) => {
    try {
      await cmsPublicProjectsApi.syncFromMaster(id);
      toast.success('Đã đồng bộ từ dự án gốc');
      fetchProjects();
    } catch (err) {
      toast.error('Không thể đồng bộ');
    }
  };

  const addHighlight = () => {
    if (highlightInput && !form.highlights.includes(highlightInput)) {
      setForm({ ...form, highlights: [...form.highlights, highlightInput] });
      setHighlightInput('');
    }
  };

  const removeHighlight = (hl) => {
    setForm({ ...form, highlights: form.highlights.filter(h => h !== hl) });
  };

  return (
    <div className="p-6 space-y-6" data-testid="cms-public-projects-page">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Dự án công khai</h1>
          <p className="text-muted-foreground">Quản lý trang dự án hiển thị trên website</p>
        </div>
        <Button onClick={openCreateDialog} data-testid="create-public-project-btn">
          <Plus className="w-4 h-4 mr-2" />
          Thêm dự án
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Building2 className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{projects.length}</p>
                <p className="text-sm text-muted-foreground">Tổng dự án</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Eye className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{projects.filter(p => p.status === 'published').length}</p>
                <p className="text-sm text-muted-foreground">Đang hiển thị</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Star className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{projects.filter(p => p.is_featured).length}</p>
                <p className="text-sm text-muted-foreground">Nổi bật</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <Flame className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{projects.filter(p => p.is_hot).length}</p>
                <p className="text-sm text-muted-foreground">Hot</p>
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
                placeholder="Tìm kiếm dự án..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="draft">Bản nháp</SelectItem>
                <SelectItem value="published">Công khai</SelectItem>
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
                <TableHead className="w-[80px]">Ảnh</TableHead>
                <TableHead>Tên dự án</TableHead>
                <TableHead>Vị trí</TableHead>
                <TableHead>Giá</TableHead>
                <TableHead className="text-center">Lượt xem</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">Đang tải...</TableCell>
                </TableRow>
              ) : filteredProjects.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Chưa có dự án công khai nào
                  </TableCell>
                </TableRow>
              ) : (
                filteredProjects.map((project) => (
                  <TableRow key={project.id}>
                    <TableCell>
                      {project.hero_image ? (
                        <img 
                          src={project.hero_image} 
                          alt={project.display_name}
                          className="w-16 h-12 object-cover rounded"
                        />
                      ) : (
                        <div className="w-16 h-12 bg-muted rounded flex items-center justify-center">
                          <Image className="w-4 h-4 text-muted-foreground" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{project.display_name}</p>
                        <p className="text-xs text-muted-foreground">{project.developer_name}</p>
                      </div>
                      <div className="flex gap-1 mt-1">
                        {project.is_featured && (
                          <Badge variant="secondary" className="text-xs">
                            <Star className="w-3 h-3 mr-1" /> Nổi bật
                          </Badge>
                        )}
                        {project.is_hot && (
                          <Badge className="bg-red-500 text-xs">
                            <Flame className="w-3 h-3 mr-1" /> Hot
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">{project.district}, {project.city}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {project.show_price ? (
                        <span>{project.price_display || `${(project.price_from/1e9)?.toFixed(1)} - ${(project.price_to/1e9)?.toFixed(1)} tỷ`}</span>
                      ) : (
                        <span className="text-muted-foreground">Liên hệ</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {(project.views || 0).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge className={STATUS_COLORS[project.status]}>
                        {STATUS_LABELS[project.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleSync(project.id)}
                          title="Đồng bộ từ Master"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => window.open(`/du-an/${project.slug}`, '_blank')}
                          title="Xem trang"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => openEditDialog(project)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleDelete(project.id)}
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
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProject ? 'Chỉnh sửa dự án công khai' : 'Thêm dự án công khai'}
            </DialogTitle>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">Cơ bản</TabsTrigger>
              <TabsTrigger value="media">Media</TabsTrigger>
              <TabsTrigger value="content">Nội dung</TabsTrigger>
              <TabsTrigger value="settings">Cài đặt</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4 mt-4">
              {!editingProject && (
                <div>
                  <label className="text-sm font-medium">Dự án nguồn *</label>
                  <Select value={form.project_master_id} onValueChange={(v) => {
                    const mp = masterProjects.find(p => p.id === v);
                    setForm({ 
                      ...form, 
                      project_master_id: v,
                      display_name: mp?.name || '',
                      short_description: mp?.description || ''
                    });
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn dự án từ Master" />
                    </SelectTrigger>
                    <SelectContent>
                      {masterProjects.map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    Chọn dự án từ danh sách Master để tạo trang công khai
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Tên hiển thị</label>
                  <Input
                    value={form.display_name}
                    onChange={(e) => setForm({ ...form, display_name: e.target.value })}
                    placeholder="Tên dự án hiển thị trên website"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Slug (URL)</label>
                  <Input
                    value={form.slug}
                    onChange={(e) => setForm({ ...form, slug: e.target.value })}
                    placeholder="nobu-danang"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Tagline</label>
                <Input
                  value={form.tagline}
                  onChange={(e) => setForm({ ...form, tagline: e.target.value })}
                  placeholder="VD: Đại đô thị đáng sống bậc nhất phía Đông"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Mô tả ngắn</label>
                <textarea
                  className="w-full min-h-[80px] p-2 border rounded-md resize-y"
                  value={form.short_description}
                  onChange={(e) => setForm({ ...form, short_description: e.target.value })}
                  placeholder="Mô tả ngắn gọn về dự án..."
                />
              </div>

              <div>
                <label className="text-sm font-medium">Điểm nổi bật</label>
                <div className="flex gap-2 mb-2">
                  <Input
                    value={highlightInput}
                    onChange={(e) => setHighlightInput(e.target.value)}
                    placeholder="VD: View sông Sài Gòn"
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addHighlight())}
                  />
                  <Button type="button" onClick={addHighlight} variant="outline">Thêm</Button>
                </div>
                <div className="flex flex-wrap gap-1">
                  {form.highlights.map((hl, idx) => (
                    <Badge key={idx} variant="secondary" className="cursor-pointer" onClick={() => removeHighlight(hl)}>
                      {hl} ×
                    </Badge>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="media" className="space-y-4 mt-4">
              <div>
                <label className="text-sm font-medium">Ảnh Hero</label>
                <Input
                  value={form.hero_image}
                  onChange={(e) => setForm({ ...form, hero_image: e.target.value })}
                  placeholder="URL ảnh đại diện dự án"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Video giới thiệu</label>
                <Input
                  value={form.video_url}
                  onChange={(e) => setForm({ ...form, video_url: e.target.value })}
                  placeholder="URL video YouTube/Vimeo"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Tour 360°</label>
                <Input
                  value={form.virtual_tour_url}
                  onChange={(e) => setForm({ ...form, virtual_tour_url: e.target.value })}
                  placeholder="URL tour ảo 360"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Brochure</label>
                <Input
                  value={form.brochure_url}
                  onChange={(e) => setForm({ ...form, brochure_url: e.target.value })}
                  placeholder="URL file brochure PDF"
                />
              </div>
            </TabsContent>

            <TabsContent value="content" className="space-y-4 mt-4">
              <div>
                <label className="text-sm font-medium">Mô tả chi tiết</label>
                <RichTextEditor
                  value={form.full_description}
                  onChange={(content) => setForm({ ...form, full_description: content })}
                  placeholder="Mô tả chi tiết về dự án..."
                  minHeight="300px"
                />
              </div>
            </TabsContent>

            <TabsContent value="settings" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Trạng thái</label>
                  <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Bản nháp</SelectItem>
                      <SelectItem value="published">Công khai</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Template</label>
                  <Select value={form.template} onValueChange={(v) => setForm({ ...form, template: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="project_full">Đầy đủ</SelectItem>
                      <SelectItem value="project_simple">Đơn giản</SelectItem>
                      <SelectItem value="project_gallery">Gallery</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="p-4 bg-muted rounded-lg space-y-3">
                <p className="text-sm font-medium">Hiển thị giá</p>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.show_price}
                    onChange={(e) => setForm({ ...form, show_price: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm">Hiện giá bán</span>
                </label>
                {form.show_price && (
                  <Input
                    value={form.price_display}
                    onChange={(e) => setForm({ ...form, price_display: e.target.value })}
                    placeholder="VD: Từ 2.5 tỷ"
                    className="mt-2"
                  />
                )}
              </div>

              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.show_progress}
                    onChange={(e) => setForm({ ...form, show_progress: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm">Hiện tiến độ</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.show_handover_date}
                    onChange={(e) => setForm({ ...form, show_handover_date: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm">Hiện ngày bàn giao</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.show_available_units}
                    onChange={(e) => setForm({ ...form, show_available_units: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm">Hiện số căn còn</span>
                </label>
              </div>

              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.is_featured}
                    onChange={(e) => setForm({ ...form, is_featured: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm">Dự án nổi bật</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.is_hot}
                    onChange={(e) => setForm({ ...form, is_hot: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm">Dự án Hot</span>
                </label>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Hủy</Button>
            <Button onClick={handleSubmit} disabled={saving}>
              {saving ? 'Đang lưu...' : (editingProject ? 'Cập nhật' : 'Thêm dự án')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
