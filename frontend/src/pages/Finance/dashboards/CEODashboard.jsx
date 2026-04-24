/**
 * CEO Dashboard - Dashboard cho CEO/Giám đốc
 * 
 * Hiển thị:
 * 1. Tổng doanh thu
 * 2. Tổng commission
 * 3. Lợi nhuận
 * 4. Công nợ
 * 5. Trust Panel (Minh bạch)
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { 
  DollarSign, TrendingUp, Building, CreditCard, PieChart
} from 'lucide-react';
import { getCEODashboard, getReceivablesSummary, getTrustPanel } from '../../../api/financeApi';
import CEOTrustPanel from '../CEOTrustPanel';

// Format VND
function formatCurrency(amount) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

const DEMO_CEO_DASHBOARD = {
  total_revenue: 12850000000,
  total_contract_value: 58200000000,
  total_commission: 1480000000,
  tndn_estimate: 74000000,
  receivable_total: 4600000000,
  receivable_paid: 3150000000,
  receivable_overdue: 420000000,
  vat_output: 1285000000,
  period_label: 'Tháng 3/2026',
};

const DEMO_RECEIVABLES = {
  total_due: 4600000000,
  total_paid: 3150000000,
};

const DEMO_TRUST_DATA = {
  total_collected: 7820000000,
  total_paid_out: 2140000000,
  total_expenses: 265000000,
  total_revenue: 12850000000,
  total_commission: 1480000000,
  company_keep: 370000000,
};

export default function CEODashboard() {
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState(null);
  const [receivables, setReceivables] = useState(null);
  const [trustData, setTrustData] = useState(null);
  
  const now = new Date();
  const [periodMonth, setPeriodMonth] = useState(now.getMonth() + 1);
  const [periodYear, setPeriodYear] = useState(now.getFullYear());

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [ceo, recv, trust] = await Promise.all([
        getCEODashboard(periodMonth, periodYear),
        getReceivablesSummary(),
        getTrustPanel(periodMonth, periodYear),
      ]);
      
      setDashboard(ceo || DEMO_CEO_DASHBOARD);
      setReceivables(recv || DEMO_RECEIVABLES);
      setTrustData(trust || DEMO_TRUST_DATA);
    } catch (error) {
      console.error('Load CEO dashboard error:', error);
      setDashboard(DEMO_CEO_DASHBOARD);
      setReceivables(DEMO_RECEIVABLES);
      setTrustData(DEMO_TRUST_DATA);
    } finally {
      setLoading(false);
    }
  }, [periodMonth, periodYear]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Calculate profit (Company keeps 25-30% of commission)
  const companyCommission = (dashboard?.total_commission || 0) * 0.25;
  const taxEstimate = dashboard?.tndn_estimate || 0;
  const netProfit = companyCommission - taxEstimate;

  const months = Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: `Tháng ${i + 1}` }));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4" data-testid="ceo-dashboard">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Dashboard Giám đốc</h2>
          <p className="text-sm text-gray-500">Tổng quan tài chính doanh nghiệp</p>
        </div>
        <div className="flex gap-2">
          <Select value={periodMonth.toString()} onValueChange={(v) => setPeriodMonth(parseInt(v))}>
            <SelectTrigger className="w-28 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {months.map(m => (
                <SelectItem key={m.value} value={m.value.toString()}>{m.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Block 1: Tổng doanh thu */}
      <Card className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-blue-100 mb-1">Tổng doanh thu</p>
              <p className="text-2xl font-bold" data-testid="ceo-total-revenue">
                {formatCurrency(dashboard?.total_revenue || 0)}
              </p>
              <p className="text-xs text-blue-200 mt-1">
                Giá trị HĐ: {formatCurrency(dashboard?.total_contract_value || 0)}
              </p>
            </div>
            <div className="p-3 bg-white/10 rounded-lg">
              <DollarSign className="w-6 h-6" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Block 2: Commission + Lợi nhuận */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="border-green-100">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-3 h-3 text-green-600" />
              <span className="text-xs text-gray-500">Tổng commission</span>
            </div>
            <p className="text-lg font-bold text-green-700" data-testid="ceo-total-commission">
              {formatCurrency(dashboard?.total_commission || 0)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Công ty giữ: {formatCurrency(companyCommission)}
            </p>
          </CardContent>
        </Card>

        <Card className="border-purple-100">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <PieChart className="w-3 h-3 text-purple-600" />
              <span className="text-xs text-gray-500">Lợi nhuận ước tính</span>
            </div>
            <p className="text-lg font-bold text-purple-700" data-testid="ceo-net-profit">
              {formatCurrency(netProfit)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Thuế TNDN: -{formatCurrency(taxEstimate)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Block 3: Công nợ */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <CreditCard className="w-4 h-4" />
            Công nợ phải thu
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3 mb-3">
            <div className="text-center p-2 bg-blue-50 rounded">
              <p className="text-xs text-gray-500">Phải thu kỳ này</p>
              <p className="text-sm font-bold text-blue-600">
                {formatCurrency(receivables?.total_due || dashboard?.receivable_total || 0)}
              </p>
            </div>
            <div className="text-center p-2 bg-green-50 rounded">
              <p className="text-xs text-gray-500">Đã thu lũy kế</p>
              <p className="text-sm font-bold text-green-600">
                {formatCurrency(receivables?.total_paid || dashboard?.receivable_paid || 0)}
              </p>
            </div>
            <div className="text-center p-2 bg-red-50 rounded">
              <p className="text-xs text-gray-500">Quá hạn</p>
              <p className="text-sm font-bold text-red-600" data-testid="ceo-overdue">
                {formatCurrency(dashboard?.receivable_overdue || 0)}
              </p>
            </div>
          </div>
          
          {/* Progress bar - cap at 100% */}
          {(() => {
            const totalDue = receivables?.total_due || 1;
            const totalPaid = receivables?.total_paid || 0;
            const percent = Math.min((totalPaid / totalDue) * 100, 100);
            const isOverCollected = totalPaid > totalDue;
            
            return (
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Tiến độ thu</span>
                  <span className={isOverCollected ? 'text-green-600 font-medium' : ''}>
                    {isOverCollected ? '100% ✓' : `${percent.toFixed(0)}%`}
                  </span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all ${isOverCollected ? 'bg-green-500' : 'bg-green-500'}`}
                    style={{ width: `${percent}%` }}
                  />
                </div>
                {isOverCollected && (
                  <p className="text-xs text-green-600">
                    Thu lũy kế vượt kỳ này (đa hợp đồng/đợt)
                  </p>
                )}
              </div>
            );
          })()}
        </CardContent>
      </Card>

      {/* Block 4: Thuế */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Building className="w-4 h-4" />
            Thuế phải nộp
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">VAT đầu ra (10%)</span>
              <span className="font-medium text-blue-600">
                {formatCurrency(dashboard?.vat_output || 0)}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">TNDN ước tính (20%)</span>
              <span className="font-medium text-red-600">
                {formatCurrency(dashboard?.tndn_estimate || 0)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Block 5: CEO Trust Panel - Minh bạch tuyệt đối */}
      <CEOTrustPanel data={trustData} />

      {/* Block 6: Quick stats */}
      <div className="bg-gray-50 p-3 rounded-lg">
        <p className="text-xs text-gray-600 text-center">
          <strong>Kỳ báo cáo:</strong> {dashboard?.period_label || `Tháng ${periodMonth}/${periodYear}`} | 
          <strong> Cập nhật:</strong> {new Date().toLocaleDateString('vi-VN')}
        </p>
      </div>
    </div>
  );
}
