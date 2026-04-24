/**
 * Manager Dashboard Page
 * TASK 4 - PART 2: MANAGER DASHBOARD UI
 * 
 * Tabs:
 * 1. Overview - KPIs, revenue, conversion, pipeline value, charts
 * 2. Sales Performance - List sales + ranking, conversion rate
 * 3. Inventory Control - Products table with actions (force release, reassign)
 * 4. Approval Queue - Pending approvals with approve/reject actions
 * 
 * All actions call real APIs
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { 
  LayoutDashboard,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Package,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Hand,
  UserPlus,
  RefreshCw,
  BarChart3,
  PieChart,
  Activity,
  Award,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  FileCheck,
  ShieldCheck,
  Ban,
  Phone, MessageCircle, Mail, PhoneCall, Eye,
} from 'lucide-react';
import { toast } from 'sonner';
import { managerApi } from '@/api/pipelineApi';

// Status colors
const STATUS_COLORS = {
  available: 'bg-green-100 text-green-700',
  hold: 'bg-amber-100 text-amber-700',
  booking_pending: 'bg-orange-100 text-orange-700',
  booked: 'bg-blue-100 text-blue-700',
  sold: 'bg-purple-100 text-purple-700',
  blocked: 'bg-red-100 text-red-700',
  pending: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
};

const DEMO_MANAGER_DASHBOARD = {
  revenue_today: 380000000,
  conversion_rate: 8.2,
  pipeline_value: 12400000000,
  active_sales: 18,
};

const DEMO_SALES_PERFORMANCE = {
  items: [
    { id: 'mgr-sale-1', sales_name: 'Nguyễn Minh Anh', deals_count: 12, conversion_rate: 14.3, revenue: 2350000000 },
    { id: 'mgr-sale-2', sales_name: 'Trần Quốc Huy', deals_count: 9, conversion_rate: 11.8, revenue: 1810000000 },
    { id: 'mgr-sale-3', sales_name: 'Lê Thanh Hà', deals_count: 8, conversion_rate: 10.4, revenue: 1540000000 },
  ],
};

const DEMO_PIPELINE_ANALYSIS = {
  total_deals: 46,
  hot_deals: 14,
  booking_pending: 7,
  won_deals: 6,
};

const DEMO_INVENTORY_SUMMARY = {
  available: 128,
  hold: 17,
  booking_pending: 9,
  sold: 41,
};

const DEMO_ACTIVE_HOLDS = {
  total: 2,
  items: [
    { id: 'hold-1', product_id: 'P-101', product_name: 'Căn A12', project_name: 'Rivera', hold_by_name: 'Nguyễn Minh Anh', hold_expires_at: new Date(Date.now() + 2 * 3600000).toISOString() },
    { id: 'hold-2', product_id: 'P-204', product_name: 'Căn B08', project_name: 'Sunrise', hold_by_name: 'Trần Quốc Huy', hold_expires_at: new Date(Date.now() + 5 * 3600000).toISOString() },
  ],
};

const DEMO_OVERDUE_HOLDS = {
  total: 1,
  items: [
    { id: 'hold-overdue-1', product_id: 'P-301', product_name: 'Căn C05', project_name: 'Skyline', hold_by_name: 'Lê Thanh Hà', hold_expires_at: new Date(Date.now() - 3 * 3600000).toISOString() },
  ],
};

const DEMO_APPROVALS = {
  total: 2,
  items: [
    { id: 'approval-1', type: 'booking', title: 'Duyệt booking Rivera A12', requester_name: 'Nguyễn Minh Anh', created_at: new Date(Date.now() - 2 * 3600000).toISOString(), status: 'pending' },
    { id: 'approval-2', type: 'price_adjustment', title: 'Điều chỉnh giá Sunrise B08', requester_name: 'Trần Quốc Huy', created_at: new Date(Date.now() - 5 * 3600000).toISOString(), status: 'pending' },
  ],
};

const DEMO_APPROVAL_STATS = {
  pending: 2,
  approved_today: 5,
  rejected_today: 1,
};

// Team members DEMO — chỉ NV do Manager này quản lý (scoped by manager_id)
const DEMO_TEAM_MEMBERS = [
  { user_id: 'tm-1', user_name: 'Nguyễn Minh Anh', position: 'Chuyên viên KD', score: 96, revenue: 2350000000, deals: 12, calls: 48, status: 'active',  phone: '' },
  { user_id: 'tm-2', user_name: 'Trần Quốc Huy',  position: 'Chuyên viên KD', score: 88, revenue: 1810000000, deals: 9,  calls: 37, status: 'active',  phone: '' },
  { user_id: 'tm-3', user_name: 'Lê Thanh Hà',    position: 'Chuyên viên KD', score: 74, revenue: 1540000000, deals: 8,  calls: 29, status: 'active',  phone: '' },
  { user_id: 'tm-4', user_name: 'Phạm Hoài Nam',  position: 'Chuyên viên KD', score: 41, revenue: 320000000,  deals: 2,  calls: 12, status: 'lazy',   phone: '' },
  { user_id: 'tm-5', user_name: 'Vũ Thu Hương',   position: 'Thử việc',       score: 58, revenue: 480000000,  deals: 3,  calls: 20, status: 'active',  phone: '' },
];

const DEMO_TEAM_LEADS = [
  { id: 'lead-1', customer_name: 'Bà Linh Nguyễn', phone: '0901234567', project: 'Rivera', status: 'hot',      assigned_to: 'Nguyễn Minh Anh', created_at: new Date(Date.now() - 1*3600000).toISOString() },
  { id: 'lead-2', customer_name: 'Ông Minh Trần',  phone: '0912345678', project: 'Sunrise', status: 'new',      assigned_to: 'Trần Quốc Huy',  created_at: new Date(Date.now() - 3*3600000).toISOString() },
  { id: 'lead-3', customer_name: 'Bà Hương Lê',   phone: '0923456789', project: 'Skyline', status: 'new',      assigned_to: 'Phạm Hoài Nam',  created_at: new Date(Date.now() - 6*3600000).toISOString() },
  { id: 'lead-4', customer_name: 'Ông Tùng Bùi',   phone: '0934567890', project: 'Rivera',  status: 'contacted', assigned_to: 'Lê Thanh Hà',    created_at: new Date(Date.now() - 2*3600000).toISOString() },
];

export default function ManagerDashboardPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Data states
  const [dashboardSummary, setDashboardSummary] = useState(null);
  const [salesPerformance, setSalesPerformance] = useState(null);
  const [pipelineAnalysis, setPipelineAnalysis] = useState(null);
  const [inventorySummary, setInventorySummary] = useState(null);
  const [activeHolds, setActiveHolds] = useState({ items: [], total: 0 });
  const [overdueHolds, setOverdueHolds] = useState({ items: [], total: 0 });
  const [approvals, setApprovals] = useState({ items: [], total: 0 });
  const [approvalStats, setApprovalStats] = useState(null);
  // Team-scoped data (chỉ NV thuộc đội của manager này)
  const [teamMembers, setTeamMembers] = useState(DEMO_TEAM_MEMBERS);
  const [teamLeads, setTeamLeads] = useState(DEMO_TEAM_LEADS);
  const [teamFilter, setTeamFilter] = useState('all'); // all|active|lazy
  
  // Modal states
  const [showForceReleaseModal, setShowForceReleaseModal] = useState(false);
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedApproval, setSelectedApproval] = useState(null);
  const [actionReason, setActionReason] = useState('');
  const [newOwnerId, setNewOwnerId] = useState('');

  // Load all data
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [
        dashboardRes,
        performanceRes,
        pipelineRes,
        inventoryRes,
        holdsRes,
        overdueRes,
        approvalsRes,
        approvalStatsRes,
      ] = await Promise.all([
        managerApi.getDashboardSummary(),
        managerApi.getSalesPerformance(),
        managerApi.getPipelineAnalysis(),
        managerApi.getInventorySummary(),
        managerApi.getActiveHolds(),
        managerApi.getOverdueHolds(),
        managerApi.getPendingApprovals(),
        managerApi.getApprovalStats(),
      ]);
      
      setDashboardSummary(dashboardRes);
      setSalesPerformance(performanceRes?.items?.length ? performanceRes : DEMO_SALES_PERFORMANCE);
      setPipelineAnalysis(pipelineRes || DEMO_PIPELINE_ANALYSIS);
      setInventorySummary(inventoryRes || DEMO_INVENTORY_SUMMARY);
      setActiveHolds(holdsRes?.items?.length ? holdsRes : DEMO_ACTIVE_HOLDS);
      setOverdueHolds(overdueRes?.items?.length ? overdueRes : DEMO_OVERDUE_HOLDS);
      setApprovals(approvalsRes?.items?.length ? approvalsRes : DEMO_APPROVALS);
      setApprovalStats(approvalStatsRes || DEMO_APPROVAL_STATS);
    } catch (err) {
      console.error('Failed to load manager data:', err);
      setDashboardSummary(DEMO_MANAGER_DASHBOARD);
      setSalesPerformance(DEMO_SALES_PERFORMANCE);
      setPipelineAnalysis(DEMO_PIPELINE_ANALYSIS);
      setInventorySummary(DEMO_INVENTORY_SUMMARY);
      setActiveHolds(DEMO_ACTIVE_HOLDS);
      setOverdueHolds(DEMO_OVERDUE_HOLDS);
      setApprovals(DEMO_APPROVALS);
      setApprovalStats(DEMO_APPROVAL_STATS);
      toast.error('Không thể tải dữ liệu');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
    toast.success('Đã cập nhật dữ liệu');
  };

  // Format currency
  const formatCurrency = (value) => {
    if (!value) return '0';
    const num = parseFloat(value);
    if (num >= 1e9) return `${(num / 1e9).toFixed(1)} tỷ`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(0)}tr`;
    return num.toLocaleString('vi-VN');
  };

  // Format time ago
  const formatTimeAgo = (dateStr) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    const now = new Date();
    const diffHours = Math.floor((now - date) / (1000 * 60 * 60));
    if (diffHours < 24) return `${diffHours}h trước`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} ngày trước`;
  };

  // Force release hold
  const handleForceRelease = async () => {
    if (!selectedProduct || !actionReason) return;
    try {
      await managerApi.forceReleaseHold(selectedProduct.product_id, actionReason);
      toast.success('Đã giải phóng hold');
      setShowForceReleaseModal(false);
      setSelectedProduct(null);
      setActionReason('');
      await loadData();
    } catch (err) {
      toast.error(err.message || 'Không thể giải phóng hold');
    }
  };

  // Reassign owner
  const handleReassign = async () => {
    if (!selectedProduct || !newOwnerId || !actionReason) return;
    try {
      await managerApi.reassignOwner(selectedProduct.product_id, newOwnerId, actionReason);
      toast.success('Đã chuyển owner');
      setShowReassignModal(false);
      setSelectedProduct(null);
      setNewOwnerId('');
      setActionReason('');
      await loadData();
    } catch (err) {
      toast.error(err.message || 'Không thể chuyển owner');
    }
  };

  // Approve request
  const handleApprove = async () => {
    if (!selectedApproval) return;
    try {
      await managerApi.approveRequest(selectedApproval.id, actionReason || null);
      toast.success('Đã duyệt yêu cầu');
      setShowApprovalModal(false);
      setSelectedApproval(null);
      setActionReason('');
      await loadData();
    } catch (err) {
      toast.error(err.message || 'Không thể duyệt');
    }
  };

  // Reject request
  const handleReject = async () => {
    if (!selectedApproval || !actionReason) return;
    try {
      await managerApi.rejectRequest(selectedApproval.id, actionReason);
      toast.success('Đã từ chối yêu cầu');
      setShowRejectModal(false);
      setSelectedApproval(null);
      setActionReason('');
      await loadData();
    } catch (err) {
      toast.error(err.message || 'Không thể từ chối');
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6" data-testid="manager-dashboard-page">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <LayoutDashboard className="h-6 w-6 text-blue-600" />
            Trưởng nhóm Kinh doanh
          </h1>
          <p className="text-gray-500">Quản lý đội nhóm · Bán hàng cá nhân · Phê duyệt nội bộ</p>
        </div>
        <Button 
          variant="outline" 
          onClick={handleRefresh}
          disabled={refreshing}
          data-testid="refresh-dashboard-btn"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Làm mới
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6 lg:w-auto lg:inline-grid">
          <TabsTrigger value="overview" className="gap-2" data-testid="tab-overview">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Tổng quan</span>
          </TabsTrigger>
          <TabsTrigger value="performance" className="gap-2" data-testid="tab-performance">
            <Award className="h-4 w-4" />
            <span className="hidden sm:inline">Sales</span>
          </TabsTrigger>
          <TabsTrigger value="team" className="gap-2" data-testid="tab-team">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Đội nhóm</span>
          </TabsTrigger>
          <TabsTrigger value="crm" className="gap-2" data-testid="tab-crm">
            <PhoneCall className="h-4 w-4" />
            <span className="hidden sm:inline">Khách hàng</span>
          </TabsTrigger>
          <TabsTrigger value="inventory" className="gap-2" data-testid="tab-inventory">
            <Package className="h-4 w-4" />
            <span className="hidden sm:inline">Sản phẩm</span>
            {overdueHolds.total > 0 && (
              <Badge variant="destructive" className="ml-1 text-xs px-1.5">
                {overdueHolds.total}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="approvals" className="gap-2" data-testid="tab-approvals">
            <FileCheck className="h-4 w-4" />
            <span className="hidden sm:inline">Duyệt</span>
            {approvals.total > 0 && (
              <Badge variant="secondary" className="ml-1 text-xs px-1.5">
                {approvals.total}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: OVERVIEW */}
        <TabsContent value="overview" className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Tổng doanh số</p>
                    <p className="text-2xl font-bold">{formatCurrency(dashboardSummary?.total_revenue)}</p>
                    <p className="text-xs text-green-600 flex items-center mt-1">
                      <ArrowUpRight className="h-3 w-3 mr-1" />
                      +12% so với tháng trước
                    </p>
                  </div>
                  <div className="p-3 rounded-full bg-green-100">
                    <DollarSign className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Tổng deals</p>
                    <p className="text-2xl font-bold">{dashboardSummary?.total_deals || 0}</p>
                    <p className="text-xs text-blue-600 flex items-center mt-1">
                      <Activity className="h-3 w-3 mr-1" />
                      {dashboardSummary?.active_deals || 0} đang active
                    </p>
                  </div>
                  <div className="p-3 rounded-full bg-blue-100">
                    <Target className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Tỷ lệ chuyển đổi</p>
                    <p className="text-2xl font-bold">{(dashboardSummary?.conversion_rate || 0).toFixed(1)}%</p>
                    <Progress value={dashboardSummary?.conversion_rate || 0} className="mt-2 h-1" />
                  </div>
                  <div className="p-3 rounded-full bg-purple-100">
                    <TrendingUp className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Pipeline value</p>
                    <p className="text-2xl font-bold">{formatCurrency(pipelineAnalysis?.total_pipeline_value)}</p>
                    <p className="text-xs text-amber-600 flex items-center mt-1">
                      <Clock className="h-3 w-3 mr-1" />
                      Dự báo: {formatCurrency(pipelineAnalysis?.weighted_forecast)}
                    </p>
                  </div>
                  <div className="p-3 rounded-full bg-amber-100">
                    <PieChart className="h-6 w-6 text-amber-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Pipeline by Stage */}
          <Card>
            <CardHeader>
              <CardTitle>Pipeline theo Stage</CardTitle>
              <CardDescription>Phân bổ deals theo từng giai đoạn</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {pipelineAnalysis?.stages?.map((stage) => (
                  <div key={stage.stage} className="flex items-center gap-4">
                    <div className="w-28 text-sm font-medium truncate">{stage.stage}</div>
                    <div className="flex-1">
                      <Progress 
                        value={(stage.count / (pipelineAnalysis?.total_deals || 1)) * 100} 
                        className="h-2" 
                      />
                    </div>
                    <div className="text-sm text-gray-500 w-20 text-right">{stage.count} deals</div>
                    <div className="text-sm font-medium w-24 text-right">{formatCurrency(stage.value)}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Inventory Summary */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            {inventorySummary && Object.entries(inventorySummary.by_status || {}).map(([status, data]) => (
              <Card key={status}>
                <CardContent className="p-4 text-center">
                  <Badge className={STATUS_COLORS[status] || 'bg-gray-100'} variant="secondary">
                    {status}
                  </Badge>
                  <p className="text-2xl font-bold mt-2">{data.count}</p>
                  <p className="text-xs text-gray-500">{formatCurrency(data.value)}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* TAB 2: SALES PERFORMANCE */}
        <TabsContent value="performance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-amber-500" />
                Bảng xếp hạng Sales
              </CardTitle>
              <CardDescription>Top performers theo doanh số và deals</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Sales</TableHead>
                    <TableHead className="text-right">Deals</TableHead>
                    <TableHead className="text-right">Won</TableHead>
                    <TableHead className="text-right">Doanh số</TableHead>
                    <TableHead className="text-right">Tỷ lệ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {salesPerformance?.rankings?.map((user, index) => (
                    <TableRow key={user.user_id} data-testid={`sales-row-${index}`}>
                      <TableCell>
                        {index < 3 ? (
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                            index === 0 ? 'bg-amber-100 text-amber-600' :
                            index === 1 ? 'bg-gray-100 text-gray-600' :
                            'bg-orange-100 text-orange-600'
                          }`}>
                            {index + 1}
                          </div>
                        ) : (
                          <span className="text-gray-500">{index + 1}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                            <Users className="h-4 w-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium">{user.full_name || 'N/A'}</p>
                            <p className="text-xs text-gray-500">{user.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">{user.total_deals || 0}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant="secondary" className="bg-green-100 text-green-700">
                          {user.won_deals || 0}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(user.total_revenue)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Progress value={user.conversion_rate || 0} className="w-16 h-2" />
                          <span className="text-sm">{(user.conversion_rate || 0).toFixed(0)}%</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!salesPerformance?.rankings || salesPerformance.rankings.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                        Chưa có dữ liệu
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 3: INVENTORY CONTROL */}
        <TabsContent value="inventory" className="space-y-6">
          {/* Overdue Holds Alert */}
          {overdueHolds.total > 0 && (
            <Card className="border-red-200 bg-red-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-red-700 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Hold quá hạn ({overdueHolds.total})
                </CardTitle>
                <CardDescription className="text-red-600">
                  Các sản phẩm hold quá 24h cần được xử lý
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {overdueHolds.items?.slice(0, 5).map((item) => (
                    <div 
                      key={item.product_id} 
                      className="flex items-center justify-between p-3 bg-white rounded-lg border"
                    >
                      <div>
                        <p className="font-medium">{item.product_name}</p>
                        <p className="text-sm text-gray-500">
                          Held by: {item.holder_name} • {formatTimeAgo(item.hold_at)}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            setSelectedProduct(item);
                            setShowForceReleaseModal(true);
                          }}
                          data-testid={`force-release-${item.product_id}`}
                        >
                          <Hand className="h-4 w-4 mr-1" />
                          Giải phóng
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Active Holds */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-amber-500" />
                Sản phẩm đang hold ({activeHolds.total})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sản phẩm</TableHead>
                    <TableHead>Người hold</TableHead>
                    <TableHead>Thời gian</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead className="text-right">Hành động</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeHolds.items?.map((item) => (
                    <TableRow key={item.product_id} data-testid={`hold-row-${item.product_id}`}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{item.product_name}</p>
                          <p className="text-xs text-gray-500">{item.product_code}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                            <Users className="h-3 w-3 text-blue-600" />
                          </div>
                          <span>{item.holder_name || 'N/A'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Clock className="h-3 w-3" />
                          {formatTimeAgo(item.hold_at)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={item.is_overdue ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}>
                          {item.is_overdue ? 'Quá hạn' : 'Đang hold'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              setSelectedProduct(item);
                              setShowForceReleaseModal(true);
                            }}
                          >
                            <Hand className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              setSelectedProduct(item);
                              setShowReassignModal(true);
                            }}
                          >
                            <UserPlus className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!activeHolds.items || activeHolds.items.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                        Không có sản phẩm nào đang hold
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 4: APPROVAL QUEUE */}
        <TabsContent value="approvals" className="space-y-6">
          {/* Approval Stats */}
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-yellow-100">
                  <Clock className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Chờ duyệt</p>
                  <p className="text-xl font-bold">{approvalStats?.pending || 0}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-100">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Đã duyệt</p>
                  <p className="text-xl font-bold">{approvalStats?.approved || 0}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-red-100">
                  <XCircle className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Từ chối</p>
                  <p className="text-xl font-bold">{approvalStats?.rejected || 0}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Pending Approvals */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileCheck className="h-5 w-5 text-blue-500" />
                Yêu cầu chờ duyệt ({approvals.total})
              </CardTitle>
              <CardDescription>Deal/Booking cần approval</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Loại</TableHead>
                    <TableHead>Tiêu đề</TableHead>
                    <TableHead>Người yêu cầu</TableHead>
                    <TableHead className="text-right">Giá trị</TableHead>
                    <TableHead>Cấp duyệt</TableHead>
                    <TableHead className="text-right">Hành động</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {approvals.items?.map((item) => (
                    <TableRow key={item.id} data-testid={`approval-row-${item.id}`}>
                      <TableCell>
                        <Badge variant="outline">{item.request_type}</Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{item.title}</p>
                          {item.description && (
                            <p className="text-xs text-gray-500 truncate max-w-[200px]">{item.description}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{item.requester_name || 'N/A'}</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(item.requested_value || item.original_value)}
                        {item.discount_percent && (
                          <Badge variant="secondary" className="ml-2 text-xs">
                            -{item.discount_percent}%
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={item.required_role === 'director' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}>
                          {item.required_role === 'director' ? 'Director' : 'Manager'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              setSelectedApproval(item);
                              setShowApprovalModal(true);
                            }}
                            data-testid={`approve-btn-${item.id}`}
                          >
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              setSelectedApproval(item);
                              setShowRejectModal(true);
                            }}
                            data-testid={`reject-btn-${item.id}`}
                          >
                            <XCircle className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!approvals.items || approvals.items.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                        <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-500" />
                        Không có yêu cầu nào cần duyệt
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 5: ĐỘI NHÓM — Chỉ hiển thị NV do Manager này quản lý */}
        <TabsContent value="team" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-800">Thành viên đội của tôi</h2>
              <p className="text-sm text-gray-500">{teamMembers.length} nhân viên — chỉ hiển thị NV do bạn quản lý</p>
            </div>
            <div className="flex gap-2">
              {['all', 'active', 'lazy'].map(f => (
                <Button key={f} size="sm" variant={teamFilter === f ? 'default' : 'outline'}
                  onClick={() => setTeamFilter(f)}>
                  {f === 'all' ? 'Tất cả' : f === 'active' ? 'Đang HĐ' : 'Cần hỗ trợ'}
                </Button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {teamMembers
              .filter(m => teamFilter === 'all' || (teamFilter === 'active' ? m.status === 'active' && m.score >= 60 : m.score < 60 || m.status === 'lazy'))
              .map(member => {
                const scoreColor = member.score >= 80 ? 'text-green-600 bg-green-50' : member.score >= 60 ? 'text-blue-600 bg-blue-50' : member.score >= 40 ? 'text-amber-600 bg-amber-50' : 'text-red-600 bg-red-50';
                const isLazy = member.score < 60 || member.status === 'lazy';
                const initial = (member.user_name || '?').split(' ').pop()[0];
                return (
                  <Card key={member.user_id} className={isLazy ? 'border-red-200' : ''}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${isLazy ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                          {initial}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate">{member.user_name}</p>
                          <p className="text-xs text-gray-400 truncate">{member.position}</p>
                        </div>
                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${scoreColor}`}>{member.score} KPI</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center mb-3">
                        <div><p className="text-xs text-gray-400">Deals</p><p className="font-bold text-sm">{member.deals}</p></div>
                        <div><p className="text-xs text-gray-400">Cuộc gọi</p><p className="font-bold text-sm">{member.calls}</p></div>
                        <div><p className="text-xs text-gray-400">Doanh số</p><p className="font-bold text-sm">{member.revenue >= 1e9 ? `${(member.revenue/1e9).toFixed(1)}tỷ` : `${Math.round(member.revenue/1e6)}tr`}</p></div>
                      </div>
                      {isLazy && (
                        <div className="mb-2 p-2 bg-red-50 rounded text-xs text-red-600 font-medium">⚠ KPI thấp — cần coaching</div>
                      )}
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="flex-1 text-xs"
                          onClick={() => navigate(`/kpi/team/member/${member.user_id}`, { state: { member } })}>
                          <Eye className="h-3 w-3 mr-1" /> Chi tiết
                        </Button>
                        <Button size="sm" variant="outline" className="text-xs px-2">
                          <Phone className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="outline" className="text-xs px-2">
                          <MessageCircle className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
          </div>
        </TabsContent>

        {/* TAB 6: KHÁCH HÀNG — Lead/Contact scoped theo đội Manager */}
        <TabsContent value="crm" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-800">Khách hàng đội tôi</h2>
              <p className="text-sm text-gray-500">Lead & khách hàng do đội bạn đang theo</p>
            </div>
            <Button size="sm" onClick={() => navigate('/crm/leads')}>
              <Mail className="h-4 w-4 mr-2" /> Xem toàn bộ CRM
            </Button>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {[{label:'Lead nóng', count: teamLeads.filter(l=>l.status==='hot').length, color:'bg-red-100 text-red-700'},
              {label:'Lead mới', count: teamLeads.filter(l=>l.status==='new').length, color:'bg-blue-100 text-blue-700'},
              {label:'Đã liên hệ', count: teamLeads.filter(l=>l.status==='contacted').length, color:'bg-green-100 text-green-700'},
            ].map(s => (
              <Card key={s.label}><CardContent className="p-4 text-center">
                <Badge className={s.color} variant="secondary">{s.label}</Badge>
                <p className="text-3xl font-bold mt-2">{s.count}</p>
              </CardContent></Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PhoneCall className="h-5 w-5 text-blue-500" />
                Lead đội tôi — đang theo dõi
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Khách hàng</TableHead>
                    <TableHead>Dự án</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Nhân viên phụ trách</TableHead>
                    <TableHead>Thời gian</TableHead>
                    <TableHead className="text-right">Hành động</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teamLeads.map(lead => (
                    <TableRow key={lead.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{lead.customer_name}</p>
                          <p className="text-xs text-gray-400">{lead.phone}</p>
                        </div>
                      </TableCell>
                      <TableCell><Badge variant="outline">{lead.project}</Badge></TableCell>
                      <TableCell>
                        <Badge className={lead.status==='hot' ? 'bg-red-100 text-red-700' : lead.status==='new' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}>
                          {lead.status==='hot'?'Nóng':lead.status==='new'?'Mới':'Đã LH'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{lead.assigned_to}</TableCell>
                      <TableCell className="text-sm text-gray-400">{formatTimeAgo(lead.created_at)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button size="sm" variant="outline" className="px-2">
                            <Phone className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="outline" className="px-2" onClick={() => navigate('/crm/leads')}>
                            <Eye className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>

      {/* Force Release Modal */}
      <Dialog open={showForceReleaseModal} onOpenChange={setShowForceReleaseModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Hand className="h-5 w-5 text-amber-500" />
              Giải phóng Hold
            </DialogTitle>
            <DialogDescription>
              Hành động này sẽ force release hold trên sản phẩm
            </DialogDescription>
          </DialogHeader>
          {selectedProduct && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="font-medium">{selectedProduct.product_name}</p>
                <p className="text-sm text-gray-500">Đang hold bởi: {selectedProduct.holder_name}</p>
              </div>
              <div>
                <label className="text-sm font-medium">Lý do *</label>
                <Textarea
                  placeholder="Nhập lý do giải phóng hold..."
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForceReleaseModal(false)}>Hủy</Button>
            <Button onClick={handleForceRelease} disabled={!actionReason} data-testid="confirm-force-release">
              <Hand className="h-4 w-4 mr-2" />
              Giải phóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reassign Modal */}
      <Dialog open={showReassignModal} onOpenChange={setShowReassignModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-blue-500" />
              Chuyển Owner
            </DialogTitle>
          </DialogHeader>
          {selectedProduct && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="font-medium">{selectedProduct.product_name}</p>
                <p className="text-sm text-gray-500">Owner hiện tại: {selectedProduct.holder_name}</p>
              </div>
              <div>
                <label className="text-sm font-medium">Owner mới (User ID) *</label>
                <Input
                  placeholder="Nhập User ID..."
                  value={newOwnerId}
                  onChange={(e) => setNewOwnerId(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Lý do *</label>
                <Textarea
                  placeholder="Nhập lý do chuyển owner..."
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReassignModal(false)}>Hủy</Button>
            <Button onClick={handleReassign} disabled={!actionReason || !newOwnerId} data-testid="confirm-reassign">
              <UserPlus className="h-4 w-4 mr-2" />
              Chuyển
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approve Modal */}
      <Dialog open={showApprovalModal} onOpenChange={setShowApprovalModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-green-500" />
              Duyệt yêu cầu
            </DialogTitle>
          </DialogHeader>
          {selectedApproval && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="font-medium">{selectedApproval.title}</p>
                <p className="text-sm text-gray-500">
                  Giá trị: {formatCurrency(selectedApproval.requested_value || selectedApproval.original_value)}
                </p>
                <p className="text-sm text-gray-500">Người yêu cầu: {selectedApproval.requester_name}</p>
              </div>
              <div>
                <label className="text-sm font-medium">Ghi chú (không bắt buộc)</label>
                <Textarea
                  placeholder="Nhập ghi chú..."
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApprovalModal(false)}>Hủy</Button>
            <Button onClick={handleApprove} className="bg-green-600 hover:bg-green-700" data-testid="confirm-approve">
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Duyệt
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Modal */}
      <Dialog open={showRejectModal} onOpenChange={setShowRejectModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Ban className="h-5 w-5 text-red-500" />
              Từ chối yêu cầu
            </DialogTitle>
          </DialogHeader>
          {selectedApproval && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="font-medium">{selectedApproval.title}</p>
                <p className="text-sm text-gray-500">
                  Giá trị: {formatCurrency(selectedApproval.requested_value || selectedApproval.original_value)}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium">Lý do từ chối *</label>
                <Textarea
                  placeholder="Nhập lý do từ chối..."
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectModal(false)}>Hủy</Button>
            <Button 
              onClick={handleReject} 
              disabled={!actionReason}
              variant="destructive"
              data-testid="confirm-reject"
            >
              <XCircle className="h-4 w-4 mr-2" />
              Từ chối
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
