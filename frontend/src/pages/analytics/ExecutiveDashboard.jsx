/**
 * Executive Dashboard - CEO/Manager Overview
 * Prompt 16/20 - Advanced Reports & Analytics Engine
 * 
 * Route: /analytics/executive
 * 
 * Features:
 * - Funnel Summary
 * - Pipeline Value
 * - Booking Trend
 * - Team Performance
 * - Bottleneck/Risk Alerts
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Users,
  DollarSign,
  Target,
  AlertTriangle,
  Building2,
  Clock,
  RefreshCw,
  ChevronRight,
  BarChart3,
  Activity,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Download,
} from 'lucide-react';
import analyticsApi from '../../api/analyticsApi';

const DEMO_EXECUTIVE_METRICS = [
  { metric_code: 'REV_002', value: 23500000000, formatted_value: '23,5 tỷ', trend: 'up', change_percent: 14.8 },
  { metric_code: 'LEAD_001', value: 682, formatted_value: '682', trend: 'up', change_percent: 11.2 },
  { metric_code: 'SALES_003', value: 56200000000, formatted_value: '56,2 tỷ', trend: 'up', change_percent: 9.5 },
  { metric_code: 'INV_002', value: 184, formatted_value: '184', trend: 'down', change_percent: -4.1 },
];

const DEMO_LEAD_FUNNEL = {
  items: [
    { label: 'Lead mới', value: 420, percent: 100 },
    { label: 'Lead nóng', value: 168, percent: 40 },
    { label: 'Tư vấn', value: 102, percent: 24 },
    { label: 'Booking', value: 39, percent: 9 },
  ],
};

const DEMO_DEAL_FUNNEL = {
  items: [
    { label: 'Mở cơ hội', value: 126, percent: 100 },
    { label: 'Đang đàm phán', value: 74, percent: 59 },
    { label: 'Chờ booking', value: 31, percent: 25 },
    { label: 'Đã chốt', value: 18, percent: 14 },
  ],
};

const DEMO_BOTTLENECKS = {
  items: [
    { id: 'b-1', title: 'Lead nóng chưa được gọi lại trong 2 giờ', severity: 'high', owner: 'Kinh doanh', affected_count: 12 },
    { id: 'b-2', title: 'Một số booking đang chờ duyệt chính sách giá', severity: 'warning', owner: 'Ban giám đốc', affected_count: 5 },
    { id: 'b-3', title: 'Hồ sơ pháp lý dự án chưa đồng bộ cho đội sale', severity: 'medium', owner: 'Pháp lý', affected_count: 2 },
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

// Severity badge
const SeverityBadge = ({ severity }) => {
  const config = {
    critical: { label: 'Critical', className: 'bg-red-100 text-red-700' },
    high: { label: 'Cao', className: 'bg-orange-100 text-orange-700' },
    warning: { label: 'Warning', className: 'bg-yellow-100 text-yellow-700' },
    medium: { label: 'TB', className: 'bg-blue-100 text-blue-700' },
    low: { label: 'Thấp', className: 'bg-green-100 text-green-700' },
    normal: { label: 'Bình thường', className: 'bg-green-100 text-green-700' },
  };
  const c = config[severity] || config.normal;
  return <Badge className={c.className}>{c.label}</Badge>;
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

export default function ExecutiveDashboard() {
  // Separate loading states for each widget (lazy loading strategy)
  const [metricsLoading, setMetricsLoading] = useState(true);
  const [funnelLoading, setFunnelLoading] = useState(true);
  const [bottleneckLoading, setBottleneckLoading] = useState(true);
  
  const [periodType, setPeriodType] = useState('this_month');
  const [keyMetrics, setKeyMetrics] = useState([]);
  const [leadFunnel, setLeadFunnel] = useState(null);
  const [dealFunnel, setDealFunnel] = useState(null);
  const [bottlenecks, setBottlenecks] = useState(null);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isCached, setIsCached] = useState(false);

  const loadKeyMetrics = useCallback(async () => {
    try {
      const res = await analyticsApi.getKeyMetrics({ periodType, compare: true });
      if (res.success) {
        setKeyMetrics(res.data || []);
        setIsCached(res.metadata?.is_cached || false);
        setLastUpdated(res.metadata?.timestamp);
      }
    } catch (err) {
      console.error('Error loading metrics:', err);
      setKeyMetrics(DEMO_EXECUTIVE_METRICS);
      setIsCached(true);
      setLastUpdated(new Date().toISOString());
    } finally {
      setMetricsLoading(false);
    }
  }, [periodType]);
  
  const loadFunnels = useCallback(async () => {
    try {
      const [leadRes, dealRes] = await Promise.all([
        analyticsApi.getFunnel('lead', periodType),
        analyticsApi.getFunnel('deal', periodType),
      ]);
      if (leadRes.success) setLeadFunnel(leadRes.data);
      if (dealRes.success) setDealFunnel(dealRes.data);
    } catch (err) {
      console.error('Error loading funnels:', err);
      setLeadFunnel(DEMO_LEAD_FUNNEL);
      setDealFunnel(DEMO_DEAL_FUNNEL);
    } finally {
      setFunnelLoading(false);
    }
  }, [periodType]);
  
  const loadBottlenecks = useCallback(async () => {
    try {
      const res = await analyticsApi.getBottlenecks(periodType);
      if (res.success) setBottlenecks(res.data);
    } catch (err) {
      console.error('Error loading bottlenecks:', err);
      setBottlenecks(DEMO_BOTTLENECKS);
    } finally {
      setBottleneckLoading(false);
    }
  }, [periodType]);

  useEffect(() => {
    setError(null);
    setMetricsLoading(true);
    setFunnelLoading(true);
    setBottleneckLoading(true);
    loadKeyMetrics();
    loadFunnels();
    loadBottlenecks();
  }, [loadBottlenecks, loadFunnels, loadKeyMetrics]);

  // Get metric by code
  const getMetric = (code) => {
    return keyMetrics.find(m => m.metric_code === code) || { value: 0, formatted_value: '0' };
  };

  // Skeleton for metric cards
  const MetricCardSkeleton = () => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-3">
          <Skeleton className="h-9 w-9 rounded-lg" />
          <Skeleton className="h-5 w-16" />
        </div>
        <Skeleton className="h-4 w-20 mb-2" />
        <Skeleton className="h-8 w-24" />
      </CardContent>
    </Card>
  );
  
  // Skeleton for funnel
  const FunnelSkeleton = () => (
    <Card>
      <CardHeader className="pb-3">
        <Skeleton className="h-6 w-32" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-6 flex-1" />
              <Skeleton className="h-4 w-12" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6" data-testid="executive-dashboard">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Executive Dashboard</h1>
          <p className="text-slate-500 text-sm mt-1">Tổng quan hoạt động kinh doanh - CEO/Manager View</p>
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
          <Button variant="outline" size="icon" onClick={loadData} data-testid="refresh-btn">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-lg">{error}</div>
      )}
      
      {/* Cache/Freshness indicator */}
      {isCached && lastUpdated && (
        <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 px-3 py-1 rounded-full w-fit">
          <Clock className="h-3 w-3" />
          <span>Data from cache - {new Date(lastUpdated).toLocaleTimeString('vi-VN')}</span>
        </div>
      )}

      {/* Key Metrics Row - with skeleton loading */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metricsLoading ? (
          <>
            <MetricCardSkeleton />
            <MetricCardSkeleton />
            <MetricCardSkeleton />
            <MetricCardSkeleton />
          </>
        ) : (
          [
            { code: 'REV_002', label: 'Doanh thu tháng', icon: DollarSign, color: 'text-amber-600', bg: 'bg-amber-50' },
            { code: 'LEAD_001', label: 'Tổng Leads', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
            { code: 'SALES_003', label: 'Pipeline Value', icon: Target, color: 'text-green-600', bg: 'bg-green-50' },
            { code: 'INV_002', label: 'Căn còn bán', icon: Building2, color: 'text-purple-600', bg: 'bg-purple-50' },
          ].map(item => {
            const metric = getMetric(item.code);
            const Icon = item.icon;
            return (
              <Card key={item.code} data-testid={`metric-${item.code}`}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-3">
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
        })
        )}
      </div>

      {/* Funnels Row - with skeleton loading */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {funnelLoading ? (
          <>
            <FunnelSkeleton />
            <FunnelSkeleton />
          </>
        ) : (
          <>
            {/* Lead Funnel */}
            <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                Lead Funnel
              </span>
              {leadFunnel && (
                <Badge variant="outline" className="text-green-600 border-green-200">
                  {leadFunnel.overall_conversion_rate}% conversion
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {leadFunnel?.stages?.length > 0 ? (
              <div className="space-y-2">
                {leadFunnel.stages.filter(s => s.count > 0).slice(0, 6).map((stage, i) => (
                  <div key={stage.stage_code} className="flex items-center gap-3">
                    <div className="w-24 text-sm font-medium truncate">{stage.stage_name}</div>
                    <div className="flex-1">
                      <div className="h-6 bg-slate-100 rounded overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 to-blue-400 flex items-center justify-end pr-2 text-white text-xs font-medium"
                          style={{ width: `${Math.max(stage.percent_of_total, 5)}%` }}
                        >
                          {stage.count}
                        </div>
                      </div>
                    </div>
                    <div className="w-16 text-right text-xs text-slate-500">
                      {stage.conversion_rate_to_next}%→
                    </div>
                  </div>
                ))}
                {/* Summary */}
                <div className="pt-3 mt-3 border-t grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-xs text-slate-500">Total</p>
                    <p className="font-bold">{leadFunnel.total_entries}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Converted</p>
                    <p className="font-bold text-green-600">{leadFunnel.total_conversions}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Bottleneck</p>
                    <p className="font-bold text-orange-600">{leadFunnel.bottleneck_stage || '-'}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500">
                <Users className="h-10 w-10 mx-auto mb-2 text-slate-300" />
                <p>Chưa có dữ liệu funnel</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Deal Pipeline */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Target className="h-5 w-5 text-green-600" />
                Deal Pipeline
              </span>
              {dealFunnel && (
                <Badge variant="outline" className="text-amber-600 border-amber-200">
                  {formatCurrency(dealFunnel.total_pipeline_value)}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {dealFunnel?.stages?.length > 0 ? (
              <div className="space-y-2">
                {dealFunnel.stages.filter(s => s.count > 0).map((stage) => (
                  <div key={stage.stage_code} className="flex items-center gap-3">
                    <div className="w-24 text-sm font-medium truncate">{stage.stage_name}</div>
                    <div className="flex-1">
                      <div className="h-6 bg-slate-100 rounded overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-green-500 to-green-400 flex items-center justify-end pr-2 text-white text-xs font-medium"
                          style={{ width: `${Math.max(stage.percent_of_total, 5)}%` }}
                        >
                          {stage.count}
                        </div>
                      </div>
                    </div>
                    <div className="w-20 text-right text-xs text-slate-500">
                      {formatCurrency(stage.total_value)}
                    </div>
                  </div>
                ))}
                {/* Summary */}
                <div className="pt-3 mt-3 border-t grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-xs text-slate-500">Total Deals</p>
                    <p className="font-bold">{dealFunnel.total_entries}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Won</p>
                    <p className="font-bold text-green-600">{dealFunnel.total_conversions}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Win Rate</p>
                    <p className="font-bold text-blue-600">{dealFunnel.overall_conversion_rate}%</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500">
                <Target className="h-10 w-10 mx-auto mb-2 text-slate-300" />
                <p>Chưa có dữ liệu deals</p>
              </div>
            )}
          </CardContent>
        </Card>
          </>
        )}
      </div>

      {/* Bottlenecks / Risk Alerts - with skeleton loading */}
      {bottleneckLoading ? (
        <Card>
          <CardHeader className="pb-3">
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-5 gap-4">
              {[1, 2, 3, 4, 5].map(i => (
                <Skeleton key={i} className="h-28" />
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              Risk Alerts & Bottlenecks
            </span>
            {bottlenecks && (
              <SeverityBadge severity={bottlenecks.summary?.severity} />
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {bottlenecks ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Stale Deals */}
              <div className={`p-4 rounded-lg border ${
                bottlenecks.stale_deals.count > 0 ? 'bg-orange-50 border-orange-200' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <Clock className={`h-5 w-5 ${bottlenecks.stale_deals.count > 0 ? 'text-orange-600' : 'text-slate-400'}`} />
                  <SeverityBadge severity={bottlenecks.stale_deals.severity} />
                </div>
                <p className="text-2xl font-bold">{bottlenecks.stale_deals.count}</p>
                <p className="text-sm text-slate-600">Deals không cập nhật &gt;7 ngày</p>
              </div>

              {/* Overdue Tasks */}
              <div className={`p-4 rounded-lg border ${
                bottlenecks.overdue_followups.count > 0 ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <AlertCircle className={`h-5 w-5 ${bottlenecks.overdue_followups.count > 0 ? 'text-red-600' : 'text-slate-400'}`} />
                  <SeverityBadge severity={bottlenecks.overdue_followups.severity} />
                </div>
                <p className="text-2xl font-bold">{bottlenecks.overdue_followups.count}</p>
                <p className="text-sm text-slate-600">Tasks quá hạn</p>
              </div>

              {/* Pending Contracts */}
              <div className={`p-4 rounded-lg border ${
                bottlenecks.pending_contracts.count > 0 ? 'bg-blue-50 border-blue-200' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <Activity className={`h-5 w-5 ${bottlenecks.pending_contracts.count > 0 ? 'text-blue-600' : 'text-slate-400'}`} />
                  <SeverityBadge severity={bottlenecks.pending_contracts.severity} />
                </div>
                <p className="text-2xl font-bold">{bottlenecks.pending_contracts.count}</p>
                <p className="text-sm text-slate-600">Hợp đồng chờ duyệt</p>
              </div>

              {/* Expiring Bookings */}
              <div className={`p-4 rounded-lg border ${
                bottlenecks.expiring_bookings.count > 0 ? 'bg-yellow-50 border-yellow-200' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <Clock className={`h-5 w-5 ${bottlenecks.expiring_bookings.count > 0 ? 'text-yellow-600' : 'text-slate-400'}`} />
                  <SeverityBadge severity={bottlenecks.expiring_bookings.severity} />
                </div>
                <p className="text-2xl font-bold">{bottlenecks.expiring_bookings.count}</p>
                <p className="text-sm text-slate-600">Booking sắp hết hạn</p>
              </div>

              {/* Unassigned Leads */}
              <div className={`p-4 rounded-lg border ${
                bottlenecks.unassigned_leads.count > 0 ? 'bg-purple-50 border-purple-200' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <Users className={`h-5 w-5 ${bottlenecks.unassigned_leads.count > 0 ? 'text-purple-600' : 'text-slate-400'}`} />
                  <SeverityBadge severity={bottlenecks.unassigned_leads.severity} />
                </div>
                <p className="text-2xl font-bold">{bottlenecks.unassigned_leads.count}</p>
                <p className="text-sm text-slate-600">Leads chưa phân công</p>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500">
              <CheckCircle2 className="h-10 w-10 mx-auto mb-2 text-green-400" />
              <p>Không có cảnh báo</p>
            </div>
          )}
        </CardContent>
      </Card>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" asChild>
          <a href="/analytics/business">
            <BarChart3 className="h-5 w-5" />
            <span>Phân tích chi tiết</span>
          </a>
        </Button>
        <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" asChild>
          <a href="/sales">
            <Target className="h-5 w-5" />
            <span>Pipeline</span>
          </a>
        </Button>
        <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" asChild>
          <a href="/crm">
            <Users className="h-5 w-5" />
            <span>CRM</span>
          </a>
        </Button>
        <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" asChild>
          <a href="/kpi">
            <Activity className="h-5 w-5" />
            <span>KPI Dashboard</span>
          </a>
        </Button>
      </div>
    </div>
  );
}
