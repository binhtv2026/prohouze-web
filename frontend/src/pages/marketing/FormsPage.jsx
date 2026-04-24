/**
 * Forms Management Page - Prompt 13/20
 * Lead Capture Forms using Marketing V2 API
 */

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import {
  getForms,
  getForm,
  getFormFieldTypes,
  getFormSubmissions,
  createForm,
  activateForm,
  pauseForm,
} from "@/api/marketingV2Api";
import {
  FileText,
  Plus,
  Play,
  Pause,
  Eye,
  Copy,
  Users,
  CheckCircle,
  Clock,
  ExternalLink,
  Loader2,
  Trash2,
  ArrowUpDown,
  Search,
  Filter,
} from "lucide-react";

const DEMO_FORMS = [
  {
    id: "form-1",
    code: "FORM-PRIVE-01",
    name: "Form nhận tư vấn The Privé",
    status: "active",
    total_submissions: 42,
    total_leads_created: 31,
    fields_count: 4,
    created_at: "2026-03-10T09:00:00Z",
  },
  {
    id: "form-2",
    code: "FORM-TIKTOK-02",
    name: "Form lấy khách TikTok sale",
    status: "active",
    total_submissions: 27,
    total_leads_created: 19,
    fields_count: 3,
    created_at: "2026-03-15T13:30:00Z",
  },
  {
    id: "form-3",
    code: "FORM-OPENING-03",
    name: "Form đăng ký mở bán",
    status: "paused",
    total_submissions: 18,
    total_leads_created: 12,
    fields_count: 5,
    created_at: "2026-03-18T08:15:00Z",
  },
];

const DEMO_FIELD_TYPES = [
  { code: "text", label: "Văn bản" },
  { code: "phone", label: "Số điện thoại" },
  { code: "email", label: "Email" },
  { code: "select", label: "Chọn" },
];

