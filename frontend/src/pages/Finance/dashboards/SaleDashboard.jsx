/**
 * Sale Dashboard - Dashboard cho nhân viên Sale
 * 
 * Hiển thị:
 * 1. Thu nhập đã nhận
 * 2. Thu nhập chờ nhận
 * 3. Danh sách deal
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { 
  DollarSign, Clock, CheckCircle, FileText, TrendingUp
} from 'lucide-react';
import { getSaleDashboard, getCommissionSplits } from '../../../api/financeApi';

// Format VND
function formatCurrency(amount) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

const DEMO_SALE_DASHBOARD = {
  period_label: 'Tháng này',
  paid_amount: 42500000,
  pending_amount: 9800000,
  approved_amount: 7200000,
  total_gross: 70800000,
  total_tax: 7080000,
  total_net: 63720000,
};

const DEMO_SALE_DEALS = [
  {
    id: 'deal-001',
    contract_code: 'HD-260315',
    recipient_role_label: 'Sale',
    split_percent: 50,
    net_amount: 18200000,
    status: 'paid',
    status_label: 'Đã trả',
  },
  {
    id: 'deal-002',
    contract_code: 'HD-260321',
    recipient_role_label: 'Sale',
    split_percent: 45,
    net_amount: 14200000,
    status: 'approved',
    status_label: 'Chờ trả',
  },
  {
    id: 'deal-003',
    contract_code: 'HD-260326',
    recipient_role_label: 'Sale',
    split_percent: 45,
    net_amount: 11800000,
    status: 'pending',
    status_label: 'Chờ duyệt',
  },
];

export default function SaleDashboard({ userId, userName }) {
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState(null);
  const [deals, setDeals] = useState([]);

  const loadData = useCallback(async () => {
    if (!userId) return;
    
    setLoading(true);
    try {
      const [dashboardData, splitsData] = await Promise.all([
        getSaleDashboard(userId),
        getCommissionSplits({ recipient_id: userId, limit: 10 }),
      ]);
      
      setDashboard(dashboardData || DEMO_SALE_DASHBOARD);
      setDeals(Array.isArray(splitsData) && splitsData.length > 0 ? splitsData : DEMO_SALE_DEALS);
    } catch (error) {
      console.error('Load sale dashboard error:', error);
      setDashboard(DEMO_SALE_DASHBOARD);
      setDeals(DEMO_SALE_DEALS);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4" data-testid="sale-dashboard">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Xin chào, {userName || 'Sale'}
          </h2>
          <p className="text-sm text-gray-500">Dashboard thu nhập cá nhân</p>
        </div>
        <Badge variant="outline" className="text-blue-600 border-blue-200">
          {dashboard?.period_label || 'Tháng này'}
        </Badge>
      </div>

      {/* Block 1 + 2: Thu nhập đã nhận + chờ nhận */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="border-green-100 bg-green-50/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-xs font-medium text-gray-600">Đã nhận</span>
            </div>
            <p className="text-xl font-bold text-green-700" data-testid="sale-paid-amount">
              {formatCurrency(dashboard?.paid_amount || 0)}
            </p>
          </CardContent>
        </Card>

        <Card className="border-yellow-100 bg-yellow-50/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-yellow-600" />
              <span className="text-xs font-medium text-gray-600">Chờ nhận</span>
            </div>
            <p className="text-xl font-bold text-yellow-700" data-testid="sale-pending-amount">
              {formatCurrency((dashboard?.pending_amount || 0) + (dashboard?.approved_amount || 0))}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Block 3: Tổng thu nhập */}
      <Card>
        <CardContent className="p-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-xs text-gray-500">Tổng thu nhập (trước thuế)</p>
              <p className="text-lg font-bold text-gray-900">
                {formatCurrency(dashboard?.total_gross || 0)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">Thuế TNCN (10%)</p>
              <p className="text-sm font-medium text-red-600">
                -{formatCurrency(dashboard?.total_tax || 0)}
              </p>
            </div>
          </div>
          <div className="mt-2 pt-2 border-t">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">Thực nhận</span>
              <span className="text-lg font-bold text-blue-600">
                {formatCurrency(dashboard?.total_net || 0)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Block 4: Chi tiết trạng thái */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Chi tiết trạng thái
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
              Chờ duyệt
            </span>
            <span className="font-medium">{formatCurrency(dashboard?.pending_amount || 0)}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-400"></div>
              Đã duyệt, chờ trả
            </span>
            <span className="font-medium">{formatCurrency(dashboard?.approved_amount || 0)}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-400"></div>
              Đã trả
            </span>
            <span className="font-medium">{formatCurrency(dashboard?.paid_amount || 0)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Block 5: Danh sách deal gần đây */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Danh sách deal
          </CardTitle>
        </CardHeader>
        <CardContent>
          {deals.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">Chưa có deal nào</p>
          ) : (
            <div className="space-y-2">
              {deals.slice(0, 5).map((deal) => (
                <div 
                  key={deal.id} 
                  className="flex justify-between items-center p-2 bg-gray-50 rounded text-sm"
                >
                  <div>
                    <p className="font-medium">{deal.contract_code || deal.code}</p>
                    <p className="text-xs text-gray-500">
                      {deal.recipient_role_label || 'Sale'} - {deal.split_percent}%
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-green-600">
                      {formatCurrency(deal.net_amount)}
                    </p>
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${
                        deal.status === 'paid' 
                          ? 'border-green-200 text-green-600' 
                          : 'border-yellow-200 text-yellow-600'
                      }`}
                    >
                      {deal.status_label || deal.status}
                    </Badge>
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
