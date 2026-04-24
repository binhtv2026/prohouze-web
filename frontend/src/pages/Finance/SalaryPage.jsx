import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Plus,
  Banknote,
  Users,
  Calendar,
  RefreshCw,
  CheckCircle2,
  Clock,
  Wallet,
  FileText,
  Calculator,
  TrendingUp,
  TrendingDown,
  Eye,
  Download,
} from 'lucide-react';
import { toast } from 'sonner';

const statusLabels = {
  draft: { label: 'Nháp', color: 'bg-slate-100 text-slate-700' },
  pending_approval: { label: 'Chờ duyệt', color: 'bg-yellow-100 text-yellow-700' },
  approved: { label: 'Đã duyệt', color: 'bg-blue-100 text-blue-700' },
  paid: { label: 'Đã trả lương', color: 'bg-green-100 text-green-700' },
  cancelled: { label: 'Đã huỷ', color: 'bg-red-100 text-red-700' },
};

// Vietnamese insurance rates
const insuranceRates = {
  social: { rate: 8, name: 'BHXH', description: 'Bảo hiểm xã hội' },
  health: { rate: 1.5, name: 'BHYT', description: 'Bảo hiểm y tế' },
  unemployment: { rate: 1, name: 'BHTN', description: 'Bảo hiểm thất nghiệp' },
};

// PIT brackets (Vietnamese)
const pitBrackets = [
  { from: 0, to: 5000000, rate: 5 },
  { from: 5000000, to: 10000000, rate: 10 },
  { from: 10000000, to: 18000000, rate: 15 },
  { from: 18000000, to: 32000000, rate: 20 },
  { from: 32000000, to: 52000000, rate: 25 },
  { from: 52000000, to: 80000000, rate: 30 },
  { from: 80000000, to: Infinity, rate: 35 },
];

const DEMO_SALARIES = [
  {
    id: 'salary-001',
    employee_id: 'emp-sales-001',
    employee_name: 'Nguyen Van Minh',
    period_label: 'Tháng hiện tại',
    gross_income: 42500000,
    social_insurance: 2880000,
    health_insurance: 540000,
    unemployment_insurance: 360000,
    personal_income_tax: 1785000,
    net_salary: 36935000,
    status: 'approved',
  },
  {
    id: 'salary-002',
    employee_id: 'emp-mkt-002',
    employee_name: 'Tran Thu Ha',
    period_label: 'Tháng hiện tại',
    gross_income: 28600000,
    social_insurance: 1760000,
    health_insurance: 330000,
    unemployment_insurance: 220000,
    personal_income_tax: 815000,
    net_salary: 25475000,
    status: 'pending_approval',
  },
  {
    id: 'salary-003',
    employee_id: 'emp-hr-003',
    employee_name: 'Le Ngoc Anh',
    period_label: 'Tháng hiện tại',
    gross_income: 24100000,
    social_insurance: 1440000,
    health_insurance: 270000,
    unemployment_insurance: 180000,
    personal_income_tax: 520000,
    net_salary: 21690000,
    status: 'draft',
  },
];

