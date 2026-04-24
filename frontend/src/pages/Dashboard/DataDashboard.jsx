import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  BarChart3,
  PieChart,
  TrendingUp,
  TrendingDown,
  Database,
  Globe,
  Users,
  Building2,
  DollarSign,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';

export default function DataDashboard() {
  const { token, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total_leads: 1250,
    total_customers: 340,
    total_deals: 89,
    total_revenue: 45600000000,
    market_growth: 12.5,
    conversion_rate: 27.2,
  });

  useEffect(() => {
    setLoading(false);
  }, []);

  const formatCurrency = (value) => {
    if (value >= 1000000000) return `${(value / 1000000000).toFixed(1)} tỷ`;
    if (value >= 1000000) return `${(value / 1000000).toFixed(0)} tr`;
    return new Intl.NumberFormat('vi-VN').format(value);
  };

  return (
    <div className="space-y-6" data-testid="data-dashboard">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dữ liệu & Phân tích</h1>
        <p className="text-slate-500 text-sm mt-1">Tổng hợp dữ liệu và phân tích thị trường</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="bg-blue-50 border-blue-100">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <Users className="h-6 w-6 text-blue-600" />
              <div>
                <p className="text-xs text-blue-600">Tổng Lead</p>
                <p className="text-2xl font-bold text-blue-700">{stats.total_leads.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-green-50 border-green-100">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <Users className="h-6 w-6 text-green-600" />
              <div>
                <p className="text-xs text-green-600">Khách hàng</p>
                <p className="text-2xl font-bold text-green-700">{stats.total_customers}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-purple-50 border-purple-100">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <Building2 className="h-6 w-6 text-purple-600" />
              <div>
                <p className="text-xs text-purple-600">Deals</p>
                <p className="text-2xl font-bold text-purple-700">{stats.total_deals}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-amber-50 border-amber-100">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <DollarSign className="h-6 w-6 text-amber-600" />
              <div>
                <p className="text-xs text-amber-600">Doanh thu</p>
                <p className="text-2xl font-bold text-amber-700">{formatCurrency(stats.total_revenue)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-teal-50 border-teal-100">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-6 w-6 text-teal-600" />
              <div>
                <p className="text-xs text-teal-600">Tăng trưởng TT</p>
                <p className="text-2xl font-bold text-teal-700">+{stats.market_growth}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-indigo-50 border-indigo-100">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <PieChart className="h-6 w-6 text-indigo-600" />
              <div>
                <p className="text-xs text-indigo-600">Tỷ lệ chuyển đổi</p>
                <p className="text-2xl font-bold text-indigo-700">{stats.conversion_rate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts & Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-blue-600" />
              Phân tích thị trường BĐS
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { region: 'TP. Hồ Chí Minh', growth: 15.2, trend: 'up', price: '85 tr/m²' },
                { region: 'Hà Nội', growth: 12.8, trend: 'up', price: '78 tr/m²' },
                { region: 'Đà Nẵng', growth: 8.5, trend: 'up', price: '45 tr/m²' },
                { region: 'Bình Dương', growth: 18.3, trend: 'up', price: '35 tr/m²' },
                { region: 'Long An', growth: -2.1, trend: 'down', price: '18 tr/m²' },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div>
                    <p className="font-medium">{item.region}</p>
                    <p className="text-xs text-slate-500">Giá TB: {item.price}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {item.trend === 'up' ? (
                      <ArrowUp className="h-4 w-4 text-green-500" />
                    ) : (
                      <ArrowDown className="h-4 w-4 text-red-500" />
                    )}
                    <Badge className={item.trend === 'up' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                      {item.growth > 0 ? '+' : ''}{item.growth}%
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-purple-600" />
              Hiệu suất kinh doanh
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { metric: 'Tỷ lệ chốt deal', value: 27.2, target: 30, status: 'warning' },
                { metric: 'Thời gian chốt TB', value: 45, target: 60, status: 'good', unit: 'ngày' },
                { metric: 'Lead → Khách hàng', value: 18.5, target: 20, status: 'warning' },
                { metric: 'CSAT Score', value: 4.5, target: 4.0, status: 'good', unit: '/5' },
                { metric: 'NPS Score', value: 65, target: 50, status: 'good' },
              ].map((item, i) => (
                <div key={i} className="p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium text-sm">{item.metric}</p>
                    <Badge className={item.status === 'good' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}>
                      {item.value}{item.unit || '%'}
                    </Badge>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${item.status === 'good' ? 'bg-green-500' : 'bg-amber-500'}`}
                      style={{ width: `${Math.min((item.value / item.target) * 100, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Mục tiêu: {item.target}{item.unit || '%'}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Trend Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            Xu hướng thị trường BĐS 2026
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                title: 'Căn hộ cao cấp',
                trend: 'up',
                description: 'Nhu cầu tăng mạnh tại các đô thị lớn, đặc biệt phân khúc 3-5 tỷ',
                growth: '+15%',
              },
              {
                title: 'Nhà phố liền kề',
                trend: 'stable',
                description: 'Ổn định, phù hợp gia đình trẻ, giá từ 4-8 tỷ',
                growth: '+5%',
              },
              {
                title: 'BĐS nghỉ dưỡng',
                trend: 'down',
                description: 'Giảm nhẹ do bão hòa nguồn cung tại các vùng ven biển',
                growth: '-3%',
              },
            ].map((item, i) => (
              <div key={i} className="p-4 bg-slate-50 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  {item.trend === 'up' && <TrendingUp className="h-5 w-5 text-green-500" />}
                  {item.trend === 'stable' && <BarChart3 className="h-5 w-5 text-blue-500" />}
                  {item.trend === 'down' && <TrendingDown className="h-5 w-5 text-red-500" />}
                  <h3 className="font-semibold">{item.title}</h3>
                </div>
                <p className="text-sm text-slate-600 mb-2">{item.description}</p>
                <Badge className={
                  item.trend === 'up' ? 'bg-green-100 text-green-700' :
                  item.trend === 'down' ? 'bg-red-100 text-red-700' :
                  'bg-blue-100 text-blue-700'
                }>
                  {item.growth}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
