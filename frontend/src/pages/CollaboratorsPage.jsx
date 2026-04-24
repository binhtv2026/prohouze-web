import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import api from "@/lib/api";
import {
  Users,
  Plus,
  Edit,
  Trash2,
  MoreVertical,
  Phone,
  Mail,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  CreditCard,
  UserPlus,
  Target,
  Award,
  Search,
  Filter,
  FileText,
  Banknote,
} from "lucide-react";

const CTV_STATUS = {
  pending: { label: "Chờ duyệt", color: "bg-yellow-100 text-yellow-700", icon: Clock },
  active: { label: "Hoạt động", color: "bg-green-100 text-green-700", icon: CheckCircle },
  inactive: { label: "Ngưng hoạt động", color: "bg-gray-100 text-gray-700", icon: XCircle },
  suspended: { label: "Tạm ngưng", color: "bg-orange-100 text-orange-700", icon: AlertCircle },
  terminated: { label: "Đã chấm dứt", color: "bg-red-100 text-red-700", icon: XCircle },
};

const COMMISSION_STATUS = {
  pending: { label: "Chờ duyệt", color: "bg-yellow-100 text-yellow-700" },
  approved: { label: "Đã duyệt", color: "bg-blue-100 text-blue-700" },
  paid: { label: "Đã thanh toán", color: "bg-green-100 text-green-700" },
  cancelled: { label: "Đã hủy", color: "bg-red-100 text-red-700" },
};

