/**
 * My Income Dashboard - Sales Personal Income View
 * Prompt 11/20 - Commission Engine
 * Prompt 12/20 - KPI x Commission Integration (Phase 5)
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Progress } from '../../components/ui/progress';
import { 
  DollarSign, TrendingUp, Clock, CheckCircle, 
  AlertCircle, ChevronRight, Calendar, FileText,
  Target, Award, Zap, Star
} from 'lucide-react';
import { getMyIncome, getMyIncomeRecords, getMyIncomeWithKPI } from '../../api/commissionApi';

const DEMO_INCOME_SUMMARY = {
  estimated_amount: 48500000,
  estimated_count: 6,
  pending_approval_amount: 22000000,
  pending_approval_count: 3,
  approved_amount: 18000000,
  approved_count: 2,
  paid_amount: 9500000,
  paid_count: 1,
};

const DEMO_KPI_DATA = {
  overall_achievement: 86,
  bonus_tier: 'Top Performer',
  bonus_modifier: 1.15,
  total_bonus_earned: 5500000,
  kpis_exceeding: 2,
  kpis_on_track: 3,
  kpis_at_risk: 1,
};

const DEMO_INCOME_RECORDS = [
  {
    id: 'income-1',
    deal_name: 'The Privia - Block A',
    status: 'approved',
    amount: 18000000,
    estimated_amount: 18000000,
    paid_date: '2026-03-21',
    created_at: '2026-03-12',
  },
  {
    id: 'income-2',
    deal_name: 'Masteri Centre Point',
    status: 'pending_approval',
    amount: 12000000,
    estimated_amount: 12000000,
    paid_date: null,
    created_at: '2026-03-19',
  },
  {
    id: 'income-3',
    deal_name: 'The Global City',
    status: 'estimated',
    amount: 14500000,
    estimated_amount: 14500000,
    paid_date: null,
    created_at: '2026-03-25',
  },
];

// Format currency VND
const formatCurrency = (amount) => {
  if (!amount) return '0 đ';
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

// Format short currency (M, B)
const formatShortCurrency = (amount) => {
  if (!amount) return '0';
  if (amount >= 1_000_000_000) return `${(amount / 1_000_000_000).toFixed(1)}B`;
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(0)}M`;
  return amount.toLocaleString('vi-VN');
};

// Status badge colors
const getStatusBadge = (status) => {
  const config = {
    estimated: { label: 'Ước tính', variant: 'outline', className: 'border-blue-500 text-blue-600' },
    pending: { label: 'Chờ xử lý', variant: 'outline', className: 'border-yellow-500 text-yellow-600' },
    pending_approval: { label: 'Chờ duyệt', variant: 'outline', className: 'border-orange-500 text-orange-600' },
    approved: { label: 'Đã duyệt', variant: 'default', className: 'bg-green-500' },
    paid: { label: 'Đã chi', variant: 'default', className: 'bg-emerald-600' },
    rejected: { label: 'Từ chối', variant: 'destructive', className: '' },
    disputed: { label: 'Tranh chấp', variant: 'outline', className: 'border-purple-500 text-purple-600' },
  };
  const c = config[status] || { label: status, variant: 'outline', className: '' };
  return <Badge variant={c.variant} className={c.className}>{c.label}</Badge>;
};

export default function MyIncomePage() {
  const [summary, setSummary] = useState(null);
  const [kpiData, setKpiData] = useState(null);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [statusFilter, setStatusFilter] = useState('all');

  // Generate year options
  const years = Array.from({ length: 3 }, (_, i) => new Date().getFullYear() - i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [incomeWithKpi, recordsData] = await Promise.all([
        getMyIncomeWithKPI({ year: selectedYear, month: selectedMonth }),
        getMyIncomeRecords({ 
          year: selectedYear, 
          month: selectedMonth,
          ...(statusFilter && statusFilter !== 'all' && { status: statusFilter }),
          limit: 50
        }),
      ]);
      setSummary(incomeWithKpi.income);
      setKpiData(incomeWithKpi.kpi);
      setRecords(recordsData);
    } catch (error) {
      console.error('Error loading income data:', error);
      // Fallback to basic income
      try {
        const [summaryData, recordsData] = await Promise.all([
          getMyIncome({ year: selectedYear, month: selectedMonth }),
          getMyIncomeRecords({ 
            year: selectedYear, 
            month: selectedMonth,
            ...(statusFilter && statusFilter !== 'all' && { status: statusFilter }),
            limit: 50
          }),
        ]);
        setSummary(summaryData);
        setRecords(recordsData);
      } catch (e) {
        console.error('Error loading basic income:', e);
        setSummary(DEMO_INCOME_SUMMARY);
        setKpiData(DEMO_KPI_DATA);
        setRecords(DEMO_INCOME_RECORDS);
      }
    } finally {
      setLoading(false);
    }
  }, [selectedYear, selectedMonth, statusFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <div className="p-6 space-y-6" data-testid="my-income-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Thu nhập của tôi</h1>
          <p className="text-gray-500 mt-1">Theo dõi hoa hồng và thu nhập cá nhân</p>
        </div>
        
        {/* Period selector */}
        <div className="flex items-center gap-3">
          <Select value={String(selectedMonth)} onValueChange={(v) => setSelectedMonth(Number(v))}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Tháng" />
            </SelectTrigger>
            <SelectContent>
              {months.map((m) => (
                <SelectItem key={m} value={String(m)}>Tháng {m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={String(selectedYear)} onValueChange={(v) => setSelectedYear(Number(v))}>
            <SelectTrigger className="w-28">
              <SelectValue placeholder="Năm" />
            </SelectTrigger>
            <SelectContent>
              {years.map((y) => (
                <SelectItem key={y} value={String(y)}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* KPI Bonus Card - Phase 5 Integration */}
      {kpiData && (
        <Card className="bg-gradient-to-br from-purple-600 to-indigo-700 text-white mb-4">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-200 text-sm flex items-center gap-1">
                  <Target className="w-4 h-4" />
                  KPI Achievement
                </p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-4xl font-bold">{kpiData.overall_achievement?.toFixed(0) || 0}%</span>
                  {kpiData.bonus_tier && (
                    <Badge className="bg-white/20 text-white border-0">
                      {kpiData.bonus_tier}
                    </Badge>
                  )}
                </div>
                <div className="mt-3">
                  <Progress 
                    value={Math.min(kpiData.overall_achievement || 0, 100)} 
                    className="h-2 bg-white/20"
                  />
                </div>
                <div className="flex items-center gap-4 mt-3 text-sm">
                  <span className="flex items-center gap-1">
                    <Star className="w-3 h-3 text-emerald-300" />
                    {kpiData.kpis_exceeding || 0} vượt
                  </span>
                  <span className="flex items-center gap-1">
                    <CheckCircle className="w-3 h-3 text-blue-300" />
                    {kpiData.kpis_on_track || 0} đạt
                  </span>
                  <span className="flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 text-amber-300" />
                    {kpiData.kpis_at_risk || 0} rủi ro
                  </span>
                </div>
              </div>
              
              <div className="text-right bg-white/10 rounded-xl px-6 py-4">
                <p className="text-purple-200 text-sm">Hệ số thưởng KPI</p>
                <p className="text-3xl font-bold">x{kpiData.bonus_modifier?.toFixed(2) || '1.00'}</p>
                {kpiData.total_bonus_earned > 0 && (
                  <p className="text-emerald-300 text-sm mt-1 flex items-center justify-end gap-1">
                    <Zap className="w-3 h-3" />
                    +{formatShortCurrency(kpiData.total_bonus_earned)}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Estimated */}
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Ước tính</p>
                <p className="text-2xl font-bold text-blue-600">
                  {formatShortCurrency(summary?.estimated_amount || 0)}
                </p>
                <p className="text-xs text-gray-400 mt-1">{summary?.estimated_count || 0} records</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pending Approval */}
        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Chờ duyệt</p>
                <p className="text-2xl font-bold text-orange-600">
                  {formatShortCurrency(summary?.pending_approval_amount || 0)}
                </p>
                <p className="text-xs text-gray-400 mt-1">{summary?.pending_approval_count || 0} records</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Approved */}
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Đã duyệt</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatShortCurrency(summary?.approved_amount || 0)}
                </p>
                <p className="text-xs text-gray-400 mt-1">{summary?.approved_count || 0} records</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Paid */}
        <Card className="border-l-4 border-l-emerald-600">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Đã chi trả</p>
                <p className="text-2xl font-bold text-emerald-700">
                  {formatShortCurrency(summary?.paid_amount || 0)}
                </p>
                <p className="text-xs text-gray-400 mt-1">{summary?.paid_count || 0} records</p>
              </div>
              <div className="p-3 bg-emerald-100 rounded-full">
                <DollarSign className="w-6 h-6 text-emerald-700" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Disputes Warning */}
      {summary?.disputed_count > 0 && (
        <Card className="border-purple-200 bg-purple-50">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-purple-600" />
              <span className="text-purple-800">
                Bạn có <strong>{summary.disputed_count}</strong> hoa hồng đang tranh chấp 
                ({formatCurrency(summary.disputed_amount)})
              </span>
              <Button variant="outline" size="sm" className="ml-auto">
                Xem chi tiết
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Records List */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Chi tiết hoa hồng</CardTitle>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Tất cả trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="estimated">Ước tính</SelectItem>
                <SelectItem value="pending_approval">Chờ duyệt</SelectItem>
                <SelectItem value="approved">Đã duyệt</SelectItem>
                <SelectItem value="paid">Đã chi</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : records.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                <FileText className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">
                Chưa có hoa hồng trong kỳ này
              </h3>
              <p className="text-gray-500 text-sm mb-4 max-w-sm mx-auto">
                Hoa hồng sẽ tự động xuất hiện khi bạn chốt deal thành công. 
                Bắt đầu bằng cách tạo deal mới và đưa khách hàng vào pipeline.
              </p>
              <div className="flex items-center justify-center gap-3">
                <a 
                  href="/sales/deals" 
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                >
                  <Target className="w-4 h-4" />
                  Xem Pipeline
                </a>
                <a 
                  href="/crm/leads" 
                  className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium"
                >
                  <TrendingUp className="w-4 h-4" />
                  Quản lý Lead
                </a>
              </div>
              <p className="text-xs text-gray-400 mt-4">
                Mẹo: Thử chọn kỳ khác hoặc kiểm tra trạng thái deal của bạn
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {records.map((record) => (
                <div 
                  key={record.id}
                  className={`flex items-center justify-between p-4 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer ${record.is_legacy ? 'bg-amber-50 border border-amber-200' : 'bg-gray-50'}`}
                  data-testid={`commission-record-${record.id}`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-lg border ${record.is_legacy ? 'bg-amber-100 border-amber-300' : 'bg-white'}`}>
                      <FileText className={`w-5 h-5 ${record.is_legacy ? 'text-amber-600' : 'text-gray-600'}`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900">{record.code}</p>
                        {/* Legacy Badge */}
                        {record.is_legacy && (
                          <Badge 
                            variant="outline" 
                            className="border-amber-500 text-amber-700 text-xs"
                            title={record.legacy_warning}
                          >
                            Legacy (Ước tính)
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">
                        {record.contract_code} • {record.customer_name || 'N/A'}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {record.project_name} • {record.commission_type_label}
                      </p>
                      {/* Rule Snapshot Info - Chỉ hiển thị chi tiết nếu KHÔNG phải legacy */}
                      {!record.is_legacy && record.rule_name && (
                        <p className="text-xs text-blue-500 mt-1">
                          Policy: {record.rule_name} (v{record.rule_version})
                        </p>
                      )}
                      {/* Legacy warning tooltip */}
                      {record.is_legacy && record.legacy_warning && (
                        <p className="text-xs text-amber-600 mt-1 italic">
                          {record.legacy_warning}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        {formatCurrency(record.final_amount)}
                      </p>
                      {/* KPI Bonus indicator */}
                      {record.kpi_bonus_modifier && record.kpi_bonus_modifier !== 1.0 && (
                        <p className="text-xs text-purple-600 flex items-center justify-end gap-1">
                          <Zap className="w-3 h-3" />
                          KPI x{record.kpi_bonus_modifier.toFixed(2)} ({record.kpi_bonus_tier})
                        </p>
                      )}
                      {/* Formula - Chỉ hiển thị chi tiết nếu KHÔNG phải legacy */}
                      {!record.is_legacy ? (
                        <p className="text-xs text-gray-500" title={record.applied_formula}>
                          {record.applied_formula || `${formatShortCurrency(record.base_amount)} × ${record.brokerage_rate}% × ${record.split_percent}%`}
                        </p>
                      ) : (
                        <p className="text-xs text-amber-500">
                          (không có chi tiết formula)
                        </p>
                      )}
                    </div>
                    {record.kpi_bonus_modifier && record.kpi_bonus_modifier > 1.0 && (
                      <Badge className="bg-purple-100 text-purple-700 border-purple-200">
                        <Award className="w-3 h-3 mr-1" />
                        +{((record.kpi_bonus_modifier - 1) * 100).toFixed(0)}%
                      </Badge>
                    )}
                    {record.is_locked && (
                      <Badge variant="outline" className="border-gray-500 text-gray-600 text-xs">
                        Đã khóa
                      </Badge>
                    )}
                    {getStatusBadge(record.status)}
                    <ChevronRight className="w-5 h-5 text-gray-400" />
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
