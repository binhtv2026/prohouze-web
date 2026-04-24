import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import api from "@/lib/api";
import {
  MessageSquare,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Bot,
  Tag,
  Sparkles,
  Copy,
  Eye,
  Facebook,
  Youtube,
  Linkedin,
  Globe,
  Search,
  Filter,
  BarChart3,
} from "lucide-react";

// Custom icons
const TikTokIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/>
  </svg>
);

const ZaloIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.12.02-1.96 1.25-5.54 3.69-.52.36-1 .53-1.42.52-.47-.01-1.37-.26-2.03-.48-.82-.27-1.47-.42-1.42-.88.03-.24.37-.49 1.02-.75 3.98-1.73 6.64-2.87 7.97-3.43 3.79-1.52 4.58-1.78 5.09-1.79.11 0 .36.03.52.17.14.12.18.28.2.45-.01.06.01.24 0 .38z"/>
  </svg>
);

const CHANNEL_ICONS = {
  facebook: Facebook,
  tiktok: TikTokIcon,
  youtube: Youtube,
  linkedin: Linkedin,
  zalo: ZaloIcon,
  website: Globe,
};

const CHANNEL_COLORS = {
  facebook: "bg-blue-600",
  tiktok: "bg-gray-900",
  youtube: "bg-red-600",
  linkedin: "bg-blue-700",
  zalo: "bg-blue-500",
  website: "bg-emerald-600",
};

const CATEGORIES = [
  { value: "greeting", label: "Chào hỏi", icon: "👋", description: "Tin nhắn chào đón khách hàng mới" },
  { value: "project_info", label: "Thông tin dự án", icon: "🏠", description: "Câu trả lời về dự án BĐS" },
  { value: "pricing", label: "Giá cả", icon: "💰", description: "Thông tin về giá và thanh toán" },
  { value: "appointment", label: "Đặt lịch hẹn", icon: "📅", description: "Hỗ trợ đặt lịch xem nhà" },
  { value: "faq", label: "FAQ", icon: "❓", description: "Câu hỏi thường gặp" },
  { value: "objection_handling", label: "Xử lý phản đối", icon: "🛡️", description: "Phản hồi các thắc mắc, lo ngại" },
  { value: "follow_up", label: "Follow-up", icon: "🔄", description: "Tin nhắn follow-up, nurture" },
  { value: "closing", label: "Chốt sale", icon: "🎯", description: "Tin nhắn chốt deal" },
];

const VARIABLES = [
  { name: "{{name}}", description: "Tên khách hàng" },
  { name: "{{project}}", description: "Tên dự án" },
  { name: "{{price}}", description: "Giá dự án" },
  { name: "{{location}}", description: "Vị trí dự án" },
  { name: "{{sales_name}}", description: "Tên sales phụ trách" },
  { name: "{{sales_phone}}", description: "SĐT sales" },
  { name: "{{company}}", description: "Tên công ty (ProHouze)" },
];