export default function CollaboratorsPage() {
  const [collaborators, setCollaborators] = useState([]);
  const [commissionPolicies, setCommissionPolicies] = useState([]);
  const [commissions, setCommissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("collaborators");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Dialogs
  const [isCreateCTVDialogOpen, setIsCreateCTVDialogOpen] = useState(false);
  const [isCreatePolicyDialogOpen, setIsCreatePolicyDialogOpen] = useState(false);
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [selectedCTV, setSelectedCTV] = useState(null);
  const [selectedPolicy, setSelectedPolicy] = useState(null);

  const [users, setUsers] = useState([]);
  const [orgUnits, setOrgUnits] = useState([]);

  const [ctvFormData, setCTVFormData] = useState({
    full_name: "",
    phone: "",
    email: "",
    id_number: "",
    address: "",
    bank_name: "",
    bank_account: "",
    bank_branch: "",
    assigned_to_id: "",
    org_unit_id: "",
    commission_policy_id: "",
    notes: "",
  });

  const [policyFormData, setPolicyFormData] = useState({
    name: "",
    code: "",
    type: "tiered",
    description: "",
    tiers: [
      { min_deals: 1, max_deals: 5, rate: 1.0, bonus: 0 },
      { min_deals: 6, max_deals: 10, rate: 1.5, bonus: 500000 },
      { min_deals: 11, max_deals: null, rate: 2.0, bonus: 1000000 },
    ],
    min_deal_value: null,
  });

  const fetchCollaborators = useCallback(async () => {
    try {
      const params = {};
      if (statusFilter !== "all") params.status = statusFilter;
      
      const response = await api.get("/hrm/collaborators", { params });
      setCollaborators(response.data);
    } catch (error) {
      console.error("Error fetching collaborators:", error);
      // Mock data
      setCollaborators([
        {
          id: "1",
          code: "CTV0001",
          full_name: "Nguyễn Văn An",
          phone: "0901234567",
          email: "an.nguyen@gmail.com",
          status: "active",
          commission_policy_name: "Chính sách tiêu chuẩn",
          assigned_to_name: "Trần Sales",
          org_unit_name: "Chi nhánh Hà Nội",
          total_leads_referred: 25,
          total_deals_closed: 5,
          total_deal_value: 15000000000,
          total_commission_earned: 180000000,
          total_commission_paid: 150000000,
          pending_commission: 30000000,
          conversion_rate: 20,
          join_date: "2024-01-15",
          last_activity: "2024-02-10",
        },
        {
          id: "2",
          code: "CTV0002",
          full_name: "Trần Thị Bình",
          phone: "0912345678",
          email: "binh.tran@gmail.com",
          status: "pending",
          commission_policy_name: null,
          assigned_to_name: null,
          org_unit_name: null,
          total_leads_referred: 0,
          total_deals_closed: 0,
          total_deal_value: 0,
          total_commission_earned: 0,
          total_commission_paid: 0,
          pending_commission: 0,
          conversion_rate: 0,
          join_date: "2024-02-08",
          last_activity: null,
        },
        {
          id: "3",
          code: "CTV0003",
          full_name: "Lê Văn Cường",
          phone: "0923456789",
          email: "cuong.le@gmail.com",
          status: "active",
          commission_policy_name: "Chính sách VIP",
          assigned_to_name: "Nguyễn Manager",
          org_unit_name: "Chi nhánh TP.HCM",
          total_leads_referred: 45,
          total_deals_closed: 12,
          total_deal_value: 45000000000,
          total_commission_earned: 675000000,
          total_commission_paid: 500000000,
          pending_commission: 175000000,
          conversion_rate: 26.7,
          join_date: "2023-06-01",
          last_activity: "2024-02-09",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  const fetchCommissionPolicies = async () => {
    try {
      const response = await api.get("/hrm/commission-policies");
      setCommissionPolicies(response.data);
    } catch {
      setCommissionPolicies([
        {
          id: "1",
          name: "Chính sách tiêu chuẩn",
          code: "STANDARD",
          type: "tiered",
          description: "Áp dụng cho CTV mới",
          tiers: [
            { min_deals: 1, max_deals: 5, rate: 1.0, bonus: 0 },
            { min_deals: 6, max_deals: 10, rate: 1.5, bonus: 500000 },
            { min_deals: 11, max_deals: null, rate: 2.0, bonus: 1000000 },
          ],
          collaborator_count: 15,
          is_active: true,
        },
        {
          id: "2",
          name: "Chính sách VIP",
          code: "VIP",
          type: "tiered",
          description: "Dành cho CTV có thành tích xuất sắc",
          tiers: [
            { min_deals: 1, max_deals: 3, rate: 1.5, bonus: 500000 },
            { min_deals: 4, max_deals: 8, rate: 2.0, bonus: 1000000 },
            { min_deals: 9, max_deals: null, rate: 2.5, bonus: 2000000 },
          ],
          collaborator_count: 5,
          is_active: true,
        },
      ]);
    }
  };

  const fetchCommissions = async () => {
    try {
      const response = await api.get("/hrm/commissions");
      setCommissions(response.data);
    } catch {
      setCommissions([]);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await api.get("/users");
      setUsers(response.data);
    } catch {
      setUsers([]);
    }
  };

  const fetchOrgUnits = async () => {
    try {
      const response = await api.get("/hrm/org-units");
      setOrgUnits(response.data);
    } catch {
      setOrgUnits([]);
    }
  };

  useEffect(() => {
    fetchCollaborators();
    fetchCommissionPolicies();
    fetchCommissions();
    fetchUsers();
    fetchOrgUnits();
  }, [fetchCollaborators, statusFilter]);

  const handleCreateCTV = async () => {
    try {
      await api.post("/hrm/collaborators", ctvFormData);
      toast.success("Đăng ký CTV thành công! Chờ duyệt.");
      setIsCreateCTVDialogOpen(false);
      resetCTVForm();
      fetchCollaborators();
    } catch (error) {
      toast.error("Lỗi: " + (error.response?.data?.detail || error.message));
    }
  };

  const handleApproveCTV = async (status) => {
    if (!selectedCTV) return;
    
    try {
      await api.post(`/hrm/collaborators/${selectedCTV.id}/approve`, {
        status,
        commission_policy_id: ctvFormData.commission_policy_id,
        assigned_to_id: ctvFormData.assigned_to_id,
      });
      toast.success(status === "active" ? "Đã duyệt CTV!" : "Đã từ chối CTV!");
      setIsApproveDialogOpen(false);
      fetchCollaborators();
    } catch (error) {
      toast.error("Lỗi: " + error.message);
    }
  };

  const handleCreatePolicy = async () => {
    try {
      await api.post("/hrm/commission-policies", policyFormData);
      toast.success("Tạo chính sách hoa hồng thành công!");
      setIsCreatePolicyDialogOpen(false);
      resetPolicyForm();
      fetchCommissionPolicies();
    } catch (error) {
      toast.error("Lỗi: " + (error.response?.data?.detail || error.message));
    }
  };

  const resetCTVForm = () => {
    setCTVFormData({
      full_name: "",
      phone: "",
      email: "",
      id_number: "",
      address: "",
      bank_name: "",
      bank_account: "",
      bank_branch: "",
      assigned_to_id: "",
      org_unit_id: "",
      commission_policy_id: "",
      notes: "",
    });
  };

  const resetPolicyForm = () => {
    setPolicyFormData({
      name: "",
      code: "",
      type: "tiered",
      description: "",
      tiers: [
        { min_deals: 1, max_deals: 5, rate: 1.0, bonus: 0 },
        { min_deals: 6, max_deals: 10, rate: 1.5, bonus: 500000 },
        { min_deals: 11, max_deals: null, rate: 2.0, bonus: 1000000 },
      ],
      min_deal_value: null,
    });
  };

  const formatMoney = (value) => {
    if (!value) return "0đ";
    return new Intl.NumberFormat("vi-VN").format(value) + "đ";
  };

  const filteredCollaborators = collaborators.filter((ctv) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (
        !ctv.full_name.toLowerCase().includes(query) &&
        !ctv.code.toLowerCase().includes(query) &&
        !ctv.phone.includes(query)
      ) {
        return false;
      }
    }
    return true;
  });

  // Stats
  const stats = {
    total: collaborators.length,
    active: collaborators.filter((c) => c.status === "active").length,
    pending: collaborators.filter((c) => c.status === "pending").length,
    total_deals: collaborators.reduce((sum, c) => sum + (c.total_deals_closed || 0), 0),
    pending_commission: collaborators.reduce((sum, c) => sum + (c.pending_commission || 0), 0),
  };

  return (
    <div className="space-y-6" data-testid="collaborators-page">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cộng tác viên (CTV)</h1>
          <p className="text-gray-500">Quản lý CTV và chính sách hoa hồng</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsCreatePolicyDialogOpen(true)}>
            <FileText className="h-4 w-4 mr-2" />
            Chính sách hoa hồng
          </Button>
          <Button onClick={() => setIsCreateCTVDialogOpen(true)} data-testid="add-ctv-btn">
            <UserPlus className="h-4 w-4 mr-2" />
            Đăng ký CTV
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Tổng CTV</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
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
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Tổng deals</p>
                <p className="text-2xl font-bold">{stats.total_deals}</p>
              </div>
              <Target className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">HH chờ thanh toán</p>
                <p className="text-xl font-bold text-orange-600">{formatMoney(stats.pending_commission)}</p>
              </div>
              <Banknote className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="collaborators">Danh sách CTV</TabsTrigger>
          <TabsTrigger value="policies">Chính sách hoa hồng</TabsTrigger>
          <TabsTrigger value="commissions">Hoa hồng chờ duyệt</TabsTrigger>
        </TabsList>

        {/* Collaborators Tab */}
        <TabsContent value="collaborators" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="py-4">
              <div className="flex gap-4 items-center">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-gray-500" />
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Trạng thái" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả</SelectItem>
                      {Object.entries(CTV_STATUS).map(([key, config]) => (
                        <SelectItem key={key} value={key}>
                          {config.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Tìm kiếm CTV..."
                    className="pl-9"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* CTV Table */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>CTV</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Người quản lý</TableHead>
                    <TableHead className="text-right">Leads</TableHead>
                    <TableHead className="text-right">Deals</TableHead>
                    <TableHead className="text-right">Hoa hồng</TableHead>
                    <TableHead className="text-right">Chờ TT</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">
                        Đang tải...
                      </TableCell>
                    </TableRow>
                  ) : filteredCollaborators.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">
                        Chưa có CTV nào
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredCollaborators.map((ctv) => {
                      const statusConfig = CTV_STATUS[ctv.status] || CTV_STATUS.pending;
                      return (
                        <TableRow key={ctv.id} data-testid={`ctv-row-${ctv.id}`}>
                          <TableCell>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{ctv.full_name}</span>
                                <Badge variant="outline" className="text-xs">
                                  {ctv.code}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-3 text-sm text-gray-500">
                                <span className="flex items-center gap-1">
                                  <Phone className="h-3 w-3" />
                                  {ctv.phone}
                                </span>
                                {ctv.email && (
                                  <span className="flex items-center gap-1">
                                    <Mail className="h-3 w-3" />
                                    {ctv.email}
                                  </span>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={statusConfig.color}>
                              {statusConfig.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {ctv.assigned_to_name || "-"}
                              {ctv.org_unit_name && (
                                <div className="text-xs text-gray-500">{ctv.org_unit_name}</div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {ctv.total_leads_referred}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="font-medium">{ctv.total_deals_closed}</div>
                            {ctv.conversion_rate > 0 && (
                              <div className="text-xs text-green-600">{ctv.conversion_rate.toFixed(1)}%</div>
                            )}
                          </TableCell>
                          <TableCell className="text-right font-medium text-green-600">
                            {formatMoney(ctv.total_commission_earned)}
                          </TableCell>
                          <TableCell className="text-right font-medium text-orange-600">
                            {formatMoney(ctv.pending_commission)}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => {
                                  setSelectedCTV(ctv);
                                  setIsDetailDialogOpen(true);
                                }}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  Xem chi tiết
                                </DropdownMenuItem>
                                {ctv.status === "pending" && (
                                  <DropdownMenuItem onClick={() => {
                                    setSelectedCTV(ctv);
                                    setIsApproveDialogOpen(true);
                                  }}>
                                    <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                                    Duyệt CTV
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Chỉnh sửa
                                </DropdownMenuItem>
                                {ctv.pending_commission > 0 && (
                                  <DropdownMenuItem>
                                    <CreditCard className="h-4 w-4 mr-2 text-blue-500" />
                                    Thanh toán hoa hồng
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Policies Tab */}
        <TabsContent value="policies" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {commissionPolicies.map((policy) => (
              <Card key={policy.id} data-testid={`policy-card-${policy.id}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>{policy.name}</CardTitle>
                      <CardDescription>{policy.description}</CardDescription>
                    </div>
                    <Badge variant="outline">{policy.code}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Tiers */}
                  <div>
                    <Label className="text-sm text-gray-500">Bảng hoa hồng theo tầng</Label>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Số deals</TableHead>
                          <TableHead className="text-right">Tỷ lệ (%)</TableHead>
                          <TableHead className="text-right">Thưởng thêm</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {policy.tiers?.map((tier, idx) => (
                          <TableRow key={idx}>
                            <TableCell>
                              {tier.min_deals} - {tier.max_deals || "∞"} deals
                            </TableCell>
                            <TableCell className="text-right font-medium text-green-600">
                              {tier.rate}%
                            </TableCell>
                            <TableCell className="text-right">
                              {tier.bonus > 0 ? formatMoney(tier.bonus) : "-"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t">
                    <span className="text-sm text-gray-500">
                      {policy.collaborator_count} CTV đang áp dụng
                    </span>
                    <Button variant="outline" size="sm" onClick={() => {
                      setSelectedPolicy(policy);
                      setPolicyFormData(policy);
                      setIsCreatePolicyDialogOpen(true);
                    }}>
                      <Edit className="h-4 w-4 mr-1" />
                      Sửa
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Add Policy Card */}
            <Card
              className="border-2 border-dashed border-gray-300 hover:border-blue-400 cursor-pointer transition-colors"
              onClick={() => { resetPolicyForm(); setIsCreatePolicyDialogOpen(true); }}
            >
              <CardContent className="flex flex-col items-center justify-center h-full py-12">
                <Plus className="h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-600 font-medium">Thêm chính sách mới</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Commissions Tab */}
        <TabsContent value="commissions">
          <Card>
            <CardHeader>
              <CardTitle>Hoa hồng chờ xử lý</CardTitle>
            </CardHeader>
            <CardContent>
              {commissions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Không có hoa hồng chờ xử lý
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>CTV</TableHead>
                      <TableHead>Deal</TableHead>
                      <TableHead className="text-right">Giá trị deal</TableHead>
                      <TableHead className="text-right">Tỷ lệ</TableHead>
                      <TableHead className="text-right">Hoa hồng</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {commissions.map((comm) => (
                      <TableRow key={comm.id}>
                        <TableCell>
                          <div className="font-medium">{comm.collaborator_name}</div>
                          <div className="text-xs text-gray-500">{comm.collaborator_code}</div>
                        </TableCell>
                        <TableCell>{comm.deal_id}</TableCell>
                        <TableCell className="text-right">{formatMoney(comm.deal_value)}</TableCell>
                        <TableCell className="text-right">{comm.commission_rate}%</TableCell>
                        <TableCell className="text-right font-medium text-green-600">
                          {formatMoney(comm.commission_amount)}
                        </TableCell>
                        <TableCell>
                          <Badge className={COMMISSION_STATUS[comm.status]?.color}>
                            {COMMISSION_STATUS[comm.status]?.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {comm.status === "pending" && (
                            <Button size="sm" variant="outline">Duyệt</Button>
                          )}
                          {comm.status === "approved" && (
                            <Button size="sm">Thanh toán</Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create CTV Dialog */}
      <Dialog open={isCreateCTVDialogOpen} onOpenChange={setIsCreateCTVDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Đăng ký Cộng tác viên mới</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Họ và tên *</Label>
                <Input
                  placeholder="Nguyễn Văn A"
                  value={ctvFormData.full_name}
                  onChange={(e) => setCTVFormData({ ...ctvFormData, full_name: e.target.value })}
                />
              </div>
              <div>
                <Label>Số điện thoại *</Label>
                <Input
                  placeholder="0901234567"
                  value={ctvFormData.phone}
                  onChange={(e) => setCTVFormData({ ...ctvFormData, phone: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  placeholder="email@example.com"
                  value={ctvFormData.email}
                  onChange={(e) => setCTVFormData({ ...ctvFormData, email: e.target.value })}
                />
              </div>
              <div>
                <Label>CCCD/CMND</Label>
                <Input
                  placeholder="001234567890"
                  value={ctvFormData.id_number}
                  onChange={(e) => setCTVFormData({ ...ctvFormData, id_number: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label>Địa chỉ</Label>
              <Input
                placeholder="Địa chỉ hiện tại"
                value={ctvFormData.address}
                onChange={(e) => setCTVFormData({ ...ctvFormData, address: e.target.value })}
              />
            </div>

            <div className="border-t pt-4">
              <Label className="text-base font-semibold">Thông tin ngân hàng</Label>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Ngân hàng</Label>
                <Input
                  placeholder="VD: Vietcombank"
                  value={ctvFormData.bank_name}
                  onChange={(e) => setCTVFormData({ ...ctvFormData, bank_name: e.target.value })}
                />
              </div>
              <div>
                <Label>Số tài khoản</Label>
                <Input
                  placeholder="Số tài khoản"
                  value={ctvFormData.bank_account}
                  onChange={(e) => setCTVFormData({ ...ctvFormData, bank_account: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label>Chi nhánh</Label>
              <Input
                placeholder="Chi nhánh ngân hàng"
                value={ctvFormData.bank_branch}
                onChange={(e) => setCTVFormData({ ...ctvFormData, bank_branch: e.target.value })}
              />
            </div>

            <div>
              <Label>Ghi chú</Label>
              <Textarea
                placeholder="Ghi chú thêm..."
                value={ctvFormData.notes}
                onChange={(e) => setCTVFormData({ ...ctvFormData, notes: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateCTVDialogOpen(false)}>
              Hủy
            </Button>
            <Button
              onClick={handleCreateCTV}
              disabled={!ctvFormData.full_name || !ctvFormData.phone}
              data-testid="submit-ctv-btn"
            >
              Đăng ký
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approve CTV Dialog */}
      <Dialog open={isApproveDialogOpen} onOpenChange={setIsApproveDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Duyệt Cộng tác viên</DialogTitle>
          </DialogHeader>
          {selectedCTV && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold">{selectedCTV.full_name}</h4>
                <p className="text-sm text-gray-500">{selectedCTV.phone}</p>
              </div>

              <div>
                <Label>Gán cho nhân viên</Label>
                <Select
                  value={ctvFormData.assigned_to_id}
                  onValueChange={(v) => setCTVFormData({ ...ctvFormData, assigned_to_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn nhân viên quản lý" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Chính sách hoa hồng</Label>
                <Select
                  value={ctvFormData.commission_policy_id}
                  onValueChange={(v) => setCTVFormData({ ...ctvFormData, commission_policy_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn chính sách" />
                  </SelectTrigger>
                  <SelectContent>
                    {commissionPolicies.map((policy) => (
                      <SelectItem key={policy.id} value={policy.id}>
                        {policy.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => handleApproveCTV("rejected")}>
              <XCircle className="h-4 w-4 mr-2" />
              Từ chối
            </Button>
            <Button onClick={() => handleApproveCTV("active")}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Duyệt
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Policy Dialog */}
      <Dialog open={isCreatePolicyDialogOpen} onOpenChange={setIsCreatePolicyDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {selectedPolicy ? "Chỉnh sửa chính sách" : "Tạo chính sách hoa hồng mới"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Tên chính sách *</Label>
                <Input
                  placeholder="VD: Chính sách tiêu chuẩn"
                  value={policyFormData.name}
                  onChange={(e) => setPolicyFormData({ ...policyFormData, name: e.target.value })}
                />
              </div>
              <div>
                <Label>Mã *</Label>
                <Input
                  placeholder="VD: STANDARD"
                  value={policyFormData.code}
                  onChange={(e) => setPolicyFormData({ ...policyFormData, code: e.target.value.toUpperCase() })}
                />
              </div>
            </div>

            <div>
              <Label>Mô tả</Label>
              <Textarea
                placeholder="Mô tả chính sách..."
                value={policyFormData.description}
                onChange={(e) => setPolicyFormData({ ...policyFormData, description: e.target.value })}
              />
            </div>

            <div>
              <Label className="text-base font-semibold">Bảng hoa hồng theo tầng</Label>
              <p className="text-sm text-gray-500 mb-2">Cấu hình tỷ lệ hoa hồng theo số deals chốt</p>
              
              <div className="space-y-2">
                {policyFormData.tiers.map((tier, idx) => (
                  <div key={idx} className="grid grid-cols-4 gap-2 items-center">
                    <Input
                      type="number"
                      placeholder="Từ"
                      value={tier.min_deals}
                      onChange={(e) => {
                        const newTiers = [...policyFormData.tiers];
                        newTiers[idx].min_deals = parseInt(e.target.value) || 0;
                        setPolicyFormData({ ...policyFormData, tiers: newTiers });
                      }}
                    />
                    <Input
                      type="number"
                      placeholder="Đến (∞)"
                      value={tier.max_deals || ""}
                      onChange={(e) => {
                        const newTiers = [...policyFormData.tiers];
                        newTiers[idx].max_deals = e.target.value ? parseInt(e.target.value) : null;
                        setPolicyFormData({ ...policyFormData, tiers: newTiers });
                      }}
                    />
                    <Input
                      type="number"
                      step="0.1"
                      placeholder="% HH"
                      value={tier.rate}
                      onChange={(e) => {
                        const newTiers = [...policyFormData.tiers];
                        newTiers[idx].rate = parseFloat(e.target.value) || 0;
                        setPolicyFormData({ ...policyFormData, tiers: newTiers });
                      }}
                    />
                    <div className="flex gap-1">
                      <Input
                        type="number"
                        placeholder="Thưởng"
                        value={tier.bonus || ""}
                        onChange={(e) => {
                          const newTiers = [...policyFormData.tiers];
                          newTiers[idx].bonus = parseInt(e.target.value) || 0;
                          setPolicyFormData({ ...policyFormData, tiers: newTiers });
                        }}
                      />
                      {policyFormData.tiers.length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-500"
                          onClick={() => {
                            const newTiers = policyFormData.tiers.filter((_, i) => i !== idx);
                            setPolicyFormData({ ...policyFormData, tiers: newTiers });
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => {
                  const lastTier = policyFormData.tiers[policyFormData.tiers.length - 1];
                  setPolicyFormData({
                    ...policyFormData,
                    tiers: [
                      ...policyFormData.tiers,
                      {
                        min_deals: (lastTier?.max_deals || 0) + 1,
                        max_deals: null,
                        rate: (lastTier?.rate || 1) + 0.5,
                        bonus: 0,
                      },
                    ],
                  });
                }}
              >
                <Plus className="h-4 w-4 mr-1" />
                Thêm tầng
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsCreatePolicyDialogOpen(false); resetPolicyForm(); }}>
              Hủy
            </Button>
            <Button
              onClick={handleCreatePolicy}
              disabled={!policyFormData.name || !policyFormData.code}
            >
              {selectedPolicy ? "Cập nhật" : "Tạo mới"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* CTV Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Chi tiết Cộng tác viên</DialogTitle>
          </DialogHeader>
          {selectedCTV && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-lg mb-4">{selectedCTV.full_name}</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{selectedCTV.code}</Badge>
                      <Badge className={CTV_STATUS[selectedCTV.status]?.color}>
                        {CTV_STATUS[selectedCTV.status]?.label}
                      </Badge>
                    </div>
                    <p><strong>SĐT:</strong> {selectedCTV.phone}</p>
                    <p><strong>Email:</strong> {selectedCTV.email || "-"}</p>
                    <p><strong>Ngày tham gia:</strong> {new Date(selectedCTV.join_date).toLocaleDateString("vi-VN")}</p>
                    <p><strong>Quản lý:</strong> {selectedCTV.assigned_to_name || "-"}</p>
                    <p><strong>Chính sách HH:</strong> {selectedCTV.commission_policy_name || "-"}</p>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-4">Thống kê hiệu suất</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <Card>
                      <CardContent className="pt-4">
                        <p className="text-2xl font-bold text-blue-600">{selectedCTV.total_leads_referred}</p>
                        <p className="text-xs text-gray-500">Leads giới thiệu</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4">
                        <p className="text-2xl font-bold text-green-600">{selectedCTV.total_deals_closed}</p>
                        <p className="text-xs text-gray-500">Deals chốt</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4">
                        <p className="text-2xl font-bold text-purple-600">{selectedCTV.conversion_rate?.toFixed(1)}%</p>
                        <p className="text-xs text-gray-500">Tỷ lệ chuyển đổi</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4">
                        <p className="text-xl font-bold text-orange-600">{formatMoney(selectedCTV.pending_commission)}</p>
                        <p className="text-xs text-gray-500">Chờ thanh toán</p>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailDialogOpen(false)}>
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
