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
  Plus, Pencil, Trash2, Search, FileText, Eye, Globe, 
  Calendar, ExternalLink, MoreVertical, Check, X
} from 'lucide-react';
import { toast } from 'sonner';
import { cmsPagesApi, cmsConfigApi } from '@/api/cmsApi';
import RichTextEditor from '@/components/RichTextEditor';

const STATUS_COLORS = {
  draft: 'bg-gray-500',
  pending_review: 'bg-yellow-500',
  scheduled: 'bg-blue-500',
  published: 'bg-green-500',
  unpublished: 'bg-orange-500',
  archived: 'bg-red-500'
};

const STATUS_LABELS = {
  draft: 'Bản nháp',
  pending_review: 'Chờ duyệt',
  scheduled: 'Đã lên lịch',
  published: 'Đã xuất bản',
  unpublished: 'Đã gỡ',
  archived: 'Lưu trữ'
};

const emptyForm = {
  title: '',
  page_type: 'custom',
  slug: '',
  content: '',
  excerpt: '',
  featured_image: '',
  template: 'default',
  is_in_menu: false,
  menu_order: 0,
  visibility: 'public',
  status: 'draft',
  scheduled_at: ''
};

const DEMO_PAGE_TYPES = {
  custom: 'Trang tuỳ chỉnh',
  landing: 'Landing page',
  legal: 'Trang pháp lý',
};

const DEMO_PAGES = [
  {
    id: 'page-001',
    title: 'Giới thiệu ProHouze',
    page_type: 'custom',
    slug: 'gioi-thieu',
    content: '<p>Trang giới thiệu doanh nghiệp.</p>',
    excerpt: 'Thông tin giới thiệu doanh nghiệp và hệ sinh thái.',
    status: 'published',
    is_in_menu: true,
  },
  {
    id: 'page-002',
    title: 'Chính sách thanh toán',
    page_type: 'legal',
    slug: 'chinh-sach-thanh-toan',
    content: '<p>Nội dung chính sách thanh toán.</p>',
    excerpt: 'Trang pháp lý phục vụ sale gửi khách.',
    status: 'draft',
    is_in_menu: false,
  },
];

