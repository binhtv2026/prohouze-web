import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Globe,
  TrendingUp,
  TrendingDown,
  Building2,
  MapPin,
  BarChart3,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';

export default function MarketPage() {
  const [region, setRegion] = useState('all');

  return (
    <div className="space-y-6" data-testid="market-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Phân tích thị trường</h1>
          <p className="text-slate-500 text-sm mt-1">Dữ liệu và xu hướng thị trường BĐS</p>
        </div>
        <Select value={region} onValueChange={setRegion}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Chọn khu vực" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toàn quốc</SelectItem>
            <SelectItem value="hcm">TP. Hồ Chí Minh</SelectItem>
            <SelectItem value="hanoi">Hà Nội</SelectItem>
            <SelectItem value="danang">Đà Nẵng</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Market Overview */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="bg-blue-50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <Building2 className="h-6 w-6 text-blue-600" />
              <div>
                <p className="text-xs text-blue-600">Giao dịch Q4/2025</p>
                <p className="text-2xl font-bold text-blue-700">12,450</p>
                <p className="text-xs text-green-600 flex items-center">
                  <ArrowUp className="h-3 w-3" /> +15.2%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-green-50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-6 w-6 text-green-600" />
              <div>
                <p className="text-xs text-green-600">Giá TB căn hộ</p>
                <p className="text-2xl font-bold text-green-700">68 tr/m²</p>
                <p className="text-xs text-green-600 flex items-center">
                  <ArrowUp className="h-3 w-3" /> +8.5%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-amber-50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <BarChart3 className="h-6 w-6 text-amber-600" />
              <div>
                <p className="text-xs text-amber-600">Nguồn cung mới</p>
                <p className="text-2xl font-bold text-amber-700">8,200</p>
                <p className="text-xs text-red-600 flex items-center">
                  <ArrowDown className="h-3 w-3" /> -5.3%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-purple-50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <Globe className="h-6 w-6 text-purple-600" />
              <div>
                <p className="text-xs text-purple-600">Tỷ lệ hấp thụ</p>
                <p className="text-2xl font-bold text-purple-700">72%</p>
                <p className="text-xs text-green-600 flex items-center">
                  <ArrowUp className="h-3 w-3" /> +3.2%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Price by Region */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-blue-600" />
            Giá BĐS theo khu vực
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { region: 'Quận 1, TP.HCM', apartment: '150 tr/m²', villa: '350 tr/m²', land: '800 tr/m²', trend: 'up', change: 12.5 },
              { region: 'Quận 2, TP.HCM', apartment: '85 tr/m²', villa: '180 tr/m²', land: '250 tr/m²', trend: 'up', change: 15.2 },
              { region: 'Quận 7, TP.HCM', apartment: '65 tr/m²', villa: '150 tr/m²', land: '180 tr/m²', trend: 'up', change: 8.3 },
              { region: 'Thủ Đức, TP.HCM', apartment: '55 tr/m²', villa: '120 tr/m²', land: '95 tr/m²', trend: 'up', change: 18.5 },
              { region: 'Bình Dương', apartment: '32 tr/m²', villa: '65 tr/m²', land: '45 tr/m²', trend: 'down', change: -2.1 },
              { region: 'Long An', apartment: '25 tr/m²', villa: '45 tr/m²', land: '18 tr/m²', trend: 'stable', change: 1.2 },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-slate-400" />
                  <div>
                    <p className="font-semibold">{item.region}</p>
                    <div className="flex gap-4 text-xs text-slate-500 mt-1">
                      <span>Căn hộ: {item.apartment}</span>
                      <span>Biệt thự: {item.villa}</span>
                      <span>Đất: {item.land}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {item.trend === 'up' ? (
                    <TrendingUp className="h-4 w-4 text-green-500" />
                  ) : item.trend === 'down' ? (
                    <TrendingDown className="h-4 w-4 text-red-500" />
                  ) : (
                    <BarChart3 className="h-4 w-4 text-blue-500" />
                  )}
                  <Badge className={
                    item.trend === 'up' ? 'bg-green-100 text-green-700' :
                    item.trend === 'down' ? 'bg-red-100 text-red-700' :
                    'bg-blue-100 text-blue-700'
                  }>
                    {item.change > 0 ? '+' : ''}{item.change}%
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Market Segments */}
      <Card>
        <CardHeader>
          <CardTitle>Phân khúc thị trường</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { segment: 'Cao cấp (> 5 tỷ)', share: 25, growth: 18.5, trend: 'up' },
              { segment: 'Trung cấp (2-5 tỷ)', share: 45, growth: 12.3, trend: 'up' },
              { segment: 'Bình dân (< 2 tỷ)', share: 30, growth: 5.2, trend: 'stable' },
            ].map((item, i) => (
              <div key={i} className="p-4 bg-slate-50 rounded-xl">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold">{item.segment}</h3>
                  {item.trend === 'up' ? (
                    <TrendingUp className="h-5 w-5 text-green-500" />
                  ) : (
                    <BarChart3 className="h-5 w-5 text-blue-500" />
                  )}
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Thị phần</span>
                    <span className="font-medium">{item.share}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Tăng trưởng</span>
                    <span className="font-medium text-green-600">+{item.growth}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
