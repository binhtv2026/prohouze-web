import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
import api from "@/lib/api";
import {
  Settings,
  Plus,
  Edit,
  Trash2,
  Users,
  BarChart3,
  Target,
  Zap,
  Brain,
  Shuffle,
  MapPin,
  Building,
  TrendingUp,
  Scale,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Activity,
  ChevronRight,
} from "lucide-react";

const DISTRIBUTION_METHODS = [
  {
    value: "round_robin",
    label: "Round Robin",
    icon: Shuffle,
    description: "Chia đều tuần tự cho từng sales",
    color: "bg-blue-100 text-blue-700",
  },
  {
    value: "ai_smart",
    label: "AI Smart",
    icon: Brain,
    description: "AI phân tích và chọn sales phù hợp nhất",
    color: "bg-purple-100 text-purple-700",
  },
  {
    value: "by_region",
    label: "Theo vùng miền",
    icon: MapPin,
    description: "Giao lead theo khu vực địa lý",
    color: "bg-green-100 text-green-700",
  },
  {
    value: "by_project",
    label: "Theo dự án",
    icon: Building,
    description: "Giao lead cho sales chuyên môn dự án",
    color: "bg-orange-100 text-orange-700",
  },
  {
    value: "by_performance",
    label: "Theo hiệu suất",
    icon: TrendingUp,
    description: "Ưu tiên sales có tỷ lệ chuyển đổi cao",
    color: "bg-emerald-100 text-emerald-700",
  },
  {
    value: "by_workload",
    label: "Theo workload",
    icon: Scale,
    description: "Cân bằng số lead mỗi sales đang giữ",
    color: "bg-cyan-100 text-cyan-700",
  },
  {
    value: "by_segment",
    label: "Theo segment",
    icon: Target,
    description: "VIP → Top Sales, Entry → Junior Sales",
    color: "bg-amber-100 text-amber-700",
  },
  {
    value: "hybrid",
    label: "Hybrid",
    icon: Zap,
    description: "Kết hợp nhiều phương pháp",
    color: "bg-pink-100 text-pink-700",
  },
];

const SEGMENTS = [
  { value: "vip", label: "VIP (> 10 tỷ)" },
  { value: "high_value", label: "High Value (5-10 tỷ)" },
  { value: "mid_value", label: "Mid Value (2-5 tỷ)" },
  { value: "standard", label: "Standard (1-2 tỷ)" },
  { value: "entry", label: "Entry (< 1 tỷ)" },
  { value: "investor", label: "Investor" },
  { value: "corporate", label: "Corporate" },
];

const CHANNELS = [
  { value: "facebook", label: "Facebook" },
  { value: "tiktok", label: "TikTok" },
  { value: "youtube", label: "YouTube" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "zalo", label: "Zalo" },
  { value: "website", label: "Website" },
  { value: "referral", label: "Referral" },
  { value: "event", label: "Event" },
];

