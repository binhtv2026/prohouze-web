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
import { Progress } from '@/components/ui/progress';
import {
  Plus,
  PiggyBank,
  Calendar,
  RefreshCw,
  CheckCircle2,
  Clock,
  TrendingUp,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';

const budgetTypeLabels = {
  annual: 'Ngân sách năm',
  quarterly: 'Ngân sách quý',
  monthly: 'Ngân sách tháng',
  project: 'Ngân sách dự án',
  department: 'Ngân sách phòng ban',
  campaign: 'Ngân sách chiến dịch',
};

const statusLabels = {
  draft: { label: 'Nháp', color: 'bg-slate-100 text-slate-700' },
  pending_approval: { label: 'Chờ duyệt', color: 'bg-yellow-100 text-yellow-700' },
  approved: { label: 'Đã duyệt', color: 'bg-blue-100 text-blue-700' },
  active: { label: 'Đang thực hiện', color: 'bg-green-100 text-green-700' },
  closed: { label: 'Đã đóng', color: 'bg-gray-100 text-gray-700' },
  cancelled: { label: 'Đã huỷ', color: 'bg-red-100 text-red-700' },
};

const DEMO_BUDGETS = [
  { id: 'budget-1', name: 'Ngân sách Marketing tháng 3', budget_type: 'monthly', total_planned: 180000000, total_actual: 121000000, utilization_rate: 67.2, status: 'active', period_year: 2026, period_month: 3 },
  { id: 'budget-2', name: 'Ngân sách pháp lý quý 1', budget_type: 'quarterly', total_planned: 95000000, total_actual: 64000000, utilization_rate: 67.4, status: 'approved', period_year: 2026, period_quarter: 1 },
  { id: 'budget-3', name: 'Ngân sách dự án The Privé', budget_type: 'project', total_planned: 350000000, total_actual: 214000000, utilization_rate: 61.1, status: 'active', period_year: 2026 },
];

export default function BudgetPage() {
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [filters, setFilters] = useState({
    budget_type: 'all',
    status: 'all',
    period_year: new Date().getFullYear(),
  });

  const [formData, setFormData] = useState({
    name: '',
    budget_type: 'monthly',
    description: '',
    period_year: new Date().getFullYear(),
    period_month: new Date().getMonth() + 1,
    period_quarter: null,
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    total_planned: '',
    notes: '',
  });

  const fetchBudgets = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.budget_type && filters.budget_type !== 'all') params.append('budget_type', filters.budget_type);
      if (filters.status && filters.status !== 'all') params.append('status', filters.status);
      if (filters.period_year) params.append('period_year', filters.period_year);

      const res = await api.get(`/finance/budgets?${params.toString()}`);
      const items = res.data || [];
      setBudgets(items.length > 0 ? items : DEMO_BUDGETS.filter((item) => {
        const matchType = filters.budget_type === 'all' || item.budget_type === filters.budget_type;
        const matchStatus = filters.status === 'all' || item.status === filters.status;
        const matchYear = !filters.period_year || item.period_year === Number(filters.period_year);
        return matchType && matchStatus && matchYear;
      }));
    } catch (error) {
      console.error('Error fetching budgets:', error);
      toast.warning('Đang hiển thị dữ liệu mẫu cho ngân sách');
      setBudgets(DEMO_BUDGETS.filter((item) => {
        const matchType = filters.budget_type === 'all' || item.budget_type === filters.budget_type;
        const matchStatus = filters.status === 'all' || item.status === filters.status;
        const matchYear = !filters.period_year || item.period_year === Number(filters.period_year);
        return matchType && matchStatus && matchYear;
      }));
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchBudgets();
  }, [fetchBudgets]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/finance/budgets', formData);
      toast.success('Đã tạo ngân sách');
      setShowDialog(false);
      resetForm();
      fetchBudgets();
    } catch (error) {
      console.error('Error creating budget:', error);
      toast.error('Không thể tạo ngân sách');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      budget_type: 'monthly',
      description: '',
      period_year: new Date().getFullYear(),
      period_month: new Date().getMonth() + 1,
      period_quarter: null,
      start_date: new Date().toISOString().split('T')[0],
      end_date: '',
      total_planned: '',
      notes: '',
    });
  };

  const handleApprove = async (budgetId) => {
    try {
      await api.put(`/finance/budgets/${budgetId}/approve`);
      toast.success('Đã duyệt ngân sách');
      fetchBudgets();
    } catch (error) {
      console.error('Error approving budget:', error);
      toast.error('Không thể duyệt ngân sách');
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value || 0);
  };

  const totalPlanned = budgets.reduce((sum, b) => sum + (b.total_planned || 0), 0);
  const totalActual = budgets.reduce((sum, b) => sum + (b.total_actual || 0), 0);
  const avgUtilization = budgets.length > 0 
    ? budgets.reduce((sum, b) => sum + (b.utilization_rate || 0), 0) / budgets.length 
    : 0;

  const months = Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: `Tháng ${i + 1}` }));
  const quarters = [
    { value: 1, label: 'Quý 1' },
    { value: 2, label: 'Quý 2' },
    { value: 3, label: 'Quý 3' },
    { value: 4, label: 'Quý 4' },
  ];
  const years = [2024, 2025, 2026];

  return (
    <div className="space-y-6" data-testid="budget-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Quản lý Ngân sách</h1>
          <p className="text-slate-500 text-sm mt-1">Lập kế hoạch và theo dõi ngân sách</p>
        </div>
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button data-testid="add-budget-btn">
              <Plus className="h-4 w-4 mr-2" />
              Tạo ngân sách
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Tạo Ngân sách mới</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Tên ngân sách</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="VD: Ngân sách Marketing T12"
                  required
                />
              </div>
              <div>
                <Label>Loại ngân sách</Label>
                <Select value={formData.budget_type} onValueChange={(v) => setFormData({ ...formData, budget_type: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(budgetTypeLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Năm</Label>
                  <Select value={String(formData.period_year)} onValueChange={(v) => setFormData({ ...formData, period_year: Number(v) })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {years.map((y) => (
                        <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {formData.budget_type === 'monthly' && (
                  <div>
                    <Label>Tháng</Label>
                    <Select value={String(formData.period_month)} onValueChange={(v) => setFormData({ ...formData, period_month: Number(v) })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {months.map((m) => (
                          <SelectItem key={m.value} value={String(m.value)}>{m.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                {formData.budget_type === 'quarterly' && (
                  <div>
                    <Label>Quý</Label>
                    <Select value={String(formData.period_quarter || '')} onValueChange={(v) => setFormData({ ...formData, period_quarter: Number(v) })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn quý" />
                      </SelectTrigger>
                      <SelectContent>
                        {quarters.map((q) => (
                          <SelectItem key={q.value} value={String(q.value)}>{q.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              <div>
                <Label>Tổng ngân sách (VNĐ)</Label>
                <Input
                  type="number"
                  value={formData.total_planned}
                  onChange={(e) => setFormData({ ...formData, total_planned: e.target.value })}
                  placeholder="0"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Ngày bắt đầu</Label>
                  <Input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>Ngày kết thúc</Label>
                  <Input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label>Mô tả</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Mô tả mục đích ngân sách"
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
        <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-100">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                <PiggyBank className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-blue-600">Tổng ngân sách</p>
                <p className="text-2xl font-bold text-blue-700">{formatCurrency(totalPlanned)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Đã sử dụng</p>
                <p className="text-2xl font-bold text-slate-800">{formatCurrency(totalActual)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center">
                <Clock className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Tỷ lệ sử dụng</p>
                <p className="text-2xl font-bold text-slate-800">{avgUtilization.toFixed(1)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Số ngân sách</p>
                <p className="text-2xl font-bold text-slate-800">{budgets.length}</p>
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
              <Label className="mb-2 block">Loại ngân sách</Label>
              <Select value={filters.budget_type} onValueChange={(v) => setFilters({ ...filters, budget_type: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Tất cả" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  {Object.entries(budgetTypeLabels).map(([key, label]) => (
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
                  {Object.entries(statusLabels).map(([key, val]) => (
                    <SelectItem key={key} value={key}>{val.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-28">
              <Label className="mb-2 block">Năm</Label>
              <Select value={String(filters.period_year)} onValueChange={(v) => setFilters({ ...filters, period_year: Number(v) })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map((y) => (
                    <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" onClick={() => setFilters({ budget_type: 'all', status: 'all', period_year: new Date().getFullYear() })}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Đặt lại
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Budget List */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách Ngân sách</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-slate-500">Đang tải...</div>
          ) : budgets.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <PiggyBank className="h-12 w-12 mx-auto mb-3 text-slate-300" />
              <p>Chưa có ngân sách nào</p>
            </div>
          ) : (
            <div className="space-y-4">
              {budgets.map((budget) => {
                const utilization = budget.total_planned > 0 
                  ? (budget.total_actual / budget.total_planned * 100) 
                  : 0;
                const isOverBudget = utilization > 100;

                return (
                  <div
                    key={budget.id}
                    className="p-4 rounded-lg border hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center ${isOverBudget ? 'bg-red-100' : 'bg-blue-100'}`}>
                          {isOverBudget ? (
                            <AlertTriangle className="h-5 w-5 text-red-600" />
                          ) : (
                            <PiggyBank className="h-5 w-5 text-blue-600" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-slate-900">{budget.name}</p>
                            <span className={`px-2 py-0.5 rounded-full text-xs ${statusLabels[budget.status]?.color || 'bg-slate-100'}`}>
                              {statusLabels[budget.status]?.label || budget.status}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-slate-500">
                            <Badge variant="outline">{budgetTypeLabels[budget.budget_type] || budget.budget_type}</Badge>
                            <span>{budget.period_label}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold text-slate-800">{formatCurrency(budget.total_planned)}</p>
                        <p className="text-sm text-slate-500">
                          Đã dùng: {formatCurrency(budget.total_actual)}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Tiến độ sử dụng</span>
                        <span className={isOverBudget ? 'text-red-600 font-medium' : 'text-slate-600'}>
                          {utilization.toFixed(1)}%
                        </span>
                      </div>
                      <Progress 
                        value={Math.min(utilization, 100)} 
                        className={`h-2 ${isOverBudget ? '[&>div]:bg-red-500' : '[&>div]:bg-blue-500'}`} 
                      />
                    </div>
                    {budget.status === 'draft' && (
                      <div className="mt-3 flex justify-end">
                        <Button size="sm" onClick={() => handleApprove(budget.id)}>
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                          Duyệt ngân sách
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
