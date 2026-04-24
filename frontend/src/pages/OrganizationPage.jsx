import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { toast } from "sonner";
import api from "@/lib/api";
import {
  Building2,
  Users,
  GitBranch,
  Plus,
  Edit,
  Trash2,
  MoreVertical,
  ChevronRight,
  ChevronDown,
  User,
  MapPin,
  Phone,
  Mail,
  Briefcase,
  Network,
  List,
} from "lucide-react";

const ORG_UNIT_TYPES = {
  company: { label: "Công ty", color: "bg-purple-600", icon: Building2, level: 0 },
  branch: { label: "Chi nhánh", color: "bg-blue-600", icon: MapPin, level: 1 },
  department: { label: "Phòng ban", color: "bg-green-600", icon: Briefcase, level: 2 },
  team: { label: "Team", color: "bg-orange-500", icon: Users, level: 3 },
  group: { label: "Nhóm", color: "bg-cyan-500", icon: GitBranch, level: 4 },
};

// Flatten tree for rendering
function flattenTree(nodes, level = 0, parentExpanded = true) {
  const result = [];
  for (const node of nodes) {
    result.push({ ...node, level, visible: parentExpanded });
    if (node.children && node.children.length > 0) {
      const childItems = flattenTree(node.children, level + 1, parentExpanded && node.expanded);
      result.push(...childItems);
    }
  }
  return result;
}

const DEMO_ORG_UNITS = [
  { id: 'org-1', name: 'ProHouze Vietnam', code: 'PHV', type: 'company' },
  { id: 'org-2', name: 'Chi nhánh Hà Nội', code: 'HN001', type: 'branch', parent_id: 'org-1' },
  { id: 'org-3', name: 'Chi nhánh TP.HCM', code: 'SG001', type: 'branch', parent_id: 'org-1' },
];

const DEMO_USERS = [
  { id: 'org-user-1', full_name: 'Nguyễn Văn A' },
  { id: 'org-user-2', full_name: 'Trần Văn B' },
  { id: 'org-user-3', full_name: 'Lê Văn C' },
];