export default function DistributionRulesPage() {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedRule, setSelectedRule] = useState(null);
  const [users, setUsers] = useState([]);
  const [branches, setBranches] = useState([]);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    method: "ai_smart",
    priority: 1,
    is_active: true,
    conditions: {
      channels: [],
      segments: [],
      min_budget: null,
      max_budget: null,
    },
    config: {
      ai_enabled: true,
      balance_workload: true,
      consider_performance: true,
      max_leads_per_sales: 50,
    },
    target_users: [],
    target_teams: [],
    target_branches: [],
  });

  useEffect(() => {
    fetchRules();
    fetchUsers();
    fetchBranches();
  }, []);

  const fetchRules = async () => {
    try {
      const response = await api.get("/distribution-rules");
      setRules(response.data);
    } catch (error) {
      console.error("Error fetching rules:", error);
      // Mock data
      setRules([
        {
          id: "1",
          name: "AI Smart Distribution - Default",
          description: "Rule mặc định: AI phân tích lead và giao cho sales phù hợp nhất",
          method: "ai_smart",
          priority: 1,
          is_active: true,
          conditions: {},
          config: {
            ai_enabled: true,
            balance_workload: true,
            consider_performance: true,
          },
          target_users: [],
          target_teams: [],
          target_branches: [],
          created_at: "2024-01-01T00:00:00Z",
          last_triggered: "2024-02-10T09:30:00Z",
          trigger_count: 245,
          success_rate: 87.5,
        },
        {
          id: "2",
          name: "VIP Leads → Top Performers",
          description: "Lead VIP (ngân sách > 10 tỷ) được giao cho sales có hiệu suất cao nhất",
          method: "by_performance",
          priority: 0,
          is_active: true,
          conditions: {
            segments: ["vip", "high_value"],
            min_budget: 5000000000,
          },
          config: {
            top_performers_count: 5,
          },
          target_users: [],
          target_teams: [],
          target_branches: [],
          created_at: "2024-01-15T00:00:00Z",
          last_triggered: "2024-02-10T08:15:00Z",
          trigger_count: 32,
          success_rate: 92.3,
        },
        {
          id: "3",
          name: "Chia theo vùng miền",
          description: "Lead từ các tỉnh sẽ được giao cho sales phụ trách vùng đó",
          method: "by_region",
          priority: 2,
          is_active: true,
          conditions: {},
          config: {
            region_mapping: {
              "Hà Nội": "team_north",
              "TP.HCM": "team_south",
              "Đà Nẵng": "team_central",
            },
          },
          target_users: [],
          target_teams: ["team_north", "team_south", "team_central"],
          target_branches: [],
          created_at: "2024-01-20T00:00:00Z",
          last_triggered: "2024-02-09T16:45:00Z",
          trigger_count: 156,
          success_rate: 78.2,
        },
        {
          id: "4",
          name: "Cân bằng workload",
          description: "Khi 1 sales có > 30 leads pending, ưu tiên giao cho sales ít việc hơn",
          method: "by_workload",
          priority: 3,
          is_active: false,
          conditions: {},
          config: {
            max_leads_per_sales: 30,
            balance_threshold: 0.2,
          },
          target_users: [],
          target_teams: [],
          target_branches: [],
          created_at: "2024-02-01T00:00:00Z",
          last_triggered: null,
          trigger_count: 0,
          success_rate: 0,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await api.get("/users", { params: { role: "sales" } });
      setUsers(response.data);
    } catch {
      setUsers([]);
    }
  };

  const fetchBranches = async () => {
    try {
      const response = await api.get("/branches");
      setBranches(response.data);
    } catch {
      setBranches([]);
    }
  };

  const handleCreateRule = async () => {
    try {
      await api.post("/distribution-rules", formData);
      toast.success("Tạo rule phân bổ thành công!");
      setIsCreateDialogOpen(false);
      resetForm();
      fetchRules();
    } catch (error) {
      toast.error("Lỗi: " + (error.response?.data?.detail || error.message));
    }
  };

  const handleToggleRule = async (ruleId) => {
    try {
      await api.put(`/distribution-rules/${ruleId}/toggle`);
      toast.success("Đã cập nhật trạng thái rule!");
      fetchRules();
    } catch (error) {
      toast.error("Lỗi: " + error.message);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      method: "ai_smart",
      priority: 1,
      is_active: true,
      conditions: {
        channels: [],
        segments: [],
        min_budget: null,
        max_budget: null,
      },
      config: {
        ai_enabled: true,
        balance_workload: true,
        consider_performance: true,
        max_leads_per_sales: 50,
      },
      target_users: [],
      target_teams: [],
      target_branches: [],
    });
  };

  const getMethodIcon = (method) => {
    const config = DISTRIBUTION_METHODS.find((m) => m.value === method);
    return config?.icon || Settings;
  };

  const getMethodConfig = (method) => {
    return DISTRIBUTION_METHODS.find((m) => m.value === method);
  };

  // Stats
  const stats = {
    total: rules.length,
    active: rules.filter((r) => r.is_active).length,
    totalTriggers: rules.reduce((sum, r) => sum + (r.trigger_count || 0), 0),
    avgSuccessRate: rules.length > 0
      ? (rules.reduce((sum, r) => sum + (r.success_rate || 0), 0) / rules.filter(r => r.success_rate > 0).length).toFixed(1)
      : 0,
  };

  return (
    <div className="space-y-6" data-testid="distribution-rules-page">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">AI Lead Distribution</h1>
          <p className="text-gray-500">Cấu hình rules phân bổ lead thông minh cho đội ngũ sales</p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)} data-testid="create-rule-btn">
          <Plus className="h-4 w-4 mr-2" />
          Tạo rule mới
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Tổng rules</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Settings className="h-8 w-8 text-blue-500" />
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
                <p className="text-sm text-gray-500">Tổng lần phân bổ</p>
                <p className="text-2xl font-bold">{stats.totalTriggers}</p>
              </div>
              <Activity className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Tỷ lệ thành công</p>
                <p className="text-2xl font-bold text-emerald-600">{stats.avgSuccessRate}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-emerald-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Distribution Methods Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Phương pháp phân bổ có sẵn</CardTitle>
          <CardDescription>Chọn phương pháp phù hợp với chiến lược của bạn</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {DISTRIBUTION_METHODS.map((method) => {
              const MethodIcon = method.icon;
              return (
                <div
                  key={method.value}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md ${
                    formData.method === method.value
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200"
                  }`}
                  onClick={() => {
                    setFormData({ ...formData, method: method.value });
                    setIsCreateDialogOpen(true);
                  }}
                >
                  <div className={`h-10 w-10 rounded-lg ${method.color} flex items-center justify-center mb-3`}>
                    <MethodIcon className="h-5 w-5" />
                  </div>
                  <h3 className="font-semibold text-sm">{method.label}</h3>
                  <p className="text-xs text-gray-500 mt-1">{method.description}</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Active Rules */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Rules đang hoạt động</h2>
        {loading ? (
          <div className="text-center py-8">Đang tải...</div>
        ) : rules.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Brain className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Chưa có rule phân bổ nào</p>
              <Button className="mt-4" onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Tạo rule đầu tiên
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {rules
              .sort((a, b) => a.priority - b.priority)
              .map((rule, index) => {
                const methodConfig = getMethodConfig(rule.method);
                const MethodIcon = methodConfig?.icon || Settings;

                return (
                  <Card key={rule.id} className={`overflow-hidden ${!rule.is_active ? "opacity-60" : ""}`} data-testid={`rule-card-${rule.id}`}>
                    <CardContent className="p-0">
                      <div className="flex items-stretch">
                        {/* Priority indicator */}
                        <div className={`w-2 ${rule.is_active ? "bg-green-500" : "bg-gray-300"}`} />
                        
                        <div className="flex-1 p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <div className={`h-10 w-10 rounded-lg ${methodConfig?.color || "bg-gray-100"} flex items-center justify-center`}>
                                  <MethodIcon className="h-5 w-5" />
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <h3 className="font-semibold">{rule.name}</h3>
                                    <Badge variant="outline" className="text-xs">
                                      Priority: {rule.priority}
                                    </Badge>
                                    {rule.is_active ? (
                                      <Badge className="bg-green-100 text-green-700">Active</Badge>
                                    ) : (
                                      <Badge variant="secondary">Inactive</Badge>
                                    )}
                                  </div>
                                  <p className="text-sm text-gray-500">{rule.description}</p>
                                </div>
                              </div>

                              {/* Conditions */}
                              {rule.conditions && Object.keys(rule.conditions).length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-3 mb-3">
                                  <span className="text-xs text-gray-500">Điều kiện:</span>
                                  {rule.conditions.segments?.map((segment) => (
                                    <Badge key={segment} variant="outline" className="text-xs">
                                      {SEGMENTS.find((s) => s.value === segment)?.label || segment}
                                    </Badge>
                                  ))}
                                  {rule.conditions.channels?.map((channel) => (
                                    <Badge key={channel} variant="outline" className="text-xs">
                                      {channel}
                                    </Badge>
                                  ))}
                                  {rule.conditions.min_budget && (
                                    <Badge variant="outline" className="text-xs">
                                      ≥ {(rule.conditions.min_budget / 1000000000).toFixed(1)} tỷ
                                    </Badge>
                                  )}
                                </div>
                              )}

                              {/* Stats */}
                              <div className="flex items-center gap-6 text-sm text-gray-500">
                                <div className="flex items-center gap-1">
                                  <Activity className="h-4 w-4" />
                                  <span>{rule.trigger_count || 0} lần phân bổ</span>
                                </div>
                                {rule.success_rate > 0 && (
                                  <div className="flex items-center gap-1">
                                    <TrendingUp className="h-4 w-4 text-green-500" />
                                    <span className="text-green-600">{rule.success_rate}% thành công</span>
                                  </div>
                                )}
                                {rule.last_triggered && (
                                  <div className="flex items-center gap-1">
                                    <Clock className="h-4 w-4" />
                                    <span>Lần cuối: {new Date(rule.last_triggered).toLocaleString("vi-VN")}</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={rule.is_active}
                                onCheckedChange={() => handleToggleRule(rule.id)}
                              />
                              <Button variant="ghost" size="icon">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="text-red-500">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
          </div>
        )}
      </div>

      {/* How it works */}
      <Card className="bg-gradient-to-r from-purple-50 to-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-600" />
            Cách AI Smart Distribution hoạt động
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-4">
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-full bg-purple-600 text-white flex items-center justify-center text-sm font-bold">
                1
              </div>
              <div>
                <h4 className="font-semibold text-sm">Lead đến</h4>
                <p className="text-xs text-gray-600">Lead mới được tạo từ bất kỳ kênh nào</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-full bg-purple-600 text-white flex items-center justify-center text-sm font-bold">
                2
              </div>
              <div>
                <h4 className="font-semibold text-sm">Phân tích</h4>
                <p className="text-xs text-gray-600">AI phân tích lead: segment, budget, vùng miền...</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-full bg-purple-600 text-white flex items-center justify-center text-sm font-bold">
                3
              </div>
              <div>
                <h4 className="font-semibold text-sm">Match Rules</h4>
                <p className="text-xs text-gray-600">Áp dụng rules theo thứ tự ưu tiên</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-full bg-purple-600 text-white flex items-center justify-center text-sm font-bold">
                4
              </div>
              <div>
                <h4 className="font-semibold text-sm">Phân bổ</h4>
                <p className="text-xs text-gray-600">Giao lead + tạo task + thông báo sales</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Create Rule Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Tạo Rule Phân bổ Lead mới</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <div>
                <Label>Tên rule *</Label>
                <Input
                  placeholder="Ví dụ: VIP Leads → Top Performers"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <Label>Mô tả</Label>
                <Textarea
                  placeholder="Mô tả ngắn gọn về rule này..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
            </div>

            {/* Method Selection */}
            <div>
              <Label>Phương pháp phân bổ *</Label>
              <div className="grid grid-cols-2 gap-3 mt-2">
                {DISTRIBUTION_METHODS.map((method) => {
                  const MethodIcon = method.icon;
                  return (
                    <div
                      key={method.value}
                      className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                        formData.method === method.value
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                      onClick={() => setFormData({ ...formData, method: method.value })}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`h-8 w-8 rounded-lg ${method.color} flex items-center justify-center`}>
                          <MethodIcon className="h-4 w-4" />
                        </div>
                        <div>
                          <h4 className="font-medium text-sm">{method.label}</h4>
                          <p className="text-xs text-gray-500">{method.description}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Priority */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Độ ưu tiên *</Label>
                <Select
                  value={formData.priority.toString()}
                  onValueChange={(v) => setFormData({ ...formData, priority: parseInt(v) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">0 - Cao nhất</SelectItem>
                    <SelectItem value="1">1 - Cao</SelectItem>
                    <SelectItem value="2">2 - Trung bình</SelectItem>
                    <SelectItem value="3">3 - Thấp</SelectItem>
                    <SelectItem value="4">4 - Thấp nhất</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 mt-1">Rule có priority thấp hơn sẽ được ưu tiên áp dụng trước</p>
              </div>
              <div>
                <Label>Trạng thái</Label>
                <div className="flex items-center gap-2 mt-2">
                  <Switch
                    checked={formData.is_active}
                    onCheckedChange={(v) => setFormData({ ...formData, is_active: v })}
                  />
                  <span className="text-sm">{formData.is_active ? "Active" : "Inactive"}</span>
                </div>
              </div>
            </div>

            {/* Conditions */}
            <div className="space-y-4">
              <Label className="text-base font-semibold">Điều kiện áp dụng</Label>
              <p className="text-sm text-gray-500 -mt-2">Rule chỉ áp dụng khi lead thỏa mãn các điều kiện sau (để trống = áp dụng cho tất cả)</p>
              
              <div>
                <Label>Áp dụng cho segment</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {SEGMENTS.map((segment) => {
                    const isSelected = formData.conditions.segments?.includes(segment.value);
                    return (
                      <Button
                        key={segment.value}
                        type="button"
                        variant={isSelected ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          const current = formData.conditions.segments || [];
                          setFormData({
                            ...formData,
                            conditions: {
                              ...formData.conditions,
                              segments: isSelected
                                ? current.filter((s) => s !== segment.value)
                                : [...current, segment.value],
                            },
                          });
                        }}
                      >
                        {segment.label}
                      </Button>
                    );
                  })}
                </div>
              </div>

              <div>
                <Label>Áp dụng cho kênh</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {CHANNELS.map((channel) => {
                    const isSelected = formData.conditions.channels?.includes(channel.value);
                    return (
                      <Button
                        key={channel.value}
                        type="button"
                        variant={isSelected ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          const current = formData.conditions.channels || [];
                          setFormData({
                            ...formData,
                            conditions: {
                              ...formData.conditions,
                              channels: isSelected
                                ? current.filter((c) => c !== channel.value)
                                : [...current, channel.value],
                            },
                          });
                        }}
                      >
                        {channel.label}
                      </Button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Ngân sách tối thiểu (VND)</Label>
                  <Input
                    type="number"
                    placeholder="Ví dụ: 5000000000"
                    value={formData.conditions.min_budget || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        conditions: {
                          ...formData.conditions,
                          min_budget: e.target.value ? parseInt(e.target.value) : null,
                        },
                      })
                    }
                  />
                </div>
                <div>
                  <Label>Ngân sách tối đa (VND)</Label>
                  <Input
                    type="number"
                    placeholder="Ví dụ: 10000000000"
                    value={formData.conditions.max_budget || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        conditions: {
                          ...formData.conditions,
                          max_budget: e.target.value ? parseInt(e.target.value) : null,
                        },
                      })
                    }
                  />
                </div>
              </div>
            </div>

            {/* Config */}
            {formData.method === "ai_smart" && (
              <div className="space-y-4 p-4 bg-purple-50 rounded-lg">
                <Label className="text-base font-semibold text-purple-700">Cấu hình AI Smart</Label>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">Cân bằng workload</p>
                      <p className="text-xs text-gray-600">Ưu tiên sales đang ít lead</p>
                    </div>
                    <Switch
                      checked={formData.config.balance_workload}
                      onCheckedChange={(v) =>
                        setFormData({ ...formData, config: { ...formData.config, balance_workload: v } })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">Xét hiệu suất</p>
                      <p className="text-xs text-gray-600">Lead VIP ưu tiên top performer</p>
                    </div>
                    <Switch
                      checked={formData.config.consider_performance}
                      onCheckedChange={(v) =>
                        setFormData({ ...formData, config: { ...formData.config, consider_performance: v } })
                      }
                    />
                  </div>
                  <div>
                    <Label>Max leads/sales</Label>
                    <Input
                      type="number"
                      value={formData.config.max_leads_per_sales}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          config: { ...formData.config, max_leads_per_sales: parseInt(e.target.value) || 50 },
                        })
                      }
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Khi sales đạt số lead này, AI sẽ không giao thêm
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleCreateRule} disabled={!formData.name} data-testid="submit-rule-btn">
              Tạo Rule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
