import { useState, useEffect, useCallback } from "react";
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
  Briefcase,
  Plus,
  Edit,
  Trash2,
  Users,
  DollarSign,
  Target,
  CheckCircle,
  Star,
  Shield,
  TrendingUp,
  Search,
  Filter,
} from "lucide-react";

const DEPARTMENT_TYPES = [
  { value: "sales", label: "Kinh doanh", color: "bg-blue-500" },
  { value: "marketing", label: "Marketing", color: "bg-purple-500" },
  { value: "content", label: "Content", color: "bg-pink-500" },
  { value: "support", label: "Hỗ trợ", color: "bg-green-500" },
  { value: "management", label: "Quản lý", color: "bg-orange-500" },
  { value: "hr", label: "Nhân sự", color: "bg-cyan-500" },
  { value: "finance", label: "Tài chính", color: "bg-yellow-500" },
  { value: "it", label: "IT", color: "bg-gray-500" },
];

const DEFAULT_PERMISSIONS = {
  sales: ["view_leads", "manage_own_leads", "view_projects", "create_activities"],
  marketing: ["view_leads", "view_all_leads", "manage_campaigns", "create_content"],
  manager: ["view_leads", "view_all_leads", "assign_leads", "view_reports", "manage_team"],
  bod: ["view_all", "manage_all", "view_reports", "manage_settings"],
  admin: ["full_access"],
};

const DEMO_POSITIONS = [
  {
    id: "1",
    title: "Sales Executive",
    code: "SE",
    department_type: "sales",
    level: 1,
    description: "Nhân viên kinh doanh bất động sản",
    responsibilities: ["Tư vấn khách hàng", "Chăm sóc lead", "Đạt KPI doanh số"],
    requirements: ["Tốt nghiệp CĐ/ĐH", "Kỹ năng giao tiếp tốt", "Có xe máy"],
    skills: ["Tư vấn", "Đàm phán", "MS Office"],
    salary_min: 8000000,
    salary_max: 15000000,
    kpi_targets: { leads_per_month: 20, conversion_rate: 5 },
    permissions: ["view_leads", "manage_own_leads"],
    is_management: false,
    employee_count: 45,
    is_active: true,
    created_at: "2024-01-01",
  },
  {
    id: "2",
    title: "Team Leader",
    code: "TL",
    department_type: "sales",
    level: 3,
    description: "Trưởng nhóm kinh doanh",
    responsibilities: ["Quản lý team 5-10 người", "Đào tạo nhân viên mới", "Đạt KPI team"],
    requirements: ["Kinh nghiệm 2+ năm sales", "Có kinh nghiệm quản lý"],
    skills: ["Leadership", "Coaching", "Sales"],
    salary_min: 15000000,
    salary_max: 25000000,
    kpi_targets: { team_revenue: 5000000000, team_size: 8 },
    permissions: ["view_leads", "assign_leads", "view_team_reports"],
    is_management: true,
    employee_count: 12,
    is_active: true,
    created_at: "2024-01-01",
  },
  {
    id: "3",
    title: "Marketing Specialist",
    code: "MKT",
    department_type: "marketing",
    level: 2,
    description: "Chuyên viên Marketing",
    responsibilities: ["Lên kế hoạch marketing", "Quản lý campaigns", "Phân tích hiệu quả"],
    requirements: ["Kinh nghiệm 1+ năm marketing"],
    skills: ["Digital Marketing", "Content", "Analytics"],
    salary_min: 12000000,
    salary_max: 20000000,
    kpi_targets: { leads_generated: 100, cost_per_lead: 100000 },
    permissions: ["view_all_leads", "manage_campaigns"],
    is_management: false,
    employee_count: 8,
    is_active: true,
    created_at: "2024-01-01",
  },
];