export default function FormsPage() {
  const [forms, setForms] = useState([]);
  const [fieldTypes, setFieldTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isSubmissionsDialogOpen, setIsSubmissionsDialogOpen] = useState(false);
  const [selectedForm, setSelectedForm] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [submissionsLoading, setSubmissionsLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    fields: [
      { field_id: "name", field_type: "text", label: "Họ và tên", required: true, mapping_field: "full_name" },
      { field_id: "phone", field_type: "phone", label: "Số điện thoại", required: true, mapping_field: "phone" },
      { field_id: "email", field_type: "email", label: "Email", required: false, mapping_field: "email" },
    ],
    submit_button_text: "Gửi thông tin",
    success_message: "Cảm ơn bạn đã đăng ký!",
    utm_source: "",
    utm_campaign: "",
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter !== "all") params.status = statusFilter;

      const [formsRes, fieldTypesRes] = await Promise.all([
        getForms(params),
        getFormFieldTypes(),
      ]);

      const formItems = formsRes.data || [];
      setForms(formItems.length > 0 ? formItems : DEMO_FORMS.filter((item) => statusFilter === "all" || item.status === statusFilter));
      setFieldTypes(fieldTypesRes.data?.field_types?.length > 0 ? fieldTypesRes.data.field_types : DEMO_FIELD_TYPES);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.warning("Đang hiển thị dữ liệu mẫu cho form lead");
      setForms(DEMO_FORMS.filter((item) => statusFilter === "all" || item.status === statusFilter));
      setFieldTypes(DEMO_FIELD_TYPES);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreateForm = async () => {
    try {
      await createForm(formData);
      toast.success("Tạo form thành công!");
      setIsCreateDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      toast.error("Lỗi: " + (error.response?.data?.detail || error.message));
    }
  };

  const handleActivateForm = async (formId) => {
    try {
      await activateForm(formId);
      toast.success("Đã kích hoạt form!");
      fetchData();
    } catch (error) {
      toast.error("Lỗi: " + error.message);
    }
  };

  const handlePauseForm = async (formId) => {
    try {
      await pauseForm(formId);
      toast.success("Đã tạm dừng form!");
      fetchData();
    } catch (error) {
      toast.error("Lỗi: " + error.message);
    }
  };

  const handleViewSubmissions = async (form) => {
    setSelectedForm(form);
    setIsSubmissionsDialogOpen(true);
    setSubmissionsLoading(true);
    try {
      const res = await getFormSubmissions(form.id);
      const submissionItems = res.data || [];
      setSubmissions(submissionItems.length > 0 ? submissionItems : [
        { id: "sub-1", submitted_at: "2026-03-25T09:10:00Z", full_name: "Nguyễn Minh Tâm", phone: "0901234567", source: "Facebook Ads" },
        { id: "sub-2", submitted_at: "2026-03-25T10:45:00Z", full_name: "Lê Mỹ An", phone: "0912345678", source: "Landing page" },
      ]);
    } catch (error) {
      console.error("Error fetching submissions:", error);
      toast.warning("Đang hiển thị dữ liệu mẫu cho submissions");
      setSubmissions([
        { id: "sub-1", submitted_at: "2026-03-25T09:10:00Z", full_name: "Nguyễn Minh Tâm", phone: "0901234567", source: "Facebook Ads" },
        { id: "sub-2", submitted_at: "2026-03-25T10:45:00Z", full_name: "Lê Mỹ An", phone: "0912345678", source: "Landing page" },
      ]);
    } finally {
      setSubmissionsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      fields: [
        { field_id: "name", field_type: "text", label: "Họ và tên", required: true, mapping_field: "full_name" },
        { field_id: "phone", field_type: "phone", label: "Số điện thoại", required: true, mapping_field: "phone" },
        { field_id: "email", field_type: "email", label: "Email", required: false, mapping_field: "email" },
      ],
      submit_button_text: "Gửi thông tin",
      success_message: "Cảm ơn bạn đã đăng ký!",
      utm_source: "",
      utm_campaign: "",
    });
  };

  const addField = () => {
    const newFieldId = `field_${Date.now()}`;
    setFormData({
      ...formData,
      fields: [
        ...formData.fields,
        { field_id: newFieldId, field_type: "text", label: "", required: false },
      ],
    });
  };

  const updateField = (index, updates) => {
    const newFields = [...formData.fields];
    newFields[index] = { ...newFields[index], ...updates };
    setFormData({ ...formData, fields: newFields });
  };

  const removeField = (index) => {
    const newFields = formData.fields.filter((_, i) => i !== index);
    setFormData({ ...formData, fields: newFields });
  };

  const copyFormUrl = (formId) => {
    const url = `${process.env.REACT_APP_BACKEND_URL}/api/marketing/v2/forms/${formId}/render`;
    navigator.clipboard.writeText(url);
    toast.success("Đã copy URL form!");
  };

  const getStatusBadge = (status) => {
    const colors = {
      draft: "bg-gray-100 text-gray-700",
      active: "bg-green-100 text-green-700",
      paused: "bg-yellow-100 text-yellow-700",
      archived: "bg-gray-100 text-gray-600",
    };
    const labels = {
      draft: "Bản nháp",
      active: "Hoạt động",
      paused: "Tạm dừng",
      archived: "Lưu trữ",
    };
    return <Badge className={colors[status] || "bg-gray-100"}>{labels[status] || status}</Badge>;
  };

  const filteredForms = forms.filter((form) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (!form.name.toLowerCase().includes(query) && !form.code.toLowerCase().includes(query)) {
        return false;
      }
    }
    return true;
  });

  // Stats
  const stats = {
    total: forms.length,
    active: forms.filter((f) => f.status === "active").length,
    totalSubmissions: forms.reduce((sum, f) => sum + (f.total_submissions || 0), 0),
    totalLeads: forms.reduce((sum, f) => sum + (f.total_leads_created || 0), 0),
  };

  return (
    <div className="space-y-6" data-testid="forms-page">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Lead Capture Forms</h1>
          <p className="text-gray-500">Quản lý form thu thập lead</p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)} data-testid="create-form-btn">
          <Plus className="h-4 w-4 mr-2" />
          Tạo form
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Tổng forms</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-500" />
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
                <p className="text-sm text-gray-500">Tổng submissions</p>
                <p className="text-2xl font-bold">{stats.totalSubmissions}</p>
              </div>
              <Users className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Leads tạo từ form</p>
                <p className="text-2xl font-bold text-blue-600">{stats.totalLeads}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
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
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="draft">Bản nháp</SelectItem>
                  <SelectItem value="active">Hoạt động</SelectItem>
                  <SelectItem value="paused">Tạm dừng</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Tìm kiếm form..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Forms List */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : filteredForms.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Chưa có form nào</p>
              <Button className="mt-4" onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Tạo form đầu tiên
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredForms.map((form) => (
              <Card key={form.id} data-testid={`form-card-${form.id}`}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{form.name}</CardTitle>
                      <CardDescription>{form.code}</CardDescription>
                    </div>
                    {getStatusBadge(form.status)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {form.description && (
                    <p className="text-sm text-gray-600 line-clamp-2">{form.description}</p>
                  )}

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold">{form.total_submissions || 0}</p>
                      <p className="text-xs text-gray-500">Submissions</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-green-600">{form.total_leads_created || 0}</p>
                      <p className="text-xs text-gray-500">Leads</p>
                    </div>
                  </div>

                  {/* Conversion Rate */}
                  {form.total_submissions > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Conversion Rate</span>
                      <span className="font-medium">
                        {((form.total_leads_created / form.total_submissions) * 100).toFixed(1)}%
                      </span>
                    </div>
                  )}

                  {/* Fields count */}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Số trường</span>
                    <span>{form.fields?.length || 0} fields</span>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    {form.status === "active" ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handlePauseForm(form.id)}
                      >
                        <Pause className="h-4 w-4 mr-1" />
                        Tạm dừng
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleActivateForm(form.id)}
                      >
                        <Play className="h-4 w-4 mr-1" />
                        Kích hoạt
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewSubmissions(form)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyFormUrl(form.id)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create Form Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Tạo Lead Capture Form</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Tên form *</Label>
              <Input
                placeholder="VD: Đăng ký nhận thông tin dự án"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div>
              <Label>Mô tả</Label>
              <Input
                placeholder="Mô tả ngắn về form"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Các trường</Label>
                <Button type="button" variant="outline" size="sm" onClick={addField}>
                  <Plus className="h-4 w-4 mr-1" />
                  Thêm trường
                </Button>
              </div>
              <div className="space-y-2">
                {formData.fields.map((field, index) => (
                  <div key={field.field_id} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                    <Input
                      placeholder="Tên trường"
                      value={field.label}
                      onChange={(e) => updateField(index, { label: e.target.value })}
                      className="flex-1"
                    />
                    <Select
                      value={field.field_type}
                      onValueChange={(v) => updateField(index, { field_type: v })}
                    >
                      <SelectTrigger className="w-[120px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {fieldTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label_vi || type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <label className="flex items-center gap-1 text-sm">
                      <input
                        type="checkbox"
                        checked={field.required}
                        onChange={(e) => updateField(index, { required: e.target.checked })}
                      />
                      Bắt buộc
                    </label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeField(index)}
                      disabled={formData.fields.length <= 1}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Nút gửi</Label>
                <Input
                  value={formData.submit_button_text}
                  onChange={(e) => setFormData({ ...formData, submit_button_text: e.target.value })}
                />
              </div>
              <div>
                <Label>UTM Source</Label>
                <Input
                  placeholder="VD: facebook, google"
                  value={formData.utm_source}
                  onChange={(e) => setFormData({ ...formData, utm_source: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label>Thông báo thành công</Label>
              <Input
                value={formData.success_message}
                onChange={(e) => setFormData({ ...formData, success_message: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleCreateForm} disabled={!formData.name} data-testid="submit-form-btn">
              Tạo form
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Submissions Dialog */}
      <Dialog open={isSubmissionsDialogOpen} onOpenChange={setIsSubmissionsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Submissions - {selectedForm?.name}
              <span className="ml-2 text-sm font-normal text-gray-500">({selectedForm?.code})</span>
            </DialogTitle>
          </DialogHeader>
          
          {submissionsLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : submissions.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Chưa có submission nào</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Thời gian</TableHead>
                  <TableHead>Dữ liệu</TableHead>
                  <TableHead>UTM Source</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Lead ID</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {submissions.map((sub) => (
                  <TableRow key={sub.id}>
                    <TableCell className="whitespace-nowrap">
                      {new Date(sub.submitted_at).toLocaleString("vi-VN")}
                    </TableCell>
                    <TableCell>
                      <div className="max-w-[300px]">
                        {Object.entries(sub.data || {}).map(([key, value]) => (
                          <div key={key} className="text-sm">
                            <span className="text-gray-500">{key}:</span> {String(value)}
                          </div>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      {sub.utm_source && (
                        <Badge variant="outline">{sub.utm_source}</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={
                        sub.status === "completed" ? "bg-green-100 text-green-700" :
                        sub.status === "duplicate" ? "bg-yellow-100 text-yellow-700" :
                        "bg-gray-100 text-gray-700"
                      }>
                        {sub.status_label || sub.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {sub.lead_id ? (
                        <span className="text-blue-600 font-mono text-xs">{sub.lead_id.slice(0, 8)}...</span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSubmissionsDialogOpen(false)}>
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
