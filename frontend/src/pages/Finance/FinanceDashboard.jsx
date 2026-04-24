/**
 * Finance Dashboard - Tổng quan Tài chính
 * Dashboard THEO ROLE: Sale, Leader, CEO, Accountant
 * AUTO FLOW ENGINE enabled
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Badge } from '../../components/ui/badge';
import { 
  DollarSign, TrendingUp, CreditCard, FileText, Users, 
  AlertTriangle, CheckCircle, Clock, ArrowUp, ArrowDown, Zap
} from 'lucide-react';
import {
  getCEODashboard,
  getSaleDashboard,
  getTaxDashboard,
  getReceivablesSummary,
  getPayoutsSummary,
  getFlowStatistics,
} from '../../api/financeApi';
import FinanceAlerts from './FinanceAlerts';

// Import Role-based Dashboards
import { 
  SaleDashboard, 
  LeaderDashboard, 
  CEODashboard as CEODashboardComponent, 
  AccountantDashboard 
} from './dashboards';

const DEMO_CEO_DASHBOARD = {
  revenue: 12850000000,
  profit: 2860000000,
  collection_rate: 74.5,
  overdue_amount: 420000000,
};

const DEMO_TAX_DASHBOARD = {
  period_label: `Tháng ${new Date().getMonth() + 1}/${new Date().getFullYear()}`,
  vat_output: 185000000,
  tncn_total: 92000000,
  tndn_estimate: 318000000,
};

const DEMO_RECEIVABLES = {
  total_due: 5450000000,
  total_paid: 4060000000,
  by_status: {
    pending: { count: 8, amount_remaining: 760000000 },
    overdue: { count: 3, amount_remaining: 290000000 },
  },
};

const DEMO_PAYOUTS = {
  total_net: 1180000000,
  total_tax: 74000000,
  by_status: {
    pending: { count: 6, net_amount: 265000000 },
    approved: { count: 4, net_amount: 198000000 },
    paid: { count: 12, net_amount: 717000000 },
  },
};

// Format số tiền VND
function formatCurrency(amount) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

// Format phần trăm
function formatPercent(value) {
  return `${(value || 0).toFixed(1)}%`;
}

// Component thẻ metric
function MetricCard({ title, value, icon: Icon, trend, trendValue, color = 'blue', subValue, subLabel }) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    green: 'bg-green-50 text-green-600 border-green-100',
    yellow: 'bg-yellow-50 text-yellow-600 border-yellow-100',
    red: 'bg-red-50 text-red-600 border-red-100',
    purple: 'bg-purple-50 text-purple-600 border-purple-100',
  };

  return (
    <Card className={`border ${colorClasses[color]}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{title}</p>
            <p className="text-xl font-bold text-gray-900">{value}</p>
            {subValue !== undefined && (
              <p className="text-xs text-gray-500">
                {subLabel}: <span className="font-medium">{subValue}</span>
              </p>
            )}
          </div>
          <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
            <Icon className="w-5 h-5" />
          </div>
        </div>
        {trend && (
          <div className="mt-2 flex items-center text-xs">
            {trend === 'up' ? (
              <ArrowUp className="w-3 h-3 text-green-500 mr-1" />
            ) : (
              <ArrowDown className="w-3 h-3 text-red-500 mr-1" />
            )}
            <span className={trend === 'up' ? 'text-green-600' : 'text-red-600'}>
              {trendValue}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Component Progress Bar
function ProgressBar({ label, current, total, color = 'blue' }) {
  const percent = total > 0 ? (current / total) * 100 : 0;
  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    red: 'bg-red-500',
  };

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-gray-600">{label}</span>
        <span className="font-medium">{formatCurrency(current)} / {formatCurrency(total)}</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div 
          className={`h-full ${colorClasses[color]} transition-all`}
          style={{ width: `${Math.min(percent, 100)}%` }}
        />
      </div>
    </div>
  );
}

// Receivables Summary Component
function ReceivablesSummary({ data }) {
  if (!data) return null;

  const byStatus = data.by_status || {};
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <CreditCard className="w-4 h-4" />
          Công nợ phải thu
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="text-center p-2 bg-blue-50 rounded">
            <p className="text-xs text-gray-500">Tổng phải thu</p>
            <p className="text-sm font-bold text-blue-600">{formatCurrency(data.total_due)}</p>
          </div>
          <div className="text-center p-2 bg-green-50 rounded">
            <p className="text-xs text-gray-500">Đã thu</p>
            <p className="text-sm font-bold text-green-600">{formatCurrency(data.total_paid)}</p>
          </div>
        </div>
        
        <ProgressBar 
          label="Tiến độ thu" 
          current={data.total_paid} 
          total={data.total_due}
          color="green"
        />

        <div className="space-y-1">
          {byStatus.pending && (
            <div className="flex justify-between text-xs">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-yellow-500" />
                Chờ xác nhận
              </span>
              <span>{byStatus.pending.count} ({formatCurrency(byStatus.pending.amount_remaining)})</span>
            </div>
          )}
          {byStatus.overdue && (
            <div className="flex justify-between text-xs text-red-600">
              <span className="flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                Quá hạn
              </span>
              <span>{byStatus.overdue.count} ({formatCurrency(byStatus.overdue.amount_remaining)})</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Payouts Summary Component
function PayoutsSummary({ data }) {
  if (!data) return null;

  const byStatus = data.by_status || {};
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Users className="w-4 h-4" />
          Chi trả nội bộ
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="text-center p-2 bg-purple-50 rounded">
            <p className="text-xs text-gray-500">Tổng chi trả</p>
            <p className="text-sm font-bold text-purple-600">{formatCurrency(data.total_net)}</p>
          </div>
          <div className="text-center p-2 bg-red-50 rounded">
            <p className="text-xs text-gray-500">Thuế TNCN</p>
            <p className="text-sm font-bold text-red-600">{formatCurrency(data.total_tax)}</p>
          </div>
        </div>

        <div className="space-y-1">
          {byStatus.pending && (
            <div className="flex justify-between text-xs">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-yellow-500" />
                Chờ duyệt
              </span>
              <Badge variant="outline" className="text-xs">
                {byStatus.pending.count} - {formatCurrency(byStatus.pending.net_amount)}
              </Badge>
            </div>
          )}
          {byStatus.approved && (
            <div className="flex justify-between text-xs">
              <span className="flex items-center gap-1">
                <CheckCircle className="w-3 h-3 text-blue-500" />
                Đã duyệt
              </span>
              <Badge variant="outline" className="text-xs border-blue-200 text-blue-600">
                {byStatus.approved.count} - {formatCurrency(byStatus.approved.net_amount)}
              </Badge>
            </div>
          )}
          {byStatus.paid && (
            <div className="flex justify-between text-xs">
              <span className="flex items-center gap-1">
                <CheckCircle className="w-3 h-3 text-green-500" />
                Đã trả
              </span>
              <Badge variant="outline" className="text-xs border-green-200 text-green-600">
                {byStatus.paid.count} - {formatCurrency(byStatus.paid.net_amount)}
              </Badge>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Tax Summary Component
function TaxSummary({ data }) {
  if (!data) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <FileText className="w-4 h-4" />
          Thuế {data.period_label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex justify-between items-center py-2 border-b">
            <span className="text-sm text-gray-600">VAT đầu ra (10%)</span>
            <span className="font-semibold text-blue-600">{formatCurrency(data.vat_output)}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b">
            <span className="text-sm text-gray-600">Thuế TNCN tổng</span>
            <span className="font-semibold text-orange-600">{formatCurrency(data.tncn_total)}</span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-sm text-gray-600">TNDN ước tính (20%)</span>
            <span className="font-semibold text-red-600">{formatCurrency(data.tndn_estimate || 0)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Get current user from localStorage
function getCurrentUser() {
  try {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      return JSON.parse(userStr);
    }
  } catch (e) {
    console.error('Error parsing user:', e);
  }
  return null;
}

// Map role to dashboard type
function getDashboardType(role) {
  const roleMapping = {
    'sales': 'sale',
    'sale': 'sale',
    'manager': 'leader',
    'leader': 'leader',
    'accountant': 'accountant',
    'bod': 'ceo',
    'admin': 'ceo',
    'ceo': 'ceo',
  };
  return roleMapping[role?.toLowerCase()] || 'sale';
}

// Main Dashboard Component
export default function FinanceDashboard() {
  const [loading, setLoading] = useState(true);
  const [ceoDashboard, setCeoDashboard] = useState(null);
  const [taxDashboard, setTaxDashboard] = useState(null);
  const [receivablesSummary, setReceivablesSummary] = useState(null);
  const [payoutsSummary, setPayoutsSummary] = useState(null);
  
  // Get current user and determine dashboard type
  const currentUser = getCurrentUser();
  const userRole = currentUser?.role || 'sales';
  const dashboardType = getDashboardType(userRole);
  
  // Allow switching dashboard view (for demo/testing)
  const [viewMode, setViewMode] = useState(dashboardType);
  
  const now = new Date();
  const [periodMonth, setPeriodMonth] = useState(now.getMonth() + 1);
  const [periodYear, setPeriodYear] = useState(now.getFullYear());

  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const [ceo, tax, recv, pay] = await Promise.all([
        getCEODashboard(periodMonth, periodYear),
        getTaxDashboard(periodMonth, periodYear),
        getReceivablesSummary(),
        getPayoutsSummary(),
      ]);
      
      setCeoDashboard(ceo || DEMO_CEO_DASHBOARD);
      setTaxDashboard(tax || DEMO_TAX_DASHBOARD);
      setReceivablesSummary(recv || DEMO_RECEIVABLES);
      setPayoutsSummary(pay || DEMO_PAYOUTS);
    } catch (error) {
      console.error('Load dashboard error:', error);
      setCeoDashboard(DEMO_CEO_DASHBOARD);
      setTaxDashboard(DEMO_TAX_DASHBOARD);
      setReceivablesSummary(DEMO_RECEIVABLES);
      setPayoutsSummary(DEMO_PAYOUTS);
    } finally {
      setLoading(false);
    }
  }, [periodMonth, periodYear]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);
  
  // Render role-specific dashboard
  function renderRoleDashboard() {
    switch (viewMode) {
      case 'sale':
        return (
          <SaleDashboard 
            userId={currentUser?.id} 
            userName={currentUser?.full_name || currentUser?.name}
          />
        );
      case 'leader':
        return (
          <LeaderDashboard 
            userId={currentUser?.id}
            userName={currentUser?.full_name || currentUser?.name}
            teamId={currentUser?.team_id}
          />
        );
      case 'accountant':
        return <AccountantDashboard />;
      case 'ceo':
        return <CEODashboardComponent />;
      default:
        return null;
    }
  }

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

  const years = [2024, 2025, 2026].map(y => ({ value: y, label: y.toString() }));
  
  const viewModes = [
    { value: 'sale', label: 'Sale' },
    { value: 'leader', label: 'Leader' },
    { value: 'accountant', label: 'Kế toán' },
    { value: 'ceo', label: 'CEO' },
    { value: 'overview', label: 'Tổng quan' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4" data-testid="finance-dashboard">
      {/* Header with Role Selector */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Tài chính</h1>
          <p className="text-sm text-gray-500">
            Dashboard theo vai trò: {viewModes.find(v => v.value === viewMode)?.label || 'Tổng quan'}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Role Selector for Demo */}
          <Select value={viewMode} onValueChange={setViewMode}>
            <SelectTrigger className="w-28 h-8 text-xs">
              <SelectValue placeholder="Vai trò" />
            </SelectTrigger>
            <SelectContent>
              {viewModes.map(m => (
                <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Role-based Dashboard */}
      {viewMode !== 'overview' && (
        <div className="mb-4">
          {renderRoleDashboard()}
        </div>
      )}

      {/* Overview Mode - Show full dashboard */}
      {viewMode === 'overview' && (
        <>
          {/* CEO Metrics */}
          {ceoDashboard && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <MetricCard
                title="Giá trị HĐ"
                value={formatCurrency(ceoDashboard.total_contract_value)}
                icon={DollarSign}
                color="blue"
              />
              <MetricCard
                title="Tổng hoa hồng"
                value={formatCurrency(ceoDashboard.total_commission)}
                icon={TrendingUp}
                color="green"
              />
              <MetricCard
                title="Doanh thu"
                value={formatCurrency(ceoDashboard.total_revenue)}
                icon={DollarSign}
                color="purple"
                subValue={formatCurrency(ceoDashboard.vat_output)}
                subLabel="VAT"
              />
              <MetricCard
                title="Công nợ chưa thu"
                value={formatCurrency(ceoDashboard.receivable_pending)}
                icon={CreditCard}
                color={ceoDashboard.receivable_overdue > 0 ? 'red' : 'yellow'}
                subValue={formatCurrency(ceoDashboard.receivable_overdue)}
                subLabel="Quá hạn"
              />
            </div>
          )}

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <ReceivablesSummary data={receivablesSummary} />
            <PayoutsSummary data={payoutsSummary} />
            <TaxSummary data={taxDashboard} />
          </div>

          {/* Alerts */}
          <FinanceAlerts />

          {/* Quick Actions */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Zap className="w-4 h-4 text-yellow-500" />
                Thao tác nhanh
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <a href="/finance/receivables" className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100">
                  <CreditCard className="w-3 h-3" />
                  Xem công nợ
                </a>
                <a href="/finance/payouts" className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-green-50 text-green-600 rounded-full hover:bg-green-100">
                  <Users className="w-3 h-3" />
                  Duyệt chi trả
                </a>
                <a href="/finance/invoices" className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-purple-50 text-purple-600 rounded-full hover:bg-purple-100">
                  <FileText className="w-3 h-3" />
                  Xuất hóa đơn
                </a>
                <a href="/finance/commissions" className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-yellow-50 text-yellow-600 rounded-full hover:bg-yellow-100">
                  <TrendingUp className="w-3 h-3" />
                  Xem hoa hồng
                </a>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Auto Flow Info */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-100 p-4 rounded-lg">
        <div className="flex items-start gap-3">
          <Zap className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-sm text-blue-900">Auto Financial Flow Engine</h4>
            <p className="text-xs text-blue-700 mt-1">
              Hệ thống tự động: Contract → Payment → Commission → Split → Receivable → Payout
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Không cần nhập tay commission hay payout. Tất cả được tự động hóa qua event-driven flow.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
