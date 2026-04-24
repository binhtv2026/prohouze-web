/**
 * Analytics Page - Business Intelligence Dashboard
 * Prompt 16/20 - Advanced Reports & Analytics Engine
 * 
 * Replaces mock data with real Analytics API
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Target,
  Users,
  Building2,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Minus,
  RefreshCw,
  BarChart3,
} from 'lucide-react';
import analyticsApi from '../../api/analyticsApi';

const DEMO_KEY_METRICS = [
  { metric_code: 'REV_002', value: 18500000000, formatted_value: '18,5 tỷ', trend: 'up', change_percent: 12.4 },
  { metric_code: 'LEAD_001', value: 468, formatted_value: '468', trend: 'up', change_percent: 8.1 },
  { metric_code: 'SALES_002', value: 29, formatted_value: '29', trend: 'up', change_percent: 5.3 },
  { metric_code: 'INV_002', value: 126, formatted_value: '126', trend: 'down', change_percent: -3.2 },
];

const DEMO_FUNNEL_DATA = {
  funnel: {
    items: [
      { dimension_value: 'lead_moi', value: 210, percent: 100 },
      { dimension_value: 'da_lien_he', value: 154, percent: 73 },
      { dimension_value: 'tu_van', value: 88, percent: 42 },
      { dimension_value: 'booking', value: 35, percent: 17 },
      { dimension_value: 'chot', value: 18, percent: 9 },
    ],
  },
  summary: {
    total_input: 210,
    total_output: 18,
    conversion_rate: 8.6,
  },
};

const DEMO_REVENUE_TREND = {
  series: [
    { label: 'T1', value: 12500000000 },
    { label: 'T2', value: 14100000000 },
    { label: 'T3', value: 18500000000 },
  ],
};

// Format currency VND
const formatCurrency = (amount) => {
  if (!amount) return '0 đ';
  if (amount >= 1_000_000_000) return `${(amount / 1_000_000_000).toFixed(1)} tỷ`;
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(0)} tr`;
  return new Intl.NumberFormat('vi-VN').format(amount) + ' đ';
};

// Trend icon component
const TrendIcon = ({ trend, className = "h-4 w-4" }) => {
  if (trend === 'up') return <TrendingUp className={`${className} text-green-600`} />;
  if (trend === 'down') return <TrendingDown className={`${className} text-red-600`} />;
  return <Minus className={`${className} text-slate-400`} />;
};

// Period options
const PERIOD_OPTIONS = [
  { value: 'this_month', label: 'Tháng này' },
  { value: 'last_month', label: 'Tháng trước' },
  { value: 'this_quarter', label: 'Quý này' },
  { value: 'this_year', label: 'Năm nay' },
  { value: '30d', label: '30 ngày qua' },
  { value: '90d', label: '90 ngày qua' },
];

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [periodType, setPeriodType] = useState('this_month');
  const [keyMetrics, setKeyMetrics] = useState([]);
  const [funnelData, setFunnelData] = useState(null);
  const [revenueTrend, setRevenueTrend] = useState(null);
  const [error, setError] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [metricsRes, conversionRes, revenueTrendRes] = await Promise.all([
        analyticsApi.getKeyMetrics({ periodType, compare: true }),
        analyticsApi.getConversionReport(periodType),
        analyticsApi.getMetricTimeSeries('REV_002', { granularity: 'month', periodType: 'this_year' }),
      ]);

      if (metricsRes.success) {
        setKeyMetrics(metricsRes.data || []);
      }

      if (conversionRes.success) {
        setFunnelData(conversionRes.data);
      }

      if (revenueTrendRes.success) {
        setRevenueTrend(revenueTrendRes.data);
      }
    } catch (err) {
      console.error('Error loading analytics:', err);
      setKeyMetrics(DEMO_KEY_METRICS);
      setFunnelData(DEMO_FUNNEL_DATA);
      setRevenueTrend(DEMO_REVENUE_TREND);
      setError('Đang hiển thị dữ liệu mẫu do chưa kết nối được dữ liệu phân tích');
    } finally {
      setLoading(false);
    }
  }, [periodType]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Get metric by code
  const getMetricValue = (code) => {
    const metric = keyMetrics.find(m => m.metric_code === code);
    return metric || { value: 0, formatted_value: '0', trend: null, change_percent: null };
  };

  // Loading skeleton
  if (loading) {
    return (
      <div className="space-y-6" data-testid="analytics-page-loading">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="analytics-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Phân tích kinh doanh</h1>
          <p className="text-slate-500 text-sm mt-1">Phân tích chi tiết hiệu suất kinh doanh theo thời gian thực</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={periodType} onValueChange={setPeriodType}>
            <SelectTrigger className="w-40" data-testid="period-selector">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PERIOD_OPTIONS.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <button
            onClick={loadData}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            data-testid="refresh-button"
          >
            <RefreshCw className="h-5 w-5 text-slate-600" />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-lg">{error}</div>
      )}

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { code: 'REV_002', label: 'Doanh thu', icon: DollarSign, color: 'text-amber-600', bg: 'bg-amber-50' },
          { code: 'LEAD_001', label: 'Tổng Leads', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
          { code: 'SALES_002', label: 'Deals thắng', icon: Target, color: 'text-green-600', bg: 'bg-green-50' },
          { code: 'INV_002', label: 'Căn còn bán', icon: Building2, color: 'text-purple-600', bg: 'bg-purple-50' },
        ].map(item => {
          const metric = getMetricValue(item.code);
          const Icon = item.icon;
          return (
            <Card key={item.code} data-testid={`metric-card-${item.code}`}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-2 rounded-lg ${item.bg}`}>
                    <Icon className={`h-5 w-5 ${item.color}`} />
                  </div>
                  {metric.trend && (
                    <div className="flex items-center gap-1">
                      <TrendIcon trend={metric.trend} />
                      <span className={`text-sm font-medium ${
                        metric.trend === 'up' ? 'text-green-600' : 
                        metric.trend === 'down' ? 'text-red-600' : 'text-slate-500'
                      }`}>
                        {metric.change_percent ? `${metric.change_percent > 0 ? '+' : ''}${metric.change_percent}%` : ''}
                      </span>
                    </div>
                  )}
                </div>
                <p className="text-sm text-slate-500">{item.label}</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{metric.formatted_value}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Funnel Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-blue-600" />
            Phân tích Funnel bán hàng
          </CardTitle>
        </CardHeader>
        <CardContent>
          {funnelData?.funnel?.items?.length > 0 ? (
            <div className="space-y-3">
              {funnelData.funnel.items.map((item, i) => {
                const colors = ['bg-blue-500', 'bg-blue-400', 'bg-green-500', 'bg-amber-500', 'bg-purple-500', 'bg-green-600'];
                return (
                  <div key={i} className="flex items-center gap-4">
                    <div className="w-28 text-sm font-medium capitalize">
                      {item.dimension_value?.replace('_', ' ') || 'Unknown'}
                    </div>
                    <div className="flex-1">
                      <div className="h-8 bg-slate-100 rounded-lg overflow-hidden">
                        <div
                          className={`h-full ${colors[i % colors.length]} flex items-center justify-end pr-3 text-white text-sm font-medium transition-all duration-500`}
                          style={{ width: `${Math.max(item.percent || 0, 5)}%` }}
                        >
                          {item.value || 0}
                        </div>
                      </div>
                    </div>
                    <div className="w-16 text-right text-sm text-slate-500">{item.percent || 0}%</div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500">
              <BarChart3 className="h-12 w-12 mx-auto mb-3 text-slate-300" />
              <p>Chưa có dữ liệu funnel trong kỳ này</p>
            </div>
          )}
          
          {/* Conversion Summary */}
          {funnelData && (
            <div className="mt-6 pt-6 border-t grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-sm text-slate-500">Tổng Leads</p>
                <p className="text-xl font-bold text-slate-900">{funnelData.total_leads || 0}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-slate-500">Tỷ lệ chuyển đổi</p>
                <p className="text-xl font-bold text-green-600">{funnelData.conversion_rate || 0}%</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-slate-500">Tỷ lệ mất</p>
                <p className="text-xl font-bold text-red-600">{funnelData.loss_rate || 0}%</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Revenue Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-amber-600" />
            Xu hướng doanh thu theo tháng
          </CardTitle>
        </CardHeader>
        <CardContent>
          {revenueTrend?.data_points?.length > 0 ? (
            <>
              <div className="grid grid-cols-12 gap-2">
                {revenueTrend.data_points.slice(-12).map((item, i) => {
                  const maxValue = Math.max(...revenueTrend.data_points.map(d => d.value || 0));
                  const heightPercent = maxValue > 0 ? ((item.value || 0) / maxValue) * 100 : 0;
                  const monthLabel = item.date?.split('-')[1] || (i + 1);
                  return (
                    <div key={i} className="text-center">
                      <div className="h-32 flex items-end justify-center">
                        <div
                          className="w-full bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-lg transition-all duration-500"
                          style={{ height: `${Math.max(heightPercent, 2)}%` }}
                          title={formatCurrency(item.value || 0)}
                        />
                      </div>
                      <p className="text-xs text-slate-500 mt-2">T{monthLabel}</p>
                      <p className="text-xs font-medium">{formatCurrency(item.value || 0)}</p>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 pt-4 border-t flex justify-between text-sm">
                <span className="text-slate-500">Tổng: <span className="font-semibold text-slate-900">{formatCurrency(revenueTrend.total)}</span></span>
                <span className="text-slate-500">Trung bình: <span className="font-semibold text-slate-900">{formatCurrency(revenueTrend.average)}</span></span>
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-slate-500">
              <DollarSign className="h-12 w-12 mx-auto mb-3 text-slate-300" />
              <p>Chưa có dữ liệu doanh thu trong kỳ này</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lead Sources Breakdown */}
      {funnelData?.by_source?.items?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-green-600" />
              Phân bổ nguồn Lead
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {funnelData.by_source.items.map((item, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-32 text-sm font-medium capitalize">
                    {item.dimension_value?.replace('_', ' ') || 'Unknown'}
                  </div>
                  <div className="flex-1">
                    <Progress value={item.percent || 0} className="h-3" />
                  </div>
                  <div className="w-20 text-right">
                    <span className="text-sm font-medium">{item.value || 0}</span>
                    <span className="text-xs text-slate-500 ml-1">({item.percent || 0}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