export default function CMSPagesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPage, setEditingPage] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [pageTypes, setPageTypes] = useState({});
  const [activeTab, setActiveTab] = useState('basic');

  const fetchPages = useCallback(async () => {
    try {
      const data = await cmsPagesApi.list();
      const pageItems = Array.isArray(data) ? data : [];
      setPages(pageItems.length > 0 ? pageItems : DEMO_PAGES);
    } catch (err) {
      setPages(DEMO_PAGES);
      toast.error('Không thể tải danh sách trang, đang hiển thị dữ liệu mẫu');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchConfig = useCallback(async () => {
    try {
      const types = await cmsConfigApi.getStaticPageTypes();
      setPageTypes(types || DEMO_PAGE_TYPES);
    } catch (err) {
      console.error('Failed to load config', err);
      setPageTypes(DEMO_PAGE_TYPES);
    }
  }, []);

  useEffect(() => {
    fetchPages();
    fetchConfig();
  }, [fetchPages, fetchConfig]);

  const filteredPages = pages.filter(p => {
    const matchSearch = p.title.toLowerCase().includes(search.toLowerCase()) ||
                       p.slug.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || p.status === filterStatus;
    const matchType = filterType === 'all' || p.page_type === filterType;
    return matchSearch && matchStatus && matchType;
  });

  const openCreateDialog = useCallback(() => {
    setEditingPage(null);
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

  const openEditDialog = (page) => {
    setEditingPage(page);
    setForm({
      title: page.title || '',
      page_type: page.page_type || 'custom',
      slug: page.slug || '',
      content: page.content || '',
      excerpt: page.excerpt || '',
      featured_image: page.featured_image || '',
      template: page.template || 'default',
      is_in_menu: page.is_in_menu || false,
      menu_order: page.menu_order || 0,
      visibility: page.visibility || 'public',
      status: page.status || 'draft',
      scheduled_at: page.scheduled_at ? page.scheduled_at.split('T')[0] : ''
    });
    setActiveTab('basic');
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.title) {
      toast.error('Vui lòng nhập tiêu đề trang');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...form,
        scheduled_at: form.scheduled_at ? new Date(form.scheduled_at).toISOString() : null,
      };

      if (editingPage) {
        await cmsPagesApi.update(editingPage.id, payload);
        toast.success('Đã cập nhật trang');
      } else {
        await cmsPagesApi.create(payload);
        toast.success('Đã tạo trang mới');
      }
      
      setIsDialogOpen(false);
      fetchPages();
    } catch (err) {
      toast.error('Có lỗi xảy ra khi lưu');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa trang này?')) return;
    
    try {
      await cmsPagesApi.delete(id);
      toast.success('Đã xóa trang');
      fetchPages();
    } catch (err) {
      toast.error('Không thể xóa trang');
    }
  };

  const handlePublish = async (id) => {
    try {
      await cmsPagesApi.publish(id);
      toast.success('Đã xuất bản trang');
      fetchPages();
    } catch (err) {
      toast.error('Không thể xuất bản trang');
    }
  };

  const handleUnpublish = async (id) => {
    try {
      await cmsPagesApi.unpublish(id);
      toast.success('Đã gỡ trang');
      fetchPages();
    } catch (err) {
      toast.error('Không thể gỡ trang');
    }
  };

  return (
    <div className="p-6 space-y-6" data-testid="cms-pages-page">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Quản lý Trang</h1>
          <p className="text-muted-foreground">Tạo và quản lý các trang tĩnh trên website</p>
        </div>
        <Button onClick={openCreateDialog} data-testid="create-page-btn">
          <Plus className="w-4 h-4 mr-2" />
          Tạo trang mới
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pages.length}</p>
                <p className="text-sm text-muted-foreground">Tổng trang</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Globe className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pages.filter(p => p.status === 'published').length}</p>
                <p className="text-sm text-muted-foreground">Đã xuất bản</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                <FileText className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pages.filter(p => p.status === 'draft').length}</p>
                <p className="text-sm text-muted-foreground">Bản nháp</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Eye className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pages.reduce((acc, p) => acc + (p.views || 0), 0).toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Lượt xem</p>
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
                placeholder="Tìm kiếm trang..."
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
                <SelectItem value="published">Đã xuất bản</SelectItem>
                <SelectItem value="scheduled">Đã lên lịch</SelectItem>
                <SelectItem value="archived">Lưu trữ</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Loại trang" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả loại</SelectItem>
                {Object.entries(pageTypes).map(([key, val]) => (
                  <SelectItem key={key} value={key}>{val.label}</SelectItem>
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
                <TableHead>Tiêu đề</TableHead>
                <TableHead>Loại</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead className="text-center">Lượt xem</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Cập nhật</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">Đang tải...</TableCell>
                </TableRow>
              ) : filteredPages.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Chưa có trang nào
                  </TableCell>
                </TableRow>
              ) : (
                filteredPages.map((page) => (
                  <TableRow key={page.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{page.title}</p>
                        {page.is_in_menu && (
                          <Badge variant="secondary" className="mt-1 text-xs">
                            Hiển thị trên menu
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {pageTypes[page.page_type]?.label || page.page_type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted px-1 py-0.5 rounded">/{page.slug}</code>
                    </TableCell>
                    <TableCell className="text-center">
                      {(page.views || 0).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge className={STATUS_COLORS[page.status]}>
                        {STATUS_LABELS[page.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {page.updated_at ? new Date(page.updated_at).toLocaleDateString('vi-VN') : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {page.status === 'published' ? (
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleUnpublish(page.id)}
                            title="Gỡ xuống"
                          >
                            <X className="w-4 h-4 text-orange-500" />
                          </Button>
                        ) : (
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handlePublish(page.id)}
                            title="Xuất bản"
                          >
                            <Check className="w-4 h-4 text-green-500" />
                          </Button>
                        )}
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => window.open(`/${page.slug}`, '_blank')}
                          title="Xem trang"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => openEditDialog(page)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleDelete(page.id)}
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
              {editingPage ? 'Chỉnh sửa trang' : 'Tạo trang mới'}
            </DialogTitle>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">Cơ bản</TabsTrigger>
              <TabsTrigger value="content">Nội dung</TabsTrigger>
              <TabsTrigger value="settings">Cài đặt</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4 mt-4">
              <div>
                <label className="text-sm font-medium">Tiêu đề *</label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Nhập tiêu đề trang"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Loại trang</label>
                  <Select value={form.page_type} onValueChange={(v) => setForm({ ...form, page_type: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(pageTypes).map(([key, val]) => (
                        <SelectItem key={key} value={key}>{val.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Slug (URL)</label>
                  <Input
                    value={form.slug}
                    onChange={(e) => setForm({ ...form, slug: e.target.value })}
                    placeholder="tu-dong-tao-tu-tieu-de"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Tóm tắt</label>
                <textarea
                  className="w-full min-h-[80px] p-2 border rounded-md resize-y"
                  value={form.excerpt}
                  onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
                  placeholder="Mô tả ngắn gọn nội dung trang..."
                />
              </div>

              <div>
                <label className="text-sm font-medium">Ảnh đại diện</label>
                <Input
                  value={form.featured_image}
                  onChange={(e) => setForm({ ...form, featured_image: e.target.value })}
                  placeholder="URL ảnh đại diện"
                />
              </div>
            </TabsContent>

            <TabsContent value="content" className="space-y-4 mt-4">
              <div>
                <label className="text-sm font-medium">Nội dung trang</label>
                <RichTextEditor
                  value={form.content}
                  onChange={(content) => setForm({ ...form, content })}
                  placeholder="Nhập nội dung trang..."
                  minHeight="350px"
                />
              </div>
            </TabsContent>

            <TabsContent value="settings" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Template</label>
                  <Select value={form.template} onValueChange={(v) => setForm({ ...form, template: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Mặc định</SelectItem>
                      <SelectItem value="full_width">Full Width</SelectItem>
                      <SelectItem value="sidebar">Có Sidebar</SelectItem>
                      <SelectItem value="contact">Liên hệ</SelectItem>
                      <SelectItem value="about">Giới thiệu</SelectItem>
                      <SelectItem value="faq">FAQ</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Hiển thị</label>
                  <Select value={form.visibility} onValueChange={(v) => setForm({ ...form, visibility: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">Công khai</SelectItem>
                      <SelectItem value="registered">Thành viên</SelectItem>
                      <SelectItem value="internal">Nội bộ</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Trạng thái</label>
                  <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Bản nháp</SelectItem>
                      <SelectItem value="published">Xuất bản ngay</SelectItem>
                      <SelectItem value="scheduled">Lên lịch</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {form.status === 'scheduled' && (
                  <div>
                    <label className="text-sm font-medium">Ngày xuất bản</label>
                    <Input
                      type="date"
                      value={form.scheduled_at}
                      onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })}
                    />
                  </div>
                )}
              </div>

              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.is_in_menu}
                    onChange={(e) => setForm({ ...form, is_in_menu: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm">Hiển thị trên menu</span>
                </label>
              </div>

              {form.is_in_menu && (
                <div>
                  <label className="text-sm font-medium">Thứ tự trong menu</label>
                  <Input
                    type="number"
                    value={form.menu_order}
                    onChange={(e) => setForm({ ...form, menu_order: parseInt(e.target.value) || 0 })}
                    min={0}
                  />
                </div>
              )}
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Hủy</Button>
            <Button onClick={handleSubmit} disabled={saving}>
              {saving ? 'Đang lưu...' : (editingPage ? 'Cập nhật' : 'Tạo trang')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