export default function ResponseTemplatesPage() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [channelFilter, setChannelFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    category: "greeting",
    channels: ["facebook", "zalo"],
    trigger_keywords: [],
    template_text: "",
    variables: [],
    is_active: true,
    priority: 0,
    requires_human_review: false,
  });

  const [keywordInput, setKeywordInput] = useState("");

  const fetchTemplates = useCallback(async () => {
    try {
      const params = {};
      if (categoryFilter !== "all") params.category = categoryFilter;
      if (channelFilter !== "all") params.channel = channelFilter;
      
      const response = await api.get("/response-templates", { params });
      setTemplates(response.data);
    } catch (error) {
      console.error("Error fetching templates:", error);
      // Mock data
      setTemplates([
        {
          id: "1",
          name: "Chào đón khách mới",
          category: "greeting",
          channels: ["facebook", "zalo"],
          trigger_keywords: ["xin chào", "hello", "chào bạn", "hi"],
          template_text: "Xin chào {{name}}! Cảm ơn bạn đã quan tâm đến ProHouze. Mình có thể hỗ trợ gì cho bạn về các dự án bất động sản hôm nay ạ?",
          variables: ["name"],
          is_active: true,
          priority: 1,
          requires_human_review: false,
          approved_by: "admin",
          approved_at: "2024-01-15T10:00:00Z",
          usage_count: 156,
        },
        {
          id: "2",
          name: "Hỏi về giá dự án",
          category: "pricing",
          channels: ["facebook", "zalo", "website"],
          trigger_keywords: ["giá", "bao nhiêu", "báo giá", "price", "chi phí"],
          template_text: "Dạ, dự án {{project}} hiện có giá từ {{price}}. Tùy theo căn và tầng sẽ có mức giá khác nhau. Anh/chị muốn mình tư vấn căn cụ thể nào không ạ?\n\nĐể được báo giá chi tiết và nhận ưu đãi, anh/chị vui lòng để lại SĐT hoặc nhắn trực tiếp cho {{sales_name}} qua số {{sales_phone}} nhé!",
          variables: ["project", "price", "sales_name", "sales_phone"],
          is_active: true,
          priority: 2,
          requires_human_review: true,
          approved_by: "manager",
          approved_at: "2024-01-20T14:00:00Z",
          usage_count: 89,
        },
        {
          id: "3",
          name: "Đặt lịch xem nhà",
          category: "appointment",
          channels: ["facebook", "zalo"],
          trigger_keywords: ["xem nhà", "đặt lịch", "hẹn gặp", "visit", "appointment"],
          template_text: "Tuyệt vời! {{name}} muốn xem dự án {{project}} đúng không ạ?\n\nMình có thể sắp xếp lịch hẹn cho anh/chị vào:\n- Thứ 2 - Thứ 6: 8h-18h\n- Thứ 7 - CN: 9h-17h\n\nAnh/chị cho mình xin thông tin:\n1. Ngày giờ mong muốn\n2. SĐT liên hệ\n\nSales {{sales_name}} sẽ liên hệ xác nhận ngay ạ!",
          variables: ["name", "project", "sales_name"],
          is_active: true,
          priority: 1,
          requires_human_review: false,
          approved_by: "admin",
          approved_at: "2024-01-25T09:00:00Z",
          usage_count: 234,
        },
        {
          id: "4",
          name: "Xử lý - Giá cao",
          category: "objection_handling",
          channels: ["facebook", "zalo", "website"],
          trigger_keywords: ["đắt", "cao quá", "expensive", "giá cao", "không đủ tiền"],
          template_text: "Mình hiểu quan ngại của anh/chị ạ! Tuy nhiên, {{project}} có nhiều điểm mạnh:\n\n✅ Vị trí đắc địa tại {{location}}\n✅ Chính sách thanh toán linh hoạt, trả góp 0% lãi suất\n✅ Tiềm năng tăng giá cao trong tương lai\n✅ Ưu đãi chiết khấu đến 5% cho khách book sớm\n\nMình có thể tư vấn phương án tài chính phù hợp cho anh/chị. Anh/chị cho mình xin SĐT để trao đổi chi tiết nhé!",
          variables: ["project", "location"],
          is_active: true,
          priority: 3,
          requires_human_review: true,
          approved_by: null,
          approved_at: null,
          usage_count: 45,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, [categoryFilter, channelFilter]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const handleCreateTemplate = async () => {
    try {
      await api.post("/response-templates", formData);
      toast.success("Tạo template thành công!");
      setIsCreateDialogOpen(false);
      resetForm();
      fetchTemplates();
    } catch (error) {
      toast.error("Lỗi: " + (error.response?.data?.detail || error.message));
    }
  };

  const handleApproveTemplate = async (templateId) => {
    try {
      await api.put(`/response-templates/${templateId}/approve`);
      toast.success("Đã duyệt template!");
      fetchTemplates();
    } catch (error) {
      toast.error("Lỗi: " + error.message);
    }
  };

  const handleToggleTemplate = async (templateId) => {
    try {
      // Find template and toggle
      const template = templates.find(t => t.id === templateId);
      if (template) {
        // For now, just toggle in local state
        setTemplates(templates.map(t => 
          t.id === templateId ? { ...t, is_active: !t.is_active } : t
        ));
        toast.success("Đã cập nhật trạng thái template!");
      }
    } catch (error) {
      toast.error("Lỗi: " + error.message);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      category: "greeting",
      channels: ["facebook", "zalo"],
      trigger_keywords: [],
      template_text: "",
      variables: [],
      is_active: true,
      priority: 0,
      requires_human_review: false,
    });
    setKeywordInput("");
  };

  const addKeyword = () => {
    if (keywordInput.trim() && !formData.trigger_keywords.includes(keywordInput.trim())) {
      setFormData({
        ...formData,
        trigger_keywords: [...formData.trigger_keywords, keywordInput.trim().toLowerCase()],
      });
      setKeywordInput("");
    }
  };

  const removeKeyword = (keyword) => {
    setFormData({
      ...formData,
      trigger_keywords: formData.trigger_keywords.filter((k) => k !== keyword),
    });
  };

  const insertVariable = (variable) => {
    setFormData({
      ...formData,
      template_text: formData.template_text + variable,
      variables: [...new Set([...formData.variables, variable.replace(/[{}]/g, "")])],
    });
  };

  const filteredTemplates = templates.filter((template) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (
        !template.name.toLowerCase().includes(query) &&
        !template.template_text.toLowerCase().includes(query) &&
        !template.trigger_keywords.some((k) => k.includes(query))
      ) {
        return false;
      }
    }
    return true;
  });

  const ChannelIcon = ({ channel, className }) => {
    const Icon = CHANNEL_ICONS[channel] || Globe;
    return <Icon className={className} />;
  };

  // Stats
  const stats = {
    total: templates.length,
    active: templates.filter((t) => t.is_active).length,
    pending: templates.filter((t) => !t.approved_by).length,
    totalUsage: templates.reduce((sum, t) => sum + (t.usage_count || 0), 0),
  };

  return (
    <div className="space-y-6" data-testid="response-templates-page">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Response Templates</h1>
          <p className="text-gray-500">Quản lý templates cho AI auto-reply trên các kênh</p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)} data-testid="create-template-btn">
          <Plus className="h-4 w-4 mr-2" />
          Tạo template mới
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Tổng templates</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <MessageSquare className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Đang hoạt động</p>
                <p className="text-2xl font-bold text-green-600">{stats.active}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Chờ duyệt</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Lượt sử dụng</p>
                <p className="text-2xl font-bold">{stats.totalUsage}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Danh mục" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả danh mục</SelectItem>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.icon} {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Select value={channelFilter} onValueChange={setChannelFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Kênh" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả kênh</SelectItem>
                  <SelectItem value="facebook">Facebook</SelectItem>
                  <SelectItem value="zalo">Zalo</SelectItem>
                  <SelectItem value="tiktok">TikTok</SelectItem>
                  <SelectItem value="youtube">YouTube</SelectItem>
                  <SelectItem value="linkedin">LinkedIn</SelectItem>
                  <SelectItem value="website">Website</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Tìm kiếm template, keyword..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Templates by Category */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList className="flex flex-wrap h-auto gap-1">
          <TabsTrigger value="all">Tất cả</TabsTrigger>
          {CATEGORIES.map((cat) => (
            <TabsTrigger key={cat.value} value={cat.value}>
              {cat.icon} {cat.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {loading ? (
            <div className="text-center py-8">Đang tải...</div>
          ) : filteredTemplates.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Bot className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Chưa có template nào</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredTemplates.map((template) => (
                <Card key={template.id} className="overflow-hidden" data-testid={`template-card-${template.id}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xl">
                            {CATEGORIES.find((c) => c.value === template.category)?.icon}
                          </span>
                          <h3 className="font-semibold">{template.name}</h3>
                          {template.is_active ? (
                            <Badge className="bg-green-100 text-green-700">Active</Badge>
                          ) : (
                            <Badge variant="secondary">Inactive</Badge>
                          )}
                          {!template.approved_by && (
                            <Badge className="bg-yellow-100 text-yellow-700">Chờ duyệt</Badge>
                          )}
                          {template.requires_human_review && (
                            <Badge variant="outline" className="text-orange-600 border-orange-200">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Cần review
                            </Badge>
                          )}
                        </div>

                        {/* Channels */}
                        <div className="flex items-center gap-1 mb-3">
                          {template.channels.map((channel) => (
                            <div
                              key={channel}
                              className={`h-6 w-6 rounded-full flex items-center justify-center ${CHANNEL_COLORS[channel]} text-white`}
                              title={channel}
                            >
                              <ChannelIcon channel={channel} className="h-3 w-3" />
                            </div>
                          ))}
                        </div>

                        {/* Keywords */}
                        <div className="flex flex-wrap gap-1 mb-3">
                          <Tag className="h-4 w-4 text-gray-400" />
                          {template.trigger_keywords.map((keyword) => (
                            <span
                              key={keyword}
                              className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded"
                            >
                              {keyword}
                            </span>
                          ))}
                        </div>

                        {/* Template preview */}
                        <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-700 line-clamp-3">
                          {template.template_text}
                        </div>

                        {/* Stats */}
                        <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                          <span>Sử dụng: {template.usage_count} lần</span>
                          <span>Priority: {template.priority}</span>
                          {template.approved_at && (
                            <span>Duyệt: {new Date(template.approved_at).toLocaleDateString("vi-VN")}</span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-2">
                        <Switch
                          checked={template.is_active}
                          onCheckedChange={() => handleToggleTemplate(template.id)}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedTemplate(template);
                            setIsPreviewDialogOpen(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <Edit className="h-4 w-4" />
                        </Button>
                        {!template.approved_by && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-green-600"
                            onClick={() => handleApproveTemplate(template.id)}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Category tabs */}
        {CATEGORIES.map((cat) => (
          <TabsContent key={cat.value} value={cat.value}>
            <div className="grid gap-4">
              {filteredTemplates
                .filter((t) => t.category === cat.value)
                .map((template) => (
                  <Card key={template.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold mb-2">{template.name}</h3>
                          <div className="flex flex-wrap gap-1 mb-2">
                            {template.trigger_keywords.map((keyword) => (
                              <Badge key={keyword} variant="secondary" className="text-xs">
                                {keyword}
                              </Badge>
                            ))}
                          </div>
                          <p className="text-sm text-gray-600 line-clamp-2">{template.template_text}</p>
                        </div>
                        <Switch checked={template.is_active} />
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {/* Create Template Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Tạo Response Template mới</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Tên template *</Label>
              <Input
                placeholder="Ví dụ: Chào đón khách mới từ Facebook"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Danh mục *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(v) => setFormData({ ...formData, category: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.icon} {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 mt-1">
                  {CATEGORIES.find((c) => c.value === formData.category)?.description}
                </p>
              </div>
              <div>
                <Label>Độ ưu tiên</Label>
                <Select
                  value={formData.priority.toString()}
                  onValueChange={(v) => setFormData({ ...formData, priority: parseInt(v) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 - Cao nhất</SelectItem>
                    <SelectItem value="2">2 - Cao</SelectItem>
                    <SelectItem value="3">3 - Trung bình</SelectItem>
                    <SelectItem value="4">4 - Thấp</SelectItem>
                    <SelectItem value="5">5 - Thấp nhất</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Áp dụng cho kênh</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {Object.keys(CHANNEL_ICONS).map((channel) => {
                  const isSelected = formData.channels.includes(channel);
                  return (
                    <Button
                      key={channel}
                      type="button"
                      variant={isSelected ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        if (isSelected) {
                          setFormData({
                            ...formData,
                            channels: formData.channels.filter((c) => c !== channel),
                          });
                        } else {
                          setFormData({
                            ...formData,
                            channels: [...formData.channels, channel],
                          });
                        }
                      }}
                    >
                      <ChannelIcon channel={channel} className="h-4 w-4 mr-1" />
                      {channel.charAt(0).toUpperCase() + channel.slice(1)}
                    </Button>
                  );
                })}
              </div>
            </div>

            <div>
              <Label>Keywords kích hoạt *</Label>
              <div className="flex gap-2 mb-2">
                <Input
                  placeholder="Nhập keyword và nhấn Enter hoặc nút Thêm"
                  value={keywordInput}
                  onChange={(e) => setKeywordInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addKeyword();
                    }
                  }}
                />
                <Button type="button" onClick={addKeyword}>
                  Thêm
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.trigger_keywords.map((keyword) => (
                  <Badge key={keyword} variant="secondary" className="gap-1">
                    {keyword}
                    <button
                      onClick={() => removeKeyword(keyword)}
                      className="ml-1 hover:text-red-500"
                    >
                      ×
                    </button>
                  </Badge>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                AI sẽ sử dụng template này khi tin nhắn khách hàng chứa các keywords trên
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Nội dung template *</Label>
                <div className="flex gap-1">
                  {VARIABLES.map((v) => (
                    <Button
                      key={v.name}
                      type="button"
                      variant="outline"
                      size="sm"
                      className="text-xs h-7"
                      onClick={() => insertVariable(v.name)}
                      title={v.description}
                    >
                      {v.name}
                    </Button>
                  ))}
                </div>
              </div>
              <Textarea
                placeholder="Nhập nội dung trả lời. Sử dụng các biến ở trên để cá nhân hóa tin nhắn."
                rows={6}
                value={formData.template_text}
                onChange={(e) => setFormData({ ...formData, template_text: e.target.value })}
              />
              <p className="text-xs text-gray-500 mt-1">
                Các biến như {`{{name}}`}, {`{{project}}`} sẽ được thay thế tự động khi gửi
              </p>
            </div>

            <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
              <div>
                <Label className="text-orange-700">Yêu cầu human review trước khi gửi</Label>
                <p className="text-xs text-orange-600">
                  Bật tùy chọn này nếu muốn nhân viên kiểm tra trước khi AI gửi tin nhắn
                </p>
              </div>
              <Switch
                checked={formData.requires_human_review}
                onCheckedChange={(v) => setFormData({ ...formData, requires_human_review: v })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Hủy
            </Button>
            <Button
              onClick={handleCreateTemplate}
              disabled={!formData.name || !formData.template_text || formData.trigger_keywords.length === 0}
              data-testid="submit-template-btn"
            >
              Tạo template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={isPreviewDialogOpen} onOpenChange={setIsPreviewDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Preview Template</DialogTitle>
          </DialogHeader>
          {selectedTemplate && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-2xl">
                  {CATEGORIES.find((c) => c.value === selectedTemplate.category)?.icon}
                </span>
                <h2 className="text-xl font-semibold">{selectedTemplate.name}</h2>
              </div>

              <div className="flex gap-2">
                {selectedTemplate.channels.map((channel) => (
                  <div
                    key={channel}
                    className={`h-8 w-8 rounded-full flex items-center justify-center ${CHANNEL_COLORS[channel]} text-white`}
                  >
                    <ChannelIcon channel={channel} className="h-4 w-4" />
                  </div>
                ))}
              </div>

              <div>
                <Label className="text-gray-500">Keywords</Label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {selectedTemplate.trigger_keywords.map((keyword) => (
                    <Badge key={keyword} variant="outline">
                      {keyword}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-gray-500">Nội dung</Label>
                <div className="bg-gray-50 p-4 rounded-lg mt-1 whitespace-pre-wrap">
                  {selectedTemplate.template_text}
                </div>
              </div>

              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>Sử dụng: {selectedTemplate.usage_count} lần</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(selectedTemplate.template_text);
                    toast.success("Đã copy nội dung!");
                  }}
                >
                  <Copy className="h-4 w-4 mr-1" />
                  Copy
                </Button>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPreviewDialogOpen(false)}>
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