export default function OrganizationPage() {
  const [orgTree, setOrgTree] = useState([]);
  const [orgUnits, setOrgUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("tree");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [parentUnit, setParentUnit] = useState(null);
  const [users, setUsers] = useState([]);
  const [expandedNodes, setExpandedNodes] = useState(new Set(["1", "2", "3"]));

  const [formData, setFormData] = useState({
    name: "",
    code: "",
    type: "branch",
    parent_id: null,
    manager_id: null,
    description: "",
    address: "",
    phone: "",
    email: "",
    order: 0,
  });

  const fetchOrgTree = useCallback(async () => {
    try {
      const response = await api.get("/hrm/org-tree");
      setOrgTree(response.data);
    } catch (error) {
      console.error("Error fetching org tree:", error);
      // Mock data
      setOrgTree([
        {
          id: "1",
          name: "ProHouze Vietnam",
          code: "PHV",
          type: "company",
          manager_name: "Nguyễn Văn A",
          employee_count: 150,
          children: [
            {
              id: "2",
              name: "Chi nhánh Hà Nội",
              code: "HN001",
              type: "branch",
              manager_name: "Trần Văn B",
              employee_count: 45,
              children: [
                {
                  id: "4",
                  name: "Phòng Kinh doanh",
                  code: "HN-KD",
                  type: "department",
                  manager_name: "Lê Văn C",
                  employee_count: 20,
                  children: [
                    { id: "7", name: "Team 1", code: "HN-KD-T1", type: "team", employee_count: 10, children: [] },
                    { id: "8", name: "Team 2", code: "HN-KD-T2", type: "team", employee_count: 10, children: [] },
                  ],
                },
                {
                  id: "5",
                  name: "Phòng Marketing",
                  code: "HN-MKT",
                  type: "department",
                  manager_name: "Phạm Văn D",
                  employee_count: 8,
                  children: [],
                },
              ],
            },
            {
              id: "3",
              name: "Chi nhánh TP.HCM",
              code: "SG001",
              type: "branch",
              manager_name: "Hoàng Văn E",
              employee_count: 55,
              children: [
                {
                  id: "6",
                  name: "Phòng Kinh doanh",
                  code: "SG-KD",
                  type: "department",
                  manager_name: "Nguyễn Văn F",
                  employee_count: 25,
                  children: [],
                },
              ],
            },
          ],
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchOrgUnits = useCallback(async () => {
    try {
      const response = await api.get("/hrm/org-units");
      setOrgUnits(Array.isArray(response?.data) && response.data.length > 0 ? response.data : DEMO_ORG_UNITS);
    } catch {
      setOrgUnits(DEMO_ORG_UNITS);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      const response = await api.get("/users");
      setUsers(Array.isArray(response?.data) && response.data.length > 0 ? response.data : DEMO_USERS);
    } catch {
      setUsers(DEMO_USERS);
    }
  }, []);

  useEffect(() => {
    fetchOrgTree();
    fetchOrgUnits();
    fetchUsers();
  }, [fetchOrgTree, fetchOrgUnits, fetchUsers]);

  const toggleNode = (nodeId) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  };

  const resetForm = () => {
    setFormData({
      name: "",
      code: "",
      type: "branch",
      parent_id: null,
      manager_id: null,
      description: "",
      address: "",
      phone: "",
      email: "",
      order: 0,
    });
    setSelectedUnit(null);
    setParentUnit(null);
  };

  const handleCreate = async () => {
    try {
      const payload = { ...formData };
      if (parentUnit) {
        payload.parent_id = parentUnit.id;
      }

      if (selectedUnit) {
        await api.put(`/hrm/org-units/${selectedUnit.id}`, payload);
        toast.success("Cập nhật đơn vị thành công!");
      } else {
        await api.post("/hrm/org-units", payload);
        toast.success("Tạo đơn vị thành công!");
      }
      setIsCreateDialogOpen(false);
      resetForm();
      fetchOrgTree();
      fetchOrgUnits();
    } catch (error) {
      toast.error("Lỗi: " + (error.response?.data?.detail || error.message));
    }
  };

  const handleEdit = (unit) => {
    setSelectedUnit(unit);
    setFormData({
      name: unit.name,
      code: unit.code,
      type: unit.type,
      parent_id: unit.parent_id,
      manager_id: unit.manager_id,
      description: unit.description || "",
      address: unit.address || "",
      phone: unit.phone || "",
      email: unit.email || "",
      order: unit.order || 0,
    });
    setIsCreateDialogOpen(true);
  };

  const handleDelete = async (unit) => {
    if (!confirm(`Bạn có chắc muốn xóa "${unit.name}"?`)) return;
    
    try {
      await api.delete(`/hrm/org-units/${unit.id}`);
      toast.success("Xóa đơn vị thành công!");
      fetchOrgTree();
      fetchOrgUnits();
    } catch (error) {
      toast.error("Lỗi: " + (error.response?.data?.detail || error.message));
    }
  };

  const handleAddChild = (parentNode) => {
    setParentUnit(parentNode);
    
    const typeOrder = ["company", "branch", "department", "team", "group"];
    const parentIndex = typeOrder.indexOf(parentNode.type);
    const suggestedType = parentIndex < typeOrder.length - 1 ? typeOrder[parentIndex + 1] : "group";
    
    setFormData({
      ...formData,
      type: suggestedType,
      parent_id: parentNode.id,
    });
    setIsCreateDialogOpen(true);
  };

  // Render tree node
  const renderTreeNode = (node, level = 0) => {
    const config = ORG_UNIT_TYPES[node.type] || ORG_UNIT_TYPES.team;
    const NodeIcon = config.icon;
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedNodes.has(node.id);

    return (
      <div key={node.id}>
        <div
          className={`flex items-center gap-2 p-3 rounded-lg hover:bg-gray-50 border transition-all ${
            level === 0 ? "bg-gray-50 border-gray-200" : "border-transparent"
          }`}
          style={{ marginLeft: `${level * 24}px` }}
        >
          <button
            onClick={() => toggleNode(node.id)}
            className={`w-6 h-6 flex items-center justify-center rounded hover:bg-gray-200 ${
              !hasChildren ? "invisible" : ""
            }`}
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-gray-500" />
            ) : (
              <ChevronRight className="h-4 w-4 text-gray-500" />
            )}
          </button>

          <div className={`h-10 w-10 rounded-lg ${config.color} flex items-center justify-center text-white`}>
            <NodeIcon className="h-5 w-5" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-gray-900 truncate">{node.name}</h4>
              <Badge variant="outline" className="text-xs">
                {node.code}
              </Badge>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-500">
              <span>{config.label}</span>
              {node.manager_name && (
                <span className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {node.manager_name}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {node.employee_count || 0} nhân viên
              </span>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleAddChild(node)}>
                <Plus className="h-4 w-4 mr-2" />
                Thêm đơn vị con
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleEdit(node)}>
                <Edit className="h-4 w-4 mr-2" />
                Chỉnh sửa
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDelete(node)} className="text-red-600">
                <Trash2 className="h-4 w-4 mr-2" />
                Xóa
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Children */}
        {isExpanded && hasChildren && (
          <div>
            {node.children.map((child) => renderTreeNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  // Stats
  const stats = {
    total_units: orgUnits.length,
    branches: orgUnits.filter(u => u.type === "branch").length,
    departments: orgUnits.filter(u => u.type === "department").length,
    teams: orgUnits.filter(u => u.type === "team").length,
  };

  return (
    <div className="space-y-6" data-testid="organization-page">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sơ đồ tổ chức</h1>
          <p className="text-gray-500">Quản lý cấu trúc tổ chức doanh nghiệp</p>
        </div>
        <div className="flex gap-2">
          <div className="flex border rounded-lg overflow-hidden">
            <Button
              variant={viewMode === "tree" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("tree")}
            >
              <Network className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
          <Button onClick={() => { resetForm(); setIsCreateDialogOpen(true); }} data-testid="add-unit-btn">
            <Plus className="h-4 w-4 mr-2" />
            Thêm đơn vị
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Tổng đơn vị</p>
                <p className="text-2xl font-bold">{stats.total_units}</p>
              </div>
              <Building2 className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Chi nhánh</p>
                <p className="text-2xl font-bold">{stats.branches}</p>
              </div>
              <MapPin className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Phòng ban</p>
                <p className="text-2xl font-bold">{stats.departments}</p>
              </div>
              <Briefcase className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Teams</p>
                <p className="text-2xl font-bold">{stats.teams}</p>
              </div>
              <Users className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Org Tree View */}
      {viewMode === "tree" && (
        <Card>
          <CardHeader>
            <CardTitle>Cây tổ chức</CardTitle>
            <CardDescription>
              Công ty → Chi nhánh → Phòng ban → Team → Nhóm
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Đang tải...</div>
            ) : orgTree.length === 0 ? (
              <div className="text-center py-12">
                <Building2 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Chưa có cấu trúc tổ chức</p>
                <Button className="mt-4" onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Tạo đơn vị đầu tiên
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {orgTree.map((node) => renderTreeNode(node, 0))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* List View */}
      {viewMode === "list" && (
        <Card>
          <CardHeader>
            <CardTitle>Danh sách đơn vị</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {orgUnits.map((unit) => {
                const config = ORG_UNIT_TYPES[unit.type] || ORG_UNIT_TYPES.team;
                const UnitIcon = config.icon;
                return (
                  <div
                    key={unit.id}
                    className="flex items-center gap-4 p-4 border rounded-lg hover:bg-gray-50"
                    data-testid={`org-unit-${unit.id}`}
                  >
                    <div className={`h-10 w-10 rounded-lg ${config.color} flex items-center justify-center text-white`}>
                      <UnitIcon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold">{unit.name}</h4>
                        <Badge variant="outline">{unit.code}</Badge>
                        <Badge className={config.color}>{config.label}</Badge>
                      </div>
                      <p className="text-sm text-gray-500">{unit.path}</p>
                    </div>
                    <div className="text-sm text-gray-500">
                      {unit.employee_count || 0} nhân viên
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(unit)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Chỉnh sửa
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDelete(unit)} className="text-red-600">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Xóa
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {selectedUnit ? "Chỉnh sửa đơn vị" : parentUnit ? `Thêm đơn vị con của "${parentUnit.name}"` : "Tạo đơn vị mới"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Tên đơn vị *</Label>
                <Input
                  placeholder="VD: Chi nhánh Hà Nội"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <Label>Mã đơn vị *</Label>
                <Input
                  placeholder="VD: HN001"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                />
              </div>
            </div>

            <div>
              <Label>Loại đơn vị *</Label>
              <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ORG_UNIT_TYPES).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center gap-2">
                        <div className={`h-4 w-4 rounded ${config.color}`} />
                        {config.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {!parentUnit && orgUnits.length > 0 && (
              <div>
                <Label>Thuộc đơn vị</Label>
                <Select
                  value={formData.parent_id || ""}
                  onValueChange={(v) => setFormData({ ...formData, parent_id: v || null })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn đơn vị cha (tùy chọn)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Không có (đơn vị gốc)</SelectItem>
                    {orgUnits.map((unit) => (
                      <SelectItem key={unit.id} value={unit.id}>
                        {unit.path || unit.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <Label>Người quản lý</Label>
              <Select
                value={formData.manager_id || ""}
                onValueChange={(v) => setFormData({ ...formData, manager_id: v || null })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn người quản lý" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Chưa có</SelectItem>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.full_name} ({user.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Mô tả</Label>
              <Textarea
                placeholder="Mô tả về đơn vị..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Địa chỉ</Label>
                <Input
                  placeholder="Địa chỉ văn phòng"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>
              <div>
                <Label>Điện thoại</Label>
                <Input
                  placeholder="Số điện thoại"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label>Email</Label>
              <Input
                type="email"
                placeholder="Email đơn vị"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsCreateDialogOpen(false); resetForm(); }}>
              Hủy
            </Button>
            <Button onClick={handleCreate} disabled={!formData.name || !formData.code} data-testid="submit-unit-btn">
              {selectedUnit ? "Cập nhật" : "Tạo mới"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
