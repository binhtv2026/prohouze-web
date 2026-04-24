/**
 * Response Templates Page V2 - Prompt 13/20
 * Response Templates using Marketing V2 API
 */

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { toast } from "sonner";
import {
  getTemplates,
  getTemplateCategories,
  getTemplateVariables,
  getChannels,
  createTemplate,
  submitTemplateForApproval,
  approveTemplate,
  updateTemplate,
  STATUS_COLORS,
} from "@/api/marketingV2Api";
import {
  MessageSquare,
  Plus,
  Edit,
  CheckCircle,
  AlertTriangle,
  Bot,
  Tag,
  Copy,
  Eye,
  Search,
  Filter,
  BarChart3,
  Loader2,
} from "lucide-react";

const DEMO_TEMPLATES = [
  { id: "tpl-1", name: "Chào lead mới Facebook", category: "greeting", status: "approved", template_text: "Chào {{name}}, em từ ProHouze hỗ trợ anh/chị thông tin dự án phù hợp ngay ạ.", trigger_keywords: ["quan tâm", "tư vấn"], usage_count: 48, is_active: true },
  { id: "tpl-2", name: "Nhắc lịch hẹn xem nhà", category: "follow_up", status: "approved", template_text: "Anh/chị xác nhận giúp em lịch xem nhà lúc {{time}} ngày {{date}} nhé.", trigger_keywords: ["xem nhà", "lịch hẹn"], usage_count: 22, is_active: true },
  { id: "tpl-3", name: "Phản hồi xin bảng giá", category: "pricing", status: "pending_approval", template_text: "Em gửi anh/chị bảng giá cập nhật mới nhất và chính sách đang áp dụng hôm nay ạ.", trigger_keywords: ["bảng giá", "giá"], usage_count: 11, is_active: false },
];

const DEMO_CATEGORIES = [
  { value: "greeting", label_vi: "Chào hỏi" },
  { value: "follow_up", label_vi: "Chăm lại" },
  { value: "pricing", label_vi: "Bảng giá" },
];

const DEMO_VARIABLES = [
  "{{name}}",
  "{{date}}",
  "{{time}}",
  "{{project_name}}",
];

const DEMO_CHANNELS = [
  { id: "facebook", name: "Facebook", status: "connected" },
  { id: "zalo", name: "Zalo", status: "connected" },
  { id: "website", name: "Website", status: "connected" },
];