export default function JobPositionsPage() {
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");

  const [formData, setFormData] = useState({
    title: "",
    code: "",
    department_type: "sales",
    level: 1,
    description: "",
    responsibilities: [],
    requirements: [],
    skills: [],
    salary_min: null,
    salary_max: null,
    kpi_targets: {},
    permissions: [],
    is_management: false,
  });

  const [responsibilityInput, setResponsibilityInput] = useState("");
  const [requirementInput, setRequirementInput] = useState("");
  const [skillInput, setSkillInput] = useState("");

  const fetchPositions = useCallback(async () => {
    try {
      const params = {};
      if (departmentFilter !== "all") params.department_type = departmentFilter;
      
      const response = await api.get("/hrm/positions", { params });
      const positionItems = Array.isArray(response.data) ? response.data : [];
      setPositions(positionItems.length > 0 ? positionItems : DEMO_POSITIONS);
    } catch (error) {
      console.error("Error fetching positions:", error);
      setPositions(DEMO_POSITIONS);
    } finally {
      setLoading(false);
    }
  }, [departmentFilter]);

  useEffect(() => {
    fetchPositions();
  }, [fetchPositions]);

  const handleCreate = async () => {
    try {
      if (selectedPosition) {
        await api.put(`/hrm/positions/${selectedPosition.id}`, formData);
        toast.success("Cập nhật vị trí thành công!");
      } else {
        await api.post("/hrm/positions", formData);
        toast.success("Tạo vị trí thành công!");
      }
      setIsCreateDialogOpen(false);
      resetForm();
      fetchPositions();
    } catch (error) {
      toast.error("Lỗi: " + (error.response?.data?.detail || error.message));
    }
  };

  const handleEdit = (position) => {
    setSelectedPosition(position);
    setFormData({
      title: position.title,
      code: position.code,
      department_type: position.department_type,
      level: position.level,
      description: position.description || "",
      responsibilities: position.responsibilities || [],
      requirements: position.requirements || [],
      skills: position.skills || [],
      salary_min: position.salary_min,
      salary_max: position.salary_max,
      kpi_targets: position.kpi_targets || {},
      permissions: position.permissions || [],
      is_management: position.is_management,
    });
    setIsCreateDialogOpen(true);
  };

  const handleDelete = async (position) => {
    if (!confirm(`Bạn có chắc muốn xóa vị trí "${position.title}"?`)) return;
    
    try {
      await api.delete(`/hrm/positions/${position.id}`);
      toast.success("Xóa vị trí thành công!");
      fetchPositions();
    } catch (error) {
      toast.error("Lỗi: " + (error.response?.data?.detail || error.message));
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      code: "",
      department_type: "sales",
      level: 1,
      description: "",
      responsibilities: [],
      requirements: [],
      skills: [],
      salary_min: null,
      salary_max: null,
      kpi_targets: {},
      permissions: [],
      is_management: false,
    });
    setSelectedPosition(null);
  };

  const addItem = (field, value, setter) => {
    if (value.trim() && !formData[field].includes(value.trim())) {
      setFormData({
        ...formData,
        [field]: [...formData[field], value.trim()],
      });
      setter("");
    }
  };

  const removeItem = (field, value) => {
    setFormData({
      ...formData,
      [field]: formData[field].filter((v) => v !== value),
    });
  };

  const formatSalary = (value) => {
    if (!value) return "Thỏa thuận";
    return new Intl.NumberFormat("vi-VN").format(value) + "đ";
  };

  const filteredPositions = positions.filter((pos) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (!pos.title.toLowerCase().includes(query) && !pos.code.toLowerCase().includes(query)) {
        return false;
      }
    }
    return true;
  });

  // Stats
  const stats = {
    total: positions.length,
    management: positions.filter((p) => p.is_management).length,
    total_employees: positions.reduce((sum, p) => sum + (p.employee_count || 0), 0),
  };

  return (
    <div className="space-y-6" data-testid="job-positions-page">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vị trí công việc</h1>
          <p className="text-gray-500">Quản lý các vị trí và chức danh trong công ty</p>
        </div>
        <Button onClick={() => { resetForm(); setIsCreateDialogOpen(true); }} data-testid="add-position-btn">
          <Plus className="h-4 w-4 mr-2" />
          Thêm vị trí
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Tổng vị trí</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Briefcase className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Vị trí quản lý</p>
                <p className="text-2xl font-bold">{stats.management}</p>
              </div>
              <Shield className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Tổng nhân viên</p>
                <p className="text-2xl font-bold">{stats.total_employees}</p>
              </div>
              <Users className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="py-4">
          <div className="flex gap-4 items-center">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Phòng ban" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả phòng ban</SelectItem>
                  {DEPARTMENT_TYPES.map((dept) => (
                    <SelectItem key={dept.value} value={dept.value}>
                      {dept.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Tìm kiếm vị trí..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Positions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full text-center py-8">Đang tải...</div>
        ) : filteredPositions.length === 0 ? (
          <div className="col-span-full">
            <Card>
              <CardContent className="py-12 text-center">
                <Briefcase className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Chưa có vị trí nào</p>
                <Button className="mt-4" onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Tạo vị trí đầu tiên
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : (
          filteredPositions.map((position) => {
            const dept = DEPARTMENT_TYPES.find((d) => d.value === position.department_type);
            return (
              <Card key={position.id} className="overflow-hidden" data-testid={`position-card-${position.id}`}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <CardTitle className="text-lg">{position.title}</CardTitle>
                        {position.is_management && (
                          <Badge className="bg-purple-100 text-purple-700">
                            <Shield className="h-3 w-3 mr-1" />
                            Quản lý
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{position.code}</Badge>
                        <Badge className={dept?.color || "bg-gray-500"}>
                          {dept?.label || position.department_type}
                        </Badge>
                        <Badge variant="secondary">Level {position.level}</Badge>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(position)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-red-500" onClick={() => handleDelete(position)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {position.description && (
                    <p className="text-sm text-gray-600 line-clamp-2">{position.description}</p>
                  )}

                  {/* Salary Range */}
                  <div className="flex items-center gap-2 text-sm">
                    <DollarSign className="h-4 w-4 text-green-500" />
                    <span className="text-gray-600">
                      {formatSalary(position.salary_min)} - {formatSalary(position.salary_max)}
                    </span>
                  </div>

                  {/* Employee Count */}
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4 text-blue-500" />
                    <span className="text-gray-600">{position.employee_count || 0} nhân viên</span>
                  </div>

                  {/* Skills */}
                  {position.skills && position.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {position.skills.slice(0, 4).map((skill) => (
                        <Badge key={skill} variant="secondary" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                      {position.skills.length > 4 && (
                        <Badge variant="secondary" className="text-xs">
                          +{position.skills.length - 4}
                        </Badge>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedPosition ? "Chỉnh sửa vị trí" : "Tạo vị trí mới"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Tên vị trí *</Label>
                <Input
                  placeholder="VD: Sales Executive"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>
              <div>
                <Label>Mã vị trí *</Label>
                <Input
                  placeholder="VD: SE"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Phòng ban *</Label>
                <Select
                  value={formData.department_type}
                  onValueChange={(v) => setFormData({ ...formData, department_type: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DEPARTMENT_TYPES.map((dept) => (
                      <SelectItem key={dept.value} value={dept.value}>
                        {dept.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Cấp bậc (1-10)</Label>
                <Input
                  type="number"
                  min={1}
                  max={10}
                  value={formData.level}
                  onChange={(e) => setFormData({ ...formData, level: parseInt(e.target.value) || 1 })}
                />
              </div>
              <div className="flex items-end">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.is_management}
                    onCheckedChange={(v) => setFormData({ ...formData, is_management: v })}
                  />
                  <Label>Vị trí quản lý</Label>
                </div>
              </div>
            </div>

            <div>
              <Label>Mô tả công việc</Label>
              <Textarea
                placeholder="Mô tả chi tiết về vị trí..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            {/* Salary */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Lương tối thiểu (VND)</Label>
                <Input
                  type="number"
                  placeholder="VD: 8000000"
                  value={formData.salary_min || ""}
                  onChange={(e) => setFormData({ ...formData, salary_min: e.target.value ? parseInt(e.target.value) : null })}
                />
              </div>
              <div>
                <Label>Lương tối đa (VND)</Label>
                <Input
                  type="number"
                  placeholder="VD: 15000000"
                  value={formData.salary_max || ""}
                  onChange={(e) => setFormData({ ...formData, salary_max: e.target.value ? parseInt(e.target.value) : null })}
                />
              </div>
            </div>

            {/* Responsibilities */}
            <div>
              <Label>Trách nhiệm công việc</Label>
              <div className="flex gap-2 mb-2">
                <Input
                  placeholder="Thêm trách nhiệm..."
                  value={responsibilityInput}
                  onChange={(e) => setResponsibilityInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addItem("responsibilities", responsibilityInput, setResponsibilityInput);
                    }
                  }}
                />
                <Button type="button" onClick={() => addItem("responsibilities", responsibilityInput, setResponsibilityInput)}>
                  Thêm
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.responsibilities.map((item, idx) => (
                  <Badge key={idx} variant="secondary" className="gap-1">
                    {item}
                    <button onClick={() => removeItem("responsibilities", item)} className="ml-1 hover:text-red-500">×</button>
                  </Badge>
                ))}
              </div>
            </div>

            {/* Requirements */}
            <div>
              <Label>Yêu cầu</Label>
              <div className="flex gap-2 mb-2">
                <Input
                  placeholder="Thêm yêu cầu..."
                  value={requirementInput}
                  onChange={(e) => setRequirementInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addItem("requirements", requirementInput, setRequirementInput);
                    }
                  }}
                />
                <Button type="button" onClick={() => addItem("requirements", requirementInput, setRequirementInput)}>
                  Thêm
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.requirements.map((item, idx) => (
                  <Badge key={idx} variant="secondary" className="gap-1">
                    {item}
                    <button onClick={() => removeItem("requirements", item)} className="ml-1 hover:text-red-500">×</button>
                  </Badge>
                ))}
              </div>
            </div>

            {/* Skills */}
            <div>
              <Label>Kỹ năng</Label>
              <div className="flex gap-2 mb-2">
                <Input
                  placeholder="Thêm kỹ năng..."
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addItem("skills", skillInput, setSkillInput);
                    }
                  }}
                />
                <Button type="button" onClick={() => addItem("skills", skillInput, setSkillInput)}>
                  Thêm
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.skills.map((item, idx) => (
                  <Badge key={idx} variant="outline" className="gap-1">
                    {item}
                    <button onClick={() => removeItem("skills", item)} className="ml-1 hover:text-red-500">×</button>
                  </Badge>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsCreateDialogOpen(false); resetForm(); }}>
              Hủy
            </Button>
            <Button onClick={handleCreate} disabled={!formData.title || !formData.code} data-testid="submit-position-btn">
              {selectedPosition ? "Cập nhật" : "Tạo mới"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
