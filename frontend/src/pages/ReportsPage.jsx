import React, { useState, useEffect, useCallback } from 'react';
import Header from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { reportsAPI, dashboardAPI } from '@/lib/api';
import { formatCurrency, formatNumber, getSourceLabel } from '@/lib/utils';
import { toast } from 'sonner';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { TrendingUp, TrendingDown, Target, Users } from 'lucide-react';

const COLORS = ['#316585', '#10b981', '#f59e0b', '#e11d48', '#8b5cf6', '#06b6d4'];

const DEMO_CONVERSION_BY_PERIOD = {
  month: { total_leads: 248, closed_won: 18, conversion_rate: 7.3, loss_rate: 21.4 },
  quarter: { total_leads: 716, closed_won: 49, conversion_rate: 6.8, loss_rate: 23.1 },
  year: { total_leads: 2840, closed_won: 201, conversion_rate: 7.1, loss_rate: 20.8 },
};

const DEMO_FUNNEL = {
  new: 82,
  contacted: 61,
  warm: 37,
  hot: 23,
  qualified: 16,
  negotiation: 10,
  closed_won: 6,
};

const DEMO_SOURCES = [
  { source: 'facebook', count: 86 },
  { source: 'zalo', count: 54 },
  { source: 'tiktok', count: 39 },
  { source: 'website', count: 31 },
  { source: 'referral', count: 22 },
  { source: 'event', count: 16 },
];

export default function ReportsPage() {
  const [period, setPeriod] = useState('month');
  const [conversionData, setConversionData] = useState(null);
  const [funnel, setFunnel] = useState(null);
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadReports = useCallback(async () => {
    setLoading(true);
    try {
      const [convRes, funnelRes, sourcesRes] = await Promise.all([
        reportsAPI.getConversion(period),
        dashboardAPI.getLeadFunnel(),
        dashboardAPI.getLeadSources(),
      ]);
      setConversionData(convRes?.data || DEMO_CONVERSION_BY_PERIOD[period]);
      setFunnel(funnelRes?.data || DEMO_FUNNEL);
      setSources(Array.isArray(sourcesRes?.data) && sourcesRes.data.length > 0 ? sourcesRes.data : DEMO_SOURCES);
    } catch (error) {
      setConversionData(DEMO_CONVERSION_BY_PERIOD[period]);
      setFunnel(DEMO_FUNNEL);
      setSources(DEMO_SOURCES);
      toast.error('Không thể tải báo cáo');
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const funnelChartData = funnel ? [
    { name: 'Mới', value: funnel.new },
    { name: 'Đã liên hệ', value: funnel.contacted },
    { name: 'Ấm', value: funnel.warm },
    { name: 'Nóng', value: funnel.hot },
    { name: 'Đủ ĐK', value: funnel.qualified },
    { name: 'Đàm phán', value: funnel.negotiation },
    { name: 'Thành công', value: funnel.closed_won },
  ] : [];

  return (
    <div className="min-h-screen bg-slate-50" data-testid="reports-page">
      <Header title="Báo cáo & Phân tích" />

      <div className="p-6 max-w-[1600px] mx-auto">
        {/* Period Selector */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-slate-900">Tổng quan hiệu suất</h2>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-40" data-testid="period-selector">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">Tháng này</SelectItem>
              <SelectItem value="quarter">Quý này</SelectItem>
              <SelectItem value="year">Năm này</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-[#316585]/30 border-t-[#316585] rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Conversion Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card className="bg-white border border-slate-200">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-wider font-bold text-slate-500">Tổng Lead</p>
                      <p className="text-3xl font-bold text-slate-900 mt-1">
                        {formatNumber(conversionData?.total_leads || 0)}
                      </p>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-[#316585]/10 flex items-center justify-center">
                      <Users className="w-6 h-6 text-[#316585]" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white border border-slate-200">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-wider font-bold text-slate-500">Chốt thành công</p>
                      <p className="text-3xl font-bold text-green-600 mt-1">
                        {formatNumber(conversionData?.closed_won || 0)}
                      </p>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                      <Target className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white border border-slate-200">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-wider font-bold text-slate-500">Tỷ lệ chuyển đổi</p>
                      <p className="text-3xl font-bold text-[#316585] mt-1">
                        {conversionData?.conversion_rate || 0}%
                      </p>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white border border-slate-200">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-wider font-bold text-slate-500">Tỷ lệ mất</p>
                      <p className="text-3xl font-bold text-red-600 mt-1">
                        {conversionData?.loss_rate || 0}%
                      </p>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
                      <TrendingDown className="w-6 h-6 text-red-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Funnel Chart */}
              <Card className="bg-white border border-slate-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-bold text-slate-900">Phễu chuyển đổi Lead</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={funnelChartData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis type="number" tick={{ fill: '#64748b', fontSize: 12 }} />
                        <YAxis dataKey="name" type="category" tick={{ fill: '#64748b', fontSize: 12 }} width={80} />
                        <Tooltip
                          contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                        />
                        <Bar dataKey="value" fill="#316585" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Sources Pie */}
              <Card className="bg-white border border-slate-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-bold text-slate-900">Phân bổ nguồn Lead</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] flex items-center">
                    <ResponsiveContainer width="60%" height="100%">
                      <PieChart>
                        <Pie
                          data={sources}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={2}
                          dataKey="count"
                          nameKey="source"
                        >
                          {sources.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value, name) => [value, getSourceLabel(name)]}
                          contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="w-[40%] space-y-2">
                      {sources.map((source, index) => (
                        <div key={source.source} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: COLORS[index % COLORS.length] }}
                            />
                            <span className="text-sm text-slate-600">{getSourceLabel(source.source)}</span>
                          </div>
                          <span className="text-sm font-medium text-slate-900">{source.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Conversion Rate by Source */}
            <Card className="bg-white border border-slate-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-bold text-slate-900">Hiệu suất theo nguồn</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {sources.map((source, index) => {
                    const percentage = conversionData?.total_leads > 0 
                      ? ((source.count / conversionData.total_leads) * 100).toFixed(1)
                      : 0;
                    return (
                      <div key={source.source} className="flex items-center gap-4">
                        <div className="w-24 text-sm font-medium text-slate-700">
                          {getSourceLabel(source.source)}
                        </div>
                        <div className="flex-1 h-8 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${percentage}%`,
                              backgroundColor: COLORS[index % COLORS.length]
                            }}
                          />
                        </div>
                        <div className="w-20 text-right">
                          <span className="text-sm font-bold text-slate-900">{source.count}</span>
                          <span className="text-xs text-slate-500 ml-1">({percentage}%)</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
