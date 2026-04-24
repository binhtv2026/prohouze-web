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
  Plus, Pencil, Trash2, Search, Newspaper, Eye, Star, 
  Calendar, ExternalLink, Check, X, Image
} from 'lucide-react';
import { toast } from 'sonner';
import { cmsArticlesApi, cmsConfigApi } from '@/api/cmsApi';
import RichTextEditor from '@/components/RichTextEditor';
import ImageUpload from '@/components/ImageUpload';

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
  slug: '',
  excerpt: '',
  content: '',
  category: 'market',
  tags: [],
  featured_image: '',
  author_name: 'Admin',
  is_featured: false,
  is_pinned: false,
  allow_comments: true,
  status: 'draft',
  scheduled_at: ''
};

const DEMO_CATEGORIES = {
  market: 'Thị trường',
  project: 'Dự án',
  policy: 'Chính sách',
};

const DEMO_ARTICLES = [
  {
    id: 'article-001',
    title: 'Chính sách bán hàng mới nhất tháng này',
    slug: 'chinh-sach-ban-hang-moi-nhat',
    excerpt: 'Tổng hợp ưu đãi, bảng giá và chính sách thanh toán đang áp dụng.',
    content: '<p>Nội dung mẫu để hiển thị danh sách bài viết.</p>',
    category: 'policy',
    tags: ['ban-hang', 'uu-dai'],
    featured_image: '',
    author_name: 'Admin',
    is_featured: true,
    is_pinned: true,
    allow_comments: true,
    status: 'published',
    published_at: new Date().toISOString(),
  },
  {
    id: 'article-002',
    title: 'Cập nhật tiến độ dự án The Horizon City',
    slug: 'cap-nhat-tien-do-du-an-horizon-city',
    excerpt: 'Tình hình thi công, pháp lý và lịch mở bán mới nhất.',
    content: '<p>Nội dung mẫu để hiển thị danh sách bài viết.</p>',
    category: 'project',
    tags: ['du-an', 'tien-do'],
    featured_image: '',
    author_name: 'Admin',
    is_featured: false,
    is_pinned: false,
    allow_comments: true,
    status: 'draft',
    published_at: null,
  },
];