export default function SalaryPage() {
  const { token } = useAuth();
  const [salaries, setSalaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [selectedSalary, setSelectedSalary] = useState(null);
  const [filters, setFilters] = useState({
    status: 'all',
    period_year: new Date().getFullYear(),
    period_month: new Date().getMonth() + 1,
  });

  const [formData, setFormData] = useState({
    employee_id: '',
    period_month: new Date().getMonth() + 1,
    period_year: new Date().getFullYear(),
    base_salary: '',
    allowances: 0,
    bonus: 0,
    commission_total: 0,
    overtime_pay: 0,
    other_income: 0,
    work_days: 22,
    paid_leave_days: 0,
    unpaid_leave_days: 0,
    notes: '',
  });

  const [calculated, setCalculated] = useState(null);

  const fetchSalaries = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.status && filters.status !== 'all') params.append('status', filters.status);
      if (filters.period_year) params.append('period_year', filters.period_year);
      if (filters.period_month) params.append('period_month', filters.period_month);

      const res = await api.get(`/finance/salaries?${params.toString()}`);
      const salaryItems = Array.isArray(res.data) ? res.data : [];
      setSalaries(salaryItems.length > 0 ? salaryItems : DEMO_SALARIES);
    } catch (error) {
      console.error('Error fetching salaries:', error);
      setSalaries(DEMO_SALARIES);
      toast.error('Không thể tải bảng lương, đang hiển thị dữ liệu mẫu');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchSalaries();
  }, [fetchSalaries]);

  const calculateSalary = () => {
    const baseSalary = parseFloat(formData.base_salary) || 0;
    const allowances = parseFloat(formData.allowances) || 0;
    const bonus = parseFloat(formData.bonus) || 0;
    const commission = parseFloat(formData.commission_total) || 0;
    const overtime = parseFloat(formData.overtime_pay) || 0;
    const otherIncome = parseFloat(formData.other_income) || 0;

    // Gross income
    const grossIncome = baseSalary + allowances + bonus + commission + overtime + otherIncome;

    // Insurance deductions (on base salary, capped at 20x minimum wage = ~36M)
    const insurableBase = Math.min(baseSalary, 36000000);
    const socialInsurance = insurableBase * insuranceRates.social.rate / 100;
    const healthInsurance = insurableBase * insuranceRates.health.rate / 100;
    const unemploymentInsurance = insurableBase * insuranceRates.unemployment.rate / 100;
    const totalInsurance = socialInsurance + healthInsurance + unemploymentInsurance;

    // Taxable income (after insurance and personal deduction 11M)
    const personalDeduction = 11000000;
    const dependentDeduction = 0; // Can add dependent tracking later
    const taxableIncome = Math.max(0, grossIncome - totalInsurance - personalDeduction - dependentDeduction);

    // Calculate PIT using progressive brackets
    let pit = 0;
    let remaining = taxableIncome;
    for (const bracket of pitBrackets) {
      if (remaining <= 0) break;
      const taxableInBracket = Math.min(remaining, bracket.to - bracket.from);
      pit += taxableInBracket * bracket.rate / 100;
      remaining -= taxableInBracket;
    }

    // Total deductions
    const totalDeductions = totalInsurance + pit;

    // Net salary
    const netSalary = grossIncome - totalDeductions;

    setCalculated({
      grossIncome,
      socialInsurance,
      healthInsurance,
      unemploymentInsurance,
      totalInsurance,
      taxableIncome,
      pit,
      totalDeductions,
      netSalary,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!calculated) {
      toast.error('Vui lòng tính lương trước');
      return;
    }

    try {
      await api.post('/finance/salaries', {
        ...formData,
        base_salary: parseFloat(formData.base_salary) || 0,
        allowances: parseFloat(formData.allowances) || 0,
        bonus: parseFloat(formData.bonus) || 0,
        commission_total: parseFloat(formData.commission_total) || 0,
        overtime_pay: parseFloat(formData.overtime_pay) || 0,
        other_income: parseFloat(formData.other_income) || 0,
        social_insurance: calculated.socialInsurance,
        health_insurance: calculated.healthInsurance,
        unemployment_insurance: calculated.unemploymentInsurance,
        personal_income_tax: calculated.pit,
        other_deductions: 0,
        work_days: parseInt(formData.work_days) || 22,
        paid_leave_days: parseInt(formData.paid_leave_days) || 0,
        unpaid_leave_days: parseInt(formData.unpaid_leave_days) || 0,
      });
      toast.success('Đã tạo bảng lương');
      setShowDialog(false);
      resetForm();
      fetchSalaries();
    } catch (error) {
      console.error('Error creating salary:', error);
      toast.error('Không thể tạo bảng lương');
    }
  };

  const resetForm = () => {
    setFormData({
      employee_id: '',
      period_month: new Date().getMonth() + 1,
      period_year: new Date().getFullYear(),
      base_salary: '',
      allowances: 0,
      bonus: 0,
      commission_total: 0,
      overtime_pay: 0,
      other_income: 0,
      work_days: 22,
      paid_leave_days: 0,
      unpaid_leave_days: 0,
      notes: '',
    });
    setCalculated(null);
  };

  const handleApprove = async (salaryId) => {
    try {
      await api.put(`/finance/salaries/${salaryId}/approve`);
      toast.success('Đã duyệt bảng lương');
      fetchSalaries();
    } catch (error) {
      console.error('Error approving salary:', error);
      toast.error('Không thể duyệt bảng lương');
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value || 0);
  };

  const totalGross = salaries.reduce((sum, s) => sum + (s.gross_income || 0), 0);
  const totalNet = salaries.reduce((sum, s) => sum + (s.net_salary || 0), 0);
  const totalDeductions = salaries.reduce((sum, s) => sum + (s.total_deductions || 0), 0);

  const months = Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: `Tháng ${i + 1}` }));
  const years = [2024, 2025, 2026];

  return (
    <div className="space-y-6" data-testid="salary-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Quản lý Lương</h1>
          <p className="text-slate-500 text-sm mt-1">Bảng lương, BHXH, thuế TNCN và phúc lợi</p>
        </div>
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button data-testid="add-salary-btn">
              <Plus className="h-4 w-4 mr-2" />
              Tạo bảng lương
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Tạo Bảng lương mới</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Mã nhân viên</Label>
                  <Input
                    value={formData.employee_id}
                    onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                    placeholder="ID nhân viên"
                    required
                  />
                </div>
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
              </div>

              <div className="border rounded-lg p-4 space-y-3">
                <h4 className="font-medium text-emerald-700 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Thu nhập
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Lương cơ bản</Label>
                    <Input
                      type="number"
                      value={formData.base_salary}
                      onChange={(e) => setFormData({ ...formData, base_salary: e.target.value })}
                      placeholder="15,000,000"
                      required
                    />
                  </div>
                  <div>
                    <Label>Phụ cấp</Label>
                    <Input
                      type="number"
                      value={formData.allowances}
                      onChange={(e) => setFormData({ ...formData, allowances: e.target.value })}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <Label>Thưởng</Label>
                    <Input
                      type="number"
                      value={formData.bonus}
                      onChange={(e) => setFormData({ ...formData, bonus: e.target.value })}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <Label>Hoa hồng</Label>
                    <Input
                      type="number"
                      value={formData.commission_total}
                      onChange={(e) => setFormData({ ...formData, commission_total: e.target.value })}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <Label>Lương tăng ca</Label>
                    <Input
                      type="number"
                      value={formData.overtime_pay}
                      onChange={(e) => setFormData({ ...formData, overtime_pay: e.target.value })}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <Label>Thu nhập khác</Label>
                    <Input
                      type="number"
                      value={formData.other_income}
                      onChange={(e) => setFormData({ ...formData, other_income: e.target.value })}
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>

              <div className="border rounded-lg p-4 space-y-3">
                <h4 className="font-medium text-slate-700 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Ngày công
                </h4>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Ngày công</Label>
                    <Input
                      type="number"
                      value={formData.work_days}
                      onChange={(e) => setFormData({ ...formData, work_days: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Nghỉ phép (có lương)</Label>
                    <Input
                      type="number"
                      value={formData.paid_leave_days}
                      onChange={(e) => setFormData({ ...formData, paid_leave_days: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Nghỉ không lương</Label>
                    <Input
                      type="number"
                      value={formData.unpaid_leave_days}
                      onChange={(e) => setFormData({ ...formData, unpaid_leave_days: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <Button type="button" variant="outline" className="w-full" onClick={calculateSalary}>
                <Calculator className="h-4 w-4 mr-2" />
                Tính lương
              </Button>

              {calculated && (
                <div className="border rounded-lg p-4 space-y-3 bg-slate-50">
                  <h4 className="font-medium text-slate-700">Kết quả tính lương</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="p-3 rounded bg-emerald-100">
                      <p className="text-emerald-600">Tổng thu nhập</p>
                      <p className="text-lg font-bold text-emerald-700">{formatCurrency(calculated.grossIncome)}</p>
                    </div>
                    <div className="p-3 rounded bg-red-100">
                      <p className="text-red-600">Tổng khấu trừ</p>
                      <p className="text-lg font-bold text-red-700">{formatCurrency(calculated.totalDeductions)}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-sm">
                    <div className="p-2 rounded bg-white border">
                      <p className="text-slate-500">BHXH (8%)</p>
                      <p className="font-medium">{formatCurrency(calculated.socialInsurance)}</p>
                    </div>
                    <div className="p-2 rounded bg-white border">
                      <p className="text-slate-500">BHYT (1.5%)</p>
                      <p className="font-medium">{formatCurrency(calculated.healthInsurance)}</p>
                    </div>
                    <div className="p-2 rounded bg-white border">
                      <p className="text-slate-500">BHTN (1%)</p>
                      <p className="font-medium">{formatCurrency(calculated.unemploymentInsurance)}</p>
                    </div>
                    <div className="p-2 rounded bg-white border">
                      <p className="text-slate-500">Thuế TNCN</p>
                      <p className="font-medium">{formatCurrency(calculated.pit)}</p>
                    </div>
                  </div>
                  <div className="p-4 rounded bg-blue-100 text-center">
                    <p className="text-blue-600">THỰC LĨNH</p>
                    <p className="text-2xl font-bold text-blue-700">{formatCurrency(calculated.netSalary)}</p>
                  </div>
                </div>
              )}

              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => { setShowDialog(false); resetForm(); }}>
                  Huỷ
                </Button>
                <Button type="submit" disabled={!calculated}>Tạo bảng lương</Button>
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
                <Banknote className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-emerald-600">Tổng lương gross</p>
                <p className="text-2xl font-bold text-emerald-700">{formatCurrency(totalGross)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                <TrendingDown className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Tổng khấu trừ</p>
                <p className="text-2xl font-bold text-slate-800">{formatCurrency(totalDeductions)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                <Wallet className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Tổng thực lĩnh</p>
                <p className="text-2xl font-bold text-slate-800">{formatCurrency(totalNet)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Số nhân viên</p>
                <p className="text-2xl font-bold text-slate-800">{salaries.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="list" className="space-y-4">
        <TabsList>
          <TabsTrigger value="list">Bảng lương</TabsTrigger>
          <TabsTrigger value="insurance">Tỷ lệ BHXH</TabsTrigger>
          <TabsTrigger value="pit">Biểu thuế TNCN</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-wrap gap-4 items-end">
                <div className="w-32">
                  <Label className="mb-2 block">Tháng</Label>
                  <Select value={String(filters.period_month)} onValueChange={(v) => setFilters({ ...filters, period_month: Number(v) })}>
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
                <div className="w-24">
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
                <Button variant="outline" onClick={fetchSalaries}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Tải lại
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Salary List */}
          <Card>
            <CardHeader>
              <CardTitle>Bảng lương - Tháng {filters.period_month}/{filters.period_year}</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-slate-500">Đang tải...</div>
              ) : salaries.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <Banknote className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                  <p>Chưa có bảng lương nào</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-slate-50">
                        <th className="px-4 py-3 text-left">Nhân viên</th>
                        <th className="px-4 py-3 text-right">Lương gross</th>
                        <th className="px-4 py-3 text-right">BHXH</th>
                        <th className="px-4 py-3 text-right">Thuế TNCN</th>
                        <th className="px-4 py-3 text-right">Thực lĩnh</th>
                        <th className="px-4 py-3 text-center">Trạng thái</th>
                        <th className="px-4 py-3 text-center">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {salaries.map((salary) => (
                        <tr key={salary.id} className="border-b hover:bg-slate-50">
                          <td className="px-4 py-3">
                            <p className="font-medium">{salary.employee_name || salary.employee_id?.slice(0, 8)}</p>
                            <p className="text-xs text-slate-500">{salary.period_label}</p>
                          </td>
                          <td className="px-4 py-3 text-right font-medium text-emerald-600">{formatCurrency(salary.gross_income)}</td>
                          <td className="px-4 py-3 text-right text-slate-600">
                            {formatCurrency(salary.social_insurance + salary.health_insurance + salary.unemployment_insurance)}
                          </td>
                          <td className="px-4 py-3 text-right text-slate-600">{formatCurrency(salary.personal_income_tax)}</td>
                          <td className="px-4 py-3 text-right font-bold text-blue-600">{formatCurrency(salary.net_salary)}</td>
                          <td className="px-4 py-3 text-center">
                            <span className={`px-2 py-1 rounded-full text-xs ${statusLabels[salary.status]?.color || 'bg-slate-100'}`}>
                              {statusLabels[salary.status]?.label || salary.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            {salary.status === 'draft' && (
                              <Button size="sm" onClick={() => handleApprove(salary.id)}>
                                <CheckCircle2 className="h-4 w-4 mr-1" />
                                Duyệt
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insurance">
          <Card>
            <CardHeader>
              <CardTitle>Tỷ lệ đóng Bảo hiểm</CardTitle>
              <CardDescription>Theo quy định hiện hành của Việt Nam</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-slate-50">
                        <th className="px-4 py-3 text-left">Loại bảo hiểm</th>
                        <th className="px-4 py-3 text-center">NLĐ đóng</th>
                        <th className="px-4 py-3 text-center">DN đóng</th>
                        <th className="px-4 py-3 text-center">Tổng</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b">
                        <td className="px-4 py-3">BHXH - Bảo hiểm xã hội</td>
                        <td className="px-4 py-3 text-center font-medium text-red-600">8%</td>
                        <td className="px-4 py-3 text-center">17.5%</td>
                        <td className="px-4 py-3 text-center font-bold">25.5%</td>
                      </tr>
                      <tr className="border-b">
                        <td className="px-4 py-3">BHYT - Bảo hiểm y tế</td>
                        <td className="px-4 py-3 text-center font-medium text-red-600">1.5%</td>
                        <td className="px-4 py-3 text-center">3%</td>
                        <td className="px-4 py-3 text-center font-bold">4.5%</td>
                      </tr>
                      <tr className="border-b">
                        <td className="px-4 py-3">BHTN - Bảo hiểm thất nghiệp</td>
                        <td className="px-4 py-3 text-center font-medium text-red-600">1%</td>
                        <td className="px-4 py-3 text-center">1%</td>
                        <td className="px-4 py-3 text-center font-bold">2%</td>
                      </tr>
                      <tr className="bg-slate-100">
                        <td className="px-4 py-3 font-bold">Tổng cộng</td>
                        <td className="px-4 py-3 text-center font-bold text-red-600">10.5%</td>
                        <td className="px-4 py-3 text-center font-bold">21.5%</td>
                        <td className="px-4 py-3 text-center font-bold">32%</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="p-4 rounded-lg bg-amber-50 border border-amber-200">
                  <h4 className="font-medium text-amber-800 mb-2">Lưu ý</h4>
                  <ul className="text-sm text-amber-700 space-y-1 list-disc list-inside">
                    <li>Mức đóng tối đa = 20 x Lương tối thiểu vùng</li>
                    <li>Năm 2024: Khoảng 29.8 - 36.4 triệu/tháng tùy vùng</li>
                    <li>Thu nhập vượt mức trần không phải đóng BHXH</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pit">
          <Card>
            <CardHeader>
              <CardTitle>Biểu thuế TNCN Luỹ tiến từng phần</CardTitle>
              <CardDescription>Áp dụng cho thu nhập từ tiền lương, tiền công</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-slate-50">
                        <th className="px-4 py-3 text-center">Bậc</th>
                        <th className="px-4 py-3 text-left">Thu nhập tính thuế/tháng</th>
                        <th className="px-4 py-3 text-center">Thuế suất</th>
                        <th className="px-4 py-3 text-right">Thuế tối đa bậc</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pitBrackets.map((bracket, idx) => (
                        <tr key={idx} className="border-b">
                          <td className="px-4 py-3 text-center font-bold">{idx + 1}</td>
                          <td className="px-4 py-3">
                            {bracket.to === Infinity
                              ? `Trên ${formatCurrency(bracket.from)}`
                              : `${formatCurrency(bracket.from)} - ${formatCurrency(bracket.to)}`
                            }
                          </td>
                          <td className="px-4 py-3 text-center font-bold text-red-600">{bracket.rate}%</td>
                          <td className="px-4 py-3 text-right">
                            {bracket.to === Infinity
                              ? '-'
                              : formatCurrency((bracket.to - bracket.from) * bracket.rate / 100)
                            }
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                  <h4 className="font-medium text-blue-800 mb-2">Các khoản giảm trừ</h4>
                  <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
                    <li>Giảm trừ bản thân: 11 triệu đồng/tháng</li>
                    <li>Giảm trừ người phụ thuộc: 4.4 triệu đồng/người/tháng</li>
                    <li>Đóng BHXH, BHYT, BHTN bắt buộc</li>
                    <li>Đóng quỹ hưu trí tự nguyện (tối đa 1 triệu/tháng)</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
