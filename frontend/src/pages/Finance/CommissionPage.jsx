import React, { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Plus,
  Coins,
  Users,
  TrendingUp,
  Calendar,
  RefreshCw,
  CheckCircle2,
  Clock,
  Wallet,
  Award,
  Building2,
  User,
  Percent,
  DollarSign,
  Eye,
} from 'lucide-react';
import { toast } from 'sonner';

const statusLabels = {
  pending: { label: 'Chờ duyệt', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  approved: { label: 'Đã duyệt', color: 'bg-blue-100 text-blue-700', icon: CheckCircle2 },
  paid: { label: 'Đã chi trả', color: 'bg-green-100 text-green-700', icon: Wallet },
  cancelled: { label: 'Đã huỷ', color: 'bg-red-100 text-red-700', icon: null },
  on_hold: { label: 'Tạm giữ', color: 'bg-orange-100 text-orange-700', icon: null },
};

const recipientTypeLabels = {
  employee: 'Nhân viên',
  collaborator: 'Cộng tác viên',
};

// Commission rate by position
const commissionPolicies = [
  { position: 'Agent', rate: 30, description: 'Nhân viên kinh doanh' },
  { position: 'Team Lead', rate: 5, description: 'Trưởng nhóm (trên doanh số team)' },
  { position: 'Manager', rate: 3, description: 'Quản lý (trên doanh số chi nhánh)' },
  { position: 'CTV Level 1', rate: 25, description: 'CTV trực tiếp giới thiệu' },
  { position: 'CTV Level 2', rate: 5, description: 'CTV cấp trên (referrer)' },
];

// Commission by property type
const propertyCommissionRates = [
  { type: 'apartment', name: 'Căn hộ', rate: 2.0 },
  { type: 'land', name: 'Đất nền', rate: 1.5 },
  { type: 'villa', name: 'Biệt thự', rate: 2.5 },
  { type: 'townhouse', name: 'Nhà phố', rate: 2.0 },
  { type: 'commercial', name: 'Thương mại', rate: 3.0 },
];

const DEMO_COMMISSIONS = [
  { id: 'commission-1', deal_id: 'DEAL-102', recipient_id: 'EMP-201', recipient_name: 'Nguyễn Minh Quân', recipient_type: 'employee', commission_amount: 38000000, commission_rate: 1.0, deal_value: 3800000000, status: 'pending', created_at: '2026-03-23', project_name: 'The Privé Residence' },
  { id: 'commission-2', deal_id: 'DEAL-099', recipient_id: 'CTV-018', recipient_name: 'Lê Mỹ An', recipient_type: 'collaborator', commission_amount: 12500000, commission_rate: 0.5, deal_value: 2500000000, status: 'approved', created_at: '2026-03-21', project_name: 'Glory Heights' },
  { id: 'commission-3', deal_id: 'DEAL-087', recipient_id: 'EMP-115', recipient_name: 'Trần Gia Bảo', recipient_type: 'employee', commission_amount: 42000000, commission_rate: 1.2, deal_value: 3500000000, status: 'paid', created_at: '2026-03-18', project_name: 'Masteri Lumière' },
];

export default function CommissionPage() {
  const [commissions, setCommissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [filters, setFilters] = useState({
    status: 'all',
    recipient_type: 'all',
  });

  const [formData, setFormData] = useState({
    deal_id: '',
    recipient_id: '',
    recipient_type: 'employee',
    deal_value: '',
    commission_rate: '',
    commission_amount: '',
    notes: '',
  });

  const fetchCommissions = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.status && filters.status !== 'all') params.append('status', filters.status);
      if (filters.recipient_type && filters.recipient_type !== 'all') params.append('recipient_type', filters.recipient_type);

      const res = await api.get(`/finance/commissions?${params.toString()}`);
      const items = res.data || [];
      setCommissions(items.length > 0 ? items : DEMO_COMMISSIONS.filter((item) => {
        const matchStatus = filters.status === 'all' || item.status === filters.status;
        const matchRecipient = filters.recipient_type === 'all' || item.recipient_type === filters.recipient_type;
        return matchStatus && matchRecipient;
      }));
    } catch (error) {
      console.error('Error fetching commissions:', error);
      toast.warning('Đang hiển thị dữ liệu mẫu cho hoa hồng');
      setCommissions(DEMO_COMMISSIONS.filter((item) => {
        const matchStatus = filters.status === 'all' || item.status === filters.status;
        const matchRecipient = filters.recipient_type === 'all' || item.recipient_type === filters.recipient_type;
        return matchStatus && matchRecipient;
      }));
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchCommissions();
  }, [fetchCommissions]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const commission_amount = (parseFloat(formData.deal_value) * parseFloat(formData.commission_rate)) / 100;
      await api.post('/finance/commissions', {
        ...formData,
        deal_value: parseFloat(formData.deal_value),
        commission_rate: parseFloat(formData.commission_rate),
        commission_amount,
      });
      toast.success('Đã tạo hoa hồng');
      setShowDialog(false);
      resetForm();
      fetchCommissions();
    } catch (error) {
      console.error('Error creating commission:', error);
      toast.error('Không thể tạo hoa hồng');
    }
  };

  const resetForm = () => {
    setFormData({
      deal_id: '',
      recipient_id: '',
      recipient_type: 'employee',
      deal_value: '',
      commission_rate: '',
      commission_amount: '',
      notes: '',
    });
  };

  const handleApprove = async (commissionId) => {
    try {
      await api.put(`/finance/commissions/${commissionId}/approve`);
      toast.success('Đã duyệt hoa hồng');
      fetchCommissions();
    } catch (error) {
      console.error('Error approving commission:', error);
      toast.error('Không thể duyệt hoa hồng');
    }
  };

  const handlePay = async (commissionId) => {
    try {
      await api.put(`/finance/commissions/${commissionId}/pay`);
      toast.success('Đã chi trả hoa hồng');
      fetchCommissions();
    } catch (error) {
      console.error('Error paying commission:', error);
      toast.error('Không thể chi trả hoa hồng');
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value || 0);
  };

  const totalPending = commissions.filter(c => c.status === 'pending').reduce((sum, c) => sum + (c.commission_amount || 0), 0);
  const totalApproved = commissions.filter(c => c.status === 'approved').reduce((sum, c) => sum + (c.commission_amount || 0), 0);
  const totalPaid = commissions.filter(c => c.status === 'paid').reduce((sum, c) => sum + (c.commission_amount || 0), 0);

  const calculateCommission = () => {
    if (formData.deal_value && formData.commission_rate) {
      const amount = (parseFloat(formData.deal_value) * parseFloat(formData.commission_rate)) / 100;
      setFormData({ ...formData, commission_amount: amount.toString() });
    }
  };

  return (
    <div className="space-y-6" data-testid="commission-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Quản lý Hoa hồng</h1>
          <p className="text-slate-500 text-sm mt-1">Chính sách hoa hồng và theo dõi chi trả</p>
        </div>
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button data-testid="add-commission-btn">
              <Plus className="h-4 w-4 mr-2" />
              Thêm hoa hồng
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Thêm Hoa hồng mới</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Mã Deal</Label>
                <Input
                  value={formData.deal_id}
                  onChange={(e) => setFormData({ ...formData, deal_id: e.target.value })}
                  placeholder="ID của Deal/Giao dịch"
                  required
                />
              </div>
              <div>
                <Label>Người nhận</Label>
                <Input
                  value={formData.recipient_id}
                  onChange={(e) => setFormData({ ...formData, recipient_id: e.target.value })}
                  placeholder="ID nhân viên/CTV"
                  required
                />
              </div>
              <div>
                <Label>Loại người nhận</Label>
                <Select value={formData.recipient_type} onValueChange={(v) => setFormData({ ...formData, recipient_type: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="employee">Nhân viên</SelectItem>
                    <SelectItem value="collaborator">Cộng tác viên</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Giá trị Deal (VNĐ)</Label>
                <Input
                  type="number"
                  value={formData.deal_value}
                  onChange={(e) => setFormData({ ...formData, deal_value: e.target.value })}
                  onBlur={calculateCommission}
                  placeholder="0"
                  required
                />
              </div>
              <div>
                <Label>Tỷ lệ hoa hồng (%)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={formData.commission_rate}
                  onChange={(e) => setFormData({ ...formData, commission_rate: e.target.value })}
                  onBlur={calculateCommission}
                  placeholder="2.0"
                  required
                />
              </div>
              {formData.commission_amount && (
                <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                  <p className="text-sm text-emerald-600">Số tiền hoa hồng:</p>
                  <p className="text-xl font-bold text-emerald-700">{formatCurrency(parseFloat(formData.commission_amount))}</p>
                </div>
              )}
              <div>
                <Label>Ghi chú</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Ghi chú thêm"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                  Huỷ
                </Button>
                <Button type="submit">Tạo</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-amber-50 to-white border-amber-100">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center">
                <Coins className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-amber-600">Tổng hoa hồng</p>
                <p className="text-2xl font-bold text-amber-700">{formatCurrency(totalPending + totalApproved + totalPaid)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-yellow-100 flex items-center justify-center">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Chờ duyệt</p>
                <p className="text-2xl font-bold text-slate-800">{formatCurrency(totalPending)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Đã duyệt</p>
                <p className="text-2xl font-bold text-slate-800">{formatCurrency(totalApproved)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                <Wallet className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Đã chi trả</p>
                <p className="text-2xl font-bold text-slate-800">{formatCurrency(totalPaid)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="list" className="space-y-4">
        <TabsList>
          <TabsTrigger value="list">Danh sách</TabsTrigger>
          <TabsTrigger value="policies">Chính sách</TabsTrigger>
          <TabsTrigger value="rates">Tỷ lệ theo BĐS</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-wrap gap-4 items-end">
                <div className="w-36">
                  <Label className="mb-2 block">Trạng thái</Label>
                  <Select value={filters.status} onValueChange={(v) => setFilters({ ...filters, status: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tất cả" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả</SelectItem>
                      <SelectItem value="pending">Chờ duyệt</SelectItem>
                      <SelectItem value="approved">Đã duyệt</SelectItem>
                      <SelectItem value="paid">Đã chi trả</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-40">
                  <Label className="mb-2 block">Loại người nhận</Label>
                  <Select value={filters.recipient_type} onValueChange={(v) => setFilters({ ...filters, recipient_type: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tất cả" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả</SelectItem>
                      <SelectItem value="employee">Nhân viên</SelectItem>
                      <SelectItem value="collaborator">Cộng tác viên</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button variant="outline" onClick={() => setFilters({ status: 'all', recipient_type: 'all' })}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Đặt lại
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Commission List */}
          <Card>
            <CardHeader>
              <CardTitle>Danh sách Hoa hồng</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-slate-500">Đang tải...</div>
              ) : commissions.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <Coins className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                  <p>Chưa có hoa hồng nào</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {commissions.map((comm) => {
                    const StatusIcon = statusLabels[comm.status]?.icon;
                    return (
                      <div
                        key={comm.id}
                        className="flex items-center justify-between p-4 rounded-lg border hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
                            <Coins className="h-5 w-5 text-amber-600" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-slate-900">Deal: {comm.deal_id?.slice(0, 8)}...</p>
                              <span className={`px-2 py-0.5 rounded-full text-xs flex items-center gap-1 ${statusLabels[comm.status]?.color || 'bg-slate-100'}`}>
                                {StatusIcon && <StatusIcon className="h-3 w-3" />}
                                {statusLabels[comm.status]?.label || comm.status}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-slate-500">
                              <Badge variant="outline">{recipientTypeLabels[comm.recipient_type] || comm.recipient_type}</Badge>
                              <span>Tỷ lệ: {comm.commission_rate}%</span>
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(comm.created_at).toLocaleDateString('vi-VN')}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-lg font-semibold text-amber-600">{formatCurrency(comm.commission_amount)}</p>
                            <p className="text-xs text-slate-500">Từ {formatCurrency(comm.deal_value)}</p>
                          </div>
                          <div className="flex gap-2">
                            {comm.status === 'pending' && (
                              <Button size="sm" variant="outline" onClick={() => handleApprove(comm.id)}>
                                <CheckCircle2 className="h-4 w-4 mr-1" />
                                Duyệt
                              </Button>
                            )}
                            {comm.status === 'approved' && (
                              <Button size="sm" onClick={() => handlePay(comm.id)}>
                                <Wallet className="h-4 w-4 mr-1" />
                                Chi trả
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="policies">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-purple-600" />
                Chính sách Hoa hồng theo Cấp bậc
              </CardTitle>
              <CardDescription>Tỷ lệ hoa hồng áp dụng cho từng vị trí</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {commissionPolicies.map((policy, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 rounded-lg border bg-gradient-to-r from-slate-50 to-white">
                    <div className="flex items-center gap-4">
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                        policy.position.includes('CTV') ? 'bg-cyan-100' : 'bg-purple-100'
                      }`}>
                        {policy.position.includes('CTV') ? (
                          <Users className="h-5 w-5 text-cyan-600" />
                        ) : (
                          <User className="h-5 w-5 text-purple-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{policy.position}</p>
                        <p className="text-sm text-slate-500">{policy.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <p className="text-2xl font-bold text-purple-600">{policy.rate}%</p>
                        <p className="text-xs text-slate-500">Hoa hồng</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 p-4 rounded-lg bg-blue-50 border border-blue-200">
                <h4 className="font-medium text-blue-800 mb-2">Cách tính Hoa hồng đa tầng (CTV)</h4>
                <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
                  <li>CTV giới thiệu trực tiếp: 25% phí môi giới</li>
                  <li>CTV cấp trên (người giới thiệu CTV): 5% phí môi giới</li>
                  <li>Tổng hoa hồng CTV: không quá 30% phí môi giới</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rates">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-teal-600" />
                Tỷ lệ Hoa hồng theo Loại BĐS
              </CardTitle>
              <CardDescription>Phí môi giới tính trên giá trị giao dịch</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {propertyCommissionRates.map((item, idx) => (
                  <div key={idx} className="p-4 rounded-lg border hover:shadow-md transition-shadow bg-gradient-to-br from-teal-50 to-white">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-medium text-slate-900">{item.name}</span>
                      <Badge variant="outline" className="text-teal-600 border-teal-300">{item.type}</Badge>
                    </div>
                    <div className="flex items-center justify-center">
                      <div className="text-center">
                        <p className="text-3xl font-bold text-teal-600">{item.rate}%</p>
                        <p className="text-xs text-slate-500">Phí môi giới</p>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t text-center">
                      <p className="text-xs text-slate-500">
                        Deal 5 tỷ = {formatCurrency(5000000000 * item.rate / 100)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 p-4 rounded-lg bg-amber-50 border border-amber-200">
                <h4 className="font-medium text-amber-800 mb-2">Lưu ý</h4>
                <ul className="text-sm text-amber-700 space-y-1 list-disc list-inside">
                  <li>Tỷ lệ trên là phí môi giới thu từ khách hàng</li>
                  <li>Hoa hồng nhân viên/CTV tính trên phí môi giới này</li>
                  <li>Có thể điều chỉnh theo từng dự án cụ thể</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
