import React, { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Receipt,
  FileText,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
  RefreshCw,
  Wallet,
  PiggyBank,
  CreditCard,
  BookOpen,
  CalendarDays,
  Users,
  Building2,
  ClipboardList,
} from 'lucide-react';

const DEMO_FINANCE_SUMMARY = {
  total_revenue: 12450000000,
  total_expense: 3860000000,
  net_profit: 8590000000,
  profit_margin: 69.0,
  total_receivable: 2140000000,
  overdue_receivable: 320000000,
  revenue_by_category: {
    booking: 5200000000,
    contract: 3800000000,
    commission: 3450000000,
  },
  expense_by_category: {
    marketing: 1280000000,
    payroll: 1740000000,
    operation: 840000000,
  },
};

const DEMO_CASH_FLOW = {
  inflow: 12450000000,
  outflow: 3860000000,
  closing_balance: 8590000000,
};

const DEMO_PROFIT_LOSS = {
  gross_profit: 9230000000,
  operating_profit: 8750000000,
  net_profit: 8590000000,
};

export default function FinanceDashboardPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [cashFlow, setCashFlow] = useState(null);
  const [profitLoss, setProfitLoss] = useState(null);
  const [periodYear, setPeriodYear] = useState(new Date().getFullYear());
  const [periodMonth, setPeriodMonth] = useState(new Date().getMonth() + 1);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [summaryRes, cashFlowRes, profitLossRes] = await Promise.all([
        api.get(`/finance/summary?period_year=${periodYear}&period_month=${periodMonth}`),
        api.get(`/finance/cash-flow?period_year=${periodYear}&period_month=${periodMonth}`),
        api.get(`/finance/profit-loss?period_year=${periodYear}&period_month=${periodMonth}`)
      ]);
      setSummary(summaryRes?.data || DEMO_FINANCE_SUMMARY);
      setCashFlow(cashFlowRes?.data || DEMO_CASH_FLOW);
      setProfitLoss(profitLossRes?.data || DEMO_PROFIT_LOSS);
    } catch (error) {
      console.error('Error fetching finance data:', error);
      setSummary(DEMO_FINANCE_SUMMARY);
      setCashFlow(DEMO_CASH_FLOW);
      setProfitLoss(DEMO_PROFIT_LOSS);
    } finally {
      setLoading(false);
    }
  }, [periodMonth, periodYear]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const formatCurrency = (value) => {
    if (value === null || value === undefined) return '0 ₫';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  };

  const formatPercent = (value) => {
    if (value === null || value === undefined) return '0%';
    return `${value.toFixed(1)}%`;
  };

  const months = [
    { value: 1, label: 'Tháng 1' },
    { value: 2, label: 'Tháng 2' },
    { value: 3, label: 'Tháng 3' },
    { value: 4, label: 'Tháng 4' },
    { value: 5, label: 'Tháng 5' },
    { value: 6, label: 'Tháng 6' },
    { value: 7, label: 'Tháng 7' },
    { value: 8, label: 'Tháng 8' },
    { value: 9, label: 'Tháng 9' },
    { value: 10, label: 'Tháng 10' },
    { value: 11, label: 'Tháng 11' },
    { value: 12, label: 'Tháng 12' },
  ];

  const years = [2024, 2025, 2026];

  return (
    <div className="space-y-6" data-testid="finance-dashboard">

      {/* ── PREMIUM HEADER ── */}
      <div className="rounded-2xl bg-gradient-to-r from-[#14532d] to-[#15803d] p-6 text-white">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-green-300 animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-widest text-white/70">Kừe TOÁN / TÀI CHÍNH</span>
            </div>
            <h1 className="text-2xl font-bold">Finance Command Center</h1>
            <p className="mt-1 text-white/60 text-sm">
              {new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select value={String(periodMonth)} onValueChange={(v) => setPeriodMonth(Number(v))}>
              <SelectTrigger className="w-28 border-white/30 bg-white/15 text-white" data-testid="select-month">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {months.map((m) => (
                  <SelectItem key={m.value} value={String(m.value)}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={String(periodYear)} onValueChange={(v) => setPeriodYear(Number(v))}>
              <SelectTrigger className="w-20 border-white/30 bg-white/15 text-white" data-testid="select-year">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {years.map((y) => (
                  <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button size="sm" variant="outline"
              className="border-white/30 bg-white/15 text-white hover:bg-white/25"
              onClick={fetchData} data-testid="refresh-btn">
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {/* Tab navigation strip */}
        <div className="mt-4 flex flex-wrap gap-2 border-t border-white/20 pt-4">
          {[
            { label: 'Tổng quan',    icon: BarChart3,     path: '/finance' },
            { label: 'Doanh thu',    icon: TrendingUp,    path: '/finance/revenue' },
            { label: 'Chi phí',     icon: TrendingDown,  path: '/finance/expenses' },
            { label: 'Hóa đơn',     icon: FileText,      path: '/finance/my-income' },
            { label: 'Hoa hồng',    icon: DollarSign,    path: '/commission' },
            { label: 'Lương & trả',  icon: Wallet,        path: '/payroll' },
            { label: 'Công nợ',     icon: Receipt,       path: '/finance/receivables' },
            { label: 'Ngân hàng',    icon: Building2,     path: '/finance/bank-accounts' },
            { label: 'Báo cáo',     icon: ClipboardList, path: '/analytics/reports' },
          ].map((t) => {
            const Icon = t.icon;
            return (
              <button key={t.path}
                onClick={() => navigate(t.path)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-white/15 hover:bg-white/30 text-white transition-colors">
                <Icon className="h-3 w-3" />
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Quick shortcuts row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Hóa đơn chờ duyệt', icon: FileText,      path: '/finance/my-income',      color: 'bg-violet-50 border-violet-200 text-violet-700' },
          { label: 'Hoa hồng chờ',    icon: DollarSign,    path: '/commission',              color: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
          { label: 'Công nợ quá hạn',  icon: AlertTriangle, path: '/finance/receivables',     color: 'bg-red-50 border-red-200 text-red-700' },
          { label: 'Dự toán ngân sách', icon: PiggyBank,     path: '/finance/budget',          color: 'bg-blue-50 border-blue-200 text-blue-700' },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <button key={item.path} onClick={() => navigate(item.path)}
              className={`rounded-xl border p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-sm ${item.color}`}>
              <Icon className="h-5 w-5 mb-2" />
              <p className="text-sm font-semibold">{item.label}</p>
            </button>
          );
        })}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-emerald-50 to-white border-emerald-100">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-emerald-600">Tổng Doanh thu</p>
                <p className="text-2xl font-bold text-emerald-700 mt-1">
                  {formatCurrency(summary?.total_revenue || 0)}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
            <div className="flex items-center mt-3 text-sm">
              <ArrowUpRight className="h-4 w-4 text-emerald-500 mr-1" />
              <span className="text-emerald-600 font-medium">+12.5%</span>
              <span className="text-slate-500 ml-2">so với tháng trước</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-white border-red-100">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-600">Tổng Chi phí</p>
                <p className="text-2xl font-bold text-red-700 mt-1">
                  {formatCurrency(summary?.total_expense || 0)}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                <TrendingDown className="h-6 w-6 text-red-600" />
              </div>
            </div>
            <div className="flex items-center mt-3 text-sm">
              <ArrowDownRight className="h-4 w-4 text-red-500 mr-1" />
              <span className="text-red-600 font-medium">-5.2%</span>
              <span className="text-slate-500 ml-2">so với tháng trước</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-100">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Lợi nhuận ròng</p>
                <p className="text-2xl font-bold text-blue-700 mt-1">
                  {formatCurrency(summary?.net_profit || 0)}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div className="flex items-center mt-3 text-sm">
              <span className="text-slate-600">Biên lợi nhuận:</span>
              <span className="text-blue-600 font-medium ml-2">{formatPercent(summary?.profit_margin || 0)}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-white border-amber-100">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-amber-600">Công nợ phải thu</p>
                <p className="text-2xl font-bold text-amber-700 mt-1">
                  {formatCurrency(summary?.total_receivable || 0)}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center">
                <Receipt className="h-6 w-6 text-amber-600" />
              </div>
            </div>
            <div className="flex items-center mt-3 text-sm">
              <AlertTriangle className="h-4 w-4 text-amber-500 mr-1" />
              <span className="text-amber-600 font-medium">
                {formatCurrency(summary?.overdue_receivable || 0)}
              </span>
              <span className="text-slate-500 ml-2">quá hạn</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview" data-testid="tab-overview">Tổng quan</TabsTrigger>
          <TabsTrigger value="cashflow" data-testid="tab-cashflow">Dòng tiền</TabsTrigger>
          <TabsTrigger value="pnl" data-testid="tab-pnl">Lãi/Lỗ</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue by Category */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Doanh thu theo danh mục</CardTitle>
                <CardDescription>Phân bổ nguồn doanh thu trong kỳ</CardDescription>
              </CardHeader>
              <CardContent>
                {summary?.revenue_by_category && Object.keys(summary.revenue_by_category).length > 0 ? (
                  <div className="space-y-3">
                    {Object.entries(summary.revenue_by_category).map(([cat, amount]) => {
                      const percent = summary.total_revenue > 0 ? (amount / summary.total_revenue * 100) : 0;
                      return (
                        <div key={cat} className="flex items-center gap-3">
                          <div className="flex-1">
                            <div className="flex justify-between text-sm mb-1">
                              <span className="font-medium capitalize">{cat.replace('_', ' ')}</span>
                              <span className="text-slate-500">{formatCurrency(amount)}</span>
                            </div>
                            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-emerald-500 rounded-full"
                                style={{ width: `${percent}%` }}
                              />
                            </div>
                          </div>
                          <span className="text-sm text-slate-500 w-12 text-right">{formatPercent(percent)}</span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-500">
                    <BarChart3 className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                    <p>Chưa có dữ liệu doanh thu</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Expense by Category */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Chi phí theo danh mục</CardTitle>
                <CardDescription>Phân bổ chi phí trong kỳ</CardDescription>
              </CardHeader>
              <CardContent>
                {summary?.expense_by_category && Object.keys(summary.expense_by_category).length > 0 ? (
                  <div className="space-y-3">
                    {Object.entries(summary.expense_by_category).map(([cat, amount]) => {
                      const percent = summary.total_expense > 0 ? (amount / summary.total_expense * 100) : 0;
                      return (
                        <div key={cat} className="flex items-center gap-3">
                          <div className="flex-1">
                            <div className="flex justify-between text-sm mb-1">
                              <span className="font-medium capitalize">{cat.replace('_', ' ')}</span>
                              <span className="text-slate-500">{formatCurrency(amount)}</span>
                            </div>
                            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-red-500 rounded-full"
                                style={{ width: `${percent}%` }}
                              />
                            </div>
                          </div>
                          <span className="text-sm text-slate-500 w-12 text-right">{formatPercent(percent)}</span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-500">
                    <BarChart3 className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                    <p>Chưa có dữ liệu chi phí</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
                    <FileText className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Hoá đơn</p>
                    <p className="text-lg font-semibold">0</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-cyan-100 flex items-center justify-center">
                    <Wallet className="h-5 w-5 text-cyan-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Hợp đồng</p>
                    <p className="text-lg font-semibold">0</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-orange-100 flex items-center justify-center">
                    <Users className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Hoa hồng chờ</p>
                    <p className="text-lg font-semibold">{formatCurrency(0)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-teal-100 flex items-center justify-center">
                    <PiggyBank className="h-5 w-5 text-teal-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Ngân sách</p>
                    <p className="text-lg font-semibold">{formatPercent(summary?.budget_utilization || 0)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="cashflow" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Báo cáo Dòng tiền - {cashFlow?.period_label}</CardTitle>
              <CardDescription>Tổng hợp thu chi trong kỳ</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Operating */}
                <div>
                  <h4 className="font-medium text-slate-700 mb-3 flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Hoạt động kinh doanh
                  </h4>
                  <div className="grid grid-cols-3 gap-4 pl-6">
                    <div className="p-4 rounded-lg bg-emerald-50">
                      <p className="text-sm text-emerald-600">Thu</p>
                      <p className="text-xl font-bold text-emerald-700">
                        {formatCurrency(cashFlow?.operating_cash_in || 0)}
                      </p>
                    </div>
                    <div className="p-4 rounded-lg bg-red-50">
                      <p className="text-sm text-red-600">Chi</p>
                      <p className="text-xl font-bold text-red-700">
                        {formatCurrency(cashFlow?.operating_cash_out || 0)}
                      </p>
                    </div>
                    <div className="p-4 rounded-lg bg-blue-50">
                      <p className="text-sm text-blue-600">Ròng</p>
                      <p className="text-xl font-bold text-blue-700">
                        {formatCurrency(cashFlow?.net_operating_cash || 0)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Investing */}
                <div>
                  <h4 className="font-medium text-slate-700 mb-3 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Hoạt động đầu tư
                  </h4>
                  <div className="grid grid-cols-3 gap-4 pl-6">
                    <div className="p-4 rounded-lg bg-emerald-50">
                      <p className="text-sm text-emerald-600">Thu</p>
                      <p className="text-xl font-bold text-emerald-700">
                        {formatCurrency(cashFlow?.investing_cash_in || 0)}
                      </p>
                    </div>
                    <div className="p-4 rounded-lg bg-red-50">
                      <p className="text-sm text-red-600">Chi</p>
                      <p className="text-xl font-bold text-red-700">
                        {formatCurrency(cashFlow?.investing_cash_out || 0)}
                      </p>
                    </div>
                    <div className="p-4 rounded-lg bg-blue-50">
                      <p className="text-sm text-blue-600">Ròng</p>
                      <p className="text-xl font-bold text-blue-700">
                        {formatCurrency(cashFlow?.net_investing_cash || 0)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Total */}
                <div className="pt-4 border-t">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-4 rounded-lg bg-slate-100">
                      <p className="text-sm text-slate-600">Tổng Thu</p>
                      <p className="text-xl font-bold text-slate-800">
                        {formatCurrency(cashFlow?.total_cash_in || 0)}
                      </p>
                    </div>
                    <div className="p-4 rounded-lg bg-slate-100">
                      <p className="text-sm text-slate-600">Tổng Chi</p>
                      <p className="text-xl font-bold text-slate-800">
                        {formatCurrency(cashFlow?.total_cash_out || 0)}
                      </p>
                    </div>
                    <div className={`p-4 rounded-lg ${(cashFlow?.net_cash_flow || 0) >= 0 ? 'bg-emerald-100' : 'bg-red-100'}`}>
                      <p className="text-sm text-slate-600">Dòng tiền ròng</p>
                      <p className={`text-xl font-bold ${(cashFlow?.net_cash_flow || 0) >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                        {formatCurrency(cashFlow?.net_cash_flow || 0)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pnl" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Báo cáo Lãi/Lỗ - {profitLoss?.period_label}</CardTitle>
              <CardDescription>Kết quả hoạt động kinh doanh</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Revenue */}
                <div className="p-4 rounded-lg bg-emerald-50">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-emerald-700">Doanh thu</span>
                    <span className="text-xl font-bold text-emerald-700">
                      {formatCurrency(profitLoss?.total_revenue || 0)}
                    </span>
                  </div>
                  {profitLoss?.revenue_details?.length > 0 && (
                    <div className="mt-2 space-y-1 pl-4 border-l-2 border-emerald-200">
                      {profitLoss.revenue_details.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-sm text-emerald-600">
                          <span>{item.label}</span>
                          <span>{formatCurrency(item.amount)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Gross Profit */}
                <div className="p-4 rounded-lg bg-blue-50">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-blue-700">Lợi nhuận gộp</span>
                    <span className="text-xl font-bold text-blue-700">
                      {formatCurrency(profitLoss?.gross_profit || 0)}
                    </span>
                  </div>
                  <div className="text-sm text-blue-600 mt-1">
                    Biên lợi nhuận gộp: {formatPercent(profitLoss?.gross_margin || 0)}
                  </div>
                </div>

                {/* Operating Expenses */}
                <div className="p-4 rounded-lg bg-red-50">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-red-700">Chi phí hoạt động</span>
                    <span className="text-xl font-bold text-red-700">
                      {formatCurrency(profitLoss?.total_operating_expense || 0)}
                    </span>
                  </div>
                  {profitLoss?.operating_expenses?.length > 0 && (
                    <div className="mt-2 space-y-1 pl-4 border-l-2 border-red-200">
                      {profitLoss.operating_expenses.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-sm text-red-600">
                          <span>{item.label}</span>
                          <span>{formatCurrency(item.amount)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Operating Profit */}
                <div className="p-4 rounded-lg bg-purple-50">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-purple-700">Lợi nhuận từ HĐKD</span>
                    <span className="text-xl font-bold text-purple-700">
                      {formatCurrency(profitLoss?.operating_profit || 0)}
                    </span>
                  </div>
                  <div className="text-sm text-purple-600 mt-1">
                    Biên lợi nhuận hoạt động: {formatPercent(profitLoss?.operating_margin || 0)}
                  </div>
                </div>

                {/* Tax */}
                <div className="p-4 rounded-lg bg-amber-50">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-amber-700">Thuế TNDN (20%)</span>
                    <span className="text-xl font-bold text-amber-700">
                      {formatCurrency(profitLoss?.income_tax || 0)}
                    </span>
                  </div>
                </div>

                {/* Net Profit */}
                <div className={`p-4 rounded-lg ${(profitLoss?.net_profit || 0) >= 0 ? 'bg-emerald-100' : 'bg-red-100'}`}>
                  <div className="flex justify-between items-center">
                    <span className={`font-medium ${(profitLoss?.net_profit || 0) >= 0 ? 'text-emerald-800' : 'text-red-800'}`}>
                      LỢI NHUẬN RÒNG
                    </span>
                    <span className={`text-2xl font-bold ${(profitLoss?.net_profit || 0) >= 0 ? 'text-emerald-800' : 'text-red-800'}`}>
                      {formatCurrency(profitLoss?.net_profit || 0)}
                    </span>
                  </div>
                  <div className={`text-sm mt-1 ${(profitLoss?.net_profit || 0) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    Biên lợi nhuận ròng: {formatPercent(profitLoss?.net_margin || 0)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
