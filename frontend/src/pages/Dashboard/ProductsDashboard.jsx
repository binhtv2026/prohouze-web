import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Building2,
  Home,
  Package,
  TrendingUp,
  Layers,
  CheckCircle2,
} from 'lucide-react';

export default function ProductsDashboard() {
  const { token, user } = useAuth();

  const formatCurrency = (value) => {
    if (value >= 1000000000) return `${(value / 1000000000).toFixed(1)} tỷ`;
    if (value >= 1000000) return `${(value / 1000000).toFixed(0)} tr`;
    return new Intl.NumberFormat('vi-VN').format(value);
  };

  return (
    <div className="space-y-6" data-testid="products-dashboard">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard Sản phẩm</h1>
        <p className="text-slate-500 text-sm mt-1">Tổng quan quỹ hàng và sản phẩm BĐS</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-blue-50 border-blue-100">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <Building2 className="h-6 w-6 text-blue-600" />
              <div>
                <p className="text-xs text-blue-600">Dự án</p>
                <p className="text-2xl font-bold text-blue-700">12</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-green-50 border-green-100">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <Home className="h-6 w-6 text-green-600" />
              <div>
                <p className="text-xs text-green-600">Sản phẩm còn</p>
                <p className="text-2xl font-bold text-green-700">245</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-amber-50 border-amber-100">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-6 w-6 text-amber-600" />
              <div>
                <p className="text-xs text-amber-600">Đã bán</p>
                <p className="text-2xl font-bold text-amber-700">89</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-purple-50 border-purple-100">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-6 w-6 text-purple-600" />
              <div>
                <p className="text-xs text-purple-600">Giá TB</p>
                <p className="text-2xl font-bold text-purple-700">3.5 tỷ</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Projects Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Dự án đang mở bán</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { name: 'Nobu Residences Danang', units: 264, sold: 12, price: 'Liên hệ (cam kết 6%/năm)' },
              { name: 'Sun Symphony Residence', units: 1373, sold: 45, price: 'Liên hệ (CK 9.5%)' },
            ].map((project, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div>
                  <p className="font-medium">{project.name}</p>
                  <p className="text-xs text-slate-500">Còn {project.units - project.sold}/{project.units} căn | Giá từ {project.price}</p>
                </div>
                <div className="w-24">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-500">Đã bán</span>
                    <span className="font-medium">{Math.round(project.sold / project.units * 100)}%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div
                      className="h-2 rounded-full bg-green-500"
                      style={{ width: `${(project.sold / project.units) * 100}%` }}
                    />
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
