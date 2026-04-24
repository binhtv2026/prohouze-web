import React, { useState, useEffect } from 'react';
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
import {
  Plus, Pencil, Trash2, Search, Newspaper, Eye, Star,
  Calendar, RefreshCw, ExternalLink, Image,
  CheckCircle, XCircle, Sparkles, Clock, BookOpen,
  ThumbsUp, AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';
import ImageUpload from '@/components/ImageUpload';
import RichTextEditor from '@/components/RichTextEditor';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const HANDBOOK_TABS = [
  { id: 'all',       label: 'Nổi bật',     emoji: '🔥' },
  { id: 'market',    label: 'Thị trường',   emoji: '📈' },
  { id: 'buy',       label: 'Mua nhà',      emoji: '🏠' },
  { id: 'invest',    label: 'Đầu tư',       emoji: '💰' },
  { id: 'finance',   label: 'Tài chính',    emoji: '🏦' },
  { id: 'legal',     label: 'Pháp lý',      emoji: '⚖️' },
  { id: 'design',    label: 'Nhà đẹp',      emoji: '🏡' },
  { id: 'fengshui',  label: 'Phong thủy',   emoji: '🧭' },
  { id: 'developer', label: 'Doanh nghiệp', emoji: '🏢' },
  { id: 'review',    label: 'Review Dự án', emoji: '📋' },
];

// Backward compat: map old category keys → new
const CAT_COMPAT = { market: 'market', project: 'review', company: 'developer', tips: 'design' };

const STATUS_CONFIG = {
  published: { label: 'Đã xuất bản', color: 'bg-green-100 text-green-700', dot: 'bg-green-500' },
  pending:   { label: 'Chờ duyệt',   color: 'bg-amber-100 text-amber-700',  dot: 'bg-amber-500' },
  draft:     { label: 'Bản nháp',    color: 'bg-slate-100 text-slate-600',  dot: 'bg-slate-400' },
  rejected:  { label: 'Từ chối',     color: 'bg-red-100 text-red-600',      dot: 'bg-red-400'   },
};

const emptyForm = {
  title: '',
  slug: '',
  excerpt: '',
  content: '',
  category: 'market',
  image: '',
  author: 'Admin',
  is_featured: false,
  status: 'draft',
  is_ai_generated: false,
  published_at: '',
};

// ─── Mock AI articles for demo when API is empty ────────────────────────────
const MOCK_PENDING = [
  {
    id: 'ai-1', title: 'Kinh nghiệm mua nhà lần đầu: 10 điều cần kiểm tra trước khi đặt cọc',
    excerpt: 'Mua nhà lần đầu rất dễ mắc bẫy. Đây là checklist 10 điều quan trọng nhất bạn cần kiểm tra.',
    image: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400',
    category: 'buy', status: 'pending', is_ai_generated: true,
    created_at: new Date().toISOString(), views: 0, is_featured: false,
    content: 'Nội dung bài viết đã được AI tạo ra...',
  },
  {
    id: 'ai-2', title: 'Vay mua nhà ngân hàng nào lãi suất tốt nhất tháng 6/2025?',
    excerpt: 'So sánh lãi suất vay mua nhà của 10 ngân hàng lớn tại Việt Nam.',
    image: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400',
    category: 'finance', status: 'pending', is_ai_generated: true,
    created_at: new Date().toISOString(), views: 0, is_featured: false,
    content: 'Nội dung bài viết đã được AI tạo ra...',
  },
  {
    id: 'ai-3', title: 'Thị trường căn hộ Hà Nội Q2/2025: Nguồn cung khan hiếm, giá tăng mạnh',
    excerpt: 'Phân tích chi tiết biến động thị trường căn hộ Hà Nội trong quý 2/2025.',
    image: 'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=400',
    category: 'market', status: 'pending', is_ai_generated: true,
    created_at: new Date().toISOString(), views: 0, is_featured: false,
    content: 'Nội dung bài viết đã được AI tạo ra...',
  },
];

export default function AdminNewsPage() {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [activeWorkflowTab, setActiveWorkflowTab] = useState('pending');

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewArticle, setPreviewArticle] = useState(null);
  const [editingNews, setEditingNews] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [approvingId, setApprovingId] = useState(null);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchNews = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/content/news`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      // Inject compat status field if missing
      setNews(data.map(n => ({
        ...n,
        status: n.status || (n.is_published ? 'published' : 'draft'),
        category: CAT_COMPAT[n.category] || n.category,
        is_ai_generated: n.is_ai_generated || false,
      })));
    } catch {
      // Use mock data when API unavailable
      setNews(MOCK_PENDING);
      toast.info('Dùng dữ liệu demo. Kết nối backend để dùng real data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchNews(); }, []);

  // ── Stats ──────────────────────────────────────────────────────────────────
  const counts = {
    total:     news.length,
    pending:   news.filter(n => n.status === 'pending').length,
    published: news.filter(n => n.status === 'published').length,
    draft:     news.filter(n => n.status === 'draft').length,
    ai:        news.filter(n => n.is_ai_generated).length,
  };

  // ── Filtered list ──────────────────────────────────────────────────────────
  const filteredNews = news.filter(n => {
    const matchSearch = n.title?.toLowerCase().includes(search.toLowerCase()) ||
                        n.excerpt?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || n.status === filterStatus;
    const matchCat    = filterCategory === 'all' || n.category === filterCategory;
    const matchTab    = activeWorkflowTab === 'all' || n.status === activeWorkflowTab;
    return matchSearch && matchStatus && matchCat && matchTab;
  });

  // ── Approve / Reject ───────────────────────────────────────────────────────
  const handleApprove = async (id) => {
    setApprovingId(id);
    try {
      const res = await fetch(`${API_URL}/api/admin/content/news/${id}/approve`, { method: 'POST' });
      if (res.ok) {
        setNews(prev => prev.map(n => n.id === id ? { ...n, status: 'published', is_published: true } : n));
        toast.success('✅ Đã duyệt & xuất bản bài viết!');
      } else throw new Error();
    } catch {
      // Fallback: update local state for demo
      setNews(prev => prev.map(n => n.id === id ? { ...n, status: 'published', is_published: true } : n));
      toast.success('✅ Đã duyệt bài viết (demo mode)');
    } finally {
      setApprovingId(null);
    }
  };

  const handleReject = async (id) => {
    const reason = window.prompt('Lý do từ chối (không bắt buộc):');
    if (reason === null) return; // cancelled
    try {
      await fetch(`${API_URL}/api/admin/content/news/${id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
    } catch {}
    setNews(prev => prev.map(n => n.id === id ? { ...n, status: 'rejected' } : n));
    toast.info('Đã từ chối bài viết.');
  };

  // ── CRUD ───────────────────────────────────────────────────────────────────
  const openCreateDialog = () => {
    setEditingNews(null);
    setForm({ ...emptyForm, published_at: new Date().toISOString().split('T')[0] });
    setIsDialogOpen(true);
  };

  const openEditDialog = (article) => {
    setEditingNews(article);
    setForm({ ...article, published_at: article.published_at ? article.published_at.split('T')[0] : '' });
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
        is_published: form.status === 'published',
        published_at: form.published_at ? new Date(form.published_at).toISOString() : null,
      };
      const url = editingNews
        ? `${API_URL}/api/admin/content/news/${editingNews.id}`
        : `${API_URL}/api/admin/content/news`;
      const res = await fetch(url, {
        method: editingNews ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error();
      toast.success(editingNews ? 'Đã cập nhật bài viết' : 'Đã tạo bài viết mới');
      setIsDialogOpen(false);
      fetchNews();
    } catch {
      // Demo mode: update local state
      if (editingNews) {
        setNews(prev => prev.map(n => n.id === editingNews.id ? { ...n, ...form } : n));
      } else {
        setNews(prev => [...prev, { ...form, id: Date.now().toString(), views: 0, created_at: new Date().toISOString() }]);
      }
      toast.success(editingNews ? 'Đã cập nhật (demo)' : 'Đã tạo bài (demo)');
      setIsDialogOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Xóa bài viết này?')) return;
    try {
      await fetch(`${API_URL}/api/admin/content/news/${id}`, { method: 'DELETE' });
    } catch {}
    setNews(prev => prev.filter(n => n.id !== id));
    toast.success('Đã xóa bài viết');
  };

  const getCatInfo = (catId) => HANDBOOK_TABS.find(t => t.id === catId) || HANDBOOK_TABS[0];
  const getStatus  = (s) => STATUS_CONFIG[s] || STATUS_CONFIG.draft;

  // ── RENDER ─────────────────────────────────────────────────────────────────
  return (
    <div className="p-6 space-y-6" data-testid="admin-news-page">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-[#316585]" />
            Quản lý Cẩm nang
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Duyệt nội dung AI · Quản lý 10 chuyên mục · Xuất bản lên website
          </p>
        </div>
        <Button onClick={openCreateDialog} data-testid="create-news-btn">
          <Plus className="w-4 h-4 mr-2" />
          Viết bài mới
        </Button>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'Tổng bài',    value: counts.total,     icon: <Newspaper className="w-4 h-4" />, color: 'text-blue-600 bg-blue-100' },
          { label: 'Chờ duyệt',   value: counts.pending,   icon: <Clock className="w-4 h-4" />,     color: 'text-amber-600 bg-amber-100', pulse: counts.pending > 0 },
          { label: 'Đã xuất bản', value: counts.published, icon: <CheckCircle className="w-4 h-4" />,color: 'text-green-600 bg-green-100' },
          { label: 'Bản nháp',    value: counts.draft,     icon: <Eye className="w-4 h-4" />,       color: 'text-slate-600 bg-slate-100' },
          { label: 'Bài AI',      value: counts.ai,        icon: <Sparkles className="w-4 h-4" />,  color: 'text-violet-600 bg-violet-100' },
        ].map(s => (
          <Card key={s.label} className={s.pulse ? 'ring-2 ring-amber-400 ring-offset-1' : ''}>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded-lg ${s.color}`}>{s.icon}</div>
                <div>
                  <p className="text-xl font-bold leading-none">{s.value}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Workflow tabs */}
      <div className="flex gap-1 border-b">
        {[
          { id: 'pending',   label: `⏳ Chờ duyệt (${counts.pending})`,   urgent: counts.pending > 0 },
          { id: 'published', label: `✅ Đã xuất bản (${counts.published})` },
          { id: 'draft',     label: `📝 Bản nháp (${counts.draft})`        },
          { id: 'all',       label: '🗂️ Tất cả'                           },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveWorkflowTab(tab.id)}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all
              ${activeWorkflowTab === tab.id
                ? 'border-[#316585] text-[#316585]'
                : 'border-transparent text-slate-500 hover:text-[#316585]'
              } ${tab.urgent ? 'animate-pulse' : ''}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm bài viết..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder="Chuyên mục" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả chuyên mục</SelectItem>
            {HANDBOOK_TABS.map(t => (
              <SelectItem key={t.id} value={t.id}>{t.emoji} {t.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Pending AI articles — special card view */}
      {activeWorkflowTab === 'pending' && filteredNews.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-amber-600 font-semibold text-sm">
            <AlertTriangle className="w-4 h-4" />
            {filteredNews.length} bài AI đang chờ sếp duyệt
          </div>
          {filteredNews.map(article => (
            <Card key={article.id} className="border-l-4 border-l-amber-400 hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex gap-4">
                  {/* Thumbnail */}
                  {article.image && (
                    <img
                      src={article.image}
                      alt={article.title}
                      className="w-24 h-16 object-cover rounded-lg flex-shrink-0"
                    />
                  )}
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-bold bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Sparkles className="w-3 h-3" /> AI tạo
                          </span>
                          <span className="text-xs font-semibold text-slate-500">
                            {getCatInfo(article.category).emoji} {getCatInfo(article.category).label}
                          </span>
                          <span className="text-xs text-slate-400">
                            {article.created_at ? new Date(article.created_at).toLocaleDateString('vi-VN') : ''}
                          </span>
                        </div>
                        <h3 className="font-bold text-slate-900 line-clamp-1">{article.title}</h3>
                        <p className="text-sm text-slate-500 line-clamp-2 mt-0.5">{article.excerpt}</p>
                      </div>
                      {/* Action buttons */}
                      <div className="flex gap-2 flex-shrink-0">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => { setPreviewArticle(article); setIsPreviewOpen(true); }}
                        >
                          <Eye className="w-3.5 h-3.5 mr-1" /> Xem
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEditDialog(article)}
                        >
                          <Pencil className="w-3.5 h-3.5 mr-1" /> Sửa
                        </Button>
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 text-white"
                          onClick={() => handleApprove(article.id)}
                          disabled={approvingId === article.id}
                        >
                          <ThumbsUp className="w-3.5 h-3.5 mr-1" />
                          {approvingId === article.id ? 'Đang duyệt...' : 'Duyệt'}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-red-200 text-red-500 hover:bg-red-50"
                          onClick={() => handleReject(article.id)}
                        >
                          <XCircle className="w-3.5 h-3.5 mr-1" /> Từ chối
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty pending state */}
      {activeWorkflowTab === 'pending' && filteredNews.length === 0 && !loading && (
        <div className="text-center py-16 text-slate-400">
          <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-400" />
          <p className="font-semibold text-slate-600">Không có bài nào chờ duyệt!</p>
          <p className="text-sm mt-1">Tất cả nội dung AI đã được xử lý.</p>
        </div>
      )}

      {/* Table view for published / draft / all */}
      {activeWorkflowTab !== 'pending' && (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">Ảnh</TableHead>
                  <TableHead>Tiêu đề</TableHead>
                  <TableHead>Chuyên mục</TableHead>
                  <TableHead className="text-center">Lượt xem</TableHead>
                  <TableHead>Ngày đăng</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">Đang tải...</TableCell>
                  </TableRow>
                ) : filteredNews.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Không có bài viết nào
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredNews.map((article) => (
                    <TableRow key={article.id}>
                      <TableCell>
                        {article.image ? (
                          <img src={article.image} alt={article.title} className="w-16 h-10 object-cover rounded" />
                        ) : (
                          <div className="w-16 h-10 bg-muted rounded flex items-center justify-center">
                            <Image className="w-4 h-4 text-muted-foreground" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <p className="font-medium line-clamp-1">{article.title}</p>
                            {article.is_ai_generated && (
                              <span className="text-[10px] font-bold bg-violet-100 text-violet-600 px-1.5 py-0.5 rounded-full flex-shrink-0 flex items-center gap-0.5">
                                <Sparkles className="w-2.5 h-2.5" /> AI
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-1">{article.excerpt}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{getCatInfo(article.category).emoji} {getCatInfo(article.category).label}</span>
                      </TableCell>
                      <TableCell className="text-center">{(article.views || 0).toLocaleString()}</TableCell>
                      <TableCell>
                        {article.published_at ? new Date(article.published_at).toLocaleDateString('vi-VN') : '-'}
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-1 rounded-full ${getStatus(article.status).color}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${getStatus(article.status).dot}`} />
                          {getStatus(article.status).label}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {article.status === 'pending' && (
                            <>
                              <Button size="icon" variant="ghost" className="text-green-600 hover:bg-green-50"
                                onClick={() => handleApprove(article.id)} title="Duyệt">
                                <CheckCircle className="w-4 h-4" />
                              </Button>
                              <Button size="icon" variant="ghost" className="text-red-500 hover:bg-red-50"
                                onClick={() => handleReject(article.id)} title="Từ chối">
                                <XCircle className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                          <Button variant="ghost" size="icon"
                            onClick={() => window.open(`/news/${article.id}`, '_blank')} title="Xem">
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => openEditDialog(article)}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(article.id)}>
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
      )}

      {/* ── Preview Dialog ─────────────────────────────────────────────────── */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" /> Xem trước bài viết AI
            </DialogTitle>
          </DialogHeader>
          {previewArticle && (
            <div className="space-y-4">
              {previewArticle.is_ai_generated && (
                <div className="flex items-center gap-2 bg-violet-50 border border-violet-200 rounded-lg p-3 text-sm text-violet-700">
                  <Sparkles className="w-4 h-4 flex-shrink-0" />
                  Bài viết này được tạo bởi AI. Vui lòng kiểm tra nội dung trước khi duyệt.
                </div>
              )}
              {previewArticle.image && (
                <img src={previewArticle.image} alt={previewArticle.title}
                  className="w-full aspect-video object-cover rounded-xl" />
              )}
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <span className="font-semibold text-[#316585]">
                  {getCatInfo(previewArticle.category).emoji} {getCatInfo(previewArticle.category).label}
                </span>
                <span>·</span>
                <span>{previewArticle.created_at ? new Date(previewArticle.created_at).toLocaleDateString('vi-VN') : ''}</span>
              </div>
              <h2 className="text-xl font-bold">{previewArticle.title}</h2>
              <p className="text-slate-600 italic">{previewArticle.excerpt}</p>
              <div className="prose prose-sm max-w-none text-slate-700 border-t pt-4">
                {previewArticle.content}
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsPreviewOpen(false)}>Đóng</Button>
            {previewArticle?.status === 'pending' && (
              <>
                <Button variant="outline" className="border-red-200 text-red-500"
                  onClick={() => { setIsPreviewOpen(false); handleReject(previewArticle.id); }}>
                  <XCircle className="w-4 h-4 mr-1" /> Từ chối
                </Button>
                <Button className="bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => { setIsPreviewOpen(false); handleApprove(previewArticle.id); }}
                  disabled={approvingId === previewArticle?.id}>
                  <ThumbsUp className="w-4 h-4 mr-1" /> Duyệt & Xuất bản
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Create / Edit Dialog ───────────────────────────────────────────── */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingNews ? 'Chỉnh sửa bài viết' : 'Viết bài mới'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Tiêu đề *</label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Nhập tiêu đề bài viết" />
            </div>
            <div>
              <label className="text-sm font-medium">Slug (URL)</label>
              <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="tu-dong-tao-tu-tieu-de" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Chuyên mục *</label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {HANDBOOK_TABS.map(t => (
                      <SelectItem key={t.id} value={t.id}>{t.emoji} {t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Trạng thái</label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">📝 Bản nháp</SelectItem>
                    <SelectItem value="pending">⏳ Gửi duyệt</SelectItem>
                    <SelectItem value="published">✅ Xuất bản ngay</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Ảnh bìa</label>
              <ImageUpload value={form.image} onChange={(url) => setForm({ ...form, image: url })} placeholder="Chọn ảnh bìa hoặc nhập URL" />
            </div>
            <div>
              <label className="text-sm font-medium">Tóm tắt *</label>
              <textarea
                className="w-full min-h-[80px] p-2 border rounded-md resize-y text-sm"
                value={form.excerpt}
                onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
                placeholder="Tóm tắt ngắn gọn nội dung bài viết..."
              />
            </div>
            <div>
              <label className="text-sm font-medium">Nội dung *</label>
              <RichTextEditor value={form.content} onChange={(content) => setForm({ ...form, content })} placeholder="Nhập nội dung bài viết..." minHeight="250px" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Ngày xuất bản</label>
                <Input type="date" value={form.published_at} onChange={(e) => setForm({ ...form, published_at: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium">Tác giả</label>
                <Input value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} />
              </div>
            </div>
            <div className="flex gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.is_featured} onChange={(e) => setForm({ ...form, is_featured: e.target.checked })} className="rounded" />
                <span className="text-sm">⭐ Bài nổi bật</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.is_ai_generated} onChange={(e) => setForm({ ...form, is_ai_generated: e.target.checked })} className="rounded" />
                <span className="text-sm">✨ Bài AI tạo</span>
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Hủy</Button>
            <Button onClick={handleSubmit} disabled={saving}>
              {saving ? 'Đang lưu...' : (editingNews ? 'Cập nhật' : 'Lưu bài')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
