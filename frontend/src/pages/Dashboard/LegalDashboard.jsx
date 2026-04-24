import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Scale,
  FileCheck,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileText,
  TrendingUp,
} from 'lucide-react';

export default function LegalDashboard() {
  const { token, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total_contracts: 0,
    active_contracts: 0,
    expiring_soon: 0,
    licenses_count: 0,
    compliance_rate: 95,
    pending_reviews: 0,
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(false);
    // Mock data for demo
    setStats({
      total_contracts: 45,
      active_contracts: 38,
      expiring_soon: 5,
      licenses_count: 12,
      compliance_rate: 96,
      pending_reviews: 3,
    });
  };

  return (
    <div className="space-y-6" data-testid="legal-dashboard">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard Pháp lý</h1>
        <p className="text-slate-500 text-sm mt-1">Tổng quan pháp lý doanh nghiệp</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="bg-blue-50 border-blue-100">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <FileText className="h-6 w-6 text-blue-600" />
              <div>
                <p className="text-xs text-blue-600">Tổng hợp đồng</p>
                <p className="text-2xl font-bold text-blue-700">{stats.total_contracts}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-green-50 border-green-100">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
              <div>
                <p className="text-xs text-green-600">Còn hiệu lực</p>
                <p className="text-2xl font-bold text-green-700">{stats.active_contracts}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-amber-50 border-amber-100">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <Clock className="h-6 w-6 text-amber-600" />
              <div>
                <p className="text-xs text-amber-600">Sắp hết hạn</p>
                <p className="text-2xl font-bold text-amber-700">{stats.expiring_soon}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-purple-50 border-purple-100">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <FileCheck className="h-6 w-6 text-purple-600" />
              <div>
                <p className="text-xs text-purple-600">Giấy phép</p>
                <p className="text-2xl font-bold text-purple-700">{stats.licenses_count}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-teal-50 border-teal-100">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-6 w-6 text-teal-600" />
              <div>
                <p className="text-xs text-teal-600">Tuân thủ</p>
                <p className="text-2xl font-bold text-teal-700">{stats.compliance_rate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-red-50 border-red-100">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-red-600" />
              <div>
                <p className="text-xs text-red-600">Cần xem xét</p>
                <p className="text-2xl font-bold text-red-700">{stats.pending_reviews}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              Hợp đồng sắp hết hạn
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { name: 'HĐ Thuê văn phòng Q1', expiry: '15/02/2026', days: 5 },
                { name: 'HĐ Dịch vụ CNTT', expiry: '20/02/2026', days: 10 },
                { name: 'HĐ Bảo hiểm tài sản', expiry: '28/02/2026', days: 18 },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div>
                    <p className="font-medium text-sm">{item.name}</p>
                    <p className="text-xs text-slate-500">Hết hạn: {item.expiry}</p>
                  </div>
                  <Badge variant={item.days <= 7 ? 'destructive' : 'secondary'}>
                    {item.days} ngày
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-green-600" />
              Tuân thủ pháp lý
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { name: 'Luật Kinh doanh BĐS', status: 'compliant', score: 100 },
                { name: 'Quy định PCCC', status: 'compliant', score: 95 },
                { name: 'Bảo vệ dữ liệu cá nhân', status: 'warning', score: 85 },
                { name: 'Thuế & Kế toán', status: 'compliant', score: 98 },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    {item.status === 'compliant' ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                    )}
                    <p className="font-medium text-sm">{item.name}</p>
                  </div>
                  <Badge className={item.status === 'compliant' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}>
                    {item.score}%
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
