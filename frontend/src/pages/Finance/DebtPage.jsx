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
  Receipt,
  AlertTriangle,
  Calendar,
  RefreshCw,
  CheckCircle2,
  Clock,
  TrendingUp,
  TrendingDown,
  User,
  Building2,
  CreditCard,
  AlertCircle,
  DollarSign,
} from 'lucide-react';
import { toast } from 'sonner';

const debtTypeLabels = {
  receivable: { label: 'Phải thu', icon: TrendingUp, color: 'bg-emerald-100 text-emerald-700', bgGradient: 'from-emerald-50' },
  payable: { label: 'Phải trả', icon: TrendingDown, color: 'bg-red-100 text-red-700', bgGradient: 'from-red-50' },
};

const statusLabels = {
  pending: { label: 'Chưa thanh toán', color: 'bg-yellow-100 text-yellow-700' },
  partial: { label: 'Thanh toán một phần', color: 'bg-blue-100 text-blue-700' },
  paid: { label: 'Đã thanh toán', color: 'bg-green-100 text-green-700' },
  overdue: { label: 'Quá hạn', color: 'bg-red-100 text-red-700' },
  cancelled: { label: 'Đã huỷ', color: 'bg-gray-100 text-gray-700' },
};

const DEMO_DEBTS = [
  { id: 'debt-1', debt_type: 'receivable', partner_name: 'Nguyễn Minh Tâm', description: 'Đợt thanh toán 2 căn A2-1208', amount: 350000000, remaining_amount: 220000000, due_date: '2026-03-28', status: 'partial', days_overdue: 0 },
  { id: 'debt-2', debt_type: 'receivable', partner_name: 'Lê Mỹ An', description: 'Thanh toán booking B1-0910', amount: 100000000, remaining_amount: 100000000, due_date: '2026-03-20', status: 'overdue', days_overdue: 5 },
  { id: 'debt-3', debt_type: 'payable', partner_name: 'Công ty Event House', description: 'Chi phí tổ chức mở bán', amount: 85000000, remaining_amount: 45000000, due_date: '2026-03-30', status: 'pending', days_overdue: 0 },
];

