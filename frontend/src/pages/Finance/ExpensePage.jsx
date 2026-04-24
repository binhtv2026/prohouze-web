import React, { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Plus,
  TrendingDown,
  DollarSign,
  Calendar,
  RefreshCw,
  CheckCircle2,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';

const categoryLabels = {
  marketing: 'Marketing & Quảng cáo',
  operations: 'Vận hành',
  office: 'Văn phòng',
  travel: 'Di chuyển',
  utilities: 'Tiện ích',
  salary: 'Lương nhân viên',
  commission: 'Hoa hồng',
  tax: 'Thuế',
  insurance: 'Bảo hiểm',
  training: 'Đào tạo',
  equipment: 'Thiết bị',
  software: 'Phần mềm',
  legal: 'Pháp lý',
  consulting: 'Tư vấn',
  event: 'Sự kiện',
  other: 'Khác',
};

const statusLabels = {
  pending: { label: 'Chờ duyệt', color: 'bg-yellow-100 text-yellow-700' },
  paid: { label: 'Đã thanh toán', color: 'bg-green-100 text-green-700' },
  cancelled: { label: 'Đã huỷ', color: 'bg-red-100 text-red-700' },
};

const DEMO_EXPENSES = [
  { id: 'expense-1', category: 'marketing', amount: 28000000, description: 'Chi phí chạy Facebook Ads dự án The Privé', vendor_name: 'Meta Ads', transaction_date: '2026-03-22', payment_method: 'transfer', invoice_no: 'INV-001', status: 'paid' },
  { id: 'expense-2', category: 'operations', amount: 6500000, description: 'Setup sự kiện mở bán', vendor_name: 'Event House', transaction_date: '2026-03-24', payment_method: 'transfer', invoice_no: 'INV-002', status: 'pending' },
  { id: 'expense-3', category: 'legal', amount: 12000000, description: 'Phí công chứng và hồ sơ pháp lý', vendor_name: 'VP Công chứng Đông Sài Gòn', transaction_date: '2026-03-23', payment_method: 'cash', invoice_no: 'INV-003', status: 'pending' },
];

export default function ExpensePage() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [filters, setFilters] = useState({
    category: 'all',
    status: 'all',
    from_date: '',
    to_date: '',
  });

  const [formData, setFormData] = useState({
    category: 'operations',
    amount: '',
    description: '',
    vendor_name: '',
    transaction_date: new Date().toISOString().split('T')[0],
    payment_method: 'transfer',
    reference_no: '',
    invoice_no: '',
    notes: '',
  });

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.category && filters.category !== 'all') params.append('category', filters.category);
      if (filters.status && filters.status !== 'all') params.append('status', filters.status);
      if (filters.from_date) params.append('from_date', filters.from_date);
      if (filters.to_date) params.append('to_date', filters.to_date);

      const res = await api.get(`/finance/expenses?${params.toString()}`);
      const items = res.data || [];
      setExpenses(items.length > 0 ? items : DEMO_EXPENSES.filter((item) => {
        const matchCategory = filters.category === 'all' || item.category === filters.category;
        const matchStatus = filters.status === 'all' || item.status === filters.status;
        return matchCategory && matchStatus;
      }));
    } catch (error) {
      console.error('Error fetching expenses:', error);
      toast.warning('Đang hiển thị dữ liệu mẫu cho chi phí');
      setExpenses(DEMO_EXPENSES.filter((item) => {
        const matchCategory = filters.category === 'all' || item.category === filters.category;
        const matchStatus = filters.status === 'all' || item.status === filters.status;
        return matchCategory && matchStatus;
      }));
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/finance/expenses', formData);
      toast.success('Đã thêm chi phí');
      setShowDialog(false);
      setFormData({
        category: 'operations',
        amount: '',
        description: '',
        vendor_name: '',
        transaction_date: new Date().toISOString().split('T')[0],
        payment_method: 'transfer',
        reference_no: '',
        invoice_no: '',
        notes: '',
      });
      fetchExpenses();
    } catch (error) {
      console.error('Error creating expense:', error);
      toast.error('Không thể thêm chi phí');
    }
  };

  const handleApprove = async (expenseId) => {
    try {
      await api.put(`/finance/expenses/${expenseId}/approve`);
      toast.success('Đã duyệt chi phí');
      fetchExpenses();
    } catch (error) {
      console.error('Error approving expense:', error);
      toast.error('Không thể duyệt chi phí');
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value || 0);
  };

  const totalPending = expenses.filter(e => e.status === 'pending').reduce((sum, e) => sum + e.amount, 0);
  const totalPaid = expenses.filter(e => e.status === 'paid').reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="space-y-6" data-testid="expense-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Quản lý Chi phí</h1>
          <p className="text-slate-500 text-sm mt-1">Theo dõi và quản lý các khoản chi</p>
        </div>
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button data-testid="add-expense-btn">
              <Plus className="h-4 w-4 mr-2" />
              Thêm chi phí
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Thêm Chi phí mới</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Danh mục</Label>
                <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(categoryLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                <Label>Mô tả</Label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Mô tả chi phí"
                  required
                />
              </div>
              <div>
                <Label>Nhà cung cấp</Label>
                <Input
                  value={formData.vendor_name}
                  onChange={(e) => setFormData({ ...formData, vendor_name: e.target.value })}
                  placeholder="Tên nhà cung cấp"
                />
              </div>
              <div>
                <Label>Ngày giao dịch</Label>
                <Input
                  type="date"
                  value={formData.transaction_date}
                  onChange={(e) => setFormData({ ...formData, transaction_date: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>Phương thức thanh toán</Label>
                <Select value={formData.payment_method} onValueChange={(v) => setFormData({ ...formData, payment_method: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Tiền mặt</SelectItem>
                    <SelectItem value="transfer">Chuyển khoản</SelectItem>
                    <SelectItem value="card">Thẻ</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Số hoá đơn</Label>
                <Input
                  value={formData.invoice_no}
                  onChange={(e) => setFormData({ ...formData, invoice_no: e.target.value })}
                  placeholder="Số hoá đơn"
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
                <Button type="submit">Thêm</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-red-50 to-white border-red-100">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                <TrendingDown className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-red-600">Tổng chi phí</p>
                <p className="text-2xl font-bold text-red-700">{formatCurrency(totalPending + totalPaid)}</p>
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
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Đã thanh toán</p>
                <p className="text-2xl font-bold text-slate-800">{formatCurrency(totalPaid)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="w-48">
              <Label className="mb-2 block">Danh mục</Label>
              <Select value={filters.category} onValueChange={(v) => setFilters({ ...filters, category: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Tất cả" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  {Object.entries(categoryLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-36">
              <Label className="mb-2 block">Trạng thái</Label>
              <Select value={filters.status} onValueChange={(v) => setFilters({ ...filters, status: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Tất cả" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="pending">Chờ duyệt</SelectItem>
                  <SelectItem value="paid">Đã thanh toán</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-40">
              <Label className="mb-2 block">Từ ngày</Label>
              <Input
                type="date"
                value={filters.from_date}
                onChange={(e) => setFilters({ ...filters, from_date: e.target.value })}
              />
            </div>
            <div className="w-40">
              <Label className="mb-2 block">Đến ngày</Label>
              <Input
                type="date"
                value={filters.to_date}
                onChange={(e) => setFilters({ ...filters, to_date: e.target.value })}
              />
            </div>
            <Button variant="outline" onClick={() => setFilters({ category: 'all', status: 'all', from_date: '', to_date: '' })}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Đặt lại
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Expense List */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách Chi phí</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-slate-500">Đang tải...</div>
          ) : expenses.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <TrendingDown className="h-12 w-12 mx-auto mb-3 text-slate-300" />
              <p>Chưa có chi phí nào</p>
              <p className="text-sm mt-1">Bấm "Thêm chi phí" để bắt đầu</p>
            </div>
          ) : (
            <div className="space-y-3">
              {expenses.map((exp) => (
                <div
                  key={exp.id}
                  className="flex items-center justify-between p-4 rounded-lg border hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                      <TrendingDown className="h-5 w-5 text-red-600" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{exp.description}</p>
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <Badge variant="outline">{categoryLabels[exp.category] || exp.category}</Badge>
                        <span className={`px-2 py-0.5 rounded-full text-xs ${statusLabels[exp.status]?.color || 'bg-slate-100'}`}>
                          {statusLabels[exp.status]?.label || exp.status}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(exp.transaction_date).toLocaleDateString('vi-VN')}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-lg font-semibold text-red-600">{formatCurrency(exp.amount)}</p>
                      {exp.vendor_name && (
                        <p className="text-xs text-slate-500">{exp.vendor_name}</p>
                      )}
                    </div>
                    {exp.status === 'pending' && (
                      <Button size="sm" onClick={() => handleApprove(exp.id)} data-testid={`approve-${exp.id}`}>
                        <CheckCircle2 className="h-4 w-4 mr-1" />
                        Duyệt
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