export default function CMSArticlesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState({});
  const [activeTab, setActiveTab] = useState('basic');
  const [tagInput, setTagInput] = useState('');

  const fetchArticles = useCallback(async () => {
    try {
      const data = await cmsArticlesApi.list();
      const articleItems = Array.isArray(data) ? data : [];
      setArticles(articleItems.length > 0 ? articleItems : DEMO_ARTICLES);
    } catch (err) {
      setArticles(DEMO_ARTICLES);
      toast.error('Không thể tải danh sách bài viết, đang hiển thị dữ liệu mẫu');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchConfig = useCallback(async () => {
    try {
      const cats = await cmsConfigApi.getArticleCategories();
      setCategories(cats || DEMO_CATEGORIES);
    } catch (err) {
      console.error('Failed to load config', err);
      setCategories(DEMO_CATEGORIES);
    }
  }, []);

  useEffect(() => {
    fetchArticles();
    fetchConfig();
  }, [fetchArticles, fetchConfig]);

  const filteredArticles = articles.filter(a => {
    const matchSearch = a.title.toLowerCase().includes(search.toLowerCase()) ||
                       a.excerpt?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || a.status === filterStatus;
    const matchCategory = filterCategory === 'all' || a.category === filterCategory;
    return matchSearch && matchStatus && matchCategory;
  });

  const openCreateDialog = useCallback(() => {
    setEditingArticle(null);
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

  const openEditDialog = (article) => {
    setEditingArticle(article);
    setForm({
      title: article.title || '',
      slug: article.slug || '',
      excerpt: article.excerpt || '',
      content: article.content || '',
      category: article.category || 'market',
      tags: article.tags || [],
      featured_image: article.featured_image || '',
      author_name: article.author_name || 'Admin',
      is_featured: article.is_featured || false,
      is_pinned: article.is_pinned || false,
      allow_comments: article.allow_comments !== false,
      status: article.status || 'draft',
      scheduled_at: article.scheduled_at ? article.scheduled_at.split('T')[0] : ''
    });
    setActiveTab('basic');
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.title || !form.excerpt || !form.content) {
      toast.error('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...form,
        scheduled_at: form.scheduled_at ? new Date(form.scheduled_at).toISOString() : null,
      };

      if (editingArticle) {
        await cmsArticlesApi.update(editingArticle.id, payload);
        toast.success('Đã cập nhật bài viết');
      } else {
        await cmsArticlesApi.create(payload);
        toast.success('Đã tạo bài viết mới');
      }
      
      setIsDialogOpen(false);
      fetchArticles();
    } catch (err) {
      toast.error('Có lỗi xảy ra khi lưu');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa bài viết này?')) return;
    
    try {
      await cmsArticlesApi.delete(id);
      toast.success('Đã xóa bài viết');
      fetchArticles();
    } catch (err) {
      toast.error('Không thể xóa bài viết');
    }
  };

  const handlePublish = async (id) => {
    try {
      await cmsArticlesApi.publish(id);
      toast.success('Đã xuất bản bài viết');
      fetchArticles();
    } catch (err) {
      toast.error('Không thể xuất bản bài viết');
    }
  };

  const addTag = () => {
    if (tagInput && !form.tags.includes(tagInput)) {
      setForm({ ...form, tags: [...form.tags, tagInput] });
      setTagInput('');
    }
  };

  const removeTag = (tag) => {
    setForm({ ...form, tags: form.tags.filter(t => t !== tag) });
  };

  return (
    <div className="p-6 space-y-6" data-testid="cms-articles-page">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Quản lý Bài viết</h1>
          <p className="text-muted-foreground">Tạo và quản lý bài viết tin tức, blog</p>
        </div>
        <Button onClick={openCreateDialog} data-testid="create-article-btn">
          <Plus className="w-4 h-4 mr-2" />
          Viết bài mới
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Newspaper className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{articles.length}</p>
                <p className="text-sm text-muted-foreground">Tổng bài</p>
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
                <p className="text-2xl font-bold">{articles.filter(a => a.status === 'published').length}</p>
                <p className="text-sm text-muted-foreground">Đã xuất bản</p>
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
                <p className="text-2xl font-bold">{articles.filter(a => a.is_featured).length}</p>
                <p className="text-sm text-muted-foreground">Nổi bật</p>
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
                <p className="text-2xl font-bold">{articles.reduce((acc, a) => acc + (a.views || 0), 0).toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Lượt xem</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                <Calendar className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{articles.filter(a => a.status === 'draft').length}</p>
                <p className="text-sm text-muted-foreground">Bản nháp</p>
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
                placeholder="Tìm kiếm bài viết..."
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
              </SelectContent>
            </Select>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Danh mục" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả danh mục</SelectItem>
                {Object.entries(categories).map(([key, val]) => (
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
                <TableHead className="w-[80px]">Ảnh</TableHead>
                <TableHead>Tiêu đề</TableHead>
                <TableHead>Danh mục</TableHead>
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
              ) : filteredArticles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Chưa có bài viết nào
                  </TableCell>
                </TableRow>
              ) : (
                filteredArticles.map((article) => (
                  <TableRow key={article.id}>
                    <TableCell>
                      {article.featured_image ? (
                        <img 
                          src={article.featured_image} 
                          alt={article.title}
                          className="w-16 h-10 object-cover rounded"
                        />
                      ) : (
                        <div className="w-16 h-10 bg-muted rounded flex items-center justify-center">
                          <Image className="w-4 h-4 text-muted-foreground" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium line-clamp-1">{article.title}</p>
                        <p className="text-xs text-muted-foreground line-clamp-1">{article.excerpt}</p>
                      </div>
                      <div className="flex gap-1 mt-1">
                        {article.is_featured && (
                          <Badge variant="secondary" className="text-xs">
                            <Star className="w-3 h-3 mr-1" />
                            Nổi bật
                          </Badge>
                        )}
                        {article.is_pinned && (
                          <Badge variant="secondary" className="text-xs">Ghim</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        style={{ backgroundColor: categories[article.category]?.color || '#gray' }}
                        className="text-white"
                      >
                        {categories[article.category]?.label || article.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      {(article.views || 0).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge className={STATUS_COLORS[article.status]}>
                        {STATUS_LABELS[article.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {article.updated_at ? new Date(article.updated_at).toLocaleDateString('vi-VN') : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {article.status !== 'published' && (
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handlePublish(article.id)}
                            title="Xuất bản"
                          >
                            <Check className="w-4 h-4 text-green-500" />
                          </Button>
                        )}
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => window.open(`/tin-tuc/${article.slug}`, '_blank')}
                          title="Xem bài viết"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => openEditDialog(article)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleDelete(article.id)}
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
              {editingArticle ? 'Chỉnh sửa bài viết' : 'Viết bài mới'}
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
                  placeholder="Nhập tiêu đề bài viết"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Danh mục</label>
                  <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(categories).map(([key, val]) => (
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
                <label className="text-sm font-medium">Ảnh đại diện</label>
                <ImageUpload
                  value={form.featured_image}
                  onChange={(url) => setForm({ ...form, featured_image: url })}
                  placeholder="Chọn ảnh bìa"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Tóm tắt *</label>
                <textarea
                  className="w-full min-h-[80px] p-2 border rounded-md resize-y"
                  value={form.excerpt}
                  onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
                  placeholder="Tóm tắt ngắn gọn nội dung bài viết..."
                />
              </div>

              <div>
                <label className="text-sm font-medium">Tags</label>
                <div className="flex gap-2 mb-2">
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    placeholder="Nhập tag"
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  />
                  <Button type="button" onClick={addTag} variant="outline">Thêm</Button>
                </div>
                <div className="flex flex-wrap gap-1">
                  {form.tags.map((tag, idx) => (
                    <Badge key={idx} variant="secondary" className="cursor-pointer" onClick={() => removeTag(tag)}>
                      {tag} <X className="w-3 h-3 ml-1" />
                    </Badge>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="content" className="space-y-4 mt-4">
              <div>
                <label className="text-sm font-medium">Nội dung bài viết *</label>
                <RichTextEditor
                  value={form.content}
                  onChange={(content) => setForm({ ...form, content })}
                  placeholder="Nhập nội dung bài viết..."
                  minHeight="400px"
                />
              </div>
            </TabsContent>

            <TabsContent value="settings" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Tác giả</label>
                  <Input
                    value={form.author_name}
                    onChange={(e) => setForm({ ...form, author_name: e.target.value })}
                    placeholder="Tên tác giả"
                  />
                </div>
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

              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.is_featured}
                    onChange={(e) => setForm({ ...form, is_featured: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm">Bài viết nổi bật</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.is_pinned}
                    onChange={(e) => setForm({ ...form, is_pinned: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm">Ghim lên đầu</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.allow_comments}
                    onChange={(e) => setForm({ ...form, allow_comments: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm">Cho phép bình luận</span>
                </label>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Hủy</Button>
            <Button onClick={handleSubmit} disabled={saving}>
              {saving ? 'Đang lưu...' : (editingArticle ? 'Cập nhật' : 'Đăng bài')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