export default function DebtPage() {
  const [debts, setDebts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [filters, setFilters] = useState({
    debt_type: 'all',
    status: 'all',
    overdue_only: false,
  });

  const [formData, setFormData] = useState({
    debt_type: 'receivable',
    partner_name: '',
    description: '',
    amount: '',
    due_date: '',
    notes: '',
  });

  const fetchDebts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.debt_type && filters.debt_type !== 'all') params.append('debt_type', filters.debt_type);
      if (filters.status && filters.status !== 'all') params.append('status', filters.status);
      if (filters.overdue_only) params.append('overdue_only', 'true');

      const res = await api.get(`/finance/debts?${params.toString()}`);
      const items = res.data || [];
      setDebts(items.length > 0 ? items : DEMO_DEBTS.filter((item) => {
        const matchType = filters.debt_type === 'all' || item.debt_type === filters.debt_type;
        const matchStatus = filters.status === 'all' || item.status === filters.status;
        const matchOverdue = !filters.overdue_only || item.days_overdue > 0;
        return matchType && matchStatus && matchOverdue;
      }));
    } catch (error) {
      console.error('Error fetching debts:', error);
      toast.warning('Đang hiển thị dữ liệu mẫu cho công nợ');
      setDebts(DEMO_DEBTS.filter((item) => {
        const matchType = filters.debt_type === 'all' || item.debt_type === filters.debt_type;
        const matchStatus = filters.status === 'all' || item.status === filters.status;
        const matchOverdue = !filters.overdue_only || item.days_overdue > 0;
        return matchType && matchStatus && matchOverdue;
      }));
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchDebts();
  }, [fetchDebts]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/finance/debts', {
        ...formData,
        amount: parseFloat(formData.amount),
      });
      toast.success('Đã tạo công nợ');
      setShowDialog(false);
      resetForm();
      fetchDebts();
    } catch (error) {
      console.error('Error creating debt:', error);
      toast.error('Không thể tạo công nợ');
    }
  };

  const resetForm = () => {
    setFormData({
      debt_type: 'receivable',
      partner_name: '',
      description: '',
      amount: '',
      due_date: '',
      notes: '',
    });
  };

  const handleRecordPayment = async () => {
    if (!selectedDebt || !paymentAmount) return;
    try {
      const params = new URLSearchParams();
      params.append('amount', paymentAmount);

      await api.put(`/finance/debts/${selectedDebt.id}/record-payment?${params.toString()}`);
      toast.success('Đã ghi nhận thanh toán');
      setShowPaymentDialog(false);
      setSelectedDebt(null);
      setPaymentAmount('');
      fetchDebts();
    } catch (error) {
      console.error('Error recording payment:', error);
      toast.error('Không thể ghi nhận thanh toán');
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value || 0);
  };

  const receivables = debts.filter(d => d.debt_type === 'receivable');
  const payables = debts.filter(d => d.debt_type === 'payable');

  const totalReceivable = receivables.reduce((sum, d) => sum + (d.remaining_amount || 0), 0);
  const totalPayable = payables.reduce((sum, d) => sum + (d.remaining_amount || 0), 0);
  const overdueReceivable = receivables.filter(d => d.days_overdue > 0).reduce((sum, d) => sum + (d.remaining_amount || 0), 0);
  const overduePayable = payables.filter(d => d.days_overdue > 0).reduce((sum, d) => sum + (d.remaining_amount || 0), 0);

  const isOverdue = (debt) => {
    if (debt.status === 'paid') return false;
    if (debt.days_overdue > 0) return true;
    const dueDate = new Date(debt.due_date);
    return dueDate < new Date();
  };

  return (
    <div className="space-y-6" data-testid="debt-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Quản lý Công nợ</h1>
          <p className="text-slate-500 text-sm mt-1">Theo dõi công nợ phải thu và phải trả</p>
        </div>
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button data-testid="add-debt-btn">
              <Plus className="h-4 w-4 mr-2" />
              Thêm công nợ
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Thêm Công nợ mới</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Loại công nợ</Label>
                <Select value={formData.debt_type} onValueChange={(v) => setFormData({ ...formData, debt_type: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="receivable">Phải thu (Khách hàng nợ)</SelectItem>
                    <SelectItem value="payable">Phải trả (Nợ đối tác)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{formData.debt_type === 'receivable' ? 'Tên khách hàng' : 'Tên đối tác/NCC'}</Label>
                <Input
                  value={formData.partner_name}
                  onChange={(e) => setFormData({ ...formData, partner_name: e.target.value })}
                  placeholder="Tên đối tượng nợ"
                  required
                />
              </div>
              <div>
                <Label>Mô tả</Label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Nội dung công nợ"
                  required
                />
              </div>
              <div>
                <Label>Số tiền (VNĐ)</Label>
                <Input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="0"
                  required
                />
              </div>
              <div>
                <Label>Hạn thanh toán</Label>
                <Input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  required
                />
              </div>
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
        <Card className="bg-gradient-to-br from-emerald-50 to-white border-emerald-100">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-emerald-600">Phải thu</p>
                <p className="text-2xl font-bold text-emerald-700">{formatCurrency(totalReceivable)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-red-50 to-white border-red-100">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                <TrendingDown className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-red-600">Phải trả</p>
                <p className="text-2xl font-bold text-red-700">{formatCurrency(totalPayable)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Quá hạn (thu)</p>
                <p className="text-2xl font-bold text-orange-600">{formatCurrency(overdueReceivable)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Quá hạn (trả)</p>
                <p className="text-2xl font-bold text-amber-600">{formatCurrency(overduePayable)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">Tất cả ({debts.length})</TabsTrigger>
          <TabsTrigger value="receivable">Phải thu ({receivables.length})</TabsTrigger>
          <TabsTrigger value="payable">Phải trả ({payables.length})</TabsTrigger>
          <TabsTrigger value="overdue">Quá hạn</TabsTrigger>
        </TabsList>

        {['all', 'receivable', 'payable', 'overdue'].map((tabValue) => (
          <TabsContent key={tabValue} value={tabValue} className="space-y-4">
            {/* Filters */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-wrap gap-4 items-end">
                  {tabValue === 'all' && (
                    <div className="w-40">
                      <Label className="mb-2 block">Loại công nợ</Label>
                      <Select value={filters.debt_type} onValueChange={(v) => setFilters({ ...filters, debt_type: v })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Tất cả" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Tất cả</SelectItem>
                          <SelectItem value="receivable">Phải thu</SelectItem>
                          <SelectItem value="payable">Phải trả</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  <div className="w-40">
                    <Label className="mb-2 block">Trạng thái</Label>
                    <Select value={filters.status} onValueChange={(v) => setFilters({ ...filters, status: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Tất cả" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tất cả</SelectItem>
                        <SelectItem value="pending">Chưa thanh toán</SelectItem>
                        <SelectItem value="partial">Một phần</SelectItem>
                        <SelectItem value="paid">Đã thanh toán</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button variant="outline" onClick={fetchDebts}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Tải lại
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Debt List */}
            <Card>
              <CardHeader>
                <CardTitle>
                  {tabValue === 'all' && 'Tất cả Công nợ'}
                  {tabValue === 'receivable' && 'Công nợ Phải thu'}
                  {tabValue === 'payable' && 'Công nợ Phải trả'}
                  {tabValue === 'overdue' && 'Công nợ Quá hạn'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8 text-slate-500">Đang tải...</div>
                ) : (
                  (() => {
                    let filteredDebts = debts;
                    if (tabValue === 'receivable') filteredDebts = receivables;
                    if (tabValue === 'payable') filteredDebts = payables;
                    if (tabValue === 'overdue') filteredDebts = debts.filter(d => isOverdue(d));

                    if (filteredDebts.length === 0) {
                      return (
                        <div className="text-center py-8 text-slate-500">
                          <Receipt className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                          <p>Không có công nợ nào</p>
                        </div>
                      );
                    }

                    return (
                      <div className="space-y-3">
                        {filteredDebts.map((debt) => {
                          const TypeInfo = debtTypeLabels[debt.debt_type] || debtTypeLabels.receivable;
                          const TypeIcon = TypeInfo.icon;
                          const overdue = isOverdue(debt);

                          return (
                            <div
                              key={debt.id}
                              className={`p-4 rounded-lg border hover:shadow-md transition-shadow ${overdue ? 'border-red-300 bg-red-50' : ''}`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                  <div className={`h-10 w-10 rounded-full flex items-center justify-center ${TypeInfo.color.split(' ')[0]}`}>
                                    <TypeIcon className={`h-5 w-5 ${TypeInfo.color.split(' ')[1]}`} />
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <p className="font-medium text-slate-900">{debt.partner_name}</p>
                                      <Badge variant="outline" className={TypeInfo.color}>{TypeInfo.label}</Badge>
                                      {overdue && (
                                        <Badge variant="destructive" className="text-xs">
                                          Quá hạn {debt.days_overdue || Math.ceil((new Date() - new Date(debt.due_date)) / (1000 * 60 * 60 * 24))} ngày
                                        </Badge>
                                      )}
                                    </div>
                                    <p className="text-sm text-slate-500">{debt.description}</p>
                                    <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                                      <Calendar className="h-3 w-3" />
                                      Hạn: {new Date(debt.due_date).toLocaleDateString('vi-VN')}
                                      <span className={`px-2 py-0.5 rounded-full ${statusLabels[debt.status]?.color || 'bg-slate-100'}`}>
                                        {statusLabels[debt.status]?.label || debt.status}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-4">
                                  <div className="text-right">
                                    <p className={`text-lg font-semibold ${debt.debt_type === 'receivable' ? 'text-emerald-600' : 'text-red-600'}`}>
                                      {formatCurrency(debt.remaining_amount)}
                                    </p>
                                    {debt.paid_amount > 0 && (
                                      <p className="text-xs text-slate-500">
                                        Đã trả: {formatCurrency(debt.paid_amount)} / {formatCurrency(debt.amount)}
                                      </p>
                                    )}
                                  </div>
                                  {debt.status !== 'paid' && (
                                    <Button 
                                      size="sm" 
                                      onClick={() => {
                                        setSelectedDebt(debt);
                                        setPaymentAmount(debt.remaining_amount?.toString() || '');
                                        setShowPaymentDialog(true);
                                      }}
                                    >
                                      <CreditCard className="h-4 w-4 mr-1" />
                                      Thanh toán
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Ghi nhận Thanh toán</DialogTitle>
          </DialogHeader>
          {selectedDebt && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-slate-50">
                <p className="text-sm text-slate-500">Đối tượng</p>
                <p className="font-medium">{selectedDebt.partner_name}</p>
                <p className="text-sm text-slate-500 mt-2">Số tiền còn lại</p>
                <p className="text-xl font-bold text-slate-800">{formatCurrency(selectedDebt.remaining_amount)}</p>
              </div>
              <div>
                <Label>Số tiền thanh toán</Label>
                <Input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  max={selectedDebt.remaining_amount}
                  placeholder="Nhập số tiền"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowPaymentDialog(false)}>
                  Huỷ
                </Button>
                <Button onClick={handleRecordPayment}>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Xác nhận
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
