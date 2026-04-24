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
  Plus, Pencil, Trash2, Search, Rocket, Eye, Target, 
  MousePointerClick, ExternalLink, Copy, Link2, Users, Megaphone
} from 'lucide-react';
import { toast } from 'sonner';
import { cmsLandingPagesApi, cmsConfigApi, cmsMarketingApi } from '@/api/cmsApi';
import RichTextEditor from '@/components/RichTextEditor';

const STATUS_COLORS = {
  draft: 'bg-gray-500',
  published: 'bg-green-500',
  scheduled: 'bg-blue-500',
  archived: 'bg-red-500'
};

const STATUS_LABELS = {
  draft: 'Bản nháp',
  published: 'Hoạt động',
  scheduled: 'Đã lên lịch',
  archived: 'Lưu trữ'
};

const emptyForm = {
  title: '',
  slug: '',
  landing_type: 'lead_capture',
  headline: '',
  subheadline: '',
  hero_image: '',
  hero_video: '',
  form_id: '',
  campaign_id: '',
  utm_source: '',
  utm_medium: '',
  utm_campaign: '',
  project_id: '',
  template: 'hero_cta',
  theme: 'light',
  hide_navigation: true,
  show_chat_widget: true,
  status: 'draft',
  scheduled_at: '',
  expires_at: ''
};

const DEMO_LANDING_TYPES = {
  lead_capture: 'Thu lead',
  event: 'Sự kiện',
  project_launch: 'Mở bán dự án',
};

const DEMO_LANDING_PAGES = [
  {
    id: 'lp-001',
    title: 'Đăng ký nhận bảng giá The Horizon City',
    slug: 'bang-gia-horizon-city',
    landing_type: 'lead_capture',
    headline: 'Nhận bảng giá và chính sách mới nhất',
    status: 'published',
  },
  {
    id: 'lp-002',
    title: 'Landing page mở bán giai đoạn 2',
    slug: 'mo-ban-giai-doan-2',
    landing_type: 'project_launch',
    headline: 'Đặt chỗ sớm để nhận ưu đãi đặc biệt',
    status: 'draft',
  },
];

const DEMO_MARKETING_FORMS = [
  { id: 'form-001', name: 'Form nhận bảng giá' },
  { id: 'form-002', name: 'Form đặt lịch xem nhà mẫu' },
];

const DEMO_MARKETING_CAMPAIGNS = [
  { id: 'camp-001', name: 'Chiến dịch Horizon tháng này' },
  { id: 'camp-002', name: 'Chiến dịch mở bán giai đoạn 2' },
];