export default function ResponseTemplatesPageV2() {
  const [templates, setTemplates] = useState([]);
  const [categories, setCategories] = useState([]);
  const [variables, setVariables] = useState([]);
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    category: "greeting",
    channel_ids: [],
    trigger_keywords: [],
    template_text: "",
    variables: [],
    priority: 5,
    requires_human_review: false,
  });

  const [keywordInput, setKeywordInput] = useState("");

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (categoryFilter !== "all") params.category = categoryFilter;

      const [templatesRes, categoriesRes, variablesRes, channelsRes] = await Promise.all([
        getTemplates(params),
        getTemplateCategories(),
        getTemplateVariables(),
        getChannels({ status: "connected" }),
      ]);

      setTemplates(templatesRes.data?.length > 0 ? templatesRes.data : DEMO_TEMPLATES.filter((item) => categoryFilter === "all" || item.category === categoryFilter));
      setCategories(categoriesRes.data?.categories?.length > 0 ? categoriesRes.data.categories : DEMO_CATEGORIES);
      setVariables(variablesRes.data?.variables?.length > 0 ? variablesRes.data.variables : DEMO_VARIABLES);
      setChannels(channelsRes.data?.length > 0 ? channelsRes.data : DEMO_CHANNELS);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.warning("Đang hiển thị dữ liệu mẫu cho mẫu phản hồi");
      setTemplates(DEMO_TEMPLATES.filter((item) => categoryFilter === "all" || item.category === categoryFilter));
      setCategories(DEMO_CATEGORIES);
      setVariables(DEMO_VARIABLES);
      setChannels(DEMO_CHANNELS);
    } finally {
      setLoading(false);
    }
  }, [categoryFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreateTemplate = async () => {
    try {
      await createTemplate(formData);
      toast.success("Tạo template thành công!");
      setIsCreateDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      toast.error("Lỗi: " + (error.response?.data?.detail || error.message));
    }
  };

  const handleSubmitForApproval = async (templateId) => {
    try {
      await submitTemplateForApproval(templateId);
      toast.success("Đã gửi template để duyệt!");
      fetchData();
    } catch (error) {
      toast.error("Lỗi: " + error.message);
    }
  };

  const handleApproveTemplate = async (templateId) => {
    try {
      await approveTemplate(templateId);
      toast.success("Đã duyệt template!");
      fetchData();
    } catch (error) {
      toast.error("Lỗi: " + error.message);
    }
  };

  const handleToggleTemplate = async (templateId, isActive) => {
    try {
      await updateTemplate(templateId, { is_active: !isActive });
      toast.success("Đã cập nhật trạng thái!");
      fetchData();
    } catch (error) {
      toast.error("Lỗi: " + error.message);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      category: "greeting",
      channel_ids: [],
      trigger_keywords: [],
      template_text: "",
      variables: [],
      priority: 5,
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

  const getCategoryInfo = (categoryValue) => {
    return categories.find(c => c.value === categoryValue) || { label_vi: categoryValue };
  };

  const getStatusBadge = (status) => {
    const colors = {
      draft: "bg-gray-100 text-gray-700",
      pending_approval: "bg-yellow-100 text-yellow-700",
      approved: "bg-green-100 text-green-700",
      rejected: "bg-red-100 text-red-700",
    };
    const labels = {
      draft: "Bản nháp",
      pending_approval: "Chờ duyệt",
      approved: "Đã duyệt",
      rejected: "Từ chối",
    };
    return <Badge className={colors[status] || "bg-gray-100"}>{labels[status] || status}</Badge>;
  };

  // Stats
  const stats = {
    total: templates.length,
    active: templates.filter((t) => t.status === "approved").length,
    pending: templates.filter((t) => t.status === "pending_approval").length,
    totalUsage: templates.reduce((sum, t) => sum + (t.usage_count || 0), 0),
  };

  return (
    <div className="space-y-6" data-testid="response-templates-page-v2">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Response Templates</h1>
          <p className="text-gray-500">Quản lý templates AI auto-reply - API v2</p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)} data-testid="create-template-btn">
          <Plus className="h-4 w-4 mr-2" />
          Tạo template
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
                <p className="text-sm text-gray-500">Đã duyệt</p>
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
                  {categories.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label_vi || cat.label}
                    </SelectItem>
                  ))}
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

      {/* Templates List */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : filteredTemplates.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Bot className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Chưa có template nào</p>
              <Button className="mt-4" onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Tạo template đầu tiên
              </Button>
            </CardContent>
          </Card>
        ) : (
          filteredTemplates.map((template) => {
            const categoryInfo = getCategoryInfo(template.category);
            return (
              <Card key={template.id} data-testid={`template-card-${template.id}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <Badge variant="outline">{categoryInfo.label_vi}</Badge>
                        {getStatusBadge(template.status)}
                        {template.requires_human_review && (
                          <Badge variant="outline" className="text-orange-600 border-orange-200">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Cần review
                          </Badge>
                        )}
                        <span className="text-xs text-gray-400">{template.code}</span>
                      </div>
                      <h3 className="font-semibold mb-2">{template.name}</h3>

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
                      <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-700 line-clamp-2">
                        {template.template_text}
                      </div>

                      {/* Stats */}
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <span>Sử dụng: {template.usage_count || 0} lần</span>
                        <span>Priority: {template.priority}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2">
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
                      {template.status === "draft" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-yellow-600"
                          onClick={() => handleSubmitForApproval(template.id)}
                          title="Gửi duyệt"
                        >
                          <AlertTriangle className="h-4 w-4" />
                        </Button>
                      )}
                      {template.status === "pending_approval" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-green-600"
                          onClick={() => handleApproveTemplate(template.id)}
                          title="Duyệt"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

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
                placeholder="VD: Chào đón khách mới từ Facebook"
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
                    {categories.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label_vi || cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                    <SelectItem value="3">3 - Cao</SelectItem>
                    <SelectItem value="5">5 - Trung bình</SelectItem>
                    <SelectItem value="7">7 - Thấp</SelectItem>
                    <SelectItem value="10">10 - Thấp nhất</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Keywords kích hoạt *</Label>
              <div className="flex gap-2 mb-2">
                <Input
                  placeholder="Nhập keyword và nhấn Thêm"
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
                    <button onClick={() => removeKeyword(keyword)} className="ml-1 hover:text-red-500">
                      ×
                    </button>
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Nội dung template *</Label>
                <div className="flex gap-1 flex-wrap">
                  {variables.slice(0, 5).map((v) => (
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
                placeholder="Nhập nội dung. Sử dụng biến như {{name}}, {{project}}..."
                rows={5}
                value={formData.template_text}
                onChange={(e) => setFormData({ ...formData, template_text: e.target.value })}
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
              <div>
                <Label className="text-orange-700">Yêu cầu human review</Label>
                <p className="text-xs text-orange-600">
                  Bật nếu muốn kiểm tra trước khi gửi
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
                <Badge variant="outline">{getCategoryInfo(selectedTemplate.category).label_vi}</Badge>
                {getStatusBadge(selectedTemplate.status)}
              </div>
              <h2 className="text-xl font-semibold">{selectedTemplate.name}</h2>

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
                <span>Sử dụng: {selectedTemplate.usage_count || 0} lần</span>
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
