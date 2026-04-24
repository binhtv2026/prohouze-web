/**
 * Accountant Dashboard - Dashboard cho Kế toán
 * 
 * Hiển thị:
 * 1. Payout pending (cần duyệt)
 * 2. Công nợ
 * 3. Thuế
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { 
  Clock, CreditCard, FileText, CheckCircle, AlertTriangle, DollarSign
} from 'lucide-react';
import { 
  getPayoutsSummary, 
  getReceivablesSummary, 
  getTaxDashboard,
  getPayouts,
  approvePayout
} from '../../../api/financeApi';

// Format VND
function formatCurrency(amount) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

export default function AccountantDashboard() {
  const [loading, setLoading] = useState(true);
  const [payoutsSummary, setPayoutsSummary] = useState(null);
  const [receivablesSummary, setReceivablesSummary] = useState(null);
  const [taxSummary, setTaxSummary] = useState(null);
  const [pendingPayouts, setPendingPayouts] = useState([]);
  const [approving, setApproving] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const now = new Date();
      const [payouts, receivables, tax, pending] = await Promise.all([
        getPayoutsSummary(),
        getReceivablesSummary(),
        getTaxDashboard(now.getMonth() + 1, now.getFullYear()),
        getPayouts({ status: 'pending', limit: 10 }),
      ]);
      
      setPayoutsSummary(payouts);
      setReceivablesSummary(receivables);
      setTaxSummary(tax);
      setPendingPayouts(pending || []);
    } catch (error) {
      console.error('Load accountant dashboard error:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(payoutId) {
    setApproving(payoutId);
    try {
      await approvePayout(payoutId);
      // Refresh data
      loadData();
    } catch (error) {
      console.error('Approve error:', error);
      alert('Lỗi khi duyệt: ' + (error.message || 'Unknown error'));
    } finally {
      setApproving(null);
    }
  }

  const pendingCount = payoutsSummary?.by_status?.pending?.count || 0;
  const pendingAmount = payoutsSummary?.by_status?.pending?.net_amount || 0;
  const overdueReceivables = receivablesSummary?.by_status?.overdue?.count || 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4" data-testid="accountant-dashboard">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Dashboard Kế toán</h2>
          <p className="text-sm text-gray-500">Quản lý chi trả, công nợ và thuế</p>
        </div>
        <Badge variant="outline" className="text-orange-600 border-orange-200">
          {pendingCount} cần duyệt
        </Badge>
      </div>

      {/* Block 1: Payout pending - CẦN DUYỆT NGAY */}
      <Card className={`border-2 ${pendingCount > 0 ? 'border-orange-300 bg-orange-50' : 'border-gray-100'}`}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Clock className="w-4 h-4 text-orange-500" />
            Payout chờ duyệt
            {pendingCount > 0 && (
              <Badge className="bg-orange-500 text-white text-xs">
                {pendingCount}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-2xl font-bold text-orange-700" data-testid="accountant-pending-amount">
                {formatCurrency(pendingAmount)}
              </p>
              <p className="text-xs text-gray-500">{pendingCount} payout chờ duyệt</p>
            </div>
            {pendingCount > 0 && (
              <a 
                href="/finance/payouts"
                className="px-3 py-1.5 bg-orange-500 text-white text-sm font-medium rounded hover:bg-orange-600"
              >
                Duyệt ngay
              </a>
            )}
          </div>

          {/* Quick approve list */}
          {pendingPayouts.length > 0 && (
            <div className="space-y-2 border-t pt-3">
              {pendingPayouts.slice(0, 3).map((payout) => (
                <div 
                  key={payout.id} 
                  className="flex justify-between items-center p-2 bg-white rounded border"
                >
                  <div>
                    <p className="text-sm font-medium">{payout.recipient_name || 'N/A'}</p>
                    <p className="text-xs text-gray-500">{payout.code}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-green-600">
                      {formatCurrency(payout.net_amount)}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs"
                      disabled={approving === payout.id}
                      onClick={() => handleApprove(payout.id)}
                    >
                      {approving === payout.id ? '...' : 'Duyệt'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Block 2: Công nợ */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <CreditCard className="w-4 h-4" />
            Công nợ chủ đầu tư
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-2 mb-3">
            <div className="text-center p-2 bg-blue-50 rounded">
              <p className="text-xs text-gray-500">Phải thu</p>
              <p className="text-sm font-bold text-blue-600">
                {formatCurrency(receivablesSummary?.total_due || 0)}
              </p>
            </div>
            <div className="text-center p-2 bg-green-50 rounded">
              <p className="text-xs text-gray-500">Đã thu</p>
              <p className="text-sm font-bold text-green-600">
                {formatCurrency(receivablesSummary?.total_paid || 0)}
              </p>
            </div>
            <div className="text-center p-2 bg-red-50 rounded">
              <p className="text-xs text-gray-500">Quá hạn</p>
              <p className="text-sm font-bold text-red-600" data-testid="accountant-overdue">
                {overdueReceivables}
              </p>
            </div>
          </div>

          {overdueReceivables > 0 && (
            <div className="flex items-center gap-2 p-2 bg-red-50 rounded border border-red-200">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              <span className="text-xs text-red-700">
                {overdueReceivables} công nợ quá hạn cần xử lý
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Block 3: Thuế */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Thuế {taxSummary?.period_label || 'tháng này'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">VAT đầu ra</span>
              <span className="font-medium text-blue-600" data-testid="accountant-vat">
                {formatCurrency(taxSummary?.vat_output || 0)}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Thuế TNCN tổng</span>
              <span className="font-medium text-orange-600">
                {formatCurrency(taxSummary?.tncn_total || 0)}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm pt-2 border-t">
              <span className="text-gray-600">TNDN ước tính</span>
              <span className="font-medium text-red-600">
                {formatCurrency(taxSummary?.tndn_estimate || 0)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Block 4: Quick stats */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="border-green-100">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <div>
                <p className="text-xs text-gray-500">Đã duyệt hôm nay</p>
                <p className="text-lg font-bold text-green-700">
                  {payoutsSummary?.by_status?.approved?.count || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-100">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-blue-600" />
              <div>
                <p className="text-xs text-gray-500">Đã chi trả</p>
                <p className="text-lg font-bold text-blue-700">
                  {formatCurrency(payoutsSummary?.by_status?.paid?.net_amount || 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Block 5: Quick actions */}
      <Card className="bg-gray-50">
        <CardContent className="p-3">
          <div className="flex flex-wrap gap-2">
            <a 
              href="/finance/receivables"
              className="px-3 py-1.5 bg-white text-sm text-blue-600 rounded border hover:bg-blue-50"
            >
              Xem công nợ
            </a>
            <a 
              href="/finance/payouts"
              className="px-3 py-1.5 bg-white text-sm text-green-600 rounded border hover:bg-green-50"
            >
              Quản lý chi trả
            </a>
            <a 
              href="/finance/invoices"
              className="px-3 py-1.5 bg-white text-sm text-purple-600 rounded border hover:bg-purple-50"
            >
              Xuất hóa đơn
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