export default function CMSLandingPagesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [landingPages, setLandingPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPage, setEditingPage] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [landingTypes, setLandingTypes] = useState({});
  const [activeTab, setActiveTab] = useState('basic');
  // Marketing Engine data
  const [marketingForms, setMarketingForms] = useState([]);
  const [marketingCampaigns, setMarketingCampaigns] = useState([]);

  const fetchLandingPages = useCallback(async () => {
    try {
      const data = await cmsLandingPagesApi.list();
      const pageItems = Array.isArray(data) ? data : [];
      setLandingPages(pageItems.length > 0 ? pageItems : DEMO_LANDING_PAGES);
    } catch (err) {
      setLandingPages(DEMO_LANDING_PAGES);
      toast.error('Không thể tải danh sách landing pages, đang hiển thị dữ liệu mẫu');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchConfig = useCallback(async () => {
    try {
      const types = await cmsConfigApi.getLandingPageTypes();
      setLandingTypes(types || DEMO_LANDING_TYPES);
    } catch (err) {
      console.error('Failed to load config', err);
      setLandingTypes(DEMO_LANDING_TYPES);
    }
  }, []);

  const fetchMarketingData = useCallback(async () => {
    try {
      const [forms, campaigns] = await Promise.all([
        cmsMarketingApi.getForms(),
        cmsMarketingApi.getCampaigns()
      ]);
      setMarketingForms(forms?.length > 0 ? forms : DEMO_MARKETING_FORMS);
      setMarketingCampaigns(campaigns?.length > 0 ? campaigns : DEMO_MARKETING_CAMPAIGNS);
    } catch (err) {
      console.error('Failed to load marketing data', err);
      setMarketingForms(DEMO_MARKETING_FORMS);
      setMarketingCampaigns(DEMO_MARKETING_CAMPAIGNS);
    }
  }, []);

  useEffect(() => {
    fetchLandingPages();
    fetchConfig();
    fetchMarketingData();
  }, [fetchLandingPages, fetchConfig, fetchMarketingData]);

  const filteredPages = landingPages.filter(p => {
    const matchSearch = p.title.toLowerCase().includes(search.toLowerCase()) ||
                       p.headline?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || p.status === filterStatus;
    const matchType = filterType === 'all' || p.landing_type === filterType;
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
      slug: page.slug || '',
      landing_type: page.landing_type || 'lead_capture',
      headline: page.headline || '',
      subheadline: page.subheadline || '',
      hero_image: page.hero_image || '',
      hero_video: page.hero_video || '',
      form_id: page.form_id || '',
      campaign_id: page.campaign_id || '',
      utm_source: page.utm_source || '',
      utm_medium: page.utm_medium || '',
      utm_campaign: page.utm_campaign || '',
      project_id: page.project_id || '',
      template: page.template || 'hero_cta',
      theme: page.theme || 'light',
      hide_navigation: page.hide_navigation !== false,
      show_chat_widget: page.show_chat_widget !== false,
      status: page.status || 'draft',
      scheduled_at: page.scheduled_at ? page.scheduled_at.split('T')[0] : '',
      expires_at: page.expires_at ? page.expires_at.split('T')[0] : ''
    });
    setActiveTab('basic');
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.title || !form.headline) {
      toast.error('Vui lòng điền tiêu đề và headline');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...form,
        scheduled_at: form.scheduled_at ? new Date(form.scheduled_at).toISOString() : null,
        expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null,
      };

      if (editingPage) {
        await cmsLandingPagesApi.update(editingPage.id, payload);
        toast.success('Đã cập nhật landing page');
      } else {
        await cmsLandingPagesApi.create(payload);
        toast.success('Đã tạo landing page mới');
      }
      
      setIsDialogOpen(false);
      fetchLandingPages();
    } catch (err) {
      toast.error('Có lỗi xảy ra khi lưu');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa landing page này?')) return;
    
    try {
      await cmsLandingPagesApi.delete(id);
      toast.success('Đã xóa landing page');
      fetchLandingPages();
    } catch (err) {
      toast.error('Không thể xóa landing page');
    }
  };

  const copyUrl = (slug) => {
    const url = `${window.location.origin}/lp/${slug}`;
    navigator.clipboard.writeText(url);
    toast.success('Đã copy URL');
  };

  const totalViews = landingPages.reduce((acc, p) => acc + (p.views || 0), 0);
  const totalSubmissions = landingPages.reduce((acc, p) => acc + (p.form_submissions || 0), 0);
  const avgConversion = totalViews > 0 ? ((totalSubmissions / totalViews) * 100).toFixed(2) : 0;

  return (
    <div className="p-6 space-y-6" data-testid="cms-landing-pages-page">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Landing Pages</h1>
          <p className="text-muted-foreground">Tạo và quản lý trang đích cho chiến dịch marketing</p>
        </div>
        <Button onClick={openCreateDialog} data-testid="create-landing-btn">
          <Plus className="w-4 h-4 mr-2" />
          Tạo Landing Page
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Rocket className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{landingPages.length}</p>
                <p className="text-sm text-muted-foreground">Tổng LP</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Eye className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalViews.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Lượt xem</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <MousePointerClick className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalSubmissions.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Submissions</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Target className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{avgConversion}%</p>
                <p className="text-sm text-muted-foreground">Conversion</p>
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
                placeholder="Tìm kiếm landing pages..."
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
                <SelectItem value="published">Hoạt động</SelectItem>
                <SelectItem value="scheduled">Đã lên lịch</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Loại LP" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả loại</SelectItem>
                {Object.entries(landingTypes).map(([key, val]) => (
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
                <TableHead className="text-center">Views</TableHead>
                <TableHead className="text-center">Submissions</TableHead>
                <TableHead className="text-center">CVR</TableHead>
                <TableHead>Trạng thái</TableHead>
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
                    Chưa có landing page nào
                  </TableCell>
                </TableRow>
              ) : (
                filteredPages.map((page) => (
                  <TableRow key={page.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{page.title}</p>
                        <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                          <Link2 className="w-3 h-3" />
                          <code>/lp/{page.slug}</code>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {landingTypes[page.landing_type]?.label || page.landing_type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      {(page.views || 0).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-center">
                      {(page.form_submissions || 0).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={page.conversion_rate > 5 ? 'text-green-600 font-medium' : ''}>
                        {page.conversion_rate?.toFixed(2) || 0}%
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge className={STATUS_COLORS[page.status]}>
                        {STATUS_LABELS[page.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => copyUrl(page.slug)}
                          title="Copy URL"
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => window.open(`/lp/${page.slug}`, '_blank')}
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
              {editingPage ? 'Chỉnh sửa Landing Page' : 'Tạo Landing Page mới'}
            </DialogTitle>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">Cơ bản</TabsTrigger>
              <TabsTrigger value="content">Nội dung</TabsTrigger>
              <TabsTrigger value="tracking">Tracking</TabsTrigger>
              <TabsTrigger value="settings">Cài đặt</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4 mt-4">
              <div>
                <label className="text-sm font-medium">Tiêu đề (nội bộ) *</label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="VD: LP Vinhomes Q9 - Facebook Ads"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Loại Landing Page</label>
                  <Select value={form.landing_type} onValueChange={(v) => setForm({ ...form, landing_type: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(landingTypes).map(([key, val]) => (
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
                    placeholder="vinhomes-q9-fb"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Headline *</label>
                <Input
                  value={form.headline}
                  onChange={(e) => setForm({ ...form, headline: e.target.value })}
                  placeholder="VD: Sở hữu căn hộ Vinhomes chỉ từ 2.5 tỷ"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Sub-headline</label>
                <Input
                  value={form.subheadline}
                  onChange={(e) => setForm({ ...form, subheadline: e.target.value })}
                  placeholder="VD: Ưu đãi chiết khấu 10% trong tháng 3"
                />
              </div>
            </TabsContent>

            <TabsContent value="content" className="space-y-4 mt-4">
              <div>
                <label className="text-sm font-medium">Ảnh Hero</label>
                <Input
                  value={form.hero_image}
                  onChange={(e) => setForm({ ...form, hero_image: e.target.value })}
                  placeholder="URL ảnh hero"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Video Hero</label>
                <Input
                  value={form.hero_video}
                  onChange={(e) => setForm({ ...form, hero_video: e.target.value })}
                  placeholder="URL video (YouTube, Vimeo)"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Template</label>
                  <Select value={form.template} onValueChange={(v) => setForm({ ...form, template: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hero_cta">Hero + CTA</SelectItem>
                      <SelectItem value="multi_section">Multi-Section</SelectItem>
                      <SelectItem value="video_hero">Video Hero</SelectItem>
                      <SelectItem value="comparison">So sánh</SelectItem>
                      <SelectItem value="event_countdown">Sự kiện</SelectItem>
                      <SelectItem value="simple_form">Form đơn giản</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Theme</label>
                  <Select value={form.theme} onValueChange={(v) => setForm({ ...form, theme: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="brand">Brand Color</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="tracking" className="space-y-4 mt-4">
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm font-medium mb-2">UTM Parameters</p>
                <p className="text-xs text-muted-foreground">Theo dõi nguồn traffic cho landing page</p>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium">UTM Source</label>
                  <Input
                    value={form.utm_source}
                    onChange={(e) => setForm({ ...form, utm_source: e.target.value })}
                    placeholder="facebook, google"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">UTM Medium</label>
                  <Input
                    value={form.utm_medium}
                    onChange={(e) => setForm({ ...form, utm_medium: e.target.value })}
                    placeholder="cpc, social"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">UTM Campaign</label>
                  <Input
                    value={form.utm_campaign}
                    onChange={(e) => setForm({ ...form, utm_campaign: e.target.value })}
                    placeholder="vinhomes_q9_march"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Campaign ID (nội bộ)</label>
                  <Input
                    value={form.campaign_id}
                    onChange={(e) => setForm({ ...form, campaign_id: e.target.value })}
                    placeholder="ID chiến dịch marketing"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Project ID</label>
                  <Input
                    value={form.project_id}
                    onChange={(e) => setForm({ ...form, project_id: e.target.value })}
                    placeholder="ID dự án liên kết"
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="settings" className="space-y-4 mt-4">
              {/* MARKETING ENGINE INTEGRATION */}
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2 mb-3">
                  <Megaphone className="w-5 h-5 text-blue-600" />
                  <p className="text-sm font-medium text-blue-800">Marketing Engine Integration</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Form thu Lead</label>
                    <Select 
                      value={form.form_id || ""} 
                      onValueChange={(v) => setForm({ ...form, form_id: v === "none" ? "" : v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn form từ Marketing Engine" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">-- Không sử dụng form --</SelectItem>
                        {marketingForms.map((f) => (
                          <SelectItem key={f.id} value={f.id}>
                            {f.name} ({f.code || f.form_type})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1">
                      Form submissions sẽ tự động tạo Lead với full attribution
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Chiến dịch liên kết</label>
                    <Select 
                      value={form.campaign_id || ""} 
                      onValueChange={(v) => setForm({ ...form, campaign_id: v === "none" ? "" : v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn chiến dịch" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">-- Không liên kết chiến dịch --</SelectItem>
                        {marketingCampaigns.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name} ({c.code || c.campaign_type})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
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
                      <SelectItem value="published">Hoạt động</SelectItem>
                      <SelectItem value="scheduled">Lên lịch</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Project ID</label>
                  <Input
                    value={form.project_id}
                    onChange={(e) => setForm({ ...form, project_id: e.target.value })}
                    placeholder="ID dự án liên kết"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {form.status === 'scheduled' && (
                  <div>
                    <label className="text-sm font-medium">Ngày bắt đầu</label>
                    <Input
                      type="date"
                      value={form.scheduled_at}
                      onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })}
                    />
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium">Ngày hết hạn</label>
                  <Input
                    type="date"
                    value={form.expires_at}
                    onChange={(e) => setForm({ ...form, expires_at: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.hide_navigation}
                    onChange={(e) => setForm({ ...form, hide_navigation: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm">Ẩn navigation</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.show_chat_widget}
                    onChange={(e) => setForm({ ...form, show_chat_widget: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm">Hiện chat widget</span>
                </label>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Hủy</Button>
            <Button onClick={handleSubmit} disabled={saving}>
              {saving ? 'Đang lưu...' : (editingPage ? 'Cập nhật' : 'Tạo LP')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
